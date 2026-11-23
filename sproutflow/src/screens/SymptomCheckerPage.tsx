// Module 8 — Symptom Checker: photo check of the plant, foliage assessment and treat-to-recovery tracker.
// Layout and colours follow the Module 8 Symptom Checker mockup.

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalyticsColors as C, cardShadow } from '../analytics/config';

const PLANT_PHOTO = require('../../assets/images/symptom-plant.jpg');

/** Result of the photo diagnosis (demo values until a diagnosis service is connected). */
const PHOTO_DIAGNOSIS_PERCENT = 100;

const FOLIAGE_FINDINGS = [
  'Leaf colour: mostly healthy green, a few yellow lower leaves',
  'Spots or lesions: none found',
  'Stems: upright and firm',
  'Likely cause: soil kept too wet',
];

const TREATMENT_PLAN = [
  'Let the top 3–5 cm of soil dry before the next watering',
  'Remove the yellow leaves with clean scissors',
  'Keep the pot in bright, indirect light',
  'Check the plant again in 7 days',
];

export default function SymptomCheckerPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [treated, setTreated] = useState(false);

  const steps = [
    { title: 'Foliage assessment', ok: true },
    { title: 'Foliage structural assessment', ok: true },
    { title: 'Treat-to-recovery result', ok: treated },
  ];

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const showAssessment = () => {
    Alert.alert('Foliage assessment', FOLIAGE_FINDINGS.map((f) => `• ${f}`).join('\n'));
  };

  const onTreat = () => {
    const plan = TREATMENT_PLAN.map((s, i) => `${i + 1}. ${s}`).join('\n');
    if (treated) {
      Alert.alert('Treatment in progress', plan);
      return;
    }
    Alert.alert('Treatment plan', plan, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start treatment', onPress: () => setTreated(true) },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[C.headerFrom, C.headerMid, C.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 4 }]}
      >
        <View style={styles.glow} />
        <Pressable onPress={goBack} style={styles.backBtn} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={28} color={C.onPrimary} />
        </Pressable>
        <Text style={styles.heroTitle}>Symptom Checker</Text>
      </LinearGradient>

      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.sectionTitle}>Symptom checker wizard</Text>
          <View style={styles.wizardCard}>
            <Image source={PLANT_PHOTO} style={styles.photo} contentFit="cover" accessibilityLabel="Photo of the potted plant" />
            <View style={styles.checks}>
              {steps.map((s) => (
                <View key={s.title} style={styles.checkRow} accessibilityLabel={`${s.title}: ${s.ok ? 'passed' : 'not done'}`}>
                  <Ionicons name={s.ok ? 'checkmark-circle' : 'close-circle'} size={22} color={s.ok ? C.success : C.danger} />
                  <Text style={styles.checkText}>{s.title}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Foliage assessment</Text>
          <Pressable
            style={({ pressed }) => [styles.tintCard, styles.assessCard, pressed && styles.pressed]}
            onPress={showAssessment}
            accessibilityRole="button"
            accessibilityHint="Shows the foliage assessment results"
          >
            <Ionicons name="heart" size={28} color={C.success} />
            <Text style={styles.assessText}>Foliage assessment results overview</Text>
            <Ionicons name="radio-button-on" size={24} color={C.green} />
          </Pressable>

          <Text style={styles.sectionTitle}>Treat-to-recovery tracker</Text>
          <View style={[styles.tintCard, styles.trackerCard]}>
            <View style={styles.trackerRow}>
              <Text style={styles.trackerLabel}>Photo diagnosis</Text>
              <Text style={styles.trackerValue}>{PHOTO_DIAGNOSIS_PERCENT}%</Text>
            </View>
            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: PHOTO_DIAGNOSIS_PERCENT }}
            >
              <View style={[styles.fill, { width: `${PHOTO_DIAGNOSIS_PERCENT}%` }]} />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.treatBtn, treated && styles.treatBtnDone, pressed && styles.pressed]}
            onPress={onTreat}
            accessibilityRole="button"
          >
            {treated && <Ionicons name="checkmark-circle" size={20} color={C.onPrimary} />}
            <Text style={styles.treatText}>{treated ? 'Treatment Started' : 'Treat'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const SHEET_RADIUS = 26;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  hero: { paddingHorizontal: 18, paddingBottom: SHEET_RADIUS + 26, overflow: 'hidden' },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    right: -100,
    top: -130,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', marginLeft: -6 },
  heroTitle: { color: C.onPrimary, fontSize: 32, fontWeight: '800', marginTop: 10 },
  sheet: {
    flex: 1,
    marginTop: -SHEET_RADIUS,
    backgroundColor: C.bg,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    overflow: 'hidden',
  },
  content: { paddingHorizontal: 16, paddingTop: 22, gap: 12 },
  sectionTitle: { color: C.text, fontSize: 19, fontWeight: '800', marginTop: 4 },
  wizardCard: {
    flexDirection: 'row',
    minHeight: 160,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  photo: { width: '40%', backgroundColor: C.primaryTint },
  checks: { flex: 1, justifyContent: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkText: { flex: 1, color: C.text, fontSize: 14, fontWeight: '500' },
  tintCard: {
    backgroundColor: C.primaryTint,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  assessCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  assessText: { flex: 1, color: C.text, fontSize: 15, lineHeight: 20 },
  trackerCard: { gap: 12 },
  trackerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackerLabel: { color: C.text, fontSize: 15 },
  trackerValue: { color: C.text, fontSize: 15, fontWeight: '700' },
  track: { height: 8, borderRadius: 4, backgroundColor: C.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: C.primary },
  treatBtn: {
    marginTop: 10,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: C.treat,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  treatBtnDone: { backgroundColor: C.primary },
  treatText: { color: C.onPrimary, fontSize: 17, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
