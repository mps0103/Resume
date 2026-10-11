import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Serif body with the dates in a left rail. Grid does the same arrangement
 * in sans; this one reads slower and warmer, which suits writing, teaching
 * and research roles more than engineering ones.
 */
export const serifRailTemplate = makeTemplate({
  id: 'serifrail',
  name: 'Serif Rail',
  blurb: 'Serif body with dates in a left rail. Warm and unhurried.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#3A2E22', '#1B3B5F', '#2B2B2B'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Serif", Georgia, serif; color: #22252A; line-height: 1.56; }
    .page { padding: ${48 * d}px ${52 * d}px; }
    .name { font-size: 1.95em; font-weight: 600; letter-spacing: -0.01em; margin: 0; }
    .headline { font-size: 0.88em; color: ${a}; margin: ${5 * d}px 0 0; font-style: italic; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 16px; font-size: 0.77em; color: #5F656D; margin-top: ${9 * d}px; }
    .masthead { padding-bottom: ${14 * d}px; border-bottom: 1px solid ${a}; }
    .summary { font-size: 0.86em; margin: ${14 * d}px 0 0; padding-left: ${104 * d}px; }
    .section { margin-top: ${20 * d}px; }
    .section > h2 { font-size: 0.8em; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
      color: ${a}; margin: 0 0 ${10 * d}px; }
    .entry-rail { display: flex; gap: ${18 * d}px; margin-bottom: ${13 * d}px; }
    .rail { width: ${86 * d}px; flex: 0 0 ${86 * d}px; font-size: 0.75em; color: #7E848C; font-style: italic; padding-top: 3px; }
    .rail-body { flex: 1; }
    .entry-title { font-size: 0.92em; font-weight: 600; }
    .entry-sub { font-size: 0.83em; color: #5F656D; font-style: italic; }
    .bullets { margin-top: ${5 * d}px; }
    .bullets li { position: relative; padding-left: 13px; font-size: 0.845em; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: "\\2022"; position: absolute; left: 2px; color: #A7ADB4; }
    .skill-row { display: flex; gap: ${18 * d}px; font-size: 0.845em; margin-bottom: ${4 * d}px; }
    .skill-group { width: ${86 * d}px; flex: 0 0 ${86 * d}px; color: #7E848C; font-style: italic; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 24px; font-size: 0.845em; padding-left: ${104 * d}px; }
    .lang-level { color: #7E848C; margin-left: 5px; font-style: italic; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'rail', skillStyle: 'rows' })}
  `,
});
