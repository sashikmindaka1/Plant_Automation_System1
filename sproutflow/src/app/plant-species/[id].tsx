import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSpeciesById, PlantSpecies } from '../../api/speciesApi';

export default function PlantSpeciesDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [species, setSpecies] = useState<PlantSpecies | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getSpeciesById(id)
      .then((value) => {
        if (active) setSpecies(value);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error ? requestError.message : 'Could not load this species.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  const thresholdCard = (
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    min: number,
    max: number,
    unit: string,
    color: string,
    backgroundColor: string
  ) => (
    <View style={styles.thresholdCard}>
      <View style={[styles.thresholdIcon, { backgroundColor }]}>
        <Ionicons name={icon} size={21} color={color} />
      </View>
      <View style={styles.thresholdContent}>
        <Text style={styles.thresholdLabel}>{label}</Text>
        <Text style={styles.thresholdRange}>
          {min}–{max}
          <Text style={styles.thresholdUnit}> {unit}</Text>
        </Text>
      </View>
      <View style={styles.minMaxLabels}>
        <Text style={styles.minMax}>MIN</Text>
        <Text style={styles.minMax}>MAX</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={21} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Species details</Text>
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#1B5E34" />
          <Text style={styles.stateText}>Loading species…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={36} color="#B45309" />
          <Text style={styles.stateTitle}>Species unavailable</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setReloadKey((key) => key + 1)}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : species ? (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.plantHero}>
            <View style={styles.heroIcon}>
              <Ionicons name="leaf" size={34} color="#1B5E34" />
            </View>
            <Text style={styles.category}>{species.category}</Text>
            <Text style={styles.name}>{species.name}</Text>
            <Text style={styles.scientificName}>{species.scientificName}</Text>
            <Text style={styles.code}>PLANT CODE · {species.code}</Text>
            <Text style={styles.description}>{species.description}</Text>
          </View>

          <Text style={styles.sectionTitle}>Ideal care ranges</Text>
          <Text style={styles.sectionSubtitle}>
            Keep sensor readings within these species-specific thresholds.
          </Text>
          {thresholdCard(
            'Soil moisture',
            'water-outline',
            species.minMoisture,
            species.maxMoisture,
            '%',
            '#2563EB',
            '#DBEAFE'
          )}
          {thresholdCard(
            'Light intensity',
            'sunny-outline',
            species.minLightLux,
            species.maxLightLux,
            'lux',
            '#B45309',
            '#FEF3C7'
          )}
          {thresholdCard(
            'Temperature',
            'thermometer-outline',
            species.minTempC,
            species.maxTempC,
            '°C',
            '#BE123C',
            '#FFE4E6'
          )}

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={19} color="#1B5E34" />
            <Text style={styles.noteText}>
              These are reference ranges. Adjust care based on your plant’s environment and growth.
            </Text>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F5' },
  header: {
    minHeight: 54,
    backgroundColor: '#0F3D22',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 12,
  },
  backButton: { padding: 5 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  container: { padding: 16, paddingBottom: 28 },
  plantHero: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E0E8E2',
  },
  heroIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  category: { color: '#1B5E34', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  name: { color: '#0F3D22', fontSize: 25, fontWeight: '800', textAlign: 'center', marginTop: 5 },
  scientificName: { color: '#68766D', fontSize: 14, fontStyle: 'italic', marginTop: 3 },
  code: { color: '#52665A', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginTop: 12 },
  description: { color: '#52665A', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 14 },
  sectionTitle: { color: '#17251C', fontSize: 18, fontWeight: '800', marginTop: 22 },
  sectionSubtitle: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 12 },
  thresholdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E8E2',
    borderWidth: 1,
    borderRadius: 13,
    padding: 13,
    marginBottom: 9,
  },
  thresholdIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  thresholdContent: { flex: 1 },
  thresholdLabel: { color: '#52665A', fontSize: 12, fontWeight: '600' },
  thresholdRange: { color: '#17251C', fontSize: 18, fontWeight: '800', marginTop: 2 },
  thresholdUnit: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  minMaxLabels: { gap: 17, paddingRight: 1 },
  minMax: { color: '#94A3B8', fontSize: 9, fontWeight: '800' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#E8F5EC',
    borderRadius: 10,
    padding: 12,
    marginTop: 5,
  },
  noteText: { flex: 1, color: '#345A40', fontSize: 12, lineHeight: 18 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 9 },
  stateTitle: { color: '#26372C', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  stateText: { color: '#64748B', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retryButton: { backgroundColor: '#1B5E34', borderRadius: 9, paddingHorizontal: 17, paddingVertical: 10, marginTop: 5 },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
