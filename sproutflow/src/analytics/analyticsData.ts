// Module 8 data access: reads `sensor_reading_history` and `watering_logs` from Firestore.
// Falls back to clearly-labelled demo data when the collections are empty or unreachable,
// so the screen still works before Modules 4 and 5 are writing history.

import { sanitizeReading, sanitizeWateringLog, windowStart } from './analyticsMath';
import { ANALYTICS_COLLECTIONS, ANALYTICS_DATA_SOURCE, FETCH_DAYS, MAX_DOCS_PER_QUERY } from './config';
import { generateDemoHistory } from './mockAnalytics';
import type { AnalyticsDataset, SensorReading, WateringLog } from './types';

function demo(now: Date, notice: string): AnalyticsDataset {
  return { ...generateDemoHistory(FETCH_DAYS, now), source: 'demo', notice, truncated: false, loadedAt: now };
}

async function loadFromFirestore(now: Date): Promise<AnalyticsDataset> {
  // Loaded lazily so a missing or broken Firebase setup can't crash this screen at import time.
  const fs = await import('firebase/firestore');
  const { db } = await import('../api/firebaseConfig');
  const sinceIso = windowStart(FETCH_DAYS, now).toISOString();

  // Single-field range + orderBy on the same field: no composite index needed.
  async function fetchSince<T>(name: string, timeField: string, clean: (raw: Record<string, unknown>) => T | null) {
    const q = fs.query(
      fs.collection(db, name),
      fs.where(timeField, '>=', sinceIso),
      fs.orderBy(timeField, 'desc'),
      fs.limit(MAX_DOCS_PER_QUERY),
    );
    const snap = await fs.getDocs(q);
    const items: T[] = [];
    snap.forEach((doc) => {
      const v = clean(doc.data() as Record<string, unknown>);
      if (v) items.push(v);
    });
    return { items, truncated: snap.size >= MAX_DOCS_PER_QUERY };
  }

  const [r, w] = await Promise.all([
    fetchSince<SensorReading>(ANALYTICS_COLLECTIONS.readings, 'recordedAt', sanitizeReading),
    fetchSince<WateringLog>(ANALYTICS_COLLECTIONS.watering, 'wateredAt', sanitizeWateringLog),
  ]);
  if (r.items.length === 0) {
    return demo(now, `No readings in "${ANALYTICS_COLLECTIONS.readings}" yet. Showing demo data.`);
  }
  return { readings: r.items, logs: w.items, source: 'firestore', truncated: r.truncated || w.truncated, loadedAt: now };
}

export async function loadAnalyticsDataset(now: Date = new Date()): Promise<AnalyticsDataset> {
  if (ANALYTICS_DATA_SOURCE === 'demo') {
    return demo(now, 'Demo data · Firebase not connected yet');
  }
  try {
    const data = await loadFromFirestore(now);
    // Shown in the Metro terminal, so it is clear whether the charts use live data.
    if (data.source === 'firestore') {
      console.log(`[Analytics] Firestore: ${data.readings.length} readings, ${data.logs.length} watering logs`);
    } else {
      console.warn(`[Analytics] ${data.notice}`);
    }
    return data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[Analytics] Firestore unavailable: ${msg}`);
    return demo(now, `Firestore unavailable (${msg}). Showing demo data.`);
  }
}
