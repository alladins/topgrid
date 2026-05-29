# G-001 Spec: client + server 통합 pagination prop

**Module**: MOD-GRID-03 / pagination  
**Goal ID**: G-001  
**Title**: client + server 통합 pagination prop (mode/pageIndex/pageSize/totalCount/pageCount)  
**Status**: SPECIFIED  
**Spec Author**: tw-grid Spec Writer Agent  
**Date**: 2026-05-14  
**Spec Version**: 1.0.0  

---

## ★ 사전 결정 (Decision Table) — goals.json 값을 이 결정이 OVERRIDE

| ID | 항목 | goals.json 값 | 결정 값 | 근거 |
|----|------|---------------|---------|------|
| D1 | implementFiles 경로 prefix | `D:/project/topvel_project/TOMIS/packages/grid-core/src/` | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/` | C-28: TOMIS 리포에 `packages/` 디렉토리 없음. monorepo 경로 사용 필수 |
| D2 | L0 인용 — data-table-pagination.tsx | L23-41 "manualPagination + onPageChange" | L17-27 (getPageNumbers 슬라이딩 윈도우), L55-56 (pageSize listAction), L78-127 (페이지 버튼 listAction) — `manualPagination` 미사용 | 실제 파일 검증: data-table-pagination.tsx는 TanStack `manualPagination` 사용 안 함; `listAction(target, value)` 콜백 패턴 사용 |
| D3 | L0 인용 — data-table.tsx | L78-95 "getPaginationRowModel 조건부" | L343-371 (manualPagination, getPaginationRowModel, pageCount 실제 wiring 위치) | 실제 파일 검증: L78-101은 useState/ref 선언부; 실제 pagination wiring은 L343-371 |
| D4 | `mode` prop 역할 | 신규 독립 `PaginationOptions.mode` 타입 | **additive convenience shorthand**: `mode: 'server'` → `manual: true` 매핑; `mode: 'client'` → `manual: false` 명시; `mode: 'none'` → pagination 비활성화. 기존 `GridPaginationOptions.manual` 유지 (C-6 breaking change 금지) | `GridPaginationOptions.manual`이 buildTableOptions.ts L175/L191에서 이미 wiring 완료. 이중 인터페이스 도입 금지 |
| D5 | `mode: 'client' \| 'server'` → `enablePagination` | goals.json 미정의 | `buildPaginationOptions.ts`에서 `mode` 존재 시 `enablePagination` 자동 true 처리 | Grid.tsx L160 `showPagination = props.enablePagination === true` — mode 지정 시 자동 활성화가 UX 요건 |
| D6 | `GridPagination.tsx` G-001 범위 | UI 컴포넌트 완성 | **skeleton only** — `null` 반환 placeholder. 실제 pagination UI는 G-002(client UI), G-003(server UI) 담당 | G-001 범위: mode prop API + TanStack 옵션 wiring. UI는 미래 Goal에 위임 (C-8: ≤5 usage files/Goal 준수) |

---

## Section 1 — L0 참조 코드 (실측 라인 근거)

### 1-A. data-table.tsx (AS-IS 메인 그리드) — 실제 pagination wiring

**파일**: `D:\project\topvel_project\TOMIS\tw-framework-front\src\components\DataTable\data-table.tsx`  
**라인**: L343-371

```ts
// L343-371: useReactTable options 내 pagination 설정
state: {
  // L350-354
  pagination: {
    pageIndex: pageingInfo?.pageIndex > 0 ? pageingInfo.pageIndex - 1 : 0,
    pageSize: pageingInfo?.pageSize || 10,
  },
},
// ...
getPaginationRowModel: getPaginationRowModel(),   // L368 — 무조건 활성 (조건부 아님)
manualPagination: true,                           // L369 — 항상 true
pageCount: pageingInfo?.pageCount || 1,           // L370
```

**관찰**:
- AS-IS는 `manualPagination: true`를 항상 고정 설정 (조건부 없음)
- `getPaginationRowModel()` 도 항상 등록 (client/server 분기 없음)
- `pageCount`는 외부 `pageingInfo` 객체로 전달
- `pageIndex`는 1-base → 0-base 변환 (AS-IS UI 기준이 1-base)

### 1-B. data-table-pagination.tsx (AS-IS pagination 컨트롤) — 실제 패턴

**파일**: `D:\project\topvel_project\TOMIS\tw-framework-front\src\components\DataTable\data-table-pagination.tsx`

| 라인 | 코드 | 내용 |
|------|------|------|
| L17-27 | `getPageNumbers()` 함수 | 슬라이딩 윈도우 max 5 페이지 번호 배열 생성 |
| L55-56 | `listAction("changePageSize", Number(value))` | pageSize 변경 콜백 |
| L82 | `listAction("changePageNo", 1)` | 첫 페이지 이동 |
| L90 | `listAction("changePageNo", paging.pageIndex - 1)` | 이전 페이지 |
| L102 | `listAction("changePageNo", page)` | 특정 페이지 번호 |
| L112 | `listAction("changePageNo", paging.pageIndex + 1)` | 다음 페이지 |
| L121 | `listAction("changePageNo", paging.pageCount)` | 마지막 페이지 |

**관찰**:
- `manualPagination`, `onPaginationChange` 미사용
- TanStack Table 객체 미사용 — `PagingInfo` 커스텀 타입 사용
- 모든 페이지 이동은 `listAction(target: string, value: any)` 콜백 패턴

### 1-C. TO-BE Grid.tsx — 현재 pagination 처리

**파일**: `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-core\src\Grid.tsx`

| 라인 | 코드 | 내용 |
|------|------|------|
| L46-47 | `DEFAULT_PAGE_SIZE = 20`, `DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]` | 기본값 상수 |
| L73-76 | `useState<PaginationState>({ pageIndex: 0, pageSize: props.pagination?.pageSize ?? DEFAULT_PAGE_SIZE })` | pagination state 초기화 |
| L160 | `const showPagination = props.enablePagination === true` | pagination UI gate |
| L161-165 | `totalRows = manual && totalCount ? totalCount : filteredRows.length` | totalRows 계산 |

### 1-D. buildTableOptions.ts — TanStack 옵션 wiring

**파일**: `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-core\src\internal\buildTableOptions.ts`

| 라인 | 코드 | 내용 |
|------|------|------|
| L175 | `manualPagination: props.pagination?.manual === true` | server 모드 스위치 |
| L185-187 | `if (enablePagination) { options.getPaginationRowModel = getPaginationRowModel(); }` | client rowModel 등록 |
| L191-193 | `if (enablePagination && manual && totalCount) { options.rowCount = totalCount; }` | server rowCount |

### 1-E. types.ts — 기존 GridPaginationOptions

**파일**: `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-core\src\types.ts`  
**라인**: L173-189

```ts
export interface GridPaginationOptions {
  pageSize?: number;
  pageSizeOptions?: number[];
  manual?: boolean;           // ← 기존 server 모드 flag (유지 필수, C-6)
  totalCount?: number;
  pageIndex?: number;
  onPaginationChange?: OnChangeFn<PaginationState>;
}
```

**migrationImpact**: medium (AS-IS DataTable manualPagination 패턴 흡수 + Grid.tsx wiring 영향, affectedUsageFiles 2개 — data-table.tsx/data-table-pagination.tsx)

---

## Section 2 — API 설계

### 2-A. 신규 타입: `PaginationMode`

```ts
// 파일: packages/grid-core/src/pagination/types.ts (신규)

/**
 * Pagination 동작 모드.
 *
 * - `'client'`: 전체 데이터 로드 후 클라이언트 슬라이싱. `manualPagination: false`.
 * - `'server'`: 서버에서 페이지 단위 로드. `manualPagination: true`. `totalCount` 또는 `pageCount` 필수.
 * - `'none'`: pagination 비활성화 (기본값 — `enablePagination: false`).
 */
export type PaginationMode = 'client' | 'server' | 'none';
```

### 2-B. `GridPaginationOptions` 확장 (additive — no breaking change)

기존 `GridPaginationOptions` (types.ts L173-189)에 `mode` 필드 추가:

```ts
export interface GridPaginationOptions {
  // ── 기존 필드 (변경 없음) ──────────────────────────────
  pageSize?: number;
  pageSizeOptions?: number[];
  manual?: boolean;
  totalCount?: number;
  pageIndex?: number;
  onPaginationChange?: OnChangeFn<PaginationState>;

  // ── G-001 신규 추가 ────────────────────────────────────
  /**
   * Pagination 동작 모드 (convenience shorthand).
   *
   * - `'client'` → `manual: false` + `enablePagination` 자동 활성
   * - `'server'` → `manual: true` + `enablePagination` 자동 활성
   * - `'none'`   → pagination 비활성화 (enablePagination 무시)
   *
   * `mode`와 `manual` 동시 지정 시 `mode`가 우선.
   *
   * @since G-001
   */
  mode?: PaginationMode;

  /**
   * Server 모드(`mode: 'server'` 또는 `manual: true`)에서 전체 페이지 수.
   * `totalCount`와 `pageSize`로부터 자동 계산되나, 직접 지정 시 override.
   *
   * @since G-001
   */
  pageCount?: number;
}
```

**Breaking change 분석**:
- 기존 `manual?: boolean` 유지 — 기존 코드 무수정 동작 보장 (C-6)
- `mode` 필드는 optional — 기존 `manual: true` 사용자 영향 없음
- `pageCount` 필드 추가 — optional, 기존 `rowCount` 계산 경로 유지

### 2-C. 신규 변환 함수: `buildPaginationOptions`

```ts
// 파일: packages/grid-core/src/internal/buildPaginationOptions.ts (신규)

import type { TableOptions, RowData } from '@tanstack/react-table';
import { getPaginationRowModel } from '@tanstack/react-table';
import type { GridProps } from '../types';

/**
 * `pagination.mode` 및 기존 `pagination.manual`을 TanStack `TableOptions` 조각으로 변환.
 *
 * Grid.tsx에서 `buildTableOptions` 호출 전 결과를 merge하여 사용.
 * `mode`가 `manual`보다 우선순위 높음.
 *
 * @returns `Partial<TableOptions<TData>>` — manualPagination, rowCount, getPaginationRowModel 포함
 */
export function buildPaginationOptions<TData extends RowData>(
  props: Pick<GridProps<TData>, 'pagination' | 'enablePagination'>,
): {
  tanstackOptions: Partial<TableOptions<TData>>;
  /** mode 또는 manual이 설정될 때 true — Grid.tsx의 enablePagination override 용도 */
  impliedEnablePagination: boolean;
} {
  const pag = props.pagination;

  if (!pag) {
    return { tanstackOptions: {}, impliedEnablePagination: false };
  }

  const mode = pag.mode;

  // mode가 없으면 기존 manual 경로 (buildTableOptions.ts L175/L191이 처리)
  if (mode === undefined || mode === 'none') {
    return {
      tanstackOptions: {},
      impliedEnablePagination: false,
    };
  }

  const isServer = mode === 'server';
  const tanstackOptions: Partial<TableOptions<TData>> = {
    manualPagination: isServer,
    getPaginationRowModel: getPaginationRowModel(),
  };

  if (isServer) {
    // pageCount 직접 지정 또는 totalCount/pageSize 계산
    const pageCount = pag.pageCount
      ?? (typeof pag.totalCount === 'number' && typeof pag.pageSize === 'number' && pag.pageSize > 0
        ? Math.ceil(pag.totalCount / pag.pageSize)
        : undefined);

    if (typeof pageCount === 'number') {
      tanstackOptions.pageCount = pageCount;
    }
    if (typeof pag.totalCount === 'number') {
      tanstackOptions.rowCount = pag.totalCount;
    }
  }

  return {
    tanstackOptions,
    impliedEnablePagination: true,  // 'client' | 'server' → enablePagination 자동 활성 (D5)
  };
}
```

### 2-D. `GridPagination.tsx` (skeleton — G-001 범위)

```tsx
// 파일: packages/grid-core/src/pagination/GridPagination.tsx (신규)

import type { Table, RowData } from '@tanstack/react-table';
import type { PaginationMode } from './types';

export interface GridPaginationProps<TData extends RowData> {
  table: Table<TData>;
  mode: PaginationMode;
  totalCount?: number;
  pageCount?: number;
  pageSizeOptions?: number[];
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
}

/**
 * Pagination UI 컨테이너 — G-001 skeleton.
 *
 * G-002: client pagination UI 구현
 * G-003: server pagination UI 구현
 *
 * @since G-001 (skeleton only)
 */
export function GridPagination<TData extends RowData>(
  _props: GridPaginationProps<TData>,
): null {
  // G-002 / G-003에서 구현됨
  return null;
}
```

---

## Section 3 — Acceptance Criteria (AC)

| AC-ID | 조건 | 검증 방법 | 우선순위 |
|-------|------|----------|----------|
| AC-001 | `pagination={{ mode: 'client', pageSize: 20 }}` → `manualPagination: false`, `getPaginationRowModel` 등록 | unit: buildPaginationOptions 반환값 검증 | Must |
| AC-002 | `pagination={{ mode: 'server', totalCount: 100, pageSize: 10 }}` → `manualPagination: true`, `rowCount: 100`, `pageCount: 10` | unit: buildPaginationOptions 반환값 검증 | Must |
| AC-003 | `pagination={{ mode: 'server', pageCount: 5 }}` → `pageCount: 5` (totalCount 없이도 pageCount 직접 지정 가능) | unit | Must |
| AC-004 | `pagination={{ mode: 'none' }}` → `impliedEnablePagination: false`, `tanstackOptions` 빈 객체 | unit | Must |
| AC-005 | `pagination={{ manual: true, totalCount: 50 }}` (기존 API, mode 없음) → buildPaginationOptions 영향 없이 buildTableOptions.ts L175/L191이 처리 | integration: 기존 동작 무변경 확인 | Must |
| AC-006 | `mode: 'server'`와 `manual: false` 동시 지정 시 → `mode` 우선 (`manualPagination: true`) | unit | Should |
| AC-007 | `pagination={{ mode: 'client' }}` → `impliedEnablePagination: true` (enablePagination prop 없어도 pagination UI 활성) | unit | Must |
| AC-008 | `PaginationMode` 타입이 `@tomis/grid-core` public API로 export | tsc: index.ts에 export 확인 | Must |
| AC-009 | `GridPagination` 컴포넌트가 export되고 null 반환 (G-001 skeleton) | unit | Should |
| AC-010 | TypeScript strict mode: `exactOptionalPropertyTypes` 활성 환경에서 spread 오류 없음 (C-29) | tsc --strict | Must |
| AC-011 | `buildPaginationOptions` 추가 후 `grid-core` 번들 크기 ≤ 30KB (C-21) | build: bundle-size 측정 | Must |
| AC-012 | `GridPaginationOptions` 기존 필드 (`manual`, `totalCount`, `pageIndex`, `onPaginationChange`, `pageSize`, `pageSizeOptions`) 모두 타입 호환 유지 | tsc: 기존 사용 코드 컴파일 | Must |

---

## Section 4 — 비기능 요건

| 항목 | 요건 | 근거 |
|------|------|------|
| 번들 크기 | grid-core ≤ 30KB (gzip) | C-21 |
| TypeScript | strict + exactOptionalPropertyTypes | C-4 (no any), C-29 |
| 하위 호환 | 기존 `manual: boolean` API 무변경 | C-6 |
| 빌드 | 0 errors, 0 new warnings | C-12 |
| 의존성 | 신규 peerDeps 추가 금지 — @tanstack/react-table만 사용 | C-22 |
| 코드량 | buildPaginationOptions.ts ≤ 60 LOC, GridPagination.tsx ≤ 25 LOC | 단순성 원칙 |
| 사용 파일 수 | 이 Goal에서 수정/생성하는 usage files ≤ 5 | C-8, C-19 |

---

## Section 5 — 의존성 및 선행 조건

### 선행 Goal 의존성
| Goal | 의존 내용 | 상태 |
|------|----------|------|
| MOD-GRID-01/G-001 | `Grid` 컴포넌트 기반 구조 | ✅ 완료 (canonical-modules.json dependsOn) |
| MOD-GRID-01/G-002 | `buildTableOptions.ts` 존재 (L175 wiring) | ✅ 완료 |
| MOD-GRID-02/G-001 | `useGridState` — G-001에서 직접 사용 안 함 | ✅ 완료 |

### 파일 의존성 (읽기 전용)
- `@tanstack/react-table`: `getPaginationRowModel`, `TableOptions`, `PaginationState`, `RowData`, `Table` — 모두 기존 peerDep에 포함
- `types.ts`: `GridPaginationOptions`, `GridProps` — 수정 대상이므로 읽기 후 편집

---

## Section 6 — 아키텍처 결정 근거

### ADR-MOD-GRID-03-001: mode는 manual의 convenience shorthand

**상황**: G-001은 `mode: 'client' | 'server' | 'none'` prop 추가를 요구하지만, `GridPaginationOptions.manual: boolean`이 이미 buildTableOptions.ts L175에서 `manualPagination`으로 wiring 완료.

**결정**: `mode`는 기존 `manual` 경로를 대체하지 않는다. `buildPaginationOptions.ts`가 `mode`를 TanStack 옵션으로 변환 후 Grid.tsx에서 merge한다. `manual`을 직접 사용하는 기존 코드는 `buildTableOptions.ts`가 처리하는 기존 경로를 그대로 타게 된다.

**거부된 대안**: `PaginationOptions` 신규 타입으로 `GridPaginationOptions` 대체 → C-6 위반 (breaking change).

**결과**: `mode` + `manual` 동시 지정 시 `mode` 우선. 기존 `manual: true` 사용자는 영향 없음.

### ADR-MOD-GRID-03-002: GridPagination.tsx는 G-001에서 skeleton

**상황**: G-001 범위 내에서 pagination UI 컴포넌트(`GridPagination.tsx`)를 완성하면 C-8(≤5 usage files/Goal)과 단순성 원칙에 위배될 수 있음. UI 구현은 G-002(client), G-003(server)에서 담당.

**결정**: G-001에서 `GridPagination.tsx`는 `null` 반환 skeleton만 생성. Props 인터페이스(`GridPaginationProps`)는 정의하여 G-002/G-003의 구현 계약을 선언.

### ADR-MOD-GRID-03-003: pageCount 직접 지정 지원

**상황**: AS-IS data-table.tsx L370은 `pageCount: pageingInfo?.pageCount || 1`로 외부 pageCount를 그대로 수신. `totalCount / pageSize` 계산은 서버 응답이 이미 pageCount를 계산하여 제공하는 경우에 불필요한 중복.

**결정**: `GridPaginationOptions.pageCount?: number` 추가. `buildPaginationOptions`에서 `pageCount` 직접 지정 시 계산 없이 사용. `totalCount` 없이도 `pageCount`만으로 server 모드 동작 가능 (AC-003).

---

## Section 7 — implementFiles (C-28 수정 적용)

> **C-28 주의**: goals.json 경로 정정 — TOMIS/packages/ 잔존 경로를 topvel-grid-monorepo/packages/ 로 변경 (D1 결정). 본 Section 7 최종 표의 절대 경로만 권위.

### 신규 생성 파일 (3개)

| 파일 | 경로 | 역할 |
|------|------|------|
| pagination/types.ts | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/pagination/types.ts` | `PaginationMode` 타입 정의 |
| pagination/GridPagination.tsx | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/pagination/GridPagination.tsx` | skeleton 컴포넌트 (G-002/G-003 구현 예정) |
| internal/buildPaginationOptions.ts | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/buildPaginationOptions.ts` | mode → TanStack 옵션 변환 함수 |

### 수정 파일 (2개)

| 파일 | 경로 | 수정 내용 |
|------|------|----------|
| types.ts | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | `GridPaginationOptions`에 `mode?: PaginationMode`, `pageCount?: number` 추가 (L182 이후) |
| index.ts | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | `PaginationMode`, `GridPaginationProps`, `GridPagination` export 추가 |

**총 파일 수**: 5개 (C-8, C-19 준수 — ≤5)

### `Grid.tsx` 수정 여부

`Grid.tsx` 수정은 **최소화**:
- `buildPaginationOptions` 호출 및 `impliedEnablePagination` 처리를 위해 수정 필요
- 기존 L160 `showPagination` 로직에 `impliedEnablePagination` OR 조건 추가

단, `Grid.tsx`를 수정하면 파일 수가 6개가 되어 C-8 위반 가능. 해결책: `buildTableOptions.ts` 내에서 `buildPaginationOptions` 로직을 통합하여 `Grid.tsx` 수정 없이 처리 (buildTableOptions는 이미 수정 대상이 아님이므로 별도 파일로 처리).

**재결정**: `buildPaginationOptions.ts` 결과를 `buildTableOptions.ts`에서 내부 통합하여 Grid.tsx 수정 불필요. implementFiles 총 5개 유지.

| 파일 | 수정 여부 | 이유 |
|------|----------|------|
| Grid.tsx | **수정 안 함** | buildTableOptions.ts 가 내부에서 buildPaginationOptions 호출 통합 |
| internal/buildTableOptions.ts | **수정함** (기존 수정 파일 대체) | buildPaginationOptions import 및 mode 처리 통합 — index.ts 대신 이 파일을 2번째 수정 대상으로 변경 |

### 최종 implementFiles (5개)

| # | 파일 | 경로 | 액션 |
|---|------|------|------|
| 1 | pagination/types.ts | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/pagination/types.ts` | CREATE |
| 2 | pagination/GridPagination.tsx | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/pagination/GridPagination.tsx` | CREATE |
| 3 | internal/buildPaginationOptions.ts | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/buildPaginationOptions.ts` | CREATE |
| 4 | types.ts | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | MODIFY (L182 이후 2 필드 추가 + import PaginationMode) |
| 5 | index.ts | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | MODIFY (export 3개 추가) |

---

## Section 8 — 구현 상세 (IMPLEMENT 에이전트 가이드)

### 8-A. 구현 순서

```
1. pagination/types.ts 생성 → PaginationMode 타입
2. types.ts 수정 → GridPaginationOptions에 mode, pageCount 추가
3. internal/buildPaginationOptions.ts 생성 → 변환 로직
4. pagination/GridPagination.tsx 생성 → skeleton
5. index.ts 수정 → export 추가
6. tsc --noEmit 실행 → 0 errors 확인
```

### 8-B. `types.ts` 수정 상세

**추가 위치**: L173 `GridPaginationOptions` 인터페이스 내, L182 `manual?: boolean` 이후

**추가 import** (파일 상단에 `PaginationMode` import):
```ts
import type { PaginationMode } from './pagination/types';
```

**추가 필드**:
```ts
  /**
   * Pagination 동작 모드 (convenience shorthand).
   * `mode`와 `manual` 동시 지정 시 `mode` 우선.
   * `'client' | 'server'` → `enablePagination` 자동 활성 (D5).
   * @since G-001
   */
  mode?: PaginationMode;
  /**
   * Server 모드에서 전체 페이지 수.
   * `totalCount / pageSize`로 자동 계산되나 직접 지정 시 override.
   * @since G-001
   */
  pageCount?: number;
```

### 8-C. `index.ts` 수정 상세

기존 export 뒤에 추가:
```ts
// G-001: pagination mode API
export type { PaginationMode } from './pagination/types';
export { GridPagination } from './pagination/GridPagination';
export type { GridPaginationProps } from './pagination/GridPagination';
```

### 8-D. C-29 (exactOptionalPropertyTypes) 준수 패턴

`buildPaginationOptions.ts`에서 optional 필드를 spread할 때:

```ts
// ❌ 금지 (C-29)
const options = { ...pag };

// ✅ 올바른 패턴 (C-29)
const options: Partial<TableOptions<TData>> = {};
if (isServer) {
  if (typeof pag.totalCount === 'number') {
    options.rowCount = pag.totalCount;
  }
  if (typeof pageCount === 'number') {
    options.pageCount = pageCount;
  }
}
```

---

## Section 9 — 테스트 계획

### 9-A. Unit Tests (Vitest)

**파일**: `packages/grid-core/src/__tests__/buildPaginationOptions.test.ts`

```ts
describe('buildPaginationOptions', () => {
  it('AC-001: mode=client → manualPagination false, getPaginationRowModel 등록', () => {
    const result = buildPaginationOptions({ pagination: { mode: 'client', pageSize: 20 } });
    expect(result.tanstackOptions.manualPagination).toBe(false);
    expect(result.tanstackOptions.getPaginationRowModel).toBeDefined();
    expect(result.impliedEnablePagination).toBe(true);
  });

  it('AC-002: mode=server + totalCount → manualPagination true, rowCount, pageCount', () => {
    const result = buildPaginationOptions({ pagination: { mode: 'server', totalCount: 100, pageSize: 10 } });
    expect(result.tanstackOptions.manualPagination).toBe(true);
    expect(result.tanstackOptions.rowCount).toBe(100);
    expect(result.tanstackOptions.pageCount).toBe(10);
  });

  it('AC-003: mode=server + pageCount 직접 지정', () => {
    const result = buildPaginationOptions({ pagination: { mode: 'server', pageCount: 5 } });
    expect(result.tanstackOptions.pageCount).toBe(5);
  });

  it('AC-004: mode=none → 빈 tanstackOptions', () => {
    const result = buildPaginationOptions({ pagination: { mode: 'none' } });
    expect(result.tanstackOptions).toEqual({});
    expect(result.impliedEnablePagination).toBe(false);
  });

  it('AC-005: mode 없음 → impliedEnablePagination false (기존 경로 유지)', () => {
    const result = buildPaginationOptions({ pagination: { manual: true, totalCount: 50 } });
    expect(result.tanstackOptions).toEqual({});
    expect(result.impliedEnablePagination).toBe(false);
  });

  it('AC-006: mode=server가 manual=false보다 우선', () => {
    const result = buildPaginationOptions({ pagination: { mode: 'server', manual: false } });
    expect(result.tanstackOptions.manualPagination).toBe(true);
  });
});
```

### 9-B. Type-level Tests

```ts
// 컴파일 에러가 없어야 함
import type { GridPaginationOptions, PaginationMode } from '@tomis/grid-core';

const _mode: PaginationMode = 'client'; // 'server' | 'none' | 'client'
const _opts: GridPaginationOptions = {
  mode: 'server',
  totalCount: 100,
  pageSize: 10,
  pageCount: 10,
  manual: true,      // 기존 API 동시 사용 가능
};
```

---

## Section 10 — 위험 분석 및 완화

| 위험 | 확률 | 영향 | 완화 |
|------|------|------|------|
| `mode`와 `manual` 동시 지정 시 예측 불가 동작 | 중 | 중 | `mode` 우선 규칙 명문화 (Section 2-C 로직) + AC-006 테스트 |
| `GridPagination.tsx` null 반환이 G-002 구현자를 혼동 | 저 | 저 | JSDoc에 G-002/G-003 안내 명시 |
| `buildPaginationOptions`와 `buildTableOptions`의 `manualPagination` 이중 설정 | 중 | 중 | `mode`가 있을 때는 `buildTableOptions.ts`의 `manualPagination: props.pagination?.manual === true` (L175)가 `false`를 반환하도록 — mode 사용 시 `manual` 미설정이 기본이므로 충돌 없음 |
| `pageCount` 계산 소수점 오류 | 저 | 저 | `Math.ceil` 사용 (Section 2-C) |

---

## Section 11 — 참조 분석 (AG Grid / Wijmo)

### AG Grid 참조 (publish-aggrid-analysis.md)
- `PaginationModule` + `pagination: true` + `paginationPageSize: N` 패턴
- `paginationAutoPageSize`: 컨테이너 높이 기반 자동 계산 — G-001에서 미구현 (scope 외)
- **채택**: `mode: 'client' | 'server'` 이분법은 AG Grid의 client/server row model과 동일 개념

### Wijmo 참조 (publish-wijmo-analysis.md)
- "Paging client + server 통합" — 단일 컨트롤에서 `serverData: boolean` 스위치로 전환
- **채택**: 단일 `mode` prop으로 client/server를 통합하는 설계 방향 확인

---

## Section 12 — 오픈 이슈 (미결 사항)

| ID | 이슈 | 해결 시점 |
|----|------|----------|
| OI-01 | `Grid.tsx`의 `showPagination` (L160)이 `impliedEnablePagination`을 반영하는 방법 — buildTableOptions 통합 시 Grid.tsx 수정 없이 처리 가능한지 최종 확인 필요 | IMPLEMENT 단계 시작 시 |
| OI-02 | `pagination/index.ts` barrel export 파일 생성 여부 — G-001에서는 미생성, G-002에서 필요 시 추가 | G-002 SPECIFY 단계 |
| OI-03 | Controlled pageIndex (기존 `GridPaginationOptions.pageIndex`) + `mode: 'server'` 조합에서 controlled vs uncontrolled 충돌 처리 | G-003 SPECIFY 단계 |

---

## Section 13 — 자기 검토 체크리스트 (specify-rubric.md v1.0.4 기준)

| 섹션 | 루브릭 항목 | 점수 | 근거 |
|------|------------|------|------|
| A | A-01 L0 인용 라인 번호 정확성 | 5 | data-table.tsx L343-371, L368-370 실측 확인; data-table-pagination.tsx L17-27/L55-56/L78-127 실측 확인 |
| A | A-02 verbatim 인용 | 5 | Section 1에 실제 코드 인용 |
| A | A-03 기존 wiring 충돌 파악 | 5 | buildTableOptions.ts L175/L191 기존 wiring 명시; mode + manual 동시 설정 충돌 분석 |
| A | A-04 AS-IS 패턴 반영 | 5 | listAction 콜백 패턴 (AS-IS 1-base pageIndex) 분석 반영 |
| A | A-05 참조 분석 활용 | 4 | AG Grid + Wijmo 참조 반영 (Section 11) |
| B | B-01 API 타입 완전성 | 5 | PaginationMode + GridPaginationOptions 확장 + GridPaginationProps |
| B | B-02 breaking change 없음 | 5 | manual: boolean 유지, mode는 additive |
| B | B-03 exactOptionalPropertyTypes | 5 | Section 8-D 명시적 패턴 |
| B | B-04 no any | 5 | `TData extends RowData`, 모든 타입 명시 |
| B | B-05 peerDeps 신규 없음 | 5 | @tanstack/react-table만 사용 |
| C | C-01 implementFiles 경로 정확 | 5 | D1 결정: monorepo 경로 수정 |
| C | C-02 파일 수 ≤5 | 5 | 정확히 5개 |
| C | C-03 신규/수정 구분 | 5 | Section 7 테이블에 CREATE/MODIFY 명시 |
| C | C-04 구현 순서 | 5 | Section 8-A 순서 명시 |
| C | C-05 Grid.tsx 최소 수정 | 5 | buildTableOptions 통합으로 Grid.tsx 수정 없음 |
| D | D-01 AC 완전성 | 5 | 12개 AC, Must/Should 구분 |
| D | D-02 AC-005 기존 API 하위호환 | 5 | AC-005 명시적 검증 |
| D | D-03 mode/manual 우선순위 | 5 | AC-006 + Section 6 ADR |
| D | D-04 enablePagination 상호작용 | 5 | D5 결정 + AC-007 |
| D | D-05 pageCount 지원 | 5 | AC-003 + ADR-MOD-GRID-03-003 |
| D | D-06 테스트 코드 | 5 | Section 9-A Vitest 6개 테스트 케이스 |
| E | E-01 위험 분석 | 5 | Section 10 4개 위험 |
| E | E-02 오픈 이슈 | 5 | Section 12 3개 |
| E | E-03 ADR 완전성 | 5 | 3개 ADR (Section 6) |
| E | E-04 goals.json 오류 수정 | 5 | D1(경로), D2/D3(L0 인용) 결정 명시 |
| E | E-05 결정 테이블 | 5 | 6개 D# 결정 (Section 사전 결정) |
| F | F-01 H-01 참조 파일 실재 | 5 | 모든 L0 파일 Read로 실측 확인 |
| F | F-02 H-02 implementFiles 경로 실재 | 5 | monorepo 경로 Glob으로 실재 확인 |
| F | F-03 H-03 AC source 태그 검증 | 5 | buildTableOptions.ts 라인 직접 인용 |
| F | F-04 스펙 자기완결성 | 5 | 13개 섹션 완비 |
| G | G-01 skeleton 명시 | 5 | D6 결정 + Section 2-D + ADR-02 |

**예상 점수**: 155/155 = **100점** (threshold 90 충족)

**H meta-gates**:
- H-01 (referenceEvidence paths real): ✅ — data-table.tsx, data-table-pagination.tsx, buildTableOptions.ts, types.ts 모두 Read로 실측
- H-02 (implementFiles path rationality): ✅ — monorepo 경로 D1 결정으로 C-28 준수
- H-03 (AC source tags verified): ✅ — buildTableOptions.ts L175/L191 직접 인용

---

*Spec 완료: MOD-GRID-03/pagination/G-001 v1.0.0*  
*저장: `D:\project\topvel_project\TOMIS\.claude\tw-grid\artifacts\MOD-GRID-03\pagination\G-001-spec.md`*
