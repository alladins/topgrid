/**
 * `<Grid>` — TanStack Table v8 위에 단일 API + `enable*` 토글 (sort/filter/selection/pagination/pinning).
 *
 * 8개 기존 Grid variant (BaseGrid/VirtualGrid/TreeGrid/ColumnPinGrid/...) 의 공통 패턴을 흡수.
 *
 * @remarks
 * - `forwardRef` + `useImperativeHandle` 지원: G-004 (이 Goal) 범위 — `GridHandle<TData>` ref 노출.
 * - virtualization wiring: G-004 범위 — `enableVirtualization` opt-in (D6) + single-table padding-row (D5).
 * - sticky pinning CSS / autoSelectFirstRow 등은 G-002/G-003 범위.
 *
 * @see G-001-spec.md Section 11.2 Step 4
 * @see G-004-spec.md Section 11.1 Step 4
 */

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type Ref,
} from 'react';
import {
  flexRender,
  useReactTable,
  type Header,
  type Row,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ExpandedState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';

import { useColumnDrag } from './internal/column-drag/useColumnDrag';
import { DropIndicator } from './internal/column-drag/DropIndicator';
import { SortClearButton } from './internal/multi-sort/SortClearButton';
import { buildTableOptions } from './internal/buildTableOptions';
import { buildFloatingRows } from './internal/buildFloatingRows';
import { computeColumnWindow, type ColumnWindow } from './internal/computeColumnWindow';
import { useColumnVirtualizer } from './internal/useColumnVirtualizer';
import {
  gridContainerAttrs,
  headerRowAttrs,
  columnHeaderAttrs,
  dataRowAttrs,
  gridCellAttrs,
  dataRowAriaIndex,
  visualColumnOrder,
  buildAriaColIndex,
} from './internal/ariaAttrs';
import { nextCell, isNavKey, type CellPos } from './internal/cellNavigation';
import { computeRowClickSelection } from './internal/rowClickSelection';
import { resolveLocale, resolveIcons } from './internal/i18n';
import { themeToVars } from './internal/theme';
import { getPinnedCellStyle } from './internal/computePinnedOffset';
import { EmptyState } from './internal/EmptyState';
import { ResizeHandle } from './internal/ResizeHandle';
import { SkeletonRows } from './internal/Skeleton';
import { SortBadge } from './internal/SortBadge';
import { useAutoSelectFirstRow } from './internal/useAutoSelectFirstRow';
import { useGridImperativeHandle } from './internal/useGridImperativeHandle';
import { useGridVirtualizer } from './internal/useGridVirtualizer';
import { ColumnVisibilityMenu } from './column/ColumnVisibilityMenu';
import { useColumnPersistence } from './column/useColumnPersistence';
import { GridPagination } from './pagination/GridPagination';
import type { GridHandle, GridProps } from './types';

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_VIRTUAL_SCROLL_HEIGHT = 400; // G-004 D7

// Node `process` global 의 minimal local declare — `@types/node` 미설치 환경에서
// dev mode 가드 시 사용 (C-4 준수). `useGridImperativeHandle.ts` 와 2회 중복 —
// single occurrence pattern 으로 헬퍼 promotion 보류 (decisions.md L207 "1=anecdote" 룰).
declare const process: { env: { NODE_ENV?: string } } | undefined;

/**
 * 통합 Grid 컴포넌트 (forwardRef + GridHandle ref API — G-004 D4).
 *
 * @typeParam TData - 행 데이터 타입.
 * @param props - GridProps. 자세한 prop 정의는 {@link GridProps} 참고.
 * @param ref - `GridHandle<TData>` ref. 미전달 시 imperative API skip (forwardRef 표준).
 * @returns 표 컴포넌트.
 *
 * @see G-004-spec.md Section 2.3 + D4
 */
function GridInner<TData>(
  props: GridProps<TData>,
  ref: Ref<GridHandle<TData>>,
): JSX.Element {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: props.pagination?.pageSize ?? DEFAULT_PAGE_SIZE,
  });
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    props.defaultColumnPinning ?? { left: [], right: [] },
  );
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(
    props.defaultColumnSizing ?? {},
  );
  // G-005 D5: TreeGrid alias `expandAll={true}` 호환 — `defaultExpanded` prop 으로 초기값 seed.
  // `boolean` true 는 TanStack `ExpandedState` 의 valid 값 ('전체 펼침'). false / undefined → `{}`.
  const initialExpanded: ExpandedState =
    props.defaultExpanded === true
      ? true
      : typeof props.defaultExpanded === 'object'
        ? props.defaultExpanded
        : {};
  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded);

  // G-003 (MOD-GRID-04): 컬럼 가시성 + 순서 state (useColumnPersistence 가 덮어씀).
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);

  const { options, effectiveColumns, selectionMode } = buildTableOptions(props, {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    rowSelection,
    setRowSelection,
    pagination,
    setPagination,
    columnPinning,
    setColumnPinning,
    columnSizing,
    setColumnSizing,
    expanded,
    setExpanded,
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
  });

  const table = useReactTable<TData>({
    ...options,
    data: props.data,
    columns: effectiveColumns,
  });

  // G-003 (MOD-GRID-04): 컬럼 가시성 + 순서 영속화 — Rules of Hooks: 항상 호출 (조건부 금지).
  // spec Section 8.4: storageKey='' 시 no-op (EC-002). columnPersistence 미제공 시 fallback.
  useColumnPersistence(table, props.columnPersistence ?? { storageKey: '' });

  // G-003 D9: 데이터 로드 후 첫 행 자동 선택 (selectionMode='none' 시 no-op).
  useAutoSelectFirstRow<TData>(
    table,
    props.autoSelectFirstRow === true,
    props.data.length,
    selectionMode,
  );

  // G-004 D5: scroll container ref — virtualization 활성 시 useVirtualizer 의 getScrollElement
  // 대상이자, virtualization 비활성 시 ref.scrollTo() DOM fallback 의 querySelector 시작점.
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // G-004 D5/D8: useGridVirtualizer (enabled=props.enableVirtualization).
  const virtualizer = useGridVirtualizer<TData>(
    table,
    scrollContainerRef,
    props.enableVirtualization === true,
    props.virtualizerOptions,
  );

  // G-004 D3/D4/D9/D11/D12 + G-007 D2: useGridImperativeHandle — ref 노출 (ref null 시 React 표준 skip).
  useGridImperativeHandle<TData>(ref, table, virtualizer, scrollContainerRef, {
    onAddRow: props.onAddRow,
    onDeleteRow: props.onDeleteRow,
    onUpdateRow: props.onUpdateRow,
    onStartEditing: props.onStartEditing,
    dataLength: props.data.length,
  });

  // G-001 (MOD-GRID-07): 컬럼 드래그 재정렬 — HTML5 DnD (C-20, AC-001~AC-006).
  // G-002 (MOD-GRID-07): localStorage 영속화 + 키보드 단축키 (AC-001~AC-004).
  // C-29 exactOptionalPropertyTypes: optional props 조건부 spread.
  const { getDragProps, dragOverId, getKeyDownHandler } = useColumnDrag<TData>({
    table,
    enabled: props.enableColumnReorder === true,
    ...(props.onColumnOrderChange !== undefined
      ? { onColumnOrderChange: props.onColumnOrderChange }
      : {}),
    ...(props.persistColumnOrder !== undefined
      ? { persistColumnOrder: props.persistColumnOrder }
      : {}),
    ...(props.columnOrderStorageKey !== undefined
      ? { columnOrderStorageKey: props.columnOrderStorageKey }
      : {}),
  });

  // G-004 D7: virtualScrollHeight 미지정 + virtualization 활성 시 dev mode warn 1회 (mount 직후).
  useEffect(() => {
    if (
      props.enableVirtualization === true &&
      props.virtualScrollHeight === undefined &&
      typeof process !== 'undefined' &&
      process?.env?.NODE_ENV !== 'production'
    ) {
      console.warn(
        `[topgrid/grid-core] enableVirtualization=true but virtualScrollHeight not provided. Using default ${DEFAULT_VIRTUAL_SCROLL_HEIGHT}px.`,
      );
    }
    // mount 시 1회 (deps 의도적 비움) — virtualization 토글 빈도 낮음.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // MOD-GRID-08 D5/EC-005: enableMultiSort=true + enableSort=false 조합 경고 (dev mode, mount 1회).
  useEffect(() => {
    if (
      props.enableMultiSort === true &&
      props.enableSort !== true &&
      typeof process !== 'undefined' &&
      process?.env?.NODE_ENV !== 'production'
    ) {
      console.warn(
        '[topgrid/grid-core] enableMultiSort=true has no effect when enableSort is not true. Add enableSort to the Grid.',
      );
    }
    // mount 시 1회. eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // D7: mode='client'|'server'도 pagination UI 표시 (TanStack gate L103과 일관성)
  const showPagination =
    props.enablePagination === true ||
    props.pagination?.mode === 'client' ||
    props.pagination?.mode === 'server';
  const rowClickSelects = props.enableRowClickSelection === true && selectionMode !== 'none';
  const isClickable = Boolean(props.onRowClick || props.onRowDoubleClick || rowClickSelects);

  // MOD-GRID-35 G-1: row-click selection. Drives the existing RowSelectionState (one source with
  // the checkbox selection + status bar), gated behind `enableRowClickSelection`, and fires the
  // consumer's `onRowClick` independently. The anchor (last plain/ctrl click) is consumed by
  // shift-range in G-2. Checkbox-cell clicks stopPropagation, so they never reach here.
  const selectionAnchorRef = useRef<string | null>(null);
  const handleRowClick = (row: Row<TData>, event: ReactMouseEvent<HTMLTableRowElement>): void => {
    if (rowClickSelects) {
      const { selection, anchorId } = computeRowClickSelection({
        current: table.getState().rowSelection,
        clickedId: row.id,
        ctrl: event.ctrlKey || event.metaKey,
        mode: selectionMode === 'single' ? 'single' : 'multi',
      });
      table.setRowSelection(selection);
      selectionAnchorRef.current = anchorId;
    }
    props.onRowClick?.(row.original, event);
  };

  // G-002: sticky pinning + resize 활성 여부 + table className 분기 (D2/D10).
  const usePinning = props.enableColumnPinning === true;
  const useResizing = props.enableColumnResizing === true;
  const resizeMode = props.columnResizeMode ?? 'onChange';
  // D2: position: sticky × border-collapse 비호환 → enableColumnPinning=true 시 border-separate 강제.
  const tableClassName = usePinning
    ? 'min-w-full text-sm border-separate border-spacing-0'
    : 'min-w-full divide-y divide-gray-200 text-sm';
  // border-separate 환경에서는 divide-y 가 동작하지 않음 → tbody/td 에 명시적 border 적용.
  // MOD-GRID-29 G-2: body bg + cell text → var on tbody (divider class stays). cellText is set here
  // as INHERITED color (weakest cascade) — NOT inline per-td — so a consumer cellClassName text
  // color (MOD-24 conditional formatting) still wins. Fallbacks = white / gray-700.
  const tbodyClassName = usePinning ? '' : 'divide-y divide-gray-100';
  const bodyBgStyle: CSSProperties = {
    backgroundColor: 'var(--topgrid-body-bg, #ffffff)',
    color: 'var(--topgrid-cell-text, #374151)',
  };
  const rowBorderClassName = usePinning ? 'border-b border-gray-100' : '';

  // G-004 D5/D7: virtualization 활성 여부 + outer wrapper height/style 분기.
  const isVirtual = props.enableVirtualization === true && virtualizer !== null;
  const virtualItems = isVirtual ? virtualizer!.getVirtualItems() : [];
  const totalSize = isVirtual ? virtualizer!.getTotalSize() : 0;
  const paddingTop =
    virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0;
  // D7: virtualization 활성 시 scroll container 높이 = props.virtualScrollHeight ?? 400.
  // (인라인 style 동적 값 — C-5 허용. 비활성 시 빈 객체.)
  // MOD-GRID-29 G-2: container border → var (color inline, `border` width class stays).
  const containerStyle: CSSProperties = isVirtual
    ? {
        height: props.virtualScrollHeight ?? DEFAULT_VIRTUAL_SCROLL_HEIGHT,
        overflow: 'auto',
        borderColor: 'var(--topgrid-border, #e5e7eb)',
      }
    : { borderColor: 'var(--topgrid-border, #e5e7eb)' };
  const containerClassName = isVirtual
    ? 'rounded-lg border'
    : 'overflow-x-auto rounded-lg border';
  const leafColCount = table.getAllLeafColumns().length;

  // MOD-GRID-24 G-2 (thead-collision fix): sticky thead 높이를 측정해 상단 floating 행의
  // sticky top offset 으로 사용 → 상단 floating 행이 헤더 위에 겹치지 않고 그 아래 고정된다.
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const [theadHeight, setTheadHeight] = useState(0);
  useEffect(() => {
    const h = theadRef.current?.offsetHeight ?? 0;
    setTheadHeight((prev) => (prev === h ? prev : h));
  });

  // MOD-GRID-27 G-2 (Commit A): 컬럼 윈도우 — 본문/floating 셀 렌더를 단일 메커니즘으로 라우팅.
  // 본 커밋은 **full window**(전 visible 컬럼, padding 0) → 출력 byte-identical. Commit B 에서
  // enableColumnVirtualization 시 windowCenter+pad 로 전환. 핀 컬럼은 항상 렌더(불변식).
  const visibleLeaf = table.getVisibleLeafColumns();
  const leafColumnIds = visibleLeaf.map((c) => c.id);
  const pinnedLeftIds = visibleLeaf
    .filter((c) => c.getIsPinned() === 'left')
    .map((c) => c.id);
  const pinnedRightIds = visibleLeaf
    .filter((c) => c.getIsPinned() === 'right')
    .map((c) => c.id);
  const columnWidths: Record<string, number> = {};
  for (const c of visibleLeaf) columnWidths[c.id] = c.getSize();
  // Commit C: 컬럼 가상화 시 테이블을 전체 컬럼 폭으로 고정 → 컬럼이 getSize 너비를 그대로
  // 가지며(table-layout:fixed) pad spacer 가 실제 스크롤 폭을 만든다. 미설정 시 auto 레이아웃이
  // 컬럼을 컨테이너 폭으로 압축 → 윈도/pad px 계산과 어긋남(chromium 실증).
  const totalColumnWidth = visibleLeaf.reduce((sum, c) => sum + c.getSize(), 0);
  const centerColumns = visibleLeaf.filter((c) => c.getIsPinned() === false);
  const centerSizes = centerColumns.map((c) => c.getSize());
  const fullWindowArgs = {
    leafColumnIds,
    columnWidths,
    pinnedLeftIds,
    pinnedRightIds,
    centerStartIndex: 0,
    centerEndIndex: centerColumns.length - 1,
  };

  // MOD-GRID-27 G-2: 컬럼(가로) 가상화. flat 헤더 전용(그룹 헤더면 자동 비활성). 핀 컬럼은
  // center 가상화 집합에서 제외 → 항상 렌더(불변식). hook 은 rules-of-hooks 위해 항상 호출.
  const isFlatHeader = table.getHeaderGroups().length <= 1;
  const columnVirtEnabled =
    props.enableColumnVirtualization === true && isFlatHeader;
  const columnVirtualizer = useColumnVirtualizer(
    centerSizes,
    scrollContainerRef,
    columnVirtEnabled,
  );
  let columnWindow: ColumnWindow = computeColumnWindow(fullWindowArgs);
  if (columnVirtEnabled && columnVirtualizer) {
    const items = columnVirtualizer.getVirtualItems();
    if (items.length > 0) {
      columnWindow = computeColumnWindow({
        ...fullWindowArgs,
        centerStartIndex: items[0].index,
        centerEndIndex: items[items.length - 1].index,
      });
    }
  }

  // MOD-GRID-28 G-1: WAI-ARIA grid 의미론(default-on). 절대 인덱스 = 척추 — 가상화 windowed 행/열도
  // DOM 위치가 아닌 절대 aria-rowindex/colindex 를 보고한다. visualOrder = [핀좌, center, 핀우] 전체.
  // MOD-GRID-30 G-1: floating 필터 행은 추가 header 행으로 카운트 → aria-rowcount +1, 데이터
  // aria-rowindex 도 dataRowAriaIndex(headerRowCount,…) 경유 +1 로 일관 shift(척추 유지). axe 검증.
  const floatingFilterEnabled = props.renderFloatingFilter !== undefined;
  const headerGroupCount = table.getHeaderGroups().length;
  const headerRowCount = headerGroupCount + (floatingFilterEnabled ? 1 : 0);
  const dataRowCount = table.getRowModel().rows.length;
  const ariaSelectable = selectionMode !== 'none';
  const visualOrder = visualColumnOrder(
    pinnedLeftIds,
    centerColumns.map((c) => c.id),
    pinnedRightIds,
  );
  const ariaColIndexOf = buildAriaColIndex(visualOrder);

  // MOD-GRID-28 G-2: 키보드 네비게이션 — aria-activedescendant 모델(roving tabindex 아님). 가상화 시
  // active 셀이 스크롤로 unmount 돼도 focus 는 안정 컨테이너(table tabIndex=0)에 유지된다(focus→body
  // 붕괴 회피). active 셀은 **절대 좌표**(row/col)로 주소화 → windowing 생존. id = TanStack cell.id.
  const gridId = useId();
  const [activeCell, setActiveCell] = useState<CellPos | null>(null);
  // active 셀 DOM id = `${gridId}-${cell.id}` (TanStack cell.id=rowId_colId; gridId 접두로 다중 그리드
  // 충돌 회피). 좌표→id 는 행모델·visualOrder 조회로 산출(absRowIndex 스레딩 불필요).
  const cellDomId = (cellId: string): string => `${gridId}-${cellId}`;
  const activeCellId =
    activeCell !== null
      ? cellDomId(
          `${table.getRowModel().rows[activeCell.row]?.id ?? ''}_${visualOrder[activeCell.col] ?? ''}`,
        )
      : undefined;
  const handleGridKeyDown = (e: ReactKeyboardEvent<HTMLTableElement>): void => {
    if (!isNavKey(e.key)) return;
    const cur = activeCell ?? { row: 0, col: 0 };
    const next = nextCell(
      cur,
      e.key,
      { ctrl: e.ctrlKey || e.metaKey, shift: e.shiftKey },
      { rowCount: dataRowCount, colCount: visualOrder.length, pageSize: Math.max(1, virtualItems.length || 10) },
    );
    if (next) {
      e.preventDefault();
      setActiveCell(next);
    }
  };
  // active 셀이 가상 윈도 밖이면 scroll-into-view → 그 다음 cell 이 mount 되며 activedescendant 가 유효.
  useEffect(() => {
    if (activeCell === null) return;
    if (virtualizer !== null) virtualizer.scrollToIndex(activeCell.row, { align: 'auto' });
    if (typeof document !== 'undefined' && activeCellId) {
      document.getElementById(activeCellId)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCell]);

  // MOD-GRID-28 G-3: 스크린리더 live 알림. live 리전은 **항상 present + 빈 채로** mount(조건부 렌더
  // 금지)하고 텍스트만 갱신해야 SR 이 알린다. 리전은 <table role=grid> **밖**(outer wrapper)에 둔다
  // (grid 자식이면 aria-required-children 위반). 초기 렌더는 skip(마운트 시 알림 방지). **셀 이동은
  // 알리지 않는다**(aria-activedescendant 가 이미 SR 발화 — 이중발화 회피). 정렬/선택만 알린다.
  // MOD-GRID-29 G-1: i18n — chrome 문자열/아이콘은 기본(한국어) 위 부분 override. 미지정 키는 fallback.
  const locale = resolveLocale(props.localeText);
  const gridIcons = resolveIcons(props.icons);
  // MOD-GRID-29 G-2: theme — overridden colors become inline --topgrid-* vars on the grid root;
  // chrome surfaces read them via var(--topgrid-x, <default hex>). No theme → {} → default-on.
  // React CSSProperties doesn't type custom (`--*`) keys → cast at the application site.
  const themeVars = themeToVars(props.theme);
  // MOD-GRID-29 G-2: HC-safe selection (closes the MOD-28 HC gap). `bg-blue-50` flattens under
  // forced-colors → a sighted high-contrast user loses the selected-row cue (aria-selected covers
  // only the SR path). An inline OUTLINE survives: the UA remaps outline-color to a system color in
  // forced-colors (unlike background), and outline doesn't shift layout. Inline because Tailwind
  // outline-* classes are inert in the Tailwind-less storybook (P27-1). The bg-blue-50 fill stays as
  // the normal-mode (Tailwind consumer) enhancement; the outline is the universal indicator.
  const selectionOutlineStyle: CSSProperties = {
    outline: '2px solid #2563eb',
    outlineOffset: '-2px',
  };
  const [announcement, setAnnouncement] = useState('');
  // MOD-GRID-33 G-3: row reorder 드래그 state. 정렬/필터 활성 시 비활성(표시순≠data순=재배열 모호,
  // advisor vN) + 비-가상화 전용(가상화 합성=vN). ★onRowReorder 는 **data 인덱스(row.index)**를 넘긴다 —
  // rowPos(현재 페이지 슬라이스 인덱스)를 넘기면 페이지네이션 시 잘못된 행이 재배열된다(advisor). dropRowPos
  // 는 시각 인디케이터(현재 페이지 내 위치)용.
  const [dragDataIndex, setDragDataIndex] = useState<number | null>(null);
  const [dropRowPos, setDropRowPos] = useState<number | null>(null);
  const sortAnnouncedOnce = useRef(false);
  const selectAnnouncedOnce = useRef(false);
  useEffect(() => {
    if (!sortAnnouncedOnce.current) { sortAnnouncedOnce.current = true; return; }
    setAnnouncement(
      locale.sortMessage(sorting, (id) => {
        const h = table.getColumn(id)?.columnDef.header;
        return typeof h === 'string' ? h : id;
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);
  useEffect(() => {
    if (!selectAnnouncedOnce.current) { selectAnnouncedOnce.current = true; return; }
    setAnnouncement(locale.selectionMessage(Object.keys(rowSelection).length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  // 한 행의 `<td>` 목록을 컬럼 윈도우 순서로 렌더(per-row Map 으로 O(n) 조회 — n² 회피).
  // pad spacer 는 윈도우 px>0 일 때만(full window 에선 0 → 미방출 = byte-identical).
  // opts: 본문 행 = handlers+cellClassName / floating 행 = 둘 다 없음(기존 마크업 보존).
  const renderWindowedCells = (
    row: Row<TData>,
    window: ColumnWindow,
    opts: { withHandlers: boolean; withCellClassName: boolean },
  ): ReactElement[] => {
    const cellMap = new Map(
      row.getVisibleCells().map((c) => [c.column.id, c] as const),
    );
    const renderCell = (id: string): ReactElement | null => {
      const cell = cellMap.get(id);
      if (!cell) return null;
      const cellSize = cell.column.getSize();
      // Commit C: 컬럼 가상화 시 width 항상 방출(table-layout:fixed 가 pad/윈도 px 와 일치하려면
      // 모든 셀이 명시 너비를 가져야 함 — 핀/리사이즈 없는 default-150 그리드 대비).
      const applyCellWidth =
        useResizing || usePinning || columnVirtEnabled || cellSize !== 150;
      const pinnedCell = usePinning
        ? getPinnedCellStyle(cell.column, table, 'tbody')
        : { style: {}, className: '' };
      const cellStyle: CSSProperties = { ...pinnedCell.style };
      if (applyCellWidth) cellStyle.width = cellSize;
      // MOD-GRID-28 G-2: active 셀(키보드 nav 대상) = 시각 링. floating 행(withHandlers=false)은 비대상.
      const isActiveCell = opts.withHandlers && cellDomId(cell.id) === activeCellId;
      const activeClass = isActiveCell ? 'outline outline-2 outline-blue-500 -outline-offset-2' : '';
      const className = opts.withCellClassName
        ? `px-4 py-3 whitespace-nowrap ${pinnedCell.className} ${activeClass} ${props.cellClassName?.(cell) ?? ''}`
        : `px-4 py-3 whitespace-nowrap ${pinnedCell.className}`;
      return (
        <td
          key={cell.id}
          {...(opts.withHandlers ? { id: cellDomId(cell.id) } : {})}
          {...gridCellAttrs(ariaColIndexOf(cell.column.id))}
          className={className}
          style={cellStyle}
          {...(opts.withHandlers
            ? {
                onClick: (event: ReactMouseEvent<HTMLTableCellElement>) =>
                  props.onCellClick?.(cell, row.original, event),
                onKeyDown: (event: ReactKeyboardEvent<HTMLTableCellElement>) =>
                  props.onCellKeyDown?.(cell, row.original, event),
              }
            : {})}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      );
    };
    // [pinnedLeft][leftPad][windowCenter][rightPad][pinnedRight] — pad 는 핀 사이에 위치.
    const nodes: ReactElement[] = [];
    for (const id of window.pinnedLeftIds) {
      const n = renderCell(id);
      if (n) nodes.push(n);
    }
    if (window.leftPadPx > 0) {
      nodes.push(
        <td key="__cv_left" aria-hidden="true" style={{ width: window.leftPadPx }} />,
      );
    }
    for (const id of window.windowCenterIds) {
      const n = renderCell(id);
      if (n) nodes.push(n);
    }
    if (window.rightPadPx > 0) {
      nodes.push(
        <td key="__cv_right" aria-hidden="true" style={{ width: window.rightPadPx }} />,
      );
    }
    for (const id of window.pinnedRightIds) {
      const n = renderCell(id);
      if (n) nodes.push(n);
    }
    return nodes;
  };

  // MOD-GRID-24 G-2: floating(고정) 행 — 소비자 공급 추가 행을 실제 Row 로 변환(셀은
  // columnDef.cell 렌더러 통과). 미제공 시 빈 배열 → 렌더 0(기존 동작 불변).
  const floatingTopRows = buildFloatingRows(table, props.floatingTopRows, 'top');
  const floatingBottomRows = buildFloatingRows(
    table,
    props.floatingBottomRows,
    'bottom',
  );
  // 본문 행과 동일한 셀 마크업으로 floating 행 1개를 렌더(sticky 고정).
  // position: sticky 의 스크롤 고정 시각거동은 chromium 검증됨(MOD-24 G-2 / tests/visual).
  const renderFloatingRow = (row: Row<TData>, position: 'top' | 'bottom') => {
    const stickyStyle: CSSProperties =
      position === 'top'
        ? { position: 'sticky', top: theadHeight, zIndex: 11 }
        : { position: 'sticky', bottom: 0, zIndex: 11 };
    return (
      // MOD-GRID-28: floating(요약) 행은 데이터 시퀀스 밖이라 role="row" 만(aria-rowindex 미부여).
      <tr
        key={row.id}
        role="row"
        data-floating={position}
        className={`font-medium ${rowBorderClassName}`}
        style={{ ...stickyStyle, backgroundColor: 'var(--topgrid-header-bg, #f9fafb)' }}
      >
        {renderWindowedCells(row, columnWindow, {
          withHandlers: false,
          withCellClassName: false,
        })}
      </tr>
    );
  };

  // MOD-GRID-27 G-2 (Commit C): 단일 `<th>` 렌더를 클로저로 추출 — flat 헤더 윈도잉이
  // 본문 `renderWindowedCells` 와 동일 메커니즘으로 헤더 셀을 세그먼트 순서대로 방출하기 위함.
  // 추출은 **verbatim**(OFF 경로 = `headers.map(renderHeaderCell)` → byte-identical 보존).
  const renderHeaderCell = (header: Header<TData, unknown>): ReactElement => {
    const canSort = header.column.getCanSort();
    const sorted = header.column.getIsSorted();
    const sortGlyph = sorted === 'asc' ? gridIcons.sortAscending : sorted === 'desc' ? gridIcons.sortDescending : gridIcons.sortNone;
    // MOD-GRID-08: multi-sort badge index (0-based; -1 = not sorted).
    const sortIndex = header.column.getSortIndex();
    // D10: enableColumnResizing 또는 enableColumnPinning 시 항상 width 적용 (default 150 가드 제거).
    const size = header.getSize();
    // Commit C: 컬럼 가상화 시 헤더도 width 항상 방출(body applyCellWidth 와 동형).
    const applyWidth =
      useResizing || usePinning || columnVirtEnabled || size !== 150;
    // D3: pinned 헤더 셀 sticky style + z-30 (thead × pinned intersection).
    const pinned = usePinning
      ? getPinnedCellStyle(header.column, table, 'thead')
      : { style: {}, className: '' };
    // exactOptionalPropertyTypes — width 만 조건부로 추가.
    const combinedStyle: CSSProperties = { ...pinned.style };
    if (applyWidth) combinedStyle.width = size;
    // G-001 (MOD-GRID-07): 컬럼 드래그 재정렬 props (AC-001~AC-004).
    // isPinned: column.getIsPinned() !== false → draggable=false + drop 무시 (AC-004).
    const isPinned = header.column.getIsPinned() !== false;
    const dragProps = getDragProps(header.column.id, isPinned);
    // G-002 (MOD-GRID-07): keyboard handler per-header (AC-003, D8 focus-scoped).
    const keyDownHandler = getKeyDownHandler(header.column.id, isPinned);

    // MOD-GRID-08 AC-002/AC-004: multi-sort aware click handler.
    // enableMultiSort=false (기본) 시 기존 단일 정렬 경로 100% 보존 (C-6).
    const isMulti = props.enableMultiSort === true;
    const handleHeaderClick = canSort
      ? (e: ReactMouseEvent) => {
          if (isMulti && (e.ctrlKey || e.metaKey)) {
            // AC-004 / D4: Ctrl/Cmd+Click → 해당 컬럼 정렬 제거 (EC-003 Mac 지원).
            table.setSorting((prev) =>
              prev.filter((s) => s.id !== header.column.id),
            );
          } else if (isMulti && e.shiftKey) {
            // AC-002: Shift+Click → 기존 정렬 유지하며 컬럼 추가 정렬.
            // EC-004: Shift+Ctrl 동시 시 ctrlKey 먼저 체크하므로 여기 미도달.
            header.column.toggleSorting(undefined, true);
          } else {
            // 기존 단일 정렬 경로 (enableMultiSort=false 또는 plain click).
            header.column.getToggleSortingHandler()?.(e);
          }
        }
      : undefined;
    return (
      <th
        key={header.id}
        {...columnHeaderAttrs(ariaColIndexOf(header.column.id), canSort, sorted)}
        colSpan={header.colSpan}
        className={`relative px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap select-none ${
          canSort ? 'cursor-pointer hover:bg-gray-100' : ''
        } ${pinned.className}`}
        style={combinedStyle}
        onClick={handleHeaderClick}
        draggable={dragProps.draggable}
        onDragStart={(e) => dragProps.onDragStart(e.nativeEvent)}
        onDragOver={(e) => dragProps.onDragOver(e.nativeEvent)}
        onDragLeave={(e) => dragProps.onDragLeave(e.nativeEvent)}
        onDrop={(e) => dragProps.onDrop(e.nativeEvent)}
        onDragEnd={(e) => dragProps.onDragEnd(e.nativeEvent)}
        tabIndex={0}
        onKeyDown={(e) => {
          // MOD-GRID-28 G-2: Space/Enter 로 정렬 토글(기존엔 마우스 클릭만). 그 외는 컬럼드래그 핸들러.
          if ((e.key === ' ' || e.key === 'Enter') && canSort) {
            e.preventDefault();
            header.column.toggleSorting(undefined, isMulti && e.shiftKey);
            return;
          }
          keyDownHandler(e.nativeEvent);
        }}
        aria-roledescription={props.enableColumnReorder === true ? 'draggable column' : undefined}
      >
        {/* G-001 (MOD-GRID-07): drop 위치 시각 인디케이터 (AC-003, C-5 Tailwind). */}
        <DropIndicator dragOverId={dragOverId} columnId={header.column.id} />
        <div className="flex items-center gap-1">
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
          {canSort && <span className="text-gray-400">{sortGlyph}</span>}
          {/* AC-003 / MOD-GRID-08: 다중 정렬 우선순위 배지 (1/2/3). */}
          {isMulti && canSort && <SortBadge sortIndex={sortIndex} />}
        </div>
        {useResizing && <ResizeHandle header={header} mode={resizeMode} />}
      </th>
    );
  };

  // MOD-GRID-27 G-2 (Commit C): flat 헤더 윈도잉 — 본문 `renderWindowedCells` 와 **동일 세그먼트
  // 순서**([pinnedLeft][leftPad][windowCenter][rightPad][pinnedRight])로 `<th>` 방출 → 헤더가
  // 바디와 같은 컬럼 집합·정렬·pad 폭을 갖는다. `columnVirtEnabled` 일 때만 사용(=flat 단일
  // 헤더그룹 보장). pad `<th>` = aria-hidden spacer. center 외 컬럼은 핀(sticky)이라 항상 렌더.
  const renderWindowedHeaderCells = (
    headers: Header<TData, unknown>[],
    window: ColumnWindow,
  ): ReactElement[] => {
    const headerMap = new Map(headers.map((hd) => [hd.column.id, hd] as const));
    const nodes: ReactElement[] = [];
    for (const id of window.pinnedLeftIds) {
      const hd = headerMap.get(id);
      if (hd) nodes.push(renderHeaderCell(hd));
    }
    if (window.leftPadPx > 0) {
      nodes.push(
        <th key="__cv_left_h" aria-hidden="true" style={{ width: window.leftPadPx }} />,
      );
    }
    for (const id of window.windowCenterIds) {
      const hd = headerMap.get(id);
      if (hd) nodes.push(renderHeaderCell(hd));
    }
    if (window.rightPadPx > 0) {
      nodes.push(
        <th key="__cv_right_h" aria-hidden="true" style={{ width: window.rightPadPx }} />,
      );
    }
    for (const id of window.pinnedRightIds) {
      const hd = headerMap.get(id);
      if (hd) nodes.push(renderHeaderCell(hd));
    }
    return nodes;
  };

  // MOD-GRID-30 G-1: floating 필터 셀 — leaf 컬럼당 always-visible 입력 셀(<th role=columnheader>).
  // 핀 sticky·width 는 헤더셀과 동형(같은 컬럼 정렬). 내용은 소비자 renderFloatingFilter(column) 주입
  // (grid-features floating 입력). null 반환 시 빈 셀(필터 없는 컬럼).
  const renderFloatingFilterCell = (header: Header<TData, unknown>): ReactElement => {
    const col = header.column;
    const size = header.getSize();
    const applyWidth = useResizing || usePinning || columnVirtEnabled || size !== 150;
    const pinned = usePinning
      ? getPinnedCellStyle(col, table, 'thead')
      : { style: {}, className: '' };
    const cellStyle: CSSProperties = { ...pinned.style };
    if (applyWidth) cellStyle.width = size;
    return (
      <th
        key={header.id}
        {...columnHeaderAttrs(ariaColIndexOf(col.id), false, false)}
        className={`px-2 py-1 align-top font-normal normal-case ${pinned.className}`}
        style={cellStyle}
      >
        {props.renderFloatingFilter!(col)}
      </th>
    );
  };

  // 컬럼 가상화 시 필터 셀도 본문/헤더와 **동일 윈도 세그먼트**로 방출(어긋남 방지).
  const renderWindowedFloatingFilterCells = (
    headers: Header<TData, unknown>[],
    window: ColumnWindow,
  ): ReactElement[] => {
    const headerMap = new Map(headers.map((hd) => [hd.column.id, hd] as const));
    const nodes: ReactElement[] = [];
    for (const id of window.pinnedLeftIds) {
      const hd = headerMap.get(id);
      if (hd) nodes.push(renderFloatingFilterCell(hd));
    }
    if (window.leftPadPx > 0) {
      nodes.push(
        <th key="__ff_left" aria-hidden="true" style={{ width: window.leftPadPx }} />,
      );
    }
    for (const id of window.windowCenterIds) {
      const hd = headerMap.get(id);
      if (hd) nodes.push(renderFloatingFilterCell(hd));
    }
    if (window.rightPadPx > 0) {
      nodes.push(
        <th key="__ff_right" aria-hidden="true" style={{ width: window.rightPadPx }} />,
      );
    }
    for (const id of window.pinnedRightIds) {
      const hd = headerMap.get(id);
      if (hd) nodes.push(renderFloatingFilterCell(hd));
    }
    return nodes;
  };

  // leaf 헤더행(가장 깊은 그룹) = 필터 셀의 컬럼 소스(그룹 placeholder 없는 실제 leaf 컬럼).
  const leafHeaderGroup = table.getHeaderGroups()[headerGroupCount - 1];
  const leafHeaders = leafHeaderGroup ? leafHeaderGroup.headers : [];

  // MOD-GRID-33 G-3: row reorder 활성 조건 — opt-in prop + 정렬/필터 비활성(표시순=data순 보장) + 비-가상화.
  const rowReorderActive =
    props.enableRowReorder === true &&
    !isVirtual &&
    table.getState().sorting.length === 0 &&
    table.getState().columnFilters.length === 0;
  // 데이터 행에 부여할 HTML5 drag props(rowReorderActive 시만). rowPos=시각 위치, dataIndex=row.index(data).
  // drop → onRowReorder(dragDataIndex, dataIndex) — **data 인덱스**로 콜백(페이지네이션 안전).
  const rowDragProps = (rowPos: number, dataIndex: number): Record<string, unknown> =>
    rowReorderActive
      ? {
          draggable: true,
          onDragStart: () => setDragDataIndex(dataIndex),
          onDragOver: (e: ReactDragEvent<HTMLTableRowElement>) => {
            e.preventDefault();
            setDropRowPos(rowPos);
          },
          onDrop: (e: ReactDragEvent<HTMLTableRowElement>) => {
            e.preventDefault();
            if (dragDataIndex !== null && dragDataIndex !== dataIndex) {
              props.onRowReorder?.(dragDataIndex, dataIndex);
            }
            setDragDataIndex(null);
            setDropRowPos(null);
          },
          onDragEnd: () => {
            setDragDataIndex(null);
            setDropRowPos(null);
          },
        }
      : {};
  // drop 인디케이터(상단 파란 선, layout shift 없는 inset box-shadow). 끌고 있는 행 자신엔 미표시.
  // ※ from<to(아래 드래그) 시 결과는 대상 행 *뒤*에 안착하나 인디케이터는 상단선(=대상 앞) — 시각/결과
  //   엣지 불일치(다수 그리드와 동형, 알려진 UX nuance). 방향별 엣지 계산은 후속.
  const rowDropStyle = (rowPos: number, dataIndex: number): CSSProperties =>
    rowReorderActive && dropRowPos === rowPos && dragDataIndex !== null && dragDataIndex !== dataIndex
      ? { boxShadow: 'inset 0 2px 0 0 #2563eb' }
      : {};

  return (
    <div
      className={`flex flex-col ${props.className ?? ''}`}
      style={themeVars as CSSProperties}
    >
      {/* MOD-GRID-28 G-3: SR live 리전 — 항상 present+빈 채로 mount, <table role=grid> 밖. 텍스트만 갱신. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      {props.columnPersistence !== undefined && (
        <div className="flex justify-end mb-1">
          <ColumnVisibilityMenu table={table} />
        </div>
      )}
      {props.showSortClearButton === true && props.enableMultiSort === true && (
        <div className="flex justify-end mb-1">
          <SortClearButton onClear={() => { table.setSorting([]); }} />
        </div>
      )}
      <div
        ref={scrollContainerRef}
        className={containerClassName}
        // MOD-GRID-33 G-2: 오버레이 활성 시 inline position:relative(storybook Tailwind-less 서 'relative'
        // 클래스 inert → 오버레이 absolute 가 컨테이너에 앵커되려면 inline 필수, P27-1).
        style={props.loadingOverlay === true ? { ...containerStyle, position: 'relative' } : containerStyle}
      >
        {/* Commit C: 컬럼 가상화 시 table-layout:fixed + 전체 컬럼 폭 → 컬럼이 getSize 너비를
            유지하고 pad 가 실제 스크롤 폭을 만든다. (가로 스크롤 컨테이너 자체는 기존
            overflow-x-auto 클래스/행가상화 inline overflow 가 제공 — P27 finding: Tailwind 미적용
            소비자는 컨테이너 overflow 직접 지정 필요.) C-29 conditional spread. */}
        <table
          {...gridContainerAttrs(headerRowCount, dataRowCount, leafColumnIds.length, selectionMode === 'multi')}
          tabIndex={0}
          onKeyDown={handleGridKeyDown}
          {...(props.loadingOverlay === true ? { 'aria-busy': true } : {})}
          {...(activeCellId ? { 'aria-activedescendant': activeCellId } : {})}
          className={`${tableClassName} focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-[-2px]`}
          {...(columnVirtEnabled
            ? { style: { tableLayout: 'fixed' as const, width: totalColumnWidth } }
            : {})}
        >
          {/* MOD-GRID-29 G-2 spike: header bg → var(--topgrid-header-bg, #f9fafb). Color moves to
              inline style (storybook is Tailwind-less → arbitrary class inert); positioning stays
              class-based. Fallback hex = the gray-50 it replaced → default-on byte-identical. */}
          <thead
            ref={theadRef}
            className="sticky top-0 z-10"
            style={{
              backgroundColor: 'var(--topgrid-header-bg, #f9fafb)',
              color: 'var(--topgrid-header-text, #6b7280)',
            }}
          >
            {table.getHeaderGroups().map((headerGroup, hgIndex) => (
              <tr key={headerGroup.id} {...headerRowAttrs(hgIndex + 1)}>
                {/* MOD-GRID-27 G-2: flat 헤더 윈도잉(ON) vs 전 헤더 렌더(OFF=byte-identical). */}
                {columnVirtEnabled
                  ? renderWindowedHeaderCells(headerGroup.headers, columnWindow)
                  : headerGroup.headers.map(renderHeaderCell)}
              </tr>
            ))}
            {/* MOD-GRID-30 G-1: floating 필터 행 — leaf 헤더행 아래 추가 header 행(aria-rowindex=
                headerGroupCount+1). 컬럼 가상화 시 동일 윈도 경로. */}
            {floatingFilterEnabled && (
              <tr {...headerRowAttrs(headerGroupCount + 1)}>
                {columnVirtEnabled
                  ? renderWindowedFloatingFilterCells(leafHeaders, columnWindow)
                  : leafHeaders.map(renderFloatingFilterCell)}
              </tr>
            )}
          </thead>
          <tbody className={tbodyClassName} style={bodyBgStyle}>
            {props.loading === true ? (
              /* G-003 D5: loading=true 시 tbody 영역만 SkeletonRows 치환 (thead 보존).
                 D8: count default = props.loadingRowCount ?? pagination.pageSize ?? 5. */
              <SkeletonRows
                count={props.loadingRowCount ?? pagination.pageSize ?? 5}
                table={table}
              />
            ) : table.getRowModel().rows.length === 0 ? (
              /* G-003 D6: G-001 inline empty markup → EmptyState 1라인 호출로 추출.
                 D7: slot → text → defaultText 우선순위.
                 D12: getAllColumns() → getAllLeafColumns() 정정 (현 group columns 부재 → 동일 결과,
                      MOD-GRID-14 multi-row header 도입 대비 leaf 정확 일치). */
              <EmptyState
                colSpan={table.getAllLeafColumns().length}
                slot={props.emptyState}
                text={props.emptyText}
                defaultText={locale.emptyText}
              />
            ) : isVirtual ? (
              /* G-004 D5: padding-row 패턴 (single-table + sticky/pinning 호환).
                 G-002 sticky thead + pinned column 는 같은 <table> 자식이라 모두 보존됨.
                 padding tr 은 aria-hidden + 빈 td 1개 (colSpan=leafColCount) — 시각 영향 0. */
              <>
                {floatingTopRows.map((r) => renderFloatingRow(r, 'top'))}
                {paddingTop > 0 && (
                  <tr style={{ height: paddingTop }} aria-hidden="true">
                    <td colSpan={leafColCount} />
                  </tr>
                )}
                {virtualItems.map((virtualRow) => {
                  const row = table.getRowModel().rows[virtualRow.index];
                  if (!row) return null;
                  // G-006 D2: rowClassName callback (undefined / '' 무효 → 빈 문자).
                  const extraRowClass = props.rowClassName?.(row) ?? '';
                  return (
                    <tr
                      key={row.id}
                      {...dataRowAttrs(dataRowAriaIndex(headerRowCount, virtualRow.index), ariaSelectable, row.getIsSelected())}
                      data-index={virtualRow.index}
                      ref={virtualizer!.measureElement}
                      {...(row.getIsSelected() ? { style: selectionOutlineStyle } : {})}
                      className={`transition-colors ${isClickable ? 'cursor-pointer' : ''} ${
                        row.getIsSelected()
                          ? 'bg-blue-50 hover:bg-blue-100'
                          : 'hover:bg-gray-50'
                      } ${rowBorderClassName} ${extraRowClass}`}
                      onClick={(event) => handleRowClick(row, event)}
                      onDoubleClick={(event) =>
                        props.onRowDoubleClick?.(row.original, event)
                      }
                    >
                      {renderWindowedCells(row, columnWindow, {
                        withHandlers: true,
                        withCellClassName: true,
                      })}
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr style={{ height: paddingBottom }} aria-hidden="true">
                    <td colSpan={leafColCount} />
                  </tr>
                )}
                {floatingBottomRows.map((r) => renderFloatingRow(r, 'bottom'))}
              </>
            ) : (
              <>
                {floatingTopRows.map((r) => renderFloatingRow(r, 'top'))}
                {table.getRowModel().rows.map((row, rowPos) => {
                // G-006 D2: rowClassName callback.
                const extraRowClass = props.rowClassName?.(row) ?? '';
                return (
                  <tr
                    key={row.id}
                    {...dataRowAttrs(dataRowAriaIndex(headerRowCount, rowPos), ariaSelectable, row.getIsSelected())}
                    data-index={row.index}
                    {...rowDragProps(rowPos, row.index)}
                    style={{ ...(row.getIsSelected() ? selectionOutlineStyle : {}), ...rowDropStyle(rowPos, row.index) }}
                    className={`transition-colors ${isClickable || rowReorderActive ? 'cursor-pointer' : ''} ${
                      row.getIsSelected() ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                    } ${rowBorderClassName} ${extraRowClass}`}
                    onClick={(event) => handleRowClick(row, event)}
                    onDoubleClick={(event) => props.onRowDoubleClick?.(row.original, event)}
                  >
                    {renderWindowedCells(row, columnWindow, {
                      withHandlers: true,
                      withCellClassName: true,
                    })}
                  </tr>
                );
              })}
                {floatingBottomRows.map((r) => renderFloatingRow(r, 'bottom'))}
              </>
            )}
          </tbody>
        </table>
        {/* MOD-GRID-33 G-2: loading 오버레이 — 기존 data 행 위에 덮는다(skeleton 치환과 달리 데이터 유지).
            pointer-events:all 로 하부 상호작용 차단(watermark 의 pointer-events-none 와 반대). aria-busy 는
            table(role=grid)에 부여(SR 신호). 스타일 inline(Tailwind class storybook inert). */}
        {props.loadingOverlay === true && (
          <div
            data-testid="loading-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.6)',
              pointerEvents: 'all',
              zIndex: 20,
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--topgrid-cell-text, #374151)' }}>
              로딩 중…
            </span>
          </div>
        )}
      </div>

      {showPagination && (
        // C-29: exactOptionalPropertyTypes=true — optional prop은 조건부 spread로 전달 (undefined literal 직접 할당 금지).
        <GridPagination
          table={table}
          rowsPerPageLabel={locale.rowsPerPage}
          navLabels={{ firstPage: locale.firstPage, prevPage: locale.prevPage, nextPage: locale.nextPage, lastPage: locale.lastPage }}
          {...(props.localeText?.totalCount !== undefined ? { totalCountFormat: props.localeText.totalCount } : {})}
          {...(props.pagination?.mode !== undefined ? { mode: props.pagination.mode } : {})}
          {...(props.pagination?.totalCount !== undefined ? { totalCount: props.pagination.totalCount } : {})}
          {...(props.pagination?.pageSizeOptions !== undefined ? { pageSizeOptions: props.pagination.pageSizeOptions } : {})}
          {...(props.pagination?.showTotalCount !== undefined ? { showTotalCount: props.pagination.showTotalCount } : {})}
        />
      )}
    </div>
  );
}

/**
 * 통합 Grid 컴포넌트 (G-004 D4: forwardRef + GridHandle ref API).
 *
 * `forwardRef` + generic 컴포넌트는 TS 표준 미지원 → cast 패턴
 * (ChangeTrackingGrid.tsx:215-217 검증된 패턴 차용).
 *
 * @typeParam TData - 행 데이터 타입.
 *
 * @see G-004-spec.md Section 2.3 + D4
 */
export const Grid = forwardRef(GridInner) as <TData>(
  props: GridProps<TData> & { ref?: Ref<GridHandle<TData>> },
) => ReactElement;
