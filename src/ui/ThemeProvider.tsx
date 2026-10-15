import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { createMMKV } from 'react-native-mmkv';
import { buildTheme, Theme } from './theme';
import { DEFAULT_PALETTE_ID, getPalette, PALETTES, Palette } from './palettes';

const store = createMMKV({ id: 'appearance' });
const KEY = 'paletteId';

/**
 * Reads the saved theme.
 *
 * Falls back to the default for an unknown id rather than throwing, because
 * one way to get an unknown id is to remove a palette in an update — and a
 * user who picked it should land on the default, not a crash loop on launch.
 */
export function savedPaletteId(): string {
  const id = store.getString(KEY);
  return id && PALETTES.some(p => p.id === id) ? id : DEFAULT_PALETTE_ID;
}

interface Appearance {
  theme: Theme;
  palette: Palette;
  palettes: Palette[];
  setPalette: (id: string) => void;
}

/**
 * Seeded with the saved theme rather than the default.
 *
 * The context has a real default value so a component rendered outside the
 * provider still styles itself — which matters for the error boundary, the
 * one thing that has to render when the tree above it has failed.
 */
const AppearanceContext = createContext<Appearance>({
  theme: buildTheme(getPalette(DEFAULT_PALETTE_ID)),
  palette: getPalette(DEFAULT_PALETTE_ID),
  palettes: PALETTES,
  setPalette: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [paletteId, setId] = useState(savedPaletteId);

  const setPalette = useCallback((id: string) => {
    // Written before the state change so the choice survives a crash
    // between the two — the picker is one of the few settings where the
    // user sees the result instantly and would not think to re-apply it.
    store.set(KEY, id);
    setId(id);
  }, []);

  const value = useMemo<Appearance>(() => {
    const palette = getPalette(paletteId);
    return {
      theme: buildTheme(palette),
      palette,
      palettes: PALETTES,
      setPalette,
    };
  }, [paletteId, setPalette]);

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

/** The whole appearance context: theme, current palette, and the setter. */
export function useAppearance(): Appearance {
  return useContext(AppearanceContext);
}

/**
 * Just the theme, which is all most screens want.
 *
 * Styles have to be built from this inside the component — a
 * `StyleSheet.create` at module scope captures its colours at import and
 * will not follow a theme change. The pattern throughout is
 * `const s = useMemo(() => makeStyles(t), [t])`, with `makeStyles` taking
 * the theme and returning the stylesheet.
 */
export function useTheme(): Theme {
  return useContext(AppearanceContext).theme;
}
