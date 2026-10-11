import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Share from 'react-native-share';

import { SplashOverlay } from './src/components/SplashOverlay';
import { HomeScreen } from './src/screens/HomeScreen';
import { EditorScreen } from './src/screens/EditorScreen';
import { SectionEditorScreen } from './src/screens/SectionEditorScreen';
import { PreviewScreen } from './src/screens/PreviewScreen';
import { TemplateGalleryScreen } from './src/screens/TemplateGalleryScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { StyleScreen } from './src/screens/StyleScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

import { Resume, ResumeSummary } from './src/types/resume';
import { createResume, sampleResume, uid } from './src/data/factory';
import { setTemplate } from './src/data/mutations';
import {
  deleteResume,
  duplicateResume,
  getResume,
  initDb,
  listResumes,
  renameResume,
  saveResume,
} from './src/db/resumeStore';
import { useResumeDraft } from './src/hooks/useResumeDraft';
import {
  currentEntitlement,
  // Aliased: the prop threaded through the screens is also called
  // freeExportsUsed, and when the two collided the preview silently bound to
  // this import instead of the prop — which is how the export gate ended up
  // reading a tally that never changed.
  freeExportsUsed as storedFreeExportsUsed,
  recordFreeExport,
  startBilling,
  stopBilling,
  type Entitlement,
} from './src/services/billing';
import { initAds, showExportInterstitial } from './src/services/ads';
import { checkIntegrity } from './src/services/integrity';
import { hideSplash } from './src/services/splash';
import { initTestMode } from './src/services/testMode';
import { APP_VERSION } from './src/config/legal';
import { theme } from './src/ui/theme';

import { previousRoute, type Route } from './src/navigation/routes';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { DialogHost, appAlert } from './src/components/AppDialog';

function AppRoot() {
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [entitlement, setEntitlement] = useState<Entitlement>('free');
  /**
   * The free-export tally, mirrored into state.
   *
   * It lives in MMKV, and MMKV writes do not re-render anything. Both
   * screens used to read freeExportsUsed() straight from the store during
   * render, so after an export the count on screen — and, worse, the count
   * the export gate compares against — stayed at whatever it was when the
   * screen mounted. A free user could export as many times as they liked
   * without leaving the preview.
   */
  const [exportsUsed, setExportsUsed] = useState(0);

  useEffect(() => {
    initDb();
    setResumes(listResumes());
    setEntitlement(currentEntitlement());
    setExportsUsed(storedFreeExportsUsed());
    setReady(true);

    // Debug builds only. The build type has to come back from native before
    // the override can apply, so the entitlement is re-read once it lands —
    // otherwise a debug build spends its first render on the free tier and
    // the Pro paths stay locked.
    initTestMode()
      .then(() => {
        setEntitlement(currentEntitlement());
        // Only now: the ad units are chosen from the native debug flag, and
        // starting ads before it lands would pick the live units in a debug
        // build. See the note on shouldUseTestAds in services/ads.
        return initAds();
      })
      .catch(() => {});

    // Runs in the background and never gates startup — a slow or failing
    // integrity check must not delay a paying user's first screen.
    checkIntegrity()
      .then(() => setEntitlement(currentEntitlement()))
      .catch(() => {});

    startBilling(setEntitlement);
    return () => stopBilling();
  }, []);

  const refresh = useCallback(() => setResumes(listResumes()), []);

  /** Re-reads the tally after anything that changes it. */
  const refreshUsage = useCallback(
    () => setExportsUsed(storedFreeExportsUsed()),
    [],
  );

  function openPaywall() {
    setRoute(r => ({ name: 'paywall', from: r }));
  }

  function closePaywall() {
    setRoute(r => (r.name === 'paywall' ? r.from : r));
  }

  /**
   * The splash stays up for this null frame, so the user goes straight from
   * the splash to the first screen instead of through a blank window. Run
   * after paint rather than inside the init effect: the point is that there
   * is something to look at, not that the data has loaded.
   */
  useEffect(() => {
    if (!ready) return;
    // Two frames, not one. The first only guarantees React has committed;
    // the second guarantees those pixels are actually on screen. Releasing
    // the native splash before SplashOverlay has painted would show a flash
    // of the home screen between the two.
    const raf = requestAnimationFrame(() => requestAnimationFrame(hideSplash));
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  /**
   * Android's back button. Without this every screen closes the app, which
   * loses the user's place and reads as a crash.
   *
   * Navigating away is safe without an explicit save: useResumeDraft flushes
   * the draft on unmount, so the working copy is already in SQLite by the
   * time a new route renders.
   */
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const previous = previousRoute(route);
      if (!previous) return false; // home — let Android close the app
      setRoute(previous);
      // Titles and edit times change while a resume is open, so the list has
      // to be re-read on the way back to it.
      if (previous.name === 'home') refresh();
      return true;
    });
    return () => sub.remove();
  }, [route, refresh]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {route.name === 'home' && (
          <HomeScreen
            resumes={resumes}
            entitlement={entitlement}
            onCreate={() => {
              const r = createResume();
              saveResume(r);
              refresh();
              setRoute({ name: 'editor', resumeId: r.id });
            }}
            onCreateSample={() => {
              // A fresh id every time, so loading it twice gives two
              // independent documents rather than reopening the same one.
              const r = sampleResume();
              saveResume(r);
              refresh();
              setRoute({ name: 'editor', resumeId: r.id });
            }}
            onOpen={id => setRoute({ name: 'editor', resumeId: id })}
            onDuplicate={id => {
              const src = getResume(id);
              if (src) duplicateResume(src, uid());
              refresh();
            }}
            onRename={(id, title) => {
              renameResume(id, title);
              refresh();
            }}
            onDelete={id => {
              deleteResume(id);
              refresh();
            }}
            onOpenPaywall={openPaywall}
            onOpenSettings={() => setRoute({ name: 'settings' })}
          />
        )}

        {route.name === 'settings' && (
          <Chrome title="Settings" onBack={() => setRoute({ name: 'home' })}>
            <SettingsScreen
              entitlement={entitlement}
              freeExportsUsed={exportsUsed}
              version={APP_VERSION}
              onEntitlementChange={setEntitlement}
              onOpenPaywall={openPaywall}
              onDataRestored={refresh}
              onUsageChange={refreshUsage}
            />
          </Chrome>
        )}

        {(route.name === 'editor' ||
          route.name === 'section' ||
          route.name === 'preview' ||
          route.name === 'style' ||
          route.name === 'templates') && (
          <ResumeFlow
            key={route.resumeId}
            route={route}
            entitlement={entitlement}
            freeExportsUsed={exportsUsed}
            setRoute={setRoute}
            onDirty={refresh}
            onOpenPaywall={openPaywall}
            onUsageChange={refreshUsage}
          />
        )}

        {route.name === 'paywall' && (
          <PaywallScreen
            onClose={closePaywall}
            onEntitlementChange={e => {
              setEntitlement(e);
              if (e === 'pro') closePaywall();
            }}
          />
        )}
      </SafeAreaView>

      {/*
        Outside SafeAreaView so it covers the status and navigation bars too,
        which is what makes it continuous with the native splash rather than
        a panel inset within it. It unmounts itself once faded.
      */}
      <SplashOverlay />
    </SafeAreaProvider>
  );
}

/**
 * Owns the working copy for one resume. Mounting it per resumeId means the
 * draft and its autosave timer are torn down cleanly when the user switches
 * documents, so a pending write can never land on the wrong record.
 */
function ResumeFlow({
  route,
  entitlement,
  freeExportsUsed,
  setRoute,
  onDirty,
  onOpenPaywall,
  onUsageChange,
}: {
  route: Extract<Route, { resumeId: string }>;
  entitlement: Entitlement;
  freeExportsUsed: number;
  setRoute: (r: Route) => void;
  onDirty: () => void;
  onOpenPaywall: () => void;
  onUsageChange: () => void;
}) {
  const [initial] = useState(() => getResume(route.resumeId));

  if (!initial) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>That resume is no longer here.</Text>
      </View>
    );
  }
  return (
    <ResumeFlowInner
      initial={initial}
      route={route}
      entitlement={entitlement}
      freeExportsUsed={freeExportsUsed}
      setRoute={setRoute}
      onDirty={onDirty}
      onOpenPaywall={onOpenPaywall}
      onUsageChange={onUsageChange}
    />
  );
}

function ResumeFlowInner({
  initial,
  route,
  entitlement,
  freeExportsUsed,
  setRoute,
  onDirty,
  onOpenPaywall,
  onUsageChange,
}: {
  initial: Resume;
  route: Extract<Route, { resumeId: string }>;
  entitlement: Entitlement;
  freeExportsUsed: number;
  setRoute: (r: Route) => void;
  onDirty: () => void;
  onOpenPaywall: () => void;
  onUsageChange: () => void;
}) {
  const { resume, update, flush, saveState } = useResumeDraft(initial);

  function back() {
    flush();
    onDirty();
    setRoute({ name: 'home' });
  }

  switch (route.name) {
    case 'editor':
      return (
        <Chrome
          title={resume.title}
          onBack={back}
          action={{
            label: 'Designs',
            onPress: () => setRoute({ name: 'templates', resumeId: resume.id }),
          }}
        >
          <EditorScreen
            resume={resume}
            saving={saveState === 'pending'}
            update={update}
            onOpenSection={sectionId =>
              setRoute({ name: 'section', resumeId: resume.id, sectionId })
            }
            onPreview={() => {
              flush();
              setRoute({ name: 'preview', resumeId: resume.id });
            }}
          />
        </Chrome>
      );

    case 'section':
      return (
        <Chrome
          title="Edit section"
          onBack={() => setRoute({ name: 'editor', resumeId: resume.id })}
        >
          <SectionEditorScreen
            resume={resume}
            sectionId={route.sectionId}
            update={update}
            onBack={() => setRoute({ name: 'editor', resumeId: resume.id })}
          />
        </Chrome>
      );

    case 'templates':
      return (
        <Chrome
          title="Designs"
          onBack={() => setRoute({ name: 'editor', resumeId: resume.id })}
          action={{
            label: 'Style',
            onPress: () => setRoute({ name: 'style', resumeId: resume.id }),
          }}
        >
          <TemplateGalleryScreen
            resume={resume}
            entitlement={entitlement}
            onSelect={id => update(r => setTemplate(r, id))}
            onOpenPaywall={onOpenPaywall}
          />
        </Chrome>
      );

    case 'style':
      return (
        <Chrome
          title="Style"
          onBack={() => setRoute({ name: 'templates', resumeId: resume.id })}
        >
          <StyleScreen resume={resume} update={update} />
        </Chrome>
      );

    case 'preview':
      return (
        <Chrome
          title="Preview"
          onBack={() => setRoute({ name: 'editor', resumeId: resume.id })}
          action={{
            label: 'Designs',
            onPress: () => setRoute({ name: 'templates', resumeId: resume.id }),
          }}
        >
          <PreviewScreen
            resume={resume}
            entitlement={entitlement}
            freeExportsUsed={freeExportsUsed}
            onEdit={() => setRoute({ name: 'editor', resumeId: resume.id })}
            onOpenPaywall={onOpenPaywall}
            onExported={async (filePath, savedTo, mimeType) => {
              if (entitlement === 'free') {
                recordFreeExport();
                onUsageChange();
              }
              const isWord = mimeType !== 'application/pdf';
              // The file is already on disk before any ad is considered.
              appAlert(
                isWord ? 'Saved as a Word document' : 'Saved as PDF',
                savedTo
                  ? `Your resume is in ${savedTo}.`
                  : // Below Android 10 it can only live in the app's own
                    // folder, so offer the share sheet rather than name a
                    // path the user cannot browse to.
                    'Your resume is ready. Use Share to send it somewhere you can find it.',
                [
                  { text: 'Done' },
                  {
                    text: 'Share',
                    onPress: () =>
                      Share.open({ url: `file://${filePath}`, type: mimeType })
                        .catch(() => {}),
                  },
                ],
              );
              showExportInterstitial(entitlement);
            }}
          />
        </Chrome>
      );
  }
}

function Chrome({
  title,
  onBack,
  action,
  children,
}: {
  title: string;
  onBack: () => void;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <Text style={styles.back} onPress={onBack}>
          ‹ Back
        </Text>
        <Text style={styles.barTitle} numberOfLines={1}>
          {title}
        </Text>
        {action ? (
          <Text style={styles.action} onPress={action.onPress}>
            {action.label}
          </Text>
        ) : (
          <View style={styles.actionSpacer} />
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.bg },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(3),
    backgroundColor: theme.color.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
  },
  back: { fontSize: 15, color: theme.color.accent, width: 64 },
  barTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: theme.color.text,
  },
  action: {
    fontSize: 15,
    color: theme.color.accent,
    width: 64,
    textAlign: 'right',
  },
  actionSpacer: { width: 64 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingText: { fontSize: 15, color: theme.color.textMuted },
});

/**
 * The boundary wraps the whole tree rather than individual screens: a crash
 * in any one of them leaves the navigation state unusable anyway, and the
 * recovery path is the same in every case — remount and go back to the list.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AppRoot />
      {/*
        Outside AppRoot so a dialog outlives the screen that raised it: an
        export alert must still be dismissible if the user backs out of the
        preview while it is up.
      */}
      <DialogHost />
    </ErrorBoundary>
  );
}
