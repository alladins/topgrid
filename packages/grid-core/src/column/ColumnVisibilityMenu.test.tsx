/**
 * ColumnVisibilityMenu — unit tests (MOD-GRID-04 G-003 TC-007~TC-008).
 *
 * @see G-003-spec.md Section 7 TC-007 ~ TC-008
 *
 * ⚠️ RUNTIME NOTE: vitest is not installed in this monorepo.
 *   Tests are authored per spec but cannot be executed via `pnpm test`.
 *   To run: install vitest + @testing-library/react + jsdom, then `pnpm vitest`.
 *   Reported as A-07 deviation in implement-score.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnVisibilityMenu } from './ColumnVisibilityMenu';
import type { Table, Column } from '@tanstack/react-table';

// ─── Column mock factory ──────────────────────────────────────────────────────

function makeColumn(
  id: string,
  header: string,
  visible: boolean,
  canHide = true,
): Column<unknown, unknown> {
  return {
    id,
    columnDef: { header },
    accessorFn: () => null, // presence = accessor column
    getCanHide: () => canHide,
    getIsVisible: () => visible,
    toggleVisibility: vi.fn(),
  } as unknown as Column<unknown, unknown>;
}

function makeTable(columns: Column<unknown, unknown>[]): Table<unknown> {
  return {
    getAllLeafColumns: () => columns,
  } as unknown as Table<unknown>;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

/**
 * TC-007: ColumnVisibilityMenu 렌더 확인 — 컬럼 레이블이 표시된다.
 * @see G-003-spec.md TC-007
 */
describe('TC-007: menu render', () => {
  it('renders column labels in the menu', () => {
    const columns = [
      makeColumn('name', '이름', true),
      makeColumn('age', '나이', false),
    ];
    const table = makeTable(columns);

    render(<ColumnVisibilityMenu table={table} />);

    expect(screen.getByText('이름')).toBeInTheDocument();
    expect(screen.getByText('나이')).toBeInTheDocument();
  });

  it('does not render non-hidable columns', () => {
    const columns = [
      makeColumn('name', '이름', true, true),
      makeColumn('__select__', '선택', true, false), // canHide=false
    ];
    const table = makeTable(columns);

    render(<ColumnVisibilityMenu table={table} />);

    expect(screen.queryByLabelText('선택 컬럼 표시')).not.toBeInTheDocument();
  });
});

/**
 * TC-008: 체크박스 토글 — 체크박스 클릭 시 column.toggleVisibility 호출.
 * @see G-003-spec.md TC-008
 */
describe('TC-008: checkbox toggle', () => {
  it('calls column.toggleVisibility when checkbox is changed', () => {
    const nameCol = makeColumn('name', '이름', true);
    const table = makeTable([nameCol]);

    render(<ColumnVisibilityMenu table={table} />);

    const checkbox = screen.getByLabelText('이름 컬럼 표시') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(nameCol.toggleVisibility).toHaveBeenCalledWith(false);
  });

  it('reflects initial visibility in checkbox state', () => {
    const col = makeColumn('age', '나이', false);
    const table = makeTable([col]);

    render(<ColumnVisibilityMenu table={table} />);

    const checkbox = screen.getByLabelText('나이 컬럼 표시') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });
});
