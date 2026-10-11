import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Centred masthead, serif throughout, rules above and below the heading
 * block. Reads as a letterhead, which suits law, finance, government and
 * academia — places where an unconventional resume is a liability.
 */
export const formalTemplate = makeTemplate({
  id: 'formal',
  name: 'Formal',
  blurb: 'Centred letterhead in serif. For conservative fields.',
  tier: 'free',
  atsSafe: true,
  accents: ['#1B2A3A', '#3A2E22', '#2B2B2B'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Serif", Georgia, "Times New Roman", serif; color: #22252A; line-height: 1.52; }
    .page { padding: ${46 * d}px ${56 * d}px; }
    .masthead { text-align: center; padding-bottom: ${14 * d}px; border-bottom: 1px solid #C9CDD2; }
    .name { font-size: 2em; font-weight: 600; letter-spacing: 0.04em; margin: 0; }
    .headline { font-size: 0.9em; color: #5A6069; margin: ${5 * d}px 0 0; font-style: italic; }
    .contact { justify-content: center; display: flex; flex-wrap: wrap; font-size: 0.78em; color: #5A6069; margin-top: ${9 * d}px; }
    .contact span { padding: 0 9px; border-right: 1px solid #C9CDD2; }
    .contact span:last-child { border: 0; }
    .summary { font-size: 0.86em; margin: ${16 * d}px 0 0; text-align: justify; }
    .section { margin-top: ${20 * d}px; }
    .section > h2 { font-size: 0.86em; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: ${a}; text-align: center; margin: 0 0 ${10 * d}px; padding-bottom: ${4 * d}px; border-bottom: 1px solid #D9DDE1; }
    .entry { margin-bottom: ${13 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; }
    .entry-title { font-size: 0.91em; font-weight: 600; }
    .entry-dates { font-size: 0.78em; color: #6B7178; white-space: nowrap; }
    .entry-sub { font-size: 0.84em; color: #5A6069; font-style: italic; }
    .bullets { margin-top: ${5 * d}px; }
    .bullets li { position: relative; padding-left: 14px; font-size: 0.845em; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: "\\2014"; position: absolute; left: 0; color: #9BA1A8; }
    .skill-row { display: flex; gap: 10px; font-size: 0.85em; margin-bottom: ${4 * d}px; }
    .skill-group { min-width: 108px; font-weight: 600; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 26px; font-size: 0.85em; }
    .lang-level { color: #6B7178; margin-left: 5px; font-style: italic; }
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
