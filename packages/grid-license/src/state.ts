import type { LicenseCheckResult, LicenseState, LicenseStatus } from './types.js';

let _state: LicenseState | null = null;

type LicenseListener = () => void;
const _listeners = new Set<LicenseListener>();

// `useSyncExternalStore` REQUIRES the snapshot function to return the same
// reference between calls unless the underlying state has actually changed —
// otherwise React enters an infinite render loop in Strict Mode (React docs:
// "Do not return a new object from getSnapshot every time"). Since
// `checkLicense()` allocates a fresh `LicenseCheckResult` on every call, we
// cache the most recent result here and invalidate it whenever `setLicenseState`
// runs (i.e. when the underlying state actually changes).
let _cachedCheck: LicenseCheckResult | null = null;

export function setLicenseState(s: LicenseState): void {
  _state = s;
  _cachedCheck = null;
  _listeners.forEach((l) => l());
}

export function getLicenseState(): LicenseStatus {
  if (_state === null) {
    return { valid: false, ...({ reason: 'invalid' } as { reason: 'invalid' }) };
  }
  return _state.status;
}

/**
 * Returns a cached `LicenseCheckResult` — computes via `compute()` only on
 * the first call after a state change. Subsequent calls return the same
 * reference until `setLicenseState` invalidates the cache.
 *
 * Used by `useLicenseStatus` (via `useSyncExternalStore`) to satisfy React's
 * snapshot-stability requirement.
 */
export function getCachedCheck(
  compute: () => LicenseCheckResult,
): LicenseCheckResult {
  if (_cachedCheck === null) _cachedCheck = compute();
  return _cachedCheck;
}

/**
 * Subscribe to license state changes. Listener is invoked synchronously
 * after every `setLicenseState` call. Returns an unsubscribe function.
 *
 * Used internally by `useLicenseStatus` (via `useSyncExternalStore`) and
 * by `useWatermarkEnforcement` (singleton portal re-render trigger).
 */
export function subscribeLicense(listener: LicenseListener): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}
