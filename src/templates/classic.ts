import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * The default. Single column, linear reading order, real text. Nothing is
 * laid out with floats, tables or absolute positioning, because applicant
 * tracking systems read the PDF text stream in order and multi-column
 * layouts interleave into nonsense.
 */
export const classicTemplate = makeTemplate({
  id: 'classic',
  name: 'Classic',
  blurb: 'Single column, ATS-safe. The default that always parses.',
  tier: 'free',
  atsSafe: true,
  accents: ['#1F3A5F', '#2F5D50', '#6B3F2A', '#3B3B3B'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", "Helvetica Neue", Arial, sans-serif; color: #23262B; line-height: 1.5; }
    .name { font-family: "Noto Serif", Georgia, serif; font-size: 2.05em; font-weight: 600; letter-spacing: -0.015em; line-height: 1.1; margin: 0; }
    .headline { font-size: 0.94em; color: ${a}; margin: ${5 * d}px 0 0; font-weight: 500; }
    .contact { margin: ${12 * d}px 0 0; font-size: 0.8em; color: #55595F; display: flex; flex-wrap: wrap; }
    .contact span { padding-right: 11px; margin-right: 11px; border-right: 1px solid #D3D6DA; }
    .contact span:last-child { border-right: 0; margin-right: 0; padding-right: 0; }
    .masthead { padding-bottom: ${16 * d}px; border-bottom: 2px solid ${a}; }
    .summary { margin: ${16 * d}px 0 0; font-size: 0.87em; color: #3A3E44; }
    .section { margin-top: ${22 * d}px; }
    .section > h2 { font-family: "Noto Serif", Georgia, serif; font-size: 0.98em; font-weight: 600; color: ${a}; margin: 0 0 ${9 * d}px; padding-bottom: ${4 * d}px; border-bottom: 1px solid #DFE2E6; }
    .entry { margin-bottom: ${13 * d}px; }
    .entry:last-child { margin-bottom: 0; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; }
    .entry-title { font-size: 0.91em; font-weight: 600; color: #1B1E22; }
    .entry-dates { font-size: 0.76em; color: #6B7078; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.84em; color: #55595F; margin-top: 1px; }
    .bullets { margin-top: ${5 * d}px; }
    .bullets li { position: relative; padding-left: 13px; font-size: 0.845em; color: #34383E; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 2px; top: 0.62em; width: 4px; height: 4px; border-radius: 50%; background: ${a}; }
    .skill-row { display: flex; gap: 10px; font-size: 0.85em; margin-bottom: ${5 * d}px; }
    .skill-group { min-width: 108px; font-weight: 600; color: #1B1E22; }
    .skill-values { color: #3A3E44; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 26px; font-size: 0.85em; }
    .lang-level { color: #6B7078; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">
      ${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}
    </header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
