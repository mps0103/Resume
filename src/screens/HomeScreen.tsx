import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResumeSummary } from '../types/resume';
import { ActionSheet } from '../components/ActionSheet';
import { PromptDialog } from '../components/PromptDialog';
import { appAlert } from '../components/AppDialog';
import { Theme } from '../ui/theme';
import { useTheme } from '../ui/ThemeProvider';
import { Gradient } from '../ui/Gradient';
import { Touchable } from '../ui/Touchable';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { PaperThumb } from '../ui/PaperThumb';
import { getTemplate } from '../templates/registry';

interface Props {
  resumes: ResumeSummary[];
  entitlement: 'free' | 'pro';
  onCreate: () => void;
  /** Reads an existing PDF or Word resume and fills the editor from it. */
  onImport: () => void;
  /** True while the file picker and the parse are running. */
  importing: boolean;
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

/**
 * Rows arrive rather than appear.
 *
 * The stagger is small on purpose — 40ms a row, and it stops counting after
 * the sixth. A long cascade looks slow the second time you see it, and this
 * is the screen the app opens on.
 */
function Appear({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 320,
      delay: Math.min(index, 6) * 40,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [t, index]);

  return (
    <Animated.View
      style={{
        opacity: t,
        transform: [
          {
            translateY: t.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function HomeScreen({
  resumes,
  entitlement,
  onCreate,
  onImport,
  importing,
  onCreateSample,
  onOpen,
  onDuplicate,
  onRename,
  onDelete,
  onOpenPaywall,
  onOpenSettings,
}: Props) {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();

  const [menuFor, setMenuFor] = useState<ResumeSummary | null>(null);
  const [renameFor, setRenameFor] = useState<ResumeSummary | null>(null);

  function confirmDelete(item: ResumeSummary) {
    appAlert(
      `Delete ${item.title}?`,
      'This resume is stored only on this device, so it cannot be recovered.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(item.id),
        },
      ],
    );
  }

  const header = (
    <View>
      {/*
        The gradient is pulled up by the top inset and pads itself back down
        by the same amount, so it reaches the physical top of the screen
        while its content still clears the status bar. That keeps the shell's
        SafeAreaView untouched, which every other screen depends on.
      */}
      <Gradient
        from={t.color.heroFrom}
        to={t.color.heroTo}
        style={[
          s.hero,
          { marginTop: -insets.top, paddingTop: insets.top + t.space(4) },
        ]}
      >
        <View style={s.heroTop}>
          <View style={s.heroTitles}>
            <Text style={s.overline}>RESUME BUILDER</Text>
            <Text style={s.heroTitle}>Your resumes</Text>
          </View>

          <View style={s.heroActions}>
            {entitlement === 'pro' ? (
              <View style={s.proBadge}>
                <Icon name="crown" size={13} color={t.color.gold} />
                <Text style={s.proBadgeText}>PRO</Text>
              </View>
            ) : (
              <Touchable onPress={onOpenPaywall} scaleTo={0.94} style={s.goPro}>
                <Icon name="crown" size={14} color={t.color.heroTo} />
                <Text style={s.goProText}>Go Pro</Text>
              </Touchable>
            )}
            <IconButton
              name="sliders"
              tone="onDark"
              label="Settings"
              onPress={onOpenSettings}
            />
          </View>
        </View>

        {/*
          Importing leads, deliberately.

          Anyone opening this app almost certainly has a resume already —
          that is why they want a better one. Starting from their own text
          is both the fastest route to something finished and the least
          daunting, where "Create resume" means facing twenty empty fields.
        */}
        <Touchable
          onPress={importing ? undefined : onImport}
          disabled={importing}
          scaleTo={0.985}
          style={[s.upload, importing && s.uploadBusy]}
        >
          <View style={s.uploadIcon}>
            <Icon
              name={importing ? 'doc' : 'upload'}
              size={22}
              color={t.color.accent}
            />
          </View>
          <View style={s.uploadText}>
            <Text style={s.uploadTitle}>
              {importing ? 'Reading your resume…' : 'Upload existing resume'}
            </Text>
            <Text style={s.uploadHint}>
              {importing
                ? 'Pulling out your details'
                : 'PDF or Word — we fill it in for you'}
            </Text>
          </View>
          {!importing && (
            <Icon name="chevronRight" size={18} color={t.color.textFaint} />
          )}
        </Touchable>
      </Gradient>

      {/* The two lesser starts, as a pair so neither competes with Upload. */}
      <View style={s.tiles}>
        <Touchable onPress={onCreate} style={s.tile}>
          <View style={[s.tileIcon, { backgroundColor: t.color.accentSoft }]}>
            <Icon name="plus" size={19} color={t.color.onAccentSoft} />
          </View>
          <Text style={s.tileTitle}>Start blank</Text>
          <Text style={s.tileHint}>Build it from scratch</Text>
        </Touchable>

        {/*
          A filled resume is the only way to judge a design — an empty one
          renders every template as the same blank page. This is also the
          fastest way to check a build on a device without typing a resume in
          by hand.
        */}
        <Touchable onPress={onCreateSample} style={s.tile}>
          <View style={[s.tileIcon, { backgroundColor: t.color.goldSoft }]}>
            <Icon name="sparkle" size={19} color={t.color.gold} />
          </View>
          <Text style={s.tileTitle}>Try a sample</Text>
          <Text style={s.tileHint}>See the designs filled</Text>
        </Touchable>
      </View>

      {resumes.length > 0 && (
        <View style={s.listHead}>
          <Text style={s.listHeadText}>SAVED</Text>
          <Text style={s.listCount}>
            {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={s.root}>
      {/* White status bar text, because the hero behind it is dark. */}
      <StatusBar barStyle="light-content" />

      <FlatList
        data={resumes}
        keyExtractor={r => r.id}
        ListHeaderComponent={header}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            {/*
              Three stacked pages, fanned. An empty state with nothing in it
              but centred text is the flattest thing in any app.
            */}
            <View style={s.emptyArt}>
              <View style={[s.emptyPage, s.emptyPageBack]} />
              <View style={[s.emptyPage, s.emptyPageMid]} />
              <View style={s.emptyPageFront}>
                <PaperThumb
                  templateId="classic"
                  fullName="Jane Doe"
                  width={62}
                />
              </View>
            </View>
            <Text style={s.emptyTitle}>Nothing saved yet</Text>
            <Text style={s.emptyBody}>
              Fill in your details once. Switch designs any time without
              retyping anything.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Appear index={index}>
            <Touchable
              style={s.row}
              onPress={() => onOpen(item.id)}
              onLongPress={() => setMenuFor(item)}
            >
              <PaperThumb
                templateId={item.templateId}
                fullName={item.fullName}
                width={46}
              />
              <View style={s.rowMain}>
                <Text style={s.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {!!item.fullName && (
                  <Text style={s.rowName} numberOfLines={1}>
                    {item.fullName}
                  </Text>
                )}
                <View style={s.rowFoot}>
                  <Text style={s.rowTemplate} numberOfLines={1}>
                    {getTemplate(item.templateId).name}
                  </Text>
                  <View style={s.dot} />
                  <Text style={s.rowMeta}>{relative(item.updatedAt)}</Text>
                </View>
              </View>
              <IconButton
                name="dots"
                label={`More options for ${item.title}`}
                onPress={() => setMenuFor(item)}
              />
            </Touchable>
          </Appear>
        )}
      />

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

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.color.bg },
    list: { paddingBottom: t.space(8) },

    hero: {
      paddingHorizontal: t.space(4),
      // Deep enough that the upload card sits well clear of the title, and
      // the corner radius has room to read.
      paddingBottom: t.space(5),
      borderBottomLeftRadius: t.radius.xl,
      borderBottomRightRadius: t.radius.xl,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: t.space(5),
    },
    heroTitles: { flex: 1 },
    overline: {
      ...t.font.section,
      color: t.color.onHeroMuted,
      marginBottom: t.space(1.5),
    },
    heroTitle: { ...t.font.display, color: t.color.onHero },
    heroActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.space(2),
    },

    goPro: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.space(1.5),
      paddingHorizontal: t.space(3),
      paddingVertical: t.space(2),
      borderRadius: t.radius.pill,
      backgroundColor: '#fff',
    },
    goProText: { fontSize: 13, fontWeight: '700', color: t.color.heroTo },
    proBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.space(1.5),
      paddingHorizontal: t.space(3),
      paddingVertical: t.space(2),
      borderRadius: t.radius.pill,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    proBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: t.color.gold,
    },

    upload: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.space(3),
      backgroundColor: t.color.surface,
      borderRadius: t.radius.lg,
      padding: t.space(3.5),
      ...t.shadow.lg,
    },
    uploadBusy: { opacity: 0.75 },
    uploadIcon: {
      width: 44,
      height: 44,
      borderRadius: t.radius.md,
      backgroundColor: t.color.accentTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadText: { flex: 1 },
    uploadTitle: { ...t.font.bodyStrong, color: t.color.text },
    uploadHint: { ...t.font.hint, color: t.color.textMuted, marginTop: 2 },

    tiles: {
      flexDirection: 'row',
      gap: t.space(3),
      paddingHorizontal: t.space(4),
      marginTop: t.space(4),
    },
    tile: {
      flex: 1,
      backgroundColor: t.color.surface,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.color.border,
      padding: t.space(3.5),
      ...t.shadow.sm,
    },
    tileIcon: {
      width: 38,
      height: 38,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: t.space(2.5),
    },
    tileTitle: { fontSize: 14, fontWeight: '700', color: t.color.text },
    tileHint: { ...t.font.hint, color: t.color.textFaint, marginTop: 2 },

    listHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: t.space(5),
      marginTop: t.space(6),
      marginBottom: t.space(2),
    },
    listHeadText: { ...t.font.section, color: t.color.textFaint },
    listCount: { ...t.font.hint, color: t.color.textFaint },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.space(3.5),
      backgroundColor: t.color.surface,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.color.border,
      padding: t.space(3),
      marginHorizontal: t.space(4),
      marginBottom: t.space(2.5),
      ...t.shadow.sm,
    },
    rowMain: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '700', color: t.color.text },
    rowName: { fontSize: 13, color: t.color.textMuted, marginTop: 1 },
    rowFoot: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.space(1.5),
      marginTop: t.space(1.5),
    },
    rowTemplate: {
      fontSize: 11,
      fontWeight: '600',
      color: t.color.accent,
      flexShrink: 1,
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: t.color.textFaint,
    },
    rowMeta: { fontSize: 11, color: t.color.textFaint },

    empty: {
      alignItems: 'center',
      paddingTop: t.space(12),
      paddingHorizontal: t.space(8),
    },
    emptyArt: {
      width: 110,
      height: 100,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: t.space(5),
    },
    emptyPage: {
      position: 'absolute',
      width: 56,
      height: 79,
      borderRadius: 4,
      backgroundColor: t.color.surface,
      borderWidth: 1,
      borderColor: t.color.border,
    },
    emptyPageBack: { transform: [{ rotate: '-13deg' }, { translateX: -16 }] },
    emptyPageMid: { transform: [{ rotate: '8deg' }, { translateX: 14 }] },
    emptyPageFront: { ...t.shadow.md },
    emptyTitle: { ...t.font.h2, color: t.color.text, textAlign: 'center' },
    emptyBody: {
      fontSize: 14,
      lineHeight: 21,
      color: t.color.textMuted,
      textAlign: 'center',
      marginTop: t.space(2),
    },
  });
}
