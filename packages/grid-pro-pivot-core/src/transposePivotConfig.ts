/**
 * @topgrid/grid-pro-pivot — pivot 축 전치 (MOD-GRID-31 G-3) — 순수.
 *
 * 행 차원 ↔ 열 차원을 swap 한다(값 정의는 불변). computePivot 이 임의 config 를 이미 처리하므로 변환
 * 엔진 신규는 0 — config 만 바꿔 재실행하면 전치된 pivot 이 나온다.
 *
 * ⚠ 전치는 computePivot 재실행 → PivotRow 의 `__id` 재배정·값 leafKey 변경을 의미한다. 따라서 호출부
 * (PivotGrid)는 config 변경 시 collapse(`collapsedIds`)·sort(`leafKey`) 상호작용 state 를 **반드시 리셋**해야
 * 한다(아니면 stale id 가 엉뚱한 그룹을 숨김 — advisor).
 */

import type { PivotConfig } from './types';

/** rows ↔ columns 를 swap 한 새 config(values 보존). 두 번 적용 = 원본(involution). */
export function transposePivotConfig(config: PivotConfig): PivotConfig {
  return {
    rows: config.columns,
    columns: config.rows,
    values: config.values,
  };
}
