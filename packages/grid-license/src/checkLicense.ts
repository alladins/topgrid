// checkLicense.ts
import type { LicenseCheckResult } from './types.js';
import { getLicenseState } from './state.js';

const SIXTY_DAYS_MS = 60 * 24 * 3600 * 1000;
let warned = false;

/**
 * 현재 라이선스 상태를 동기 검사하여 `LicenseCheckResult`를 반환한다.
 *
 * - valid=false 이면 `watermarkRequired=true`.
 * - 유효하고 `expiresAt`까지 60일 미만이면 `expiryWarning='soon-expiring'` + `console.warn` (1회).
 * - 유효하고 만료 여유가 충분하면 `{ valid: true, watermarkRequired: false }`.
 */
export function checkLicense(): LicenseCheckResult {
  const status = getLicenseState(); // LicenseStatus (sync)

  if (!status.valid) {
    const result: LicenseCheckResult = { valid: false, watermarkRequired: true };
    if (status.reason !== undefined) result.reason = status.reason;
    if (status.expiresAt !== undefined) result.expiresAt = status.expiresAt;
    return result;
  }

  if (status.expiresAt !== undefined) {
    const msLeft = status.expiresAt.getTime() - Date.now();
    if (msLeft < SIXTY_DAYS_MS) {
      if (!warned) {
        console.warn(
          `[grid-license] 라이선스가 ${Math.ceil(msLeft / (24 * 3600 * 1000))}일 후 만료됩니다.`
        );
        warned = true;
      }
      return {
        valid: true,
        watermarkRequired: false,
        expiryWarning: 'soon-expiring',
        expiresAt: status.expiresAt,
      };
    }
  }

  return { valid: true, watermarkRequired: false };
}
