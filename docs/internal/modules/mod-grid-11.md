# 셀 범위 선택 모듈 (`@topgrid/grid-pro-range`)

Excel 스타일 셀 범위(CellRange) 선택과 그 위에 쌓이는 키보드 내비게이션,
드래그-필(drag-fill), 클립보드 복사/붙여넣기, 키보드 편집 트리거를 제공하는
**Pro 티어** 패키지. TanStack React Table v8 headless 구조 위에 독립적인
2D 직사각형 선택 레이어를 얹는다.

- 패키지: `@topgrid/grid-pro-range`
- 라이선스: **상용 (`SEE LICENSE IN EULA`)** — EULA 기반 Pro 티어 기능.
- 의존: `react` / `react-dom` / `@tanstack/react-table`(^8) 는 peer dependency.
  `@tanstack/react-virtual`(^3) 는 **optional** peer dependency(가상화 사용 시에만).
  런타임 의존은 라이선스 패키지 `@topgrid/grid-license` 하나뿐.
- 스타일: 전부 Tailwind className. CSS 파일·외부 그리드 라이브러리(상용 그리드)
  import 0건 — 순수 React 재구현이다.

이 모듈은 두 가지 방식으로 쓸 수 있다.

1. **합성 컴포넌트** `RangeSelectGrid` — 5개 기능 hook을 단일 컴포넌트로 통합.
   `enable*` 플래그로 기능을 켜고 끈다.
2. **개별 headless hook / 순수 함수** — 자체 그리드에 기능을 조립해 붙일 때.

---

## 1. 개요 — export 카탈로그

| export | 종류 | 역할 |
|--------|------|------|
| `RangeSelectGrid` | 컴포넌트 | 5개 기능 통합 그리드(아래 hook 전부 + 가상화) |
| `DragFillHandle` | 컴포넌트 | 선택 범위 우하단 2×2 핸들 → 드래그 채우기 |
| `useCellRange` | hook | 마우스 드래그 + Shift+Click 범위 선택 |
| `useKeyboardNav` | hook | Arrow/Tab/Enter/Ctrl+Arrow 내비게이션 + Shift+Arrow 확장 |
| `useClipboard` | hook | Ctrl+C/Ctrl+V (RFC 4180 TSV, Excel 호환) |
| `useKeyboardEdit` | hook | Delete/F2/Enter/타이핑 → 편집·삭제 트리거 |
| `normalizeRange` | 순수 함수 | CellRange를 `start ≤ end` 로 정규화 |
| `isInRange` | 순수 함수 | 좌표의 범위 포함 여부 판별 |
| `fillRange` | 순수 함수 | 소스 범위 → 방향·개수만큼 `CellUpdate[]` 생성 |
| `detectSeriesStep` | 순수 함수 | 숫자 배열의 등차 step 감지 |
| `stringifyTsv` / `parseTsv` | 순수 함수 | 2D 값 ↔ RFC 4180 TSV 직렬화/역직렬화 |

타입 export: `CellCoord`, `CellRange`, `CellUpdate<TCell>`, `FillDirection`,
`RangeSelectGridProps<TData>`, `RangeSelectGridAllProps<TData, TCell>`,
`DragFillHandleProps<TCell>`, `PasteResult<TCell>`,
`UseCellRangeReturn`, `UseKeyboardNavOptions/Return`,
`UseClipboardProps/Return`, `UseKeyboardEditProps/Return`.

### 핵심 데이터 모델

```ts
interface CellCoord { row: number; col: number; }      // 0-based 인덱스
interface CellRange { start: CellCoord; end: CellCoord; }  // 직사각형
interface CellUpdate<TCell = unknown> { row: number; col: number; value: TCell; }
type FillDirection = 'up' | 'down' | 'left' | 'right';
```

`CellRange`의 `start`/`end`는 정규화 전 임의 방향(역방향 드래그 포함)을 허용하며,
`normalizeRange`로 항상 `start ≤ end`로 정규화한다.

---

## 2. 순수 함수 계약

모두 부수효과 없는 순수 함수이며 `any`를 쓰지 않는다.

### normalizeRange / isInRange

```ts
function normalizeRange(range: CellRange): CellRange;
function isInRange(row: number, col: number, range: CellRange | null): boolean;
```

- `normalizeRange`: 역방향 입력 `{start:{3,2}, end:{0,0}}` → `{start:{0,0}, end:{3,2}}`.
  네 좌표를 `Math.min`/`Math.max`로 정렬. 단일 셀은 그대로 유지.
- `isInRange`: `range`가 `null`이면 항상 `false`. 내부에서 `normalizeRange`를 먼저
  적용하므로 비정규 범위에도 안전. 경계 포함(`>=`/`<=`).

### fillRange / detectSeriesStep

```ts
function detectSeriesStep(values: number[]): number | null;
function fillRange<TCell>(
  sourceRange: CellRange,
  direction: FillDirection,
  fillCount: number,
  getCellValue: (row: number, col: number) => TCell,
): CellUpdate<TCell>[];
```

- `detectSeriesStep`: 요소 1개 이하 → `0`(단순 복사). 2개 이상 + 모든 인접 차이가
  동일 → 그 step. 불일치(예 `[1,2,4]`) → `null`(순환 복사 모드).
- `fillRange`: `fillCount <= 0`이면 빈 배열. 소스 범위의 행·열 값을 수집해
  지정 방향으로 `fillCount`만큼 확장한다. 채울 값 산출 규칙:
  - **소스가 전부 숫자이고 등차수열이면** 시리즈를 연장(`마지막값 + step*거리`).
  - **그 외(혼합/문자열/비등차)면** 소스 값을 `modulo`로 순환 복사.
  - `up`/`left` 방향은 소스 값을 `reverse`하여 방향성을 보존한다.

### stringifyTsv / parseTsv (RFC 4180)

```ts
function stringifyTsv(matrix: readonly (readonly unknown[])[]): string;
function parseTsv(tsv: string): string[][];
```

- 셀 구분 `\t`, 행 구분 `\n`. **RFC 4180 완전 보존** — 탭/줄바꿈/쌍따옴표를 포함한
  셀은 `"` 로 래핑하고 내부 `"` 는 `""` 로 이중 이스케이프한다(Excel 직접 붙여넣기 호환).
- `parseTsv`: `\r\n`/`\r` → `\n` 정규화, Excel이 붙이는 말미 `\n` 제거, 래핑 셀의
  `""` → `"` 복원. 빈/공백 문자열은 `[['']]` 반환.
- 왕복 보장: `parseTsv(stringifyTsv(matrix))`가 탭/줄바꿈/쌍따옴표 포함 케이스에서
  원본과 일치한다.

> 행 단위 헤더 포함 복사(공백 치환 방식)는 `@topgrid/grid-export`의 별도 기능이며,
> 본 모듈의 TSV는 **셀 범위 선택 단위 + RFC 4180 완전 보존**으로 역할이 다르다.

---

## 3. Headless Hook 계약

이 모듈의 hook은 모두 **컨트롤드(controlled)·headless** 설계다. 즉 상호작용을
감지해 결과(`CellRange`·`CellUpdate[]`·`CellCoord[]`)를 콜백으로 **방출만** 하고,
실제 데이터 변경은 호출자(컨테이너)가 소유한다. 키보드 hook은 `onKeyDown`/
`handleKeyDown`을 반환하여 한 그리드 컨테이너에서 **합성(chain)** 할 수 있다.

### useCellRange

```ts
function useCellRange(
  onRangeChange?: (range: CellRange | null) => void,
): {
  range: CellRange | null;
  dragging: boolean;
  handleMouseDown: (row: number, col: number, shiftKey: boolean) => void;
  handleMouseEnter: (row: number, col: number) => void;
  handleMouseUp: () => void;
};
```

- **단일 콜백 인자** 시그니처다(다른 설정 객체를 받지 않는다).
- `handleMouseDown`: `shiftKey && range` 면 기존 `start`를 유지하고 클릭 셀을 새 `end`로
  하여 범위 확장(Shift+Click). 그 외에는 새 drag 시작(`dragStart` ref 기록, `dragging=true`).
- `handleMouseEnter`: `dragging` 중일 때만 `dragStart`→현재 셀로 범위 확장.
- `handleMouseUp`: `dragging` 종료. (셀 밖에서 떼는 경우는 컨테이너의
  `onMouseUp`/`onMouseLeave`에서 호출.)
- 매 변경마다 정규화된 범위로 `onRangeChange`를 호출한다.

### useKeyboardNav

```ts
interface UseKeyboardNavOptions<TData> {
  table: Table<TData>;                                  // 경계(행·열 수) 계산
  activeCell: CellCoord | null;                         // controlled
  onActiveCellChange: (cell: CellCoord) => void;
  range: CellRange | null;                              // useCellRange와 연동
  onRangeChange: (range: CellRange | null) => void;
  getCellValue?: (row: number, col: number) => unknown; // Ctrl+Arrow data-edge용
}
function useKeyboardNav<TData>(o: UseKeyboardNavOptions<TData>): {
  handleKeyDown: (e: React.KeyboardEvent) => void;
};
```

키 처리 규칙:

| 키 | 동작 |
|----|------|
| Arrow | activeCell 1칸 이동(경계 clamp). 범위 해제(`onRangeChange(null)`). |
| Shift+Arrow | anchor 고정 + cursor 이동 → `normalizeRange`로 범위 확장/축소 |
| Ctrl+Arrow | data-edge(연속 채워진 셀 끝)로 이동. `getCellValue` 미제공 시 그리드 경계로 |
| Ctrl+Shift+Arrow | anchor 고정 + cursor를 data-edge까지 → 범위 확장 |
| Tab / Shift+Tab | 오른쪽/왼쪽 이동, 행 끝에서 wrap |
| Enter | 아래 행으로 이동 |

- 경계는 외부 prop이 아니라 `table.getRowModel()` + 가시 컬럼 수에서 파생한다.
- anchor 유지: 첫 Shift+Arrow에서 `range.start`(또는 현재 셀)를 anchor로 고정하고,
  일반 Arrow/Tab/Enter 입력 시 anchor를 초기화한다(Shift+Click과 일관된 확장 의미).
- 인식하는 키에 대해서만 `e.preventDefault()` 호출.

### useClipboard

```ts
interface UseClipboardProps<TData, TCell = unknown> {
  selection: CellRange | null;                          // null이면 복사 no-op
  activeCell: CellCoord | null;                         // null이면 붙여넣기 no-op
  rowCount: number; colCount: number;                   // 붙여넣기 경계 clamp
  getCellValue: (row: number, col: number) => TCell;    // 복사 시 매트릭스 추출
  onPaste?: (cells: CellUpdate<TCell>[]) => void;       // 붙여넣기 결과 위임
  onError?: (error: Error) => void;                     // 권한 거부 등
  table?: Table<TData>;                                 // 예약(미사용)
}
function useClipboard<TData, TCell>(p): {
  onKeyDown: (e: React.KeyboardEvent) => void;
  copyToClipboard: () => Promise<void>;
  pasteFromClipboard: (tsvString?: string) => Promise<PasteResult<TCell>>;
};
```

- **Ctrl+C** → 선택 범위 매트릭스 → `stringifyTsv` → `navigator.clipboard.writeText`.
  클립보드 API가 없는(HTTP 등) 환경은 숨긴 `<textarea>` + `document.execCommand('copy')`로
  fallback.
- **Ctrl+V** → `navigator.clipboard.readText`(또는 인자로 주입한 `tsvString`) → `parseTsv`
  → `activeCell` 기준 오프셋으로 `CellUpdate[]` 생성 → 셀이 있으면 `onPaste` 호출.
- `pasteFromClipboard`는 `PasteResult`를 반환한다:
  ```ts
  interface PasteResult<TCell = unknown> {
    cells: CellUpdate<TCell>[]; truncated: boolean; rows: number; cols: number;
  }
  ```
  `tsvString`을 직접 주입할 수 있어 클립보드 권한 없이 테스트/스토리 작성이 가능하다.
- 모든 클립보드 오류는 `onError`(미제공 시 `console.warn`)로 graceful 처리하고
  빈 결과를 반환한다.

### useKeyboardEdit

```ts
interface UseKeyboardEditProps<TData, TCell = unknown> {
  selection: CellRange | null;
  activeCell: CellCoord | null;
  isEditableColumn?: (colIndex: number) => boolean;     // 미제공 시 전부 편집 가능
  onDeleteRange?: (cells: CellCoord[]) => void;         // Delete
  onBulkEdit?: (cells: CellCoord[], value: TCell) => void; // 타이핑(범위)
  onEditStart?: (cell: CellCoord, initialValue?: TCell) => void; // F2/Enter/타이핑(단일)
  table?: Table<TData>;                                 // 예약(미사용)
}
function useKeyboardEdit<TData, TCell>(p): {
  onKeyDown: (e: React.KeyboardEvent) => void;
};
```

키 처리:

| 키 | 동작 |
|----|------|
| Delete / Backspace | 선택 범위 내 편집 가능 셀 좌표 → `onDeleteRange`. Ctrl/Meta 조합·`selection===null`·편집 가능 셀 0개면 no-op |
| F2 | `activeCell` 편집 시작 → `onEditStart(cell)` |
| Enter | **단일 셀 선택일 때만** 편집 시작(소비). 범위 선택이면 처리하지 않고 다음 핸들러(내비게이션)에 위임 |
| 일반 타이핑(printable) | 단일 셀이면 `onEditStart(cell, 첫 글자)`, 범위면 편집 가능 셀 전체에 `onBulkEdit(cells, value)` |

- printable 판정: `e.key.length === 1 && !ctrl && !meta && !alt && !isComposing`.
  IME 조합 중(`isComposing`)인 한글 등은 제외해 중간 음절이 일괄 입력을 트리거하지 않는다.
- `isEditableColumn`으로 읽기 전용 컬럼을 거른다.
- Delete/F2/Enter(단일)는 `e.preventDefault()`를 호출하고, 일반 타이핑은
  브라우저 기본 입력 동작을 살리려 `preventDefault`를 생략한다.

---

## 4. `RangeSelectGrid` 합성 컴포넌트

5개 hook + 가상화 + 라이선스 워터마크를 단일 컴포넌트로 통합한다.

### prop 계약

기존 6-prop(`RangeSelectGridProps`)을 그대로 확장한 `RangeSelectGridAllProps`를 받는다.
6-prop만 넘기면 v1 동작 그대로 — **하위 호환은 타입 확장(extends)으로 보장**된다.

```ts
interface RangeSelectGridProps<TData extends object> {
  data: TData[];
  columns: ColumnDef<TData>[];
  onRangeChange?: (range: CellRange | null) => void;
  loading?: boolean;
  emptyText?: string;        // ('데이터가 없습니다.')
  className?: string;
}

interface RangeSelectGridAllProps<TData extends object, TCell = unknown>
  extends RangeSelectGridProps<TData> {
  // 기능 on/off (기본값 주의)
  enableRangeSelection?: boolean;   // (true)
  enableKeyboardNav?: boolean;      // (true)
  enableDragFill?: boolean;         // (false)
  enableClipboard?: boolean;        // (false)
  enableKeyboardEdit?: boolean;     // (false)
  enableVirtualization?: boolean;   // (false)

  getCellValue?: (row: number, col: number) => TCell;   // drag-fill + clipboard 공유

  onFillComplete?: (cells: CellUpdate<TCell>[]) => void;
  onFillTargetChange?: (target: CellRange | null) => void;
  onPaste?: (cells: CellUpdate<TCell>[]) => void;
  onClipboardError?: (error: Error) => void;
  isEditableColumn?: (colIndex: number) => boolean;
  onDeleteRange?: (cells: CellCoord[]) => void;
  onBulkEdit?: (cells: CellCoord[], value: TCell) => void;
  onEditStart?: (cell: CellCoord, initialValue?: TCell) => void;
}
```

- 기본값으로 **범위 선택·키보드 내비게이션은 켜져 있고**, drag-fill·클립보드·키보드
  편집·가상화는 꺼져 있다(opt-in).
- 컬럼 정렬(sorting)은 내장(`getSortedRowModel`). 헤더 클릭으로 토글, 표시기 `▲/▼/⇅`.
- `loading === true`면 스피너만 렌더. 행이 없으면 `emptyText`.

### 동작 게이팅 — Rules of Hooks

5개 기능 hook(과 `useVirtualizer`)은 **언제나 무조건 호출**한다. `enable*` 플래그는
hook 호출이 아니라 **동작을 게이팅**한다(React Rules of Hooks 준수).

- 범위 선택: hook은 항상 호출하되, 셀의 `onMouseDown`/`onMouseEnter`에서
  `if (!enableRangeSelection) return`으로 차단(hook에 `disabled` 같은 prop은 없다).
- 키보드 내비게이션/클립보드/편집: 콜백을 조건부로만 전달
  (예 `enableClipboard && onPaste !== undefined`일 때만 `onPaste` 주입). 미전달이면
  hook 내부에서 자연스럽게 no-op.
- `DragFillHandle`은 hook이 아니라 **컴포넌트**이므로
  `enableDragFill && range !== null && getCellValue !== undefined`일 때만 조건부 렌더.
- 모든 optional prop은 `exactOptionalPropertyTypes` 호환을 위해 조건부 spread로 전달한다.

### onKeyDown 합성 순서 — edit → nav → clip

컨테이너 `<div tabIndex={0} onKeyDown={...}>`가 세 키 핸들러를 이 순서로 합성한다:

```
editKeyDown(e)  →  if (e.defaultPrevented) return
navKeyDown(e)   →  if (e.defaultPrevented) return
clipKeyDown(e)
```

- **편집이 가장 먼저**인 이유: Enter 키가 "단일 셀 편집 시작"(편집)과 "아래 행
  이동"(내비게이션)으로 충돌한다. 편집 hook이 단일 셀일 때 먼저 소비하고
  `preventDefault`하면 내비게이션을 건너뛴다. 범위 선택이면 편집 hook이 Enter를
  넘겨 내비게이션이 처리한다.
- 클립보드(Ctrl+C/V)는 내비게이션·편집과 키 충돌이 없어 마지막에 둔다.

### 셀 스타일

- 선택 셀: `bg-blue-100 ring-1 ring-blue-400`
- 활성 셀(activeCell): `bg-blue-50 ring-2 ring-blue-600`
- `ring`은 border-box에 영향을 주지 않아(outline-safe) 레이아웃을 흔들지 않는다.
- 각 `<td>`에 `data-row`/`data-col` 속성을 부여해 drag-fill의 좌표→픽셀 변환
  (`getCellRect`)이 DOM 질의로 동작한다.

### 가상화

`enableVirtualization=true`면 `@tanstack/react-virtual`의 `useVirtualizer`로 보이는
행만 렌더한다. `useVirtualizer`도 hook이므로 항상 호출하되, 꺼져 있으면 `count: 0`으로
빈 가상 항목을 만들어 비가상화 경로로 폴백한다. 컨테이너에 고정 높이 + 스크롤은
호출자 책임이다. 선택 하이라이트는 행 인덱스 기반이라 가상화 후에도 동일하게 적용된다.

---

## 5. `DragFillHandle` 컴포넌트

선택 범위 우하단에 2×2 px 파란 핸들(`bg-blue-500`)을 절대 위치로 렌더하고,
핸들을 드래그하면 Excel 스타일로 패턴을 채운다. 단독으로도 쓸 수 있다.

```ts
interface DragFillHandleProps<TCell = unknown> {
  range: CellRange | null;                              // null이면 핸들 미표시
  getCellValue: (row: number, col: number) => TCell;
  onFillComplete?: (cells: CellUpdate<TCell>[]) => void;
  onFillTargetChange?: (target: CellRange | null) => void; // 드래그 중 점선 outline용
  rowCount: number; colCount: number;                   // 경계 clamp
  containerRef: React.RefObject<HTMLElement>;           // 좌표 계산 기준
  getCellRect: (row: number, col: number) =>
    { x: number; y: number; width: number; height: number };
}
```

- 드래그 상태는 `useState`가 아니라 3개 ref(`isDragging`/`dragStart`/`fillTarget`)로
  추적해 드래그 중 불필요한 re-render를 막는다.
- `mousemove`/`mouseup` 리스너를 **window 레벨**에 붙여 컨테이너 밖으로 나가도
  드래그가 유지된다.
- 드래그 위치는 `getCellRect` 기반 hit-test로 셀 좌표로 환산하므로 가상화 환경에서도
  행 인덱스가 정확하다. 핸들이 가리키는 방향(`up/down/left/right`)과 셀 수를 계산해
  `fillRange`를 호출하고 결과를 `onFillComplete`로 위임한다(데이터 변경은 호출자 몫).
- 드래그 중에는 `onFillTargetChange`로 대상 범위를 알려 호출자가 점선 미리보기를 그릴
  수 있다.

---

## 6. 라이선스 (Pro / EULA)

이 패키지는 상용 Pro 티어다. 라이선스 적용은 `@topgrid/grid-license`로 처리한다.

- 패키지 로드 시점에 `index.ts`가 `checkLicense()`를 호출한다.
- `RangeSelectGrid`는 `useLicenseStatus()`로 상태를 구독하고, 워터마크가 필요한 상태면
  `<Watermark required />`를 오버레이로 렌더한다(렌더링 자체를 차단하지는 않는다).

---

## 7. 엣지 케이스 동작 요약

| 영역 | 입력 | 동작 |
|------|------|------|
| normalizeRange | 역방향 `start>end` | `start ≤ end`로 정렬 |
| isInRange | `range === null` | `false` |
| detectSeriesStep | 요소 1개 이하 | `0`(단순 복사) |
| detectSeriesStep | 비등차 `[1,2,4]` | `null`(순환 복사) |
| fillRange | 단일 셀 소스 | 값 복사(step 0) |
| fillRange | 혼합/문자열 배열 | `modulo` 순환 복사 |
| DragFillHandle | 소스 범위 내부로 드래그 | `fillCount=0` → 채우기·콜백 없음 |
| useClipboard | `selection===null` + Ctrl+C | no-op |
| useClipboard | 붙여넣기 그리드 경계 초과 | clamp + `truncated: true` |
| useClipboard | 클립보드 권한 거부 | `onError`/`console.warn` + 빈 결과 |
| parseTsv | 빈/공백 문자열 | `[['']]` |
| useKeyboardEdit | 읽기 전용 컬럼만 선택 + Delete | 편집 가능 셀 0개 → no-op |
| useKeyboardEdit | IME 조합 중 타이핑 | 무시(`isComposing`) |
| useKeyboardEdit | Enter (단일 셀) | 편집 시작(소비) |
| useKeyboardEdit | Enter (범위 선택) | 내비게이션에 위임(아래 행 이동) |
| useKeyboardNav | Ctrl+Arrow + `getCellValue` 없음 | 그리드 경계로 이동 |

---

## 8. 사용 예시

### 통합 컴포넌트 (전 기능)

```tsx
import { RangeSelectGrid } from '@topgrid/grid-pro-range';

<RangeSelectGrid<Row, string>
  data={rows}
  columns={columns}
  enableDragFill
  enableClipboard
  enableKeyboardEdit
  getCellValue={(r, c) => String(rows[r]?.[colKeys[c]] ?? '')}
  onFillComplete={(cells) => applyUpdates(cells)}
  onPaste={(cells) => applyUpdates(cells)}
  onDeleteRange={(cells) => clearCells(cells)}
  onBulkEdit={(cells, value) => setCells(cells, value)}
  onEditStart={(cell, initial) => openEditor(cell, initial)}
/>
```

`data`/`columns` 두 prop만 넘기면 범위 선택 + 키보드 내비게이션이 켜진 기본 그리드로
동작한다.

### 개별 hook 조립

```tsx
const { range, handleMouseDown, handleMouseEnter, handleMouseUp } =
  useCellRange(setRange);

const { handleKeyDown: navKeyDown } = useKeyboardNav({
  table, activeCell, onActiveCellChange: setActiveCell, range, onRangeChange: setRange,
});
const { onKeyDown: clipKeyDown } = useClipboard({
  selection: range, activeCell, rowCount, colCount, getCellValue, onPaste,
});

// 컨테이너에서 합성 (편집 → 내비게이션 → 클립보드 순)
const onKeyDown = (e) => { navKeyDown(e); clipKeyDown(e); };
```

데이터 변경(붙여넣기·삭제·채우기·편집)은 항상 콜백을 받은 **호출자가 수행**한다.
이 모듈은 상호작용 감지와 결과 산출만 책임지는 headless 레이어다.
