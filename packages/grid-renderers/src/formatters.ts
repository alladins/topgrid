/**
 * Pure formatting helpers for cell renderers.
 *
 * Extracted from L0 patterns:
 *  - NumberCell.tsx L17-20 (inline value.toLocaleString)
 *  - DateCell.tsx L13-21 (inline date.toLocaleDateString + FORMAT_OPTIONS)
 *
 * No external store/state dependency. Typed (no `any`).
 *
 * @see Spec MOD-GRID-05/G-001 Section 2.4
 */

export interface FormatNumberOptions {
  /** Decimal places (default 0). Clamped to [0, 20]. */
  decimals?: number;
  /** Locale tag (default 'ko-KR'). */
  locale?: string;
}

export interface FormatDateTimeOptions {
  /** Display format (default 'date'). */
  format?: 'date' | 'datetime' | 'time';
  /** Locale tag (default 'ko-KR'). */
  locale?: string;
}

const DATE_FORMAT_OPTIONS: Record<'date' | 'datetime' | 'time', Intl.DateTimeFormatOptions> = {
  date: { year: 'numeric', month: '2-digit', day: '2-digit' },
  datetime: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  },
  time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
};

/**
 * Format a number using locale-aware thousand separators and fixed decimals.
 *
 * Returns '' for null/undefined/non-finite inputs (EC-02 — explicit guard,
 * improving L0 inline `toLocaleString` which output the string "NaN").
 *
 * Negative or non-integer `decimals` are clamped via `Math.max(0, Math.floor(...))`
 * to avoid Intl RangeError (EC-03).
 *
 * @example formatNumberString(1234.5, { decimals: 2 }) // "1,234.50"
 */
export function formatNumberString(
  value: number | null | undefined,
  options?: FormatNumberOptions,
): string {
  if (value == null || !Number.isFinite(value)) {
    return '';
  }
  const decimals = Math.max(0, Math.min(20, Math.floor(options?.decimals ?? 0)));
  const locale = options?.locale ?? 'ko-KR';
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a date/string/number/Date to a locale-aware date/datetime/time string.
 *
 * Returns '' for null/undefined/empty-string/invalid-Date inputs (EC-04, EC-05).
 *
 * @example formatDateTimeFromDateTimeString('2026-05-14', { format: 'date' }) // "2026. 05. 14."
 */
export function formatDateTimeFromDateTimeString(
  value: string | number | Date | null | undefined,
  options?: FormatDateTimeOptions,
): string {
  if (value == null || value === '') {
    return '';
  }
  const format = options?.format ?? 'date';
  const locale = options?.locale ?? 'ko-KR';
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString(locale, DATE_FORMAT_OPTIONS[format]);
  } catch {
    return '';
  }
}
