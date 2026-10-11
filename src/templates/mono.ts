import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

const MONO = '"Droid Sans Mono", "Courier New", monospace';

/**
 * Entirely monospace. Every column lines up because every glyph is the same
 * width, which suits dense technical histories. It costs horizontal space,
 * so the measure is wider and the type a step smaller than the sans designs.
 */
export const monoTemplate = makeTemplate({
  id: 'mono',
  name: 'Mono',
  blurb: 'Monospace throughout. Columns align exactly, nothing drifts.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#245B4F', '#2B2B2B'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: ${MONO}; color: #202428; line-height: 1.45; font-size: ${14.5 * r.style.fontScale}px; }
    .page { padding: ${38 * d}px ${42 * d}px; }
    .name { font-size: 1.55em; font-weight: 700; letter-spacing: -0.03em; margin: 0; }
    .headline { font-size: 0.82em; color: ${a}; margin: ${3 * d}px 0 0; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 14px; font-size: 0.74em; color: #5C6167; margin-top: ${8 * d}px; }
    .masthead { padding-bottom: ${10 * d}px; border-bottom: 1px dashed #B4BAC1; }
    .summary { font-size: 0.8em; color: #383D43; margin: ${12 * d}px 0 0; }
    .section { margin-top: ${16 * d}px; }
    .section > h2 { font-size: 0.8em; font-weight: 700; color: ${a}; margin: 0 0 ${7 * d}px; }
    .section > h2::before { content: "[ "; color: #AEB4BB; }
    .section > h2::after { content: " ]"; color: #AEB4BB; }
    .entry { margin-bottom: ${10 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .entry-title { font-size: 0.86em; font-weight: 700; }
    .entry-dates { font-size: 0.74em; color: #6B7078; white-space: nowrap; }
    .entry-sub { font-size: 0.78em; color: #565B61; }
    .bullets { margin-top: ${3 * d}px; }
    .bullets li { position: relative; padding-left: 14px; font-size: 0.78em; color: #33383E; margin-bottom: ${2 * d}px; }
    .bullets li::before { content: "-"; position: absolute; left: 2px; color: ${a}; }
    .skill-row { display: flex; gap: 8px; font-size: 0.78em; margin-bottom: ${2.5 * d}px; }
    .skill-group { min-width: 112px; color: ${a}; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${2.5 * d}px 20px; font-size: 0.78em; }
    .lang-level { color: #6B7078; margin-left: 4px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
