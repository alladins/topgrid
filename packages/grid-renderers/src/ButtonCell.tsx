import type { JSX, MouseEvent, ReactNode } from 'react';

/**
 * Props for {@link ButtonCell}.
 *
 * Absorbs legacy ButtonCell with the variant
 * naming change (D2 — L0 `'primary' | 'danger' | 'ghost'` → spec
 * `'default' | 'destructive' | 'ghost'`). Visual output (Tailwind classes)
 * unchanged: `default`==L0 `primary`, `destructive`==L0 `danger`.
 *
 * R1 grep at implement time: 0 hardcoded `variant='primary'|'danger'` sites
 * across the legacy source — direct rename safe (no codemod needed).
 *
 * `value` added as preferred prop; `label` retained as deprecated alias (ADR-014 amendment).
 *
 * @see Spec MOD-GRID-05/G-002 Section 2.3
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-014 amendment (D-partial, 2026-05-17)
 */
export interface ButtonCellProps {
  /** Button label (text or arbitrary ReactNode). Preferred prop (ADR-014 amendment). */
  value?: ReactNode;
  /**
   * @deprecated Use `value` instead. Removed in next major (POL-COMPAT §3).
   */
  label?: ReactNode;
  /** Click callback (L0 required, preserved). */
  onClick: () => void;
  /** Visual variant (D2 renamed from L0 `primary`/`danger`). Default `'ghost'`. */
  variant?: 'default' | 'destructive' | 'ghost';
  /** Disabled state (L0 preserved). Default `false`. */
  disabled?: boolean;
  /** Size token (L0 preserved). Default `'xs'`. */
  size?: 'sm' | 'xs';
  /** Additional Tailwind className. */
  className?: string;
}

const VARIANT_CLASS: Record<NonNullable<ButtonCellProps['variant']>, string> = {
  default: 'bg-blue-600 hover:bg-blue-700 text-white',
  destructive: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300',
};

const BASE_CLASS =
  'rounded px-2 py-0.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

/**
 * Button cell — small action button suitable for grid action columns.
 *
 * Click handler stops propagation so it never triggers a row click (L0
 * pattern preserved). Variant Tailwind classes equal the L0 mapping with
 * renamed keys (D2 — no visual change).
 *
 * When both `value` and `label` are undefined, renders an empty `<button>`
 * (new behaviour — previously impossible since `label` was required; spec §5.1 fallback).
 */
export function ButtonCell({
  value,
  label,
  onClick,
  variant = 'ghost',
  disabled = false,
  size = 'xs',
  className,
}: ButtonCellProps): JSX.Element {
  const displayValue = value ?? label;
  const sizeClass = size === 'xs' ? 'text-xs' : 'text-sm';
  const composed = [BASE_CLASS, sizeClass, VARIANT_CLASS[variant], className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={composed}
    >
      {displayValue}
    </button>
  );
}
