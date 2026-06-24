import type { ColumnDef } from '@tanstack/react-table';

/**
 * 셀 병합 비교 설정.
 * - `true`: 동일 값(`===`) 비교로 자동 병합
 * - `(prev, curr) => boolean`: 커스텀 비교 함수 (복합 조건 지원)
 *
 * @example
 * // boolean — 동일 값 자동 병합
 * { meta: { mergeRows: true } }
 *
 * @example
 * // 커스텀 비교 함수 — 복합 조건 병합
 * { meta: { mergeRows: (a, b) => a.dept === b.dept && a.year === b.year } }
 */
export type MergeRowsConfig<TData> =
  | boolean
  | ((prev: TData, curr: TData) => boolean);

/**
 * 본문 셀 가로 병합(colSpan) 콜백 (MOD-GRID-52).
 *
 * XX Grid `colSpan:(params)=>number` 대응 — 이 셀이 가로로 차지할 컬럼 수를 반환한다.
 * `1`(기본) = 스팬 없음, `n>1` = 자신 포함 n개 컬럼을 가로 병합(우측 n-1개 셀은 자동 skip).
 * mergeRows(값 비교 기반 rowSpan)와 달리 **per-cell 콜백 형식**이다.
 *
 * @example
 * // 첫 행의 이 컬럼 셀만 3컬럼 스팬
 * { meta: { colSpan: ({ rowIndex }) => (rowIndex === 0 ? 3 : 1) } }
 */
export type ColSpanFn<TData> = (params: {
  row: TData;
  rowIndex: number;
}) => number;

/**
 * mergeRows / colSpan 을 지원하는 확장 컬럼 정의.
 * TanStack ColumnDef meta 필드를 통해 병합 설정을 추가한다.
 *
 * @typeParam TData - 행 데이터 타입
 *
 * @example
 * const columns: MergingColumnDef<EmployeeRow>[] = [
 *   {
 *     id: 'dept',
 *     header: '부서',
 *     accessorKey: 'dept',
 *     meta: { mergeRows: true },
 *   },
 * ];
 */
export type MergingColumnDef<TData> = ColumnDef<TData> & {
  meta?: {
    mergeRows?: MergeRowsConfig<TData>;
    /** MOD-GRID-52: 본문 셀 가로 병합(colSpan) 콜백. */
    colSpan?: ColSpanFn<TData>;
    [key: string]: unknown;
  };
};

/**
 * computeMergeSpans 결과 Map.
 *
 * 키 형식: `${rowIdx}_${colId}`
 * - 값 > 1: 해당 셀이 값 개수만큼의 행을 병합하는 시작 셀
 * - 값 === 1: 병합 없는 일반 셀
 * - 값 === 0: 병합으로 인해 skip되어야 하는 셀 (null 반환)
 */
export type MergeSpanMap = Map<string, number>;

/**
 * computeColSpans 결과 Map (MOD-GRID-52).
 *
 * 키 형식: `${rowIdx}_${colId}`
 * - 값 > 1: 해당 셀이 가로로 값 개수만큼의 컬럼을 병합하는 시작 셀 (`colSpan` 속성)
 * - 값 === 0: 좌측 스팬에 피복되어 skip 되어야 하는 셀 (null 반환)
 * - 값 === 1 또는 미존재: 병합 없는 일반 셀
 */
export type ColSpanMap = Map<string, number>;

/**
 * MergingGrid 컴포넌트 Props.
 *
 * @typeParam TData - 행 데이터 타입 (object 필수)
 */
export interface MergingGridProps<TData> {
  /** 렌더링할 데이터 배열 */
  data: TData[];
  /** 컬럼 정의 (MergingColumnDef 확장 포함) */
  columns: MergingColumnDef<TData>[];
  /**
   * 병합 기능 활성화.
   * `false`(기본값)이면 일반 Grid 동작 보존 (AC-004 / C-6).
   * `true`이면 `meta.mergeRows`가 설정된 컬럼에서 rowSpan 자동 계산.
   */
  enableMerging?: boolean;
  /**
   * 본문 셀 가로 병합(colSpan) 활성화 (MOD-GRID-52).
   * `false`(기본값)이면 colSpan 비활성 — colSpan 속성/피복 셀 0 (byte-identical).
   * `true`이면 `meta.colSpan` 콜백이 설정된 컬럼에서 가로 병합 자동 계산.
   * mergeRows(rowSpan)와 독립 — 동일 셀에 둘 다 적용하는 조합은 범위 밖(vN).
   */
  enableColSpan?: boolean;
  /** table 엘리먼트에 적용할 CSS className */
  className?: string;
  /**
   * 가상화 활성화 (C-18 호환).
   * `true` 시 @tanstack/react-virtual useVirtualizer 사용.
   * `false`(기본값) 시 G-001/G-002 full DOM 렌더링 경로 유지.
   */
  enableVirtualization?: boolean;
  /**
   * 가상화 시 행 높이 추정값 (px). 기본값: 40.
   * `enableVirtualization=true` 시에만 사용.
   * ⚠️ 고정 행 높이 가정 — 가변 행 높이 환경에서는 scrollOffset 오차 발생 가능.
   */
  estimatedRowHeight?: number;
  /**
   * react-virtual overscan 행 수. 기본값: 5.
   * visible window 양쪽에 추가로 렌더링할 행 수.
   * `enableVirtualization=true` 시에만 사용.
   */
  virtualOverscan?: number;
}
