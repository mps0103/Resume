import React, { useMemo, useState } from 'react';
import {
  Linking,
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
import { buildTheme, Palette, Theme } from '../ui/theme';
import { useAppearance, useTheme } from '../ui/ThemeProvider';
import { Touchable } from '../ui/Touchable';
import { Icon, IconName } from '../ui/Icon';
import { Gradient } from '../ui/Gradient';
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
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);

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
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/*
        The plan card leads with the gradient on Pro and a plain surface on
        free, so the paid state is visibly the better-looking one.
      */}
      {isPro ? (
        <Gradient from={t.color.heroFrom} to={t.color.heroTo} style={s.planPro}>
          <View style={s.planHead}>
            <View style={s.planCrown}>
              <Icon name="crown" size={16} color={t.color.gold} />
            </View>
            <Text style={s.planTitlePro}>Pro</Text>
          </View>
          <Text style={s.planBodyPro}>
            No watermark, unlimited exports, every design, no ads.
          </Text>
        </Gradient>
      ) : (
        <View style={s.planFree}>
          <View style={s.planHead}>
            <Text style={s.planTitle}>Free plan</Text>
            <View style={s.quotaPill}>
              <Text style={s.quotaText}>
                {remaining}/{FREE_EXPORT_ALLOWANCE} left
              </Text>
            </View>
          </View>
          <Text style={s.planBody}>
            {remaining > 0
              ? 'Exports carry a watermark until you upgrade.'
              : 'You have used your free exports.'}
          </Text>
          {/* The quota as a bar: a number alone does not show how little is left. */}
          <View style={s.track}>
            <View
              style={[
                s.fill,
                {
                  width: `${Math.min(100, (freeExportsUsed / FREE_EXPORT_ALLOWANCE) * 100)}%`,
                  backgroundColor:
                    remaining === 0 ? t.color.danger : t.color.accent,
                },
              ]}
            />
          </View>
          <Touchable onPress={onOpenPaywall} scaleTo={0.97} style={s.cta}>
            <Icon name="crown" size={16} color={t.color.onAccent} />
            <Text style={s.ctaText}>See Pro</Text>
          </Touchable>
        </View>
      )}

      {/*
        Appearance sits first because it is the only setting whose effect is
        visible while you are still looking at it — burying it under the
        subscription rows would mean scrolling to find the thing that
        repaints the screen you are on.
      */}
      <Group label="Appearance" styles={s} />
      <View style={[s.card, s.cardPlain]}>
        <ThemePicker />
      </View>

      <Group label="Subscription" styles={s} />
      <View style={s.card}>
        <Row
          icon="arrowDown"
          label={busy ? 'Checking…' : 'Restore purchase'}
          hint="If you reinstalled or changed device"
          onPress={busy ? undefined : handleRestore}
          styles={s}
          t={t}
        />
        <Row
          icon="share"
          label="Manage or cancel"
          hint="Opens the Play Store"
          onPress={() => Linking.openURL(LEGAL_URLS.manageSubscription)}
          last
          styles={s}
          t={t}
        />
      </View>

      <Group label="Your data" styles={s} />
      <View style={s.card}>
        <Row
          icon="upload"
          label={dataBusy === 'export' ? 'Preparing…' : 'Back up to a file'}
          hint="Saves every resume as one file you can keep anywhere"
          onPress={dataBusy ? undefined : handleExport}
          styles={s}
          t={t}
        />
        <Row
          icon="doc"
          label={dataBusy === 'import' ? 'Restoring…' : 'Restore from a backup'}
          hint="Adds resumes from a backup file, keeping what is here"
          onPress={dataBusy ? undefined : handleImport}
          styles={s}
          t={t}
        />
        <View style={s.info}>
          <Text style={s.infoText}>
            Everything you write is stored on this device only. Nothing is
            uploaded, so there is no account to close — and no copy for us to
            restore if the device is lost. A backup file is the only way back,
            so keep one somewhere else.
          </Text>
        </View>
      </View>

      {testModeAvailable() && (
        <>
          <Group label="Testing (debug build only)" styles={s} />
          <View style={s.card}>
            <Row
              icon="crown"
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
              styles={s}
              t={t}
            />
            <Row
              icon="close"
              label="Reset free export count"
              hint={`${freeExportsUsed} of ${FREE_EXPORT_ALLOWANCE} used — clears the tally so the free tier can be tested again`}
              onPress={() => {
                resetFreeExports();
                onUsageChange();
                appAlert('Reset', 'The free export count is back to zero.');
              }}
              last
              styles={s}
              t={t}
            />
          </View>
        </>
      )}

      {/*
        Deliberately not gated on testModeAvailable(): when the debug flag
        fails to arrive, that gate is exactly what hides everything, leaving
        nothing on screen to diagnose from. Remove before release.
      */}
      <Group label="Build diagnostics" styles={s} />
      <View style={s.card}>
        <View style={s.info}>
          <Text style={s.mono}>{testModeDiagnostics()}</Text>
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
          <Group label="Before Play upload" styles={s} />
          <View style={s.card}>
            <View style={s.info}>
              <Text style={s.mono}>
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
          <Group label="Ads" styles={s} />
          <View style={s.card}>
            <Row
              icon="eye"
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
              styles={s}
              t={t}
            />
          </View>
        </>
      )}

      <Group label="About" styles={s} />
      <View style={s.card}>
        <Row
          icon="lock"
          label="Privacy policy"
          onPress={() => Linking.openURL(LEGAL_URLS.privacy)}
          styles={s}
          t={t}
        />
        <Row
          icon="doc"
          label="Terms of use"
          onPress={() => Linking.openURL(LEGAL_URLS.terms)}
          styles={s}
          t={t}
        />
        <Row
          icon="share"
          label="Contact support"
          onPress={() => Linking.openURL(LEGAL_URLS.support)}
          last
          styles={s}
          t={t}
        />
      </View>

      <Text style={s.version}>
        {APP_NAME} {version}
      </Text>
    </ScrollView>
  );
}

function Group({
  label,
  styles,
}: {
  label: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return <Text style={styles.group}>{label.toUpperCase()}</Text>;
}

function Row({
  icon,
  label,
  hint,
  onPress,
  last,
  styles,
  t,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  onPress?: () => void;
  last?: boolean;
  styles: ReturnType<typeof makeStyles>;
  t: Theme;
}) {
  return (
    <Touchable
      onPress={onPress}
      disabled={!onPress}
      // Rows are full width, so a scale dip reads as the row pressing in.
      scaleTo={0.99}
      style={[styles.row, last && styles.rowLast, !onPress && styles.rowOff]}
    >
      <View style={styles.rowIcon}>
        <Icon name={icon} size={17} color={t.color.accent} />
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      {!!onPress && (
        <Icon name="chevronRight" size={16} color={t.color.textFaint} />
      )}
    </Touchable>
  );
}

/**
 * The theme picker.
 *
 * Each option is rendered in its own colours rather than as a name and a
 * dot: the only question the user is asking is "what will the app look
 * like", and a swatch answers it without them having to apply each one and
 * look. The previews are built with {@link buildTheme} on the candidate
 * palette, which means a new palette needs no work here at all.
 */
function ThemePicker() {
  const { palette, palettes, setPalette } = useAppearance();
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={s.themeGrid}>
      {palettes.map(p => (
        <ThemeSwatch
          key={p.id}
          palette={p}
          selected={p.id === palette.id}
          onPress={() => setPalette(p.id)}
        />
      ))}
    </View>
  );
}

function ThemeSwatch({
  palette,
  selected,
  onPress,
}: {
  palette: Palette;
  selected: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  // The candidate theme, so the preview is literally what tapping it gives.
  const preview = useMemo(() => buildTheme(palette), [palette]);

  return (
    <Touchable onPress={onPress} scaleTo={0.95} style={s.swatchWrap}>
      <View
        style={[
          s.swatch,
          { borderColor: selected ? t.color.accent : t.color.border },
          selected && s.swatchOn,
        ]}
      >
        {/* A miniature of the app: hero band, a card, and two text bars. */}
        <Gradient
          from={preview.color.heroFrom}
          to={preview.color.heroTo}
          steps={6}
          style={s.swatchHero}
        />
        <View
          style={[s.swatchBody, { backgroundColor: preview.color.bg }]}
        >
          <View
            style={[
              s.swatchCard,
              {
                backgroundColor: preview.color.surface,
                borderColor: preview.color.border,
              },
            ]}
          >
            <View
              style={[s.swatchBar, { backgroundColor: preview.color.accent, width: '55%' }]}
            />
            <View
              style={[
                s.swatchBar,
                { backgroundColor: preview.color.borderStrong, width: '80%' },
              ]}
            />
          </View>
        </View>

        {selected && (
          <View style={[s.swatchTick, { backgroundColor: t.color.accent }]}>
            <Icon name="check" size={11} color={t.color.onAccent} weight={2} />
          </View>
        )}
      </View>

      <Text style={[s.swatchName, selected && s.swatchNameOn]}>
        {palette.name}
      </Text>
      <Text style={s.swatchBlurb} numberOfLines={2}>
        {palette.blurb}
      </Text>
    </Touchable>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    scroll: { padding: t.space(4), paddingBottom: t.space(10) },

    planHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    planPro: {
      borderRadius: t.radius.lg,
      padding: t.space(4),
      marginBottom: t.space(6),
      ...t.shadow.md,
    },
    planCrown: {
      width: 30,
      height: 30,
      borderRadius: t.radius.pill,
      backgroundColor: 'rgba(255,255,255,0.16)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.space(2.5),
    },
    planTitlePro: {
      ...t.font.h1,
      color: t.color.onHero,
      flex: 1,
    },
    planBodyPro: {
      fontSize: 14,
      lineHeight: 20,
      color: t.color.onHeroMuted,
      marginTop: t.space(2),
    },

    planFree: {
      backgroundColor: t.color.surface,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.color.border,
      padding: t.space(4),
      marginBottom: t.space(6),
      ...t.shadow.sm,
    },
    planTitle: { ...t.font.h2, color: t.color.text },
    quotaPill: {
      paddingHorizontal: t.space(2.5),
      paddingVertical: t.space(1),
      borderRadius: t.radius.pill,
      backgroundColor: t.color.accentSoft,
    },
    quotaText: {
      fontSize: 11,
      fontWeight: '700',
      color: t.color.onAccentSoft,
    },
    planBody: {
      fontSize: 13,
      lineHeight: 19,
      color: t.color.textMuted,
      marginTop: t.space(1.5),
    },
    track: {
      height: 5,
      borderRadius: 3,
      backgroundColor: t.color.bgSunken,
      overflow: 'hidden',
      marginTop: t.space(3),
    },
    fill: { height: 5, borderRadius: 3 },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.space(2),
      marginTop: t.space(4),
      paddingVertical: t.space(3),
      borderRadius: t.radius.md,
      backgroundColor: t.color.accent,
      ...t.shadow.brand,
    },
    ctaText: { fontSize: 15, fontWeight: '700', color: t.color.onAccent },

    group: {
      ...t.font.section,
      color: t.color.textFaint,
      marginBottom: t.space(2),
      marginLeft: t.space(1.5),
    },
    card: {
      backgroundColor: t.color.surface,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.color.border,
      marginBottom: t.space(6),
      overflow: 'hidden',
      ...t.shadow.sm,
    },
    // The picker brings its own padding, and a clipped grid would cut the
    // selection ring off.
    cardPlain: { padding: t.space(3), overflow: 'visible' },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: t.space(3.5),
      paddingVertical: t.space(3.5),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.color.border,
    },
    rowLast: { borderBottomWidth: 0 },
    rowOff: { opacity: 0.55 },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: t.radius.sm,
      backgroundColor: t.color.accentTint,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.space(3),
    },
    rowMain: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: '500', color: t.color.text },
    rowHint: {
      ...t.font.hint,
      color: t.color.textFaint,
      marginTop: 2,
      lineHeight: 17,
    },

    info: { padding: t.space(4) },
    infoText: { fontSize: 14, lineHeight: 20, color: t.color.textMuted },
    // Diagnostics are read character by character, so they get a fixed pitch.
    mono: {
      fontFamily: 'monospace',
      fontSize: 12,
      lineHeight: 18,
      color: t.color.textMuted,
    },

    version: {
      ...t.font.hint,
      color: t.color.textFaint,
      textAlign: 'center',
    },

    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.space(3),
    },
    /*
      Three to a row.

      31% plus two 12pt gaps overflowed the card's inner width on a 360dp
      screen by a couple of points, and flex-wrap answers an overflow by
      dropping to two per row — which is how six themes came out as three
      rows of two. 30% leaves the margin that rounding needs.
    */
    swatchWrap: { width: '30%' },
    swatch: {
      height: 78,
      borderRadius: t.radius.md,
      borderWidth: 1.5,
      overflow: 'hidden',
      backgroundColor: t.color.surface,
    },
    swatchOn: { ...t.shadow.brand },
    swatchHero: { height: 26 },
    swatchBody: { flex: 1, padding: 5 },
    swatchCard: {
      flex: 1,
      borderRadius: 4,
      borderWidth: StyleSheet.hairlineWidth,
      padding: 4,
      gap: 3,
      justifyContent: 'center',
    },
    swatchBar: { height: 3, borderRadius: 1.5 },
    swatchTick: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 17,
      height: 17,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchName: {
      fontSize: 12,
      fontWeight: '600',
      color: t.color.text,
      marginTop: t.space(1.5),
    },
    swatchNameOn: { color: t.color.accent },
    swatchBlurb: {
      fontSize: 10,
      lineHeight: 13,
      color: t.color.textFaint,
      marginTop: 1,
    },
  });
}
