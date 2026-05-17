import { useSyncExternalStore } from 'react';

import type { LicenseCheckResult } from './types.js';
import { checkLicense } from './checkLicense.js';
import { getCachedCheck, subscribeLicense } from './state.js';

// `useSyncExternalStore` requires `getSnapshot` to return the same reference
// across calls unless the underlying state actually changed; otherwise React
// throws "The result of getSnapshot should be cached to avoid an infinite
// loop" in Strict Mode. We delegate to `getCachedCheck`, which memoises until
// `setLicenseState` invalidates the cache.
const getSnapshot = (): LicenseCheckResult => getCachedCheck(checkLicense);

/**
 * React hook returning the current license check result. Re-renders when the
 * license state changes (e.g. async `setLicenseKey` resolution).
 *
 * Backed by `useSyncExternalStore` — no tearing under React 18 concurrent mode.
 *
 * @example
 * ```tsx
 * function MyGrid() {
 *   const lic = useLicenseStatus();
 *   return (
 *     <div className="relative">
 *       <table>{ ... }</table>
 *       {lic.watermarkRequired && <Watermark required />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLicenseStatus(): LicenseCheckResult {
  return useSyncExternalStore(subscribeLicense, getSnapshot, getSnapshot);
}
