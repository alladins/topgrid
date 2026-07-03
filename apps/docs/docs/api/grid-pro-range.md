---
title: "@topgrid/grid-pro-range"
sidebar_label: "grid-pro-range"
sidebar_position: 26
---

# @topgrid/grid-pro-range

> Pro: Cell Range Selection, Drag-fill, Clipboard · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **27개** public export — 함수 6 · 훅 4 · 컴포넌트 2 · 타입 15 · 상수 0.

## 컴포넌트

### `DragFillHandle`

```ts
DragFillHandle(__namedParameters: DragFillHandleProps<TCell>): null | ReactElement<any, string | JSXElementConstructor<any>>
```

### `RangeSelectGrid`

RangeSelectGrid — 5-hook 완전 통합.

 Rules of Hooks: 5개 hook 전부 무조건 호출.
 enable* = behavior gate (not hook invocation gate).
 onKeyDown 합성: editKeyDown → navKeyDown → clipKeyDown.

```ts
RangeSelectGrid(props: RangeSelectGridAllProps<TData, TCell>): ReactElement
```

**예시**

```tsx
// v0.1.x 그대로 동작 (C-6 backward compat)
<RangeSelectGrid data={rows} columns={columns} />

// v0.2.0 — Drag-fill + Clipboard 활성화
<RangeSelectGrid<MyData, string>
  data={data}
  columns={columns}
  enableDragFill
  enableClipboard
  getCellValue={(row, col) => getValue(row, col)}
  onFillComplete={(cells) => apply(cells)}
  onPaste={(cells) => apply(cells)}
/>
```

## 훅 (Hooks)

### `useCellRange`

마우스 드래그/Shift+Click 셀 범위 선택 훅.

```ts
useCellRange(onRangeChange: (…) => …): UseCellRangeReturn
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `onRangeChange` | `(…) => …` | 범위 변경 시 호출되는 콜백. |

**반환** — 범위 state + 이벤트 핸들러 3종.

**예시**

```tsx
const { range, handleMouseDown, handleMouseEnter, handleMouseUp } =
  useCellRange((r) => console.log('range changed:', r));
```

### `useClipboard`

```ts
useClipboard(props: UseClipboardProps<TData, TCell>): UseClipboardReturn
```

### `useKeyboardEdit`

useKeyboardEdit — Delete/F2/Enter/printable key 분기 hook.

```ts
useKeyboardEdit(props: UseKeyboardEditProps<TData, TCell>): UseKeyboardEditReturn
```

**반환** — `{ onKeyDown }` — Grid container에 부착할 keydown 핸들러.

**예시**

```tsx
const { onKeyDown: editKeyDown } = useKeyboardEdit({ selection, activeCell, ... });
// D7: G-005 앞에 배치 (D5 Enter 우선순위)
const onKeyDown = useCallback((e: React.KeyboardEvent) => {
  editKeyDown(e);
  if (e.defaultPrevented) return;
  navKeyDown(e);   // G-002
  clipKeyDown(e);  // G-004
}, [editKeyDown, navKeyDown, clipKeyDown]);
```

### `useKeyboardNav`

```ts
useKeyboardNav(options: UseKeyboardNavOptions<TData>): UseKeyboardNavReturn
```

## 함수

### `detectSeriesStep`

```ts
detectSeriesStep(values: number[]): null | number
```

### `fillRange`

```ts
fillRange(sourceRange: CellRange, direction: FillDirection, fillCount: number, getCellValue: (…) => …): CellUpdate<TCell>[]
```

### `isInRange`

```ts
isInRange(row: number, col: number, range: null | CellRange): boolean
```

### `normalizeRange`

```ts
normalizeRange(range: CellRange): CellRange
```

### `parseTsv`

```ts
parseTsv(tsv: string): string[][]
```

### `stringifyTsv`

```ts
stringifyTsv(matrix: readonly readonly unknown[][]): string
```

## 타입 · 인터페이스

### `CellCoord`

셀 범위(range) 순수 유틸 — 정규화·포함판정·drag-fill·TSV (W1 Phase 0, grid-pro-range 에서 이관).

전부 framework-agnostic 순수 함수 + 순수 데이터 타입(좌표/사각형/방향/업데이트).
React(grid-pro-range)·Vue 범위 어댑터가 동일 math/serialization 을 공유한다. 렌더/이벤트 무관.

| 속성 | 타입 | 설명 |
|---|---|---|
| `col` | `number` |  |
| `row` | `number` |  |

### `CellRange`

| 속성 | 타입 | 설명 |
|---|---|---|
| `end` | `CellCoord` |  |
| `start` | `CellCoord` |  |

### `CellUpdate`

| 속성 | 타입 | 설명 |
|---|---|---|
| `col` | `number` |  |
| `row` | `number` |  |
| `value` | `TCell` |  |

### `DragFillHandleProps`

DragFillHandle 컴포넌트 Props.

 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
전달 시 spread-skip 패턴 사용 (spec Section 4.4).

| 속성 | 타입 | 설명 |
|---|---|---|
| `colCount` | `number` | 그리드 전체 열 수 (경계 clamp). |
| `containerRef` | `RefObject<HTMLElement>` | 핸들이 렌더링될 컨테이너 ref (좌표 계산). |
| `getCellRect` | `(…) => …` | 셀 크기 getter (px) — 드래그 위치 → cell coord 변환용. |
| `getCellValue` | `(…) => …` | 소스 셀 값 getter — 드래그 시 fill 계산용. |
| `onFillComplete?` | `(…) => …` | 채우기 완료 콜백 ( 분리). |
| `onFillTargetChange?` | `(…) => …` | 드래그 중 fill target 범위 변경 알림 (시각적 점선 outline용). |
| `range` | `null \| CellRange` | 현재 선택된 소스 범위 ( CellRange). null이면 핸들 미표시. |
| `rowCount` | `number` | 그리드 전체 행 수 (경계 clamp). |

### `PasteResult`

붙여넣기 결과 메타정보 ( 보완 — ).
cells: 파싱된 CellUpdate 배열 (onPaste callback에 전달).
truncated: true이면 grid 경계 초과로 일부 셀 클램프됨.
rows: TSV 파싱 행 수.
cols: TSV 파싱 열 수.

| 속성 | 타입 | 설명 |
|---|---|---|
| `cells` | `CellUpdate<TCell>[]` |  |
| `cols` | `number` |  |
| `rows` | `number` |  |
| `truncated` | `boolean` |  |

### `RangeSelectGridAllProps`

확장 props — 6-prop 유지 + 5개 enable 플래그 + 7개 callback.

enable* 플래그 설계 원칙 :
 - 모든 hook은 무조건 호출 (Rules of Hooks 준수)
 - enable* = false → hook 내부 early return (동작 게이팅)
 - DragFillHandle: 컴포넌트이므로 조건부 렌더 허용

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` |  |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `enableClipboard?` | `boolean` | Ctrl+C/V 클립보드 (default: false). |
| `enableDragFill?` | `boolean` | Drag-fill 핸들 렌더링 + 채우기 기능 (default: false). |
| `enableKeyboardEdit?` | `boolean` | Delete/F2/Enter/printable key 편집 트리거 (default: false). |
| `enableKeyboardNav?` | `boolean` | Arrow/Ctrl+Arrow 키보드 내비게이션 (default: true). |
| `enableRangeSelection?` | `boolean` | 마우스 드래그 / Shift+Click 범위 선택 (default: true). |
| `enableVirtualization?` | `boolean` | @tanstack/react-virtual 가상화 (default: false). |
| `getCellValue?` | `(…) => …` | 셀 값 getter — drag-fill 계산 + clipboard 복사용. |
| `isEditableColumn?` | `(…) => …` | 컬럼 편집 가능 여부 판별. 미제공 시 전체 편집 가능. |
| `loading?` | `boolean` |  |
| `onBulkEdit?` | `(…) => …` | 범위 일괄 입력 콜백 ( 분리). |
| `onClipboardError?` | `(…) => …` | 클립보드 API 에러 핸들러 (권한 거부 등). |
| `onDeleteRange?` | `(…) => …` | Delete 키 범위 삭제 콜백 ( 분리). |
| `onEditStart?` | `(…) => …` | F2/Enter 단일 셀 편집 시작 콜백 ( 분리). |
| `onFillComplete?` | `(…) => …` | Drag-fill 완료 콜백 ( 분리). |
| `onFillTargetChange?` | `(…) => …` | Drag-fill target 범위 변경 알림 (점선 outline). |
| `onPaste?` | `(…) => …` | 붙여넣기 결과 콜백 ( 분리). |
| `onRangeChange?` | `(…) => …` |  |

### `RangeSelectGridProps`

RangeSelectGrid props (L0 backward-compat 포함 — ).

 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
전달 시 spread-skip 패턴 사용 (Section 6.6).

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` |  |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `loading?` | `boolean` |  |
| `onRangeChange?` | `(…) => …` |  |

### `UseCellRangeReturn`

useCellRange 훅 반환 타입.

| 속성 | 타입 | 설명 |
|---|---|---|
| `dragging` | `boolean` | 드래그 중 여부. |
| `handleMouseDown` | `(…) => …` | 셀 mousedown 핸들러. |
| `handleMouseEnter` | `(…) => …` | 셀 mouseenter 핸들러 (드래그 범위 확장). |
| `handleMouseUp` | `(…) => …` | mouseup 핸들러 (드래그 종료). |
| `range` | `null \| CellRange` | 현재 선택된 셀 범위. 선택 없으면 null. |

### `UseClipboardProps`

useClipboard hook props.

 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
전달 시 spread-skip 패턴 사용 (spec Section 3.4 예시 참조).

| 속성 | 타입 | 설명 |
|---|---|---|
| `activeCell` | `null \| CellCoord` | 현재 활성 셀 좌표 (useKeyboardNav의 activeCell). null이면 Ctrl+V no-op. |
| `colCount` | `number` | 그리드 전체 열 수 (경계 clamp). |
| `getCellValue` | `(…) => …` | 셀 값 getter — 복사 시 매트릭스 추출용. |
| `onError?` | `(…) => …` | 클립보드 API 에러 핸들러 (권한 거부 등). |
| `onPaste?` | `(…) => …` | 붙여넣기 결과 콜백 ( 분리). 미제공 시 붙여넣기 파싱만 수행. |
| `rowCount` | `number` | 그리드 전체 행 수 (경계 clamp). |
| `selection` | `null \| CellRange` | 현재 선택 범위 (useCellRange의 range). null이면 Ctrl+C no-op. |
| `table?` | `Table<TData>` | TanStack Table 인스턴스 — 사용 안 함, 향후 확장용 optional. |

### `UseClipboardReturn`

useClipboard hook 반환 타입.

| 속성 | 타입 | 설명 |
|---|---|---|
| `copyToClipboard` | `(…) => …` | Ctrl+C 프로그래매틱 복사. navigator.clipboard 비동기. |
| `onKeyDown` | `(…) => …` | Grid container에 부착할 keydown 핸들러. Ctrl+C → copyToClipboard, Ctrl+V → pasteFromClipboard 호출.  useKeyboardNav.handleKeyDown과 합성하여 사용. |
| `pasteFromClipboard` | `(…) => …` | Ctrl+V 프로그래매틱 붙여넣기. 명시적 tsvString 주입 가능 (Storybook/테스트용). |

### `UseKeyboardEditProps`

useKeyboardEdit hook props.

 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
전달 시 spread-skip 패턴 사용 (spec Section 10.1 예시 참조).

| 속성 | 타입 | 설명 |
|---|---|---|
| `activeCell` | `null \| CellCoord` | 현재 활성 셀 좌표 (useKeyboardNav의 activeCell). null이면 F2/Enter no-op. |
| `isEditableColumn?` | `(…) => …` | 컬럼 편집 가능 여부 판별 함수. 미제공 시 모든 컬럼 편집 가능으로 취급. |
| `onBulkEdit?` | `(…) => …` | 범위 일괄 입력 callback ( 분리). |
| `onDeleteRange?` | `(…) => …` | Delete 키 범위 삭제 callback ( 분리). |
| `onEditStart?` | `(…) => …` | F2/Enter 단일 셀 편집 시작 callback ( 분리). |
| `selection` | `null \| CellRange` | 현재 선택 범위 (useCellRange의 range). null이면 Delete/printable no-op. |
| `table?` | `Table<TData>` | TanStack Table 인스턴스 — 향후 확장용 optional. |

### `UseKeyboardEditReturn`

useKeyboardEdit hook 반환 타입.

| 속성 | 타입 | 설명 |
|---|---|---|
| `onKeyDown` | `(…) => …` | Grid container에 부착할 keydown 핸들러.  handleKeyDown / onKeyDown과 컴포저블 결합. Caller는 onKeyDown을 체인 앞에 배치 ( Enter 우선순위). |

### `UseKeyboardNavOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `activeCell` | `null \| CellCoord` | 현재 활성 셀 좌표 (controlled). |
| `getCellValue?` | `(…) => …` | Ctrl+Arrow data-edge 탐색 함수 (선택적). |
| `onActiveCellChange` | `(…) => …` | 활성 셀 변경 콜백. |
| `onRangeChange` | `(…) => …` | 범위 변경 콜백 (useCellRange의 onRangeChange와 동일 시그니처 — ). |
| `range` | `null \| CellRange` | 현재 선택 범위 (useCellRange에서 수신 — controlled). |
| `table` | `Table<TData>` | TanStack table 인스턴스 (경계 계산용 — ). |

### `UseKeyboardNavReturn`

| 속성 | 타입 | 설명 |
|---|---|---|
| `handleKeyDown` | `(…) => …` | Grid container에 부착할 keydown 핸들러. |

### `FillDirection`

```ts
type FillDirection = "up" | "down" | "left" | "right"
```

