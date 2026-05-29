# 70-spec-discipline — Spec 권위 + Score 자가검증 + Path Prefix + Implementer 분리

본 카테고리는 [`POL-SPEC-DISC`](../policies/spec-discipline.md) 으로 SSoT 추출됨.

---

## C-26: Coverage Verifier 산식 자기-검증 의무

→ **SSoT**: [POL-SPEC-DISC/§2](../policies/spec-discipline.md#2-coverage-verifier-산식-자가검증)
*요약*: N/A 분모 제외 + failedChecks 무결성 + 카테고리 합계 + 점수 재검산.

---

## C-27: Spec 권위 — 메인 prompt-spec drift 보고 의무

→ **SSoT**: [POL-SPEC-DISC/§1](../policies/spec-discipline.md#1-spec-권위-prompt-spec-drift-보고) + [SHARED-DRIFT/§1](../../policies/_shared/drift-spec.md#1-spec-권위-spec-authority)
*요약*: prompt vs spec 충돌 시 spec 우선. drift `promptSpecDrift[]` 필드 보고 의무.

---

## C-28: goals.json implementFiles 경로 prefix 정합성

→ **SSoT**: [POL-SPEC-DISC/§3](../policies/spec-discipline.md#3-goalsjson-implementfiles-경로-prefix-정합성)
*요약*: monorepo 패키지 경로 prefix 강제. TOMIS 내부 prefix 금지.

---

## C-30: Spec Truth Table Discipline

→ **SSoT**: 본 카테고리 자체 (POL-SPEC-DISC 에 통합 가능 — §1 spec authority 확장)
*요약*: spec 본문 "재결정/대체/변경" 키워드 직후 최종 implementFiles 표 동기 갱신 의무. Implementer 는 최종 표 권위 우선 + 본문 모순 보고. Prose 도 권위 영역 포함.

본 항목은 일회성으로 자체 유지하되, spec-writer 가 spec 작성 시 self-check 의무로 인지.

---

## C-33: 메인 IMPLEMENT prompt 코드 블록은 example 한정

→ **SSoT**: [POL-SPEC-DISC/§1.1](../policies/spec-discipline.md#11-tw-grid-특화-main-prompt-code-block-subordination)
*요약*: 메인 prompt 코드 블록은 example/guidance. spec 본문 단일 권위. 충돌 시 spec 우선.

---

## C-35: Spec Writer Self-Check — Same-Function Signature + Import Consistency

→ **SSoT**: [POL-SPEC-DISC/§4](../policies/spec-discipline.md#4-spec-writer-self-check-same-function-signature-import-consistency)
*요약*: 동일 함수가 spec 안에서 다른 시그니처/import 경로로 인용 금지.

---

## C-36: Implementer Score JSON 작성 금지

→ **SSoT**: [POL-SPEC-DISC/§5](../policies/spec-discipline.md#5-implementer-score-json-작성-금지) + [SHARED-AGENT/§2.1](../../policies/_shared/agent-delegation.md#21-implementer-작성물-경계)
*요약*: Implementer 는 `implement-score.json` 도 작성 금지. Coverage Verifier 단독 작성 권한.
