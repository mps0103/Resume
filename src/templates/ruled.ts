import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * A full rule between every entry, ledger style. The rules do real work on a
 * dense page — they stop one role bleeding visually into the next — but they
 * add clutter to a short resume, so this suits five entries and up.
 */
export const ruledTemplate = makeTemplate({
  id: 'ruled',
  name: 'Ruled',
  blurb: 'A rule between every entry. Keeps a dense page readable.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#2B2B2B', '#2F5D50'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.48; }
    .page { padding: ${42 * d}px ${46 * d}px; }
    .name { font-size: 1.9em; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
    .headline { font-size: 0.88em; color: ${a}; margin: ${4 * d}px 0 0; font-weight: 600; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 14px; font-size: 0.77em; color: #5B6067; margin-top: ${8 * d}px; }
    .masthead { padding-bottom: ${12 * d}px; border-bottom: 3px double ${a}; }
    .summary { font-size: 0.85em; color: #3A3E44; margin: ${12 * d}px 0 0; }
    .section { margin-top: ${18 * d}px; }
    .section > h2 { font-size: 0.78em; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      color: ${a}; margin: 0 0 ${2 * d}px; }
    .entry { padding: ${9 * d}px 0; border-bottom: 1px solid #E2E5E9; }
    .entry:last-child { border-bottom: 0; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .entry-title { font-size: 0.88em; font-weight: 700; }
    .entry-dates { font-size: 0.74em; color: #6B7078; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.82em; color: #565B61; }
    .bullets { margin-top: ${4 * d}px; }
    .bullets li { position: relative; padding-left: 12px; font-size: 0.83em; color: #34383E; margin-bottom: ${2.5 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 0; top: 0.62em; width: 4px; height: 4px; background: ${a}; }
    .skill-row { display: flex; gap: 10px; font-size: 0.83em; padding: ${5 * d}px 0; border-bottom: 1px solid #EEF0F3; }
    .skill-group { min-width: 102px; font-weight: 700; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 24px; font-size: 0.83em; padding-top: ${5 * d}px; }
    .lang-level { color: #6B7078; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
