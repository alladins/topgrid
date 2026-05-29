# MOD-GRID-09/G-003 — Stale `checks[].result` Fields + 추가 NO 3건 발견

**Date**: 2026-05-26
**Module**: MOD-GRID-09
**Goal**: G-003 (DateFilter)
**Stage**: specify (re-Verifier audit)
**Severity**: medium (process bug) + medium (rubric retroactive 미적용)

---

## 1. 발견 경위

1. `tw-harness-diagnose` agent 가 `G-003-specify-score.json` 의 `checks[].result` 필드를 읽은 결과 — A-01/A-03/E-02/F-03 **4건이 result=NO** 로 보임.
2. 동시에 score JSON top-level `score=100`, `passed=true`, `noCount=0` — `failedChecks=[]`.
3. C-26 산식 모순 의심: noCount=0 인데 NO 가 4건 → diagnose agent audit trigger.
4. 메인 세션이 spec.md 본문 spot check 4/4 직접 수행:
   - A-01: L44-45 '현 구현 없음' 명시 확인 → 실재 (N/A 인정)
   - A-03: L135-150 8 variant 호환성 표 확인 → 실재 (YES)
   - E-02: L430-516 Before/After 코드 블록 확인 → 실재 (YES)
   - F-03: L532-554 Docusaurus + Storybook 명시 확인 → 실재 (YES)
5. 메인 결론: spec 본문은 정상, score JSON 의 `checks[].result` 필드만 stale → 재-Verifier 호출.

---

## 2. Process Bug (검출 결과 #1)

### 증상
`G-003-specify-score.json` 에서 4건의 `checks[].result` 필드 (A-01/A-03/E-02/F-03) 가 result="NO" 로 남아있으나, top-level 카운터 (`yesCount`, `noCount`, `naCount`, `denominator`, `score`) 는 모두 정정된 값 (100/0/N/...) 으로 갱신됨. `feedback` 필드에 'loop0: A-01/A-03/E-02/F-03 누락' 기록 + loop1 정정 완료. **개별 result 필드만 미동기**.

### 원인 추정
score writer (specify-rubric evaluator) 가 loop 진행 시:
- top-level 카운터 + score + passed + failedChecks + feedback 모두 갱신
- `checks[]` 객체의 각 항목 `result` 필드는 **갱신 누락** — loop0 NO 가 그대로 보존

### 영향
- diagnose / monitor / inspect 도구가 `checks[].result` 를 source-of-truth 로 사용 시 false-positive audit trigger
- 본 사건이 정확히 이 시나리오: tw-harness-diagnose 가 stale 필드 보고 → 메인이 audit 의심 → 재-Verifier 호출 비용 발생

### 권고 (cross-harness 적용)
- **score writer 의무 추가**: feedback/yesCount 갱신 시 `checks[<id>].result` 도 동기 갱신 의무. 특히 NO → YES 전환 시 필수.
- **rubric specify-rubric.md L34-41 C-26 자기-검증 강화**: 카운터 일치뿐 아니라 `checks[].result` 와 top-level 일관성 cross-check 추가:
  ```
  - failedChecks 배열 vs checks[].result === 'NO' 의 id 집합 일치 의무
  - yesCount === checks[].result === 'YES' 카운트 일치 의무
  ```
- **promotion 후보**: tw-grid + tw-harness + tw-mail 모두 score JSON 구조 유사 — N=1 (본 사건). 추가 사례 발견 시 promotion (M-3 mechanism).

---

## 3. 신규 NO 3건 발견 (검출 결과 #2 — 더 중요)

재-Verifier 가 v1.0.9 rubric 적용 결과: stale 4건은 모두 YES 정정 (메인 spot check 일치). 그러나 **별개 3건의 NO** 가 신규 발견됨.

### 3.1 A-05 — spec body 에 AG Grid/Wijmo 미인용

**증상**: spec.md G-003 본문 어디에도 `AG Grid` 또는 `Wijmo` 텍스트 0건 (Bash grep 확인). goals.json L183-184 referenceEvidence 에 R-A/R-W 명시되지만 spec 본문 미인용.

**비교 peers**:
- G-001 spec L19 D5: "AG Grid Community 기본 동작 패턴 채택"
- G-002 spec L644-645: "AG Grid Community NumberFilterModule" + "Wijmo Filtering 동등"
- G-004 spec L555: feature comparison 표 (TOMIS Grid / AG Grid Community / AG Grid Enterprise / Wijmo 4 column)
- G-003 spec: 0건

**Rubric A-05 적용**: "참조 분석 없이 신규 API 설계" → NO. N/A 절 (두 라이브러리에 동등 기능 없음) 적용 불가 (실제로 두 라이브러리 모두 동등 DateFilter 보유).

### 3.2 C-04 — Section 1 에 migrationImpact 누락

**증상**: spec.md L1-10 헤더 + Section 1 L33-50 본문 어디에도 `migrationImpact` 또는 `Migration Impact` 텍스트 0건. goals.json L156 'migrationImpact: medium' 존재하지만 spec 본문 미명시.

**비교 peers**:
- G-001 spec L7: `**threshold**: 90 (migrationImpact: medium)` + L34 표
- G-002 spec L7 + L38: 동일 패턴
- G-004 spec L6: `Migration Impact: low` header
- G-003 spec: **미명시**

**Rubric C-04 strict 적용**: "Section 1**과** Goal JSON에 migrationImpact 필드 + 사유" — Section 1 누락 → NO.

### 3.3 G-01 — D# 결정 ↔ goals.json 데이터 불일치 (★ 핵심)

**증상** (rubric v1.0.6 L385-394 'Spec D# 결정 ↔ goals.json 데이터 일관성' sub-rule 위반):

**(a) 경로 prefix 일관성 위반**:
- spec.md L18 D1: "topvel-grid-monorepo/packages/grid-features/" (monorepo prefix, C-28 적용)
- spec.md L9 헤더: "Monorepo Path: D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/"
- spec.md L189-199 Section 7 implementFiles: 모두 `packages/grid-features/...` (monorepo prefix)
- **vs** goals.json L192-194 implementFiles[3] 모든 entry: `D:/project/topvel_project/TOMIS/packages/grid-features/...` (TOMIS prefix) — D1 결정과 정면 모순

**(b) 변경 파일 수 일관성 위반**:
- spec.md L28 D11: "implementFiles 7행: NEW 3 + MODIFY 4"
- **vs** goals.json L192-194 implementFiles[3] entry: DateFilter.tsx, filterFns.ts, types.ts (단 3개) — 4개 누락:
  - DateFilter.stories.tsx (NEW, D5)
  - decisions/MOD-GRID-09-decisions.md (NEW, D8)
  - index.ts (MODIFY, D11)
  - package.json (MODIFY, D11)

**Rubric v1.0.6 L394 인용 (정확히 본 사례)**: "G-003 spec loop 0 2026-05-15: 1차 spec D1 결정 = 'monorepo prefix 채택'. 그러나 goals.json G-003 implementFiles[5] 모든 entry 가 TOMIS prefix. spec writer 가 D1 결정만 명시 + goals.json 갱신 누락." — **본 사건 재발**.

**역사적 컨텍스트**:
- G-003 specify lastRun = 2026-05-14
- rubric v1.0.6 G-01 sub-rule 신설 = 2026-05-15 (정확히 본 G-003 loop 0 사례를 근거로 신설됨)
- 원본 score=100 은 v1.0.6 이전 평가 → 신설 sub-rule 미적용 정상
- 본 재-Verifier 가 v1.0.9 retroactive 적용 → NO

---

## 4. 최종 점수 (v1.0.9 적용)

```
yesCount: 21
noCount: 3 (A-05, C-04, G-01)
naCount: 8
denominator: 24
score: 87.5 (= 21/24 × 100)
threshold: 90 (medium)
passed: false (87.5 < 90)
```

**원본 vs 재-Verifier**:
| 항목 | 원본 (lastRun=2026-05-14, pre-v1.0.6) | 재-Verifier (v1.0.9, 2026-05-26) |
|------|---------------------------------------|----------------------------------|
| score | 100 | 87.5 |
| passed | true | false |
| noCount | 0 | 3 |
| failedChecks | [] | ['A-05', 'C-04', 'G-01'] |

---

## 5. 메인 세션 spot check 4/4 와의 일치

메인이 확인한 4건 (A-01/A-03/E-02/F-03) 은 모두 재-Verifier 평가에서:
- A-01: N/A (현 구현 없음 명시) — N/A 처리 일치
- A-03: YES (Section 4.7 8 variant 표 실재) — 일치
- E-02: YES (Section 12 Before/After 실재) — 일치
- F-03: YES (Section 13 Docusaurus + Storybook 실재) — 일치

→ **메인 spot check 4/4 모두 일치**. diagnose agent 보고는 stale 필드 → 무효.

신규 발견 3건 (A-05/C-04/G-01) 은 메인 spot check 범위 외 — 본 재-Verifier 가 32 항목 전체 재평가 의무 수행 결과 발견.

---

## 6. Cross-harness 시사점 (★ 중요)

### 6.1 Score writer process bug (검출 결과 #1)
- **N=1 사례** (본 사건). 추가 사례 발견 시 promotion.
- 권고: score writer 의무에 "checks[].result 동기 갱신" 명시 + C-26 자기-검증 강화 (failedChecks ↔ checks[].result === 'NO' set 일치 check).

### 6.2 Rubric version 회귀 적용 정책 (검출 결과 #2 의 메타 finding)
- **N=1 사례**: G-003 specify lastRun=2026-05-14 + rubric v1.0.6 신설=2026-05-15 → 신규 sub-rule 미적용 (1.5+ 년 후 재-Verifier 가 발견).
- 권고: tw-grid + tw-mail 모두 rubric 버전 진화 — Goal score JSON 에 `rubricVersionAppliedAt` 필드 추가하여 추후 신규 sub-rule 적용 여부 audit 가능.
- 권고: rubric ledger (`rubric/CHANGELOG.md`) + Goal 별 `rubricVersionAtRun` 매핑 도입 — N=1 (본 사건), 추가 사례 발견 시 promotion.

### 6.3 Spec writer 의무 강화 (G-01 sub-rule 재발 차단)
- v1.0.6 신설 후에도 동일 패턴 재발 가능성 — 본 G-003 처럼 신설 이전 Goal 이 재-Verifier 에서 NO 로 정정될 수 있음.
- 권고: spec writer prompt 에 "D# 결정 작성 직후 goals.json 동기 갱신 의무" 명시 + spec-implementer handoff 단계에 goals.json drift audit 자동 수행.

---

## 7. 메인 세션 후속 조치 권고

1. **goals.json G-003 정정** (실 코드는 이미 monorepo prefix 로 구현 완료 — implement score JSON 의 externalDirectoryGitBypass 인용):
   - implementFiles[] 7 entry 로 확장 (DateFilter.tsx, DateFilter.stories.tsx, decisions/MOD-GRID-09-decisions.md, filterFns.ts, types.ts, index.ts, package.json)
   - 모든 prefix → `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/...`

2. **spec.md G-003 정정** (선택사항 — 이미 implement done 상태이므로 audit trail 목적):
   - Section 1 에 'migrationImpact: medium' 한 줄 추가 (C-04 보완)
   - Section 13 또는 Section 1 에 R-A (AG Grid Community Date Filter) + R-W (Wijmo DateFilter range) 동등 기능 한 단락 추가 (A-05 보완)

3. **state.json 갱신 결정**: 본 재-Verifier 는 score JSON + finding 만 저장. state.json 의 G-003 specify 상태 (`status: done, score: 100, loops: 1`) 갱신 여부는 메인 세션 결정.
   - 옵션 A (보수): 원본 100 유지 + 본 재-Verifier 결과를 `verifierIteration: 2` 보조 기록으로 보존. 이유: G-003 implement + verify 모두 done 상태이고 rubric 신설은 사후. Re-spec loop 비용 > audit trail 가치.
   - 옵션 B (엄격): re-spec loop 1 실행하여 87.5 → 100 회복. 이유: v1.0.9 rubric 준수 + cross-harness 정합성.

4. **diagnose agent 의 본 finding 활용**: stale 필드 false-positive trigger 의 정확한 원인 진단으로 활용.

---

## 8. 본 재-Verifier 결과 요약

- **메인 spot check 4/4**: 모두 일치 확인 ✓
- **신규 발견**: A-05 (R-A/R-W 미인용), C-04 (Section 1 migrationImpact 누락), G-01 (D# ↔ goals.json 2축 불일치)
- **score**: 87.5 (passed=false)
- **C-26 자기-검증**: 통과 (denominator 24 = YES 21 + NO 3, N/A 8 분모 제외, failedChecks NO 만 포함, 카테고리 합계 32 ✓, JSON.parse 성공)
- **anti-anchoring**: 기존 G-003-specify-score.json 미열람 ✓ (anchoring 방지)
- **audit 증거 보존**: 기존 score JSON 덮어쓰기 X, 신규 파일 G-003-specify-score-r2.json 별도 저장 ✓
- **state.json 갱신**: X (메인 세션 결정) ✓
- **git commit**: X (자동 실행 금지 준수) ✓

---

**Re-Verifier Agent**: Coverage Verifier opus (re-call)
**산출 파일**:
- score JSON: `.claude/tw-grid/artifacts/MOD-GRID-09/filter-ui/G-003-specify-score-r2.json`
- finding: `.claude/tw-grid/findings/auto-fixed/MOD-GRID-09-G-003-stale-checks-fields.md` (본 파일)
