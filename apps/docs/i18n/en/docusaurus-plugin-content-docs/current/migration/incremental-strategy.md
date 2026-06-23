---
title: Incremental Migration Strategy
sidebar_position: 3
---

# Incremental Migration Strategy (Based on C-19)

This document describes the **incremental migration strategy** applied when migrating
legacy Grid components to a `@topgrid/grid-core` foundation.

Large bulk conversions carry a high risk of conflicts and a high rollback cost. Following
the C-19 rule, the work is split into Goal-sized units and migrated independently.

---

## The C-19 Rule — ≤ 5 Usage Files per Goal

**Summary of the original C-19 text**:
> Migrate ≤ 5 affected usage files (`affectedUsageFiles`) per Goal.
> If there are 6 or more, split them into a separate Goal.
> **Exception**: trivial changes that only modify the import path are allowed up to ≤ 10 files.

### Why 5?

| Reason | Explanation |
|------|------|
| Reviewability | At 5 files per PR, a code reviewer can grasp the whole change |
| Rollback scope | If a migration fails, only 5 files need to be reverted |
| Conflict minimization | Reduces the overlap with feature work being done by other developers |
| Verification unit | Verifying on the actual screen after migrating 5 files is realistic |

---

## Overview of All Usage Files

The total number of usage files covered by Goals up to MOD-GRID-17 is estimated at **≥ 27**.
The exact count and file list are cited from **MOD-GRID-17 Goals as the authoritative source**.

> This figure is derived from the MOD-GRID-17 Goal list (the full scope of the Grid migration)
> and is not verified directly in the G-004 spec. (G-004 spec, decision D5)

---

## Criteria for Grouping by Goal

### Criterion 1: Group by variant type

Group files that use the same variant component into the same Goal.

```
Goal A: Migrate 5 BaseGrid usages
Goal B: Migrate 5 BaseGrid usages (additional)
Goal C: Migrate 3 VirtualGrid usages
Goal D: Migrate 4 TreeGrid usages
...
```

**Advantage**: The conversion pattern is identical, so code review is fast.

### Criterion 2: Group by domain type

Group files from the same business domain into the same Goal.

```
Goal A: Migrate 5 payroll-domain Grid files
Goal B: Migrate 5 HR-domain Grid files
Goal C: Migrate 5 accounting-domain Grid files
...
```

**Advantage**: A domain expert can review everything in a single PR.

### Criterion 3: Mixed (variant + domain)

When there are many trivial conversions (import path changes only), group up to 10 files per domain.

---

## Recommended Migration Order

### Phase 1: Usages of fully migrated variants (first)

Usages of variants that have already been migrated via a shim or re-export only require
an import path change. Their conversion cost is low, so handle them first.

| Variant | Migration method | Estimated number of Goals |
|------|----------|-------------|
| GroupedHeaderGrid | Change import path (`@topgrid/grid-pro-header`) | 1–2 Goals |
| ChangeTrackingGrid | No change (compat shim retained) | 0 Goals |
| RangeSelectGrid | No change (wrapper retained) | 0 Goals |

```tsx
// Migrating GroupedHeaderGrid usages (trivial — import change only)
// Before
import { GroupedHeaderGrid } from '../Grid/GroupedHeaderGrid';

// After
import { GroupedHeaderGrid } from '@topgrid/grid-pro-header';
// ↑ Or leave it as is (GroupedHeaderGrid.tsx already re-exports it)
```

### Phase 2: Usages of partially migrated variants

`EditableGrid` usages are migrated after the corresponding MOD-GRID Goal is complete,
since the component shell is still kept locally.

### Phase 3: Usages of unmigrated variants (BaseGrid, VirtualGrid, TreeGrid, ColumnPinGrid)

Start with the variants that have a legacy alias (TreeGrid, ColumnPinGrid).
Since only the import path needs to change, these count as trivial conversions.

```
Goal X:   Migrate 10 TreeGrid usages (trivial exception applies)
Goal X+1: Migrate 10 ColumnPinGrid usages (trivial exception applies)
Goal X+2: Migrate 5 BaseGrid usages (requires adding the mode="client" prop)
Goal X+3: Migrate 5 BaseGrid usages (additional)
...
```

### Phase 4: DataTable usages

DataTable has the highest conversion cost (`ColumnInfo` → `ColumnDef`, separating out `listAction`, etc.).
Handle each page as an individual Goal.

```
Goal Y:   Migrate 3 DataTable usages (payroll domain)
Goal Y+1: Migrate 3 DataTable usages (HR domain)
...
```

---

## Example MOD-GRID-17 Goal Structure

MOD-GRID-17 is responsible for migrating all usages. Below is an example of how Goals are split.

```
MOD-GRID-17/
  G-001: TreeGrid usages 1–10 (trivial, 10 files)
  G-002: ColumnPinGrid usages 1–8 (trivial, 8 files)
  G-003: BaseGrid usages 1–5 (add mode="client")
  G-004: BaseGrid usages 6–10
  G-005: VirtualGrid usages 1–4 (verify containerHeight)
  G-006: EditableGrid usages 1–5 (after shell is complete)
  G-007: DataTable usages 1–3 (payroll)
  G-008: DataTable usages 4–6 (HR)
  ...
```

> **Total number of Goals**: Based on 27 usages, roughly 8–12 Goals are expected (varies with conversion complexity).

---

## Rollback Strategy

Thanks to independent per-file migration, partial rollback is possible.

```
When a problem is found after completing a Goal:
1. Revert only the 5 files of that Goal
2. Since the deprecated alias is retained, the previous code is restored immediately
3. No impact on the next Goal's work
```

### The importance of retaining deprecated aliases

Per C-23, legacy aliases are retained for at least one minor version.
If a problem arises during migration, you can roll back immediately via the original import path.

```tsx
// Rollback — via the deprecated alias (always possible)
import { BaseGrid } from '@topgrid/grid-core'; // legacy alias still retained
// or
import { BaseGrid } from '../Grid/BaseGrid';  // original file still retained
```

For the full list of aliases, see the [Deprecated Alias document](./deprecated-aliases.md).

---

## Checklist (before starting a Goal)

```
□ Are there 5 or fewer files to migrate?
□ Have they been grouped by the same variant or the same domain?
□ Have you checked the migration status of that variant? (see 8-variant-table.md)
□ Have you confirmed that the deprecated alias is retained?
□ Is there a plan to verify on the actual screen after migration?
```

---

## Related Documents

- [8 Grid Variants Migration Guide](./8-variant-table.md)
- [DataTable Migration Guide](./dataTable-migration.md)
- [Deprecated Alias List](./deprecated-aliases.md)
- [Live Demos](./live-demos.md)

> **Sidebar registration**: This document is added to `sidebars.ts` in the G-001 (Docusaurus setup) PR (D4).
