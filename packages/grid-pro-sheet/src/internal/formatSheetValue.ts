/**
 * MOD-GRID-62 — pure cell number-format (no React, no engine, no Intl).
 *
 * Formats a sheet cell's *displayed value string* by a format spec. Deterministic (Intl 미사용 —
 * locale/node 버전 무관, node 단언 안정). Non-numeric displays (formula errors, text) pass through
 * unchanged. `undefined` format → passthrough (so unformatted cells stay byte-identical).
 */

/** Per-cell number format spec. */
export type SheetCellFormat =
  | { type: 'number'; decimals?: number }
  | { type: 'currency'; symbol?: string; decimals?: number }
  | { type: 'percent'; decimals?: number }
  | { type: 'date' };

/** Insert thousands separators into the integer part of a (already fixed) numeric string. */
function groupThousands(fixed: string): string {
  const neg = fixed.startsWith('-');
  const body = neg ? fixed.slice(1) : fixed;
  const dot = body.indexOf('.');
  const intPart = dot === -1 ? body : body.slice(0, dot);
  const frac = dot === -1 ? '' : body.slice(dot);
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + grouped + frac;
}

/** Serial day number (days since 1970-01-01 UTC) → ISO `yyyy-mm-dd`. */
function serialToISO(days: number): string {
  const ms = Math.round(days) * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Format a displayed cell value by `format`. Returns `display` unchanged when `format` is undefined
 * or the value is non-numeric (empty / error / text).
 */
export function formatSheetValue(display: string, format?: SheetCellFormat): string {
  if (format === undefined) return display;
  if (display.trim() === '') return display;
  const n = Number(display);
  if (!Number.isFinite(n)) return display; // errors / text pass through

  switch (format.type) {
    case 'number':
      return groupThousands(n.toFixed(format.decimals ?? 0));
    case 'currency': {
      const symbol = format.symbol ?? '$';
      return `${symbol}${groupThousands(n.toFixed(format.decimals ?? 2))}`;
    }
    case 'percent':
      return `${(n * 100).toFixed(format.decimals ?? 0)}%`;
    case 'date':
      return serialToISO(n);
  }
}
