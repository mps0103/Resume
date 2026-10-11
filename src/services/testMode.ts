import { NativeModules } from 'react-native';

/**
 * Debug-build-only entitlement override.
 *
 * Testing the paid side of the app on a locally built APK is otherwise
 * impossible: Play billing never works in a debug build, so every premium
 * design is locked, exports stop after three, and the watermark cannot be
 * turned off. That leaves most of the product untestable on a device.
 *
 * Everything here is inert unless BuildConfig.DEBUG is true, which is a
 * property of the build type rather than a flag in the JS bundle — so a
 * release APK cannot be talked into Pro by flipping a stored value. The
 * override is also kept out of the billing cache, so it can never be mistaken
 * for a real entitlement or reconciled back to Play.
 *
 * The flag is read through a promise-backed native method rather than a
 * constant. Under the New Architecture a legacy module reaches JS through the
 * TurboModule interop layer, which did not deliver this module's constants or
 * its synchronous method — both came back undefined, silently leaving a debug
 * build on the free tier. Promise-backed methods do work, which is why
 * resolving the flag is asynchronous and has to be awaited at startup.
 */
export type TestEntitlement = 'free' | 'pro';

interface BuildInfoModule {
  fetchIsDebugBuild?: () => Promise<boolean>;
  isDebugBuildSync?: () => boolean;
  getConstants?: () => { isDebugBuild?: boolean };
  isDebugBuild?: boolean;
}

const native = NativeModules.AppBuildInfo as BuildInfoModule | undefined;

/** null until resolved; never assumed true. */
let isDebugBuild: boolean | null = null;

/**
 * Which probe answered, recorded so a failure can be read off the Settings
 * screen instead of guessed at. Two speculative fixes went into this flag
 * before anyone could see which route was actually failing.
 */
let probeLog = 'not run';

// Deliberately in memory only. A debug override that survived a restart would
// be far too easy to forget about while testing the free tier.
let override: TestEntitlement = 'pro';

/**
 * Resolves the build type. Must be awaited before the first entitlement read,
 * or a debug build spends its first render on the free tier.
 */
export async function initTestMode(): Promise<void> {
  if (isDebugBuild !== null) return;

  if (!native) {
    isDebugBuild = false;
    probeLog = 'AppBuildInfo module MISSING';
    return;
  }

  const keys = Object.keys(native).join(',') || '(none)';

  // Promise-backed method first: the shape that backup export proved works
  // through the interop layer on this build.
  try {
    if (typeof native.fetchIsDebugBuild === 'function') {
      const value = await native.fetchIsDebugBuild();
      isDebugBuild = value === true;
      probeLog = `fetch -> ${String(value)}`;
      return;
    }
  } catch (e: any) {
    probeLog = `fetch threw: ${e?.message ?? e}`;
  }

  try {
    if (typeof native.isDebugBuildSync === 'function') {
      isDebugBuild = native.isDebugBuildSync() === true;
      probeLog = `sync -> ${String(isDebugBuild)}`;
      return;
    }
  } catch (e: any) {
    probeLog = `${probeLog}; sync threw: ${e?.message ?? e}`;
  }

  try {
    if (typeof native.getConstants === 'function') {
      const value = native.getConstants()?.isDebugBuild;
      isDebugBuild = value === true;
      probeLog = `${probeLog}; constants -> ${String(value)}`;
      return;
    }
  } catch (e: any) {
    probeLog = `${probeLog}; constants threw: ${e?.message ?? e}`;
  }

  // No route worked. "Not a debug build" is the only safe answer.
  isDebugBuild = native.isDebugBuild === true;
  probeLog = `${probeLog}; direct -> ${String(native.isDebugBuild)}; keys: ${keys}`;
}

/** Human-readable result of the probe, for the Settings diagnostics row. */
export function testModeDiagnostics(): string {
  return `${probeLog} | debug=${String(isDebugBuild)}`;
}

/** True when the testing controls should be offered at all. */
export function testModeAvailable(): boolean {
  return isDebugBuild === true;
}

/** The forced entitlement, or null to defer to real billing. */
export function testEntitlement(): TestEntitlement | null {
  return isDebugBuild === true ? override : null;
}

export function setTestEntitlement(value: TestEntitlement): void {
  if (isDebugBuild !== true) return;
  override = value;
}
