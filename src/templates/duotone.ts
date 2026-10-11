import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactStackHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * A tinted sidebar rather than a saturated one, so it costs far less ink
 * than the solid-fill designs and still survives a black-and-white print.
 * Two columns, so not parser-safe.
 */
export const duotoneTemplate = makeTemplate({
  id: 'duotone',
  name: 'Duotone',
  blurb: 'Soft tinted column. Prints well in black and white.',
  tier: 'premium',
  atsSafe: false,
  onePageOnly: true,
  accents: ['#1F3A5F', '#2F5D50', '#6B3F2A', '#463157'],
  css: r => {
    const a = esc(r.style.accent);
    const d = r.style.density;
    return `
    body { font-family: "Noto Sans", Arial, sans-serif; color: #23262B; line-height: 1.48; }

  /*
    .page is a column, and the two panels live in .shell inside it.

    They used to be direct children of .page with display:flex on .page
    itself. That broke the moment anything else was appended to the page:
    the closing declaration became a THIRD flex column, squeezing the main
    column down to one word per line and printing the declaration up the
    side of the resume. Anything that is not one of the two panels now
    lands below them as a full-width row, which is where a closing block
    belongs.

    .shell keeps flex:1 so the colour panel still runs to the foot of the
    page when there is room, exactly as it did when .page was the flex box.
  */
    .page { padding: 0; display: flex; flex-direction: column; }
    .shell { display: flex; flex: 1; min-height: 0; }
    .aside { width: 216px; flex: 0 0 216px; background: #F1F3F6; border-right: 3px solid ${a}; padding: ${32 * d}px ${22 * d}px; }
    .main { flex: 1; padding: ${32 * d}px ${30 * d}px; min-width: 0; }

    .name { font-size: 1.38em; font-weight: 700; line-height: 1.15; margin: 0; color: ${a}; }
    .headline { font-size: 0.8em; color: #5B6067; margin: ${5 * d}px 0 0; }
    .contact-stack { margin-top: ${14 * d}px; font-size: 0.74em; color: #4E545B; }
    .contact-stack div { margin-bottom: ${4 * d}px; word-break: break-word; }

    .aside .section { margin-top: ${18 * d}px; }
    .aside .section > h2 { font-size: 0.73em; font-weight: 700; letter-spacing: 0.11em; text-transform: uppercase; color: ${a}; margin: 0 0 ${7 * d}px; }
    .aside .skill-row { font-size: 0.77em; margin-bottom: ${5 * d}px; }
    .aside .skill-group { font-weight: 700; margin-bottom: 1px; }
    .aside .skill-values { color: #4E545B; }
    .aside .lang-grid { display: block; font-size: 0.77em; }
    .aside .lang { margin-bottom: ${3 * d}px; }
    .aside .lang-level { color: #757C84; margin-left: 5px; }
    .aside .entry { margin-bottom: ${7 * d}px; }
    .aside .entry-head { display: block; }
    .aside .entry-title { font-size: 0.78em; font-weight: 700; }
    .aside .entry-sub, .aside .entry-dates { font-size: 0.73em; color: #757C84; }

    .main .summary { font-size: 0.85em; color: #3A3E44; margin: 0; }
    /* The declaration sits below both columns rather than inside .main, so
       the column's spacing and heading treatment are extended to it here. */
    .main .section, .declaration { margin-top: ${18 * d}px; }
    .declaration { padding: 0 ${30 * d}px ${32 * d}px; }
    .main .section > h2, .declaration > h2 { font-size: 0.79em; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: ${a}; margin: 0 0 ${9 * d}px; }
    .main .entry { margin-bottom: ${12 * d}px; }
    .main .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .main .entry-title { font-size: 0.89em; font-weight: 700; }
    .main .entry-dates { font-size: 0.74em; color: #6B7078; white-space: nowrap; }
    .main .entry-sub { font-size: 0.82em; color: #565B61; }
    .main .bullets { margin-top: ${4 * d}px; }
    .main .bullets li { position: relative; padding-left: 12px; font-size: 0.83em; color: #34383E; margin-bottom: ${3 * d}px; }
    .main .bullets li::before { content: ""; position: absolute; left: 0; top: 0.6em; width: 5px; height: 1.5px; background: ${a}; }
    `;
  },
  body: r => `
    <div class="shell">
    <div class="aside">
      ${nameHtml(r)}${headlineHtml(r)}${contactStackHtml(r)}
      ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows', only: ['skills', 'languages', 'certifications'] })}
    </div>
    <div class="main">
      ${summaryHtml(r)}
      ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows', except: ['skills', 'languages', 'certifications'] })}
    </div>
    </div>
  `,
});
