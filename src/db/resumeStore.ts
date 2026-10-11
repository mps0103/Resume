import { open, type DB } from '@op-engineering/op-sqlite';
import { Resume, ResumeSummary, SCHEMA_VERSION } from '../types/resume';
import { migrate } from './migrations';

const DB_NAME = 'resumes.sqlite';

let db: DB | null = null;

/**
 * Metadata columns are duplicated out of the JSON blob purely so the list
 * screen can render without parsing every document. The blob stays the
 * source of truth — always write both in the same statement.
 *
 * Every call uses executeSync. These are single-row reads and writes against
 * a local file, and the editor's autosave path has to stay synchronous so a
 * pending write cannot interleave with a document switch.
 */
export function initDb(): DB {
  if (db) return db;
  db = open({ name: DB_NAME });
  db.executeSync(`
    CREATE TABLE IF NOT EXISTS resumes (
      id           TEXT PRIMARY KEY NOT NULL,
      title        TEXT NOT NULL,
      full_name    TEXT NOT NULL DEFAULT '',
      template_id  TEXT NOT NULL DEFAULT 'classic',
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL,
      schema_ver   INTEGER NOT NULL,
      data         TEXT NOT NULL
    );
  `);
  db.executeSync(
    `CREATE INDEX IF NOT EXISTS idx_resumes_updated ON resumes(updated_at DESC);`,
  );
  return db;
}

function conn(): DB {
  return db ?? initDb();
}

export function listResumes(): ResumeSummary[] {
  const { rows } = conn().executeSync(
    `SELECT id, title, full_name, template_id, updated_at
       FROM resumes ORDER BY updated_at DESC;`,
  );
  return (rows ?? []).map(r => ({
    id: String(r.id),
    title: String(r.title),
    fullName: String(r.full_name ?? ''),
    templateId: String(r.template_id ?? 'classic'),
    updatedAt: Number(r.updated_at),
  }));
}

export function getResume(id: string): Resume | null {
  const { rows } = conn().executeSync(
    `SELECT data, schema_ver FROM resumes WHERE id = ?;`,
    [id],
  );
  const row = rows?.[0];
  if (!row) return null;

  const parsed = JSON.parse(String(row.data)) as Resume;
  if (Number(row.schema_ver) !== SCHEMA_VERSION) {
    const upgraded = migrate(parsed, Number(row.schema_ver));
    saveResume(upgraded);
    return upgraded;
  }
  return parsed;
}

/** Upsert. Called on every autosave tick — keep it cheap. */
export function saveResume(resume: Resume): void {
  const updated = { ...resume, updatedAt: Date.now() };
  conn().executeSync(
    `INSERT INTO resumes
       (id, title, full_name, template_id, created_at, updated_at, schema_ver, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title       = excluded.title,
       full_name   = excluded.full_name,
       template_id = excluded.template_id,
       updated_at  = excluded.updated_at,
       schema_ver  = excluded.schema_ver,
       data        = excluded.data;`,
    [
      updated.id,
      updated.title,
      updated.basics.fullName,
      updated.templateId,
      updated.createdAt,
      updated.updatedAt,
      updated.schemaVersion,
      JSON.stringify(updated),
    ],
  );
}

/**
 * Renames without reading and rewriting the JSON blob. The title lives in
 * both the column and the document, so both are written here — letting them
 * drift would make the list show one name and the editor another.
 */
export function renameResume(id: string, title: string): void {
  const resume = getResume(id);
  if (!resume) return;
  saveResume({ ...resume, title });
}

export function deleteResume(id: string): void {
  conn().executeSync(`DELETE FROM resumes WHERE id = ?;`, [id]);
}

export function duplicateResume(source: Resume, newId: string): Resume {
  const copy: Resume = {
    ...source,
    id: newId,
    title: `${source.title} (copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveResume(copy);
  return copy;
}
