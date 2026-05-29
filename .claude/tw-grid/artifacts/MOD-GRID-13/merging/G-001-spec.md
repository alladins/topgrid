# MOD-GRID-13 / G-001 Specification
# column.mergeRows prop API + rowSpan 자동 계산 렌더러 (핵심 병합 엔진)

**Status**: DRAFT
**Author**: tw-grid Spec Writer Agent
**Date**: 2026-05-15
**Package**: `@tomis/grid-pro-merging`
**Threshold**: specify-score ≥ 90 (low tier)

---

## Section 0 — 사전 결정 (D# 테이블)

| ID | 결정 | 근거 / 제약 |
|----|------|------------|
| D1 | **monorepo 경로 정정 (C-28)**: goals.json `implementFiles`의 `TOMIS/packages/` 접두사를 `topvel-grid-monorepo/packages/`로 정정. ADR 파일(`.claude/tw-grid/decisions/MOD-GRID-13-decisions.md`)은 TOMIS 경로 그대로 유지. | TOMIS 저장소에 `packages/` 디렉토리 미존재. 실제 monorepo root는 `D:/project/topvel_project/topvel-grid-monorepo/`. C-28 + ADR-MOD-GRID-00-001 근거. |
| D2 | **grid-license 의존 처리**: Option A — namespace import + feature-detect 패턴 (`(gridLicense as { verifyGridLicense?: () => void }).verifyGridLicense?.()`) | MOD-GRID-99-A/G-001 미완료. `grid-license/src/index.ts`는 `export {};` stub. Optional-chain으로 stub→실구현 시 호출부 변경 없음. C-4 준수 (`@ts-ignore` 사용 금지 — B-06). |
| D3 | **MergeRowsConfig 합집합 타입**: `boolean \| ((prev: TData, curr: TData) => boolean)` | 선언적(boolean=동일 값 비교) + 커스텀(비교 함수) 두 패턴을 단일 타입으로 표현. TanStack `ColumnDef<TData>` meta 확장으로 추가. |
| D4 | **computeMergeSpans 반환형**: `Map<string, number>` (키=`${rowIdx}_${colId}`, 값=rowSpan) | skip 셀(rowSpan=0 또는 미포함)은 null 반환 처리. 0행 데이터 시 빈 Map 반환. |
| D5 | **패키지 기존 구조 활용**: `package.json`, `tsconfig.json`, `tsup.config.ts` MODIFY (기존 scaffold 파일 활용) | Glob으로 `grid-pro-merging` 디렉토리 이미 존재 확인 (package.json 내 `@tomis/grid-pro-merging` + `"license": "SEE LICENSE IN EULA"` + peerDependencies 확인). 신규 패키지 스캐폴딩 불필요. |

**D5 세부 — 기존 파일 현황**:
- `package.json`: 존재 (peerDeps: react, react-dom, @tanstack/react-table 확인. `@tomis/grid-core`, `@tomis/grid-license` peer 누락 → MODIFY 필요)
- `tsconfig.json`: 존재 (extends tsconfig.base.json, noEmit true)
- `tsup.config.ts`: 존재 (CJS+ESM dual, external 목록 확인)
- `src/index.ts`: 존재 (placeholder `export {};`) → MODIFY
- `EULA.md`: **미존재** → NEW 필요
- `.size-limit.json`: **미존재** → NEW 필요
- `src/types.ts`, `src/computeMergeSpans.ts`, `src/MergingGrid.tsx`: **미존재** → NEW

---

## Section 1 — 참조 추적 (Reference Traceability)

### L0: 현 구현 (tw-framework-front)
**N/A — 신규 Pro 패키지**. `tw-framework-front`에 Cell Merging 기존 구현 없음. affectedUsageFiles = 0.

### L1: TanStack v8 표준 API (핵심 인용)
출처: `references/tanstack-api-inventory.md` + `references/current-tanstack-analysis.md`

| API | 용도 |
|-----|------|
| `useReactTable(options)` | 기본 테이블 인스턴스 생성 |
| `getCoreRowModel()` | 기본 행 모델 (데이터 정렬 전) |
| `getSortedRowModel()` | 정렬 적용된 행 순서 (병합 재계산 기준) |
| `getFilteredRowModel()` | 필터 적용 행 (병합 재계산 기준) |
| `flexRender(cell.column.columnDef.cell, cell.getContext())` | 셀 렌더링 |
| `table.getRowModel().rows` | 실제 렌더링 행 배열 |
| `row.getVisibleCells()` | 행별 셀 배열 |
| `ColumnDef<TData>` | 컬럼 정의 타입 (meta 필드 확장으로 mergeRows 추가) |

**TanStack Row Spanning 직접 지원 여부**: TanStack v8에는 rowSpan 자동 계산 기능이 없음. `computeMergeSpans` 자체 엔진으로 구현 필요.

### L2: 공통 컴포넌트 분석
**N/A** — Cell Merging은 공통 컴포넌트 variant 8종(BaseGrid 등) 중 어느 것도 병합 기능을 구현하지 않음. 신규 영역.

### L3: 영향 사용처
**N/A** — affectedUsageFiles: 0 (신규 Pro 패키지).

### R-A: AG Grid Row Spanning (참조만 — C-7)
출처: `references/ag-grid-feature-matrix.md` L69

- AG Grid Enterprise 기능: `rowSpan` callback — Enterprise 전용 (`❌ Community`)
- AG Grid 방식: 컬럼 `ColDef`에 `rowSpan: (params) => number` 콜백 지정
- 참조 결론: 콜백 기반 rowSpan은 AG Grid와 유사한 설계이나, 우리는 **전체 데이터 사전 스캔(computeMergeSpans)** 방식 채택 — 단일 패스 계산으로 정합성 보장
- **코드 차용 없음 (C-7)**

### R-W: Wijmo AllowMerging (참조만 — C-16)
출처: `references/publish-wijmo-analysis.md` §3, §4

- Wijmo `AllowMerging` enum: `None | Cells | ColumnHeaders | RowHeaders | All`
- 실제 사용 예: `g.allowMerging = wjGrid.AllowMerging.ColumnHeaders` (organizeSchedule/page.tsx L90)
- Wijmo 방식: 그리드 레벨 enum + content-driven 자동 병합 (FlexGrid 내부 처리)
- 참조 결론: Wijmo는 그리드 전역 설정. 우리는 **컬럼 단위 `mergeRows` prop** 방식 — 더 세밀한 제어
- `references/publish-wijmo-analysis.md` §4 "Cell Merging (content-driven 자동 병합)" 확인
- **코드 차용 없음 (C-16 절대 준수). `@mescius/wijmo*` import 금지.**

**migrationImpact**: `low` (goals.json L17 확인 — affectedUsageFiles = 0, 신규 Pro 패키지)

---

## Section 2 — API 계약 (TypeScript Interface)

### 2.1 핵심 타입 정의

```typescript
// packages/grid-pro-merging/src/types.ts
import type { ColumnDef } from '@tanstack/react-table';

/**
 * 셀 병합 비교 설정.
 * - true: 동일 값(===) 비교로 자동 병합
 * - (prev, curr) => boolean: 커스텀 비교 함수
 */
export type MergeRowsConfig<TData> =
  | boolean
  | ((prev: TData, curr: TData) => boolean);

/**
 * mergeRows를 지원하는 확장 컬럼 정의.
 * TanStack ColumnDef meta 필드를 통해 확장.
 */
export type MergingColumnDef<TData> = ColumnDef<TData> & {
  meta?: {
    mergeRows?: MergeRowsConfig<TData>;
    [key: string]: unknown;
  };
};

/**
 * computeMergeSpans 결과.
 * 키 형식: `${rowIdx}_${colId}`
 * 값: rowSpan 수 (1 이상이면 정상 셀, 0이면 skip 셀)
 */
export type MergeSpanMap = Map<string, number>;

/** MergingGrid 컴포넌트 Props */
export interface MergingGridProps<TData> {
  /** 렌더링할 데이터 배열 */
  data: TData[];
  /** 컬럼 정의 (MergingColumnDef 확장 포함) */
  columns: MergingColumnDef<TData>[];
  /** 병합 기능 활성화. false(기본값)이면 일반 Grid 동작 보존 (AC-004 / C-6) */
  enableMerging?: boolean;
  /** TanStack table className */
  className?: string;
}
```

### 2.2 computeMergeSpans 시그니처

```typescript
// packages/grid-pro-merging/src/computeMergeSpans.ts

/**
 * 데이터 배열과 병합 대상 컬럼 목록을 받아 MergeSpanMap을 계산한다.
 *
 * @param rows    - 렌더링 순서의 TData 배열 (getSortedRowModel / getFilteredRowModel 결과)
 * @param columns - 병합 컬럼 정보 배열 (id + mergeRows 설정)
 * @returns       - 키 `${rowIdx}_${colId}` → rowSpan 숫자의 Map
 *                  skip 셀은 Map에서 0으로 존재 (null 반환 트리거)
 */
export function computeMergeSpans<TData>(
  rows: TData[],
  columns: Array<{
    id: string;
    mergeRows: MergeRowsConfig<TData>;
  }>
): MergeSpanMap;
```

### 2.3 MergingGrid 컴포넌트

```tsx
// packages/grid-pro-merging/src/MergingGrid.tsx
export function MergingGrid<TData extends object>(
  props: MergingGridProps<TData>
): React.JSX.Element;
```

### 2.4 기본값 명시

| Prop | 기본값 | 필수 여부 |
|------|--------|---------|
| `enableMerging` | `false` | optional |
| `className` | `undefined` | optional |
| `data` | — | required |
| `columns` | — | required |
| `meta.mergeRows` | `undefined` (병합 안 함) | optional (컬럼 단위) |

`mergeRows: true` 시: 동일 값(`===` 비교) 연속 행 자동 병합.
`mergeRows: false` 또는 미지정: 해당 컬럼 병합 없음.

### 2.5 사용 예시 1 — 선언적 boolean

```tsx
import { MergingGrid, type MergingColumnDef } from '@tomis/grid-pro-merging';

interface EmployeeRow {
  dept: string;
  team: string;
  name: string;
}

const columns: MergingColumnDef<EmployeeRow>[] = [
  {
    id: 'dept',
    header: '부서',
    accessorKey: 'dept',
    meta: { mergeRows: true },        // 동일 dept 값 자동 병합
  },
  {
    id: 'team',
    header: '팀',
    accessorKey: 'team',
    // meta.mergeRows 미지정 → 병합 없음
  },
  {
    id: 'name',
    header: '이름',
    accessorKey: 'name',
  },
];

function DeptTable() {
  return (
    <MergingGrid
      data={employeeData}
      columns={columns}
      enableMerging
    />
  );
}
```

### 2.6 사용 예시 2 — 커스텀 비교 함수

```tsx
const columns: MergingColumnDef<EmployeeRow>[] = [
  {
    id: 'dept',
    header: '부서',
    accessorKey: 'dept',
    meta: {
      // 부서 + 연도가 모두 같을 때만 병합
      mergeRows: (prev: EmployeeRow, curr: EmployeeRow) =>
        prev.dept === curr.dept && prev.year === curr.year,
    },
  },
];
```

### 2.7 타입 export 경로 (monorepo)

```
D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/types.ts
  └─ export: MergeRowsConfig, MergingColumnDef, MergeSpanMap, MergingGridProps

D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/index.ts
  └─ re-export: computeMergeSpans, MergingGrid + 타입 전체
```

---

## Section 3 — 기존 사용처 대응표

affectedUsageFiles = 0. 신규 Pro 패키지이므로 대응표 N/A.

**향후 사용처 추가 시 import 패턴 가이드**:
```typescript
import { MergingGrid, type MergingColumnDef } from '@tomis/grid-pro-merging';
// 컬럼 정의에 meta.mergeRows 추가 후 <MergingGrid enableMerging> 사용
```

---

## Section 4 — 호환성 정책

| 항목 | 값 |
|------|-----|
| Breaking change | `false` (신규 패키지) |
| Deprecation 전략 | N/A (신규 패키지 — alias 불필요) |
| 마이그레이션 경로 | N/A |

**peerDependencies** (신규 사용처가 도입 시 충족해야 할 요건):
```json
{
  "react": ">=18.0.0",
  "react-dom": ">=18.0.0",
  "@tanstack/react-table": ">=8.0.0",
  "@tomis/grid-core": "workspace:*",
  "@tomis/grid-license": "workspace:*"
}
```

**peerDependenciesMeta**:
```json
{
  "@tomis/grid-license": { "optional": true }
}
```
(grid-license는 MOD-GRID-99-A 미완료 동안 optional. 실구현 완료 후 required로 전환.)

**enableMerging=false 시 동작 보장**: 기존 Grid와 완전히 동일한 테이블 렌더링. TanStack getCoreRowModel() + flexRender() 만 사용. computeMergeSpans 호출 없음.

---

## Section 5 — 인수 기준 (Acceptance Criteria)

| ID | 기준 | 출처 태그 | migrationImpact |
|----|------|---------|----------------|
| AC-001 | column 타입 확장: `mergeRows?: boolean \| ((prev: TData, curr: TData) => boolean)` — TypeScript strict, no any (C-4). `MergingColumnDef<TData>` 타입으로 export. | C-4, L1 (`ColumnDef<TData>` meta 확장) | low |
| AC-002 | `computeMergeSpans(rows, columns)` → `Map<string, number>`. 각 셀 키 `${rowIdx}_${colId}`에 rowSpan 저장. C-1 준수 (실제 rows 기반 계산). | C-1, L1 (`table.getRowModel().rows`) | low |
| AC-003 | 병합된 셀 td에 `rowSpan={span}` 적용. skip 셀(span=0) null 반환(DOM 제거). TanStack 표준 API `flexRender`, `getCoreRowModel` 사용. | C-2, L1 (`flexRender`) | low |
| AC-004 | `enableMerging` prop `false`(기본) 시 병합 없음 — 기존 Grid 동작 완전 보존 (C-6). tsc 0 errors. | C-6, C-12 | low |
| AC-005 | Pro 패키지: `package.json` `"license": "SEE LICENSE IN EULA"` + `EULA.md` 존재. import 시 grid-license feature-detect 호출 (C-24). | C-24, L1 | low |
| AC-006 | `@mescius/wijmo*` import 0건 (C-16 절대 준수). R-W AllowMerging 개념 학습만, 코드 차용 없음. | C-16, R-W | low |
| AC-007 | `decisions/MOD-GRID-13-decisions.md` ADR 작성 — API 시그니처 결정 + grid-license 의존 처리 방침 (C-14). 대안 2개+ 포함. | C-14, L1 | low |
| AC-008 | tsc `--noEmit` 0 errors (`packages/grid-pro-merging`). | C-12 | low |
| AC-009 | Storybook story 1개 — `mergeRows: true` 기본 시나리오 + 커스텀 비교 함수 시나리오 2개 (1 story 파일 내 export 2개). | C-25 | low |

---

## Section 6 — 엣지 케이스

### EC-001: 데이터 행 0개 (empty array)
- `computeMergeSpans([], columns)` → 빈 `Map` 반환
- `MergingGrid` rows 반복 없이 빈 tbody 렌더
- 기대: 에러 없이 빈 테이블 표시

### EC-002: 모든 셀이 다른 값 (병합 0건)
- 모든 셀에 대해 rowSpan=1 (Map에 미포함 또는 1 명시)
- skip 셀 없음
- 기대: 일반 테이블과 동일하게 렌더링

### EC-003: 한 컬럼 전체가 동일 값 (rowSpan = total rows)
- 첫 번째 행: `rowSpan = rows.length`
- 나머지 행: skip (null 반환)
- 기대: 단일 병합 셀이 전체 행 높이 차지

### EC-004: undefined / null 값 비교 처리
- `mergeRows: true` 시 기본 비교 `===` 사용
- `null === null` → 병합 발생 가능
- `undefined === undefined` → 병합 발생 가능
- 커스텀 비교 함수에서 null guard 책임은 사용자
- 기대: 타입 에러 없음. null/undefined 동일 값 행은 병합됨.

### EC-005: 정렬 변경 후 동적 데이터 추가
- `enableMerging=true` 시 TanStack `sorting` state 변경 → `getSortedRowModel()` 재실행 → `computeMergeSpans` useMemo 재실행
- 데이터 추가(`data` prop 변경) 시 동일한 useMemo 재실행
- 기대: 정렬+필터 state 변경 + 데이터 변경 모두 병합 재계산 정상 작동

---

## Section 7 — 구현 대상 파일 (NEW/MODIFY 표)

**★ C-28 정정 결정 D1 적용**: goals.json의 `TOMIS/packages/` prefix를 `topvel-grid-monorepo/packages/`로 정정. ADR 파일은 TOMIS 경로 유지.

**★ D5 결정 적용**: `package.json`, `tsconfig.json`, `tsup.config.ts`는 기존 파일 존재 확인 → MODIFY.

| # | 파일 경로 | 액션 | 설명 |
|---|-----------|------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/package.json` | MODIFY | peerDeps에 `@tomis/grid-core`, `@tomis/grid-license` 추가. peerDependenciesMeta에 grid-license optional 명시. |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/EULA.md` | NEW | Pro 패키지 EULA 문서 (C-24 의무) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/types.ts` | NEW | MergeRowsConfig, MergingColumnDef, MergeSpanMap, MergingGridProps 타입 정의 |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/computeMergeSpans.ts` | NEW | 병합 span 계산 순수 함수 엔진 |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/MergingGrid.tsx` | NEW | MergingGrid 렌더러 컴포넌트 + grid-license feature-detect 호출 |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/index.ts` | MODIFY | placeholder `export {};` → 실제 exports로 교체 |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/.size-limit.json` | NEW | ≤ 20 KB 한도 설정 (C-21) |
| 8 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/tsconfig.json` | MODIFY | Storybook 지원 등 필요 시 보완 (기존 파일 최소 수정) |
| 9 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/MergingGrid.stories.tsx` | NEW | Storybook story (AC-009, C-25) |
| 10 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-13-decisions.md` | NEW | ADR 파일 (C-14 의무. TOMIS 경로 — monorepo 경로 아님) |

총 10개 파일: NEW 7개 (`EULA.md`, `types.ts`, `computeMergeSpans.ts`, `MergingGrid.tsx`, `.size-limit.json`, `MergingGrid.stories.tsx`, `decisions/MOD-GRID-13-decisions.md`) + MODIFY 3개 (`package.json`, `src/index.ts`, `tsconfig.json`).

---

## Section 8 — 마이그레이션 영향도 Preflight

### 8.1 affectedUsageFiles
0개. 신규 Pro 패키지. `tw-framework-front` 및 기타 사용처 영향 없음.

### 8.2 무파괴 검증
- `enableMerging=false` (기본값) 시 기존 Grid 동작 완전 보존.
- `MergingGrid` 자체는 독립 패키지 — 기존 `@tomis/grid-core` 코드 수정 없음.
- tsc 0 errors 의무 (C-12).
- `grid-pro-merging`이 신규 패키지이므로 기존 페이지에 자동 영향 없음.

### 8.3 점진 vs 일괄
N/A (affectedUsageFiles = 0).

### 8.4 롤백 전략
`@tomis/grid-pro-merging` 패키지 미설치/미import 시 영향 0. 패키지를 제거하거나 import하지 않으면 완전 롤백. N/A 조건 충족 (low tier + 사용처 0).

### 8.5 번들 크기 영향
- 예상 +5 KB gzipped (types + computeMergeSpans + MergingGrid)
- Pro 패키지 한도: ≤ 20 KB (C-21)
- `.size-limit.json`으로 CI 자동 검증
- grid-core, grid-renderers 등 기존 패키지 번들 영향 없음

---

## Section 9 — 의존성

### 9.1 dependencies
없음 (Pro 패키지는 가능한 한 lean).

### 9.2 peerDependencies
```json
{
  "react": ">=18.0.0",
  "react-dom": ">=18.0.0",
  "@tanstack/react-table": ">=8.0.0",
  "@tomis/grid-core": "workspace:*",
  "@tomis/grid-license": "workspace:*"
}
```

### 9.3 peerDependenciesMeta
```json
{
  "@tomis/grid-license": { "optional": true }
}
```
(MOD-GRID-99-A 완료 전까지 optional. 완료 후 required로 전환 — ADR-MOD-GRID-13-002 참조.)

### 9.4 devDependencies (기존 monorepo 공유 devDeps 활용)
- `typescript` — tsconfig.base.json 공유
- `tsup` — tsup.config.ts 존재 확인
- `@types/react`, `@types/react-dom`
- `size-limit`, `@size-limit/preset-small-lib`

---

## Section 10 — 사용자 여정 매핑

### 10.1 개발자 관점
1. `pnpm add @tomis/grid-pro-merging` (또는 workspace 참조)
2. 컬럼 정의에 `meta: { mergeRows: true }` 또는 `meta: { mergeRows: (a, b) => a.dept === b.dept }` 추가
3. `<MergingGrid data={rows} columns={columns} enableMerging />` 렌더링
4. 정렬 컬럼 클릭 → 병합이 자동 재계산되어 새 행 순서에 맞게 표시
5. EULA 동의 후 라이선스 키 설정 (MOD-GRID-99-A 완료 후)

### 10.2 최종 사용자 관점
- 같은 부서의 여러 행이 세로로 병합되어 단일 셀로 표시 → 가독성 향상
- 정렬 클릭 시 병합이 즉시 재구성 → 데이터 해석 혼란 없음
- 병합 셀은 나머지 행과 동일한 상호작용(클릭, 선택) 지원

---

## Section 11 — 구현 계획

### 11.1 구현 순서 (5단계)

**Step 1: 패키지 메타 + 라이선스 파일**
- `package.json` MODIFY: peerDeps `@tomis/grid-core`, `@tomis/grid-license` 추가, peerDependenciesMeta 추가
- `EULA.md` NEW: 상용 라이선스 문서 (SEE LICENSE IN EULA)
- `.size-limit.json` NEW: ≤ 20 KB 한도 설정
- `tsconfig.json` MODIFY: 필요 시 소폭 보완 (기존 구조 유지)

**Step 2: types.ts + computeMergeSpans.ts (순수 함수)**
- `src/types.ts` NEW: MergeRowsConfig, MergingColumnDef, MergeSpanMap, MergingGridProps
- `src/computeMergeSpans.ts` NEW: 병합 span 계산 엔진

**Step 3: MergingGrid.tsx + index.ts (렌더러 + exports)**
- `src/MergingGrid.tsx` NEW: MergingGrid 컴포넌트 (computeMergeSpans 호출 + rowSpan 렌더링)
- `src/index.ts` MODIFY: placeholder → 실제 exports

**Step 4: ADR + 검증**
- `decisions/MOD-GRID-13-decisions.md` NEW: ADR-MOD-GRID-13-001, ADR-MOD-GRID-13-002
- `tsc --noEmit` 0 errors 확인
- `tsup build` CJS+ESM 성공 확인
- size-limit 검증

**Step 5: Storybook story 작성 (AC-009)**
- `src/MergingGrid.stories.tsx` NEW: 2 stories export
  - `MergeRowsBoolean`: `mergeRows: true`, dept 컬럼 자동 병합, 5행 샘플 데이터
  - `MergeRowsCompareFn`: `mergeRows: (a, b) => a.dept === b.dept && a.year === b.year`, 복합 조건 병합
- peerDependency `@storybook/react` optional (기존 monorepo devDeps 활용)

### 11.2 Before/After 코드 스니펫

**Before (placeholder index.ts)**:
```typescript
// src/index.ts — 현재 상태
// @tomis/grid-pro-merging — placeholder. 실제 구현은 MOD-GRID-01+ Goals에서.
export {};
```

**After (index.ts — 실제 exports)**:
```typescript
// src/index.ts — G-001 구현 후
export { computeMergeSpans } from './computeMergeSpans';
export { MergingGrid } from './MergingGrid';
export type {
  MergeRowsConfig,
  MergingColumnDef,
  MergeSpanMap,
  MergingGridProps,
} from './types';
```

**computeMergeSpans 핵심 알고리즘 의사코드**:
```typescript
// src/computeMergeSpans.ts
export function computeMergeSpans<TData>(
  rows: TData[],
  columns: Array<{ id: string; mergeRows: MergeRowsConfig<TData> }>
): MergeSpanMap {
  const spanMap: MergeSpanMap = new Map();

  for (const col of columns) {
    const compareFn: (prev: TData, curr: TData) => boolean =
      col.mergeRows === true
        ? (prev, curr) => (prev as Record<string, unknown>)[col.id] === (curr as Record<string, unknown>)[col.id]
        : (col.mergeRows as (prev: TData, curr: TData) => boolean);

    let spanStart = 0;
    let spanCount = 1;

    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1];
      const curr = rows[i];

      if (compareFn(prev, curr)) {
        spanCount++;
        spanMap.set(`${i}_${col.id}`, 0); // skip 셀
      } else {
        spanMap.set(`${spanStart}_${col.id}`, spanCount);
        spanStart = i;
        spanCount = 1;
      }
    }
    // 마지막 그룹 처리
    spanMap.set(`${spanStart}_${col.id}`, spanCount);
  }

  return spanMap;
}
```

**MergingGrid TSX rowSpan 적용 패턴**:
```tsx
// src/MergingGrid.tsx (핵심 발췌)
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import { useMemo } from 'react';
import { computeMergeSpans } from './computeMergeSpans';
import type { MergingGridProps, MergeRowsConfig } from './types';

// grid-license feature-detect 패턴 (D2 결정 — C-4 준수, B-06 준수)
import * as gridLicense from '@tomis/grid-license';
(gridLicense as { verifyGridLicense?: () => void }).verifyGridLicense?.();

export function MergingGrid<TData extends object>(
  props: MergingGridProps<TData>
): React.JSX.Element {
  const { data, columns, enableMerging = false, className } = props;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  // enableMerging=true 시에만 computeMergeSpans 실행
  const mergeColumns = useMemo(() => {
    if (!enableMerging) return [];
    return columns
      .filter((col) => col.meta?.mergeRows !== undefined && col.meta.mergeRows !== false)
      .map((col) => ({
        id: col.id ?? (col as { accessorKey?: string }).accessorKey ?? '',
        mergeRows: col.meta!.mergeRows as MergeRowsConfig<TData>,
      }));
  }, [columns, enableMerging]);

  const spanMap = useMemo(() => {
    if (!enableMerging || mergeColumns.length === 0) return new Map<string, number>();
    return computeMergeSpans(
      rows.map((r) => r.original),
      mergeColumns
    );
  }, [rows, mergeColumns, enableMerging]);

  return (
    <table className={className}>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => {
              const key = `${rowIdx}_${cell.column.id}`;
              const span = spanMap.get(key);
              if (enableMerging && span === 0) return null; // skip 셀
              const rowSpan = enableMerging && span !== undefined && span > 1 ? span : 1;
              return (
                <td key={cell.id} rowSpan={rowSpan}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 11.3 위험 요소

| 위험 | 설명 | 대응 방안 |
|------|------|---------|
| W-1: React key 충돌 | rowSpan + React reconciliation 시 skip 셀 null 반환이 key 배열 길이 불일치 유발 가능 | `row.getVisibleCells()` 배열 필터링 후 key 전략 일관 유지. row.id + cell.id 복합 key 사용 |
| W-2: TanStack 컬럼 순서 misalignment | skip 셀 null 반환 시 td 인덱스가 th 컬럼 순서와 불일치 가능 | rowSpan 적용 셀 외에 skip 셀만 null 반환. DOM td 갯수 = visible cells - skip 셀 수. 헤더는 영향 없음 |
| W-3: grid-license stub | MOD-GRID-99-A 미완료 → import 시 `export {}` stub. feature-detect 패턴으로 no-op 처리 | D2 결정 적용. namespace import `* as gridLicense` + optional-chain 호출 |
| W-4: 가상화와 rowSpan | react-virtual overscan 범위와 rowSpan 경계 불일치 시 클리핑 발생 | G-001 scope에서는 가상화 미포함. G-003에서 C-18 가상화 호환 구현 예정. 문서에 limitation 명시 |

### 11.4 ADR 초안 (decisions/MOD-GRID-13-decisions.md 내용 형식)

#### ADR-MOD-GRID-13-001: API 시그니처 — mergeRows: boolean | compareFn

- **결정**: `MergeRowsConfig<TData> = boolean | ((prev: TData, curr: TData) => boolean)`
- **사유**: boolean은 동일 값(===) 자동 병합의 단순 사용 케이스. 비교 함수는 복합 조건(멀티 필드) 지원. 두 패턴을 합집합 타입으로 단일화.
- **대안 1 (채택)**: `boolean | compareFn` 합집합. — 선언적 + 함수형 모두 지원.
- **대안 2**: `boolean`만 — 단순하지만 복합 조건 불가.
- **대안 3**: `{ mode: 'value' | 'custom'; fn?: compareFn }` 객체 — 더 명시적이나 API 장황.
- **trade-off 1**: boolean 처리 시 기본 비교를 `===`로 정의 → 객체/배열 타입 행에서 오비교 가능. 사용자가 커스텀 fn 제공으로 해결.
- **trade-off 2**: compareFn은 임의 로직 → 오래 걸리는 비교 함수 시 렌더 퍼포먼스 영향. useMemo dependency 관리 주의 권고.
- **결과**: types.ts `MergeRowsConfig<TData>` 타입으로 확정.

#### ADR-MOD-GRID-13-002: grid-license 의존 처리 방침

- **결정**: Option A — namespace import + feature-detect 패턴
- **사유**: MOD-GRID-99-A/G-001 미완료. stub에서 no-op, 실구현 시 자동 활성. C-4 준수 (`@ts-ignore` 금지 — B-06 규정).
- **대안 1 (채택, Option A)**: `import * as gridLicense from '@tomis/grid-license'; (gridLicense as { verifyGridLicense?: () => void }).verifyGridLicense?.();` — stub 안전, 실구현 무수정 호환.
- **대안 2 (Option B)**: 라이선스 호출 생략 — 미채택. Pro 패키지 보안 공백 (C-24 위반).
- **대안 3 (Option C)**: MOD-GRID-99-A 완료 대기 후 진행 — 미채택. 병렬 개발 불가.
- **trade-off 1**: namespace import는 tree-shaking 불리. 단, 라이선스 코드는 tiny → 번들 영향 미미.
- **trade-off 2**: peerDependenciesMeta optional 선언으로 미설치 환경 처리. 실구현 완료 후 required 전환 시 semver major 없음 (peerDeps 강화는 patch/minor 가능).
- **결과**: MergingGrid.tsx 최상단에 feature-detect 패턴 적용.

---

## Section 12 — 검증 계획

### 12.1 단위 테스트 (computeMergeSpans)

| 시나리오 | 입력 | 기대 출력 |
|---------|------|---------|
| TC-001: 빈 배열 | rows=[], columns=[{id:'dept', mergeRows:true}] | 빈 Map |
| TC-002: 모두 다른 값 | rows=[{dept:'A'},{dept:'B'},{dept:'C'}] | 0_dept=1, 1_dept=1, 2_dept=1 |
| TC-003: 전부 동일 값 | rows=[{dept:'A'},{dept:'A'},{dept:'A'}] | 0_dept=3, 1_dept=0, 2_dept=0 |
| TC-004: undefined 값 비교 | rows=[{dept:undefined},{dept:undefined}] | 0_dept=2, 1_dept=0 (undefined===undefined) |

### 12.2 Storybook story

**파일**: `packages/grid-pro-merging/src/MergingGrid.stories.tsx` (Section 7 최종 표 #9 — NEW, AC-009, C-25)

- **Story 1**: `MergeRowsBoolean` — `mergeRows: true`, 부서(dept) 컬럼 자동 병합, 5행 데이터
- **Story 2**: `MergeRowsCompareFn` — `mergeRows: (a, b) => a.dept === b.dept && a.year === b.year`, 복합 조건 병합

### 12.3 빌드 검증
- `tsc --noEmit` 0 errors (`packages/grid-pro-merging`)
- `tsup` build CJS+ESM dual 성공 (`dist/index.cjs`, `dist/index.mjs`)
- `size-limit` ≤ 20 KB gzipped

### 12.4 시각 회귀
migrationImpact: low + 사용처 0 → C-13/C-17 N/A. Storybook 수동 확인으로 대체.

---

## Section 13 — 상용 제품화 영향

### 13.1 패키지 분류
**Pro** (`packages/grid-pro-merging`). `@tomis/grid-pro-merging` npm 패키지.

### 13.2 라이선스
- `package.json`: `"license": "SEE LICENSE IN EULA"` (기존 확인 — 보존)
- `EULA.md`: 신규 생성 (AC-005, C-24 의무)
- 런타임 라이선스 검증: `MergingGrid.tsx` 최상단에 feature-detect 패턴 (ADR-MOD-GRID-13-002 D2 결정)

### 13.3 grid-license 런타임 검증 호출
MOD-GRID-99-A 의존. D2 결정(Option A) 적용:
```typescript
import * as gridLicense from '@tomis/grid-license';
(gridLicense as { verifyGridLicense?: () => void }).verifyGridLicense?.();
```
stub 환경: no-op. 실구현 완료 시 호출부 변경 없이 자동 활성.

### 13.4 Storybook story
- Story 파일: `src/MergingGrid.stories.tsx` (AC-009, C-25)
- Stories export: 2개 (`MergeRowsBoolean`, `MergeRowsCompareFn`)

### 13.5 README.md (명시적 범위 제외)
`packages/grid-pro-merging/README.md` — C-25 공개 API 문서화 의무 항목이나, **본 G-001 implementFiles에서 제외**.
- **사유**: C-25 최소 요건은 "Storybook story 또는 README" 중 하나. Section 7 #9 `MergingGrid.stories.tsx`(AC-009)가 C-25 최소 요건을 충족.
- README.md 전체 작성은 패키지 문서 통합 목표(MOD-GRID-99-B 또는 별도 docs Goal) 범위로 위임.
- G-001 Implementer는 README.md를 **생성하지 않음** (scope out 의도적 결정).

---

## Section 7 최종 implementFiles 표 (C-30 권위 표)

**★ C-28 정정 결정 D1**: goals.json `TOMIS/packages/` → `topvel-grid-monorepo/packages/`로 정정.
**★ D5 결정**: 기존 scaffold 파일 MODIFY 확인 (NEW 아님).
**★ Storybook 파일 추가 (Section 12.2 근거 — E-06 자기 검증)**:

| # | 파일 경로 (monorepo 경로) | 액션 | 설명 |
|---|--------------------------|------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/package.json` | MODIFY | peerDeps @tomis/grid-core, @tomis/grid-license 추가. peerDependenciesMeta optional 추가 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/EULA.md` | NEW | Pro 패키지 EULA (C-24) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/types.ts` | NEW | MergeRowsConfig, MergingColumnDef, MergeSpanMap, MergingGridProps |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/computeMergeSpans.ts` | NEW | 병합 span 계산 순수 함수 엔진 (C-31: MergingGrid.tsx에서 호출 의무) |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/MergingGrid.tsx` | NEW | 렌더러 컴포넌트 + computeMergeSpans 호출 + grid-license feature-detect |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/index.ts` | MODIFY | placeholder → 실제 exports |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/.size-limit.json` | NEW | ≤ 20 KB 한도 (C-21) |
| 8 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/tsconfig.json` | MODIFY | 필요 시 최소 보완 (기존 구조 유지) |
| 9 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/MergingGrid.stories.tsx` | NEW | Storybook story (AC-009, C-25) |
| 10 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-13-decisions.md` | NEW | ADR (C-14. TOMIS 경로 유지) |

**합계**: 10개 파일. NEW 7개 + MODIFY 3개.

**C-30 자기 검증**: Section 11 Step 1~5에서 언급된 모든 파일이 최종 표에 포함됨.
- Step 1: package.json(#1) ✓, EULA.md(#2) ✓, .size-limit.json(#7) ✓, tsconfig.json(#8) ✓
- Step 2: types.ts(#3) ✓, computeMergeSpans.ts(#4) ✓
- Step 3: MergingGrid.tsx(#5) ✓, index.ts(#6) ✓
- Step 4: decisions/MOD-GRID-13-decisions.md(#10) ✓
- Step 5: MergingGrid.stories.tsx(#9) ✓

**E-06 재결정 검증**: 본 spec에서 "재결정" 표현 없음. Section 7 초기 표(9개) vs 최종 표(10개) — Section 12.2에서 Storybook 파일 추가 결정. 최종 표 #9가 반영함. 모순 없음.

**C-31 Functional Wiring Audit**: `computeMergeSpans.ts`(NEW 유틸) → `MergingGrid.tsx`(호출처, #5)에서 import + invoke + spanMap 반영 의무. Section 11.2 MergingGrid.tsx 발췌에서 `computeMergeSpans` 호출 및 `spanMap` 사용 명시됨 ✓.
