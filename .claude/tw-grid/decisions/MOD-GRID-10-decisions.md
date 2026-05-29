# MOD-GRID-10 — Architecture Decision Records

Module: `@tomis/grid-pro-tracking` (ChangeTracking + Mapping + Validator, Pro, gzipped ≤ 20 KB)
Authored: 2026-05-14

---

## ADR-MOD-GRID-10-001 — `useChangeTracking` hook signature (D1)

**Status**: Accepted (2026-05-14, G-001 implement)

### Context

MOD-GRID-10 replaces the Wijmo `CollectionView` change-tracking pattern that informally inspires the existing `tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` component (Section 1 L0, L1-238). The existing component exposes its API through `useImperativeHandle<ChangeTrackingHandle>` and consumes row positions by `visibleIndex`. The new Pro package needs a public API surface that survives sorting, filtering, virtualization, and TanStack v8 row models.

### Decision

Public surface is a **single hook** `useChangeTracking<TData>(config: ChangeTrackingConfig<TData>): ChangeTrackingAPI<TData>` that returns a plain object with reactive arrays (`added/edited/deleted/rows`) and imperative methods (`addRow/updateRow/deleteRow/undoRow/hasChanges/getChangeSet/resetChanges/commitChanges`). `rowKey` is `keyof TData | ((row: TData) => string)` — the function form matches TanStack `getRowId`.

### Alternatives Considered

1. **Zustand-based external store** — Rejected: introduces a new runtime dependency (~3 KB gzipped) and forces consumers to learn another state idiom. Trade-off: gain devtools + persist middleware, lose zero-runtime promise (C-21) and the "drop-in hook" UX the spec Section 2.3 examples illustrate.
2. **Wrapper class around a synthetic CollectionView** — Rejected: re-implements OOP state inside React, fights React 18 concurrent rendering, and revives the Wijmo mental model the package explicitly displaces (C-16). Trade-off: closer 1:1 mapping to the Wijmo reference (R-W in Section 1), at the cost of doubled allocations per render and no path to TanStack `getRowId` integration.

### Trade-offs

- Reactive arrays mean every change re-renders the consumer; for very large change sets (10k+ rows) `useChangeTracking` consumers should memoize derived selectors. This is acceptable given C-21 (≤ 20 KB Pro budget) and matches how TanStack itself ships.
- The hook owns no DOM and intentionally does not call `useReactTable` — consumers compose the two side-by-side (`<Grid data={tracking.rows} columns={columns} />`). This keeps grid-core (MIT, MOD-GRID-01) and grid-pro-tracking (Pro, MOD-GRID-10) tier-isolated per the canonical licensing matrix.

### Consequences

- Spec Section 2.3 examples remain idiomatic React (no provider, no ref).
- `ChangeTrackingGrid` and `PayrollEditablePage` migration moves to G-005 with a 1-minor `ChangeTrackingGrid` alias per C-6 / C-23.
- G-002 ~ G-005 implement the body of every stub method; the signature locked here is the contract those Goals must honour.

### References

- Spec: `artifacts/MOD-GRID-10/tracking/G-001-spec.md` Sections 2.1, 11.2 (Before/After), 11.3 (Step 1-3).
- Constraints: C-2 (TanStack v8 standard), C-4 (no `any`), C-15 (agent delegation).

---

## ADR-MOD-GRID-10-002 — `Mapping<TData>` / `Validator<TData>` API shape (D2)

**Status**: Accepted (2026-05-14, G-001 implement)

### Context

Wijmo's publish wrapper (R-W in spec Section 1, `publish-wijmo-analysis.md` §5 L172-184) exposes `mapping` and `validator` as plain object/function pairs supplied at construction. The same convention is needed in MOD-GRID-10 so existing publish-side payload transformations migrate without re-modeling. Two ecosystem-standard alternatives are also available: Zod schemas and class-based validator hierarchies.

### Decision

- `Mapping<TData>` = `Record<string, string | ((row: TData) => unknown)>` — string entries forward the source field by name; function entries derive a value at commit time (e.g. timestamps, lookups).
- `Validator<TData>` = `(row: TData) => { valid: boolean; errors?: string[] }` — a single-row, single-call shape that produces a structured error list ready to feed `ChangeSet.errors[]`.

Both are **optional** in `ChangeTrackingConfig<TData>` so the basic usage path (Section 2.3 example 1) needs zero configuration.

### Alternatives Considered

1. **Zod schema integration** (`validator: z.ZodSchema<TData>`) — Rejected: adds Zod as a peer (~10 KB gzipped just for the runtime, ~30 KB with `zod/v3`) which alone eats most of the C-21 20 KB Pro budget. Trade-off: gain composable schema authoring + great TypeScript inference, lose zero-runtime guarantee and force consumers into a specific validation library.
2. **Class-based validator hierarchy** (`abstract class Validator<TData>` + subclasses) — Rejected: incompatible with the "single hook, plain object" idiom from ADR-001 and creates an inheritance chain for what is structurally one function. Trade-off: shareable validator instances with state, at the cost of mandating OOP inside hook configs.

### Trade-offs

- Function-form mapping entries open the door to arbitrary side effects; the spec Section 2.3 example uses pure transforms and the docs (deferred to MOD-GRID-99-B) will state that mapping functions must be pure.
- The validator returns only `valid`/`errors[]` — no async validation. Async cases are punted to consumer-side pre-flight checks before calling `commitChanges`. ADR open for revisit if Group 4 page surveys show async validators are common.

### Consequences

- G-003 implements `getChangeSet` honouring `mapping` and `validator`; G-005 propagates `errors[]` into the commit error path.
- `EditableGrid` (MOD-GRID-05/G-003) already accepts free-form `Partial<TData>` updates, so mapping bridges screen-shape → BE-shape without altering the editing UX.

### References

- Spec: `artifacts/MOD-GRID-10/tracking/G-001-spec.md` Sections 2.1 (types), 2.3 (example 2), 6 (EC-02 originalSnapshot once).
- References: `references/publish-wijmo-analysis.md` §5 L172-184 (concept only; no code reuse per C-16).
- Constraints: C-4 (no `any`), C-9 / C-20 (no new third-party deps in this Goal), C-21 (bundle budget).

---

## ADR-MOD-GRID-10-003 — MOD-GRID-99-A `grid-license` dependency stub strategy (D3)

**Status**: Accepted (2026-05-14, G-001 implement)

### Context

C-24 mandates that every Pro package call into `@tomis/grid-license` at import time. The license package, however, is still a placeholder (`grid-license/src/index.ts` is literally `export {};`, confirmed by Read in spec H-01). Goal G-001 cannot wait for MOD-GRID-99-A/G-002 — its `dependsOn` is `MOD-GRID-99-A/G-001` (placeholder phase only), and the canonical schedule slots MOD-GRID-10 before the license runtime ships.

### Decision

Define a **fallback inline `verifyOrWarn(packageName: string)` no-op directly inside `grid-pro-tracking/src/index.ts`** and invoke it once on import with the package name. Add a TODO comment block explicitly marking the fallback and the migration target (`import { verifyOrWarn } from '@tomis/grid-license'`). Do **not** add `@tomis/grid-license` to `peerDependencies` in this Goal — that wiring is reserved for G-005 per spec D6.

### Alternatives Considered

1. **Add a no-op `verifyOrWarn` export to `@tomis/grid-license` and import it now** — Rejected: violates spec D6 (no new peers in G-001) and pulls G-005's peerDependency change forward. Trade-off: a cleaner single source of the stub, at the cost of touching an unrelated package and inflating G-001's scope beyond the spec Section 7 authoritative file table (which would trigger C-30).
2. **Block `grid-pro-tracking` import until `grid-license` ships** — Rejected: blocks G-002 ~ G-005 entirely (they all import the package), inverting the schedule. Trade-off: stronger licensing guarantee, at the cost of stalling four downstream Goals and the canonical roadmap.
3. **Create a separate `grid-license-stub` workspace package** — Rejected: introduces a throwaway package, plus another peerDependency to track. Trade-off: cleaner symbol isolation, but the fallback inline stub is only seven lines and exists for one Goal's worth of lifetime.

### Trade-offs

- Inline fallback duplicates a name (`verifyOrWarn`) that will reappear once `@tomis/grid-license` ships. The TODO comment in `src/index.ts` plus the matching note in `EULA.md` make the duplication visible and grep-able.
- Until MOD-GRID-99-A/G-002 ships, C-24's "Pro packages call into grid-license" wording is satisfied **structurally** (the call exists) but not **functionally** (it's a no-op). Spec Section 13 F-02 documents the same nuance; AC-005 scope is explicitly split between structural (G-001) and functional (MOD-GRID-99-A/G-002).

### Consequences

- C-31 (functional wiring audit) is satisfied: `verifyOrWarn` is defined AND invoked in the same file.
- When MOD-GRID-99-A/G-002 lands, the migration is one block edit in `src/index.ts` (replace inline definition with import) plus one `peerDependencies` addition — captured as a future Goal acceptance criterion.
- `EULA.md` cross-references the stub status so license auditors see the planned migration rather than a stalled no-op.

### References

- Spec: `artifacts/MOD-GRID-10/tracking/G-001-spec.md` Sections 4 (compat policy), 9 (dependencies), 13 (F-02 plan), 11.4 (risk-2).
- Constraints: C-24 (license disclosure), C-30 (spec truth table discipline), C-31 (functional wiring audit).
- Future trigger: MOD-GRID-99-A/G-002 implement — replace inline stub with `import { verifyOrWarn } from '@tomis/grid-license'`.

---

## ADR-MOD-GRID-10-004 — rowKey collision policy + automatic key generation (D4 + D5)

**Status**: Accepted (2026-05-14, G-002 implement)

### Context

`useChangeTracking` exposes `rowKey: keyof TData | ((row: TData) => string)` as a required config field (G-001 ADR-001). G-002 fills in the hook body and, in doing so, must answer two questions the G-001 stub deferred:

1. **Collision** — what happens when two rows in `config.data` produce the same key, or when `addRow(seed)` re-uses an already-tracked key?
2. **Missing key on `addRow(seed)`** — what happens when the caller's `seed: Partial<TData>` does not contain the field named by `rowKey`?

The spec Section 6 edge cases (EC-05, EC-06) sketch the desired behavior; this ADR locks it in.

### Decision

- **Collision** → `console.warn('[grid-pro-tracking] duplicate rowKey: <key>')` and `last-wins`. The same warn fires for `createChangeMap` collisions (initial data) and `applyAdd` collisions (caller-supplied or auto-generated key already present in `statusMap` / `currentMap`).
- **Missing key on `addRow(seed)`** → fall back to `globalThis.crypto.randomUUID()`. The hook resolves the assigned key caller-side and returns it synchronously from `addRow(seed): string` so the caller can immediately reference the new row.
- **Functional `rowKey`** → the hook calls `rowKey(seed as TData)` inside a `try/catch`. If the call throws or returns a non-string (empty string included), the UUID fallback applies.

### Alternatives Considered

1. **Throw on collision** — Rejected. A duplicate key inside `config.data` is almost always a data-source bug, but throwing during render would crash the entire page and remove the user's ability to fix it through the UI. The warn-and-continue path preserves the productive editing session and surfaces the bug in DevTools.
2. **Auto-key via `Date.now() + counter`** — Rejected. Defeats deterministic testing (every run produces a different key), and introduces a hidden monotonic counter shared across hook instances. `crypto.randomUUID()` is a single, side-effect-free call available everywhere we target.
3. **Refuse to add a row without a key** — Rejected. The Wijmo reference (`itemsAdded` in CollectionView) accepts blank rows and asks the consumer to fill in fields later; mirroring that ergonomic is the whole point of `addRow(seed: Partial<TData>)`.

### Trade-offs

- `console.warn` is prod noise; the alternative (silent overwrite) would mask data bugs entirely. The warn is one-time per collision instance and addressable by fixing the upstream key.
- `crypto.randomUUID()` requires Node ≥ 19 or a modern browser. Monorepo `package.json` `engines.node = ">=18.0.0"`, and on Node 18 `crypto.randomUUID` exists on the `crypto` module but not on `globalThis.crypto` until 18.17. We target `globalThis.crypto.randomUUID()` because all currently-supported deployment targets (Node 22 dev, modern browser runtimes) provide it. If a Node ≤ 18.16 deployment surfaces, a separate ADR will switch to `import { randomUUID } from 'node:crypto'`.
- The functional `rowKey` `try/catch` swallows extractor errors silently. Documentation will note that consumers should validate their extractor; an explicit error surface (e.g. `onKeyResolveError` callback) is intentionally deferred until a real consumer needs it.

### Consequences

- G-003 (mapping + validator) can rely on every tracked row having a stable, well-defined key for the entire lifetime of the hook.
- G-004 (`undoRow`) does not need a separate "lost key" recovery path; collisions are already de-duplicated by the time `undoRow` runs.
- Test fixtures for G-002 inject deterministic UUIDs through dependency injection only when needed; production code uses `globalThis.crypto.randomUUID()` directly.

### References

- Spec: `artifacts/MOD-GRID-10/tracking/G-002-spec.md` Sections 2.3 (example 1), 6 (EC-05, EC-06), 11.2 (After template), 11.4 risk-4.
- Constraints: C-4 (no `any`), C-31 (functional wiring audit).
- Cascade: G-001 spec Section 6 EC-03 (spec-level acceptance) → G-002 ADR-level lock-in.

---

## ADR-MOD-GRID-10-005 — `config.data` reference change rebuilds the snapshot (D6)

**Status**: Accepted (2026-05-14, G-002 implement)

### Context

`useChangeTracking` captures a `structuredClone`-equivalent snapshot of `config.data` at mount so `resetChanges()` can restore the initial state (G-001 ADR-001 + AC-004). React, however, does not stop callers from passing a different `data` array reference between renders — for example, when the parent page navigates between datasets without unmounting the hook, or when a parent `useQuery` finishes loading and replaces the placeholder array.

G-001 deferred this question to G-002 (spec EC-04). The two natural answers are:

1. **Preserve tracked changes + manual reset** — the hook ignores `config.data` reference changes; the consumer must call `resetChanges()` deliberately.
2. **Automatic rebuild** — the hook discards tracked changes when `config.data` changes reference and rebuilds the snapshot from scratch.

### Decision

Automatic rebuild. The hook holds a `useRef` that tracks the most-recent `config.data` reference; a `useEffect([config.data])` compares the ref and, on reference change, dispatches a `REBUILD` action that runs `createChangeMap` against the new data. When tracked changes exist at the moment of rebuild, the reducer emits `console.warn('[grid-pro-tracking] data prop changed — pending changes discarded')` so the dropped work is visible in DevTools.

### Alternatives Considered

1. **Manual-only reset** — Rejected. The Wijmo reference (`CollectionView.sourceCollection` setter) replaces internal state on assignment without ceremony; matching that ergonomic keeps consumer code simpler. Asking every consumer to plumb a `resetChanges()` call into their data-fetching layer is a footgun and a maintenance burden. Trade-off: explicit-only would prevent accidental loss of in-flight edits, at the cost of a much rougher integration path with React Query / SWR / loader-driven pages.
2. **Deep-merge new data into existing tracking state** — Rejected. The semantics of "merge" are ambiguous (do newly-arriving rows count as `'added'`? do rows that disappear count as `'deleted'`?), and a wrong answer here would invent server-side edits the user never made. Trade-off: would let a page swap to a refreshed dataset without dropping the user's local edits, at the cost of inventing change events the user never authored.

### Trade-offs

- A consumer that intentionally creates a new array each render (e.g. `useChangeTracking({ data: rows.filter(...) , rowKey })`) will see every tracked change wiped on every render. Documentation (G-005 era) will call this out; the `useMemo` pattern is the canonical workaround.
- The `console.warn` only fires when `statusMap.size > 0`. Quiet rebuilds (no tracked changes) produce no console noise.

### Consequences

- The reducer's `REBUILD` action centralizes the warn so there is a single place to adjust the noise policy if production telemetry shows it firing too often.
- G-003 / G-004 / G-005 inherit the rebuild semantics — `mapping`, `validator`, and `commitChanges` all see the rebuilt snapshot the moment the consumer passes a new `data` reference.
- A future "preserve edits across `data` swaps" feature, if requested, can be additive (an `onDataChange?: 'reset' | 'preserve' | 'merge'` option) without breaking existing call sites.

### References

- Spec: `artifacts/MOD-GRID-10/tracking/G-002-spec.md` Sections 4 (재구축 정책), 6 (EC-04), 11.2 (After template), 11.4 risk-3.
- Constraints: C-4 (no `any`), C-31 (functional wiring audit).
- Cascade: G-001 spec Section 6 EC-04 (spec-level acceptance) → G-002 ADR-level lock-in.

---

## ADR-MOD-GRID-10-006: Mapping/Validator runtime semantics

- **Status**: Accepted (2026-05-15)
- **Context**: Mapping 의 방향(BE→원본 vs 원본→BE), 함수 throw 처리, validator 미반환 errors[] 해석.
- **Decision**:
  1. Mapping: `mapping[BE_field] = string(원본 TData 필드명) | function(row → 값)` (Wijmo 개념 차용, 코드 차용 X — C-16).
  2. mapping 미제공 → row 의 얕은 spread (pass-through).
  3. mapping 함수 throw → `buildChangeSet`의 per-row try/catch가 잡아 `errors[]`에 `{ index, message: '(mapping threw: <error>)', type }` 추가 후 해당 행은 added/updated에서 제외 (G-003 D4 + buildChangeSet.ts L34-38). **cosmetic drift 정정 2026-05-15 G-005 — 이전 표현 "필드값 = null (silent fallback)"은 G-003 D4 결정과 모순 → G-003 D4 권위 채택**.
  4. validator throw → errors[] 에 throw 메시지 추가.
  5. validator valid:false + errors[] 비어있음 → generic 'Validation failed'.
  6. deleted 행 mapping 미적용 (raw spread) — BE 는 식별자만 필요.
  7. edited 의 __original 은 payload 에서 제외 (rest 추출 후 mapping).
- **Alternatives**:
  1. Zod schema 통합 — Rejected: 외부 dep + peerDeps 증가 + 학습 곡선. Trade-off: Zod 의 풍부한 type inference vs zero-dep 단순성.
  2. Mapping 방향 반대 (원본→BE) — Rejected: publish utils.ts + Wijmo 컨벤션과 불일치. Trade-off: directional consistency vs convention preservation.
  3. mapping 함수 throw 를 silent null fallback — Rejected (G-003 D4 권위 채택, ADR-008-01 cross-ref): silent failure는 사용자가 mapping 결함을 검출 불가 → errors[]에 명시 surfacing이 우월.
- **Consequences**:
  - 사용자가 mapping 함수의 안전성을 보장해야 함. README/Storybook 예시 필요 (G-005 또는 99-B).
  - useChangeTracking 의 commitChanges (G-005) 도 동일 시멘틱 사용 — payload 일관성.
- **References**: spec G-003 Section 2 + 6 edge cases, ADR-001 hook signature.

---

## ADR-MOD-GRID-10-007 — rowStatusStyle API + applyUndo semantics + editedCells G-005 defer (D7, D8, D9)

**Status**: Accepted (2026-05-15, G-004 implement)

### Context

G-004 introduces three design decisions deferred from earlier Goals:

1. **D7 — rowStatusStyle API shape**: Tailwind row-highlight classNames need a public surface so consumers can override per-status colors without writing their own lookup. The question is where these defaults live and how overrides compose.
2. **D8 — applyUndo 'deleted' branch memory leak**: Spec Section 2.2 EC-03 prose says the 'deleted' undo branch only calls `statusMap.delete(key)`. But D5, EC-06, the branch table, and Section 11.2 snippet all additionally call `originalMap.delete(key)`. The contradiction must be resolved.
3. **D9 — editedCells structural/functional split**: `editedCells?: boolean` config and `editedCellsMap: ReadonlyMap<string, boolean>` API surface are typed in G-004, but the runtime wiring (reducer bookkeeping) is deferred to G-005 to keep G-004 focused and within the spec's Step 1-6 scope.

### Decision

**D7 — rowStatusStyle API**:
- Export `defaultRowStatusClassNames: RowStatusClassNames` (canonical AC-002 Tailwind values) and `getRowStatusClassName(status: RowStatus, classNames?: Partial<RowStatusClassNames>): string` from a **pure helper file** `src/internal/rowStatusStyle.ts` (zero React imports, C-32).
- `getRowStatusClassName` merges overrides using the C-29 `exactOptionalPropertyTypes`-safe spread: `classNames ? { ...defaults, ...classNames } : defaults`.
- Both are re-exported through `src/index.ts` so consumers can import from the package root.
- `RowStatusClassNames` interface lives in `src/types.ts` (already part of the `export *` barrel), avoiding a cross-file circular reference.

**D8 — applyUndo 'deleted' branch**:
- Follow D5/EC-06/branch table/Section 11.2 (four authoritative sources) over EC-03 prose (one source, likely an editorial omission).
- The 'deleted' undo branch calls **both** `statusMap.delete(key)` and `originalMap.delete(key)`. This prevents a memory leak where the originalMap retains a stale clone of a row the user de-deleted.
- Deviation documented as F-06 `specCodeDefects` in `G-004-spec.md`.

**D9 — editedCells structural/functional split**:
- G-004 delivers: `editedCells?: boolean` in `ChangeTrackingConfig<TData>` (types.ts) + `editedCellsMap: ReadonlyMap<string, boolean>` in `ChangeTrackingAPI<TData>` (types.ts) + `editedCellsMap` stub in the hook returning `new Map<string, boolean>()` always.
- G-005 delivers: reducer bookkeeping that populates the map when `config.editedCells === true`.
- Rationale: G-004's Step scope is 6 files and the typed surface alone completes the AC deliverables for this Goal without introducing unreviewed reducer branches.

### Alternatives Considered

1. **D7 — inline className logic inside the hook** — Rejected: consumers with custom grid renderers (not using the hook's `rows` array directly) still need the className helper. A standalone helper is more composable and tree-shakeable.
2. **D7 — CSS Modules or CSS-in-JS** — Rejected: C-19 (no CSS files), and Tailwind class strings are already the project-wide convention.
3. **D8 — follow EC-03 prose, skip originalMap.delete** — Rejected: four authoritative sources outweigh one prose note. The leak is real: a row that was 'edited' then 'deleted' then undo-deleted would retain a stale `originalMap` entry indefinitely, causing incorrect `ChangeTrackingAPI.edited[]` counts after a subsequent edit.
4. **D9 — implement full editedCells wiring in G-004** — Rejected: G-005 is the commit/optimistic Goal that already modifies the reducer; bundling cell-level bookkeeping there keeps related reducer changes in one Goal and reduces cross-Goal merge risk.

### Trade-offs

- D7: `getRowStatusClassName` returns a string; if a status has no matching key (which is impossible given `RowStatus` is a literal union), TypeScript would catch it at compile time. No runtime guard needed.
- D8: `originalMap.delete` in the 'deleted' branch is a no-op for rows that were never 'edited' before being 'deleted' — safe to call unconditionally.
- D9: The `editedCellsMap` stub always returns a stable empty Map (from `useMemo([], [])`), so downstream consumers that check `editedCellsMap.size` will see `0` until G-005 ships. This is documented in the JSDoc comment on the field.

### Consequences

- `getRowStatusClassName` and `defaultRowStatusClassNames` are part of the public package surface from G-004 onward; renaming them is a breaking change.
- G-005 must populate `editedCellsMap` without breaking the stable-reference contract (`useMemo` replacement must use the state map as a dependency).
- F-06 specCodeDefects for the EC-03 vs D5/EC-06 contradiction is recorded in `G-004-spec.md` and this ADR; no further action needed unless the spec is revised.

### References

- Spec: `artifacts/MOD-GRID-10/tracking/G-004-spec.md` Sections 2.1, 2.2, 2.3, 7, 11.2 (applyUndo snippet), 11.3 (Steps 1-6).
- Constraints: C-4 (no `any`), C-19 (no CSS files), C-29 (exactOptionalPropertyTypes), C-31 (functional wiring audit), C-32 (pure helper / React shell separation), C-33 (spec authority).
- F-06: EC-03 prose omits `originalMap.delete(key)` in 'deleted' branch — D5/EC-06/branch table/Section 11.2 are authoritative.

---

## ADR-MOD-GRID-10-008 — commitChanges runtime + legacy alias + peerDeps + editedCells wiring (D4, D5, D9, D3, D7, D8, D6)

**Status**: Accepted (2026-05-15, G-005 implement)

### Context

G-005 closes MOD-GRID-10 by replacing four placeholder surfaces with real runtime behavior + introducing the legacy `ChangeTrackingGrid` alias for tw-framework-front migration. The four areas:

1. **`commitChanges` runtime + rollback semantics (D4 + D5)** — G-001 stubbed `Promise.reject`. G-005 wires `fetch`/custom fetcher + 3-branch result handling.
2. **`@tomis/grid-core` peerDependency (D9)** — the new legacy alias `<ChangeTrackingGrid>` imports `<Grid>` from grid-core, so grid-core must be declared as a peer.
3. **Legacy alias signature + migration order (D3 + D7 + D8)** — three usage sites in tw-framework-front (`ChangeTrackingGrid.tsx` compat shim, `EditableGrid.tsx` additive prop, `PayrollEditablePage.tsx` additive commitChanges path). Two parallel alias shapes (monorepo `src/legacy/ChangeTrackingGrid.tsx` with the NEW `{ data, rowKey, mapping?, validator?, optimistic?, editedCells?, onSave?, ...GridProps }` shape; tw-framework-front body keeps the OLD `{ initialData, columns, ... }` shape).
4. **editedCells runtime wiring (D6, closes ADR-007 D9 cascade)** — G-004 typed `editedCellsMap` on the API surface but always returned an empty Map. G-005 threads `config.editedCells === true` through the UPDATE action and lets the reducer populate / purge a real `Map<string, boolean>`.

### Decision

**ADR-008-01 — commitChanges flow + rollback semantics (D4 + D5)**:
- `commitChanges(endpoint, options?)` is a 4-step async flow: (1) `getChangeSet()` → payload; (2) `fetcher(endpoint, { method, body, headers: 'application/json' })`; (3) success branch — `if (autoReset ?? true) dispatch RESET`, return result; (4) failure branch — `if (optimistic ?? config.optimistic) dispatch RESET` (rollback), re-throw in **both** optimistic and non-optimistic modes.
- Default fetcher = `globalThis.fetch` with built-in `!res.ok` → throw + `res.json()` on success.
- Rollback is **dispatch RESET** (full discard of tracked changes) — no separate `rollback()` public API, no per-batch preCommit snapshot. Callers needing per-batch isolation must chunk their changes across multiple `commitChanges()` calls.

**ADR-008-02 — peerDependencies adds `@tomis/grid-core` (D9 + C-22)**:
- `peerDependencies` gains `"@tomis/grid-core": "workspace:*"` (the legacy alias imports `Grid` / `GridProps` / `GridHandle`). `@tanstack/react-table`, `react`, `react-dom` are preserved.
- `@tomis/grid-license` is **NOT** added — `verifyOrWarn` remains an internal stub pending MOD-GRID-99-A/G-002 (cross-ref EULA.md cosmetic update).

**ADR-008-03 — legacy alias signature + migration order (D3 + D7 + D8)**:
- monorepo `src/legacy/ChangeTrackingGrid.tsx` (NEW): `<ChangeTrackingGrid<TData> data rowKey mapping? validator? optimistic? editedCells? onSave? ...GridProps<TData> />`. Internally composes `useChangeTracking(cfg)` + `<Grid data={tracking.rows} {...rest} />`. C-29 conditional-spread for 4 optional ChangeTrackingConfig fields. `onSave` is NOT auto-invoked (alias does not own a commit policy — explicit per spec D7).
- tw-framework-front `ChangeTrackingGrid.tsx`: compat shim keeping the OLD `{ initialData, columns, onRowClick?, loading?, emptyText?, className? }` props + OLD `ChangeTrackingHandle` (`getChanges/resetChanges/addRow/deleteRow`). Internal state switches to `useChangeTracking`. Synthetic rowKey strategy: `WeakMap<TData, string>` UUID assignment per row reference at mount; `addRow(row)` generates a fresh UUID; `deleteRow(visibleIndex)` resolves index → synthetic key via the current `tracking.rows` array. Handle gains an optional `commitChanges?` method (additive — typeof-check guards downstream consumers).
- tw-framework-front `EditableGrid.tsx`: additive `enableChangeTracking?: boolean` + `rowKey?: keyof TData | ((row: TData) => string)`. Default `enableChangeTracking=false` preserves the existing behavior 100% (C-6). When enabled, `commitEdit` additionally calls `tracking.updateRow(key, { [colId]: newValue })`. Rules-of-Hooks safety: when disabled, hook runs with empty data + no-op extractor (no collision warns).
- tw-framework-front `PayrollEditablePage.tsx`: handleSave switches to `gridRef.current?.commitChanges('/api/payroll/changes', { fetcher, optimistic: true })` when the method is present; falls back to the legacy `service.insertData/updateData/deleteData` for-loop otherwise. The fetcher wraps the existing service helpers so multitenant URL + auth logic is preserved.
- Migration order: Step 5 (monorepo alias) → Step 6 (tw-framework-front shim) → Step 7 (EditableGrid additive) → Step 8 (PayrollEditablePage additive). All four additive — breaking change 0.

**ADR-008-04 — editedCells runtime wiring (D6, closes ADR-007 D9 cascade)**:
- `ChangeMapState<TData>` gains `editedCellsMap: Map<string, boolean>` (composite key = `${rowKey}_${columnId}`).
- `applyUpdate` accepts a 4th boolean param `trackEditedCells` (default `false`); when `true`, it iterates `Object.keys(patch)` and sets composite-keyed entries.
- `applyUndo` (added/edited/deleted branches), `applyDelete` net-zero branch (status was 'added'), and `resetChangeMap` all purge the row's composite-keyed entries via a private `purgeEditedCellsForKey` helper. `applyDelete` non-added branch and `applyAdd` leave the map unchanged.
- The UPDATE action in `useChangeTracking`'s Action union gains `trackEditedCells: boolean`; the `updateRow` dispatch site reads `config.editedCells === true` and threads it through.
- Hook's `editedCellsMap` switches from `useMemo(() => new Map(), [])` to `useMemo(() => state.editedCellsMap, [state.editedCellsMap])` (stable-reference contract preserved — only changes when the reducer state Map changes).
- **columnId assumption (EC-04, advisor-flagged)**: `ColumnDef.id ?? accessorKey`, where `accessorKey === field name === Object.keys(patch)` in normal usage. Explicit `id` override on a column is **not** tracked — this is a documented limitation (alternative `editedCells` typed-by-column-id API is deferred beyond G-005).

### Alternatives Considered

1. **ADR-008-01 — separate `rollback()` public method** — Rejected: API surface bloat. `resetChanges()` already provides the same discard semantics; optimistic failure simply auto-calls the same RESET dispatch.
2. **ADR-008-01 — preCommit snapshot per batch** — Rejected: would require cloning `currentMap/originalMap/insertionOrder/editedCellsMap` on every commit start, doubling allocations + violating C-21 budget for the multi-batch case. Callers needing batch isolation chunk their commits instead.
3. **ADR-008-02 — `peerDependenciesMeta.optional` for grid-core** — Rejected: the legacy alias hard-imports `Grid` / `GridProps`; required peer is structurally correct + Yarn/pnpm both surface a clearer error message when missing.
4. **ADR-008-03 — break the OLD ChangeTrackingGrid signature, deprecate via codemod** — Rejected: 3 usage sites × surgical compat shim is cheaper than a codemod + reviewer cost. C-6 + C-19 favor the additive shim.
5. **ADR-008-03 — replace `PayrollEditablePage` service loop with hook directly (skip the alias method)** — Rejected: would force the page author to re-instantiate `useChangeTracking` themselves and abandon the existing `ChangeTrackingHandle` ref. Additive method on the handle preserves both paths and is safer to roll back.
6. **ADR-008-04 — track per-column-id (not per-accessor-key)** — Deferred: would require threading `tracking.updateRow` consumers to supply `columnId`, breaking the API shape established in G-002. Acceptable limitation given that the EditableGrid `colId` provided to `onDataChange` is typically the accessorKey in tw-framework-front conventions.

### Trade-offs

- **commitChanges throws are caller's responsibility**: in B2 (optimistic + failure) the rollback fires _before_ the re-throw, so any toast / log in the caller's catch block sees an already-reset tracker. Spec Section 6 EC-02 documents this; the alternative (re-throw before rollback) would leave the tracker briefly in an inconsistent state visible to async observers.
- **Compat shim synthetic key via `WeakMap`**: only object rows are supported. PayrollEditablePage rows are `Record<string, unknown>` so this is satisfied; primitive rows would need a different strategy. Not a real limitation for tw-framework-front but documented for future consumers.
- **editedCellsMap purge sweep is `O(N)` per row event**: scanning the entire map per applyUndo / applyDelete / resetChangeMap is acceptable for typical change-set sizes (< 1000 cells); a per-row index would speed it up at the cost of additional state bookkeeping — deferred unless profiling shows it matters.

### Consequences

- MOD-GRID-10 closes — all G-001~G-005 deliverables ship with real runtime behavior except `verifyOrWarn` (waiting on MOD-GRID-99-A/G-002).
- The bundle grows by approximately +3 KB gzipped (legacy alias + commitChanges body + editedCellsMap reducer branches); cumulative Pro package size estimated ~8.6 KB brotli of the 20 KB budget (C-21).
- Three tw-framework-front files migrated additively (C-19 ≤ 5 — comfortable).
- Subsequent license wiring (MOD-GRID-99-A/G-002) will replace `verifyOrWarn` inline + add `@tomis/grid-license` to peerDependencies. EULA.md cosmetic update points consumers there.

### References

- Spec: `artifacts/MOD-GRID-10/tracking/G-005-spec.md` Sections 2.1, 2.2, 2.3, 2.4, 7, 11.2 (BEFORE/AFTER), 11.3 (Steps 1-11), 13 (F-02 license scope split).
- ADR cross-ref: ADR-MOD-GRID-10-001 (hook signature), ADR-007 (editedCells D9 defer — closed here).
- Constraints: C-4, C-6, C-12, C-16, C-17, C-18, C-19, C-21, C-22, C-29, C-30, C-31, C-32, C-33.
- F-06: ADR-006 #3 cosmetic drift ("mapping 함수 throw → 필드값 = null") corrected to align with G-003 D4 (`errors[]` surfacing).
