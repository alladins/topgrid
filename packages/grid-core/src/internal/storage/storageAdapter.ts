/**
 * @file storageAdapter — SSR-safe Web Storage primitives (ADR-007 Wave 3).
 *
 * **Internal-only**. Do NOT export from `@tomis/grid-core` public API.
 * ADR-MOD-GRID-REFACTOR-2026-05-17-007 alternative #3 explicitly rejected
 * public exposure: "4 hook 의 internal 구현 디테일 — public 노출 시 사용자가
 * 직접 사용하면 hook 의도와 충돌. internal 로 한정."
 *
 * ## Scope
 * Consolidates the duplicated boilerplate (SSR guard + try/catch +
 * JSON parse/stringify + QuotaExceededError detection) shared by the
 * 4 persistence hooks:
 *
 * - `useStoragePersist`           (grid-core)
 * - `useColumnPersistence`        (grid-core, @deprecated ADR-013)
 * - `useColumnOrderPersist`       (grid-core/internal/column-drag)
 * - `useExpandedPersistence`      (grid-pro-master)
 *
 * Each hook keeps its own envelope (`{v, p}` URLSearchParams / `{v, data}`
 * JSON / raw array / raw object) and its own setter contract. The adapter
 * only abstracts the SSR + I/O + JSON layer.
 *
 * @see refactor-analysis-2026-05-17.md §8.3 (P1)
 * @see MOD-GRID-REFACTOR-2026-05-17-decisions.md ADR-007
 */

/** Web Storage flavour selector. */
export type StorageType = 'localStorage' | 'sessionStorage';

/**
 * SSR-safe Web Storage accessor.
 *
 * Returns `null` when:
 * - `window` is undefined (SSR)
 * - Safari private mode / cookies disabled (throws on access)
 *
 * @example
 * ```ts
 * const storage = getStorage('localStorage');
 * if (storage === null) return; // SSR / unavailable
 * ```
 */
export function getStorage(type: StorageType = 'localStorage'): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return type === 'sessionStorage' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Read + JSON.parse a single key from Web Storage. Returns `null` on any failure
 * (key absent, parse error, storage unavailable).
 *
 * Validation of the parsed shape (version envelope, schema, type-narrowing) is
 * the caller's responsibility — this primitive only handles I/O + JSON.
 *
 * @example
 * ```ts
 * const raw = readJson<unknown>(storage, key);
 * if (raw === null) return;
 * // caller validates shape (version, fields)
 * ```
 */
export function readJson<T = unknown>(storage: Storage | null, key: string): T | null {
  if (storage === null) return null;
  try {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Read a string value as-is (no JSON.parse) from Web Storage. Returns `null` on
 * any failure. For consumers (`useStoragePersist`) that store a JSON envelope
 * containing a URLSearchParams payload — they want to JSON.parse manually
 * because validation gates `JSON.parse` from the envelope branch.
 */
export function readRaw(storage: Storage | null, key: string): string | null {
  if (storage === null) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Write `JSON.stringify(value)` to a Web Storage key. Silently swallows
 * `QuotaExceededError` and any other write failure. When a `quotaWarnLabel` is
 * provided the QuotaExceededError path emits a single `console.warn` (matches
 * existing hook behaviour for `useStoragePersist` + `useColumnOrderPersist`).
 *
 * @param storage          - target Storage (or `null` → no-op)
 * @param key              - storage key
 * @param value            - JSON-serializable payload
 * @param quotaWarnLabel   - optional label for QuotaExceededError dev warning
 */
export function writeJson(
  storage: Storage | null,
  key: string,
  value: unknown,
  quotaWarnLabel?: string,
): void {
  if (storage === null) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (quotaWarnLabel && e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn(`[${quotaWarnLabel}] QuotaExceededError — save skipped`, key);
    }
  }
}

/**
 * Write a pre-serialized string to a Web Storage key (no JSON.stringify wrap).
 * `useStoragePersist` builds its own `JSON.stringify({v, p})` envelope —
 * passing through `writeJson` would double-stringify.
 */
export function writeRaw(
  storage: Storage | null,
  key: string,
  value: string,
  quotaWarnLabel?: string,
): void {
  if (storage === null) return;
  try {
    storage.setItem(key, value);
  } catch (e) {
    if (quotaWarnLabel && e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn(`[${quotaWarnLabel}] QuotaExceededError — save skipped`, key);
    }
  }
}

/**
 * Remove a Web Storage key. Silently swallows any failure (e.g. SSR).
 */
export function removeKey(storage: Storage | null, key: string): void {
  if (storage === null) return;
  try {
    storage.removeItem(key);
  } catch {
    /* no-op */
  }
}
