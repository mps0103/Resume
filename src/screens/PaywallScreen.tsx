import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { buy, loadPlans, restore } from '../services/billing';
import { Plan, defaultPlan } from '../services/plans';
import { FREE_EXPORT_ALLOWANCE } from '../services/exportResume';
import { allTemplates } from '../templates/registry';
import { LEGAL_URLS } from '../config/legal';
import { Theme } from '../ui/theme';
import { useTheme } from '../ui/ThemeProvider';
import { Gradient } from '../ui/Gradient';
import { Touchable } from '../ui/Touchable';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { appAlert } from '../components/AppDialog';

interface Props {
  onClose: () => void;
  onEntitlementChange: (e: 'free' | 'pro') => void;
}

/**
 * Rounded down to the nearest ten so the claim stays true as designs are
 * added or retired, and never overstates what is actually in the gallery.
 */
const DESIGN_COUNT = Math.floor(allTemplates().length / 10) * 10;

const BENEFITS = [
  'Export without a watermark',
  'Unlimited exports, as PDF or Word',
  `All ${DESIGN_COUNT}+ designs, including new ones`,
  'No ads',
];

/**
 * Play requires the price, billing period and renewal terms to be visible
 * before purchase, and a restore path for people who reinstall. Prices come
 * from Play rather than being hardcoded, so they stay correct per country.
 */
export function PaywallScreen({ onClose, onEntitlementChange }: Props) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Plan | null>(null);

  useEffect(() => {
    loadPlans()
      .then(loaded => {
        setPlans(loaded);
        setSelected(defaultPlan(loaded));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleBuy() {
    if (!selected) return;
    setBusy(selected.sku);
    try {
      await buy(selected);
      // The purchase listener grants the entitlement and closes the screen.
    } catch {
      appAlert(
        'Purchase not completed',
        'Nothing was charged. Check your Play account and try again.',
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore() {
    setBusy('restore');
    const result = await restore(onEntitlementChange);
    setBusy(null);
    if (result === 'pro') {
      appAlert('Pro restored', 'Everything is unlocked again.');
      onClose();
    } else {
      appAlert(
        'Nothing to restore',
        'This Play account has no Pro purchase for this app.',
      );
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
{/*
        The header is the one place in the app that has to look like it is
        worth paying for, so it carries the gradient rather than sitting on
        a plain surface like every other screen's title.
      */}
      <Gradient from={t.color.heroFrom} to={t.color.heroTo} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.crown}>
            <Icon name="crown" size={22} color={t.color.gold} />
          </View>
          <IconButton
            name="close"
            tone="onDark"
            label="Close"
            onPress={onClose}
          />
        </View>

        <Text style={styles.title}>Resume Builder Pro</Text>
        <Text style={styles.lede}>
          The free plan gives you {FREE_EXPORT_ALLOWANCE} watermarked exports.
          Pro removes both limits.
        </Text>
      </Gradient>

      <View style={styles.benefits}>
        {BENEFITS.map(b => (
          <View key={b} style={styles.benefitRow}>
            <View style={styles.tick}>
              <Icon name="check" size={12} color={t.color.success} weight={2.2} />
            </View>
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={t.color.accent} />
      ) : plans.length === 0 ? (
        <Text style={styles.unavailable}>
          Plans could not be loaded. Check your connection and try again.
        </Text>
      ) : (
        <View style={styles.plans}>
          {plans.map(plan => {
            const on = selected?.sku === plan.sku;
            return (
              <Touchable
                key={plan.sku}
                onPress={() => setSelected(plan)}
                scaleTo={0.98}
                style={[styles.plan, on && styles.planOn]}
              >
                <View style={styles.planMain}>
                  <View style={styles.planNameRow}>
                    <Text style={[styles.planName, on && styles.planNameOn]}>
                      {plan.name}
                    </Text>
                  </View>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
                <Text style={[styles.planPrice, on && styles.planPriceOn]}>
                  {plan.price}
                </Text>
              </Touchable>
            );
          })}
        </View>
      )}

      <Touchable
        style={[styles.cta, (busy || !selected) && styles.ctaOff]}
        onPress={handleBuy}
        disabled={!!busy || !selected}
        scaleTo={0.97}
      >
        {busy && busy !== 'restore' ? (
          <ActivityIndicator color={t.color.onAccent} />
        ) : (
          <>
            <Icon name="crown" size={18} color={t.color.onAccent} />
            <Text style={styles.ctaText}>Subscribe</Text>
          </>
        )}
      </Touchable>

      {/*
        Play requires the renewal terms to be visible before purchase, not
        only in the store listing.
      */}
      <Text style={styles.terms}>
        Billed through Google Play and renews automatically until cancelled.
        Cancel any time in the Play Store, at least 24 hours before the
        period ends.
      </Text>

      <Touchable onPress={handleRestore} style={styles.ghost} disabled={!!busy}>
        <Text style={styles.ghostText}>
          {busy === 'restore' ? 'Checking…' : 'Restore purchase'}
        </Text>
      </Touchable>

      <View style={styles.legalRow}>
        <Pressable onPress={() => Linking.openURL(LEGAL_URLS.terms)}>
          <Text style={styles.legal}>Terms</Text>
        </Pressable>
        <Text style={styles.legalSep}>·</Text>
        <Pressable onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>
          <Text style={styles.legal}>Privacy</Text>
        </Pressable>
        <Text style={styles.legalSep}>·</Text>
        <Pressable onPress={() => Linking.openURL(LEGAL_URLS.manageSubscription)}>
          <Text style={styles.legal}>Manage subscription</Text>
        </Pressable>
      </View>

      <View style={styles.tail} />
    </ScrollView>
  );
}

function makeStyles(t: Theme) {
  // The gutter the hero used to get from the scroll container's padding.
  const gutter = t.space(6);

  return StyleSheet.create({
    // No padding: the hero has to reach all three edges.
    scroll: { backgroundColor: t.color.surface, flexGrow: 1 },
    hero: {
      paddingHorizontal: t.space(6),
      paddingTop: t.space(6),
      paddingBottom: t.space(7),
      borderBottomLeftRadius: t.radius.xl,
      borderBottomRightRadius: t.radius.xl,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: t.space(4),
    },
    crown: {
      width: 46,
      height: 46,
      borderRadius: t.radius.pill,
      backgroundColor: 'rgba(255,255,255,0.16)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  
    title: { ...t.font.display, color: t.color.onHero },
    lede: {
      fontSize: 15,
      lineHeight: 22,
      color: t.color.onHeroMuted,
      marginTop: t.space(2),
    },
  
    benefits: {
      marginTop: t.space(6),
      marginHorizontal: t.space(6),
      gap: t.space(3),
    },
    benefitRow: { flexDirection: 'row', gap: t.space(3), alignItems: 'center' },
    tick: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: t.color.successSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    benefitText: { fontSize: 15, color: t.color.text, flex: 1 },
  
    loader: { marginTop: t.space(8) },
    unavailable: {
      marginTop: t.space(8),
      marginHorizontal: gutter,
      fontSize: 14,
      color: t.color.textMuted,
    },
  
    plans: { marginTop: t.space(7), marginHorizontal: gutter, gap: t.space(2.5) },
    plan: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: t.color.border,
      borderRadius: t.radius.lg,
      padding: t.space(4),
      backgroundColor: t.color.surface,
    },
    planOn: {
      borderColor: t.color.accent,
      backgroundColor: t.color.accentTint,
      ...t.shadow.sm,
    },
    planMain: { flex: 1 },
    planNameRow: { flexDirection: 'row', alignItems: 'center', gap: t.space(2) },
    planName: { fontSize: 16, fontWeight: '600', color: t.color.text },
    planNameOn: { color: t.color.accent },
    planPeriod: { ...t.font.hint, color: t.color.textMuted, marginTop: 2 },
    planPrice: { fontSize: 16, fontWeight: '600', color: t.color.text },
    planPriceOn: { color: t.color.accent },
  
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.space(2),
      marginTop: t.space(6),
      marginHorizontal: gutter,
      paddingVertical: t.space(4),
      borderRadius: t.radius.md,
      backgroundColor: t.color.accent,
      ...t.shadow.brand,
    },
    ctaOff: { opacity: 0.5 },
    ctaText: { fontSize: 16, fontWeight: '700', color: t.color.onAccent },
  
    terms: {
      fontSize: 12,
      lineHeight: 17,
      color: t.color.textFaint,
      marginTop: t.space(4),
      marginHorizontal: gutter,
    },
    ghost: { paddingVertical: t.space(4), alignItems: 'center' },
    ghostText: { fontSize: 14, fontWeight: '600', color: t.color.accent },
    legalRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: t.space(2),
      marginTop: t.space(2),
    },
    legal: { fontSize: 12, color: t.color.textMuted },
    legalSep: { fontSize: 12, color: t.color.textFaint },
    // The legal row is the last thing on the screen and was flush with the
    // bottom edge once the container stopped padding.
    tail: { height: t.space(8) },
  });
}
