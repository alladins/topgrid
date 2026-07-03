/**
 * @topgrid/grid-pro-pivot — PivotPanel component
 * MOD-GRID-64 / G-2 — drag-and-drop pivot tool panel UI.
 *
 * Four drop zones (Available / Rows / Columns / Values). Each source field renders
 * as a draggable chip; dropping it onto a zone moves it there via the pure
 * `movePivotField` transform and reports the new config through `onConfigChange`.
 *
 * HTML5 native drag API (D4 — matches GroupPanel; dnd-kit rejected for bundle size).
 * The drag source field is stored in a `useRef` (Safari fallback uses `dataTransfer`)
 * so synthetic `dispatchEvent` drives the handlers in tests (MOD-33 row-reorder pattern).
 */

import { useRef, useState } from 'react';
import type { PivotConfig } from '@topgrid/grid-pro-pivot-core';
import { movePivotField, type PivotZone } from '@topgrid/grid-pro-pivot-core';

/** dataTransfer key for the dragged field (Safari fallback alongside the ref). */
const FIELD_KEY = 'pivotField';

const ZONES: { zone: Exclude<PivotZone, 'available'>; label: string }[] = [
  { zone: 'rows', label: 'Rows' },
  { zone: 'columns', label: 'Columns' },
  { zone: 'values', label: 'Values' },
];

export interface PivotPanelProps {
  /** All source field names available for pivoting. */
  fields: string[];
  /** Current pivot configuration (controlled). */
  config: PivotConfig;
  /** Called with the next config after a field is dropped onto a zone. */
  onConfigChange: (config: PivotConfig) => void;
  /** Optional extra class on the panel container. */
  className?: string;
}

/**
 * `PivotPanel` — drag fields between Available / Rows / Columns / Values to
 * configure a pivot. Pair it with a `<PivotGrid>` driven by the same `config`
 * state so dropping a field re-pivots the grid.
 */
export function PivotPanel({
  fields,
  config,
  onConfigChange,
  className,
}: PivotPanelProps): React.ReactElement {
  const dragField = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState<PivotZone | null>(null);

  // Available = fields not assigned to any dimension.
  const assigned = new Set<string>([
    ...config.rows,
    ...config.columns,
    ...config.values.map((v) => v.field),
  ]);
  const available = fields.filter((f) => !assigned.has(f));

  const handleDrop = (zone: PivotZone) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    // Ref is the primary source (set on dragstart); it works under synthetic dispatchEvent where
    // `dataTransfer` is absent. dataTransfer is a guarded Safari fallback only (MOD-33 pattern).
    let field = dragField.current;
    try {
      const dt = e.dataTransfer?.getData(FIELD_KEY);
      if (dt) field = dt;
    } catch {
      /* synthetic event has no dataTransfer — rely on the ref */
    }
    dragField.current = null;
    if (!field) return;
    onConfigChange(movePivotField(config, field, zone));
  };

  const handleDragOver = (zone: PivotZone) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(zone);
  };

  const chip = (field: string): React.ReactElement => (
    <span
      key={field}
      data-field={field}
      draggable
      onDragStart={(e) => {
        dragField.current = field;
        try {
          e.dataTransfer?.setData(FIELD_KEY, field);
          if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
        } catch {
          /* synthetic event has no dataTransfer — the ref carries the source */
        }
      }}
      className="inline-flex cursor-grab items-center rounded bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800 select-none"
    >
      {field}
    </span>
  );

  const zoneBox = (
    zone: PivotZone,
    label: string,
    items: string[],
  ): React.ReactElement => (
    <div
      key={zone}
      data-zone={zone}
      onDragOver={handleDragOver(zone)}
      onDragLeave={() => setDragOver(null)}
      onDrop={handleDrop(zone)}
      className={`min-h-[44px] flex-1 rounded-md border p-2${
        dragOver === zone
          ? ' border-dashed border-blue-400 bg-blue-50'
          : ' border-gray-300 bg-gray-50'
      }`}
    >
      <div className="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {items.length === 0 ? (
          <span className="text-xs text-gray-400">—</span>
        ) : (
          items.map(chip)
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-col gap-2${className !== undefined ? ` ${className}` : ''}`}
    >
      {zoneBox('available', 'Available', available)}
      <div className="flex gap-2">
        {ZONES.map(({ zone, label }) =>
          zoneBox(
            zone,
            label,
            zone === 'values' ? config.values.map((v) => v.field) : config[zone],
          ),
        )}
      </div>
    </div>
  );
}
