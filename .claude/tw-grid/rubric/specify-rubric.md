# Specify Rubric — tw-grid v1.0.10 (32 + H 메타 게이트 3항목)

**v1.0.10 변경 사항 (2026-05-27 MOD-GRID-09 모듈 audit trigger — `[[feedback-tw-grid-spec-goals-sync]]`)**:
- **C-26 자기-검증 sub-rule 신설 (★ yesCount/naCount mechanical 재계산 의무)**: 기존 C-26 은 `denominator = checks 중 result != "N/A" 인 항목 수` 재계산만 명시. 본 sub-rule 로 `yesCount` 와 `naCount` 도 mechanical 재계산 의무화. 근거 사례: 2026-05-27 MOD-GRID-09 모듈 audit (G-001/G-002/G-004 specify/implement) 에서 6/9 score JSON 의 yesCount/naCount 분류 오류 발견. NO=0 정확 + denominator=YES count 산식상 score 영향 0 이나 audit trail 신뢰성 손상 + diagnose agent false positive 위험. 동일 패턴 cross-harness 가능성 (tw-harness/tw-mail) — N=2 (G-003 r3 verifier 자기-catch yes=26→25 + Patcher Agent G-004 specify catch yes=29→26). 자세히는 `[[feedback-tw-grid-spec-goals-sync]]` R2.
- **메타 게이트 별도집계 signal 검증 의무**: 일부 score JSON 은 H-01~H-03 (메타 게이트) 를 본 채점 항목 카운트 외 별도 집계함. 이 경우 `rubricMetadata.evaluableItems` 또는 `rubricMetadata.rubricItemsTotal` signal 확인 의무. signal 부재 시 메타 게이트 포함/제외 어느 쪽인지 spec writer 가 score JSON 헤더에 명시. 근거 사례: 2026-05-27 audit Agent 가 G-004 specify yesCount=29 추정 (메타 게이트 포함 mechanical count) → Patcher Agent 가 rubricMetadata.evaluableItems=26 signal catch 후 yes=26 유지 정정.
- 항목 수 32 + H=3 불변 (C-26 sub-rule 내부 보강만).

**v1.0.9 변경 사항 (2026-05-15 MOD-GRID-99-A/G-001 harnessReview)**:
- **H-02 외부 디렉토리 예외 sub-rule (2) 확장**: "spec Section 8.2 (무파괴 검증)에 명시" 단일 anchor → **다음 anchor 중 하나 이상** 으로 OR 확장. spec writer 가 동일 정보를 Section 7 truth table, D# 결정 표, ADR 참조 본문 어디에 두든 H-02 충족 인정. 근거 사례: G-001 1차 Verifier 가 spec.md L486-492 D1 정정 본문(`외부 저장소` 명시)을 보유하고 Section 7 truth table 도 외부 monorepo prefix 로 일관 채워져 있었음에도 Section 8.2 anchor 만 검색하여 H-02 환각 NO → 2차 Verifier 정정 + verifierIteration 필드 사용. 후속 MOD-GRID-99-B Docs 등 동일 외부 디렉토리 패턴에서 재발 차단.
- **E-06 Return-Type Signature Cross-Check sub-rule 신설** (항목 수 불변): 기존 "Prose ↔ Parallel Structured Form Semantic Cross-Check" 는 state-mutation/branch-behavior 영역만 커버. **반환 타입 시그니처** (`Promise<X>` vs `Promise<Y>`) 모순도 동일 cross-check 적용 의무. 근거 사례: G-001 spec Section 4 prose L107 `verifySignature` 반환 타입 `Promise<LicenseState>` vs Section 5.3 executable L306 `Promise<LicenseStatus>` 1:1 불일치. spec writer 자가-검증 E-06 keyword grep ("재결정") 으로는 미검출. Implementer 가 C-30 권위로 Section 5.3 executable 채택 + specCodeDefects[] 자율 보고로 catch — spec 단계 사전 차단 의무.
- **E-06 Unused Type Import Cross-Check sub-rule 신설** (항목 수 불변): spec 본문에 명시된 import line 의 import 항목이 같은 파일 본문에서 1회 이상 사용 의무. monorepo `noUnusedLocals: true` strict 환경에서 spec template 그대로 따라 구현하면 컴파일 fail. 근거 사례: G-001 spec L280 `import type { LicenseState, LicenseStatus } from './types.js'` — `LicenseState` 는 verifySignature.ts 본문에서 미사용 (state.ts 전용 type) → Implementer 가 noUnusedLocals 통과 위해 unused import 제거 + specCodeDefects[] 보고. spec writer 가 spec 작성 시 import line 작성 직후 본문 grep 으로 모든 import 항목 사용 확인 의무.
- 항목 수 32 + H=3 불변 (H-02, E-06 내부 보강).

**v1.0.8 변경 사항 (2026-05-15 MOD-GRID-17/G-001 self-review)**:
- B-04 강화: 사용처 마이그레이션 Goal (affectedUsageFiles 가 TOMIS base repo) 의 spec 은 **dep 해결 경로** (package.json dependency / vite.config alias / tsconfig paths) 와 **alias source target** (예: `topvel-grid-monorepo/packages/grid-core/src/index.ts`) 을 Section 9 또는 D# 결정에 명시 의무. 1차 Implementer 의 "dep 미존재 → 진행 불가" 추측 패턴 사전 차단. cross-reference: ADR-MOD-GRID-17-002.
- A-04 강화: 영향 사용처 카운트 명시 시 — `affectedUsageFiles[]` 가 워크트리 외부 (TOMIS base repo) 인지 표시 의무. boundary 우회 (C-34) 적용 대상 여부 spec 단계에서 분류.
- 항목 수 32 불변 (B-04, A-04 내부 보강).

**v1.0.7 변경 사항 (2026-05-15 MOD-GRID-10/G-004 harnessReview)**:
- E-06 sub-rule 신설: Prose ↔ Parallel Structured Form Semantic Cross-Check (항목 수 불변). G-004 spec Section 2.2 EC-03 prose(L179 JSDoc) "deleted → statusMap.delete only" vs D5/EC-06/branch table(L198)/Section 11.2 snippet(L439) "originalMap.delete(key) 포함" — 4 source authority vs 1 prose 모순. 현 E-06 의 "재결정" keyword grep 으로는 미검출(prose 가 재결정 표현 아닌 parallel description). spec writer 자가-검증 "재결정 0건" PASS 통과 후 F-06 (Implementer 자율 보고) 가 사후 catch. 본 sub-rule 로 spec 단계 prose 의미 일관성 사전 검증 의무화. trigger 가 좁아 verifier 비용 bounded — prose + 동일 operation 의 structured form (table/code/EC) 둘 다 존재할 때만 발동.

**v1.0.6 변경 사항 (2026-05-15 MOD-GRID-10/G-003 harnessReview)**:
- G-01 강화: Spec D# 결정 ↔ goals.json 데이터 일관성 cross-check 의무 추가 (항목 수 불변). G-003 spec loop 0 사례 (D1 monorepo prefix 결정 vs goals.json TOMIS prefix 5개 entry 모순) → 93.1 FAIL → loop 1 prefix 일괄 보정 → 100 PASS 패턴 재발 차단.

**v1.0.5 변경 사항 (2026-05-14 MOD-GRID-03/G-001 retrospective)**:
- E-06 신설: Section 7 Re-decision ↔ Final Table Consistency — Section 7 본문에 "재결정" 문장이 등장하면 직후 "최종 implementFiles" 표가 재결정 결과를 100% 반영해야 한다. G-001 spec L383("buildTableOptions.ts 수정함 — index.ts 대신") vs L385-393 최종 표(index.ts 명시, buildTableOptions.ts 누락) 사례 차단.
- 항목 수 31 → 32 (E 카테고리 5 → 6). C-26 자기-검산 reference 동기 갱신.

**v1.0.4 변경 사항 (2026-05-14 G-002 self-review)**:
- G-01: D# 표 ↔ 본문 cross-consistency 강화 — **breakdown 항목(파일명/세부 카운트/enable 항목명)** 일치 의무 명시. 합계만 일치하고 breakdown(예: NEW/MODIFY 분류, 파일 이름 목록)은 본문과 다른 케이스가 G-001 D5 + G-002 D4 두 번 ✅ 통과한 사례 재발 차단.

**v1.0.3 변경 사항 (2026-05-14 G-004 success-review)**:
- E-01: Section 7 ↔ Section 11 일관성 cross-check 의무 추가 (항목 수 불변)
- G-01: 사전 결정 표(D#) ↔ 본문 cross-consistency 의무 추가 (항목 수 불변)
- 두 추가 모두 기존 항목 내부 보강 — rubric 총 31 항목 유지

**항목 카운트 (총 32)**: A=5 + B=5 + C=5 + D=6 + E=6 + F=4 + G=1 = 32. 메타 게이트 H=3 별도.

**점수 계산 (★ Coverage Verifier 산식 자기-검증 의무 — 2026-05-13 추가)**:
- YES = 1, NO = 0, **N/A = 분모에서 제외**
- **denominator = YES수 + NO수** (N/A는 절대 분모에 포함 X)
- **score = YES수 / denominator × 100**
- **★ `failedChecks` 배열에는 NO 결과만 포함. N/A 절대 포함 금지.**
- **★ 카테고리별 합계(A+B+C+D+E+F+G)가 32와 일치하는지 Verifier가 산출 후 자기-검산 의무 (C-26)**
- **★ Verifier는 점수 산정 직후 `denominator = checks 중 result != "N/A" 인 항목 수`를 재계산하여 일치 확인. 불일치 시 동일 결과 폐기 후 새 Agent 인스턴스 재호출.**
- **★ yesCount/naCount mechanical 재계산 의무 (2026-05-27 추가, MOD-GRID-09 모듈 audit trigger — `[[feedback-tw-grid-spec-goals-sync]]` R2)**:
  - Verifier 는 점수 산정 직후 checks 객체 순회하여 `result == "YES"` mechanical count = top-level `yesCount` 일치 확인 의무
  - 동일하게 `result == "N/A"` mechanical count = top-level `naCount` 일치 확인 의무
  - 불일치 시 동일 결과 폐기 후 새 Agent 인스턴스 재호출
  - **메타 게이트 별도집계 signal**: score JSON 에 `rubricMetadata.evaluableItems` (메타 게이트 제외 채점 항목 수) 또는 `rubricMetadata.rubricItemsTotal` (총 항목 수) signal 명시 의무. signal 부재 시 메타 게이트 포함/제외 정책 명시
  - 근거 사례: 2026-05-27 MOD-GRID-09 모듈 (G-001/G-002/G-004) 6/9 score JSON 분류 오류. score 영향 0 이나 audit trail 신뢰성 손상 + diagnose agent false positive 위험
- **★ JSON 출력 무결성 자기-검증 (2026-05-15 추가)**: Verifier 는 score JSON 을 디스크에 쓰기 직전 `JSON.parse(myOutput)` 자기 호출로 parse 성공 검증 의무. 실패 시 동일 결과 폐기 후 새 Agent 인스턴스로 재호출. evidence 안 따옴표 `\"`, 백슬래시 `\\\\`, 정규식 모두 escape 확인. 근거: 2026-05-14 implement 단계 score 3건 corrupt 발생 — specify 단계도 사전 차단.

**Threshold (tier별)**: high 95 / medium 90 / low 85

---

## ★ 메타 게이트 (H): 환각 탐지 — 점수 산정 전 필수 통과

아래 H 항목 **하나라도 NO → 점수 계산 생략, score=0, passed=false 강제**.
이유: 환각이 포함된 spec은 부분 점수도 무의미하며, 다음 IMPLEMENT가 잘못된 가정 위에 진행됨.

### H-01: referenceEvidence 경로 실재
**YES**: spec의 L0/L1/L2/L3 경로 각각 Glob 또는 Read로 존재 확인됨
**NO**: 하나라도 미존재 → "환각 의심: {경로} 미존재"

**★ 평가 범위 명확화 (2026-05-14 MOD-GRID-10/G-001 추가)**: H-01 평가는 **Section 1 의 L0/L1/L2/L3/R-A/R-W referenceEvidence 경로에 한정**. Section 7 implementFiles (NEW deliverable, 예: 신규 생성될 EULA.md/types.ts) 는 IMPLEMENT 단계 책임으로, SPECIFY 단계의 H-01 평가 대상이 **아님** (NEW 산출물 미존재 = 정상). Section 7 NEW 행 ↔ referenceEvidence 혼동 차단.

**★ 라인 인용 의무 (2026-05-13 G-003 추가)**: Verifier가 H-01을 NO로 거부하려면 다음 모두 충족해야 한다. 충족하지 않은 거부는 **무효** — 동일 결과 폐기, 새 Agent 인스턴스 재호출.

1. **spec.md 라인 번호 + 발췌 인용**: 거부 근거가 되는 spec.md의 정확한 라인 번호 + 해당 라인 텍스트를 evidence 필드에 인용. 형식 예시:
   ```
   spec.md L32 인용: "D:/project/topvel_project/TOMIS/tw-framework-front/package.json"
   Verifier 검증 경로: "D:/project/topvel_project/TOMIS/tw-framework-front/package.json"
   판정: 일치 → YES (또는 불일치 시 차이점 명시 후 NO)
   ```
2. **Read 도구 호출 증거**: 거부 대상 경로를 Read 또는 Glob으로 직접 검증한 결과 (line range 또는 file count) evidence에 명시.
3. **경로 분실/오독 자가-검증**: TOMIS 내부 경로(`TOMIS/...` segment 포함)를 인용할 때 segment 분실 여부 확인. spec.md 원문 라인의 모든 path segment를 누락 없이 복사했는지 cross-check.

**근거 사례 (G-003 specify 2026-05-13)**: 1차 Verifier가 L0 경로 `D:/project/topvel_project/TOMIS/tw-framework-front/package.json`을 `D:/project/topvel_project/tw-framework-front/package.json`(TOMIS segment 분실)로 오독하여 H-01 환각 NO 처리. spec.md L32을 정확히 인용하지 않은 거부 결정. 2차 Verifier가 라인 인용 + Read 재검증으로 정정.

### H-02: implementFiles 경로 합리성
**YES**: implementFiles의 부모 디렉토리 실재 + 파일명이 프로젝트 컨벤션과 일치 (`packages/grid-core/src/...` 등)
**NO**: 부모 디렉토리 없거나 컨벤션 불일치 → "구현 대상 경로 비합리적: {경로}"

**외부 디렉토리 예외 (2026-05-13 추가)**: TOMIS git 외부 경로(예: `D:/project/topvel_project/topvel-grid-monorepo/`)를 이 Goal이 **새로 생성**하는 경우 — 부모 디렉토리 미존재가 정상. 다음 모두 충족 시 YES:
1. **조부모 디렉토리 실재** (★ 첫 검증 단계 — 2026-05-15 G-001 harnessReview) — Bash `ls` 또는 Glob 도구로 직접 확인 후 evidence 에 인용. 이 단계가 실패하면 외부 디렉토리 예외 인정 불가 (단순 비합리 경로). 1차 Verifier 가 이 단계 누락하고 sub-rule (2) 만 보고 H-02 NO 처리한 사례 (2026-05-15 G-001) 차단 — main rule "조부모 실재" 가 외부 예외 적용의 first-step.
2. **외부 저장소 명시 anchor (★ 2026-05-15 G-001 harnessReview — anchor OR 확장)** — 다음 anchor 중 **하나 이상** 에 "외부 저장소" 또는 "TOMIS git 외부" 또는 "monorepo 별도 리포" 또는 동등 표현 명시:
   - spec Section 7 truth table 본문 또는 인근 결정 단락 (D# 정정 본문 — 예: L486-492 D1 정정)
   - spec Section 8.2 (무파괴 검증) 또는 동등 검증 섹션
   - spec D# 결정 표 (헤더) 의 외부 경로 채택 결정
   - ADR 참조 본문 (예: ADR-MOD-GRID-00-001 인용) — 인용된 ADR status/context 에 외부 리포 명시
   근거 사례 (G-001): spec.md L486-492 (Section 7 D1 정정 본문 — sub-anchor 1) + ADR-MOD-GRID-00-001 인용 (sub-anchor 4) 모두 충족. 1차 Verifier 가 Section 8.2 단일 anchor 만 검색하여 환각 NO 처리. 후속 MOD-GRID-99-B Docs Goal 도 동일 외부 디렉토리 패턴 — anchor OR 확장으로 재발 차단.
3. **명명 컨벤션이 프로젝트 다른 외부 디렉토리와 일치** (예: `topvel-` prefix + kebab-case). evidence 에 비교 대상 디렉토리 이름 인용 (예: `topvel-grid-monorepo` ↔ 기존 `topvel-*` 디렉토리 패턴 일치).

근거 ADR: `decisions/MOD-GRID-00-decisions.md` ADR-MOD-GRID-00-001.

**★ Verifier 거부 의무 (2026-05-15 G-001 harnessReview 추가)**: H-02 를 NO 로 거부할 경우 evidence 에 **세 sub-rule 모두에 대해 개별 판정 + 증거** 명시 의무. sub-rule (1) 조부모 실재 검증 결과 누락 또는 sub-rule (2) anchor 검색 시 4개 anchor 중 하나만 grep 하고 NO 결론 → **거부 무효, 동일 결과 폐기 후 새 Agent 인스턴스 재호출**. H-01 라인 인용 의무 (위 섹션) 와 동일 정책.

### H-03: AC 출처 태그 검증
**YES**: 모든 AC에 `source: L0|L1|L2|L3|R-A|R-W|C-NN` 태그 + 해당 출처가 spec의 다른 섹션에서 실제 인용됨
**NO**: 출처 태그 누락 또는 spec 내 인용 없음 (출처 날조 의심)

**처리**: 모든 H YES → 일반 채점 진행. 하나라도 NO → status=fail, loops+=1, feedback에 H 항목 명시.

---

---

## A: 참조 추적성 (5항목)

### A-01: L0 현 구현 파일 명시 + 패턴 인용
**YES**: Section 1에 tw-framework-front 현 구현 파일 경로 + 핵심 코드 발췌 인용
**NO**: 파일 경로 또는 코드 발췌 누락
**N/A**: 새 영역 (MOD-GRID-06 Excel처럼 현 구현 0인 경우) → "현 구현 없음" 명시되면 YES

### A-02: L1 TanStack v8 API signature 인용
**YES**: Section 1 + Section 2에 TanStack 표준 API (useReactTable, getCoreRowModel 등) signature 인용
**NO**: TanStack API 출처 없이 props 정의

### A-03: L2 공통 컴포넌트 분석 (8 variant 중복 추출)
**YES**: 현 8 variant(BaseGrid/ChangeTrackingGrid/EditableGrid 등)에서 추출한 중복 패턴 명시
**NO**: 중복 패턴 분석 없이 신규 API 제안
**N/A**: 신규 영역 (Excel/PDF 등)

### A-04: L3 영향 사용처 카운트 명시
**YES**: Section 1 + Section 8.1에 영향 사용처 N개 파일 목록 (정확한 카운트)
**NO**: "여러 곳" 같은 모호한 표현
**N/A**: 사용처 0개 (신규 기능)

### A-05: R-A AG Grid + R-W Wijmo 동등 기능 참조
**YES**: AG Grid + Wijmo의 동등 기능 명시 (참조용 — 코드 차용 X)
**NO**: 참조 분석 없이 신규 API 설계
**N/A**: 두 라이브러리에 동등 기능 없음 (희귀)

---

## B: API 계약 (5항목)

### B-01: TypeScript interface 정의 (props/return/events)
**YES**: Section 2에 모든 props/return/event type interface 정의
**NO**: 일부 타입 누락 또는 any 사용

### B-02: 사용 예시 코드 최소 2개
**YES**: 기본 사용 + 고급 시나리오 2개 이상 코드 예시
**NO**: 1개만 또는 모두 단순 예시

### B-03: 기본값 + optional 명시
**YES**: 모든 props에 default value 또는 required/optional 명시
**NO**: 명시 누락

### B-04: 타입 export 경로 명시
**YES**: `packages/grid-core/src/types.ts` 같은 정확한 export 위치
**NO**: 경로 누락

**★ 사용처 마이그레이션 Goal 의 dep 해결 경로 의무 (2026-05-15 MOD-GRID-17/G-001 추가)**: `affectedUsageFiles[]` 가 TOMIS base repo (`tw-framework-front/src/pages/`, 등) 에 위치한 사용처 마이그레이션 Goal 의 spec 은 import 대상 패키지의 **해결 경로** 를 다음 셋 중 하나로 명시 의무:

1. **package.json dependency**: `tw-framework-front/package.json` 의 `dependencies` / `devDependencies` 라인 인용 (예: `"@topgrid/grid-core": "workspace:*"` L23 인용).
2. **vite.config.ts alias**: `vite.config.ts` 의 `resolve.alias` 라인 + 대상 경로 인용 (예: `'@topgrid/grid-core': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-core/src')` L18).
3. **tsconfig.json paths**: `tsconfig.json` 의 `compilerOptions.paths` 라인 + 대상 경로 인용.

**검증 방법 (Coverage Verifier)**: spec Section 9 (의존성) 또는 D# 결정 표 의 dep 해결 경로 인용 — Read 도구로 인용 라인 검증. 인용 라인이 실제 파일에 존재하지 않으면 NO (H-01 환각 의심 카테고리). 명시 누락 시 — 1차 Implementer 가 "dep 미존재 → 진행 불가" 추측에 빠지는 패턴 (MOD-GRID-17/G-001 1차 사례) 재발 위험 → NO.

**근거 사례 (MOD-GRID-17/G-001 2026-05-15)**:
- spec G-001-spec.md Section 9 (L426-435) + D5 결정 — vite.config.ts L18 alias 명시 (`'@topgrid/grid-core': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-core/src')`).
- 1차 Implementer 가 spec D5 + Section 9 를 읽기 전 "package.json dependency 에 grid-core 가 없어 작업 불가" 추측. spec 명시 정독 후 alias 경로 확인 → 정상 진행.
- spec 단계 본 sub-rule 의무화로 Implementer 추측 단계 사전 차단.

**적용 범위**: 사용처 마이그레이션 Goal (MOD-GRID-17 G-001~G-006 + MOD-GRID-18~) cascading. 단, 코어 패키지 변경 Goal (MOD-GRID-01~16) 은 N/A (사용처 영향 없음 또는 monorepo 내부).

### B-05: ref API + imperative handle 명시 (해당 시)
**YES**: useImperativeHandle 또는 ref API가 필요한 경우 명시
**N/A**: ref 불필요 (선언적 컴포넌트)

---

## C: 인수 기준 + 영향도 (5항목)

### C-01: AC 3개 이상
**YES**: acceptanceCriteria 배열에 3개 이상 항목
**NO**: 3개 미만

### C-02: 각 AC에 출처 태그 (L0/L1/L2/L3/R-A/R-W)
**YES**: 모든 AC에 `(L1: TanStack getSortedRowModel)` 같은 출처 태그
**NO**: 태그 없는 AC 존재

### C-03: binary 검증 가능
**YES**: 모든 AC가 "~가 표시된다", "~가 호출된다" 같이 객관 검증 가능
**NO**: "잘 동작한다" 같은 주관 표현

### C-04: migrationImpact 명시 (high/medium/low)
**YES**: Section 1과 Goal JSON에 migrationImpact 필드 + 사유
**NO**: 임의 추측 또는 누락

### C-05: AC에 호환성 검증 항목 포함
**YES**: AC 중 최소 1개가 "영향 사용처 N개 외관 보존" 또는 "tsc 0 errors" 같은 호환성 검증
**N/A**: 사용처 0개 (신규 기능)

---

## D: 영향도 + 호환성 (6항목)

### D-01: 영향 사용처 N개 파일 목록 (Section 8.1)
**YES**: Section 8.1에 정확한 파일 경로 N개 (또는 "0개" 명시)
**NO**: 추정 카운트 또는 누락

### D-02: 기존 변형 대응표 (Section 3)
**YES**: 8 variant 중 영향받는 것에 대한 새 API 대응표 (마이그레이션 액션 포함)
**NO**: 대응표 없거나 일부 누락
**N/A**: 신규 영역 (대응할 variant 없음)

### D-03: Breaking change 명시 (Section 4)
**YES**: yes/no 명확히 + breaking 시 영향 + deprecation 전략
**NO**: 모호 또는 누락

### D-04: Deprecation 전략 (Section 4)
**YES**: 단계적 마이그레이션 vs 일괄 + alias 유지 기간 (최소 1 minor)
**N/A**: Breaking change 없음

### D-05: 롤백 전략 (Section 8.4)
**YES**: 신규 API 도입 실패 시 deprecated alias 또는 feature flag로 롤백 가능
**NO**: 롤백 불가능한 일괄 변경
**N/A**: low tier + 사용처 0

### D-06: 번들 영향 (Section 8.5)
**YES**: 예상 번들 크기 변동 (+N KB gzipped) + 분할 가능성
**NO**: 번들 영향 분석 없음 + C-21 위험

---

## E: 구현 계획 + 검증 (5항목)

### E-01: 파일별 변경 명세 (NEW/MODIFY)
**YES**: Section 7 + Section 11에 모든 파일 + 변경 유형 (NEW or MODIFY) + 변경 범위
**NO**: 일부 파일 누락 또는 변경 유형 표시 없음

**★ Section 7 ↔ Section 11 일관성 cross-check (2026-05-14 G-004 추가)**: Section 7 (NEW/MODIFY 표)는 Section 11 (구현 계획)의 모든 Step에서 도출되는 변경 파일을 **빠짐없이** 포함해야 한다. Section 11 Step 1~N에서 언급된 모든 MODIFY/NEW 파일이 Section 7 표에도 들어 있어야 single source of truth가 성립한다.

**검증 방법**: Section 11의 모든 Step을 sampling하여 각 Step의 변경 대상 파일이 Section 7 표 행으로 존재하는지 확인. 누락 시 NO.

**★ Section 2 template ↔ Section 11 executable code 시그니처 cross-check (2026-05-14 MOD-GRID-10/G-002 self-review 추가)**: spec Section 2 (API 계약 표/template) 의 함수 시그니처와 Section 11.2 (Before/After executable code) 의 같은 함수 호출 시그니처가 **1:1 일치**해야 한다. 두 곳 파라미터 수·이름·순서·optional 여부가 다르면 spec 내부 모순(Implementer 가 한쪽을 임의 선택). 예: Section 2 `applyAdd(state, seed, extractKey, generateKey)` 4-param template vs Section 11.2 `applyAdd(state, seed, assignedKey)` 3-param executable → spec writer 가 둘 중 하나로 동기 의무. C-30 (Spec Truth Table) 의 함수 시그니처 영역 확장.

**근거 사례 (G-002 spec 2026-05-14)**: Section 2.2 4-param template vs Section 11.2 After-pattern 3-param. Implementer 가 11.2 executable 우선 적용 + specCodeDefects[] 자율 보고 (F-06 documented deviation). spec writer cross-check 단계에서 사전 동기화하면 IMPLEMENT 자율 정정 부담 제거.

**근거 사례 (G-004 spec 2026-05-14)**: Section 11.1 Step 1 (decisions.md MODIFY) + Step 2 (monorepo/package.json MODIFY)가 Section 7 표 16행에 미포함. Implementer가 Section 11을 authoritative로 따라 구현했으나, **Section 7만 보고 검증**한 Verifier는 spec-내부 일관성 결함을 늦게 발견. 본 cross-check 추가로 spec 단계에서 사전 차단.

### E-02: Before/After 코드 스니펫 (최소 1개)
**YES**: Section 11에 핵심 변경의 Before/After 코드 블록 (최소 1개)
**NO**: Before만 또는 After만

### E-03: 구현 순서 2단계 이상 (의존성 고려)
**YES**: Section 11에 최소 2단계 (1: 기반 컴포넌트 → 2: 사용처 마이그레이션 등)
**NO**: 단일 단계 또는 의존성 무시

### E-04: 엣지 케이스 3개 이상
**YES**: Section 6에 엣지 케이스 3개+ (예: 0 행, 대용량, 동적 컬럼 변경)
**NO**: 3개 미만

**권장 (2026-05-13 추가)**: 환경 의존 AC(예: CLI 도구 설치 필요, 외부 서비스 가용성)가 있으면 해당 AC와 1:1 매핑된 EC를 명시. 매핑 표 형식:

| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-005 (pnpm install exit 0) | EC-02 (pnpm 미설치 환경) | 실행 불가 시 documented-deviation 처리 근거 |

매핑이 있으면 implement 단계에서 환경 deviation을 합리적으로 처리 가능. 매핑 없는 환경 의존 AC는 implement에서 일반 NO 처리됨.
근거 ADR: `decisions/MOD-GRID-00-decisions.md` ADR-MOD-GRID-00-003.

### E-05: 검증 계획 (Section 12)
**YES**: 단위 테스트 + 시각 회귀 + 빌드 검증 명시
**NO**: 일부 누락

### E-06: Section 7 Re-decision ↔ Final Table Consistency (2026-05-14 MOD-GRID-03/G-001 신설)
**YES**: Section 7 (또는 "최종 implementFiles" 표가 위치한 어느 섹션이든) 본문에 "재결정", "변경", "대체", "수정함" 같은 결정 변경 표현이 등장하면 — **그 직후 최종 implementFiles 표가 재결정 결과를 100% 반영**해야 한다. 검증은 다음 모두 충족:
  1. **재결정 본문 enumerate**: "재결정" 또는 동등 표현 인근에 명시된 변경(파일 추가/제거, 액션 변경, 경로 정정)을 모두 추출.
  2. **최종 표 매칭**: 추출된 변경이 직후 "최종 implementFiles" 표에 1:1 반영 — 추가 파일은 행으로 존재, 제거 파일은 행으로 미존재, 액션 변경은 액션 열에 반영.
  3. **모순 0건**: 본문이 "X.ts를 Y.ts로 대체"라 명시했는데 최종 표가 X.ts만 명시하고 Y.ts 누락 — 또는 그 반대 — 시 NO.
**NO**: 본문 재결정 문장과 최종 표 사이 1건 이상 모순 (파일 누락/잔존/액션 불일치).

**검증 방법**: Section 7 (또는 spec 내 "최종 implementFiles" 표가 위치한 섹션) 본문에서 다음 키워드 grep: `재결정`, `변경 대상`, `대체`, `수정함`, `~로 변경`, `~ 대신`. 각 hit 인근 2~3 문장에서 변경 enumerate 후 직후 표와 cross-match.

**★ Prose ↔ Parallel Structured Form Semantic Cross-Check (2026-05-15 MOD-GRID-10/G-004 신설)**: 본 E-06 의 keyword grep 은 "재결정" 표현만 잡고, **prose 가 동일 operation 을 parallel 하게 describe 하면서 structured form (branch table / code snippet / EC enumeration) 과 의미가 다를 때**는 미검출. 다음 추가 검증 의무.

**Trigger (좁은 발동 조건 — verifier 비용 bounded)**: 동일 operation 에 대해 다음 두 form 이 spec 내 **모두 존재**할 때만 발동.
1. **Prose form**: JSDoc 주석, 본문 narrative, 단락 (예: spec Section 2.2 EC-03 JSDoc L179 "③ deleted → un-mark: delete key from statusMap **only**").
2. **Structured form**: branch table 행, executable code snippet (Section 11.2 등), EC# enumeration, D# 결정 본문 (예: spec Section 2.2 branch table L198 row + Section 11.2 snippet L439 + EC-06 + D5).

**검증 방법 (semantic enumerate — grep 아님)**: prose 가 state-mutation / branch behavior 를 describe 하면 — 해당 prose 가 enumerate 한 operation list (예: "statusMap.delete only") 를 추출 → 같은 operation 의 structured form 행 / code 라인에서 enumerate 한 operation list 와 1:1 비교 → set difference 0건 의무.

**검증 대상 spec section 예시**:
- "각 branch 처리" / "각 case 처리" 같은 multi-branch JSDoc 또는 단락
- pure helper 함수 signature 위의 4~6줄 동작 설명 (특히 N 개 branch 처리 시)
- EC# enumeration 의 "기대 동작" 컬럼 + 같은 EC 의 D# 결정 본문 / branch table 행

**근거 사례 (2026-05-15 G-004 spec)**:
- Section 2.2 EC-03 prose JSDoc L179: "③ deleted → un-mark: delete key from statusMap **only** (currentMap intact)". prose 가 enumerate 한 operation: `statusMap.delete(key)` (1건).
- 동일 'deleted' branch 의 structured forms 4건:
  - D5 결정 본문 (L201): `statusMap.delete(key)` + `originalMap.delete(key)` (2건).
  - Section 2.2 branch table L198: `delete(key)` + `delete(key)` (D5 leak 방지 명시).
  - Section 11.2 executable code L439: `nextStatus.delete(key)` + `nextOriginal.delete(key)` (2건).
  - EC-06 L301-302: `statusMap.delete + originalMap.delete` (2건, leak fix 명문화).
- **prose 1건 vs structured 2건 — set difference: `originalMap.delete(key)` 누락**. 4 sources outweigh 1 prose, 그러나 spec 단계 E-06 ("재결정" keyword 0건) PASS 통과 후 F-06 implementer 자율 보고 가 사후 catch.
- 본 sub-rule 로 spec writer 가 prose 작성 직후 동일 operation 의 structured form 과 의미 cross-check 의무화.

**처리**: prose ↔ structured form 의미 모순 발견 시 NO. spec writer 가 prose 를 structured form 의미와 동기화 (또는 명시적으로 prose 가 "축약 설명임" disclaimer 추가). C-30 (Spec Truth Table Discipline) 의 prose 의미 영역 확장 — 최종 표 + branch table 외에 JSDoc/narrative prose 도 same-operation 일관성 의무.

**적용 범위**: cascading — 모든 후속 Goal (MOD-GRID-10/G-005 + 다른 Pro 패키지) 의 multi-branch hook spec 에서 동일 패턴 검증.

**★ Return-Type Signature Cross-Check (2026-05-15 MOD-GRID-99-A/G-001 신설)**: prose ↔ structured form 의미 영역에서 **반환 타입 시그니처** (`Promise<X>` vs `Promise<Y>`, `void` vs `T`, sync vs async 등) 도 동일 cross-check 적용. trigger: 동일 함수가 spec 의 prose 영역 (Section 4 scope/Section 5 narrative/JSDoc) 과 executable 영역 (Section 5.3 코드 블록/Section 11 Before-After/types.ts) 양쪽에 시그니처가 등장할 때 발동.

**검증 방법**: 함수 이름 (예: `verifySignature`, `checkLicense`, `setLicenseKey`) 으로 spec grep → 모든 hit 의 반환 타입 시그니처 추출 → set difference 0건 의무. 단일 함수 hit 가 prose 1건 + executable 1건이면 두 시그니처 100% 일치 의무 (param 수/이름/순서/optional 동일 + return type 동일).

**근거 사례 (G-001 spec 2026-05-15)**: Section 4 prose L107 "verifySignature(key: string): Promise<LicenseState> 순수 비동기 헬퍼" vs Section 5.3 executable L306 `export async function verifySignature(rawKey: string): Promise<LicenseStatus>`. 반환 타입 `LicenseState` vs `LicenseStatus` 1:1 불일치 (param 이름 `key` vs `rawKey` 도 차이). 기존 E-06 prose↔structured 룰의 keyword grep ("재결정") 으로는 미검출 — 본 sub-rule 로 사전 차단. Implementer 가 C-30 Truth Table Discipline 따라 Section 5.3 executable 채택 + specCodeDefects[] 자율 보고 → 후속 Goal 에서 spec writer 가 spec 작성 시 동일 함수의 모든 시그니처 영역 동기 갱신 의무.

**적용 범위**: cascading — MOD-GRID-99-A/G-002 (`checkLicense`), MOD-GRID-99-B Docs Goal, 모든 Pro 패키지 hook spec 의 반환 타입 시그니처 검증.

**★ Unused Type Import Cross-Check (2026-05-15 MOD-GRID-99-A/G-001 신설)**: spec 본문 코드 템플릿 (Section 5.3/Section 11 Before-After) 의 `import type { A, B } from '...'` 라인 의 모든 import 항목이 같은 파일 본문에서 1회 이상 사용 의무. monorepo `tsconfig.base.json` `noUnusedLocals: true` strict 환경에서 spec template 그대로 따라 구현하면 컴파일 fail.

**검증 방법**: spec 의 각 코드 블록 import line 추출 → 각 import 항목 (type alias 또는 value identifier) 에 대해 같은 코드 블록 본문에서 grep 1회 이상 hit 의무. 0건 hit 시 NO.

**근거 사례 (G-001 spec 2026-05-15)**: Section 5.3 verifySignature.ts L280 `import type { LicenseState, LicenseStatus } from './types.js'` — 본문에서 `LicenseStatus` 는 반환 타입으로 사용되나 `LicenseState` 는 1회도 사용 안 됨 (LicenseState 는 state.ts 전용). Implementer 가 noUnusedLocals 통과 위해 `LicenseState` import 제거 + specCodeDefects[] 보고 (severity: low). spec writer 가 spec 작성 시 import line 작성 직후 본문 grep 으로 모든 import 항목 사용 확인 의무.

**적용 범위**: cascading — monorepo `noUnusedLocals: true` 또는 `noUnusedParameters: true` 적용 모든 Goal 의 spec 코드 템플릿. 적용 안 함: README/문서 Goal (코드 템플릿 없음).

**근거 사례 (G-001 spec 2026-05-14)**:
- spec.md L383: "internal/buildTableOptions.ts 수정함 (기존 수정 파일 대체) — buildPaginationOptions import 및 mode 처리 통합 — index.ts 대신 이 파일을 2번째 수정 대상으로 변경".
- spec.md L385-393 직후 최종 표: `#5 index.ts MODIFY` 명시. **`buildTableOptions.ts` 행 누락**.
- 두 결정이 정면 모순 (본문은 "index.ts 대신 buildTableOptions.ts", 최종 표는 "index.ts 그대로 + buildTableOptions.ts 누락").
- 1차 Verifier가 G-01(D# 표 ↔ 본문) + E-01(Section 7 ↔ Section 11) 통과 처리. 이유: G-01은 헤더 D# 표 vs 본문이고, E-01은 Section 7 vs Section 11이라서 **Section 7 내부 본문 vs Section 7 최종 표 모순**은 둘 다 커버 못함.
- Implementer가 최종 표(권위)를 따라 buildTableOptions.ts wiring 누락 → loop 1 verify B-03 NO → 1 loop 낭비.
- 본 E-06으로 spec 단계에서 사전 차단. spec writer가 "재결정" 작성 시 직후 최종 표 동기 갱신 의무.

**처리**: 모순 발견 시 spec writer 재호출하여 최종 표를 본문 재결정 결과와 일치하도록 갱신 (또는 본문 재결정 문장을 철회). spec authoritative(C-1, C-27)이므로 둘 중 하나는 반드시 수정.

---

## F: 상용 제품화 (Section 13) (4항목)

### F-01: 패키지 대상 명시 (packages/grid-core vs grid-{pro})
**YES**: Section 13에 정확한 패키지 (예: `packages/grid-tracking` Pro)
**NO**: 패키지 분류 모호

**★ Anchor 유연성 — 명시 위치 대체 (2026-05-15 MOD-GRID-15/G-004 추가)**: spec 본문에 "상용 제품화" 또는 "Section 13" 등 명시적 섹션 헤더가 없어도, 다음 중 **하나 이상**에 패키지명이 명시 + Read 도구로 확인 가능하면 YES:
1. spec header (예: `Migration Impact: low` 인근 라인) 에 `Package: @topgrid/grid-pro-XX` 또는 `packageTarget: packages/grid-pro-XX` 형식으로 명시.
2. spec ADR 참조 본문 (예: "ADR-MOD-GRID-NN-001 참조") + 해당 ADR 의 status/context 에 패키지명 인용.
3. goals.json `packageTarget` 필드 명시 + spec 본문이 goals.json 을 cross-reference (예: "goals.json packageTarget 일치").

**여전히 NO**: 위 3개 anchor 모두 누락 + 본문 어디에도 정확한 패키지명 텍스트가 grep 으로 검출 안 됨. inferable (예: "Pro 패키지" 만 명시 + 구체 이름 누락) 은 NO 유지.

**근거 사례 (G-004 spec 2026-05-15)**: spec header L6 `Migration Impact: low` + goals.json `packageTarget: packages/grid-pro-agg` + Section 13 (체크리스트만) 존재. 본문에 "상용 제품화" 별도 섹션 명시 부재로 F-01 NO 처리 → 95.45 점. 그러나 패키지명은 header + goals.json + ADR 참조에 분명히 존재. 본 anchor 유연성으로 후속 Goal 의 동일 패턴 차단. Storybook story / EULA / verifyOrWarn 검증은 Section 13 체크리스트 형식으로 충분.

### F-02: 라이선스 검증 호출 (Pro 패키지)
**YES**: Pro 패키지인 경우 `configureGridLicense()` 호출 위치 명시
**N/A**: MIT 패키지

**★ SPECIFY vs IMPLEMENT 책임 분리 (2026-05-14 MOD-GRID-10/G-001 추가)**: SPECIFY 단계 = **'구현 위치 + 교체 계획 + AC scope split'** 명시 시 YES (예: `src/index.ts` verifyOrWarn 정의+호출 위치 + stub vs full 분할). 실제 코드 존재·호출 1+ 검증은 IMPLEMENT 단계 책임 (verifier가 Grep 으로 확인). SPECIFY 단계에서 코드 미존재로 NO 처리 금지.

### F-03: 문서 작성 계획 (Docusaurus + Storybook)
**YES**: 문서 페이지 경로 + Storybook story 시나리오 명시
**NO**: 문서 계획 누락

**★ N/A sub-condition — Docusaurus 이연 (2026-05-15 MOD-GRID-15/G-004 추가)**: Docusaurus 문서 페이지가 다른 Goal (예: `MOD-GRID-99-B`) 로 명시적 이연되고 + 해당 이연 결정이 ADR 또는 spec D# 결정 본문에 기록되어 있고 + 본 Goal 의 Storybook story 시나리오가 명시되어 있으면 **Storybook 만 검증으로 YES**. 다음 모두 충족:
1. **이연 결정 ADR/D# 명시**: spec ADR 참조 또는 D# 결정 표에 "Docusaurus 통합 페이지 — MOD-GRID-99-B 이연" (또는 동등) 명시.
2. **Storybook story 시나리오 명시**: spec 본문에 story 이름 + 시나리오 (예: `GroupPanelWithSort — 1200 rows + showGroupPanel + enableGroupSort`) 명시.
3. **이연 사유 명확**: 단순 "추후 결정" 이 아닌 합리적 이유 (예: "G-001~G-005 누적 후 단일 페이지로 통합", "Pro 패키지 release 시점 통합") 명시.

**여전히 NO**: Docusaurus 이연 결정 ADR/D# 미명시, Storybook story 시나리오 누락, 또는 둘 다 누락.

**근거 사례 (G-001/G-002/G-003 spec 2026-05-15)**: 모두 "Docusaurus 페이지 (deferred to MOD-GRID-99-B)" 명시 + Storybook story (`BasicGrouping`, `MultiColumnGrouping`, `AvgAggregation`, `GroupFooterExpand`, `VirtualizedGroupFooter`, `CustomAggregation`) 시나리오 명시로 F-03 YES 처리. G-004 spec 2026-05-15 에서는 Storybook story 만 명시 + Docusaurus 이연 결정 누락으로 F-03 NO → 95.45 점. 본 N/A sub-condition 으로 향후 Goal 의 명시적 이연 패턴 인정.

### F-04: peerDependencies 정책 (C-22)
**YES**: react/tanstack은 peer, optional peer 명시
**NO**: dep과 peer 분리 안 됨

---

## G: TBD/TODO 없음 (1항목)

### G-01: Spec에 TBD/TODO/미정 표현 없음
**YES**: 모든 결정이 명시됨. "추후 결정"은 Section 11 위험 요소에 명시
**NO**: TBD/TODO/미정 표현 존재

**★ 사전 결정 표(D#) ↔ 본문 cross-consistency (2026-05-14 G-004 추가)**: spec 헤더 "★ 사전 결정" 표의 각 D# 행의 수치/이름/카운트가 본문(Section 1~13), AC 표, Section 7 표와 100% 일치해야 한다.

**★ Breakdown 일치 강화 (2026-05-14 G-002 self-review 추가 — v1.0.4)**: D# 행이 합계 카운트(예: "6 파일")만 일치하고 **breakdown 세부**(NEW/MODIFY 분류, 파일 이름 목록, enable 항목명, 패키지명 enumeration)는 본문과 다른 경우도 NO 처리. 검증은 다음 모두 충족:

1. **합계 일치**: D# 명시 총 N개 == 본문/Section 7 표 총 행 수
2. **분류 일치**: D# 명시 NEW/MODIFY 카운트 == 본문 표 NEW/MODIFY 카운트 (예: "NEW 3 + MODIFY 3" vs 본문 "NEW 2 + MODIFY 4" → NO)
3. **항목 이름 일치**: D# enumerate 한 파일/항목 이름이 본문 표·구현 단계 enumerate와 1:1 매칭 (D# 에 있는데 본문 미존재 또는 그 반대 → NO)

**검증 방법**: D# 표의 각 행 본문에서 모든 enumerate 가능한 단위(파일명, 항목명, 카운트)를 추출 후 본문/Section 7/AC 표·구현 단계와 sampling 비교. 합계만 ✅ 인정 금지.

**근거 사례 (G-004 spec 2026-05-14)**: D5 결정 본문 "12 패키지 CHANGELOG.md 초기 생성" (헤더 표) vs 본문/AC-002/Section 7 모두 "13개 패키지" 명시. Implementer가 본문/AC를 우선 따라 13개 구현했으나 D5 표는 spec 내부 모순 그대로 유지됨. spec writer 단계에서 cross-check 의무화로 spec-내부 typo 사전 차단.

**근거 사례 2 (G-002 spec 2026-05-14 — breakdown 강화 트리거)**: D4 헤더 "NEW 3 + MODIFY 3 = 6 파일. NEW: StickyHeader.tsx + computePinnedOffset.ts + ResizeHandle.tsx. MODIFY: Grid.tsx + types.ts + buildTableOptions.ts. (index.ts 무수정)" vs Section 2.4 본문 "별도 StickyHeader 컴포넌트는 만들지 않음 → Section 7 표는 StickyHeader.tsx 행 제거" + Section 7 표 실제 NEW 2 + MODIFY 4 (StickyHeader 미생성, index.ts MODIFY 추가). **합계는 6 파일 일치하지만 breakdown(NEW/MODIFY 카운트, 파일 이름)은 모순**. 1차 Verifier가 G-01 ✅ 통과 처리. Implementer가 본문 권위(C-27)로 정확 구현했으나 spec 내부 모순 잔존. 동일 패턴이 G-001 D5 ("enable* 8종" notation vs 본문 "7 enable* + rowSelection")에서도 발생 — 누적 2건으로 강화 룰 신설 정당화.

**★ Spec D# 결정 ↔ goals.json 데이터 일관성 (2026-05-15 MOD-GRID-10/G-003 신설)**: spec 의 D# (사전 결정) 표 또는 본문 결정이 같은 Goal 의 `goals.json` 데이터(`implementFiles`, `affectedUsageFiles`, `bundleImpact`, `licenseTier`, `packageTarget` 등)와 모순되면 NO. spec writer 는 D# 결정을 작성하면서 `goals.json` 도 **동기적으로 보정**해야 한다 (또는 D# 자체를 goals.json 데이터에 맞춰 조정). 다음 모두 충족:

1. **경로 prefix 일관성**: spec D# 가 "monorepo 외부 경로 채택" (예: `topvel-grid-monorepo/packages/...`) 으로 결정한 경우, goals.json `implementFiles[]` 의 모든 entry prefix 가 동일 (C-28 + ADR-MOD-GRID-00-001 cross-reference).
2. **번들 영향 카운트 일관성**: spec D# 의 예상 번들 변동(+N KB) 이 goals.json `bundleImpact.expected` 와 일치.
3. **변경 파일 수 일관성**: spec D# 가 "N 파일 변경" 명시 시 goals.json `implementFiles` 길이 + `affectedUsageFiles` 길이 합계 = N (또는 spec D# 가 명시한 분류 기준).
4. **패키지 대상 일관성**: spec Section 13 packageTarget + spec D# packageTarget vs goals.json `packageTarget` 동일.

**검증 방법**: spec D# 표의 각 행 본문에서 enumerate 가능한 데이터(경로 prefix, 카운트, 패키지명, KB 수치) 를 추출 후 goals.json 의 해당 필드와 1:1 비교. 불일치 발견 시 spec writer 가 둘 중 어느 쪽을 정정할지 결정 + cross-check 보고.

**근거 사례 (G-003 spec loop 0 2026-05-15)**: 1차 spec D1 결정 = "monorepo prefix 채택 (`topvel-grid-monorepo/packages/grid-pro-tracking/...`)". 그러나 goals.json G-003 `implementFiles[5]` 모든 entry 가 `D:/project/topvel_project/TOMIS/packages/grid-pro-tracking/...` (TOMIS prefix). spec writer 가 D1 결정만 명시 + goals.json 갱신 누락. Coverage Verifier 가 E-01 (Section 7 ↔ Section 11) + E-06 (재결정 일관성) 양쪽에서 spec D1 결정과 goals.json 의 모순을 검출 → 93.1 FAIL. loop 1 에서 goals.json G-003 implementFiles 5개 경로 prefix `topvel-grid-monorepo/packages/`로 일괄 보정 → 100 PASS. 본 가이드로 spec 단계에서 사전 차단 — spec writer 가 D# 결정 작성 직후 goals.json 동기 갱신 의무.

**처리**: spec writer 가 D# 결정과 goals.json 모순 잔존 채로 제출 시 G-01 NO. 자동 보완 가능 case (단순 prefix 일괄 치환 등) 는 spec writer 가 spec submit 직전 goals.json 보정 권장. 후속 모듈 cascading 적용 — 모든 D# 결정에 "goals.json 영향 영역" 메모 의무.

---

## 점수 산출 예시

```
32 항목 중 (A=5 + B=5 + C=5 + D=6 + E=6 + F=4 + G=1):
  YES: 27
  NO: 2
  N/A: 3     ← 분모에서 제외
  denominator: 29   ← YES(27) + NO(2). N/A(3)는 절대 미포함.
  score = 27/29 × 100 = 93.1

  ★ Verifier 자기-검산 (의무):
    - 항목 합계: 27 + 2 + 3 = 32 ✓ (rubric 총 32와 일치)
    - failedChecks 배열에는 NO 2건만 포함. N/A 3건 미포함 ✓

Goal.migrationImpact: medium → threshold 90
→ passed: true (92.9 >= 90)
```

### ★ Verifier 산식 환각 패턴 (실제 사례 — G-002 specify 2026-05-13)

1차 Verifier가 N/A 항목을 분모에 포함하여 점수 부풀림 — 정확 점수 100인 spec을 79.3으로 false-fail 처리.
**검출법**: `score × denominator / 100 == yesCount` 검산. 불일치 시 환각 의심 → 새 Verifier 재호출.

근거 ADR: 본 retrospective; C-26 (Coverage Verifier 산식 자기-검증 의무).

---

## Output JSON 형식

```json
{
  "goalId": "G-NNN",
  "module": "MOD-GRID-XX",
  "area": "{area}",
  "stage": "specify",
  "rubricVersion": "1.0",
  "migrationImpact": "high|medium|low",
  "checks": {
    "A-01": { "result": "YES|NO|N/A", "evidence": "..." },
    ...
    "G-01": { ... }
  },
  "yesCount": N, "noCount": N, "naCount": N, "denominator": N,
  "score": N.N, "threshold": N, "passed": true|false,
  "failedChecks": [...], "feedback": { "X-XX": "구체적 보완 지시" }
}
```
