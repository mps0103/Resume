/**
 * Play requires a reachable privacy policy URL on the store listing and,
 * for subscriptions, an in-app route to manage or cancel. Replace the
 * placeholder host before the first upload — a dead link fails review.
 */
const HOST = 'https://mps-apps.github.io/resume-builder';

export const LEGAL_URLS = {
  privacy: `${HOST}/privacy.html`,
  terms: `${HOST}/terms.html`,
  manageSubscription:
    'https://play.google.com/store/account/subscriptions',
  support: 'mailto:support@example.com',
};

export const APP_NAME = 'Resume Builder';
/**
 * Shown in Settings. Keep in step with versionName in
 * android/app/build.gradle — it is the string users quote in support mail.
 */
export const APP_VERSION = '1.1.0';
export const PACKAGE_NAME = 'com.mps.resumebuilder';
