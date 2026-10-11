import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * A hairline frame around the page with the section headings notched into a
 * rule. The frame is inset rather than bleeding to the sheet edge, because a
 * full-bleed border is the first thing a home printer clips.
 */
export const outlineTemplate = makeTemplate({
  id: 'outline',
  name: 'Outline',
  blurb: 'A framed page with headings notched into the rule.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#2B2B2B', '#5A3A2E'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.5; }
    .page { padding: ${26 * d}px; }
    .frame { border: 1px solid ${a}; padding: ${28 * d}px ${30 * d}px; min-height: 100%; }
    .name { font-size: 1.85em; font-weight: 600; letter-spacing: -0.015em; margin: 0; }
    .headline { font-size: 0.88em; color: ${a}; margin: ${4 * d}px 0 0; font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 14px; font-size: 0.77em; color: #5B6067; margin-top: ${8 * d}px; }
    .masthead { padding-bottom: ${14 * d}px; }
    .summary { font-size: 0.85em; color: #3A3E44; margin: 0 0 ${4 * d}px; }
    .section { margin-top: ${18 * d}px; }
    /* The heading sits on the rule rather than above it. */
    .section > h2 { font-size: 0.78em; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      color: ${a}; margin: 0 0 ${10 * d}px; border-top: 1px solid #D7DBE0; padding-top: ${7 * d}px; }
    .entry { margin-bottom: ${11 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .entry-title { font-size: 0.88em; font-weight: 700; }
    .entry-dates { font-size: 0.74em; color: #6B7078; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.82em; color: #565B61; }
    .bullets { margin-top: ${4 * d}px; }
    .bullets li { position: relative; padding-left: 12px; font-size: 0.83em; color: #34383E; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 0; top: 0.6em; width: 5px; height: 1px; background: ${a}; }
    .skill-row { display: flex; gap: 10px; font-size: 0.83em; margin-bottom: ${4 * d}px; }
    .skill-group { min-width: 100px; font-weight: 700; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 24px; font-size: 0.83em; }
    .lang-level { color: #6B7078; margin-left: 5px; }
    `;
  },
  body: r => `
    <div class="frame">
      <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
      ${summaryHtml(r)}
      ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
    </div>
  `,
});
