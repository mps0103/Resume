import {
  Resume,
  SCHEMA_VERSION,
  DEFAULT_STYLE,
  defaultDeclaration,
} from '../types/resume';

type Migration = (r: any) => any;

/**
 * Key n upgrades a document from version n to n+1.
 * Migrations run in order and must never throw on partial data — a user's
 * only copy of their resume is on their device.
 */
const MIGRATIONS: Record<number, Migration> = {
  // 0: pre-release documents that predate the style block.
  0: (r: any) => ({
    ...r,
    style: { ...DEFAULT_STYLE, ...(r.style ?? {}) },
    schemaVersion: 1,
  }),

  // 1: documents written before the closing declaration existed.
  //
  // It arrives switched ON, matching a new resume, because the block is a
  // convention users expect to be there rather than a feature they opted
  // into. It is empty of personal detail — no place, no date, no typed
  // signature — so it reads as a template prompt on an existing resume
  // rather than as content nobody wrote.
  1: (r: any) => ({
    ...r,
    declaration: { ...defaultDeclaration(), ...(r.declaration ?? {}) },
    schemaVersion: 2,
  }),
};

export function migrate(resume: Resume, fromVersion: number): Resume {
  let doc: any = resume;
  let v = fromVersion;
  while (v < SCHEMA_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) {
      // Unknown gap: stamp it forward rather than losing the document.
      doc = { ...doc, schemaVersion: SCHEMA_VERSION };
      break;
    }
    doc = step(doc);
    v = doc.schemaVersion ?? v + 1;
  }
  return doc as Resume;
}
