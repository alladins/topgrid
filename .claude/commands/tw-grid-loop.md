# tw-grid-loop — Phase 3~5 자율 루프 v1.0

> **호출**: `/tw-grid loop [moduleId] [area]` 또는 `/tw-grid --auto`
> **목적**: Goal 단위 SPECIFY → IMPLEMENT → VERIFY 3단계 + Self-Review를 자율 실행.
> **차이**: tw-mail loop와 동일 구조. tw-grid 특화는 호환성(C-17 시각 회귀) + 마이그레이션 진행률(D 축).

---

## 호출 방식

```
── 자율 루프 ─────────────────────────────────────────────────────
/tw-grid                          → 다음 pending Goal·단계 자동 선택 (1회)
/tw-grid --auto                   → 완료/blocked까지 연속 실행
/tw-grid loop MOD-GRID-XX         → 특정 모듈 자율 루프
/tw-grid loop MOD-GRID-XX {area}  → 특정 영역만
/tw-grid loop --tier high         → high tier Goal만
/tw-grid loop --phase abstraction → 특정 phase만
```

---

## 루프 종료 조건

```
state.json의 모든 Goal이 overallStatus == "completed" 또는 "blocked" → 자동 종료.

또는:
- AskUserQuestion 체크포인트 (있는 경우)
- maxLoopsPerStage(3) 초과 Goal 3개 연속 → 일시 정지
- 사용자 Ctrl+C
```

---

## Step L-0: 상태 + 헤더 출력

```
state.json + canonical-modules.json 읽기
세션 재개 시 in_progress Goal 자동 감지

╔══════════════════════════════════════════════════════════════════╗
║  tw-grid LOOP v1.0 — 자율 루프 시작                              ║
║  threshold: high 95 / medium 90 / low 85                         ║
║  3단계 × {N} Goal + Self-Review                                  ║
║  ⚠️ 컨텍스트 압축 시 자동 중단 → state.json 기반 재개 가능        ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Step L-1: 다음 대상 선택

```
우선순위:
① in_progress Goal (세션 재개)
② pending 중 tier 순 (high → medium → low)
③ 같은 tier 내 Priority 순 (P0 > P1 > P2)
④ 같은 Priority 내 dependsOn 충족 여부
⑤ 같은 의존성 내 moduleId/goalId 오름차순

선택 후:
- goal.stages.specify.status가 "pending"/"in_progress" → specify
- specify.status="done" + implement="pending"/"in_progress" → implement
- implement.status="done" + verify="pending"/"in_progress" → verify
- 모두 "done" → overallStatus="completed" → 다음 Goal
```

---

## Step L-2: SPECIFY 단계

### Agent 호출 (model: tier 차등 — high=opus, medium/low=sonnet)

```
Agent({
  subagent_type: "general-purpose",
  model: goal.migrationImpact === "high" ? "opus" : "sonnet",
  description: `Specify: ${goalId} ${title}`,
  prompt: `[tw-grid.md Step 3 SPECIFY 템플릿 전체 + Goal JSON + 피드백]`
})
```

### Coverage Verifier (model: haiku)

```
Agent({
  subagent_type: "general-purpose",
  model: "haiku",
  prompt: `[tw-grid.md Step 4 Coverage Verifier 템플릿 + spec 파일 경로]`
})
```

### 점수 판정

```
spec_score = Coverage Verifier 반환
threshold = tier별 95/90/85

PASS:
  → goal.stages.specify = { status: "done", score, lastRun }
  → goal.stages.implement.status = "pending"
  → loop-history.json 기록

FAIL:
  → goal.stages.specify.loops += 1
  → IF loops >= 3:
       → status = "blocked"
       → findings/blocked/{goalId}-specify.md 작성
       → goal.overallStatus = "blocked"
       → 다음 Goal
  → ELSE:
       → status = "in_progress"
       → feedback 누적
       → 같은 stage 재시도
```

---

## Step L-3: IMPLEMENT 단계

### Agent 호출

```
Agent({
  subagent_type: "general-purpose",
  model: goal.migrationImpact === "high" ? "opus" : "sonnet",
  description: `Implement: ${goalId}`,
  prompt: `[tw-grid.md Step 3 IMPLEMENT 템플릿]`
})
```

### Implementer 추가 검증 (자동)

```
1. npx tsc --noEmit (패키지 + tw-framework-front) → 0 errors 확인
2. vite build → 통과 확인
3. size-limit → 한도 내 확인
4. 영향 사용처 23개 tsc → 0 errors 확인 (C-01 호환성)
5. Wijmo import grep → 0건 확인 (C-16)
```

### Coverage Verifier + 점수 판정 (위 SPECIFY와 동일)

---

## Step L-4: VERIFY 단계

### Verifier Agent (model: opus — 5축 가중 판정)

```
Agent({
  subagent_type: "general-purpose",
  model: "opus",
  description: `Verify: ${goalId}`,
  prompt: `[tw-grid.md Step 3 VERIFY 템플릿]`
})
```

Verifier 자체가 verifier 역할 — 별도 Coverage Verifier 호출 없음.

### 5축 가중 계산

```javascript
const weights = {
  high:   { A: 10, B: 15, C: 40, D: 25, E: 10 },
  medium: { A: 15, B: 20, C: 30, D: 20, E: 15 },
  low:    { A: 25, B: 25, C: 20, D: 15, E: 15 },
};

const w = weights[goal.migrationImpact];
const score = (cs.A * w.A + cs.B * w.B + cs.C * w.C + cs.D * w.D + cs.E * w.E) / 100;
```

### 점수 판정 + Goal 완료 처리

```
PASS:
  → goal.stages.verify = { status: "done", score, lastRun, weightedScore }
  → goal.overallStatus = "completed"
  → state.json summary.completed += 1
  → loop-history.json 기록
  → ★ Step L-5 Self-Review 자동 호출

FAIL:
  → loops += 1, 재시도 또는 blocked
```

---

## Step L-5: Self-Review (Goal 완료 OR Blocked 시 필수)

★ v1.0.1 변경: PASS뿐 아니라 **blocked 시에도 호출**. 환각/반복 실패 패턴이 가장 많이 발견되는 지점이 blocked 직전 — 다음 Goal부터 학습 적용.

### 호출 시점
| 조건 | Reviewer 모드 | 우선 분석 항목 |
|------|-------------|--------------|
| Goal `completed` (모든 stage PASS) | **success-review** | 어느 점이 잘 됐나 / 패턴 재사용 / 새 reference 추가 |
| Stage `blocked` (loops ≥ 3) | **failure-review** | **왜 반복 실패했나 / 환각 신호 / feedback 모호성** |

### Reviewer Agent (model: opus)

```
Agent({
  subagent_type: "general-purpose",
  model: "opus",
  description: `Self-Review (${mode}): ${goalId}`,
  prompt: `당신은 tw-grid Harness Reviewer입니다.
  모드: ${mode}  (success-review | failure-review)

  ## 임무
  방금 ${mode === "success-review" ? "완료된" : "blocked된"} Goal의 score 분석 + rubric/constraints/references 보강.

  ## 사전 읽기
  1. artifacts/{moduleId}/{area}/{goalId}-{stage}-score.json (3개 또는 일부)
  2. spec.md (있는 경우)
  3. goals.json의 해당 Goal feedback 이력 + loops 추이
  4. (failure-review만) loop-history.json — 라운드별 NO check 패턴

  ## 분석 항목 (failure-review 강화 — blocked 시 우선)
  ★ 환각 시그널 점검 (필수):
    - spec/code에 명시한 파일 경로가 실제 존재하는가? (Glob 검증)
    - referenceEvidence의 L0~L3 경로가 실제 Read 가능한가?
    - score.json의 evidence가 실제 파일과 일치하는가? (Grep 1건 샘플)
    - 같은 check가 3라운드 연속 NO이면서 feedback이 매번 동일했나?
      → feedback이 행동 가능하지 않음(actionable 부족) 의심

  ★ feedback 명확성 점검:
    - "더 구체적으로 작성" 같은 모호한 지시 → 행동 가능한 형태로 재작성 권장
    - "AC가 부족함" → "AC 3개 미만(현재 N개), 출처 태그(L0/L1/L2/L3) 누락"

  ★ rubric/constraints 보강 (PASS/blocked 공통):
    - 어느 rubric 항목이 반복 실패?
    - AG Grid/Wijmo 참조 분석에 추가할 새 패턴?
    - 에이전트 추측 오류 (constraints에 명시되지 않은 가정)?

  ## 개선 적용 (추가/명확화만 — 삭제·완화 절대 금지)
  - rubric/specify|implement|verify-rubric.md 항목 추가 또는 NO 기준 명확화
  - constraints.md 새 C 항목 (드물게, 신규 위반 패턴 발견 시)
  - references/*.md 패턴 보강 (실패 사례 → 정답 사례 추가)
  - decisions/MOD-GRID-XX-decisions.md ADR (구조적 결정 보존)
  - failure-review의 경우: findings/blocked/{goalId}-{stage}.md에
    "다음 Goal 시도 시 주의 사항" 섹션 추가

  ## 반환
  - mode + 개선 요약 1~5줄 (또는 "개선 불필요")
  - 적용된 파일 목록
  - failure-review에서 환각 의심 발견 시: "⚠️ 환각 의심 N건 → /tw-grid diagnose hallucination 권장"`
})
```

### Goal/Findings 기록

PASS 시 — Goal에 `harnessReview`:
```json
{
  "mode": "success-review",
  "completedAt": "{YYYY-MM-DD HH:MM}",
  "improvements": [...],
  "filesUpdated": [...]
}
```

Blocked 시 — `findings/blocked/{goalId}-{stage}.md`에 append:
```markdown
## Reviewer 분석 ({YYYY-MM-DD HH:MM})
- 환각 의심: {예/아니오} ({N}건)
- 반복 실패 check: {C-id 목록}
- feedback 명확성 점검 결과: ...
- 다음 Goal 시도 시 주의:
  - ...
- 개선 적용된 파일: ...
```

### 누적 환각 의심 게이트

failure-review에서 환각 의심이 1회 발견 → findings/hallucination-log.md에 append.
이 로그가 3건 이상 누적되면 **자율 루프 일시 정지** + 사용자 알림:
```
⚠️ 환각 의심 누적 3건. /tw-grid diagnose hallucination 실행 권장.
   계속 진행 시 /tw-grid --auto 재호출.
```

---

## Step L-6: State Sync 자동 호출

```bash
node .claude/tw-grid/tools/grid-state-sync.mjs
```

출력 비표시. 실패해도 본 작업 성공 처리.

---

## 사용처 마이그레이션 특이 처리 (MOD-GRID-17)

```
MOD-GRID-17의 Goal은 영향 사용처 5개씩 그룹핑 (C-19):
- G-001: BaseGrid 사용처 5개 마이그레이션
- G-002: EditableGrid 사용처 5개
- G-003: ChangeTrackingGrid 사용처 5개
- ...

각 Goal의 SPECIFY는 마이그레이션 영향 분석 (5개 파일 진단):
- 현 props 사용 패턴
- 새 API 매핑
- 시각 차이 예측

IMPLEMENT는 5개 파일 동시 변경:
- tsc 통과 보장 (deprecated alias 활용)
- Storybook story 추가 (시각 회귀 비교)

VERIFY는 5축 중 C(호환성) 40%, D(마이그레이션 진행률) 25% 비중:
- C-01: 5개 파일 tsc 통과
- C-02: 외관 보존 (Storybook 비교)
- D-01: 5/5 = 100% 마이그레이션 비율
```

---

## Step L-7: 루프 안전장치

| 상황 | 처리 |
|------|------|
| 같은 Goal 3회 연속 blocked | 일시 정지 + 사용자 알림 |
| 컨텍스트 압축 감지 | "세션 압축 → state.json 저장 완료, `/tw-grid` 재실행 가능" |
| tsc 실패 + 자동 보완 불가 | blocked 처리 + findings/blocked/ 기록 |
| Wijmo import 발견 (C-16) | 즉시 blocked + 위반 사항 명시 |
| 번들 크기 +100KB 초과 (C-21) | 사용자 승인 요청 (AskUserQuestion) |

---

## Step L-8: 루프 종료 보고

```
모든 Goal completed 또는 blocked:

╔══════════════════════════════════════════════════════════════════╗
║  tw-grid LOOP 완료                                                ║
╚══════════════════════════════════════════════════════════════════╝

  ✅ 완료: {N}/{총} Goal
  🚫 blocked: {N}개 (수동 처리 필요)
  
  Phase별:
   - infra: {n}/10
   - abstraction: {n}/20
   - critical-gap: {n}/12
   - wijmo-class: {n}/25
   - enhancement: {n}/3
   - migration: {n}/12

  Tier별 합격 시점:
   - high: 평균 {N}회 시도
   - medium: 평균 {N}회
   - low: 평균 {N}회
  
  Self-Review 적용:
   - rubric 개선 {N}건
   - constraints 추가 {N}건
   - references 보강 {N}건
   - ADR 추가 {N}건

  Documented Deviations: {N}건
  
  📋 보고서: .claude/tw-grid/reports/loop-{YYYY-MM-DD}.md
  👉 다음: /tw-grid monitor 또는 /tw-grid package all
```

---

## loop-history.json 형식

```json
{
  "module": "MOD-GRID-XX",
  "area": "{area}",
  "startedAt": "{YYYY-MM-DD HH:MM}",
  "sessions": [
    {
      "sessionStart": "{ISO}",
      "iterations": [
        {
          "goalId": "G-001",
          "specifyAttempts": [
            { "round": 1, "startedAt": "...", "result": "PASS|FAIL|ERROR", "score": N, "failedChecks": [...] }
          ],
          "implementAttempts": [...],
          "verifyAttempts": [...],
          "harnessReview": { "improvements": [...], "filesUpdated": [...] },
          "finalStatus": "completed|blocked"
        }
      ],
      "endedAt": "{ISO}",
      "completed": true|false
    }
  ]
}
```

---

## C-15 Agent 위임 의무 재확인

**메인 세션 직접 작업 금지**:
- spec.md 직접 작성 ❌
- 코드 직접 작성 ❌
- score JSON 직접 작성 ❌
- 5축 가중 직접 계산 ❌ (Verifier Agent에 위임)

**메인 역할**:
- Goal 선택 (Step L-1)
- Agent 호출 (Step L-2~4)
- 점수 판정 + 루프 제어 (Step L-5)
- state.json 갱신 + loop-history 기록
