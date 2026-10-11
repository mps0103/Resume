import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Section headings hang into the left margin beside their content, so the
 * page reads like a marked-up notebook. Headings still precede their content
 * in the markup, so it parses as one stream despite the offset look.
 */
export const notebookTemplate = makeTemplate({
  id: 'notebook',
  name: 'Notebook',
  blurb: 'Headings hang into the margin beside the content they label.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#6B3F2A', '#1F3A5F', '#2B2B2B'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.52; }
    .page { padding: ${46 * d}px ${46 * d}px ${46 * d}px ${40 * d}px; }
    .masthead { margin-left: ${96 * d}px; padding-bottom: ${14 * d}px; border-bottom: 1px solid #DCE0E5; }
    .name { font-size: 1.9em; font-weight: 600; letter-spacing: -0.015em; margin: 0; }
    .headline { font-size: 0.88em; color: ${a}; margin: ${4 * d}px 0 0; font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 15px; font-size: 0.77em; color: #5B6067; margin-top: ${9 * d}px; }
    .summary { font-size: 0.86em; color: #3A3E44; margin: ${14 * d}px 0 0 ${96 * d}px; }
    .section { display: flex; gap: ${16 * d}px; margin-top: ${20 * d}px; }
    .section > h2 { width: ${80 * d}px; flex: 0 0 ${80 * d}px; font-size: 0.75em; font-weight: 700;
      letter-spacing: 0.05em; text-transform: uppercase; color: ${a}; margin: 0; padding-top: 3px; text-align: right; }
    .section-body { flex: 1; min-width: 0; border-left: 2px solid #E6E9ED; padding-left: ${16 * d}px; }
    .entry { margin-bottom: ${12 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .entry-title { font-size: 0.89em; font-weight: 700; }
    .entry-dates { font-size: 0.74em; color: #7C828A; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.82em; color: #5B6067; }
    .bullets { margin-top: ${4 * d}px; }
    .bullets li { position: relative; padding-left: 12px; font-size: 0.835em; color: #34383E; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 0; top: 0.62em; width: 4px; height: 4px; border-radius: 50%; background: ${a}; }
    .skill-row { display: flex; gap: 10px; font-size: 0.84em; margin-bottom: ${4 * d}px; }
    .skill-group { min-width: 96px; font-weight: 700; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 22px; font-size: 0.84em; }
    .lang-level { color: #7C828A; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows', bodyClass: 'section-body' })}
  `,
});
