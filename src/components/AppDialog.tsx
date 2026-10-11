import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../ui/theme';

/**
 * An in-app replacement for Alert.alert.
 *
 * Alert.alert draws the platform's AlertDialog, which is themed by the
 * device, not by this app. On a phone in dark mode it comes up charcoal grey
 * with whatever accent colour the manufacturer chose — teal on this one —
 * in the middle of a light app with a navy accent. It reads as a system
 * error popup rather than as part of the product.
 *
 * The signature deliberately mirrors Alert.alert's so call sites are a
 * rename and nothing more, including the { text, onPress, style } buttons.
 */

export type DialogButtonStyle = 'default' | 'cancel' | 'destructive';

export interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: DialogButtonStyle;
}

interface DialogRequest {
  title: string;
  message?: string;
  buttons: DialogButton[];
}

type Listener = (queue: DialogRequest[]) => void;

/**
 * Queued rather than replaced. Two alerts can be raised in the same tick —
 * an export finishing while a restore reports its result — and dropping one
 * loses a message the user needed.
 */
let queue: DialogRequest[] = [];
let notify: Listener | null = null;

function publish() {
  notify?.([...queue]);
}

/** Drop-in for Alert.alert. Safe to call from anywhere, including services. */
export function appAlert(
  title: string,
  message?: string,
  buttons?: DialogButton[],
): void {
  queue = [
    ...queue,
    { title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] },
  ];
  publish();
}

/**
 * Mounted once, at the app root, above every screen.
 *
 * It sits outside the navigation tree on purpose: a dialog raised by a
 * screen that then unmounts — an export alert on a preview the user backs
 * out of — must still be dismissible.
 */
export function DialogHost() {
  const [pending, setPending] = useState<DialogRequest[]>([]);

  useEffect(() => {
    notify = setPending;
    setPending([...queue]);
    return () => {
      notify = null;
    };
  }, []);

  const current = pending[0];

  function dismiss(button?: DialogButton) {
    queue = queue.slice(1);
    publish();
    // After the state update, so a handler that raises another dialog
    // enqueues behind this one rather than being cleared by the shift.
    button?.onPress?.();
  }

  if (!current) return null;

  // Two short buttons sit comfortably side by side. Three will not fit on a
  // narrow phone, and neither will two wordy ones, so both stack instead of
  // truncating a label the user has to read to choose.
  const longest = Math.max(...current.buttons.map(b => b.text.length));
  const stacked = current.buttons.length > 2 || longest > 14;

  const cancelButton =
    current.buttons.find(b => b.style === 'cancel') ?? current.buttons[0];

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      // The hardware back button behaves like the cancel action.
      onRequestClose={() => dismiss(cancelButton)}
    >
      <View style={styles.scrim}>
        <View style={styles.card}>
          <Text style={styles.title}>{current.title}</Text>

          {!!current.message && (
            <ScrollView
              style={styles.messageScroll}
              contentContainerStyle={styles.messageContent}
              bounces={false}
            >
              <Text style={styles.message}>{current.message}</Text>
            </ScrollView>
          )}

          <View style={[styles.actions, stacked && styles.actionsStacked]}>
            {current.buttons.map((button, i) => {
              const primary = !stacked && i === current.buttons.length - 1;
              return (
                <Pressable
                  key={`${button.text}-${i}`}
                  onPress={() => dismiss(button)}
                  style={({ pressed }) => [
                    styles.button,
                    stacked ? styles.buttonStacked : styles.buttonInline,
                    primary && button.style !== 'destructive' && styles.buttonPrimary,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonLabel,
                      primary && button.style !== 'destructive' && styles.buttonLabelPrimary,
                      button.style === 'destructive' && styles.buttonLabelDanger,
                      button.style === 'cancel' && styles.buttonLabelCancel,
                    ]}
                    numberOfLines={1}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(16,19,23,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space(6),
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    paddingTop: theme.space(5),
    paddingBottom: theme.space(3),
    paddingHorizontal: theme.space(5),
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.color.text,
  },
  // Capped so a long message — a restore summary listing every resume —
  // scrolls instead of pushing the buttons off the bottom of the screen.
  messageScroll: { maxHeight: 280, marginTop: theme.space(2) },
  messageContent: { paddingBottom: theme.space(1) },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.color.textMuted,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.space(2),
    marginTop: theme.space(5),
  },
  actionsStacked: { flexDirection: 'column-reverse', gap: theme.space(2) },
  button: {
    paddingVertical: theme.space(3),
    paddingHorizontal: theme.space(4),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInline: { minWidth: 92 },
  buttonStacked: { width: '100%' },
  buttonPrimary: { backgroundColor: theme.color.accent },
  buttonPressed: { opacity: 0.7 },
  buttonLabel: { fontSize: 15, fontWeight: '600', color: theme.color.accent },
  buttonLabelPrimary: { color: '#fff' },
  buttonLabelDanger: { color: theme.color.danger },
  buttonLabelCancel: { color: theme.color.textMuted },
});
