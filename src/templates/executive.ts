import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Wide letterspaced name, hairline rules, generous margins. Built for a
 * short senior resume where the whitespace itself signals seniority; it
 * looks thin and awkward on a graduate's two-job history.
 */
export const executiveTemplate = makeTemplate({
  id: 'executive',
  name: 'Executive',
  blurb: 'Wide margins and hairline rules. Best for short, senior histories.',
  tier: 'premium',
  atsSafe: true,
  accents: ['#1A1A1A', '#1F3A5F', '#3E3226'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Helvetica, Arial, sans-serif; color: #23262B; line-height: 1.58; }
    .page { padding: ${62 * d}px ${70 * d}px; }
    .name { font-size: 1.6em; font-weight: 400; letter-spacing: 0.22em; text-transform: uppercase; margin: 0; color: ${a}; }
    .headline { font-size: 0.84em; letter-spacing: 0.08em; color: #767C83; margin: ${8 * d}px 0 0; }
    .contact { display: flex; flex-wrap: wrap; gap: 0 18px; font-size: 0.76em; color: #767C83; margin-top: ${14 * d}px; }
    .masthead { padding-bottom: ${18 * d}px; border-bottom: 1px solid #1A1A1A; }
    .summary { font-size: 0.88em; color: #383C42; margin: ${22 * d}px 0 0; }
    .section { margin-top: ${26 * d}px; }
    .section > h2 { font-size: 0.76em; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: ${a}; margin: 0 0 ${12 * d}px; }
    .entry { margin-bottom: ${17 * d}px; padding-bottom: ${15 * d}px; border-bottom: 1px solid #ECEEF1; }
    .entry:last-child { border-bottom: 0; padding-bottom: 0; margin-bottom: 0; }
    .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 18px; }
    .entry-title { font-size: 0.94em; font-weight: 600; }
    .entry-dates { font-size: 0.75em; letter-spacing: 0.05em; color: #8E949B; white-space: nowrap; }
    .entry-sub { font-size: 0.84em; color: #6C7279; margin-top: 2px; }
    .bullets { margin-top: ${8 * d}px; }
    .bullets li { font-size: 0.855em; color: #383C42; margin-bottom: ${5 * d}px; }
    .skill-row { display: flex; gap: 14px; font-size: 0.86em; margin-bottom: ${6 * d}px; }
    .skill-group { min-width: 120px; letter-spacing: 0.05em; color: #767C83; font-size: 0.9em; text-transform: uppercase; }
    .lang-grid { display: flex; flex-wrap: wrap; gap: ${5 * d}px 30px; font-size: 0.86em; }
    .lang-level { color: #8E949B; margin-left: 6px; }
    `;
  },
  body: r => `
    <header class="masthead">${nameHtml(r)}${headlineHtml(r)}${contactHtml(r)}</header>
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows' })}
  `,
});
