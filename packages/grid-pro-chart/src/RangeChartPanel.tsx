import type { JSX, ReactNode } from 'react';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';

/**
 * A single named numeric series passed to a {@link RangeChartPanel} renderer.
 */
export interface RangeSeries {
  /** Optional display name for the series. */
  name?: string;
  /** Numeric data points (e.g. the values inside a selected range). */
  data: number[];
}

/**
 * Props for {@link RangeChartPanel}.
 *
 * The panel is chart-library-agnostic: it does NOT import any chart library
 * (C-001 / AP-001). The consumer injects a `renderChart` callback that maps the
 * series to a `ReactNode` using whatever charting library they choose — the
 * same injection pattern as `IconCell`'s `icon: ReactNode` prop.
 *
 * @see Spec MOD-GRID-19/G-2
 */
export interface RangeChartPanelProps {
  /** Series to visualise (e.g. data captured from a range selection). */
  series: RangeSeries[];
  /**
   * Injected renderer. When provided, the panel renders `renderChart(series)`.
   * When omitted, a graceful informational placeholder is shown (never throws).
   */
  renderChart?: (series: RangeSeries[]) => ReactNode;
  /** Optional panel title. */
  title?: string;
  /** Additional className appended to the root container. */
  className?: string;
}

/**
 * Range chart panel — renders an injected chart for one or more numeric series.
 *
 * This package bundles no charting library; the caller supplies `renderChart`
 * (adapter injection, C-001 / AP-001). Without a valid Pro license a watermark
 * is composited over the panel (the root is `relative` so the absolutely
 * positioned `<Watermark>` anchors to it).
 */
export function RangeChartPanel({
  series,
  renderChart,
  title,
  className,
}: RangeChartPanelProps): JSX.Element {
  const lic = useLicenseStatus();
  const rootComposed = ['relative', className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={rootComposed}>
      {title !== undefined && (
        <div className="text-sm font-semibold text-gray-700 mb-1">{title}</div>
      )}
      {renderChart ? (
        renderChart(series)
      ) : (
        <div className="text-xs text-gray-400 italic p-2 border border-dashed border-gray-300 rounded">
          No chart renderer provided. Pass a <code>renderChart</code> prop to visualise the
          selected series.
        </div>
      )}
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
