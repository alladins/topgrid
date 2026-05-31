import type { ChangeEvent, JSX, MouseEvent } from 'react';

/**
 * Props for {@link CheckCell}.
 *
 * Absorbs legacy CheckCell. Markup preserved:
 * native `<input type="checkbox">` (NOT an icon SVG — spec D9, AC-007).
 *
 * @see Spec MOD-GRID-05/G-002 Section 2.4
 */
export interface CheckCellProps {
  /** Checked state (L0 L2 preserved). */
  checked: boolean;
  /** Change callback (L0 L3 preserved). Not invoked when `readOnly` is `true`. */
  onChange?: (checked: boolean) => void;
  /** Read-only mode (L0 L4 preserved). Default `false`. */
  readOnly?: boolean;
  /** Additional Tailwind className appended to the rendered input. */
  className?: string;
}

const BASE_INPUT_CLASS =
  'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500';

/**
 * Checkbox cell — wraps a native `<input type="checkbox">` centred inside
 * a flex container (L0 markup preserved). Both onClick and onChange call
 * stopPropagation so they never bubble to the grid row click handler.
 */
export function CheckCell({
  checked,
  onChange,
  readOnly = false,
  className,
}: CheckCellProps): JSX.Element {
  const cursorClass = readOnly ? 'cursor-default' : 'cursor-pointer';
  const composed = [BASE_INPUT_CLASS, cursorClass, className ?? '']
    .filter(Boolean)
    .join(' ');
  const handleChange = readOnly
    ? undefined
    : (e: ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        onChange?.(e.target.checked);
      };
  return (
    <div className="flex justify-center">
      <input
        type="checkbox"
        checked={checked}
        readOnly={readOnly}
        onChange={handleChange}
        onClick={(e: MouseEvent<HTMLInputElement>) => e.stopPropagation()}
        className={composed}
      />
    </div>
  );
}
