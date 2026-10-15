import React, { useMemo, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ComponentRef } from 'react';
import { Theme } from '../ui/theme';
import { useTheme } from '../ui/ThemeProvider';

/**
 * Bullets are the part users spend most of their time on, so the editor
 * keeps focus: pressing return at the end of a bullet creates the next one
 * rather than inserting a newline. Newlines inside a bullet would break
 * list rendering in the templates anyway.
 */
export function BulletEditor({
  bullets,
  onChange,
  placeholder = 'Describe one result, with a number where you can',
}: {
  bullets: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  type TextInputHandle = ComponentRef<typeof TextInput>;
  const refs = useRef<Record<number, TextInputHandle | null>>({});

  function setAt(index: number, value: string) {
    const next = [...bullets];
    next[index] = value.replace(/\n/g, ' ');
    onChange(next);
  }

  function addAfter(index: number) {
    const next = [...bullets];
    next.splice(index + 1, 0, '');
    onChange(next);
    setTimeout(() => refs.current[index + 1]?.focus(), 50);
  }

  function removeAt(index: number) {
    if (bullets.length === 1) {
      onChange(['']);
      return;
    }
    onChange(bullets.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    const to = index + delta;
    if (to < 0 || to >= bullets.length) return;
    const next = [...bullets];
    const [m] = next.splice(index, 1);
    next.splice(to, 0, m);
    onChange(next);
  }

  const list = bullets.length ? bullets : [''];

  return (
    <View style={styles.root}>
      <Text style={styles.label}>Highlights</Text>

      {list.map((b, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.dot} />
          <TextInput
            ref={r => {
              refs.current[i] = r;
            }}
            value={b}
            onChangeText={v => setAt(i, v)}
            onSubmitEditing={() => addAfter(i)}
            blurOnSubmit={false}
            returnKeyType="next"
            multiline
            placeholder={placeholder}
            placeholderTextColor={t.color.textFaint}
            style={styles.input}
          />
          <View style={styles.actions}>
            <Pressable
              onPress={() => move(i, -1)}
              disabled={i === 0}
              hitSlop={6}
              style={[styles.iconBtn, i === 0 && styles.iconBtnOff]}
            >
              <Text style={styles.icon}>↑</Text>
            </Pressable>
            <Pressable
              onPress={() => move(i, 1)}
              disabled={i === list.length - 1}
              hitSlop={6}
              style={[styles.iconBtn, i === list.length - 1 && styles.iconBtnOff]}
            >
              <Text style={styles.icon}>↓</Text>
            </Pressable>
            <Pressable onPress={() => removeAt(i)} hitSlop={6} style={styles.iconBtn}>
              <Text style={[styles.icon, styles.iconDanger]}>✕</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Pressable onPress={() => addAfter(list.length - 1)} style={styles.add}>
        <Text style={styles.addText}>Add highlight</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { marginBottom: t.space(4) },
    label: {
      ...t.font.label,
      color: t.color.textMuted,
      marginBottom: t.space(2),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: t.color.surface,
      borderWidth: 1,
      borderColor: t.color.border,
      borderRadius: t.radius.md,
      paddingHorizontal: t.space(3),
      paddingVertical: t.space(2),
      marginBottom: t.space(2),
      gap: t.space(2),
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: t.color.accent,
      marginTop: t.space(3.5),
    },
    input: {
      flex: 1,
      fontSize: 15,
      lineHeight: 21,
      color: t.color.text,
      paddingVertical: t.space(1),
    },
    actions: { flexDirection: 'row', gap: t.space(1), marginTop: t.space(1) },
    iconBtn: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: t.radius.sm,
    },
    iconBtnOff: { opacity: 0.25 },
    icon: { fontSize: 14, color: t.color.textMuted },
    iconDanger: { color: t.color.danger },
    add: { paddingVertical: t.space(2.5), alignItems: 'center' },
    addText: { fontSize: 14, fontWeight: '600', color: t.color.accent },
  });
}
