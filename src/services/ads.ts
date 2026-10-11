import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  AdsConsentStatus,
  InterstitialAd,
  MaxAdContentRating,
  TestIds,
} from 'react-native-google-mobile-ads';
import { LIVE_AD_UNITS, adUnitsConfigured } from '../config/adUnits';
import { testModeAvailable } from './testMode';

export { adUnitsConfigured };

/**
 * Ad placement rules, kept in one file so they cannot drift:
 *
 *  - Never inside the editor. Interrupting someone mid-form is what earns
 *    one-star reviews, and an accidental tap there loses their place.
 *  - Never on the preview screen. That is the moment the paywall has to
 *    land cleanly.
 *  - Banner only on the resume list and the template gallery.
 *  - One interstitial, after a successful export, never before.
 *  - Nothing at all for Pro.
 *
 * Google also requires ads be distinguishable from content and never placed
 * where an accidental tap is likely. Keep clearance around every banner.
 */

/**
 * Debug builds use Google's test units.
 *
 * Deliberately NOT __DEV__. This project sets debuggableVariants = [] so the
 * debug APK embeds its JS bundle and runs without Metro, and that bundle is
 * built with --dev=false — which makes __DEV__ false in a build that is
 * still very much a debug build. Gating test ads on it meant the debug APK
 * requested LIVE ad units. With the placeholders above that merely failed;
 * with real IDs pasted in it would have been self-clicking against the
 * developer's own account, which is how AdMob accounts get banned for
 * invalid traffic.
 *
 * testModeAvailable() reads BuildConfig.DEBUG from native, which is a
 * property of the build type and is compiled out of a release APK.
 */
function shouldUseTestAds(): boolean {
  return testModeAvailable();
}

/**
 * Whether to show ads at all.
 *
 * A release build with unconfigured units shows nothing rather than serving
 * test ads to real users or hammering a dead unit ID.
 */
export function adsAvailable(): boolean {
  return shouldUseTestAds() || adUnitsConfigured();
}

function adUnit(slot: keyof typeof LIVE_AD_UNITS): string {
  if (shouldUseTestAds()) {
    return slot === 'banner' ? TestIds.BANNER : TestIds.INTERSTITIAL;
  }
  return LIVE_AD_UNITS[slot];
}

export const AD_UNITS = {
  get banner() {
    return adUnit('banner');
  },
  get exportInterstitial() {
    return adUnit('exportInterstitial');
  },
};

/** Minimum gap between interstitials, regardless of how many exports run. */
const INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000;
let lastInterstitialAt = 0;
let preloaded: InterstitialAd | null = null;

/**
 * Whether this user is entitled to reopen the consent form.
 *
 * Required by Google's UMP policy for anyone in the EEA or UK: consent has
 * to be withdrawable as easily as it was given, which means a permanent
 * route to the form rather than only the one-off prompt at first launch.
 * Outside those regions no form exists and the Settings row stays hidden.
 */
let privacyOptionsRequired = false;

export function adPrivacyOptionsRequired(): boolean {
  return privacyOptionsRequired;
}

/** Reopens the consent form so a user can change or withdraw consent. */
export async function showAdPrivacyOptions(): Promise<void> {
  await AdsConsent.showPrivacyOptionsForm();
}

export async function initAds(): Promise<void> {
  if (!adsAvailable()) return;

  // EU/UK consent must be gathered before any ad request. Requesting first
  // and asking later is a policy violation.
  try {
    const info = await AdsConsent.requestInfoUpdate();
    if (info.isConsentFormAvailable && info.status === AdsConsentStatus.REQUIRED) {
      await AdsConsent.showForm();
    }
    const after = await AdsConsent.requestInfoUpdate();
    privacyOptionsRequired =
      after.privacyOptionsRequirementStatus ===
      AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch {
    // Consent SDK unreachable: fall through to non-personalised ads.
  }

  await mobileAds().setRequestConfiguration({
    // The app is usable by students, so keep the content rating tight.
    maxAdContentRating: MaxAdContentRating.G,
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
  });

  await mobileAds().initialize();
  preload();
}

function preload(): void {
  if (!adsAvailable()) return;
  preloaded = InterstitialAd.createForAdRequest(AD_UNITS.exportInterstitial, {
    requestNonPersonalizedAdsOnly: false,
  });
  preloaded.load();
}

/**
 * Shows at most one interstitial per cooldown window, and only once the
 * user's file is already saved — never gate the export behind the ad.
 */
export function showExportInterstitial(entitlement: 'free' | 'pro'): void {
  if (entitlement === 'pro') return;
  if (!adsAvailable()) return;
  if (Date.now() - lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return;

  const ad = preloaded;
  if (!ad?.loaded) {
    preload();
    return;
  }

  const done = ad.addAdEventListener(AdEventType.CLOSED, () => {
    done();
    preload();
  });

  lastInterstitialAt = Date.now();
  ad.show();
}

export function bannerEnabled(entitlement: 'free' | 'pro'): boolean {
  return entitlement === 'free' && adsAvailable();
}
