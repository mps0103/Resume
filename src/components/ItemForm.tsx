import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Field, MonthPicker, ToggleRow } from './Field';
import { BulletEditor } from './BulletEditor';
import { SectionType } from '../types/resume';
import { Theme } from '../ui/theme';
import { useTheme } from '../ui/ThemeProvider';

type Patch = Record<string, unknown>;

interface Props {
  type: SectionType;
  item: any;
  onPatch: (patch: Patch) => void;
}

/**
 * One form per section type. Field order follows how people actually recall
 * the information — role before employer, qualification before institution —
 * rather than the order the template renders it in.
 */
export function ItemForm({ type, item, onPatch }: Props) {
  switch (type) {
    case 'experience':
      return (
        <View>
          <Field
            label="Role"
            value={item.role}
            onChangeText={v => onPatch({ role: v })}
            placeholder="Senior Software Engineer"
          />
          <Field
            label="Company"
            value={item.company}
            onChangeText={v => onPatch({ company: v })}
            placeholder="Acme Corporation"
          />
          <Field
            label="Location"
            value={item.location}
            onChangeText={v => onPatch({ location: v })}
            placeholder="City, Country"
          />
          <DateRange item={item} onPatch={onPatch} currentLabel="I work here now" />
          <BulletEditor
            bullets={item.bullets}
            onChange={b => onPatch({ bullets: b })}
          />
        </View>
      );

    case 'education':
      return (
        <View>
          <Field
            label="Qualification"
            value={item.degree}
            onChangeText={v => onPatch({ degree: v })}
            placeholder="B.Sc. Computer Science"
          />
          <Field
            label="Institution"
            value={item.institution}
            onChangeText={v => onPatch({ institution: v })}
          />
          <Field
            label="Location"
            value={item.location}
            onChangeText={v => onPatch({ location: v })}
          />
          <Field
            label="Score"
            value={item.score}
            onChangeText={v => onPatch({ score: v })}
            placeholder="GPA, grade or class"
            hint="Leave empty to hide it"
          />
          <DateRange item={item} onPatch={onPatch} currentLabel="I study here now" />
          <BulletEditor
            bullets={item.bullets}
            onChange={b => onPatch({ bullets: b })}
            placeholder="Coursework, thesis or an award worth naming"
          />
        </View>
      );

    case 'projects':
      return (
        <View>
          <Field
            label="Project"
            value={item.name}
            onChangeText={v => onPatch({ name: v })}
          />
          <Field
            label="Your role"
            value={item.role}
            onChangeText={v => onPatch({ role: v })}
            placeholder="Solo developer"
          />
          <Field
            label="Link"
            value={item.url}
            onChangeText={v => onPatch({ url: v })}
            autoCapitalize="none"
            keyboardType="url"
          />
          <DateRange item={item} onPatch={onPatch} currentLabel="Still working on it" />
          <BulletEditor
            bullets={item.bullets}
            onChange={b => onPatch({ bullets: b })}
            placeholder="What it does, and what you built"
          />
        </View>
      );

    case 'certifications':
      return (
        <View>
          <Field
            label="Certification"
            value={item.name}
            onChangeText={v => onPatch({ name: v })}
          />
          <Field
            label="Issuer"
            value={item.issuer}
            onChangeText={v => onPatch({ issuer: v })}
          />
          <MonthPicker
            label="Issued"
            value={item.date}
            onChange={v => onPatch({ date: v })}
          />
          <Field
            label="Link"
            value={item.url}
            onChangeText={v => onPatch({ url: v })}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>
      );

    case 'skills':
      return (
        <View>
          <Field
            label="Group"
            value={item.group}
            onChangeText={v => onPatch({ group: v })}
            placeholder="Languages"
            hint="Optional. Leave empty for an ungrouped list."
          />
          <Field
            label="Skills"
            value={(item.values ?? []).join(', ')}
            onChangeText={v =>
              onPatch({ values: v.split(',').map(s => s.trimStart()) })
            }
            placeholder="TypeScript, React, SQL"
            multiline
            hint="Separate with commas"
          />
        </View>
      );

    case 'languages':
      return (
        <View>
          <Field
            label="Language"
            value={item.name}
            onChangeText={v => onPatch({ name: v })}
          />
          <Field
            label="Proficiency"
            value={item.proficiency}
            onChangeText={v => onPatch({ proficiency: v })}
            placeholder="Native"
          />
        </View>
      );

    case 'custom':
      return (
        <View>
          <Field
            label="Title"
            value={item.title}
            onChangeText={v => onPatch({ title: v })}
          />
          <Field
            label="Subtitle"
            value={item.subtitle}
            onChangeText={v => onPatch({ subtitle: v })}
          />
          <DateRange item={item} onPatch={onPatch} currentLabel="Ongoing" />
          <BulletEditor
            bullets={item.bullets}
            onChange={b => onPatch({ bullets: b })}
          />
        </View>
      );
  }
}

function DateRange({
  item,
  onPatch,
  currentLabel,
}: {
  item: any;
  onPatch: (p: Patch) => void;
  currentLabel: string;
}) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View>
      <View style={styles.dateRow}>
        <View style={styles.dateCol}>
          <MonthPicker
            label="Start"
            value={item.startDate}
            onChange={v => onPatch({ startDate: v })}
          />
        </View>
        <View style={styles.dateCol}>
          <MonthPicker
            label="End"
            value={item.endDate}
            onChange={v => onPatch({ endDate: v })}
            disabled={item.current}
          />
        </View>
      </View>
      <ToggleRow
        label={currentLabel}
        value={item.current}
        onChange={v => onPatch({ current: v, endDate: v ? '' : item.endDate })}
      />
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    dateRow: { flexDirection: 'row', gap: t.space(3) },
    dateCol: { flex: 1 },
  });
}
