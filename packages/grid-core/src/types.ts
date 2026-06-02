/**
 * @topgrid/grid-core — Public type definitions for the unified `<Grid>` wrapper.
 *
 * G-001 (MOD-GRID-01): TanStack Table v8 위에 단일 API + `enable*` 토글 통합.
 * 8개 기존 grid variant(BaseGrid/VirtualGrid/TreeGrid/...)를 흡수하기 위한 props 표면.
 *
 * @see G-001-spec.md Section 2.1
 */

import type {
  Cell,
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  OnChangeFn,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import type { PaginationMode } from './pagination/types';
import type { ScrollToOptions as VirtualScrollToOptions } from '@tanstack/react-virtual';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

// ─── G-006 (MOD-GRID-01): cell/row className callback canonical types ───
// 권위 ownership: grid-core (ADR-MOD-GRID-REFACTOR-2026-05-17-009 역의존 제거 cross-ref).
// `@topgrid/grid-renderers/src/EditableCell.tsx` 는 본 타입을 type-only re-export.

/**
 * Grid-level cell className callback (G-006).
 *
 * Receives a TanStack `Cell<TData, unknown>` and returns a Tailwind className
 * string (or undefined for no addition) to be appended to the rendered `<td>`.
 *
 * Canonical home: `@topgrid/grid-core` (since G-006 / 2026-05-18 — ADR-MOD-GRID-01-007).
 * `@topgrid/grid-renderers` re-exports as type-only (ADR-MOD-GRID-REFACTOR-2026-05-17-009
 * 역의존 제거 정책 부합).
 *
 * @see G-006 spec — canonical-gap-supplementation-spec.md §4.1
 * @see ADR-MOD-GRID-01-007
 * @see ADR-MOD-GRID-05-002 D3 (deferred Grid-level wiring 이행)
 */
export type CellClassNameCallback<TData> = (
  cell: Cell<TData, unknown>,
) => string | undefined;

/**
 * Grid-level row className callback (G-006).
 *
 * Receives a TanStack `Row<TData>` and returns a Tailwind className string
 * (or undefined for no addition) to be appended to the rendered `<tr>`.
 *
 * @see ADR-MOD-GRID-01-007
 */
export type RowClassNameCallback<TData> = (
  row: Row<TData>,
) => string | undefined;

/**
 * `<Grid>` `ref.current.scrollTo(index, options)` 의 옵션 타입 (G-004 D9).
 *
 * `@tanstack/react-virtual` `ScrollToOptions` 와 시그니처 동일.
 * `enableVirtualization=false` 일 때 fallback DOM scroll 에서도 동일 의미 적용
 * (`align` → `block`, `behavior` 그대로).
 *
 * @see G-004-spec.md Section 2.1 D9
 */
export type GridScrollToOptions = VirtualScrollToOptions;

/**
 * `<Grid>` ref 노출 imperative handle (G-004 D4).
 *
 * @typeParam TData - 행 데이터 타입.
 *
 * @example
 * ```tsx
 * const gridRef = useRef<GridHandle<User>>(null);
 *
 * <Grid<User>
 *   ref={gridRef}
 *   data={users}
 *   columns={columns}
 *   onAddRow={(seed) => setUsers((prev) => [...prev, { ...defaults, ...seed }])}
 * />;
 *
 * gridRef.current?.scrollTo(50);
 * gridRef.current?.getSelection();   // User[]
 * ```
 *
 * @remarks
 * **데이터 mutation 정책 (D3 — callback-delegating)**:
 * - `addRow` / `deleteRow` / `updateRow` 는 `props.data` 가 controlled 이므로 GridHandle
 *   method 가 직접 mutation 하지 않는다.
 * - 호출 시 `props.onAddRow` / `onDeleteRow` / `onUpdateRow` 콜백을 invoke. parent 가
 *   `setState` 로 mutation 책임을 진다.
 * - 콜백 미제공 시 dev mode `console.warn` 1회 + no-op (production silent).
 * - `<ChangeTrackingGrid>` (MOD-GRID-10) 는 internal `trackedRows` state owner —
 *   자체 handle (`ChangeTrackingHandle`) 사용 (본 `GridHandle` 미사용).
 *
 * @see G-004-spec.md Section 2.1 + D3/D4
 */
export interface GridHandle<TData> {
  /**
   * 행 추가 — `props.onAddRow(seed?)` 콜백 위임 (D3).
   * 콜백 미제공 시 dev mode `console.warn` 1회 + no-op.
   */
  addRow: (seed?: Partial<TData>) => void;

  /**
   * 행 삭제 — `props.onDeleteRow(rowId)` 콜백 위임 (D3).
   * `rowId` = TanStack `row.id` (default = row index string).
   */
  deleteRow: (rowId: string | number) => void;

  /**
   * 행 부분 업데이트 — `props.onUpdateRow(rowId, patch)` 콜백 위임 (D3).
   */
  updateRow: (rowId: string | number, patch: Partial<TData>) => void;

  /**
   * 인덱스 행으로 스크롤 (D9).
   *
   * - `enableVirtualization=true` 시 `virtualizer.scrollToIndex(index, options)` 위임
   *   (`@tanstack/react-virtual` API).
   * - `enableVirtualization=false` 시 native DOM
   *   `tbody tr[data-index="N"].scrollIntoView({...})` fallback.
   * - 음수 / `data.length` 초과 index → `[0, data.length-1]` 로 clamp + dev `console.warn`.
   */
  scrollTo: (index: number, options?: GridScrollToOptions) => void;

  /**
   * 모든 행 펼침 — `table.toggleAllRowsExpanded(true)` 위임 (MOD-GRID-16 D8).
   * Master-Detail / Tree expand 가능 컴포넌트에서만 구현.
   * 기본 `<Grid>` 는 이 메서드를 노출하지 않음.
   */
  expandAll?(): void;

  /**
   * 모든 행 접힘 — `table.toggleAllRowsExpanded(false)` 위임 (MOD-GRID-16 D8).
   * Master-Detail / Tree expand 가능 컴포넌트에서만 구현.
   * 기본 `<Grid>` 는 이 메서드를 노출하지 않음.
   */
  collapseAll?(): void;

  /**
   * 현재 선택된 행 데이터 배열 반환 — `table.getSelectedRowModel().rows.map(r => r.original)`
   * 위임 (D12). 빈 배열 = 선택 없음.
   */
  getSelection: () => TData[];

  /**
   * 모든 선택 해제 — `table.setRowSelection({})` 위임 (D12).
   * AG `api.deselectAll()` 등가.
   */
  clearSelection: () => void;

  /**
   * 내부 상태 재산정 — `table.resetRowSelection()` 위임 (D11).
   *
   * @remarks
   * `props.data` 변경은 자동 re-render 됨. `refresh()` 는 stale selection key 정리 등
   * selection state 재산정 trigger 용 (예: data sort 변경 후 동일 rowId 가 다른 row 가리킬 때).
   * AG `api.refreshCells()` 와 의미 등가. `table.reset()` 은 sort/filter/pagination
   * 모두 reset → UX 회귀 위험 — 채택 안 함 (D11).
   */
  refresh: () => void;

  /**
   * 프로그래밍적 편집 시작 — `props.onStartEditing(rowId, colId)` 콜백 위임 (G-007 D2).
   *
   * @remarks
   * G-004 ADR-005 의 callback-delegating 패턴 (addRow/deleteRow/updateRow) 와 일관:
   * - controlled editing state 정책 — Grid 가 editing state 를 소유하지 않음.
   * - 호출 시 `props.onStartEditing` 콜백 invoke. application 이 EditableCell 의
   *   `isEditing` 을 setting 책임 (e.g. ChangeTrackingGrid + useChangeTracking).
   * - 콜백 미제공 시 dev mode `console.warn` 1회 + no-op (production silent).
   * - cross-package wiring (Grid scope editing state) 은 별도 cycle 결정 — 본 G-007 은
   *   API surface 만 노출.
   *
   * **Optional**: 기본 `<Grid>` 는 본 method 를 구현. ChangeTrackingGrid / MasterDetailGrid /
   * ContextMenuGrid 등 자체 handle 을 노출하는 wrapper 는 본 method 를 구현하지 않을 수 있음
   * (`expandAll?` / `collapseAll?` 패턴과 일관 — backward compat C-23).
   *
   * @see ADR-MOD-GRID-01-008
   */
  startEditing?(rowId: string | number, colId: string): void;
}

/**
 * 컬럼 리사이즈 모드.
 *
 * - `'onChange'`: drag 중 실시간 width 업데이트 (default — UX 우수).
 * - `'onEnd'`: drag 종료 시 1회 업데이트 (성능 우수, 대용량 행 환경 권장).
 *
 * @see G-002-spec.md Section 2.1 D5
 */
export type GridColumnResizeMode = 'onChange' | 'onEnd';

/**
 * 행 선택 모드.
 *
 * - `'single'`: 단일 행 선택 — 헤더 체크박스는 렌더되지 않음.
 * - `'multi'`: 다중 선택 — 헤더 체크박스(전체 선택) + 행별 체크박스.
 * - `'none'`: 선택 비활성 — 체크박스 컬럼 합성 없음.
 *
 * BaseGrid `GridRowSelectionOptions.mode` 와 호환 (legacy alias 대응).
 */
export type RowSelectionMode = 'single' | 'multi' | 'none';

/**
 * 행 선택 옵션 (객체 형태).
 *
 * `<Grid rowSelection="multi" />` 단축 표기 또는 `<Grid rowSelection={{ mode, onSelectionChange }} />` 객체 표기 모두 지원.
 *
 * @typeParam TData - 행 데이터 타입 (소비자가 명시).
 */
export interface GridRowSelectionOptions<TData> {
  /** 선택 모드 (default `'none'`). */
  mode?: RowSelectionMode;
  /**
   * 선택 변경 콜백.
   * 인자: 현재 선택된 행의 `row.original` 배열 (페이지·필터 기준).
   */
  onSelectionChange?: (rows: TData[]) => void;
  /**
   * Controlled — 외부에서 RowSelectionState 직접 제어할 때 사용.
   * 미지정 시 internal state 사용 (uncontrolled).
   */
  state?: RowSelectionState;
  /** Controlled state 변경 핸들러 (controlled 모드에서 필수). */
  onStateChange?: OnChangeFn<RowSelectionState>;
}

/**
 * 페이지네이션 옵션.
 *
 * `enablePagination=true` 일 때만 효과 발휘. `manual=true` 시 server-side 페이지네이션 (외부 totalCount + pageIndex 제어 의무).
 */
export interface GridPaginationOptions {
  /** 기본 pageSize (default `20`). */
  pageSize?: number;
  /** 페이지당 행 수 셀렉트 옵션 (default `[10, 20, 50, 100]`). */
  pageSizeOptions?: number[];
  /**
   * Server-side 페이지네이션 모드.
   * `true` 시 TanStack `manualPagination: true` + 외부 `totalCount` 필수.
   */
  manual?: boolean;
  /** Server 모드에서 전체 row count (manual=true 일 때 필수). */
  totalCount?: number;
  /** Controlled pageIndex (controlled 모드). */
  pageIndex?: number;
  /** Controlled pageIndex 변경 핸들러. */
  onPaginationChange?: OnChangeFn<PaginationState>;

  /**
   * Pagination 동작 모드 (convenience shorthand).
   *
   * - `'client'` → `manual: false` + `enablePagination` 자동 활성
   * - `'server'` → `manual: true` + `enablePagination` 자동 활성
   * - `'none'`   → pagination 비활성화 (enablePagination 무시)
   *
   * `mode`와 `manual` 동시 지정 시 `mode`가 우선.
   *
   * @since G-001 (MOD-GRID-03)
   */
  mode?: PaginationMode;

  /**
   * Server 모드(`mode: 'server'` 또는 `manual: true`)에서 전체 페이지 수.
   * `totalCount`와 `pageSize`로부터 자동 계산되나, 직접 지정 시 override.
   *
   * @since G-001 (MOD-GRID-03)
   */
  pageCount?: number;

  /**
   * 전체 건수 표시 여부. 기본 `true`.
   * `false` 설정 시 "전체 N건" UI를 숨긴다.
   *
   * @since G-002 (MOD-GRID-03)
   */
  showTotalCount?: boolean;

  /**
   * Alt+← / Alt+→ 키보드 페이지 이동 활성화.
   * `GridPagination` 컴포넌트의 `enableKeyboardNav` prop에 연결.
   * 기본 `false`.
   *
   * @since G-003 (MOD-GRID-03)
   */
  enableKeyboardNav?: boolean;
}

/**
 * `<Grid>` 컴포넌트 props.
 *
 * @typeParam TData - 행 데이터 타입.
 *
 * @example
 * ```tsx
 * <Grid<User>
 *   data={users}
 *   columns={columns}
 *   enableSort
 *   enablePagination
 *   rowSelection="multi"
 *   pagination={{ pageSize: 50 }}
 * />
 * ```
 *
 * @remarks
 * - `forwardRef` + `useImperativeHandle` 지원은 G-004 범위. G-001은 선언적 컴포넌트 only.
 * - `enableVirtualization` 등 virtualization wiring 도 G-004 범위 (본 G-001 미정의).
 *
 * @see G-001-spec.md Section 2.1
 */
export interface GridProps<TData> {
  // ─── 필수 ───
  /** 행 데이터 배열. */
  data: TData[];
  /** 컬럼 정의 (TanStack `ColumnDef`). */
  columns: ColumnDef<TData, unknown>[];

  // ─── enable* 토글 ───
  /** 정렬 활성 (default `false`) — `getSortedRowModel` wiring. */
  enableSort?: boolean;
  /** 다중 정렬 활성 (default `false`) — TanStack `enableMultiSort` 위임. */
  enableMultiSort?: boolean;
  /**
   * 동시에 정렬 가능한 최대 컬럼 수 (AC-001).
   * TanStack `maxMultiSortColCount` 에 직접 전달. 미설정 시 무제한.
   * `enableMultiSort=false` 시 무시됨.
   *
   * @see G-002-spec.md (MOD-GRID-08)
   */
  maxMultiSortColCount?: number;
  /**
   * 정렬 초기화 버튼 표시 여부 (AC-003).
   * `true` 이고 `enableMultiSort=true` 일 때 툴바에 `<SortClearButton>` 렌더 (D5).
   * 미설정(기본) 시 DOM 구조 변경 없음 (C-6).
   *
   * @see G-002-spec.md (MOD-GRID-08)
   */
  showSortClearButton?: boolean;
  /** 컬럼 필터 활성 (default `false`) — `getFilteredRowModel` wiring. */
  enableFilter?: boolean;
  /** 페이지네이션 활성 (default `false`) — `getPaginationRowModel` wiring. */
  enablePagination?: boolean;
  /**
   * 컬럼 핀 state 활성 (default `false`).
   * 본 G-001은 `state.columnPinning` state 만 활성화. sticky CSS 외관은 G-002 범위.
   */
  enableColumnPinning?: boolean;
  /**
   * 컬럼 리사이즈 state 활성 (default `false`).
   * resize handle UI 는 G-002 범위.
   */
  enableColumnResizing?: boolean;

  /**
   * 컬럼 드래그 재정렬 활성 (default `false`).
   * HTML5 Drag and Drop API 기반 — 외부 dnd 라이브러리 미사용 (C-20).
   * G-001 (MOD-GRID-07): AC-001.
   */
  enableColumnReorder?: boolean;

  /**
   * 컬럼 순서 변경 완료 후 호출되는 콜백.
   * 부모가 외부 state 동기화 가능 (AC-005).
   * G-001 (MOD-GRID-07): F-07-06 흡수.
   */
  onColumnOrderChange?: (order: string[]) => void;

  // ─── G-002 (MOD-GRID-07): 컬럼 순서 localStorage 영속화 ───
  /**
   * 컬럼 순서 localStorage 영속화 활성 (G-002).
   *
   * `true` + `columnOrderStorageKey` 지정 시 drag/keyboard 완료 후 localStorage 저장.
   * mount 시 저장된 순서 복원 (`table.setColumnOrder`).
   *
   * @remarks
   * D5: `columnPersistence` (G-003) 가 `columnOrder` 를 persist 목록에 포함하면
   * G-003 쪽이 별도 storageKey 로 독립 저장 — key 충돌 없음.
   * 두 옵션 동시 지정 시 mount 순서에 따라 나중에 실행된 `table.setColumnOrder` 가 최종 적용
   * (non-deterministic — 동시 사용 비권장).
   */
  persistColumnOrder?: boolean;

  /**
   * `persistColumnOrder=true` 시 사용할 localStorage 키.
   *
   * 빈 문자열(`''`) 전달 시 localStorage 접근 없음 (EC-003).
   * 미지정 시 `persistColumnOrder=true` 라도 저장 skip.
   */
  columnOrderStorageKey?: string;

  /** 행 펼침(expanding) state 활성 (default `false`) — TreeGrid 흡수. `getSubRows` 와 함께 사용. */
  enableExpanding?: boolean;

  /**
   * `enableExpanding=true` 시 expanded state 초기값 (uncontrolled).
   *
   * - `true` = 전체 펼침
   * - `Record<string, boolean>` = 특정 row id만 펼침
   * - 미지정 = `{}` (전체 접힘)
   *
   * G-005 D5 — TreeGrid alias `expandAll={true}` 호환 진입점. AS-IS TreeGrid.tsx:35
   * `useState<ExpandedState>(initialExpandAll ? true : {})` initial seed 패턴 보존.
   *
   * @see G-005-spec.md Section 2.5 + D5
   */
  defaultExpanded?: ExpandedState | boolean;

  // ─── 행 선택 ───
  /**
   * 행 선택 옵션. 단축 표기(`'multi'`) 또는 객체 표기 모두 지원.
   * 'single'/'multi' 시 좌측 첫 컬럼에 체크박스 컬럼(`__select__`) 자동 prepend.
   */
  rowSelection?: RowSelectionMode | GridRowSelectionOptions<TData>;

  // ─── 페이지네이션 ───
  /** 페이지네이션 세부 옵션 (`enablePagination=true` 일 때 효과). */
  pagination?: GridPaginationOptions;

  // ─── 이벤트 (G-001 → G-003 D3 시그니처 확장) ───
  /**
   * 행 클릭 핸들러.
   *
   * @param row - `row.original` (TData).
   * @param event - 원본 MouseEvent. `stopPropagation()` 등 이벤트 제어 필요 시 사용.
   *
   * @remarks
   * G-001 시그니처 `(row: TData) => void` 와 backward-compatible.
   * 호출자가 event 인자를 무시해도 TypeScript 함수 contravariance 로 type-check 통과.
   * 체크박스 셀 (`__select__` 컬럼) 클릭은 G-001 `CheckboxColumn` 내부에서 `stopPropagation` 처리됨.
   * `onCellClick` 과 동시 fire — cell 이벤트가 row 이벤트보다 먼저 발생 (DOM 버블 순서).
   *
   * @see G-003-spec.md Section 2.1 D3 + Section 6 EC-04
   */
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;

  /**
   * 행 더블 클릭 핸들러 — `onRowClick` 와 동일한 시그니처 정책 (G-003 D3).
   *
   * @param row - `row.original` (TData).
   * @param event - 원본 MouseEvent.
   *
   * @see G-003-spec.md Section 2.1 D3
   */
  onRowDoubleClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;

  // ─── G-003 신규: 셀 클릭 (D4) ───
  /**
   * 셀 클릭 핸들러 — column-level 분기 의도 노출.
   *
   * @param cell - TanStack `Cell` 객체 (`cell.column.id`, `cell.getValue()` 접근 가능).
   * @param row - `row.original` (TData) — `onRowClick` 와 일관된 인자.
   * @param event - 원본 MouseEvent.
   *
   * @remarks
   * `onCellClick` + `onRowClick` 동시 fire (DOM 이벤트 버블 — cell 먼저, 이어서 row).
   * 행 클릭 차단이 필요하면 사용자가 `event.stopPropagation()` 호출 의무.
   *
   * @see G-003-spec.md Section 2.1 D4 + Section 6 EC-04
   */
  onCellClick?: (
    cell: Cell<TData, unknown>,
    row: TData,
    event: MouseEvent<HTMLTableCellElement>,
  ) => void;

  // ─── G-007 (MOD-GRID-01): 셀 키보드 이벤트 (D1) ───
  /**
   * 셀 키보드 이벤트 핸들러 — `<td onKeyDown>` 으로 wire (G-007 D1).
   *
   * @param cell - TanStack `Cell` 객체.
   * @param row - `row.original` (TData) — `onCellClick` 와 일관된 (cell, row, event) 3-arg 시그니처.
   * @param event - React `KeyboardEvent<HTMLTableCellElement>`.
   *
   * @remarks
   * 시그니처는 `onCellClick` (ADR-MOD-GRID-01-004 D4) 과 일관 — `(cell, row, event)`.
   *
   * **focus management**: `<td>` 는 default 로 tabIndex 부재 → native focus 불가.
   * 사용자가 `onCellKeyDown` 활용 시 cellRenderer 에서 `tabIndex={0}` 를 부여하거나
   * (`<EditableCell>` 등) focus-able 자식 요소가 있어야 키보드 이벤트 도착함.
   *
   * **typical use case** (publish/organizeSchedule G-7 등가): char 입력 시 자동
   * `startEditing()` 호출.
   *
   * @see ADR-MOD-GRID-01-008
   */
  onCellKeyDown?: (
    cell: Cell<TData, unknown>,
    row: TData,
    event: KeyboardEvent<HTMLTableCellElement>,
  ) => void;

  // ─── G-007 (MOD-GRID-01): startEditing 콜백 (D2) ───
  /**
   * 프로그래밍적 편집 시작 콜백 — `ref.current.startEditing(rowId, colId)` 호출 시 invoke (G-007 D2).
   *
   * G-004 D3 의 callback-delegating 패턴과 동일 정책: Grid 가 editing state 를 소유하지 않으며
   * application 이 EditableCell `isEditing` 갱신 책임.
   *
   * @example
   * ```tsx
   * const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
   * <Grid
   *   ref={gridRef}
   *   data={rows}
   *   columns={columns}
   *   onStartEditing={(rowId, colId) => setEditingCell({ rowId: String(rowId), colId })}
   *   onCellKeyDown={(cell, _row, event) => {
   *     if (event.key.length === 1 && cell.column.id.startsWith('d')) {
   *       gridRef.current?.startEditing(cell.row.id, cell.column.id);
   *     }
   *   }}
   * />
   * ```
   *
   * @see ADR-MOD-GRID-01-008
   */
  onStartEditing?: (rowId: string | number, colId: string) => void;

  // ─── G-006 (MOD-GRID-01): cellClassName / rowClassName callback (D1/D2) ───
  /**
   * 셀별 className 생성 callback (G-006 D1).
   *
   * 모든 cell 렌더 시 호출. 반환 string 은 `<td>` 의 기본 className 에 append.
   *
   * **canonical**: 본 callback type 은 grid-core 가 ownership. grid-renderers 는
   * type-only re-export.
   *
   * **사용 예** (publish/organizeSchedule G-3 등가):
   * ```tsx
   * cellClassName={(cell) => {
   *   if (!cell.column.id.startsWith('d')) return '';
   *   const isSelected = cell.row.getIsSelected();
   *   const hasValue = cell.getValue() != null && cell.getValue() !== '';
   *   return [
   *     isSelected && 'bg-indigo-100',
   *     !isSelected && hasValue && 'bg-yellow-50',
   *   ].filter(Boolean).join(' ');
   * }}
   * ```
   *
   * **성능 주의**: 매 cell 렌더마다 호출 — 대용량 데이터 시 callback 내부 계산 비용
   * 주의 (useMemo 또는 stable callback 권장).
   *
   * @see ADR-MOD-GRID-01-007
   * @see ADR-MOD-GRID-05-002 D3 (deferred Grid-level wiring 이행)
   */
  cellClassName?: CellClassNameCallback<TData>;

  /**
   * 행별 className 생성 callback (G-006 D2).
   *
   * 모든 row 렌더 시 호출. 반환 string 은 `<tr>` 의 기본 className 에 append.
   *
   * **virtualization 주의**: `enableVirtualization=true` 시 `<tr ref={measureElement}>`
   * 가 row height 측정 — `rowClassName` 이 dynamic height 변경을 유발하면 measureElement
   * 의 reflow 가 반복 발생 (성능 저하). static className 권장.
   *
   * @see ADR-MOD-GRID-01-007
   */
  rowClassName?: RowClassNameCallback<TData>;

  // ─── MOD-GRID-24 G-2: floating(고정) 합계/요약 행 ───
  /**
   * 그리드 **상단**에 고정 표시할 소비자 공급 행 데이터 (MOD-GRID-24 G-2).
   *
   * AG Grid 의 `pinnedTopRowData` 와 동형 — 데이터 모델 *밖*의 추가 행(합계/요약 등).
   * 컬럼 셀 렌더러(`columnDef.cell`)를 그대로 통과해 본문 행과 동일하게 표시되며,
   * 본문이 스크롤돼도 `position: sticky` 로 고정된다.
   *
   * **집계 계산 안 함**: 소비자가 total 객체를 직접 제공(자동 집계는 `@topgrid/grid-pro-agg`/Pro).
   * **상호작용 핀 아님**: 기존 행을 사용자가 핀하는 기능(`@topgrid/grid-pro-master`/Pro)과 별개.
   * 미제공/빈 배열 → 렌더 없음(기존 동작 불변).
   *
   * @remarks
   * - **데이터 0건 시 미표시**: floating 행은 본문 데이터 경로에서만 렌더되므로 `loading` 또는
   *   `data` 가 비면 표시되지 않는다(빈 그리드에 합계 행만 뜨는 것 방지 — 의도된 동작).
   * - **상단 sticky offset(검증 중)**: 상단 floating 행은 `position: sticky; top: 0` 인데 sticky
   *   `<thead>` 도 `top: 0` 이라 헤더와 겹칠 수 있다(올바른 offset = thead 높이). 스크롤 고정
   *   시각거동은 chromium 검증 대상(MOD-24 spec pending). 하단(`floatingBottomRows`)은 해당 없음.
   *
   * @default undefined
   */
  floatingTopRows?: TData[];

  /**
   * 그리드 **하단**에 고정 표시할 소비자 공급 행 데이터 (MOD-GRID-24 G-2).
   * `floatingTopRows` 와 동일 규약(하단 sticky).
   *
   * @default undefined
   */
  floatingBottomRows?: TData[];

  // ─── G-003 신규: 로딩 (D5/D8) ───
  /**
   * 로딩 상태. `true` 시 `<tbody>` 영역만 skeleton row 로 치환 (thead 보존 — D5).
   *
   * @see G-003-spec.md Section 2.2 + D5
   */
  loading?: boolean;

  /**
   * 로딩 시 표시할 skeleton 행 개수.
   * 미지정 시 `pagination.pageSize ?? 5` 로 fallback (D8 — BaseGrid L123 hardcoded `5` 와 호환).
   *
   * @see G-003-spec.md Section 2.2 D8
   */
  loadingRowCount?: number;

  // ─── G-003 신규: 빈 상태 slot (D6/D7) ───
  /**
   * 빈 결과 상태 ReactNode slot.
   * 제공 시 `emptyText` 보다 우선 렌더 (D7 — slot → text → defaultText 순).
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
   * @see G-003-spec.md Section 2.3 + D6/D7
   */
  emptyState?: ReactNode;

  // ─── G-003 신규: 첫 행 자동 선택 (D9) ───
  /**
   * 데이터 로드 후 첫 행 자동 선택 (default `false`).
   *
   * @remarks
   * - `rowSelection='none'` 시 no-op (D9)
   * - `'multi'` 시에도 첫 1행만 선택 (single behavior — AG `autoSelectFirstRow` 패턴)
   * - useEffect deps = `[dataLength, autoSelectFirstRow, selectionMode]` —
   *   `props.data` ref 변경에 둔감, length 변경 시만 재선택 (EC-06).
   *   같은 length 의 다른 데이터에서 사용자 선택을 보호하려는 의도 — 매 변경마다
   *   재선택이 필요하면 외부에서 `key` prop 으로 Grid 자체 unmount/remount 권장.
   *
   * @see G-003-spec.md Section 2.4 D9 + Section 6 EC-05/EC-06
   */
  autoSelectFirstRow?: boolean;

  // ─── 표시 ───
  /** 외곽 wrapper className (Tailwind). */
  className?: string;
  /** 빈 결과 안내 텍스트 (default `'데이터가 없습니다.'`). */
  emptyText?: string;

  // ─── 트리 ───
  /** TanStack `getSubRows` — `enableExpanding=true` 시 사용. */
  getSubRows?: (row: TData, index: number) => TData[] | undefined;

  // ─── G-002: 컬럼 리사이즈 ───
  /**
   * 컬럼 리사이즈 모드 (default `'onChange'`).
   * `enableColumnResizing=true` 일 때만 효과 발휘.
   *
   * @see G-002-spec.md Section 2.1 D5
   */
  columnResizeMode?: GridColumnResizeMode;

  /**
   * 컬럼 width uncontrolled 초기값 (column id → px).
   * mount 시 internal `columnSizing` state 의 초기값으로 사용 (uncontrolled 패턴).
   */
  defaultColumnSizing?: ColumnSizingState;

  /** ColumnSizing state 변경 콜백 (외부 영속화 또는 controlled mirror 용). */
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;

  // ─── G-002: 컬럼 핀 (sticky CSS + state) ───
  /**
   * 컬럼 핀 uncontrolled 초기값 (`{ left: string[]; right: string[] }`).
   * ColumnPinGrid `pinLeft` / `pinRight` alias 매핑 진입점 (G-005).
   */
  defaultColumnPinning?: ColumnPinningState;

  /** ColumnPinning state 변경 콜백 (외부 영속화 또는 controlled mirror 용). */
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>;

  // ─── G-003 (MOD-GRID-04): 컬럼 가시성 + 순서 영속화 ───
  /**
   * 컬럼 가시성 + 순서 localStorage 영속화 옵션 (G-003).
   *
   * - 제공 시 `<ColumnVisibilityMenu>` UI 자동 렌더 + `useColumnPersistence` 활성.
   * - 미제공(`undefined`) 시 영속화 비활성 + 메뉴 미표시 (EC-001 backward compat).
   * - `storageKey: ''` 시 localStorage 접근 없음 (EC-002, NFR-006).
   *
   * @example
   * ```tsx
   * <Grid
   *   data={rows}
   *   columns={columns}
   *   columnPersistence={{ storageKey: 'my-grid-v1', persist: ['visibility'] }}
   * />
   * ```
   *
   * @see ColumnPersistenceOptions
   * @see G-003-spec.md Section 2 + D1~D5
   */
  columnPersistence?: ColumnPersistenceOptions;

  // ─── 디버그 ───
  /** TanStack `debugTable` 옵션 노출 (default `false`). */
  debug?: boolean;

  // ─── G-004 신규: 데이터 mutation 콜백 (D3 callback-delegating) ───
  /**
   * 행 추가 콜백 — `ref.current.addRow(seed?)` 호출 시 invoke (D3).
   * controlled data 정책: parent 가 `props.data` 배열에 새 row append 책임.
   *
   * @example
   * ```tsx
   * const [rows, setRows] = useState<User[]>([]);
   * <Grid
   *   ref={gridRef}
   *   data={rows}
   *   onAddRow={(seed) => setRows((prev) => [...prev, { id: Date.now(), name: '', ...seed }])}
   * />;
   * gridRef.current?.addRow({ name: '신규' });
   * ```
   *
   * @see G-004-spec.md Section 2.1 + D3
   */
  onAddRow?: (seed?: Partial<TData>) => void;

  /**
   * 행 삭제 콜백 — `ref.current.deleteRow(rowId)` 호출 시 invoke (D3).
   * `rowId` = TanStack `row.id` (default = row index string).
   *
   * @see G-004-spec.md Section 2.1 + D3
   */
  onDeleteRow?: (rowId: string | number) => void;

  /**
   * 행 부분 업데이트 콜백 — `ref.current.updateRow(rowId, patch)` 호출 시 invoke (D3).
   *
   * @see G-004-spec.md Section 2.1 + D3
   */
  onUpdateRow?: (rowId: string | number, patch: Partial<TData>) => void;

  // ─── G-004 신규: 가상화 (D6/D7/D8) ───
  /**
   * 가상화 활성 (default `false`) — opt-in only (D6).
   *
   * `true` 시 `useGridVirtualizer` wiring + tbody padding-row 패턴 적용 (D5).
   * `false` 시 G-001~G-003 markup 그대로 (G-002 sticky/pinning 보존).
   *
   * @remarks
   * - 자동 임계값 (예: `data.length > 1000`) 미적용 — short list 부적절성 회피 (D6).
   * - 활성 시 `virtualScrollHeight` 명시 권장 (미명시 시 default `400` + dev warn).
   * - G-002 sticky thead + pinning 호환 (single-table padding-row, D5).
   *
   * @see G-004-spec.md Section 2.4 + D5/D6
   */
  enableVirtualization?: boolean;

  /**
   * 가상화 시 scroll container 높이 (px, default `400`) (D7).
   * `enableVirtualization=true` 일 때만 효과 발휘.
   *
   * @see G-004-spec.md Section 2.4 + D7
   */
  virtualScrollHeight?: number;

  /**
   * `useVirtualizer` 옵션 override (D8).
   *
   * - `estimateSize`: 행 높이 추정 px (default `36`, BaseGrid `<td className="px-4 py-3">` 기준).
   * - `overscan`: viewport 위/아래 버퍼 행 수 (default `10`, VirtualGrid.tsx:102 동일).
   *
   * @see G-004-spec.md Section 2.4 + D8
   */
  virtualizerOptions?: {
    estimateSize?: number;
    overscan?: number;
  };
}

/**
 * `BaseGridProps<TData>` — G-005 legacy alias 5종 공통 props 시그니처 (D11).
 *
 * AS-IS legacy grid 타입과 시그니처 동일 — 패키지 내
 * alias 호환을 위해 신규 정의 (외부 의존 0). 본 interface 는 `legacy/BaseGrid.tsx` +
 * `legacy/VirtualGrid.tsx` (extends) 에서 사용.
 *
 * @typeParam TData - 행 데이터 타입.
 *
 * @deprecated `<Grid>` 직접 사용 권장. 1 minor 버전 후 다음 major 에서 alias 와 함께 제거 (C-23).
 *
 * @see G-005-spec.md Section 2.9 + D11
 */
export interface BaseGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  pagination?: GridPaginationOptions;
  rowSelection?: GridRowSelectionOptions<TData>;
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  onRowDoubleClick?: (row: TData) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

/**
 * `useGridState`가 관리하는 8개 state의 value-only 타입.
 * setter를 포함하지 않음 (GridState와 구분).
 *
 * @typeParam TData - 현재 미사용 (G-003+ 확장 예정). 일관성을 위해 유지.
 *
 * @see useGridState
 * @see G-002-spec.md Section 2.1
 */
export interface GridStateValues<_TData = unknown> {
  /** 정렬 state (TanStack `SortingState`). */
  sorting: SortingState;
  /** 컬럼 필터 state (TanStack `ColumnFiltersState`). */
  columnFilters: ColumnFiltersState;
  /** 행 선택 state (TanStack `RowSelectionState`). */
  rowSelection: RowSelectionState;
  /** 페이지네이션 state (TanStack `PaginationState`). */
  pagination: PaginationState;
  /** 컬럼 핀 state (TanStack `ColumnPinningState`). */
  columnPinning: ColumnPinningState;
  /** 컬럼 순서 state (TanStack `ColumnOrderState`). */
  columnOrder: ColumnOrderState;
  /** 컬럼 너비 state (TanStack `ColumnSizingState`). */
  columnSizing: ColumnSizingState;
  /** 컬럼 표시 state (TanStack `VisibilityState`). */
  columnVisibility: VisibilityState;
}

/**
 * `useGridState`의 8개 state key union.
 * `resetSection(key)` / `onStateChange(next, key)` 등에서 사용.
 *
 * @see UseGridStateOptions
 * @see G-002-spec.md Section 2.1
 */
export type GridStateKey =
  | 'sorting'
  | 'columnFilters'
  | 'rowSelection'
  | 'pagination'
  | 'columnPinning'
  | 'columnOrder'
  | 'columnSizing'
  | 'columnVisibility';

/**
 * `useGridState<TData>(options?)` 의 파라미터 타입.
 *
 * @typeParam TData - 행 데이터 타입 (GridStateValues에 전달).
 *
 * @example
 * ```ts
 * // uncontrolled + initialState
 * const s = useGridState({ initialState: { sorting: [{ id: 'date', desc: true }] } });
 *
 * // controlled (sorting만)
 * const s = useGridState({
 *   state: { sorting: externalSorting },
 *   onStateChange: (next, key) => { if (key === 'sorting') dispatch(setSort(next.sorting)); },
 * });
 * ```
 *
 * @see G-002-spec.md Section 2.1
 */
export interface UseGridStateOptions<TData = unknown> {
  /**
   * uncontrolled 모드 초기값.
   * 제공 시 해당 키의 useState 초기값으로 사용.
   * controlled 모드(`state` 제공)와 함께 사용 시 initialState는 무시됨 (controlled 우선).
   */
  initialState?: Partial<GridStateValues<TData>>;

  /**
   * controlled 모드 외부 state.
   * Partial<GridStateValues>로 키 단위 controlled 허용.
   * `state.sorting`이 있으면 sorting은 controlled, 나머지는 uncontrolled.
   *
   * @remarks exactOptionalPropertyTypes: true 환경 — 이 필드가 존재하면
   * `undefined`와 "미제공"을 구분. undefined를 명시적으로 전달하면 controlled 해제.
   */
  state?: Partial<GridStateValues<TData>>;

  /**
   * state 변경 통보 콜백.
   * controlled/uncontrolled 양쪽에서 호출됨.
   * `debounceMs > 0` 시 debounced 호출 (마지막 변경만 발화).
   * `debounceMs` 미설정 또는 0 시 동기 호출 (G-002 동작 보존).
   *
   * @param next - 변경 후 전체 state snapshot (`GridStateValues<TData>`).
   * @param changedKey - 변경된 state key (`GridStateKey`).
   */
  onStateChange?: (next: GridStateValues<TData>, changedKey: GridStateKey) => void;

  /**
   * `onStateChange` debounce 대기 시간 (ms).
   *
   * - 미설정 또는 `0`: 동기 호출 (G-002와 동일 동작, breaking 없음).
   * - `> 0`: 마지막 변경 후 `debounceMs` ms 경과 시 1회 발화.
   *   300ms 내 N번 연속 변경 → 마지막 snapshot만 전달.
   * - 음수: `0`과 동일 처리 (동기).
   *
   * @example 300ms debounce — URL 동기화
   * ```ts
   * useGridState({ onStateChange: updateUrl, debounceMs: 300 })
   * ```
   *
   * @remarks
   * 구현: `useRef` + `setTimeout` (lodash 의존 X — C-21, AC-003).
   * unmount 시 pending timeout cleanup (C-12, AC-004).
   */
  debounceMs?: number;

  /**
   * 외부 트리거로 `rowSelection`을 자동 reset하는 옵션 (G-004 AC-003).
   *
   * AggridTable `clearSelectionKey` 패턴 흡수 (R-A: AggridTable.tsx L88-92).
   * 이 값이 변경될 때마다 `rowSelection: {}` 으로 자동 reset.
   * `undefined` 초기값은 mount 시 트리거 안 함 (EC-04 isFirstClearRender ref flag).
   *
   * @example
   * ```ts
   * // 검색 폼 submit 시 선택 초기화
   * const [searchKey, setSearchKey] = useState(0);
   * const state = useGridState({ clearSelectionKey: searchKey });
   * const handleSearch = () => {
   *   setSearchKey((k) => k + 1); // clearSelectionKey 변경 → rowSelection 자동 reset
   *   fetchData(formValues);
   * };
   * ```
   *
   * @remarks
   * - `string | number`로 타입 제한 (AggridTable의 `any` 개선 — C-4 strict)
   * - 값 내용보다 "변경" 자체가 목적 — number 카운터 또는 string 타임스탬프 권장
   *
   * @see G-004-spec.md Section 2.2 + Section 11.1 (D4)
   */
  clearSelectionKey?: string | number;
}

/**
 * `useGridState<TData>()` 반환 타입 — 8 TanStack state + 8 setter (G-001, MOD-GRID-02).
 *
 * 8개 grid variant(BaseGrid/VirtualGrid/...) 에서 중복 선언되던 `useState<StateType>`
 * 패턴을 한 번에 흡수하기 위한 통합 반환 타입.
 *
 * `TData`는 현재 미사용 (G-002 controlled mode 확장 시 활용).
 *
 * @typeParam TData - 행 데이터 타입 (default `unknown`).
 *
 * @see useGridState
 * @see G-001-spec.md Section 2.1
 */
export interface GridState<_TData = unknown> {
  // ─── 8 state ───
  /** 정렬 state (TanStack `SortingState`). 기본값 `[]`. */
  sorting: SortingState;
  /** 컬럼 필터 state (TanStack `ColumnFiltersState`). 기본값 `[]`. */
  columnFilters: ColumnFiltersState;
  /** 행 선택 state (TanStack `RowSelectionState`). 기본값 `{}`. */
  rowSelection: RowSelectionState;
  /** 페이지네이션 state (TanStack `PaginationState`). 기본값 `{ pageIndex: 0, pageSize: 10 }`. */
  pagination: PaginationState;
  /** 컬럼 핀 state (TanStack `ColumnPinningState`). 기본값 `{}`. */
  columnPinning: ColumnPinningState;
  /** 컬럼 순서 state (TanStack `ColumnOrderState`). 기본값 `[]`. */
  columnOrder: ColumnOrderState;
  /** 컬럼 너비 state (TanStack `ColumnSizingState`). 기본값 `{}`. */
  columnSizing: ColumnSizingState;
  /** 컬럼 표시 state (TanStack `VisibilityState`). 기본값 `{}`. */
  columnVisibility: VisibilityState;

  // ─── 8 setter (TanStack OnChangeFn<T> — C-4 strict) ───
  /** 정렬 setter — TanStack `OnChangeFn<SortingState>` (T 또는 updater 함수). */
  setSorting: OnChangeFn<SortingState>;
  /** 컬럼 필터 setter. */
  setColumnFilters: OnChangeFn<ColumnFiltersState>;
  /** 행 선택 setter. */
  setRowSelection: OnChangeFn<RowSelectionState>;
  /** 페이지네이션 setter. */
  setPagination: OnChangeFn<PaginationState>;
  /** 컬럼 핀 setter. */
  setColumnPinning: OnChangeFn<ColumnPinningState>;
  /** 컬럼 순서 setter. */
  setColumnOrder: OnChangeFn<ColumnOrderState>;
  /** 컬럼 너비 setter. */
  setColumnSizing: OnChangeFn<ColumnSizingState>;
  /** 컬럼 표시 setter. */
  setColumnVisibility: OnChangeFn<VisibilityState>;

  // ─── G-004: reset helpers (AC-001, AC-002) ───

  /**
   * 모든 state를 `initialState`로 복원 (G-004 AC-001).
   *
   * - uncontrolled 모드: `initialState` 제공 시 해당 키 값으로, 미제공 시 각 키의 기본값으로 복원
   *   (`sorting: []`, `columnFilters: []`, `rowSelection: {}`,
   *    `pagination: { pageIndex: 0, pageSize: 10 }`,
   *    `columnPinning: {}`, `columnOrder: []`, `columnSizing: {}`, `columnVisibility: {}`)
   * - controlled 모드 키: setter 가 `onChange` 만 호출 → 외부 핸들러가 controlled state 갱신 책임
   *   (`useControllableState` D5 — `isControlled` 분기에서 내부 setInternalValue 호출 안 함)
   *
   * `initialState` 는 mount 시 1회 캡처 (`useRef`, D6) — 이후 prop 변경 무시.
   *
   * @see G-004-spec.md Section 2.1 + Section 6 EC-05
   */
  resetState: () => void;

  /**
   * 특정 state 키(들)를 `initialState`로 복원 (G-004 AC-002).
   *
   * @param key - 단일 키 또는 키 배열. 중복 key 는 `Set` dedup 으로 1회만 reset (EC-03 멱등).
   *
   * @example
   * ```ts
   * resetSection('columnFilters');                       // 단일
   * resetSection(['columnFilters', 'sorting']);          // 다중
   * resetSection(['pagination', 'pagination']);          // 중복 → 1회 reset (멱등)
   * ```
   *
   * @see G-004-spec.md Section 2.1 + Section 6 EC-02, EC-03
   */
  resetSection: (key: GridStateKey | GridStateKey[]) => void;
}

// ─── MOD-GRID-02 G-005: URL 동기화 옵션 ───

/**
 * `useUrlSync<TData>()` 옵션 (G-005, MOD-GRID-02).
 *
 * 모든 프로퍼티 optional — 미지정 시 각 기본값 적용.
 *
 * @typeParam TData - 행 데이터 타입 (default `unknown`).
 *
 * @example
 * ```tsx
 * useUrlSync(state, {
 *   keys: ['sorting', 'columnFilters'],
 *   debounceMs: 300,
 *   prefix: 'grid1',
 *   onHydrate: (partial) => { ... },
 * });
 * ```
 *
 * @see useUrlSync
 * @see G-005-spec.md Section 2.2, Section 5.3
 */
export interface UseUrlSyncOptions<TData = unknown> {
  /**
   * 동기화할 GridStateKey 목록 (미지정 시 전체 8개).
   *
   * @example `['sorting', 'columnFilters']` — 정렬 + 필터만 URL 반영
   */
  keys?: GridStateKey[];

  /**
   * URL 업데이트 debounce ms (기본 0 = 즉시).
   *
   * 0보다 크면 `useDebouncedCallback`으로 래핑 (G-003 재사용).
   */
  debounceMs?: number;

  /**
   * mount 시 URL search params → state 역방향 hydration 콜백 (AC-004).
   *
   * hook은 void 반환 — 호출부가 setter를 통해 state 갱신 책임.
   * non-stable 콜백 안전: 내부에서 `useRef`로 최신 값 보존 (C-32 option 2, D5).
   *
   * @param partial - URL에서 파싱 성공한 key만 포함한 Partial<GridStateValues<TData>>
   */
  onHydrate?: (partial: Partial<GridStateValues<TData>>) => void;

  /**
   * URL param 네임스페이스 prefix (기본 `''` = no prefix).
   *
   * 다중 그리드 공존 시 충돌 방지용. prefix 지정 시 `${prefix}_${key}` 형태로 param 생성.
   *
   * @example `'grid1'` → `?grid1_sorting=…&grid1_columnFilters=…`
   */
  prefix?: string;
}

// ─── MOD-GRID-02 G-006: localStorage/sessionStorage 영속화 ───

/**
 * `useStoragePersist` hook 옵션 (G-006, MOD-GRID-02).
 *
 * GridStateValues ↔ localStorage / sessionStorage 동기화 옵션.
 * - `storageKey` 필수, 나머지는 모두 optional.
 * - `onHydrate` 콜백은 non-stable 허용 (C-32 option 2 — useRef 보존).
 *
 * @see G-006-spec.md Section 8
 * @see useStoragePersist
 */
export interface UseStoragePersistOptions<TData = unknown> {
  /**
   * 필수: localStorage / sessionStorage 저장 키.
   * 앱 내 고유값 권장 (예: `'my-grid-v1'`).
   */
  storageKey: string;

  /**
   * 저장 포맷 버전 (default: `1`).
   * 불일치 시 기존 저장 데이터 무시 + removeItem.
   * 컬럼 구조 변경 등으로 저장 스키마 변경 시 값을 올림.
   */
  version?: number;

  /**
   * 사용할 Storage 타입 (default: `'local'`).
   * - `'local'` → `localStorage`
   * - `'session'` → `sessionStorage`
   */
  storage?: 'local' | 'session';

  /**
   * save debounce 지연 ms (default: `300`).
   * `0` 이하 = 즉시 저장 (debounce 없음).
   */
  debounceMs?: number;

  /**
   * mount 시 storage → state hydration 콜백.
   * parse 성공 + version 일치 시에만 호출.
   * non-stable 허용 (내부에서 `useRef`로 최신 값 보존 — C-32 option 2, D5).
   *
   * @param partial - storage에서 파싱 성공한 key만 포함한 Partial<GridStateValues<TData>>
   */
  onHydrate?: (partial: Partial<GridStateValues<TData>>) => void;
}

// ─── MOD-GRID-04 G-003: 컬럼 가시성 + 순서 영속화 ───

/**
 * `useColumnPersistence` 가 영속화할 state 대상.
 *
 * - `'visibility'`: `VisibilityState` (컬럼 표시/숨김).
 * - `'order'`: `ColumnOrderState` (컬럼 순서).
 *
 * @see ColumnPersistenceOptions
 * @see G-003-spec.md Section 2 + D5
 */
export type PersistTarget = 'visibility' | 'order';

/**
 * 컬럼 가시성 + 순서 localStorage 영속화 옵션 (G-003).
 *
 * `<Grid columnPersistence={...} />` prop 에 전달.
 *
 * @example
 * ```tsx
 * // 가시성 + 순서 모두 저장 (기본)
 * <Grid columnPersistence={{ storageKey: 'user-grid-v1' }} />
 *
 * // 가시성만 저장
 * <Grid columnPersistence={{ storageKey: 'user-grid-v1', persist: ['visibility'] }} />
 *
 * // storageKey '' → no-op (NFR-006)
 * <Grid columnPersistence={{ storageKey: '' }} />
 * ```
 *
 * @see PersistTarget
 * @see useColumnPersistence
 * @see G-003-spec.md Section 2 + D1~D5
 */
export interface ColumnPersistenceOptions {
  /**
   * localStorage 키.
   * 빈 문자열(`''`) 시 localStorage 접근 없음 (no-op, EC-002, NFR-006).
   * 앱 내 고유값 권장 (예: `'hr-grid-v1'`).
   */
  storageKey: string;

  /**
   * 저장 포맷 버전 (default `1`).
   * 컬럼 구조 변경 시 값을 올려 이전 저장 항목을 무효화 (D5).
   * mismatch 시 기존 항목 삭제 + state 복원 skip.
   */
  version?: number;

  /**
   * 영속화할 state 대상 (default `['visibility', 'order']`).
   *
   * - `'visibility'`: 컬럼 표시/숨김 (`VisibilityState`).
   * - `'order'`: 컬럼 순서 (`ColumnOrderState`).
   *
   * @example `['visibility']` — 순서는 저장하지 않음 (TC-005).
   */
  persist?: PersistTarget[];
}
