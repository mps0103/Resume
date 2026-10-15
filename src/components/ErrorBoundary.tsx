import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
/*
  The static theme, deliberately, and not `useTheme()`.

  This is the screen that renders when the tree below it has already
  failed, and it is a class component, so reading the theme would mean
  wiring up a context consumer in the one place that has to work when
  everything else did not. It renders in the default palette whatever the
  user picked — self-consistent and legible, just not themed, which is the
  right trade for the crash screen.
*/
import { theme } from '../ui/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches a render crash and offers a way back instead of a blank screen.
 *
 * Without this, one thrown error anywhere in the tree unmounts the whole app
 * and leaves the user staring at an empty window with no hint that their
 * resumes are still safely on disk. That is the worst possible failure for
 * this product: the data is fine, but every signal the user has says it is
 * gone, and the rational response is to uninstall.
 *
 * Recovery is a remount rather than a restart. Everything is read from
 * SQLite on mount, and the autosave hook writes on every change, so the work
 * is already persisted — going back to the resume list is nearly always
 * enough to clear whatever state caused the throw.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Goes to logcat and to Play Console's crash reports via the native
    // handler. Deliberately not sent anywhere else: the app collects no
    // telemetry, and a resume's contents must never leave the device.
    console.error('Unhandled error in render tree', error);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            Your resumes are safe — everything is saved on this device as you
            type, and nothing here was lost.
          </Text>
          <Text style={styles.body}>
            Go back to your resumes and try again. If it keeps happening on
            the same resume, back up your data from Settings before changing
            anything else.
          </Text>

          <Pressable style={styles.cta} onPress={this.reset}>
            <Text style={styles.ctaText}>Back to my resumes</Text>
          </Pressable>

          {/* Last, small, and selectable: useful in a support mail, but it
              must not be the first thing a frightened user reads. */}
          <Text selectable style={styles.detail}>
            {error.message}
          </Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.space(6),
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.color.text,
    marginBottom: theme.space(3),
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.color.textMuted,
    marginBottom: theme.space(3),
  },
  cta: {
    marginTop: theme.space(3),
    paddingVertical: theme.space(4),
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.accent,
    alignItems: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  detail: {
    ...theme.font.hint,
    color: theme.color.textFaint,
    marginTop: theme.space(6),
  },
});
