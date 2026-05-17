/**
 * @tomis/grid-pro-range — useKeyboardNav Storybook 스토리 (AC-008).
 *
 * Default + KeyboardNav 시나리오 스토리 제공.
 * C-3 예외: Storybook story이므로 fixture 데이터 허용.
 */
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

import { useKeyboardNav } from './useKeyboardNav';
import { useCellRange } from './useCellRange';
import type { CellCoord, CellRange } from './types';

// ─── 샘플 데이터 ───────────────────────────────────────────────────────────────
interface Row {
  id: string;
  name: string;
  value: number;
  status: string;
}

const DATA: Row[] = Array.from({ length: 10 }, (_, i) => ({
  id: String(i + 1),
  name: `Item ${i + 1}`,
  value: (i + 1) * 100,
  status: i % 2 === 0 ? 'active' : 'inactive',
}));

const columnHelper = createColumnHelper<Row>();
const COLUMNS = [
  columnHelper.accessor('id',     { header: 'ID' }),
  columnHelper.accessor('name',   { header: 'Name' }),
  columnHelper.accessor('value',  { header: 'Value' }),
  columnHelper.accessor('status', { header: 'Status' }),
];

// ─── 데모 컴포넌트 ─────────────────────────────────────────────────────────────
function KeyboardNavDemo() {
  const [activeCell, setActiveCell] = useState<CellCoord | null>({ row: 0, col: 0 });
  const [rangeState, setRangeState] = useState<CellRange | null>(null);

  const table = useReactTable({
    data: DATA,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
  });

  const { handleMouseDown, handleMouseEnter, handleMouseUp } = useCellRange(setRangeState);
  const { handleKeyDown } = useKeyboardNav({
    table,
    activeCell,
    onActiveCellChange: setActiveCell,
    range: rangeState,
    onRangeChange: setRangeState,
  });

  const rows = table.getRowModel().rows;
  const headers = table.getFlatHeaders();

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <p style={{ marginBottom: 8, color: '#666' }}>
        클릭 후 Arrow / Shift+Arrow / Ctrl+Arrow / Tab / Enter 키를 사용하세요.
      </p>
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseUp={handleMouseUp}
        style={{ outline: 'none', display: 'inline-block', border: '1px solid #ccc' }}
      >
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  key={header.id}
                  style={{ padding: '4px 8px', border: '1px solid #ddd', background: '#f5f5f5' }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) =>
              row.getVisibleCells().map((cell, colIdx) => {
                const isActive =
                  activeCell?.row === rowIdx && activeCell?.col === colIdx;
                const inRange =
                  rangeState !== null &&
                  rowIdx >= rangeState.start.row && rowIdx <= rangeState.end.row &&
                  colIdx >= rangeState.start.col && colIdx <= rangeState.end.col;
                return (
                  <td
                    key={cell.id}
                    onMouseDown={(e) => { handleMouseDown(rowIdx, colIdx, e.shiftKey); }}
                    onMouseEnter={() => { handleMouseEnter(rowIdx, colIdx); }}
                    onClick={() => { setActiveCell({ row: rowIdx, col: colIdx }); }}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      background: inRange ? '#dbeafe' : 'white',
                      outline: isActive ? '2px solid #3b82f6' : 'none',
                      outlineOffset: '-2px',
                      cursor: 'cell',
                      userSelect: 'none',
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
      <pre style={{ marginTop: 12, fontSize: 12, color: '#555' }}>
        activeCell: {JSON.stringify(activeCell)}{'\n'}
        range: {JSON.stringify(rangeState)}
      </pre>
    </div>
  );
}

// ─── Meta ──────────────────────────────────────────────────────────────────────
const meta: Meta = {
  title: 'grid-pro-range/useKeyboardNav',
  component: KeyboardNavDemo,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof meta>;

/** 기본 스토리: 키보드 + 마우스 통합 내비게이션. */
export const Default: Story = {};

/** Shift+Arrow 범위 확장 시나리오 (AC-003). */
export const ShiftArrowRange: Story = {
  name: 'Shift+Arrow Range Extension',
  render: () => <KeyboardNavDemo />,
};

/** 대용량 데이터 플레이스홀더 (50 rows). */
export const LargeDataset: Story = {
  name: 'Large Dataset (50 rows)',
  render: () => {
    const largeData: Row[] = Array.from({ length: 50 }, (_, i) => ({
      id: String(i + 1),
      name: `Row ${i + 1}`,
      value: (i + 1) * 10,
      status: i % 3 === 0 ? 'active' : 'inactive',
    }));
    return (
      <div style={{ opacity: 0.5 }}>
        LargeDataset story placeholder — {largeData.length} rows
      </div>
    );
  },
};
