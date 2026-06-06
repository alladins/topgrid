/**
 * @topgrid/grid-pro-filter — cross-filter 매핑 (MOD-GRID-47) — 순수.
 *
 * 차트(또는 임의 위젯) 선택을 grid 필터 식으로 변환한다 — 차트 cross-filtering 의 **엔진**(클릭→setFilter
 * wiring·linked highlight = browser/후속). 식 타입을 소유한 grid-pro-filter 에 둔다(차트→필터 결합 회피;
 * 선택 descriptor 는 차트-무관 generic).
 *
 * ★ multi-select 결합(advisor): **같은 필드 = OR**(North+South = status IN [...]) · **다른 필드 = AND**(category=North
 * AND year=2024). 소비자에게 떠넘기지 않고 매핑이 정의한다(매핑이 곧 기능).
 *
 * ★ `type` 는 **컬럼 메타에서** 온다(클릭 값에서 추론 금지, MOD-46 동일 교훈) — `year=2024`(number)·`category="North"`
 * (text) 가 올바른 타입의 condition 을 만들어야 `"100">"20"` 류 boundary 버그를 차트 경계에서 재도입 안 함.
 *
 * 타입만 import → node strip-types 직접 실행.
 */

import type { AdvancedFilterExpr, FilterValueType } from './advancedFilter.js';

/** 한 선택 항목(차트-무관 generic): 필드 + 타입(컬럼 메타) + 선택 값. */
export interface FilterSelection {
  field: string;
  type: FilterValueType;
  value: unknown;
}

/**
 * MOD-GRID-47: 선택 목록 → 고급 필터 식. **같은 필드 OR · 다른 필드 AND**. 빈 선택 → 무제약 빈 group(true).
 *
 * @param selections - 선택 descriptor 목록(차트 클릭 등이 컬럼 메타로 type 을 채워 생성).
 */
export function selectionsToFilter(selections: readonly FilterSelection[]): AdvancedFilterExpr {
  if (selections.length === 0) return { kind: 'group', logic: 'and', children: [] }; // 무제약

  // 같은 필드끼리 묶음(첫-등장 순서 보존).
  const order: string[] = [];
  const byField = new Map<string, FilterSelection[]>();
  for (const s of selections) {
    let arr = byField.get(s.field);
    if (arr === undefined) { arr = []; byField.set(s.field, arr); order.push(s.field); }
    arr.push(s);
  }

  // 필드별: eq condition 들을 OR(단일이면 condition 직접).
  const fieldExprs: AdvancedFilterExpr[] = order.map((field) => {
    const sels = byField.get(field)!;
    const conds: AdvancedFilterExpr[] = sels.map((s) => ({
      kind: 'condition',
      field,
      type: s.type,
      operator: 'eq',
      value: s.value,
    }));
    return conds.length === 1 ? conds[0]! : { kind: 'group', logic: 'or', children: conds };
  });

  // 필드 간 AND(단일 필드면 그 식 직접).
  return fieldExprs.length === 1 ? fieldExprs[0]! : { kind: 'group', logic: 'and', children: fieldExprs };
}
