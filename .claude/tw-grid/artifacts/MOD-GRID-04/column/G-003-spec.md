# MOD-GRID-04 / column / G-003 Spec

**Goal**: `useColumnPersistence` + `ColumnVisibilityMenu` — 컬럼 가시성·순서 영속화  
**Spec version**: 1.0.0  
**Date**: 2026-05-14  
**Author**: tw-grid Spec Writer Agent  
**Rubric**: specify-rubric v1.0.5 — medium threshold (90)  
**Status**: DRAFT

---

## D# 결정 요약

| ID | 결정 내용 |
|----|-----------|
| D1 | MOD-GRID-02/G-006 (`useStoragePersist`) PENDING → G-003은 `useColumnPersistence.ts` 내부에 localStorage R/W 로직을 self-contained embed. G-006 완료 후 내부 구현을 `useStoragePersist` 호출로 교체 가능 (public API 변경 없음, semver minor, breaking=false). AC-002 wording은 "embed" 표현 사용. |
| D2 | 모든 implementFiles 경로 접두사: `topvel-grid-monorepo/packages/grid-core/` (C-28 준수). `TOMIS/packages/` 접두사 사용 금지. |
| D3 | ColumnVisibilityMenu UI: 네이티브 HTML `<details>` + `<summary>` + `<input type="checkbox">` 패턴 채택. `grid-core/package.json` peerDeps에 Radix UI·react-icons 없음 (확인 완료). 추가 peerDep 없이 구현. DataTable `data-table-view-options.tsx` DropdownMenu 구조는 동등한 네이티브 HTML로 의미 재현. Tailwind CSS만 사용 (C-5). |
| D4 | `useColumnPersistence<TData>` 시그니처: `(table: Table<TData>, options: ColumnPersistenceOptions) => void`. `ColumnPersistenceOptions`: `{ storageKey: string; version?: number; persist?: ('visibility' \| 'order')[] }`. table 인스턴스를 직접 받아 visibility/order state를 read·write. |
| D5 | localStorage 저장 포맷: `{ v: number; data: { visibility?: VisibilityState; order?: ColumnOrderState } }`. 복원 시 저장된 `v`와 현재 `version` 불일치 → `localStorage.removeItem(storageKey)` + fallback(빈 상태) 사용. |
| D6 | enableColumnFilter/enablePinning 표준 매핑 (G-001 harnessReview cascadingFeedback): G-002에서 재차 G-003으로 이월됨. G-003 범위(가시성·순서 영속화)와 무관하므로 또다시 이월. 별도 G-004-ext Goal로 분리하여 처리 예정 (column/types.ts leaf 수준 prop 확장). |

**파일 구성 (D# breakdown)**: NEW 5 + MODIFY 3 = **총 8개**

| # | 파일 | 구분 |
|---|------|------|
| 1 | `packages/grid-core/src/column/useColumnPersistence.ts` | NEW |
| 2 | `packages/grid-core/src/column/ColumnVisibilityMenu.tsx` | NEW |
| 3 | `packages/grid-core/src/column/useColumnPersistence.test.ts` | NEW |
| 4 | `packages/grid-core/src/column/ColumnVisibilityMenu.test.tsx` | NEW |
| 5 | `packages/grid-core/src/column/ColumnVisibilityMenu.stories.tsx` | NEW |
| 6 | `packages/grid-core/src/index.ts` | MODIFY |
| 7 | `packages/grid-core/src/Grid.tsx` | MODIFY |
| 8 | `packages/grid-core/src/types.ts` | MODIFY |

---

## Section 1. 참조 출처 (Source References)

### 1.1 L0 — AS-IS 소스 (직접 마이그레이션 대상)

| 파일 | 역할 | 핵심 라인 |
|------|------|----------|
| `tw-framework-front/src/components/DataTable/data-table-view-options.tsx` | 컬럼 가시성 메뉴 원본 UI. DropdownMenu + checkbox 패턴, `column.toggleVisibility()`, `column.getCanHide()` 사용. G-003 ColumnVisibilityMenu의 직접 마이그레이션 원본. | L1–83 (전체) |
| `tw-framework-front/src/components/DataTable/data-table.tsx` | `columnVisibility` state (`useState<VisibilityState>({})`), `onColumnVisibilityChange` 콜백, DataTableViewOptions 렌더링 위치. columnOrder/persist 없음 (G-003 신기능). | L79, L111, L483 |

**data-table-view-options.tsx 핵심 로직 (D3 네이티브 변환 기준)**:
```tsx
// L0 원본 (TOMIS-internal — grid-core에서 직접 사용 불가)
// 1. Filter: typeof column.accessorFn !== "undefined" && column.getCanHide()
// 2. Label: column.columnDef.header?.toString() || column.id
// 3. Toggle: column.toggleVisibility(!!value)
// 4. Open state: useState(false)
// 5. UI: DropdownMenuCheckboxItem per column

// G-003 ColumnVisibilityMenu 네이티브 변환 등가:
// 1. Filter: 동일 (accessorFn + getCanHide)
// 2. Label: 동일
// 3. Toggle: 동일 (column.toggleVisibility)
// 4. Open state: <details> open attribute 네이티브 관리
// 5. UI: <input type="checkbox"> per column
```

### 1.2 L1 — TanStack Table v8 공식 API

| API | 용도 |
|-----|------|
| `column.getIsVisible()` | 현재 가시성 조회 |
| `column.toggleVisibility(value?: boolean)` | 가시성 토글 / 명시적 설정 |
| `column.getCanHide()` | 숨김 가능 여부 (enableHiding 반영) |
| `table.getAllColumns()` | 전체 컬럼 목록 (leaf + group 포함) |
| `table.getAllLeafColumns()` | leaf 컬럼만 (accessorFn 있는 것) |
| `table.getState().columnVisibility` | 현재 VisibilityState 스냅샷 |
| `table.getState().columnOrder` | 현재 ColumnOrderState 스냅샷 |
| `table.setColumnVisibility(updater)` | visibility 일괄 설정 |
| `table.setColumnOrder(updater)` | order 일괄 설정 |
| `VisibilityState` | `Record<string, boolean>` |
| `ColumnOrderState` | `string[]` |

**peer dep**: `@tanstack/react-table@^8.0.0` (기존 peerDep, 추가 없음)

### 1.3 L2 — publish 참조 (AG Grid R-A + Wijmo R-W 동등 기능)

| 태그 | 참조 | 내용 |
|------|------|------|
| R-A | AG Grid `applyColumnState` | column visibility + order를 단일 API로 적용. `{ colId, hide, pinned }` 배열. G-003의 `useColumnPersistence` localStorage restore 패턴에 대응. |
| R-A | AG Grid `getColumnState()` | 현재 상태 직렬화. G-003의 `table.getState().columnVisibility` + `columnOrder` 조합에 대응. |
| R-W | Wijmo `persistColumnLayout` | FlexGrid의 컬럼 레이아웃(가시성·너비·순서) localStorage 영속화 기능. `columnLayout` property 직렬화 후 복원 패턴. G-003 `useColumnPersistence` localStorage R/W 패턴 참조. |

### 1.4 L3 — 제약사항 참조

| 제약 | 내용 |
|------|------|
| C-4 | `any` 타입 금지. `Table<TData>` generic 사용. |
| C-5 | Tailwind CSS only. ColumnVisibilityMenu 인라인 style 금지. |
| C-6 | backward compat. Grid.tsx `columnPersistence` prop: optional, 미지정 시 기존 동작 유지. |
| C-12 | tsc 0 errors. `exactOptionalPropertyTypes` 준수 (C-29). |
| C-21 | bundle ≤ 30KB. G-003 추가분 ≤ 3KB 목표. |
| C-25 | JSDoc 필수. useColumnPersistence + ColumnVisibilityMenu 모두 JSDoc 작성. |
| C-27 | spec authority. 구현 시 이 spec이 정규 출처. |
| C-28 | implementFiles 경로: `topvel-grid-monorepo/packages/...` 접두사 필수. |
| C-29 | optional prop spread-skip: `{...(prop !== undefined ? { prop } : {})}` 패턴 의무. |
| C-31 | NEW 파일은 반드시 caller 연결. useColumnPersistence → Grid.tsx, ColumnVisibilityMenu → Grid.tsx + stories. |

**migrationImpact**: medium (DataTable view-options 흡수 + useStoragePersist 통합 + ColumnVisibilityMenu UI 신설, C-17 시각 회귀 검증 의무)

---

## Section 2. Goal 정의

**Goal ID**: MOD-GRID-04/column/G-003  
**Goal 명**: 컬럼 가시성 + 순서 영속화 (useColumnPersistence + ColumnVisibilityMenu)  
**마이그레이션 임팩트**: medium  
**의존성**:  
- MOD-GRID-04/G-001 (createColumns) — **completed**  
- MOD-GRID-02/G-006 (useStoragePersist) — **PENDING** (D1: self-contained 구현으로 대응)

**목적**:  
DataTable `data-table-view-options.tsx`의 컬럼 가시성 메뉴 UI를 `ColumnVisibilityMenu` 컴포넌트로 흡수하고, localStorage 기반의 `useColumnPersistence` hook으로 컬럼 가시성·순서 상태를 영속화한다. Grid 컴포넌트에 `columnPersistence` prop을 추가하여 소비자가 선택적으로 활성화할 수 있도록 한다.

**범위**:  
- `useColumnPersistence.ts`: localStorage R/W, 버전 검증, SSR 안전  
- `ColumnVisibilityMenu.tsx`: 네이티브 HTML UI (Tailwind only), `Table<TData>` prop  
- `Grid.tsx`: `columnPersistence` prop 수신 → useColumnPersistence 호출, ColumnVisibilityMenu 조건부 렌더링  
- `types.ts`: `GridProps<TData>`에 `columnPersistence?: ColumnPersistenceOptions` 추가

---

## Section 3. Acceptance Criteria (AC)

| AC | 구분 | 내용 | 출처 |
|----|------|------|------|
| AC-001 | 기능 | `useColumnPersistence(table, { storageKey, version?, persist? })` 호출 시 columnVisibility (및 persist에 'order' 포함 시 columnOrder) 변경이 자동으로 localStorage에 저장된다. | [L1: table.getState().columnVisibility, table.setColumnVisibility] |
| AC-002 | 기능 | useColumnPersistence는 localStorage 영속화 로직을 self-contained embed 방식으로 구현한다. MOD-GRID-02/G-006 완료 후 내부 구현을 useStoragePersist 호출로 교체 가능하며 public API는 변경되지 않는다 (D1). | [C-6: backward compat] |
| AC-003 | 기능 | `persist` 배열 미지정 시 기본값 `['visibility']`로 동작한다. `['visibility', 'order']` 명시 시 양쪽 모두 저장·복원한다. | [L1: VisibilityState, ColumnOrderState] |
| AC-004 | 기능 | `ColumnVisibilityMenu<TData>` 컴포넌트는 `table: Table<TData>` prop을 받아 accessorFn이 있고 `getCanHide()===true`인 컬럼 목록을 체크박스로 표시한다. | [L0: data-table-view-options.tsx; L1: column.getCanHide()] |
| AC-005 | 기능 | 체크박스 변경 시 `column.toggleVisibility(!!value)`를 즉시 호출하여 Grid 렌더링에 반영된다. | [L0: data-table-view-options.tsx L57; L1: column.toggleVisibility()] |
| AC-006 | 기능 | `Grid` 컴포넌트에 `columnPersistence` prop을 추가한다. prop 미지정(undefined) 시 기존 동작 완전 유지 (C-6 backward compat). | [C-6: backward compat; L3: constraints.md C-6] |

---

## Section 4. Non-Functional Requirements (NFR)

| NFR | 내용 |
|-----|------|
| NFR-001 | bundle 추가분 ≤ 3 KB (gzip). useColumnPersistence + ColumnVisibilityMenu 합산 (C-21 전체 ≤ 30KB). |
| NFR-002 | SSR/incognito 환경: localStorage 접근 시 try/catch. 실패 시 persist 기능 무음 skip, UI 정상 렌더링. |
| NFR-003 | tsc --noEmit 0 errors. exactOptionalPropertyTypes 하에서 optional prop spread-skip 패턴 사용 (C-29). |
| NFR-004 | useColumnPersistence + ColumnVisibilityMenu 모두 JSDoc 블록 작성 (C-25). |
| NFR-005 | Tailwind CSS class만 사용. ColumnVisibilityMenu 인라인 style 금지 (C-5). |
| NFR-006 | useColumnPersistence는 storageKey 미지정(빈 문자열) 시 localStorage 접근 없이 no-op. |
| NFR-007 | ColumnVisibilityMenu는 체크박스 label 클릭 시 column.toggleVisibility 한 번만 호출 (label htmlFor + input onChange 이중 트리거 방지). |

### Breaking Change 분석 (D-03)

**Breaking change: NO**

| 항목 | 판정 | 근거 |
|------|------|------|
| `GridProps<TData>` 변경 | 비파괴 | `columnPersistence?: ColumnPersistenceOptions` optional 추가. 기존 소비자 코드 변경 불필요. |
| Grid.tsx 내부 state 추가 | 비파괴 | columnVisibility, columnOrder state 신규 추가. 기존 state(sorting, rowSelection 등) 무변경. |
| index.ts export 추가 | 비파괴 | 신규 심볼 export. 기존 import 무변경. |
| columnPersistence 미지정 시 동작 | 동일 | useColumnPersistence no-op + ColumnVisibilityMenu 미렌더링. 기존 Grid 동작 100% 동일. |

**Deprecation 전략**: N/A (breaking change 없음).

### 롤백 전략 (D-05)

`columnPersistence` prop은 optional이므로 롤백이 필요한 경우:
1. Grid 소비자에서 `columnPersistence` prop을 제거하면 즉시 G-003 이전 동작으로 복귀.
2. index.ts의 G-003 export를 제거해도 기존 export 불변.
3. 기능 플래그 불필요 — prop 유무 자체가 feature flag 역할.

**영향 사용처: 0개**  
G-003은 신규 prop + 신규 파일 추가이므로 기존 사용처 파일 변경 없음. `affectedUsageFiles: []`.

---

## Section 5. Edge Cases (EC)

| EC | 시나리오 | 기대 동작 |
|----|----------|-----------|
| EC-001 | version 불일치: localStorage에 `{ v: 1, ... }` 저장, 현재 version=2 | `localStorage.removeItem(storageKey)` 후 초기 상태 사용 (D5) |
| EC-002 | storageKey 미지정/빈 문자열 `""` | localStorage 접근 없이 no-op. 컬럼 상태는 Grid 내부 state만 관리 (NFR-006) |
| EC-003 | localStorage 접근 불가 (SSR/incognito/quota 초과) | try/catch로 무음 처리. persist 기능 비활성화, ColumnVisibilityMenu + Grid 정상 동작 (NFR-002) |
| EC-004 | persist 옵션 미지정 | 기본값 `['visibility']` 적용. columnOrder는 저장·복원 안 됨 (AC-003) |
| EC-005 | 중첩 grouped columns (depth ≥ 2) | `table.getAllLeafColumns()`로 leaf만 조회. group header 컬럼은 ColumnVisibilityMenu에 표시 안 됨 (accessorFn undefined 조건으로 필터) |
| EC-006 | columnPersistence prop undefined (미지정) | Grid.tsx: useColumnPersistence 호출 없음, ColumnVisibilityMenu 렌더링 없음. 기존 동작 100% 유지 (AC-006, C-6) |
| EC-007 | 페이지 새로고침 후 localStorage에 저장된 데이터 복원 시 컬럼이 감소(컬럼 재정의)된 경우 | 저장된 visibility 키 중 현재 컬럼에 없는 것은 무시. table.setColumnVisibility에 unknown key 전달 시 TanStack이 silently ignore. |

---

## Section 6. Test Cases (TC)

| TC | 설명 | 입력 | 기대 결과 |
|----|------|------|-----------|
| TC-001 | 기본 영속화 | 컬럼 A 숨김 후 useColumnPersistence 적용 | localStorage[storageKey]에 `{ v:1, data:{ visibility:{ A:false } } }` 저장 |
| TC-002 | 새로고침 복원 | TC-001 저장 후 hook 재실행 | table.setColumnVisibility 호출됨, A 컬럼 숨겨진 상태로 복원 |
| TC-003 | version 불일치 무효화 | localStorage에 `{ v:1, ... }` 저장, version=2 option | removeItem 호출, 빈 visibility 상태로 초기화 |
| TC-004 | visibility + order 동시 영속화 | persist: ['visibility','order'], 컬럼 순서 변경 | localStorage에 visibility + order 모두 포함 |
| TC-005 | persist=['visibility'] only | order 변경해도 localStorage 저장 안 됨 | localStorage[storageKey].data에 order 키 없음 |
| TC-006 | SSR 안전 | typeof window === 'undefined' 환경에서 hook 실행 | localStorage 접근 없음, 에러 throw 없음 |
| TC-007 | ColumnVisibilityMenu 렌더링 | table with 3 columns (1 getCanHide=false) | 2개 체크박스만 렌더링 |
| TC-008 | 체크박스 토글 | 체크박스 변경 이벤트 발생 | column.toggleVisibility 1회 호출 (이중 트리거 없음, NFR-007) |

---

## Section 7. 구현 파일 목록 (implementFiles)

**파일 구성 (D# breakdown)**: NEW 5 + MODIFY 3 = **총 8개**

| # | 구분 | 파일 (topvel-grid-monorepo 기준 상대경로) | 설명 |
|---|------|------------------------------------------|------|
| 1 | NEW | `packages/grid-core/src/column/useColumnPersistence.ts` | localStorage R/W hook. Table<TData> + ColumnPersistenceOptions. self-contained embed (D1). |
| 2 | NEW | `packages/grid-core/src/column/ColumnVisibilityMenu.tsx` | 네이티브 HTML 가시성 메뉴 컴포넌트. Table<TData> prop. Tailwind only (D3). |
| 3 | NEW | `packages/grid-core/src/column/useColumnPersistence.test.ts` | TC-001~TC-006 단위 테스트 (vitest + @testing-library). |
| 4 | NEW | `packages/grid-core/src/column/ColumnVisibilityMenu.test.tsx` | TC-007~TC-008 컴포넌트 테스트. |
| 5 | NEW | `packages/grid-core/src/column/ColumnVisibilityMenu.stories.tsx` | Storybook story (AC-25). Default + 일부컬럼숨김 variant. |
| 6 | MODIFY | `packages/grid-core/src/index.ts` | G-003 공개 API export 추가 (useColumnPersistence, ColumnVisibilityMenu, ColumnPersistenceOptions). |
| 7 | MODIFY | `packages/grid-core/src/Grid.tsx` | columnPersistence prop 수신, columnVisibility/columnOrder state 추가, useColumnPersistence 호출, ColumnVisibilityMenu 조건부 렌더링. |
| 8 | MODIFY | `packages/grid-core/src/types.ts` | GridProps<TData>에 `columnPersistence?: ColumnPersistenceOptions` 추가. |

---

## Section 8. 설계 세부사항

### 8.0 영향 사용처 (D-01)

**영향 사용처: 0개 (파일 목록 없음)**

G-003은 `GridProps<TData>`에 `columnPersistence?: ColumnPersistenceOptions` optional prop을 추가하고, 신규 파일(useColumnPersistence.ts + ColumnVisibilityMenu.tsx)을 생성한다. 기존 소비자(페이지 레벨 파일)는 코드 변경 없이 기존 동작 유지. `affectedUsageFiles: []`.

**8 variant 호환성 확인**:
| variant | 영향 | 이유 |
|---------|------|------|
| BaseGrid | 없음 | legacy alias, Grid 내부 state 변경 미노출 |
| VirtualGrid | 없음 | 동일 |
| ColumnPinGrid | 없음 | 동일 |
| GroupedHeaderGrid | 없음 | 동일 |
| TreeGrid | 없음 | 동일 |
| DataTable (TOMIS) | 없음 | G-003 대상은 grid-core monorepo, DataTable 미변경 |

### 8.1 ColumnPersistenceOptions 타입

```typescript
// packages/grid-core/src/column/useColumnPersistence.ts

import type { Table } from '@tanstack/react-table';
import type { VisibilityState, ColumnOrderState } from '@tanstack/react-table';

/** localStorage 영속화 대상 state 종류 */
export type PersistTarget = 'visibility' | 'order';

/** useColumnPersistence 옵션 */
export interface ColumnPersistenceOptions {
  /** localStorage 키. 빈 문자열 시 no-op (NFR-006). */
  storageKey: string;
  /**
   * 스키마 버전 (정수). 저장값 버전과 불일치 시 캐시 무효화 (D5, EC-001).
   * @default 1
   */
  version?: number;
  /**
   * 영속화 대상 상태 종류.
   * @default ['visibility']
   */
  persist?: PersistTarget[];
}

/** localStorage 저장 포맷 (D5) */
interface PersistedData {
  v: number;
  data: {
    visibility?: VisibilityState;
    order?: ColumnOrderState;
  };
}
```

### 8.2 useColumnPersistence 구현 패턴

```typescript
/**
 * 컬럼 가시성·순서를 localStorage에 영속화하는 hook.
 *
 * @remarks
 * MOD-GRID-02/G-006 (useStoragePersist) 완료 후 내부 구현을 해당 hook 호출로 교체 가능.
 * public API는 변경되지 않는다 (D1).
 *
 * @example
 * ```tsx
 * useColumnPersistence(table, { storageKey: 'emp-grid', version: 1 });
 * ```
 */
export function useColumnPersistence<TData>(
  table: Table<TData>,
  options: ColumnPersistenceOptions,
): void {
  const { storageKey, version = 1, persist = ['visibility'] } = options;

  // 1. Mount 시 복원
  useEffect(() => {
    if (!storageKey) return; // EC-002
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed: PersistedData = JSON.parse(raw);
      if (parsed.v !== version) {
        // EC-001: version 불일치 → 캐시 무효화
        localStorage.removeItem(storageKey);
        return;
      }
      if (parsed.data.visibility && persist.includes('visibility')) {
        table.setColumnVisibility(parsed.data.visibility);
      }
      if (parsed.data.order && persist.includes('order')) {
        table.setColumnOrder(parsed.data.order);
      }
    } catch {
      // EC-003: SSR/incognito/quota → 무음 처리
    }
  }, []); // mount-only

  // 2. state 변경 시 저장
  const { columnVisibility, columnOrder } = table.getState();
  useEffect(() => {
    if (!storageKey) return;
    try {
      const data: PersistedData['data'] = {};
      if (persist.includes('visibility')) data.visibility = columnVisibility;
      if (persist.includes('order')) data.order = columnOrder;
      const payload: PersistedData = { v: version, data };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // EC-003
    }
  }, [storageKey, version, persist, columnVisibility, columnOrder]);
}
```

> **주의**: `persist` 배열은 reference stable이어야 한다. 소비자가 인라인 배열 `persist={['visibility','order']}`를 전달하면 매 렌더마다 새 배열 참조 → useEffect 무한 루프. **구현자는 useEffect deps에서 `persist`를 `persist.join(',')`으로 직렬화**하거나 `useMemo` 안내를 JSDoc에 추가한다.

### 8.3 ColumnVisibilityMenu 구현 패턴 (D3 — 네이티브 HTML)

```tsx
/**
 * 컬럼 가시성 메뉴 컴포넌트.
 * data-table-view-options.tsx(L0) DropdownMenu 패턴을 네이티브 HTML로 재현.
 *
 * @example
 * ```tsx
 * <ColumnVisibilityMenu table={table} triggerLabel="컬럼 설정" />
 * ```
 */
export function ColumnVisibilityMenu<TData>({
  table,
  triggerLabel = '리스트 항목 설정',
  menuLabel = '표시할 항목 선택',
  className,
}: ColumnVisibilityMenuProps<TData>) {
  // 네이티브 <details> open 상태는 브라우저가 관리 (L0의 useState(false) 등가)
  const leafColumns = table.getAllLeafColumns().filter(
    (col) => col.getCanHide(), // EC-005: accessorFn check는 getCanHide()가 포함
  );

  return (
    <details className={cn('relative inline-block', className)}>
      <summary className="cursor-pointer list-none">
        <button type="button" className="ml-auto hidden h-6 lg:flex items-center gap-1 px-2 text-sm border rounded">
          {/* L0 FaCog 아이콘 → SVG inline (react-icons 없음, D3) */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.34.07-.68.07-1.08s-.03-.74-.07-1.08l2.32-1.8c.21-.16.27-.46.13-.7l-2.2-3.8c-.14-.24-.42-.32-.66-.24l-2.74 1.1c-.57-.44-1.18-.8-1.86-1.08L14.93 3c-.05-.27-.27-.46-.53-.46H9.6c-.26 0-.47.19-.5.46l-.41 2.9c-.68.28-1.3.64-1.86 1.08L4.09 6.42c-.24-.08-.52 0-.66.24l-2.2 3.8c-.14.24-.08.54.13.7l2.32 1.8c-.04.34-.07.69-.07 1.08s.03.74.07 1.08l-2.32 1.8c-.21.16-.27.46-.13.7l2.2 3.8c.14.24.42.32.66.24l2.74-1.1c.57.44 1.18.8 1.86 1.08l.41 2.9c.04.27.26.46.52.46h4.4c.26 0 .48-.19.52-.46l.41-2.9c.68-.28 1.3-.64 1.86-1.08l2.74 1.1c.24.08.52 0 .66-.24l2.2-3.8c.14-.24.08-.54-.13-.7l-2.32-1.8Z"/>
          </svg>
          {triggerLabel}
        </button>
      </summary>
      <div className="absolute right-0 z-[9999] mt-1 w-56 rounded border bg-white shadow-md">
        <p className="px-3 py-2 text-xs font-semibold text-gray-500">{menuLabel}</p>
        <ul className="max-h-64 overflow-auto py-1">
          {leafColumns.map((col) => {
            const id = `col-vis-${col.id}`;
            const label = col.columnDef.header?.toString() ?? col.id;
            return (
              <li key={col.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                <input
                  id={id}
                  type="checkbox"
                  checked={col.getIsVisible()}
                  onChange={(e) => col.toggleVisibility(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                {/* NFR-007: label htmlFor 클릭 → input onChange 단일 트리거 */}
                <label htmlFor={id} className="flex-1 cursor-pointer select-none text-sm">
                  {label}
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
```

**ColumnVisibilityMenuProps 타입**:
```typescript
export interface ColumnVisibilityMenuProps<TData> {
  table: Table<TData>;
  /** 트리거 버튼 텍스트. @default '리스트 항목 설정' */
  triggerLabel?: string;
  /** 메뉴 상단 라벨. @default '표시할 항목 선택' */
  menuLabel?: string;
  /** 루트 <details> 추가 className. */
  className?: string;
}
```

### 8.4 Grid.tsx 수정 사항 (AC-006, C-31)

```typescript
// types.ts 추가
export interface GridProps<TData extends RowData = RowData> {
  // ... 기존 props ...
  /**
   * 컬럼 가시성·순서 localStorage 영속화 옵션.
   * 미지정 시 영속화 비활성 (C-6 backward compat).
   */
  columnPersistence?: ColumnPersistenceOptions;
}

// Grid.tsx 수정
// 1. columnVisibility state 추가 (현재 없음)
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
// 2. columnOrder state 추가 (현재 없음)
const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
// 3. useReactTable options에 추가
state: {
  // ... 기존 state ...
  columnVisibility,
  columnOrder,
},
onColumnVisibilityChange: setColumnVisibility,
onColumnOrderChange: setColumnOrder,
// 4. useColumnPersistence 조건부 호출 (C-29 spread-skip)
// columnPersistence가 정의된 경우에만 hook 활성화
// 참고: React rules-of-hooks 준수를 위해 항상 호출하되 storageKey=""로 no-op 처리
useColumnPersistence(table, columnPersistence ?? { storageKey: '' });
// 5. ColumnVisibilityMenu 조건부 렌더링
{columnPersistence !== undefined && <ColumnVisibilityMenu table={table} />}
```

> **Hook 호출 순서 규칙**: `columnPersistence` prop이 optional이므로 조건부 hook 호출 불가. 대신 `storageKey: ''` fallback 패턴으로 항상 hook 호출하되 내부에서 no-op (NFR-006, EC-002).

### 8.5 Bundle 영향

| 항목 | 예상 크기 (gzip) |
|------|-----------------|
| useColumnPersistence.ts | ~0.8 KB |
| ColumnVisibilityMenu.tsx | ~1.5 KB |
| inline SVG (gear icon) | ~0.7 KB |
| **합계** | **~3 KB** |
| 기존 grid-core 누적 | ≤ 27 KB |
| **예상 총합** | **≤ 30 KB** (C-21 준수) |

### 8.6 C-29 exactOptionalPropertyTypes spread-skip 패턴

```typescript
// types.ts 수정 시 GridProps의 optional prop 전달
// ❌ 잘못된 방법 (exactOptionalPropertyTypes 위반)
const opts = { columnPersistence: props.columnPersistence }; // undefined 할당

// ✅ 올바른 방법 (C-29 준수)
const opts = {
  ...(props.columnPersistence !== undefined
    ? { columnPersistence: props.columnPersistence }
    : {}),
};
```

---

## Section 9. 의존성

| 의존성 | 종류 | 버전 | 신규 여부 |
|--------|------|------|-----------|
| `@tanstack/react-table` | peerDep | `^8.0.0` | 기존 (추가 없음) |
| `react` | peerDep | `^18.0.0 \|\| ^19.0.0` | 기존 (추가 없음) |

**신규 peerDep 없음** (D3 결정으로 Radix UI / react-icons 미추가).

---

## Section 10. 마이그레이션 가이드

### DataTable → Grid 전환 가이드

**Before (DataTable + DataTableViewOptions 조합)**:
```tsx
// tw-framework-front (AS-IS)
import { DataTable } from '@/components/DataTable/data-table';
// DataTableViewOptions는 DataTable 내부에서 자동 렌더링
<DataTable columns={columns} data={data} />
```

**After (Grid + columnPersistence 옵션)**:
```tsx
// tw-framework-front (TO-BE)
import { Grid } from '@tomis/grid-core';
import { createColumns } from '@tomis/grid-core';

const columns = createColumns<Row>([
  { id: 'empNo', name: '사번', type: 'text' },
  { id: 'name', name: '성명', type: 'text' },
]);

// columnPersistence 활성화 → useColumnPersistence + ColumnVisibilityMenu 자동 연동
<Grid
  data={data}
  columns={columns}
  columnPersistence={{ storageKey: 'emp-grid-v1', version: 1 }}
/>

// columnPersistence 미지정 → 기존 동작 (C-6)
<Grid data={data} columns={columns} />
```

### 커스텀 ColumnVisibilityMenu 사용 (standalone)

```tsx
import { ColumnVisibilityMenu } from '@tomis/grid-core';

// Grid 밖에서 독립적으로 사용 가능 (C-31 wiring: Grid.tsx + stories)
<ColumnVisibilityMenu
  table={table}
  triggerLabel="컬럼 설정"
  menuLabel="표시할 항목 선택"
/>
```

### useColumnPersistence standalone 사용

```tsx
import { useColumnPersistence } from '@tomis/grid-core';

// 직접 table 인스턴스와 함께 사용
useColumnPersistence(table, {
  storageKey: 'my-grid',
  version: 2,
  persist: ['visibility', 'order'],
});
```

---

## Section 11. 구현 단계 (Implementation Steps)

| Step | 단계 | 파일 | 검증 |
|------|------|------|------|
| 1 | `ColumnPersistenceOptions` + `PersistedData` 타입 정의 | `column/useColumnPersistence.ts` (NEW) | tsc 0 errors |
| 2 | `useColumnPersistence` hook 구현 (mount restore + state 변경 저장) | `column/useColumnPersistence.ts` (NEW) | TC-001, TC-002 |
| 3 | `ColumnVisibilityMenu` 컴포넌트 구현 (네이티브 HTML, Tailwind) | `column/ColumnVisibilityMenu.tsx` (NEW) | TC-007, TC-008 |
| 4 | `GridProps.columnPersistence` 추가, `Grid.tsx` columnVisibility/columnOrder state 추가, hook·메뉴 연결 | `types.ts` (MODIFY), `Grid.tsx` (MODIFY) | AC-006, C-6 backward compat |
| 5 | `index.ts` public API export 추가 | `index.ts` (MODIFY) | import from '@tomis/grid-core' 정상 |
| 6 | 단위 테스트 작성 (TC-001~TC-008) | `useColumnPersistence.test.ts` (NEW), `ColumnVisibilityMenu.test.tsx` (NEW) | vitest pass |
| 7 | Storybook story 작성 (Default + 일부컬럼숨김 variant) | `ColumnVisibilityMenu.stories.tsx` (NEW) | story 렌더 정상 |
| 8 | 최종 bundle size 측정 (≤ 3 KB 추가) | — | NFR-001 충족 |

---

## Section 12. 검증 계획 + 리스크

### 12.1 검증 계획 (E-05)

| 검증 유형 | 항목 | 도구 |
|----------|------|------|
| 단위 테스트 | TC-001~TC-006 (useColumnPersistence) + TC-007~TC-008 (ColumnVisibilityMenu) | vitest + @testing-library/react |
| 시각 회귀 | ColumnVisibilityMenu.stories.tsx Default + 일부컬럼숨김 variant | Storybook (추후 chromatic 연동 시 시각 diff 자동화) |
| 빌드 검증 | `tsc --noEmit` 0 errors + `pnpm build` 성공 | TypeScript 5.x + tsup |
| bundle 크기 | gzip 추가분 ≤ 3 KB | size-limit (monorepo 기존 도구) |
| 호환성 | `columnPersistence` 미지정 Grid 기존 동작 불변 | AC-006 TC 자동 검증 |

### 12.2 리스크

| 리스크 | 수준 | 완화 방안 |
|--------|------|-----------|
| Grid.tsx `columnVisibility`/`columnOrder` 상태 신규 추가로 기존 snapshot 테스트 실패 가능 | 중 | Grid.tsx 수정 후 기존 스냅샷 업데이트 필요. useColumnPersistence hook을 storageKey='' no-op으로 항상 호출하는 방식 선택 시 호출 자체는 기존 동작 불변. |
| `persist` 배열 reference instability → useEffect 무한 루프 | 중 | 구현자: useEffect deps를 `persist.join(',')` 직렬화 사용 (Section 8.2 주의사항 적용). |
| 네이티브 `<details>` click-outside 닫힘 미지원 | 저 | <details>는 문서 다른 곳 클릭 시 자동 닫힘 없음. 추후 G-003-ext에서 focusout 처리 추가 가능. 현재 릴리즈에서는 허용 (OQ-02). |
| SSR 환경에서 `localStorage` 직접 접근 | 저 | try/catch + `typeof window !== 'undefined'` guard. NFR-002, EC-003 적용. |
| ColumnVisibilityMenu inline SVG 크기 | 저 | gear icon SVG path ≈ 0.7 KB. NFR-001 범위 내. |

---

## Section 13. 패키지 + Open Questions

### 13.1 패키지 대상 (F-01)

| 항목 | 값 |
|------|-----|
| 패키지 | `packages/grid-core` (`@tomis/grid-core`) |
| 라이선스 | MIT (F-02: Pro 라이선스 N/A) |
| 문서 경로 | `apps/docs/` Docusaurus + `packages/grid-core/src/column/ColumnVisibilityMenu.stories.tsx` |
| peerDep 정책 | react + @tanstack/react-table peer, 신규 peer 없음 (C-22, Section 9) |

### 13.2 Open Questions

| OQ | 질문 | 기본값/잠정 결론 |
|----|------|-----------------|
| OQ-01 | `persist` 배열 reference instability 소비자 책임 범위: JSDoc 경고만? 아니면 내부 deep-equal 비교? | JSDoc 경고 + `persist.join(',')` deps 직렬화로 구현 (추가 dep 없음). |
| OQ-02 | 네이티브 `<details>` click-outside 닫힘 미지원 — UX 허용 범위? | G-003 릴리즈에서 허용. focusout handler는 G-003-ext에서 추가. |
| OQ-03 | ColumnVisibilityMenu 트리거 버튼을 Grid 헤더 영역에 렌더링? 아니면 Grid 외부에서 사용? | Grid.tsx에서 조건부 렌더링 + standalone 사용 모두 지원 (Section 10). Grid 내 렌더링 위치(헤더 우상단)는 구현자 결정. |
| OQ-04 | enableColumnFilter/enablePinning TomisColumnDef 확장 (G-001 cascading): 언제 G-004-ext로 착수? | G-003 완료 + 하네스 검증 통과 후 착수. D6 결정 확정. |
| OQ-05 | MOD-GRID-02/G-006 완료 시 useColumnPersistence 내부 리팩터링 트리거: 자동? 수동? | 수동 (G-006 완료 시 별도 PR). semver minor bump. G-003 spec에 TODO 주석 추가 (D1). |
