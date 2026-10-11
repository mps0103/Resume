/**
 * AdMob identifiers, kept free of any react-native import so the release
 * checklist can read them without dragging the ads SDK into a unit test.
 *
 * All three are still placeholders. Create the app and the two units in the
 * AdMob console and paste the real values in. The android_app_id in app.json
 * has to be changed to match AD_APP_ID at the same time — the native SDK
 * reads it from there, not from here, and a mismatch crashes on launch.
 */

export const AD_APP_ID = 'ca-app-pub-0000000000000000~0000000000';

export const LIVE_AD_UNITS = {
  banner: 'ca-app-pub-0000000000000000/0000000000',
  exportInterstitial: 'ca-app-pub-0000000000000000/1111111111',
};

/**
 * The publisher segment of an untouched AdMob placeholder.
 *
 * A real publisher id is 16 digits that are never all zero, so this is a
 * reliable "nobody has filled this in yet" test and not a guess.
 */
const UNCONFIGURED_PUBLISHER = 'ca-app-pub-0000000000000000';

export function isPlaceholderAdId(id: string): boolean {
  return id.startsWith(UNCONFIGURED_PUBLISHER);
}

export function adUnitsConfigured(): boolean {
  return (
    !isPlaceholderAdId(AD_APP_ID) &&
    !Object.values(LIVE_AD_UNITS).some(isPlaceholderAdId)
  );
}
