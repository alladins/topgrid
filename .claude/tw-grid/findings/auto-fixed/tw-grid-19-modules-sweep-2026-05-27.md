# tw-grid 19 모듈 sweep audit — 2026-05-27

**Trigger**: MOD-GRID-09 정정 사이클 완료 후, 동일 패턴 재발 여부 확인. 사용자 지시 "rubric v1.0.10 신설 후 다음 진행 해줘" (2026-05-27).

**범위**: MOD-GRID-09 제외 19 모듈, 76 Goal, ~240 score JSON
**Methodology**: MOD-GRID-09 sweep 에서 확립된 audit-only Single Agent (opus) + 압축 보고
**상태**: read-only audit 완료. 정정은 별도 cycle (사용자 결정 영역).

---

## ★ HEADLINE — Audit Damage 잠재 (NO under-reporting)

`actualNoCount > reportedNoCount` — 실 NO 가 보고 NO 보다 많음. **G-003 r1 process bug 와 동일 mechanism** 추가 발견.

| 파일 | actual NO | reported NO | reported score | 재계산 score | threshold | passed? |
|------|-----------|-------------|----------------|--------------|-----------|---------|
| `MOD-GRID-06/export/G-005-specify-score.json` | **3** | 2 | 92.59 | **90.0** | 90 | 간신히 ✓ |
| `MOD-GRID-15/aggregation/G-004-specify-score.json` | **2** | 1 | 95.45 | **90.9** | 90 | 간신히 ✓ |

→ **두 case 모두 actual score 가 여전히 90% 임계 통과**. 정정 후에도 PASS 유지. 그러나 audit trail 손실.

**N=3+ promotion 임계 도달**: G-003 r1 + 본 2건 = N=3 → tw-grid `feedback-tw-grid-rubric-actual-execution.md` promotion 권장 (rubric 채점기 산식 의무 도입).

---

## 모듈별 위반 분포 (19 모듈)

| 모듈 | Pattern A | Pattern B | Pattern C | NO 누락 | corrupt |
|------|-----------|-----------|-----------|---------|---------|
| MOD-GRID-00 monorepo | 0/4 ✅ | 0/4 ✅ | 5 | 0 | 0 |
| MOD-GRID-01 wrapper | 0/5 ✅ | 0/5 ✅ | 8 | 0 | **2** |
| MOD-GRID-02 state | 0/6 ✅ | 2/6 | 7 | 0 | 0 |
| MOD-GRID-03 pagination | 3/3 🔴 | 3/3 🔴 | 5 | 0 | 0 |
| MOD-GRID-04 column | 0/3 ✅ | 3/3 🔴 | 4 | 0 | 0 |
| MOD-GRID-05 renderer | 0/3 ✅ | 0/3 ✅ | 6 | 0 | 0 |
| MOD-GRID-06 export | 5/5 🔴 | 1/5 | 9 | **1** ★ | 0 |
| MOD-GRID-07 column-drag | 0/2 ✅ | 0/2 ✅ | 3 | 0 | 0 |
| MOD-GRID-08 multi-sort | 2/2 🔴 | 1/2 | 1 | 0 | 0 |
| MOD-GRID-10 tracking | 2/5 | 0/5 ✅ | 6 | 0 | 0 |
| MOD-GRID-11 range | 6/6 🔴 | 1/6 | 14 | 0 | 0 |
| MOD-GRID-12 datamap | 4/4 🔴 | 0/4 ✅ | 7 | 0 | 0 |
| MOD-GRID-13 merging | 3/3 🔴 | 0/3 ✅ | 6 | 0 | 0 |
| MOD-GRID-14 header | 0/3 ✅ | 2/3 | 5 | 0 | 0 |
| MOD-GRID-15 aggregation | 4/4 🔴 | 2/4 | 7 | **1** ★ | 0 |
| MOD-GRID-16 enhancement | 3/3 🔴 | 2/3 | 5 | 0 | 0 |
| MOD-GRID-17 migration | 0/6 ✅ | 0/6 ✅ | 10 | 0 | 0 |
| MOD-GRID-99-A license | 2/3 | 3/3 🔴 | 5 | 0 | 0 |
| MOD-GRID-99-B docs | 2/5 | 3/5 | 10 | 0 | 0 |
| **합계** | **36 Goal** | **23 Goal** | **123 건** | **2 건** | **2 건** |

---

## Corrupt JSON (2건)

| 파일 | 오류 |
|------|------|
| `MOD-GRID-01/wrapper/G-001-implement-score.json` | Expected ',' or '}' at line 86 column 50 |
| `MOD-GRID-01/wrapper/G-005-implement-score.json` | Expected ',' or '}' at line 31 column 199 |

→ JSON.parse 불가. evidence escape 누락 추정 (specify-rubric L41 / implement-rubric L62 가 명시한 사례). 정정 필요.

---

## 정정 우선순위

| 우선순위 | 항목 | 건수 | 영향 |
|----------|------|------|------|
| 🔴 즉시 | HEADLINE NO 누락 (audit damage) | 2 | score audit trail 손실 |
| 🔴 즉시 | corrupt JSON | 2 | parse 불가, downstream tooling 차단 |
| 🟠 중간 | Pattern A (TOMIS prefix stale) | 36 | spec authority drift 위험 |
| 🟡 낮음 | Pattern B (spec body 누락) | 23 | 약위반, 일부는 비-그리드 모듈 적절성 약함 |
| 🟢 audit trail | Pattern C (count 분류 오류) | 123 | score 무영향 |

**예상 정정 부담**: HEADLINE 2 + corrupt 2 + Pattern A 36 + Pattern B 13 (그리드 모듈만) + Pattern C 123 = **약 176 파일** (Pattern C 포함 시). Pattern C 제외 시 약 53 파일.

---

## 메타 finding

### 1. NO 누락 mechanism N=3+ 도달
- MOD-GRID-09/G-003 specify r1 (process bug, 4건 NO stale)
- MOD-GRID-06/G-005 specify (1건 NO 누락)
- MOD-GRID-15/G-004 specify (1건 NO 누락)

→ tw-grid `feedback-tw-grid-rubric-actual-execution.md` 또는 `feedback-tw-grid-spec-goals-sync.md` 의 promotion 임계 도달. rubric v1.0.10 의 yesCount/naCount mechanical 재계산 sub-rule 이 이미 도입됨 — 본 sweep 결과는 v1.0.10 도입 직후 retroactive sweep 가치 검증.

### 2. Pattern A 광범위 분포 (13 모듈 36 Goal)
spec writer 가 spec D1 (monorepo prefix) 결정 갱신 후 goals.json 측 단방향 동기 누락이 시스템적. 자동 보조 도구 (`tools/spec-goals-sync.mjs`) 도입 권장.

### 3. Pattern C systematic offset (rubric 채점기 산식 버그)
MOD-GRID-11 (최다 14건) 등에서 implementer/verifier 양쪽 보고가 동일한 잘못된 카운트 — rubric 채점기 자체 버그 가능성. rubric v1.0.10 mechanical 재계산 의무가 future 적용. 기존 score JSON 은 retroactive fix 별도.

### 4. 6 score JSON `checks` 필드 부재 (information only)
implementer 자체 보고 schema 변종 (`wiringAuditPass` 등). 위반 아니나 audit 도구 호환성 필요.
- MOD-GRID-02/G-004-implement, MOD-GRID-04/G-002-implement, MOD-GRID-06/G-005-implement
- MOD-GRID-11/G-001 + G-002 implement, MOD-GRID-16/G-001-implement

---

## 후속 cycle 권장 순서

1. **(즉시)** HEADLINE 2건 + corrupt 2건 정정 — 4 파일
2. **(중기)** Pattern A 36 Goal 일괄 정정 + `tools/spec-goals-sync.mjs` 자동 보조 도구 도입
3. **(중기)** Pattern B 13 그리드 Goal migrationImpact 본문 슬롯 추가 + 비-그리드 모듈은 적절성 별도 정책 결정
4. **(장기)** Pattern C 123건 — rubric 채점기 retroactive fix, score 무영향이므로 일괄 처리 가능

각 단계 별도 cycle 권장 (Single Patcher Agent — methodology 확립됨).

---

**사이클 종료**: 2026-05-27. 정정 작업은 미수행 (사용자 결정 영역).
