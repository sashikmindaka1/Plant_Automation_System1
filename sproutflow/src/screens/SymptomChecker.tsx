// Module 7 - Plant Health Symptom Checker & Treatment Tracker
// Steps: 1) wizard  2) result  3) tracker

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
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

import { db } from '../api/firebaseConfig';
import { diagnose, Diagnosis, Symptom, SYMPTOMS, Telemetry } from '../utils/diagnosisEngine';

// Colors (same palette as Module 6)
const C = {
    green900: '#0F3D22',
    green700: '#1B5E34',
    green100: '#E3F4EA',
    red: '#EF4444',
    redSoft: '#FEE4E2',
    amber: '#F59E0B',
    amberSoft: '#FEF0D4',
    bg: '#F2F5F3',
    card: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
    line: '#E2E8F0',
};

// Hardcoded plant list (later this can come from Module 3)
const PLANTS = [
    { id: 'plant_104', name: 'Balcony Monstera' },
    { id: 'plant_105', name: 'Living Room Fern' },
    { id: 'plant_106', name: 'Backyard Aloe' },
];

// Used when no telemetry is found in Firestore (shared JSON contract values)
const SAMPLE_TELEMETRY: Telemetry = {
    soilMoisturePercent: 28.5,
    temperatureCelsius: 29.2,
    humidityPercent: 74,
    lightLux: 850,
    waterTankLevelPercent: 65,
};

type Task = {
    id: string; // Firestore id ('' if saving failed)
    label: string;
    done: boolean;
};

// Read the latest telemetry of a plant from Firestore.
// Collection name 'mock_sensor_state' is assumed (confirm with Module 4).
async function getTelemetry(plantId: string): Promise<{ data: Telemetry; live: boolean }> {
    try {
        const snap = await getDoc(doc(db, 'mock_sensor_state', plantId));
        if (snap.exists() && snap.data().telemetry) {
            return { data: snap.data().telemetry as Telemetry, live: true };
        }
    } catch (error) {
        console.log('Could not read telemetry:', error);
    }
    return { data: SAMPLE_TELEMETRY, live: false };
}

export default function SymptomChecker() {
    const router = useRouter();

    // CHANGED 1: safe back button (goes home if there is no history)
    function onBack() {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    }

    const [step, setStep] = useState<'wizard' | 'result' | 'tracker'>('wizard');
    const [plantId, setPlantId] = useState(PLANTS[0].id);
    const [symptoms, setSymptoms] = useState<Symptom[]>([]);
    const [telemetry, setTelemetry] = useState<Telemetry>(SAMPLE_TELEMETRY);
    const [liveData, setLiveData] = useState(false);
    const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [saveFailed, setSaveFailed] = useState(false);

    const plantName = PLANTS.find((p) => p.id === plantId)?.name;

    // Select / unselect a symptom
    function toggleSymptom(key: Symptom) {
        if (symptoms.includes(key)) {
            setSymptoms(symptoms.filter((s) => s !== key));
        } else {
            setSymptoms([...symptoms, key]);
        }
    }

    // Step 1 -> 2 : get telemetry and run the rule engine
    async function onDiagnose() {
        setLoading(true);
        const result = await getTelemetry(plantId);
        setTelemetry(result.data);
        setLiveData(result.live);
        setDiagnosis(diagnose(symptoms, result.data));
        setLoading(false);
        setStep('result');
    }

    // Step 2 -> 3 : save diagnosis + treatment tasks, then open tracker
    async function onTreat() {
        if (!diagnosis) return;
        setLoading(true);
        setSaveFailed(false);

        const newTasks: Task[] = diagnosis.steps.map((label) => ({
            id: '',
            label,
            done: false,
        }));

        try {
            // health_diagnoses table
            const diagRef = await addDoc(collection(db, 'health_diagnoses'), {
                plantId: plantId,
                symptoms: symptoms,
                telemetry: telemetry,
                title: diagnosis.title,
                severity: diagnosis.severity,
                cause: diagnosis.cause,
                created_at: new Date().toISOString(),
            });

            // treatment_tasks table (one document per step)
            for (const task of newTasks) {
                const taskRef = await addDoc(collection(db, 'treatment_tasks'), {
                    diagnosisId: diagRef.id,
                    plantId: plantId,
                    label: task.label,
                    done: false,
                    created_at: new Date().toISOString(),
                });
                task.id = taskRef.id;
            }
        } catch (error) {
            console.log('Could not save to Firestore:', error);
            setSaveFailed(true);
        }

        setTasks(newTasks);
        setLoading(false);
        setStep('tracker');
    }

    // Tick / untick a recovery step
    async function toggleTask(index: number) {
        const task = tasks[index];
        const newDone = !task.done;

        // update screen first
        const updated = tasks.map((t, i) => (i === index ? { ...t, done: newDone } : t));
        setTasks(updated);

        // then update Firestore
        if (task.id) {
            try {
                await updateDoc(doc(db, 'treatment_tasks', task.id), { done: newDone });
            } catch (error) {
                console.log('Could not update task:', error);
            }
        }
    }

    // Go back to the start
    function onNewCheck() {
        setSymptoms([]);
        setDiagnosis(null);
        setTasks([]);
        setSaveFailed(false);
        setStep('wizard');
    }

    // Progress of the tracker
    const doneCount = tasks.filter((t) => t.done).length;
    const percent = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

    // Color of the severity badge
    function severityColors() {
        if (diagnosis?.severity === 'high') return { bg: C.redSoft, fg: C.red };
        if (diagnosis?.severity === 'medium') return { bg: C.amberSoft, fg: C.amber };
        return { bg: C.green100, fg: C.green700 };
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                {/* CHANGED 2: onBack instead of router.back() */}
                <TouchableOpacity onPress={onBack}>
                    <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Symptom Checker</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* ---------- STEP 1: WIZARD ---------- */}
                {step === 'wizard' && (
                    <View>
                        <Text style={styles.sectionTitle}>1. Choose your plant</Text>
                        <View style={styles.card}>
                            {PLANTS.map((plant) => (
                                <TouchableOpacity
                                    key={plant.id}
                                    style={styles.plantRow}
                                    onPress={() => setPlantId(plant.id)}
                                >
                                    <Ionicons
                                        name={plantId === plant.id ? 'radio-button-on' : 'radio-button-off'}
                                        size={22}
                                        color={C.green700}
                                    />
                                    <Text style={styles.plantName}>{plant.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.sectionTitle}>2. What do you see on the leaves?</Text>
                        <View style={styles.chipRow}>
                            {SYMPTOMS.map((item) => {
                                const selected = symptoms.includes(item.key);
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        style={[styles.chip, selected && styles.chipSelected]}
                                        onPress={() => toggleSymptom(item.key)}
                                    >
                                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            style={[styles.button, symptoms.length === 0 && styles.buttonDisabled]}
                            disabled={symptoms.length === 0 || loading}
                            onPress={onDiagnose}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Diagnose</Text>
                            )}
                        </TouchableOpacity>
                        {symptoms.length === 0 && (
                            <Text style={styles.hint}>Select at least one symptom.</Text>
                        )}
                    </View>
                )}

                {/* ---------- STEP 2: RESULT ---------- */}
                {step === 'result' && diagnosis && (
                    <View>
                        <Text style={styles.sectionTitle}>Diagnosis for {plantName}</Text>
                        <View style={styles.card}>
                            <View style={[styles.badge, { backgroundColor: severityColors().bg }]}>
                                <Text style={[styles.badgeText, { color: severityColors().fg }]}>
                                    {diagnosis.severity.toUpperCase()} RISK
                                </Text>
                            </View>
                            <Text style={styles.resultTitle}>{diagnosis.title}</Text>
                            <Text style={styles.resultCause}>{diagnosis.cause}</Text>
                        </View>

                        <Text style={styles.sectionTitle}>Sensor readings used</Text>
                        <View style={styles.card}>
                            <Text style={styles.readingText}>Soil moisture: {telemetry.soilMoisturePercent}%</Text>
                            <Text style={styles.readingText}>Temperature: {telemetry.temperatureCelsius}°C</Text>
                            <Text style={styles.readingText}>Humidity: {telemetry.humidityPercent}%</Text>
                            <Text style={styles.readingText}>Light: {telemetry.lightLux} lux</Text>
                            <Text style={styles.hint}>
                                {liveData ? 'Live data from the mock sensors.' : 'Sample data (no live data found).'}
                            </Text>
                        </View>

                        <Text style={styles.sectionTitle}>Recovery plan</Text>
                        <View style={styles.card}>
                            {diagnosis.steps.map((s, i) => (
                                <Text key={i} style={styles.stepText}>
                                    {i + 1}. {s}
                                </Text>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: C.red }]}
                            disabled={loading}
                            onPress={onTreat}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Start treatment</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.linkButton} onPress={onNewCheck}>
                            <Text style={styles.linkText}>Check again</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ---------- STEP 3: TRACKER ---------- */}
                {step === 'tracker' && (
                    <View>
                        <Text style={styles.sectionTitle}>Treatment tracker: {plantName}</Text>

                        <View style={styles.card}>
                            <Text style={styles.progressText}>
                                {doneCount} of {tasks.length} steps done ({percent}%)
                            </Text>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${percent}%` }]} />
                            </View>
                            {percent === 100 && (
                                <Text style={styles.successText}>Recovery plan complete. Keep watching the plant.</Text>
                            )}
                        </View>

                        <View style={styles.card}>
                            {tasks.map((task, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.taskRow}
                                    onPress={() => toggleTask(index)}
                                >
                                    <Ionicons
                                        name={task.done ? 'checkbox' : 'square-outline'}
                                        size={24}
                                        color={C.green700}
                                    />
                                    <Text style={[styles.taskText, task.done && styles.taskTextDone]}>
                                        {task.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {saveFailed && (
                            <Text style={styles.warningText}>
                                Could not save to the database. Your ticks work on this screen only.
                            </Text>
                        )}

                        <TouchableOpacity style={styles.button} onPress={onNewCheck}>
                            <Text style={styles.buttonText}>New check</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
        backgroundColor: C.green900,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginLeft: 8 },
    content: { padding: 16, paddingBottom: 40 },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 8, marginBottom: 10 },
    card: {
        backgroundColor: C.card,
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: C.line,
    },

    plantRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    plantName: { fontSize: 15, color: C.text, marginLeft: 10 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
    chip: {
        borderWidth: 1,
        borderColor: C.green700,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: C.card,
    },
    chipSelected: { backgroundColor: C.green700 },
    chipText: { color: C.green700, fontSize: 14 },
    chipTextSelected: { color: '#FFFFFF' },

    button: {
        backgroundColor: C.green700,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: { backgroundColor: '#9CA3AF' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    linkButton: { alignItems: 'center', marginTop: 14 },
    linkText: { color: C.green700, fontSize: 15, fontWeight: '600' },
    hint: { color: C.muted, fontSize: 13, marginTop: 8 },

    badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: 12, fontWeight: '700' },
    resultTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginTop: 10 },
    resultCause: { fontSize: 15, color: C.muted, marginTop: 6 },
    readingText: { fontSize: 15, color: C.text, marginBottom: 4 },
    stepText: { fontSize: 15, color: C.text, marginBottom: 8 },

    progressText: { fontSize: 15, color: C.text, marginBottom: 10 },
    progressTrack: { height: 10, backgroundColor: C.line, borderRadius: 5, overflow: 'hidden' },
    progressFill: { height: 10, backgroundColor: C.green700 },
    successText: { color: C.green700, fontSize: 14, marginTop: 10 },
    taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    taskText: { flex: 1, fontSize: 15, color: C.text, marginLeft: 10 },
    taskTextDone: { color: C.muted, textDecorationLine: 'line-through' },
    warningText: { color: C.amber, fontSize: 13, marginBottom: 6 },
});
