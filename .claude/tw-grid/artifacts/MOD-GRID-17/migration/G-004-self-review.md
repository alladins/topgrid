# G-004 Self-Review — account 잔여 4 페이지 마이그레이션 (MyNotification 제외)

**Module**: MOD-GRID-17 / migration / G-004
**Date**: 2026-05-15
**Reviewer**: opus (Self-Review Agent)
**Scores**: SPECIFY 100/100 · IMPLEMENT 100/100 · VERIFY 100/100 (weighted) — 모두 threshold 95 통과
**Status**: PASS · Self-Review 완료

---

## 1줄 요약

Self-Review 완료 — ADR-005 신설 (Spec writer Investigative Scope-Reduction Authority — reality-check 권한) / specify-rubric A-04 v1.0.9 + implement-rubric F-02 v1.0.12 sub-bullet 추가 / G-005~G-006 cascading 효과 추정 (DailyAttendancePage 패턴B 사전 감지 + 2-pattern import 잔존 사이트).

---

## 1. 누적 사이트 카운트 (G-001 ~ G-004)

| Goal | 페이지 수 | 사이트 수 | 평균 사이트/페이지 | 최대 사이트/페이지 | 영향 종류 | 비고 |
|------|----------|----------|------------------|-------------------|----------|-----|
| G-001 | 5 | 6 | 1.2 | 2 (SlipClosePage) | 결산정리분개 | — |
| G-002 | 5 | 9 | 1.8 | 3 (ExpenseCardPage) | 법인카드/지출/일일월간 | — |
| G-003 | 5 | 11 | 2.2 | 6 (AdjustmentPage) | 전도금·이자소득·조정·전자세금계산서 | — |
| **G-004** | **4** (★ 5→4 via D1) | **5** | **1.25** | **2 (AdminSlipEditPage)** | **AdminSlip편집 + 재무이월·결산요약·월별결산** | **★ 첫 scope reduction Goal** |
| **누적** | **19** | **31** | **1.63** | **6** | — | — |

**관찰**:
- **G-004 는 본 모듈 첫 scope-reduction Goal** — discover 단계 산출 `affectedUsageFiles[5]` 중 1 entry (MyNotificationPage) 가 실측 결과 `DataTable` 사용 (BaseGrid 미사용) → spec D1 결정으로 4 페이지로 축소.
- 사이트/페이지 비율 G-003 (2.2) → G-004 (1.25) 로 하락 — multi-site 페이지 단조 증가 추세가 G-004 에서 일시 break. AdminSlipEditPage 만 2 사이트 (차변+대변 그리드), 나머지 3 페이지는 1 사이트씩.
- 누적 19 페이지 / 31 사이트 — 모듈 종료 시 affected scope 의 대부분 (G-005~G-006 잔여) 추정 약 10 페이지 / 15 사이트.

---

## 2. 사이트 분포 분석 (single-page multi-site + 2-pattern import)

### 2.1 AdminSlipEditPage 2 사이트 — 차변/대변 분할 그리드 + named monorepo legacy import

| 사이트 | 라인 | 제네릭 타입 | 렌더 조건 | onRowClick |
|--------|------|------------|----------|-----------|
| #1 차변 그리드 | L593 | `Slip02ListItem` | 항상 | `handleGridRowClick` |
| #2 대변 그리드 | L605 | `Slip02ListItem` | 항상 | `handleGridRowClick` |

**특이성**:
- 한 파일 내 2 사이트 — G-003 EtaxReceive 2 사이트 패턴과 유사 (multi-site 일반화).
- **★ named monorepo legacy import** — L15: `import { BaseGrid } from '@tomis/grid-core/legacy';` (G-001~G-003 어디에도 없는 새 패턴 — 본 G-004 첫 등장).
- 두 사이트 모두 `onRowClick={handleGridRowClick}` 사용 → 행 클릭 → 우측 분개행 폼 연동 워크플로 (EC-07).

### 2.2 단일 페이지 사이트 — 3 페이지 (그룹 A default import)

| 페이지 | 라인 | 제네릭 타입 | emptyText | 특이성 |
|--------|------|------------|-----------|--------|
| FinancialCarryoverPage | L203 | `CarryoverItem` | 삼항식 (`hasSearched ? '검색된 자료가 없습니다.' : '조회 버튼을 클릭하세요.'`) | 조건부 emptyText (G-002 동일 패턴) |
| SettlementSummaryPage | L254 | `ChadaeBalanceItem` | "차대 불일치 전표가 없습니다." | 1 한국어 리터럴 |
| MonthlySettlementPage | L253 | `CarryoverItem` | "검색된 자료가 없습니다." | FinancialCarryover 와 type/columns 식별자 이름 동일 (별도 declaration) |

모두 L8 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` (default local import, G-001~G-003 패턴).

### 2.3 ★ 2-pattern import — Group A + Group B 첫 동시 등장

| Group | 패턴 | 파일 수 | import 형태 | 출처 | PowerShell Replace 패턴 |
|-------|------|--------|-------------|------|----------------------|
| **A** | local default | 3 | `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` | base repo 로컬 컴포넌트 | 패턴 #1 (default replacement) |
| **B** | monorepo legacy named | 1 | `import { BaseGrid } from '@tomis/grid-core/legacy';` | monorepo legacy sub-entry | 패턴 #2 (named replacement) |

**기술적 영향**:
- 단일 PowerShell `Replace` 패턴으로 일괄 매칭 불가 → spec D2 결정으로 사이트별 surgical 변환 분기.
- 후속 G-005~G-006 cascading 위험 — 이미 일부 마이그레이션된 페이지가 named monorepo legacy import 형태로 잔존할 가능성 (G-005 affectedUsageFiles 의 hr 페이지들이 후보).
- Implementer 는 2-pattern 분기 인식 후 `g004_patch_*.ps1` 스크립트에 2 종 Replace 블록 작성 + BOM prepend 의무 (C-35).

---

## 3. 신규 발견 사항 및 학습

### 발견 1: scope shrinkage — goals.json 부정확 → spec D1 reality-check 으로 reduction

**근거 데이터**:
- goals.json G-004 `affectedUsageFiles[5]` = 4 account pages + MyNotificationPage.
- spec writer 가 5 페이지 모두 Read + `BaseGrid` Grep 실측:
  - 4 account pages: 모두 BaseGrid 사용 확인.
  - MyNotificationPage: **Grep `BaseGrid` 0 hits** — 실제로는 `DataTable` (`'../../components/DataTable'` L16) 사용.
- spec D1 결정으로 scope 5 → 4 축소 + Section 7 표 4 행 + goals.json `scopeNote` 필드 갱신 (배열은 audit trail 보존).

**기존 권위 chain 으로는 catch 불가능한 이유**:
- C-27 (spec > main prompt) — main prompt 가 5 페이지 명시했지만, prompt 도 goals.json 그대로 인용 → 충돌 없음.
- C-30 (final table > re-decisions) — spec 본문 내부 모순 case. discover-vs-spec gap 미커버.
- implement-rubric F-02 v1.0.4 (spec > goals.json on conflict) — goals.json 과 spec 의 **수량 불일치** 시 spec 우선. 하지만 spec 가 reality-check 의무 없이 그대로 5 파일 작성했다면 충돌 자체가 안 생김.

**의사결정**: 새 **ADR-MOD-GRID-17-005 (Investigative Scope-Reduction Authority)** 신설. spec writer 에게 **실측 후 scope reduction 권한 + 의무** 부여 — F-02 의 상위 trigger 정책.

### 발견 2: 2-pattern import — Group A (default local) + Group B (named monorepo legacy) 첫 동시 등장

**근거 데이터**:
- G-001 ~ G-003: 15 페이지 모두 **default local import** (`from '../../../components/tomis/Grid/BaseGrid'`).
- G-004 4 페이지: 3 페이지 default local (Group A) + 1 페이지 named monorepo legacy (Group B, AdminSlipEdit L15).

**기술적 영향 (cascading)**:
- 단일 PowerShell `Replace` 패턴 일괄 매칭 불가 → 2 종 Replace 블록 분리 의무.
- G-005~G-006 의 일부 페이지 (hr/, payroll/, finance/) 가 named monorepo legacy import 형태로 잔존할 가능성 있음 — Implementer prompt 작성 시 spec writer 가 2-pattern 분기 사전 안내 의무.

**의사결정**: 새 ADR 신설 안 함. **spec D2 결정에 2-pattern 명시** + Implementer 측이 `g004_patch_*.ps1` 스크립트에 2 종 Replace 블록 작성 (실측 적용 완료). 향후 G-005~G-006 spec writer 가 reality-check (specify-rubric A-04 v1.0.9 sub-bullet) 시 2-pattern 잔존 여부 사전 감지 → spec D# 결정으로 분기.

### 발견 3: D1 권한 행사 = Spec Writer 가 goals.json 보다 정확한 사실 기반 결정

**근거 데이터**:
- spec writer 가 5 페이지 모두 Read + Grep 실측 후 — MyNotificationPage 가 BaseGrid 미사용 (DataTable 사용) 확인.
- D1 결정으로 scope 4 → 4 페이지로 축소.
- goals.json `scopeNote` (최상위 L230) + `stages.specify.scopeNote` (L287) 둘 다 reduction 명시.
- `affectedUsageFiles[]` 배열 5 entries 그대로 (audit trail 보존).

**의사결정**: **ADR-MOD-GRID-17-005 신설** (위 발견 1 의 결정과 동일 — Investigative Scope-Reduction Authority). spec writer 에게 reality-check 후 scope 축소 권한을 명문화 — 기존 권위 chain (C-27/C-30/F-02) 의 상위 trigger 정책.

---

## 4. 적용 파일 (변경 사항)

### 4.1 `decisions/MOD-GRID-17-decisions.md` (신규 ADR-005 추가)

- ADR-MOD-GRID-17-005 — **Spec Writer 의 Goal Scope Reality-Check Authority (Investigative Scope-Reduction)**.
- Context: G-004 D1 케이스 (MyNotificationPage 제외) + 기존 권위 chain (C-27/C-30/F-02) 으로는 catch 불가능한 이유.
- Decision: spec writer 에게 reality-check (Read + Grep) 후 scope 축소 권한 + 의무. 5 단계 절차 명문화 (Read → Grep → 0 hits 판별 → D# 결정 + Section 1 + Section 7 + scopeNote 4 곳 reduction 일관 반영 → goals.json `scopeNote` 갱신 / 배열 보존).
- Alternatives (3개): (1) 기존 F-02 로 충분 (거부), (2) discover 단계 reality-check 의무화 (거부 — 비용 폭증), (3) goals.json 배열 직접 수정 (거부 — audit trail 손실).
- Consequences: G-005~G-006 cascading + Phase drift trade-off (의도된 lag).

### 4.2 `rubric/specify-rubric.md` (v1.0.8 → v1.0.9)

- 헤더 변경 사항 블록에 v1.0.9 항목 추가.
- A-04 본문 (L106~) 아래 새 sub-bullet 추가 — **`affectedUsageFiles[]` 실측 검증 의무 — Investigative Scope-Reduction Authority**:
  - 6 단계 절차 (Read 의무 → Grep 의무 → 0 hits 판별 → Reduction 결정 형식 4 곳 → goals.json `scopeNote` 갱신 → 배열 보존).
  - 판정 기준 (YES / NO).
  - 검증 방법 (Coverage Verifier 측).
  - 근거 사례 (G-004 D1).
  - 적용 범위 (G-005~G-006 + MOD-GRID-18~) + DailyAttendancePage 패턴B 경고.
  - 위반 시 처리.
  - cross-reference: ADR-005 + implement-rubric F-02 v1.0.12 sub-bullet.
- 항목 수 32 + H=3 불변.

### 4.3 `rubric/implement-rubric.md` (v1.0.11 → v1.0.12)

- 헤더 변경 사항 블록에 v1.0.12 항목 추가.
- F-02 본문 v1.0.4 sub-bullet ("goals.json implementFiles ↔ spec.md Section 7 권위 충돌 처리") 아래 새 sub-bullet 추가 — **Spec D# 결정의 Documented Scope Reduction 우선 적용 의무**:
  - 판정 기준 (YES / NO).
  - 보고 의무 (`feedback.scopeReduction` 1줄).
  - 검증 방법 (Coverage Verifier 측 4 곳 cross-check).
  - 근거 사례 (G-004 D1).
  - **v1.0.4 (general tiebreaker) vs v1.0.12 (directional reduction) 구분 명시** — 일반 conflict tiebreaker vs documented directional reduction.
  - 적용 범위 (G-005~G-006 + MOD-GRID-18~).
- 항목 수 24 + F=6 불변.

### 4.4 본 보고서 `G-004-self-review.md` (신규)

- G-001 ~ G-004 누적 표 + 2-pattern import 분석 + 3 발견 사항 + cascading 효과 추정 + Verifier 자가-검산.

### 4.5 ADR / constraints / 다른 spec 변경 0건

- constraints.md C-1~C-35 변경 없음 — ADR-005 가 신규 권한 chain trigger 정책 (constraint 레벨 추가 안 함). A-04/F-02 sub-bullet 으로 rubric scope 에서 충분.
- 다른 spec 영향 없음 — G-004 spec 그대로 유효.

---

## 5. G-005 ~ G-006 Cascading 효과 추정

| 효과 | 영향 Goal | 절감/부담 추정 |
|------|----------|--------------|
| **A-04 v1.0.9 sub-bullet (reality-check 의무)** | G-005~G-006 + 후속 (MOD-GRID-18~) | 약 2~3 Goal × 평균 1 entry mis-classification 사전 감지 → 2~3 loop 낭비 차단 예상. |
| **F-02 v1.0.12 sub-bullet (scope reduction 우선 의무)** | G-005~G-006 (spec D# 가 reduction 결정한 경우) | Implementer 측 reduced count 정확히 적용 + audit trail 보존. |
| **2-pattern import (Group A + Group B) 인식** | G-005~G-006 (hr/payroll/finance 페이지 일부 named legacy 가능성) | spec writer 가 reality-check 시 2-pattern 잔존 사전 감지 → spec D# 결정 으로 분기. Implementer 측 2 종 Replace 블록 작성 부담 ↑ (사이트당 1 round-trip 절감). |
| **DailyAttendancePage 패턴B 사전 감지** | G-005 specific | goals.json title 에 "패턴B(직접 useReactTable)" 명시. spec writer reality-check 시 BaseGrid 변종과 다른 마이그레이션 path 인식 → spec D# 결정으로 G-005 scope 분기 또는 별도 처리. |
| **`scopeNote` 필드 운영 표준화** | G-005~G-006 + 후속 | reduction Goal 의 audit trail 표준. 향후 tw-grid-monitor 도구가 reduction Goal 을 distinct status 로 표시 가능 (도구 보강 후보). |

**누적 추정**: G-005~G-006 (2 Goal) 에서 약 3~5 round-trip 절감 + 1 잠재 ADR 후보 (DailyAttendancePage 패턴B → 별도 useReactTable abstraction Goal — spec writer 발견 시 신설).

---

## 6. Verifier 자가-검산 (C-26)

- **SPECIFY denominator 산식**: yesCount(29) + noCount(0) = 29. N/A(3 = A-02, A-03, A-05) 분모 제외. score = 29/29 × 100 = 100.0 ✓
- **IMPLEMENT denominator 산식**: yesCount(20) + noCount(0) = 20. N/A(4 = A-06, A-07, B-05, D-03, E-02, E-03 중 일부) 분모 제외. score = 20/20 × 100 = 100.0 ✓ (실제 N/A 4건 — implement-score.json 명시)
- **VERIFY weightedScore 산식**: 100×0.10 + 100×0.15 + 100×0.40 + 100×0.25 + 100×0.10 = 10 + 15 + 40 + 25 + 10 = 100.0 ✓
- **failedChecks 배열 길이**: SPECIFY 0 / IMPLEMENT 0 / VERIFY 0 — 모두 noCount(0) 와 일치 ✓
- **카테고리 합계**: SPECIFY 32 (A=5 + B=5 + C=5 + D=6 + E=6 + F=4 + G=1 + N/A guard) / IMPLEMENT 24 (A=7 + B=7 + C=4 + D=3 + E=3) / VERIFY 16 (A=3 + B=5 + C=3 + D=2 + E=3) — rubric 총 항목 일치 ✓
- **JSON 무결성**: 3 score JSON 모두 Read 성공, parse 가능 (escape 문제 없음) ✓
- **N/A 분모 미포함 가드**: SPECIFY 3 N/A (A-02, A-03, A-05) / IMPLEMENT 4 N/A / VERIFY 8 N/A — 모두 분모 제외 ✓

---

## 7. 권고사항 (다음 Goal 착수 전)

1. **G-005 spec writer** 에 본 self-review 보고서 3 절 (발견 1, 2, 3) reference 제공:
   - `affectedUsageFiles[5]` 모두 Read + Grep `BaseGrid|useReactTable` 실측 의무 (specify-rubric A-04 v1.0.9 sub-bullet).
   - DailyAttendancePage 가 BaseGrid 사용인지 직접 useReactTable 사용인지 확인 → 후자라면 spec D# 결정으로 마이그레이션 path 분기 (또는 별도 Goal).
   - hr/finance 페이지 중 named monorepo legacy import (`@tomis/grid-core/legacy`) 잔존 여부 사전 감지 → 2-pattern 분기 명시.
2. **G-005 Coverage Verifier (haiku)** 에 implement-rubric v1.0.12 F-02 sub-bullet 명시 — spec D# scope reduction 결정 발견 시 reduced count 일관 검증 의무.
3. **goals.json `scopeNote` 운영 표준** — tw-grid-monitor 도구 보강 후보 (reduction Goal 을 distinct status 로 표시).
4. **state.json sync** — task #24 완료 후 메인이 state.json 의 G-004 status='completed' + 다음 Goal pointer (G-005) 갱신 (Self-Review 단계 외).

---

**참고 파일**:
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-004-spec.md`
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-004-specify-score.json` (100/100)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-004-implement-score.json` (100/100)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-004-verify-score.json` (100/100 weighted)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/decisions/MOD-GRID-17-decisions.md` (5 ADR — ADR-005 신설)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/constraints.md` (C-1 ~ C-35, 변경 없음)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/rubric/specify-rubric.md` (v1.0.9 — A-04 v1.0.9 sub-bullet 추가)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/rubric/implement-rubric.md` (v1.0.12 — F-02 v1.0.12 sub-bullet 추가)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/goals/MOD-GRID-17/migration-goals.json` (G-004 객체 scopeNote 보존 — operative shrinkage marker)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-003-self-review.md` (이전 회고)
