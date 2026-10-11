import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * For people with a lot of history who still want one page. Type is a step
 * smaller and vertical rhythm is tighter, but line-height stays above 1.35 —
 * below that a dense resume becomes genuinely hard to skim.
 */
export const compactTemplate = makeTemplate({
  id: 'compact',
  name: 'Compact',
  blurb: 'Tight spacing for long careers that still need one page.',
  tier: 'free',
  atsSafe: true,
  accents: ['#26303B', '#1F3A5F', '#40474F'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #232629; line-height: 1.38; font-size: ${15 * r.style.fontScale}px; }
    .page { padding: ${34 * d}px ${44 * d}px; }
    .name { font-size: 1.75em; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
    .headline { font-size: 0.88em; color: ${a}; margin: ${2 * d}px 0 0; font-weight: 600; }
    .contact { display: flex; flex-wrap: wrap; font-size: 0.76em; color: #565A5F; margin-top: ${7 * d}px; }
    .contact span { padding-right: 9px; margin-right: 9px; border-right: 1px solid #D5D8DC; }
    .contact span:last-child { border: 0; margin: 0; padding: 0; }
    .masthead { padding-bottom: ${9 * d}px; border-bottom: 1.5px solid ${a}; }
    .summary { font-size: 0.82em; color: #3B3F44; margin: ${9 * d}px 0 0; }
    .section { margin-top: ${13 * d}px; }
    .section > h2 { font-size: 0.8em; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${a}; margin: 0 0 ${6 * d}px; }
    .entry { margin-bottom: ${8 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .entry-title { font-size: 0.87em; font-weight: 700; }
    .entry-dates { font-size: 0.73em; color: #6E747B; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.8em; color: #565A5F; }
    .bullets { margin-top: ${3 * d}px; }
    .bullets li { position: relative; padding-left: 10px; font-size: 0.805em; color: #33373C; margin-bottom: ${1.5 * d}px; }
    .bullets li::before { content: "\\2013"; position: absolute; left: 0; color: ${a}; }
    .skill-row { display: flex; gap: 8px; font-size: 0.81em; margin-bottom: ${2.5 * d}px; }
    .skill-group { min-width: 92px; font-weight: 700; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${2 * d}px 20px; font-size: 0.81em; }
    .lang-level { color: #6E747B; margin-left: 4px; }
    `;
  },
  body: r => `
    <header class="masthead">
      ${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}
    </header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
