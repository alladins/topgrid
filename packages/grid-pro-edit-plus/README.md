# @topgrid/grid-pro-edit-plus

**Pro** — editing productivity for `@topgrid` grids: declarative validation rules, undo/redo,
find & replace, cell comments.

> Commercial license — see [EULA](./EULA.md).

## Installation

```bash
pnpm add @topgrid/grid-pro-edit-plus
```

## Peer Dependencies

| Package | Version | Required |
|---------|---------|---------|
| `@topgrid/grid-core` | `workspace:*` | Yes |
| `@topgrid/grid-pro-tracking` | `workspace:*` | Yes (validation pairs with change tracking) |
| `@tanstack/react-table` | `^8.0.0` | Yes |
| `react` / `react-dom` | `^18 \|\| ^19` | Yes |

## Validation rules (G-1)

Declarative rules compiled onto two **existing** contracts — so commit-blocking and styling
are reused, not reimplemented:

- `buildValidator(rules)` → a `grid-pro-tracking` `Validator`. Inject it as the tracking
  `validator`; tracking then excludes invalid rows from the committed change set (commit
  blocking is the tracking package's existing behavior).
- `buildValidationCellClass(rules)` → a grid-core `cellClassName` callback that marks violating
  cells (same shape as `grid-features`' `buildCellClassName`).

```tsx
import { buildValidator, buildValidationCellClass, type ValidationRule } from '@topgrid/grid-pro-edit-plus';
import { useChangeTracking } from '@topgrid/grid-pro-tracking';

interface Row { id: string; name: string; age: number }

const rules: ValidationRule<Row>[] = [
  { field: 'age', validate: (r) => r.age >= 0, message: '나이는 0 이상', className: 'border-red-500' },
  { field: 'name', validate: (r) => r.name.trim().length > 0, message: '이름 필수' },
];

const tracking = useChangeTracking<Row>({
  data, rowKey: 'id',
  validator: buildValidator(rules), // invalid rows excluded from commit (tracking behavior)
});

<Grid cellClassName={buildValidationCellClass(rules)} /* violating cells get the class */ />
```

> `validate` returns `true` for **pass**, `false` for **violation**. Rules without a `field`
> are row-level (message/commit-blocking only, no cell marking).

## Undo / redo (G-2)

A generic command stack over `grid-pro-tracking`'s public mutators. The reuse-gate found
tracking exposes **no operation history / redo / state restore** (its `undoRow` restores the
*mount snapshot*, not a step), so this is a minimal self-contained stack — **not** a tracking
modification.

```tsx
import { useUndoRedo, makeUpdateCommand, makeAddCommand } from '@topgrid/grid-pro-edit-plus';

const undoRedo = useUndoRedo();

// perform the action, then record its command (the stack does not auto-execute)
const key = tracking.addRow(seed);
undoRedo.push(makeAddCommand(tracking, key, seed, 'id'));

const prior = tracking.rows.find((r) => r.id === key)!; // value BEFORE the update
tracking.updateRow(key, { name: 'new' });
undoRedo.push(makeUpdateCommand(tracking, key, prior, { name: 'new' }));

undoRedo.undo(); // reverts the update
undoRedo.redo(); // re-applies it
// undoRedo.canUndo / canRedo / clear()
```

> **Known limitation:** deleting an **already-edited existing row** cannot be faithfully undone —
> tracking's `undoRow` would restore the mount snapshot and lose the in-session edits. `update`
> and `add` are faithful; for delete-of-edited, push a custom `UndoRedoCommand` if you accept the
> constraint. Faithful delete-undo would require a new seam in `grid-pro-tracking`.

## Find & replace (G-3)

Key-based pure functions (`rowKey`/`columnId`) — same coordinate space as tracking and undo/redo,
so they compose directly. Scope is limited by `columnIds`.

```tsx
import { findMatches, computeReplacements } from '@topgrid/grid-pro-edit-plus';

const matches = findMatches(tracking.rows, (r) => r.id, ['name', 'note'], 'apple', {
  caseSensitive: false,
  matchMode: 'substring', // or 'whole'
});

// compose with G-2: apply replacements undoably
const reps = computeReplacements(matches, 'apple', 'pear', { caseSensitive: false });
reps.forEach((rep) => {
  const priorRow = tracking.rows.find((r) => r.id === rep.rowKey)!;
  tracking.updateRow(rep.rowKey, { [rep.columnId]: rep.next });
  undoRedo.push(makeUpdateCommand(tracking, rep.rowKey, priorRow, { [rep.columnId]: rep.next }));
});
```

> **Non-string cells:** matching is done against `String(value)`, and `replace` always produces a
> **string** `next` (e.g. substring-replacing `120` yields `"XX0"`). `prior` keeps the original
> typed value (for faithful undo). Restrict `columnIds` to text columns, or coerce in your
> `updateRow` wiring, if you need to preserve cell types.
>
> **Selection-scoped find** (e.g. within a `grid-pro-range` `CellRange`) is **not coupled** here —
> range is index-based (`{row,col}`) while this is key-based. Map the range to `{ rowKeys,
> columnIds }` in a small consumer adapter and pass the columns to `findMatches`.

## Roadmap

| Goal | Status |
|------|--------|
| G-1 validation rule engine | ✅ |
| G-2 undo/redo stack (generic command stack over tracking mutators) | ✅ |
| G-3 find & replace (key-based pure core; composes with G-2) | ✅ |
| G-4 cell comments (storage-persisted) | planned |

## License

Commercial — see [EULA](./EULA.md). © Platree Co., Ltd.
