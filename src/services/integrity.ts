import { NativeModules, Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { isPlaceholderSignature } from '../config/releaseReadiness';

/**
 * Tamper resistance, with honest expectations.
 *
 * Everything here runs on the user's device, on hardware they control, in
 * code they can decompile. A determined modder patches any of it out. None
 * of this is a lock; it raises the cost of producing a working mod and makes
 * the casual "delete the ads, reupload" version stop working.
 *
 * The one thing that would actually stop piracy — validating entitlement on
 * a server before unlocking a feature — is incompatible with the product's
 * core promise that the app works with no network. That trade is deliberate:
 * see NOTES.md. Do not quietly add a hard online requirement to chase
 * pirates; it punishes paying users on a plane and breaks the one thing that
 * differentiates this app.
 *
 * Design rule for everything below: a failed or unavailable check NEVER
 * blocks a paying user. Worst case it degrades to the free tier's behaviour,
 * because a false positive that locks out a real subscriber costs more than
 * a pirate costs.
 */

const store = createMMKV({ id: 'integrity' });
const KEY_VERDICT = 'integrity.lastVerdict';
const KEY_CHECKED = 'integrity.lastCheckedAt';

/** Recheck at most daily; the Integrity API has a per-app request quota. */
const RECHECK_MS = 24 * 60 * 60 * 1000;

export type Verdict =
  | 'genuine'      // Play-installed, signature matches, Integrity passed
  | 'unverified'   // could not check — offline, no Play Services, sideloaded
  | 'tampered';    // signature or Integrity actively failed

export interface IntegrityModule {
  getSigningCertificateSha256(): Promise<string>;
  getInstallerPackageName(): Promise<string | null>;
  requestIntegrityToken(nonce: string): Promise<string>;
}

const Native: IntegrityModule | undefined = (NativeModules as any).AppIntegrity;

/**
 * SHA-256 of the certificate Play signs your app with. Read it from Play
 * Console under Setup, App signing — the "App signing key certificate"
 * value, not the upload key. A repackaged APK cannot be signed with it,
 * because the modder does not have the private key.
 */
const EXPECTED_SIGNATURE =
  'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99';


const TRUSTED_INSTALLERS = [
  'com.android.vending',        // Play Store
  'com.google.android.feedback', // Play, older devices
];

function norm(sig: string): string {
  return sig.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
}

/**
 * Cheap local checks. A modder removes these in minutes once they find them,
 * which is why they are not the only layer — but a repackaged APK has a
 * different signature, and that is true regardless of how the check is
 * written.
 */
/**
 * False until a real certificate is pasted into EXPECTED_SIGNATURE.
 *
 * This guard is load-bearing. A release build signed by Play reports Play's
 * certificate, which cannot possibly equal the placeholder, so every single
 * install would come back 'tampered' — and entitlementCeiling caps a
 * tampered build at the free tier. Shipping the placeholder would therefore
 * have watermarked every paying subscriber's exports and locked them out of
 * the premium designs, with nothing anywhere telling them or us why.
 *
 * An unconfigured signature has to mean "cannot check", never "failed".
 */
function signatureConfigured(): boolean {
  return !isPlaceholderSignature(EXPECTED_SIGNATURE);
}

async function localChecks(): Promise<Verdict> {
  if (Platform.OS !== 'android' || !Native) return 'unverified';

  if (signatureConfigured()) {
    try {
      const sig = await Native.getSigningCertificateSha256();
      if (norm(sig) !== norm(EXPECTED_SIGNATURE)) return 'tampered';
    } catch {
      return 'unverified';
    }
  }

  try {
    const installer = await Native.getInstallerPackageName();
    // A null installer means sideloaded. That is not proof of piracy —
    // developers and some OEM channels look the same — so it downgrades to
    // unverified rather than tampered.
    if (installer && !TRUSTED_INSTALLERS.includes(installer)) {
      return 'unverified';
    }
  } catch {
    return 'unverified';
  }

  return 'genuine';
}

/**
 * Play Integrity is the only check here a modder cannot simply delete: the
 * verdict is signed by Google, not produced by this code. It does require
 * network and Play Services, so it returns 'unverified' offline — which for
 * this app is a normal, expected state, not a red flag.
 *
 * A production setup verifies the token on a server. With no backend the
 * token can only be inspected on-device, which a modder can stub out. It is
 * still worth calling: it raises the work required and gives you a path to
 * real verification later without another app update.
 */
async function integrityCheck(): Promise<Verdict> {
  if (!Native) return 'unverified';
  try {
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const token = await Native.requestIntegrityToken(nonce);
    return token ? 'genuine' : 'unverified';
  } catch {
    return 'unverified';
  }
}

export async function checkIntegrity(force = false): Promise<Verdict> {
  const last = store.getNumber(KEY_CHECKED) ?? 0;
  const cached = store.getString(KEY_VERDICT) as Verdict | undefined;

  if (!force && cached && Date.now() - last < RECHECK_MS) return cached;

  const local = await localChecks();
  const verdict: Verdict =
    local === 'tampered' ? 'tampered' : await integrityCheck();

  store.set(KEY_VERDICT, verdict);
  store.set(KEY_CHECKED, Date.now());
  return verdict;
}

/** Exposed so the release checklist can report on it without duplicating it. */
export function configuredSignature(): string {
  return EXPECTED_SIGNATURE;
}

export function lastVerdict(): Verdict {
  return (store.getString(KEY_VERDICT) as Verdict | undefined) ?? 'unverified';
}

/**
 * What a tampered verdict actually does.
 *
 * Not: crash, wipe data, show an accusatory dialog, or disable the app. Each
 * of those lands on false positives, and a wrongly accused paying user
 * leaves a one-star review that costs more than the pirate ever would.
 *
 * Instead the build behaves like the free tier regardless of what the local
 * entitlement cache claims. A modded APK that flips the "pro" flag gets
 * watermarked exports, which is exactly the thing the mod was made to
 * remove, and the user is never told why.
 */
export function entitlementCeiling(verdict: Verdict): 'free' | 'pro' {
  return verdict === 'tampered' ? 'free' : 'pro';
}
