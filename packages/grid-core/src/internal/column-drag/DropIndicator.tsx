/**
 * @topgrid/grid-core — DropIndicator 컴포넌트.
 *
 * Moved from `@topgrid/grid-features/column-drag/DropIndicator.tsx` per ADR-009 (옵션 A).
 * Aliased re-export remains in `@topgrid/grid-features` for one minor cycle.
 *
 * G-001 (MOD-GRID-07): 드래그 중 drop 위치 시각 인디케이터 (AC-003).
 *
 * AC-003: Tailwind className 만 사용 (C-5). style={{}} 최소화.
 * dragOverId === columnId 일 때만 렌더 (non-null → 인디케이터 표시).
 *
 * @remarks
 * `jsx: "react-jsx"` 환경 (tsconfig.base.json) — `import React` 불필요.
 * `verbatimModuleSyntax: true` + `noUnusedLocals: true` 로 unused value import 는 tsc error.
 */

/**
 * 드래그 drop 위치에 렌더되는 파란 수직선 인디케이터.
 *
 * @param dragOverId - 현재 drop 인디케이터를 표시할 컬럼 ID (`useColumnDrag` 반환).
 * @param columnId - 이 인디케이터가 속한 컬럼 ID.
 */
export function DropIndicator({
  dragOverId,
  columnId,
}: {
  dragOverId: string | null;
  columnId: string;
}): null | JSX.Element {
  if (dragOverId !== columnId) return null;

  return (
    <span
      aria-hidden="true"
      className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 pointer-events-none"
    />
  );
}
