import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { resetFreeExports, restore, type Entitlement } from '../services/billing';
import { FREE_EXPORT_ALLOWANCE } from '../services/exportResume';
import { exportBackup, importBackup } from '../services/backup';
import {
  setTestEntitlement,
  testEntitlement,
  testModeAvailable,
  testModeDiagnostics,
} from '../services/testMode';
import { adPrivacyOptionsRequired, showAdPrivacyOptions } from '../services/ads';
import { configuredSignature } from '../services/integrity';
import {
  releaseBlockerSummary,
  releaseBlockers,
} from '../config/releaseReadiness';
import { LEGAL_URLS, APP_NAME } from '../config/legal';
import { theme } from '../ui/theme';
import { appAlert } from '../components/AppDialog';

interface Props {
  entitlement: Entitlement;
  freeExportsUsed: number;
  version: string;
  onEntitlementChange: (e: Entitlement) => void;
  onOpenPaywall: () => void;
  /** Restoring writes new rows, so the list screen has to be re-read. */
  onDataRestored: () => void;
  /** Called after anything that changes the free-export tally. */
  onUsageChange: () => void;
}

/**
 * Play requires a route to manage or cancel a subscription from inside the
 * app, and a reachable privacy policy. Both live here as well as on the
 * paywall so they survive someone who never opens the paywall again.
 */
export function SettingsScreen({
  entitlement,
  freeExportsUsed,
  version,
  onEntitlementChange,
  onOpenPaywall,
  onDataRestored,
  onUsageChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [dataBusy, setDataBusy] = useState<'export' | 'import' | null>(null);
  const isPro = entitlement === 'pro';
  const remaining = Math.max(0, FREE_EXPORT_ALLOWANCE - freeExportsUsed);

  async function handleRestore() {
    setBusy(true);
    const result = await restore(onEntitlementChange);
    setBusy(false);
    appAlert(
      result === 'pro' ? 'Pro restored' : 'No subscription found',
      result === 'pro'
        ? 'Everything is unlocked again.'
        : 'This Play account has no active subscription for this app.',
    );
  }

  async function handleExport() {
    setDataBusy('export');
    const result = await exportBackup();
    setDataBusy(null);
    if (!result.ok) {
      appAlert('Backup failed', result.message);
    }
    // On success the share sheet is the confirmation. An alert on top of it
    // would land behind the sheet and be read as an error.
  }

  /**
   * Restoring is the one destructive-sounding action here, so the warning is
   * spelled out before the picker opens rather than after a file is chosen —
   * although nothing is actually overwritten, a user who expects "restore" to
   * mean "replace" should find that out first.
   */
  function handleImport() {
    appAlert(
      'Restore from backup',
      'Pick a backup file. Resumes are added to the ones you already have — nothing on this device is replaced or deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose file', onPress: runImport },
      ],
    );
  }

  async function runImport() {
    setDataBusy('import');
    const result = await importBackup();
    setDataBusy(null);

    if ('cancelled' in result) return;
    if (!result.ok) {
      appAlert('Nothing restored', result.message);
      return;
    }
    onDataRestored();
    appAlert('Restored', result.message);
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={[styles.planCard, isPro && styles.planCardPro]}>
        <Text style={[styles.planTitle, isPro && styles.planTitlePro]}>
          {isPro ? 'Pro' : 'Free plan'}
        </Text>
        <Text style={[styles.planBody, isPro && styles.planBodyPro]}>
          {isPro
            ? 'No watermark, unlimited exports, every design, no ads.'
            : remaining > 0
              ? `${remaining} of ${FREE_EXPORT_ALLOWANCE} watermarked exports left.`
              : 'You have used your free exports.'}
        </Text>
        {!isPro && (
          <Pressable style={styles.cta} onPress={onOpenPaywall}>
            <Text style={styles.ctaText}>See Pro</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.group}>Subscription</Text>
      <View style={styles.card}>
        <Row
          label={busy ? 'Checking…' : 'Restore purchase'}
          hint="If you reinstalled or changed device"
          onPress={busy ? undefined : handleRestore}
        />
        <Row
          label="Manage or cancel"
          hint="Opens the Play Store"
          onPress={() => Linking.openURL(LEGAL_URLS.manageSubscription)}
          last
        />
      </View>

      <Text style={styles.group}>Your data</Text>
      <View style={styles.card}>
        <Row
          label={dataBusy === 'export' ? 'Preparing…' : 'Back up to a file'}
          hint="Saves every resume as one file you can keep anywhere"
          onPress={dataBusy ? undefined : handleExport}
        />
        <Row
          label={dataBusy === 'import' ? 'Restoring…' : 'Restore from a backup'}
          hint="Adds resumes from a backup file, keeping what is here"
          onPress={dataBusy ? undefined : handleImport}
        />
        <View style={styles.info}>
          <Text style={styles.infoText}>
            Everything you write is stored on this device only. Nothing is
            uploaded, so there is no account to close — and no copy for us to
            restore if the device is lost. A backup file is the only way back,
            so keep one somewhere else.
          </Text>
        </View>
      </View>

      {testModeAvailable() && (
        <>
          <Text style={styles.group}>Testing (debug build only)</Text>
          <View style={styles.card}>
            <Row
              label={
                testEntitlement() === 'pro'
                  ? 'Testing as Pro'
                  : 'Testing as Free'
              }
              hint="Tap to switch. Play billing never works in a local build, so this is the only way to reach the Pro paths."
              onPress={() => {
                const next = testEntitlement() === 'pro' ? 'free' : 'pro';
                setTestEntitlement(next);
                onEntitlementChange(next);
              }}
            />
            <Row
              label="Reset free export count"
              hint={`${freeExportsUsed} of ${FREE_EXPORT_ALLOWANCE} used — clears the tally so the free tier can be tested again`}
              onPress={() => {
                resetFreeExports();
                onUsageChange();
                appAlert('Reset', 'The free export count is back to zero.');
              }}
              last
            />
          </View>
        </>
      )}

      {/*
        Deliberately not gated on testModeAvailable(): when the debug flag
        fails to arrive, that gate is exactly what hides everything, leaving
        nothing on screen to diagnose from. Remove before release.
      */}
      <Text style={styles.group}>Build diagnostics</Text>
      <View style={styles.card}>
        <View style={styles.info}>
          <Text style={styles.infoText}>{testModeDiagnostics()}</Text>
        </View>
      </View>

      {/*
        The release checklist, on debug builds only.

        Every item here is a placeholder that fails silently in production —
        no ads, a rejected listing, or worse, a signing certificate that
        never matches and quietly caps real subscribers at the free tier.
        None of them announce themselves, so they are listed where they will
        actually be seen while testing.
      */}
      {testModeAvailable() && (
        <>
          <Text style={styles.group}>Before Play upload</Text>
          <View style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.infoText}>
                {releaseBlockerSummary(
                  releaseBlockers({ signature: configuredSignature() }),
                )}
              </Text>
            </View>
          </View>
        </>
      )}

      {/*
        Required by Google's UMP policy wherever a consent form was shown:
        consent has to be as easy to withdraw as it was to give, which means
        a permanent route to the form and not just the prompt at first
        launch. The row hides itself outside the EEA and UK, where no form
        exists, and for Pro users, who are never shown an ad at all.
      */}
      {!isPro && adPrivacyOptionsRequired() && (
        <>
          <Text style={styles.group}>Ads</Text>
          <View style={styles.card}>
            <Row
              label="Ad privacy choices"
              hint="Change or withdraw your consent for personalised ads"
              onPress={() => {
                showAdPrivacyOptions().catch(() =>
                  appAlert(
                    'Not available',
                    'The consent form could not be opened. Check your connection and try again.',
                  ),
                );
              }}
              last
            />
          </View>
        </>
      )}

      <Text style={styles.group}>About</Text>
      <View style={styles.card}>
        <Row label="Privacy policy" onPress={() => Linking.openURL(LEGAL_URLS.privacy)} />
        <Row label="Terms of use" onPress={() => Linking.openURL(LEGAL_URLS.terms)} />
        <Row label="Contact support" onPress={() => Linking.openURL(LEGAL_URLS.support)} last />
      </View>

      <Text style={styles.version}>
        {APP_NAME} {version}
      </Text>
    </ScrollView>
  );
}

function Row({
  label,
  hint,
  onPress,
  last,
}: {
  label: string;
  hint?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, last && styles.rowLast, !onPress && styles.rowOff]}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: theme.space(4), paddingBottom: theme.space(10) },

  planCard: {
    backgroundColor: theme.color.accentSoft,
    borderRadius: theme.radius.md,
    padding: theme.space(4),
    marginBottom: theme.space(6),
  },
  planCardPro: { backgroundColor: theme.color.accent },
  planTitle: { fontSize: 17, fontWeight: '600', color: theme.color.accent },
  planTitlePro: { color: '#fff' },
  planBody: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.color.accent,
    marginTop: theme.space(1.5),
  },
  planBodyPro: { color: 'rgba(255,255,255,0.88)' },
  cta: {
    marginTop: theme.space(4),
    paddingVertical: theme.space(3),
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.accent,
    alignItems: 'center',
  },
  ctaText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  group: {
    ...theme.font.section,
    color: theme.color.textMuted,
    marginBottom: theme.space(2),
    marginLeft: theme.space(1),
  },
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    marginBottom: theme.space(6),
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(3.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowOff: { opacity: 0.6 },
  rowMain: { flex: 1 },
  rowLabel: { fontSize: 15, color: theme.color.text },
  rowHint: { ...theme.font.hint, color: theme.color.textFaint, marginTop: 2 },
  chevron: { fontSize: 20, color: theme.color.textFaint },

  info: { padding: theme.space(4) },
  infoText: { fontSize: 14, lineHeight: 20, color: theme.color.textMuted },

  version: {
    ...theme.font.hint,
    color: theme.color.textFaint,
    textAlign: 'center',
  },
});
