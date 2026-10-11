import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Full-bleed accent band behind the masthead. The band is the one bold
 * element; everything below it stays quiet so the page does not fight
 * itself. Printing it costs ink, which is why the band is capped in height.
 */
export const bannerTemplate = makeTemplate({
  id: 'banner',
  name: 'Banner',
  blurb: 'A colour band across the top, quiet page beneath.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#2F5D50', '#6B3F2A', '#4A3A63'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.5; }
    .page { padding: 0 0 ${40 * d}px; }
    .band { background: ${a}; color: #fff; padding: ${34 * d}px ${52 * d}px ${28 * d}px; }
    .name { font-size: 2.1em; font-weight: 600; letter-spacing: -0.015em; margin: 0; color: #fff; }
    .headline { font-size: 0.92em; margin: ${5 * d}px 0 0; color: rgba(255,255,255,0.85); font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; font-size: 0.78em; margin-top: ${12 * d}px; color: rgba(255,255,255,0.82); }
    .contact span { padding-right: 11px; margin-right: 11px; border-right: 1px solid rgba(255,255,255,0.3); }
    .contact span:last-child { border: 0; margin: 0; padding: 0; }
    .content { padding: ${26 * d}px ${52 * d}px 0; }
    .summary { font-size: 0.87em; color: #3A3E44; margin: 0 0 ${6 * d}px; }
    .section { margin-top: ${20 * d}px; }
    .section > h2 { font-size: 0.82em; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: ${a}; margin: 0 0 ${9 * d}px; }
    .entry { margin-bottom: ${13 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; }
    .entry-title { font-size: 0.91em; font-weight: 700; }
    .entry-dates { font-size: 0.76em; color: #6B7078; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.84em; color: #55595F; }
    .bullets { margin-top: ${5 * d}px; }
    .bullets li { position: relative; padding-left: 13px; font-size: 0.845em; color: #34383E; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 2px; top: 0.62em; width: 4px; height: 4px; border-radius: 50%; background: ${a}; }
    .chip-row { display: flex; flex-wrap: wrap; gap: ${4 * d}px 6px; }
    .chip { font-size: 0.78em; background: #EEF1F5; color: #333940; padding: 3px 9px; border-radius: 3px; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 26px; font-size: 0.85em; }
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
