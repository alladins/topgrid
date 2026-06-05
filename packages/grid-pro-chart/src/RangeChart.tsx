import type { JSX } from 'react';
import { computeChartGeometry, type ChartSeries } from './internal/chartScale.js';

/** Cartesian chart type. line/bar share the same scale + axis machinery (MOD-GRID-34 G-1). */
export type RangeChartType = 'line' | 'bar';

export interface RangeChartProps {
  /** Series to plot. Each `values[i]` shares category slot `i` across series. */
  series: ChartSeries[];
  /** Chart shape. Default `'bar'`. */
  type?: RangeChartType;
  /** SVG width in px. Default `360`. */
  width?: number;
  /** SVG height in px. Default `200`. */
  height?: number;
  /** Optional category labels for the x-axis (one per slot). */
  categories?: string[];
  /** Accessible label for the chart. Default `'chart'`. */
  ariaLabel?: string;
  /** className appended to the root `<svg>`. */
  className?: string;
}

/** Zero-dep default palette (no chart library — C-001/AP-001). */
const PALETTE = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];

/**
 * Built-in cartesian range chart — pure SVG, zero chart-library dependency (C-001/AP-001).
 *
 * Layout/scaling is delegated to {@link computeChartGeometry} (the node-tested core); this
 * component only turns the computed pixel coordinates into `<rect>`/`<polyline>`/axis elements.
 * That split is deliberate (LESS-006): the scale math is proven in node, the paint is proven in
 * the browser. Rich charts beyond this can still be injected via {@link RangeChartPanel}.
 */
export function RangeChart({
  series,
  type = 'bar',
  width = 360,
  height = 200,
  categories,
  ariaLabel = 'chart',
  className,
}: RangeChartProps): JSX.Element {
  const geo = computeChartGeometry(series, { width, height });
  const { plot, yScale, yTicks, xBand } = geo;
  const baselineY = yScale(0 >= yTicks[0] && 0 <= yTicks[yTicks.length - 1] ? 0 : yTicks[0]);

  const colorOf = (i: number, s: { color?: string }) => s.color ?? PALETTE[i % PALETTE.length];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      data-chart-type={type}
      {...(className !== undefined ? { className } : {})}
    >
      {/* y gridlines + tick labels */}
      {yTicks.map((t) => {
        const y = yScale(t);
        return (
          <g key={`yt-${t}`} data-tick={t}>
            <line
              x1={plot.left}
              y1={y}
              x2={plot.right}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <text
              x={plot.left - 4}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill="#6b7280"
            >
              {t}
            </text>
          </g>
        );
      })}

      {/* x baseline (value 0 / domain floor) */}
      <line
        x1={plot.left}
        y1={baselineY}
        x2={plot.right}
        y2={baselineY}
        stroke="#9ca3af"
        strokeWidth={1}
      />

      {/* category labels */}
      {categories?.map((c, i) =>
        i < xBand.count ? (
          <text
            key={`xc-${i}`}
            x={xBand.center(i)}
            y={plot.bottom + 14}
            textAnchor="middle"
            fontSize={10}
            fill="#6b7280"
          >
            {c}
          </text>
        ) : null,
      )}

      {/* series */}
      {geo.series.map((s, si) => {
        const color = colorOf(si, s);
        if (type === 'line') {
          const pointsAttr = s.points.map((p) => `${p.x},${p.y}`).join(' ');
          return (
            <g key={`s-${s.name}`} data-series={s.name}>
              <polyline points={pointsAttr} fill="none" stroke={color} strokeWidth={2} />
              {s.points.map((p) => (
                <circle key={p.index} cx={p.x} cy={p.y} r={2.5} fill={color} />
              ))}
            </g>
          );
        }
        // bar: group bars of multiple series side-by-side within each band slot.
        const groupW = xBand.bandwidth;
        const barW = groupW / Math.max(1, geo.series.length);
        return (
          <g key={`s-${s.name}`} data-series={s.name}>
            {s.points.map((p) => {
              const x = p.x - groupW / 2 + barW * si;
              const top = Math.min(p.y, baselineY);
              const h = Math.max(1, Math.abs(baselineY - p.y));
              return (
                <rect
                  key={p.index}
                  x={x}
                  y={top}
                  width={Math.max(1, barW * 0.9)}
                  height={h}
                  fill={color}
                  data-value={p.value}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
