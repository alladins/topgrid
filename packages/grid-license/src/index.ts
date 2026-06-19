// @topgrid/grid-license — React license gate. Neutral state/checks live in @topgrid/grid-license-core
// (re-exported here so existing importers are unchanged) + the React Watermark/hooks.
export { setLicenseKey, checkLicense, subscribeLicense } from '@topgrid/grid-license-core';
export { Watermark } from './Watermark.js';
export { useLicenseStatus } from './useLicenseStatus.js';
export { useWatermarkEnforcement } from './useWatermarkEnforcement.js';
// MOD-GRID-99-B residual-4 — testing/story support for invalid-state setup (Visual Regression Note).
// Storybook stories 의 `beforeEach` 에서 명시적 invalid LicenseState 설정 → singleton race 차단.
// @internal — production app code 는 `setLicenseKey()` 사용 권고 (verifySignature 거치는 정식 경로).
export { setLicenseState } from '@topgrid/grid-license-core';
export type { LicenseStatus, LicenseReason, LicenseCheckResult } from '@topgrid/grid-license-core';
