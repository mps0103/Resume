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
import { Plan, SKUS, normalisePlans, planKind } from './plans';

export { SKUS, SKU_MONTHLY, type Plan } from './plans';

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

function grant(_productId: string): void {
  store.set(KEY_PRO, true);
  // A generous window, corrected by Play's own check on the next launch. It
  // is used only to age out a stale offline cache, never as a source of
  // truth about whether the subscription is live.
  store.set(KEY_EXPIRY, Date.now() + 32 * 24 * 60 * 60 * 1000);
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
      // Acknowledging within three days is mandatory — Play auto-refunds
      // any purchase left unacknowledged. A subscription is never
      // consumable.
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
    const purchases = await getAvailablePurchases();
    const active = purchases?.find(p => SKUS.includes(p.productId));
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

/** There is one product, and it is a subscription. */
export async function loadPlans(): Promise<Plan[]> {
  try {
    const products = await fetchProducts({ skus: SKUS, type: 'subs' });
    return normalisePlans((products ?? []) as unknown[]);
  } catch {
    return [];
  }
}

/**
 * Starts the purchase. Takes the plan rather than a bare sku because the
 * subscription flow needs the offer token that came back with it.
 */
export async function buy(plan: Plan): Promise<void> {
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
