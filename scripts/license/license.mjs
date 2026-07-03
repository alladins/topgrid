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
 *         [--customer <회사>] [--contact <이메일>] [--kind trial|paid] [--note <메모>]
 *                                 라이선스 키 발급 + ★발급 대장(ledger.csv) 자동 기록.
 *                                 개인키는 --key <file> | env TOPGRID_LICENSE_PRIVATE_KEY
 *                                 | scripts/license/.private.key 순으로 로드.
 *   list                          발급 대장 조회(활성/만료 상태 포함).
 *   expiring [--days N]           N일(기본 14) 내 만료 예정 키 — 갱신/전환 영업 타이밍.
 *   inspect <key>                 키의 페이로드 디코드(서명 검증 없이 내용만).
 *
 * --expires 형식: ISO8601(2027-06-21) | +Nd(N일 후) | +Nm(N개월 후) | +Ny(N년 후)
 *
 * ★대장(ledger.csv)은 고객명·연락처·키를 담으므로 gitignore(비커밋). 개인키와 함께 별도 백업 필수.
 *   경로 재정의: env TOPGRID_LICENSE_LEDGER (selftest 가 임시 파일로 사용).
 *
 * 예:
 *   node scripts/license/license.mjs keygen
 *   node scripts/license/license.mjs sign --domain shipmg.example.com --expires +1y --tier pro \
 *     --customer "PTLPSM(○○사)" --contact dam@example.com --kind paid --note "1호 딜, 첫해 50%"
 *   node scripts/license/license.mjs expiring --days 7
 */
import { webcrypto as crypto } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const PRIV_FILE = join(HERE, '.private.key');
const LEDGER_FILE = process.env.TOPGRID_LICENSE_LEDGER || join(HERE, 'ledger.csv');
const LEDGER_HEADER = 'issued_at,domain,expires_at,kind,tier,customer,contact,note,key_fingerprint,key';

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

// ── 발급 대장 (ledger.csv) ──
const csvEsc = (s) => {
  s = String(s ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

/** 따옴표 필드를 처리하는 최소 CSV 한 줄 파서. */
function csvParseLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function readLedger() {
  if (!existsSync(LEDGER_FILE)) return [];
  const lines = readFileSync(LEDGER_FILE, 'utf8').split('\n').filter((l) => l.trim());
  const header = csvParseLine(lines[0] || '');
  return lines.slice(1).map((l) => {
    const cells = csvParseLine(l);
    const row = {};
    header.forEach((h, i) => { row[h] = cells[i] ?? ''; });
    return row;
  });
}

function recordLedger(entry) {
  if (!existsSync(LEDGER_FILE)) writeFileSync(LEDGER_FILE, LEDGER_HEADER + '\n');
  const row = [
    entry.issuedAt, entry.domain, entry.expiresAt, entry.kind, entry.tier,
    entry.customer, entry.contact, entry.note, entry.fingerprint, entry.key,
  ].map(csvEsc).join(',');
  appendFileSync(LEDGER_FILE, row + '\n');
}

const isActive = (row) => Date.parse(row.expires_at) > Date.now();
const fmtDate = (iso) => (iso || '').slice(0, 10);

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
  const opt = (name) => (args[name] && args[name] !== true ? String(args[name]) : '');

  // 중복 경고: 같은 도메인에 활성 키가 이미 있으면 알림(발급은 계속 — 재발급/조건변경일 수 있음).
  const dup = readLedger().filter((r) => r.domain === String(args.domain) && isActive(r));
  if (dup.length > 0) {
    console.warn(`⚠ 이 도메인에 활성 키가 이미 ${dup.length}건 있습니다(최근 만료 ${fmtDate(dup[dup.length - 1].expires_at)}, 종류 ${dup[dup.length - 1].kind || '-'}). 계속 발급합니다.`);
  }

  const privB64 = loadPrivateKey(args);
  const privKey = await crypto.subtle.importKey('pkcs8', fromB64url(privB64), { name: 'Ed25519' }, false, ['sign']);

  const expiresAt = resolveExpiry(String(args.expires));
  const payload = { domain: String(args.domain), expiresAt, tier };
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const sig = await crypto.subtle.sign({ name: 'Ed25519' }, privKey, payloadBytes);

  const key = b64url(sig) + '.' + b64url(payloadBytes);

  // ★발급 대장 자동 기록 (누가·어떤 도메인·언제 만료 — 갱신 영업·매출 집계의 원장).
  recordLedger({
    issuedAt: new Date().toISOString(),
    domain: payload.domain,
    expiresAt: new Date(expiresAt).toISOString(),
    kind: opt('kind'),
    tier,
    customer: opt('customer'),
    contact: opt('contact'),
    note: opt('note'),
    fingerprint: key.slice(0, 16),
    key,
  });

  console.log('\n=== 발급된 라이선스 키 ===\n');
  console.log('  도메인 : ' + payload.domain);
  console.log('  만료   : ' + new Date(expiresAt).toISOString() + '  (' + new Date(expiresAt).toLocaleDateString('ko-KR') + ')');
  console.log('  등급   : ' + tier + (opt('kind') ? '  |  종류: ' + opt('kind') : ''));
  if (opt('customer')) console.log('  고객   : ' + opt('customer') + (opt('contact') ? ' <' + opt('contact') + '>' : ''));
  console.log('');
  console.log(key + '\n');
  console.log('  고객 적용:  setLicenseKey(\'' + key.slice(0, 16) + '…\')  // 앱 entry 1회');
  console.log('  대장 기록: ' + LEDGER_FILE + '\n');
}

function list() {
  const rows = readLedger();
  if (rows.length === 0) { console.log('발급 대장이 비어 있습니다: ' + LEDGER_FILE); return; }
  console.log('\n=== 발급 대장 (' + rows.length + '건) ===\n');
  const pad = (s, n) => String(s ?? '').padEnd(n).slice(0, n);
  console.log(pad('도메인', 30) + pad('종류', 7) + pad('만료', 12) + pad('상태', 6) + pad('고객', 24) + '메모');
  for (const r of rows) {
    const status = isActive(r) ? '✅활성' : '⛔만료';
    console.log(pad(r.domain, 30) + pad(r.kind || '-', 7) + pad(fmtDate(r.expires_at), 12) + pad(status, 6) + pad(r.customer || '-', 24) + (r.note || ''));
  }
  console.log('');
}

function expiringCmd(args) {
  const days = args.days && args.days !== true ? Number(args.days) : 14;
  const limit = Date.now() + days * 86400000;
  const rows = readLedger().filter((r) => isActive(r) && Date.parse(r.expires_at) <= limit)
    .sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at));
  if (rows.length === 0) { console.log(`${days}일 내 만료 예정 키 없음.`); return; }
  console.log(`\n=== ${days}일 내 만료 예정 (${rows.length}건) — 갱신/전환 연락 타이밍 ===\n`);
  for (const r of rows) {
    const dLeft = Math.ceil((Date.parse(r.expires_at) - Date.now()) / 86400000);
    console.log(`  D-${dLeft}  ${fmtDate(r.expires_at)}  ${r.domain}  [${r.kind || '-'}]  ${r.customer || '-'}${r.contact ? ' <' + r.contact + '>' : ''}`);
  }
  console.log('');
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
else if (cmd === 'list') list();
else if (cmd === 'expiring') expiringCmd(args);
else if (cmd === 'inspect') inspect(args);
else {
  console.log('topgrid 라이선스 발급 CLI\n');
  console.log('  node scripts/license/license.mjs keygen');
  console.log('  node scripts/license/license.mjs sign --domain <d> --expires <+1y|ISO> [--tier pro]');
  console.log('                                        [--customer <회사>] [--contact <email>] [--kind trial|paid] [--note <메모>]');
  console.log('  node scripts/license/license.mjs list                 # 발급 대장 조회');
  console.log('  node scripts/license/license.mjs expiring [--days 14] # 만료 임박(갱신 영업)');
  console.log('  node scripts/license/license.mjs inspect <key>');
  process.exit(cmd ? 1 : 0);
}
