import { NativeModules } from 'react-native';
import { Resume } from '../types/resume';
import { ImportStats, importSummary, parseResumeText } from './resumeImport';

/**
 * Picks an existing resume file and turns it into an editable document.
 *
 * The split is deliberate: the native module returns nothing but plain
 * text, and every decision about what that text means lives in
 * services/resumeImport, which is pure and unit tested. A parser that can
 * only be exercised by tapping through a file picker on a device does not
 * get improved.
 */

interface ResumeImportNative {
  pickResume: () => Promise<{ fileName: string; text: string } | null>;
}

const native = NativeModules.ResumeImport as ResumeImportNative | undefined;

export type ImportOutcome =
  | { ok: true; resume: Resume; stats: ImportStats; message: string }
  | { cancelled: true }
  | { ok: false; message: string };

/** Strips the extension so the document gets a sensible name. */
function titleFrom(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  return base || 'Imported resume';
}

export async function importExistingResume(): Promise<ImportOutcome> {
  if (!native?.pickResume) {
    return { ok: false, message: 'Importing is not available in this build.' };
  }

  let picked: { fileName: string; text: string } | null;
  try {
    picked = await native.pickResume();
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'That file could not be opened.' };
  }

  if (!picked) return { cancelled: true };

  const text = picked.text ?? '';

  /**
   * A PDF that is a photograph of a page has no text layer, so extraction
   * succeeds and returns nothing. Saying "could not be read" there would
   * send the user to check a file that is perfectly fine, so the real
   * reason is given instead.
   */
  if (text.trim().length < 20) {
    return {
      ok: false,
      message:
        'There was no readable text in that file. If it is a scan or a photo of a printed resume, the words are an image rather than text — try a PDF exported from Word or Google Docs.',
    };
  }

  const { resume, stats } = parseResumeText(text, titleFrom(picked.fileName));
  return { ok: true, resume, stats, message: importSummary(stats) };
}
