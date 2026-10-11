import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Narrow measure and tight leading, with skills as inline text rather than
 * rows. Fits noticeably more than Compact without dropping below the
 * line-height where scanning breaks down.
 */
export const condensedTemplate = makeTemplate({
  id: 'condensed',
  name: 'Condensed',
  blurb: 'Narrower and tighter than Compact. The most words per page.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#26303B', '#1F3A5F', '#3B3B3B'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #232629; line-height: 1.36; font-size: ${14.5 * r.style.fontScale}px; }
    .page { padding: ${30 * d}px ${38 * d}px; }
    .name { font-size: 1.6em; font-weight: 700; letter-spacing: -0.025em; margin: 0; }
    .headline { font-size: 0.84em; color: ${a}; margin: ${2 * d}px 0 0; font-weight: 600; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 10px; font-size: 0.72em; color: #565A5F; margin-top: ${5 * d}px; }
    .masthead { padding-bottom: ${7 * d}px; border-bottom: 1px solid ${a}; }
    .summary { font-size: 0.78em; color: #3B3F44; margin: ${7 * d}px 0 0; }
    .section { margin-top: ${11 * d}px; }
    .section > h2 { font-size: 0.75em; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
      color: ${a}; margin: 0 0 ${5 * d}px; }
    .entry { margin-bottom: ${6.5 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
    .entry-title { font-size: 0.83em; font-weight: 700; }
    .entry-dates { font-size: 0.7em; color: #6E747B; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.76em; color: #565A5F; }
    .bullets { margin-top: ${2 * d}px; }
    .bullets li { position: relative; padding-left: 9px; font-size: 0.765em; color: #33373C; margin-bottom: ${1 * d}px; }
    .bullets li::before { content: "\\2013"; position: absolute; left: 0; color: ${a}; }
    .skills-inline { font-size: 0.765em; color: #33373C; margin: 0; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${1.5 * d}px 16px; font-size: 0.765em; }
    .lang-level { color: #6E747B; margin-left: 4px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'inline' })}
  `,
});
