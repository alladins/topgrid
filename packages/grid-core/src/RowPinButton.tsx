import type { JSX, MouseEvent as ReactMouseEvent } from 'react';
import type { Row } from '@tanstack/react-table';

/**
 * @topgrid/grid-core — RowPinButton (per-row pin control) — MOD-GRID-39 G-2.
 *
 * Place in a column cell (`cell: ({ row }) => <RowPinButton row={row} />`) to let users pin a data
 * row to the top/bottom (sticky) or unpin it. Requires `<Grid enableRowPinning />`. Inline styles
 * (Tailwind is inert in the headless storybook — P27-1). ★ Every click `stopPropagation`s so pinning
 * does not also trigger row-click selection / onRowClick.
 */
export interface RowPinButtonProps<TData> {
  row: Row<TData>;
}

const btnStyle = (active: boolean): React.CSSProperties => ({
  fontSize: 11,
  lineHeight: 1,
  padding: '1px 4px',
  marginRight: 2,
  cursor: 'pointer',
  border: '1px solid #d1d5db',
  borderRadius: 3,
  background: active ? '#2563eb' : '#fff',
  color: active ? '#fff' : '#374151',
});

export function RowPinButton<TData>({ row }: RowPinButtonProps<TData>): JSX.Element {
  const pinned = row.getIsPinned(); // 'top' | 'bottom' | false
  const act = (run: () => void) => (e: ReactMouseEvent): void => {
    e.stopPropagation();
    run();
  };
  return (
    <span data-row-pin="" style={{ display: 'inline-flex', whiteSpace: 'nowrap' }}>
      <button
        type="button"
        data-pin-action="top"
        aria-pressed={pinned === 'top'}
        aria-label="행 상단 고정"
        onClick={act(() => row.pin('top'))}
        style={btnStyle(pinned === 'top')}
      >
        ▲
      </button>
      <button
        type="button"
        data-pin-action="bottom"
        aria-pressed={pinned === 'bottom'}
        aria-label="행 하단 고정"
        onClick={act(() => row.pin('bottom'))}
        style={btnStyle(pinned === 'bottom')}
      >
        ▼
      </button>
      {pinned !== false && (
        <button
          type="button"
          data-pin-action="unpin"
          aria-label="행 고정 해제"
          onClick={act(() => row.pin(false))}
          style={btnStyle(false)}
        >
          ✕
        </button>
      )}
    </span>
  );
}
