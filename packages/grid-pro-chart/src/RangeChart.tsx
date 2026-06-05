import { useState, type JSX } from 'react';
import { computeChartGeometry, type ChartSeries } from './internal/chartScale.js';

/** Cartesian chart type. line/bar/area all share the same scale + axis machinery (MOD-GRID-34). */
export type RangeChartType = 'line' | 'bar' | 'area';

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
  /** Show the series legend (swatch + name). Default `true`. */
  showLegend?: boolean;
  /** Show a value tooltip on hover. Default `true`. */
  showTooltip?: boolean;
  /** Accessible label for the chart. Default `'chart'`. */
  ariaLabel?: string;
  /** className appended to the root `<svg>`. */
  className?: string;
}

/** Zero-dep default palette (no chart library — C-001/AP-001). */
const PALETTE = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];

/**
 * Single source of truth for a series' colour — BOTH the legend swatch and the drawn marks read
 * this, so the legend can never desync from the bars/line (advisor: legend↔series colour coupling).
 */
function colorOf(index: number, series: { color?: string }): string {
  return series.color ?? PALETTE[index % PALETTE.length];
}

interface HoverState {
  x: number;
  y: number;
  value: number;
  name: string;
}

/**
 * Built-in cartesian range chart — pure SVG, zero chart-library dependency (C-001/AP-001).
 *
 * Layout/scaling is delegated to {@link computeChartGeometry} (the node-tested core); this
 * component turns the computed pixel coordinates into `<rect>`/`<polyline>`/`<polygon>`/axis
 * elements, plus an in-SVG legend and hover tooltip (kept INSIDE the `<svg>` — no HTML overlay —
 * to stay consistent with the pure-SVG decision and avoid a wrapper-positioning refactor).
 */
export function RangeChart({
  series,
  type = 'bar',
  width = 360,
  height = 200,
  categories,
  showLegend = true,
  showTooltip = true,
  ariaLabel = 'chart',
  className,
}: RangeChartProps): JSX.Element {
  const [hover, setHover] = useState<HoverState | null>(null);

  const legendH = showLegend && series.length > 0 ? 18 : 0;
  const geo = computeChartGeometry(series, { width, height, margin: { top: 8 + legendH } });
  const { plot, yScale, yTicks, xBand } = geo;
  const zeroInDomain = 0 >= yTicks[0] && 0 <= yTicks[yTicks.length - 1];
  const baselineY = yScale(zeroInDomain ? 0 : yTicks[0]);

  const onEnter = (h: HoverState) => () => showTooltip && setHover(h);
  const onLeave = () => setHover(null);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      data-chart-type={type}
      onMouseLeave={onLeave}
      {...(className !== undefined ? { className } : {})}
    >
      {/* legend (top strip) — same colorOf as the marks */}
      {legendH > 0 &&
        geo.series.map((s, si) => (
          <g key={`lg-${s.name}`} data-legend={s.name} transform={`translate(${plot.left + si * 110}, 4)`}>
            <rect x={0} y={2} width={10} height={10} rx={2} fill={colorOf(si, s)} />
            <text x={14} y={11} fontSize={10} fill="#374151">
              {s.name}
            </text>
          </g>
        ))}

      {/* y gridlines + tick labels */}
      {yTicks.map((t) => {
        const y = yScale(t);
        return (
          <g key={`yt-${t}`} data-tick={t}>
            <line x1={plot.left} y1={y} x2={plot.right} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={plot.left - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#6b7280">
              {t}
            </text>
          </g>
        );
      })}

      {/* x baseline (value 0 / domain floor) */}
      <line x1={plot.left} y1={baselineY} x2={plot.right} y2={baselineY} stroke="#9ca3af" strokeWidth={1} />

      {/* category labels */}
      {categories?.map((c, i) =>
        i < xBand.count ? (
          <text key={`xc-${i}`} x={xBand.center(i)} y={plot.bottom + 14} textAnchor="middle" fontSize={10} fill="#6b7280">
            {c}
          </text>
        ) : null,
      )}

      {/* series */}
      {geo.series.map((s, si) => {
        const color = colorOf(si, s);

        if (type === 'line' || type === 'area') {
          const pts = s.points.map((p) => `${p.x},${p.y}`).join(' ');
          const first = s.points[0];
          const last = s.points[s.points.length - 1];
          return (
            <g key={`s-${s.name}`} data-series={s.name}>
              {type === 'area' && first && last && (
                <polygon
                  data-area={s.name}
                  points={`${first.x},${baselineY} ${pts} ${last.x},${baselineY}`}
                  fill={color}
                  opacity={0.18}
                />
              )}
              <polyline points={pts} fill="none" stroke={color} strokeWidth={2} />
              {s.points.map((p) => (
                <circle
                  key={p.index}
                  cx={p.x}
                  cy={p.y}
                  r={3}
                  fill={color}
                  data-value={p.value}
                  onMouseEnter={onEnter({ x: p.x, y: p.y, value: p.value, name: s.name })}
                />
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
                  onMouseEnter={onEnter({ x: x + barW / 2, y: top, value: p.value, name: s.name })}
                />
              );
            })}
          </g>
        );
      })}

      {/* tooltip — rendered LAST so it sits on top. x clamped to the plot's right edge. */}
      {hover && (() => {
        const label = `${hover.name}: ${hover.value}`;
        const boxW = label.length * 6.2 + 12;
        const boxH = 18;
        const tx = Math.min(hover.x + 8, plot.right - boxW);
        const ty = Math.max(hover.y - boxH - 4, plot.top);
        return (
          <g data-tooltip="" pointerEvents="none">
            <rect x={tx} y={ty} width={boxW} height={boxH} rx={3} fill="#111827" opacity={0.92} />
            <text x={tx + 6} y={ty + 12} fontSize={10} fill="#ffffff">
              {label}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
