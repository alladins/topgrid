# SHARED-AGENT — Agent 위임 + 검증 분리 (universal SSoT)

> tw-mail / tw-harness / tw-grid 공통 agent 위임 + 검증 분리 룰.
>
> 출처 통합:
> - tw-mail: constraints C-25, C-29 + agents/_return-contract.md Implementer↔Verifier 분리
> - tw-harness: constraints C-20 (모든 Stage Agent 위임 의무)
> - tw-grid: constraints C-11 (Verifier 독립), C-15 (Agent 위임), C-36 (Implementer score JSON 금지)

---

## §1. 모든 Stage 작업은 Agent 위임 의무

`/tw-{harness}` 또는 `/tw-{harness} loop` 등 모든 호출 시 **메인은 직접 작업 금지**. 모든 Stage(SPECIFY/IMPLEMENT/VERIFY/Self-Review)는 Agent 도구로 위임.

### §1.1 Stage별 권장 모델
| Stage | 모델 | 이유 |
|-------|------|------|
| SPECIFY | opus | spec 품질 = 전체 품질 cascading |
| IMPLEMENT | sonnet (기본) | 보안/security tier → opus |
| VERIFY (Coverage Verifier) | opus | 독립성 + 정확도 필수 |
| Self-Review (Reviewer) | opus | 회고 품질 |

### §1.2 메인이 직접 하지 않는 작업
- 코드 작성 / 파일 수정 (단 단일 라인 트리비얼 수정은 예외)
- spec.md / score.json 작성
- rubric 채점

### §1.3 메인이 직접 하는 작업
- Agent 호출 + 결과 수신
- Agent 보고 검증 (§3 메인 검증 의무)
- 사용자 결정 게이트 발동 (drift detection 등)
- state.json sync
- 산출물 파일 위치 / link 검증

### §1.4 증거
- **tw-harness 2026-05-12**: 메인 직접 점검 vs Agent 위임 검증 점수 차이 — MOD-02 100→57.1, MOD-08 100→88.89. 메인 sampling 은 정확도 결함 유발.

---

## §2. Implementer ↔ Verifier 분리 의무

### §2.1 Implementer 작성물 경계
**Implementer agent 는 `implement-score.json` 만 작성한다. `verify-score.json` 작성 절대 금지.**

이유: VERIFY 단계는 *독립 평가자(별도 Verifier agent, 권장 opus)* 가 동일 산출물을 재실행 + 재채점하여 self-eval 편향 차단하는 게이트. 같은 agent 가 두 score 작성 시 **자기 모순 검출 메커니즘 자체가 결손**.

### §2.2 자기 Goal stages 노드만 수정
**Implementer agent 는 자신 Goal (`{goalId}`) 의 `stages` 노드만 수정한다. 같은 goals.json 안 다른 Goal stages 직접 수정·이동·복사 절대 금지.** ([SHARED-DRIFT/§7](drift-spec.md#7-goalsjson-patch-시-surgical-replacement-의무))

### §2.3 위반 시
Self-Review 가 "Implementer↔Verifier 분리 위반" 보고 + 해당 verify-score.json 신뢰도 *재평가 의무*.

### §2.4 증거
- **tw-mail 2026-05-16 G-MAIL-12-002**: sonnet Implementer가 implement-score.json + verify-score.json 둘 다 작성 보고. opus Verifier 독립 호출 미실시. weighted 100.0 점수의 self-eval 신뢰도 결손.
- **tw-grid C-36**: 본 분리를 명시적으로 constraint 화.

---

## §3. 메인 검증 의무 (Agent 보고 자체 검증 금지)

**모든 Implementer / Spec Writer agent 의 "성공/PASS" 보고는 메인이 직접 build/test 재실행으로 검증 의무.** agent 보고만으로 작업 충족 종료 선언 금지.

### §3.1 검증 절차
1. Agent 가 보고한 build 명령 ([SHARED-BUILD/§1](build-commands.md)) 을 메인이 *직접 PowerShell/Bash로 재실행*.
2. 출력 결과를 메인이 직접 읽어 PASS/FAIL/error message 확인.
3. Agent 보고 ↔ 실제 결과 불일치 발견 시 즉시 *거짓 보고* 분류 + agent 재위임 (동일 agent 재호출 비추천).
4. Verify 단계 진입 전 모든 implement-stage agent 보고를 메인이 검증 완료.

### §3.2 검증 면제
- 파일 신규 생성/단순 텍스트 편집 — Read 로 충분.
- 정적 분석 (lint, formatter) — 빌드와 별개.

### §3.3 증거
- **tw-mail 2026-05-13 G-MAIL-15-008 E-05**: Implementer agent (sonnet) "3/3 PASS" 보고. Verifier agent (opus) 가 검증 차원에서 동일 테스트 재실행 → **3/3 FAIL** (`sha256_password` 인증 plugin 불일치). Agent 보고가 거짓이었음.

---

## §4. Single-Cycle Agent 적용 기준 (효율 결정)

**Goal 전 사이클 (SPECIFY → IMPLEMENT → VERIFY → Self-Review) 을 단일 agent (opus) 호출로 묶을 수 있는 조건**:

충족 조건 (AND):
1. 코드 변경 예상 < 10 파일 (BE + FE 합산)
2. 신규 라이브러리 도입 없음
3. 기존 인프라 (rubric/policies/constraints/decisions) 와 충돌 없는 영역
4. dependsOn Goal 모두 completed 상태

비충족 시 분리 사이클 의무:
- SPECIFY agent → 사용자 결정 게이트 → IMPLEMENT agent → 메인 검증 → VERIFY agent → Self-Review

### §4.1 효율 데이터 (tw-mail N=6, 2026-05-13)
- Single-cycle 6 Goal 1차 100 PASS, agent 호출 ~3개/Goal
- 분리 사이클: ~6개/Goal (~50% 절감)
- 단 정직성 위험은 §3 메인 검증 강화로 상쇄

### §4.2 위반
강제 X — 효율 결정. Self-Review 권고만.

---

## §5. Reviewer Agent (Self-Review)

Goal 완료 시 Reviewer Agent (opus) 실행:
- 반복 실패한 rubric 항목 검출
- 모호한 spec 패턴
- decision log 중 policies/constraints 반영 후보
- 도메인 패턴 catalog 추가 후보

개선 적용 (추가/명확화만 — 삭제 금지) 후 goals.json 에 기록.

---

## §6. 사용자 결정 surface 의무 + advisor 우선 (2026-05-18 신설)

### §6.1 문제 인식

tw-grid Wave 1-5 + 잔존 + R-4 + B 누적 17 ADR 진행 중, agent들이 **사용자에게 surface한 결정 수**가 과다 (~30+건). 대부분은 **advisor 호출 + grep/probe 만으로 결정 가능**한 사항이었음. 사용자 인지 부하 + 진행 속도 저하.

### §6.2 사용자 surface 금지 (advisor + agent 자체 결정 의무)

다음은 **사용자에게 묻지 말고 advisor / agent 자체 결정**:

| 범주 | 예시 | 결정 방법 |
|------|------|----------|
| **옵션 비교** | "X-A / X-B / X-C 중 어느 것?" (trade-off 매트릭스 명확) | advisor + spec writer 권고 + probe |
| **probe 검증** | "이 패턴이 typecheck 통과하나?" | `__probe__/*.ts` + `npx tsc --noEmit` |
| **매트릭스 정정** | "코드 SSoT vs 매트릭스 가정 어느 게 정확?" | grep 으로 코드 fact 확인 후 매트릭스 정정 |
| **LOC framing** | "절감 N vs 추가 N net?" | 코드 변경 line count 직접 |
| **semver 차원 분리** | "minor / major 결정?" | POL-COMPAT §3 룰 적용 + breaking change 정의 |
| **사용처 인벤토리** | "N건 사용 중?" | `Grep` recursive + 결과 정확 인용 |
| **dependency 정합** | "peer vs dev vs dep?" | src import 사실 확인 (production code grep) |
| **placeholder 차별화** | "stories 가 runtime 가능한가?" | typecheck + build-storybook 실 실행 |

### §6.3 사용자 surface 의무 (critical 5 분류만)

다음은 **사용자에게 surface 의무**:

| 분류 | 정의 | 예시 |
|------|------|------|
| **A. 비즈니스 결정** | 매출/UX/시장 신호 영향 | License enforcement 정책 (watermark vs throw vs warn), pricing tier, deprecation timeline |
| **B. 외부 사용자 영향** | semver breaking, public API rename | Type rename major bump, deprecation alias 1 cycle vs 즉시 |
| **C. 비용 발생** | SaaS 구독, infra 변경, 토큰 소비 큰 작업 | Chromatic 도입 vs Playwright OSS, cross-harness cascade (3-4h × N) |
| **D. 비가역 작업** | rollback 불가 / 외부 노출 | `npm publish`, `git push --force`, DB DROP, public release |
| **E. 사용자 환경 의존** | OS / CI / 외부 인프라 환경 | CI ubuntu vs WSL2 vs Windows 로컬, Docker 미설치 환경 |

### §6.4 의문 시 advisor 우선

agent prompt 에 다음 명시 의무:
```
사용자 surface 전에 advisor 호출 의무. advisor 가 옵션 비교 / probe 검증 / 매트릭스 정정
지원 가능. critical 5 분류 (A 비즈니스 / B 외부 사용자 / C 비용 / D 비가역 / E 환경)
에 해당 안 하면 advisor + 자체 결정 후 stdout 보고.
```

### §6.5 위반 시

Self-Review 가 "사용자 결정 과다 surface" 보고 의무. 다음 사이클부터:
- 사용자 결정 후보를 stdout 에 모두 명시
- 각 후보에 분류 (advisor / critical 5) 태그
- critical 외 후보는 advisor 자체 결정 + 사유 명시

### §6.6 증거

**tw-grid Wave 1-5 + 잔존 + R-4 + B 사례 (2026-05-17~18)**:
- agent surface 결정 ~30+건 중 **약 60% (18-20건)** 가 advisor + grep + probe 로 충분히 결정 가능했음 (예: OQ-001 코드 vs 매트릭스 정정 = grep 1 line으로 끝, ADR-014 5 cell rename 시각 영향 = LinkCell.tsx:44 1 line 읽기로 시각 변화 0 확인, ADR-012 P-1/P-2/P-4 옵션 = spec writer 권고 + 사용처 N=1 사실로 P-1 자명).
- critical 5 분류 해당: ADR-001 license enforcement 정책 (A) + ADR-006 deprecation timeline (B) + Storybook 환경 (E) + npm publish 권한 (D) — **나머지는 사용자 결정 없이 진행 가능**.

### §6.7 cross-harness 적용

본 §6 은 tw-mail / tw-harness 도 적용. 모든 spec writer / implementer / planner agent prompt 에 §6.4 표준 문장 포함 의무.
