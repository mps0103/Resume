import { allTemplates, freeTemplates, getTemplate } from '../templates/registry';
import { sampleResume, createResume } from '../data/factory';

/**
 * Inventory guard. These assert the shipped feature set rather than any one
 * behaviour, so a template or a tier silently disappearing in a refactor
 * fails the build instead of being noticed on the store listing.
 */
describe('shipped inventory', () => {
  const t = allTemplates();

  it('ships 101 designs', () => {
    // 31 hand-built plus the 70 generated pairings.
    expect(t.length).toBe(101);
  });

  /**
   * The store listing and the paywall both say "100+ designs". If a refactor
   * ever drops the catalogue below that, the claim becomes false everywhere
   * it is printed, so it fails the build here rather than in review.
   */
  it('backs up the 100+ designs claim', () => {
    expect(t.length).toBeGreaterThanOrEqual(100);
  });

  it('keeps the free and premium split', () => {
    expect(freeTemplates().length).toBe(5);
    expect(t.filter(x => x.tier === 'premium').length).toBe(96);
  });

  it('keeps every two-column design flagged one-page', () => {
    const twoCol = t.filter(x => !x.atsSafe);
    // Three hand-built plus the five skins of the generated panel layout.
    expect(twoCol.length).toBe(8);
    expect(twoCol.every(x => x.onePageOnly)).toBe(true);
  });

  it('renders every design with real content', () => {
    const r = sampleResume();
    for (const tpl of t) {
      const html = tpl.render(r, { mode: 'preview' });
      expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
      expect(html).toContain('Jane Doe');
      expect(html.length).toBeGreaterThan(2000);
    }
  });

  it('renders every design with an empty resume', () => {
    const r = createResume();
    for (const tpl of t) {
      expect(() => tpl.render(r, { mode: 'preview' })).not.toThrow();
    }
  });

  it('falls back rather than throwing on a removed template', () => {
    expect(getTemplate('removed-in-a-later-version').id).toBe('classic');
  });
});
