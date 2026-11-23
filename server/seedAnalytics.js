// Module 8: seeds 30 days of sensor history and pump logs into Firestore so the
// Analytics screen shows real Firestore data before Modules 4 and 5 write their own.
//
// Run from the repo root (Node 20.6+ for --env-file):
//   node --env-file=sproutflow/.env server/seedAnalytics.js
//   node --env-file=sproutflow/.env server/seedAnalytics.js --days 7
//
// Every document gets `seedTag: "m8-seed"` so it can be found and removed later.

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch } = require('firebase/firestore');

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missing = Object.entries(config).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error(`Missing Firebase settings: ${missing.join(', ')}`);
  console.error('Create sproutflow/.env with the EXPO_PUBLIC_FIREBASE_* values and run with --env-file.');
  process.exit(1);
}

const argDays = process.argv.indexOf('--days');
const DAYS = argDays > -1 ? Number(process.argv[argDays + 1]) : 30;
if (!Number.isInteger(DAYS) || DAYS < 1 || DAYS > 60) {
  console.error('--days must be an integer between 1 and 60');
  process.exit(1);
}

const PLANTS = [
  { plantId: 'plant_104', plantNickname: 'Balcony Monstera', start: 62 },
  { plantId: 'plant_105', plantNickname: 'Kitchen Basil', start: 48 },
  { plantId: 'plant_106', plantNickname: 'Living Room Snake Plant', start: 74 },
];
const TICK_HOURS = 2;
const AUTO_THRESHOLD = 30; // Module 5 rule: water when moisture < 30%
const REFILL_TO = 85; // Module 5 rule: pump boosts moisture to 85%
const MANUAL_CHANCE = 0.03; // chance per reading that someone waters by hand
const SEED_TAG = 'm8-seed';
const BATCH_LIMIT = 450; // Firestore allows 500 writes per batch

function generate(days, now) {
  const readings = [];
  const logs = [];
  const end = new Date(now);
  end.setMinutes(0, 0, 0);
  const ticks = Math.floor((days * 24) / TICK_HOURS);

  for (const p of PLANTS) {
    let moisture = p.start;
    let tank = 90;
    for (let i = ticks; i >= 0; i--) {
      const t = new Date(end.getTime() - i * TICK_HOURS * 3600e3);
      const hour = t.getHours();
      moisture = Math.max(5, moisture - (1 + Math.random() + (hour >= 11 && hour <= 16 ? 0.8 : 0)));

      const dayN = Math.floor(t.getTime() / 864e5);
      const drift = 2.5 * Math.sin(dayN * 0.9) + 1.5 * Math.sin(dayN * 0.37);
      const temp = 27 + drift + 3.5 * Math.sin(((hour - 9) / 24) * 2 * Math.PI) + (Math.random() - 0.5) * 1.2;
      const humDrift = 9 * Math.sin(dayN * 0.8 + 1.3) + 4 * Math.sin(dayN * 2.1);
      const humidity = 63 + humDrift + 6 * Math.cos(((hour - 4) / 24) * 2 * Math.PI) + (Math.random() - 0.5) * 8;
      readings.push({
        plantId: p.plantId,
        plantNickname: p.plantNickname,
        recordedAt: t.toISOString(),
        soilMoisturePercent: Math.round(moisture * 10) / 10,
        temperatureCelsius: Math.round(temp * 10) / 10,
        humidityPercent: Math.round(Math.min(98, Math.max(20, humidity))),
        lightLux: hour >= 7 && hour <= 18 ? Math.round(600 + Math.random() * 500) : Math.round(Math.random() * 40),
        waterTankLevelPercent: tank,
        seedTag: SEED_TAG,
      });

      let log = null;
      if (moisture < AUTO_THRESHOLD && tank >= 10) {
        log = { trigger: 'auto', litersUsed: Math.round((0.8 + Math.random() * 0.6) * 10) / 10 };
      } else if (Math.random() < MANUAL_CHANCE && tank >= 10) {
        log = { trigger: 'manual', litersUsed: Math.round((0.5 + Math.random() * 0.7) * 10) / 10 };
      }
      if (log) {
        logs.push({ plantId: p.plantId, wateredAt: t.toISOString(), ...log, seedTag: SEED_TAG });
        moisture = REFILL_TO;
        tank -= 10;
      }
      if (tank < 20) tank = 95;
    }
  }
  return { readings, logs };
}

async function writeAll(db, name, docs) {
  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const d of docs.slice(i, i + BATCH_LIMIT)) batch.set(doc(collection(db, name)), d);
    await batch.commit();
    console.log(`  ${name}: ${Math.min(i + BATCH_LIMIT, docs.length)}/${docs.length}`);
  }
}

(async () => {
  const db = getFirestore(initializeApp(config));
  const { readings, logs } = generate(DAYS, new Date());
  console.log(`Seeding ${DAYS} days: ${readings.length} readings, ${logs.length} watering logs`);
  await writeAll(db, 'sensor_reading_history', readings);
  await writeAll(db, 'watering_logs', logs);
  console.log('Done.');
  process.exit(0);
})().catch((e) => {
  console.error('Seed failed:', e.message || e);
  console.error('If this is "permission-denied", the Firestore security rules block writes to these collections.');
  process.exit(1);
});
