import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PlantCodeLookupModalProps {
  visible: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onLookup: (code: string) => void;
}

export default function PlantCodeLookupModal({
  visible,
  busy,
  error,
  onClose,
  onLookup,
}: PlantCodeLookupModalProps) {
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef(false);

  useEffect(() => {
    if (!visible) {
      setCode('');
      setScanning(false);
      setCameraError(null);
      scanned.current = false;
    }
  }, [visible]);

  const startScanning = async () => {
    setCameraError(null);
    if (!permission?.granted) {
      try {
        const result = await requestPermission();
        if (!result.granted) {
          setCameraError('Camera permission is required to scan a QR code.');
          return;
        }
      } catch (requestError) {
        setCameraError(
          requestError instanceof Error ? requestError.message : 'Could not request camera access.'
        );
        return;
      }
    }
    scanned.current = false;
    setScanning(true);
  };

  const handleBarcode = (result: { data: string }) => {
    if (scanned.current) return;
    scanned.current = true;
    setScanning(false);
    onLookup(result.data);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Find a plant</Text>
            <Text style={styles.subtitle}>Scan a QR code or enter its plant code.</Text>
          </View>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close plant lookup">
            <Ionicons name="close" size={26} color="#0F3D22" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {scanning ? (
            <View style={styles.cameraFrame}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcode}
              />
              <View pointerEvents="none" style={styles.scanTarget} />
              <TouchableOpacity style={styles.cancelScan} onPress={() => setScanning(false)}>
                <Text style={styles.cancelScanText}>Cancel scan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.scanButton} onPress={startScanning}>
              <Ionicons name="qr-code-outline" size={22} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>Scan QR code</Text>
            </TouchableOpacity>
          )}

          {cameraError && <Text style={styles.error}>{cameraError}</Text>}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR ENTER A CODE</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput
            value={code}
            onChangeText={setCode}
            onSubmitEditing={() => code.trim() && onLookup(code)}
            placeholder="e.g. PLANT-001"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Plant code"
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.lookupButton, (!code.trim() || busy) && styles.disabledButton]}
            disabled={!code.trim() || busy}
            onPress={() => onLookup(code)}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.lookupButtonText}>Look up plant</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#E8F5EC',
  },
  title: { color: '#0F3D22', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#52665A', fontSize: 13, marginTop: 4 },
  content: { padding: 20 },
  scanButton: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: '#1B5E34',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  scanButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  cameraFrame: {
    height: 300,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#102419',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  scanTarget: {
    position: 'absolute',
    alignSelf: 'center',
    width: 210,
    height: 210,
    borderWidth: 3,
    borderColor: '#D1FAE5',
    borderRadius: 18,
  },
  cancelScan: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  cancelScanText: { color: '#FFFFFF', fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 22 },
  dividerLine: { height: 1, flex: 1, backgroundColor: '#D5DED8' },
  dividerText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
  input: {
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C8D4CC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 16,
  },
  error: { color: '#B91C1C', fontSize: 13, marginTop: 10 },
  lookupButton: {
    minHeight: 50,
    borderRadius: 10,
    marginTop: 14,
    backgroundColor: '#1B5E34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: { opacity: 0.55 },
  lookupButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
