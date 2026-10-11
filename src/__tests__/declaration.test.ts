import { createResume, sampleResume } from '../data/factory';
import { setDeclaration } from '../data/mutations';
import { migrate } from '../db/migrations';
import { formatDay } from '../templates/base';
import { allTemplates, getTemplate } from '../templates/registry';
import {
  DEFAULT_DECLARATION_TEXT,
  SCHEMA_VERSION,
  defaultDeclaration,
} from '../types/resume';

const render = (r = sampleResume(), id = 'classic') =>
  getTemplate(id).render(r, { mode: 'export', watermark: false });

/**
 * Anchored to the markup rather than the bare class name: baseCss declares
 * .sig-line and .sig-caption in every document whether the block renders or
 * not, so a plain substring check can never come back false.
 */
const SIGNATURE_RULE = '<div class="sig-line">';
const SIGNATURE_CAPTION = '<div class="sig-caption">';

describe('formatDay', () => {
  /**
   * Regression guard. The escapes in this function's regex were lost when the
   * file was written, leaving /^(d{4})-(d{2})-(d{2})$/ — which matches the
   * literal text "dddd-dd-dd" and nothing else. Every date fell through to
   * the escape-and-return path, so the declaration printed a raw "2026-01-15"
   * in both the PDF and the Word export.
   */
  it('turns an ISO date into something a human reads', () => {
    expect(formatDay('2026-01-15')).toBe('15 Jan 2026');
    expect(formatDay('2024-12-01')).toBe('1 Dec 2024');
  });

  it('is empty for an empty date', () => {
    expect(formatDay('')).toBe('');
  });

  it('echoes anything it cannot parse instead of inventing a date', () => {
    expect(formatDay('next Tuesday')).toBe('next Tuesday');
    expect(formatDay('2026-13-40')).toBe('2026-13-40');
    expect(formatDay('2026-01')).toBe('2026-01');
  });

  it('escapes what it echoes back', () => {
    expect(formatDay('<script>')).not.toContain('<script>');
  });
});

describe('declaration defaults', () => {
  it('is on for a new resume, with the standard wording', () => {
    const d = createResume().declaration;
    expect(d.enabled).toBe(true);
    expect(d.text).toBe(DEFAULT_DECLARATION_TEXT);
    expect(d.showSignatureLine).toBe(true);
  });

  it('starts with no personal detail filled in', () => {
    // A block that arrived pre-filled with a place or a date nobody typed
    // would be a factual claim the user never made.
    const d = createResume().declaration;
    expect(d.place).toBe('');
    expect(d.date).toBe('');
    expect(d.signatureName).toBe('');
  });

  it('reads as a declaration and not as a summary', () => {
    expect(DEFAULT_DECLARATION_TEXT.toLowerCase()).toContain('hereby declare');
    expect(DEFAULT_DECLARATION_TEXT.toLowerCase()).toContain('true and correct');
  });
});

describe('declaration migration', () => {
  it('gives a pre-declaration resume one instead of leaving it undefined', () => {
    const old: any = { ...createResume(), schemaVersion: 1 };
    delete old.declaration;
    const migrated = migrate(old, 1);
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrated.declaration).toEqual(defaultDeclaration());
  });

  it('keeps what the user already set', () => {
    const old: any = {
      ...createResume(),
      schemaVersion: 1,
      declaration: { enabled: false, place: 'Pune' },
    };
    const migrated = migrate(old, 1);
    expect(migrated.declaration.enabled).toBe(false);
    expect(migrated.declaration.place).toBe('Pune');
    // Anything the stored copy lacked is still filled in.
    expect(migrated.declaration.text).toBe(DEFAULT_DECLARATION_TEXT);
  });
});

describe('declaration rendering', () => {
  it('appears on every single design', () => {
    // It is emitted by makeTemplate rather than by each template, which is
    // the whole point: no design can be added that quietly lacks it.
    for (const t of allTemplates()) {
      expect(t.render(sampleResume(), { mode: 'export', watermark: false })).toContain(
        'Declaration',
      );
    }
  });

  it('prints the wording, the place and a readable date', () => {
    const html = render();
    expect(html).toContain(DEFAULT_DECLARATION_TEXT);
    expect(html).toContain('Place: Springfield');
    expect(html).toContain('Date: 15 Jan 2026');
    expect(html).not.toContain('2026-01-15');
  });

  it('disappears completely when switched off', () => {
    const r = setDeclaration(sampleResume(), { enabled: false });
    const html = render(r);
    expect(html).not.toContain('Declaration');
    expect(html).not.toContain(SIGNATURE_RULE);
  });

  it('signs with the resume name unless a different one is given', () => {
    expect(render()).toContain('Jane Doe');

    const r = setDeclaration(sampleResume(), { signatureName: 'J. A. Doe' });
    expect(render(r)).toContain('J. A. Doe');
  });

  it('labels the signature only when there is no name to label', () => {
    const blank = createResume();
    blank.declaration = { ...blank.declaration, enabled: true };
    expect(render(blank)).toContain('Signature');

    // With a name under the rule, a caption saying "Signature" is noise.
    expect(render()).not.toContain(SIGNATURE_CAPTION);
  });

  it('hides the place and date lines rather than printing empty labels', () => {
    const r = setDeclaration(sampleResume(), { place: '', date: '' });
    const html = render(r);
    expect(html).not.toContain('Place:');
    expect(html).not.toContain('Date:');
    // The signature still stands on its own.
    expect(html).toContain(SIGNATURE_RULE);
  });

  it('drops the signature rule when the user turns it off', () => {
    const r = setDeclaration(sampleResume(), { showSignatureLine: false });
    expect(render(r)).not.toContain(SIGNATURE_RULE);
  });

  it('renders nothing at all when enabled but entirely empty', () => {
    const r = createResume();
    r.declaration = {
      enabled: true,
      text: '',
      place: '',
      date: '',
      signatureName: '',
      showSignatureLine: false,
    };
    expect(render(r)).not.toContain('Declaration');
  });

  it('escapes what the user types into it', () => {
    const r = setDeclaration(sampleResume(), {
      text: '<script>alert(1)</script>',
      place: '"><b>Pune',
      signatureName: '<img src=x>',
    });
    const html = render(r);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;');
  });

  it('inherits the design heading style instead of bolting on its own', () => {
    // The block carries .section and an h2 so each design styles the heading
    // the same way it styles Experience. Losing that class is what would
    // make it look like a different document stapled to the end.
    expect(render()).toContain('class="section declaration"');
  });

  /**
   * Regression guard for the two-column designs.
   *
   * Sidebar, Sidebar Right and Duotone used to put `display: flex` on .page
   * itself with the two panels as its direct children. Appending the
   * declaration then made it a THIRD flex column: the main column collapsed
   * to roughly one word per line and the declaration printed up the side of
   * the resume. The panels now live in .shell, so anything appended to the
   * page lands below them as a full-width row.
   */
  it.each(['sidebar', 'sidebar-right', 'duotone'])(
    'puts the declaration below both columns on %s, not beside them',
    id => {
      const html = render(sampleResume(), id);
      const page = html.slice(html.indexOf('<div class="page">'));
      const shell = page.indexOf('<div class="shell">');
      const block = page.indexOf('<section class="section declaration"');

      expect(shell).toBeGreaterThan(-1);
      expect(block).toBeGreaterThan(-1);
      // The last tag closed before the declaration must be the shell, which
      // is only true when the declaration is its sibling rather than a
      // third panel inside it.
      expect(page.lastIndexOf('</div>', block)).toBeLessThan(block);
      expect(block).toBeGreaterThan(shell);
    },
  );

  it('never lays .page out as a row on any design', () => {
    // A row-direction page turns every appended block into another column.
    // A column-direction page stacks them, which is what the declaration
    // and anything added after it depend on.
    for (const t of allTemplates()) {
      const html = t.render(sampleResume(), { mode: 'preview' });
      for (const [, rule] of html.matchAll(/\.page\s*\{([^}]*)\}/g)) {
        if (/display:\s*flex/.test(rule)) {
          expect(rule).toMatch(/flex-direction:\s*column/);
        }
        expect(rule).not.toMatch(/flex-direction:\s*row/);
      }
    }
  });

  it('comes last, after everything else on the page', () => {
    // Anchored to the markup, not the word: ".declaration" also appears in
    // the stylesheet near the top of the document.
    const html = render();
    const block = html.indexOf('class="section declaration"');
    expect(block).toBeGreaterThan(html.indexOf('>Experience<'));
    expect(block).toBeGreaterThan(html.indexOf('>Languages<'));
  });
});
