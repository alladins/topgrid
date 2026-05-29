# useLatestRef Pattern Catalog — useRef + always-sync useEffect (MOD-GRID-02)

**Status**: pattern (2 module-internal occurrences + 1 intra-Goal occurrence) — documentation-only, extraction not yet justified
**Source**: MOD-GRID-02 G-006 self-review (2026-05-14)
**Scope**: cross-Goal observation within single module

---

## Pattern Description

```ts
const latestRef = useRef(value);
useEffect(() => {
  latestRef.current = value;
}); // intentionally no deps — sync on every render
```

This pattern allows a consumer hook to:
1. Receive a non-stable value/callable (recreated each render by caller)
2. Use the value in a separate useEffect with primitive deps (not the value itself)
3. Avoid C-32 option 3 (eslint-disable for non-stable callable)
4. Avoid stale closure (always-sync useEffect updates ref every render)

The ref itself is auto-excluded from react-hooks/exhaustive-deps without eslint-disable directive (eslint plugin design).

## Occurrences in MOD-GRID-02

### Occurrence 1 — G-005 hydrateRef (`useUrlSync.ts`)

- **Location**: `useUrlSync.ts` (approximate lines, per spec D5)
- **Variable**: `hydrateRef = useRef(options.onHydrate)`
- **Purpose**: `onHydrate` callback is non-stable (caller can recreate each render). Stored in ref to avoid useEffect dep churn.
- **Spec reference**: G-005 spec.md D5

### Occurrence 2 — G-006 hydrateRef (`useStoragePersist.ts` L64-67)

- **Location**: `useStoragePersist.ts` L64-67
- **Variable**: `hydrateRef = useRef(options.onHydrate)`
- **Purpose**: Same as G-005 — `onHydrate` callback is non-stable. Pattern inherited via G-005 D5 → G-006 D5 (explicit "G-005 D5 동일 패턴 계승").

### Occurrence 3 — G-006 saveRef (`useStoragePersist.ts` L127-130)

- **Location**: `useStoragePersist.ts` L127-130
- **Variable**: `saveRef = useRef(debouncedSave)`
- **Purpose**: `debouncedSave` from `useDebouncedCallback(fn, ms)` is non-stable when `ms <= 0` (raw fn returned, not useCallback-wrapped). Stored in ref to avoid C-32 option 3 eslint-disable on save-trigger useEffect deps. This is the **D2 Option A** pattern that prevents C-32 3rd occurrence.

## Pattern Variants

| Variant | Stored value | Purpose |
|---------|--------------|---------|
| hydrateRef (G-005, G-006) | non-stable callback supplied by consumer | bypass non-reactivity in useEffect deps |
| saveRef (G-006) | non-stable callable returned by internal hook | bypass C-32 option 3 eslint-disable |

Both variants share identical structure: `useRef + always-sync useEffect (no deps)`.

## Extraction Candidate (NOT YET JUSTIFIED)

```ts
// internal/useLatestRef.ts (hypothetical extraction)
export function useLatestRef<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

// usage:
const hydrateRef = useLatestRef(options.onHydrate);
const saveRef = useLatestRef(debouncedSave);
```

## Threshold for Extraction

Per ADR-MOD-GRID-00 pattern catalog rule:
- 1 occurrence = anecdote
- 2 occurrences in same module = pattern
- 3 occurrences across 2+ modules = extraction threshold

**Current state**: 3 intra-module occurrences (hydrateRef × 2 + saveRef × 1), all within MOD-GRID-02. Extraction would require **at least 1 occurrence in a different module** to justify shared internal helper.

## Bundle Impact Analysis (if extracted)

- Current boilerplate per occurrence: ~3 lines (`const ref = useRef(value); useEffect(() => { ref.current = value; });`)
- Extracted helper: ~5 lines (`export function useLatestRef<T>(value: T) { const ref = useRef(value); useEffect(() => { ref.current = value; }); return ref; }`)
- Break-even point: 2 occurrences (3×2 = 6 lines inline vs 5 helper + 2×1 line call site = 7 lines — extraction is roughly bundle-neutral)
- Beyond 3 occurrences: extraction is bundle-positive

**Decision**: DEFER extraction until 3rd occurrence in a different module (MOD-GRID-04 column hooks, MOD-GRID-08 advanced features, or similar). Document the pattern here for future extraction Goal proposal.

## Cross-Module Forecast

Expected reuse opportunities:
- MOD-GRID-04 (column): column resize handlers, column visibility toggle callbacks
- MOD-GRID-08 (toolbar/advanced): action callbacks
- MOD-GRID-13 (advanced selection): selection callbacks
- MOD-GRID-14 (commit-on-edit): edit completion callbacks

If any of these introduces a 4th occurrence, propose extraction Goal: `MOD-GRID-00/G-NNN-useLatestRef-extract` (or similar) — extract `internal/useLatestRef.ts` + migrate G-005 hydrateRef + G-006 hydrateRef + G-006 saveRef + new occurrence.

## Related Patterns

- **C-32 Option A**: saveRef pattern (subset of useLatestRef applied to debouncedSave)
- **C-32 Option 2**: setterRef pattern (deferred wrapper fix for useControllableState — different problem, similar shape)
- **TB-2 internal-hook-callable-stability** (re-named to MOD-GRID-00/G-NNN-internal-hook-callable-stability per G-006 self-review APPLY-2): root-cause fix that would remove need for saveRef variant of useLatestRef (but hydrateRef variant would still be needed for consumer-supplied callbacks).

---

*MOD-GRID-02 module-end pattern catalog. Documentation only. Extraction deferred until 3rd occurrence across 2+ modules.*
