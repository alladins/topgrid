# 문서 사이트 배포 (topgrid.platree.com)

> Docusaurus + Storybook 정적 사이트를 자체 서버에 rsync 로 배포한다. **빌드(repo)는 이 세션/CI, 서버 명령(rsync)은 사용자**가 실행한다.

## 호스팅 구성 (참조)
- **URL**: https://topgrid.platree.com
- **서버**: `gedebms` · 공인 IP `49.247.14.212` · Rocky Linux 9.6
- **★SSH 접속**: `~/.ssh/config` 의 `Host gedebms` 별칭 사용 = **`appuser`@49.247.14.212**, key `~/.ssh/server_appuser_key`. 명령에 `gedebms:` 를 쓰면 유저·키 자동 적용. (웹 루트 파일 owner 는 `topgrid` 일 수 있으나 **SSH 로그인 유저는 appuser**.) ★전제: `server_appuser_key` 가 `~/.ssh/` 에 있어야 함 — 없으면 scp/rsync/ssh 모두 `Permission denied (publickey)`.
- **웹 루트**: `/var/www/topgrid` (nginx ACL `u:nginx:rX` + default ACL 자동 상속 → root 불필요; appuser 쓰기 권한 = 서버 ACL 의존, 실패 시 권한 확인)
- **nginx**: `/etc/nginx/conf.d/topgrid.conf` (CSP·rate-limit·하드닝)
- **TLS**: Let's Encrypt, certbot webroot(`/var/www/certbot`), 자동갱신 `certbot-renew.timer` + `renew_hook = systemctl reload nginx`. 80블록 `location /.well-known/acme-challenge/` 는 갱신 핵심 — 건드리지 말 것.
- **Docusaurus**: `baseUrl:'/'`, `routeBasePath:'/'`(docs 가 루트), 랜딩=`docs/intro.md`(`slug:/`). i18n ko(기본)+en(`/en/`).

## 배포 절차

### 1. 패키지 빌드 (storybook 스토리가 `@topgrid/*` dist 를 해소하므로 선행 필수)
```bash
# repo 루트에서 — 직렬 빌드(DTS race 회피, build script 가 보장)
pnpm build
```

### 2. 사이트 빌드 — ★`build:site` (Storybook + Docusaurus). `build` 만 쓰면 `/storybook/` 가 404
```bash
cd apps/docs
pnpm build:site
# = storybook build -o static/storybook && docusaurus build
# 결과: apps/docs/build/ = index.html(ko) + en/ + storybook/ + assets/ ...
```
빌드 검증(선택): `apps/docs/build/index.html`·`build/en/index.html`·`build/storybook/index.html` 존재 확인.

### 3. 배포 — ★사용자 실행 (서버 SSH 접근 필요)

**scp (사용)** — `build/` 의 전 항목을 웹 루트로 복사(build/ 에 top-level dotfile 없음 → `*` 로 전부 커버):
```bash
scp -r apps/docs/build/* gedebms:/var/www/topgrid/   # gedebms 별칭 = appuser@49.247.14.212 + key (~/.ssh/config)
```
- ★scp 는 `--delete` 가 없어 **서버의 stale 파일을 지우지 않는다**. 페이지를 *수정*만 한 배포(파일명 동일 HTML 덮어쓰기 + content-hash asset 신규)는 무해. 페이지를 *삭제*했거나 완전 클린 동기화가 필요하면 아래 rsync 또는 사전 정리 사용.
- default ACL 덕에 권한 자동 → root 불필요, nginx reload 불요(정적 파일).

**rsync (대안, 클린 동기화)** — stale 제거 포함:
```bash
rsync -avz --delete apps/docs/build/ gedebms:/var/www/topgrid/   # gedebms = appuser@... + key
```

### 4. 확인
```bash
curl -sI https://topgrid.platree.com/ | head -1            # 200
curl -sI https://topgrid.platree.com/comparison | head -1  # 200
curl -sI https://topgrid.platree.com/storybook/ | head -1  # 200 (storybook 포함 확인)
curl -sI https://topgrid.platree.com/en/ | head -1         # 200 (영문)
```
브라우저: comparison 페이지 수치(✅248/75%)·Storybook 데모 링크 동작 확인.

## 트러블슈팅
- **`Permission denied (publickey)` / `no such identity: server_appuser_key`** — 배포 머신에 `~/.ssh/server_appuser_key` 가 없음. scp·rsync·ssh 모두 실패. 해결: (a) 키가 있는 머신에서 배포, 또는 (b) `server_appuser_key` 를 `~/.ssh/` 에 복원(권한 600), 또는 (c) 새 키 발급 후 서버 appuser `~/.ssh/authorized_keys` 에 공개키 등록(기존 접근 경로 필요). 연결 테스트: `ssh -o BatchMode=yes gedebms whoami`.
- **목적지 쓰기 거부** — appuser 가 `/var/www/topgrid` 에 쓰기 불가하면 서버 ACL(`setfacl -m u:appuser:rwx ...`) 또는 owner/sudo 확인.

## 주의
- ★**`build:site` 를 쓸 것**(`build` 는 Docusaurus 만 → `/storybook/` 링크 404). comparison·live-demos 가 `/storybook/` 링크를 가짐.
- TypeDoc 자동 API(`/api`)는 현재 비활성(`docusaurus-plugin-typedoc` 버전 정합 이슈) — 복구 시 `build:site` 산출에 `/api` 부활(P3 항목).
- 서버 인프라(nginx conf·TLS·ACL) 변경은 본 문서 범위 밖 — [[docs-site-hosting]] 메모리 참조.
