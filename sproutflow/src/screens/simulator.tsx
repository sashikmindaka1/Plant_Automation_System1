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
import Slider from '@react-native-community/slider'; 

export default function MockSimulatorScreen() {
  // State variables for Demo overrides
  const [isOverrideEnabled, setIsOverrideEnabled] = useState(true);
  const [soilMoisture, setSoilMoisture] = useState(48);
  const [waterTank, setWaterTank] = useState(75);
  const [temperature, setTemperature] = useState(24);
  const [light, setLight] = useState(550);

  // Switches for simulated Alerts
  const [soilMoistureAlert, setSoilMoistureAlert] = useState(true);
  const [waterTankAlert, setWaterTankAlert] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* BRAND & HEADER */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>SproutFlow</Text>
          <Text style={styles.headerSubtitle}>MOCK SENSOR TELEMETRY & SIMULATOR</Text>
        </View>

        {/* STATUS BAR */}
        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <View style={styles.activeDot} />
            <Text style={styles.statusText}>MOCK ENGINE: ACTIVE</Text>
          </View>
          <TouchableOpacity style={styles.disableButton}>
            <Text style={styles.disableButtonText}>DISABLE ALL</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 1: TELEMETRY ENGINE (Round Gauges Card) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TELEMETRY ENGINE</Text>
          
          <View style={styles.gaugeGrid}>
            
            {/* Gauges Column 1 */}
            <View style={styles.gaugeItem}>
              <Text style={styles.gaugeLabel}>SOIL MOISTURE</Text>
              {/* Circular border using native borderRadius */}
              <View style={[styles.roundGauge, { borderTopColor: '#00ff87', borderRightColor: '#00ff87', borderLeftColor: '#00ff87' }]}>
                <Text style={styles.gaugeValue}>{soilMoisture}%</Text>
                <Ionicons name="leaf" size={12} color="#00ff87" />
              </View>
              <View style={styles.statusPill}>
                <Ionicons name="leaf-outline" size={11} color="#00ff87" />
                <Text style={styles.statusPillText}>OPTIMAL</Text>
              </View>
            </View>

            {/* Gauges Column 2 */}
            <View style={styles.gaugeItem}>
              <Text style={styles.gaugeLabel}>WATER TANK</Text>
              <View style={[styles.roundGauge, { borderTopColor: '#00E5FF', borderRightColor: '#00E5FF', borderLeftColor: '#00E5FF', borderBottomColor: 'rgba(0, 229, 255, 0.2)' }]}>
                <Text style={[styles.gaugeValue, { color: '#00E5FF' }]}>{waterTank}%</Text>
                <Ionicons name="water" size={12} color="#00E5FF" />
              </View>
              <View style={[styles.statusPill, { backgroundColor: 'rgba(0, 229, 255, 0.1)' }]}>
                <Ionicons name="water" size={11} color="#00E5FF" />
                <Text style={[styles.statusPillText, { color: '#00E5FF' }]}>FULL</Text>
              </View>
            </View>

          </View>

          <View style={styles.gaugeGrid}>
            
            {/* Gauges Column 3 */}
            <View style={styles.gaugeItem}>
              <Text style={styles.gaugeLabel}>TEMPERATURE</Text>
              <View style={[styles.roundGauge, { borderTopColor: '#00ff87', borderRightColor: '#00ff87', borderBottomColor: 'rgba(0, 255, 135, 0.2)' }]}>
                <Text style={styles.gaugeValue}>{temperature}°C</Text>
                <Ionicons name="thermometer" size={12} color="#00ff87" />
              </View>
              <View style={styles.statusPill}>
                <Ionicons name="thermometer-outline" size={11} color="#00ff87" />
                <Text style={styles.statusPillText}>NORMAL</Text>
              </View>
            </View>

            {/* Gauges Column 4 */}
            <View style={styles.gaugeItem}>
              <Text style={styles.gaugeLabel}>LIGHT INTENSITY</Text>
              <View style={[styles.roundGauge, { borderTopColor: '#FFD54F', borderRightColor: '#FFD54F', borderLeftColor: '#FFD54F', borderBottomColor: 'rgba(255, 213, 79, 0.2)' }]}>
                <Text style={[styles.gaugeValue, { color: '#FFD54F' }]}>{light} Lux</Text>
                <Ionicons name="sunny" size={12} color="#FFD54F" />
              </View>
              <View style={[styles.statusPill, { backgroundColor: 'rgba(255, 213, 79, 0.1)' }]}>
                <Ionicons name="sunny" size={11} color="#FFD54F" />
                <Text style={[styles.statusPillText, { color: '#FFD54F' }]}>BRIGHT</Text>
              </View>
            </View>

          </View>
        </View>

        {/* SECTION 2: DEMO OVERRIDE SLIDERS Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>DEMO OVERRIDE SLIDERS</Text>
            <View style={styles.overrideToggleContainer}>
              <Text style={styles.smallLabel}>Demo Override</Text>
              <Switch 
                value={isOverrideEnabled} 
                onValueChange={setIsOverrideEnabled}
                trackColor={{ false: '#222', true: '#00ff87' }}
                thumbColor={'#fff'}
              />
            </View>
          </View>

          {/* Slider Row 1: Soil Moisture */}
          <View style={styles.sliderRow}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>SOIL MOISTURE (DEMO)</Text>
              <Switch 
                value={isOverrideEnabled} 
                trackColor={{ false: '#222', true: '#00ff87' }}
                thumbColor={'#fff'}
              />
            </View>
            {/* Custom slider visualization using standard Native view to prevent dependency issues */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrackBackground}>
                <View style={[styles.sliderProgress, { width: `${soilMoisture}%`, backgroundColor: '#00ff87' }]} />
                <TouchableOpacity 
                  style={[styles.sliderThumb, { left: `${soilMoisture - 5}%` }]} 
                  onPress={() => setSoilMoisture(prev => (prev < 90 ? prev + 10 : 20))}
                />
              </View>
            </View>
          </View>

          {/* Slider Row 2: Water Tank */}
          <View style={styles.sliderRow}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>WATER TANK (DEMO)</Text>
              <Switch 
                value={isOverrideEnabled} 
                trackColor={{ false: '#222', true: '#00ff87' }}
                thumbColor={'#fff'}
              />
            </View>
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrackBackground}>
                <View style={[styles.sliderProgress, { width: `${waterTank}%`, backgroundColor: '#00ff87' }]} />
                <TouchableOpacity 
                  style={[styles.sliderThumb, { left: `${waterTank - 5}%` }]} 
                  onPress={() => setWaterTank(prev => (prev < 90 ? prev + 10 : 30))}
                />
              </View>
            </View>
          </View>
        </View>

        {/* SECTION 3: SIMULATED ALERTS Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SIMULATED ALERTS</Text>
          
          <View style={styles.alertItem}>
            <Text style={styles.alertText}>LOW SOIL MOISTURE ALERT</Text>
            <Ionicons name="alert-circle" size={16} color="#FF5252" style={styles.alertIcon} />
            <Switch 
              value={soilMoistureAlert} 
              onValueChange={setSoilMoistureAlert}
              trackColor={{ false: '#222', true: '#FF5252' }}
              thumbColor={'#fff'}
            />
          </View>

          <View style={styles.alertItem}>
            <Text style={styles.alertText}>EMPTY WATER TANK ALERT</Text>
            <Ionicons name="alert-circle" size={16} color="#FF5252" style={styles.alertIcon} />
            <Switch 
              value={waterTankAlert} 
              onValueChange={setWaterTankAlert}
              trackColor={{ false: '#222', true: '#FF5252' }}
              thumbColor={'#fff'}
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Styling (Dark forest cyber and round metrics)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b6b8b7', // Cyber forest deep green
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#00ff87', // Glowing neon green
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#A2BAA8',
    letterSpacing: 1,
    marginTop: 4,
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 45, 30, 0.3)',
    borderColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff87',
    marginRight: 8,
    shadowColor: '#00ff87',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  statusText: {
    fontSize: 10,
    color: '#00ff87',
    fontWeight: '800',
  },
  disableButton: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  disableButtonText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  card: {
    backgroundColor: 'rgba(22, 70, 34, 0.95)', // Glassmorphic translucent dark background
    borderColor: 'rgba(0, 255, 135, 0.15)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#00ff87',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E0E8E1',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  overrideToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallLabel: {
    fontSize: 9,
    color: '#A2BAA8',
    marginRight: 6,
    fontWeight: '600',
  },
  gaugeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  gaugeItem: {
    alignItems: 'center',
    width: '45%',
  },
  gaugeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A2BAA8',
    marginBottom: 6,
  },
  roundGauge: {
    width: 86,
    height: 86,
    borderRadius: 43, // Exact circle (half of width/height)
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.04)', // Base background circle
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  gaugeValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#00ff87',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#00ff87',
    marginLeft: 3,
  },
  sliderRow: {
    marginBottom: 14,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A2BAA8',
  },
  sliderContainer: {
    height: 18,
    justifyContent: 'center',
  },
  sliderTrackBackground: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1E2F23',
    position: 'relative',
  },
  sliderProgress: {
    height: '100%',
    borderRadius: 2.5,
  },
  sliderThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#00ff87',
    position: 'absolute',
    top: -4.5,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.07)',
    borderColor: 'rgba(255, 82, 82, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFA2A2',
  },
  alertIcon: {
    marginRight: 10,
  },
});