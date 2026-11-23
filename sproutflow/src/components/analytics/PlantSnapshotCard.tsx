import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { AnalyticsColors as C } from '../../analytics/config';

export type SnapshotCheck = { ok: boolean; title: string; detail: string };

type Props = { title: string; checks: SnapshotCheck[] };

const PLANT_PHOTO = require('../../../assets/images/plant-snapshot.jpg');

/** Photo on the left, pass/fail checklist on the right (layout from the design's wizard card). */
export default function PlantSnapshotCard({ title, checks }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.inner}>
        <Image source={PLANT_PHOTO} style={styles.photo} contentFit="cover" accessibilityLabel="Potted plant" />
        <View style={styles.list}>
          {checks.map((c) => (
            <View key={c.title} style={styles.row}>
              <Ionicons name={c.ok ? 'checkmark-circle' : 'close-circle'} size={20} color={c.ok ? C.primary : C.red} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{c.title}</Text>
                <Text style={styles.rowDetail}>{c.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#0F2A1B',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 10 },
  inner: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.grid,
  },
  photo: { width: '42%', minHeight: 150, backgroundColor: C.primaryTint },
  list: { flex: 1, backgroundColor: C.card, paddingVertical: 12, paddingHorizontal: 12, gap: 12, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowText: { flex: 1 },
  rowTitle: { color: C.text, fontSize: 13, fontWeight: '700' },
  rowDetail: { color: C.muted, fontSize: 11, marginTop: 1 },
});
