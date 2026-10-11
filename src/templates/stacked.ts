import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Everything stacked and left-aligned, with metadata on one line beneath the
 * title. Nothing is pushed to the right margin, so long company names and
 * long date ranges never collide — the failure the split-line layouts hit
 * first on narrow content.
 */
export const stackedTemplate = makeTemplate({
  id: 'stacked',
  name: 'Stacked',
  blurb: 'Everything left-aligned. Long titles and dates never collide.',
  tier: 'free',
  atsSafe: true,
  accents: ['#1F3A5F', '#2F5D50', '#3B3B3B'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.5; }
    .page { padding: ${44 * d}px ${50 * d}px; }
    .name { font-size: 1.9em; font-weight: 600; letter-spacing: -0.015em; margin: 0; }
    .headline { font-size: 0.9em; color: ${a}; margin: ${4 * d}px 0 0; font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 15px; font-size: 0.78em; color: #5B6067; margin-top: ${9 * d}px; }
    .masthead { padding-bottom: ${13 * d}px; border-bottom: 1px solid #D8DCE1; }
    .summary { font-size: 0.86em; color: #3A3E44; margin: ${13 * d}px 0 0; }
    .section { margin-top: ${19 * d}px; }
    .section > h2 { font-size: 0.8em; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: ${a}; margin: 0 0 ${9 * d}px; }
    .entry-stack { margin-bottom: ${12 * d}px; }
    .entry-title { font-size: 0.9em; font-weight: 700; }
    .entry-meta { font-size: 0.8em; color: #6B7078; margin-top: 1px; }
    .bullets { margin-top: ${5 * d}px; }
    .bullets li { position: relative; padding-left: 12px; font-size: 0.845em; color: #34383E; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 0; top: 0.62em; width: 4px; height: 4px; border-radius: 50%; background: ${a}; }
    .skill-row { display: flex; gap: 10px; font-size: 0.85em; margin-bottom: ${4 * d}px; }
    .skill-group { min-width: 104px; font-weight: 700; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 24px; font-size: 0.85em; }
    .lang-level { color: #6B7078; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'stack', skillStyle: 'rows' })}
  `,
});
