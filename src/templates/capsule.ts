import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Section headings sit in rounded tinted capsules and skills render as
 * chips. Softer than the bar designs and cheaper to print, since the fills
 * are tints rather than solid accent.
 */
export const capsuleTemplate = makeTemplate({
  id: 'capsule',
  name: 'Capsule',
  blurb: 'Rounded heading capsules and skill chips. Soft and light on ink.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#2F5D50', '#6B3F2A', '#463157'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.5; }
    .page { padding: ${42 * d}px ${46 * d}px; }
    .name { font-size: 1.95em; font-weight: 600; letter-spacing: -0.015em; margin: 0; }
    .headline { font-size: 0.89em; color: ${a}; margin: ${4 * d}px 0 0; font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; gap: ${3 * d}px 6px; font-size: 0.75em; margin-top: ${10 * d}px; }
    .contact span { background: #F1F4F8; color: #4E545B; padding: 3px 10px; border-radius: 999px; }
    .masthead { padding-bottom: ${14 * d}px; }
    .summary { font-size: 0.86em; color: #3A3E44; margin: 0 0 ${4 * d}px; }
    .section { margin-top: ${18 * d}px; }
    .section > h2 { display: inline-block; font-size: 0.76em; font-weight: 700; letter-spacing: 0.08em;
      text-transform: uppercase; color: ${a}; background: #EDF1F6; border-radius: 999px;
      padding: ${4 * d}px ${12 * d}px; margin: 0 0 ${10 * d}px; }
    .entry { margin-bottom: ${12 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .entry-title { font-size: 0.89em; font-weight: 700; }
    .entry-dates { font-size: 0.74em; color: #6B7078; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.82em; color: #565B61; }
    .bullets { margin-top: ${4 * d}px; }
    .bullets li { position: relative; padding-left: 13px; font-size: 0.835em; color: #34383E; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 1px; top: 0.6em; width: 5px; height: 5px; border-radius: 50%; background: ${a}; }
    .chip-row { display: flex; flex-wrap: wrap; gap: ${4 * d}px 6px; }
    .chip { font-size: 0.78em; background: #F1F4F8; color: #333940; padding: 4px 11px; border-radius: 999px; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 22px; font-size: 0.84em; }
    .lang-level { color: #6B7078; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'chips' })}
  `,
});
