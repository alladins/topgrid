# MOD-GRID-16 / G-001 Architecture Decisions

**Goal**: Master-Detail row expansion for `@tomis/grid-pro-master`  
**Date**: 2026-05-15  
**Status**: Accepted

---

## D1 — Wrapper pattern (Option B): `<MasterDetailGrid>` in grid-pro-master

**Context**: Master-Detail requires Pro EULA boundary. Grid core (MIT) must not carry Pro dependencies.

**Decision**: `MasterDetailGrid.tsx` is a standalone component in `@tomis/grid-pro-master`. It does NOT import `<Grid>` from `@tomis/grid-core` at runtime. It re-implements its own `useReactTable` call using the same `GridProps<TData>` surface for API compatibility.

**Alternatives rejected**:
- Option A (modify Grid.tsx in grid-core): Injects Pro logic into MIT package — EULA boundary violation (C-24).
- Option C (HOC wrapping Grid): Would couple MIT render tree with Pro ref handle — violates D8 clean handle requirement.

**Rationale**: Option B preserves MIT↔Pro isolation. MasterDetailGrid extends GridProps which is a pure type (no runtime MIT dependency).

---

## D2 — `GridHandle<TData>` extended with optional `expandAll?` / `collapseAll?`

**Context**: Master-Detail imperative API requires expand/collapse all rows. These methods must be on the shared GridHandle type to allow typed refs.

**Decision**: Add `expandAll?(): void` and `collapseAll?(): void` as optional methods to `GridHandle<TData>` in `grid-core/src/types.ts`, positioned after `scrollTo`. These are optional (?) because base `<Grid>` does not implement them — only `<MasterDetailGrid>` and future expand-capable components.

**Alternatives rejected**:
- Separate `MasterDetailHandle<TData> extends GridHandle<TData>` interface: Requires cast at call site; useImperativeHandle must satisfy entire handle type.
- Adding as required methods: Would break base Grid.tsx which does not implement expand.

**Rationale**: Optional extension is the minimum change. Future TreeGrid variants may also implement these.

---

## D3 — `ExpandedState` controlled/uncontrolled via `masterDetail.expandedRowKeys`

**Context**: Consumer needs controlled expand state (e.g., persisted expand state tied to parent store).

**Decision**: `MasterDetailOptions.expandedRowKeys?: string[]` + `onExpandChange?: (keys: string[]) => void`. When `expandedRowKeys` is provided, component is controlled. When absent, internal `useState<ExpandedState>` manages state (uncontrolled). The TanStack `ExpandedState` type is used internally; `expandedRowKeys` is the public string[] API surface.

**Rationale**: String key array is the simplest public API. TanStack ExpandedState (`Record<string,boolean> | true`) is an internal detail.

---

## D4 — `@tomis/grid-core` and `@tomis/grid-license` as peerDependencies

**Context**: C-22 mandates these as peers, not devDeps. grid-core provides GridProps type; grid-license provides verifyLicense.

**Decision**: Both added to `peerDependencies` with `workspace:*`. grid-license also added to devDependencies for local resolution in monorepo development.

**Rationale**: Peers prevent duplicate instances in host apps; workspace:* ensures monorepo resolution.

---

## D5 — `verifyLicense` no-op stub in `@tomis/grid-license`

**Context**: MasterDetailGrid.tsx must call `verifyLicense('@tomis/grid-pro-master')` at module level (spec Section 12 / D7). `@tomis/grid-license` is currently a placeholder with no exports.

**Decision**: Add `export function verifyLicense(_packageName: string): void {}` to `grid-license/src/index.ts`. This is a no-op stub authorized by spec Section 12 risk note ("grid-license 미구현 — MOD-GRID-99-A 미완료").

**Rationale**: Minimum change to unblock compile. Real license enforcement is MOD-GRID-99-A scope.

---

## D6 — `src/internal/` directory for ExpandToggleCell

**Context**: ExpandToggleCell is an internal implementation detail not part of the public API.

**Decision**: Place ExpandToggleCell in `src/internal/ExpandToggleCell.tsx`. The `internal/` directory is NOT re-exported from `src/index.ts`.

**Rationale**: Keeps public API surface clean. Internal helpers can change without semver concerns.

---

## D7 — No-spread destructuring for `exactOptionalPropertyTypes`

**Context**: TypeScript `exactOptionalPropertyTypes: true` in tsconfig.base.json. Optional props like `getSubRows` cannot be passed via spread without type errors when the prop may be `undefined`.

**Decision**: Use the C-29 spread-skip pattern: `...(props.getSubRows !== undefined ? { getSubRows: props.getSubRows } : {})`. Applied to all optional TanStack table options passed from props.

**Rationale**: C-29 is the mandated pattern for this scenario.

---

## D8 — Storybook story skipped (out of scope per Section 7)

**Context**: Prompt mentions "Storybook story 1개 의무". Spec Section 7 Truth Table does not list any `.stories.tsx` file.

**Decision**: No Storybook story created for this Goal. C-30 (Truth Table Authority) and C-33 (Spec > Prompt) resolve the conflict in favor of Section 7. Drift recorded in `promptSpecDrift[]` in implement-score output.

**Rationale**: C-30 states Section 7 is the single authoritative list. C-33 states spec overrides prompt code blocks and instructions.

---

# MOD-GRID-16 / G-002 Architecture Decisions

**Goal**: Right-click Context Menu (`contextMenuItems` prop) for `@tomis/grid-pro-master`  
**Date**: 2026-05-15  
**Status**: Accepted

---

## D9 — Option B: `<ContextMenuGrid>` re-implements own `useReactTable` (MIT↔Pro boundary)

**Context**: Same boundary concern as D1. ContextMenu is a Pro feature; `Grid.tsx` in `grid-core` (MIT) must not be modified.

**Decision**: `ContextMenuGrid.tsx` is a standalone component in `@tomis/grid-pro-master` that calls its own `useReactTable`. It does NOT import `<Grid>` from `@tomis/grid-core` at runtime. This mirrors G-001 D1 exactly.

**Alternatives rejected**:
- Wrapping `<Grid {...rest}>` and placing `onContextMenu` on an outer div: Grid.tsx internally owns the TanStack table instance and does not expose `row`/`cell` objects to an outer `onContextMenu` handler. The outer div receives only a `MouseEvent` with no grid row/cell context — making `ContextMenuItem.onClick(row, cell, event)` impossible to implement correctly.
- Adding `onContextMenu` to GridProps in grid-core: MIT package contamination (C-24 / D3).

**Rationale**: The TanStack row/cell object requirement in `ContextMenuItem.onClick` forces the grid to own its own table instance. Option B is the only viable architecture that satisfies the spec signature and the MIT/Pro boundary.

---

## D10 — `contextMenuItems` in `ContextMenuGridProps` only (GridProps untouched)

**Context**: Spec D3 requires `contextMenuItems` to remain outside of `GridProps<TData>`. Confirmed by reading `grid-core/src/types.ts`: `GridProps<TData>` has no `onContextMenu`-related prop.

**Decision**: `contextMenuItems?: ContextMenuItem<TData>[]` is defined exclusively in `ContextMenuGridProps<TData>` which extends `GridProps<TData>`. No modifications to `grid-core`.

**Rationale**: D3 / C-24 / D9 (same boundary).

---

## D11 — `createPortal` into `document.body` for menu rendering (viewport overflow)

**Context**: Inline menu rendering risks being clipped by parent `overflow: hidden` containers (confirmed L0 issue — `RangeSelectGrid.tsx` did not use createPortal).

**Decision**: `ContextMenuPortal.tsx` renders the menu via `createPortal(menu, document.body)` with `position: fixed` and `z-index ≥ 50` (Tailwind `z-50`).

**Alternatives rejected**:
- Inline rendering inside the table wrapper: Vulnerable to overflow clipping.
- Rendering into a custom portal target: Adds unnecessary setup burden for consumers.

**Rationale**: `document.body` portal is the standard pattern for menus/tooltips/modals. `position: fixed` escapes all scroll containers.

---

## D12 — Keyboard shortcut via wrapper div `onKeyDown` only (no window listener)

**Context**: Prompt rule 11 specified "window-level listener with capture". Spec D5 explicitly states `window.addEventListener` 미사용; only wrapper div React `onKeyDown` with `tabIndex={0}`.

**Decision**: Shortcut key handling is done in the wrapper div's React `onKeyDown` handler. The div is given `tabIndex={0}` to become focusable. No global `window.addEventListener` is registered. Component unmount automatically removes the React event handler.

**Prompt-spec drift**: `promptValue = "window-level listener with capture"` → `specValue = "wrapper div React onKeyDown only"`. Spec applied (C-27/C-33).

**Rationale**: Div-scoped keydown is safer (avoids global key conflicts), simpler (no cleanup), and explicit in the spec (D5).

---

## D13 — Keyboard shortcut grammar: `"[Modifier+]Key"`, modifiers ∈ {Ctrl, Alt, Shift}

**Context**: AC-005 defines the shortcut grammar. `parseShortcut()` pure function in `ContextMenuGrid.tsx` implements the parse + warn pattern.

**Decision**: Shortcut strings are split on `+`. The last token is the key; earlier tokens are modifiers. Invalid modifiers or empty key parts log a `console.warn` (dev mode only) and return `null` (item treated as having no shortcut).

**Rationale**: Defensive grammar parsing prevents silent misbehavior on typos.

---

## D14 — `disabled` evaluated at render time in `ContextMenuPortal.tsx` (not at click time)

**Context**: Spec D7 specifies disabled function evaluation at menu render time, not click time. This means stale data risk if the row mutates while the menu is open — acceptable (menus are ephemeral UI).

**Decision**: In `ContextMenuPortal.tsx`, each item evaluates `typeof item.disabled === 'function' ? item.disabled(targetRow) : item.disabled ?? false` during render. The `<button disabled={isDisabled}>` prevents click events on disabled items at DOM level. Shortcut dispatch in `ContextMenuGrid.tsx` re-evaluates at keydown time for correctness (shortcut can fire without menu being open).

**Rationale**: D7 compliance. Re-evaluation at shortcut-dispatch is necessary because the menu may be closed when the key is pressed.

---

## D15 — `ContextMenuPortal` uses inline `clampPosition` (no separate `computeMenuPosition.ts` file)

**Context**: Spec D8/Section 5.8 states `computeMenuPosition.ts` is NOT in the Truth Table. Section 7 authorizes only 6 files. Spec allows inline position logic in `ContextMenuPortal.tsx`.

**Decision**: Viewport-edge position clamping is implemented as `clampPosition()` — a pure function declared inside `ContextMenuPortal.tsx`. No separate file created.

**Rationale**: C-30 (Truth Table Authority) — adding a 7th file not in the Truth Table is a violation.

---

## D16 — Storybook story deferred (AC-009 TBD, not in Truth Table)

**Context**: AC-009 requires Storybook story ≥1 (shortcut scenario). However, Spec Section 7 Truth Table does not list any `.stories.tsx` file for G-002.

**Decision**: No Storybook story created. C-30 (Truth Table Authority) takes precedence. AC-009 remains as a follow-up item. Score rubric marks AC-009 as N/A (not in Truth Table per C-30).

**Rationale**: C-30 / C-33 consistent with D8 pattern from G-001.

---

# MOD-GRID-16 / G-003 Architecture Decisions

**Goal**: Expanded Persistence (useExpandedPersistence) + Keyboard Accessibility (useRowKeyboardNav) + TreeGrid/ColumnPinGrid alias re-export  
**Date**: 2026-05-15  
**Status**: Accepted

---

## D17 (G-003) — useExpandedPersistence Option B: independent hook, NOT modifying useGridState

**Context**: AC-001 mentions "MOD-GRID-02 useGridState 협조". Two interpretations: (a) add `expanded` as 9th key to `useGridState` in grid-core, or (b) independent hook in grid-pro-master that composes externally with MasterDetailGrid props.

**Decision**: Option (b) — `useExpandedPersistence` is a standalone hook in `grid-pro-master/src/internal/`. Consumer composes by wiring its `[expanded, setExpanded]` return into `masterDetail.expandedRowKeys` + `onExpandChange`. `useGridState` in grid-core (MIT) is NOT modified.

**Alternatives rejected**:
- Option (a): Adds Pro feature (expanded persistence) into MIT package surface — C-24 MIT/Pro boundary violation. goals.json `implementFiles` also does not list `useGridState.ts` MODIFY, confirming (b).

**Rationale**: Pro feature belongs in Pro package. External composition is the correct pattern (D3 designation in spec).

---

## D18 (G-003) — TreeGrid/ColumnPinGrid: thin re-export from @tomis/grid-core (G-005 reuse)

**Context**: goals.json G-003 `implementFiles` listed `grid-pro-master/src/legacy/TreeGrid.tsx` etc. But G-005 (MOD-GRID-01) already implemented these in `grid-core/src/legacy/` with `useDeprecationWarn` called inside each component. `grid-core/src/index.ts` L26-34 already exports both.

**Decision**: Two lines added to `grid-pro-master/src/index.ts`:
```typescript
export { TreeGrid, type TreeGridProps } from '@tomis/grid-core';
export { ColumnPinGrid, type ColumnPinGridProps } from '@tomis/grid-core';
```
No new files created in `grid-pro-master/src/legacy/`. `@tomis/grid-core` is already a peerDependency. Deprecation warning is automatic via `useDeprecationWarn` inside the G-005 implementations.

**Alternatives rejected**:
- Creating new wrapper components in grid-pro-master that re-call `useDeprecationWarn`: Redundant — G-005 already handles this. Adding wrappers would double the warning.
- Prompt suggestion of a thin wrapper calling console.warn: Not needed; spec D4 + G-005 implementation confirm thin re-export is correct. Recorded as promptSpecDrift (AC-004).

**Rationale**: D4 (spec). C-30 Truth Table does not list new legacy wrapper files. Re-export is 0 KB bundle impact (tree-shakeable).

---

## D19 (G-003) — useRowKeyboardNav: C-32 pure helper + React shell, MasterRow sub-component extraction

**Context**: Spec Section 2.5 Example 2 shows `useRowKeyboardNav(row, !!renderDetailRow)` called inline in `rows.map()` inside MasterDetailGrid. This violates Rules of Hooks (hooks cannot be called inside `.map()` loops).

**Decision**: Extract a `MasterRow<TData>` inner sub-component inside `MasterDetailGrid.tsx`. `useRowKeyboardNav` is called at the top level of `MasterRow`, not inside a map. This mirrors the existing `DetailRow` pattern already in the file. The `shouldToggleExpand(key: string): boolean` pure helper is co-located in `useRowKeyboardNav.ts` (C-32 compliance). Recorded as `specCodeDefects[]` F-06 documented deviation.

**Alternatives rejected**:
- Direct hook call inside `rows.map()`: Rules of Hooks violation — React will throw in development mode.
- Separate file for `shouldToggleExpand`: Unnecessary; C-32 requires separation within same file when helper is small.

**Rationale**: Rules of Hooks is a hard constraint. Sub-component extraction is the idiomatic React fix. `MasterRow` is ~5 lines of JSX plus the hook call — not an overcomplication.

---

## D20 (G-003) — RowPinningOptions: types-only in this Goal, UI deferred

**Context**: AC-006 (F-16-06): "Row Pinning API 기반 타입 정의만, UI 구현 별도 Goal".

**Decision**: `RowPinningOptions` interface with `pinTop?: string[]` and `pinBottom?: string[]` added to `types.ts` and exported from `index.ts`. No TanStack `row.pin()` API wiring, no `RowPinningState` state management, no UI rendering. A separate follow-up Goal will implement the full UI.

**Rationale**: Spec D6 is explicit — types-only scope. Implementing UI here would exceed the Goal boundary.
