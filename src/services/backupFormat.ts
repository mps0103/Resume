/**
 * The backup file format, and every decision about what to do with one.
 *
 * Deliberately free of react-native and database imports so it can be tested
 * directly — the risky part of backup is not the file I/O, it is deciding
 * what a half-valid file means and whether an import is allowed to touch
 * something the user already has. That logic lives here; services/backup.ts
 * does the I/O around it.
 */
import {
  DEFAULT_STYLE,
  Resume,
  SCHEMA_VERSION,
  defaultDeclaration,
  type Section,
} from '../types/resume';

/** Bumped only if the envelope changes — not when a resume's schema does. */
export const BACKUP_FORMAT_VERSION = 1;

const MAGIC = 'resume-builder-backup';

export interface BackupFile {
  format: typeof MAGIC;
  formatVersion: number;
  /** Resume schema version at the time of export, for diagnostics. */
  schemaVersion: number;
  exportedAt: number;
  appVersion: string;
  resumes: Resume[];
}

export type ParseResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; reason: 'not-json' | 'not-a-backup' | 'from-the-future' | 'empty'; message: string };

export function buildBackup(resumes: Resume[], appVersion: string, now = Date.now()): BackupFile {
  return {
    format: MAGIC,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now,
    appVersion,
    resumes,
  };
}

/**
 * A file the user picked by hand is the least trustworthy input in the app:
 * it can be any file on the device, an edited backup, or one written by a
 * newer build. Every failure has to be a message, never a throw — the caller
 * is a button press, and a crash here would look like the app eating a
 * restore.
 */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return {
      ok: false,
      reason: 'not-json',
      message: 'That file is not a Resume Builder backup.',
    };
  }

  if (!isRecord(raw) || raw.format !== MAGIC || !Array.isArray(raw.resumes)) {
    return {
      ok: false,
      reason: 'not-a-backup',
      message: 'That file is not a Resume Builder backup.',
    };
  }

  const formatVersion = Number(raw.formatVersion ?? 0);
  if (formatVersion > BACKUP_FORMAT_VERSION) {
    return {
      ok: false,
      reason: 'from-the-future',
      message:
        'That backup was made by a newer version of the app. Update Resume Builder and try again.',
    };
  }

  const resumes = raw.resumes.filter(isPlausibleResume).map(coerceResume);
  if (resumes.length === 0) {
    return {
      ok: false,
      reason: 'empty',
      message: 'That backup has no resumes in it.',
    };
  }

  return {
    ok: true,
    backup: {
      format: MAGIC,
      formatVersion,
      schemaVersion: Number(raw.schemaVersion ?? 0),
      exportedAt: Number(raw.exportedAt ?? 0),
      appVersion: String(raw.appVersion ?? ''),
      resumes,
    },
  };
}

/**
 * Whether an entry is worth trying to restore at all. Intentionally loose:
 * a resume missing its sections is still worth recovering for the name and
 * contact details, and coerceResume fills the rest. The bar is only that it
 * is an object with an id and a title.
 */
function isPlausibleResume(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && typeof value.id === 'string' && value.id.length > 0;
}

/**
 * Fills in anything the file is missing so the rest of the app can assume a
 * complete document. A backup edited by hand, or written before a field
 * existed, must not be able to crash a screen three taps later.
 */
function coerceResume(raw: Record<string, unknown>): Resume {
  const basics = isRecord(raw.basics) ? raw.basics : {};
  const style = isRecord(raw.style) ? raw.style : {};
  const declaration = isRecord(raw.declaration) ? raw.declaration : {};
  const now = Date.now();

  return {
    schemaVersion: Number(raw.schemaVersion ?? 0),
    id: String(raw.id),
    title: str(raw.title) || 'Untitled resume',
    createdAt: num(raw.createdAt, now),
    updatedAt: num(raw.updatedAt, now),
    basics: {
      fullName: str(basics.fullName),
      headline: str(basics.headline),
      email: str(basics.email),
      phone: str(basics.phone),
      location: str(basics.location),
      links: Array.isArray(basics.links) ? (basics.links as Resume['basics']['links']) : [],
      // A photo uri points at a file on the device the backup came from, so
      // it is meaningless here. Dropping it avoids a broken image that the
      // user cannot explain.
      photoUri: undefined,
    },
    summary: str(raw.summary),
    sections: Array.isArray(raw.sections) ? (raw.sections as Section[]) : [],
    templateId: str(raw.templateId) || 'classic',
    style: { ...DEFAULT_STYLE, ...style } as Resume['style'],
    // A backup written before the declaration existed restores with the
    // default block, switched on and empty — the same state a new resume
    // starts in, rather than a feature silently missing after a restore.
    declaration: { ...defaultDeclaration(), ...declaration } as Resume['declaration'],
  };
}

export interface ImportPlan {
  /** Resumes to write, with ids already resolved against what exists. */
  resumes: Resume[];
  /** How many arrived with an id that is already in the database. */
  renamed: number;
}

/**
 * Resolves a backup against the resumes already on the device.
 *
 * Nothing is ever overwritten. A backup restored onto a phone that already
 * has work on it is the one case where a wrong guess destroys data the user
 * cannot get back, so a clash becomes a second copy and the user decides
 * which to delete. "Restore" that silently replaced a newer resume with an
 * older one would be the worst bug this app could have.
 */
export function planImport(
  backup: BackupFile,
  existingIds: ReadonlySet<string>,
  newId: () => string,
  now = Date.now(),
): ImportPlan {
  let renamed = 0;
  const taken = new Set(existingIds);

  const resumes = backup.resumes.map(resume => {
    if (!taken.has(resume.id)) {
      taken.add(resume.id);
      return { ...resume, schemaVersion: resume.schemaVersion || SCHEMA_VERSION };
    }

    renamed++;
    let id = newId();
    while (taken.has(id)) id = newId();
    taken.add(id);

    return {
      ...resume,
      id,
      title: `${resume.title} (imported)`,
      createdAt: now,
      updatedAt: now,
      schemaVersion: resume.schemaVersion || SCHEMA_VERSION,
    };
  });

  return { resumes, renamed };
}

/** e.g. resume-builder-backup-2026-09-12.json */
export function backupFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `resume-builder-backup-${stamp}.json`;
}

/** Wording for the confirmation shown after a restore. */
export function importSummary(plan: ImportPlan): string {
  const n = plan.resumes.length;
  const noun = n === 1 ? 'resume' : 'resumes';
  if (plan.renamed === 0) return `${n} ${noun} restored.`;
  const copies = plan.renamed === 1 ? 'a copy' : 'copies';
  return `${n} ${noun} restored. ${plan.renamed} already existed and ${plan.renamed === 1 ? 'was' : 'were'} added as ${copies} instead of replacing what you have.`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
