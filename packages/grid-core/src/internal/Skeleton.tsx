/**
 * Internal — `<tbody>` 영역의 skeleton row N개 렌더 (BaseGrid L122-132 흡수).
 *
 * G-003 D5: `<tbody>` 영역만 치환하여 G-002 의 sticky thead + pinning 외관을 보존한다.
 * thead 자체는 본 컴포넌트가 렌더하지 않고 `Grid.tsx` 의 정상 thead 를 그대로 둔다.
 *
 * @see G-003-spec.md Section 2.2 + D5/D8/D12
 */

import type { Table } from '@tanstack/react-table';

/**
 * `<SkeletonRows>` props.
 *
 * @typeParam TData - 행 데이터 타입.
 */
export interface SkeletonRowsProps<TData> {
  /**
   * 렌더할 skeleton 행 개수.
   * `Grid.tsx` 에서 `props.loadingRowCount ?? pagination.pageSize ?? 5` 로 계산하여 전달 (D8).
   */
  count: number;
  /**
   * TanStack Table 인스턴스. `getAllLeafColumns().length` 로 td 개수를 산출 (D12).
   * group columns 부재 시 `getAllColumns()` 와 동일 결과이지만, 미래 multi-row header
   * (MOD-GRID-14) 도입 대비로 leaf API 사용.
   */
  table: Table<TData>;
}

/**
 * skeleton row N개를 fragment 로 렌더한다.
 *
 * - 각 td 내부에 `<div className="h-4 bg-gray-100 rounded animate-pulse" />`
 * - 각 row 의 td 개수 = `table.getAllLeafColumns().length` (D12)
 * - 체크박스 컬럼 (`__select__`) 도 leaf 로 카운트되므로 thead 와 컬럼 수 일관성 유지
 *
 * @typeParam TData - 행 데이터 타입.
 * @param props - {@link SkeletonRowsProps}.
 * @returns `<tr>` × N fragment.
 *
 * @see G-003-spec.md Section 2.2 + D5/D8/D12
 */
export function SkeletonRows<TData>({ count, table }: SkeletonRowsProps<TData>): JSX.Element {
  const columnCount = table.getAllLeafColumns().length;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={`skeleton-${i}`} className="border-b border-gray-100">
          {Array.from({ length: columnCount }).map((__, j) => (
            <td key={`skeleton-${i}-${j}`} className="px-4 py-3">
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
