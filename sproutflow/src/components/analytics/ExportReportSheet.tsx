import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalyticsColors as C, DEFAULT_MOISTURE_RANGE } from '../../analytics/config';
import { exportCsv, exportPdf } from '../../analytics/exportReport';
import type { AnalyticsSummary, RangeDays } from '../../analytics/types';

/** 'options' = Export Options button (choose period + format); 'monthly' = Monthly CSV/PDF button (30 days). */
export type ExportMode = 'options' | 'monthly';
type Format = 'pdf' | 'csv';

type Props = {
  /** null hides the sheet. */
  mode: ExportMode | null;
  summaries: Record<RangeDays, AnalyticsSummary>;
  sourceLabel: string;
  onClose: () => void;
};

const PERIODS: { days: RangeDays; label: string }[] = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
];

const FORMATS: { value: Format; icon: ComponentProps<typeof Ionicons>['name']; title: string; detail: string }[] = [
  { value: 'pdf', icon: 'document-text-outline', title: 'PDF report', detail: 'Care summary and daily table, ready to print' },
  { value: 'csv', icon: 'grid-outline', title: 'CSV data', detail: 'Opens in Excel or Google Sheets' },
];

/** Bottom sheet behind the "Export Options" and "Monthly CSV/PDF" buttons. */
export default function ExportReportSheet({ mode, summaries, sourceLabel, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [days, setDays] = useState<RangeDays>(7);
  const [format, setFormat] = useState<Format>('pdf');
  const [busy, setBusy] = useState(false);

  const monthly = mode === 'monthly';
  const summary = summaries[monthly ? 30 : days];
  const score = summary.health.score === null ? '–' : `${summary.health.score}%`;

  // Closing is always allowed; an export that is still running finishes in the background.
  const close = () => onClose();

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (format === 'csv') await exportCsv(summary, DEFAULT_MOISTURE_RANGE);
      else await exportPdf(summary, DEFAULT_MOISTURE_RANGE, sourceLabel);
      onClose();
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={mode !== null} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close export options" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          <View style={styles.headRow}>
            <Text style={styles.title}>{monthly ? 'Monthly CSV/PDF' : 'Export Options'}</Text>
            <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={C.muted} />
            </Pressable>
          </View>
          <Text style={styles.sub}>
            {summary.days}-day Care Summary · {summary.plantCount} plants · {summary.totalLiters} L water · health {score}
          </Text>

          {!monthly && (
            <>
              <Text style={styles.label}>Period</Text>
              <View style={styles.segment}>
                {PERIODS.map((p) => {
                  const on = p.days === days;
                  return (
                    <Pressable
                      key={p.days}
                      style={[styles.segItem, on && styles.segItemOn]}
                      onPress={() => setDays(p.days)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.segText, on && styles.segTextOn]}>{p.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <Text style={styles.label}>Format</Text>
          <View style={styles.formats}>
            {FORMATS.map((f) => {
              const on = f.value === format;
              return (
                <Pressable
                  key={f.value}
                  style={[styles.option, on && styles.optionOn]}
                  onPress={() => setFormat(f.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name={f.icon} size={20} color={C.primary} />
                  </View>
                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionTitle}>{f.title}</Text>
                    <Text style={styles.optionDetail}>{f.detail}</Text>
                  </View>
                  <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? C.primary : C.faint} />
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [styles.exportBtn, (pressed || busy) && styles.exportBtnPressed]}
            onPress={run}
            disabled={busy}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator color={C.onPrimary} />
            ) : (
              <>
                <Ionicons name="share-outline" size={18} color={C.onPrimary} />
                <Text style={styles.exportText}>Export {format.toUpperCase()}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(15, 42, 27, 0.4)' },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: C.text, fontSize: 19, fontWeight: '800' },
  sub: { color: C.muted, fontSize: 12, marginTop: 4 },
  label: { color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 18, marginBottom: 8, textTransform: 'uppercase' },
  segment: { flexDirection: 'row', backgroundColor: C.primarySoft, borderRadius: 12, padding: 4 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  segItemOn: { backgroundColor: C.primary },
  segText: { color: C.primaryDark, fontSize: 14, fontWeight: '600' },
  segTextOn: { color: C.onPrimary, fontWeight: '700' },
  formats: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    padding: 12,
  },
  optionOn: { borderColor: C.primary, backgroundColor: C.primaryTint },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: { flex: 1 },
  optionTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  optionDetail: { color: C.muted, fontSize: 12, marginTop: 2 },
  exportBtn: {
    marginTop: 20,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportBtnPressed: { opacity: 0.85 },
  exportText: { color: C.onPrimary, fontSize: 16, fontWeight: '700' },
});
