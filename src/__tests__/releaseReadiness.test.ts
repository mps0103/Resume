import {
  AD_APP_ID,
  LIVE_AD_UNITS,
  adUnitsConfigured,
  isPlaceholderAdId,
} from '../config/adUnits';
import {
  PLACEHOLDER_SIGNATURE,
  isPlaceholderEmail,
  isPlaceholderSignature,
  isPlaceholderUrl,
  releaseBlockerSummary,
  releaseBlockers,
} from '../config/releaseReadiness';

const REAL_SIGNATURE =
  '1A:2B:3C:4D:5E:6F:70:81:92:A3:B4:C5:D6:E7:F8:09:1A:2B:3C:4D:5E:6F:70:81:92:A3:B4:C5:D6:E7:F8:09';

describe('placeholder detection', () => {
  it('knows an untouched AdMob id from a real one', () => {
    expect(isPlaceholderAdId('ca-app-pub-0000000000000000/0000000000')).toBe(true);
    expect(isPlaceholderAdId('ca-app-pub-0000000000000000~0000000000')).toBe(true);
    expect(isPlaceholderAdId('ca-app-pub-3940256099942544/6300978111')).toBe(false);
  });

  /**
   * The signing certificate is the one placeholder that fails dangerously
   * rather than visibly: a release build compares Play's real certificate
   * against this, concludes every install is tampered with, and caps every
   * paying subscriber at the free tier without a word to anyone.
   */
  it('recognises the placeholder signing certificate in any formatting', () => {
    expect(isPlaceholderSignature(PLACEHOLDER_SIGNATURE)).toBe(true);
    expect(isPlaceholderSignature(PLACEHOLDER_SIGNATURE.toLowerCase())).toBe(true);
    expect(isPlaceholderSignature(PLACEHOLDER_SIGNATURE.replace(/:/g, ''))).toBe(true);
    expect(isPlaceholderSignature(REAL_SIGNATURE)).toBe(false);
  });

  it('spots example hosts and addresses', () => {
    expect(isPlaceholderUrl('https://mps-apps.github.io/resume-builder/privacy.html')).toBe(true);
    expect(isPlaceholderUrl('https://example.com/privacy')).toBe(true);
    expect(isPlaceholderUrl('https://resumebuilder.app/privacy')).toBe(false);
    expect(isPlaceholderEmail('mailto:support@example.com')).toBe(true);
    expect(isPlaceholderEmail('mailto:help@resumebuilder.app')).toBe(false);
  });
});

describe('release blockers', () => {
  const blockers = () => releaseBlockers({ signature: PLACEHOLDER_SIGNATURE });

  /**
   * These assertions are expected to fail as placeholders get replaced.
   * That is the point: each failure is the signal that one more item is
   * genuinely done, and the test is then narrowed to match.
   *
   * Already done, and pinned below so they cannot regress: the privacy and
   * terms pages (GitHub Pages, from docs/) and the support address.
   */
  it('reports every placeholder still in the tree today', () => {
    expect(blockers().map(b => b.id).sort()).toEqual([
      'ad-app-id',
      'ad-unit-banner',
      'ad-unit-exportInterstitial',
      'signing-certificate',
    ]);
  });

  it('no longer flags the legal pages or the support address', () => {
    const ids = blockers().map(b => b.id);
    expect(ids).not.toContain('privacy-url');
    expect(ids).not.toContain('terms-url');
    expect(ids).not.toContain('support-email');
  });

  /**
   * The pages are served from docs/ on this repo, so the files have to be
   * there for the URLs the app links to to resolve. A 404 privacy policy
   * fails Play review.
   */
  it('ships the pages those URLs actually point at', () => {
    const fs = require('fs') as { existsSync(p: string): boolean };
    expect(fs.existsSync('docs/privacy.html')).toBe(true);
    expect(fs.existsSync('docs/terms.html')).toBe(true);
  });

  it('says where each one lives, not just what it is', () => {
    for (const b of blockers()) {
      expect(b.where).toMatch(/\.(ts|json)/);
      expect(b.what.length).toBeGreaterThan(10);
    }
  });

  it('clears the signing certificate once a real one is pasted in', () => {
    const ids = releaseBlockers({ signature: REAL_SIGNATURE }).map(b => b.id);
    expect(ids).not.toContain('signing-certificate');
  });

  it('summarises for the diagnostics row', () => {
    expect(releaseBlockerSummary([])).toContain('ready to upload');
    expect(releaseBlockerSummary(blockers())).toContain('still to configure');
  });
});

describe('ads refuse to run on placeholders', () => {
  /**
   * Guards the fail-safe, not the values. A release build with unconfigured
   * units must show no ads at all rather than firing requests at a
   * publisher account that does not exist.
   */
  it('reports the ad config as unconfigured while placeholders remain', () => {
    expect(adUnitsConfigured()).toBe(false);
  });

  it('keeps the app id and the unit ids under the same publisher', () => {
    // A unit from one AdMob account and an app id from another is a silent
    // no-fill that looks exactly like low demand.
    const publisher = (id: string) => id.split(/[/~]/)[0];
    for (const id of Object.values(LIVE_AD_UNITS)) {
      expect(publisher(id)).toBe(publisher(AD_APP_ID));
    }
  });
});
