import type { JSX } from 'react';
import { formatNumberString } from './formatters.js';

/**
 * Props for {@link NumberCell}.
 *
 * Preserves L0 NumberCell.tsx (L1-7) prop signature in full — no drift.
 *
 * @see Spec MOD-GRID-05/G-001 Section 2.2
 */
export interface NumberCellProps {
  /** Numeric value. null/undefined/NaN → dash placeholder. */
  value: number | null | undefined;
  /** Decimal places (default 0). L0 NumberCell.tsx:3 preserved. */
  decimals?: number;
  /** Unit suffix (default ''). L0 NumberCell.tsx:4. */
  unit?: string;
  /** Locale tag (default 'ko-KR'). L0 NumberCell.tsx:5. */
  locale?: string;
  /** Apply red-600 to negative values (default false). L0 NumberCell.tsx:6. */
  colorNegative?: boolean;
  /** Additional Tailwind className. */
  className?: string;
}

/**
 * Numeric cell renderer with locale-aware formatting + optional unit + optional negative color.
 *
 * Uses {@link formatNumberString} (extracted from L0 inline toLocaleString pattern).
 */
export function NumberCell({
  value,
  decimals = 0,
  unit = '',
  locale = 'ko-KR',
  colorNegative = false,
  className,
}: NumberCellProps): JSX.Element {
  if (value == null || !Number.isFinite(value)) {
    return <span className={`text-gray-400 ${className ?? ''}`.trim()}>-</span>;
  }
  const formatted = formatNumberString(value, { decimals, locale });
  const isNeg = colorNegative && value < 0;
  const composed = ['tabular-nums', isNeg ? 'text-red-600' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <span className={composed}>
      {formatted}
      {unit}
    </span>
  );
}
