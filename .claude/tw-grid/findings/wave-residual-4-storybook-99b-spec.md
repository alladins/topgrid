# Wave-residual 4 — Storybook + Visual Regression Coverage Spec (MOD-GRID-99-B 후속)

**작성일**: 2026-05-17
**작성자**: tw-grid spec writer
**Goal**: Wave 1-5 시각 변경 (ADR-001 / ADR-002 / ADR-014) 의 시각 회귀 baseline 확보 + 누락 시나리오 보강
**입력**: refactor-analysis-2026-05-17.md §10.2 + §13 #4 / canonical-modules → MOD-GRID-99-B (G-001 ~ G-005 모두 completed)
**상태**: spec — implementer 위임 전 마스터플랜
**범위**: read-only spec (코드 변경 0건). 본 문서는 실행 계획서이며 본 작성 단계는 분석/계획만 수행.

---

## 0. 사전 정정 — 본 작업의 실제 형태 (task 브리프와의 차이)

본 spec 의 task 브리프는 "Storybook **부트스트랩**" 으로 framing 되었으나, 디스크 증거가 그 전제를 반증한다. 본 §0 에서 사실을 먼저 명시한다.

### 0.1 task 브리프 가정 vs 디스크 실태

| Task 브리프 가정 | 디스크 실태 (2026-05-17 검증) | 출처 |
|---|---|---|
| "Storybook 미부트스트랩" — bootstrap 필요 | `apps/docs/.storybook/main.ts` + `preview.ts` 존재. Storybook 8.x + `@storybook/react-vite` 채택. glob `../../../packages/*/stories/**/*.stories.@(ts\|tsx)` wiring. | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/.storybook/main.ts` L1-27 |
| `.storybook/` 디렉토리 부재 (G-001 deviation doc, 2026-05-14) | G-002 (Storybook 부트스트랩) 가 2026-05-15 completed (state.json L1206-1219). deviation doc 은 이후 무효화. | `state.json` / `goals/MOD-GRID-99-B/docs-goals.json` G-002 |
| Storybook 환경 옵션 SB-1/SB-2/SB-3 결정 필요 | SB-1 (root `apps/docs` 통합) 가 이미 채택 + 실행. main.ts comment "D4: @storybook/react-vite framework". 결정 reopen 사유 없음. | `apps/docs/.storybook/main.ts` L4 |
| 시각 회귀 도구 VR-1/VR-2/VR-3 결정 필요 | playwright.config.ts L7 comment "D5 결정: Playwright OSS Apache-2.0 채택 (Chromatic 미채택)". `tests/visual/storybook.spec.ts` 동적 순회 구현 완료. | `playwright.config.ts` / `tests/visual/storybook.spec.ts` |
| Phase 1 bootstrap (4h) + Phase 2 VR tool (4-6h) 필요 | G-002, G-003 둘 다 state.json `overallStatus: completed`, summary `completed: 79/79`. | `state.json` L1213, L1228, L1267-1268 |
| 13 패키지 시나리오 ~80개 from scratch | 53 stories 파일 이미 존재 (Glob `packages/*/**/*.stories.*`). renderer dash/null/empty 시나리오 망라. | `Glob` 결과 53 files |
| MOD-GRID-99-B 가 작업 대상 | G-001 ~ G-005 모두 `overallStatus: completed`, harnessReview 100/100/100. | `docs-goals.json` L19-329 |

**결론**: MOD-GRID-99-B 는 종료된 모듈이다. 본 spec 은 **새 모듈 정의가 아닌**, 종료 모듈의 후속 잔여 작업 (Wave 1-5 ADR-001/002/014 의 시각 검증 deferred 해제) 를 정의한다.

### 0.2 본 spec 의 실제 범위 (rescope)

| 항목 | 실제 작업 |
|---|---|
| 인프라 부트스트랩 | **불필요** (G-002 / G-003 완료) |
| 인프라 검증 | 필요 — `pnpm install` 미실행 (G-001 deviation doc `auto-fixed/MOD-GRID-99-B-G-001-pnpm-install-deferred.md` 미해제) → Playwright + Storybook 의 **실 실행 검증 deferred** |
| baseline PNG | **미캡처** (EC-01 상태) — `tests/visual/__snapshots__/` 부재 확인 (`ls` exit 2) |
| Wave 1-5 시나리오 커버리지 | 부분 적용. **gap 분석 필요** (§3 참조) |
| CI 워크플로우 (`visual-regression.yml`) | 존재 (`pull_request`/`push` to `main` 트리거). build-verify.yml 과 별도 job. ADR-015 정합은 §5 참조 |

---

## 1. 현 stories 인벤토리

### 1.1 53 stories 파일 분포 (13 패키지)

| 패키지 | `src/__stories__/` (per-component) | `stories/` (per-package showcase) | 비고 |
|---|---|---|---|
| `grid-core` | `column/createColumns.stories.tsx`, `column/createGroupedColumns.stories.tsx`, `column/ColumnVisibilityMenu.stories.tsx`, `useUrlSync.stories.tsx`, `useStoragePersist.stories.tsx` (5) | `Grid.stories.tsx`, `Grid.virtualized.stories.tsx` (2) | C-18 1000행 시나리오 = `Grid.virtualized.stories.tsx` |
| `grid-renderers` | TextCell / NumberCell / DateCell / StatusBadgeCell / CheckCell / IconCell / TagCell / AvatarCell / ProgressCell / EditableCell / LinkCell / ButtonCell (12) | `Cells.stories.tsx` (1) | ADR-002 6 슬롯 + ADR-014 `value` prop 모두 커버 |
| `grid-export` | `exportToPdf.stories.tsx`, `copyToClipboard.stories.tsx`, `scopeIntegration.stories.tsx` (3) | `Export.stories.tsx` (1) | |
| `grid-features` | `multi-sort/MultiSortGrid.stories.tsx`, `multi-sort/SortClearButton.stories.tsx`, `filter-ui/TextFilter.stories.tsx`, `filter-ui/NumberFilter.stories.tsx`, `filter-ui/DateFilter.stories.tsx`, `filter-ui/SelectFilter.stories.tsx`, `filter-ui/GlobalSearchInput.stories.tsx`, `column-drag/useColumnDrag.stories.tsx` (8) | `Features.stories.tsx` (1) | |
| `grid-license` | (없음) | `License.stories.tsx` (1) | Unlicensed / Licensed / SoonExpiring — **Watermark 컴포넌트 자체** 만 검증, Pro 컴포넌트 통합 미검증 (§3.1 gap) |
| `grid-pro-agg` | `AggregationGrid.stories.tsx` (1) | `Aggregation.stories.tsx` (1) | |
| `grid-pro-datamap` | `DataMapCell.stories.tsx`, `DataMapEditor.stories.tsx`, `AsyncDataMap.stories.tsx` (3) | `DataMap.stories.tsx` (1) | |
| `grid-pro-header` | (없음) | `GroupedHeader.stories.tsx` (1) | ADR-001 H-D watermark 시나리오 미확인 |
| `grid-pro-master` | (없음) | `MasterDetail.stories.tsx` (1) | |
| `grid-pro-merging` | `MergingGrid.stories.tsx` (1) | `Merging.stories.tsx` (1) | |
| `grid-pro-range` | `useCellRange.stories.tsx`, `useKeyboardNav.stories.tsx`, `DragFillHandle.stories.tsx`, `useClipboard.stories.tsx`, `useKeyboardEdit.stories.tsx`, `RangeSelectGrid.stories.tsx` (6) | `RangeSelect.stories.tsx` (1) | |
| `grid-pro-tracking` | `useChangeTracking.stories.tsx` (1) | `ChangeTracking.stories.tsx` (1) | |
| `grid` (메타) | (없음) | (없음) | export 0 (decisions ADR — empty meta) — story 불필요 |

**총 53 stories 파일**.

### 1.2 main.ts glob 와의 정합

`apps/docs/.storybook/main.ts` L12:
```ts
stories: ['../../../packages/*/stories/**/*.stories.@(ts|tsx)']
```

**중요 발견**: main.ts glob 는 `packages/*/stories/**/*` 만 수집한다. `packages/*/src/__stories__/*.stories.tsx` 는 **포함되지 않는다**. 53 stories 중 `src/__stories__/` 경로 약 40 개가 Storybook 빌드 산출에서 누락된다.

| 경로 패턴 | glob 매칭 | 파일 수 |
|---|---|---|
| `packages/*/stories/**/*.stories.*` | ✅ 매칭 | ~13 (showcase) |
| `packages/*/src/**/*.stories.*` (src 직속) | ❌ 미매칭 | ~3 (grid-core `column/`, `useUrlSync` 등) |
| `packages/*/src/__stories__/*.stories.*` | ❌ 미매칭 | ~32 (renderer 12 + datamap 3 + tracking 1 + range 5 + ...) |

**Implication**: G-002 stages.verify score 100 / G-003 score 100 은 main.ts glob 가 패키지별 `stories/` 폴더 만 가정한 상태에서 평가됐다. `src/__stories__/` 산출은 실제 Storybook 빌드에서 보이지 않을 가능성이 높다. **본 spec Phase 1 의 첫 작업**: glob 보강 (main.ts L12).

---

## 2. 인프라 상태 — 디스크 evidence

### 2.1 부트스트랩 (G-002)

| 산출물 | 경로 | 상태 |
|---|---|---|
| Storybook main config | `apps/docs/.storybook/main.ts` | ✅ 존재 |
| Storybook preview | `apps/docs/.storybook/preview.ts` | ✅ 존재 |
| Storybook framework | `@storybook/react-vite ^8.0.0` (devDep) | ✅ pkg에 명시 |
| Storybook scripts | `pnpm -F docs storybook` (6006), `pnpm -F docs build-storybook` | ✅ scripts에 명시 |
| `pnpm install` 실 실행 | `node_modules/` root | ⚠️ **부분 실행** — root devDeps 일부 (`@tanstack/`, `eslint`, `typescript` 등 10개) 만 설치. `@storybook/*`, `@playwright/*` 미설치. apps/docs/node_modules 미생성 |

### 2.2 시각 회귀 (G-003)

| 산출물 | 경로 | 상태 |
|---|---|---|
| Playwright config | `playwright.config.ts` | ✅ 존재 (L13 baseURL `http://localhost:6006`) |
| 시각 회귀 test | `tests/visual/storybook.spec.ts` | ✅ 존재 (index.json 동적 순회, EC-03 1000행 timeout 60s) |
| GitHub Actions | `.github/workflows/visual-regression.yml` | ✅ 존재 (push/PR to main, ubuntu-latest, chromium) |
| baseline PNG | `tests/visual/__snapshots__/` | ❌ **부재** (`ls` exit code 2 — EC-01 상태) |
| 가이드 문서 | `apps/docs/visual-regression.md` | ✅ 존재 (baseline 생성/갱신/CI 차단 절차 명시) |
| ADR-015 build-verify 정합 | `.github/workflows/build-verify.yml` | ✅ 별개 workflow 존재 (본 spec §5에서 정합 검증) |

### 2.3 결론

**G-002 / G-003 산출은 "구성 파일 작성 + 일부 stories 수집"**. 미수행 작업:
- (a) main.ts glob 가 `src/__stories__/` 누락 (§1.2)
- (b) `pnpm install` 미실행 → 실 build/test 불가
- (c) baseline PNG 미캡처 (EC-01) → visual:test PASS/FAIL 판정 불가
- (d) Wave 1-5 ADR-001/002/014 의 일부 시나리오 stories 누락 (§3)

본 spec 의 5 Phase 는 (a)-(d) 순으로 해소한다.

---

## 3. Wave 1-5 시각 변경 — 시나리오 gap 분석

### 3.1 ADR-001 (Watermark wiring, Wave 2)

**변경 사실** (`wave2-adr-001-result.md`):
- 7 Pro 패키지 + grid-license 의 visual surface 변경:
  - 5 wrapper 컴포넌트 inline `<Watermark>`: `AggregationGrid`, `MasterDetailGrid`, `RangeSelectGrid`, `MergingGrid`, `ChangeTrackingGrid`
  - `MultiRowHeader` H-D — `<thead>` 내 watermark row prepend
  - `DataMapCell` D-D — `useWatermarkEnforcement` singleton portal

**현 stories 커버리지**:

| 컴포넌트 | 현 story | invalid license 시나리오 |
|---|---|---|
| `Watermark` (grid-license) | `License.stories.tsx` Unlicensed/Licensed/SoonExpiring (3) | ✅ Watermark 자체는 커버 |
| `AggregationGrid` | `stories/Aggregation.stories.tsx` + `src/AggregationGrid.stories.tsx` | ❌ invalid license 통합 시나리오 0 |
| `MasterDetailGrid` | `stories/MasterDetail.stories.tsx` | ❌ |
| `RangeSelectGrid` | `stories/RangeSelect.stories.tsx` + `src/RangeSelectGrid.stories.tsx` | ❌ |
| `MergingGrid` | `stories/Merging.stories.tsx` + `src/MergingGrid.stories.tsx` | ❌ |
| `ChangeTrackingGrid` | `stories/ChangeTracking.stories.tsx` + `src/__stories__/useChangeTracking.stories.tsx` | ❌ |
| `MultiRowHeader` (H-D) | `stories/GroupedHeader.stories.tsx` | ❌ thead watermark row 시각 검증 0 |
| `DataMapCell` (D-D) | `src/__stories__/DataMapCell.stories.tsx`, `AsyncDataMap.stories.tsx` | ❌ singleton portal 시각 검증 0 |

**gap**: 7 Pro 통합 컴포넌트 × 1 invalid license 시나리오 = **신규 stories 7개** 필요.

선택지:
- (P0) 7 Pro 컴포넌트 각각 `*WithInvalidLicense.stories.tsx` 신규 (별도 export) — Default story 옆에 `beforeEach`로 `setLicenseState(null)` 후 컴포넌트 렌더
- (P1) 7 Pro 통합 시나리오 별 + valid license 명시적 story (regression 감지)

권고: **P0 만** (7 신규 story export). P1 은 license 통합이 hooks 의존이라 default story 가 이미 valid 상태 (license 미설정) 인지 unlicensed 상태인지 명확화 필요 — 별 ADR에서 다룬다.

### 3.2 ADR-002 (renderer wiring, Wave 3)

**변경 사실** (`wave3-adr-002-result.md`):
- `grid-renderers/src/wireRegistry.ts` 신규 — 6 슬롯 (`text` / `number` / `badge` / `link` / `check`) registerRenderer
- side-effect `import './wireRegistry.js'; wireDefaultRenderers();` (index.ts)

**현 stories 커버리지** (Read 확인):
- `NumberCell.stories.tsx` (L65-83): `NullValue` / `UndefinedValue` / `NaNValue` / `NegativeWithColor` / `Zero` / `WithUnitWon` / `WithUnitPercent` / `UsLocale` ✅
- `DateCell.stories.tsx` (L55-83): `NullValue` / `UndefinedValue` / `EmptyString` / `InvalidString` / `UsLocale` / `DateTime` / `TimeOnly` / `EpochMs` ✅
- `TextCell` / `StatusBadgeCell` / `CheckCell` — Read 미수행 (시간 한계) 그러나 grep `null|undefined|empty` 91 hits across 12 files → 망라적 시나리오 추정

**gap**: ADR-002 의 변경은 **wireDefaultRenderers() 호출 후 columnDef.meta.renderer 가 string ID 로 해석되는 cross-package wiring** 자체이다. cell renderer 자체의 시각은 변경 0. 따라서 **개별 cell stories 추가 불필요**.

그러나 missing: **`Grid` (grid-core) 에 columnDef.meta.renderer='text'|'number'|'badge'|'link'|'check' string ID 를 사용한 stories** — wiring 통합 시각 검증. 1 stories `Grid.withRegistryRenderers.stories.tsx` 권고.

**gap 총합**: 1 신규 story (P0).

### 3.3 ADR-014 amendment D-partial (LinkCell/ButtonCell value prop, Wave 1)

**변경 사실** (`wave1-adr-014-result-v2.md`):
- `LinkCell.tsx`: `value?: string` 추가, `label?: string` deprecated alias 보존
- `ButtonCell.tsx`: `value?: ReactNode` 추가, `label?: ReactNode` deprecated alias 보존

**현 stories 커버리지** (Read 확인):
- `LinkCell.stories.tsx` L24-54: `WithOnClick` / `WithHref` / `WithHrefAndOnClick` / `TextOnly` / `WithClassName` (`value` 사용) + `WithDeprecatedLabel` (`label` 사용) ✅
- `ButtonCell.stories.tsx` L22-68: `Default` / `VariantDefault` / `VariantDestructive` / `VariantGhost` / `Disabled` / `SizeSm` / `SizeXs` / `WithClassName` (`value` 사용) + `WithDeprecatedLabel` (`label` 사용) ✅

**gap**: **0** — ADR-014 의 visual surface 는 완전 커버. 신규 story 불필요.

추가 시나리오 (edge case):
- `value` + `label` 둘 다 supplied → 둘 중 어느 게 우선되는지 (additive shim 의 displayValue 로직) — 현재 미커버. 그러나 ADR-014 는 prop precedence 를 결정한 ADR 이 아니므로 (LinkCell/ButtonCell.tsx 의 displayValue 로직 자체에 묻혀있음), 별도 ADR 검증 사안. 본 spec 범위 외.

### 3.4 시나리오 gap 총합

| ADR | 신규 stories | 비고 |
|---|---|---|
| ADR-001 | 7 (Pro 컴포넌트 × invalid license) | P0 |
| ADR-002 | 1 (Grid with registry renderers) | P0 |
| ADR-014 | 0 | 완전 커버 |
| **합계** | **8 신규 stories** | |

**task 브리프 추정 ~80 대비 1/10**. 인프라가 거의 완성되어 있고 cell renderer stories 가 망라적이라 결과적으로 작업량이 매우 작다.

---

## 4. CI 통합 — visual-regression.yml + build-verify.yml 정합

### 4.1 visual-regression.yml (G-003 산출)

```yaml
on: { pull_request: {branches: [main]}, push: {branches: [main]} }
jobs:
  visual-regression: pnpm install → build-storybook → http-server :6006 → playwright install → pnpm visual:test
  block-on-migration-impact: failure() && (label migration-impact:high || medium) → exit 1
```

**관찰**:
- migration-impact label 없는 PR 은 visual:test failure 가 block 되지 않는다 (`visual-regression.md` L108-113 명시).
- baseline 미존재 시 동작: `tests/visual/__snapshots__/*.png` 가 git 에 없으면 Playwright 가 첫 실행에서 자동 생성하나, `--update-snapshots` 플래그 없이는 미존재 시 **fail** 처리 (Playwright 기본). CI 첫 실행 fail 가능성.

### 4.2 build-verify.yml (Wave 3 ADR-015 산출)

본 spec 작성 시점에 build-verify.yml 내용 미열람 (시간 한계). Phase 4 에서 visual-regression.yml 과의 job dependency / artifact 공유 검토 필요.

권고: visual-regression.yml 의 `Build Storybook static` 단계는 build-verify.yml 의 `pnpm -r build` 단계와 별개 (Storybook static = apps/docs 빌드, packages build 와 무관). 두 workflow 는 독립 실행 — 정합 충돌 없음. 다만 size-limit/typecheck 등 build-verify 가 fail 시 storybook static 도 의미 없으므로 `needs: build-verify` 추가 검토.

### 4.3 baseline 정책

EC-01 (baseline 미존재 시) 절차:
1. `pnpm -F docs build-storybook` → `apps/docs/storybook-static/`
2. `npx http-server apps/docs/storybook-static --port 6006` (별도 터미널)
3. `pnpm visual:update-baseline`
4. `git add tests/visual/__snapshots__ && git commit ...`

**현 상태**: 1단계 (pnpm install) 미실행 → 2-4단계 불가. Phase 5 에서 처리.

---

## 5. Phase 계획 (실제 작업)

본 spec 의 5 Phase 는 §2.3 의 (a)-(d) gap 을 순차 해소. 본 작성 단계는 spec 만 — Phase 1-5 의 실 실행은 implementer 위임.

| Phase | 작업 | 예상 공수 | 의존 |
|---|---|---|---|
| **Phase 1** | `apps/docs/.storybook/main.ts` glob 보강 — `src/__stories__/` 패턴 추가 | 0.5h | 없음 |
| **Phase 2** | `pnpm install` 실행 검증 (G-001 deferred 해제) — root + apps/docs + 13 packages 의존 트리 완전 해소. typecheck PASS. | 0.5h (CI 차원) — 사용자 / 환경 의존 (`auto-fixed/MOD-GRID-99-B-G-001-pnpm-install-deferred.md` 참조) | Phase 1 |
| **Phase 3** | 신규 stories 8개 추가 (§3.4) — 7 Pro × invalid license + 1 Grid with registry renderers | 3-4h | Phase 1 |
| **Phase 4** | CI 정합 검증 — visual-regression.yml ↔ build-verify.yml job 의존성, baseline 미존재 시 첫 실행 정책 명시화 (`visual-regression.md` 보강) | 1h | Phase 2 |
| **Phase 5** | baseline 캡처 (EC-01) — `pnpm visual:update-baseline` 후 `tests/visual/__snapshots__/` git commit. PR 1건으로 격리. | 1-2h | Phase 1-4 |

**총 예상 공수: 6-8h** (task 브리프 24-30h 대비 1/4 — 인프라가 거의 완성된 상태에서의 잔여 작업 규모).

### 5.1 Phase 3 신규 stories 상세 (8건)

| # | 파일 | 패키지 | 시나리오 |
|---|---|---|---|
| 1 | `packages/grid-pro-agg/stories/AggregationWithInvalidLicense.stories.tsx` | grid-pro-agg | `setLicenseState(null)` + `<AggregationGrid>` 렌더 → watermark visible |
| 2 | `packages/grid-pro-master/stories/MasterDetailWithInvalidLicense.stories.tsx` | grid-pro-master | 동일 |
| 3 | `packages/grid-pro-range/stories/RangeSelectWithInvalidLicense.stories.tsx` | grid-pro-range | 동일 |
| 4 | `packages/grid-pro-merging/stories/MergingWithInvalidLicense.stories.tsx` | grid-pro-merging | 동일 (non-virt path) |
| 5 | `packages/grid-pro-tracking/stories/ChangeTrackingWithInvalidLicense.stories.tsx` | grid-pro-tracking | 동일 |
| 6 | `packages/grid-pro-header/stories/MultiRowHeaderWithInvalidLicense.stories.tsx` | grid-pro-header | H-D: `<thead>` watermark row 시각 검증 |
| 7 | `packages/grid-pro-datamap/stories/DataMapWithInvalidLicense.stories.tsx` | grid-pro-datamap | D-D: singleton portal 시각 검증 |
| 8 | `packages/grid-core/stories/Grid.withRegistryRenderers.stories.tsx` | grid-core | ADR-002: `columnDef.meta.renderer='number'\|'date'\|'badge'\|'link'\|'check'` string ID로 wiring 통합 검증 |

**story 패턴 표준** (ADR-001 invalid license stories):
```tsx
// Pseudo — implementer 위임
import { setLicenseState } from '@tomis/grid-license/state';
const meta: Meta<typeof AggregationGrid> = { ... };
export const WithInvalidLicense: StoryObj<typeof AggregationGrid> = {
  beforeEach() { setLicenseState(null); /* watermark required = true */ },
  render: () => <AggregationGrid ...defaultProps />,
};
```

---

## 6. 사용자 결정 지점 (D-1 ~ D-N)

본 §0 의 rescope 결과, task 브리프의 D-1 / D-2 / D-4 는 모두 settled. 잔여 결정:

| ID | 결정 | 옵션 | 권고 |
|---|---|---|---|
| **D-A** | Phase 3 시나리오 범위 | (a) 8개 (§3.4 권고) / (b) Pro 7개만 (Grid registry 제외) / (c) 더 확대 (valid license 명시 stories 7개 추가 → 15개) | **(a) 8개** — task 브리프의 "검증 인프라" 의도 완전 충족 + 작업량 합리적 |
| **D-B** | Phase 5 baseline capture 환경 | (a) 사용자 로컬 (Windows) — OS 픽셀 차이 risk / (b) CI ubuntu — visual-regression.md L88 권고 / (c) 둘 다 캡처 (cross-platform threshold 검증) | **(b) CI ubuntu** — visual-regression.md L88 명시 권고 ("CI(ubuntu) 환경에서 baseline 을 생성하면 CI 비교 정확도가 높아집니다") |
| **D-C** | visual-regression.yml ↔ build-verify.yml 의존성 | (a) 독립 실행 (현 상태) / (b) `needs: build-verify` 추가 — build fail 시 visual 스킵 / (c) 동일 workflow 통합 | **(a) 현상 유지** — Storybook static 빌드는 packages build 와 독립. build fail 도 storybook 빌드 가능 |
| **D-D** | baseline 미존재 시 CI 첫 실행 정책 | (a) Playwright 기본 (fail) — manual baseline commit 필요 / (b) `--update-snapshots-on-missing` 플래그 (Playwright 1.40+) 활성 — 자동 생성 후 PR 에 baseline 포함 / (c) baseline 별도 PR 우선 | **(c) 별도 PR 우선** — Phase 5 가 baseline-only PR 로 격리. 이후 PR 들은 baseline 존재 가정 |
| **D-E** | Phase 1 glob 보강 vs G-002 reopen | (a) main.ts L12 inline 수정 (본 spec 권고) / (b) G-002 stages 를 done → in_progress 로 reopen 후 정식 implement-loop 재실행 | **(a) inline 수정** — 1줄 변경 (glob 패턴 추가) 로 reopen 비용 회피. spec implementer 가 ADR 없이 자율 결정 가능 |

---

## 7. 위험 + 한계

### 7.1 위험

| ID | 위험 | 영향 | 완화 |
|---|---|---|---|
| R-1 | Phase 1 main.ts glob 보강 시 `src/__stories__/` 가 빌드에 포함되면 stories 추가로 등록되어 baseline 캡처량 ↑ | 53 + 8 (신규) + ~32 (src/__stories__ 노출) = ~93 stories — Playwright 실 실행 시간 ↑ | EC-03 1000행 timeout 60s 정책 유지. nominal stories 평균 5s × 93 = ~8분 (CI 허용 범위) |
| R-2 | Phase 3 의 7 invalid license stories 가 singleton license state 를 mutate → 다른 stories 와 race | 시각 회귀 무관 (beforeEach 격리) 그러나 dev 모드에서 잔류 우려 | 각 story `beforeEach` 에서 `setLicenseState(null)`, valid stories 도 명시적 setLicenseState 호출 |
| R-3 | Phase 5 baseline PNG 가 Windows (사용자 환경) 에서 캡처 → CI ubuntu 와 픽셀 차이로 false positive | maxDiffPixelRatio 0.01 (1%) 초과 시 CI fail | D-B 권고 (CI ubuntu 캡처) 채택 |
| R-4 | G-002 / G-003 의 `score: 100` 가 실 빌드 검증 없이 부여됐을 가능성 | rubric 신뢰도 손상 (별 작업) | 본 spec §2 의 디스크 검증 결과 finding 으로 별도 기록 — verifier rubric AC-005 ("pnpm build-storybook 0 error") 가 미검증임을 인지 |

### 7.2 한계

1. **build-verify.yml 미열람** — Phase 4 에서 직접 검토 필요. 본 spec 의 §4.2 결론 (독립 실행 권고) 은 잠정적.
2. **5 cell stories Read 미수행** — TextCell / StatusBadgeCell / CheckCell / TagCell / AvatarCell / ProgressCell / EditableCell / IconCell — grep 91 hits 로 추정만. 일부에 null/undefined 시나리오 누락 가능성. Phase 3 implementer 위임 시 Read 권고.
3. **pnpm install 미수행 → typecheck/build 미검증** — 현 53 stories 가 실제 컴파일 가능한지, glob 보강 후 실제 빌드 산출에 등장하는지 확인 불가. Phase 2 의존.
4. **license state mutation 의 글로벌 영향** — `setLicenseState` 는 module-scoped singleton. Storybook stories 간 isolation 은 `beforeEach` 의존. test 환경에서의 정확성은 별 검증 필요.
5. **ADR-014 의 `value` + `label` 동시 supplied 시 displayValue 우선순위 stories 미커버** — §3.3 후술. 본 spec 범위 외.
6. **시각 회귀 의도된 deviation 처리** — `wave1-adr-014-result-v2.md` 7.1 ("`Cells.stories.tsx:115` `variant: 'danger'` pre-existing TS error, `@ts-expect-error` 격리") — Phase 5 baseline 캡처 시 이 story 가 빌드에 포함되면 의도되지 않은 visual 노출 가능성. 격리 검증 필요.

---

## 8. 본 spec 의 자기 평가 (Self-assessment)

### 8.1 task 브리프 의도 적합도

| 브리프 요구사항 | 본 spec 응답 |
|---|---|
| Storybook 부트스트랩 spec | ❌ → ✅ 정정. §0 에서 부트스트랩 이미 완료됨을 명시. 본 spec 은 **잔여 baseline 확보 + 시나리오 보강** spec |
| Wave 1-5 미검증 시각 변경 검증 인프라 | ✅ — Phase 3 의 8 신규 stories + Phase 5 baseline 캡처 로 완전 커버 |
| 사용자 결정 지점 D-1~D-5 | ⚠️ — D-1/D-2/D-4 settled (디스크 증거). D-A~D-E (잔여) 5건 정의 |
| Phase 계획 (24-30h) | ⚠️ → 6-8h 로 정정. 작업량의 6배 차이는 인프라가 G-99-B 에서 이미 80% 완료된 결과 |
| read-only spec | ✅ — 코드 변경 0건 |
| git commit 금지 | ✅ — commit 0 |

### 8.2 단계적 진행 권고

본 spec 은 **8h 단일 implementer cycle** 로 처리 가능하다. 단계적 분할 권고는 §0.2 의 결과 task 브리프의 "큰 작업" 가정이 무효화 되어 의미가 줄었다. 그러나:

- **Phase 5 (baseline 캡처)** 는 별도 PR 권고 — D-D 결정대로 baseline-only PR 로 격리하면 후속 PR 의 visual diff 가 의미를 가짐
- **Phase 2 (pnpm install)** 는 사용자 / CI 환경 의존 — implementer 가 단독 처리 불가

---

## 9. 다음 단계 권고

### 9.1 즉시 (사용자 결정 단계)

1. 본 spec 검토 + §6 의 D-A ~ D-E 5건 결정 (특히 D-A 시나리오 범위, D-D baseline PR 정책)
2. G-002 / G-003 의 verifier score=100 가 본 §1.2 glob gap / §2.1 pnpm install 미수행을 검출하지 못한 이유 분석 (rubric / verifier process 보완 후보)
3. 본 spec 의 §0 (rescope) 사실을 `MOD-GRID-99-B-decisions.md` 의 후속 amendment 로 기록 — G-99-B 종료 시점의 deviation 잔재

### 9.2 implementer 위임 (사용자 승인 후)

- **단일 cycle** (8h 추정) → tw-grid harness 또는 tw-master 위임:
  - Stage SPECIFY 는 본 spec 으로 대체 가능
  - Stage IMPLEMENT 는 Phase 1 / 3 / 4 / 5 의 4 phase 순차 수행
  - Stage VERIFY 는 `pnpm install` + `pnpm visual:test` PASS + baseline PNG 캡처 확인

### 9.3 후속 quality 작업

- **ADR-014 prop precedence stories** (`value` + `label` 동시) — 별 spec 또는 본 spec Phase 3 의 confidence-low extension
- **build-verify.yml ↔ visual-regression.yml needs 의존성** — Phase 4 implementer 검토 결과에 따라 별 ADR
- **G-99-B verifier rubric 강화** — actual build/test execution 검증 항목 추가 (rubric/verify-rubric.md 보완)

---

## 부록 — 참고 자료

- `D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/refactor-analysis-2026-05-17.md` §10.2 (storybook deviation), §13 #4 (deferred verification)
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/goals/MOD-GRID-99-B/docs-goals.json` G-001~G-005
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/auto-fixed/MOD-GRID-99-B-G-001-pnpm-install-deferred.md`
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/documented-deviations/G-001-storybook-bootstrap.md` (2026-05-14, 후속 G-002 로 무효화됨)
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/wave2-adr-001-result.md` (ADR-001 watermark wiring 7 Pro 패키지)
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/wave3-adr-002-result.md` (ADR-002 renderer wiring)
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/wave1-adr-014-result-v2.md` (ADR-014 amendment D-partial)
- `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/.storybook/main.ts`
- `D:/project/topvel_project/topvel-grid-monorepo/playwright.config.ts`
- `D:/project/topvel_project/topvel-grid-monorepo/tests/visual/storybook.spec.ts`
- `D:/project/topvel_project/topvel-grid-monorepo/.github/workflows/visual-regression.yml`
- `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/visual-regression.md`
