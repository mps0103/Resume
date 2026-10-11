import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Large serif display over a sans body, with the summary set as a standfirst.
 * Spends all of its boldness on the name; everything below is deliberately
 * plain so the page does not compete with itself.
 */
export const editorialTemplate = makeTemplate({
  id: 'editorial',
  name: 'Editorial',
  blurb: 'Large serif name over a plain sans body. One bold moment only.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1A1A1A', '#1F3A5F', '#6B3F2A'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Helvetica, Arial, sans-serif; color: #23262B; line-height: 1.52; }
    .page { padding: ${50 * d}px ${54 * d}px; }
    .name { font-family: "Noto Serif", Georgia, serif; font-size: 2.9em; font-weight: 600; letter-spacing: -0.032em; line-height: 0.98; margin: 0; color: #16181B; }
    .headline { font-size: 0.86em; color: ${a}; margin: ${10 * d}px 0 0; font-weight: 600; letter-spacing: 0.02em; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 16px; font-size: 0.76em; color: #6A7078; margin-top: ${8 * d}px; }
    .masthead { padding-bottom: ${18 * d}px; }
    /* Standfirst: wider measure and larger than body, as a magazine intro. */
    .summary { font-family: "Noto Serif", Georgia, serif; font-size: 1em; line-height: 1.55; color: #383C42; margin: 0 0 ${6 * d}px; padding: ${16 * d}px 0; border-top: 1px solid #1A1A1A; border-bottom: 1px solid #E2E5E9; max-width: 46em; }
    .section { margin-top: ${22 * d}px; }
    .section > h2 { font-size: 0.75em; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #9BA2AA; margin: 0 0 ${10 * d}px; }
    .entry { margin-bottom: ${14 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; }
    .entry-title { font-family: "Noto Serif", Georgia, serif; font-size: 0.98em; font-weight: 600; }
    .entry-dates { font-size: 0.74em; color: #9BA2AA; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.83em; color: #6A7078; margin-top: 1px; }
    .bullets { margin-top: ${6 * d}px; }
    .bullets li { font-size: 0.85em; color: #383C42; margin-bottom: ${4 * d}px; max-width: 52em; }
    .skill-row { display: flex; gap: 12px; font-size: 0.85em; margin-bottom: ${5 * d}px; }
    .skill-group { min-width: 108px; color: #9BA2AA; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 26px; font-size: 0.85em; }
    .lang-level { color: #9BA2AA; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
