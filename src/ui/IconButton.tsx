import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Theme } from './theme';
import { useTheme } from './ThemeProvider';
import { Touchable } from './Touchable';
import { Icon, IconName } from './Icon';

interface Props {
  name: IconName;
  onPress?: () => void;
  disabled?: boolean;
  size?: number;
  color?: string;
  /** A tinted circle behind the glyph. */
  tone?: 'plain' | 'soft' | 'danger' | 'onDark';
  label: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * A square tap target around a single glyph.
 *
 * Fixed at 40pt even when the icon inside is 18, because the editor's row
 * controls sit next to each other and anything smaller is a coin toss on a
 * phone. `label` is required and is not drawn — it is the accessibility
 * name, which an icon-only control has no other way to carry.
 */
export function IconButton({
  name,
  onPress,
  disabled,
  size = 19,
  color,
  tone = 'plain',
  label,
  style,
}: Props) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const tint =
    color ??
    (tone === 'danger'
      ? t.color.danger
      : tone === 'soft'
      ? t.color.accent
      : tone === 'onDark'
      ? '#fff'
      : t.color.textMuted);

  return (
    <Touchable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      scaleTo={0.88}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.base,
        tone === 'soft' && styles.soft,
        tone === 'danger' && styles.dangerTone,
        tone === 'onDark' && styles.onDark,
        disabled && styles.off,
        style,
      ]}
    >
      <View pointerEvents="none">
        <Icon name={name} size={size} color={tint} />
      </View>
    </Touchable>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    base: {
      width: 40,
      height: 40,
      borderRadius: t.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    soft: { backgroundColor: t.color.accentTint },
    dangerTone: { backgroundColor: t.color.dangerSoft },
    onDark: { backgroundColor: 'rgba(255,255,255,0.16)' },
    off: { opacity: 0.3 },
  });
}
