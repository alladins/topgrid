# MOD-GRID-15 Lessons — Reusable Catalog for Future Pro Aggregation Goals

**Module**: MOD-GRID-15 (`@tomis/grid-pro-agg`)
**Date**: 2026-05-15
**Scope**: G-001~G-004 (TanStack groupedRowModel + footer + registry + GroupPanel)
**Author**: tw-grid Harness Reviewer (Step 7 Self-Review)

This file catalogs reusable lessons discovered during MOD-GRID-15 implementation.
Cascading apply: future Pro aggregation/virtualization Goals (MOD-GRID-04~14, MOD-GRID-99-A/B).

---

## Lesson 1: TanStack v8 Row vs Cell API Discrimination

### Problem Pattern (G-001 auto-fix + G-002 specCodeDefect)

LLM agents systematically confuse Row-level and Cell-level TanStack APIs.
Both `row` and `cell` have similar method names (`getIsGrouped`, `getIsExpanded`, etc.),
but `getIsAggregated()` only exists on **Cell** in v8.
`getParentRow()` does not exist at all (frequently hallucinated).

### G-001 actual error (auto-fixed)

```tsx
// WRONG (TS2339 compile error):
{table.getRowModel().rows.map((row) => (
  <tr className={row.getIsAggregated() ? 'bg-blue-50' : ''}>...
))}
```

Fix: aggregation state lives at cell level only.

```tsx
// CORRECT:
{row.getVisibleCells().map((cell) => (
  <td>{cell.getIsAggregated() ? flexRender(cell.column.columnDef.aggregatedCell, ...) : ...}</td>
))}
```

### G-002 actual error (specCodeDefect)

spec L398 referenced `row.getParentRow?.()` — does not exist in TanStack v8.
Implementer caught it (Grep `getParentRow` on `@tanstack/react-table/index.d.ts` → 0 hits)
and substituted stack-based parent tracking (see Lesson 2).

### API Discrimination Table (v8)

| API                          | Row | Cell | Table | Notes                                                          |
|------------------------------|-----|------|-------|-----------------------------------------------------------------|
| `getIsGrouped()`             | ✓   | ✓    |       | Both exist with same name (different semantics)                 |
| `getIsAggregated()`          | ✗   | ✓    |       | **Cell only** — Row has no equivalent                           |
| `getIsPlaceholder()`         | ✗   | ✓    |       | Cell only (group leaf cell that's not the grouping column)      |
| `getIsExpanded()`            | ✓   | ✗    |       | Row only                                                         |
| `getCanExpand()`             | ✓   | ✗    |       | Row only                                                         |
| `getToggleExpandedHandler()` | ✓   | ✗    |       | Row only                                                         |
| `subRows`                    | ✓   | ✗    |       | Row only (Row[])                                                 |
| `depth`                      | ✓   | ✗    |       | Row only (number)                                                |
| `groupingColumnId`           | ✓   | ✗    |       | Row only (column id used for current grouping bucket)            |
| `groupingValue`              | ✓   | ✗    |       | Row only                                                         |
| `getValue(columnId)`         | ✓   | ✗    |       | Row only — Cell uses `cell.getValue()` (no arg)                  |
| `getValue()`                 | ✗   | ✓    |       | Cell only — no arg                                               |
| `getParentRow()`             | ✗   | ✗    |       | **Does NOT exist in v8** — common hallucination                  |
| `toggleAllRowsExpanded()`    | ✗   | ✗    | ✓     | Table only                                                       |
| `getIsAllRowsExpanded()`     | ✗   | ✗    | ✓     | Table only                                                       |

### Recommended Verification Pattern

Before using any `row.getIs*()` or `row.get*()` API not in the table above:

```bash
# Verify against installed TanStack version
Grep "getParentRow" packages/{pkg}/node_modules/@tanstack/react-table/build/lib/index.d.ts
```

0 hits = doesn't exist. Use stack-based or alternative pattern.

---

## Lesson 2: Virtualized Group Footer — buildInterleavedRows + RowDescriptor[] Pattern

### Problem Pattern (G-002 AC-004)

When `enableVirtualization=true`, `virtualizer.count` must match the total rendered row count
(group headers + leaf rows + group footers). Naively setting `count = table.getRowModel().rows.length`
excludes group footer rows — they disappear from the virtualization window.

### Solution Pattern

Pre-compute a flattened `RowDescriptor[]` array with explicit `kind` discriminator,
then pass `count = interleavedRows.length` to `useVirtualizer`. Same `renderDescriptor()` function
serves both virtualized and non-virtualized paths.

### Reusable Snippet

```typescript
type RowDescriptor<TData> =
  | { kind: 'group'; row: Row<TData>; columnCount: number }
  | { kind: 'leaf'; row: Row<TData> }
  | { kind: 'footer'; row: Row<TData>; cells: Cell<TData, unknown>[] };

function buildInterleavedRows<TData>(
  rows: Row<TData>[],
  showFooter: boolean
): RowDescriptor<TData>[] {
  const result: RowDescriptor<TData>[] = [];
  const groupStack: Row<TData>[] = []; // open group headers awaiting closure

  for (const row of rows) {
    // Close any groups deeper than (or equal to) current row's depth
    while (groupStack.length > 0 && groupStack[groupStack.length - 1].depth >= row.depth) {
      const closing = groupStack.pop()!;
      if (showFooter) result.push({ kind: 'footer', row: closing, cells: closing.getVisibleCells() });
    }

    if (row.getIsGrouped()) {
      result.push({ kind: 'group', row, columnCount: row.getVisibleCells().length });
      groupStack.push(row);
    } else {
      result.push({ kind: 'leaf', row });
    }
  }

  // Close remaining open groups at end of iteration
  while (groupStack.length > 0) {
    const closing = groupStack.pop()!;
    if (showFooter) result.push({ kind: 'footer', row: closing, cells: closing.getVisibleCells() });
  }

  return result;
}
```

### Usage (both virtualized and non-virtualized)

```typescript
const interleavedRows = useMemo(() => buildInterleavedRows(rows, showFooter), [rows, showFooter]);

const virtualizer = useVirtualizer({
  count: enableVirtualization ? interleavedRows.length : 0, // 0 disables, hook always called
  getScrollElement: () => scrollRef.current,
  estimateSize: () => estimatedRowHeight,
  overscan: virtualOverscan,
});

const renderDescriptor = (desc: RowDescriptor<TData>) => {
  if (desc.kind === 'group') return <GroupRow ... />;
  if (desc.kind === 'leaf')  return <tr>{desc.row.getVisibleCells().map(...)}</tr>;
  return <FooterRow row={desc.row} cells={desc.cells} ... />;
};

// Non-virtualized:
{interleavedRows.map(renderDescriptor)}

// Virtualized:
{virtualizer.getVirtualItems().map((vi) => (
  <tr key={vi.key} style={{ transform: `translateY(${vi.start}px)`, ... }}>
    {renderDescriptor(interleavedRows[vi.index])}
  </tr>
))}
```

### Key invariants

1. `useVirtualizer` is **always called** (Hook order guarantee). `count=0` when disabled.
2. `groupStack` enables parent tracking **without** `row.getParentRow()` (which doesn't exist — see Lesson 1).
3. Same `renderDescriptor()` function serves both paths — no DOM divergence between modes.
4. Footer rows are part of `count` — they participate in virtualization (off-screen footers are unmounted, acceptable trade-off documented in EC-04).

### Reuse target

Apply to any Pro Goal with **group-level rendering + virtualization**:
- `grid-pro-merging` (merged cell row insertion)
- `grid-pro-range` (range subtotal rows)
- Future hierarchical/tree grid Goals

---

## Lesson 3: size-limit Pre-existing Infra Defect Pattern

### Problem Pattern (G-003 + G-004 implement E-01)

monorepo `.size-limit.json` for some Pro packages lacks an `ignore` array for peerDeps
(React, TanStack Table, react-virtual). When `size-limit` measures, it bundles peerDeps
into the output, inflating measurement to 58-280 KB while raw tsup output is 9-16 KB
(well within C-21 20 KB Pro limit).

### Recognition signal

- `dist/index.mjs` raw byte size ≤ C-21 limit
- `size-limit` measured (brotli) size >> C-21 limit
- `.size-limit.json` entry for the package lacks `ignore` field
- Other packages in same monorepo (e.g., `grid-pro-tracking`, `grid-features`) have correct `ignore` arrays

### Resolution path

Two options for current Goal:
1. **Defer + N/A claim**: Document in `implement-score.json` `documentedDeviations[]` with raw size + limit + follow-up recommendation. New `E-01 N/A sub-condition` (added 2026-05-15) supports this.
2. **Fix in-Goal**: Only if `.size-limit.json` is in current Goal's spec.implementFiles. Otherwise violates C-1 surgical change.

### Reference fix (`grid-pro-tracking` precedent)

```jsonc
// .size-limit.json entry (correct pattern):
{
  "name": "@tomis/grid-pro-tracking",
  "path": "packages/grid-pro-tracking/dist/index.mjs",
  "limit": "20 KB",
  "ignore": ["react", "react-dom", "@tanstack/react-table", "@tanstack/react-virtual"]
}
```

---

## Lesson 4: Spec Drift Recovery Pattern (F-05 + F-06)

### Observed drift count: 7 across MOD-GRID-15

| Goal  | Drift type     | Field                       | Resolution                              |
|-------|----------------|------------------------------|------------------------------------------|
| G-001 | promptSpecDrift | licenseStub.fnName          | spec applied (`verifyOrWarn`)            |
| G-001 | promptSpecDrift | licenseStub.invocation      | spec applied (module-level)              |
| G-001 | promptSpecDrift | stories.count               | spec applied (3 stories)                 |
| G-001 | promptSpecDrift | props.enableVirtualization  | spec applied (deferred)                  |
| G-002 | specCodeDefect  | row.getParentRow?.()        | stack-based parent tracking fallback     |
| G-002 | specCodeDefect  | flatMap vs forEach pattern  | forEach authoritative (C-30 truth table) |
| G-003 | promptSpecDrift | registerAggregationFn extends| spec applied (`<TData extends object>`)  |
| G-003 | promptSpecDrift | console.warn message text   | spec applied (exact D6 string)           |
| G-004 | promptSpecDrift | dataTransfer key            | spec applied (`columnId`)                |
| G-004 | specCodeDefect  | style={{ cursor: 'pointer' }}| Tailwind cursor-pointer (B-04 fix)      |

### Recovery quality

All 7 drift events were **caught by Implementer** (not by Coverage Verifier post-hoc).
This validates F-05 + F-06 reporting discipline (introduced 2026-05-13~14).
Implementer self-fix + drift report → 0 spec-drift defects in production code.

### Reuse target

Continue F-05 + F-06 reporting discipline. Implementer prompt should always include:
"After receiving prompt, Read spec.md L{D# table} and L{Section 11.2 code blocks} before writing.
Report drifts in promptSpecDrift[] / specCodeDefects[] arrays."

---

## Summary

| Lesson | Cascading apply                                        | Rubric change          |
|--------|--------------------------------------------------------|------------------------|
| 1      | Any Goal using TanStack v8 Row/Cell/Table APIs        | No (catalog only)      |
| 2      | Any Goal with group/tree rendering + virtualization   | No (snippet reference) |
| 3      | All future Pro package Goals until infra defect fixed | implement-rubric E-01 N/A sub-condition |
| 4      | All future Goals (universal)                          | No (existing C-27/C-33)|

End.
