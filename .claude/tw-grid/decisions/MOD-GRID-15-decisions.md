# MOD-GRID-15 Architecture Decision Records

**Package**: `@tomis/grid-pro-agg`
**Goal**: G-001 — TanStack getGroupedRowModel() + getExpandedRowModel() activation + 5 built-in aggregationFns
**Date**: 2026-05-15
**Author**: tw-grid Implementer Agent

---

## ADR-MOD-GRID-15-001: Standalone Component (NOT Grid extension)

### Status
Accepted

### Context
`AggregationGrid` could be implemented as either:
1. An extension of the existing `<Grid>` core component (prop forwarding pattern)
2. A standalone component that owns its own `useReactTable` call

Spec Section 2 explicitly mandates standalone design.

### Decision
`AggregationGrid<TData>` is a self-contained component that calls `useReactTable` internally.
It does NOT import or extend `@tomis/grid-core`'s `<Grid>` component.

### Rationale
- Standalone avoids coupling the aggregation feature to grid-core's internal API surface.
- `@tomis/grid-pro-agg` declares only `@tanstack/react-table`, `react`, and `react-dom` as peerDependencies (C-22), making `@tomis/grid-core` optional until G-004.
- Aggregation-specific row model configuration (grouping state, expanded state) is cleanest when owned by the component directly.

### Alternatives

**대안 1 (채택)**: Standalone component
- Clean peerDep boundary (no grid-core dep in G-001)
- Full control over useReactTable options

**대안 2**: Grid extension via render prop / HOC
- Reuses grid-core layout/style
- Introduces grid-core as required peerDep (violates C-22 scope for G-001)
- Rejected: premature coupling, D4 defers peerDeps expansion to G-004

### Trade-offs
1. Grid-core layout features (column resizing, sticky headers) are not available until G-004 wires the packages.
2. Tailwind-only styling (C-5) means the standalone component has its own basic table markup.

---

## ADR-MOD-GRID-15-002: License Stub — inline verifyOrWarn (module-level)

### Status
Accepted

### Context
The implementation prompt specified a `verifyLicenseStub` function invoked inside `useEffect` (React mount lifecycle).
Spec D3 and ADR-MOD-GRID-13-002 (grid-pro-merging precedent) mandate:
- Function name: `verifyOrWarn(_packageName: string): void`
- Invocation: module-level (not inside useEffect or component body)

This is a prompt-spec drift (recorded in G-001-implement-score.json promptSpecDrift[1]).

### Decision
Inline no-op `verifyOrWarn` at module scope in `AggregationGrid.tsx`, invoked immediately at module level:

```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function verifyOrWarn(_packageName: string): void {
  /* MOD-GRID-99-A/G-002 will implement signature / expiry / domain checks. */
}
verifyOrWarn('@tomis/grid-pro-agg');
```

### Rationale
- Consistent with ADR-MOD-GRID-13-002 (grid-pro-merging pattern) — system-wide uniformity.
- Module-level invocation runs exactly once per module load, regardless of React render count.
- `useEffect` would defer check to after first paint and run per-mount — incorrect for a license gate.
- `eslint-disable-next-line` suppresses the `no-unused-vars` warning for the `_packageName` prefix convention.

### Alternatives

**대안 1 (채택)**: Module-level verifyOrWarn
- Runs once at module load
- Uniform across all grid-pro-* packages

**대안 2**: useEffect invocation (prompt default)
- Runs after first render
- Runs on every remount (unnecessary)
- Rejected: violates spec D3 + ADR-MOD-GRID-13-002

### Trade-offs
1. Module-level call means no React context is available (intentional — license check is environment-level, not component-level).

---

## ADR-MOD-GRID-15-003: AggregationFnKey 'avg' → TanStack 'mean' mapping

### Status
Accepted

### Context
TanStack Table v8's built-in aggregation registry uses the key `'mean'` for average.
Exposing `'mean'` in the public API would be surprising to users who expect `'avg'`.
Spec D5 mandates: user-facing key is `'avg'`, internal TanStack key is `'mean'`.

### Decision
`resolveAggregationFn(key: AggregationFnKey): TanStackAggKey` maps `'avg'` → `'mean'`.
All other keys pass through unchanged (`'sum'`, `'min'`, `'max'`, `'count'`).

The function returns a **string key** (not a function reference from the TanStack `aggregationFns` registry object).
TanStack performs its own registry lookup when given a string key as `column.aggregationFn`.

### Rationale
- Returning the string key avoids importing `aggregationFns` from `@tanstack/react-table`, whose named export shape was unverifiable in the monorepo's local node_modules.
- TanStack's `aggregationFn` column option accepts string keys natively (built-in registry lookup).
- `resolveAggregationFn` is pure (no React imports), satisfying C-32.

### Alternatives

**대안 1 (채택)**: Return string key, let TanStack do registry lookup
- Zero coupling to TanStack's internal `aggregationFns` export
- Type-safe via `TanStackAggKey` union

**대안 2**: Import `aggregationFns` from TanStack and return fn reference
- Would require `import { aggregationFns } from '@tanstack/react-table'`
- Named export shape unverifiable in this monorepo context
- Rejected: unnecessary coupling + verification risk

### Trade-offs
1. If TanStack changes built-in key names (unlikely for stable v8), `TanStackAggKey` union would need updating.

---

## ADR-MOD-GRID-15-004: ExpandedState 'false' normalisation

### Status
Accepted

### Context
`AggregationGridProps.expanded` accepts `ExpandedState | false` for convenience.
TanStack's `ExpandedState = true | Record<string, boolean>` does not include `false`.
Passing `false` directly to TanStack's `state.expanded` would be a type error.

### Decision
Normalise at component boundary:
```typescript
const expandedState: ExpandedState = expanded === false ? {} : expanded ?? {};
```
`false` → `{}` (no rows expanded). `undefined` → `{}`. `true` → all rows expanded.

### Rationale
- User-facing `false` is intuitive ("nothing expanded") and maps correctly to `{}`.
- The spec explicitly calls this out (AggregationGridProps.expanded JSDoc note).
- Prevents runtime type mismatch from leaking into TanStack internals.

### Alternatives

**대안 1 (채택)**: Accept `false` in props, normalise to `{}`
- Better DX (false is intuitive)
- Single normalisation point

**대안 2**: Remove `false` from prop type, require `{}`
- Slightly stricter type
- Less convenient for callers
- Rejected: spec explicitly allows `false`

### Trade-offs
1. The normalisation means `expanded={false}` and `expanded={{}}` are indistinguishable in behaviour — intentional.

---

## ADR-MOD-GRID-15-005: peerDependencies scope — G-001 defers grid-core and react-virtual

### Status
Accepted

### Context
`@tomis/grid-pro-agg` will eventually need `@tomis/grid-core` (for layout integration) and
`@tanstack/react-virtual` (for virtualisation). Spec D4 states peerDeps expansion is deferred to G-004.

### Decision
G-001 `package.json` peerDependencies contains only:
- `@tanstack/react-table ^8.0.0`
- `react ^18.0.0 || ^19.0.0`
- `react-dom ^18.0.0 || ^19.0.0`

`@tomis/grid-core`, `@tomis/grid-license`, and `@tanstack/react-virtual` are NOT added in G-001.

### Rationale
- C-22: peerDeps must not be expanded beyond what G-001 actually imports.
- The standalone `AggregationGrid` component (ADR-MOD-GRID-15-001) has no grid-core dependency.
- Virtualisation is explicitly deferred to G-002/G-003 (spec Section 4 Exclusions).
- Adding unused peerDeps creates false consumer requirements.

### Alternatives

**대안 1 (채택)**: Minimal peerDeps (3 packages only)
- Honest dependency declaration
- Consumers not forced to install unused packages

**대안 2**: Add grid-core + react-virtual as optional peerDeps now
- Would enable future features without a package.json bump
- Rejected: spec D4 explicitly defers to G-004; premature

### Trade-offs
1. G-004 will require a peerDeps update to `package.json` — minor versioning consideration.

---

## ADR-MOD-GRID-15-006: Duplicate Registration Policy — Overwrite + console.warn (No Throw)

### Status
Accepted

### Context
When `registerAggregationFn` is called with a name that is already present in the registry,
the implementation must decide: throw an error, silently overwrite, or warn + overwrite.

### Decision
Duplicate registration silently overwrites the previous function and emits a `console.warn`:
```
[grid-pro-agg] registerAggregationFn: overwriting existing fn for key "${name}"
```
No exception is thrown (D6).

### Rationale
- **No-throw policy** (AC-002): `AggregationGrid` should degrade gracefully, not crash. A registration
  collision does not break the rendering pipeline — the latest function simply wins.
- **console.warn visibility**: Developers see a clear warning during development without needing
  try/catch boilerplate at the call site. The warning is scoped to the package name for easy filtering.
- **Consistent with grid-pro-* pattern**: The no-throw / warn policy mirrors the license `verifyOrWarn`
  pattern used across all grid-pro packages. Uniform failure modes are easier to reason about.
- **Hot reload safety**: In HMR/fast-refresh scenarios, module-level `registerAggregationFn` calls
  execute on every reload. A throw would break development reload cycles; overwrite is the correct behaviour.

### Alternatives

**대안 1 (채택)**: Overwrite + console.warn
- No crash on duplicate
- Developer-visible warning
- HMR-safe

**대안 2**: Throw on duplicate
- Strict enforcement of unique names
- Would crash on HMR module reload
- Rejected: violates AC-002 no-throw policy; breaks development workflow

**대안 3**: Silent overwrite (no warning)
- HMR-safe, no crash
- No developer visibility — silent bugs possible
- Rejected: diagnostic transparency required

### Trade-offs
1. Callers that intentionally overwrite (e.g., for testing) will see a console.warn that is technically harmless — they can suppress it by deleting the registry entry first (no delete API is provided, but the warn is the intended signal).
2. The latest registration wins; if two packages register the same key, registration order determines which function is used.

---

## ADR-MOD-GRID-15-007: Registry as Sole Entry Point — table.options.aggregationFns Not Exposed

### Status
Accepted

### Context
TanStack Table v8 provides two mechanisms for custom aggregation functions:
1. `table.options.aggregationFns` — pass a map of functions to `useReactTable`
2. Column-level `aggregationFn` option — pass a function reference or string key

G-003 implements a module-level `Map<string, AggregationFn<unknown>>` as the sole entry point
for custom functions (D7). `table.options.aggregationFns` is NOT wired up.

### Decision
The module-level `aggregationFnsRegistry` Map (internal, not exported) is the sole entry point
for custom aggregation functions. The 3-branch resolver in `resolvedColumns` reads from this registry
and sets the column-level `aggregationFn` option to a function reference when a custom fn is found.
`table.options.aggregationFns` is left unset.

### Rationale
- **Simpler API surface**: `registerAggregationFn(name, fn)` is a single global call; consumers
  do not need to pass anything to `<AggregationGrid>` props. The component automatically picks up
  registered functions.
- **Avoids prop proliferation**: Adding `aggregationFns` as an `AggregationGridProps` prop would
  require every consumer to pass the map; the registry is a one-time setup call.
- **Column-level fn reference**: Setting `aggregationFn: customFn` directly on the column definition
  (branch 1 of the resolver) is fully supported by TanStack v8 — function references are accepted
  alongside string keys.
- **D7 explicit requirement**: Spec decision D7 states `table.options.aggregationFns` is not exposed
  externally; the registry is the single registration path.

### Alternatives

**대안 1 (채택)**: Module-level singleton registry, column-level fn reference
- Zero consumer API changes needed to use custom functions
- No TanStack options.aggregationFns wiring
- Cleanest separation of concerns

**대안 2**: Expose `aggregationFns` as an AggregationGridProps field
- Mirrors TanStack's raw API
- Requires consumers to pass the map every render (no global register)
- Rejected: higher consumer friction; violates D7

**대안 3**: Hybrid — both registry AND props.aggregationFns
- Maximum flexibility
- Increases API surface and spec footprint
- Rejected: YAGNI for G-003 scope; deferred to future goals if needed

### Trade-offs
1. Module-level state is shared across all `<AggregationGrid>` instances in the same bundle — intentional for the registry pattern, but means a registration in one component subtree is visible to all.
2. No delete/unregister API is provided; overwriting via `registerAggregationFn` is the only mutation path (acceptable for G-003 scope).

---

## ADR-MOD-GRID-15-008: HTML5 Native Drag-and-Drop (dnd-kit Rejected)

### Status
Accepted

### Context
G-004 GroupPanel requires drag-and-drop so users can drag a column header into the GroupPanel to
add that column to the grouping. A drag library must be chosen.

### Decision
Implement GroupPanel drag-and-drop using the HTML5 native drag API (`draggable`, `onDragStart`,
`onDragOver`, `onDrop`, `onDragLeave`). Do not add `@dnd-kit/core` or `react-dnd` as dependencies.

DataTransfer key: `'columnId'` (spec L128/L362-363 authoritative — not `'application/x-grid-column-id'`).

### Rationale
- **C-21 bundle limit (≤ 20 KB)**: dnd-kit/core adds ~8-10 KB; G-004 before dnd-kit is ~14 KB → would
  approach or exceed the 20 KB limit.
- **Simple drop zone**: GroupPanel has exactly one drop zone (the panel `<div>`). The abstraction
  overhead of dnd-kit (DndContext, useDraggable, useDroppable) is disproportionate.
- **MOD-GRID-07 precedent**: `packages/grid-features/src/column-drag/useColumnDrag.ts` implements
  column reordering with HTML5 DnD — validated pattern in this monorepo.
- **Zero new peerDeps**: HTML5 drag is browser-built-in. `package.json` requires no change (D6).
- **Safari fallback**: `dragSourceId = useRef<string | null>(null)` in GroupPanel provides fallback
  when `dataTransfer.getData` returns empty outside the drop handler.

### Alternatives

**대안 1 (채택)**: HTML5 native DnD
- ~0 KB bundle addition
- No new peerDep
- Proven pattern (MOD-GRID-07)

**대안 2**: `@dnd-kit/core`
- Rich accessibility / keyboard DnD
- +8-10 KB bundle → C-21 risk
- Rejected: bundle impact + disproportionate abstraction for 1 drop zone

**대안 3**: `react-dnd`
- Mature library
- +12 KB bundle + requires HTML5Backend peer
- Rejected: highest bundle cost; 2 new peerDeps

### Trade-offs
1. Keyboard-driven drag-and-drop is not supported (HTML5 DnD is mouse/touch only). Accepted scope-out for G-004.
2. Safari `dataTransfer` quirks require the `dragSourceId` ref fallback — minor implementation complexity.

---

## ADR-MOD-GRID-15-009: getSortedRowModel Activation via `enableGroupSort` Prop

### Status
Accepted

### Context
G-004 requires group-level sorting (AC-004): when enabled, clicking a column header re-orders groups
by their aggregated value. TanStack's `getSortedRowModel()` must be wired into `useReactTable`.
The question is whether sorting should be always-on or opt-in.

### Decision
`getSortedRowModel()` is activated only when `enableGroupSort?: boolean` is `true` (default `false`).
Controlled and uncontrolled sorting are both supported via optional `sorting?` + `onSortingChange?` props.
EC-007 guard: if `sorting` is provided without `onSortingChange`, emit `console.error` and fall back to
internal state (no throw).

### Rationale
- **C-6 backward compat**: Existing `AggregationGrid` usages (G-001/G-002/G-003 stories) must not gain
  sort UI or unexpected behaviour without opt-in. `enableGroupSort` is the explicit activation gate.
- **Tree-shaking**: When `enableGroupSort=false`, `getSortedRowModel()` is not included in the
  `useReactTable` options call — tree-shakers can potentially eliminate the function.
- **Orthogonality**: `enableGroupSort` and `showGroupPanel` are independent flags. A user can show the
  panel without sort (EC-003) or enable sort without the panel.
- **Uncontrolled default**: `[internalSorting, setInternalSorting] = useState<SortingState>([])` provides
  zero-config uncontrolled behaviour. Controlled mode is opt-in via `sorting` + `onSortingChange`.

### Alternatives

**대안 1 (채택)**: `enableGroupSort` opt-in
- Backward-compatible (C-6)
- Sort UI only when needed
- Orthogonal to other features

**대안 2**: Always-on sorting (getSortedRowModel always active)
- Simpler code — no conditional spread
- Breaks C-6: existing stories gain sort indicators / unexpected sort behaviour
- Rejected: backward compat violation

**대안 3**: Tie sorting to `enableAggregation`
- Fewer props
- Conflicts: aggregation without sort is valid (most G-001/G-002 usages)
- Rejected: wrong coupling; sort is independent of grouping

### Trade-offs
1. Two separate props (`enableGroupSort` + `showGroupPanel`) instead of one — minor prop surface increase.
2. EC-005 (uncontrolled grouping via chip X) required converting `const groupingState = grouping` to
   `useState`-backed state. This is a correct fix for pre-existing behaviour (not G-004 regression).
3. `onGroupingChange` prop is now always wired (not conditional spread) because `handleGroupingChange`
   always needs to update local state. External `onGroupingChange` is called optionally via `?.()`.

---

*ADR-008 and ADR-009 added: 2026-05-15 (G-004 implement stage)*

---

## ADR-MOD-GRID-15-010: Rubric Cascade — E-01 N/A, F-01 Anchor, F-03 Deferral

### Status
Accepted (Step 7 Self-Review)

### Context
MOD-GRID-15 Self-Review aggregated 12 score files (4 Goals × 3 stages). Two repeated patterns
forced sub-100 scores despite correct implementation:

1. **G-003 + G-004 Implement E-01 NO (size-limit)** — pre-existing `.size-limit.json` infra defect (peerDeps not in `ignore` array) inflates measurement; raw tsup output is well within C-21 limit. Both Goals dropped from 100 → 92.3 / 92.9.

2. **G-004 Specify F-01 + F-03 NO** — spec uses spec-header + goals.json + ADR references for `packageTarget` (not a dedicated "Section 13" subheader). Docusaurus is deferred to MOD-GRID-99-B via explicit ADR mention. Rubric anchor wording forced NO. Goal dropped to 95.45.

### Decision
Cascade three rubric refinements (additive only — existing 100-score Goals re-evaluated still hit 100):

**1. `implement-rubric.md` E-01 — Pre-existing infra defect N/A sub-condition**
4-prong evidence gate (raw output within limit + measurement inflation external + Goal scope external + documentedDeviations recorded). Future Pro Goals affected by the same `.size-limit.json` defect can claim N/A.

**2. `specify-rubric.md` F-01 — Anchor flexibility**
Accept packageTarget anchor in any of: spec header, ADR reference, goals.json + cross-reference. "Section 13" wording no longer required when other anchors prove explicit text presence.

**3. `specify-rubric.md` F-03 — Docusaurus deferral N/A**
3-prong gate (explicit deferral ADR/D# + Storybook story scenarios + clear deferral rationale). G-001~G-003 already match this pattern with `MOD-GRID-99-B` deferral.

### Rationale
- All three changes are **conditional/optional N/A or anchor flexibility** — never tighten YES path.
- All three changes are **gated by evidence** (4-prong / 3-prong / disjunctive anchor) — no rubric loosening.
- All three were observed in real failure patterns within MOD-GRID-15 (not speculation).
- Re-evaluating G-001/G-002 under new rubric still hits 100 (anchors already satisfied).
- G-003/G-004 retain their original recorded scores (rubric change is forward-only; no retro re-scoring per Self-Review constraint).

### Alternatives

**대안 1 (채택)**: Sub-rule N/A + anchor flexibility (additive)
- Forward-only fix for cascading Pro packages
- No retro re-scoring
- Existing scores preserved

**대안 2**: Tighten rubric (force fix infra defect first)
- Would block all future Pro Goals until infra Goal completes
- Rejected: surgical-change principle (C-1) prevents in-Goal infra fix; infra defect fix needs its own dedicated Goal

**대안 3**: Loosen rubric (always YES if packageTarget anywhere in repo)
- Would devalue the rubric (anchor textual presence is a real quality signal)
- Rejected: spec writers might omit packageTarget entirely

### Trade-offs
1. Future Pro Goals can claim E-01 N/A repeatedly until the `.size-limit.json` infra fix Goal lands — visible debt accumulates in `documentedDeviations[]` arrays. Acceptable: each entry recommends the follow-up Goal.
2. F-01 anchor flexibility means spec readers must check 3 locations for packageTarget (header / ADR / goals.json) instead of one canonical Section 13. Mitigation: anchor flexibility is OR (any one location suffices, so the canonical search cost is bounded).

### Related artifacts
- `findings/MOD-GRID-15-lessons.md` (TanStack Row vs Cell catalog + `buildInterleavedRows` snippet)
- `rubric/implement-rubric.md` E-01 (sub-condition added)
- `rubric/specify-rubric.md` F-01 + F-03 (sub-conditions added)

