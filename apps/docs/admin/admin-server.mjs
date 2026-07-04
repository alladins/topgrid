// topgrid 관리자 대시보드 서버 — 방문 통계(nginx 로그) + 문의 접수/열람.
// 실행: 서버(topgrid 계정)에서 node admin-server.mjs (127.0.0.1:9101 바인드 — 외부 직접 접근 불가,
// nginx 가 /admin/·/api/inquiry 를 HTTPS 로 프록시). 인증: Basic Auth(~/topgrid-admin/auth.json, 600).
// 데이터: ~/topgrid-admin/data/inquiries.jsonl (웹루트 밖 — 직접 노출 불가).
import http from 'node:http';
import { readFileSync, existsSync, appendFileSync, readdirSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';
import { homedir } from 'node:os';

const PORT = 9101;
const HOME = join(homedir(), 'topgrid-admin');
const DATA = join(HOME, 'data');
const AUTH_FILE = join(HOME, 'auth.json');
const INQ_FILE = join(DATA, 'inquiries.jsonl');
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
  return { ok: true };
}
function readInquiries() {
  if (!existsSync(INQ_FILE)) return [];
  return readFileSync(INQ_FILE, 'utf8').split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean).reverse();
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
<h2>방문 (봇·내 IP 제외)</h2><div class="cards" id="cards"></div>
<h2>일자별 고유 방문자 (최근 30일)</h2><table id="daily"></table>
<h2>📬 문의 접수</h2><table id="inq"><tr><th>시각</th><th>유형</th><th>회사/이름</th><th>이메일</th><th>도메인</th><th>내용</th></tr></table>
<h2>페이지 TOP 20</h2><table id="pages"></table>
<h2>/pricing 조회 (최근 30)</h2><table id="pricing"></table>
<h2>외부 유입</h2><table id="ref"></table>
</div><script>
const TYPE_LABEL={trial:'평가',purchase:'구매',enterprise:'Enterprise',other:'기타'};
async function j(u){const r=await fetch(u);return r.json()}
(async()=>{
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
const q=await j('/admin/api/inquiries');
document.getElementById('inq').innerHTML='<tr><th>시각</th><th>유형</th><th>회사/이름</th><th>이메일</th><th>도메인</th><th>내용</th></tr>'+(q.length?q.map(i=>'<tr><td class="muted">'+i.ts.slice(0,16).replace('T',' ')+'</td><td><span class="tag t-'+i.type+'">'+(TYPE_LABEL[i.type]||i.type)+'</span></td><td>'+esc(i.company)+(i.name?' / '+esc(i.name):'')+'</td><td>'+esc(i.email)+'</td><td>'+esc(i.domain)+'</td><td><pre>'+esc(i.message)+'</pre></td></tr>').join(''):'<tr><td colspan="6" class="muted">아직 접수된 문의가 없습니다.</td></tr>');
function esc(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
})();
function esc(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
</script></body></html>`;

// ── HTTP 서버 ──
const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};
http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  const ip = req.headers['x-real-ip'] || req.socket.remoteAddress || '?';

  // 공개: 문의 접수
  if (req.method === 'POST' && url === '/api/inquiry') {
    if (!rateOk(String(ip))) return send(res, 429, { ok: false, err: '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.' });
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 20000) req.destroy(); });
    req.on('end', () => {
      let parsed = {};
      try { parsed = JSON.parse(body); } catch { return send(res, 400, { ok: false, err: '잘못된 요청' }); }
      const r = saveInquiry(parsed, String(ip));
      send(res, r.ok ? 200 : 400, r);
    });
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
  }
  send(res, 404, { err: 'not found' });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`topgrid admin server on 127.0.0.1:${PORT} (data: ${DATA})`);
});
