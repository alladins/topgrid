/**
 * Cartesian chart geometry — pure, zero-dependency, node-testable (MOD-GRID-34 G-1).
 *
 * ★ This is the chart engine's SPINE: data → pixel coordinates (value→y, category→x, nice axis
 * ticks). It imports NO chart library and NO React/DOM (C-001 / AP-001) — numbers in, coords out —
 * so the non-vacuous claims are node-verifiable: "max value maps to the top pixel, min to the
 * bottom, N data points produce N coordinates, ticks are round and span the domain". Whether the
 * resulting SVG actually paints is a SEPARATE browser claim (RangeChart.tsx, chromium) — the
 * LESS-006 split: green scale math here, rendered pixels there.
 */

/** Plot margins (space reserved for axes/labels around the inner drawing region). */
export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Inner drawing region in pixel space. `right`/`bottom` are absolute edges, not widths. */
export interface PlotArea {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/** A linear value→pixel scale with its domain/range attached (for inspection/tests). */
export interface LinearScale {
  (value: number): number;
  domain: [number, number];
  range: [number, number];
}

/**
 * Linear scale mapping `domain` → `range`. A flat domain (d0===d1) maps everything to the range
 * midpoint (so a constant series draws a centred flat line, never a divide-by-zero).
 */
export function linearScale(domain: [number, number], range: [number, number]): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const fn = ((value: number): number => {
    if (span === 0) return (r0 + r1) / 2;
    return r0 + (r1 - r0) * ((value - d0) / span);
  }) as LinearScale;
  fn.domain = domain;
  fn.range = range;
  return fn;
}

/**
 * "Nice" round tick values covering [min,max] with roughly `count` intervals. The returned array
 * starts ≤ min and ends ≥ max (the niced domain), with a round step (1/2/5 × 10ⁿ). A flat input
 * (min===max) returns a single tick; non-finite input returns [].
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) return [min];
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const rawStep = (hi - lo) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const niceNorm = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  const step = niceNorm * mag;
  const niceMin = Math.floor(lo / step) * step;
  const niceMax = Math.ceil(hi / step) * step;
  const n = Math.round((niceMax - niceMin) / step);
  const ticks: number[] = [];
  for (let i = 0; i <= n; i++) {
    // round to the step's decimal precision to kill float drift (0.30000000000000004)
    const raw = niceMin + i * step;
    const decimals = Math.max(0, -Math.floor(Math.log10(step)));
    ticks.push(Number(raw.toFixed(decimals)));
  }
  return ticks;
}

/** A categorical band scale: `count` equal slots across a pixel range. */
export interface BandScale {
  count: number;
  /** Drawable bar width within a slot (slot minus padding). */
  bandwidth: number;
  /** Centre pixel of band `index` (where a bar's centre / a line vertex sits). */
  center(index: number): number;
  /** Left pixel of band `index`'s bar. */
  left(index: number): number;
}

/**
 * Band scale over `[r0,r1]` for `count` categories. `paddingRatio` (0..1) is the fraction of each
 * slot left empty as gap. Bars/vertices sit at band centres, evenly spaced and symmetric within
 * the range.
 */
export function bandScale(count: number, range: [number, number], paddingRatio = 0.2): BandScale {
  const [r0, r1] = range;
  const step = count > 0 ? (r1 - r0) / count : r1 - r0;
  const bandwidth = step * (1 - paddingRatio);
  return {
    count,
    bandwidth,
    center: (i: number) => r0 + step * i + step / 2,
    left: (i: number) => r0 + step * i + (step - bandwidth) / 2,
  };
}

/** One input series for the chart. */
export interface ChartSeries {
  name: string;
  values: number[];
  color?: string;
}

/** A single plotted vertex: pixel position + the original value/category index. */
export interface ChartPoint {
  x: number;
  y: number;
  value: number;
  index: number;
}

/** Computed pixel geometry for the whole chart — everything the renderer needs. */
export interface ChartGeometry {
  plot: PlotArea;
  yScale: LinearScale;
  yTicks: number[];
  xBand: BandScale;
  series: { name: string; color?: string; points: ChartPoint[] }[];
}

const DEFAULT_MARGIN: Margin = { top: 8, right: 8, bottom: 24, left: 36 };

/**
 * Compute the full pixel geometry for a cartesian (line/bar) chart from raw series.
 *
 * - y domain is the niced range of ALL finite values across ALL series, so axis ticks land on
 *   round numbers and every series shares one scale (comparable).
 * - x is a band scale over the longest series' length.
 * - Non-finite values (NaN/±Infinity) keep their slot index but are omitted from `points` (a gap),
 *   never silently shifting later points left.
 */
export function computeChartGeometry(
  seriesList: ChartSeries[],
  opts: { width: number; height: number; margin?: Partial<Margin> },
): ChartGeometry {
  const margin: Margin = { ...DEFAULT_MARGIN, ...opts.margin };
  const plot: PlotArea = {
    left: margin.left,
    top: margin.top,
    right: opts.width - margin.right,
    bottom: opts.height - margin.bottom,
    width: opts.width - margin.left - margin.right,
    height: opts.height - margin.top - margin.bottom,
  };

  const allFinite = seriesList.flatMap((s) => s.values.filter((v) => Number.isFinite(v)));
  const dataMin = allFinite.length ? Math.min(...allFinite) : 0;
  const dataMax = allFinite.length ? Math.max(...allFinite) : 0;
  // Bars read from a 0 baseline when all data is ≥ 0, so include 0 in the domain in that case.
  const domainMin = dataMin > 0 ? 0 : dataMin;
  const domainMax = dataMax < 0 ? 0 : dataMax;

  const yTicks = niceTicks(domainMin, domainMax);
  const yLo = yTicks.length ? yTicks[0] : domainMin;
  const yHi = yTicks.length ? yTicks[yTicks.length - 1] : domainMax;
  // higher value → smaller y (top of plot): domain[lo,hi] → range[bottom px, top px].
  const yScale = linearScale([yLo, yHi], [plot.bottom, plot.top]);

  const maxLen = seriesList.reduce((m, s) => Math.max(m, s.values.length), 0);
  const xBand = bandScale(maxLen, [plot.left, plot.right]);

  const series = seriesList.map((s) => ({
    name: s.name,
    ...(s.color !== undefined ? { color: s.color } : {}),
    points: s.values
      .map((value, index) => ({ value, index }))
      .filter((p) => Number.isFinite(p.value))
      .map((p) => ({ x: xBand.center(p.index), y: yScale(p.value), value: p.value, index: p.index })),
  }));

  return { plot, yScale, yTicks, xBand, series };
}
