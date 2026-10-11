import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Name on the left, contact stacked on the right, then a single column
 * below. Only the header is split, so the body still reads as one stream —
 * this gets the look of a two-column design without the parsing problem.
 */
export const splitHeadTemplate = makeTemplate({
  id: 'splithead',
  name: 'Split Head',
  blurb: 'Two-column header, single-column body. The look without the risk.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#2F5D50', '#463157'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.5; }
    .page { padding: ${44 * d}px ${48 * d}px; }
    .masthead { display: flex; align-items: flex-end; gap: ${24 * d}px; padding-bottom: ${14 * d}px; border-bottom: 2px solid ${a}; }
    .masthead-left { flex: 1; min-width: 0; }
    .name { font-size: 2em; font-weight: 600; letter-spacing: -0.02em; line-height: 1.05; margin: 0; }
    .headline { font-size: 0.88em; color: ${a}; margin: ${6 * d}px 0 0; font-weight: 500; }
    .contact { display: block; text-align: right; font-size: 0.75em; color: #5B6067; max-width: 44%; }
    .contact span { display: block; margin-bottom: ${2 * d}px; }
    .summary { font-size: 0.86em; color: #3A3E44; margin: ${14 * d}px 0 0; }
    .section { margin-top: ${19 * d}px; }
    .section > h2 { font-size: 0.79em; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      color: ${a}; margin: 0 0 ${9 * d}px; }
    .entry { margin-bottom: ${12 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; }
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
    <header class="masthead">
      <div class="masthead-left">${nameHtml(r)}${headlineHtml(r)}</div>
      ${contactHtml(r)}
    </header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
