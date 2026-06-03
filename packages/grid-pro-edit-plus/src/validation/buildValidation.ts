import type { Validator } from '@topgrid/grid-pro-tracking';
import type { CellClassNameCallback } from '@topgrid/grid-core';
import type { ValidationRule } from './types';

const DEFAULT_INVALID_CLASS = 'topgrid-cell-invalid';

/**
 * 선언적 검증 룰 배열 → `@topgrid/grid-pro-tracking` 의 `Validator<TData>` 컴파일 (MOD-GRID-23 G-1).
 *
 * 반환 validator 를 tracking `ChangeTrackingConfig.validator` 로 주입하면 tracking 이 **기존 동작**
 * 으로 invalid 행을 `added`/`updated` 에서 제외하고 `getChangeSet().errors` 에 수집한다 — 즉
 * **커밋 차단은 재구현 없이 tracking 계약 재사용**([[LESS-003]]). 순수 함수.
 *
 * @example
 * const tracking = useChangeTracking({
 *   data, rowKey: 'id',
 *   validator: buildValidator<Row>([
 *     { field: 'age', validate: (r) => r.age >= 0, message: '나이는 0 이상' },
 *   ]),
 * });
 */
export function buildValidator<TData>(
  rules: ValidationRule<TData>[],
): Validator<TData> {
  return (row) => {
    const errors = rules
      .filter((rule) => !rule.validate(row))
      .map((rule) => rule.message);
    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  };
}

/**
 * 선언적 검증 룰 배열 → grid-core `CellClassNameCallback<TData>` 컴파일 (MOD-GRID-23 G-1).
 *
 * `field` 가 지정된 룰만 셀 표시에 참여한다 — 해당 컬럼(`cell.column.id === rule.field`) 셀이
 * 위반(`!validate(row)`)이면 룰의 `className`(기본 `topgrid-cell-invalid`)을 부여한다.
 * MOD-GRID-24 `buildCellClassName` 과 **동일 계약·동형 패턴**(선언적 룰 → 기존 콜백). 순수 함수.
 *
 * @example
 * <Grid cellClassName={buildValidationCellClass<Row>([
 *   { field: 'age', validate: (r) => r.age >= 0, message: '', className: 'border-red-500' },
 * ])} />
 */
export function buildValidationCellClass<TData>(
  rules: ValidationRule<TData>[],
): CellClassNameCallback<TData> {
  return (cell) => {
    const data = cell.row.original;
    const matched = rules
      .filter(
        (rule) =>
          rule.field === cell.column.id && !rule.validate(data),
      )
      .map((rule) => rule.className ?? DEFAULT_INVALID_CLASS);
    return matched.length > 0 ? matched.join(' ') : undefined;
  };
}
