# @topgrid/grid-pro-sheet

**Pro** — spreadsheet mode (PoC) for `@topgrid` grids: a formula engine (A1 references,
SUM/AVERAGE/MIN/MAX/COUNT) with dependency-graph recalculation and cycle detection.

> Commercial license — see [EULA](./EULA.md).

## Installation

```bash
pnpm add @topgrid/grid-pro-sheet
```

## Peer Dependencies

| Package | Version | Required |
|---------|---------|---------|
| `@topgrid/grid-core` | `workspace:*` | Yes |
| `@topgrid/grid-pro-range` | `workspace:*` | Yes (cell editing / clipboard reuse) |
| `@tanstack/react-table` | `^8.0.0` | Yes |
| `react` / `react-dom` | `^18 \|\| ^19` | Yes |

## Formula engine (G-1)

Pure, error-aware, node-verifiable. Values are `CellValue = number | string | boolean | CellError`;
every operator and function **propagates errors** (a cyclic or broken cell always yields a defined
value, never NaN/throw).

```ts
import { compileCell, evaluate, formatValue } from '@topgrid/grid-pro-sheet';

const compiled = compileCell('=SUM(A1:A3)*2'); // { kind: 'formula', ast, refs: ['A1','A2','A3'] }
const getCell = (ref) => ({ A1: 10, A2: 20, A3: 30 }[ref] ?? '');
const value = evaluate(compiled.ast, getCell); // 120
formatValue(value); // "120"
```

- `compileCell(raw)` — `=`-prefixed → parsed formula + dependency refs; else a literal value.
- `evaluate(ast, getCell)` — `getCell(ref)` is **injected** (PAT-005), so the engine never touches
  a cell store. `/0` → `#DIV/0!`, non-numeric arithmetic → `#ERROR!`.
- `extractRefs(ast)` — the dependency set, read off the same parse (the recalc graph never re-parses).
- `parseA1` / `toA1` / `expandRange` — A1 ↔ index, range expansion.

### PoC scope

In: A1 refs + ranges, `+ - * /`, `SUM/AVERAGE/MIN/MAX/COUNT`, dependency recalc with cycle
detection. **Out** (vN): multi-tab sheets, cell formatting, relative-reference adjustment on
copy/fill (`$A$1`) — PoC refs are absolute lookups and copy is value-copy.
