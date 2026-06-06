/**
 * @topgrid/grid-pro-filter — cross-column advanced filter 식 모델 + 평가기 (MOD-GRID-46) — 순수.
 *
 * AG Advanced Filter 대응의 **엔진**: 컬럼을 가로지르는 중첩 boolean 식(`(A>5 AND B='x') OR C contains 'y'`)을
 * 행에 평가한다. 쿼리빌더 **UI** 는 본 모듈 밖(browser/후속) — 소비자가 식 트리를 만들어 `makeAdvancedFilterFn`
 * 으로 global/table 필터에 쓴다.
 *
 * ★ cross-column 정확성(advisor): condition 은 **명시적 `type`** 을 들고 다닌다. 연산자 의미가 타입에 의존하므로
 * (`"100" > "20"` 는 lexical 로 false·numeric 으로 true) `typeof row[field]` 추론 금지(행마다 다름·null 깨짐).
 *
 * ★ MOD-30 매처 **의미** 미러(case-insensitive text·null→false) — Row-based FilterFn 은 import 안 함(계약 상이).
 *
 * 타입만 import 0(전부 로컬) → node strip-types 직접 실행.
 */

/** 비교 타입(연산자 의미 결정). */
export type FilterValueType = 'number' | 'text' | 'boolean' | 'date';

/** 비교 연산자. */
export type FilterOperator =
  | 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte'
  | 'contains' | 'startsWith' | 'endsWith'
  | 'blank' | 'notBlank';

/** 단일 cross-column 조건. `value` 는 blank/notBlank 에 불요(없으면 inert). */
export interface FilterCondition {
  kind: 'condition';
  field: string;
  type: FilterValueType;
  operator: FilterOperator;
  value?: unknown;
}

/** AND/OR 그룹(중첩 가능). */
export interface FilterGroup {
  kind: 'group';
  logic: 'and' | 'or';
  children: AdvancedFilterExpr[];
}

/** 고급 필터 식(그룹 트리 또는 단일 조건). */
export type AdvancedFilterExpr = FilterGroup | FilterCondition;

function isBlankVal(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

/** 비활성(불완전) 식 — group 평가 전 제거(빈 조건이 OR 을 전체-행으로 붕괴시키는 함정 차단, MOD-30 autoRemove). */
function isInert(expr: AdvancedFilterExpr): boolean {
  if (expr.kind === 'group') return expr.children.every(isInert);
  // blank/notBlank 는 value 불요 → 항상 active. 그 외는 value 비면 inert.
  if (expr.operator === 'blank' || expr.operator === 'notBlank') return false;
  return isBlankVal(expr.value);
}

function toBool(v: unknown): boolean {
  return v === true || v === 'true' || v === 1 || v === '1';
}

function toTime(v: unknown): number | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime();
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

function numCompare(a: number, b: number, op: FilterOperator): boolean {
  switch (op) {
    case 'eq': return a === b;
    case 'neq': return a !== b;
    case 'gt': return a > b;
    case 'lt': return a < b;
    case 'gte': return a >= b;
    case 'lte': return a <= b;
    default: return false; // unknown / 타입-부적합 연산자 → false(안전 fallback)
  }
}

function textCompare(a: string, b: string, op: FilterOperator): boolean {
  switch (op) {
    case 'eq': return a === b;
    case 'neq': return a !== b;
    case 'contains': return a.includes(b);
    case 'startsWith': return a.startsWith(b);
    case 'endsWith': return a.endsWith(b);
    case 'gt': return a > b;
    case 'lt': return a < b;
    case 'gte': return a >= b;
    case 'lte': return a <= b;
    default: return false;
  }
}

/** 단일 조건을 행 값에 매칭(순수, type 명시). null/blank cell → text 매칭 false(MOD-30). unknown op → false. */
export function matchCondition(
  rowValue: unknown,
  type: FilterValueType,
  operator: FilterOperator,
  value: unknown,
): boolean {
  if (operator === 'blank') return isBlankVal(rowValue);
  if (operator === 'notBlank') return !isBlankVal(rowValue);

  switch (type) {
    case 'number': {
      const a = Number(rowValue);
      const b = Number(value);
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      return numCompare(a, b, operator);
    }
    case 'text': {
      if (isBlankVal(rowValue)) return false; // null cell → false (MOD-30 null-safe)
      return textCompare(String(rowValue).toLowerCase(), String(value ?? '').toLowerCase(), operator);
    }
    case 'boolean': {
      const a = toBool(rowValue);
      const b = toBool(value);
      return operator === 'eq' ? a === b : operator === 'neq' ? a !== b : false;
    }
    case 'date': {
      const a = toTime(rowValue);
      const b = toTime(value);
      if (a === null || b === null) return false;
      return numCompare(a, b, operator);
    }
  }
}

/**
 * MOD-GRID-46: 고급 필터 식을 행에 평가(순수, 재귀). group=inert 자식 제거 후 reduce(빈/all-inert→true=무제약).
 *
 * @param expr - 식 트리.
 * @param row - 평가할 행(필드 record).
 */
export function evaluateAdvancedFilter(
  expr: AdvancedFilterExpr,
  row: Record<string, unknown>,
): boolean {
  if (expr.kind === 'group') {
    const active = expr.children.filter((c) => !isInert(c));
    if (active.length === 0) return true; // 빈/all-inert 그룹 = 무제약
    const results = active.map((c) => evaluateAdvancedFilter(c, row));
    return expr.logic === 'or' ? results.some(Boolean) : results.every(Boolean);
  }
  if (isInert(expr)) return true; // bare inert 조건 = 무필터
  return matchCondition(row[expr.field], expr.type, expr.operator, expr.value);
}

/** 식 → 행 predicate(소비자가 global/table 필터로 사용). */
export function makeAdvancedFilterFn(
  expr: AdvancedFilterExpr,
): (row: Record<string, unknown>) => boolean {
  return (row) => evaluateAdvancedFilter(expr, row);
}
