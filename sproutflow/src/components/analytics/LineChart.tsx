import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { AnalyticsColors as C } from '../../analytics/config';
import { fmtTick, labelStride, niceTicks, smoothPath } from './chartScale';

export type LineSeries = {
  key: string;
  color: string;
  values: (number | null)[];
  /** Opacity of the area fill right under the line; it fades to 0 at the base. */
  fillOpacity?: number;
};

type Props = {
  labels: string[];
  /** Drawn in order, so the last series ends up on top. */
  series: LineSeries[];
  height?: number;
  /** Unique per chart on the screen; used for gradient ids. */
  chartId: string;
  accessibilityLabel?: string;
};

const PAD = { left: 30, right: 10, top: 10, bottom: 26 };
/** Keeps the first and last x labels clear of the y labels and the card edge. */
const INSET_X = 14;

/** Smooth two-line area chart from the Analytics mockup ("7-day Moisture Trends"). */
export default function LineChart({ labels, series, height = 180, chartId, accessibilityLabel }: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  const n = labels.length;
  const all = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  const yTicks = niceTicks(all.length > 0 ? Math.max(...all) : 0);
  const yMax = yTicks[yTicks.length - 1];
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const baseY = PAD.top + plotH;
  const xSpan = Math.max(0, plotW - INSET_X * 2);
  const x = (i: number) => PAD.left + INSET_X + (n <= 1 ? xSpan / 2 : (i * xSpan) / (n - 1));
  const y = (v: number) => baseY - (Math.min(yMax, Math.max(0, v)) / yMax) * plotH;

  const drawn = series.map((s) => {
    const pts = s.values.map((v, i) => (v === null ? null : { x: x(i), y: y(v) }));
    // Area under each continuous run of the line (a gap in the data breaks the run).
    const areas: string[] = [];
    let run: { x: number; y: number }[] = [];
    const flush = () => {
      if (run.length > 1) {
        const first = run[0];
        const last = run[run.length - 1];
        areas.push(`${smoothPath(run)}L${last.x.toFixed(1)} ${baseY}L${first.x.toFixed(1)} ${baseY}Z`);
      }
      run = [];
    };
    pts.forEach((p) => (p ? run.push(p) : flush()));
    flush();
    return { s, line: smoothPath(pts), areas };
  });

  const stride = labelStride(n, 7);

  return (
    <View style={[styles.wrap, { height }]} onLayout={onLayout} accessible accessibilityLabel={accessibilityLabel}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            {series.map((s) => (
              <LinearGradient key={s.key} id={`${chartId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={s.color} stopOpacity={s.fillOpacity ?? 0.25} />
                <Stop offset="1" stopColor={s.color} stopOpacity={0} />
              </LinearGradient>
            ))}
          </Defs>

          {yTicks.map((t) => (
            <G key={`y${t}`}>
              <Line x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} stroke={C.grid} strokeWidth={1} />
              <SvgText x={PAD.left - 8} y={y(t) + 4} fontSize={11} fill={C.faint} textAnchor="end">
                {fmtTick(t)}
              </SvgText>
            </G>
          ))}

          {drawn.map(({ s, areas }) =>
            areas.map((d, i) => <Path key={`${s.key}-a${i}`} d={d} fill={`url(#${chartId}-${s.key})`} />),
          )}
          {drawn.map(({ s, line }) => (
            <Path
              key={`${s.key}-l`}
              d={line}
              stroke={s.color}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {labels.map((l, i) =>
            i % stride === 0 || i === n - 1 ? (
              <SvgText key={`x${i}`} x={x(i)} y={height - 6} fontSize={11} fill={C.muted} textAnchor="middle">
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
