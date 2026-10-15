import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
  /** Top (or left) colour. */
  from: string;
  /** Bottom (or right) colour. */
  to: string;
  horizontal?: boolean;
  /**
   * Number of bands.
   *
   * 12 banded visibly across a phone-width hero — at roughly 35px a band
   * the eye picks out every edge. 28 puts them under about 15px, which
   * reads as a gradient, and 28 Views cost nothing next to the WebViews
   * this app renders elsewhere. A small swatch can pass a lower number.
   */
  steps?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** '#RRGGBB' → [r, g, b]. Shorthand hex is not accepted on purpose. */
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * A linear gradient built from stacked bands.
 *
 * react-native-linear-gradient would be one import, but it is a native
 * module: it needs a rebuild, and this app's Android build is particular
 * enough that spending that risk on a background is a poor trade. A dozen
 * absolutely-positioned Views cost nothing measurable and are indistinguish-
 * able from a real gradient behind text.
 *
 * Bands overlap by a pixel. Without that, Android's rounding can leave hair-
 * line seams of the parent background between them on some screen densities.
 */
export function Gradient({
  from,
  to,
  horizontal = false,
  steps = 28,
  style,
  children,
}: Props) {
  const bands = useMemo(() => {
    const a = parseHex(from);
    const b = parseHex(to);
    const size = `${100 / steps + 0.4}%`;

    return Array.from({ length: steps }, (_, i) => {
      const t = i / (steps - 1);
      const rgb = a.map((channel, c) =>
        clamp255(channel + (b[c] - channel) * t),
      );
      const offset = `${(i * 100) / steps}%`;

      return (
        <View
          key={i}
          pointerEvents="none"
          style={[
            styles.band,
            horizontal
              ? { left: offset, top: 0, bottom: 0, width: size }
              : { top: offset, left: 0, right: 0, height: size },
            { backgroundColor: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` },
          ]}
        />
      );
    });
  }, [from, to, horizontal, steps]);

  return (
    <View style={[styles.root, { backgroundColor: to }, style]}>
      {bands}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // The children have to sit above the bands, and bands are absolute, so
  // this only needs to establish the stacking context.
  root: { overflow: 'hidden' },
  band: { position: 'absolute' },
});
