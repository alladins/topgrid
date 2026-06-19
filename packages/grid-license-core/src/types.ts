export type LicenseReason = 'invalid' | 'expired' | 'domain-mismatch';

export interface LicenseStatus {
  valid: boolean;
  reason?: LicenseReason;
  expiresAt?: Date;
  domain?: string;
}

// Internal — state.ts 전용. public export 아님.
export interface LicenseState {
  status: LicenseStatus;
  rawKey: string;
  setAt: number; // Date.now()
}

// G-002 추가

/** 만료 경고 유형. 현재는 'soon-expiring' (60일 이내) 단일 값. */
export type ExpiryWarning = 'soon-expiring';

/**
 * `checkLicense()` 반환 타입.
 * watermarkRequired: true → Pro grid 워터마크 표시 필요.
 * expiryWarning: 'soon-expiring' → 60일 이내 만료 (console.warn 발생).
 */
export interface LicenseCheckResult {
  valid: boolean;
  watermarkRequired: boolean;
  expiryWarning?: ExpiryWarning;
  expiresAt?: Date;
  reason?: LicenseReason;
}
