# 문서 사이트 배포 (topgrid.platree.com)

> Docusaurus + Storybook 정적 사이트를 자체 서버에 rsync 로 배포한다. **빌드(repo)는 이 세션/CI, 서버 명령(rsync)은 사용자**가 실행한다.

## 호스팅 구성 (참조)
- **URL**: https://topgrid.platree.com
- **서버**: `gedebms` · 공인 IP `49.247.14.212` · Rocky Linux 9.6 · 배포 유저 `topgrid`
- **웹 루트**: `/var/www/topgrid` (nginx ACL `u:nginx:rX` + default ACL 자동 상속 → root 불필요)
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

### 3. 배포 (rsync) — ★사용자 실행 (서버 SSH 접근 필요)
```bash
# repo 루트 기준 (또는 apps/docs 에서 build/ 경로 조정)
rsync -avz --delete apps/docs/build/ topgrid@49.247.14.212:/var/www/topgrid/
```
- `--delete`: 서버에서 build/ 에 없는 파일 제거(클린 동기화). build/ 가 완전한지 먼저 확인.
- default ACL 덕에 권한 자동 → root 불필요, nginx reload 불요(정적 파일).

### 4. 확인
```bash
curl -sI https://topgrid.platree.com/ | head -1            # 200
curl -sI https://topgrid.platree.com/comparison | head -1  # 200
curl -sI https://topgrid.platree.com/storybook/ | head -1  # 200 (storybook 포함 확인)
curl -sI https://topgrid.platree.com/en/ | head -1         # 200 (영문)
```
브라우저: comparison 페이지 수치(✅248/75%)·Storybook 데모 링크 동작 확인.

## 주의
- ★**`build:site` 를 쓸 것**(`build` 는 Docusaurus 만 → `/storybook/` 링크 404). comparison·live-demos 가 `/storybook/` 링크를 가짐.
- TypeDoc 자동 API(`/api`)는 현재 비활성(`docusaurus-plugin-typedoc` 버전 정합 이슈) — 복구 시 `build:site` 산출에 `/api` 부활(P3 항목).
- 서버 인프라(nginx conf·TLS·ACL) 변경은 본 문서 범위 밖 — [[docs-site-hosting]] 메모리 참조.
