# Engineering notes

## Multi-page resumes

Three and four page resumes work. Verified across all eighteen templates:
entries stay whole at every page break, section headings never strand at the
foot of a page, and the text stream stays in reading order on page three.

### Constraints of the render path

**No page numbers.** `counter(page)` only resolves inside `@page` margin
boxes. `react-native-html-to-pdf` renders through Chromium's print path
without access to those boxes, so a page counter comes out as `0`. Verified,
not assumed.

**No repeating header or footer.** A `position: fixed` element does repeat on
every printed page, but Chromium reserves no space for it — body text flows
straight through it on every page except the last. Reserving space was tried
three ways and none worked on continuation pages:

- `.page` bottom padding — applies once, at the end of the document
- an `@page` bottom margin
- a print-engine margin passed to the renderer

A footer that overlaps body text is worse than no footer, so there is none.

**Decided against.** Page numbers and a repeating name on every page are not
wanted. Pages two and three of a printed resume carrying no name is accepted
behaviour, not an outstanding bug. Do not reopen it.

**The watermark sits once at the foot of the document**, not on every page,
for the same reason. `.page` reserves 46px of bottom padding for it.

### The paginator

A real paginator would measure rendered element heights in the preview
WebView and distribute entries across explicit fixed-height sheet divs.

Headers and footers no longer justify building it, since they are not wanted.
The only remaining reason is the sidebar designs leaving a dead colour column
on page two, and the gallery already warns the user about that. Not planned.

## Template invariants

Anything added to `src/templates/` must hold these, all covered by
`harness/verify.ts`:

- renders a complete document for both a full resume and an empty one
- emits no `undefined` or `NaN` into the HTML
- escapes injected markup — script tags, image handlers, closing tags
- shows the watermark on free export and omits it for Pro
- if it makes `.section` a flex or grid container, passes `bodyClass` to
  `sectionsHtml`, or every entry becomes a sibling track and the entries lay
  out side by side

## Typing third-party modules

`react-native-html-to-pdf` ships no types. Rather than a blanket
`declare module` returning `any`, `src/types/react-native-html-to-pdf.d.ts`
declares only the options this app passes. An unsupported option is then a
compile error instead of a field the library silently ignores at runtime.

Two build errors only surfaced once the dependency tree was installed:
`react-native-google-mobile-ads` exports `mobileAds` as its default, not as a
named export, and the PDF library needed the declaration above. Run
`npx tsc --noEmit` with `node_modules` present before any release build —
without it these pass unnoticed.

## Modded APKs

### The honest position

You cannot stop this. The app runs on hardware the user controls, and every
check in it can be found and deleted. Anyone selling you full protection for
a client-side app is wrong. The realistic goal is to make a working mod
expensive to produce and quick to break, not to make one impossible.

The one measure that genuinely works is validating entitlement on a server
before unlocking the feature. That is incompatible with this app's core
promise — it works with no network — and it would punish paying users on a
plane to inconvenience people who were never going to pay. That trade was
made deliberately. Do not quietly add a hard online requirement later to
chase pirates.

### What is implemented

`src/services/integrity.ts`, three layers, cheapest first:

1. **Signing certificate check.** A repackaged APK cannot carry Play's
   signature — the modder does not have the private key. They can delete the
   check, but they cannot pass it. Set `EXPECTED_SIGNATURE` from Play Console
   under Setup, App signing: use the *app signing key* certificate, not the
   upload key.
2. **Installer check.** Confirms the app came from the Play Store. Sideloaded
   builds return unverified, not tampered, because developers and some OEM
   channels look identical to a pirate here.
3. **Play Integrity API.** The only check a modder cannot remove by editing
   this source, because the verdict is signed by Google rather than produced
   locally. Needs the cloud project number set in `AppIntegrityModule.kt`.

### What a failed check does

It caps the entitlement at free. It does not crash, wipe data, show an
accusation, or disable anything.

That restraint is the point. Every one of those reactions eventually lands on
a real paying customer through a false positive, and a wrongly accused
subscriber writes a one-star review that costs more than the pirate ever
would. A modded build that flips the local `pro` flag simply gets watermarked
exports — the exact thing the mod existed to remove — and the user is never
told why, so there is no error message to search for and patch around.

### Limits you should know

- With no backend, the Integrity token can only be inspected on-device, which
  a modder can stub. It is still worth calling: it raises the work required,
  and it gives you a path to real server verification later without shipping
  another app update.
- The MMKV encryption key ships in the binary. It stops someone editing the
  entitlement file on a rooted device without touching the app. It stops
  nothing else.
- R8 obfuscation is already on for release builds, which makes all of the
  above meaningfully harder to locate in a decompiled APK.

### Where the effort actually pays off

Most people who install a modded APK were never going to buy. The revenue
lever is not piracy; it is conversion among users who already like the app.
Time spent on the export flow, the template gallery and the first-run
experience will return more than time spent on anti-tamper work.

If piracy does become material, the highest-value response is a thin backend
that verifies the Play purchase token and the Integrity verdict server-side,
and gates one genuinely server-dependent premium feature behind it — not
turning the whole app online.

## Library migrations done at assembly time

The project was assembled onto the React Native 0.87.1 scaffold, which
resolved several dependencies to major versions newer than the code was
written against. Each break and its fix:

- **react-native-iap 12 → 16.** Full rewrite onto a Nitro-based query and
  mutation API. `getSubscriptions` became `fetchProducts({ skus, type })`,
  `requestSubscription` became `requestPurchase` with a per-platform request
  object, and `subscriptionOfferDetails` became
  `subscriptionOfferDetailsAndroid`. Products are now keyed by `id` rather
  than `productId`.
- **react-native-mmkv 3 → 4.** `new MMKV(...)` became `createMMKV(...)`;
  `MMKV` is now a type only. Get and set are unchanged.
- **react-native-quick-sqlite → @op-engineering/op-sqlite.** Not a version
  bump, a replacement. quick-sqlite is unmaintained, pins AGP 7.2.2 in its
  own buildscript and ships no codegen config, so it would fight the 0.87
  toolchain and the New Architecture. op-sqlite is by the same author and
  actively maintained. The store uses `executeSync`, which keeps the autosave
  path synchronous — an async store would let a pending write interleave with
  a document switch.
- **React Native 0.87 itself.** `StatusBar`'s `backgroundColor` prop was
  removed; the bar colour now comes from `styles.xml`, which also covers the
  pre-JS launch window. `TextInput`'s ref type changed, so the bullet editor
  derives it with `ComponentRef<typeof TextInput>`.

Two Android issues found by diffing against the pristine 0.87 template:

- The template has **no debug manifest**. Cleartext traffic is a manifest
  placeholder that the React Native Gradle plugin sets per build type — true
  for debug, false for release. The manifest originally hardcoded it to
  false, which would have silently broken the Metro dev server.
- `editTextBackground` must stay `@drawable/rn_edit_text_material`. Replacing
  it changes cursor and selection rendering in ways that are easy to miss.

## Bugs found in the final audit

Each of these compiled and typechecked cleanly, and each would have failed on
a real device.

- **MMKV encryption key was 18 bytes.** MMKV caps AES-128 keys at 16 and
  throws above that. The billing store is created at module load, so this was
  a crash on launch, not a degraded feature. Key shortened to exactly 16.
- **AdMob app ID was declared in AndroidManifest.xml.**
  react-native-google-mobile-ads reads `android_app_id` from a
  `react-native-google-mobile-ads` key in app.json and injects that meta-data
  itself through manifest placeholders. Declaring it by hand as well is a
  duplicate declaration at merge time, and omitting the app.json key crashes
  the native SDK on startup. Moved to app.json; the manifest entries removed.
- **FileProvider paths pointed at the wrong directory.**
  react-native-html-to-pdf writes to `getExternalFilesDir(null)/Documents`
  and only falls back to `filesDir` when external storage is unmounted.
  `file_paths.xml` declared only the internal path, so
  `FileProvider.getUriForFile` would have thrown and the share sheet would
  have failed after a successful export. Both paths are now declared.
- **react-native-share could not resolve the exported file.** Its own
  provider covers only `Download/` and the cache directory. MainApplication
  now implements `ShareApplication` and returns this app's authority, which
  the library tries first.
- **A multi-line Groovy ternary in build.gradle.** Groovy ends the statement
  at the newline after a complete method call, so `signingConfig cond` with
  `? a : b` on following lines is a syntax error. Parenthesised.
- **Two PDF options that do not exist.** `padding` and `bgColor` were being
  passed; HtmlToPdfModule.kt reads only html, fileName, directory, base64,
  baseURL, height and width. Removed, and the type declaration narrowed to
  match so a no-op cannot look like configuration again.
