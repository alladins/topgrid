/**
 * MOD-GRID-60 — pure versioned view-state envelope (no React, no storage).
 *
 * Serializes arbitrary view state (grouping, pivot config, …) into a versioned `{v,p}` JSON
 * envelope and back. A version mismatch or a parse failure deserializes to `null` (the caller
 * falls back to its initial value) — so a schema change safely discards stale stored state.
 *
 * Mirrors the `{v,p}` envelope of `serializeState` (useStoragePersist) but is value-generic and
 * has no fixed key set — `useViewStatePersistence` wraps it for any single serializable value.
 */

/** Wrap a value in a versioned envelope string. */
export function serializeViewState<T>(value: T, version: number): string {
  return JSON.stringify({ v: version, p: value });
}

/**
 * Parse a versioned envelope back to its value. Returns `null` when:
 * - `raw` is null,
 * - JSON parse fails,
 * - the shape is not `{v,p}`,
 * - the version does not match (stale schema).
 */
export function deserializeViewState<T>(raw: string | null, version: number): T | null {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('v' in parsed) ||
    !('p' in parsed)
  ) {
    return null;
  }
  const { v, p } = parsed as { v: unknown; p: unknown };
  if (v !== version) return null;
  return p as T;
}
