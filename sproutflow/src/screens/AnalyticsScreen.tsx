// Module 8 — Analytics: 7-day moisture trends, water usage and Care Summary export (CSV / PDF).
// Layout and colours follow the Module 8 Analytics mockup.

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { loadAnalyticsDataset } from '../analytics/analyticsData';
import { endOfDayDaysAgo, summarize, waterByWeekday, type WaterBar } from '../analytics/analyticsMath';
import { AnalyticsColors as C, cardShadow, DEFAULT_MOISTURE_RANGE as RANGE } from '../analytics/config';
import type { AnalyticsDataset } from '../analytics/types';
import BarChart from '../components/analytics/BarChart';
import DropdownPill, { type PillOption } from '../components/analytics/DropdownPill';
import ExportReportSheet, { type ExportMode } from '../components/analytics/ExportReportSheet';
import LineChart from '../components/analytics/LineChart';

type TrendView = 'today' | 'lastWeek';
type WaterView = 'weekly' | 'monthly';

const TREND_OPTIONS: PillOption<TrendView>[] = [
  { value: 'today', label: 'Today', hint: 'The 7 days up to today' },
  { value: 'lastWeek', label: 'Last week', hint: 'The 7 days before that' },
];

const WATER_OPTIONS: PillOption<WaterView>[] = [
  { value: 'weekly', label: 'Weekly', hint: 'Litres used each day, last 7 days' },
  { value: 'monthly', label: 'Monthly', hint: 'Average litres per weekday, last 30 days' },
];

/** How far the first card overlaps the green header. */
const OVERLAP = 56;

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<AnalyticsDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendView, setTrendView] = useState<TrendView>('today');
  const [waterView, setWaterView] = useState<WaterView>('monthly');
  const [exportMode, setExportMode] = useState<ExportMode | null>(null);

  const load = useCallback(async () => {
    setData(await loadAnalyticsDataset(new Date()));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const week = useMemo(() => (data ? summarize(data.readings, data.logs, 7, RANGE, data.loadedAt) : null), [data]);
  const month = useMemo(() => (data ? summarize(data.readings, data.logs, 30, RANGE, data.loadedAt) : null), [data]);

  const trend = useMemo(() => {
    if (!data || trendView === 'today') return week;
    return summarize(data.readings, data.logs, 7, RANGE, endOfDayDaysAgo(data.loadedAt, 7));
  }, [data, trendView, week]);

  const water = useMemo<WaterBar[]>(() => {
    if (!week || !month) return [];
    return waterView === 'weekly' ? week.water : waterByWeekday(month.water);
  }, [week, month, waterView]);

  const ready = !loading && trend !== null && week !== null && month !== null;
  const sourceLabel = data?.source === 'firestore' ? 'Firestore live history' : 'Demo data';
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.onPrimary}
            colors={[C.primary]}
            progressViewOffset={insets.top}
          />
        }
      >
        <LinearGradient
          colors={[C.headerFrom, C.headerMid, C.headerTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 6 }]}
        >
          <View style={styles.glow} />
          <View style={styles.heroRow}>
            <Pressable onPress={goBack} style={styles.backBtn} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="chevron-back" size={28} color={C.onPrimary} />
            </Pressable>
            <Text style={styles.title}>ANALYTICS</Text>
            <View style={styles.backBtn} />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {!ready || !trend ? (
            <View style={[styles.card, styles.loading]}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={styles.loadingText}>Loading sensor history…</Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>7-day Moisture Trends</Text>
                  <DropdownPill title="Moisture trends" value={trendView} onChange={setTrendView} options={TREND_OPTIONS} />
                </View>
                <LineChart
                  chartId="moisture"
                  labels={trend.daily.map((d) => d.label)}
                  series={[
                    { key: 'humidity', color: C.blue, fillOpacity: 0.14, values: trend.daily.map((d) => d.humidity) },
                    { key: 'moisture', color: C.green, fillOpacity: 0.32, values: trend.daily.map((d) => d.moisture) },
                  ]}
                  accessibilityLabel="Daily average soil moisture in green and air humidity in blue, in percent"
                />
              </View>

              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>Water Usage</Text>
                  <DropdownPill title="Water usage" value={waterView} onChange={setWaterView} options={WATER_OPTIONS} />
                </View>
                <BarChart
                  labels={water.map((w) => w.label)}
                  series={[
                    { key: 'manual', color: C.red, values: water.map((w) => w.manualLiters) },
                    { key: 'auto', color: C.green, values: water.map((w) => w.autoLiters) },
                  ]}
                  accessibilityLabel={`Litres of water from manual watering in red and auto watering in green, ${
                    waterView === 'weekly' ? 'per day for the last 7 days' : 'average per weekday for the last 30 days'
                  }`}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, !ready && styles.disabled]}
          onPress={() => setExportMode('options')}
          disabled={!ready}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>Export Options</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.outlineBtn, pressed && styles.pressed, !ready && styles.disabled]}
          onPress={() => setExportMode('monthly')}
          disabled={!ready}
          accessibilityRole="button"
        >
          <Text style={styles.outlineBtnText}>Monthly CSV/PDF</Text>
        </Pressable>
      </View>

      {week && month && (
        <ExportReportSheet
          mode={exportMode}
          summaries={{ 7: week, 30: month }}
          sourceLabel={sourceLabel}
          onClose={() => setExportMode(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  hero: { paddingHorizontal: 12, paddingBottom: OVERLAP + 18, overflow: 'hidden' },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -90,
    top: -120,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { color: C.onPrimary, fontSize: 21, fontWeight: '800', letterSpacing: 1.5 },
  body: { marginTop: -OVERLAP, paddingHorizontal: 16, gap: 14 },
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 8,
    ...cardShadow,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  cardTitle: { flexShrink: 1, color: C.text, fontSize: 18, fontWeight: '800' },
  loading: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: C.muted, fontSize: 13 },
  actions: { paddingHorizontal: 16, paddingTop: 12, gap: 10, backgroundColor: C.bg },
  primaryBtn: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: C.onPrimary, fontSize: 16, fontWeight: '700' },
  outlineBtn: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.primary,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { color: C.primaryDark, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
