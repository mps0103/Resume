import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Resume } from '../types/resume';
import { renderResume } from '../templates/registry';
import {
  Entitlement,
  ExportFormat,
  exportResume,
  refusalCopy,
} from '../services/exportResume';
import { ActionSheet } from '../components/ActionSheet';
import { appAlert } from '../components/AppDialog';

interface Props {
  resume: Resume;
  entitlement: Entitlement;
  freeExportsUsed: number;
  onExported: (
    filePath: string,
    savedTo: string | null,
    mimeType: string,
  ) => void;
  onOpenPaywall: () => void;
  onEdit: () => void;
}

export function PreviewScreen({
  resume,
  entitlement,
  freeExportsUsed,
  onExported,
  onOpenPaywall,
  onEdit,
}: Props) {
  const [exporting, setExporting] = useState(false);
  const [chooser, setChooser] = useState(false);

  const html = useMemo(
    () => renderResume(resume, { mode: 'preview' }),
    [resume],
  );

  async function handleExport(format: ExportFormat) {
    setExporting(true);
    const result = await exportResume({
      resume,
      entitlement,
      freeExportsUsed,
      format,
    });
    setExporting(false);

    if (result.ok) {
      onExported(result.filePath, result.savedTo, result.mimeType);
      return;
    }
    const copy = refusalCopy(result);
    appAlert(copy.title, copy.body, [
      { text: 'Not now', style: 'cancel' },
      {
        text: copy.cta,
        onPress:
          result.reason === 'render-failed'
            ? () => handleExport(format)
            : onOpenPaywall,
      },
    ]);
  }

  return (
    <View style={styles.root}>
      {/*
        The WebView owns fitting, scrolling and pinch-zoom, all three.

        Splitting that job was the bug: the sheet used to be scaled with a
        React Native transform while the WebView's own scrolling was turned
        off, so the app decided the zoom level and the WebView had no way to
        pan. Zooming in then had nothing to scroll and the top and bottom of
        the page could not be reached.

        The document is laid out at true page width (see htmlDocument's
        viewportWidth) and scalesPageToFit shrinks it to the screen, which is
        the same thing a browser does when it opens a desktop page. Zoom and
        scroll are then the platform's, and they work together properly.
      */}
      <View style={styles.stage}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.web}
          scrollEnabled
          scalesPageToFit
          setBuiltInZoomControls
          // The floating +/- buttons are redundant next to pinch and cover
          // the bottom of the page while they fade out.
          setDisplayZoomControls={false}
          // Nothing in the preview needs scripting: the page is static markup
          // and the viewer measures itself.
          javaScriptEnabled={false}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
        />
      </View>

      <View style={styles.bar}>
        <TouchableOpacity style={styles.secondary} onPress={onEdit}>
          <Text style={styles.secondaryLabel}>Edit details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primary, exporting && styles.primaryBusy]}
          onPress={() => setChooser(true)}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryLabel}>Export</Text>
          )}
        </TouchableOpacity>
      </View>

      <ActionSheet
        visible={chooser}
        title="Export this resume"
        onClose={() => setChooser(false)}
        actions={[
          {
            label: 'PDF',
            hint: 'Keeps the design exactly as you see it. Send this one to employers.',
            onPress: () => handleExport('pdf'),
          },
          {
            label: 'Word (.docx)',
            hint: 'Editable in Word, Google Docs and Pages. Uses a plain layout, not the chosen design.',
            onPress: () => handleExport('docx'),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef0f3' },
  stage: { flex: 1, backgroundColor: '#fff' },
  web: { flex: 1, backgroundColor: '#fff' },
  bar: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d6d9de',
  },
  secondary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c9ced5',
  },
  secondaryLabel: { fontSize: 15, fontWeight: '600', color: '#2b2f35' },
  primary: {
    flex: 1.4,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#1F3A5F',
  },
  primaryBusy: { opacity: 0.75 },
  primaryLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
