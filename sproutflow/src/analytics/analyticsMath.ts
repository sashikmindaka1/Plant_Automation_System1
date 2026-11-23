// Pure aggregation functions for Module 8. No React Native or Firebase imports,
// so this file can be tested with plain Node.

import { READING_LIMITS } from './config';
import type {
  AnalyticsSummary,
  DailyPoint,
  DailyWater,
  HealthScore,
  MoistureRange,
  RangeDays,
  SensorReading,
  WateringLog,
} from './types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** Local calendar day key, YYYY-MM-DD. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Keys for the last `days` local days, oldest first, ending today. */
export function lastDayKeys(days: number, now: Date): { date: string; d: Date }[] {
  const out: { date: string; d: Date }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    out.push({ date: dayKey(d), d });
  }
  return out;
}

export function dayLabel(d: Date, days: RangeDays): string {
  return days === 7 ? WEEKDAYS[d.getDay()] : `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Start of the window: local midnight `days - 1` days ago. */
export function windowStart(days: number, now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
}

/** 23:59:59.999 local time, `daysAgo` days before `now`. Used as the end of the "Last week" window. */
export function endOfDayDaysAgo(now: Date, daysAgo: number): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 23, 59, 59, 999);
}

/** "Weekly" for the 7-day summary, "Monthly" for the 30-day one. */
export const periodName = (days: RangeDays) => (days === 30 ? 'Monthly' : 'Weekly');

const isFiniteIn = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

const parseTime = (v: unknown): number | null => {
  if (typeof v !== 'string') return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
};

/** Accepts a raw Firestore document; returns a clean reading or null. */
export function sanitizeReading(raw: Record<string, unknown>): SensorReading | null {
  const t = parseTime(raw.recordedAt);
  const m = READING_LIMITS.moisture;
  const c = READING_LIMITS.temperature;
  if (t === null) return null;
  if (typeof raw.plantId !== 'string' || raw.plantId.length === 0) return null;
  if (!isFiniteIn(raw.soilMoisturePercent, m.min, m.max)) return null;
  if (!isFiniteIn(raw.temperatureCelsius, c.min, c.max)) return null;
  return {
    plantId: raw.plantId,
    plantNickname: typeof raw.plantNickname === 'string' ? raw.plantNickname : undefined,
    recordedAt: raw.recordedAt as string,
    soilMoisturePercent: raw.soilMoisturePercent,
    temperatureCelsius: raw.temperatureCelsius,
    humidityPercent: isFiniteIn(raw.humidityPercent, 0, 100) ? raw.humidityPercent : undefined,
    lightLux: isFiniteIn(raw.lightLux, 0, 200000) ? raw.lightLux : undefined,
    waterTankLevelPercent: isFiniteIn(raw.waterTankLevelPercent, 0, 100) ? raw.waterTankLevelPercent : undefined,
  };
}

/** Accepts a raw Firestore document; returns a clean watering log or null. */
export function sanitizeWateringLog(raw: Record<string, unknown>): WateringLog | null {
  const t = parseTime(raw.wateredAt);
  const l = READING_LIMITS.liters;
  if (t === null) return null;
  if (typeof raw.plantId !== 'string' || raw.plantId.length === 0) return null;
  if (!isFiniteIn(raw.litersUsed, l.min, l.max)) return null;
  const trigger = raw.trigger === 'manual' ? 'manual' : 'auto';
  return { plantId: raw.plantId, wateredAt: raw.wateredAt as string, litersUsed: raw.litersUsed, trigger };
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/** Daily average moisture and temperature for the last `days` days. Days without data are null. */
export function aggregateDaily(readings: SensorReading[], days: RangeDays, now: Date): DailyPoint[] {
  const buckets = new Map<string, { m: number; t: number; h: number; hn: number; n: number }>();
  const start = windowStart(days, now).getTime();
  const end = now.getTime();
  for (const r of readings) {
    const ts = Date.parse(r.recordedAt);
    if (ts < start || ts > end) continue;
    const key = dayKey(new Date(ts));
    const b = buckets.get(key) ?? { m: 0, t: 0, h: 0, hn: 0, n: 0 };
    b.m += r.soilMoisturePercent;
    b.t += r.temperatureCelsius;
    if (r.humidityPercent !== undefined) {
      b.h += r.humidityPercent;
      b.hn += 1;
    }
    b.n += 1;
    buckets.set(key, b);
  }
  return lastDayKeys(days, now).map(({ date, d }) => {
    const b = buckets.get(date);
    return {
      date,
      label: dayLabel(d, days),
      moisture: b ? round1(b.m / b.n) : null,
      temperature: b ? round1(b.t / b.n) : null,
      humidity: b && b.hn > 0 ? round1(b.h / b.hn) : null,
      readings: b ? b.n : 0,
    };
  });
}

/** Liters per day split by trigger, for the last `days` days. */
export function aggregateWater(logs: WateringLog[], days: RangeDays, now: Date): DailyWater[] {
  const buckets = new Map<string, { a: number; m: number; n: number }>();
  const start = windowStart(days, now).getTime();
  const end = now.getTime();
  for (const l of logs) {
    const ts = Date.parse(l.wateredAt);
    if (ts < start || ts > end) continue;
    const key = dayKey(new Date(ts));
    const b = buckets.get(key) ?? { a: 0, m: 0, n: 0 };
    if (l.trigger === 'manual') b.m += l.litersUsed;
    else b.a += l.litersUsed;
    b.n += 1;
    buckets.set(key, b);
  }
  return lastDayKeys(days, now).map(({ date, d }) => {
    const b = buckets.get(date);
    return {
      date,
      label: dayLabel(d, days),
      autoLiters: b ? round1(b.a) : 0,
      manualLiters: b ? round1(b.m) : 0,
      runs: b ? b.n : 0,
    };
  });
}

/** One group in the Water Usage chart. */
export type WaterBar = { label: string; autoLiters: number; manualLiters: number };

/**
 * Average litres per weekday, Sun → Sat, over the given days (the "Monthly" Water Usage view).
 * A 30-day window holds each weekday 4 or 5 times, so averages keep the weekdays comparable.
 */
export function waterByWeekday(daily: DailyWater[]): WaterBar[] {
  const acc = WEEKDAYS.map(() => ({ auto: 0, manual: 0, days: 0 }));
  for (const w of daily) {
    const [y, m, d] = w.date.split('-').map(Number);
    const b = acc[new Date(y, m - 1, d).getDay()];
    b.auto += w.autoLiters;
    b.manual += w.manualLiters;
    b.days += 1;
  }
  return acc.map((b, i) => ({
    label: WEEKDAYS[i],
    autoLiters: b.days === 0 ? 0 : round1(b.auto / b.days),
    manualLiters: b.days === 0 ? 0 : round1(b.manual / b.days),
  }));
}

/**
 * Garden Health Score: share of readings whose soil moisture stayed inside the ideal band
 * (report, Member 8: "based on how often plants stayed within ideal moisture ranges").
 */
export function healthScore(readings: SensorReading[], range: MoistureRange): HealthScore {
  let inRange = 0;
  let tooDry = 0;
  let tooWet = 0;
  for (const r of readings) {
    if (r.soilMoisturePercent < range.min) tooDry += 1;
    else if (r.soilMoisturePercent > range.max) tooWet += 1;
    else inRange += 1;
  }
  const total = inRange + tooDry + tooWet;
  return { score: total === 0 ? null : Math.round((inRange / total) * 100), total, inRange, tooDry, tooWet };
}

export function filterWindow<T>(items: T[], getIso: (x: T) => string, days: RangeDays, now: Date): T[] {
  const start = windowStart(days, now).getTime();
  const end = now.getTime();
  return items.filter((x) => {
    const ts = Date.parse(getIso(x));
    return ts >= start && ts <= end;
  });
}

const avg = (xs: number[]) => (xs.length === 0 ? null : round1(xs.reduce((s, v) => s + v, 0) / xs.length));

export function summarize(
  allReadings: SensorReading[],
  allLogs: WateringLog[],
  days: RangeDays,
  range: MoistureRange,
  now: Date,
): AnalyticsSummary {
  const readings = filterWindow(allReadings, (r) => r.recordedAt, days, now);
  const logs = filterWindow(allLogs, (l) => l.wateredAt, days, now);
  const plants = new Set(readings.map((r) => r.plantId));
  return {
    days,
    daily: aggregateDaily(readings, days, now),
    water: aggregateWater(logs, days, now),
    health: healthScore(readings, range),
    avgMoisture: avg(readings.map((r) => r.soilMoisturePercent)),
    avgTemperature: avg(readings.map((r) => r.temperatureCelsius)),
    totalLiters: round1(logs.reduce((s, l) => s + l.litersUsed, 0)),
    autoRuns: logs.filter((l) => l.trigger === 'auto').length,
    manualRuns: logs.filter((l) => l.trigger === 'manual').length,
    plantCount: plants.size,
  };
}

// ---------- Export builders ----------

const csvCell = (v: string | number | null) => {
  if (v === null) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildCsv(s: AnalyticsSummary, range: MoistureRange, generatedAt: Date): string {
  const lines: string[] = [];
  lines.push(
    [`SproutFlow ${periodName(s.days)} Care Summary`, `Last ${s.days} days`, `Generated ${generatedAt.toISOString()}`]
      .map(csvCell)
      .join(','),
  );
  lines.push('');
  lines.push(['Metric', 'Value'].join(','));
  lines.push(['Garden Health Score (%)', s.health.score].map(csvCell).join(','));
  lines.push(['Ideal moisture band (%)', `${range.min}-${range.max}`].map(csvCell).join(','));
  lines.push(['Readings in range', s.health.inRange].map(csvCell).join(','));
  lines.push(['Readings too dry', s.health.tooDry].map(csvCell).join(','));
  lines.push(['Readings too wet', s.health.tooWet].map(csvCell).join(','));
  lines.push(['Average soil moisture (%)', s.avgMoisture].map(csvCell).join(','));
  lines.push(['Average temperature (C)', s.avgTemperature].map(csvCell).join(','));
  lines.push(['Total water used (L)', s.totalLiters].map(csvCell).join(','));
  lines.push(['Auto pump runs', s.autoRuns].map(csvCell).join(','));
  lines.push(['Manual pump runs', s.manualRuns].map(csvCell).join(','));
  lines.push('');
  lines.push(['Date', 'Avg moisture (%)', 'Avg temperature (C)', 'Readings', 'Auto water (L)', 'Manual water (L)', 'Pump runs'].join(','));
  s.daily.forEach((d, i) => {
    const w = s.water[i];
    lines.push([d.date, d.moisture, d.temperature, d.readings, w.autoLiters, w.manualLiters, w.runs].map(csvCell).join(','));
  });
  return lines.join('\r\n');
}

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmt = (v: number | null, unit = '') => (v === null ? '–' : `${v}${unit}`);

export function buildReportHtml(s: AnalyticsSummary, range: MoistureRange, generatedAt: Date, sourceLabel: string): string {
  const maxL = Math.max(1, ...s.water.map((w) => w.autoLiters + w.manualLiters));
  const rows = s.daily
    .map((d, i) => {
      const w = s.water[i];
      const total = w.autoLiters + w.manualLiters;
      const bar = Math.round((total / maxL) * 100);
      return `<tr><td>${esc(d.date)}</td><td>${fmt(d.moisture, '%')}</td><td>${fmt(d.temperature, ' °C')}</td>
<td>${w.autoLiters}</td><td>${w.manualLiters}</td>
<td><div class="bar"><span style="width:${bar}%"></span></div></td></tr>`;
    })
    .join('');
  const score = s.health.score;
  const scoreColor = score === null ? '#9AA9A1' : score >= 70 ? '#2C6643' : score >= 40 ? '#D9922E' : '#E14A4A';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
@page { margin: 24px; }
body { font-family: -apple-system, Roboto, Arial, sans-serif; color: #16261D; font-size: 12px; }
h1 { color: #2C6643; font-size: 22px; margin: 0 0 4px; }
.sub { color: #5F7268; margin-bottom: 16px; }
.kpis { display: flex; gap: 8px; margin-bottom: 16px; }
.kpi { flex: 1; background: #F3F7F5; border: 1px solid #D6E4DE; border-radius: 8px; padding: 10px; }
.kpi b { display: block; font-size: 18px; }
.kpi span { color: #5F7268; font-size: 11px; }
table { width: 100%; border-collapse: collapse; }
th { background: #2C6643; color: #fff; text-align: left; padding: 6px; font-size: 11px; }
td { padding: 5px 6px; border-bottom: 1px solid #E6EEEA; }
.bar { background: #E6EEEA; height: 8px; border-radius: 4px; width: 100px; }
.bar span { display: block; height: 8px; background: #2C6643; border-radius: 4px; }
.foot { color: #9AA9A1; font-size: 10px; margin-top: 12px; }
</style></head><body>
<h1>SproutFlow ${periodName(s.days)} Care Summary</h1>
<div class="sub">Last ${s.days} days · ${s.plantCount} plant(s) · generated ${esc(generatedAt.toLocaleString())}</div>
<div class="kpis">
<div class="kpi"><b style="color:${scoreColor}">${fmt(score, '%')}</b><span>Garden Health Score</span></div>
<div class="kpi"><b>${fmt(s.avgMoisture, '%')}</b><span>Avg soil moisture</span></div>
<div class="kpi"><b>${fmt(s.avgTemperature, ' °C')}</b><span>Avg temperature</span></div>
<div class="kpi"><b>${s.totalLiters} L</b><span>Water used (${s.autoRuns} auto, ${s.manualRuns} manual)</span></div>
</div>
<p>Moisture stayed inside the ideal ${range.min}–${range.max}% band in ${s.health.inRange} of ${s.health.total} readings
(${s.health.tooDry} too dry, ${s.health.tooWet} too wet).</p>
<table><tr><th>Date</th><th>Avg moisture</th><th>Avg temp</th><th>Auto (L)</th><th>Manual (L)</th><th>Water used</th></tr>${rows}</table>
<div class="foot">Data source: ${esc(sourceLabel)}. Health score = share of readings inside the ideal moisture band.</div>
</body></html>`;
}
