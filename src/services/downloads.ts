import { NativeModules } from 'react-native';

interface AppDownloadsModule {
  /** Resolves the saved location, or null on devices below Android 10. */
  saveToDownloads(
    sourcePath: string,
    fileName: string,
    mimeType: string,
  ): Promise<string | null>;
  /** Resolves the absolute path the bytes were written to. */
  writeTempFile(fileName: string, base64: string): Promise<string>;
}

const native: AppDownloadsModule | undefined = NativeModules.AppDownloads;

/**
 * Writes base64 bytes to a private file and returns its path.
 *
 * Only the Word export needs this. The PDF converter is native and produces
 * its own file; a .docx is assembled in JavaScript, which has nowhere to put
 * bytes. Throwing here is a real failure — unlike the Downloads copy, there
 * is no file at all if this does not work.
 */
export async function writeTempFile(
  fileName: string,
  base64: string,
): Promise<string> {
  if (!native) throw new Error('This build cannot write files.');
  return native.writeTempFile(fileName, base64);
}

/**
 * Copies an exported file into the public Downloads folder.
 *
 * Returns the user-facing location, or null when the file could not be put
 * somewhere the user can browse to. Null is a normal outcome — Android 9 and
 * below cannot do this without a storage permission the app does not request
 * — so the caller keeps the original file and says where it actually is
 * rather than treating this as a failure.
 */
export async function saveToDownloads(
  sourcePath: string,
  fileName: string,
  mimeType: string,
): Promise<string | null> {
  if (!native) return null;
  try {
    return await native.saveToDownloads(sourcePath, fileName, mimeType);
  } catch {
    // The PDF itself already exists; failing to copy it is not a failed
    // export and must not be reported as one.
    return null;
  }
}
