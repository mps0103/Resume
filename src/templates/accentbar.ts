import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Section headings sit on a full-width tinted bar. The bars give the page a
 * strong horizontal rhythm and make sections findable at a glance on a long
 * resume — the one thing a plain heading does badly at page three.
 */
export const accentBarTemplate = makeTemplate({
  id: 'accentbar',
  name: 'Accent Bar',
  blurb: 'Tinted heading bars. Sections stay findable on long resumes.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#2F5D50', '#6B3F2A', '#463157'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.48; }
    .page { padding: ${40 * d}px ${44 * d}px; }
    .name { font-size: 1.95em; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
    .headline { font-size: 0.88em; color: ${a}; margin: ${4 * d}px 0 0; font-weight: 600; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 15px; font-size: 0.77em; color: #5B6067; margin-top: ${9 * d}px; }
    .masthead { padding-bottom: ${14 * d}px; }
    .summary { font-size: 0.86em; color: #3A3E44; margin: 0 0 ${4 * d}px; }
    .section { margin-top: ${16 * d}px; }
    .section > h2 { font-size: 0.78em; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #fff; background: ${a}; margin: 0 0 ${10 * d}px; padding: ${5 * d}px ${10 * d}px; }
    .entry { margin-bottom: ${11 * d}px; padding: 0 ${10 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .entry-title { font-size: 0.89em; font-weight: 700; }
    .entry-dates { font-size: 0.74em; color: #6B7078; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.82em; color: #565B61; }
    .bullets { margin-top: ${4 * d}px; }
    .bullets li { position: relative; padding-left: 12px; font-size: 0.835em; color: #34383E; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 0; top: 0.62em; width: 4px; height: 4px; border-radius: 50%; background: ${a}; }
    .skill-row { display: flex; gap: 10px; font-size: 0.84em; margin-bottom: ${4 * d}px; padding: 0 ${10 * d}px; }
    .skill-group { min-width: 102px; font-weight: 700; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 24px; font-size: 0.84em; padding: 0 ${10 * d}px; }
    .lang-level { color: #6B7078; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
