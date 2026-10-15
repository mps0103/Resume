import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Resume } from '../types/resume';
import { allTemplates } from '../templates/registry';
import { PAGE_DIMENSIONS } from '../templates/base';
import { theme } from '../ui/theme';

interface Props {
  resume: Resume;
  entitlement: 'free' | 'pro';
  onSelect: (templateId: string) => void;
  onOpenPaywall: () => void;
}

type Filter = 'all' | 'ats' | 'free';

/**
 * Rough page-length signal, used only to decide whether to warn about the
 * single-page designs. Deliberately cheap — rendering eighteen templates to
 * measure them would cost far more than the warning is worth.
 */
function looksLong(resume: Resume): boolean {
  let weight = resume.summary.trim() ? 2 : 0;
  for (const s of resume.sections) {
    if (!s.visible) continue;
    for (const item of s.items as any[]) {
      weight += 2;
      weight += (item.bullets ?? []).filter((b: string) => b.trim()).length;
    }
  }
  return weight > 26;
}

/**
 * Thumbnails render the user's own content, not lorem ipsum, because the
 * decision people are actually making is "does my resume look good in this",
 * and a generic thumbnail cannot answer that.
 *
 * Premium templates are fully browsable and selectable. The lock is at
 * export, not here — hiding the thing you are selling never sells it.
 */
export function TemplateGalleryScreen({
  resume,
  entitlement,
  onSelect,
  onOpenPaywall,
}: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const long = useMemo(() => looksLong(resume), [resume]);

  const templates = useMemo(() => {
    const all = allTemplates();
    if (filter === 'ats') return all.filter(t => t.atsSafe);
    if (filter === 'free') return all.filter(t => t.tier === 'free');
    return all;
  }, [filter]);

  const cols = 2;
  const gutter = theme.space(4);
  const cardW =
    (Dimensions.get('window').width - gutter * (cols + 1)) / cols;
  const pageW = PAGE_DIMENSIONS[resume.style.pageSize].width;
  const pageH = PAGE_DIMENSIONS[resume.style.pageSize].height;
  const scale = cardW / pageW;
  const cardH = pageH * scale;

  const rendered = useMemo(
    () =>
      templates.map(t => ({
        template: t,
        html: t.render(resume, { mode: 'preview' }),
      })),
    [resume, templates],
  );

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lede}>
          Your details stay the same in every design. Switch as often as you
          like.
        </Text>

        <View style={styles.filters}>
          {(
            [
              ['all', `All ${allTemplates().length}`],
              ['ats', 'Parser-safe'],
              ['free', 'Free'],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.filter, filter === key && styles.filterOn]}
            >
              <Text
                style={[styles.filterText, filter === key && styles.filterTextOn]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.grid}>
          {rendered.map(({ template, html }) => {
            const selected = template.id === resume.templateId;
            const locked = template.tier === 'premium' && entitlement === 'free';
            const lengthWarning = template.onePageOnly && long;

            return (
              <View key={template.id} style={{ width: cardW }}>
                <Pressable
                  onPress={() => onSelect(template.id)}
                  style={[
                    styles.thumbFrame,
                    { width: cardW, height: cardH },
                    selected && styles.thumbFrameOn,
                  ]}
                >
                  <View
                    style={[
                      styles.thumbInner,
                      { width: pageW, height: pageH, transform: [{ scale }] },
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

                  {locked && (
                    <View style={styles.lockBadge}>
                      <Text style={styles.lockText}>Pro</Text>
                    </View>
                  )}
                  {selected && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedText}>In use</Text>
                    </View>
                  )}
                </Pressable>

                <Text style={styles.name}>{template.name}</Text>
                <Text style={styles.blurb} numberOfLines={2}>
                  {template.blurb}
                </Text>

                {!template.atsSafe && (
                  <Text style={styles.warn}>
                    Two columns — some application systems read this out of
                    order.
                  </Text>
                )}
                {lengthWarning && (
                  <Text style={styles.warn}>
                    Your resume runs past one page; this design leaves the
                    colour column empty on page two.
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {entitlement === 'free' && (
          <Pressable style={styles.upsell} onPress={onOpenPaywall}>
            <Text style={styles.upsellTitle}>Unlock every design</Text>
            <Text style={styles.upsellBody}>
              Pro removes the watermark and the export limit, and turns off
              ads.
            </Text>
          </Pressable>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.bg },
  scroll: { padding: theme.space(4), paddingBottom: theme.space(8) },
  lede: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.color.textMuted,
    marginBottom: theme.space(3),
  },
  filters: { flexDirection: 'row', gap: theme.space(2), marginBottom: theme.space(4) },
  filter: {
    paddingHorizontal: theme.space(3.5),
    paddingVertical: theme.space(2),
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
  },
  filterOn: { backgroundColor: theme.color.accent, borderColor: theme.color.accent },
  filterText: { fontSize: 13, color: theme.color.textMuted },
  filterTextOn: { color: '#fff', fontWeight: '600' },
  warn: {
    fontSize: 11,
    lineHeight: 15,
    color: '#8A5A1E',
    marginTop: theme.space(1.5),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space(4),
  },
  thumbFrame: {
    overflow: 'hidden',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: '#fff',
  },
  thumbFrameOn: { borderWidth: 2, borderColor: theme.color.accent },
  thumbInner: { transformOrigin: 'top left' },
  web: { flex: 1, backgroundColor: '#fff' },

  lockBadge: {
    position: 'absolute',
    top: theme.space(2),
    right: theme.space(2),
    backgroundColor: theme.color.text,
    paddingHorizontal: theme.space(2),
    paddingVertical: theme.space(1),
    borderRadius: theme.radius.sm,
  },
  lockText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  selectedBadge: {
    position: 'absolute',
    bottom: theme.space(2),
    left: theme.space(2),
    backgroundColor: theme.color.accent,
    paddingHorizontal: theme.space(2),
    paddingVertical: theme.space(1),
    borderRadius: theme.radius.sm,
  },
  selectedText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  name: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.color.text,
    marginTop: theme.space(2),
  },
  blurb: {
    ...theme.font.hint,
    color: theme.color.textFaint,
    marginTop: 2,
    lineHeight: 16,
  },

  upsell: {
    marginTop: theme.space(6),
    padding: theme.space(4),
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.accentSoft,
  },
  upsellTitle: { fontSize: 15, fontWeight: '600', color: theme.color.accent },
  upsellBody: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.color.accent,
    marginTop: theme.space(1),
  },
});
