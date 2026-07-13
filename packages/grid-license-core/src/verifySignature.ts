import type { LicenseStatus } from './types.js';

/**
 * vendor Ed25519 서명 **공개키**(raw 32바이트, base64url) — 라이브러리에 핀(하드코딩).
 * 라이선스 키는 이 공개키에 대응하는 개인키(scripts/license/ CLI 보관)로 서명돼야만 유효.
 * ★키에 동봉된 공개키를 신뢰하지 않으므로 자가서명(위조) 키는 거부된다.
 * 키페어 교체 시: `node scripts/license/license.mjs keygen` → 출력된 공개키로 이 값을 갱신 후 재발행.
 */
const PINNED_PUBLIC_KEY = 'yDLmmLTiM1MDmdkrP0OIQZHxmM2ppEmscxH41ixBfU8';

/**
 * 평가판 전용 서명 **공개키**(핀). 이 키로 서명된 라이선스는 ★만료가 `지금 + TRIAL_MAX_WINDOW` 이내일
 * 때만 유효하다. 유료 키와 별개의 키페어라, 이 키(및 대응 개인키)가 유출돼도 **≤35일 자동소멸 체험판만
 * 위조 가능**하고 유료 라이선스는 위조할 수 없다. 교체: `keygen --trial` 후 이 값 갱신·재발행.
 */
const PINNED_TRIAL_PUBLIC_KEY = '9ITla68wi7J1E8nSm_Wi8c712mhmldJ-9GbyAZwA8GM';

/** 평가판 키로 서명된 라이선스의 최대 유효 창(35일). scripts/license/license.mjs 와 동일해야 함. */
const TRIAL_MAX_WINDOW_MS = 35 * 24 * 3600 * 1000;

interface KeyPayload {
  domain: string;
  expiresAt: number; // Unix ms
  tier: string;
}

function isKeyPayload(v: unknown): v is KeyPayload {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>)['domain'] === 'string' &&
    typeof (v as Record<string, unknown>)['expiresAt'] === 'number' &&
    typeof (v as Record<string, unknown>)['tier'] === 'string'
  );
}

function base64urlToBytes(s: string): Uint8Array {
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** D7: C-32 pure async helper — no React, no DOM side-effects */
export async function verifySignature(rawKey: string): Promise<LicenseStatus> {
  // 키 형식: <서명>.<페이로드> (2파트). 공개키는 키에 넣지 않고 라이브러리에 핀된 값으로 검증.
  const parts = rawKey.split('.');
  if (parts.length !== 2) {
    return { valid: false, ...({ reason: 'invalid' } as { reason: 'invalid' }) };
  }

  const [sigB64, payloadB64] = parts;

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(payloadB64)));
  } catch {
    return { valid: false, ...({ reason: 'invalid' } as { reason: 'invalid' }) };
  }

  if (!isKeyPayload(payload)) {
    return { valid: false, ...({ reason: 'invalid' } as { reason: 'invalid' }) };
  }

  // Web Crypto API — Ed25519
  let cryptoSubtle: SubtleCrypto;
  try {
    cryptoSubtle = crypto.subtle;
  } catch {
    // SSR/Node 18 fallback: crypto.subtle 미지원
    return { valid: false, ...({ reason: 'invalid' } as { reason: 'invalid' }) };
  }

  const sigBytes = base64urlToBytes(sigB64);
  const msgBytes = base64urlToBytes(payloadB64);

  // 핀된 공개키로 서명 검증(성공 시 true). importKey/verify 예외는 false 로 흡수.
  const verifyWith = async (pinnedB64: string): Promise<boolean> => {
    try {
      const pk = await cryptoSubtle.importKey(
        'raw',
        base64urlToBytes(pinnedB64),
        { name: 'Ed25519' },
        false,
        ['verify'],
      );
      return await cryptoSubtle.verify('Ed25519', pk, sigBytes, msgBytes);
    } catch {
      return false;
    }
  };

  // 1) 유료(main) 키 → 상한 없음. 2) 실패하면 평가판(trial) 키 시도 → 만료 window 상한 강제.
  let signedByTrial = false;
  if (!(await verifyWith(PINNED_PUBLIC_KEY))) {
    if (!(await verifyWith(PINNED_TRIAL_PUBLIC_KEY))) {
      return { valid: false, ...({ reason: 'invalid' } as { reason: 'invalid' }) };
    }
    signedByTrial = true;
  }

  const now = Date.now();

  // ★평가판 키 서명은 만료가 지금+35일 이내일 때만 유효 — 유출 blast-radius 를 35일로 bound(장기 위조 차단).
  if (signedByTrial && payload.expiresAt > now + TRIAL_MAX_WINDOW_MS) {
    return { valid: false, ...({ reason: 'invalid' } as { reason: 'invalid' }) };
  }

  // expiry check
  if (payload.expiresAt < now) {
    return {
      valid: false,
      ...({ reason: 'expired' } as { reason: 'expired' }),
      expiresAt: new Date(payload.expiresAt),
      domain: payload.domain,
    };
  }

  // domain check — D5: SSR window undefined → skip
  let hostname: string | null = null;
  if (typeof window !== 'undefined') {
    hostname = window.location.hostname;
  }

  if (hostname !== null) {
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocalhost && hostname !== payload.domain) {
      return {
        valid: false,
        ...({ reason: 'domain-mismatch' } as { reason: 'domain-mismatch' }),
        expiresAt: new Date(payload.expiresAt),
        domain: payload.domain,
      };
    }
  }

  return {
    valid: true,
    expiresAt: new Date(payload.expiresAt),
    domain: payload.domain,
  };
}
