import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * A gradient band behind the masthead, derived from the chosen accent rather
 * than a fixed pair, so every accent still produces a coherent header. Kept
 * shallow: a tall gradient is the first thing to look cheap in print.
 */
export const gradientHeadTemplate = makeTemplate({
  id: 'gradienthead',
  name: 'Gradient',
  blurb: 'A shallow gradient header drawn from your accent colour.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#2F5D50', '#463157', '#6B3F2A'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.5; }
    .page { padding: 0 0 ${40 * d}px; }
    .band { background: linear-gradient(105deg, ${a} 0%, ${a} 42%, rgba(0,0,0,0.18) 100%), ${a};
      color: #fff; padding: ${32 * d}px ${48 * d}px ${26 * d}px; }
    .name { font-size: 2.05em; font-weight: 600; letter-spacing: -0.02em; margin: 0; color: #fff; }
    .headline { font-size: 0.9em; margin: ${5 * d}px 0 0; color: rgba(255,255,255,0.86); font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 15px; font-size: 0.77em; margin-top: ${11 * d}px; color: rgba(255,255,255,0.82); }
    .content { padding: ${24 * d}px ${48 * d}px 0; }
    .summary { font-size: 0.86em; color: #3A3E44; margin: 0 0 ${4 * d}px; }
    .section { margin-top: ${19 * d}px; }
    .section > h2 { font-size: 0.79em; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      color: ${a}; margin: 0 0 ${9 * d}px; padding-bottom: ${4 * d}px; border-bottom: 1px solid #E2E5E9; }
    .entry { margin-bottom: ${12 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .entry-title { font-size: 0.89em; font-weight: 700; }
    .entry-dates { font-size: 0.74em; color: #6B7078; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.82em; color: #565B61; }
    .bullets { margin-top: ${4 * d}px; }
    .bullets li { position: relative; padding-left: 12px; font-size: 0.835em; color: #34383E; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 0; top: 0.62em; width: 4px; height: 4px; border-radius: 50%; background: ${a}; }
    .chip-row { display: flex; flex-wrap: wrap; gap: ${4 * d}px 6px; }
    .chip { font-size: 0.78em; background: #EFF2F6; color: #333940; padding: 3px 9px; border-radius: 3px; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 24px; font-size: 0.84em; }
    .lang-level { color: #6B7078; margin-left: 5px; }
    `;
  },
  body: r => `
    <div class="band">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</div>
    <div class="content">
      ${summaryHtml(r)}
      ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'chips' })}
    </div>
  `,
});
