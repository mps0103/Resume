import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ResumeSummary } from '../types/resume';
import { AdBanner } from '../components/AdBanner';
import { ActionSheet } from '../components/ActionSheet';
import { PromptDialog } from '../components/PromptDialog';
import { theme } from '../ui/theme';
import { appAlert } from '../components/AppDialog';

interface Props {
  resumes: ResumeSummary[];
  entitlement: 'free' | 'pro';
  onCreate: () => void;
  /** Fills a new resume with the sample content, for trying designs out. */
  onCreateSample: () => void;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onOpenPaywall: () => void;
  onOpenSettings: () => void;
}

function relative(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function HomeScreen({
  resumes,
  entitlement,
  onCreate,
  onCreateSample,
  onOpen,
  onDuplicate,
  onRename,
  onDelete,
  onOpenPaywall,
  onOpenSettings,
}: Props) {
  const [menuFor, setMenuFor] = useState<ResumeSummary | null>(null);
  const [renameFor, setRenameFor] = useState<ResumeSummary | null>(null);
  function confirmDelete(item: ResumeSummary) {
    appAlert(
      `Delete ${item.title}?`,
      'This resume is stored only on this device, so it cannot be recovered.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Your resumes</Text>
        <View style={styles.headerActions}>
          {entitlement === 'free' && (
            <Pressable onPress={onOpenPaywall} hitSlop={8}>
              <Text style={styles.proLink}>Go Pro</Text>
            </Pressable>
          )}
          <Pressable onPress={onOpenSettings} hitSlop={8}>
            <Text style={styles.settingsLink}>Settings</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={resumes}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Start your first resume</Text>
            <Text style={styles.emptyBody}>
              Fill in your details once. Switch designs any time without
              retyping anything.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => onOpen(item.id)}
            onLongPress={() => setMenuFor(item)}
          >
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>
                {item.fullName ? `${item.fullName} · ` : ''}
                edited {relative(item.updatedAt)}
              </Text>
            </View>
            <Pressable onPress={() => setMenuFor(item)} hitSlop={10} style={styles.more}>
              <Text style={styles.moreText}>⋯</Text>
            </Pressable>
          </Pressable>
        )}
      />

      <AdBanner entitlement={entitlement} />

      <View style={styles.bar}>
        <Pressable style={styles.primary} onPress={onCreate}>
          <Text style={styles.primaryText}>Create resume</Text>
        </Pressable>
        {/*
          A filled resume is the only way to judge a design — an empty one
          renders every template as the same blank page. This is also the
          fastest way to check a build on a device without typing a resume in
          by hand.
        */}
        <Pressable style={styles.secondary} onPress={onCreateSample}>
          <Text style={styles.secondaryText}>Load a sample resume</Text>
        </Pressable>
      </View>

      <ActionSheet
        visible={menuFor !== null}
        title={menuFor?.title}
        onClose={() => setMenuFor(null)}
        actions={
          menuFor
            ? [
                { label: 'Open', onPress: () => onOpen(menuFor.id) },
                { label: 'Rename', onPress: () => setRenameFor(menuFor) },
                {
                  label: 'Duplicate',
                  hint: 'Handy for tailoring one resume to a specific job',
                  onPress: () => onDuplicate(menuFor.id),
                },
                {
                  label: 'Delete',
                  destructive: true,
                  onPress: () => confirmDelete(menuFor),
                },
              ]
            : []
        }
      />

      <PromptDialog
        visible={renameFor !== null}
        title="Rename resume"
        message="This is the name in your list. It does not appear on the resume itself."
        initialValue={renameFor?.title ?? ''}
        placeholder="Resume name"
        onCancel={() => setRenameFor(null)}
        onSubmit={title => {
          if (renameFor) onRename(renameFor.id, title);
          setRenameFor(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space(4),
    paddingTop: theme.space(4),
    paddingBottom: theme.space(2),
  },
  title: { fontSize: 24, fontWeight: '600', color: theme.color.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: theme.space(4) },
  proLink: { fontSize: 14, fontWeight: '600', color: theme.color.accent },
  settingsLink: { fontSize: 14, color: theme.color.textMuted },
  list: { padding: theme.space(4), paddingTop: theme.space(2), flexGrow: 1 },

  empty: { paddingTop: theme.space(20), paddingHorizontal: theme.space(6) },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.color.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.color.textMuted,
    textAlign: 'center',
    marginTop: theme.space(2),
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: theme.space(4),
    marginBottom: theme.space(2.5),
  },
  rowMain: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '500', color: theme.color.text },
  rowMeta: { ...theme.font.hint, color: theme.color.textFaint, marginTop: 3 },
  more: { paddingHorizontal: theme.space(2) },
  moreText: { fontSize: 20, color: theme.color.textMuted },

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
  secondary: {
    paddingVertical: theme.space(2.5),
    marginTop: theme.space(2),
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  secondaryText: { fontSize: 14, fontWeight: '500', color: theme.color.accent },
});
