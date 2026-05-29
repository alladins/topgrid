# MOD-GRID Refactor ADRs — 2026-05-17

> 16개 ADR. 모두 상태 `proposed`. 다음 세션에서 사용자 승인 후 실행.
> 근거: `findings/refactor-analysis-2026-05-17.md` (25 findings, 762 lines, P0 9 / P1 11 / P2 5).
> 분석자: opus47 (1M context). 모든 인용 file:line 또는 grep 결과로 뒷받침.

## Index

| ADR | 제목 | semver | 공수 | 우선순위 |
|-----|------|--------|------|---------|
| 001 | Pro license Watermark 실 wiring + 런타임 enforcement | minor | 4h | P0 (roadmap #1) |
| 002 | rendererRegistry cross-package wiring (grid-core ↔ grid-renderers) | minor | 6h | P0 (roadmap #2) |
| 003 | `@tomis/grid` 메타 패키지 실 export 활성화 | minor | 3h | P0 (roadmap #3) |
| 004 | tw-framework-front 5 variant → monorepo legacy alias 교체 | none (app) | 8h | P0 (roadmap #4) |
| 005 | `@tomis/grid-export` ↔ tw-framework-front `excelExport.ts` 통합 | minor or major | 6h | P0 (roadmap #5) |
| 006 | `TomisColumnDef` 이름 충돌 해소 (grid-pro-datamap rename) | major (datamap) | 2h | P0 (roadmap #6) |
| 007 | 4종 persistence hook → `grid-core/internal/storage` adapter 추출 | minor (internal) | 5h | P1 (roadmap #7) |
| 008 | tw-framework-front `types/tomis/grid.ts` → grid-core re-export | none (app) | 2h | P1 (roadmap #8) |
| 009 | grid-core ↔ grid-features layering 정리 (역의존 제거) | minor (features) | 6h | P1 (roadmap #9) |
| 010 | `SortBadge` 중복 제거 (grid-core/internal 단일화) | none | 1h | P1 (roadmap #10) |
| 011 | `.size-limit.json` ignore 정책 통일 | none | 1h | P1 (roadmap #11) |
| 012 | `DataTable/` 폴더 마이그레이션 계획 ADR | none (plan) | 4h | P0 (roadmap #12) |
| 013 | dead public API 정리 (`createTomisColumnHelper` 등) | minor | 2h | P1 (roadmap #13) |
| 014 | `as unknown as CellComponent` 14회 정리 | none | 2h | P1 (roadmap #14) |
| 015 | stale build artifact (`verifyLicense` 등) sweep | none | 1h | P2 (roadmap #15) |
| 016 | `onRowClick` 시그니처 통일 | minor | 3h | P1 (roadmap #16) |
| 017 | (결번 — sub-spec line 738 retraction, ADR-001 에 흡수) | n/a | 0h | n/a |
| 018 | registry slot 정책 — icon + 5 extras + alias (ADR-002 분리) | minor | 4h | P0 (Wave 4) |
| 019 | tw-framework-front `EditableGrid` 컴포넌트 폐기 (ADR-004 partial 해소) | none (app) | 0.5h | Residual |

총 예상 공수: ~56h.

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-001: Pro license Watermark 실 wiring + 런타임 enforcement

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 2 사용자 승인 — 옵션 A: invalid 시 Watermark 자동 렌더)
**범위**: **7/7 컴포넌트 강제** (사용자 결정 §9.1=B, granularity (b) 패키지 단위)
**Granularity (sub-spec)**: **(b) 패키지 단위** — 각 Pro 패키지마다 Watermark 1회. DataMapCell per-cell renderer 특성 정합
**MultiRowHeader (sub-spec)**: **H-D** — `<thead>` 내 추가 `<tr><th colSpan=N><Watermark/></th></tr>` 1행 (advisor 권고. HTML-valid, portal 불필요, SSR 무관, minor 호환)
**DataMapCell (sub-spec)**: **D-D** — module-level singleton portal via `useWatermarkEnforcement()` void hook + ref-counted createRoot 1회 mount (stacked portal 결함 회피)
**Invalid 영향 정책**: **minor + 즉시 Watermark 노출** (사용자 결정 §9.4=C — (b) granularity 채택으로 conjunction 만족)
**wrapper DOM (§9.2)**: 옵션 a (Merging/ChangeTracking wrapper `<div>` 도입)
**className 정책 (§9.3)**: 옵션 b (하드코드 relative)
**watermark row sticky (§9.3-sub)**: 옵션 a (sticky top-0)
**상태**: accepted (Wave 2 — 옵션 A + 7/7 강제 (b) + H-D + D-D, implemented 2026-05-17)
**참조**: 1차 spec `wave2-adr-001-spec.md` (586 lines), sub-spec `wave2-adr-001-sub-spec.md` (767 lines)
**연관 Goal/Module**: 7 Pro 패키지 (grid-pro-agg, grid-pro-datamap, grid-pro-header, grid-pro-master, grid-pro-merging, grid-pro-range, grid-pro-tracking) + grid-license
**연관 finding**: refactor-analysis-2026-05-17.md §2.1 (HEADLINE P0)
**연관 policy/constraint**: POL-DOC-LIC §1.2 (Pro 패키지 런타임 검증), C-33 (Pro 패키지 license stub — transitional), ADR-MOD-GRID-00-012 (transitional sunset 명시)

### 결정

7개 Pro 패키지가 현재 모듈 로드 side-effect 로만 `checkLicense()` 를 호출하고 결과를 폐기하는 상태를 종결한다. 각 Pro Grid 컴포넌트(`AggregationGrid`, `MergingGrid`, `MasterDetailGrid`, `RangeSelectGrid`, `MultiRowHeader`, `ChangeTrackingGrid`, `DataMapCell`)가 `grid-license` 의 런타임 상태(`getLicenseState()` / `useLicenseStatus()` hook — 추가 조사 필요, 보고서 §13 #9 참조)를 읽어 `watermarkRequired === true` 일 때 `<Watermark required />` 를 동일 트리에 렌더하도록 wiring 한다.

### 사유

- 보고서 §2.1: `Watermark` 컴포넌트가 어느 Pro 패키지 `src/` 에서도 import / 렌더되지 않음 (grep 결과 grid-license 패키지 자체 외 0건).
- 보고서 §2.1: `checkLicense()` 의 return 값(`LicenseCheckResult` — `valid`, `watermarkRequired`)이 폐기되어 `setLicenseKey('')` 미호출과 유효 키 호출의 런타임 동작이 동일.
- POL-DOC-LIC §1.2 는 "Pro 패키지 런타임 검증 호출" 을 명시 의무화. 현 상태는 컴파일타임 side-effect 만 존재 — 정책 의도와 정면 모순.
- ADR-MOD-GRID-00-012 의 transitional 인라인 stub 패턴은 MOD-GRID-99-A/G-002 (real `verifyGridLicense`) 출하 시점에 deprecation 예정 — 본 ADR 이 그 후속 enforcement step.

### 대안 (반드시 2개 이상)

1. **module load 시 invalid 면 `console.error` 만, 워터마크 미렌더**: 가장 가벼운 enforcement.
   - **각하 이유**: 사용자가 console 을 닫으면 enforcement 0. POL-DOC-LIC §1.2 "런타임 검증" 의무가 단순 로그로 충족된다고 보기 어려움. 비즈니스 결정 필요 (부록 C #1 참조).
2. **invalid 상태에서 Pro 컴포넌트 render 자체 차단 (throw or null return)**: 가장 엄격.
   - **각하 이유**: 사용자 앱이 dev 중 license 미설정 상태에서 화면 자체가 백색 → 개발자 경험 저하. dev/prod 분기 필요 (NODE_ENV 검사) — 정책 복잡도 ↑.
3. **license-aware HOC (`withLicenseGate(Component)`) 를 grid-license 에 추가 후 모든 Pro 컴포넌트 export 를 wrap**: 보고서 §2.1 제안 3.
   - **각하 이유**: HOC 도입은 별도 ADR (C-9 외부 패턴 변경) 필요. 현 wiring 부재가 더 시급 — HOC 는 단계 2 로 분리.

### Trade-off

| Pro | Con |
|-----|-----|
| POL-DOC-LIC §1.2 정책 의도 실현 — 워터마크가 invalid 상태에서 자동 렌더 | 7 Pro 패키지 × ~5 LOC = 35 LOC 추가 |
| `setLicenseKey('')` 와 유효 키 호출의 런타임 차별화 가능 | 사용자가 invalid 환경에서 즉시 워터마크 노출 — UX 변화 (minor breaking 신호) |
| ADR-MOD-GRID-00-012 sunset 경로의 enforcement 단계 명확화 | grid-license 의 hook/state API 가 미정의 시 별도 spec 선행 필요 (보고서 §13 #9) |

### 영향 분석

- **영향 패키지**: 7 Pro 패키지 + grid-license (state/hook 보강 필요 시).
- **예상 공수**: 4h (보고서 §12 #1).
- **위험**: low (보고서 §12 #1).
- **semver 영향**: **minor** — Watermark 자동 렌더는 새 동작 추가 (기존 valid-license 사용자에게 변화 없음). POL-COMPAT §3.1 semver 의무 — invalid 상태에서 워터마크 추가는 사용자가 watermark 를 의도적으로 우회한 경우 시각 회귀 가능 → 보수적으로 minor.
- **breaking change 여부**: no (valid license 사용자에게 변화 없음). 단, invalid license 사용자가 production 에 워터마크 노출 → 비즈니스 결정 필요.

### 실행 조건 (실행 전 충족 필요)

- 부록 C #1 비즈니스 결정 (워터마크 / 컴포넌트 차단 / dev 경고 중 enforcement policy 택1) 선행.
- `grid-license` 에 `useLicenseStatus()` hook 또는 `getLicenseState()` 의 React-friendly subscribe 메커니즘 확인 — 미존재 시 별도 spec 선행 (보고서 §13 #9 추가 조사 필요).
- ADR-MOD-GRID-00-012 의 인라인 stub 패턴 sunset 일정과 정렬.

### 결과 (실행 후 검증 항목)

- [x] 7 Pro Grid 컴포넌트 모두 invalid license 시 `<Watermark required />` 렌더 (코드 wiring 완료). 시각 회귀 검증은 Storybook 부트스트랩 후 (deferred).
- [ ] `setLicenseKey('')` 와 valid key 호출 시 visual diff 존재 (story screenshot) — Storybook 부트스트랩 deferred.
- [x] POL-DOC-LIC §5.1 정적 검증 통과 — Pro 패키지 src 내 Watermark 또는 useWatermarkEnforcement 사용처 7/7 (각 패키지 1+ hit).
- [x] grep `Watermark|watermarkRequired` packages/ → grid-license 외 사용처 7/7 패키지.

### Implementation Note — 2026-05-17

7/7 wiring 완료 — 옵션 A + (b) granularity + H-D + D-D 채택.

- **grid-license API 확장** (minor): `useLicenseStatus()` hook (useSyncExternalStore 기반), `useWatermarkEnforcement()` void hook (module-level singleton portal + ref-counted createRoot), `subscribeLicense(listener)` export 추가.
- **5 wrapper 컴포넌트 inline**: AggregationGrid (2 returns), MasterDetailGrid, RangeSelectGrid, MergingGrid (wrapper 도입 — non-virt path), ChangeTrackingGrid (wrapper 도입) — `useLicenseStatus()` 호출 + `<Watermark required />` overlay.
- **MultiRowHeader H-D**: `<thead>` 내 `<tr><th colSpan=N><Watermark required /></th></tr>` watermark row prepend. `enableStickyHeader === true` 시 `sticky top-0 z-20` 강제 (D-3 = a).
- **DataMapCell D-D**: `useWatermarkEnforcement()` void hook 호출 — 500 cell 활성화 시에도 portal 은 `document.body` 에 정확히 1회 mount (ref-count). 마지막 unmount 시 cleanup.
- **검증**: `pnpm -r typecheck` 14/14 PASS, `pnpm --filter "./packages/**" -r build` 13/13 PASS. grep `useLicenseStatus` packages/ → grid-license 정의 + 6 Pro 패키지 = 7. grep `Watermark` packages/ src → 7 Pro 패키지 + grid-license 자체.
- **Phase 5 보정 skip**: 1차 spec §2.2 가 7/7 패키지의 `@tomis/grid-license` 가 `dependencies: workspace:*` 임을 확인 — peerDep 보정 불요.
- **알려진 한계**: 단위 테스트 부재, Storybook 시각 검증 deferred (MOD-GRID-99-B 부트스트랩 후), D-D singleton 패턴의 SSR 환경 검증 미수행 (CSR 가정), inline `verifyOrWarn` / `_verifyGridLicenseStub` 잔재 sweep 은 별도 ADR (ADR-015 권고).
- **결과 보고서**: `.claude/tw-grid/findings/wave2-adr-001-result.md`

### Visual Regression Note — 2026-05-17 (MOD-GRID-99-B residual-4)

시각 검증 인프라 마무리 — Wave 1-5 잔존 4 (Storybook + Playwright visual regression).

- **신규 7 watermark stories**: 7 Pro 패키지 각각에 `WithInvalidLicense` story 추가 (invalid LicenseState 강제 + `<Watermark required />` overlay 검증).
  - `packages/grid-pro-agg/stories/AggregationGrid.watermark.stories.tsx`
  - `packages/grid-pro-master/stories/MasterDetailGrid.watermark.stories.tsx`
  - `packages/grid-pro-range/stories/RangeSelectGrid.watermark.stories.tsx`
  - `packages/grid-pro-merging/stories/MergingGrid.watermark.stories.tsx`
  - `packages/grid-pro-tracking/stories/ChangeTrackingGrid.watermark.stories.tsx`
  - `packages/grid-pro-header/stories/MultiRowHeader.watermark.stories.tsx` (H-D `<thead>` row)
  - `packages/grid-pro-datamap/stories/DataMapCell.watermark.stories.tsx` (D-D singleton portal)
- **public API 추가**: `@tomis/grid-license` 가 `setLicenseState` 를 export (testing/story 지원 — JSDoc `@internal`). singleton state mutation 으로 Storybook stories 의 `beforeEach` 에서 invalid LicenseState 강제 — singleton race 차단 (R-2).
- **baseline PNG**: 별도 baseline-only PR cycle 에서 CI ubuntu 환경 캡처 (D-B + D-D). 본 cycle 미수행.
- **검증**: `pnpm -r typecheck` 14/14 PASS, `pnpm -r --filter './packages/*' build` 13/13 PASS. Storybook static build 는 pre-existing `apps/docs` install 결함으로 deferred (`tests/visual/README.md` §4 참조).
- **결과 보고서**: `.claude/tw-grid/findings/wave-residual-4-storybook-99b-result.md`

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-002: rendererRegistry cross-package wiring (grid-core ↔ grid-renderers)

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 3 사용자 일괄 승인)
**상태**: implemented (Wave 3 — 2026-05-17 main implementer 완료, R-A + D-1A + D-2A + D-3A + D-4A)
**연관 Goal/Module**: MOD-GRID-04 (createColumns) + MOD-GRID-05 (grid-renderers)
**연관 finding**: refactor-analysis-2026-05-17.md §3.1 (HEADLINE P0), §1.1
**연관 policy/constraint**: C-31 (Functional Wiring Audit — cross-package 변종), POL-COMPAT §2 (peerDependencies)

### 결정

`grid-core` 의 placeholder `defaultRendererRegistry` (9 entries, 모두 `String(value)` placeholder) 와 `grid-renderers` 의 실 cell 컴포넌트 registry (14 entries, React 컴포넌트) 가 분리되어 `createColumns` 가 grid-renderers 의 실 컴포넌트를 사용하지 못하는 상태를 해결한다. **옵션 1** 채택: `grid-renderers` 의 entry index.ts 에 side-effect 로 `grid-core` 의 `registerRenderer` 를 호출하여 12 type 의 실 컴포넌트를 wire. `grid-renderers/package.json` 의 `peerDependencies` 에 `@tomis/grid-core` 추가.

### 사유

- 보고서 §3.1: `createColumns.ts:111` 이 자기 자신의 `grid-core/column/rendererRegistry.ts` 만 읽음. 이 registry 의 9 entries 는 모두 placeholder.
- 보고서 §3.1: `grid-renderers/src/rendererRegistry.ts:60-73` 의 14 entries (text/number/date/dateTime/badge/statusBadge/link/button/checkbox/check/icon/tag/avatar/progress) 는 실 React 컴포넌트지만 createColumns 가 읽지 못함.
- 보고서 §3.1: production code 에서 `registerRenderer` 호출 0건 (grep 결과 — createColumns.test.ts 의 단위 테스트만).
- 보고서 §3.1 주석 인용 (rendererRegistry.ts:7-9): "MOD-GRID-05 pending 단계에서 `registerRenderer()`로 실제 구현을 주입받는다" — 그러나 MOD-GRID-05 완료 시점에도 wiring 코드 부재. C-31 cross-package 변종 (G-001 buildPaginationOptions 와 동일 결함 패턴).
- 사용자 영향: `<Grid columns={createColumns([{type: 'number'}])} />` 가 type='number' 임에도 plain text 만 렌더 — 정책 의도 미달성.

### 대안 (반드시 2개 이상)

1. **`<Grid>` 가 옵션으로 `renderers={defaultRendererRegistry}` prop 받기 — 사용자 명시 wiring**: 보고서 §3.1 옵션 2.
   - **각하 이유**: 모든 사용자가 매번 wiring 코드 작성 — boilerplate. POL-MIG-STAGE 의 "zero-config default" 의도와 어긋남.
2. **grid-core 의 placeholder registry 제거 + `createColumns(defs, { renderers })` API 변경**: 보고서 §3.1 옵션 3.
   - **각하 이유**: breaking — 기존 `createColumns([...])` 호출처 전부 영향. MOD-GRID-04 의 API 표면 변경 → semver major. 위험 medium 보다 큼.
3. **grid-renderers 의 registry 를 grid-core 에 inline 이동 (단일 패키지 통합)**: 가장 단순.
   - **각하 이유**: Pro/MIT 경계 (POL-DOC-LIC) 유지를 위해 패키지 분리 의도 — grid-renderers 가 grid-core 와 분리된 이유 자체를 뒤집음. ADR-MOD-GRID-05 의 결정 retroactive 변경 부담.

### Trade-off

| Pro | Con |
|-----|-----|
| 사용자가 추가 wiring 없이 type='number' 등 실 렌더링 받음 — zero-config 실현 | `grid-renderers/package.json` 에 `@tomis/grid-core` peerDep 추가 — 현 무관계 (수정 필요) |
| C-31 cross-package wiring audit 정책 의도 실현 | side-effect import (`import '@tomis/grid-renderers'` 만 해도 wiring 발생) — tree-shake 시 wiring 제거 위험 (sideEffects: false 와 충돌) |
| MOD-GRID-04+05 통합 의도 단순 구현 (~30 LOC) | `defaultRendererRegistry` mutability 의존 — module load 순서 의존 |

### 영향 분석

- **영향 패키지**: grid-core (placeholder registry 제거 또는 유지), grid-renderers (side-effect wiring 추가).
- **예상 공수**: 6h (보고서 §12 #2).
- **위험**: medium — peerDep 추가 + sideEffects 처리.
- **semver 영향**: **minor** — grid-renderers 가 새 peerDep 추가 (사용자 install 시 peer warning) + grid-core 의 placeholder 동작 변경. POL-COMPAT §3.1 — 기존 동작이 placeholder text 였으므로 사용자가 의도적으로 의존했다고 보기 어려움 → minor 정당.
- **breaking change 여부**: no (valid 동작 추가). 단, 사용자가 placeholder text 동작에 의존한 코드가 있다면 마이그레이션 path: registry override.

### 실행 조건 (실행 전 충족 필요)

- ADR-001 워터마크 wiring 과 독립 실행 가능.
- `grid-renderers/package.json` peerDependencies 변경 ADR (C-9 외부 의존성 변경) — 본 ADR 이 그 ADR 의 역할 겸함.
- `grid-renderers/tsup.config.ts` 의 `sideEffects` 설정 확인 (false 이면 wiring import 보존 위한 명시 필요).
- ADR-006 (TomisColumnDef rename) 과 독립 — name collision (§1.1) 은 본 ADR 의 직접 범위 아님.

### 결과 (실행 후 검증 항목)

- [x] `import '@tomis/grid-renderers'` 만 해도 createColumns 가 실 컴포넌트 렌더 (wireRegistry.ts side-effect — 2026-05-17 구현).
- [x] grid-core 의 `defaultRendererRegistry` 가 import 후 6 슬롯이 어댑터로 교체 (단위 테스트는 Wave 3 follow-up; 빌드 산출물 검증: `dist/index.mjs` 가 `wireDefaultRenderers()` 호출 포함).
- [x] `pnpm size-limit` 통과 — grid-renderers 8.99 / 10 KB PASS (~1 KB 여유 — ADR-018 시 한도 상향 검토 권고).
- [x] grid-renderers/package.json peerDependencies 에 `@tomis/grid-core` 추가 검증 (workspace:*).

### Implementation Note — 2026-05-17

- spec 권고 조합 채택: **R-A + D-1A + D-2A + D-3A + D-4A**.
- spec `wave3-adr-002-spec.md` §7 Step 0~8 정확히 따름.
- **wired (6 슬롯)**: `text` / `number` / `date` / `dateTime` (`format: 'datetime'`) / `badge` / `link` — `wireRegistry.ts` 의 `wireDefaultRenderers()` 가 `registerRenderer(...)` 6회 호출.
- **NOT wired** (의도, 사유 각각):
  - `boolean` — grid-renderers 에 `BooleanCell` 없음. grid-core 기본 Y/N 유지.
  - `icon` — `IconCellProps.icon: ReactNode` 필수, value-only 어댑터 구조적 불가 (D-1A, F-2). ADR-018 분리.
  - `checkbox` — `createColumns.ts:96-108` DisplayColumnDef 분기로 registry 우회 (의도).
  - 5 extras (`button` / `tag` / `avatar` / `progress` + `statusBadge` / `check` aliases) — `TomisColumnType` union 외 (probe F-3, TS2345). ADR-018 분리.
- **placeholder fallback 유지 (D-3A)**: grid-core 의 9 entries 그대로 보존. grid-renderers 미import 시 graceful degradation (모든 `TomisColumnType` 가 `ReactNode` 반환).
- **peerDep 정합 (D-4A)**: `grid-renderers/package.json` 에 `"@tomis/grid-core": "workspace:*"` 추가 (ADR-009 §4.1 layering).
- **sideEffects**: `["./src/index.ts", "./dist/index.mjs", "./dist/index.cjs"]` — tree-shake 시 wiring 보존 (POL-BUNDLE §1).
- **probe 재현 결과**: `npx tsc --noEmit -p tsconfig.probe.json` EXIT=0 (구현 사전 검증).
- **검증**: `pnpm -r typecheck` 14 패키지 PASS. `pnpm --filter "./packages/*" build` 13 패키지 PASS. `apps/docs` 빌드 실패는 본 ADR 무관 (pre-existing docusaurus customCss).
- **spec 보고서**: `wave3-adr-002-spec.md`
- **결과 보고서**: `wave3-adr-002-result.md`
- **ADR 본문 가정 정정**: line 125 "12 type wire" → 실 wirable 6. line 170 "12+ entries" → 9 entries (TomisColumnType 한정), 6개가 어댑터로 교체.

### Spec divergence note

사용자 main implementer 작업 지시문에서 example 코드가 9 wiring (text/number/date/dateTime/statusBadge/badge/link/checkbox/check) 을 보여줌. 그러나:

1. spec §0+§3.2 (probe 검증) 는 6 wiring 만 명세.
2. `statusBadge` / `check` 는 `TomisColumnType` union 외 (probe F-3, TS2345 컴파일 실패).
3. `checkbox` 는 `createColumns.ts:96-108` DisplayColumnDef 분기로 registry 우회 — 호출은 무효.
4. spec `wave3-adr-002-spec.md` 가 contract 이며 "spec §7 Step 0-8 정확히 따름" 작업 지시 우선 (사용자 명시).

구현은 spec 6 wiring 을 채택. 사용자 example 의 추가 3 entries 는 ADR-018 (5 extras + aliases) 로 defer.

### Visual Regression Note — 2026-05-17 (MOD-GRID-99-B residual-4)

시각 검증 인프라 마무리 — Wave 1-5 잔존 4 (Storybook + Playwright visual regression).

- **신규 1 Grid registry story**: `packages/grid-core/stories/Grid.with-renderers.stories.tsx` — `TomisColumnDef.type` 문자열 ID (`text` / `number` / `date` / `badge` / `link`) → registry lookup → adapter → cell 컴포넌트 통합 시각 검증. side-effect `import '@tomis/grid-renderers'` 만으로 `createColumns()` 가 실 컴포넌트 렌더.
- **baseline PNG**: 별도 baseline-only PR cycle 에서 CI ubuntu 환경 캡처 (D-B + D-D). 본 cycle 미수행.
- **검증**: `pnpm -r typecheck` 14/14 PASS, `pnpm -r --filter './packages/*' build` 13/13 PASS.
- **결과 보고서**: `.claude/tw-grid/findings/wave-residual-4-storybook-99b-result.md`

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-003: `@tomis/grid` 메타 패키지 실 export 활성화

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 4 — ADR-002+006+013 의존성 해소 완료)
**실행일**: 2026-05-17 (Wave 4)
**상태**: implemented (Wave 4)
**연관 Goal/Module**: `packages/grid/` (meta package)
**연관 finding**: refactor-analysis-2026-05-17.md §6.4 (P0), §1.1 (선행 의존)
**연관 policy/constraint**: POL-MIG-STAGE (facade 의도), POL-COMPAT §3 (semver — meta minor)

### 결정

`packages/grid/src/index.ts` 의 `export {};` placeholder 1줄을 제거하고 모든 MIT 패키지 (grid-core, grid-renderers, grid-features, grid-export) + 모든 Pro 패키지 (grid-pro-*) 의 public API 를 re-export 하는 facade 로 활성화한다. **name collision 해결 (ADR-006 + ADR-013) 선행 필수.**

### 사유

- 보고서 §6.4: 현재 `packages/grid/src/index.ts` 가 `export {};` 단 1줄. README/docs 는 "facade — aggregates all packages" 라 광고하나 실 export 0건.
- 보고서 §6.4: 사용자가 `import { ... } from '@tomis/grid'` 시 항상 빈 객체 → 문서 mismatch.
- 보고서 §1.1: `defaultRendererRegistry`, `registerRenderer` 가 grid-core + grid-renderers 양쪽 export — meta 가 둘 다 re-export 하면 TS2308 충돌. ADR-002 (rendererRegistry wiring) 또는 ADR-013 (dead API 정리) 으로 name collision 선행 해결 필요.
- POL-MIG-STAGE: meta 패키지가 사용자 마이그레이션 진입점 의도 — placeholder 상태로 출시는 정책 의도 미달성.

### 대안 (반드시 2개 이상)

1. **`packages/grid` 를 `private: true` 로 설정하고 README 에서 "placeholder" 명시**: 보고서 §6.4 옵션 3.
   - **각하 이유**: 13 패키지 중 하나가 영구 placeholder 인 상태 — 모노레포 의도 (facade 제공) 와 정면 모순. publish 시 빈 패키지가 npm 에 노출 (이미 publish 됐는지 확인 필요 — 보고서 §13).
2. **meta 패키지를 monorepo 에서 제거**: 가장 깔끔.
   - **각하 이유**: README + docs/architecture.mdx 가 facade 패키지 약속 — 제거 시 문서 다수 수정 필요. 사용자 진입점 제공 의도 보존 필요.
3. **MIT 만 re-export, Pro 는 별도 `@tomis/grid-pro` 메타 신설**: 라이선스 경계 명확화.
   - **각하 이유**: 추가 패키지 도입 부담 + Pro 사용자 진입점이 변경 — 별도 ADR 필요. 현 13 패키지 구조 유지가 우선.

### Trade-off

| Pro | Con |
|-----|-----|
| 사용자 단일 진입점 (`@tomis/grid`) 실현 — README/docs 약속 충족 | meta 패키지 size-limit 150KB 한도 (ADR-MOD-GRID-00-007) — 실 export 후 측정 필요 |
| 13 패키지 facade 일관성 — POL-MIG-STAGE 의도 실현 | name collision 해결 (ADR-002 또는 ADR-006/013) 선행 dependency |
| 사용자가 import 한 곳만 변경 가능 (sub-package 또는 meta 선택) | tree-shake 가 meta facade 에서 잘 동작해야 — bundler 의존 |

### 영향 분석

- **영향 패키지**: grid (meta), 간접적으로 모든 12 패키지 (export 변경 없음).
- **예상 공수**: 3h (보고서 §12 #3).
- **위험**: medium — name collision 해결 선행 필요.
- **semver 영향**: **minor** — 빈 export → 실 export 추가. 기존 placeholder 사용자 (사실상 0건) 영향 없음. POL-COMPAT §3.1 — 새 export 추가는 minor.
- **breaking change 여부**: no (export 추가).

### 실행 조건 (실행 전 충족 필요)

- **ADR-006 (TomisColumnDef rename) 선행 필수** — grid-pro-datamap rename 후 collision 해소.
- **ADR-002 또는 ADR-013 선행 필수** — `defaultRendererRegistry` / `registerRenderer` collision 해소 (grid-core 의 placeholder 제거 또는 internal 강등).
- `pnpm size` 측정 결과 150KB 한도 통과 검증.

### 결과 (실행 후 검증 항목)

- [x] `import { Grid, createColumns, NumberCell, ... } from '@tomis/grid'` 성공 (tsc) — `pnpm -r typecheck` 14 packages PASS.
- [x] `pnpm size-limit` 통과 — grid meta **80.2 kB / 150 kB** PASS.
- [x] README/docs 의 facade 약속 일치 — README 전면 재작성 (13-package inventory + MIT-only guidance + collision table).
- [ ] tree-shake 검증 — meta 통해 import 시 사용 안 한 패키지 코드 미포함 (bundler 분석). 정적 보장: tsup `treeshake:true` + `sideEffects` 명시 + 재export-shim dist (1.5 KB ESM). 실측 (소비자 번들러 stats) 별도.

### Implementation Note (2026-05-17, Wave 4)

**상태**: `accepted → implemented`

probe 결과 collision 5건 (advisor 의 "20+ 예측" 보다 적음 — TypeScript 가 동일 identity 재-export 를 same-symbol 로 인식):

| Identifier | Sources | Canonical (facade choice) | Reason |
|------------|---------|---------------------------|--------|
| `defaultRendererRegistry` | grid-core (placeholder Map) + grid-renderers (Record) | `@tomis/grid-renderers` | ADR-002 D-3A — grid-core 의 placeholder 는 fallback 만 |
| `registerRenderer` | 동일 | `@tomis/grid-renderers` | 동일 |
| `TomisColumnDef` (type) | grid-core (canonical) + grid-pro-datamap (deprecation alias) | `@tomis/grid-core` | ADR-006 — grid-pro-datamap 의 `TomisColumnDef` 는 `@deprecated` alias |
| `GroupedHeaderGrid` | grid-core/legacy + grid-pro-header | `@tomis/grid-pro-header` | grid-core 의 legacy alias 는 C-6 thin wrapper |
| `GroupedHeaderGridProps` | 동일 | `@tomis/grid-pro-header` | 동일 |

**ADR-013 정합**: 6 `@deprecated` grid-core API 는 메타 facade 에서 명시적으로 제외 (ADR-013 §"다음 단계" 의 prohibition 정렬):
- `createTomisColumnHelper`, `createGroupedColumns`, `TomisColumnGroup`,
  `useColumnPersistence`, `ColumnVisibilityMenu`, `ColumnVisibilityMenuProps`.

**변경 파일**:
- `packages/grid/src/index.ts` — `export {};` (1 line) → 175-line facade with explicit + `export *` mix
- `packages/grid/package.json` — 12 workspace deps + `sideEffects` 필드
- `packages/grid/README.md` — 전면 재작성
- `packages/grid/CHANGELOG.md` — 0.1.0 entry
- `.changeset/adr-003-meta-facade.md` — minor

**검증**:
- `pnpm -r typecheck`: 14 packages PASS (0 errors)
- `pnpm --filter "./packages/*" build`: 13 packages PASS
- `pnpm size`: meta 80.2 kB / 150 kB PASS; all 12 sub-packages PASS
- `grep "from '@tomis/grid'" packages/grid/src/index.ts`: 0 (no self-import)
- Probe `tsc --noEmit` with naive `export *` × 12: 5 TS2308 errors (documented)
- Probe with explicit re-export pattern: 0 errors

**결과**: 실행 완료 (3 of 4 결과 체크 ✓ + 1 tree-shake 정적 보장; 실측 별도).

상세: `.claude/tw-grid/findings/wave4-adr-003-result.md`.

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-004: tw-framework-front 5 variant → monorepo legacy alias 교체

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 5 — 시각 baseline 옵션 A 수동 screenshot 채택, 부록 C #2)
**Wave 그룹**: ADR-012와 1 wave 묶음 (부록 C #6 옵션 A)
**상태**: accepted (Wave 5)
**연관 Goal/Module**: tw-framework-front (`src/components/tomis/Grid/*`) + grid-core (legacy)
**연관 finding**: refactor-analysis-2026-05-17.md §7.1 (P0)
**연관 policy/constraint**: POL-MIG-STAGE (사용처 점진 마이그레이션), C-31 (Functional Wiring Audit)

### 결정

tw-framework-front 의 자체 구현 5 variant (BaseGrid 291 LOC, ColumnPinGrid 220 LOC, TreeGrid 174 LOC, VirtualGrid 220 LOC, EditableGrid 251 LOC = 총 1156 LOC) 를 monorepo `@tomis/grid-core` 의 legacy alias 로 re-export (~16 LOC) 로 교체한다. EditableGrid 는 monorepo 대응 부재 — 별도 처리 (옵션 A: `grid-pro-tracking` 의 ChangeTrackingGrid 확장 또는 옵션 B: tw-framework-front 측 유지 후 별도 ADR).

### 사유

- 보고서 §7.1: 5 variant 가 tw-framework-front 측에서 자체 sort/filter/pagination 로직 유지 — monorepo alias 는 `<Grid>` 위임으로 정규화됨. **사용자가 페이지에서 import 하는 BaseGrid 와 monorepo BaseGrid 가 다른 코드.**
- 보고서 §7.1: 분기 진화 위험 — 5 variant 가 모노레포 측 alias 와 사양 drift 가능.
- 보고서 §7.1 인용 (`packages/grid-core/src/legacy/BaseGrid.tsx:4-6`): "AS-IS tw-framework-front 의 sort+filter ALWAYS wiring + pagination conditional 패턴을 유지" — alias 가 AS-IS 의도 유지. 그러나 페이지 import 경로 교체 미완.
- GroupedHeaderGrid (이미 2 LOC re-export), RangeSelectGrid, ChangeTrackingGrid 는 이미 정상 alias 패턴 적용 — 본 ADR 의 5 variant 도 동일 패턴 따름.

### 대안 (반드시 2개 이상)

1. **현 5 variant 그대로 유지 (status quo)**: 마이그레이션 비용 0.
   - **각하 이유**: 분기 진화 위험 누적. POL-MIG-STAGE 의도 미달성. 1156 LOC 의 dead-ish 중복 영구 보존.
2. **5 variant 자체 폐기 + 페이지 import 를 모두 `<Grid>` 로 직접 변경**: 가장 깔끔.
   - **각하 이유**: 페이지 측 props 시그니처 변경 발생 가능 — variant 별 prop 차이 (예: BaseGrid 의 자체 sort prop) 가 `<Grid>` 와 다름. 사용처 인벤토리 + 시각 회귀 검증 부담 ↑ (별도 ADR 필요).
3. **시각 회귀 baseline 잡은 후 alias 로 교체**: 보고서 §7.1 제안 2.
   - **각하 이유 (대안 아닌 본 ADR 의 실행 조건)**: 본 ADR 채택 시 시각 회귀 baseline 이 실행 조건이 됨 (아래 명시).

### Trade-off

| Pro | Con |
|-----|-----|
| 1156 LOC → ~16 LOC (5 × 2 line re-export) — 유지 부담 ↓ | EditableGrid 는 monorepo 대응 부재 — 별도 ADR 또는 잠정 유지 (추가 조사 필요, 보고서 §13 #2 페이지 import 인벤토리) |
| monorepo alias 가 AS-IS 행동 유지 의도 — 사용자 페이지 변경 0 (이론상) | 시각 회귀 검증 부담 — variant 별 1+ 페이지 screenshot diff |
| 분기 진화 차단 — single source of truth (monorepo) | 페이지 측 prop 시그니처가 자체 구현과 alias 사이 drift 시 type error 발생 가능 |

### 영향 분석

- **영향 패키지**: tw-framework-front (변경), grid-core (변경 없음 — 이미 legacy export 됨).
- **예상 공수**: 8h (보고서 §12 #4).
- **위험**: medium (보고서 §12 #4 — 시각 회귀 검증).
- **semver 영향**: **none (앱 내부 변경)** — tw-framework-front 는 npm publish 대상 아님. monorepo 패키지 자체 변경 0.
- **breaking change 여부**: no (앱 내부). 단, 페이지 측 prop 변경 발생 시 별도 처리.

### 실행 조건 (실행 전 충족 필요)

- **시각 회귀 baseline 확보** — 5 variant 각각 사용 페이지 1+ 의 screenshot 캡처. 부록 C #2 사용자 결정 (누가 baseline 잡을 것인가) 선행.
- **페이지 import 인벤토리** — 보고서 §13 #2 (`import .* (BaseGrid|ColumnPinGrid|TreeGrid|VirtualGrid|EditableGrid) from` tw-framework-front/src/pages/ grep 미수행). 이 인벤토리가 본 ADR 의 1단계.
- **EditableGrid 처리 정책 결정** — monorepo 대응 부재 → 잠정 자체 유지 또는 별도 추출 ADR (본 ADR 범위 외).

### 결과 (실행 후 검증 항목)

- [x] tw-framework-front `src/components/tomis/Grid/{BaseGrid,ColumnPinGrid,TreeGrid,VirtualGrid}.tsx` 각 6 LOC re-export 로 축소 (905 LOC → 24 LOC, net 881 LOC 절감, EditableGrid 251 LOC 잠정 유지).
- [ ] 모든 페이지 빌드 성공 (`pnpm build`).
- [ ] 시각 회귀 통과 — 5 variant 사용 페이지 screenshot diff 0 (사용자 수동 의무 — 페이지 import 인벤토리 0건 확인됨).
- [x] grep `from '@tomis/grid-core'` tw-framework-front/src/ → BaseGrid/ColumnPinGrid/TreeGrid/VirtualGrid alias 사용 확인 (4 파일).

### Implementation Note — 2026-05-17

**실행일**: 2026-05-17 (Wave 5)
**상태**: implemented (4/5 alias 교체, EditableGrid partial)

**변경 파일 (4개)**:
- `tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx` — 291 LOC → 6 LOC (`export { BaseGrid } from '@tomis/grid-core'`)
- `tw-framework-front/src/components/tomis/Grid/ColumnPinGrid.tsx` — 220 LOC → 6 LOC (`export { ColumnPinGrid } from '@tomis/grid-core'`)
- `tw-framework-front/src/components/tomis/Grid/TreeGrid.tsx` — 174 LOC → 6 LOC (`export { TreeGrid } from '@tomis/grid-core'`)
- `tw-framework-front/src/components/tomis/Grid/VirtualGrid.tsx` — 220 LOC → 6 LOC (`export { VirtualGrid } from '@tomis/grid-core'`)

**EditableGrid 부분 (1/5 — partial)**:
- monorepo 에 `EditableGrid` legacy wrapper 없음 (grid-core/src/legacy/ 에 BaseGrid, ColumnPinGrid, TreeGrid, VirtualGrid, GroupedHeaderGrid 만 존재)
- `EditableCell` (`@tomis/grid-renderers`) + `useChangeTracking` (`@tomis/grid-pro-tracking`) 를 조합하는 독자 구현 — 기능 동등 wrapper 없음
- 251 LOC 자체 구현 유지. 별도 ADR 권고 (grid-pro-tracking 의 ChangeTrackingGrid 확장 또는 새 legacy alias 추가)

**페이지 import 인벤토리 (보고서 §13 #2 추가 조사 결과)**:
- grep `(BaseGrid|ColumnPinGrid|TreeGrid|VirtualGrid|EditableGrid)` `tw-framework-front/src/pages/` → **0 pages**
- 5 variant 를 import 하는 페이지 없음 — 시각 회귀 위험 최소 (현재 미사용 컴포넌트)

**typecheck 결과**:
- baseline (변경 전): `PayReal01EditModal.tsx` 관련 7 errors (pre-existing, Grid 무관)
- 교체 후: 동일 7 errors — **신규 오류 없음**. `@tomis/grid-core` path alias (tsconfig.app.json L24 + vite.config.ts L18) 로 정상 해석.

**알려진 한계**:
- 4 alias 모두 `export default` 제거 (tw-front 원본은 `export default Component` 패턴). 현재 페이지 import 0건으로 영향 없음. 향후 `default import` 패턴으로 사용 시 named import 로 변경 필요.
- EditableGrid 미완: 별도 ADR 필요 (grid-core/legacy 에 EditableGrid 추가 또는 현 구현 공식 유지 결정).
- 시각 회귀 검증은 사용자 의무 (현재 페이지 import 0건으로 실질 위험 낮음).

**결과 보고서**: `.claude/tw-grid/findings/wave5-adr-004-result.md`

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-005: `@tomis/grid-export` ↔ tw-framework-front excelExport.ts 통합

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 2 사용자 승인 — 옵션 A: entry 2개 평행 지원)
**상태**: accepted (Wave 2 — 옵션 A, implemented 2026-05-17)
**연관 Goal/Module**: grid-export + tw-framework-front (`src/utils/tomis/excelExport.ts`)
**연관 finding**: refactor-analysis-2026-05-17.md §6.3 (P0)
**연관 policy/constraint**: POL-MIG-STAGE (사용처 마이그레이션), POL-COMPAT §3 (semver — API shape 변경)

### 결정

`@tomis/grid-export` 패키지 (production 사용처 0건) 와 tw-framework-front 자체 `utils/tomis/excelExport.ts` (TanStack `Table<TData>` 비기반, 행 배열 + ExcelColumn[] 기반) 의 API shape mismatch 를 통합한다. **옵션 1 채택**: `@tomis/grid-export` 에 entry 2개 (TanStack Table 기반 + ExcelColumn[] 기반 adapter) 를 모두 지원하도록 확장 후 tw-framework-front `excelExport.ts` 를 `@tomis/grid-export` 로 마이그레이션.

### 사유

- 보고서 §6.3: `grep "from ['\"]@tomis/grid-export" tw-framework-front/src/` → 0 hits. 13 패키지 중 1개가 실제 사용처 0건.
- 보고서 §6.3: tw-framework-front 의 `exportToExcel` (`utils/tomis/excelExport.ts:26-50`) 가 `XLSX.utils.aoa_to_sheet` 직접 사용 + 자체 column 모델 (`ExcelColumn { key, header, width?, format? }`).
- 보고서 §6.3: `@tomis/grid-export` 의 `exportToExcel` 은 TanStack `Table<TData>` 인스턴스 기반 — 모양 자체가 incompatible.
- POL-MIG-STAGE 의도 미달성: 13 패키지 facade 중 1 패키지가 평행 구현 + 사용처 0 상태로 dead 상태.

### 대안 (반드시 2개 이상)

1. **`@tomis/grid-export` 폐기 (production 사용자 0)**: 보고서 §6.3 옵션 4.
   - **각하 이유**: 13 패키지 facade 의도 (POL-MIG-STAGE) 훼손. xlsx/jspdf optional peer 설정 (ADR-MOD-GRID-00-008) 등의 결정 retroactive. 새 사용자 진입 막힘.
2. **tw-framework-front `excelExport.ts` 를 grid-export 의 Table-기반 API 로 교체 (행 배열 → Table 인스턴스)**: 보고서 §6.3 옵션 3.
   - **각하 이유**: tw-framework-front 페이지 측 호출자 모두 변경 부담. ExcelColumn[] 기반 호출자가 이미 정착 — 마이그레이션 비용 ↑↑.
3. **두 API 를 영구 평행 유지**: status quo.
   - **각하 이유**: 분기 진화 + 중복 유지 부담. 사용자 진입점 혼란.

### Trade-off

| Pro | Con |
|-----|-----|
| `@tomis/grid-export` 가 두 패턴 지원 — 기존 호출자 변경 0 + 신규 호출자도 Table 기반 가능 | grid-export 패키지 size 증가 — size-limit 20KB 한도 (ADR-MOD-GRID-00-007) 측정 필요 |
| tw-framework-front `excelExport.ts` 단순 re-export 또는 thin wrapper → 13 패키지 facade 일관성 | API shape 두 개 — 사용자가 어느 entry 사용할지 선택 부담 (docs 명확화 필요) |
| `@tomis/grid-export` production 사용처 ≥ 1 확보 — dead 상태 해소 | tw-framework-front 사용처 인벤토리 (보고서 §6.3 제안 1) 선행 작업 필요 |

### 영향 분석

- **영향 패키지**: grid-export (확장), tw-framework-front (마이그레이션).
- **예상 공수**: 6h (보고서 §12 #5).
- **위험**: medium (보고서 §12 #5 — API shape 다름).
- **semver 영향**: **grid-export minor 또는 major** — entry 추가 (minor) 또는 기존 `exportToExcel` 시그니처 변경 (major). 보고서 §12 #5 인용: "grid-export minor 또는 major". 권고: 새 entry `exportToExcelFromRows(rows, columns)` 추가 — minor.
- **breaking change 여부**: 본 ADR 권고안 (entry 추가) 에서는 no. 기존 Table 기반 API 변경 시 yes (마이그레이션 path 필요).

### 실행 조건 (실행 전 충족 필요)

- tw-framework-front 페이지의 `exportToExcel` 호출 인벤토리 (보고서 §6.3 제안 1).
- xlsx peerDependency (ADR-MOD-GRID-00-008) 사용 여부 확인.
- grid-export 의 현재 size-limit 측정 baseline.

### 결과 (실행 후 검증 항목)

- [x] grid-export 에 `exportRowsToExcel(rows, columns, options?)` entry 추가 (ADR-005 E-1, spec §9 Step 1).
- [x] tw-framework-front `utils/tomis/excelExport.ts` 삭제 (M-2 — thin adapter 아닌 직접 제거, N=1 환경).
- [x] grep `from '@tomis/grid-export'` tw-framework-front/src/ → 1 hit (`BscEval01ListPage.tsx:10`).
- [x] `pnpm build` 통과 — grid-export index.cjs 13.45 KB (한도 20KB 이내).
- [ ] 단위 테스트 — grid-export test 스크립트 = `echo TODO`. 후속 cycle 에서 vitest 인프라 추가 필요.

### Implementation Note — 2026-05-17

- 옵션 A 채택 + spec 권고 조합 (E-1 + F-1 + C-1 + M-2) 적용 완료.
- 신 함수: `exportRowsToExcel(rows, columns, options?)`. `fileName` 은 options 객체 (F-1).
- `ExcelColumn`, `ExportRowsOptions` 타입은 `src/types.ts` 에 정의 (spec §9 Step 2 권고).
- `columnsToExcel` 삭제 (C-1 — 호출자 0건, tw-front util 파일과 함께 자연 소멸).
- tw-front 호출자 1건 직접 변경 + 자체 util 67 LOC 삭제 (M-2).
- `emptyBehavior: 'empty'` 호출자에 명시 — 원 util 의 zero-row 파일 생성 거동 보존 (spec §3 B1/B2/B3 외 패리티 갭).
- 거동 패리티 B1/B2/B3 동등 구현 — 수동 검증 미수행 (단위 테스트 부재).
- tsconfig path `@tomis/grid-export` → `tw-framework-front/tsconfig.app.json` 에 추가 (vite.config 는 기존에 존재).
- build size: index.cjs 13.45 KB / index.mjs 12.72 KB (ADR-MOD-GRID-00-007 한도 20KB 통과).
- spec 보고서: wave2-adr-005-spec.md
- 결과 보고서: wave2-adr-005-result.md

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-006: `TomisColumnDef` 이름 충돌 해소 (grid-pro-datamap rename)

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 2 사용자 승인 — 옵션 B: deprecation alias 1 minor 유지 후 다음 major)
**상태**: accepted (Wave 2 — 옵션 B, additive deprecation alias)
**연관 Goal/Module**: grid-pro-datamap
**연관 finding**: refactor-analysis-2026-05-17.md §1.2 (P0)
**연관 policy/constraint**: POL-COMPAT §3.1 (semver — type rename major), ADR-MOD-GRID-12 (datamap rename 비교 미검증, 보고서 §13 #5 추가 조사 필요)

### 결정

`grid-pro-datamap` 의 `TomisColumnDef<TData>` (TanStack `ColumnDef<TData, unknown> & { dataMap?; selectOptions?; }` 확장) 을 **`DataMapColumnDef<TData>`** 로 rename 한다. 보고서 §1.2 제안 1 채택. `grid-core/src/column/types.ts:65` 의 `TomisColumnDef` (custom shape, no TanStack extends) 와의 이름 충돌 해소.

### 사유

- 보고서 §1.2: 같은 이름의 export 가 서로 다른 모델 의미 — grid-core 는 custom shape, grid-pro-datamap 은 TanStack 확장. shape 0% 동일.
- 보고서 §1.2: `grid-pro-datamap` 사용자가 grid-core 의 동명 타입이라고 오해할 위험.
- 보고서 §1.2 제안 2 (grid-pro-datamap 이 grid-core 의 TomisColumnDef 를 확장) 은 shape 호환 불가 — grid-pro-datamap 쪽 rename 이 안전.
- ADR-003 (메타 패키지 facade) 의 선행 의존성 — meta 가 두 `TomisColumnDef` 를 동시 re-export 하면 TS2308 충돌.

### 대안 (반드시 2개 이상)

1. **grid-core 의 TomisColumnDef 를 rename (예: `LegacyColumnDef`)**: grid-pro-datamap 유지.
   - **각하 이유**: grid-core 는 13 패키지 중 가장 광범위 사용 — rename 시 모든 사용처 영향. grid-pro-datamap (Pro 패키지, 사용처 좁음) rename 이 영향 최소.
2. **grid-pro-datamap 이 grid-core 의 TomisColumnDef 를 확장**: 보고서 §1.2 제안 2.
   - **각하 이유**: shape 0% 호환 — grid-core 는 TanStack 미상속, grid-pro-datamap 은 TanStack 상속. 강제 호환 위해 grid-core 의 TomisColumnDef 도 TanStack 상속 변경 → 더 큰 breaking.
3. **두 이름 영구 평행 유지 (status quo) + 사용자가 `import as` alias 사용 의무**: 마이그레이션 비용 0.
   - **각하 이유**: facade (ADR-003) 진행 차단. 사용자 혼선 영구 보존.

### Trade-off

| Pro | Con |
|-----|-----|
| ADR-003 (메타 facade) 의 선행 의존성 해소 — name collision 0 | grid-pro-datamap 사용자 마이그레이션 (예: `import { TomisColumnDef } from '@tomis/grid-pro-datamap'` → `DataMapColumnDef`) 필요 |
| 이름 의미 명확화 — `DataMapColumnDef` 는 dataMap 기능 명시 | grid-pro-datamap major bump (POL-COMPAT §3.1 type rename) |
| 코드 절감 0이나 사용자 혼선 비용 감소 (보고서 §1.2 — 0 LOC 절감) | 마이그레이션 가이드 CHANGELOG 의무 (POL-COMPAT §3.1) |

### 영향 분석

- **영향 패키지**: grid-pro-datamap.
- **예상 공수**: 2h (보고서 §12 #6).
- **위험**: low (보고서 §12 #6).
- **semver 영향**: **grid-pro-datamap major** — public type rename 은 breaking. POL-COMPAT §3.1 의무.
- **breaking change 여부**: **yes** — 마이그레이션 path: deprecation alias 1 minor 유지 후 다음 major 에서 제거. 또는 즉시 rename + CHANGELOG.md 마이그레이션 가이드.

### 실행 조건 (실행 전 충족 필요)

- ADR-MOD-GRID-12 의 `TomisColumnDef` rename rationale 검토 (보고서 §13 #5 — `.claude/tw-grid/decisions/MOD-GRID-12-decisions.md` 추가 조사 필요).
- CHANGELOG.md 마이그레이션 가이드 작성 (POL-COMPAT §3.1 의무).
- 사용처 인벤토리 — grid-pro-datamap `TomisColumnDef` import 사용자 (현재 추정 0건이나 검증 필요).

### 결과 (실행 후 검증 항목)

- [x] grid-pro-datamap `TomisColumnDef` → `DataMapColumnDef` rename 완료.
- [x] grid-pro-datamap CHANGELOG.md 마이그레이션 가이드 작성.
- [x] changeset minor 추가 (`.changeset/adr-006-tomis-column-def-rename.md`).
- [ ] ADR-003 (메타 facade) 의 name collision 해소 — meta re-export 시 TS2308 미발생.

### Implementation Note — 2026-05-17

채택 옵션 B 적용 완료. `DataMapColumnDef` primary + `TomisColumnDef` deprecation alias.

**사용처 인벤토리 결과**:
- 패키지 내부 (`packages/grid-pro-datamap/src/`): 4건 — `DataMapCell.tsx` (import, JSDoc, cast × 2). 모두 `DataMapColumnDef` 로 갱신.
- 외부 (tw-framework-front, 모노레포 타 패키지): 0건 — `@tomis/grid-pro-datamap` import 없음.
- stories (`DataMap.stories.tsx`): `TomisColumnDef` 미사용 (DataMapCell/DataMapEditor/createDataMap 만 import).

**ADR-MOD-GRID-12 rationale 비교**:
- MOD-GRID-12 의 ADR-002 는 intersection 패턴 채택 + 이름 `TomisColumnDef` 유지 결정. 본 ADR-006 의 rename 은 cross-package name collision (grid-core 의 동명 타입) 해소가 목적으로, ADR-002 의 shape 선택과 독립적이며 상충하지 않음.

**검증**:
- `pnpm -F @tomis/grid-pro-datamap typecheck`: PASS (0 errors)
- `pnpm -r typecheck`: PASS (0 errors, 14 패키지)
- `pnpm -F @tomis/grid-pro-datamap build`: PASS (dist/index.d.ts + .mjs + .cjs 생성)
- `grep DataMapColumnDef packages/grid-pro-datamap/src/` → 정의 + 내부 사용처
- `grep TomisColumnDef packages/grid-pro-datamap/src/` → 2 hits (alias 정의 + re-export 의도)

**다음 cycle**: 다음 major 시 `TomisColumnDef` alias 제거 검토.

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-007: 4종 persistence hook → `grid-core/internal/storage` adapter 추출

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 3 사용자 일괄 승인 — ADR-009 옵션 A 완료 후 선행 의존성 해소)
**상태**: accepted (Wave 3)
**연관 Goal/Module**: grid-core, grid-features, grid-pro-master
**연관 finding**: refactor-analysis-2026-05-17.md §8.3 (P1)
**연관 policy/constraint**: POL-COMPAT §3 (internal 변경 minor), C-31 (cross-package 의도 검증)

### 결정

4개 패키지의 localStorage persistence hook (`useStoragePersist` 147 LOC + `useColumnPersistence` 149 LOC + `useColumnOrderPersist` 84 LOC + `useExpandedPersistence` 198 LOC = 578 LOC) 의 공통 패턴 (SSR guard + try/catch + JSON.parse validate + QuotaExceededError 처리) 을 `grid-core/internal/storage.ts` 의 단일 `useTypedLocalStorage<T>({ key, schema, enabled })` 로 추출한다. 4 hook 이 본 adapter 를 wrap.

### 사유

- 보고서 §8.3: 4 × ~30 LOC = 120 LOC 의 duplicated boilerplate.
- 보고서 §8.3: `useColumnOrderPersist.ts:9` 주석 인용: "구조: grid-core/useStoragePersist.ts 미러 (D6 결정)" — 의도된 미러 (decision logged) 이나 storage adapter 추출 후보.
- 보고서 §8.3: bug fix 시 4 곳 동시 수정 필요 → drift 위험.
- 보고서 §8.3 예상 절감: ~80 LOC.

### 대안 (반드시 2개 이상)

1. **현 미러 패턴 유지 (status quo)**: 명시적 D6 decision 존중.
   - **각하 이유**: 4 hook drift 위험 누적. bug fix 시 4 곳 수정 부담.
2. **별도 `@tomis/grid-storage` 패키지 신설**: 가장 분리 명확.
   - **각하 이유**: 13 패키지 → 14 패키지 추가 부담. ADR-MOD-GRID-00-004 (peerDeps 매트릭스) + size-limit 추가 부담. internal adapter 로 충분.
3. **grid-core 의 public export 로 `useTypedLocalStorage` 추가**: 사용자 직접 사용 허용.
   - **각하 이유**: 4 hook 의 internal 구현 디테일 — public 노출 시 사용자가 직접 사용하면 hook 의도와 충돌. internal 로 한정.

### Trade-off

| Pro | Con |
|-----|-----|
| ~80 LOC 절감 + bug fix 단일 지점 | 4 hook 의 public API 유지 — 내부 wrap 만 변경 (사용자 영향 0) |
| `grid-core/internal/storage` 단일 source of truth | grid-core 가 grid-features + grid-pro-master 의 hook 들의 적용 대상이 됨 — layering 검토 (ADR-009 와 정렬) |
| 미러 패턴 D6 결정의 자연스러운 evolution | grid-core 의 `internal/` 폴더 export 정책 명확화 필요 (public 노출 방지) |

### 영향 분석

- **영향 패키지**: grid-core (storage adapter 추가), grid-features (hook 내부 변경), grid-pro-master (hook 내부 변경).
- **예상 공수**: 5h (보고서 §12 #7).
- **위험**: low (보고서 §12 #7).
- **semver 영향**: **minor (internal 변경)** — public API 변경 0, 내부 구현만. POL-COMPAT §3.1 — internal refactor 는 minor (no behavior change) 또는 patch. 보수적으로 minor.
- **breaking change 여부**: no.

### 실행 조건 (실행 전 충족 필요)

- ADR-009 (grid-core ↔ grid-features layering) 결정 — `grid-core/internal/` 에서 grid-features hook 이 의존하는 구조가 layering 정책과 정렬되어야 함.
- 4 hook 의 단위 테스트 baseline 확보 (SSR guard, QuotaExceededError 등).

### 결과 (실행 후 검증 항목)

- [x] `grid-core/internal/storage/` 신설 — `getStorage` + `readJson` + `readRaw` + `writeJson` + `writeRaw` + `removeKey` + `type StorageType` (`useTypedLocalStorage` 변형 → primitive helper 함수 세트로 조정; 4 hook 의 이질 envelope/setter 패턴 호환).
- [x] 4 hook 이 adapter 경유 (실 LOC 절감 ~10–30 LOC/hook; adapter +176 LOC; **drift 4 site → 1 site 가 핵심 가치**).
- [x] 4 hook 의 public API 시그니처 + return shape + 옵션 + envelope 변경 0 (typecheck PASS; 단위 test 는 사전 `@testing-library/react` 미설치 baseline 부재 — 본 ADR 실행조건 미충족 알려진 한계).
- [x] grid-core `src/index.ts` 의 main barrel 변경 0 — `internal/storage` 는 `./internal/storage` 별도 subpath 로만 노출 (`./legacy` 와 동일 convention). `@internal` JSDoc 으로 사용자 import 차단 명시. 본 ADR 대안 #3 (public 승격) 결정 존중.

### Implementation Note (2026-05-17, Wave 3 — 실제 구현)

ADR 본문 결정 ("internal 로 한정" + "사용자 영향 0" + "drift 단일 지점") 을 다음과 같이 구현:

1. **Subpath export `./internal/storage`** (precedent: `./legacy` G-005 D13) — 별도 패키지 신설 (각하 대안 #2) 부담 회피 + main barrel 노출 (각하 대안 #3) 회피 동시 달성. `package.json` exports + `tsup.config.ts` multi-entry 패턴은 `./legacy` 와 동일.
2. **Primitive helper 함수 세트** (`getStorage` / `readJson` / `readRaw` / `writeJson` / `writeRaw` / `removeKey`) — 본문이 명시한 `useTypedLocalStorage<T>({key, schema, enabled})` 단일 hook 대신 함수 primitive 로 조정. 4 hook 의 envelope 패턴이 너무 이질 (`{v,p}` URLSearchParams / `{v,data}` JSON / raw array / raw object) + setter 계약이 너무 이질 (void / `{saveOrder}` / `[state, setter]`) — 단일 hook 으로 강제 통일 시 envelope 추상화가 오히려 복잡도 증가. 함수 primitive 가 더 작고 명확. **`useStoragePersist` 이름 충돌 회피**: grid-core 의 기존 public `useStoragePersist` (GridState envelope hook) 와 동명 hook 신설은 confusion 유발 — adapter 는 hook 아닌 helper 함수 세트로 결정.
3. **LOC framing 정직화**: 본문 §8.3 예상 절감 ~80 LOC 는 boilerplate 라인 기준; adapter 자체가 ~176 LOC 라 net LOC 는 거의 중립. 본 ADR 의 실 가치는 **duplication 4 site → 1 site** (bug-fix 단일 지점).
4. **Cross-package internal sharing 결정**: 본문의 "internal 한정" 은 사용자 향 public API 노출 금지를 의미한다고 해석. monorepo 의 sister 패키지 (grid-pro-master) 가 deep import 하는 것은 `@internal` JSDoc + subpath naming 으로 명시. 외부 사용자 import 는 lint 또는 review 단계에서 차단 권장 (별도 ADR 후속).
5. **테스트 baseline**: 본문 실행조건 (4 hook 의 단위 테스트 baseline 확보) 은 미충족 — 패키지 환경에 `@testing-library/react` 가 사전 미설치 (vitest run 시 4 test file Cannot find package). 변경 검증은 `pnpm -r typecheck` 14 패키지 PASS + `pnpm -r --filter './packages/*' build` 13 패키지 PASS + production code 의 `localStorage.*` 직접 호출 0건 grep 검증으로 대체. **알려진 한계**: 동작 parity (debounce timing, hydration 순서, fallback 행위) 의 runtime 검증 부재.

### 결과 보고서

`D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/wave3-adr-007-result.md`

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-008: tw-framework-front `types/tomis/grid.ts` → grid-core re-export

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 3 사용자 일괄 승인 — ADR-016과 1 PR 묶음)
**상태**: accepted (Wave 3 — ADR-016과 묶음 진행)
**연관 Goal/Module**: tw-framework-front (`src/types/tomis/grid.ts`)
**연관 finding**: refactor-analysis-2026-05-17.md §1.4, §5.2, §7.3 (P1)
**연관 policy/constraint**: POL-COMPAT §3 (type 일관성), C-31 (cross-package type drift)

### 결정

tw-framework-front `src/types/tomis/grid.ts` 의 자체 type 정의 (`GridPaginationOptions`, `GridRowSelectionOptions`, `BaseGridProps` 등 5~7 type) 를 `@tomis/grid-core` 의 동등 type re-export 로 교체한다. ~30 LOC 절감.

### 사유

- 보고서 §1.4: tw-framework-front 의 `onSelectionChange?: (selectedRows: unknown[]) => void` (unknown[]) ↔ grid-core 의 `onSelectionChange?: (rows: TData[]) => void` (제네릭) — type-safety 손실.
- 보고서 §1.4: grid-core 가 이미 `@tomis/grid-core` peerDep 으로 tw-framework-front 에 연결 — re-export 가능.
- 보고서 §5.2: 동일 prop 명이 패키지에 따라 contravariance 호환 + non-호환 두 그룹 — 사용자 cast 비용.
- 보고서 §7.3: §1.4 와 동일 — 해결책 단일.

### 대안 (반드시 2개 이상)

1. **tw-framework-front 의 자체 type 유지 + grid-core 의 type 으로 cast**: status quo + 명시 cast.
   - **각하 이유**: cast 비용 영구 보존. drift 위험 누적.
2. **grid-core 의 type 을 tw-framework-front 와 동일 (unknown[]) 으로 약화**: 양쪽 align.
   - **각하 이유**: 모든 grid-core 사용자가 type-safety 손실 — POL/SHARED-QUALITY §1 type 강화 의도 반대.

### Trade-off

| Pro | Con |
|-----|-----|
| type-safety 회복 — `TData` 제네릭 사용 | tw-framework-front 페이지의 `(rows: unknown[]) => ...` 콜백 시그니처 변경 필요 (제네릭 추론 또는 명시) |
| ~30 LOC 절감 + drift 차단 | grid-core 의 type 변경 시 tw-framework-front 동시 영향 — single source of truth 의 양면 |
| ADR-016 (onRowClick 시그니처 통일) 의 자연 연속 | 페이지 측 type narrowing 변경 발생 가능 — 별 grep 으로 영향 측정 필요 |

### 영향 분석

- **영향 패키지**: tw-framework-front (변경), grid-core (변경 없음).
- **예상 공수**: 2h (보고서 §12 #8).
- **위험**: low (보고서 §12 #8).
- **semver 영향**: **none (앱 내부)** — tw-framework-front 는 publish 아님.
- **breaking change 여부**: no (앱 내부). 단, 페이지 측 type 시그니처 변경 가능 — TypeScript 컴파일 에러로 검출.

### 실행 조건 (실행 전 충족 필요)

- ADR-016 (onRowClick 시그니처 통일) 과 정렬 — grid-core 의 `BaseGridProps.onRowClick` (1개) vs `GridProps.onRowClick` (2개) 시그니처 통일 선행 권장.
- 페이지 측 onSelectionChange/onRowClick 사용처 grep — `(rows: unknown[]) => ...` 호출자 인벤토리.

### 결과 (실행 후 검증 항목)

- [x] tw-framework-front `types/tomis/grid.ts` 가 `export type { ... } from '@tomis/grid-core'` 1줄 re-export.
- [x] tw-framework-front `pnpm build` 통과 (TypeScript 0 errors — pre-existing `PayReal01EditModal.tsx` syntax error 제외, ADR-008 관련 0 errors).
- [ ] 페이지 측 onSelectionChange 콜백이 제네릭 TData 추론 (수동 검증 1+ 페이지).
- [x] grid-pro-header `legacy/GroupedHeaderGrid.tsx:33-42` 의 inline alias 제거 (ADR-009 와 정렬).

### 구현 노트 (2026-05-17 Wave 3)

- `GridPaginationOptions`, `GridRowSelectionOptions<TData>`, `BaseGridProps`, `GridState` 4 타입 `@tomis/grid-core` re-export 로 교체 완료.
- 로컬 잔존: `CellRendererProps`, `CellRenderer`, `EditType`, `EditableColumnMeta`, `RowChangeStatus`, `TrackedRow`, `ColumnGroup`, `TreeGridProps` — grid-core 에 동등 타입 없거나 앱 전용 shape.
- `GridRowSelectionOptions<TData>` 제네릭 파라미터로 인해 `ColumnPinGrid.tsx` 의 `rowSelection?: GridRowSelectionOptions` → `GridRowSelectionOptions<TData>` 업데이트 포함.
- `@tomis/grid-core` 가 이미 tw-framework-front peerDep 에 포함되어 별도 dep 추가 불필요.

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-009: grid-core ↔ grid-features layering 정리 (역의존 제거)

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 2 사용자 승인 — 옵션 A: grid-features 3 export → grid-core/internal 이동)
**상태**: accepted (Wave 2 — 옵션 A)
**연관 Goal/Module**: grid-core, grid-features
**연관 finding**: refactor-analysis-2026-05-17.md §4.1 (P1)
**연관 policy/constraint**: POL-COMPAT §2 (peerDeps), POL-DOC-LIC §3 (라이선스 경계)

### 결정

grid-core 가 grid-features 에 `dependencies` (workspace:*, hard dep) 로 의존하는 architectural inversion 을 해소한다. **옵션 A 채택**: grid-core 가 grid-features 에서 import 하는 3개 export (`useColumnDrag`, `DropIndicator`, `SortClearButton`) 를 `grid-core/internal/` 로 이동하여 grid-features 의존성 자체 제거. grid-features 는 본 3 export 의 public alias 유지 (deprecation marker 추가 가능).

### 사유

- 보고서 §4.1: `packages/grid-core/package.json` — `"dependencies": { "@tomis/grid-features": "workspace:*" }` (peerDep 아닌 hard dep).
- 보고서 §4.1: `Grid.tsx:39` — grid-core 가 grid-features 의 3개 export 일반 import.
- 보고서 §4.1: architectural inversion — features 가 core 위 layer 이어야 자연스러운데 core 가 features 를 끌어옴. semver 측면에서 grid-core ≥ grid-features 가 동일 step lock.
- 보고서 §4.1 옵션 A 권고: "3개 export 가 사실상 core 의 일부".

### 대안 (반드시 2개 이상)

1. **옵션 B: 3 export 의 사용을 Grid.tsx 외부 prop 으로 opt-in (composition pattern)**: 보고서 §4.1 옵션 B.
   - **각하 이유**: 사용자가 직접 wiring — boilerplate 증가. ADR-002 의 zero-config 지향과 반대.
2. **옵션 C: 그대로 두되 peerDep 으로 전환**: 보고서 §4.1 옵션 C.
   - **각하 이유**: peerDep 이어도 workspace lock 은 변하지 않음. architectural inversion 해소 0. 사용자 자유도 ↓ 유지.
3. **status quo (hard dep 유지)**: 마이그레이션 비용 0.
   - **각하 이유**: 보고서 §4.1 의 architectural debt 영구 보존.

### Trade-off

| Pro | Con |
|-----|-----|
| grid-core 자립성 ↑ — features 의존 0 | 3 export 가 grid-features → grid-core 로 이동 — grid-features bundle 사이즈 ↓ (보고서 §4.1 인용) |
| semver lock 해소 — grid-features 만 따로 업데이트 가능 | grid-features 의 deprecation 후 public 사용자 영향 — ADR-013 (dead API 정리) 와 정렬 필요 |
| ADR-MOD-GRID-00-004 의 peerDep 정책 명료화 | 코드 이동 6h — 의존성 grep + 단위 테스트 |

### 영향 분석

- **영향 패키지**: grid-core (3 export 추가), grid-features (3 export 제거 또는 alias 유지).
- **예상 공수**: 6h (보고서 §12 #9).
- **위험**: medium (보고서 §12 #9).
- **semver 영향**: **grid-features minor** — 3 export 가 deprecation alias 되거나 제거. grid-core 도 minor (새 export 추가). POL-COMPAT §3.1 — 새 export 추가는 minor, 제거는 major. 본 ADR 권고: 1 minor 동안 deprecation alias 유지 후 다음 major 에서 제거.
- **breaking change 여부**: no (deprecation alias 단계 거치면). 즉시 제거 시 yes.

### 실행 조건 (실행 전 충족 필요)

- ADR-007 (storage adapter 추출) 과 정렬 — grid-core/internal/ 폴더 확장.
- 3 export (`useColumnDrag`, `DropIndicator`, `SortClearButton`) 의 외부 (tw-framework-front) 사용처 grep.
- ADR-010 (SortBadge 중복 제거) 과 결과 정렬 — grid-features SortBadge 가 본 ADR 후 public 사용자 0건 확정 시 정리.

### 결과 (실행 후 검증 항목)

- [x] `grid-core/package.json` 의 `"@tomis/grid-features"` dependency 제거.
- [x] `Grid.tsx:39` 의 import 가 internal 경로로 변경.
- [x] grid-features 의 3 export 가 deprecation alias (또는 제거).
- [x] grid-features minor bump + CHANGELOG.
- [ ] grid-features bundle size 측정 — 감소 확인. (후속 Wave 에서 `pnpm size` 실측)

### Implementation Note — 2026-05-17

옵션 A 적용 완료. 이동 + alias 보존.

**이동된 파일 (grid-features → grid-core/internal)**:

| 원위치 | 신위치 |
|--------|--------|
| `grid-features/src/column-drag/useColumnDrag.ts` | `grid-core/src/internal/column-drag/useColumnDrag.ts` |
| `grid-features/src/column-drag/useColumnOrderPersist.ts` | `grid-core/src/internal/column-drag/useColumnOrderPersist.ts` |
| `grid-features/src/column-drag/DropIndicator.tsx` | `grid-core/src/internal/column-drag/DropIndicator.tsx` |
| `grid-features/src/column-drag/types.ts` (전체 3 type) | `grid-core/src/internal/column-drag/types.ts` |
| `grid-features/src/multi-sort/SortClearButton.tsx` | `grid-core/src/internal/multi-sort/SortClearButton.tsx` |
| `grid-features/src/multi-sort/types.ts` (SortClearButtonProps 만 추출) | `grid-core/src/internal/multi-sort/types.ts` |

**확정 사항**:

- `useColumnDrag` 는 `useColumnOrderPersist` 의 유일한 internal consumer. 옵션 A 의 정합을 위해 동반 이동. 이 함수는 ADR 원문의 "3 export" 에 명시되지는 않았으나 — grid-core/useColumnDrag 가 grid-features/useColumnOrderPersist 를 import 하면 *동일한 inversion 패턴이 재발생* 하므로 이동 필수. 결과: 4 runtime export + 5 type export 가 grid-core 로 이동.
- `multi-sort/types.ts` 는 `SortClearButtonProps` 만 추출. `SortBadgeProps`, `UseMultiSortOptions`, `UseMultiSortResult` 는 grid-features 에 그대로 (backing export 인 `SortBadge`, `useMultiSort` 도 grid-features 에 그대로 — ADR-009 의 이동 범위 아님; ADR-010 의 Wave 3 영역).
- grid-features 의 alias 패턴 (advisor 권고 §2):
  - 각 alias 파일은 `export { X } from '@tomis/grid-core';`
  - `grid-features/package.json` 에 `"@tomis/grid-core": "workspace:*"` 추가 (의존성 방향 정상화).
  - public 노출 위치는 `grid-core/src/index.ts` (internal/ 디렉토리 명명은 organizational convention 이며 alias 가 통과해야 하므로 grid-core 가 public export 의무).
- ADR-010 (SortBadge) 정합: 미진행 (Wave 3 영역). ADR-009 의 결과로 unblocked.

**검증 결과**:

- `pnpm --filter @tomis/grid-core typecheck` — PASS (0 errors)
- `pnpm --filter @tomis/grid-features typecheck` — PASS (0 errors)
- `pnpm -r typecheck` — 14 packages PASS
- `pnpm -r --filter './packages/**' build` — 14 packages PASS (`apps/docs` 의 docusaurus customCss 사전 결함은 unrelated)
- `Grep "@tomis/grid-features" packages/grid-core/src/` — 0 actual imports (JSDoc only)
- `grid-core/dist/index.mjs` line 1751 — 4 exports 공개 확인
- `grid-core/dist/index.mjs` line 1-5 — `@tomis/grid-features` import 0건 확정

**산출물**:

- `.changeset/adr-009-layering.md` (grid-core: minor, grid-features: minor)
- `packages/grid-core/CHANGELOG.md` (Unreleased 항목)
- `packages/grid-features/CHANGELOG.md` (Unreleased 항목)
- 결과 보고서: `.claude/tw-grid/findings/wave2-adr-009-result.md`

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-010: `SortBadge` 중복 제거 (grid-core/internal 단일화)

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 3 사용자 일괄 승인 — ADR-009 옵션 A 완료 후 선행 의존성 해소)
**상태**: accepted (Wave 3 — grid-core/internal/SortBadge 단일 source)
**연관 Goal/Module**: grid-core (internal/SortBadge), grid-features (multi-sort/SortBadge)
**연관 finding**: refactor-analysis-2026-05-17.md §1.3 (P1)
**연관 policy/constraint**: POL-MIG-STAGE (public API 슬림화)

### 결정

`grid-core/src/internal/SortBadge.tsx` 와 `grid-features/src/multi-sort/SortBadge.tsx` 의 ~95% 동일 구현을 단일화. **권고 1 채택 (보고서 §1.3 제안 1)**: grid-core 의 internal/SortBadge.tsx 삭제, `Grid.tsx` 가 grid-features 의 SortBadge 사용 (이미 ADR-009 의 옵션 A 와 정렬). 단, ADR-009 가 옵션 A 로 grid-features → grid-core 이동을 선택했다면 **권고 1의 반대 — grid-core/internal 에 통합** 으로 변경.

**최종 결정 (ADR-009 와 정렬 후)**: ADR-009 옵션 A 에서 grid-features 의 3 export 가 grid-core/internal 로 이동하므로, SortBadge 도 동일 패턴 — `grid-core/internal/SortBadge.tsx` 가 single source, grid-features 의 multi-sort/SortBadge.tsx 는 deprecation alias 또는 제거. 20 LOC 절감.

### 사유

- 보고서 §1.3: ~95% 동일 구현. Rationale 주석 인용 (`grid-core/src/internal/SortBadge.tsx:6-8`): "grid-core → grid-features 의존성 추가 없이 badge 기능을 제공하기 위해 동일 구현을 내부 복사본으로 유지".
- 보고서 §1.3: 그러나 `Grid.tsx:39` 가 이미 grid-features 의 다른 export 를 import — 명분 깨짐.
- 보고서 §1.3: grid-features 의 public SortBadge 외부 consumer 0 (production), stories 만.
- 보고서 §1.3 예상 절감: 20 LOC.

### 대안 (반드시 2개 이상)

1. **grid-features 의 public SortBadge 제거 + Grid.tsx 만 내부 사용 유지**: 보고서 §1.3 제안 2.
   - **각하 이유**: stories 가 깨짐 (`grid-features/stories/Features.stories.tsx:27,65-87` 등). 단, stories 도 정리 가능 — 별 ADR.
2. **현 미러 유지 (status quo)**: D6 미러 패턴 존중.
   - **각하 이유**: 보고서 §1.3 의 "명분 깨짐" — D6 의 전제 (grid-core 가 grid-features 의존 없음) 가 이미 무너짐. 미러 의미 없음.
3. **grid-features 의 SortBadge 만 유지 + grid-core 의 internal/SortBadge 제거 (ADR-009 옵션 A 와 반대 방향)**: layering 자연스러움.
   - **각하 이유**: ADR-009 (옵션 A: features → core 이동) 와 정면 충돌. ADR-009 가 채택되면 본 옵션 부적합.

### Trade-off

| Pro | Con |
|-----|-----|
| 20 LOC 절감 + 단일 구현 | ADR-009 의 옵션 선택에 dependency — 본 ADR 만 단독 결정 불가 |
| stories 도 동일 경로 사용 (또는 정리) | grid-features 의 deprecation alias 단계 (semver minor) 필요 |
| public API 슬림화 (POL-MIG-STAGE) | 사용처 0 (production) 이나 stories 영향 — 정리 부담 |

### 영향 분석

- **영향 패키지**: grid-core (internal/SortBadge 삭제 또는 유지), grid-features (multi-sort/SortBadge 삭제 또는 alias).
- **예상 공수**: 1h (보고서 §12 #10).
- **위험**: low (보고서 §12 #10).
- **semver 영향**: **none** (보고서 §12 #10 명시) — public 사용자 0 (production). stories 만 영향.
- **breaking change 여부**: no (production 사용자 0).

### 실행 조건 (실행 전 충족 필요)

- **ADR-009 의 옵션 채택 결정 선행** — A (features → core) 또는 B/C (status quo).
- grid-features SortBadge stories 정리 정책 (story 유지 시 import 경로 변경).

### 결과 (실행 후 검증 항목)

- [x] ADR-009 정렬 후 SortBadge 단일 구현 (grid-core/internal/SortBadge.tsx canonical).
- [x] grep `SortBadge` packages/ — 1 source (grid-core/internal/SortBadge.tsx) + alias (grid-features/multi-sort/SortBadge.tsx) + stories.
- [ ] grid-features bundle size 영향 측정 (ADR-011 실행 후 — 미완료).

### Implementation Note (ADR-010 완료 — 2026-05-17)

**실행 결과**: grid-core/internal/SortBadge.tsx 를 single source 로 채택.

**API 통합 결정**: 원 grid-core 버전(`{ sortIndex: number }`)과 grid-features 버전(`SortBadgeProps` with optional `className`)의 실제 API 차이 발견 (~95% 동일 주석의 5% 부분). grid-core 버전을 superset 으로 업그레이드 (optional `className` prop 추가). Grid.tsx 의 `<SortBadge sortIndex={sortIndex} />` 호출은 prop 이 optional 이므로 무변경.

**SortBadgeProps 이동**: `grid-features/multi-sort/types.ts` → `grid-core/internal/multi-sort/types.ts` (ADR-009 의 `SortClearButtonProps` 이동 패턴 동일 적용).

**파일 배치**: `internal/SortBadge.tsx` (flat) 유지 — ADR-009 의 `internal/multi-sort/` nesting 과 미일치 (cosmetic deviation). 이동 비용 대비 이익 없어 현 위치 유지.

**검증**:
- `pnpm -r typecheck` → 14 packages PASS (0 errors)
- `pnpm -r --filter './packages/**' build` → 14 packages PASS
- `grep "export function SortBadge" packages/` → 1 hit (grid-core/internal/SortBadge.tsx)
- `grep "export" packages/grid-features/src/multi-sort/SortBadge.tsx` → alias re-export 만
- 결과 보고서: `.claude/tw-grid/findings/wave3-adr-010-result.md`

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-011: `.size-limit.json` ignore 정책 통일

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 1 사용자 승인)
**상태**: accepted
**연관 Goal/Module**: 모노레포 루트 `.size-limit.json`
**연관 finding**: refactor-analysis-2026-05-17.md §8.1 (P1)
**연관 policy/constraint**: POL-BUNDLE §3.1 (size-limit 통과 확인), ADR-MOD-GRID-00-007 (size-limit 도구 + 한도)

### 결정

`.size-limit.json` 의 13 패키지 entry 에서 `ignore` 배열을 다음 baseline 으로 통일한다:
- **공통 peer (모든 패키지)**: `react`, `react-dom`, `@tanstack/react-table`
- **conditional peer**: `@tanstack/react-virtual` (grid-core, grid meta 만 사용), `date-fns` + `date-fns/locale` + `react-datepicker` (grid-features 만 사용), `xlsx` + `jspdf` + `jspdf-autotable` (grid-export, grid meta optional)
- **cross-package workspace dep**: 해당 패키지가 의존하는 `@tomis/grid-*` 모두 (예: grid-pro-tracking 은 `@tomis/grid-core` ignore)

### 사유

- 보고서 §8.1: 현재 `grid-features` 만 7개 ignore, `grid-pro-tracking` 만 5개 ignore, 나머지 9개 패키지는 ignore 0건.
- 보고서 §8.1: 9개 패키지의 size-limit 측정은 peer 가 bundle 에 합산된 값 — 의미 있는 측정 X.
- 보고서 §8.1: 예시 — `grid-pro-range` limit 20 KB 가 만족돼도 실제 패키지 코드는 더 클 가능성 (react-table dependency 가 측정에 포함).
- POL-BUNDLE §3.1 "size-limit 통과 확인" 의무 — 측정 정확성 보장이 의무 충족 전제.

### 대안 (반드시 2개 이상)

1. **각 패키지 자유 ignore (status quo)**: 마이그레이션 비용 0.
   - **각하 이유**: 측정 신뢰성 영구 손실. POL-BUNDLE §3.1 의무 불충족.
2. **모든 패키지 ignore 0 (peer 포함 측정)**: 측정 일관성.
   - **각하 이유**: react/react-dom (각 ~140KB) 가 13 패키지 측정에 모두 포함 — 한도 30KB 등이 무의미.
3. **자동화 도구로 package.json peerDeps 에서 .size-limit.json 의 ignore 자동 생성**: 가장 robust.
   - **각하 이유**: 추가 도구 도입 부담. ADR 신설 의무 (C-9). 본 ADR 의 manual baseline 으로 충분 (재발 시 도구화 검토).

### Trade-off

| Pro | Con |
|-----|-----|
| 13 패키지 측정 일관성 — POL-BUNDLE §3.1 정책 의도 실현 | 13 entry 모두 ignore 명시 — `.size-limit.json` 길이 증가 |
| ADR-005 (grid-export 통합) 등에서 정확 측정 가능 | peer 매트릭스 (ADR-MOD-GRID-00-008) 변경 시 13 entry 동시 업데이트 부담 |
| CI 정확도 ↑ — PR 차단 정책 신뢰성 회복 | 새 peer 추가 시 13 entry 누락 위험 (drift) |

### 영향 분석

- **영향 패키지**: 모노레포 루트 `.size-limit.json`.
- **예상 공수**: 1h (보고서 §12 #11).
- **위험**: low (보고서 §12 #11).
- **semver 영향**: **none** (CI 정확도) — 패키지 export 변경 0.
- **breaking change 여부**: no.

### 실행 조건 (실행 전 충족 필요)

- ADR-MOD-GRID-00-008 peer 매트릭스 최신 상태 확인.
- 13 패키지 각 package.json 의 peerDeps grep 으로 ignore baseline 자동 도출 (수동 또는 1회 스크립트).

### 결과 (실행 후 검증 항목)

- [ ] `.size-limit.json` 13 entry 모두 통일된 ignore 패턴 적용.
- [ ] `pnpm size` 재측정 — 각 패키지 한도 통과 확인 (한도 조정 필요 시 ADR-MOD-GRID-00-007 업데이트).
- [ ] CI 통과 검증.

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-012: `DataTable/` 폴더 마이그레이션 계획 ADR

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 5 — ADR-004와 1 wave 묶음, 부록 C #6 옵션 A)
**완료일**: 2026-05-17 (P-1 implementer cycle — 재작성 + 삭제 완료)
**Wave 그룹**: ADR-004와 묶음 (계획 ADR — 시각 검증 불필요)
**상태**: completed (Wave 5 — P-1 실행 완료 2026-05-17, 시각 검증은 사용자 의무)
**연관 Goal/Module**: tw-framework-front (`src/components/DataTable/`)
**연관 finding**: refactor-analysis-2026-05-17.md §7.2 (P0), §1.5
**연관 policy/constraint**: POL-MIG-STAGE (사용처 마이그레이션), C-31 (cross-package wiring)

### 결정

tw-framework-front `src/components/DataTable/` (7 파일, 자체 ColumnInfo 정의, 자체 `useReactTable` 호출) 의 마이그레이션 정책을 본 ADR 로 확정한다. **본 ADR 은 "계획 ADR"** — 실 마이그레이션은 후속 ADR (예: ADR-MOD-GRID-REFACTOR-NN-NNN-datatable-execute) 에서 실행. 계획 단계:
1. **Phase 1 (인벤토리)**: tw-framework-front `src/pages/*` 에서 `DataTable` import 사용처 grep.
2. **Phase 2 (alias 추가)**: DataTable export 에 `console.warn` deprecation marker + `apps/docs/docs/migration/dataTable-migration.md` 가이드.
3. **Phase 3 (점진 교체)**: 페이지마다 `DataTable` → `<Grid>` 또는 monorepo `BaseGrid` alias 로 교체.
4. **Phase 4 (제거)**: 사용처 0 확인 후 `src/components/DataTable/` 폴더 제거.

### 사유

- 보고서 §7.2: `DataTable/` 가 정리되지 않은 채 신규 `<Grid>` 와 병존 — tw-framework-front 페이지가 `DataTable` 과 `<Grid>` 를 혼용할 위험.
- 보고서 §7.2: `apps/docs/docs/migration/dataTable-migration.md` 가이드 존재 (마이그레이션 계획은 문서에 명시) — 그러나 실 코드 미진행.
- 보고서 §1.5: `grid-core/legacy/ColumnInfo.ts` 가 동일 shape 보유 (alias 의도) 그러나 DataTable 측에서 import 0건.
- POL-MIG-STAGE 의 점진 마이그레이션 의도 — 본 ADR 이 그 절차 명문화.

### 대안 (반드시 2개 이상)

1. **DataTable 즉시 제거 + 모든 페이지 일괄 교체**: 가장 빠름.
   - **각하 이유**: 시각 회귀 검증 부담 ↑↑. 페이지 N개 일괄 변경 시 PR 거대화. POL-MIG-STAGE "점진" 의도와 반대.
2. **DataTable 영구 유지 + `<Grid>` 와 평행 운영**: status quo.
   - **각하 이유**: 분기 진화 위험 영구 보존. POL-MIG-STAGE 미달성.
3. **DataTable 을 `<Grid>` 의 thin wrapper 로 재구현**: API 유지 + 내부 통합.
   - **각하 이유**: DataTable API 가 ColumnInfo 등 자체 모델 — `<Grid>` 의 ColumnDef 와 mismatch. wrapper 자체가 복잡 — Phase 3 의 일부 페이지에 적용 가능하나 전체 정책 아님.

### Trade-off

| Pro | Con |
|-----|-----|
| 점진 마이그레이션 — Phase 별 시각 회귀 검증 가능 | Phase 1 인벤토리 작업 비용 (수 페이지 grep) |
| dataTable-migration.md 가이드 실 실행 — 문서 ↔ 코드 align | 4 Phase 분리 — 전체 완료까지 시간 누적 (수 PR) |
| 사용자 (페이지) 측 변경 분산 — PR 작아짐 | deprecation warning console 로그 — UX 소폭 영향 (dev 환경만) |

### 영향 분석

- **영향 패키지**: tw-framework-front (변경), grid-core/legacy (사용 시작).
- **예상 공수**: 4h (계획만 — 보고서 §12 #12). 실 마이그레이션 별도.
- **위험**: medium (보고서 §12 #12 — 시각 회귀).
- **semver 영향**: **none (앱 내부)** — tw-framework-front publish 아님.
- **breaking change 여부**: no (점진).

### 실행 조건 (실행 전 충족 필요)

- ADR-004 (5 variant 교체) 와 정렬 — DataTable 이 BaseGrid/ColumnPinGrid 와 다른 모델인지 확인.
- `apps/docs/docs/migration/dataTable-migration.md` 가이드 최신화 검토.

### 결과 (실행 후 검증 항목)

- [x] **Phase 1 인벤토리 완료** — DataTable 사용 페이지 **N=1** (`pages/MyNotification/MyNotificationPage.tsx`). 본 spec `findings/wave5-adr-012-spec.md` 로 수행 (보고서 §13 #1 이행).
- [x] Phase 2 deprecation marker — **D-1a 결정: 생략** (N=1, marker overhead 0). MyNotificationPage 재작성으로 Phase 2+3 일괄 완료.
- [x] Phase 3 완료 (2026-05-17) — `MyNotificationPage.tsx` `<Grid>` 재작성 + typecheck PASS.
- [x] Phase 4 완료 (2026-05-17) — `src/components/DataTable/` 폴더 삭제 (8파일), grep 0 hits 확인.

### Implementation Plan — 2026-05-17 (계획 ADR 작성 완료)

> **spec 보고서**: `.claude/tw-grid/findings/wave5-adr-012-spec.md` (~290 lines).
> **본 ADR 은 계획 ADR — 구현 단계 없음**. 사용자 D-1 결정 후 별도 cycle 에서 implementer 위임.

**핵심 finding (본 ADR 본문 §결정 의 4-Phase 가정 재검토 필요)**:

보고서 §13 #1 의 "DataTable 페이지 import 인벤토리" 를 수행한 결과 **N=1 페이지** (`tw-framework-front/src/pages/MyNotification/MyNotificationPage.tsx`) 만 DataTable 을 import. 본 ADR 본문 §Trade-off "Phase 1 인벤토리 작업 비용 (수 페이지 grep)" 와 "사용자 (페이지) 측 변경 분산 — PR 작아짐" 의 "수 페이지" 가정이 사실과 다름. **N=1 은 P-1 (즉시 deprecate) 의 비용-편익 곡선을 본 ADR 본문보다 우호적으로 만듦** — Alt 1 의 각하 사유 ("PR 거대화") 가 약화됨.

**API gap 의 실제** (단순 import 교체 불가):

| DataTable export | monorepo 대응 |
|------------------|--------------|
| `ColumnInfo` | ✅ `grid-core/legacy/ColumnInfo.ts` 동일 shape |
| `DataTablePagination` (paging+listAction) | ❌ signature mismatch (`grid-core/legacy/DataTablePagination` 은 `{table, totalCount}`) |
| `ButtonInfo` / `RowActionInfo` / `AdditionalRowActionInfo` | ❌ alias 부재 — DataTable 만의 도메인 패턴 |
| `<DataTable>` 9 props (data + 8 컨트롤) | ❌ `<Grid>` 와 추상화 수준 다름 — high-level CRUD wrapper vs low-level abstraction |

→ MyNotificationPage 마이그레이션 시 `<Grid>` + 별도 toolbar JSX + row-action menu 분리 + permissions conditional JSX 풀기 등 ~50-100 LOC 신규 작성 필요. 단순 import 교체 ≠ 마이그레이션.

**채택 옵션 (사용자 D-1 후 갱신)**: 본 spec 권고 = **P-1** (즉시 deprecate + 1 페이지 재작성). 단 marker phase 의 sub-decision (D-1a) 별도.

**Phase 계획 (P-1 채택 시)**:

| Phase | 작업 | 공수 | dependency | 위험 |
|-------|------|------|-----------|------|
| Phase 1 | **본 spec 으로 완료** — 사용처 인벤토리 (N=1), API gap, 옵션 평가 | 4h (수행됨) | none | none |
| Phase 2 | MyNotificationPage 재작성 — `<Grid>` + toolbar JSX + row-action menu 분리 | 6h | Phase 1 + 사용자 D-1 = P-1 | medium (시각 회귀, 1 페이지 screenshot baseline) |
| Phase 3 | `apps/docs/docs/migration/dataTable-migration.md` 가이드 archive + DataTable/ 폴더 제거 | 1h | Phase 2 PR merge | low |
| Phase 4 | `grid-core/legacy/ColumnInfo.ts` 의 deprecation 검토 (사용처 0 이면 `@deprecated` 강화) | 0.5h | Phase 3 | low |

**P-1 합산**: 7.5h (Phase 1 완료 후 6+1+0.5).
**P-2 (본 ADR 본문 점진안) 채택 시**: 15h (marker + 점진 + 제거).
**P-4 (신 wrapper 신설) 채택 시**: 20h + 별도 ADR.

**사용자 결정 지점** (spec §6 상세):

- **D-1** (필수): 마이그레이션 path — (a) P-1 *권고* / (b) P-2 본문안 / (c) P-4 신 wrapper / (d) 보류.
- **D-1a** (D-1=P-1 시): deprecation marker phase 생략 *권고* vs 1 minor 유지.
- **D-2** (P-1/P-2/P-4 공통): 시각 회귀 baseline 방식 — manual screenshot / Playwright 자동화 / skip.
- **D-3** (P-1/P-4 시): `RowActionInfo` / `ButtonInfo` / `AdditionalRowActionInfo` 패턴의 처리 — page inline JSX *권고* / 신 컴포넌트 분리 / grid-features 추가.

**다음 cycle implementer 위임 기준**:

1. 사용자 D-1 결정 완료 (본 ADR Implementation Plan 의 "채택 옵션" 갱신).
2. P-1 시: D-1a + D-2 + D-3 sub 결정 완료.
3. P-4 시: 신 wrapper owning package 결정 (별도 ADR).
4. implementer 시점에 사용처 재grep 의무 (N=1 영속성 확인).
5. screenshot baseline (D-2 = a/b 시) 캡처 완료.
6. 별도 ADR ID 부여: `MOD-GRID-REFACTOR-NN-datatable-execute` (NN = 채택 옵션 결정 이후 numbering).

**P-3 (영구 평행) 배제 사유**: 본 ADR 본문 §대안 2 의 각하 + 본 spec advisor 권고 일치 — 분기 진화 위험 영구 보존, POL-MIG-STAGE 미달성.

**검증 의무 (implementer cycle)**:
- typecheck PASS, build PASS.
- screenshot diff 검토 (D-2 결정 시).
- grep 후 DataTable export 사용처 0 확인 (P-1/P-4 폴더 제거 시).

**알려진 한계** (spec §7 상세):
- 본 grep 은 10 식별자 검색 — 동적 import 미검출 (확인 미수행, ~1h 추가 조사 권고).
- `tomis/Grid/` 8 variant 중 ChangeTrackingGrid / EditableGrid 등 DataTable 과 일부 유사 패턴 비교 미수행 (P-4 의 wrapper 통합 가능성 시 별도 분석).
- `apps/docs/docs/migration/dataTable-migration.md` 실 내용 미검토 (가이드 정렬 implementer 의무).

### Implementation Note — 2026-05-17 (P-1 실행 완료)

**실행일**: 2026-05-17  
**실행자**: claude-sonnet-4-6 (ADR-012 P-1 implementer cycle)  
**채택 옵션**: D-1 = P-1 (즉시 deprecate + 1 페이지 재작성), D-1a = marker 생략 (N=1 overhead 0), D-2 = 사용자 manual screenshot, D-3 = page inline JSX

**결과**:
- [x] Phase 2 완료 — `MyNotificationPage.tsx` 재작성 (`<DataTable>` → `<Grid>`)
- [x] Phase 3 완료 — `src/components/DataTable/` 폴더 삭제 (8파일)
- [x] typecheck (재작성 후): baseline 7건 유지 — 신규 0건
- [x] typecheck (삭제 후): 동일
- [x] grep `from .*DataTable`: 0 hits (src/ 전체)

**계약 변경 핵심**:
1. `ColumnInfo[]` → `ColumnDef<NotificationData>[]` (TanStack v8 표준)
2. Row selection: comma-joined index strings → `notificationId` 기반 (`onSelectionChange: rows => setSelectedListItemKeys(rows.map(r => r.notificationId).join(','))`)
3. Server pagination: `pageingInfo + listAction('changePageNo/Size', ...)` → `pagination={{ manual: true, totalCount, pageCount, pageIndex: pageNo-1, onPaginationChange }}`
4. Row actions: DropdownMenu (DataTable 내장) → trailing 컬럼 inline JSX (D-3)
5. Toolbar: `ButtonInfo` prop → permissions-gated inline JSX

**Known regression (플래그)**:
- 컬럼 헤더 정렬 UI 제거 (`enableSort={false}`) — `<Grid>` v1에 서버사이드 `onSortingChange` 콜백 없음. 초기 로드/검색 기본 정렬(`send_datetime desc`) 유지.
- Grid v2에서 `onSortingChange` 서버콜백 추가 시 복원 가능.

**상세 보고서**: `.claude/tw-grid/findings/wave-residual-2-adr-012-result.md`

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-013: dead public API 정리 (`createTomisColumnHelper` 등)

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 3 사용자 일괄 승인)
**상태**: accepted (Wave 3 — deprecation alias 패턴 일관 적용)
**연관 Goal/Module**: grid-core
**연관 finding**: refactor-analysis-2026-05-17.md §6.1, §6.2 (P1)
**연관 policy/constraint**: POL-MIG-STAGE (public API 슬림화), C-31 (Functional Wiring Audit)

### 결정

grid-core public API 중 production 사용자 0건이 확인된 4 export 를 정리한다:
- `createTomisColumnHelper` (grid-core/src/index.ts:48) — 사용처 grep monorepo 1건 (자기), tw-framework-front 0건
- `useColumnPersistence` (grid-core/src/index.ts:59-65)
- `ColumnVisibilityMenu` (grid-core/src/index.ts:59-65)
- `createGroupedColumns` + `TomisColumnGroup` (grid-core/src/index.ts:59-65)

**처리 정책**: 다음 minor 에서 `@deprecated` JSDoc 마킹 + console.warn (dev only) + 사용자 0건 재확인 후 다음 major 에서 제거. `createColumns` 등 대체 API 와의 비교를 JSDoc 에 명시.

### 사유

- 보고서 §6.1: `createTomisColumnHelper` — production 사용자 0건. C-31 검출 의도와 일치.
- 보고서 §6.2: 4 export 모두 storybook + test 만 사용. production code 0건.
- 보고서 §6.1 제안: "다음 minor 에서 deprecated 마킹 + 사용자 0건 확인 후 다음 major 에서 제거".
- 보고서 §6.2 명시: "의도된 forward-looking API 인지, dead 인지 ADR 로 명시 필요" — 본 ADR 이 그 명시.

### 대안 (반드시 2개 이상)

1. **즉시 제거 (deprecation 단계 생략)**: 가장 빠름.
   - **각하 이유**: POL-COMPAT §3.1 breaking change 절차 위반. 사용자 0 확인이 모노레포 내부 grep 만 — 외부 npm 사용자 검증 0. deprecation phase 안전.
2. **forward-looking API 로 영구 보존**: status quo.
   - **각하 이유**: forward-looking 의 사용 시나리오가 명시되지 않음. 보고서 §6.2 가 명시 요구. 사용 시점 불명확한 API 는 dead 와 구분 불가.
3. **`createColumns` 와 통합 (역할 명확화) 후 alias 로 유지**: 통합 우선.
   - **각하 이유**: 4 export 각각 다른 역할 — 통합 spec 작성 부담. 본 ADR 범위 초과.

### Trade-off

| Pro | Con |
|-----|-----|
| public API 슬림화 — POL-MIG-STAGE 의도 | 4 export 의 forward-looking 의도가 있었다면 회수 부담 |
| 미래 major 의 cleanup 경로 명확 | deprecation marker phase 1 minor 추가 (시간 소비) |
| 사용자 0건 확인 — 외부 user 발견 시 마이그레이션 path 제공 가능 | ADR-003 (메타 facade) 와 정렬 필요 — meta 가 dead API 재re-export 하지 않도록 |

### 영향 분석

- **영향 패키지**: grid-core.
- **예상 공수**: 2h (보고서 §12 #13).
- **위험**: low (보고서 §12 #13).
- **semver 영향**: **minor (deprecation)** — 다음 major 에서 제거 시 major. POL-COMPAT §3.1 절차.
- **breaking change 여부**: no (deprecation phase). 다음 major 에서 yes (마이그레이션 가이드 의무).

### 실행 조건 (실행 전 충족 필요)

- 외부 (tw-framework-front 외) npm 사용자 확인 — 추가 조사 필요 (보고서 §13).
- ADR-003 의 메타 facade 가 본 4 export 를 re-export 하지 않도록 정렬.

### 결과 (실행 후 검증 항목)

- [x] 5 API (+ `ColumnVisibilityMenuProps`) `@deprecated` JSDoc 정의 파일 + index.ts re-export.
- [x] grid-core 의 CHANGELOG 에 Deprecated 섹션 추가 (6 항목).
- [x] `.changeset/adr-013-dead-api-deprecation.md` minor changeset 생성.
- [ ] console.warn (dev only) — 미적용. task spec JSDoc-only 범위. 다음 minor 에서 추가 예정.

### Implementation Note — 2026-05-17

**실행 결과**: completed.
**결과 보고서**: `findings/wave3-adr-013-result.md`

변경 파일:
- `packages/grid-core/src/column/createTomisColumnHelper.ts` — `@deprecated` JSDoc
- `packages/grid-core/src/column/createGroupedColumns.ts` — `@deprecated` JSDoc (파일 top + `TomisColumnGroup` interface + `createGroupedColumns` function)
- `packages/grid-core/src/column/useColumnPersistence.ts` — `@deprecated` JSDoc
- `packages/grid-core/src/column/ColumnVisibilityMenu.tsx` — `@deprecated` JSDoc (`ColumnVisibilityMenuProps` + `ColumnVisibilityMenu`)
- `packages/grid-core/src/index.ts` — 5 API + `ColumnVisibilityMenuProps` re-export 에 `/** @deprecated */` inline 추가
- `packages/grid-core/CHANGELOG.md` — Deprecated 섹션
- `.changeset/adr-013-dead-api-deprecation.md` — minor changeset

검증: `pnpm -F @tomis/grid-core typecheck` PASS + `pnpm -F @tomis/grid-core build` PASS.
외부 사용자 재확인: 5 API 모두 외부 import 0건 (tw-framework-front + 타 패키지).
`useColumnPersistence` / `ColumnVisibilityMenu` 는 `Grid.tsx` 내부 사용 — `@deprecated` 는 informational (컴파일 영향 없음).

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-014: `as unknown as CellComponent` 14회 정리

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 1 사용자 승인)
**상태**: accepted (D-partial — amendment 2026-05-17)
**연관 Goal/Module**: grid-renderers (`src/rendererRegistry.ts`)
**연관 finding**: refactor-analysis-2026-05-17.md §9.3 (P1)
**연관 policy/constraint**: POL/SHARED-QUALITY §1 (type safety), C-4 (no-any 강제와 정렬)

### 결정

`packages/grid-renderers/src/rendererRegistry.ts:60-73` 의 14 entries 각각 `as unknown as CellComponent` widening cast 를 정리한다. **권고 채택 (보고서 §9.3 제안)**: `CellComponent` 의 prop 타입을 더 permissive 하게 변경 — index signature 추가 (`ComponentType<{ value: unknown } & Record<string, unknown>>`). 14 cast 제거 가능.

### 사유

- 보고서 §9.3: 14회 반복 cast — design smell.
- 보고서 §9.3 justification 주석 인용 (line 50–55): "Each cell's prop type ... is more specific than `CellComponentProps` ... TypeScript's contravariance check requires the `unknown` intermediate cast" — 정당화 명시되어 있으나 cast 14회 반복은 design smell.
- 보고서 §9.3 예상 절감: 14 × `as unknown as CellComponent` = ~14 lines 정리.
- POL/SHARED-QUALITY §1 — cast 회피가 type-safety 의 자연스러운 evolution.

### 대안 (반드시 2개 이상)

1. **현 cast 유지 (status quo)**: 보고서 §9.3 justification 존중.
   - **각하 이유**: 14회 반복 — 새 cell type 추가마다 cast 1회 추가. 영구 boilerplate.
2. **`CellComponent` 를 union type 으로 변경 (각 cell type 명시 union)**: type-narrow 가능.
   - **각하 이유**: 새 cell type 추가마다 union 확장 필요 — registry 의 plug-in 의도 (사용자 정의 cell) 와 반대.
3. **`CellComponent` 의 prop 을 `any` 로 완화**: cast 제거 가능.
   - **각하 이유**: POL/SHARED-QUALITY §1 (C-4 no-any) 위반. 정책 강제.

### Trade-off

| Pro | Con |
|-----|-----|
| 14 cast 제거 — 코드 정리 | `CellComponent` prop type 이 약해짐 — 사용자 정의 cell 의 prop type-check 약화 |
| 새 cell type 추가 시 cast 없이 등록 가능 | index signature 의 `Record<string, unknown>` 가 사용자에게 "어떤 prop 도 가능" 시그널 — JSDoc 으로 보완 필요 |
| design smell 해소 | 단위 테스트 — 새 cell type 의 prop type-error 가 컴파일 단계가 아닌 runtime 으로 이동할 수 있음 |

### 영향 분석

- **영향 패키지**: grid-renderers.
- **예상 공수**: 2h (보고서 §12 #14).
- **위험**: low (보고서 §12 #14).
- **semver 영향**: **none** (보고서 §12 #14 명시) — public API shape 변경 없음 (`CellComponent` 의 prop type 만 약화).
- **breaking change 여부**: no — 단, 사용자가 `CellComponent` 의 narrow prop type 에 의존했다면 영향 (드물).

### 실행 조건 (실행 전 충족 필요)

- `CellComponent` type 의 사용처 grep (사용자 정의 cell 등록자).
- 단위 테스트 baseline — 14 cell 각각.

### 결과 (실행 후 검증 항목)

- [ ] `grid-renderers/src/rendererRegistry.ts` 의 `as unknown as CellComponent` 0건.
- [ ] `pnpm typecheck` 통과.
- [ ] 14 cell 단위 테스트 통과.
- [ ] grep `as unknown as CellComponent` packages/grid-renderers/ → 0.

---

### Amendment — 2026-05-17 (D-partial 채택)

**채택 옵션**: D-partial (LinkCell/ButtonCell 만 rename + additive shim)
**채택 사유**: BLOCKED 보고서의 TS2322 14건 + spec writer 의 옵션 D 권고 + 사용자 의미 명료성 우려 (Check/Icon/Avatar 원 prop 유지).

**원본 ADR 처방 변경**:
- 원본: `CellComponent = ComponentType<{ value: unknown } & Record<string, unknown>>` → BLOCKED (contravariance)
- 신: `asCell<P>(c: ComponentType<P>): CellComponent` helper. registry 14 cast → 1 cast 격리.

**rename 범위**:
- LinkCell/ButtonCell: `label` → `value` (additive shim, deprecated alias 1 cycle)
- 9 cell: 변경 없음 (TextCell/NumberCell/DateCell/StatusBadgeCell/TagCell/ProgressCell/CheckCell/IconCell/AvatarCell)

**Semver 정정**: 원본 ADR-014 의 "none" → **minor** (additive prop + deprecation alias)

**실행 결과 (2026-05-17)**:
- `pnpm -r typecheck` → PASS (14 packages, 0 errors)
- `pnpm -F @tomis/grid-renderers build` → PASS (dist 갱신)
- grep `as unknown as CellComponent` src/ → 1 hit (asCell 내부, 의도)
- grep `asCell(` rendererRegistry.ts → 14 hits (의도)
- tw-framework-front `<LinkCell label=` / `<ButtonCell label=` 직접 사용 → 0 hits (deprecation surface 0건)

**참조**: spec 보고서 (`wave1-adr-014-redesign-spec.md` §3.2, §5.1), BLOCKED 보고서 (`wave1-adr-014-result.md`), 결과 보고서 (`wave1-adr-014-result-v2.md`).

### Visual Regression Note — 2026-05-17 (MOD-GRID-99-B residual-4)

시각 검증 인프라 마무리 — Wave 1-5 잔존 4 (Storybook + Playwright visual regression).

- ADR-014 amendment v2 (LinkCell/ButtonCell `value?` prop) 의 시각 검증은 ADR-002 의 신규 Grid registry story 가 `link` 슬롯 (LinkCell `value` prop) 사용으로 통합 커버.
- 별도 신규 story 0건 — spec §3.3 분석 결과 LinkCell.stories.tsx + ButtonCell.stories.tsx 의 기존 16 시나리오 (`value` prop 다양 시나리오 + `WithDeprecatedLabel` shim 검증) 가 완전 커버.
- baseline PNG: 별도 baseline-only PR cycle 에서 CI ubuntu 환경 캡처 (D-B + D-D).
- 결과 보고서: `.claude/tw-grid/findings/wave-residual-4-storybook-99b-result.md`

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-015: stale build artifact (`verifyLicense` 등) sweep

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 1 사용자 승인 — dist rebuild + JSDoc sweep 단계만. CI 통합 단계는 Wave 3 에서 ADR-001 정렬 후)
**상태**: accepted (Wave 1+3 통합 완료 — 2026-05-17)
**연관 Goal/Module**: grid-pro-master, grid-pro-range (JSDoc 주석), `.github/workflows/build-verify.yml` (CI 통합)
**연관 finding**: refactor-analysis-2026-05-17.md §2.3 (P2), wave3-adr-015-result.md
**연관 policy/constraint**: POL-DOC-LIC §1 (라이선스 명시), POL-BUNDLE §3 (CI)

### 결정

stale build artifact 와 JSDoc 옛 이름을 정리한다:
- `packages/grid-pro-master/dist/index.mjs:3` — `import { verifyLicense } from '@tomis/grid-license';` (src 에서는 `checkLicense`) → `pnpm -r build` rebuild.
- `packages/grid-pro-range/src/*.ts` 의 JSDoc 주석에서 `verifyGridLicense` (useCellRange.ts:26, useClipboard.ts:24, useKeyboardEdit.ts:28, useKeyboardNav.ts:20) → `checkLicense` 로 sweep.
- CI 에 `pnpm -r build` 후 dist 와 src 일치 검증 단계 추가.

### 사유

- 보고서 §2.3: dist 의 `verifyLicense` 는 옛 이름 — src 변경 후 dist 미 rebuild.
- 보고서 §2.3: `grid-license/src/index.ts:2-4` 의 export 는 `setLicenseKey`, `checkLicense`, `Watermark` — `verifyLicense` export 0건.
- 보고서 §2.3: stale dist 가 npm publish 되면 의존 누수.
- 보고서 §2.3 제안: CI 검증 + JSDoc sweep.

### 대안 (반드시 2개 이상)

1. **`pnpm -r build` 만 실행 + JSDoc 무시**: 가장 빠름.
   - **각하 이유**: JSDoc 옛 이름이 후속 개발자에게 혼선 — 보고서 §2.3 명시.
2. **CI 추가 없이 manual rebuild 의무**: 도구 추가 부담 0.
   - **각하 이유**: 재발 위험. CI 추가 비용 낮음 (1 script 단계).
3. **status quo (stale 유지)**: 마이그레이션 비용 0.
   - **각하 이유**: npm publish 시 import 실패 — 보고서 §2.3 명시.

### Trade-off

| Pro | Con |
|-----|-----|
| 1회 rebuild 로 stale 해소 | CI 단계 추가 — pipeline 시간 소폭 ↑ |
| JSDoc 옛 이름 sweep — 후속 개발자 혼선 차단 | JSDoc 4 파일 manual edit (보고서 §2.3 명시) |
| 재발 차단 (CI) | rebuild artifact 가 dist/ 변경 — git diff 발생 |

### 영향 분석

- **영향 패키지**: grid-pro-master (dist rebuild), grid-pro-range (JSDoc sweep).
- **예상 공수**: 1h (보고서 §12 #15).
- **위험**: low (보고서 §12 #15).
- **semver 영향**: **none** (rebuild) — 동일 src 의 build 산출만 일관화.
- **breaking change 여부**: no.

### 실행 조건 (실행 전 충족 필요)

- `pnpm -r build` 실행 환경 준비 (ADR-MOD-GRID-00-009 deferred AC bulk validation 완료 상태 가정).
- ADR-001 의 license enforcement 와 정렬 — `checkLicense` 가 신 정책 진입점.

### 결과 (실행 후 검증 항목)

- [x] `pnpm -r build` 후 `grid-pro-master/dist/index.mjs` 에 `checkLicense` (verifyLicense 0건) — Wave 1 완료.
- [x] grep `verifyGridLicense` packages/grid-pro-range/ → JSDoc import-snippet 0건 (잔여 `_verifyGridLicenseStub` 함수명 + 역사 주석은 의도적 유지) — Wave 1 완료.
- [x] CI yml 에 `pnpm build` + dist 검증 단계 추가 — `.github/workflows/build-verify.yml` 신규 생성 (Wave 3 완료).

### Implementation Note — Wave 3 (2026-05-17)

CI 통합 완료. `.github/workflows/build-verify.yml` 신규 생성 (visual-regression.yml 과 분리).

- **`pnpm build`** (= `pnpm -r --filter './packages/*' build`): apps/docs Docusaurus pre-existing 오류 우회. root package.json "build" script alias 사용.
- **dist freshness 검증**: `packages/*/dist/index.{mjs,cjs}` 에 `\bverifyLicense\b|\bverifyGridLicense\b` grep. `_verifyGridLicenseStub` 은 `\b` 경계로 매치 안 됨 (의도적 유지 대상).
- **ADR-001 license API export 검증**: `packages/grid-license/dist/index.mjs` 에 `useLicenseStatus`, `useWatermarkEnforcement`, `subscribeLicense` 3종 존재 확인. Wave 2 실행 후 실 검증: 모두 존재 확인됨.
- **알려진 한계**: monorepo 에 `.git` 없음 — CI 실 실행은 git repo 화 후 가능. 본 yml 은 구조 + 패턴 정의 완료 기준.

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-016: `onRowClick` 시그니처 통일

**결정일**: 2026-05-17 (refactor analysis)
**승인일**: 2026-05-17 (Wave 3 사용자 일괄 승인 — ADR-008과 1 PR 묶음)
**상태**: accepted (Wave 3 — ADR-008과 묶음 진행)
**연관 Goal/Module**: grid-core, grid-pro-master, grid-pro-header, tw-framework-front
**연관 finding**: refactor-analysis-2026-05-17.md §5.1 (P1)
**연관 policy/constraint**: POL/SHARED-QUALITY §1 (API 일관성), C-31 (cross-package 시그니처 drift)

### 결정

`onRowClick` 시그니처를 monorepo + tw-framework-front 모든 위치에서 통일한다. **권고 채택 (보고서 §5.1 제안)**: 인자 2개 — `(row: TData, event: MouseEvent<HTMLTableRowElement>) => void` 로 통일. event 는 optional callback 시그니처 → contravariance 호환성 보존. 영향 위치:
- `packages/grid-core/src/types.ts:627` (BaseGridProps) — 1개 → 2개
- `packages/grid-core/src/legacy/ColumnPinGrid.tsx:33` — 1개 → 2개
- `packages/grid-core/src/legacy/TreeGrid.tsx:34` — 1개 → 2개
- `packages/grid-core/src/legacy/GroupedHeaderGrid.tsx:36` — 1개 → 2개
- `packages/grid-pro-header/src/legacy/GroupedHeaderGrid.tsx:59` — 1개 → 2개
- `tw-framework-front/src/types/tomis/grid.ts:21` — 1개 → 2개 (ADR-008 과 정렬 — re-export 로 자동 해소)
- `packages/grid-core/src/types.ts:390` (GridProps) — 이미 2개 (유지)
- `packages/grid-pro-master/src/MasterDetailGrid.tsx:102` — 이미 2개 (alias 유지)

### 사유

- 보고서 §5.1: 같은 prop 명이 패키지에 따라 contravariance 호환 + non-호환 두 그룹.
- 보고서 §5.1 인용 (`packages/grid-core/src/legacy/TreeGrid.tsx:43`): "Grid `onRowClick` 시그니처 contravariance 호환" — TypeScript 의 contravariance 로 인자 1개 callback 을 인자 2개 위치에 전달 가능. 그러나 반대로는 type-error.
- 보고서 §5.1 명시적 design choice 가 통일되지 않음.
- 보고서 §5.1 제안: G-005 D11 alias 들 모두 broader 시그니처로 통일.

### 대안 (반드시 2개 이상)

1. **인자 1개 (`(row: TData) => void`) 로 통일**: 가장 단순.
   - **각하 이유**: 사용자가 event 정보 (예: ctrl/shift 키 상태) 필요한 경우 wiring 불가 — feature 약화.
2. **현 두 시그니처 평행 유지 (status quo)**: 마이그레이션 비용 0.
   - **각하 이유**: 보고서 §5.1 의 contravariance 의존 — 사용자가 인자 2개 콜백 작성 시 1개 prop 으로 type-error 발생. 일관성 손실 영구 보존.
3. **`onRowClick` 자체 deprecation + `onRowSelect` 등 새 prop 도입**: cleanest.
   - **각하 이유**: 모든 페이지 + 패키지 변경 부담 — major bump. 본 ADR 범위 초과.

### Trade-off

| Pro | Con |
|-----|-----|
| 시그니처 통일 — 사용자 cast 비용 0 | 인자 1개 콜백 사용자 → 인자 2개 시그니처로 호환 (contravariance) — 변경 0이나 type-check 시 명시 |
| event 정보 활용 가능 — feature 강화 | 7+ 위치 변경 (대부분 type 만) — drift 감지 필요 |
| ADR-008 (tw-framework-front re-export) 와 자동 정렬 | breaking change 여부 검토 — 사용자가 인자 1개 콜백을 전달했을 때 호환 (TypeScript 변환 성공) |

### 영향 분석

- **영향 패키지**: grid-core, grid-pro-master, grid-pro-header, tw-framework-front.
- **예상 공수**: 3h (보고서 §12 #16).
- **위험**: low (보고서 §12 #16).
- **semver 영향**: **minor** — type 확장 (인자 1개 → 1+ optional event). 사용자 인자 1개 콜백 호환 (contravariance). POL-COMPAT §3.1 — 새 인자 추가 (optional) 는 minor.
- **breaking change 여부**: no — TypeScript contravariance 로 1개 콜백 호환. event 사용 안 한 사용자 변경 0.

### 실행 조건 (실행 전 충족 필요)

- ADR-008 (tw-framework-front re-export) 과 정렬 — re-export 시 자동 통일.
- 7+ 위치 동시 변경 PR — drift 방지.

### 결과 (실행 후 검증 항목)

- [x] 7+ 위치 모두 `(row: TData, event: MouseEvent<HTMLTableRowElement>) => void` 시그니처 (총 9개 파일 변경 완료 — grid-core types.ts:BaseGridProps + legacy 3파일, grid-pro-header legacy GroupedHeaderGrid, tw-front BaseGrid/VirtualGrid/ColumnPinGrid/TreeGrid/ChangeTrackingGrid).
- [x] grep `onRowClick.*=>` packages/ tw-framework-front/ — 2개 인자 시그니처 확인 (typecheck 통과).
- [ ] 단위 테스트 통과 (인자 1개 콜백 호환 검증).

### 구현 노트 (2026-05-17 Wave 3)

- 변경 위치 9개: grid-core types.ts:BaseGridProps + legacy 3파일(ColumnPinGrid, TreeGrid, GroupedHeaderGrid), grid-pro-header legacy GroupedHeaderGrid, tw-front ColumnPinGrid/TreeGrid/ChangeTrackingGrid + BaseGrid/VirtualGrid.
- grid-core 3 legacy 파일 (ColumnPinGrid, TreeGrid, GroupedHeaderGrid) 는 `<Grid>` 에 props spread 위임 — JSX onClick 재wiring 불필요.
- JSX event 전달 필요 위치 4개: grid-pro-header/legacy/GroupedHeaderGrid.tsx:onClick, tw-front/BaseGrid.tsx:onClick, tw-front/VirtualGrid.tsx:onClick, tw-front/ChangeTrackingGrid.tsx:onClick.
- tw-front/TreeGrid.tsx 및 tw-front/ColumnPinGrid.tsx 는 독립 prop interface + JSX wiring 모두 변경.
- grid-core 3 legacy 파일에 `import type { MouseEvent } from 'react'` 추가 (prop interface 에서 타입 참조).
- tw-front/TreeGrid.tsx, tw-front/ChangeTrackingGrid.tsx 에 `import type { MouseEvent } from 'react'` 추가.
- `grid-pro-header` 패키지에 `@tomis/grid-core: workspace:*` dependency 신설 (inline alias 제거 후 타입 소스).
- `pnpm -r typecheck` 전체 14 패키지 통과. tw-front typecheck: ADR-008/016 관련 0 errors (pre-existing PayReal01EditModal.tsx syntax error 무관).
- event: **required** (not optional) — GridProps:390 canonical 시그니처 일치.

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-017: 결번 (sub-spec line 738 retraction)

**상태**: withdrawn (never authored — 신설 검토 후 부재 처리)
**결정일**: 2026-05-17 (Wave 5 spec writer)
**연관 ADR**: ADR-001 (Wave 2 흡수 완료), ADR-MOD-GRID-00-012 (transitional inline stub sunset 별도 ledger), ADR-MOD-GRID-99-B (Storybook 시각 회귀 별도 ledger), ADR-015 (stale artifact sweep 별도 ledger)
**연관 spec**: `wave5-adr-017-spec.md`

### 사유 (한 문장)

`wave2-adr-001-sub-spec.md:738` 의 "ADR-017 신설 검토 — 본 sub-spec 으로 부분 흡수 … **별도 ADR 불필요**" 조건부 retraction 이 사용자 §9.1=B (7/7 강제) + H-D + D-D 채택으로 충족되어 ADR-017 본문 작성 의무 소멸.

### 흡수 영역

ADR-017 원 권고 영역 (`wave2-adr-001-spec.md:566`) = "MultiRowHeader + DataMapCell 의 license enforcement 정책" → ADR-001 본문 의 7/7 강제 + H-D (`<thead>` 내 watermark `<tr>`) + D-D (singleton portal via `useWatermarkEnforcement`) 결정으로 완전 흡수. 잔여 0.

### 잔여 영역 (별도 ADR — ADR-017 영역 아님)

- **inline stub sweep**: ADR-MOD-GRID-00-012 의 Sunset 단계 (`MOD-GRID-99-A/G-002` 출하 → `verifyGridLicense` 실 export → peerDependencies 추가 → inline stub 교체) — ADR-001 의 `useLicenseStatus()` / `useWatermarkEnforcement()` API 와는 다른 별개 트랙. ADR-001 미 충족.
- **시각 회귀 자동화**: `MOD-GRID-99-B/G-002` (Storybook 부트스트랩 + Playwright 시각 baseline) — 별도 ledger.
- **stale build artifact sweep**: ADR-015 Wave 1+3 (CI build-verify.yml + JSDoc sweep) — 완료.

### 본 결정의 효과

- ADR 번호 017 결번 (gap). Index 표 (line 9-27) 의 ADR 목록은 001-016 + 018 — 017 부재.
- 후속 spec writer 가 본 sub-spec line 738 retraction 미숙지로 ADR-017 본문 재시도 시 본 결번 marker 참조 (audit trail 유지).
- ADR 번호 재사용 금지 (memory/feedback-tw-mail-adr-number-collision.md 의 ADR ledger 권고 정합).

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-018: registry slot 정책 — icon + 5 extras + alias (ADR-002 분리)

**작성일**: 2026-05-17 (ADR-002 D-1A/D-2A 분리 결과)
**승인일**: 2026-05-17 (Wave 4 — spec 권고 조합 I-A + X-A1 + X-B + A-A + S-A)
**상태**: implemented (Wave 4 — 2026-05-17)
**연관 ADR**: ADR-002 (cross-package wiring — 6 슬롯 wired), ADR-014 amendment (D-partial — LinkCell/ButtonCell `value?` 추가, 9 cell prop 유지)
**연관 finding**: refactor-analysis-2026-05-17.md §1.1, wave3-adr-002-spec.md §3.3 + §4.3, wave3-adr-002-result.md §7
**연관 policy/constraint**: POL-COMPAT §3.1 (semver), POL-BUNDLE §1 (size-limit), C-31 (cross-package wiring audit)
**연관 spec**: `wave4-adr-018-spec.md`

### 결정 (권고 조합)

ADR-002 가 6 슬롯 (`text` / `number` / `date` / `dateTime` / `badge` / `link`) 만 wire 하고 미해결로 남긴 **icon + 5 extras (button/tag/avatar/progress) + 2 aliases (statusBadge/check)** 에 대한 후속 정책을 다음 5개 결정으로 정합한다.

**권고 조합 (D-1A + D-2A + D-3A + D-4A + D-5A)**:

| 결정 | 슬롯 | 권고 옵션 | 사유 (한 줄) |
|------|------|-----------|-------------|
| **D-1** | `icon` | **I-A** (placeholder 유지) | `IconCellProps.icon: ReactNode` required — value-only adapter 구조적 불가 (F-2). UX 변경 0. |
| **D-2** | `tag` / `progress` | **X-A1** (union 확장 — 2 슬롯만) | probe PASS — `adaptValueCell` 패턴 적용 가능. grid-core minor. |
| **D-3** | `button` / `avatar` | **X-B** (registry 외 — column.cell 직접 wiring) | `onClick` / `name` required → adapter 적용 시 widening cast 거짓말 + 런타임 미정의. |
| **D-4** | `statusBadge` / `check` aliases | **A-A** (status quo) | `statusBadge` = `badge` 동의어 (이미 wired), `check` = `checkbox` 동의어 (createColumns 우회). 추가 가치 0. |
| **D-5** | size-limit 한도 | **S-A** (10 → 12 KB 상향 +2 KB) | tag/progress 어댑터 2건 추가 → 예상 +0.5 KB. 여유 +1.5 KB 확보. |

**핵심 결론**: 5 extras 는 task description 이 단일 그룹으로 묶었으나 **probe + cell prop 검증 결과 두 가족으로 분리** —
- **value-adapter 친화 (tag, progress + alias statusBadge)** → union 확장으로 해소 가능
- **구조적 차단 (button, avatar, icon)** → required non-value prop (`onClick` / `name` / `icon`) 때문에 registry 외 처리만 정직

### 사유

**1. ADR-014 D-partial 결과 정합 (사실 정정)**

`wave1-adr-014-result-v2.md:15` 확인: D-partial 결정으로 **LinkCell / ButtonCell 만 `value?` prop 추가**, 나머지 9 cell (TextCell/NumberCell/DateCell/StatusBadgeCell/**TagCell**/**ProgressCell**/CheckCell/IconCell/**AvatarCell**) 은 변경 0. 즉:
- TagCell: `value: readonly string[]` (이미 value)
- ProgressCell: `value: number | null | undefined` (이미 value)
- AvatarCell: `name: string` (value 아님 — 보존)
- IconCell: `icon: ReactNode` (value 아님 — 보존)
- CheckCell: `checked: boolean` (value 아님 — 보존)
- ButtonCell: `value?: ReactNode` (D-partial 후 추가) + `onClick: () => void` (required, 보존)

**Tag / Progress 만 value-adapter 친화** — 사용자 task 의 "AvatarCell `value: string`" 가정은 ADR-014 D-partial 와 불일치 (정정 필요).

**2. probe 실증 (wave4-adr-018-spec.md §3)**

`src/__probe__/adr-018-extras.probe.ts` + `tsconfig.probe.json` 작성 후 `npx tsc --noEmit -p tsconfig.probe.json` 실행 결과 **EXIT=0** (probe 후 즉시 삭제, default typecheck 무결성 유지):
- `'tag'` / `'progress'` / `'statusBadge'` → `adaptValueCell` 어댑터로 typecheck PASS (union 확장 가정 하).
- `'button'` / `'avatar'` / `'icon'` / `'check'` → required non-value prop 결여로 widening cast (`as unknown as`) 없이 컴파일 실패. 캐스트 추가 시 컴파일 통과하나 **런타임 미정의** (onClick=undefined → TypeError on click, name=undefined → '?' fallback, icon=undefined → 무 glyph, checked=undefined → 무 상태).

**3. ADR-002 의 결과 체크 #3 한도 PASS 여유 검증 (wave3-adr-002-result.md §4.2b)**

`pnpm size-limit` 결과: grid-renderers 8.99 / 10 KB PASS (~1 KB 여유). tag + progress 어댑터 2건 (~50 LOC 어댑터 + minified) 추가 예상 +0.5 KB 이내 → 10 KB 한도 안에서 통과 가능성 있으나 **여유 부족**. 향후 D-1B / D-3 메타 경유 옵션 채택 시 추가 LOC 발생 가능성 고려 → 12 KB 상향 권고 (POL-BUNDLE §1 sub-clause: "버블링 룸 ≥20%").

**4. POL-COMPAT §3.1 — semver 영향 평가**

- grid-core `TomisColumnType` union 확장 (`'tag' | 'progress'` 추가) → **minor** (type narrowing 아님, 새 멤버 추가 — 기존 user code 가 새 멤버 사용 시도 없음).
- grid-renderers 의 wireRegistry 에 2 슬롯 추가 → **minor** (zero-config 기능 확장).
- size-limit 한도 상향은 POL 변경 아닌 빌드 인프라 — semver 외.
- ButtonCell / AvatarCell / IconCell 변경 0 → 0 semver 영향.

### 대안 비교

#### D-1: icon slot 정책

| 옵션 | 설명 | typecheck | 런타임 | semver | UX |
|------|------|-----------|--------|--------|-----|
| **I-A (권고)** | placeholder 유지 (현 상태) | PASS | `String(value ?? '')` 텍스트 fallback | none | type='icon' 사용자 → plain text |
| I-B | meta-경유 wiring (`column.meta?.icon: ReactNode`) | PASS | 메타에 icon 정의 시 실 IconCell | grid-core minor (`TomisColumnDef.meta.icon` 확장) + grid-renderers minor (adapter) | type='icon' + meta.icon 모두 정의 시 정상 |
| I-C | `TomisColumnType` 에서 `'icon'` 제거 | PASS | 사용자 코드 `type:'icon'` → TS2322 | grid-core **major** (union narrowing — breaking) | type='icon' 사용 불가 |
| I-D | createColumns 분기로 `type:'icon'` + cell 미주입 시 console.error | PASS | warn + plain text fallback | grid-core patch (런타임 추가만) | 경고 명시 — 사용자 무시 가능 |

**권고**: **I-A** — 변경 0. I-B 는 별도 cycle (meta 확장 ADR 필요), I-C 는 major bump 비용 부적절, I-D 는 enforcement 약함.

#### D-2: tag / progress 정책

| 옵션 | 설명 | typecheck | 런타임 | semver |
|------|------|-----------|--------|--------|
| **X-A1 (권고)** | union 에 `'tag' \| 'progress'` 만 추가 + wireRegistry 에 2 어댑터 추가 | probe PASS | TagCell / ProgressCell 정상 렌더 | grid-core minor + grid-renderers minor |
| X-A2 | union 에 `'tag' \| 'progress' \| 'button' \| 'avatar'` 4개 모두 추가 | PASS (with widening) | button/avatar 는 런타임 broken (위 §사유 2) | grid-core minor 단 거짓 약속 |
| X-B | Map key 를 string 으로 loosen (`Map<string, RendererFn>`) | PASS but type-level loosen | OK | grid-core **major** (RendererRegistry type 변경 — breaking on consumer use sites) |
| X-C | union 변경 0 — tag/progress 도 column.cell 직접 wiring | PASS | OK 단 boilerplate | none |

**권고**: **X-A1** — value-adapter 친화 2 슬롯만 추가하여 거짓 약속 회피.

#### D-3: button / avatar 정책

| 옵션 | 설명 | typecheck | 런타임 | UX |
|------|------|-----------|--------|-----|
| **X-B (권고)** | registry 외 — 사용자 `column.cell: ({row}) => <ButtonCell ... onClick=... />` 직접 wiring | PASS | OK | type 외 패턴 — 사용자 명시 |
| Y-A | union 에 추가 + `as unknown as` widening cast adapter | PASS with cast | broken (onClick=undefined 등) | 함정 — 무성능 fail |
| Y-B | ButtonCellProps 의 onClick 을 optional 화 + AvatarCell `name` deprecate / `value` alias 추가 (additive shim — ADR-014 D-partial 미러) | PASS | OK | 의미 명료성 손실 (avatar `value` 가 무엇인지 모호) |

**권고**: **X-B** — registry adapter 패턴의 의도 (value lookup) 와 button/avatar 의 실제 prop interface (액션/식별자) 가 맞지 않음. 별도 Pro 패키지 또는 페이지 레벨 wiring 이 정직.

#### D-4: alias (statusBadge / check) 정책

| 옵션 | 설명 | semver | 가치 |
|------|------|--------|------|
| **A-A (권고)** | status quo — alias 는 grid-renderers 의 자체 `Record<string, CellComponent>` 에만 존재 (이미 wired). grid-core union 에는 미추가 | none | 0 (`createColumns` 가 grid-core Map 만 조회 — alias 호출 의미 없음) |
| A-B | union 에 추가 → `coreRegister('statusBadge', ...)` 도 가능 | grid-core minor | 0 (`badge` 동의어 — 추가 가치 없음) + 의미 혼동 |

**권고**: **A-A** — alias 는 grid-renderers 내부의 ergonomic surface (`getRenderer('statusBadge')` API 사용자용), grid-core union 확장은 무의미.

#### D-5: size-limit 한도

| 옵션 | 한도 변경 | 여유 |
|------|----------|------|
| **S-A (권고)** | grid-renderers 10 → 12 KB (+2 KB) | tag+progress 후 ~+0.5 KB → 9.5 KB 정도 — 여유 ~2.5 KB |
| S-B | 한도 유지 (10 KB) | 8.99 + 0.5 = 9.49 KB — 통과하나 여유 ~0.5 KB (POL-BUNDLE §1 sub-clause 미달) |
| S-C | 한도 11 KB (+1 KB) | 통과하나 여유 ~1.5 KB |

**권고**: **S-A** — D-1B 또는 D-3 메타 경유 옵션 향후 채택 시 추가 LOC 대비 여유.

### Trade-off (권고 조합 D-1A+D-2A+D-3A+D-4A+D-5A)

| Pro | Con |
|-----|-----|
| Tag / Progress 사용자 zero-config wiring — `type:'tag'` / `type:'progress'` 가 실 렌더 | 5 extras 통합 union 확장 기대치 좌절 (button/avatar/icon 은 여전히 registry 외) |
| Button / Avatar / Icon 의 거짓 약속 회피 (widening cast 함정 차단) | 사용자가 button/avatar/icon 사용 시 별도 wiring 코드 필요 — boilerplate ↑ |
| ADR-014 D-partial 의 의미 명료성 결정 유지 (5 cell prop 보존) | "왜 tag/progress 는 되고 button 은 안 되는가" docs 설명 부담 |
| grid-core / grid-renderers 모두 minor — 마이그레이션 cost low | size-limit 12 KB 상향 — POL-BUNDLE §1 사유 명시 필요 |
| probe + ADR-014 사실 정정으로 task description 의 오해 (5 extras 동질 가정 + AvatarCell value 가정) 차단 | 5 decisions 로 분리됨 — 사용자 검토 부담 ↑ (vs task의 4 decisions) |

### 영향 분석

- **영향 패키지**: 
  - `grid-core` — `column/types.ts:33` `TomisColumnType` union 에 `'tag' | 'progress'` 추가
  - `grid-renderers` — `wireRegistry.ts` 에 어댑터 2건 + import 추가 (~25 LOC)
  - `.size-limit.json` — grid-renderers 10 → 12 KB
- **예상 공수**: 2-3h (구현 ~1h + CHANGELOG/Changeset/검증 ~1-2h).
- **위험**: **low** — probe 검증된 패턴. grid-core union 멤버 추가는 기존 사용 코드 무영향 (새 멤버 사용 코드만 영향).
- **semver 영향**: 
  - `@tomis/grid-core`: **minor** (union 확장)
  - `@tomis/grid-renderers`: **minor** (zero-config 슬롯 추가)
- **breaking change 여부**: **no** — additive 만. 사용자가 `type:'tag'` 사용 코드를 작성한 적 없으므로 (이전에 type-error) backward-compat 자동.

### 실행 조건 (실행 전 충족 필요)

1. **사용자 D-1 ~ D-5 결정** — 5건 (§위 표).
2. **ADR-002 implemented 상태 확인** — wiring 인프라 (wireRegistry + side-effect + sideEffects + peerDep) 정착 (이미 충족).
3. **ADR-014 D-partial 정합** — TagCell `value: readonly string[]` / ProgressCell `value: number|null|undefined` 보존 확인 (이미 충족 — wave1-adr-014-result-v2.md 검증).
4. **probe 재실행** — implementer 가 wave4-adr-018-spec.md §3 의 probe 재현 후 typecheck EXIT=0 확인.
5. **size-limit 측정** — 구현 후 `pnpm size-limit` 으로 실측치 + 12 KB 한도 PASS 확인.

### 결과 (실행 후 검증 항목)

- [x] `grid-core/src/column/types.ts:33` `TomisColumnType` union 에 `'tag' | 'progress'` 추가 (`'checkbox' | ... | 'icon' | 'tag' | 'progress'`).
- [x] `grid-renderers/src/wireRegistry.ts` `wireDefaultRenderers()` 에 `registerRenderer('tag', ...)` / `registerRenderer('progress', ...)` 추가 (총 6→8 hits).
- [x] `wireRegistry.ts` 상단 주석 (NOT wired 절) — 5 extras → 3 extras (`button` / `avatar` + `icon`) 로 갱신 + `tag` / `progress` 가 wired 슬롯으로 이동.
- [x] `grid-core/src/column/rendererRegistry.ts` `defaultRendererRegistry` Map 에 `'tag'` / `'progress'` placeholder 2 entry 추가 (graceful fallback — D-3A ADR-002 정책 미러).
- [x] `.size-limit.json` grid-renderers `"limit": "10 KB"` → `"12 KB"`.
- [x] `pnpm -r typecheck` 14 packages PASS.
- [x] `pnpm --filter "./packages/*" build` 13 packages PASS.
- [x] `pnpm size-limit` PASS (grid-renderers `9.07 kB / 12 kB` — 여유 ~2.9 KB).
- [x] `grid-core` CHANGELOG MINOR entry (ADR-018 union 확장).
- [x] `grid-renderers` CHANGELOG MINOR entry (ADR-018 2 슬롯 추가).
- [x] Changeset `adr-018-tag-progress-wiring.md` — grid-core minor + grid-renderers minor.
- [x] ADR 본문 결과 체크박스 + Implementation Note.
- [ ] (선택) Storybook 시각 검증 — TagCell / ProgressCell 의 wiring 효과 (선택, MOD-GRID-99-B 보류 정합).

### Implementation Note — 2026-05-17

- spec 권고 조합 (I-A + X-A1 + X-B + A-A + S-A) 모두 적용.
- TomisColumnType union: +2 (`'tag'` | `'progress'`), 9 → 11 멤버.
- wireRegistry.ts: +2 adapter (6 → 8 hits). `registerRenderer('tag', ...)` / `registerRenderer('progress', ...)` 추가.
- defaultRendererRegistry: +2 placeholder (`'tag'` / `'progress'`) — graceful fallback 대칭 유지.
- size-limit: 10 → 12 KB. 실측 grid-renderers **9.07 kB / 12 kB** (여유 ~2.9 KB).
- README: button/avatar column.cell 패턴 가이드 추가 (X-B).
- icon placeholder + alias status quo: 변경 0.
- probe: 재실행 PASS (EXIT=0).
- typecheck: 14 packages PASS (EXIT=0). build: 13 packages PASS (EXIT=0).
- 결과 보고서: `.claude/tw-grid/findings/wave4-adr-018-result.md`

**Spec divergence**: task brief 에서 Step 2 (defaultRendererRegistry placeholder) 누락 — spec §5 Step 2 기준 적용 (ADR-002 graceful-fallback 대칭 유지를 위해 필수). 결과 보고서에 기록.

### 알려진 한계 / 미해결

- **D-3 X-B 채택 시 button/avatar/icon 사용자 boilerplate**: `column.cell: ({row}) => <ButtonCell value={...} onClick={() => ...} />` 패턴 README 예시 + Migration Notes 추가 권고 (Wave 4 follow-up).
- **D-1B (icon meta-경유) 향후 ADR**: 사용자가 type='icon' zero-config 요구 시 별도 ADR — `TomisColumnDef.meta.icon` 확장 + createColumns 분기. semver grid-core minor.
- **단위 테스트**: ADR-002 와 동일 follow-up (spec §7 Step 4). registry slot 8개 lookup 검증.

### Spec divergence (task description vs 실제 코드)

본 ADR 작성 중 task description 의 3 가지 가정과 실제 코드 불일치 발견 (advisor 검증):

1. **task**: "AvatarCell: `value: string` (ADR-014 후) → adapter 가능"  
   **실제**: ADR-014 D-partial 로 AvatarCell `name: string` 유지 (wave1-adr-014-result-v2.md:15 + 80번 줄 "CheckCell/IconCell/AvatarCell: D-partial 결정으로 변경 0"). value-adapter 불가.

2. **task**: "`wireRegistry.ts` 에 6 + 3 alias = 9 hits 있음"  
   **실제**: 6 hits — `text`/`number`/`date`/`dateTime`/`badge`/`link`. 9는 ADR-002 task description 의 사용자 example (statusBadge/check/checkbox 추가 3) 였으나 spec contract 가 6으로 한정 (wave3-adr-002-spec.md §0+§3.2). ADR-002 "Spec divergence note" 참조.

3. **task**: "5 extras" 동질 가정 → "union 확장 (minor) — coreRegister 가능, 일관 패턴 + adapter 가능"  
   **실제**: 5 extras 중 2개 (`tag`/`progress`) 만 value-adapter 가능. 3개 (`button`/`avatar`) + `icon` 은 required non-value prop 으로 구조적 차단. union 확장만으로 broken 어댑터 생산. **본 ADR 가 이 분리를 명시.**

이 3 사실 정정으로 본 ADR 의 결정 분리가 task description 의 4 decisions 보다 1건 (D-3 분리) 더 많아짐. 구조적 차단 가족과 value-adapter 가족을 동일 결정에 묶지 않기 위함.

---

## ADR-MOD-GRID-REFACTOR-2026-05-17-019: tw-framework-front `EditableGrid` 컴포넌트 폐기 (ADR-004 partial 해소)

**결정일**: 2026-05-17 (Wave residual — ADR-004 의 partial 잔존 해소)
**승인일**: 2026-05-17 (사용자 옵션 C 채택)
**상태**: accepted — implemented
**연관 ADR**: ADR-004 (4/5 alias 완료, EditableGrid partial — `decisions.md:340, 356, 379, 391` deferred 명시), ADR-008 (types re-export), ADR-MOD-GRID-10/G-005 (ChangeTrackingGrid alias)
**연관 finding**: `wave5-adr-004-result.md:29-41` (EditableGrid partial 사유), `wave-residual-1-editablegrid-spec.md` (본 ADR 의 spec)
**연관 policy/constraint**: POL-MIG-STAGE (사용처 점진 마이그레이션 — 단계 완결), C-31 (Functional Wiring Audit)

### 결정

`tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` (252 LOC, `export default EditableGrid`) 를 **삭제**한다. `types/tomis/grid.ts:24` 의 `EditableColumnMeta` 타입은 **보존** (`pages/tomis/payroll/PayrollEditablePage.tsx:8, 141` 가 `ChangeTrackingGrid` 의 column meta 로 사용 — alive).

monorepo 신설 (옵션 B) 도, 영구 보존 (옵션 A) 도 채택하지 않는다.

### 사유

1. **사용처 0** — `Grep "EditableGrid" tw-framework-front/src/` 결과 자기 파일 외 import 0건 (pages/, stories/, tests/, components/ 모두). 252 LOC 완전 dead code. `wave-residual-1-editablegrid-spec.md` §2.5 검증 완료.
2. **PayrollEditablePage 의 실 use case 는 `ChangeTrackingGrid`** (`pages/tomis/payroll/PayrollEditablePage.tsx:5, 199`). EditableGrid 가 의도한 "cell 편집 + row tracking" 시나리오를 ChangeTrackingGrid 가 이미 충족 — EditableGrid 미사용은 우연이 아니라 패턴 정합의 결과.
3. **monorepo 디자인 차이는 누락이 아닌 의도** — `grid-renderers/src/EditableCell.tsx:3` JSDoc ("Absorbs tw-framework-front EditableGrid.tsx L75-129") 가 명시: monorepo 는 EditableGrid 의 inline JSX 를 EditableCell 로 흡수 + cell 편집 트리거를 caller 책임으로 분리. 일체형 컴포넌트는 monorepo 설계 의도 외.
4. **옵션 B (monorepo 신설) 부정 ROI** — 사용자 0 + ChangeTrackingGrid + EditableCell 조합으로 동일 기능 가능. 6-8h 공수에 사용자 0 → premature speculative work.
5. **POL-MIG-STAGE 정합** — 마이그레이션 단계 종료 (dead code 잔존 = 단계 미완 + 분기 진화 위험).

### 대안 (반드시 2개 이상)

| 대안 | 설명 | 각하 이유 |
|------|------|----------|
| **A. 영구 자체 보존** | 252 LOC 그대로 유지. ADR-004 partial 영구화 | 분기 진화 위험 + dead code 영구 + 결정 보류 = 미결정. 신규 페이지가 잘못 채택 위험. POL-MIG-STAGE 위배 가능성. |
| **B. monorepo 에 EditableGrid wrapper 신설** | `grid-pro-tracking/src/legacy/EditableGrid.tsx` 신설 후 tw-front re-export (4 alias 패턴 정합) | 사용자 0 + ChangeTrackingGrid 가 use case 충족 + API 디자인 결정 부담 (ChangeTrackingGrid 와의 책임 경계 재정의 의무, 별도 ADR 필요). 6-8h 공수 negative ROI. |

(C 채택 = 본 ADR 의 결정.)

### Trade-off

| Pro | Con |
|-----|-----|
| 252 LOC dead code 즉시 제거 — 유지 부담 0 | 향후 cell-edit 일체형 컴포넌트가 필요해지면 재신설 의무 (그 시점 ADR 신설) |
| ADR-004 partial 잔존 완전 해소 (4/5 → 5/5 결론) | 타입 `EditableColumnMeta` 와 컴포넌트 분리 — implementer 가 컴포넌트만 삭제 명확 인지 의무 |
| POL-MIG-STAGE 완결 — 마이그레이션 단계 종료 | `grid-pro-range/README.md:46` 의 EditableGrid 예제 (doc) 부수 정리 의무 (ChangeTrackingGrid 로 rename) |
| 신규 페이지가 EditableGrid 우연 채택 위험 0 | (없음) |

### 영향 분석

- **영향 패키지**: tw-framework-front (변경). monorepo 변경 0 (doc-only 부수 정리 제외).
- **예상 공수**: 0.5h (파일 삭제 + grid-pro-range/README.md doc 부수 정리 + types/tomis/grid.ts:21 주석 rename).
- **위험**: low — 사용처 0건 검증 완료 (`wave-residual-1-editablegrid-spec.md` §2).
- **semver 영향**: **none (앱 내부 변경)** — tw-framework-front 는 npm publish 대상 아님. monorepo 패키지 자체 변경 0 (README 변경은 semver 외).
- **breaking change 여부**: no (앱 내부, 사용처 0).

### 실행 조건 (실행 전 충족 필요)

- 사용자 D-1 응답 (옵션 C 채택 확인).
- `EditableColumnMeta` 타입 보존 확인 (implementer 가 컴포넌트 파일만 삭제, 타입 파일 미변경 명시).

### 결과 (실행 후 검증 항목)

- [x] `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` 파일 삭제 (252 → 0 LOC).
- [x] `npx tsc --noEmit -p tsconfig.app.json` — baseline 7 errors (`PayReal01EditModal.tsx` 관련, pre-existing) 유지, 신규 오류 0.
- [x] `Grep "EditableGrid" tw-framework-front/src/` — 자기 파일 hit 0 (삭제 후 전체 0).
- [x] `types/tomis/grid.ts:24` 의 `EditableColumnMeta` 유지 확인 (PayrollEditablePage 빌드 PASS).
- [-] (부수 정리 권고 — D-2a) `topvel-grid-monorepo/packages/grid-pro-range/README.md:46` rename — **해당 없음**: 본 repo 에 grid-pro-range/ 미존재.
- [x] (부수 정리 권고 — D-2a 채택) `tw-framework-front/src/types/tomis/grid.ts:21` 의 `// EditableGrid` → `// EditableColumnMeta (used by ChangeTrackingGrid)` rename 완료.

### 알려진 한계

1. **타입 향후 거취 미결**: `EditableColumnMeta` 가 monorepo 의 `grid-renderers` (EditableCell 의 column meta) 또는 `grid-core` 로 이관 가능 (ADR-008 후속). 본 ADR 의 범위 외 (spec §6 D-3=D-3b 권고).
2. **향후 재신설 가능성**: cell-edit 일체형 컴포넌트가 다시 필요해지면 (i) ChangeTrackingGrid + EditableCell wiring (caller code), 또는 (ii) monorepo 에 새 컴포넌트 신설 (그 시점 ADR 신설). 본 ADR 은 "지금 시점에 필요 0" 만 명시.
3. **doc 부수 정리는 monorepo doc 변경 요구** — `grid-pro-range/README.md:46` 의 rename. monorepo 측 변경이나 doc-only 이므로 semver 영향 0.

### Implementation Note — 2026-05-17

- 옵션 C (deprecation + 즉시 삭제) 채택 완료
- EditableGrid.tsx 252 LOC 삭제
- EditableColumnMeta 타입 보존 (PayrollEditablePage 의존 — `types/tomis/grid.ts:24` 유지)
- D-2 default a 적용: `types/tomis/grid.ts:21` 주석 `// EditableGrid` → `// EditableColumnMeta (used by ChangeTrackingGrid)` rename
- D-2 doc (grid-pro-range/README.md:46): monorepo 파일 본 repo 미존재 — 해당 없음 기록
- D-3 default b: EditableColumnMeta monorepo 이관은 별도 cycle (현 상태 보존)
- typecheck PASS (baseline 7 유지 — PayReal01EditModal.tsx 7건, 신규 0)
- 결과 보고서: `.claude/tw-grid/findings/wave-residual-1-editablegrid-result.md`

---

## 부록 A — 의존성 그래프

ADR 간 선행/병렬 관계 (텍스트 다이어그램):

```
                          [no deps]
                              |
              +---------------+---------------+
              |               |               |
        ADR-001 (license     ADR-011 (size-  ADR-014 (cast
        wiring — 비즈니스    limit ignore    정리)
        결정 #1 선행)         통일)
              |               |               |
              |               |               |
                                              |
        ADR-007 (storage    ADR-015 (stale    ADR-016 (onRowClick
        adapter — needs     build sweep)      통일)
        ADR-009 layering)        |               |
              |                  +----+----+    |
              |                       |          |
              |                  ADR-001 정렬 ADR-008 정렬
              |                       |          |
        ADR-009 (layering         완료              |
        — needs deps         |                  |
        cleanup)             |              ADR-008 (tw-front
              |              |              types re-export
        ADR-010 (SortBadge — |              — needs ADR-016)
        depends on ADR-009)  |                  |
                             |                  |
                             |              ADR-004 (5 variant
                             |              교체 — 사용자
                             |              결정 #2: 시각 회귀
                             |              baseline)
                             |                  |
                             |              ADR-012 (DataTable
                             |              계획)
                             |
                ADR-006 (TomisColumnDef
                rename — needs nothing,
                blocks ADR-003)
                             |
                ADR-002 (rendererRegistry
                wiring — independent,
                blocks ADR-003)
                             |
                ADR-013 (dead API 정리 —
                blocks ADR-003 collision)
                             |
                +------------+
                |
        ADR-003 (메타 facade — needs
        ADR-002 OR ADR-013 + ADR-006)
                |
        ADR-005 (grid-export 통합 —
        needs ADR-003 facade 정착
        후 권장, 독립 실행 가능)
```

**Longest dependency chain** (가장 긴 선행 사슬):
```
[사용자 결정 #1 (license enforcement policy)]
   → ADR-001 (license wiring)
   → ADR-015 (stale sweep — checkLicense rebuild 정렬)
   → ADR-009 (layering 정리)
   → ADR-007 (storage adapter — internal 폴더 정렬)
```
= **4 단계 (1 사용자 결정 + 3 ADR)** (license enforcement chain).

또는:
```
ADR-006 (datamap rename)
   → ADR-013 (dead API 정리)
   → ADR-003 (메타 facade)
   → ADR-005 (grid-export 통합 — facade 정착 후)
```
= **4 ADR 단계** (facade chain — 더 깁).

또는:
```
ADR-016 (onRowClick 통일)
   → ADR-008 (tw-front types re-export)
   → ADR-004 (5 variant 교체 — 사용자 결정 #2 후)
   → ADR-012 (DataTable 계획)
```
= **4 ADR 단계** (tw-framework-front chain).

**최대 longest path 추정**: 4 ADR (facade chain) — wave 4 까지 필요.

---

## 부록 B — Recommended Execution Order (dependency-aware) — **v2 (2026-05-17 재설계)**

> **재설계 사유**: v1 의 Wave 분류는 공수 기준(병렬 시간) 이었으나, ADR 본문의 "실행 조건" 절을 정독한 결과 **사용자 결정 + 선행 ADR 의존성**으로 v1 Wave 1 의 6개 중 3개(006/010/016) 가 단독 실행 불가로 판명. 의존성 + 사용자 결정 기준으로 5 Wave 재정렬.

### Wave 1 (즉시 실행 가능 — 사용자 결정 0건, 선행 ADR 0건)

병렬 실행 가능. **현재 실행 중**:
- **ADR-011** (size-limit ignore 통일) — 1h, semver none, 위험 low
- **ADR-014** (`as unknown as CellComponent` 정리) — 2h, semver none, 위험 low
- **ADR-015 (부분)** (stale build sweep — `pnpm -r build` + JSDoc `verifyGridLicense` → `checkLicense` sweep) — 1h, semver none, 위험 low

> **주의**: ADR-015 의 "ADR-001 license enforcement 정렬" 절은 Wave 3 으로 이연. Wave 1 에서는 `src` 와 `dist` 동기화 + JSDoc 옛 이름 정리만 수행.

**소계 공수**: 4h (병렬 시 max 2h).

### Wave 2 (사용자 결정 필수 — 비즈니스/구조 결정 게이트)

본 Wave 진입 전 부록 C 의 5개 결정 답변 필요. 결정 즉시 병렬 가능.

- **ADR-001** (license wiring) — 4h, deps: 부록 C #1 (enforcement 정책 A/B/C)
- **ADR-006** (TomisColumnDef rename) — 2h, deps: 부록 C #3 (즉시 vs deprecation alias)
- **ADR-009** (layering 정리) — 6h, deps: 부록 C #4 (옵션 A/B/C)
- **ADR-005** (grid-export 통합) — 6h, deps: 부록 C #5 (통합 방향)

**소계 공수**: 18h (병렬 시 max 6h).

### Wave 3 (Wave 1+2 후속, 의존성 자동 해소)

- **ADR-002** (rendererRegistry cross-package wiring) — 6h, deps: 없음(단 ADR-003 facade 보다 선행 권장)
- **ADR-013** (dead public API 정리) — 2h, deps: ADR-003 보다 선행 권장 (deprecation alias 도입 정책)
- **ADR-008** (tw-framework-front types re-export) — 2h, deps: ADR-016 동행
- **ADR-016** (onRowClick 시그니처 통일) — 3h, deps: ADR-008 동행 (drift 방지)
- **ADR-007** (storage adapter 추출) — 5h, deps: ADR-009 (Wave 2)
- **ADR-010** (SortBadge 중복 제거) — 1h, deps: ADR-009 (Wave 2)
- **ADR-015 (후반)** (license enforcement CI 검증 단계 추가) — 0.5h, deps: ADR-001 (Wave 2)

**소계 공수**: 19.5h (병렬 시 max 6h, 단 ADR-008+016 은 1 PR 묶음).

### Wave 4 (facade 정착)

- **ADR-003** (`@tomis/grid` 메타 facade 실 export) — 3h, deps: ADR-002 + ADR-006 + ADR-013 (Wave 2+3)

**소계 공수**: 3h.

### Wave 5 (대형 마이그레이션 — 시각 회귀 baseline 필수)

- **ADR-012** (DataTable 마이그레이션 계획 ADR) — 4h (계획만), deps: 사용자 결정 #6 분리 여부
- **ADR-004** (5 variant 교체) — 8h, deps: ADR-008 (Wave 3) + 부록 C #2 (시각 회귀 baseline)

**소계 공수**: 12h (병렬 시 max 8h).

---

### Wave 합산

| Wave | 공수 (총) | 병렬 시 max | 게이트 |
|------|-----------|-------------|--------|
| Wave 1 | 4h | 2h | 없음 (즉시) |
| Wave 2 | 18h | 6h | 부록 C 4개 결정 |
| Wave 3 | 19.5h | 6h | Wave 1+2 완료 |
| Wave 4 | 3h | 3h | Wave 2+3 완료 |
| Wave 5 | 12h | 8h | 시각 회귀 baseline |
| **합계** | **56.5h** | **25h** | (보고서 §12 56h 와 일치) |

### v1 → v2 변경 사유 (이동된 ADR)

| ADR | v1 Wave | v2 Wave | 이동 사유 |
|-----|---------|---------|----------|
| 006 | 1 | 2 | 본문 §47-51 "마이그레이션 path: deprecation alias vs 즉시" — 부록 C #3 결정 필요 |
| 002 | 1 | 3 | 단독 의존성 0이나 ADR-003 facade 와 같은 chain — Wave 1 분산 시 facade 의존성 차단 |
| 013 | 1 | 3 | 본문 "facade 와 정렬" — ADR-003 의 deprecation alias 정책과 동행 |
| 016 | 1 | 3 | 본문 "ADR-008 과 정렬" — tw-framework-front re-export 와 1 PR 묶음 |
| 010 | 3 | 3 | 본문 §111-114 "ADR-009 선행 필요" 명시 — Wave 1 단독 불가 (확인) |
| 015 | 2 | 1+3 | dist rebuild + JSDoc sweep 은 독립 (Wave 1), license CI 통합은 ADR-001 정렬 (Wave 3) |
| 003 | 2 | 4 | 의존성 002+006+013 가 Wave 2/3 으로 이동 → facade 는 Wave 4 |

**전체 예상 공수**: 56.5h (v1 56h 와 일치, +0.5h 는 ADR-015 분할). 병렬 처리 시 max ~25h.

---

## 부록 C — 사용자 결정 지점

### 1. **ADR-001 Pro license enforcement 정책 — 비즈니스 결정**

본 ADR 의 대안 1/2/3 중 택1 필수. 추가 옵션 가능:
- **옵션 A**: invalid 시 Watermark 자동 렌더 (본 ADR 권고)
- **옵션 B**: invalid 시 Pro 컴포넌트 자체 렌더 차단 (throw/null) — UX 영향 큼
- **옵션 C**: invalid 시 dev 환경 console.error 만 — enforcement 약함
- **옵션 D**: 3 옵션의 환경 변수 기반 분기 (dev/prod 다른 정책)

**누가 결정**: 비즈니스/라이선스 정책 담당자. 메인 세션 사용자.

**근거 자료**: POL-DOC-LIC §1.2 (Pro 패키지 런타임 검증 의무), 보고서 §2.1.

---

### 2. **ADR-004 5 variant 교체 — 시각 회귀 baseline 누가 잡을 것인가**

본 ADR 의 실행 조건: 5 variant 각각 사용 페이지 1+ 의 screenshot baseline.
- **옵션 A**: 메인 세션 사용자 — manual screenshot.
- **옵션 B**: Playwright/Chromatic 등 자동화 도입 — 별도 ADR (C-9 외부 의존성) 필요.
- **옵션 C**: 페이지 import 인벤토리만 수행 + 시각 회귀 단계 별도 ADR 분리.

**누가 결정**: QA / 프론트엔드 리드. 메인 세션 사용자.

**근거 자료**: 보고서 §7.1, §13 #2 (페이지 import 인벤토리 추가 조사 필요).

---

### 3. **ADR-006 TomisColumnDef rename 의 마이그레이션 path**

- **옵션 A**: 즉시 rename + grid-pro-datamap major bump (clean).
- **옵션 B**: deprecation alias 1 minor 유지 후 다음 major 에서 제거 (정중).

**누가 결정**: 메인 세션 사용자 (외부 사용자 0 추정이나 검증 부담).

**근거 자료**: 보고서 §1.2, ADR-MOD-GRID-12 검토 (보고서 §13 #5).

---

### 4. **ADR-009 layering 옵션 (A/B/C) 채택**

본 ADR 의 옵션 A (3 export 를 grid-core/internal 로 이동) 권고지만 사용자 확인 필요:
- **옵션 A**: features → core 이동 (본 ADR 권고)
- **옵션 B**: composition prop pattern
- **옵션 C**: hard dep → peerDep 전환만

**누가 결정**: 메인 세션 사용자.

**연쇄 영향**: ADR-010 (SortBadge 중복 제거) 의 단일화 방향이 본 결정에 종속.

---

### 5. **ADR-005 `@tomis/grid-export` 통합 방향**

- **옵션 A**: 본 ADR 권고 — entry 2개 평행 지원 (minor).
- **옵션 B**: tw-framework-front 측을 Table 기반으로 교체 (보고서 §6.3 옵션 3).
- **옵션 C**: grid-export 폐기 (보고서 §6.3 옵션 4).

**누가 결정**: 메인 세션 사용자 + xlsx peer 의존성 정책 담당자.

**근거 자료**: 보고서 §6.3, ADR-MOD-GRID-00-008 peer 매트릭스.

---

### 6. **Wave 4 실행 시점 — 시각 회귀 검증 단계 분리 여부**

- **옵션 A**: ADR-004 + ADR-012 를 1 wave 로 묶어 실행.
- **옵션 B**: ADR-012 (계획만 — 4h) 만 Wave 4 에 실행 + ADR-004 (8h) 는 별도 Phase 로 분리.

**누가 결정**: 메인 세션 사용자 + 시각 회귀 검증 도구 결정자 (부록 C #2 와 연동).

---

## 추가 메모 — 보고서 §13 한계 (추가 조사 필요 항목)

본 ADR 들의 일부 실행 조건은 보고서 §13 의 "검출되지 않은 영역" 에 의존:
1. **DataTable 페이지 import 인벤토리** (§13 #1) — ADR-012 Phase 1 의무.
2. **5 variant 페이지 사용 현황** (§13 #2) — ADR-004 실행 조건.
3. **번들 실측 비교** (§13 #3) — ADR-011 통과 검증.
4. **storybook 부트스트랩 완료** (§13 #4) — ADR-001 의 워터마크 시각 검증 등.
5. **MOD-GRID-12 ADR ↔ 코드 mismatch** (§13 #5) — ADR-006 실행 조건.
6. **Pro ↔ Pro 순환 import 검사** (§13 #6) — ADR-002 의 peerDep 추가 시 확인.
7. **1000행 stories 분포** (§13 #7) — 본 ADR 직접 영향 없음.
8. **decisions/MOD-GRID-*-decisions.md 17 파일 전수** (§13 #8) — 본 ADR 들과 mismatch 추가 발견 가능.
9. **grid-license 보안성** (§13 #9) — ADR-001 의 `useLicenseStatus()` hook 또는 동등 메커니즘 존재 확인.
10. **CI 설정** (§13 #10) — ADR-011 + ADR-015 의 CI 통합 점.

이 10건은 다음 사이클 또는 본 ADR 채택 후 별도 작업으로 처리 권고.

---

## Rubric Strengthening Amendment — R-4 메타 finding 처리 (2026-05-17)

**채택일**: 2026-05-17
**상태**: applied (rubric + agent prompt edit 본 cycle 동시 ship)
**입력 finding**: `findings/wave-residual-4-storybook-99b-spec.md` §7.1 R-4 + §9.1 #2
**입력 spec**: `findings/r-4-rubric-strengthening-spec.md`

### 채택 사항

1. **`rubric/verify-rubric.md` v1.0.5 → v1.0.6**:
   - A 카테고리 actual-execution 항목 5건 신설 (A-04 ~ A-08): pnpm install 실 실행 + dist artifact 실 존재 + config glob/include 정합 + runtime test 실 실행 + stories placeholder vs functional 구분.
   - 항목 수 16 → 21 (A=3 → 8). 가중치 합 100% 불변.
   - Vacuous Truth Rule keyword 확장: `storybook`, `playwright`, `visual:test`, `glob`, `stories`, `baseline`, `install`, `runtime`, `test`, `e2e` 추가.
2. **`agents/coverage-verifier.md` 강화**:
   - A-04 ~ A-07 actual-execution Bash mandate 명시 (실행 명령 인용 + exit code 인용 의무).
   - 모델 선택 가이드: sonnet (actual-execution 항목 평가 시) / haiku (모두 N/A 시).

### 사유 (R-4 메타 finding)

MOD-GRID-99-B/G-002 (Storybook 부트스트랩) + G-003 (시각 회귀 인프라) verify-score 100 가 다음 3 검출 실패:
- (a) `apps/docs/.storybook/main.ts` glob gap — `packages/*/src/__stories__/*.stories.tsx` 32 파일 미수집.
- (b) `pnpm install` 미수행 — `apps/docs/node_modules/@storybook/react` 직접 symlink 부재.
- (c) `tests/visual/__snapshots__/` baseline PNG 미캡처 + `pnpm visual:test` 실 실행 미수행.

근본 원인: Verifier Agent (haiku) 가 명령 실 실행 없이 spec 인용 + 부분적 grep 만으로 채점. **rubric 강화 + Verifier agent capability 확장 (Bash mandate + 모델 상향) 양쪽 동시 ship 의무** — rubric 항목만 추가 시 환각이 새 필드명으로 재발 (advisor §2 load-bearing concern).

### 적용 시점 + Retroactive 정책 (advisor 자문 §5 일치)

- **v1.0.6 A-04 ~ A-08 적용 시점**: 본 채택일 (2026-05-17) **이후의 verify 단계** 에만 적용.
- **Wave 1-5 17 ADRs + MOD-GRID-99-A/B 기존 score 변경 없음** — retroactive 미적용.
- **MOD-GRID-99-B/G-002/G-003 notation**: 본 amendment 채택 시점 이후 `state.json` 또는 ADR 본문에 다음 notation 추가:
  - "G-002 score 100 — v1.0.6 기준이라면 A-04 (install) + A-05 (dist artifact) + A-06 (main.ts glob gap) NO 처리 → ~40 점 fail. 단 v1.0.6 채택일 이전 score 이므로 retroactive 미적용 — 기록만."
  - "G-003 score 100 — v1.0.6 기준이라면 A-04 + A-05 + A-07 (visual:test 미실행) NO 처리. 동일 미적용."

### Cross-harness 적용 권고 (별 cycle)

- tw-mail (`.claude/tw-mail/rubric/`) + tw-harness (`.claude/tw-harness/rubric/`) 도 동일 rubric 구조 사용 — 본 강화 적용 가능. **별 cycle 에서 처리** — 본 amendment 범위 외.
- 권고 순서: tw-grid 본 cycle 적용 후 1~2 cycle 실무 검증 (R-4 같은 재발 차단 효과 확인) → tw-mail/tw-harness cascade.

### 기존 ADR 재평가 권고 (별 cycle)

- Wave 1-5 17 ADRs 중 ADR-001 (Watermark wiring 7 패키지 변경) 같은 actual-execution 의무가 클 ADR 들의 retro 재평가는 **본 amendment 범위 외**.
- 기존 score 유지 정책. 재평가가 필요하다고 판단되는 ADR 발견 시 — 별 retro cycle 에서 v1.0.6 기준 재채점 + 차이 분석.

### 위험 + 한계

| ID | 위험 | 완화 |
|---|---|---|
| R-rs-1 | Verifier 시간/비용 ↑ (Bash 실 실행 + sonnet 모델 상향) | N/A 적법 케이스 (순수 ADR / decisions) 는 haiku 유지 |
| R-rs-2 | rubric 신 항목 5건 → F-02 산식 검산 복잡도 ↑ | F-02 자기-검산 의무 + 카테고리 합 21 cross-check |
| R-rs-3 | 본 강화가 새 환각 패턴 (A-04 false PASS 등) 으로 재발할 위험 (load-bearing) | coverage-verifier.md Bash mandate + 모델 가이드 동시 ship — rubric edit 단독 금지 |
| R-rs-4 | Vacuous keyword 확장이 광범 — 정당한 vacuous false-NO 가능성 | `naCategoryHandling` 필드 명시로 정당화 가능 + 비-그리드 런타임 모듈 v1.0.4 규칙 (3 조건) 적용 가능 |

### 참조

- spec 보고서: `.claude/tw-grid/findings/r-4-rubric-strengthening-spec.md`
- rubric edit: `.claude/tw-grid/rubric/verify-rubric.md` (v1.0.5 → v1.0.6 changelog 본문 참조)
- agent edit: `.claude/tw-grid/agents/coverage-verifier.md`
- R-4 finding 출처: `.claude/tw-grid/findings/wave-residual-4-storybook-99b-spec.md` §7.1 + §9.1 + `wave-residual-4-storybook-99b-result.md` §5
- advisor 자문 (orientation post, 2026-05-17 본 cycle): load-bearing concern — Verifier agent capability gap. 본 amendment 가 agent prompt edit 과 동시 ship 으로 mitigation.
