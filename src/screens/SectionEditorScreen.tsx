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
import { Field } from '../components/Field';
import { ItemForm } from '../components/ItemForm';
import { Resume } from '../types/resume';
import {
  addItem,
  blankItem,
  getSection,
  itemLabel,
  itemSubLabel,
  moveItem,
  removeItem,
  renameSection,
  updateItem,
} from '../data/mutations';
import { Theme } from '../ui/theme';
import { useTheme } from '../ui/ThemeProvider';
import { appAlert } from '../components/AppDialog';

interface Props {
  resume: Resume;
  sectionId: string;
  update: (fn: (r: Resume) => Resume) => void;
  onBack: () => void;
}

/**
 * Items are edited in place, one open at a time. Pushing a separate screen
 * per entry adds a back-navigation step people lose their place in; an
 * accordion keeps the list visible while a single entry is open.
 */
export function SectionEditorScreen({ resume, sectionId, update, onBack }: Props) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const section = getSection(resume, sectionId);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!section) {
    return (
      <View style={styles.gone}>
        <Text style={styles.goneText}>This section was removed.</Text>
        <Pressable onPress={onBack} style={styles.ghostBtn}>
          <Text style={styles.ghostBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const items = section.items as any[];

  function handleAdd() {
    const item = blankItem(section!.type);
    update(r => addItem(r, sectionId, item));
    setOpenId(item.id);
  }

  function handleRemove(itemId: string, label: string) {
    appAlert(`Remove ${label}?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          update(r => removeItem(r, sectionId, itemId));
          if (openId === itemId) setOpenId(null);
        },
      },
    ]);
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
        <View style={styles.card}>
          <Field
            label="Section heading"
            value={section.title}
            onChangeText={v => update(r => renameSection(r, sectionId, v))}
            hint="This is what appears on the resume"
          />
        </View>

        {items.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>
              Add your first entry and it appears on the resume straight away.
            </Text>
          </View>
        )}

        {items.map((item, i) => {
          const open = openId === item.id;
          const label = itemLabel(section.type, item);
          const sub = itemSubLabel(section.type, item);

          return (
            <View key={item.id} style={[styles.card, open && styles.cardOpen]}>
              <View style={styles.head}>
                <Pressable
                  style={styles.headMain}
                  onPress={() => setOpenId(open ? null : item.id)}
                >
                  <Text style={styles.headTitle}>{label}</Text>
                  {!!sub && (
                    <Text style={styles.headSub} numberOfLines={1}>
                      {sub}
                    </Text>
                  )}
                </Pressable>

                <View style={styles.headActions}>
                  <Pressable
                    onPress={() => update(r => moveItem(r, sectionId, item.id, -1))}
                    disabled={i === 0}
                    hitSlop={6}
                    style={[styles.iconBtn, i === 0 && styles.iconBtnOff]}
                  >
                    <Text style={styles.icon}>↑</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => update(r => moveItem(r, sectionId, item.id, 1))}
                    disabled={i === items.length - 1}
                    hitSlop={6}
                    style={[
                      styles.iconBtn,
                      i === items.length - 1 && styles.iconBtnOff,
                    ]}
                  >
                    <Text style={styles.icon}>↓</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemove(item.id, label)}
                    hitSlop={6}
                    style={styles.iconBtn}
                  >
                    <Text style={[styles.icon, styles.iconDanger]}>✕</Text>
                  </Pressable>
                </View>
              </View>

              {open && (
                <View style={styles.form}>
                  <ItemForm
                    type={section.type}
                    item={item}
                    onPatch={patch =>
                      update(r => updateItem(r, sectionId, item.id, patch))
                    }
                  />
                  <Pressable onPress={() => setOpenId(null)} style={styles.doneBtn}>
                    <Text style={styles.doneText}>Done</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

        <Pressable onPress={handleAdd} style={styles.addBtn}>
          <Text style={styles.addText}>Add entry</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.color.bg },
    scroll: { padding: t.space(4), paddingBottom: t.space(12) },
    gone: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    goneText: { fontSize: 15, color: t.color.textMuted },
  
    card: {
      backgroundColor: t.color.surface,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.color.border,
      marginBottom: t.space(3),
      paddingHorizontal: t.space(4),
      paddingTop: t.space(4),
      paddingBottom: t.space(1),
    },
    cardOpen: { borderColor: t.color.accent },
  
    emptyCard: {
      backgroundColor: t.color.surface,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: t.color.borderStrong,
      padding: t.space(6),
      alignItems: 'center',
      marginBottom: t.space(3),
    },
    emptyTitle: { fontSize: 15, fontWeight: '600', color: t.color.text },
    emptyBody: {
      ...t.font.hint,
      color: t.color.textMuted,
      textAlign: 'center',
      marginTop: t.space(1.5),
    },
  
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: t.space(3),
    },
    headMain: { flex: 1, paddingRight: t.space(2) },
    headTitle: { fontSize: 15, fontWeight: '500', color: t.color.text },
    headSub: { ...t.font.hint, color: t.color.textFaint, marginTop: 2 },
    headActions: { flexDirection: 'row', gap: t.space(0.5) },
    iconBtn: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: t.radius.sm,
    },
    iconBtnOff: { opacity: 0.25 },
    icon: { fontSize: 15, color: t.color.textMuted },
    iconDanger: { color: t.color.danger },
  
    form: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.color.border,
      paddingTop: t.space(4),
    },
    doneBtn: {
      paddingVertical: t.space(3),
      alignItems: 'center',
      marginBottom: t.space(2),
    },
    doneText: { fontSize: 14, fontWeight: '600', color: t.color.accent },
  
    addBtn: {
      paddingVertical: t.space(3.5),
      alignItems: 'center',
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.color.accent,
      backgroundColor: t.color.accentSoft,
    },
    addText: { fontSize: 15, fontWeight: '600', color: t.color.accent },
  
    ghostBtn: { paddingVertical: t.space(3) },
    ghostBtnText: { fontSize: 14, fontWeight: '600', color: t.color.accent },
  });
}
