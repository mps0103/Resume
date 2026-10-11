import { createResume, sampleResume } from '../data/factory';
import { SCHEMA_VERSION } from '../types/resume';
import {
  BACKUP_FORMAT_VERSION,
  backupFileName,
  buildBackup,
  importSummary,
  parseBackup,
  planImport,
} from '../services/backupFormat';

/** Deterministic id source, so a clash is provably resolved and not lucky. */
function idSource(prefix = 'new') {
  let n = 0;
  return () => `${prefix}-${++n}`;
}

describe('round trip', () => {
  it('survives export and re-import unchanged', () => {
    const original = sampleResume();
    const json = JSON.stringify(buildBackup([original], '1.0.0'));

    const parsed = parseBackup(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const restored = parsed.backup.resumes[0];
    expect(restored.id).toBe(original.id);
    expect(restored.title).toBe(original.title);
    expect(restored.basics.fullName).toBe(original.basics.fullName);
    expect(restored.sections).toEqual(original.sections);
    expect(restored.style).toEqual(original.style);
  });

  it('keeps every resume, not just the first', () => {
    const many = [createResume('A'), createResume('B'), createResume('C')];
    const parsed = parseBackup(JSON.stringify(buildBackup(many, '1.0.0')));
    expect(parsed.ok && parsed.backup.resumes).toHaveLength(3);
  });

  it('stamps the envelope so a reader knows what it has', () => {
    const backup = buildBackup([createResume()], '1.2.3', 1_700_000_000_000);
    expect(backup.format).toBe('resume-builder-backup');
    expect(backup.formatVersion).toBe(BACKUP_FORMAT_VERSION);
    expect(backup.schemaVersion).toBe(SCHEMA_VERSION);
    expect(backup.appVersion).toBe('1.2.3');
    expect(backup.exportedAt).toBe(1_700_000_000_000);
  });
});

describe('rejecting files that are not backups', () => {
  it('refuses text that is not JSON', () => {
    const r = parseBackup('this is a pdf, not a backup');
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toBe('not-json');
  });

  it('refuses JSON without the marker', () => {
    const r = parseBackup(JSON.stringify({ resumes: [] }));
    expect(!r.ok && r.reason).toBe('not-a-backup');
  });

  it('refuses a backup written by a newer app', () => {
    const future = { ...buildBackup([createResume()], '9'), formatVersion: BACKUP_FORMAT_VERSION + 1 };
    const r = parseBackup(JSON.stringify(future));
    expect(!r.ok && r.reason).toBe('from-the-future');
  });

  it('refuses a backup with no usable resumes', () => {
    const empty = { ...buildBackup([], '1.0.0') };
    expect(parseBackup(JSON.stringify(empty)).ok).toBe(false);
  });

  it('never throws, whatever it is handed', () => {
    const nasty = ['', '[]', 'null', '{"format":"resume-builder-backup"}', '{'];
    for (const input of nasty) {
      expect(() => parseBackup(input)).not.toThrow();
      expect(parseBackup(input).ok).toBe(false);
    }
  });
});

describe('salvaging damaged entries', () => {
  it('drops entries with no id but keeps the rest', () => {
    const good = createResume('Keep me');
    const raw = {
      ...buildBackup([good], '1.0.0'),
      resumes: [good, { title: 'no id' }, null, 'a string'],
    };
    const parsed = parseBackup(JSON.stringify(raw));
    expect(parsed.ok && parsed.backup.resumes).toHaveLength(1);
    expect(parsed.ok && parsed.backup.resumes[0].title).toBe('Keep me');
  });

  it('fills missing fields rather than restoring something unusable', () => {
    const raw = {
      ...buildBackup([], '1.0.0'),
      resumes: [{ id: 'bare' }],
    };
    const parsed = parseBackup(JSON.stringify(raw));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const r = parsed.backup.resumes[0];
    expect(r.title).toBe('Untitled resume');
    expect(r.templateId).toBe('classic');
    expect(r.sections).toEqual([]);
    expect(r.basics.fullName).toBe('');
    expect(r.style.pageSize).toBe('A4');
  });

  it('drops a photo uri, which points at the old device', () => {
    const withPhoto = createResume();
    withPhoto.basics.photoUri = 'file:///storage/emulated/0/old-phone.jpg';
    const parsed = parseBackup(JSON.stringify(buildBackup([withPhoto], '1.0.0')));
    expect(parsed.ok && parsed.backup.resumes[0].basics.photoUri).toBeUndefined();
  });
});

describe('import never destroys existing work', () => {
  it('keeps ids when nothing clashes', () => {
    const backup = buildBackup([createResume('A')], '1.0.0');
    const plan = planImport(backup, new Set(), idSource());
    expect(plan.renamed).toBe(0);
    expect(plan.resumes[0].id).toBe(backup.resumes[0].id);
    expect(plan.resumes[0].title).toBe('A');
  });

  it('re-ids a clash instead of overwriting the resume already there', () => {
    const existing = createResume('On the device');
    const backup = buildBackup([existing], '1.0.0');

    const plan = planImport(backup, new Set([existing.id]), idSource(), 123);

    expect(plan.renamed).toBe(1);
    expect(plan.resumes[0].id).not.toBe(existing.id);
    expect(plan.resumes[0].title).toBe('On the device (imported)');
    expect(plan.resumes[0].createdAt).toBe(123);
  });

  it('does not collide two clashing entries with each other', () => {
    const a = createResume('A');
    const b = { ...createResume('B'), id: a.id };
    const plan = planImport(buildBackup([a, b], '1.0.0'), new Set([a.id]), idSource());

    expect(plan.renamed).toBe(2);
    expect(plan.resumes[0].id).not.toBe(plan.resumes[1].id);
  });

  it('skips over an id the generator hands back twice', () => {
    const existing = createResume('X');
    // A generator that repeats itself must not produce two rows with one id.
    let calls = 0;
    const repeating = () => (++calls < 3 ? 'taken' : 'free');
    const plan = planImport(
      buildBackup([existing], '1.0.0'),
      new Set([existing.id, 'taken']),
      repeating,
    );
    expect(plan.resumes[0].id).toBe('free');
  });

  it('stamps a schema version onto an entry that has none', () => {
    const raw = { ...buildBackup([], '1.0.0'), resumes: [{ id: 'x', title: 'T' }] };
    const parsed = parseBackup(JSON.stringify(raw));
    if (!parsed.ok) throw new Error('expected a valid backup');
    const plan = planImport(parsed.backup, new Set(), idSource());
    expect(plan.resumes[0].schemaVersion).toBe(SCHEMA_VERSION);
  });
});

describe('user-facing wording', () => {
  it('counts a clean restore', () => {
    const plan = { resumes: [createResume(), createResume()], renamed: 0 };
    expect(importSummary(plan)).toBe('2 resumes restored.');
  });

  it('says a single resume in the singular', () => {
    expect(importSummary({ resumes: [createResume()], renamed: 0 })).toBe('1 resume restored.');
  });

  it('explains what happened to clashes', () => {
    const summary = importSummary({ resumes: [createResume()], renamed: 1 });
    expect(summary).toContain('already existed');
    expect(summary).toContain('instead of replacing');
  });

  it('names the file by date so two backups do not collide in a folder', () => {
    expect(backupFileName(new Date(2026, 8, 12))).toBe('resume-builder-backup-2026-09-12.json');
  });
});
