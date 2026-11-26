import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PlantTwinData, VirtualPlantTwin } from '../components/VirtualPlantTwin';

const INITIAL_PLANTS: PlantTwinData[] = [
  {
    id: '1',
    name: 'Basil Twin #1',
    species: 'Sweet Basil',
    zone: 'Zone A',
    stage: 'Vegetative',
    status: 'healthy',
    moisture: 68,
    temperature: 26,
    light: 82,
  },
  {
    id: '2',
    name: 'Tomato Twin #2',
    species: 'Cherry Tomato',
    zone: 'Zone B',
    stage: 'Flowering',
    status: 'thirsty',
    moisture: 31,
    temperature: 29,
    light: 90,
  },
  {
    id: '3',
    name: 'Mint Twin #3',
    species: 'Spearmint',
    zone: 'Zone C',
    stage: 'Active Growth',
    status: 'alert',
    moisture: 22,
    temperature: 32,
    light: 75,
  },
];

export default function GardenDashboardScreen() {
  const router = useRouter();
  const [plants, setPlants] = useState<PlantTwinData[]>(INITIAL_PLANTS);
  const [selectedPlant, setSelectedPlant] = useState<PlantTwinData | null>(null);

  const summary = useMemo(() => {
    const total = plants.length;
    const healthy = plants.filter((p) => p.status === 'healthy').length;
    const needsAttention = total - healthy;
    return { total, healthy, needsAttention };
  }, [plants]);

  const handleWaterPlant = (id: string) => {
    setPlants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, moisture: Math.min(100, p.moisture + 30), status: 'healthy' } : p
      )
    );
    setSelectedPlant((prev) =>
      prev && prev.id === id
        ? { ...prev, moisture: Math.min(100, prev.moisture + 30), status: 'healthy' }
        : prev
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Garden Dashboard</Text>
          <Text style={styles.subtitle}>Virtual Plant Twins & Live Garden Overview</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.total}</Text>
            <Text style={styles.statLabel}>Total Twins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#15803D' }]}>{summary.healthy}</Text>
            <Text style={styles.statLabel}>Healthy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#B45309' }]}>
              {summary.needsAttention}
            </Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/zones')}>
            <Ionicons name="grid-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>Zones</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/symptom-checker')}
          >
            <Ionicons name="medkit-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>Symptoms</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/weather-alerts')}
          >
            <Ionicons name="partly-sunny-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>Weather</Text>
          </TouchableOpacity>
        </View>

        {selectedPlant && (
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Selected Twin: {selectedPlant.name}</Text>
            <Text style={styles.detailText}>
              {selectedPlant.zone} • {selectedPlant.stage} • Moisture {selectedPlant.moisture}%
            </Text>
            <View style={styles.detailActions}>
              <TouchableOpacity
                style={styles.waterBtn}
                onPress={() => handleWaterPlant(selectedPlant.id)}
              >
                <Text style={styles.waterBtnText}>Log Quick Water (+30%)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedPlant(null)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Virtual Plant Twins</Text>
        {plants.map((plant) => (
          <VirtualPlantTwin key={plant.id} plant={plant} onPress={setSelectedPlant} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7F5',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#0F3D22',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#D1FAE5',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F3D22',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1B5E37',
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  detailBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065F46',
  },
  detailText: {
    fontSize: 13,
    color: '#047857',
    marginTop: 4,
  },
  detailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  waterBtn: {
    backgroundColor: '#0F3D22',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  waterBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  closeText: {
    color: '#065F46',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
});