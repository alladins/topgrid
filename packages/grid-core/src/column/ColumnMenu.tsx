/**
 * @topgrid/grid-core — ColumnMenu (per-header dropdown: sort / pin / hide actions).
 *
 * MOD-GRID-38: AG-style column header menu. Consumer places it in a column header
 * (`header: ({ column }) => <span>이름 <ColumnMenu column={column} /></span>`), matching the
 * existing opt-in header-control pattern (MultiFilter / FloatingFilter) rather than auto-injecting
 * into the header pipeline (which would collide with col-virt / ARIA / the multi-sort click handler).
 *
 * - Native `<details>/<summary>` dropdown (no Radix / no new peerDep — C-22).
 * - ★ Every interaction `stopPropagation`s: the menu lives INSIDE the `<th>`, whose own click
 *   handler sorts the column — without this, opening the menu (or clicking an item) would also fire
 *   the header sort. The menu's actions drive sorting explicitly, so the th handler must not also run.
 * - Inline styles (Tailwind is inert in the headless storybook — P27-1) so the menu is testable.
 *
 * G-1 = sort actions. Pin (G-2) and hide (G-3) items are added in later goals.
 */

import { useRef, type JSX, type MouseEvent as ReactMouseEvent } from 'react';
import type { Column } from '@tanstack/react-table';

export interface ColumnMenuProps<TData> {
  /** The TanStack `Column` this menu acts on. */
  column: Column<TData, unknown>;
  /** Trigger glyph/label. @default '⋮' */
  label?: string;
}

interface MenuItem {
  key: string;
  label: string;
  run: () => void;
  show: boolean;
}

/** Per-column header menu. Returns null if the column exposes no applicable actions. */
export function ColumnMenu<TData>({ column, label = '⋮' }: ColumnMenuProps<TData>): JSX.Element | null {
  const ref = useRef<HTMLDetailsElement>(null);
  const close = (): void => {
    if (ref.current) ref.current.open = false;
  };
  // ★ stopPropagation so the enclosing <th> sort handler does not also fire.
  const act = (run: () => void) => (e: ReactMouseEvent): void => {
    e.stopPropagation();
    run();
    close();
  };

  const canSort = column.getCanSort();
  const canPin = column.getCanPin();
  const pinned = column.getIsPinned();
  const items: MenuItem[] = [
    { key: 'sort-asc', label: '오름차순 정렬', run: () => column.toggleSorting(false), show: canSort },
    { key: 'sort-desc', label: '내림차순 정렬', run: () => column.toggleSorting(true), show: canSort },
    {
      key: 'sort-clear',
      label: '정렬 해제',
      run: () => column.clearSorting(),
      show: canSort && column.getIsSorted() !== false,
    },
    // MOD-GRID-38 G-2: pin actions — move the column into the pinned-left/right region.
    { key: 'pin-left', label: '왼쪽 고정', run: () => column.pin('left'), show: canPin && pinned !== 'left' },
    { key: 'pin-right', label: '오른쪽 고정', run: () => column.pin('right'), show: canPin && pinned !== 'right' },
    { key: 'pin-clear', label: '고정 해제', run: () => column.pin(false), show: canPin && pinned !== false },
    // MOD-GRID-38 G-3: hide — remove the column from the grid (unhide via ColumnVisibilityMenu).
    { key: 'hide', label: '숨기기', run: () => column.toggleVisibility(false), show: column.getCanHide() },
  ];
  const visible = items.filter((i) => i.show);
  if (visible.length === 0) return null;

  return (
    <details
      ref={ref}
      data-column-menu={column.id}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      <summary
        aria-label={`${column.id} 컬럼 메뉴`}
        onClick={(e) => e.stopPropagation()}
        style={{ cursor: 'pointer', listStyle: 'none', userSelect: 'none', padding: '0 4px' }}
      >
        {label}
      </summary>
      <div
        role="menu"
        data-column-menu-list=""
        onClick={(e) => e.stopPropagation()}
        style={{
          // 드롭다운은 모든 pinned 셀(z 컨벤션 10/20/30) 위에 떠야 한다. Tailwind 환경에서 pinned
          // sticky 셀(z-20/z-30)이 활성화되면 z-30 메뉴와 타이→클릭 가로챔 → 50 으로 명확히 위에.
          position: 'absolute',
          zIndex: 50,
          top: '100%',
          left: 0,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 4,
          padding: 4,
          minWidth: 140,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}
      >
        {visible.map((i) => (
          <button
            key={i.key}
            type="button"
            role="menuitem"
            data-menu-action={i.key}
            onClick={act(i.run)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '4px 8px',
              fontSize: 12,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {i.label}
          </button>
        ))}
      </div>
    </details>
  );
}
