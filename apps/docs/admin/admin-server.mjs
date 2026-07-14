// topgrid 관리자 대시보드 서버 — 방문 통계(nginx 로그) + 문의 접수/열람.
// 실행: 서버(topgrid 계정)에서 node admin-server.mjs (127.0.0.1:9101 바인드 — 외부 직접 접근 불가,
// nginx 가 /admin/·/api/inquiry 를 HTTPS 로 프록시). 인증: Basic Auth(~/topgrid-admin/auth.json, 600).
// 데이터: ~/topgrid-admin/data/inquiries.jsonl (웹루트 밖 — 직접 노출 불가).
import http from 'node:http';
import { request as httpsRequest } from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import { readFileSync, existsSync, appendFileSync, readdirSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { timingSafeEqual, webcrypto } from 'node:crypto';
import { join } from 'node:path';
import { homedir } from 'node:os';

const PORT = 9101;
const HOME = join(homedir(), 'topgrid-admin');
const DATA = join(HOME, 'data');
const AUTH_FILE = join(HOME, 'auth.json');
// {slack:{webhookUrl}} 및/또는 {telegram:{token,chatId}} — 선택. 설정된 것만 발송(둘 다도 가능).
// 없으면 알림 비활성(문의는 항상 저장됨).
const NOTIFY_FILE = join(HOME, 'notify.json');
// {total, claimed} — 얼리어답터 프로모 카운터. 없으면 total=10·claimed=0. 매 요청 갱신 반영(재시작 불필요).
const PROMO_FILE = join(HOME, 'promo.json');
// 평가판 전용 Ed25519 개인키(base64url pkcs8). 유료 키는 절대 서버에 두지 않음(유출 시 ≤35일 체험판만 위조).
const TRIAL_KEY_FILE = join(HOME, 'trial-signing.key');
const TRIALS_FILE = join(DATA, 'trials.jsonl'); // 자동 발급 이력(도메인당 30일 1회 판단)
const TRIAL_DAYS = 30;
// 이메일 더블 옵트인 발송 설정 {host,port,user,pass,from,fromName}. 있으면 인증 후 발급, 없으면 즉시 발급(현행).
const EMAIL_FILE = join(HOME, 'email.json');
const SITE_BASE = 'https://topgrid.platree.com';
const INQ_FILE = join(DATA, 'inquiries.jsonl');
const HITS_FILE = join(DATA, 'hits.jsonl'); // 1st-party 비컨(정확 UV/세션/PV)
const LOG_DIR = '/var/log/nginx';
// 소유자 IP(사무실·집) — 방문 통계에서 제외(자기 트래픽).
const OWNER_IPS = new Set(['183.100.140.45', '162.120.184.41']);
const BOT = /[Bb]ot|[Cc]rawl|[Ss]pider|Slurp|GPT|OAI-|Amazonbot|PetalBot|Semrush|Ahrefs|MJ12|DotBot|Bytespider|python|curl|wget|Go-http|zgrab|censys|masscan|HeadlessChrome|Scrapy|facebookexternal|Applebot|ClaudeBot|PerplexityBot|meta-external/;
const ASSET = /\.(js|css|png|jpg|jpeg|svg|woff2?|ico|map|json|txt|xml|webmanifest)(\?|$)/;

mkdirSync(DATA, { recursive: true });

// ── 인증 (Basic, timing-safe) ──
const AUTH = JSON.parse(readFileSync(AUTH_FILE, 'utf8')); // {user, pass}
function checkAuth(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return false;
  let dec = '';
  try { dec = Buffer.from(h.slice(6), 'base64').toString('utf8'); } catch { return false; }
  const want = `${AUTH.user}:${AUTH.pass}`;
  const a = Buffer.from(dec), b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}
function deny(res) {
  res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="topgrid-admin"', 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('인증 필요');
}

// ── nginx 로그 파싱 (5분 캐시) ──
let cache = { at: 0, stats: null };
const LINE_RE = /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+)[^"]*" (\d{3}) \S+ "([^"]*)" "([^"]*)"/;
const parseDay = (d) => { // "04/Jul/2026" → Date
  const [dd, mon, yyyy] = d.split('/');
  return new Date(`${mon} ${dd}, ${yyyy}`);
};
function computeStats() {
  if (Date.now() - cache.at < 5 * 60 * 1000 && cache.stats) return cache.stats;
  const files = existsSync(LOG_DIR)
    ? readdirSync(LOG_DIR).filter((f) => f.startsWith('topgrid.access_ssl.log')).sort()
    : [];
  const daily = new Map(); // day → Set(ip)
  const pages = new Map();
  const referers = new Map();
  const pricing = [];
  let total = 0, human = 0, bots = 0, owner = 0;
  const uniq = new Set();
  for (const f of files) {
    let buf;
    try { buf = readFileSync(join(LOG_DIR, f)); } catch { continue; }
    if (f.endsWith('.gz')) { try { buf = gunzipSync(buf); } catch { continue; } }
    for (const line of buf.toString('utf8').split('\n')) {
      const m = LINE_RE.exec(line);
      if (!m) continue;
      const [, ip, ts, method, path, status, ref, ua] = m;
      total++;
      if (BOT.test(ua)) { bots++; continue; }
      if (OWNER_IPS.has(ip)) { owner++; continue; }
      human++;
      uniq.add(ip);
      const day = ts.slice(0, 11);
      if (!daily.has(day)) daily.set(day, new Set());
      daily.get(day).add(ip);
      if (method === 'GET' && /^(200|304)$/.test(status) && !ASSET.test(path)) {
        const p = path.split('?')[0];
        pages.set(p, (pages.get(p) || 0) + 1);
        if (/pricing/.test(p)) pricing.push({ ts, ip, path: p });
      }
      if (ref && ref !== '-' && !/topgrid/.test(ref)) referers.set(ref, (referers.get(ref) || 0) + 1);
    }
  }
  const dailyArr = [...daily.entries()]
    .map(([d, s]) => ({ day: d, uniques: s.size, t: parseDay(d).getTime() }))
    .sort((a, b) => a.t - b.t).slice(-30);
  const stats = {
    generatedAt: new Date().toISOString(),
    note: '소유자 IP(사무실·집) 및 봇 제외',
    totals: { requests: total, human, bots, ownerExcluded: owner, uniqueVisitors: uniq.size },
    daily: dailyArr.map(({ day, uniques }) => ({ day, uniques })),
    topPages: [...pages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([path, views]) => ({ path, views })),
    pricingViews: pricing.slice(-30).reverse(),
    referers: [...referers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([ref, n]) => ({ ref, n })),
  };
  cache = { at: Date.now(), stats };
  return stats;
}

// ── 문의 저장/조회 ──
const rate = new Map(); // ip → timestamps
function rateOk(ip) {
  const now = Date.now();
  const arr = (rate.get(ip) || []).filter((t) => now - t < 3600e3);
  if (arr.length >= 5) return false;
  arr.push(now);
  rate.set(ip, arr);
  return true;
}
// ── 알림 (텔레그램) — 설정 파일 있으면만. 실패해도 문의 저장에 영향 없음(알림은 부가) ──
let notifyCfg = null;
try { if (existsSync(NOTIFY_FILE)) notifyCfg = JSON.parse(readFileSync(NOTIFY_FILE, 'utf8')); } catch { /* 무시 */ }
const TYPE_KO = { trial: '평가', purchase: '구매', enterprise: 'Enterprise/OEM', other: '기타' };

// 평가판 서명키 로드(있으면만). 없으면 자동 발급 비활성(문의 폼은 정상 동작).
let trialSignKey = null;
try {
  if (existsSync(TRIAL_KEY_FILE)) {
    const raw = new Uint8Array(Buffer.from(readFileSync(TRIAL_KEY_FILE, 'utf8').trim(), 'base64url'));
    trialSignKey = await webcrypto.subtle.importKey('pkcs8', raw, { name: 'Ed25519' }, false, ['sign']);
  }
} catch { trialSignKey = null; }

// 이메일 발송 설정 로드(있으면 더블 옵트인 켜짐).
let emailCfg = null;
try { if (existsSync(EMAIL_FILE)) emailCfg = JSON.parse(readFileSync(EMAIL_FILE, 'utf8')); } catch { emailCfg = null; }
const emailEnabled = () => !!(emailCfg && emailCfg.host && emailCfg.user && emailCfg.pass);

// 최소 SMTP 제출 클라이언트(의존성 0). 587=STARTTLS(기본) / 465=implicit TLS. AUTH LOGIN.
function smtpSend(cfg, { to, subject, text, html }) {
  return new Promise((resolve, reject) => {
    const port = Number(cfg.port) || 587;
    const host = String(cfg.host);
    const from = cfg.from || cfg.user;
    const fromName = cfg.fromName || 'topgrid';
    const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
    // 본문: html 있으면 multipart/alternative(text+html), 없으면 text/plain.
    let mime, payload;
    if (html) {
      const boundary = 'tg_' + Buffer.from(webcrypto.getRandomValues(new Uint8Array(12))).toString('hex');
      mime = `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
      payload =
        `--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n${text}\r\n` +
        `--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n${html}\r\n` +
        `--${boundary}--\r\n`;
    } else {
      mime = `Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n`;
      payload = String(text);
    }
    const body =
      `From: ${fromName} <${from}>\r\nTo: ${to}\r\nSubject: =?UTF-8?B?${b64(subject)}?=\r\nMIME-Version: 1.0\r\n${mime}\r\n` +
      payload.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..') + `\r\n`;

    let sock = port === 465 ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
    let buf = '', stage = 'greet', upgraded = port === 465;
    const timer = setTimeout(() => { try { sock.destroy(); } catch {} reject(new Error('SMTP timeout')); }, 20000);
    const done = (ok, err) => { clearTimeout(timer); try { sock.end(); } catch {} ok ? resolve(true) : reject(err instanceof Error ? err : new Error(String(err))); };
    const write = (s) => { try { sock.write(s + '\r\n'); } catch (e) { done(false, e); } };
    const attach = (s) => { s.on('data', onData); s.on('error', (e) => done(false, e)); };

    function onData(chunk) {
      buf += chunk.toString('utf8');
      const lines = buf.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1] || '';
      if (!/^\d{3} /.test(last)) return; // 멀티라인 응답 미완
      const code = parseInt(last.slice(0, 3), 10);
      buf = '';
      step(code, lines.join(' '));
    }
    function step(code, msg) {
      if (stage === 'greet') { if (code !== 220) return done(false, 'greet:' + msg); stage = 'ehlo'; write('EHLO topgrid.platree.com'); }
      else if (stage === 'ehlo') {
        if (code !== 250) return done(false, 'EHLO:' + msg);
        if (!upgraded) { stage = 'starttls'; write('STARTTLS'); }
        else { stage = 'auth'; write('AUTH LOGIN'); }
      } else if (stage === 'starttls') {
        if (code !== 220) return done(false, 'STARTTLS:' + msg);
        sock.removeListener('data', onData);
        const sec = tls.connect({ socket: sock, servername: host }, () => { sock = sec; upgraded = true; stage = 'ehlo'; write('EHLO topgrid.platree.com'); });
        attach(sec);
      } else if (stage === 'auth') { if (code !== 334) return done(false, 'AUTH:' + msg); stage = 'user'; write(b64(cfg.user)); }
      else if (stage === 'user') { if (code !== 334) return done(false, 'AUTH user:' + msg); stage = 'pass'; write(b64(cfg.pass)); }
      else if (stage === 'pass') { if (code !== 235) return done(false, 'AUTH 실패:' + msg); stage = 'from'; write('MAIL FROM:<' + from + '>'); }
      else if (stage === 'from') { if (code !== 250) return done(false, 'MAIL FROM:' + msg); stage = 'rcpt'; write('RCPT TO:<' + to + '>'); }
      else if (stage === 'rcpt') { if (code !== 250 && code !== 251) return done(false, 'RCPT:' + msg); stage = 'data'; write('DATA'); }
      else if (stage === 'data') { if (code !== 354) return done(false, 'DATA:' + msg); stage = 'body'; sock.write(body + '.\r\n'); }
      else if (stage === 'body') { if (code !== 250) return done(false, '본문:' + msg); done(true); }
    }
    attach(sock);
  });
}

// URL 로 JSON POST (fire-and-forget, 실패/타임아웃 무해).
function postJSON(urlStr, obj) {
  let u;
  try { u = new URL(urlStr); } catch { return; }
  const payload = JSON.stringify(obj);
  const req = httpsRequest(
    { hostname: u.hostname, path: u.pathname + u.search, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }, timeout: 8000 },
    (r) => { r.resume(); },
  );
  req.on('error', () => {});
  req.on('timeout', () => req.destroy());
  req.end(payload);
}

function notify(row) {
  const text =
    `📬 새 문의 [${TYPE_KO[row.type] || row.type}]\n` +
    `회사: ${row.company || '-'}${row.name ? ' / ' + row.name : ''}\n` +
    `이메일: ${row.email}\n` +
    (row.domain ? `도메인: ${row.domain}\n` : '') +
    (row.message ? `내용: ${row.message.slice(0, 500)}\n` : '') +
    `\n대시보드: https://topgrid.platree.com/admin/`;

  // Slack Incoming Webhook (설정 시)
  const slack = notifyCfg?.slack;
  if (slack?.webhookUrl) postJSON(slack.webhookUrl, { text });

  // Telegram (설정 시)
  const tg = notifyCfg?.telegram;
  if (tg?.token && tg?.chatId) {
    postJSON(`https://api.telegram.org/bot${tg.token}/sendMessage`, { chat_id: tg.chatId, text, disable_web_page_preview: true });
  }
}

const INQ_TYPES = new Set(['trial', 'purchase', 'enterprise', 'other']);
function saveInquiry(body, ip) {
  const { name = '', company = '', email = '', type = 'other', domain = '', message = '', website = '' } = body;
  if (website) return { ok: false, err: 'spam' }; // honeypot
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return { ok: false, err: '이메일 형식을 확인해 주세요.' };
  if (!String(message).trim() && !String(domain).trim()) return { ok: false, err: '문의 내용 또는 도메인을 입력해 주세요.' };
  const row = {
    ts: new Date().toISOString(), ip,
    type: INQ_TYPES.has(type) ? type : 'other',
    name: String(name).slice(0, 100), company: String(company).slice(0, 200),
    email: String(email).slice(0, 200), domain: String(domain).slice(0, 300),
    message: String(message).slice(0, 5000),
  };
  appendFileSync(INQ_FILE, JSON.stringify(row) + '\n');
  try { notify(row); } catch { /* 알림 실패가 접수에 영향 없게 */ }
  return { ok: true };
}
function readInquiries() {
  if (!existsSync(INQ_FILE)) return [];
  return readFileSync(INQ_FILE, 'utf8').split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean).reverse();
}

// ── 평가판 자동 발급 (안 B: 전용 서명키로 30일 키 발급) ──
const b64url = (buf) => Buffer.from(buf).toString('base64url');
function readTrials() {
  if (!existsSync(TRIALS_FILE)) return [];
  return readFileSync(TRIALS_FILE, 'utf8').split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}
async function signTrialKey(domain, expiresAt) {
  // 라이브러리 CLI 와 동일 페이로드 순서 {domain, expiresAt, tier}. 서명 = 페이로드 바이트 Ed25519.
  const payloadBytes = new TextEncoder().encode(JSON.stringify({ domain, expiresAt, tier: 'pro' }));
  const sig = await webcrypto.subtle.sign({ name: 'Ed25519' }, trialSignKey, payloadBytes);
  return b64url(sig) + '.' + b64url(payloadBytes);
}
// 평가판 발급 요청 검증(공통). 통과 시 {ok, dom, email, company}.
function validateTrialReq(body) {
  const { email = '', domain = '', company = '', website = '' } = body;
  if (website) return { ok: false, err: 'spam' }; // honeypot
  if (!trialSignKey) return { ok: false, err: '평가판 자동 발급이 일시적으로 비활성입니다. 문의 폼으로 신청해 주세요.' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return { ok: false, err: '이메일 형식을 확인해 주세요.' };
  const dom = String(domain).trim().toLowerCase();
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(dom)) return { ok: false, err: '운영 도메인 형식을 확인해 주세요 (예: app.company.com).' };
  // 예약/테스트 TLD 거부(실제 운영 도메인만) — 가짜 신청 차단
  const RESERVED_TLD = /\.(test|example|invalid|localhost|local|internal|lan|home|arpa)$/i;
  if (RESERVED_TLD.test(dom)) return { ok: false, err: '실제 운영 도메인을 입력해 주세요 (test/example 등 예약 도메인은 발급 불가).' };
  if (RESERVED_TLD.test(String(email).split('@')[1] || '')) return { ok: false, err: '실제 이메일 주소를 입력해 주세요.' };
  // 특수문자만 입력 차단 — 회사/이름에 실제 텍스트(글자·숫자) 요구
  if (company && !/[\p{L}\p{N}]/u.test(String(company))) return { ok: false, err: '회사/이름을 정확히 입력해 주세요.' };
  // 도메인당 30일 1회 — 남용 방지
  const prior = readTrials().find((t) => t.domain === dom && Date.now() - Date.parse(t.ts) < TRIAL_DAYS * 86400e3);
  if (prior) return { ok: false, err: '이 도메인은 최근 평가판이 이미 발급되었습니다. 연장/전환은 문의로 요청해 주세요.', already: true };
  return { ok: true, dom, email: String(email).slice(0, 200), company: String(company).slice(0, 200) };
}

// 실제 30일 키 발급 + 기록 + 알림.
async function finalizeTrial({ dom, email, company, ip, verified }) {
  const expiresAt = Date.now() + TRIAL_DAYS * 86400e3;
  const key = await signTrialKey(dom, expiresAt);
  const row = {
    ts: new Date().toISOString(), ip, domain: dom, email, company,
    verified: !!verified, expiresAt: new Date(expiresAt).toISOString(), fingerprint: key.slice(0, 16),
  };
  appendFileSync(TRIALS_FILE, JSON.stringify(row) + '\n');
  try {
    notify({ type: 'trial', company, email, domain: dom, message: `평가판 자동 발급(30일${verified ? ', ✅이메일확인' : ''}) — 만료 ${row.expiresAt.slice(0, 10)}` });
  } catch { /* 알림 실패 무해 */ }
  return { ok: true, key, expiresAt, domain: dom };
}

// 대기 토큰(더블 옵트인) — 메모리 Map, 30분 TTL(재시작 시 소멸=재신청).
const pendingTrials = new Map();
const PENDING_TTL = 30 * 60 * 1000;
const newToken = () => Buffer.from(webcrypto.getRandomValues(new Uint8Array(24))).toString('base64url');
function prunePending() { const now = Date.now(); for (const [k, v] of pendingTrials) if (v.exp < now) pendingTrials.delete(k); }

// 인증 메일 HTML(테이블 레이아웃 + 인라인 CSS + 솔리드 색 = 이메일 클라이언트 호환).
function verifyEmailHtml(domain, link) {
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const d = esc(domain), l = esc(link);
  const F = '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Apple SD Gothic Neo,sans-serif';
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:#eef1f7;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">topgrid 30일 평가판 신청을 확인하고 평가 키를 받으세요.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e6ef;">
<tr><td style="background:#111827;padding:22px 32px;"><span style="font-family:${F};font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">📊 topgrid</span></td></tr>
<tr><td style="padding:36px 32px 8px;font-family:${F};">
<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.02em;">30일 평가판 이메일 확인</h1>
<p style="margin:0 0 26px;font-size:15px;line-height:1.7;color:#4b5563;">아래 버튼을 클릭하면 <b style="color:#111827;">${d}</b> 도메인용 <b style="color:#111827;">30일 Pro 평가 키</b>가 즉시 발급됩니다.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#2563eb" style="border-radius:12px;">
<a href="${l}" style="display:inline-block;padding:15px 34px;font-family:${F};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">평가 키 발급받기 →</a>
</td></tr></table>
<p style="margin:26px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;">버튼이 안 열리면 이 주소를 복사해 브라우저에 붙여넣으세요:<br><a href="${l}" style="color:#2563eb;text-decoration:none;word-break:break-all;">${l}</a></p></td></tr>
<tr><td style="padding:20px 32px 32px;font-family:${F};"><div style="border-top:1px solid #eef1f6;padding-top:16px;"><p style="margin:0;font-size:13px;line-height:1.6;color:#9ca3af;">이 링크는 <b>30분간</b> 유효합니다. 신청하지 않으셨다면 이 메일을 무시하셔도 됩니다.</p></div></td></tr>
<tr><td style="background:#f9fafb;padding:18px 32px;border-top:1px solid #eef1f6;font-family:${F};"><p style="margin:0;font-size:12px;color:#9ca3af;">© topgrid — Headless React/Vue 데이터 그리드 · <a href="https://topgrid.platree.com" style="color:#6b7280;text-decoration:none;">topgrid.platree.com</a></p></td></tr>
</table></td></tr></table></body></html>`;
}

// 신청 처리: 이메일 설정 있으면 인증메일 발송(pending), 없으면 즉시 발급(현행).
async function requestTrial(body, ip) {
  const v = validateTrialReq(body);
  if (!v.ok) return v;
  // 이메일 검증 미설정 = 미검증 자동발급 금지 → 문의로 접수(리드 확보, 키는 미발급).
  if (!emailEnabled()) {
    saveInquiry({ ...body, type: 'trial', message: `[평가판 신청 — 이메일 검증 대기]${body.message ? ' / ' + body.message : ''}` }, ip);
    return { ok: true, inquiry: true };
  }
  prunePending();
  const token = newToken();
  pendingTrials.set(token, { dom: v.dom, email: v.email, company: v.company, ip, exp: Date.now() + PENDING_TTL });
  const link = `${SITE_BASE}/api/verify-trial?token=${token}`;
  const text =
    `안녕하세요,\n\ntopgrid 30일 평가판 신청을 확인해 주세요. 아래 링크를 클릭하면 ${v.dom} 도메인용 평가 키가 발급됩니다.\n\n${link}\n\n` +
    `이 링크는 30분간 유효합니다. 신청하지 않으셨다면 이 메일을 무시하세요.\n\n— topgrid`;
  const html = verifyEmailHtml(v.dom, link);
  try {
    await smtpSend(emailCfg, { to: v.email, subject: 'topgrid 30일 평가판 — 이메일 확인', text, html });
  } catch {
    pendingTrials.delete(token);
    return { ok: false, err: '인증 메일 발송에 실패했습니다. 잠시 후 다시 시도하거나 문의 폼을 이용해 주세요.' };
  }
  return { ok: true, pending: true, email: v.email };
}

// 인증 링크 클릭 → 발급.
async function verifyTrialToken(token) {
  prunePending();
  const p = token && pendingTrials.get(token);
  if (!p) return { ok: false, err: '링크가 만료되었거나 이미 사용되었습니다. 다시 신청해 주세요.' };
  pendingTrials.delete(token); // 단일 사용
  const prior = readTrials().find((t) => t.domain === p.dom && Date.now() - Date.parse(t.ts) < TRIAL_DAYS * 86400e3);
  if (prior) return { ok: false, err: '이 도메인은 이미 평가판이 발급되었습니다.' };
  return finalizeTrial({ dom: p.dom, email: p.email, company: p.company, ip: p.ip, verified: true });
}

// 인증 링크 결과 페이지(HTML) — 키 표시 또는 오류.
function trialResultHtml(r) {
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const head = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>topgrid 평가판</title><style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 20px;color:#111827;line-height:1.6}code{background:#f3f4f6;padding:1px 5px;border-radius:4px}textarea{width:100%;font-family:ui-monospace,monospace;font-size:12px;padding:10px;border:1px solid #d1d5db;border-radius:8px;word-break:break-all}.b{background:#2563eb;color:#fff;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:14px}.muted{color:#6b7280;font-size:13px}</style></head><body>`;
  if (r.ok && r.key) {
    const snippet = `setLicenseKey('${r.key}')`;
    return head +
      `<h2>✅ 30일 평가 키가 발급되었습니다</h2>` +
      `<p>도메인 <code>${esc(r.domain)}</code> · 만료 ${new Date(r.expiresAt).toISOString().slice(0, 10)}</p>` +
      `<p>앱 진입점(main.tsx / Nuxt 플러그인)에서 아래 한 줄로 적용하세요:</p>` +
      `<textarea id="k" readonly rows="4" onclick="this.select()">${esc(snippet)}</textarea>` +
      `<p><button class="b" onclick="navigator.clipboard&&navigator.clipboard.writeText(document.getElementById('k').value);this.textContent='복사됨 ✓'">키 복사</button></p>` +
      `<p class="muted">이 키는 ${esc(r.domain)} 전용이며 30일 후 만료됩니다. 도입 문의는 <a href="${SITE_BASE}/pricing">가격 페이지</a>에서.</p></body></html>`;
  }
  return head + `<h2>링크를 처리할 수 없습니다</h2><p>${esc(r.err || '알 수 없는 오류')}</p><p><a href="${SITE_BASE}/pricing">평가판 다시 신청하기 →</a></p></body></html>`;
}

// ── 비컨 hit 수집·집계 (정확 방문자) ──
const hitRate = new Map();
function hitRateOk(ip) {
  const now = Date.now();
  const arr = (hitRate.get(ip) || []).filter((t) => now - t < 3600e3);
  if (arr.length >= 120) return false; // 페이지뷰 단위라 넉넉히
  arr.push(now);
  hitRate.set(ip, arr);
  return true;
}
function saveHit(body, ip, ua) {
  if (OWNER_IPS.has(ip)) return { ok: true, skipped: 'owner' }; // 소유자 IP = 저장 안 함
  if (BOT.test(ua || '')) return { ok: true, skipped: 'bot' };
  const { vid = '', sid = '', path = '', ref = '', lang = '' } = body;
  if (!vid || !path) return { ok: false };
  const row = {
    ts: new Date().toISOString(),
    vid: String(vid).slice(0, 40),
    sid: String(sid).slice(0, 12),
    path: String(path).slice(0, 300),
    ref: String(ref).slice(0, 300),
    lang: String(lang).slice(0, 20),
  };
  appendFileSync(HITS_FILE, JSON.stringify(row) + '\n');
  return { ok: true };
}
let hitCache = { at: 0, data: null };
function computeVisitors() {
  if (Date.now() - hitCache.at < 60 * 1000 && hitCache.data) return hitCache.data;
  const rows = existsSync(HITS_FILE)
    ? readFileSync(HITS_FILE, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
    : [];
  const now = Date.now();
  const day = (ts) => ts.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const within = (ts, d) => now - Date.parse(ts) < d * 86400e3;
  const uv = (arr) => new Set(arr.map((r) => r.vid)).size;
  const sess = (arr) => new Set(arr.map((r) => r.vid + '/' + r.sid)).size;
  const todayRows = rows.filter((r) => day(r.ts) === today);
  const d7 = rows.filter((r) => within(r.ts, 7));
  const d30 = rows.filter((r) => within(r.ts, 30));
  const daily = new Map();
  for (const r of d30) {
    const d = day(r.ts);
    if (!daily.has(d)) daily.set(d, { uv: new Set(), pv: 0 });
    daily.get(d).uv.add(r.vid);
    daily.get(d).pv++;
  }
  const pages = new Map();
  for (const r of d30) pages.set(r.path, (pages.get(r.path) || 0) + 1);
  const refs = new Map();
  for (const r of d30) if (r.ref && !/topgrid/.test(r.ref)) refs.set(r.ref, (refs.get(r.ref) || 0) + 1);
  const data = {
    since: rows[0]?.ts || null, // 비컨 수집 시작 시점(그 이전은 로그 지표만 존재)
    today: { uv: uv(todayRows), sessions: sess(todayRows), pv: todayRows.length },
    d7uv: uv(d7), d30uv: uv(d30), totalUv: uv(rows), totalPv: rows.length,
    daily: [...daily.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([d, v]) => ({ day: d, uv: v.uv.size, pv: v.pv })),
    topPages: [...pages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([path, pv]) => ({ path, pv })),
    referers: [...refs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([ref, n]) => ({ ref, n })),
  };
  hitCache = { at: Date.now(), data };
  return data;
}

// ── 대시보드 HTML ──
const HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>topgrid 관리자</title><style>
body{font-family:Pretendard,system-ui,sans-serif;margin:0;background:#f6f8fb;color:#111827}
.wrap{max-width:1100px;margin:0 auto;padding:24px 16px}h1{font-size:22px}h2{font-size:16px;margin:28px 0 10px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:14px}
.card b{display:block;font-size:26px}.card span{color:#6b7280;font-size:12px}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;font-size:13px}
th,td{padding:8px 10px;border-bottom:1px solid #f1f5f9;text-align:left;vertical-align:top}th{background:#f8fafc;color:#374151}
.bar{background:#2563eb;height:10px;border-radius:3px;display:inline-block;vertical-align:middle}
.muted{color:#6b7280;font-size:12px}.tag{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:700}
.t-trial{background:#dbeafe;color:#1d4ed8}.t-purchase{background:#dcfce7;color:#15803d}.t-enterprise{background:#fef3c7;color:#b45309}.t-other{background:#f3f4f6;color:#374151}
pre{white-space:pre-wrap;margin:4px 0 0;font-family:inherit}</style></head><body><div class="wrap">
<h1>📊 topgrid 관리자 대시보드</h1><div class="muted" id="gen"></div>
<h2>✅ 정확 방문자 — 비컨 기준 (순방문자 UV·세션·페이지뷰)</h2>
<div class="muted" id="vsince"></div>
<div class="cards" id="vcards"></div>
<h3 style="font-size:14px;margin:14px 0 6px">일자별 UV / PV</h3><table id="vdaily"></table>
<h3 style="font-size:14px;margin:14px 0 6px">페이지별 조회(30일)</h3><table id="vpages"></table>
<h2>서버 로그 기준 (참고 — IP 단위·봇/내 IP 제외)</h2><div class="cards" id="cards"></div>
<h2>일자별 고유 IP (최근 30일, 로그)</h2><table id="daily"></table>
<h2>📬 문의 접수 <span id="notify" class="muted" style="font-size:13px;font-weight:400"></span></h2><table id="inq"><tr><th>시각</th><th>유형</th><th>회사/이름</th><th>이메일</th><th>도메인</th><th>내용</th></tr></table>
<h2>🎫 자동 발급 평가판 <span id="trialcnt" class="muted" style="font-size:13px;font-weight:400"></span></h2><table id="trials"></table>
<h2>페이지 TOP 20</h2><table id="pages"></table>
<h2>/pricing 조회 (최근 30)</h2><table id="pricing"></table>
<h2>외부 유입</h2><table id="ref"></table>
</div><script>
// ★이 브라우저를 소유자로 표시 — 관리자 페이지를 연 브라우저는 이후 비컨 집계에서 자동 제외.
try{localStorage.setItem('tg_owner','1')}catch(e){}
const TYPE_LABEL={trial:'평가',purchase:'구매',enterprise:'Enterprise',other:'기타'};
async function j(u){const r=await fetch(u);return r.json()}
(async()=>{
// ── 비컨(정확 방문자) ──
try{
const v=await j('/admin/api/visitors');
document.getElementById('vsince').textContent=v.since?('수집 시작: '+v.since.slice(0,16).replace('T',' ')+' (이전 기간은 아래 로그 지표 참고)'):'아직 비컨 데이터 없음 — 사이트 배포 후 방문부터 집계됩니다.';
document.getElementById('vcards').innerHTML=[['오늘 순방문자',v.today.uv],['오늘 세션',v.today.sessions],['오늘 페이지뷰',v.today.pv],['7일 순방문자',v.d7uv],['30일 순방문자',v.d30uv],['누적 순방문자',v.totalUv]].map(([k,x])=>'<div class="card"><b>'+x+'</b><span>'+k+'</span></div>').join('');
const vmx=Math.max(1,...v.daily.map(d=>d.uv));
document.getElementById('vdaily').innerHTML='<tr><th>날짜</th><th>UV</th><th>PV</th><th></th></tr>'+v.daily.map(d=>'<tr><td style="width:100px">'+d.day+'</td><td style="width:40px">'+d.uv+'</td><td style="width:40px" class="muted">'+d.pv+'</td><td><span class="bar" style="width:'+(d.uv/vmx*300)+'px"></span></td></tr>').join('');
document.getElementById('vpages').innerHTML='<tr><th>경로</th><th>PV</th></tr>'+v.topPages.map(p=>'<tr><td>'+p.path+'</td><td>'+p.pv+'</td></tr>').join('');
}catch(e){document.getElementById('vsince').textContent='비컨 집계 오류: '+e}
const s=await j('/admin/api/stats');
document.getElementById('gen').textContent='생성: '+s.generatedAt+' · '+s.note+' (내 IP 요청 '+s.totals.ownerExcluded+'건 제외됨)';
const c=document.getElementById('cards');
const last=(n)=>s.daily.slice(-n).reduce((a,d)=>a+d.uniques,0);
c.innerHTML=[['오늘 방문',(s.daily.at(-1)||{}).uniques||0],['최근 7일 합',last(7)],['최근 30일 합',last(30)],['전체 고유 IP',s.totals.uniqueVisitors],['사람 요청',s.totals.human],['봇 요청',s.totals.bots]].map(([k,v])=>'<div class="card"><b>'+v+'</b><span>'+k+'</span></div>').join('');
const mx=Math.max(1,...s.daily.map(d=>d.uniques));
document.getElementById('daily').innerHTML=s.daily.map(d=>'<tr><td style="width:110px">'+d.day+'</td><td style="width:40px">'+d.uniques+'</td><td><span class="bar" style="width:'+(d.uniques/mx*300)+'px"></span></td></tr>').join('');
document.getElementById('pages').innerHTML='<tr><th>경로</th><th>조회</th></tr>'+s.topPages.map(p=>'<tr><td>'+p.path+'</td><td>'+p.views+'</td></tr>').join('');
document.getElementById('pricing').innerHTML='<tr><th>시각</th><th>IP</th><th>경로</th></tr>'+s.pricingViews.map(p=>'<tr><td>'+p.ts+'</td><td>'+p.ip+'</td><td>'+p.path+'</td></tr>').join('');
document.getElementById('ref').innerHTML='<tr><th>리퍼러</th><th>수</th></tr>'+s.referers.map(r=>'<tr><td>'+r.ref+'</td><td>'+r.n+'</td></tr>').join('');
// 알림 상태 표시 + 테스트 버튼
try{const ns=await j('/admin/api/notify-status');const el=document.getElementById('notify');
const on=[];if(ns.slack)on.push('Slack');if(ns.telegram)on.push('Telegram');
if(on.length){el.innerHTML='· 알림 <b style="color:#15803d">ON</b> ('+on.join(', ')+') <button id="ntest" style="font-size:12px;margin-left:6px">테스트 발송</button>';}
else{el.innerHTML='· 알림 <b style="color:#b45309">OFF</b> (설정: 서버 ~/topgrid-admin/notify.json)';}
const bt=document.getElementById('ntest');if(bt)bt.onclick=async()=>{bt.textContent='발송중…';await fetch('/admin/api/notify-test');bt.textContent='발송됨(확인)';};
}catch(e){}
const q=await j('/admin/api/inquiries');
document.getElementById('inq').innerHTML='<tr><th>시각</th><th>유형</th><th>회사/이름</th><th>이메일</th><th>도메인</th><th>내용</th></tr>'+(q.length?q.map(i=>'<tr><td class="muted">'+i.ts.slice(0,16).replace('T',' ')+'</td><td><span class="tag t-'+i.type+'">'+(TYPE_LABEL[i.type]||i.type)+'</span></td><td>'+esc(i.company)+(i.name?' / '+esc(i.name):'')+'</td><td>'+esc(i.email)+'</td><td>'+esc(i.domain)+'</td><td><pre>'+esc(i.message)+'</pre></td></tr>').join(''):'<tr><td colspan="6" class="muted">아직 접수된 문의가 없습니다.</td></tr>');
const tr=await j('/admin/api/trials');
document.getElementById('trialcnt').textContent=tr.length?('· 총 '+tr.length+'건'):'';
document.getElementById('trials').innerHTML='<tr><th>발급</th><th>도메인</th><th>이메일</th><th>만료</th><th>상태</th></tr>'+(tr.length?tr.map(t=>{const exp=Date.parse(t.expiresAt);const active=exp>Date.now();const dleft=Math.ceil((exp-Date.now())/86400000);return '<tr><td class="muted">'+t.ts.slice(0,16).replace('T',' ')+'</td><td>'+esc(t.domain)+'</td><td>'+esc(t.email)+'</td><td>'+t.expiresAt.slice(0,10)+'</td><td>'+(active?'<span class="tag t-trial">D-'+dleft+'</span>':'<span class="tag t-other">만료</span>')+'</td></tr>'}).join(''):'<tr><td colspan="5" class="muted">아직 자동 발급된 평가판이 없습니다.</td></tr>');
function esc(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
})();
function esc(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
</script></body></html>`;

// 얼리어답터 프로모 남은 자리 — promo.json({total,claimed}) 매 요청 읽음(없으면 total=10·claimed=0).
function readPromo() {
  let total = 10, claimed = 0;
  try {
    if (existsSync(PROMO_FILE)) {
      const p = JSON.parse(readFileSync(PROMO_FILE, 'utf8'));
      if (Number.isFinite(p.total)) total = p.total;
      if (Number.isFinite(p.claimed)) claimed = p.claimed;
    }
  } catch { /* 무시 — 기본값 */ }
  return { total, claimed, remaining: Math.max(0, total - claimed) };
}

// ── HTTP 서버 ──
const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};
http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  const ip = req.headers['x-real-ip'] || req.socket.remoteAddress || '?';

  // POST 본문 수집 — ★Buffer.concat 후 일괄 utf8 디코드(청크 경계에서 멀티바이트 한글 깨짐 방지)
  const readBody = (limit, cb) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => { size += c.length; if (size > limit) req.destroy(); else chunks.push(c); });
    req.on('end', () => cb(Buffer.concat(chunks).toString('utf8')));
  };

  // 공개: 방문 비컨 (정확 UV/세션/PV)
  if (req.method === 'POST' && url === '/api/hit') {
    if (!hitRateOk(String(ip))) return send(res, 429, { ok: false });
    readBody(4000, (body) => {
      let parsed = {};
      try { parsed = JSON.parse(body); } catch { return send(res, 400, { ok: false }); }
      try { send(res, 200, saveHit(parsed, String(ip), String(req.headers['user-agent'] || ''))); }
      catch { send(res, 500, { ok: false }); }
    });
    return;
  }

  // 공개: 얼리어답터 프로모 남은 자리(가격 페이지 배너가 조회)
  if (req.method === 'GET' && url === '/api/promo-slots') {
    return send(res, 200, readPromo());
  }

  // 공개: 문의 접수
  if (req.method === 'POST' && url === '/api/inquiry') {
    if (!rateOk(String(ip))) return send(res, 429, { ok: false, err: '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.' });
    readBody(20000, (body) => {
      let parsed = {};
      try { parsed = JSON.parse(body); } catch { return send(res, 400, { ok: false, err: '잘못된 요청' }); }
      const r = saveInquiry(parsed, String(ip));
      send(res, r.ok ? 200 : 400, r);
    });
    return;
  }

  // 공개: 평가판 신청(이메일 설정 시 더블 옵트인, 없으면 즉시 발급)
  if (req.method === 'POST' && url === '/api/request-trial') {
    if (!rateOk(String(ip))) return send(res, 429, { ok: false, err: '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.' });
    readBody(20000, (body) => {
      let parsed = {};
      try { parsed = JSON.parse(body); } catch { return send(res, 400, { ok: false, err: '잘못된 요청' }); }
      requestTrial(parsed, String(ip))
        .then((r) => send(res, r.ok ? 200 : 400, r))
        .catch(() => send(res, 500, { ok: false, err: '발급 중 오류가 발생했습니다.' }));
    });
    return;
  }

  // 공개: 평가판 이메일 인증 링크(더블 옵트인) → 발급 + HTML 페이지
  if (req.method === 'GET' && url === '/api/verify-trial') {
    let token = '';
    try { token = new URL(req.url, SITE_BASE).searchParams.get('token') || ''; } catch { /* 무시 */ }
    verifyTrialToken(token)
      .then((r) => send(res, 200, trialResultHtml(r), 'text/html; charset=utf-8'))
      .catch(() => send(res, 500, trialResultHtml({ ok: false, err: '발급 중 오류가 발생했습니다.' }), 'text/html; charset=utf-8'));
    return;
  }

  // 관리자 영역
  if (url === '/admin' || url === '/admin/' || url.startsWith('/admin/api/')) {
    if (!checkAuth(req)) return deny(res);
    if (url === '/admin' || url === '/admin/') return send(res, 200, HTML, 'text/html; charset=utf-8');
    if (url === '/admin/api/stats') {
      try { return send(res, 200, computeStats()); } catch (e) { return send(res, 500, { err: String(e).slice(0, 200) }); }
    }
    if (url === '/admin/api/inquiries') return send(res, 200, readInquiries());
    if (url === '/admin/api/trials') return send(res, 200, readTrials().reverse());
    if (url === '/admin/api/visitors') {
      try { return send(res, 200, computeVisitors()); } catch (e) { return send(res, 500, { err: String(e).slice(0, 200) }); }
    }
    if (url === '/admin/api/notify-status') {
      return send(res, 200, {
        slack: !!notifyCfg?.slack?.webhookUrl,
        telegram: !!(notifyCfg?.telegram?.token && notifyCfg?.telegram?.chatId),
      });
    }
    if (url === '/admin/api/notify-test') {
      notify({ type: 'other', company: '[알림 테스트]', email: 'admin', message: '알림 연결 확인' });
      const on = !!(notifyCfg?.slack?.webhookUrl || notifyCfg?.telegram?.token);
      return send(res, 200, { ok: on });
    }
  }
  send(res, 404, { err: 'not found' });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`topgrid admin server on 127.0.0.1:${PORT} (data: ${DATA})`);
});
