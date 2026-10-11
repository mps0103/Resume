import { createResume, sampleResume } from '../data/factory';
import {
  addItem, addSection, blankItem, moveItem, moveSection, removeItem,
  removeSection, renameSection, setBasics, toggleSectionVisible, updateItem,
  itemLabel, getSection,
} from '../data/mutations';
import { completeness } from '../services/completeness';

describe('section ordering', () => {
  it('moves a section and renumbers contiguously', () => {
    const r = createResume();
    const first = r.sections[0].id;
    const moved = moveSection(r, first, 1);
    expect(getSection(moved, first)!.order).toBe(1);
    expect(moved.sections.map(s => s.order).sort()).toEqual([0, 1, 2, 3]);
  });

  it('does nothing at either end', () => {
    const r = createResume();
    const top = r.sections.find(s => s.order === 0)!.id;
    const bottom = r.sections.find(s => s.order === r.sections.length - 1)!.id;
    expect(moveSection(r, top, -1).sections).toEqual(r.sections);
    expect(moveSection(r, bottom, 1).sections).toEqual(r.sections);
  });

  it('renumbers after a removal so no gap is left', () => {
    const r = removeSection(createResume(), createResume().sections[0].id);
    const orders = r.sections.map(s => s.order);
    expect(orders).toEqual(orders.map((_, i) => i));
  });
});

describe('items', () => {
  it('adds, updates and removes', () => {
    let r = createResume();
    const sec = r.sections[0].id;
    const item: any = blankItem('experience');
    r = addItem(r, sec, item);
    r = updateItem(r, sec, item.id, { role: 'Engineer' });
    expect((getSection(r, sec)!.items[0] as any).role).toBe('Engineer');
    r = removeItem(r, sec, item.id);
    expect(getSection(r, sec)!.items).toHaveLength(0);
  });

  it('reorders within a section', () => {
    let r = createResume();
    const sec = r.sections[0].id;
    const a: any = blankItem('experience');
    const b: any = blankItem('experience');
    r = addItem(addItem(r, sec, a), sec, b);
    r = moveItem(r, sec, b.id, -1);
    expect((getSection(r, sec)!.items[0] as any).id).toBe(b.id);
  });

  it('never leaves a row without a label while the user types', () => {
    for (const type of ['experience', 'education', 'skills', 'projects',
      'certifications', 'languages', 'custom'] as const) {
      expect(itemLabel(type, blankItem(type)).length).toBeGreaterThan(0);
    }
  });
});

describe('purity', () => {
  it('never mutates the resume it is given', () => {
    // The autosave hook compares by reference; an in-place edit silently
    // stops saving.
    const r = createResume();
    const before = JSON.stringify(r);
    setBasics(r, { fullName: 'X' });
    addSection(r, 'languages');
    toggleSectionVisible(r, r.sections[0].id);
    renameSection(r, r.sections[0].id, 'Renamed');
    expect(JSON.stringify(r)).toBe(before);
  });

  it('ignores operations on a section that is gone', () => {
    const r = createResume();
    expect(updateItem(r, 'missing', 'nope', { a: 1 })).toEqual(r);
    expect(moveItem(r, 'missing', 'nope', 1)).toEqual(r);
  });
});

describe('completeness', () => {
  it('scores an empty resume at zero and names the first step', () => {
    const c = completeness(createResume());
    expect(c.score).toBe(0);
    expect(c.nextStep).toBe('Add your name');
  });

  it('scores a filled resume highly', () => {
    expect(completeness(sampleResume()).score).toBeGreaterThan(0.8);
  });

  it('stays within bounds', () => {
    for (const r of [createResume(), sampleResume()]) {
      const s = completeness(r).score;
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });
});
