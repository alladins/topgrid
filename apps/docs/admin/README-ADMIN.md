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

## 문의 알림 — Slack (권장) / Telegram (선택)

문의 접수 시 **채널·폰으로 즉시 알림**(유형·회사·이메일·도메인·내용+대시보드 링크). 설정된 것만 발송,
둘 다 설정도 가능. 미설정이어도 문의는 항상 저장·대시보드에 뜸(알림은 부가).

### ✅ Slack (권장 — Webhook URL 하나면 끝)
1. https://api.slack.com/apps → **Create New App** → From scratch → 워크스페이스 선택.
2. **Incoming Webhooks** → Activate ON → **Add New Webhook to Workspace** → 알림 받을 채널 선택 →
   **Webhook URL** 복사(`https://hooks.slack.com/services/T.../B.../xxxx`).
3. 서버 설정:
   ```bash
   ssh topgrid@49.247.14.212
   printf '{"slack":{"webhookUrl":"<Webhook URL>"}}' > ~/topgrid-admin/notify.json
   chmod 600 ~/topgrid-admin/notify.json
   pkill -f "node admin-server"; cd ~/topgrid-admin && setsid nohup node admin-server.mjs >> admin.log 2>&1 < /dev/null &
   ```
4. 대시보드 📬 헤더 "알림 **ON** (Slack)" + [테스트 발송] 클릭 → 채널 수신 확인.

### Telegram (선택)
`notify.json` 에 `{"telegram":{"token":"<BotFather 토큰>","chatId":"<chat_id>"}}`. chatId 는
봇과 대화 후 `https://api.telegram.org/bot<토큰>/getUpdates` 의 `chat.id`.
Slack 과 함께 쓰려면 한 파일에 둘 다: `{"slack":{...},"telegram":{...}}`.

- notify.json 없으면 알림 OFF(대시보드로만 확인). 이메일은 SMTP·스팸함 이슈로 미채택.

## 평가판 자동 발급 (POST /api/request-trial)

가격 페이지에서 **평가 유형 + 도메인** 입력 시 30일 Pro 평가키를 **즉시 발급**(저마찰). 전용 서명키만
서버에 두므로 유료 키는 안전(설계: `docs/internal/TRIAL-AUTOISSUE-DESIGN.md`).

```bash
# 평가판 개인키 배포(로컬 keygen --trial 로 생성한 .trial-private.key 를 서버로)
scp scripts/license/.trial-private.key topgrid@49.247.14.212:~/topgrid-admin/trial-signing.key
ssh topgrid@49.247.14.212 'chmod 600 ~/topgrid-admin/trial-signing.key'
# admin-server 재시작(아래 §운영) 후 활성화. 파일 없으면 자동 발급 OFF(문의 폼은 정상).
```

- 발급 이력: `~/topgrid-admin/data/trials.jsonl`(도메인당 30일 1회 판단). 신규 발급 시 Slack/Telegram 알림.
- 가드: honeypot + IP 레이트리밋(시간당 5회) + 도메인당 30일 1회 + 예약 TLD/특수문자 밸리데이션.
- ⚠ `trial-signing.key` 는 유료 키가 **아닌** 전용 저가치 키(유출 시 ≤35일 체험판만 위조). 그래도 600 유지·백업.

### 이메일 더블 옵트인 (권장 — 스팸/가짜 신청 차단)

`~/topgrid-admin/email.json`(600) 이 있으면 **이메일 인증 후에만** 발급된다. 없으면 미검증 자동발급을
막기 위해 신청이 **문의로 접수**된다(키 미발급). 자체 메일서버로 `topgrid@platree.com` 인증 발송(SPF/DKIM 정렬 → 스팸함 회피):

```bash
printf '{"host":"mail.platree.com","port":587,"user":"topgrid@platree.com","pass":"<비번>","from":"topgrid@platree.com","fromName":"topgrid"}' > ~/topgrid-admin/email.json
chmod 600 ~/topgrid-admin/email.json   # 후 admin-server 재시작
```

- 흐름: `POST /api/request-trial` → 인증 링크 메일 발송(pending) → 사용자가 `GET /api/verify-trial?token=…` 클릭 → 발급 + 키 HTML 페이지. 대기 토큰 30분 TTL(메모리, 재시작 시 소멸=재신청).
- port 587=STARTTLS(기본)/465=implicit TLS. admin-server 는 의존성 0 최소 SMTP 클라이언트(AUTH LOGIN) 사용.

## 운영
- 재시작: `ssh topgrid@… 'pkill -f admin-server; cd ~/topgrid-admin && setsid nohup node admin-server.mjs >> admin.log 2>&1 < /dev/null &'`
- 서버 파일 갱신 시: scp 후 재시작.
- 문의 백업: `~/topgrid-admin/data/inquiries.jsonl` (auth.json 과 함께 주기 백업 권장).
- CLI 대안(터미널): `bash apps/docs/stats.sh` — 동일 지표, 소유자 IP 제외 동일 적용.
