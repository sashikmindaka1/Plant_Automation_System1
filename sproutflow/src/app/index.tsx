import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MODULES = [
    { id: 1, title: '1. Auth & Zones', route: '/auth', ready: false, icon: 'person-circle-outline' },
    { id: 2, title: '2. Plant Library', route: '/plant-library', ready: false, icon: 'leaf-outline' },
    { id: 3, title: '3. My Garden (Twins)', route: '/my-garden', ready: false, icon: 'flower-outline' },
    { id: 4, title: '4. Mock Telemetry', route: '/telemetry', ready: false, icon: 'speedometer-outline' },
    { id: 5, title: '5. Auto Watering', route: '/auto-watering', ready: false, icon: 'water-outline' },
    { id: 6, title: '6. Weather & Alerts', route: '/weather-alerts', ready: true, icon: 'thunderstorm-outline' },
    { id: 7, title: '7. Symptom Checker', route: '/symptom-checker', ready: false, icon: 'medkit-outline' },
    { id: 8, title: '8. Analytics & Reports', route: '/analytics', ready: false, icon: 'bar-chart-outline' },
];

export default function TeamHub() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0F3D22" />
            <View style={styles.header}>
                <Text style={styles.brand}>SproutFlow</Text>
                <Text style={styles.sub}>8-Member Module Launcher (Dev Hub)</Text>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {MODULES.map((m) => (
                    <TouchableOpacity
                        key={m.id}
                        activeOpacity={0.85}
                        onPress={() => router.push(m.route as any)}
                        style={[styles.card, m.ready && styles.cardActive]}
                    >
                        <View style={[styles.iconBox, m.ready && styles.iconBoxActive]}>
                            <Ionicons
                                name={m.icon as any}
                                size={22}
                                color={m.ready ? '#FFFFFF' : '#64748B'}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, m.ready && styles.cardTitleActive]}>
                                {m.title}
                            </Text>
                            <Text style={styles.cardStatus}>
                                {m.ready ? 'Ready · Tap to open Module' : 'Pending teammate PR'}
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={m.ready ? '#1B5E34' : '#CBD5E1'}
                        />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F5F3' },
    header: {
        backgroundColor: '#1B5E34',
        paddingHorizontal: 20,
        paddingVertical: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    brand: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
    sub: { color: '#A7F3D0', fontSize: 13, marginTop: 4, fontWeight: '500' },
    list: { padding: 20, gap: 12 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardActive: {
        borderColor: '#2F9E5B',
        borderWidth: 2,
        backgroundColor: '#F0FDF4',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    iconBoxActive: { backgroundColor: '#2F9E5B' },
    cardTitle: { color: '#334155', fontSize: 15, fontWeight: '700' },
    cardTitleActive: { color: '#0F3D22', fontWeight: '800' },
    cardStatus: { color: '#64748B', fontSize: 12, marginTop: 2 },
});