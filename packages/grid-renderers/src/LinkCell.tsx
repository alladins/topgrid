import type { JSX, MouseEvent } from 'react';

/**
 * Props for {@link LinkCell}.
 *
 * Absorbs tw-framework-front LinkCell.tsx (L0 16 lines).
 * - `onClick` weakened from required to optional (additive — Section 2.2 R2 risk-bound).
 * - `href` added (additive — AC-002 href|onClick union).
 * - `value` added as preferred prop; `label` retained as deprecated alias (ADR-014 amendment).
 *
 * @see Spec MOD-GRID-05/G-002 Section 2.2
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-014 amendment (D-partial, 2026-05-17)
 */
export interface LinkCellProps {
  /** Display text. Preferred prop (ADR-014 amendment). */
  value?: string;
  /**
   * @deprecated Use `value` instead. Removed in next major (POL-COMPAT §3).
   */
  label?: string;
  /** Click callback. Used when {@link href} is undefined (L0 preserved). */
  onClick?: () => void;
  /** Link URL. When provided, renders `<a href>`; otherwise renders `<button>` (or `<span>`). */
  href?: string;
  /** Additional Tailwind className appended to the rendered element. */
  className?: string;
}

const BASE_CLASS = 'text-blue-600 hover:text-blue-800 hover:underline text-left';

/**
 * Link cell — renders one of three forms based on AC-002:
 *  - `href` provided → `<a href>` (with onClick passthrough if any)
 *  - only `onClick` → `<button>` (L0 behaviour preserved)
 *  - neither → `<span>` (plain text or empty)
 *
 * When both `value` and `label` are undefined, renders an empty `<span>` (new
 * behaviour — previously impossible since `label` was required; spec §5.1 fallback).
 *
 * Click handlers call `e.stopPropagation()` to prevent grid row click bubbling
 * (L0 ButtonCell/LinkCell pattern preserved).
 */
export function LinkCell({ value, label, onClick, href, className }: LinkCellProps): JSX.Element {
  const displayValue = value ?? label;
  const composed = [BASE_CLASS, className ?? ''].filter(Boolean).join(' ');
  if (href !== undefined) {
    return (
      <a
        href={href}
        className={composed}
        onClick={
          onClick
            ? (e: MouseEvent<HTMLAnchorElement>) => {
                e.stopPropagation();
                onClick();
              }
            : undefined
        }
      >
        {displayValue}
      </a>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        className={composed}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {displayValue}
      </button>
    );
  }
  return <span className={composed}>{displayValue}</span>;
}
