---
title: "@topgrid/grid-pro-sheet"
sidebar_label: "grid-pro-sheet"
sidebar_position: 26
---

# @topgrid/grid-pro-sheet

> Pro: spreadsheet mode (PoC) — formula engine (A1 refs, SUM/AVERAGE/…), dependency-graph recalc with cycle detection · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **32개** public export — 함수 16 · 훅 1 · 컴포넌트 1 · 타입 12 · 상수 2.

## 컴포넌트

### `SheetGrid`

```ts
SheetGrid(__namedParameters: SheetGridProps): Element
```

## 훅 (Hooks)

### `useSheet`

```ts
useSheet(): UseSheetResult
```

## 함수

### `cellError`

Construct an error value.

```ts
cellError(code: ErrorCode): CellError
```

### `coerceLiteral`

Coerce raw literal text → a CellValue (number / boolean / string; `""` for empty).

```ts
coerceLiteral(raw: string): CellValue
```

### `compileCell`

Compile a cell's raw input: a `=`-prefixed formula (parsed + qualified + refs), else a literal.

```ts
compileCell(raw: string, ctx: CompileContext): CompiledCell
```

### `createSheet`

```ts
createSheet(onChange: (…) => …): Sheet
```

### `evaluate`

Evaluate a formula AST to a scalar CellValue. Errors propagate; never throws.

```ts
evaluate(ast: Ast, getCell: CellGetter): CellValue
```

### `expandRange`

Expand `A1:B2` (inclusive, order-normalized) → cell refs `[A1, A2, B1, B2]` (column-major).

```ts
expandRange(from: string, to: string): string[]
```

### `extractRefs`

Cells this formula depends on (refs + expanded ranges), de-duplicated.

```ts
extractRefs(ast: Ast): string[]
```

### `formatSheetValue`

Format a displayed cell value by `format`. Returns `display` unchanged when `format` is undefined
or the value is non-numeric (empty / error / text).

```ts
formatSheetValue(display: string, format: SheetCellFormat): string
```

### `formatValue`

Render a CellValue for display (errors → their code, booleans → TRUE/FALSE).

```ts
formatValue(v: CellValue): string
```

### `isCellError`

Type guard for CellError.

```ts
isCellError(v: unknown): v
```

### `parseA1`

Parse `"A1"` → `{ col, row }` (0-based). Throws on malformed input.

```ts
parseA1(ref: string): { … }
```

### `parseFormula`

```ts
parseFormula(src: string): Ast
```

### `serializeAst`

Serialize an Ast back to formula text (no leading `=`). Parenthesizes only where
precedence/associativity require, so `serialize(parse(x))` round-trips to an equivalent formula.
Strings re-quote (the tokenizer has no escapes, so any string it produced round-trips verbatim).

```ts
serializeAst(ast: Ast): string
```

### `sheetStyleToCss`

Map a SheetCellStyle to inline CSS (only set props emitted).

```ts
sheetStyleToCss(style: SheetCellStyle): CSSProperties
```

### `toA1`

Format `{ col, row }` (0-based) → `"A1"`.

```ts
toA1(col: number, row: number): string
```

### `translateFormula`

: translate a formula for a copy/fill by (dCol,dRow) cells. Relative refs shift,
absolute (`$`) axes stay fixed; a ref shifted out of bounds becomes `#REF!`. Non-formula cells
(no leading `=`) and unparseable formulas are returned verbatim (mirrors compileCell's
catch — downstream compile turns a bad formula into `#ERROR!`).

```ts
translateFormula(raw: string, dCol: number, dRow: number): string
```

## 타입 · 인터페이스

### `CellError`

An error value — propagated through arithmetic and functions.

| 속성 | 타입 | 설명 |
|---|---|---|
| `error` | `ErrorCode` |  |

### `Sheet`

| 속성 | 타입 | 설명 |
|---|---|---|
| `canRedo` | `unknown` |  |
| `canUndo` | `unknown` |  |
| `defineName` | `unknown` |  |
| `getDisplay` | `unknown` |  |
| `getRaw` | `unknown` |  |
| `getValue` | `unknown` |  |
| `redo` | `unknown` |  |
| `setCell` | `unknown` |  |
| `undo` | `unknown` |  |

### `SheetCellStyle`

Per-cell visual style spec.

| 속성 | 타입 | 설명 |
|---|---|---|
| `align?` | `"left" \| "center" \| "right"` | Horizontal text alignment. |
| `background?` | `string` | Fill / background color (CSS color). |
| `bold?` | `boolean` |  |
| `border?` | `boolean` | When true, draws a 1px solid border (overriding the base). |
| `color?` | `string` | Text color (CSS color). |
| `italic?` | `boolean` |  |

### `SheetChange`

A recomputed cell (in recompute order).

| 속성 | 타입 | 설명 |
|---|---|---|
| `ref` | `string` |  |
| `value` | `CellValue` |  |

### `SheetGridProps`

| 속성 | 타입 | 설명 |
|---|---|---|
| `cellStyles?` | `Record<string, SheetCellStyle>` | : per-cell visual style, keyed by A1 ref (e.g. `{ A1: { bold: true } }`). Merged onto the cell; the range-selection highlight still wins. |
| `cols?` | `number` | Number of columns (default 6). |
| `formats?` | `Record<string, SheetCellFormat>` | : per-cell number format, keyed by A1 ref (e.g. `{ B2: { type: 'currency' } }`). Applied to the displayed value; unformatted cells render unchanged. Non-numeric values (errors/text) pass through. |
| `merges?` | `string[]` | : 셀 병합 — A1 범위 문자열 배열(e.g. `['A1:', 'B5:B7']`). 좌상단 anchor 셀이 `<td rowSpan colSpan>` 로 렌더되고 피복 셀은 렌더 생략(HTML table 병합). 겹침/경계 규칙은 computeSheetMerges 참조(first-wins·clamp·1×1 무시). |
| `rows?` | `number` | Number of rows (default 12). |

### `UseSheetResult`

| 속성 | 타입 | 설명 |
|---|---|---|
| `canRedo` | `boolean` | 재적용 가능 여부. |
| `canUndo` | `boolean` | 취소 가능 여부(현재 렌더 시점). |
| `getDisplay` | `(…) => …` | Display string for a cell (computed value; errors → code). |
| `getRaw` | `(…) => …` | Raw input of a cell (the formula text, for editing). |
| `redo` | `(…) => …` | : 취소한 편집 재적용. |
| `setCell` | `(…) => …` | Set a cell's raw input (`=A1+A2` or a literal) — triggers recalc + re-render. |
| `undo` | `(…) => …` | : 직전 셀 편집 취소(재계산 + re-render). |

### `Ast`

Formula AST node.

```ts
type Ast = { … } | { … } | { … } | { … } | { … } | { … } | { … } | { … } | { … } | { … }
```

### `CellGetter`

Resolves an A1 cell reference to its current value ( host-capability injection).

```ts
type CellGetter = (…) => …
```

### `CellValue`

A resolved cell value.

```ts
type CellValue = number | string | boolean | CellError
```

### `CompiledCell`

Result of compiling a cell's raw input.

```ts
type CompiledCell = { … } | { … }
```

### `ErrorCode`

Spreadsheet error codes (PoC set). `#NAME?` = unresolved named range; `#N/A` =
VLOOKUP no-match — both eval-time only (never serialized into formula text, so not in the tokenizer).

```ts
type ErrorCode = "#DIV/0!" | "#CYCLE!" | "#REF!" | "#ERROR!" | "#NAME?" | "#N/A"
```

### `SheetCellFormat`

Per-cell number format spec.

```ts
type SheetCellFormat = { … } | { … } | { … } | { … }
```

## 상수

### `FUNCTIONS`

```ts
const FUNCTIONS: Readonly<Record<string, (…) => …>>
```

### `POSITIONAL_FUNCTIONS`

고정/위치 인자 함수(per-arg 스칼라). text=number→string 강제 지원(LEN(123)=3).

```ts
const POSITIONAL_FUNCTIONS: Readonly<Record<string, (…) => …>>
```

