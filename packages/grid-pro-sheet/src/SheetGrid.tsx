/**
 * `SheetGrid` — thin spreadsheet grid (MOD-GRID-26 G-3, PoC). Demonstrates the load-bearing
 * spreadsheet property: a cell **stores a formula but displays a value** (stored ≠ rendered).
 * Double-click a cell to edit its raw `=A1+A2`; commit re-parses + recalculates.
 *
 * REUSE ([[LESS-003]]) of `@topgrid/grid-pro-range`:
 * - `useCellRange` — mouse range selection (highlight).
 * - `useClipboard` — Ctrl+C/V; `getCellValue` = the **displayed value** (copy = value, PoC choice),
 *   `onPaste` writes pasted text straight to `setCell`.
 *
 * PoC: absolute refs, value-copy (no relative-ref adjustment), inline edit via double-click/Enter.
 */

import { useCallback, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useCellRange, useClipboard, isInRange } from '@topgrid/grid-pro-range';
import type { CellUpdate } from '@topgrid/grid-pro-range';
import { useSheet } from './useSheet.js';
import { toA1 } from './internal/cellAddress.js';
import { formatSheetValue, type SheetCellFormat } from './internal/formatSheetValue.js';
import { sheetStyleToCss, type SheetCellStyle } from './internal/sheetStyleToCss.js';

export interface SheetGridProps {
  /** Number of rows (default 12). */
  rows?: number;
  /** Number of columns (default 6). */
  cols?: number;
  /**
   * MOD-GRID-62: per-cell number format, keyed by A1 ref (e.g. `{ B2: { type: 'currency' } }`).
   * Applied to the displayed value; unformatted cells render unchanged. Non-numeric values
   * (errors/text) pass through.
   */
  formats?: Record<string, SheetCellFormat>;
  /**
   * MOD-GRID-63: per-cell visual style, keyed by A1 ref (e.g. `{ A1: { bold: true } }`).
   * Merged onto the cell; the range-selection highlight still wins.
   */
  cellStyles?: Record<string, SheetCellStyle>;
}

const cellStyle: CSSProperties = {
  border: '1px solid #ddd',
  padding: '2px 6px',
  minWidth: 64,
  height: 22,
  fontFamily: 'sans-serif',
  fontSize: 13,
};
const headerStyle: CSSProperties = { ...cellStyle, background: '#f3f4f6', textAlign: 'center', fontWeight: 600 };

export function SheetGrid({ rows = 12, cols = 6, formats, cellStyles }: SheetGridProps): JSX.Element {
  const { setCell, getDisplay, getRaw, undo, redo, canUndo, canRedo } = useSheet();
  const [editing, setEditing] = useState<{ row: number; col: number } | null>(null);
  const [editText, setEditText] = useState('');
  const { range, handleMouseDown, handleMouseEnter, handleMouseUp } = useCellRange();

  const refOf = (row: number, col: number): string => toA1(col, row);

  const startEdit = useCallback(
    (row: number, col: number) => {
      setEditText(getRaw(refOf(row, col)));
      setEditing({ row, col });
    },
    [getRaw],
  );

  const commit = useCallback(() => {
    if (editing) setCell(refOf(editing.row, editing.col), editText);
    setEditing(null);
  }, [editing, editText, setCell]);

  // REUSE: copy = displayed value; paste writes raw text to cells.
  const { onKeyDown: clipboardKeyDown } = useClipboard({
    selection: range,
    activeCell: range?.start ?? null,
    rowCount: rows,
    colCount: cols,
    getCellValue: (row, col) => getDisplay(refOf(row, col)),
    onPaste: (cells: CellUpdate[]) => {
      for (const u of cells) setCell(refOf(u.row, u.col), String(u.value));
    },
  });

  const colHeaders = Array.from({ length: cols }, (_, c) => toA1(c, 0).replace(/[0-9]+$/, ''));

  return (
    <div
      tabIndex={0}
      onKeyDown={clipboardKeyDown}
      onMouseUp={handleMouseUp}
      style={{ display: 'inline-block', outline: 'none' }}
    >
      {/* MOD-GRID-32 G-3: undo/redo 툴바(버튼 어포던스; disabled=canUndo/canRedo). */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        <button
          type="button"
          aria-label="실행 취소"
          disabled={!canUndo}
          onClick={undo}
          style={{ padding: '2px 8px', fontSize: '12px', cursor: canUndo ? 'pointer' : 'default' }}
        >
          ↶ 취소
        </button>
        <button
          type="button"
          aria-label="다시 실행"
          disabled={!canRedo}
          onClick={redo}
          style={{ padding: '2px 8px', fontSize: '12px', cursor: canRedo ? 'pointer' : 'default' }}
        >
          ↷ 재실행
        </button>
      </div>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={headerStyle} />
            {colHeaders.map((h) => (
              <th key={h} style={headerStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row}>
              <th style={headerStyle}>{row + 1}</th>
              {Array.from({ length: cols }, (_, col) => {
                const ref = refOf(row, col);
                const isEditing = editing?.row === row && editing?.col === col;
                const selected = isInRange(row, col, range);
                return (
                  <td
                    key={ref}
                    data-cell={ref}
                    onMouseDown={(e) => handleMouseDown(row, col, e.shiftKey)}
                    onMouseEnter={() => handleMouseEnter(row, col)}
                    onDoubleClick={() => startEdit(row, col)}
                    style={{
                      ...cellStyle,
                      ...(cellStyles?.[ref] ? sheetStyleToCss(cellStyles[ref]) : {}),
                      ...(selected ? { background: '#dbeafe' } : {}),
                    }}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        data-testid={`edit-${ref}`}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={commit}
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') commit();
                          else if (e.key === 'Escape') setEditing(null);
                        }}
                        style={{ width: 60, border: 'none', font: 'inherit', outline: '2px solid #2563eb' }}
                      />
                    ) : (
                      <span>{formatSheetValue(getDisplay(ref), formats?.[ref])}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
