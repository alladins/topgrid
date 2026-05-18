/**
 * @topgrid/grid-pro-range — useClipboard hook (G-004).
 *
 * Ctrl+C: 현재 선택 범위 → RFC 4180 TSV → navigator.clipboard.writeText.
 * Ctrl+V: navigator.clipboard.readText → parseTsv → CellUpdate[] → onPaste 콜백.
 *
 * D3: onPaste callback — MOD-GRID-10 분리.
 * D5: navigator.clipboard 우선 + document.execCommand fallback.
 * D7: onKeyDown 반환 — G-002 useKeyboardNav와 컴포저블 결합.
 */
import { useCallback } from 'react';
import type {
  CellUpdate,
  PasteResult,
  UseClipboardProps,
  UseClipboardReturn,
} from './types';
import { stringifyTsv, parseTsv } from './internal/tsvUtils';

export function useClipboard<TData, TCell = unknown>(
  props: UseClipboardProps<TData, TCell>,
): UseClipboardReturn {
  const { selection, activeCell, rowCount, colCount, getCellValue, onPaste, onError } = props;

  /** 선택 범위 → 2D 매트릭스 → TSV string → 클립보드 (AC-001) */
  const copyToClipboard = useCallback(async (): Promise<void> => {
    // EC-001: selection null → no-op
    if (selection === null) return;

    const { start, end } = selection;
    const matrix: TCell[][] = [];
    for (let r = start.row; r <= end.row; r++) {
      const row: TCell[] = [];
      for (let c = start.col; c <= end.col; c++) {
        row.push(getCellValue(r, c));
      }
      matrix.push(row);
    }

    // C-31: stringifyTsv import + 호출 (wire-up audit)
    const tsv = stringifyTsv(matrix as readonly (readonly unknown[])[]);

    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(tsv);
      } else {
        // D5 fallback: document.execCommand (HTTP 환경)
        const textarea = document.createElement('textarea');
        textarea.value = tsv;
        textarea.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!ok) throw new Error('[grid-pro-range] copyToClipboard: Clipboard API not supported');
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      if (onError !== undefined) {
        onError(e);
      } else {
        console.warn('[grid-pro-range] copyToClipboard error:', e.message);
      }
    }
  }, [selection, getCellValue, onError]);

  /**
   * TSV string → CellUpdate[] 파싱 후 onPaste 콜백 (AC-002, D3).
   * tsvString 미제공 시 navigator.clipboard.readText() 호출.
   * grid 경계 초과 시 clamp + truncated=true 보고 (EC-005).
   */
  const pasteFromClipboard = useCallback(
    async (tsvString?: string): Promise<PasteResult<TCell>> => {
      // EC-004: activeCell null → no-op
      if (activeCell === null) {
        return { cells: [], truncated: false, rows: 0, cols: 0 };
      }

      let tsv: string;
      if (tsvString !== undefined) {
        tsv = tsvString;
      } else {
        try {
          if (
            typeof navigator !== 'undefined' &&
            navigator.clipboard &&
            typeof navigator.clipboard.readText === 'function'
          ) {
            tsv = await navigator.clipboard.readText();
          } else {
            const err = new Error(
              '[grid-pro-range] pasteFromClipboard: Clipboard read API not supported',
            );
            if (onError !== undefined) onError(err);
            else console.warn(err.message);
            return { cells: [], truncated: false, rows: 0, cols: 0 };
          }
        } catch (err) {
          const e = err instanceof Error ? err : new Error(String(err));
          // EC-002: 권한 거부 → graceful no-op
          if (onError !== undefined) onError(e);
          else console.warn('[grid-pro-range] pasteFromClipboard error:', e.message);
          return { cells: [], truncated: false, rows: 0, cols: 0 };
        }
      }

      // EC-007: 빈 TSV → no-op
      if (tsv.trim() === '') {
        return { cells: [], truncated: false, rows: 0, cols: 0 };
      }

      // C-31: parseTsv import + 호출 (wire-up audit)
      const matrix = parseTsv(tsv);
      const pasteRows = matrix.length;
      const pasteCols = Math.max(...matrix.map((r) => r.length), 0);

      const cells: CellUpdate<TCell>[] = [];
      let truncated = false;

      for (let ri = 0; ri < pasteRows; ri++) {
        const targetRow = activeCell.row + ri;
        if (targetRow >= rowCount) {
          truncated = true;
          break;
        }
        const row = matrix[ri];
        for (let ci = 0; ci < row.length; ci++) {
          const targetCol = activeCell.col + ci;
          if (targetCol >= colCount) {
            truncated = true;
            continue;
          }
          cells.push({ row: targetRow, col: targetCol, value: row[ci] as unknown as TCell });
        }
      }

      const result: PasteResult<TCell> = { cells, truncated, rows: pasteRows, cols: pasteCols };

      if (cells.length > 0 && onPaste !== undefined) {
        onPaste(cells);
      }

      return result;
    },
    [activeCell, rowCount, colCount, onPaste, onError],
  );

  /** D7: Ctrl+C / Ctrl+V 키 캡처 (G-002 useKeyboardNav와 컴포저블 결합) */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      const isCopy = (e.ctrlKey || e.metaKey) && e.key === 'c';
      const isPaste = (e.ctrlKey || e.metaKey) && e.key === 'v';
      if (!isCopy && !isPaste) return;

      e.preventDefault();
      if (isCopy) {
        void copyToClipboard();
      } else {
        void pasteFromClipboard();
      }
    },
    [copyToClipboard, pasteFromClipboard],
  );

  return { onKeyDown, copyToClipboard, pasteFromClipboard };
}
