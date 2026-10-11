import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * A continuous rule down the left with a marker per entry. The line is
 * drawn on each entry rather than the section, so it survives a page break
 * instead of leaving a stub hanging at the foot of the page.
 */
export const timelineTemplate = makeTemplate({
  id: 'timeline',
  name: 'Timeline',
  blurb: 'A marked rail down the page. Shows progression at a glance.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#2F5D50', '#6B3F2A'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.5; }
    .page { padding: ${44 * d}px ${50 * d}px; }
    .name { font-size: 2em; font-weight: 600; letter-spacing: -0.015em; margin: 0; }
    .headline { font-size: 0.9em; color: ${a}; margin: ${4 * d}px 0 0; font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 16px; font-size: 0.78em; color: #5B6067; margin-top: ${10 * d}px; }
    .masthead { padding-bottom: ${14 * d}px; border-bottom: 2px solid ${a}; }
    .summary { font-size: 0.87em; color: #3A3E44; margin: ${14 * d}px 0 0; }
    .section { margin-top: ${20 * d}px; }
    .section > h2 { font-size: 0.8em; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: ${a}; margin: 0 0 ${10 * d}px; }
    .entry-rail { display: flex; gap: ${14 * d}px; position: relative; padding-bottom: ${12 * d}px; }
    .rail { width: ${74 * d}px; flex: 0 0 ${74 * d}px; font-size: 0.73em; color: #7C828A; text-align: right; padding-top: 2px; font-variant-numeric: tabular-nums; }
    .rail-body { flex: 1; border-left: 1.5px solid #DCE1E7; padding-left: ${16 * d}px; position: relative; }
    .rail-body::before { content: ""; position: absolute; left: -5px; top: 5px; width: 8.5px; height: 8.5px; border-radius: 50%; background: ${a}; border: 2px solid #fff; }
    .entry-title { font-size: 0.91em; font-weight: 700; }
    .entry-sub { font-size: 0.84em; color: #5B6067; }
    .bullets { margin-top: ${5 * d}px; }
    .bullets li { position: relative; padding-left: 12px; font-size: 0.845em; color: #34383E; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 0; top: 0.62em; width: 4px; height: 4px; border-radius: 50%; background: #B9C0C8; }
    .skill-row { display: flex; gap: ${14 * d}px; font-size: 0.85em; margin-bottom: ${5 * d}px; }
    .skill-group { width: ${74 * d}px; flex: 0 0 ${74 * d}px; text-align: right; color: #7C828A; font-size: 0.88em; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 26px; font-size: 0.85em; }
    .lang-level { color: #7C828A; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'rail', skillStyle: 'rows' })}
  `,
});
