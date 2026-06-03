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

## Roadmap

| Goal | Status |
|------|--------|
| G-1 validation rule engine | ✅ |
| G-2 undo/redo stack (generic command stack over tracking mutators) | ✅ |
| G-3 find & replace (reuses `grid-pro-range` clipboard/edit) | planned |
| G-4 cell comments (storage-persisted) | planned |

## License

Commercial — see [EULA](./EULA.md). © Platree Co., Ltd.
