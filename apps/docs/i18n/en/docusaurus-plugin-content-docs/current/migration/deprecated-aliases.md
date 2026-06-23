---
title: Deprecated Alias List
sidebar_position: 5
---

# Deprecated Alias List

:::warning Mismatch with current API — rewrite planned
The `<Grid mode="client">` notation in the recommended replacement examples **does not match the current API** — `<Grid>` no longer has a top-level
`mode` prop. Client mode is the default with `<Grid columns data />`. **A rewrite to the current pattern is planned.**
:::

`@topgrid/grid-core` provides **5 legacy aliases** for backward compatibility
with the earlier Grid variant components. Under the C-23 semver policy, these aliases are
**maintained for at least 1 minor version**.

> **Note**: `EditableGrid`, `ChangeTrackingGrid`, and `RangeSelectGrid` have
> no alias in `@topgrid/grid-core`. Import them directly from their respective packages.
> For details, see the ["Components without a grid-core alias"](#components-without-a-grid-core-alias) section at the bottom of this document.

---

## C-23 semver policy summary

**C-23 verbatim summary**:
> - A deprecated API keeps its alias for at least 1 minor version
> - On a breaking change, provide a migration guide in CHANGELOG.md
> - All packages follow semver (using the Changeset tool)

These 5 aliases are maintained throughout `@topgrid/grid-core v0.x`, and
removing them after `v1.0` requires an advance notice period of at least 1 minor version (`v1.1` or later).

---

## grid-core/src/index.ts verification result

```ts
// @topgrid/grid-core/src/index.ts (실제 확인)
// G-005 D8: legacy alias 5종 — main entry 호환 (`/legacy` sub-entry 권장).
export {
  BaseGrid,
  VirtualGrid,
  type VirtualGridProps,
  ColumnPinGrid,
  type ColumnPinGridProps,
  GroupedHeaderGrid,
  type GroupedHeaderGridProps,
  TreeGrid,
  type TreeGridProps,
} from './legacy';
```

---

## Alias 1: BaseGrid

| Item | Value |
|------|---|
| **alias name** | `BaseGrid` |
| **re-export source** | `@topgrid/grid-core/src/legacy` |
| **recommended replacement** | `<Grid mode="client">` from `@topgrid/grid-core` |
| **scheduled removal** | current minor + 1 or later (C-23 guarantee) |

```tsx
// 현재 (alias 사용 — deprecated)
import { BaseGrid } from '@topgrid/grid-core';
<BaseGrid data={data} columns={columns} pagination={{ pageSize: 20 }} />

// 권장 (Grid 직접 사용)
import { Grid } from '@topgrid/grid-core';
<Grid mode="client" data={data} columns={columns} pagination={{ pageSize: 20 }} />
```

**Reason for migration**: `BaseGrid` was fixed to client-side only, with no `mode` prop.
Explicitly specifying `<Grid mode="client">` or `mode="server"` expresses the intent more clearly.

---

## Alias 2: VirtualGrid

| Item | Value |
|------|---|
| **alias name** | `VirtualGrid`, `VirtualGridProps` |
| **re-export source** | `@topgrid/grid-core/src/legacy` |
| **recommended replacement** | `<Grid enableVirtualization rowHeight containerHeight>` |
| **scheduled removal** | current minor + 1 or later (C-23 guarantee) |

```tsx
// 현재 (alias 사용 — deprecated)
import { VirtualGrid } from '@topgrid/grid-core';
<VirtualGrid data={largeData} columns={columns} rowHeight={40} containerHeight={500} />

// 권장 (Grid enableVirtualization)
import { Grid } from '@topgrid/grid-core';
<Grid
  mode="client"
  enableVirtualization
  data={largeData}
  columns={columns}
  rowHeight={40}
  containerHeight={500}
/>
```

> **EC-06 note**: Code that used the `pagination` prop on `VirtualGrid`
> should remove the `pagination` prop when migrating to `<Grid enableVirtualization>`.
> A virtualized Grid manages the entire dataset outside the DOM, so it is not used together with pagination.

---

## Alias 3: ColumnPinGrid

| Item | Value |
|------|---|
| **alias name** | `ColumnPinGrid`, `ColumnPinGridProps` |
| **re-export source** | `@topgrid/grid-core/src/legacy` |
| **recommended replacement** | `<Grid columnPinning={{ left: [...], right: [...] }}>` |
| **scheduled removal** | current minor + 1 or later (C-23 guarantee) |

```tsx
// 현재 (alias 사용 — deprecated)
import { ColumnPinGrid } from '@topgrid/grid-core';
<ColumnPinGrid
  data={data}
  columns={columns}
  pinLeft={['id', 'name']}
  pinRight={['actions']}
/>

// 권장 (Grid 직접 사용)
import { Grid } from '@topgrid/grid-core';
<Grid
  mode="client"
  data={data}
  columns={columns}
  columnPinning={{ left: ['id', 'name'], right: ['actions'] }}
/>
```

---

## Alias 4: GroupedHeaderGrid

| Item | Value |
|------|---|
| **alias name** | `GroupedHeaderGrid`, `GroupedHeaderGridProps` |
| **re-export source** | `@topgrid/grid-core/src/legacy` → `@topgrid/grid-pro-header` |
| **recommended replacement** | `import { GroupedHeaderGrid } from '@topgrid/grid-pro-header'` (direct) |
| **scheduled removal** | current minor + 1 or later (C-23 guarantee) |

```tsx
// 현재 (grid-core alias 경유 — deprecated)
import { GroupedHeaderGrid } from '@topgrid/grid-core';

// 권장 (grid-pro-header 직접 import)
import { GroupedHeaderGrid } from '@topgrid/grid-pro-header';

// 사용법은 동일
<GroupedHeaderGrid data={data} columns={columnGroups} />
```

> **Note**: The legacy `GroupedHeaderGrid.tsx` is
> already re-exported from `@topgrid/grid-pro-header`, so existing relative-path imports
> also use the correct implementation.

---

## Alias 5: TreeGrid

| Item | Value |
|------|---|
| **alias name** | `TreeGrid`, `TreeGridProps` |
| **re-export source** | `@topgrid/grid-core/src/legacy` |
| **recommended replacement** | `<Grid treeData getSubRows expandAll>` |
| **scheduled removal** | current minor + 1 or later (C-23 guarantee) |

```tsx
// 현재 (alias 사용 — deprecated)
import { TreeGrid } from '@topgrid/grid-core';
<TreeGrid
  data={treeData}
  columns={columns}
  getSubRows={(row) => row.children}
  expandAll={false}
/>

// 권장 (Grid 직접 사용)
import { Grid } from '@topgrid/grid-core';
<Grid
  mode="client"
  treeData
  data={treeData}
  columns={columns}
  getSubRows={(row) => row.children}
  expandAll={false}
/>
```

---

## Components without a grid-core alias

The 3 components below have **no** legacy alias in `@topgrid/grid-core`.
Import each one directly from its dedicated package.

> **EC-01**: Attempting to import these components from `@topgrid/grid-core` produces a TypeScript error.

### EditableGrid

```tsx
// ❌ 잘못된 방법 — grid-core에 alias 없음
import { EditableGrid } from '@topgrid/grid-core'; // TypeScript 에러

// ✅ 올바른 방법 — 전용 패키지 사용
import { EditableCell } from '@topgrid/grid-renderers';
import { useChangeTracking } from '@topgrid/grid-pro-tracking';

// 또는 레거시 로컬 쉘 import (이전 완료 전까지)
import { EditableGrid } from '@/components/legacy/Grid/EditableGrid';
```

### ChangeTrackingGrid

```tsx
// ❌ 잘못된 방법 — grid-core에 alias 없음
import { ChangeTrackingGrid } from '@topgrid/grid-core'; // TypeScript 에러

// ✅ 올바른 방법 — 레거시 로컬 compat shim (이미 완전 이전)
import { ChangeTrackingGrid } from '@/components/legacy/Grid/ChangeTrackingGrid';

// 또는 hook 직접 사용
import { useChangeTracking } from '@topgrid/grid-pro-tracking';
```

### RangeSelectGrid

```tsx
// ❌ 잘못된 방법 — grid-core에 alias 없음
import { RangeSelectGrid } from '@topgrid/grid-core'; // TypeScript 에러

// ✅ 올바른 방법 — 레거시 로컬 wrapper (이미 완전 이전)
import { RangeSelectGrid } from '@/components/legacy/Grid/RangeSelectGrid';

// 또는 pro 패키지 직접 사용
import { RangeSelectGrid, useCellRange } from '@topgrid/grid-pro-range';
```

---

## Full alias summary table

| alias | exists in grid-core | recommended replacement | semver guarantee |
|-------|--------------|----------|------------|
| `BaseGrid` | ✅ | `<Grid mode="client">` | current minor + 1 or later |
| `VirtualGrid` | ✅ | `<Grid enableVirtualization>` | current minor + 1 or later |
| `ColumnPinGrid` | ✅ | `<Grid columnPinning>` | current minor + 1 or later |
| `GroupedHeaderGrid` | ✅ | `@topgrid/grid-pro-header` directly | current minor + 1 or later |
| `TreeGrid` | ✅ | `<Grid treeData>` | current minor + 1 or later |
| `EditableGrid` | ❌ | `@topgrid/grid-renderers` + local shell | — |
| `ChangeTrackingGrid` | ❌ | `@topgrid/grid-pro-tracking` compat shim | — |
| `RangeSelectGrid` | ❌ | `@topgrid/grid-pro-range` wrapper | — |

---

## Related documents

- [8 Grid variants migration guide](./8-variant-table.md)
- [DataTable migration guide](./dataTable-migration.md)
- [Incremental migration strategy](./incremental-strategy.md)
- [Live demos](./live-demos.md)

> **Sidebar registration**: This document is added to `sidebars.ts` in the G-001 (Docusaurus setup) PR (D4).
