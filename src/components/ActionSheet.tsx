import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../ui/theme';

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

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(16,19,23,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.color.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingTop: theme.space(4),
    paddingBottom: theme.space(4),
    paddingHorizontal: theme.space(3),
  },
  title: {
    ...theme.font.section,
    color: theme.color.textMuted,
    paddingHorizontal: theme.space(3),
    paddingBottom: theme.space(2),
  },
  actions: {
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  row: {
    paddingVertical: theme.space(3.5),
    paddingHorizontal: theme.space(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
  },
  label: { fontSize: 16, color: theme.color.text },
  destructive: { color: theme.color.danger },
  hint: { ...theme.font.hint, color: theme.color.textFaint, marginTop: 2 },
  cancel: {
    marginTop: theme.space(3),
    paddingVertical: theme.space(3.5),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    backgroundColor: theme.color.bg,
  },
  cancelLabel: { fontSize: 16, fontWeight: '600', color: theme.color.text },
});
