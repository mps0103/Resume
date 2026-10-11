import { APP_VERSION, PACKAGE_NAME } from '../config/legal';

/**
 * Pulled in through require, and typed by hand, so that "node" does not have
 * to join the types list in tsconfig. Adding it there would let node globals
 * leak into the app's own source, where none of them exist at runtime.
 */
const fs = require('fs') as {
  readFileSync(file: string, encoding: string): string;
};

/**
 * The version lives in two places and they drift.
 *
 * Gradle owns the real one; Settings shows APP_VERSION, and that string is
 * what a user quotes in a support mail. When they disagree, every bug report
 * names a build that was never shipped — and the mismatch is invisible,
 * because nothing fails and both numbers look plausible on their own.
 */
// Relative to the project root, which is where Jest runs from.
const gradle = fs.readFileSync('android/app/build.gradle', 'utf8');

function gradleValue(name: string): string {
  const match = new RegExp(`def ${name} = "?([^"\\n]+)"?`).exec(gradle);
  if (!match) throw new Error(`${name} not found in build.gradle`);
  return match[1].trim();
}

describe('app version', () => {
  it('matches the versionName Gradle builds with', () => {
    expect(APP_VERSION).toBe(gradleValue('appVersionName'));
  });

  it('is a plain three-part version', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  /**
   * Play rejects an upload whose versionCode is not strictly higher than
   * every previous one, including builds sent only to internal testing. It
   * is the single easiest thing to forget, and the error arrives after the
   * upload rather than before it.
   */
  it('has a versionCode that has been bumped past the first release', () => {
    expect(Number(gradleValue('appVersionCode'))).toBeGreaterThanOrEqual(2);
  });

  it('keeps the application id in step with the package name', () => {
    expect(gradle).toContain(`applicationId "${PACKAGE_NAME}"`);
  });
});
