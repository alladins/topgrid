# G-001 Spec: Docusaurus + TypeDoc API Reference 자동 생성

**Goal ID**: MOD-GRID-99-B / G-001  
**Title**: Docusaurus 사이트 + TypeDoc API reference 자동 생성  
**Status**: DRAFT  
**Spec Writer**: tw-grid Spec Writer  
**Date**: 2026-05-15  
**packageTarget**: `apps/docs`  
**migrationImpact**: low  
**threshold**: 85

---

## D# 결정 테이블

| ID | 결정 | 근거 | 대안 검토 |
|----|------|------|-----------|
| D1 | Section 7 implementFiles는 monorepo prefix 채택 (goals.json TOMIS prefix 정정) — `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/...` | C-28: implementFiles는 반드시 monorepo prefix 사용. goals.json 의 `D:/project/topvel_project/TOMIS/apps/docs/...` 는 discover 단계 생성 오류. spec이 authority. | TOMIS prefix 유지 시 C-28 위반 |
| D2 | Section 7에 `apps/docs/package.json` MODIFY 행 추가 (goals.json 6개 → spec 7개) | AC-002/AC-004 이행 시 Docusaurus/TypeDoc devDeps + `docs:build`/`docs:dev` scripts 추가가 불가피. package.json 수정 없이는 AC 이행 불가. | goals.json 그대로 6개 유지 시 AC-002/004 이행 파일 누락 → E-01 위반 |
| D3 | 정적 사이트 생성기: **Docusaurus v3** 채택 | goals.json title에 "Docusaurus(또는 Nextra)" 명시. Docusaurus는 React 기반 + MDX 지원 + pnpm workspace 호환 + MIT 라이선스. Nextra는 Next.js 의존성 추가 부담. | Nextra 미채택 — Next.js 의존성 과도 |
| D4 | TypeDoc 연동: **docusaurus-plugin-typedoc** (typedoc-plugin-markdown 포함) 채택 | 13개 패키지를 Docusaurus 사이드바와 통합. TypeDoc JSON output + 수동 MDX 변환 대비 자동화 수준 높음. | 수동 MDX 변환 미채택 — 유지비 과도 |
| D5 | Storybook 설정은 **G-002로 위임** (이 Goal 범위 외) | F-03: Docusaurus + Storybook 계획 필요. 그러나 G-001 AC에 Storybook 항목 없음. G-002에서 Storybook 도입 예정. | G-001에 포함 시 범위 초과, AC 근거 없음 |
| D6 | i18n: **단일 로케일 ko** (defaultLocale='ko') | 다국어 지원은 이 Goal AC 범위 외. 추후 G-005 등에서 en 추가 가능. | 다국어 동시 설정 미채택 — 범위 초과 |

---

## Section 1: 참조 추적 (Reference Tracking)

| 계층 | 참조 | 설명 |
|------|------|------|
| L0 | (현 구현 없음) | `apps/docs`는 현재 bare scaffolding (package.json stub만 존재). 기존 Docusaurus 구현 파일 없음. |
| L1 | `D:/project/topvel_project/topvel-grid-monorepo/package.json` | monorepo root — packageManager, engines 확인 |
| L1 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/package.json` | docs 앱 현황 (stub) — MODIFY 대상 확인 |
| L1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/package.json` | @tomis/grid-core — @tomis/ 네임스페이스 + src/index.ts 구조 확인 |
| L2 | (N/A) | publish 레이어 없음 — docs 사이트는 private (apps/docs) |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/*/src/index.ts` | 13개 패키지 TypeDoc entryPoint (grid, grid-core, grid-export, grid-features, grid-license, grid-pro-agg, grid-pro-datamap, grid-pro-header, grid-pro-master, grid-pro-merging, grid-pro-range, grid-pro-tracking, grid-renderers) |
| R-A | AG Grid Docs (https://www.ag-grid.com/react-data-grid/) | 경쟁 레퍼런스: API reference 자동화 수준 |
| R-W | Wijmo Docs (https://developer.mescius.com/wijmo) | 경쟁 레퍼런스: TypeDoc 스타일 API doc |

**전제 파일 확인 목록** (C-1 준수):
1. `D:/project/topvel_project/TOMIS/.claude/tw-grid/constraints.md` — C-1~C-34 제약
2. `D:/project/topvel_project/TOMIS/.claude/tw-grid/rubric/specify-rubric.md` — v1.0.8, 32항목
3. `D:/project/topvel_project/TOMIS/.claude/tw-grid/goals/MOD-GRID-99-B/docs-goals.json` — G-001 정의
4. `D:/project/topvel_project/topvel-grid-monorepo/package.json` — monorepo root
5. `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/package.json` — 패키지 구조 확인
6. `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/package.json` — docs 현황
7. `D:/project/topvel_project/TOMIS/.claude/tw-grid/artifacts/MOD-GRID-00/monorepo/G-001-spec.md` — 레퍼런스 포맷

---

## Section 2: API 계약 (API Contract)

### 2-1. Docusaurus 설정 타입 (TypeScript)

```typescript
// apps/docs/docusaurus.config.ts
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'TOMIS Grid',
  tagline: 'Headless React grid for TOMIS',
  url: 'https://grid.tomis.dev',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'ko',   // D6: 단일 로케일
    locales: ['ko'],
  },
  presets: [
    ['classic', {
      docs: { sidebarPath: './sidebars.ts' },
      blog: false,
      theme: { customCss: './src/css/custom.css' },
    } satisfies Preset.Options],
  ],
  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        // AC-002: 13개 패키지 TypeDoc entryPoints
        entryPoints: [
          '../../packages/grid/src/index.ts',
          '../../packages/grid-core/src/index.ts',
          '../../packages/grid-export/src/index.ts',
          '../../packages/grid-features/src/index.ts',
          '../../packages/grid-license/src/index.ts',
          '../../packages/grid-pro-agg/src/index.ts',
          '../../packages/grid-pro-datamap/src/index.ts',
          '../../packages/grid-pro-header/src/index.ts',
          '../../packages/grid-pro-master/src/index.ts',
          '../../packages/grid-pro-merging/src/index.ts',
          '../../packages/grid-pro-range/src/index.ts',
          '../../packages/grid-pro-tracking/src/index.ts',
          '../../packages/grid-renderers/src/index.ts',
        ],
        entryPointStrategy: 'packages',
        out: 'api',
        sidebar: { categoryLabel: 'API Reference' },
      },
    ],
  ],
};

export default config;
```

### 2-2. sidebars.ts 타입

```typescript
// apps/docs/sidebars.ts
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'getting-started',
    'architecture',
    { type: 'autogenerated', dirName: 'api' },
  ],
};

export default sidebars;
```

### 2-3. 사용 예시

**예시 1: pnpm docs:build 로컬 실행**
```bash
# monorepo root에서
pnpm --filter docs run build
# apps/docs/build/ 생성, 오류 0 (AC-004)
```

**예시 2: TypeDoc API 참조 접근**
```
브라우저: http://localhost:3001/api/grid-core/
→ @tomis/grid-core 의 export된 타입/함수 목록 표시 (AC-002)
```

---

## Section 3: 현재 구현 현황 (Current Implementation)

없음 — 신규 docs 사이트 추가.

`apps/docs`는 현재 package.json stub만 존재하며 Docusaurus 관련 파일 전무. 이 Goal이 전체 docs 사이트를 신규 구축한다.

---

## Section 4: 호환성 분석 (Compatibility Analysis)

| 항목 | 내용 |
|------|------|
| Breaking change 여부 | 없음 — apps/docs 는 private 패키지, 기존 공개 API 미변경 |
| Deprecation 처리 | N/A — 신규 추가 |
| 영향 받는 usage 파일 수 | 0 (affectedUsageFiles: []) |
| Peer dependency 변경 | N/A — docs 패키지는 private (apps/docs), 외부 peer 없음 |
| Node/pnpm 버전 요구 | node >= 18.0.0, pnpm >= 8.0.0 (monorepo root engines 준수) |
| 런타임 bundle 영향 | +0 KB (docs 사이트 전용 — 런타임 미포함) |

---

## Section 5: 인수 조건 (Acceptance Criteria)

**migrationImpact**: low (affectedUsageFiles: 0, bundleImpact: +0KB, Breaking: 없음)

| ID | 조건 | 소스 태그 |
|----|------|-----------|
| AC-001 | Docusaurus v3 채택을 ADR(또는 D# 결정 테이블)에 기록. MIT/Apache-2.0 라이선스만 사용. | C-14 |
| AC-002 | `pnpm --filter docs run build` 실행 시 13개 패키지(`@tomis/grid-*`) TypeDoc API reference가 `apps/docs/build/api/` 하위에 생성됨 | C-25 |
| AC-003 | Getting Started 페이지(`docs/getting-started.mdx`) + Architecture 페이지(`docs/architecture.mdx`) 존재, 내용 완결 | C-25 |
| AC-004 | `pnpm --filter docs run build` 가 exit code 0, 오류 메시지 없음 | C-12 |
| AC-005 | CI에서 JSDoc 누락 경고 발생 시 빌드를 실패로 처리하는 TypeDoc `--failOnWarnings` 옵션(또는 동등 설정) 적용 | C-25 |

---

## Section 6: 엣지 케이스 (Edge Cases)

| ID | 시나리오 | 처리 방법 |
|----|----------|-----------|
| EC-01 | 13개 패키지 중 일부 `src/index.ts` export에 JSDoc 누락 | AC-005: `--failOnWarnings` 로 CI 빌드 실패. 개발자가 JSDoc 추가해야 통과. C-25 충족 근거. |
| EC-02 | pnpm workspace entryPoint 경로 오류 (`../../packages/*/src/index.ts`) | `entryPointStrategy: 'packages'` 사용. monorepo root 기준 상대경로 검증 필요 (Section 11 Step 3에서 검증). |
| EC-03 | 다국어(i18n) 영어 페이지 추가 요청 | D6 결정: 이 Goal 범위 외. G-005 등 별도 Goal에서 처리. |
| EC-04 | TypeDoc 13개 패키지 동시 빌드 시간 과도 (> 5분) | `entryPointStrategy: 'packages'` 증분 빌드 활용. CI 캐시 전략은 G-003 범위. |

---

## Section 7: 구현 파일 목록 (implementFiles)

**권위**: 이 테이블이 최종 구현 파일 목록의 단일 권위 (C-30).  
**prefix 기준**: monorepo prefix `D:/project/topvel_project/topvel-grid-monorepo/` (D1 결정, C-28 준수).

| # | 파일 경로 | 변경 유형 | 내용 |
|---|-----------|-----------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docusaurus.config.ts` | NEW | Docusaurus v3 설정 — 13개 패키지 TypeDoc entryPoints, i18n ko, preset-classic |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/sidebars.ts` | NEW | 사이드바 설정 — tutorialSidebar + api autogenerated |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/typedoc.json` | NEW | TypeDoc 설정 파일 — entryPoints 13개, failOnWarnings, out |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docs/getting-started.mdx` | NEW | Getting Started 가이드 페이지 (AC-003) |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docs/architecture.mdx` | NEW | 아키텍처 설명 페이지 (AC-003) |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/src/css/custom.css` | NEW | Docusaurus 커스텀 CSS (preset-classic 필수) |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/package.json` | MODIFY | devDeps 추가 (docusaurus, typedoc, plugin 등) + scripts (docs:build, docs:dev) 추가 (AC-002/004, D2 결정) |

**집계**: NEW 6개, MODIFY 1개, 합계 7개

> **D2 보충**: goals.json 원본 6개 대비 `apps/docs/package.json` MODIFY 1개 추가. Docusaurus/TypeDoc devDeps 및 `docs:build`/`docs:dev` scripts 없이는 AC-002/AC-004 이행 불가. C-30 준수: 이 테이블이 최종 권위.

---

## Section 8: 사전 검증 (Preflight)

| 항목 | 내용 |
|------|------|
| 영향 받는 파일 수 | 0 (affectedUsageFiles: []) |
| 시각적 회귀 가능성 | N/A — 기존 UI 미변경 (신규 docs 사이트 추가) |
| 증분 적용 가능 여부 | N/A — 기존 Docusaurus 설정 없음, 전량 신규 |
| 롤백 범위 | `apps/docs` 디렉토리 한정. 13개 패키지 소스 미변경, 롤백 시 docs 삭제만으로 충분 |
| Bundle impact | +0 KB (docs 사이트 전용, 런타임 패키지 미포함) |
| Node 버전 요구 | node >= 18.0.0 (monorepo root engines, Docusaurus v3 요건 충족) |

---

## Section 9: 의존성 (Dependencies)

**bundle 영향**: 0 KB (모두 devDependencies — docs 빌드 전용, 런타임 패키지에 포함 안됨)

| 패키지 | 버전 | 라이선스 | 용도 | bundle 영향 |
|--------|------|----------|------|-------------|
| `@docusaurus/core` | ^3.0.0 | MIT | Docusaurus v3 코어 | 0 KB |
| `@docusaurus/preset-classic` | ^3.0.0 | MIT | 기본 프리셋 (docs/blog/theme) | 0 KB |
| `@docusaurus/types` | ^3.0.0 | MIT | TypeScript 타입 (Config 등) | 0 KB |
| `typedoc` | ^0.27.0 | Apache-2.0 | TypeScript → API reference 추출 | 0 KB |
| `typedoc-plugin-markdown` | ^4.0.0 | MIT | TypeDoc → MDX 변환 | 0 KB |
| `docusaurus-plugin-typedoc` | ^1.0.0 | MIT | Docusaurus-TypeDoc 통합 | 0 KB |
| `react` | ^18.0.0 | MIT | Docusaurus peer (monorepo root 이미 보유) | 0 KB |

> C-14/C-9 준수: 모든 신규 의존성 MIT/Apache-2.0. ADR 기록은 D3/D4 결정 테이블로 대체.

---

## Section 10: 사용자 여정 (User Journeys)

### 여정 1: 개발자 — 로컬 docs 서버 실행

```
1. git clone topvel-grid-monorepo
2. pnpm install (monorepo root)
3. pnpm --filter docs run dev
4. 브라우저: http://localhost:3001
5. 사이드바에서 "API Reference" → "@tomis/grid-core" 클릭
6. useGridState, GridProps 등 TypeDoc 생성 API 참조 확인
```

### 여정 2: 개발자 — CI docs 빌드 검증

```
1. PR 생성
2. CI: pnpm --filter docs run build
3. TypeDoc --failOnWarnings 검사 (JSDoc 누락 시 빌드 실패)
4. build/ 생성 완료, exit code 0 확인 (AC-004)
```

### 여정 3: 최종 사용자 (그리드 도입 팀) — API 참조 탐색

```
1. 배포된 docs 사이트 접근
2. 좌측 사이드바 "시작하기" → Getting Started 페이지 읽기 (AC-003)
3. "아키텍처" 페이지 → 13개 패키지 구조 파악 (AC-003)
4. "API Reference" 섹션 → @tomis/grid-pro-* 상세 API 확인 (AC-002)
```

---

## Section 11: 구현 단계 (Implementation Steps)

> **E-01 준수**: 아래 모든 Step의 파일은 Section 7 테이블에 포함되어 있음.

### Step 1: `apps/docs/package.json` MODIFY (파일 #7)

**Before** (현재 stub):
```json
{
  "name": "docs",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "echo skipped — G-99-B targets Docusaurus",
    "test": "echo TODO"
  }
}
```

**After** (목표):
```json
{
  "name": "docs",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "description": "Docusaurus/Storybook documentation app",
  "scripts": {
    "docs:build": "docusaurus build",
    "docs:dev": "docusaurus start --port 3001",
    "docs:clear": "docusaurus clear",
    "build": "docusaurus build",
    "test": "echo TODO"
  },
  "devDependencies": {
    "@docusaurus/core": "^3.0.0",
    "@docusaurus/preset-classic": "^3.0.0",
    "@docusaurus/types": "^3.0.0",
    "docusaurus-plugin-typedoc": "^1.0.0",
    "typedoc": "^0.27.0",
    "typedoc-plugin-markdown": "^4.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Step 2: `apps/docs/docusaurus.config.ts` NEW (파일 #1)

Section 2-1 코드 스니펫 기준으로 생성. 13개 패키지 entryPoints 전량 포함, `entryPointStrategy: 'packages'`, `defaultLocale: 'ko'` (D6).

### Step 3: `apps/docs/typedoc.json` NEW (파일 #3)

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPointStrategy": "packages",
  "entryPoints": [
    "../../packages/grid",
    "../../packages/grid-core",
    "../../packages/grid-export",
    "../../packages/grid-features",
    "../../packages/grid-license",
    "../../packages/grid-pro-agg",
    "../../packages/grid-pro-datamap",
    "../../packages/grid-pro-header",
    "../../packages/grid-pro-master",
    "../../packages/grid-pro-merging",
    "../../packages/grid-pro-range",
    "../../packages/grid-pro-tracking",
    "../../packages/grid-renderers"
  ],
  "out": "build/api",
  "failOnWarnings": true,
  "plugin": ["typedoc-plugin-markdown"],
  "readme": "none"
}
```

> **AC-005 이행**: `"failOnWarnings": true` — JSDoc 누락 경고 발생 시 CI 빌드 실패 (C-25).  
> **EC-02 이행**: `entryPointStrategy: 'packages'` — workspace 경로 자동 해석.

### Step 4: `apps/docs/sidebars.ts` NEW (파일 #2)

Section 2-2 코드 스니펫 기준으로 생성.

### Step 5: `apps/docs/docs/getting-started.mdx` NEW (파일 #4)

최소 구성:
- `# 시작하기` 제목
- 설치 방법 (`pnpm add @tomis/grid`)
- 기본 사용 예시 코드 블록
- 다음 단계 링크 (아키텍처 페이지)

### Step 6: `apps/docs/docs/architecture.mdx` NEW (파일 #5)

최소 구성:
- `# 아키텍처` 제목
- 13개 패키지 역할 테이블
- 의존성 다이어그램 (Mermaid)
- `apps/docs` (private), `packages/*` (public) 구조 설명

### Step 7: `apps/docs/src/css/custom.css` NEW (파일 #6)

```css
/* Docusaurus preset-classic 필수 커스텀 CSS */
:root {
  --ifm-color-primary: #1a73e8;
  --ifm-color-primary-dark: #1565c0;
  --ifm-color-primary-light: #42a5f5;
}
```

### Step 8: 빌드 검증 (AC-004)

```bash
# monorepo root에서
pnpm install
pnpm --filter docs run build
# 예상: exit code 0, 오류 0
```

---

## Section 12: 검증 계획 (Validation Plan)

| AC | 검증 방법 | 담당 |
|----|----------|------|
| AC-001 (C-14) | D3/D4 결정 테이블 내 Docusaurus v3 + MIT/Apache-2.0 라이선스 기록 확인. `npm info @docusaurus/core license` | 구현자 |
| AC-002 (C-25) | `pnpm --filter docs run build` 후 `apps/docs/build/api/` 디렉토리 생성 + 13개 패키지 하위 디렉토리 존재 확인 | 구현자 |
| AC-003 (C-25) | `apps/docs/docs/getting-started.mdx`, `apps/docs/docs/architecture.mdx` 파일 존재 + `docs:dev` 실행 후 브라우저 렌더링 확인 | 구현자 |
| AC-004 (C-12) | `pnpm --filter docs run build` exit code 0, stderr에 "error" 없음 | CI / 구현자 |
| AC-005 (C-25) | `typedoc.json`에 `"failOnWarnings": true` 설정 확인. 의도적으로 JSDoc 제거 후 빌드 → 실패 확인 | 구현자 |

---

## Section 13: 상용화 고려사항 (Commercialization)

| 항목 | 내용 |
|------|------|
| packageTarget | `apps/docs` (private, UNLICENSED — 외부 배포 대상 아님) |
| C-25 충족 선언 | **본 Goal이 C-25 공개 API 문서화 의무를 충족한다.** TypeDoc으로 13개 `@tomis/grid-*` 패키지의 전체 공개 API reference를 자동 생성 (AC-002). Getting Started + Architecture 가이드 제공 (AC-003). JSDoc 누락 시 CI 실패 (AC-005, C-25 지속 강제). |
| F-03 Storybook 계획 | Storybook 설정은 D5 결정에 따라 G-002로 위임. G-002 Goal에서 `apps/storybook` 또는 `apps/docs`에 통합 예정. |
| SEO / 배포 | 이 Goal 범위 외 (G-003 등에서 처리). `url`, `baseUrl` 설정은 docusaurus.config.ts에 플레이스홀더 포함. |
| 라이선스 노출 | docs 사이트 내 각 패키지 라이선스(MIT) 자동 표시 가능 (TypeDoc 옵션). |
| 다국어 | D6: 단일 로케일 ko. 영어 추가는 G-005+ 범위. |

---

## H 메타-게이트 자가 점검 (Self-Check)

| Gate | 항목 | 결과 |
|------|------|------|
| H-01 | referenceEvidence 경로 실재 여부 | PASS — Section 1 L1/L3 경로 모두 Read 도구로 사전 확인 완료 (grid-core/package.json, apps/docs/package.json, monorepo root package.json, packages/grid-core/src/ 등) |
| H-02 | Section 7 implementFiles 부모 디렉토리 실재 여부 | PASS — `apps/docs/` 실재 확인됨 (Read 도구로 package.json 읽기 성공). `docs/`, `src/css/` 디렉토리는 이 Goal이 신규 생성 (명시). |
| H-03 | 모든 AC 소스 태그가 다른 섹션에서 인용되는지 | PASS — C-14: Section 9 "C-14/C-9 준수" + D3/D4 결정 인용. C-25: Section 13 "C-25 충족 선언" + EC-01 + AC-002/003/005 상세. C-12: Section 12 AC-004 검증 방법에 "C-12" 명시. |

**Self-grep 결과** (키워드 "재결정", "대체", "~ 대신", "~로 변경"):
- "재결정": 0 hits
- "대체": 0 hits  
- "대신": D# 결정 테이블 "대안 검토" 컬럼 내 설명용 사용 (E-06 위반 아님 — 재결정 drift 아닌 대안 검토 기록)
- "변경": "Section 7" 테이블 "변경 유형" 컬럼 헤더 (E-06 무관)

**Section 7 ↔ Section 11 일치성** (E-01):
- Step 1 → 파일 #7 (package.json MODIFY) ✓
- Step 2 → 파일 #1 (docusaurus.config.ts NEW) ✓
- Step 3 → 파일 #3 (typedoc.json NEW) ✓
- Step 4 → 파일 #2 (sidebars.ts NEW) ✓
- Step 5 → 파일 #4 (getting-started.mdx NEW) ✓
- Step 6 → 파일 #5 (architecture.mdx NEW) ✓
- Step 7 → 파일 #6 (custom.css NEW) ✓

**집계**: 7개 Steps ↔ 7개 implementFiles — 완전 일치.

---

*Spec 작성 완료: 2026-05-15*  
*C-1 준수: 7개 전제 파일 Read 완료 후 작성*  
*C-28 준수: Section 7 전체 monorepo prefix 사용 (D1 결정)*  
*C-30 준수: Section 7 테이블이 단일 권위*  
*C-25 충족: Section 13에 명시적 선언*
