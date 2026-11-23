import type { MoistureRange } from './types';

/** Firestore collection names (report section 2: Members 4, 5 and 8). Confirm with Module 4 and 5. */
export const ANALYTICS_COLLECTIONS = {
  readings: 'sensor_reading_history',
  watering: 'watering_logs',
} as const;

/**
 * Ideal soil-moisture band used for the Garden Health Score.
 * Source: the example in the team report (minMoisture 30%, maxMoisture 80%).
 * Replace with per-species thresholds from Module 2 (`plant_species`) once that API exists.
 */
export const DEFAULT_MOISTURE_RANGE: MoistureRange = { min: 30, max: 80 };

/**
 * Where the Analytics screen reads its history from.
 * 'demo'      — generated history only; no Firebase calls (for UI testing without Firebase).
 * 'firestore' — Firestore first, demo data only when the collections are empty or unreachable
 *               (current setting; needs the team's Firebase settings in sproutflow/.env).
 */
export const ANALYTICS_DATA_SOURCE: 'demo' | 'firestore' = 'firestore';

/** Upper bound on documents read per collection, newest first. */
export const MAX_DOCS_PER_QUERY = 10000;

/** Days always fetched; the 7-day view is cut from this so the monthly export needs no second fetch. */
export const FETCH_DAYS = 30;

/** Plausibility limits used to drop corrupt readings. */
export const READING_LIMITS = {
  moisture: { min: 0, max: 100 },
  temperature: { min: -20, max: 70 },
  liters: { min: 0, max: 100 },
} as const;

/** Palette taken from the Module 8 design mockups (Symptom Checker and Analytics screens). */
export const AnalyticsColors = {
  // Header gradient, dark forest green from top-left to bottom-right.
  headerFrom: '#133823',
  headerMid: '#1E5033',
  headerTo: '#2E6B47',
  // Brand green: Export Options button, outline button, dropdown pill text.
  primary: '#2D6A45',
  primaryDark: '#1B4A2F',
  primarySoft: '#E4ECE7',
  primaryTint: '#E3F0E7',
  primaryBorder: '#D0E4D6',
  // Chart series.
  green: '#3E8C5B',
  blue: '#5B9BD6',
  red: '#D9483F',
  // Status colours.
  success: '#3A9A5C',
  danger: '#E0483F',
  treat: '#E5534A',
  redSoft: '#FBE3E3',
  amber: '#D9922E',
  amberSoft: '#FBEFD9',
  // Surfaces and text.
  bg: '#EEF2EF',
  card: '#FFFFFF',
  border: '#E1E8E3',
  text: '#17241C',
  muted: '#5F6E65',
  faint: '#98A49D',
  grid: '#E7ECE9',
  track: '#D3E4D8',
  onPrimary: '#FFFFFF',
} as const;

export const cardShadow = {
  shadowColor: '#0F2A1B',
  shadowOpacity: 0.07,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
