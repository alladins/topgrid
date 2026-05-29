# G-003 Spec: Chromatic 또는 Playwright 시각 회귀 자동화

**Goal ID**: MOD-GRID-99-B / G-003  
**Title**: Chromatic 또는 Playwright 시각 회귀 자동화 (C-13, C-17)  
**Status**: DRAFT  
**Spec Writer**: tw-grid Spec Writer  
**Date**: 2026-05-15  
**packageTarget**: `apps/docs`  
**migrationImpact**: low  
**threshold**: 85  
**dependsOn**: MOD-GRID-99-B/G-002

---

## D# 결정 테이블

| ID | 결정 | 근거 | 대안 검토 |
|----|------|------|-----------|
| D1 | Section 7 implementFiles는 monorepo prefix 채택 (goals.json TOMIS prefix 정정) — `D:/project/topvel_project/topvel-grid-monorepo/` | C-28: implementFiles는 반드시 monorepo prefix 사용. goals.json의 `D:/project/topvel_project/TOMIS/.github/...` 및 `D:/project/topvel_project/TOMIS/playwright.config.ts`는 discover 단계 생성 오류. spec이 authority. | TOMIS prefix 유지 시 C-28 위반. monorepo prefix는 ADR-MOD-GRID-00-001 외부 저장소 결정 준수. |
| D2 | Section 7에 goals.json 3개 대비 7개 구현 파일 (NEW 4 + MODIFY 3) 확정 | goals.json `implementFiles` 3개(workflow yml, visual-regression.md, playwright.config.ts). 그러나 `tests/visual/storybook.spec.ts` (핵심 Playwright 테스트), `apps/docs/package.json` MODIFY (visual:test/visual:update-baseline scripts + @playwright/test devDep), monorepo root `package.json` MODIFY (visual:test script), `decisions.md` MODIFY (ADR-007) 누락 시 AC 이행 불가. | goals.json 그대로 3개 유지 시 AC-002(설정+CI) + AC-001(ADR) + AC-005(문서) 이행 파일 누락 → E-01 위반 |
| D3 | `.github/workflows/` 디렉토리는 GitHub Actions 표준 디렉토리 — H-02 외부 디렉토리 컨벤션 충족 | `.github/workflows/`는 GitHub Actions 산업 표준 경로 (GitHub 공식 문서 명시). `topvel-` kebab-case prefix 예시는 H-02 sub-rule(3) 예시이며, `.github/`는 GitHub SaaS 요구 표준 경로로 규칙 일반화 적용. 조부모 `D:/project/topvel_project/topvel-grid-monorepo/` 실재 확인됨 (H-02 sub-rule 1). | 외부 서비스 표준 경로 거부 시 CI 자동화 불가 |
| D4 | `tests/visual/` 디렉토리는 신규 생성 — H-02 외부 디렉토리 컨벤션 충족 | `tests/` 디렉토리는 monorepo root 하위 표준 테스트 경로. 조부모 `D:/project/topvel_project/topvel-grid-monorepo/` 실재 확인됨 (H-02 sub-rule 1). `topvel-grid-monorepo/tests/` 는 `topvel-` prefix 패턴 + 표준 `tests/` 디렉토리명으로 H-02 sub-rule(3) 충족. | 패키지 내부 tests/ 분산 시 cross-package story URL 해석 복잡도 증가 |
| D5 | **시각 회귀 도구: Playwright** (`@playwright/test ^1.40`) 채택 (Chromatic 미채택) | OSS MIT 라이선스 — C-9/C-14 제약 완전 준수. 외부 SaaS 비의존 — Chromatic의 5000 snapshots/month 무료 한도(12 stories × 10 PRs/month = 1200+ snapshots) 위험 없음. GitHub Actions 직접 통합 — YAML 1파일로 완결. baseline 파일은 git commit으로 self-hosted. ADR-007에 4 trade-off 상세 기록. | Chromatic 미채택 — ADR-007 trade-off 4개 참조 |
| D6 | Playwright screenshot 대상: Storybook static 빌드 (`storybook-static/`) — iframe URL 순회 | G-002 산출 Storybook stories 12개(grid-core 2 + grid-renderers + grid-export + grid-features + 7 pro)를 `storybook.spec.ts`에서 iframe URL 기반 자동 순회. `stories.json`(Storybook build 산출) 읽어 story list 동적 수집. | 하드코딩 URL 목록 — story 추가 시 수동 업데이트 필요, 자동화 우위 없음 |
| D7 | CI 워크플로우 트리거: `on: pull_request` (branches: main). migrationImpact high/medium PR의 visual regression 자동 차단은 PR label `migration-impact:high` 또는 `migration-impact:medium` 조건부 job으로 구현 | AC-003: "high/medium impact Goal verify 단계 자동 트리거 — fail 시 PR block". label 기반 조건이 binary 검증 가능 (C-03 충족). label 없는 PR도 workflow trigger되나 차단은 label 조건부. | 경로 기반 필터만 사용 시 migrationImpact 정보 workflow 미전달 |
| D8 | baseline 스크린샷 저장소: `tests/visual/__snapshots__/` (git 커밋) — SaaS 미사용 | Playwright `toMatchSnapshot()` 기본 동작. `.gitattributes`에 PNG LFS 설정 권장 (별도 Goal). 이 Goal에서는 git commit baseline 방식으로 완결. | Chromatic SaaS baseline 저장 미채택 — 외부 서비스 의존 + 비용 발생 |

---

## Section 1: 참조 추적 (Reference Tracking)

| 계층 | 참조 | 설명 |
|------|------|------|
| L0 | G-001 결과 — `apps/docs/docusaurus.config.ts`, `apps/docs/package.json` | Docusaurus 인프라 (신규 docs 사이트 베이스) |
| L0 | G-002 결과 — `apps/docs/.storybook/main.ts`, `apps/docs/.storybook/preview.ts` | Storybook 통합 (visual regression baseline 대상) |
| L0 | G-002 산출 12개 stories | grid-core(Grid.stories, Grid.virtualized.stories), grid-renderers(Cells.stories), grid-export(Export.stories), grid-features(Features.stories), grid-pro-tracking(ChangeTracking.stories), grid-pro-range(RangeSelect.stories), grid-pro-datamap(DataMap.stories), grid-pro-merging(Merging.stories), grid-pro-header(GroupedHeader.stories), grid-pro-agg(Aggregation.stories), grid-pro-master(MasterDetail.stories) |
| L1 | `D:/project/topvel_project/topvel-grid-monorepo/package.json` | monorepo root — packageManager: pnpm@8.15.0, engines: node>=18. 현재 `visual:test` script 없음 → MODIFY 대상 |
| L1 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/package.json` | docs 앱 현황 (G-002 후) — `build-storybook`, `storybook` script 존재. `@playwright/test` devDep 없음 → MODIFY 대상 |
| L1 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/.storybook/main.ts` | G-002 산출 — stories glob: `../../../packages/*/stories/**/*.stories.@(ts|tsx)`. visual regression 대상 URL 도출 근거 |
| L2 | N/A | publish 레이어 없음 |
| L3 | G-002 산출 12개 stories (위 L0 목록) | Playwright screenshot baseline 대상 |
| R-A | AG Grid CI 시각 회귀 패턴 (참조용) | GitHub Actions + Playwright screenshot 비교 패턴 |
| R-W | N/A | Wijmo 시각 회귀 도구 사용 안 함 |

**전제 파일 확인 목록** (C-1 준수):
1. `D:/project/topvel_project/TOMIS/.claude/tw-grid/constraints.md` — C-1~C-36 제약
2. `D:/project/topvel_project/TOMIS/.claude/tw-grid/rubric/specify-rubric.md` — v1.0.9, 32항목
3. `D:/project/topvel_project/TOMIS/.claude/tw-grid/goals/MOD-GRID-99-B/docs-goals.json` — G-003 정의
4. `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod99b-g001/.claude/tw-grid/artifacts/MOD-GRID-99-B/docs/G-001-spec.md` — 구조 패턴
5. `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod99b-g001/.claude/tw-grid/artifacts/MOD-GRID-99-B/docs/G-002-spec.md` — Storybook 통합 컨텍스트
6. `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod99b-g001/.claude/tw-grid/decisions/MOD-GRID-99-B-decisions.md` — ADR-001~006
7. `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/.storybook/main.ts` — G-002 산출, visual regression 대상 stories glob
8. `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/package.json` — docs 현황 (G-002 후)
9. `D:/project/topvel_project/topvel-grid-monorepo/package.json` — monorepo root

---

## Section 2: API 계약 (API Contract)

### 2-1. `playwright.config.ts` 타입 (PlaywrightTestConfig)

```typescript
// D:/project/topvel_project/topvel-grid-monorepo/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const config = defineConfig({
  testDir: './tests/visual',
  fullyParallel: false,    // screenshot 재현성 위해 sequential
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:6006',    // Storybook static 서버 URL
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Storybook static 서버 — CI에서는 외부 기동 (workflow에서 npx http-server 선행)
  // 로컬: pnpm -F docs storybook → localhost:6006 대기 후 실행
});

export default config;
```

### 2-2. `tests/visual/storybook.spec.ts` 타입

```typescript
// D:/project/topvel_project/topvel-grid-monorepo/tests/visual/storybook.spec.ts
import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

// Storybook static 빌드 산출 stories.json 동적 읽기 (D6 결정)
const storiesJsonPath = path.join(
  __dirname,
  '../../apps/docs/storybook-static/stories.json'
);

interface StoryEntry {
  id: string;
  title: string;
  name: string;
  importPath: string;
  tags?: string[];
}
interface StoriesJson {
  v: number;
  stories: Record<string, StoryEntry>;
}

const storiesJson: StoriesJson = JSON.parse(
  readFileSync(storiesJsonPath, 'utf-8')
);
const storyIds = Object.keys(storiesJson.stories);

for (const storyId of storyIds) {
  const story = storiesJson.stories[storyId];
  test(`visual regression: ${story.title}/${story.name}`, async ({ page }) => {
    const iframeUrl = `/iframe.html?id=${storyId}&viewMode=story`;
    await page.goto(iframeUrl);
    // EC-03: 1000행 가상화 story는 렌더링 시간 증가 → timeout 연장 처리
    const timeout = storyId.includes('virtual') || storyId.includes('1000')
      ? 15000
      : 5000;
    await page.waitForLoadState('networkidle', { timeout });
    await expect(page).toMatchSnapshot(`${storyId}.png`, {
      maxDiffPixelRatio: 0.01,    // EC-02: OS/브라우저 픽셀 차이 threshold 1%
    });
  });
}
```

### 2-3. GitHub Actions 워크플로우 타입

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression

on:
  pull_request:
    branches: [main]

jobs:
  visual-regression:
    runs-on: ubuntu-latest
    # D7: migrationImpact high/medium PR만 차단 (label 조건)
    # label 없는 PR도 workflow trigger됨 (continue-on-error로 통보만)
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: pnpm
      - run: pnpm install
      - name: Build Storybook static
        run: pnpm -F docs build-storybook    # AC-002: Storybook static 생성
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium    # EC-04: 브라우저 바이너리 설치
      - name: Run Playwright visual regression
        run: pnpm visual:test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  block-on-migration-impact:
    runs-on: ubuntu-latest
    needs: visual-regression
    # AC-003: migrationImpact high/medium PR 실패 시 PR 차단
    if: |
      failure() &&
      (contains(github.event.pull_request.labels.*.name, 'migration-impact:high') ||
       contains(github.event.pull_request.labels.*.name, 'migration-impact:medium'))
    steps:
      - name: Block PR on visual regression failure
        run: exit 1
```

### 2-4. npm scripts 계약

```json
// apps/docs/package.json scripts 추가 (MODIFY)
{
  "visual:test": "playwright test",
  "visual:update-baseline": "playwright test --update-snapshots"
}

// monorepo root package.json scripts 추가 (MODIFY)
{
  "visual:test": "pnpm -F docs visual:test"
}
```

### 2-5. 사용 예시

**예시 1: 로컬 baseline 업데이트**
```bash
# Storybook 서버 실행 (별도 터미널)
pnpm -F docs storybook

# baseline 스크린샷 갱신 (AC-005 절차 문서화 대상)
pnpm visual:update-baseline
git add tests/visual/__snapshots__
git commit -m "chore(visual): update baseline snapshots"
```

**예시 2: CI visual regression 확인**
```bash
# PR 푸시 → GitHub Actions visual-regression.yml 자동 실행
# Storybook static build → Playwright 비교 → 차이 발견 시 PR check 실패
```

---

## Section 3: 현재 구현 현황 (Current Implementation)

없음 — G-003은 신규 CI 자동화 추가.

G-002 완료 후 상태:
- `apps/docs/.storybook/main.ts`: 존재 (G-002 산출)
- `apps/docs/.storybook/preview.ts`: 존재 (G-002 산출)
- `apps/docs/package.json`: `build-storybook`, `storybook` scripts 존재. `@playwright/test` devDep 없음.
- monorepo root `package.json`: `visual:test` script 없음.
- `.github/workflows/`: 디렉토리 미존재 (신규 생성).
- `tests/visual/`: 디렉토리 미존재 (신규 생성).
- `playwright.config.ts`: 미존재 (신규 생성).

---

## Section 4: 호환성 분석 (Compatibility Analysis)

| 항목 | 내용 |
|------|------|
| Breaking change 여부 | 없음 — 패키지 public API 미변경. CI 추가만. |
| Deprecation 처리 | N/A — 신규 추가 |
| 영향 받는 usage 파일 수 | 0 (affectedUsageFiles: []) |
| Peer dependency 변경 | N/A — `apps/docs`는 private 패키지, 외부 peer 없음 |
| 도구 선택 | **Playwright** (Apache-2.0 / MIT OSS, 외부 SaaS 비의존) |
| 런타임 bundle 영향 | +0 KB (CI devDependencies 전용 — 런타임 패키지 미포함) |
| G-001/G-002 호환성 | G-001/G-002 결과물 미변경. `apps/docs/package.json`만 scripts/devDep 추가 MODIFY |

---

## Section 5: 인수 조건 (Acceptance Criteria)

**migrationImpact**: low (affectedUsageFiles: 0, bundleImpact: +0KB, Breaking: 없음)

| ID | 조건 | 소스 태그 |
|----|------|-----------|
| AC-001 | `decisions/MOD-GRID-99-B-decisions.md`에 ADR-007 작성 — Chromatic vs Playwright 비교 + Playwright 채택 결정 + trade-off 4개 이상 명시 | C-14 |
| AC-002 | `.github/workflows/visual-regression.yml` 존재 + `pnpm visual:test` script가 apps/docs/package.json에 존재. Storybook static build → Playwright screenshot 비교 워크플로우 완결. | C-13 |
| AC-003 | GitHub Actions workflow의 `block-on-migration-impact` job이 PR label `migration-impact:high` 또는 `migration-impact:medium` 조건부로 visual regression 실패 시 `exit 1` 반환 (PR check 차단) | C-17 |
| AC-004 | `tests/visual/storybook.spec.ts`가 G-002 산출 12개 stories 전량 순회 + 1000행 가상화 story(grid-core/Grid 1000+행 가상화)의 시각 회귀 검증 포함 | C-18 |
| AC-005 | `apps/docs/visual-regression.md` 존재 + baseline 업데이트 절차 (`pnpm visual:update-baseline` 실행 → git commit) 명시 | C-25 |

---

## Section 6: 엣지 케이스 (Edge Cases)

| ID | 시나리오 | 처리 방법 |
|----|----------|-----------|
| EC-01 | baseline 미존재 (1차 실행) — `__snapshots__/` 디렉토리 비어 있음 | Playwright는 baseline 부재 시 자동 생성 + 테스트 통과. 이후 commit된 baseline이 비교 기준이 됨. `visual:update-baseline` script로 명시적 baseline 생성 권장 (Section 10 여정 3). |
| EC-02 | OS/브라우저 별 픽셀 차이 — CI(ubuntu) vs 로컬(macOS/Windows) 렌더링 차이 | `maxDiffPixelRatio: 0.01` (1% threshold) 설정 (Section 2-2). CI 환경(ubuntu+chromium) 기준 baseline 생성 권장. `.github/workflows/`에서 baseline 갱신 job 제공 (AC-005 문서화). |
| EC-03 | 1000행 가상화 story 렌더링 시간 초과 (>5초) | `storybook.spec.ts`에서 `storyId.includes('virtual') \|\| storyId.includes('1000')` 조건부로 timeout을 15000ms로 연장 (Section 2-2 코드 구현). AC-004 이행 (C-18). |
| EC-04 | GitHub Actions에서 Playwright 브라우저 바이너리 미설치 | workflow Step: `npx playwright install --with-deps chromium` — chromium 단독 설치 (~200MB). `--with-deps` 플래그로 OS 시스템 의존성 자동 설치. (Section 2-3 workflow 명시) |
| EC-05 | Chromatic 무료 tier 한도 (5000 snapshots/month) — 12 stories × 다수 PR 시나리오 | D5 결정으로 Playwright OSS 채택 — 무료 한도 없음. ADR-007 trade-off 항목으로 기록. |
| EC-06 | `stories.json` 파일 미존재 — Storybook static 빌드 미완료 상태에서 `pnpm visual:test` 실행 | `storybook.spec.ts` 최상단의 `readFileSync` 호출이 `ENOENT` 예외 발생 → 테스트 프로세스 종료 + 오류 메시지. CI workflow에서 `build-storybook` step을 `visual:test` 이전에 반드시 실행 (Section 2-3 workflow step 순서 명시). |

| AC 매핑 표 (E-04 권장 — 환경 의존 AC) |
|-------------------------------------|

| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-002 (CI 통합) | EC-04 (브라우저 바이너리 미설치) | npx playwright install 누락 시 CI 실패 — workflow step 명시로 사전 차단 |
| AC-004 (1000행 가상화) | EC-03 (timeout) | 가상화 story 5초 초과 가능 → 15000ms 연장 필요 |
| AC-005 (baseline 문서화) | EC-01 (1차 실행 baseline 없음) | 최초 baseline 생성 절차가 문서에 명시 필요 |

---

## Section 7: 구현 파일 목록 (implementFiles)

**권위**: 이 테이블이 최종 구현 파일 목록의 단일 권위 (C-30).  
**prefix 기준**: monorepo prefix `D:/project/topvel_project/topvel-grid-monorepo/` (D1 결정, C-28 준수).  
**외부 저장소 명시**: 모든 경로는 `topvel-grid-monorepo` 외부 저장소 위치 — ADR-MOD-GRID-00-001 결정 준수.

| # | 파일 경로 | 변경 유형 | 내용 |
|---|-----------|-----------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/playwright.config.ts` | NEW | Playwright 설정 — `testDir: ./tests/visual`, `baseURL: http://localhost:6006`, chromium project, screenshot threshold 설정 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/tests/visual/storybook.spec.ts` | NEW | Storybook stories.json 동적 읽기 → 12개 story iframe URL 순회 → toMatchSnapshot 비교. timeout 연장 (EC-03) 포함 |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/.github/workflows/visual-regression.yml` | NEW | GitHub Actions 워크플로우 — pnpm install → build-storybook → playwright install → visual:test → block-on-migration-impact job (D7) |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/visual-regression.md` | NEW | baseline 업데이트 절차 문서 — `pnpm visual:update-baseline` 실행 → git commit 절차, EC-01/EC-02 대응 가이드 (AC-005) |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/package.json` | MODIFY | `visual:test` + `visual:update-baseline` scripts 추가. `@playwright/test ^1.40` devDep 추가 (D2 결정) |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/package.json` | MODIFY | monorepo root `visual:test: pnpm -F docs visual:test` script 추가 (D2 결정) |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/.claude/tw-grid/decisions/MOD-GRID-99-B-decisions.md` | MODIFY | ADR-007 Chromatic vs Playwright 비교 + Playwright 채택 결정 (4 trade-off) 추가 (D5 결정, C-9/C-14/C-20 준수) |

**집계**: NEW 4개, MODIFY 3개, 합계 7개

> **D2 보충**: goals.json 원본 3개 대비 `tests/visual/storybook.spec.ts` NEW, `apps/docs/package.json` MODIFY, monorepo root `package.json` MODIFY, `decisions.md` MODIFY 추가. `@playwright/test` devDep + scripts 없이는 AC-002/AC-005 이행 불가. ADR 없이는 C-9/C-20 위반.  
> **D1 보충**: goals.json `D:/project/topvel_project/TOMIS/.github/workflows/...` 및 `D:/project/topvel_project/TOMIS/playwright.config.ts`는 TOMIS prefix — C-28 위반. 이 테이블의 `topvel-grid-monorepo/...` prefix가 권위 (C-28, C-30).

---

## Section 8: 사전 검증 (Preflight)

| 항목 | 내용 |
|------|------|
| 영향 받는 파일 수 | 0 (affectedUsageFiles: []) |
| 시각적 회귀 가능성 | N/A — 기존 UI 미변경 (CI 자동화 추가만) |
| 증분 적용 가능 여부 | 가능 — Playwright 설정 파일 독립 추가. Storybook 기존 stories 재활용 |
| 롤백 범위 | `.github/workflows/` + `tests/visual/` + `playwright.config.ts` 삭제 + `apps/docs/package.json` revert + monorepo root `package.json` revert. G-001/G-002 결과물 미변경. |
| Bundle impact | +0 KB (CI devDependencies 전용 — 런타임 패키지 미포함) |
| G-001/G-002 영향 | 기존 Docusaurus + Storybook 파일 미변경. `apps/docs/package.json` scripts/devDep 추가만. |
| 12 stories baseline | 총 12개 story 파일 baseline — G-002 산출 story 목록 기준 |

---

## Section 9: 의존성 (Dependencies)

**bundle 영향**: 0 KB (devDependencies 전용 — CI 실행 전용, 런타임 패키지에 미포함)

| 패키지 | 버전 | 라이선스 | 용도 | bundle 영향 |
|--------|------|----------|------|-------------|
| `@playwright/test` | ^1.40 | Apache-2.0 | Playwright 테스트 프레임워크 + screenshot API | 0 KB |
| `playwright` | ^1.40 | Apache-2.0 | Playwright 코어 (브라우저 제어) | 0 KB |

> C-14/C-9/C-20 준수: 모든 신규 의존성 Apache-2.0 라이선스. ADR 기록은 ADR-007 (decisions.md MODIFY #7).  
> Chromatic 미채택: `chromatic ^11` (MIT) — SaaS 의존, 비용 발생, snapshot 한도 제약. ADR-007 trade-off 4개에 상세 기록.

**peerDependencies 정책 (C-22)**:
- `@playwright/test`는 CI devDep — peer 선언 대상 아님 (`apps/docs` private 패키지).

---

## Section 10: 사용자 여정 (User Journeys)

### 여정 1: 개발자 — PR 푸시 후 visual regression 확인

```
1. PR 생성 (feature branch → main)
2. GitHub Actions: visual-regression.yml 자동 트리거
3. Job: pnpm install → build-storybook → playwright install chromium → pnpm visual:test
4. 12개 story screenshot을 baseline과 비교
5a. 차이 없음 → PR check 통과
5b. 차이 발견 → PR check 실패 + playwright-report artifact 첨부
6. PR에 label migration-impact:high 시 block-on-migration-impact job 실행 → PR 차단 (AC-003)
```

### 여정 2: 개발자 — 의도적 UI 변경 후 baseline 업데이트

```
1. UI 변경 구현 (예: 그리드 셀 스타일 변경)
2. 로컬 Storybook 서버 실행: pnpm -F docs storybook
3. baseline 업데이트: pnpm visual:update-baseline
4. 변경된 baseline 확인 후 git add tests/visual/__snapshots__
5. git commit -m "chore(visual): update baseline for cell style change"
6. PR 푸시 → visual regression 통과 (새 baseline 기준)
```

### 여정 3: 첫 번째 baseline 생성 (EC-01)

```
1. pnpm install (Playwright 포함)
2. npx playwright install chromium
3. pnpm -F docs build-storybook (storybook-static/ 생성)
4. pnpm visual:update-baseline (baseline 생성)
5. git add + commit baseline
6. CI 최초 실행 시 비교 기준 확보
```

---

## Section 11: 구현 단계 (Implementation Steps)

> **E-01 준수**: 아래 모든 Step의 파일은 Section 7 테이블에 포함되어 있음.

### Step 1: `playwright.config.ts` NEW (파일 #1)

Section 2-1 코드 스니펫 기준으로 monorepo root에 생성.
- `testDir: './tests/visual'` — D4 결정 경로 (신규 디렉토리)
- `baseURL: 'http://localhost:6006'` — Storybook static URL
- `projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]` — chromium 단일 브라우저
- `maxDiffPixelRatio` 기본값 설정 (각 test에서 override 가능)
- `fullyParallel: false` — screenshot 재현성 보장

### Step 2: `tests/visual/storybook.spec.ts` NEW (파일 #2)

Section 2-2 코드 스니펫 기준으로 생성.
- `readFileSync` + `path.join` 으로 `storybook-static/stories.json` 동적 읽기 (D6 결정)
- `storyIds` 순회 → 각 story iframe URL(`/iframe.html?id=<storyId>&viewMode=story`) 접근
- `toMatchSnapshot('<storyId>.png', { maxDiffPixelRatio: 0.01 })` — EC-02 threshold
- `storyId.includes('virtual') || storyId.includes('1000')` → timeout 15000ms — EC-03

**Before (파일 미존재)**:
```
tests/visual/ 디렉토리 없음
```

**After**:
```typescript
// tests/visual/storybook.spec.ts
import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

const storiesJsonPath = path.join(
  __dirname,
  '../../apps/docs/storybook-static/stories.json'
);

// ... (Section 2-2 전체 코드)
```

### Step 3: `.github/workflows/visual-regression.yml` NEW (파일 #3)

Section 2-3 코드 스니펫 기준으로 생성.
- `on: pull_request: branches: [main]` — D7 결정 트리거
- steps 순서 엄수: `pnpm install` → `pnpm -F docs build-storybook` → `npx playwright install --with-deps chromium` → `pnpm visual:test` → `upload-artifact` (failure 시)
- `block-on-migration-impact` job: `needs: visual-regression` + `if: failure() && label 조건` → `exit 1`

### Step 4: `apps/docs/visual-regression.md` NEW (파일 #4)

AC-005 이행: baseline 업데이트 절차 문서화.

```markdown
# Visual Regression 가이드

## baseline 업데이트 절차
1. 로컬 Storybook 실행: `pnpm -F docs storybook`
2. baseline 갱신: `pnpm visual:update-baseline`
3. 변경 확인 후 커밋: `git add tests/visual/__snapshots__ && git commit -m "chore(visual): update baseline"`

## 첫 번째 baseline 생성 (EC-01)
1. `npx playwright install chromium`
2. `pnpm -F docs build-storybook`
3. `pnpm visual:update-baseline`

## CI 환경 차이 대응 (EC-02)
- CI(ubuntu + chromium) 환경에서 baseline 생성 권장
- 로컬 렌더링과 1% 이상 차이 발생 시 `maxDiffPixelRatio` 조정 (playwright.config.ts)
```

### Step 5: `apps/docs/package.json` MODIFY (파일 #5)

**Before** (G-002 완료 후 현황):
```json
{
  "scripts": {
    "docs:build": "docusaurus build",
    "docs:dev": "docusaurus start --port 3001",
    "docs:clear": "docusaurus clear",
    "build": "docusaurus build",
    "build-storybook": "storybook build",
    "storybook": "storybook dev --port 6006",
    "test": "echo TODO"
  },
  "devDependencies": {
    "@docusaurus/core": "^3.0.0",
    "@docusaurus/preset-classic": "^3.0.0",
    "@docusaurus/types": "^3.0.0",
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/addon-links": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "docusaurus-plugin-typedoc": "^1.0.0",
    "storybook": "^8.0.0",
    "typedoc": "^0.27.0",
    "typedoc-plugin-markdown": "^4.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

**After** (Playwright 추가):
```json
{
  "scripts": {
    "docs:build": "docusaurus build",
    "docs:dev": "docusaurus start --port 3001",
    "docs:clear": "docusaurus clear",
    "build": "docusaurus build",
    "build-storybook": "storybook build",
    "storybook": "storybook dev --port 6006",
    "visual:test": "playwright test",
    "visual:update-baseline": "playwright test --update-snapshots",
    "test": "echo TODO"
  },
  "devDependencies": {
    "@docusaurus/core": "^3.0.0",
    "@docusaurus/preset-classic": "^3.0.0",
    "@docusaurus/types": "^3.0.0",
    "@playwright/test": "^1.40",
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/addon-links": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "docusaurus-plugin-typedoc": "^1.0.0",
    "playwright": "^1.40",
    "storybook": "^8.0.0",
    "typedoc": "^0.27.0",
    "typedoc-plugin-markdown": "^4.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Step 6: monorepo root `package.json` MODIFY (파일 #6)

monorepo root `scripts`에 `visual:test` 추가:
```json
{
  "scripts": {
    "build": "pnpm -r --filter './packages/*' build",
    "typecheck": "pnpm -r --filter './packages/*' exec tsc --noEmit",
    "test": "pnpm -r test",
    "visual:test": "pnpm -F docs visual:test",
    "size": "...",
    "lint": "...",
    "changeset": "changeset"
  }
}
```

기존 scripts 전량 보존 (`build`, `typecheck`, `test`, `size`, `size-limit`, `size-limit:ci`, `lint`, `changeset`) + `visual:test` 1개 추가.

### Step 7: `decisions.md` MODIFY (파일 #7)

`decisions/MOD-GRID-99-B-decisions.md`에 ADR-007 추가.

ADR-007 상세:
- **결정**: Playwright 채택 (Chromatic 미채택)
- **trade-off 4개** (ADR-007 본문 — Section 13 참조)
- **라이선스**: Apache-2.0 (C-9 준수)
- **번들 영향**: 0 KB (devDep)

---

## Section 12: 검증 계획 (Validation Plan)

| AC | 검증 방법 | 담당 |
|----|----------|------|
| AC-001 (C-14) | `decisions/MOD-GRID-99-B-decisions.md`에 ADR-007 존재 확인. Chromatic vs Playwright trade-off 4개 이상 명시 확인. | 구현자 |
| AC-002 (C-13) | `.github/workflows/visual-regression.yml` 존재 확인. `apps/docs/package.json`에 `visual:test` script 존재 확인. workflow YAML syntax 검증 (`actionlint` 또는 GitHub Actions YAML schema). | 구현자 / CI |
| AC-003 (C-17) | workflow `block-on-migration-impact` job의 `if:` 조건에 `migration-impact:high` + `migration-impact:medium` label 조건 + `exit 1` 포함 확인 (Grep 검증). | 구현자 |
| AC-004 (C-18) | `tests/visual/storybook.spec.ts`에서 `storyIds` 순회 로직 확인 (stories.json 기반). `storyId.includes('virtual') || storyId.includes('1000')` timeout 처리 확인. | 구현자 |
| AC-005 (C-25) | `apps/docs/visual-regression.md` 존재 확인. `pnpm visual:update-baseline` 명령 + git commit 절차 명시 확인. EC-01(최초 baseline) + EC-02(OS 차이 대응) 가이드 포함 확인. | 구현자 |

---

## Section 13: 상용화 고려사항 (Commercialization)

| 항목 | 내용 |
|------|------|
| packageTarget | `apps/docs` (private, UNLICENSED — 외부 배포 대상 아님) + monorepo root CI 설정 |
| 도구 선택 | **Playwright** (Apache-2.0 OSS) — ADR-007에 4 trade-off 기록 (AC-001, C-14) |
| C-13 충족 선언 | **본 Goal이 C-13 시각 회귀 검증 의무를 충족한다.** GitHub Actions CI + Playwright screenshot 비교로 영향 사용처 외관 보존 자동 검증. |
| C-17 충족 선언 | **본 Goal이 C-17 시각 회귀 검증 의무를 충족한다.** `block-on-migration-impact` job이 `migration-impact:high/medium` label PR의 visual regression 실패 시 자동 PR 차단 (AC-003). 이후 모든 high/medium Goal의 verify 단계 게이트로 동작. |
| C-18 충족 선언 | **본 Goal이 C-18 1000행 가상화 시나리오 시각 회귀를 포함한다.** `storybook.spec.ts`가 `grid-core/Grid 1000+행 가상화` story를 순회 + timeout 연장으로 검증 (AC-004). |
| Chromatic 미채택 사유 | ADR-007 참조: 비용(SaaS 유료), snapshot 한도(5000/month), 외부 서비스 의존, baseline git 관리 불가 — 4 trade-off로 Playwright 우위 확인. |
| 시각 회귀 baseline | `tests/visual/__snapshots__/*.png` — git commit으로 self-hosted. Git LFS 도입은 별도 Goal. |
| release 전제 조건 | 본 Goal 완료가 후속 high/medium migrationImpact Goal의 verify 단계 자동 게이트 역할 (C-17). |

**ADR-007 Chromatic vs Playwright trade-off 4개 (Section 13 인라인 기록)**:

| trade-off 항목 | Chromatic | Playwright |
|--------------|-----------|------------|
| **비용** | 무료 5000 snapshots/month → 12 stories × 다수 PR 시 초과 위험. 유료 플랜 $149+/month | OSS MIT/Apache-2.0 — 비용 없음. CI 컴퓨팅 비용만 (GitHub Actions 무료 2000분/month) |
| **외부 SaaS 의존** | Chromatic.com SaaS에 baseline 저장. 서비스 장애 시 CI 실패. API key 관리 필요. | 외부 서비스 없음. baseline은 git repo에 self-hosted. 오프라인 환경도 동작. |
| **GitHub Actions 통합** | Chromatic GitHub Action 필요 (`chromaui/action@v1`). 별도 CHROMATIC_PROJECT_TOKEN secret 설정. | 표준 YAML + `npx playwright install` 단일 step. secret 불필요. |
| **라이선스 제약** | Chromatic 서비스 약관 의존 (상용 SaaS). C-9 "MIT/Apache 2.0/BSD/ISC만 도입" — SaaS 서비스 약관은 패키지 라이선스 아니나 의존성 위험. | `@playwright/test` Apache-2.0 + `playwright` Apache-2.0 — C-9 완전 준수 |

---

## H 메타-게이트 자가 점검 (Self-Check)

| Gate | 항목 | 결과 |
|------|------|------|
| H-01 | referenceEvidence 경로 실재 여부 | PASS — Section 1 L0 (G-001/G-002 artifacts), L1 (`topvel-grid-monorepo/package.json`, `apps/docs/package.json`, `apps/docs/.storybook/main.ts`) 모두 Read 도구 확인 완료. L3 G-002 산출 12 stories 목록 G-002-spec.md Section 7에서 확인. R-A (AG Grid CI 참조) + R-W N/A 명시. |
| H-02 | Section 7 implementFiles 부모 디렉토리 실재 여부 | PASS — 조부모 `D:/project/topvel_project/topvel-grid-monorepo/` 실재 확인 (Glob + Read 도구 사용). `playwright.config.ts`는 monorepo root (실재). `tests/visual/`는 신규 생성 — D4 결정으로 명시. `.github/workflows/`는 신규 생성 — D3 결정으로 GitHub Actions 표준 경로 명시 + "외부 저장소" anchor 충족. `apps/docs/visual-regression.md`의 부모 `apps/docs/` 실재. ADR-MOD-GRID-00-001 외부 저장소 결정 cross-reference (H-02 sub-rule 2 anchor). |
| H-03 | 모든 AC 소스 태그가 다른 섹션에서 인용되는지 | PASS — C-14: Section 9 "C-14/C-9/C-20 준수" + Section 13 ADR-007 + D5 결정. C-13: Section 13 "C-13 충족 선언" + Section 4 도구 선택. C-17: Section 13 "C-17 충족 선언" + Section 2-3 workflow block-on-migration-impact + AC-003. C-18: Section 13 "C-18 충족 선언" + EC-03 + AC-004. C-25: Section 13 + AC-005 + visual-regression.md. |

**Self-grep 결과** (키워드 "재결정", "대체", "대신", "~로 변경"):
- "재결정": 0 hits
- "대체": 0 hits
- "대신": D1 결정 "대안 검토" 컬럼 내 설명용 (E-06 위반 아님)
- "변경 유형": Section 7 테이블 헤더 (E-06 무관)
- "변경": D2 결정 본문 설명용 (E-06 무관)

**Section 7 ↔ Section 11 일치성 (E-01)**:
- Step 1 → 파일 #1 (playwright.config.ts NEW) ✓
- Step 2 → 파일 #2 (tests/visual/storybook.spec.ts NEW) ✓
- Step 3 → 파일 #3 (.github/workflows/visual-regression.yml NEW) ✓
- Step 4 → 파일 #4 (apps/docs/visual-regression.md NEW) ✓
- Step 5 → 파일 #5 (apps/docs/package.json MODIFY) ✓
- Step 6 → 파일 #6 (package.json MODIFY) ✓
- Step 7 → 파일 #7 (decisions.md MODIFY) ✓

**집계**: 7개 Steps ↔ 7개 implementFiles — 완전 일치.

---

## Appendix B: C-35 Spec Writer Self-Check

### B-1. 함수 시그니처 동일성 스캔 (Same-Function Signature Scan)

| 함수/설정 | 등장 위치 | 시그니처 일치 여부 |
|-----------|-----------|------------------|
| `defineConfig` | Section 2-1 (import + 호출) | 단일 등장 — 모순 없음 ✓ |
| `pnpm visual:test` | Section 2-4 + Section 10 + Section 11 Step 5/6 + Section 12 | 동일 명령 `playwright test` ✓ |
| `pnpm visual:update-baseline` | Section 2-4 + Section 10 + Section 11 Step 4/5 + Section 12 | 동일 명령 `playwright test --update-snapshots` ✓ |
| `toMatchSnapshot` | Section 2-2 + Step 2 narrative | `toMatchSnapshot('<storyId>.png', { maxDiffPixelRatio: 0.01 })` 일치 ✓ |
| `maxDiffPixelRatio: 0.01` | Section 2-2 + Section 6 EC-02 + Step 1 narrative | 0.01 (1%) 일치 ✓ |

**결론**: 동일 함수/설정 값의 시그니처 불일치 없음.

### B-2. Import 사용 스캔 (Import Usage Scan)

Section 2-2 `storybook.spec.ts` 코드 블록 import 검사:

| Import | 사용 여부 |
|--------|-----------|
| `test, expect` from `@playwright/test` | `test(...)` + `expect(page).toMatchSnapshot(...)` 사용 ✓ |
| `readFileSync` from `fs` | `readFileSync(storiesJsonPath, 'utf-8')` 사용 ✓ |
| `path` from `path` | `path.join(__dirname, ...)` 사용 ✓ |

Section 2-1 `playwright.config.ts` 코드 블록 import 검사:

| Import | 사용 여부 |
|--------|-----------|
| `defineConfig` from `@playwright/test` | `defineConfig({...})` 사용 ✓ |
| `devices` from `@playwright/test` | `...devices['Desktop Chrome']` 사용 ✓ |

**결론**: 코드 스니펫 내 미사용 import 없음.

### B-3. promptSpecDrift 기록

| ID | 항목 | Drift 내용 | 처리 |
|----|------|-----------|------|
| PSD-001 | C-28 prefix 정정 | goals.json `TOMIS/.github/...` + `TOMIS/playwright.config.ts` → spec `topvel-grid-monorepo/...` | D1 결정으로 명시 |
| PSD-002 | 3→7 파일 확장 | goals.json 3개 → spec 7개 (핵심 spec.ts + 2 MODIFY + ADR MODIFY) | D2 결정으로 명시 |
| PSD-003 | `.github/` 신규 디렉토리 | H-02 sub-rule 3 패턴 매칭 필요 | D3 결정으로 명시 |
| PSD-004 | `tests/visual/` 신규 디렉토리 | H-02 sub-rule 확인 필요 | D4 결정으로 명시 |
| PSD-005 | ADR-007 trade-off 4개 의무 | C-9/C-20 ADR + 결정 사유 | D5 + Section 13 인라인 기록 |

**결론**: 모든 spec-drift 항목이 D# 결정 테이블에 명시됨.

---

*Spec 작성 완료: 2026-05-15*  
*C-1 준수: 9개 전제 파일 Read 완료 후 작성 (Section 1에 목록 명시)*  
*C-28 준수: Section 7 전체 monorepo prefix 사용 (D1 결정)*  
*C-30 준수: Section 7 테이블이 단일 권위, 재결정 표현 0건*  
*C-35 준수: Appendix B 자가 검증 완료 (함수 시그니처 + import 사용)*  
*도구 결정: Playwright (Apache-2.0 OSS, ADR-007 4 trade-off 기록)*
