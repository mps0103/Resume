import React, { useEffect, useState } from 'react';
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
import { theme } from '../ui/theme';
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
      <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <Text style={styles.title}>Resume Builder Pro</Text>
      <Text style={styles.lede}>
        The free plan gives you {FREE_EXPORT_ALLOWANCE} watermarked exports.
        Pro removes both limits.
      </Text>

      <View style={styles.benefits}>
        {BENEFITS.map(b => (
          <View key={b} style={styles.benefitRow}>
            <Text style={styles.tick}>✓</Text>
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.color.accent} />
      ) : plans.length === 0 ? (
        <Text style={styles.unavailable}>
          Plans could not be loaded. Check your connection and try again.
        </Text>
      ) : (
        <View style={styles.plans}>
          {plans.map(plan => {
            const on = selected?.sku === plan.sku;
            return (
              <Pressable
                key={plan.sku}
                onPress={() => setSelected(plan)}
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
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        style={[styles.cta, (busy || !selected) && styles.ctaOff]}
        onPress={handleBuy}
        disabled={!!busy || !selected}
      >
        {busy && busy !== 'restore' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.ctaText}>Subscribe</Text>
        )}
      </Pressable>

      {/*
        Play requires the renewal terms to be visible before purchase, not
        only in the store listing.
      */}
      <Text style={styles.terms}>
        Billed through Google Play and renews automatically until cancelled.
        Cancel any time in the Play Store, at least 24 hours before the
        period ends.
      </Text>

      <Pressable onPress={handleRestore} style={styles.ghost} disabled={!!busy}>
        <Text style={styles.ghostText}>
          {busy === 'restore' ? 'Checking…' : 'Restore purchase'}
        </Text>
      </Pressable>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: theme.space(6),
    paddingTop: theme.space(12),
    backgroundColor: theme.color.surface,
    flexGrow: 1,
  },
  close: { position: 'absolute', top: theme.space(5), right: theme.space(5) },
  closeText: { fontSize: 18, color: theme.color.textMuted },

  title: { fontSize: 26, fontWeight: '600', color: theme.color.text },
  lede: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.color.textMuted,
    marginTop: theme.space(2),
  },

  benefits: { marginTop: theme.space(6), gap: theme.space(2.5) },
  benefitRow: { flexDirection: 'row', gap: theme.space(3), alignItems: 'center' },
  tick: { fontSize: 14, color: theme.color.success, fontWeight: '700' },
  benefitText: { fontSize: 15, color: theme.color.text, flex: 1 },

  loader: { marginTop: theme.space(8) },
  unavailable: {
    marginTop: theme.space(8),
    fontSize: 14,
    color: theme.color.textMuted,
  },

  plans: { marginTop: theme.space(7), gap: theme.space(2.5) },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    padding: theme.space(4),
  },
  planOn: { borderColor: theme.color.accent, backgroundColor: theme.color.accentSoft },
  planMain: { flex: 1 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space(2) },
  planName: { fontSize: 16, fontWeight: '600', color: theme.color.text },
  planNameOn: { color: theme.color.accent },
  planPeriod: { ...theme.font.hint, color: theme.color.textMuted, marginTop: 2 },
  planPrice: { fontSize: 16, fontWeight: '600', color: theme.color.text },
  planPriceOn: { color: theme.color.accent },

  cta: {
    marginTop: theme.space(6),
    paddingVertical: theme.space(4),
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.accent,
    alignItems: 'center',
  },
  ctaOff: { opacity: 0.5 },
  ctaText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  terms: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.color.textFaint,
    marginTop: theme.space(4),
  },
  ghost: { paddingVertical: theme.space(4), alignItems: 'center' },
  ghostText: { fontSize: 14, fontWeight: '600', color: theme.color.accent },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.space(2),
    marginTop: theme.space(2),
  },
  legal: { fontSize: 12, color: theme.color.textMuted },
  legalSep: { fontSize: 12, color: theme.color.textFaint },
});
