import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * The summary is the hero: set large, above everything, with the name small
 * beneath it. Built for career changers, where the pitch matters more than
 * the job titles. It fails badly with no summary written, so the gallery
 * thumbnail will look empty until one exists — that is honest feedback.
 */
export const spotlightTemplate = makeTemplate({
  id: 'spotlight',
  name: 'Spotlight',
  blurb: 'Leads with your summary, not your job title. For career changers.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1F3A5F', '#6B3F2A', '#2F5D50'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Helvetica, Arial, sans-serif; color: #23262B; line-height: 1.5; }
    .page { padding: ${48 * d}px ${52 * d}px; }
    .summary { font-family: "Noto Serif", Georgia, serif; font-size: 1.28em; line-height: 1.45;
      color: #1B1E22; margin: 0 0 ${20 * d}px; max-width: 34em; }
    .masthead { padding-bottom: ${14 * d}px; border-bottom: 1px solid #D8DCE1; }
    .name { font-size: 1.05em; font-weight: 700; letter-spacing: 0.02em; margin: 0; }
    .headline { font-size: 0.82em; color: ${a}; margin: ${2 * d}px 0 0; font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 14px; font-size: 0.75em; color: #6A7078; margin-top: ${7 * d}px; }
    .section { margin-top: ${20 * d}px; }
    .section > h2 { font-size: 0.75em; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
      color: #99A0A8; margin: 0 0 ${10 * d}px; }
    .entry { margin-bottom: ${13 * d}px; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; }
    .entry-title { font-size: 0.9em; font-weight: 700; }
    .entry-dates { font-size: 0.74em; color: #99A0A8; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .entry-sub { font-size: 0.83em; color: #6A7078; }
    .bullets { margin-top: ${5 * d}px; }
    .bullets li { position: relative; padding-left: 12px; font-size: 0.845em; color: #383C42; margin-bottom: ${3 * d}px; }
    .bullets li::before { content: ""; position: absolute; left: 0; top: 0.62em; width: 4px; height: 4px; border-radius: 50%; background: ${a}; }
    .skill-row { display: flex; gap: 10px; font-size: 0.845em; margin-bottom: ${4 * d}px; }
    .skill-group { min-width: 104px; color: #99A0A8; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${4 * d}px 24px; font-size: 0.845em; }
    .lang-level { color: #99A0A8; margin-left: 5px; }
    `;
  },
  body: r => `
    ${summaryHtml(r)}
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
