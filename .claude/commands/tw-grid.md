# tw-grid — TanStack 기반 그리드 추상화 + 상용 제품화 하네스 v1.1

> **호출**: `/tw-grid [옵션]`
> **목적**: tw-framework-front 의 TanStack Table 그리드 8 variant 를 통합 추상화하고, Wijmo FlexGrid 수준의 고급 기능(ChangeTracking, Cell Range, DataMap, Cell Merging, Multi-row Header, Aggregation)을 MIT 라이선스로 구현. 동시에 `@topvel/grid` 별도 npm 패키지로 **상용 제품화(Pro 라이선스)** 까지 고려한 모노레포 운영.
> **차별점 (vs tw-harness / vs tw-mail)**: 마이그레이션도 신규 개발도 아닌 **공통 컴포넌트 추상화 + 기능 강화 + 별도 제품 출시**. 핵심 검증은 **사용처 무파괴(23 파일 호환) + 시각 회귀 0 + 번들 크기 제어 + 라이선스 검증(Pro)**.
>
> **5단계**: DISCOVER → GOALS → SPECIFY → IMPLEMENT → VERIFY
> Goal 단위 SPECIFY → IMPLEMENT → VERIFY 루프. 각 단계 독립 Coverage Verifier 가 migration-impact tier 임계값(high 95 / medium 90 / low 85) 충족 시에만 다음 단계 진행.
>
> **v1.1 (2026-05-16 SSoT 리팩토링)**: agent prompt 4종을 [`agents/`](../tw-grid/agents/INDEX.md) 로 분리. constraints/rubric 다중 인용을 [`policies/`](../tw-grid/policies/INDEX.md) + [`_shared/`](../policies/_shared/INDEX.md) (cross-harness universal) SSoT 로 통합. 본 명령 파일은 오케스트레이션 + 호출 매뉴얼만.

---

## ⚠️ 절대 준수 원칙

모든 에이전트는 다음을 의무 읽기:
- [`constraints/INDEX.md`](../tw-grid/constraints/INDEX.md) — 카테고리 인덱스
- [`policies/INDEX.md`](../tw-grid/policies/INDEX.md) — tw-grid 도메인 SSoT (POL-TANSTACK, POL-COMPAT, POL-BUNDLE, POL-MIG-STAGE, POL-DOC-LIC, POL-SPEC-DISC)
- [`_shared/INDEX.md`](../policies/_shared/INDEX.md) — cross-harness universal SSoT (SHARED-QUALITY, SHARED-BUILD, SHARED-AGENT, SHARED-DRIFT)
- [`agents/_preamble.md`](../tw-grid/agents/_preamble.md) — 공통 boilerplate

특히 **[SHARED-AGENT/§1](../policies/_shared/agent-delegation.md#1-모든-stage-작업은-agent-위임-의무) Agent 위임 의무**, **[POL-TANSTACK/§3](../tw-grid/policies/tanstack-fidelity.md#3-wijmo-비도입-의무) Wijmo 비도입**, **[POL-COMPAT/§2](../tw-grid/policies/compatibility-versioning.md#2-peerdependencies-정책) peerDependencies 정책**은 절대 위반 금지.

위반 시 Coverage Verifier 가 해당 항목 NO 처리.

---

## 호출 방식

```
── Phase 1: 사용 현황 + 기능 매트릭스 도출 ──────────────────────────
/tw-grid discover                    → tw-framework-front 23파일 + publish 13파일 분석
                                       canonical-modules.json (20개 모듈 정의)
                                       AG Grid vs TanStack 기능 갭 매트릭스
                                       ⚠️ 사용자 검토 게이트
/tw-grid discover --rescan           → 1차부터 재실행 (백업 후)

── Phase 2: Goal 도출 (1차 승인 후) ─────────────────────────────────
/tw-grid discover --approve          → 1차 승인 + 모듈별 Goal 자동 생성
/tw-grid discover goals              → Goal 생성만 재실행
/tw-grid discover goals {moduleId}   → 특정 모듈 Goal 재도출
/tw-grid discover goals --modules MOD-GRID-01,MOD-GRID-10

── Phase 3+4+5: 자율 루프 (Specify → Implement → Verify) ────────────
/tw-grid                             → 다음 pending Goal·단계 자동 선택
/tw-grid --auto                      → Goal 완료/blocked 시에만 중단
/tw-grid loop {moduleId}             → 특정 모듈 자율 루프
/tw-grid loop {moduleId} {area}      → 특정 영역만

── 특정 Goal 직접 제어 ──────────────────────────────────────────────
/tw-grid goal {moduleId}/{area}/G-NNN     → Goal 전체 (3단계)
/tw-grid goal G-NNN stage specify
/tw-grid goal G-NNN stage implement
/tw-grid goal G-NNN stage verify
/tw-grid rescore G-NNN
/tw-grid skip G-NNN

── 사용처 마이그레이션 전용 ──────────────────────────────────────────
/tw-grid migrate {usage-file-path}    → 특정 사용처 파일을 새 wrapper 로 전환
/tw-grid migrate --module MOD-GRID-XX  → 모듈 단위 일괄

── 진단 (반복 실패 분석) ────────────────────────────────────────────
/tw-grid diagnose                    → rubric 항목별 실패율 + 패턴
/tw-grid diagnose rubric             → rubric 만
/tw-grid diagnose goals              → Goal 상태 (blocked 분석)
/tw-grid diagnose suggest            → 구체적 수정 제안
/tw-grid diagnose hallucination      → Verifier 산식 자가검증 실패 분석 ([POL-SPEC-DISC/§2](../tw-grid/policies/spec-discipline.md#2-coverage-verifier-산식-자가검증))

── 상용 제품화 (모노레포/배포) ───────────────────────────────────────
/tw-grid package {pkgName}           → 패키지 빌드 + 검증 (tsc + vite build + size-limit)
/tw-grid package all                 → 20 패키지 일괄 빌드
/tw-grid release {pkgName}           → npm publish + Changeset + Git tag
/tw-grid release --pro {pkgName}     → Pro 패키지 (별도 registry)
/tw-grid docs                        → Docusaurus 빌드 + 배포
/tw-grid demo                        → Vite playground 시작 (포트 5173)
/tw-grid license-issue {email} {tier} {expiry}  → 라이선스 키 발급 (Pro)
/tw-grid license-verify {key}                    → 키 검증

── 진행 현황 ───────────────────────────────────────────────────────
/tw-grid monitor                     → 전체 모듈 진행 대시보드 (READ-ONLY)
/tw-grid monitor {moduleId}          → 특정 모듈 상세
/tw-grid monitor --compact           → 모듈별 1줄 요약
/tw-grid status                      → 헤더만

── 초기화 ─────────────────────────────────────────────────────────
/tw-grid init                        → 디렉토리 + state.json + rubric + policies/constraints 자동 생성
/tw-grid init --monorepo             → 모노레포 스캐폴딩까지 (Phase A 준비)
```

---

## PROJECT CONFIG

```
BASE              = D:\project\topvel_project\TOMIS
TW_GRID_ROOT      = {BASE}\.claude\tw-grid
STATE_FILE        = {TW_GRID_ROOT}\state.json
CANONICAL_FILE    = {TW_GRID_ROOT}\canonical-modules.json
GOALS_ROOT        = {TW_GRID_ROOT}\goals
ARTIFACTS_ROOT    = {TW_GRID_ROOT}\artifacts
RUBRIC_ROOT       = {TW_GRID_ROOT}\rubric
POLICIES_ROOT     = {TW_GRID_ROOT}\policies         ← SSoT 룰 (v1.1)
CONSTRAINTS_ROOT  = {TW_GRID_ROOT}\constraints      ← 카테고리 분할 (v1.1)
AGENTS_ROOT       = {TW_GRID_ROOT}\agents           ← agent prompt (v1.1)
SHARED_POLICIES   = {BASE}\.claude\policies\_shared ← cross-harness universal (v1.1)
REFERENCE_ROOT    = {TW_GRID_ROOT}\references       ← publish AG Grid + Wijmo + TanStack 현황
DECISIONS_ROOT    = {TW_GRID_ROOT}\decisions        ← ADR
FINDINGS_ROOT     = {TW_GRID_ROOT}\findings         ← documented-deviations

SPECIFY_RUBRIC    = {RUBRIC_ROOT}\specify-rubric.md
IMPLEMENT_RUBRIC  = {RUBRIC_ROOT}\implement-rubric.md
VERIFY_RUBRIC     = {RUBRIC_ROOT}\verify-rubric.md  (5축 가중)

── tw-framework-front (현 그리드 사용처) ─────────────────────────
FE_ROOT           = {BASE}\tw-framework-front
FE_GRID_ROOT      = {FE_ROOT}\src\components\tomis\Grid       (8 variant)
FE_DATATABLE_ROOT = {FE_ROOT}\src\components\DataTable
FE_USAGE_ROOT     = {FE_ROOT}\src\pages                       (사용처 ~23개)

── publish (참조 — AG Grid + Wijmo) ─────────────────────────────
PUBLISH_ROOT      = {BASE}\publish
PUBLISH_AGGRID    = {PUBLISH_ROOT}\src\components\common\aggrid    (AG Grid 13파일)
PUBLISH_WIJMO     = {PUBLISH_ROOT}\src\components\common\wijmo-grid (Wijmo 5파일, 참조만)
PUBLISH_ATTENDANCE= {PUBLISH_ROOT}\src\app\personal\commute-manage

── 상용 제품 모노레포 ───────────────────────────────────────────
MONOREPO_ROOT     = {BASE}\topvel-grid-monorepo  (별도 디렉토리)
PACKAGES_ROOT     = {MONOREPO_ROOT}\packages
APPS_ROOT         = {MONOREPO_ROOT}\apps

── 빌드 명령 SSoT ───────────────────────────────────────────────
→ [SHARED-BUILD/§1.3](../policies/_shared/build-commands.md#13-pnpm-monorepo-tw-grid-환경) (pnpm monorepo)
```

---

## Step 0: 상태 파일 로드 + 헤더 (매 호출 필수)

### 0-1. 파일 읽기
- `STATE_FILE` (state.json) — 전역 설정 + goalsIndex + summary
- 현재 진행 중인 Goal 의 goals.json — overallStatus/stages 확인

파일 없으면: "`state.json`이 없습니다. `/tw-grid init` 을 먼저 실행하세요."

### 0-2. Parallel Session Lock 확인

→ [SHARED-DRIFT/§9.3](../policies/_shared/drift-spec.md#93-parallel-session-lock)

진입 시:
1. `.claude/tw-grid/loop.lock` 존재 확인
2. 존재 시: 같은 moduleId → 거부, 다른 moduleId → 경고 + 사용자 확인 + alert push
3. 부재 시 lock 생성 후 진행

### 0-3. 헤더 출력

```
╔══════════════════════════════════════════════════════════════════╗
║  tw-grid — TanStack 그리드 추상화 + 상용 제품화 하네스 v1.1       ║
║  5단계: Discover → Goals → Specify → Implement → Verify          ║
║  threshold: high 95 / medium 90 / low 85                         ║
║  SSoT: _shared/ + policies/ + constraints/ + agents/             ║
║  ⚠️ Wijmo 비도입 / Agent 위임 의무                                ║
╚══════════════════════════════════════════════════════════════════╝

  전체: {완료}/{총 Goals}  ✅완료:{n}  🔄진행:{n}  ⬜대기:{n}  🚫차단:{n}
  모듈: 20개 (5 abstraction + 4 critical-gap + 6 wijmo-class + 1 enhancement + 1 migration + 3 인프라)
  ──────────────────────────────────────────────────────────────────
  {moduleId}/{area}/{goalId}: {title} [{priority}] [tier:{impact}]
    SPECIFY  [{icon}] score:{score}  loops:{loops}/3
    IMPLEMENT[{icon}] score:{score}  loops:{loops}/3
    VERIFY   [{icon}] score:{score}  loops:{loops}/3
  ──────────────────────────────────────────────────────────────────
  ▶ 다음: {goalId}.{stage} — {action}
```

`status` 호출 시 여기서 종료. `monitor` 호출 시 tw-grid-monitor.md 로 위임.

---

## Step 1: 다음 실행 대상 선택

state.json `goalsIndex` 읽어 우선순위:

```
① 세션 중단 복구 우선:
   overallStatus == "in_progress" → 최우선 (loops 카운터 유지)

② 일반 순서 선택:
   overallStatus == "pending" 중
   → impactTier 순 (high → medium → low)
   → Priority 순 (P0 > P1 > P2, 같으면 goalId 오름차순)
   → stages.specify → implement → verify 순
```

단계 순서: specify → implement → verify

---

## Step 2: Goals 파일 읽기

`{GOALS_ROOT}/{MOD-GRID-XX}/{area}-goals.json` 에서 해당 goalId 객체 추출.

> ⚠️ **modify 범위**: [SHARED-DRIFT/§9.1](../policies/_shared/drift-spec.md#91-자기-모듈만-modify) — 자기 moduleId 의 `*-goals.json` 만 write. 다른 모듈은 read-only.

---

## Step 3: 단계별 에이전트 실행

각 Stage 마다 **독립 Agent 도구 호출** (`subagent_type: "general-purpose"`). 모델은 migration-impact tier 차등 ([SHARED-AGENT/§1.1](../policies/_shared/agent-delegation.md#11-stage별-권장-모델)).

| Stage | Agent prompt | Rubric | 모델 (high / medium / low) |
|-------|--------------|--------|----------------------------|
| SPECIFY | [`agents/spec-writer.md`](../tw-grid/agents/spec-writer.md) | [`specify-rubric.md`](../tw-grid/rubric/specify-rubric.md) | opus / sonnet / sonnet |
| IMPLEMENT | [`agents/implementer.md`](../tw-grid/agents/implementer.md) | [`implement-rubric.md`](../tw-grid/rubric/implement-rubric.md) | opus / sonnet / sonnet |
| VERIFY | [`agents/verifier.md`](../tw-grid/agents/verifier.md) | [`verify-rubric.md`](../tw-grid/rubric/verify-rubric.md) | opus / opus / opus |

각 stage 진입 시 의무 게이트:
- [SHARED-DRIFT/§3](../policies/_shared/drift-spec.md#3-pre-implementation-checklist-의무) 사전 체크리스트 (IMPLEMENT)
- [SHARED-BUILD/§3](../policies/_shared/build-commands.md#3-통과-의무-시점) 빌드 통과 (IMPLEMENT 완료 조건)
- [SHARED-AGENT/§3](../policies/_shared/agent-delegation.md#3-메인-검증-의무-agent-보고-자체-검증-금지) 메인 검증
- [POL-SPEC-DISC/§1](../tw-grid/policies/spec-discipline.md#1-spec-권위-prompt-spec-drift-보고) prompt-spec drift 보고

서브에이전트는 **아티팩트를 파일에 저장**하고 파일 경로만 반환.

---

## Step 4: Coverage Verifier (Specify/Implement 단계)

각 Stage 의 에이전트 실행 후 **독립 Agent 로 실행**.

Spec Writer/Implementer Agent 와 **다른** Agent 인스턴스 — 컨텍스트 분리 필수 ([SHARED-AGENT/§2](../policies/_shared/agent-delegation.md#2-implementer-verifier-분리-의무) + [POL-SPEC-DISC/§5](../tw-grid/policies/spec-discipline.md#5-implementer-score-json-작성-금지)).

| 단계 | Agent prompt | Rubric | 모델 |
|------|--------------|--------|------|
| specify / implement | [`agents/coverage-verifier.md`](../tw-grid/agents/coverage-verifier.md) | 단계별 rubric | haiku |
| verify | Verifier Agent 자체가 채점 (별도 verifier 불필요) | verify-rubric.md | opus |

Coverage Verifier 는 점수 계산 직후 [POL-SPEC-DISC/§2](../tw-grid/policies/spec-discipline.md#2-coverage-verifier-산식-자가검증) **산식 자가검증 의무** (N/A 분모 제외 + failedChecks 무결성 + 카테고리 합계 + 점수 재검산).

---

## Step 5: 점수 판정 + 루프 제어

```
threshold = tierToThreshold(goal.migrationImpact)  // high 95 / medium 90 / low 85

IF passed == true:
  → stage.status="done", score, lastRun 기록
  → specify done → implement.status="pending"
  → implement done → verify.status="pending"
  → verify done → overallStatus="completed"
  → state.json summary 갱신 (state-sync 자동 호출)

ELSE:
  → loops += 1
  IF loops >= maxLoopsPerStage(3):
    → status="blocked", overallStatus="blocked"
    → findings/blocked/{goalId}.md 작성
  ELSE:
    → status="in_progress"
    → feedback 누적
```

---

## Step 6: 결과 출력

```
┌─────────────────────────────────────────────────────────────────┐
│ [{goalId}] {title} [tier:{impact}]                              │
│ [{stage}] {PASS ✅ / RETRY ⚠️ / BLOCKED 🚫} score:{score}/{thr} │
│ 영향 사용처: {N}/{total} 마이그레이션 진행                       │
│ 번들 변동: +{N}KB                                                │
│ PASS 시: 다음 단계 진행                                          │
│ RETRY 시: 재시도 {loops}/3 — 피드백 {n}건                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 7: Self-Review (Goal 완료 시 필수)

**모델**: opus (rubric 개선이 다음 모든 Goal 에 cascading).

Reviewer Agent 호출:
- 반복 실패 rubric 항목 분석
- feedback 명확성 점검
- AG Grid/Wijmo 카탈로그 추가 후보 (references/)
- 에이전트 추측 오류 패턴

개선 적용 규칙: rubric/policies/constraints 항목 **추가/명확화만** (삭제 금지).

SSoT 구조에서 신규 rubric 항목 발견 시:
- [`policies/`](../tw-grid/policies/INDEX.md) 또는 [`_shared/`](../policies/_shared/INDEX.md) 에 룰 추가 → rubric 본문은 reference 만
- 본문 인라인 작성 시 [메타원칙 M-1](../tw-grid/constraints/00-meta.md) 위반 보고

Goal 에 `harnessReview` 필드 추가 + State Sync 자동 호출:
```
node .claude/tw-grid/tools/grid-state-sync.mjs
```

종료 시 [loop.lock 해제 의무](../policies/_shared/drift-spec.md#93-parallel-session-lock).

---

## 데이터 모델 규칙

### goals.json — 단일 진실 출처 (SSoT)
- 각 Goal 의 stages(status/score/loops/feedback) 는 goals.json 에만
- migrationImpact, affectedUsageFiles, packageTarget(packages/grid-XXX) 필드

### state.json — 전역 인덱스 + 집계
- goalsIndex (간략 요약)
- summary (모듈별 진행률 + tier 별 합격율)
- buildCache (tsc 결과 캐시)

### loop.lock — Parallel Session Lock
→ [SHARED-DRIFT/§9.3](../policies/_shared/drift-spec.md#93-parallel-session-lock)

---

## 금지 사항

| 금지 | 출처 |
|------|------|
| Wijmo (@mescius/wijmo) 신규 import | [POL-TANSTACK/§3](../tw-grid/policies/tanstack-fidelity.md#3-wijmo-비도입-의무) |
| AG Grid (ag-grid-*) 신규 dependency | [POL-TANSTACK/§2](../tw-grid/policies/tanstack-fidelity.md#2-ag-grid-신규-도입-금지) |
| TanStack 내부 API 직접 접근 | [POL-TANSTACK/§1](../tw-grid/policies/tanstack-fidelity.md#1-tanstack-v8-표준-api-사용) |
| 메인 세션 직접 작업 (Agent 위임 미이용) | [SHARED-AGENT/§1](../policies/_shared/agent-delegation.md#1-모든-stage-작업은-agent-위임-의무) |
| Implementer 가 score.json 작성 | [POL-SPEC-DISC/§5](../tw-grid/policies/spec-discipline.md#5-implementer-score-json-작성-금지) |
| Spec Plan 외 구현 | [SHARED-QUALITY/§1](../policies/_shared/code-quality.md#1-no-assumption-coding) + [SHARED-DRIFT/§6](../policies/_shared/drift-spec.md#6-scope-contraction-처리) |
| `any` 타입 사용 | [SHARED-QUALITY/§2](../policies/_shared/code-quality.md#2-typescript-strict) |
| 더미/Mock 데이터 | [SHARED-QUALITY/§4](../policies/_shared/code-quality.md#4-no-dummy-mock-data) |
| 새 CSS 파일 생성 | [SHARED-QUALITY/§5](../policies/_shared/code-quality.md#5-css-신규-파일-금지) |
| 시각 회귀 미확인 (impact high/medium) | [POL-MIG-STAGE/§2](../tw-grid/policies/migration-staging.md#2-시각-회귀-검증-의무) |
| 가상화 비호환 | [POL-BUNDLE/§1](../tw-grid/policies/bundle-perf.md#1-가상화-호환성) |
| 1 Goal 당 사용처 마이그레이션 > 5개 | [POL-MIG-STAGE/§1](../tw-grid/policies/migration-staging.md#1-사용처-점진-마이그레이션) |
| 새 외부 라이브러리 ADR 없이 추가 | [POL-DOC-LIC/§4](../tw-grid/policies/documentation-licensing.md#4-adr-의무) |
| 번들 크기 +100KB 초과 사용자 승인 없이 | [POL-BUNDLE/§2.3](../tw-grid/policies/bundle-perf.md#23-의무) |
| peerDependencies 미분리 | [POL-COMPAT/§2](../tw-grid/policies/compatibility-versioning.md#2-peerdependencies-정책) |
| breaking change semver 위반 | [POL-COMPAT/§3](../tw-grid/policies/compatibility-versioning.md#3-semver-준수) |
| 라이선스 미명시 npm publish | [POL-DOC-LIC/§1](../tw-grid/policies/documentation-licensing.md#1-라이선스-명시-의무) |
| Public API 문서 없이 release | [POL-DOC-LIC/§2](../tw-grid/policies/documentation-licensing.md#2-public-api-문서화-의무) |
| 다른 모듈 `*-goals.json` write | [SHARED-DRIFT/§9.1](../policies/_shared/drift-spec.md#91-자기-모듈만-modify) |
| silently drift 진행 | [SHARED-DRIFT/§2](../policies/_shared/drift-spec.md#2-drift-detection-gate) |
| exactOptionalPropertyTypes 환경 optional prop 직접 forwarding | [constraints C-29](../tw-grid/constraints/80-code-patterns.md#c-29-exactoptionalpropertytypes-환경-optional-prop-forwarding-패턴) |
| 유틸 생성 후 호출처 wiring 누락 (dead code) | [constraints C-31](../tw-grid/constraints/80-code-patterns.md#c-31-functional-wiring-audit-유틸-생성-후-호출처-검증) |
| Worktree boundary 시 PowerShell 우회 시도 0건 | [constraints C-34](../tw-grid/constraints/90-environment.md#c-34-워크트리-경계-vs-사용처-마이그레이션-powershell-via-bash-우회-의무) |
| 빌드 명령에 `./gradlew` 사용 (Linux/Mac) | [SHARED-BUILD/§5](../policies/_shared/build-commands.md#5-windows-환경-규칙-claudemd-준수) |

---

## 타 하네스와의 관계

| 하네스 | 관계 |
|--------|------|
| `tw-mail` | 동일 5단계 구조 + risk-tier 차등 패턴 차용 + [`_shared/`](../policies/_shared/INDEX.md) universal SSoT 공유 |
| `tw-harness` | Agent 위임 + 루브릭 기반 + Self-Review 차용 + [`_shared/`](../policies/_shared/INDEX.md) 공유 |
| `tw-deep` | tw-grid 가 만든 컴포넌트를 마이그레이션 시 사용처 변환에 활용 |

---

## 파일 구조

```
.claude/commands/
└── tw-grid.md   ← 이 파일 (오케스트레이터 v1.1, 슬림화)
└── tw-grid-{init,discover,goals,loop,monitor,diagnose}.md

.claude/policies/_shared/   ← cross-harness universal (v1.1)
├── INDEX.md
├── code-quality.md
├── build-commands.md
├── agent-delegation.md
└── drift-spec.md

.claude/tw-grid/
├── state.json
├── canonical-modules.json
├── loop.lock (활성 세션 시)
├── policies/                ← 도메인 SSoT (v1.1)
│   ├── INDEX.md
│   ├── tanstack-fidelity.md
│   ├── compatibility-versioning.md
│   ├── bundle-perf.md
│   ├── migration-staging.md
│   ├── documentation-licensing.md
│   └── spec-discipline.md
├── constraints/             ← 카테고리 분할 (v1.1)
│   ├── INDEX.md
│   ├── 00-meta.md ... 90-environment.md
│   └── HISTORY.md
├── agents/                  ← agent prompt (v1.1)
│   ├── INDEX.md
│   ├── _preamble.md
│   ├── _return-contract.md
│   ├── spec-writer.md
│   ├── implementer.md
│   ├── verifier.md
│   └── coverage-verifier.md
├── rubric/
│   ├── specify-rubric.md
│   ├── implement-rubric.md
│   └── verify-rubric.md
├── references/
├── decisions/
├── findings/
├── goals/
│   └── {MOD-GRID-NN}/{area}-goals.json
└── artifacts/
    └── {MOD-GRID-NN}/{area}/
        ├── G-NNN-spec.md
        ├── G-NNN-{specify,implement,verify}-score.json
        └── G-NNN-self-review.md
```

---

## State Sync 자동 호출

매 단계 완료 후:
```bash
node .claude/tw-grid/tools/grid-state-sync.mjs
```
- goals.json fresh read → state.json 통째로 재계산
- summary (모듈별/tier 별/Pro·MIT 분류별)
- 출력 비표시. 실패해도 본 작업 성공 처리.

---

**v1.1 끝.** 하위 명령 상세는 tw-grid-init.md / discover.md / goals.md / loop.md / monitor.md 참조.
