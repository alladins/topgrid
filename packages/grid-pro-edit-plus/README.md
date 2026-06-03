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

## Roadmap

| Goal | Status |
|------|--------|
| G-1 validation rule engine | ✅ |
| G-2 undo/redo stack (builds on tracking `undoRow`/`__original`) | planned |
| G-3 find & replace (reuses `grid-pro-range` clipboard/edit) | planned |
| G-4 cell comments (storage-persisted) | planned |

## License

Commercial — see [EULA](./EULA.md). © Platree Co., Ltd.
