# @topgrid/grid-pro-panel

Pro: declarative grid chrome — a status bar, a column tool panel, and a
drag-and-drop row-group panel that sit *around* a grid.

All three panels are prop-driven headless UI: they composite no `<Grid>`, so
they mount in plain Node (server rendering, tests). The grouping bar reuses the
proven `GroupPanel` from `@topgrid/grid-pro-agg` — no drag logic is
reimplemented here.

## Installation

```bash
pnpm add @topgrid/grid-pro-panel
# or
npm install @topgrid/grid-pro-panel
```

## License Activation

> **This is a Pro package requiring a valid license key.**

```tsx
import { setLicenseKey } from '@topgrid/grid-license';

// Call once at your app entry point (e.g., main.tsx)
setLicenseKey('YOUR-LICENSE-KEY');
```

Without a valid license, `StatusBar`, `ToolPanel`, and `RowGroupPanel` render a
watermark. Contact [sales@platree.com](mailto:sales@platree.com) to obtain a
license key.

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@tanstack/react-table` | `^8.0.0` |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |

## Usage

### Status bar

```tsx
import { StatusBar } from '@topgrid/grid-pro-panel';

<StatusBar
  items={[
    { key: 'sel', label: 'Selected', value: 3 },
    { key: 'sum', label: 'Total', value: '$1,240' },
  ]}
/>
```

### Tool panel (drives grid-core column state)

```tsx
import { ToolPanel } from '@topgrid/grid-pro-panel';

<ToolPanel
  columns={[
    { id: 'name', label: 'Name', visible: true, canHide: false },
    { id: 'age', label: 'Age', visible: true },
  ]}
  onVisibilityChange={(id, visible) => setColumnVisibility((v) => ({ ...v, [id]: visible }))}
  onReorder={(id, dir) => moveColumn(id, dir)}
/>
```

`onVisibilityChange` / `onReorder` are the consumer's hook into grid-core
`columnVisibility` / `columnOrder` — the panel keeps no state of its own.

### Row-group panel (reused drag-grouping bar)

```tsx
import { RowGroupPanel } from '@topgrid/grid-pro-panel';

<RowGroupPanel
  grouping={grouping}
  columns={table.getAllLeafColumns()}
  onGroupingChange={setGrouping}
/>
```

`RowGroupPanel` delegates all drag-and-drop grouping to `@topgrid/grid-pro-agg`.

## Main API

| Export | Description |
|--------|-------------|
| `StatusBar` | Horizontal bar of `label: value` segments (net-new) |
| `StatusBarItem` | Segment type: `{ key; label?; value }` |
| `StatusBarProps` | Props type for `StatusBar` |
| `ToolPanel` | Column visibility/order control (callback-driven) |
| `ToolPanelColumn` | Column row type: `{ id; label; visible; canHide? }` |
| `ToolPanelProps` | Props type for `ToolPanel` |
| `RowGroupPanel` | Drag-grouping bar (reuses agg `GroupPanel`) |
| `RowGroupPanelProps` | Props type (alias of agg `GroupPanelProps`) |

## License

SEE LICENSE IN [EULA.md](./EULA.md)

License terms subject to change. Contact [sales@platree.com](mailto:sales@platree.com) for current EULA.

---

[Documentation](https://topgrid.platree.com) | [Pricing](https://topgrid.platree.com/pricing)

© Platree Co., Ltd. All rights reserved.
