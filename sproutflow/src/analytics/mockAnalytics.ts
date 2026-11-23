// Demo history used when Firestore has no data yet (or cannot be reached).
// It follows the report's simulation rules: moisture drops 1–2% per tick, and the
// Module 5 rule waters the plant (moisture back to 85%) when it falls below 30%.
// Deterministic: the same `now` always gives the same history.

import type { SensorReading, WateringLog } from './types';

const DEMO_PLANTS = [
  { plantId: 'plant_104', plantNickname: 'Balcony Monstera', start: 62 },
  { plantId: 'plant_105', plantNickname: 'Kitchen Basil', start: 48 },
  { plantId: 'plant_106', plantNickname: 'Living Room Snake Plant', start: 74 },
];

const TICK_HOURS = 2;
const AUTO_THRESHOLD = 30;
const REFILL_TO = 85;
/** Chance per reading that someone waters the plant by hand (red bars in Water Usage). */
const MANUAL_CHANCE = 0.03;

/** Small seeded PRNG (mulberry32) so demo charts don't jump on every refresh. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateDemoHistory(days: number, now: Date): { readings: SensorReading[]; logs: WateringLog[] } {
  const readings: SensorReading[] = [];
  const logs: WateringLog[] = [];
  const end = new Date(now);
  end.setMinutes(0, 0, 0);
  const ticks = Math.floor((days * 24) / TICK_HOURS);
  const dayIndex = Math.floor(end.getTime() / 864e5);

  DEMO_PLANTS.forEach((p, pi) => {
    const rand = rng(dayIndex * 31 + pi * 7919);
    let moisture = p.start;
    let tank = 90;
    for (let i = ticks; i >= 0; i--) {
      const t = new Date(end.getTime() - i * TICK_HOURS * 3600e3);
      const hour = t.getHours();
      // Faster evaporation in the afternoon heat.
      const drop = 1 + rand() + (hour >= 11 && hour <= 16 ? 0.8 : 0);
      moisture = Math.max(5, moisture - drop);

      // Daily weather drift so the temperature trend is not flat.
      const dayN = Math.floor(t.getTime() / 864e5);
      const drift = 2.5 * Math.sin(dayN * 0.9) + 1.5 * Math.sin(dayN * 0.37);
      const temp = 27 + drift + 3.5 * Math.sin(((hour - 9) / 24) * 2 * Math.PI) + (rand() - 0.5) * 1.2;
      // Air humidity: its own daily weather drift plus a night-time rise, so the trend line moves day to day.
      const humDrift = 9 * Math.sin(dayN * 0.8 + 1.3) + 4 * Math.sin(dayN * 2.1);
      const humidity = 63 + humDrift + 6 * Math.cos(((hour - 4) / 24) * 2 * Math.PI) + (rand() - 0.5) * 8;
      readings.push({
        plantId: p.plantId,
        plantNickname: p.plantNickname,
        recordedAt: t.toISOString(),
        soilMoisturePercent: Math.round(moisture * 10) / 10,
        temperatureCelsius: Math.round(temp * 10) / 10,
        humidityPercent: Math.round(Math.min(98, Math.max(20, humidity))),
        lightLux: hour >= 7 && hour <= 18 ? Math.round(600 + rand() * 500) : Math.round(rand() * 40),
        waterTankLevelPercent: tank,
      });

      // Module 5 rule fires after the low reading is logged; the next reading shows the refill.
      let watered: WateringLog | null = null;
      if (moisture < AUTO_THRESHOLD && tank >= 10) {
        watered = { plantId: p.plantId, wateredAt: t.toISOString(), litersUsed: Math.round((0.8 + rand() * 0.6) * 10) / 10, trigger: 'auto' };
      } else if (rand() < MANUAL_CHANCE && tank >= 10) {
        watered = { plantId: p.plantId, wateredAt: t.toISOString(), litersUsed: Math.round((0.5 + rand() * 0.7) * 10) / 10, trigger: 'manual' };
      }
      if (watered) {
        logs.push(watered);
        moisture = REFILL_TO;
        tank -= 10;
      }
      if (tank < 20) tank = 95; // someone refills the virtual tank
    }
  });
  return { readings, logs };
}
