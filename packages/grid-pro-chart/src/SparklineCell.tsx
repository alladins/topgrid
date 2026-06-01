import type { JSX } from 'react';

/**
 * Sparkline render type.
 * - `line`     polyline through the points.
 * - `bar`      one column per value, scaled to the series range.
 * - `area`     filled polygon under the line.
 * - `win-loss` 0-baseline bars: above for >0, below for <0, nothing for 0.
 */
export type SparklineType = 'line' | 'bar' | 'area' | 'win-loss';

/**
 * Props for {@link SparklineCell}.
 *
 * Zero-dependency inline mini-chart rendered as pure SVG (no chart library
 * import — C-001 / AP-001). Safe with empty input (dash placeholder) and
 * non-finite values (NaN/Infinity are skipped before scaling).
 *
 * @see Spec MOD-GRID-19/G-1
 */
export interface SparklineCellProps {
  /** Data points. Empty array → dash placeholder. NaN/Infinity entries are skipped. */
  values: number[];
  /** Sparkline shape. Default `'line'`. */
  type?: SparklineType;
  /** Stroke/fill colour (any CSS colour). Default `'currentColor'`. */
  color?: string;
  /** SVG width in px. Default `80`. */
  width?: number;
  /** SVG height in px. Default `20`. */
  height?: number;
  /** Additional className appended to the root `<svg>`. */
  className?: string;
}

/** Keep only finite numbers (drops NaN/±Infinity). */
function finiteValues(values: number[]): number[] {
  return values.filter((v) => Number.isFinite(v));
}

/** Map a value into a y pixel (higher value → smaller y). Constant series → mid-height. */
function scaleY(value: number, min: number, max: number, height: number, pad: number): number {
  const span = max - min;
  const inner = height - pad * 2;
  if (span === 0) return pad + inner / 2;
  return pad + inner * (1 - (value - min) / span);
}

/** Evenly distribute n points across the inner width. Single point → centred. */
function xAt(index: number, count: number, width: number, pad: number): number {
  const inner = width - pad * 2;
  if (count <= 1) return pad + inner / 2;
  return pad + (inner * index) / (count - 1);
}

/**
 * Sparkline cell — compact inline SVG chart for a numeric series.
 *
 * Library-agnostic and zero-dependency: the chart is drawn with native SVG
 * `<polyline>`/`<polygon>`/`<rect>` elements, so no charting peer is required
 * (C-001 / AP-001 — the package imports no chart library).
 */
export function SparklineCell({
  values,
  type = 'line',
  color = 'currentColor',
  width = 80,
  height = 20,
  className,
}: SparklineCellProps): JSX.Element {
  const data = finiteValues(values);
  const pad = 2;

  // Empty (or all non-finite) → dash placeholder, not an empty/degenerate chart.
  if (data.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="no data"
        {...(className !== undefined ? { className } : {})}
      >
        <line
          x1={pad}
          y1={height / 2}
          x2={width - pad}
          y2={height / 2}
          stroke={color}
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.4}
        />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);

  const svgProps = {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    role: 'img' as const,
    ...(className !== undefined ? { className } : {}),
  };

  if (type === 'win-loss') {
    const inner = height - pad * 2;
    const half = inner / 2;
    const mid = pad + half;
    // Equal-width columns; positive → up from baseline, negative → down, 0 → nothing.
    const slot = (width - pad * 2) / data.length;
    const barW = Math.max(1, slot * 0.6);
    return (
      <svg {...svgProps}>
        {data.map((v, i) => {
          if (v === 0) return null;
          const x = pad + slot * i + (slot - barW) / 2;
          const h = half;
          const y = v > 0 ? mid - h : mid;
          return <rect key={i} x={x} y={y} width={barW} height={h} fill={color} />;
        })}
      </svg>
    );
  }

  if (type === 'bar') {
    const slot = (width - pad * 2) / data.length;
    const barW = Math.max(1, slot * 0.6);
    const baseY = height - pad;
    return (
      <svg {...svgProps}>
        {data.map((v, i) => {
          const topY = scaleY(v, min, max, height, pad);
          const x = pad + slot * i + (slot - barW) / 2;
          const h = Math.max(1, baseY - topY);
          return <rect key={i} x={x} y={baseY - h} width={barW} height={h} fill={color} />;
        })}
      </svg>
    );
  }

  // line / area share the same point string.
  const points = data
    .map((v, i) => `${xAt(i, data.length, width, pad)},${scaleY(v, min, max, height, pad)}`)
    .join(' ');

  if (type === 'area') {
    const x0 = xAt(0, data.length, width, pad);
    const xN = xAt(data.length - 1, data.length, width, pad);
    const baseY = height - pad;
    const areaPoints = `${x0},${baseY} ${points} ${xN},${baseY}`;
    return (
      <svg {...svgProps}>
        <polygon points={areaPoints} fill={color} opacity={0.25} />
        <polyline points={points} fill="none" stroke={color} strokeWidth={1} />
      </svg>
    );
  }

  // line
  return (
    <svg {...svgProps}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1} />
    </svg>
  );
}
