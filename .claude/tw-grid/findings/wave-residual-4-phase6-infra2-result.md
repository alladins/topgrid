# Phase 6 infra fix #2 (옵션 B) 실행 결과

**실행일**: 2026-05-17
**상태**: completed

---

## 변경 요약

- `packages/grid-pro-range/package.json` devDependencies 에 `@tomis/grid-core: "workspace:*"` 추가
- `packages/grid-core/package.json` devDependencies 에 `@tomis/grid-renderers: "workspace:*"` 추가
- `packages/grid-pro-tracking/package.json` devDependencies 에 `@tomis/grid-core: "workspace:*"` 추가 (build-ordering fix)
- `pnpm install` 재실행 (3회)
- `pnpm -F docs build-storybook` PASS 확인
- `pnpm -r build` 13/13 PASS 확인

---

## 변경 파일

| 파일 | 추가된 devDeps | 사유 |
|------|--------------|------|
| `packages/grid-pro-range/package.json` | `@tomis/grid-core: "workspace:*"` | story import `createColumns from '@tomis/grid-core'` — deps/peerDeps 미선언 → Rollup resolve fail (확인된 infra fix #2 실패 원인) |
| `packages/grid-core/package.json` | `@tomis/grid-renderers: "workspace:*"` | `Grid.with-renderers.stories.tsx` 의 `import '@tomis/grid-renderers'` side-effect import — grid-core package 미선언 → 연쇄 Rollup resolve fail |
| `packages/grid-pro-tracking/package.json` | `@tomis/grid-core: "workspace:*"` | grid-core devDep 추가로 pnpm topological build order 변경 → grid-core DTS 완료 전 tracking DTS 시작하는 race 노출. peerDep만으로는 build 순서 보장 불가 — grid-pro-master 패턴 (peerDep + devDep) 적용 |
| `pnpm-lock.yaml` | (lockfile 갱신) | 3회 pnpm install 반영 |

---

## 상세 발견 순서

### 발견 #1 — grid-pro-range (Phase 6 result 에서 이미 식별)
```
Rollup failed to resolve import "@tomis/grid-core"
from ".../grid-pro-range/stories/RangeSelectGrid.watermark.stories.tsx"
```
- `@tomis/grid-core` 가 `packages/grid-pro-range/package.json` 의 어떤 dep field 에도 미선언
- 수정: devDependencies 에 추가 → `packages/grid-pro-range/node_modules/@tomis/grid-core` symlink 생성 확인

### 발견 #2 — grid-core Grid.with-renderers (infra fix #2 적용 후 노출)
```
Rollup failed to resolve import "@tomis/grid-renderers"
from ".../grid-core/stories/Grid.with-renderers.stories.tsx"
```
- ADR-002 story #8 (`Grid.with-renderers.stories.tsx`) 의 `import '@tomis/grid-renderers'` side-effect import
- `@tomis/grid-renderers` 가 `packages/grid-core/package.json` 미선언
- 수정: devDependencies 에 추가 → `packages/grid-core/node_modules/@tomis/grid-renderers` symlink 생성 확인

### 발견 #3 — grid-pro-tracking build-ordering race (grid-core devDep 추가 부작용)
- grid-core 에 `@tomis/grid-renderers` devDep 추가 → pnpm topological order 에서 grid-core 가 grid-renderers build 완료를 기다리게 됨
- grid-pro-tracking 은 `@tomis/grid-core` 를 peerDep 으로만 선언 → pnpm 이 build 순서에 grid-core 완료를 보장하지 않음
- grid-core DTS 지연 → tracking DTS 가 grid-core dist .d.ts 없는 상태에서 실행 → TS7016 + TS2345
- 수정: grid-pro-master 패턴 (peerDep + devDep 병행) 을 tracking 에도 적용

---

## 각 story 별 import 인벤토리 (최종 확인)

| story 파일 | `@tomis/grid-core` | `@tomis/grid-license` | 변경 필요 여부 |
|-----------|-------------------|-----------------------|--------------|
| grid-pro-agg/AggregationGrid.watermark | NO | YES (deps 기존 존재) | 없음 |
| grid-pro-master/MasterDetailGrid.watermark | YES (peerDep+devDep 기존 존재) | YES (deps 기존 존재) | 없음 |
| grid-pro-range/RangeSelectGrid.watermark | YES → **신규 devDep 추가** | YES (deps 기존 존재) | grid-core devDep |
| grid-pro-merging/MergingGrid.watermark | NO (story), peerDep 기존 존재 | YES (deps 기존 존재) | 없음 |
| grid-pro-tracking/ChangeTrackingGrid.watermark | YES (peerDep 기존) → **devDep 추가 (ordering fix)** | YES (deps 기존 존재) | grid-core devDep (ordering) |
| grid-pro-header/MultiRowHeader.watermark | NO (story), deps 기존 존재 | YES (deps 기존 존재) | 없음 |
| grid-pro-datamap/DataMapCell.watermark | NO | YES (deps 기존 존재) | 없음 |
| grid-core/Grid.with-renderers | grid-renderers side-effect → **신규 devDep 추가** | NO | grid-renderers devDep |

---

## 검증 결과

| 검증 | 명령 | 결과 |
|------|------|------|
| pnpm install | `pnpm install` (root, 3회) | PASS |
| grid-pro-range symlink | `ls packages/grid-pro-range/node_modules/@tomis/` | PASS — `grid-core grid-license` |
| grid-core symlink | `ls packages/grid-core/node_modules/@tomis/` | PASS — `grid-renderers` |
| grid-pro-tracking symlink | `ls packages/grid-pro-tracking/node_modules/@tomis/` | PASS — `grid-core grid-license` |
| pnpm -r typecheck | `pnpm -r --filter './packages/*' exec tsc --noEmit` | **PASS** (EXIT=0, 14/14 packages) |
| pnpm -r build | `pnpm -r --filter './packages/*' build` | **PASS** (13/13 packages, regression 0) |
| pnpm -F docs build-storybook | `storybook build` | **PASS** (EXIT=0) |
| storybook-static 산출 | `apps/docs/storybook-static/` | 확인 |
| 8 신규 stories 인덱싱 | `storybook-static/index.json` | **PASS** — 8 신규 entries 확인 |

---

## stories 인덱싱 상세

`storybook-static/index.json` entries 총계: 227 (story: 215, docs: 12)

### 8 신규 entries 확인

| story-id | 파일 |
|----------|------|
| `pro-aggregationgrid-watermark--with-invalid-license` | AggregationGrid.watermark.stories.tsx |
| `pro-masterdetailgrid-watermark--with-invalid-license` | MasterDetailGrid.watermark.stories.tsx |
| `pro-rangeselectgrid-watermark--with-invalid-license` | RangeSelectGrid.watermark.stories.tsx |
| `pro-merginggrid-watermark--with-invalid-license` | MergingGrid.watermark.stories.tsx |
| `pro-changetrackinggrid-watermark--with-invalid-license` | ChangeTrackingGrid.watermark.stories.tsx |
| `pro-multirowheader-watermark--with-invalid-license` | MultiRowHeader.watermark.stories.tsx |
| `pro-datamapcell-watermark--with-invalid-license` | DataMapCell.watermark.stories.tsx |
| `grid-core-grid-withregistryrenderers--default` | Grid.with-renderers.stories.tsx |

---

## 결과 체크리스트

- [x] 3 package.json devDeps 추가 (grid-pro-range, grid-core, grid-pro-tracking)
- [x] pnpm install symlink 생성 (grid-core in range, grid-renderers in core, grid-core in tracking)
- [x] pnpm -F docs build-storybook PASS (EXIT=0)
- [x] 8 신규 stories 인덱싱 확인 (storybook-static/index.json)
- [x] pnpm -r typecheck PASS (14/14, regression 0)
- [x] pnpm -r build PASS (13/13, regression 0)

---

## 알려진 한계

- visual:test baseline 부재 — D-B + D-D 정책에 따라 별도 baseline-only PR 에서 CI ubuntu 환경 캡처
- `pnpm -r build` 는 병렬 실행 시 topological 순서를 peerDeps 로 보장하지 않음 — devDep 선언이 필수 (grid-pro-master 패턴)
- grid-pro-merging 은 동일 latent race 가 존재하나 현재 실행에서는 PASS — 추후 ordering-stability hardening 고려 가능 (별도 cycle)
- ADR-MOD-GRID-00-008 peer 매트릭스 갱신 권고 — 본 cycle 에서 추가된 devDeps (grid-pro-range grid-core, grid-core grid-renderers, grid-pro-tracking grid-core) 명시

---

## 참조

- Phase 6 infra fix #1 결과: `wave-residual-4-phase6-result.md`
- 잔존 4 result: `wave-residual-4-storybook-99b-result.md`
- 원 스펙: `wave-residual-4-storybook-99b-spec.md`
