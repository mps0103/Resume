import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../ui/theme';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onSubmit: (value: string) => void;
}

/**
 * A single-field dialog.
 *
 * Alert.prompt is iOS-only — on Android it does nothing at all, so a rename
 * built on it would appear to work in review and silently do nothing on a
 * phone. This is the Android-safe equivalent.
 */
export function PromptDialog({
  visible,
  title,
  message,
  initialValue = '',
  placeholder,
  confirmLabel = 'Save',
  onCancel,
  onSubmit,
}: Props) {
  const [value, setValue] = useState(initialValue);

  // Reset each time it opens, so the previous edit does not leak into the
  // next one when the dialog is reused for a different row.
  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const trimmed = value.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.scrim} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={theme.color.textFaint}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={() => trimmed && onSubmit(trimmed)}
          />

          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.confirm, !trimmed && styles.disabled]}
              disabled={!trimmed}
              onPress={() => onSubmit(trimmed)}
            >
              <Text style={styles.confirmLabel}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(16,19,23,0.45)',
    justifyContent: 'center',
    padding: theme.space(6),
  },
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space(5),
  },
  title: { fontSize: 17, fontWeight: '600', color: theme.color.text },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.color.textMuted,
    marginTop: theme.space(2),
  },
  input: {
    marginTop: theme.space(4),
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space(3),
    paddingVertical: theme.space(3),
    fontSize: 16,
    color: theme.color.text,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.space(2),
    marginTop: theme.space(5),
  },
  button: {
    paddingVertical: theme.space(2.5),
    paddingHorizontal: theme.space(5),
    borderRadius: theme.radius.md,
  },
  buttonLabel: { fontSize: 15, fontWeight: '600', color: theme.color.textMuted },
  confirm: { backgroundColor: theme.color.accent },
  confirmLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },
  disabled: { opacity: 0.5 },
});
