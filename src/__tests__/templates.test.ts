import { createResume, sampleResume, uid } from '../data/factory';
import { allTemplates, getTemplate, freeTemplates } from '../templates/registry';
import { Resume } from '../types/resume';

const templates = allTemplates();

/** A resume containing every hostile thing a user can type. */
function hostileResume(): Resume {
  const r = sampleResume();
  r.basics.fullName = '<img src=x onerror="alert(1)">';
  r.basics.headline = 'Engineer & "Architect" <script>';
  r.summary = '"><script>bad()</script>';
  (r.sections[0].items[0] as any).role = '</h1><b>injected';
  (r.sections[0].items[0] as any).bullets = ['</ul><script>x()</script>'];
  return r;
}

describe('template registry', () => {
  it('ships the advertised number of designs', () => {
    expect(templates.length).toBeGreaterThanOrEqual(15);
  });

  it('has unique ids and names', () => {
    expect(new Set(templates.map(t => t.id)).size).toBe(templates.length);
    expect(new Set(templates.map(t => t.name)).size).toBe(templates.length);
  });

  it('always offers something on the free tier', () => {
    expect(freeTemplates().length).toBeGreaterThan(0);
  });

  it('falls back to classic for an unknown id', () => {
    // A resume can outlive a template that gets pulled, so this must never
    // throw — it is the difference between a fallback and a lost document.
    expect(getTemplate('deleted-template').id).toBe('classic');
  });

  it('keeps most designs parser-safe', () => {
    // A proportion rather than a fixed count: the catalogue grows, and what
    // matters is that column layouts stay a small minority of what the
    // gallery offers, not that there are exactly N of them.
    const unsafe = templates.filter(t => !t.atsSafe);
    expect(unsafe.length / templates.length).toBeLessThan(0.15);
  });

  it('marks every multi-column design as one-page', () => {
    // A column layout that runs past page one leaves a dead band; the
    // gallery warning depends on these two flags agreeing.
    for (const t of templates.filter(x => !x.atsSafe)) {
      expect(t.onePageOnly).toBe(true);
    }
  });
});

describe.each(templates.map(t => [t.name, t] as const))('%s', (_name, t) => {
  const full = sampleResume();
  const blank = createResume();

  it.each([['a full resume', full], ['an empty resume', blank]] as const)(
    'renders %s as a complete document',
    (_label, resume) => {
      const html = t.render(resume, { mode: 'preview' });
      expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
      expect(html).toContain('class="page"');
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('NaN');
    },
  );

  it('escapes anything a user can type', () => {
    const html = t.render(hostileResume(), { mode: 'preview' });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('</h1><b>injected');
    expect(html).toContain('&lt;');
  });

  it('watermarks a free export and not a paid one', () => {
    expect(t.render(full, { mode: 'export', watermark: true })).toContain(
      'Made with Resume Builder',
    );
    expect(t.render(full, { mode: 'export', watermark: false })).not.toContain(
      'Made with Resume Builder',
    );
  });

  it('honours the chosen accent', () => {
    const r = sampleResume();
    r.style.accent = '#AB12CD';
    expect(t.render(r, { mode: 'preview' })).toContain('#AB12CD');
  });

  it('omits sections that are hidden or empty', () => {
    const r = sampleResume();
    const skills = r.sections.find(s => s.type === 'skills')!;
    skills.visible = false;
    const html = t.render(r, { mode: 'preview' });
    expect(html).not.toContain('>Skills<');
  });

  it('survives a long resume without losing content', () => {
    const r = sampleResume();
    const exp: any = r.sections[0];
    for (let i = 0; i < 20; i++) {
      exp.items.push({
        id: uid(), role: `Role ${i}`, company: `Company ${i}`, location: 'Remote',
        startDate: '2010-01', endDate: '2014-01', current: false,
        bullets: [`Bullet for role ${i}`],
      });
    }
    const html = t.render(r, { mode: 'preview' });
    expect(html).toContain('Role 19');
    expect(html).toContain('Bullet for role 19');
  });

  it('responds to every style control', () => {
    // The Style screen is the only thing these fields feed, so if a template
    // ignores one the control silently does nothing for that design.
    const base = sampleResume();
    const tight = { ...base, style: { ...base.style, density: 0.86 } };
    const airy = { ...base, style: { ...base.style, density: 1.14 } };
    expect(t.render(tight, { mode: 'preview' })).not.toBe(
      t.render(airy, { mode: 'preview' }),
    );

    const small = { ...base, style: { ...base.style, fontScale: 0.92 } };
    const large = { ...base, style: { ...base.style, fontScale: 1.08 } };
    expect(t.render(small, { mode: 'preview' })).not.toBe(
      t.render(large, { mode: 'preview' }),
    );

    const letter = { ...base, style: { ...base.style, pageSize: 'Letter' as const } };
    expect(t.render(letter, { mode: 'preview' })).toContain('816px');
  });

  it('declares gallery metadata', () => {
    expect(t.blurb.length).toBeGreaterThan(10);
    expect(t.accents.length).toBeGreaterThan(0);
    expect(t.accents[0]).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
