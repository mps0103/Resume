import { Resume } from '../../types/resume';
import { contactHtml, contactStackHtml, sectionsHtml } from '../blocks';
import { headlineHtml, nameHtml, summaryHtml } from '../makeTemplate';
import { Skin, SkinCtx } from './skins';

/**
 * A layout is the structural half of a design: where the masthead sits, how a
 * section heading relates to its entries, whether anything is in columns.
 * It assumes skinCss has already styled the type, and only declares what it
 * genuinely rearranges.
 *
 * Layouts never restyle .page padding. Print margins come from the @page rule
 * in baseCss, and a layout that added its own page padding would double the
 * margin on a printed copy while looking correct on screen.
 */
export interface Layout {
  id: string;
  /**
   * False only for real multi-column layouts. An applicant tracking system
   * reads the PDF text stream in document order, and side-by-side columns
   * interleave into nonsense.
   */
  atsSafe: boolean;
  onePageOnly?: boolean;
  css(ctx: SkinCtx): string;
  body(resume: Resume, skin: Skin): string;
}

/** The masthead and single-column flow that most of these layouts share. */
function stackedBody(r: Resume, skin: Skin): string {
  return `
    <header class="mast">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, {
      entryStyle: skin.entryStyle,
      skillStyle: skin.skillStyle,
      bodyClass: 'sec-body',
    })}
  `;
}

export const LAYOUTS: Record<string, Layout> = {
  /** Headings live in their own left column, entries in the right one. */
  rail: {
    id: 'rail',
    atsSafe: true,
    css: ({ a, d }) => `
      .mast { padding-bottom: ${12 * d}px; border-bottom: 1px solid ${a}2E; }
      .section { display: grid; grid-template-columns: 118px 1fr; gap: 0 24px; align-items: start; margin-top: ${22 * d}px; }
      .section > h2 { margin: 0; padding-top: 2px; }
      .declaration .decl-text, .declaration .decl-close { grid-column: 2; }
    `,
    body: stackedBody,
  },

  /** Name and contact inside a filled card. The most colour of any layout. */
  band: {
    id: 'band',
    atsSafe: true,
    css: ({ a, d }) => `
      .mast { background: ${a}; border-radius: 12px; padding: ${24 * d}px ${26 * d}px; }
      .mast .name { color: #fff; }
      .mast .headline { color: #fff; opacity: 0.82; }
      .mast .contact { color: #fff; opacity: 0.8; }
      .summary { margin-top: ${16 * d}px; }
    `,
    body: stackedBody,
  },

  /** Sections counted 01, 02, 03 down the page. */
  numbered: {
    id: 'numbered',
    atsSafe: true,
    css: ({ a, d }) => `
      .page { counter-reset: sec; }
      .mast { padding-bottom: ${13 * d}px; }
      .section > h2 { display: flex; align-items: baseline; gap: 11px; }
      .section > h2::before {
        counter-increment: sec;
        content: counter(sec, decimal-leading-zero);
        color: ${a};
        opacity: 0.5;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0;
      }
    `,
    body: stackedBody,
  },

  /** A hairline across the full measure above every heading. */
  hairline: {
    id: 'hairline',
    atsSafe: true,
    css: ({ a, d }) => `
      .mast { padding-bottom: ${14 * d}px; }
      .section { border-top: 1px solid ${a}3D; padding-top: ${13 * d}px; margin-top: ${20 * d}px; }
    `,
    body: stackedBody,
  },

  /** An oversized name, everything under it deliberately quiet. */
  display: {
    id: 'display',
    atsSafe: true,
    css: ({ a, d }) => `
      .mast { padding-bottom: ${14 * d}px; }
      .mast .name { font-size: 3.05em; line-height: 0.97; letter-spacing: -0.035em; }
      .mast .headline { font-size: 1em; margin-top: ${8 * d}px; }
      .mast .contact { margin-top: ${12 * d}px; }
      .summary { border-left: 2px solid ${a}; padding-left: 14px; }
    `,
    body: stackedBody,
  },

  /** Each section inside its own outlined card. */
  boxed: {
    id: 'boxed',
    atsSafe: true,
    css: ({ a, d }) => `
      .mast { padding-bottom: ${14 * d}px; }
      .section {
        border: 1px solid ${a}30;
        border-radius: 10px;
        padding: ${13 * d}px ${16 * d}px ${15 * d}px;
        margin-top: ${13 * d}px;
      }
    `,
    body: stackedBody,
  },

  /** A ruled spine down the left of each section with a dot per entry. */
  timeline: {
    id: 'timeline',
    atsSafe: true,
    css: ({ a, d }) => `
      .mast { padding-bottom: ${14 * d}px; border-bottom: 1px solid ${a}2E; }
      .sec-body { border-left: 2px solid ${a}26; padding-left: 22px; margin-left: 3px; }
      .sec-body .entry { position: relative; }
      .sec-body .entry::before {
        content: "";
        position: absolute;
        left: -27px;
        top: 0.42em;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: ${a};
      }
    `,
    body: stackedBody,
  },

  /**
   * A genuine two-column page: contact, skills and languages in a tinted
   * aside, the narrative in the main column. Flagged unsafe for parsers and
   * one-page for the same reason — the aside's fill has no second page to
   * continue onto.
   */
  panel: {
    id: 'panel',
    atsSafe: false,
    onePageOnly: true,
    css: ({ a, d }) => `
      .shell { display: flex; gap: 26px; align-items: flex-start; }
      .aside {
        width: 34%;
        flex: none;
        background: ${a}0F;
        border-radius: 10px;
        padding: ${18 * d}px ${16 * d}px;
      }
      .aside .section { margin-top: ${18 * d}px; }
      .aside .section:first-child { margin-top: 0; }
      .aside .skill-row { display: block; }
      .aside .skill-group { min-width: 0; margin-bottom: 2px; }
      .main { flex: 1; min-width: 0; }
      .main .mast { padding-bottom: ${12 * d}px; border-bottom: 1px solid ${a}2E; }
      .declaration { margin-top: ${22 * d}px; }
    `,
    body: (r, skin) => `
      <div class="shell">
        <aside class="aside">
          ${contactStackHtml(r)}
          ${sectionsHtml(r, {
            entryStyle: 'stack',
            skillStyle: skin.skillStyle === 'inline' ? 'rows' : skin.skillStyle,
            only: ['skills', 'languages', 'certifications'],
            bodyClass: 'sec-body',
          })}
        </aside>
        <div class="main">
          <header class="mast">${nameHtml(r)}${headlineHtml(r)}</header>
          ${summaryHtml(r)}
          ${sectionsHtml(r, {
            entryStyle: skin.entryStyle,
            skillStyle: skin.skillStyle,
            except: ['skills', 'languages', 'certifications'],
            bodyClass: 'sec-body',
          })}
        </div>
      </div>
    `,
  },

  /** Headings set as filled pills. */
  tab: {
    id: 'tab',
    atsSafe: true,
    css: ({ a, d }) => `
      .mast { padding-bottom: ${14 * d}px; }
      .section > h2 {
        display: inline-block;
        background: ${a}14;
        color: ${a};
        padding: 4px 13px;
        border-radius: 999px;
      }
    `,
    body: stackedBody,
  },

  /** A rule that runs from each heading out to the right margin. */
  ruleRight: {
    id: 'ruleRight',
    atsSafe: true,
    css: ({ a, d }) => `
      .mast { padding-bottom: ${14 * d}px; }
      .section > h2 { display: flex; align-items: center; gap: 13px; }
      .section > h2::after { content: ""; flex: 1; height: 1px; background: ${a}38; }
    `,
    body: stackedBody,
  },

  /** Everything centred on the measure. */
  centered: {
    id: 'centered',
    atsSafe: true,
    css: ({ a, d }) => `
      .mast { text-align: center; padding-bottom: ${14 * d}px; border-bottom: 2px solid ${a}; }
      .mast .contact { justify-content: center; }
      .section > h2 { text-align: center; }
      .summary { margin-left: auto; margin-right: auto; text-align: center; max-width: 46em; }
    `,
    body: stackedBody,
  },

  /** Name hard left, contact details hard right, on a single baseline. */
  split: {
    id: 'split',
    atsSafe: true,
    css: ({ a, d }) => `
      .mast {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 26px;
        border-bottom: 3px solid ${a};
        padding-bottom: ${12 * d}px;
      }
      .mast-id { min-width: 0; }
      .mast .contact-stack { text-align: right; flex: none; }
    `,
    body: (r, skin) => `
      <header class="mast">
        <div class="mast-id">${nameHtml(r)}${headlineHtml(r)}</div>
        ${contactStackHtml(r)}
      </header>
      ${summaryHtml(r)}
      ${sectionsHtml(r, {
        entryStyle: skin.entryStyle,
        skillStyle: skin.skillStyle,
        bodyClass: 'sec-body',
      })}
    `,
  },

  /** Every entry set as a card with an accent edge. */
  cardEntry: {
    id: 'cardEntry',
    atsSafe: true,
    css: ({ a, d }) => `
      .mast { padding-bottom: ${14 * d}px; border-bottom: 1px solid ${a}2E; }
      .sec-body .entry {
        border-left: 3px solid ${a}45;
        padding: ${2 * d}px 0 ${2 * d}px 15px;
        margin-bottom: ${13 * d}px;
      }
    `,
    body: stackedBody,
  },

  /** Contact details pulled out into a tinted strip under the name. */
  strip: {
    id: 'strip',
    atsSafe: true,
    css: ({ a, d }) => `
      .strip {
        display: flex;
        flex-wrap: wrap;
        gap: ${4 * d}px 20px;
        background: ${a}0D;
        border-left: 3px solid ${a};
        padding: ${10 * d}px ${14 * d}px;
        margin-top: ${13 * d}px;
        font-size: 0.79em;
      }
    `,
    body: (r, skin) => `
      <header class="mast">${nameHtml(r)}${headlineHtml(r)}</header>
      ${contactHtml(r, 'strip')}
      ${summaryHtml(r)}
      ${sectionsHtml(r, {
        entryStyle: skin.entryStyle,
        skillStyle: skin.skillStyle,
        bodyClass: 'sec-body',
      })}
    `,
  },
};
