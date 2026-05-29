# tw-grid-monitor — 진행 현황 대시보드 v1.0

> **호출**: `/tw-grid monitor [moduleId] [옵션]`
> **목적**: tw-grid 하네스 진행 현황을 시각화 (READ-ONLY).
> **참조**: tw-mail-monitor / tw-harness-monitor 패턴

---

## ⚠️ READ-ONLY 원칙

이 명령은 **파일을 절대 수정하지 않음**. state.json + goals.json + score JSON 읽기만.

---

## 호출 방식

```
── 기본 ────────────────────────────────────────────────────────────
/tw-grid monitor                     → 전체 모듈 진행 대시보드 (rollup)
/tw-grid monitor MOD-GRID-XX         → 특정 모듈 상세 (Goal 단위 표시)
/tw-grid monitor MOD-GRID-XX {area}  → 특정 영역만

── 필터/뷰 ────────────────────────────────────────────────────────
/tw-grid monitor --compact           → 모듈별 1줄 요약 (빠른 확인)
/tw-grid monitor --full              → 모든 Goal 상세
/tw-grid monitor --tier high         → high tier만
/tw-grid monitor --phase wijmo-class → 특정 phase만
/tw-grid monitor --status blocked    → blocked Goal만
/tw-grid monitor --status in_progress→ 진행 중만

── 분석 ───────────────────────────────────────────────────────────
/tw-grid monitor stats               → 통계 (평균 loops, tier별 합격율 등)
/tw-grid monitor deviations          → documented-deviations 요약
/tw-grid monitor self-review         → Harness Self-Review 누적 개선
```

---

## Step M-0: 상태 로드

```
1. .claude/tw-grid/state.json 읽기
2. .claude/tw-grid/canonical-modules.json 읽기
3. (필요 시) goals/**/*.json + artifacts/**/*-score.json 읽기

매번 grid-state-sync.mjs 호출 (최신 상태 보장):
  node .claude/tw-grid/tools/grid-state-sync.mjs
```

---

## Step M-1: 기본 대시보드 (rollup)

`/tw-grid monitor`:

```
╔══════════════════════════════════════════════════════════════════╗
║  tw-grid Monitor — {YYYY-MM-DD HH:MM}                            ║
║  Phase: {init|discovered|approved|goals_pending|in_loop|done}   ║
╚══════════════════════════════════════════════════════════════════╝

전체:  {완료}/{총}  ✅완료:{n}  🔄진행:{n}  ⬜대기:{n}  🚫차단:{n}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Phase별 진행률
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  infra            [████░░░░░░░░░░░░░░░░]  4/10  (40%)
  abstraction      [████████████░░░░░░░░] 12/20  (60%)
  critical-gap     [██░░░░░░░░░░░░░░░░░░]  1/12  ( 8%)
  wijmo-class      [░░░░░░░░░░░░░░░░░░░░]  0/25  ( 0%)
  enhancement      [░░░░░░░░░░░░░░░░░░░░]  0/3   ( 0%)
  migration        [░░░░░░░░░░░░░░░░░░░░]  0/12  ( 0%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Tier별 합격 현황
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  high   (≥95)   ✅완료:8  🔄진행:2  ⬜대기:15  🚫차단:1
  medium (≥90)   ✅완료:6  🔄진행:1  ⬜대기:25  🚫차단:0
  low    (≥85)   ✅완료:3  🔄진행:0  ⬜대기:14  🚫차단:0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 패키지별 (상용 제품화)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  grid-core (MIT)              [████████░░░░] 16/20  (80%)
  grid-renderers (MIT)         [█████░░░░░░░] 5/7   (71%)
  grid-virtual (MIT)           [██░░░░░░░░░░] 1/3   (33%)
  grid-tracking (Pro) ⭐        [░░░░░░░░░░░░] 0/5   ( 0%)
  grid-cell-range (Pro) ⭐      [░░░░░░░░░░░░] 0/6   ( 0%)
  grid-datamap (Pro) ⭐         [░░░░░░░░░░░░] 0/4   ( 0%)
  grid-merge (Pro) ⭐           [░░░░░░░░░░░░] 0/3   ( 0%)
  grid-multi-header (Pro) ⭐    [░░░░░░░░░░░░] 0/3   ( 0%)
  grid-aggregation (Pro) ⭐     [░░░░░░░░░░░░] 0/4   ( 0%)
  grid-export (Pro) ⭐          [░░░░░░░░░░░░] 0/5   ( 0%)
  grid-master-detail (Pro)     [░░░░░░░░░░░░] 0/3   ( 0%)
  grid-license (Pro)           [░░░░░░░░░░░░] 0/3   ( 0%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 현재 진행 중
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔄 MOD-GRID-02 useGridState  G-003 (filter state)    SPECIFY  loops 1/3
  🔄 MOD-GRID-05 셀 렌더러     G-004 (DateCell)        VERIFY   loops 1/3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 차단된 Goals (수동 처리 필요)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚫 MOD-GRID-01 G-002 (props 통합)
     사유: high tier 95점 미달 (94.7) — 시각 회귀 1건
     수정 가이드: findings/blocked/MOD-GRID-01-G-002.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 다음 권장 명령
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /tw-grid --auto                   ← 자율 루프 계속
  /tw-grid skip MOD-GRID-01/G-002   ← 차단 Goal 명시 건너뜀
  /tw-grid diagnose                 ← 반복 실패 패턴 분석
  /tw-grid package grid-core        ← 핵심 패키지 빌드 (Phase A)
```

---

## Step M-2: 모듈 상세 (`/tw-grid monitor MOD-GRID-XX`)

```
╔══════════════════════════════════════════════════════════════════╗
║  MOD-GRID-10 — ChangeTracking 강화 (Wijmo CollectionView 패턴)   ║
║  Phase: wijmo-class / Pkg: grid-tracking (Pro) / Tier: high      ║
║  Threshold: 95 / 95 / 95                                          ║
╚══════════════════════════════════════════════════════════════════╝

진행률: 2/5 Goals (40%)

Goal 목록:
┌──────────────────────────────────────────────────────────────────┐
│ ID    │ Title                          │ Pri │ Spec  │ Impl  │ Ver │
├──────────────────────────────────────────────────────────────────┤
│ G-001 │ trackChanges API 설계          │ P0  │ ✅100 │ ✅96  │ ✅98 │
│ G-002 │ added/edited/removed 배열      │ P0  │ ✅95  │ ✅95  │ ✅97 │
│ G-003 │ buildChangeSet 함수            │ P0  │ 🔄87  │ ⬜    │ ⬜  │
│ G-004 │ validator + mapping            │ P1  │ ⬜    │ ⬜    │ ⬜  │
│ G-005 │ React hook 통합                │ P1  │ ⬜    │ ⬜    │ ⬜  │
└──────────────────────────────────────────────────────────────────┘

의존성:
  ← MOD-GRID-01 공통 wrapper (완료)
  ← MOD-GRID-02 useGridState (75% 완료)

영향 사용처: ChangeTrackingGrid.tsx 1파일 (사용처는 MOD-GRID-17에서 처리)

ADR (decisions/MOD-GRID-10-decisions.md):
  - 결정 1: TanStack의 manualChangeTracking 없음 → 자체 hook 구현
  - 결정 2: itemsAdded 형식은 Wijmo와 호환 (publish 마이그레이션 용이)

번들 영향:
  - grid-tracking 현재: 0 KB → 예상 +12 KB (한도 20 KB)
```

---

## Step M-3: --compact 옵션

```
/tw-grid monitor --compact:

MOD-GRID-00  infra        [████░░] 4/10 (40%)
MOD-GRID-01  abstraction  [██████] 5/5  (100%) ✅
MOD-GRID-02  abstraction  [████░░] 4/6  (67%)
MOD-GRID-03  abstraction  [██████] 3/3  (100%) ✅
MOD-GRID-04  abstraction  [██░░░░] 1/3  (33%)
MOD-GRID-05  abstraction  [████░░] 5/7  (71%)
MOD-GRID-06  critical-gap [░░░░░░] 0/5  ( 0%)
...
```

---

## Step M-4: stats (`/tw-grid monitor stats`)

```
╔══════════════════════════════════════════════════════════════════╗
║  tw-grid 통계 (지난 7일)                                          ║
╚══════════════════════════════════════════════════════════════════╝

평균 단계별 loops:
  SPECIFY    : 1.4 (high 2.1 / medium 1.2 / low 1.0)
  IMPLEMENT  : 1.6 (high 2.3 / medium 1.4 / low 1.1)
  VERIFY     : 1.8 (high 2.6 / medium 1.5 / low 1.1)

가장 자주 실패한 rubric 항목 (Top 5):
  1. C-02 외관 보존         (verify  ) — 8 NO
  2. B-01 tsc 0 errors      (implement) — 6 NO
  3. A-04 대응표 누락       (specify ) — 5 NO
  4. D-01 마이그레이션 비율 (verify  ) — 4 NO
  5. E-01 번들 크기         (verify  ) — 3 NO

자동 보완 성공률:
  any 제거          : 100% (3/3)
  Wijmo import 제거  : 100% (1/1)
  ADR draft 생성     : 67% (2/3)
  number → 구체 타입 : 80% (8/10)

Self-Review 누적:
  rubric 추가 항목   : 4건
  constraints 추가   : 1건 (C-26 candidate)
  references 보강    : 7건
  ADR 추가           : 12건

평균 Goal 완료 시간: 2.4 hour (high) / 1.2 hour (medium) / 0.6 hour (low)
```

---

## Step M-5: deviations (`/tw-grid monitor deviations`)

```
╔══════════════════════════════════════════════════════════════════╗
║  Documented Deviations (수동 처리/예외 허용)                       ║
╚══════════════════════════════════════════════════════════════════╝

총 {N}건

분류:
  메타데이터 미비 (rubric N/A 재분류): {n}
  호환성 예외 (deprecated alias):       {n}
  번들 크기 사용자 승인:                {n}
  외부 라이브러리 ADR (특수 라이선스):  {n}

상세:
  ┌──────────────────────────────────────────────────────────────┐
  │ Goal           │ Check  │ 사유            │ 영구 기록 파일       │
  ├──────────────────────────────────────────────────────────────┤
  │ MOD-GRID-01/G-001 │ C-02   │ 외관 의도 변경 │ deviations/...md │
  │ MOD-GRID-10/G-003 │ E-01   │ +25KB 승인     │ deviations/...md │
  └──────────────────────────────────────────────────────────────┘
```

---

## Step M-6: self-review (`/tw-grid monitor self-review`)

```
╔══════════════════════════════════════════════════════════════════╗
║  Harness Self-Review 누적 개선                                   ║
╚══════════════════════════════════════════════════════════════════╝

총 Goal 완료 {N}회 × Self-Review 적용 {M}건

rubric/specify-rubric.md 개선:
  + 추가 항목 4개 (A-06 ~ A-09, AG Grid 매트릭스 갱신)
  + 항목 명확화 7건

rubric/implement-rubric.md 개선:
  + 자동 보완 패턴 추가 6건
  + B-08~B-10 자동 검증 항목 추가

rubric/verify-rubric.md 개선:
  + C-04 시각 회귀 자동화 가이드 추가

constraints.md 개선:
  + C-26 (candidate): 가상화 1000행 시나리오 의무 (Self-Review 제안)
  → 사용자 승인 대기

references/ag-grid-feature-matrix.md:
  + 신규 기능 12개 추가 (AG Grid 33.1 → 34.0)

ADR 추가 (decisions/):
  + 12개 (Phase A 1.0 출시 전 1차)
```

---

## Step M-7: status (`/tw-grid status`)

```
헤더만 출력 (Step M-1의 첫 박스만).
```

---

## C-15 Agent 위임 의무

monitor는 READ-ONLY이므로 Agent 호출 불필요. 메인 세션이 직접 state.json 읽고 출력.

---

## 출력 색상 (가독성)

```
✅ 녹색  완료
🔄 노란  진행
⬜ 회색  대기
🚫 빨강  차단
⭐ 황금  Pro 패키지
```
