/**
 * App chrome tokens. Deliberately separate from resume template styling —
 * the app's look must never leak into the document the user exports.
 */
export const theme = {
  color: {
    bg: '#F4F5F7',
    surface: '#FFFFFF',
    border: '#DDE1E6',
    borderStrong: '#C3C9D1',
    text: '#1B1E22',
    textMuted: '#646A73',
    textFaint: '#8E959D',
    accent: '#1F3A5F',
    accentSoft: '#EAF0F7',
    danger: '#B03A2E',
    success: '#2F6F4F',
  },
  space: (n: number) => n * 4,
  radius: { sm: 6, md: 10, lg: 14 },
  font: {
    title: { fontSize: 20, fontWeight: '600' as const },
    section: { fontSize: 13, fontWeight: '600' as const },
    body: { fontSize: 15, fontWeight: '400' as const },
    label: { fontSize: 12, fontWeight: '500' as const },
    hint: { fontSize: 12, fontWeight: '400' as const },
  },
};
