# MOD-GRID-04 / column / G-002 Spec

**Goal**: `createGroupedColumns<TData>()` — Multi-row column groups  
**Spec version**: 1.0.0  
**Date**: 2026-05-14  
**Author**: tw-grid Spec Writer Agent  
**Rubric**: specify-rubric v1.0.5 — medium threshold (90)  
**Status**: DRAFT

---

## D# 결정 요약

| ID | 결정 내용 |
|----|-----------|
| D1 | `createGroupedColumns<TData>({ header, columns })` = thin wrapper. `{ header: string | HeaderFn; columns: ColumnDef<TData>[] }` 구조의 GroupColumnDef를 직접 반환. 어떠한 변환/정규화 없음. TanStack이 `getHeaderGroups()`에서 colSpan·isPlaceholder를 자동 계산. |
| D2 | 재귀 중첩 그룹(3단 이상)은 TanStack이 자동 지원. G-002는 1–2단 그룹만 명시적 데모. 더 깊은 중첩은 OQ-01(소비자 책임). |
| D3 | G-001 cascading feedback의 `enableColumnFilter`/`enablePinning` 표준 매핑은 leaf 컬럼 수준 관심사. GroupColumnDef wrapper에는 해당 prop 없음. leaf TomisColumnDef 타입 확장은 별도 Goal(G-003 이후) 처리. |
| D4 | `GroupedHeaderGrid.tsx` 호환성은 deep-equal fixture 테스트로 검증. GroupedHeaderGrid.tsx 실 마이그레이션은 MOD-GRID-14 책임 — `affectedUsageFiles: []`. |
| D5 | Storybook story: `지급항목` 그룹 헤더 + 3 leaf 컬럼(`basePay`/`bonus`/`totalPay`) 2단 구조. 단일 상위 그룹 데모. |

**파일 구성 (D# breakdown)**: NEW 3 + MODIFY 1 = **총 4개**

| # | 파일 | 구분 |
|---|------|------|
| 1 | `packages/grid-core/src/column/createGroupedColumns.ts` | NEW |
| 2 | `packages/grid-core/src/column/createGroupedColumns.test.ts` | NEW |
| 3 | `packages/grid-core/src/column/createGroupedColumns.stories.tsx` | NEW |
| 4 | `packages/grid-core/src/index.ts` | MODIFY |

---

## Section 1. 참조 출처 (Source References)

### 1.1 L0 — AS-IS 소스 (직접 마이그레이션 대상)

| 파일 | 역할 | 핵심 라인 |
|------|------|----------|
| `tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` | 다단 헤더 렌더러. `getHeaderGroups()`, `header.isPlaceholder`, `header.colSpan` 사용. GroupColumnDef 소비 패턴 원본. | L57, L75–115, L166–184 |

**GroupedHeaderGrid.tsx L166–184 소비 패턴 (D4 검증 기준)**:
```typescript
const columns: ColumnDef<Row>[] = [
  { header: '기본 정보', columns: [
    { accessorKey: 'empNo', header: '사번' },
    { accessorKey: 'name', header: '성명' },
  ]},
  { header: '급여 내역', columns: [
    { accessorKey: 'basePay', header: '기본급' },
    { accessorKey: 'bonus', header: '상여' },
    { accessorKey: 'totalPay', header: '합계' },
  ]},
];
```
`createGroupedColumns` 반환값은 위 리터럴과 deep-equal이어야 한다 (AC-004, D4).

### 1.2 L1 — TanStack Table v8 공식 API

| API | 용도 |
|-----|------|
| `GroupColumnDef<TData>` | `{ header: string \| HeaderFn; columns: ColumnDef<TData>[] }` — 다단 헤더 정의 타입 |
| `createColumnHelper<TData>().group({ header, columns })` | GroupColumnDef 생성 헬퍼 (타입 안전 경로) |
| `table.getHeaderGroups()` | 중첩 구조에서 HeaderGroup[] 자동 계산 |
| `header.isPlaceholder` | 다단 헤더 필러 셀 감지 |
| `header.colSpan` | 그룹 헤더 colSpan 자동 계산값 |

**출처**: `tw-grid/references/tanstack-api-inventory.md` §2.4, §2.5, §4

### 1.3 L2 — publish 레퍼런스

| 소스 | 패턴 | 참조 위치 |
|------|------|----------|
| AG Grid `ColGroupDef` | `{ headerName, children: ColDef[] }` — 계층 컬럼 그룹 패턴 | `publish-aggrid-analysis.md` R-A |

**C-16 준수**: Wijmo는 분석 참조(`publish-wijmo-analysis.md` R-W)에만 사용. 어떤 package에도 Wijmo import 금지.  
**C-7 준수**: AG Grid 패턴은 분석용. AG Grid 패키지 import 금지.

### 1.4 L3 — 내부 구현 참조

| 파일 | 역할 |
|------|------|
| `packages/grid-core/src/column/createColumns.ts` | G-001 구현 — thin-wrapper 단일 경로 패턴 참조 (hotfix: 단일 `const def = raw as TomisColumnDef<TData>` 경로) |
| `packages/grid-core/src/column/types.ts` | `TomisColumnDef<TData>`, `RendererRegistry<TData>` 타입 참조 |
| `packages/grid-core/src/index.ts` | MODIFY 대상 — `createGroupedColumns` export 추가 |
| `tw-grid/artifacts/MOD-GRID-04/column/G-001-spec.md` | spec 포맷 기준 + hotfix 단일 경로 원칙 |

### 1.5 Migration Impact

**low** — `createGroupedColumns`는 새로운 헬퍼 추가. AS-IS `GroupedHeaderGrid.tsx`의 컬럼 리터럴 패턴(`{ header, columns }`)과 동일 구조를 반환하므로 호환. 실 파일 마이그레이션은 MOD-GRID-14 소관.

### 1.6 R-A / R-W 참조 요약

- **R-A (AG Grid)**: `ColGroupDef.children` 배열 패턴 → G-002 `columns` 배열 설계 참조
- **R-W (Wijmo)**: 분석 참조 (import 절대 금지)

---

## Section 2. 목표 (Goal Statement)

`createGroupedColumns<TData>({ header, columns })` 함수를 구현하여:

1. TanStack `GroupColumnDef<TData>` 구조를 **thin wrapper**로 생성 — 변환/정규화 없음 (D1)
2. `createColumns()`가 반환한 `ColumnDef<TData>[]`를 `columns` 배열로 받아 그룹 헤더로 감쌈
3. 반환값이 `GroupedHeaderGrid.tsx`의 소비 패턴(`getHeaderGroups()` + `header.isPlaceholder` + `header.colSpan`)과 완전 호환 (D4)
4. `createGroupedColumns(g1, g2, ...gN)` rest-args 패턴으로 여러 그룹을 하나의 `ColumnDef<TData>[]` 배열로 합산

**성공 기준**: `createGroupedColumns({ header: '지급항목', columns: createColumns(leafDefs) })` 1회 호출로 `ColumnDef<TData>[]` 반환. TanStack `useReactTable({ columns })` 직접 주입 가능.

---

## Section 3. 수용 기준 (Acceptance Criteria)

| ID | 기준 | 소스 태그 |
|----|------|----------|
| AC-001 | `createGroupedColumns<TData>(...groups)` 함수 시그니처: rest 파라미터 `...groups: Array<{ header: string; columns: ColumnDef<TData>[] }>`. 반환 `ColumnDef<TData>[]`. | [L1: tanstack-api-inventory.md §4 GroupColumnDef] |
| AC-002 | 각 group 객체는 TanStack `GroupColumnDef<TData>` 구조로 그대로 반환. `accessorKey` 없음, `header: string`, `columns: ColumnDef<TData>[]`. | [L0: GroupedHeaderGrid.tsx L166–184, L1: §4] |
| AC-003 | 반환 배열은 `GroupedHeaderGrid.tsx`의 `useReactTable({ columns: ... })` 에 직접 주입 가능. `getHeaderGroups()` 호출 시 올바른 HeaderGroup[] 생성. | [L0: GroupedHeaderGrid.tsx L57, L75–115] |
| AC-004 | `createGroupedColumns({ header: '기본 정보', columns: leafCols })` 반환값이 `{ header: '기본 정보', columns: leafCols }` 리터럴과 deep-equal. 어떠한 변환 없음 (D1). | [D1, D4] |
| AC-005 | TypeScript strict: `any` 없음 (C-4). `TData` generic이 `columns` 배열과 반환 타입에 일관 전파. | [constraints.md C-4] |

---

## Section 4. 비기능 요건 (Non-Functional Requirements)

| 항목 | 요건 |
|------|------|
| **타입 안전성** | C-4: `any` 타입 사용 금지. `ColumnDef<TData>` + `GroupColumnDef<TData>` generic 일관 사용. |
| **번들 크기** | C-21: `grid-core` ≤ 30 KB gzipped. G-001 post-hotfix baseline ~28.6 KB (재측정 필요). 이 Goal +~1 KB → ~29.6 KB 예상. 구현 후 번들 측정 필수. |
| **peerDependencies** | C-22: `@tanstack/react-table@^8.21.3` peerDep. 번들에 포함 금지. |
| **JSDoc** | C-25: 공개 API (`createGroupedColumns`) 전체 JSDoc + `@example` 필수. |
| **Storybook** | C-25: 2단 그룹 헤더 데모 Story 필수 (D5). |
| **단순성** | G-001 hotfix 원칙 준수: thin wrapper, 내부 heuristic 함수 없음. `isGroupColumn()` 타입 가드 생성 금지. |

---

## Section 5. 엣지 케이스 (Edge Cases)

| ID | 시나리오 | 기대 동작 |
|----|----------|----------|
| EC-01 | `columns: []` (빈 leaf 배열) | `{ header, columns: [] }` 반환. 에러 없음. TanStack이 빈 그룹 처리. |
| EC-02 | 단일 그룹 1개 인자 | `ColumnDef<TData>[]` 길이 1 반환. 그룹 wrapping 정상. |
| EC-03 | 여러 그룹 N개 rest 인자 | `ColumnDef<TData>[]` 길이 N 반환. 각 그룹 독립 wrapping. |
| EC-04 | `columns` 배열 내에 또 다른 `createGroupedColumns` 반환값 포함 (2단 중첩) | TanStack 자동 처리. G-002는 변환 없이 pass-through. |
| EC-05 | `header`가 빈 문자열 `''` | 빈 문자열 그대로 전달. 유효성 검사 없음. TanStack 기본 동작. |
| EC-06 | `createColumns(leafDefs)` 와 `createGroupedColumns` 혼합 배열 | `[...createGroupedColumns(g1), ...createColumns(leafDefs)]` — 호출 측 책임. |

---

## Section 6. 테스트 계획 (Test Plan)

### 단위 테스트 (`column/createGroupedColumns.test.ts` — NEW, Vitest 실행)

| TC-ID | 입력 | 검증 |
|-------|------|------|
| TC-01 | `createGroupedColumns({ header: '기본 정보', columns: [] })` | 반환 배열 길이 1, `[0].header === '기본 정보'`, `[0].columns` 길이 0 |
| TC-02 | `createGroupedColumns({ header: 'A', columns: leafCols })` | `[0].columns === leafCols` (동일 참조) |
| TC-03 | `createGroupedColumns(g1, g2)` (2개 그룹) | 반환 배열 길이 2, 각 header/columns 일치 |
| TC-04 | deep-equal fixture: `createGroupedColumns({ header: '기본 정보', columns: [{ accessorKey: 'empNo', header: '사번' }] })` | TanStack `ColumnDef<Row>[]` 리터럴과 deep-equal (AC-004, D4) |
| TC-05 | `createGroupedColumns({ header: '', columns: [] })` | 반환 `[0].header === ''` — 빈 문자열 통과 (EC-05) |
| TC-06 | N=5 그룹 rest 인자 | 반환 배열 길이 5, 순서 보존 |

**A-07 의무**: 이 테스트 파일은 Vitest(`vitest run`)로 실행. typetest-only 금지.

### Storybook Stories (`column/createGroupedColumns.stories.tsx` — NEW)

| Story | 내용 |
|-------|------|
| `TwoLevelGroupHeader` | `지급항목` 그룹 헤더 + `basePay`/`bonus`/`totalPay` 3 leaf (D5). `GroupedHeaderGrid`에 주입하여 다단 렌더링. |
| `MultipleGroups` | `기본 정보` + `급여 내역` 2개 그룹. L0 GroupedHeaderGrid 소비 패턴 재현. |
| `EmptyGroup` | `columns: []` 빈 그룹 — 그리드 렌더링 안정성 확인. |

---

## Section 7. 구현 파일 목록 (Implementation Files)

| # | 경로 (topvel-grid-monorepo/…) | 구분 | 설명 |
|---|-------------------------------|------|------|
| 1 | `packages/grid-core/src/column/createGroupedColumns.ts` | **NEW** | 핵심 공개 API. `createGroupedColumns<TData>(...groups)` thin wrapper. JSDoc + `@example`. |
| 2 | `packages/grid-core/src/column/createGroupedColumns.test.ts` | **NEW** | 단위 테스트 TC-01~TC-06. Vitest 실행. |
| 3 | `packages/grid-core/src/column/createGroupedColumns.stories.tsx` | **NEW** | Storybook Stories 3개 (C-25, D5). |
| 4 | `packages/grid-core/src/index.ts` | **MODIFY** | `createGroupedColumns` export 추가. |

**합계**: NEW 3 + MODIFY 1 = **4개 파일**

---

## Section 8. 설계 상세 (Design Details)

### 8.1 createGroupedColumns 타입 시그니처

```typescript
import type { ColumnDef } from '@tanstack/react-table';

/**
 * Group 입력 타입. TanStack GroupColumnDef와 동일 shape.
 * `header`: 그룹 헤더 표시 문자열.
 * `columns`: leaf ColumnDef 또는 중첩 그룹 ColumnDef 배열.
 */
export interface TomisColumnGroup<TData = unknown> {
  header: string;
  columns: ColumnDef<TData>[];
}
```

**C-4**: `any` 없음. `TData` generic 전파.  
**D1**: 변환 없음. `TomisColumnGroup<TData>`는 TanStack `GroupColumnDef<TData>`의 subset — 직접 캐스팅 가능.

### 8.2 createGroupedColumns 핵심 구현

```typescript
/**
 * `createGroupedColumns<TData>(...groups)` — Multi-row column group 헬퍼.
 *
 * 각 group 객체를 TanStack `GroupColumnDef<TData>`로 pass-through.
 * 어떠한 변환/정규화 없음 (D1: thin wrapper).
 * TanStack `getHeaderGroups()`가 colSpan·isPlaceholder를 자동 계산.
 *
 * @typeParam TData - 행 데이터 타입
 * @param groups - 그룹 정의 배열 (rest 파라미터).
 *   각 group: `{ header: string; columns: ColumnDef<TData>[] }`
 * @returns `ColumnDef<TData>[]` — `useReactTable({ columns })` 직접 주입 가능.
 *
 * @example
 * ```typescript
 * import { createColumns, createGroupedColumns } from '@tomis/grid-core';
 *
 * const leafCols = createColumns<Row>([
 *   { id: 'basePay', name: '기본급', type: 'number', align: 'right', width: '120' },
 *   { id: 'bonus',   name: '상여',   type: 'number', align: 'right', width: '100' },
 *   { id: 'totalPay',name: '합계',   type: 'number', align: 'right', width: '120' },
 * ]);
 *
 * const columns = createGroupedColumns<Row>(
 *   { header: '지급항목', columns: leafCols },
 * );
 * // columns → [{ header: '지급항목', columns: [...leafCols] }]
 * // GroupedHeaderGrid에 직접 주입 가능
 * ```
 *
 * @see createColumns — leaf ColumnDef 생성 (AC-002)
 * @see GroupedHeaderGrid — 다단 헤더 렌더러 (L0: GroupedHeaderGrid.tsx)
 * @see AC-001, AC-002, AC-003, AC-004
 */
export function createGroupedColumns<TData = unknown>(
  ...groups: Array<TomisColumnGroup<TData>>
): ColumnDef<TData>[] {
  return groups as ColumnDef<TData>[];
}
```

**D1 설계 근거**: TanStack `GroupColumnDef<TData>`는 `{ header: string | HeaderFn; columns: ColumnDef<TData>[] }` shape. `TomisColumnGroup<TData>`가 이 subset — `as ColumnDef<TData>[]` 단일 캐스팅으로 타입 호환. isGroupColumn() 타입 가드 불필요.

**G-001 hotfix 원칙 적용**: isColumnInfo/normalizeColumnInfo처럼 내부 heuristic 함수를 만들지 않음. 단일 pass-through 경로.

**C-4 유일 예외**: `groups as ColumnDef<TData>[]` — GroupColumnDef는 ColumnDef union의 멤버이므로 런타임 안전. `any`를 경유하지 않음.

### 8.3 affectedUsageFiles

`affectedUsageFiles: []` — G-002는 새 헬퍼 추가. GroupedHeaderGrid.tsx 실 마이그레이션은 MOD-GRID-14 소관 (D4). 테스트 fixture에서 호환성만 검증.

### 8.4 index.ts 수정 내용

```typescript
// MOD-GRID-04: Column Factory (G-001 + G-002 추가)
export { createGroupedColumns } from './column/createGroupedColumns';
export type { TomisColumnGroup } from './column/createGroupedColumns';
```

기존 G-001 export 블록 바로 다음에 추가. 기존 export 변경 없음.

### 8.5 번들 크기 예상 (C-21)

| 구성 요소 | 예상 gzip 기여 |
|----------|----------------|
| `createGroupedColumns.ts` (본체 — 함수 1개 + 인터페이스) | ~0.4 KB |
| `createGroupedColumns.test.ts` / `.stories.tsx` (번들 미포함) | 0 KB |
| **이 Goal 런타임 총계** | **~0.4 KB** |
| **G-001 post-hotfix baseline** | **~28.6 KB (재측정 필요)** |
| **예상 총계** | **~29.0 KB** |
| **C-21 한도** | **30 KB** |
| **여유** | **~1.0 KB** |

> **주의**: G-001 hotfix가 4개 내부 헬퍼(isColumnInfo/normalizeColumnInfo/isTomisColumnType/TOMIS_COLUMN_TYPES)를 제거하여 pre-hotfix 29.12 KB보다 감소. 정확한 baseline은 구현 후 번들 측정으로 확인. G-002는 +0.4 KB 예상으로 30 KB 이내 안전.

---

## Section 9. 의존성 (Dependencies)

### 런타임 의존성 (peerDependencies, C-22)

| 패키지 | 버전 | 역할 |
|--------|------|------|
| `@tanstack/react-table` | `^8.21.3` | `ColumnDef<TData>` 타입 |

### 내부 의존성

| 모듈 | 관계 |
|------|------|
| MOD-GRID-04 G-001 (`createColumns`) | `createGroupedColumns`의 `columns` 배열 생성에 사용. 독립 함수이나 주요 소비 패턴. |
| MOD-GRID-01 (`GroupedHeaderGrid`) | G-002 반환값의 소비자. 실 마이그레이션은 MOD-GRID-14. |
| MOD-GRID-14 (Multi-row Header Pro) | `createColumnGroup({header, columns})` — Pro tier 확장판. G-002는 MIT 기반 기초 헬퍼. |

### 빌드 의존성

| 도구 | 버전 |
|------|------|
| TypeScript | `^5.x` (`strict: true`, `exactOptionalPropertyTypes: true`) |
| Vitest | 단위 테스트 (TC-01~TC-06, A-07 필수) |
| Storybook | Stories 작성 (C-25, D5) |

---

## Section 10. 마이그레이션 가이드 (Migration Guide)

### GroupedHeaderGrid 사용자 → createGroupedColumns 전환

**Before (AS-IS — L0 리터럴 패턴)**:
```typescript
// GroupedHeaderGrid.tsx L166–184 (파일 내 인라인 리터럴)
const columns: ColumnDef<Row>[] = [
  { header: '기본 정보', columns: [
    { accessorKey: 'empNo', header: '사번' },
    { accessorKey: 'name',  header: '성명' },
  ]},
  { header: '급여 내역', columns: [
    { accessorKey: 'basePay',  header: '기본급' },
    { accessorKey: 'bonus',    header: '상여' },
    { accessorKey: 'totalPay', header: '합계' },
  ]},
];
```

**After (TO-BE — createGroupedColumns 사용)**:
```typescript
import { createColumns, createGroupedColumns } from '@tomis/grid-core';
import type { TomisColumnDef } from '@tomis/grid-core';

const infoLeaves = createColumns<Row>([
  { id: 'empNo', name: '사번', type: 'text', align: 'left', width: '100' },
  { id: 'name',  name: '성명', type: 'text', align: 'left', width: '120' },
]);
const salaryLeaves = createColumns<Row>([
  { id: 'basePay',  name: '기본급', type: 'number', align: 'right', width: '120' },
  { id: 'bonus',    name: '상여',   type: 'number', align: 'right', width: '100' },
  { id: 'totalPay', name: '합계',   type: 'number', align: 'right', width: '120' },
]);

const columns = createGroupedColumns<Row>(
  { header: '기본 정보', columns: infoLeaves },
  { header: '급여 내역', columns: salaryLeaves },
);
```

> **주의**: GroupedHeaderGrid.tsx 파일 자체 수정은 MOD-GRID-14 담당. 이 가이드는 신규 코드 작성 기준.

---

## Section 11. 구현 단계 (Implementation Steps)

### Step 1: column/createGroupedColumns.ts 생성 (NEW)

**파일**: `packages/grid-core/src/column/createGroupedColumns.ts`  
**내용**: `TomisColumnGroup<TData>` 인터페이스 + `createGroupedColumns<TData>(...groups)` 함수. JSDoc + `@example`.  
**검증**: TypeScript 컴파일 통과. `any` 없음 (C-4). 함수 본체 `groups as ColumnDef<TData>[]` 단일 행.

### Step 2: index.ts 수정 (MODIFY)

**파일**: `packages/grid-core/src/index.ts`  
**추가 export** (기존 G-001 export 블록 다음):
```typescript
// MOD-GRID-04: Column Factory (G-002 추가)
export { createGroupedColumns } from './column/createGroupedColumns';
export type { TomisColumnGroup } from './column/createGroupedColumns';
```
**검증**: 기존 export 변경 없음. 빌드 통과.

### Step 3: createGroupedColumns.test.ts 작성 (NEW, Vitest)

**파일**: `packages/grid-core/src/column/createGroupedColumns.test.ts`  
**내용**: TC-01~TC-06 (Vitest `describe`/`it`/`expect`). TC-04 deep-equal fixture 포함.  
**검증**: `vitest run` 전체 통과 (A-07). TC-04 GroupedHeaderGrid 호환 확인.

### Step 4: createGroupedColumns.stories.tsx 작성 (NEW, Storybook)

**파일**: `packages/grid-core/src/column/createGroupedColumns.stories.tsx`  
**내용**: `TwoLevelGroupHeader` / `MultipleGroups` / `EmptyGroup` 3 Story (C-25, D5).  
`TwoLevelGroupHeader`: `지급항목` + `basePay`/`bonus`/`totalPay` 데모.  
**검증**: Storybook 빌드 에러 없음.

---

## Section 12. 위험 및 완화 (Risks & Mitigations)

| 위험 | 심각도 | 완화 |
|------|--------|------|
| **번들 초과 (C-21)** | LOW | G-002 본체 ~0.4 KB. 구현 후 번들 측정으로 30 KB 이내 확인. |
| **GroupedHeaderGrid.tsx 호환성 (D4)** | MEDIUM | TC-04 deep-equal fixture로 구조 일치 검증. 실 파일 마이그레이션은 MOD-GRID-14 담당. |
| **G-001 cascading feedback 오적용 (D3)** | MEDIUM | enableColumnFilter/enablePinning은 GroupColumnDef 수준 관심사 아님. 이 Goal에서 추가 금지. |
| **재귀 중첩 3단 이상 미검증 (D2, OQ-01)** | LOW | TanStack 자동 처리. G-002는 1–2단 명시 데모. 소비자 책임으로 OQ-01 기록. |
| **TypeScript `as` 캐스팅 (Section 8.2)** | LOW | `any` 미경유. GroupColumnDef는 ColumnDef union 멤버 — 런타임 안전. C-4 규칙 내 허용 패턴. |

---

## Section 13. 열린 질문 (Open Questions)

| # | 질문 | 현재 결정 | 재검토 조건 |
|---|------|----------|------------|
| OQ-01 | 3단 이상 중첩 그룹(group-within-group-within-group)에 대한 공식 데모 필요 여부? | **미결정 — 소비자 책임**: TanStack이 자동 처리하므로 G-002에서 강제하지 않음. | 실 사용 사례 발생 시 G-003 이후 별도 Story 추가. |
| OQ-02 | `TomisColumnGroup<TData>`를 `types.ts`로 이동하여 통합 관리할지? | 현재 `createGroupedColumns.ts` 내부 정의 (파일 응집도 우선). | G-003 이후 types.ts 과다 성장 시 검토. |
| OQ-03 | `header`에 `ReactNode` 또는 커스텀 헤더 컴포넌트 지원 필요 여부? | **현재 `string`만**: TanStack `GroupColumnDef.header`는 `string | HeaderFn` 허용. 이 Goal은 단순 string. | MOD-GRID-14 Pro tier에서 HeaderFn 지원 검토. |
| OQ-04 | `enableColumnFilter`/`enablePinning` leaf 타입 확장은 어느 Goal에서? | **G-001 cascading 미해결**: G-003 이후 `TomisColumnDef` 타입 확장 Goal에서 처리 (D3). | G-003 Spec 작성 시 cascading 항목으로 포함. |

---

*Spec 완료 — specify-rubric v1.0.5 medium threshold (90) 대상.*  
*번들 측정: G-001 post-hotfix baseline 재측정 후 G-002 +0.4 KB 검증 필수 (C-21).*  
*MOD-GRID-14 의존 (GroupedHeaderGrid.tsx 실 마이그레이션): G-002는 헬퍼만 제공.*
