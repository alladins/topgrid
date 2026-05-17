import type { JSX } from 'react';

/**
 * Props for {@link TagCell}.
 *
 * New component (spec D4) — renders an array of tag strings as rounded
 * Tailwind chips. Empty array → dash placeholder (EC-08, mirrors the
 * G-001 TextCell empty-value pattern).
 *
 * @see Spec MOD-GRID-05/G-002 Section 2.6
 */
export interface TagCellProps {
  /** Tag strings. Empty array → dash placeholder (EC-08). */
  value: readonly string[];
  /** Per-tag Tailwind colour map. Falls back to a neutral gray chip when undefined. */
  colorMap?: Record<string, string>;
  /** Tailwind gap class applied to the flex container (default `'gap-1'`). */
  gapClassName?: string;
  /** Additional Tailwind className appended to the root span. */
  className?: string;
}

const DEFAULT_CHIP_CLASS = 'bg-gray-100 text-gray-700';
const CHIP_BASE = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';

/**
 * Tag cell — renders a flex-wrap row of tag chips. Used for multi-valued
 * label columns (e.g. priority tags, category tags). Each chip's colour
 * comes from {@link colorMap} or defaults to neutral gray.
 */
export function TagCell({ value, colorMap, gapClassName = 'gap-1', className }: TagCellProps): JSX.Element {
  if (value.length === 0) {
    return <span className={`text-gray-400 ${className ?? ''}`.trim()}>-</span>;
  }
  const rootComposed = ['inline-flex flex-wrap items-center', gapClassName, className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <span className={rootComposed}>
      {value.map((tag) => {
        const chipColor = colorMap?.[tag] ?? DEFAULT_CHIP_CLASS;
        const chipComposed = [CHIP_BASE, chipColor].filter(Boolean).join(' ');
        return (
          <span key={tag} className={chipComposed}>
            {tag}
          </span>
        );
      })}
    </span>
  );
}
