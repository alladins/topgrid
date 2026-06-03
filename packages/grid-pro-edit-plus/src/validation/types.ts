/**
 * 선언적 검증 룰 — MOD-GRID-23 G-1.
 *
 * 룰은 순수 술어(`validate`)와 메시지의 쌍이다. `buildValidator` 가 이를
 * `@topgrid/grid-pro-tracking` 의 `Validator<TData>` 계약으로 컴파일하고(커밋 차단은
 * tracking 기존 동작 재사용), `buildValidationCellClass` 가 grid-core 의
 * `CellClassNameCallback<TData>` 로 컴파일한다(위반 셀 시각 표시).
 */

/**
 * 행/필드 단위 검증 룰.
 *
 * @typeParam TData - 행 데이터 타입
 */
export interface ValidationRule<TData> {
  /**
   * 위반 셀 시각 표시용 컬럼 id. 지정 시 `buildValidationCellClass` 가 이 컬럼 셀에만
   * className 을 부여한다. 미지정이면 행-수준 룰(셀 표시 없음, 메시지/커밋차단만).
   */
  field?: keyof TData & string;
  /** 순수 술어 — `true` = 통과, `false` = 위반 */
  validate: (row: TData) => boolean;
  /** 위반 시 `errors` 에 수집할 메시지 */
  message: string;
  /**
   * 위반 셀에 부여할 className (`field` 지정 룰에서만 사용).
   * @default 'topgrid-cell-invalid'
   */
  className?: string;
}
