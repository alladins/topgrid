import { useMemo, useRef, useState, type JSX } from 'react';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';
import type { MatrixChartData } from '@topgrid/grid-pro-chart';
import { matrixToEChartsOption, type EnterpriseChartType } from './internal/matrixToEChartsOption.js';
import { EChartsChart, type ChartSelection, type EChartsInstance } from './EChartsChart.js';

/**
 * Enterprise chart panel — toolbar (type switch) + export + cross-filter over the existing
 * grid-pro-chart range/pivot bridge data (`MatrixChartData`).
 *
 * ADR-003 R1: enterprise concerns (toolbar/export/cross-filter) live HERE, in their own panel — the
 * minimal `RangeChartPanel`/`RangeSeries` seam in grid-pro-chart stays untouched (C-001). Without a
 * valid Pro license a watermark is composited over the panel (PAT-003).
 */

/** Types offered in the toolbar (subset of the implemented catalog). */
const TOOLBAR_TYPES: EnterpriseChartType[] = ['bar', 'line', 'area', 'stacked-bar', 'pie', 'scatter'];

export interface EnterpriseChartPanelProps {
  /** Bridge output — `seriesFromMatrix(...)` / `seriesFromPivot(...)`. */
  data: MatrixChartData;
  initialType?: EnterpriseChartType;
  enableToolbar?: boolean;
  enableExport?: boolean;
  /** Fires on chart datum click — map to a grid filter for cross-filtering. */
  onCrossFilter?: (sel: ChartSelection) => void;
  title?: string;
  className?: string;
}

export function EnterpriseChartPanel({
  data,
  initialType = 'bar',
  enableToolbar = true,
  enableExport = true,
  onCrossFilter,
  title,
  className,
}: EnterpriseChartPanelProps): JSX.Element {
  const lic = useLicenseStatus();
  const [type, setType] = useState<EnterpriseChartType>(initialType);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsInstance | null>(null);

  const option = useMemo(() => matrixToEChartsOption(data, { type }), [data, type]);

  const handleExport = (): void => {
    const chart = chartRef.current;
    if (!chart) return;
    const url = chart.getDataURL({ type: 'svg' });
    // Reflect the export result so a test (and a real "download" handler) can observe it succeeded.
    rootRef.current?.setAttribute('data-export-result-len', String(url.length));
  };

  const rootClass = ['relative', className ?? ''].filter(Boolean).join(' ');

  return (
    <div ref={rootRef} className={rootClass} style={{ position: 'relative' }} data-chart-type={type}>
      {title !== undefined && (
        <div className="text-sm font-semibold text-gray-700 mb-1">{title}</div>
      )}
      {enableToolbar && (
        <div data-chart-toolbar style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          {TOOLBAR_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              data-chart-type-btn={t}
              aria-pressed={t === type}
              onClick={() => setType(t)}
            >
              {t}
            </button>
          ))}
          {enableExport && (
            <button type="button" data-chart-export onClick={handleExport}>
              Export
            </button>
          )}
        </div>
      )}
      <EChartsChart
        option={option}
        onInit={(c) => {
          chartRef.current = c;
        }}
        // exactOptionalPropertyTypes: pass onSelect only when defined (no explicit undefined).
        {...(onCrossFilter ? { onSelect: onCrossFilter } : {})}
      />
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
