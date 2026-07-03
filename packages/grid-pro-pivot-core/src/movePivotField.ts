/**
 * @topgrid/grid-pro-pivot — MOD-GRID-64 / G-1
 * 피벗 도구 패널 DnD 의 순수 종결형 변환.
 *
 * 한 field 를 PivotConfig 의 한 존(rows / columns / values / available)으로 이동한다.
 * "이동" = 모든 존에서 제거한 뒤 대상 존 끝에 추가(`available` 은 제거만 = 미배정).
 *
 * values 로 (재)진입 시 기존 measure def(`aggregationFn`/`label`)를 보존한다 — 다른 존을
 * 거쳐 values 로 돌아와도 집계 설정이 살아남도록. 신규 진입은 `{ field, aggregationFn: 'sum' }`.
 *
 * Out(이 함수가 의도적으로 하지 않는 것 — MOD-GRID-64 spec):
 * - 동일 field 를 values 에 2회(multi-aggregation): `v.field !== field` 제거가 금지한다.
 * - aggregation-fn 선택: 신규 value 는 'sum' 고정(picker UI 없음).
 * - 존 내부 재정렬: drop = 항상 대상 존 끝으로.
 */
import type { PivotConfig } from './types.js';

/** 피벗 패널의 드롭 대상 존. `available` = 어느 차원에도 배정되지 않음. */
export type PivotZone = 'rows' | 'columns' | 'values' | 'available';

/**
 * `field` 를 `toZone` 으로 이동한 새 PivotConfig 를 반환한다(원본 불변).
 *
 * @param config - 현재 피벗 구성.
 * @param field  - 이동할 소스 필드명(`config` 의 어느 존에 있든 / 미배정이든 무방).
 * @param toZone - 대상 존.
 */
export function movePivotField(
  config: PivotConfig,
  field: string,
  toZone: PivotZone,
): PivotConfig {
  // 1) 기존 measure def 포착(values 재진입 시 보존).
  const existingDef = config.values.find((v) => v.field === field);

  // 2) 모든 존에서 제거.
  const rows = config.rows.filter((f) => f !== field);
  const columns = config.columns.filter((f) => f !== field);
  const values = config.values.filter((v) => v.field !== field);

  // 3) 대상 존 끝에 추가(available = 추가 없음 = 미배정).
  if (toZone === 'rows') rows.push(field);
  else if (toZone === 'columns') columns.push(field);
  else if (toZone === 'values') {
    values.push(existingDef ?? { field, aggregationFn: 'sum' });
  }

  return { rows, columns, values };
}
