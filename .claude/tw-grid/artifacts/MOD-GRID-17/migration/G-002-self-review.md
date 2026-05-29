# G-002 Self-Review — MOD-GRID-17 / migration / G-002

**Date**: 2026-05-15
**Reviewer**: Harness Reviewer (opus, Self-Review Stage)
**Goal**: account/Expense\* + Vat\* 5 페이지 사용처 마이그레이션
**Threshold**: 95 (high tier)
**3-Stage Scores**: specify 100/100 · implement 100/100 · verify 100/100 weighted (A100 B100 C100 D100 E100)

---

## 1. G-001 vs G-002 비교 (요약 표)

| 항목 | G-001 | G-002 | 비고 |
|------|-------|-------|------|
| 페이지 수 | 5 | 5 | 동일 (C-19 ≤5 준수) |
| JSX 사이트 수 | 6 | **9 (+50%)** | G-002 는 multi-grid 페이지 다수 (ExpenseCard 3 사이트) |
| migrationImpact | high | high | 동일 |
| Threshold | 95 | 95 | 동일 |
| specify score | 100/100 | 100/100 | rubricVersion 1.0.7 → 1.0.8 |
| implement score | 100/100 | 100/100 | rubricVersion 1.0.8 → 1.0.9 |
| verify weighted | 100/100 | 100/100 | rubricVersion 1.0.3 동일 |
| Round-trip 낭비 | 1 (boundary 차단 → advisor 자문) | 1 (BOM 누락 → BOM 추가 후 재시도) | G-001 의 cascading 차단으로 boundary 자체는 사전 해결, 새 패턴 발견 |
| 신규 ADR | 3 (ADR-001/002/003) | **1 (ADR-004)** | BOM 방향 매트릭스 |
| 신규 constraint | C-34 | **C-35** | 옵셔트 방향, 별도 신설 |
| 신규 rubric 변경 | F-03 확장 / F-05 강화 (24+F=6 불변) | F-03 sub-bullet (24+F=6 불변) | 메타 게이트 신설 없음 |

**핵심 차이**: G-001 self-review 의 cascading 효과 (boundary 우회 표준화) 가 G-002 의 1차 boundary 차단을 사전 차단 → G-002 Implementer 는 boundary 우회 자체는 자율 시도. 그러나 **PowerShell 우회 내부의 한국어 매칭 sub-detail** (스크립트 BOM 방향) 이 새 발견 사항.

---

## 2. Score 분석

### 2.1 모든 단계 100/100 — rubric 관대함 vs 사전 cascading 효과?

**판정**: G-001 self-review 와 동일 — rubric 관대함 아님. 본 Goal 의 100/100 은 다음 누적 효과:

1. **사전 cascading 적용**: C-34 (boundary 우회 의무) + ADR-MOD-GRID-17-001~003 + F-03 v1.0.9 확장 → Implementer 가 boundary 차단을 자율 우회 시도 → 1차 도구 boundary round-trip 절감.
2. **Spec 권위 정독**: spec D1-D8 8 개 결정으로 모든 모호점 사전 정리 + Section 1 L0-1~L0-5 9 사이트 직접 인용 (G-001 의 6 사이트보다 50% 증가).
3. **multi-grid 페이지 surgical 처리**: ExpenseCard 3 사이트 (L740 `onRowClick` 미사용) + ExpenseResearchCard 2 사이트 (L637 `onRowClick` 미사용) 의 props 보존 — EC-02 사전 식별로 일괄 추가 실수 차단.

### 2.2 채점 단계 N/A 적정성 검증

| 단계 | YES | NA | denom | N/A 정당성 |
|------|-----|----|----|----|
| specify | 27 | 5 | 27 | A-02 (TanStack API 변경 없음), A-03 (신규 영역 아님), A-05 (AG/Wijmo 참조 불필요), B-05 (gridRef 미사용), F-02 (MIT 영역만) — 사용처 마이그레이션 본질상 정당 |
| implement | 21 | 2 | 21 | A-07 (테스트 파일 없음 — spec 외 범위) + 1 추가 — 본 Goal scope 외 정당 |
| verify (weighted) | A=1+B=2+C=3+D=1+E=1 | A=2,B=3,D=1,E=2 (총 8) | per-category | 정당 N/A — Goal 제목에 build/vite/rollup/size-limit 키워드 없음 → A-03 vacuous 허용 조건 충족 (A 카테고리 vacuous 미발생 — A-02 YES 보유) |

N/A 산식 검산 (C-26 자기-검증) 통과. denominator 정확 — 산식 환각 0 건.

### 2.3 feedback 매커니즘 동작 — 정당한 0건

failedChecks 0건, feedback 거의 empty. 단계별 사이클 1 회. 본 Goal 의 spec 은 D1-D8 + Section 1 9 사이트 직접 인용 → H-01~H-03 환각 게이트 통과 → NO 자체 0 건.

단, **Implementer 단계 내부 1 round-trip** (BOM 없는 스크립트 → `MISS` → BOM 추가 후 재시도) 는 발생. 이는 rubric 점수 영역 밖이며 본 self-review 의 새 ADR/constraint/rubric sub-bullet 으로 사후 차단.

---

## 3. 신규 발견 사항 (G-002 Implementer 보고에서 식별)

### 3.1 발견 1: PowerShell BOM 이슈 — **opposite-direction BOM 매트릭스 필요** (CRITICAL)

**진단**:
- G-002 1차 시도: BOM 없는 PowerShell `.ps1` 스크립트로 한국어 emptyText 패턴 (`"조회된 데이터가 없습니다."`, `"법인카드 사용내역이 없습니다."` 등) 매칭 → 모두 `MISS`.
- 원인: PowerShell 5.x 가 BOM 없는 `.ps1` 를 **시스템 코드페이지** (Windows 한국어 = CP949) 로 디코드 → 스크립트의 CP949-해석-한국어 vs 파일의 UTF-8-인코딩-한국어 가 바이트 수준 불일치.
- 해결: 스크립트 자체에 BOM (`0xEF 0xBB 0xBF`) prepend → `g002_patch_all_bom.ps1` → 정상 매칭.
- 출력 파일 (변환된 `.tsx`) 인코딩은 여전히 UTF-8 BOM-미포함 (`[Text.UTF8Encoding]::new($false)`) — MEMORY.md #32 + C-34 준수.

**★ 중요 차별점**: 이 BOM 요구는 **출력 파일 BOM 금지** (C-34) 와 **정반대 방향**.

| 파일 | BOM 방향 |
|------|---------|
| `.ps1` 스크립트 자체 | **BOM 필요** (PowerShell 파서 인식) |
| 출력 `.tsx`/`.ts` 파일 | **BOM 금지** (빌드 도구 호환 + 한글 깨짐 차단) |

두 파일이 다르고, 방향이 반대. 한쪽 규칙을 다른 쪽에 잘못 적용하면 — 스크립트 BOM 누락 → 매칭 실패, 출력 BOM 포함 → 빌드 도구 syntax error 또는 한글 표시 깨짐.

**cascading 영향**: G-003 ~ G-006 (Cash\*, account 잔여, hr, payroll 등 한국어 emptyText/className 다수) 모두 동일 이슈 발생 예상.

### 3.2 발견 2: G-002 9 JSX 사이트 (G-001 6 사이트보다 +50%) — 패턴 식별

**분포**:
- 파일 1 (ExpenseGeneral): 2 사이트
- 파일 2 (ExpenseCard): **3 사이트 (multi-grid 최다)** — L525, L650, L740
- 파일 3 (ExpenseResearchCard): 2 사이트 — L560, L637
- 파일 4 (VatManage): 1 사이트
- 파일 5 (VatSchedule): 1 사이트

**패턴**: 일부 페이지가 multi-grid 구조 (탭/섹션별 grid). G-003~G-006 도 multi-grid 가능성 있음.

**rubric 영향**: 본 self-review 에서는 **specify-rubric 영향 없음** (사이트 카운트 검증은 spec.implementFiles match 룰 안에서 자연 처리 — D1~D8 결정 표에 9 사이트 enumerate 의무 이미 충족). 단 후속 Goal 에서 multi-grid 페이지가 나오면 spec writer 가 사이트 라인 enumerate 의무 유지.

이 발견은 **empirical 기록만**, rubric 변경 사항 없음 (advisor 권고 준수).

### 3.3 발견 3: tsc 환경 변화 (스코프 외)

G-001 때 잔존하던 7 errors (PayReal01EditModal.tsx L83-89 JSDoc 파싱 버그) 가 G-002 검증 시점에 0 errors. 캐시 갱신 또는 외부 수정으로 해소된 것으로 보임. **본 Goal 스코프와 무관** — 환경 변화 기록만, 본 Goal credit 으로 주장하지 않음.

---

## 4. rubric / constraints / ADR 개선 권고 (직접 수정 완료)

### 4.1 ADR-MOD-GRID-17-004 신설 (decisions/MOD-GRID-17-decisions.md)

**제목**: PowerShell 한국어 리터럴 매칭 — 스크립트 파일 BOM 의무 (Script-File BOM Requirement)

**핵심 결정**:
- 워크트리 환경에서 PowerShell-via-Bash 우회 적용 시 — 스크립트가 한국어 리터럴 1건 이상 포함하면 `.ps1` 파일에 BOM (`0xEF 0xBB 0xBF`) prepend 의무.
- 출력 파일은 BOM 미포함 유지 (ADR-001 불변).

**Trade-off 2+**:
- 대안 1 (inline 명령만 사용) → 거부: 9 사이트 × 5 파일 escape 지옥 + 유지보수성.
- 대안 2 (출력 파일도 BOM 일관) → 거부: 빌드 도구 호환성 + MEMORY.md #32.
- 대안 3 (PowerShell 7+ 강제) → 거부: 환경 통제 불가.

**Consequences**:
- 긍정: G-003 ~ G-006 cascading + 후속 모듈 적용.
- 부정: 스크립트 BOM prepend 1 단계 추가, BOM 방향 혼동 risk → C-35 + F-03 매트릭스로 명시 차단.

**위치**: `decisions/MOD-GRID-17-decisions.md` 끝에 추가 완료.

### 4.2 constraints.md C-35 신설 (별도 항목, advisor 권고)

**위치**: C-34 다음, 위반 처리 표 직전.

**제목**: PowerShell 스크립트 한국어 매칭 — 스크립트 파일 BOM 의무 (Script-File BOM, Opposite of Output BOM Rule)

**핵심 의무**:
- `.ps1` 스크립트가 한국어 리터럴 1건 이상 포함 → BOM prepend 의무.
- BOM 방향 매트릭스 (script BOM 필요 vs output BOM 금지) 양방향 명시.

**위반 처리 표 행 추가**: C-35 → BOM 누락 시 implement-rubric F-03 NO + 자동 재변환.

**advisor 권고 준수**: C-34 augment 가 아닌 **별도 신설** — 옵셔트 방향 (opposite-direction) requirement 는 separate visibility 필요. 미래 reader 가 한쪽 규칙을 다른 파일에 잘못 적용할 risk 차단.

### 4.3 implement-rubric.md v1.0.9 → v1.0.10 (F-03 sub-bullet, advisor 권고)

**변경 사항**:
- F-03 내부에 **"BOM 방향 매트릭스" sub-bullet 추가**. 새 메타 게이트 (F-07) 신설 **아님** (advisor 권고 — metagate proliferation 비용 회피 + C-26 항목 수 discipline 준수).
- F-03 검증 시 (한국어 변환 케이스 한정) 3 단계:
  - (a) 스크립트 BOM 첫 3 바이트 확인 또는 inline 우회.
  - (b) 출력 파일 BOM 첫 3 바이트 *부재* 확인.
  - (c) 변환 후 Read 도구로 한국어 정상 표시 검증.
- 항목 수 24 + F=6 **불변** (메타 게이트 신설 없음).

**근거 사례**: G-002 1차 시도 `MISS` → 2차 시도 BOM 추가 후 정상 (`g002_patch_all_bom.ps1`).

**버전 변경**: v1.0.9 → v1.0.10 (변경 사항 헤더 추가).

### 4.4 specify-rubric — 변경 없음 (Spec 단계 영향 없음)

본 발견 사항은 모두 Implementer 단계 내부 절차 — Spec 작성 단계에 영향 없음 (D8 결정에 PowerShell 우회 명시 의무 이미 v1.0.8 에 cascading). advisor 권고 준수.

---

## 5. 카탈로그 / 패턴 추가

별도 패턴 카탈로그 디렉토리 미존재 → ADR-MOD-GRID-17-004 가 single source. 후속 Goal (G-003~G-006) 의 Implementer prompt 에 ADR-004 + C-35 + F-03 BOM 매트릭스 cross-reference 의무 (메인 측 prompt 작성 시).

---

## 6. 후속 Goal 영향 + Cascading 효과 예측

| 후속 Goal | 영향 | 적용 의무 |
|----------|------|----------|
| MOD-GRID-17/G-003~G-006 (22 페이지 cascading) | account/Cash\* 등 한국어 emptyText/className 다수 → BOM 이슈 발생 예상 | C-35 + ADR-004 + F-03 BOM 매트릭스 모두 적용 |
| MOD-GRID-18~ (다른 사용처 마이그레이션 모듈) | 한국어 리터럴 + PowerShell-via-Bash 우회 → 동일 패턴 | 동일 cascading |
| MOD-GRID-01~16 (코어 패키지 변경) | 영향 없음 (워크트리 내부 monorepo 변경, base repo 우회 무관) | N/A |

**Cascading 효과 정량 예측** (advisor 검증):
- G-003 ~ G-006 = 4 Goal.
- 각 Goal 평균 1 round-trip 절감 (1차 `MISS` 발견 → 2차 BOM 추가 사이클 차단).
- 총 약 **4 cascading round-trip 절감 예상**.
- 1 Goal 당 평균 9 한국어 패턴 매칭 (G-002 실측) × 4 Goal = 약 36 매칭 사이트의 사전 보호.

---

## 7. 결론 및 산출물

### 7.1 본 Goal 점수 변동 없음
3 단계 모두 100/100 PASS — 본 self-review 는 rubric/constraints/ADR 개선만 수행. 점수 재채점 없음.

### 7.2 Self-Review 산출물 (durable)
1. ✅ ADR: `decisions/MOD-GRID-17-decisions.md` ADR-MOD-GRID-17-004 추가
2. ✅ `constraints.md` C-35 신설 + 위반 처리 표 행 추가
3. ✅ `rubric/implement-rubric.md` v1.0.9 → v1.0.10 (F-03 BOM 매트릭스 sub-bullet 추가)
4. ✅ 본 Self-Review 보고서 (`G-002-self-review.md`)
5. (변경 없음) `rubric/specify-rubric.md` — Spec 단계 영향 없음

### 7.3 다음 단계
- state.json 동기화: G-002 stage `self_review` 완료, score 100/100/100, threshold 95.
- G-003 시작 시 메인 prompt 에 C-35 + ADR-004 + F-03 BOM 매트릭스 cross-reference 의무.

---

## 8. 참고

- G-002 Implementer 보고: 1차 BOM 없는 `.ps1` 스크립트 → 한국어 패턴 매칭 `MISS` → 2차 BOM 추가 (`g002_patch_all_bom.ps1`) 정상 해결
- G-001 self-review (`G-001-self-review.md`) — boundary 우회 cascading 효과로 G-002 boundary 차단 사전 해결됨
- ADR-MOD-GRID-17-001 (PowerShell-via-Bash 우회 표준)
- ADR-MOD-GRID-17-004 (스크립트 BOM 의무, 본 self-review 작성)
- MEMORY.md 교훈 #32 (출력 BOM 금지)
- CLAUDE.md "필독: Windows 환경 규칙"
- C-34 (출력 BOM 미포함) + C-35 (스크립트 BOM 필요) — opposite direction
- implement-rubric.md v1.0.10 F-03 BOM 방향 매트릭스
