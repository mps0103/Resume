import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Ink-dark masthead with the accent used only for section headings. The dark
 * block is capped in height because a home printer renders large solid fills
 * badly and it costs real toner.
 */
export const slateTemplate = makeTemplate({
  id: 'slate',
  name: 'Slate',
  blurb: 'Dark masthead, accent kept for the headings alone.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#2F5D50', '#1F3A5F', '#8A4B2A', '#5B4B8A'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.5; }
    .page { padding: 0 0 ${40 * d}px; }
    .band { background: #1C2127; color: #fff; padding: ${30 * d}px ${46 * d}px ${24 * d}px;
      border-bottom: 4px solid ${a}; }
    .name { font-size: 2em; font-weight: 600; letter-spacing: -0.02em; margin: 0; color: #fff; }
    /* The accent is picked for legibility on white, so on the dark band it
       would sit at roughly 2:1 against #1C2127. The band uses white text and
       the accent does its work on the rule and the section headings. */
    .headline { font-size: 0.88em; margin: ${5 * d}px 0 0; color: rgba(255,255,255,0.9); font-weight: 600; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 15px; font-size: 0.76em; margin-top: ${10 * d}px; color: rgba(255,255,255,0.72); }
    .content { padding: ${22 * d}px ${46 * d}px 0; }
    .summary { font-size: 0.86em; color: #3A3E44; margin: 0 0 ${4 * d}px; }
    .section { margin-top: ${19 * d}px; }
    .section > h2 { font-size: 0.78em; font-weight: 700; letter-spacing: 0.11em; text-transform: uppercase;
      color: ${a}; margin: 0 0 ${9 * d}px; }
    .entry { margin-bottom: ${12 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .entry-title { font-size: 0.89em; font-weight: 700; color: #1C2127; }
    .entry-dates { font-size: 0.74em; color: #6B7078; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.82em; color: #565B61; }
    .bullets { margin-top: ${4 * d}px; }
    .bullets li { position: relative; padding-left: 12px; font-size: 0.835em; color: #34383E; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 0; top: 0.6em; width: 6px; height: 1.5px; background: ${a}; }
    .skill-row { display: flex; gap: 10px; font-size: 0.84em; margin-bottom: ${4 * d}px; }
    .skill-group { min-width: 102px; font-weight: 700; color: #1C2127; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 24px; font-size: 0.84em; }
    .lang-level { color: #6B7078; margin-left: 5px; }
    `;
  },
  body: r => `
    <div class="band">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</div>
    <div class="content">
      ${summaryHtml(r)}
      ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
    </div>
  `,
});
