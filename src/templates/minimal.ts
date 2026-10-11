import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * No rules, no fills, no colour beyond the text itself. Structure comes
 * entirely from space, which means the accent choice barely shows — that is
 * intentional for people applying somewhere conservative.
 */
export const minimalTemplate = makeTemplate({
  id: 'minimal',
  name: 'Minimal',
  blurb: 'No lines, no fills. Structure from whitespace alone.',
  tier: 'free',
  atsSafe: true,
  accents: ['#2B2B2B', '#1F3A5F', '#3F4A3C'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Helvetica, Arial, sans-serif; color: #2A2D31; line-height: 1.55; }
    .page { padding: ${58 * d}px ${60 * d}px; }
    .name { font-size: 1.7em; font-weight: 500; letter-spacing: 0.01em; margin: 0; }
    .headline { font-size: 0.9em; color: #6A6F75; margin: ${3 * d}px 0 0; font-weight: 400; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 16px; font-size: 0.78em; color: #7A7F86; margin-top: ${10 * d}px; }
    .summary { font-size: 0.87em; color: #3C4045; margin: ${24 * d}px 0 0; max-width: 56em; }
    .section { margin-top: ${28 * d}px; }
    .section > h2 { font-size: 0.78em; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${a}; margin: 0 0 ${12 * d}px; }
    .entry { margin-bottom: ${18 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; }
    .entry-title { font-size: 0.92em; font-weight: 600; }
    .entry-dates { font-size: 0.76em; color: #93999F; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.84em; color: #6A6F75; margin-top: 1px; }
    .bullets { margin-top: ${7 * d}px; }
    .bullets li { font-size: 0.85em; color: #3C4045; margin-bottom: ${4 * d}px; max-width: 54em; }
    .skill-row { display: flex; gap: 12px; font-size: 0.85em; margin-bottom: ${5 * d}px; }
    .skill-group { min-width: 110px; color: #7A7F86; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 28px; font-size: 0.85em; }
    .lang-level { color: #93999F; margin-left: 6px; }
    `;
  },
  body: r => `
    <header>
      ${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}
    </header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
