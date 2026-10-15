import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from './theme';
import { useTheme } from './ThemeProvider';
import { Touchable } from './Touchable';
import { Icon, IconName } from './Icon';

interface Props {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  icon?: IconName;
  /** Non-interactive colour variants, for badges rather than filters. */
  tone?: 'default' | 'gold' | 'success' | 'warn';
}

/**
 * A pill. Used both as a filter (with `selected`) and as a badge.
 *
 * The previous filters were square-cornered bordered boxes, which read as
 * disabled text fields rather than as something to tap.
 */
export function Chip({
  label,
  onPress,
  selected,
  icon,
  tone = 'default',
}: Props) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const toned = tone !== 'default';
  const fg = selected
    ? t.color.onAccent
    : tone === 'gold'
    ? t.color.gold
    : tone === 'success'
    ? t.color.success
    : tone === 'warn'
    ? t.color.warn
    : t.color.textMuted;

  const body = (
    <View
      style={[
        styles.base,
        selected && styles.on,
        tone === 'gold' && styles.gold,
        tone === 'success' && styles.success,
        tone === 'warn' && styles.warn,
      ]}
    >
      {icon && <Icon name={icon} size={13} color={fg} style={styles.icon} />}
      <Text
        style={[
          styles.label,
          { color: fg },
          (selected || toned) && styles.labelOn,
        ]}
      >
        {label}
      </Text>
    </View>
  );

  // A badge must not be tappable, or it steals the press from the card it
  // is sitting on.
  return onPress ? (
    <Touchable onPress={onPress} scaleTo={0.94}>
      {body}
    </Touchable>
  ) : (
    body
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: t.space(3.5),
      paddingVertical: t.space(2),
      borderRadius: t.radius.pill,
      backgroundColor: t.color.surface,
      borderWidth: 1,
      borderColor: t.color.border,
    },
    on: {
      backgroundColor: t.color.accent,
      borderColor: t.color.accent,
      ...t.shadow.brand,
    },
    gold: { backgroundColor: t.color.goldSoft, borderColor: '#EBD9A8' },
    success: { backgroundColor: t.color.successSoft, borderColor: '#BFE6D6' },
    warn: { backgroundColor: t.color.warnSoft, borderColor: '#F0DCB8' },
    icon: { marginRight: t.space(1.5) },
    label: { fontSize: 13, fontWeight: '500' },
    labelOn: { fontWeight: '700' },
  });
}
