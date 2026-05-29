# G-003 Specification — Loading skeleton + empty state slot + autoSelectFirstRow + onRowClick/DoubleClick/onCellClick

**Module**: MOD-GRID-01 (공통 wrapper — variant 8 통합)
**Goal**: G-003
**Area**: wrapper
**Phase**: abstraction
**Priority**: P0
**migrationImpact**: high
**threshold**: 95 (specify/implement/verify 동일 — canonical-modules.json L72)
**spec 작성일**: 2026-05-14
**spec 버전**: v1.0 (loops 0/3, 첫 시도)
**의존**: MOD-GRID-01/G-001 (overallStatus=completed, score 100/100/100), MOD-GRID-01/G-002 (overallStatus=completed, score 100/100/100)

---

## ★ 사전 결정 표 (D# — 본문 cross-consistency 의무, rubric G-01 v1.0.4 강화)

| D# | 결정 | 본문 위치 | 출처 |
|----|------|----------|------|
| D1 | 구현 대상 monorepo `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/`. **wrapper-goals.json G-003 `implementFiles` 4개 모두 monorepo prefix 정확** — C-28 정정 불필요 (G-001 D2와 대비, G-002 D1과 동일). | Section 7 + 8.1 | wrapper-goals.json L167-172 Read 확인 |
| D2 | **NEW 3 + MODIFY 2 = 5 파일**. NEW: `internal/Skeleton.tsx` + `internal/EmptyState.tsx` + `internal/useAutoSelectFirstRow.ts`. MODIFY: `Grid.tsx` + `types.ts`. (`index.ts` **무수정** — 신규 internal 모듈은 public surface 비노출. 신규 prop은 기존 `GridProps<TData>` 추가만이라 `GridProps` re-export로 자동 노출됨.) | Section 7 표 (5 행) + Section 11.1 Step 1~5 | advisor item#5 결정 + G-001 산출 `index.ts` Read L1-10 |
| D3 | **`onRowClick`/`onRowDoubleClick` 시그니처 — 추가 확장 (Additive)**: G-001 types.ts L150-154 `(row: TData) => void` → `(row: TData, event: MouseEvent<HTMLTableRowElement>) => void` 로 **2번째 파라미터 옵션 확장**. `event` 무시하는 기존 호출자 (BaseGrid alias 등)는 그대로 type-check 통과 (TypeScript 함수 contravariance). `breaking=false` 유지. **`Row<TData>` wrapper 채택 안 함** (advisor item#1). | Section 2.1 + Section 4 + AC-004 | G-001 types.ts L150-154 Read + advisor item#1 |
| D4 | **`onCellClick` 신규 시그니처**: `(cell: Cell<TData, unknown>, row: TData, event: MouseEvent<HTMLTableCellElement>) => void`. `Cell<TData, unknown>` 객체로 cell.column.id / cell.getValue() 접근 가능 — column-level 분기 의도 노출. `row`는 `row.original` (TData) 전달 (D3 onRowClick 일관성). | Section 2.1 + AC-004 + Section 6 EC-04 | TanStack `Cell` API tanstack-api-inventory.md §3 |
| D5 | **Skeleton 적용 범위 = `<tbody>` 만 교체** (advisor item#3). `<thead>` (G-002 sticky/pinning) + `<table>`(G-002 border-separate) wrapper 모두 보존. loading=true 시 thead는 정상 렌더, tbody만 skeleton row N개로 치환. **별도 `<table>` 회귀(BaseGrid L108-137 패턴 그대로)는 채택 안 함** — sort/sticky/pinning 일관성 보존. | Section 2.2 + Section 11.1 Step 4 + AC-001 | advisor item#3 + Grid.tsx L107 sticky thead Read |
| D6 | **EmptyState 적용 = G-001 inline empty markup 추출 후 교체** (advisor item#2). Grid.tsx L149-157의 inline `<tr><td colSpan>{emptyText}</td></tr>` 7라인 → `<EmptyState colSpan={...} text={...} slot={props.emptyState} />` 1라인 호출로 치환. `EmptyState` 내부에서 slot 우선, 미제공 시 emptyText 렌더 (D7). G-001 `emptyText` prop 보존 (C-1 + C-6). | Section 2.3 + Section 11.1 Step 4 + AC-002 | advisor item#2 + Grid.tsx L149-157 Read |
| D7 | **emptyText vs emptyState 우선순위**: `emptyState` slot (ReactNode) 제공 시 우선 렌더. 미제공 + `emptyText` 제공 시 텍스트 렌더. 둘 다 미제공 시 G-001 default `'데이터가 없습니다.'` (Grid.tsx L34 DEFAULT_EMPTY_TEXT) 보존. | Section 2.3 + AC-002 + Section 6 EC-03 | spec 자체 결정 — slot 패턴 일반 컨벤션 |
| D8 | **`loadingRowCount` default = `pagination.pageSize ?? 5`** (BaseGrid L123 hardcoded 5와 호환 + pageSize 인지). `useReactTable` 호출 후 `props.pagination?.pageSize` 또는 internal pagination state.pageSize 참조. mathematical max는 도입 안 함 (사용자가 명시 가능). | Section 2.2 + AC-001 + Section 6 EC-02 | BaseGrid.tsx L123 Read + advisor item#3 |
| D9 | **`useAutoSelectFirstRow` 훅 위치 + deps + 동작**: Grid.tsx 본문(`useReactTable` 호출 **이후**)에 호출. signature `useAutoSelectFirstRow<TData>(table: Table<TData>, enabled: boolean, dataLength: number, selectionMode: RowSelectionMode): void`. 내부 `useEffect` deps = `[dataLength, enabled, selectionMode]` (data 배열 ref 변경에는 둔감, length 변경에만 반응 — AggridTable L85 패턴 차용하되 `length`로 정규화). **selectionMode='none' 시 no-op** (rowSelection 비활성 상태에서 selection state 변경 의미 없음). multi/single 무관 첫 행 1개만 선택 (single behavior — AG 패턴). | Section 2.4 + AC-003 + Section 6 EC-05/EC-06 | advisor item#4 + AggridTable.tsx L78-85 Read |
| D10 | **번들 한도 누적 정책 (G-002 D7 inherit)**: G-001 17.44 KB + G-002 +4 KB ≈ 21.44 KB 기점. G-003 +3 KB 예상 → **누적 ~24.44 KB / 30 KB 한도** (한도 81%). G-004 직전 size-limit 측정 의무는 G-002 D7에 위임 (본 G-003에서는 정책 재결정 X — 단일 라인 inherit). | Section 8.5 | G-002-spec.md D7 + size-limit measurement (G-002 측정 G-002 verify 산출물) |
| D11 | **G-001/G-002 본체 보존 의무 (C-1 보존, G-002 D6 계승)**: Grid.tsx 257라인 + types.ts 198라인 MODIFY는 본 G-003 신규 prop/markup 변경만. row 클릭 onClick는 D3 시그니처 확장으로 호출부 (Grid.tsx L165-166) 인자 추가 (`event` 전달). pagination footer/sort handler/sticky/pinning markup 무변경. | Section 11.1 Before/After + Section 8.2 + AC-008 | constraints.md C-1 (2026-05-14 G-004 추가) + G-002 D6 |
| D12 | **EmptyState colSpan + SkeletonRows column count 메서드 결정**: `table.getAllLeafColumns().length` 채택. G-001 Grid.tsx L152 inline empty markup은 `table.getAllColumns().length` 사용 → **스텔스 API 변경**. **이유**: (1) 미래 호환 — MOD-GRID-14 (Multi-row Header) 도입 시 `getAllColumns()`는 group + leaf 모두 카운트하여 colSpan 과다 → leaf 셀 영역 초과. `getAllLeafColumns()`는 실제 td 카운트와 정확 일치. (2) 의미적 안전 — group columns 부재 (현 G-001/G-002 상태)에서 두 메서드 결과 동일 (G-001 동작 회귀 0). (3) Implementer F-03 (C-1 보존) 검증 시 본 D12가 명시적 정정 결정으로 통과 근거 제공. | Section 2.2 SkeletonRowsProps + Section 2.3 EmptyStateProps + Section 11.1 Step 5 After 코드 + AC-001/AC-002 + EC | TanStack `Table.getAllLeafColumns()` API (Header 표준) + advisor (2026-05-14 G-003 review) |

---

## Section 1: 참조 추적

### L0: 현 구현 (tw-framework-front BaseGrid + monorepo G-001/G-002 산출물)

**파일 경로 + Read 확인 (2026-05-14)**:

| 파일 | Read 라인 | 본 G-003에서 흡수 / MODIFY 핵심 |
|------|----------|-----------------------------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx` | L1-99, L100-189 (전체 ~292) | L108-137 loading skeleton (animate-pulse), L170-178 empty state td colSpan, L181-196 row onClick `(row.original)` 시그니처 → D3 확장 출발점 |
| `D:/project/topvel_project/TOMIS/publish/src/components/common/aggrid/AggridTable.tsx` | L75-92 | autoSelectFirstRow useEffect (L78-85) deps `[rowData, autoSelectFirstRow]` 패턴 — D9에서 dataLength로 정규화 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` | L1-257 (전체, G-001+G-002 산출물) | L43-256 본체. **D11 보존 대상**. L107 sticky thead, L149-157 inline empty (D6 추출 대상), L165-166 row onClick `(row.original)` (D3 확장 대상) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | L1-198 (전체, G-001+G-002 산출물) | L150-154 `onRowClick?: (row: TData) => void` (D3 확장 대상), L160 `emptyText?: string` (D7 보존 대상) |

**핵심 발췌 1 — BaseGrid loading skeleton (BaseGrid.tsx L108-137)**:

```tsx
if (loading) {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                {columns.map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

→ **D5 결정**에 따라 본 G-003은 BaseGrid의 "early-return 별도 table" 패턴을 채택 **하지 않고**, G-002 sticky thead + pinning 보존을 위해 **`<tbody>` 영역만 Skeleton row 치환**. thead는 실제 columns(`table.getHeaderGroups()`)로 정상 렌더 — sort handler / sticky / pinning 일관성 보장.

**핵심 발췌 2 — BaseGrid empty state (BaseGrid.tsx L170-178)**:

```tsx
{table.getRowModel().rows.length === 0 ? (
  <tr>
    <td
      colSpan={table.getAllColumns().length}
      className="px-4 py-10 text-center text-gray-400"
    >
      {emptyText}
    </td>
  </tr>
) : ( ... )}
```

→ G-001 Grid.tsx L149-157이 동일 패턴을 그대로 가져옴. 본 G-003 D6 결정에 따라 `internal/EmptyState.tsx`로 추출 후 `<EmptyState colSpan={...} text={props.emptyText} slot={props.emptyState} />` 1라인 호출로 치환 (G-001 inline 7라인 → 1라인 + slot prop 추가).

**핵심 발췌 3 — AggridTable autoSelectFirstRow (AggridTable.tsx L78-85)**:

```tsx
useEffect(() => {
  if (autoSelectFirstRow && rowData && rowData.length > 0) {
    setSelectedRowId("0");
  } else {
    setSelectedRowId(null);
  }
}, [rowData, autoSelectFirstRow]);
```

→ **D9 결정**: 본 G-003은 selectedRowId 별도 state 도입 안 함. TanStack `RowSelectionState` (G-001 이미 정의) 직접 사용. `table.setRowSelection({ [firstRowId]: true })` 호출. deps는 `[dataLength, enabled, selectionMode]`로 정규화 (배열 ref 변경에 둔감 — props.data === 동일참조 시 재선택 방지).

**핵심 발췌 4 — G-001 row onClick (Grid.tsx L165-166)**:

```tsx
onClick={() => props.onRowClick?.(row.original)}
onDoubleClick={() => props.onRowDoubleClick?.(row.original)}
```

→ G-001 시그니처는 `(row: TData) => void` (event 미전달). **D3 결정**: `(row: TData, event: MouseEvent<HTMLTableRowElement>) => void`로 추가 확장. 호출부는 `props.onRowClick?.(row.original, event)` (event 인자 명시). 기존 호출자(BaseGrid 등 alias)는 event 무시 → TypeScript 함수 파라미터 contravariance로 안전 (호출자 시그니처 fewer params → 호환).

### L1: TanStack v8 표준 API

**파일 + Read 확인 (2026-05-14)**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` (G-001 spec L113-145 재인용 — 동일 표 §3 TableOptions).

핵심 시그니처 (본 G-003 사용):

```ts
// G-001에서 이미 사용 중인 API
interface Table<TData> {
  setRowSelection: OnChangeFn<RowSelectionState>;     // ★ G-003 useAutoSelectFirstRow 사용
  getRowModel: () => RowModel<TData>;                  // ★ first row id 조회
}
interface Row<TData> {
  id: string;                                          // ★ first row id (D9)
  original: TData;                                     // ★ onRowClick 인자 (D3)
}
interface Cell<TData, TValue> {                        // ★ D4 onCellClick 인자
  column: Column<TData, TValue>;
  getValue: () => TValue;
  row: Row<TData>;
}
type RowSelectionState = Record<string, boolean>;      // ★ G-001 이미 정의
```

본 G-003은 위 표준 export만 사용 (private API 접근 0 — C-2 준수). `Cell` import는 신규 (`types.ts` 또는 `Grid.tsx`).

### L2: 8 variant 공통 패턴 (DRY 추출)

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` L101-113 §5.

| 중복 패턴 | 사용 variant | G-003에서 흡수 |
|----------|------------|----------------|
| 로딩 skeleton + 빈 결과 안내 | **8/8 동일 패턴** (current-tanstack-analysis.md L111) | ✅ NEW Skeleton.tsx + EmptyState.tsx (D2) |
| row onClick `(row.original)` | 8/8 (BaseGrid L194 등) | ✅ G-001 시그니처 확장 (D3 — event 추가) |
| onCellClick | 0/8 (현 구현 없음 — 신규) | ✅ NEW prop (D4) — TanStack Cell API 활용 |
| autoSelectFirstRow | 0/8 (TOMIS Grid 외 — publish AggridTable만) | ✅ R-A에서 패턴 차용 (D9) |

### L3: 영향 사용처

본 G-003은 **G-001/G-002 기반 prop 추가** — `affectedUsageFiles: []` (wrapper-goals.json G-003 L173).

사용처 마이그레이션 (참고):
- **G-005** legacy alias 5종 (`BaseGrid` 등) — `loading`/`emptyText`/`onRowClick` props 매핑 진입점 (G-001 동일 prop 명 보존)
- **MOD-GRID-17** 페이지 27개 점진 마이그레이션 (canonical-modules.json L564-595)

### R-A: AG Grid 패턴 (참조 — C-7 코드 차용 금지)

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-aggrid-analysis.md` L42-92 §3 + AggridTable.tsx L78-92 직접 Read.

| AG 패턴 | 본 G-003 채택 |
|--------|--------------|
| `autoSelectFirstRow` (AggridTable L54, useEffect L78-85) | ✅ D9 채택 — TanStack RowSelectionState 활용. 별도 selectedRowId state 미사용 (G-001 selection state 통합) |
| `onRowClicked` / `onRowDoubleClick` / `onCellClicked` (AggridTable L51) | ✅ D3/D4 채택 — TanStack Row/Cell 객체 시그니처 |
| `clearSelectionKey` (AggridTable L88-92) | G-002 useGridState 범위 (별도 모듈 — MOD-GRID-02). 본 G-003 미포함 |

### R-W: Wijmo 패턴 (참조 — C-16 import 금지)

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` (전체 인덱스 확인).

본 G-003 범위(loading/empty/autoSelect/click)에 대한 Wijmo 직접 대응 패턴은 **N/A** — Wijmo `FlexGrid`는 placeholder/empty/auto-select 표준 제공 없음 (사용자가 host 컴포넌트에서 분기). wrapper-goals.json G-003 `referenceEvidence.R-W: "(N/A)"` 일치.

### migrationImpact: high (사유)

본 G-003 자체는 신규 prop 추가 — 영향 0 사용처. 단:
1. **D3 시그니처 확장**(`onRowClick` event 파라미터)이 G-001/G-005 alias + MOD-GRID-17 27 페이지 사용처에 영향 가능 — TypeScript는 호환 (additive)이지만 **시각/행동 회귀** 리스크
2. autoSelectFirstRow가 켜진 페이지에서 첫 행 자동 선택은 사용자 시각/UX 변화 — Visual regression 의무 (C-13/C-17)

→ canonical-modules.json L71 `migrationImpact: high` 일치.

---

## Section 2: API 계약 (TypeScript)

### 2.1 `interface GridProps<TData>` 추가/MODIFY prop 정의

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` (MODIFY — D2)

기존 G-001/G-002 `GridProps<TData>` (types.ts L110-197) 보존. 본 G-003 변경:
- (a) **2개 prop MODIFY** (D3): `onRowClick`, `onRowDoubleClick` 시그니처 확장
- (b) **5개 prop NEW** (D4/D5/D6/D8): `loading`, `loadingRowCount`, `emptyState`, `autoSelectFirstRow`, `onCellClick`

```ts
// types.ts MODIFY — 신규 import 추가
import type {
  Cell,                          // ★ G-003 신규 (onCellClick 인자)
  ColumnDef,
  ColumnPinningState,
  ColumnSizingState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
} from '@tanstack/react-table';
import type { MouseEvent, ReactNode } from 'react';   // ★ G-003 신규

export interface GridProps<TData> {
  // ─── (G-001/G-002 기존 prop 모두 보존 — D11) ───
  // ... data, columns, enable*, rowSelection, pagination, className, emptyText, getSubRows, debug,
  //     columnResizeMode, defaultColumnSizing, onColumnSizingChange,
  //     defaultColumnPinning, onColumnPinningChange

  // ─── 이벤트 (G-001 → D3 시그니처 확장) ───
  /**
   * 행 클릭 핸들러.
   *
   * @param row - `row.original` (TData).
   * @param event - 원본 MouseEvent. 이벤트 버블 차단(`stopPropagation`) 필요 시 사용.
   *
   * @remarks
   * G-001 시그니처 `(row: TData) => void` 와 backward-compatible (호출부에서 event 무시 가능).
   * 체크박스 셀 클릭은 `__select__` 컬럼 내부에서 `stopPropagation` 처리됨 (G-001 CheckboxColumn).
   * `onCellClick` 과 동시 fire — cell 이벤트가 row 이벤트보다 먼저 발생 (DOM 버블 순서).
   *
   * @see G-003-spec.md Section 2.1 D3 + Section 6 EC-04
   */
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;

  /** 행 더블 클릭 — `onRowClick` 와 동일 시그니처 정책 (D3). */
  onRowDoubleClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;

  // ─── G-003 신규: 셀 클릭 (D4) ───
  /**
   * 셀 클릭 핸들러 — column-level 분기 의도 노출.
   *
   * @param cell - TanStack `Cell` (cell.column.id, cell.getValue() 접근 가능).
   * @param row - `row.original` (TData) — `onRowClick` 와 일관된 인자.
   * @param event - 원본 MouseEvent.
   *
   * @remarks
   * `onCellClick` + `onRowClick` 동시 fire (DOM 이벤트 버블). 행 클릭 차단 시 사용자가 `event.stopPropagation()` 호출 의무.
   *
   * @see G-003-spec.md Section 2.1 D4 + Section 6 EC-04
   */
  onCellClick?: (
    cell: Cell<TData, unknown>,
    row: TData,
    event: MouseEvent<HTMLTableCellElement>,
  ) => void;

  // ─── G-003 신규: 로딩 (D5/D8) ───
  /**
   * 로딩 상태 — `true` 시 `<tbody>` 영역만 skeleton row 로 치환 (thead 보존).
   *
   * @see G-003-spec.md Section 2.2 + D5
   */
  loading?: boolean;

  /**
   * 로딩 시 표시할 skeleton 행 개수 (default = `pagination.pageSize ?? 5`).
   * BaseGrid L123 hardcoded `5` 와 호환.
   *
   * @see G-003-spec.md Section 2.2 D8
   */
  loadingRowCount?: number;

  // ─── G-003 신규: 빈 상태 slot (D6/D7) ───
  /**
   * 빈 결과 상태 ReactNode slot.
   * 제공 시 `emptyText` 보다 우선 렌더 (D7). 미제공 시 `emptyText` 또는 default `'데이터가 없습니다.'` 렌더.
   *
   * @example
   * ```tsx
   * <Grid
   *   data={[]}
   *   columns={columns}
   *   emptyState={<EmptyIllustration onCreateClick={...} />}
   * />
   * ```
   *
   * @see G-003-spec.md Section 2.3 D6
   */
  emptyState?: ReactNode;

  // ─── G-003 신규: 첫 행 자동 선택 (D9) ───
  /**
   * 데이터 로드 후 첫 행 자동 선택 (default `false`).
   *
   * @remarks
   * - `rowSelection='none'` 시 no-op (selection 비활성 상태 무의미)
   * - `'multi'` 시에도 첫 행 1개만 선택 (single behavior — AG `autoSelectFirstRow` 패턴)
   * - useEffect deps = `[dataLength, autoSelectFirstRow, selectionMode]` — props.data ref 변경에는 둔감, length 변경 시만 재선택
   *
   * @see G-003-spec.md Section 2.4 D9 + Section 6 EC-05/EC-06
   */
  autoSelectFirstRow?: boolean;
}
```

**제어/비제어 정책**:
- `loading` = uncontrolled boolean (사용자 외부 fetch state 그대로 전달)
- `emptyState` = ReactNode slot (per-render 변경 가능, internal state 없음)
- `autoSelectFirstRow` = uncontrolled boolean. `rowSelection.state`(controlled) 와 동시 사용 시 controlled state 가 우선 (사용자 책임)

### 2.2 `internal/Skeleton.tsx` 시그니처 (NEW)

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/Skeleton.tsx` (NEW — D2)

```tsx
// internal/Skeleton.tsx (NEW — D2)
import type { Table } from '@tanstack/react-table';

export interface SkeletonRowsProps<TData> {
  /** 렌더할 skeleton 행 개수 (Grid.tsx 에서 `props.loadingRowCount ?? pagination.pageSize ?? 5` 계산 후 전달 — D8). */
  count: number;
  /** TanStack table 인스턴스 — 컬럼 개수/pinning state 참조 (사용자 thead 와 동일 컬럼 수 일관성). */
  table: Table<TData>;
}

/**
 * `<tbody>` 영역의 skeleton row N개 렌더 (BaseGrid L122-132 흡수).
 *
 * - 각 td 내부에 `<div className="h-4 bg-gray-100 rounded animate-pulse" />`
 * - **각 row td 개수 = `table.getAllLeafColumns().length`** (D12 — leaf 정확 일치, group columns 부재 시 G-001 `getAllColumns()`와 동일 결과)
 * - 체크박스 컬럼 포함
 * - thead 는 본 컴포넌트가 렌더하지 않음 — Grid.tsx 의 정상 thead 보존 (D5)
 *
 * @see G-003-spec.md Section 2.2 + D5/D8/D12
 */
export function SkeletonRows<TData>(props: SkeletonRowsProps<TData>): JSX.Element;
```

### 2.3 `internal/EmptyState.tsx` 시그니처 (NEW)

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/EmptyState.tsx` (NEW — D2)

```tsx
// internal/EmptyState.tsx (NEW — D2)
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  /**
   * colSpan = `table.getAllLeafColumns().length` (Grid.tsx 에서 계산 후 전달).
   * **D12**: G-001 inline `getAllColumns().length`에서 정정 — leaf 정확 일치 (group columns 부재 시 동일 결과, MOD-GRID-14 도입 시 미래 호환).
   */
  colSpan: number;
  /** 사용자 emptyState slot (D7 우선 순위 1). */
  slot?: ReactNode;
  /** 사용자 emptyText (D7 우선 순위 2). */
  text?: string;
  /** Default text fallback (D7 우선 순위 3). */
  defaultText?: string;
}

/**
 * 빈 결과 상태 `<tr><td colSpan>...</td></tr>` 1행 렌더 (G-001 Grid.tsx L149-157 추출 — D6).
 *
 * 우선순위 (D7): slot → text → defaultText.
 *
 * @see G-003-spec.md Section 2.3 + D6/D7/D12
 */
export function EmptyState(props: EmptyStateProps): JSX.Element;
```

### 2.4 `internal/useAutoSelectFirstRow.ts` 시그니처 (NEW)

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useAutoSelectFirstRow.ts` (NEW — D2)

```ts
// internal/useAutoSelectFirstRow.ts (NEW — D2)
import { useEffect } from 'react';
import type { Table } from '@tanstack/react-table';
import type { RowSelectionMode } from '../types';

/**
 * 데이터 로드 후 첫 행 자동 선택 훅 (AggridTable L78-85 패턴 차용 — R-A).
 *
 * @param table - TanStack Table 인스턴스 (`useReactTable` 반환값).
 * @param enabled - `props.autoSelectFirstRow` 그대로 전달.
 * @param dataLength - `props.data.length` (배열 ref 변경에 둔감, length 변경에만 반응 — D9).
 * @param selectionMode - 정규화된 selectionMode (`'single' | 'multi' | 'none'`).
 *
 * @remarks
 * - `selectionMode === 'none'` 시 no-op (D9).
 * - `enabled === true && dataLength > 0` 시 `table.setRowSelection({ [firstRowId]: true })`.
 * - `enabled === true && dataLength === 0` 시 `table.setRowSelection({})` (선택 해제 — AggridTable L83 패턴).
 * - `enabled === false` 시 no-op (사용자 selection 보존 — AggridTable 와 다름. AggridTable은 selectedRowId(null) 강제. 우리는 사용자 책임).
 * - `'multi'` 시에도 첫 1행만 선택 (single behavior — AG 패턴, D9).
 *
 * @see G-003-spec.md Section 2.4 + D9 + Section 6 EC-05/EC-06
 */
export function useAutoSelectFirstRow<TData>(
  table: Table<TData>,
  enabled: boolean,
  dataLength: number,
  selectionMode: RowSelectionMode,
): void;
```

### 2.5 사용 예시

**Example 1 — 최소 (loading + empty 기본)**:

```tsx
import { Grid } from '@tomis/grid-core';

const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchUsers().then((rows) => { setUsers(rows); setLoading(false); });
}, []);

<Grid<User>
  data={users}
  columns={columns}
  loading={loading}
  emptyText="등록된 사용자가 없습니다."
/>;
```

**Example 2 — 풀옵션 (autoSelect + emptyState slot + 클릭 이벤트)**:

```tsx
import { Grid } from '@tomis/grid-core';
import type { Cell } from '@tanstack/react-table';

<Grid<User>
  data={users}
  columns={columns}
  enableSort
  rowSelection="single"
  loading={isLoading}
  loadingRowCount={10}
  autoSelectFirstRow
  emptyState={
    <div className="flex flex-col items-center gap-3 py-10">
      <EmptyIllustration />
      <button onClick={openCreate} className="px-4 py-2 bg-blue-500 text-white rounded">
        신규 등록
      </button>
    </div>
  }
  onRowClick={(row, event) => {
    if (event.shiftKey) openInNewTab(row.id);
    else navigate(`/users/${row.id}`);
  }}
  onRowDoubleClick={(row) => openDetailModal(row)}
  onCellClick={(cell, row, event) => {
    if (cell.column.id === 'status') {
      event.stopPropagation();   // row click 차단
      toggleStatus(row);
    }
  }}
/>;
```

### 2.6 타입 export 경로

- `loading`, `loadingRowCount`, `emptyState`, `autoSelectFirstRow`, `onCellClick` — `GridProps<TData>` 멤버로 자동 노출 (G-001 `GridProps` re-export 통해 — D2 `index.ts` 무수정)
- 신규 type alias 0종 — `Cell`/`MouseEvent`/`ReactNode`은 사용자가 직접 `@tanstack/react-table`/`react`에서 import (peer 이미 선언)

`index.ts` **무수정** (D2):

```ts
// index.ts (변경 없음 — G-002 산출물 그대로)
export { Grid } from './Grid';
export type {
  GridProps,                    // ★ 본 G-003 신규 prop 5개가 자동 노출
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
  GridColumnResizeMode,
} from './types';
```

### 2.7 ref/imperative 방침 (B-05)

본 G-003은 G-001/G-002와 동일하게 **선언적 컴포넌트 only**. `forwardRef` + `useImperativeHandle`은 **G-004 범위**.

---

## Section 3: 기존 사용처 대응표 (Variant → 신규 API)

| 기존 패턴 | 신규 G-003 API | 마이그레이션 액션 | 담당 Goal |
|----------|---------------|-------------------|----------|
| BaseGrid `loading` prop (BaseGrid.tsx L25) | `<Grid loading={isLoading} />` | prop 명 동일 — alias가 그대로 전달 | G-005 |
| BaseGrid `emptyText` prop (BaseGrid.tsx L26) | `<Grid emptyText="..." />` | prop 명 동일 — alias가 그대로 전달 (D6 추출 후에도 props.emptyText 전달 보존) | G-005 |
| AggridTable `autoSelectFirstRow` (AggridTable.tsx L54) | `<Grid autoSelectFirstRow />` | publish는 마이그레이션 대상 외 (별도 트랙). MOD-GRID-17 신규 사용 시 직접 prop 사용 | MOD-GRID-17 |
| BaseGrid `onRowClick={(row) => ...}` (BaseGrid.tsx L194) | `<Grid onRowClick={(row, event) => ...} />` | **D3 추가 호환** — event 무시 호출자(BaseGrid alias)는 변경 0. 신규 코드만 event 활용 | G-005 + MOD-GRID-17 |
| (기존 없음) onCellClick | `<Grid onCellClick={(cell, row, event) => ...} />` | 신규 기능 (8/8 variant 미제공) — 자발 도입 | MOD-GRID-17 |

**본 G-003 직접 영향**: 0 사용처 (G-001/G-002 기반 prop 추가). D3 추가 확장은 backward-compatible — TypeScript 함수 contravariance 안전.

---

## Section 4: 호환성 정책

| 항목 | 값 | 근거 |
|------|----|------|
| **breaking** | **false** | 모든 신규 prop optional. D3 onRowClick 시그니처 확장은 additive (event 파라미터 추가) → 기존 호출자 (event 미사용) 그대로 type-check + 동작 동일. wrapper-goals.json G-003 `compatibilityPolicy.breaking: false` 일치. |
| **deprecationStrategy** | "기존 BaseGridProps 호환" — alias deprecation은 G-005 책임 | wrapper-goals.json G-003 L164 |
| **migrationPath** | "props 명 동일 — 변경 없음" (loading/emptyText/onRowClick prop 명 G-001 보존) | wrapper-goals.json G-003 L165 |
| **peerDependencies (C-22)** | 변경 없음 — `react` (이미 G-001 선언) `Cell` import는 `@tanstack/react-table` (이미 G-001 선언) | grid-core/package.json L23-28 Read |
| **semver (C-23)** | `version: "0.0.0"` 유지 (1.0 전 — Changesets는 MOD-GRID-00 G-002 범위) | grid-core/package.json L3 |

**주의 사항** (D3 시그니처 확장):
- TypeScript 함수 파라미터 contravariance 규칙: 호출자 시그니처가 수신자 시그니처보다 적은 인자(event 무시) 가져도 호환. 따라서 BaseGrid alias `onClick={() => onRowClick?.(row.original)}` (G-001 패턴)은 그대로 유지 가능. 단 alias 내부에서 `(row, event) => onRowClick?.(row, event)` 으로 event 전파하면 사용자가 event 활용 가능 — G-005 alias 구현 시 결정.

---

## Section 5: 인수 기준 (출처 태그 100%)

| ID | 기준 | 검증 방법 | 출처 |
|----|------|----------|------|
| AC-001 | `loading=true` 시 `<tbody>` 영역에 `loadingRowCount` 만큼 skeleton row 렌더 (각 td 내부 `h-4 bg-gray-100 rounded animate-pulse`). 각 row의 td 개수 = `table.getAllLeafColumns().length` (D12 — leaf 정확 일치). `<thead>` 는 정상 컬럼 렌더 (D5). default count = `pagination.pageSize ?? 5` (D8). | vitest `T-01~T-03` (Skeleton row count) + Storybook `Grid/Loading` 시각 | L0 (BaseGrid.tsx L122-132) + D5/D8/D12 |
| AC-002 | `data.length === 0 && !loading` 시 `<EmptyState>` 1행 렌더. 우선순위 (D7): `emptyState` slot → `emptyText` → default `'데이터가 없습니다.'`. **colSpan = `table.getAllLeafColumns().length`** (D12 — G-001 inline `getAllColumns()` 정정). (G-001 inline markup 추출 + slot 추가 — D6). | vitest `T-04~T-06` + Storybook `Grid/Empty/Slot` 시각 | L0 (BaseGrid.tsx L170-178 + G-001 Grid.tsx L149-157) + D6/D7/D12 |
| AC-003 | `autoSelectFirstRow=true` + `rowSelection !== 'none'` + `dataLength > 0` 시 `useAutoSelectFirstRow` 훅이 `table.setRowSelection({ [firstRowId]: true })` 호출 — 첫 행 selected 상태. `selectionMode='none'` 시 no-op (D9). `'multi'` 시에도 첫 1행만 (D9). useEffect deps = `[dataLength, enabled, selectionMode]`. | vitest `T-07~T-10` + Storybook `Grid/AutoSelect` 시각 | R-A (AggridTable.tsx L78-85) + D9 |
| AC-004 | `onRowClick`/`onRowDoubleClick`/`onCellClick` props 호출 — 각각 시그니처 일치: `(row: TData, event: MouseEvent<HTMLTableRowElement>) => void` / `(cell: Cell<TData, unknown>, row: TData, event: MouseEvent<HTMLTableCellElement>) => void` (D3/D4). 행 onClick + 셀 onClick 동시 발생 시 cell event 먼저 fire (DOM 버블). | vitest `T-11~T-13` (이벤트 fire 순서) + Storybook `Grid/Click` | L0 (BaseGrid.tsx L181-196 row click + G-001 Grid.tsx L165-166 onClick 호출부) + D3/D4 |
| AC-005 | C-25: 모든 신규 5 prop (`loading`, `loadingRowCount`, `emptyState`, `autoSelectFirstRow`, `onCellClick`) + MODIFY 2 prop (`onRowClick`, `onRowDoubleClick`)에 JSDoc. Storybook story 최소 1개 (`Grid/G-003-Loading-Empty-AutoSelect-Click` 통합 시나리오). NEW 3 internal 모듈에도 JSDoc. | grep `@param`/`@returns` count + Storybook 파일 존재 | C-25 (Public API 문서화) + wrapper-goals.json G-003 AC-005 |
| AC-006 | C-5: 모든 신규 className Tailwind only. Skeleton의 `bg-gray-200`/`bg-gray-100` (BaseGrid 인용) + `animate-pulse` Tailwind 표준. EmptyState `text-gray-400` 보존. 인라인 `style={{...}}` 동적 값 외 0건. `.css/.scss/.module.css` 신규 파일 0건. | grep + Glob `*.css` 신규 파일 카운트 | C-5 (Tailwind only) |
| AC-007 | C-12: `pnpm --filter @tomis/grid-core typecheck` 0 error + `pnpm --filter @tomis/grid-core build` (tsup CJS+ESM dual + dts) exit 0. `Cell`/`MouseEvent`/`ReactNode` import 모두 type-check 통과. | exit code 0 | C-12 (빌드 0 errors) |
| AC-008 | C-1 보존 (D11): G-001 Grid.tsx L43-256 + G-002 sticky/pinning markup + types.ts L110-197 (G-003 무관 16 prop) + G-001/G-002 buildTableOptions L1-204 무수정. `git diff packages/grid-core` 변경 라인이 G-003 신규 prop/Skeleton 분기/EmptyState 호출/onCellClick td onClick/autoSelect 훅 호출만. | git diff line count + Read+grep | C-1 (2026-05-14 G-004 추가) + D11 |
| AC-009 | C-21: `pnpm size-limit` `@tomis/grid-core` ≤ 30 KB brotli 통과. 누적 G-001 17.44 + G-002 +4 + G-003 +3 ≈ 24.44 KB 예상 (D10). | size-limit run + JSON 파싱 | C-21 + D10 |
| AC-010 | EmptyState/Skeleton 컴포넌트는 G-002 sticky pinning + border-separate 환경에서도 렌더 정상 (colSpan으로 1셀 td가 모든 컬럼 폭 차지 — pinned offset 적용 안 됨). 시각 회귀 baseline 보존 (G-002 stories 확장). | Storybook `Grid/Loading + Pinning` + 수동 스크린샷 vs G-002 baseline | C-13/C-17 (시각 회귀) + G-002 D6 |

**카운트**: 10 AC ≥ 3 (rubric C-01 통과). 모든 AC `source: L0/L1/L2/R-A/C-NN/D#` 태그 (rubric H-03 통과 — 본문 인용 100%).

**호환성 검증 AC (rubric C-05)**: AC-007/AC-008/AC-009/AC-010 — 빌드 + 보존 + 번들 + 시각 회귀. 사용처 0개이지만 G-005/MOD-GRID-17 발판이므로 strict 검증 의무.

---

## Section 6: 엣지 케이스 (≥3개)

### EC-01: `loading=true` + `data.length > 0` 동시 (loading 우선)

- **시나리오**: 사용자가 fetch in-flight 중 stale data를 props에 그대로 전달 (loading=true + data=이전 결과)
- **처리**:
  - **loading 우선** — D5 정책에 따라 `<tbody>` 영역만 Skeleton row 렌더. 실제 data는 무시 (이전 행 잠시 숨김 → skeleton 표시)
  - 사용자 의도 (UX 일관성): "로딩 중에는 데이터가 stale 임을 시각적으로 표시"
- **AC 매핑**: AC-001 (loading 분기 우선)

### EC-02: `loadingRowCount` 미지정 + `pagination` 미사용 → default 5

- **시나리오**: `<Grid loading data={[]} columns={...} />` (pagination 없음, loadingRowCount 미지정)
- **처리**:
  - D8 결정: `props.loadingRowCount ?? props.pagination?.pageSize ?? 5`
  - 본 케이스: pagination undefined → undefined → 5 fallback (BaseGrid L123 hardcoded `length: 5` 와 호환)
- **AC 매핑**: AC-001

### EC-03: `emptyText='' ` (빈 문자열) — slot 미제공

- **시나리오**: 사용자가 `emptyText=""` 명시적 전달 (빈 텍스트 의도)
- **처리** (D7):
  - `emptyState` 미제공 → `emptyText` 우선 → 빈 문자열 그대로 렌더 (default fallback 사용 X)
  - 시각: empty cell 표시되지만 텍스트 0 — 사용자 의도 존중 (보이지 않게 처리)
  - default fallback (`'데이터가 없습니다.'`) 은 `emptyText === undefined` 일 때만 적용
- **AC 매핑**: AC-002

### EC-04: `onCellClick` + `onRowClick` 동시 등록 — 이벤트 fire 순서

- **시나리오**: 두 핸들러 모두 등록, 사용자가 셀 클릭
- **처리** (D3/D4):
  - DOM 이벤트 버블 — `<td>` onClick fire 먼저 → `<tr>` onClick fire (둘 다 호출됨)
  - 사용자가 행 클릭 차단 의도 시 `onCellClick` 내부에서 `event.stopPropagation()` 호출 의무 (Spec README/JSDoc 명시 — AC-005)
  - 체크박스 셀 (`__select__` 컬럼)은 G-001 CheckboxColumn 내부에서 `e.stopPropagation()` 처리됨 — 행 클릭 fire 안 됨 (BaseGrid L57 + G-001 패턴 보존)
- **AC 매핑**: AC-004

### EC-05: `autoSelectFirstRow=true` + `rowSelection='none'`

- **시나리오**: autoSelectFirstRow 켰지만 rowSelection 설정 안 함
- **처리** (D9):
  - `useAutoSelectFirstRow` 훅 내부 `if (selectionMode === 'none') return;` (no-op)
  - 사용자 실수 방지 — silent no-op (warning 미발행, 사용자 책임)
  - JSDoc 명시 — "rowSelection='none' 시 autoSelectFirstRow no-op" (Section 2.4 시그니처 주석)
- **AC 매핑**: AC-003

### EC-06: `autoSelectFirstRow=true` + `data` 변경 (length 동일, ref 변경)

- **시나리오**: 같은 길이 다른 데이터 (예: 다른 페이지 동일 pageSize) → re-select 여부
- **처리** (D9):
  - useEffect deps = `[dataLength, enabled, selectionMode]` — length 동일이면 effect 재실행 X → 기존 선택 보존
  - **AggridTable L85 deps `[rowData, autoSelectFirstRow]` 와 다름** (AggridTable은 ref 변경 시 재선택). 본 G-003은 `length` 정규화 채택 — server-side pagination에서 같은 pageSize 다른 page 결과 시 사용자 선택 행이 자동 첫 행으로 reset 되지 않도록 보호
  - 사용자 의도 시(매 데이터 변경마다 첫 행 재선택) 외부에서 `key` prop 으로 Grid 자체 unmount/remount 권장 (React 표준 패턴)
- **AC 매핑**: AC-003

### EC-07 (환경 의존): pnpm 미설치 환경에서 build 검증 불가 (AC-007)

- **시나리오**: CI가 아닌 로컬에서 pnpm CLI 미설치
- **처리**: documented-deviation — `npx tsc --noEmit` (typecheck script는 pnpm 의존 없음) 폴백
- **AC 매핑 표** (rubric E-04 권장):

| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-007 (`pnpm --filter @tomis/grid-core build`) | EC-07 (pnpm 미설치) | G-001/G-002 EC-07 와 동일 — `npx tsc --noEmit` 폴백 (documented-deviation) |

**합계**: 7 EC ≥ 3 (rubric E-04 통과).

---

## Section 7: 구현 대상 파일 (NEW 3 + MODIFY 2 = 5개)

**경로 결정 근거 (D1 — C-28 N/A)**: wrapper-goals.json L167-172 G-003 `implementFiles` 4개 모두 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/...` 정확 prefix. C-28 정정 결정 불필요. 단 spec 본문 분석 결과:
- wrapper-goals.json은 NEW 4개 명시 (Grid.tsx + Skeleton.tsx + EmptyState.tsx + useAutoSelectFirstRow.ts)
- 본 spec은 Grid.tsx를 NEW 가 아닌 **MODIFY** (G-001/G-002 산출물 보존 의무 — D11)로 재분류 + types.ts MODIFY 추가 (D3 신규 prop 매핑)
- → **NEW 3 + MODIFY 2 = 5개** (D2)

**조부모 디렉토리 실재 확인** (H-02 외부 디렉토리 예외):
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/` 실재 확인 (G-001/G-002 생성 — `CheckboxColumn.tsx`, `ResizeHandle.tsx`, `buildTableOptions.ts`, `computePinnedOffset.ts` 4 파일 존재 — `ls` 확인)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` 실재 확인 (G-001+G-002 산출물, 257 라인 Read)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` 실재 확인 (198 라인 Read)
- 신규 디렉토리 mkdir 불필요 (`internal/` 이미 있음)

| # | 파일 경로 | 변경 유형 | 책임 |
|---|----------|---------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | **MODIFY** | (a) `Cell` import 추가 (`@tanstack/react-table`). (b) `MouseEvent`, `ReactNode` import 추가 (`react`). (c) `onRowClick`/`onRowDoubleClick` 시그니처 확장 (D3). (d) 신규 5 prop 추가 — `onCellClick`, `loading`, `loadingRowCount`, `emptyState`, `autoSelectFirstRow` (Section 2.1). 기존 G-001/G-002 16 prop 시그니처/주석 보존 (D11). |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/Skeleton.tsx` | **NEW** | `<SkeletonRows count table />` — `<tr>` × N + `<td>` × column count + `<div className="h-4 bg-gray-100 rounded animate-pulse" />` (BaseGrid L122-132 흡수). thead 무렌더 (D5). |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/EmptyState.tsx` | **NEW** | `<EmptyState colSpan slot text defaultText />` — `<tr><td colSpan>...</td></tr>` 1행. 우선순위 D7 (slot → text → defaultText). G-001 Grid.tsx L149-157 추출 (D6). |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useAutoSelectFirstRow.ts` | **NEW** | `useAutoSelectFirstRow(table, enabled, dataLength, selectionMode)` — useEffect deps `[dataLength, enabled, selectionMode]`. selectionMode='none' no-op. enabled+dataLength>0 → setRowSelection({ [firstRowId]: true }). enabled+dataLength=0 → setRowSelection({}). (D9, AggridTable L78-85 패턴 차용). |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` | **MODIFY** | (a) `useAutoSelectFirstRow` import + 호출 (`useReactTable` 호출 후). (b) `<tbody>` 분기 변경 — `loading=true` 시 `<SkeletonRows count={...} table={table} />` 렌더 (D5). `loading=false && rows.length===0` 시 `<EmptyState colSpan={...} slot={props.emptyState} text={props.emptyText} defaultText={DEFAULT_EMPTY_TEXT} />` 렌더 (D6). (c) row onClick/onDoubleClick 호출부에 event 전달 (D3). (d) 각 `<td>` onClick 추가 — `onCellClick(cell, row.original, event)` (D4). 기존 G-001/G-002 sticky/pinning/resize markup 무변경 (D11). |

**Section 11 cross-check (rubric E-01 ★)**: Section 11.1 Step 1 (types.ts) → 행 #1, Step 2 (Skeleton NEW) → 행 #2, Step 3 (EmptyState NEW) → 행 #3, Step 4 (useAutoSelectFirstRow NEW) → 행 #4, Step 5 (Grid.tsx MODIFY) → 행 #5. **Step ↔ 표 행 5/5 일치**.

**부수 변경 0건**: `package.json` 무수정 (peer 이미 선언), `tsup.config.ts` 무수정, `.size-limit.json` 무수정 (한도 30 KB 그대로 — D10), `index.ts` 무수정 (D2 — 신규 internal 모듈은 public surface 비노출). `tw-framework-front/` 0 파일 변경 (TOMIS 영향 0 — H-02 외부 디렉토리 무파괴).

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처 카운트

**`affectedUsageFiles: []` (0개)** — wrapper-goals.json G-003 L173 일치.

**경로 결정 근거 (D1 — C-28 N/A)**:
- wrapper-goals.json L167-172: 모든 implementFiles `D:/project/topvel_project/topvel-grid-monorepo/packages/...` 정확 prefix
- G-001의 D2 (잘못된 TOMIS prefix → monorepo 채택)와 달리 본 G-003은 정정 결정 없음 (G-002 D1과 동일)
- spec 본문 결정으로 file count 변경 (NEW 4 → NEW 3 + MODIFY 2): D2 명시. wrapper-goals.json `implementFiles` 표면은 4 파일 — 본 spec이 권위 (C-27)

**잠재 후속 영향 (참고 — 본 Goal 범위 외)**:
- G-005 alias 5종 (`legacy/BaseGrid.tsx` 등) — `loading`/`emptyText`/`onRowClick` props 그대로 매핑
- MOD-GRID-17 페이지 27개 (canonical-modules.json L564-595) — `onRowClick` event 활용 가능 (D3 추가 확장)

### 8.2 무파괴 검증

- **TOMIS 내부 0 변경**: `tw-framework-front/src/components/tomis/Grid/*.tsx`, `src/types/tomis/grid.ts`, `src/pages/**` 모두 무수정. tsc 영향 0
- **외부 monorepo MODIFY 보존 의무 (D11 + C-1)**:
  - `Grid.tsx` 257라인 → 변경은 (a) `useAutoSelectFirstRow` import+호출 1곳, (b) tbody 분기 markup 교체 (skeleton/empty 분기 추가), (c) row/cell onClick에 event 전달 + `onCellClick` 추가. 기타 sticky thead / pinning / pagination footer / sort handler markup 보존
  - `types.ts` 198라인 → import 2개 추가 + 7개 prop 추가/MODIFY (Section 2.1). 기존 16 prop 시그니처/주석 보존
  - **검증 의무 (C-1 2026-05-14 추가)**: Implementer Stage에서 git diff 또는 Read+grep으로 보존 입증 (implement-rubric F-03)
- **부모 디렉토리 실재** (H-02 외부 디렉토리 예외 충족):
  - `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/` 실재 (G-001/G-002 생성, ls 확인)
  - 모든 NEW 3 파일은 기존 디렉토리에 추가 — mkdir 불필요
- **명명 컨벤션**: `Skeleton.tsx`/`EmptyState.tsx` (PascalCase 컴포넌트 — `CheckboxColumn.tsx`/`ResizeHandle.tsx`와 일치), `useAutoSelectFirstRow.ts` (lowerCamelCase hook — `buildTableOptions.ts`/`computePinnedOffset.ts`와 일치)

### 8.3 점진 마이그레이션 (C-19)

본 Goal: NEW 3 + MODIFY 2 → 사용처 0개 → C-19 ≤5 한도 무관.
후속 점진:
- G-004: 동일 `Grid.tsx`에 imperative ref + virtualization 추가 (사용처 영향 0 유지)
- G-005: 5 alias 신규 파일 (`legacy/BaseGrid.tsx` 등) — 본 G-003의 `loading`/`emptyText`/`onRowClick` prop 직접 활용

### 8.4 롤백 전략

- **롤백 단순**: NEW 3 파일 삭제 + MODIFY 2 파일 G-002 시점 복원
- 명령:
  ```powershell
  cd D:\project\topvel_project\topvel-grid-monorepo\packages\grid-core
  Remove-Item -Force src\internal\Skeleton.tsx, src\internal\EmptyState.tsx, src\internal\useAutoSelectFirstRow.ts
  git checkout -- src\Grid.tsx src\types.ts   # G-002 시점 복원
  ```
- TOMIS git 무영향 — `tw-framework-front/` revert 불필요
- 후속 Goal 영향:
  - G-004는 G-003의 `useAutoSelectFirstRow`/`Skeleton`/`EmptyState` 미사용 → spec 단계로 회귀 영향 0
  - G-005는 `loading`/`emptyText` props 매핑 — G-003 부재 시 alias 구현이 G-001 inline empty 패턴 그대로 사용 (G-005 spec 변경 가능성 낮음)

### 8.5 번들 영향 (D10 ★ G-002 D7 inherit)

- **+3 KB 예상** (wrapper-goals.json G-003 `bundleImpact.expected: "+3 KB"`)
- **누적 (G-001 17.44 + G-002 +4 + G-003 +3) ≈ 24.44 KB / 한도 30 KB → 여유 5.56 KB**
- **G-002 D7 inherit (정책 재결정 X)**: G-004 implement 직전 `pnpm size-limit` 측정 후 25 KB 초과 시 G-005 분리 (Option A: `@tomis/grid-core/legacy` sub-entry, Option B: 별도 패키지) — 본 G-003 단계는 한도 내 통과
- C-21 사용자 승인 미필요 (본 G-003 +3 KB는 100 KB 미만)

---

## Section 9: 의존성 (peerDeps/deps/devDeps)

### peerDependencies (C-22 — grid-core/package.json L23-28에 이미 선언됨)

```json
"peerDependencies": {
  "@tanstack/react-table": "^8.0.0",
  "@tanstack/react-virtual": "^3.0.0",
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

본 G-003 신규 import:
- `Cell` from `@tanstack/react-table` (D4 onCellClick 인자) — 이미 peer 선언됨
- `MouseEvent`, `ReactNode` from `react` (D3/D6 — emptyState slot 타입) — 이미 peer 선언됨
- `useEffect` from `react` (D9 useAutoSelectFirstRow) — 이미 peer 선언됨

→ **신규 dep/peer 추가 0건** — ADR (C-9/C-20) 불필요.

### dependencies

**없음** (pure wrapper). C-22 위반 없음 (peer를 dep로 중복 선언 금지).

### devDependencies

본 Goal에서 신규 추가 0건.

### 외부 라이브러리 추가

**0건**. C-7 (AG Grid 금지) + C-16 (Wijmo 금지) 무관 — 둘 다 import 없음.

---

## Section 10: 사용자 여정

### 개발자 여정 (구현 후)

(wrapper-goals.json G-003 `userJourneySteps` 인용)

1. `loading=true` → skeleton 행 N개 (pageSize 또는 기본 5)
2. `data.length === 0` → emptyText prop 또는 emptyState slot 렌더
3. `autoSelectFirstRow=true` + 로드 후 → 첫 행 selected (AG 패턴)
4. `onRowClick(row, event)` — single click
5. `onRowDoubleClick(row, event)` — double click
6. `onCellClick(cell, row, event)` — cell click

### 최종 사용자 여정 (페이지 사용 시 보이는 동작)

| 시나리오 | 보이는 동작 |
|---------|-----------|
| 로딩 중 (`loading=true`) | thead 정상 렌더 (G-002 sticky 보존) + tbody에 회색 펄스 행 N개 (BaseGrid 시각 차용) |
| 빈 결과 + slot (`emptyState`) | 사용자 정의 ReactNode (예: 이미지 + "신규 등록" 버튼) 표시 |
| 빈 결과 + text (`emptyText="..."` ) | 회색 안내 텍스트 1행 (G-001 외관 보존) |
| autoSelectFirstRow + 데이터 로드 | 첫 행 자동 선택 (`bg-blue-50` 강조 — G-001 selected row 시각 보존) |
| 행 클릭 (onRowClick) | row callback 호출 + selectionMode 'single' 시 행 선택 (G-001 BaseGrid L191-194 패턴 보존) |
| 셀 클릭 (onCellClick) | 셀 콜백 호출 후 row 콜백 호출 (DOM 버블 — EC-04). 셀에서 `stopPropagation` 시 row 미호출 |

---

## Section 11: 구현 계획

### 11.1 파일별 변경 명세 (Before/After ≥1 코드 블록 — rubric E-02)

**Step 1 (MODIFY) — `types.ts`** — D3/D4/D5/D6/D7/D8/D9 신규 7 prop + import 추가

Before (G-002 산출물 — types.ts L10-17 imports + L150-154 onRow* + L160 emptyText):

```ts
import type {
  ColumnDef,
  ColumnPinningState,
  ColumnSizingState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
} from '@tanstack/react-table';

// ...
export interface GridProps<TData> {
  // ...
  /** 행 클릭 — `onRowClick(row.original)`. */
  onRowClick?: (row: TData) => void;
  /** 행 더블 클릭 — `onRowDoubleClick(row.original)`. */
  onRowDoubleClick?: (row: TData) => void;
  // ...
  /** 빈 결과 안내 텍스트 (default `'데이터가 없습니다.'`). */
  emptyText?: string;
  // ...
}
```

After (G-003):

```ts
import type {
  Cell,                        // ★ G-003 추가 (D4)
  ColumnDef,
  ColumnPinningState,
  ColumnSizingState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
} from '@tanstack/react-table';
import type { MouseEvent, ReactNode } from 'react';   // ★ G-003 추가

// ... (G-002 type alias 보존)

export interface GridProps<TData> {
  // ─── (G-001/G-002 기존 prop 보존 — D11) ───

  // ─── 이벤트 (G-001 → D3 시그니처 확장) ───
  /**
   * 행 클릭 핸들러. `(row.original, event)` 시그니처.
   * G-001 시그니처 `(row: TData) => void` 와 backward-compatible (event 무시 가능 — 함수 contravariance).
   * @see G-003-spec.md Section 2.1 D3
   */
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  /** 행 더블 클릭 — `onRowClick` 와 동일 시그니처 정책. */
  onRowDoubleClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;

  // ─── G-003 신규: 셀 클릭 (D4) ───
  /** 셀 클릭 — column-level 분기 의도 노출. row click 동시 fire (DOM 버블, EC-04). */
  onCellClick?: (
    cell: Cell<TData, unknown>,
    row: TData,
    event: MouseEvent<HTMLTableCellElement>,
  ) => void;

  // ─── G-003 신규: 로딩 (D5/D8) ───
  /** 로딩 상태 — `<tbody>` 영역만 skeleton row 로 치환 (thead 보존). */
  loading?: boolean;
  /** skeleton 행 개수 (default `pagination.pageSize ?? 5`). */
  loadingRowCount?: number;

  // ─── G-003 신규: 빈 상태 slot (D6/D7) ───
  /** 빈 결과 ReactNode slot — 우선순위 1 (D7). 미제공 시 emptyText fallback. */
  emptyState?: ReactNode;

  // ─── G-003 신규: 첫 행 자동 선택 (D9) ───
  /**
   * 데이터 로드 후 첫 행 자동 선택 (default `false`).
   * - `rowSelection='none'` no-op
   * - `'multi'` 시 첫 1행만 (single behavior — AG 패턴)
   */
  autoSelectFirstRow?: boolean;

  // ─── (G-001/G-002 기존 emptyText/디버그 등 prop 보존 — D11) ───
}
```

기존 G-001 `onRowClick`/`onRowDoubleClick` 시그니처 한 줄만 교체 (다른 prop 영역 무변경).

**Step 2 (NEW) — `internal/Skeleton.tsx`** — Section 2.2 시그니처 구현 (BaseGrid L122-132 흡수)

```tsx
// internal/Skeleton.tsx (NEW — D2/D5)
import type { Table } from '@tanstack/react-table';

export interface SkeletonRowsProps<TData> {
  count: number;
  table: Table<TData>;
}

/**
 * `<tbody>` skeleton row N개 (BaseGrid L122-132 흡수, D5).
 * thead 무렌더 — Grid.tsx 의 정상 thead (G-002 sticky/pinning) 보존.
 */
export function SkeletonRows<TData>({ count, table }: SkeletonRowsProps<TData>): JSX.Element {
  const columnCount = table.getAllLeafColumns().length;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={`skeleton-${i}`} className="border-b border-gray-100">
          {Array.from({ length: columnCount }).map((__, j) => (
            <td key={`skeleton-${i}-${j}`} className="px-4 py-3">
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
```

**Step 3 (NEW) — `internal/EmptyState.tsx`** — Section 2.3 시그니처 구현 (G-001 Grid.tsx L149-157 추출, D6)

```tsx
// internal/EmptyState.tsx (NEW — D2/D6/D7)
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  colSpan: number;
  slot?: ReactNode;
  text?: string;
  defaultText?: string;
}

/**
 * 빈 결과 `<tr><td colSpan>...</td></tr>` 1행 (G-001 Grid.tsx L149-157 추출, D6).
 *
 * 우선순위 (D7): slot → text → defaultText.
 */
export function EmptyState({ colSpan, slot, text, defaultText }: EmptyStateProps): JSX.Element {
  // D7 우선순위 결정
  const content: ReactNode = slot !== undefined
    ? slot
    : text !== undefined
      ? text
      : defaultText;
  return (
    <tr>
      <td
        colSpan={colSpan || 1}
        className="px-4 py-10 text-center text-gray-400"
      >
        {content}
      </td>
    </tr>
  );
}
```

**Step 4 (NEW) — `internal/useAutoSelectFirstRow.ts`** — Section 2.4 시그니처 구현 (AggridTable L78-85 패턴, D9)

```ts
// internal/useAutoSelectFirstRow.ts (NEW — D2/D9)
import { useEffect } from 'react';
import type { Table } from '@tanstack/react-table';
import type { RowSelectionMode } from '../types';

/**
 * 데이터 로드 후 첫 행 자동 선택 (AggridTable L78-85 패턴 차용 — R-A).
 *
 * @see G-003-spec.md Section 2.4 + D9
 */
export function useAutoSelectFirstRow<TData>(
  table: Table<TData>,
  enabled: boolean,
  dataLength: number,
  selectionMode: RowSelectionMode,
): void {
  useEffect(() => {
    if (selectionMode === 'none') return;     // D9 no-op
    if (!enabled) return;                      // 사용자 selection 보존
    if (dataLength === 0) {
      table.setRowSelection({});               // 데이터 없음 → 선택 해제 (AggridTable L83 패턴)
      return;
    }
    const firstRow = table.getRowModel().rows[0];
    if (!firstRow) return;
    table.setRowSelection({ [firstRow.id]: true });  // single behavior — multi 시에도 첫 1행만 (D9)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLength, enabled, selectionMode]);
}
```

**Step 5 (MODIFY) — `Grid.tsx`** — useAutoSelectFirstRow 호출 + tbody 분기 변경 + click 호출부 확장

Before (G-002 산출물 Grid.tsx L74-89 — table 생성 직후):

```tsx
const table = useReactTable<TData>({
  ...options,
  data: props.data,
  columns: effectiveColumns,
});

const showPagination = props.enablePagination === true;
const totalRows = showPagination
  ? props.pagination?.manual === true && typeof props.pagination.totalCount === 'number'
    ? props.pagination.totalCount
    : table.getFilteredRowModel().rows.length
  : 0;
// ...
```

After (G-003 추가 — useReactTable 호출 직후):

```tsx
const table = useReactTable<TData>({
  ...options,
  data: props.data,
  columns: effectiveColumns,
});

// G-003: 정규화된 selectionMode 추출 — buildTableOptions 결과의 selectionMode 사용 (이미 산출됨)
//        ↑ const { options, effectiveColumns, selectionMode } = buildTableOptions(...) 변경 필요 (구조분해 추가)
// G-003: 첫 행 자동 선택 (D9)
useAutoSelectFirstRow<TData>(
  table,
  props.autoSelectFirstRow === true,
  props.data.length,
  selectionMode,
);

const showPagination = props.enablePagination === true;
// ... (기존 보존)
```

Before (G-001 산출물 Grid.tsx L148-167 — tbody 분기):

```tsx
<tbody className={tbodyClassName}>
  {table.getRowModel().rows.length === 0 ? (
    <tr>
      <td
        colSpan={table.getAllColumns().length || 1}
        className="px-4 py-10 text-center text-gray-400"
      >
        {props.emptyText ?? DEFAULT_EMPTY_TEXT}
      </td>
    </tr>
  ) : (
    table.getRowModel().rows.map((row) => (
      <tr
        key={row.id}
        className={...}
        onClick={() => props.onRowClick?.(row.original)}
        onDoubleClick={() => props.onRowDoubleClick?.(row.original)}
      >
        {row.getVisibleCells().map((cell) => {
          // ... (G-002 pinning markup)
          return <td key={cell.id} className={...} style={cellStyle}>...</td>;
        })}
      </tr>
    ))
  )}
</tbody>
```

After (G-003 — D5 loading 분기 추가, D6 EmptyState 추출, D3 event 전달, D4 onCellClick):

```tsx
<tbody className={tbodyClassName}>
  {props.loading === true ? (
    /* D5: loading=true 시 tbody 영역만 SkeletonRows 치환 (thead 보존) */
    <SkeletonRows
      count={props.loadingRowCount ?? pagination.pageSize ?? 5}
      table={table}
    />
  ) : table.getRowModel().rows.length === 0 ? (
    /* D6: G-001 inline empty markup → EmptyState 추출 후 1라인 호출
       D12: getAllColumns() → getAllLeafColumns() 정정 (현재 group columns 부재 → 동일 결과, MOD-GRID-14 미래 호환) */
    <EmptyState
      colSpan={table.getAllLeafColumns().length}
      slot={props.emptyState}
      text={props.emptyText}
      defaultText={DEFAULT_EMPTY_TEXT}
    />
  ) : (
    table.getRowModel().rows.map((row) => (
      <tr
        key={row.id}
        className={...}                              /* G-001/G-002 className 보존 */
        onClick={(event) => props.onRowClick?.(row.original, event)}        /* D3 event 전달 */
        onDoubleClick={(event) => props.onRowDoubleClick?.(row.original, event)}
      >
        {row.getVisibleCells().map((cell) => {
          // ... (G-002 pinning markup 보존)
          return (
            <td
              key={cell.id}
              className={...}
              style={cellStyle}
              onClick={(event) => props.onCellClick?.(cell, row.original, event)}   /* D4 신규 */
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </tr>
    ))
  )}
</tbody>
```

또한 import 추가 (Grid.tsx 상단):

```tsx
import { SkeletonRows } from './internal/Skeleton';
import { EmptyState } from './internal/EmptyState';
import { useAutoSelectFirstRow } from './internal/useAutoSelectFirstRow';
```

### 11.2 구현 순서 (의존성 고려, ≥2단계)

1. **Step 1 — `types.ts` MODIFY** (Cell/MouseEvent/ReactNode import + 7 prop) → 검증: `tsc --noEmit` 0 error
2. **Step 2 — `internal/Skeleton.tsx` NEW** → 검증: types import 가능 + tsc 통과
3. **Step 3 — `internal/EmptyState.tsx` NEW** → 검증: ReactNode import + tsc 통과
4. **Step 4 — `internal/useAutoSelectFirstRow.ts` NEW** → 검증: RowSelectionMode import + tsc 통과 + 단위 테스트 (T-07~T-10)
5. **Step 5 — `Grid.tsx` MODIFY** (모든 internal 사용 + tbody 분기 + click 확장 + selectionMode 구조분해) → 검증: tsc + Storybook 시각
6. **Step 6 — 빌드 검증** → `pnpm --filter @tomis/grid-core build` (tsup CJS+ESM dual + dts) + `pnpm size-limit` (≤30 KB AC-009)
7. **Step 7 — Storybook story 작성** (Section 12 검증 계획) → Visual regression baseline (G-005 비교 기준)

### 11.3 위험 요소

| 위험 | 가능성 | 처리 |
|------|--------|------|
| **D3 시그니처 확장 회귀** — TypeScript 함수 contravariance 안전하지만 사용자가 lambda 인자 타입 명시 시 (`(row: User) => ...` vs `(row: User, event) => ...`) 컴파일 OK + 런타임 동일. **그러나 inline arrow `(row, event) => ...`로 명시한 사용자가 G-001 시기 작성한 코드는 event 인자 미사용 → IDE warning 없음** | 낮 | TypeScript는 contravariance — 리스크 0. AC-008 보존 검증으로 sufficient. README 노트 권장 |
| **D5 skeleton 적용 범위** — 사용자가 BaseGrid 시기 별도 table 회귀(early return) 가정 시 외관 차이 가능 (thead 컬럼이 normal 렌더 vs L113-120 skeleton-th) | 낮 | D5 정책 결정 — README 노트 + Storybook `Grid/Loading` 스토리 명시 |
| **D9 useAutoSelectFirstRow deps 차이** — AggridTable은 `[rowData, autoSelectFirstRow]` (ref 변경마다 재선택), 본 G-003은 `[dataLength, ...]` (length 동일 시 보존) | 중 | EC-06 명시 + JSDoc Section 2.4 명시. 사용자 의도 시 `key` prop 권장 |
| **번들 누적 한도 24.44 KB / 30 KB** (G-002 D7 inherit) | 낮 | D10 정책 — G-002 D7 위임. G-004 직전 측정 의무 |
| **D4 onCellClick 동시 fire** — 사용자가 cell click + row click 모두 등록 시 의도 외 row 콜백 발생 | 중 | EC-04 명시 + JSDoc + README. `event.stopPropagation()` 사용자 책임 |
| **wrapper-goals.json L167-172 Grid.tsx NEW vs 본 spec MODIFY 분류 불일치** | 발견됨 | D2 결정 — spec 본문 권위 (C-27). 후속: 메인이 wrapper-goals.json 정정 (NEW 4 → NEW 3 + MODIFY 2) |
| pnpm 미설치 환경 build 검증 불가 | 낮 | EC-07 documented-deviation — `npx tsc --noEmit` 폴백 |
| **SkeletonRows의 Fragment 반환** — `<>` 가 `<tbody>` 직속 자식 OK (React 17+) but type Cell이 `Cell<TData, unknown>` 일 때 Implementer가 generic 추론 실수 가능 | 낮 | Section 2.4 시그니처 명시 + tsc 검증 (AC-007) |

---

## Section 12: 검증 계획

### 단위 테스트 (vitest)

| 테스트 | 시나리오 |
|-------|---------|
| T-01 `<SkeletonRows count=5 table={mockTable, leafColumns: 3} />` | tr 5개 + 각 td 3개 + animate-pulse div 15개 |
| T-02 `<SkeletonRows count=10 ... />` | tr 10개 |
| T-03 `<SkeletonRows count=0 ... />` | 빈 fragment (no tr) |
| T-04 `<EmptyState colSpan=4 slot={<div data-testid="custom"/>} />` | custom slot 렌더, text/defaultText 무시 (D7 우선순위) |
| T-05 `<EmptyState colSpan=4 text="없음" defaultText="default" />` | "없음" 렌더, defaultText 무시 |
| T-06 `<EmptyState colSpan=4 defaultText="default" />` | "default" 렌더 |
| T-07 `useAutoSelectFirstRow(table, true, 5, 'single')` | useEffect 호출 후 setRowSelection({"0":true}) 호출 (mocked table) |
| T-08 `useAutoSelectFirstRow(table, true, 0, 'single')` | setRowSelection({}) 호출 (선택 해제) |
| T-09 `useAutoSelectFirstRow(table, true, 5, 'none')` | setRowSelection 미호출 (no-op — D9) |
| T-10 `useAutoSelectFirstRow(table, false, 5, 'single')` | setRowSelection 미호출 (사용자 selection 보존) |
| T-11 `<Grid loading=true />` | tbody에 SkeletonRows 렌더 (실제 data 무시 — EC-01) |
| T-12 `<Grid data=[{...}] onRowClick={fn} />` + click | fn 호출, event 인자 instanceof MouseEvent (D3) |
| T-13 `<Grid data=[{...}] onCellClick={fn} onRowClick={rowFn} />` + cell click | cell fn 먼저 fire, 이어서 row fn fire (DOM 버블 — EC-04) |

위치: `packages/grid-core/src/__tests__/Skeleton.test.tsx` + `EmptyState.test.tsx` + `useAutoSelectFirstRow.test.ts` + `Grid.G-003.test.tsx` (vitest + @testing-library/react)

### 시각 회귀 (Storybook + Chromatic 또는 수동 스크린샷 — C-13/C-17)

**필수** (migrationImpact: high — C-17): 본 G-003 자체는 사용처 0개이지만 G-005/MOD-GRID-17 비교 baseline 캡처 의무.

| Story | 시나리오 |
|-------|---------|
| `Grid/Loading` | data=[] + loading=true → SkeletonRows 5개 표시 |
| `Grid/LoadingWithPinning` (D5/AC-010) | enableColumnPinning + loading=true → thead pinned 보존 + tbody skeleton |
| `Grid/EmptyText` | data=[] + loading=false + emptyText="검색 결과가 없습니다" → text 표시 |
| `Grid/EmptySlot` | data=[] + emptyState={<커스텀 컴포넌트/>} → slot 렌더 |
| `Grid/EmptyDefault` | data=[] (모든 prop 미지정) → "데이터가 없습니다." 표시 |
| `Grid/AutoSelectSingle` | data=[5 rows] + autoSelectFirstRow + rowSelection='single' → 첫 행 bg-blue-50 |
| `Grid/AutoSelectMulti` | data=[5 rows] + autoSelectFirstRow + rowSelection='multi' → 첫 행만 1개 선택 (D9) |
| `Grid/AutoSelectNone` (EC-05) | data=[5 rows] + autoSelectFirstRow + rowSelection='none' → 선택 없음 (no-op) |
| `Grid/RowClickWithEvent` (D3) | onRowClick={(row,event)=>console.log(event.shiftKey)} → shift+click 시 콘솔 |
| `Grid/CellClickStopPropagation` (D4/EC-04) | onCellClick={(cell,row,event)=>{event.stopPropagation(); ...}} → row click 차단 |

위치: `packages/grid-core/src/__stories__/Grid.stories.tsx` (G-001/G-002 story 파일에 추가)

**vs BaseGrid 수동 비교** (AC-002):
- `tw-framework-front` BaseGrid loading + emptyText 사용 페이지 스크린샷 캡처 (baseline)
- `<Grid loading emptyText />` Storybook 동일 데이터 캡처
- pixel-diff 또는 수동 비교 노트 (skeleton row count, empty cell padding/color 외관 일치)

### 빌드 검증 (C-12)

```powershell
cd D:\project\topvel_project\topvel-grid-monorepo

# typecheck (G-001/G-002 보존 + G-003 추가)
pnpm --filter @tomis/grid-core typecheck   # exit 0 (AC-007)

# build (tsup CJS+ESM dual + dts)
pnpm --filter @tomis/grid-core build       # exit 0 (AC-007)

# size-limit
pnpm size-limit --json                     # @tomis/grid-core ≤ 30 KB (AC-009)

# G-001/G-002 보존 입증 (AC-008 + D11)
git diff packages/grid-core/src/Grid.tsx packages/grid-core/src/types.ts
# 변경 라인이 G-003 신규 prop / Skeleton 분기 / EmptyState 호출 / onCellClick td onClick / autoSelect 훅 호출만인지 검증
```

### 자동 보완 가능 항목

- 누락된 type export → N/A (D2 — index.ts 무수정)
- `any` 우발 사용 → ESLint `@typescript-eslint/no-explicit-any` rule 차단
- 인라인 style 우발 → 본 G-003은 동적 style 0건 (Skeleton/EmptyState 모두 className only)
- BaseGrid `loading`/`emptyText` codemod (BaseGrid → Grid) — G-005 alias 자동 매핑

---

## Section 13: 상용 제품화 영향

### F-01: 패키지 분류

본 Goal 대상 패키지: **`@tomis/grid-core` (`packages/grid-core`)** — **MIT** licenseTier (canonical-modules.json L75 + grid-core/package.json L5 `"license": "MIT"`).

### F-02: Pro 라이선스 검증

**N/A** — MIT 패키지. `configureGridLicense()` 호출 불필요 (MOD-GRID-99-A는 Pro 패키지 전용).

### F-03: 문서 작성 계획 (C-25)

| 산출물 | 위치 | 작성 시기 |
|--------|------|----------|
| Storybook story 10개 (G-003 추가 — Section 12 시나리오) | `packages/grid-core/src/__stories__/Grid.stories.tsx` | 본 Goal Step 7 |
| README.md 업데이트 | `packages/grid-core/README.md` | 본 Goal Step 7 (Loading/EmptyState/AutoSelectFirstRow/Click events 섹션 + EC-04 stopPropagation 노트 + EC-06 deps 차이 노트) |
| Docusaurus 페이지 | `apps/docs/docs/grid-core/Grid.mdx` | MOD-GRID-99-B (별도 Goal) |
| API reference (TypeDoc) | 자동 생성 | MOD-GRID-99-B |
| JSDoc | `types.ts` 신규 7 prop 위에 `/** ... */` (Section 2.1 주석 수준) — `@param`/`@remarks`/`@see` 모두 포함 | 본 Goal Step 1 |
| Skeleton/EmptyState/useAutoSelectFirstRow JSDoc | NEW 파일 export 함수마다 (Section 2.2~2.4 주석 수준) | 본 Goal Step 2-4 |

### F-04: peerDependencies 정책 (C-22)

`peerDependencies` 변경 0 — `package.json` L23-28 보존. `dependencies`에 중복 선언 0건 (Section 9). 본 Goal은 **C-22 위반 0**.

---

## ★ 메타 게이트 H 자가 점검 결과

| 항목 | 결과 | Evidence |
|------|------|----------|
| **H-01: referenceEvidence 경로 실재** | **YES** | L0 `BaseGrid.tsx` L1-99 + L100-189 — Read 완료 (전체 ~292 lines, skeleton L108-137 + empty L170-178 + onClick L181-196 발췌 인용). L0 `AggridTable.tsx` L75-92 — Read 완료 (autoSelectFirstRow useEffect L78-85 발췌). L0 monorepo `Grid.tsx` L1-257 + `types.ts` L1-198 — Read 완료 (G-001+G-002 산출물 전체). L1 `references/tanstack-api-inventory.md` §3 — G-001 spec L113-145 재인용 (Cell 신규 인용 본 spec Section 2.1 D4 명시). L2 `references/current-tanstack-analysis.md` L101-113 §5 — Read 확인 (skeleton+empty 8/8 패턴 L111). L3 `wrapper-goals.json` G-003 L131-185 — Read 확인 (`affectedUsageFiles: []`). R-A `references/publish-aggrid-analysis.md` L42-92 §3 + AggridTable 직접 Read — 확인. **모든 경로 spec D1~D11 + Section 1 표에 명시 + Read 도구 호출 증거 있음. TOMIS path segment 누락 없음 (cross-check 완료).** |
| **H-02: implementFiles 경로 합리성** | **YES** | 부모 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/` 실재 확인 (`ls` 실행: `CheckboxColumn.tsx`, `ResizeHandle.tsx`, `buildTableOptions.ts`, `computePinnedOffset.ts` 4 파일 존재 — G-001/G-002 생성). `Grid.tsx` 257 라인 + `types.ts` 198 라인 + `index.ts` Read 완료. 신규 디렉토리 mkdir 불필요 — 모든 NEW 3 파일은 기존 `internal/`에 추가. 5개 파일 모두 monorepo 컨벤션 (`.tsx`/`.ts`, PascalCase 컴포넌트 — `Skeleton.tsx`/`EmptyState.tsx`, lowerCamelCase hook — `useAutoSelectFirstRow.ts`). C-28 N/A (wrapper-goals.json prefix 정확). |
| **H-03: AC 출처 태그 검증** | **YES** | AC-001 `L0 + D5/D8/D12` → Section 1 L0 BaseGrid L122-132 발췌 + Section 11.1 Step 4 SkeletonRows + D5/D8 결정 본문 + D12 leaf 정정. AC-002 `L0 + D6/D7/D12` → Section 1 L0 BaseGrid L170-178 + G-001 Grid.tsx L149-157 발췌 + Section 11.1 Step 4 EmptyState + D6/D7 + D12 colSpan 정정. AC-003 `R-A + D9` → Section 1 R-A AggridTable L78-85 발췌 + Section 11.1 Step 4 useAutoSelectFirstRow + D9. AC-004 `L0 + D3/D4` → Section 1 L0 BaseGrid L181-196 row click + G-001 Grid.tsx L165-166 onClick 호출부 + D3/D4 시그니처. AC-005 `C-25` → Section 13 F-03 + Section 2.1~2.4 JSDoc 시그니처 인용. AC-006 `C-5` → Section 11.1 Skeleton/EmptyState Tailwind className only 명시. AC-007 `C-12` → Section 12 빌드 검증 명시. AC-008 `C-1 + D11` → Section 8.2 보존 의무 + D11 결정 본문. AC-009 `C-21 + D10` → Section 8.5 + G-002 D7 inherit. AC-010 `C-13/C-17 + G-002 D6` → Section 12 Storybook + G-002 baseline 비교. **모든 출처가 spec 본문에서 실제 인용됨**. |

**모든 H 항목 YES → 일반 채점 진행 가능**.

---

## ★ 사전 결정 표 ↔ 본문 cross-consistency 검증 (rubric G-01 v1.0.4 강화 — breakdown 일치 의무)

### 합계 + 분류 + 항목 이름 3중 일치 검증 (G-01 v1.0.4)

| D# | 표 핵심 값 (breakdown 포함) | 본문 위치 | 일치 검증 |
|----|---------------------------|----------|----------|
| D1 | monorepo `topvel-grid-monorepo/packages/grid-core/`. wrapper-goals.json prefix 정확 (C-28 N/A) | Section 7 헤더 + 표 + Section 8.1 결정 근거 | ✅ |
| D2 | **NEW 3 + MODIFY 2 = 5 파일**. NEW: `Skeleton.tsx`, `EmptyState.tsx`, `useAutoSelectFirstRow.ts`. MODIFY: `Grid.tsx`, `types.ts`. (`index.ts` 무수정) | Section 7 표 (5 행 — 정확히 NEW 2/3/4 + MODIFY 1/5 일치) + Section 11.1 Step 1~5 (Step 1=types.ts MODIFY 행#1, Step 2=Skeleton NEW 행#2, Step 3=EmptyState NEW 행#3, Step 4=useAutoSelectFirstRow NEW 행#4, Step 5=Grid.tsx MODIFY 행#5) | ✅ 합계+분류+이름 3중 일치 |
| D3 | `onRowClick` 시그니처 `(row: TData) => void` → `(row: TData, event: MouseEvent<HTMLTableRowElement>) => void` (additive 확장) | Section 2.1 (onRowClick/onRowDoubleClick prop 정의) + Section 4 breaking=false + AC-004 + Section 11.1 Step 1 Before/After | ✅ |
| D4 | `onCellClick` 시그니처 `(cell: Cell<TData, unknown>, row: TData, event: MouseEvent<HTMLTableCellElement>) => void` | Section 2.1 (onCellClick prop 정의) + AC-004 + Section 11.1 Step 5 td onClick | ✅ |
| D5 | Skeleton 적용 범위 = `<tbody>` 만 교체 (thead 보존). 별도 `<table>` 회귀 채택 안 함 | Section 2.2 (Skeleton 시그니처 + thead 무렌더 명시) + Section 11.1 Step 5 tbody 분기 + AC-001 | ✅ |
| D6 | EmptyState = G-001 Grid.tsx L149-157 추출 (7라인 → 1라인 호출). G-001 emptyText prop 보존 | Section 2.3 + Section 11.1 Step 3 EmptyState + Step 5 Grid.tsx Before/After + AC-002 | ✅ |
| D7 | emptyText vs emptyState 우선순위: slot → text → defaultText | Section 2.3 EmptyState props + Section 11.1 Step 3 우선순위 결정 코드 + Section 6 EC-03 + AC-002 | ✅ |
| D8 | loadingRowCount default = `pagination.pageSize ?? 5` | Section 2.1 prop JSDoc + Section 11.1 Step 5 호출부 (`props.loadingRowCount ?? pagination.pageSize ?? 5`) + AC-001 + Section 6 EC-02 | ✅ |
| D9 | useAutoSelectFirstRow deps `[dataLength, enabled, selectionMode]`. selectionMode='none' no-op. 'multi' 시 첫 1행만 | Section 2.4 시그니처 + Section 11.1 Step 4 useEffect 코드 + AC-003 + Section 6 EC-05/EC-06 | ✅ |
| D10 | 한도 30 KB. G-002 D7 inherit (정책 재결정 X). 누적 G-001 17.44 + G-002 +4 + G-003 +3 ≈ 24.44 KB | Section 8.5 + Section 12 빌드 검증 + AC-009 | ✅ |
| D11 | G-001 Grid.tsx + G-002 sticky/pinning + G-001/G-002 buildTableOptions 보존 의무 | Section 8.2 무파괴 검증 + Section 11.3 위험 표 + AC-008 | ✅ |
| D12 | EmptyState colSpan + SkeletonRows column count = `table.getAllLeafColumns().length` (G-001 `getAllColumns()` 정정 — 명시적 leaf semantics) | Section 2.2 SkeletonRowsProps JSDoc + Section 2.3 EmptyStateProps JSDoc + Section 11.1 Step 5 After 코드 주석 + AC-001 + AC-002 | ✅ |

### Cross-check: D2 ↔ Section 7 ↔ Section 11 (G-01 v1.0.4 핵심)

| 검증 | 표 행 | 본문 라인 |
|------|------|----------|
| **합계 일치**: D2 명시 5 파일 == Section 7 표 5행 == Section 11.1 Step 1~5 | ✅ | 5=5=5 |
| **분류 일치**: D2 명시 NEW 3 + MODIFY 2 == Section 7 표 NEW 3행(#2/#3/#4) + MODIFY 2행(#1/#5) | ✅ | NEW:Skeleton/EmptyState/useAutoSelectFirstRow / MODIFY:types.ts/Grid.tsx |
| **항목 이름 일치**: D2 enumerate 5 파일 이름 == Section 7 표 5행 파일 이름 == Section 11.1 Step 1~5 변경 대상 이름 | ✅ | `Skeleton.tsx` / `EmptyState.tsx` / `useAutoSelectFirstRow.ts` / `Grid.tsx` / `types.ts` 모두 1:1 매칭 |

**G-01 v1.0.4 강화 룰 통과** — D# 합계만 일치하고 breakdown 다른 G-002 D4 사례 (NEW 3+MODIFY 3 vs 본문 NEW 2+MODIFY 4) 재발 0건.

---

## Spec 작성 메타

- **작성자**: tw-grid Spec Writer (Agent 위임 — C-15)
- **사전 읽기**: 13개 파일 (constraints.md, specify-rubric.md v1.0.4, canonical-modules.json, references/ 5개, goals.json, G-001-spec.md, G-002-spec.md L1-1198, BaseGrid.tsx L1-189, AggridTable.tsx L75-92, monorepo Grid.tsx + types.ts + buildTableOptions.ts + index.ts + .size-limit.json + package.json)
- **저장 경로**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/artifacts/MOD-GRID-01/wrapper/G-003-spec.md`
- **Section 카운트**: 13/13 (Section 1~13 모두 작성)
- **rubric 31항목 자가 점검**: A(5)+B(5)+C(5)+D(6)+E(5)+F(4)+G(1)=31 — 모두 충족 의도. Coverage Verifier 독립 검증 대기.
- **G-01 v1.0.4 강화 룰 첫 적용**: D2 NEW/MODIFY breakdown + 파일 이름 enumeration 본문 100% 일치 (Section 7 + Section 11 cross-check 검증 완료)
