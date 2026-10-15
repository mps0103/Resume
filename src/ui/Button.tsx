import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Theme } from './theme';
import { useTheme } from './ThemeProvider';
import { Touchable } from './Touchable';
import { Icon, IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  /** Drawn before the label. */
  icon?: IconName;
  /** A second line under the label, for explaining a primary action. */
  hint?: string;
  disabled?: boolean;
  /** Shows the label as the busy state and blocks the press. */
  busy?: boolean;
  busyLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The app's buttons, in one place.
 *
 * Previously every screen styled its own, which is why the primary action
 * was a slightly different height and radius on each one. The variants are
 * deliberately only four: anything that does not fit is a plain Touchable.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  hint,
  disabled,
  busy,
  busyLabel,
  style,
}: Props) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const off = disabled || busy;
  const tone =
    variant === 'primary'
      ? t.color.onAccent
      : variant === 'danger'
      ? t.color.danger
      : variant === 'ghost'
      ? t.color.accent
      : t.color.text;

  return (
    <Touchable
      onPress={off ? undefined : onPress}
      disabled={off}
      // Buttons are small targets next to cards, so they need a deeper dip
      // to register as having moved at all.
      scaleTo={0.96}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        off && styles.off,
        style,
      ]}
    >
      <View style={styles.row}>
        {icon && !busy && (
          <Icon name={icon} size={18} color={tone} style={styles.icon} />
        )}
        <Text style={[styles.label, { color: tone }]}>
          {busy ? busyLabel ?? 'Working…' : label}
        </Text>
      </View>
      {hint && !busy && (
        <Text
          style={[
            styles.hint,
            variant === 'primary' ? styles.hintOnFill : styles.hintOnSurface,
          ]}
        >
          {hint}
        </Text>
      )}
    </Touchable>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    base: {
      minHeight: 52,
      paddingVertical: t.space(3),
      paddingHorizontal: t.space(4),
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    icon: { marginRight: t.space(2) },
  
    primary: { backgroundColor: t.color.accent, ...t.shadow.brand },
    secondary: {
      backgroundColor: t.color.surface,
      borderWidth: 1,
      borderColor: t.color.borderStrong,
    },
    danger: { backgroundColor: t.color.dangerSoft },
    ghost: { backgroundColor: 'transparent', minHeight: 44 },
    off: { opacity: 0.55 },
  
    label: { fontSize: 15, fontWeight: '600', letterSpacing: -0.1 },
    hint: { fontSize: 12, marginTop: 3, textAlign: 'center' },
    hintOnFill: { color: 'rgba(255,255,255,0.82)' },
    hintOnSurface: { color: t.color.textMuted },
  });
}
