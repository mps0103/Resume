import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Each entry sits in a tinted block. Single column, so it still parses, but
 * the blocks cost vertical space — this design suits five or six entries,
 * not fifteen.
 */
export const cardsTemplate = makeTemplate({
  id: 'cards',
  name: 'Cards',
  blurb: 'Each role in its own tinted block. Best with a handful of entries.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#2F5D50', '#6B3F2A'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.48; }
    .page { padding: ${40 * d}px ${44 * d}px; }
    .name { font-size: 1.95em; font-weight: 600; letter-spacing: -0.015em; margin: 0; }
    .headline { font-size: 0.9em; color: ${a}; margin: ${4 * d}px 0 0; font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 16px; font-size: 0.78em; color: #5B6067; margin-top: ${9 * d}px; }
    .masthead { padding-bottom: ${14 * d}px; }
    .summary { font-size: 0.86em; color: #3A3E44; margin: 0 0 ${4 * d}px; }
    .section { margin-top: ${18 * d}px; }
    .section > h2 { font-size: 0.79em; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${a}; margin: 0 0 ${9 * d}px; }
    .entry { background: #F4F6F8; border-left: 3px solid ${a}; border-radius: 0 4px 4px 0; padding: ${11 * d}px ${13 * d}px; margin-bottom: ${8 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .entry-title { font-size: 0.89em; font-weight: 700; }
    .entry-dates { font-size: 0.74em; color: #6B7078; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.82em; color: #565B61; }
    .bullets { margin-top: ${5 * d}px; }
    .bullets li { position: relative; padding-left: 12px; font-size: 0.83em; color: #34383E; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 0; top: 0.62em; width: 4px; height: 4px; border-radius: 50%; background: ${a}; }
    .chip-row { display: flex; flex-wrap: wrap; gap: ${4 * d}px 6px; }
    .chip { font-size: 0.78em; background: #F4F6F8; border-left: 2px solid ${a}; color: #333940; padding: 3px 9px; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 24px; font-size: 0.84em; }
    .lang-level { color: #6B7078; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'chips' })}
  `,
});
