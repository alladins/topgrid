import type { JSX } from 'react';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';

/**
 * MOD-GRID-59 — FiltersToolPanel: a unified panel listing every column's filter in one surface.
 *
 * XX Grid filters tool panel 대응: 흩어진 floating filter 대신 모든 컬럼 필터를 한 패널에 모아 편집하고
 * 활성 필터 수를 집계한다. ToolPanel 과 동일한 callback-only 철학 — 패널은 grid 상태를 보유하지 않고
 * `onFilterChange` 를 emit, 소비자가 grid 필터 상태에 적용한다. SideBar(MOD-58)에 host 가능.
 */

/** One column's filter row in {@link FiltersToolPanel}. */
export interface FiltersToolPanelColumn {
  /** Column id. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Current filter value (empty string = inactive). */
  value: string;
}

/** Props for {@link FiltersToolPanel}. */
export interface FiltersToolPanelProps {
  /** Columns with their current filter values, in display order. */
  columns: FiltersToolPanelColumn[];
  /** Fired when a column's filter input changes. */
  onFilterChange: (id: string, value: string) => void;
  /** Optional — when provided, a "Clear all" button clears every filter. */
  onClearAll?: () => void;
  /** Text shown when there are no columns. */
  emptyText?: string;
  /** Additional className appended to the root container. */
  className?: string;
}

const isActive = (v: string): boolean => v.trim() !== '';

/**
 * FiltersToolPanel — unified column-filter editing surface with an active-filter count.
 * Callback-only (no grid state). Pro watermark composited when unlicensed (root is `relative`).
 */
export function FiltersToolPanel({
  columns,
  onFilterChange,
  onClearAll,
  emptyText = 'No columns',
  className,
}: FiltersToolPanelProps): JSX.Element {
  const lic = useLicenseStatus();
  const activeCount = columns.filter((c) => isActive(c.value)).length;
  const rootComposed = ['relative', 'border', 'rounded', 'p-2', 'inline-block', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootComposed} data-filters-panel="">
      <div className="flex items-center justify-between mb-2 text-xs text-gray-600">
        <span data-active-count="">{activeCount}</span>
        <span> active filter(s)</span>
        {onClearAll !== undefined && (
          <button
            type="button"
            data-clear-all=""
            onClick={onClearAll}
            disabled={activeCount === 0}
            className="ml-2 px-2 py-0.5 border rounded disabled:opacity-40 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>
      {columns.length === 0 ? (
        <div className="text-sm text-gray-400">{emptyText}</div>
      ) : (
        columns.map((col) => (
          <label key={col.id} data-filter-row={col.id} className="flex items-center gap-2 py-1">
            <span className="w-20 text-sm">{col.label}</span>
            <input
              type="text"
              value={col.value}
              onChange={(e) => onFilterChange(col.id, e.target.value)}
              aria-label={`filter ${col.label}`}
              data-filter-input={col.id}
              className="border rounded px-1 py-0.5 text-sm"
            />
            {isActive(col.value) && (
              <span data-filter-active={col.id} aria-hidden="true" className="text-blue-500">
                ●
              </span>
            )}
          </label>
        ))
      )}
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
