// Module 8 data shapes. Field names follow the team's shared Mock Telemetry contract
// (report section 3). Confirm the two Firestore collections below with Module 4 and Module 5.

/** One periodic reading, written by Module 4 into `sensor_reading_history`. */
export type SensorReading = {
  plantId: string;
  plantNickname?: string;
  /** ISO 8601 UTC timestamp, e.g. "2026-11-10T22:15:00Z". */
  recordedAt: string;
  soilMoisturePercent: number;
  temperatureCelsius: number;
  humidityPercent?: number;
  lightLux?: number;
  waterTankLevelPercent?: number;
};

/** One virtual pump run, written by Module 5 into `watering_logs`. */
export type WateringLog = {
  plantId: string;
  /** ISO 8601 UTC timestamp. */
  wateredAt: string;
  litersUsed: number;
  trigger: 'auto' | 'manual';
};

export type RangeDays = 7 | 30;

export type DailyPoint = {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  label: string;
  /** Average for the day, or null when there were no readings that day. */
  moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  readings: number;
};

export type DailyWater = {
  date: string;
  label: string;
  autoLiters: number;
  manualLiters: number;
  runs: number;
};

export type HealthScore = {
  /** 0–100, or null when there are no readings. */
  score: number | null;
  total: number;
  inRange: number;
  tooDry: number;
  tooWet: number;
};

export type MoistureRange = { min: number; max: number };

export type AnalyticsSummary = {
  days: RangeDays;
  daily: DailyPoint[];
  water: DailyWater[];
  health: HealthScore;
  avgMoisture: number | null;
  avgTemperature: number | null;
  totalLiters: number;
  autoRuns: number;
  manualRuns: number;
  plantCount: number;
};

export type DataSource = 'firestore' | 'demo';

export type AnalyticsDataset = {
  readings: SensorReading[];
  logs: WateringLog[];
  source: DataSource;
  /** Set when Firestore could not be read and demo data is shown instead. */
  notice?: string;
  /** True when the query hit its document limit, so the oldest days may be incomplete. */
  truncated: boolean;
  loadedAt: Date;
};
