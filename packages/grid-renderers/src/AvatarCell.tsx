import type { JSX, SyntheticEvent } from 'react';
import { useState } from 'react';

/**
 * Props for {@link AvatarCell}.
 *
 * New component (spec D4) — displays an avatar image with an initials
 * fallback. When `src` is missing or fails to load, the component renders
 * a rounded-full chip showing initials derived from {@link name} (EC-09).
 *
 * @see Spec MOD-GRID-05/G-002 Section 2.7
 */
export interface AvatarCellProps {
  /** User name. Source of initials when avatar image is unavailable. */
  name: string;
  /** Avatar image URL. When undefined or load fails, initials fallback renders. */
  src?: string;
  /** Tailwind size class (default `'w-7 h-7'`). */
  sizeClassName?: string;
  /** Additional Tailwind className appended to the root span. */
  className?: string;
}

/**
 * Compute initials from a person's name.
 *
 * Heuristic:
 *  - Multiple whitespace-separated tokens → first letter of first two tokens
 *    uppercased (e.g. "John Doe" → "JD").
 *  - Single token (typical for CJK names) → first two characters preserved
 *    (e.g. "홍길동" → "홍길", "김" → "김").
 *  - Empty/whitespace → "?" fallback.
 */
function getInitials(name: string): string {
  const trimmed = name.trim();
  if (trimmed === '') return '?';
  const tokens = trimmed.split(/\s+/);
  if (tokens.length >= 2) {
    const first = tokens[0]?.charAt(0) ?? '';
    const second = tokens[1]?.charAt(0) ?? '';
    return (first + second).toUpperCase();
  }
  return trimmed.slice(0, 2);
}

const FALLBACK_BASE =
  'rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-medium';

/**
 * Avatar cell — image with initials fallback (EC-09 handles broken src by
 * swapping to the initials chip via onError state).
 */
export function AvatarCell({
  name,
  src,
  sizeClassName = 'w-7 h-7',
  className,
}: AvatarCellProps): JSX.Element {
  const [imgFailed, setImgFailed] = useState(false);
  const rootComposed = ['inline-flex items-center', className ?? '']
    .filter(Boolean)
    .join(' ');
  const showImage = src !== undefined && src !== '' && !imgFailed;
  if (showImage) {
    const imgComposed = [sizeClassName, 'rounded-full object-cover']
      .filter(Boolean)
      .join(' ');
    return (
      <span className={rootComposed}>
        <img
          src={src}
          alt={name}
          className={imgComposed}
          onError={(_e: SyntheticEvent<HTMLImageElement>) => setImgFailed(true)}
        />
      </span>
    );
  }
  const fallbackComposed = [sizeClassName, FALLBACK_BASE].filter(Boolean).join(' ');
  return (
    <span className={rootComposed}>
      <span className={fallbackComposed}>{getInitials(name)}</span>
    </span>
  );
}
