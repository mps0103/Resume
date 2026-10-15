import { buildTheme } from '../ui/theme';
import {
  DEFAULT_PALETTE_ID,
  getPalette,
  PALETTES,
  Ramp,
} from '../ui/palettes';

/**
 * '#RRGGBB' → WCAG relative luminance, 0 to 1.
 *
 * Deliberately written out here rather than imported from the theme: these
 * tests are checking that module's colour choices, and sharing its helper
 * would mean a mistake in the helper could never fail a test.
 */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two opaque hex colours. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const RAMP_STEPS: (keyof Ramp)[] = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
];

describe('palettes', () => {
  it('have unique ids', () => {
    const ids = PALETTES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('include the default', () => {
    expect(PALETTES.some(p => p.id === DEFAULT_PALETTE_ID)).toBe(true);
  });

  it('fall back rather than throw on an unknown id', () => {
    // A palette removed in an update leaves this id saved on a real device.
    // Throwing here would be a crash loop on launch, not a styling bug.
    expect(getPalette('no-such-theme')).toBe(PALETTES[0]);
  });

  it.each(PALETTES.map(p => [p.id, p] as const))(
    '%s defines every ramp step as a full hex colour',
    (_id, palette) => {
      for (const ramp of [palette.brand, palette.neutral]) {
        for (const step of RAMP_STEPS) {
          expect(ramp[step]).toMatch(/^#[0-9A-Fa-f]{6}$/);
        }
      }
    },
  );
});

describe('buildTheme', () => {
  /**
   * The bug this pins: Carbon raises its brand ramp so the action colour
   * clears a dark page, which lands it on a pale tan. Every primary button
   * in the app had `color: '#fff'` written into it, so the label went
   * white-on-tan and vanished. onAccent is derived from the accent's
   * luminance precisely so a new palette cannot reintroduce that.
   */
  it.each(PALETTES.map(p => [p.id, p] as const))(
    '%s keeps label text legible on the accent fill',
    (_id, palette) => {
      const t = buildTheme(palette);
      expect(contrast(t.color.onAccent, t.color.accent)).toBeGreaterThan(3);
    },
  );

  it.each(PALETTES.map(p => [p.id, p] as const))(
    '%s keeps body text legible on the page and on cards',
    (_id, palette) => {
      const t = buildTheme(palette);
      expect(contrast(t.color.text, t.color.bg)).toBeGreaterThan(7);
      expect(contrast(t.color.text, t.color.surface)).toBeGreaterThan(7);
    },
  );

  it.each(PALETTES.map(p => [p.id, p] as const))(
    '%s keeps muted text legible on a card',
    (_id, palette) => {
      const t = buildTheme(palette);
      // 4.5 is the AA threshold for text at this size; hints are 12px.
      expect(contrast(t.color.textMuted, t.color.surface)).toBeGreaterThan(4.5);
    },
  );

  it.each(PALETTES.map(p => [p.id, p] as const))(
    '%s keeps white hero text legible on both gradient stops',
    (_id, palette) => {
      const t = buildTheme(palette);
      // onHero is a constant white, so both ends of every hero gradient
      // have to be dark enough to carry it — including the dark themes,
      // which state their stops rather than deriving them from the brand.
      expect(contrast(t.color.onHero, t.color.heroFrom)).toBeGreaterThan(4.5);
      expect(contrast(t.color.onHero, t.color.heroTo)).toBeGreaterThan(4.5);
    },
  );

  it.each(PALETTES.map(p => [p.id, p] as const))(
    '%s keeps accent-on-tint legible',
    (_id, palette) => {
      const t = buildTheme(palette);
      // The quota pill, the add-section chips and the progress card all put
      // onAccentSoft on accentSoft.
      expect(
        contrast(t.color.onAccentSoft, t.color.accentSoft),
      ).toBeGreaterThan(4.5);
    },
  );

  it('separates cards from the page in every theme', () => {
    for (const palette of PALETTES) {
      const t = buildTheme(palette);
      // A dark theme cannot show elevation with a shadow, so its cards have
      // to be a different colour from the page or the layout disappears.
      expect(t.color.surface).not.toBe(t.color.bg);
    }
  });

  it('drops elevation on dark themes', () => {
    const dark = PALETTES.filter(p => p.mode === 'dark');
    expect(dark.length).toBeGreaterThan(0);
    for (const palette of dark) {
      expect(buildTheme(palette).shadow.sm.elevation).toBe(0);
    }
  });

  it('keeps the token shape identical across palettes', () => {
    // Screens read these by name, so a palette that produced a different
    // set of keys would fail only on the screen that used the missing one.
    const keys = (id: string) =>
      Object.keys(buildTheme(getPalette(id)).color).sort();
    for (const palette of PALETTES) {
      expect(keys(palette.id)).toEqual(keys(DEFAULT_PALETTE_ID));
    }
  });
});
