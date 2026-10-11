import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Field, ToggleRow } from '../components/Field';
import {
  Resume,
  SectionType,
  DEFAULT_SECTION_TITLES,
  DEFAULT_DECLARATION_TEXT,
} from '../types/resume';
import {
  addLink,
  addSection,
  moveSection,
  removeLink,
  removeSection,
  setBasics,
  setDeclaration,
  setSummary,
  toggleSectionVisible,
  updateLink,
} from '../data/mutations';
import { completeness } from '../services/completeness';
import { theme } from '../ui/theme';
import { appAlert } from '../components/AppDialog';

interface Props {
  resume: Resume;
  saving: boolean;
  update: (fn: (r: Resume) => Resume) => void;
  onOpenSection: (sectionId: string) => void;
  onPreview: () => void;
}

/** 'YYYY-MM-DD' for the device's local today, not UTC. */
function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const ADDABLE: SectionType[] = [
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'custom',
];

export function EditorScreen({
  resume,
  saving,
  update,
  onOpenSection,
  onPreview,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const progress = useMemo(() => completeness(resume), [resume]);

  const sections = useMemo(
    () => [...resume.sections].sort((a, b) => a.order - b.order),
    [resume.sections],
  );

  function confirmRemove(sectionId: string, title: string, count: number) {
    if (count === 0) {
      update(r => removeSection(r, sectionId));
      return;
    }
    appAlert(
      `Remove ${title}?`,
      `This deletes ${count} ${count === 1 ? 'entry' : 'entries'}. To keep them, hide the section instead.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide it',
          onPress: () => update(r => toggleSectionVisible(r, sectionId)),
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => update(r => removeSection(r, sectionId)),
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.progressCard}>
          <View style={styles.progressHead}>
            <Text style={styles.progressPct}>
              {Math.round(progress.score * 100)}% complete
            </Text>
            <Text style={styles.saveState}>
              {saving ? 'Saving' : 'Saved'}
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[styles.fill, { width: `${Math.max(4, progress.score * 100)}%` }]}
            />
          </View>
          {!!progress.nextStep && (
            <Text style={styles.nextStep}>{progress.nextStep}</Text>
          )}
        </View>

        <Text style={styles.groupHeading}>About you</Text>
        <View style={styles.card}>
          <Field
            label="Full name"
            value={resume.basics.fullName}
            onChangeText={v => update(r => setBasics(r, { fullName: v }))}
            placeholder="Jane Doe"
          />
          <Field
            label="Headline"
            value={resume.basics.headline}
            onChangeText={v => update(r => setBasics(r, { headline: v }))}
            placeholder="Software Engineer"
            hint="The role you're applying for reads better than your current title"
          />
          <Field
            label="Email"
            value={resume.basics.email}
            onChangeText={v => update(r => setBasics(r, { email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Phone"
            value={resume.basics.phone}
            onChangeText={v => update(r => setBasics(r, { phone: v }))}
            keyboardType="phone-pad"
          />
          <Field
            label="Location"
            value={resume.basics.location}
            onChangeText={v => update(r => setBasics(r, { location: v }))}
            placeholder="City, Country"
            hint="City and country is enough — no street address"
          />
        </View>

        <Text style={styles.groupHeading}>Links</Text>
        <View style={styles.card}>
          {resume.basics.links.map(link => (
            <View key={link.id} style={styles.linkRow}>
              <View style={styles.linkFields}>
                <Field
                  label="Shown on resume"
                  value={link.label}
                  onChangeText={v => update(r => updateLink(r, link.id, { label: v }))}
                  placeholder="github.com/janedoe"
                  autoCapitalize="none"
                />
                <Field
                  label="Opens"
                  value={link.url}
                  onChangeText={v => update(r => updateLink(r, link.id, { url: v }))}
                  placeholder="https://github.com/janedoe"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
              <Pressable
                onPress={() => update(r => removeLink(r, link.id))}
                hitSlop={8}
                style={styles.removeLink}
              >
                <Text style={styles.removeLinkText}>Remove</Text>
              </Pressable>
            </View>
          ))}
          {resume.basics.links.length === 0 && (
            <Text style={styles.empty}>
              No links yet. A portfolio or profile link is worth adding.
            </Text>
          )}
          <Pressable onPress={() => update(addLink)} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>Add link</Text>
          </Pressable>
        </View>

        <Text style={styles.groupHeading}>Summary</Text>
        <View style={styles.card}>
          <Field
            label="Summary"
            value={resume.summary}
            onChangeText={v => update(r => setSummary(r, v))}
            multiline
            placeholder="Two or three lines on what you do and what you're good at."
            hint="Keep it under 60 words — it competes with your experience for space"
          />
        </View>

        <Text style={styles.groupHeading}>Sections</Text>
        <View style={styles.card}>
          {sections.map((section, i) => (
            <View key={section.id} style={styles.sectionRow}>
              <Pressable
                style={styles.sectionMain}
                onPress={() => onOpenSection(section.id)}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    !section.visible && styles.sectionTitleHidden,
                  ]}
                >
                  {section.title}
                </Text>
                <Text style={styles.sectionMeta}>
                  {section.items.length === 0
                    ? 'Empty'
                    : `${section.items.length} ${section.items.length === 1 ? 'entry' : 'entries'}`}
                  {section.visible ? '' : ' · hidden'}
                </Text>
              </Pressable>

              <View style={styles.sectionActions}>
                <Pressable
                  onPress={() => update(r => moveSection(r, section.id, -1))}
                  disabled={i === 0}
                  hitSlop={6}
                  style={[styles.iconBtn, i === 0 && styles.iconBtnOff]}
                >
                  <Text style={styles.icon}>↑</Text>
                </Pressable>
                <Pressable
                  onPress={() => update(r => moveSection(r, section.id, 1))}
                  disabled={i === sections.length - 1}
                  hitSlop={6}
                  style={[
                    styles.iconBtn,
                    i === sections.length - 1 && styles.iconBtnOff,
                  ]}
                >
                  <Text style={styles.icon}>↓</Text>
                </Pressable>
                <Pressable
                  onPress={() => update(r => toggleSectionVisible(r, section.id))}
                  hitSlop={6}
                  style={styles.iconBtn}
                >
                  <Text style={styles.icon}>{section.visible ? '◉' : '○'}</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    confirmRemove(section.id, section.title, section.items.length)
                  }
                  hitSlop={6}
                  style={styles.iconBtn}
                >
                  <Text style={[styles.icon, styles.iconDanger]}>✕</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {showAdd ? (
            <View style={styles.addGrid}>
              {ADDABLE.map(t => (
                <Pressable
                  key={t}
                  style={styles.addChip}
                  onPress={() => {
                    update(r => addSection(r, t));
                    setShowAdd(false);
                  }}
                >
                  <Text style={styles.addChipText}>
                    {DEFAULT_SECTION_TITLES[t]}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable onPress={() => setShowAdd(true)} style={styles.ghostBtn}>
              <Text style={styles.ghostBtnText}>Add section</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.groupHeading}>Declaration</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Include a declaration"
            value={resume.declaration.enabled}
            onChange={v => update(r => setDeclaration(r, { enabled: v }))}
            hint="Standard on resumes in India and much of South Asia. Usually left off for US and European applications."
          />

          {resume.declaration.enabled && (
            <>
              <Field
                label="Declaration"
                value={resume.declaration.text}
                onChangeText={v => update(r => setDeclaration(r, { text: v }))}
                multiline
                placeholder={DEFAULT_DECLARATION_TEXT}
              />
              {resume.declaration.text.trim() !== DEFAULT_DECLARATION_TEXT && (
                <Pressable
                  onPress={() =>
                    update(r => setDeclaration(r, { text: DEFAULT_DECLARATION_TEXT }))
                  }
                  style={styles.ghostBtn}
                >
                  <Text style={styles.ghostBtnText}>Use the standard wording</Text>
                </Pressable>
              )}

              <Field
                label="Place"
                value={resume.declaration.place}
                onChangeText={v => update(r => setDeclaration(r, { place: v }))}
                placeholder="City"
                hint="Where you are signing. Leave empty to hide the line."
              />
              <Field
                label="Date"
                value={resume.declaration.date}
                onChangeText={v => update(r => setDeclaration(r, { date: v }))}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                hint="Printed as 15 Jan 2026. Leave empty to hide the line."
              />
              {resume.declaration.date !== todayIso() && (
                <Pressable
                  onPress={() => update(r => setDeclaration(r, { date: todayIso() }))}
                  style={styles.ghostBtn}
                >
                  <Text style={styles.ghostBtnText}>Use today's date</Text>
                </Pressable>
              )}

              <Field
                label="Name under the signature"
                value={resume.declaration.signatureName}
                onChangeText={v =>
                  update(r => setDeclaration(r, { signatureName: v }))
                }
                placeholder={resume.basics.fullName || 'Your full name'}
                hint="Leave empty to use the name at the top of your resume"
              />
              <ToggleRow
                label="Draw a signature line"
                value={resume.declaration.showSignatureLine}
                onChange={v =>
                  update(r => setDeclaration(r, { showSignatureLine: v }))
                }
                hint="A ruled line to sign across once the resume is printed"
              />
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.bar}>
        <Pressable style={styles.primary} onPress={onPreview}>
          <Text style={styles.primaryText}>Preview resume</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.bg },
  scroll: { padding: theme.space(4), paddingBottom: theme.space(10) },

  progressCard: {
    backgroundColor: theme.color.accentSoft,
    borderRadius: theme.radius.md,
    padding: theme.space(4),
    marginBottom: theme.space(5),
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  progressPct: { fontSize: 15, fontWeight: '600', color: theme.color.accent },
  saveState: { ...theme.font.hint, color: theme.color.textMuted },
  track: {
    height: 4,
    backgroundColor: '#D3DEEC',
    borderRadius: 2,
    marginTop: theme.space(2.5),
    overflow: 'hidden',
  },
  fill: { height: 4, backgroundColor: theme.color.accent, borderRadius: 2 },
  nextStep: {
    fontSize: 13,
    color: theme.color.accent,
    marginTop: theme.space(2.5),
  },

  groupHeading: {
    ...theme.font.section,
    color: theme.color.textMuted,
    marginBottom: theme.space(2),
    marginLeft: theme.space(1),
  },
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: theme.space(4),
    paddingBottom: theme.space(2),
    marginBottom: theme.space(5),
  },
  empty: {
    ...theme.font.hint,
    color: theme.color.textFaint,
    marginBottom: theme.space(3),
  },

  linkRow: { flexDirection: 'row', gap: theme.space(3) },
  linkFields: { flex: 1 },
  removeLink: { paddingTop: theme.space(7) },
  removeLinkText: { fontSize: 13, color: theme.color.danger },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.space(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
  },
  sectionMain: { flex: 1 },
  sectionTitle: { fontSize: 15, color: theme.color.text, fontWeight: '500' },
  sectionTitleHidden: { color: theme.color.textFaint },
  sectionMeta: { ...theme.font.hint, color: theme.color.textFaint, marginTop: 2 },
  sectionActions: { flexDirection: 'row', gap: theme.space(0.5) },
  iconBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
  },
  iconBtnOff: { opacity: 0.25 },
  icon: { fontSize: 15, color: theme.color.textMuted },
  iconDanger: { color: theme.color.danger },

  addGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space(2),
    paddingVertical: theme.space(3),
  },
  addChip: {
    paddingHorizontal: theme.space(3.5),
    paddingVertical: theme.space(2.5),
    borderRadius: theme.radius.sm,
    backgroundColor: theme.color.bg,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  addChipText: { fontSize: 14, color: theme.color.text },

  ghostBtn: { paddingVertical: theme.space(3), alignItems: 'center' },
  ghostBtnText: { fontSize: 14, fontWeight: '600', color: theme.color.accent },

  bar: {
    padding: theme.space(3),
    backgroundColor: theme.color.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.borderStrong,
  },
  primary: {
    paddingVertical: theme.space(3.5),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    backgroundColor: theme.color.accent,
  },
  primaryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
