import type { SortBadgeProps } from './multi-sort/types';

/**
 * 다중 정렬 우선순위 배지 — grid-core canonical source (ADR-010).
 *
 * @remarks
 * Grid.tsx 헤더 렌더 내부 + `@tomis/grid-features` public API 양쪽의 single source.
 * `@tomis/grid-features` 의 `SortBadge` 는 ADR-010 으로 이 컴포넌트의 deprecation alias.
 * Tailwind className만 사용 (C-5).
 *
 * `sortIndex < 0` (= 미정렬) 시 null 반환.
 */
export function SortBadge({ sortIndex, className = '' }: SortBadgeProps): JSX.Element | null {
  if (sortIndex < 0) return null;
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-blue-500 text-white ml-0.5 ${className}`}
    >
      {sortIndex + 1}
    </span>
  );
}
