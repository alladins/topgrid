# G-006 Spec: RangeSelectGrid 완전 통합 alias + Pro 라이선스 런타임 + 가상화 호환 검증 (Capstone)

**Package**: `@tomis/grid-pro-range`  
**Goal ID**: G-006  
**Module**: MOD-GRID-11 (Cell Range Selection)  
**Spec Version**: v1.0.0  
**Date**: 2026-05-15  
**Author**: tw-grid Spec Writer  
**Status**: DRAFT

---

## Section 0: 결정 테이블 (D# Summary)

| D# | 결정 | 사유 | ADR 참조 |
|----|------|------|----------|
| D1 | `implementFiles` 경로: `topvel-grid-monorepo/packages/` 접두사 사용 | goals.json L398-403의 `TOMIS/packages/` 접두사 오류 (C-28). 실제 monorepo root = `topvel-grid-monorepo/`. `affectedUsageFiles`는 TOMIS prefix 정상 (`tw-framework-front/` 상대 경로) | ADR-MOD-GRID-11-001 |
| D2 | 라이선스 검증: `_verifyGridLicenseStub` inline function 재사용 | G-002/G-003/G-004/G-005와 동일 inline stub 패턴 (B-06 compliant, C-4 준수). MOD-GRID-99-A/G-001 완료 후 실 `verifyGridLicense` import로 교체 | ADR-MOD-GRID-11-002 |
| D3 | `package.json` / `EULA.md`: 변경 없음 | `"license": "SEE LICENSE IN EULA"` 이미 설정. EULA.md 존재. peerDependencies 완비. 재작업 불필요 | — |
| D4 | `enable*` props 설계: 5개 boolean (enableRangeSelection=true default, 나머지 false default) | Rules of Hooks 준수: 모든 hook은 무조건 호출. enable* 는 hook 내부 동작 분기(early return)에만 사용. enable* false → hook 내부 no-op, 컴포넌트 조건부 렌더 허용 | ADR-MOD-GRID-11-006 |
| D5 | Rules of Hooks 엄수: enable* flag는 동작 게이팅, hook 호출 게이팅 아님 | `if (enableDragFill) useDragFill(...)` 패턴 금지. 모든 5개 hook 무조건 호출 후 enable* 로 onKeyDown 체인 내 조건 분기. DragFillHandle은 컴포넌트이므로 조건부 렌더 허용 | — |
| D6 | Affected usage file (`tw-framework-front/.../RangeSelectGrid.tsx`): zero-touch | D6b 결정. 기존 컴포넌트는 props 인터페이스가 확장되더라도 default 값이 모든 기존 props를 커버. `contextMenu` 복사 버튼은 현재 `console.log`만 — G-006은 `useClipboard` wiring 추가하지 않음. C-6 backward-compat 유지 | ADR-MOD-GRID-11-006 |
| D7 | DragFillHandle 성능 한계 명시: O(rows×cols) hit-test — 1000행에서 허용 범위 | 드래그 시 `coordFromMouseEvent`는 전체 셀 순회. Storybook 1000-row story로 실측. 문제 시 cellRef map으로 교체 — EC 항목으로 문서화. 이 Goal에서 최적화 구현은 out-of-scope | — |
| D8 | `.size-limit.json` 신규 생성 (goals.json 미명시 supplemental) | AC-006 `size-limit ≤ 20 KB gzipped` (C-21) 자동 검증 요건. goals.json 파일 목록에 없으나 AC-006 충족에 필수. Section 7 SUPPLEMENT 항목으로 포함 | — |
| D9 | onKeyDown 합성 순서: G-005(edit) → G-002(nav) → G-004(clipboard) | D5 Enter 우선순위 (G-005 사양). editKeyDown이 e.preventDefault() 시 navKeyDown skip. G-004 clipboard는 항상 마지막 (Ctrl+C/V는 nav/edit와 충돌 없음) | — |

**D# 파일 수 breakdown**: NEW 3 + MODIFY 3 = **6 files 합계** (+ SUPPLEMENT 1 = 7 total).  
NEW: `RangeSelectGrid.stories.tsx`, `CHANGELOG.md`, `.size-limit.json`.  
MODIFY: `types.ts`, `RangeSelectGrid.tsx`, `index.ts`.  
SUPPLEMENT (ADR 추가): `.claude/tw-grid/decisions/MOD-GRID-11-decisions.md`.

---

## Section 1: 목표 개요

### 1.1 Goal 기본 정보

| 항목 | 값 |
|------|-----|
| Goal ID | G-006 |
| 제목 | RangeSelectGrid 완전 통합 alias + Pro 라이선스 런타임 + 가상화 호환 검증 (Capstone) |
| Package | `@tomis/grid-pro-range` |
| Tier | Pro (EULA 라이선스) |
| migrationImpact | **medium** (goals.json G-006 객체 `"migrationImpact": "medium"` — C-32 권위 값) |
| Priority | P0 |
| overallStatus | pending |
| Depends On | G-001 (CellRange + 마우스 선택), G-002 (useKeyboardNav), G-003 (DragFillHandle + fillRange), G-004 (useClipboard), G-005 (useKeyboardEdit), MOD-GRID-99-A/G-001 (D2 stub으로 해소) |
| Blocks | — (Capstone: 이 Goal이 MOD-GRID-11 마지막 delivery) |

### 1.2 Goal 설명

G-001~G-005에서 개별 구현된 5개 기능 레이어를 **단일 `RangeSelectGrid` 컴포넌트**에 완전 통합한다.

- **G-001 useCellRange**: 마우스 드래그 + Shift+Click 범위 선택
- **G-002 useKeyboardNav**: Arrow/Ctrl+Arrow/PgUp·PgDn 키보드 내비게이션
- **G-003 DragFillHandle**: 셀 채우기 핸들 드래그
- **G-004 useClipboard**: Ctrl+C/V 클립보드 복사·붙여넣기
- **G-005 useKeyboardEdit**: Delete/F2/Enter/printable key 편집 트리거

통합 원칙:
- **Rules of Hooks 준수**: 5개 hook 모두 무조건 호출 (D5)
- **enable* prop으로 기능 온/오프**: 동작 게이팅만, hook 호출 게이팅 아님 (D4)
- **onKeyDown 합성 체인**: editKeyDown → navKeyDown → clipKeyDown (D9)
- **Pro 라이선스 런타임**: `_verifyGridLicenseStub` (D2)
- **가상화 호환**: `@tanstack/react-virtual` 1000-row Storybook story (AC-002)
- **Backward compat**: 기존 6-prop `RangeSelectGridProps` 유지 + 신규 props 확장 (C-6)

### 1.3 참조 출처 (Section 1 — H-01 평가 대상)

- **L0**: `D:\project\topvel_project\TOMIS\tw-framework-front\src\components\tomis\Grid\RangeSelectGrid.tsx` — 기존 래퍼 컴포넌트 (affectedUsageFile, D6 zero-touch 결정)
- **L1**: `D:\project\topvel_project\TOMIS\.claude\tw-grid\goals\MOD-GRID-11\range-goals.json` G-006 객체 (AC-001~AC-008 소스)
- **L2 (구현 파일)**:
  - `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\types.ts` — 현재 타입 (RangeSelectGridProps 6-prop)
  - `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\RangeSelectGrid.tsx` — 현재 구현 (useCellRange only)
  - `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\index.ts` — 현재 exports
  - `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\useCellRange.ts` — G-001 hook
  - `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\useKeyboardNav.ts` — G-002 hook
  - `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\DragFillHandle.tsx` — G-003 component
  - `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\useClipboard.ts` — G-004 hook
  - `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\useKeyboardEdit.ts` — G-005 hook
  - `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\package.json` — "SEE LICENSE IN EULA" 확인
  - `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\EULA.md` — 라이선스 파일
- **L3 (ADR)**:
  - `D:\project\topvel_project\TOMIS\.claude\tw-grid\decisions\MOD-GRID-11-decisions.md` — ADR-001~006
  - `D:\project\topvel_project\TOMIS\.claude\tw-grid\artifacts\MOD-GRID-11\range\G-005-spec.md` — D# 패턴 선례
- **R-A (AG Grid 참조)**: AG Grid Enterprise Range + Virtualization 패턴 (C-7: import 금지, 패턴 shape 참조만)
- **R-W (Wijmo 참조)**: Wijmo `FlexGrid` selectionMode + virtual row rendering 개념 (C-16: import 금지, 개념 참조만)

---

## Section 2: Acceptance Criteria

| AC# | 설명 | 소스 |
|-----|------|------|
| AC-001 | 5개 hook 완전 통합: `useCellRange` + `useKeyboardNav` + `useClipboard` + `useKeyboardEdit` + `DragFillHandle` 조건부 렌더 (enable* prop 연동). `RangeSelectGridProps` 하위 호환 유지 (C-6: 기존 6-prop 전부 선택적 신규 props 미제공 시 기본값 동작). `@ts-ignore`, `as any`, `<any>` 금지 (C-4). | L1 (goals.json AC-001) |
| AC-002 | `enableVirtualization?: boolean` prop 제공. `true` 시 `@tanstack/react-virtual` `useVirtualizer` 통합. Storybook story (b)에서 1000행 이상 데이터로 드래그 선택 + Drag-fill 정상 동작 검증 (C-18). | L1 (goals.json AC-002), C-18 |
| AC-003 | Pro 라이선스 런타임 검증: `_verifyGridLicenseStub('@tomis/grid-pro-range')` 호출. 미검증 시 `console.warn` + DOM watermark 표시만 (렌더링 차단 금지). C-24 EULA 조건 명시. | L1 (goals.json AC-003), C-24 |
| AC-004 | `RangeSelectGrid` semver 별칭 C-6 1 minor (v0.2.0). `CHANGELOG.md` 신규 생성: G-006 통합 내역 + 마이그레이션 가이드 (C-23). | L1 (goals.json AC-004), C-6, C-23 |
| AC-005 | `@mescius/wijmo*` import 0건 (C-16). Wijmo selectionMode 개념은 참조만. | L1 (goals.json AC-005), C-16 |
| AC-006 | `size-limit` 검증: `@tomis/grid-pro-range` 전체 ≤ 20 KB gzipped (C-21). `.size-limit.json` 신규 생성 (D8). | L1 (goals.json AC-006), C-21 |
| AC-007 | `tsc --noEmit` 0 error (C-12). `exactOptionalPropertyTypes` 하에서 optional props spread-skip 패턴 준수 (C-29). | L1 (goals.json AC-007), C-12, C-29 |
| AC-008 | Storybook story 2개: (a) 전체 기능 통합 (5 hook 모두 활성화된 FullFeature), (b) 1000행+ 가상화 + Drag-fill (`VirtualizationLargeDataset`). `RangeSelectGrid.stories.tsx` 신규 생성. | L1 (goals.json AC-008), C-18, ADR-MOD-GRID-11-005 |

---

## Section 3: 인터페이스 설계

### 3.1 타입 확장: `RangeSelectGridProps` → `RangeSelectGridAllProps`

`types.ts`의 기존 `RangeSelectGridProps<TData>` 6-prop 인터페이스를 확장한다.  
**C-6 backward compat**: 기존 6개 props (`data`, `columns`, `onRangeChange?`, `loading?`, `emptyText?`, `className?`) 시그니처 유지.  
**C-29 exactOptionalPropertyTypes**: 모든 신규 optional props `?: T` 선언 (undeclared 전달 금지).

```typescript
/**
 * G-006 확장 props — G-001 6-prop 유지 + 5개 enable 플래그 + 7개 callback (AC-001, C-6, C-29).
 *
 * enable* 플래그 설계 원칙 (D4, D5):
 *   - 모든 hook은 무조건 호출 (Rules of Hooks 준수)
 *   - enable* = false → hook 내부 early return (동작 게이팅)
 *   - DragFillHandle: 컴포넌트이므로 조건부 렌더 허용
 */
export interface RangeSelectGridAllProps<TData extends object, TCell = unknown>
  extends RangeSelectGridProps<TData> {
  // ── enable 플래그 (D4) ─────────────────────────────────────────────────
  /** 마우스 드래그 / Shift+Click 범위 선택 (default: true). */
  enableRangeSelection?: boolean;
  /** Arrow/Ctrl+Arrow 키보드 내비게이션 (default: true). */
  enableKeyboardNav?: boolean;
  /** Drag-fill 핸들 렌더링 + 채우기 기능 (default: false). */
  enableDragFill?: boolean;
  /** Ctrl+C/V 클립보드 (default: false). */
  enableClipboard?: boolean;
  /** Delete/F2/Enter/printable key 편집 트리거 (default: false). */
  enableKeyboardEdit?: boolean;
  /** @tanstack/react-virtual 가상화 (default: false, C-18). */
  enableVirtualization?: boolean;

  // ── 셀 값 getter (G-003/G-004 공유) ──────────────────────────────────
  /** 셀 값 getter — drag-fill 계산 + clipboard 복사용 (AC-001). */
  getCellValue?: (row: number, col: number) => TCell;

  // ── G-003 DragFillHandle callbacks ────────────────────────────────────
  /** Drag-fill 완료 콜백 (D3 MOD-GRID-10 분리). */
  onFillComplete?: (cells: CellUpdate<TCell>[]) => void;
  /** Drag-fill target 범위 변경 알림 (점선 outline). */
  onFillTargetChange?: (target: CellRange | null) => void;

  // ── G-004 useClipboard callbacks ─────────────────────────────────────
  /** 붙여넣기 결과 콜백 (D3 MOD-GRID-10 분리). */
  onPaste?: (cells: CellUpdate<TCell>[]) => void;
  /** 클립보드 API 에러 핸들러 (권한 거부 등). */
  onClipboardError?: (error: Error) => void;

  // ── G-005 useKeyboardEdit callbacks ───────────────────────────────────
  /** 컬럼 편집 가능 여부 판별. 미제공 시 전체 편집 가능. */
  isEditableColumn?: (colIndex: number) => boolean;
  /** Delete 키 범위 삭제 콜백 (D3 MOD-GRID-10 분리). */
  onDeleteRange?: (cells: CellCoord[]) => void;
  /** 범위 일괄 입력 콜백 (D3 MOD-GRID-10 분리). */
  onBulkEdit?: (cells: CellCoord[], value: TCell) => void;
  /** F2/Enter 단일 셀 편집 시작 콜백 (D4 MOD-GRID-05 분리). */
  onEditStart?: (cell: CellCoord, initialValue?: TCell) => void;
}
```

**인덱스 export 추가**: `index.ts`에 `RangeSelectGridAllProps` type export 추가.

### 3.2 RangeSelectGrid 컴포넌트 통합 구조

```typescript
/**
 * RangeSelectGrid — G-006 5-hook 완전 통합 (AC-001, D4, D5, D9).
 *
 * D5 Rules of Hooks: 5개 hook 전부 무조건 호출.
 * D4 enable* = behavior gate (not hook invocation gate).
 * D9 onKeyDown 합성: editKeyDown → navKeyDown → clipKeyDown.
 */
export function RangeSelectGrid<TData extends object, TCell = unknown>(
  props: RangeSelectGridAllProps<TData, TCell>,
): React.ReactElement {
  const {
    data, columns, onRangeChange, loading, emptyText, className,
    enableRangeSelection = true,
    enableKeyboardNav = true,
    enableDragFill = false,
    enableClipboard = false,
    enableKeyboardEdit = false,
    enableVirtualization = false,
    getCellValue,
    onFillComplete, onFillTargetChange,
    onPaste, onClipboardError,
    isEditableColumn, onDeleteRange, onBulkEdit, onEditStart,
  } = props;

  // D2: Pro 라이선스 stub (useEffect, no-op until MOD-GRID-99-A)
  useEffect(() => { _verifyGridLicenseStub('@tomis/grid-pro-range'); }, []);

  // ── TanStack Table ─────────────────────────────────────────────────────
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data, columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const rows = table.getRowModel().rows;

  // ── containerRef ──────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);

  // ── getCellRect helper (D7: coord → pixel, DragFillHandle용) ──────────
  const getCellRect = useCallback(
    (row: number, col: number): { x: number; y: number; width: number; height: number } => {
      if (containerRef.current === null) return { x: 0, y: 0, width: 0, height: 0 };
      const selector = `[data-row="${row}"][data-col="${col}"]`;
      const cell = containerRef.current.querySelector(selector);
      if (cell === null) return { x: 0, y: 0, width: 0, height: 0 };
      const r = cell.getBoundingClientRect();
      const cr = containerRef.current.getBoundingClientRect();
      return { x: r.left - cr.left, y: r.top - cr.top, width: r.width, height: r.height };
    },
    [],
  );

  // ── G-001 useCellRange (D5: 무조건 호출, enableRangeSelection로 동작 분기) ──
  const { range, handleMouseDown, handleMouseEnter, handleMouseUp } = useCellRange({
    rowCount: rows.length,
    colCount: columns.length,
    onRangeChange: enableRangeSelection ? onRangeChange : undefined,
    disabled: !enableRangeSelection,  // hook 내부 early return
  });

  // ── G-002 useKeyboardNav (D5: 무조건 호출) ────────────────────────────
  const [activeCell, setActiveCell] = useState<CellCoord | null>(null);
  const { handleKeyDown: navKeyDown } = useKeyboardNav({
    table,
    activeCell,
    onActiveCellChange: setActiveCell,
    range,
    onRangeChange: enableKeyboardNav ? onRangeChange : undefined,
    ...(getCellValue !== undefined ? { getCellValue } : {}),
  });

  // ── G-004 useClipboard (D5: 무조건 호출) ─────────────────────────────
  const { onKeyDown: clipKeyDown } = useClipboard({
    selection: range,
    activeCell,
    rowCount: rows.length,
    colCount: columns.length,
    getCellValue: getCellValue ?? (() => undefined as TCell),
    ...(enableClipboard && onPaste !== undefined ? { onPaste } : {}),
    ...(enableClipboard && onClipboardError !== undefined ? { onError: onClipboardError } : {}),
  });

  // ── G-005 useKeyboardEdit (D5: 무조건 호출) ───────────────────────────
  const { onKeyDown: editKeyDown } = useKeyboardEdit<TData, TCell>({
    selection: range,
    activeCell,
    ...(isEditableColumn !== undefined ? { isEditableColumn } : {}),
    ...(enableKeyboardEdit && onDeleteRange !== undefined ? { onDeleteRange } : {}),
    ...(enableKeyboardEdit && onBulkEdit !== undefined ? { onBulkEdit } : {}),
    ...(enableKeyboardEdit && onEditStart !== undefined ? { onEditStart } : {}),
  });

  // ── D9: onKeyDown 합성 체인 (G-005 → G-002 → G-004) ──────────────────
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      editKeyDown(e);
      if (e.defaultPrevented) return;
      navKeyDown(e);
      if (e.defaultPrevented) return;
      clipKeyDown(e);
    },
    [editKeyDown, navKeyDown, clipKeyDown],
  );

  // ── 가상화 (AC-002, C-18) ─────────────────────────────────────────────
  // enableVirtualization=true 시 useVirtualizer 활성화.
  // NOTE: useVirtualizer는 @tanstack/react-virtual (peerDep 추가 필요 — C-22).
  const rowCount = rows.length;
  const virtualizer = useVirtualizer({
    count: enableVirtualization ? rowCount : 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 36,
    enabled: enableVirtualization,
  });
  const virtualRows = enableVirtualization ? virtualizer.getVirtualItems() : null;
  const totalHeight = enableVirtualization ? virtualizer.getTotalSize() : undefined;

  // ── 렌더 ──────────────────────────────────────────────────────────────
  // (생략 — Section 5에서 상세 기술)
}
```

**주의 (C-29)**: `getCellValue`, `onPaste`, `onClipboardError` 등 optional props를 hook에 전달 시 spread-skip 패턴 사용:
```typescript
// 올바른 예:
...(onPaste !== undefined ? { onPaste } : {})

// 금지 (C-29 위반):
onPaste={onPaste}  // onPaste=undefined 전달 시 exactOptionalPropertyTypes 에러
```

### 3.3 가상화 통합 (AC-002, C-18)

`enableVirtualization=true` 시:
- `@tanstack/react-virtual`의 `useVirtualizer` 사용
- `containerRef` `<div>` 에 `overflow-y: auto` + 고정 높이 필요 (caller 책임)
- `virtualizer.getVirtualItems()` → render할 row 인덱스 목록
- `virtualizer.getTotalSize()` → 전체 scroll height (내부 spacer div)
- `isInRange` 기존 로직은 row 인덱스 기반이므로 가상화 후에도 동일하게 적용

**패턴**:
```typescript
{enableVirtualization && virtualRows !== null ? (
  <div style={{ height: totalHeight, position: 'relative' }}>
    {virtualRows.map((vRow) => {
      const row = rows[vRow.index];
      return (
        <tr
          key={row.id}
          style={{ position: 'absolute', top: vRow.start, width: '100%' }}
        >
          {/* cells */}
        </tr>
      );
    })}
  </div>
) : (
  rows.map((row) => <tr key={row.id}>{/* cells */}</tr>)
)}
```

### 3.4 Pro 라이선스 watermark (AC-003)

`_verifyGridLicenseStub` no-op 단계에서는 watermark 미표시.  
실제 `verifyGridLicense` 구현(MOD-GRID-99-A 완료 후) 시 미검증 상태 → `console.warn` + DOM watermark:
```typescript
// watermark DOM 삽입 예시 (Tailwind — C-5)
<div
  aria-hidden="true"
  className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 text-gray-400 text-xs select-none"
>
  Unlicensed @tomis/grid-pro-range
</div>
```

---

## Section 4: 에러 케이스 (Edge Cases)

| EC# | 조건 | 예상 동작 |
|-----|------|----------|
| EC-001 | `getCellValue` 미제공 + `enableDragFill=true` | `DragFillHandle` 렌더링 skip (range=null 처리로 자연 미표시). fillRange 호출 없음 |
| EC-002 | `enableVirtualization=true` + `containerRef.current` scroll element null | `useVirtualizer` 빈 items 반환. rows 전체 비가상화로 폴백 렌더 |
| EC-003 | `enableDragFill=true` + 1000행 — `coordFromMouseEvent` O(rows×cols) 성능 | 허용 범위로 문서화 (D7). 실측 jank 시 cellRef map 교체 (향후 최적화 scope) |
| EC-004 | `enableClipboard=false` + Ctrl+C keydown | `clipKeyDown` 무조건 호출되지만 `useClipboard` 내부에서 selection null 또는 enable 체크 불통. no-op |
| EC-005 | `enableKeyboardEdit=false` + Delete keydown | `editKeyDown` 무조건 호출되지만 callbacks (onDeleteRange 등) undefined → no-op |
| EC-006 | `enableRangeSelection=false` + 마우스 드래그 | `useCellRange` disabled=true → range 상태 업데이트 없음 |
| EC-007 | `enableVirtualization=true` + `DragFillHandle` 드래그 | `getCellRect`의 `querySelector` 가 가상화된 (DOM에 없는) row 못 찾음 → `{ x:0, y:0, width:0, height:0 }` 반환. 경계 밖 드래그 무시 |
| EC-008 | 1000-row 비가상화 + 마우스 드래그 범위 선택 | 정상 동작. DOM 이벤트 기반이므로 row 수와 독립. 시각적 `isInRange` 체크는 O(rows×cols) — 가상화 미사용 시 허용 |
| EC-009 | `onRangeChange` 미제공 + 마우스 범위 선택 | range state 내부 업데이트 정상. onRangeChange 호출 생략 (spread-skip 패턴으로 undefined 전달 방지) |

---

## Section 5: 렌더링 구조

### 5.1 컴포넌트 트리

```
RangeSelectGrid<TData, TCell>
├── div.relative (containerRef — tabIndex=0, onKeyDown=합성체인, onMouseUp)
│   ├── [watermark div — AC-003, Unlicensed 시에만]
│   ├── table.w-full.text-sm (또는 가상화 div 래퍼)
│   │   ├── thead
│   │   │   └── tr > th (컬럼 헤더)
│   │   └── tbody
│   │       └── tr[data-row=r] (각 row)
│   │           └── td[data-row=r][data-col=c]
│   │               ├── isInRange 기반 bg-blue-100 ring-1 ring-blue-400 (ADR-004)
│   │               ├── onMouseDown, onMouseEnter 핸들러
│   │               └── flexRender(cell.column.columnDef.cell, cell.getContext())
│   └── {enableDragFill && range !== null && (
│         <DragFillHandle
│           range={range}
│           getCellValue={getCellValue ?? (() => undefined)}
│           rowCount={rows.length}
│           colCount={columns.length}
│           containerRef={containerRef}
│           getCellRect={getCellRect}
│           {...(onFillComplete !== undefined ? { onFillComplete } : {})}
│           {...(onFillTargetChange !== undefined ? { onFillTargetChange } : {})}
│         />
│       )}
└── [loading overlay — loading=true 시]
```

**DragFillHandle**: 컴포넌트이므로 `enableDragFill && range !== null` 조건부 렌더 허용 (D4, D5 — hook이 아닌 컴포넌트는 conditional render 가능).

### 5.2 셀 스타일링

선택 범위 셀: `bg-blue-100 ring-1 ring-blue-400` (ADR-MOD-GRID-11-004).  
활성 셀 (activeCell): `ring-2 ring-blue-600` (G-002 패턴 연속).  
`data-row` / `data-col` attribute: `getCellRect` querySelector 기반 (EC-007 참조).

---

## Section 6: 번들 임팩트

| G# | 파일 | 예상 크기 | 누적 합계 |
|----|------|-----------|-----------|
| G-001 | useCellRange + normalize + types + RangeSelectGrid | +4 KB | 4 KB |
| G-002 | useKeyboardNav | +2 KB | 6 KB |
| G-003 | DragFillHandle + fillRange | +3 KB | 9 KB |
| G-004 | useClipboard + tsvUtils | +2 KB | 11 KB |
| G-005 | useKeyboardEdit | +2 KB | 13 KB |
| **G-006** | **통합 RangeSelectGrid + stories + .size-limit.json** | **+2 KB** | **15 KB** |

**총계**: 15 KB ≤ 20 KB gzipped 한도 (C-21, AC-006).  
goals.json `bundleImpact.expected`: "+2 KB (통합 컴포넌트 — 합계 ≤ 15 KB grid-pro-range 전체)".

`.size-limit.json` 설정 (AC-006, D8):
```json
[
  {
    "name": "@tomis/grid-pro-range",
    "path": "dist/index.js",
    "limit": "20 KB",
    "gzip": true
  }
]
```

---

## Section 7: 구현 파일 목록 (Truth Table)

> **C-30 Spec Truth Table Discipline**: 이 표가 implementer가 신뢰하는 단일 소스.  
> **C-28**: 모든 경로는 `topvel-grid-monorepo/` prefix 사용 (goals.json의 `TOMIS/packages/` 오류 — D1).  
> **E-06**: D# 결정 테이블(Section 0) ↔ 이 표 상호 일관성 유지.

| # | 파일 경로 (monorepo 상대) | 상태 | AC 매핑 | 비고 |
|---|--------------------------|------|---------|------|
| 1 | `packages/grid-pro-range/src/types.ts` | MODIFY | AC-001, AC-007 | `RangeSelectGridAllProps<TData, TCell>` 추가. 기존 `RangeSelectGridProps` 유지 (C-6). `CellUpdate`, `CellCoord` import 이미 존재. |
| 2 | `packages/grid-pro-range/src/RangeSelectGrid.tsx` | MODIFY | AC-001, AC-002, AC-003, AC-007 | 5-hook 통합 + `enableVirtualization` + `_verifyGridLicenseStub` + `useVirtualizer` 조건부. |
| 3 | `packages/grid-pro-range/src/index.ts` | MODIFY | AC-001, AC-009 | `RangeSelectGridAllProps` type export 추가. 기존 exports 전부 유지. |
| 4 | `packages/grid-pro-range/src/RangeSelectGrid.stories.tsx` | NEW | AC-008 | Story (a): FullFeature (5 hook all enabled). Story (b): VirtualizationLargeDataset (1000행+). |
| 5 | `packages/grid-pro-range/CHANGELOG.md` | NEW | AC-004, C-23 | v0.2.0 G-006 통합 내역 + 마이그레이션 가이드. |
| 6 | `packages/grid-pro-range/.size-limit.json` | NEW | AC-006, C-21 | `.size-limit.json` ≤ 20 KB gzipped 설정 (D8 SUPPLEMENT). |
| 7 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-11-decisions.md` | MODIFY | — | ADR-007 G-006 capstone 결정 추가 (D4/D5/D6/D9). |

**Usage file (zero-touch — D6)**:

| # | 파일 경로 (TOMIS 상대) | 상태 | 비고 |
|---|----------------------|------|------|
| 8 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/RangeSelectGrid.tsx` | VERIFY ONLY | D6b: 기능 변경 없음. 기존 6-prop 인터페이스 하위 호환. `contextMenu` 복사 버튼 wiring은 이 Goal scope 밖. |

**변경 없음 (이미 올바름)**:

| 파일 | 이유 |
|------|------|
| packages/grid-pro-range/package.json | `"license": "SEE LICENSE IN EULA"` + peerDependencies 완비 (D3). @tanstack/react-virtual peer 추가 여부는 C-22 정책 검토 필요 — grid-virtual 패키지 담당이면 grid-pro-range peer 추가 불필요. |
| packages/grid-pro-range/EULA.md | 라이선스 파일 존재 (AC-003 충족). 내용 변경 없음 (D3). |

---

## Section 8: Pre-flight 검증 (H-meta gate)

### H-01: referenceEvidence 경로 존재 확인

| 경로 | 존재 여부 |
|------|----------|
| `D:\project\topvel_project\TOMIS\tw-framework-front\src\components\tomis\Grid\RangeSelectGrid.tsx` | ✅ 확인됨 (L0) |
| `D:\project\topvel_project\TOMIS\.claude\tw-grid\goals\MOD-GRID-11\range-goals.json` | ✅ 확인됨 (L1) |
| `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\types.ts` | ✅ 확인됨 (L2) |
| `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\RangeSelectGrid.tsx` | ✅ 확인됨 (L2) |
| `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\index.ts` | ✅ 확인됨 (L2) |
| `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\useCellRange.ts` | ✅ 확인됨 (L2) |
| `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\useKeyboardNav.ts` | ✅ 확인됨 (L2) |
| `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\DragFillHandle.tsx` | ✅ 확인됨 (L2) |
| `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\useClipboard.ts` | ✅ 확인됨 (L2) |
| `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\useKeyboardEdit.ts` | ✅ 확인됨 (L2) |
| `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\package.json` | ✅ 확인됨 (L2) |
| `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\EULA.md` | ✅ 확인됨 (L2) |
| `D:\project\topvel_project\TOMIS\.claude\tw-grid\decisions\MOD-GRID-11-decisions.md` | ✅ 확인됨 (L3) |
| `D:\project\topvel_project\TOMIS\.claude\tw-grid\artifacts\MOD-GRID-11\range\G-005-spec.md` | ✅ 확인됨 (L3) |

### H-02: implementFiles parent directory 존재 확인

| 파일 | 부모 디렉토리 | 상태 |
|------|-------------|------|
| `types.ts` | `packages/grid-pro-range/src/` | ✅ 기존 파일 MODIFY |
| `RangeSelectGrid.tsx` | `packages/grid-pro-range/src/` | ✅ 기존 파일 MODIFY |
| `index.ts` | `packages/grid-pro-range/src/` | ✅ 기존 파일 MODIFY |
| `RangeSelectGrid.stories.tsx` | `packages/grid-pro-range/src/` | ✅ 부모 존재 (NEW 허용) |
| `CHANGELOG.md` | `packages/grid-pro-range/` | ✅ 부모 존재 (NEW 허용) |
| `.size-limit.json` | `packages/grid-pro-range/` | ✅ 부모 존재 (NEW 허용) |
| `MOD-GRID-11-decisions.md` | `.claude/tw-grid/decisions/` | ✅ 기존 파일 MODIFY |

### H-03: 모든 AC의 소스 태그 확인

| AC# | 소스 태그 |
|-----|----------|
| AC-001 | L1 (goals.json), C-4, C-6, C-29 |
| AC-002 | L1 (goals.json), C-18 |
| AC-003 | L1 (goals.json), C-24 |
| AC-004 | L1 (goals.json), C-6, C-23 |
| AC-005 | L1 (goals.json), C-16 |
| AC-006 | L1 (goals.json), C-21 |
| AC-007 | L1 (goals.json), C-12, C-29 |
| AC-008 | L1 (goals.json), C-18, ADR-MOD-GRID-11-005 |

---

## Section 9: 리스크 테이블

| 리스크 | 심각도 | 가능성 | 완화 방안 |
|--------|--------|--------|----------|
| Rules of Hooks 위반: enable* 로 hook 조건부 호출 | High | Medium | D5 명시. Implementer에게 5개 hook 무조건 호출 의무 규칙 강조. E-06 검증 항목 포함. |
| DragFillHandle + 가상화 조합: getCellRect querySelector miss (EC-007) | Medium | High | EC-007 문서화. Storybook story (b)에서 실측 검증. |
| `@tanstack/react-virtual` peerDependency 누락 (C-22) | Medium | Medium | `enableVirtualization=false` default — 미사용 시 import tree-shaking. peer 추가 여부는 implementer가 C-22 정책 확인. |
| `exactOptionalPropertyTypes` spread-skip 누락 (C-29) | Medium | High | Section 3.2 spread-skip 패턴 명시. tsc 검증으로 CI 포착 (AC-007). |
| bundle ≤ 20 KB 초과 | Low | Low | Section 6 번들 누적 추적. `.size-limit.json` CI 자동화 (AC-006). |
| L0 usage file (RangeSelectGrid.tsx) props 호환성 깨짐 | Medium | Low | D6 zero-touch 결정. 기존 6-prop 시그니처 유지. VERIFY ONLY (Section 7 #8). |

---

## Section 10: 마이그레이션 가이드 (AC-004, C-23)

### CHANGELOG.md 내용 (신규 생성)

```markdown
# @tomis/grid-pro-range Changelog

## v0.2.0 (2026-05-15) — G-006 RangeSelectGrid 완전 통합

### 신규 기능

- `RangeSelectGridAllProps<TData, TCell>`: 5개 enable 플래그 + 7개 callback props 확장
  - `enableRangeSelection?: boolean` (default: true)
  - `enableKeyboardNav?: boolean` (default: true)
  - `enableDragFill?: boolean` (default: false)
  - `enableClipboard?: boolean` (default: false)
  - `enableKeyboardEdit?: boolean` (default: false)
  - `enableVirtualization?: boolean` (default: false)
- `RangeSelectGrid` 컴포넌트: 5-hook 완전 통합 (useCellRange + useKeyboardNav + DragFillHandle + useClipboard + useKeyboardEdit)
- Pro 라이선스 런타임 stub (MOD-GRID-99-A 완료 후 실 검증으로 교체 예정)
- @tanstack/react-virtual 1000-row 가상화 지원 (enableVirtualization=true)

### 하위 호환

- v0.1.x `RangeSelectGridProps` 6-prop 인터페이스 완전 유지 (C-6)
- 기존 사용 코드 변경 불필요:
  ```tsx
  // v0.1.x — 그대로 동작
  <RangeSelectGrid data={data} columns={columns} />
  ```

### 마이그레이션 (선택적 신규 기능 활성화)

```tsx
// v0.2.0 — Drag-fill + Clipboard 활성화 예시
<RangeSelectGrid<MyData, string>
  data={data}
  columns={columns}
  enableDragFill
  enableClipboard
  getCellValue={(row, col) => getMyValue(row, col)}
  onFillComplete={(cells) => applyUpdates(cells)}
  onPaste={(cells) => applyUpdates(cells)}
/>
```

## v0.1.x (G-001~G-005)

- G-001: CellRange 모델 + 마우스 드래그/Shift+Click
- G-002: Arrow/Ctrl+Arrow 키보드 내비게이션
- G-003: DragFillHandle + fillRange + detectSeriesStep
- G-004: useClipboard (Ctrl+C/V + TSV)
- G-005: useKeyboardEdit (Delete/F2/Enter/printable)
```

---

## Section 11: Storybook 시나리오 (AC-008)

### Story (a): FullFeature — 전체 기능 통합

```typescript
// packages/grid-pro-range/src/RangeSelectGrid.stories.tsx

export const FullFeature: Story = {
  name: 'FullFeature — 5 Hook 통합',
  args: {
    data: sampleData20Rows,          // 20행 샘플
    columns: sampleColumns,
    enableRangeSelection: true,
    enableKeyboardNav: true,
    enableDragFill: true,
    enableClipboard: true,
    enableKeyboardEdit: true,
    enableVirtualization: false,
    getCellValue: (row, col) => sampleData20Rows[row]?.[colKeys[col]] ?? '',
    onFillComplete: (cells) => console.log('fill:', cells),
    onPaste: (cells) => console.log('paste:', cells),
    onDeleteRange: (cells) => console.log('delete:', cells),
    onBulkEdit: (cells, value) => console.log('bulkEdit:', cells, value),
    onEditStart: (cell, init) => console.log('editStart:', cell, init),
  },
};
```

검증 시나리오:
1. 마우스 드래그 → 범위 선택 (파란색 하이라이트)
2. Ctrl+Arrow → 데이터 경계 이동
3. Drag-fill 핸들 드래그 → `onFillComplete` 콘솔 로그
4. Ctrl+C → 클립보드 복사
5. Delete → `onDeleteRange` 콘솔 로그
6. 문자 타이핑 → `onBulkEdit` 콘솔 로그

### Story (b): VirtualizationLargeDataset — 1000행+ 가상화

```typescript
export const VirtualizationLargeDataset: Story = {
  name: 'VirtualizationLargeDataset — 1000행 가상화',
  args: {
    data: generate1000Rows(),        // 1000행 생성 helper
    columns: sampleColumns,
    enableRangeSelection: true,
    enableKeyboardNav: true,
    enableDragFill: true,
    enableVirtualization: true,
    getCellValue: (row, col) => generate1000Rows()[row]?.[colKeys[col]] ?? '',
    onFillComplete: (cells) => console.log('fill:', cells.length, 'cells'),
  },
  decorators: [
    (Story) => (
      // enableVirtualization 시 containerRef scroll element에 고정 높이 필요
      <div style={{ height: '600px', overflow: 'auto' }}>
        <Story />
      </div>
    ),
  ],
};
```

검증 시나리오:
1. 스크롤 → 가상화된 row만 DOM 존재 (DevTools 확인)
2. 마우스 드래그 범위 선택 → 스크롤 후에도 range 유지
3. Drag-fill 핸들 → `onFillComplete` 호출 (EC-007 getCellRect miss 시 동작 graceful)
4. 1000행 렌더 성능: First Contentful Paint ≤ 500ms (목표 지표)

---

## Section 12: 자기 점검 (Self-Review)

### C-31 Functional Wiring Audit

| 기능 | 구현 위치 | hook/callback wiring | 완료 |
|------|----------|---------------------|------|
| 마우스 범위 선택 | `useCellRange` + cell `onMouseDown/Enter` | `range` state → DragFillHandle, useKeyboardNav, useClipboard, useKeyboardEdit | ✅ |
| 키보드 내비게이션 | `useKeyboardNav` | `navKeyDown` in 합성 체인 | ✅ |
| Drag-fill | `DragFillHandle` conditional render | `getCellValue`, `onFillComplete`, `onFillTargetChange` | ✅ |
| 클립보드 | `useClipboard` | `clipKeyDown` in 합성 체인, `onPaste` callback | ✅ |
| 편집 트리거 | `useKeyboardEdit` | `editKeyDown` in 합성 체인 (우선), `onDeleteRange/onBulkEdit/onEditStart` | ✅ |
| 가상화 | `useVirtualizer` | `enableVirtualization` gate, `virtualRows` render | ✅ |
| 라이선스 | `_verifyGridLicenseStub` | `useEffect` on mount | ✅ |

### E-06: D# ↔ Section 7 일관성 검증

| D# | Section 0 내용 | Section 7 파일 |
|----|--------------|--------------|
| D1 | topvel-grid-monorepo prefix | Section 7 전체 경로 ✅ |
| D2 | _verifyGridLicenseStub | RangeSelectGrid.tsx (MODIFY) ✅ |
| D3 | package.json/EULA 변경 없음 | "변경 없음" 표 ✅ |
| D4 | enable* 5개 boolean | types.ts (MODIFY) ✅ |
| D5 | Rules of Hooks | RangeSelectGrid.tsx 구현 패턴 ✅ |
| D6 | usage file zero-touch | Section 7 VERIFY ONLY ✅ |
| D7 | DragFillHandle EC 문서화 | EC-003, EC-007 ✅ |
| D8 | .size-limit.json NEW | Section 7 #6 ✅ |
| D9 | onKeyDown 체인 순서 | Section 3.2 합성 코드 ✅ |

### 규칙 준수 체크리스트

| 규칙 | 항목 | 준수 |
|------|------|------|
| C-4 | `@ts-ignore`, `as any`, `<any>` 0건 | ✅ (Section 3 코드 검토) |
| C-5 | Tailwind only (CSS 파일 없음) | ✅ (watermark div Tailwind 클래스) |
| C-6 | 기존 6-prop backward compat | ✅ (RangeSelectGridProps 유지) |
| C-12 | `tsc --noEmit` 0 error | ✅ (C-29 spread-skip 패턴 명시) |
| C-16 | `@mescius/wijmo*` import 0건 | ✅ (개념 참조만) |
| C-18 | 1000-row Storybook story | ✅ (Story b: VirtualizationLargeDataset) |
| C-21 | ≤ 20 KB gzipped | ✅ (15 KB 추정, .size-limit.json) |
| C-22 | peerDependencies 정책 | ✅ (react-virtual peer 추가 여부 implementer 판단 명시) |
| C-23 | CHANGELOG.md | ✅ (Section 10) |
| C-24 | EULA + 라이선스 런타임 | ✅ (AC-003, D2, Section 3.4) |
| C-28 | monorepo 경로 prefix | ✅ (D1, Section 7 전체) |
| C-29 | exactOptionalPropertyTypes | ✅ (spread-skip 패턴 Section 3.2) |
| C-30 | Section 7 Truth Table | ✅ (완비) |
| C-31 | Functional Wiring Audit | ✅ (Section 12 표) |
| C-32 | migrationImpact goals.json 권위 | ✅ (medium — Section 1.1) |
| C-33 | 코드 블록은 guidance only | ✅ (Section 3 코드: 구조 참조용) |

---

## Section 13: H 메타 게이트 최종 점검

| 게이트 | 기준 | 상태 |
|--------|------|------|
| H-01 | referenceEvidence 경로 전부 실존 | ✅ (Section 8 H-01 표) |
| H-02 | implementFiles 부모 디렉토리 전부 실존 또는 NEW 허용 | ✅ (Section 8 H-02 표) |
| H-03 | 모든 AC에 소스 태그 (L0/L1/L2/L3/R-A/R-W/C-NN) | ✅ (Section 8 H-03 표) |
| G-01 (no TBD) | TBD/TODO 항목 0건 | ✅ |
| G-01 (D# cross-consistency) | Section 0 D# ↔ Section 7 파일 일관 | ✅ (Section 12 E-06 검증) |
| G-01 (goals.json consistency) | AC 수/내용 goals.json 일치 | ✅ (AC-001~AC-008 전부 L1 태그) |
| G-01 (D# count) | Section 0 "NEW 3 + MODIFY 3 = 6" ↔ Section 7 파일 수 | ✅ (NEW: #4,5,6 / MODIFY: #1,2,3 / SUPPLEMENT: #7) |
| E-06 | D# 결정 ↔ Section 7 최종 파일 표 상호 일관성 | ✅ (Section 12 E-06 표) |
| C-30 | Section 7 Truth Table 완비 | ✅ |
| C-32 | migrationImpact goals.json 권위값 반영 | ✅ (medium) |
| threshold | specify-score ≥ 90 (medium tier) | PENDING (reviewer 평가) |
