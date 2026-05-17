/**
 * @tomis/grid-pro-range — useClipboard Storybook 스토리 (G-004, AC-007).
 *
 * CopyStory: Ctrl+C → TSV 클립보드 복사 시나리오.
 * PasteStory: mocked TSV string을 pasteFromClipboard에 직접 주입 (Ctrl+V 시나리오).
 *
 * C-3 예외: Storybook story이므로 fixture 데이터 허용.
 * C-5: Tailwind 클래스 사용 (story 허용 범위).
 */
import type { Meta, StoryObj } from '@storybook/react';
import React, { useCallback, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

import { useClipboard } from './useClipboard';
import { useCellRange } from './useCellRange';
import { stringifyTsv } from './internal/tsvUtils';
import type { CellCoord, CellRange, CellUpdate } from './types';

// ─── 샘플 데이터 ───────────────────────────────────────────────────────────────
interface Row {
  id: string;
  name: string;
  value: number;
  status: string;
}

const INITIAL_DATA: Row[] = Array.from({ length: 8 }, (_, i) => ({
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

// ─── 공통 그리드 렌더러 ────────────────────────────────────────────────────────
interface GridProps {
  data: Row[];
  activeCell: CellCoord | null;
  range: CellRange | null;
  onCellClick: (row: number, col: number) => void;
  onMouseDown: (row: number, col: number, shift: boolean) => void;
  onMouseEnter: (row: number, col: number) => void;
  onMouseUp: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function ClipboardGrid(props: GridProps) {
  const { data, activeCell, range, onCellClick, onMouseDown, onMouseEnter, onMouseUp, onKeyDown } =
    props;

  const table = useReactTable({ data, columns: COLUMNS, getCoreRowModel: getCoreRowModel() });
  const rows = table.getRowModel().rows;
  const headers = table.getFlatHeaders();

  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseUp={onMouseUp}
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
              const isActive = activeCell?.row === rowIdx && activeCell?.col === colIdx;
              const inRange =
                range !== null &&
                rowIdx >= range.start.row &&
                rowIdx <= range.end.row &&
                colIdx >= range.start.col &&
                colIdx <= range.end.col;
              return (
                <td
                  key={cell.id}
                  onMouseDown={(e) => { onMouseDown(rowIdx, colIdx, e.shiftKey); }}
                  onMouseEnter={() => { onMouseEnter(rowIdx, colIdx); }}
                  onClick={() => { onCellClick(rowIdx, colIdx); }}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    background: inRange ? '#dbeafe' : 'white',
                    outline: isActive ? '2px solid #3b82f6' : 'none',
                    outlineOffset: '-2px',
                    cursor: 'cell',
                    userSelect: 'none',
                    minWidth: 80,
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
  );
}

// ─── CopyStory 데모 ────────────────────────────────────────────────────────────
function CopyDemo() {
  const [activeCell, setActiveCell] = useState<CellCoord | null>({ row: 0, col: 0 });
  const [rangeState, setRangeState] = useState<CellRange | null>(null);
  const [copyLog, setCopyLog] = useState<string[]>([]);

  const data = INITIAL_DATA;

  const getCellValue = useCallback(
    (row: number, col: number): string => {
      const rowData = data[row];
      if (rowData === undefined) return '';
      const keys: (keyof Row)[] = ['id', 'name', 'value', 'status'];
      const key = keys[col];
      return key !== undefined ? String(rowData[key]) : '';
    },
    [data],
  );

  const { handleMouseDown, handleMouseEnter, handleMouseUp } = useCellRange(setRangeState);

  const { onKeyDown, copyToClipboard } = useClipboard<Row, string>({
    selection: rangeState,
    activeCell,
    rowCount: data.length,
    colCount: 4,
    getCellValue,
    onError: (e) => { setCopyLog((prev) => [...prev, `Error: ${e.message}`]); },
  });

  const handleManualCopy = async () => {
    if (rangeState !== null) {
      const { start, end } = rangeState;
      const matrix: string[][] = [];
      for (let r = start.row; r <= end.row; r++) {
        const row: string[] = [];
        for (let c = start.col; c <= end.col; c++) {
          row.push(getCellValue(r, c));
        }
        matrix.push(row);
      }
      const tsv = stringifyTsv(matrix);
      setCopyLog((prev) => [
        ...prev,
        `Copied TSV (${end.row - start.row + 1}×${end.col - start.col + 1}):\n${tsv}`,
      ]);
    }
    await copyToClipboard();
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <p style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
        셀 범위를 선택한 후 <kbd>Ctrl+C</kbd> 또는 아래 버튼으로 TSV 복사.
      </p>
      <ClipboardGrid
        data={data}
        activeCell={activeCell}
        range={rangeState}
        onCellClick={(row, col) => { setActiveCell({ row, col }); }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseUp={handleMouseUp}
        onKeyDown={onKeyDown}
      />
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => { void handleManualCopy(); }}
          style={{ padding: '4px 12px', cursor: 'pointer' }}
        >
          복사 (Ctrl+C 시뮬레이션)
        </button>
        <button
          type="button"
          onClick={() => { setCopyLog([]); }}
          style={{ padding: '4px 12px', cursor: 'pointer' }}
        >
          로그 초기화
        </button>
      </div>
      {copyLog.length > 0 && (
        <pre
          style={{
            marginTop: 12,
            fontSize: 11,
            color: '#333',
            background: '#f5f5f5',
            padding: 8,
            borderRadius: 4,
            maxHeight: 160,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {copyLog.join('\n\n')}
        </pre>
      )}
      <pre style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
        activeCell: {JSON.stringify(activeCell)}{'\n'}
        range: {JSON.stringify(rangeState)}
      </pre>
    </div>
  );
}

// ─── PasteStory 데모 ──────────────────────────────────────────────────────────
function PasteDemo() {
  const [data, setData] = useState<Row[]>(INITIAL_DATA.map((r) => ({ ...r })));
  const [activeCell, setActiveCell] = useState<CellCoord | null>({ row: 0, col: 0 });
  const [rangeState, setRangeState] = useState<CellRange | null>(null);
  const [pasteLog, setPasteLog] = useState<string[]>([]);
  const [mockTsv, setMockTsv] = useState('PASTE1\tPASTE2\nPASTE3\tPASTE4');

  const getCellValue = useCallback(
    (row: number, col: number): string => {
      const rowData = data[row];
      if (rowData === undefined) return '';
      const keys: (keyof Row)[] = ['id', 'name', 'value', 'status'];
      const key = keys[col];
      return key !== undefined ? String(rowData[key]) : '';
    },
    [data],
  );

  const handlePaste = useCallback(
    (cells: CellUpdate<string>[]) => {
      setData((prev) => {
        const next = prev.map((r) => ({ ...r }));
        const keys: (keyof Row)[] = ['id', 'name', 'value', 'status'];
        for (const cell of cells) {
          const rowData = next[cell.row];
          const key = keys[cell.col];
          if (rowData !== undefined && key !== undefined) {
            Object.assign(rowData, { [key]: cell.value });
          }
        }
        return next;
      });
      setPasteLog((prev) => [
        ...prev,
        `Pasted ${cells.length} cells: ${JSON.stringify(cells.slice(0, 4))}${cells.length > 4 ? '…' : ''}`,
      ]);
    },
    [],
  );

  const { handleMouseDown, handleMouseEnter, handleMouseUp } = useCellRange(setRangeState);

  const { onKeyDown, pasteFromClipboard } = useClipboard<Row, string>({
    selection: rangeState,
    activeCell,
    rowCount: data.length,
    colCount: 4,
    getCellValue,
    ...(handlePaste !== undefined ? { onPaste: handlePaste } : {}),
    onError: (e) => { setPasteLog((prev) => [...prev, `Error: ${e.message}`]); },
  });

  const handleManualPaste = async () => {
    const result = await pasteFromClipboard(mockTsv);
    setPasteLog((prev) => [
      ...prev,
      `PasteResult: rows=${result.rows}, cols=${result.cols}, cells=${result.cells.length}, truncated=${result.truncated}`,
    ]);
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <p style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
        활성 셀 클릭 후 아래 버튼으로 mocked TSV를 붙여넣기 시뮬레이션 (Ctrl+V 시나리오).
      </p>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 12 }}>Mock TSV:</label>
        <textarea
          value={mockTsv}
          onChange={(e) => { setMockTsv(e.target.value); }}
          rows={2}
          style={{ fontFamily: 'monospace', fontSize: 12, padding: 4, width: 240 }}
        />
      </div>
      <ClipboardGrid
        data={data}
        activeCell={activeCell}
        range={rangeState}
        onCellClick={(row, col) => { setActiveCell({ row, col }); }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseUp={handleMouseUp}
        onKeyDown={onKeyDown}
      />
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => { void handleManualPaste(); }}
          style={{ padding: '4px 12px', cursor: 'pointer' }}
        >
          붙여넣기 (Ctrl+V 시뮬레이션)
        </button>
        <button
          type="button"
          onClick={() => { setData(INITIAL_DATA.map((r) => ({ ...r }))); setPasteLog([]); }}
          style={{ padding: '4px 12px', cursor: 'pointer' }}
        >
          데이터 초기화
        </button>
      </div>
      {pasteLog.length > 0 && (
        <pre
          style={{
            marginTop: 12,
            fontSize: 11,
            color: '#333',
            background: '#f5f5f5',
            padding: 8,
            borderRadius: 4,
            maxHeight: 120,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {pasteLog.join('\n')}
        </pre>
      )}
      <pre style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
        activeCell: {JSON.stringify(activeCell)}{'\n'}
        range: {JSON.stringify(rangeState)}
      </pre>
    </div>
  );
}

// ─── Meta ──────────────────────────────────────────────────────────────────────
const meta: Meta = {
  title: 'grid-pro-range/useClipboard',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof meta>;

/** Ctrl+C 복사 시나리오: 범위 선택 후 TSV 클립보드 저장. */
export const CopyStory: Story = {
  name: 'Copy (Ctrl+C)',
  render: () => <CopyDemo />,
};

/** Ctrl+V 붙여넣기 시나리오: mocked TSV string pasteFromClipboard 직접 주입. */
export const PasteStory: Story = {
  name: 'Paste (Ctrl+V mocked)',
  render: () => <PasteDemo />,
};
