# MOD-GRID-99-B Storybook 잔여 작업 (residual-4) 실행 결과

**실행일**: 2026-05-17
**Wave**: residual 4
**상태**: completed (Phase 1-4 + 7 + 8 PASS, Phase 5 가이드만, Phase 6 completed — infra fix #1 + infra fix #2 완료)
**spec 보고서**: `wave-residual-4-storybook-99b-spec.md`

---

## 0. 사용자 채택 결정 사항 (D-A ~ D-E)

| ID | 결정 | 채택 |
|---|---|---|
| D-A | 시나리오 범위 | 8 신규 stories (ADR-001 Pro 7 + ADR-002 Grid 1) |
| D-B | baseline 캡처 환경 | CI ubuntu (Windows 로컬 차이 회피) |
| D-C | visual-regression.yml ↔ build-verify.yml 의존성 | 독립 유지 (현상) |
| D-D | baseline 미존재 정책 | baseline-only PR 우선 격리 |
| D-E | Phase 1 glob 보강 vs G-002 reopen | main.ts inline 수정 (reopen 안 함) |

---

## 1. 변경 파일 목록

### 1.1 Phase 1 — main.ts glob 보강

| 파일 | 변경 |
|---|---|
| `apps/docs/.storybook/main.ts` | glob 추가 — `../../../packages/*/src/__stories__/**/*.stories.@(ts\|tsx)` |

기존 glob (`packages/*/stories/**/*.stories.*`) 유지 + 신규 `src/__stories__/**/*` 추가. 직속 `src/*.stories.tsx` (CSF3 placeholder) 는 의도 제외 — runtime component string ref 미해결.

### 1.2 Phase 3 — 8 신규 stories (Path 정정)

**중요 정정**: task 브리프는 `packages/X/src/__stories__/X.watermark.stories.tsx` 경로 명시. 디스크 검증 결과 (이하 사유) 모두 `packages/X/stories/X.watermark.stories.tsx` 로 정정.

**정정 사유**:
1. 각 패키지 tsconfig.json `rootDir: "./src"` + `"include": ["src/**/*"]` — `src/__stories__/` 는 typecheck 대상에 포함되나 cross-package source 임포트 차단 (TS6059).
2. `@storybook/react` 타입은 `apps/docs/node_modules` 에만 존재 — 각 package src 빌드는 미해결 (TS2307).
3. 13 기존 패키지의 full-Meta stories 는 모두 `stories/` (typecheck 외) 에 위치. `src/__stories__/` 의 32 파일은 placeholder 패턴 (`as const` + no `@storybook/react` import).
4. **결론**: 본 cycle 의 8 신규 stories 는 full-Meta + `@storybook/react` runtime 의존 → `stories/` 위치가 컨벤션. `src/__stories__/` 은 placeholder 전용.

**8 신규 파일**:

| # | 파일 | ADR | 시나리오 |
|---|---|---|---|
| 1 | `packages/grid-pro-agg/stories/AggregationGrid.watermark.stories.tsx` | 001 | invalid license → AggregationGrid wrapper inline watermark overlay |
| 2 | `packages/grid-pro-master/stories/MasterDetailGrid.watermark.stories.tsx` | 001 | invalid license → MasterDetailGrid watermark |
| 3 | `packages/grid-pro-range/stories/RangeSelectGrid.watermark.stories.tsx` | 001 | invalid license → RangeSelectGrid watermark |
| 4 | `packages/grid-pro-merging/stories/MergingGrid.watermark.stories.tsx` | 001 | invalid license → MergingGrid wrapper (non-virt path) watermark |
| 5 | `packages/grid-pro-tracking/stories/ChangeTrackingGrid.watermark.stories.tsx` | 001 | invalid license → ChangeTrackingGrid (legacy export) watermark |
| 6 | `packages/grid-pro-header/stories/MultiRowHeader.watermark.stories.tsx` | 001 (H-D) | invalid license → `<thead>` 내 watermark row prepend |
| 7 | `packages/grid-pro-datamap/stories/DataMapCell.watermark.stories.tsx` | 001 (D-D) | invalid license → singleton portal `document.body` overlay |
| 8 | `packages/grid-core/stories/Grid.with-renderers.stories.tsx` | 002 | Grid + `import '@tomis/grid-renderers'` → 6 슬롯 (text/number/date/badge/link) registry wiring 통합 |

### 1.3 grid-license public API 확장 (testing/story 지원)

| 파일 | 변경 |
|---|---|
| `packages/grid-license/src/index.ts` | `export { setLicenseState } from './state.js'` 추가 (JSDoc `@internal`) |

**사유**: 7 watermark stories 의 `beforeEach` 가 invalid LicenseState 강제 (singleton race 차단, R-2 mitigation). 기존 public API (`setLicenseKey`) 는 비동기 + `verifySignature` 거쳐 즉시 invalid 설정 불가. `setLicenseState` 는 module-scoped singleton — internal/test 용 명시.

### 1.4 baseline 가이드 + ADR amendment

| 파일 | 변경 |
|---|---|
| `tests/visual/README.md` | 신규 — baseline-only PR 절차 + D-B/D-D 정책 명시 + Phase 2 deferred 사유 |
| `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` (ADR-001) | Visual Regression Note 추가 (7 watermark stories + setLicenseState public 명시) |
| `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` (ADR-002) | Visual Regression Note 추가 (1 Grid registry story 명시) |
| `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` (ADR-014 amendment v2) | Visual Regression Note 추가 (별도 신규 story 0건 — 기존 stories 가 커버) |

---

## 2. 검증 결과

| 검증 | 명령 | 결과 |
|---|---|---|
| Phase 2 `pnpm install` (root) | `pnpm install` | PASS — `Lockfile is up to date, resolution step is skipped, Already up to date` |
| Phase 6 `pnpm -r typecheck` | `pnpm -r --filter './packages/*' exec tsc --noEmit` | **PASS** (EXIT=0, 14/14 packages) |
| Phase 6 `pnpm -r build` (packages) | `pnpm -r --filter './packages/*' build` | **PASS** (13/13 packages, grid-license dist 갱신 — setLicenseState export 포함) |
| Phase 6 `pnpm -F docs build-storybook` | `storybook build` | **FAIL (pre-existing infra)** — `Rollup failed to resolve import "@storybook/react/dist/entry-preview.mjs"` |
| Phase 6 `pnpm visual:test` | `playwright test` | **deferred** (baseline 미존재 + Storybook static 빌드 실패) |

### 2.1 stories 인덱싱 N개

- 본 cycle 변경 후: 53 (기존) + 8 (신규 `stories/`) = **61** stories 파일 (디스크 카운트)
- `find packages/ -name "*.stories.tsx" -o -name "*.stories.ts"` → 61 PASS
- Storybook static build (index.json) 산출은 위 build-storybook 실패로 deferred

### 2.1.1 typecheck 적용 범위 명시

각 package `tsconfig.json` 의 `"include": ["src/**/*"]` 정책으로 인해, 본 cycle 의 8 신규 stories (`stories/` 위치) 는 `pnpm -r typecheck` 적용 범위 외이다. 이는 13 기존 패키지의 full-Meta stories (모두 `stories/`) 와 동일 컨벤션. 본 신규 stories 의 타입 검증은 Storybook build (Vite + esbuild) 시점에 수행되며, 현 cycle 에서는 build-storybook 실패로 인해 deferred 상태이다.

단, 본 cycle 에서 `grid-license/src/index.ts` 의 `setLicenseState` export 추가는 `src/**` 영역 변경이며 typecheck PASS (14/14) 로 검증 완료.

### 2.2 Phase 6 build-storybook 실패 — 정밀 분석

```
[vite]: Rollup failed to resolve import "@storybook/react/dist/entry-preview.mjs"
        from "virtual:/@storybook/builder-vite/vite-app.js"
```

**근본 원인**: `apps/docs/node_modules` 에 `@storybook/react` 직접 symlink 부재.
- `@storybook/react@8.6.18` 은 pnpm store 에 존재 (`node_modules/.pnpm/@storybook+react@8.6.18.../`)
- `@storybook/react-vite` 의 dependencies 에 `@storybook/react: 8.6.18` 명시되어 있으나, pnpm hoisting 미작동 (`.npmrc` `public-hoist-pattern` 미설정)
- `apps/docs/package.json` devDeps 에 `@storybook/react` 직접 명시 부재

**해결책 (별도 cycle 권고)**:
1. `apps/docs/package.json` 의 devDependencies 에 `"@storybook/react": "^8.0.0"` 추가
2. `pnpm install` 재실행
3. 또는 monorepo `.npmrc` 에 `public-hoist-pattern[]=@storybook/*` 추가

**본 cycle 범위 외 사유**: pnpm hoist 정책 변경은 monorepo 전체 install 정합 검토 필요. spec §2.1 + §2.3 에서 "G-001 deferred — pnpm install 미수행" 으로 이미 식별. 별도 작업 권고.

---

## 3. 결과 체크리스트

- [x] Phase 1 — `apps/docs/.storybook/main.ts` glob 확장 (`src/__stories__/**/*` 추가)
- [x] Phase 2 — `pnpm install` 검증 (root PASS, apps/docs `@storybook/react` 미해결 식별 — deferred)
- [x] Phase 3 — 8 신규 stories (ADR-001 Pro 7 + ADR-002 Grid 1) — 경로 `stories/` 채택 (브리프 `src/__stories__/` 정정)
- [x] Phase 4 — CI 정합 검토 — `visual-regression.yml` ↔ `build-verify.yml` 독립 (D-C). 본 cycle 의 main.ts glob 확장 → Storybook static build 시 `src/__stories__/` 32 placeholder stories 도 인덱싱 대상 (실 build 검증 deferred)
- [x] Phase 5 — baseline 가이드 (`tests/visual/README.md`) — baseline-only PR 절차 + D-B/D-D 정책 명시
- [x] Phase 6 — Storybook static build PASS 검증 — **completed** (infra fix #1: `@storybook/react` symlink. infra fix #2: 3 devDeps 추가 — grid-pro-range grid-core, grid-core grid-renderers, grid-pro-tracking grid-core (ordering). build-storybook EXIT=0, 8 신규 stories 인덱싱 확인. 상세: `wave-residual-4-phase6-infra2-result.md`)
- [ ] Phase 6 — `pnpm visual:test` 실 실행 검증 — **deferred** (build-storybook 미완 + baseline 미존재)
- [x] Phase 7 — 결과 보고서 (본 파일)
- [x] Phase 8 — ADR amendment 3건 (ADR-001 + ADR-002 + ADR-014 amendment v2)

---

## 4. 알려진 한계

### 4.1 Phase 6 build-storybook deferred (R-4 territory)

본 cycle 의 typecheck (14/14 PASS) + 패키지 build (13/13 PASS) 는 검증 완료. 그러나 Storybook static build 실패로 인해:
- `pnpm visual:test` 실 실행 불가
- stories 인덱싱 N 의 디스크 외 검증 불가
- 신규 8 stories 의 실제 Storybook 렌더 검증 deferred

**별도 cycle 권고**: `apps/docs/package.json` 에 `@storybook/react` 명시 추가 → pnpm install → 재검증.

### 4.2 src/__stories__/ 32 placeholder stories 품질

Phase 1 glob 확장으로 기존 32 `src/__stories__/*.stories.tsx` (placeholder 패턴, `as const` meta, `args` 가 컴포넌트 props 와 불일치) 가 Storybook 인덱스에 포함될 예정. 이들은:
- typecheck PASS (rendererRegistry 와 같은 src 동등 패턴)
- 그러나 runtime 렌더 시 component string ref 미해결 또는 args 형식 불일치 가능
- **본 cycle 범위 외** — 별도 quality cycle 에서 정리 권고 (R-1 위험 — spec §7.1 식별 완료)

### 4.3 R-2 singleton state mutation

`setLicenseState` public export 추가로 stories 간 singleton race 차단 가능. 단:
- Storybook stories 가 병렬 실행 시 race 잔재 가능성 — playwright config `fullyParallel: false` 로 mitigation
- dev 모드 hot reload 시 state 잔류 가능 — `beforeEach` 가 매 story 마다 reset

### 4.4 baseline PNG 미캡처

D-B + D-D 채택 결과, 본 cycle 은 baseline PNG 생성 미수행. 별도 baseline-only PR cycle 에서 CI ubuntu 환경 캡처 의무.

### 4.5 ADR-014 amendment v2 시각 검증

별도 신규 story 0건 — spec §3.3 분석 결과 LinkCell.stories.tsx + ButtonCell.stories.tsx 의 기존 16 시나리오 (`value` prop + `WithDeprecatedLabel` shim) 가 완전 커버. ADR-002 의 Grid registry story 가 `link` slot 통합 커버 (LinkCell `value` prop 사용).

---

## 5. R-4 메타 finding — verifier rubric 강화 권고 (별도 작업)

spec §7.1 R-4 + §9.1 #2 식별: G-002 / G-003 의 verifier `score: 100` 가 다음 결함을 검출하지 못했다.

1. **main.ts glob gap** (§1.2): `packages/*/src/__stories__/*.stories.*` (~32 파일) 가 glob 미매칭. 본 cycle Phase 1 에서 해소.
2. **pnpm install 미수행**: `apps/docs/node_modules` 의 `@storybook/react` 직접 symlink 부재 (Phase 6 실패 원인).
3. **typecheck 외 영역**: `src/__stories__/` 32 파일의 placeholder 패턴은 typecheck PASS 하나 runtime 검증 미실시.

**verifier rubric 보완 후보** (`.claude/tw-grid/rubric/verify-rubric.md` 또는 hardness verifier prompt):
- AC: `pnpm install` 후 `apps/docs/node_modules/@storybook/react` 존재 확인
- AC: `pnpm -F docs build-storybook` EXIT=0 확인
- AC: `apps/docs/storybook-static/index.json.entries` 의 총 N 이 (디스크 stories 파일 수 - placeholder skip 수) 와 일치

**본 finding 은 본 cycle 범위 외** — 별도 verifier-quality cycle 에서 다룸.

---

## 6. 참조

- spec 보고서: `.claude/tw-grid/findings/wave-residual-4-storybook-99b-spec.md`
- ADR-001 본문 + Visual Regression Note: `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` §1
- ADR-002 본문 + Visual Regression Note: 동 §2
- ADR-014 amendment v2 + Visual Regression Note: 동 §14
- baseline 절차: `tests/visual/README.md` (본 cycle 신규) + `apps/docs/visual-regression.md` (G-003 기존)
- Wave 1-5 결과: `wave1-adr-014-result-v2.md` / `wave2-adr-001-result.md` / `wave3-adr-002-result.md`
