# tw-grid → TWGRID 분리 작업 — 세션 핸드오프 (2026-05-30)

> **이 파일의 목적**: 이전 세션 (`D:\project\topvel_project\TOMIS`) 에서 진행한 tw-grid → TWGRID 분리 작업을 새 세션에서 정확히 이어받기 위한 컨텍스트.
> **새 세션 시작 위치 권장**: `D:\project\platree_project\TWGRID` (이 디렉토리)
> **이전 세션 transcript 위치**: `C:\Users\SweetHome\.claude\projects\D--project-topvel-project-TOMIS\`

---

## 진행 상태 (27 체크포인트 중 12 완료, publish 직전 막힘)

| 단계 | 항목 | 상태 |
|---|---|---|
| 0-a | npm whoami → `travia71` | ✅ |
| 0-b | npm org `topgrid` 생성 (web) → owner | ✅ |
| 0-c | TOMIS freeze commit `7f9bcc87` (307 파일) | ✅ |
| 1-a | `git clone alladins/topgrid.git → TWGRID` | ✅ |
| 1-b | pnpm install (31.7s) + build (13/13 dist) + typecheck (13/13) | ✅ |
| 2-a | `.claude/tw-grid/` 복사 551/551 파일 | ✅ |
| 2-b | `.claude/commands/tw-grid*.md` 7/7 | ✅ |
| 2-c | `.claude/policies/_shared/` 7/7 | ✅ |
| 2-d | `state.json` monorepoRoot 갱신 (TOMIS → TWGRID) | ✅ |
| 3 | PR #1 (`feat/integrate-harness`) merge → main `712e71f` | ✅ |
| 4 사전 | 9 Pro/meta 패키지 `private:true` 제거 + publishConfig 추가 → main `48aaee9` | ✅ |
| **4 publish** | **13 패키지 npm publish** | ⏸ **막힘 — 토큰 재발급 대기** |
| 5-a | TOMIS `tw-framework-front` 13 패키지 `pnpm add` | ⬜ |
| 5-b | TOMIS `vite.config.ts` alias 13개 제거 (line 18~30) | ⬜ |
| 5-c | TOMIS `tsconfig.app.json` paths 6개 제거 (line 23~28) | ⬜ |
| 5-d | TOMIS `@tomis/grid-*` → `@topgrid/grid-*` 31 파일 import 일괄 치환 | ⬜ |
| 5-e | TOMIS `tsc --noEmit` + `vite build` + `pnpm dev` 그리드 페이지 검증 | ⬜ |
| 6-a | TOMIS `git rm -r .claude/tw-grid .claude/commands/tw-grid*.md` + commit | ⬜ |
| 6-b | `Remove-Item -Recurse D:\project\topvel_project\topvel-grid-monorepo` | ⬜ |
| 7 | 최종 검증 7건 (build, npm view, tsc, dev, grep, install 외부 검증) | ⬜ |
| 8 | TWGRID 전용 MEMORY.md 초기화 + TOMIS memory 의 tw-grid 항목 정리 | ⬜ |

---

## ⚠️ 막힌 지점 — npm publish 토큰 (4단계)

### 무엇이 막혔는가

`pnpm --filter "@topgrid/*" publish --access public --no-git-checks` 실행 시:

```
npm error 403 Forbidden — Two-factor authentication or granular access token
with bypass 2fa enabled is required to publish packages.
```

### 원인 (2026-05-30 시점 npm 정책)

이전 세션에서 처음 가이드한 **"Classic Token → Automation"** 은 더 이상 존재하지 않습니다.
- **2025-11-19**: Classic Token 생성 비활성화
- **2025-12-09**: 모든 기존 Classic Token revoke
- **현재**: **Granular Access Token 만 사용 가능** + **"Bypass 2FA" 체크박스 활성 필수**

사용자가 처음 발급한 Granular Token 은 Bypass 2FA 체크박스가 꺼진 상태여서 publish 가 403.

### 해결 — Granular Token 재발급 (Bypass 2FA ON)

1. **접속**: https://www.npmjs.com/settings/travia71/tokens → Generate New Token
2. **항목**:
   - **Token name**: `topgrid-publish-2026`
   - **Expiration**: 최대 **90일** (write 토큰 강제 cap, 2025-11 정책)
   - ⭐ **"Allow this token to bypass two-factor authentication"** 체크 ON ← **핵심**
   - **Packages and scopes** → "Read and write" → `@topgrid` scope 추가
3. **Generate Token** → 즉시 복사 (재표시 불가)

### `.npmrc` 갱신

```powershell
$newToken = "<NEW_TOKEN>"
$path = "$env:USERPROFILE\.npmrc"
$enc = [Text.UTF8Encoding]::new($false)
$lines = [IO.File]::ReadAllLines($path, $enc) | Where-Object { $_ -notmatch '//registry.npmjs.org/:_authToken=' }
$lines += "//registry.npmjs.org/:_authToken=$newToken"
[IO.File]::WriteAllLines($path, $lines, $enc)
npm whoami   # → travia71
```

### publish 명령

```powershell
cd D:\project\platree_project\TWGRID
pnpm --filter "@topgrid/*" publish --access public --no-git-checks
```

기대: 13/13 패키지 publish 성공.

검증:
```powershell
foreach ($p in 'grid-core','grid-renderers','grid-features','grid-export','grid-license','grid-pro-tracking','grid-pro-range','grid-pro-datamap','grid-pro-merging','grid-pro-header','grid-pro-agg','grid-pro-master','grid') { Write-Output "$p: $(npm view @topgrid/$p version 2>&1 | Select-Object -First 1)" }
```

---

## 핵심 결정사항 (이전 세션 사용자 응답)

| 결정 | 내용 |
|---|---|
| TOMIS-grid 관계 | npm publish + dep 으로 외부 라이브러리화 (alias 제거). "다른 외부 프로젝트와 똑같이" |
| 하네스 처리 | 통째 이동 (TWGRID), TOMIS 의 `_shared/` 는 복사 (tw-mail/tw-harness 가 계속 사용) |
| 디렉토리 레이아웃 | TWGRID 자체가 monorepo git root |
| Pro 9 패키지 publish | **모두 public publish** (판매 의도). private:true 제거 완료 |
| PR 정책 | feat 브랜치 + PR (이전 PR #1 squash merge 완료) |
| 새 세션 위치 | TWGRID 권장 (publish 부터 진행) |

---

## 위치 지도

```
D:\project\topvel_project\
├── TOMIS\                               (ERP, 메인 프로젝트 — 5단계 작업처)
│   ├── tw-framework-front\              (그리드 소비처, alias 제거 + import 치환 대상)
│   └── .claude\
│       ├── tw-grid\                     ← 6-a 단계에서 git rm 예정
│       ├── commands\tw-grid*.md         ← 6-a 단계에서 git rm 예정
│       ├── policies\_shared\            ← 남김 (tw-mail/tw-harness 사용)
│       ├── tw-mail\, tw-harness\        ← 남김
│       └── memory\twgrid-extraction-handoff-20260530.md  (TOMIS 측 핸드오프)
└── topvel-grid-monorepo\                ← 6-b 단계에서 Remove-Item 예정 (별도 git repo 라 TOMIS history 영향 X)

D:\project\platree_project\TWGRID\        (새 grid 단독 제품 위치, GitHub alladins/topgrid)
├── packages/                            (13 패키지 — grid + grid-core + grid-renderers + grid-features + grid-export + grid-license + grid-pro-{agg,datamap,header,master,merging,range,tracking})
├── apps/docs/                           (Docusaurus, customCss 설정 이슈로 build 미통과 — publish 무관)
├── .claude/                             (하네스 + commands + _shared SSoT 통합 완료)
├── .changeset/                          (3 changesets 보류 중)
└── HANDOFF-PUBLISH-RESUME.md            ← 이 파일
```

---

## TOMIS 측 5단계 상세 (publish 완료 후 진행)

### 5-a: pnpm add 13 패키지

```powershell
cd D:\project\topvel_project\TOMIS\tw-framework-front
pnpm add @topgrid/grid @topgrid/grid-core @topgrid/grid-renderers @topgrid/grid-features @topgrid/grid-export @topgrid/grid-license @topgrid/grid-pro-tracking @topgrid/grid-pro-range @topgrid/grid-pro-datamap @topgrid/grid-pro-merging @topgrid/grid-pro-header @topgrid/grid-pro-agg @topgrid/grid-pro-master
```

### 5-b: vite.config.ts alias 제거

`D:\project\topvel_project\TOMIS\tw-framework-front\vite.config.ts` line 18~30 의 `@tomis/grid-*` alias 13개 모두 제거.

### 5-c: tsconfig.app.json paths 제거

`D:\project\topvel_project\TOMIS\tw-framework-front\tsconfig.app.json` line 23~28 의 paths 항목 6개 제거.

### 5-d: import 치환 (31 파일, UTF-8 보존 의무 — 교훈 #32)

```powershell
$files = Get-ChildItem 'D:\project\topvel_project\TOMIS\tw-framework-front\src' -Recurse -Include *.ts,*.tsx
foreach ($f in $files) {
  $enc = [Text.UTF8Encoding]::new($false)
  $c = [IO.File]::ReadAllText($f.FullName, $enc)
  $new = $c -replace '@tomis/grid-', '@topgrid/grid-' -replace "'@tomis/grid'", "'@topgrid/grid'" -replace '"@tomis/grid"', '"@topgrid/grid"'
  if ($new -ne $c) { [IO.File]::WriteAllText($f.FullName, $new, $enc); Write-Host $f.FullName }
}
```

검증: `Grep '@tomis/grid-' in tw-framework-front/src` → 0 hit 기대.

### 5-e: 검증

```powershell
cd D:\project\topvel_project\TOMIS\tw-framework-front
pnpm tsc --noEmit              # 0 error
pnpm vite build                # 빌드 성공
pnpm dev                       # 브라우저 → SlipListPage 등 그리드 페이지 1-2개 실제 클릭 확인
```

**5-e 통과해야 6단계 (파괴적) 진행 가능.**

---

## TOMIS 측 6단계 (파괴적 — 5단계 통과 후만)

```powershell
cd D:\project\topvel_project\TOMIS
git rm -r .claude/tw-grid
git rm .claude/commands/tw-grid*.md
git commit -m "chore(tw-grid): remove harness — extracted to TWGRID (alladins/topgrid)"
# policies/_shared 는 tw-mail/tw-harness 가 계속 쓰므로 남김

# 원본 monorepo 디렉토리 제거 (별도 git repo 이므로 TOMIS history 영향 X)
Remove-Item -Recurse -Force D:\project\topvel_project\topvel-grid-monorepo
```

---

## 환경/도구 사전 점검 (새 세션 시작 시)

| 확인 | 명령 | 기대 |
|---|---|---|
| node | `node --version` | v22.14.0 |
| pnpm | `pnpm --version` | 8.15.0 |
| npm 로그인 | `npm whoami` | travia71 (토큰 인증) |
| TWGRID HEAD | `git log --oneline -1` in TWGRID | `48aaee9` |
| TWGRID build 상태 | dist 13/13 존재 | ✅ (재build 불필요) |

---

## 참고 — 이전 세션 advisor 검증으로 잡힌 함정

1. **순서 절대 준수**: clone → harness 이전 → publish → TOMIS 전환 → 검증 → 원본 제거 (마지막 단계 전까지 rollback 가능)
2. **alias 단순 갱신 X, 제거**: "외부 라이브러리와 똑같이" 의도라 alias 13개 제거 + dep 등재 + import 치환
3. **TOMIS 미커밋 freeze**: `7f9bcc87` commit 으로 audit trail 보존 (완료)
4. **_shared SSoT 복사**: 이동 X (TOMIS 의 tw-mail/tw-harness 가 의존)
5. **state.json monorepoRoot 만 runtime 영향**: 그 외 spec/artifact 안 historical 경로는 audit trail 로 보존

---

## 작업 재개 시 첫 3 명령

```powershell
# 1) 환경 확인
node --version; pnpm --version; npm whoami; cd D:\project\platree_project\TWGRID; git log --oneline -1

# 2) (사용자) Granular Token 재발급 — "Bypass 2FA" 체크 ON — .npmrc 갱신

# 3) publish
pnpm --filter "@topgrid/*" publish --access public --no-git-checks
```

publish 성공 → 즉시 검증 → TOMIS 5단계로 진행.
