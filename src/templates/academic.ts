import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Hanging indents and a serif body, sized for a CV that runs several pages.
 * Section headings repeat the rule rather than a fill so page two does not
 * look like a different document.
 */
export const academicTemplate = makeTemplate({
  id: 'academic',
  name: 'Academic',
  blurb: 'Hanging indents and serif body. Suits multi-page CVs.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#2B2B2B', '#1B3B5F', '#43342A'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Serif", Georgia, serif; color: #22252A; line-height: 1.5; }
    .page { padding: ${48 * d}px ${54 * d}px; }
    .masthead { padding-bottom: ${12 * d}px; }
    .name { font-size: 1.8em; font-weight: 600; margin: 0; }
    .headline { font-size: 0.88em; color: #5A6069; margin: ${4 * d}px 0 0; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 16px; font-size: 0.78em; color: #5A6069; margin-top: ${8 * d}px; }
    .summary { font-size: 0.86em; margin: ${12 * d}px 0 0; }
    .section { margin-top: ${20 * d}px; }
    .section > h2 { font-size: 0.88em; font-weight: 600; color: ${a}; margin: 0 0 ${9 * d}px; padding-bottom: ${3 * d}px; border-bottom: 1.5px solid ${a}; }
    /* Hanging indent: the title sits flush and everything under it steps in,
       which is how citation-heavy documents are conventionally set. */
    .entry { margin-bottom: ${12 * d}px; padding-left: ${18 * d}px; text-indent: ${-18 * d}px; }
    .entry-head { display: block; }
    .entry-title { font-size: 0.9em; font-weight: 600; display: inline; }
    .entry-dates { font-size: 0.82em; color: #6B7178; display: inline; }
    .entry-dates::before { content: " \\2014 "; }
    .entry-sub { font-size: 0.84em; color: #5A6069; font-style: italic; text-indent: 0; margin-top: 1px; }
    .bullets { margin-top: ${4 * d}px; text-indent: 0; }
    .bullets li { position: relative; padding-left: 13px; font-size: 0.84em; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: "\\2022"; position: absolute; left: 2px; color: #9BA1A8; }
    .skill-row { display: flex; gap: 10px; font-size: 0.85em; margin-bottom: ${4 * d}px; }
    .skill-group { min-width: 116px; font-weight: 600; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 26px; font-size: 0.85em; }
    .lang-level { color: #6B7178; margin-left: 5px; font-style: italic; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
