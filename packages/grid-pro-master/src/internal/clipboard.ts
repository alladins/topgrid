/**
 * `cellValueToClipboardText` — pure extraction of a cell's value to clipboard text.
 *
 * Split out from the browser `navigator.clipboard.writeText` wiring (built-in
 * `makeCopyCellItem`) so the value→text mapping is node-testable in isolation.
 *
 * Mapping:
 * - `null` / `undefined` → `''` (empty, never the strings "null"/"undefined")
 * - object (incl. arrays) → `JSON.stringify(value)`
 * - everything else (string/number/boolean) → `String(value)`
 */
export function cellValueToClipboardText(cell: { getValue: () => unknown }): string {
  const v = cell.getValue();
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}
