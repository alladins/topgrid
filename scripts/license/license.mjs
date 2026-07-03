#!/usr/bin/env node
/**
 * topgrid 라이선스 발급 CLI (vendor 전용)
 *
 * Ed25519 서명 방식. 브라우저(@topgrid/grid-license-core `verifySignature`)와
 * **동일한 Web Crypto 알고리즘/형식**을 쓰도록 Node webcrypto(crypto.subtle) 사용.
 *
 * 라이선스 키 형식 (2파트, base64url):
 *     <서명>.<페이로드>
 *   페이로드 = JSON { domain, expiresAt(Unix ms), tier }
 *   서명     = 페이로드 JSON 바이트를 vendor 개인키로 Ed25519 서명
 *   ★공개키는 키에 넣지 않는다 — 라이브러리에 핀(하드코딩)된 공개키로만 검증(위조 차단).
 *
 * 명령:
 *   keygen                        Ed25519 키페어 생성. 공개키(핀용)·개인키(보관용) 출력.
 *   sign  --domain <d> --expires <spec> [--tier pro]
 *                                 라이선스 키 발급. 개인키는 --key <file> | env TOPGRID_LICENSE_PRIVATE_KEY
 *                                 | scripts/license/.private.key 순으로 로드.
 *   inspect <key>                 키의 페이로드 디코드(서명 검증 없이 내용만).
 *
 * --expires 형식: ISO8601(2027-06-21) | +Nd(N일 후) | +Nm(N개월 후) | +Ny(N년 후)
 *
 * 예:
 *   node scripts/license/license.mjs keygen
 *   node scripts/license/license.mjs sign --domain shipmg.example.com --expires +1y --tier pro
 */
import { webcrypto as crypto } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const PRIV_FILE = join(HERE, '.private.key');

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const fromB64url = (s) => new Uint8Array(Buffer.from(s, 'base64url'));

function die(msg) {
  console.error('✖ ' + msg);
  process.exit(1);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) out[a.slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
    else (out._ ??= []).push(a);
  }
  return out;
}

/** --expires spec → Unix ms. Date.now() 기준(발급 시점). */
function resolveExpiry(spec) {
  const rel = /^\+(\d+)([dmy])$/.exec(spec);
  if (rel) {
    const n = Number(rel[1]);
    const d = new Date();
    if (rel[2] === 'd') d.setDate(d.getDate() + n);
    else if (rel[2] === 'm') d.setMonth(d.getMonth() + n);
    else d.setFullYear(d.getFullYear() + n);
    return d.getTime();
  }
  const t = Date.parse(spec);
  if (Number.isNaN(t)) die(`--expires 형식 오류: "${spec}" (ISO8601 또는 +Nd/+Nm/+Ny)`);
  return t;
}

async function keygen() {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const pubRaw = await crypto.subtle.exportKey('raw', pair.publicKey);   // 32 bytes → 라이브러리 핀용
  const privPkcs8 = await crypto.subtle.exportKey('pkcs8', pair.privateKey); // 보관용
  const pub = b64url(pubRaw);
  const priv = b64url(privPkcs8);

  console.log('\n=== Ed25519 라이선스 서명 키페어 ===\n');
  console.log('■ 공개키 (PUBLIC — 라이브러리에 핀):');
  console.log('  ' + pub + '\n');
  console.log('  → packages/grid-license-core/src/verifySignature.ts 의 PINNED_PUBLIC_KEY 상수에 붙여넣기.\n');
  console.log('■ 개인키 (PRIVATE — 절대 커밋/유출 금지):');
  console.log('  ' + priv + '\n');

  if (!existsSync(PRIV_FILE)) {
    writeFileSync(PRIV_FILE, priv + '\n', { mode: 0o600 });
    console.log(`  → ${PRIV_FILE} 에 저장(.gitignore 처리됨). 안전한 곳에 별도 백업 권장.\n`);
  } else {
    console.log(`  ⚠ ${PRIV_FILE} 이미 존재 — 덮어쓰지 않음. 새 키를 쓰려면 파일을 먼저 지우세요.\n`);
  }
}

function loadPrivateKey(args) {
  let src;
  if (args.key) src = readFileSync(String(args.key), 'utf8').trim();
  else if (process.env.TOPGRID_LICENSE_PRIVATE_KEY) src = process.env.TOPGRID_LICENSE_PRIVATE_KEY.trim();
  else if (existsSync(PRIV_FILE)) src = readFileSync(PRIV_FILE, 'utf8').trim();
  else die('개인키를 찾을 수 없음. `keygen` 먼저 실행하거나 --key <file> / env TOPGRID_LICENSE_PRIVATE_KEY 지정.');
  return src;
}

async function sign(args) {
  if (!args.domain || args.domain === true) die('--domain <운영 도메인> 필요 (키 1개 = 도메인 1개).');
  if (!args.expires || args.expires === true) die('--expires <ISO8601|+Nd|+Nm|+Ny> 필요.');
  const tier = args.tier && args.tier !== true ? String(args.tier) : 'pro';

  const privB64 = loadPrivateKey(args);
  const privKey = await crypto.subtle.importKey('pkcs8', fromB64url(privB64), { name: 'Ed25519' }, false, ['sign']);

  const expiresAt = resolveExpiry(String(args.expires));
  const payload = { domain: String(args.domain), expiresAt, tier };
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const sig = await crypto.subtle.sign({ name: 'Ed25519' }, privKey, payloadBytes);

  const key = b64url(sig) + '.' + b64url(payloadBytes);

  console.log('\n=== 발급된 라이선스 키 ===\n');
  console.log('  도메인 : ' + payload.domain);
  console.log('  만료   : ' + new Date(expiresAt).toISOString() + '  (' + new Date(expiresAt).toLocaleDateString('ko-KR') + ')');
  console.log('  등급   : ' + tier + '\n');
  console.log(key + '\n');
  console.log('  고객 적용:  setLicenseKey(\'' + key.slice(0, 16) + '…\')  // 앱 entry 1회\n');
}

function inspect(args) {
  const key = args._?.[0];
  if (!key) die('사용: inspect <라이선스 키>');
  const parts = String(key).split('.');
  if (parts.length !== 2) die(`키 형식 오류: 2파트(sig.payload) 여야 함 (받은 파트 수: ${parts.length}).`);
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromB64url(parts[1])));
  } catch {
    die('페이로드 디코드 실패.');
  }
  console.log(JSON.stringify(payload, null, 2));
  if (typeof payload.expiresAt === 'number') {
    console.log('  만료: ' + new Date(payload.expiresAt).toISOString() + (payload.expiresAt < Date.now() ? '  ⚠ 이미 만료' : ''));
  }
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._?.shift();

if (cmd === 'keygen') await keygen();
else if (cmd === 'sign') await sign(args);
else if (cmd === 'inspect') inspect(args);
else {
  console.log('topgrid 라이선스 발급 CLI\n');
  console.log('  node scripts/license/license.mjs keygen');
  console.log('  node scripts/license/license.mjs sign --domain <d> --expires <+1y|ISO> [--tier pro]');
  console.log('  node scripts/license/license.mjs inspect <key>');
  process.exit(cmd ? 1 : 0);
}
