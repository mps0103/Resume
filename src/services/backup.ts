/**
 * Backup export and import.
 *
 * The app stores everything on the device and uploads nothing, which is the
 * privacy promise in Settings and on the store listing. The cost of that
 * promise is that a lost or wiped phone loses every resume, so a file the
 * user can put in their own cloud storage is the only recovery path there
 * is. That makes this the highest-consequence code in the app: an export
 * that silently writes an incomplete file is worse than no export at all.
 *
 * All decisions live in backupFormat.ts. This file is the I/O around them.
 */
import { NativeModules } from 'react-native';
import Share from 'react-native-share';

import { Resume } from '../types/resume';
import { getResume, listResumes, saveResume } from '../db/resumeStore';
import { uid } from '../data/factory';
import { APP_VERSION } from '../config/legal';
import {
  backupFileName,
  buildBackup,
  importSummary,
  parseBackup,
  planImport,
} from './backupFormat';

interface BackupFilesModule {
  writeBackup(fileName: string, contents: string): Promise<string>;
  /** Resolves null when the user backs out of the picker. */
  pickBackup(): Promise<string | null>;
}

const native: BackupFilesModule | undefined = NativeModules.BackupFiles;

export type ExportOutcome =
  | { ok: true; count: number; filePath: string }
  | { ok: false; message: string };

export type ImportOutcome =
  | { ok: true; message: string; count: number }
  | { ok: false; message: string }
  | { cancelled: true };

/**
 * Reads every resume out of SQLite rather than reusing the list screen's
 * summaries — the summaries are the denormalised metadata columns, not the
 * documents, and a backup made from those would restore empty resumes.
 */
function collectResumes(): Resume[] {
  const out: Resume[] = [];
  for (const summary of listResumes()) {
    const full = getResume(summary.id);
    if (full) out.push(full);
  }
  return out;
}

export async function exportBackup(): Promise<ExportOutcome> {
  if (!native) {
    return { ok: false, message: 'Backup is not available in this build.' };
  }

  const resumes = collectResumes();
  if (resumes.length === 0) {
    return { ok: false, message: 'There is nothing to back up yet.' };
  }

  try {
    const backup = buildBackup(resumes, APP_VERSION);
    // Pretty-printed: a backup is something a user may open, inspect, or
    // salvage by hand if this app is ever gone. The size cost is irrelevant
    // next to that.
    const json = JSON.stringify(backup, null, 2);
    const filePath = await native.writeBackup(backupFileName(), json);

    await Share.open({
      url: `file://${filePath}`,
      type: 'application/json',
      filename: backupFileName(),
      failOnCancel: false,
    });

    return { ok: true, count: resumes.length, filePath };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.message ?? 'The backup could not be created.',
    };
  }
}

export async function importBackup(): Promise<ImportOutcome> {
  if (!native) {
    return { ok: false, message: 'Restore is not available in this build.' };
  }

  let text: string | null;
  try {
    text = await native.pickBackup();
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'That file could not be opened.' };
  }

  if (text === null) return { cancelled: true };

  const parsed = parseBackup(text);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const existing = new Set(listResumes().map(r => r.id));
  const plan = planImport(parsed.backup, existing, uid);

  // saveResume is a synchronous upsert, and planImport has already made sure
  // no id collides with an existing one, so this cannot overwrite anything.
  for (const resume of plan.resumes) {
    saveResume(resume);
  }

  return {
    ok: true,
    message: importSummary(plan),
    count: plan.resumes.length,
  };
}
