# G-001 Specification — pnpm workspace + 13 패키지 + apps/docs 디렉토리 스캐폴딩

**Module**: MOD-GRID-00 (모노레포 스캐폴딩 + 패키지 분할 + size-limit + Changesets)  
**Goal**: G-001  
**Area**: monorepo  
**Phase**: infra  
**Priority**: P0  
**migrationImpact**: low  
**threshold**: 90  
**spec 작성일**: 2026-05-13  
**spec 버전**: v1.0 (첫 시도)

---

## Section 1: 참조 추적

### L0: 현 구현 (tw-framework-front 단일 패키지)

**파일**: `D:/project/topvel_project/TOMIS/tw-framework-front/package.json`  
**직접 Read 확인**: 2026-05-13

현 상태 — 단일 패키지 (`"name": "tw-framework-front"`, `"private": true`, `"version": "0.0.0"`).  
`@tanstack/react-table: "^8.21.3"`, `@tanstack/react-virtual: "^3.13.24"`, `react: "^19.1.0"`, `xlsx: "^0.18.5"` 등 모든 그리드 의존성이 단일 package.json에 집중.

`"현 구현 분리 없음"` — 단일 패키지에서 monorepo로의 분리가 이 Goal의 사전 전제.

### L1: canonical-modules.json (G-001 관련 항목)

**파일**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/canonical-modules.json`  
**직접 Read 확인**: 2026-05-13

```json
byPackageTarget (12 packages + apps/docs + root):
  packages/grid-core, packages/grid-renderers, packages/grid-export,
  packages/grid-features, packages/grid-pro-tracking, packages/grid-pro-range,
  packages/grid-pro-datamap, packages/grid-pro-merging, packages/grid-pro-header,
  packages/grid-pro-agg, packages/grid-pro-master, packages/grid-license,
  apps/docs, root
```

**중요**: `canonical-modules.json` byPackageTarget에는 12개 named packages가 명시됨.  
AC-002에서 요구하는 13개 = byPackageTarget 12개 + **메타 패키지 `@tomis/grid`** (goal이 별도 도입).  
`@tomis/grid`는 pro+MIT 패키지를 aggregate하는 facade 패키지 — byPackageTarget 표 외에 G-001 AC-002에서 명시적으로 추가됨. 이 discrepancy는 의도적.

**MOD-GRID-00 expectedFeatures (G-001 범위 only)**:
- F-00-01: `pnpm workspaces 설정` (P0) — 이 Goal 범위
- F-00-02: `packages/grid-* 13개 + apps/docs 폴더 생성` (P0) — 이 Goal 범위

**G-001 범위 외 (별도 Goal)**:
- F-00-03 size-limit, F-00-04 Changesets, F-00-05 tsup/vite 빌드,
- F-00-06 peerDependencies 실제 선언, F-00-07 tsconfig.base.json,
- F-00-08 ESLint flat config, F-00-09 tw-framework-front alias (G-004)

### L2: (해당 없음 — 신규 인프라)

신규 monorepo 구조 생성 — 기존 구현 없음. "현 구현 없음" 명시.

### L3: 의존 모듈 (이 스캐폴딩 위에 빌드됨)

- MOD-GRID-01~16 + MOD-GRID-99-A/B 전체 (`canonical-modules.json`의 `dependsOn: ["MOD-GRID-00"]` 명시)
- `affectedUsageFiles: []` (L3 사용처 0개)

### R-A: AG Grid 패키지 분리 패턴 (참조용 — 코드 차용 X)

AG Grid는 `ag-grid-community` (MIT core) + `ag-grid-react` (React wrapper) + `ag-grid-enterprise` (Pro EULA) 로 분리.  
동일 패턴: MIT 패키지와 Pro 패키지를 별도 npm 패키지로 분리, 메타 패키지(`ag-grid-enterprise`)에서 전체 재export.  
C-7 준수: 이 Goal에서 AG Grid 도입 없음 — 패턴 참조만.

### R-W: (해당 없음)

Wijmo는 workspace 구조와 무관. N/A.

### migrationImpact: low (사유)

외부 디렉토리 (`topvel-grid-monorepo`) 신규 생성. TOMIS 기존 코드베이스(`tw-framework-front`, `tvcom_back`) 파일 **변경 없음**. TOMIS 빌드 영향 0.

---

## Section 2: API 계약

### 2.1 패키지 이름 매핑 표 (13개 + apps/docs)

| npm 패키지명 | 디렉토리 | licenseTier | 역할 |
|-------------|---------|------------|------|
| `@tomis/grid-core` | `packages/grid-core` | MIT | TanStack Table 추상화 wrapper + useGridState |
| `@tomis/grid-renderers` | `packages/grid-renderers` | MIT | 셀 렌더러 (Button/Badge/Check/Link/Number/Date/Icon) |
| `@tomis/grid-export` | `packages/grid-export` | MIT | Excel/PDF/CSV export |
| `@tomis/grid-features` | `packages/grid-features` | MIT | 컬럼 재정렬 + 다중정렬 + 필터UI |
| `@tomis/grid-pro-tracking` | `packages/grid-pro-tracking` | Pro EULA | ChangeTracking + Mapping + Validator |
| `@tomis/grid-pro-range` | `packages/grid-pro-range` | Pro EULA | Cell Range Selection + Drag-fill + Clipboard |
| `@tomis/grid-pro-datamap` | `packages/grid-pro-datamap` | Pro EULA | DataMap (foreign key display) |
| `@tomis/grid-pro-merging` | `packages/grid-pro-merging` | Pro EULA | Cell Merging (rowSpan) |
| `@tomis/grid-pro-header` | `packages/grid-pro-header` | Pro EULA | Multi-row Header (Column Groups) |
| `@tomis/grid-pro-agg` | `packages/grid-pro-agg` | Pro EULA | Aggregation (group footer) |
| `@tomis/grid-pro-master` | `packages/grid-pro-master` | Pro EULA | Master-Detail + TreeGrid + Context Menu |
| `@tomis/grid-license` | `packages/grid-license` | Pro EULA | Pro 라이선스 검증 런타임 |
| `@tomis/grid` | `packages/grid` | Pro EULA (Pro 포함) | 메타 패키지 — 전 패키지 aggregate facade |
| (docs 앱) | `apps/docs` | MIT / UNLICENSED | Docusaurus/Storybook 문서 앱 (non-npm) |

**총계**: 13 npm 패키지 + 1 docs 앱 = 14 디렉토리

### 2.2 각 package.json 초기 필드 스키마

**MIT 패키지 (grid-core, grid-renderers, grid-export, grid-features)**:
```json
{
  "name": "@tomis/grid-core",
  "version": "0.0.0",
  "type": "module",
  "license": "MIT",
  "main": "",
  "module": "",
  "types": "",
  "exports": {}
}
```
- `main` / `module` / `types` / `exports`: 빈 값 초기화 (G-003 빌드 파이프라인에서 채움)
- `dependencies`: 빈 객체 (G-003 peerDependencies 설정에서 채움)

**Pro EULA 패키지 (grid-pro-*, grid-license, grid)**:
```json
{
  "name": "@tomis/grid-pro-tracking",
  "version": "0.0.0",
  "type": "module",
  "license": "SEE LICENSE IN EULA",
  "main": "",
  "module": "",
  "types": "",
  "exports": {}
}
```

**apps/docs** (`private: true`):
```json
{
  "name": "docs",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED"
}
```

**루트 package.json**:
```json
{
  "name": "topvel-grid-monorepo",
  "version": "0.0.0",
  "private": true,
  "engines": { "node": ">=18.0.0", "pnpm": ">=8.0.0" }
}
```

### 2.3 pnpm-workspace.yaml 스키마

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

이 설정은 C-22 peerDependencies 정책의 전제 조건이다. **workspace symlink가 없으면** packages 간 cross-import 시 react/tanstack peer가 각 패키지에 중복 번들된다. pnpm workspace는 `node_modules` symlink를 통해 단일 설치본을 공유하여 중복 번들을 방지한다 (C-22 의존).

---

## Section 3: 기존 사용처 대응표

이 Goal은 인프라 스캐폴딩이므로 **영향 사용처 0개**.  
향후 의존 패턴 (사전 기록):

| 기존 | 신규 | 액션 | 담당 Goal |
|------|------|------|----------|
| `tw-framework-front` 단일 패키지 내 Grid 코드 | `@tomis/grid-*` workspace 패키지 | alias 연결 | G-004 |
| `tw-framework-front/src/components/tomis/Grid/*.tsx` | `packages/grid-core/src/` 등 | import 경로 변경 | MOD-GRID-17 |

---

## Section 4: 호환성 정책

- **breaking**: false — 신규 외부 디렉토리 생성, 기존 TOMIS 코드 변경 없음
- **deprecationStrategy**: N/A (기존 API 변경 없음)
- **migrationPath**:
  - `tw-framework-front`는 G-004에서 vite.config.ts에 workspace alias(`@tomis/grid-core` → `packages/grid-core/src`) 추가
  - 실제 사용처 import 변경은 MOD-GRID-17에서 C-19 점진(≤5/Goal) 적용
- **peerDependencies 정책 (C-22)**:
  - 이 Goal의 package.json은 `dependencies`/`peerDependencies` 모두 **빈 객체**로 초기화
  - 실제 peer 선언(`react`, `react-dom`, `@tanstack/react-table`, `@tanstack/react-virtual`, `xlsx`, `jspdf`)은 G-003에서 패키지별로 적용
  - C-22 위반(peer를 dep으로 이중 선언)은 G-003 이후에만 발생 가능 — G-001에서 선제 위반 없음
- **semver (C-23)**: 전 패키지 `version: "0.0.0"` 초기화. 1.0 전환 전까지 0.x 정책. Changesets 도입은 G-002에서.

---

## Section 5: 인수 기준

| ID | 기준 | 검증 방법 | 출처 |
|----|------|----------|------|
| AC-001 | `pnpm-workspace.yaml`에 `packages/*`와 `apps/*` 경로 등록 | 파일 Read + 패턴 확인 | C-22 (pnpm workspace가 peer 중복 방지의 전제) |
| AC-002 | 13개 패키지 폴더 생성: grid-core, grid-renderers, grid-export, grid-features, grid-pro-tracking, grid-pro-range, grid-pro-datamap, grid-pro-merging, grid-pro-header, grid-pro-agg, grid-pro-master, grid-license, grid (메타) | Glob 16개 package.json 실재 확인 | canonical-modules.json L1 + Goal JSON |
| AC-003 | `apps/docs` 폴더 생성 | Glob `apps/docs/package.json` 확인 | canonical-modules.json L1 (MOD-GRID-99-B 의존) |
| AC-004 | 각 패키지 package.json에 `name=@tomis/{pkg}`, `license`, `version: "0.0.0"` 초기화 | Read 14개 파일 + name/license/version 필드 확인 | C-24 (라이선스 명시 의무) |
| AC-005 | `pnpm install --recursive` 후 exit code 0 | IMPLEMENT/VERIFY 단계에서 실행 — exit code + stderr 확인 | C-12 (빌드 0 errors 필수) |

---

## Section 6: 엣지 케이스

### EC-01: topvel-grid-monorepo 디렉토리 이미 존재 시

- **시나리오**: 이전 실행에서 부분 완료 상태가 남아있을 때
- **처리**: 각 파일 생성 전 실재 여부 확인. 이미 존재하는 파일은 내용 비교 후 충돌 시만 덮어씌움 (덮어씌우기 전 backup 안내).
- **위험 없음 판단 근거**: 외부 디렉토리이므로 TOMIS git에 영향 없음.

### EC-02: pnpm 미설치 환경

- **시나리오**: 개발 환경에 pnpm CLI 없음 (`pnpm: command not found`)
- **처리**: `npm install -g pnpm@latest` 또는 `corepack enable && corepack prepare pnpm@latest --activate` 가이드 제공.
- **중요**: pnpm workspace는 npm/yarn workspace 문법과 다름 (yarn: `workspaces:` key, npm: `workspaces` in package.json). **pnpm 필수** — 폴백 불가.
- **최소 버전**: pnpm 8.0+, Node 18+ (루트 package.json `engines` 명시).

### EC-03: Windows — store와 monorepo가 다른 드라이브일 때

- **시나리오**: pnpm store가 `C:\Users\...\.pnpm-store`에 있고 monorepo가 `D:\project\...`에 있을 때
- **동작**: cross-volume hardlink 불가 → pnpm이 자동으로 **copy** fallback 사용 (느리지만 동작함). **관리자 권한 불필요** (pnpm은 Windows에서 폴더 symlink에 junction 사용, 관리자 권한 없어도 동작).
- **대응**: `pnpm config set store-dir D:\.pnpm-store` 로 같은 드라이브로 store 이동 권장 (설치 속도 개선).

### EC-04: 패키지명 대소문자 충돌 (Windows 파일시스템)

- **시나리오**: Windows NTFS는 기본 대소문자 무구분 — `packages/grid-Core`와 `packages/grid-core`가 같은 디렉토리로 인식될 수 있음.
- **처리**: 모든 패키지 디렉토리명 소문자 kebab-case 강제 (Section 11 구현 목록 확인).

---

## Section 7: 구현 대상 파일 (16개 — 전체 NEW)

**사전 확인**: 부모 디렉토리 `D:/project/topvel_project/`는 실재 확인됨 (orientation 단계 `ls` 결과: TOMIS, TOMIS_migration_reference 등 존재).  
`topvel-grid-monorepo/` 디렉토리는 **이 Goal이 생성**하는 것이므로 미존재가 정상. Implementer가 mkdir 후 파일 생성. H-02 합리성: 조부모 `D:/project/topvel_project/` 실재 + 디렉토리명이 프로젝트 컨벤션(`topvel-` prefix, kebab-case) 일치.

| # | 파일 경로 | 변경 유형 | 내용 |
|---|----------|---------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/pnpm-workspace.yaml` | NEW | packages/* + apps/* 등록 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/package.json` | NEW | 루트 private package.json + engines |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/package.json` | NEW | @tomis/grid-core, MIT |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/package.json` | NEW | @tomis/grid-renderers, MIT |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/package.json` | NEW | @tomis/grid-export, MIT |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/package.json` | NEW | @tomis/grid-features, MIT |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/package.json` | NEW | @tomis/grid-pro-tracking, EULA |
| 8 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/package.json` | NEW | @tomis/grid-pro-range, EULA |
| 9 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/package.json` | NEW | @tomis/grid-pro-datamap, EULA |
| 10 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/package.json` | NEW | @tomis/grid-pro-merging, EULA |
| 11 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/package.json` | NEW | @tomis/grid-pro-header, EULA |
| 12 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/package.json` | NEW | @tomis/grid-pro-agg, EULA |
| 13 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/package.json` | NEW | @tomis/grid-pro-master, EULA |
| 14 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-license/package.json` | NEW | @tomis/grid-license, EULA |
| 15 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid/package.json` | NEW | @tomis/grid (메타), EULA |
| 16 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/package.json` | NEW | docs, UNLICENSED, private |

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처

**0개** — 신규 외부 디렉토리 생성. TOMIS 내 기존 파일 변경 없음.  
`affectedUsageFiles: []` (canonical-modules.json + Goal JSON 일치).

### 8.2 무파괴 검증

- TOMIS 기존 빌드 (`tvcom_back` + `tw-framework-front`) 영향 없음.
- **외부 디렉토리** (`D:/project/topvel_project/topvel-grid-monorepo/`) 신규 생성.
- 조부모 `D:/project/topvel_project/` 실재 확인 완료 (orientation 단계 ls: TOMIS 등 존재).
- **이 Goal이 `topvel-grid-monorepo/` 부모 디렉토리를 직접 생성** — 파일 미존재가 전제조건이며 정상 상태.
- mkdir 사전 verified: `D:\project\topvel_project\TOMIS\.claude\tw-grid\artifacts\MOD-GRID-00\monorepo` 생성 성공 (동일 Implementer 환경에서 외부 디렉토리 쓰기 권한 확인됨).

### 8.3 점진/일괄

**일괄** 16파일 생성 (1 Goal). 각 파일은 상호 독립적 (package.json간 cross-reference 없음 — 실제 dep 연결은 G-003).

### 8.4 롤백

```powershell
# 전체 롤백
Remove-Item -Recurse -Force "D:\project\topvel_project\topvel-grid-monorepo"
```

TOMIS git 무영향 (외부 디렉토리). 롤백 완전.

### 8.5 번들 영향

**+0 KB** — 런타임 코드 없음 (package.json + yaml만). tw-framework-front 번들 변화 없음.

---

## Section 9: 의존성

### 이 Goal의 의존성

| 항목 | 필요 | 버전 | 설치 방법 |
|------|------|------|----------|
| pnpm CLI | 필수 | 8.0+ | `npm install -g pnpm` |
| Node.js | 필수 | 18.0+ | 기 설치 확인 |

### 패키지 deps/peerDeps

이 Goal의 각 package.json은 `dependencies`/`peerDependencies` **빈 객체** 또는 **미포함** 상태로 초기화.  
실제 선언은 G-003에서:
- MIT 패키지: `react`, `react-dom`, `@tanstack/react-table` → `peerDependencies` (C-22)
- grid-export: 추가로 `xlsx`, `jspdf` → `peerDependencies` (C-22)
- grid-virtual(grid-features 내): `@tanstack/react-virtual` → `peerDependencies` (C-22)
- **dep으로 중복 선언 금지** (C-22 이중 번들 방지)

외부 라이브러리 신규 추가 없음 (pnpm은 CLI 도구, 패키지가 아님) — ADR 불필요.

---

## Section 10: 사용자 여정

### 개발자 여정 (구현 후)

1. `cd D:/project/topvel_project/topvel-grid-monorepo`
2. `pnpm install` 실행
3. `pnpm-workspace.yaml`의 `packages/*` 패턴 인식 → 13 패키지 symlink 생성
4. `apps/*` 패턴 인식 → `apps/docs` symlink 생성
5. 이후 `packages/grid-core/`에서 코드 작성 시 `import '@tomis/grid-renderers'` 로 cross-package import 가능

### 최종 사용자 여정

영향 없음 (인프라 — 런타임 코드 없음).

---

## Section 11: 구현 계획

### 구현 순서

**Step 1: 루트 구조 생성** (2개 파일)

```
mkdir D:/project/topvel_project/topvel-grid-monorepo
```

파일 생성:
- `pnpm-workspace.yaml`
- `package.json` (루트)

**Step 2: 13 packages 디렉토리 + package.json 생성** (13개 파일)

순서 (MIT 먼저, Pro 후):
1. `packages/grid-core/package.json`
2. `packages/grid-renderers/package.json`
3. `packages/grid-export/package.json`
4. `packages/grid-features/package.json`
5. `packages/grid-pro-tracking/package.json`
6. `packages/grid-pro-range/package.json`
7. `packages/grid-pro-datamap/package.json`
8. `packages/grid-pro-merging/package.json`
9. `packages/grid-pro-header/package.json`
10. `packages/grid-pro-agg/package.json`
11. `packages/grid-pro-master/package.json`
12. `packages/grid-license/package.json`
13. `packages/grid/package.json` (메타)

**Step 3: apps/docs 생성** (1개 파일)

14. `apps/docs/package.json`

**Step 4: 검증**

```powershell
# 16개 파일 실재 확인
Get-ChildItem -Recurse -Filter "package.json" "D:\project\topvel_project\topvel-grid-monorepo"

# pnpm workspace 인식 확인
cd D:\project\topvel_project\topvel-grid-monorepo
pnpm install
pnpm list -r --depth=0  # 14 workspaces 확인
```

### Before/After 스니펫

**Before** (`pnpm-workspace.yaml` — 미존재):
```
(파일 없음)
```

**After** (`pnpm-workspace.yaml`):
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

**Before** (개발자 cross-package import — 불가):
```typescript
// packages/grid-core에서 grid-renderers를 가져올 방법 없음
// import { ButtonCell } from '@tomis/grid-renderers'; // ← 에러
```

**After** (pnpm workspace symlink 생성 후):
```typescript
// packages/grid-core/src/index.ts
import { ButtonCell } from '@tomis/grid-renderers'; // ← workspace symlink로 해결
```

### 위험 요소

| 위험 | 가능성 | 처리 |
|------|--------|------|
| Windows cross-drive pnpm store → copy fallback | 낮음 | EC-03 — store-dir 재설정 가이드 |
| G-002+ 범위가 이 Goal에 섞임 | 주의 | F-00-03~09는 이 Goal 구현 목록에 없음 — Implementer 주의 |
| pnpm version 7.x 이하 (workspace syntax 변경) | 낮음 | engines.pnpm >= 8.0 명시 |

---

## Section 12: 검증 계획

### 단위 테스트

N/A — package.json/yaml 파일은 단위 테스트 대상 없음.

### 시각 회귀

N/A — migrationImpact: low + 사용처 0개 (C-17 N/A 조건 해당).

### 빌드 검증

**V-01 파일 실재 확인**:
```powershell
Get-ChildItem -Recurse -Filter "package.json" "D:\project\topvel_project\topvel-grid-monorepo" |
  Measure-Object | Select-Object Count  # → 16
```

**V-02 pnpm workspace 인식 (AC-005)**:
```powershell
cd D:\project\topvel_project\topvel-grid-monorepo
pnpm install           # exit code 0 확인
pnpm list -r --depth=0 # 14 packages (@tomis/* 13개 + docs 1개) 출력 확인
```

**V-03 AC-004 license 필드 확인**:
```powershell
# 각 package.json의 license 필드 출력
Get-ChildItem -Recurse -Filter "package.json" "packages","apps" |
  ForEach-Object { $j = Get-Content $_ | ConvertFrom-Json; "$($j.name): $($j.license)" }
```
예상 출력:
```
@tomis/grid-core: MIT
@tomis/grid-renderers: MIT
@tomis/grid-export: MIT
@tomis/grid-features: MIT
@tomis/grid-pro-tracking: SEE LICENSE IN EULA
@tomis/grid-pro-range: SEE LICENSE IN EULA
@tomis/grid-pro-datamap: SEE LICENSE IN EULA
@tomis/grid-pro-merging: SEE LICENSE IN EULA
@tomis/grid-pro-header: SEE LICENSE IN EULA
@tomis/grid-pro-agg: SEE LICENSE IN EULA
@tomis/grid-pro-master: SEE LICENSE IN EULA
@tomis/grid-license: SEE LICENSE IN EULA
@tomis/grid: SEE LICENSE IN EULA
docs: UNLICENSED
```

**V-04 TOMIS 기존 빌드 무영향 확인**:
```powershell
cd D:\project\topvel_project\TOMIS\tw-framework-front
npx tsc --noEmit  # 에러 0 (G-001 이전과 동일)
```

**자동 보완**: 누락된 package.json 발견 시 Implementer가 Section 11 스키마로 자동 생성.

---

## Section 13: 상용 제품화 영향

### 분류

인프라 (스캐폴딩) — 직접 배포 대상 아님. `topvel-grid-monorepo` 루트 package.json은 `"private": true`.

### 라이선스 검증 (C-24)

| 패키지 그룹 | license 필드 | LICENSE 파일 | 런타임 검증 |
|------------|-------------|-------------|------------|
| MIT (4개) | `"MIT"` | G-002에서 `LICENSE` 파일 추가 | 불필요 |
| Pro EULA (8개 + 메타) | `"SEE LICENSE IN EULA"` | G-002에서 `EULA.md` 추가 | MOD-GRID-99-A에서 구현 |
| apps/docs | `"UNLICENSED"` | N/A (private) | N/A |

**이 Goal에서**: `license` 필드만 package.json에 명시. LICENSE/EULA 파일 생성은 G-002.  
Pro 패키지 런타임 라이선스 검증(`configureGridLicense()` 호출)은 MOD-GRID-99-A 구현 대상 — 이 Goal 범위 외.

### 문서 작성 계획 (C-25)

- 모노레포 루트 `README.md`: MOD-GRID-99-B에서 본격 문서화 (`apps/docs` Docusaurus 연동)
- 각 패키지 `README.md`: 각 모듈 구현 Goal에서 작성 (MOD-GRID-01~16)
- Storybook story: 각 컴포넌트 구현 Goal에서 작성

---

## ★ 메타 게이트 H 자가 점검 결과

| 항목 | 결과 | Evidence |
|------|------|----------|
| H-01: referenceEvidence 경로 실재 | **YES** | L0 `tw-framework-front/package.json` — Read 완료 (version 0.0.0, @tanstack/react-table 8.21.3 확인). L1 `canonical-modules.json` — Read 완료 (12 packageTarget + 20 modules 확인). L2 신규 인프라 (해당 없음). L3 MOD-GRID-01~16 dependsOn["MOD-GRID-00"] — canonical-modules.json Read에서 확인. |
| H-02: implementFiles 경로 합리성 | **YES** | 조부모 `D:/project/topvel_project/` 실재 확인 (ls 결과: TOMIS 디렉토리 존재). `topvel-grid-monorepo`는 이 Goal이 생성하는 디렉토리이므로 미존재가 정상. 명명 컨벤션: `topvel-` prefix (다른 프로젝트명 `topvel_project` 참조) + kebab-case. Section 7 + 8.2에 명시. |
| H-03: AC 출처 태그 검증 | **YES** | AC-001 source C-22 → Section 2.3에서 "pnpm workspace는 C-22 peerDep 중복 번들 방지의 전제" 직접 인용. AC-002 source L1 → Section 1 L1에서 canonical-modules.json F-00-02 인용. AC-003 source L1 → Section 1 L1 MOD-GRID-99-B 인용. AC-004 source C-24 → Section 2.2 및 13에서 C-24 인용. AC-005 source C-12 → Section 12 V-02에서 exit code 0 검증 명시. |

---

## advisor 피드백 처리 확인 (v1.0)

| # | 피드백 | 처리 섹션 |
|---|--------|----------|
| 1 | AC-001 출처 C-22 인용 — workspace가 peer 중복 방지 전제 | Section 2.3 마지막 문단 |
| 2 | H-02 조부모 실재 + Goal이 부모 생성 명시 | Section 7 헤더 + Section 8.2 |
| 3 | G-001 스코프 규율 — F-00-03~09 제외 명시 | Section 1 L1 + Section 11 위험 |
| 4 | 13 vs 12 discrepancy — 메타 패키지 설명 | Section 1 L1 중요 항목 |
| 5 | license 필드 패키지별 매핑 | Section 2.2 + Section 13 |
| 6 | AC-005 IMPLEMENT/VERIFY 단계 책임 명시 | Section 12 V-02 |
| 7 | Windows pnpm junction + cross-drive copy fallback 정확히 | Section 6 EC-03 |
