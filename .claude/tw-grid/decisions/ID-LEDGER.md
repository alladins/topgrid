# tw-grid ID Ledger

> ID 재사용 / 결번 / collision 추적. **신규 ADR 또는 constraints 항목 작성 전 본 ledger 조회 의무**.
>
> **범위**: tw-grid harness 한정 — ADR ID (`ADR-MOD-GRID-*`) + Constraint ID (`C-NN`) + Goal ID (`G-NNN` backfill snapshot, Section 7).
> Goal ID (`G-NNN`) 의 **live 권위**는 `.claude/tw-grid/state.json` (`goalsIndex`) — 본 ledger 의 Section 7 은 2026-05-18 B-1 backfill 스냅샷 (lastIssued 기준점 제공, 신규 Goal 작성 시 조회 의무).
>
> **신설 근거**: ADR body reuse 패턴 (MAIL-12 N=1, `memory/feedback-tw-mail-adr-number-collision.md`) + Constraint ID cross-ref dual-meaning 패턴 (C-33 N=1, `constraints/HISTORY.md` L37-43). 두 mechanism 모두 pattern 단계 (N=1) — policy 진입 (N=3) 도달 전 transitional governance.
>
> **유지 의무**: 각 ADR 신설/withdraw/sunset 시 본 ledger 동기 갱신. Coverage Verifier 가 ADR 인용 검증 시 본 ledger 참조.

---

## 1. 정책

### 1.1 신규 ID 작성 전 조회 의무

- **ADR 신설 전**: 본 ledger Section 2 + 해당 decisions.md grep `^## ADR-MOD-GRID-{module}-` 결과 동시 확인. `lastIssued` 다음 번호 + 1 발급.
- **Constraint 신설 전**: 본 ledger Section 3 + `constraints/INDEX.md` + `constraints/HISTORY.md` 동시 확인. **withdrawn / deprecated / ID collision 항목 번호 재사용 절대 금지**.
- **Goal 신설 전**: 본 ledger Section 7 의 해당 모듈 `lastIssued` 확인 → `lastIssued + 1` 발급. withdrawn / skipped 슬롯 재사용 금지. state.json `goalsIndex` 갱신 + 본 ledger Section 7 동기 갱신 의무.

### 1.2 withdrawn / deprecated ID 재사용 금지

- ADR-MOD-GRID-REFACTOR-2026-05-17-017 (withdrawn, 결번 marker) 등 *결번* 상태 ID 는 신규 결정 작성에 재사용 불가. Gap 으로 영구 보존 + audit trail 유지.
- deprecated ADR (예: ADR-MOD-GRID-00-012 transitional inline stub) 은 ID 자체 보존 + Amendment 본문에 sunset 명시. **후속 인용 시 disambiguation 의무** ("ADR-MOD-GRID-00-012 transitional stub" 명칭 사용).

### 1.3 ID collision 발견 시 처리

- **본 ledger 즉시 갱신** — 두 의미를 disambiguation 컬럼에 명시.
- **후속 인용 disambiguation 의무** — ID 단독 인용 금지, "ADR-NNN 의 X 의미" 형식 강제.
- **mechanism 별 N 카운트 독립 유지** (Section 4 참조). cross-harness 적용 의무화는 mechanism 당 N=3 도달 시점.

### 1.4 Cross-harness 권고

본 ledger 패턴은 tw-grid 한정 신설 (2026-05-18). tw-mail / tw-harness 동일 ledger 신설 권고 — 별도 cycle. 현재 단계는 tw-grid pilot.
Goal G-NNN backfill (Section 7) 도 동일 — tw-mail / tw-harness 의 Goal 인벤토리 backfill 도 별도 cycle 권고 (본 cycle 은 tw-grid 한정).

---

## 2. ADR ID — 모듈별 ledger

### 2.1 ADR-MOD-GRID-00-NNN (Governance — Cross-module)

| ID | 상태 | 의미 | 결정일 | 비고 |
|----|------|------|--------|------|
| 001 | accepted | 외부 모노레포 디렉토리 위치 | 2026-05-13 | |
| 002 | accepted | 인프라 Goal의 N/A 다수 처리 정책 | 2026-05-13 | |
| 003 | accepted | 환경 의존 AC의 documented-deviation 처리 | 2026-05-13 | |
| 004 | accepted | peerDependencies 정책 | 2026-05-13 | line 197 (번호 비순서 — line 147 의 ADR-005 보다 후에 작성) |
| 005 | accepted | tsup 빌드 도구 선택 | 2026-05-13 | line 147 |
| 006 | accepted | Changesets + ESLint 도입 | 2026-05-13 | line 358 (비순서) |
| 007 | accepted | size-limit 도구 선택 + 패키지별 한도 | 2026-05-13 | |
| 008 | accepted | peerDependencies 표준 버전 매트릭스 | 2026-05-13 | |
| 009 | accepted | 환경 의존 deferred AC 일괄 검증 게이트 | 2026-05-13 | |
| 010 | accepted | Cross-module bundle estimation policy | 2026-05-14 | 3 profile data points |
| 011 | accepted | 모델 차등 적용 (medium tier) sonnet+opus 매트릭스 | 2026-05-14 | |
| **012** | **accepted (Sunset 완료, 2026-05-17 — Amendment 2)** | Pro 패키지 grid-license — Inline Stub 패턴 카탈로그 | 2026-05-15 | **deprecated** — 후속 인용 시 "ADR-MOD-GRID-00-012 transitional stub" 명칭 사용. C-33 cross-reference 의미 (Pro license stub) 는 collision — Section 3.1 참조. |
| **013** | **accepted** | **ID Ledger Policy (본 ledger 신설 + 재사용 방지 정책)** | **2026-05-18** | **본 ledger 신설 ADR.** Section 5 참조. |
| **014** | **implemented** | **npm scope rename `@tomis` → `@topgrid` + GitHub repo 연결 + 4 MIT metadata** | **2026-05-18** | publish 전 rename (POL-COMPAT §3 면제). 188 monorepo + 2 publish + 5 TOMIS active SSoT 파일. historical context (decisions/findings/artifacts) 보존. |

**lastIssued: 014** (다음 발급 가능 = 015)

### 2.2 ADR-MOD-GRID-01-NNN (Wrapper Builder)

| ID | 상태 | 의미 | 결정일 | 비고 |
|----|------|------|--------|------|
| 001~006 | accepted | (각 의미 — MOD-GRID-01-decisions.md grep 참조) | 2026-05-13~14 | C-29 hits: ADR-004 (1 hit), ADR-005 (2), ADR-006 (3 → policy 진입) |
| **007** | **accepted** | **G-006 — `cellClassName` + `rowClassName` Grid-level callback wiring (ADR-MOD-GRID-05-002 D3 deferred 이행 + `CellClassNameCallback<TData>` canonical 이전)** | **2026-05-18** | canonical-gap-supplementation-spec.md §4.1 |
| **008** | **accepted** | **G-007 — `onCellKeyDown` prop + `GridHandle.startEditing` imperative method (callback-delegating)** | **2026-05-18** | canonical-gap-supplementation-spec.md §4.5 |

**lastIssued: 008** (다음 발급 가능 = 009).

### 2.3 ADR-MOD-GRID-NN (그 외 모듈)

각 `MOD-GRID-NN-decisions.md` 의 `^## ADR-MOD-GRID-NN-NNN` grep 으로 `lastIssued` 계산. 본 ledger 의 갱신 의무는 **2026-05-18 이후 신규 ADR 작성 시점**부터 적용 (기존 인벤토리 backfill 은 별도 cycle).

### 2.4 ADR-MOD-GRID-REFACTOR-2026-05-17-NNN (Refactor Wave)

| ID | 상태 | 의미 | 결정일 | Wave | 비고 |
|----|------|------|--------|------|------|
| 001 | implemented | Pro license Watermark 실 wiring + 런타임 enforcement (7/7 강제 + H-D + D-D) | 2026-05-17 | 2 | |
| 002 | implemented | rendererRegistry cross-package wiring (grid-core ↔ grid-renderers) | 2026-05-17 | 3 | 6 슬롯 wired |
| 003 | implemented | `@topgrid/grid` 메타 패키지 실 export 활성화 | 2026-05-17 | 3 | scope rename ADR-014 (2026-05-18) |
| 004 | implemented (partial → 005-Residual로 완결) | tw-framework-front 5 variant → monorepo legacy alias 교체 | 2026-05-17 | 4 | EditableGrid partial → ADR-019 |
| 005 | implemented | `@topgrid/grid-export` ↔ excelExport.ts 통합 | 2026-05-17 | 5 | scope rename ADR-014 (2026-05-18) |
| 006 | implemented | `TomisColumnDef` 이름 충돌 해소 (grid-pro-datamap rename) | 2026-05-17 | 5 | |
| 007 | implemented | 4종 persistence hook → `grid-core/internal/storage` adapter | 2026-05-17 | 5 | |
| 008 | implemented | tw-framework-front `types/tomis/grid.ts` → grid-core re-export | 2026-05-17 | 5 | |
| 009 | implemented | grid-core ↔ grid-features layering 정리 (역의존 제거) | 2026-05-17 | 5 | |
| 010 | implemented | `SortBadge` 중복 제거 (grid-core/internal 단일화) | 2026-05-17 | 5 | |
| 011 | implemented | `.size-limit.json` ignore 정책 통일 | 2026-05-17 | 1 | |
| 012 | implemented | `DataTable/` 폴더 마이그레이션 계획 ADR | 2026-05-17 | 5 | |
| 013 | implemented | dead public API 정리 (`createTomisColumnHelper` 등) | 2026-05-17 | 3 | |
| 014 | implemented | `as unknown as CellComponent` 14회 정리 | 2026-05-17 | 1 | |
| 015 | implemented | stale build artifact (`verifyLicense` 등) sweep | 2026-05-17 | 1+3 | |
| 016 | implemented | `onRowClick` 시그니처 통일 | 2026-05-17 | 1 | |
| **017** | **withdrawn** | (sub-spec line 738 retraction — ADR-001 흡수) | 2026-05-17 | 5 | **결번 marker** — 재사용 금지. `wave5-adr-017-spec.md` retraction 본문 참조. |
| 018 | implemented (accepted) | registry slot 정책 — icon + 5 extras + alias (ADR-002 분리) | 2026-05-17 | 4 | |
| 019 | implemented (accepted) | tw-framework-front `EditableGrid` 컴포넌트 폐기 (ADR-004 partial 해소) | 2026-05-17 | Residual 1 | |

**lastIssued: 019** (다음 발급 가능 = 020). **결번**: 017.

### 2.5 ADR-MOD-GRID-99-A / 99-B (Infra/Test)

각 `MOD-GRID-99-A-decisions.md` / `MOD-GRID-99-B-decisions.md` grep 으로 별도 갱신.

---

## 3. Constraint ID — C-NN ledger

### 3.1 C-1 ~ C-36 (현재 active)

| ID | 상태 | 의미 | 위치 (constraints 파일) | 비고 |
|----|------|------|------------------------|------|
| C-1 | active | 추측 코딩 금지 | 10-core.md | |
| C-2 | active | TanStack v8 표준 API 사용 (No Custom Fork) | 20-tanstack.md | |
| C-3 | active | 더미/Mock 데이터 금지 | 10-core.md → `_shared/` | |
| C-4 | active | TypeScript Strict (No `any`) | 10-core.md → `_shared/` | |
| C-5 | active | CSS 신규 파일 금지 (Tailwind Only) | 10-core.md | |
| C-6 | active | 호환성 절대 (Backward Compatibility) | 30-compat.md → POL-COMPAT | |
| C-7 | active | AG Grid 신규 도입 금지 | 20-tanstack.md → POL-TANSTACK | |
| C-8 | active | 사용처 마이그레이션 점진 (대량 일괄 금지) | 50-migration-stage.md → POL-MIG-STAGE | |
| C-9 | active | 외부 라이브러리 추가 시 ADR 의무 | 60-doc-license.md → POL-DOC-LIC | |
| C-10 | active | 가상화 호환성 | 40-bundle.md → POL-BUNDLE | |
| C-11 | active | Coverage Verifier 독립성 | 10-core.md → `_shared/` | |
| C-12 | active | 빌드 0 errors 필수 | 10-core.md → `_shared/` | |
| C-13 | active | 시각 회귀 검증 | 50-migration-stage.md → POL-MIG-STAGE | |
| C-14 | active | ADR 의무 기록 | 60-doc-license.md → POL-DOC-LIC | |
| C-15 | active | 모든 Stage 작업은 Agent 위임 의무 | 10-core.md → `_shared/` | |
| C-16 | active | Wijmo 비도입 의무 | 20-tanstack.md → POL-TANSTACK | |
| C-17 | active | 시각 회귀 검증 의무 (Visual Regression Required) | 50-migration-stage.md → POL-MIG-STAGE | |
| C-18 | active | 가상화 호환성 강제 | 40-bundle.md → POL-BUNDLE | |
| C-19 | active | 사용처 마이그레이션 점진 (Incremental Usage Migration) | 50-migration-stage.md → POL-MIG-STAGE | |
| C-20 | active | 외부 라이브러리 추가 ADR 의무 | 60-doc-license.md → POL-DOC-LIC | |
| C-21 | active | 번들 크기 한계 | 40-bundle.md → POL-BUNDLE | |
| C-22 | active | peerDependencies 정책 | 30-compat.md → POL-COMPAT | |
| C-23 | active | API 안정성 — semver 준수 | 30-compat.md → POL-COMPAT | |
| C-24 | active | 라이선스 명시 의무 (License Disclosure) | 60-doc-license.md → POL-DOC-LIC | |
| C-25 | active | Public API 문서화 의무 | 60-doc-license.md → POL-DOC-LIC | |
| C-26 | active | Coverage Verifier 산식 자기-검증 의무 | 70-spec-discipline.md → POL-SPEC-DISC §2 | |
| C-27 | active | Spec 권위 — 메인 prompt-spec drift 보고 의무 | 70-spec-discipline.md → POL-SPEC-DISC §1 | |
| C-28 | active | goals.json implementFiles 경로 prefix 정합성 | 70-spec-discipline.md → POL-SPEC-DISC §3 | |
| C-29 | active | `exactOptionalPropertyTypes` 환경 optional prop forwarding 패턴 | 80-code-patterns.md | |
| C-30 | active | Spec Truth Table Discipline | 70-spec-discipline.md | |
| C-31 | active | Functional Wiring Audit — 유틸 생성 후 호출처 검증 | 80-code-patterns.md | |
| C-32 | active | Pure Helpers + React Shell 분리 (Pro 패키지 hook 권장) | 80-code-patterns.md | |
| **C-33** | **ID collision** | **(a) [deprecated] Pro 패키지 license stub 정책** — ADR-MOD-GRID-00-012 본문 line 637/650/676/692/701/706/707/712 cross-reference. 정식 constraints.md entry 부재 (HISTORY.md L37-43 참조). Amendment 2 (2026-05-17) 로 stub 패턴 sunset → **후속 인용 금지**. **(b) [active] Main Prompt Code Block Subordination** — 70-spec-discipline.md L37 + POL-SPEC-DISC §1.1. Spec 권위 정책. | (a) ADR-MOD-GRID-00-012 본문 / (b) 70-spec-discipline.md L37 | **ID collision — disambiguation 의무**. 후속 인용 시 "C-33 (Main Prompt Code Block Subordination)" 또는 "C-33 (ADR-00-012 transitional stub, deprecated)" 형식 강제. |
| C-34 | active | 워크트리 경계 vs 사용처 마이그레이션 — PowerShell-via-Bash 우회 의무 | 90-environment.md | |
| C-35 | active | Spec Writer Self-Check — Same-Function Signature + Import Consistency | 70-spec-discipline.md → POL-SPEC-DISC §4 | |
| C-36 | active | Implementer Score JSON 작성 금지 | 70-spec-discipline.md → POL-SPEC-DISC §5 + SHARED-AGENT §2.1 | |

**lastIssued: C-36** (다음 발급 가능 = C-37).

### 3.2 Constraint ID 패턴 카운트

- **ID collision (cross-reference dual meaning)**: N=1 (C-33). policy 진입 (N=3) 도달 전 — pattern 단계.
- **Withdrawn / deprecated**: N=0 (active 36건 모두 유지). C-33 (a) 의미는 deprecated 이나 (b) 의미가 active 이므로 ID 자체는 withdrawn 아님.

---

## 4. Mechanism별 N 카운트 (Promotion 추적)

> 패턴 → 정책 promotion 은 mechanism 별 N=3 도달 시점. **mechanism 통합 카운트 금지** (advisor 권고 2026-05-18).

| Mechanism | 정의 | 현재 N | 사례 | 상태 |
|-----------|------|--------|------|------|
| **M-1: ADR body reuse (cross-session race/wipe)** | 같은 decisions.md 안에서 cross-session wipe 또는 turn race 로 같은 ADR-NN-NNN 번호가 두 결정에 발급됨 | **1** | MAIL-12: ADR-035~039 (2026-05-16 G-008 → wipe → G-007 035/036 재발급) | pattern (anecdote+1) — policy 진입 (N=3) 도달 전 |
| **M-2: Constraint ID cross-reference dual-meaning** | ADR 본문이 인용한 constraint ID 가 정식 constraints.md 에 등록되지 않은 상태에서, 별도 contraint 가 같은 ID 를 점유 | **1** | tw-grid: C-33 — (a) ADR-MOD-GRID-00-012 cross-ref vs (b) 70-spec-discipline.md L37 | pattern (anecdote+1) — policy 진입 (N=3) 도달 전 |
| **M-3: ADR withdrawn marker (normal lifecycle)** | ADR 번호 슬롯이 신설 검토 후 결번 처리 (실제 collision 아님, audit trail) | (lifecycle 정상) | tw-grid: ADR-MOD-GRID-REFACTOR-2026-05-17-017 | **collision 분류 외** — 정상 lifecycle, ledger 추적만 수행 |
| **M-4: ADR 신규 (정상 발급)** | 신규 결정 정상 ADR 발급 | (lifecycle 정상) | 모든 accepted ADR | **collision 분류 외** — ledger 의 status 추적만 수행 |

**Promotion 규칙**: M-1, M-2 각각 N=3 도달 시 cross-harness (tw-mail/tw-harness) 의무 적용. M-3, M-4 는 normal lifecycle — promotion 대상 아님.

---

## 5. 본 Ledger 신설 ADR

- **ADR-MOD-GRID-00-013**: ID Ledger Policy — 본 ledger 신설 + 재사용 방지 정책.
- 위치: `.claude/tw-grid/decisions/MOD-GRID-00-decisions.md` (governance lane — ADR-00-012 cross-module catalog 와 동일 패턴).

---

## 6. 부록 — 작성 의무 매트릭스

| Agent | 의무 |
|-------|------|
| Spec Writer (모든 stage) | ADR 신설/인용 시 본 ledger Section 2 + 3 조회 의무. ID collision 발견 시 본 ledger 갱신 + disambiguation. 신규 Goal 신설 시 본 ledger Section 7 의 `lastIssued` 조회 → `lastIssued + 1` 발급 + state.json + 본 ledger 동기 갱신. |
| Implementer | ADR 인용 시 본 ledger 의 `상태` 컬럼 확인 — withdrawn/deprecated 인용 금지. |
| Coverage Verifier | ADR 인용 검증 시 본 ledger 의 `상태` + `의미` 컬럼 cross-check. ID collision (M-2) 사례 발견 시 본 ledger 신규 entry 추가 권고. |
| Self-Review | 모듈 종료 시 본 ledger 와 모듈 decisions.md `^## ADR-` 인벤토리 sync 확인. Section 7 `lastIssued` 가 state.json 과 일치하는지 확인. |

---

## 7. Goal G-NNN Inventory (B-1 backfill, 2026-05-18)

> **스냅샷 권위**: state.json `goalsIndex` 가 live 권위. 본 Section 은 2026-05-18 B-1 backfill 스냅샷 — 신규 Goal 작성 전 `lastIssued` 조회 기준점.
>
> **상태 분포**: 전 79 Goal 완료(completed). withdrawn / skipped 결번 = 0건.
>
> **신규 Goal 정책**: (1) 본 Section 의 해당 모듈 `lastIssued` 확인 → `lastIssued + 1` 발급. (2) withdrawn / skipped 슬롯 재사용 절대 금지. (3) state.json `goalsIndex` 갱신 + 본 Section `lastIssued` 동기 갱신 의무.

### MOD-GRID-00 (모노레포 스캐폴딩)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | pnpm workspace + 13 패키지 + apps/docs 스캐폴딩 | P0 |
| G-002 | tsup + TypeScript strict + 공유 tsconfig.base.json (CJS+ESM dual) | P0 |
| G-003 | peerDependencies 정책 + size-limit 패키지별 한도 | P0 |
| G-004 | Changesets + ESLint flat config + tw-framework-front workspace alias | P0 |

**lastIssued: G-004**

---

### MOD-GRID-01 (공통 wrapper — grid-core)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | `<Grid data columns>` 단일 API + enable* 토글 | P0 |
| G-002 | Sticky header + sticky pinned columns + columnResizing | P0 |
| G-003 | Loading skeleton + empty state + autoSelectFirstRow + onRowClick 계열 | P0 |
| G-004 | Imperative API ref (addRow/deleteRow/scrollTo/getSelection/refresh) + react-virtual | P0 |
| G-005 | BaseGridProps 호환 alias 5종 | P0 |
| **G-006** | **`cellClassName` + `rowClassName` Grid-level callback wiring (ADR-007)** | **P0** |
| **G-007** | **`onCellKeyDown` prop + `GridHandle.startEditing` imperative method (ADR-008)** | **P0** |

**lastIssued: G-007**

---

### MOD-GRID-02 (useGridState)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | useGridState() — 8개 state 통합 반환 | P0 |
| G-002 | initialState prop + controlled mode | P0 |
| G-003 | onStateChange unified callback + debounce | P1 |
| G-004 | resetState() / resetSection(key) helper | P0 |
| G-005 | URL 동기화 helper (옵션) | P2 |
| G-006 | localStorage 영속화 helper (옵션) | P2 |

**lastIssued: G-006**

---

### MOD-GRID-03 (페이지네이션)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | client + server 통합 pagination prop | P0 |
| G-002 | 페이지 크기 변경 UI + pageSizeOptions + showTotalCount | P0 |
| G-003 | 페이지 이동 컨트롤 + DataTablePagination 호환 alias | P1 |

**lastIssued: G-003**

---

### MOD-GRID-04 (컬럼 팩토리)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | createColumns<TData>() + type 자동 renderer 분기 + 표준 columnDef 옵션 | P0 |
| G-002 | createGroupedColumns() 그룹 헤더 helper | P1 |
| G-003 | 컬럼 가시성 + 순서 영속화 (MOD-GRID-02 통합) | P1 |

**lastIssued: G-003**

---

### MOD-GRID-05 (셀 렌더러)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | 기본 3종 표준화: TextCell + NumberCell + DateCell | P0 |
| G-002 | UI 3종 표준화: StatusBadgeCell + LinkCell + ButtonCell + 신규 3종 | P0 |
| G-003 | EditableCell (인라인 편집) + cellClassName + renderer registry | P0 |
| G-004 | EditableCellProps 3 prop 추가: maxLength + align + stopPropagationOnKeyDown (ADR-003) | P0 |
| **G-005** | **EditableCell initialDraft prop — keystroke-triggered editing 첫 char 복원 (ADR-004)** | **P2** |

**lastIssued: G-005**

---

### MOD-GRID-06 (Export)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | Excel(.xlsx) export — exportToExcel + 한국어 + 다중행 헤더 + DataTable alias | P0 |
| G-002 | CSV export — exportToCSV | P0 |
| G-003 | PDF export — exportToPdf + jspdf + jspdf-autotable peer | P1 |
| G-004 | 클립보드 복사 + 인쇄 (copyToClipboard / printGrid) | P1 |
| G-005 | 컬럼 필터/정렬 상태 반영 + 선택 행만 export | P1 |

**lastIssued: G-005**

---

### MOD-GRID-07 (컬럼 드래그 재정렬)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | HTML5 drag-and-drop 컬럼 순서 변경 + 시각 인디케이터 + pinned 가드 + onColumnOrderChange | P0 |
| G-002 | 컬럼 순서 영속화 (useGridState 통합) + 키보드 단축키 | P1 |

**lastIssued: G-002**

---

### MOD-GRID-08 (다중 정렬)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | Shift+Click 다중 정렬 + 우선순위 배지 + Ctrl+Click 정렬 제거 | P0 |
| G-002 | maxMultiSortColCount 제한 + 정렬 전체 초기화 버튼 | P1 |

**lastIssued: G-002**

---

### MOD-GRID-09 (Filter UI)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | TextFilter — Popover + contains/equals/startsWith + 필터 인디케이터 | P0 |
| G-002 | NumberFilter — 연산자(=, !=, >, <, between) + range 입력 | P0 |
| G-003 | DateFilter — range picker + date-fns 연산 | P0 |
| G-004 | SelectFilter (다중선택 체크박스) + GlobalSearch + 필터 전체 초기화 | P1 |

**lastIssued: G-004**

---

### MOD-GRID-10 (ChangeTracking)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | trackChanges API 설계 — useChangeTracking props/return 타입 | P0 |
| G-002 | added/edited/deleted 배열 분리 + 원본 보존 | P0 |
| G-003 | buildChangeSet() — Mapping + Validator 통합 | P0 |
| G-004 | 변경 셀/행 시각 표시 + 행 단위 undo | P1 |
| G-005 | useChangeTracking 완전 통합 — save/commit + ChangeTrackingGrid alias | P0 |

**lastIssued: G-005**

---

### MOD-GRID-11 (Cell Range)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | CellRange 모델 + 마우스 드래그 범위 선택 + Shift+Click 확장 | P0 |
| G-002 | 키보드 범위 확장 — Shift+방향키, 키보드 내비게이션 | P0 |
| G-003 | Drag-fill — 우하단 핸들 드래그 Excel 스타일 패턴 채우기 | P0 |
| G-004 | 복사/붙여넣기 — Ctrl+C TSV + Ctrl+V TSV 파싱 | P0 |
| G-005 | Delete 키 범위 삭제 + F2/Enter 셀 편집 시작 + 범위 일괄 입력 | P1 |
| G-006 | RangeSelectGrid 완전 통합 alias + Pro 라이선스 + 가상화 호환 | P0 |

**lastIssued: G-006**

---

### MOD-GRID-12 (DataMap)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | DataMap API 설계 — createDataMap + column-level dataMap prop | P0 |
| G-002 | 표시 셀 코드→레이블 변환 렌더러 + 행 단위 동적 DataMap | P0 |
| G-003 | 편집 셀 드롭다운 자동 생성 — DataMapEditor | P0 |
| G-004 | 동적 옵션 비동기 로드 + 캐싱 + Pro 라이선스 완전 통합 | P1 |

**lastIssued: G-004**

---

### MOD-GRID-13 (Cell Merging)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | column.mergeRows prop API + rowSpan 자동 계산 렌더러 | P0 |
| G-002 | 복수 컬럼 계층 병합 (hierarchical merge) | P1 |
| G-003 | 정렬/필터 변경 시 병합 자동 재계산 + 가상화 호환 | P0 |

**lastIssued: G-003**

---

### MOD-GRID-14 (Multi-row Header)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | createColumnGroup helper + 다단 헤더 자동 렌더링 | P0 |
| G-002 | 그룹 헤더 sticky + colSpan + frozenColumns 통합 | P0 |
| G-003 | 그룹 헤더 자식 컬럼 visibility 일괄 토글 + GroupedHeaderGrid alias | P1 |

**lastIssued: G-003**

---

### MOD-GRID-15 (Aggregation)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | TanStack groupedRowModel + 내장 aggregationFn 5종 | P0 |
| G-002 | 그룹 footer 행 렌더링 + expand/collapse | P0 |
| G-003 | 사용자 정의 aggregator 함수 등록 | P1 |
| G-004 | Group panel UI (drag column → group) + 그룹 단위 정렬 | P1 |

**lastIssued: G-004**

---

### MOD-GRID-16 (Master-Detail / Context Menu)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | Master-Detail — renderDetailRow + 동적 자식 그리드 | P0 |
| G-002 | 우클릭 Context Menu — 커스텀 메뉴 항목 + 키보드 단축키 | P0 |
| G-003 | 행 확장 상태 영속화 + 키보드 접근성 + TreeGrid/ColumnPinGrid alias | P1 |

**lastIssued: G-003**

---

### MOD-GRID-17 (사용처 마이그레이션 — 27 페이지)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | account/Slip* 5 페이지 마이그레이션 | P0 |
| G-002 | account/Expense*+Vat* 5 페이지 마이그레이션 | P0 |
| G-003 | account/Cash*+기타 5 페이지 마이그레이션 | P0 |
| G-004 | account 잔여 4 페이지 마이그레이션 | P0 |
| G-005 | hr 4 페이지 + finance 1 페이지 마이그레이션 | P0 |
| G-006 | payroll 3 페이지 + admin 2 페이지 마이그레이션 | P0 |

**lastIssued: G-006**

---

### MOD-GRID-99-A (Pro 라이선스 런타임)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | setLicenseKey global API + key 알고리즘 결정 ADR | P0 |
| G-002 | Pro 패키지 import 시 자동 검증 + 워터마크 + expiry 60일 경고 | P0 |
| G-003 | 각 grid-pro-* 패키지에 EULA.md + license 필드 + 자동 require 통합 | P0 |

**lastIssued: G-003**

---

### MOD-GRID-99-B (문서 + 데모)

| Goal ID | title (요약) | priority |
|---------|-------------|---------|
| G-001 | Docusaurus(또는 Nextra) 사이트 + TypeDoc API reference 자동 생성 | P0 |
| G-002 | Storybook (모든 패키지) — story 최소 1개/컴포넌트 + 대용량 시나리오 | P0 |
| G-003 | Chromatic 또는 Playwright 시각 회귀 자동화 | P0 |
| G-004 | 마이그레이션 가이드 + Live demo (CodeSandbox/StackBlitz) | P0 |
| G-005 | 각 패키지 README.md + 한국어/영어 docs | P0 |

**lastIssued: G-005**

---

**총 82 Goal (2026-05-18 MOD-GRID-01 G-006+G-007 + MOD-GRID-05 G-004 추가 시 82; G-005 추가 → 83). 전 모듈 전 Goal completed. 결번/withdrawn = 0건.**

| 모듈 | Goal 수 | lastIssued | area |
|------|---------|-----------|------|
| MOD-GRID-00 | 4 | G-004 | monorepo |
| MOD-GRID-01 | 7 | G-007 | wrapper |
| MOD-GRID-02 | 6 | G-006 | state |
| MOD-GRID-03 | 3 | G-003 | pagination |
| MOD-GRID-04 | 3 | G-003 | column |
| MOD-GRID-05 | 5 | G-005 | renderer |
| MOD-GRID-06 | 5 | G-005 | export |
| MOD-GRID-07 | 2 | G-002 | column-drag |
| MOD-GRID-08 | 2 | G-002 | multi-sort |
| MOD-GRID-09 | 4 | G-004 | filter-ui |
| MOD-GRID-10 | 5 | G-005 | tracking |
| MOD-GRID-11 | 6 | G-006 | range |
| MOD-GRID-12 | 4 | G-004 | datamap |
| MOD-GRID-13 | 3 | G-003 | merging |
| MOD-GRID-14 | 3 | G-003 | header |
| MOD-GRID-15 | 4 | G-004 | aggregation |
| MOD-GRID-16 | 3 | G-003 | enhancement |
| MOD-GRID-17 | 6 | G-006 | migration |
| MOD-GRID-99-A | 3 | G-003 | license |
| MOD-GRID-99-B | 5 | G-005 | docs |
| **합계** | **81+** | | (MOD-GRID-05 G-004 신설 시 +1 → 82) |

---

## 8. 참조

- `memory/feedback-tw-mail-adr-number-collision.md` — M-1 mechanism 원 사례 (MAIL-12 N=1).
- `memory/feedback-tw-grid-id-collision-pattern.md` — M-2 mechanism 사례 (C-33 N=1, 본 ledger 신설 cycle 신규).
- `.claude/tw-grid/constraints/HISTORY.md` L37-43 — C-33 ID collision 발견 절.
- `.claude/tw-grid/decisions/MOD-GRID-00-decisions.md` ADR-013 — 본 ledger 신설 ADR.
- `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` ADR-017 — 결번 marker 사례.
- `.claude/tw-grid/state.json` `goalsIndex` — Goal G-NNN live 권위 (본 Section 7 은 2026-05-18 스냅샷).
