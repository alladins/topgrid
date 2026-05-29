# POL-SPEC-DISC — Spec 권위 + Score 산식 자가검증 + Path Prefix + Implementer 분리 (SSoT)

> Spec 본문 권위 + Coverage Verifier 자가검증 + implementFiles path prefix + Spec Writer self-check.
>
> 출처 통합: constraints C-26 + C-27 + C-28 + C-33 + C-35 + C-36 (tw-grid 특화).

---

## §1. Spec 권위 + prompt-spec drift 보고

→ [SHARED-DRIFT/§1](../../policies/_shared/drift-spec.md#1-spec-권위-spec-authority) 가 universal base.

### §1.1 tw-grid 특화 — Main Prompt Code Block Subordination
**메인 IMPLEMENT prompt 의 코드 블록은 example/guidance 한정**. Spec 본문이 단일 권위.

- 메인 prompt 코드 ↔ Spec 코드 불일치 시 → Spec 우선
- 메인 prompt 의 "예시 코드"를 그대로 implement 금지 (참고만)

### §1.2 prompt-spec drift 보고 의무
메인 명령 또는 agent prompt 본문에 spec 과 다른 내용 발견 시:
1. 즉시 작업 중단
2. drift 항목 보고
3. 사용자 결정: spec 갱신 또는 prompt 갱신

silently 진행 절대 금지.

---

## §2. Coverage Verifier 산식 자가검증

### §2.1 의무 검산 (점수 계산 직후)

1. **N/A 분모 제외 확인**:
   - `denominator == checks 중 result != "N/A" 인 항목 수`
   - 카테고리별 `categoryScore = YES / (YES + NO) × 100` — N/A 절대 미포함 (verify)

2. **failedChecks 무결성 확인**:
   - `failedChecks` 배열은 NO 결과만 포함. N/A 절대 포함 금지.

3. **카테고리 합계 ↔ rubric 총항목 일치 확인**:
   - specify: A+B+C+D+E+F+G = rubric 정의 (현재 시점 확인)
   - implement: A+B+C+D+E = rubric 정의
   - verify: A+B+C+D+E = rubric 정의
   - 불일치 시 rubric 항목 누락 또는 환각 의심.

4. **점수 산식 재검산**:
   - specify/implement: `score × denominator / 100 == yesCount` (소수점 오차 ±0.5 허용)

### §2.2 위반 시
Coverage Verifier 보고에 검산 실패 표시. 메인 재실행 또는 사용자 결정 게이트.

---

## §3. goals.json implementFiles 경로 prefix 정합성

### §3.1 의무 (Discover 단계 데이터 무결성)
`implementFiles` 배열의 모든 경로는 다음 prefix 중 하나로 시작:
- `packages/{pkg-name}/src/...`
- `apps/{app-name}/src/...`
- `references/...` (분석 목적만)
- `.claude/tw-grid/...` (산출물)

### §3.2 금지
- 상대 경로 (`../`, `./`)
- 절대 경로 (`D:\...`, `/c/...`)
- prefix 가 없는 ambiguous path

### §3.3 검증
- Discover agent 가 신규 Goal 작성 시 prefix 검증 통과 필수
- Spec Writer 가 implementFiles 갱신 시 동일 검증

---

## §4. Spec Writer Self-Check — Same-Function Signature + Import Consistency

### §4.1 의무
Spec Writer 가 동일 함수에 대해 여러 곳에서 signature 정의 시 일관성 의무:
- 함수 시그니처 (parameters, return type) 동일
- import 경로 일관 (re-export 경로 통일)

### §4.2 금지
- 같은 함수가 spec 안에서 다른 시그니처로 인용

### §4.3 출처
- 2026-05-15 MOD-GRID-99-A/G-001 — 신설

---

## §5. Implementer Score JSON 작성 금지

→ [SHARED-AGENT/§2.1](../../policies/_shared/agent-delegation.md#21-implementer-작성물-경계) 가 universal base.

### §5.1 tw-grid 특화 명시 (2026-05-15 MOD-GRID-99-A/G-002 신설)
- Implementer 는 `implement-score.json` 도 작성 금지
- Coverage Verifier 단독 작성 권한

### §5.2 이유
- self-eval 편향 차단
- Implementer 보고는 메인이 직접 검증 ([SHARED-AGENT/§3](../../policies/_shared/agent-delegation.md#3-메인-검증-의무-agent-보고-자체-검증-금지))

---

## §6. 검증

### §6.1 위반 시 처리
- §1 위반: silently 진행 → Self-Review 보고 + 해당 stage NO
- §2 위반: Coverage Verifier 재실행 또는 메인 재계산
- §3 위반: Discover agent 재실행
- §4 위반: Spec 재작성
- §5 위반: Implementer 작업 결과 재평가
