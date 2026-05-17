import type { LicenseStatus } from './types.js';

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
  const parts = rawKey.split('.');
  if (parts.length !== 3) {
    return { valid: false, ...({ reason: 'invalid' } as { reason: 'invalid' }) };
  }

  const [pubKeyB64, sigB64, payloadB64] = parts;

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

  let pubKey: CryptoKey;
  try {
    pubKey = await cryptoSubtle.importKey(
      'raw',
      base64urlToBytes(pubKeyB64),
      { name: 'Ed25519' },
      false,
      ['verify'],
    );
  } catch {
    return { valid: false, ...({ reason: 'invalid' } as { reason: 'invalid' }) };
  }

  const sigBytes = base64urlToBytes(sigB64);
  const msgBytes = base64urlToBytes(payloadB64);

  let sigOk: boolean;
  try {
    sigOk = await cryptoSubtle.verify('Ed25519', pubKey, sigBytes, msgBytes);
  } catch {
    return { valid: false, ...({ reason: 'invalid' } as { reason: 'invalid' }) };
  }

  if (!sigOk) {
    return { valid: false, ...({ reason: 'invalid' } as { reason: 'invalid' }) };
  }

  // expiry check
  const now = Date.now();
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
