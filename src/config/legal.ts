/**
 * Play requires a reachable privacy policy URL on the store listing and,
 * for subscriptions, an in-app route to manage or cancel. A dead link fails
 * review, so these must stay live.
 *
 * Served by GitHub Pages from the docs/ folder on main
 * (github.com/mps0103/Resume, Settings -> Pages). The pages themselves are
 * in docs/, so editing them and pushing is all it takes to update them —
 * but note that means a policy change ships the moment it is pushed, not
 * when the app next updates.
 */
const HOST = 'https://mps0103.github.io/Resume';

export const LEGAL_URLS = {
  privacy: `${HOST}/privacy.html`,
  terms: `${HOST}/terms.html`,
  manageSubscription:
    'https://play.google.com/store/account/subscriptions',
  support: 'mailto:info@dealtrix.com',
};

export const APP_NAME = 'Resume Builder';
/**
 * Shown in Settings. Keep in step with versionName in
 * android/app/build.gradle — it is the string users quote in support mail.
 */
export const APP_VERSION = '1.2.0';
export const PACKAGE_NAME = 'com.mps.resumebuilder';
