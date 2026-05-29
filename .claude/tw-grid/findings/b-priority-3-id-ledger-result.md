# constraints ID ledger 신설 결과

**실행일**: 2026-05-18
**상태**: completed
**cycle 출처**: tw-grid B 우선 3 (constraints ID ledger 신설)

---

## 1. 작업 목적

ADR ID 재사용 / 결번 / collision 추적 ledger 신설. memory 의 ADR collision N=2 (MAIL-12 M-1) + tw-grid C-33 (M-2) 누적 발견에 대한 선제적 governance.

**advisor 권고 반영**:
- mechanism 별 N 카운트 분리 (M-1 / M-2 통합 금지)
- ADR placement: Option B (governance lane `ADR-MOD-GRID-00-013` — 00-012 cross-module catalog 선례 정합)
- memory: option (b) 신규 파일 신설 (mechanism 분리)
- 형식: MD (JSON 미사용 — 사람-읽기 우선)

---

## 2. 변경/신설 파일

| 파일 | 종류 | 변경 |
|------|------|------|
| `.claude/tw-grid/decisions/ID-LEDGER.md` | **신규** | 7 section — 정책 / ADR ID ledger / Constraint ID ledger / Mechanism N 카운트 / 본 ledger 신설 ADR / 작성 의무 매트릭스 / 참조 |
| `.claude/tw-grid/decisions/MOD-GRID-00-decisions.md` | 추가 | ADR-MOD-GRID-00-013 (ID Ledger Policy) 본문 신설 — 기존 712 라인 끝부분 (ADR-012 다음) |
| `memory/feedback-tw-grid-id-collision-pattern.md` | **신규** | M-2 mechanism (Constraint ID cross-reference dual-meaning) N=1 사례 영구 보존 + 규칙 + promotion 조건 |

---

## 3. 정책 ADR 신설 위치

- **ADR ID**: `ADR-MOD-GRID-00-013`
- **위치**: `.claude/tw-grid/decisions/MOD-GRID-00-decisions.md` (governance lane)
- **상태**: accepted
- **선택 옵션**: B (governance ADR-MOD-GRID-00-NNN) — advisor 권고 정합 + ADR-00-012 cross-module catalog 선례 정합

---

## 4. memory feedback 갱신 여부

**신규 작성** (option b 채택). 기존 `memory/feedback-tw-mail-adr-number-collision.md` 갱신 아님 — mechanism 분리 보존.

- **MAIL-12 사례**: `feedback-tw-mail-adr-number-collision.md` (M-1 mechanism, N=1, 변경 없음)
- **tw-grid C-33 사례**: `feedback-tw-grid-id-collision-pattern.md` (M-2 mechanism, N=1, 신규)

두 memory 모두 N=1 (pattern 단계) — promotion (N=3) 미도달. **통합 카운트 금지** 명시.

---

## 5. ID 패턴 분석 (4 분류)

| 분류 | 정의 | 사례 | ledger 추적 | promotion 대상 |
|------|------|------|-------------|---------------|
| **A. ADR body reuse** | cross-session wipe + 같은 번호 재발급 (M-1) | MAIL-12 ADR-035~039 | yes | yes (N=3 시) |
| **B. Constraint ID cross-reference dual-meaning** | ADR 본문이 미등록 ID 인용 + 별도 contraint 가 같은 ID 점유 (M-2) | tw-grid C-33 | yes | yes (N=3 시) |
| **C. ADR withdrawn marker** | sub-spec retraction 후 결번 처리 (lifecycle) | ADR-MOD-GRID-REFACTOR-2026-05-17-017 | yes (status 추적) | **no (lifecycle 정상)** |
| **D. ADR 신규 (정상 발급)** | 정상 ADR 발급 | 모든 accepted ADR | yes (status 추적) | **no (lifecycle 정상)** |

**핵심 통찰** (advisor 권고 반영): A/B 는 *prevention* 카테고리. C/D 는 *normal lifecycle* — ledger 의 status 컬럼 추적만 수행, 정책 진입 대상 아님.

---

## 6. 결과 체크리스트

- [x] ID 패턴 분석 (4 분류 — A/B prevention + C/D lifecycle)
- [x] ID-LEDGER.md 신설 (Section 1-7, ADR-00 + REFACTOR-2026-05-17 인벤토리 + Constraint 전체 인벤토리)
- [x] 정책 ADR 신설 (ADR-MOD-GRID-00-013, governance lane, Option B)
- [x] memory feedback 신규 작성 (`feedback-tw-grid-id-collision-pattern.md`, M-2 N=1)
- [x] cross-harness 미적용 명시 (tw-mail / tw-harness 별도 cycle 권고)
- [x] mechanism 별 N 카운트 분리 (M-1 / M-2 통합 금지)
- [x] git commit 미수행 (CLAUDE.md 정책 준수)

---

## 7. cross-harness 권고 (별도 cycle)

본 cycle 은 **tw-grid pilot 한정**. 다음 cycle 에서 cross-harness 적용 검토:

| 대상 | 권고 파일 | 적용 시점 |
|------|----------|----------|
| **tw-mail** | `.claude/tw-mail/decisions/ID-LEDGER.md` (신설) + `MAIL-NN-decisions.md` 인벤토리 backfill | M-1 또는 M-2 N=2 도달 시 (MAIL-12 가 이미 N=1 — 1 더 추가 시 promotion 후보) |
| **tw-harness** | `.claude/tw-harness/decisions/ID-LEDGER.md` (신설) — ADR-MOD-* 인벤토리 | 현재 collision 사례 없음 — N=0. 본 ledger pilot 결과 retro 후 도입 검토 |

**Promotion 의무 조건**: M-1 또는 M-2 mechanism 별 N=3 도달 시 cross-harness 의무 적용 + 신규 `policies/id-ledger.md` 신설 (`_shared/` 또는 harness 별).

**현 단계 (2026-05-18)**: M-1 N=1 + M-2 N=1 (각각 anecdote+1, pattern 단계). cross-harness 의무 적용 부적격 — 본 ADR 은 *tw-grid pilot governance* 만 정당화.

---

## 8. 향후 작업 (별도 cycle 후보)

1. **Backfill 인벤토리** — MOD-GRID-01 ~ MOD-GRID-99-B `lastIssued` 컬럼 grep 후 ledger 완전화 (현재 ADR-00 + REFACTOR-2026-05-17 만 완전).
2. **cross-harness 적용** — tw-mail / tw-harness 동일 ledger 신설 (mechanism N=3 도달 시 의무화).
3. **policies/id-ledger.md SSoT 통합** — N=3 도달 시 `_shared/policies/id-ledger.md` 신설 + cross-harness 의무.
4. **Coverage Verifier rubric 추가** — ADR 인용 검증 시 ledger 의 `상태` 컬럼 cross-check 의무 (B 카테고리 신규 항목).

---

## 9. 참조

- 작업 prompt: tw-grid B 우선 3 — constraints ID ledger 신설
- advisor 자문: 2026-05-18 (mechanism 분리, Option B, option (b), MD 형식)
- 신설 산출물:
  - `.claude/tw-grid/decisions/ID-LEDGER.md`
  - `.claude/tw-grid/decisions/MOD-GRID-00-decisions.md` ADR-013
  - `memory/feedback-tw-grid-id-collision-pattern.md`
- 관련 참조:
  - `memory/feedback-tw-mail-adr-number-collision.md` (M-1 mechanism, MAIL-12 N=1)
  - `.claude/tw-grid/constraints/HISTORY.md` L37-43 (C-33 collision 발견 절)
  - `.claude/tw-grid/decisions/MOD-GRID-00-decisions.md` ADR-012 (C-33 (a) 의미 원 출처)
  - `.claude/tw-grid/constraints/70-spec-discipline.md` L37 (C-33 (b) 의미 정식 entry)
  - `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` ADR-017 (결번 marker 사례)
