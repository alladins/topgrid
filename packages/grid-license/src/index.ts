// @tomis/grid-license
export { setLicenseKey } from './setLicenseKey.js';
export { checkLicense } from './checkLicense.js';
export { Watermark } from './Watermark.js';
export { useLicenseStatus } from './useLicenseStatus.js';
export { useWatermarkEnforcement } from './useWatermarkEnforcement.js';
export { subscribeLicense } from './state.js';
// MOD-GRID-99-B residual-4 — testing/story support for invalid-state setup (Visual Regression Note).
// Storybook stories 의 `beforeEach` 에서 명시적 invalid LicenseState 설정 → singleton race 차단.
// @internal — production app code 는 `setLicenseKey()` 사용 권고 (verifySignature 거치는 정식 경로).
export { setLicenseState } from './state.js';
export type { LicenseStatus, LicenseReason, LicenseCheckResult } from './types.js';
