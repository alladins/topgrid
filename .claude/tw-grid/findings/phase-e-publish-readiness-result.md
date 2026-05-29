---
title: Phase E — npm publish 사전 작업 검증 + L-2 TS fix
date: 2026-05-18
phase: Phase E (publish 사전 작업)
context: ADR-MOD-GRID-00-014 후속 — 외부 publish 직전 단계
status: completed (npm publish 자체는 사용자 의무, D 분류)
relatedAdrs:
  - ADR-MOD-GRID-00-014 (scope rename)
relatedCommits:
  - monorepo 64e41b7 (rename + metadata)
  - monorepo 1254327 (EditableCell L-2)
  - TOMIS 7b5ce714 (TOMIS active SSoT rename + ADR-014)
---

# Phase E — publish 사전 작업 검증 결과

## 목적

`npm publish @topgrid/*` 실행 전 *사전 점검*. publish 자체는 사용자 의무 (D 비가역 분류).
본 cycle 은 메인이 advisor 결정 가능한 mechanical 검증만 수행:

1. LICENSE per package
2. README per package
3. `npm pack --dry-run` 시뮬레이션 (publish 내용 미리보기)
4. size-limit baseline (이미 commit 64e41b7 에서 확인)

추가 (L-2 잔존 finding):
5. publish 측 L-2 onStartEditing TS 2 errors fix (1줄 annotation)

## 검증 결과

### E-1. LICENSE per package

| Package | LICENSE | 내용 |
|---------|---------|------|
| `@topgrid/grid-core` | ✅ | MIT, Copyright (c) 2024 Topvel Inc. |
| `@topgrid/grid-renderers` | ✅ | MIT (동일) |
| `@topgrid/grid-features` | ✅ | MIT (동일) |
| `@topgrid/grid-export` | ✅ | MIT (동일) |

**상태**: 모든 4 MIT 패키지 LICENSE 존재. monorepo root 의 LICENSE 와 별도로 각 패키지 root 에 복사본 존재 (npm publish 시 패키지 단위 정책 준수).

### E-2. README per package

| Package | README.md | `@topgrid/` 명명 | 설치 안내 | peerDep 매트릭스 |
|---------|-----------|----------------|----------|---------------|
| `@topgrid/grid-core` | ✅ | ✅ | pnpm/npm/yarn | ✅ (react ^18/19, tanstack-table ^8, tanstack-virtual ^3) |
| `@topgrid/grid-renderers` | ✅ | ✅ | ✅ | ✅ |
| `@topgrid/grid-features` | ✅ | ✅ | ✅ | ✅ |
| `@topgrid/grid-export` | ✅ | ✅ | ✅ | ✅ |

**상태**: 모든 README 가 ADR-014 scope rename 반영 완료 (commit 64e41b7 mechanical replace 의 일부).

### E-3. `npm pack --dry-run` 시뮬레이션

각 4 MIT 패키지에서 `npm pack --dry-run --json` 실행. 결과:

| Package | files | unpacked | packed | LICENSE | README | dist/ | src/ excluded |
|---------|-------|---------|--------|---------|--------|-------|--------------|
| `@topgrid/grid-core` | 23 | 1227 KB | 305 KB | ✅ | ✅ | ✅ (20 files) | ✅ |
| `@topgrid/grid-renderers` | 9 | 211 KB | 56 KB | ✅ | ✅ | ✅ (6) | ✅ |
| `@topgrid/grid-features` | 9 | 257 KB | 56 KB | ✅ | ✅ | ✅ (6) | ✅ |
| `@topgrid/grid-export` | 17 | 168 KB | 35 KB | ✅ | ✅ | ✅ (?) | ✅ |

**관찰**:
- `src/` 가 *모든* 패키지에서 제외됨 (package.json `files` whitelist 정상 작동) — IP 보호 + 패키지 슬림화 PASS
- packed size: grid-core 305KB (가장 큼, 20 dist files = ESM+CJS+DTS+sourcemaps × 5 entries)
- 작은 패키지: grid-export 35KB
- 모두 LICENSE + README 포함

### E-4. size-limit baseline

monorepo commit 64e41b7 에서 이미 검증 (`pnpm size-limit` exit 0):

```
@topgrid/grid-pro-merging       Size limit: 20 kB   Size: 1.21 kB
@topgrid/grid-pro-header        Size limit: 20 kB   Size: 2.2 kB
@topgrid/grid-pro-agg           Size limit: 20 kB   Size: 3.12 kB
@topgrid/grid-pro-master        Size limit: 20 kB   Size: 10.01 kB
@topgrid/grid (meta)            Size limit: 150 kB  Size: 80.41 kB
```

(4 MIT 패키지의 size-limit 은 .size-limit.json 에 명시 — 위는 단순 sample)

### E-5. L-2 onStartEditing TS error fix (publish 측)

**문제**: ADR-MOD-GRID-00-014 commit 후 publish `npx tsc --noEmit` 에서 organizeSchedule/page.tsx L886-887 의 onStartEditing 콜백 파라미터에 implicit any 발생.

**원인**: GridProps 의 generic resolution 또는 inference scope 한계 — 콜백 파라미터 타입을 publish 측 TS 가 자동 추론하지 못함. 본 컴포넌트가 `<Grid<RowType>` 의 generic 활용을 부분적으로만 진행했기 때문 (L-2 implement 당시 generic param 누락).

**fix**: L886 의 `(rowId, colId) =>` 를 `(rowId: string | number, colId: string) =>` 로 명시 annotation.
- @topgrid/grid-core types.ts:528 의 시그니처와 1:1 동일
- 1 line change, 기능 영향 0

**검증 후**:
- publish typecheck total: 37 → **35 errors** (organizeSchedule 0 errors 복원)
- 35 errors 는 모두 react-hook-form types + 기타 pre-existing (rename / tw-grid 무관)

## 미수행 (사용자 의무 — critical-5)

| 단계 | 분류 | 사용자 액션 |
|------|------|------------|
| npmjs.com 계정 + 2FA | D | https://www.npmjs.com/signup + 2FA 활성화 |
| @topgrid org 생성 | D | https://www.npmjs.com/org/create (Free 플랜, $0) |
| `npm login` | D | 2FA OTP 입력 |
| `pnpm changeset publish` 또는 `npm publish --access public --otp <OTP>` | D (비가역) | 4 MIT 패키지 사용자 직접 실행 |
| publish 후 외부 설치 검증 | D | `npm install @topgrid/grid-core` 별 환경 |
| runtime browser 검증 | 사용자 의무 | `cd TBIZONE/publish && npm run dev` |

## 알려진 한계 / 잔존 작업

1. **L-2 TS annotation 은 publish 측 1줄**. 이상적 해결: @topgrid/grid-core 의 GridProps 를 정확한 generic 으로 노출 → 향후 ADR
2. **publish 35 pre-existing errors**: react-hook-form types (16 errors in utils/validation.ts 등) — tw-grid 외 별도 cycle
3. **apps/docs Docusaurus customCss config issue**: `pnpm build` 실패하나 Storybook + 패키지 빌드와 무관 — 별도 cycle
4. **storybook-static/index.json 의 stale `@tomis/` 1 hit**: .gitignore 포함이므로 git 추적 안 됨. 다음 `build-storybook` 시 자동 재생성

## 결론

✅ npm publish **technical readiness PASS**:
- 4 MIT package.json metadata 완비
- LICENSE per package
- README per package + `@topgrid/` 명명 통일
- `npm pack --dry-run` 정상 (src/ 제외, dist/ 포함, LICENSE/README 포함)
- size-limit 한도 내
- 13 패키지 typecheck 0 errors

❌ npm publish **business readiness** (사용자 영역):
- @topgrid npm org 미생성
- 2FA 미설정
- 사용자 publish 실행 권한 + 의지

## 다음 cycle 후보

- **즉시 (mechanical)**: 본 cycle 의 finding + L-2 fix 보고를 TOMIS commit
- **사용자 (critical-5)**: 위 "미수행" 표 진행
- **deferred (advisor 후 판단)**:
  - Phase 4 Playwright visual baseline 인프라 (3-4h 시간 비용 C 분류)
  - L-7~L-13 organizeSchedule UX hardening
  - publish 35 pre-existing TS errors 정리
  - apps/docs Docusaurus config fix

## 출처

- npm pack 결과 raw: 본 cycle 메인 직접 실행
- LICENSE/README 확인: ls + Read 메인 직접
- L-2 TS fix: Edit 도구 1 occurrence
- size-limit: commit 64e41b7 기록 인용
