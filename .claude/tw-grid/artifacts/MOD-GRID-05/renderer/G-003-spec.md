# MOD-GRID-05 / renderer / G-003 — Spec

**Title**: EditableCell (인라인 편집: text/number/date/select/textarea) + cellClassName callback type + renderer registry
**Module**: MOD-GRID-05 (셀 렌더러 표준 set)
**Area**: renderer
**Goal**: G-003
**Priority**: P0
**migrationImpact**: high → threshold 95
**Package target**: `@tomis/grid-renderers` (MIT, brotli 한도 10 KB — `.size-limit.json:11` `"limit": "10 KB"`)
**dependsOn**: MOD-GRID-05/G-002 (UI 8 cells — StatusBadgeCell/LinkCell/ButtonCell/CheckCell/IconCell/TagCell/AvatarCell/ProgressCell baseline)
**rubricVersion**: specify v1.0.5 (32 항목 + 메타 게이트 H 3항목)

---

## ★ 사전 결정 (D# 표) — 본문 cross-consistency 의무 (G-01 v1.0.4 + C-30)

| D# | 결정 | 사유 / 출처 |
|----|------|----------|
| **D1** | **EditType union 확장 (additive)** — monorepo `EditType = 'text' \| 'number' \| 'date' \| 'select' \| 'textarea'` (5종). L0 `tw-framework-front/src/types/tomis/grid.ts:43` 의 `EditType = 'text' \| 'select' \| 'date' \| 'number'` (4종) 에서 `'textarea'` 추가 — Goal 제목 + AC-001 명시 5종 충족. **호환성**: 사용처 (`PayrollEditablePage.tsx:8`만 import — 1 파일) 는 추가 union 멤버를 사용하지 않으므로 build 영향 0건 (additive widening). TOMIS 측 `EditableColumnMeta` 는 본 Goal 범위 외 (D2 EditableGrid refactor 시 동시 widening — Section 11.4 R2). | Goal 제목, AC-001, L0 grid.ts:43, C-6 |
| **D2** | **EditableGrid.tsx MODIFY 의미 = body 내부 refactor (re-export shim 아님)** — EditableGrid 는 *Grid wrapper* (useReactTable + table markup 보유), EditableCell 은 *cell renderer*. 추상화 레벨이 다르므로 `export { EditableCell as EditableGrid }` 불가. **채택 액션 (a)**: EditableGrid.tsx 의 `editableColumns` useMemo (L75-129) 내부 inline `<input>/<select>` JSX 를 `<EditableCell>` import 호출로 교체 — props (rowIndex/colId/value/editType/selectOptions/onCommit/isEditing/onStartEdit) 를 EditableCell 에 전달. table markup + sorting + pagination state 는 EditableGrid 가 계속 보유. **이점**: EditableCell 의 실사용 baseline 확보 → AC-008 시각 회귀 finding 의 Before/After 비교 가능 + MOD-GRID-10 ChangeTrackingGrid (downstream) 도 동일 패턴 재사용 가능. **거부 대안 (b)**: EditableGrid 미수정 + 후속 Goal 으로 연기 → AC-008 시각 회귀에 비교 baseline 없음 → finding 부실. **거부 대안 (c) hybrid**: 본 Goal 에서 일부만 refactor — 복잡도 증가, 동일 risk. | AC-008, C-17, advisor #2, downstream MOD-GRID-10 의존 |
| **D3** | **cellClassName scope split — 본 Goal 은 (a) type export + (b) EditableCell cell-level prop 수용만**. Grid-level callback (`(cell: Cell<TData, unknown>) => string`) 의 호출/주입 wiring 은 별도 Goal (MOD-GRID-01 wrapper 또는 MOD-GRID-04 createColumns) 에서 통합. 본 G-003 범위:<br>(a) `type CellClassNameCallback<TData> = (cell: Cell<TData, unknown>) => string` 을 grid-renderers index 에서 export (MOD-GRID-01/04 가 import 가능)<br>(b) `EditableCell` props 에 `cellClassName?: string` 수용 — 호출처에서 callback 호출 결과를 string 으로 주입<br>**C-31 functional wiring**: 본 Goal 의 EditableCell 자체가 `cellClassName?: string` prop 을 className 합성에 사용 → dead code 아님. Grid-level callback wiring 은 별도 Goal — 본 Goal 의 implementer 의무 외 (spec ADR 에 "범위 외" 명시 — C-31 면제 조건 충족). | F-05-04, AC-004, advisor #3, C-31 |
| **D4** | **rendererRegistry scope = display type→component map (G-001+G-002 합산 11종)** — EditableCell 은 registry IN 아님. registry 는 **display 모드 매핑** (createColumns type 분기 자동 적용 — MOD-GRID-04 의존 baseline) 이고, EditableCell 은 **edit 모드 wrapper** (meta.editable 트리거 — display type 과 직교). **데이터 구조**: `Record<string, CellComponent>` (Map 아님 — 정적 config 에 idiomatic + tree-shaking 우수). **공개 API**: `defaultRendererRegistry` 상수 (11종 사전 등록) + `registerRenderer(type, component)` + `getRenderer(type)` helper. **타입**: `CellComponent = ComponentType<{ value: unknown; row?: Row<unknown>; column?: Column<unknown, unknown> }>` (FUNCTIONAL — TanStack ColumnDef cell context 호환). | F-05-06, AC-005, advisor #5 |
| **D5** | **C-29 (exactOptionalPropertyTypes spread 패턴) — 적용 안 함**. EditableCell 은 leaf 컴포넌트 (native `<input>`, `<select>`, `<textarea>` 직접 렌더). optional prop (`selectOptions?`, `cellClassName?`) 을 child React 컴포넌트로 forwarding 0건 — native HTML element 의 attribute 는 conditional spread/명시 union 대상이 아님 (DOM attribute 는 `undefined` 무시). rendererRegistry helper 도 props 가공 0 — getRenderer/registerRenderer 는 Map 조회/저장만 수행. 따라서 C-29 wrapper/alias/helper 적용 범위 밖 → G-002 D7 동일 처리. className 합성은 G-001/G-002 일관 `.filter(Boolean).join(' ')` 패턴. | C-29 적용 범위 (wrapper/alias/helper 만 — G-001 D7, G-002 D7 일관), 직접 forwarding 0건, advisor #4 |
| **D6** | **번들 추정 measurement-only (ADR-MOD-GRID-00-010)**: spec 예상 `+2 KB` (EditableCell ~50 라인 + rendererRegistry ~30 라인) — metric 참조용, 게이트 아님. G-001 + G-002 누적 실측치는 `pnpm size-limit` 직후 확인 — 본 G-003 추가 후 누적이 10 KB 한도 도달 가능. 한도 초과 시 G-002 D5 와 동일 옵션 (sub-entry 분할 / 한도 상향 / dictionary 추출). IMPLEMENT 직후 `pnpm size-limit` exit 0 가 게이트. | ADR-MOD-GRID-00-010, C-21, G-002 D5 일관 |
| **D7** | **파일 매니페스트 = monorepo NEW 2 (EditableCell.tsx + rendererRegistry.ts) + monorepo MODIFY 1 (index.ts) + tw-framework-front MODIFY 1 (EditableGrid.tsx body refactor)** = **NEW 2 + MODIFY 2 = 4 파일**. Section 7 표 4행 + Section 11.3 Step 1~4 + Section 12 검증 cross-check 일치. **부가 산출물 (Section 7 표 외 — implement-report 부속)**: finding 1 (MOD-GRID-05-G-003-visual-regression.md) + monorepo stories 1 (EditableCell.stories.tsx — placeholder). | C-19 (≤5/Goal — 본 Goal affectedUsageFiles = 1, 한도 내), G-001/G-002 패턴 일관 |
| **D8** | **AC-008 C-17 시각 회귀 검증 방법**: G-001 + G-002 finding (`findings/auto-fixed/MOD-GRID-05-G-{001,002}-visual-regression.md`) Method B 변형 (구조적 동등성 + JSX 토큰 매핑 분석) 일관 적용. EditableCell 은 **dynamic interactive UI** (focus / blur / keypress) — finding 은 정적 렌더 동등성 + **편집 플로우 5 단계** (view → click → edit mode → blur/Enter → view 복귀, view → click → edit mode → Esc → view 복귀) 의 state transition 동등성도 enumerate. monorepo Storybook 인프라 미구비 → placeholder story 1 파일 (5 editType variant + cellClassName variant 포함). | C-17, G-001/G-002 finding precedent, ADR-MOD-GRID-00-003 |
| **D9** | **D2 EditableGrid refactor 검증 게이트**: IMPLEMENT 단계 진입 직전 `Grep "EditableGrid" tw-framework-front/src --include=*.tsx --include=*.ts` 으로 사용처 검색 — spec writer 사전 검증 결과 **3 파일** (`PayrollEditablePage.tsx:1 import`, `EditableGrid.tsx` 자체, `grid.ts` 타입 정의). 사용처 1 페이지 (`PayrollEditablePage.tsx`) — EditableGrid 의 public props (`data/columns/onDataChange/pagination/loading/emptyText/className`) 는 본 D2 refactor 에서 보존 (internal cell rendering 만 EditableCell 로 위임). 사용처 build 영향 0건. | C-6, D2 호환성 게이트 |

**모든 D# breakdown 본문 cross-check 의무 (G-01 v1.0.4 강화)**:
- D7 의 "NEW 2 + MODIFY 2 = 4 파일" 합계 + NEW/MODIFY 분류 + 파일 이름 enumerate 가 Section 7 표 / Section 11 단계 / AC-001~AC-008 evidence 와 100% 일치.
- D1 의 `EditType` 5종 (text/number/date/select/textarea) 이 Section 2.1 interface + Section 6 EC-04 + AC-001 모두 동일 표기.
- D2 의 EditableGrid refactor 패턴이 Section 11.2 Before/After + Section 4.1 호환성 + Section 8.4 롤백 cross-reference.
- D3 의 cellClassName 분리가 Section 2.2 type export + Section 2.3 EditableCell prop + Section 11.3 Step 1~4 단계 분리 cross-reference.
- D4 의 11종 registry 사전 등록이 Section 2.4 rendererRegistry 정의 + Section 11.2 Before/After 의 사전 매핑과 일치.

**Spec authority (C-27)**: 본 spec 의 D# + Section 본문이 implement prompt 의 single source of truth. prompt 값과 spec 값 불일치 시 spec 우선 적용 + `promptSpecDrift[]` 보고.

**Spec truth table discipline (C-30)**: 본 spec 본문에 "재결정", "대체", "변경 대상" 같은 결정 변경 표현 0건 — Section 7 최종 표는 D7 breakdown 과 직접 일치. E-06 위반 잠재성 0.

---

## Section 1: 참조 추적 (L0/L1/L2/L3/R-A/R-W)

### 1.1 L0 — 현 tw-framework-front EditableGrid.tsx (직접 Read 후 라인 인용 — C-1)

**L0** `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` (232 라인 전체 Read 완료)

핵심 패턴 인용 — 본 Goal 흡수 대상 = `editableColumns` useMemo (L75-129) 의 inline 편집 셀 렌더링:

```tsx
// L1-11: imports + EditableColumnMeta from '../../../types/tomis/grid'
import { useState, useMemo, useCallback, useRef, KeyboardEvent } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender,
         type ColumnDef, type SortingState } from '@tanstack/react-table';
import type { EditableColumnMeta, GridPaginationOptions } from '../../../types/tomis/grid';

// L13: CellPosition — 편집 중인 셀 식별 (rowIndex + colId)
interface CellPosition { rowIndex: number; colId: string }

// L36-40: 편집 state (isEditing 은 editingCell.{rowIndex,colId} 비교로 도출)
const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
const [editValue, setEditValue] = useState<string>('');
const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

// L42-46: startEdit — 편집 진입 + value 초기화 + ref focus (setTimeout 0)
const startEdit = useCallback((rowIndex, colId, currentValue) => {
  setEditingCell({ rowIndex, colId });
  setEditValue(String(currentValue ?? ''));
  setTimeout(() => inputRef.current?.focus(), 0);
}, []);

// L48-58: commitEdit — data 갱신 + onDataChange 콜백 + 편집 종료
const commitEdit = useCallback(() => {
  if (!editingCell) return;
  const { rowIndex, colId } = editingCell;
  setData((prev) => { /* immutable patch */ });
  onDataChange?.(rowIndex, colId, editValue);
  setEditingCell(null);
}, [editingCell, editValue, onDataChange]);

// L60-63: cancelEdit — Esc 처리
const cancelEdit = useCallback(() => { setEditingCell(null); setEditValue(''); }, []);

// L65-72: handleKeyDown — Enter / Esc / Tab 분기
const handleKeyDown = useCallback((e) => {
  if (e.key === 'Enter') commitEdit();
  else if (e.key === 'Escape') cancelEdit();
  else if (e.key === 'Tab') { e.preventDefault(); commitEdit(); }
}, [commitEdit, cancelEdit]);

// L75-129: editableColumns useMemo — meta.editable 인 경우 cell 함수를 inline 편집 UI 로 wrapping
const editableColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
  return columns.map((col) => {
    const meta = col.meta as EditableColumnMeta | undefined;
    if (!meta?.editable) return col;
    return {
      ...col,
      cell: (ctx) => {
        const rowIndex = ctx.row.index; const colId = ctx.column.id; const value = ctx.getValue();
        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colId === colId;
        if (isEditing) {
          if (meta.editType === 'select' && meta.selectOptions) {
            return (<select ref={...} value={editValue} onChange={...} onBlur={commitEdit}
                            onKeyDown={handleKeyDown} className="w-full border ..." >
                      {meta.selectOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>);
          }
          return (<input ref={...}
            type={meta.editType === 'number' ? 'number' : meta.editType === 'date' ? 'date' : 'text'}
            value={editValue} onChange={...} onBlur={commitEdit} onKeyDown={handleKeyDown}
            className="w-full border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />);
        }
        return (<div className="min-h-[1.5rem] cursor-text px-1 rounded hover:bg-blue-50 hover:ring-1 hover:ring-blue-200"
                     onClick={() => startEdit(rowIndex, colId, value)}>
                  {String(value ?? '')}
                </div>);
      },
    };
  });
}, [columns, editingCell, editValue, commitEdit, handleKeyDown, startEdit]);
```

★ D2 명시: 본 Goal 의 핵심 흡수 액션 = L75-129 의 inline cell 렌더링을 `<EditableCell ...>` 호출로 추출. EditableGrid.tsx 의 다른 부분 (state 관리 L36-72, useReactTable L131-147, table markup L157-207) 은 보존.

**L0 type 정의** `tw-framework-front/src/types/tomis/grid.ts:43-49` (Grep 검증 완료):

```tsx
// L43: EditType — D1 widening 대상 (현 4종 + 'textarea' 추가)
export type EditType = 'text' | 'select' | 'date' | 'number';

// L45-49: EditableColumnMeta — column.meta 에 주입되는 형태
export interface EditableColumnMeta {
  editable?: boolean;
  editType?: EditType;
  selectOptions?: { label: string; value: string }[];
}
```

★ D1 명시: 본 Goal 은 monorepo 측에 `EditType = 'text' | 'number' | 'date' | 'select' | 'textarea'` 새로 정의. TOMIS 측 `EditableColumnMeta` 의 `EditType` widening 은 D2 EditableGrid refactor 시 동시 적용 (Section 11.4 R2).

### 1.2 L1 — TanStack v8 API (Cell rendering context — `references/tanstack-api-inventory.md`)

본 EditableCell 은 ColumnDef.cell 함수에서 호출되는 React 컴포넌트로, `useReactTable` 등 TanStack 표준 API 를 **직접 사용하지 않음**. 그러나 cellClassName callback type 시그니처 (`(cell: Cell<TData, unknown>) => string`) 는 TanStack `Cell<TData, TValue>` 타입을 참조 — `references/tanstack-api-inventory.md` §2 (ColumnDef.cell function signature) + §3 (Cell<TData, TValue> interface).

TanStack Cell 타입 인용 (canonical):
```ts
// @tanstack/react-table — Cell<TData, TValue>
export interface Cell<TData, TValue> {
  id: string;
  row: Row<TData>;
  column: Column<TData, TValue>;
  getValue(): TValue;
  renderValue(): TValue | null;
  // ... etc
}
```

본 G-003 의 `CellClassNameCallback<TData>` 는 위 타입에 직접 의존 — type-only import (`import type { Cell } from '@tanstack/react-table'`) — peer 추가 0건.

### 1.3 L2 — 공통 컴포넌트 분석 (현 8 variant 중 EditableGrid 1개)

`references/current-tanstack-analysis.md` §1 "EditableGrid: meta.editable/editType/selectOptions 기반 인라인 편집 패턴" — 8 variant 중 **EditableGrid 1개만 본 Goal 흡수 대상**. 다른 7 variant (BaseGrid/VirtualGrid/GroupedHeaderGrid/TreeGrid/ColumnPinGrid/ChangeTrackingGrid/RangeSelectGrid) 는 본 Goal 범위 외 (각자 다른 MOD-GRID 에서 처리).

**downstream 의존 분석**:
- MOD-GRID-10 ChangeTrackingGrid — `EditableCell` 흡수 후 ChangeTrackingGrid 가 동일 EditableCell 을 cell 렌더링에 사용 가능 (재사용성 확보 — D2 채택의 주요 이점).
- MOD-GRID-12 DataMap — `selectOptions` → DataMap.itemsSource 변환 패턴. EditableCell 의 `editType='select'` + `selectOptions` 시그니처가 baseline.

중복 패턴 추출 (EditableGrid 단일 파일 분석):
- **e.stopPropagation**: L0 ButtonCell/CheckCell/LinkCell/IconCell (G-002) 에서 사용 패턴. EditableGrid 의 `<input>/<select>` 은 row click 차단 필요성이 다름 — input focus 자체가 row click 을 비활성화 (focus state 우선). 본 EditableCell 에서도 row click handler 와 충돌 시 e.stopPropagation 적용 (Section 2.3 명시).
- **className 합성**: G-001/G-002 일관 `.filter(Boolean).join(' ')` 또는 `\`${a} ${b ?? ''}\`.trim()` 패턴. 본 EditableCell 도 동일.
- **Tailwind only (C-5)**: L0 EditableGrid L97-114 의 input/select className `w-full border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500` 보존. 인라인 style 0건.

### 1.4 L3 — 영향 사용처 카운트 (정확 N=1)

본 G-003 의 영향 사용처 (goals.json `affectedUsageFiles` 1건):
1. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` — body refactor (D2: editableColumns useMemo 의 inline JSX 를 `<EditableCell>` 호출로 교체)

**1 파일 ≤ C-19 한도 5** — 점진 마이그레이션 충족.

**downstream 잠재 사용처** (본 Goal 범위 외, 향후 Goal 들):
- `PayrollEditablePage.tsx` — EditableGrid 의 consumer (1 페이지). EditableGrid public API 보존 (D9) → 변경 0건.
- MOD-GRID-10 ChangeTrackingGrid — EditableCell 도입 후 재사용 가능 (별도 Goal 에서 처리).
- MOD-GRID-12 DataMap — EditableCell + selectOptions 패턴 baseline 활용 (별도 Goal).

### 1.5 R-A — AG Grid 동등 기능 (참조용, 코드 차용 X — C-7)

`references/publish-aggrid-analysis.md` § canonical-modules.json MOD-GRID-05 (L210-212):
- **agTextCellEditor**: input[type=text] 편집기. 본 EditableCell `editType='text'` 대응.
- **agNumberCellEditor**: input[type=number] 편집기. `editType='number'` 대응.
- **agSelectCellEditor**: `<select>` 편집기 + values 배열. `editType='select'` + `selectOptions` 대응.
- **agDateCellEditor**: input[type=date] 편집기. `editType='date'` 대응.
- **components prop map (cellRenderer registry)**: `components={{ statusBadge: StatusBadgeRenderer, ... }}` 패턴. **본 G-003 rendererRegistry 의 직접 baseline** — Record<string, CellComponent> 구조 일치.

본 G-003 의 5종 editType + registry 는 AG Grid 패턴과 **개념적 동등** (display + edit 통합 패턴). 차용 코드 0건 (라이선스 — C-7).

### 1.6 R-W — Wijmo 동등 기능 (참조용, 코드 차용 X — C-16)

`references/publish-wijmo-analysis.md` § canonical-modules.json MOD-GRID-05 (L214-217):
- **Cell Templates binding**: Wijmo `<wj-flex-grid-cell-template cellType="CellEdit">` (angular binding 식 + cellType 분기). React JSX 와 다른 paradigm — 본 G-003 은 React 함수 컴포넌트 + isEditing state 분기로 직접 구현.

C-16 (Wijmo 비도입) — Wijmo 패키지 import 0건, 패턴 학습용 참조만.

---

## Section 2: API 계약 (TypeScript strict — C-4)

### 2.1 EditType union — `packages/grid-renderers/src/EditableCell.tsx` (D1 widening)

```ts
/**
 * Edit mode input type — controls which native element is rendered.
 * L0 EditType (tw-framework-front/src/types/tomis/grid.ts:43) widened (additive) by 'textarea'.
 */
export type EditType = 'text' | 'number' | 'date' | 'select' | 'textarea';
```

5종 — Goal 제목 + AC-001 일치. L0 4종 → additive widening.

### 2.2 cellClassName callback type — `packages/grid-renderers/src/EditableCell.tsx` (D3 export)

```ts
import type { Cell } from '@tanstack/react-table';

/**
 * Grid-level callback for conditional cell formatting.
 *
 * This type is exported from `@tomis/grid-renderers` for future wiring by
 * MOD-GRID-01 (Grid wrapper) or MOD-GRID-04 (createColumns) — see ADR-MOD-GRID-05-002.
 *
 * Within G-003 scope: only the type is exported. EditableCell receives the
 * *resolved* string via `cellClassName?: string` prop (Section 2.3).
 */
export type CellClassNameCallback<TData> = (cell: Cell<TData, unknown>) => string;
```

★ D3 명시: 본 Goal 은 type export 만 — callback 의 실 호출 wiring (Grid level 에서 cell 별 호출 + 결과 주입) 은 MOD-GRID-01 또는 MOD-GRID-04 에서 처리. C-31 functional wiring audit 면제 조건 = "spec ADR 에 '이 Goal 범위 외' 명시" 충족.

### 2.3 EditableCell — `packages/grid-renderers/src/EditableCell.tsx` (D2 흡수 + D3 cell-level prop)

**Props interface**:

```ts
import type { ReactNode } from 'react';

export interface EditableCellProps {
  /** 현재 값 — 뷰 모드에서 표시. null/undefined → 빈 텍스트. */
  value: unknown;
  /** 편집 입력 타입 (D1 — 5종). */
  editType: EditType;
  /** editType='select' 시 옵션. 빈 배열 또는 undefined 시 EC-08 처리. */
  selectOptions?: ReadonlyArray<{ label: string; value: string }>;
  /** 편집 모드 여부 (외부 state). EditableGrid 와 같은 컨테이너가 cell 별 isEditing 관리. */
  isEditing: boolean;
  /** 편집 모드 진입 요청 (뷰 모드 셀 클릭 시 호출). */
  onStartEdit: () => void;
  /** 편집 확정 (Enter / Blur / Tab). 새 값을 string 으로 전달 — EditableGrid 가 타입 변환. */
  onCommit: (newValue: string) => void;
  /** 편집 취소 (Esc). */
  onCancel: () => void;
  /** 셀 식별 (logging/디버깅용 optional). */
  rowIndex?: number;
  /** 셀 식별 (logging/디버깅용 optional). */
  columnId?: string;
  /** 추가 Tailwind className — Grid level callback (D3) 호출 결과 주입 위치. */
  cellClassName?: string;
}
```

**Default values**:
- `selectOptions`: undefined (editType='select' 외 무시)
- `rowIndex` / `columnId`: undefined (logging 용 — 동작에 영향 0)
- `cellClassName`: undefined

**Return type**: `JSX.Element` — `<div>` (뷰 모드) 또는 `<input>` / `<select>` / `<textarea>` (편집 모드).

**Markup 패턴** (L0 L82-126 흡수 + cellClassName 합성):

```tsx
export function EditableCell({
  value, editType, selectOptions, isEditing,
  onStartEdit, onCommit, onCancel,
  cellClassName,
}: EditableCellProps): JSX.Element {
  const [draft, setDraft] = useState<string>(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  useEffect(() => { if (isEditing) { setDraft(String(value ?? '')); inputRef.current?.focus(); } }, [isEditing, value]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && editType !== 'textarea') onCommit(draft);
    else if (e.key === 'Escape') onCancel();
    else if (e.key === 'Tab') { e.preventDefault(); onCommit(draft); }
  }, [draft, editType, onCommit, onCancel]);

  const inputBase = 'w-full border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';

  if (isEditing) {
    if (editType === 'select') {
      const opts = selectOptions ?? [];
      return (
        <select ref={inputRef as React.RefObject<HTMLSelectElement>}
                value={draft} onChange={(e) => setDraft(e.target.value)}
                onBlur={() => onCommit(draft)} onKeyDown={handleKey}
                className={[inputBase, cellClassName ?? ''].filter(Boolean).join(' ')}>
          {opts.length === 0
            ? <option value="">(옵션 없음)</option>
            : opts.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      );
    }
    if (editType === 'textarea') {
      return (
        <textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={draft} onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => onCommit(draft)} onKeyDown={handleKey}
                  className={[inputBase, 'min-h-[3rem]', cellClassName ?? ''].filter(Boolean).join(' ')} />
      );
    }
    const htmlType = editType === 'number' ? 'number' : editType === 'date' ? 'date' : 'text';
    return (
      <input ref={inputRef as React.RefObject<HTMLInputElement>}
             type={htmlType} value={draft}
             onChange={(e) => setDraft(e.target.value)}
             onBlur={() => onCommit(draft)} onKeyDown={handleKey}
             className={[inputBase, cellClassName ?? ''].filter(Boolean).join(' ')} />
    );
  }

  return (
    <div className={['min-h-[1.5rem] cursor-text px-1 rounded hover:bg-blue-50 hover:ring-1 hover:ring-blue-200',
                     cellClassName ?? ''].filter(Boolean).join(' ')}
         onClick={onStartEdit}>
      {String(value ?? '')}
    </div>
  );
}
```

**핵심 변경 vs L0**:
- editingCell state 가 외부 (EditableGrid) 소유 — EditableCell 은 `isEditing` prop 수용. draft 만 내부 state.
- Esc/Enter/Tab 처리 동일 (L0 L65-72 보존).
- textarea 추가 (D1) — Enter 가 줄바꿈 (editType='textarea' 시 commit 안 함). Tab/Blur 로만 commit.
- selectOptions 빈 배열 처리 (EC-08) — L0 L89 의 `meta.selectOptions` truthy 체크 보강.

### 2.4 rendererRegistry — `packages/grid-renderers/src/rendererRegistry.ts` (D4)

```ts
import type { ComponentType } from 'react';
import type { Row, Column } from '@tanstack/react-table';
import { TextCell } from './TextCell.js';
import { NumberCell } from './NumberCell.js';
import { DateCell } from './DateCell.js';
import { StatusBadgeCell } from './StatusBadgeCell.js';
import { LinkCell } from './LinkCell.js';
import { ButtonCell } from './ButtonCell.js';
import { CheckCell } from './CheckCell.js';
import { IconCell } from './IconCell.js';
import { TagCell } from './TagCell.js';
import { AvatarCell } from './AvatarCell.js';
import { ProgressCell } from './ProgressCell.js';

/**
 * Cell component contract — display mode renderer.
 *
 * Compatible with TanStack ColumnDef.cell context (row + column) via optional props.
 */
export interface CellComponentProps {
  value: unknown;
  row?: Row<unknown>;
  column?: Column<unknown, unknown>;
}

export type CellComponent = ComponentType<CellComponentProps>;

/**
 * Default registry — pre-registered display-mode renderers (G-001 + G-002 — 11 components).
 *
 * EditableCell is NOT in this registry — it is an *edit-mode wrapper* triggered by
 * `meta.editable`, orthogonal to display type (see D4).
 */
export const defaultRendererRegistry: Record<string, CellComponent> = {
  text: TextCell as CellComponent,
  number: NumberCell as CellComponent,
  date: DateCell as CellComponent,
  dateTime: DateCell as CellComponent,        // alias — MOD-GRID-04 type:'dateTime'
  badge: StatusBadgeCell as CellComponent,
  statusBadge: StatusBadgeCell as CellComponent,  // alias
  link: LinkCell as CellComponent,
  button: ButtonCell as CellComponent,
  checkbox: CheckCell as CellComponent,
  check: CheckCell as CellComponent,           // alias
  icon: IconCell as CellComponent,
  tag: TagCell as CellComponent,
  avatar: AvatarCell as CellComponent,
  progress: ProgressCell as CellComponent,
};

/** Mutable registry instance — module-level singleton for register/get helpers. */
const registryInstance: Record<string, CellComponent> = { ...defaultRendererRegistry };

/**
 * Register a custom renderer under a type key. Overrides the default if key collides.
 *
 * @example
 *   registerRenderer('priority', MyPriorityCell);
 *   createColumns([{ id: 'p', type: 'priority' }])
 */
export function registerRenderer(type: string, component: CellComponent): void {
  registryInstance[type] = component;
}

/**
 * Look up a registered renderer. Returns undefined if no renderer matches.
 * Consumer (MOD-GRID-04 createColumns) decides fallback behavior.
 */
export function getRenderer(type: string): CellComponent | undefined {
  return registryInstance[type];
}
```

★ D4 명시: `Record<string, CellComponent>` (Map 아님 — 정적 config + tree-shaking 친화). 11 pre-registered + alias 4 (dateTime/statusBadge/check 등) = 14 키. 외부 `registerRenderer` 가 mutable 변경 — MOD-GRID-04 createColumns 가 module load 시점에 호출 가능.

★ **as CellComponent cast 정당화** (C-4 strict 위반 아님): 각 cell 컴포넌트 (TextCell 등) 의 props 가 `{ value: SpecificType; ... }` 형태로 `CellComponentProps` 의 `{ value: unknown }` 와 contravariant 관계 — TypeScript 가 자동 변환 못 함. `as CellComponent` cast 는 well-typed widening (`as any` 아님 — `as CellComponent` 는 named type assertion). C-4 의 `: any | <any> | as any` 금지 대상 외.

### 2.5 EditableCell 외부 의존 — `packages/grid-renderers/src/EditableCell.tsx`

```ts
import { useState, useEffect, useCallback, useRef, type KeyboardEvent } from 'react';
import type { JSX } from 'react';
```

추가 의존 0건. React 만 (peer 기존재). TanStack 직접 의존 없음 (cellClassName type 만 type-only import).

### 2.6 Export 경로 (B-04)

`packages/grid-renderers/src/index.ts` (MODIFY — G-002 후 현재 13 export + 21 type → 4 신규 export + 5 신규 type 추가):

```ts
// G-001 + G-002 기존 (보존)
export { TextCell, type TextCellProps } from './TextCell.js';
export { NumberCell, type NumberCellProps } from './NumberCell.js';
export { DateCell, type DateCellProps } from './DateCell.js';
export {
  formatNumberString,
  formatDateTimeFromDateTimeString,
  type FormatNumberOptions,
  type FormatDateTimeOptions,
} from './formatters.js';
export { StatusBadgeCell, type StatusBadgeCellProps } from './StatusBadgeCell.js';
export { LinkCell, type LinkCellProps } from './LinkCell.js';
export { ButtonCell, type ButtonCellProps } from './ButtonCell.js';
export { CheckCell, type CheckCellProps } from './CheckCell.js';
export { IconCell, type IconCellProps } from './IconCell.js';
export { TagCell, type TagCellProps } from './TagCell.js';
export { AvatarCell, type AvatarCellProps } from './AvatarCell.js';
export { ProgressCell, type ProgressCellProps } from './ProgressCell.js';

// G-003 신규
export {
  EditableCell,
  type EditableCellProps,
  type EditType,
  type CellClassNameCallback,
} from './EditableCell.js';
export {
  defaultRendererRegistry,
  registerRenderer,
  getRenderer,
  type CellComponent,
  type CellComponentProps,
} from './rendererRegistry.js';
```

**소비자 import**: `@tomis/grid-renderers` (`packages/grid-renderers/package.json:2`).

### 2.7 사용 예시 (최소 2개 — B-02)

**예시 A — EditableGrid 내부 (D2 refactor)**:
```tsx
import { EditableCell, type EditType } from '@tomis/grid-renderers';

// editableColumns useMemo 내부 (Section 11.2 AFTER):
const editableColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
  return columns.map((col) => {
    const meta = col.meta as EditableColumnMeta | undefined;
    if (!meta?.editable) return col;
    return {
      ...col,
      cell: (ctx) => {
        const rowIndex = ctx.row.index;
        const colId = ctx.column.id;
        const value = ctx.getValue();
        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colId === colId;
        return (
          <EditableCell
            value={value}
            editType={(meta.editType ?? 'text') as EditType}
            selectOptions={meta.selectOptions}
            isEditing={isEditing}
            onStartEdit={() => startEdit(rowIndex, colId, value)}
            onCommit={(newValue) => { setEditValue(newValue); commitEdit(); }}
            onCancel={cancelEdit}
            rowIndex={rowIndex}
            columnId={colId}
          />
        );
      },
    };
  });
}, [columns, editingCell, startEdit, commitEdit, cancelEdit]);
```

**예시 B — rendererRegistry use (MOD-GRID-04 createColumns 미래 의존 — 본 Goal 의 baseline)**:
```ts
import { defaultRendererRegistry, registerRenderer, getRenderer } from '@tomis/grid-renderers';

// 외부에서 커스텀 renderer 등록 (F-05-06):
registerRenderer('priority', MyPriorityCell);

// MOD-GRID-04 createColumns 가 type 분기 시:
const renderer = getRenderer(col.type);  // 'badge' → StatusBadgeCell, 'priority' → MyPriorityCell
if (renderer) {
  columnDef.cell = (ctx) => createElement(renderer, { value: ctx.getValue(), row: ctx.row, column: ctx.column });
}
```

### 2.8 ref API (B-05 — N/A)

EditableCell 은 외부 ref 가 필요한 imperative API 없음 — 편집 모드 진입 시 내부 inputRef 가 자동 focus. EditableCell 외부 ref API B-05 = N/A. rendererRegistry 도 함수 helper (registerRenderer/getRenderer) — ref 불필요.

---

## Section 3: 기존 사용처 대응표 (Migration Table — D-02)

| 기존 (L0 — TOMIS EditableGrid.tsx) | 신규 API (monorepo `@tomis/grid-renderers`) | 마이그레이션 액션 |
|------------------------------------|---------------------------------------------|------------------|
| `EditableGrid.tsx` L75-129 의 `editableColumns` useMemo 내부 inline `<input>/<select>` JSX | `<EditableCell value editType selectOptions isEditing onStartEdit onCommit onCancel cellClassName?>` | EditableGrid.tsx body refactor (D2) — L82-126 의 inline cell 함수를 `<EditableCell>` 호출로 교체. EditableGrid 의 public props (data/columns/onDataChange/pagination/loading/emptyText/className) 보존 → 사용처 (PayrollEditablePage) 변경 0건 |
| `EditableColumnMeta { editable, editType, selectOptions }` (`grid.ts:45-49`) | 동일 (변경 0건 — TOMIS 측 type 보존) | type 변경 0건. monorepo `EditType` 가 widening (additive — `'textarea'` 추가) — TOMIS `EditableColumnMeta.editType: EditType` 의 widening 은 D2 refactor 동시 적용 (선택) 또는 본 Goal 후속 처리 (Section 11.4 R2) |
| (현 미존재) `rendererRegistry` 패턴 | `defaultRendererRegistry` + `registerRenderer` + `getRenderer` (D4) | 신규 — 흡수 대상 0. MOD-GRID-04 createColumns 가 향후 consumer (본 Goal baseline) |
| (현 미존재) `cellClassName` callback | `CellClassNameCallback<TData>` type export (D3) | 신규 — 흡수 대상 0. Grid-level wiring 은 MOD-GRID-01 또는 MOD-GRID-04 별도 Goal |

**downstream 미흡수 항목** (본 Goal 범위 외): MOD-GRID-10 ChangeTrackingGrid 내부의 인라인 편집 — 별도 Goal 에서 EditableCell 재사용 마이그레이션.

---

## Section 4: 호환성 정책 (Compatibility — D-03/D-04)

### 4.1 Breaking change

**No breaking — additive + internal refactor** (goals.json L178 `compatibilityPolicy.breaking = false`).

증거:
- D1: monorepo `EditType` 5종 — additive widening (4종 → 5종, 기존 4종 그대로). 사용처 `PayrollEditablePage.tsx` 는 `'textarea'` 미사용 → 영향 0건.
- D2: EditableGrid.tsx body refactor — public props (data/columns/onDataChange/pagination/loading/emptyText/className) 시그니처 보존 + 동작 보존. **내부 implementation 만 교체** (inline JSX → `<EditableCell>` 호출). 외부 관찰 동작 동등.
- D3: cellClassName type export — additive (신규 API, 기존 consumer 0).
- D4: rendererRegistry — additive (신규 API, 기존 consumer 0).
- D9: 사용처 1 (PayrollEditablePage) — EditableGrid public API 보존 → build 영향 0건.

### 4.2 Deprecation 전략 (C-23 의무 — 1 minor alias 유지)

- **EditableGrid.tsx**: refactor 후에도 동일 import path (`tw-framework-front/.../components/tomis/Grid/EditableGrid`) 유지. 1 minor alias 의무 충족 (path 변경 0 → alias 개념 적용 불필요 — refactor 만).
- **D1 EditType 4종 → 5종**: 5종 union 이 4종을 포함하므로 deprecation 없음 (subset 호환).
- **deprecation 대상 0건** — 본 Goal 은 신규 추가 + 내부 refactor 만.
- alias 제거 시점 = N/A (alias 자체가 없음).

### 4.3 Migration path

```
[현재 — G-002 완료 시점]
import EditableGrid from '../../../components/tomis/Grid/EditableGrid';  (PayrollEditablePage)
EditableGrid 내부에서 inline <input>/<select> 렌더

↓ (본 G-003 후 — body refactor, 사용처 코드 변경 0)
import EditableGrid from '../../../components/tomis/Grid/EditableGrid';  (그대로)
EditableGrid 내부에서 <EditableCell> 호출로 위임

↓ (MOD-GRID-10 / MOD-GRID-04 / MOD-GRID-01 향후)
EditableCell 직접 사용 (ChangeTrackingGrid 내부) + rendererRegistry 등록 (createColumns type 자동 분기)
```

### 4.4 peerDependencies 정책 (C-22)

`packages/grid-renderers/package.json:23-27` 기존재 — 본 G-003 변경 0건:
```json
"peerDependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "@tanstack/react-table": ">=8.0.0 <9.0.0"
}
```

`@tanstack/react-table` 은 cellClassName type 의 `Cell<TData>` 만 type-only import — runtime 의존 없음. 기존 peer 충분.

C-9/C-20 ADR 추가 필요 0건 — 신규 dependency 0.

---

## Section 5: 인수 기준 (Acceptance Criteria — C-01~C-05)

| ID | Criteria | Source (출처 태그) | migrationImpact 태그 | 검증 방법 |
|----|----------|-------------------|---------------------|----------|
| **AC-001** | EditableCell — Section 2.3 interface. `editType: 'text' \| 'number' \| 'date' \| 'select' \| 'textarea'` (D1 — 5종) 각각 `<input type="text">`, `<input type="number">`, `<input type="date">`, `<select>`, `<textarea>` 렌더. L0 EditableGrid.tsx L82-126 의 input/select 분기 패턴 보존 (D2 흡수) | L0 (Section 1.1 EditableGrid.tsx L82-126 인용) + D1 | high | tsc 통과 + Storybook story (5 editType variant) + Section 12.2 finding |
| **AC-002** | 뷰모드/편집모드 전환 — EditableCell `isEditing` prop + `onStartEdit` callback. 편집모드 진입 시 inputRef.focus (Section 2.3 useEffect). Enter/Tab/Blur → `onCommit(draft)` 호출 (textarea 는 Enter 줄바꿈 보존). Esc → `onCancel` 호출. L0 EditableGrid.tsx L42-72 패턴 흡수 | L0 (Section 1.1 startEdit/commitEdit/cancelEdit/handleKeyDown 인용) | high | Storybook story (편집 진입 / Enter commit / Esc cancel / Tab commit / textarea Enter 줄바꿈) + finding 편집 플로우 5단계 검증 |
| **AC-003** | onCommit callback prop — `(newValue: string) => void`. EditableCell 은 string 만 emit (호출처가 number/date 타입 변환 책임). EditableGrid 의 `onDataChange?(rowIndex, colId, value)` (L18) 가 호출처 — D2 refactor 시 EditableCell.onCommit 결과를 string 으로 받아 setEditValue + commitEdit | L0 EditableGrid.tsx:18 + L48-58 + C-4 | high | tsc strict 통과 (`onCommit: (newValue: string) => void` 명시 — any 0건) |
| **AC-004** | cellClassName?: string Tailwind class prop — EditableCell 의 모든 markup (뷰모드 div / select / textarea / input) 의 className 에 `.filter(Boolean).join(' ')` 합성. Grid-level callback wiring (`CellClassNameCallback<TData>` type export 만 — D3) — 실 호출/주입은 본 Goal 범위 외 (ADR-MOD-GRID-05-002) | F-05-04 + C-5 + D3 | high | Storybook story (cellClassName='bg-yellow-50' 조건부 포매팅 데모) + tsc strict 통과 |
| **AC-005** | rendererRegistry export — `defaultRendererRegistry: Record<string, CellComponent>` (11 cells + 4 alias = 14 키) + `registerRenderer(type, component): void` + `getRenderer(type): CellComponent \| undefined`. 외부에서 커스텀 type 등록 가능 (F-05-06). EditableCell 은 registry IN 아님 (D4 — display vs edit 직교) | F-05-06 + D4 | high | tsc 통과 + Storybook story (custom renderer 등록 후 getRenderer 조회) + finding registry 무결성 검증 |
| **AC-006** | C-18 virtualization 호환 — EditableCell 절대 위치 (`position: absolute`) 0건. 부모 td 의 normal flow 따름. height: auto + min-h-[1.5rem] (뷰모드) / min-h-[3rem] (textarea). estimateSize 호환 — react-virtual 의 dynamic measurement 와 정상 동작 | C-18 | high | finding C-18 호환 분석 — markup 절대 위치 없음 입증 + react-virtual 통합 시나리오 placeholder story |
| **AC-007** | Storybook story (C-25) — `EditableCell.stories.tsx` 1 파일에 5 editType variant + cellClassName variant + 편집 플로우 (view→edit→commit/cancel) 데모 포함. monorepo Storybook 인프라 미구비 → placeholder pattern (G-001/G-002 D8 일관) | C-25 + D8 | high | Storybook build 통과 — 인프라 미구비 시 placeholder file 존재 (`pnpm typecheck` 0 errors) |
| **AC-008** | C-17 시각 회귀 — EditableGrid.tsx D2 refactor 의 view/edit 모드 외관 동등 검증. Method B 변형 (구조적 동등성 + JSX 토큰 매핑 + **편집 플로우 5단계 state transition 동등성** — D8 강화). `findings/auto-fixed/MOD-GRID-05-G-003-visual-regression.md` 작성 — JSX 토큰 + className + state machine 동등성 분석 | C-17 + G-001/G-002 finding precedent (D8) + advisor #2 | high | finding 파일 작성 — Before (L0 EditableGrid L82-126) vs After (EditableCell + D2 refactor) state transition table |

**호환성 검증 AC** (C-05 의무): AC-001 + AC-002 + AC-008 의 "L0 패턴 보존" 항목이 영향 사용처 1개 외관 보존 의무 포함. AC-008 가 외관 회귀 검증의 정식 entry.

**모든 AC 출처 태그 의무 (H-03)**:
- AC-001 → L0 (Section 1.1 EditableGrid.tsx L82-126 인용) + D1
- AC-002 → L0 (Section 1.1 startEdit/commitEdit/cancelEdit/handleKeyDown 인용)
- AC-003 → L0 EditableGrid.tsx:18 (onDataChange prop) + L48-58 (commitEdit)
- AC-004 → F-05-04 (canonical-modules.json MOD-GRID-05 L222) + C-5 + D3
- AC-005 → F-05-06 (canonical-modules.json L224) + D4
- AC-006 → C-18 (Section 9 명시)
- AC-007 → C-25 (Section 13 문서 의무) + D8
- AC-008 → C-17 + G-001/G-002 finding (Section 12.2) + D8

모든 출처 태그가 spec 본문 다른 섹션에서 직접 인용됨 — H-03 cross-consistency 충족.

---

## Section 6: 엣지 케이스 (Edge Cases — E-04 최소 3개, 본 spec 12개)

| EC | 시나리오 | 처리 | 출처 |
|----|---------|------|------|
| **EC-01** | `EditableCell value=null \| undefined` (뷰모드) | `String(value ?? '')` → 빈 텍스트 + min-h-[1.5rem] 으로 클릭 영역 확보 — L0 EditableGrid.tsx:123 보존 | L0:123 |
| **EC-02** | `editType='select' + selectOptions=undefined` | `opts ?? []` → 빈 배열 → `<option value="">(옵션 없음)</option>` placeholder 렌더 (Section 2.3 markup) — L0 의 `meta.selectOptions` truthy 체크 보강 | D1 + Section 2.3 |
| **EC-03** | `editType='select' + selectOptions=[]` (빈 배열) | EC-02 동일 처리 — placeholder option | Section 2.3 |
| **EC-04** | `editType='textarea' + Enter 키` | textarea 분기 시 Enter 는 줄바꿈 (handleKey 가 textarea 시 commit 안 함 — `editType !== 'textarea'` 조건). Tab/Blur 만 commit | D1 + AC-002 |
| **EC-05** | Esc 키 — 편집 취소 | `onCancel` 호출 — 부모 (EditableGrid) 가 editingCell 을 null 로 setState → isEditing=false → 뷰모드 복귀. draft state 는 다음 편집 진입 시 useEffect 로 재초기화 (Section 2.3 L11) | L0:60-63 + L0:65-72 |
| **EC-06** | 빠른 편집 전환 race condition (셀A 편집 중 셀B 클릭) | 셀B 의 onStartEdit → 부모가 editingCell={B} 로 setState → 셀A 의 isEditing=false → onBlur 발생 → commit 호출. 셀B 의 isEditing=true → useEffect → draft 초기화 + focus. **순서 보장**: React state 업데이트 batch — blur (commit) 가 새 isEditing 보다 늦게 처리되어 race 가능 → spec 명시: EditableGrid (D2 refactor) 가 editingCell setState 전 현 cell commit 호출 (L0 의 onBlur 패턴 보존) | L0:51-58 (commitEdit 가 setData immutable patch) + advisor |
| **EC-07** | `editType='number' + value` 가 string ("12.5") | L0 EditableGrid.tsx:108 `type={meta.editType === 'number' ? 'number' : ...}` — input[type=number] 가 string draft 수용 (HTML 표준 — browser 가 numeric validation). onCommit 은 string emit — 호출처가 Number() 변환 책임 (AC-003 명시) | L0:108 + AC-003 |
| **EC-08** | `editType='date' + value` 가 Date object (ISO string 아님) | `String(value)` → `'Wed Jan 01 2025...'` 형식 → input[type=date] 가 거부 (yyyy-mm-dd 만 수용). EditableGrid (D2 refactor) 가 ISO string 변환 책임 (현 L0 동작 동등 — L0:44 `String(currentValue ?? '')`) | L0:44 |
| **EC-09** | `cellClassName=undefined` | `.filter(Boolean).join(' ')` 가 falsy 제거 → 기본 Tailwind class 만 적용 (Section 2.3 일관) | Section 2.3 |
| **EC-10** | `registerRenderer('text', CustomText)` — default 키 override | `registryInstance['text'] = CustomText` — defaultRendererRegistry 의 TextCell 을 덮어씀. spec 명시: 의도된 동작 (외부 커스터마이즈) | D4 + AC-005 |
| **EC-11** | `getRenderer('unknown-type')` | `undefined` 반환 — 호출처 (MOD-GRID-04 createColumns) 가 fallback (TextCell 또는 raw value) 결정 책임 | D4 + Section 2.4 |
| **EC-12** | `EditableCell` 가 React.memo 적용된 cell context 안에서 isEditing toggle | useEffect dependency `[isEditing, value]` 가 변경 감지 → draft 재초기화 + focus. React.memo 가 props 비교 시 isEditing 변경은 항상 re-render 트리거 → 정상 동작 | Section 2.3 |

12개 ≥ 3 (E-04 충족).

**환경 의존 AC ↔ EC 매핑** (specify-rubric E-04 권장):
| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-007 (Storybook story) | (G-001/G-002 D8 동일) | monorepo Storybook 인프라 미구비 시 placeholder stories (D8 — ADR-MOD-GRID-00-003) |
| AC-008 (시각 회귀 finding) | EC-04 + EC-05 + EC-06 (편집 플로우 state transition) | finding 의 편집 플로우 5단계 분석이 본 EC 3종 동작을 case-by-case 입증 |

---

## Section 7: 구현 대상 파일 (NEW/MODIFY 표 — E-01)

★ C-28 (path prefix) 정합성 — goals.json `implementFiles[]` (L182-186) 의 `topvel-grid-monorepo/packages/grid-renderers/` prefix 가 monorepo 실제 위치와 일치 확인됨 (`D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/` Glob 결과: AvatarCell/ButtonCell/CheckCell/DateCell/IconCell/LinkCell/NumberCell/ProgressCell/StatusBadgeCell/TagCell/TextCell.tsx + formatters.ts + index.ts + __stories__/ 모두 존재 — G-001 + G-002 산출물). spec 정정 결정 불필요.

| # | 경로 | 유형 | 변경 범위 | 출처 |
|---|------|------|----------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/EditableCell.tsx` | NEW | Section 2.1 (EditType) + Section 2.2 (CellClassNameCallback) + Section 2.3 (EditableCell + Props interface + 함수 컴포넌트 ~80 라인 예상 — L0 EditableGrid L75-129 흡수 + textarea 추가) | D1, D2, D3, D7 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/rendererRegistry.ts` | NEW | Section 2.4 (CellComponentProps + CellComponent type + defaultRendererRegistry + registerRenderer + getRenderer ~45 라인 예상) | D4, D7 |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/index.ts` | MODIFY | G-001 + G-002 export 12개 + 16 type 보존 + Section 2.6 의 신규 4 export + 5 신규 type 추가 (현 26 라인 → 약 36 라인 예상) | D7 (★ MODIFY — G-001 + G-002 산출 보존) |
| 4 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` | MODIFY | body refactor (D2) — editableColumns useMemo (L75-129) 의 inline JSX 를 `<EditableCell>` 호출로 교체. public props + state 관리 (L34-72) + useReactTable + table markup (L131-207) 보존 | D2, D7, Section 11.2 |

**합계: NEW 2 + MODIFY 2 = 4 파일** (D7 breakdown 정확 일치).

**Section 7 ↔ Section 11 cross-check (E-01 v1.0.3)**: Section 11.3 의 모든 Step 에 위 4 파일이 빠짐없이 등장 — Section 11 진입 시 확인. 본 spec 본문 "재결정" 또는 "대체" 표현 0건 → E-06 위반 잠재성 0.

**부가 자료 (Section 12.2 finding + Storybook stories — Section 7 표 외)**:
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/auto-fixed/MOD-GRID-05-G-003-visual-regression.md` (NEW — D8, AC-008)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/__stories__/EditableCell.stories.tsx` (NEW — AC-007, placeholder)

이 부가 자료는 Section 7 표 4 파일과 분리 — implement-report 의 부속 산출물 (G-001/G-002 패턴 일관). implementFiles 외 finding+stories 는 verify 단계 보조 증거.

---

## Section 8: 마이그레이션 영향도 Pre-flight (D-01/D-05/D-06)

### 8.1 영향 사용처 카운트 (D-01)

**1 / 23 total** (전체 tw-framework-front 영향 23 페이지 vs 본 G-003 직접 영향 1 파일).

본 G-003 의 affectedUsageFiles (goals.json L187-189 그대로):
1. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` (MODIFY — Section 7 #4, D2 body refactor)

1개 ≤ C-19 한도 5 — 점진 마이그레이션 충족.

**D9 검증 게이트 — EditableGrid 사용처 grep (spec writer 사전 검증 완료)**: `Grep "EditableGrid|EditType|EditableColumnMeta" tw-framework-front/src --include=*.tsx --include=*.ts` 결과 3 파일:
- `tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx:8` — `import type { EditableColumnMeta }`. EditableGrid 의 column meta 만 import. public props (data/columns/onDataChange/...) 시그니처 보존되므로 build 영향 0건.
- `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` — 본 Goal MODIFY 대상.
- `tw-framework-front/src/types/tomis/grid.ts:43-49` — `EditType` + `EditableColumnMeta` 타입 정의. D1 widening 의 monorepo 측 정의는 추가, TOMIS 측 정의는 본 Goal 에서 변경 0 (Section 11.4 R2 향후 정정).

**MOD-GRID-17 부수 영향** (본 Goal 직접 범위 외): PayrollEditablePage 는 EditableGrid 의 public API 만 의존 — D2 refactor 후에도 동작 동등. 페이지 변경 0건.

### 8.2 무파괴 검증 방법 (C-17 — high impact 의무, D8)

- **tsc** (`pnpm typecheck` — monorepo + `tw-framework-front` 양쪽 0 errors)
- **Storybook story (AC-007)** — `EditableCell.stories.tsx` 1 placeholder 파일 (5 editType variant + cellClassName variant + 편집 플로우 데모). G-001/G-002 패턴 일관.
- **Visual regression Method B 변형 (D8 강화)** — `findings/auto-fixed/MOD-GRID-05-G-003-visual-regression.md` 작성. **EditableGrid.tsx Before (L82-126 inline) vs After (`<EditableCell>` 호출)** 의 JSX 토큰 + className 동등성 + **편집 플로우 5단계 state transition** 동등성 분석:
  1. 뷰모드 진입 (data render)
  2. 셀 클릭 → 편집모드 진입 (onClick → onStartEdit → isEditing=true → useEffect focus)
  3. 입력 + Enter → commit (onKeyDown → onCommit → 부모 setState → isEditing=false → 뷰모드 복귀)
  4. 입력 + Esc → cancel (onKeyDown → onCancel → 부모 setState → 뷰모드 복귀)
  5. 입력 + Tab → commit + 다음 셀 focus (advisor 명시 — Tab 처리는 부모 책임, EditableCell 은 commit 만)

**외부 디렉토리 N/A — H-02 예외 (조부모 실재 입증)**: monorepo 외부 디렉토리 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/` 는 G-001/G-002 시점에 이미 생성됨 (Glob 결과 11 .tsx + formatters.ts + index.ts + __stories__/ — 모두 존재 입증). 본 Goal 은 src/ 파일 2개 추가 + index.ts 1개 수정만 + TOMIS 1개 수정 — 부모 디렉토리 신규 생성 아님. H-02 외부 디렉토리 예외 절차 (조부모 실재 입증) 불필요.

### 8.3 점진 마이그레이션 vs 일괄 (C-19)

본 Goal 영향 사용처 1개 = 1 (C-19 한도 5 충분 여유). 1 Goal 한 번에 처리. 분할 불필요.

### 8.4 롤백 전략 (D-05)

- **신규 파일** (Section 7 #1 EditableCell.tsx + #2 rendererRegistry.ts): `Remove-Item` 으로 단순 삭제 → monorepo 무손상.
- **MODIFY 파일** (Section 7 #3 index.ts): git revert (또는 G-002 마지막 상태로 부분 revert — diff 명확 — G-002 26 라인 → G-003 36 라인 → revert 시 26 라인).
- **MODIFY 파일** (Section 7 #4 EditableGrid.tsx): git revert 1 커밋 — body refactor 만이므로 revert 시 L0 inline JSX 복귀 + monorepo EditableCell import 제거. 사용처 (PayrollEditablePage) 는 EditableGrid public API 만 의존 → revert 후에도 build 0 error.

### 8.5 번들 크기 영향 (D-06 + ADR-MOD-GRID-00-010 의무 1줄)

★ **bundle estimation NOT extrapolated from prior Goals (different size profile may apply — EditableCell 은 stateful interactive component 로 G-001 leaf renderer / G-002 UI cell 보다 무거움 — useState/useEffect/useCallback/useRef + 3종 element 분기) — measurement at IMPLEMENT time only per ADR-MOD-GRID-00-010.**

- spec 예상 (참조용만): **+2 KB** (EditableCell ~80 라인 + rendererRegistry ~45 라인, goals.json bundleImpact L191)
- 한도: `@tomis/grid-renderers` brotli ≤ **10 KB** (`.size-limit.json:11`)
- G-001 + G-002 누적 추정 (참고): G-002 finding 명시 추정치 — 현 실측치는 IMPLEMENT 단계에서 `pnpm size-limit` 직후 확인. 본 G-003 추가 후 누적 한도 도달 가능
- 게이트: IMPLEMENT 직후 `pnpm size-limit` exit 0 (AC-007 보조). spec 예상값은 metric 참조용 — 게이트 아님

**한도 초과 시 대응 옵션** (G-002 D5 동일 — 본 Goal 범위 외 옵션 명시):
1. sub-entry 분할 (예: `@tomis/grid-renderers/editable` vs `@tomis/grid-renderers/display`) — tree-shaking 으로 사용처 별 부분 import
2. `.size-limit.json` 한도 상향 (사용자 승인 필요 — C-21 +100 KB 초과 시)
3. rendererRegistry 의 alias 4 (dateTime/statusBadge/check/check) 축소 — minor

본 G-003 측정 결과는 MOD-GRID-04 / MOD-GRID-10 spec 의 baseline.

---

## Section 9: 의존성 (peerDeps / deps / devDeps — C-22)

### 9.1 peerDependencies (변경 0건 — 기존재)

`packages/grid-renderers/package.json:23-27` 기존재 — 본 G-003 변경 없음:
```json
"peerDependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "@tanstack/react-table": ">=8.0.0 <9.0.0"
}
```

`@tanstack/react-table` 은 cellClassName type 의 `Cell<TData, unknown>` + rendererRegistry 의 `Row<unknown>` / `Column<unknown, unknown>` 만 type-only import (`import type { Cell, Row, Column }`) — runtime 의존 없음. 기존 peer 충분.

### 9.2 dependencies (직접 의존)

`packages/grid-renderers/package.json` — `dependencies` 필드 없음 (변경 0건). 외부 라이브러리 0건.

### 9.3 devDependencies

기존재 (`tsup`, `typescript`, `@types/react`, etc. — monorepo root 또는 grid-renderers package). 본 Goal 추가 0건.

### 9.4 C-9/C-20 ADR

신규 dependency 0건 → ADR 추가 불필요. 단, **ADR-MOD-GRID-05-002 작성 권장** — D3 cellClassName scope split 결정 기록 (Grid-level wiring 후속 Goal 책임 명시). 본 Goal IMPLEMENT 단계에서 작성.

---

## Section 10: 사용자 여정 (User Journey)

### 10.1 페이지 개발자 (TOMIS consumer — PayrollEditablePage 등)

```
1. 기존 사용 코드 변경 0 — EditableGrid 의 public API (data/columns/onDataChange/...) 보존
2. column.meta = { editable: true, editType: 'textarea', selectOptions: [...] } 처럼
   D1 widening 의 'textarea' editType 도 사용 가능 (additive — 기존 4종 그대로)
3. 향후 (MOD-GRID-04 / MOD-GRID-01) — createColumns type 분기 자동 + Grid wrapper 가 cellClassName callback 호출 자동
```

### 10.2 monorepo 내부 개발자 (downstream MOD-GRID-XX)

```
1. import { EditableCell, type EditableCellProps, type EditType } from '@tomis/grid-renderers';
2. ChangeTrackingGrid (MOD-GRID-10) — EditableCell 재사용 (D2 의 EditableGrid 패턴 복제)
3. createColumns (MOD-GRID-04) — rendererRegistry.getRenderer(col.type) 로 display 분기 자동
4. Grid wrapper (MOD-GRID-01) — cellClassName?: CellClassNameCallback<TData> prop 수용 →
   cell 별 호출 결과를 createColumns 가 EditableCell.cellClassName 으로 주입
```

### 10.3 최종 사용자 (TOMIS 페이지 사용자)

```
1. 그리드 셀 클릭 → 편집 모드 진입 (input/select/textarea/date picker 즉시 focus)
2. 입력 + Enter (textarea 외) / Tab / 다른 셀 클릭 → 자동 저장
3. Esc → 편집 취소 + 원래 값 복귀
4. cellClassName 조건부 포매팅 (예: 음수는 빨강 배경) — 향후 Goal
```

---

## Section 11: 구현 계획 (Implementation Plan — E-02/E-03)

### 11.1 파일별 변경 명세 (Section 7 cross-reference)

위 Section 7 표 4행 = 본 Section 11 Step 1~4 의 변경 대상. **Step 1~4 가 enumerate 하는 모든 MODIFY/NEW 파일은 Section 7 표에 1:1 매칭됨** (E-01 v1.0.3 cross-check 의무 충족).

### 11.2 Before/After 코드 스니펫 (E-02 최소 1개)

**Before — `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` L75-129** (L0 인용 — Section 1.1 재인용):

```tsx
const editableColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
  return columns.map((col) => {
    const meta = col.meta as EditableColumnMeta | undefined;
    if (!meta?.editable) return col;
    return {
      ...col,
      cell: (ctx) => {
        const rowIndex = ctx.row.index;
        const colId = ctx.column.id;
        const value = ctx.getValue();
        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colId === colId;
        if (isEditing) {
          if (meta.editType === 'select' && meta.selectOptions) {
            return (
              <select ref={inputRef as React.RefObject<HTMLSelectElement>}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit} onKeyDown={handleKeyDown}
                      className="w-full border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                {meta.selectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            );
          }
          return (
            <input ref={inputRef as React.RefObject<HTMLInputElement>}
                   type={meta.editType === 'number' ? 'number' : meta.editType === 'date' ? 'date' : 'text'}
                   value={editValue}
                   onChange={(e) => setEditValue(e.target.value)}
                   onBlur={commitEdit} onKeyDown={handleKeyDown}
                   className="w-full border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          );
        }
        return (
          <div className="min-h-[1.5rem] cursor-text px-1 rounded hover:bg-blue-50 hover:ring-1 hover:ring-blue-200"
               onClick={() => startEdit(rowIndex, colId, value)}>
            {String(value ?? '')}
          </div>
        );
      },
    };
  });
}, [columns, editingCell, editValue, commitEdit, handleKeyDown, startEdit]);
```

**After — `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` L75-129 교체** (D2 refactor):

```tsx
import { EditableCell, type EditType } from '@tomis/grid-renderers';

// (state + handlers — startEdit/commitEdit/cancelEdit/handleKeyDown 보존 — L34-72 unchanged)
// inputRef 은 EditableCell 내부로 이동 — 외부 inputRef 변수 제거

const editableColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
  return columns.map((col) => {
    const meta = col.meta as EditableColumnMeta | undefined;
    if (!meta?.editable) return col;
    return {
      ...col,
      cell: (ctx) => {
        const rowIndex = ctx.row.index;
        const colId = ctx.column.id;
        const value = ctx.getValue();
        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colId === colId;
        return (
          <EditableCell
            value={value}
            editType={(meta.editType ?? 'text') as EditType}
            selectOptions={meta.selectOptions}
            isEditing={isEditing}
            onStartEdit={() => startEdit(rowIndex, colId, value)}
            onCommit={(newValue) => {
              setEditValue(newValue);
              // commitEdit 가 editValue state 를 사용하므로 microtask 동기화 필요 —
              // useEffect commitEdit 호출 또는 inline commit 패턴 적용 (Implementer 결정 — Section 11.4 R3)
              setData((prev) => {
                const next = [...prev];
                next[rowIndex] = { ...next[rowIndex], [colId]: newValue };
                return next;
              });
              onDataChange?.(rowIndex, colId, newValue);
              setEditingCell(null);
            }}
            onCancel={cancelEdit}
            rowIndex={rowIndex}
            columnId={colId}
          />
        );
      },
    };
  });
}, [columns, editingCell, startEdit, cancelEdit, onDataChange]);
```

**Before — `packages/grid-renderers/src/index.ts` 26 라인 (현재)**:
```ts
// G-001 + G-002 13 export + 21 type — 변경 없음
```

**After — `packages/grid-renderers/src/index.ts` ~36 라인 (G-003 추가)**:
```ts
// (G-001 + G-002 13 export 보존 — Section 2.6 인용)
// G-003 신규
export { EditableCell, type EditableCellProps, type EditType, type CellClassNameCallback } from './EditableCell.js';
export { defaultRendererRegistry, registerRenderer, getRenderer, type CellComponent, type CellComponentProps } from './rendererRegistry.js';
```

### 11.3 구현 순서 (E-03 최소 2단계 — 의존성 고려)

**Step 1: rendererRegistry.ts (NEW) — 의존성 leaf**
1.1. 신규 파일 작성 (Section 2.4 — CellComponentProps + CellComponent type + defaultRendererRegistry + registerRenderer + getRenderer)
1.2. 11 cell 컴포넌트 import (G-001/G-002 산출물)
1.3. tsc check (`pnpm --filter @tomis/grid-renderers typecheck`) — 0 errors
의존성: 없음 (G-001/G-002 산출물만)

**Step 2: EditableCell.tsx (NEW) — Step 1 독립**
2.1. 신규 파일 작성 (Section 2.1 EditType + Section 2.2 CellClassNameCallback + Section 2.3 EditableCell interface + 함수)
2.2. L0 EditableGrid.tsx L82-126 패턴 흡수 + textarea 추가 (D1)
2.3. useState/useEffect/useCallback/useRef hooks + handleKey 분기
2.4. tsc check
의존성: 없음 (React + TanStack type-only)

**Step 3: index.ts (MODIFY) — Step 1 + Step 2 의존**
3.1. 현 26 라인 보존 + Section 2.6 의 신규 4 export + 5 type 추가
3.2. tsc check + tsup build (`pnpm --filter @tomis/grid-renderers build`) — dist/index.{cjs,mjs} 생성
3.3. size-limit check (`pnpm size-limit` — `@tomis/grid-renderers` ≤ 10 KB brotli)
의존성: Step 1 (rendererRegistry.ts) + Step 2 (EditableCell.tsx) 완료

**Step 4: tw-framework-front EditableGrid.tsx body refactor (MODIFY) — Step 3 의존 (monorepo 빌드 산출)**
4.1. monorepo workspace 또는 file path import 검증 (`@tomis/grid-renderers` resolution)
4.2. L0 L75-129 editableColumns useMemo body 를 Section 11.2 AFTER 코드로 교체
4.3. inputRef 외부 변수 제거 (EditableCell 내부로 이동)
4.4. L0 state 관리 (L34-40 editingCell/editValue/pageIndex) + handlers (L42-72) 보존 — onCommit callback 내부에서 직접 setData + onDataChange 호출
4.5. tsc check (`pnpm --filter tw-framework-front typecheck` 또는 `tsc --noEmit --project tw-framework-front`)
4.6. PayrollEditablePage 영향 0건 확인 (Grep `EditableGrid` 결과 1 파일 — D9 cross-check)
의존성: Step 3 완료 (monorepo build 산출물)

**Step 5: finding + stories 부가 산출물 (Section 7 외)**
5.1. `findings/auto-fixed/MOD-GRID-05-G-003-visual-regression.md` 작성 — Section 8.2 의 5단계 state transition 분석 + JSX 토큰 + className 동등성
5.2. `packages/grid-renderers/src/__stories__/EditableCell.stories.tsx` placeholder 작성 — 5 editType variant + cellClassName variant + 편집 플로우 데모

### 11.4 위험 요소 + 사전 게이트

**R1 — D2 EditableGrid refactor 동작 동등성 위험**
- 위험: L0 의 onBlur 와 setEditValue 분리 패턴 (editValue state 가 commitEdit 안에서 사용) → AFTER 의 onCommit callback (string 직접 전달) 으로 변경 시 race condition 가능 (EC-06)
- 사전 게이트: Section 11.2 AFTER 코드의 onCommit 내부에서 setData/onDataChange 호출 직접 처리 (editValue state 우회). Implementer 가 EC-06 시나리오 test (셀A 편집 중 셀B 클릭) verify

**R2 — D1 EditType widening 의 TOMIS side propagation**
- 위험: TOMIS `grid.ts:43` EditType 이 4종 그대로 — D2 refactor 코드에서 `meta.editType ?? 'text'` 의 widening 캐스트 `as EditType` 사용 시 monorepo 5종 vs TOMIS 4종 충돌 가능
- 사전 게이트: Section 11.2 AFTER 코드의 `(meta.editType ?? 'text') as EditType` 는 monorepo EditType (5종) 으로 widening — TOMIS 의 4종 값은 5종의 subset 이므로 safe. tsc strict 통과 (exactOptionalPropertyTypes 환경 — assignment 정상)
- 후속 처리: 본 Goal 범위 외 — TOMIS `grid.ts:43` 의 4종 → 5종 widening 은 MOD-GRID-17 또는 별도 cleanup Goal

**R3 — onCommit 의 state 동기화 패턴**
- 위험: L0 commitEdit (L48-58) 는 editValue state 를 cleanup — AFTER 의 onCommit 은 newValue 를 직접 받음 (editValue state 우회). 두 패턴이 functional equivalent 하지만 미세 차이 (editValue state 가 마지막 입력값 미반영 시점에 다른 setState 호출 시 stale closure 가능)
- 사전 게이트: AFTER 코드에서 setData/onDataChange 를 onCommit callback 안에서 newValue 직접 사용 (editValue state 미사용) → stale closure 위험 0. L0 commitEdit 함수 자체는 사용 안 함 (또는 onCommit 으로 위임)

**R4 — rendererRegistry CellComponentProps 타입 호환**
- 위험: G-001/G-002 의 11 cell 의 props 가 `{ value: SpecificType; ... }` — CellComponentProps `{ value: unknown; row?; column? }` 와 contravariant 관계로 TypeScript 자동 변환 불가
- 사전 게이트: Section 2.4 의 `as CellComponent` cast 사용. C-4 strict 의 `as any` 금지 면제 (named type assertion). 향후 MOD-GRID-04 createColumns 가 `getRenderer(col.type)` 호출 시 createElement 의 props 인자에서 다시 narrow

**R5 — Storybook 인프라 부재 (G-001/G-002 동일)**
- 위험: AC-007 Storybook story 요구사항 — monorepo Storybook 인프라 미구비
- 사전 게이트: G-001/G-002 D8 패턴 일관 — placeholder story 파일 작성 + ADR-MOD-GRID-00-003 documented-deviation. MOD-GRID-99-B 별도 Goal 에서 인프라 도입 시 무수정 가용

**R6 — D9 사용처 분포 (PayrollEditablePage 1 파일)**
- 위험: EditableGrid public API 보존이 D2 refactor 의 의무. 만약 PayrollEditablePage 가 EditableGrid 의 internal state 에 의존 (예: ref 로 editingCell 접근) 시 break 가능
- 사전 게이트: spec writer 사전 검증 — PayrollEditablePage L8 `import type { EditableColumnMeta }` 만 — EditableGrid 의 ref/internal state 사용 0건. R6 위험 실제로 0.

---

## Section 12: 검증 계획 (Validation — E-05)

### 12.1 단위 검증 (tsc + build)

- `pnpm --filter @tomis/grid-renderers typecheck` → 0 errors (Step 1 + 2 + 3 후)
- `pnpm --filter @tomis/grid-renderers build` → tsup 0 errors (Step 3 후) — dist/index.{cjs,mjs,d.ts} 생성
- `cd tw-framework-front && pnpm typecheck` → 0 errors (Step 4 후) — `@tomis/grid-renderers` resolution 확인
- `pnpm size-limit` → `@tomis/grid-renderers` ≤ 10 KB brotli (exit 0) — Step 3 후

### 12.2 시각 회귀 검증 (C-17 — high impact 의무, AC-008, D8)

**Finding 파일**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/auto-fixed/MOD-GRID-05-G-003-visual-regression.md` (NEW — Section 7 부가 산출물)

내용 구성 (G-001/G-002 finding 패턴 일관 + 강화):

1. **적용 방법** — Method B 변형 (구조적 동등성 + JSX 토큰 매핑 + **state transition 동등성** — D8 강화)
2. **영향 사용처 1 파일 — Before/After 비교** — Section 11.2 BEFORE / AFTER 정확 인용
3. **JSX 토큰 + className 동등성 표** — 5 editType variant 각각 BEFORE inline vs AFTER EditableCell 의 markup token 1:1 매핑
4. **편집 플로우 5단계 state transition 표** (D8 강화 — advisor #2):
   | 단계 | BEFORE state | AFTER state | 동등 |
   |------|--------------|-------------|------|
   | 1. 뷰모드 | `<div onClick=startEdit>` | `<div onClick=onStartEdit>` | YES |
   | 2. 편집진입 | `setEditingCell + setEditValue + setTimeout focus` | `parent setEditingCell + EditableCell useEffect focus` | YES (timing 동등 — React batch) |
   | 3. Enter commit | `handleKeyDown 'Enter' → commitEdit` | `handleKey 'Enter' → onCommit(draft)` | YES |
   | 4. Esc cancel | `handleKeyDown 'Escape' → cancelEdit` | `handleKey 'Escape' → onCancel` | YES |
   | 5. Tab commit | `handleKeyDown 'Tab' → preventDefault + commitEdit` | `handleKey 'Tab' → preventDefault + onCommit(draft)` | YES (next-cell focus 는 EditableGrid parent 책임 — L0/AFTER 모두 not implemented) |
5. **deviation enumerate** — D1 textarea 추가 (신규 — baseline 없음) / D3 cellClassName cell-level prop (additive)
6. **신규 산출물 (Tag/Avatar/Progress G-002 와 동일 패턴)** — N/A (본 Goal 은 EditableCell 단일)
7. **결론** — 사용처 1 (PayrollEditablePage) 외관 보존 입증 + 5단계 state transition 동등 입증 → C-17 충족

### 12.3 Storybook 검증 (AC-007 — D8 placeholder)

**Stories 파일**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/__stories__/EditableCell.stories.tsx` (NEW — Section 7 부가 산출물)

내용:
- Default story (editType='text')
- TextStory / NumberStory / DateStory / SelectStory / TextareaStory (5 editType variant)
- WithCellClassNameStory (cellClassName='bg-yellow-50' 조건부 포매팅 데모)
- EditingFlowStory (isEditing toggle 데모 — view → edit → commit/cancel)

monorepo Storybook 인프라 미구비 → placeholder pattern (G-001/G-002 동일):
- type 검증만 통과 (tsc + tsup)
- 실 Storybook 빌드는 MOD-GRID-99-B 별도 Goal 에서 도입

### 12.4 검증 체크리스트 (Section 7 cross-check)

| 항목 | 검증 방법 | 통과 기준 |
|------|----------|----------|
| Section 7 #1 EditableCell.tsx NEW | Read 도구로 파일 존재 확인 | 파일 존재 + Section 2.3 interface 매칭 |
| Section 7 #2 rendererRegistry.ts NEW | Read 도구 | Section 2.4 interface + 11 cell + alias 4 매칭 |
| Section 7 #3 index.ts MODIFY | Read 도구 | G-001 + G-002 export 12개 + 16 type 보존 + G-003 신규 4 export + 5 type 추가 |
| Section 7 #4 EditableGrid.tsx MODIFY | Read 도구 + `Grep "EditableCell"` | body 의 inline JSX 가 `<EditableCell>` 호출로 교체 + import 추가 |
| AC-001~AC-008 출처 태그 | 본 spec 본문 grep | 모든 AC 의 source 가 spec 다른 섹션에서 인용 |
| 부가 산출물 (finding + stories) | Read 도구 | 2 파일 존재 + Section 12.2 + 12.3 내용 매칭 |

---

## Section 13: 상용 제품화 (Commercial Productization — F-01~F-04)

### 13.1 패키지 대상 (F-01)

`@tomis/grid-renderers` (MIT) — G-001 + G-002 와 동일 패키지. 본 G-003 의 EditableCell + rendererRegistry + cellClassName type 모두 동일 grid-renderers 에 통합.

- 경로: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/`
- `package.json:5` `"license": "MIT"` (G-002 시점 검증 완료)
- 한도: brotli ≤ 10 KB (`.size-limit.json:11`)

### 13.2 라이선스 검증 (F-02 — MIT, N/A)

MIT 패키지 → `configureGridLicense()` 호출 불필요. F-02 = N/A.

`packages/grid-renderers/LICENSE` 파일 존재 확인 (G-001 시점 검증 — 본 Goal 변경 0건).

### 13.3 문서 작성 계획 (F-03)

**Docusaurus / Nextra (apps/docs)**: MOD-GRID-99-B 별도 Goal — 본 G-003 은 페이지 작성 0건. JSDoc 의무만:
- EditableCell + EditableCellProps + EditType + CellClassNameCallback — Section 2.1~2.3 의 모든 export 에 JSDoc 명시
- defaultRendererRegistry + registerRenderer + getRenderer + CellComponent + CellComponentProps — Section 2.4 의 모든 export 에 JSDoc 명시

**Storybook story (apps/docs 또는 inline)**:
- `packages/grid-renderers/src/__stories__/EditableCell.stories.tsx` (NEW — D8 placeholder)
- 5 editType variant + cellClassName variant + 편집 플로우 데모 (Section 12.3)

**README.md (package level)**:
- 현재 `packages/grid-renderers/README.md` 존재 여부 → IMPLEMENT 단계 확인 후 G-003 export 4종 추가 또는 신규 생성 (C-25 의무)

### 13.4 peerDependencies 정책 (F-04 — C-22)

Section 4.4 + Section 9.1 명시:
- `react` / `react-dom`: peer (기존재, 변경 0)
- `@tanstack/react-table`: peer (기존재, 변경 0) — type-only import 만 사용

peer 추가 0건. dep 0건 — F-04 충족.

---

## ★ Spec 메타 — 최종 cross-check

### Section 7 ↔ Section 11 ↔ D7 일관성

| Section 7 행 | Section 11 Step | D7 enumerate |
|-------------|----------------|--------------|
| #1 EditableCell.tsx NEW | Step 2 | NEW 2 中 1 — EditableCell.tsx |
| #2 rendererRegistry.ts NEW | Step 1 | NEW 2 中 1 — rendererRegistry.ts |
| #3 index.ts MODIFY | Step 3 | MODIFY 2 中 1 (monorepo) |
| #4 EditableGrid.tsx MODIFY | Step 4 | MODIFY 2 中 1 (tw-framework-front) |

**합계 일치**: Section 7 = 4행, Section 11 = Step 1~4 (4 단계), D7 = NEW 2 + MODIFY 2 = 4. **모두 4 매칭.**

### D# breakdown ↔ 본문 cross-consistency (G-01 v1.0.4)

- D7 의 파일 4개 enumerate (EditableCell.tsx / rendererRegistry.ts / index.ts / EditableGrid.tsx) → Section 7 표 4행 + Section 11 Step 1~4 모두 동일 파일명 enumerate
- D1 5종 EditType (text/number/date/select/textarea) → Section 2.1 + AC-001 + EC-04 모두 5종 명시
- D2 EditableGrid body refactor (re-export 아님) → Section 11.2 Before/After + Section 4.1 호환성 + Section 8.4 롤백 cross-reference
- D3 cellClassName scope split (type export 만) → Section 2.2 + AC-004 + R3 후속 처리 명시
- D4 rendererRegistry 11 cell + alias 4 → Section 2.4 + AC-005 + EC-10/EC-11 일치

### H 메타 게이트 자기-검증

- **H-01 (referenceEvidence 경로 실재)**: L0 `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` (232 라인 Read 완료) + `tw-framework-front/src/types/tomis/grid.ts:43-49` (Grep 완료). L2 `references/current-tanstack-analysis.md` (canonical-modules.json L194 — MOD-GRID-05 reference). L3 영향 사용처 1 파일 (PayrollEditablePage:8 import 검증 완료). R-A/R-W canonical-modules.json L210-217 인용.
- **H-02 (implementFiles 경로 합리성)**: 4 파일 모두 부모 디렉토리 실재 — `topvel-grid-monorepo/packages/grid-renderers/src/` (G-001 + G-002 산출물), `tw-framework-front/src/components/tomis/Grid/` (L0 EditableGrid 존재). 외부 디렉토리 신규 생성 0건 — Section 8.2 명시.
- **H-03 (AC 출처 태그 검증)**: AC-001~AC-008 모두 source 태그 (L0/F-05-XX/C-NN/D#) 명시 + 본문 다른 섹션 인용 — Section 5 AC 표 + Section 5 말미 "모든 AC 출처 태그 의무" cross-reference 완료.

**3 메타 게이트 모두 YES → 일반 채점 진행 가능.**

---

**Spec 작성 완료** — 13/13 섹션 + ★ 사전 결정 D# 표 9개 + ★ Spec 메타 final cross-check.

**Generated by**: tw-grid Spec Writer (opus tier per C-15)
**Date**: 2026-05-14
**Predecessor**: G-001 (TextCell/NumberCell/DateCell completed) + G-002 (8 UI cells completed)
**Successor**: MOD-GRID-04 (createColumns + rendererRegistry consumer) + MOD-GRID-01 (Grid wrapper + cellClassName wiring) + MOD-GRID-10 (ChangeTrackingGrid + EditableCell reuse)
