import { Resume, ResumeStyle, Section } from '../types/resume';

/** Every value that reaches the HTML string must pass through this. */
export function esc(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** 'YYYY-MM' -> 'Mar 2024'. Invalid or empty input returns ''. */
export function formatMonth(value: string): string {
  if (!value) return '';
  const [y, m] = value.split('-');
  const mi = parseInt(m, 10) - 1;
  if (!y || isNaN(mi) || mi < 0 || mi > 11) return esc(value);
  return `${MONTHS[mi]} ${y}`;
}

/** 'YYYY-MM-DD' -> '15 Sep 2026'. Anything unparseable is echoed escaped. */
export function formatDay(value: string): string {
  if (!value) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return esc(value);
  const mi = parseInt(m[2], 10) - 1;
  const day = parseInt(m[3], 10);
  if (mi < 0 || mi > 11 || day < 1 || day > 31) return esc(value);
  return `${day} ${MONTHS[mi]} ${m[1]}`;
}

export function dateRange(
  start: string,
  end: string,
  current: boolean,
): string {
  const s = formatMonth(start);
  const e = current ? 'Present' : formatMonth(end);
  if (!s && !e) return '';
  if (!s) return e;
  if (!e) return s;
  return `${s} \u2013 ${e}`;
}

/** Drops hidden and empty sections so templates never render bare headings. */
export function visibleSections(resume: Resume): Section[] {
  return resume.sections
    .filter(s => s.visible && s.items.length > 0)
    .sort((a, b) => a.order - b.order);
}

export const PAGE_DIMENSIONS = {
  A4: { width: 794, height: 1123 },      // 96dpi
  Letter: { width: 816, height: 1056 },
};

/**
 * The same two pages in PostScript points, at 72 per inch.
 *
 * These are NOT interchangeable with PAGE_DIMENSIONS. Those are CSS pixels at
 * 96dpi and describe how wide the HTML lays out; these describe the physical
 * paper. A4 is 8.27in either way — 794px at 96dpi, 595pt at 72dpi.
 *
 * Passing the 96dpi numbers to the PDF converter is what produced an 11 x
 * 15.6 inch page: react-native-html-to-pdf builds a PrintAttributes.MediaSize
 * with `width * 1000 / 72`, so whatever it is given is read as points.
 */
export const PAGE_POINTS = {
  A4: { width: 595, height: 842 },
  Letter: { width: 612, height: 792 },
};

/**
 * Printed margins, applied to every page.
 *
 * 0.75in on three sides sits in the middle of the conventional resume range
 * of 0.5in to 1in — tighter than 0.5in starts to read as cramped to a human
 * reader, and wider than 1in wastes a page most people are trying to fit
 * one screenful of career into.
 *
 * The bottom is deeper so the free-tier watermark has somewhere to sit at the
 * foot of the page without ever touching body text. On a Pro export it simply
 * reads as a slightly generous bottom margin.
 *
 * Deliberately not scaled by the density setting: density controls the rhythm
 * of the content, while the margin is a property of the paper, and a reader
 * flipping between an Airy and a Tight resume should not see the page edges
 * move.
 */
export const PRINT_MARGIN = {
  vertical: '0.75in',
  horizontal: '0.75in',
  bottom: '0.9in',
};

/**
 * Geometry and pagination rules shared by every template.
 * Templates supply appearance only; they must not override page padding,
 * break rules, or the .page wrapper, or pagination will drift between them.
 */
export function baseCss(style: ResumeStyle): string {
  const page = PAGE_DIMENSIONS[style.pageSize];
  const fs = style.fontScale;
  const d = style.density;
  return `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    width: ${page.width}px;
    -webkit-text-size-adjust: none;
    text-rendering: geometricPrecision;
    font-size: ${16 * fs}px;
  }
  .page {
    padding: ${44 * d}px ${52 * d}px ${40 * d}px;
    min-height: ${page.height}px;
  }

  /* Pagination. Entries stay whole; headings never strand at a page foot. */
  .entry, .chip-row, .contact { break-inside: avoid; page-break-inside: avoid; }
  .section > h2 { break-after: avoid; page-break-after: avoid; }
  li { break-inside: avoid; page-break-inside: avoid; }
  p, li { orphans: 2; widows: 2; }

  ul { margin: 0; padding: 0; list-style: none; }
  a { color: inherit; text-decoration: none; }

  /*
    Closing declaration.

    It carries .section and an h2 as well, so the heading picks up whatever
    treatment the design gives its other headings and the block does not
    read as bolted on. Only the parts no template has ever heard of — the
    signature rule, the place and date column — are styled here.

    Held together across a page break on purpose: a signature line stranded
    at the top of a page with its declaration on the previous one is worse
    than a short final page.
  */
  .declaration { break-inside: avoid; page-break-inside: avoid; }
  .decl-text { font-size: 0.85em; line-height: 1.55; margin: 0; max-width: 54em; }
  .decl-close {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 32px;
    margin-top: ${22 * d}px;
  }
  .decl-meta { font-size: 0.82em; line-height: 1.7; white-space: nowrap; }
  .decl-sign { text-align: right; }
  /* currentColor so the rule matches whatever text colour the design uses. */
  .sig-line {
    border-bottom: 1px solid currentColor;
    opacity: 0.4;
    height: ${24 * d}px;
    min-width: 168px;
    margin-bottom: 5px;
  }
  .sig-name { font-size: 0.82em; font-weight: 600; }
  .sig-caption { font-size: 0.72em; opacity: 0.6; margin-top: 2px; }

  /*
    Print and PDF margins.

    These have to come from @page, not from .page padding. Padding applies
    where a block starts and ends — so on a resume that runs to two pages the
    top padding lands on page one, the bottom padding on page two, and the
    second page begins hard against the paper edge with no top margin at all.
    @page is the only rule the print engine applies to every sheet.

    The .page padding is therefore zeroed for print, and min-height with it:
    a block forced to the full page height inside a margin box no longer fits,
    which pushes a blank page out of every single-page resume.
  */
  @page {
    margin: ${PRINT_MARGIN.vertical} ${PRINT_MARGIN.horizontal} ${PRINT_MARGIN.bottom};
  }

  @media print {
    body { width: auto; }
    .page { padding: 0; min-height: 0; }
  }
  `;
}

export function htmlDocument(opts: {
  css: string;
  body: string;
  title: string;
  /**
   * Lay the document out at this CSS width and let the viewer scale it down
   * to fit, rather than laying it out at the device width.
   *
   * Preview passes the true page width. That hands the whole job of fitting,
   * scrolling and pinch-zooming to the viewer, which does all three properly.
   * Scaling the page from the React Native side instead meant the app and
   * the WebView each owned half of it, and zooming in left nothing to pan.
   *
   * Export leaves this unset: the print pipeline sizes the paper from the
   * PDF page size, not from a viewport.
   */
  viewportWidth?: number;
}): string {
  const viewport = opts.viewportWidth
    ? `width=${opts.viewportWidth}`
    : 'width=device-width,initial-scale=1';
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="${viewport}">
<title>${esc(opts.title)}</title>
<style>${opts.css}</style>
</head><body><div class="page">${opts.body}</div></body></html>`;
}

/**
 * Rough weight of the document, used to decide whether it will run past one
 * page. Deliberately cheap: measuring properly means rendering, and this is
 * called on every keystroke in the gallery.
 */
export function estimatedLength(resume: Resume): number {
  let weight = resume.summary.trim() ? 2 : 0;
  for (const s of resume.sections) {
    if (!s.visible) continue;
    for (const item of s.items as any[]) {
      weight += 2;
      weight += (item.bullets ?? []).filter((b: string) => b.trim()).length;
    }
  }
  return weight;
}

export function looksMultiPage(resume: Resume): boolean {
  return estimatedLength(resume) > 26;
}

/**
 * A repeating page footer is not currently possible through this render
 * path. Chromium print repeats a position:fixed element on every page but
 * will not reserve space for it, so body text flows straight through the
 * footer on every page but the last. Revisit if the renderer changes or the
 * paginator in NOTES lands.
 */
