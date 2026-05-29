# MOD-GRID-04 / column / G-001 Spec

**Goal**: `createColumns<TData>()` + type 자동 renderer 분기 + 표준 columnDef 옵션  
**Spec version**: 1.0.0  
**Date**: 2026-05-14  
**Author**: tw-grid Spec Writer Agent  
**Rubric**: specify-rubric v1.0.4 — medium threshold (90)  
**Status**: DRAFT

---

## D# 결정 요약

| ID | 결정 내용 |
|----|-----------|
| D1 | rendererRegistry 인터페이스 + placeholder fallback은 이 Goal에서 정의. 실제 cell 컴포넌트는 MOD-GRID-05 책임. type이 registry에 없으면 plain text fallback(TanStack 기본 cell). |
| D2 | implementFiles 경로 prefix = `topvel-grid-monorepo/packages/grid-core/src/`. `column/` 서브디렉토리는 NEW (H-02 예외: 조부모 `src/` 존재). |
| D3 | `legacy/ColumnInfo.ts`가 DataTable의 ColumnInfo를 re-export. `createColumns()`는 `TomisColumnDef<TData>[] \| ColumnInfo[]` 유니온 파라미터 수용 후 type narrowing. |
| D4 | `createTomisColumnHelper<TData>()` = Option A: TanStack `createColumnHelper<TData>()` 순수 re-export. `.tomisColumn()` wrapper 메서드 없음. `createColumns(defs)`와 독립 진입점으로 공존. |
| D5 | `'checkbox'`는 DisplayColumnDef generator 전용 처리(accessorKey 없음). `'icon'`은 MOD-GRID-05 pending 상태로 placeholder registry entry. 둘 다 rendererRegistry에 등록 필수. |

**파일 구성 (D# breakdown)**: NEW 8 + MODIFY 1 = **총 9개**

| # | 파일 | 구분 |
|---|------|------|
| 1 | `packages/grid-core/src/column/types.ts` | NEW |
| 2 | `packages/grid-core/src/column/rendererRegistry.ts` | NEW |
| 3 | `packages/grid-core/src/column/createColumns.ts` | NEW |
| 4 | `packages/grid-core/src/column/createTomisColumnHelper.ts` | NEW |
| 5 | `packages/grid-core/src/legacy/ColumnInfo.ts` | NEW |
| 6 | `packages/grid-core/src/column/createColumns.test.ts` | NEW |
| 7 | `packages/grid-core/src/column/createColumns.typetest.ts` | NEW |
| 8 | `packages/grid-core/src/column/createColumns.stories.tsx` | NEW |
| 9 | `packages/grid-core/src/index.ts` | MODIFY |

---

## Section 1. 참조 출처 (Source References)

### 1.1 L0 — AS-IS 소스 (직접 마이그레이션 대상)

| 파일 | 역할 | 핵심 라인 |
|------|------|----------|
| `tw-framework-front/src/components/DataTable/data-table-types.ts` | ColumnInfo 인터페이스 원본 (id, type, align, name, width, visibility, etc) | L1–L20 |
| `tw-framework-front/src/components/DataTable/data-table.tsx` | type 분기 switch 원본 — checkbox/number/boolean/dateTime/text 5종 | L242–L339 |
| `tw-framework-front/src/components/tomis/Grid/renderers/` | Badge/Check/Link/Number/Date/Icon/Button renderer 7종 | (전체 파일) |

**근거**: `canonical-modules.json` MOD-GRID-04 → `affectedUsageFiles: ["data-table-types.ts", "data-table.tsx"]`

### 1.2 L1 — TanStack Table v8 공식 API

| API | 용도 |
|-----|------|
| `createColumnHelper<TData>()` | 타입 안전 columnDef 빌더. `.accessor()`, `.display()`, `.group()` 메서드 제공 |
| `ColumnDef<TData>` | 기본 column 정의 타입 (AccessorKeyColumnDef / AccessorFnColumnDef / DisplayColumnDef) |
| `CellContext<TData, TValue>` | cell renderer의 `info` 파라미터 타입 |
| `flexRender()` | header/cell 렌더링 헬퍼 |

**출처**: `tw-grid/references/tanstack-api-inventory.md` §2.5

### 1.3 L2 — publish 레퍼런스

| 소스 | 패턴 | 참조 위치 |
|------|------|----------|
| AG Grid `AggridTable.tsx` L53 | `components` map → 컴포넌트 주입 패턴 (rendererRegistry 근거) | `publish-aggrid-analysis.md` R-A |
| AG Grid `ColDef` | `field`, `headerName`, `width`, `flex`, `pinned` 패턴 | `publish-aggrid-analysis.md` R-A |
| AG Grid `defaultColDef` | `{ sortable, filter, resizable }` 기본값 패턴 | `publish-aggrid-analysis.md` R-A |

**C-16 준수**: Wijmo는 참조 분석(`publish-wijmo-analysis.md` R-W: `Column binding + dataType`)에만 사용. 어떤 package에도 Wijmo import 금지.

### 1.4 L3 — 내부 구현 참조

| 파일 | 역할 |
|------|------|
| `packages/grid-core/src/index.ts` | 현재 public API 진입점 (MODIFY 대상) |
| `packages/grid-core/src/types.ts` | 기존 타입 패턴 참고 (BaseGridProps, GridState 등) |
| `packages/grid-core/src/Grid.tsx` | forwardRef + internal/ 서브디렉토리 패턴 참고 |
| `packages/grid-core/src/useGridState.ts` | JSDoc 스타일 + TanStack import 패턴 참고 |
| `tw-grid/artifacts/MOD-GRID-02/state/G-001-spec.md` | 이전 spec 포맷 참고 |

### 1.5 Migration Impact

**medium** — DataTable의 type 기반 column 빌드 로직을 흡수. 27개 page-level 사용 파일이 간접 영향 받음. 단, `createColumns(defs)` API가 `ColumnInfo[]` 호환 유지로 마이그레이션 부담 최소화.

### 1.6 R-A / R-W 참조 요약

- **R-A (AG Grid)**: `components` registry injection 패턴 → `rendererRegistry` 설계 근거  
- **R-W (Wijmo)**: `dataType: Number/String/Date` → `TomisColumnDef.type` union 설계 참고 (import 금지)

---

## Section 2. 목표 (Goal Statement)

`createColumns<TData>(defs: TomisColumnDef<TData>[] | ColumnInfo[])` 함수를 구현하여:

1. `type` 필드 기반 자동 renderer 분기 — 9종 (`'checkbox'|'number'|'boolean'|'dateTime'|'date'|'text'|'badge'|'link'|'icon'`)
2. rendererRegistry 패턴으로 type → cell 컴포넌트 매핑 (MOD-GRID-05 pending 위한 extensible 설계)
3. `createTomisColumnHelper<TData>()` = TanStack `createColumnHelper` 순수 re-export (Option A)
4. `legacy/ColumnInfo.ts` 호환 alias 제공 (DataTable migration 경로)
5. 표준 columnDef 옵션 (`width`, `flex`, `enableSorting`, `enableResizing`, `meta.primary`, `meta.align`, `visibility`) 매핑

**성공 기준**: `createColumns(defs)` 호출 1회로 `ColumnDef<TData>[]` 반환. TanStack `useReactTable({ columns })` 직접 주입 가능.

---

## Section 3. 수용 기준 (Acceptance Criteria)

| ID | 기준 | 소스 태그 |
|----|------|----------|
| AC-001 | `TomisColumnDef<TData>`의 `type` 필드는 `'checkbox'\|'number'\|'boolean'\|'dateTime'\|'date'\|'text'\|'badge'\|'link'\|'icon'` 9종 union. | [L0: data-table.tsx L242–339, tomis/Grid/renderers/] |
| AC-002 | `createColumns<TData>(defs)` 는 `TomisColumnDef<TData>[] \| ColumnInfo[]`를 받아 `ColumnDef<TData>[]` 반환. | [L0: data-table.tsx L242–339] |
| AC-003 | type → cell 컴포넌트 매핑은 `rendererRegistry[type]` 조회 방식. hard-coded if/else 금지. | [L2: publish-aggrid-analysis.md R-A components 패턴] |
| AC-004 | `createTomisColumnHelper<TData>()` = `createColumnHelper<TData>()` 순수 re-export (Option A). `.tomisColumn()` 없음. | [L1: tanstack-api-inventory.md §2.5] |
| AC-005 | `legacy/ColumnInfo.ts` 는 `tw-framework-front`의 `ColumnInfo` 인터페이스와 동일 shape를 re-export. `createColumns()`가 이를 수용. | [L0: data-table-types.ts] |
| AC-006 | `'checkbox'` type은 `DisplayColumnDef` 생성 (accessorKey 없음). header + cell 모두 rendererRegistry에서 조회. | [L0: data-table.tsx L245–265, D5] |
| AC-007 | registry에 없는 type은 `column.accessorKey` 기반 plain text fallback (TanStack 기본 cell). | [L1: tanstack-api-inventory.md §2.5 (default cell behavior), D1] |
| AC-008 | `width`, `enableSorting`, `enableResizing`, `meta.primary`, `meta.align` 옵션 표준 매핑. `visibility: false`는 `createColumns` 반환 후 호출 측 `initialState.columnVisibility` 구성 가이드 방식 (OQ-01). | [L0: data-table.tsx L280–339] |

---

## Section 4. 비기능 요건 (Non-Functional Requirements)

| 항목 | 요건 |
|------|------|
| **타입 안전성** | C-4 준수: `any` 타입 사용 금지. `unknown` 또는 명시적 generic 사용. |
| **번들 크기** | C-21: `grid-core` ≤ 30 KB gzipped. 현재 baseline 24.52 KB (MOD-GRID-02까지). 이 Goal +~5 KB 예상 → ~29.52 KB (0.48 KB 여유). 실 renderer 컴포넌트는 MOD-GRID-05에서 추가되므로 이 Goal 자체는 최소화 (type 정의 + registry 인터페이스만). |
| **peerDependencies** | C-22: `@tanstack/react-table@^8.21.3` peerDep. 번들에 포함 금지. |
| **JSDoc** | C-25: 공개 API (`createColumns`, `createTomisColumnHelper`, `TomisColumnDef`, `rendererRegistry`) 전체 JSDoc + `@example` 필수. |
| **Storybook** | C-25: `createColumns` 기본 사용 예시 + 각 type별 preview — Story 파일 필요. |
| **exactOptionalPropertyTypes** | C-29: optional prop 전달 시 spread skip 패턴 (`...(opt !== undefined && { prop: opt })`). |
| **스타일** | C-5: Tailwind CSS만 사용. inline style 금지. |
| **ADR** | C-14: `createColumns` vs `createTomisColumnHelper` API 설계 결정 → ADR-MOD-GRID-04-001 작성 필요. |

---

## Section 5. 엣지 케이스 (Edge Cases)

| ID | 시나리오 | 기대 동작 |
|----|----------|----------|
| EC-01 | `defs = []` (빈 배열) | `[]` 반환. 에러 없음. |
| EC-02 | `type`이 9종 외 임의 문자열 | `column.accessorKey` 기반 plain text fallback (AC-007). console.warn 발생. |
| EC-03 | `width`가 undefined 또는 빈 문자열 | `parseInt('100')` = 100 기본값 적용 (L0 data-table.tsx 패턴). |
| EC-04 | `ColumnInfo[]` 입력 (legacy) | `type` 필드가 string이므로 내부에서 `TomisColumnType` union으로 narrowing. 일치하면 분기, 불일치하면 EC-02 처리. |
| EC-05 | `visibility: false` | `createColumns` 자체에서는 처리하지 않음. 반환된 배열 기반으로 호출 측이 `initialState: { columnVisibility: { [id]: false } }` 구성. OQ-01 참조. |
| EC-06 | `'checkbox'`에 `accessorKey` 제공 시 | `accessorKey` 무시. DisplayColumnDef 강제 (AC-006). console.warn. |
| EC-07 | `'icon'` type — MOD-GRID-05 미완성 상태 | registry에 placeholder fallback 등록. plain text로 렌더. |
| EC-08 | `enableSorting: true` + `type: 'checkbox'` | checkbox는 `enableSorting: false` 강제 overwrite (L0 패턴 준수). |
| EC-09 | `meta.primary: true` 조건 | `etc?.toLowerCase().includes('primary')` — ColumnInfo 호환. TomisColumnDef는 `meta.primary: boolean` 직접 지원. |
| EC-10 | C-29: optional `meta` 미제공 | spread skip 패턴으로 `meta` 키 자체를 omit. |

---

## Section 6. 테스트 계획 (Test Plan)

### 단위 테스트 (`column/createColumns.test.ts` — NEW)

| TC-ID | 입력 | 검증 |
|-------|------|------|
| TC-01 | `[]` | 반환값 `[]`, 길이 0 |
| TC-02 | `[{ id:'name', type:'text', ... }]` | `accessorKey: 'name'`, header: 'name' 매핑 |
| TC-03 | `[{ id:'count', type:'number', ... }]` | cell 함수가 `formatNumberString` 적용된 renderer 반환 |
| TC-04 | `[{ id:'sel', type:'checkbox' }]` | `ColumnDef` 에 `accessorKey` 없음, `enableSorting: false` |
| TC-05 | `[{ id:'dt', type:'dateTime', width:'200' }]` | `size: 200`, `minSize` 계산 반영 |
| TC-06 | `[{ id:'x', type:'unknown_type' }]` | fallback 반환 + console.warn 호출 |
| TC-07 | `ColumnInfo[]` 입력 (`type:'boolean'`) | TomisColumnDef narrowing 후 Y/N cell 반환 |
| TC-08 | `visibility: false` | meta 또는 columnVisibility 초기값에 false 매핑 |
| TC-09 | `meta.primary: true` via `etc: 'primary'` | `meta.primary: true` 반환 |
| TC-10 | 여러 type 혼합 배열 5개 | 각 index별 type 올바른 분기 확인 |

### 타입 컴파일 테스트 (`column/createColumns.typetest.ts` — NEW)

```typescript
// TC-T01: TomisColumnDef 타입 안전성
const defs: TomisColumnDef<User>[] = [
  { id: 'name', type: 'text', name: '이름', align: 'left', width: '100' },
];
const cols: ColumnDef<User>[] = createColumns<User>(defs); // 컴파일 통과

// TC-T02: ColumnInfo 호환
const legacyDefs: ColumnInfo[] = [{ id: 'name', type: 'text', align: 'left', name: '이름', width: '100' }];
const legacyCols: ColumnDef<unknown>[] = createColumns(legacyDefs); // 컴파일 통과

// TC-T03: type에 'any' 없음
// @ts-expect-error
const bad: TomisColumnDef<User> = { id: 'x', type: 'invalid_type' as any, ... };
```

### Storybook Stories (`column/createColumns.stories.tsx` — NEW)

| Story | 내용 |
|-------|------|
| `AllTypes` | 9종 type 한 번에 렌더링 (placeholder renderer) |
| `WithLegacyColumnInfo` | ColumnInfo[] 입력 호환 |
| `EmptyDefs` | 빈 배열 — empty grid |
| `CheckboxOnly` | checkbox type DisplayColumnDef |

---

## Section 7. 구현 파일 목록 (Implementation Files)

| # | 경로 (topvel-grid-monorepo/…) | 구분 | 설명 |
|---|-------------------------------|------|------|
| 1 | `packages/grid-core/src/column/types.ts` | **NEW** | `TomisColumnDef<TData>`, `TomisColumnType`, `RendererFn<TData, TValue>`, `RendererRegistry<TData>` 타입 정의 |
| 2 | `packages/grid-core/src/column/rendererRegistry.ts` | **NEW** | `defaultRendererRegistry` Map — 9종 type 매핑 (MOD-GRID-05 pending 3종 = placeholder). `registerRenderer()` 함수. |
| 3 | `packages/grid-core/src/column/createColumns.ts` | **NEW** | 핵심 공개 API. `createColumns<TData>(defs)` 구현. rendererRegistry 조회 + type 분기 + fallback. |
| 4 | `packages/grid-core/src/column/createTomisColumnHelper.ts` | **NEW** | `createTomisColumnHelper<TData>()` = `createColumnHelper<TData>()` re-export (Option A). JSDoc + ADR 링크. |
| 5 | `packages/grid-core/src/legacy/ColumnInfo.ts` | **NEW** | DataTable `ColumnInfo` 인터페이스 정의 (동일 shape). `createColumns` 호환 명시. |
| 6 | `packages/grid-core/src/column/createColumns.test.ts` | **NEW** | 단위 테스트 TC-01~TC-10. Vitest. |
| 7 | `packages/grid-core/src/column/createColumns.typetest.ts` | **NEW** | TypeScript 컴파일 타입 테스트 TC-T01~TC-T03. |
| 8 | `packages/grid-core/src/column/createColumns.stories.tsx` | **NEW** | Storybook Stories 4개 (C-25). |
| 9 | `packages/grid-core/src/index.ts` | **MODIFY** | `createColumns`, `createTomisColumnHelper`, `TomisColumnDef`, `TomisColumnType`, `RendererRegistry`, `ColumnInfo` export 추가. |

**합계**: NEW 8 + MODIFY 1 = **9개 파일**

---

## Section 8. 설계 상세 (Design Details)

### 8.1 TomisColumnDef 타입 설계

```typescript
// column/types.ts

/** 9종 자동 renderer 분기 type union. AC-001 */
export type TomisColumnType =
  | 'checkbox'
  | 'number'
  | 'boolean'
  | 'dateTime'
  | 'date'
  | 'text'
  | 'badge'
  | 'link'
  | 'icon';

/**
 * TOMIS 표준 column 정의. TanStack `ColumnDef<TData>` 생성을 위한 입력 타입.
 *
 * `type` 필드로 자동 renderer 분기. `createColumns<TData>(defs)` 소비용.
 *
 * @typeParam TData - 행 데이터 타입
 * @see createColumns
 * @see TomisColumnType
 */
export interface TomisColumnDef<TData = unknown> {
  /** column accessor key (TData 키와 일치). checkbox type은 무시됨(AC-006). */
  id: string;
  /** 표시 헤더명 */
  name: string;
  /** 자동 renderer 분기 type. AC-001 참조. */
  type: TomisColumnType;
  /** 정렬 방향 — Tailwind class에 반영 ('left'|'center'|'right') */
  align: 'left' | 'center' | 'right';
  /** 픽셀 단위 너비 문자열 ('100', '200px' 등). 미제공 시 '100' 기본. */
  width?: string;
  /** false이면 column 숨김. 기본 true. */
  visibility?: boolean;
  /** 정렬 활성화 여부. checkbox는 강제 false. 기본 true. */
  enableSorting?: boolean;
  /** 크기 조절 활성화 여부. checkbox는 강제 false. 기본 true. */
  enableResizing?: boolean;
  /** 추가 메타데이터 */
  meta?: {
    /** primary key column 여부 */
    primary?: boolean;
    /** 임의 확장용 */
    [key: string]: unknown;
  };
  /** ColumnInfo 호환: 'primary' 포함 여부로 meta.primary 설정. EC-09 참조. */
  etc?: string;
}
```

**C-4 준수**: `unknown` 사용, `any` 없음.  
**C-29 준수**: `meta`, `width`, `visibility`, `enableSorting`, `enableResizing`는 모두 optional — 전달 시 spread skip 패턴 사용.

### 8.2 rendererRegistry 설계

```typescript
// column/rendererRegistry.ts

import type { CellContext } from '@tanstack/react-table';
import type { TomisColumnType } from './types';

/**
 * Registry entry: cell content 반환 함수.
 * AC-003: hard-coded if/else 금지. registry 조회만.
 * C-4: any 금지 — TValue=unknown 사용.
 */
export type RendererFn<TData = unknown> = (
  info: CellContext<TData, unknown>,
) => React.ReactNode;

/**
 * type → RendererFn 매핑 타입 (AC-003).
 * Map<TomisColumnType, RendererFn<TData>> 기반 — any 없음 (C-4).
 */
export type RendererRegistry<TData = unknown> = Map<TomisColumnType, RendererFn<TData>>;

/**
 * 기본 rendererRegistry (Map).
 *
 * **포맷터 주의 (D1)**: `number`/`dateTime` 포맷터(`formatNumberString`, `formatDateTimeFromDateTimeString`)는
 * MOD-GRID-05 pending 단계에서 `registerRenderer()`로 실제 구현을 주입받는다.
 * 이 Goal에서는 `number`/`dateTime`/`date`/`badge`/`link`/`icon`/`checkbox` 모두
 * `String(value)` plain text placeholder — 런타임 안전성 보장.
 * 실제 포맷터는 `tw-framework-front` 도구 함수를 MOD-GRID-05가 이식 또는 re-export.
 *
 * - MOD-GRID-05 구현 전: 9종 모두 placeholder.
 * - `checkbox`는 DisplayColumnDef로 분기되므로 registry 우선순위 낮음 (AC-006, D5).
 * - D1 결정: type 미등록 시 AC-007 fallback 적용.
 *
 * @see MOD-GRID-05 (실제 cell 컴포넌트 + 포맷터 제공)
 */
export const defaultRendererRegistry: RendererRegistry = new Map<TomisColumnType, RendererFn>([
  // L0: data-table.tsx L270–275 (formatNumberString → MOD-GRID-05 주입 예정)
  ['number', (info) => String(info.getValue() ?? '')],
  // L0: data-table.tsx L280–290
  ['boolean', (info) => (info.getValue() ? 'Y' : 'N')],
  // L0: data-table.tsx L295–310 (formatDateTimeFromDateTimeString → MOD-GRID-05 주입 예정)
  ['dateTime', (info) => String(info.getValue() ?? '')],
  // renderers/DateCell (MOD-GRID-05 pending → placeholder)
  ['date', (info) => String(info.getValue() ?? '')],
  // plain text (default)
  ['text', (info) => String(info.getValue() ?? '')],
  // renderers/BadgeCell (MOD-GRID-05 pending → placeholder)
  ['badge', (info) => String(info.getValue() ?? '')],
  // renderers/LinkCell (MOD-GRID-05 pending → placeholder)
  ['link', (info) => String(info.getValue() ?? '')],
  // renderers/IconCell (MOD-GRID-05 pending → placeholder, D5)
  ['icon', (info) => String(info.getValue() ?? '')],
  // checkbox: DisplayColumnDef 처리 (AC-006). registry entry는 fallback placeholder.
  ['checkbox', (info) => String(info.getValue() ?? '')],
]);

/**
 * 외부 renderer 등록 함수 (L2: AG Grid components 주입 패턴 참조).
 * Map.set() 사용 — any 없음 (C-4).
 * MOD-GRID-05에서 실제 컴포넌트 + 포맷터로 교체 시 사용.
 */
export function registerRenderer<TData = unknown>(
  type: TomisColumnType,
  fn: RendererFn<TData>,
  registry: RendererRegistry<TData> = defaultRendererRegistry as RendererRegistry<TData>,
): void {
  registry.set(type, fn);
}
```

**C-4 준수**: `Map<TomisColumnType, RendererFn>` 사용으로 `any` 완전 제거. `registry.set()` 타입 안전.  
**D1**: registry 미등록 type → `createColumns` 내부에서 plain text fallback + console.warn.  
**D5**: `checkbox`는 registry entry 있으나 `createColumns`에서 DisplayColumnDef 경로로 별도 처리.  
**포맷터 처리**: `number`/`dateTime` 포맷터는 이 Goal에서 placeholder. MOD-GRID-05가 `registerRenderer()`로 실제 구현 주입.

### 8.3 createColumns 핵심 로직

```typescript
// column/createColumns.ts (pseudo-code level)

export function createColumns<TData = unknown>(
  defs: TomisColumnDef<TData>[] | ColumnInfo[],
): ColumnDef<TData>[] {
  return defs.map((raw) => {
    // ColumnInfo narrowing (AC-005, D3)
    const def = isColumnInfo(raw) ? normalizeColumnInfo<TData>(raw) : raw;

    const baseWidth = parseInt(def.width?.trim() || '100', 10);
    const isCheckbox = def.type === 'checkbox';

    // meta 조합 (C-29 exactOptionalPropertyTypes)
    const primaryFlag =
      def.meta?.primary ?? def.etc?.toLowerCase().includes('primary') ?? false;
    const metaValue = { primary: primaryFlag, align: def.align };

    // checkbox → DisplayColumnDef (AC-006, D5)
    if (isCheckbox) {
      return {
        id: def.id,
        header: () => null, // placeholder — MOD-GRID-05 CheckboxCell
        cell: () => null,   // placeholder — MOD-GRID-05 CheckboxCell
        enableSorting: false,  // EC-08: 강제 false
        enableResizing: false,
        size: baseWidth,
        meta: metaValue,
      } satisfies ColumnDef<TData>;
    }

    // renderer 조회 — Map.get() 사용, any 없음 (AC-003, C-4)
    const renderFn = (defaultRendererRegistry as RendererRegistry<TData>).get(def.type);
    if (renderFn === undefined) {
      console.warn(`[createColumns] Unknown type: "${def.type}". Falling back to plain text.`);
    }

    return {
      accessorKey: def.id as keyof TData & string,
      header: def.name,
      cell: renderFn !== undefined
        ? (info: CellContext<TData, unknown>) => renderFn(info)
        : undefined, // TanStack 기본 cell (AC-007)
      size: baseWidth,
      minSize: baseWidth * 0.5,
      maxSize: baseWidth * 3,
      enableSorting: def.enableSorting !== false,
      enableResizing: def.enableResizing !== false,
      meta: metaValue,
      // EC-05 / OQ-01: visibility: false → 호출 측 initialState.columnVisibility 가이드.
      // ColumnDef 자체에는 visibility 개념 없음. createColumns 반환 후 아래처럼 사용:
      //   initialState: { columnVisibility: { [col.id]: false } }
      // meta.hidden 마킹은 MOD-GRID-01이 처리하기로 확정될 때까지 하지 않음 (OQ-01).
    } satisfies ColumnDef<TData>;
  });
}

/** ColumnInfo → TomisColumnDef narrowing (D3, AC-005) */
function isColumnInfo(def: TomisColumnDef | ColumnInfo): def is ColumnInfo {
  return 'name' in def && typeof (def as ColumnInfo).align === 'string'
    && !('meta' in def);
}

function normalizeColumnInfo<TData>(ci: ColumnInfo): TomisColumnDef<TData> {
  const type = isTomisColumnType(ci.type) ? ci.type : 'text';
  return {
    id: ci.id,
    name: ci.name,
    type,
    align: (ci.align as TomisColumnDef['align']) ?? 'left',
    ...(ci.width !== undefined && { width: ci.width }),
    ...(ci.visibility !== undefined && { visibility: ci.visibility }),
    ...(ci.etc !== undefined && { etc: ci.etc }),
  };
}

function isTomisColumnType(t: string): t is TomisColumnType {
  return ['checkbox','number','boolean','dateTime','date','text','badge','link','icon'].includes(t);
}
```

**C-29**: `...(ci.width !== undefined && { width: ci.width })` spread skip 패턴.  
**C-4**: generic `TData = unknown`, `any` 없음.

### 8.4 createTomisColumnHelper 설계 (D4)

```typescript
// column/createTomisColumnHelper.ts

/**
 * TanStack `createColumnHelper<TData>()` 순수 re-export.
 *
 * **ADR-MOD-GRID-04-001**: `.tomisColumn()` wrapper 메서드 없음 (Option A).
 * 이유: TanStack API 그대로 사용하면 학습 비용 0, 타입 보장 완벽.
 * `createColumns(defs)` 가 고수준 자동 분기 API, 이 함수는 저수준 수동 컨트롤 경로.
 *
 * @see createColumns — 자동 type 분기 고수준 API (권장)
 * @see ADR-MOD-GRID-04-001
 */
export { createColumnHelper as createTomisColumnHelper } from '@tanstack/react-table';
```

**D4 확정**: 순수 re-export. 추가 wrapper 없음.

### 8.5 번들 크기 예상 (C-21)

| 구성 요소 | 예상 gzip 기여 |
|----------|----------------|
| column/types.ts (타입만, 런타임 없음) | ~0 KB |
| column/rendererRegistry.ts (Map + 함수 9개) | ~1.5 KB |
| column/createColumns.ts (주 로직) | ~2.5 KB |
| column/createTomisColumnHelper.ts (re-export) | ~0.1 KB |
| legacy/ColumnInfo.ts (인터페이스 + normalizer) | ~0.5 KB |
| .test.ts / .typetest.ts / .stories.tsx (번들 미포함) | 0 KB |
| **이 Goal 런타임 총계** | **~4.6 KB** |
| **MOD-GRID-02까지 baseline** | **24.52 KB** |
| **예상 총계** | **~29.12 KB** |
| **C-21 한도** | **30 KB** |
| **여유** | **~0.88 KB** |

> **주의**: 실제 cell 컴포넌트(ReactNode 반환)가 MOD-GRID-05에서 추가될 때 번들이 추가 증가함. MOD-GRID-05 spec 작성 전 번들 측정 필수.

### 8.6 legacy/ColumnInfo.ts (D3, AC-005)

```typescript
// legacy/ColumnInfo.ts

/**
 * DataTable `ColumnInfo` 호환 alias.
 *
 * `tw-framework-front/src/components/DataTable/data-table-types.ts`의
 * ColumnInfo와 동일 shape. `createColumns()` 가 이 타입도 수용함 (AC-005).
 *
 * @deprecated 신규 코드에서는 `TomisColumnDef<TData>` 사용 권장.
 * @see createColumns
 * @see TomisColumnDef
 */
export interface ColumnInfo {
  id: string;
  type: string;    // string (union 아님) — createColumns 내부에서 narrowing
  align: string;
  name: string;
  width: string;
  visibility?: boolean;
  etc?: string;
}
```

---

## Section 9. 의존성 (Dependencies)

### 런타임 의존성 (peerDependencies, C-22)

| 패키지 | 버전 | 역할 |
|--------|------|------|
| `@tanstack/react-table` | `^8.21.3` | `createColumnHelper`, `ColumnDef`, `CellContext` |
| `react` | `^18.0.0 \|\| ^19.0.0` | `React.ReactNode` |

### 내부 의존성

| 모듈 | 관계 |
|------|------|
| MOD-GRID-01 (Grid) | `createColumns` 반환값 → `Grid columns={...}` prop 소비 |
| MOD-GRID-05 (Cell Renderers) | registry에 실제 컴포넌트 주입 (pending). 이 Goal에서 interface만 정의. |

### 빌드 의존성

| 도구 | 버전 |
|------|------|
| TypeScript | `^5.x` (`exactOptionalPropertyTypes: true`, C-29) |
| Vitest | 단위 테스트 |
| Storybook | Stories 작성 (C-25) |

---

## Section 10. 마이그레이션 가이드 (Migration Guide)

### DataTable 사용자 → createColumns 전환

**Before (AS-IS)**:
```typescript
// data-table.tsx L242–339 내부 로직 (페이지 직접 사용 불가)
const columns = columnInfoList.map((info) => {
  if (info.type === 'checkbox') { /* DisplayColumnDef 생성 */ }
  else if (info.type === 'number') { /* number formatter */ }
  // ... 5종 분기
});
```

**After (TO-BE)**:
```typescript
import { createColumns } from '@tomis/grid-core';
import type { TomisColumnDef } from '@tomis/grid-core';

// TomisColumnDef 직접 사용 (권장)
const defs: TomisColumnDef<User>[] = [
  { id: 'name', name: '이름', type: 'text', align: 'left', width: '150' },
  { id: 'salary', name: '급여', type: 'number', align: 'right', width: '120' },
  { id: 'sel', name: '', type: 'checkbox', align: 'center', width: '50' },
];
const columns = createColumns<User>(defs);

// 또는 기존 ColumnInfo[] 그대로 (AC-005 호환)
import type { ColumnInfo } from '@tomis/grid-core/legacy';
const legacyDefs: ColumnInfo[] = [...]; // 기존 코드 그대로
const columns = createColumns(legacyDefs);
```

### ColumnInfo → TomisColumnDef 완전 전환

```typescript
// 점진적 전환 — type 필드를 union으로 좁히면 자동완성 + 타입 오류 감지
const def: TomisColumnDef<User> = {
  id: 'createdAt',
  name: '생성일시',
  type: 'dateTime',   // 자동완성: 9종 union
  align: 'center',
  width: '180',
};
```

---

## Section 11. 구현 단계 (Implementation Steps)

> **ADR 의무 (C-14)**: 구현 시작 전 `ADR-MOD-GRID-04-001` 작성 — `createColumns` vs `createTomisColumnHelper` API 분리 설계 결정 기록.

### Step 1: column/types.ts 생성 (NEW)

**파일**: `packages/grid-core/src/column/types.ts`  
**내용**: `TomisColumnType`, `TomisColumnDef<TData>`, `RendererFn<TData, TValue>`, `RendererRegistry<TData>`  
**검증**: TypeScript 컴파일 통과, `any` 없음 (C-4)

### Step 2: column/rendererRegistry.ts 생성 (NEW)

**파일**: `packages/grid-core/src/column/rendererRegistry.ts`  
**내용**: `defaultRendererRegistry` (9종 entry — MOD-GRID-05 pending 3종 = placeholder), `registerRenderer()`  
**검증**: D1 — registry 조회 동작 확인. D5 — checkbox/icon entry 존재 확인.

### Step 3: column/createColumns.ts 생성 (NEW)

**파일**: `packages/grid-core/src/column/createColumns.ts`  
**내용**:
- `createColumns<TData>(defs: TomisColumnDef<TData>[] | ColumnInfo[]): ColumnDef<TData>[]`
- `isColumnInfo()`, `normalizeColumnInfo<TData>()`, `isTomisColumnType()` 내부 헬퍼
- checkbox → DisplayColumnDef (AC-006, D5)
- registry 조회 + fallback (AC-003, AC-007, D1)
- width parsing, meta 조합, C-29 spread skip

**검증**: TC-01~TC-10 단위 테스트 통과

### Step 4: column/createTomisColumnHelper.ts 생성 (NEW)

**파일**: `packages/grid-core/src/column/createTomisColumnHelper.ts`  
**내용**: `createColumnHelper` re-export as `createTomisColumnHelper`. JSDoc with ADR-MOD-GRID-04-001 링크.  
**검증**: D4 — `.tomisColumn()` 없음 확인. 타입 테스트 TC-T01 통과.

### Step 5: legacy/ColumnInfo.ts 생성 (NEW)

**파일**: `packages/grid-core/src/legacy/ColumnInfo.ts`  
**내용**: `ColumnInfo` 인터페이스 정의 (DataTable 동일 shape). `@deprecated` JSDoc.  
**검증**: D3 — `createColumns(legacyDefs: ColumnInfo[])` 호출 타입 통과. AC-005 확인.

### Step 6: index.ts 수정 (MODIFY)

**파일**: `packages/grid-core/src/index.ts`  
**추가 export**:
```typescript
// MOD-GRID-04: Column Factory
export { createColumns } from './column/createColumns';
export { createTomisColumnHelper } from './column/createTomisColumnHelper';
export { defaultRendererRegistry, registerRenderer } from './column/rendererRegistry';
export type {
  TomisColumnDef,
  TomisColumnType,
  RendererFn,
  RendererRegistry,
} from './column/types';
// legacy alias (DataTable 호환)
export type { ColumnInfo } from './legacy/ColumnInfo';
```
**검증**: E-01/G-01 — Section 7 파일 목록과 동일 9개 (NEW 8 + MODIFY 1). 기존 export 변경 없음 (backward compat).

### Step 7: 테스트 작성 (NEW)

**파일**: `packages/grid-core/src/column/createColumns.test.ts` (Section 7 #6)  
**파일**: `packages/grid-core/src/column/createColumns.typetest.ts` (Section 7 #7)  
**내용**: TC-01~TC-10 (단위 테스트) + TC-T01~TC-T03 (타입 컴파일 테스트)  
**검증**: `vitest run` 전체 통과. TC-04 checkbox → accessorKey 없음 확인. TC-06 unknown type → console.warn 확인.

### Step 8: Storybook Stories 작성 (NEW, C-25)

**파일**: `packages/grid-core/src/column/createColumns.stories.tsx` (Section 7 #8)  
**내용**: AllTypes / WithLegacyColumnInfo / EmptyDefs / CheckboxOnly 4개 Story  
**검증**: Storybook 빌드 에러 없음. C-25 JSDoc + Story 동시 충족 확인.

---

## Section 12. 위험 및 완화 (Risks & Mitigations)

| 위험 | 심각도 | 완화 |
|------|--------|------|
| **번들 초과 (C-21)** | HIGH | 실제 cell 컴포넌트는 MOD-GRID-05로 분리. 이 Goal = 타입 + 인터페이스 + 최소 placeholder. 구현 후 번들 측정 필수. |
| **MOD-GRID-05 미완 (D1, D5)** | MEDIUM | placeholder 패턴으로 기능 분리. `badge`/`link`/`icon`/`checkbox`는 plain text fallback으로 런타임 안전. |
| **ColumnInfo string type (D3, EC-04)** | LOW | `isTomisColumnType()` narrowing + EC-02 fallback으로 처리. console.warn으로 사용자에게 알림. |
| **checkbox EC-08 enableSorting 강제** | LOW | 명시적 `false` 강제 overwrite. L0 패턴 보존. |
| **C-29 exactOptionalPropertyTypes** | MEDIUM | 모든 optional 전달에 spread skip 패턴 의무화. TypeScript 컴파일 시 자동 검출. |
| **ADR 미작성 (C-14)** | MEDIUM | 구현 Step 1 이전에 ADR-MOD-GRID-04-001 작성을 CI 체크리스트에 포함. |

---

## Section 13. 열린 질문 (Open Questions)

| # | 질문 | 현재 결정 | 재검토 조건 |
|---|------|----------|------------|
| OQ-01 | `visibility: false` column을 `ColumnDef` 레벨에서 처리할지 vs `initialState.columnVisibility` 가이드로 위임할지? | **결정: 위임** — `_tomisHidden` meta 마킹 없음. `createColumns` 반환 후 호출 측이 `initialState.columnVisibility` 직접 구성. ColumnDef 자체에 visibility 개념 없음(TanStack 표준). | 변경 불필요. MOD-GRID-01 추가 처리 요청 시 별도 Goal에서 검토. |
| OQ-02 | `'badge'` type의 badge color/variant는 어떤 prop으로 전달? | MOD-GRID-05 spec에서 결정. 현재 placeholder. | MOD-GRID-05 G-001 Spec 작성 시. |
| OQ-03 | `'link'` type의 href는 data 필드에서 파생? 별도 prop? | MOD-GRID-05 spec에서 결정. 현재 `String(value)` placeholder. | MOD-GRID-05 G-001 Spec 작성 시. |
| OQ-04 | `registerRenderer()` 를 public API로 export할지 내부 패턴으로만 남길지? | 현재 public export (Section 11 Step 6). MOD-GRID-05가 이를 활용. | MOD-GRID-05 실제 연동 후 필요 시 internal로 이동. |
| OQ-05 | `createTomisColumnHelper` 이름이 너무 길다는 피드백 시 단축 alias? | 현재 그대로 (ADR-MOD-GRID-04-001 근거). | User/팀 피드백 수집 후 v2에서 검토. |

---

*Spec 완료 — specify-rubric v1.0.4 medium threshold (90) 대상.*  
*구현 전 ADR-MOD-GRID-04-001 작성 필수 (C-14).*  
*MOD-GRID-05 연동 후 번들 크기 재측정 필수 (C-21).*
