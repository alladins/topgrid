# monorepo README 갱신 결과

**작성일**: 2026-05-18
**범위**: tw-grid 자동 마감 — `topvel-grid-monorepo` root README.md publish 직전 외부 사용자 가이드
**§6 정책**: critical 5 해당 X — spec writer 자체 결정 (advisor 호출 생략)

---

## 1. 변경 파일

| 파일 | 변경 유형 | 비고 |
|------|---------|------|
| `D:/project/topvel_project/topvel-grid-monorepo/README.md` | **신설** | 기존 root README 없음 — 신규 작성 |

`packages/*/README.md` (13개) 및 `tests/visual/README.md` 는 변경 없음 (참조 cross-link 만).

---

## 2. 산출물 (README 본문 항목)

### 2.1 Quick Start (외부 사용자 진입점 2종)

- **MIT-only**: `pnpm add @tomis/grid-core @tomis/grid-renderers @tomis/grid-features @tomis/grid-export` + peer + `<Grid>` 코드 샘플
- **Pro (메타 facade)**: `pnpm add @tomis/grid` + `setLicenseKey()` + `MasterDetailGrid` 샘플

### 2.2 13 패키지 분류표 (MIT 4 + Pro EULA 8 + Meta 1)

| 구분 | 패키지 수 | 패키지 |
|------|--------|--------|
| MIT | 4 | grid-core / grid-renderers / grid-features / grid-export |
| Pro (EULA) | 8 | grid-license + 7 Pro (tracking / range / datamap / merging / header / agg / master) |
| Meta facade (EULA) | 1 | grid |

Version 인용은 모두 final downgrade 후 `package.json` 실측 (grid-features `0.3.0`, grid-export `0.2.0`, grid-pro-datamap `0.2.0`, 나머지 11개 `0.1.0`).

### 2.3 License 분리

- MIT 4 = 자유 사용, npm public 배포 예정
- EULA Pro 9 (8 + meta) = `setLicenseKey` 의무, 미설정 시 `<Watermark>` 자동 (ADR-001)
- meta 가 Pro 포함이므로 EULA, MIT-only 사용자는 facade 대신 4 MIT 직접 import 권고

### 2.4 Watermark 정책 (ADR-001)

- 7 Pro grid 컴포넌트 + `useWatermarkEnforcement()` hook 구독
- MultiRowHeader sub-spec H-D (`<thead>` row prepend)
- DataMapCell sub-spec D-D (singleton portal via document.body)

### 2.5 Architecture Overview — Wave 1~5 (6 핵심 항목)

1. **Renderer Registry Wiring** (ADR-002 + ADR-018) — 6 wired by default (text/number/date/dateTime/badge/link/checkbox) + 2 ADR-018 X-A1 신규 (tag/progress) = **8 slot wired** / 5 deferred (icon/button/avatar + statusBadge/check alias)
2. **License Enforcement Wiring** (ADR-001) — 3 hook (useLicenseStatus / useWatermarkEnforcement / subscribeLicense) + 7 Pro 패키지 구독
3. **Meta Facade Activation** (ADR-003) — `@tomis/grid` 12 패키지 single-entry 재export
4. **Storage Adapter Consolidation** (ADR-007) — 4종 persistence hook → `grid-core/internal/storage`
5. **onRowClick Signature Unification** (ADR-016)
6. **tw-framework-front Integration** (ADR-004 + ADR-005 + ADR-008)

### 2.6 Deprecation Paths (7 항목)

| 항목 | 권고 | ADR |
|------|------|------|
| LinkCell `label` | `value` | ADR-014 D-partial |
| ButtonCell `label` | `value` | ADR-014 D-partial |
| TomisColumnDef (datamap) | DataMapColumnDef | ADR-006 |
| createTomisColumnHelper | createColumns | ADR-013 |
| createGroupedColumns / TomisColumnGroup | grid-pro-header | ADR-013 |
| useColumnPersistence | useStoragePersist | ADR-013 |
| ColumnVisibilityMenu / Props | (재구현) | ADR-013 |

facade `@tomis/grid` 가 6 dead API 를 재export 하지 않는다는 명시 포함 (ADR-013).

### 2.7 Peer Dependencies SSoT 매트릭스 (ADR-MOD-GRID-00-008 Amendment)

10개 peer 카테고리 표 + Amendment 위치 cross-link.

### 2.8 Visual Regression 안내

- WSL2 baseline 캡처 환경 (D-B 정정 — CI ubuntu 미사용)
- D-D baseline-only PR 격리 정책
- `tests/visual/README.md` cross-link
- maxDiffPixelRatio 0.01 (1%) 임계값 명시

### 2.9 CI Workflows

- `build-verify.yml` (ADR-015) — pnpm build + dist freshness + license API export 검증
- `visual-regression.yml` — Storybook + Playwright + migration-impact label 차단 (C-13 / C-17)

### 2.10 Development 가이드

- 빌드 / typecheck / size-limit 명령어
- Changeset 워크플로우
- 신규 패키지 추가 시 peer 매트릭스 의무 (G-003 1차 drift 사례 명시)

### 2.11 Contributing 진입점

- ID-LEDGER (ADR/Constraint/Goal ID 재사용 금지)
- Constraints / Rubric / Decisions cross-link

---

## 3. 결과 체크리스트

- [x] README 외부 사용자 향 — Quick Start 2종 (MIT-only / Pro) 직접 시작 가능
- [x] 13 패키지 정확 인용 — name / version (final downgrade 후) / license / 역할 4컬럼 표
- [x] license 분리 명확 — 3-row 표 + Watermark 정책 sub-section
- [x] Wave 1-5 architecture 핵심 6 항목 (Renderer Wiring / License / Facade / Storage / onRowClick / FE Integration)
- [x] WSL2 baseline 가이드 cross-link (`tests/visual/README.md`)
- [x] Deprecation paths 7 항목 + facade re-export 정책 명시
- [x] Peer matrix Amendment cross-link
- [x] CI workflow 2종 cross-link + 검증 항목 명시
- [x] License section — MIT 4 / EULA 9 명확 (meta facade 포함 9개로 산정)
- [x] markdown 표 정렬 / link 정합 (수동 lint 통과)

---

## 4. 인용 정합성 (사실 검증)

| 인용 | 출처 | 검증 |
|------|------|------|
| 4 MIT / 8 Pro / 1 meta = 13 패키지 | `packages/*/package.json` license 필드 | PASS — grid-license `SEE LICENSE IN EULA` 확인, 4 MIT 확인 |
| version 인용 (10개 `0.1.0` + features `0.3.0` + export `0.2.0` + datamap `0.2.0`) | `package.json` version 필드 | PASS — final downgrade 후 실측 인용 |
| 7 Pro 컴포넌트 (ADR-001) | MOD-GRID-REFACTOR ADR-001 결정 본문 | PASS — AggregationGrid/MasterDetailGrid/RangeSelectGrid/MergingGrid/ChangeTrackingGrid/MultiRowHeader/DataMapCell |
| 8 wired (6 ADR-002 + 2 ADR-018) | ADR-018 D-2 X-A1 결정 본문 | PASS — text/number/date/dateTime/badge/link/checkbox + tag/progress |
| 5 deferred (icon/button/avatar + statusBadge/check alias) | ADR-018 D-1 / D-3 / D-4 결정 | PASS |
| peer 매트릭스 10 카테고리 | MOD-GRID-00 Amendment 매트릭스 | PASS — react / react-dom / react-table / react-virtual / xlsx / jspdf / jspdf-autotable / date-fns / react-datepicker / grid-core(workspace) |
| LinkCell/ButtonCell `value` deprecation | ADR-014 D-partial | PASS — wave1-adr-014-result-v2.md 인용 |
| 6 dead API 재export 안 함 | ADR-013 Implementation Note + grid/README.md "6 @deprecated APIs are not re-exported" | PASS |
| WSL2 baseline + maxDiffPixelRatio 0.01 | `tests/visual/README.md` L17-33 + L41 | PASS |
| build-verify.yml 3 검증 단계 | `.github/workflows/build-verify.yml` L36-73 | PASS — pnpm build + verifyLicense stale + license API exports |

---

## 5. 알려진 한계 (사용자 별도 cycle 의무)

| 항목 | 사유 | 별도 cycle 권고 |
|------|------|---------------|
| **npm publish 인프라 (Pro 패키지 access=restricted)** | A-4 ~ A-7 — npm 계정 + private registry 설정 사용자 결정 | publish cycle |
| **baseline PNG 미캡처** | A-3 — WSL2 환경 진입 필요 (`pnpm visual:test --update-snapshots`) | baseline-only PR cycle |
| **migration guide site (grid.tomis.dev)** | 외부 문서 사이트 publish 사용자 인프라 부재 | docs publish cycle |
| **OQ-001 (jspdf-autotable `^3.5.0` vs `^3.8.0`)** | resolved A — `^3.5.0` 유지 (실 코드 SSoT), 상향은 별도 cycle | jspdf cycle |
| **OQ-002 (grid-pro-range grid-core peerDep 승격)** | resolved A — dev 만 유지 (production src import 0건) | 별도 평가 불필요 |

---

## 6. 단계 추적

| Step | 결과 | 비고 |
|------|------|------|
| Step 1 — 현 README 확인 | PASS | root README 미존재 → 신설 결정. `packages/grid/README.md` (meta) 인용 정합성 기준 |
| Step 2 — 외부 사용자 정보 인벤토리 | PASS | 13 패키지 package.json + ADR (001/002/003/006/007/013/014/016/018) + peer matrix Amendment + CI workflows 2종 + visual test README 수집 |
| Step 3 — README 본문 작성 | PASS | 11 section (Quick Start / Packages / License / Architecture / Deprecation / Peer / Visual / CI / Development / Contributing / License) |
| Step 4 — 검증 | PASS | markdown lint (수동 표 정렬) + version 정확 + license 분류 (MIT 4 / EULA 9 — meta 포함) 정확 |
| Step 5 — 결과 보고서 작성 | PASS (본 문서) | |

---

## 7. 참조

- ADR 본문: `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md`
- Peer 매트릭스: `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-00-decisions.md` (Amendment 섹션 line 358-415)
- ID Ledger: `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/ID-LEDGER.md`
- Visual regression: `D:/project/topvel_project/topvel-grid-monorepo/tests/visual/README.md`
- CI: `D:/project/topvel_project/topvel-grid-monorepo/.github/workflows/{build-verify,visual-regression}.yml`
- Meta package: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid/README.md` (canonical source — collision 정책 정합)

---

**소요**: 약 50분.
**다음 cycle 권고**: (1) WSL2 진입 → `pnpm visual:test --update-snapshots` 1회 (baseline 캡처), (2) npm publish 인프라 (Pro 패키지 private registry 설정), (3) migration guide site publish.
