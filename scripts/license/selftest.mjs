/**
 * 라이선스 발급·검증 셀프테스트 (프레임워크 없는 node 스크립트).
 * 공개키 핀(위조 차단)이 회귀하지 않도록 고정. dist 빌드 후 실행.
 *
 *   pnpm --filter @topgrid/grid-license-core build
 *   node scripts/license/selftest.mjs
 */
import { webcrypto as crypto } from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { rmSync, readFileSync, existsSync } from 'node:fs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DIST = join(ROOT, 'packages/grid-license-core/dist/index.mjs');
const { setLicenseKey, checkLicense, subscribeLicense } = await import(pathToFileURL(DIST).href);

const b64url = (b) => Buffer.from(b).toString('base64url');
const fromB64url = (s) => new Uint8Array(Buffer.from(s, 'base64url'));
let pass = 0, fail = 0;
const chk = (n, c) => { console.log((c ? '  OK   ' : '  FAIL ') + n); c ? pass++ : fail++; };

// 공개 경로: setLicenseKey → (async verify) → setLicenseState 통지 → checkLicense
const verify = (key) => new Promise((res) => {
  const unsub = subscribeLicense(() => { unsub(); res(checkLicense()); });
  setLicenseKey(key);
});
const signCLI = (dom, exp) => {
  const cli = join(ROOT, 'scripts/license/license.mjs');
  const o = execSync(`node "${cli}" sign --domain ${dom} --expires ${exp} --tier pro`, { cwd: ROOT, encoding: 'utf8' });
  return o.split('\n').map((s) => s.trim()).find((s) => /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(s) && s.length > 60);
};

// ★대장 검증용 임시 ledger (실제 ledger.csv 오염 방지 — CLI 가 env 로 경로 재정의 지원)
const TMP_LEDGER = join(ROOT, 'scripts/license/.selftest-ledger.tmp.csv');
process.env.TOPGRID_LICENSE_LEDGER = TMP_LEDGER; // execSync(signCLI)가 상속
rmSync(TMP_LEDGER, { force: true });

const key = signCLI('shipmg.example.com', '+1y');
const r1 = await verify(key);
chk('정상 서명 키 → valid=true, watermark=false', r1.valid === true && r1.watermarkRequired === false);

const [sig, pay] = key.split('.');
const tampered = sig + '.' + (pay.slice(0, -2) + (pay.slice(-2) === 'AA' ? 'BB' : 'AA'));
const r2 = await verify(tampered);
chk('변조 페이로드 → valid=false, watermark=true', r2.valid === false && r2.watermarkRequired === true);

// ★핀 핵심: 타 키페어로 자가서명한 위조 키는 거부돼야 함
const evil = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
const ep = new TextEncoder().encode(JSON.stringify({ domain: 'shipmg.example.com', expiresAt: Date.now() + 9e11, tier: 'pro' }));
const es = await crypto.subtle.sign({ name: 'Ed25519' }, evil.privateKey, ep);
const r3 = await verify(b64url(es) + '.' + b64url(ep));
chk('★타 키페어 자가서명(위조) → valid=false (핀 효과)', r3.valid === false);

const r4 = await verify(signCLI('shipmg.example.com', '2020-01-01'));
chk('만료 키 → reason=expired', r4.valid === false && r4.reason === 'expired');

const r5 = await verify('aaa.bbb.ccc');
chk('구 3파트 형식 → valid=false', r5.valid === false);

// ★발급 대장 자동 기록 검증 (sign 2회 = 2행 + 헤더)
chk('대장 파일 자동 생성', existsSync(TMP_LEDGER));
const ledgerLines = readFileSync(TMP_LEDGER, 'utf8').split('\n').filter((l) => l.trim());
chk('대장 = 헤더 + 발급 2행', ledgerLines.length === 3 && ledgerLines[0].startsWith('issued_at,domain'));
chk('대장 1행: 도메인·키지문 기록', ledgerLines[1].includes('shipmg.example.com') && ledgerLines[1].includes(key.slice(0, 16)));
rmSync(TMP_LEDGER, { force: true });

// ── 평가판(trial) 키 검증 (안 B — 이중키 + window 상한) ──
const TRIAL_PRIV_FILE = join(ROOT, 'scripts/license/.trial-private.key');
if (existsSync(TRIAL_PRIV_FILE)) {
  const trialPriv = await crypto.subtle.importKey('pkcs8', fromB64url(readFileSync(TRIAL_PRIV_FILE, 'utf8').trim()), { name: 'Ed25519' }, false, ['sign']);
  const signTrial = async (domain, expiresAt) => {
    const p = new TextEncoder().encode(JSON.stringify({ domain, expiresAt, tier: 'pro' }));
    const s = await crypto.subtle.sign({ name: 'Ed25519' }, trialPriv, p);
    return b64url(s) + '.' + b64url(p);
  };
  const day = 86400000;
  const rT1 = await verify(await signTrial('eval.example.com', Date.now() + 30 * day));
  chk('평가판 키(30일) → valid=true, watermark=false', rT1.valid === true && rT1.watermarkRequired === false);
  const rT2 = await verify(await signTrial('eval.example.com', Date.now() + 100 * day));
  chk('★평가판 키 window 초과(100일) → invalid (blast-radius 35일 bound)', rT2.valid === false);
  const rT3 = await verify(await signTrial('eval.example.com', Date.now() - day));
  chk('평가판 만료 키 → invalid', rT3.valid === false);
  // ★유료(main) 키는 상한 없음 — 1년 키가 평가판 규칙에 걸리지 않아야 함(회귀 방지)
  const rT4 = await verify(signCLI('paid.example.com', '+1y'));
  chk('유료 키 1년 → valid (window 상한 미적용)', rT4.valid === true);
} else {
  console.log('  SKIP 평가판 테스트(.trial-private.key 없음 — keygen --trial 후 재실행)');
}

console.log(`\n결과: ${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
