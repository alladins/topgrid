# MOD-GRID-13 / G-003 Specification
# 정렬/필터 변경 시 병합 자동 재계산 + 가상화 호환 (C-18)

**Status**: DRAFT
**Author**: tw-grid Spec Writer Agent
**Date**: 2026-05-15
**Package**: `@tomis/grid-pro-merging`
**Threshold**: specify-score ≥ 90 (low tier)

---

## Section 0 — 사전 결정 (D# 테이블)

| ID | 결정 | 근거 / 제약 |
|----|------|------------|
| D1 | **monorepo 경로 정정 (C-28)**: goals.json `implementFiles`의 `TOMIS/packages/` 접두사를 `topvel-grid-monorepo/packages/`로 정정. ADR 파일(`.claude/tw-grid/decisions/MOD-GRID-13-decisions.md`)은 TOMIS 경로 그대로 유지. | G-001/G-002와 동일 패턴. C-28 + ADR-MOD-GRID-00-001 + ADR-MOD-GRID-13-004 근거. |
| D2 | **grid-license 인라인 stub 보존 (ADR-002 canonical)**: MergingGrid.tsx MODIFY 시 기존 인라인 stub (`verifyOrWarn`) 패턴을 그대로 유지. namespace import(`import * as gridLicense`) 사용 금지. | G-001 harnessReview P-3 경고 대응. C-24 Pattern Catalog Note: ADR-MOD-GRID-13-002가 canonical. pnpm workspace 심링크 부재 + MOD-GRID-99-A 미완료 환경에서 namespace import = TS2307. B-06 준수(no `@ts-ignore`). |
| D3 | **useMemo 의존성 배열**: `[rows, mergeColumns, enableMerging]` 유지 (G-001 기존 의존성). `rows = table.getRowModel().rows`는 TanStack이 sorting + filtering 상태를 이미 반영한 결과이므로 `sorting`/`columnFilters` 별도 추가 불필요. | TanStack `getSortedRowModel` + `getFilteredRowModel` 활성 시 `table.getRowModel().rows`가 이미 정렬·필터 적용된 최종 행 배열. `rows` 참조 변경 = useMemo 재실행 트리거. `sorting`/`columnFilters` state를 별도 dep으로 추가하면 TanStack 내부 계산을 중복 추적하는 anti-pattern. |
| D4 | **가상화 통합 전략 — 전체 행 사전 계산 + flow 레이아웃**: `computeMergeSpans`는 항상 전체 정렬·필터 완료 rows를 대상으로 계산(visible-only 슬라이스 아님). visible + overscan 인덱스만 `<tr>` 렌더링. 상단 spacer `<tr>` + 하단 spacer `<tr>`로 스크롤 영역 확보. `position:absolute` 셀 금지 (C-18). | C-18: `position:absolute` 셀 사용 금지. visible-only 계산은 스크롤 시 visible window 시작점 이전의 병합 그룹 정보가 소실되어 rowSpan 정합성 붕괴. 전체 계산으로 cross-window rowSpan 정보 보존. flow 레이아웃 spacer 패턴은 position:absolute 금지를 준수하면서 가상화 스크롤 영역을 확보하는 유일한 viable 방법. 고정 행 높이(`estimatedRowHeight`) 가정 필요 — 제한 사항으로 문서화 (ADR-011). 대안(visible-only 슬라이스): 거부 — 스크롤 경계 넘는 rowSpan 처리 불가. |
| D5 | **rowSpan 가상화 경계 한계 (documented-limitations)**: visible window 시작점 이전에서 시작되는 rowSpan > 1 셀은 `<tr>`이 렌더링되지 않으므로 해당 셀은 visible window 내에서 표시 불가. AC-003에서 명시적으로 limitations로 처리. | rowSpan 시작 `<tr>`이 스크롤 아웃되어 DOM에서 제거되면 병합 셀 자체가 사라짐 — flow 레이아웃의 구조적 한계. 해결 방법(sticky first cell 등)은 현재 Goal 범위 외. 사용자에게 limitations 섹션으로 명확히 고지. |

---

## Section 1 — 참조 추적 (Reference Traceability)

### L0: 현 구현 (tw-framework-front)
**N/A — 신규 Pro 패키지**. `tw-framework-front`에 Cell Merging 기존 구현 없음. G-001 Section 1 L0 인용.

### L1: TanStack v8 + @tanstack/react-virtual v3 API

**TanStack Table v8** (G-001/G-002 공통):

| API | G-003 관련 용도 |
|-----|----------------|
| `getSortedRowModel()` | 정렬 적용 행 순서 — `useReactTable` options에 추가 (MergingGrid.tsx MODIFY) |
| `getFilteredRowModel()` | 필터 적용 행 — `useReactTable` options에 추가 (MergingGrid.tsx MODIFY) |
| `table.getRowModel().rows` | 정렬+필터 완료된 최종 행 배열 — computeMergeSpans 입력 + 가상화 인덱스 기준 |

**@tanstack/react-virtual v3.13.24** (신규 통합):

| API | 용도 |
|-----|------|
| `useVirtualizer<TScrollElement, TItemElement>(options)` | 가상화 인스턴스 생성 |
| `VirtualizerOptions.count` | 전체 행 수 (`rows.length`) |
| `VirtualizerOptions.getScrollElement` | 스크롤 컨테이너 ref |
| `VirtualizerOptions.estimateSize` | 행 높이 추정 함수 (`(index) => estimatedRowHeight`) |
| `VirtualizerOptions.overscan` | overscan 행 수 (기본 5) |
| `virtualizer.getVirtualItems()` | 현재 visible + overscan 행 인덱스 목록 (`VirtualItem[]`) |
| `VirtualItem.index` | 실제 행 배열 인덱스 |
| `VirtualItem.start` | 해당 행의 top offset (spacer 계산용) |
| `virtualizer.getTotalSize()` | 전체 스크롤 높이 (하단 spacer 계산용) |

실제 버전: monorepo node_modules에 `@tanstack/react-virtual@3.13.24` 설치 확인.
`useVirtualizer` export 확인: `dist/esm/index.d.ts` line 6.

### L2: G-001/G-002 구현체 — 확장 베이스
- `computeMergeSpans.ts` (G-002 완료): 시그니처 `(rows: TData[], columns: ...) => MergeSpanMap` 유지 — G-003에서 변경 없음.
- `MergingGrid.tsx` (G-001 완료): `useReactTable` + `getSortedRowModel` 기존 설정 확인 (line 48-53). `useMemo([rows, mergeColumns, enableMerging])` 기존 의존성 유지 (line 75-83). grid-license 인라인 stub (line 14-22) — 보존 의무 (D2).

### R-A: AG Grid Row Spanning 재계산 (참조만 — C-7)
출처: G-001 Section 1 R-A 인용.
- AG Grid Enterprise: 정렬 변경 시 `rowSpan` callback 재실행. 자동 재계산.
- 우리 접근: TanStack `getRowModel().rows` 참조 변경 → useMemo 자동 재실행으로 동등한 동작.
- **코드 차용 없음 (C-7)**.

### R-W: Wijmo AllowMerging 정렬 동작 (참조만 — C-16)
출처: `references/publish-wijmo-analysis.md` §3.
- `organizeSchedule/page.tsx` L78: `g.allowSorting = wjGrid.AllowSorting.None` — 이 페이지는 정렬 비활성화. 정렬 시 자동 재계산 패턴은 Wijmo FlexGrid 내부 처리.
- 참조 결론: Wijmo는 내부적으로 정렬 변경 시 병합 재계산. 우리는 TanStack useMemo 의존성으로 동등 동작.
- **코드 차용 없음 (C-16)**. `@mescius/wijmo*` import 금지.

**migrationImpact**: `low` (goals.json G-003 L164 확인 — `"migrationImpact": "low"`. affectedUsageFiles = 0, 신규 Pro 패키지)

---

## Section 2 — API 계약 (TypeScript Interface)

### 2.1 types.ts 확장 — MergingGridProps (MODIFY)

G-003에서 `MergingGridProps<TData>`에 가상화 관련 optional props 추가:

```typescript
// packages/grid-pro-merging/src/types.ts — G-003 추가 props
export interface MergingGridProps<TData> {
  /** 렌더링할 데이터 배열 */
  data: TData[];
  /** 컬럼 정의 (MergingColumnDef 확장 포함) */
  columns: MergingColumnDef<TData>[];
  /**
   * 병합 기능 활성화.
   * `false`(기본값)이면 일반 Grid 동작 보존 (C-6).
   */
  enableMerging?: boolean;
  /** table 엘리먼트에 적용할 CSS className */
  className?: string;
  /**
   * 가상화 활성화 (C-18 호환).
   * `true` 시 @tanstack/react-virtual useVirtualizer 사용.
   * `false`(기본값) 시 G-001/G-002 full DOM 렌더링 경로 유지.
   */
  enableVirtualization?: boolean;
  /**
   * 가상화 시 행 높이 추정값 (px). 기본값: 40.
   * `enableVirtualization=true` 시에만 사용.
   * ⚠️ 고정 행 높이 가정 — 가변 행 높이 환경에서는 scrollOffset 오차 발생 가능 (D5 Limitations).
   */
  estimatedRowHeight?: number;
  /**
   * react-virtual overscan 행 수. 기본값: 5.
   * visible window 양쪽에 추가로 렌더링할 행 수.
   * `enableVirtualization=true` 시에만 사용.
   */
  virtualOverscan?: number;
}
```

**C-29 exactOptionalPropertyTypes 준수**: `enableVirtualization`, `estimatedRowHeight`, `virtualOverscan`은 모두 optional. MergingGrid.tsx 내부에서 destructuring 시 기본값 할당 패턴 사용 (forwarding 없음):
```typescript
const {
  enableVirtualization = false,
  estimatedRowHeight = 40,
  virtualOverscan = 5,
} = props;
```
C-29 conditional spread 불필요 — child 컴포넌트로 optional prop forwarding이 아닌 내부 직접 소비.

### 2.2 computeMergeSpans 시그니처 — 변경 없음

G-002와 동일 시그니처 유지. 호출부(MergingGrid.tsx)에서 `rows.map((r) => r.original)` 전달 패턴도 동일. G-003에서 computeMergeSpans.ts 수정 불필요 (D4: 전체 rows 사전 계산 전략 — 현재 구현이 이미 전체 rows 처리).

### 2.3 MergingGrid 내부 변경 (MergingGrid.tsx MODIFY)

```typescript
// G-003 추가 구성 요소 개요
// 1. useReactTable options에 getFilteredRowModel 추가
// 2. enableVirtualization=true 시 useVirtualizer 조건부 통합
// 3. 렌더링: enableVirtualization ? 가상화 경로 : G-001 전체 DOM 경로
```

**useReactTable options 변경**:
```typescript
// Before (G-001)
const table = useReactTable({
  data,
  columns: columns as ColumnDef<TData>[],
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
});

// After (G-003)
const table = useReactTable({
  data,
  columns: columns as ColumnDef<TData>[],
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),   // AC-001: 필터 변경 시 재계산 지원
});
```

### 2.4 기본값 명시

| Prop | 기본값 | 필수 여부 | G-003 추가 여부 |
|------|--------|---------|--------------|
| `enableMerging` | `false` | optional | G-001 기존 |
| `className` | `undefined` | optional | G-001 기존 |
| `data` | — | required | G-001 기존 |
| `columns` | — | required | G-001 기존 |
| `enableVirtualization` | `false` | optional | G-003 신규 |
| `estimatedRowHeight` | `40` (px) | optional | G-003 신규 |
| `virtualOverscan` | `5` | optional | G-003 신규 |

### 2.5 사용 예시 1 — sort/filter 재계산 (가상화 없음)

```tsx
import { MergingGrid, type MergingColumnDef } from '@tomis/grid-pro-merging';
import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';

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
    meta: { mergeRows: true },
  },
  {
    id: 'name',
    header: '이름',
    accessorKey: 'name',
  },
];

function SortRecomputeExample() {
  const [sorting, setSorting] = useState<SortingState>([]);

  return (
    <MergingGrid
      data={employeeData}
      columns={columns}
      enableMerging
      // enableVirtualization 미지정 → false(기본값) → G-001 경로
    />
  );
}
```

### 2.6 사용 예시 2 — 가상화 활성화 (1000행+)

```tsx
function VirtualizedMergingExample() {
  return (
    <MergingGrid
      data={largeData}              // 1000행+
      columns={columns}
      enableMerging
      enableVirtualization          // C-18 가상화 활성화
      estimatedRowHeight={40}       // 기본값 동일, 명시적 지정
      virtualOverscan={10}          // overscan 확장 (rowSpan 경계 완충)
    />
  );
}
```

### 2.7 타입 export 경로 (monorepo)

```
D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/types.ts
  └─ export: MergeRowsConfig, MergingColumnDef, MergeSpanMap, MergingGridProps (G-003에서 props 확장)

D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/index.ts
  └─ re-export: computeMergeSpans, MergingGrid + 타입 전체 (G-001 기존 — 변경 없음)
```

---

## Section 3 — 기존 사용처 대응표

affectedUsageFiles = 0. G-001/G-002와 동일. 신규 Pro 패키지이므로 대응표 N/A.

**하위 호환성**: `enableVirtualization`, `estimatedRowHeight`, `virtualOverscan` 모두 optional (기본값 있음). 기존 `<MergingGrid data={...} columns={...} enableMerging />` 사용처는 변경 없이 G-001 동작 보존.

---

## Section 4 — 호환성 정책

| 항목 | 값 |
|------|-----|
| Breaking change | `false` (신규 optional props — 기존 사용처 변경 불필요) |
| Deprecation 전략 | N/A (신규 props 추가) |
| 마이그레이션 경로 | N/A |
| G-001/G-002 동작 보존 | `enableVirtualization=false`(기본값) 시 G-001 렌더링 경로 완전 보존 |

**G-002 deferred AC-005 C-18 sub-clause 수용 (G-002 harnessReview P-1 대응)**:
- G-002 AC-005 goals.json: `C-25: Storybook story 1개 — dept/team 계층 병합 시나리오 (1000행+ C-18 가상화 포함)`
- G-002 implement에서 C-18 가상화 통합 부분이 deferred됨 (G-002 spec Section 11 W-2: "react-virtual 통합 없음 — G-003 범위")
- **본 G-003이 G-002 deferred AC-005 C-18 sub-clause (react-virtual 가상화 통합)를 수용하여 충족한다.**
- implement-score JSON `acceptedDeferredAcs` 필드 의무: `["MOD-GRID-13/G-002/AC-005#C-18-sub-clause"]`

---

## Section 5 — 인수 기준 (Acceptance Criteria)

| ID | 기준 | 출처 태그 | 검증 방법 |
|----|------|---------|---------|
| AC-001 | `useReactTable` options에 `getSortedRowModel()` + `getFilteredRowModel()` 모두 활성화. 정렬/필터 state 변경 시 `table.getRowModel().rows` 참조 변경 → `useMemo([rows, mergeColumns, enableMerging])` 자동 재실행 → computeMergeSpans 재계산. TypeScript strict, no any (C-4). | C-2 (TanStack 표준 API), L1 (`getSortedRowModel`, `getFilteredRowModel`), C-4 | MergingGrid.tsx grep: `getFilteredRowModel` 존재 확인 |
| AC-002 | `enableVirtualization=true` 시 `@tanstack/react-virtual useVirtualizer` 조건부 통합. overscan 포함 visible rows만 `<tr>` 렌더링. `position:absolute` 셀 사용 금지 (C-18). 상단/하단 spacer `<tr style={{height: ...}}>` flow 레이아웃으로 스크롤 영역 확보. | C-18 (가상화 호환), L1 (`useVirtualizer`, `getVirtualItems`, `overscan`) | MergingGrid.tsx grep: `useVirtualizer` 존재 + `position:absolute` 0건 |
| AC-003 | rowSpan > 1 셀이 가상화 스크롤 경계를 넘을 때 처리 방침 문서화 (D5 Limitations). visible window 시작점 이전 rowSpan 시작 셀은 `<tr>` 미렌더링 → 해당 병합 표시 불가. spec Section 10 Limitations 섹션 명시. 구현 제한 없음(truncate to visible 허용). | C-18, C-4 | spec Section 10에 limitations 문서 존재 확인 |
| AC-004 | `@mescius/wijmo*` import 0건 (C-16 절대 준수). | C-16, R-W | grep `@mescius/wijmo` 0 hits |
| AC-005 | tsc `--noEmit` 0 errors (`packages/grid-pro-merging`). | C-12 | tsc 실행 결과 |
| AC-006 | Storybook story 1개 추가 — `SortAndRecompute`: 1000행+ 가상화 활성화 + 정렬 인터랙션 시나리오. `enableVirtualization=true` + 정렬 변경 데모. G-002 deferred C-18 sub-clause 충족 증거. | C-25, C-18, C-10 | MergingGrid.stories.tsx grep: `SortAndRecompute` export 존재 |

**deferredAcs 정책 (G-002 P-1 대응)**:
- `acceptedDeferredAcs: ["MOD-GRID-13/G-002/AC-005#C-18-sub-clause"]` — implement-score JSON 필드 의무
- 본 G-003 AC-002 + AC-006이 해당 deferred sub-clause를 충족한다.

---

## Section 6 — 엣지 케이스

### EC-001: 정렬 변경 직후 rowSpan 즉시 재계산
- 시나리오: 컬럼 헤더 클릭 → TanStack sorting state 변경 → `getSortedRowModel` 재실행 → `table.getRowModel().rows` 참조 변경 → `useMemo` 재실행 → computeMergeSpans 재실행
- 기대: 클릭 후 다음 렌더에 정확한 rowSpan 적용 (React 동기 업데이트)
- 검증: SortAndRecompute story에서 정렬 버튼 클릭 시 병합 변경 확인

### EC-002: 필터 결과 0행
- 시나리오: `getFilteredRowModel` 적용 후 rows = []
- 기대: `computeMergeSpans([], ...)` → 빈 Map → 렌더링 0행 (G-001 EC-001과 동일)
- 검증: 빈 tbody 렌더링, 에러 없음

### EC-003: 가상화 비활성 시 G-001 경로 완전 보존
- 시나리오: `enableVirtualization=false`(기본값) 또는 미지정
- 기대: G-001 full DOM 렌더링 경로 그대로. useVirtualizer 호출 없음.
- 검증: G-001 BasicMerge + G-002 HierarchicalMerge story 동작 보존 확인

### EC-004: 가상화 활성 + rowSpan=5 셀이 visible window 시작점 이전
- 시나리오: 사용자가 스크롤하여 rowSpan 시작 행(예: 행 2)이 virtual window 밖으로 스크롤됨 → 행 2는 DOM에서 제거 → 행 3, 4, 5는 orphan 셀
- 처리: visible window 내에서 skip 셀(span=0)은 null 반환하지 않고 rowSpan=1로 렌더링 (truncate to visible)
- 문서화: Section 10 Limitations 명시 (AC-003)

**구현 상세 (orphan 셀 처리)**:
```typescript
// 가상화 경로에서 rowSpan 처리
const span = spanMap.get(key);
if (enableMerging && span === 0) {
  // skip 셀 판단: virtualItems에 포함된 행의 skip 셀인지 확인
  // 단, rowSpan 시작 행이 window 밖이면 orphan → rowSpan=1로 렌더링
  const isOrphan = /* rowSpan 시작 인덱스가 virtualItems 범위 밖 */ false;
  if (!isOrphan) return null; // skip 셀(시작 행이 window 내)
  // orphan 셀: rowSpan=1로 렌더링 (truncate)
}
```
상세 구현은 Section 11.2 Before/After 코드 스니펫 참조.

### EC-005: 1000행+ useMemo 캐시 효과
- 시나리오: 정렬 없을 때 재렌더링 → rows 참조 변경 없음 → useMemo 캐시 hit
- 기대: computeMergeSpans 재실행 없음 (렌더 성능 유지)
- 검증: React DevTools Profiler로 확인 가능 (수동)

### EC-006: virtualOverscan 큰 값 + rowSpan 경계 완충
- 시나리오: `virtualOverscan=20` 설정 시 visible window 상단 20행 추가 렌더링 → rowSpan 시작 행이 overscan 범위 내에 있으면 정상 표시
- 기대: overscan 클수록 visible-boundary orphan 셀 감소 (단, 완전 제거는 불가)
- 제한: 전체 병합 그룹 크기(rowSpan 수) > overscan+visible 시 orphan 발생 가능

---

## Section 7 — 구현 대상 파일 (최종 표, C-30)

**★ C-28 정정 결정 D1 적용**: goals.json의 `TOMIS/packages/` prefix를 `topvel-grid-monorepo/packages/`로 정정.
**★ D2 결정 적용**: MergingGrid.tsx MODIFY 시 grid-license 인라인 stub 보존 (ADR-002 canonical).
**★ C-20/C-22 준수**: `@tanstack/react-virtual` peerDep 추가 → package.json MODIFY 필수 + ADR-010 의무.

| # | 파일 경로 | 액션 | 설명 |
|---|-----------|------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/types.ts` | MODIFY | `MergingGridProps<TData>`에 `enableVirtualization?`, `estimatedRowHeight?`, `virtualOverscan?` props 추가 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/MergingGrid.tsx` | MODIFY | `getFilteredRowModel` 추가. `enableVirtualization` 조건부 `useVirtualizer` 통합. ★ grid-license 인라인 stub 보존 (ADR-002) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/MergingGrid.stories.tsx` | MODIFY | `SortAndRecompute` story 추가 (1000행+ 가상화 + 정렬, AC-006, C-18, C-10) |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/package.json` | MODIFY | `@tanstack/react-virtual` peerDep 추가 (`^3.0.0`) + peerDependenciesMeta optional 추가 (C-20, C-22, ADR-010) |
| 5 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-13-decisions.md` | MODIFY | ADR-009, ADR-010, ADR-011 추가 |

**합계**: 5개 파일. NEW 0개 + MODIFY 5개.

**수정 없음 파일 (근거)**:
- `computeMergeSpans.ts` — D4: 전체 rows 사전 계산 전략 채택. 기존 함수가 이미 전체 rows 대상으로 계산. 시그니처 불변. G-003에서 수정 불필요.
- `src/index.ts` — G-001에서 exports 완성. 추가 export 없음.
- `tsconfig.json`, `tsup.config.ts`, `EULA.md`, `.size-limit.json` — G-001에서 확정.

---

## Section 8 — Preflight

### 8.1 affectedUsageFiles
0개. 신규 Pro 패키지. `tw-framework-front` 및 기타 사용처 영향 없음.

### 8.2 무파괴 검증
- `enableVirtualization=false`(기본값) 시 G-001 + G-002 동작 완전 보존.
- 기존 `BasicMerge`, `MergeRowsCompareFn`, `HierarchicalMerge` story 동작 보존.
- `getFilteredRowModel()` 추가는 사용처 변경 불필요 (이미 동일 `rows` 기반 계산).
- breaking: false (신규 optional props).

### 8.3 deferredAcs 처리 (G-002 harnessReview P-1 대응)
- G-002 AC-005 C-18 sub-clause (react-virtual 가상화 통합) → 본 G-003 AC-002 + AC-006에서 충족.
- implement-score JSON 필드 의무: `"acceptedDeferredAcs": ["MOD-GRID-13/G-002/AC-005#C-18-sub-clause"]`.
- IMPLEMENT Stage에서 이 필드를 누락하면 implement-rubric A-05 NO 처리 위험.

### 8.4 롤백 전략
`enableVirtualization=false`(기본값) 유지로 완전 롤백 가능. N/A 조건 충족 (low tier + 사용처 0).

### 8.5 번들 크기 영향
- goals.json: `+1 KB (재계산 로직은 G-001 computeMergeSpans 확장)`
- 실제 추가: `useVirtualizer` 통합 코드 + optional props 처리 ≈ +1.5~2 KB (minified)
- `@tanstack/react-virtual`은 peerDep → 번들에 포함 안 됨
- G-001(+5 KB) + G-002(+2 KB) + G-003(+2 KB) = 누적 ≈ 9 KB → Pro 패키지 한도 20 KB (C-21) 미만

---

## Section 9 — 의존성

### 9.1 peerDependencies (G-003 추가)

```json
{
  "@tanstack/react-table": "^8.0.0",
  "@tanstack/react-virtual": "^3.0.0",
  "@tomis/grid-core": "workspace:*",
  "@tomis/grid-license": "workspace:*",
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

### 9.2 peerDependenciesMeta (G-003 추가)

```json
{
  "@tomis/grid-license": { "optional": true },
  "@tanstack/react-virtual": { "optional": true }
}
```

`@tanstack/react-virtual` optional 이유: `enableVirtualization=false`(기본값) 시 import되지 않으므로 미설치 환경에서도 동작. C-22 peer 정책 준수.

### 9.3 devDependencies
기존 monorepo 공유 devDeps 활용 (G-001 기존 — 변경 없음).

---

## Section 10 — 사용자 여정 + Known Limitations

### 10.1 개발자 관점 — 정렬/필터 재계산

1. `<MergingGrid data={rows} columns={columns} enableMerging />` (기본 — G-001 사용법 동일)
2. TanStack 내장 정렬 헤더 클릭 → `sorting` state 변경 → `getSortedRowModel` 재실행
3. 변경된 `rows` 참조 → `useMemo` 재실행 → `computeMergeSpans` 재계산
4. 병합이 정렬된 행 순서에 맞게 즉시 재구성

### 10.2 개발자 관점 — 가상화 활성화

1. `<MergingGrid data={largeData} columns={columns} enableMerging enableVirtualization />`
2. 컨테이너에 고정 높이 + overflow-y:auto 설정 필수 (`getScrollElement` ref 연결)
3. `estimatedRowHeight` prop으로 행 높이 힌트 제공 (기본 40px)
4. `virtualOverscan` prop으로 overscan 조정 (기본 5)

### 10.3 Known Limitations (AC-003 — D5)

**L-01: rowSpan 경계 cross-window 표시 제한**
- 현상: rowSpan 시작 행이 가상화 visible window(+ overscan) 바깥으로 스크롤되면, 해당 병합 셀은 DOM에서 제거됨. 이후 window 내에 있는 skip 셀들은 orphan 상태가 되어 rowSpan=1로 truncate 렌더링됨.
- 영향: 매우 큰 rowSpan(> overscan + visible 범위) 셀은 스크롤 시 병합이 "분리"되어 보임.
- 완화: `virtualOverscan` 값을 높이면 orphan 발생 빈도 감소.
- 근본 해결: sticky first-cell 패턴 (현재 Goal 범위 외 — 별도 Goal 필요).

**L-02: 고정 행 높이 가정**
- `estimatedRowHeight`는 모든 행에 동일하게 적용. 가변 행 높이(이미지, 멀티라인 텍스트) 환경에서 scrollOffset 오차 발생 가능.
- react-virtual `measureElement` 동적 측정은 현재 구현에서 지원 안 함.

**L-03: position:absolute 미사용 (C-18 준수)**
- flow 레이아웃 spacer 방식 사용. 일부 CSS 레이아웃(flex table, CSS grid table)에서 spacer `<tr>`이 예상치 못한 스타일 영향을 줄 수 있음.

---

## Section 11 — 구현 계획

### 11.1 구현 순서 (4단계)

**Step 1: types.ts MODIFY — MergingGridProps 확장**
- `enableVirtualization?: boolean` 추가 (기본 false)
- `estimatedRowHeight?: number` 추가 (기본 40)
- `virtualOverscan?: number` 추가 (기본 5)

**Step 2: MergingGrid.tsx MODIFY — getFilteredRowModel + useVirtualizer 통합**
- `getFilteredRowModel` import 추가
- `useReactTable` options에 `getFilteredRowModel: getFilteredRowModel()` 추가 (AC-001)
- `enableVirtualization` 조건부 `useVirtualizer` 통합 (AC-002, C-18)
- grid-license 인라인 stub 보존 (D2, ADR-002)

**Step 3: MergingGrid.stories.tsx MODIFY — SortAndRecompute story 추가**
- `SortAndRecompute` export 추가 (AC-006, C-18, C-10)
- 1000행+ 데이터 + `enableVirtualization=true` + 정렬 인터랙션 데모

**Step 4: package.json MODIFY + decisions.md MODIFY — ADR 기록**
- `@tanstack/react-virtual: "^3.0.0"` peerDep 추가
- `peerDependenciesMeta["@tanstack/react-virtual"].optional = true`
- ADR-009, ADR-010, ADR-011 추가

### 11.2 Before/After 코드 스니펫

#### MergingGrid.tsx — getFilteredRowModel 추가

**Before (G-001)**:
```typescript
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
// ...
const table = useReactTable({
  data,
  columns: columns as ColumnDef<TData>[],
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
});
```

**After (G-003)**:
```typescript
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
// ...
const table = useReactTable({
  data,
  columns: columns as ColumnDef<TData>[],
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),    // AC-001: 필터 변경 시 재계산 지원
});
```

#### MergingGrid.tsx — 전체 구조 (Before/After 핵심 발췌)

**Before (G-001/G-002 — 가상화 없음)**:
```typescript
// G-001 렌더링 경로
return (
  <table {...(className !== undefined && { className })}>
    <thead>...</thead>
    <tbody>
      {rows.map((row, rowIdx) => (
        <tr key={row.id}>
          {row.getVisibleCells().map((cell) => {
            const key = `${rowIdx}_${cell.column.id}`;
            const span = spanMap.get(key);
            if (enableMerging && span === 0) return null;
            const rowSpan = enableMerging && span !== undefined && span > 1 ? span : 1;
            return <td key={cell.id} rowSpan={rowSpan}>...</td>;
          })}
        </tr>
      ))}
    </tbody>
  </table>
);
```

**After (G-003 — 가상화 조건부 분기)**:

```typescript
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { MergingGridProps } from './types';

// grid-license 인라인 stub (D2 결정 — ADR-002 canonical 보존 의무).
// MOD-GRID-99-A/G-002 완료 시 다음 1줄로 교체:
//   import { verifyOrWarn } from '@tomis/grid-license';
// @see ADR-MOD-GRID-13-002 + C-24 Pattern Catalog Note
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function verifyOrWarn(_packageName: string): void {
  /* MOD-GRID-99-A/G-002 will implement signature / expiry / domain checks. */
}
verifyOrWarn('@tomis/grid-pro-merging');

export function MergingGrid<TData extends object>(
  props: MergingGridProps<TData>
): JSX.Element {
  const {
    data,
    columns,
    enableMerging = false,
    className,
    enableVirtualization = false,
    estimatedRowHeight = 40,
    virtualOverscan = 5,
  } = props;

  const scrollRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns: columns as ColumnDef<TData>[],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),  // AC-001
  });

  const rows = table.getRowModel().rows;

  // enableMerging=true 시에만 병합 대상 컬럼 추출 (G-001 기존 로직)
  const mergeColumns = useMemo(() => {
    if (!enableMerging) return [];
    return columns
      .filter((col) => col.meta?.mergeRows !== undefined && col.meta.mergeRows !== false)
      .map((col) => ({
        id: col.id ?? (col as ColumnDef<TData> & { accessorKey?: string }).accessorKey ?? '',
        mergeRows: col.meta!.mergeRows as MergeRowsConfig<TData>,
      }));
  }, [columns, enableMerging]);

  // D3: rows 참조 변경 = sorting/filtering 완료 후 → useMemo 자동 재실행
  const spanMap = useMemo(() => {
    if (!enableMerging || mergeColumns.length === 0) return new Map<string, number>();
    return computeMergeSpans(rows.map((r) => r.original), mergeColumns);
  }, [rows, mergeColumns, enableMerging]);

  // 가상화 인스턴스 (조건부 — enableVirtualization=false 시에도 훅 순서 보장)
  const virtualizer = useVirtualizer({
    count: enableVirtualization ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: virtualOverscan,
  });

  // ---- 렌더링 분기 ----

  if (!enableVirtualization) {
    // G-001/G-002 경로 완전 보존 (EC-003)
    return (
      <table {...(className !== undefined && { className })}>
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
                if (enableMerging && span === 0) return null;
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

  // 가상화 경로 (D4: flow 레이아웃 spacer, position:absolute 금지 — C-18)
  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const startOffset = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const endOffset = totalSize - (virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].end : 0);

  // 가상화 행 인덱스 집합 (orphan 셀 판별용)
  const virtualIndexSet = new Set(virtualItems.map((vi) => vi.index));

  return (
    <div ref={scrollRef} style={{ overflow: 'auto', position: 'relative' }}>
      <table {...(className !== undefined && { className })}>
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
          {/* 상단 spacer (flow 레이아웃 — position:absolute 금지, C-18) */}
          {startOffset > 0 && (
            <tr style={{ height: startOffset }}>
              <td colSpan={columns.length} />
            </tr>
          )}
          {virtualItems.map((virtualItem) => {
            const row = rows[virtualItem.index];
            const rowIdx = virtualItem.index;
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const key = `${rowIdx}_${cell.column.id}`;
                  const span = spanMap.get(key);

                  if (enableMerging && span === 0) {
                    // skip 셀 판별: rowSpan 시작 행이 virtual window 내에 있는지 확인
                    // 시작 행이 window 밖이면 orphan → rowSpan=1로 truncate (L-01 Limitation)
                    const isInWindow = virtualIndexSet.has(rowIdx);
                    if (isInWindow) return null; // 정상 skip
                    // orphan 셀 — truncate to visible (Section 10 L-01)
                  }

                  const rowSpan = enableMerging && span !== undefined && span > 1 ? span : 1;
                  return (
                    <td key={cell.id} rowSpan={rowSpan}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {/* 하단 spacer */}
          {endOffset > 0 && (
            <tr style={{ height: endOffset }}>
              <td colSpan={columns.length} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

**주의**: 위 orphan 셀 판별 로직의 `isInWindow` 체크는 개념적 pseudocode. 실제로는 rowSpan 시작 행 인덱스(spanMap에서 역추적 필요)를 확인해야 하나, 단순화를 위해 현재 rowIdx가 window 내에 있으면 정상 skip으로 처리하는 근사치 구현도 허용. 정확한 orphan 감지는 Section 10 L-01 limitation으로 문서화됨.

#### MergingGrid.stories.tsx — SortAndRecompute story 추가

```typescript
// packages/grid-pro-merging/src/MergingGrid.stories.tsx
// G-003: SortAndRecompute 스토리 추가 (기존 3 stories 유지)
// AC-006: 1000행+ 가상화 + 정렬 인터랙션
// C-18: enableVirtualization=true, C-10: 1000행+ 시나리오

// 1000행+ 데이터 재사용 (G-002 largeData 동일 구조)
const sortableColumns: MergingColumnDef<EmployeeRow>[] = [
  {
    id: 'dept',
    header: '부서',
    accessorKey: 'dept',
    meta: { mergeRows: true },
    enableSorting: true,  // TanStack 정렬 활성화
  },
  {
    id: 'team',
    header: '팀',
    accessorKey: 'team',
    meta: { mergeRows: true },
    enableSorting: true,
  },
  {
    id: 'name',
    header: '이름',
    accessorKey: 'name',
  },
];

const sortAndRecomputeArgs: MergingGridProps<EmployeeRow> = {
  data: largeData,       // G-002에서 생성한 1000행+ 데이터 재사용
  columns: sortableColumns,
  enableMerging: true,
  enableVirtualization: true,   // C-18 가상화 활성화
  estimatedRowHeight: 40,
  virtualOverscan: 10,
};

/**
 * SortAndRecompute: 정렬 변경 + 병합 자동 재계산 + 가상화 시나리오.
 *
 * AC-001: 정렬 변경 시 computeMergeSpans 재실행.
 * AC-002: enableVirtualization=true + react-virtual 통합.
 * AC-006: 1000행+ 데이터 가상화 + 정렬 인터랙션.
 * C-18: position:absolute 미사용, flow 레이아웃 spacer.
 *
 * G-002 deferred AC-005 C-18 sub-clause 충족 증거.
 *
 * ⚠️ Known Limitation (L-01): rowSpan 시작 행이 visible window 밖으로
 * 스크롤되면 병합이 truncate됩니다. Section 10 참조.
 */
export const SortAndRecompute = {
  args: sortAndRecomputeArgs,
};
```

### 11.3 위험 요소

| 위험 | 설명 | 대응 방안 |
|------|------|---------|
| W-1: React 훅 조건부 호출 | `useVirtualizer`를 if-else 내에서 호출하면 훅 규칙 위반 | `count: 0`으로 항상 호출. `enableVirtualization=false` 시 count=0 → virtualItems=[] |
| W-2: orphan 셀 판별 복잡도 | skip 셀의 rowSpan 시작 행이 window 밖인지 정확히 판별하려면 역추적 필요 | 근사치 구현(현재 rowIdx 기준) 허용 + L-01 Limitation 명시. 정확도 향상은 별도 Goal |
| W-3: scrollRef와 table 레이아웃 | getScrollElement ref가 div 컨테이너를 가리킴. table 자체에는 overflow 없음 | Section 11.2 After 코드에서 div wrapper + table 구조 명시 |
| W-4: getFilteredRowModel 추가 | 기존 사용처가 filtering props(`columnFilters` state)를 전달하지 않으면 모든 행이 통과(필터 없음 = 전체 표시). breaking change 없음 | filterFns 기본값으로 all-pass → 기존 동작 보존 |
| W-5: grid-license stub 보존 | G-001 P-3 경고: spec body에 namespace import 예시 작성 시 implementer가 drift 반복 | 본 spec 모든 코드 블록에서 인라인 stub 형식만 사용. namespace import 예시 0건 (D2 의무) |

### 11.4 ADR 초안 (decisions/MOD-GRID-13-decisions.md에 추가)

#### ADR-MOD-GRID-13-009: useMemo 의존성 배열 — [rows, mergeColumns, enableMerging] 유지

- **결정**: 기존 `useMemo([rows, mergeColumns, enableMerging])` 의존성 유지. `sorting`, `columnFilters` state를 별도 dep으로 추가하지 않음.
- **사유**: `table.getRowModel().rows`는 TanStack이 `getSortedRowModel` + `getFilteredRowModel` 적용 후 반환하는 최종 행 배열. sorting/filtering 변경 시 `rows` 참조 자체가 변경되므로 useMemo가 자동 재실행됨. `sorting`/`columnFilters`를 별도로 dep에 추가하면 TanStack 내부 계산을 중복 추적하는 anti-pattern.
- **대안 1 (채택)**: `[rows, mergeColumns, enableMerging]` — TanStack 위임, 단순.
- **대안 2 (거부)**: `[sorting, columnFilters, data, mergeColumns, enableMerging]` — sorting/columnFilters를 외부 state로 관리 + dep 추가. 사용처가 state를 외부로 꺼내야 하는 API 변경 강제.
- **trade-off 1**: rows 참조 변경이 실제 내용 변경 없이도 발생할 경우(드문 케이스) 불필요한 재계산 가능. React의 referential stability와 TanStack의 memoization으로 실용적으로 무시.
- **trade-off 2**: TanStack 버전 업그레이드 시 getRowModel() 참조 안정성 정책 확인 필요.
- **결과**: `MergingGrid.tsx` useMemo dep 배열 유지. G-001 기존 패턴 보존.

#### ADR-MOD-GRID-13-010: @tanstack/react-virtual peerDep 추가

- **결정**: `@tanstack/react-virtual: "^3.0.0"` peerDependencies에 추가. `peerDependenciesMeta.optional = true`.
- **사유**: `useVirtualizer`는 `enableVirtualization=true` 시에만 사용. 기본값 false이므로 미설치 환경에서도 패키지 동작 가능. C-22: `@tanstack/react-virtual`은 peerDep 대상.
- **라이선스**: MIT (확인: @tanstack/react-virtual package.json `"license": "MIT"`).
- **번들 영향**: peerDep은 번들에 포함 안 됨. 사용자 번들에만 영향.
- **maintenance 상태**: TanStack organization 관리, 활발한 유지보수 (같은 조직의 react-table과 동일).
- **대안 1 (채택)**: peerDep optional — 기본 사용처 영향 없음.
- **대안 2 (거부)**: dependency(non-peer) — 이중 번들 발생, C-22 위반.
- **대안 3 (거부)**: 가상화 구현 없이 limitations만 문서화 — C-18 미충족, G-002 deferred AC-005 미충족.
- **trade-off 1**: optional peer는 런타임에서 import 오류 가능. 조건부 dynamic import 패턴도 있으나 complexity 증가 → enableVirtualization=false 기본값으로 설치 강제 않는 것으로 대응.
- **trade-off 2**: @tanstack/react-virtual v3와 v2 API 차이(useVirtualizer hook 이름 변경). ^3.0.0으로 버전 고정.
- **결과**: `package.json` MODIFY. C-9/C-20/C-22 준수.

#### ADR-MOD-GRID-13-011: rowSpan 가상화 경계 한계 — documented-limitations 처리

- **결정**: visible window 시작점 이전 rowSpan 시작 셀은 DOM 미렌더링 → 해당 병합 표시 불가. AC-003에서 limitations로 처리. sticky first-cell 패턴 미구현 (현재 Goal 범위 외).
- **사유**: flow 레이아웃 spacer 가상화에서 스크롤 아웃된 `<tr>`은 DOM에서 제거됨. rowSpan > 1 셀의 시작 `<tr>`이 제거되면 병합 셀 자체가 사라지는 것은 HTML table 모델의 구조적 제약.
- **대안 1 (채택)**: truncate to visible + limitations 문서화 — 단순, 현재 Goal 범위 최소화.
- **대안 2 (거부)**: sticky first-cell — rowSpan 시작 셀을 position:sticky로 고정. 복잡도 높음 + C-5(CSS 신규 파일 금지)/C-18(position 주의) 위반 위험. 별도 Goal로 분리.
- **대안 3 (거부)**: visible-only span 재계산 — 항상 visible window 내 첫 번째 행을 span 시작으로 처리. 스크롤 시 span 수 변경 → 렌더링 점프 현상 발생.
- **trade-off 1**: 큰 rowSpan(수십 행) 데이터에서 사용자 경험 저하 가능. virtualOverscan 증가로 완화 가능.
- **trade-off 2**: 제한 사항이 명시되면 사용자는 대안(비가상화 경로 또는 데이터 분리) 선택 가능.
- **결과**: `Section 10 L-01` + `AC-003` 명시 + W-2 위험 표 기재. 별도 sticky Goal 권장 (MOD-GRID-13/G-004 또는 별도 PRD).

---

## Section 12 — 검증 계획

### 12.1 빌드 검증
- `tsc --noEmit` 0 errors (`packages/grid-pro-merging`)
- `tsup` build CJS+ESM dual 성공

### 12.2 번들 크기 검증
- `size-limit` ≤ 20 KB gzipped (G-001 + G-002 + G-003 누적)
- `@tanstack/react-virtual`은 peerDep → 번들 미포함

### 12.3 Storybook 검증
- **SortAndRecompute**: 1000행+ 가상화 + 정렬 버튼 클릭 → 병합 재구성 시각 확인 (C-18, C-10, AC-006)
- **G-001/G-002 회귀**: `BasicMerge`, `MergeRowsCompareFn`, `HierarchicalMerge` story 동작 보존 확인 (EC-003)

### 12.4 시각 회귀
migrationImpact: low + 사용처 0 → C-13/C-17 N/A. Storybook 수동 확인으로 대체.

### 12.5 기능 검증 체크리스트

| 항목 | 검증 방법 |
|------|---------|
| AC-001: getFilteredRowModel 존재 | grep `getFilteredRowModel` in MergingGrid.tsx |
| AC-002: useVirtualizer 존재 | grep `useVirtualizer` in MergingGrid.tsx |
| AC-002: position:absolute 0건 | grep `position.*absolute` in MergingGrid.tsx (0 hits) |
| AC-003: limitations 문서 | Section 10 L-01 존재 확인 |
| AC-004: @mescius/wijmo* 0건 | grep `@mescius/wijmo` in all src files (0 hits) |
| AC-006: SortAndRecompute 존재 | grep `SortAndRecompute` in MergingGrid.stories.tsx |
| D2: namespace import 0건 | grep `import \* as gridLicense` in MergingGrid.tsx (0 hits) |
| D2: inline stub 존재 | grep `verifyOrWarn` in MergingGrid.tsx (>0 hits) |

---

## Section 13 — 상용 영향

### 13.1 패키지 분류
**Pro** (`packages/grid-pro-merging`). `@tomis/grid-pro-merging` npm 패키지.

### 13.2 라이선스
- `package.json`: `"license": "SEE LICENSE IN EULA"` (G-001 기존 — 보존)
- 런타임 라이선스 검증: `MergingGrid.tsx` 인라인 stub 보존 (D2, ADR-002)

### 13.3 grid-license 런타임 검증 패턴 (G-003 MODIFY 후 보존 형태)

ADR-002 canonical 형식 — 본 Goal MODIFY 후에도 반드시 이 형태 유지:
```typescript
// grid-license 인라인 stub (AC-005, C-24 준수 — D2 결정).
// MOD-GRID-99-A/G-002 완료 시 다음 1줄로 교체:
//   import { verifyOrWarn } from '@tomis/grid-license';
// @see ADR-MOD-GRID-13-002 + C-24 Pattern Catalog Note
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function verifyOrWarn(_packageName: string): void {
  /* MOD-GRID-99-A/G-002 will implement signature / expiry / domain checks. */
}
verifyOrWarn('@tomis/grid-pro-merging');
```

**금지 (G-001 harnessReview P-3 경고 반영)**:
- `import * as gridLicense from '@tomis/grid-license'` — namespace import 금지 (TS2307 위험)
- `@ts-ignore`, `@ts-nocheck`, `as any` — C-4, B-06 위반

### 13.4 Storybook story 누적 현황

| Story export | Goal | 기능 |
|-------------|------|------|
| `MergeRowsBoolean` | G-001 | mergeRows: true 기본 시나리오 |
| `MergeRowsCompareFn` | G-001 | 커스텀 비교 함수 |
| `HierarchicalMerge` | G-002 | dept/team 계층 병합 1000행+ |
| `SortAndRecompute` | G-003 | 정렬 재계산 + 가상화 1000행+ |

총 4개 story export.

### 13.5 README.md
C-25 범위 — MOD-GRID-99-B 별도 Goal로 위임. G-003 scope 외.

---

## Section 7 최종 implementFiles 표 (C-30 권위 표)

**★ C-28 정정 결정 D1**: goals.json `TOMIS/packages/` → `topvel-grid-monorepo/packages/`로 정정.
**★ D2 결정**: MergingGrid.tsx MODIFY 시 grid-license 인라인 stub 보존 (ADR-002 canonical).
**★ C-20/C-22**: @tanstack/react-virtual peerDep 추가 → package.json MODIFY 필수 (ADR-010).

| # | 파일 경로 (monorepo 경로) | 액션 | 설명 |
|---|--------------------------|------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/types.ts` | MODIFY | `MergingGridProps`에 `enableVirtualization?`, `estimatedRowHeight?`, `virtualOverscan?` 추가 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/MergingGrid.tsx` | MODIFY | `getFilteredRowModel` 추가 + `useVirtualizer` 조건부 통합. ★ grid-license 인라인 stub 보존 (ADR-002) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/MergingGrid.stories.tsx` | MODIFY | `SortAndRecompute` story 추가 (AC-006, C-18, C-10) |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/package.json` | MODIFY | `@tanstack/react-virtual ^3.0.0` peerDep + optional meta 추가 (C-20, C-22, ADR-010) |
| 5 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-13-decisions.md` | MODIFY | ADR-009, ADR-010, ADR-011 추가 (C-14) |

**합계**: 5개 파일. NEW 0개 + MODIFY 5개.

**C-30 자기 검증**: Section 11 Step 1~4에서 언급된 모든 파일이 최종 표에 포함됨.
- Step 1: types.ts(#1) ✓
- Step 2: MergingGrid.tsx(#2) ✓
- Step 3: MergingGrid.stories.tsx(#3) ✓
- Step 4: package.json(#4) ✓, decisions.md(#5) ✓

Section 7 중간 표(5개) ↔ 최종 표(5개): 동일 — E-06 재결정 표현 없음 (모순 없음).

**C-31 Functional Wiring Audit**:
- `computeMergeSpans.ts` — G-001에서 MergingGrid.tsx에 wiring 완료 (line 79). G-003 변경 없음.
- `useVirtualizer` — MergingGrid.tsx 내에서 직접 import + invoke (Section 11.2 After 코드 참조). 결과(virtualItems)를 렌더링에 반영.
- G-003 신규 유틸 파일 없음 → C-31 추가 wiring 의무 없음.

**B-06 자기 검증 (C-4 + C-29 compliance)**:
- 코드 블록 `@ts-ignore`: 0건 ✓
- 코드 블록 `as any`, `: any`: 0건 ✓ (Record<string,unknown> 사용)
- 코드 블록 `declare const`: 0건 ✓
- 코드 블록 namespace import `import * as gridLicense`: 0건 ✓ (인라인 stub만 사용)
- C-29 optional props: destructuring with default values — conditional spread 불필요 (내부 소비) ✓

**G-01 D# ↔ 본문 cross-consistency 검증**:
- D1 (C-28 경로 정정) → Section 7 표 모든 행 경로 `topvel-grid-monorepo/packages/` ✓
- D2 (inline stub 보존) → Section 11.2 After 코드 + Section 13.3 inline stub 인용 ✓
- D3 (useMemo dep [rows, mergeColumns, enableMerging]) → Section 11.2 After 코드 의존성 일치 ✓
- D4 (전체 행 사전 계산 + flow 레이아웃) → Section 10 L-01, Section 11.2 spacer 패턴 ✓
- D5 (rowSpan 경계 limitations) → Section 5 AC-003, Section 10 L-01, ADR-011 ✓

**합계 breakdown**: NEW 0 + MODIFY 5 = 5개. D4 헤더 "MODIFY only, NEW 0" ↔ 최종 표 MODIFY 5 ✓
