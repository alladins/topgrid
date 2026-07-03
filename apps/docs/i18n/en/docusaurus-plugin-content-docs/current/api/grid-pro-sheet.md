---
title: "@topgrid/grid-pro-sheet"
sidebar_label: "grid-pro-sheet"
sidebar_position: 26
---

# @topgrid/grid-pro-sheet

> Pro: spreadsheet mode (PoC) — formula engine (A1 refs, SUM/AVERAGE/…), dependency-graph recalc with cycle detection · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**32** public exports — 16 functions · 1 hooks · 1 components · 12 types · 2 constants.

## Components

### `SheetGrid`

```ts
SheetGrid(__namedParameters: SheetGridProps): Element
```

## Hooks

### `useSheet`

```ts
useSheet(): UseSheetResult
```

## Functions

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

## Types & Interfaces

### `CellError`

An error value — propagated through arithmetic and functions.

| Property | Type | Description |
|---|---|---|
| `error` | `ErrorCode` |  |

### `Sheet`

| Property | Type | Description |
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

| Property | Type | Description |
|---|---|---|
| `align?` | `"left" \| "center" \| "right"` | Horizontal text alignment. |
| `background?` | `string` | Fill / background color (CSS color). |
| `bold?` | `boolean` |  |
| `border?` | `boolean` | When true, draws a 1px solid border (overriding the base). |
| `color?` | `string` | Text color (CSS color). |
| `italic?` | `boolean` |  |

### `SheetChange`

A recomputed cell (in recompute order).

| Property | Type | Description |
|---|---|---|
| `ref` | `string` |  |
| `value` | `CellValue` |  |

### `SheetGridProps`

| Property | Type | Description |
|---|---|---|
| `cellStyles?` | `Record<string, SheetCellStyle>` | : per-cell visual style, keyed by A1 ref (e.g. `{ A1: { bold: true } }`). Merged onto the cell; the range-selection highlight still wins. |
| `cols?` | `number` | Number of columns (default 6). |
| `formats?` | `Record<string, SheetCellFormat>` | : per-cell number format, keyed by A1 ref (e.g. `{ B2: { type: 'currency' } }`). Applied to the displayed value; unformatted cells render unchanged. Non-numeric values (errors/text) pass through. |
| `merges?` | `string[]` | : cell merges — an array of A1 range strings (e.g. `['A1:', 'B5:B7']`). The top-left anchor cell is rendered as `<td rowSpan colSpan>` and the covered cells are skipped from rendering (HTML table merge). For overlap/boundary rules see computeSheetMerges (first-wins·clamp·1×1 ignored). |
| `rows?` | `number` | Number of rows (default 12). |

### `UseSheetResult`

| Property | Type | Description |
|---|---|---|
| `canRedo` | `boolean` | Whether a redo is possible. |
| `canUndo` | `boolean` | Whether an undo is possible (at the current render moment). |
| `getDisplay` | `(…) => …` | Display string for a cell (computed value; errors → code). |
| `getRaw` | `(…) => …` | Raw input of a cell (the formula text, for editing). |
| `redo` | `(…) => …` | : re-apply an undone edit. |
| `setCell` | `(…) => …` | Set a cell's raw input (`=A1+A2` or a literal) — triggers recalc + re-render. |
| `undo` | `(…) => …` | : undo the previous cell edit (recalc + re-render). |

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

## Constants

### `FUNCTIONS`

```ts
const FUNCTIONS: Readonly<Record<string, (…) => …>>
```

### `POSITIONAL_FUNCTIONS`

Fixed/positional-argument functions (per-arg scalar). Supports text=number→string coercion (LEN(123)=3).

```ts
const POSITIONAL_FUNCTIONS: Readonly<Record<string, (…) => …>>
```
