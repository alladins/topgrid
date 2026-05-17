import type { JSX, MouseEvent, ReactNode } from 'react';

/**
 * Props for {@link IconCell}.
 *
 * Absorbs tw-framework-front IconCell.tsx (L0 29 lines). The icon is a
 * `ReactNode` prop (D3 — no lucide-react / react-icons peer added).
 * Consumers inject their own icon component instance.
 *
 * @see Spec MOD-GRID-05/G-002 Section 2.5
 */
export interface IconCellProps {
  /** Icon ReactNode — caller supplies the icon component instance (D3). */
  icon: ReactNode;
  /** Optional supporting text (L0 L5 preserved). */
  label?: string;
  /** Optional click callback — when provided, renders `<button>`, else `<span>` (L0 L6 preserved). */
  onClick?: () => void;
  /** Tailwind text-colour class for the icon (L0 default `'text-gray-500'`). */
  color?: string;
  /** Additional Tailwind className appended to the outer element. */
  className?: string;
}

/**
 * Icon cell — display an icon (with optional supporting label and click
 * handler). The component is library-agnostic: it accepts any ReactNode
 * for the icon prop (D3 — no external icon package dependency).
 */
export function IconCell({
  icon,
  label,
  onClick,
  color = 'text-gray-500',
  className,
}: IconCellProps): JSX.Element {
  const innerComposed = [`flex items-center gap-1`, color].filter(Boolean).join(' ');
  const content = (
    <span className={innerComposed}>
      {icon}
      {label !== undefined && <span className="text-sm">{label}</span>}
    </span>
  );

  if (onClick) {
    const buttonComposed = ['hover:opacity-70 transition-opacity', className ?? '']
      .filter(Boolean)
      .join(' ');
    return (
      <button
        type="button"
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onClick();
        }}
        className={buttonComposed}
      >
        {content}
      </button>
    );
  }
  if (className !== undefined && className !== '') {
    return <span className={className}>{content}</span>;
  }
  return content;
}
