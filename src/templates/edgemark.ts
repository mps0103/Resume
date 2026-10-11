import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * A solid accent stripe down the left edge of every page. Unlike the sidebar
 * designs the stripe carries no content, so it repeats cleanly on page two
 * and the text stream stays single-column.
 */
export const edgeMarkTemplate = makeTemplate({
  id: 'edgemark',
  name: 'Edge',
  blurb: 'An accent stripe down the page edge. Colour without a column.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#2F5D50', '#6B3F2A', '#463157'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.5; }
    /* The stripe is page padding, not an element, so it cannot be orphaned
       at a page break the way a positioned bar would be. */
    .page { padding: ${44 * d}px ${48 * d}px ${44 * d}px ${56 * d}px; border-left: 10px solid ${a}; }
    .name { font-size: 1.95em; font-weight: 600; letter-spacing: -0.018em; margin: 0; }
    .headline { font-size: 0.89em; color: ${a}; margin: ${4 * d}px 0 0; font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 15px; font-size: 0.77em; color: #5B6067; margin-top: ${9 * d}px; }
    .masthead { padding-bottom: ${13 * d}px; border-bottom: 1px solid #DCE0E5; }
    .summary { font-size: 0.86em; color: #3A3E44; margin: ${13 * d}px 0 0; }
    .section { margin-top: ${19 * d}px; }
    .section > h2 { font-size: 0.79em; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      color: ${a}; margin: 0 0 ${9 * d}px; }
    .entry { margin-bottom: ${12 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .entry-title { font-size: 0.89em; font-weight: 700; }
    .entry-dates { font-size: 0.74em; color: #6B7078; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.82em; color: #565B61; }
    .bullets { margin-top: ${4 * d}px; }
    .bullets li { position: relative; padding-left: 12px; font-size: 0.835em; color: #34383E; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 0; top: 0.62em; width: 4px; height: 4px; border-radius: 50%; background: ${a}; }
    .skill-row { display: flex; gap: 10px; font-size: 0.84em; margin-bottom: ${4 * d}px; }
    .skill-group { min-width: 102px; font-weight: 700; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 24px; font-size: 0.84em; }
    .lang-level { color: #6B7078; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
