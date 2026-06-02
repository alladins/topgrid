import { createRow, type Row, type Table } from '@tanstack/react-table';

/**
 * 소비자 공급 floating 행 데이터를 실제 TanStack `Row<TData>` 객체로 변환한다 (MOD-GRID-24 G-2).
 *
 * **AG Grid 의 pinnedTopRowData/pinnedBottomRowData 와 동형** — 데이터 모델 밖의 *추가* 행
 * (합계/요약 등 소비자가 직접 만든 행)을 그리드 상/하단에 고정 표시한다.
 *
 * - **집계 계산 안 함**: 소비자가 total 객체를 제공 (집계는 `@topgrid/grid-pro-agg`/Pro 경계).
 * - **상호작용 핀 아님**: 기존 행을 사용자가 핀하는 기능(`@topgrid/grid-pro-master` `RowPinningOptions`/Pro)
 *   과 별개. floating 행은 항상-표시 정적 행이다.
 *
 * `createRow` 로 실제 Row 를 만들므로 셀이 `columnDef.cell` 렌더러를 그대로 통과한다(raw 값
 * 직접 렌더 회피 — 커스텀 셀 렌더러 보존). 순수 함수.
 *
 * @param table    TanStack Table 인스턴스 (컬럼 모델 소스)
 * @param data     floating 행 데이터 배열 (없거나 빈 배열 → `[]`)
 * @param position 'top' | 'bottom' (행 id prefix 구분)
 * @returns 렌더 가능한 `Row<TData>[]` (`getVisibleCells()` 가 컬럼 셀 렌더러로 디스패치)
 */
export function buildFloatingRows<TData>(
  table: Table<TData>,
  data: TData[] | undefined,
  position: 'top' | 'bottom',
): Row<TData>[] {
  if (!data || data.length === 0) return [];
  return data.map((original, index) =>
    createRow(table, `__floating_${position}_${index}`, original, index, 0),
  );
}
