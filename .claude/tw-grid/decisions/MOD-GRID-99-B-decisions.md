# MOD-GRID-99-B: Architecture Decision Records

**Module**: MOD-GRID-99-B (Docusaurus + TypeDoc)  
**Goal**: G-001 — Docusaurus 사이트 + TypeDoc API reference 자동 생성  
**Date**: 2026-05-15  
**Author**: tw-grid Implementer  

---

## ADR-MOD-GRID-99-B-001: C-5 vs Docusaurus customCss 충돌 — customCss: [] 채택

### 상태
채택 (ACCEPTED)

### 배경
spec Section 2-1 L75와 Section 7 #6은 `apps/docs/src/css/custom.css` 신규 파일 생성 및 `customCss: './src/css/custom.css'` 설정을 요구한다.
그러나 constraints.md C-5 ("CSS 신규 파일 생성 금지 — Tailwind Only")는 `.css` 신규 파일 생성을 하드 제약으로 금지한다.

### 결정
`apps/docs/src/css/custom.css` **생성하지 않음**.
`docusaurus.config.ts`의 `theme.customCss`를 `[]` (빈 배열)로 설정.
Docusaurus preset-classic은 customCss 빈 배열 또는 미설정 시 기본 테마로 동작하므로 빌드 정상 가능.

### 대안 1: spec 그대로 custom.css 생성
- **trade-off +**: spec 충실도 100%, 테마 커스터마이징 즉시 가능
- **trade-off -**: C-5 하드 제약 위반. constraints는 spec보다 우선 순위 높음 (constraints.md 첫 줄: "이 파일의 내용은 어떤 인수 기준이나 사용자 지시보다도 우선한다"). 향후 모든 목적의 CSS 파일 이중 표준 형성.

### 대안 2: Tailwind inline 클래스로 Docusaurus 테마 Override
- **trade-off +**: C-5 준수 + 테마 커스터마이징 가능
- **trade-off -**: Docusaurus는 Tailwind 기반이 아니며, preset-classic 테마 override는 CSS 변수 또는 swizzle 방식만 공식 지원. Tailwind 클래스 단독으로는 Docusaurus 테마 변수 재정의 불가.

### 근거
C-5는 constraints.md에 명시된 하드 제약으로 spec, 사용자 지시, AC 어느 것보다 우선한다.
Docusaurus v3는 `customCss: []` 허용 (Preset.Options 타입에서 배열 형식 지원).
테마 커스터마이징 필요 시 향후 Docusaurus swizzle 또는 별도 Goal로 처리.

### 결과
- `custom.css` 파일 미생성 (Section 7 NEW 파일 수 6 → 5)
- `docusaurus.config.ts` L25: `theme: { customCss: [] }`
- `promptSpecDrift[]`에 기록 (C-5 > spec 명시적 drift)

---

## ADR-MOD-GRID-99-B-002: 정적 사이트 생성기 Docusaurus v3 채택 (Nextra 미채택)

### 상태
채택 (ACCEPTED) — spec D3 결정 수용

### 배경
`apps/docs` 문서 사이트를 위한 정적 사이트 생성기 선택.
spec D3 결정에서 Docusaurus v3를 명시했으며, goals.json title에도 "Docusaurus(또는 Nextra)"로 두 옵션이 병기되어 있었다.

### 결정
**Docusaurus v3** (`@docusaurus/core ^3.0.0`) 채택.

### 대안 1: Nextra (Next.js 기반 문서 사이트)
- **trade-off +**: 파일 기반 라우팅 자동화, Next.js 생태계 통합, 검색 내장
- **trade-off -**: Next.js 의존성 추가 (추가 devDeps: `next`, `next/image` 등). monorepo가 Vite 기반인데 Next.js 추가 시 빌드 도구 이중화. TypeDoc 통합 플러그인 성숙도 낮음. 라이선스: MIT이나 Next.js 캐싱/App Router 기능 일부 제한.

### 대안 2: VitePress (Vue 기반)
- **trade-off +**: Vite 친화적, 경량, TypeDoc 출력 MDX 직접 소비 가능
- **trade-off -**: Vue 기반 — React 팀이 주 사용자인 환경에서 기여 장벽. `docusaurus-plugin-typedoc`의 Docusaurus 전용 사이드바 통합 기능 없음.

### 근거
- Docusaurus v3: React 기반으로 팀 친화적. pnpm workspace 호환. MIT 라이선스.
- `docusaurus-plugin-typedoc` (MIT)이 13개 패키지 TypeDoc 출력을 Docusaurus 사이드바에 자동 통합 — AC-002 이행에 최적.
- spec D3 명시 결정 (C-27 spec 권위).

### 결과
- `@docusaurus/core ^3.0.0`, `@docusaurus/preset-classic ^3.0.0`, `@docusaurus/types ^3.0.0` devDependencies 추가 (MIT)

---

## ADR-MOD-GRID-99-B-003: TypeDoc 연동 docusaurus-plugin-typedoc 채택 (수동 MDX 변환 미채택)

### 상태
채택 (ACCEPTED) — spec D4 결정 수용

### 배경
13개 `@tomis/grid-*` 패키지의 TypeScript export를 Docusaurus 사이드바에 API 참조로 자동 생성해야 한다 (AC-002).
TypeDoc 출력을 Docusaurus에 연동하는 방법 선택.

### 결정
**`docusaurus-plugin-typedoc ^1.0.0`** (MIT) 채택. 내부적으로 `typedoc ^0.27.0` + `typedoc-plugin-markdown ^4.0.0`을 사용하여 TypeScript → MDX 변환 후 Docusaurus 사이드바에 자동 등록.

### 대안 1: 수동 MDX 변환 (typedoc --json → 커스텀 스크립트)
- **trade-off +**: 완전한 출력 제어. Docusaurus 버전 의존성 없음.
- **trade-off -**: 스크립트 유지 비용 높음. TypeDoc JSON 스키마 변경 시 스크립트 수정 필요. 사이드바 자동 등록 수동 구현 필요. 13개 패키지 × 갱신 주기 = 유지 부담 과도.

### 대안 2: TypeDoc HTML 출력 iframe 삽입
- **trade-off +**: Docusaurus 변환 불필요
- **trade-off -**: 검색 통합 불가. Docusaurus 테마와 스타일 불일치. 모바일 반응형 깨짐. SEO 불리.

### 라이선스 확인
| 패키지 | 버전 | 라이선스 |
|--------|------|---------|
| `docusaurus-plugin-typedoc` | ^1.0.0 | MIT |
| `typedoc` | ^0.27.0 | Apache-2.0 |
| `typedoc-plugin-markdown` | ^4.0.0 | MIT |

모두 MIT/Apache-2.0 — C-9/C-14 라이선스 제약 준수.

### 번들 영향
devDependencies 전용 — docs 빌드 전용, 런타임 패키지 bundle에 포함 안됨. +0 KB.

### 근거
- `docusaurus-plugin-typedoc`이 13개 패키지를 단일 Docusaurus 사이드바 "API Reference" 섹션으로 자동 통합 — 수동 구현 대비 유지 비용 압도적 절감.
- AC-005 `failOnWarnings` 요건은 `typedoc.json`의 `"failOnWarnings": true`로 충족.
- spec D4 명시 결정 (C-27 spec 권위).
- C-31 wiring 의무: `docusaurus.config.ts` plugins[] 배열에 실제 등록됨 (단순 import X).

### 결과
- `docusaurus-plugin-typedoc`, `typedoc`, `typedoc-plugin-markdown` devDependencies 추가
- `docusaurus.config.ts` `plugins[]` 배열에 등록 + 13개 entryPoints 설정
- `typedoc.json` 별도 설정 파일로 failOnWarnings + 13개 패키지 directory-form entryPoints

---

## ADR-MOD-GRID-99-B-004: 단일 로케일 ko (i18n G-005 위임)

### 상태
채택 (ACCEPTED) — spec D6 결정 수용

### 배경
Docusaurus i18n 설정에서 지원 로케일을 결정해야 한다.
국제화(영어 추가 등)를 현재 Goal에 포함할지 여부.

### 결정
`defaultLocale: 'ko'`, `locales: ['ko']` — **한국어 단일 로케일**.

### 대안 1: 다국어 동시 설정 (ko + en)
- **trade-off +**: 영어 사용자도 즉시 접근 가능. 공개 문서 완성도 높음.
- **trade-off -**: 현재 Goal AC에 다국어 항목 없음. 번역 파일 유지 비용 추가. `docs/i18n/en/` 디렉토리 초기 구성 + 13개 패키지 × API 영문 번역 = 과도한 범위 확장.

### 대안 2: 영어 단일 로케일 (en only)
- **trade-off +**: 국제적 접근성. TypeDoc 영문 주석이 그대로 표시.
- **trade-off -**: 주 사용자가 한국어 환경(TOMIS 프로젝트). Getting Started / Architecture 페이지 한국어 작성 후 영어 로케일 미스매치 발생.

### 근거
- 현재 Goal AC(AC-001~005)에 다국어 항목 없음.
- Getting Started / Architecture 페이지는 한국어로 작성 — 로케일 ko가 적합.
- 영어 추가는 G-005+ 별도 Goal에서 처리 가능 (Docusaurus i18n 점진 확장 지원).
- spec D6 명시 결정 (C-27 spec 권위).

### 결과
- `docusaurus.config.ts` i18n: `{ defaultLocale: 'ko', locales: ['ko'] }`
- 영어 로케일 추가는 G-005 이후 별도 Goal 범위

---

## ADR-MOD-GRID-99-B-005: Storybook 8 + `@storybook/react-vite` framework 채택

### 상태
채택 (ACCEPTED) — G-002 spec D4 결정 수용

### 배경
G-002 (Storybook 모든 패키지 story) 구현을 위한 Storybook framework 선택.
monorepo가 Vite 기반(`@storybook/react-vite` vs `@storybook/react-webpack5`).

### 결정
**Storybook 8.x + `@storybook/react-vite ^8.0.0`** 채택.

### 대안 1: `@storybook/react-webpack5`
- **trade-off +**: Storybook 생태계에서 가장 오래된, 검증된 framework. CSS/SASS 처리 풍부.
- **trade-off -**: webpack 5 빌드 도구 이중화 — monorepo가 이미 Vite 기반. webpack 설치 시 devDep 크기 대폭 증가 (~300MB). HMR 속도 Vite 대비 느림.

### 대안 2: `@storybook/react` (자동 감지, builder 명시 없음)
- **trade-off +**: 설정 단순.
- **trade-off -**: `storybook init` 자동 감지는 monorepo 구조에서 불확실. 명시적 framework 지정이 C-28/C-30 준수 및 spec 권위 확립에 유리.

### 라이선스 확인
| 패키지 | 버전 | 라이선스 |
|--------|------|---------|
| `storybook` | ^8.0.0 | MIT |
| `@storybook/react-vite` | ^8.0.0 | MIT |
| `@storybook/addon-links` | ^8.0.0 | MIT |
| `@storybook/addon-essentials` | ^8.0.0 | MIT |

모두 MIT — C-9/C-14 라이선스 제약 준수.

### 근거
- monorepo가 Vite 기반 → `@storybook/react-vite`가 빌드 도구 일관성 유지.
- Storybook 8: pnpm workspace + React 18 공식 지원. `@tanstack/react-virtual` peerDep 문제 없음.
- bundle 영향: devDependencies 전용 — 런타임 패키지 bundle에 포함 안됨. +0 KB.
- G-002 spec D4 명시 결정 (C-27 spec 권위).

### 결과
- `apps/docs/package.json` devDeps: `storybook ^8.0.0`, `@storybook/react-vite ^8.0.0`, `@storybook/addon-links ^8.0.0`, `@storybook/addon-essentials ^8.0.0` 추가
- `apps/docs/.storybook/main.ts`: `framework: { name: '@storybook/react-vite', options: {} }` 설정
- scripts: `build-storybook: storybook build`, `storybook: storybook dev --port 6006` 추가

---

## ADR-MOD-GRID-99-B-006: C-3 Storybook mock/dummy 데이터 예외 명시 적용

### 상태
채택 (ACCEPTED) — G-002 spec D7 결정 수용

### 배경
C-3 제약: "dummy/mock 데이터는 Storybook stories 및 unit tests에서만 허용."
G-002 story 파일들은 독립 실행을 위해 mock rows/columns 데이터가 필수적이다.
이 ADR은 C-3 예외를 명시적으로 기록하여 구현자가 의도적 예외임을 인지하도록 한다.

### 결정
`packages/*/stories/*.stories.tsx` 파일 내 mock/dummy 데이터 사용 **허용**.

### 적용 범위 (허용)
- `packages/grid-core/stories/Grid.stories.tsx` — mock 5행 데이터
- `packages/grid-core/stories/Grid.virtualized.stories.tsx` — 1000행/5000행 mock 배열
- `packages/grid-renderers/stories/Cells.stories.tsx` — 각 Cell mock props
- `packages/grid-export/stories/Export.stories.tsx` — mock Grid + 버튼 핸들러
- `packages/grid-pro-*/stories/*.stories.tsx` — 각 패키지 mock 시나리오 데이터

### 금지 유지 (C-3 핵심 제약 여전히 유효)
- `packages/*/src/**/*.ts(x)` — production 소스에는 mock 데이터 절대 금지
- `apps/docs/src/**` — production 앱 소스에 mock 데이터 금지

### 근거
- C-3 명시 예외 조항: "Storybook stories 및 unit tests에서 dummy/mock 데이터 허용"
- story 파일이 실제 API 서버 없이 독립 실행되려면 mock 데이터 불가피
- AC-005 (`pnpm build-storybook` 0 error) 달성을 위해 story 독립 실행 필수
- mock 데이터가 production `src/`에 없으므로 C-3 핵심 의도(production 코드 오염 방지) 충족

### 결과
- 모든 G-002 story 파일에서 `// C-3 예외: mock 데이터는 Storybook stories 및 unit tests에서만 허용 (D7 결정)` 주석 명시
- production `src/` 디렉토리는 mock 데이터 완전 부재 유지

---

## ADR-MOD-GRID-99-B-007: 시각 회귀 도구 Playwright 채택 (Chromatic 미채택)

### 상태
채택 (ACCEPTED) — G-003 spec D5 결정 수용

### 배경
G-003 (시각 회귀 자동화) 구현을 위해 Storybook 기반 시각 회귀 테스트 도구를 선택해야 한다.
주요 후보는 Chromatic (SaaS 기반) 과 Playwright (OSS, self-hosted) 두 가지이다.
12개 story에 대한 screenshot 비교를 GitHub Actions CI에 통합하는 것이 목표이다.

### 결정
**`@playwright/test ^1.40`** (Apache-2.0 OSS) 채택. Chromatic 미채택.

### Trade-off 1: 비용

| 항목 | Chromatic | Playwright |
|------|-----------|------------|
| 무료 한도 | 5,000 snapshots/month | 없음 (OSS) |
| 초과 시 | 유료 플랜 $149+/month | GitHub Actions 컴퓨팅 비용만 (무료 2,000분/month) |
| 12 stories × 다수 PR | 한도 초과 위험 | 한도 없음 |

### Trade-off 2: CI 호환성 (GitHub Actions 통합)

| 항목 | Chromatic | Playwright |
|------|-----------|------------|
| 통합 방식 | `chromaui/action@v1` GitHub Action | 표준 YAML + `npx playwright install` |
| secret 필요 | `CHROMATIC_PROJECT_TOKEN` 필수 | 불필요 |
| 외부 서비스 의존 | Chromatic.com SaaS에 baseline 저장. 서비스 장애 시 CI 실패 | 외부 서비스 없음 |

### Trade-off 3: 셀프 호스팅 (baseline 저장 방식)

| 항목 | Chromatic | Playwright |
|------|-----------|------------|
| baseline 저장소 | Chromatic SaaS cloud (git 외부) | `tests/visual/__snapshots__/` (git commit, self-hosted) |
| 오프라인 동작 | 불가 | 가능 |
| baseline 히스토리 | Chromatic UI에서 확인 | git log 표준 추적 |

### Trade-off 4: 라이선스 제약 (C-9 준수)

| 항목 | Chromatic | Playwright |
|------|-----------|------------|
| 패키지 라이선스 | `chromatic` MIT — 그러나 Chromatic.com SaaS 약관 의존 | `@playwright/test` Apache-2.0 + `playwright` Apache-2.0 |
| C-9 제약 준수 | SaaS 서비스 약관 외부 의존 위험 | C-9 완전 준수 (MIT/Apache-2.0) |
| 제약 위험 | SaaS 약관 변경 시 CI 영향 | 없음 |

### 대안: Chromatic

- **trade-off +**: 직관적인 UI 리뷰 워크플로우. 스냅샷 승인/거절 UI 제공. story 단위 diff viewer.
- **trade-off -**: 비용(5000 snapshots/month 무료 한도 초과 위험), SaaS 의존, C-9 라이선스 제약 경계, baseline git 관리 불가.
- **미채택 사유**: 상용 SaaS 비용 + C-9 제약 + self-hosted 불가 조합이 Playwright 대비 열위.

### 라이선스 확인

| 패키지 | 버전 | 라이선스 |
|--------|------|---------|
| `@playwright/test` | ^1.40 | Apache-2.0 |
| `playwright` | ^1.40 | Apache-2.0 |

모두 Apache-2.0 — C-9/C-14/C-20 라이선스 제약 완전 준수.

### 번들 영향
devDependencies 전용 (`apps/docs` private 패키지) — 런타임 bundle에 포함 안됨. +0 KB.

### 근거
- C-9/C-14: Apache-2.0 OSS — 상용 SaaS 의존 없음.
- C-13/C-17: GitHub Actions CI 직접 통합 — secret 없이 1 YAML 파일로 완결.
- C-18: `storybook.spec.ts`가 1000행 가상화 story에 timeout 60s 적용 — 가상화 시나리오 포함.
- baseline self-hosted: git commit으로 변경 이력 추적 + 팀 공유 단순.
- G-003 spec D5 명시 결정 (C-27 spec 권위).

### 결과
- `apps/docs/package.json` devDeps: `@playwright/test ^1.40`, `playwright ^1.40` 추가
- `playwright.config.ts`: monorepo root, testDir `./tests/visual`, baseURL `http://localhost:6006`
- `tests/visual/storybook.spec.ts`: index.json/stories.json 동적 읽기 + 12개 story 순회 + timeout 처리
- `.github/workflows/visual-regression.yml`: pnpm install → build-storybook → playwright install → visual:test → block-on-migration-impact
- `apps/docs/visual-regression.md`: baseline 업데이트 절차 문서화 (AC-005)
