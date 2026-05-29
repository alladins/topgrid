# Agent Return Contract (tw-grid 공통)

각 agent 는 **저장된 파일의 절대 경로만 반환**. 파일 본문 출력 금지.

```
{stage}-score.json: <path>
산출물: <path>
요약: <2-3줄, 점수 또는 PASS/FAIL>
```

## 점수 JSON 공통 필드

```json
{
  "goalId": "G-NNN",
  "stage": "specify | implement | verify",
  "rubricVersion": "1.x",
  "checks": { "<id>": { "result": "YES | NO | N/A", "evidence": "..." } },
  "yesCount": <int>,
  "noCount": <int>,
  "naCount": <int>,
  "denominator": <int>,
  "score": <float>,
  "threshold": 85,
  "passed": <bool>,
  "failedChecks": ["<id>", ...],
  "feedback": ["..."],
  "promptSpecDrift": [{ "field": "...", "promptValue": "...", "specValue": "...", "resolution": "spec applied" }]
}
```

## 저장 위치
- spec.md: `{ARTIFACTS_ROOT}/{MOD-GRID-NN}/{menu}/{goalId}-spec.md`
- {stage}-score.json: 같은 디렉토리

## Implementer ↔ Verifier 분리
→ [SHARED-AGENT/§2](../../policies/_shared/agent-delegation.md#2-implementer-verifier-분리-의무) + [POL-SPEC-DISC/§5](../policies/spec-discipline.md#5-implementer-score-json-작성-금지)

Implementer 는 `implement-score.json` 도 작성 금지. Coverage Verifier 단독 작성.

## Coverage Verifier 산식 자가검증
→ [POL-SPEC-DISC/§2](../policies/spec-discipline.md#2-coverage-verifier-산식-자가검증)

Verifier 는 점수 계산 직후 N/A 분모/failedChecks 무결성/카테고리 합계/점수 재검산 의무.
