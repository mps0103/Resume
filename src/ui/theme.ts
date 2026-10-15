/**
 * App chrome tokens. Deliberately separate from resume template styling —
 * the app's look must never leak into the document the user exports. That
 * separation is why a theme can be anything at all: changing it cannot
 * change the PDF.
 *
 * A theme is derived from a {@link Palette} rather than written out, so
 * adding one means choosing two colour ramps and nothing else. See
 * {@link buildTheme} for how a ramp becomes the tokens screens actually use.
 */

import { DEFAULT_PALETTE_ID, getPalette, Palette } from './palettes';

/**
 * Shadows, as one token each rather than six properties at every call site.
 *
 * Android ignores the iOS shadow fields and reads `elevation`, and iOS
 * ignores `elevation`, so both have to be present in the same object for a
 * card to lift on both. The radii are larger than the offsets on purpose: a
 * soft wide shadow reads as paper, a tight dark one as a border.
 *
 * Built per theme because a shadow on a dark page is invisible — a dark
 * theme has to carry elevation with a lighter surface and a crisper border
 * instead, so its shadows are dialled right down rather than left to fight
 * the background.
 */
function buildShadows(palette: Palette) {
  const dark = palette.mode === 'dark';
  const ink = dark ? '#000000' : palette.neutral[900];
  const k = dark ? 0.5 : 1;

  return {
    /** Resting cards and rows. Barely there, but it separates white on white. */
    sm: {
      shadowColor: ink,
      shadowOpacity: 0.05 * k,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: dark ? 0 : 2,
    },
    /** Anything the user is meant to reach for first. */
    md: {
      shadowColor: ink,
      shadowOpacity: 0.08 * k,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: dark ? 0 : 5,
    },
    /** Sheets, dialogs and the bottom bar. */
    lg: {
      shadowColor: ink,
      shadowOpacity: (dark ? 0.5 : 0.14) * (dark ? 1 : 1),
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
    },
    /** Tinted to the brand, for a primary button that should feel raised. */
    brand: {
      shadowColor: dark ? '#000000' : palette.brand[700],
      shadowOpacity: dark ? 0.45 : 0.3,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
  };
}

/**
 * Turns a palette into the tokens every screen reads.
 *
 * Both neutral ramps run in the same direction — 50 is the page, 900 is the
 * text — so none of this branches on mode except where it genuinely has to:
 * a light theme's cards are pure white rather than a tint, and the tinted
 * fill behind brand-coloured text needs a different ramp step in each mode
 * to stay legible.
 */
/**
 * WCAG relative luminance of a '#RRGGBB' colour, 0 (black) to 1 (white).
 *
 * Two things here are easy to leave out and both change the answer. The
 * channels are weighted by the sRGB coefficients rather than averaged,
 * because the eye is far more sensitive to green than to blue. And each
 * channel is linearised first: hex values are gamma-encoded, and skipping
 * that step puts a mid blue at 0.38 when it is really 0.17 — enough to pick
 * the wrong text colour for it.
 */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two opaque colours, 1 to 21. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Whichever candidate is more legible on `background`.
 *
 * A luminance threshold was the first attempt and it needed a magic number
 * that was wrong for exactly one palette: Midnight's action blue is light
 * enough to fail white text at 3.0, while still sitting below any cutoff
 * that left the other five alone. Measuring both candidates needs no
 * constant and cannot be tuned wrong by the next palette.
 */
function bestOn(background: string, ...candidates: string[]): string {
  return candidates.reduce((best, c) =>
    contrast(c, background) > contrast(best, background) ? c : best,
  );
}

export function buildTheme(palette: Palette) {
  const { brand, neutral, mode } = palette;
  const dark = mode === 'dark';

  return {
    palette,
    mode,

    color: {
      bg: neutral[50],
      bgSunken: dark ? '#101319' : neutral[100],
      // Pure white on light themes: a tinted card next to a tinted page is
      // the flat look this redesign exists to get rid of.
      surface: dark ? neutral[100] : '#FFFFFF',
      surfaceRaised: dark ? neutral[200] : '#FFFFFF',
      border: neutral[200],
      borderStrong: neutral[300],
      text: neutral[900],
      textMuted: neutral[500],
      textFaint: neutral[400],

      /** The action colour. Named `accent` because every screen already is. */
      accent: brand[600],
      /**
       * Text and icons on top of an `accent` fill.
       *
       * Not a constant white. A dark theme has to raise its action colour up
       * the ramp to clear the page behind it, and Carbon's lands on a pale
       * tan — white on it is illegible, and every primary button in the app
       * had `color: '#fff'` written into it. Derived rather than declared,
       * so a new palette cannot forget to set it.
       */
      onAccent: bestOn(brand[600], '#FFFFFF', neutral[50]),
      accentPressed: dark ? brand[500] : brand[700],
      accentSoft: brand[100],
      accentTint: brand[50],
      /** Text and icons sitting on `accentSoft`. */
      onAccentSoft: dark ? brand[700] : brand[800],

      /** Gradient stops for the hero headers, light end first. */
      heroFrom: palette.hero?.[0] ?? brand[600],
      heroTo: palette.hero?.[1] ?? brand[900],
      /** Always light: every hero stop pair above is dark enough for it. */
      onHero: '#FFFFFF',
      onHeroMuted: 'rgba(255,255,255,0.72)',

      danger: palette.danger,
      dangerSoft: palette.dangerSoft,
      success: palette.success,
      successSoft: palette.successSoft,
      warn: palette.warn,
      warnSoft: palette.warnSoft,

      /** The Pro accent. Gold reads as paid in a way more blue cannot. */
      gold: palette.gold,
      goldSoft: palette.goldSoft,

      blue: brand,
      brand,
      slate: neutral,
      neutral,
    },

    space: (n: number) => n * 4,

    radius: { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 },

    font: {
      /** Screen-opening type. Tight tracking is what reads as considered. */
      display: {
        fontSize: 28,
        fontWeight: '700' as const,
        letterSpacing: -0.6,
      },
      h1: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
      h2: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2 },
      title: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.3 },
      /** Group headings. Spaced capitals, so they read as labels not content. */
      section: {
        fontSize: 11,
        fontWeight: '700' as const,
        letterSpacing: 0.9,
      },
      body: { fontSize: 15, fontWeight: '400' as const },
      bodyStrong: { fontSize: 15, fontWeight: '600' as const },
      label: { fontSize: 12, fontWeight: '600' as const },
      hint: { fontSize: 12, fontWeight: '400' as const },
    },

    shadow: buildShadows(palette),
  };
}

export type Theme = ReturnType<typeof buildTheme>;

/**
 * The default theme, as a module constant.
 *
 * Kept because styles built with `StyleSheet.create` at module scope read
 * their colours once at import and cannot follow a theme change. Anything
 * that must react to the picker in Settings uses `useTheme()` instead; this
 * export is the right thing only for styles that carry no colour, and for
 * tests.
 */
export const theme = buildTheme(getPalette(DEFAULT_PALETTE_ID));

/** Re-exported so screens need one import, not two. */
export { PALETTES, getPalette, DEFAULT_PALETTE_ID } from './palettes';
export type { Palette } from './palettes';

/** The `shadow` token of the default theme, for module-scope styles. */
export const shadow = theme.shadow;
