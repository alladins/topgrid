# Visual Regression 가이드

G-003 산출 — Playwright 기반 시각 회귀 자동화 문서 (AC-005)

---

## 개요

Playwright가 Storybook static 빌드의 12개 story를 캡처하고 baseline 스크린샷과 비교합니다.
baseline 파일은 `tests/visual/__snapshots__/` 에 git commit으로 self-hosted됩니다.

---

## 전제 조건

```bash
# 1. 의존성 설치 (Playwright 포함)
pnpm install

# 2. Playwright Chromium 브라우저 설치
npx playwright install chromium
```

---

## 첫 번째 baseline 생성 (EC-01: baseline 미존재 시)

저장소를 처음 clone한 후, baseline 스크린샷이 없을 때 아래 절차를 따릅니다.

```bash
# 1. Storybook static 빌드
pnpm -F docs build-storybook

# 2. Storybook static 서버 실행 (별도 터미널)
npx http-server apps/docs/storybook-static --port 6006

# 3. baseline 스크린샷 생성
pnpm visual:update-baseline

# 4. baseline 커밋
git add tests/visual/__snapshots__
git commit -m "chore(visual): add initial baseline snapshots"
```

---

## baseline 업데이트 절차 (의도적 UI 변경 시)

UI를 의도적으로 변경한 후 baseline을 갱신할 때 사용합니다.

```bash
# 1. Storybook 서버 실행 (별도 터미널)
pnpm -F docs storybook
# 또는 static 빌드 후 서버
pnpm -F docs build-storybook
npx http-server apps/docs/storybook-static --port 6006

# 2. baseline 갱신
pnpm visual:update-baseline

# 3. 변경된 baseline 검토 후 커밋
git add tests/visual/__snapshots__
git commit -m "chore(visual): update baseline for <변경 내용 요약>"
```

---

## 로컬 visual regression 테스트 실행

```bash
# Storybook 서버가 localhost:6006 에서 실행 중인 상태에서:
pnpm visual:test

# 또는 monorepo root에서:
pnpm visual:test
```

---

## CI 환경 차이 대응 (EC-02)

CI 환경(ubuntu + chromium)과 로컬 환경(macOS/Windows) 사이의 픽셀 렌더링 차이가 발생할 수 있습니다.

**현재 threshold 설정**: `maxDiffPixelRatio: 0.01` (1%)

threshold 조정이 필요한 경우 `playwright.config.ts` 및 `tests/visual/storybook.spec.ts`의 `maxDiffPixelRatio` 값을 수정합니다.

**권장**: CI(ubuntu) 환경에서 baseline을 생성하면 CI 비교 정확도가 높아집니다.

---

## 1000행 가상화 story 처리 (EC-03)

`grid-core/Grid 1000+행 가상화` story는 렌더링 시간이 길어 timeout 60초가 적용됩니다.
`storybook.spec.ts` 내 `isVirtualized` 조건으로 자동 처리됩니다.

---

## CI 실패 시 대응

1. GitHub Actions `playwright-report` artifact를 다운로드합니다.
2. diff 이미지를 확인하여 의도된 변경인지 비의도 회귀인지 판단합니다.
3. 의도된 변경이면 "baseline 업데이트 절차"에 따라 baseline을 갱신합니다.
4. 비의도 회귀이면 코드를 수정합니다.

---

## PR 차단 정책 (AC-003, C-17)

PR에 `migration-impact:high` 또는 `migration-impact:medium` label이 있고 visual regression이 실패하면 `block-on-migration-impact` job이 PR을 차단합니다.

label 없는 PR은 visual regression 결과가 참고 목적으로 표시되나 merge는 차단되지 않습니다.
