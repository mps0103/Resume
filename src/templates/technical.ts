import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Monospace for dates, section markers and skills; proportional for prose.
 * The mono is doing a real job here — it column-aligns dates and makes long
 * skill lists scannable — rather than being a decorative nod to code.
 */
export const technicalTemplate = makeTemplate({
  id: 'technical',
  name: 'Technical',
  blurb: 'Mono dates and skill lists. Built for engineering resumes.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#245B4F', '#3B3B3B'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #202428; line-height: 1.48; }
    .page { padding: ${40 * d}px ${48 * d}px; }
    .name { font-size: 1.85em; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
    .headline { font-family: "Droid Sans Mono", "Courier New", monospace; font-size: 0.8em; color: ${a}; margin: ${4 * d}px 0 0; }
    .contact { font-family: "Droid Sans Mono", "Courier New", monospace; display: flex; flex-wrap: wrap; gap: 0 14px; font-size: 0.72em; color: #5C6167; margin-top: ${10 * d}px; }
    .masthead { padding-bottom: ${12 * d}px; border-bottom: 2px solid #202428; }
    .summary { font-size: 0.86em; color: #383D43; margin: ${14 * d}px 0 0; }
    .section { margin-top: ${18 * d}px; }
    .section > h2 { font-family: "Droid Sans Mono", "Courier New", monospace; font-size: 0.78em; font-weight: 700; color: ${a}; margin: 0 0 ${8 * d}px; }
    .section > h2::before { content: "// "; color: #A9AFB6; }
    .entry { margin-bottom: ${12 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; }
    .entry-title { font-size: 0.9em; font-weight: 700; }
    .entry-dates { font-family: "Droid Sans Mono", "Courier New", monospace; font-size: 0.72em; color: #6B7078; white-space: nowrap; }
    .entry-sub { font-size: 0.83em; color: #565B61; }
    .bullets { margin-top: ${4 * d}px; }
    .bullets li { position: relative; padding-left: 14px; font-size: 0.84em; color: #33383E; margin-bottom: ${2.5 * d}px; }
    .bullets li::before { content: "\\203A"; position: absolute; left: 2px; color: ${a}; font-weight: 700; }
    .skill-row { display: flex; gap: 10px; font-size: 0.82em; margin-bottom: ${3 * d}px; }
    .skill-group { font-family: "Droid Sans Mono", "Courier New", monospace; min-width: 104px; font-size: 0.92em; color: ${a}; }
    .skill-values { font-family: "Droid Sans Mono", "Courier New", monospace; font-size: 0.92em; color: #383D43; }
    .lang-grid { font-family: "Droid Sans Mono", "Courier New", monospace; display: flex; flex-wrap: wrap; gap: ${3 * d}px 22px; font-size: 0.78em; }
    .lang-level { color: #6B7078; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
