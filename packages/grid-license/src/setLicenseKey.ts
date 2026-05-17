import type { LicenseStatus } from './types.js';
import { verifySignature } from './verifySignature.js';
import { setLicenseState } from './state.js';

/**
 * Pro 패키지 전역 라이선스 등록 API.
 * 앱 entry(main.tsx / App.tsx)에서 1회 호출.
 * @param key - Base64url(pubKey).Base64url(sig).Base64url(payload) 형식 라이선스 키
 * @returns LicenseStatus — 즉시 반환 (동기 wrapper, 내부 비동기 검증 완료 후 상태 갱신)
 *
 * 주의: 반환값은 Promise 없이 즉시 사용 가능하도록 동기 API로 설계.
 * 내부적으로 verifySignature (async) 결과를 저장. 비동기 완료 전 getLicenseState() 호출 시
 * 기본값 {valid:false, reason:'invalid'} 반환 (D6).
 */
export function setLicenseKey(key: string): LicenseStatus {
  // 기본값 초기화 (D6: 검증 완료 전 getLicenseState 호출 대비)
  const pending: LicenseStatus = { valid: false };

  // 비동기 검증 시작 (fire-and-forget, 결과는 state에 저장)
  verifySignature(key).then((status) => {
    setLicenseState({ status, rawKey: key, setAt: Date.now() });
  }).catch(() => {
    setLicenseState({
      status: { valid: false, ...({ reason: 'invalid' } as { reason: 'invalid' }) },
      rawKey: key,
      setAt: Date.now(),
    });
  });

  return pending;
}
