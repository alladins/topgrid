// @topgrid/grid-license-core — framework-neutral license state + checks (no React/Vue).
// The single source of the license-state singleton + verification. @topgrid/grid-license (React)
// re-exports these and adds the React Watermark/hooks; Vue (and any non-React) consumers import
// straight from here so they inherit no React peers (same extract-on-demand pattern as grid-chart-core).
export { setLicenseKey } from './setLicenseKey.js';
export { checkLicense } from './checkLicense.js';
export { subscribeLicense, setLicenseState, getLicenseState, getCachedCheck } from './state.js';
export type { LicenseStatus, LicenseReason, LicenseCheckResult, LicenseState } from './types.js';
