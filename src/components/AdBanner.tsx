import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNITS, bannerEnabled } from '../services/ads';
import { theme } from '../ui/theme';

/**
 * Reserves its height only once an ad has actually loaded, so a failed fill
 * does not leave a grey band across the screen. Padding above and below
 * keeps a stray thumb away from the ad, which Google requires.
 */
export function AdBanner({ entitlement }: { entitlement: 'free' | 'pro' }) {
  const [loaded, setLoaded] = useState(false);
  if (!bannerEnabled(entitlement)) return null;

  return (
    <View style={[styles.slot, loaded && styles.slotLoaded]}>
      <BannerAd
        unitId={AD_UNITS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={() => setLoaded(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: 'center', backgroundColor: theme.color.bg },
  slotLoaded: {
    paddingVertical: theme.space(2),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border,
  },
});
