---
"@tomis/grid-pro-master": minor
---

feat(grid-pro-master): add useExpandedPersistence, useRowKeyboardNav, and TreeGrid/ColumnPinGrid re-exports (MOD-GRID-16/G-003)

- `useExpandedPersistence` hook — persists TanStack `ExpandedState` to localStorage/sessionStorage:
  - `UseExpandedPersistenceOptions` interface (`storageKey`, `storageType`, `initialExpanded`)
  - Returns `[expanded, setExpanded]` tuple for external composition with `<MasterDetailGrid>`
  - EC-01/EC-03 error handling: storage-unavailable + QuotaExceeded fallback to in-memory with dev-mode `console.warn`
  - `storageType` change handled via `useRef` — no remount required
- WCAG 2.1 AA keyboard accessibility wired into `<MasterDetailGrid>`:
  - `<tr tabIndex=0>` + `onKeyDown` (Enter/Space toggles row expansion)
  - `focus-visible:outline-2 focus-visible:outline-blue-500` focus ring
  - `useRowKeyboardNav` hook in `internal/useRowKeyboardNav.ts` (not public API)
  - `shouldToggleExpand(key)` pure helper (C-32)
- `TreeGrid` / `ColumnPinGrid` alias re-exports from `@tomis/grid-core`:
  - `export { TreeGrid, type TreeGridProps } from '@tomis/grid-core'`
  - `export { ColumnPinGrid, type ColumnPinGridProps } from '@tomis/grid-core'`
  - Deprecation warning automatic via `useDeprecationWarn` inside G-005 (MOD-GRID-01) implementations
  - C-6 backward compatibility maintained
- `RowPinningOptions` type export (F-16-06 P1 — types only; UI in separate Goal):
  - `pinTop?: string[]` — top-pinned row ids
  - `pinBottom?: string[]` — bottom-pinned row ids

No new peerDependency additions. `@tomis/grid-core: workspace:*` already declared in G-001.
