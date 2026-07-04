# topgrid 관리자 대시보드 (admin-server)

방문 통계 + 가격 페이지 문의 폼 접수/열람. **방문 지표는 2계층**:

| 계층 | 원천 | 지표 | 정확도 |
|---|---|---|---|
| ✅ **비컨(정확)** | 1st-party JS(`src/clientModules/beacon.js`) → `POST /api/hit` | **순방문자(UV)**·세션·페이지뷰 | 방문자 단위 정확(익명 ID). 봇=JS 미실행이라 자연 제외 |
| 참고(로그) | nginx 로그 파싱 | IP 단위 추정·봇 감시·과거 데이터 | NAT/동적IP 한계 — 참고용 |

**소유자 제외 3중**: ①소유자 IP(사무실 183.100.140.45·집 162.120.184.41) 서버측 제외 ②**관리자
페이지(/admin/)를 한 번이라도 연 브라우저는 자동 제외**(localStorage `tg_owner`) ③자동화 브라우저(webdriver) 제외.
→ 새 기기/브라우저를 쓰기 시작하면 그 브라우저로 /admin/ 을 한 번 열어주면 됨.
비컨은 IP·개인정보를 저장하지 않음(익명 랜덤 ID·경로·리퍼러·언어만).

## 접속
- URL: **https://topgrid.platree.com/admin/** (nginx 프록시 필요 — 아래 §설치 3)
- 인증: Basic Auth — 계정 `admin`, 비밀번호는 서버 `~/topgrid-admin/auth.json`(600) 참조.
- 문의 폼: 가격 페이지(/pricing) 하단 → `POST /api/inquiry` → 서버 `~/topgrid-admin/data/inquiries.jsonl` 저장.
  폼 백엔드가 죽어 있으면 방문자 브라우저가 자동으로 mailto 폴백(문의 유실 없음).

## 아키텍처
- `admin-server.mjs` — 의존성 0 단일 노드 파일. **127.0.0.1:9101 바인드**(외부 직접 접근 불가, nginx 만 통과).
- 통계는 요청 시 nginx 로그를 파싱(5분 캐시). 소유자 IP(사무실 183.100.140.45·집 162.120.184.41) 제외.
- 문의 저장은 웹루트 밖(JSONL) — 정적 서빙으로 노출 불가. honeypot + IP당 5회/시 rate limit.

## 설치 (재구축 시)
1. 업로드·기동 (topgrid 계정):
   ```bash
   scp apps/docs/admin/admin-server.mjs topgrid@49.247.14.212:~/topgrid-admin/
   ssh topgrid@49.247.14.212
   mkdir -p ~/topgrid-admin/data
   printf '{"user":"admin","pass":"<비밀번호>"}' > ~/topgrid-admin/auth.json && chmod 600 ~/topgrid-admin/auth.json
   cd ~/topgrid-admin && setsid nohup node admin-server.mjs >> admin.log 2>&1 < /dev/null &
   ```
2. 재부팅 자동시작(적용됨): `crontab -l` 에 `@reboot … admin-server.mjs …` 존재 확인.
3. **nginx 프록시(root 1회)** — `/etc/nginx/conf.d/topgrid.conf` 의 **443 server 블록 안**에 추가:
   ```nginx
   location /admin/ { proxy_pass http://127.0.0.1:9101; proxy_set_header X-Real-IP $remote_addr; }
   location /api/   { proxy_pass http://127.0.0.1:9101; proxy_set_header X-Real-IP $remote_addr; }
   ```
   (`/api/` 프리픽스가 `/api/inquiry`(문의)와 `/api/hit`(비컨)을 함께 커버)
   후 `nginx -t && systemctl reload nginx`.

## 운영
- 재시작: `ssh topgrid@… 'pkill -f admin-server; cd ~/topgrid-admin && setsid nohup node admin-server.mjs >> admin.log 2>&1 < /dev/null &'`
- 서버 파일 갱신 시: scp 후 재시작.
- 문의 백업: `~/topgrid-admin/data/inquiries.jsonl` (auth.json 과 함께 주기 백업 권장).
- CLI 대안(터미널): `bash apps/docs/stats.sh` — 동일 지표, 소유자 IP 제외 동일 적용.
