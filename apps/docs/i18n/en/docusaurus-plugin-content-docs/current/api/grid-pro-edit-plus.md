---
title: "@topgrid/grid-pro-edit-plus"
sidebar_label: "grid-pro-edit-plus"
sidebar_position: 17
---

# @topgrid/grid-pro-edit-plus

> Pro: editing productivity — declarative validation rules (G-1), undo/redo, find&replace, cell comments · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**21** public exports — 10 functions · 2 hooks · 0 components · 9 types · 0 constants.

## Hooks

### `useCellComments`

Cell comment + storage persistence hook — (AC ③).

Hydrates from storage on mount, persists on change (version envelope). Falls back to in-memory
no-op (no throw) when SSR/storage is unavailable. The pure serialization/key logic lives in `./commentStore` ([[commentStore]], node-verified).

```ts
useCellComments(options: UseCellCommentsOptions): CellCommentsAPI
```

### `useUndoRedo`

Generic undo/redo command-stack hook —.

After performing an action, `push` that action's `{undo, redo}` command. Tracking operation commands
are built with `makeUpdateCommand`/`makeAddCommand` ([[bindings]]). Since tracking does not expose an
operation history, this stack serves as the external history (Option B, advisor).

Command side effects run **outside the state updater** (in the event handler) — the ref is the source of truth, and `bump` only
triggers a re-render (avoiding StrictMode double execution).

```ts
useUndoRedo(): UndoRedoAPI
```

## Functions

### `buildValidationCellClass`

Compiles a declarative validation-rule array → grid-core `CellClassNameCallback<TData>`.

Only rules with a `field` participate in cell display — when the cell of that column (`ctx.columnId === rule.field`)
violates (`!validate(row)`), the rule's `className` (default `topgrid-cell-invalid`) is applied.
 Same contract and isomorphic pattern as `buildCellClassName` (declarative rules → existing callback). Pure function.
grid-core 1.0: clean ctx — `cell.column.id`→`ctx.columnId` · `cell.row.original`→`ctx.row`.

```ts
buildValidationCellClass(rules: ValidationRule<TData>[]): CellClassNameCallback<TData>
```

**Example**

```ts
<Grid cellClassName={buildValidationCellClass<Row>([
  { field: 'age', validate: (r) => r.age >= 0, message: '', className: 'border-red-500' },
])} />
```

### `buildValidator`

Compiles a declarative validation-rule array → `@topgrid/grid-pro-tracking`'s `Validator<TData>`.

When the returned validator is injected as tracking's `ChangeTrackingConfig.validator`, tracking, with its **existing behavior**,
excludes invalid rows from `added`/`updated` and collects them into `getChangeSet.errors` — that is,
**commit blocking reuses the tracking contract with no reimplementation** ([[]]). Pure function.

```ts
buildValidator(rules: ValidationRule<TData>[]): Validator<TData>
```

**Example**

```ts
const tracking = useChangeTracking({
  data, rowKey: 'id',
  validator: buildValidator<Row>([
    { field: 'age', validate: (r) => r.age >= 0, message: '나이는 0 이상' },
  ]),
});
```

### `commentKey`

Collision-free cell comment key.

```ts
commentKey(rowKey: string, columnId: string): string
```

### `computeReplacements`

Converts search results into replacement patches (AC ②). **Composition**: the returned `{rowKey, columnId, prior, next}` is
applied via `tracking.updateRow(rowKey, {[columnId]: next})` + `makeUpdateCommand(...)` so it is immediately undoable.

`'whole'` → `next = replacement`. `'substring'` → replaces all matches in `String(value)` with `replacement`
(simple split/join when case-sensitive, `gi` regex when case-insensitive). `next` is always a string.

```ts
computeReplacements(matches: readonly CellMatch[], query: string, replacement: string, options: FindOptions): Replacement[]
```

### `deserializeComments`

Version envelope JSON → comment Map. `null` / parse failure / version mismatch / malformed → **empty Map** (no throw).

```ts
deserializeComments(raw: null | string, version: number): Map<string, string>
```

### `findMatches`

Finds cells in the `columnIds` columns that match `query` (scope-limited = columnIds scoping, AC ②).
Empty query → `[]`. `null`/`undefined` cells are skipped.

```ts
findMatches(rows: readonly TData[], getRowKey: (…) => …, columnIds: readonly string[], query: string, options: FindOptions): CellMatch[]
```

| Parameter | Type | Description |
|---|---|---|
| `rows` | `readonly TData[]` | Rows to search (e.g. `tracking.rows`) |
| `getRowKey` | `(…) => …` | Row→rowKey extractor (same rowKey as tracking's) |
| `columnIds` | `readonly string[]` | List of column ids to search (scope limit) |
| `query` | `string` |  |
| `options` | `FindOptions` |  |

### `makeAddCommand`

Undo/redo command for `addRow`. **Forces the captured `key` into the seed's `rowKeyField` on redo**
— otherwise tracking would issue a new UUID on redo, breaking key references of subsequent stack entries
(advisor note). undo = `deleteRow(key)` (the added row is removed).

**Constraint**: string `rowKey` field only. For a function-based `rowKey`, `push` a custom command.

```ts
makeAddCommand(tracking: Pick<ChangeTrackingAPI<TData>, "addRow" | "deleteRow">, key: string, seed: Partial<TData>, rowKeyField: keyof TData & string): UndoRedoCommand
```

**Example**

```ts
const key = tracking.addRow(seed);
undoRedo.push(makeAddCommand(tracking, key, seed, 'id'));
```

### `makeDeleteCommand`

Undo/redo command for `deleteRow`. The undo path differs depending on whether the row was **added in the session (`'added'`)** vs
**a pre-existing row (`'existing'`)**:
- `'added'`: undo = **re-add** with the captured row+key (`addRow`), redo = `deleteRow`.
- `'existing'`: undo = `undoRow(key)` (restore the mount snapshot), redo = `deleteRow`.

**Limitation ([[]], §5.2 P23-1)**: undo of `'existing'` restores the *mount snapshot*, so if there were
session edits before the deletion, those edits are **lost** (faithful only for pre-existing rows that were not edited). Faithful
delete-undo of an edited pre-existing row requires a new seam in tracking.

```ts
makeDeleteCommand(tracking: Pick<ChangeTrackingAPI<TData>, "addRow" | "deleteRow" | "undoRow">, key: string, deletedRow: TData, kind: "added" | "existing", rowKeyField: keyof TData & string): UndoRedoCommand
```

| Parameter | Type | Description |
|---|---|---|
| `tracking` | `Pick<ChangeTrackingAPI<TData>, "addRow" \| "deleteRow" \| "undoRow">` |  |
| `key` | `string` |  |
| `deletedRow` | `TData` | Row value for `'added'` re-add (at deletion time). Unused for `'existing'`. |
| `kind` | `"added" \| "existing"` | Row kind before deletion. |
| `rowKeyField` | `keyof TData & string` | Field for forcing the key on `'added'` re-add. |

### `makeUpdateCommand`

Undo/redo command for `updateRow`. `priorRow` = row value **just before the update** (captures the prior
value of the patched fields) → undo does `updateRow` with that prior value.

```ts
makeUpdateCommand(tracking: Pick<ChangeTrackingAPI<TData>, "updateRow">, key: string, priorRow: TData, patch: Partial<TData>): UndoRedoCommand
```

**Example**

```ts
const prior = tracking.rows.find((r) => r.id === key)!; // 업데이트 전 값
tracking.updateRow(key, patch);
undoRedo.push(makeUpdateCommand(tracking, key, prior, patch));
```

### `serializeComments`

Comment Map → version envelope JSON string.

```ts
serializeComments(comments: ReadonlyMap<string, string>, version: number): string
```

## Types & Interfaces

### `CellCommentsAPI`

Return surface of `useCellComments`.

| Property | Type | Description |
|---|---|---|
| `clear` | `(…) => …` | Clear all. |
| `comments` | `ReadonlyMap<string, string>` | Current comment Map (`commentKey` → text). Stable reference across renders (when unchanged). |
| `deleteComment` | `(…) => …` | Delete a cell comment. |
| `getComment` | `(…) => …` | Look up a cell comment (undefined if none). |
| `setComment` | `(…) => …` | Set a cell comment (an empty string is also stored — deletion is via deleteComment). |

### `CellMatch`

A single search result. `value` = original cell value (type preserved).

| Property | Type | Description |
|---|---|---|
| `columnId` | `string` |  |
| `rowKey` | `string` |  |
| `value` | `unknown` |  |

### `CommandStackState`

Pure command stack state (immutable).

| Property | Type | Description |
|---|---|---|
| `redoStack` | `readonly UndoRedoCommand[]` |  |
| `undoStack` | `readonly UndoRedoCommand[]` |  |

### `FindOptions`

Search options.

| Property | Type | Description |
|---|---|---|
| `caseSensitive?` | `boolean` | Case sensitivity. |
| `matchMode?` | `"substring" \| "whole"` | `'substring'`=partial match (default) · `'whole'`=match the entire cell. |

### `Replacement`

A single replacement. **For composition with **: `{rowKey, columnId}` + `prior` (original value for undo) + `next` (replacement result).
`next` is **always a string** (see semantics below).

| Property | Type | Description |
|---|---|---|
| `columnId` | `string` |  |
| `next` | `string` | Value after replacement (string). |
| `prior` | `unknown` | Original value before replacement (type preserved) — used to build the undo command. |
| `rowKey` | `string` |  |

### `UndoRedoAPI`

Return surface of `useUndoRedo`.

| Property | Type | Description |
|---|---|---|
| `canRedo` | `boolean` | Whether redo is possible (redo stack is non-empty). |
| `canUndo` | `boolean` | Whether undo is possible (undo stack is non-empty). |
| `clear` | `(…) => …` | Empties both stacks (e.g. after commit). |
| `push` | `(…) => …` | Records the command of an already-performed action. Clears the redo stack (new branch). |
| `redo` | `(…) => …` | Re-applies the reverted command (moves to the undo stack after running `redo`). No-op if empty. |
| `undo` | `(…) => …` | Reverts the most recent command (moves to the redo stack after running `undo`). No-op if empty. |

### `UndoRedoCommand`

Unit undo/redo command. `undo`/`redo` are side effects (usually invoking a tracking mutator).

| Property | Type | Description |
|---|---|---|
| `label?` | `string` | Debugging/UI label (optional). |
| `redo` | `(…) => …` | Re-applies this command. |
| `undo` | `(…) => …` | Reverts this command. |

### `UseCellCommentsOptions`

Options for `useCellComments`.

| Property | Type | Description |
|---|---|---|
| `storage?` | `"local" \| "session"` | `'local'` (default) \| `'session'`. |
| `storageKey` | `string` | Storage key (required). |
| `version?` | `number` | Envelope version — on mismatch, existing data is ignored. |

### `ValidationRule`

A row/field-level validation rule.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | className to apply to a violating cell (used only in rules that specify `field`). |
| `field?` | `keyof TData & string` | Column id for visually marking violating cells. When specified, `buildValidationCellClass` applies the className only to that column's cells. When omitted, it is a row-level rule (no cell display, message/commit-blocking only). |
| `message` | `string` | Message collected into `errors` on violation |
| `validate` | `(…) => …` | Pure predicate — `true` = pass, `false` = violation |

