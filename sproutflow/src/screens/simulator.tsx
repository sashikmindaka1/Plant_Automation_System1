import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Switch, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MockSimulatorScreen() {
  // State variables for sliders/override switches
  const [isOverrideEnabled, setIsOverrideEnabled] = useState(false);
  const [soilMoisture, setSoilMoisture] = useState(48);
  const [waterTank, setWaterTank] = useState(75);
  const [temperature, setTemperature] = useState(24);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MOCK SENSOR TELEMETRY & OVERRIDE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* LEFT SECTION: MOCK ENGINE STATUS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>MOCK ENGINE: ACTIVE</Text>
            <View style={styles.activeDot} />
          </View>

          {/* Soil Moisture Metric */}
          <View style={styles.metricRow}>
            <View>
              <Text style={styles.metricLabel}>SOIL MOISTURE</Text>
              <Text style={styles.metricValue}>{soilMoisture}%</Text>
              <Text style={styles.metricStatusOptimal}>OPTIMAL</Text>
            </View>
            <Ionicons name="leaf-outline" size={32} color="#2e7d32" />
          </View>

          {/* Temperature Metric */}
          <View style={styles.metricRow}>
            <View>
              <Text style={styles.metricLabel}>TEMPERATURE</Text>
              <Text style={styles.metricValue}>{temperature}°C</Text>
              <Text style={styles.metricStatusOptimal}>OPTIMAL</Text>
            </View>
            <Ionicons name="thermometer-outline" size={32} color="#2e7d32" />
          </View>

          {/* Water Level Metric */}
          <View style={styles.metricRow}>
            <View>
              <Text style={styles.metricLabel}>WATER LEVEL</Text>
              <Text style={styles.metricValue}>{waterTank}%</Text>
              <Text style={styles.metricStatusOptimal}>FULL</Text>
            </View>
            <Ionicons name="water-outline" size={32} color="#2e7d32" />
          </View>
        </View>

        {/* RIGHT SECTION: DEMO OVERRIDE CONTROLS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>DEMO OVERRIDE CONTROLS</Text>
            <TouchableOpacity style={styles.disableButton}>
              <Text style={styles.disableButtonText}>DISABLE ALL</Text>
            </TouchableOpacity>
          </View>

          {/* Override Toggle 1 */}
          <View style={styles.controlRow}>
            <View>
              <Text style={styles.controlLabel}>SOIL MOISTURE (DEMO)</Text>
              <Text style={styles.controlSubValue}>{soilMoisture}%</Text>
            </View>
            <Switch 
              value={isOverrideEnabled} 
              onValueChange={setIsOverrideEnabled}
              trackColor={{ false: '#ccc', true: '#d32f2f' }}
              thumbColor={'#fff'}
            />
          </View>

          {/* Override Toggle 2 */}
          <View style={styles.controlRow}>
            <View>
              <Text style={styles.controlLabel}>WATER TANK (DEMO)</Text>
              <Text style={styles.controlSubValue}>{waterTank}%</Text>
            </View>
            <Switch 
              value={isOverrideEnabled} 
              onValueChange={setIsOverrideEnabled}
              trackColor={{ false: '#ccc', true: '#d32f2f' }}
              thumbColor={'#fff'}
            />
          </View>

          {/* SIMULATED ALERTS SECTION (Red Theme Highlights) */}
          <View style={styles.alertSection}>
            <Text style={styles.alertHeader}>SIMULATED ALERTS</Text>
            
            <View style={styles.alertRow}>
              <Text style={styles.alertText}>Low Soil Moisture Alert</Text>
              <Switch value={soilMoisture < 20} disabled trackColor={{ true: '#d32f2f' }} />
            </View>

            <View style={styles.alertRow}>
              <Text style={styles.alertText}>High Temp Alert</Text>
              <Switch value={temperature > 30} disabled trackColor={{ true: '#d32f2f' }} />
            </View>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Styles for design (Green, White, Red Theme)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f4',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f', // Red accent
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32', // Green theme
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2e7d32',
  },
  disableButton: {
    backgroundColor: '#d32f2f', // Red button
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  disableButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  metricStatusOptimal: {
    fontSize: 10,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  controlSubValue: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  alertSection: {
    marginTop: 15,
    backgroundColor: '#fff5f5', // Light red background for alerts
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  alertHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  alertText: {
    fontSize: 12,
    color: '#333',
  },
});