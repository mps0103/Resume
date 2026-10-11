# Setup

This is a complete React Native project. Unzip it, install, run.

## 1. Install

```
cd resume-builder && npm install
```

`node_modules` is not in the zip, so this step downloads it — allow a few
minutes.

## 2. Confirm it is healthy before touching Android

```
npx tsc --noEmit && npx jest
```

Expect no TypeScript output and 296 tests passing. Both already pass here, so
a failure means the install went wrong rather than the code.

## 3. Run it

Connect your phone with USB debugging on, then:

```
npx react-native run-android
```

The first run compiles the native modules and takes several minutes. Later
runs are fast.

## What you are running

- React Native 0.87.1, Kotlin 2.2, compileSdk 37, **targetSdk 36**
- targetSdk 36 is not optional: since 31 August 2026 Google Play rejects any
  new submission targeting lower
- New Architecture is on, which is the 0.87 default
- Package name `com.mps.resumebuilder`

## What was verified before packaging

- TypeScript compiles clean against React Native 0.87
- All 296 tests pass
- **A production Metro bundle builds** — every import resolves and the whole
  JS side compiles for release
- All eight native modules are picked up by autolinking

## What was not verified

**The Android compile.** There is no Android SDK in the environment this was
assembled in, so `gradlew` was never run. Everything above the native build
is proven; the Gradle step is not.

The most likely place for trouble is a native module meeting the New
Architecture. If the build fails there, the fallback is one line in
`android/gradle.properties`:

```
newArchEnabled=false
```

Rebuild after changing it. The app itself does not care either way.

## Known first-run behaviour

**"Unable to load script".** Metro is not reachable. In a second terminal run
`npx react-native start --reset-cache`, then `adb reverse tcp:8081 tcp:8081`.

**Build fails inside a native module.** Install the NDK — Android Studio →
SDK Manager → SDK Tools → NDK (Side by side). op-sqlite needs it.

**No ads appear.** Expected. Debug builds use Google's test ad units, and the
AdMob app ID in the manifest is still a placeholder.

**Paywall says "Plans could not be loaded".** Expected. Billing never works
in a locally built debug APK — it needs the products created in Play Console
and the app installed from a Play testing track.

**Integrity check does not recognise your build.** Expected. The signature in
`src/services/integrity.ts` is a placeholder, so the check returns
"unverified", which blocks nothing.

## What to test on the phone, in this order

1. Create a resume, add a role with two highlights. The completeness meter
   should move.
2. Force-quit and reopen. Your text should still be there — that proves
   autosave and SQLite.
3. Open Designs. All 31 thumbnails should render your own content.
4. Open Style. Change the accent; the preview should update immediately.
5. Preview, then Save as PDF. Open the file and try to select the text. It
   must be selectable, not a picture — that is the whole ATS guarantee.
6. Turn on airplane mode and repeat 1 to 5. Everything should still work.

## Before any Play upload

`PLACEHOLDERS.md` lists every dummy value and where the real one comes from.
`RELEASE.md` has the keystore and upload steps.
