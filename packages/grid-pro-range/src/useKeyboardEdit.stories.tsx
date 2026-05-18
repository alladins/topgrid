/**
 * @topgrid/grid-pro-range — useKeyboardEdit Storybook 스토리 (G-005, AC-006).
 *
 * DeleteStory: 범위 선택 후 Delete 키 → onDeleteRange 호출 로그 표시.
 * BulkEditStory: 범위 선택 후 임의 문자 타이핑 → onBulkEdit 호출 로그 표시.
 * EditStartStory: 단일 셀 활성 후 F2/Enter 키 → onEditStart 호출 로그 표시.
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

import { useKeyboardEdit } from './useKeyboardEdit';
import { useCellRange } from './useCellRange';
import type { CellCoord, CellRange, UseKeyboardEditProps } from './types';

// ─── 샘플 데이터 ───────────────────────────────────────────────────────────────
interface Row {
  id: string;
  name: string;
  value: string;
  status: string;
}

const INITIAL_DATA: Row[] = Array.from({ length: 6 }, (_, i) => ({
  id: String(i + 1),
  name: `Item ${i + 1}`,
  value: String((i + 1) * 100),
  status: i % 2 === 0 ? 'active' : 'inactive',
}));

const columnHelper = createColumnHelper<Row>();

/** 컬럼 2(value)는 편집 가능, 나머지는 읽기 전용 (DeleteStory isEditableColumn 데모용). */
const COLUMNS = [
  columnHelper.accessor('id',     { header: 'ID (읽기전용)' }),
  columnHelper.accessor('name',   { header: 'Name (읽기전용)' }),
  columnHelper.accessor('value',  { header: 'Value (편집가능)' }),
  columnHelper.accessor('status', { header: 'Status (편집가능)' }),
];

// ─── 공통 그리드 렌더러 ────────────────────────────────────────────────────────
interface EditGridProps {
  data: Row[];
  activeCell: CellCoord | null;
  range: CellRange | null;
  onCellClick: (row: number, col: number) => void;
  onMouseDown: (row: number, col: number, shift: boolean) => void;
  onMouseEnter: (row: number, col: number) => void;
  onMouseUp: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  editingCell?: CellCoord | null;
}

function EditGrid(props: EditGridProps) {
  const {
    data,
    activeCell,
    range,
    onCellClick,
    onMouseDown,
    onMouseEnter,
    onMouseUp,
    onKeyDown,
    editingCell,
  } = props;

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
                style={{ padding: '4px 8px', border: '1px solid #ddd', background: '#f5f5f5', fontSize: 12 }}
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
              const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;
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
                    background: isEditing
                      ? '#fef9c3'
                      : inRange
                      ? '#dbeafe'
                      : 'white',
                    outline: isActive ? '2px solid #3b82f6' : 'none',
                    outlineOffset: '-2px',
                    cursor: 'cell',
                    userSelect: 'none',
                    minWidth: 100,
                    fontSize: 13,
                    color: isEditing ? '#92400e' : '#111',
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

// ─── 로그 패널 ────────────────────────────────────────────────────────────────
interface LogPanelProps {
  logs: string[];
  onClear: () => void;
}

function LogPanel({ logs, onClear }: LogPanelProps) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
        <strong style={{ fontSize: 12 }}>Action Log</strong>
        <button
          type="button"
          onClick={onClear}
          style={{ padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}
        >
          초기화
        </button>
      </div>
      <pre
        style={{
          fontSize: 11,
          color: '#333',
          background: '#f5f5f5',
          padding: 8,
          borderRadius: 4,
          minHeight: 60,
          maxHeight: 160,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          margin: 0,
        }}
      >
        {logs.length === 0 ? '(없음 — 키 입력 후 확인)' : logs.join('\n')}
      </pre>
    </div>
  );
}

// ─── DeleteStory 데모 ─────────────────────────────────────────────────────────
/**
 * Delete 키: 선택 범위 내 편집 가능 컬럼(col 2, 3)만 삭제.
 * isEditableColumn(col) = col >= 2
 */
function DeleteDemo() {
  const [data, setData] = useState<Row[]>(INITIAL_DATA.map((r) => ({ ...r })));
  const [activeCell, setActiveCell] = useState<CellCoord | null>({ row: 0, col: 0 });
  const [rangeState, setRangeState] = useState<CellRange | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const isEditableColumn = useCallback((col: number) => col >= 2, []);

  const handleDelete = useCallback(
    (cells: CellCoord[]) => {
      setData((prev) => {
        const next = prev.map((r) => ({ ...r }));
        const keys: (keyof Row)[] = ['id', 'name', 'value', 'status'];
        for (const cell of cells) {
          const rowData = next[cell.row];
          const key = keys[cell.col];
          if (rowData !== undefined && key !== undefined) {
            Object.assign(rowData, { [key]: '' });
          }
        }
        return next;
      });
      setLogs((prev) => [
        ...prev,
        `Delete → onDeleteRange(${cells.length} cells): ${JSON.stringify(cells)}`,
      ]);
    },
    [],
  );

  const { handleMouseDown, handleMouseEnter, handleMouseUp } = useCellRange(setRangeState);

  const editProps: UseKeyboardEditProps<Row, string> = {
    selection: rangeState,
    activeCell,
    ...(isEditableColumn !== undefined ? { isEditableColumn } : {}),
    ...(handleDelete !== undefined ? { onDeleteRange: handleDelete } : {}),
  };
  const { onKeyDown } = useKeyboardEdit(editProps);

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <p style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
        셀 범위를 선택한 후 <kbd>Delete</kbd> 키 입력. col 0(ID)/1(Name)은 읽기 전용 → 삭제 안 됨.
      </p>
      <EditGrid
        data={data}
        activeCell={activeCell}
        range={rangeState}
        onCellClick={(row, col) => { setActiveCell({ row, col }); }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseUp={handleMouseUp}
        onKeyDown={onKeyDown}
      />
      <LogPanel logs={logs} onClear={() => { setLogs([]); setData(INITIAL_DATA.map((r) => ({ ...r }))); }} />
      <pre style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
        activeCell: {JSON.stringify(activeCell)}{'\n'}
        range: {JSON.stringify(rangeState)}
      </pre>
    </div>
  );
}

// ─── BulkEditStory 데모 ───────────────────────────────────────────────────────
/**
 * 범위 선택 후 임의 문자 타이핑 → onBulkEdit callback.
 * 모든 컬럼 편집 가능 (isEditableColumn 미제공).
 */
function BulkEditDemo() {
  const [data, setData] = useState<Row[]>(INITIAL_DATA.map((r) => ({ ...r })));
  const [activeCell, setActiveCell] = useState<CellCoord | null>({ row: 0, col: 0 });
  const [rangeState, setRangeState] = useState<CellRange | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const handleBulkEdit = useCallback(
    (cells: CellCoord[], value: string) => {
      setData((prev) => {
        const next = prev.map((r) => ({ ...r }));
        const keys: (keyof Row)[] = ['id', 'name', 'value', 'status'];
        for (const cell of cells) {
          const rowData = next[cell.row];
          const key = keys[cell.col];
          if (rowData !== undefined && key !== undefined) {
            Object.assign(rowData, { [key]: value });
          }
        }
        return next;
      });
      setLogs((prev) => [
        ...prev,
        `BulkEdit → onBulkEdit(${cells.length} cells, "${value}"): ${JSON.stringify(cells.slice(0, 4))}${cells.length > 4 ? '…' : ''}`,
      ]);
    },
    [],
  );

  const { handleMouseDown, handleMouseEnter, handleMouseUp } = useCellRange(setRangeState);

  const editProps: UseKeyboardEditProps<Row, string> = {
    selection: rangeState,
    activeCell,
    ...(handleBulkEdit !== undefined ? { onBulkEdit: handleBulkEdit } : {}),
  };
  const { onKeyDown } = useKeyboardEdit(editProps);

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <p style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
        셀 범위를 드래그 선택 후 문자 키 타이핑 → 선택 범위 전체에 동일 값 입력.
      </p>
      <EditGrid
        data={data}
        activeCell={activeCell}
        range={rangeState}
        onCellClick={(row, col) => { setActiveCell({ row, col }); }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseUp={handleMouseUp}
        onKeyDown={onKeyDown}
      />
      <LogPanel logs={logs} onClear={() => { setLogs([]); setData(INITIAL_DATA.map((r) => ({ ...r }))); }} />
      <pre style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
        activeCell: {JSON.stringify(activeCell)}{'\n'}
        range: {JSON.stringify(rangeState)}
      </pre>
    </div>
  );
}

// ─── EditStartStory 데모 ─────────────────────────────────────────────────────
/**
 * 단일 셀 활성 후 F2 / Enter → onEditStart callback.
 * 편집 중인 셀은 노란 배경으로 표시.
 */
function EditStartDemo() {
  const [data] = useState<Row[]>(INITIAL_DATA.map((r) => ({ ...r })));
  const [activeCell, setActiveCell] = useState<CellCoord | null>({ row: 0, col: 0 });
  const [rangeState, setRangeState] = useState<CellRange | null>(null);
  const [editingCell, setEditingCell] = useState<CellCoord | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const handleEditStart = useCallback(
    (cell: CellCoord, initialValue?: string) => {
      setEditingCell(cell);
      const msg = initialValue !== undefined
        ? `EditStart → onEditStart({row:${cell.row},col:${cell.col}}, initialValue="${initialValue}")`
        : `EditStart → onEditStart({row:${cell.row},col:${cell.col}})`;
      setLogs((prev) => [...prev, msg]);
    },
    [],
  );

  const { handleMouseDown, handleMouseEnter, handleMouseUp } = useCellRange(setRangeState);

  const editProps: UseKeyboardEditProps<Row, string> = {
    selection: rangeState,
    activeCell,
    ...(handleEditStart !== undefined ? { onEditStart: handleEditStart } : {}),
  };
  const { onKeyDown } = useKeyboardEdit(editProps);

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <p style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
        단일 셀 클릭 후 <kbd>F2</kbd> 또는 <kbd>Enter</kbd> → onEditStart 호출 (노란 배경).
        다중 범위 선택 후 Enter는 이 hook이 처리하지 않음 (G-002 위임).
      </p>
      <EditGrid
        data={data}
        activeCell={activeCell}
        range={rangeState}
        onCellClick={(row, col) => { setActiveCell({ row, col }); setEditingCell(null); }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseUp={handleMouseUp}
        onKeyDown={onKeyDown}
        editingCell={editingCell}
      />
      {editingCell !== null && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#92400e', background: '#fef9c3', padding: '4px 8px', borderRadius: 4 }}>
          편집 중: row={editingCell.row}, col={editingCell.col}
          {' '}
          <button
            type="button"
            onClick={() => { setEditingCell(null); }}
            style={{ marginLeft: 8, fontSize: 11, cursor: 'pointer' }}
          >
            편집 종료 (Escape 시뮬레이션)
          </button>
        </div>
      )}
      <LogPanel logs={logs} onClear={() => { setLogs([]); setEditingCell(null); }} />
      <pre style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
        activeCell: {JSON.stringify(activeCell)}{'\n'}
        range: {JSON.stringify(rangeState)}{'\n'}
        editingCell: {JSON.stringify(editingCell)}
      </pre>
    </div>
  );
}

// ─── Meta ──────────────────────────────────────────────────────────────────────
const meta: Meta = {
  title: 'grid-pro-range/useKeyboardEdit',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Delete 키 범위 삭제 시나리오.
 * 범위 선택 후 Delete → onDeleteRange callback. 읽기 전용 컬럼(ID, Name)은 제외.
 */
export const DeleteStory: Story = {
  name: 'Delete Key (범위 삭제)',
  render: () => <DeleteDemo />,
};

/**
 * 범위 일괄 값 입력 시나리오.
 * 범위 선택 후 임의 문자 타이핑 → onBulkEdit callback. 전체 범위 동일 값 입력.
 */
export const BulkEditStory: Story = {
  name: 'Bulk Edit (일괄 입력)',
  render: () => <BulkEditDemo />,
};

/**
 * F2/Enter 편집 시작 시나리오.
 * 단일 셀 활성 후 F2 또는 Enter → onEditStart callback 호출 + 노란 배경 표시.
 */
export const EditStartStory: Story = {
  name: 'F2/Enter Edit Start (편집 시작)',
  render: () => <EditStartDemo />,
};
