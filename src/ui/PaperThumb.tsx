import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getTemplate } from '../templates/registry';
import { theme } from './theme';

interface Props {
  templateId: string;
  /** Initials are drawn on the page when there is a name to draw. */
  fullName?: string;
  /** Width in points. Height follows at A4 proportions. */
  width?: number;
}

/** 'Jane Doe' → 'JD'. Empty for anything with no letters in it. */
export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(part => /\p{L}/u.test(part))
    .slice(0, 2)
    .map(part => part[0]!.toUpperCase())
    .join('');
}

/**
 * A miniature of a resume page, drawn from Views.
 *
 * The resume list used to be two lines of text per row, which gave no sense
 * that the thing in the list was a document — and no sense of which design
 * it was in, so two resumes in different templates looked identical.
 *
 * This is a stylised page rather than a real render. The gallery does use a
 * real WebView per card, but it shows at most eighteen on a screen the user
 * opened deliberately; the resume list scrolls, and a WebView per row would
 * make it stutter for a thumbnail an inch tall. What it does take from the
 * real template is the parts that are legible at this size: the accent
 * colour, and whether the design has a sidebar.
 */
export function PaperThumb({ templateId, fullName = '', width = 54 }: Props) {
  const template = getTemplate(templateId);
  const accent = template.accents[0] ?? theme.color.accent;
  // atsSafe is false precisely for the sidebar and multi-column designs,
  // which is the one layout difference that reads at thumbnail size.
  const sidebar = !template.atsSafe;
  const height = width * (297 / 210);
  const mark = initials(fullName);

  /** A line of pretend text. */
  const line = (w: string | number, i: number, color?: string) => (
    <View
      key={i}
      style={[
        styles.line,
        { width: w, backgroundColor: color ?? theme.color.slate[200] },
      ]}
    />
  );

  return (
    <View style={[styles.page, { width, height }]}>
      {sidebar ? (
        <View style={styles.split}>
          <View style={[styles.rail, { backgroundColor: accent }]}>
            {mark !== '' && <Text style={styles.railMark}>{mark}</Text>}
            {['70%', '55%', '70%'].map((w, i) =>
              line(w, i, 'rgba(255,255,255,0.45)'),
            )}
          </View>
          <View style={styles.body}>
            {line('80%', 0, accent)}
            {['95%', '85%', '92%', '70%', '88%'].map((w, i) => line(w, i + 1))}
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          {/* The name block every single-column design opens with. */}
          <View style={styles.head}>
            {mark !== '' && (
              <Text style={[styles.mark, { color: accent }]}>{mark}</Text>
            )}
            {line('62%', 0, accent)}
          </View>
          <View style={[styles.rule, { backgroundColor: accent }]} />
          {['96%', '88%', '94%'].map((w, i) => line(w, i))}
          {line('45%', 10, theme.color.slate[300])}
          {['92%', '85%', '90%', '76%'].map((w, i) => line(w, i + 20))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    ...theme.shadow.sm,
  },
  split: { flex: 1, flexDirection: 'row' },
  rail: { width: '34%', paddingHorizontal: 3, paddingTop: 5, gap: 2.5 },
  railMark: {
    fontSize: 7,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  body: { flex: 1, paddingHorizontal: 4, paddingTop: 5, gap: 2.5 },

  head: { gap: 2 },
  mark: { fontSize: 8, fontWeight: '800', letterSpacing: -0.3 },
  rule: { height: 1.2, width: '100%', marginVertical: 1.5, opacity: 0.5 },

  // Fixed height rather than a font: these are bars standing in for text,
  // and a tiny real glyph would just render as a smudge.
  line: { height: 1.8, borderRadius: 1 },
});
