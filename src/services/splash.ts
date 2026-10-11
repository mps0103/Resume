import { NativeModules } from 'react-native';

interface SplashGateModule {
  hide(): Promise<boolean>;
}

const native: SplashGateModule | undefined = NativeModules.SplashGate;

/**
 * Takes down the system splash once the first screen has something on it.
 *
 * Failing silently is correct here. The native side drops the splash on its
 * own deadline, so the worst case of this never landing is a splash that
 * stays a few hundred milliseconds too long — not a reason to show the user
 * an error, and not a reason to block startup.
 */
export function hideSplash(): void {
  native?.hide().catch(() => {});
}
