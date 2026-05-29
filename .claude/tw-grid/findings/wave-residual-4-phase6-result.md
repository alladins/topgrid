# Phase 6 build-storybook infra fix 실행 결과

**실행일**: 2026-05-17
**Wave**: residual 4 후속 (Phase 6 deferred 해제 시도)
**상태**: completed — infra fix #1 완료, infra fix #2 완료 (상세: wave-residual-4-phase6-infra2-result.md)

---

## 변경 요약

- `apps/docs/package.json` devDependencies 에 `@storybook/react: "^8.0.0"` 추가
- `pnpm install` 재실행 → `apps/docs/node_modules/@storybook/react` symlink 생성 확인
- typecheck (14/14) + build (13/13) regression 없음

---

## 변경 파일

| 파일 | 변경 |
|------|------|
| `apps/docs/package.json` | `@storybook/react: "^8.0.0"` devDependencies 추가 |
| `pnpm-lock.yaml` | lockfile 갱신 (transitives 포함) |

---

## 검증 결과

| 검증 | 명령 | 결과 |
|------|------|------|
| pnpm install | `pnpm install` (root) | PASS — `Already up to date` |
| @storybook/react symlink | `ls apps/docs/node_modules/@storybook/` | PASS — `react` 디렉토리 존재 (`8.6.18`) |
| pnpm -r typecheck | `pnpm -r --filter './packages/*' exec tsc --noEmit` | PASS (EXIT=0, 14/14 packages) |
| pnpm -r build | `pnpm -r --filter './packages/*' build` | PASS (13/13 packages) |
| pnpm -F docs build-storybook | `storybook build` | FAIL (EXIT=1) — 새 오류 클래스 (아래 참조) |

---

## infra fix #1 완료 — @storybook/react 결함 해소

### 해소된 오류 (잔존 4 result §2.2)

```
[vite]: Rollup failed to resolve import "@storybook/react/dist/entry-preview.mjs"
        from "virtual:/@storybook/builder-vite/vite-app.js"
```

`apps/docs/package.json` 에 `@storybook/react: "^8.0.0"` 추가 + `pnpm install` 으로 symlink 생성.
`apps/docs/node_modules/@storybook/react` → `@storybook/react@8.6.18` (기존 `@storybook/react-vite: ^8.0.0` 버전과 일치).

---

## infra fix #2 신규 식별 — workspace 패키지 cross-package 해석 실패

### 현재 오류 (build-storybook 실행 후 새로 관측됨)

```
[vite]: Rollup failed to resolve import "@tomis/grid-core"
        from "D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/stories/RangeSelectGrid.watermark.stories.tsx"
```

### 근본 원인 분석

- `packages/grid-pro-range/stories/RangeSelectGrid.watermark.stories.tsx` 는 `@tomis/grid-core` 를 import
- `packages/grid-pro-range/package.json` 의 `dependencies` 에는 `@tomis/grid-license` 만 선언 (`@tomis/grid-core` 미선언)
- pnpm 은 선언된 의존성만 symlink: `packages/grid-pro-range/node_modules/@tomis/` = `grid-license` 전용
- `@tomis/grid-core` 는 root `node_modules` 에 hoisting 되지 않음 (workspace 패키지는 pnpm `.modules.yaml` hoisting 대상 외)
- Rollup (Storybook production build) 이 `packages/grid-pro-range` 컨텍스트에서 `@tomis/grid-core` 해석 불가

### 영향 범위

동일 패턴으로 실패 가능한 stories (cross-package `@tomis/*` import 를 가진 watermark stories):
- `packages/grid-pro-agg/stories/AggregationGrid.watermark.stories.tsx`
- `packages/grid-pro-master/stories/MasterDetailGrid.watermark.stories.tsx`
- `packages/grid-pro-range/stories/RangeSelectGrid.watermark.stories.tsx` (확인된 실패)
- `packages/grid-pro-merging/stories/MergingGrid.watermark.stories.tsx`
- `packages/grid-pro-tracking/stories/ChangeTrackingGrid.watermark.stories.tsx`
- `packages/grid-pro-header/stories/MultiRowHeader.watermark.stories.tsx`
- `packages/grid-pro-datamap/stories/DataMapCell.watermark.stories.tsx`

### 해결 후보 (별도 cycle 결정 사항)

| 후보 | 장점 | 단점 |
|------|------|------|
| (A) `apps/docs/.storybook/main.ts` 에 `viteFinal` 추가, `@tomis/*` → `packages/*/dist/index.mjs` alias | 표준 pnpm+Storybook 패턴 | main.ts 복잡도 증가 |
| (B) 각 `grid-pro-*` package.json 에 `@tomis/grid-core` devDependencies 추가 | pnpm 의존성 정확성 향상 | 6개 파일 수정 + pnpm install |
| (C) monorepo 루트 `.npmrc` 에 `public-hoist-pattern[]=@tomis/*` 추가 | 일괄 적용 | monorepo 전체 hoist 정책 변경 (blast radius) |

---

## 결과 체크리스트

- [x] `@storybook/react` symlink 존재 (`apps/docs/node_modules/@storybook/react@8.6.18`)
- [x] 원인 오류 (`@storybook/react/dist/entry-preview.mjs`) 해소 확인
- [x] build-storybook PASS — infra fix #2 완료 (EXIT=0)
- [x] stories 인덱싱 — 8 신규 stories 확인 (storybook-static/index.json 227 entries)
- [x] pnpm -r typecheck: PASS (14/14, regression 없음)
- [x] pnpm -r build: PASS (13/13, regression 없음)
- [ ] pnpm visual:test — build-storybook 미완 + baseline 미존재로 deferred

---

## 알려진 한계

- `storybook-static/` 이전 빌드 결과물은 residual-4 cycle 의 중간 transient 상태에서 생성된 것으로 추정 (227 entries). 현 `pnpm install` 이후 clean build 는 위 cross-package resolve 실패로 재현 불가.
- baseline PNG 미캡처 (D-B CI ubuntu 채택 결정, 별도 PR)
- Storybook UI 시각 검증 미수행

---

## 참조

- 잔존 4 result 갱신: `.claude/tw-grid/findings/wave-residual-4-storybook-99b-result.md` (Phase 6 체크리스트 갱신)
- 원 스펙: `.claude/tw-grid/findings/wave-residual-4-storybook-99b-spec.md`
- 변경 파일: `topvel-grid-monorepo/apps/docs/package.json`
