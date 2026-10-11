import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from 'react-native-iap';
import { createMMKV } from 'react-native-mmkv';
import { testEntitlement } from './testMode';
import { entitlementCeiling, lastVerdict } from './integrity';
import {
  ONE_TIME_SKUS,
  Plan,
  SKUS,
  normalisePlans,
  planKind,
} from './plans';

export {
  SKUS,
  SKU_LIFETIME,
  SKU_MONTHLY,
  type Plan,
} from './plans';

/**
 * Play Billing is the only payment path. Google requires it for digital
 * goods, and linking out to an external checkout is grounds for removal.
 * Never add a web payment link, not even in a FAQ.
 */

/**
 * Encrypted at rest. Not a real defence — the key ships in the binary and a
 * modder can read it — but it stops the trivial attack of editing the
 * storage file on a rooted device without touching the app at all.
 */
const store = createMMKV({
  id: 'billing',
  // Exactly 16 bytes. MMKV throws above that with AES-128, and this store is
  // created at module load, so an oversized key crashes the app on launch.
  encryptionKey: 'rb-ent-v1-9f2c41',
});

const KEY_PRO = 'entitlement.pro';
const KEY_EXPIRY = 'entitlement.expiresAt';
const KEY_EXPORTS = 'usage.freeExports';

export type Entitlement = 'free' | 'pro';

/**
 * Cached locally so the app works offline — the whole product promise is
 * that it works on a plane. Play is the source of truth and is reconciled
 * on every cold start via restore().
 */
export function currentEntitlement(): Entitlement {
  // Debug builds only, and checked before the integrity ceiling so that a
  // locally built APK — which is unsigned by Play and therefore always
  // "unverified" — can still exercise the Pro paths. Inert in release.
  const forced = testEntitlement();
  if (forced) return forced;

  // A tampered build is capped at free no matter what the cache says, so
  // flipping this flag in a modded APK achieves nothing on its own.
  if (entitlementCeiling(lastVerdict()) === 'free') return 'free';
  if (!store.getBoolean(KEY_PRO)) return 'free';
  const expiry = store.getNumber(KEY_EXPIRY) ?? 0;
  // Grace window: a lapsed cache should not lock someone out mid-session
  // before we have managed to reach Play.
  if (expiry && Date.now() > expiry + 3 * 24 * 60 * 60 * 1000) {
    store.set(KEY_PRO, false);
    return 'free';
  }
  return 'pro';
}

export function freeExportsUsed(): number {
  return store.getNumber(KEY_EXPORTS) ?? 0;
}

export function recordFreeExport(): void {
  store.set(KEY_EXPORTS, freeExportsUsed() + 1);
}

/**
 * Testing aid, offered only from the debug-build controls. The tally is
 * local usage state rather than an entitlement, so clearing it grants
 * nothing — it just makes the free tier testable more than three times on
 * one device.
 */
export function resetFreeExports(): void {
  store.set(KEY_EXPORTS, 0);
}

function grant(productId: string): void {
  store.set(KEY_PRO, true);
  // The lifetime purchase never lapses, so it is cached with no expiry at
  // all — zero is read below as "does not expire". For the subscription this
  // is a generous window, corrected by Play's own check on the next launch,
  // and used only to age out a stale offline cache rather than as a source
  // of truth.
  const lifetime = planKind(productId) === 'lifetime';
  store.set(KEY_EXPIRY, lifetime ? 0 : Date.now() + 32 * 24 * 60 * 60 * 1000);
}

function revoke(): void {
  store.set(KEY_PRO, false);
  store.set(KEY_EXPIRY, 0);
}

let listeners: { remove: () => void }[] = [];

export async function startBilling(
  onChange: (e: Entitlement) => void,
): Promise<void> {
  try {
    await initConnection();
  } catch {
    // No Play Services, or a sideloaded build. The app stays fully usable
    // on the free tier; it must not crash or block.
    return;
  }

  listeners.push(
    purchaseUpdatedListener(async (purchase: Purchase) => {
      if (!purchase?.purchaseToken) return;
      if (!planKind(purchase.productId)) return;
      grant(purchase.productId);
      // Acknowledging within three days is mandatory — Play auto-refunds any
      // purchase left unacknowledged. isConsumable stays false for both: the
      // lifetime product must never be consumed, or Play would forget it and
      // the user would lose what they paid for.
      await finishTransaction({ purchase, isConsumable: false });
      onChange('pro');
    }),
  );

  listeners.push(
    purchaseErrorListener(() => {
      // Cancellations are routine and get no error UI.
    }),
  );

  await restore(onChange);
}

export function stopBilling(): void {
  listeners.forEach(l => l.remove());
  listeners = [];
  endConnection().catch(() => {});
}

/** Reconciles the local cache with Play. Safe to call on every launch. */
export async function restore(
  onChange?: (e: Entitlement) => void,
): Promise<Entitlement> {
  try {
    // No argument: this must return the one-time lifetime purchase as well
    // as any live subscription, and Play keeps returning a non-consumed
    // one-time product forever, which is what makes lifetime restorable.
    const purchases = await getAvailablePurchases();
    const active =
      purchases?.find(p => ONE_TIME_SKUS.includes(p.productId)) ??
      purchases?.find(p => SKUS.includes(p.productId));
    // What Play says is written to the cache; what the app should SHOW is
    // read back out of currentEntitlement(). The two differ in exactly one
    // case: a debug build with the test override on, where Play legitimately
    // reports no purchase and pushing that raw 'free' at the UI silently
    // undid the override a moment after startup. The returned value stays
    // Play's own answer so the "Restore purchase" alert tells the truth.
    if (active) {
      grant(active.productId);
      onChange?.(currentEntitlement());
      return 'pro';
    }
    revoke();
    onChange?.(currentEntitlement());
    return 'free';
  } catch {
    // Offline. Keep whatever the cache says.
    return currentEntitlement();
  }
}

/**
 * Both products in one query. 'all' is required rather than 'subs': the
 * lifetime purchase is a one-time in-app product, and a subs-only query
 * returns nothing for it, which shows up as a paywall missing half its rows.
 */
export async function loadPlans(): Promise<Plan[]> {
  try {
    const products = await fetchProducts({ skus: SKUS, type: 'all' });
    return normalisePlans((products ?? []) as unknown[]);
  } catch {
    return [];
  }
}

/**
 * Starts a purchase. The two products take different Play flows — a
 * subscription needs its offer token, a one-time product must not be sent
 * as 'subs' at all — so the caller passes the plan rather than a bare sku.
 */
export async function buy(plan: Plan): Promise<void> {
  if (plan.kind === 'lifetime') {
    await requestPurchase({
      type: 'in-app',
      request: { google: { skus: [plan.sku] } },
    });
    return;
  }

  await requestPurchase({
    type: 'subs',
    request: {
      google: {
        skus: [plan.sku],
        ...(plan.offerToken
          ? { subscriptionOffers: [{ sku: plan.sku, offerToken: plan.offerToken }] }
          : {}),
      },
    },
  });
}
