// 1st-party 방문 비컨 — 정확한 순방문자(UV)/세션/페이지뷰 집계용.
// 익명 방문자 ID(localStorage tg_vid, 랜덤 UUID)·세션 ID(sessionStorage tg_sid)를 부여하고
// 라우트 이동마다 /api/hit 로 전송(admin-server 가 저장·집계). IP·개인정보는 저장하지 않는다.
// ★제외: ①관리자 페이지(/admin/)를 연 적 있는 브라우저(tg_owner) ②자동화 브라우저(webdriver) ③봇(JS 미실행=자연 제외).
export function onRouteDidUpdate({ location, previousLocation }) {
  try {
    if (typeof window === 'undefined') return;
    if (previousLocation && location.pathname === previousLocation.pathname) return;
    if (localStorage.getItem('tg_owner')) return; // 소유자/관리자 브라우저 제외
    if (navigator.webdriver) return; // 자동화 도구 제외

    let vid = localStorage.getItem('tg_vid');
    if (!vid) {
      vid = (crypto.randomUUID && crypto.randomUUID()) || String(Math.random()).slice(2) + Date.now();
      localStorage.setItem('tg_vid', vid);
    }
    let sid = sessionStorage.getItem('tg_sid');
    if (!sid) {
      sid = ((crypto.randomUUID && crypto.randomUUID()) || String(Math.random()).slice(2)).slice(0, 8);
      sessionStorage.setItem('tg_sid', sid);
    }
    const payload = JSON.stringify({
      vid,
      sid,
      path: location.pathname,
      ref: previousLocation ? '' : document.referrer || '', // 유입 리퍼러는 랜딩 hit 에만
      lang: navigator.language || '',
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/hit', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/hit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch {
    /* 분석 실패가 사이트에 영향 주지 않게 무음 */
  }
}
