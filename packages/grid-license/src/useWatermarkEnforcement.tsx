import { useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { Watermark } from './Watermark.js';
import { checkLicense } from './checkLicense.js';
import { subscribeLicense } from './state.js';

// ---------------------------------------------------------------------------
// Module-level singleton state.
//
// Multiple components calling `useWatermarkEnforcement()` (e.g. 500
// `<DataMapCell>` instances) only mount ONE portal at `document.body`. The
// ref-count tracks active subscribers — when it returns to 0, the portal is
// torn down.
//
// Re-renders are driven by `subscribeLicense` — when `setLicenseKey` resolves
// and flips `watermarkRequired`, the singleton React root re-renders.
// ---------------------------------------------------------------------------

let _activeCount = 0;
let _portalContainer: HTMLDivElement | null = null;
let _portalRoot: Root | null = null;
let _unsubLicense: (() => void) | null = null;

function renderWatermark(): void {
  if (_portalRoot === null || typeof document === 'undefined') return;
  const lic = checkLicense();
  _portalRoot.render(lic.watermarkRequired ? <Watermark required /> : null);
}

function mountPortal(): void {
  if (typeof document === 'undefined') return;
  if (_portalContainer !== null) return; // already mounted
  _portalContainer = document.createElement('div');
  _portalContainer.setAttribute('data-topgrid-watermark', '');
  document.body.appendChild(_portalContainer);
  _portalRoot = createRoot(_portalContainer);
  renderWatermark();
  _unsubLicense = subscribeLicense(renderWatermark);
}

function unmountPortal(): void {
  if (_unsubLicense !== null) _unsubLicense();
  if (_portalRoot !== null) _portalRoot.unmount();
  if (_portalContainer !== null && _portalContainer.parentNode !== null) {
    _portalContainer.parentNode.removeChild(_portalContainer);
  }
  _portalRoot = null;
  _portalContainer = null;
  _unsubLicense = null;
}

/**
 * Void registration hook for license watermark enforcement via a singleton
 * portal mounted at `document.body`.
 *
 * - Each mount increments a module-level ref-count.
 * - First mount creates the singleton portal + React root.
 * - License state changes (`setLicenseKey`) re-render the portal via
 *   `subscribeLicense`.
 * - Last unmount (ref-count → 0) tears down the portal.
 *
 * Use case: per-cell renderers (e.g. `DataMapCell`) where the component
 * itself has no host DOM suitable for wrapper-based watermarking.
 *
 * SSR-safe: portal setup is skipped when `document` is undefined.
 *
 * @example
 * ```tsx
 * export function DataMapCell(info) {
 *   useWatermarkEnforcement(); // void — no return value
 *   return <span>{...}</span>;
 * }
 * ```
 */
export function useWatermarkEnforcement(): void {
  useEffect(() => {
    _activeCount += 1;
    if (_activeCount === 1) mountPortal();
    return () => {
      _activeCount = Math.max(0, _activeCount - 1);
      if (_activeCount === 0) unmountPortal();
    };
  }, []);
}
