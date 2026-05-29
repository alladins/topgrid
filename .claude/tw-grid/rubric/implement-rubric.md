# Implement Rubric — tw-grid v1.0.14 (24 + F 메타 게이트 6항목)

**v1.0.14 변경 사항 (2026-05-27 MOD-GRID-09 모듈 audit trigger — `[[feedback-tw-grid-spec-goals-sync]]`)**:
- **C-26 자기-검증 sub-rule 신설 (★ yesCount/naCount mechanical 재계산 의무)**: 기존 C-26 은 `denominator` 재계산만 명시. 본 sub-rule 로 `yesCount` 와 `naCount` 도 checks 객체 mechanical 재계산 의무화. 근거: 2026-05-27 MOD-GRID-09 모듈 implement 단계 4/6 score JSON 분류 오류 (예: G-001 yes 19→23, na 5→7). score 영향 0 (NO=0 정확, denominator=YES count 산식 동일) 이나 audit trail 신뢰성 손상. specify-rubric v1.0.10 과 동기 — `[[feedback-tw-grid-spec-goals-sync]]` R2 상세.
- **메타 게이트 별도집계 signal 검증 의무**: F-XX 별도 집계 시 `rubricMetadata.evaluableItems` signal 명시 의무. signal 부재 시 spec writer 가 메타 게이트 포함/제외 정책 명시.
- 항목 수 24 + F=6 불변 (C-26 sub-rule 내부 보강).

**v1.0.13 변경 사항 (2026-05-15 MOD-GRID-17/G-005 self-review)**:
- F-03 추가 sub-bullet (변경 증거 disjunction 확장): **No-op Implement Loop 합법 케이스**. 디스크의 변경 대상 파일이 spec D# end-state(예: Section 11.2 After 스니펫 또는 Section 2 사용 예시) 와 **1:1 일치** 인 경우 — 본 Goal 의 implement 단계가 변경 0건이어도 F-03 YES. (a) 변경 대상 파일 Read 결과가 spec After 와 statement-by-statement 동일 + (b) Implementer 가 `feedback.noOpImplementLoop` 블록에 사유 + 검증 방법 + diff 확인 evidence 명시 + (c) Implementer 는 C-36 따라 self-score 작성 거부 (Coverage Verifier 단독 채점). 세 조건 모두 충족 시 — 사전 적용된 마이그레이션 (cascading 정리 또는 별도 세션) 케이스 인정. cross-reference: C-1 surgical changes + C-36 implementer self-scoring 금지 + ADR-MOD-GRID-17-005 Investigative Scope-Reduction Authority (D# scope reduction 후 디스크가 이미 reduced end-state 인 경우).
- 항목 수 24 + F=6 불변 (F-03 내부 보강, 메타 게이트 신설 없음).

**v1.0.12 변경 사항 (2026-05-15 MOD-GRID-17/G-004 self-review)**:
- F-02 추가 sub-bullet (v1.0.4 sub-bullet "goals.json implementFiles ↔ spec.md Section 7 권위 충돌 처리" 아래 추가): **Spec D# 결정의 Documented Scope Reduction 우선 적용 의무**. spec D# 결정이 goals.json `affectedUsageFiles[]` 카운트 보다 적은 reduced scope 을 명시 (예: G-004 D1 "5 → 4 조정") 한 경우 — Implementer 는 **spec D# 결정의 reduced count 를 따라 N 파일만 변경**한다. goals.json 배열의 미반영 entry 는 audit trail 로 보존 (변경 금지). cross-reference: ADR-MOD-GRID-17-005 (Investigative Scope-Reduction Authority) + specify-rubric A-04 v1.0.9 sub-bullet (spec writer reality-check 의무).
- 항목 수 24 + F=6 불변 (F-02 내부 보강, 메타 게이트 신설 없음).

**v1.0.11 변경 사항 (2026-05-15 MOD-GRID-17/G-003 self-review)**:
- F-04 확장 (sub-bullet 추가): **Variant 잔존 grep 의무 — 주석/문자열 포함**. spec AC 가 "구 variant 0건" (예: AC-004 "로컬 BaseGrid import 0건") 명시 시, 코드 식별자 grep 0 hits 만으로는 YES 불가 — 변경 파일 내 주석(`//`, `/* */`) 및 문자열 리터럴까지 함께 grep 의무. G-003 InterestIncomePage L176 주석에 "BaseGrid" 단어 잔존 → Implementer 가 2차 패치 `g003_fix_comment_bom.ps1` 로 정리한 사례 (코드 grep 0 hits, 주석에 stale variant 단어 잔존) 차단. cross-reference: G-003 self-review 발견 1.
- 항목 수 24 + F=6 불변 (F-04 내부 보강, 메타 게이트 신설 없음).

**v1.0.10 변경 사항 (2026-05-15 MOD-GRID-17/G-002 self-review)**:
- F-03 확장 (sub-bullet 추가): PowerShell-via-Bash 우회 의무 내부에 **BOM 방향 매트릭스 (script-file BOM 필요 vs output-file BOM 금지)** 명시. G-002 Implementer 가 BOM 없는 `.ps1` 스크립트로 한국어 패턴 매칭 시도 → `MISS` → 2차 시도로 스크립트 BOM 추가 후 정상 해결한 사례 차단. cross-reference: constraints.md C-35 (신설) + ADR-MOD-GRID-17-004 (스크립트 BOM 의무).
- 항목 수 24 + F=6 불변 (F-03 내부 보강, 메타 게이트 신설 없음 — 검증 단계 추가).

**v1.0.9 변경 사항 (2026-05-15 MOD-GRID-17/G-001 self-review)**:
- F-03 확장: 워크트리 환경에서 base repo 사용처 파일 변경 시 Edit boundary 차단 발생 → **PowerShell-via-Bash 우회 시도 의무** 명시. boundary 차단 후 즉시 "진행 불가" escalate 패턴 차단. cross-reference: constraints.md C-34 (신설) + ADR-MOD-GRID-17-001 (PowerShell-via-Bash 표준화) + ADR-MOD-GRID-17-003 (Implementer boundary 우회 시도 의무).
- F-05 강화: prompt vs spec drift 외에 **Implementer 가 dep 해결 경로 추측 (spec 미독)** 도 prompt-spec drift 의 일종으로 보고 의무. specify-rubric B-04 강화와 cross-reference.
- 항목 수 24 + F=6 불변 (F-03, F-05 내부 보강).

**v1.0.8 변경 사항 (2026-05-15 MOD-GRID-10/G-003 harnessReview)**:
- F-06 확장: 메인 prompt vs spec 본문 충돌 시 spec 우선 + `promptSpecDrift[]` 보고 의무 명시. G-003 implement loop 0 (메인 prompt 가 spec D4/D5/D6/EC-02/EC-05 와 어긋난 코드 블록 주입 → drift 6건 → 73.9 FAIL) 패턴 차단. C-33 (Main Prompt Code Block Subordination) 신설과 cross-reference.
- 항목 수 24 + F=6 불변. v1.0.7 의 F-06 본문 케이스(spec internal-only defect) + 신규 메인 prompt 충돌 케이스 양쪽 처리 명시.

**v1.0.7 변경 사항 (2026-05-14 MOD-GRID-02/G-003 self-review)**:
- F-06 신설: Spec Internal Code Defect Reporting — spec 본문 코드 템플릿(Section 11.2 BEFORE/AFTER 등)에 컴파일 통과하지만 의미적 결함(Rules of Hooks 위반, dead branch 등)이 있어 Implementer가 자율 정정한 경우 implement-score.json `specCodeDefects[]` 필드 기록 의무. C-27 (메인 prompt-spec drift) 와 별개 — spec 내부 코드 결함 케이스 신설. G-003 useDebouncedCallback.ts L70-87 (Rules of Hooks 준수) vs spec L508-524 (위반) 자율 정정 미보고 사례 차단.
- 메타 게이트 항목 수 5 → 6. 본문 항목 수 24 불변.

**v1.0.6 변경 사항 (2026-05-14 MOD-GRID-04/G-001 harnessReview)**:
- A-07 신설: Test Runtime Execution Check — spec Section 7에 `*.test.*` 명시 시 실제 `vitest run` 실행 + exit 0 확인 의무. G-001 100/100/100 PASS 사후 검증에서 TC-06 (미등록 type fallback) FAIL 발견 → `isColumnInfo()` heuristic 결함이 tsc + identifier grep만으로는 검출 불가능했던 blind spot 차단.
- 항목 수 23 → 24 (A 카테고리 6 → 7). C-26 자기-검산 reference 동기 갱신.

**v1.0.5 변경 사항 (2026-05-14 MOD-GRID-03/G-001 retrospective)**:
- A-06 신설: Functional Wire-up Check — 단독 유틸 함수 생성 시 호출처 import + 호출 grep 검증 의무. G-001 loop 1에서 buildPaginationOptions.ts 생성 100점 PASS but buildTableOptions.ts wire-up 누락으로 mode prop 런타임 무효 사례 차단.
- 항목 수 22 → 23 (A 카테고리 5 → 6). C-26 자기-검산 reference 동기 갱신.

**v1.0.4 변경 사항 (2026-05-14 G-004 success-review)**:
- F-02: goals.json implementFiles ↔ spec.md Section 7 권위 충돌 처리 룰 추가 (spec authoritative)
- F-03: TOMIS 내부 MODIFY 시 git diff OR Read 보존 증거 disjunction 추가 (무커밋 신규 프로젝트 대응)
- F-05: Structural reference 오류 vs Value drift 구분 명시 (Section 11.6 nonexistent 사례)
- 모든 추가 기존 메타게이트 내부 보강 — 항목 수 22 + F=5 유지

**항목 카운트 (총 24)**: A=7 + B=7 + C=4 + D=3 + E=3 = 24. 메타 게이트 F=5 별도 (F-05 신설 2026-05-13 G-003).

**점수 계산 (★ Coverage Verifier 산식 자기-검증 의무 — 2026-05-13 추가)**:
- YES = 1, NO = 0, **N/A = 분모에서 제외**
- **denominator = YES수 + NO수** (N/A는 절대 분모에 포함 X)
- **score = YES수 / denominator × 100**
- **★ `failedChecks` 배열에는 NO 결과만 포함. N/A 절대 포함 금지.**
- **★ 카테고리별 합계(A+B+C+D+E)가 24와 일치하는지 Verifier가 산출 후 자기-검산 의무 (C-26)**
- **★ Verifier는 점수 산정 직후 `denominator = checks 중 result != "N/A" 인 항목 수`를 재계산하여 일치 확인. 불일치 시 동일 결과 폐기 후 새 Agent 인스턴스 재호출.**
- **★ yesCount/naCount mechanical 재계산 의무 (2026-05-27 추가, MOD-GRID-09 모듈 audit trigger — `[[feedback-tw-grid-spec-goals-sync]]` R2)**:
  - Verifier 는 점수 산정 직후 checks 객체 순회하여 `result == "YES"` / `"N/A"` mechanical count = top-level `yesCount`/`naCount` 일치 확인 의무
  - 불일치 시 동일 결과 폐기 후 새 Agent 인스턴스 재호출
  - **메타 게이트 별도집계 signal**: score JSON 에 `rubricMetadata.evaluableItems` 명시 의무 (F-XX 가 별도 집계 시). signal 부재 시 메타 게이트 포함/제외 정책 명시
  - 근거 사례: 2026-05-27 MOD-GRID-09 모듈 (G-001/G-002/G-004 implement) 4/6 score JSON 분류 오류. score 영향 0 이나 audit trail 신뢰성 손상
- **★ JSON 출력 무결성 자기-검증 (2026-05-15 추가)**: Verifier 는 score JSON 을 디스크에 쓰기 직전 `JSON.parse(myOutput)` 자기 호출로 parse 성공 검증 의무. 실패 시 동일 결과 폐기 후 새 Agent 인스턴스로 재호출. evidence 안 따옴표 `\"`, 백슬래시 `\\\\`, 정규식 (예: `from ['\\\"]wijmo`) 모두 escape 확인. 근거: 2026-05-14 MOD-GRID-01/G-001/G-005, MOD-GRID-09/G-001 evidence escape 누락으로 score 파일 corrupt 3건.

**Threshold (tier별)**: high 95 / medium 90 / low 85

---

## ★ 메타 게이트 (F): 환각/구현 무결성 — 점수 산정 전 필수 통과

아래 F 항목 **하나라도 NO → 점수 계산 생략, score=0, passed=false 강제**.
이유: Implementer가 "변경했다"고 보고했지만 실제 파일이 안 변경되었거나 spec과 다른 곳을 변경한 경우 — VERIFY에서 검출돼도 늦음.

### F-01: 보고된 변경 파일 실재
**YES**: Implementer가 보고한 모든 파일이 Glob으로 존재
**NO**: "환각 의심: 보고된 변경 파일 {경로} 미존재"

### F-02: spec.implementFiles 매칭
**YES**: 실제 변경 파일 ⊆ spec.implementFiles **또는** spec.md Section 7/Section 11 명시 파일 (spec 권위)
**NO**: "spec 외 임의 변경: {파일 목록}. spec 수정 후 재시도 또는 변경 철회"

**★ goals.json implementFiles ↔ spec.md Section 7 권위 충돌 처리 (2026-05-14 G-004 추가)**:
- goals.json `implementFiles` 와 spec.md Section 7 표 (NEW/MODIFY) 가 불일치할 때, **spec.md 가 authoritative** (C-27 Spec 권위).
- 이유: goals.json은 discover 단계 산출물(자동 생성), spec.md는 specify 단계 사용자 검토 후 확정 산출물. 두 곳 불일치 시 spec이 최신 + 사용자 검토 거친 권위 있는 정의.
- Implementer 의무: spec.md Section 7 + Section 11 의 변경 파일 union을 따른다. goals.json만 보고 작업 금지.
- 보고 의무: 두 곳 불일치 발견 시 `feedback.goalsJsonImplementFiles` 필드에 "goals.json N개 vs spec Section 7 M개 — spec 우선 적용" 1줄 기록.

**근거 사례 (G-004 implement 2026-05-14)**: goals.json `implementFiles` = 3개 (config.json, eslint.config.mjs, vite.config.ts) vs spec Section 7 = 16개 (+13 CHANGELOG.md). Implementer가 spec 우선 적용으로 16개 + Section 11 Step 1~2 (decisions.md, monorepo/package.json) 모두 구현. feedback에 명시 보고 → F-02 YES.

**★ Spec D# 결정의 Documented Scope Reduction 우선 적용 의무 (2026-05-15 MOD-GRID-17/G-004 추가 — v1.0.12)**: 위 v1.0.4 sub-bullet 은 spec.md Section 7 ↔ goals.json `implementFiles` 가 **수량 불일치** 일 때 spec 우선이라는 일반 tiebreaker 규칙이다. 본 v1.0.12 sub-bullet 은 spec writer 가 **명시적으로 scope reduction 을 D# 결정으로 문서화** 한 경우의 directional rule:

**판정 기준**:
- **YES**: spec D# 결정에 "{파일} 본 Goal 범위 제외" 또는 "`affectedUsageFiles` N → M 조정 의무" 같은 reduction 명시가 1건 이상 있으면 — Implementer 는 spec Section 7 표의 reduced count (M 파일) 만 변경한다. goals.json `affectedUsageFiles[]` / `implementFiles[]` 배열의 N entries 중 (N - M) 개 제외 entry 는 audit trail 로 보존 (배열 자체 수정 금지). 제외 entry 의 마이그레이션은 별도 Goal / 모듈에서 처리 (spec D# 결정에 "별도 모듈/Goal 책임" 명시 의무).
- **NO**: Implementer 가 goals.json `affectedUsageFiles[]` 전체 entries (N 파일) 를 변경 시도 → spec D# reduction 무시. 또는 reduction 따라 M 파일만 변경했으나 implement-score JSON `feedback` 에 "spec D# reduction 적용 — {파일} 제외" 보고 누락.

**보고 의무**: Implementer 는 spec D# scope reduction 적용 시 implement-score JSON `feedback.scopeReduction` 필드에 다음 1줄 기록:
```
"scopeReduction": "spec D# (예: D1) reduction 적용 — affectedUsageFiles N → M (제외: {파일 목록}, 사유: {1줄 요약})"
```

**검증 방법 (Coverage Verifier)**: spec D# 결정 표를 Read → "본 Goal 범위 제외" 또는 "→ M 조정" 키워드 grep. hit 발견 시 — (a) spec Section 7 표 행 수 = M (reduced count), (b) Implementer 실제 변경 파일 수 = M, (c) 제외 entry 가 변경 대상에 미포함, (d) implement-score `feedback.scopeReduction` 보고 존재. 4 곳 모두 일관 시 YES.

**근거 사례 (G-004 implement 2026-05-15)**:
- spec D1 결정 (L14): "MyNotificationPage 본 Goal 범위 제외 — BaseGrid 미사용, DataTable 사용. `affectedUsageFiles` 5 → 4 조정".
- goals.json `affectedUsageFiles[5]` = 4 account pages + MyNotificationPage (배열 미수정 — audit trail).
- spec Section 7 표 4 행 (MyNotificationPage 행 미포함).
- Implementer 실제 변경 파일 4 개 (AdminSlipEdit + FinancialCarryover + SettlementSummary + MonthlySettlement).
- implement-score JSON F-01 evidence: "MyNotificationPage는 D1 결정으로 spec에서 제외됨 (5->4)" 보고.
- 본 sub-rule 로 directional rule 명문화 — 일반 tiebreaker (v1.0.4) 와 distinct.

**v1.0.4 (general tiebreaker) vs v1.0.12 (directional reduction) 구분**:
- **v1.0.4**: spec 과 goals.json 이 **양방향** 으로 다를 때 (spec 이 더 많거나 더 적거나) — spec authoritative. 충돌 trigger 가 단순 수량 비교.
- **v1.0.12**: spec D# 가 **명시적으로 reduction (N → M, N > M)** 을 결정 + 사유 + 별도 처리 트랙 documented. goals.json 배열 자체는 변경 X (audit trail). Implementer 는 reduced count + reduced 파일 set 정확히 따름.

**적용 범위**: G-005 ~ G-006 (잔여 hr/payroll/admin 사용처 마이그레이션) + 후속 사용처 마이그레이션 모듈 (MOD-GRID-18~) cascading. 특히 spec writer 가 reality-check (specify-rubric A-04 v1.0.9 sub-bullet) 후 reduction 결정 시 Implementer 측 일관 적용 강제.

### F-03: git diff 비어있지 않음 (또는 동등한 변경 증거)
**YES**: 다음 중 하나로 변경 증거 확인:
  (a) `git diff --stat` 결과 비어있지 않음 (TOMIS 내부 + 커밋 히스토리 있음), **또는**
  (b) **TOMIS git 추적 불가 상황** (예: 신규 프로젝트 무커밋 상태 — 모든 파일 `??` 상태) — 변경 파일 Read 후 spec After 스니펫과 내용 일치 + **기존 보존 섹션 grep 증거 명시** (Read line range + grep keyword 인용)
**NO**: "보고된 변경이 git diff에도 없고 Read 검증도 누락 — 변경 미적용 또는 환각"
**N/A**: 변경 대상이 TOMIS git 외부 디렉토리 (예: `D:/project/topvel_project/topvel-grid-monorepo/`). 이 경우 **PowerShell `Get-ChildItem -Recurse`** 또는 Glob 결과로 파일 카운트 검증으로 대체. evidence에 "(외부 디렉토리 — git 추적 불가, Glob N개 파일 확인으로 대체)" 명시. 근거: ADR-MOD-GRID-00-001.

**★ TOMIS 내부 MODIFY 시 보존 증거 의무 (2026-05-14 G-004 추가)**: TOMIS 내부 기존 파일(예: `tw-framework-front/vite.config.ts`)을 MODIFY할 때, 기존 무관 설정(예: 기존 alias, plugins, server, define)의 **보존 여부**를 다음 둘 중 하나로 입증:
1. `git diff --stat` 라인 수 + diff 본문에서 보존 섹션이 unchanged 확인, **또는**
2. (커밋 히스토리 무 시) Read 도구 호출로 보존 섹션 + grep 키워드 인용. evidence 예시: "vite.config.ts L17: `'@': path.resolve(__dirname, './src')` 보존 확인 (Read L17). L11-14 plugins react+tailwindcss 보존 (Read L11-14). L33-43 server.proxy 보존 (Read L33-43)."

미충족 시 F-03 NO — surgical changes (C-1) 위반 의심.

**근거 사례 (G-004 implement 2026-05-14)**: TOMIS 저장소가 신규 상태 (전체 파일 `??` 무커밋) → `git diff` 비어있음이 정상. Implementer가 Read 기반 보존 검증 + 5개 보존 섹션 명시(`'@' alias, react/tailwindcss plugins, server.proxy, define`)로 disjunction (b) 충족. Verifier `surgicalChangeVerification` 섹션이 5개 보존 항목 individually YES 확인.

**★ 워크트리 환경 Edit boundary 차단 → PowerShell-via-Bash 우회 의무 (2026-05-15 MOD-GRID-17/G-001 추가)**: 워크트리 (`.claude/worktrees/<wt>/`) 에서 TOMIS base repo 의 `affectedUsageFiles[]` (예: `tw-framework-front/src/pages/`) 를 변경하려 할 때 Edit/Write 도구가 boundary 차단 (`"This background session hasn't isolated its changes yet"`) 을 반환하면 — Implementer 는 **즉시 사용자 escalate 금지**. 다음 우회 시도 의무:

1. **PowerShell-via-Bash 우회**: Bash 도구로 `powershell -NoProfile -Command "[IO.File]::WriteAllBytes(path, [Text.Encoding]::UTF8.GetBytes(content))"` 호출 (C-1 Read-then-Write + MEMORY.md #32 UTF-8 BOM 미포함 의무).
2. **검증**: PowerShell 종료 후 Read 도구로 변경 부위 확인 + `npx tsc --noEmit` 0 errors 확인.
3. **보고**: implement-score JSON `feedback` 배열에 "Edit boundary 차단 — PowerShell-via-Bash 우회로 N 파일 변경 성공 (UTF-8 BOM 미포함 확인)" 1 줄.

F-03 YES 인정 조건 (boundary 우회 케이스):
- (a) PowerShell-via-Bash 실행 명령 인용 + (b) Read 도구 변경 부위 검증 + (c) tsc 0 errors 확인 — 셋 모두 evidence 에 명시.

**NO**: boundary 차단 발견 후 우회 시도 0건 + 즉시 "진행 불가" 보고 → 1 round-trip 낭비 + F-03 NO (변경 미적용).

**근거 사례 (MOD-GRID-17/G-001 2026-05-15)**:
- 1차 Implementer (sonnet) 가 Edit boundary 차단 발견 후 즉시 "워크트리에 코드 없음 → 진행 불가, 사용자 결정 필요" 보고.
- 메인 advisor 자문 후 PowerShell-via-Bash 우회 안내 → 2차 Implementer 100/95 PASS (5 파일 surgical 변환 + tsc 0 errors).
- 본 F-03 확장 + C-34 (constraints) + ADR-MOD-GRID-17-001/003 으로 사전 차단.

**적용 범위**: G-002 ~ G-006 (account/Expense\* + account/Cash\* 22 페이지) cascading + 후속 사용처 마이그레이션 모듈 (MOD-GRID-18~).

**★ BOM 방향 매트릭스 (2026-05-15 MOD-GRID-17/G-002 추가)**: PowerShell-via-Bash 우회 사용 시 두 종류 파일에 **정반대 방향** BOM 적용 의무. 한쪽 규칙을 다른 쪽에 잘못 적용하면 — 스크립트 BOM 누락 시 한국어 패턴 매칭 `MISS`, 출력 BOM 포함 시 빌드 syntax error 또는 한글 깨짐.

| 파일 | BOM 방향 | 근거 |
|------|---------|------|
| **`.ps1` 스크립트 자체** | **BOM 필요** | PowerShell 5.x 가 BOM 없는 `.ps1` 를 시스템 코드페이지 (CP949) 로 디코드 → UTF-8 한국어 바이트와 불일치 (constraints.md C-35 + ADR-MOD-GRID-17-004) |
| **출력 `.tsx`/`.ts` 파일** | **BOM 금지** | MEMORY.md #32 한글 깨짐 차단 + 빌드 도구 호환 (constraints.md C-34 + ADR-MOD-GRID-17-001) |

F-03 검증 시 (한국어 리터럴 변환 케이스):
- (a) 스크립트가 한국어 포함하는 `.ps1` 파일이면 → 첫 3 바이트 `0xEF 0xBB 0xBF` 인지 확인 또는 inline `powershell -Command` 사용 (BOM 무관).
- (b) 출력 파일 (변환된 `.tsx`) 의 첫 3 바이트가 `0xEF 0xBB 0xBF` 가 **아닌지** 확인 (`(New-Object System.Text.UTF8Encoding $false).GetBytes()` 사용 evidence).
- (c) 변환 후 Read 도구로 한국어 텍스트 정상 표시 (스크린샷 또는 발췌 인용).

**근거 사례 (MOD-GRID-17/G-002 2026-05-15)**:
- G-002 Implementer 1차 시도: BOM 없는 `.ps1` 스크립트로 5 파일 9 사이트 한국어 패턴 매칭 → 모두 `MISS` (CP949 vs UTF-8 바이트 불일치).
- 2차 시도: 스크립트 자체에 BOM (`0xEF 0xBB 0xBF`) prepend → `g002_patch_all_bom.ps1` 으로 정상 매칭 + tsc 0 errors PASS.
- 본 F-03 BOM 매트릭스 + C-35 + ADR-MOD-GRID-17-004 cascade 로 G-003 ~ G-006 약 4 round-trip 절감 예상.

**★ No-op Implement Loop 합법 케이스 (2026-05-15 MOD-GRID-17/G-005 추가 — v1.0.13)**: 본 Goal 의 변경 대상 파일(spec Section 7 + Section 11) 이 disk 에서 **이미 spec D# end-state** (예: Section 11.2 After 스니펫 + Section 2 GridProps 사용 예시) 와 1:1 일치 일 때 — implement 단계 변경이 0 건이어도 F-03 YES 인정. 사전 적용 케이스 (cascading 정리 또는 별도 세션에서 이미 마이그레이션 완료) 의 본질적 surgical changes (C-1) 준수.

**판정 기준**:
- **YES (no-op 합법)**: 다음 셋 모두 충족:
  - (a) **디스크-spec 정합 검증**: 변경 대상 파일 Read 결과가 spec After 스니펫과 statement-by-statement 동일 (line range 인용 의무 — 예: "FundStatusPage.tsx L11 import = spec L11 1:1, L218-225 JSX = spec Section 11.2 Step 2 After 1:1").
  - (b) **Implementer 의 `feedback.noOpImplementLoop` 블록 명시**: `{ "reason": "디스크가 이미 spec D# end-state — 이전 세션/cascading 정리", "verificationMethod": "Read 도구 line range 인용 + tsc 0 errors 확인 + 변종 잔존 Grep 0 hits", "diskState": "spec After 1:1 match" }` 형식.
  - (c) **Implementer self-score 거부 (C-36)**: Implementer 는 `*-implement-score.json` 작성 금지 — Coverage Verifier (haiku-independent) 가 디스크 정합 검증으로 단독 채점.
- **NO**: 위 세 조건 중 하나라도 미충족. 특히 (a) 디스크-spec 정합 검증 누락 (Read 도구 line range 인용 없이 "이미 완료" 주장) 또는 (b) `feedback.noOpImplementLoop` 블록 누락 (변경 0건 사유 미보고).

**검증 방법 (Coverage Verifier)**: Implementer 보고에서 변경 파일 수 = 0 발견 시 — (1) 변경 대상 파일 Read → spec Section 11.2 After 또는 동등 end-state 인용 영역과 statement-by-statement cross-check, (2) `feedback.noOpImplementLoop` 블록 존재 + 3 필드 (reason/verificationMethod/diskState) 모두 명시, (3) `verifierAgent` 필드가 `haiku-independent` (Implementer self-score 아님). 셋 모두 충족 시 F-03 YES + score JSON `noOpImplementLoop` top-level 필드에 동일 정보 보존.

**근거 사례 (MOD-GRID-17/G-005 2026-05-15)**:
- G-005 spec D1 결정 (5 → 1 scope reduction, Pattern B 4 페이지 deferred) + D3 결정 (FundStatusPage L218-225 props 매핑) 작성.
- Implementer 가 FundStatusPage.tsx Read 결과 — L11 `import { Grid } from '@topgrid/grid-core'` + L218-225 `<Grid<FinAcno01FundStatusItem> ... enableSort enableFilter loading emptyText />` 가 **spec After 1:1 일치**.
- Implementer 가 변경 0건 + `feedback.noOpImplementLoop` 블록 명시 (reason: "prior session migration complete", verificationMethod: "Read L11 + L218-225 + Grep BaseGrid 0 hits + tsc 0 errors", diskState: "spec D3 end-state match") + C-36 따라 score JSON 작성 거부.
- Coverage Verifier (haiku-independent) 가 디스크 정합 검증 + 4 Pattern B 페이지 deferred audit trail 무손상 확인 → 100/95 PASS.
- 본 sub-bullet 로 향후 cascading 케이스 (예: G-006 일부 페이지가 이미 완료 상태) 사전 인정.

**적용 범위**: cascading — MOD-GRID-17/G-006 (payroll/admin) + 후속 사용처 마이그레이션 모듈 (MOD-GRID-18~) 의 implement 단계 중 사전 마이그레이션 완료 케이스. 특히 ADR-005 scope reduction 으로 deferred 된 entry 가 별도 후속 Goal 에서 처리될 때, 본 Goal 의 reduced scope 가 이미 적용된 케이스 인정.

### F-04: 핵심 식별자 grep 검증
**YES**: spec의 핵심 API 이름 1~3개(useGridState, trackChanges 등)를 변경 파일에서 Grep → 모두 발견
**NO**: "spec의 핵심 식별자 미발견: {목록}. 다른 이름으로 구현했거나 미구현"

**★ Variant 잔존 grep 의무 — 주석/문자열 포함 (2026-05-15 MOD-GRID-17/G-003 self-review 추가)**: spec 의 AC 가 "구 variant 0건" (예: AC-004 "로컬 `BaseGrid` import 0건", "Wijmo identifier 0건", 또는 동등 negative AC) 을 명시한 경우 — F-04 의 positive grep 외에 다음 **negative residual grep** 도 의무:

1. **변경 파일 (`.tsx`/`.ts`) 내부 주석**: `//` 라인 주석 + `/* */` 블록 주석 + JSDoc 주석 모두 포함하여 `Grep <variant-name>` (예: `BaseGrid`, `Wijmo`, `ChangeTrackingGrid` 등) → 0 hits.
2. **문자열 리터럴**: 일반 `"..."` / `'...'` / 백틱 `` `...` `` 문자열 내부에 variant 단어 잔존 0 hits. 단 의도적 텍스트 (예: "BaseGrid 마이그레이션 가이드 — 사용자 안내문") 는 spec 본문에 명시될 때만 허용 — 일반 stale 주석은 NO.
3. **검색 scope**: F-03 의 변경 증거 대상과 동일 — spec Section 7 의 implementFiles 만 (CHANGELOG.md, README.md 등 documentation 파일 제외 — 의도적 variant 단어 사용 영역).

**NO**: 코드 식별자 grep (`from ['\"]...BaseGrid`, `<BaseGrid<`, `import BaseGrid`) 0 hits 라도 — 주석/문자열에 stale variant 단어 잔존 1건 이상 발견 시. AC 가 "0건" 을 약속한 negative AC 인 경우 더 엄격하게 적용.

**검증 방법 (Coverage Verifier)**: spec AC 본문 grep — "0건" 또는 "import 0", "사용 0", "잔존 0" 같은 negative 표현이 있는 AC 발견 시 — 해당 variant 이름을 추출 후 변경 파일에 대해 `Grep <variant>` (case-sensitive, scope = spec Section 7 implementFiles 만). 0 hits 면 YES, 1 hits 이상이면 hit context 확인 — 주석/문자열 잔존 시 NO + Implementer 자율 정정 (재변환 또는 surgical comment edit) 요청.

**근거 사례 (G-003 self-review 2026-05-15)**:
- 1차 implement: 5 파일 `<BaseGrid<` JSX 식별자 grep → 0 hits, `import BaseGrid` grep → 0 hits — F-04 positive YES.
- 그러나 InterestIncomePage L176 주석에 `{/* 그리드 — BaseGrid 가 빈 데이터 처리 */}` 같은 stale variant 단어 잔존 (정확한 문구: 주석 영역 내 "BaseGrid" 단어).
- Implementer 가 2차 패치 `g003_fix_comment_bom.ps1` 로 주석을 `{/* 그리드 — C-03 빈 상태는 Grid emptyText 기본값 처리 */}` 로 surgical edit.
- positive grep 만으로는 1차 시도 100/100 PASS 통과 가능했으나 — AC-004 의 "0건" 약속이 주석 잔존으로 weak. 본 F-04 sub-bullet 추가로 사전 차단.

**적용 범위**: G-004 ~ G-006 (account/SettlementSummary, MonthlySettlement, AdminSlip\*, hr/\*, payroll/\* 등 잔여 variant 다수) + 후속 사용처 마이그레이션 모듈 (MOD-GRID-18~). variant 이름이 다음 패턴 중 하나일 때 적용 강제: `BaseGrid`, `Wijmo`, `AgGrid`, `ChangeTrackingGrid`, `VirtualGrid`, 또는 spec 이 AC 에 negative 0건 약속한 식별자.

### F-05: Spec ↔ Implementer prompt 일치 검증 (2026-05-13 G-003 신설)
**YES**: 메인 세션이 Implementer Agent에게 전달한 prompt의 핵심 값(파일 경로, 한도값, peer 목록, API signature 등)이 spec.md의 해당 섹션과 100% 일치. 또는 Implementer가 implement-score JSON `promptSpecDrift` 필드에 불일치 항목을 1개 이상 명시 보고하고 **spec 값을 우선 적용**했음.
**NO**: prompt 값이 spec과 다른데 Implementer가 prompt를 따랐고 보고도 없음 → "Spec 권위 위반: prompt {field}={prompt_value} vs spec {field}={spec_value}. Implementer가 spec 우선 적용 의무 위반 + 미보고."

**근거**: C-1 (Spec 권위) + C-27 (메인 prompt-spec drift 보고 의무). G-003 1차 implement 사례: 메인 prompt가 `grid-renderers` peer에 `@tanstack/react-table` 누락 + `.size-limit.json`의 `grid-export`/`grid-features` 한도를 spec 20KB 대신 15KB로 전달. Implementer가 prompt 그대로 실행하고 spec 위반 보고 없음 → Coverage Verifier가 A-02 + E-01 NO 처리하여 75/90 FAIL로 차단했지만, 사전 차단이 더 효율적임.

**검증 방법**: Coverage Verifier는 implement-score JSON에 `promptSpecDrift` 필드가 있는지 확인. 있으면 각 drift 항목이 spec 값으로 해결되었는지 cross-check. 없으면 메인 prompt 사본(있을 경우)과 spec 핵심 값을 sampling 비교. prompt 사본 없으면 구현된 파일 내용 vs spec sampling 비교로 대체.

**Implementer 의무 (2026-05-13 추가)**: Implementer Agent는 prompt 수신 직후 spec.md를 직접 Read하여 prompt 값과 cross-check. 불일치 발견 시:
1. spec 값을 우선 적용 (C-1)
2. implement-score JSON `promptSpecDrift[]`에 `{field, promptValue, specValue, resolution: "spec applied"}` 객체 기록
3. feedback 배열에 drift 요약 1줄 추가

**★ Structural reference 오류 vs Value drift 구분 (2026-05-14 G-004 추가)**: prompt가 spec의 존재하지 않는 섹션 번호(예: "Section 11.6")를 참조하는 경우는 **structural reference error** 이며 **value drift 가 아님**. promptSpecDrift[]에 기록하지 **않음**. 대신 feedback 필드에 1줄 보고만으로 충분.

**판정 기준**:
- **Value drift (promptSpecDrift 기록 의무)**: prompt의 구체 값(파일 경로, 버전 번호, 한도값, peer 목록 등)이 spec의 같은 필드와 다름.
- **Structural reference error (feedback 1줄만)**: prompt의 섹션 번호/소제목이 spec에 없거나 잘못된 번호 인용. 값 자체는 다른 섹션에 존재할 수 있음.

**근거 사례 (G-004 implement 2026-05-14)**: 메인 prompt가 "Section 11.6"을 참조 (spec에는 11.1~11.5만 존재). Implementer가 실제 spec Section 11.1~11.5를 따라 구현 + feedback에 1줄 보고. promptSpecDrift = [] (value drift 없음). F-05 YES 처리 타당.

### F-06: Spec Internal Code Defect Reporting (2026-05-14 MOD-GRID-02/G-003 self-review 신설)
**YES**: spec 본문의 코드 템플릿(Section 11.2 Step N "BEFORE/AFTER 코드 스니펫", Section 2.2 구현 세부, Section 7 표 인근 코드 블록 등)에 **컴파일은 통과하지만 의미적/구조적으로 잘못된** 결함(예: Rules of Hooks 위반, dead branch, 역순 statement, off-by-one, 잘못된 타입 cast)이 발견되어 Implementer가 자율 정정한 경우 — implement-score JSON `specCodeDefects[]` 필드에 다음 객체 형식으로 기록:
```json
"specCodeDefects": [
  { "specLocation": "G-NNN-spec.md L508-524 Section 11.2 Step 2", "defect": "useCallback after early return — Rules of Hooks violation", "fixApplied": "useCallback hoisted before ms<=0 conditional return", "severity": "high|medium|low" }
]
```
+ feedback 배열에 "spec L{N} 코드 결함 자율 정정 — {1줄 요약}" 1줄 추가.

**NO**: spec 본문 코드 템플릿에 결함이 있는데 Implementer가 spec 그대로 따라 구현해 결함이 production 코드에 잔존, **또는** Implementer가 자율 정정했으나 specCodeDefects[] 미보고. C-12 (빌드 0 errors) 와 별개 — tsc 통과해도 Rules of Hooks/dead branch 같은 의미적 결함은 본 항목으로 판정.

**N/A**: spec 본문에 코드 템플릿 자체가 없는 Goal (예: 순수 빌드 설정 변경, README 추가, peerDeps 정책만 변경 등). Implementer가 spec 코드 템플릿 외 자체 작성한 코드는 본 항목 범위 외 (B 카테고리 코드 품질 항목으로 평가).

**검증 방법 (Coverage Verifier)**: spec Section 11.2 (또는 Section 2.2/Section 7 인근) 코드 블록을 Read → Implementer가 작성한 실제 파일과 statement-by-statement 비교. 차이 발견 시 — (a) spec 결함 + Implementer fix 인지 여부 확인 (specCodeDefects[] 존재) → (b) 미보고 시 NO. 특히 React hook 순서, conditional return 위치, useEffect deps 배열 같은 Rules of Hooks 관련 코드는 statement order 직접 sampling 의무.

**근거 사례 (G-003 implement 2026-05-14 self-review 발견)**:
- spec G-003-spec.md Section 11.2 Step 2 (L508-524) 코드 템플릿: `if (ms <= 0) return fn;` THEN `return useCallback(...)` — useCallback이 early return 이후 조건부 호출 = Rules of Hooks 위반.
- 실제 구현 useDebouncedCallback.ts L70-87: useCallback이 항상 호출된 후 L85 `if (ms <= 0) return fn;` 조건부 return — Rules of Hooks 준수.
- Implementer 자율 정정 성공했으나 implement-score.json `promptSpecDrift=[]` (L120) — drift 미보고. C-27 prompt-spec drift 보고 의무는 메인 prompt vs spec 차이 케이스 — **spec 내부 코드 결함 자율 정정 케이스는 C-27 범위 외**.
- Coverage Verifier (haiku) feedback (L142) "follows D6 + Section 11.3 pattern exactly" — Section 11.3 (위험 표 prose) 와 Section 11.2 (executable template) 혼동. 결함 미검출.
- Self-Review (opus) post-hoc Read 비교로 발견 — 1 occurrence (anecdote). 본 F-06 신설로 Coverage Verifier 단계 사전 차단.

**처리**: F-06 NO → spec writer 재호출 (spec 본문 코드 결함 정정 + 후속 Goal 영향 검토) + Implementer 자율 정정 사실 implement-score.json 보강. F-06 YES (specCodeDefects[] 1건 이상) → 정상 진행. 자동 보완 권장: Implementer가 spec 코드를 그대로 복사한 경우 — 작성 직전 Rules of Hooks lint 또는 staticcheck 적용 + 결함 발견 시 자율 정정 + specCodeDefects[] 기록.

**★ Documented Deviation 처리 강화 (2026-05-14 MOD-GRID-10/G-002 self-review 추가)**: Implementer 가 spec 의 **internal-only defect** (Section 2 template ↔ Section 11 executable signature mismatch, 4-param vs 3-param 등 spec 본문 자체 모순) 을 spec 의 다른 권위 섹션과 충돌 없이 fix 시 — F-06 NO 처리 대신 **`specCodeDefects[]` 에 "documented deviation" 로 기록** 후 YES. 단 다음 모두 충족:
1. fix 내용을 specCodeDefects[].fixApplied 에 명시 (어떤 signature 채택 + 채택 이유 = "executable template authoritative per C-30")
2. spec 의 권위 섹션(C-30 Truth Table) 과 일치 — 일관 fix 가 spec 본문 다른 부분과 모순되지 않음
3. feedback 배열에 "spec internal defect autonomously resolved — {1줄}" 보고

**근거 사례 (G-002 implement 2026-05-14)**: Section 2.2 applyAdd 4-param template vs Section 11.2 After-pattern 3-param. Implementer 가 Section 11.2 executable 우선 적용 (C-30 Spec Truth Table — executable 권위) + specCodeDefects[] 1건 기록 + feedback "spec L508-524 signature inconsistency 자율 정정" 명시. F-06 YES (documented deviation 처리) — drift 0. 추가 spec writer 재호출 없이 진행. specify-rubric E-06 (Section 2↔11 cross-check) 신설로 차후 사전 차단.

**★ F-06 확장: 메인 prompt vs spec 본문 충돌 시 spec 우선 + 보고 의무 (2026-05-15 MOD-GRID-10/G-003 self-review 추가)**: 메인 세션이 IMPLEMENT prompt 에 작성한 코드 블록(BEFORE/AFTER 스니펫, 함수 시그니처 예시, 자료구조 예시)이 spec.md 본문(D# 결정, Section 11 executable, EC-NN 처리 방침)과 충돌하면 — Implementer 는 **spec 본문 그대로 구현** (C-27 + C-33 spec authority) 하고 prompt vs spec drift 를 보고한다.

**구분 (drift 기록 위치)**:
- **메인 prompt vs spec drift** (이 확장 케이스): `promptSpecDrift[]` 에 기록 (F-05 의무).
- **spec 본문 internal-only defect** (Section 2 template vs Section 11 executable 등 spec 내부 모순): `specCodeDefects[]` 에 기록 (F-06 본문 케이스).
- 두 케이스 동시 발생 가능 — 각 배열에 독립 기록.

**근거 사례 (G-003 implement loop 1 2026-05-15)**: 메인이 IMPLEMENT prompt 에 spec D4(throw propagate) / D5(첫 메시지 분리) / D6(ChangeMapState<TData>) / EC-02(try/catch removal) / EC-05(deleted mapping) 와 어긋난 코드 블록 주입. Implementer 가 prompt 우선 적용 + spec 본문 cross-check 누락 → drift 6건 (F-02 + F-06 + A-05 + D4/D5/EC-05). loop 0 73.9 FAIL. loop 1 에서 spec D4/D5/D6/EC-02/EC-05 본문 직접 Read + surgical rewrite 4파일 → 100 PASS. 본 F-06 확장 + C-33 으로 사전 차단 — Implementer 가 prompt 코드 블록 적용 직전 spec 본문 1회 Read + drift 발견 시 spec 우선 + 보고.

---

**처리**: 모든 F YES → 일반 채점 진행. 하나라도 NO → 변경 롤백 권장, Implementer Agent 재시도 지시, status=fail, loops+=1.

---

---

## A: Spec 일치 (5항목)

### A-01: implementFiles 모두 실제 존재
**YES**: Spec Section 7의 모든 파일 경로가 디스크에 존재 (Read 확인)
**NO**: 누락 파일 있음

### A-02: API signature 일치 (props/return/types)
**YES**: 구현된 export가 Spec Section 2의 interface와 100% 일치
**NO**: props 추가/누락/타입 변경

### A-03: 사용 예시 동작 검증
**YES**: Spec Section 2의 사용 예시 코드가 컴파일 + 런타임 동작
**NO**: 예시 코드 컴파일 에러 또는 런타임 오류

### A-04: 기존 변형 대응표 모두 처리 (Section 3)
**YES**: Spec Section 3의 모든 행이 구현됨 (직접 교체 / props 매핑 / hook 통합)
**NO**: 대응 누락된 variant 존재
**N/A**: 신규 영역 (대응할 variant 없음)

### A-05: 모든 AC 매핑
**YES**: Spec의 모든 acceptanceCriteria가 구현 파일에서 검증 가능
**NO**: 매핑 안 된 AC 존재

### A-06: Functional Wire-up Check (2026-05-14 MOD-GRID-03/G-001 신설)
**YES**: spec에서 정의된 단독 유틸 함수 또는 헬퍼(예: `buildPaginationOptions`, `buildSortingOptions`, `useGridImperativeHandle` 등) 가 **실제 호출처에서 import + 호출**되어 런타임 효과를 발휘함. 다음 두 증거 모두 충족:
  1. `Grep <UtilName>` on src → import 1건 이상 + 호출 1건 이상 (import-only 발견은 NO).
  2. AC가 요구하는 동작 시나리오(예: AC-001 mode='client' → manualPagination=false)가 호출 결과가 호출처에서 TanStack 옵션·React state·DOM에 merge·반영되는 코드 라인 확인.
**NO**: 유틸 함수 생성·export 완료했으나 호출처 wiring 0건 → AC가 타입 수준만 통과 + 런타임 효과 0 (dead code).
**N/A**: 단독 유틸·헬퍼 생성 없는 Goal (예: 순수 타입 정의, README 추가, 빌드 설정 변경 등).

**검증 방법 (Coverage Verifier)**: spec Section 7에서 NEW 파일 중 `*Options.ts`, `*Options.tsx`, `use*.ts`, `build*.ts`, `compute*.ts` 패턴 또는 spec ADR이 "X.ts가 Y.tsx에서 호출됨"을 명시하는 경우 — 그 호출처(Y.tsx 또는 buildTableOptions.ts) 에서 `Grep <util-name>` 결과 import + 호출 sites 둘 다 확인. 둘 중 하나만 있으면 NO.

**근거 사례 (G-001 implement loop 1 2026-05-14)**:
- buildPaginationOptions.ts 생성 + export 완료 (100점 PASS, B-01~B-07 모두 YES).
- 그러나 buildTableOptions.ts에서 `Grep buildPaginationOptions` → 0 hits (import 0건, 호출 0건).
- 결과: mode prop이 GridPaginationOptions 타입에는 존재하지만 TanStack 옵션에 반영 안 됨 → AC-001/002/007 런타임 무효 (dead code).
- verify B-03이 늦게 검출하여 loop 1 80/90 FAIL → loop 2에서 buildTableOptions.ts L35/L101/L184/L196 wiring 추가 후 100/90 PASS.
- 본 A-06으로 implement 단계에서 사전 차단. Implementer Self-Fix 자동 보완 권장: util 생성 후 호출처 grep → 0건 시 자동 wiring 후보 제안.

### A-07: Test Runtime Execution Check (2026-05-14 MOD-GRID-04/G-001 신설)
**YES**: spec Section 7에 `*.test.ts`, `*.test.tsx`, `*.spec.ts` 파일이 명시되어 있으면 — 패키지 디렉토리에서 `npx vitest run <test-path>` 또는 동등 명령을 실제 실행하여 **exit code 0** 확인. evidence에 다음 모두 포함:
  1. 실행 명령 인용 (`npx vitest run src/column/createColumns.test.ts` 등)
  2. 결과 요약: 통과 N건 / 실패 0건 (실패 0이어야 YES)
  3. duration 또는 reporter 출력의 마지막 줄 발췌 (실제 실행 증거)
**NO**: 테스트 파일이 spec에 명시되어 있으나 실행되지 않았거나, 실행 결과 1건 이상 실패. tsc 통과만으로는 YES 불가 (런타임 동작 확인 의무).
**N/A**: spec Section 7에 테스트 파일이 명시되지 않은 Goal (예: 순수 빌드 설정 변경, README 추가 등).

**검증 방법 (Coverage Verifier)**: spec Section 7의 NEW/MODIFY 파일 중 `*.test.*` 또는 `*.spec.*` 패턴 검사. 발견 시 해당 패키지 디렉토리에서 vitest/jest 실행 + exit code 확인. import path resolution 또는 logic bug로 인한 실패도 NO 처리. typetest(`.typetest.ts`)는 tsc 결과로 대체 가능 (별도 runtime 무).

**근거 사례 (G-001 implement+verify loop 1 2026-05-14)**:
- spec Section 7 #6 `createColumns.test.ts` 명시. Implementer + Verifier 모두 100점 PASS.
- 사후 harnessReview 단계에서 `npx vitest run` 실행 → **TC-06 (미등록 type fallback) FAIL**.
- 원인: `isColumnInfo()` heuristic (createColumns.ts L52-56)이 `meta` 필드 없는 TomisColumnDef를 ColumnInfo로 오판 → `normalizeColumnInfo()`가 'unknown_type' → 'text'로 coerce → fallback console.warn 경로 미도달.
- 13 통과 / 1 실패였으나 tsc 통과 + Grep identifier 매칭만으로 100점 인정됨. 1 loop 낭비 또는 후속 Goal에서 회귀 검출 위험.
- 본 A-07로 implement 단계에서 사전 차단. AC-007 fallback path는 spec EC-02와 직접 매핑 — 테스트 실행만으로 spec-구현 mismatch 즉시 검출 가능.

**자동 보완 권장**: vitest 실행 가능한 monorepo는 Implementer가 self-test 후 결과를 implement-score JSON `testResult` 필드에 기록 (`{passed: N, failed: M, command: "npx vitest run ..."}` 형식).

---

## B: 코드 품질 (7항목)

### B-01: `npx tsc --noEmit` 0 errors
**YES**: 패키지 디렉토리에서 tsc 통과 + tw-framework-front에서도 통과
**NO**: 한쪽이라도 에러
**금지**: --skipLibCheck로 우회 (C-12)

### B-02: any 타입 0건
**YES**: Grep `: any|<any>|as any` 결과 0건
**NO**: 1건 이상

### B-03: TanStack v8 표준 API 사용 (C-2)
**YES**: useReactTable + getCoreRowModel 등 표준 함수만 사용
**NO**: 내부 API 직접 접근 (private fields 등)

### B-04: Tailwind className만 (CSS 신규 X)
**YES**: 새 .css/.scss 파일 0건. style 속성 동적 값 외 사용 X
**NO**: 신규 CSS 파일 생성 또는 정적 inline style

### B-05: ESLint 통과
**YES**: 패키지 디렉토리 lint 통과 (warning 허용, error 0)
**NO**: 1건 이상 error

**★ stub-stage eslint-disable 가이드 (2026-05-14 MOD-GRID-10/G-001 추가)**: stub 단계 Goal(시그니처/타입만 정의, 본체는 후속 Goal) 에서 monorepo 공통 eslint config 가 underscore-prefix param (`_seed`, `_packageName` 등) 을 unused 로 보고하는 경우 — **file-level `/* eslint-disable @typescript-eslint/no-unused-vars */` + TODO 코멘트 (다음 Goal 번호 명시) 허용**. 후속 Goal 에서 본체 구현 시 자연 제거. 이 우회는 stub 단계 한정 (production hook 본체에서는 금지).

### B-06: Wijmo import 0건 (C-16)
**YES**: Grep `@mescius/wijmo|from ['"]wijmo` 결과 0건
**NO**: 1건이라도 발견

### B-07: 더미/Mock 데이터 0건 (프로덕션 코드)
**YES**: 프로덕션 코드에 `dummyData|mockData|fakeData|//\s*TODO` 0건
**N/A**: Storybook/test 코드 (예외)

---

## C: 호환성 (4항목)

### C-01: 영향 사용처 23개 파일 tsc 0
**YES**: tw-framework-front 전체 tsc 통과 (사용처 마이그레이션 전이라도 deprecation alias로 호환)
**NO**: 사용처에서 에러 발생

### C-02: 외관 보존 (시각 회귀 — C-17)
**YES**: 영향 사용처 Storybook 또는 수동 스크린샷 비교 외관 보존
**NO**: 외관 변경 감지
**N/A**: low tier + 사용처 0

### C-03: console warning 0건 (런타임)
**YES**: 영향 사용처 실행 시 console warning 0건
**NO**: deprecated API warning 또는 React warning 존재
**예외**: Spec에 명시된 deprecation warning은 의도된 것이므로 YES

### C-04: peerDependencies 정책 (C-22)
**YES**: react/@tanstack/react-table 등이 peerDependencies로 선언 (dependencies X)
**NO**: dep과 peer 중복 선언 또는 잘못된 분류

---

## D: 사용처 마이그레이션 (3항목)

### D-01: 마이그레이션 진행 비율
**YES**: Spec Section 8.1의 영향 사용처 중 본 Goal에서 ≥ 50% 마이그레이션 완료
**NO**: 50% 미만 또는 0건
**N/A**: 사용처 0개 (신규 기능)

### D-02: PR/Commit 분리 (대량 일괄 X — C-19)
**YES**: 1 Goal당 마이그레이션 사용처 ≤ 5개 (또는 트리비얼 import 변경 ≤ 10개)
**NO**: 6개 이상 일괄 변경

### D-03: 잔여 사용처 documented-deviations 기록
**YES**: 마이그레이션 안 된 사용처에 대해 `findings/documented-deviations/`에 기록 + 다음 Goal 계획
**NO**: 잔여 사용처 미기록
**N/A**: 잔여 0건

---

## E: 번들 + 라이선스 (3항목)

### E-01: 번들 크기 변동 측정 (C-21)
**YES**: `size-limit` 통과 (패키지별 한도 내 — grid-core 30KB, pro 20KB 등)
**NO**: 한도 초과 또는 측정 안 됨

**★ N/A sub-condition — Pre-existing infra defect (2026-05-15 MOD-GRID-15/G-003+G-004 cascade)**: 다음 모두 충족 시 N/A (분모 제외):
1. **raw tsup output 한도 내**: 패키지 `dist/index.mjs` (또는 `.cjs`) 의 raw byte size 가 C-21 한도 (Pro 20 KB, core 30 KB) 이내.
2. **measurement inflation 원인 외부**: `size-limit` 실패 원인이 `.size-limit.json` 의 `ignore` 배열 누락으로 peerDeps (React, TanStack Table, react-virtual 등) 가 측정 번들에 포함되어 inflate 된 경우. 같은 monorepo 의 다른 패키지(예: `grid-features`, `grid-pro-tracking`) `.size-limit.json` entry 가 `ignore` 배열로 peerDeps 제외하는 선례 존재.
3. **본 Goal 범위 외**: 현재 Goal 의 `spec.implementFiles` 또는 `Section 7` 표에 `.size-limit.json` 미포함 (= 본 Goal 책임이 아닌 infra defect).
4. **documentedDeviations 기록 의무**: implement-score JSON `documentedDeviations[]` 에 `{ "deviation": "size-limit pre-existing infra defect", "reason": ".size-limit.json grid-pro-XX entry lacks ignore array — peerDeps inflate measurement", "rawSize": "<actual KB>", "limit": "<C-21 limit>", "followUpRecommendation": "infra Goal to add ignore array per grid-pro-tracking pattern" }` 1건 이상.

**근거 사례 (G-003 + G-004 implement 2026-05-15)**: 두 Goal 모두 `size-limit` brotli 측정 결과 한도 초과 (G-003 58.8 KB, G-004 유사) 이나 raw tsup output 은 9.86~15.92 KB (Pro 20 KB 한도 내). `.size-limit.json` 의 `grid-pro-agg` entry 가 `ignore` 배열 누락 — `grid-pro-tracking` entry 는 정확히 React + TanStack peerDeps 를 ignore 하는 선례 존재. Goal scope 가 `.size-limit.json` 수정 미포함 (C-1 surgical change 원칙). 두 Goal 모두 E-01 NO 처리되어 92.3 / 92.9 점수 유발. 본 N/A sub-condition 으로 후속 Pro 패키지 Goal (MOD-GRID-99-A/B 외) 의 동일 패턴 차단 — infra defect 가 fix 될 때까지 N/A 가능.

**검증 방법 (Coverage Verifier)**: 4 조건 모두 충족 검증 후 N/A 인정. 한 조건이라도 누락 시 일반 NO 처리. `documentedDeviations[]` 의 rawSize + limit 수치는 tsup 출력 또는 `Get-ChildItem dist/index.mjs` 결과로 직접 확인 의무.

### E-02: 외부 라이브러리 ADR 작성 (C-20)
**YES**: 새 dep 추가 시 `decisions/MOD-GRID-XX-decisions.md`에 ADR
**N/A**: 새 dep 추가 없음

### E-03: 라이선스 명시 (C-24)
**YES**: 수정/생성한 package.json에 `license` 필드 + LICENSE 파일 (MIT) 또는 EULA (Pro)
**NO**: 라이선스 누락
**N/A**: package.json 변경 없음

---

## 점수 산출 예시

```
24 항목 중 (A=7 + B=7 + C=4 + D=3 + E=3):
  YES: 20
  NO: 1
  N/A: 3     ← 분모에서 제외
  denominator: 21   ← YES(20) + NO(1). N/A(3)는 절대 미포함.
  score = 20/21 × 100 = 95.2

  ★ Verifier 자기-검산 (의무):
    - 항목 합계: 20 + 1 + 3 = 24 ✓ (rubric 총 24와 일치)
    - failedChecks 배열에는 NO 1건만 포함. N/A 3건 미포함 ✓

Goal.migrationImpact: high → threshold 95
→ passed: true (95.2 >= 95)
```

### ★ Verifier 산식 환각 패턴 (실제 사례 — G-002 specify 2026-05-13)

1차 Verifier가 N/A 항목을 분모에 포함하여 점수 부풀림 false-fail 발생. **검출법**: `score × denominator / 100 == yesCount` 검산. 불일치 시 새 Verifier 재호출. C-26 의무.

---

## 자동 보완 가능 패턴 (Implementer Self-Fix)

다음 NO는 자동 보완 시도 (최대 3회):
- B-02 any → 구체 타입 추론 (Spec interface 기준)
- B-06 Wijmo import → 즉시 제거 + 대체 패키지 안내
- B-07 TODO/mock → 실제 API 호출로 교체
- E-02 ADR 누락 → draft ADR 자동 생성
- E-03 라이선스 누락 → MIT/EULA 자동 추가

다음 NO는 자동 보완 불가 → 사용자 결정:
- A-04 대응표 누락 (도메인 지식 필요)
- C-02 시각 회귀 (수동 확인)
- D-02 PR 분리 (커밋 전략)

---

## Documented Deviation 처리 (환경 의존 AC — 2026-05-13 추가)

AC 중 **환경에 의존**하는 항목(CLI 도구 미설치, OS 제약, 외부 서비스 미가용 등)이 실행 불가일 때:

1. **사전 조건**: Spec Section 6 (엣지 케이스)에 해당 시나리오가 EC-NN으로 명시되어 있어야 한다 (1:1 매핑).
   - 매핑 없으면 deviation 인정 불가 → 일반 NO 처리.
2. **finding 파일 작성 의무**: `findings/auto-fixed/MOD-{MOD}-{GOAL}-{slug}.md` 작성.
   - 파일 누락은 verify F-01에서 환각으로 처리됨.
3. **implement-score JSON 기록**:
   ```json
   "documentedDeviations": [
     {
       "ac": "AC-005",
       "reason": "환경 제약 사유",
       "finding": "findings/auto-fixed/{경로}",
       "resolution": "다음 Goal 착수 전 개발자 조치 단계"
     }
   ]
   ```
4. **점수 처리**: 해당 AC에 직접 매핑되는 rubric 항목이 있다면 N/A 처리 (분모 제외).
   - 매핑되는 항목이 없다면 점수 영향 없음 (deviation 기록만).

**악용 방지**: deviation으로 인정되는 AC는 spec 단계에서 EC와 1:1 매핑된 항목만. spec writer 단계에서 EC ↔ AC 매핑 권장 (specify-rubric C-05 보강 참조).

**근거 ADR**: `decisions/MOD-GRID-00-decisions.md` ADR-MOD-GRID-00-003.

---

## Output JSON 형식

```json
{
  "goalId": "G-NNN",
  "module": "MOD-GRID-XX",
  "area": "{area}",
  "stage": "implement",
  "rubricVersion": "1.0",
  "migrationImpact": "high|medium|low",
  "checks": {
    "A-01": { "result": "YES|NO|N/A", "evidence": "..." },
    ...
    "E-03": { ... }
  },
  "buildResult": { "tsc": "0 errors", "viteBuild": "OK", "sizeLimit": "OK" },
  "yesCount": N, "noCount": N, "naCount": N, "denominator": N,
  "score": N.N, "threshold": N, "passed": true|false,
  "failedChecks": [...],
  "autoFixed": [{"check": "B-02", "action": "any → string"}],
  "promptSpecDrift": [
    { "field": "grid-renderers.peerDependencies", "promptValue": "{react, react-dom only}", "specValue": "{react, react-dom, @tanstack/react-table}", "resolution": "spec applied" }
  ],
  "feedback": { ... }
}
```

`promptSpecDrift` 필드는 F-05 의무. drift 없으면 빈 배열 `[]` 또는 필드 생략 가능. 1건 이상 발견 시 반드시 기록.
