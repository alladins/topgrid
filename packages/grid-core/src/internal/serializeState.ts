/**
 * @file serializeState — GridStateValues ↔ URLSearchParams 직렬화/역직렬화 유틸 (G-005, MOD-GRID-02).
 *
 * 순수 함수 — React hook 없음. `useUrlSync.ts` 에서만 import (C-31 call-site, D8).
 * `index.ts` re-export 금지 (internal/ 규약, D8).
 *
 * @see G-005-spec.md Section 5.1
 * @internal
 */

import type { GridStateValues, GridStateKey } from '../types';

/**
 * 각 key 의 기본값(empty/default) 여부 판단 — URL 에서 키 삭제 여부 결정 (AC-003).
 *
 * - sorting / columnFilters / columnOrder: 빈 배열 (`length === 0`)
 * - rowSelection / columnPinning / columnSizing / columnVisibility: 빈 객체 (key 수 === 0)
 * - pagination: `{ pageIndex: 0, pageSize: 10 }` 기본값
 *
 * @param key - GridStateKey
 * @param value - 해당 key 의 현재 state 값
 * @returns true 이면 URL 에서 해당 키 삭제 (AC-003)
 */
export function isDefaultState(key: GridStateKey, value: unknown): boolean {
  switch (key) {
    case 'sorting':
    case 'columnFilters':
    case 'columnOrder':
      return Array.isArray(value) && value.length === 0;

    case 'rowSelection':
    case 'columnPinning':
    case 'columnSizing':
    case 'columnVisibility':
      return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
      );

    case 'pagination': {
      if (
        typeof value !== 'object' ||
        value === null ||
        Array.isArray(value)
      ) {
        return false;
      }
      const p = value as Record<string, unknown>;
      return p['pageIndex'] === 0 && p['pageSize'] === 10;
    }

    default:
      return false;
  }
}

/**
 * GridStateValues subset → URLSearchParams 변환 (AC-001, AC-002, AC-003).
 *
 * - 기존 params 복사 후 지정 key 만 수정 (R-3: 타 query param 보존)
 * - isDefaultState 시 해당 key 삭제 (AC-003 URL 정리)
 * - prefix 적용 시 `${prefix}_${key}` 형태 (Section 5.1)
 *
 * @param state   - GridStateValues 의 Partial (8개 key 선택적)
 * @param keys    - 동기화할 key 목록
 * @param prefix  - URL param 네임스페이스 prefix (빈 문자열 = no prefix)
 * @param existingParams - 현재 URLSearchParams (타 params 보존 베이스)
 * @returns 수정된 새 URLSearchParams 인스턴스
 */
export function serializeGridState(
  state: Partial<GridStateValues>,
  keys: GridStateKey[],
  prefix: string,
  existingParams: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(existingParams); // 타 params 보존 (R-3)
  for (const key of keys) {
    const paramKey = prefix ? `${prefix}_${key}` : key;
    const value = state[key];
    if (isDefaultState(key, value)) {
      next.delete(paramKey); // AC-003: 기본값 → 키 삭제
    } else {
      next.set(paramKey, JSON.stringify(value));
    }
  }
  return next;
}

/**
 * URLSearchParams → Partial<GridStateValues> 역직렬화 (AC-004 hydration).
 *
 * - JSON.parse 실패 시 해당 key skip (R-1 대응 — throw 없음)
 * - prefix 적용 시 `${prefix}_${key}` 형태로 param 조회
 *
 * @param params  - 현재 URLSearchParams
 * @param keys    - 역직렬화 대상 key 목록
 * @param prefix  - URL param 네임스페이스 prefix
 * @returns 파싱 성공한 key 만 포함한 Partial<GridStateValues>
 *
 * @remarks
 * **F-06 spec code defect fix**: spec Section 5.1 L234-235 에서 `(result as any)[key] = ...` 패턴을
 * 사용했으나 C-4(any 금지) 위반. 수정: `result` 를 `Record<GridStateKey, unknown>` 로 타입 지정 후
 * key 단위 assign, return 시 `Partial<GridStateValues>` 로 cast (JSON.parse 결과 unknown 보존).
 * severity: medium (C-4/B-02 위반이나 런타임 정확성 동일).
 */
export function deserializeGridState(
  params: URLSearchParams,
  keys: GridStateKey[],
  prefix: string,
): Partial<GridStateValues> {
  const result = {} as Record<GridStateKey, unknown>;
  for (const key of keys) {
    const paramKey = prefix ? `${prefix}_${key}` : key;
    const raw = params.get(paramKey);
    if (raw === null) continue;
    try {
      result[key] = JSON.parse(raw) as GridStateValues[typeof key];
    } catch {
      // R-1: 파싱 실패 → skip (result 에 key 미포함)
    }
  }
  return result as Partial<GridStateValues>;
}
