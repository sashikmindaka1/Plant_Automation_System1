import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type PlantStatus = 'healthy' | 'thirsty' | 'alert';

export interface PlantTwinData {
  id: string;
  name: string;
  species: string;
  zone: string;
  stage: string;
  status: PlantStatus;
  moisture: number; // %
  temperature: number; // °C
  light: number; // %
}

interface VirtualPlantTwinProps {
  plant: PlantTwinData;
  onPress?: (plant: PlantTwinData) => void;
}

const STATUS_CONFIG: Record<
  PlantStatus,
  { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  healthy: {
    label: 'Healthy',
    color: '#15803D',
    bg: '#DCFCE7',
    icon: 'leaf',
  },
  thirsty: {
    label: 'Needs Water',
    color: '#B45309',
    bg: '#FEF3C7',
    icon: 'water',
  },
  alert: {
    label: 'Check Twin',
    color: '#B91C1C',
    bg: '#FEE2E2',
    icon: 'warning',
  },
};

export function VirtualPlantTwin({ plant, onPress }: VirtualPlantTwinProps) {
  const badge = STATUS_CONFIG[plant.status];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, { borderColor: badge.color }]}
      onPress={() => onPress?.(plant)}
    >
      <View style={styles.topRow}>
        <View style={[styles.avatarCircle, { backgroundColor: badge.bg }]}>
          <Ionicons name={badge.icon} size={24} color={badge.color} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{plant.name}</Text>
          <Text style={styles.meta}>
            {plant.species} • {plant.zone}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: badge.bg }]}>
          <Text style={[styles.pillText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <Text style={styles.metric}>Moisture: {plant.moisture}%</Text>
        <Text style={styles.metric}>Temp: {plant.temperature}°C</Text>
        <Text style={styles.metric}>Light: {plant.light}%</Text>
      </View>

      <Text style={styles.stage}>Growth Stage: {plant.stage}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F3D22',
  },
  meta: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  metric: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  stage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
});