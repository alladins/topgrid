/**
 * @topgrid/grid-core — createTomisColumnHelper.
 *
 * MOD-GRID-04 G-001: TanStack `createColumnHelper<TData>()` 순수 re-export.
 *
 * **ADR-MOD-GRID-04-001**: `.tomisColumn()` wrapper 메서드 없음 (Option A).
 * 이유: TanStack API 그대로 사용하면 학습 비용 0, 타입 보장 완벽.
 * `createColumns(defs)` 가 고수준 자동 분기 API,
 * 이 함수는 저수준 수동 컨트롤 경로로 공존.
 *
 * @deprecated No production users. Use `createColumns` for high-level column
 * definition or import `createColumnHelper` directly from `@tanstack/react-table`
 * for low-level manual control. Will be removed in next major. (ADR-013)
 *
 * @example
 * ```typescript
 * import { createTomisColumnHelper } from '@topgrid/grid-core';
 *
 * const helper = createTomisColumnHelper<User>();
 *
 * const columns = [
 *   helper.accessor('name', {
 *     header: '이름',
 *     cell: (info) => info.getValue(),
 *   }),
 *   helper.accessor('salary', {
 *     header: '급여',
 *     cell: (info) => info.getValue().toLocaleString(),
 *   }),
 *   helper.display({
 *     id: 'actions',
 *     header: '액션',
 *     cell: (info) => <button>편집</button>,
 *   }),
 * ];
 * ```
 *
 * @see createColumns — 자동 type 분기 고수준 API (권장)
 * @see ADR-MOD-GRID-04-001 — Option A 선택 근거 + trade-off
 * @see AC-004, D4
 */
export { createColumnHelper as createTomisColumnHelper } from '@tanstack/react-table';
