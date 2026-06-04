/**
 * @topgrid/grid-pro-filter — compound(AND/OR) multi-condition filter 순수 코어 (MOD-GRID-30 G-3).
 *
 * ★ reuse(LESS-005): 조건별 매칭은 **기존 base FilterFn**(grid-features `textFilterFn`/`numberFilterFn`)을
 * 그대로 N번 호출해 AND/OR 로 reduce 한다(매칭 재구현 안 함). base 의 `autoRemove` 도 재사용해 **비활성
 * (빈/불완전) 조건을 reduce 전에 제거**한다.
 *
 * ★ 척추(반드시 처음부터): textFilterFn 은 빈 값에 `true` 를 반환한다. 빈 조건을 거르지 않으면
 * `OR(match, 빈→true) = true = 전체 행`(틀림 — 채운 조건의 매치만 나와야 함). 그래서 base.autoRemove 로
 * active 조건만 남긴 뒤 reduce 하고, active 가 0이면 필터 무효(true)로 본다.
 *
 * 본 파일은 `type FilterFn` 만 import(런타임 import 0) → node strip-types 직접 실행 가능(순수 검증).
 */

import type { FilterFn } from '@tanstack/react-table';

/** compound 필터 값 — 컬럼당 배타적(단일 필터의 값 shape 와 호환 안 됨; multi*FilterFn 전용). */
export interface MultiFilterValue<C> {
  /** 조건 결합 논리. */
  logic: 'and' | 'or';
  /** 조건 목록(각 조건 = base FilterFn 의 값 shape). 일반적으로 N개(UI 는 2개 출하). */
  conditions: C[];
}

/**
 * base FilterFn 을 compound(AND/OR) FilterFn 으로 승격. 비활성 조건은 base.autoRemove 로 제거 후 reduce.
 *
 * @param base - 조건별 매칭 FilterFn(예: `textFilterFn`). `autoRemove` 가 있으면 비활성 조건 판별에 사용.
 */
export function makeMultiFilterFn<C>(base: FilterFn<unknown>): FilterFn<unknown> {
  const autoRemoveOne = (c: C): boolean => base.autoRemove?.(c) ?? false;

  const fn: FilterFn<unknown> = (row, columnId, value, addMeta): boolean => {
    const v = value as MultiFilterValue<C> | undefined;
    const conditions = v?.conditions ?? [];
    // 비활성(빈/불완전) 조건 제거 — 빈 조건이 OR 을 전체-행으로 만드는 함정 차단.
    const active = conditions.filter((c) => !autoRemoveOne(c));
    if (active.length === 0) return true; // 활성 조건 없음 = 필터 무효
    const results = active.map((c) => base(row, columnId, c as unknown, addMeta));
    return v!.logic === 'or' ? results.some(Boolean) : results.every(Boolean);
  };

  // 활성 조건이 하나도 없으면 TanStack 이 컬럼 필터 자동 해제.
  fn.autoRemove = (value): boolean => {
    const v = value as MultiFilterValue<C> | undefined;
    if (!v || !v.conditions) return true;
    return v.conditions.every((c) => autoRemoveOne(c));
  };

  return fn;
}
