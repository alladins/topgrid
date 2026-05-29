# G-003 Self-Review — account/Cash\* + 기타 5 페이지 마이그레이션

**Module**: MOD-GRID-17 / migration / G-003
**Date**: 2026-05-15
**Reviewer**: opus (Self-Review Agent)
**Scores**: SPECIFY 100/100 · IMPLEMENT 100/100 · VERIFY 100/100 (weighted) — 모두 threshold 95 통과
**Status**: PASS · Self-Review 완료

---

## 1줄 요약

Self-Review 완료 — rubric F-04 보강 (주석/문자열 포함 negative grep) / Adjustment multi-site (6 사이트 단일 페이지) 패턴 학습 / G-004~G-006 cascading 효과 추정 (round-trip 절감 + 시각 회귀 검증 부담 증가).

---

## 1. 누적 사이트 카운트 (G-001 ~ G-003)

| Goal | 페이지 수 | 사이트 수 | 평균 사이트/페이지 | 최대 사이트/페이지 | 영향 종류 |
|------|----------|----------|------------------|-------------------|----------|
| G-001 | 5 | 6 | 1.2 | 2 (SlipClosePage) | 결산정리분개 |
| G-002 | 5 | 9 | 1.8 | 3 (ExpenseCardPage) | 법인카드/지출/일일월간 |
| **G-003** | **5** | **11** | **2.2** | **6 (AdjustmentPage)** | **전도금·이자소득·조정·전자세금계산서** |
| **누적** | **15** | **26** | **1.73** | **6** | — |

**관찰**:
- 사이트/페이지 비율이 단조 증가 (1.2 → 1.8 → 2.2). 후속 Goal 일수록 multi-site 페이지 빈도 증가 추정.
- G-003 의 AdjustmentPage 단일 페이지에 6 사이트 (조건부 렌더 `bizFlag === '07'`/`'06'`, 서브탭 `deprSubTab === 'list'`/`'summary'`) — **본 모듈 최다 사이트/페이지**.
- 각 사이트는 다른 제네릭 타입 (SalesRow / AssetRow / DeprRow / DeprSummaryRow / PeriodRow07 / PeriodRow06) — 단일 페이지 내 6 종 데이터 모델 공존.
- 11 사이트 = G-001 + G-002 합산 (6 + 9 = 15) 의 73% 에 해당 — 단일 Goal 의 시각 회귀 검증 부담이 누적 사이트 추세를 따라 지속 증가.

---

## 2. 사이트 분포 분석 (단일 페이지 multi-site 패턴)

### 2.1 AdjustmentPage 6 사이트 — 조건부 렌더 패턴

| 사이트 | 라인 | 제네릭 타입 | 렌더 조건 |
|--------|------|------------|----------|
| #1 매출액 조정 | L684 | `SalesRow` | 항상 (탭 1) |
| #2 자산대체 | L704 | `AssetRow` | 항상 (탭 2) |
| #3 감가상각비 list | L808 | `DeprRow` | `deprSubTab === 'list'` (탭 3 서브탭 a) |
| #4 상각내역 총괄 | L815 | `DeprSummaryRow` | `deprSubTab === 'summary'` (탭 3 서브탭 b) |
| #5 기간비용 07 | L842 | `PeriodRow07` | `bizFlag === '07'` (탭 4 모드 a) |
| #6 기간비용 06 | L849 | `PeriodRow06` | `bizFlag === '06'` (탭 4 모드 b) |

**시각 회귀 부담**: 6 사이트 모두 외관 확인 필요 → 메인 탭 4개 + 서브탭 2개 + 모드 2개 = 8 화면 상태 전환. 단일 페이지 안에서 7 회 인터랙션 필요 (state 변경 → 렌더 분기 검증).

### 2.2 multi-site 페이지 누적 추이

| Goal | multi-site 페이지 수 | 최대 사이트/페이지 | 페이지 내 평균 사이트 |
|------|--------------------|------------------|-------------------|
| G-001 | 1 (SlipClosePage 2 사이트) | 2 | 2.0 |
| G-002 | 1 (ExpenseCardPage 3 사이트) | 3 | 3.0 |
| G-003 | 2 (Adjustment 6 + EtaxReceive 2) | 6 | 4.0 |

**경향**: multi-site 페이지 수와 평균 사이트/페이지 모두 증가. G-004~G-006 에서도 동일 패턴 발생 가능성 — 특히 hr/PayrollEditablePage, hr/OrgMasterPage, admin/MenuManagePage 같은 master-detail 구조는 multi-site 잠재.

### 2.3 단일 페이지 multi-site 마이그레이션 패턴 (Adjustment 사례 = reference impl)

본 G-003 에서 검증된 단일 페이지 multi-site 마이그레이션 절차:

1. **사전 Read** — 한 파일 다중 사이트일 때 모든 사이트 라인 enumerate (spec L0-4 에 6 사이트 모두 발췌 인용).
2. **BOM 스크립트 일괄** — 6 사이트 동일 변환 패턴 (`<BaseGrid<T>` → `<Grid<T>` + `enableSort` + `enableFilter`) → 단일 PowerShell 스크립트 (`g003_patch_all_bom.ps1`) 로 6 사이트 동시 처리.
3. **import 라인은 1회만** — 6 사이트라도 파일 상단 import L14 한 줄만 교체 (D1 결정).
4. **사이트별 props 차이 처리** — 6 사이트 모두 props 4 종 (data/columns/loading/emptyText) 동일 → AdjustmentPage 처럼 props 동질성 높을수록 일괄 변환 효율 ↑.
5. **시각 회귀** — 8 화면 상태 (탭 + 서브탭 + 모드) 모두 외관 비교 필요.

**패턴 일반화**: 단일 페이지 N 사이트 마이그레이션 시 (a) import 1 회 + (b) BOM 스크립트 N 사이트 동시 + (c) 시각 회귀 N 화면 상태 검증.

---

## 3. 신규 발견 사항 및 학습

### 발견 1: Multi-site Page (Adjustment 6 사이트) 첫 등장 — cascading 영향

**근거 데이터**: 위 1, 2 절. AdjustmentPage 6 사이트 = 본 모듈 단일 페이지 최대.

**cascading 영향 (G-004 ~ G-006 추정)**:
- master-detail 또는 tabbed 페이지 식별 — `hr/OrgMaster`, `payroll/PayrollEditable`, `admin/MenuManage`, `account/MonthlySettlement` 등이 multi-site 잠재.
- spec 작성 시 L0 절 (현 구현 발췌) 의 모든 사이트 enumerate 의무화 — 1 사이트 누락은 BOM 스크립트 잔존 → AC-004 NO 위험.
- 시각 회귀 화면 상태 수 증가 → C-17 수동 검증 부담 — Storybook story 자동화 cascading 고려.

**의사결정**: 새 ADR 신설 안 함. 기존 ADR-MOD-GRID-17-001 (PowerShell-via-Bash) + C-35 (BOM) 패턴이 그대로 적용됨 (사이트 수만 증가). 본 self-review 보고서에 누적 데이터로 보존.

### 발견 2: 주석 잔존 (InterestIncomePage stale comment) — rubric F-04 보강

**근거 데이터**:
- InterestIncomePage L176 — 현재 상태 (G-003 implement 후): `{/* 그리드 — C-03 빈 상태는 Grid emptyText 기본값 처리 */}` (Read 도구 검증, "BaseGrid" 단어 없음).
- Implementer 2차 패치 (`g003_fix_comment_bom.ps1`) 로 주석 surgical edit 적용 — 이전 상태에 "BaseGrid" 단어 잔존 (Implementer 보고).
- positive grep (`<BaseGrid<`, `from ['\"]...BaseGrid`, `import BaseGrid`) 0 hits 만으로는 stale 주석 검출 불가능.

**검증**: 본 self-review 시점 (BOM 패치 후) Read L176 → "BaseGrid" 단어 0 hits 확인. 즉 실제 코드에는 잔존 없음. **학습은 검출 패턴 — positive grep 만으로는 negative AC ("0건 약속") 검증 불충분**.

**조치**: `implement-rubric.md` F-04 에 sub-bullet 추가 (★ Variant 잔존 grep 의무 — 주석/문자열 포함). 코드 식별자 grep 0 hits 외에 변경 파일 내 주석/문자열 리터럴 잔존 grep 의무화. v1.0.10 → v1.0.11.

**cascading 효과 추정**: G-004 ~ G-006 (잔여 BaseGrid 사용처) + 후속 모듈 (Wijmo 잔존 검증, AgGrid 잔존 검증) — variant 이름이 코드뿐 아니라 주석 내 가이드라인 텍스트, 디버그 메시지, JSDoc 으로 잔존 가능. F-04 sub-bullet 적용으로 약 5+ Goal × 1 회 stale 주석 검출 사전 차단.

### 발견 3: tsc 전체 0 errors 지속 (G-001 → G-002 → G-003 안정화 완료)

| Goal | 스코프 tsc | 전역 tsc | 비고 |
|------|-----------|---------|-----|
| G-001 | 0 errors | 7 errors | PayReal01EditModal JSDoc 사전 존재 버그 (본 Goal 무관) |
| G-002 | 0 errors | 0 errors | 사전 존재 버그 해소 |
| G-003 | 0 errors | 0 errors | 안정 유지 ✅ |

**해석**: tsc 환경 안정화 완료. G-004 부터는 "사전 존재 버그 → 본 Goal 무관 처리" 우려 ↓. 다만 G-002 가 7 → 0 으로 전역 errors 를 해소한 정확한 시점은 G-002 implement 또는 다른 별도 작업 — 본 Goal 의 5 파일 변경이 직접 원인은 아님 (영향 사용처 외 파일 변경 0).

**cascading 효과**: G-004~G-006 의 verify Stage 에서 tsc 전역 0 errors 를 기본 기대값으로 설정. 다시 1건 이상 발생 시 즉시 "사전 존재 vs 본 Goal 원인" 분기 진단 의무. spec 작성 시 BE-VERIFY rubric `버드 0 errors` 항목에 base-line 명시 권장.

---

## 4. 적용 파일 (변경 사항)

### 4.1 `rubric/implement-rubric.md` (v1.0.10 → v1.0.11)
- 헤더 변경 사항 블록에 v1.0.11 항목 추가 (F-04 sub-bullet 보강 안내).
- F-04 본문 (L120~) 에 sub-bullet 추가 — "★ Variant 잔존 grep 의무 — 주석/문자열 포함". 변경 파일 내 주석 + 문자열 리터럴 negative grep 의무화. 검증 방법 + 근거 사례 (G-003 InterestIncomePage L176) + 적용 범위 (G-004~G-006 + 후속 모듈) 명시.
- 항목 수 24 + F=6 불변. 메타 게이트 신설 없음.

### 4.2 본 보고서 `G-003-self-review.md` (신규)
- 모듈 내 첫 written self-review 산출물 (G-001/G-002 의 학습은 rubric/constraints/ADR 인라인 갱신 — implement-rubric v1.0.9/v1.0.10 변경 사항 블록 + ADR-MOD-GRID-17-001~004 참조).
- G-001 ~ G-003 누적 사이트 카운트 + multi-site 분포 + 3 발견 사항 + cascading 효과 추정.

### 4.3 ADR / spec 변경 0건
- 발견 1 (Adjustment 6 사이트) → 새 ADR 신설 안 함. 기존 ADR-MOD-GRID-17-001 + C-35 패턴 그대로 적용.
- 발견 3 (tsc 안정화) → spec 영향 없음. specify-rubric 변경 불필요.
- C-34/C-35 (constraints) 변경 없음 — F-04 보강은 rubric scope 충분.

---

## 5. G-004 ~ G-006 Cascading 효과 추정

| 효과 | 영향 Goal | 절감/부담 추정 |
|------|----------|--------------|
| **F-04 sub-bullet (주석 grep)** | G-004 ~ G-006 + 후속 (MOD-GRID-18~) | 약 5+ Goal × 1 회 stale 주석 사전 차단. round-trip 절감 ≈ 5 회. |
| **AdjustmentPage 6 사이트 패턴 reference** | G-004 ~ G-006 (multi-site 페이지) | 신규 multi-site Goal 의 spec 작성 시 본 보고서 2.3 절 절차 직접 인용. spec writer 부담 ↓. |
| **시각 회귀 화면 상태 증가** | G-004 ~ G-006 (multi-site 페이지) | C-17 수동 검증 부담 ↑. Storybook story 자동화 cascading 권유 (별도 ADR 후보). |
| **tsc 전역 0 errors 안정화** | G-004 ~ G-006 (전 Goal) | verify Stage 에서 "사전 존재 vs 본 Goal 원인" 분기 진단 부담 ↓. base-line 0 errors. |
| **multi-site BOM 스크립트 일괄** | G-004 ~ G-006 + 후속 | N 사이트 동시 변환 패턴 reference 확보. 사이트당 round-trip 절감 ≈ N-1 회. |

**누적 추정**: G-004 ~ G-006 (3 Goal) 에서 약 8 ~ 12 round-trip 절감 + 1 ADR (Storybook story 자동화) 신설 가능성.

---

## 6. Verifier 자가-검산 (C-26)

- denominator 산식: SPECIFY 28/28 / IMPLEMENT 21/21 / VERIFY weighted 100. 모두 N/A 분모 제외 일치.
- failedChecks 배열 길이: 모두 0 = NO count 0 일치.
- 카테고리 합계: SPECIFY 32 / IMPLEMENT 24 / VERIFY 16 — rubric 총 항목 일치.
- weightedScore (VERIFY): `100×0.10 + 100×0.15 + 100×0.40 + 100×0.25 + 100×0.10 = 100.0` 일치.
- JSON 무결성: 3 score JSON 모두 Read 성공, parse 가능 (escape 문제 없음).

---

## 7. 권고사항 (다음 Goal 착수 전)

1. **G-004 spec writer** 에 본 self-review 보고서 2.3 절 (단일 페이지 multi-site 마이그레이션 패턴) reference 제공 — multi-site 페이지 발견 시 일괄 변환 절차 직접 인용.
2. **G-004 Coverage Verifier (haiku)** 에 implement-rubric v1.0.11 F-04 sub-bullet 명시 — 주석/문자열 negative grep 의무 의식.
3. **시각 회귀 자동화 ADR** 신설 후보 — Storybook story + Chromatic 또는 Playwright screenshot. G-004 ~ G-006 multi-site 페이지 누적 화면 상태 ≥ 30 추정 → 수동 검증 한계점.
4. **state.json sync** — task #18 완료 후 메인이 state.json 의 G-003 status='completed' + 다음 Goal pointer 갱신 (Self-Review 단계 외).

---

**참고 파일**:
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-003-spec.md`
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-003-specify-score.json` (100/100)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-003-implement-score.json` (100/100)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-003-verify-score.json` (100/100 weighted)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/decisions/MOD-GRID-17-decisions.md` (4 ADR)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/constraints.md` (C-1 ~ C-35)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/rubric/implement-rubric.md` (v1.0.11)
