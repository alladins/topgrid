/**
 * @topgrid/grid-core — createGroupedColumns factory.
 *
 * @deprecated No production users. Use TanStack `GroupColumnDef` directly, or pass
 * grouped column arrays to `useReactTable({ columns })`. Will be removed in next
 * major. (ADR-013)
 *
 * MOD-GRID-04 G-002: `createGroupedColumns<TData>(...groups)` 핵심 공개 API.
 *
 * `TomisColumnGroup<TData>[]`(rest args)를 받아 `ColumnDef<TData>[]` 반환.
 * TanStack `useReactTable({ columns })` 에 직접 주입 가능.
 * 다단 헤더(multi-row header)는 TanStack Table v8 `GroupColumnDef.columns` 중첩으로
 * 자동 지원 — `getHeaderGroups()`, `header.isPlaceholder`, `header.colSpan` 사용.
 *
 * ## 구현 원칙 (D1)
 * thin wrapper: 입력 rest args를 그대로 `ColumnDef<TData>[]`로 캐스팅하여 반환.
 * 내부에서 어떤 변환·정규화도 수행하지 않음 (G-001 hotfix 단일 경로 원칙 동일).
 *
 * @see TomisColumnGroup
 * @see createColumns
 * @see AC-002, D1, D2, D3, D4, D5
 */

import type { ColumnDef } from '@tanstack/react-table';

/**
 * 그룹 헤더 컬럼 정의.
 *
 * @deprecated No production users. Will be removed in next major together with
 * `createGroupedColumns`. (ADR-013)
 *
 * TanStack Table v8의 `GroupColumnDef<TData>` 구조와 1:1 대응.
 * `columns` 배열은 `createColumns()` 결과 또는 중첩 `createGroupedColumns()` 결과를 수용.
 *
 * @typeParam TData - 행 데이터 타입
 *
 * @example
 * ```typescript
 * const group: TomisColumnGroup<Payroll> = {
 *   header: '지급항목',
 *   columns: createColumns<Payroll>([
 *     { id: 'basePay', name: '기본급', type: 'number', align: 'right' },
 *     { id: 'bonus',   name: '상여',   type: 'number', align: 'right' },
 *     { id: 'totalPay', name: '합계',  type: 'number', align: 'right' },
 *   ]),
 * };
 * ```
 */
export interface TomisColumnGroup<TData = unknown> {
  /** 그룹 헤더 레이블 */
  header: string;
  /** 그룹 내 리프(leaf) 컬럼 또는 중첩 그룹 컬럼 배열 */
  columns: ColumnDef<TData>[];
}

/**
 * `TomisColumnGroup<TData>[]` rest args를 받아 `ColumnDef<TData>[]` 반환.
 *
 * @deprecated No production users. Will be removed in next major. (ADR-013)
 *
 * - 다단 헤더(multi-row header) 지원 — TanStack Table v8 `GroupColumnDef.columns` 중첩으로 자동 처리 (D2)
 * - thin wrapper: 입력 그대로 반환 (변환·정규화 없음, D1)
 * - enableColumnFilter / enablePinning 등 리프 컬럼 옵션은 `TomisColumnDef` 레벨에서 설정 (D3)
 * - `GroupedHeaderGrid.tsx` 호환성: TC-04 deep-equal 검증 (D4)
 * - Storybook D5 데모: `지급항목` + `basePay/bonus/totalPay` 2-level
 *
 * @typeParam TData - 행 데이터 타입
 * @param groups - 그룹 컬럼 정의 rest args. 각 항목은 `{ header, columns }` 형태.
 * @returns TanStack `ColumnDef<TData>[]` — `useReactTable({ columns })` 에 직접 주입 가능.
 *
 * @example
 * ```typescript
 * // 2-level 다단 헤더 (지급항목 그룹)
 * const columns = createGroupedColumns<Payroll>(
 *   {
 *     header: '지급항목',
 *     columns: createColumns<Payroll>([
 *       { id: 'basePay',  name: '기본급', type: 'number', align: 'right', width: '120' },
 *       { id: 'bonus',    name: '상여',   type: 'number', align: 'right', width: '100' },
 *       { id: 'totalPay', name: '합계',   type: 'number', align: 'right', width: '120' },
 *     ]),
 *   },
 * );
 *
 * // 복수 그룹 (기본정보 + 급여내역)
 * const columns = createGroupedColumns<Employee>(
 *   {
 *     header: '기본 정보',
 *     columns: createColumns<Employee>([
 *       { id: 'empNo', name: '사번', type: 'text', align: 'center' },
 *       { id: 'name',  name: '성명', type: 'text', align: 'left'   },
 *     ]),
 *   },
 *   {
 *     header: '급여 내역',
 *     columns: createColumns<Employee>([
 *       { id: 'basePay',  name: '기본급', type: 'number', align: 'right' },
 *       { id: 'bonus',    name: '상여',   type: 'number', align: 'right' },
 *       { id: 'totalPay', name: '합계',   type: 'number', align: 'right' },
 *     ]),
 *   },
 * );
 * ```
 *
 * @see TomisColumnGroup
 * @see createColumns
 * @see GroupedHeaderGrid
 * @see D1, D2, D3, D4, D5
 */
export function createGroupedColumns<TData = unknown>(
  ...groups: Array<TomisColumnGroup<TData>>
): ColumnDef<TData>[] {
  return groups as ColumnDef<TData>[];
}
