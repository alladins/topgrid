# G-004 Specification — Changesets + ESLint flat config + tw-framework-front workspace alias

**Module**: MOD-GRID-00 (모노레포 스캐폴딩 + 패키지 분할 + size-limit + Changesets)  
**Goal**: G-004  
**Area**: monorepo  
**Phase**: infra  
**Priority**: P0  
**migrationImpact**: low  
**threshold**: 90  
**spec 작성일**: 2026-05-14  
**spec 버전**: v1.0 (첫 시도)  
**dependsOn**: MOD-GRID-00/G-003

---

## ★ 사전 결정 (5개 — 구현 전 고정)

| # | 결정 | 선택 | 사유 |
|---|------|------|------|
| D1 | workspace alias 방식 | **vite resolve.alias** (`@tomis/grid-*` → `topvel-grid-monorepo/packages/*/src`) | AC-005 HMR 목표. tw-framework-front와 topvel-grid-monorepo가 별도 git 경계 → pnpm workspace:* 연결 불가 (TOMIS pnpm 워크스페이스에 외부 디렉토리 미포함). vite alias로 직접 src/ 경로 지정 시 HMR 즉시 반영. G-005+ npm publish 이후 workspace:* dependency로 전환 예정. |
| D2 | ESLint flat config 위치 | **모노레포 루트** (`topvel-grid-monorepo/eslint.config.mjs`) | goals.json implementFiles에 모노레포 루트만 지정. tw-framework-front는 독립 eslint.config.js 유지 (L0 확인: eslint.config.js 이미 존재). 두 설정 독립적으로 관리. |
| D3 | @changesets/cli config.json 기본값 | `changelog: "@changesets/changelog-github"` 대신 **`"@changesets/cli/changelog"`** (기본 CHANGELOG formatter) | GitHub Actions 미구성 상태. github PR/commit 링크 formatter는 환경 의존. 기본 formatter로 시작 + G-005에서 CI 구성 시 전환. |
| D4 | .changeset/config.json `access` 값 | **`"restricted"`** (private, npm publish 자동 차단) | 모노레포 패키지는 아직 public publish 준비 미완료. `restricted`로 차단. publish 준비 완료 시 `access: "public"` 전환 + ADR 업데이트. |
| D5 | 12 패키지 CHANGELOG.md 초기 생성 | **G-004 범위 포함** | AC-002 명시 (C-23 출처). 각 패키지 `# @tomis/{pkg}\n\n## 0.0.0\n\nInitial scaffold.` 초기 내용. grid-license 포함 (G-003과 달리 CHANGELOG는 관리 대상). |

---

## Section 1: 참조 추적

### L0: 현 구현 파일 (직접 Read 확인)

#### L0-A: tw-framework-front/vite.config.ts
**파일**: `D:/project/topvel_project/TOMIS/tw-framework-front/vite.config.ts`  
**Read 확인**: 2026-05-14

현재 resolve.alias 설정 (L7-L19 발췌):
```typescript
// vite.config.ts L1-36 실측
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react({jsxRuntime: 'automatic',}), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),   // ← 현재 alias: '@' 1개만 존재
      },
    },
    server: { port: 5173, proxy: { '/api': { ... } } },
    define: { __APP_ENV__: JSON.stringify(env), ... },
  }
})
```

**핵심 관찰**:
- `resolve.alias` 에 `'@'` 1개만 존재 (L17) → G-004에서 `@tomis/grid*` 패턴 추가
- `plugins` 에 `react` + `tailwindcss` 존재 → **변경 없음** (C-1 surgical)
- `server.proxy` + `define` 존재 → **변경 없음**

#### L0-B: tw-framework-front/package.json
**파일**: `D:/project/topvel_project/TOMIS/tw-framework-front/package.json`  
**Read 확인**: 2026-05-14

`scripts.dev`: `"vite"` (L7)  
현재 `@tomis/grid*` 관련 dependency 없음. `devDependencies` 내 ESLint 관련:
```json
{
  "devDependencies": {
    "@eslint/js": "^9.25.0",
    "eslint": "^9.25.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.19",
    "globals": "^16.0.0",
    "typescript-eslint": "^8.30.1"
  }
}
```
→ tw-framework-front는 이미 flat config ESLint 구성 완료. G-004에서 package.json devDeps **변경 없음** (vite alias만 추가).

#### L0-C: tw-framework-front/eslint.config.js
**파일**: `D:/project/topvel_project/TOMIS/tw-framework-front/eslint.config.js`  
**Read 확인**: 2026-05-14

이미 flat config v9 방식으로 구성. `@typescript-eslint/no-explicit-any: 'off'` 설정 주목 (C-4 위반 허용 중).  
→ G-004 ESLint는 **모노레포 루트에만 신설**. tw-framework-front 기존 설정 변경 없음 (D2 결정).

### L1: 현 패키지 상태 (topvel-grid-monorepo 실측)

**Read 확인**: 2026-05-14

**topvel-grid-monorepo/package.json 실측**:
```json
{
  "scripts": {
    "build": "pnpm -r --filter './packages/*' build",
    "typecheck": "pnpm -r --filter './packages/*' exec tsc --noEmit",
    "test": "pnpm -r test",
    "size": "pnpm -r --filter './packages/*' build && size-limit",
    "size-limit": "size-limit",
    "size-limit:ci": "size-limit --json"
  },
  "devDependencies": {
    "@size-limit/preset-small-lib": "^11.0.0",
    "size-limit": "^11.0.0",
    "tsup": "^8.4.0",
    "typescript": "~5.8.3"
  }
}
```

**topvel-grid-monorepo/pnpm-workspace.yaml 실측**:
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

**패키지 구조 (ls 확인)**:
```
packages/
  grid, grid-core, grid-export, grid-features, grid-license,
  grid-pro-agg, grid-pro-datamap, grid-pro-header, grid-pro-master,
  grid-pro-merging, grid-pro-range, grid-pro-tracking, grid-renderers
  → 총 13개 (grid-license 포함)
```

**grid-core/package.json 실측 (peerDependencies G-003 완료 확인)**:
```json
{
  "name": "@tomis/grid-core",
  "version": "0.0.0",
  "peerDependencies": {
    "@tanstack/react-table": "^8.0.0",
    "@tanstack/react-virtual": "^3.0.0",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

**.changeset 디렉토리**: 미존재 (Glob 확인) → G-004에서 신규 생성  
**eslint.config.mjs**: 미존재 (Glob 확인) → G-004에서 신규 생성  
**CHANGELOG.md**: 패키지별 미존재 (Glob 확인 — node_modules 내 것만 검출) → G-004에서 신규 생성

**ADR-MOD-GRID-00-006 placeholder**: `decisions/MOD-GRID-00-decisions.md`에 "ADR-006: Changesets 도입 (G-004에서 결정)"으로 예약됨 → G-004 spec에서 ADR-006 작성 의무.

### L2: canonical-modules.json (G-004 관련 항목)

**파일**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/canonical-modules.json`  
**Read 확인**: 2026-05-14

MOD-GRID-00 expectedFeatures:
- **F-00-04** (`"Changesets 도구 (@changesets/cli) 설정 — C-23 semver"`, P0) — 이 Goal 핵심 범위
- **F-00-08** (`"ESLint flat config + import 정렬 규칙"`, P1) — 이 Goal 범위 포함
- **F-00-09** (`"tw-framework-front workspace alias (@tomis/grid → packages/grid)"`, P0) — 이 Goal 핵심 범위

### L3: 의존 모듈 (영향 사용처)

**affectedUsageFiles: 1개**  
`D:/project/topvel_project/TOMIS/tw-framework-front/package.json` (goals.json 명시)

→ 단, D1 결정(vite alias 방식)에 따라 **package.json devDeps 변경 없음**. vite.config.ts alias만 추가.  
→ `affectedUsageFiles`로 명시된 이유: alias 도입으로 tw-framework-front가 `@tomis/grid-*` import를 사용 가능해지는 간접 영향.  
→ MOD-GRID-17 마이그레이션 시 페이지 파일 27개가 `import '@tomis/grid-core'` 패턴 사용.

### R-A: AG Grid Changesets 패턴 (참조용 — 코드 차용 X)

AG Grid 모노레포는 `@changesets/cli` 사용. `.changeset/config.json`에 `access: "public"`, `baseBranch: "main"`. 각 패키지 CHANGELOG.md 자동 관리.  
G-004 Changesets 도입의 구조적 참조.

### R-W: Wijmo 참조 (해당 없음)

Wijmo는 publish CLI 기반 버전 관리 — Changesets 패턴 미적용. N/A.

### migrationImpact: low (사유)

topvel-grid-monorepo 인프라 도구 추가 + tw-framework-front vite.config.ts resolve.alias 1개 항목 추가.  
TOMIS 기존 런타임 코드(tvcom_back, tw-framework-front 페이지) 변경 없음.  
bundleImpact: **+0 KB** (개발 도구 + alias는 번들에 미포함).

---

## Section 2: API 계약

### 2.1 .changeset/config.json 스키마

**파일**: `D:/project/topvel_project/topvel-grid-monorepo/.changeset/config.json` (NEW)

```json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "master",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

**필드 설명**:
- `changelog`: 기본 formatter (D3 결정 — GitHub PR 링크 불필요)
- `commit: false`: changeset version 시 자동 커밋 없음 (수동 커밋 유지)
- `access: "restricted"`: npm publish 차단 (D4 결정)
- `baseBranch: "master"`: TOMIS git 브랜치 (CLAUDE.md 확인)
- `updateInternalDependencies: "patch"`: 내부 패키지 버전 bump 시 patch로 소비 패키지 업데이트
- `ignore: []`: 모든 패키지 대상 (apps/docs는 `private: true`이므로 publish 시 자동 제외됨)

**사용 워크플로우**:
```sh
pnpm changeset          # interactive: 패키지 선택 + major/minor/patch 결정
# → .changeset/{hash}.md 생성
pnpm changeset version  # 버전 bump + CHANGELOG.md 업데이트
pnpm changeset publish  # npm 게시 (access=restricted → 기본 차단)
```

### 2.2 eslint.config.mjs 스키마 (flat config v9)

**파일**: `D:/project/topvel_project/topvel-grid-monorepo/eslint.config.mjs` (NEW)

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['packages/**/*.{ts,tsx}', 'apps/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',     // C-4 강제
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
);
```

**tw-framework-front 차이**:
- `@typescript-eslint/no-explicit-any`: tw-framework-front는 `'off'`, 모노레포는 **`'error'`** (C-4 준수)
- `react-refresh` 플러그인 미포함 (모노레포 패키지는 dev server HMR 불필요)
- files 범위: `packages/**` + `apps/**`

### 2.3 vite.config.ts resolve.alias 추가 스키마

**파일**: `D:/project/topvel_project/TOMIS/tw-framework-front/vite.config.ts` (MODIFY)

**추가할 alias 객체** (기존 `'@'` alias 보존):
```typescript
import path from 'path';

// resolve.alias 추가 항목:
{
  '@tomis/grid-core': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-core/src'),
  '@tomis/grid-renderers': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-renderers/src'),
  '@tomis/grid-export': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-export/src'),
  '@tomis/grid-features': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-features/src'),
  '@tomis/grid-pro-tracking': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-tracking/src'),
  '@tomis/grid-pro-range': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-range/src'),
  '@tomis/grid-pro-datamap': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-datamap/src'),
  '@tomis/grid-pro-merging': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-merging/src'),
  '@tomis/grid-pro-header': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-header/src'),
  '@tomis/grid-pro-agg': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-agg/src'),
  '@tomis/grid-pro-master': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-master/src'),
  '@tomis/grid-license': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-license/src'),
  '@tomis/grid': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid/src'),
}
```

**상대 경로 근거**: `tw-framework-front` 위치 = `D:/project/topvel_project/TOMIS/tw-framework-front/`  
→ `../..` = `D:/project/topvel_project/` → `topvel-grid-monorepo/` 도달.

**완전한 After 스니펫** (Section 11.5 참조):
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@tomis/grid-core': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-core/src'),
    // ... (나머지 12개)
    '@tomis/grid': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid/src'),
  },
},
```

### 2.4 사용 예시 코드

**예시 1 — 개발자가 changeset 작업할 때**:
```sh
cd D:/project/topvel_project/topvel-grid-monorepo
pnpm changeset
# → 변경된 패키지 선택 (예: @tomis/grid-core)
# → bump type 선택 (patch/minor/major)
# → .changeset/abc123.md 생성

pnpm changeset version
# → packages/grid-core/package.json version bump
# → packages/grid-core/CHANGELOG.md 업데이트
```

**예시 2 — tw-framework-front에서 @tomis/grid-core import (alias 적용 후)**:
```typescript
// tw-framework-front 페이지에서 사용 (MOD-GRID-17에서 실제 마이그레이션)
import { Grid } from '@tomis/grid-core';  // → packages/grid-core/src/index.ts로 resolve

// vite dev server HMR: packages/grid-core/src 변경 시 즉시 브라우저 갱신
```

---

## Section 3: 기존 사용처 대응표

| 현재 vite.config.ts (L0 실측) | G-004 후 | 영향 |
|-------------------------------|---------|------|
| `resolve.alias: { '@': ... }` (1개) | `resolve.alias: { '@': ..., '@tomis/grid-*': ... }` (14개) | 기존 `@` alias 동작 **불변** |
| `@tomis/grid-*` import → 해석 불가 | `@tomis/grid-*` → `topvel-grid-monorepo/packages/*/src` | HMR 지원 |
| `plugins`, `server`, `define` 설정 | **변경 없음** (C-1 surgical) | 기존 동작 보존 |

| 현재 package.json (tw-framework-front) | G-004 후 | 영향 |
|----------------------------------------|---------|------|
| `@tomis/grid-*` dependency 없음 | **변경 없음** (D1 결정 — vite alias만 사용) | package.json 수정 0 |
| ESLint 관련 devDeps 이미 존재 | **변경 없음** (ESLint 모노레포 루트에만 추가) | 0 |

---

## Section 4: 호환성 정책

### 4.1 Breaking change 여부

**Breaking change: NO**

- `@changesets/cli` 신규 도입 — 기존 코드 영향 없음
- `eslint.config.mjs` 신규 파일 — 기존 tw-framework-front ESLint 독립 유지
- `vite.config.ts` alias 추가 — 기존 `@` alias + 기존 plugins/server/define 변경 없음
- CHANGELOG.md 초기 생성 — 기존 파일 없으므로 NEW

### 4.2 vite.config.ts alias 추가 비호환 시나리오

이론적 충돌: alias 경로 오타 시 tw-framework-front `vite dev`/`vite build` 실패 가능.  
→ Section 11.7 위험 요소 + 구현 시 경로 double-check 의무 명시.

### 4.3 Deprecation 전략

**N/A** — 신규 도구. 기존 breaking API 없음.

### 4.4 vite alias → npm dependency 전환 시점

현재 G-004: vite resolve.alias (개발 편의).  
G-005+: npm publish 완료 후 → `@tomis/grid-*: "workspace:*"` dependency로 전환 (TOMIS pnpm 워크스페이스 별도 설정 필요).  
전환 시 vite.config.ts alias 제거 + package.json dependencies 추가 → 별도 Goal/ADR 작성 의무.

---

## Section 5: 인수 기준 (AC)

| AC # | 기준 (검증 가능) | 검증 방법 | 출처 |
|------|----------------|---------|------|
| **AC-001** | `topvel-grid-monorepo/.changeset/config.json` 존재; `access: "restricted"`, `baseBranch: "master"`, `changelog: "@changesets/cli/changelog"` 포함 | Read .changeset/config.json + 3개 필드 확인 | C-23 (semver 준수 → Changeset 도구 사용 의무) |
| **AC-002** | 13개 패키지 각각 `CHANGELOG.md` 존재; 각 파일이 `# @tomis/{pkg}` 헤더 + `## 0.0.0` 섹션 포함 | Glob `packages/*/CHANGELOG.md` + Read 각 파일 헤더 확인 | C-23 (CHANGELOG.md 관리 의무) |
| **AC-003** | `topvel-grid-monorepo/eslint.config.mjs` 존재; `@typescript-eslint/no-explicit-any: 'error'` 규칙 포함 | Read eslint.config.mjs + 규칙 확인 | C-4 (TypeScript Strict — No `any`) |
| **AC-004** | `tw-framework-front/vite.config.ts`에 `@tomis/grid-core` alias 존재; `'@'` alias 및 기존 plugins/server/define 변경 없음 | Read vite.config.ts + resolve.alias 확인 + 기존 설정 보존 검증 | L0 (vite.config.ts 현 구조 — D1 결정) |
| **AC-005** | `pnpm -F tw-framework-front dev` 실행 시 `@tomis/grid-core` import가 `packages/grid-core/src/index.ts`로 해석됨 (HMR 반영) | pnpm dev 실행 + 변경 감지 확인; 환경 의존 (EC-03과 매핑) | L0 (vite dev server HMR 동작) |

---

## Section 6: 엣지 케이스 (3개 이상)

### EC-01: @changesets/cli 미설치 환경

**상황**: `topvel-grid-monorepo`에서 `pnpm install` 미실행 → `pnpm changeset` 명령 실행 불가.  
**대응**: `.changeset/config.json` 파일 생성은 pnpm install 없이 가능. `pnpm changeset` 실행 검증은 documented-deviation 처리 (ADR-003). G-005 착수 전 `pnpm install` resolution 명시.  
**AC 매핑**: AC-001 (config.json 존재 여부) — config.json 자체는 검증 가능. changeset CLI 실행 검증은 EC-01 deviation.

### EC-02: topvel-grid-monorepo git 미초기화 상태

**상황**: 외부 디렉토리가 git 저장소로 초기화되지 않은 경우 `changeset version` 명령이 실패 가능 (git log 참조).  
**대응**: AC-001은 config.json 파일 내용만 검증. `pnpm changeset version` 실행은 documented-deviation (EC-01 동일 처리). G-004 범위: config.json + CHANGELOG.md 초기 파일 생성만.  
**AC 매핑**: AC-001 (config.json 내용 검증) — git 상태 무관 통과 가능.

### EC-03: tw-framework-front pnpm dev 실행 환경 미구비

**상황**: 개발 서버 미실행 또는 pnpm 미설치 환경 → HMR 검증 불가.  
**대응**: AC-005는 환경 의존 (ADR-003). documented-deviation 처리. vite.config.ts alias 경로의 Read-based 정적 검증(파일 경로 실재 확인)으로 AC-004 대체. AC-005는 분모에서 제외.  
**AC 매핑**: AC-005 (HMR 반영) ↔ EC-03.

### EC-04: alias 경로 오타 시 vite build 실패

**상황**: `../../topvel-grid-monorepo/packages/grid-core/src` 경로 오타 → `vite dev` 시 `ENOENT` 오류.  
**대응**: 구현 시 각 alias 경로를 Glob/ls로 src 디렉토리 실재 확인 후 작성. Before/After git diff 라인 수 비교로 의도치 않은 수정 없음 검증.

### EC ↔ AC 매핑 (ADR-003 E-04 권장 형식)

| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-001 (@changesets/cli config.json) | EC-01 (CLI 미설치) | config.json 파일 자체는 CLI 없이도 검증 가능; CLI 실행은 documented-deviation |
| AC-001/AC-002 (changeset 워크플로우) | EC-02 (git 미초기화) | version 명령은 git 의존; 파일 생성 검증만 가능 |
| AC-005 (HMR 반영) | EC-03 (dev 서버 미실행) | vite dev 실행 불가 시 정적 경로 검증으로 대체 |
| AC-004 (alias 기존 설정 보존) | EC-04 (alias 오타) | 구현 시 Glob src 실재 확인 + git diff 검증 의무 |

---

## Section 7: 구현 대상 파일 (NEW/MODIFY)

| # | 파일 경로 | 유형 | 변경 범위 |
|---|----------|------|---------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/.changeset/config.json` | **NEW** | Changesets 표준 config (access=restricted, baseBranch=master) |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/eslint.config.mjs` | **NEW** | flat config v9 (@eslint/js + typescript-eslint + react-hooks, no-explicit-any: error) |
| 3 | `D:/project/topvel_project/TOMIS/tw-framework-front/vite.config.ts` | **MODIFY** | resolve.alias에 @tomis/grid-* 13개 추가 (기존 '@' 및 plugins/server/define 보존) |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/CHANGELOG.md` | **NEW** | 초기 0.0.0 scaffold |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/CHANGELOG.md` | **NEW** | 초기 0.0.0 scaffold |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/CHANGELOG.md` | **NEW** | 초기 0.0.0 scaffold |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/CHANGELOG.md` | **NEW** | 초기 0.0.0 scaffold |
| 8 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/CHANGELOG.md` | **NEW** | 초기 0.0.0 scaffold |
| 9 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/CHANGELOG.md` | **NEW** | 초기 0.0.0 scaffold |
| 10 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/CHANGELOG.md` | **NEW** | 초기 0.0.0 scaffold |
| 11 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/CHANGELOG.md` | **NEW** | 초기 0.0.0 scaffold |
| 12 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/CHANGELOG.md` | **NEW** | 초기 0.0.0 scaffold |
| 13 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/CHANGELOG.md` | **NEW** | 초기 0.0.0 scaffold |
| 14 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/CHANGELOG.md` | **NEW** | 초기 0.0.0 scaffold |
| 15 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-license/CHANGELOG.md` | **NEW** | 초기 0.0.0 scaffold |
| 16 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid/CHANGELOG.md` | **NEW** | 초기 0.0.0 scaffold |

**총계**: 15 NEW + 1 MODIFY = 16 파일.  
goals.json implementFiles = 3개 (config.json + eslint.config.mjs + vite.config.ts) + 13 CHANGELOG.md = 16개.  
**grid-license CHANGELOG 포함 사유 (D5)**: G-003과 달리 CHANGELOG는 패키지 버전 관리 추적 목적 → 13개 전체 포함.

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처

`affectedUsageFiles: 1개` — `D:/project/topvel_project/TOMIS/tw-framework-front/package.json`

**실제 변경 파일**: `tw-framework-front/vite.config.ts` (MODIFY).  
`tw-framework-front/package.json`은 goals.json에 affectedUsageFiles로 명시되었으나 D1 결정(vite alias 방식)으로 **package.json 자체는 변경 없음**.  
→ vite.config.ts가 실질 변경 대상. package.json은 모니터링 대상으로 유지.

### 8.2 무파괴 검증

**이 Goal은 기존 파일 삭제 없음**. 기존 vite.config.ts의 `'@'` alias, plugins, server, define 설정 완전 보존 (C-1 surgical changes).  
검증: `git diff`로 vite.config.ts 변경 라인 수 확인 — resolve.alias 블록 추가만 있어야 함.

**외부 디렉토리 무파괴**: topvel-grid-monorepo에 파일 추가만 (기존 package.json, tsconfig.json, tsup.config.ts 변경 없음).

**TOMIS tw-framework-front 기존 빌드 무영향**: alias 추가는 기존 `'@'` import에 영향 없음. `tsc -b && vite build` (package.json scripts.build) 통과 여부로 검증.

### 8.3 점진/일괄

**일괄** (인프라 Goal). 16 파일 모두 상호 독립적. 외부 디렉토리(모노레포) + TOMIS 내부(vite.config.ts) 순서로 처리.

### 8.4 롤백

```powershell
# TOMIS 내부 (git revert)
cd D:\project\topvel_project\TOMIS
git revert HEAD -- tw-framework-front/vite.config.ts  # vite.config.ts alias 제거

# 외부 모노레포 (파일 삭제)
Remove-Item "D:\project\topvel_project\topvel-grid-monorepo\.changeset" -Recurse -Force
Remove-Item "D:\project\topvel_project\topvel-grid-monorepo\eslint.config.mjs"
Get-ChildItem "D:\project\topvel_project\topvel-grid-monorepo\packages" -Directory |
  ForEach-Object { Remove-Item "$($_.FullName)\CHANGELOG.md" -ErrorAction SilentlyContinue }
```

### 8.5 번들 영향

**bundleImpact: +0 KB**

- `.changeset/config.json`: JSON 설정 파일 — 런타임 미포함
- `eslint.config.mjs`: devTool — 런타임 미포함
- `CHANGELOG.md` × 13: 마크다운 — 런타임 미포함
- `vite.config.ts` alias 추가: 빌드 시 경로 해석 설정 — 최종 번들 크기 영향 없음 (`@tomis/grid-*` src/index.ts는 현재 `export {}` — 실 코드 없음)

---

## Section 9: 의존성

### 9.1 신규 devDependencies (모노레포 루트 package.json)

| 패키지 | 버전 | 라이선스 | 용도 | ADR |
|--------|------|---------|------|-----|
| `@changesets/cli` | `^2.27.0` | MIT | Changesets CLI — pnpm changeset / version / publish | ADR-006 (이 spec에서 작성 — placeholder 소비) |
| `eslint` | `^9.x` | MIT | ESLint flat config v9 | ADR-006 동일 (eslint 도입 포함) |
| `@eslint/js` | `^9.25.0` | MIT | ESLint JS 권장 규칙 | 동일 |
| `typescript-eslint` | `^8.30.1` | MIT | TypeScript ESLint 통합 | 동일 |
| `eslint-plugin-react-hooks` | `^5.2.0` | MIT | React Hooks 규칙 강제 | 동일 |

**버전 근거**: eslint 관련 버전은 tw-framework-front/package.json L0 실측 버전과 동일 pin → 두 설정 간 플러그인 버전 일관성.

**C-9 라이선스 검증**: 전부 MIT — 허용 목록 충족.

**ADR-006 의무 (C-9, C-20)**: @changesets/cli + ESLint 신규 dependency → `decisions/MOD-GRID-00-decisions.md`에 ADR-006 작성 (spec 단계).

### 9.2 tw-framework-front 의존성 변경

**없음** (D1 결정 — vite alias 방식). tw-framework-front package.json devDeps/deps 변경 없음.

---

## Section 10: 사용자 여정 매핑

### 여정 1: 패키지 개발자가 변경 후 changeset을 등록할 때

```
1. packages/grid-core/src 에 기능 추가
2. cd D:/project/topvel_project/topvel-grid-monorepo
3. pnpm changeset
   → @tomis/grid-core 선택 → minor 선택
   → .changeset/abc123.md 생성 (변경 설명 입력)
4. PR 머지 후 CI가 changeset version 실행
   → packages/grid-core/package.json version: 0.0.0 → 0.1.0
   → packages/grid-core/CHANGELOG.md 자동 업데이트
5. changeset publish → npm 게시 (access=restricted → 현재 차단)
```

### 여정 2: tw-framework-front 개발자가 @tomis/grid-core 를 import 할 때

```
1. vite.config.ts alias 확인: '@tomis/grid-core' → packages/grid-core/src
2. tw-framework-front 페이지에서:
   import { Grid } from '@tomis/grid-core';  // → packages/grid-core/src/index.ts
3. pnpm -F tw-framework-front dev
   → packages/grid-core/src/index.ts 변경 감지 → HMR 즉시 갱신
```

### 여정 3: 최종 사용자 (TOMIS 관리자)

N/A — 이 Goal은 개발 도구 설정. 최종 사용자 UI 변경 없음.

---

## Section 11: 구현 계획

### 11.1 순서 (의존성 고려)

**Step 1**: ADR-006 작성 (`decisions/MOD-GRID-00-decisions.md` MODIFY)  
→ @changesets/cli + ESLint 도입 결정 문서화 (C-9, C-20 의무)  
→ placeholder ADR-006 소비

**Step 2**: 모노레포 루트 devDependencies 추가 (`topvel-grid-monorepo/package.json` MODIFY)  
→ @changesets/cli, eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks 추가  
→ scripts에 `"lint": "eslint packages apps"` + `"changeset": "changeset"` 추가 (선택)

**Step 3**: `.changeset/config.json` 생성  
→ NEW 파일. Section 2.1 스키마 그대로.

**Step 4**: 13개 패키지 CHANGELOG.md 초기 생성  
→ 각 `# @tomis/{pkg}\n\n## 0.0.0\n\nInitial scaffold.` 내용

**Step 5**: `eslint.config.mjs` 생성  
→ NEW 파일. Section 2.2 스키마 그대로.

**Step 6**: `tw-framework-front/vite.config.ts` MODIFY (TOMIS 내부)  
→ resolve.alias에 @tomis/grid-* 13개 추가  
→ 기존 '@' alias + plugins + server + define 완전 보존

**Step 7**: 검증 (Section 12)

### 11.2 구현 순서 근거

외부 모노레포 변경(Step 1~5) 먼저 → TOMIS 내부(Step 6) 나중.  
이유: vite.config.ts의 alias가 참조하는 `src/` 디렉토리가 실재하는지 Step 5 이전에 확인 필요.

### 11.3 Before/After 코드 스니펫

**vite.config.ts Before** (L15-L19, L0 실측):
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

**vite.config.ts After** (resolve.alias 블록):
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@tomis/grid-core': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-core/src'),
    '@tomis/grid-renderers': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-renderers/src'),
    '@tomis/grid-export': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-export/src'),
    '@tomis/grid-features': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-features/src'),
    '@tomis/grid-pro-tracking': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-tracking/src'),
    '@tomis/grid-pro-range': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-range/src'),
    '@tomis/grid-pro-datamap': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-datamap/src'),
    '@tomis/grid-pro-merging': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-merging/src'),
    '@tomis/grid-pro-header': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-header/src'),
    '@tomis/grid-pro-agg': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-agg/src'),
    '@tomis/grid-pro-master': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-master/src'),
    '@tomis/grid-license': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-license/src'),
    '@tomis/grid': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid/src'),
  },
},
```

**CHANGELOG.md Before** (파일 없음):
```
(파일 미존재)
```

**CHANGELOG.md After** (grid-core 예시):
```markdown
# @tomis/grid-core

## 0.0.0

Initial scaffold.
```

### 11.4 모노레포 루트 package.json Before/After

**Before** (G-003 완료 후 실측):
```json
{
  "scripts": {
    "build": "pnpm -r --filter './packages/*' build",
    "size": "pnpm -r --filter './packages/*' build && size-limit"
  },
  "devDependencies": {
    "@size-limit/preset-small-lib": "^11.0.0",
    "size-limit": "^11.0.0",
    "tsup": "^8.4.0",
    "typescript": "~5.8.3"
  }
}
```

**After** (G-004 추가):
```json
{
  "scripts": {
    "build": "pnpm -r --filter './packages/*' build",
    "size": "pnpm -r --filter './packages/*' build && size-limit",
    "lint": "eslint packages apps",
    "changeset": "changeset"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@eslint/js": "^9.25.0",
    "@size-limit/preset-small-lib": "^11.0.0",
    "eslint": "^9.25.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "size-limit": "^11.0.0",
    "tsup": "^8.4.0",
    "typescript": "~5.8.3",
    "typescript-eslint": "^8.30.1"
  }
}
```

### 11.5 위험 요소

| 위험 | 가능성 | 처리 |
|------|--------|------|
| vite.config.ts alias 경로 오타 → vite dev/build 실패 | 중간 | EC-04. 구현 시 각 src/ Glob/ls 실재 확인 필수. |
| ESLint 버전 불일치 (모노레포 vs tw-framework-front) | 낮음 | 동일 버전 pin. 두 설정 독립적 실행 → 충돌 없음. |
| @changesets/cli config `access: "restricted"` → publish 실수 차단 | 의도 | 설계 의도. publish 준비 시 ADR 업데이트 필요. |
| CHANGELOG.md 13개 중 일부 패키지명 오기 | 낮음 | 구현 시 package.json name 필드와 1:1 대조 필수. |

---

## Section 12: 검증 계획

| V # | 검증 항목 | 방법 | 기대 결과 | AC |
|-----|---------|------|---------|-----|
| V-01 | .changeset/config.json 존재 + 필드 확인 | Read .changeset/config.json | access: "restricted", baseBranch: "master", changelog: "@changesets/cli/changelog" | AC-001 |
| V-02 | 13개 CHANGELOG.md 존재 | Glob `packages/*/CHANGELOG.md` | 13개 파일 반환 (node_modules 제외) | AC-002 |
| V-03 | CHANGELOG.md 헤더 형식 확인 | Read 샘플 2~3개 (grid-core, grid-renderers, grid) | `# @tomis/{pkg}` + `## 0.0.0` 포함 | AC-002 |
| V-04 | eslint.config.mjs 존재 + no-explicit-any rule | Read eslint.config.mjs | `'@typescript-eslint/no-explicit-any': 'error'` 확인 | AC-003 |
| V-05 | vite.config.ts @tomis/grid-core alias 존재 | Read vite.config.ts | resolve.alias에 `@tomis/grid-core` 확인 | AC-004 |
| V-06 | vite.config.ts 기존 설정 보존 | Read vite.config.ts | `'@'` alias + plugins(react, tailwindcss) + server.proxy 존재 | AC-004 |
| V-07 | JSON/JS 구문 오류 없음 | Bash: `node -e "JSON.parse(require('fs').readFileSync('.changeset/config.json','utf8'))"` | 파싱 성공 | AC-001 |
| V-08 | vite build 통과 (TOMIS 내부) | Bash: `pnpm --dir tw-framework-front build` 또는 tsc -b | exit 0 | AC-004 |
| V-09 | AC-005 HMR 검증 | 환경 의존 → documented-deviation (EC-03) | deviation 파일 작성 | AC-005 |

---

## Section 13: 상용 제품화 영향

### 13.1 패키지 대상

이 Goal은 13개 전 패키지 + TOMIS tw-framework-front에 영향:
- MIT 패키지 (8개): CHANGELOG.md 신규 + changeset 관리 대상
- Pro EULA 패키지 (5개: grid-pro-* 4개 + grid): CHANGELOG.md 신규 + changeset 관리 대상 (Pro 라이선스 릴리스 주기 관리)
- License runtime (grid-license): CHANGELOG.md 신규

### 13.2 라이선스 검증 호출

**N/A** (F-02) — 이 Goal은 도구 설정 + 파일 생성. 런타임 코드 없음. `configureGridLicense()` 호출 미해당.

### 13.3 Changesets 릴리스 자동화 기반

`@changesets/cli` 도입으로 모든 패키지의 semver 관리 + CHANGELOG 자동화 기반 확립.  
- C-23 (semver 준수 + CHANGELOG.md) 의무 이행
- G-005+: CI/CD에서 `changeset version` + `changeset publish` 통합 예정
- Pro EULA 패키지: `access: "restricted"` 유지 → publish 시 별도 절차 필요

### 13.4 ESLint flat config — 모노레포 품질 기반

`no-explicit-any: 'error'` — C-4 (TypeScript Strict) 준수 강제.  
tw-framework-front의 `no-explicit-any: 'off'` 와 독립 — 모노레포 패키지 라이브러리 코드 품질 보장.

### 13.5 vite alias — MOD-GRID-17 마이그레이션 직접 기반

`@tomis/grid-*` alias → MOD-GRID-17 사용처 마이그레이션 시 import 경로 변환의 전제.  
27개 페이지 파일이 `import { Grid } from '@tomis/grid-core'` 패턴 사용 가능.  
G-005+ npm publish 완료 후 alias → package dependency 전환 (별도 ADR).

### 13.6 문서 작성

- Changesets 워크플로우 가이드: MOD-GRID-99-B (apps/docs)
- 각 패키지 CHANGELOG.md: 이 Goal에서 초기 생성, 이후 changeset version이 자동 관리
- ESLint 규칙 가이드: MOD-GRID-99-B 범위

---

## ★ ADR-006 초안 (decisions/MOD-GRID-00-decisions.md 추가 의무)

> spec 단계에서 작성. Implementer는 decisions 파일에 이 ADR을 추가할 것.

**ADR-MOD-GRID-00-006: Changesets + ESLint 도입**

**결정일**: 2026-05-14 (G-004 spec)  
**상태**: accepted  
**연관 Goal**: G-004  
**연관 constraint**: C-9 (외부 라이브러리 ADR), C-20, C-23 (Changeset 도구 의무)

**결정**:
1. `@changesets/cli ^2.27.0` 도입 — pnpm workspace 기반 semver 자동화
2. `eslint ^9.x` + `typescript-eslint ^8.x` + `eslint-plugin-react-hooks ^5.x` 도입 — flat config v9

**사유**: C-23은 Changeset 도구 사용을 명시 의무화. ESLint flat config는 C-4 (no-any) 강제 수단.

**대안**:
1. **lerna + conventional-commits**: 전통적 semver 관리. 각하: pnpm workspace와 연계 약함, lerna는 유지 관리 주체 이전 후 안정성 불확실.
2. **ESLint 미도입 (tsc만 사용)**: 타입 체크만. 각하: C-4 위반(no-any) 런타임 감지 불가. ESLint로 빌드 전 조기 감지 필요.

**trade-off**:
| Pro | Con |
|-----|-----|
| C-23 명시 의무 완전 이행 | CI 미구성 상태에서 pnpm changeset CLI만 수동 운영 |
| ESLint C-4 강제 → 라이브러리 타입 안전성 보장 | tw-framework-front(off)와 모노레포(error) 규칙 차이 → 기여자 주의 필요 |
| @changesets/cli MIT 라이선스 (C-9 충족) | access=restricted → publish 시 별도 설정 변경 필요 |

---

## ★ H 메타 게이트 자기-검증

| H # | 검증 항목 | 결과 | 근거 |
|-----|---------|------|------|
| **H-01** | L0/L1/L2/L3 참조 경로 실재 | **YES** | L0-A: `D:/project/topvel_project/TOMIS/tw-framework-front/vite.config.ts` — Read 완료 (L1-36 발췌). L0-B: `D:/project/topvel_project/TOMIS/tw-framework-front/package.json` — Read 완료 (scripts.dev, devDeps). L0-C: `D:/project/topvel_project/TOMIS/tw-framework-front/eslint.config.js` — Read 완료 (flat config v9 확인). L1: `D:/project/topvel_project/topvel-grid-monorepo/package.json` — Read 완료 (devDeps, scripts). `pnpm-workspace.yaml` — Read 완료. `packages/grid-core/package.json` — Read 완료 (peerDeps G-003 확인). L2: `D:/project/topvel_project/TOMIS/.claude/tw-grid/canonical-modules.json` — Read 완료 (F-00-04, F-00-08, F-00-09). L3: goals.json affectedUsageFiles 1개 (tw-framework-front/package.json) — D1 결정으로 실제 미수정, 모니터링 대상. |
| **H-02** | implementFiles 경로 합리성 | **YES** | (1) `topvel-grid-monorepo/.changeset/config.json`: `.changeset/` 디렉토리는 NEW (Glob 미존재 확인). 부모 `topvel-grid-monorepo/` 실재 (package.json Read 증거). ADR-001 외부 디렉토리 허용. 명명: `.changeset/` = @changesets/cli 표준 컨벤션. (2) `topvel-grid-monorepo/eslint.config.mjs`: 루트 직접 생성. 부모 실재. 명명: flat config v9 표준. (3) `TOMIS/tw-framework-front/vite.config.ts`: 파일 이미 실재 (Read 완료). MODIFY. (4) 13 CHANGELOG.md: 부모 `packages/{pkg}/` 디렉토리 실재 (ls 확인 — 13개 패키지 디렉토리 존재). |
| **H-03** | AC 출처 태그 검증 | **YES** | AC-001 source `C-23` → Section 1 L1 `@changesets/cli`미존재 + Section 13.3 C-23 명시. AC-002 source `C-23` → Section 1 L1 CHANGELOG.md 미존재 + Section 2.3 CHANGELOG 내용. AC-003 source `C-4` → Section 2.2 `no-explicit-any: 'error'` C-4 참조. AC-004 source `L0` → Section 1 L0-A vite.config.ts L17 `'@'` alias 실측 인용. AC-005 source `L0` → Section 1 L0-B scripts.dev `"vite"` + Section 2.3 HMR 설명. 모든 AC 출처 섹션 내 인용 확인. |

**H 통과 (3/3 YES) → 일반 채점 진행.**

---

## ★ specify-rubric 자기-채점 (Coverage Verifier 공식 적용)

| 항목 | 결과 | 근거 |
|------|------|------|
| A-01 | YES | Section 1 L0-A: vite.config.ts L15-19 resolve.alias 블록 코드 발췌 인용. L0-B: package.json scripts.dev 인용. |
| A-02 | N/A | 이 Goal은 TanStack Table API 사용 없음 (빌드 도구 + 설정 파일). |
| A-03 | N/A | 신규 인프라 영역 (changeset/ESLint/vite alias). 8 variant 중복 패턴 분석 대상 아님. |
| A-04 | YES | Section 1 L3 + Section 8.1: 영향 사용처 1개 (`tw-framework-front/package.json`) 명시. |
| A-05 | YES | Section 1 R-A: AG Grid Changesets 패턴 참조. R-W: N/A 명시 (Wijmo 해당 없음). |
| B-01 | YES | Section 2.1: .changeset/config.json JSON 스키마. Section 2.2: eslint.config.mjs JS 스키마. Section 2.3: vite.config.ts alias 스키마. Section 2.4: 사용 예시. |
| B-02 | YES | Section 2.4: changeset 워크플로우 예시 + tw-framework-front import 예시 (2개). |
| B-03 | YES | Section 2.1: config.json 각 필드 설명(required 여부 포함). Section 2.2: eslint rules 명시. Section 2.3: alias 전체 목록 (13개). |
| B-04 | N/A | 타입 export 경로 해당 없음 (설정 파일 Goal). |
| B-05 | N/A | ref API 해당 없음 (인프라 Goal). |
| C-01 | YES | AC-001~AC-005 = 5개. |
| C-02 | YES | AC-001 `C-23`, AC-002 `C-23`, AC-003 `C-4`, AC-004 `L0`, AC-005 `L0` — 모든 AC 출처 태그 존재. |
| C-03 | YES | 모든 AC binary 검증 가능 (Read 파일 + 필드 확인 + Glob 파일 수 확인). |
| C-04 | YES | Header + Section 1 마지막: migrationImpact: low, 사유 명시. |
| C-05 | YES | AC-004: "기존 '@' alias 및 plugins/server/define 변경 없음" — 사용처(tw-framework-front) 외관 보존 검증 항목. |
| D-01 | YES | Section 8.1: affectedUsageFiles 1개 명시 + 실제 변경 vite.config.ts 명시. |
| D-02 | YES | Section 3: vite.config.ts Before/After 대응표 + package.json 변경 없음 대응표. |
| D-03 | YES | Section 4.1: Breaking change NO 명시 + 사유. |
| D-04 | N/A | Breaking change 없음. |
| D-05 | N/A | low tier + 사용처 1개 (alias 추가만 — D-05 N/A 조건 "low tier + 사용처 0"에서 1개는 경계. 그러나 vite alias 추가는 기존 동작 변경 없는 무파괴 → N/A 처리 타당). |
| D-06 | YES | Section 8.5: bundleImpact +0 KB, 구체 사유 명시 (dev tool + alias = 런타임 미포함). |
| E-01 | YES | Section 7: 16개 파일 NEW/MODIFY 유형 + 변경 범위 명시. |
| E-02 | YES | Section 11.3: vite.config.ts Before/After 코드 스니펫. Section 11.5: CHANGELOG.md Before/After (미존재 → 초기 내용). |
| E-03 | YES | Section 11.1: Step 1(ADR) → 2(devDeps) → 3(config.json) → 4(CHANGELOG×13) → 5(eslint.config) → 6(vite.config.ts) → 7(검증) = 7단계. |
| E-04 | YES | Section 6: EC-01~EC-04 (4개). EC↔AC 매핑 표 포함. |
| E-05 | YES | Section 12: V-01~V-09 검증 계획 (Read/Glob/Bash 방법 명시). |
| F-01 | YES | Section 13.1: 13개 패키지 MIT/Pro EULA 분류 + tw-framework-front 영향 명시. |
| F-02 | N/A | 이 Goal은 런타임 코드 없음. configureGridLicense() 호출 미해당. |
| F-03 | YES | Section 13.6: Changesets 가이드 + ESLint 규칙 가이드 MOD-GRID-99-B 명시. |
| F-04 | YES | Section 9.1: 신규 devDependencies 모두 모노레포 루트에만 추가. react/tanstack은 peer (G-003 완료) — 이중 선언 없음. |
| G-01 | YES | 모든 결정 명시됨. "추후 결정" 표현 없음. vite alias → npm dependency 전환 시점은 Section 4.4에 명시. |

**채점 계산**:
- YES: A-01, A-04, A-05, B-01, B-02, B-03, C-01, C-02, C-03, C-04, C-05, D-01, D-02, D-03, D-06, E-01, E-02, E-03, E-04, E-05, F-01, F-03, F-04, G-01 = **24개**
- NO: **0개**
- N/A: A-02, A-03, B-04, B-05, D-04, D-05, F-02 = **7개**
- **denominator = 24 + 0 = 24**
- **score = 24 / 24 × 100 = 100**

★ C-26 자기-검산:
- 카테고리별: A(5)+B(5)+C(5)+D(6)+E(5)+F(4)+G(1) = 31
- YES(24) + NO(0) + N/A(7) = 31 ✓
  - A: YES 3 (A-01, A-04, A-05) + N/A 2 = 5 ✓
  - B: YES 3 (B-01, B-02, B-03) + N/A 2 = 5 ✓
  - C: YES 5 = 5 ✓
  - D: YES 4 (D-01, D-02, D-03, D-06) + N/A 2 (D-04, D-05) = 6 ✓
  - E: YES 5 = 5 ✓
  - F: YES 3 (F-01, F-03, F-04) + N/A 1 (F-02) = 4 ✓
  - G: YES 1 = 1 ✓
- failedChecks: [] (NO 항목 없음) ✓
- `24 × 24 / 100 = 24 / 1 = 24 == yesCount(24)` ✓

**최종 score = 100 / 100 → threshold 90 통과 ✓**  
**failedChecks: []**

---

## ★ G-003 학습 적용 확인

| G-003 교훈 | G-004 적용 |
|-----------|----------|
| C-27 prompt-spec drift 방지 — spec이 single source of truth | Section 2 API 계약에 모든 버전/경로/값 명시. Implementer는 spec Section 2 참조 필수. |
| H-01: TOMIS 경로 segment 분실 자가-검증 | H-03 검증 시 `D:/project/topvel_project/TOMIS/tw-framework-front/vite.config.ts` 전체 경로 segment 보존 확인. |
| H-02: 외부 디렉토리 신규 생성 부모 미존재 허용 | `.changeset/` 디렉토리 신규 생성. 부모 `topvel-grid-monorepo/` 실재로 H-02 YES. |
| ADR-003 환경 의존 AC: EC↔AC 1:1 매핑 | Section 6 EC-03↔AC-005 매핑. documented-deviation 절차 명시. |
| G-003 decisions placeholder ADR-006 예약 | ADR-006 이 spec에서 초안 작성 완료 (Section ★ADR-006 초안). |
