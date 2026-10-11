# Resume Builder

Offline React Native resume builder for Android. Fill in your details once,
switch between designs, export a real-text ATS-safe PDF.

## Architecture

- **One JSON document per resume**, stored in SQLite with a `schemaVersion`
  and a migration runner. Metadata is duplicated into columns so the list
  screen never parses a blob.
- **Templates are HTML strings, not components.** One renderer, one
  pagination engine. Preview uses a WebView; export feeds the same HTML to
  `react-native-html-to-pdf`. Adding a design is one file plus one line in
  the registry.
- **Page margins live in the template's `.page` padding**, never in the PDF
  options, so preview and export paginate identically.
- **All user input passes through `esc()`** before reaching the HTML string.
- **Autosave** is debounced 500ms and flushed on background, because Android
  can kill the process before a pending timer fires.

## Monetisation

Free: 3 watermarked exports, free designs, ads on the list and gallery only.
Pro: no watermark, unlimited exports, every design, no ads.

The export is never blocked outright on the free tier — a watermarked PDF is
still a usable PDF. Filling twenty fields and hitting a hard wall is what
drives uninstalls.

Ad placement rules are centralised in `src/services/ads.ts`: never in the
editor, never on preview, one interstitial after a successful export with a
cooldown.

## Screens

Home, Editor, Section editor, Designs (gallery), Style, Preview, Settings,
Paywall. Navigation is a discriminated-union router in `App.tsx` rather than
react-navigation — eight screens with no deep linking do not justify the
reanimated and gesture-handler native surface, and every extra native
dependency is another thing that can break a Play release.

`Style` is where accent, text size, spacing and page size live. Those fields
have always been in the data model; without that screen they were dead code
and every design rendered in its default colour.

## Setup

```
npm install && npx react-native run-android
```

React Native 0.87.1, targetSdk 36, package `com.mps.resumebuilder`.
See `SETUP.md` for what is verified and what is not, and `PLACEHOLDERS.md`
for the dummy values that must be replaced before a Play upload.

## Tests

```
npm test
```

302 tests. They run against the pure modules only — templates, mutations and
scoring — because anything importing react-native needs a native mock stack
that buys little for logic this thin.

The template tests are the important ones: every design is checked for
escaping, watermark behaviour, empty-resume rendering, accent and style
response, and that a long resume loses no content. Add a template and it is
covered automatically; the suite iterates the registry.

`inventory.test.ts` is a deliberate tripwire rather than a behaviour test. It
pins the counts — 31 designs, 5 free, 26 premium, exactly 3 two-column and
all of them flagged one-page — so a design or a whole tier disappearing in a
refactor fails the build instead of being discovered on the store listing.

## Release

See `RELEASE.md`. Bump `appVersionCode` and `appVersionName` in
`android/app/build.gradle` before every Play upload, once per batch of
changes.

## Templates

Thirty-one designs. Free: Classic, Stacked, Minimal, Compact, Formal.

Premium, single column: Editorial, Swiss, Executive, Split Head, Grid,
Notebook, Timeline, Serif Rail, Centred, Technical, Mono, Academic, Ruled,
Condensed, Outline, Spotlight, Edge, Banner, Gradient, Slate, Accent Bar,
Capsule, Cards.

Premium, two column and not parser-safe: Sidebar, Sidebar Right, Duotone.

Two flags on every template drive the gallery warnings:

- `atsSafe: false` — the design uses columns, which applicant tracking
  systems read out of order. The three sidebar designs carry this.
- `onePageOnly: true` — the colour column or background only works on page
  one. The gallery warns when the user's own content looks longer than that.

Adding a design: one file exporting `makeTemplate({ ... })`, plus one line in
`templates/registry.ts`. Shared markup lives in `templates/blocks.ts` and the
class names there are a contract — style them, do not re-emit them. If a
template makes `.section` a flex or grid container, pass `bodyClass` so the
entries get a wrapper, otherwise every entry becomes a sibling track.

## Anti-tamper

`src/services/integrity.ts` plus a native Kotlin module. Signing certificate,
installer package and Play Integrity. A failed check caps entitlement at
free; it never crashes, accuses or disables. Read the Modded APKs section of
NOTES.md before changing any of it — particularly the reasoning for not
adding a server requirement.

## Still to build

- PDF import to prefill from an existing resume
- Per-application tailoring (duplicate + edit flow exists, needs a shortcut)
