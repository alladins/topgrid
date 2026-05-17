/**
 * @tomis/grid-pro-range — RangeSelectGrid 컴포넌트 (G-006 Capstone).
 *
 * 5-hook 완전 통합: useCellRange + useKeyboardNav + DragFillHandle +
 * useClipboard + useKeyboardEdit + @tanstack/react-virtual 가상화.
 *
 * D4: enable* props = behavior gate (hook 호출 게이팅 아님).
 * D5: Rules of Hooks — 5개 hook 무조건 호출.
 * D9: onKeyDown 합성 순서 = editKeyDown → navKeyDown → clipKeyDown.
 * C-5: Tailwind className만 사용. CSS 파일 없음.
 * C-16: Wijmo import 없음.
 * C-29: exactOptionalPropertyTypes — optional props spread-skip 패턴.
 */
import { useCallback, useRef, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLicenseStatus, Watermark } from '@tomis/grid-license';

import type { CellCoord, CellRange, RangeSelectGridAllProps } from './types';
import { isInRange } from './internal/normalize';
import { useCellRange } from './useCellRange';
import { useKeyboardNav } from './useKeyboardNav';
import { useClipboard } from './useClipboard';
import { useKeyboardEdit } from './useKeyboardEdit';
import { DragFillHandle } from './DragFillHandle';

/**
 * RangeSelectGrid — G-006 5-hook 완전 통합 (AC-001, D4, D5, D9).
 *
 * D5 Rules of Hooks: 5개 hook 전부 무조건 호출.
 * D4 enable* = behavior gate (not hook invocation gate).
 * D9 onKeyDown 합성: editKeyDown → navKeyDown → clipKeyDown.
 *
 * @example
 * ```tsx
 * // v0.1.x 그대로 동작 (C-6 backward compat)
 * <RangeSelectGrid data={rows} columns={columns} />
 *
 * // v0.2.0 — Drag-fill + Clipboard 활성화
 * <RangeSelectGrid<MyData, string>
 *   data={data}
 *   columns={columns}
 *   enableDragFill
 *   enableClipboard
 *   getCellValue={(row, col) => getValue(row, col)}
 *   onFillComplete={(cells) => apply(cells)}
 *   onPaste={(cells) => apply(cells)}
 * />
 * ```
 */
export function RangeSelectGrid<TData extends object, TCell = unknown>(
  props: RangeSelectGridAllProps<TData, TCell>,
): React.ReactElement {
  // ADR-MOD-GRID-REFACTOR-2026-05-17-001 — license watermark wiring
  const _lic = useLicenseStatus();

  const {
    data,
    columns,
    onRangeChange,
    loading,
    emptyText = '데이터가 없습니다.',
    className,
    enableRangeSelection = true,
    enableKeyboardNav = true,
    enableDragFill = false,
    enableClipboard = false,
    enableKeyboardEdit = false,
    enableVirtualization = false,
    getCellValue,
    onFillComplete,
    onFillTargetChange,
    onPaste,
    onClipboardError,
    isEditableColumn,
    onDeleteRange,
    onBulkEdit,
    onEditStart,
  } = props;

  // ── TanStack Table ──────────────────────────────────────────────────────
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const rows = table.getRowModel().rows;
  const leafCols = table.getAllLeafColumns();
  const rowCount = rows.length;
  const colCount = leafCols.length;

  // ── containerRef (getCellRect + useVirtualizer scroll element) ──────────
  const containerRef = useRef<HTMLDivElement>(null);

  // ── getCellRect helper (D7: coord → pixel rect, DragFillHandle용) ───────
  const getCellRect = useCallback(
    (row: number, col: number): { x: number; y: number; width: number; height: number } => {
      if (containerRef.current === null) return { x: 0, y: 0, width: 0, height: 0 };
      const selector = `[data-row="${row}"][data-col="${col}"]`;
      const cell = containerRef.current.querySelector(selector);
      if (cell === null) return { x: 0, y: 0, width: 0, height: 0 };
      const r = cell.getBoundingClientRect();
      const cr = containerRef.current.getBoundingClientRect();
      return { x: r.left - cr.left, y: r.top - cr.top, width: r.width, height: r.height };
    },
    [],
  );

  // ── G-001 useCellRange (D5: 무조건 호출) ────────────────────────────────
  // 실제 시그니처: useCellRange(onRangeChange?) — 단일 callback 인자.
  // enableRangeSelection=false 시 undefined 전달 → hook 내부 no-op.
  const { range, handleMouseDown, handleMouseEnter, handleMouseUp } = useCellRange(
    enableRangeSelection ? onRangeChange : undefined,
  );

  // ── G-002 useKeyboardNav (D5: 무조건 호출) ──────────────────────────────
  const [activeCell, setActiveCell] = useState<CellCoord | null>(null);
  const noop = useCallback((_r: CellRange | null) => undefined, []);
  const { handleKeyDown: navKeyDown } = useKeyboardNav<TData>({
    table,
    activeCell,
    onActiveCellChange: setActiveCell,
    range,
    onRangeChange: enableKeyboardNav ? (onRangeChange ?? noop) : noop,
    ...(getCellValue !== undefined ? { getCellValue } : {}),
  });

  // ── G-004 useClipboard (D5: 무조건 호출) ────────────────────────────────
  // getCellValue required by useClipboard — fallback noop when undefined.
  const getCellValueFallback = useCallback(
    () => undefined as TCell,
    [],
  );
  const { onKeyDown: clipKeyDown } = useClipboard<TData, TCell>({
    selection: range,
    activeCell,
    rowCount,
    colCount,
    getCellValue: getCellValue ?? getCellValueFallback,
    ...(enableClipboard && onPaste !== undefined ? { onPaste } : {}),
    ...(enableClipboard && onClipboardError !== undefined ? { onError: onClipboardError } : {}),
  });

  // ── G-005 useKeyboardEdit (D5: 무조건 호출) ─────────────────────────────
  const { onKeyDown: editKeyDown } = useKeyboardEdit<TData, TCell>({
    selection: range,
    activeCell,
    ...(isEditableColumn !== undefined ? { isEditableColumn } : {}),
    ...(enableKeyboardEdit && onDeleteRange !== undefined ? { onDeleteRange } : {}),
    ...(enableKeyboardEdit && onBulkEdit !== undefined ? { onBulkEdit } : {}),
    ...(enableKeyboardEdit && onEditStart !== undefined ? { onEditStart } : {}),
  });

  // ── D9: onKeyDown 합성 체인 (G-005 → G-002 → G-004) ────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      editKeyDown(e);
      if (e.defaultPrevented) return;
      navKeyDown(e);
      if (e.defaultPrevented) return;
      clipKeyDown(e);
    },
    [editKeyDown, navKeyDown, clipKeyDown],
  );

  // ── 가상화 (AC-002, C-18, @tanstack/react-virtual) ──────────────────────
  // D5: useVirtualizer는 hook이므로 무조건 호출.
  // enableVirtualization=false 시 count=0 → 빈 items, 비가상화 렌더 fallback.
  const virtualizer = useVirtualizer({
    count: enableVirtualization ? rowCount : 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 36,
  });
  const virtualRows = enableVirtualization ? virtualizer.getVirtualItems() : null;
  const totalHeight = enableVirtualization ? virtualizer.getTotalSize() : undefined;

  // ── Loading 상태 ─────────────────────────────────────────────────────────
  if (loading === true) {
    return (
      <div className={`flex flex-col ${className ?? ''}`}>
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  // ── 셀 렌더 helper ───────────────────────────────────────────────────────
  const renderCells = (rowIdx: number) => {
    const row = rows[rowIdx];
    return row.getVisibleCells().map((cell, colIdx) => {
      const selected = isInRange(rowIdx, colIdx, range);
      const isActive =
        activeCell !== null && activeCell.row === rowIdx && activeCell.col === colIdx;
      return (
        <td
          key={cell.id}
          data-row={rowIdx}
          data-col={colIdx}
          // AC-005: 선택 셀 bg-blue-100 ring-1 ring-blue-400 (ADR-004)
          // activeCell: ring-2 ring-blue-600 (G-002 패턴)
          className={`px-4 py-3 whitespace-nowrap text-gray-700 cursor-cell border border-transparent transition-colors ${
            isActive
              ? 'bg-blue-50 ring-2 ring-blue-600'
              : selected
                ? 'bg-blue-100 ring-1 ring-blue-400'
                : ''
          }`}
          onMouseDown={(e) => {
            if (!enableRangeSelection) return;
            e.preventDefault(); // 텍스트 선택 방지
            handleMouseDown(rowIdx, colIdx, e.shiftKey);
          }}
          onMouseEnter={() => {
            if (!enableRangeSelection) return;
            handleMouseEnter(rowIdx, colIdx);
          }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col ${className ?? ''} relative`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="overflow-x-auto rounded-lg border border-gray-200 select-none overflow-y-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap select-none ${
                      header.column.getCanSort()
                        ? 'cursor-pointer hover:bg-gray-100'
                        : ''
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {header.column.getCanSort() && (
                        <span className="text-gray-400">
                          {(
                            { asc: '▲', desc: '▼' } as Record<string, string>
                          )[header.column.getIsSorted() as string] ?? '⇅'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={leafCols.length}
                  className="px-4 py-10 text-center text-gray-400"
                >
                  {emptyText}
                </td>
              </tr>
            ) : virtualRows !== null ? (
              // ── 가상화 렌더 (enableVirtualization=true) ────────────────
              <tr>
                <td colSpan={leafCols.length} className="p-0">
                  <div style={{ height: totalHeight, position: 'relative' }}>
                    {virtualRows.map((vRow) => (
                      <table
                        key={vRow.key}
                        style={{
                          position: 'absolute',
                          top: vRow.start,
                          width: '100%',
                          tableLayout: 'fixed',
                        }}
                        className="min-w-full text-sm"
                      >
                        <tbody>
                          <tr className="hover:bg-gray-50">
                            {renderCells(vRow.index)}
                          </tr>
                        </tbody>
                      </table>
                    ))}
                  </div>
                </td>
              </tr>
            ) : (
              // ── 일반 렌더 ─────────────────────────────────────────────
              rows.map((_row, rowIdx) => (
                <tr key={_row.id} className="hover:bg-gray-50">
                  {renderCells(rowIdx)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* G-003 DragFillHandle — 컴포넌트이므로 조건부 렌더 허용 (D4, D5) */}
      {/* EC-001: getCellValue 미제공 시 DragFillHandle 렌더 skip */}
      {enableDragFill && range !== null && getCellValue !== undefined && (
        <DragFillHandle<TCell>
          range={range}
          getCellValue={getCellValue}
          rowCount={rowCount}
          colCount={colCount}
          containerRef={containerRef}
          getCellRect={getCellRect}
          {...(onFillComplete !== undefined ? { onFillComplete } : {})}
          {...(onFillTargetChange !== undefined ? { onFillTargetChange } : {})}
        />
      )}
      {_lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
