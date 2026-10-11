import { makeTemplate, headlineHtml, nameHtml, summaryHtml } from './makeTemplate';
import { contactStackHtml, sectionsHtml } from './blocks';
import { esc } from './base';

/**
 * Two columns: contact, skills, languages and certifications on the left;
 * the narrative sections on the right.
 *
 * Marked atsSafe: false deliberately. A parser reads the PDF text stream in
 * order, and a side-by-side layout interleaves the two columns into
 * nonsense. The gallery warns about this before the user picks it.
 */
function sidebarCss(r: any, side: 'left' | 'right'): string {
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
  .shell { display: flex; flex-direction: ${side === 'left' ? 'row' : 'row-reverse'}; flex: 1; min-height: 0; }
  .aside { width: 232px; flex: 0 0 232px; background: ${a}; color: #fff; padding: ${34 * d}px ${24 * d}px; }
  .main { flex: 1; padding: ${34 * d}px ${30 * d}px; min-width: 0; }

  .name { font-size: 1.42em; font-weight: 600; line-height: 1.15; margin: 0; color: #fff; }
  .headline { font-size: 0.82em; color: rgba(255,255,255,0.82); margin: ${6 * d}px 0 0; }
  .contact-stack { margin-top: ${16 * d}px; font-size: 0.75em; color: rgba(255,255,255,0.88); }
  .contact-stack div { margin-bottom: ${4 * d}px; word-break: break-word; }

  .aside .section { margin-top: ${20 * d}px; }
  .aside .section > h2 { font-size: 0.74em; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.7); margin: 0 0 ${8 * d}px; padding-bottom: ${4 * d}px; border-bottom: 1px solid rgba(255,255,255,0.22); }
  .aside .skill-row { font-size: 0.78em; margin-bottom: ${5 * d}px; }
  .aside .skill-group { font-weight: 700; color: rgba(255,255,255,0.95); margin-bottom: 1px; }
  .aside .skill-values { color: rgba(255,255,255,0.8); }
  .aside .lang-grid { display: block; font-size: 0.78em; }
  .aside .lang { margin-bottom: ${3 * d}px; color: rgba(255,255,255,0.9); }
  .aside .lang-level { color: rgba(255,255,255,0.65); margin-left: 5px; }
  .aside .entry { margin-bottom: ${8 * d}px; }
  .aside .entry-title { font-size: 0.79em; font-weight: 700; color: #fff; }
  .aside .entry-sub, .aside .entry-dates { font-size: 0.74em; color: rgba(255,255,255,0.72); }
  .aside .entry-head { display: block; }

  .main .summary { font-size: 0.85em; color: #3A3E44; margin: 0; }
  /* The declaration is a sibling of the columns rather than a child of
     .main, so the column's spacing and heading treatment are extended to
     it by name instead of being inherited. */
  .main .section, .declaration { margin-top: ${18 * d}px; }
  .declaration { padding: 0 ${30 * d}px ${34 * d}px; }
  .main .section > h2, .declaration > h2 { font-size: 0.8em; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: ${a}; margin: 0 0 ${9 * d}px; padding-bottom: ${4 * d}px; border-bottom: 1px solid #E1E5EA; }
  .main .entry { margin-bottom: ${12 * d}px; }
  .main .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .main .entry-title { font-size: 0.89em; font-weight: 700; }
  .main .entry-dates { font-size: 0.74em; color: #6B7078; white-space: nowrap; }
  .main .entry-sub { font-size: 0.82em; color: #565B61; }
  .main .bullets { margin-top: ${4 * d}px; }
  .main .bullets li { position: relative; padding-left: 12px; font-size: 0.83em; color: #34383E; margin-bottom: ${3 * d}px; }
  .main .bullets li::before { content: ""; position: absolute; left: 0; top: 0.62em; width: 4px; height: 4px; border-radius: 50%; background: ${a}; }
  `;
}

const ASIDE_TYPES = ['skills', 'languages', 'certifications'] as const;

function sidebarBody(r: any): string {
  return `
  <div class="shell">
  <div class="aside">
    ${nameHtml(r)}${headlineHtml(r)}${contactStackHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows', only: [...ASIDE_TYPES] })}
  </div>
  <div class="main">
    ${summaryHtml(r)}
    ${sectionsHtml(r, { entryStyle: 'head', skillStyle: 'rows', except: [...ASIDE_TYPES] })}
  </div>
  </div>`;
}

export const sidebarTemplate = makeTemplate({
  id: 'sidebar',
  name: 'Sidebar',
  blurb: 'Contact and skills in a colour column on the left.',
  tier: 'premium',
  atsSafe: false,
  onePageOnly: true,
  accents: ['#1F3A5F', '#2F5D50', '#463157', '#333A42'],
  css: r => sidebarCss(r, 'left'),
  body: sidebarBody,
});

export const sidebarRightTemplate = makeTemplate({
  id: 'sidebar-right',
  name: 'Sidebar Right',
  blurb: 'The same split, mirrored. Puts your history first on the page.',
  tier: 'premium',
  atsSafe: false,
  onePageOnly: true,
  accents: ['#2F5D50', '#1F3A5F', '#6B3F2A'],
  css: r => sidebarCss(r, 'right'),
  body: sidebarBody,
});
