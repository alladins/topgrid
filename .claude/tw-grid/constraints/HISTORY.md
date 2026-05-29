# tw-grid Constraints History — 출처 인용

## C-26 (Score Formula Self-Verification)

- **2026-05-13 G-002 specify**: 1차 Verifier 가 N/A 항목을 분모에 포함하여 정상 100 을 79.3 으로 false-fail. 새 Verifier 호출 후 정정.

## C-27 (Spec Authority + Drift Reporting)

- **2026-05-13 G-003 implement 1차**: 메인 prompt 에 `grid-renderers` peer 누락 + `.size-limit.json` 한도 불일치. Implementer prompt 그대로 실행 + drift 보고 0건. Coverage Verifier 가 A-02 + E-01 NO 처리 → 75/90 FAIL.

## C-28 (Path Prefix)

- **2026-05-14 G-001**: discover 산출 `wrapper-goals.json` `implementFiles[0]` = TOMIS prefix (잘못됨). 실제 monorepo 경로. spec writer D2 결정으로 정정. 17 모듈 잠재 위험 → C-28 promotion.

## C-29 (exactOptionalPropertyTypes)

- G-003 ADR-MOD-GRID-01-004 (1 hit)
- G-004 ADR-MOD-GRID-01-005 (2 occurrences)
- G-005 ADR-MOD-GRID-01-006 (3 occurrences = policy 진입)

## C-30 (Spec Truth Table Discipline)

- **2026-05-14 G-001 spec**: L383 "buildTableOptions.ts 수정함" 재결정 ↔ L385-393 최종 표에 buildTableOptions.ts 행 누락. 1차 Verifier 미검출. Implementer 가 최종 표 권위 채택 → wire-up 누락 → verify B-03 NO → 1 loop 낭비.

## C-31 (Functional Wiring Audit)

- **2026-05-14 G-001 implement loop 1**: `buildPaginationOptions.ts` 생성 + export 했으나 `buildTableOptions.ts` 에서 wiring 0건. dead code → 1 loop 낭비.

## C-32 (Pure Helpers + React Shell)

- **2026-05-14 MOD-GRID-10/G-002**: `internal/changeMap.ts` (327 LOC, 7 helpers, React 0) + `useChangeTracking.ts` (221 LOC, useReducer + 8 useCallback) 분리. monorepo vitest 미설정 환경에서도 helper 검증 가능.

## C-33 (Main Prompt Code Block Subordination)

- **2026-05-15 G-003 implement 1차**: 메인 prompt 에 spec D4/D5/D6/EC-02/EC-05 와 어긋난 코드 블록 주입. Implementer prompt 우선 적용 → drift 6건 → 73.9 FAIL.

### ⚠️ C-33 ID collision (2026-05-17 발견)

ADR-MOD-GRID-00-012 (Pro 패키지 license stub 정책, line 637/650/676/692/701/706/707/712) 가 **별도 의미의 "C-33"** 을 인용하나, 본 constraints.md 에 그 항목은 정식 추가된 적 없음 — ADR 본문 cross-reference 만 존재.

- **ADR-MOD-GRID-00-012 의 "C-33" (transitional Pro license stub)**: 2026-05-17 Sunset 완료 (Amendment 2). **@deprecated** — 향후 인용 금지. ADR-MOD-GRID-00-012 본문 자체 (Sunset 완료) 가 해당 정책의 SSoT.
- **현 70-spec-discipline.md 의 C-33 (Main Prompt Code Block Subordination)**: 유지 — Spec Authority 정책.
- **ID collision 처리**: ADR-MOD-GRID-00-012 후속 인용은 ID 대신 "ADR-MOD-GRID-00-012 transitional stub" 으로 지칭. ADR ledger (`memory/feedback-tw-mail-adr-number-collision.md` N=2 누적) + constraints ID ledger 신설 권고 — 별도 cycle.
  - → **2026-05-18 갱신**: M-1/M-2 mechanism 분리 (advisor 권고) — MAIL-12 M-1 N=1 + 본 C-33 M-2 N=1 (통합 N=2 카운트 폐기). `ID-LEDGER.md` Section 4 + ADR-MOD-GRID-00-013 신설로 governance codify. promotion (cross-harness) 은 mechanism 당 N=3 도달 시.

## C-34 (Worktree Boundary Bypass)

- **2026-05-15 MOD-GRID-17/G-001**: 1차 Implementer Edit boundary 차단 → 즉시 escalate. 메인 advisor 자문 후 PowerShell-via-Bash 우회 안내 → 2차 100/95 PASS. 1 round-trip 낭비.

## C-35 (Spec Writer Self-Check)

- **2026-05-15 MOD-GRID-99-A/G-001**: 동일 함수 signature 일관성 부재로 spec 인용 mismatch 발견.

## C-36 (Implementer Score JSON 금지)

- **2026-05-15 MOD-GRID-99-A/G-002**: Implementer 가 implement-score.json 자체 작성 → self-eval 편향. Coverage Verifier 단독 작성으로 정정.
