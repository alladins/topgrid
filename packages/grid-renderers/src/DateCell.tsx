import type { JSX } from 'react';
import { formatDateTimeFromDateTimeString } from './formatters.js';

/**
 * Props for {@link DateCell}.
 *
 * Preserves L0 DateCell.tsx (L1-5) prop signature in full — no drift.
 *
 * @see Spec MOD-GRID-05/G-001 Section 2.3
 */
export interface DateCellProps {
  /** Date value. null/undefined/'' → dash placeholder. Invalid Date → dash. */
  value: string | number | Date | null | undefined;
  /** Display format (default 'date'). L0 DateCell.tsx:3 preserved. */
  format?: 'date' | 'datetime' | 'time';
  /** Locale tag (default 'ko-KR'). L0 DateCell.tsx:4. */
  locale?: string;
  /** Additional Tailwind className. */
  className?: string;
}

/**
 * Date/time cell renderer with locale-aware formatting.
 *
 * Uses {@link formatDateTimeFromDateTimeString} (extracted from L0 inline
 * toLocaleDateString + FORMAT_OPTIONS pattern). Returns dash for empty/invalid.
 */
export function DateCell({
  value,
  format = 'date',
  locale = 'ko-KR',
  className,
}: DateCellProps): JSX.Element {
  if (value == null || value === '') {
    return <span className={`text-gray-400 ${className ?? ''}`.trim()}>-</span>;
  }
  const formatted = formatDateTimeFromDateTimeString(value, { format, locale });
  if (formatted === '') {
    return <span className={`text-gray-400 ${className ?? ''}`.trim()}>-</span>;
  }
  return <span className={className ?? ''}>{formatted}</span>;
}
