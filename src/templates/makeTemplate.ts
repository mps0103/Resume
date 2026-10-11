import { Resume } from '../types/resume';
import { PAGE_DIMENSIONS, baseCss, esc, htmlDocument } from './base';
import { declarationHtml } from './blocks';
import { ResumeTemplate, RenderOptions, TemplateTier } from './types';

export interface TemplateSpec {
  id: string;
  name: string;
  blurb: string;
  tier: TemplateTier;
  atsSafe: boolean;
  onePageOnly?: boolean;
  supportsPhoto?: boolean;
  accents: string[];
  /** Appearance only. baseCss is prepended automatically. */
  css: (resume: Resume, opts: RenderOptions) => string;
  body: (resume: Resume, opts: RenderOptions) => string;
}

/**
 * Free-tier attribution, once after the last line of the document.
 *
 * Deliberately not position:fixed — Chromium print repeats a fixed element on
 * every page while reserving no space for it, so it lands on top of body
 * text. It is not absolutely positioned either: once print margins moved to
 * @page, .page has no padding left to hold an absolute element clear of the
 * content, and it would sit on the final entry.
 *
 * In normal flow it simply follows the content, which cannot overlap anything
 * and needs no reserved space.
 */
export function watermarkCss(color = '#9AA0A8'): string {
  return `
  .page::after {
    content: "Made with Resume Builder by MPS";
    display: block;
    margin-top: 30px;
    text-align: right;
    font-size: 9px;
    letter-spacing: 0.04em;
    color: ${color};
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /*
    Bottom right corner of the printed page.

    bottom:0 puts it on the last line of the page's content box. A negative
    offset does NOT push it into the bottom margin as you might expect —
    Chromium treats it as overflowing the page area and spills it onto the
    top of the following sheet, which is exactly where it wrongly appeared
    before. Keep this at zero.

    Clearance from body text comes from @page reserving a deeper bottom
    margin instead, which text never enters.

    right:0 with text-align:right lands it on the same vertical line as the
    right-hand edge of the text above it.
  */
  @media print {
    .page::after {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      margin-top: 0;
      text-align: right;
    }
  }`;
}

export function makeTemplate(spec: TemplateSpec): ResumeTemplate {
  return {
    id: spec.id,
    name: spec.name,
    blurb: spec.blurb,
    tier: spec.tier,
    atsSafe: spec.atsSafe,
    onePageOnly: spec.onePageOnly,
    supportsPhoto: spec.supportsPhoto ?? false,
    accents: spec.accents,
    render(resume: Resume, opts: RenderOptions): string {
      const css = [
        baseCss(resume.style),
        spec.css(resume, opts),
        // Watermark rules come last so a template cannot restyle them.
        opts.watermark ? watermarkCss() : '',
      ].join('\n');
      return htmlDocument({
        css,
        // Appended here rather than inside each template's body so that every
        // design gains the declaration at once, and no design can forget it.
        // It lands after any column shell, which is where a full-width
        // closing block belongs on a two-column layout.
        body: spec.body(resume, opts) + declarationHtml(resume),
        // Preview is laid out at true page width so the viewer can fit and
        // zoom it. Export must not be: the paper size comes from the PDF.
        viewportWidth:
          opts.mode === 'preview'
            ? PAGE_DIMENSIONS[resume.style.pageSize].width
            : undefined,
        title: `${resume.basics.fullName || 'Resume'} \u2014 ${resume.title}`,
      });
    },
  };
}

/** Shared masthead variants, so name typography stays consistent per family. */
export function nameHtml(resume: Resume, cls = 'name'): string {
  return `<h1 class="${cls}">${esc(resume.basics.fullName || 'Your name')}</h1>`;
}

export function headlineHtml(resume: Resume, cls = 'headline'): string {
  const h = resume.basics.headline;
  return h.trim() ? `<p class="${cls}">${esc(h)}</p>` : '';
}

export function summaryHtml(resume: Resume, cls = 'summary'): string {
  const s = resume.summary;
  return s.trim() ? `<p class="${cls}">${esc(s)}</p>` : '';
}
