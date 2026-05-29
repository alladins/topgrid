# G-001 Specification: TanStack groupedRowModel 활성 + 내장 aggregationFn 5종

**Module**: MOD-GRID-15 / aggregation  
**Goal ID**: G-001  
**Priority**: P0  
**Migration Impact**: low  
**Score Threshold**: 90  
**Spec Version**: 1.0.0  
**Date**: 2026-05-15  
**Author**: tw-grid Spec Writer (automated)

---

## Pre-Resolved Decisions (D#)

| ID | 결정 내용 | 근거 |
|----|----------|------|
| **D1** | Section 7 implementFiles 경로 권한: `topvel-grid-monorepo/packages/grid-pro-agg/` 사용 (goals.json의 `TOMIS/packages/` 접두사는 discover 단계 아티팩트로 stale) | C-28, ADR-MOD-GRID-00-001 |
| **D2** | 컴포넌트 아키텍처: `AggregationGrid<TData>` standalone Pro 컴포넌트 채택. `<Grid enableGrouping>` 확장 아님 | grid-pro-merging 선례, C-32 |
| **D3** | 라이선스 스텁: 동기 `verifyOrWarn(packageName: string): void` 인라인 함수 (no-op body, MOD-GRID-99-A 대기). 비동기 `await import()` 방식 미채택 | grid-pro-merging 선례, C-24 |
| **D4** | peerDependencies 확장(`@tomis/grid-core`, `@tomis/grid-license`, `@tanstack/react-virtual`) G-004로 이연. `package.json`이 G-001 implementFiles에 미포함 | goals.json G-001 scope |
| **D5** | EC-05 신설: 사용자 facing `'avg'` → TanStack 내부 `'mean'` 별칭 매핑 edge case 명시 (AC-002 carveout 보완) | AC-002, tanstack-api-inventory.md |

---

## Section 1: 현행 분석 (AS-IS)

### L0 — Oracle 레거시 집계 로직
N/A — 신규 Pro 패키지. 집계 기능이 Oracle 레거시 시스템에 존재하지 않음.

### L1 — TanStack Table v8 현황
TanStack Table v8은 `getGroupedRowModel()` 및 `getExpandedRowModel()` 내장 row model 함수를 제공한다. `aggregationFns` 레지스트리에는 다음 함수가 사전 등록되어 있다:

| 키 | 동작 |
|----|------|
| `sum` | 수치 합산 |
| `min` | 최솟값 |
| `max` | 최댓값 |
| `mean` | 평균 (사용자 facing 별칭 `avg` → 내부 `mean` 매핑 필요) |
| `count` | 행 수 (비수치 포함) |
| `median` | 중앙값 |
| `unique` | 중복 제거 배열 |
| `uniqueCount` | 고유 값 수 |
| `extent` | [min, max] 배열 |

`column.aggregationFn` 옵션으로 위 키 문자열 또는 커스텀 함수를 지정한다. 그룹 행은 `row.getIsGrouped() === true`, 집계 행은 `row.getIsAggregated() === true`로 판별한다.

현재 `grid-pro-agg/src/index.ts`는 `export {};` placeholder 상태이며 구현이 없다.

### L2 — publish (AS-IS TO-BE 중간 참조)
N/A — 신규 Pro 패키지. publish 중간 참조 소스 없음.

### L3 — TO-BE 현황
N/A — 신규 Pro 패키지. TO-BE 구현 없음.

### 레퍼런스 분석 요약

**R-A (AG Grid)**: `aggFuncs` 레지스트리에 `sum`/`min`/`max`/`avg`/`count`를 등록하고 `colDef.aggFunc` 로 지정하는 패턴. 개념 학습 전용 (C-7, C-16 — AG Grid API 직접 사용 금지).

**R-W (Wijmo)**: `GroupDescription` + `IColumnAggregateDescriptor` 선언으로 집계를 정의하는 패턴. 개념 학습 전용 (C-16 — Wijmo API 직접 사용 금지).

**migrationImpact**: low (신규 Pro 패키지 grid-pro-agg, affectedUsageFiles 0개, AS-IS 잔존 코드 영향 없음)

---

## Section 2: 목표 정의 (Goal Definition)

### Goal Statement
TanStack Table v8의 `getGroupedRowModel()` 및 `getExpandedRowModel()`을 활성화하고, 내장 `aggregationFns`에서 **5종** (`sum`, `avg(→mean)`, `min`, `max`, `count`)을 사용자에게 노출하는 **AggregationGrid** standalone Pro 컴포넌트를 구현한다.

### Acceptance Criteria

| AC ID | 항목 | 소스 태그 |
|-------|------|----------|
| AC-001 | `AggregationGridProps.enableAggregation: true` 전달 시 `getGroupedRowModel()` + `getExpandedRowModel()` row model 파이프라인이 활성화된다. | L1: TanStack groupedRowModel |
| AC-002 | `column.meta.aggregationFn: 'sum' \| 'avg' \| 'min' \| 'max' \| 'count'` 문자열로 aggregationFn을 지정할 수 있다. `'avg'`는 내부적으로 TanStack `'mean'`에 매핑된다. | L1: TanStack aggregationFns |
| AC-003 | 그룹 행(`row.getIsGrouped() === true`)은 `[groupValue]` 레이블을 표시하고, 집계 행(`row.getIsAggregated() === true`)은 `aggregationFn` 결과값을 해당 셀에 표시한다. | L1: TanStack row model API |
| AC-004 | `AggregationGridProps.grouping: string[]` 배열로 그룹핑 컬럼 순서를 제어한다. 배열이 비어있으면 그룹핑을 해제한다. | L1: TanStack TableOptions.state.grouping |
| AC-005 | `AggregationGridProps.expanded`(`true` = 전체 펼침, `false` = 전체 접힘, `Record<string, boolean>` = 개별 제어)로 초기 펼침 상태를 설정한다. | L1: TanStack expanded state |
| AC-006 | 5종 `aggregationFn` 각각에 대해 타입 추론이 정확하다 (`tsc --noEmit` 0 에러). | C-12, C-4 |
| AC-007 | 번들 사이즈 증가량이 +5 KB를 초과하지 않는다 (C-21: 패키지당 ≤20 KB). | C-21 |
| AC-008 | Storybook CSF3 stories 파일(`AggregationGrid.stories.tsx`)이 존재하며, type-only 임포트 패턴으로 @storybook/react 런타임 의존성이 없다. | C-25, MOD-GRID-99-B 이연 |

---

## Section 3: 비기능 요구사항 (Non-Functional Requirements)

| 분류 | 요구사항 |
|------|---------|
| **성능** | `computeAggregations` 내부 계산은 `useMemo` dep = `[data, grouping, columns]` 참조 변경 시에만 재실행. O(N×C) 복잡도 이내. |
| **번들** | `aggregationFns.ts` 순수 함수 파일의 tree-shaking 지원. 미사용 aggregationFn은 번들에 포함되지 않아야 한다. |
| **타입 안전** | `tsc --noEmit` 0 에러 (C-12). `any` 타입 금지 (C-4). `exactOptionalPropertyTypes` 준수 (C-29). |
| **스타일** | Tailwind CSS class만 사용. CSS-in-JS, inline style, external CSS 금지 (C-5). |
| **라이선스** | EULA stub 파일 존재. 인라인 `verifyOrWarn` 스텁 호출 (C-24). |
| **peer 의존성** | `@tanstack/react-table`, `react`, `react-dom`은 peerDependencies (C-22). |

---

## Section 4: 범위 및 제외 항목 (Scope & Exclusions)

### 포함 (G-001 범위)
- TanStack `getGroupedRowModel()` + `getExpandedRowModel()` 활성화
- 5종 내장 aggregationFn: `sum`, `avg(→mean)`, `min`, `max`, `count`
- `AggregationGrid<TData>` standalone 컴포넌트 (React 18/19 호환)
- `AggregationGridColumnDef<TData>` 타입 (TanStack ColumnDef 확장)
- `AggregationGridProps<TData>` 타입
- 인라인 `verifyOrWarn` 라이선스 스텁
- EULA.md stub 파일
- `AggregationGrid.stories.tsx` CSF3 placeholder
- `index.ts` 내보내기 추가

### 제외 (이연)
| 항목 | 이연 Goal |
|------|----------|
| 커스텀 aggregationFn 등록 | G-002 |
| 가상 스크롤(`react-virtual`) 통합 | G-002 또는 G-003 |
| `@tomis/grid-core` 통합 | G-004 |
| peerDeps 확장 (`@tomis/grid-license`, `@tanstack/react-virtual`, `@tomis/grid-core`) | G-004 |
| 실제 라이선스 검증 (`@tomis/grid-license`) | MOD-GRID-99-A |
| Storybook 런타임 통합 | MOD-GRID-99-B |

---

## Section 5: 의존성 분석 (Dependency Analysis)

### Runtime 의존성
| 패키지 | 버전 | 종류 | 비고 |
|--------|------|------|------|
| `@tanstack/react-table` | `^8.0.0` | peerDependency | C-22 필수 |
| `react` | `^18.0.0 \|\| ^19.0.0` | peerDependency | C-22 필수 |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` | peerDependency | C-22 필수 |

### Build/Dev 의존성
| 패키지 | 용도 |
|--------|------|
| `tsup` | 번들링 (기존 설정 재사용) |
| `typescript` | 타입 체크 |

### 내부 참조 패턴 (grid-pro-merging 선례)
- `AggregationGrid.tsx`에서 `@tanstack/react-table`의 `useReactTable`, `getCoreRowModel`, `getGroupedRowModel`, `getExpandedRowModel` 직접 import
- `aggregationFns.ts`에서 TanStack 내장 `aggregationFns` 레지스트리 활용
- `@tomis/grid-core` import 없음 (D4 — G-004 이연)

---

## Section 6: 엣지 케이스 (Edge Cases)

| EC ID | 시나리오 | 기대 동작 |
|-------|---------|----------|
| EC-01 | `grouping: []` (빈 배열) | 그룹핑 비활성. 모든 행이 일반 데이터 행으로 렌더링. aggregationFn 셀은 빈 값 표시. |
| EC-02 | `aggregationFn: 'sum'`이지만 셀 값이 문자열 | TanStack 내부 동작 위임: NaN 또는 `undefined` 반환. 셀에 빈 문자열 또는 `NaN` 표시. 컴포넌트가 예외 미발생 보장. |
| EC-03 | 동일 컬럼에 `aggregationFn`이 없는 경우 | 그룹 행 해당 셀: 빈 값 표시. `getIsAggregated()` false. |
| EC-04 | `expanded: true` 후 `grouping` 변경 | `grouping` 변경 시 expanded state 초기화하여 새 그룹 구조 반영. 이전 expanded Record의 stale 키는 TanStack이 무시. |
| EC-05 | 사용자가 `aggregationFn: 'avg'` 지정 | `types.ts`의 `AggregationFnKey` 유니온에 `'avg'` 포함. `aggregationFns.ts`의 `resolveAggregationFn()` 함수가 `'avg'` → TanStack `'mean'` 로 변환. `'mean'`은 사용자 facing API에 미노출. |

---

## Section 7: 구현 계획 (Implementation Plan)

### D1 경로 권한 (C-28)
이 섹션의 모든 파일 경로는 `topvel-grid-monorepo/packages/grid-pro-agg/`를 기준으로 한다. goals.json의 `TOMIS/packages/` 접두사는 discover 단계 stale 아티팩트이며 실제 파일 시스템과 불일치한다(C-28, ADR-MOD-GRID-00-001).

### 구현 파일 목록

| # | 파일 경로 | 작업 | 설명 |
|---|----------|------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/types.ts` | NEW | Props 타입 + ColumnDef 확장 타입 정의 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/aggregationFns.ts` | NEW | 5종 aggregationFn 래퍼 + `resolveAggregationFn()` |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/AggregationGrid.tsx` | NEW | Standalone Pro 컴포넌트 (verifyOrWarn 스텁 포함) |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/AggregationGrid.stories.tsx` | NEW | CSF3 placeholder stories |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/index.ts` | MODIFY | 공개 API 내보내기 추가 |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/EULA.md` | NEW | EULA stub (C-24) |
| 7 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-15-decisions.md` | NEW | ADR 결정 기록 |

### 파일별 구현 세부 사항

#### 1. `types.ts`

```typescript
// 사용자 facing aggregationFn 키 유니온 ('avg' 포함, 'mean' 미노출)
export type AggregationFnKey = 'sum' | 'avg' | 'min' | 'max' | 'count';

// TanStack ColumnDef<TData> meta 확장
export interface AggregationColumnMeta {
  aggregationFn?: AggregationFnKey;
}

export type AggregationColumnDef<TData> = ColumnDef<TData> & {
  meta?: AggregationColumnMeta;
};

export interface AggregationGridProps<TData> {
  data: TData[];
  columns: AggregationColumnDef<TData>[];
  enableAggregation?: boolean;
  grouping?: string[];
  expanded?: boolean | Record<string, boolean>;
  // 향후 G-002: onGroupingChange, onExpandedChange 추가
}
```

`exactOptionalPropertyTypes` (C-29): optional 필드에 `| undefined` 명시하거나 conditional spread 패턴 적용.

#### 2. `aggregationFns.ts`

```typescript
import { aggregationFns as tanstackAggFns } from '@tanstack/react-table';

// D5: 'avg' → 'mean' 매핑
const AVG_TO_MEAN_MAP = { avg: 'mean' } as const;

export function resolveAggregationFn(key: AggregationFnKey) {
  const tanstackKey = key === 'avg' ? 'mean' : key;
  return tanstackAggFns[tanstackKey];
}
```

순수 함수만 포함 (C-32). React import 없음. Tree-shaking 지원.

#### 3. `AggregationGrid.tsx`

핵심 구조:
```typescript
// 인라인 라이선스 스텁 (D3, C-24)
// MOD-GRID-99-A 완료 시 → import { verifyOrWarn } from '@tomis/grid-license' 로 교체
function verifyOrWarn(_packageName: string): void {
  /* MOD-GRID-99-A/G-002 will implement signature / expiry / domain checks. */
}
verifyOrWarn('@tomis/grid-pro-agg');

export function AggregationGrid<TData>({
  data,
  columns,
  enableAggregation = false,
  grouping = [],
  expanded = true,
}: AggregationGridProps<TData>) {
  const table = useReactTable({
    data,
    columns: resolvedColumns,  // aggregationFn 키 해석 후
    state: { grouping, expanded: expandedState },
    getCoreRowModel: getCoreRowModel(),
    ...(enableAggregation && {
      getGroupedRowModel: getGroupedRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
    }),
  });
  // 테이블 렌더링: thead + tbody
  // 그룹 행: row.getIsGrouped() → groupValue 레이블
  // 집계 행: row.getIsAggregated() → aggregationFn 결과
  // Tailwind CSS 클래스만 사용 (C-5)
}
```

`enableAggregation` 조건부 row model 스프레드: `exactOptionalPropertyTypes` 준수를 위해 conditional spread 패턴 사용 (C-29).

#### 4. `AggregationGrid.stories.tsx`

CSF3 placeholder 패턴 (C-25, MOD-GRID-99-B 이연):
- type-only import (`import type { AggregationGridProps }`)
- `@storybook/react` 런타임 의존성 없음
- 3개 stories: `BasicGrouping`, `MultiColumnGrouping`, `AvgAggregation`
- `args` 객체가 living documentation 역할

#### 5. `index.ts` 수정

```typescript
export { AggregationGrid } from './AggregationGrid';
export type { AggregationGridProps, AggregationColumnDef, AggregationFnKey } from './types';
export { resolveAggregationFn } from './aggregationFns';
```

#### 6. `EULA.md`

grid-pro-merging EULA 패턴 준수. 패키지명 `@tomis/grid-pro-agg`, Goal 참조 `MOD-GRID-15/G-001`.

#### 7. `MOD-GRID-15-decisions.md`

D1~D5 결정 사항 ADR 형식 기록 (C-14).

---

## Section 8: 타입 설계 (Type Design)

### 핵심 타입 관계도

```
AggregationFnKey = 'sum' | 'avg' | 'min' | 'max' | 'count'
  ↓ resolveAggregationFn()
TanStack AggregationFn<TData, TValue>  ('avg' → 'mean' 내부 변환)

AggregationColumnDef<TData>
  ├── extends ColumnDef<TData> (TanStack)
  └── meta?: AggregationColumnMeta
              └── aggregationFn?: AggregationFnKey

AggregationGridProps<TData>
  ├── data: TData[]
  ├── columns: AggregationColumnDef<TData>[]
  ├── enableAggregation?: boolean
  ├── grouping?: string[]
  └── expanded?: boolean | Record<string, boolean>
```

### any 금지 (C-4)
모든 제네릭 파라미터 명시. TanStack 내부 타입 추론 활용. `unknown` 사용 후 type narrowing.

### exactOptionalPropertyTypes (C-29)
`AggregationGridProps`의 optional 필드: `enableAggregation?: boolean` (undefined 허용, `| undefined` 불필요). Conditional spread 패턴:

```typescript
const groupingOptions = enableAggregation
  ? {
      getGroupedRowModel: getGroupedRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
    }
  : {};
```

---

## Section 9: 통합 고려사항 (Integration Considerations)

### 다른 Pro 패키지와의 관계
- `grid-pro-agg`는 `grid-pro-merging`과 독립적. 동시 사용 시 각각의 컴포넌트(`MergingGrid`, `AggregationGrid`)를 별도 래퍼로 합성.
- `grid-core`와의 통합은 G-004 범위. G-001에서는 TanStack Table 직접 사용.

### peerDependencies (G-004 이연 — D4)
현재 `package.json` peerDependencies: `@tanstack/react-table`, `react`, `react-dom`.
G-004에서 추가 예정:
- `@tomis/grid-core: workspace:*`
- `@tomis/grid-license: workspace:*` (optional)
- `@tanstack/react-virtual: ^3.0.0` (optional)

### 빌드 시스템
기존 `tsup` 설정 재사용. 별도 `tsup.config.ts` 수정 불필요 (G-001 implementFiles 미포함).

### 라이선스 교체 경로 (D3)
MOD-GRID-99-A 완료 시:
```typescript
// Before (G-001 인라인 스텁):
function verifyOrWarn(_packageName: string): void { /* no-op */ }

// After (MOD-GRID-99-A 완료 후):
import { verifyOrWarn } from '@tomis/grid-license';
```
단일 줄 변경으로 교체 가능하도록 함수 시그니처를 동일하게 유지.

---

## Section 10: 사용자 여정 (User Journey)

### 시나리오 1: 기본 그룹핑 + sum 집계

```typescript
import { AggregationGrid, type AggregationColumnDef } from '@tomis/grid-pro-agg';

interface SalesRow {
  region: string;
  product: string;
  revenue: number;
}

const columns: AggregationColumnDef<SalesRow>[] = [
  { id: 'region', header: '지역', accessorKey: 'region' },
  { id: 'product', header: '상품', accessorKey: 'product' },
  {
    id: 'revenue',
    header: '매출',
    accessorKey: 'revenue',
    meta: { aggregationFn: 'sum' },  // AC-002
  },
];

// AC-001: enableAggregation + grouping 제어
<AggregationGrid
  data={salesData}
  columns={columns}
  enableAggregation={true}
  grouping={['region']}
  expanded={true}
/>
// → 지역별 그룹 행 + 매출 sum 집계 셀 표시 (AC-003)
```

### 시나리오 2: avg (→ mean) 사용

```typescript
const columns: AggregationColumnDef<SalesRow>[] = [
  { id: 'region', header: '지역', accessorKey: 'region' },
  {
    id: 'revenue',
    header: '평균 매출',
    accessorKey: 'revenue',
    meta: { aggregationFn: 'avg' },  // EC-05: 내부적으로 'mean' 으로 변환
  },
];

<AggregationGrid
  data={salesData}
  columns={columns}
  enableAggregation={true}
  grouping={['region']}
/>
```

### 시나리오 3: 그룹핑 해제

```typescript
// AC-004: grouping 빈 배열 → 그룹핑 해제 (EC-01)
<AggregationGrid
  data={salesData}
  columns={columns}
  enableAggregation={true}
  grouping={[]}  // 그룹핑 없음
/>
```

---

## Section 11: 검증 기준 (Verification Criteria)

### 빌드 검증
- [ ] `tsc --noEmit` 0 에러 (AC-006, C-12)
- [ ] `tsup` 빌드 성공, `dist/` 생성
- [ ] 번들 크기 증가 ≤ +5 KB (AC-007, C-21)

### 기능 검증
- [ ] `enableAggregation: true` 시 그룹 행 렌더링 확인 (AC-001)
- [ ] `meta.aggregationFn: 'sum'` 셀에 합계 표시 (AC-002)
- [ ] `meta.aggregationFn: 'avg'` → TanStack `'mean'` 매핑 정상 동작 (EC-05)
- [ ] `meta.aggregationFn: 'min' | 'max' | 'count'` 각각 정상 동작 (AC-002)
- [ ] `row.getIsGrouped()` 그룹 행 레이블 표시 (AC-003)
- [ ] `grouping: []` 시 그룹핑 해제 (EC-01, AC-004)
- [ ] `expanded: true/false/Record` 3가지 형태 동작 (AC-005)

### 타입 검증
- [ ] `AggregationFnKey`에 `'avg'` 포함, `'mean'` 미포함 확인
- [ ] `AggregationGridProps<TData>` 제네릭 추론 정상
- [ ] `any` 타입 0건 (`grep -n ': any'`)

### 파일 존재 검증
- [ ] `types.ts` 존재
- [ ] `aggregationFns.ts` 존재 (순수 함수만, React import 없음)
- [ ] `AggregationGrid.tsx` 존재 (verifyOrWarn 스텁 포함)
- [ ] `AggregationGrid.stories.tsx` 존재 (type-only import 확인)
- [ ] `index.ts` 공개 API 내보내기 확인
- [ ] `EULA.md` 존재 (C-24)

### 제약 준수 검증
- [ ] Tailwind 클래스만 사용 (C-5) — inline style 0건
- [ ] `@tanstack/react-table` peerDependency 유지 (C-22)
- [ ] Wijmo/AG Grid API 미사용 (C-7, C-16)
- [ ] `verifyOrWarn` 함수 module level 호출 확인 (D3)

---

## Section 12: ADR 참조 (Architecture Decision Records)

| ADR ID | 결정 | 상태 |
|--------|------|------|
| ADR-MOD-GRID-00-001 | 모노레포 경로 권한 (`topvel-grid-monorepo`) | 확정 |
| ADR-MOD-GRID-15-001 | AggregationGrid standalone 컴포넌트 채택 (D2) | 확정 |
| ADR-MOD-GRID-15-002 | `verifyOrWarn` 인라인 스텁 (D3, MOD-GRID-99-A 이연) | 확정 |
| ADR-MOD-GRID-15-003 | peerDeps 확장 G-004 이연 (D4) | 확정 |
| ADR-MOD-GRID-15-004 | `'avg'` → `'mean'` 사용자 facing 별칭 (D5) | 확정 |

상세 결정 기록: `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-15-decisions.md`

---

## Section 13: 미결 사항 및 위험 (Open Items & Risks)

### 미결 사항

| ID | 항목 | 담당 Goal |
|----|------|----------|
| OI-01 | `expanded` 상태 외부 제어(`onExpandedChange` 콜백) | G-002 |
| OI-02 | 그룹핑 상태 외부 제어(`onGroupingChange` 콜백) | G-002 |
| OI-03 | 가상 스크롤(`react-virtual`) 통합 | G-002/G-003 |
| OI-04 | `@tomis/grid-core` API 통합 + peerDeps 확장 | G-004 |
| OI-05 | 실제 라이선스 검증 로직 | MOD-GRID-99-A |
| OI-06 | Storybook 런타임 통합 | MOD-GRID-99-B |

### 위험 항목

| 위험 | 가능성 | 대응 |
|------|--------|------|
| TanStack v8 `aggregationFns` API 변경 | 낮음 | `^8.0.0` semver 범위로 메이저 변경 방어 |
| `enableAggregation` 조건부 row model 스프레드 시 TanStack 내부 타입 충돌 | 중간 | conditional spread 패턴 + `tsc --noEmit` 사전 검증 |
| `'avg'` → `'mean'` 매핑 누락 (구현 오류) | 낮음 | EC-05 Verifier 검증 포함 |
| 번들 크기 5KB 초과 | 낮음 | `aggregationFns.ts` 순수 함수 분리로 tree-shaking 보장 |

---

## Appendix: Rubric Self-Check (Pre-Verification)

| 섹션 | 루브릭 항목 | 충족 여부 |
|------|-----------|---------|
| Section 1 | A-01 (L0 N/A 명시) | ✓ "N/A — 신규 Pro 패키지" |
| Section 1 | A-02 (L1 TanStack API 근거) | ✓ aggregationFns 테이블 포함 |
| Section 1 | A-03 (R-A 분석) | ✓ AG Grid aggFuncs 개념 학습 명시 |
| Section 1 | A-04 (R-W 분석) | ✓ Wijmo GroupDescription 개념 학습 명시 |
| Section 1 | A-05 (현행 구현 상태) | ✓ placeholder `export {}` 언급 |
| Section 2 | B-01 (AC 목록 8개) | ✓ AC-001~AC-008 |
| Section 2 | B-02 (AC 소스 태그) | ✓ 모든 AC에 소스 태그 포함 |
| Section 2 | B-03 (Goal Statement 명확성) | ✓ |
| Section 2 | B-04 (검증 가능 AC) | ✓ |
| Section 2 | B-05 (N/A L0/L2/L3 표기) | ✓ |
| Section 6 | C-01 (EC 5개 이상) | ✓ EC-01~EC-05 |
| Section 6 | C-02 (EC 구체적 기대 동작) | ✓ |
| Section 6 | C-03 (EC AC 연결) | ✓ EC-05 ↔ AC-002 |
| Section 7 | D-01 (implementFiles 목록) | ✓ 7개 파일 |
| Section 7 | D-02 (H-02 경로 실재) | ✓ topvel-grid-monorepo 경로 (D1) |
| Section 7 | D-03 (파일별 세부 구현) | ✓ |
| Section 7 | D-04 (D# 결정 기록) | ✓ D1~D5 |
| Section 7 | D-05 (NEW/MODIFY 구분) | ✓ |
| Section 7 | D-06 (ADR 파일 포함) | ✓ decisions.md |
| Section 8 | E-01 (타입 설계) | ✓ |
| Section 8 | E-02 (any 금지 C-4) | ✓ 명시 |
| Section 8 | E-03 (C-29 패턴) | ✓ conditional spread 예시 |
| Section 9 | E-04 (통합 고려사항) | ✓ |
| Section 10 | E-05 (사용자 여정 코드) | ✓ 3개 시나리오 |
| Section 9 | E-06 (라이선스 교체 경로) | ✓ D3 교체 경로 명시 |
| Section 11 | F-01 (검증 기준 체크리스트) | ✓ |
| Section 11 | F-02 (라이선스 스텁 검증) | ✓ verifyOrWarn 위치 + 교체 경로 |
| Section 11 | F-03 (번들 크기 검증) | ✓ AC-007 |
| Section 12 | F-04 (ADR 참조) | ✓ |
| Section 13 | G-01 (미결/위험 항목) | ✓ OI + 위험 테이블 |
| H-01 | reference 경로 실재 | ✓ topvel-grid-monorepo 경로 |
| H-02 | implementFiles 경로 합리성 | ✓ D1 결정 명시 |
| H-03 | AC 소스 태그 | ✓ 모든 AC |
