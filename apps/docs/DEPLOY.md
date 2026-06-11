# 문서 사이트 배포 (topgrid.platree.com)

> Docusaurus + Storybook 정적 사이트를 자체 서버에 업로드한다. **빌드(repo)는 이 세션/CI, 서버 업로드/설치는 사용자**가 실행한다. 절차는 2026-05-31 서버 셋업 history 에서 복원(아래).

## 호스팅 구성
- **URL**: https://topgrid.platree.com · **서버**: `gedebms` / `49.247.14.212` / Rocky Linux 9.6
- **배포 계정**: **`topgrid`** (파일 owner `topgrid:cusapp`, 홈 `/app/topgrid`). 인증 = 비밀번호(로컬에 topgrid SSH 키 없음) → keyless 원하면 로컬 공개키를 서버 `topgrid ~/.ssh/authorized_keys` 에 등록. ★`~/.ssh/config` 의 `gedebms`(=appuser)는 **다른 계정** — docs 배포와 무관(혼동 주의).
- **staging**: `/app/topgrid/www` (= topgrid `~/www`). scp/SFTP 업로드 착지점. `/app` 비표준 경로라 SELinux fcontext 수동 지정됨.
- **웹 루트(nginx 서빙)**: `/var/www/topgrid` (owner topgrid, **nginx ACL `u:nginx:rX` + default ACL 자동 상속** → 신규 파일 권한 자동). SELinux `httpd_sys_content_t`.
- **TLS**: Let's Encrypt webroot(`/var/www/certbot`), 자동갱신 `certbot-renew.timer` + reload hook. 80블록 `/.well-known/acme-challenge/` 보존.

## 빌드 (repo)
```bash
pnpm build                       # 1) 패키지 dist (storybook 스토리가 @topgrid/* 해소 → 선행 필수, 직렬)
cd apps/docs && pnpm build:site  # 2) ★build:site (storybook→static/storybook + docusaurus). build 만 쓰면 /storybook/ 404
# 결과: apps/docs/build/ = index.html(ko) + en/ + storybook/ + assets/ ...
```

## 배포 (사용자 실행) — 원본 절차 = 2단계 (scp staging → 관리자 cp 웹루트)

### 방식 A — 직접 웹루트 (웹루트가 topgrid 소유 + default ACL 이라 가능, 권장)
```bash
# (로컬) rsync 미설치 → scp. build/ top-level dotfile 없음 → * 로 전부 커버
scp -r apps/docs/build/* topgrid@49.247.14.212:/var/www/topgrid/
```
- 신규 파일은 default ACL 로 nginx 읽기 자동. **단, 새 디렉터리(예: `storybook/`)가 추가된 배포면 ACL mask 붕괴(트러블슈팅 A) 예방차원에서 관리자 셸 1회**: `setfacl -R -m u:nginx:rX /var/www/topgrid && setfacl -R -d -m u:nginx:rX /var/www/topgrid && restorecon -RFv /var/www/topgrid`.
- SELinux 403 시 관리자 셸에서 `restorecon -RFv /var/www/topgrid` 1회.
- scp 가 stale 미제거(`--delete` 없음) — 수정-only 배포는 무해(content-hash asset).

### 방식 B — 원본 2단계 (staging 경유, history 그대로)
```bash
# (로컬) staging 으로 업로드
scp -r apps/docs/build/* topgrid@49.247.14.212:/app/topgrid/www/
# (서버, 관리자/root 셸) staging → 웹루트 설치
cp -a /app/topgrid/www/. /var/www/topgrid/
restorecon -Rv /var/www/topgrid
nginx -t && systemctl reload nginx
```

### keyless 활성화 (선택, topgrid 셸에서 1회)
```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo '<로컬 ~/.ssh/id_ed25519.pub 내용>' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 확인
```bash
curl -sI https://topgrid.platree.com/comparison | head -1   # 200 → ✅248/75% 반영
curl -sI https://topgrid.platree.com/storybook/ | head -1   # 200 → storybook 포함
curl -sI https://topgrid.platree.com/en/ | head -1          # 200 → 영문
```

## 트러블슈팅
- **`Permission denied (publickey,...,password)`** — topgrid 인증 실패. 비밀번호 재확인 또는 위 keyless 등록. ★`topgrid@` 가 맞음(appuser 아님).
- **403 — nginx 로그 `"...index.html" is forbidden (13: Permission denied)`** = 파일은 있는데 nginx 못 읽음. 두 레이어 중 하나:
  - **(A) ACL mask 붕괴 (2026-06-11 실제 발생, 가장 흔함)** — 배포 후 새로 생긴 디렉터리(예: `storybook/`)가 mode `0707` 류(group 비트 0)로 만들어지면, named ACL(`user:nginx:r-x`)이 있어도 **access `mask::---`** 로 깎여 `#effective:---` → nginx traverse 불가. `getfacl <dir>` 에서 `mask::---` + `#effective:---` 확인. **해결 = setfacl 재적용**(mask 자동 재계산): `setfacl -R -m u:nginx:rX /var/www/topgrid && setfacl -R -d -m u:nginx:rX /var/www/topgrid`. (★03:38 의 초기 setfacl 은 그때 존재한 파일만 덮음 → *이후* 배포분은 매번 재적용 필요. default ACL 은 권한은 상속해도 `cp -a`/이상 mode 로 만들어진 dir 의 access mask 붕괴는 막지 못함.)
  - **(B) SELinux 컨텍스트** — `restorecon -RFv /var/www/topgrid`. (출력이 비면 SELinux 는 무죄 → (A) 의심.) staging(`/app/...`)은 fcontext 수동 필요(이미 설정됨).
  - 진단: `ls -laZ <작동파일> <막힌파일>` + `getfacl <dir>` + `namei -l <막힌파일>`(ACL 있으면 `ls`/`namei` group 자리는 mask 표시 — `drwx---rwx` 의 `---` 가 곧 mask).
- **`rsync: command not found`** — 로컬에 rsync 없음. scp 사용(이 문서 기준).

## 주의
- ★**`build:site`** 사용(`build` 는 Docusaurus 만 → `/storybook/` 404). comparison·live-demos 가 `/storybook/` 링크 보유.
- TypeDoc 자동 API(`/api`)는 현재 비활성(버전 정합) — P3 항목.
- 인프라 상세 = [[docs-site-hosting]] 메모리.
