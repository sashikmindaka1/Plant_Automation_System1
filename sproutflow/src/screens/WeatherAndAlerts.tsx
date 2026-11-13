import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

type AlertItem = {
    id: string;
    severity: 'critical' | 'warning' | 'success' | 'info';
    title: string;
    subtitle: string;
    time?: string;
    detail: string;
    action: string;
    is_read: boolean;
    created_at?: string;
};

/* ================= LIVE WEATHER HELPERS ================= */

type LiveWeather = {
    temp: number;
    feelsLike: number;
    humidity: number;
    wind: number;
    rainChance: number;
    precipitation: number;
    code: number;
    isDay: boolean;
};

type ThemeKey = 'sunny' | 'cloudy' | 'rainy' | 'heatwave';

const COLOMBO = { latitude: 6.9271, longitude: 79.8612, name: 'Colombo' };

const THEMES: Record<ThemeKey, [string, string, string]> = {
    sunny: ['#FFB347', '#F0824F', '#D9573A'],
    cloudy: ['#8FA3B8', '#64798F', '#43566B'],
    rainy: ['#4F8FF0', '#3B6FD9', '#1E40AF'],
    heatwave: ['#F59E0B', '#EA580C', '#B91C1C'],
};

const TAB_LABEL: Record<ThemeKey, string> = {
    sunny: 'Sunny',
    cloudy: 'Cloudy',
    rainy: 'Rainy',
    heatwave: 'Heatwave',
};

// WMO weather codes -> text + icon
function describeCode(
    code: number,
    isDay: boolean
): { text: string; icon: keyof typeof Ionicons.glyphMap } {
    if (code === 0) return { text: 'Clear sky', icon: isDay ? 'sunny' : 'moon' };
    if (code === 1) return { text: 'Mainly clear', icon: isDay ? 'sunny' : 'moon' };
    if (code === 2) return { text: 'Partly cloudy', icon: isDay ? 'partly-sunny' : 'cloudy-night' };
    if (code === 3) return { text: 'Overcast', icon: 'cloud' };
    if (code === 45 || code === 48) return { text: 'Foggy', icon: 'cloud' };
    if (code >= 51 && code <= 57) return { text: 'Light drizzle', icon: 'rainy' };
    if (code >= 61 && code <= 67) return { text: 'Rain showers', icon: 'rainy' };
    if (code >= 80 && code <= 82) return { text: 'Heavy showers', icon: 'rainy' };
    if (code >= 95) return { text: 'Thunderstorm', icon: 'thunderstorm' };
    return { text: 'Mixed conditions', icon: 'cloud' };
}

function pickTheme(w: LiveWeather): ThemeKey {
    const rainy =
        (w.code >= 51 && w.code <= 67) ||
        (w.code >= 80 && w.code <= 82) ||
        w.code >= 95 ||
        w.precipitation > 0.2;
    if (rainy) return 'rainy';
    if (w.temp >= 36 || w.feelsLike >= 40) return 'heatwave'; // tuned for Sri Lanka humidity
    if (w.code >= 2) return 'cloudy';
    return 'sunny';
}

function evapNote(w: LiveWeather, theme: ThemeKey): string {
    if (theme === 'rainy') return 'Low evaporation · Auto-watering paused';
    if (theme === 'heatwave') return 'Critical evaporation · Mist boost advised';
    if (w.temp >= 32) return 'High evaporation · Extra watering advised';
    if (w.humidity > 85) return 'Slow evaporation · Water less often';
    return 'Normal evaporation · Standard schedule';
}

/* ================= COMPONENT ================= */

export default function WeatherAndAlerts() {
    const router = useRouter();

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [history, setHistory] = useState<AlertItem[]>([]);

    // Live weather state
    const [weather, setWeather] = useState<LiveWeather | null>(null);
    const [placeName, setPlaceName] = useState<string>('Locating…');
    const [weatherError, setWeatherError] = useState<boolean>(false);

    // Threshold Customization Modal State
    const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
    const [moistureThreshold, setMoistureThreshold] = useState<number>(25);
    const [tankThreshold, setTankThreshold] = useState<number>(15);
    const [weatherSyncEnabled, setWeatherSyncEnabled] = useState<boolean>(true);

    // Fetch real weather from Open-Meteo (free, no API key)
    const fetchWeather = useCallback(async () => {
        try {
            let coords: { latitude: number; longitude: number; name: string } = { ...COLOMBO };

            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const pos =
                        (await Location.getLastKnownPositionAsync()) ??
                        (await Location.getCurrentPositionAsync({}));
                    if (pos) {
                        coords.latitude = pos.coords.latitude;
                        coords.longitude = pos.coords.longitude;
                        const [geo] = await Location.reverseGeocodeAsync(pos.coords);
                        coords.name =
                            geo?.city || geo?.subregion || geo?.region || 'Your location';
                    }
                }
            } catch (locErr) {
                // Fall back to Colombo if location fails
                console.warn('Location unavailable, using Colombo:', locErr);
            }

            setPlaceName(coords.name);

            const url =
                `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}` +
                `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day` +
                `&daily=precipitation_probability_max&timezone=auto&forecast_days=1`;

            const res = await fetch(url);
            const json = await res.json();
            const c = json.current;

            setWeather({
                temp: Math.round(c.temperature_2m),
                feelsLike: Math.round(c.apparent_temperature),
                humidity: Math.round(c.relative_humidity_2m),
                wind: Math.round(c.wind_speed_10m),
                rainChance: json.daily?.precipitation_probability_max?.[0] ?? 0,
                precipitation: c.precipitation ?? 0,
                code: c.weather_code,
                isDay: c.is_day === 1,
            });
            setWeatherError(false);
        } catch (e) {
            console.error('Weather fetch failed:', e);
            setWeatherError(true);
        }
    }, []);

    useEffect(() => {
        fetchWeather();
        const t = setInterval(fetchWeather, 10 * 60 * 1000); // refresh every 10 min
        return () => clearInterval(t);
    }, [fetchWeather]);

    // Derived values for the weather card
    const theme: ThemeKey = weather ? pickTheme(weather) : 'sunny';
    const desc: { text: string; icon: keyof typeof Ionicons.glyphMap } = weather
        ? describeCode(weather.code, weather.isDay)
        : { text: '', icon: 'partly-sunny' };

    const stats: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
        { icon: 'water-outline', label: 'Humidity', value: weather ? `${weather.humidity}%` : '--' },
        { icon: 'leaf-outline', label: 'Wind', value: weather ? `${weather.wind} km/h` : '--' },
        { icon: 'rainy-outline', label: 'Rain', value: weather ? `${weather.rainChance}%` : '--' },
    ];

    // Listen to Firebase Real-time Updates
    useEffect(() => {
        const q = query(collection(db, 'notifications'), orderBy('created_at', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const liveAlerts = snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            })) as AlertItem[];

            // Filter unread alerts for the active view, read alerts for history
            setAlerts(liveAlerts.filter((a) => !a.is_read));
            setHistory(liveAlerts.filter((a) => a.is_read));
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
        try {
            const alertRef = doc(db, 'notifications', item.id);
            await updateDoc(alertRef, { is_read: true });
        } catch (error) {
            console.error('Error updating action in Firebase:', error);
        }
    };

    const handleDismiss = async (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        try {
            const alertRef = doc(db, 'notifications', id);
            await updateDoc(alertRef, { is_read: true });
        } catch (error) {
            console.error('Error dismissing alert in Firebase:', error);
        }
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
                    {/* Live Weather Card */}
                    <LinearGradient
                        colors={THEMES[theme]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.weatherCard}
                    >
                        <View style={[styles.circle, styles.cardCircle]} />

                        {/* Auto-detected status pill */}
                        <View style={styles.presetRow}>
                            <View style={[styles.presetPill, styles.presetPillActive]}>
                                <Text style={[styles.presetPillText, styles.presetPillTextActive]}>
                                    {TAB_LABEL[theme]} · Live
                                </Text>
                            </View>
                        </View>

                        <View style={styles.weatherTop}>
                            <View style={{ flex: 1 }}>
                                <View style={styles.locationRow}>
                                    <Ionicons name="location" size={14} color="#FFF" />
                                    <Text style={styles.weatherLocation}>{placeName}</Text>
                                </View>
                                <Text style={styles.weatherTemp}>
                                    {weather ? `${weather.temp}°C` : '--°C'}
                                </Text>
                                <Text style={styles.weatherCondition}>
                                    {weatherError
                                        ? 'Weather unavailable · Check connection'
                                        : weather
                                        ? `${desc.text} · Feels like ${weather.feelsLike}°`
                                        : 'Loading…'}
                                </Text>
                            </View>
                            <Ionicons name={desc.icon} size={76} color="#FFF" />
                        </View>

                        {/* Smart Care Tip Banner */}
                        {weather && (
                            <View style={styles.careTipBox}>
                                <Ionicons name="sparkles" size={14} color="#FFF" />
                                <Text style={styles.careTipText}>{evapNote(weather, theme)}</Text>
                            </View>
                        )}

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
                                <Ionicons name="options-outline" size={13} color={C.green700} />
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
                                                <Text style={styles.alertTime}>{a.time || 'Just now'}</Text>
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
                    </View>

                    <View style={styles.historyCard}>
                        {history.length === 0 ? (
                            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                                <Text style={{ color: C.muted, fontSize: 13 }}>
                                    No recent history logs.
                                </Text>
                            </View>
                        ) : (
                            history.map((h, i) => {
                                // Dynamic styling based on severity
                                let accent = C.amber;
                                let soft = C.amberSoft;
                                let iconName: keyof typeof Ionicons.glyphMap = 'notifications';

                                if (h.severity === 'critical') {
                                    accent = C.red;
                                    soft = C.redSoft;
                                    iconName = 'warning';
                                } else if (h.severity === 'warning') {
                                    accent = C.amber;
                                    soft = C.amberSoft;
                                    iconName = 'alert-circle';
                                } else if (h.severity === 'success') {
                                    accent = C.green700;
                                    soft = C.green100;
                                    iconName = 'shield-checkmark';
                                } else if (h.severity === 'info') {
                                    accent = C.blue;
                                    soft = C.blueSoft;
                                    iconName = 'water';
                                }

                                return (
                                    <View key={h.id}>
                                        <View style={styles.historyRow}>
                                            <View style={[styles.historyIcon, { backgroundColor: soft }]}>
                                                <Ionicons name={iconName} size={20} color={accent} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.historyTitle}>{h.title}</Text>
                                                <Text style={styles.historyMsg}>{h.subtitle}</Text>
                                            </View>
                                        </View>
                                        {i < history.length - 1 && <View style={styles.divider} />}
                                    </View>
                                );
                            })
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
                                onPress={() => setSettingsVisible(false)}
                                style={styles.saveModalBtn}
                            >
                                <Text style={styles.saveModalBtnText}>Save Thresholds & Close</Text>
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
        shadowColor: '#000',
        shadowOpacity: 0.25,
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