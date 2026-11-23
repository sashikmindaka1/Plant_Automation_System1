import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AnalyticsColors as C } from '../../analytics/config';

type Props = { score: number | null; size?: number; stroke?: number };

export function scoreColor(score: number | null): string {
  if (score === null) return C.faint;
  if (score >= 70) return C.primary;
  if (score >= 40) return C.amber;
  return C.red;
}

export function scoreLabel(score: number | null): string {
  if (score === null) return 'No data';
  if (score >= 70) return 'Healthy';
  if (score >= 40) return 'Needs care';
  return 'At risk';
}

export default function HealthRing({ score, size = 120, stroke = 12 }: Props) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score === null ? 0 : Math.max(0, Math.min(100, score)) / 100;
  const color = scoreColor(score);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.primarySoft} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.value, { color }]}>{score === null ? '–' : `${score}%`}</Text>
        <Text style={styles.caption}>{scoreLabel(score)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 26, fontWeight: '800' },
  caption: { fontSize: 11, color: C.muted, fontWeight: '600', marginTop: 2 },
});
