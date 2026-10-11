# Placeholders

Every value below ships as a dummy. The app builds and runs with all of them
as-is — nothing here blocks local testing — but each one must be real before
a Play upload, and most will fail review if left.

| File | Value | Where the real one comes from |
|---|---|---|
| `app.json` | `android_app_id` under the `react-native-google-mobile-ads` key | AdMob console → App settings → App ID. It is NOT in the manifest: the library injects that meta-data itself from app.json |
| `src/services/ads.ts` | banner and interstitial unit IDs | AdMob console → Ad units |
| `src/config/legal.ts` | `HOST` for privacy and terms | Wherever you host `store/*.html`. GitHub Pages is enough |
| `src/config/legal.ts` | `support` email | Your real support address |
| `src/services/integrity.ts` | `EXPECTED_SIGNATURE` | Play Console → Setup → App signing → **app signing key** SHA-256, not the upload key |
| `android/app/src/main/java/com/mps/resumebuilder/AppIntegrityModule.kt` | `cloudProjectNumber` | Google Cloud project number linked to the Play Console app |
| `src/services/billing.ts` | `pro_monthly`, `pro_yearly` | Must match the subscription IDs you create in Play Console |

## Behaviour while they are still dummies

- **Ads**: debug builds use Google's test ad units automatically, so ad code
  paths are testable. Release builds with a dummy AdMob app ID will fail to
  initialise and simply show no ads.
- **Integrity**: the signature will not match, which returns "unverified",
  not "tampered". Nothing is blocked. That is deliberate — a false positive
  must never lock out a paying user.
- **Billing**: the paywall shows "Plans could not be loaded" until the
  products exist in Play Console and the app is installed from a Play testing
  track. Billing never works in a locally built debug APK.
- **Legal URLs**: the links open a 404. Play review will reject the listing
  for an unreachable privacy policy, so host the files before submitting.
