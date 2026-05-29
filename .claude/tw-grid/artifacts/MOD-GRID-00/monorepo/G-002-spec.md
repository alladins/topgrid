# G-002 Specification — tsup + TypeScript strict + 공유 tsconfig.base.json (CJS+ESM dual)

**Module**: MOD-GRID-00 (모노레포 스캐폴딩 + 패키지 분할 + size-limit + Changesets)  
**Goal**: G-002  
**Area**: monorepo  
**Phase**: infra  
**Priority**: P0  
**migrationImpact**: low  
**threshold**: 90  
**spec 작성일**: 2026-05-13  
**spec 버전**: v1.0 (첫 시도)  
**dependsOn**: MOD-GRID-00/G-001

---

## ★ 사전 결정 (5개 — 구현 전 고정)

| # | 결정 | 선택 | 사유 |
|---|------|------|------|
| D1 | `exports` 맵 채우기 | **G-002에서 포함** | CJS+ESM dual은 exports 맵 없이 consumer 해석 불가. AC-002 검증 대상. |
| D2 | tsup + typescript 설치 위치 | **루트 devDependencies** | pnpm hoist → `pnpm -r exec tsc` 각 패키지에서 동작. `pnpm.catalogs` 또는 root-level hoisting 사용. |
| D3 | `apps/docs` `pnpm -r build` 처리 | **`"build": "echo skipped — G-99-B targets Docusaurus"` 추가** | exit 0 유지. `--filter` 필터 없이도 AC-003 단순화. |
| D4 | Pro vs MIT tsup 옵션 차이 | **동일 tsup 설정 사용** | 라이선스 분리는 `license` 필드 + EULA.md에서 처리. d.ts는 Pro도 필수. 별도 bannerComment 추가는 미래 옵션. |
| D5 | G-001에서 `scripts.build = "echo TODO (G-003에서 tsup 적용)"` 정정 | **G-002에서 MODIFY** | G-003 참조는 오기. `"build": "tsup"` 으로 교체 (13개 packages/grid-* + apps/docs 포함). |

---

## Section 1: 참조 추적

### L0: 현 구현 (tw-framework-front tsconfig)

**파일 1**: `D:/project/topvel_project/TOMIS/tw-framework-front/tsconfig.app.json`  
**Read 확인**: 2026-05-13

현 프론트엔드 strict 설정 (L0 기준):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": false,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**L0 → G-002 정책 delta (의도적 강화)**:

| 항목 | tw-framework-front (앱) | topvel-grid-monorepo (라이브러리) | 사유 |
|------|------------------------|----------------------------------|------|
| `strict` | `true` | `true` | 동일 |
| `noImplicitAny` | `false` | **`true`** | 라이브러리 코드는 앱보다 strict — 소비자 타입 안전성 보장 |
| `skipLibCheck` | `true` | **`false`** | C-12 명시 금지 — 라이브러리 d.ts 오류를 숨기면 consumer 빌드 실패 |
| `exactOptionalPropertyTypes` | 미설정 | **`true`** | AC-001 요구 (C-4 기반) |
| `moduleResolution` | `bundler` | **`bundler`** | tsup + dual format 호환 |
| `noEmit` | `true` (앱) | **미설정** (tsup이 emit) | tsup이 dist/ 산출 담당 |

**파일 2**: `D:/project/topvel_project/TOMIS/tw-framework-front/tsconfig.json`  
참조 파일 (`tsconfig.app.json`, `tsconfig.node.json` 조합). `moduleResolution: "node"` + `esModuleInterop: true` (루트).

**파일 3**: `D:/project/topvel_project/TOMIS/tw-framework-front/package.json`  
`"typescript": "~5.8.3"` — G-002에서 동일 메이저 버전 사용.

### L1: canonical-modules.json (G-002 관련 항목)

**파일**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/canonical-modules.json`  
**Read 확인**: 2026-05-13

MOD-GRID-00 expectedFeatures:
- **F-00-05** (`"tsup 또는 vite 빌드 파이프라인 (CJS+ESM dual)"`, P0) — 이 Goal 핵심 범위
- **F-00-07** (`"TypeScript strict + 공유 tsconfig.base.json"`, P0) — 이 Goal 핵심 범위

G-002 범위 외:
- F-00-03 size-limit (G-003), F-00-04 Changesets (G-003), F-00-06 peerDependencies (G-003), F-00-08 ESLint, F-00-09 alias (G-004)

**TanStack table-core CJS+ESM 패키지 패턴 (참조)**:  
`@tanstack/react-table@8.21.3` — ESM (`dist/esm/index.js`) + CJS (`dist/cjs/index.cjs`) + d.ts (`dist/esm/index.d.ts`) dual 산출. 이 Goal의 tsup 설정의 구조적 참조.

### L2: G-001 산출 (빌드 전제)

**G-001 검증 완료 (Glob 확인)**: 2026-05-13  
- `D:/project/topvel_project/topvel-grid-monorepo/` — 실재
- 13 packages `package.json` — 실재 (Glob 16개 파일 + pnpm-lock.yaml)
- `"scripts": { "build": "echo TODO (G-003에서 tsup 적용)" }` — G-002에서 **MODIFY** 대상 (D5 결정)
- `"exports": {}` — G-002에서 **MODIFY** 대상 (D1 결정)
- `"main/module/types"` 경로는 `./dist/index.cjs` / `./dist/index.mjs` / `./dist/index.d.ts` 패턴 **이미 설정됨** (grid-core, grid 메타 확인) — tsup 출력과 일치

### L3: 의존 모듈 (사용처)

`affectedUsageFiles: []` — 0개.  
이 Goal은 빌드 인프라. 런타임 소비자 파일 변경 없음.

### R-A: AG Grid CJS+ESM dual 패턴 (참조용 — 코드 차용 X)

AG Grid Community는 monorepo에서 각 패키지별 `rollup` 빌드 (CJS + ESM + d.ts). `@ag-grid-community/core/dist/cjs/` + `dist/esm/`. 패키지별 `tsconfig.lib.json`을 상속하는 패턴. G-002 tsup 선택과 동일 목표.

### R-W: Wijmo CJS+ESM 패턴 (참조용 — 코드 차용 X)

Wijmo 5.x는 `wijmo.js` (UMD) + `wijmo.esm.js` (ESM) 별도 파일. 빌드 도구는 내부용. 라이브러리 구분 참조만.

### migrationImpact: low (사유)

topvel-grid-monorepo 내부 빌드 인프라 추가. TOMIS 기존 코드베이스(`tw-framework-front`, `tvcom_back`) 파일 **변경 없음**. TOMIS 빌드 영향 0. dist/ 산출은 신규 생성.

---

## Section 2: API 계약 (빌드 인프라 스키마)

### 2.1 tsconfig.base.json 스키마

**파일**: `D:/project/topvel_project/topvel-grid-monorepo/tsconfig.base.json` (NEW)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

**특이사항**:
- `skipLibCheck: false` — C-12 명시 금지. 우회 없음.
- `noEmit` **미포함** — 각 패키지 tsconfig.json에서 tsc type-check 전용 시 `"noEmit": true` 추가.
- `isolatedModules: true` + `verbatimModuleSyntax: true` — tsup 빌드와 타입 import 규칙 일치.

### 2.2 각 패키지 tsconfig.json 스키마

**파일**: `D:/project/topvel_project/topvel-grid-monorepo/packages/{pkg}/tsconfig.json` (NEW × 13)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": false,
    "noEmit": true
  },
  "include": ["src/**/*"]
}
```

**`noEmit: true` 이유**: tsup이 dist/ 산출 담당. `tsc --noEmit`은 type-check 전용.  
**C-12**: `tsc --noEmit` 0 errors가 검증 기준. tsup이 별도로 d.ts 산출.

### 2.3 tsup.config.ts 스키마 (각 패키지 동일)

**파일**: `D:/project/topvel_project/topvel-grid-monorepo/packages/{pkg}/tsup.config.ts` (NEW × 13)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: [
    'react',
    'react-dom',
    '@tanstack/react-table',
    '@tanstack/react-virtual',
    // 미래 MOD-GRID-06+ 패키지 번들 bloat 방지 (미설치 시 treeshake로 제거되므로 무해)
    'xlsx',
    'jspdf',
    '@dnd-kit/core',
    '@tanstack/react-query',
  ],
});
```

**옵션 설명**:
- `format: ['cjs', 'esm']` — AC-002 (C-12). dist/index.cjs + dist/index.mjs 산출.
- `dts: true` — dist/index.d.ts 산출 (AC-002).
- `sourcemap: true` — AC-002.
- `clean: true` — 빌드 전 dist/ 초기화.
- `splitting: false` — 패키지 단일 파일 출력 (단순성).
- `external` — C-22 peerDependencies와 동일 목록(react, react-dom, @tanstack/*) + 미래 MOD-GRID-06+ 예상 peer(xlsx, jspdf, @dnd-kit/core, @tanstack/react-query). 미설치 라이브러리는 tsup이 tree-shake로 제거하므로 현 시점 무해. 번들 bloat 방지 목적.

**Pro vs MIT 동일 설정** (D4 결정) — 라이선스 분리는 package.json `license` 필드에서 처리.

### 2.4 package.json MODIFY 스키마 (exports 맵 + scripts.build)

**13개 packages/* 각각에 MODIFY**:

**MIT 패키지 exports 예 (grid-core)**:
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "test": "echo TODO"
  }
}
```

**apps/docs MODIFY**:
```json
{
  "scripts": {
    "build": "echo skipped — G-99-B targets Docusaurus",
    "dev": "echo TODO"
  }
}
```

**D3 결정**: `pnpm -r build` 실행 시 apps/docs는 `echo` + exit 0.

### 2.5 루트 devDependencies 추가 스키마

**파일**: `D:/project/topvel_project/topvel-grid-monorepo/package.json` (MODIFY)

```json
{
  "devDependencies": {
    "tsup": "^8.4.0",
    "typescript": "~5.8.3"
  },
  "scripts": {
    "build": "pnpm -r --filter './packages/*' build",
    "typecheck": "pnpm -r --filter './packages/*' exec tsc --noEmit"
  }
}
```

**D2 결정**: root-level devDependencies → pnpm hoist → 각 패키지 `tsup` 실행 가능.  
`tsup` MIT 라이선스. `typescript` MIT 라이선스. C-9 준수.

### 2.6 최소 src/index.ts 스키마 (빌드 시연용)

**파일**: `D:/project/topvel_project/topvel-grid-monorepo/packages/{pkg}/src/index.ts` (NEW × 13)

```typescript
// @tomis/{pkg} — placeholder. 실제 구현은 MOD-GRID-01+ Goals에서.
export {};
```

**의도**: tsup에 entry point가 필요. `export {}` — strict 모드에서 오류 없는 최소 모듈.

---

## Section 3: 기존 사용처 대응표

**영향 사용처 0개** — 빌드 인프라 추가, 기존 API 변경 없음.

| 기존 | 신규 | 액션 | 담당 Goal |
|------|------|------|----------|
| `"build": "echo TODO"` (13 패키지) | `"build": "tsup"` | MODIFY | **G-002** (D5) |
| `"exports": {}` (13 패키지) | exports 맵 채움 | MODIFY | **G-002** (D1) |
| (src/ 없음) | `src/index.ts` export {} | NEW | G-002 |
| tw-framework-front import `@tomis/*` | workspace alias 연결 | alias 추가 | G-004 |

---

## Section 4: 호환성 정책

- **breaking**: false — 신규 파일 + package.json 필드 추가. 기존 TOMIS 코드 변경 없음.
- **G-001 호환성**: package.json의 `name`, `version`, `license`, `main`, `module`, `types` 필드 **보존**. `scripts.build` + `exports` + `scripts.typecheck`만 MODIFY.
- **deprecationStrategy**: N/A (기존 public API 없음 — 빈 패키지).
- **peerDependencies (C-22)**: 이 Goal의 tsup.config.ts `external`은 peer 선언의 **빌드 측 반영**. 실제 peerDependencies 선언은 G-003. 충돌 없음.
- **semver (C-23)**: 전 패키지 `version: "0.0.0"` 유지 (Changesets 도입 G-003).
- **ADR 의무 (C-9, C-20)**: tsup 신규 dependency 도입 → `decisions/MOD-GRID-00-decisions.md` ADR-MOD-GRID-00-005 작성 완료 (spec 단계). typescript는 언어 자체이므로 별도 ADR 불필요.

---

## Section 5: 인수 기준

| ID | 기준 | 검증 방법 | 출처 |
|----|------|----------|------|
| AC-001 | `tsconfig.base.json` — `strict: true`, `noImplicitAny: true`, `exactOptionalPropertyTypes: true` 모두 포함 | `tsconfig.base.json` Read + 3 필드 확인 | C-4 (TypeScript Strict — No `any`) |
| AC-002 | 각 패키지 `tsup.config.ts` — `format: ['cjs','esm']`, `dts: true`, `sourcemap: true` | 13 `tsup.config.ts` Read + 3 속성 확인 | F-00-05 (L1) |
| AC-003 | `pnpm -r build` 후 모든 packages/* dist/ 산출 (index.cjs + index.mjs + index.d.ts) | Glob `packages/*/dist/index.{cjs,mjs,d.ts}` → 39개 파일 확인 | C-12 (빌드 0 errors 필수) |
| AC-004 | `pnpm -r exec tsc --noEmit` 0 error (13 패키지 + 루트) | tsc exit code 0 확인 | C-12 |
| AC-005 | `skipLibCheck: false` 유지 — tsconfig.base.json에 `skipLibCheck: false` 명시 | `tsconfig.base.json` Read → `"skipLibCheck": false` 확인 | C-12 (--skipLibCheck 우회 금지) |

---

## Section 6: 엣지 케이스

### EC-01: 패키지간 cross-import (paths 매핑 필요)

- **시나리오**: `packages/grid-core/src/index.ts`가 `@tomis/grid-renderers`를 import.
  ```typescript
  import { ButtonCell } from '@tomis/grid-renderers'; // ← G-002 단계에서 src/index.ts는 export {}만
  ```
- **G-002 범위 결론**: 현재 모든 src/index.ts는 `export {}` (빈 모듈). cross-package import 없음. tsup `external`에 `@tomis/*` 추가 불필요.
- **future-proofing**: G-002 이후 실제 구현 시 tsup `external: ['@tomis/*']` 추가 + pnpm workspace symlink가 해석. `tsconfig.base.json` `paths`는 불필요 (bundler moduleResolution + workspace).
- **매핑**: AC-003과 직접 관련 — dist/ 산출 오류 시 cross-import 의존성 순서 문제일 가능성.

### EC-02: Pro 패키지 tsup `dts` 포함 여부

- **시나리오**: Pro EULA 패키지에 d.ts를 포함시키지 않으면 TypeScript 소비자가 타입 정보 없음.
- **결론 (D4)**: Pro 패키지도 동일 tsup 설정 (`dts: true`). EULA 제한은 소스 공개 여부이지 타입 공개 여부가 아님. d.ts 제외는 TS 소비자 경험을 파괴.
- **매핑**: → AC-002 (dts: true 일관 적용). EC ↔ AC 매핑 표 참조.

### EC-03: tsup 미설치 (G-001 EC-02 패턴 학습)

- **시나리오**: `pnpm install` 실행 전 또는 `tsup` devDep 미추가 상태에서 빌드 실행 시.
- **처리**: 
  1. `pnpm install` (루트에서) 먼저 실행 필수.
  2. tsup은 루트 devDependencies에 있으므로 pnpm hoist 후 각 패키지에서 접근 가능.
  3. Windows에서 pnpm hoist 기본 동작 (`hoist=true` 기본값): 루트 `node_modules/.bin/tsup` 심볼릭 링크 생성.
- **최소 버전**: tsup 8.x (출력 파일명 `.cjs`/`.mjs` 확장자 지원).
- **매핑**: → AC-003 (pnpm -r build exit 0). 환경 의존 deviation ADR-MOD-GRID-00-003 적용.

### EC-04: `exactOptionalPropertyTypes` 활성 시 기존 코드 호환

- **시나리오**: 향후 MOD-GRID-01+ 구현 시 `prop?: string` + `prop: undefined` 할당 패턴이 컴파일 오류 발생.
  ```typescript
  // exactOptionalPropertyTypes: true 하에서 오류:
  const opts: { label?: string } = { label: undefined }; // ← ERROR
  ```
- **G-002 영향**: src/index.ts가 `export {}`이므로 직접 오류 없음.
- **사전 고지**: Section 11 위험 요소 + MOD-GRID-01 spec에 이 사항 전달 필요.

### EC-05: `pnpm -r build` 실행 시 apps/docs 오류

- **시나리오**: apps/docs에 `scripts.build` 미정의 시 pnpm이 "missing script: build" 오류.
- **처리 (D3)**: apps/docs `package.json`에 `"build": "echo skipped — G-99-B targets Docusaurus"` 추가 (exit 0).
- **매핑**: → AC-003 (pnpm -r build 전체 exit 0 포함).

---

## EC ↔ AC 매핑 표 (G-001 학습 적용)

| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-003 (pnpm -r build exit 0) | EC-03 (tsup 미설치 환경) | 환경 의존 — tsup devDep 설치 전제 |
| AC-003 (dist/ 산출) | EC-05 (apps/docs build 없음) | apps/docs echo 처리 필요 |
| AC-002 (dts: true 일관) | EC-02 (Pro 패키지 dts 포함) | Pro도 동일 tsup 설정 결정 확인 |
| AC-004 (tsc --noEmit 0 errors) | EC-04 (exactOptionalPropertyTypes 활성) | strict 강화 → 향후 코드 영향 사전 고지 |

---

## Section 7: 구현 대상 파일

**H-02 검증**: 모든 implementFiles 부모 디렉토리는 G-001에서 생성됨 (Glob 확인 완료). 외부 디렉토리 예외 조항 **불필요** — 부모 디렉토리 이미 실재.

| # | 파일 경로 | 변경 유형 | 내용 |
|---|----------|---------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/tsconfig.base.json` | NEW | strict + exactOptionalPropertyTypes + skipLibCheck:false |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/package.json` | MODIFY | devDependencies(tsup, typescript) + scripts.build/typecheck 추가 |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/tsconfig.json` | NEW | extends ../../tsconfig.base.json |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/tsup.config.ts` | NEW | format cjs+esm, dts, sourcemap |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | NEW | export {} |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/package.json` | MODIFY | exports 맵 + scripts.build=tsup + scripts.typecheck |
| 7~30 | packages/grid-{renderers,export,features,pro-tracking,pro-range,pro-datamap,pro-merging,pro-header,pro-agg,pro-master,grid-license}/ × 각 4개 파일 | NEW/MODIFY | 동일 패턴 반복 (tsconfig.json, tsup.config.ts, src/index.ts, package.json MODIFY) |
| 31 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid/tsconfig.json` | NEW | 메타 패키지 — 동일 패턴 |
| 32 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid/tsup.config.ts` | NEW | 메타 패키지 — 동일 패턴 |
| 33 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid/src/index.ts` | NEW | 메타 패키지 — export {} (향후 re-export 대상) |
| 34 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid/package.json` | MODIFY | exports 맵 + scripts.build=tsup |
| 35 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/package.json` | MODIFY | scripts.build=echo skipped |

**총계**: 1 NEW (tsconfig.base.json) + 13 NEW (tsconfig.json × 13) + 13 NEW (tsup.config.ts × 13) + 13 NEW (src/index.ts × 13) + 1 MODIFY (root package.json) + 13 MODIFY (package.json exports+scripts × 13) + 1 MODIFY (apps/docs) = **55 파일 작업**

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처

**0개** — 빌드 인프라 추가. TOMIS 기존 코드(`tw-framework-front`, `tvcom_back`) 파일 변경 없음.  
`affectedUsageFiles: []`

### 8.2 무파괴 검증

- `topvel-grid-monorepo/packages/*` 에 파일 추가/수정 (TOMIS git 외부 디렉토리).
- TOMIS `tw-framework-front` 빌드는 이 Goal로 영향받지 않음.
- G-001 산출 (16 package.json + pnpm-lock.yaml) 보존 — `name/version/license/main/module/types` 필드 **변경 없음**. `exports` + `scripts` 필드만 추가.
- **이 Goal은 monorepoRoot 하위 파일만 추가/수정** — 부모 디렉토리는 G-001에서 생성 완료.

### 8.3 점진/일괄

**일괄** 55 파일 작업 (1 Goal). 각 패키지 파일은 상호 독립적 패턴. 배치 처리 가능.

### 8.4 롤백

```powershell
# tsconfig.base.json + 각 패키지 신규 파일만 제거 (G-001 산출 보존)
Remove-Item "D:\project\topvel_project\topvel-grid-monorepo\tsconfig.base.json"
Get-ChildItem "D:\project\topvel_project\topvel-grid-monorepo\packages" -Directory |
  ForEach-Object {
    Remove-Item "$($_.FullName)\tsconfig.json" -ErrorAction SilentlyContinue
    Remove-Item "$($_.FullName)\tsup.config.ts" -ErrorAction SilentlyContinue
    Remove-Item "$($_.FullName)\src" -Recurse -ErrorAction SilentlyContinue
  }
# package.json MODIFY 롤백: G-001 스키마로 복원 (exports:{}, scripts.build: "echo TODO")
```

TOMIS git 무영향. G-001 산출 보존.

### 8.5 번들 영향

**런타임 +0 KB** — 이 Goal의 src/index.ts는 `export {}`만. dist/ 산출은 신규이지만 기존 번들(tw-framework-front) 영향 없음.  
**빌드 산출 인프라만**: dist/ 파일은 향후 MOD-GRID-01+ 구현 시 채워짐.  
C-21 한도 적용 시점: dist/ 실제 코드 포함 이후 (G-003+).

---

## Section 9: 의존성

### 이 Goal의 신규 의존성

| 항목 | 버전 | 라이선스 | 위치 | ADR |
|------|------|---------|------|-----|
| `tsup` | `^8.4.0` | MIT | root devDependencies | ADR-MOD-GRID-00-005 (C-9 — G-002 spec 단계에서 작성 완료) |
| `typescript` | `~5.8.3` | Apache-2.0 | root devDependencies | 별도 ADR 불필요 — typescript는 언어 자체로 선택 대안 없음. 버전은 `tw-framework-front/package.json` `"typescript": "~5.8.3"` 에서 pin (L0 근거). |

**C-9 의무**: tsup 신규 dependency → `decisions/MOD-GRID-00-decisions.md`에 ADR-MOD-GRID-00-005 작성 완료 (spec 단계).  
**typescript ADR 불필요**: typescript는 도구 선택(tsup vs rollup vs vite)이 아닌 언어 자체 — 별도 ADR 대상 아님. 버전 pin은 tw-framework-front L0 기준 (~5.8.3) 따름.  
**ADR-006 충돌 주의**: `decisions/MOD-GRID-00-decisions.md`의 ADR-MOD-GRID-00-006 placeholder는 **G-003 Changesets** 용도로 예약됨. G-002는 ADR-005만 추가.  
**라이선스 확인**: tsup MIT, typescript Apache-2.0 — C-9 허용 목록(MIT/Apache 2.0/BSD/ISC) 충족.

### peerDependencies

이 Goal의 tsup.config.ts `external` 목록은 peer의 빌드 측 반영. 실제 `peerDependencies` 선언은 G-003에서. 충돌 없음.

---

## Section 10: 사용자 여정

### 패키지 개발자 여정 (구현 후)

1. `cd D:/project/topvel_project/topvel-grid-monorepo`
2. `pnpm install` (루트 devDependencies에서 tsup + typescript 설치)
3. `pnpm -r build` 실행
   - 각 packages/grid-*: `tsup` → `dist/index.cjs` + `dist/index.mjs` + `dist/index.d.ts` 생성
   - apps/docs: `echo skipped` → exit 0
4. `pnpm -r exec tsc --noEmit` → 0 errors (src/index.ts가 `export {}` — 타입 오류 없음)
5. 이후 MOD-GRID-01 구현 시 `src/index.ts`에 실제 코드 추가 → 재빌드

### Consumer 여정 (G-004 이후)

1. tw-framework-front에서 `import { Grid } from '@tomis/grid-core'` → vite alias → `packages/grid-core/src/index.ts`
2. 실제 npm 배포 시 `exports.import` → `dist/index.mjs`, `exports.require` → `dist/index.cjs` 해석.

---

## Section 11: 구현 계획

### 구현 순서

**Step 1: ADR 작성 (tsup 신규 dependency)**

`decisions/MOD-GRID-00-decisions.md`에 ADR-MOD-GRID-00-005 (tsup vs rollup vs vite 빌드 도구 선택) — **spec 단계에서 작성 완료**.  
C-9, C-20 의무 충족. Implementer는 ADR 추가 작업 불필요.

**typescript ADR 생략 사유**: typescript는 도구 선택이 아닌 언어 자체 — C-9 ADR 대상 아님. 버전은 L0(`tw-framework-front/package.json "typescript": "~5.8.3"`) pin 근거 있음.

**⚠️ ADR-006 예약 번호 확인**: `decisions/MOD-GRID-00-decisions.md` placeholder에 ADR-006은 **G-003 Changesets** 용도. G-002는 ADR-005만 사용. G-003 spec writer는 ADR-006으로 Changesets ADR 작성할 것.

---

**Step 2: tsconfig.base.json 생성**

```
D:/project/topvel_project/topvel-grid-monorepo/tsconfig.base.json  [NEW]
```

내용: Section 2.1 스키마 그대로.

**After** (`tsconfig.base.json` 신규):
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": false,
    ...
  }
}
```

**Before** (미존재):
```
(파일 없음)
```

---

**Step 3: 루트 package.json MODIFY (devDependencies + scripts)**

```json
// Before (scripts.build 없음, devDependencies 없음)
{
  "name": "topvel-grid-monorepo",
  "private": true,
  "engines": { "node": ">=18.0.0", "pnpm": ">=8.0.0" }
}

// After
{
  "name": "topvel-grid-monorepo",
  "private": true,
  "engines": { "node": ">=18.0.0", "pnpm": ">=8.0.0" },
  "scripts": {
    "build": "pnpm -r --filter './packages/*' build",
    "typecheck": "pnpm -r --filter './packages/*' exec tsc --noEmit"
  },
  "devDependencies": {
    "tsup": "^8.4.0",
    "typescript": "~5.8.3"
  }
}
```

---

**Step 4: 13 packages/* 배치 작업** (패키지당 4개 파일 작업)

순서 (MIT 먼저 → Pro 후 — G-001 패턴 동일):

```
grid-core, grid-renderers, grid-export, grid-features
grid-pro-tracking, grid-pro-range, grid-pro-datamap, grid-pro-merging
grid-pro-header, grid-pro-agg, grid-pro-master, grid-license, grid(메타)
```

각 패키지:
1. `tsconfig.json` [NEW] — `extends: "../../tsconfig.base.json"`
2. `tsup.config.ts` [NEW] — Section 2.3 스키마
3. `src/index.ts` [NEW] — `export {}`
4. `package.json` [MODIFY] — `exports` 맵 + `scripts.build=tsup` + `scripts.typecheck`

---

**Step 5: apps/docs package.json MODIFY**

`"scripts": { "build": "echo skipped — G-99-B targets Docusaurus" }` 추가.

---

**Step 6: pnpm install 후 빌드 실행**

```powershell
cd D:\project\topvel_project\topvel-grid-monorepo
pnpm install                              # tsup + typescript hoisted 설치
pnpm -r --filter './packages/*' build    # 13 패키지 tsup 빌드
```

---

**Step 7: 검증 (Section 12 V-01~V-05 수행)**

```powershell
pnpm -r --filter './packages/*' exec tsc --noEmit  # 0 errors 확인
```

### Before/After 스니펫 (핵심)

**Before** (grid-core/package.json scripts):
```json
{ "build": "echo TODO (G-003에서 tsup 적용)" }
```

**After** (grid-core/package.json scripts + exports):
```json
{
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

**Before** (grid-core/src — 없음):
```
(src/ 디렉토리 없음)
```

**After** (grid-core/src/index.ts):
```typescript
// @tomis/grid-core — placeholder. 실제 구현은 MOD-GRID-01에서.
export {};
```

### 위험 요소

| 위험 | 가능성 | 처리 |
|------|--------|------|
| `exactOptionalPropertyTypes: true` → MOD-GRID-01+ 구현 시 호환 오류 | 중간 | EC-04 — 향후 spec에 사전 고지 |
| Windows pnpm hoist 미작동 시 tsup 미발견 | 낮음 | `pnpm config get hoist` 확인 (기본 true) |
| tsup 8.x에서 `.cjs` 확장자 기본 출력 | 확인 필요 | tsup 8.x `format: 'cjs'` → 기본 `.cjs`. G-001 package.json main/module 경로와 일치 확인 완료 |
| G-002 범위를 넘어 F-00-03~F-00-08 구현 | 주의 | Implementer 주의: size-limit, Changesets, ESLint, alias는 이 Goal 범위 외 |

---

## Section 12: 검증 계획

### ⭐ vacuous 금지 키워드 활성 (A 카테고리)

이 Goal 제목에 `tsup`, `tsc`, TypeScript `strict` 포함 → **A 카테고리 vacuous 처리 금지** (ADR-MOD-GRID-00-002).  
Verifier는 A 카테고리를 실제 빌드 결과로 검증해야 한다.

### 단위 테스트

src/index.ts는 `export {}`만 — 단위 테스트 없음 (N/A).

### 시각 회귀

N/A — migrationImpact: low + 사용처 0개 (C-17 N/A 조건 해당).

### 빌드 검증 (실제 실행 필수 — vacuous 금지 키워드 활성)

**V-01: tsconfig.base.json 필드 검증 (AC-001)**
```powershell
$base = Get-Content "D:\project\topvel_project\topvel-grid-monorepo\tsconfig.base.json" | ConvertFrom-Json
$opts = $base.compilerOptions
if ($opts.strict -ne $true) { throw "strict 누락" }
if ($opts.noImplicitAny -ne $true) { throw "noImplicitAny 누락" }
if ($opts.exactOptionalPropertyTypes -ne $true) { throw "exactOptionalPropertyTypes 누락" }
Write-Host "V-01 PASS"
```

**V-02: tsup.config.ts 일관성 검증 (AC-002)**
```powershell
# 13개 tsup.config.ts Read + format/dts/sourcemap 필드 확인
Get-ChildItem "D:\project\topvel_project\topvel-grid-monorepo\packages" -Directory |
  ForEach-Object {
    $cfg = Get-Content "$($_.FullName)\tsup.config.ts" -Raw
    if ($cfg -notmatch "cjs.*esm|esm.*cjs") { throw "format 오류: $($_.Name)" }
    if ($cfg -notmatch "dts:\s*true") { throw "dts 오류: $($_.Name)" }
    if ($cfg -notmatch "sourcemap:\s*true") { throw "sourcemap 오류: $($_.Name)" }
  }
Write-Host "V-02 PASS"
```

**V-03: pnpm -r build → dist/ 산출 확인 (AC-003) ⭐ 실제 빌드 실행**
```powershell
cd "D:\project\topvel_project\topvel-grid-monorepo"
pnpm install                                    # exit 0 확인
pnpm -r --filter './packages/*' build           # 각 패키지 tsup 실행

# 39개 파일 (13 × 3) 실재 확인
$expected = @("dist\index.cjs", "dist\index.mjs", "dist\index.d.ts")
Get-ChildItem "packages" -Directory | ForEach-Object {
  $pkg = $_
  foreach ($f in $expected) {
    if (-not (Test-Path "$($pkg.FullName)\$f")) { throw "누락: $($pkg.Name)/$f" }
  }
}
Write-Host "V-03 PASS — 39 dist files confirmed"
```

**V-04: tsc --noEmit 0 errors (AC-004) ⭐ 실제 타입체크 실행**
```powershell
cd "D:\project\topvel_project\topvel-grid-monorepo"
pnpm -r --filter './packages/*' exec tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw "tsc --noEmit 오류 발생" }
Write-Host "V-04 PASS — tsc 0 errors"
```

**V-05: skipLibCheck=false 유지 확인 (AC-005)**
```powershell
$base = Get-Content "D:\project\topvel_project\topvel-grid-monorepo\tsconfig.base.json" | ConvertFrom-Json
if ($base.compilerOptions.skipLibCheck -ne $false) { throw "skipLibCheck 우회 감지" }
# 각 패키지 tsconfig.json이 base.json만 extends하는지 확인 (override 금지)
Get-ChildItem "packages" -Directory | ForEach-Object {
  $cfg = Get-Content "$($_.FullName)\tsconfig.json" | ConvertFrom-Json
  if ($cfg.compilerOptions.skipLibCheck -eq $true) { throw "skipLibCheck 우회: $($_.Name)" }
}
Write-Host "V-05 PASS — skipLibCheck=false 유지"
```

**V-06: TOMIS 기존 빌드 무영향 확인**
```powershell
cd "D:\project\topvel_project\TOMIS\tw-framework-front"
npx tsc --noEmit  # G-002 전후 동일 — 오류 없어야 함
Write-Host "V-06 PASS — TOMIS tw-framework-front 영향 없음"
```

### skipLibCheck=false 준수 확인 (C-12 명시)

V-05가 각 패키지 tsconfig.json에서 `skipLibCheck: true` override 없음을 검증. tsconfig.base.json에 `skipLibCheck: false` 명시적 설정.

---

## Section 13: 상용 제품화 영향

### 분류

인프라 (빌드 파이프라인) — 직접 배포 대상 아님. dist/ 산출은 향후 MOD-GRID-01+ 코드 포함 이후 배포 대상.

**패키지 대상** (F-01 확인):
- MIT 패키지 (grid-core, grid-renderers, grid-export, grid-features): `"license": "MIT"` 유지
- Pro EULA 패키지 (grid-pro-*, grid-license, grid): `"license": "SEE LICENSE IN EULA"` 유지
- 라이선스 필드는 G-001에서 이미 설정. 이 Goal에서 변경 없음.

### 라이선스 검증 (C-24)

| 패키지 그룹 | license 필드 | LICENSE 파일 | 런타임 검증 |
|------------|-------------|-------------|------------|
| MIT (4개) | `"MIT"` (G-001 설정) | G-003에서 `LICENSE` 파일 추가 예정 | 불필요 |
| Pro EULA (9개) | `"SEE LICENSE IN EULA"` (G-001 설정) | G-003에서 `EULA.md` 추가 예정 | MOD-GRID-99-A |
| apps/docs | `"UNLICENSED"` (G-001 설정) | N/A (private) | N/A |

**라이선스 런타임 검증** (`configureGridLicense()`) — N/A (F-02 N/A): MIT 패키지 대상. Pro 런타임 검증은 MOD-GRID-99-A 구현 대상.

### 문서 작성 계획 (C-25)

- 각 패키지 README.md: G-002 범위 외 (MOD-GRID-99-B 또는 각 구현 Goal).
- Storybook story: src/index.ts가 빈 모듈 — 스토리 대상 없음. N/A.
- Docusaurus 빌드 파이프라인 페이지: MOD-GRID-99-B.

### peerDependencies 정책 (C-22, F-04)

tsup.config.ts `external`은 peer의 **빌드 측 반영** (C-22와 일관성). 실제 `peerDependencies` 선언은 G-003.  
이 Goal에서 `react`, `react-dom`, `@tanstack/react-table` 등을 dep으로 추가 없음 — C-22 이중 선언 위반 없음.

---

## ★ 메타 게이트 H 자가 점검 결과

| 항목 | 결과 | Evidence |
|------|------|----------|
| H-01: referenceEvidence 경로 실재 | **YES** | L0: `tw-framework-front/tsconfig.app.json` — Read 완료 (strict:true, noImplicitAny:false, skipLibCheck:true 확인). `tw-framework-front/tsconfig.json` — Read 완료. `tw-framework-front/package.json` — Read 완료 (typescript ~5.8.3). L1: `canonical-modules.json` — Read 완료 (F-00-05 tsup P0 확인). L2: G-001 산출 — Glob 확인 (16 package.json + pnpm-lock.yaml). L3: 사용처 0개 — canonical-modules.json affectedUsageFiles:[] 확인. |
| H-02: implementFiles 경로 합리성 | **YES** | 모든 implementFiles의 부모 디렉토리(`packages/grid-core/`, `packages/grid-renderers/`, ... 등 13개)는 G-001에서 이미 생성 완료 (Glob 확인). 외부 디렉토리 예외 조항 불필요 — 조부모가 아닌 부모 디렉토리 직접 실재. 명명 컨벤션: `packages/{kebab-case}/` (G-001 산출 일치). `tsconfig.base.json`은 `topvel-grid-monorepo/` 루트 직접 생성 (이미 실재). |
| H-03: AC 출처 태그 검증 | **YES** | AC-001 source C-4 → Section 1 L0 "L0 → G-002 정책 delta" + Section 2.1에서 `"noImplicitAny": true` 설명 시 C-4 준수 명시. AC-002 source F-00-05(L1) → Section 1 L1 "F-00-05 tsup 또는 vite 빌드 파이프라인" 직접 인용. AC-003 source C-12 → Section 12 V-03 "실제 빌드 실행" + "C-12 명시 금지". AC-004 source C-12 → Section 12 V-04. AC-005 source C-12 → Section 12 V-05 "skipLibCheck=false 유지 확인 (C-12 명시)". |

---

## G-001 학습 적용 확인

| 학습 항목 | 이번 Spec 적용 |
|----------|--------------|
| EC↔AC 매핑 권장 | Section 6 끝에 EC ↔ AC 매핑 표 포함 (4개 쌍) |
| vacuous 금지 키워드 인지 | Section 12 모두(☆) 표시 + V-03/V-04 실제 빌드/typecheck 실행 명시 |
| Section 8.2에 "부모 디렉토리 생성" 명시 | G-001은 부모 생성 → G-002는 부모 이미 실재 → H-02 직접 YES 처리 |
| advisor 피드백 — exports 맵 G-002에서 채우기 | D1 결정 + Section 2.4 + Section 7 #6 MODIFY 포함 |
| advisor 피드백 — scripts.build echo TODO 정정 | D5 결정 + Section 11 Step 3/4 MODIFY |
| advisor 피드백 — apps/docs pnpm -r build 처리 | D3 결정 + EC-05 + Section 11 Step 5 |
