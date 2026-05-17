/**
 * Internal — `pagination.mode` → TanStack `TableOptions` 조각 변환.
 *
 * `mode`가 `manual`보다 우선순위 높음. `mode: undefined` 또는 `'none'` 시
 * 기존 `buildTableOptions.ts` L175/L191 경로를 그대로 사용 (하위 호환).
 *
 * @see G-001-spec.md Section 2-C + Section 8-D
 * @see ADR-MOD-GRID-03-001
 */

import { getPaginationRowModel, type RowData, type TableOptions } from '@tanstack/react-table';

import type { GridPaginationOptions } from '../types';

/**
 * `buildPaginationOptions` 결과 — `buildTableOptions` 에서 merge 하여 사용.
 *
 * @typeParam TData - 행 데이터 타입 (RowData constraint).
 */
export interface BuildPaginationResult<TData extends RowData> {
  /** mode → TanStack 옵션 조각 (manualPagination, getPaginationRowModel, rowCount, pageCount). */
  tanstackOptions: Partial<TableOptions<TData>>;
  /**
   * `mode: 'client' | 'server'` 설정 시 true — Grid.tsx 의 enablePagination override 용도.
   * Grid 가 `enablePagination` prop 없어도 pagination UI 자동 활성화 (D5 결정).
   */
  impliedEnablePagination: boolean;
}

/**
 * `pagination.mode` 및 기존 `pagination.manual`을 TanStack `TableOptions` 조각으로 변환.
 *
 * Grid 내부 `buildTableOptions` 호출 전 결과를 merge 하여 사용.
 * `mode`가 `manual`보다 우선순위 높음.
 *
 * @param pagination - `GridPaginationOptions` (또는 undefined).
 * @returns `tanstackOptions` + `impliedEnablePagination` 쌍.
 *
 * @example
 * ```ts
 * // AC-001: mode=client
 * buildPaginationOptions({ mode: 'client', pageSize: 20 })
 * // → { tanstackOptions: { manualPagination: false, getPaginationRowModel: fn }, impliedEnablePagination: true }
 *
 * // AC-002: mode=server + totalCount
 * buildPaginationOptions({ mode: 'server', totalCount: 100, pageSize: 10 })
 * // → { tanstackOptions: { manualPagination: true, rowCount: 100, pageCount: 10 }, impliedEnablePagination: true }
 * ```
 */
export function buildPaginationOptions<TData extends RowData>(
  pagination: GridPaginationOptions | undefined,
): BuildPaginationResult<TData> {
  if (!pagination) {
    return { tanstackOptions: {}, impliedEnablePagination: false };
  }

  const mode = pagination.mode;

  // mode 가 없거나 'none' 이면 기존 buildTableOptions.ts L175/L191 경로 유지 (AC-005)
  if (mode === undefined || mode === 'none') {
    return { tanstackOptions: {}, impliedEnablePagination: false };
  }

  const isServer = mode === 'server';

  // C-29: exactOptionalPropertyTypes 준수 — 조건부 할당 패턴
  const tanstackOptions: Partial<TableOptions<TData>> = {
    manualPagination: isServer,
    getPaginationRowModel: getPaginationRowModel(),
  };

  if (isServer) {
    // pageCount: 직접 지정 우선, 없으면 totalCount / pageSize 계산 (ADR-MOD-GRID-03-003)
    const computedPageCount =
      typeof pagination.totalCount === 'number' &&
      typeof pagination.pageSize === 'number' &&
      pagination.pageSize > 0
        ? Math.ceil(pagination.totalCount / pagination.pageSize)
        : undefined;

    const resolvedPageCount = pagination.pageCount ?? computedPageCount;

    // C-29: undefined literal 직접 할당 금지 — 조건부 할당 패턴
    if (typeof resolvedPageCount === 'number') {
      tanstackOptions.pageCount = resolvedPageCount;
    }
    if (typeof pagination.totalCount === 'number') {
      tanstackOptions.rowCount = pagination.totalCount;
    }
  }

  // 'client' | 'server' → enablePagination 자동 활성 (D5 결정)
  return { tanstackOptions, impliedEnablePagination: true };
}
