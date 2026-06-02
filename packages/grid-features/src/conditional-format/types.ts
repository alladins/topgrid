/**
 * 조건부 서식(conditional formatting) 룰 타입 — MOD-GRID-24 G-1.
 *
 * grid-core 가 이미 노출하는 `rowClassName`/`cellClassName` 콜백 위에 **선언적 룰** 레이어를
 * 얹는다(메커니즘 신규 아님 — [[LESS-003]] reuse-gate). 룰은 순수 술어(predicate)와 className
 * 의 쌍이며, `buildRowClassName`/`buildCellClassName` 가 grid-core 콜백으로 컴파일한다.
 */

/**
 * 행 단위 조건부 서식 룰.
 *
 * @typeParam TData - 행 데이터 타입
 */
export interface RowFormatRule<TData> {
  /** 행 데이터(`row.original`)와 0-based 행 인덱스(`row.index`)로 평가하는 술어 */
  when: (data: TData, index: number) => boolean;
  /** 술어 true 시 `<tr>` 에 append 할 className */
  className: string;
}

/**
 * 셀 단위 조건부 서식 룰.
 *
 * @typeParam TData - 행 데이터 타입
 * @typeParam TValue - 셀 값 타입 (기본 unknown)
 */
export interface CellFormatRule<TData, TValue = unknown> {
  /** 셀 값(`cell.getValue()`)과 행 데이터(`cell.row.original`)로 평가하는 술어 */
  when: (value: TValue, data: TData) => boolean;
  /** 술어 true 시 셀에 append 할 className */
  className: string;
}
