import { useState, type JSX } from 'react';
import { RangeChart, type RangeChartProps, type RangeChartType } from './RangeChart.js';

export interface ChartCardProps extends Omit<RangeChartProps, 'type'> {
  /** Initial chart type. Default `'bar'`. */
  initialType?: RangeChartType;
  /** Chart types offered by the toolbar switcher. Default `['bar','line','area']`. */
  types?: RangeChartType[];
  /** Optional title shown at the toolbar's left. */
  title?: string;
}

const TYPE_LABEL: Record<RangeChartType, string> = { bar: '막대', line: '선', area: '영역' };

/**
 * RangeChart wrapped with an interactive type-switcher toolbar (MOD-GRID-34 G-3).
 *
 * The toolbar buttons use inline styles (not Tailwind) so they are testable in the Tailwind-less
 * storybook harness (P27-1) and visibly reflect the active type via `aria-pressed`. Clicking a
 * button re-renders the chart with the new `type` — the chart shape genuinely changes
 * (`data-chart-type`), which is the non-vacuous claim the gate checks.
 */
export function ChartCard({
  initialType = 'bar',
  types = ['bar', 'line', 'area'],
  title,
  ...chartProps
}: ChartCardProps): JSX.Element {
  const [type, setType] = useState<RangeChartType>(initialType);
  return (
    <div
      data-chart-card=""
      style={{ display: 'inline-block', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}
    >
      <div
        data-chart-toolbar=""
        style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 6 }}
      >
        {title && <span style={{ fontSize: 12, fontWeight: 600, marginRight: 8 }}>{title}</span>}
        {types.map((t) => {
          const active = t === type;
          return (
            <button
              key={t}
              type="button"
              data-type-btn={t}
              aria-pressed={active}
              onClick={() => setType(t)}
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid #d1d5db',
                background: active ? '#2563eb' : '#fff',
                color: active ? '#fff' : '#374151',
                cursor: 'pointer',
              }}
            >
              {TYPE_LABEL[t]}
            </button>
          );
        })}
      </div>
      <RangeChart type={type} {...chartProps} />
    </div>
  );
}
