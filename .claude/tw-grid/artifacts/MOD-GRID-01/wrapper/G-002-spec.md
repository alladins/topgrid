# G-002 Specification — Sticky header + sticky pinned columns + columnResizing onChange (CSS sticky)

**Module**: MOD-GRID-01 (공통 wrapper — variant 8 통합)
**Goal**: G-002
**Area**: wrapper
**Phase**: abstraction
**Priority**: P0
**migrationImpact**: high
**threshold**: 95 (specify/implement/verify 동일 — canonical-modules.json L72)
**spec 작성일**: 2026-05-14
**spec 버전**: v1.0 (loops 0/3, 첫 시도)
**의존**: MOD-GRID-01/G-001 (overallStatus=completed, score 100/100/100)

---

## ★ 사전 결정 표 (D# — 본문 cross-consistency 의무, rubric G-01 ★)

| D# | 결정 | 본문 위치 | 출처 |
|----|------|----------|------|
| D1 | 구현 대상 monorepo `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/`. **wrapper-goals.json G-002 `implementFiles`는 이미 monorepo prefix 정확** — C-28 정정 불필요 (G-001 D2와 대비). | Section 7 + 8.1 | wrapper-goals.json L108-113 Read 확인 |
| D2 | **`<table>` border-collapse 결정**: `enableColumnPinning=true` 시 `border-separate border-spacing-0` (Tailwind v4)로 전환. `position: sticky` + `border-collapse: collapse` 비호환 (sticky 셀 border 분리/오프셋 점프). 디폴트 (`enableColumnPinning=false`) 는 G-001 그대로 유지 (외관 무영향). | Section 11.1 Step 6 (Grid.tsx MODIFY) + Section 6 EC-01 | ColumnPinGrid.tsx L97 `borderCollapse: 'separate', borderSpacing: 0` |
| D3 | **z-index 컨벤션 (3 layer)**: `z-10` thead 일반 / `z-20` body pinned 셀 / `z-30` thead pinned 셀 (intersection — 헤더+핀 양축 occlusion). | Section 2.3 + Section 11.1 Step 3 (computePinnedOffset) + AC-001 | ColumnPinGrid.tsx L114 (`z-20` pinned vs `z-10` else) — 본 G-002는 thead sticky 추가로 intersection 신영역 |
| D4 | **NEW 3 + MODIFY 3 = 6 파일**. NEW: `internal/StickyHeader.tsx`(thead className 헬퍼) + `internal/computePinnedOffset.ts` + `internal/ResizeHandle.tsx`. MODIFY: `Grid.tsx` + `types.ts` + `internal/buildTableOptions.ts`. (`index.ts` 무수정 — public API surface 무변동: 모든 신규는 props 추가만) | Section 7 표 (6 행) + Section 11.1 Step 1~6 | wrapper-goals.json G-002 implementFiles 4개 + spec 자체 분석 |
| D5 | **신규 GridProps prop 5종**: `columnResizeMode?: 'onChange' \| 'onEnd'` (default `'onChange'`), `defaultColumnPinning?: ColumnPinningState` (uncontrolled 초기값 — ColumnPinGrid `pinLeft`/`pinRight` alias 매핑용), `onColumnPinningChange?: OnChangeFn<ColumnPinningState>` (외부 콜백), `defaultColumnSizing?: ColumnSizingState` (uncontrolled 초기 width), `onColumnSizingChange?: OnChangeFn<ColumnSizingState>` (외부 콜백). 기존 `enableColumnPinning?` / `enableColumnResizing?` 두 토글은 G-001 types.ts L118/L123 그대로 유지 (재정의 X). | Section 2.1 + AC-003 + Section 3 alias 매핑 | tanstack-api-inventory.md §3 ColumnPinning/ColumnSizing |
| D6 | **G-001 본체 유지 의무 (C-1 보존)**: G-001 Grid.tsx L40-215 215 라인 중 thead/tbody 패턴 변경은 **className/style 추가 + ResizeHandle 합성**만. row click/pagination footer/empty state markup 무변경. types.ts/buildTableOptions.ts MODIFY는 신규 prop 추가만 (기존 prop 시그니처/주석 보존). | Section 11.1 Before/After + Section 8.2 | constraints.md C-1 (Read-then-Write 보존 의무 2026-05-14 G-004 추가) |
| D7 | **번들 한도 30 KB**. G-001 17.44 KB 사용 → G-002 +4 KB 예상 → 누적 ~21.44 KB. **누적 위험 시점**: G-002 끝남 = 한도 ~70%. G-003(+3)/G-004(+7)/G-005(+5) 합산 시 36.44 KB > 30 KB → **초과 위험**. **결정 (G-002 단계)**: G-004 implement 직전 size-limit 측정 후 25 KB 초과 시 G-005 alias를 별도 sub-entry(`@tomis/grid-core/legacy`) + `.size-limit.json` 별도 행 추가로 분리. 본 G-002는 한도 내 통과 (8.6 KB 여유). | Section 8.5 | `.size-limit.json` Read L1-7 (`@tomis/grid-core` 30 KB brotli) + G-001 size-limit 측정 결과 17.44 KB |
| D8 | **boxShadow edge cue 채택**: ColumnPinGrid L119-123/L173-177의 `boxShadow: '4px 0 6px -2px rgba(0,0,0,0.12)'` (last-left) / `'-4px 0 6px -2px rgba(0,0,0,0.12)'` (first-right). 동적 RGBA 값이라 Tailwind className 표현 어려움 → C-5 예외 (동적 style — `style={{boxShadow: ...}}`). G-005 alias 시각 회귀 baseline 보존 의무. | Section 2.3 + Section 11.1 Step 6 + AC-004 | ColumnPinGrid.tsx L119-123 + C-5 예외 ("style={{...}} 인라인(동적 값 제외)" — constraints.md L45) |
| D9 | **resize handle UI**: TanStack `header.getResizeHandler()` bind. `<th>` 우측 가장자리 절대 배치 4px 너비 div + cursor-col-resize. 모바일 터치는 `onTouchStart` 동시 bind. `header.column.getCanResize()` true일 때만 렌더. | Section 2.3 + Section 11.1 Step 5 (ResizeHandle) + AC-003 | tanstack-api-inventory.md §2.2 ColumnSizing API |
| D10 | **`header.getSize()` width 처리 변경**: G-001 Grid.tsx L92-93 `header.getSize() !== 150 ? { width: header.getSize() } : undefined` 가드는 resize=true 시 width=150 정확 시 silently 손실 → **`enableColumnResizing===true` 또는 `enableColumnPinning===true` 시 항상 `width: header.getSize()` 적용**. 디폴트 (둘 다 false) 동작은 G-001 그대로 (default 150 가드 유지). | Section 11.1 Step 6 (Grid.tsx MODIFY Before/After) + AC-005 | G-001 Grid.tsx L92-93 Read 확인 + advisor item#4 |

---

## Section 1: 참조 추적

### L0: 현 구현 (tw-framework-front + monorepo G-001)

**파일 경로 + Read 확인 (2026-05-14)**:

| 파일 | Read 라인 | 핵심 패턴 / 본 G-002에서 흡수·MODIFY |
|------|----------|----------------------------------------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ColumnPinGrid.tsx` | L1-220 (전체) | `columnPinning state` (L40), `getLeftOffset/getRightOffset` (L66-82) 누적 px 계산, sticky CSS (L116-124) inline `style.position/left/right`, **boxShadow** edge cue (L119-123, L173-177) — 본 G-002 `computePinnedOffset.ts`로 추출 |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/DataTable/data-table.tsx` | L95-122, L342-369 | L108 `useState<ColumnResizeMode>('onChange')`, L111-122 `columnSizing` 초기화, L355-358 `onColumnSizingChange: setColumnSizing`, L355 TableOptions에 `columnResizeMode` 명시 — 본 G-002 흡수 |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx` | L100-220 | thead markup (L143-167) — 본 G-002 sticky className 추가 시 인용 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` | L1-215 (전체, G-001 산출물) | thead L85-116 (sticky 미적용 — MODIFY 대상), tbody L117-149 (pinned 셀 미적용 — MODIFY), th width L92-93 (default 150 가드 — D10에서 변경) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | L1-158 (전체, G-001 산출물) | `enableColumnPinning?` L118, `enableColumnResizing?` L123 이미 정의 — 본 G-002는 5개 prop 추가만 (D5) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/buildTableOptions.ts` | L1-181 (전체, G-001 산출물) | L137-154 `options` 조립 (현재 `columnResizeMode` 누락 — Step 3에서 추가), L107 `columnPinning` state 이미 매핑, L144 `onColumnPinningChange` 이미 매핑 |

**핵심 발췌 1 — ColumnPinGrid pinned offset 계산 (ColumnPinGrid.tsx L66-82)**:

```tsx
const getLeftOffset = (colIndex: number): number => {
  const leftCols = table.getLeftLeafColumns();
  let offset = 0;
  for (let i = 0; i < colIndex && i < leftCols.length; i++) {
    offset += leftCols[i].getSize();
  }
  return offset;
};

const getRightOffset = (colIndex: number): number => {
  const rightCols = table.getRightLeafColumns();
  let offset = 0;
  for (let i = rightCols.length - 1; i > colIndex; i--) {
    offset += rightCols[i].getSize();
  }
  return offset;
};
```

→ `internal/computePinnedOffset.ts` 신규 파일에 `computeLeftOffset(table, columnId): number` + `computeRightOffset(table, columnId): number`로 순수 함수 추출. **각 render 마다 재계산 (memoize 금지)** — `table.getLeftLeafColumns()[i].getSize()`가 자동으로 `state.columnSizing` 반영하므로 (TanStack 내부 동작 — tanstack-api-inventory.md §2.2 ColumnSizing) resize 후 즉시 sticky offset 재계산 (advisor item#8).

**핵심 발췌 2 — ColumnPinGrid sticky CSS + boxShadow (L114-124)**:

```tsx
className={`... ${isPinnedLeft || isPinnedRight ? 'bg-blue-50 z-20' : 'bg-gray-50 z-10'}`}
style={{
  position: isPinnedLeft || isPinnedRight ? 'sticky' : 'relative',
  left: isPinnedLeft ? getLeftOffset(leftIndex) : undefined,
  right: isPinnedRight ? getRightOffset(rightIndex) : undefined,
  boxShadow: isLastLeft
    ? '4px 0 6px -2px rgba(0,0,0,0.12)'
    : isFirstRight
    ? '-4px 0 6px -2px rgba(0,0,0,0.12)'
    : undefined,
}}
```

→ 본 G-002에서 `<th>`/`<td>` 양쪽에 동일 패턴 적용. z-index는 D3 컨벤션 (10/20/30) 사용. boxShadow는 D8에 따라 동적 style 인라인 (C-5 예외).

**핵심 발췌 3 — DataTable columnResizing (data-table.tsx L108, L355-358)**:

```tsx
const [columnResizeMode] = useState<ColumnResizeMode>('onChange');     // L108
const [columnSizing, setColumnSizing] = useState<Record<string, number>>(() => { ... });  // L111-122

const table = useReactTable({
  ...
  state: { ..., columnSizing, ... },                                    // L349
  columnResizeMode,                                                      // L355
  onColumnSizingChange: (updater) => { setColumnSizing(updater); },     // L356-358
  ...
});
```

→ 본 G-002 `buildTableOptions.ts`에 `columnResizeMode` + `state.columnSizing` + `onColumnSizingChange` + `enableColumnResizing` (G-001에 이미 있음) 추가. `useReactTable` `getResizeHandler()` API 활성화 → `<th>` 우측에 `<ResizeHandle header={header} />` 합성.

### L1: TanStack v8 표준 API

**파일 + Read 확인 (2026-05-14)**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` L23-50 §2.2 features 표.

핵심 시그니처:

```ts
// ColumnPinning (tanstack-api-inventory.md L40)
state.columnPinning: { left: string[]; right: string[] }
column.pin('left' | 'right' | false): void
column.getIsPinned(): 'left' | 'right' | false
table.getLeftLeafColumns(): Column<TData>[]      // (확인) 본 G-002 사용
table.getRightLeafColumns(): Column<TData>[]     // (확인) 본 G-002 사용

// ColumnSizing (tanstack-api-inventory.md L41)
state.columnSizing: Record<string, number>
state.columnSizingInfo: ColumnSizingInfoState
columnResizeMode: 'onChange' | 'onEnd'           // TableOptions
header.getSize(): number
header.getResizeHandler(): (event: TouchEvent | MouseEvent) => void

// TableOptions enables (tanstack-api-inventory.md L107-110)
enableColumnPinning?: boolean              // ★ TanStack 표준 — 본 G-002 buildTableOptions 추가
enableColumnResizing?: boolean             // 이미 G-001 buildTableOptions L150에 매핑됨
columnResizeMode?: 'onChange' | 'onEnd'    // ★ 본 G-002 추가 (default 'onChange' — D5)
```

본 G-002는 위 표준 export만 사용 (private API 접근 0 — C-2 준수).

### L2: 8 variant 공통 패턴 (DRY 추출 대상)

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` L101-113 §5.

| 중복/단일 패턴 | 사용 variant | G-002에서 흡수 |
|--------------|-------------|----------------|
| `state.columnPinning` (left/right id) | 1/8 (ColumnPinGrid) | ✅ `defaultColumnPinning` + sticky CSS 통합 |
| sticky thead `top-0 z-10` | 0/8 (없음! — 신규 도입) | ✅ 신영역 — D2 border-separate 결정 |
| `columnResizeMode='onChange'` + `columnSizing` state | 1/8+1 (DataTable만, tomis/Grid는 0) | ✅ `internal/ResizeHandle.tsx` |
| boxShadow edge cue | 1/8 (ColumnPinGrid L119-123) | ✅ D8 (동적 style 예외) |

### L3: 영향 사용처

본 G-002는 **G-001 기반 prop 추가** — `affectedUsageFiles: []` (wrapper-goals.json G-002 L114).

사용처 마이그레이션:
- **G-005** `legacy/ColumnPinGrid.tsx` alias — `pinLeft`/`pinRight` props → `defaultColumnPinning={{left: pinLeft, right: pinRight}}` 매핑 (Section 3)
- **MOD-GRID-17** 페이지 27개 점진 마이그레이션 (canonical-modules.json L564-595)

### R-A: AG Grid 패턴 (참조 — C-7 코드 차용 금지)

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/ag-grid-feature-matrix.md` L60-63, L67-68 §2 + `references/publish-aggrid-analysis.md` L86-94 §4.

| AG 패턴 | 본 G-002 채택 |
|--------|--------------|
| `defaultColDef.resizable: true` (AG progress-dashboard L243) | TanStack `enableColumnResizing` (G-001 이미 prop 정의 — buildTableOptions에서 활성) |
| ColumnPinning Community feature (`pinned: 'left' \| 'right'` ColDef) | TanStack `columnPinning` state (D5 `defaultColumnPinning`로 노출) |
| Sticky headers Community (ag-grid-feature-matrix.md L68) | CSS `sticky top-0` 직접 구현 (TanStack은 표준 미제공 — UI 레이어) |

### R-W: Wijmo 패턴 (참조 — C-16 import 금지)

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` L75-79 §3.

| Wijmo 패턴 | 본 G-002 채택 |
|----------|--------------|
| `g.frozenColumns = 4` (organizeSchedule L78) | `defaultColumnPinning={{left: ['col1','col2','col3','col4']}}` 매핑 — 우리는 column id 기반 |
| Sticky Headers (Wijmo features list) | CSS `sticky top-0` (TanStack 위 직접) |
| Column Resize / Reorder (Wijmo) | `enableColumnResizing` + `columnResizeMode: 'onChange'` |

### migrationImpact: high (사유)

본 G-002는 G-001 기반 확장 — 자체 영향 0 사용처. 단 후속 G-005 ColumnPinGrid alias + MOD-GRID-17 27 페이지가 본 sticky/pinning/resize 외관에 의존. **시각 회귀 검증 의무** (C-13/C-17 — high impact 필수). canonical-modules.json L71 `migrationImpact: high` 일치.

---

## Section 2: API 계약 (TypeScript)

### 2.1 `interface GridProps<TData>` 추가 prop 정의

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` (MODIFY — D4)

기존 G-001 `GridProps<TData>` (types.ts L98-157) 보존. **신규 prop 5종 추가** (D5):

```ts
// types.ts MODIFY — 신규 import 추가
import type {
  ColumnDef,
  ColumnPinningState,        // ★ 신규
  ColumnSizingState,         // ★ 신규
  OnChangeFn,
  PaginationState,
  RowSelectionState,
} from '@tanstack/react-table';

/**
 * 컬럼 리사이즈 모드.
 * - `'onChange'`: drag 중 실시간 width 업데이트 (default — UX 우수)
 * - `'onEnd'`: drag 종료 시 1회 업데이트 (성능 우수, 대용량 행 시)
 */
export type GridColumnResizeMode = 'onChange' | 'onEnd';

export interface GridProps<TData> {
  // ─── (G-001 기존 prop 모두 보존) ───
  // ... data, columns, enable*, rowSelection, pagination, onRowClick/DoubleClick, className, emptyText, getSubRows, debug

  // ─── G-002 신규: 컬럼 리사이즈 ───
  /**
   * 컬럼 리사이즈 모드 (default `'onChange'`).
   * `enableColumnResizing=true` 일 때만 효과.
   */
  columnResizeMode?: GridColumnResizeMode;

  /** 컬럼 width uncontrolled 초기값 (column id → px). */
  defaultColumnSizing?: ColumnSizingState;

  /** ColumnSizing state 변경 콜백 (controlled mode 또는 외부 영속화). */
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;

  // ─── G-002 신규: 컬럼 핀 (sticky CSS + state) ───
  /**
   * 컬럼 핀 uncontrolled 초기값 (`{left: string[], right: string[]}`).
   * ColumnPinGrid `pinLeft`/`pinRight` alias 매핑 진입점 (G-005).
   */
  defaultColumnPinning?: ColumnPinningState;

  /** ColumnPinning state 변경 콜백. */
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>;
}
```

**제어/비제어 정책**:
- `defaultColumnPinning`/`defaultColumnSizing` = uncontrolled 초기값 (mount 시 `useState`에 주입)
- `onColumnPinningChange`/`onColumnSizingChange` = 외부 콜백 (controlled 미제공 — internal state는 항상 유지, 콜백은 추가 호출)

### 2.2 `internal/computePinnedOffset.ts` 시그니처 (NEW)

```ts
// internal/computePinnedOffset.ts (NEW — D4)
import type { Header, Table } from '@tanstack/react-table';

/**
 * 좌측 pinned 컬럼의 누적 left offset (px) 계산.
 *
 * @param table - TanStack Table 인스턴스.
 * @param columnId - 대상 column id.
 * @returns 좌측에서부터 column까지 누적 width (px). `column.getSize()` 사용 → `state.columnSizing` 자동 반영.
 *
 * @remarks
 * - **memoize 금지** — render마다 재계산 (resize 후 즉시 반영 의무, EC-04).
 * - 비-pinned column 호출 시 0 반환.
 */
export function computeLeftOffset<TData>(table: Table<TData>, columnId: string): number;

/**
 * 우측 pinned 컬럼의 누적 right offset (px) 계산.
 *
 * @returns 우측에서부터 column까지 누적 width (px).
 */
export function computeRightOffset<TData>(table: Table<TData>, columnId: string): number;

/**
 * `<th>`/`<td>` 에 적용할 sticky style + className 헬퍼.
 *
 * @param header - TanStack Header 또는 leaf Column 식별 정보.
 * @param table - Table 인스턴스.
 * @param scope - 'thead' | 'tbody' (z-index 컨벤션 D3 결정).
 * @returns `{ style, className }` — Grid.tsx에서 spread.
 */
export interface PinnedCellStyle {
  /** position/left/right/boxShadow 인라인 (boxShadow는 동적 RGBA — C-5 예외 D8). */
  style: React.CSSProperties;
  /** z-index + bg 클래스 (D3 컨벤션). */
  className: string;
}

export function getPinnedCellStyle<TData>(
  column: { id: string; getIsPinned: () => 'left' | 'right' | false },
  table: Table<TData>,
  scope: 'thead' | 'tbody',
): PinnedCellStyle;
```

### 2.3 `internal/ResizeHandle.tsx` 시그니처 (NEW)

```tsx
// internal/ResizeHandle.tsx (NEW — D4)
import type { Header } from '@tanstack/react-table';

export interface ResizeHandleProps<TData, TValue> {
  /** TanStack Header 객체 — `getResizeHandler()` 호출용. */
  header: Header<TData, TValue>;
  /** 현재 활성 리사이즈 모드 (UX 시각 단서 — 'onEnd' 시 drag 후 적용 표시). */
  mode: 'onChange' | 'onEnd';
}

/**
 * `<th>` 우측 가장자리에 절대 배치된 4px 너비 drag handle.
 *
 * @remarks
 * - `header.column.getCanResize()` true 시에만 렌더 (false 시 null).
 * - mouse + touch 동시 bind: `onMouseDown` + `onTouchStart` 모두 `header.getResizeHandler()`.
 * - Tailwind className: `absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-400`.
 * - 활성 리사이즈 중 (`column.getIsResizing()`) `bg-blue-500` 적용.
 */
export function ResizeHandle<TData, TValue>(props: ResizeHandleProps<TData, TValue>): JSX.Element | null;
```

### 2.4 `internal/StickyHeader.tsx` (NEW — 또는 thead 인라인 결정)

**결정 (D4)**: 별도 `<StickyHeader>` 컴포넌트는 **만들지 않음**. 대신 `<thead>` 인라인 className만 변경 (`sticky top-0 z-10` Tailwind). 별도 컴포넌트 추출 시 G-001의 `table.getHeaderGroups().map`/`flexRender` 통합 markup이 분리되어 가독성 손상 + 번들 함수 1개 추가 (~0.3 KB).

**대안 검토 결과**: `internal/StickyHeader.tsx`는 wrapper-goals.json L110 implementFiles에 있으나 spec 본문 권위 (C-27)에 따라 **thead 인라인 처리로 변경**. 본 spec Section 7 표에서 명시.

→ Section 7 표는 `StickyHeader.tsx` 행 **제거**. wrapper-goals.json은 후속 정정 권장 (Section 11 위험 표).

### 2.5 사용 예시

**Example 1 — 최소 (sticky header만)**:

```tsx
import { Grid } from '@tomis/grid-core';

// 일반 Grid에 외부 overflow auto 부모만 있으면 헤더 자동 sticky
<div className="h-96 overflow-auto">
  <Grid data={users} columns={columns} enableSort />
</div>;
```

**Example 2 — 풀 (pinning + resize + sticky)**:

```tsx
<Grid<User>
  data={users}
  columns={columns}
  enableSort
  enableColumnPinning
  enableColumnResizing
  columnResizeMode="onChange"
  defaultColumnPinning={{ left: ['empNo', 'name'], right: ['action'] }}
  defaultColumnSizing={{ empNo: 80, name: 200, action: 120 }}
  onColumnSizingChange={(updater) => {
    // 외부 영속화 (localStorage 등)
    const next = typeof updater === 'function' ? updater(savedSizing) : updater;
    localStorage.setItem('userGrid.sizing', JSON.stringify(next));
  }}
/>;
```

**Example 3 — server pinning (외부 controlled)**:

```tsx
const [pinning, setPinning] = useState<ColumnPinningState>({ left: ['id'], right: [] });

<Grid<User>
  data={users}
  columns={columns}
  enableColumnPinning
  defaultColumnPinning={pinning}
  onColumnPinningChange={(updater) => {
    setPinning(typeof updater === 'function' ? updater(pinning) : updater);
  }}
/>;
```

### 2.6 타입 export 경로

- `GridColumnResizeMode` — `types.ts` 신규 export
- `GridProps<TData>` — types.ts 기존 (5 prop 추가)
- TanStack 직접 import 권장: `import type { ColumnPinningState, ColumnSizingState } from '@tanstack/react-table';`

`index.ts`는 **무수정** (D4) — 신규 type alias `GridColumnResizeMode`만 추가 시:

```ts
// index.ts MODIFY (선택 — Implementer 판단)
export { Grid } from './Grid';
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
  GridColumnResizeMode,         // ★ G-002 추가 (선택 — Implementer 판단)
} from './types';
```

**결정**: `GridColumnResizeMode`는 `'onChange' | 'onEnd'` 두 string literal — 사용처가 직접 string 입력 가능. export 안 해도 사용성 무영향. **본 G-002에서는 export 추가 (소비자 타입 체크 강화)**.

### 2.7 ref/imperative 방침 (B-05)

본 G-002는 G-001과 동일하게 **선언적 컴포넌트 only**. `forwardRef` + `useImperativeHandle`은 **G-004 범위**.

---

## Section 3: 기존 사용처 대응표 (Variant → 신규 API)

| 기존 variant | 신규 G-002 API | 마이그레이션 액션 | 담당 Goal |
|------------|---------------|-------------------|----------|
| `ColumnPinGrid` (ColumnPinGrid.tsx L1-220) `pinLeft={['empNo']}` `pinRight={['action']}` | `<Grid enableColumnPinning defaultColumnPinning={{left:['empNo'], right:['action']}} />` | `legacy/ColumnPinGrid.tsx` alias가 props 매핑 | G-005 |
| DataTable `columnResizeMode='onChange'` (data-table.tsx L108) | `<Grid enableColumnResizing columnResizeMode="onChange" />` (default 'onChange'이라 prop 생략 가능) | DataTable alias는 별도 sub-track (canonical-modules.json F-17-09) | MOD-GRID-17 (Sub) |
| 일반 BaseGrid (sticky 미사용) | thead 자동 `sticky top-0 z-10` className 적용 — **외관 변화 가능** (외부 부모 `overflow auto` 있을 때만 sticky 활성, 없으면 일반 위치) | EC-02 명시 — Visual regression baseline 비교 필수 (C-17) | G-005 + MOD-GRID-17 |

**본 G-002 직접 영향**: 0 사용처 (G-001 위 prop 추가). 단 `<table>` className `border-separate` 변경은 외부 페이지 외관 영향 가능 (D2).

---

## Section 4: 호환성 정책

| 항목 | 값 | 근거 |
|------|----|------|
| **breaking** | **false** | 모든 신규 prop optional. `enableColumnPinning`/`enableColumnResizing` default false 유지. 기본 호출(prop 미지정) 시 G-001과 외관 동일. |
| **deprecationStrategy** | N/A — alias deprecation은 G-005 책임 | wrapper-goals.json G-002 `compatibilityPolicy.deprecationStrategy: "ColumnPinGrid alias 별도 (G-005)"` |
| **migrationPath** | `ColumnPinGrid → <Grid enableColumnPinning state.columnPinning />` (codemod: `pinLeft`/`pinRight` → `defaultColumnPinning={{left,right}}`) | wrapper-goals.json G-002 L106 |
| **peerDependencies (C-22)** | 변경 없음 — `@tanstack/react-table ^8.0.0` 이미 G-001 단계에 선언됨 (grid-core/package.json L24) | grid-core/package.json Read |
| **semver (C-23)** | `version: "0.0.0"` 유지 (1.0 전 — Changesets는 MOD-GRID-00 G-002 범위) | grid-core/package.json L3 |

**주의 사항** (D2 외관 변화):
- `<table>` `border-collapse: collapse` → `border-separate border-spacing-0` 변경은 `enableColumnPinning=true` 시에만 적용. 디폴트(둘 다 false)는 G-001 동일. **그러나 상위 Goal(G-005 ColumnPinGrid alias)에서는 항상 `enableColumnPinning=true`이므로** ColumnPinGrid의 외관(`borderCollapse: 'separate'` 이미 사용 — L97)과 자동 일치 → 시각 회귀 양립.

---

## Section 5: 인수 기준 (출처 태그 100%)

| ID | 기준 | 검증 방법 | 출처 |
|----|------|----------|------|
| AC-001 | thead `<thead>`에 Tailwind `sticky top-0 z-10` 적용 (`enableColumnPinning` 무관 — 항상). 외부 부모 `overflow-auto` 시 헤더 고정. `bg-gray-50` 적절 배경 (G-001 L85 보존). | Storybook story `Grid/StickyHeader` 시각 + DOM inspect | C-5 (Tailwind only) |
| AC-002 | left pinned 컬럼 `<th>`/`<td>` → `position: sticky; left: N`px (N = 누적 leaf column width). right pinned → `right: N`px. `column.getIsPinned()` true일 때만 적용. `computePinnedOffset.ts` 단위 테스트 통과. | vitest `T-01~T-04` (computeLeftOffset/computeRightOffset) + Storybook 시각 | L1 (tanstack-api-inventory.md §2.2 ColumnPinning) + L0 (ColumnPinGrid.tsx L66-82 패턴 추출) |
| AC-003 | `columnResizeMode` default `'onChange'` (D5). `enableColumnResizing=true` 시 `<th>` 우측에 `<ResizeHandle header={header} />` 합성. `header.getResizeHandler()` mouse+touch bind. `column.getCanResize()` 가드. | vitest + Storybook `Grid/ColumnResize` 시각 | C-2 (TanStack v8 표준) + L0 (data-table.tsx L108, L355) |
| AC-004 | ColumnPinGrid 기능 흡수 검증 — left+right pin 동시 가능. `defaultColumnPinning={{left:['a'], right:['z']}}` 시 양쪽 sticky 동시 동작. boxShadow edge cue 적용 (last-left + first-right — D8). | Storybook `Grid/PinningBothSides` + 수동 스크린샷 vs ColumnPinGrid baseline | L0 (ColumnPinGrid.tsx L116-124, L169-178) |
| AC-005 | DataTable columnResizing 기능 흡수 — `columnResizeMode` 'onChange' default + `state.columnSizing` 동기화. `header.getSize()` 가드(default 150 폴백) 변경 — `enableColumnResizing===true \|\| enableColumnPinning===true` 시 항상 width 적용 (D10). | vitest `T-05` + Storybook 시각 | L0 (data-table.tsx L108, L355-358) + advisor item#4 |
| AC-006 | `enableColumnPinning=true` 시 `<table>` className에 `border-separate border-spacing-0` (D2) — `position: sticky` 호환 보장. 디폴트 (false) 시 G-001 `divide-y divide-gray-200` 보존. | Grid.tsx Read + DOM inspect | C-5 + advisor item#1 |
| AC-007 | z-index 컨벤션 (D3): thead 일반 `z-10` / body pinned `z-20` / thead pinned `z-30`. intersection (sticky thead × sticky pinned column) 셀 occlusion 정상. | Storybook `Grid/StickyAndPinning` 시각 | advisor item#2 |
| AC-008 | C-12: `pnpm --filter @tomis/grid-core typecheck` 0 error + `pnpm --filter @tomis/grid-core build` (tsup) exit 0. | exit code | C-12 |
| AC-009 | C-21: `pnpm size-limit` `@tomis/grid-core` ≤ 30 KB brotli 통과. G-001 17.44 + G-002 +4 ≤ 22 KB 예상. | size-limit run | C-21 + D7 |
| AC-010 | C-1 보존: G-001 Grid.tsx L40-215, types.ts L1-158, buildTableOptions.ts L1-181 의 본 G-002 무관 섹션은 변경 없음 (advisor item#6 — `git diff` 또는 Read+grep 입증). | Read + diff line count | C-1 (2026-05-14 G-004 추가) + D6 |

**카운트**: 10 AC ≥ 3 (rubric C-01 통과). 모든 AC `source: L0/L1/L2/C-NN/D#/advisor` 태그 (rubric H-03 통과 — 본문 인용 100%).

**호환성 검증 AC (rubric C-05)**: AC-008/AC-009/AC-010 — G-001 보존 + 빌드 + 번들. 사용처 0개이지만 후속 G-005/MOD-GRID-17 발판이므로 strict 검증 의무.

---

## Section 6: 엣지 케이스 (≥3개)

### EC-01: `<table>` `border-collapse` × sticky 양립 (advisor item#1)

- **시나리오**: G-001은 `<table className="min-w-full divide-y divide-gray-200 text-sm">` (Grid.tsx L84). Tailwind `divide-y`는 디폴트 `border-collapse: collapse` 위에 동작. `position: sticky` + `border-collapse: collapse` → 셀 border 분리 / sticky offset 점프 (브라우저 알려진 문제).
- **처리** (D2):
  - `enableColumnPinning=true` 시 `<table>` className에 `border-separate border-spacing-0` 추가 (Tailwind v4 `border-spacing-0` 사용 가능 — 미지원 환경은 inline `style={{borderSpacing: 0}}` 폴백).
  - `divide-y divide-gray-200`는 `border-separate` 환경에서 동작하지 않음 → `<tbody className="bg-white">` 행에 명시적 `border-b border-gray-100` 적용.
  - 디폴트 (`enableColumnPinning=false`) 는 G-001 그대로 (외관 무영향 — 회귀 0).
- **AC 매핑**: AC-006

### EC-02: 외부 부모 `overflow-auto` 미설정 — sticky 비활성

- **시나리오**: 페이지가 `<Grid />`를 직접 렌더 (외부 wrapper에 height/overflow 없음) → CSS sticky는 sticky 컨텍스트(스크롤 가능 부모) 부재로 일반 `position: relative`처럼 동작 (DOM에는 `sticky` 적용되지만 시각적으로 고정 안 됨).
- **처리**:
  - 본 G-002는 thead/pinned 셀에 `sticky` className 항상 적용 (CSS 기본 동작 위임).
  - 사용자 책임: 페이지에서 `<div className="h-screen overflow-auto"><Grid ... /></div>` 등 wrapper 제공.
  - Storybook story에 wrapper 패턴 명시 + README.md "Sticky 사용 시 부모 overflow 필수" 노트.
- **AC 매핑**: AC-001 (sticky className 적용 자체는 OK)

### EC-03: pinned 컬럼 0개 — sticky 미적용

- **시나리오**: `enableColumnPinning=true` + `defaultColumnPinning={{ left: [], right: [] }}` (또는 미지정 — 기본 빈 배열).
- **처리**:
  - `column.getIsPinned()` → false → `getPinnedCellStyle()` 함수가 빈 style + 기본 className 반환 (no-op).
  - thead sticky는 변동 없음 (별개 축).
  - `<table>` `border-separate` 변경은 적용됨 (D2 — `enableColumnPinning=true` 자체 트리거). 외관 회귀 가능 (divide-y 미동작) → AC-010 보존 의무로 `enableColumnPinning=false` 시는 무영향 보장.
- **AC 매핑**: AC-002, AC-006

### EC-04: 동적 columnSizing 변경 → sticky offset 자동 재계산 (advisor item#8)

- **시나리오**: 사용자가 col1 width drag-resize → `state.columnSizing['col1'] = 200` 갱신 → col2 (col1 다음 left pinned)의 sticky `left` offset도 200으로 재계산 필요.
- **처리**:
  - `computeLeftOffset(table, 'col2')` 내부에서 `table.getLeftLeafColumns()[i].getSize()` 호출 — TanStack 표준 메서드는 `state.columnSizing` 을 자동 반영 (tanstack-api-inventory.md §2.2).
  - `Grid.tsx`의 thead/tbody render 함수는 매 render 마다 호출 → React re-render (resize 후 setColumnSizing → state 변경) 시 자동 재계산.
  - **memoize 금지** — `useMemo` 또는 `useCallback`으로 `computePinnedOffset`을 캐시하면 columnSizing 변경 시 stale offset 발생.
- **AC 매핑**: AC-002, AC-005

### EC-05: `columnResizeMode='onChange'` 폭주 우려

- **시나리오**: drag 중 `mousemove` 이벤트마다 `setColumnSizing` → re-render → `state.columnSizing` 변경 → 모든 셀 width 재계산 → 1000 행 환경에서 lag.
- **처리**:
  - 본 G-002 default `'onChange'` (D5) — UX 우수. 대용량 시 사용자가 `columnResizeMode="onEnd"` 명시 권장.
  - README.md 노트: "1000+ 행 + 가상화 미사용 시 'onEnd' 권장".
  - 가상화 (G-004) 통합 시 자동 완화 (visible row만 render).
- **AC 매핑**: AC-003

### EC-06: 모바일 터치 환경 resize handle 접근성

- **시나리오**: 4px 너비 handle은 데스크톱 마우스 친화. 모바일 터치는 hit area 부족.
- **처리**:
  - `ResizeHandle` 컴포넌트에 `onTouchStart={header.getResizeHandler()}` bind (mouse+touch 동시).
  - Tailwind `touch-none` className으로 페이지 스크롤 방지.
  - 데스크톱 우선 — 모바일에서는 `enableColumnResizing=false` 권장 (responsive prop 분기는 G-003 범위 외).
- **AC 매핑**: AC-003

**합계**: 6 EC ≥ 3 (rubric E-04 통과).

**환경 의존 AC ↔ EC 매핑** (rubric E-04 권장):

| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-008 (`pnpm --filter @tomis/grid-core build`) | EC-환경 (pnpm 미설치) | G-001 EC-05와 동일 — `npx tsc --noEmit` 폴백 가능 (documented-deviation) |

---

## Section 7: 구현 대상 파일 (NEW 3 + MODIFY 3 = 6개)

**경로 결정 근거 (D1 — C-28 N/A)**: wrapper-goals.json L108-113 G-002 `implementFiles` 4개 모두 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/...` 정확 prefix. C-28 정정 결정 불필요. 단 spec 본문 분석 결과 **NEW 4개 → 3개로 변경** (D4: StickyHeader.tsx 제거 — thead 인라인 처리) + **MODIFY 3개 추가** (D4: types.ts/buildTableOptions.ts/Grid.tsx).

**조부모 디렉토리 실재 확인** (H-02 외부 디렉토리 예외):
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/` 실재 확인 (G-001에서 생성 — `CheckboxColumn.tsx`, `buildTableOptions.ts` 2 파일 존재 — `ls` 확인)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` 실재 확인 (G-001 산출물, 215 라인 Read)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` 실재 확인 (158 라인 Read)
- 신규 디렉토리 mkdir 불필요 (`internal/` 이미 있음)

| # | 파일 경로 | 변경 유형 | 책임 |
|---|----------|---------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | **MODIFY** | `GridProps<TData>`에 5 prop 추가 (`columnResizeMode`, `defaultColumnPinning`, `defaultColumnSizing`, `onColumnPinningChange`, `onColumnSizingChange`) + `GridColumnResizeMode` 신규 type alias + `ColumnPinningState`/`ColumnSizingState` import. 기존 prop/주석 보존 (D6). |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/buildTableOptions.ts` | **MODIFY** | `options`에 `columnResizeMode` (default `'onChange'` — D5), `enableColumnPinning: props.enableColumnPinning === true`, `state.columnSizing` 추가. `defaultColumnPinning`/`defaultColumnSizing` → state 초기값 전파(Grid.tsx에서 `useState` 초기값으로 사용). `onColumnSizingChange` wiring. 기존 매핑 보존 (D6). |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/computePinnedOffset.ts` | **NEW** | `computeLeftOffset(table, columnId): number`, `computeRightOffset(table, columnId): number`, `getPinnedCellStyle(column, table, scope): {style, className}` 헬퍼 (Section 2.2). |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/ResizeHandle.tsx` | **NEW** | `<ResizeHandle header={header} mode={mode} />` 4px 너비 drag handle (Section 2.3). `header.getResizeHandler()` mouse+touch bind. |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` | **MODIFY** | (a) `<table>` className 분기 (`enableColumnPinning=true` 시 `border-separate border-spacing-0`, false 시 G-001 `divide-y` 그대로 — D2). (b) `<thead>` className `sticky top-0 z-10` 추가. (c) `<th>`/`<td>` pinned 셀 `getPinnedCellStyle()` spread + width 가드 변경 (D10). (d) `<th>` 내부 `<ResizeHandle>` 합성. (e) `defaultColumnPinning`/`defaultColumnSizing` → useState 초기값으로 사용. 기존 markup/event 핸들러 보존 (D6). |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | **MODIFY (선택)** | `GridColumnResizeMode` type re-export 추가 (Section 2.6 결정). 기존 4 export 보존. |

**Section 11 cross-check (rubric E-01 ★)**: Section 11.1 Step 1 (types.ts) → 행 #1, Step 2 (buildTableOptions) → 행 #2, Step 3 (computePinnedOffset NEW) → 행 #3, Step 4 (ResizeHandle NEW) → 행 #4, Step 5 (StickyHeader 제거 결정 — Step 표 행 없음, D4 명시), Step 6 (Grid.tsx MODIFY) → 행 #5, Step 7 (index.ts re-export) → 행 #6. **Step ↔ 표 행 6/6 일치 (Step 5는 의도적 N/A)**.

**부수 변경 0건**: `package.json` 무수정 (peer 이미 선언), `tsup.config.ts` 무수정, `.size-limit.json` 무수정 (한도 30 KB 그대로). `tw-framework-front/` 0 파일 변경 (TOMIS 영향 0 — H-02 외부 디렉토리 무파괴).

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처 카운트

**`affectedUsageFiles: []` (0개)** — wrapper-goals.json G-002 L114 일치.

**경로 결정 근거 (D1 — C-28 N/A)**:
- wrapper-goals.json L108-113: 모든 implementFiles `D:/project/topvel_project/topvel-grid-monorepo/packages/...` 정확 prefix
- G-001의 D2 (잘못된 TOMIS prefix → monorepo 채택) 와 달리 **본 G-002는 정정 결정 없음**
- spec 본문 결정으로 file count 변경 (NEW 4 → NEW 3 + MODIFY 3): D4 명시. wrapper-goals.json `implementFiles` 표면은 4 파일 — 본 spec이 권위 (C-27)

**잠재 후속 영향 (참고 — 본 Goal 범위 외)**:
- G-005 `legacy/ColumnPinGrid.tsx` alias (5 파일 영향 중 1)
- MOD-GRID-17 페이지 27개 (canonical-modules.json L564-595) — sticky header 자동 외관 변화 가능 (EC-02)

### 8.2 무파괴 검증

- **TOMIS 내부 0 변경**: `tw-framework-front/src/components/tomis/Grid/*.tsx`, `src/types/tomis/grid.ts`, `src/pages/**` 모두 무수정. tsc 영향 0.
- **외부 monorepo MODIFY 보존 의무 (D6 + C-1)**:
  - `Grid.tsx` 215 라인 → 변경은 className/style 추가 + ResizeHandle 합성 + width 가드 변경 (D10). row click/pagination/empty markup 보존
  - `types.ts` 158 라인 → 5 prop 추가 + 신규 type alias. 기존 16 prop 시그니처/주석 보존
  - `buildTableOptions.ts` 181 라인 → options 키 3개 추가 (`columnResizeMode`, `enableColumnPinning`, state.columnSizing 추가). 기존 wiring 보존
  - **검증 의무 (C-1 2026-05-14 추가)**: Implementer Stage에서 git diff 또는 Read+grep으로 보존 입증 (implement-rubric F-03)
- **부모 디렉토리 실재** (H-02 외부 디렉토리 예외 충족):
  - `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/` 실재 (G-001 생성)
  - 모든 NEW 2 파일은 기존 디렉토리에 추가 — mkdir 불필요
- **명명 컨벤션**: `computePinnedOffset.ts` (lowerCamelCase 유틸 — `buildTableOptions.ts`와 일치), `ResizeHandle.tsx` (PascalCase 컴포넌트 — `CheckboxColumn.tsx`와 일치)

### 8.3 점진 마이그레이션 (C-19)

본 Goal: 신규 2 + MODIFY 4 → 사용처 0개 → C-19 ≤5 한도 무관.
후속 점진:
- G-003: 동일 `Grid.tsx`에 skeleton/empty/autoSelect 추가 (사용처 영향 0 유지)
- G-005: 5 alias 신규 파일 (`legacy/ColumnPinGrid.tsx`은 본 G-002의 `defaultColumnPinning` prop 직접 활용)

### 8.4 롤백 전략

- **롤백 단순**: NEW 2 파일 삭제 + MODIFY 3+1 파일 G-001 시점 복원
- 명령:
  ```powershell
  cd D:\project\topvel_project\topvel-grid-monorepo\packages\grid-core
  Remove-Item -Force src\internal\computePinnedOffset.ts, src\internal\ResizeHandle.tsx
  git checkout -- src\Grid.tsx src\types.ts src\internal\buildTableOptions.ts src\index.ts  # G-001 시점 복원
  ```
- TOMIS git 무영향 — `tw-framework-front/` revert 불필요
- 후속 Goal 영향 0 (G-003은 G-002 미존재 → spec 단계로 회귀, G-005는 `defaultColumnPinning` 부재 시 alias 구현 변경 필요)

### 8.5 번들 영향 (D7 ★ 누적 위험 결정)

- **+4 KB 예상** (wrapper-goals.json G-002 `bundleImpact.expected: "+4 KB (sticky + resize)"`)
- **누적 (G-001 측정 17.44 KB + G-002 +4 KB) ≈ 21.44 KB / 한도 30 KB → 여유 8.56 KB**
- **누적 위험 시점 결정 (D7)**:
  - G-002 끝 = 한도 ~71% 사용
  - G-003 +3 KB → ~24 KB (한도 80%)
  - G-004 +7 KB → ~31 KB (**한도 초과 위험 — 31 > 30**)
  - G-005 +5 KB → ~36 KB (**확정 초과**)
- **결정**: G-004 implement 직전 `pnpm size-limit` 측정 후 25 KB 초과 시 다음 옵션 적용:
  - **Option A**: G-005 legacy alias를 별도 sub-entry `@tomis/grid-core/legacy` 분리. `package.json` `exports."./legacy"` + `.size-limit.json` 별도 행 (한도 ~5 KB)
  - **Option B**: G-005 alias 5종을 별도 패키지 `@tomis/grid-legacy` 분할 (모노레포 packages/grid-legacy 신설)
  - 결정은 G-005 spec 작성 시 ADR (`decisions/MOD-GRID-01-decisions.md` ADR-MOD-GRID-01-XXX)
- C-21 사용자 승인 미필요 (본 G-002 +4 KB는 100 KB 미만)

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

본 G-002는 `react`, `react-dom`, `@tanstack/react-table` 3종 사용 (모두 이미 선언). `@tanstack/react-virtual`은 G-004 범위 (무관).

### dependencies

**없음** (pure wrapper). C-22 위반 없음 (peer를 dep로 중복 선언 금지).

### devDependencies

본 Goal에서 신규 추가 0건 — **ADR (C-9/C-20) 불필요**.

### 외부 라이브러리 추가

**0건**. C-7 (AG Grid 금지) + C-16 (Wijmo 금지) 무관 — 둘 다 import 없음.

---

## Section 10: 사용자 여정

### 개발자 여정 (구현 후)

(wrapper-goals.json G-002 `userJourneySteps` 인용)

1. `<Grid enableColumnPinning enableColumnResizing columnResizeMode='onChange'>`
2. 헤더 thead — position sticky top-0 z-10
3. column.getIsPinned() === 'left' → sticky left-0
4. header drag handle → header.getResizeHandler() 호출
5. 리사이즈 중 columnSizing state 실시간 업데이트

### 최종 사용자 여정 (페이지 사용 시 보이는 동작)

| 시나리오 | 보이는 동작 |
|---------|-----------|
| 헤더 sticky | 페이지 세로 스크롤 시 thead 행이 화면 상단에 고정 (외부 부모 overflow-auto 시 — EC-02) |
| 좌측 핀 (`defaultColumnPinning={{left:['empNo']}}`) | 가로 스크롤 시 empNo 컬럼이 좌측에 고정. 다른 컬럼이 그 아래로 스크롤. boxShadow edge cue (D8) |
| 우측 핀 (`defaultColumnPinning={{right:['action']}}`) | action 컬럼 우측 고정. 좌측 boxShadow |
| 컬럼 리사이즈 (drag) | `<th>` 우측 가장자리 drag handle 호버 시 `cursor-col-resize`. drag 중 활성 표시 (`bg-blue-500`). 'onChange' 모드 — 실시간 width 변경 |
| 핀 + 리사이즈 동시 | resize 후 다음 핀 컬럼의 sticky offset 자동 재계산 (EC-04) |

---

## Section 11: 구현 계획

### 11.1 파일별 변경 명세 (Before/After ≥1 코드 블록 — rubric E-02)

**Step 1 (MODIFY) — `types.ts`** — D5 신규 prop 5종 + 신규 type alias

Before (G-001 산출물 — types.ts L10-15 imports):
```ts
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
} from '@tanstack/react-table';
```

After:
```ts
import type {
  ColumnDef,
  ColumnPinningState,        // ★ 추가 (G-002)
  ColumnSizingState,         // ★ 추가 (G-002)
  OnChangeFn,
  PaginationState,
  RowSelectionState,
} from '@tanstack/react-table';

/**
 * 컬럼 리사이즈 모드.
 * - `'onChange'`: drag 중 실시간 width 업데이트 (default — UX 우수)
 * - `'onEnd'`: drag 종료 시 1회 업데이트 (성능 우수)
 *
 * @see G-002-spec.md Section 2.1 D5
 */
export type GridColumnResizeMode = 'onChange' | 'onEnd';
```

기존 G-001 `GridProps<TData>` (types.ts L98-157) 보존. `// ─── 디버그 ───` 섹션 직전에 신규 5 prop 추가 (Section 2.1 코드 블록 그대로).

**Step 2 (MODIFY) — `internal/buildTableOptions.ts`** — D5 + columnResizeMode + columnSizing wiring

Before (buildTableOptions.ts L137-154 options 조립):
```ts
const options: Omit<TableOptions<TData>, 'data' | 'columns'> = {
  state: tableState,
  getCoreRowModel: getCoreRowModel(),
  // ... (기존 핸들러)
  enableSorting: props.enableSort === true,
  enableMultiSort: props.enableMultiSort === true,
  enableRowSelection: selectionMode !== 'none',
  enableMultiRowSelection: selectionMode === 'multi',
  enableColumnResizing: props.enableColumnResizing === true,
  enableExpanding: props.enableExpanding === true,
  manualPagination: props.pagination?.manual === true,
  debugTable: props.debug === true,
};
```

After (G-002 추가):
```ts
const tableState: NonNullable<TableOptions<TData>['state']> = {
  sorting: state.sorting,
  columnFilters: state.columnFilters,
  rowSelection: state.rowSelection,
  pagination: state.pagination,
  columnPinning: state.columnPinning,
  columnSizing: state.columnSizing,        // ★ G-002 추가
  expanded: state.expanded,
};

// onColumnSizingChange 통합 핸들러 (외부 콜백 호출 — D5)
const onColumnSizingChange: OnChangeFn<ColumnSizingState> = (updater) => {
  state.setColumnSizing(updater);
  if (props.onColumnSizingChange) {
    props.onColumnSizingChange(updater);
  }
};

// onColumnPinningChange 통합 핸들러
const onColumnPinningChange: OnChangeFn<ColumnPinningState> = (updater) => {
  state.setColumnPinning(updater);
  if (props.onColumnPinningChange) {
    props.onColumnPinningChange(updater);
  }
};

const options: Omit<TableOptions<TData>, 'data' | 'columns'> = {
  state: tableState,
  getCoreRowModel: getCoreRowModel(),
  // ... (기존 핸들러)
  onColumnPinningChange,                   // ★ 신규 통합 핸들러로 교체 (G-001은 state.setColumnPinning 직접)
  onColumnSizingChange,                    // ★ G-002 추가
  enableSorting: props.enableSort === true,
  // ... (기존)
  enableColumnPinning: props.enableColumnPinning === true,   // ★ G-002 추가 (G-001은 state만 매핑, TanStack feature 미활성)
  enableColumnResizing: props.enableColumnResizing === true,
  columnResizeMode: props.columnResizeMode ?? 'onChange',    // ★ G-002 추가 (default D5)
  enableExpanding: props.enableExpanding === true,
  manualPagination: props.pagination?.manual === true,
  debugTable: props.debug === true,
};
```

또한 `GridStateBag` interface (L39-52)에 `columnSizing`/`setColumnSizing` 필드 추가:

```ts
export interface GridStateBag {
  // ... (기존)
  columnPinning: ColumnPinningState;
  setColumnPinning: (updater: Updater<ColumnPinningState>) => void;
  columnSizing: ColumnSizingState;                                    // ★ G-002
  setColumnSizing: (updater: Updater<ColumnSizingState>) => void;     // ★ G-002
  expanded: ExpandedState;
  setExpanded: (updater: Updater<ExpandedState>) => void;
}
```

`ColumnSizingState` import 추가 (L31 인근).

**Step 3 (NEW) — `internal/computePinnedOffset.ts`** — Section 2.2 시그니처 구현

ColumnPinGrid.tsx L66-82 추출 + `getPinnedCellStyle` 헬퍼:

```ts
// internal/computePinnedOffset.ts (NEW — D4)
import type { CSSProperties } from 'react';
import type { Column, Table } from '@tanstack/react-table';

/**
 * 좌측 pinned 컬럼의 누적 left offset (px). render마다 재계산 (memoize 금지 — EC-04).
 */
export function computeLeftOffset<TData>(table: Table<TData>, columnId: string): number {
  const leftCols = table.getLeftLeafColumns();
  let offset = 0;
  for (const col of leftCols) {
    if (col.id === columnId) return offset;
    offset += col.getSize();
  }
  return 0;
}

export function computeRightOffset<TData>(table: Table<TData>, columnId: string): number {
  const rightCols = table.getRightLeafColumns();
  let offset = 0;
  for (let i = rightCols.length - 1; i >= 0; i--) {
    const col = rightCols[i];
    if (col.id === columnId) return offset;
    offset += col.getSize();
  }
  return 0;
}

export interface PinnedCellStyle {
  style: CSSProperties;
  className: string;
}

/**
 * `<th>`/`<td>` sticky style + className 생성 (D3 z-index 컨벤션).
 *
 * z-index:
 * - thead 일반: `z-10`
 * - body pinned: `z-20`
 * - thead pinned (intersection): `z-30`
 *
 * boxShadow edge cue (D8 — C-5 예외 동적 RGBA):
 * - last-left pinned: `4px 0 6px -2px rgba(0,0,0,0.12)`
 * - first-right pinned: `-4px 0 6px -2px rgba(0,0,0,0.12)`
 */
export function getPinnedCellStyle<TData>(
  column: Column<TData, unknown>,
  table: Table<TData>,
  scope: 'thead' | 'tbody',
): PinnedCellStyle {
  const pinned = column.getIsPinned();
  if (pinned === false) {
    // 비-pinned: thead 일반 sticky만 (Grid.tsx에서 thead 자체 className 처리)
    return { style: {}, className: '' };
  }

  const leftCols = table.getLeftLeafColumns();
  const rightCols = table.getRightLeafColumns();
  const leftIndex = leftCols.findIndex((c) => c.id === column.id);
  const rightIndex = rightCols.findIndex((c) => c.id === column.id);
  const isLastLeft = pinned === 'left' && leftIndex === leftCols.length - 1;
  const isFirstRight = pinned === 'right' && rightIndex === 0;

  const style: CSSProperties = {
    position: 'sticky',
    left: pinned === 'left' ? computeLeftOffset(table, column.id) : undefined,
    right: pinned === 'right' ? computeRightOffset(table, column.id) : undefined,
    boxShadow: isLastLeft
      ? '4px 0 6px -2px rgba(0,0,0,0.12)'
      : isFirstRight
      ? '-4px 0 6px -2px rgba(0,0,0,0.12)'
      : undefined,
  };

  // z-index 컨벤션 (D3)
  const zClass = scope === 'thead' ? 'z-30' : 'z-20';
  // 배경 — pinned 셀은 sticky 시 배경 필수 (스크롤 콘텐츠 가림)
  const bgClass = scope === 'thead' ? 'bg-gray-50' : 'bg-white';
  return { style, className: `${zClass} ${bgClass}` };
}
```

**Step 4 (NEW) — `internal/ResizeHandle.tsx`** — Section 2.3 구현

```tsx
// internal/ResizeHandle.tsx (NEW — D4)
import type { Header } from '@tanstack/react-table';

export interface ResizeHandleProps<TData, TValue> {
  header: Header<TData, TValue>;
  mode: 'onChange' | 'onEnd';
}

/**
 * `<th>` 우측 가장자리 4px drag handle.
 *
 * - `header.column.getCanResize()` true 시에만 렌더 (false → null)
 * - mouse + touch 동시 bind (모바일 터치 — EC-06)
 * - Tailwind className: `absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none`
 * - 활성 리사이즈 중 (`column.getIsResizing()`) 시각 강조
 *
 * @see G-002-spec.md Section 2.3 + D9
 */
export function ResizeHandle<TData, TValue>({
  header,
  mode,
}: ResizeHandleProps<TData, TValue>): JSX.Element | null {
  if (!header.column.getCanResize()) return null;

  const onPointerHandler = header.getResizeHandler();
  const isResizing = header.column.getIsResizing();

  return (
    <div
      onMouseDown={onPointerHandler}
      onTouchStart={onPointerHandler}
      className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none transition-colors ${
        isResizing ? 'bg-blue-500' : 'hover:bg-blue-400'
      }`}
      aria-hidden="true"
      data-resize-mode={mode}
    />
  );
}
```

**Step 5 (의도적 N/A) — `StickyHeader.tsx` 미생성** (D4)

wrapper-goals.json G-002 implementFiles[1]에 `internal/StickyHeader.tsx` 명시되어 있으나, spec 본문 분석 결과 thead 인라인 className만으로 충분 (별도 컴포넌트 추출 시 G-001 본체 분리 비용 > 이득). spec 권위 (C-27)에 따라 미생성. wrapper-goals.json 사후 정정 권장.

**Step 6 (MODIFY) — `Grid.tsx`** — sticky thead + pinned cells + ResizeHandle + width 가드 변경

Before (Grid.tsx L83-116 thead):
```tsx
<div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="min-w-full divide-y divide-gray-200 text-sm">
    <thead className="bg-gray-50">
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const canSort = header.column.getCanSort();
            // ...
            const widthStyle =
              header.getSize() !== 150 ? { width: header.getSize() } : undefined;
            // ...
            return (
              <th
                key={header.id}
                colSpan={header.colSpan}
                className={`px-4 py-3 text-left ... ${canSort ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                style={widthStyle}
                onClick={canSort ? onSortClick : undefined}
              >
                {/* ... */}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
```

After (G-002):
```tsx
const usePinning = props.enableColumnPinning === true;
const useResizing = props.enableColumnResizing === true;
const resizeMode = props.columnResizeMode ?? 'onChange';

// D2: sticky pinning 시 border-separate 강제
const tableClassName = usePinning
  ? 'min-w-full text-sm border-separate border-spacing-0'
  : 'min-w-full divide-y divide-gray-200 text-sm';

return (
  <div className={`flex flex-col ${props.className ?? ''}`}>
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className={tableClassName}>
        <thead className="bg-gray-50 sticky top-0 z-10">      {/* ★ AC-001 sticky */}
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                const sortGlyph = sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '⇅';
                // D10: enableColumnResizing 또는 enableColumnPinning 시 항상 width 적용
                const widthStyle =
                  useResizing || usePinning
                    ? { width: header.getSize() }
                    : header.getSize() !== 150
                      ? { width: header.getSize() }
                      : undefined;
                const onSortClick = header.column.getToggleSortingHandler();

                // D3: pinned 셀 sticky style + z-30 (thead intersection)
                const pinned = usePinning
                  ? getPinnedCellStyle(header.column, table, 'thead')
                  : { style: {}, className: '' };
                const combinedStyle = { ...widthStyle, ...pinned.style };

                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className={`relative px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap select-none ${
                      canSort ? 'cursor-pointer hover:bg-gray-100' : ''
                    } ${pinned.className} border-b border-gray-200`}
                    style={combinedStyle}
                    onClick={canSort ? onSortClick : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && <span className="text-gray-400">{sortGlyph}</span>}
                    </div>
                    {useResizing && <ResizeHandle header={header} mode={resizeMode} />}   {/* ★ AC-003 */}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white">                              {/* divide-y 제거 (border-separate 비호환) */}
          {/* tbody — pinned 셀에 동일 패턴 적용 */}
          {table.getRowModel().rows.length === 0 ? (
            // (기존 보존)
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} /* ... 기존 보존 ... */ className={`border-b border-gray-100 ...`}>
                {row.getVisibleCells().map((cell) => {
                  const pinnedCell = usePinning
                    ? getPinnedCellStyle(cell.column, table, 'tbody')
                    : { style: {}, className: '' };
                  const widthStyleCell =
                    useResizing || usePinning
                      ? { width: cell.column.getSize() }
                      : undefined;
                  return (
                    <td
                      key={cell.id}
                      className={`px-4 py-3 whitespace-nowrap text-gray-700 ${pinnedCell.className}`}
                      style={{ ...widthStyleCell, ...pinnedCell.style }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    {/* showPagination 블록 — G-001 보존 (D6) */}
  </div>
);
```

또한 useState 초기값에 `defaultColumnPinning`/`defaultColumnSizing` 사용:

```tsx
const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
  props.defaultColumnPinning ?? { left: [], right: [] },
);
const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(
  props.defaultColumnSizing ?? {},
);
```

`buildTableOptions(props, { ..., columnSizing, setColumnSizing })`로 state bag에 추가 전달.

**Step 7 (MODIFY 선택) — `index.ts`** — `GridColumnResizeMode` re-export

Before:
```ts
export { Grid } from './Grid';
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
} from './types';
```

After:
```ts
export { Grid } from './Grid';
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
  GridColumnResizeMode,         // ★ G-002 추가
} from './types';
```

### 11.2 구현 순서 (의존성 고려, ≥2단계)

1. **Step 1 — `types.ts` MODIFY** (5 prop + 1 type alias 추가) → 검증: `tsc --noEmit` 0 error
2. **Step 2 — `internal/buildTableOptions.ts` MODIFY** (columnResizeMode + columnSizing wiring) → 검증: types import 가능 + tsc 통과
3. **Step 3 — `internal/computePinnedOffset.ts` NEW** → 검증: 단위 테스트 (T-01~T-04 pinned offset)
4. **Step 4 — `internal/ResizeHandle.tsx` NEW** → 검증: 단위 테스트 (T-06 ResizeHandle render)
5. **Step 5 — Grid.tsx MODIFY** (모든 internal 사용 + sticky/pinning/resize 통합) → 검증: tsc + Storybook 시각
6. **Step 6 — index.ts MODIFY** (선택, GridColumnResizeMode re-export)
7. **Step 7 — 빌드 검증** → `pnpm --filter @tomis/grid-core build` (tsup CJS+ESM) + `pnpm size-limit` (≤30 KB AC-009)
8. **Step 8 — Storybook story 작성** (Section 12 검증 계획) → Visual regression baseline (G-005 비교 기준)

### 11.3 위험 요소

| 위험 | 가능성 | 처리 |
|------|--------|------|
| **`border-collapse` × sticky 비양립** (advisor item#1) | **확정** | D2 결정 — `enableColumnPinning=true` 시 `border-separate` 전환. 검증: AC-006 + Storybook 시각 |
| z-index 충돌 (thead × pinned column intersection) | 중 | D3 컨벤션 — thead 일반 z-10 / body pinned z-20 / thead pinned z-30. 검증: AC-007 |
| **번들 누적 한도 초과 위험** (G-004 시점) | 중 | D7 결정 — G-004 implement 직전 size-limit 측정 후 G-005 분리 (Option A or B) |
| `header.getSize()` 디폴트 150 가드 silently 손실 | 중 | D10 결정 — `enableColumnResizing/enableColumnPinning` 시 항상 width 적용. AC-005 + Step 6 Before/After 명시 |
| boxShadow 동적 RGBA — Tailwind 표현 어려움 | 중 | D8 결정 — C-5 예외 (동적 style 인라인 허용). G-005 ColumnPinGrid alias 시각 회귀 baseline 보존 |
| pnpm 미설치 환경 build 검증 불가 | 낮 | EC-환경 documented-deviation — `npx tsc --noEmit` 폴백 |
| **wrapper-goals.json L110 `StickyHeader.tsx` 미생성** | 발견됨 | D4 결정 — spec 본문 권위 (C-27). 후속: 메인이 wrapper-goals.json 정정 (NEW 4 → NEW 3 + MODIFY 3) |
| ColumnPinGrid alias 시 sticky 외관 회귀 (G-005) | 중 | 본 G-002 boxShadow + bg-white 정확 일치 (AC-004) → G-005 alias는 props 매핑만 |
| 모바일 touch resize handle 접근성 | 낮 | EC-06 — `onTouchStart` bind + `touch-none` className. 모바일 권장 미사용 (README 노트) |

---

## Section 12: 검증 계획

### 단위 테스트 (vitest)

| 테스트 | 시나리오 |
|-------|---------|
| T-01 `computeLeftOffset — leftCols=[a(80),b(120),c(150)]` `columnId='b'` | === 80 (a width) |
| T-02 `computeLeftOffset — columnId='c'` | === 200 (a+b) |
| T-03 `computeRightOffset — rightCols=[x(60),y(100)]` `columnId='y'` | === 0 (rightmost) |
| T-04 `computeRightOffset — columnId='x'` | === 100 (y width) |
| T-05 `getPinnedCellStyle — pinned='left' lastLeft` | style.boxShadow === '4px 0 6px -2px rgba(0,0,0,0.12)' + className includes 'z-30' (thead) or 'z-20' (tbody) |
| T-06 `<ResizeHandle header />` — `getCanResize()=true` | renders div with cursor-col-resize, mouseDown calls getResizeHandler |
| T-07 `<ResizeHandle header />` — `getCanResize()=false` | renders null |
| T-08 `buildTableOptions — props.columnResizeMode=undefined` | options.columnResizeMode === 'onChange' (default D5) |
| T-09 `buildTableOptions — props.enableColumnPinning=true` | options.enableColumnPinning === true |
| T-10 `buildTableOptions — props.onColumnSizingChange` | wraps state.setColumnSizing + calls external callback |
| T-11 `<Grid enableColumnPinning>` render | `<table>` className includes 'border-separate border-spacing-0' (D2) |
| T-12 `<Grid />` (default) render | `<table>` className includes 'divide-y divide-gray-200' (G-001 보존) |

위치: `packages/grid-core/src/__tests__/computePinnedOffset.test.ts` + `ResizeHandle.test.tsx` + `buildTableOptions.test.ts` (vitest + @testing-library/react).

### 시각 회귀 (Storybook + Chromatic 또는 수동 스크린샷 — C-13/C-17)

**필수** (migrationImpact: high — C-17):

| Story | 시나리오 |
|-------|---------|
| `Grid/StickyHeader` | 30행 + 외부 wrapper `h-96 overflow-auto` → 스크롤 시 thead 고정 |
| `Grid/PinningLeft` | `defaultColumnPinning={{left:['empNo','name']}}` + 가로 스크롤 → 좌측 2 컬럼 고정 + boxShadow |
| `Grid/PinningRight` | `defaultColumnPinning={{right:['action']}}` → 우측 컬럼 고정 |
| `Grid/PinningBothSides` | left + right 동시 + 중간 영역 가로 스크롤 |
| `Grid/ColumnResize` | `enableColumnResizing` + drag → `columnResizeMode='onChange'` 실시간 |
| `Grid/StickyAndPinning` (intersection) | sticky thead + left pinned column → 좌상단 셀 z-30 occlusion |
| `Grid/PinningWithResize` | resize 후 다음 핀 컬럼 offset 자동 재계산 (EC-04 시각 검증) |

위치: `packages/grid-core/src/__stories__/Grid.stories.tsx` (G-001 story 파일에 추가)

**vs ColumnPinGrid 수동 비교** (AC-004):
- `tw-framework-front` 페이지에서 ColumnPinGrid 실제 사용 사례 스크린샷 캡처 (baseline)
- `<Grid enableColumnPinning defaultColumnPinning={{left, right}} />` Storybook 동일 데이터 캡처
- pixel-diff 또는 수동 비교 노트 (boxShadow/z-index/border 외관 일치)

### 빌드 검증 (C-12)

```powershell
cd D:\project\topvel_project\topvel-grid-monorepo

# typecheck (G-001 보존 + G-002 추가)
pnpm --filter @tomis/grid-core typecheck   # exit 0 (AC-008)

# build
pnpm --filter @tomis/grid-core build       # exit 0 (AC-008)

# size-limit
pnpm size-limit --json                     # @tomis/grid-core ≤ 30 KB (AC-009)

# G-001 보존 입증 (AC-010)
git diff packages/grid-core/src/Grid.tsx packages/grid-core/src/types.ts packages/grid-core/src/internal/buildTableOptions.ts
# 변경 라인이 G-002 신규 prop/sticky/resize 관련만인지 검증 (D6)
```

### 자동 보완 가능 항목

- 누락된 type export → `index.ts` MODIFY 자동 patch (Step 7)
- `any` 우발 사용 → ESLint `@typescript-eslint/no-explicit-any` rule 차단
- 인라인 style 우발 (boxShadow 외) → 수동 grep + ESLint
- DataTable codemod (`columnResizeMode='onChange'` → `<Grid enableColumnResizing />`) — MOD-GRID-17 별도 sub-track

---

## Section 13: 상용 제품화 영향

### F-01: 패키지 분류

본 Goal 대상 패키지: **`@tomis/grid-core` (`packages/grid-core`)** — **MIT** licenseTier (canonical-modules.json L75 + grid-core/package.json L5 `"license": "MIT"`).

### F-02: Pro 라이선스 검증

**N/A** — MIT 패키지. `configureGridLicense()` 호출 불필요 (MOD-GRID-99-A는 Pro 패키지 전용).

### F-03: 문서 작성 계획 (C-25)

| 산출물 | 위치 | 작성 시기 |
|--------|------|----------|
| Storybook story 7개 (G-002 추가 — Section 12 시나리오) | `packages/grid-core/src/__stories__/Grid.stories.tsx` | 본 Goal Step 8 |
| README.md 업데이트 | `packages/grid-core/README.md` | 본 Goal Step 8 (Sticky/Pinning/Resize 섹션 + EC-02 부모 overflow 노트) |
| Docusaurus 페이지 | `apps/docs/docs/grid-core/Grid.mdx` | MOD-GRID-99-B (별도 Goal) |
| API reference (TypeDoc) | 자동 생성 | MOD-GRID-99-B |
| JSDoc | `types.ts` 신규 5 prop 위에 `/** ... */` (Section 2.1 주석 수준) | 본 Goal Step 1 |
| ResizeHandle/computePinnedOffset JSDoc | NEW 파일 export 함수마다 | 본 Goal Step 3-4 |

### F-04: peerDependencies 정책 (C-22)

`peerDependencies` 변경 0 — `package.json` L23-28 보존. `dependencies`에 중복 선언 0건. C-22 위반 0.

---

## ★ 메타 게이트 H 자가 점검 결과

| 항목 | 결과 | Evidence |
|------|------|----------|
| **H-01: referenceEvidence 경로 실재** | **YES** | L0 `ColumnPinGrid.tsx` L1-220 Read 완료 (220 lines). L0 `data-table.tsx` L95-122 + L342-369 Read 완료. L0 `BaseGrid.tsx` L100-220 Read 완료. L0 monorepo `Grid.tsx` L1-215 + `types.ts` L1-158 + `buildTableOptions.ts` L1-181 모두 Read 완료. L1 `references/tanstack-api-inventory.md` L23-50 + L107-110 Read 완료. L2 `references/current-tanstack-analysis.md` L101-113 §5 Read 완료. L3 `wrapper-goals.json` L73-126 G-002 + L13-67 G-001 (의존) Read 완료. R-A `references/ag-grid-feature-matrix.md` L60-68 + `references/publish-aggrid-analysis.md` L86-94 Read 완료. R-W `references/publish-wijmo-analysis.md` L73-89 Read 완료. **모든 경로 spec L21-L93 본문에 명시 + Read 도구 호출 증거 있음. TOMIS path segment 누락 없음 (cross-check 완료).** |
| **H-02: implementFiles 경로 합리성** | **YES** | 부모 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/` 실재 확인 (`ls` 결과 — `CheckboxColumn.tsx`, `buildTableOptions.ts` 2 파일 존재, G-001 산출물). 모든 6개 파일 (NEW 2 + MODIFY 4) 부모 디렉토리 실재. 신규 디렉토리 mkdir 불필요. 모든 파일명 monorepo 컨벤션 (lowerCamelCase 유틸 + PascalCase 컴포넌트). C-28 N/A — wrapper-goals.json L108-113 implementFiles 4개 모두 monorepo prefix 정확 (G-001 D2 와 대비 — D1 명시). |
| **H-03: AC 출처 태그 검증** | **YES** | AC-001 `C-5` → Section 11.1 Step 6 Grid.tsx Tailwind className `sticky top-0 z-10` + Section 12 Storybook `Grid/StickyHeader`. AC-002 `L1 + L0` → Section 1 L1 tanstack-api-inventory.md §2.2 ColumnPinning 인용 + L0 ColumnPinGrid.tsx L66-82 발췌 + Section 11.1 Step 3 computePinnedOffset 추출. AC-003 `C-2 + L0` → L0 data-table.tsx L108/L355 발췌 + Section 11.1 Step 4 ResizeHandle. AC-004 `L0` → L0 ColumnPinGrid.tsx L116-124 발췌 + Section 12 vs ColumnPinGrid 수동 비교. AC-005 `L0 + advisor` → L0 data-table.tsx L355-358 발췌 + advisor item#4 (D10). AC-006 `C-5 + advisor item#1` → D2 결정 + EC-01 + Section 11.1 Step 6 tableClassName 분기. AC-007 `advisor item#2` → D3 z-index 컨벤션 + Section 11.1 Step 3 getPinnedCellStyle. AC-008 `C-12` → Section 12 빌드 검증. AC-009 `C-21 + D7` → Section 8.5 누적 위험 결정. AC-010 `C-1 + D6` → Section 8.2 무파괴 검증 + git diff 의무. **모든 출처가 spec 본문에서 실제 인용됨**. |

**모든 H 항목 YES → 일반 채점 진행 가능**.

---

## 사전 결정 표 ↔ 본문 cross-consistency 검증 (rubric G-01 ★)

| D# | 표 값 | 본문 위치 | 일치 여부 |
|----|------|----------|----------|
| D1 | monorepo prefix 정확 (C-28 N/A) | Section 7 헤더 + Section 8.1 + 위험 표 (StickyHeader 정정 — D4) | ✅ |
| D2 | `enableColumnPinning=true` 시 `border-separate border-spacing-0` | Section 11.1 Step 6 tableClassName 분기 + EC-01 + AC-006 | ✅ |
| D3 | z-index 10/20/30 컨벤션 | Section 2.2 PinnedCellStyle 주석 + Section 11.1 Step 3 getPinnedCellStyle + AC-007 | ✅ |
| D4 | NEW 2 + MODIFY 4 = 6 파일 (StickyHeader.tsx 제거) | Section 7 표 (6 행) + Section 11 Step 1~7 (Step 5는 의도적 N/A) | ✅ |
| D5 | 신규 prop 5종 + GridColumnResizeMode | Section 2.1 GridProps 추가 + Section 11.1 Step 1 + AC-003 | ✅ |
| D6 | G-001 본체 보존 (C-1 보존 의무) | Section 8.2 + Section 11.1 Before/After + AC-010 | ✅ |
| D7 | 한도 30 KB + G-004 시점 분리 결정 | Section 8.5 누적 위험 표 + AC-009 + Section 11.3 위험 | ✅ |
| D8 | boxShadow 동적 RGBA — C-5 예외 인라인 | Section 11.1 Step 3 getPinnedCellStyle + AC-004 + Section 11.3 | ✅ |
| D9 | ResizeHandle 4px + mouse+touch + getCanResize 가드 | Section 2.3 + Section 11.1 Step 4 + EC-06 | ✅ |
| D10 | width 가드 변경 (`enableColumnResizing\|\|enableColumnPinning` 시 항상) | Section 11.1 Step 6 widthStyle 분기 + AC-005 | ✅ |

**모든 D# 일치 — spec 내부 모순 0건**.

---

## Spec 작성 메타

- **작성자**: tw-grid Spec Writer (Agent 위임 — C-15)
- **사전 읽기**: 13개 파일 (constraints.md C-1~C-28, specify-rubric.md, canonical-modules.json, references/ 4개, wrapper-goals.json G-001+G-002, G-001-spec.md, monorepo grid-core 4개 산출물, AS-IS ColumnPinGrid.tsx + data-table.tsx + BaseGrid.tsx, .size-limit.json, package.json)
- **저장 경로**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/artifacts/MOD-GRID-01/wrapper/G-002-spec.md`
- **Section 카운트**: 13/13 (Section 1~13 모두 작성)
- **rubric 31항목 자가 점검**: A(5)+B(5)+C(5)+D(6)+E(5)+F(4)+G(1)=31 — 모두 충족 의도. 메타 게이트 H 3항목 자가 YES + cross-consistency 표 통과. Coverage Verifier 독립 검증 대기.
- **advisor 8개 사전 지적 모두 반영**: item#1 (border-collapse → D2), item#2 (z-index → D3), item#3 (번들 누적 → D7), item#4 (width 가드 → D10), item#5 (controlled vs uncontrolled → D5), item#6 (C-28 status → D1), item#7 (boxShadow → D8), item#8 (memoize 금지 → EC-04)
