import { useState, type JSX } from 'react';
import { RangeChart, type RangeChartProps, type RangeChartType } from './RangeChart.js';

/** Where the settings/type toolbar docks relative to the chart (MOD-GRID-72 composition). */
export type ChartDock = 'top' | 'bottom' | 'left' | 'right';

export interface ChartCardProps extends Omit<RangeChartProps, 'type'> {
  /** Initial chart type. Default `'bar'`. */
  initialType?: RangeChartType;
  /** Chart types offered by the toolbar switcher. Default `['bar','line','area']`. */
  types?: RangeChartType[];
  /** Optional title shown at the toolbar's left. */
  title?: string;
  /**
   * MOD-GRID-72: where the type/settings toolbar docks relative to the chart (composition). Inline
   * flex (P27-1 — Tailwind inert in the harness). `'top'`/`'bottom'` stack; `'left'`/`'right'` place
   * the toolbar beside the chart. @default 'top'
   */
  dock?: ChartDock;
}

/** Flex direction that docks the toolbar before/after the chart on the given side. */
const DOCK_FLEX: Record<ChartDock, 'column' | 'column-reverse' | 'row' | 'row-reverse'> = {
  top: 'column',
  bottom: 'column-reverse',
  left: 'row',
  right: 'row-reverse',
};

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
  dock = 'top',
  ...chartProps
}: ChartCardProps): JSX.Element {
  const [type, setType] = useState<RangeChartType>(initialType);
  const horizontal = dock === 'left' || dock === 'right';
  return (
    <div
      data-chart-card=""
      data-chart-dock={dock}
      style={{
        display: 'inline-flex',
        flexDirection: DOCK_FLEX[dock],
        gap: 6,
        alignItems: horizontal ? 'flex-start' : 'stretch',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        padding: 8,
      }}
    >
      <div
        data-chart-toolbar=""
        style={{
          display: 'flex',
          flexDirection: horizontal ? 'column' : 'row',
          gap: 4,
          alignItems: horizontal ? 'flex-start' : 'center',
        }}
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
