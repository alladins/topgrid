# 문서 사이트 배포 (topgrid.platree.com)

> Docusaurus + Storybook 정적 사이트를 자체 서버에 업로드한다. **빌드(repo)는 이 세션/CI, 서버 업로드/설치는 사용자**가 실행한다. 절차는 2026-05-31 서버 셋업 history 에서 복원(아래).

## 호스팅 구성
- **URL**: https://topgrid.platree.com · **서버**: `gedebms` / `49.247.14.212` / Rocky Linux 9.6
- **배포 계정**: **`topgrid`** (파일 owner `topgrid:cusapp`, 홈 `/app/topgrid`). 인증 = 비밀번호(로컬에 topgrid SSH 키 없음) → keyless 원하면 로컬 공개키를 서버 `topgrid ~/.ssh/authorized_keys` 에 등록. ★`~/.ssh/config` 의 `gedebms`(=appuser)는 **다른 계정** — docs 배포와 무관(혼동 주의).
- **staging**: `/app/topgrid/www` (= topgrid `~/www`). scp/SFTP 업로드 착지점. `/app` 비표준 경로라 SELinux fcontext 수동 지정됨.
- **웹 루트(nginx 서빙)**: `/var/www/topgrid` (owner topgrid). nginx 는 **평범한 권한 `dir 755 / file 644`(= other r-x/r--)로 읽는다 — ACL 사용 안 함**. SELinux `httpd_sys_content_t`. ★**ACL 금지**(2026-06-11 교훈): topgrid umask 가 `070`→신규 dir `0707`(group 0)+named ACL 조합 시 access `mask::---` 로 붕괴해 nginx 차단이 *반복*됨. ACL 제거 후 755/644 면 nginx 가 other 로 읽어 안정적. → topgrid `~/.bashrc` 에 `umask 022` 설정됨.
- **TLS**: Let's Encrypt webroot(`/var/www/certbot`), 자동갱신 `certbot-renew.timer` + reload hook. 80블록 `/.well-known/acme-challenge/` 보존.

## 빌드 (repo)
```bash
pnpm build                       # 1) 패키지 dist (storybook 스토리가 @topgrid/* 해소 → 선행 필수, 직렬)
cd apps/docs && pnpm build:site  # 2) ★build:site (storybook→static/storybook + docusaurus). build 만 쓰면 /storybook/ 404
# 결과: apps/docs/build/ = index.html(ko) + en/ + storybook/ + assets/ ...
```

## 배포 (사용자 실행) — 원본 절차 = 2단계 (scp staging → 관리자 cp 웹루트)

### 방식 A — 직접 웹루트 scp + 권한 정규화 (★권장, 2026-06-11 검증)
```bash
# 1) (로컬) rsync 미설치 → scp. build/ top-level dotfile 없음 → * 로 전부 커버
scp -r apps/docs/build/* topgrid@49.247.14.212:/var/www/topgrid/

# 2) (서버, 관리자/root 셸) 권한 정규화 — ★매 배포 마지막 단계 필수
setfacl -Rb /var/www/topgrid                          # ACL 전부 제거 (mask 붕괴 원천 차단)
find /var/www/topgrid -type d -exec chmod 755 {} \;   # 디렉터리 traverse
find /var/www/topgrid -type f -exec chmod 644 {} \;   # 파일 읽기
restorecon -RFv /var/www/topgrid                      # SELinux (대개 no-op)
```
- ★**ACL 쓰지 말 것**(`setfacl -Rb` 로 제거). 755/644 면 nginx 가 other 로 읽음 → mask 붕괴 재발 불가(2026-06-11 확정: chmod 만으로는 ACL 있으면 안 풀렸고, ACL 제거 후 200).
- chmod/setfacl 은 owner(topgrid)로도 가능하나, 관리자 셸이면 확실.
- scp 가 stale 미제거(`--delete` 없음) — 페이지 형태(평면↔디렉터리)가 바뀐 배포는 stale 충돌 가능 → 의심 시 `rm -rf /var/www/topgrid/* ` 후 재업로드(클린).

### ⛔ 방식 B (staging → `cp -a`) — 비권장
```bash
# cp -a 는 staging 의 깨진 권한(0707/mask---)을 웹루트에 그대로 덮어 403 을 *재발*시킴 (2026-06-11 반복 원인).
# 부득이 사용 시 위 「방식 A 2)」 권한 정규화를 cp 직후 반드시 실행.
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
- **403 Forbidden (순수 nginx 페이지) — `"...index.html" is forbidden (13: Permission denied)`** = 파일은 있는데 nginx 못 읽음. **이 서버의 단골 원인 = ACL mask 붕괴**(umask 070 → dir `0707` → named ACL access `mask::---` → nginx 차단). ★**확정 해결(2026-06-11): ACL 제거 + 755/644**:
  ```bash
  setfacl -Rb /var/www/topgrid
  find /var/www/topgrid -type d -exec chmod 755 {} \;
  find /var/www/topgrid -type f -exec chmod 644 {} \;
  restorecon -RFv /var/www/topgrid
  sudo -u nginx cat /var/www/topgrid/storybook/index.html >/dev/null && echo OK   # 검증
  ```
  ★**주의: `chmod` 만으로는 안 풀린다** — ACL 이 남아 있으면 mask 가 다시 붕괴. 반드시 `setfacl -Rb`(ACL 제거)를 **먼저**. (`getfacl <dir>` 에 `mask::---`+`#effective:---` 보이면 이 케이스. `namei -l` 의 `drwx---rwx` 가운데 `---` 가 곧 mask.)
- **403 — 로그가 `directory index of "..." is forbidden`** = 권한 아님, nginx 가 index 못 찾음(autoindex/index 디렉티브 설정) → vhost `try_files $uri $uri/ ...` + `index index.html` 확인.
- **SELinux 403** — `restorecon -RFv /var/www/topgrid`. (출력이 비면 SELinux 무죄.)
- **Docusaurus 404 페이지(스타일 있는 "페이지를 찾을 수 없습니다")** = 권한 OK 인데 해당 라우트 파일 부재/형태 불일치. 빌드는 디렉터리 형태(`foo/index.html`)이므로 nginx `try_files` 에 `$uri/` 폴백 필요. stale 평면 `.html` 잔존 시 클린 재배포.
- **`rsync: command not found`** — 로컬에 rsync 없음. scp 사용(이 문서 기준).

## 주의
- ★**`build:site`** 사용(`build` 는 Docusaurus 만 → `/storybook/` 404). comparison·live-demos 가 `/storybook/` 링크 보유.
- TypeDoc 자동 API(`/api`)는 현재 비활성(버전 정합) — P3 항목.
- 인프라 상세 = [[docs-site-hosting]] 메모리.
