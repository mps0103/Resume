import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../ui/theme';
import { useTheme } from '../ui/ThemeProvider';

export interface SheetAction {
  label: string;
  hint?: string;
  destructive?: boolean;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  title?: string;
  actions: SheetAction[];
  onClose: () => void;
}

/**
 * A bottom sheet of actions.
 *
 * This exists because Android's AlertDialog has exactly three button slots —
 * positive, negative and neutral — and silently drops anything beyond them.
 * A four-item Alert menu therefore loses an item with no error and no
 * warning, which is how the row menu ended up with no Cancel.
 */
export function ActionSheet({ visible, title, actions, onClose }: Props) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Also handles the hardware back button while the sheet is open.
      onRequestClose={onClose}
    >
      <Pressable style={styles.scrim} onPress={onClose}>
        {/* Swallows taps so pressing the sheet itself does not dismiss it. */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          {!!title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}

          <View style={styles.actions}>
            {actions.map(action => (
              <Pressable
                key={action.label}
                style={styles.row}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
              >
                <Text
                  style={[styles.label, action.destructive && styles.destructive]}
                >
                  {action.label}
                </Text>
                {!!action.hint && <Text style={styles.hint}>{action.hint}</Text>}
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    scrim: {
      flex: 1,
      backgroundColor: 'rgba(16,19,23,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: t.color.surface,
      borderTopLeftRadius: t.radius.lg,
      borderTopRightRadius: t.radius.lg,
      paddingTop: t.space(4),
      paddingBottom: t.space(4),
      paddingHorizontal: t.space(3),
    },
    title: {
      ...t.font.section,
      color: t.color.textMuted,
      paddingHorizontal: t.space(3),
      paddingBottom: t.space(2),
    },
    actions: {
      borderRadius: t.radius.md,
      overflow: 'hidden',
    },
    row: {
      paddingVertical: t.space(3.5),
      paddingHorizontal: t.space(3),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.color.border,
    },
    label: { fontSize: 16, color: t.color.text },
    destructive: { color: t.color.danger },
    hint: { ...t.font.hint, color: t.color.textFaint, marginTop: 2 },
    cancel: {
      marginTop: t.space(3),
      paddingVertical: t.space(3.5),
      borderRadius: t.radius.md,
      alignItems: 'center',
      backgroundColor: t.color.bg,
    },
    cancelLabel: { fontSize: 16, fontWeight: '600', color: t.color.text },
  });
}
