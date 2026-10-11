import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Centred headings over a narrow measure. Entry text stays left-aligned —
 * centring body copy destroys the ragged left edge the eye uses to find the
 * next line, which is why only the headings are centred here.
 */
export const centeredTemplate = makeTemplate({
  id: 'centered',
  name: 'Centred',
  blurb: 'Centred headings, narrow measure. Calm and symmetrical.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#2F5D50', '#3B3B3B'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Helvetica, Arial, sans-serif; color: #23262B; line-height: 1.55; }
    .page { padding: ${52 * d}px ${78 * d}px; }
    .masthead { text-align: center; padding-bottom: ${16 * d}px; }
    .name { font-size: 1.75em; font-weight: 600; letter-spacing: 0.02em; margin: 0; }
    .headline { font-size: 0.88em; color: ${a}; margin: ${5 * d}px 0 0; font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; justify-content: center; gap: 0 14px; font-size: 0.77em; color: #6A7078; margin-top: ${9 * d}px; }
    .summary { font-size: 0.86em; color: #3A3E44; margin: 0 0 ${4 * d}px; text-align: center; }
    .section { margin-top: ${22 * d}px; }
    .section > h2 { font-size: 0.76em; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
      color: ${a}; margin: 0 0 ${12 * d}px; text-align: center; }
    /* A short centred rule under the heading, not a full-width one. */
    .section > h2::after { content: ""; display: block; width: 34px; height: 1.5px; background: ${a};
      margin: ${6 * d}px auto 0; }
    .entry { margin-bottom: ${14 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; }
    .entry-title { font-size: 0.89em; font-weight: 600; }
    .entry-dates { font-size: 0.75em; color: #8A9099; white-space: nowrap; }
    .entry-sub { font-size: 0.82em; color: #6A7078; }
    .bullets { margin-top: ${5 * d}px; }
    .bullets li { font-size: 0.84em; color: #383C42; margin-bottom: ${4 * d}px; }
    .skill-row { display: flex; gap: 10px; font-size: 0.84em; margin-bottom: ${4 * d}px; justify-content: center; }
    .skill-group { font-weight: 600; }
    .lang-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: ${4 * d}px 22px; font-size: 0.84em; }
    .lang-level { color: #8A9099; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
