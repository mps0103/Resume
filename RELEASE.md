# Play Store release checklist

Everything here is **outside the code** — accounts, consoles and hosted
pages. The code-side placeholders are tracked programmatically instead: see
`src/config/releaseReadiness.ts`, which is unit tested and shown in Settings
→ "Before Play upload" on a debug build. The app is not ready to upload
while that list is non-empty.

---

## 1. Blockers — the app is broken or rejected without these

### 1.1 Signing key

```bash
keytool -genkeypair -v -keystore resume-upload.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias resume-upload
```

Put the credentials in `~/.gradle/gradle.properties` (never in the repo):

```properties
RESUME_UPLOAD_STORE_FILE=/absolute/path/resume-upload.jks
RESUME_UPLOAD_STORE_PASSWORD=…
RESUME_UPLOAD_KEY_ALIAS=resume-upload
RESUME_UPLOAD_KEY_PASSWORD=…
```

Until these exist, `assembleRelease` **falls back to the debug key** — it
builds, but Play will reject the upload. Back the keystore up somewhere you
cannot lose it; losing it means you can never update the app again.

### 1.2 App signing certificate → `EXPECTED_SIGNATURE`

After the first upload, Play Console → **Setup → App signing** → copy the
SHA-256 of the **App signing key certificate** (not the upload key) into
`EXPECTED_SIGNATURE` in `src/services/integrity.ts`.

This one is dangerous to get wrong, which is why the code refuses to act on
the placeholder: a release build compares Play's real certificate against
`AA:BB:CC…`, concludes every install is tampered with, and silently caps
**every paying subscriber** at the free tier — watermarked exports, premium
designs locked, and nothing anywhere saying why. `signatureConfigured()`
turns the check off entirely until a real value is pasted in, so an
unconfigured signature means "cannot check" rather than "failed".

### 1.3 Privacy policy and terms, publicly reachable

`src/config/legal.ts` points at `mps-apps.github.io`, which does not exist.
Play rejects a listing whose privacy policy URL 404s. The policy must
actually describe:

- **AdMob** — collects the advertising ID and device/usage data for ads
- **Google Play Billing** — purchase state
- That resume content never leaves the device

A GitHub Pages repo is fine and free. Update `HOST`, and set a real support
address in `LEGAL_URLS.support` (currently `support@example.com`).

### 1.4 AdMob app and ad units

Create the app and two units in the AdMob console, then set them in
`src/config/adUnits.ts` **and** `android_app_id` in `app.json`. These must
be the same publisher ID in both places or the SDK no-fills silently.

Until then the app shows **no ads at all** in release (`adsAvailable()`
returns false) rather than firing requests at an account that does not
exist. Debug builds always use Google's test units.

### 1.5 Play Console in-app products

| Product ID | Type | Price | Billing period |
| --- | --- | --- | --- |
| `pro_monthly` | Subscription | ₹199 | P1M (monthly) |

One product, and only one. There is no lifetime or yearly tier — the sku
was removed from the code rather than hidden, so do not create one in the
Console expecting the app to show it.

The ID must match `SKU_MONTHLY` in `src/services/plans.ts` exactly, and
the billing period must be **P1M**; the app never computes a price, it only
renders what Play returns, so a product configured on the wrong cycle is
invisible until somebody is charged.

Billing cannot be tested from a locally built APK at all — upload to
**internal testing** first and add licence testers under Setup → Licence
testing.

---

## 2. Play Console forms

- **Data safety** — must match the manifest. The app declares
  `com.google.android.gms.permission.AD_ID`, so declare that the advertising
  ID is collected and used for advertising. Resume content is not collected,
  not shared, and never leaves the device.
- **Content rating** — questionnaire. Expect Everyone / PEGI 3.
- **Target audience** — not children. The app sets
  `tagForChildDirectedTreatment: false` and `MaxAdContentRating.G`.
- **Ads declaration** — yes, the app contains ads.
- **App access** — no login; say so, or review stalls.
- **Account deletion** — not applicable, there are no accounts. Say this
  explicitly rather than leaving it blank.
- **Financial features** — none.

---

## 3. Store assets

- Icon 512×512 — already generated at `store/icon-512.png`
- Feature graphic 1024×500 — **not generated, still needed**
- At least 2 phone screenshots (4 – 8 is better)
- Short description (80 chars), full description (4000)

---

## 4. Build and upload

```bash
cd android && ./gradlew bundleRelease
```

Upload `android/app/build/outputs/bundle/release/app-release.aab`.

Bump **both** `appVersionCode` and `appVersionName` in
`android/app/build.gradle` before every upload, and keep `APP_VERSION` in
`src/config/legal.ts` in step — it is the string users quote in support
mail. `versionCode` must be strictly higher than anything previously
uploaded, including builds only ever sent to internal testing.

Upload the R8 mapping file (`android/app/build/outputs/mapping/release/`)
so Play Console crash reports stay readable.

---

## 5. Known gaps, deliberately not done

Not blockers — recorded so they are decisions rather than oversights.

- **No cover-letter builder.** The single most common feature request for
  this category.
- **No photo on the resume.** `Basics.photoUri` and the templates'
  `supportsPhoto` flag both exist, but nothing in the UI can set a photo —
  it needs an image-picker dependency. Photos are expected on resumes in
  much of Asia and the Middle East.
- **English only.** No i18n layer. Hindi would be the obvious first
  addition for the pricing this is aimed at.
- **Light theme only**, despite `Theme.AppCompat.DayNight` being the parent.
- **Free exports reset on reinstall.** The tally lives in app-internal
  storage with `allowBackup="false"`. There is no offline fix; the practical
  defence is that reinstalling wipes the user's resumes too.
- **`enableOnBackInvokedCallback` is off**, so predictive back gestures do
  not animate. Turning it on means reworking the `BackHandler` logic in
  `App.tsx`.
