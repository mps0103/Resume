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
import { Theme } from '../ui/theme';
import { useTheme } from '../ui/ThemeProvider';
import { IconButton } from '../ui/IconButton';
import { Icon } from '../ui/Icon';
import { Touchable } from '../ui/Touchable';
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
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

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
        {/*
          The percentage is the one number on this screen the user is
          working towards, so it is set as a figure rather than a label —
          and the save state sits beside it as a dot, because "Saved" in
          plain text next to it read as part of the same sentence.
        */}
        <View style={styles.progressCard}>
          <View style={styles.progressHead}>
            <Text style={styles.progressPct}>
              {Math.round(progress.score * 100)}
              <Text style={styles.progressPctSign}>%</Text>
            </Text>
            <View style={styles.saveState}>
              <View
                style={[
                  styles.saveDot,
                  { backgroundColor: saving ? t.color.warn : t.color.success },
                ]}
              />
              <Text style={styles.saveStateText}>
                {saving ? 'Saving' : 'Saved'}
              </Text>
            </View>
          </View>
          <Text style={styles.progressLabel}>complete</Text>
          <View style={styles.track}>
            <View
              style={[styles.fill, { width: `${Math.max(4, progress.score * 100)}%` }]}
            />
          </View>
          {!!progress.nextStep && (
            <View style={styles.nextStepRow}>
              <Icon name="sparkle" size={14} color={t.color.onAccentSoft} />
              <Text style={styles.nextStep}>{progress.nextStep}</Text>
            </View>
          )}
        </View>

        <Text style={styles.groupHeading}>ABOUT YOU</Text>
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

        <Text style={styles.groupHeading}>LINKS</Text>
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
          <Touchable onPress={() => update(addLink)} style={styles.ghostBtn}>
            <Icon name="plus" size={15} color={t.color.accent} />
            <Text style={styles.ghostBtnText}>Add link</Text>
          </Touchable>
        </View>

        <Text style={styles.groupHeading}>SUMMARY</Text>
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

        <Text style={styles.groupHeading}>SECTIONS</Text>
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

              {/*
                Four controls per row, so they are deliberately compact —
                32pt with hit slop rather than the 40pt used elsewhere, which
                would not fit beside the section title on a narrow phone.
              */}
              <View style={styles.sectionActions}>
                <IconButton
                  name="arrowUp"
                  size={16}
                  label={`Move ${section.title} up`}
                  onPress={() => update(r => moveSection(r, section.id, -1))}
                  disabled={i === 0}
                  style={styles.iconBtn}
                />
                <IconButton
                  name="arrowDown"
                  size={16}
                  label={`Move ${section.title} down`}
                  onPress={() => update(r => moveSection(r, section.id, 1))}
                  disabled={i === sections.length - 1}
                  style={styles.iconBtn}
                />
                <IconButton
                  name={section.visible ? 'eye' : 'eyeOff'}
                  size={17}
                  color={section.visible ? t.color.accent : t.color.textFaint}
                  label={
                    section.visible
                      ? `Hide ${section.title}`
                      : `Show ${section.title}`
                  }
                  onPress={() => update(r => toggleSectionVisible(r, section.id))}
                  style={styles.iconBtn}
                />
                <IconButton
                  name="trash"
                  size={16}
                  color={t.color.danger}
                  label={`Remove ${section.title}`}
                  onPress={() =>
                    confirmRemove(section.id, section.title, section.items.length)
                  }
                  style={styles.iconBtn}
                />
              </View>
            </View>
          ))}

          {showAdd ? (
            <View style={styles.addGrid}>
              {ADDABLE.map(kind => (
                <Touchable
                  key={kind}
                  style={styles.addChip}
                  scaleTo={0.94}
                  onPress={() => {
                    update(r => addSection(r, kind));
                    setShowAdd(false);
                  }}
                >
                  <Icon name="plus" size={13} color={t.color.accent} />
                  <Text style={styles.addChipText}>
                    {DEFAULT_SECTION_TITLES[kind]}
                  </Text>
                </Touchable>
              ))}
            </View>
          ) : (
            <Touchable onPress={() => setShowAdd(true)} style={styles.ghostBtn}>
              <Icon name="plus" size={15} color={t.color.accent} />
              <Text style={styles.ghostBtnText}>Add section</Text>
            </Touchable>
          )}
        </View>

        <Text style={styles.groupHeading}>DECLARATION</Text>
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
        <Touchable style={styles.primary} onPress={onPreview} scaleTo={0.97}>
          <Icon name="doc" size={18} color={t.color.onAccent} />
          <Text style={styles.primaryText}>Preview resume</Text>
        </Touchable>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.color.bg },
    scroll: { padding: t.space(4), paddingBottom: t.space(10) },
  
    progressCard: {
      backgroundColor: t.color.accentSoft,
      borderRadius: t.radius.lg,
      padding: t.space(4),
      marginBottom: t.space(5),
    },
    progressHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressPct: {
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -1.2,
      color: t.color.onAccentSoft,
    },
    progressPctSign: { fontSize: 20, fontWeight: '700' },
    progressLabel: {
      ...t.font.section,
      color: t.color.onAccentSoft,
      opacity: 0.7,
      marginTop: -2,
    },
    saveState: { flexDirection: 'row', alignItems: 'center', gap: t.space(1.5) },
    saveDot: { width: 7, height: 7, borderRadius: 3.5 },
    saveStateText: {
      ...t.font.hint,
      fontWeight: '600',
      color: t.color.onAccentSoft,
    },
    track: {
      height: 6,
      // A tint of the brand rather than a fixed grey, which was a hardcoded
      // blue and turned muddy under every other theme.
      backgroundColor: t.color.accentTint,
      borderRadius: 3,
      marginTop: t.space(3),
      overflow: 'hidden',
    },
    fill: { height: 6, backgroundColor: t.color.accent, borderRadius: 3 },
    nextStepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.space(2),
      marginTop: t.space(3),
    },
    nextStep: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: t.color.onAccentSoft,
    },
  
    groupHeading: {
      ...t.font.section,
      color: t.color.textFaint,
      marginBottom: t.space(2),
      marginLeft: t.space(1.5),
    },
    card: {
      backgroundColor: t.color.surface,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.color.border,
      padding: t.space(4),
      paddingBottom: t.space(2),
      marginBottom: t.space(5),
      ...t.shadow.sm,
    },
    empty: {
      ...t.font.hint,
      color: t.color.textFaint,
      marginBottom: t.space(3),
    },
  
    linkRow: { flexDirection: 'row', gap: t.space(3) },
    linkFields: { flex: 1 },
    removeLink: { paddingTop: t.space(7) },
    removeLinkText: { fontSize: 13, color: t.color.danger },
  
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: t.space(3),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.color.border,
    },
    sectionMain: { flex: 1 },
    sectionTitle: { fontSize: 15, color: t.color.text, fontWeight: '500' },
    sectionTitleHidden: { color: t.color.textFaint },
    sectionMeta: { ...t.font.hint, color: t.color.textFaint, marginTop: 2 },
    sectionActions: { flexDirection: 'row' },
    iconBtn: { width: 32, height: 32 },
  
    addGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.space(2),
      paddingVertical: t.space(3),
    },
    addChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.space(1.5),
      paddingHorizontal: t.space(3),
      paddingVertical: t.space(2.5),
      borderRadius: t.radius.pill,
      backgroundColor: t.color.accentTint,
      borderWidth: 1,
      borderColor: t.color.accentSoft,
    },
    addChipText: { fontSize: 13, fontWeight: '600', color: t.color.text },
  
    ghostBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.space(2),
      paddingVertical: t.space(3),
    },
    ghostBtnText: { fontSize: 14, fontWeight: '600', color: t.color.accent },
  
    bar: {
      padding: t.space(3),
      backgroundColor: t.color.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.color.borderStrong,
    },
    primary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.space(2),
      paddingVertical: t.space(3.5),
      borderRadius: t.radius.md,
      backgroundColor: t.color.accent,
      ...t.shadow.brand,
    },
    primaryText: { fontSize: 15, fontWeight: '600', color: t.color.onAccent },
  });
}
