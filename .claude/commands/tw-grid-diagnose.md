# tw-grid-diagnose — 플러그인 건강 진단 v1.0

> **호출**: `/tw-grid diagnose [옵션]`
> **목적**: 모든 score JSON + loop-history 집계 → rubric/constraints/프롬프트의 구조적 문제를 탐지 + 구체적 업데이트 제안.
> **참조**: tw-harness-diagnose v1.3 패턴

**중요**: diagnose는 "무엇이 문제인가"를 감지. 자동 수정은 안 함 (Self-Review가 PASS 시 자동 적용).

---

## PROJECT CONFIG (tw-grid.md와 동기화)

```
BASE             = D:\project\topvel_project\TOMIS
HARNESS_ROOT     = {BASE}\.claude\tw-grid
ARTIFACTS_ROOT   = {HARNESS_ROOT}\artifacts
GOALS_ROOT       = {HARNESS_ROOT}\goals
RUBRIC_ROOT      = {HARNESS_ROOT}\rubric
COMMANDS_DIR     = {BASE}\.claude\commands
STATE_FILE       = {HARNESS_ROOT}\state.json
CONSTRAINTS_FILE = {HARNESS_ROOT}\constraints.md
```

---

## 호출 방식

```
/tw-grid diagnose             ← 전체 진단 (DG-0~DG-7 모두)
/tw-grid diagnose rubric      ← rubric 항목 실패율만 (DG-2~DG-3)
/tw-grid diagnose goals       ← Goal 상태(루프 근접, blocked) 중심 (DG-4)
/tw-grid diagnose hallucination ← 환각 의심 패턴만 (DG-7)
/tw-grid diagnose suggest     ← 구체적 업데이트 제안 포함 (DG-6)
```

---

## Step DG-0: 구조 일관성 사전 점검 (항상 수행)

```
① 표본 크기 확인:
   Glob('{ARTIFACTS_ROOT}/**/*-score.json') → n개
   if n < 3:
     "⚠️ 데이터 부족 (score {n}개 < 3개). 3개+ Goal 완료 후 재실행하세요."
     → DG-2/DG-3/DG-5 건너뜀, DG-4 + 구조 체크만 수행

② rubric check_id 완결성:
   specify/implement/verify-rubric.md Read → "| ID |" 표 파싱
   tw-grid.md / tw-grid-loop.md / tw-grid-discover.md / tw-grid-goals.md Read
   → 각 파일의 Coverage Verifier/Verifier 프롬프트에서 check_id 언급 추출
   → rubric에 있으나 어느 파일에서도 미언급: ⚠️ 출력

③ constraints 참조 일관성:
   constraints.md Read → "C-[0-9]+" 추출
   위 커맨드 파일에서 Grep("C-[0-9]+") → 인용 목록
   constraints.md에 정의됐으나 미언급된 C 항목 → ⚠️

④ goals.json 스키마 일관성:
   Glob('{GOALS_ROOT}/**/*-goals.json') → version 필드 수집 → 불일치 파일 ⚠️

⑤ Agent 호출 subagent_type/model 확인:
   각 tw-grid-*.md 에서 "Agent(" 블록 → subagent_type 없으면 ⚠️
   model 지정 없으면 ⚠️ (tier 차등 정책 위반)

⑥ 커맨드 파일 존재 확인:
   tw-grid.md / tw-grid-{init|discover|goals|loop|monitor|diagnose}.md (7개)
   누락 파일 → ❌
```

---

## Step DG-1: Score + Loop-history 수집

```
① Score 파일:
   Glob('{ARTIFACTS_ROOT}/**/*-score.json')
   ★ 라운드별 *-score-r1.json, *-score-r2.json 포함
   각 파일 Read → { goalId, stage, round, checks, categoryScores,
                    weightedScore, score, passed, loops, tier }
   goalId별로 rounds 배열로 그룹핑 (점수 추이 + 환각 의심 감지)

② Loop-history 수집:
   Glob('{ARTIFACTS_ROOT}/**/loop-history.json')
   각 파일 Read → iterations 배열 → 라운드별 결과 누적

③ Self-Review 누적 효과 측정:
   Glob('{GOALS_ROOT}/**/*-goals.json')
   → 각 Goal의 harnessReview 필드 수집
   → improvements / filesUpdated 카운트
```

---

## Step DG-2: Rubric 항목 실패율 분석

```
모든 score 파일의 checks 집계:
  checks[check_id].result = "YES" | "NO" | "N/A"

각 check_id별:
  total_evaluated = YES + NO
  fail_rate = NO / total_evaluated

위험 단계:
  - 🟢 정상     : fail_rate < 20%
  - 🟡 주의     : 20% ≤ fail_rate < 40%
  - 🟠 빈번실패 : 40% ≤ fail_rate < 60%
  - 🔴 심각     : 60% ≤ fail_rate

리포트:
  Stage별로 그룹핑 (specify / implement / verify)
  fail_rate 내림차순 정렬
  상위 5개 ⚠️ 표시
```

---

## Step DG-3: 동일 Goal 재시도 점수 추이

```
goalId별로 rounds 정렬 (r1 → r2 → r3):

패턴 감지:
  A. 점수 상승 (r1=70 → r2=85): 정상 학습 패턴
  B. 점수 정체 (r1=80 → r2=80 → r3=78): rubric/feedback 모호 의심
  C. 점수 하락 (r1=85 → r2=72): 에이전트 혼란 → 피드백 메시지 점검 필요
  D. 같은 check 반복 NO: feedback이 행동 가능하지 않음

리포트:
  패턴 B/C/D Goal → ⚠️ 출력 + 어느 check가 반복인지
```

---

## Step DG-4: Goal 위험 지표

```
state.json의 goalsIndex + 각 goals.json 분석:

지표:
  ① Loops 근접:
     stages.X.loops >= 2 (maxLoops=3 기준)
     → "🟠 {goalId}.{stage}: loops {n}/3 — 다음 실패 시 blocked"

  ② Stuck Goal:
     stages.X.lastRun 이후 7일+ 경과 + status="in_progress"
     → "🟡 {goalId}: {n}일 비활성"

  ③ Blocked:
     overallStatus="blocked"
     → "🔴 {goalId}: blocked — 사유 확인 필요"
     → findings/blocked/{goalId}-*.md 경로 출력

  ④ Tier-Threshold 불일치:
     goal.migrationImpact="high"인데 threshold가 95 미만
     → "⚠️ {goalId}: tier high인데 threshold {n}"
```

---

## Step DG-5: 자동 보완 효과 측정

```
implement-rubric의 자동 보완 패턴별:
  any 제거 / Wijmo import 제거 / ADR draft / number→구체 타입 / TODO 제거

성공률 = 자동 보완 후 PASS / 자동 보완 시도
실패율 높은 패턴 → ⚠️ "자동 보완 미작동 패턴 발견"

리포트:
  | 패턴            | 시도 | 성공 | 성공률 |
  |-----------------|------|------|--------|
  | any 제거        |   5  |   5  |  100%  |
  | Wijmo 제거      |   1  |   1  |  100%  |
  | ADR draft       |   3  |   2  |   67%  | ← ⚠️
```

---

## Step DG-6: 구체적 업데이트 제안 (suggest 옵션)

```
diagnose suggest 호출 시에만 출력:

🔴 심각 fail_rate check_id별:
  "다음 보강을 권장합니다:
   - check_id {id}
   - 현재 정의: '...' (rubric/specify-rubric.md 참조)
   - 실패 예시:
     - Goal {A}/r2: evidence='spec에 명시되어 있음' (구체성 부족)
     - Goal {B}/r1: evidence='AC가 3개 미만' (개수 명확)
   - 제안 추가 항목:
     - YES 기준: '~ 출처 태그(L0/L1/L2/L3/R-A/R-W) 포함되어야 한다'
     - NO 시 자동 피드백: '출처 태그 누락된 AC: {목록}'
   "

🟠 빈번실패 check_id별:
  유사 형태로 제안

자동 보완 미작동 패턴별:
  "implement-rubric.md의 자동 보완 항목 강화 제안:
   - 패턴 {name}
   - 현재 실패 사례: {목록}
   - 제안: '...' 추가"

⚠️ 환각 의심 패턴 (DG-7에서 발견):
  "다음 환각 탐지 항목을 rubric에 추가 권장:
   - '에이전트가 출력한 파일 경로가 실제로 존재하는가'
   - 'spec의 referenceEvidence 경로가 실제로 Read 가능한가'
   "

⚠️ 사용자 검토 후 본인이 직접 rubric/constraints.md 수정.
```

---

## Step DG-7: 환각 의심 패턴 탐지 (신규)

```
환각 시그널:
  ① 존재하지 않는 파일 참조:
     - spec.md의 referenceEvidence/implementFiles 경로 → Glob으로 존재 확인
     - 미존재 경로 → 환각 의심

  ② Coverage Verifier 결과 vs 실제 코드 불일치:
     - score.json의 evidence에 "..에서 확인됨" 적혀있는데
       해당 파일 Grep 결과 미존재
     - 5건 이상 누적 시 ⚠️

  ③ goalId/moduleId 오기:
     - score.json의 goalId가 canonical-modules.json/goals.json에 없음
     - → 환각 의심

  ④ 점수 부풀림 (Verifier 자기-bias):
     - 같은 Goal의 specify=98 / implement=98 / verify=97 인데
       loop-history에 NO 항목이 4개 이상 → score 산식 의심

  ⑤ Self-Review가 너무 자주 "개선 불필요" 반환:
     - 5회 연속 "개선 불필요" → Reviewer가 작동 안 하는지 점검
     (특히 fail_rate 높은 check가 있는데도 개선 불필요면 의심)

리포트:
  의심 사례별 1줄 요약 + 증거 파일 경로
  3건 이상이면 ⚠️ "환각 탐지 항목을 rubric에 추가 권장 (DG-6 suggest 참조)"
```

---

## Step DG-8: 출력 형식

```
╔══════════════════════════════════════════════════════════════════╗
║  tw-grid Diagnose — {YYYY-MM-DD HH:MM}                           ║
╚══════════════════════════════════════════════════════════════════╝

[DG-0 구조 일관성]
  ✅ 커맨드 파일 7개 전체 확인
  ✅ rubric check_id 전체 참조 확인
  ✅ constraints 전체 참조 확인
  ⚠️ Agent 호출 model 미지정: tw-grid-discover.md > Step D-1.L1

[DG-1 수집] Score 파일 {N}개 / Loop-history {M}개 / Self-Review {S}건

[DG-2 Rubric 항목 실패율]
  🔴 specify  C-03 (AC 출처 태그 누락)  fail: 67% (4/6)
  🟠 verify   C-02 (외관 보존)          fail: 50% (3/6)
  🟡 implement B-04 (any 제거)          fail: 25% (1/4)

[DG-3 재시도 점수 추이]
  ⚠️ Goal MOD-GRID-10/G-002: 정체 패턴 (85→84→82)
     반복 NO check: A-04(대응표), F-02(구현순서)

[DG-4 Goal 위험 지표]
  🟠 MOD-GRID-01/G-003.specify: loops 2/3
  🔴 MOD-GRID-09/G-001: blocked
     사유: findings/blocked/MOD-GRID-09-G-001-verify.md

[DG-5 자동 보완 효과]
  | 패턴              | 시도 | 성공 | 성공률 |
  |-------------------|------|------|--------|
  | any 제거          |   8  |   8  |  100%  |
  | Wijmo 제거        |   2  |   2  |  100%  |
  | ADR draft         |   4  |   2  |   50%  | ← ⚠️

[DG-7 환각 의심] {N}건
  ⚠️ Goal MOD-GRID-05/G-002 verify 결과:
     evidence="src/cells/DateCell.tsx 확인" 인데 파일 미존재
  ⚠️ Self-Review 5회 연속 "개선 불필요" — Reviewer 작동 점검 권장

[DG-6 suggest] (diagnose suggest 호출 시만)
  ...

권장:
  ▶ /tw-grid diagnose suggest    구체 수정안 보기
  ▶ findings/blocked/ 확인        blocked Goal 사유 검토
  ▶ Reviewer 프롬프트 보강       Self-Review 작동 점검
```

---

## C-15 Agent 위임

diagnose는 READ-ONLY 분석. Agent 호출 불필요 — 메인 세션이 직접 파일 읽고 분석/출력.

단, **suggest 옵션**은 권장 사항 도출에 추론이 필요하므로 Agent에 위임 가능:
```
Agent({ subagent_type: "general-purpose", model: "opus",
        description: "tw-grid diagnose suggest",
        prompt: "DG-1~DG-7 결과 분석 → 구체적 rubric/constraints 수정 제안 작성. 자동 수정은 안 함." })
```
