/**
 * The themes the user can pick in Settings.
 *
 * A palette is only ever two colour ramps and a mode. Everything else in
 * the theme — spacing, radii, type, shadows — is shared, because those are
 * the app's proportions rather than its skin, and letting a theme change
 * them would mean every screen needs testing against every theme.
 *
 * `brand` runs light to dark and `neutral` runs lightest-surface to
 * darkest-text, in both modes. That inversion is the whole trick: a dark
 * theme is a palette whose neutral ramp starts dark, so no screen needs to
 * know which mode it is in.
 */

export interface Ramp {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface Palette {
  id: string;
  name: string;
  /** Shown under the name in the theme picker. */
  blurb: string;
  mode: 'light' | 'dark';
  brand: Ramp;
  neutral: Ramp;
  /**
   * The two stops of the hero header gradient, light end first.
   *
   * Defaulted from the brand ramp for light themes, but a dark theme has to
   * state it: Carbon's brand ramp runs pale-to-white at the top end, so a
   * header built from it would put white text on near-white.
   */
  hero?: [string, string];
  /** The Pro accent. Gold on light themes, brighter on dark ones. */
  gold: string;
  goldSoft: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warn: string;
  warnSoft: string;
}

const blue: Ramp = {
  50: '#F3F8FF',
  100: '#E4EFFE',
  200: '#C7DEFD',
  300: '#8FBEFB',
  400: '#4B96F7',
  500: '#1478F0',
  600: '#0A6CF1',
  700: '#0A52BE',
  800: '#0A3C8C',
  900: '#082B63',
};

/** The light neutral ramp, very slightly blue so white cards read as paper. */
const cool: Ramp = {
  50: '#F7F9FC',
  100: '#EFF2F7',
  200: '#E4E9F0',
  300: '#CFD8E3',
  400: '#94A1B2',
  500: '#5A6779',
  600: '#44505F',
  700: '#2A3443',
  800: '#1A2230',
  900: '#0E1726',
};

/**
 * Dark neutrals, as a ramp that reads in the same direction as the light
 * one: 50 is the surface you put text on, 900 is the text.
 *
 * None of these are pure black. An OLED-black background makes white text
 * bloom and makes elevation impossible to show, since a shadow on black is
 * invisible — the cards have to be lighter than the page instead.
 */
const darkCool: Ramp = {
  50: '#171B23',
  100: '#1D222C',
  200: '#2A313E',
  300: '#3A4352',
  400: '#78839A',
  500: '#9AA5B8',
  600: '#B4BECE',
  700: '#D2D9E4',
  800: '#E7EBF2',
  900: '#F4F7FB',
};

const darkWarm: Ramp = {
  50: '#1A1917',
  100: '#211F1C',
  200: '#2E2B27',
  300: '#413D37',
  400: '#8A8378',
  500: '#A8A196',
  600: '#C3BCB1',
  700: '#DCD6CC',
  800: '#EDE9E2',
  900: '#F8F6F2',
};

const lightSemantics = {
  gold: '#B07D16',
  goldSoft: '#FBF2DC',
  danger: '#D64545',
  dangerSoft: '#FDECEC',
  success: '#0E8A5F',
  successSoft: '#E6F6EF',
  warn: '#B4690E',
  warnSoft: '#FDF3E4',
};

/**
 * Dark-mode semantics are not the light ones inverted.
 *
 * The text colours have to lighten to stay legible on a dark surface, and
 * the tinted fills have to become near-black tints of the same hue rather
 * than pale washes, which would glare.
 */
const darkSemantics = {
  gold: '#E3B64A',
  goldSoft: '#302713',
  danger: '#F08A8A',
  dangerSoft: '#331D1D',
  success: '#4FCB9B',
  successSoft: '#132D24',
  warn: '#E0AC5F',
  warnSoft: '#302517',
};

export const PALETTES: Palette[] = [
  {
    id: 'ocean',
    name: 'Ocean',
    blurb: 'The default. Clean blue on paper white.',
    mode: 'light',
    brand: blue,
    neutral: cool,
    ...lightSemantics,
  },
  {
    id: 'ink',
    name: 'Ink',
    blurb: 'Navy and warm grey. Quiet and formal.',
    mode: 'light',
    brand: {
      50: '#F4F6FA',
      100: '#E6EAF2',
      200: '#C9D2E3',
      300: '#9AA8C4',
      400: '#6678A0',
      500: '#415A87',
      600: '#2E476F',
      700: '#23385A',
      800: '#1A2B45',
      900: '#121E31',
    },
    neutral: {
      ...cool,
      50: '#FAF9F7',
      100: '#F2F0EC',
      200: '#E6E2DA',
      300: '#D2CCC1',
    },
    ...lightSemantics,
  },
  {
    id: 'forest',
    name: 'Forest',
    blurb: 'Deep green. Easy on the eyes for long edits.',
    mode: 'light',
    brand: {
      50: '#F1F9F5',
      100: '#DEF1E8',
      200: '#B8E2CE',
      300: '#7FCBA9',
      400: '#45AE82',
      500: '#1E9065',
      600: '#107553',
      700: '#0D5C42',
      800: '#0A4733',
      900: '#073325',
    },
    neutral: cool,
    ...lightSemantics,
  },
  {
    id: 'plum',
    name: 'Plum',
    blurb: 'Violet and soft grey. The least corporate.',
    mode: 'light',
    brand: {
      50: '#F8F5FF',
      100: '#EFE8FE',
      200: '#DCCDFD',
      300: '#BFA4F9',
      400: '#9D74F2',
      500: '#7F4EE6',
      600: '#6C3AD4',
      700: '#562CAA',
      800: '#422182',
      900: '#2E165C',
    },
    neutral: cool,
    ...lightSemantics,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    blurb: 'Dark, with the blue kept bright.',
    mode: 'dark',
    hero: ['#1E3E72', '#0C1A30'],
    brand: {
      ...blue,
      // On a dark surface the action colour has to come up the ramp, or a
      // 600-weight blue button has almost no contrast against the page.
      600: '#4B96F7',
      700: '#6BAAF9',
      100: '#1B2B45',
      50: '#15202F',
      200: '#24395A',
    },
    neutral: darkCool,
    ...darkSemantics,
  },
  {
    id: 'carbon',
    name: 'Carbon',
    blurb: 'Dark and neutral. No colour but the accents.',
    mode: 'dark',
    hero: ['#3A352E', '#1A1917'],
    brand: {
      50: '#1C1B19',
      100: '#262420',
      200: '#39352F',
      300: '#5A544A',
      400: '#938A7B',
      500: '#B5AB99',
      600: '#D8CDB8',
      700: '#E6DECD',
      800: '#F0EADF',
      900: '#F8F5EE',
    },
    neutral: darkWarm,
    ...darkSemantics,
  },
];

export const DEFAULT_PALETTE_ID = 'ocean';

export function getPalette(id: string): Palette {
  return PALETTES.find(p => p.id === id) ?? PALETTES[0];
}
