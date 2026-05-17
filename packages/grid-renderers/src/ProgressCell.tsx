import type { JSX } from 'react';

/**
 * Props for {@link ProgressCell}.
 *
 * New component (spec D4) — horizontal progress bar with optional label.
 * Handles NaN/null/undefined → 0% (EC-10) and out-of-range values → [0,100]
 * clamp (EC-11).
 *
 * @see Spec MOD-GRID-05/G-002 Section 2.8
 */
export interface ProgressCellProps {
  /** Progress value (0–100). NaN/null/undefined → 0; out-of-range → clamped. */
  value: number | null | undefined;
  /** Whether to render the percent label next to the bar. Default `true`. */
  showLabel?: boolean;
  /** Tailwind class for the bar fill (default `'bg-blue-600'`). */
  barColorClassName?: string;
  /** Additional Tailwind className appended to the root container. */
  className?: string;
}

/**
 * Clamp value into [0,100] integer. NaN/null/undefined → 0 (EC-10).
 * Out-of-range numbers are clamped to the closest bound (EC-11).
 */
function clampPercent(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

/**
 * Progress cell — Tailwind track + bar (h-2 rounded) with optional percent
 * label. Bar width uses a dynamic `style={{ width }}` value (spec C-5
 * deviation: Tailwind JIT arbitrary widths cannot be runtime-driven).
 */
export function ProgressCell({
  value,
  showLabel = true,
  barColorClassName = 'bg-blue-600',
  className,
}: ProgressCellProps): JSX.Element {
  const pct = clampPercent(value);
  const rootComposed = ['flex items-center gap-2', className ?? '']
    .filter(Boolean)
    .join(' ');
  const barComposed = ['h-full rounded-full', barColorClassName].filter(Boolean).join(' ');
  return (
    <div className={rootComposed}>
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className={barComposed} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="text-xs tabular-nums text-gray-700">{pct}%</span>}
    </div>
  );
}
