import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Resume, ResumeStyle } from '../types/resume';
import { setStyle } from '../data/mutations';
import { getTemplate, renderResume } from '../templates/registry';
import { PAGE_DIMENSIONS } from '../templates/base';
import { Theme } from '../ui/theme';
import { useTheme } from '../ui/ThemeProvider';

interface Props {
  resume: Resume;
  update: (fn: (r: Resume) => Resume) => void;
}

/**
 * Every control here changes the live preview above it. Resume styling is
 * the kind of thing people fiddle with for twenty minutes, so the feedback
 * has to be immediate — a separate "apply" step would make it feel like
 * guesswork.
 */

/** Extra accents beyond the ones each template was designed against. */
const EXTRA_ACCENTS = [
  '#1F3A5F', '#2F5D50', '#6B3F2A', '#463157',
  '#1A1A1A', '#3B4A57', '#7A2E39', '#245B4F',
];

const FONT_STEPS: { label: string; value: number }[] = [
  { label: 'Small', value: 0.92 },
  { label: 'Default', value: 1 },
  { label: 'Large', value: 1.08 },
];

const DENSITY_STEPS: { label: string; value: number }[] = [
  { label: 'Tight', value: 0.86 },
  { label: 'Default', value: 1 },
  { label: 'Airy', value: 1.14 },
];

export function StyleScreen({ resume, update }: Props) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const template = getTemplate(resume.templateId);
  const html = renderResume(resume, { mode: 'preview' });

  const pageW = PAGE_DIMENSIONS[resume.style.pageSize].width;
  const previewW = 300;
  const scale = previewW / pageW;

  // Template accents first, then the shared palette, without duplicates.
  const accents = Array.from(new Set([...template.accents, ...EXTRA_ACCENTS]));

  function set(patch: Partial<ResumeStyle>) {
    update(r => setStyle(r, patch));
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.previewWrap}>
        <View style={[styles.sheet, { width: previewW, height: previewW * 1.414 }]}>
          <View
            style={[
              styles.sheetInner,
              {
                width: pageW,
                height: pageW * 1.414,
                transform: [{ scale }],
              },
            ]}
            pointerEvents="none"
          >
            <WebView
              source={{ html }}
              originWhitelist={['*']}
              scrollEnabled={false}
              javaScriptEnabled={false}
              style={styles.web}
            />
          </View>
        </View>
        <Text style={styles.previewCaption}>{template.name}</Text>
      </View>

      <Text style={styles.group}>Accent</Text>
      <View style={styles.swatches}>
        {accents.map(c => (
          <Pressable
            key={c}
            onPress={() => set({ accent: c })}
            style={[
              styles.swatch,
              { backgroundColor: c },
              resume.style.accent === c && styles.swatchOn,
            ]}
          />
        ))}
      </View>
      <Text style={styles.note}>
        The first few are the colours this design was drawn against.
      </Text>

      <Text style={styles.group}>Text size</Text>
      <Segmented
        options={FONT_STEPS}
        value={resume.style.fontScale}
        onChange={v => set({ fontScale: v })}
      />

      <Text style={styles.group}>Spacing</Text>
      <Segmented
        options={DENSITY_STEPS}
        value={resume.style.density}
        onChange={v => set({ density: v })}
      />
      <Text style={styles.note}>
        Tight fits more on a page. Below the smallest setting a resume stops
        being skimmable, so that is as far as it goes.
      </Text>

      <Text style={styles.group}>Page size</Text>
      <Segmented
        options={[
          { label: 'A4', value: 'A4' as const },
          { label: 'US Letter', value: 'Letter' as const },
        ]}
        value={resume.style.pageSize}
        onChange={v => set({ pageSize: v })}
      />
      <Text style={styles.note}>
        A4 nearly everywhere; US Letter for the United States and Canada.
      </Text>
    </ScrollView>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.segment}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, on && styles.segmentItemOn]}
          >
            <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    scroll: { padding: t.space(4), paddingBottom: t.space(10) },
  
    previewWrap: { alignItems: 'center', marginBottom: t.space(6) },
    sheet: {
      overflow: 'hidden',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: t.color.border,
      borderRadius: t.radius.sm,
    },
    /**
     * Without this the box scales about its centre, which pushes a 794-wide
     * page down and to the right out of a 300-wide frame and leaves only the
     * bottom corner of the resume showing.
     */
    sheetInner: { transformOrigin: 'top left' },
    web: { flex: 1, backgroundColor: '#fff' },
    previewCaption: {
      ...t.font.hint,
      color: t.color.textFaint,
      marginTop: t.space(2),
    },
  
    group: {
      ...t.font.section,
      color: t.color.textMuted,
      marginBottom: t.space(2),
    },
    note: {
      ...t.font.hint,
      color: t.color.textFaint,
      marginTop: t.space(2),
      marginBottom: t.space(5),
      lineHeight: 17,
    },
  
    swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space(2.5) },
    swatch: {
      width: 38,
      height: 38,
      borderRadius: t.radius.sm,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    swatchOn: { borderColor: t.color.text },
  
    segment: {
      flexDirection: 'row',
      backgroundColor: t.color.surface,
      borderWidth: 1,
      borderColor: t.color.border,
      borderRadius: t.radius.md,
      overflow: 'hidden',
    },
    segmentItem: { flex: 1, paddingVertical: t.space(3), alignItems: 'center' },
    segmentItemOn: { backgroundColor: t.color.accent },
    segmentText: { fontSize: 14, color: t.color.textMuted },
    segmentTextOn: { color: t.color.onAccent, fontWeight: '600' },
  });
}
