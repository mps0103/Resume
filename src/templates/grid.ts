import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Dates live in a fixed left rail so every entry starts on the same
 * vertical line. Still one text flow per entry — date, then title, then
 * body — so parsers read it in order despite the two-column look.
 */
export const gridTemplate = makeTemplate({
  id: 'grid',
  name: 'Grid',
  blurb: 'Dates aligned in a left rail. Reads fast, parses cleanly.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#2F5D50', '#3B3B3B'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.5; }
    .page { padding: ${44 * d}px ${50 * d}px; }
    .name { font-size: 1.95em; font-weight: 600; letter-spacing: -0.015em; margin: 0; }
    .headline { font-size: 0.9em; color: ${a}; margin: ${4 * d}px 0 0; font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 16px; font-size: 0.78em; color: #5B6067; margin-top: ${10 * d}px; }
    .masthead { padding-bottom: ${14 * d}px; border-bottom: 1px solid #DDE1E5; }
    .summary { font-size: 0.87em; color: #3A3E44; margin: ${14 * d}px 0 0; padding-left: ${100 * d}px; }
    .section { margin-top: ${20 * d}px; }
    .section > h2 { font-size: 0.79em; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${a}; margin: 0 0 ${10 * d}px; }
    .entry-rail { display: flex; gap: ${16 * d}px; margin-bottom: ${13 * d}px; }
    .rail { width: ${84 * d}px; flex: 0 0 ${84 * d}px; font-size: 0.74em; color: #7C828A; padding-top: 2px; font-variant-numeric: tabular-nums; }
    .rail-body { flex: 1; }
    .entry-title { font-size: 0.91em; font-weight: 700; }
    .entry-sub { font-size: 0.84em; color: #5B6067; }
    .bullets { margin-top: ${5 * d}px; }
    .bullets li { position: relative; padding-left: 12px; font-size: 0.845em; color: #34383E; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 0; top: 0.62em; width: 4px; height: 4px; background: ${a}; }
    .skill-row { display: flex; gap: ${16 * d}px; font-size: 0.85em; margin-bottom: ${5 * d}px; }
    .skill-group { width: ${84 * d}px; flex: 0 0 ${84 * d}px; color: #7C828A; font-size: 0.88em; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 26px; font-size: 0.85em; padding-left: ${100 * d}px; }
    .lang-level { color: #7C828A; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'rail', skillStyle: 'rows' })}
  `,
});
