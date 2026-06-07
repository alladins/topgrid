import { useRef, type JSX } from 'react';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';

/**
 * Describes one column row in a {@link ToolPanel}.
 *
 * This is a plain, self-contained shape — the panel imports no grid-core state.
 * The consumer maps its grid-core `columnVisibility` / `columnOrder` state into
 * these rows and applies the emitted callbacks back onto that state.
 */
export interface ToolPanelColumn {
  /** Column id (matches the grid's column id). */
  id: string;
  /** Human-readable label rendered next to the checkbox. */
  label: string;
  /** Whether the column is currently visible. */
  visible: boolean;
  /**
   * When `false`, the visibility checkbox is disabled (column cannot be hidden).
   * @default true
   */
  canHide?: boolean;
}

/**
 * Props for {@link ToolPanel}.
 */
export interface ToolPanelProps {
  /** Columns to list, in display order. */
  columns: ToolPanelColumn[];
  /** Fired when a column's visibility checkbox is toggled. */
  onVisibilityChange: (id: string, visible: boolean) => void;
  /**
   * Optional. When provided, up/down buttons render per row and fire this with
   * the requested move direction. The consumer reorders its `columnOrder`.
   */
  onReorder?: (id: string, direction: 'up' | 'down') => void;
  /**
   * Optional. When provided, rows become drag-to-reorder: dropping `sourceId`
   * onto `targetId` fires this (insert-before semantics — pair with grid-core
   * `reorderColumnOrder`). The panel holds NO drag state of its own; the consumer
   * feeds the reordered `columns` back. Coexists with the `onReorder` buttons.
   */
  onColumnDrop?: (sourceId: string, targetId: string) => void;
  /** Additional className appended to the root container. */
  className?: string;
}

/**
 * ToolPanel — a declarative column visibility / order control surface.
 *
 * A checkbox per column toggles visibility (`onVisibilityChange`); optional
 * up/down buttons request a reorder (`onReorder`). The panel holds no column
 * state machine of its own — it emits callbacks the consumer applies to its
 * grid-core `columnVisibility` / `columnOrder` state. It composites no grid.
 *
 * Without a valid Pro license a watermark is composited over the panel (the
 * root is `relative` so the absolutely positioned `<Watermark>` anchors to it).
 */
export function ToolPanel({
  columns,
  onVisibilityChange,
  onReorder,
  onColumnDrop,
  className,
}: ToolPanelProps): JSX.Element {
  const lic = useLicenseStatus();
  // Ref-keyed drag source (LESS-009): primary truth so synthetic dispatchEvent drives it;
  // dataTransfer is a guarded Safari fallback only. The panel stores NO order state.
  const dragSourceId = useRef<string | null>(null);
  const rootComposed = [
    'relative flex flex-col gap-1 p-2 border border-gray-200 rounded-md bg-white text-sm',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootComposed}>
      {columns.map((col, index) => (
        <div
          key={col.id}
          data-colrow={col.id}
          draggable={onColumnDrop !== undefined}
          onDragStart={
            onColumnDrop &&
            ((e) => {
              dragSourceId.current = col.id;
              try {
                e.dataTransfer?.setData('columnId', col.id);
                if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
              } catch {
                /* synthetic event has no dataTransfer — the ref carries the source */
              }
            })
          }
          onDragOver={onColumnDrop && ((e) => e.preventDefault())}
          onDrop={
            onColumnDrop &&
            ((e) => {
              e.preventDefault();
              let sourceId = dragSourceId.current;
              try {
                const dt = e.dataTransfer?.getData('columnId');
                if (dt) sourceId = dt;
              } catch {
                /* rely on the ref */
              }
              dragSourceId.current = null;
              if (sourceId && sourceId !== col.id) onColumnDrop(sourceId, col.id);
            })
          }
          className={`flex items-center gap-2${onColumnDrop !== undefined ? ' cursor-grab' : ''}`}
        >
          <label className="flex items-center gap-2 flex-1 cursor-pointer">
            <input
              type="checkbox"
              checked={col.visible}
              disabled={col.canHide === false}
              onChange={(e) => onVisibilityChange(col.id, e.target.checked)}
            />
            <span>{col.label}</span>
          </label>
          {onReorder && (
            <span className="inline-flex gap-1">
              <button
                type="button"
                aria-label={`Move ${col.label} up`}
                disabled={index === 0}
                className="px-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                onClick={() => onReorder(col.id, 'up')}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${col.label} down`}
                disabled={index === columns.length - 1}
                className="px-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                onClick={() => onReorder(col.id, 'down')}
              >
                ↓
              </button>
            </span>
          )}
        </div>
      ))}
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
