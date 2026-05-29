# tw-grid 최종 정리 cycle — corrupt + schema + cross-harness sweep

**Trigger**: 사용자 지시 "권장한대로 다음 사이클 진행" — 잔존 권장 3건 (corrupt whitelist + schema 통일 + cross-harness sweep) 일괄 처리.

**상태**: 3 권장 모두 처리 완료. cross-harness sweep 결과 **tw-harness HEADLINE 4건 추가 발견** (별도 cycle 권장).

---

## 처리 단계

| # | 작업 | 결과 |
|---|------|------|
| 1 | corrupt JSON whitelist 패치 | MOD-GRID-09/G-001 implement corrupt 정정 + whitelist 비움. corrupt 0건 확정 |
| 2 | tw-grid score JSON schema 통일 | 247 파일 schema migration + 7 alt-schema whitelist. grid-state-sync warning 0 |
| 3 | cross-harness retroactive sweep | tw-mail 485 + tw-harness 702 read-only audit. 위반 패턴 통계 산출 |

---

## ★ HEADLINE — tw-harness audit damage 잠재 4건 (별도 cycle 즉시 권장)

tw-grid sweep 에서 발견된 NO under-reporting mechanism 이 tw-harness 에 4건 추가 발견. **모두 v1.2.0 promotion 이전 vintage** (2026-05-16 batch-touched).

| # | 파일 | actual NO | reported NO | reported / recalc score | 영향 |
|---|------|-----------|-------------|-------------------------|------|
| 1 | `MOD-08/기안문작성/G-004-implement-score.json` | 1 (B-01) | 0 | 100 / 95 | PASS reported, B-01 NO 명시되어 있으나 noCount=0 |
| 2 | `MOD-13/인사평가/G-005-specify-score.json` | 1 (A-02) | 0 | 95.8 / **75** | **PASS→FAIL 전환 가능** (threshold 85 가정 시 20점 down) |
| 3 | `MOD-04/내부고객만족도/G-001-specify-score.json` | 4 | 3 | 85 / 83 | NO 1건 누락 |
| 4 | `MOD-01/전표관리/G-013-specify-score.json` | 7 | 6 | 57.1 / 53 | 이미 FAIL (변동 없음) |

→ **#2 MOD-13/G-005 즉시 재채점 권장** (threshold 따라 PASS→FAIL 전환 가능).

## Corrupt JSON 5건 (cross-harness)

| 하네스 | 파일 | 오류 |
|--------|------|------|
| tw-mail | `MAIL-07/첨부파일관리/G-MAIL-07-011-implement-score.json` | Bad escaped char L43 |
| tw-harness | `MOD-10/우선구매실적/G-003-implement-score.json` | Bad escaped char L94 |
| tw-harness | `MOD-17/도서관리/G-001-implement-score.json` | Expected ',' or '}' L86 |
| tw-harness | `MOD-19/설문조사/G-003-be_verify-score.json` | Expected ',' or '}' L100 |
| tw-harness | `MOD-19/설문조사/G-005-implement-score.json` | 한글 path string 손상 |

## Pattern C 475건 (score 무영향, audit trail only)

| 하네스 | 카운트 | 상위 모듈 |
|--------|--------|----------|
| tw-mail | 180 | MAIL-09 (29), MAIL-19 (17), MAIL-06 (14), MAIL-12 (14), MAIL-14 (13) |
| tw-harness | 295 | MOD-23 (23), MOD-21 (20), MOD-01 (19), MOD-02 (11), MOD-18 (9) |
| **합계** | **475** | denom=YES count 산식 시 score 정확. YES/NA 분류만 부정확 |

## NoCounts schema 16건 (tw-mail 전용)

tw-mail rubric의 일부 verify 모델이 카운트 합계 미출력 schema variant 사용. tw-mail에만 발견 (tw-harness 0건). schema 통일 PR 필요.

---

## v1.2.0 promotion 효과 검증 (간접 증거)

- **HEADLINE 4건 모두 promotion 이전 vintage** (2026-05-16 batch-touch)
- **promotion 이후 vintage HEADLINE 신규 발견 0건**
- → sub-rule (mechanical count 강제) 효과 가설 일치

---

## 누적 mechanism 통계 → promotion 강화 후보

| Mechanism | tw-grid | tw-mail | tw-harness | 누적 N |
|-----------|---------|---------|------------|--------|
| HEADLINE (NO under-reporting) | 3 | 0 | 4 | **N=7** (cross-harness 확인) |
| Pattern C (YES/NA 분류) | 123 | 180 | 295 | **N=598** (audit trail only) |
| Corrupt JSON (escape) | 3 | 1 | 4 | **N=8** |
| schema drift | 254 | 104 | 0 | cross-harness 차이 |

→ 향후 promotion 강화 후보:
1. **HEADLINE N=7** → cross-harness universal `failedChecks ↔ checks.result=NO` mechanical 일치 강제 게이트
2. **Pattern C N=598** → `yesCount/naCount mechanical 재계산 의무` 강화 (현 v1.2.0 sub-rule 이미 도입, retroactive sweep 필요)
3. **Corrupt JSON N=8** → agent 출력 후 자동 `JSON.parse` 게이트 (rubric 자기-검증 의무 강화)

---

## 본 cycle 변경 파일

### 정정 (5 파일)
- `artifacts/MOD-GRID-09/filter-ui/G-001-implement-score.json` (corrupt → parse OK)
- `tools/grid-state-sync.mjs` (whitelist v1.1.3 빈 Set + v1.1.4 KNOWN_ALT_SCHEMA_WHITELIST)
- 247 tw-grid score JSON (schema migration)

### 신규 도구 (1 파일)
- `tools/score-schema-migrate.mjs` (~350줄, idempotent, dry-run + apply 모드)

### 신규 finding (1 파일)
- `findings/auto-fixed/tw-grid-final-cleanup-cycle.md` (본 파일)

---

## 다음 cycle 권장 (사용자 결정)

### P0 — 즉시 (audit damage 위험)
| 항목 | 부담 | 비고 |
|------|------|------|
| **tw-harness 4 HEADLINE 정정** | 작음 (4 파일) | MOD-13 G-005 즉시 재채점 (PASS→FAIL 전환 가능) |
| **5 corrupt JSON 정정** | 작음 (5 파일) | evidence escape 누락 패턴 |

### P1 — 중기
| 항목 | 부담 | 비고 |
|------|------|------|
| tw-mail 16 noCounts schema 통일 | 중간 | tw-mail rubric에 summary counts 필수 키 강제 |
| tw-mail/tw-harness score schema 통일 (104) | 중간 | tw-grid 와 동일 패턴, score-schema-migrate.mjs 재활용 가능 |

### P2 — 후속
| 항목 | 부담 | 비고 |
|------|------|------|
| Pattern C 475건 일괄 정정 | 큼 (도구 활용) | score 무영향, audit trail 정확화 |

---

**사이클 종료**: 2026-05-28. 잔존 권장 3건 모두 처리. cross-harness sweep 결과 추가 권장 사항은 사용자 결정 시 시작.
