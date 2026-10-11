import { EntryStyle } from '../blocks';

/**
 * A skin is the typographic half of a design: type stacks, heading treatment,
 * colour temperature and how densely the type sits. A layout is the
 * structural half. Neither is a template on its own — the catalogue pairs
 * them, which is what lets the app ship a hundred designs that differ in
 * both structure and voice rather than a hundred recolours of one page.
 *
 * Every skin must emit the accent somewhere visible. The template suite
 * asserts that a custom accent reaches the rendered HTML, and a design that
 * ignored it would leave the Style screen's colour control doing nothing.
 */

export type SkillStyle = 'rows' | 'chips' | 'inline';

export interface Skin {
  id: string;
  /** Body copy stack. Android WebView resolves the first it actually has. */
  body: string;
  /** Display stack for the name and section headings. */
  display: string;
  entryStyle: EntryStyle;
  skillStyle: SkillStyle;
  /** Ink colours. Deliberately not pure black — it prints heavy. */
  text: string;
  muted: string;
  faint: string;
  /** Multiplier on body line-height, so a serif can breathe wider. */
  leading: number;
  /** CSS fragment for .name, minus colour. */
  nameCss: string;
  /** CSS fragment for a section heading, minus colour. */
  headCss: string;
  /** Where the accent lands: on headings, on the name, or only on rules. */
  ink: 'heading' | 'name' | 'rule';
}

const SANS = '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif';
const SERIF = '"Noto Serif", "Roboto Slab", Georgia, "Times New Roman", serif';
const MONO = '"Roboto Mono", "Droid Sans Mono", "Courier New", monospace';
const CONDENSED = '"Roboto Condensed", "Arial Narrow", "Inter", Arial, sans-serif';

export const SKINS: Record<string, Skin> = {
  /** Neutral modern sans. The safest of the five and the busiest in the app. */
  grotesk: {
    id: 'grotesk',
    body: SANS,
    display: SANS,
    entryStyle: 'head',
    skillStyle: 'rows',
    text: '#1A1D21',
    muted: '#5A6169',
    faint: '#8B939C',
    leading: 1.5,
    nameCss: 'font-size: 2.05em; font-weight: 700; letter-spacing: -0.021em;',
    headCss:
      'font-size: 0.735em; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;',
    ink: 'heading',
  },

  /** Book-weight serif, sentence-case headings. Reads like a printed page. */
  editorial: {
    id: 'editorial',
    body: SERIF,
    display: SERIF,
    entryStyle: 'head',
    skillStyle: 'inline',
    text: '#22262B',
    muted: '#5D646C',
    faint: '#8F969E',
    leading: 1.62,
    nameCss: 'font-size: 2.2em; font-weight: 600; letter-spacing: -0.012em;',
    headCss: 'font-size: 1.02em; font-weight: 600; letter-spacing: 0.005em;',
    ink: 'rule',
  },

  /** Monospaced throughout. Engineers read it as a terminal, which is the point. */
  mono: {
    id: 'mono',
    body: MONO,
    display: MONO,
    entryStyle: 'stack',
    skillStyle: 'chips',
    text: '#1C1F24',
    muted: '#5C636B',
    faint: '#8D949C',
    leading: 1.52,
    nameCss: 'font-size: 1.68em; font-weight: 700; letter-spacing: -0.028em;',
    headCss:
      'font-size: 0.72em; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;',
    ink: 'heading',
  },

  /** Narrow grotesque. Fits noticeably more words on a page than the rest. */
  press: {
    id: 'press',
    body: CONDENSED,
    display: CONDENSED,
    entryStyle: 'head',
    skillStyle: 'chips',
    text: '#17191D',
    muted: '#565D65',
    faint: '#888F97',
    leading: 1.44,
    nameCss:
      'font-size: 2.5em; font-weight: 700; letter-spacing: -0.012em; text-transform: uppercase;',
    headCss:
      'font-size: 0.85em; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;',
    ink: 'name',
  },

  /** Wide leading, light headings, no uppercase anywhere. The quiet one. */
  soft: {
    id: 'soft',
    body: SANS,
    display: SANS,
    entryStyle: 'stack',
    skillStyle: 'rows',
    text: '#23272C',
    muted: '#646B73',
    faint: '#959CA4',
    leading: 1.66,
    nameCss: 'font-size: 1.96em; font-weight: 500; letter-spacing: -0.008em;',
    headCss: 'font-size: 0.9em; font-weight: 600; letter-spacing: 0.01em;',
    ink: 'rule',
  },
};

export interface SkinCtx {
  skin: Skin;
  /** The user's accent, already escaped. */
  a: string;
  /** Density multiplier. */
  d: number;
}

/** Heading colour for a skin — the accent unless the skin keeps headings in ink. */
export function headColor({ skin, a }: SkinCtx): string {
  return skin.ink === 'heading' ? a : skin.text;
}

export function nameColor({ skin, a }: SkinCtx): string {
  return skin.ink === 'name' ? a : skin.text;
}

/**
 * Everything a layout can assume is already styled. Layouts add structure on
 * top of this and only re-declare what they actually change.
 */
export function skinCss(ctx: SkinCtx): string {
  const { skin: s, a, d } = ctx;
  return `
  body { font-family: ${s.body}; color: ${s.text}; line-height: ${s.leading}; }
  .name { font-family: ${s.display}; ${s.nameCss} color: ${nameColor(ctx)}; margin: 0; }
  .headline { font-size: 0.92em; color: ${s.muted}; margin: ${4 * d}px 0 0; font-weight: 400; }
  .contact { display: flex; flex-wrap: wrap; gap: ${3 * d}px 16px; font-size: 0.78em; color: ${s.muted}; margin-top: ${10 * d}px; }
  .contact-stack { font-size: 0.78em; color: ${s.muted}; line-height: 1.7; }
  .summary { font-size: 0.87em; color: ${s.text}; margin: ${18 * d}px 0 0; max-width: 56em; }

  .section { margin-top: ${24 * d}px; }
  .section > h2 { font-family: ${s.display}; ${s.headCss} color: ${headColor(ctx)}; margin: 0 0 ${11 * d}px; }

  .entry { margin-bottom: ${15 * d}px; }
  .entry:last-child { margin-bottom: 0; }
  .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; }
  .entry-title { font-size: 0.93em; font-weight: 700; }
  .entry-dates { font-size: 0.76em; color: ${s.faint}; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .entry-sub { font-size: 0.84em; color: ${s.muted}; margin-top: 1px; }
  .entry-meta { font-size: 0.8em; color: ${s.muted}; margin-top: 1px; }

  .bullets { margin-top: ${6 * d}px; }
  .bullets li { position: relative; padding-left: 13px; font-size: 0.85em; margin-bottom: ${4 * d}px; max-width: 54em; }
  .bullets li::before { content: "•"; position: absolute; left: 0; top: -0.05em; color: ${a}; }

  .skill-row { display: flex; gap: 12px; font-size: 0.85em; margin-bottom: ${5 * d}px; }
  .skill-group { min-width: 118px; color: ${s.muted}; font-weight: 600; }
  .skill-values { flex: 1; }
  .skills-inline { font-size: 0.85em; margin: 0; color: ${s.text}; }
  .chip-row { display: flex; flex-wrap: wrap; gap: ${5 * d}px 6px; }
  .chip { font-size: 0.76em; padding: 3px 9px; border-radius: 4px; background: ${a}14; color: ${a}; }

  .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 26px; font-size: 0.85em; }
  .lang-level { color: ${s.faint}; margin-left: 6px; }
  `;
}
