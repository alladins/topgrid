# Verify Rubric — tw-grid v1.0.7 (21 + F Verifier 메타 게이트 3항목, 5축 가중)

**v1.0.7 변경 사항 (2026-05-27 MOD-GRID-09/16 audit trigger — `[[feedback-tw-grid-spec-goals-sync]]`)**:
- **categoryScores 가중평균 자기-검증 의무 강화** (항목 수 불변): verify 단계는 5축 가중 산식 (`weightedScore = Σᵢ Cᵢ × wᵢ`) 적용. 단순 평균이 아님. diagnose agent 가 카테고리 가중평균 미적용한 산식 (단순 평균) 으로 "점수 부풀림 의심" false positive 발생 차단 의무. 근거 사례: 2026-05-26 MOD-GRID-16/G-001 verify diagnose agent 가 단순 평균 83.3 계산 → 실 weightedScore 95.0 (산식 정당) — false positive. 본 sub-rule 로 verify-rubric C-26 자기-검증 시 산식 형식 (가중평균) 명시 강화.
- **vacuousTruthApplied 명시 의무 강화**: 카테고리 전체 N/A 시 (vacuous truth) categoryScore=100 처리 인 경우 `vacuousTruthApplied` 배열에 카테고리 이름 + 사유 명시 의무. signal 부재 시 audit cycle 에서 "부풀림" false positive 위험.
- **specify/implement 의 yesCount/naCount mechanical 재계산 의무는 verify 비적용** (categoryScores 모델). 단 categoryScores 내부 yesCount/noCount/naCount 는 mechanical 재계산 의무.
- 항목 수 21 + F=3 불변 (C-26 자기-검증 내부 보강).

**v1.0.6 변경 사항 (2026-05-17 R-4 메타 finding — `findings/r-4-rubric-strengthening-spec.md`)**:
- **A 카테고리 actual-execution 항목 5개 신설**: A-04 ~ A-08 (pnpm install 실 실행 + dist artifact 실 존재 + glob/include 정합 + runtime test 실 실행 + stories placeholder vs functional 구분). 항목 수 16 → **21** (A=3 → 8). 가중치 변경 없음 (advisor 권고 — per-item dilute 감수, 별 D-결정 후보로 surface).
- **Vacuous Truth Rule keyword 확장**: A 카테고리 vacuous 금지 키워드에 `storybook`, `playwright`, `visual:test`, `glob`, `stories`, `baseline`, `install`, `runtime`, `test`, `e2e` 추가. R-4 finding 의 MOD-GRID-99-B 같은 docs/visual-regression 인프라 Goal 이 build 키워드 부재로 A vacuous 적법 처리됐을 위험 차단.
- **Coverage Verifier Bash mandate 의무**: A-04 ~ A-07 채점 시 Verifier 가 Bash 도구로 `pnpm install`, `pnpm -r build`, `pnpm test`, `pnpm visual:test` 명령 실 실행 + exit code 인용 의무. 명령 미실행 + spec 인용만으로 채점 시 자기-검산 단계에서 폐기. `agents/coverage-verifier.md` 와 동시 ship 의무.
- **Retroactive 미적용**: v1.0.6 항목 A-04 ~ A-08 는 본 v1.0.6 채택일 (2026-05-17) 이후의 verify 단계에만 적용. Wave 1-5 17 ADRs + MOD-GRID-99-A/B 기존 score 변경 없음. MOD-GRID-99-B/G-002/G-003 score 100 은 그대로 유지하되 ADR 본문에 "v1.0.6 기준이라면 A-04+A-05+A-06 NO 처리 — fail" notation 추가.
- **근거 사례 (R-4)**: MOD-GRID-99-B/G-002 (Storybook 부트스트랩) + G-003 (시각 회귀 인프라) verify-score 100 가 (a) main.ts glob gap 32 파일 미수집 (b) `pnpm install` 미수행 + `@storybook/react` 의존 부재 (c) `tests/visual/__snapshots__/` 부재 + visual:test 미실행 — 3 검출 실패. 본 v1.0.6 강화 적용 시 NO 처리. 상세: `findings/r-4-rubric-strengthening-spec.md`.

**v1.0.5 변경 사항 (2026-05-15 MOD-GRID-17/G-005 self-review)**:
- D-02 추가 sub-bullet: **Cascading Scope-Reduction Deferred Entry Audit Trail 검증 의무**. spec D# 결정이 `affectedUsageFiles[]` 의 일부 entry 를 별도 후속 Goal/모듈로 deferred 처리한 경우 (ADR-MOD-GRID-17-005 Investigative Scope-Reduction Authority 적용) — verify 단계에서 deferred entry 의 audit trail **무손상** 검증 의무. 각 deferred entry path 에 대해 Read + 마이그레이션 대상 식별자 (예: `useReactTable`, `<BaseGrid`, `@topgrid/grid-core`) Grep 으로 원본 패턴 잔존 + 본 Goal 의 마이그레이션 대상 패턴 0 hits 확인. 부분 마이그레이션 (deferred entry 가 본 Goal 범위 밖에서 우발적으로 마이그레이션 되어 있음) 또는 audit trail 손실 (goals.json `affectedUsageFiles[]` 배열 수정) 발견 시 D-02 NO. 근거 사례: G-005 verify-score `patternBDeferredAuditTrail` 필드 (4 Pattern B 페이지 각각 useReactTable 2 hits + BaseGrid 0 hits + @topgrid/grid-core 0 hits) — 무손상 확인 모범 사례.
- 항목 수 16 + F=3 불변 (D-02 내부 보강).

**v1.0.4 변경 사항 (2026-05-15 MOD-GRID-99-A/G-001 harnessReview)**:
- **Vacuous Truth Rule "비-그리드 런타임 카테고리" 명확화** (항목 수 불변): 기존 룰은 카테고리 전체 N/A 시 vacuous=100 처리하되 "build/tsup/tsc/..." 키워드 포함 Goal 의 A 카테고리만 vacuous 금지. **추가 명확화**: 라이선스 런타임 (`grid-license`), 문서 (`apps/docs`), 빌드 도구 설정 등 **비-그리드 컴포넌트 모듈** 의 Goal 은 B (동작: 정렬/필터/페이지/가상화/편집) + C (호환성: 영향 사용처) + D (마이그레이션) 카테고리가 본질적으로 N/A — vacuous 적용 합법 (3 카테고리 모두 100 처리). 근거 사례: MOD-GRID-99-A/G-001 (`setLicenseKey` global API) — B/C/D 모두 본질 N/A (라이선스 검증 런타임은 그리드 동작 무관 + 신규 패키지 사용처 0). 후속 cascading: MOD-GRID-99-A/G-002 (Watermark), MOD-GRID-99-A/G-003 (EULA 통합), MOD-GRID-99-B (Docusaurus 문서) Goal 도 동일 패턴 적용 가능.
- **Non-grid Runtime Module 판정 기준 신설** (verifier 환각 차단): 다음 모두 충족 시 "비-그리드 런타임 모듈" 인정 — B/C/D vacuous 적법:
  1. **Goal 제목/spec Section 1 에 그리드 동작 키워드 부재** — `sort`, `filter`, `pagination`, `virtualization`, `editing`, `column`, `row`, `cell`, `Grid` 컴포넌트 등이 Goal 핵심 산출물의 동사/명사로 등장하지 않음.
  2. **affectedUsageFiles=[]** + spec Section 5/7 에서 패키지 자체 React 의존 없음 명시 (peerDependencies: 없음 또는 React 무관).
  3. **modulePath 가 `packages/grid-license`, `packages/grid-docs`, `apps/docs`, `tooling/*` 등 비-그리드-컴포넌트 디렉토리** 또는 spec 에 명시적으로 "라이선스 런타임 / 문서 / 빌드 도구" 분류 표명.
  세 조건 모두 충족 → B/C/D vacuous 적법. 하나라도 미충족 (예: license Goal 인데 Watermark UI 컴포넌트 포함 시) → 해당 카테고리는 실제 평가 의무 (Watermark Storybook 시각 회귀 등).
- **근거 사례 (G-001 verify 2026-05-15)**: Goal 제목 "setLicenseKey global API + key 알고리즘 결정 ADR" — sort/filter/pagination/virtualization/editing 키워드 부재. affectedUsageFiles=[] + peerDependencies: 없음 명시. modulePath = `packages/grid-license` (비-그리드-컴포넌트). 세 조건 모두 충족 → B/C/D vacuous=100 적법. weightedScore = 100. Verifier evidence 의 `naCategoryHandling` 필드 명시 의무 (현 G-001 verify-score 모범 사례).
- 항목 수 16 + F=3 불변 (Vacuous Truth Rule 내부 보강).

**v1.0.3 변경 사항 (2026-05-14 MOD-GRID-10/G-001 self-review)**:
- F-01 강화: evidence 인용에 worktree-prefix segment 포함 의무. 단순 파일명 (예: `MOD-GRID-10-decisions.md`) 만 인용한 evidence 는 main checkout 과 worktree 경로 sync 불일치 시 환각 위험. cross-reference: constraints.md C-32 (2026-05-14 신설).
- 항목 수 16 불변 (F-01 내부 보강).

**항목 카운트 (총 21)**: A=**8** + B=5 + C=3 + D=2 + E=3 = 21. 메타 게이트 F=3 별도.

- v1.0.5 까지 항목 카운트 16 (A=3). v1.0.6 (2026-05-17 R-4 강화) 에서 A=8 (A-04 ~ A-08 actual-execution 5건 신설).

**점수 계산 (★ Coverage Verifier 산식 자기-검증 의무 — 2026-05-13 추가)**:
- 각 카테고리 내부: YES=1, NO=0, **N/A=분모에서 제외**
- **categoryScore = (해당 카테고리 YES수) / (YES수 + NO수) × 100** — N/A 절대 분모 미포함
- **weightedScore = Σ (categoryScore × weight) / 100** (모든 weight 합 = 100)
- **★ `failedChecks` 배열에는 NO 결과만 포함. N/A 절대 포함 금지.**
- **★ 카테고리별 합계(A+B+C+D+E)가 21과 일치하는지 Verifier가 산출 후 자기-검산 의무 (C-26)** — v1.0.5 까지 16. v1.0.6 (2026-05-17) 에서 21 (A=8 신항목 5건).
- **★ vacuous truth (YES=0, NO=0, N/A≥1) → categoryScore = 100 처리. 단, "build/tsup/tsc/vite/rollup/size-limit/bundle" 키워드 포함 Goal의 A 카테고리는 vacuous 금지.**
- **★ Verifier는 점수 산정 직후 산식 재검산 + N/A 분모 제외 확인 의무. 불일치 시 동일 결과 폐기 후 새 Agent 인스턴스 재호출.**
- **★ JSON 출력 무결성 자기-검증 (2026-05-15 추가)**: Verifier 는 score JSON 을 디스크에 쓰기 직전 `JSON.parse(myOutput)` 자기 호출로 parse 성공 검증 의무. 실패 시 동일 결과 폐기 후 새 Agent 인스턴스로 재호출. evidence 안 따옴표 `\"`, 백슬래시 `\\\\`, 정규식 모두 escape 확인. 근거: 2026-05-14 implement 단계 score 3건 corrupt 발생.

**Threshold (tier별)**: high 95 / medium 90 / low 85

---

## ★ 메타 게이트 (F): Verifier 자기-무결성 — 점수 산정 전 필수 통과

Verifier Agent 자체도 환각할 수 있음. 점수 산정 전 자기-검증:

### F-01: evidence 실재 검증
**YES**: 각 check의 `evidence` 필드가 가리키는 파일·줄번호 sampling 5건 → Read로 확인
**NO**: "evidence가 실제 파일과 불일치: {check id} → '{evidence}'"

**finding 참조 검증 (2026-05-13 추가)**: implement-score 또는 verify-score가 `findings/auto-fixed/` 또는 `findings/blocked/` 하위 파일을 참조하면 **해당 finding 파일이 디스크에 실재**해야 한다. `documentedDeviations[].finding` 경로 sampling 1건 이상 → Read 확인 필수. 미존재 시 F-01 NO.

**외부 디렉토리 evidence (TOMIS git 무관 경로)**: `D:/project/topvel_project/topvel-grid-monorepo/` 등 TOMIS 저장소 외부 경로는 `git diff`로 검증 불가. **Glob 또는 Read로 파일 실재** 확인으로 evidence 대체 가능. ADR-MOD-GRID-00-001 참조.

**★ Worktree-prefix evidence 의무 (2026-05-14 v1.0.3 추가)**: tw-grid 가 git worktree (`.claude/worktrees/<wt>/`) 에서 실행 중이면 — ADR (`decisions/`), spec (`artifacts/`), rubric, constraints, state.json, tracking-goals.json 등 tw-grid artifact 의 evidence 인용에 worktree-prefix segment (예: `.claude/worktrees/tw-grid-auto-G003/.claude/tw-grid/...`) 를 포함한다. 단순 파일명 (예: `MOD-GRID-10-decisions.md L8`) 만 인용한 evidence 는 main checkout 과 worktree 의 artifact sync 불일치 시 환각 위험 — F-01 NO 처리.

**검증 형식 예시 (worktree 환경)**:
```
evidence: ".claude/worktrees/tw-grid-auto-G003/.claude/tw-grid/decisions/MOD-GRID-10-decisions.md L8 ADR-MOD-GRID-10-001 (Read 확인 — 137 lines)"
```

근거: constraints.md C-32 (2026-05-14 신설) — sub-agent worktree path + goalId self-verification. 근거 사례 SR-G001-01 (MOD-GRID-10/G-001 self-review).

**★ 라인 인용 의무 (2026-05-13 G-003 추가 — defensive, specify H-01과 동일 정책)**: Verifier가 F-01을 NO로 거부하려면 spec.md 또는 score JSON의 인용된 라인 번호 + 발췌 텍스트를 evidence에 명시해야 한다. 라인 인용 없는 거부는 **무효** — 동일 결과 폐기, 새 Agent 인스턴스 재호출. specify-rubric.md H-01 라인 인용 의무 섹션과 동일 형식 적용.

### F-02: categoryScores 산식 검증
**YES**: 각 카테고리 점수 = (해당 카테고리 YES수) / (분모) × 100 — 산식 정확, 부풀림 없음
**NO**: "categoryScores {C}={N} 인데 실제 산식 결과 {M}. 재계산 필요"

### F-03: weightedScore 산식 검증
**YES**: weightedScore = Σ(categoryScore × weight) / 100 — 가중 계산 정확
**NO**: "weightedScore {N} vs 산식 계산 {M}. 차이 {Δ}"

**처리**: F 항목 NO → 동일 Verifier 결과 폐기, **새 Agent 인스턴스로 재호출**(독립 검증). 2회 연속 F NO → 사용자 알림 + `/tw-grid diagnose hallucination` 권장.

---

## 5축 가중치 (migrationImpact 차등)

| 축 | high | medium | low | 의미 |
|----|------|--------|-----|------|
| A: 빌드 | 10% | 15% | 25% | tsc + vite build + size-limit |
| B: 동작 | 15% | 20% | 25% | 정렬/필터/페이지/가상화/편집 |
| **C: 호환성** | **40%** | **30%** | 20% | 영향 사용처 무파괴 (high tier 최우선) |
| **D: 마이그레이션** | **25%** | **20%** | 15% | 사용처 N개 중 M개 전환 |
| E: 번들+라이선스 | 10% | 15% | 15% | 크기 + 라이선스 |
| **합계** | 100% | 100% | 100% | |

**categoryScore** = YES수 / (YES수 + NO수) × 100 (N/A 분모 제외)
**weightedScore** = Σ (categoryScore × weight)

### Vacuous Truth Rule (인프라 Goal 대응 — 2026-05-13 추가)

카테고리 전체가 N/A인 경우 (`YES=0, NO=0, N/A≥1`) 산식 `0/0`이 정의되지 않으므로:

- **규칙**: `categoryScore = 100` (vacuous truth) 처리.
- **의무**: F-02 evidence에 `"(category vacuous: 전 항목 N/A — {사유})"` 명시.
- **근거 ADR**: `decisions/MOD-GRID-00-decisions.md` ADR-MOD-GRID-00-002.

**vacuous 적용 금지 조건 (G-002+ build 도구 도입 Goal)**:

다음 키워드가 Goal 제목 또는 spec Section 1에 포함되면 A(빌드) 카테고리는 vacuous 처리 금지 — 실제 빌드 검증 필수:

- (v1.0.5 까지): `build`, `tsup`, `tsc`, `vite`, `rollup`, `size-limit`, `bundle`
- **(v1.0.6 R-4 추가 — 2026-05-17)**: `storybook`, `playwright`, `visual:test`, `glob`, `stories`, `baseline`, `install`, `runtime`, `test`, `e2e`

이 키워드가 있는데 A 카테고리 전 항목이 N/A로 보고되면 **verifier 환각 의심** — 점수 산정 폐기 후 새 Agent로 재호출.

**R-4 추가 키워드 사유**: MOD-GRID-99-B (Storybook 부트스트랩 + 시각 회귀 인프라) Goal 들이 build 키워드 부재로 A vacuous 적법 처리됐을 위험. 인프라 Goal 도 actual-execution (install/build/test/glob 정합) 검증 의무. 본 키워드 매칭 시 A-04 ~ A-08 신 항목들이 N/A 아닌 실 평가 필요.

**예시 (G-001)**: Goal 제목 "pnpm workspace + 13 패키지 + apps/docs 디렉토리 스캐폴딩" → build 키워드 없음 → A vacuous 허용.
**예시 (G-002)**: Goal 제목 "tsup + tsconfig strict + CJS+ESM dual" → `tsup` 키워드 있음 → A vacuous 금지. A-02/A-03 반드시 YES/NO로 평가.

**★ 비-그리드 런타임 모듈 B/C/D vacuous 가이드 (2026-05-15 G-001 추가, 위 v1.0.4 changelog 참조)**:
- **vacuous 적용 적법**: MOD-GRID-99-A (라이선스 런타임), MOD-GRID-99-B (Docusaurus 문서), 빌드 도구 인프라 Goal — 그리드 동작 키워드 부재 + affectedUsageFiles=[] + 비-그리드-컴포넌트 modulePath.
- **vacuous 적용 금지**: 그리드 동작 Goal (정렬/필터/페이지/가상화/편집) 또는 영향 사용처 1개 이상 — 실제 검증 또는 N/A justification 의무 (사용처 미마이그레이션 → C-01 NO 또는 spec ADR 에 이연 결정 명시).
- **Verifier evidence 의무**: vacuous 적용 시 `naCategoryHandling` 필드에 적용 카테고리 + 사유 (예: "B/C/D 전 항목 N/A → categoryScore=100 처리 (0/0 undefined 대응). 비-그리드 런타임 모듈 (라이선스 검증) — 세 조건 모두 충족.") 명시. 환각 의심 방지.

---

## A: 빌드 (8항목)

### A-01: gradlew compileJava 0 errors
**YES**: tw-framework-front 통합 빌드 (tvcom_back 무관 — 통합 검증용)
**N/A**: 그리드 작업이 FE 전용일 때 (대부분 N/A)

### A-02: npx tsc --noEmit 0 errors
**YES**: 패키지 + tw-framework-front 양쪽 tsc 통과
**NO**: 한쪽이라도 에러

### A-03: vite build 또는 tsup build + size-limit
**YES**: 패키지별 빌드 통과 + size-limit 한도 내
**NO**: 빌드 실패 또는 크기 초과

### A-04: pnpm install 실 실행 + 의존 symlink 존재 (2026-05-17 R-4 메타 finding 신설)

**Verifier Bash mandate 의무 항목**. spec 인용만으로 채점 금지.

**YES**: Verifier 가 Bash 도구로 `pnpm install` 또는 `pnpm install --frozen-lockfile` 실 실행 + exit 0 확인. evidence 에 다음 모두 포함:
1. 실행 명령 인용 (예: `pnpm install` at repo root)
2. 종료 코드 0 또는 stdout 마지막 줄 발췌 ("Already up to date", "Done", "Lockfile is up to date" 등)
3. 본 Goal 이 사용하는 핵심 외부 의존 1~3개 (예: `@storybook/react`, `@playwright/test`, `@tanstack/react-table`) 의 symlink 또는 디렉토리 존재 — Glob 도구로 `node_modules/@storybook/react/package.json` 또는 `apps/docs/node_modules/@storybook/react/package.json` hit 확인.

**NO**: install 명령 실행 안 됨 또는 exit ≠ 0 또는 핵심 의존 디렉토리 부재.

**N/A**: 본 Goal 의 spec implementFiles 가 `packages/*` 또는 `apps/docs` 변경 0건 (예: 순수 ADR 작성, decisions 파일만 수정). N/A 시 `naCategoryHandling.A-04` 필드에 "implementFiles 가 node_modules 영향 없음 — install 불필요" 명시 의무.

**근거 사례 (R-4 finding b)**: MOD-GRID-99-B/G-002 verify-score 100 — `pnpm install` 미실행 + `apps/docs/node_modules/@storybook/react` symlink 부재 — `pnpm -F docs build-storybook` 실 실행 시 `Rollup failed to resolve import "@storybook/react/dist/entry-preview.mjs"` (`wave-residual-4-storybook-99b-result.md` §2.2 L99-107). 본 A-04 적용 시 NO 처리 — install 미실행 단계에서 차단.

### A-05: build 산출물 dist artifact 실 존재 (2026-05-17 R-4 메타 finding 신설)

**Verifier Bash mandate 의무 항목**. A-03 의 size-limit/build 통과 확인 외에 산출물 실 생성 별도 검증.

**YES**: Verifier 가 Bash 도구로 `pnpm -r build` 또는 `pnpm -F <pkg> build` (또는 `pnpm -F docs build-storybook`) 실 실행 + exit 0 확인. evidence 에 다음 모두 포함:
1. 실행 명령 인용 + exit code
2. 본 Goal 이 build 산출 변경하는 패키지 1개 이상의 `dist/index.mjs` (또는 `.cjs`, `.js`) Glob hit + 파일 크기 > 0 byte 확인 (Glob 결과 또는 `Get-ChildItem` 출력 인용)
3. Storybook static build 의 경우 — `apps/docs/storybook-static/index.json` 또는 동등 산출 파일 Glob hit + entries 수 발췌 (예: "61 stories indexed").

**NO**: build 실행 실패 또는 dist artifact 미존재. **A-03 (이전 vite/tsup build) 가 PASS 라도 dist 산출 파일 미존재 시 A-05 NO** — build 가 silently skip 됐을 가능성 또는 measurement 도구가 캐시된 산출물 / spec 인용으로 답한 의심 차단.

**N/A**: 본 Goal 이 라이브러리 패키지 또는 Storybook static build 산출 변경 없는 경우 (예: documentation README 추가, ADR 작성 만). `naCategoryHandling.A-05` 필드 명시 의무.

**A-03 와의 구분**: A-03 = size-limit 한도 통과. A-05 = 산출물 실 생성. A-03 가 PASS 라도 A-05 가 dist 누락 발견 시 — build 도구 cache 또는 measurement 환각 의심.

**근거 사례 (R-4 finding b cascade)**: MOD-GRID-99-B/G-003 — `pnpm visual:test` 실행 불가 + Storybook static build 실패 (`apps/docs/storybook-static/` 미생성). 본 A-05 적용 시 NO 처리.

### A-06: config glob/include ↔ 디스크 파일 수 정합 (2026-05-17 R-4 메타 finding 신설)

**YES**: 본 Goal 이 build config (`apps/docs/.storybook/main.ts` stories, `vite.config.ts` build.include, `tsconfig.json` include, ESLint config files 등) 또는 stories 디렉토리 추가/이동/삭제 변경하는 경우 — Verifier 가 다음 모두 확인:
1. **glob 패턴 추출**: 변경된 config 파일 Read 후 glob 패턴 (예: `../../../packages/*/stories/**/*.stories.@(ts|tsx)`) 정확 인용 + 라인 번호 명시.
2. **디스크 매칭 카운트**: Glob 도구로 동일 패턴 적용 + 매칭 파일 수 N 추출.
3. **누락 파일 수**: spec 또는 Goal 이 산출한 stories/components 디렉토리 (예: `packages/*/stories/` + `packages/*/src/__stories__/`) 전체 카운트 M 와 N 비교. M > N 인 경우 — 미수집 파일 수 = M - N. mismatch ≥ 1 시 NO (spec 에 명시적으로 의도 제외 표명 없음).

**NO**: glob mismatch ≥ 1 발견 + spec 본문에 의도 제외 표명 없음. evidence 에 미수집 파일 경로 1~3건 인용.

**N/A**: 본 Goal 이 build config 또는 stories/components 디렉토리 변경 없는 경우 (예: 라이브러리 컴포넌트 내부 리팩토링 만, config 변경 0). `naCategoryHandling.A-06` 필드 명시 의무.

**근거 사례 (R-4 finding a)**: MOD-GRID-99-B/G-002 — `apps/docs/.storybook/main.ts` L12 `stories: ['../../../packages/*/stories/**/*.stories.@(ts|tsx)']` 만 명시. 디스크에는 `packages/*/src/__stories__/*.stories.tsx` 32 파일 + `packages/*/stories/*.stories.tsx` ~13 파일 + `packages/*/src/**/*.stories.tsx` 직속 ~3 파일 존재 → glob 매칭 13, 디스크 53 → mismatch 40 (`wave-residual-4-storybook-99b-spec.md` §1.2 L66-71). 본 A-06 적용 시 NO 처리.

**검증 도구 가이드 (Verifier 에게)**: Glob 도구로 `packages/**/*.stories.@(ts|tsx)` 매칭 후 카운트 vs config glob 매칭 카운트 비교.

### A-07: runtime test 실 실행 (2026-05-17 R-4 메타 finding 신설 — implement A-07 와 symmetric)

**Verifier Bash mandate 의무 항목**.

**YES**: spec Section 7 또는 Goal 이 test 파일 (`*.test.*`, `*.spec.*`, `tests/visual/*.spec.ts` 등) 산출 시 — Verifier 가 Bash 도구로 `pnpm test` 또는 `npx vitest run <path>` 또는 `npx playwright test` 실 실행 + exit 0 확인. evidence 에 다음 모두 포함:
1. 실행 명령 인용
2. 결과 요약: 통과 N건 / 실패 0건 (실패 0이어야 YES)
3. duration 또는 reporter 출력의 마지막 줄 발췌
4. (visual:test 의 경우) baseline PNG 디렉토리 존재 확인 — `tests/visual/__snapshots__/` Glob hit + 파일 수 N 인용.

**NO**: 테스트 파일 명시되어 있으나 실 실행 안 됨, 또는 실행 결과 1건 이상 실패, 또는 baseline 미존재 시 visual:test 가 fail 처리됨에도 evidence 누락.

**N/A**: spec Section 7 에 test 파일 명시 없거나 baseline 미존재 (EC-01) 가 spec 본문에 documented deviation 으로 명시된 경우. EC-01 매핑 명시 의무.

**implement-rubric A-07 와의 관계**: implement A-07 (L309) 는 implement 단계 self-test. verify A-07 는 독립 verifier 의 재실행. 두 단계 모두 PASS 시 test runtime 확정.

**근거 사례 (R-4 finding c)**: MOD-GRID-99-B/G-003 — `pnpm visual:test` 실 실행 미수행 + `tests/visual/__snapshots__/` 부재 (`wave-residual-4-storybook-99b-spec.md` §2.2 L103). 본 A-07 적용 시 NO 처리 또는 N/A + EC-01 deviation 명시 의무.

### A-08: stories placeholder vs functional 구분 (2026-05-17 R-4 메타 finding 신설)

**YES**: 본 Goal 이 Storybook stories 파일 산출 (NEW) 또는 main.ts glob 확장으로 기존 stories 영역을 빌드 대상에 포함하는 경우 — Verifier 가 각 stories 파일을 Read 후 다음 모두 확인:
1. **functional 패턴**: `import type { Meta, StoryObj } from '@storybook/react'` 또는 `import type { Meta } from '@storybook/react'` import 존재 + `const meta: Meta<typeof <Component>> = { ... }` 또는 `meta satisfies Meta<typeof <Component>>` 타입 매칭 명시 + 각 export 가 `StoryObj<typeof <Component>>` 타입 또는 동등 typed export.
2. **placeholder 패턴 검출**: `const meta = { ... } as const;` 또는 `@storybook/react` import 부재 + args ↔ component props mismatch (Read 도구로 component .tsx 파일의 props interface 와 stories args 객체 키 비교) 패턴 1건 이상 발견 시 — 본 Goal 의 spec 본문에 "placeholder 의도" 명시 여부 확인.

**NO**: placeholder 패턴 ≥ 1 발견 + spec 본문에 placeholder 의도 명시 부재. evidence 에 placeholder 파일 경로 + 비교 결과 인용.

**N/A**: 본 Goal 이 stories 파일 산출 없거나 glob 변경 없는 경우. `naCategoryHandling.A-08` 필드 명시 의무.

**검증 형식**: spec 의 stories 산출 약속이 functional (runtime 렌더 가능) 인지 placeholder (typecheck 만) 인지 명확화. typecheck PASS 만으로 runtime PASS 가정 차단.

**근거 사례 (R-4 finding c)**: MOD-GRID-99-B/G-002 — `packages/*/src/__stories__/*.stories.tsx` 32 파일이 placeholder 패턴 (`as const` meta, `@storybook/react` import 부재, args ↔ component props mismatch). main.ts glob 확장 시 빌드 인덱싱에 노출되나 runtime 렌더 미가능 (`wave-residual-4-storybook-99b-result.md` §4.2 L142-147). 본 A-08 적용 시 NO 또는 N/A + spec 의도 명시 의무.

---

## B: 동작 (5항목)

### B-01: 정렬 동작
**YES**: Storybook 또는 영향 사용처에서 정렬 동작 확인 (단일 + 다중)
**NO**: 정렬 깨짐
**N/A**: 정렬 무관 기능 (예: ExcelExport 단독)

### B-02: 필터 동작
**YES**: column filter 동작 확인
**N/A**: 필터 무관

### B-03: 페이지네이션 동작
**YES**: 클라이언트 + 서버 페이지네이션 시나리오 동작
**N/A**: 페이지 무관

### B-04: 가상화 동작 (C-18)
**YES**: 1000행+ 시나리오에서 react-virtual 정상 동작 (스크롤 부드러움)
**N/A**: 가상화 무관 (작은 데이터셋 전용)

### B-05: 인라인 편집 동작
**YES**: EditableGrid 또는 ChangeTrackingGrid 시나리오 동작
**N/A**: 편집 기능 없는 Goal

---

## C: 호환성 ⭐ (high tier 40% 비중) (3항목)

### C-01: 영향 사용처 tsc 0 (마이그레이션 후)
**YES**: 본 Goal에서 마이그레이션한 사용처 모두 tsc 0
**NO**: 1개라도 에러
**N/A**: 사용처 0개

### C-02: 외관 보존 (시각 회귀 — C-17)
**YES**: Storybook + Chromatic 자동 또는 수동 스크린샷 비교 외관 보존
**NO**: 외관 변경 감지 (예외 — Spec에 명시된 의도된 변경)
**N/A**: low tier + 사용처 0

### C-03: console warning 0 + React warning 0
**YES**: 사용처 실행 시 warning 0건 (deprecation warning 제외 — 의도된 것)
**NO**: warning 발생

---

## D: 마이그레이션 진행률 ⭐ (high tier 25% 비중) (2항목)

### D-01: 마이그레이션 비율
**YES**: 본 Goal에서 영향 사용처 중 ≥ 50% 마이그레이션 + 잔여 처리 계획 명시
**NO**: 50% 미만 또는 잔여 계획 누락
**N/A**: 사용처 0개

### D-02: 잔여 사용처 명시 (documented-deviations 또는 다음 Goal)
**YES**: 잔여 사용처가 `findings/documented-deviations/`에 기록되거나 다음 Goal에 명시
**N/A**: 잔여 0건

**★ Cascading Scope-Reduction Deferred Entry Audit Trail 검증 (2026-05-15 MOD-GRID-17/G-005 추가 — v1.0.5)**: spec D# 결정이 `affectedUsageFiles[]` entry 일부를 별도 후속 Goal/모듈로 deferred 처리한 경우 (ADR-MOD-GRID-17-005 Investigative Scope-Reduction Authority 적용) — Verify 단계는 deferred entry 의 **audit trail 무손상** 검증 의무.

**검증 방법**: spec D# 결정 표 또는 Section 1 의 deferred entry path 추출 → 각 entry 에 대해:
1. **원본 패턴 잔존 확인**: Read + 원본 패턴 식별자 (예: Pattern B 의 경우 `useReactTable` + `getCoreRowModel`) Grep → 1 hit 이상 (deferred 가 의도된 패턴 유지).
2. **본 Goal 마이그레이션 대상 0 hits**: `<BaseGrid`, `from '@topgrid/grid-core'`, `from '@topgrid/grid-core/legacy'` 등 본 Goal 변환 대상 식별자 Grep → 0 hits (부분 마이그레이션 미발생).
3. **goals.json 배열 무수정**: goals.json `affectedUsageFiles[]` 배열 entries 가 변경 없음 (audit trail 보존 — ADR-005 권위 우선순위 5).
4. **verify-score `patternBDeferredAuditTrail` (또는 동등) 필드**: deferred entry 별 검증 결과 명시 — Read line + Grep hit count + 무손상 확인 메시지.

**판정 기준**:
- **YES**: 4 조건 모두 충족 — deferred entry 가 원본 패턴 무손상 유지 + 본 Goal 마이그레이션 대상 미적용 + goals.json audit trail 보존 + verify-score `*DeferredAuditTrail` 필드 명시.
- **NO**: 1건 이상 deferred entry 가 부분 마이그레이션 발견 (본 Goal 마이그레이션 대상 1 hits 이상) 또는 goals.json `affectedUsageFiles[]` 배열 수정 (entry 삭제) 발견.

**근거 사례 (G-005 verify 2026-05-15)**: G-005 spec D1 결정 — 5 페이지 (FundStatus + 4 Pattern B) → 1 in-scope + 4 deferred. verify-score JSON 의 `patternBDeferredAuditTrail` 필드 (L163-167) 에 4 페이지 (InsEduc11HistoryPage / DailyAttendancePage / InsEmpl22ContractListPage / AnnualLeaveStatusPage) 각각 `useReactTable` 2 hits (import + call) + `BaseGrid` 0 hits + `@topgrid/grid-core` 0 hits 확인 — 무손상 audit trail. goals.json `affectedUsageFiles[5]` 배열 무수정 (5 entries 보존). 본 sub-bullet 신설로 향후 cascading 케이스 (예: G-005b/MOD-GRID-18 의 4 Pattern B 페이지 마이그레이션 시점) 까지 audit trail 검증 일관 적용.

**적용 범위**: cascading — MOD-GRID-17/G-006 (payroll/admin 일부 deferred 가능) + 후속 사용처 마이그레이션 모듈 (MOD-GRID-18~) 의 verify 단계. ADR-005 scope reduction Goal 의 verify 단계 필수.

---

## E: 번들 + 라이선스 (3항목)

### E-01: 번들 크기 변동 (C-21)
**YES**: gzipped 변동 +N KB가 한도 내 (grid-core 30KB, pro 20KB, 메타 150KB)
**NO**: 한도 초과 (사용자 승인 없이)

### E-02: 새 의존성 ADR (C-20)
**YES**: 새 dep 추가 시 ADR 작성됨 (`decisions/MOD-GRID-XX-decisions.md`)
**N/A**: 새 dep 없음

### E-03: 라이선스 명시 (C-24)
**YES**: 패키지 license 필드 + LICENSE/EULA 파일 + (Pro는) 라이선스 검증 호출
**NO**: 누락
**N/A**: package.json 변경 없는 Goal

---

## 점수 산출 예시 (high tier Goal)

**v1.0.6 예시 (A=8 항목 반영)**:
```
축별 categoryScore:
  A: YES 5 / NO 0 / N/A 3 → 100.0   ← A-01 N/A (FE 전용) + A-04~A-08 중 일부 N/A
  B: YES 3 / NO 0 / N/A 2 → 100.0
  C: YES 2 / NO 1 / N/A 0 → 66.7   ← C-02 외관 변경 감지
  D: YES 2 / NO 0 / N/A 0 → 100.0
  E: YES 3 / NO 0 / N/A 0 → 100.0

high tier 가중치:
  weightedScore =
    100.0 × 0.10 +     // A 10%
    100.0 × 0.15 +     // B 15%
     66.7 × 0.40 +     // C 40%
    100.0 × 0.25 +     // D 25%
    100.0 × 0.10       // E 10%
    = 10 + 15 + 26.68 + 25 + 10 = 86.68

threshold 95 → passed: false (86.68 < 95) → 재시도

★ Verifier 자기-검산 (의무):
  - 항목 합계: 5+0+3 + 3+0+2 + 2+1+0 + 2+0+0 + 3+0+0 = 21 ✓ (rubric 총 21과 일치)
  - failedChecks 배열에는 NO 1건 (C-02) 만 포함. N/A 5건 미포함 ✓
```

**v1.0.6 R-4 actual-execution NO 예시 (MOD-GRID-99-B/G-002 retro)**:
```
A: YES 2 (A-02/A-03) / NO 3 (A-04/A-05/A-06) / N/A 3 (A-01/A-07/A-08)
  → categoryScore = 2 / (2+3) × 100 = 40.0

high tier 가중치:
  A 40.0 × 0.10 = 4.0
  (B/C/D/E vacuous 적법 — 비-그리드 런타임 모듈 라이선스/문서 규칙 적용 가능)
  weightedScore = 4.0 + (B/C/D/E 가중 합 — 카테고리에 따라 변동)

R-4 실 사례 적용 시 — A 카테고리 40 점으로 weightedScore 대폭 하락.
단 retroactive 미적용 — 본 v1.0.6 채택일 이전 score 100 그대로 유지.
```

C(호환성) 한 축이 떨어지면 high tier에서 점수 크게 하락 — 호환성 critical 강조.

---

### ★ Verifier 산식 환각 패턴 (실제 사례 — G-002 specify 2026-05-13)

1차 Verifier가 N/A 항목을 분모에 포함하여 점수 부풀림 — 정확 점수 100인 spec을 79.3으로 false-fail 처리.

**자기-검산 의무**:
- 각 카테고리 `categoryScore × (YES+NO) / 100 == YES` 검산.
- `weightedScore == Σ(categoryScore × weight) / 100` 검산 (가중치 합 = 100 확인).
- `failedChecks`에 NO만 포함 (N/A 절대 미포함) 확인.
- 불일치 시 동일 결과 폐기, 새 Verifier Agent 인스턴스로 재호출.

근거: C-26 (Coverage Verifier 산식 자기-검증 의무).

---

## Output JSON 형식

```json
{
  "goalId": "G-NNN",
  "module": "MOD-GRID-XX",
  "area": "{area}",
  "stage": "verify",
  "rubricVersion": "1.0",
  "migrationImpact": "high|medium|low",
  "thresholds": { "high": 95, "medium": 90, "low": 85 },
  "weights": { "A": 10, "B": 15, "C": 40, "D": 25, "E": 10 },
  "categoryScores": { "A": 100.0, "B": 100.0, "C": 66.7, "D": 100.0, "E": 100.0 },
  "checks": {
    "A-01": { "result": "YES|NO|N/A", "evidence": "..." },
    "A-04": { "result": "YES", "evidence": "pnpm install at repo root, exit 0, stdout: 'Already up to date'. apps/docs/node_modules/@storybook/react/package.json Glob hit." },
    "A-05": { "result": "YES", "evidence": "pnpm -F docs build-storybook exit 0. apps/docs/storybook-static/index.json Glob hit, 61 entries." },
    "A-06": { "result": "YES", "evidence": "apps/docs/.storybook/main.ts L12 glob '../../../packages/*/stories/**/*.stories.@(ts|tsx)' + L13 '../../../packages/*/src/__stories__/**/*.stories.@(ts|tsx)'. Glob count 53 = disk count 53. mismatch 0." },
    "A-07": { "result": "YES", "evidence": "pnpm visual:test exit 0. duration 4m32s. tests/visual/__snapshots__/ 61 PNG files." },
    "A-08": { "result": "YES", "evidence": "8 신 stories Read: 모두 'import type { Meta } from @storybook/react' + 'meta satisfies Meta<...>' typed. placeholder 패턴 0건." },
    "E-03": { ... }
  },
  "naCategoryHandling": {
    "A-04": "implementFiles 가 node_modules 영향 없음 — install 불필요 (순수 ADR 작성)",
    "A-08": "본 Goal 이 stories 파일 산출 없음"
  },
  "weightedScore": 86.7,
  "threshold": 95,
  "passed": false,
  "failedChecks": ["C-02"],
  "feedback": {
    "C-02": "영향 사용처 ApprovalInboxPage 외관 변경 감지 — 행 높이 차이. ChangeTrackingGrid 마이그레이션 시 rowHeight prop 보존 필요"
  },
  "buildStatus": { "tsc": "PASS", "viteBuild": "PASS", "sizeLimit": "PASS" },
  "migrationStatus": {
    "totalAffected": 5,
    "migrated": 3,
    "remaining": ["src/pages/X.tsx", "src/pages/Y.tsx"],
    "rate": 0.6
  }
}
```
