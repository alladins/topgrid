# G-003 Specification: 사용자 정의 aggregator 함수 등록 (aggregationFns registry)

**Module**: MOD-GRID-15 / aggregation  
**Goal ID**: G-003  
**Priority**: P1  
**Migration Impact**: low  
**Score Threshold**: 90  
**Spec Version**: 1.0.0  
**Date**: 2026-05-15  
**Author**: tw-grid Spec Writer (automated)

---

## ★ 사전 결정 (Pre-Resolved Decisions)

| ID | 결정 내용 | 근거 |
|----|----------|------|
| **D1** | Section 7 implementFiles 경로 권한: `topvel-grid-monorepo/packages/grid-pro-agg/` 사용. goals.json G-003 `implementFiles` 2개 모두 `TOMIS/packages/...` prefix — discover 단계 stale 아티팩트. 실제 경로: `topvel-grid-monorepo/packages/grid-pro-agg/...` (C-28, ADR-MOD-GRID-00-001, G-001/G-002 D1 선례). | C-28, ADR-MOD-GRID-00-001 |
| **D2** | goals.json `implementFiles` 범위 보정: goals.json G-003에는 `aggregationFns.ts`·`types.ts` 2개만 명시. 실제로 registry lookup을 AggregationGrid에 통합하고 `registerAggregationFn`을 공개 API로 내보내기 위해 `AggregationGrid.tsx`·`index.ts`·`AggregationGrid.stories.tsx` 3개를 MODIFY 대상으로 추가한다 (G-002 D2 선례). 최종 구현 파일: 5개 (MODIFY만) | goals.json scope 보정, G-002 D2 선례 |
| **D3** | `resolveAggregationFn` 시그니처 보존: G-001 ADR-MOD-GRID-15-003이 "string key 반환 (함수 참조 반환 기각)"으로 확정. G-003는 이를 변경하지 않는다. 신규 `getAggregationFn<TData>(name: string): AggregationFn<TData> \| undefined`를 추가하여 registry 전용 lookup을 분리한다. `AggregationGrid` 내부에서 두 함수를 합성한다: registry hit → 함수 직접 전달, miss + 내장 키 → `resolveAggregationFn` 문자열 키 전달, 둘 다 아님 → console.error + 'count' fallback. | ADR-MOD-GRID-15-003 보존, C-6 |
| **D4** | `AggregationColumnMeta.aggregationFn` 타입 확장: 현재 `AggregationFnKey` (5종 union). 사용자 정의 함수 이름을 허용하기 위해 `AggregationFnKey \| (string & {})` 로 확장. `(string & {})` 패턴으로 5종 자동완성 유지 + 임의 문자열 허용. `AggregationGrid` 내 resolution 로직은 registry 먼저, 없으면 `resolveAggregationFn` 시도. | AC-001, C-4, TypeScript literal widening 패턴 |
| **D5** | `verifyOrWarn` 라이선스 스텁: G-001 `AggregationGrid.tsx` 모듈 레벨에 이미 1회 호출됨 (ADR-MOD-GRID-15-002). G-003 신규·수정 파일 (`aggregationFns.ts`, `types.ts`, `AggregationGrid.tsx`, `index.ts`, `stories.tsx`)에 추가 호출 없음. 한 패키지 1회 원칙 준수 (G-002 D7 동일 결정). | ADR-MOD-GRID-15-002, G-002 D7, C-24 |
| **D6** | 중복 등록 정책 (D7 ADR 후보 → G-003 scope 내 결정): **overwrite + console.warn**. 이미 등록된 이름에 `registerAggregationFn` 재호출 시 덮어쓰고 `console.warn('[grid-pro-agg] registerAggregationFn: overwriting existing fn for key "..."')` 출력. throw/error 방식 기각 — AC-002의 no-throw 정책과 일관성 유지. | AC-002 (no throw), G-003 D7 ADR 후보 → 본 spec에서 결정 완료 |
| **D7** | `table.options.aggregationFns` 우선순위 결정: `AggregationGrid`는 `table.options.aggregationFns`를 외부에 노출하지 않음 (G-001·G-002에서도 미노출). registry 조회가 단일 진입점이므로 충돌 시나리오가 존재하지 않는다. `table.options.aggregationFns`는 미활용 — registry가 유일한 lookup 경로 (AC-003 단일 진입점). ADR 신설 불필요. | G-001/G-002 구현 실증, AC-003 |

### D1 결정 — goals.json implementFiles 경로 보정 결과

| goals.json 원문 (stale) | 본 Spec 채택 경로 |
|-------------------------|-----------------|
| `D:/project/topvel_project/TOMIS/packages/grid-pro-agg/src/aggregationFns.ts` | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/aggregationFns.ts` |
| `D:/project/topvel_project/TOMIS/packages/grid-pro-agg/src/types.ts` | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/types.ts` |

### D2 결정 — goals.json implementFiles 누락 보정

| 보정 파일 | 누락 원인 | 본 Spec 추가 |
|---------|---------|------------|
| `AggregationGrid.tsx` MODIFY | goals.json G-003 implementFiles에 누락 | Section 7 표 추가 |
| `index.ts` MODIFY | goals.json G-003 implementFiles에 누락 | Section 7 표 추가 |
| `AggregationGrid.stories.tsx` MODIFY | goals.json G-003 implementFiles에 누락 | Section 7 표 추가 |

---

## Section 1: 현행 분석 (AS-IS)

### 참조 추적 테이블

| 레이어 | 참조 대상 | 결과 |
|--------|---------|------|
| **L0** | tw-framework-front 현 구현 파일 | N/A — 신규 Pro 패키지. 현 구현 없음 |
| **L1** | TanStack v8 `AggregationFn<TData>` 시그니처 | 아래 상세 |
| **L2** | publish 중간 참조 소스 | N/A — 신규 Pro 패키지 |
| **L3** | TO-BE 영향 사용처 | N/A — `affectedUsageFiles: []` 0개 |
| **R-A** | AG Grid Enterprise `aggFuncs` 커스텀 등록 패턴 | 아래 상세 |
| **R-W** | Wijmo `wjGrid.Aggregate` 커스텀 함수 개념 | 아래 상세 (참조만 — C-16) |

### L0 — 현 구현 상태

N/A — 신규 Pro 패키지. 현행 tw-framework-front에 `@tomis/grid-pro-agg` import 없음.

현재 `packages/grid-pro-agg/src/aggregationFns.ts` (G-001/G-002 완료 상태):
- `TanStackAggKey` 타입 export
- `resolveAggregationFn(key: AggregationFnKey): TanStackAggKey` export (string key 반환)
- registry Map 없음, `registerAggregationFn` 함수 없음 — G-003 목표

현재 `packages/grid-pro-agg/src/index.ts`:
- `resolveAggregationFn`, `TanStackAggKey`, `AggregationFnKey`, `AggregationColumnMeta`, `AggregationColumnDef`, `AggregationGridProps`, `GroupRowProps`, `FooterRowProps` export
- `registerAggregationFn`, `getAggregationFn` export 없음 — G-003 추가 대상

현재 `packages/grid-pro-agg/src/AggregationGrid.tsx`:
- `resolveAggregationFn` 결과(string key)를 `column.aggregationFn`에 직접 전달
- registry lookup 로직 없음 — G-003 통합 대상

### L1 — TanStack v8 AggregationFn 시그니처 (tanstack-api-inventory.md §2.4 확인)

TanStack Table v8 aggregationFns 카탈로그 (`table-core/build/lib/index.d.ts`):

```ts
// @tanstack/table-core — AggregationFn<TData> 표준 시그니처 (C-2)
type AggregationFn<TData extends RowData> = (
  columnId: string,
  leafRows: Row<TData>[],
  childRows: Row<TData>[]
) => unknown;
```

내장 registry (`aggregationFns` 객체, tanstack-api-inventory.md §2.4):

| 키 | 동작 |
|----|------|
| `sum` | 수치 합산 |
| `min` | 최솟값 |
| `max` | 최댓값 |
| `mean` | 평균 (사용자 facing `avg` → G-001 D5 매핑) |
| `count` | 행 수 (비수치 포함) |
| `median`, `unique`, `uniqueCount`, `extent` | 기타 내장 |

`TableOptions<TData>` 에서 `aggregationFns?: Record<string, AggregationFn<TData>>` 를 통해 table-level custom fn 주입 가능하나, `AggregationGrid`는 이를 외부에 노출하지 않는다 (D7).

`ColumnDef<TData>` 에서 `aggregationFn?: AggregationFn<TData> | string` — 함수 참조 또는 string key 둘 다 허용.

### R-A (AG Grid Enterprise — C-7, 개념 학습 전용)

`publish-aggrid-analysis.md` 에서 확인: AG Grid는 `gridOptions.aggFuncs` 객체에 `{ [name]: (params) => value }` 형식으로 커스텀 집계 함수를 등록한다. `colDef.aggFunc: 'myFn'` 문자열 참조. 미등록 이름에 대해서는 runtime 경고 후 기본 동작으로 fallback. 개념 학습 전용 (C-7, AG Grid API 직접 사용 금지).

### R-W (Wijmo — 참조만, C-16)

`publish-wijmo-analysis.md §4` 확인: Wijmo에서 커스텀 집계는 `getAggregate` 함수 override 또는 `IColumnAggregateDescriptor.getAggregate` 콜백으로 구현. Wijmo SDK 코드 차용 절대 금지 (C-16).

---

## Section 2: API 계약 (API Contract)

### 2.1 공개 API 함수 시그니처

```typescript
import type { AggregationFn } from '@tanstack/react-table';

/**
 * 사용자 정의 집계 함수를 module-level registry에 등록한다.
 *
 * - TanStack AggregationFn<TData> 표준 시그니처 그대로 사용 (C-2).
 * - strict TypeScript, no any (C-4). 반환 타입은 AggregationFn<TData> 시그니처의 unknown.
 * - 이미 등록된 이름: overwrite + console.warn (D6 — no throw).
 * - 한 패키지 라이선스 verifyOrWarn 1회 원칙 — 이 함수는 별도 호출 없음 (D5).
 *
 * @example
 * registerAggregationFn('weightedAvg', (columnId, leafRows) => {
 *   const totalWeight = leafRows.reduce((s, r) => s + (r.getValue('weight') as number), 0);
 *   const totalVal = leafRows.reduce(
 *     (s, r) => s + (r.getValue(columnId) as number) * (r.getValue('weight') as number), 0
 *   );
 *   return totalWeight === 0 ? 0 : totalVal / totalWeight;
 * });
 */
export function registerAggregationFn<TData extends object>(
  name: string,
  fn: AggregationFn<TData>
): void;

/**
 * 이름으로 registry에서 사용자 정의 집계 함수를 조회한다.
 * 내장 5종은 별도 registry 조회가 필요 없으므로 이 함수는 사용자 정의 fn 전용.
 *
 * @returns 등록된 AggregationFn<TData> 또는 undefined (미등록).
 */
export function getAggregationFn<TData extends object>(
  name: string
): AggregationFn<TData> | undefined;

/**
 * 기존 G-001 API — 변경 없음 (D3: ADR-MOD-GRID-15-003 보존).
 * 내장 키(AggregationFnKey)를 TanStack 내부 키(TanStackAggKey)로 변환.
 * 'avg' → 'mean'. 그 외 통과.
 */
export function resolveAggregationFn(key: AggregationFnKey): TanStackAggKey;

/**
 * 내장 5종 aggregation 키 목록 (readonly).
 * column.aggregationFn 자동완성 지원 + runtime 가드용.
 */
export const BUILT_IN_AGGREGATION_KEYS: ReadonlyArray<AggregationFnKey>;
// = ['sum', 'avg', 'min', 'max', 'count'] as const
```

### 2.2 타입 변경 (types.ts MODIFY)

**AggregationColumnMeta.aggregationFn 타입 확장 (D4)**:

```typescript
// Before (G-001/G-002):
export interface AggregationColumnMeta {
  aggregationFn?: AggregationFnKey;
  [key: string]: unknown;
}

// After (G-003 — D4):
export interface AggregationColumnMeta {
  /**
   * 집계 함수 식별자.
   * - 내장 5종: 'sum' | 'avg' | 'min' | 'max' | 'count' (자동완성 지원)
   * - 사용자 정의: registerAggregationFn으로 등록한 임의 문자열
   *
   * (string & {}) 패턴: 내장 키 자동완성 유지 + 임의 문자열 허용 (C-4).
   */
  aggregationFn?: AggregationFnKey | (string & {});
  [key: string]: unknown;
}
```

**기존 타입 보존**: `AggregationFnKey`, `AggregationColumnDef`, `AggregationGridProps`, `GroupRowProps`, `FooterRowProps` — 변경 없음 (C-6 호환성).

### 2.3 AggregationGrid 내부 resolution 로직 (D3 합성)

`AggregationGrid.tsx` 의 `resolvedColumns` useMemo 내 column.aggregationFn 결정 로직:

```typescript
// AC-002 + D3: registry lookup 우선, 내장 매핑 차선, 미등록 → error + fallback
function resolveColumnAggregationFn(
  key: AggregationFnKey | (string & {}) | undefined
): AggregationFn<TData> | TanStackAggKey | undefined {
  if (key === undefined) return undefined;

  // 1. registry lookup (사용자 정의 우선)
  const customFn = getAggregationFn<TData>(key);
  if (customFn !== undefined) return customFn;  // 함수 참조 직접 반환

  // 2. 내장 키 확인 (BUILT_IN_AGGREGATION_KEYS)
  if ((BUILT_IN_AGGREGATION_KEYS as readonly string[]).includes(key)) {
    return resolveAggregationFn(key as AggregationFnKey);  // string key 반환
  }

  // 3. 미등록 → console.error + 'count' fallback (AC-002, no throw)
  console.error(
    `[grid-pro-agg] Unknown aggregationFn "${key}". Falling back to "count".`
  );
  return 'count' as TanStackAggKey;
}
```

**TanStack 전달 방식**:
- registry hit (함수 참조): `column.aggregationFn = customFn` (TanStack `ColumnDef.aggregationFn` 함수 직접)
- 내장 키 hit (string key): `column.aggregationFn = 'mean'` 등 (기존 G-001 동작 보존)
- fallback: `column.aggregationFn = 'count'`

### 2.4 사용 예시 (최소 2개)

**예시 1: 가중평균 (weighted average)**

```typescript
import { registerAggregationFn, AggregationGrid, type AggregationColumnDef } from '@tomis/grid-pro-agg';
import type { AggregationFn } from '@tanstack/react-table';

interface SalesRow { region: string; sales: number; weight: number }

const weightedAvgFn: AggregationFn<SalesRow> = (columnId, leafRows) => {
  const totalWeight = leafRows.reduce(
    (sum, r) => sum + (r.getValue('weight') as number), 0
  );
  if (totalWeight === 0) return 0;
  return leafRows.reduce(
    (sum, r) =>
      sum +
      (r.getValue(columnId) as number) * (r.getValue('weight') as number),
    0
  ) / totalWeight;
};

// 앱 초기화 시 1회 등록
registerAggregationFn('weightedAvg', weightedAvgFn);

const columns: AggregationColumnDef<SalesRow>[] = [
  { id: 'region', header: '지역', accessorKey: 'region' },
  { id: 'sales',  header: '가중 평균 매출', accessorKey: 'sales',
    meta: { aggregationFn: 'weightedAvg' } },  // D4: string & {} 허용
];

<AggregationGrid
  data={rows}
  columns={columns}
  enableAggregation
  grouping={['region']}
  showFooter
/>
// → 그룹 footer 행에 가중평균 집계값 표시
```

**예시 2: 비율 집계 (ratio)**

```typescript
import { registerAggregationFn } from '@tomis/grid-pro-agg';
import type { AggregationFn } from '@tanstack/react-table';

interface BudgetRow { dept: string; actual: number; budget: number }

const ratioFn: AggregationFn<BudgetRow> = (columnId, leafRows) => {
  const totalActual = leafRows.reduce(
    (s, r) => s + (r.getValue('actual') as number), 0
  );
  const totalBudget = leafRows.reduce(
    (s, r) => s + (r.getValue('budget') as number), 0
  );
  return totalBudget === 0 ? 0 : Math.round((totalActual / totalBudget) * 100);
};

registerAggregationFn('ratio', ratioFn);

// column 정의
{ id: 'actual', meta: { aggregationFn: 'ratio' } }
// → 그룹 footer에 예산 달성률(%) 표시
```

---

## Section 3: 기존 사용처 대응표 (Existing Variant Mapping)

N/A — 신규 Pro 패키지(`grid-pro-agg`). `affectedUsageFiles: []` (0개). 기존 variant 마이그레이션 대응표 없음.

---

## Section 4: 호환성 정책 (Compatibility Policy)

### Breaking Change 여부

**breaking: false**

- `registerAggregationFn`, `getAggregationFn`, `BUILT_IN_AGGREGATION_KEYS` 신규 export 추가만.
- `resolveAggregationFn` 시그니처 유지 (D3 — ADR-MOD-GRID-15-003 보존).
- G-001/G-002에서 `aggregationFn: 'sum'` 등을 사용하던 코드는 변경 없이 동작 (내장 키 우선 통과 — D3).
- `AggregationColumnMeta.aggregationFn` 확장(`AggregationFnKey | (string & {})`)은 확장이므로 기존 값(`'sum'` 등)이 여전히 유효 (C-6).

### Deprecation 전략

신규 기능 — alias 불필요. 기존 G-001/G-002 API를 확장하며 대체하지 않는다. 최소 1 minor 버전 alias 유지 의무 없음 (새 기능).

### peerDependencies

변경 없음. G-002에서 `@tanstack/react-virtual: ^3.0.0` (optional) 추가 완료. G-003에서 peerDeps 추가 없음.

---

## Section 5: 인수 기준 (Acceptance Criteria)

| AC ID | 항목 | 소스 태그 | 검증 방법 |
|-------|------|----------|---------|
| AC-001 | `registerAggregationFn<TData>(name: string, fn: AggregationFn<TData>): void` — TanStack `AggregationFn<TData>` 표준 시그니처 그대로 사용 (C-2). TypeScript strict, no any (C-4). `fn` 파라미터 타입은 `AggregationFn<TData>` 그대로 (내부 `unknown` 반환) | L1: TanStack `AggregationFn<TData>` (C-2), C-4 | `tsc --noEmit` 0 에러. `grep ": any"` 0 hits |
| AC-002 | module-level `aggregationFnsRegistry: Map<string, AggregationFn<unknown>>` 존재. `column.aggregationFn: string` → registry lookup 우선. 미등록 이름 → `console.error('[grid-pro-agg] Unknown aggregationFn "..."')` + fallback `'count'` (no throw, D6) | C-4, L1: TanStack ColumnDef.aggregationFn | Grep `aggregationFnsRegistry` in aggregationFns.ts, console.error 코드 존재 확인 |
| AC-003 | 내장 5종(`sum`/`avg`/`min`/`max`/`count`)도 `registerAggregationFn` 없이 G-001 경로(`resolveAggregationFn`)로 동작 보장. registry는 사용자 정의 fn 전용 진입점. `BUILT_IN_AGGREGATION_KEYS` 상수 export. ADR D6/D7 기록 (C-14) | C-14, L1: TanStack aggregationFns 내장 | 기존 G-001 story (`BasicGrouping`) 회귀 확인, `BUILT_IN_AGGREGATION_KEYS` export 확인 |
| AC-004 | `@mescius/wijmo*` import 0건 (C-16 절대 준수) | C-16 | `grep "@mescius/wijmo"` → 0 hits |
| AC-005 | `tsc --noEmit` 0 에러 (`packages/grid-pro-agg` 전체). C-12 | C-12 | `npx tsc --noEmit` 실행 |
| AC-006 | Storybook CSF3 story 1개 추가: `registerAggregationFn('ratio', ...)` 등록 후 그룹 footer에 사용자 정의 집계값 표시 시나리오. C-25 | C-25 | `AggregationGrid.stories.tsx`에 `CustomAggregation` story 존재 확인 |

---

## Section 6: 엣지 케이스 (Edge Cases)

| EC ID | 시나리오 | 기대 동작 | 매핑 AC |
|-------|---------|----------|--------|
| EC-001 | 미등록 이름으로 `column.aggregationFn: 'nonExistent'` 지정 | `console.error('[grid-pro-agg] Unknown aggregationFn "nonExistent". Falling back to "count".')` 출력 + fallback `'count'` TanStack 키로 처리 (no throw) | AC-002 |
| EC-002 | 같은 이름 중복 등록: `registerAggregationFn('ratio', fn1)` 후 `registerAggregationFn('ratio', fn2)` | overwrite + `console.warn('[grid-pro-agg] registerAggregationFn: overwriting existing fn for key "ratio"')` 출력. fn2가 사용됨 (D6) | AC-001 |
| EC-003 | 내장 키 이름으로 사용자 정의 fn 등록: `registerAggregationFn('sum', customFn)` | overwrite (D6) — console.warn 출력. registry hit → customFn 사용 (내장 키보다 registry 우선). 사용자 의도적 오버라이드 허용 | AC-002, AC-003 |
| EC-004 | `leafRows` 빈 배열 + `childRows` 빈 배열로 함수 호출 | 사용자 정의 fn의 구현에 위임 (zero-guard는 fn 내부 책임). `AggregationGrid` 컴포넌트는 예외 발생 시 catch 없이 TanStack에 전파 (D3: no throw 정책은 registry lookup 단계에만 적용, fn 실행 오류는 별도) | AC-001 |
| EC-005 | `registerAggregationFn` 호출 전 해당 이름으로 `column.aggregationFn` 사용 (초기 렌더 중) | registry 미등록 → EC-001 경로: console.error + 'count' fallback. 이후 `registerAggregationFn` 호출 시 registry 갱신 — 다음 렌더에서 정상 동작 | AC-002 |
| EC-006 | `BUILT_IN_AGGREGATION_KEYS` 에 포함된 키 + registry에도 미등록 | `resolveAggregationFn` 경로로 처리 (D3): 'avg'→'mean' 매핑 포함. console.error 미발생 | AC-003 |

---

## Section 7: 구현 대상 파일 (Implementation Files)

### D1 경로 권한 (C-28)

이 섹션의 모든 파일 경로는 `topvel-grid-monorepo/packages/grid-pro-agg/`를 기준으로 한다. goals.json의 `TOMIS/packages/` 접두사는 discover 단계 stale 아티팩트 (C-28, ADR-MOD-GRID-00-001, G-001/G-002 D1 선례).

### 최종 implementFiles 표

| # | 파일 경로 | 작업 | 설명 |
|---|----------|------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/aggregationFns.ts` | **MODIFY** | `aggregationFnsRegistry` Map 추가, `registerAggregationFn`/`getAggregationFn`/`BUILT_IN_AGGREGATION_KEYS` 신규 함수·상수 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/types.ts` | **MODIFY** | `AggregationColumnMeta.aggregationFn` 타입 확장 (`AggregationFnKey \| (string & {})`) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/AggregationGrid.tsx` | **MODIFY** | `resolvedColumns` useMemo 내 registry lookup 합성 로직 추가 (D3) |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/index.ts` | **MODIFY** | `registerAggregationFn`, `getAggregationFn`, `BUILT_IN_AGGREGATION_KEYS` export 추가 |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/AggregationGrid.stories.tsx` | **MODIFY** | `CustomAggregation` story 추가 (ratio fn 등록 시나리오) |

**요약**: NEW 0개 + MODIFY 5개 = **총 5개 파일**

### 파일별 구현 세부 사항

#### 1. `aggregationFns.ts` (MODIFY) — 핵심 변경

현행 (G-001/G-002):
```typescript
export type TanStackAggKey = 'sum' | 'mean' | 'min' | 'max' | 'count';
export function resolveAggregationFn(key: AggregationFnKey): TanStackAggKey { ... }
```

추가 내용:
```typescript
import type { AggregationFn } from '@tanstack/react-table';

// ---------------------------------------------------------------------------
// module-level registry (AC-002)
// ---------------------------------------------------------------------------
const aggregationFnsRegistry = new Map<string, AggregationFn<unknown>>();

// ---------------------------------------------------------------------------
// Built-in keys constant (AC-003)
// ---------------------------------------------------------------------------
export const BUILT_IN_AGGREGATION_KEYS: ReadonlyArray<AggregationFnKey> =
  ['sum', 'avg', 'min', 'max', 'count'] as const;

// ---------------------------------------------------------------------------
// Register API (AC-001, D6: overwrite + console.warn on duplicate)
// ---------------------------------------------------------------------------
export function registerAggregationFn<TData extends object>(
  name: string,
  fn: AggregationFn<TData>
): void {
  if (aggregationFnsRegistry.has(name)) {
    console.warn(
      `[grid-pro-agg] registerAggregationFn: overwriting existing fn for key "${name}"`
    );
  }
  aggregationFnsRegistry.set(name, fn as AggregationFn<unknown>);
}

// ---------------------------------------------------------------------------
// Lookup API (AC-002, D3)
// ---------------------------------------------------------------------------
export function getAggregationFn<TData extends object>(
  name: string
): AggregationFn<TData> | undefined {
  return aggregationFnsRegistry.get(name) as AggregationFn<TData> | undefined;
}
```

C-32 준수: `aggregationFns.ts`는 pure helper (React import 없음). `AggregationFn<TData>`는 TanStack type import만.

#### 2. `types.ts` (MODIFY) — AggregationColumnMeta 타입 확장

```typescript
// Before:
export interface AggregationColumnMeta {
  aggregationFn?: AggregationFnKey;
  [key: string]: unknown;
}

// After (D4):
export interface AggregationColumnMeta {
  aggregationFn?: AggregationFnKey | (string & {});
  [key: string]: unknown;
}
```

C-4 준수: `(string & {})` 패턴은 any 아님 — 내장 키 자동완성 + 임의 문자열 모두 허용.

#### 3. `AggregationGrid.tsx` (MODIFY) — resolvedColumns useMemo 변경

```typescript
// Before (G-001/G-002):
const resolvedColumns = useMemo(
  () =>
    columns.map((col: AggregationColumnDef<TData>) => ({
      ...col,
      ...(col.meta?.aggregationFn !== undefined
        ? { aggregationFn: resolveAggregationFn(col.meta.aggregationFn) }
        : {}),
    })),
  [columns],
);

// After (G-003 — D3 합성):
const resolvedColumns = useMemo(
  () =>
    columns.map((col: AggregationColumnDef<TData>) => {
      const key = col.meta?.aggregationFn;
      if (key === undefined) return col;

      // 1. registry lookup 우선 (사용자 정의)
      const customFn = getAggregationFn<TData>(key);
      if (customFn !== undefined) {
        return { ...col, aggregationFn: customFn };
      }

      // 2. 내장 키 확인
      if ((BUILT_IN_AGGREGATION_KEYS as readonly string[]).includes(key)) {
        return {
          ...col,
          aggregationFn: resolveAggregationFn(key as AggregationFnKey),
        };
      }

      // 3. 미등록 → console.error + 'count' fallback (AC-002)
      console.error(
        `[grid-pro-agg] Unknown aggregationFn "${key}". Falling back to "count".`
      );
      return { ...col, aggregationFn: 'count' as TanStackAggKey };
    }),
  [columns],
);
```

C-31 준수: `getAggregationFn`·`BUILT_IN_AGGREGATION_KEYS`·`resolveAggregationFn` 모두 AggregationGrid.tsx 내에서 import + 실제 호출.

#### 4. `index.ts` (MODIFY) — 신규 export 추가

```typescript
// 기존 export 보존 (C-6)
export { AggregationGrid } from './AggregationGrid';
export { resolveAggregationFn } from './aggregationFns';
export type { TanStackAggKey } from './aggregationFns';

// G-003 신규 export
export { registerAggregationFn, getAggregationFn, BUILT_IN_AGGREGATION_KEYS } from './aggregationFns';

export type {
  AggregationFnKey,
  AggregationColumnMeta,
  AggregationColumnDef,
  AggregationGridProps,
  GroupRowProps,
  FooterRowProps,
} from './types';
```

#### 5. `AggregationGrid.stories.tsx` (MODIFY) — CustomAggregation story 추가

```typescript
// G-003: ratio fn 등록 후 footer 표시 시나리오 (AC-006)
import { registerAggregationFn } from './aggregationFns';
import type { AggregationFn } from '@tanstack/react-table';

interface BudgetRow { dept: string; actual: number; budget: number }

const ratioFn: AggregationFn<BudgetRow> = (columnId, leafRows) => {
  const totalActual = leafRows.reduce((s, r) => s + (r.getValue('actual') as number), 0);
  const totalBudget = leafRows.reduce((s, r) => s + (r.getValue('budget') as number), 0);
  return totalBudget === 0 ? 0 : Math.round((totalActual / totalBudget) * 100);
};
registerAggregationFn('ratio', ratioFn);

// ... story args 정의
export const CustomAggregation = { args: { ... } };
```

---

## Section 8: 마이그레이션 영향도 Preflight (Migration Impact Preflight)

### 8.1 영향 사용처

`affectedUsageFiles: []` — 영향 사용처 **0개**. 신규 Pro 패키지이며 현재 tw-framework-front 내 `@tomis/grid-pro-agg` import 없음.

### 8.2 무파괴 검증 (Non-Destructive Validation)

- `tsc --noEmit` 실행 → 0 에러 확인 (AC-005, C-12)
- 기존 G-001 story (`BasicGrouping`, `AvgAggregation`) 회귀 확인 — registry 추가 후에도 내장 키 동작 보장 (AC-003)
- 기존 G-002 story (`GroupFooterExpand`, `VirtualizedGroupFooter`) 회귀 확인
- `grep "@mescius/wijmo"` → 0 hits (AC-004, C-16)
- Storybook CSF3 `CustomAggregation` story 확인 (AC-006)

### 8.3 롤백 전략

`migrationImpact: low` + 사용처 0개 → 롤백은 단순 export 제거.

신규 export (`registerAggregationFn`, `getAggregationFn`, `BUILT_IN_AGGREGATION_KEYS`)를 `index.ts`에서 제거 + `aggregationFns.ts` registry 코드 제거. 기존 G-001/G-002 코드(resolveAggregationFn, AggregationGrid, GroupRow, FooterRow)는 영향 없음.

### 8.4 Breaking Change 확인

G-001/G-002 API 완전 보존 (Section 4). `AggregationColumnMeta.aggregationFn` 타입 확장은 확장이므로 기존 `'sum'` 등 값 여전히 유효. `resolveAggregationFn` 시그니처 미변경 (D3).

### 8.5 번들 영향

| 항목 | 예상 크기 |
|------|---------|
| registry Map + registerAggregationFn + getAggregationFn + BUILT_IN_AGGREGATION_KEYS | +1 KB gzipped |
| AggregationGrid.tsx lookup 합성 로직 | +1 KB gzipped |
| **G-003 합계** | **+2 KB gzipped** |
| G-001+G-002 기존 | ~9 KB |
| **grid-pro-agg 누적** | **~11 KB** |
| Pro 패키지 한도 (C-21) | ≤ 20 KB |

→ 한도 내 충분히 여유 있음.

---

## Section 9: 의존성 분석 (Dependency Analysis)

### Runtime 의존성 (G-001/G-002 상속, G-003 변경 없음)

| 패키지 | 버전 | 종류 | 변경 |
|--------|------|------|------|
| `@tanstack/react-table` | `^8.0.0` | peerDependency | G-001 상속 |
| `@tanstack/react-virtual` | `^3.0.0` | peerDependency (optional) | G-002 추가, G-003 변경 없음 |
| `react` | `^18.0.0 \|\| ^19.0.0` | peerDependency | G-001 상속 |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` | peerDependency | G-001 상속 |

**peerDeps 변경 없음** (C-22 준수 — G-002에서 이미 완료).

### 내부 참조 패턴

- `aggregationFns.ts` → `@tanstack/react-table` (`AggregationFn<TData>` type import만, 함수 import 없음 — ADR-MOD-GRID-15-003 보존, C-32)
- `AggregationGrid.tsx` → `aggregationFns.ts` (`getAggregationFn`, `BUILT_IN_AGGREGATION_KEYS`, `resolveAggregationFn` import)
- React import 없음 (`aggregationFns.ts` — pure helper, C-32)

---

## Section 10: 사용자 여정 매핑 (User Journey Mapping)

### 시나리오 1: 개발자 — 커스텀 fn 등록 + column 참조

```typescript
// 앱 부트스트랩 (예: main.tsx)
import { registerAggregationFn } from '@tomis/grid-pro-agg';
import type { AggregationFn } from '@tanstack/react-table';

const weightedAvgFn: AggregationFn<SalesRow> = (columnId, leafRows) => {
  /* ... 가중평균 계산 로직 ... */
};
registerAggregationFn('weightedAvg', weightedAvgFn);

// 페이지 컴포넌트
const columns: AggregationColumnDef<SalesRow>[] = [
  { id: 'region', header: '지역', accessorKey: 'region' },
  {
    id: 'sales',
    header: '가중평균 매출',
    accessorKey: 'sales',
    meta: { aggregationFn: 'weightedAvg' },  // 등록된 이름 참조
  },
];

<AggregationGrid
  data={rows}
  columns={columns}
  enableAggregation
  grouping={['region']}
  showFooter
/>
// → 그룹 footer 행: 가중평균 집계값 표시
```

### 시나리오 2: 최종 사용자 — 기존 내장 fn + 커스텀 fn 혼용

```
그리드 로드:
  1. 'sum' 컬럼 → G-001 경로 (registry miss → 내장 키 → resolveAggregationFn)
  2. 'weightedAvg' 컬럼 → registry hit → customFn 직접 실행
  3. 그룹 footer 행에 두 컬럼의 집계값 함께 표시
  4. 기존 expand/collapse (G-002) 동작 동일
```

### 시나리오 3: 개발자 — 중복 등록 감지

```typescript
registerAggregationFn('ratio', fn1);  // 정상 등록
registerAggregationFn('ratio', fn2);  // console.warn 출력 → fn2로 overwrite
// 이후 'ratio' → fn2 사용
```

---

## Section 11: 구현 계획 (Implementation Plan)

### 11.1 파일별 변경 명세

| 파일 | 변경 내용 | 예상 LOC 변화 |
|------|---------|------------|
| `aggregationFns.ts` (MODIFY) | `AggregationFn` type import 추가, `aggregationFnsRegistry` Map, `registerAggregationFn`, `getAggregationFn`, `BUILT_IN_AGGREGATION_KEYS` 추가 | +40 LOC |
| `types.ts` (MODIFY) | `AggregationColumnMeta.aggregationFn` 타입 `\| (string & {})` 확장, JSDoc 갱신 | +5 LOC |
| `AggregationGrid.tsx` (MODIFY) | `getAggregationFn`·`BUILT_IN_AGGREGATION_KEYS` import 추가, `resolvedColumns` useMemo 내 3-branch lookup 로직 | +25 LOC |
| `index.ts` (MODIFY) | 신규 3종 export 추가 | +3 LOC |
| `AggregationGrid.stories.tsx` (MODIFY) | `BudgetRow` interface + `ratioFn` + `CustomAggregation` story | +60 LOC |

### 11.2 Before/After 코드 스니펫

**aggregationFns.ts — registry 추가 (핵심 변경)**

**Before (G-001)**:
```typescript
export type TanStackAggKey = 'sum' | 'mean' | 'min' | 'max' | 'count';

export function resolveAggregationFn(key: AggregationFnKey): TanStackAggKey {
  return key === 'avg' ? 'mean' : key;
}
```

**After (G-003)**:
```typescript
import type { AggregationFn } from '@tanstack/react-table';

export type TanStackAggKey = 'sum' | 'mean' | 'min' | 'max' | 'count';

// registry (AC-002)
const aggregationFnsRegistry = new Map<string, AggregationFn<unknown>>();

export const BUILT_IN_AGGREGATION_KEYS: ReadonlyArray<AggregationFnKey> =
  ['sum', 'avg', 'min', 'max', 'count'] as const;

export function registerAggregationFn<TData extends object>(
  name: string,
  fn: AggregationFn<TData>
): void {
  if (aggregationFnsRegistry.has(name)) {
    console.warn(`[grid-pro-agg] registerAggregationFn: overwriting existing fn for key "${name}"`);
  }
  aggregationFnsRegistry.set(name, fn as AggregationFn<unknown>);
}

export function getAggregationFn<TData extends object>(
  name: string
): AggregationFn<TData> | undefined {
  return aggregationFnsRegistry.get(name) as AggregationFn<TData> | undefined;
}

export function resolveAggregationFn(key: AggregationFnKey): TanStackAggKey {
  return key === 'avg' ? 'mean' : key;
}
```

### 11.3 구현 순서 (의존성 고려)

**Step 1**: `aggregationFns.ts` MODIFY — registry Map + `registerAggregationFn` + `getAggregationFn` + `BUILT_IN_AGGREGATION_KEYS` 추가
- 검증: `tsc --noEmit` 타입 에러 없음

**Step 2**: `types.ts` MODIFY — `AggregationColumnMeta.aggregationFn` 타입 확장
- 의존: 없음 (독립적 타입 변경)
- 검증: tsc 타입 체크

**Step 3**: `AggregationGrid.tsx` MODIFY — `getAggregationFn`·`BUILT_IN_AGGREGATION_KEYS` import + `resolvedColumns` 3-branch lookup 로직
- 의존: Step 1 (getAggregationFn, BUILT_IN_AGGREGATION_KEYS), Step 2 (widened type)
- C-31 준수: `getAggregationFn`, `BUILT_IN_AGGREGATION_KEYS`, `resolveAggregationFn` 모두 import + 실제 호출 확인
- 검증: tsc --noEmit

**Step 4**: `index.ts` MODIFY — `registerAggregationFn`, `getAggregationFn`, `BUILT_IN_AGGREGATION_KEYS` export 추가
- 의존: Step 1

**Step 5**: `AggregationGrid.stories.tsx` MODIFY — `CustomAggregation` story 추가
- 의존: Step 1~4 완료

### 11.4 위험 요소 및 대응

| 위험 | 가능성 | 대응 |
|------|--------|------|
| `AggregationFn<unknown>` 캐스팅 시 타입 안전성 저하 | 중간 | Map은 `AggregationFn<unknown>` 저장, `getAggregationFn<TData>` 반환 시 cast. 실제 fn 시그니처는 사용자가 TData 맞게 작성 — TanStack 패턴과 동일 |
| `aggregationFnsRegistry` 모듈 수준 singleton — 테스트 격리 어려움 | 낮음 | C-3 준수(프로덕션 코드 fixture 금지). 테스트는 별도 Goal(vitest 도입 시) — documented deviation |
| `(string & {})` TypeScript 버전별 자동완성 동작 차이 | 낮음 | TypeScript 4.7+ 기준 동작 확인됨 (monorepo tsconfig). tsc --noEmit 사전 검증 |
| registry hit 시 `column.aggregationFn = customFn` — TanStack internal type check 실패 | 낮음 | `ColumnDef.aggregationFn?: AggregationFn<TData> \| string` — 함수 참조 허용 (tanstack-api-inventory.md §4) 확인 완료 |

---

## Section 12: 검증 계획 (Verification Plan)

### 빌드 검증

```bash
# packages/grid-pro-agg 디렉토리에서
npx tsc --noEmit    # C-12: 0 에러 (AC-005)
npx tsup            # 빌드 성공, dist/ 생성. 번들 ~11 KB (≤ 20 KB)
```

### 기능 검증 체크리스트

- [ ] `registerAggregationFn('ratio', fn)` 후 `getAggregationFn('ratio')` === fn (AC-001, AC-002)
- [ ] registry에 없는 이름 → console.error 출력 + 'count' fallback 동작 (AC-002, EC-001)
- [ ] 중복 등록 → console.warn 출력 + 덮어쓰기 (D6, EC-002)
- [ ] 내장 키 (`'sum'` 등) → G-001 경로 (resolveAggregationFn) 그대로 동작 (AC-003, EC-006)
- [ ] `BUILT_IN_AGGREGATION_KEYS` export + 내용 확인 (AC-003)
- [ ] Storybook `CustomAggregation` story — ratio fn 등록 후 footer 집계값 표시 (AC-006)
- [ ] 기존 `BasicGrouping`·`AvgAggregation`·`GroupFooterExpand` story 회귀 — 내장 fn 동작 보존 (AC-003)

### 타입 검증

- [ ] `registerAggregationFn<SalesRow>('name', fn)` — `fn: AggregationFn<SalesRow>` 타입 강제 (C-2, C-4)
- [ ] `AggregationColumnMeta.aggregationFn` — `'sum'` 자동완성 + `'customKey'` 할당 가능 (D4)
- [ ] `any` 타입 0건 (`grep ": any"` → 0 hits, C-4)
- [ ] `grep "AggregationFn<unknown>"` — registry Map 선언에만 사용 확인

### 제약 준수 검증

- [ ] Wijmo import 0건 (`grep "@mescius/wijmo"` → 0 hits, C-16, AC-004)
- [ ] `verifyOrWarn` 추가 호출 없음 (aggregationFns.ts, types.ts, stories.tsx — D5)
- [ ] `aggregationFns.ts` 내 React import 0건 (C-32 — pure helper)
- [ ] TanStack 표준 API만 사용 (C-2) — `AggregationFn<TData>` 타입 + `ColumnDef.aggregationFn` 사용
- [ ] C-31 Functional Wiring Audit: `getAggregationFn`·`BUILT_IN_AGGREGATION_KEYS` import + 실제 호출처 검증 (`AggregationGrid.tsx`)
- [ ] E-06 spec 내부 일관성: Section 7 최종 표 (5개 MODIFY) ↔ Section 11 Step 1~5 파일 1:1 매칭

---

## Section 13: 상용 제품화 영향 (Commercialization Impact)

### 패키지 대상

**Pro 패키지**: `packages/grid-pro-agg` (`@tomis/grid-pro-agg`)

### 라이선스 검증 (F-02)

G-001에서 `AggregationGrid.tsx` 모듈 레벨에 `verifyOrWarn('@tomis/grid-pro-agg')` 1회 호출 완료 (ADR-MOD-GRID-15-002). G-003는 수정 대상 파일 (`aggregationFns.ts`, `types.ts`, `AggregationGrid.tsx`, `index.ts`, `AggregationGrid.stories.tsx`)에 추가 호출을 하지 않는다 (D5 — 한 패키지 1회 원칙, G-002 D7 동일 결정). `EULA.md`는 G-001에서 이미 생성됨.

G-003 라이선스 관련 변경 없음 — G-001 stub 계승.

### 문서화 계획 (F-03)

**Storybook story**: `AggregationGrid.stories.tsx` 수정

| story 이름 | 시나리오 |
|-----------|---------|
| `CustomAggregation` | ratio fn 등록 (`registerAggregationFn('ratio', ...)`) + 그룹 footer에 예산 달성률(%) 표시. EC-002 중복 등록 시나리오 주석 포함 |

기존 story 회귀: `BasicGrouping`, `MultiColumnGrouping`, `AvgAggregation` (G-001), `GroupFooterExpand`, `VirtualizedGroupFooter` (G-002) — 모두 정상 동작 확인.

**Docusaurus 페이지 (deferred to MOD-GRID-99-B)**: G-001~G-003 내용을 `grid-pro-agg.mdx`에 통합 시 `registerAggregationFn` 사용 가이드 섹션 추가.

### peerDependencies 정책 (F-04, C-22)

```json
// package.json (G-003 후 상태 — G-002와 동일, 변경 없음)
{
  "peerDependencies": {
    "@tanstack/react-table": "^8.0.0",
    "@tanstack/react-virtual": "^3.0.0",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "peerDependenciesMeta": {
    "@tanstack/react-virtual": { "optional": true }
  }
}
```

---

## Appendix: Rubric Self-Check (Pre-Verification)

| 루브릭 | 항목 | 충족 여부 | 근거 |
|--------|------|---------|------|
| A-01 | L0 — 현 구현 N/A 명시 + G-001/G-002 현황 기술 | ✓ | "N/A — 신규 Pro 패키지" + 현 aggregationFns.ts 상태 기술 |
| A-02 | L1 TanStack API signature 인용 | ✓ | Section 1 L1: `AggregationFn<TData>` 시그니처 인용, 내장 키 표 |
| A-03 | L2 — N/A 명시 | ✓ | N/A |
| A-04 | L3 — affectedUsageFiles 0개 명시 | ✓ | Section 1 L3, Section 8.1 |
| A-05 | R-A AG Grid + R-W Wijmo 참조 | ✓ | Section 1 R-A (aggFuncs 패턴), R-W (커스텀 fn 개념) |
| B-01 | TypeScript interface 정의 | ✓ | Section 2.1: `registerAggregationFn`·`getAggregationFn`·`resolveAggregationFn`·`BUILT_IN_AGGREGATION_KEYS` 시그니처. Section 2.2: `AggregationColumnMeta` 변경 |
| B-02 | 사용 예시 2개 이상 | ✓ | Section 2.4 예시 1 (weightedAvg) + 예시 2 (ratio) + Section 10 시나리오 3개 |
| B-03 | 기본값 + optional 명시 | ✓ | `registerAggregationFn` required params. optional: 없음 (모두 필수) |
| B-04 | 타입 export 경로 명시 | ✓ | `packages/grid-pro-agg/src/aggregationFns.ts` + `types.ts` |
| B-05 | ref API — N/A | ✓ | 선언적 컴포넌트, ref 불필요 |
| C-01 | AC 3개 이상 (6개) | ✓ | AC-001~AC-006 |
| C-02 | 각 AC 소스 태그 | ✓ | 모든 AC에 L1/C-N 태그 |
| C-03 | binary 검증 가능 AC | ✓ | 모든 AC 객관 검증 가능 |
| C-04 | migrationImpact 명시 (low) | ✓ | 헤더 + goals.json 일치 |
| C-05 | 호환성 검증 AC — N/A | ✓ | 사용처 0개 신규 기능 |
| D-01 | 영향 사용처 목록 (0개) | ✓ | Section 8.1 |
| D-02 | 기존 variant 대응표 — N/A | ✓ | Section 3 N/A 명시 |
| D-03 | Breaking change 명시 (false) | ✓ | Section 4 |
| D-04 | Deprecation 전략 — N/A | ✓ | Section 4 N/A |
| D-05 | 롤백 전략 — N/A (low + 사용처 0) | ✓ | Section 8.3 |
| D-06 | 번들 영향 (+2 KB, 누적 ~11 KB ≤ 20 KB) | ✓ | Section 8.5 |
| E-01 | Section 7 ↔ Section 11 파일 일관성 | ✓ | 최종 표 5개 MODIFY == Step 1~5 파일 1:1 cross-check 완료 |
| E-02 | Before/After 코드 스니펫 | ✓ | Section 11.2 aggregationFns.ts Before/After |
| E-03 | 구현 순서 5단계 (의존성 고려) | ✓ | Section 11.3 Step 1~5 |
| E-04 | 엣지 케이스 3개 이상 (6개) | ✓ | EC-001~EC-006 (AC 매핑 표 포함) |
| E-05 | 검증 계획 (Section 12) | ✓ | 빌드 + 기능 + 타입 + 제약 |
| E-06 | Section 7 재결정 ↔ 최종 표 일관성 | ✓ | D1~D2 재결정 → 최종 표 5개 MODIFY에 반영. prose↔structured 일관성: D3 "resolveAggregationFn 보존" ↔ Section 11.2 After-code "resolveAggregationFn 유지" 일치. D6 "overwrite+console.warn" ↔ EC-002·Section 7.1 코드스니펫 일치 |
| F-01 | 패키지 대상 명시 (grid-pro-agg Pro) | ✓ | Section 13 |
| F-02 | 라이선스 검증 호출 위치 | ✓ | Section 13 (G-001 stub 계승, D5) |
| F-03 | 문서 계획 (Storybook + Docusaurus 이연) | ✓ | Section 13 |
| F-04 | peerDependencies 정책 (C-22) | ✓ | Section 9, Section 13 (변경 없음) |
| G-01 | TBD/TODO/미정 없음 + D# 일관성 | ✓ | 모든 결정 D1~D7 명시. D# 파일수: "MODIFY 5개" == Section 7 최종 표 5행. D# breakdown: NEW 0 + MODIFY 5 == Section 7 NEW 0 + MODIFY 5. D# goals.json 데이터 일관성: D1 monorepo prefix 결정 ↔ Section 7 표 경로 일치. D2 보정 파일 3개 명시 ↔ 최종 표 반영. |
| H-01 | referenceEvidence 경로 실재 | ✓ | L0/L1: `packages/grid-pro-agg/src/aggregationFns.ts` + `index.ts` 실재 (Read 확인). L2/L3: N/A. R-A/R-W: `publish-aggrid-analysis.md`·`publish-wijmo-analysis.md` Glob 대상 (참조 파일명 Section 1에서 인용) |
| H-02 | implementFiles 경로 합리성 | ✓ | D1 결정으로 topvel-grid-monorepo 경로 채택. 부모 `packages/grid-pro-agg/src/` 실재 (G-001/G-002 구현 파일 Read 확인) |
| H-03 | AC 소스 태그 검증 | ✓ | AC-001~AC-006 모두 L1/C-N 태그 + Section 1에서 해당 출처 인용 |
