import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { theme } from '../ui/theme';

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  /** Shown under the field once the user has left it empty-but-required. */
  error?: string;
}

export function Field({ label, hint, error, ...input }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...input}
        onFocus={e => {
          setFocused(true);
          input.onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          input.onBlur?.(e);
        }}
        placeholderTextColor={theme.color.textFaint}
        style={[
          styles.input,
          input.multiline && styles.inputMultiline,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!error && !!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function monthLabel(value: string): string {
  if (!value) return 'Select';
  const [y, m] = value.split('-');
  const i = parseInt(m, 10) - 1;
  return i >= 0 && i < 12 ? `${MONTHS[i]} ${y}` : value;
}

/**
 * Free typing of dates is the single biggest source of malformed resumes,
 * so the value is always picked, never typed, and always stored as YYYY-MM.
 */
export function MonthPicker({
  label: fieldLabel,
  value,
  onChange,
  disabled,
  minYear = new Date().getFullYear() - 45,
  maxYear = new Date().getFullYear() + 6,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  minYear?: number;
  maxYear?: number;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() =>
    value ? parseInt(value.split('-')[0], 10) : new Date().getFullYear(),
  );

  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{fieldLabel}</Text>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={[styles.input, styles.picker, disabled && styles.pickerDisabled]}
      >
        <Text
          style={[
            styles.pickerValue,
            !value && styles.pickerPlaceholder,
            disabled && styles.pickerValueDisabled,
          ]}
        >
          {disabled ? 'Present' : monthLabel(value)}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{fieldLabel}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearRow}>
              {years.map(y => (
                <Pressable
                  key={y}
                  onPress={() => setYear(y)}
                  style={[styles.yearChip, y === year && styles.yearChipOn]}
                >
                  <Text style={[styles.yearText, y === year && styles.yearTextOn]}>{y}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.monthGrid}>
              {MONTHS.map((m, i) => {
                const v = `${year}-${String(i + 1).padStart(2, '0')}`;
                const on = v === value;
                return (
                  <Pressable
                    key={m}
                    onPress={() => {
                      onChange(v);
                      setOpen(false);
                    }}
                    style={[styles.monthCell, on && styles.monthCellOn]}
                  >
                    <Text style={[styles.monthText, on && styles.monthTextOn]}>{m}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => {
                onChange('');
                setOpen(false);
              }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearText}>Clear date</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function ToggleRow({
  label: rowLabel,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{rowLabel}</Text>
        {!!hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.color.accent, false: '#CBD1D8' }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: theme.space(4) },
  label: {
    ...theme.font.label,
    color: theme.color.textMuted,
    marginBottom: theme.space(1.5),
  },
  input: {
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space(3),
    paddingVertical: theme.space(2.75),
    fontSize: 15,
    color: theme.color.text,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  inputFocused: { borderColor: theme.color.accent, backgroundColor: '#fff' },
  inputError: { borderColor: theme.color.danger },
  error: { ...theme.font.hint, color: theme.color.danger, marginTop: theme.space(1) },
  hint: { ...theme.font.hint, color: theme.color.textFaint, marginTop: theme.space(1) },

  picker: { justifyContent: 'center' },
  pickerDisabled: { backgroundColor: '#F0F2F4' },
  pickerValue: { fontSize: 15, color: theme.color.text },
  pickerValueDisabled: { color: theme.color.textMuted },
  pickerPlaceholder: { color: theme.color.textFaint },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(16,19,23,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.color.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.space(5),
    paddingBottom: theme.space(8),
  },
  sheetTitle: {
    ...theme.font.title,
    color: theme.color.text,
    marginBottom: theme.space(4),
  },
  yearRow: { marginBottom: theme.space(4), flexGrow: 0 },
  yearChip: {
    paddingHorizontal: theme.space(3.5),
    paddingVertical: theme.space(2),
    borderRadius: theme.radius.sm,
    marginRight: theme.space(2),
    backgroundColor: theme.color.bg,
  },
  yearChipOn: { backgroundColor: theme.color.accent },
  yearText: { fontSize: 14, color: theme.color.textMuted },
  yearTextOn: { color: '#fff', fontWeight: '600' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) },
  monthCell: {
    width: '23%',
    paddingVertical: theme.space(3),
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.color.bg,
  },
  monthCellOn: { backgroundColor: theme.color.accent },
  monthText: { fontSize: 14, color: theme.color.text },
  monthTextOn: { color: '#fff', fontWeight: '600' },
  clearBtn: { marginTop: theme.space(5), alignItems: 'center' },
  clearText: { fontSize: 14, color: theme.color.textMuted },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.space(4),
    gap: theme.space(4),
  },
  toggleText: { flex: 1 },
  toggleLabel: { fontSize: 15, color: theme.color.text },
});
