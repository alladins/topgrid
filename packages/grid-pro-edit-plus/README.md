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
import {
  useUndoRedo, makeUpdateCommand, makeAddCommand, makeDeleteCommand,
} from '@topgrid/grid-pro-edit-plus';

const undoRedo = useUndoRedo();

// perform the action, then record its command (the stack does not auto-execute)
const key = tracking.addRow(seed);
undoRedo.push(makeAddCommand(tracking, key, seed, 'id'));

const prior = tracking.rows.find((r) => r.id === key)!; // value BEFORE the update
tracking.updateRow(key, { name: 'new' });
undoRedo.push(makeUpdateCommand(tracking, key, prior, { name: 'new' }));

const row = tracking.rows.find((r) => r.id === key)!;
tracking.deleteRow(key);
undoRedo.push(makeDeleteCommand(tracking, key, row, 'added', 'id')); // 'added' | 'existing'

undoRedo.undo(); // reverts the last action
undoRedo.redo(); // re-applies it
// undoRedo.canUndo / canRedo / clear()
```

> **Delete fidelity:** `makeDeleteCommand` is faithful for **added** rows (undo re-adds with the
> captured key) and **unedited existing** rows (undo = `undoRow`, restores the mount snapshot).
> Deleting an **already-edited existing row** is the one lossy case — `undoRow` restores the
> mount snapshot and drops the in-session edits. `update` and `add` are always faithful. Faithful
> delete-undo of an edited row would require a new seam in `grid-pro-tracking`.

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

## Cell comments (G-4)

Per-cell comments/notes persisted to `localStorage`/`sessionStorage` (SSR-safe). Keyed by
`(rowKey, columnId)`.

```tsx
import { useCellComments } from '@topgrid/grid-pro-edit-plus';

const notes = useCellComments({ storageKey: 'orders-notes' /*, storage: 'session', version: 1 */ });

notes.setComment('r1', 'price', '검토 필요');
notes.getComment('r1', 'price'); // '검토 필요'
notes.deleteComment('r1', 'price');
// notes.comments (ReadonlyMap), notes.clear()
```

> Persists on change, hydrates on mount. SSR / disabled-storage → in-memory no-op (no throw).
> Corrupt or version-mismatched stored data is ignored (restored as empty). The pure key /
> serialize helpers (`commentKey`, `serializeComments`, `deserializeComments`) are exported too.

## Roadmap

| Goal | Status |
|------|--------|
| G-1 validation rule engine | ✅ |
| G-2 undo/redo stack (generic command stack over tracking mutators) | ✅ |
| G-3 find & replace (key-based pure core; composes with G-2) | ✅ |
| G-4 cell comments (storage-persisted) | ✅ |

## License

Commercial — see [EULA](./EULA.md). © Platree Co., Ltd.
