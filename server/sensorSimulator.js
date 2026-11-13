const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyDTGFNS2pu8DlUVjWT91tK_E0tMK8mFaPs",
    authDomain: "plant-automation-system.firebaseapp.com",
    projectId: "plant-automation-system",
    storageBucket: "plant-automation-system.firebasestorage.app",
    messagingSenderId: "853185998955",
    appId: "1:853185998955:web:c98525f85bab49b415412e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MOISTURE_THRESHOLD = 25;
const TANK_THRESHOLD = 15;

console.log("🌱 Starting Full IoT Virtual Sensor Stream...");

setInterval(async () => {
    const moisture = Math.floor(Math.random() * (60 - 15 + 1)) + 15;
    const tank = Math.floor(Math.random() * (80 - 10 + 1)) + 10;
    const phLevel = (Math.random() * (7.8 - 5.0) + 5.0).toFixed(1);
    const light = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
    const humidity = Math.floor(Math.random() * (90 - 40 + 1)) + 40;

    console.log(`📡 Moist: ${moisture}% | Tank: ${tank}% | pH: ${phLevel} | Light: ${light}%`);

    // 1. CRITICAL RED ALERTS
    if (moisture < MOISTURE_THRESHOLD) {
        await addDoc(collection(db, 'notifications'), {
            title: "Critically Dry Soil",
            subtitle: "Balcony Zone",
            detail: `Soil moisture dropped to ${moisture}%.`,
            severity: "critical",
            action: "Water Now",
            is_read: false,
            created_at: new Date().toISOString()
        });
    }

    // 2. WARNING AMBER ALERTS
    if (phLevel < 5.5 || phLevel > 7.5) {
        await addDoc(collection(db, 'notifications'), {
            title: "pH Imbalance Detected",
            subtitle: "Nutrient Solution",
            detail: `pH level is at ${phLevel}. Ideal range is 5.5 - 6.5. Adjust fertilizer mix.`,
            severity: "warning",
            action: "Adjust pH",
            is_read: false,
            created_at: new Date().toISOString()
        });
    }

    if (light < 20) {
        await addDoc(collection(db, 'notifications'), {
            title: "Low Light Levels",
            subtitle: "Greenhouse Zone",
            detail: `Light dropped to ${light}%. Supplemental grow lights recommended.`,
            severity: "warning",
            action: "Turn on Lights",
            is_read: false,
            created_at: new Date().toISOString()
        });
    }

    // 3. SUCCESS/INFO GREEN & BLUE LOGS (Bypasses active alerts, goes straight to history)
    if (Math.random() > 0.7) {
        const events = [
            { title: "System check passed", subtitle: `All virtual sensors online (pH: ${phLevel})`, severity: "success", icon: "shield-checkmark" },
            { title: "Auto watering done", subtitle: "Balcony zone · 1.2 L used", severity: "info", icon: "water" }
        ];
        const randomEvent = events[Math.floor(Math.random() * events.length)];

        await addDoc(collection(db, 'notifications'), {
            title: randomEvent.title,
            subtitle: randomEvent.subtitle,
            detail: "Automated system log.",
            severity: randomEvent.severity,
            action: "OK",
            is_read: true, 
            created_at: new Date().toISOString()
        });
    }
}, 30000); // 30000 ms = 30 seconds