# Visual Regression — Baseline 캡처 절차

**작성일**: 2026-05-17 (MOD-GRID-99-B residual-4)
**갱신일**: 2026-05-18 (D-B 옵션 정정 — CI ubuntu → WSL2/Linux 로컬)
**목적**: Wave 1-5 시각 변경 (ADR-001 / ADR-002) 의 시각 회귀 baseline 확보 절차 명시.

본 문서는 `apps/docs/visual-regression.md` 의 보완 문서로, **baseline-only PR 격리 정책 (D-D 채택)** 의 구체 절차를 다룬다.

> **시각 변경 대상 정정 (2026-05-18)**: 원 작성 시 ADR-014 도 시각 변경 ADR 로 명시했으나, ADR-014 D-partial 의 실 구현(`LinkCell.tsx:44 displayValue = value ?? label`)은 additive shim 으로 기존 사용자 코드 픽셀 변화 0. baseline 의무는 **ADR-001 (watermark wiring) + ADR-002 (renderer wiring text/badge/link null 처리, badge chip 스타일링)** 만.

---

## 1. baseline PNG 캡처 환경 — D-B 정정 (WSL2/Linux 로컬)

> **2026-05-18 정정**: 원 잔존 4 implementer 의 "CI ubuntu" 채택은 사용자 인프라 부재로 부정확. 사용자 환경은 **Windows 10 + WSL2 (Docker 미설치)** — CI GitHub Actions ubuntu 환경을 사용하지 않음. baseline 캡처는 **WSL2 로컬** 에서 직접 수행.

baseline PNG 의 첫 캡처는 **WSL2 (Linux 동등) 로컬** 환경에서 수행한다. WSL2 는 Linux glibc + 폰트 동일 환경 → 향후 다른 Linux/macOS 개발자에게도 픽셀 호환.

### 절차 (WSL2)
```bash
# Windows PowerShell 에서 WSL2 진입
wsl

# monorepo 경로 진입 (WSL2 mount)
cd <repo-root>

# Playwright 의존 1회 설치 (WSL2 처음 캡처 시)
pnpm install
pnpm exec playwright install chromium

# baseline 캡처 (--update-snapshots flag)
pnpm visual:test --update-snapshots
```

캡처 후 `tests/visual/__snapshots__/` 의 PNG 들을 git commit + PR merge.

### 대안 (선택)
- **Windows 로컬 캡처**: Playwright Windows 지원 — 단 사용자가 유일 개발자이면 픽셀 차이 우려 없음. 다른 OS 개발자 합류 시 baseline 재캡처 필요.
- **시각 검증 자체 보류**: Storybook stories 인덱싱 유지 (build-storybook PASS), 시각 회귀 자동화 X. ADR-001/002 시각 변경은 수동 검증.

- 권고: `playwright.config.ts` 의 `maxDiffPixelRatio: 0.01` (1%) threshold 유지
- 출처: `apps/docs/visual-regression.md` L88

## 2. baseline-only PR 격리 — D-D 채택

baseline 미존재 (EC-01) 상태에서 일반 PR 에 시각 변경 + baseline 캡처를 함께 포함하면, visual diff 가 의미를 가지지 않는다. 다음 절차로 격리한다.

### 2.1 baseline-only PR 절차

```
1. 신규 브랜치 (예: chore/visual-baseline)
2. 본 README + 무관 commit 만 포함 (시각 변경 없음)
3. PR 신설 → visual-regression.yml CI ubuntu 실행
4. 첫 실행 시 baseline 미존재 → Playwright fail (의도)
5. CI workflow 에 `--update-snapshots` 단계 추가 또는
   playwright-report artifact 다운로드 후 로컬에서 generate
6. `tests/visual/__snapshots__/` 의 PNG 들을 PR 에 commit
7. PR merge → 후속 PR 들은 baseline 존재 가정으로 visual diff 수행
```

### 2.2 후속 PR 정책

- main 의 baseline 과 PR 의 visual diff 자동 비교 (`visual-regression.yml`)
- 차이 발견 시:
  - `migration-impact:high` 또는 `migration-impact:medium` label PR → `block-on-migration-impact` job 차단 (C-17)
  - label 없는 PR → 참고 표시 (block 안 됨)

### 2.3 baseline 갱신 (의도된 UI 변경)

`apps/docs/visual-regression.md` L48-64 절차 따름:

```bash
pnpm -F docs build-storybook
npx http-server apps/docs/storybook-static --port 6006
pnpm visual:update-baseline
git add tests/visual/__snapshots__
git commit -m "chore(visual): update baseline for <변경 내용>"
```

---

## 3. residual-4 신규 8 stories 의 baseline

본 cycle (2026-05-17, MOD-GRID-99-B residual-4) 에서 추가된 stories:

| # | 파일 | ADR | 시나리오 |
|---|---|---|---|
| 1 | `packages/grid-pro-agg/stories/AggregationGrid.watermark.stories.tsx` | 001 | AggregationGrid + invalid license → watermark overlay |
| 2 | `packages/grid-pro-master/stories/MasterDetailGrid.watermark.stories.tsx` | 001 | MasterDetailGrid + invalid license → watermark |
| 3 | `packages/grid-pro-range/stories/RangeSelectGrid.watermark.stories.tsx` | 001 | RangeSelectGrid + invalid license → watermark |
| 4 | `packages/grid-pro-merging/stories/MergingGrid.watermark.stories.tsx` | 001 | MergingGrid + invalid license → watermark |
| 5 | `packages/grid-pro-tracking/stories/ChangeTrackingGrid.watermark.stories.tsx` | 001 | ChangeTrackingGrid + invalid license → watermark |
| 6 | `packages/grid-pro-header/stories/MultiRowHeader.watermark.stories.tsx` | 001 (H-D) | `<thead>` 내 watermark row prepend |
| 7 | `packages/grid-pro-datamap/stories/DataMapCell.watermark.stories.tsx` | 001 (D-D) | singleton portal `document.body` overlay |
| 8 | `packages/grid-core/stories/Grid.with-renderers.stories.tsx` | 002 | Grid + registry renderers 통합 wiring |

이들 8 stories 의 baseline PNG 는 본 cycle 에서 캡처하지 않는다. 사유:
- D-B (CI ubuntu) 권고 채택 → 로컬 Windows 환경 캡처는 false positive 위험
- D-D (baseline-only PR 격리) 채택 → 별도 PR cycle 에서 수행

---

## 4. 알려진 한계 — pnpm install 미완 (Phase 2 deferred)

본 cycle 의 검증 단계에서 `pnpm -F docs build-storybook` 이 실패했다:

```
[vite]: Rollup failed to resolve import "@storybook/react/dist/entry-preview.mjs"
```

원인: `apps/docs/node_modules` 에 `@storybook/react` 가 직접 symlink 되지 않음 (pnpm hoisting). `@storybook/react-vite` 만 install 되어 있으며, `@storybook/react` 는 pnpm store 에 존재하나 apps/docs 에서 접근 불가.

영향:
- 본 cycle 의 typecheck (14/14 PASS) + 패키지 build (13/13 PASS) 는 검증 완료
- Storybook static build (`storybook-static/index.json`) 미생성 → stories 인덱싱 N 확인 deferred
- Playwright visual test 실 실행 deferred

해결책 (별도 cycle 권고):
- `apps/docs/package.json` 의 devDependencies 에 `"@storybook/react": "^8.0.0"` 명시 추가
- `pnpm install` 재실행
- 또는 `.npmrc` 의 `public-hoist-pattern` 에 `@storybook/*` 추가

---

## 5. 참조

- `apps/docs/visual-regression.md` — baseline 생성/갱신/CI 차단 절차
- `.github/workflows/visual-regression.yml` — CI workflow (ubuntu + chromium)
- `playwright.config.ts` — Playwright 설정 (baseURL :6006, maxDiffPixelRatio 0.01)
