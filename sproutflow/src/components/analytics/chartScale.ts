// Pure helpers shared by the analytics charts.

/**
 * Axis ticks from 0 with a round step (1, 2, 2.5 or 5 × 10^n), e.g. max 180 → 0, 50, 100, 150, 200.
 * The last tick is always ≥ `max`.
 */
export function niceTicks(max: number, intervals = 4): number[] {
  const raw = Number.isFinite(max) && max > 0 ? max / intervals : 1;
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * exp).find((s) => s >= raw) ?? 10 * exp;
  const out: number[] = [];
  for (let i = 0; i <= intervals; i++) out.push(Math.round(i * step * 1e6) / 1e6);
  return out;
}

/** Show every Nth x label so at most `maxLabels` appear. */
export function labelStride(n: number, maxLabels: number): number {
  return n <= maxLabels ? 1 : Math.ceil(n / maxLabels);
}

/** 50 → "50", 0.25 → "0.25", 1.5 → "1.5". */
export const fmtTick = (v: number) => `${Math.round(v * 100) / 100}`;

/**
 * SVG path through the points, split at nulls. Each segment uses cubic curves whose
 * control points keep the end-point heights, so the line never overshoots the data.
 */
export function smoothPath(points: ({ x: number; y: number } | null)[]): string {
  let d = '';
  let prev: { x: number; y: number } | null = null;
  for (const p of points) {
    if (!p) {
      prev = null;
      continue;
    }
    if (!prev) d += `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    else {
      const mx = (prev.x + p.x) / 2;
      d += `C${mx.toFixed(1)} ${prev.y.toFixed(1)} ${mx.toFixed(1)} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }
    prev = p;
  }
  return d;
}
