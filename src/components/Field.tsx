import React, { useMemo, useState } from 'react';
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
import { Theme } from '../ui/theme';
import { useTheme } from '../ui/ThemeProvider';

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  /** Shown under the field once the user has left it empty-but-required. */
  error?: string;
}

export function Field({ label, hint, error, ...input }: FieldProps) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

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
        placeholderTextColor={t.color.textFaint}
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
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

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
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{rowLabel}</Text>
        {!!hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: t.color.accent, false: '#CBD1D8' }}
        thumbColor="#fff"
      />
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    field: { marginBottom: t.space(4) },
    label: {
      ...t.font.label,
      color: t.color.textMuted,
      marginBottom: t.space(1.5),
    },
    input: {
      backgroundColor: t.color.surface,
      borderWidth: 1,
      borderColor: t.color.border,
      borderRadius: t.radius.md,
      paddingHorizontal: t.space(3),
      paddingVertical: t.space(2.75),
      fontSize: 15,
      color: t.color.text,
    },
    inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
    inputFocused: { borderColor: t.color.accent, backgroundColor: '#fff' },
    inputError: { borderColor: t.color.danger },
    error: { ...t.font.hint, color: t.color.danger, marginTop: t.space(1) },
    hint: { ...t.font.hint, color: t.color.textFaint, marginTop: t.space(1) },
  
    picker: { justifyContent: 'center' },
    pickerDisabled: { backgroundColor: '#F0F2F4' },
    pickerValue: { fontSize: 15, color: t.color.text },
    pickerValueDisabled: { color: t.color.textMuted },
    pickerPlaceholder: { color: t.color.textFaint },
  
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(16,19,23,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: t.color.surface,
      borderTopLeftRadius: t.radius.lg,
      borderTopRightRadius: t.radius.lg,
      padding: t.space(5),
      paddingBottom: t.space(8),
    },
    sheetTitle: {
      ...t.font.title,
      color: t.color.text,
      marginBottom: t.space(4),
    },
    yearRow: { marginBottom: t.space(4), flexGrow: 0 },
    yearChip: {
      paddingHorizontal: t.space(3.5),
      paddingVertical: t.space(2),
      borderRadius: t.radius.sm,
      marginRight: t.space(2),
      backgroundColor: t.color.bg,
    },
    yearChipOn: { backgroundColor: t.color.accent },
    yearText: { fontSize: 14, color: t.color.textMuted },
    yearTextOn: { color: '#fff', fontWeight: '600' },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space(2) },
    monthCell: {
      width: '23%',
      paddingVertical: t.space(3),
      alignItems: 'center',
      borderRadius: t.radius.sm,
      backgroundColor: t.color.bg,
    },
    monthCellOn: { backgroundColor: t.color.accent },
    monthText: { fontSize: 14, color: t.color.text },
    monthTextOn: { color: '#fff', fontWeight: '600' },
    clearBtn: { marginTop: t.space(5), alignItems: 'center' },
    clearText: { fontSize: 14, color: t.color.textMuted },
  
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: t.space(4),
      gap: t.space(4),
    },
    toggleText: { flex: 1 },
    toggleLabel: { fontSize: 15, color: t.color.text },
  });
}
