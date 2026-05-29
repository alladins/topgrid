# MOD-GRID-09 (filter-ui) 모듈 audit + 정정 사이클 — 2026-05-27

**Trigger**: G-003 정정 사이클 (r1 process bug → r2 audit FAIL → r3 PASS) 완료 후, 동일 모듈 다른 Goal (G-001/G-002/G-004) 동일 패턴 재발 여부 확인.

**사용자 지시**: "모듈 전체 검사 진행 해줘.. 안전하게 진행하는게 최선임" (2026-05-27)

**Methodology**: G-003 사이클에서 확립된 audit-only sweep + 정정 + 메인 spot check 패턴 그대로 적용.

---

## 사이클 단계

| 단계 | 산출 | 결과 |
|------|------|------|
| 1. Audit Agent (read-only sweep) | 3 Goal × 3 패턴 = 9 check | 11 위반 발견 |
| 2. Patcher Agent (정정 위임) | goals.json 3 entry + spec.md 1 + score JSON 6 = 10 변경 | 자기-검증 catch 1건 (G-004 specify mechanical count) |
| 3. 메인 spot check | TOMIS prefix grep + monorepo prefix count + score JSON 카운트 검증 | 모두 일치 |

---

## 발견 패턴

### Pattern A: goals.json implementFiles stale prefix + 카운트 불일치 (3/3 Goal 위반)

| Goal | 정정 전 entry 수 | spec Section 7 entry 수 | 정정 후 |
|------|-----------------|--------------------------|---------|
| G-001 | 6 (TOMIS prefix) | 7 | 7 (monorepo prefix) |
| G-002 | 3 (TOMIS prefix) | 5 | 5 (monorepo prefix) |
| G-004 | 6 (TOMIS prefix) | 8 | 8 (monorepo prefix) |

**근본 원인**:
- spec.md D1 ("topvel-grid-monorepo/packages/grid-features/ prefix 사용") + Section 7 표는 monorepo prefix로 일관 작성됨
- goals.json `implementFiles` 만 stale TOMIS prefix
- 추가로 spec Section 7 의 신규 stories.tsx / index.ts MODIFY entries 등이 goals.json 에서 누락

**원인 추정**: spec.md 갱신 시 goals.json `implementFiles` 동기화 hook 부재. spec writer 가 spec Section 7 만 갱신하고 goals.json 측 단방향 동기 누락.

### Pattern B: G-004 spec body migrationImpact 본문 슬롯 부재 (G-004만 약위반)

- G-001/G-002 는 Section 1 본문에 `migrationImpact` 명시 (table 또는 paragraph)
- G-004 는 L6 header `Migration Impact: medium` 만 있고 본문 슬롯 부재 — C-04 약위반
- 정정: L50 (Section 1.3 직후) 본문 한 줄 추가

### Pattern C: score JSON yesCount/naCount/denominator 분류 오류 (6/9 위반)

⚠️ **G-003 r1 process bug 와 다른 패턴**:
- **G-003 r1**: NO 4건이 stale checks[].result 에 남아있고 yesCount=27 + noCount=0 reported → **audit damage 있음** (FAIL 인데 PASS 보고)
- **본 모듈 Pattern C**: NO=0 정확, YES↔N/A swap 만. denominator=YES count 산식상 score 영향 0 → **audit damage 없음**, 분류만 부정확

| 파일 | reported yesCount | actual YES count | score 영향 |
|------|---|---|---|
| G-001-specify | 22 | 23 | 100→100 동일 |
| G-001-implement | 19 | 23 | 100→100 동일 |
| G-002-specify | 24 | 23 | 100→100 동일 |
| G-002-implement | 18 | 16 | 100→100 동일 |
| G-004-specify | 26 | **26** (audit Agent 추정 29 was wrong) | 100→100 동일 |
| G-004-implement | 18 | 23 | 100→100 동일 |

**G-004 specify 메타 게이트 분리 케이스**:
- score JSON `rubricMetadata.rubricItemsTotal=32, evaluableItems=26, naItems=6` → H-01~H-03 메타 게이트는 본 채점 항목 카운트 외 별도 집계
- audit Agent 가 mechanical count 시 H-gates 포함하여 29 추정 → 잘못된 값
- Patcher Agent 가 rubricMetadata signal 로 catch + 26 유지 결정

**근본 원인**: Coverage Verifier 가 checks 객체 작성 후 top-level 카운트 집계 시 YES/N/A 1-5건 분류 오류. score 산식에 영향 없어 PASS gate 통과. 후속 audit 트레이스에서만 표면화.

---

## Cross-Harness 시사점

### 1. Score JSON 카운트 mechanical 자기-검증 의무 강화
현 specify-rubric.md C-26 은 "denominator=YES+NO, failedChecks=NO only" 까지 명시. 본 audit 결과 추가 의무 필요:
- **`yesCount` mechanical 재계산**: checks 객체 순회 후 `result == "YES"` 카운트 = top-level `yesCount`
- **`naCount` mechanical 재계산**: 동일 형식
- 두 값이 top-level 카운트와 일치하지 않으면 동일 결과 폐기 + 새 Agent 인스턴스 재호출

### 2. spec.md ↔ goals.json `implementFiles` 양방향 동기 의무
spec writer 가 spec Section 7 갱신 시 goals.json `implementFiles` 도 동기 갱신 의무화. 또는 tools/spec-goals-sync.mjs 자동 보정 script 도입.

### 3. Pattern C ≠ G-003 r1 process bug 분리 명시
diagnose agent 가 "점수 부풀림" 추정 시 두 메커니즘 구분 필요:
- **r1 패턴**: checks[].result 에 NO 존재하나 yesCount/noCount 갱신 누락 → **audit damage 잠재**
- **카운트 오류 패턴**: NO=0 정확, YES↔N/A swap → **audit damage 없음**

진단 시 mechanical count 후 두 패턴 분리해 보고할 것.

---

## audit Agent 보고 신뢰도 평가

| 항목 | 정확성 |
|------|--------|
| Pattern A 발견 (3/3 위반) | ✅ 정확 |
| Pattern B G-004 약위반 | ✅ 정확 |
| Pattern C 6/9 위반 | ✅ 정확 (G-004 specify 메타 게이트 catch 는 Patcher 가 mechanical 재검증으로 발견) |
| Pattern C 잘못된 추정 1건 | ⚠️ G-004 specify yesCount=29 추정 → 실제 26 (메타 게이트 별도집계 미인지) |

→ audit Agent 는 evidence text 가 아닌 mechanical count 사용했으나, rubricMetadata signal 같은 메타 정보 누락 케이스 발생. **Patcher Agent 의 mechanical 재검증 의무가 audit Agent 오류 catch** (G-003 사이클의 r3 verifier 가 yes=26→yes=25 자기-catch 한 패턴 재현).

---

## 변경 파일 목록 (10건)

### goals.json (1 파일, 3 entry)
- `D:\project\topvel_project\TOMIS\.claude\tw-grid\goals\MOD-GRID-09\filter-ui-goals.json` — G-001/G-002/G-004 implementFiles

### spec.md (1 파일)
- `D:\project\topvel_project\TOMIS\.claude\tw-grid\artifacts\MOD-GRID-09\filter-ui\G-004-spec.md` — L50 migrationImpact 본문 슬롯

### score JSON (6 파일, auditMetadata 신규 + yesCount/naCount/denominator 정정)
- `G-001-specify-score.json`
- `G-001-implement-score.json`
- `G-002-specify-score.json`
- `G-002-implement-score.json`
- `G-004-specify-score.json` (무변동 + auditMetadata 만)
- `G-004-implement-score.json`

### 무수정 영역 (의도된 보존)
- G-003 entry (이미 r3 정정 완료, 별도 사이클)
- 다른 모듈 (MOD-GRID-00 ~ 08, 10 ~ 99-B)
- state.json (메인 결정 영역)
- 기존 verify 단계 3 score JSON (category-only model, Pattern C 비적용)
- spec.md G-001/G-002 본문 (Pattern B 위반 없음)

---

## 검증 결과 (메인 spot check)

| 검증 | 결과 |
|------|------|
| TOMIS prefix grep | 0 matches (모두 monorepo 또는 정당한 TOMIS path) |
| monorepo prefix count | 26 (G-001 7 + G-002 5 + G-003 6 + G-004 8 = 26) |
| G-004 spec.md L50 migrationImpact | 본문 슬롯 1줄 추가 확인 |
| 6 score JSON score/passed | 모두 100.0 / true 무변동 |
| 6 score JSON auditMetadata | 신규 필드 추가 확인 |

---

## 다음 단계 권장

1. **state.json 갱신**: G-001/G-002/G-004 의 stages.{specify,implement}.lastRun 정보 audit metadata 추가 (메인 결정 영역)
2. **Cross-harness 메모리**: `feedback-tw-grid-spec-goals-sync.md` 신규 — spec ↔ goals.json 동기 의무 + mechanical count 자기-검증 강화 (Pattern A/C 통합 finding)
3. **rubric v1.0.10 신설 후보**: C-26 자기-검증에 "yesCount/naCount mechanical 재계산" sub-rule 추가
4. **(선택) 모든 80 Goal score JSON 의 mechanical count sweep**: 비용 vs 가치 평가. 본 모듈 결과상 다른 모듈도 동일 패턴 가능성 있음

---

**사이클 종료**: 2026-05-27. Coverage Verifier 재호출 미수행 (score 무변동 + 분류 정정만, 의사결정 영향 0).
