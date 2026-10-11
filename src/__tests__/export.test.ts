import { sampleResume, createResume } from '../data/factory';
import {
  PAGE_DIMENSIONS,
  PAGE_POINTS,
  PRINT_MARGIN,
  estimatedLength,
  looksMultiPage,
} from '../templates/base';
import { allTemplates, getTemplate } from '../templates/registry';

describe('page size', () => {
  /**
   * The converter turns whatever it is given into mils with `width * 1000 /
   * 72`, so these must be PostScript points. Passing the 96dpi CSS pixels
   * from PAGE_DIMENSIONS produced an 11 x 15.6 inch page instead of A4.
   */
  it('states A4 and Letter in points, not 96dpi pixels', () => {
    expect(PAGE_POINTS.A4).toEqual({ width: 595, height: 842 });
    expect(PAGE_POINTS.Letter).toEqual({ width: 612, height: 792 });
  });

  it.each(['A4', 'Letter'] as const)(
    'describes the same physical %s page in both units',
    size => {
      // Both tables hold integers, so each rounds the true page size slightly
      // differently. Half a millimetre apart is rounding; a third of an inch
      // apart is the 96dpi-for-72dpi mix-up this guards against.
      const TOLERANCE_INCHES = 0.02;

      const wideFromPx = PAGE_DIMENSIONS[size].width / 96;
      const wideFromPt = PAGE_POINTS[size].width / 72;
      expect(Math.abs(wideFromPt - wideFromPx)).toBeLessThan(TOLERANCE_INCHES);

      const tallFromPx = PAGE_DIMENSIONS[size].height / 96;
      const tallFromPt = PAGE_POINTS[size].height / 72;
      expect(Math.abs(tallFromPt - tallFromPx)).toBeLessThan(TOLERANCE_INCHES);
    },
  );

  it('keeps A4 within a millimetre of 210 x 297', () => {
    const mmWide = (PAGE_POINTS.A4.width / 72) * 25.4;
    const mmTall = (PAGE_POINTS.A4.height / 72) * 25.4;
    expect(Math.abs(mmWide - 210)).toBeLessThan(1);
    expect(Math.abs(mmTall - 297)).toBeLessThan(1);
  });

  it('keeps Letter at exactly 8.5 x 11 inches', () => {
    expect(PAGE_POINTS.Letter.width / 72).toBeCloseTo(8.5, 3);
    expect(PAGE_POINTS.Letter.height / 72).toBeCloseTo(11, 3);
  });
});

describe('preview viewport', () => {
  /**
   * Preview lays out at true page width and lets the viewer scale it down.
   *
   * The app used to do that scaling itself with a React Native transform
   * while the WebView's own scrolling was off, which split one job across
   * two owners: pinch-zoom still worked, but there was nothing left to pan,
   * so a zoomed page could not be scrolled to its top or bottom.
   */
  it('lays the preview out at the true page width', () => {
    const r = sampleResume();
    r.style.pageSize = 'A4';
    expect(getTemplate('classic').render(r, { mode: 'preview' })).toContain(
      'content="width=794"',
    );

    r.style.pageSize = 'Letter';
    expect(getTemplate('classic').render(r, { mode: 'preview' })).toContain(
      'content="width=816"',
    );
  });

  it('does that on every design, not just the hand-built ones', () => {
    for (const t of allTemplates()) {
      expect(t.render(sampleResume(), { mode: 'preview' })).toContain(
        'content="width=794"',
      );
    }
  });

  it('leaves the export viewport alone', () => {
    // The PDF's paper size comes from PAGE_POINTS. A page-width viewport in
    // the print pipeline would reintroduce a scale factor on top of it,
    // which is the bug that produced an 11 x 15.6 inch page once already.
    const html = getTemplate('classic').render(sampleResume(), {
      mode: 'export',
      watermark: false,
    });
    expect(html).toContain('width=device-width');
    expect(html).not.toContain('content="width=794"');
  });
});

describe('free-tier watermark', () => {
  const templates = allTemplates();

  it('carries the product name on every design', () => {
    for (const t of templates) {
      const html = t.render(sampleResume(), { mode: 'export', watermark: true });
      expect(html).toContain('Made with Resume Builder by MPS');
    }
  });

  it('is absent for Pro exports', () => {
    const html = getTemplate('classic').render(sampleResume(), {
      mode: 'export',
      watermark: false,
    });
    expect(html).not.toContain('Made with Resume Builder');
  });

  it('sits in the bottom right corner of every printed page', () => {
    const html = getTemplate('classic').render(sampleResume(), {
      mode: 'export',
      watermark: true,
    });
    // Chromium repeats a fixed element per page, which is what puts the
    // attribution at the foot of each one rather than after the last line.
    expect(html).toMatch(/@media print[\s\S]*?\.page::after\s*\{[^}]*position:\s*fixed/);
    expect(html).toMatch(/@media print[\s\S]*?\.page::after\s*\{[^}]*text-align:\s*right/);
  });

  it('is never given a negative bottom offset', () => {
    /**
     * Regression guard. A negative bottom looks like it should tuck the
     * footer into the page's bottom margin, but Chromium treats it as
     * overflowing the page area and moves it to the TOP of the following
     * sheet — which is where it wrongly printed on a two-page resume.
     * Clearance comes from the @page bottom margin instead.
     */
    const html = getTemplate('classic').render(sampleResume(), {
      mode: 'export',
      watermark: true,
    });
    // Anchored so it cannot match the screen-mode .page::after that appears
    // earlier in the stylesheet.
    const printBlock = html.match(/@media print\s*\{\s*\.page::after\s*\{([^}]*)\}/);
    expect(printBlock).not.toBeNull();
    expect(printBlock![1]).toMatch(/bottom:\s*0\s*;/);
    expect(printBlock![1]).not.toMatch(/bottom:\s*-/);
  });

  it('reserves a deeper bottom margin than top to hold it', () => {
    expect(parseFloat(PRINT_MARGIN.bottom)).toBeGreaterThan(
      parseFloat(PRINT_MARGIN.vertical),
    );
    // Still a resume margin, not a letterhead.
    expect(parseFloat(PRINT_MARGIN.bottom)).toBeLessThanOrEqual(1);
  });
});

describe('print margins', () => {
  const html = () =>
    getTemplate('classic').render(sampleResume(), { mode: 'export', watermark: false });

  /**
   * The bug this guards: .page padding only applies where the block starts
   * and ends, so a two-page resume got a top margin on page one, a bottom
   * margin on page two, and nothing at all on the inside edges.
   */
  it('declares margins through @page, which applies to every sheet', () => {
    expect(html()).toMatch(/@page\s*\{\s*margin:/);
  });

  it('uses margins inside the conventional resume range', () => {
    const inches = (v: string) => parseFloat(v);
    expect(inches(PRINT_MARGIN.vertical)).toBeGreaterThanOrEqual(0.5);
    expect(inches(PRINT_MARGIN.vertical)).toBeLessThanOrEqual(1);
    expect(inches(PRINT_MARGIN.horizontal)).toBeGreaterThanOrEqual(0.5);
    expect(inches(PRINT_MARGIN.horizontal)).toBeLessThanOrEqual(1);
  });

  it('drops the page padding and min-height in print', () => {
    // Left in place they would double the margins, and a block pinned to the
    // full page height inside a margin box pushes out a blank extra page.
    expect(html()).toMatch(/@media print\s*\{[^}]*body[^}]*\}\s*\.page\s*\{[^}]*padding:\s*0/);
    expect(html()).toMatch(/@media print[\s\S]*?\.page\s*\{[^}]*min-height:\s*0/);
  });

  it('keeps the on-screen padding for preview', () => {
    // Preview is one continuous scroll, not paged, so it still needs padding
    // to look like a sheet of paper.
    const preview = getTemplate('classic').render(sampleResume(), { mode: 'preview' });
    expect(preview).toMatch(/\.page\s*\{\s*padding:\s*\d/);
  });

  it('applies the same margins whatever the density', () => {
    const tight = sampleResume();
    tight.style.density = 0.86;
    const airy = sampleResume();
    airy.style.density = 1.14;

    const rule = (r: typeof tight) =>
      getTemplate('classic')
        .render(r, { mode: 'export', watermark: false })
        .match(/@page\s*\{\s*margin:[^}]*\}/)?.[0];

    expect(rule(tight)).toBe(rule(airy));
  });
});

describe('the sample resume', () => {
  it('is longer than a single page', () => {
    // The whole point of the sample is judging a design against real content.
    // A one-page sample cannot show pagination, page breaks, or how the
    // onePageOnly designs degrade.
    expect(looksMultiPage(sampleResume())).toBe(true);
  });

  it('is comfortably past the threshold, not balanced on it', () => {
    expect(estimatedLength(sampleResume())).toBeGreaterThan(35);
  });

  it('fills every section type, so no design renders an empty block', () => {
    const types = sampleResume()
      .sections.filter(s => s.visible)
      .map(s => s.type);
    expect(types).toEqual(
      expect.arrayContaining([
        'experience',
        'education',
        'skills',
        'projects',
        'certifications',
        'languages',
      ]),
    );
    for (const section of sampleResume().sections) {
      if (section.visible) expect(section.items.length).toBeGreaterThan(0);
    }
  });

  it('keeps section order contiguous from zero', () => {
    const orders = sampleResume()
      .sections.map(s => s.order)
      .sort((a, b) => a - b);
    expect(orders).toEqual(orders.map((_, i) => i));
  });

  it('still renders on every design without losing the extra pages', () => {
    for (const t of allTemplates()) {
      const html = t.render(sampleResume(), { mode: 'export', watermark: false });
      expect(html).toContain('Initech');
      expect(html).toContain('Professional Cloud Developer');
      expect(html).not.toContain('undefined');
    }
  });

  it('leaves a blank resume looking like one page', () => {
    expect(looksMultiPage(createResume())).toBe(false);
  });
});
