import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { G, Line, Path, Text as SvgText } from 'react-native-svg';

import { AnalyticsColors as C } from '../../analytics/config';
import { fmtTick, labelStride, niceTicks } from './chartScale';

export type BarSeries = { key: string; color: string; values: number[] };

type Props = {
  labels: string[];
  /** Drawn side by side within each group, left to right. */
  series: BarSeries[];
  height?: number;
  accessibilityLabel?: string;
};

const PAD = { left: 30, right: 6, top: 10, bottom: 26 };
const PAIR_GAP = 2;

/** A bar with rounded top corners and a flat base. */
function barPath(x: number, w: number, top: number, base: number): string {
  const h = base - top;
  if (h <= 0) return '';
  const r = Math.min(3, w / 2, h);
  return `M${x} ${base}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + w - r}Q${x + w} ${top} ${x + w} ${top + r}V${base}Z`;
}

/** Grouped bar chart from the Analytics mockup ("Water Usage"). */
export default function BarChart({ labels, series, height = 180, accessibilityLabel }: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  const n = labels.length;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const base = PAD.top + plotH;
  const yTicks = niceTicks(Math.max(0, ...series.flatMap((s) => s.values)));
  const yMax = yTicks[yTicks.length - 1];
  const h = (v: number) => (Math.min(yMax, Math.max(0, v)) / yMax) * plotH;
  const slot = n > 0 ? plotW / n : 0;
  const bw = Math.max(4, Math.min(14, slot * 0.24));
  const groupW = bw * series.length + PAIR_GAP * Math.max(0, series.length - 1);
  const stride = labelStride(n, 7);

  return (
    <View style={[styles.wrap, { height }]} onLayout={onLayout} accessible accessibilityLabel={accessibilityLabel}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {yTicks.map((t) => {
            const yy = base - h(t);
            return (
              <G key={`y${t}`}>
                <Line x1={PAD.left} x2={PAD.left + plotW} y1={yy} y2={yy} stroke={C.grid} strokeWidth={1} />
                <SvgText x={PAD.left - 8} y={yy + 4} fontSize={11} fill={C.faint} textAnchor="end">
                  {fmtTick(t)}
                </SvgText>
              </G>
            );
          })}

          {labels.map((_, i) => {
            const gx = PAD.left + slot * i + (slot - groupW) / 2;
            return (
              <G key={`g${i}`}>
                {series.map((s, si) => {
                  const d = barPath(gx + si * (bw + PAIR_GAP), bw, base - h(s.values[i] ?? 0), base);
                  return d ? <Path key={s.key} d={d} fill={s.color} /> : null;
                })}
              </G>
            );
          })}

          {labels.map((l, i) =>
            i % stride === 0 || i === n - 1 ? (
              <SvgText key={`x${i}`} x={PAD.left + slot * i + slot / 2} y={height - 6} fontSize={11} fill={C.muted} textAnchor="middle">
                {l}
              </SvgText>
            ) : null,
          )}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
});
