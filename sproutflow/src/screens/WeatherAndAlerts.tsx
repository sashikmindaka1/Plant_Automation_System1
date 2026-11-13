import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    LayoutAnimation,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Firebase Imports
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../api/firebaseConfig';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = {
    green900: '#0F3D22',
    green700: '#1B5E34',
    green500: '#2F9E5B',
    green100: '#E3F4EA',
    red: '#EF4444',
    redSoft: '#FEE4E2',
    amber: '#F59E0B',
    amberSoft: '#FEF0D4',
    blue: '#3B82F6',
    blueSoft: '#E0ECFF',
    bg: '#F2F5F3',
    card: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
    faint: '#A0AEC0',
    line: '#EEF1F0',
};

// Changed id to string to support Firebase document IDs
type AlertItem = {
    id: string;
    severity: 'critical' | 'warning';
    title: string;
    subtitle: string;
    time: string;
    detail: string;
    action: string;
    is_read?: boolean; 
};

type HistoryItem = {
    id: number;
    icon: keyof typeof Ionicons.glyphMap;
    bg: string;
    color: string;
    title: string;
    msg: string;
    time: string;
};

type WeatherPreset = {
    key: 'sunny' | 'rainy' | 'heatwave';
    label: string;
    temp: string;
    condition: string;
    icon: keyof typeof Ionicons.glyphMap;
    colors: [string, string, string];
    humidity: string;
    wind: string;
    rain: string;
    evapNote: string;
};

const WEATHER_PRESETS: WeatherPreset[] = [
    {
        key: 'sunny',
        label: 'Sunny',
        temp: '37°C',
        condition: 'Super cloudy · Feels like 41°',
        icon: 'partly-sunny',
        colors: ['#FF8A6B', '#F0524F', '#D93A4A'],
        humidity: '78%',
        wind: '12 km/h',
        rain: '20%',
        evapNote: 'High evaporation (+1.5%/hr) · Extra watering advised',
    },
    {
        key: 'rainy',
        label: 'Rainy',
        temp: '25°C',
        condition: 'Monsoon showers · Cool breeze',
        icon: 'rainy',
        colors: ['#4F8FF0', '#3B6FD9', '#1E40AF'],
        humidity: '92%',
        wind: '24 km/h',
        rain: '85%',
        evapNote: 'Low evaporation (-0.5%/hr) · Auto-watering paused',
    },
    {
        key: 'heatwave',
        label: 'Heatwave',
        temp: '41°C',
        condition: 'Extreme heat · High UV index',
        icon: 'sunny',
        colors: ['#F59E0B', '#EA580C', '#B91C1C'],
        humidity: '45%',
        wind: '18 km/h',
        rain: '5%',
        evapNote: 'Critical evaporation (+2.8%/hr) · Mist boost active',
    },
];

const INITIAL_ALERTS: AlertItem[] = [
    {
        id: 'demo-1',
        severity: 'critical',
        title: 'Critical Low Moisture',
        subtitle: 'Monstera · Balcony Zone',
        time: '2 min ago',
        detail: 'Soil moisture dropped to 12%, below your 25% threshold. Watering is recommended now.',
        action: 'Water now',
    },
    {
        id: 'demo-2',
        severity: 'warning',
        title: 'Water Tank Low',
        subtitle: 'Backyard Greenhouse',
        time: '15 min ago',
        detail: 'Tank level is at 12%, below your 15% warning threshold. Refill soon to keep auto-watering running.',
        action: 'Refill tank',
    },
];

const INITIAL_HISTORY: HistoryItem[] = [
    {
        id: 101,
        icon: 'leaf',
        bg: C.green100,
        color: C.green500,
        title: 'Fertilizer completed',
        msg: 'All plant containers updated',
        time: '2h ago',
    },
    {
        id: 102,
        icon: 'water',
        bg: C.blueSoft,
        color: C.blue,
        title: 'Auto watering done',
        msg: 'Balcony zone · 1.2 L used',
        time: '5h ago',
    },
    {
        id: 103,
        icon: 'shield-checkmark',
        bg: C.green100,
        color: C.green700,
        title: 'System check passed',
        msg: 'All virtual sensors online',
        time: 'Yesterday',
    },
];

export default function WeatherAndAlerts() {
    const router = useRouter();

    const [expandedId, setExpandedId] = useState<string | null>('demo-1');
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>(INITIAL_HISTORY);
    const [weatherIdx, setWeatherIdx] = useState<number>(0);

    // Threshold Customization Modal State
    const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
    const [moistureThreshold, setMoistureThreshold] = useState<number>(25);
    const [tankThreshold, setTankThreshold] = useState<number>(15);
    const [weatherSyncEnabled, setWeatherSyncEnabled] = useState<boolean>(true);

    const currentWeather = WEATHER_PRESETS[weatherIdx];

    const stats: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
        { icon: 'water-outline', label: 'Humidity', value: currentWeather.humidity },
        { icon: 'leaf-outline', label: 'Wind', value: currentWeather.wind },
        { icon: 'rainy-outline', label: 'Rain', value: currentWeather.rain },
    ];

    // Listen to Firebase Real-time Updates
    useEffect(() => {
        const q = query(collection(db, 'notifications'), orderBy('created_at', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const liveAlerts = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as AlertItem[];
            
            // Filter unread alerts for the active view
            const unread = liveAlerts.filter(a => !a.is_read);
            setAlerts(unread.length > 0 ? unread : []);
        });

        return () => unsubscribe();
    }, []);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    const handleAction = async (item: AlertItem) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        
        // 1. Optimistically add to history
        setHistory((prev) => [
            {
                id: Date.now(),
                icon: item.severity === 'critical' ? 'water' : 'checkmark-circle',
                bg: C.green100,
                color: C.green500,
                title: `${item.action} completed`,
                msg: `${item.subtitle} · Resolved via Alert Center`,
                time: 'Just now',
            },
            ...prev,
        ]);

        // 2. Update Firestore if it's a real database alert
        if (!item.id.startsWith('demo-')) {
            try {
                const alertRef = doc(db, 'notifications', item.id);
                await updateDoc(alertRef, { is_read: true });
            } catch (error) {
                console.error("Error updating action in Firebase:", error);
            }
        } else {
            // Local fallback for demo data
            setAlerts((prev) => prev.filter((a) => a.id !== item.id));
        }
    };

    const handleDismiss = async (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        
        if (!id.startsWith('demo-')) {
            try {
                const alertRef = doc(db, 'notifications', id);
                await updateDoc(alertRef, { is_read: true });
            } catch (error) {
                console.error("Error dismissing alert in Firebase:", error);
            }
        } else {
            // Local fallback for demo data
            setAlerts((prev) => prev.filter((a) => a.id !== id));
        }
    };

    const handleClearHistory = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setHistory([]);
    };

    const handleResetDemo = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        // This will override the empty state with local data for presentation purposes
        setAlerts(INITIAL_ALERTS);
        setHistory(INITIAL_HISTORY);
        setExpandedId('demo-1');
        setSettingsVisible(false);
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* ================= HEADER ================= */}
                <LinearGradient
                    colors={[C.green500, C.green700, C.green900]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={[styles.circle, { width: 180, height: 180, top: -50, right: -50 }]} />
                    <View style={[styles.circle, { width: 110, height: 110, top: 70, left: -40 }]} />

                    <SafeAreaView edges={['top']}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity
                                style={styles.glassBtn}
                                activeOpacity={0.7}
                                onPress={handleBack}
                            >
                                <Ionicons name="chevron-back" size={22} color="#FFF" />
                            </TouchableOpacity>

                            <Text style={styles.headerTitle}>WEATHER & ALERTS</Text>

                            <TouchableOpacity
                                style={styles.glassBtn}
                                activeOpacity={0.7}
                                onPress={() => setSettingsVisible(true)}
                            >
                                <Ionicons name="options-outline" size={20} color="#FFF" />
                                {alerts.length > 0 && <View style={styles.badge} />}
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* ================= SHEET ================= */}
                <View style={styles.sheet}>
                    {/* Weather Card */}
                    <LinearGradient
                        colors={currentWeather.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.weatherCard}
                    >
                        <View style={[styles.circle, styles.cardCircle]} />

                        {/* Weather Preset Switcher Pills */}
                        <View style={styles.presetRow}>
                            {WEATHER_PRESETS.map((preset, idx) => {
                                const active = idx === weatherIdx;
                                return (
                                    <TouchableOpacity
                                        key={preset.key}
                                        activeOpacity={0.8}
                                        onPress={() => setWeatherIdx(idx)}
                                        style={[
                                            styles.presetPill,
                                            active && styles.presetPillActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.presetPillText,
                                                active && styles.presetPillTextActive,
                                            ]}
                                        >
                                            {preset.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.weatherTop}>
                            <View style={{ flex: 1 }}>
                                <View style={styles.locationRow}>
                                    <Ionicons name="location" size={14} color="#FFF" />
                                    <Text style={styles.weatherLocation}>Local Sri Lankan</Text>
                                </View>
                                <Text style={styles.weatherTemp}>{currentWeather.temp}</Text>
                                <Text style={styles.weatherCondition}>
                                    {currentWeather.condition}
                                </Text>
                            </View>
                            <Ionicons name={currentWeather.icon} size={76} color="#FFF" />
                        </View>

                        {/* Smart Care Tip Banner */}
                        <View style={styles.careTipBox}>
                            <Ionicons name="sparkles" size={14} color="#FFF" />
                            <Text style={styles.careTipText}>{currentWeather.evapNote}</Text>
                        </View>

                        <View style={styles.statsRow}>
                            {stats.map((s) => (
                                <View key={s.label} style={styles.statPill}>
                                    <Ionicons name={s.icon} size={16} color="#FFF" />
                                    <View style={{ marginLeft: 6 }}>
                                        <Text style={styles.statValue}>{s.value}</Text>
                                        <Text style={styles.statLabel}>{s.label}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </LinearGradient>

                    {/* Active Alerts Header */}
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Active Alerts</Text>
                        <View style={styles.RowRight}>
                            <TouchableOpacity
                                onPress={() => setSettingsVisible(true)}
                                style={styles.thresholdChip}
                            >
                                <Ionicons name="sliders-outline" size={13} color={C.green700} />
                                <Text style={styles.thresholdChipText}>
                                    {'<'} {moistureThreshold}% / {tankThreshold}%
                                </Text>
                            </TouchableOpacity>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{alerts.length}</Text>
                            </View>
                        </View>
                    </View>

                    {alerts.length === 0 ? (
                        <View style={styles.emptyAlertCard}>
                            <Ionicons name="checkmark-done-circle" size={36} color={C.green500} />
                            <Text style={styles.emptyAlertTitle}>All Plants Healthy!</Text>
                            <Text style={styles.emptyAlertSub}>
                                Soil moisture and virtual tank levels are above your warning thresholds.
                            </Text>
                            <TouchableOpacity onPress={handleResetDemo} style={styles.restoreBtn}>
                                <Text style={styles.restoreBtnText}>Simulate Demo Alerts</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        alerts.map((a) => {
                            const open = expandedId === a.id;
                            const critical = a.severity === 'critical';
                            const accent = critical ? C.red : C.amber;
                            const soft = critical ? C.redSoft : C.amberSoft;

                            return (
                                <TouchableOpacity
                                    key={a.id}
                                    activeOpacity={0.92}
                                    onPress={() => toggleExpand(a.id)}
                                    style={styles.alertCard}
                                >
                                    <View style={[styles.accentBar, { backgroundColor: accent }]} />

                                    <View style={styles.alertBody}>
                                        <View style={styles.alertTop}>
                                            <View style={[styles.alertIcon, { backgroundColor: soft }]}>
                                                <Ionicons
                                                    name={critical ? 'warning' : 'water'}
                                                    size={22}
                                                    color={accent}
                                                />
                                            </View>

                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.alertTitle}>{a.title}</Text>
                                                <Text style={styles.alertSub}>{a.subtitle}</Text>
                                            </View>

                                            <View style={{ alignItems: 'flex-end' }}>
                                                <View style={[styles.chip, { backgroundColor: soft }]}>
                                                    <Text style={[styles.chipText, { color: accent }]}>
                                                        {critical ? 'CRITICAL' : 'WARNING'}
                                                    </Text>
                                                </View>
                                                <Text style={styles.alertTime}>{a.time}</Text>
                                            </View>
                                        </View>

                                        {open && (
                                            <View style={styles.expanded}>
                                                <Text style={styles.detailText}>{a.detail}</Text>
                                                <View style={styles.btnRow}>
                                                    <TouchableOpacity
                                                        activeOpacity={0.85}
                                                        onPress={() => handleAction(a)}
                                                        style={[
                                                            styles.primaryBtn,
                                                            { backgroundColor: accent },
                                                        ]}
                                                    >
                                                        <Ionicons name="water" size={16} color="#FFF" />
                                                        <Text style={styles.primaryBtnText}>
                                                            {a.action}
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        activeOpacity={0.85}
                                                        onPress={() => handleDismiss(a.id)}
                                                        style={styles.ghostBtn}
                                                    >
                                                        <Text style={styles.ghostBtnText}>Dismiss</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}

                    {/* Notification History */}
                    <View style={[styles.sectionRow, { marginTop: 22 }]}>
                        <Text style={styles.sectionTitle}>Notification History</Text>
                        {history.length > 0 && (
                            <TouchableOpacity onPress={handleClearHistory}>
                                <Text style={styles.seeAll}>Clear all</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.historyCard}>
                        {history.length === 0 ? (
                            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                                <Text style={{ color: C.muted, fontSize: 13 }}>
                                    No recent history logs.
                                </Text>
                            </View>
                        ) : (
                            history.map((h, i) => (
                                <View key={h.id}>
                                    <View style={styles.historyRow}>
                                        <View style={[styles.historyIcon, { backgroundColor: h.bg }]}>
                                            <Ionicons name={h.icon} size={20} color={h.color} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.historyTitle}>{h.title}</Text>
                                            <Text style={styles.historyMsg}>{h.msg}</Text>
                                        </View>
                                        <Text style={styles.historyTime}>{h.time}</Text>
                                    </View>
                                    {i < history.length - 1 && <View style={styles.divider} />}
                                </View>
                            ))
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>

            {/* ================= THRESHOLD CUSTOMIZATION MODAL ================= */}
            <Modal
                visible={settingsVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setSettingsVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Alert Threshold Settings</Text>
                            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                                <Ionicons name="close-circle" size={26} color={C.muted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>
                            Critical Soil Moisture Alert: Below {moistureThreshold}%
                        </Text>
                        <View style={styles.stepperRow}>
                            {[15, 20, 25, 30, 35].map((val) => (
                                <TouchableOpacity
                                    key={val}
                                    onPress={() => setMoistureThreshold(val)}
                                    style={[
                                        styles.stepBtn,
                                        moistureThreshold === val && styles.stepBtnActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.stepBtnText,
                                            moistureThreshold === val && styles.stepBtnTextActive,
                                        ]}
                                    >
                                        {val}%
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.modalLabel}>
                            Low Water Tank Warning: Below {tankThreshold}%
                        </Text>
                        <View style={styles.stepperRow}>
                            {[10, 15, 20, 25, 30].map((val) => (
                                <TouchableOpacity
                                    key={val}
                                    onPress={() => setTankThreshold(val)}
                                    style={[
                                        styles.stepBtn,
                                        tankThreshold === val && styles.stepBtnActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.stepBtnText,
                                            tankThreshold === val && styles.stepBtnTextActive,
                                        ]}
                                    >
                                        {val}%
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.switchTitle}>Smart Weather Evaporation Sync</Text>
                                <Text style={styles.switchSub}>
                                    Automatically adjust moisture decay based on live Sri Lankan weather
                                </Text>
                            </View>
                            <Switch
                                value={weatherSyncEnabled}
                                onValueChange={setWeatherSyncEnabled}
                                trackColor={{ false: '#CBD5E1', true: C.green500 }}
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                onPress={handleResetDemo}
                                style={styles.resetModalBtn}
                            >
                                <Text style={styles.resetModalBtnText}>Reset Demo Data</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setSettingsVisible(false)}
                                style={styles.saveModalBtn}
                            >
                                <Text style={styles.saveModalBtnText}>Save Thresholds</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    /* Header */
    header: { paddingHorizontal: 20, paddingBottom: 130, overflow: 'hidden' },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    glassBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 9,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF5C5C',
        borderWidth: 1.5,
        borderColor: '#2A7A47',
    },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1.2 },

    /* Sheet */
    sheet: {
        backgroundColor: C.bg,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32,
        paddingHorizontal: 20,
    },

    /* Weather card */
    weatherCard: {
        marginTop: -96,
        borderRadius: 28,
        padding: 20,
        overflow: 'hidden',
        shadowColor: '#D93A4A',
        shadowOpacity: 0.3,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
    },
    cardCircle: {
        width: 200,
        height: 200,
        right: -60,
        top: -70,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    presetRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    presetPill: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    presetPillActive: {
        backgroundColor: '#FFFFFF',
    },
    presetPillText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    presetPillTextActive: {
        color: C.text,
    },
    weatherTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    weatherLocation: { color: '#FFF', fontSize: 14, fontWeight: '600', opacity: 0.95 },
    weatherTemp: {
        color: '#FFF',
        fontSize: 54,
        fontWeight: '800',
        letterSpacing: -1,
        marginTop: 2,
    },
    weatherCondition: { color: '#FFF', fontSize: 13, opacity: 0.92 },
    careTipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.16)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        marginTop: 12,
    },
    careTipText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    statsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    statPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    statValue: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    statLabel: { color: '#FFF', fontSize: 10, opacity: 0.85 },

    /* Section headers */
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 26,
        marginBottom: 14,
    },
    RowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    thresholdChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: C.green100,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    thresholdChipText: {
        color: C.green700,
        fontSize: 11,
        fontWeight: '700',
    },
    sectionTitle: { color: C.text, fontSize: 20, fontWeight: '800' },
    countBadge: {
        backgroundColor: C.red,
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 7,
    },
    countText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
    seeAll: { color: C.green500, fontSize: 14, fontWeight: '700' },

    /* Empty Alert State */
    emptyAlertCard: {
        backgroundColor: C.card,
        borderRadius: 22,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#0F172A',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    emptyAlertTitle: {
        color: C.text,
        fontSize: 16,
        fontWeight: '800',
        marginTop: 8,
    },
    emptyAlertSub: {
        color: C.muted,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 18,
    },
    restoreBtn: {
        marginTop: 14,
        backgroundColor: C.green100,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    restoreBtnText: {
        color: C.green700,
        fontSize: 12,
        fontWeight: '700',
    },

    /* Alerts */
    alertCard: {
        flexDirection: 'row',
        backgroundColor: C.card,
        borderRadius: 22,
        marginBottom: 14,
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    accentBar: { width: 5 },
    alertBody: { flex: 1, padding: 14 },
    alertTop: { flexDirection: 'row', alignItems: 'center' },
    alertIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    alertTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
    alertSub: { color: C.muted, fontSize: 12, marginTop: 2 },
    chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    chipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
    alertTime: { color: C.faint, fontSize: 11, marginTop: 6 },

    expanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.line },
    detailText: { color: C.muted, fontSize: 13, lineHeight: 19 },
    btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
    primaryBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 11,
        borderRadius: 12,
    },
    primaryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    ghostBtn: {
        paddingHorizontal: 20,
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: C.bg,
    },
    ghostBtnText: { color: C.muted, fontSize: 13, fontWeight: '700' },

    /* History */
    historyCard: {
        backgroundColor: C.card,
        borderRadius: 22,
        paddingHorizontal: 14,
        shadowColor: '#0F172A',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    historyIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyTitle: { color: C.text, fontSize: 14, fontWeight: '700' },
    historyMsg: { color: C.muted, fontSize: 12, marginTop: 2 },
    historyTime: { color: C.faint, fontSize: 11 },
    divider: { height: 1, backgroundColor: C.line, marginLeft: 56 },

    /* Modal */
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: C.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 22,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    modalTitle: {
        color: C.text,
        fontSize: 18,
        fontWeight: '800',
    },
    modalLabel: {
        color: C.text,
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        marginTop: 8,
    },
    stepperRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    stepBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: C.bg,
        alignItems: 'center',
    },
    stepBtnActive: {
        backgroundColor: C.green500,
    },
    stepBtnText: {
        color: C.muted,
        fontWeight: '700',
        fontSize: 13,
    },
    stepBtnTextActive: {
        color: '#FFFFFF',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.bg,
        padding: 14,
        borderRadius: 16,
        marginTop: 8,
        marginBottom: 20,
    },
    switchTitle: {
        color: C.text,
        fontSize: 14,
        fontWeight: '700',
    },
    switchSub: {
        color: C.muted,
        fontSize: 11,
        marginTop: 2,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
    },
    resetModalBtn: {
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: C.bg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resetModalBtnText: {
        color: C.muted,
        fontWeight: '700',
        fontSize: 13,
    },
    saveModalBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 14,
        backgroundColor: C.green700,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveModalBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
    },
});