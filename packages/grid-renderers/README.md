# @topgrid/grid-renderers

Cell renderers: Button, Badge, Check, Link, Number, Date, Icon

## Installation

```bash
pnpm add @topgrid/grid-renderers
# or
npm install @topgrid/grid-renderers
# or
yarn add @topgrid/grid-renderers
```

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@tanstack/react-table` | `>=8.0.0 <9.0.0` |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |

## Usage

```tsx
import {
  TextCell,
  NumberCell,
  DateCell,
  StatusBadgeCell,
  ButtonCell,
  LinkCell,
  CheckCell,
} from '@topgrid/grid-renderers';

const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (info) => <TextCell value={info.getValue()} />,
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: (info) => <NumberCell value={info.getValue()} format="currency" />,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => (
      <StatusBadgeCell
        value={info.getValue()}
        statusMap={{ active: 'green', inactive: 'gray' }}
      />
    ),
  },
  {
    accessorKey: 'active',
    header: 'Active',
    cell: (info) => <CheckCell checked={info.getValue()} readOnly />,
  },
  {
    accessorKey: 'url',
    header: 'Link',
    // Use `value` prop (preferred). `label` retained as deprecated alias.
    cell: (info) => <LinkCell value={String(info.getValue())} href="/detail/123" />,
  },
  {
    accessorKey: 'action',
    header: 'Action',
    // Use `value` prop (preferred). `label` retained as deprecated alias.
    cell: () => <ButtonCell value="편집" onClick={() => {}} variant="ghost" />,
  },
];
```

## Main API

| Export | Description |
|--------|-------------|
| `TextCell` | Plain text renderer |
| `NumberCell` | Formatted number renderer |
| `DateCell` | Formatted date/datetime renderer |
| `StatusBadgeCell` | Colored status badge renderer |
| `LinkCell` | Anchor link renderer |
| `ButtonCell` | Action button renderer |
| `CheckCell` | Checkbox renderer |
| `IconCell` | Icon renderer |
| `TagCell` | Tag/chip renderer |
| `AvatarCell` | Avatar image renderer |
| `ProgressCell` | Progress bar renderer |
| `EditableCell` | Inline editable cell renderer |
| `formatNumberString` | Number formatting utility |
| `formatDateTimeFromDateTimeString` | Date formatting utility |

## Migration Notes

### LinkCell / ButtonCell — `value` prop (v0.1.0)

`value` is the preferred prop for display text. The `label` prop is retained as a
deprecated alias for one release cycle and will be removed in the next major version.

```tsx
// Preferred (v0.1.0+)
<LinkCell value="링크 텍스트" href="/detail" />
<ButtonCell value="편집" onClick={handler} />

// Deprecated (still works, remove before next major)
<LinkCell label="링크 텍스트" href="/detail" />
<ButtonCell label="편집" onClick={handler} />
```

## Action / Avatar Column Pattern (ADR-018 X-B)

`button` 과 `avatar` 컬럼은 registry slot 으로 wire 되지 않습니다.
`onClick` (ButtonCell) 과 `name` (AvatarCell) 이 required prop 으로 cell value 단순 lookup 으로는 공급 불가합니다.
type-safe 한 컬럼 정의를 위해 `column.cell` 에 직접 명시하세요:

```typescript
import { ButtonCell, AvatarCell } from '@topgrid/grid-renderers';
import { createColumns } from '@topgrid/grid-core';

// ButtonCell (action 컬럼)
const columns = createColumns<MyRow>([
  {
    id: 'actions',
    name: '작업',
    type: 'text',       // ← type='button' 은 사용 불가 (registry-external)
    cell: ({ row }) => (
      <ButtonCell
        value="편집"
        onClick={() => handleEdit(row.original)}
      />
    ),
    align: 'center',
  },

  // AvatarCell (사용자 이름 + 이미지)
  {
    id: 'user',
    name: '담당자',
    type: 'text',       // ← type='avatar' 는 사용 불가 (registry-external)
    cell: ({ row }) => (
      <AvatarCell name={row.original.userName} src={row.original.avatarUrl} />
    ),
    align: 'left',
  },
]);
```

**사유**: `onClick` (ButtonCell) 과 `name` (AvatarCell) 이 required prop 으로 row data 단순 lookup 불가.
widening cast 를 사용하면 컴파일은 통과하지만 런타임에서 `onClick=undefined → TypeError` 또는
`name=undefined → '?'` fallback 이 발생합니다. (ADR-018 D-3 X-B)

## License

MIT

---

[Documentation](https://grid.tomis.dev) | [API Reference](https://grid.tomis.dev/api)
