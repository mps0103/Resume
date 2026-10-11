import { AD_APP_ID, LIVE_AD_UNITS, isPlaceholderAdId } from './adUnits';
import { LEGAL_URLS } from './legal';

/**
 * Everything in the app that still holds a placeholder.
 *
 * This exists because the placeholders do not announce themselves. Each one
 * fails quietly and in a different place — a dead privacy URL fails at
 * review, an unconfigured ad unit fails as "no ads ever", and the signing
 * certificate failed worst of all: a release build would have compared
 * Play's real certificate against 'AA:BB:CC…', decided every single install
 * was tampered with, and silently capped every paying subscriber at the free
 * tier. Nothing in the app would have said why.
 *
 * So the checks live together, are unit tested, and are surfaced in Settings
 * on a debug build. A release build is not ready to upload while
 * releaseBlockers() returns anything.
 */

export interface ReleaseBlocker {
  /** Stable key, for tests. */
  id: string;
  /** What is wrong, in the words someone fixing it would use. */
  what: string;
  /** Where to change it. */
  where: string;
}

/**
 * The untouched value of EXPECTED_SIGNATURE in services/integrity.
 * Duplicated here rather than imported because integrity.ts pulls in
 * react-native and this module must stay importable from a plain test.
 */
export const PLACEHOLDER_SIGNATURE =
  'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99';

function normaliseSignature(value: string): string {
  return value.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
}

export function isPlaceholderSignature(value: string): boolean {
  return normaliseSignature(value) === normaliseSignature(PLACEHOLDER_SIGNATURE);
}

/** A reachable https page, not the example host the project shipped with. */
export function isPlaceholderUrl(url: string): boolean {
  return url.includes('example.com') || url.includes('mps-apps.github.io');
}

export function isPlaceholderEmail(mailto: string): boolean {
  return mailto.includes('example.com');
}

export interface ReadinessInput {
  signature: string;
}

export function releaseBlockers(input: ReadinessInput): ReleaseBlocker[] {
  const blockers: ReleaseBlocker[] = [];

  if (isPlaceholderAdId(AD_APP_ID)) {
    blockers.push({
      id: 'ad-app-id',
      what: 'AdMob app ID is a placeholder, so no ads can serve',
      where: 'src/config/adUnits.ts and android_app_id in app.json',
    });
  }

  for (const [slot, id] of Object.entries(LIVE_AD_UNITS)) {
    if (isPlaceholderAdId(id)) {
      blockers.push({
        id: `ad-unit-${slot}`,
        what: `AdMob unit "${slot}" is a placeholder`,
        where: 'src/config/adUnits.ts',
      });
    }
  }

  if (isPlaceholderSignature(input.signature)) {
    blockers.push({
      id: 'signing-certificate',
      what:
        'App signing certificate is a placeholder — the tamper check cannot run',
      where: 'EXPECTED_SIGNATURE in src/services/integrity.ts',
    });
  }

  if (isPlaceholderUrl(LEGAL_URLS.privacy)) {
    blockers.push({
      id: 'privacy-url',
      what: 'Privacy policy URL is not a real page — Play rejects a dead link',
      where: 'HOST in src/config/legal.ts',
    });
  }

  if (isPlaceholderUrl(LEGAL_URLS.terms)) {
    blockers.push({
      id: 'terms-url',
      what: 'Terms URL is not a real page',
      where: 'HOST in src/config/legal.ts',
    });
  }

  if (isPlaceholderEmail(LEGAL_URLS.support)) {
    blockers.push({
      id: 'support-email',
      what: 'Support address is support@example.com',
      where: 'LEGAL_URLS.support in src/config/legal.ts',
    });
  }

  return blockers;
}

/** One line per blocker, for the debug-build diagnostics row. */
export function releaseBlockerSummary(blockers: ReleaseBlocker[]): string {
  if (!blockers.length) return 'No placeholders left — ready to upload.';
  return `${blockers.length} still to configure:\n${blockers
    .map(b => `• ${b.what} (${b.where})`)
    .join('\n')}`;
}
