import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Section headings sit in a left label column and the content runs beside
 * them, so the page reads as two aligned bands rather than a stack. The
 * heading and its content stay in one DOM order, so it still parses.
 */
export const swissTemplate = makeTemplate({
  id: 'swiss',
  name: 'Swiss',
  blurb: 'Headings in a left label column, content aligned beside them.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1A1A1A', '#1F3A5F', '#B33A25'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Helvetica, Arial, sans-serif; color: #1D2024; line-height: 1.5; }
    .page { padding: ${46 * d}px ${48 * d}px; }
    .masthead { padding-bottom: ${16 * d}px; border-bottom: 3px solid ${a}; }
    .name { font-size: 2.15em; font-weight: 700; letter-spacing: -0.03em; line-height: 1.02; margin: 0; }
    .headline { font-size: 0.9em; color: ${a}; margin: ${6 * d}px 0 0; font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 18px; font-size: 0.76em; color: #5E646B; margin-top: ${10 * d}px; }
    .summary { font-size: 0.87em; color: #383C42; margin: ${16 * d}px 0 0 ${124 * d}px; }
    /* Heading and body sit side by side, but the heading still precedes its
       content in the markup, which is what a parser follows. */
    .section { display: flex; gap: ${20 * d}px; margin-top: ${20 * d}px; }
    .section > h2 { width: ${104 * d}px; flex: 0 0 ${104 * d}px; font-size: 0.76em; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: ${a}; margin: 0; padding-top: 3px; }
    .section-body { flex: 1; min-width: 0; }
    .entry { margin-bottom: ${12 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; }
    .entry-title { font-size: 0.9em; font-weight: 700; }
    .entry-dates { font-size: 0.74em; color: #767C84; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.83em; color: #5E646B; }
    .bullets { margin-top: ${4 * d}px; }
    .bullets li { position: relative; padding-left: 12px; font-size: 0.84em; color: #31353B; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 0; top: 0.6em; width: 6px; height: 1.5px; background: ${a}; }
    .skill-row { display: flex; gap: 10px; font-size: 0.84em; margin-bottom: ${4 * d}px; }
    .skill-group { min-width: 96px; font-weight: 700; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 24px; font-size: 0.84em; }
    .lang-level { color: #767C84; margin-left: 5px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows', bodyClass: 'section-body' })}
  `,
});
