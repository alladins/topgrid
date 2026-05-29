# R-4 verifier rubric 강화 Spec — actual-execution 검증 항목 추가

**작성일**: 2026-05-17
**작성자**: tw-grid spec writer (agent)
**Goal**: R-4 메타 finding (MOD-GRID-99-B G-002/G-003 score 100 ≠ 디스크 실태) 해소를 위한 `verify-rubric.md` 강화 + `coverage-verifier.md` 권한 확장.
**입력**:
- `findings/wave-residual-4-storybook-99b-spec.md` §7.1 R-4 + §9.1 #2
- `findings/wave-residual-4-storybook-99b-result.md` §5
- `rubric/verify-rubric.md` (16 + F=3 항목, v1.0.5)
- `rubric/implement-rubric.md` (24 + F=6 항목, v1.0.13)
- `rubric/specify-rubric.md` (참조)
- `agents/coverage-verifier.md` (haiku 모델)
**상태**: spec — 본 문서는 rubric/agent 수정의 마스터 플랜. 실제 디스크 edit 은 본 spec 작성 직후 동일 cycle 에서 수행.
**범위**: read + 다음 4 파일 수정:
- `rubric/verify-rubric.md` (A 카테고리 확장 + vacuous keyword 확장 + 버전 업)
- `agents/coverage-verifier.md` (actual-execution Bash mandate + 모델 가이드)
- `decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` (amendment append — ADR-001 / ADR-002 / 또는 새 amendment 절)
- `.claude/tw-grid/findings/r-4-rubric-strengthening-spec.md` (본 spec)

---

## 1. R-4 finding 인용 + rubric 매핑

### 1.1 잔존 4 (residual-4) spec writer 의 R-4 finding 원문 인용

`wave-residual-4-storybook-99b-spec.md` §7.1 R-4 (L290):

> R-4: G-002 / G-003 의 `score: 100` 가 실 빌드 검증 없이 부여됐을 가능성 — rubric 신뢰도 손상 (별 작업). 완화: 본 spec §2 의 디스크 검증 결과 finding 으로 별도 기록 — verifier rubric AC-005 ("pnpm build-storybook 0 error") 가 미검증임을 인지.

`wave-residual-4-storybook-99b-result.md` §5 (L165-179) 재확인:

> spec §7.1 R-4 + §9.1 #2 식별: G-002 / G-003 의 verifier `score: 100` 가 다음 결함을 검출하지 못했다.
> 1. **main.ts glob gap** (§1.2): `packages/*/src/__stories__/*.stories.*` (~32 파일) 가 glob 미매칭. 본 cycle Phase 1 에서 해소.
> 2. **pnpm install 미수행**: `apps/docs/node_modules` 의 `@storybook/react` 직접 symlink 부재 (Phase 6 실패 원인).
> 3. **typecheck 외 영역**: `src/__stories__/` 32 파일의 placeholder 패턴은 typecheck PASS 하나 runtime 검증 미실시.

### 1.2 3 검출 실패의 rubric 매핑 (current v1.0.5)

| R-4 검출 실패 | 현재 rubric 의 어느 항목이 검증했어야 하나? | 현재 항목 한계 |
|---|---|---|
| **(a) main.ts glob gap** — `packages/*/src/__stories__/*` 32 파일 미수집 | **A-03** (`vite build 또는 tsup build + size-limit`) 가 가장 가까운 후보. 그러나 본 항목은 "패키지별 빌드 통과 + size-limit 한도 내" 만 검증 — Storybook config 의 glob 정확성은 범위 외. | A-03 는 패키지 라이브러리 빌드만. apps/docs Storybook config 의 stories include glob ↔ 디스크 파일 수 정합 검증 항목 부재. |
| **(b) pnpm install 미수행** | **A-02** (`npx tsc --noEmit 0 errors`) + **A-03** (vite build) — 정상적으로 실행됐다면 install 의존 fail 로 NO 처리됐어야 함. 그러나 verifier 가 명령 자체를 실행하지 않고 spec 인용만 한 경우 검출 불가. | A-02/A-03 의 evidence 가 "tsc/build 명령 실 실행 결과" 가 아닌 "spec 의 build 약속 인용" 으로 채워질 때 false-pass 발생. **actual-execution 의무 부재**. |
| **(c) `src/__stories__/` placeholder 패턴 runtime 미검증** | **B-01 ~ B-05** (정렬/필터/페이지/가상화/편집) 가 Storybook 시나리오 동작 명시. 그러나 본 항목들은 영향 사용처에 한정 + Storybook stories 자체의 runtime 렌더 가능성은 명시 부재. | Stories 파일이 placeholder 패턴 (`as const` meta, args ↔ component props mismatch) 인지 runtime 렌더 가능한지 구분 부재. typecheck PASS = runtime PASS 가정 오류. |

### 1.3 근본 원인 — Verifier Agent 권한/모델 한계

현재 `coverage-verifier.md` 는 **haiku 모델, "루브릭 체크리스트는 grep·패턴 매칭 전용 기계적 작업"** 으로 명시. **Bash 도구 사용 명령 (pnpm install, pnpm build, pnpm test 등) 실행 의무 부재**. R-4 의 3 finding 모두 **명령 실 실행 없이 spec 인용 + 디스크 grep 만으로 채점** 한 결과. 본 cycle 의 rubric 강화는 **반드시 Verifier Agent 권한 확장 (Bash mandate + 필요 시 모델 상향)** 과 함께 ship 해야 함 — 그렇지 않으면 동일 환각이 새 필드명으로 재발한다 (advisor 자문 §2).

---

## 2. 현 verify-rubric.md 구조 분석 (v1.0.5)

### 2.1 카테고리 + 가중치

| 축 | high | medium | low | 항목 수 |
|----|------|--------|-----|--------|
| A: 빌드 | 10% | 15% | 25% | 3 (A-01/A-02/A-03) |
| B: 동작 | 15% | 20% | 25% | 5 (B-01~B-05) |
| C: 호환성 ⭐ | 40% | 30% | 20% | 3 (C-01~C-03) |
| D: 마이그레이션 ⭐ | 25% | 20% | 15% | 2 (D-01/D-02) |
| E: 번들+라이선스 | 10% | 15% | 15% | 3 (E-01~E-03) |
| **합계** | 100% | 100% | 100% | **16** |
| F: 메타 게이트 | (개별 게이트) | | | 3 (F-01~F-03) |

### 2.2 현 A 카테고리 항목 (L112-124)

- **A-01**: `gradlew compileJava 0 errors` — N/A 대다수 (그리드 FE 전용).
- **A-02**: `npx tsc --noEmit 0 errors` — 패키지 + tw-framework-front 양쪽.
- **A-03**: `vite build 또는 tsup build + size-limit` — 패키지별 빌드 통과.

### 2.3 Vacuous Truth Rule 의 build 키워드 보호 목록 (L98)

> 다음 키워드가 Goal 제목 또는 spec Section 1에 포함되면 A(빌드) 카테고리는 vacuous 처리 금지 — 실제 빌드 검증 필수: `build`, `tsup`, `tsc`, `vite`, `rollup`, `size-limit`, `bundle`

**한계**: Storybook / Playwright / visual:test / stories / glob / baseline 키워드 부재 — MOD-GRID-99-B 같은 docs/visual-regression 인프라 Goal 이 build 키워드 없이 A vacuous=100 적법 처리될 위험.

### 2.4 implement-rubric 과의 정합

implement-rubric (v1.0.13) 는 이미 **A-07: Test Runtime Execution Check** (vitest run + exit 0 확인) 보유 (L309-326). verify-rubric 에는 **runtime test 실행 검증 항목 부재** — implement 단계 의 자체 self-fix 시점에는 검증되나, verify 단계 의 독립 verifier 가 재검증할 항목이 없음. 비대칭.

implement-rubric A-06 (Functional Wire-up Check, L293-307) — verify 의 D-02 cascading audit trail 검증으로 transitively cover. 별도 verify 신설 불필요.

---

## 3. 강화 옵션 분석 + 권고

### 3.1 옵션 R-A: 새 카테고리 F (actual-execution) 신설 — **반려**

**반려 사유**: 현 verify-rubric 의 F 슬롯은 **메타 게이트 (Verifier 자기-무결성)** 로 이미 사용 중 (L37-69). 신 카테고리 F 신설 시 명명 충돌 + 가중치 재분배 필요.

### 3.2 옵션 R-B: 기존 A (빌드) 카테고리 확장 — **권고 (advisor §1 일치)**

- A 카테고리 3 → 6 (A-01 ~ A-06 추가) 또는 7 (A-04 ~ A-07 추가).
- A 자체가 "build/tsc/size-limit" 주제 — actual-execution 검증 의미적 fit.
- 카테고리 별 가중치 변경 없이 항목만 늘림 — 기존 ADR 대비 가중 변동 최소.
- **위험**: 카테고리 내 항목 수 증가로 단일 항목 영향력 dilute (10% / 6항목 ≈ 1.67% per item at high tier). 단 advisor §4 — 가중치 재분배는 별 D-결정 권고.

### 3.3 옵션 R-C: 카테고리 별 분산 — **반려**

- A (A-N glob 매칭) + B (B-N test 실 실행) + C (C-N artifact) 등 분산.
- 분산 시 카테고리 간 의존성 명확하지 않음 (예: install 실행 = A 의무인데 test 실행 = C 라면 install 미실행이 어디서 검출되는지 모호).
- 응집도 ↓.

### 3.4 권고: **R-B 채택**. 5 신 항목 (A-04 ~ A-08) 추가.

| 신 항목 | 명칭 | R-4 finding 매핑 | actual-execution 의무 |
|---|---|---|---|
| **A-04** | `pnpm install` 실 실행 + 의존 symlink 검증 | (b) install 미수행 | Bash `pnpm install` exit 0 + 핵심 의존 (`@storybook/react`, `@playwright/test`) symlink Read 또는 Glob 확인 |
| **A-05** | build 산출물 (dist artifact) 실 존재 | (b) build 미수행 cascade | Bash `pnpm -r build` (또는 `pnpm -F <pkg> build`) exit 0 + `dist/index.mjs` Glob hit + size > 0 byte |
| **A-06** | config glob/include 정합 — config glob 매칭 파일 수 vs 디스크 파일 수 | (a) main.ts glob gap | Storybook main.ts / vite config / tsconfig include glob 추출 → 디스크 Glob (`Glob` 도구) 카운트 와 매칭. mismatch ≥ 1 시 NO |
| **A-07** | runtime test 실 실행 | implement-rubric A-07 와 symmetric | Bash `pnpm test` 또는 `playwright test` 또는 `vitest run` exit 0 + duration 인용 + baseline PNG 존재 (visual:test 의 경우) |
| **A-08** | stories placeholder vs functional 구분 | (c) placeholder runtime 미검증 | spec 또는 Goal 이 stories 파일을 산출하는 경우 — 각 stories 파일 Read 후 `import type { Meta } from '@storybook/react'` import 존재 + `meta = { ... } satisfies Meta<...>` 또는 동등 typed meta 확인. placeholder (`as const` 만, `@storybook/react` import 부재, args ↔ component props mismatch) 패턴 1건 이상 발견 시 NO 또는 N/A justification 의무 |

**항목 수**: 16 + 5 = **21**. F 메타 게이트 3 별도 (불변).

### 3.5 신 항목 N/A 정책

- **A-04 (install)**: 본 Goal 이 `packages/*` 또는 `apps/docs` 변경 0건 + spec implementFiles 가 순수 ADR / decisions 파일 변경 만일 경우 N/A 적법. 그 외 N/A 부적합.
- **A-05 (dist artifact)**: 본 Goal 이 라이브러리 패키지 build 산출 변경 없는 경우 (예: docs README 추가, ADR 작성 만) N/A.
- **A-06 (glob 정합)**: 본 Goal 이 build config (main.ts, vite.config.ts, tsconfig.json `include`) 또는 stories 디렉토리 1개 이상 추가/이동/삭제 변경 없는 경우 N/A.
- **A-07 (runtime test)**: spec Section 7 에 test 파일 명시 없거나 baseline 미존재 환경 (EC-01) 의 경우 N/A. 단 EC-01 명시 + documented deviation 처리 의무.
- **A-08 (stories quality)**: spec Section 7 에 stories 파일 산출 없는 경우 N/A.

---

## 4. 신 항목 명세 (rubric 본문 작성용)

### 4.1 A-04: pnpm install 실 실행 + 의존 symlink 검증

```
### A-04: pnpm install 실 실행 + 의존 symlink 존재 (2026-05-17 R-4 메타 finding 신설)
**YES**: Verifier 가 Bash 도구로 `pnpm install` 또는 `pnpm install --frozen-lockfile` 실 실행 + exit 0 확인. evidence 에 다음 모두 포함:
  1. 실행 명령 인용 (예: `pnpm install` at repo root)
  2. 종료 코드 0 또는 stdout 마지막 줄 ("Already up to date" 또는 "Done" 등) 발췌
  3. 본 Goal 이 사용하는 핵심 외부 의존 1~3개 (예: `@storybook/react`, `@playwright/test`, `@tanstack/react-table`) 의 symlink 또는 디렉토리 존재 — Glob 도구로 `node_modules/@storybook/react/package.json` 또는 `apps/docs/node_modules/@storybook/react/package.json` hit 확인.
**NO**: install 명령 실행 안 됨 또는 exit ≠ 0 또는 핵심 의존 디렉토리 부재.
**N/A**: 본 Goal 의 spec implementFiles 가 `packages/*` 또는 `apps/docs` 변경 0건 (예: 순수 ADR 작성, decisions 파일만 수정). N/A 시 `naCategoryHandling.A-04` 필드에 "implementFiles 가 node_modules 영향 없음 — install 불필요" 명시 의무.

**근거 사례 (R-4 finding b)**: MOD-GRID-99-B/G-002 verify-score 100 — `pnpm install` 미실행 + `apps/docs/node_modules/@storybook/react` symlink 부재 — `pnpm -F docs build-storybook` 실 실행 시 `Rollup failed to resolve import "@storybook/react/dist/entry-preview.mjs"` (`wave-residual-4-storybook-99b-result.md` §2.2 L99-107). 본 A-04 적용 시 NO 처리 — install 미실행 단계에서 차단.
```

### 4.2 A-05: build 산출물 실 존재

```
### A-05: build 산출물 dist artifact 실 존재 (2026-05-17 R-4 메타 finding 신설)
**YES**: Verifier 가 Bash 도구로 `pnpm -r build` 또는 `pnpm -F <pkg> build` 실 실행 + exit 0 확인. evidence 에 다음 모두 포함:
  1. 실행 명령 인용 + exit code
  2. 본 Goal 이 build 산출 변경하는 패키지 1개 이상의 `dist/index.mjs` (또는 `.cjs`, `.js`) Glob hit + 파일 크기 > 0 byte 확인 (Glob 결과)
  3. Storybook static build 의 경우 — `apps/docs/storybook-static/index.json` 또는 동등 산출 파일 Glob hit + entries 수 발췌 (예: "61 stories indexed").
**NO**: build 실행 실패 또는 dist artifact 미존재. A-03 (이전 vite/tsup build) 가 PASS 라도 dist 산출 파일 미존재 시 A-05 NO — build 가 silently skip 됐을 가능성 차단.
**N/A**: 본 Goal 이 라이브러리 패키지 또는 Storybook static build 산출 변경 없는 경우 (예: documentation README 추가, ADR 작성 만). `naCategoryHandling.A-05` 필드 명시 의무.

**A-03 와의 구분**: A-03 는 size-limit 한도 검증 중심. A-05 는 산출물 실 생성 여부. A-03 가 PASS 라도 A-05 가 dist 누락 발견 시 — measurement 도구가 캐시된 산출물 또는 spec 인용으로 답한 의심. 두 항목 모두 YES 시 build 실 실행 확정.

**근거 사례 (R-4 finding b cascade)**: MOD-GRID-99-B/G-003 — `pnpm visual:test` 실행 불가 + Storybook static build 실패 (`apps/docs/storybook-static/` 미생성). 본 A-05 적용 시 NO 처리.
```

### 4.3 A-06: config glob/include 정합

```
### A-06: config glob/include ↔ 디스크 파일 수 정합 (2026-05-17 R-4 메타 finding 신설)
**YES**: 본 Goal 이 build config (`apps/docs/.storybook/main.ts` stories, `vite.config.ts` build.include, `tsconfig.json` include, ESLint config files 등) 또는 stories 디렉토리 추가/이동/삭제 변경하는 경우 — Verifier 가 다음 모두 확인:
  1. **glob 패턴 추출**: 변경된 config 파일 Read 후 glob 패턴 (예: `../../../packages/*/stories/**/*.stories.@(ts|tsx)`) 정확 인용 + 라인 번호 명시.
  2. **디스크 매칭 카운트**: Glob 도구로 동일 패턴 적용 + 매칭 파일 수 N 추출.
  3. **누락 파일 수**: spec 또는 Goal 이 산출한 stories/components 디렉토리 (예: `packages/*/stories/` + `packages/*/src/__stories__/`) 전체 카운트 M 와 N 비교. M > N 인 경우 — 미수집 파일 수 = M - N. mismatch ≥ 1 시 NO (spec 에 명시적으로 의도 제외 명시되지 않는 한).
**NO**: glob mismatch ≥ 1 발견 + spec 본문에 의도 제외 표명 없음. evidence 에 미수집 파일 경로 1~3건 인용.
**N/A**: 본 Goal 이 build config 또는 stories/components 디렉토리 변경 없는 경우 (예: 라이브러리 컴포넌트 내부 리팩토링 만, config 변경 0). `naCategoryHandling.A-06` 필드 명시 의무.

**근거 사례 (R-4 finding a)**: MOD-GRID-99-B/G-002 — `apps/docs/.storybook/main.ts` L12 `stories: ['../../../packages/*/stories/**/*.stories.@(ts|tsx)']` 만 명시. 디스크에는 `packages/*/src/__stories__/*.stories.tsx` 32 파일 + `packages/*/stories/*.stories.tsx` ~13 파일 + `packages/*/src/**/*.stories.tsx` 직속 ~3 파일 존재 → glob 매칭 13, 디스크 53 → mismatch 40 (`wave-residual-4-storybook-99b-spec.md` §1.2 L66-71). 본 A-06 적용 시 NO 처리.

**검증 도구 가이드 (Verifier 에게)**: Bash 도구로 `find packages/ -name "*.stories.tsx" -o -name "*.stories.ts" | wc -l` (Linux) 또는 Glob 도구로 `packages/**/*.stories.@(ts|tsx)` 매칭 후 카운트.
```

### 4.4 A-07: runtime test 실 실행

```
### A-07: runtime test 실 실행 (2026-05-17 R-4 메타 finding 신설 — implement A-07 와 symmetric)
**YES**: spec Section 7 또는 Goal 이 test 파일 (`*.test.*`, `*.spec.*`, `tests/visual/*.spec.ts` 등) 산출 시 — Verifier 가 Bash 도구로 `pnpm test` 또는 `npx vitest run <path>` 또는 `npx playwright test` 실 실행 + exit 0 확인. evidence 에 다음 모두 포함:
  1. 실행 명령 인용
  2. 결과 요약: 통과 N건 / 실패 0건 (실패 0이어야 YES)
  3. duration 또는 reporter 출력의 마지막 줄 발췌
  4. (visual:test 의 경우) baseline PNG 디렉토리 존재 확인 — `tests/visual/__snapshots__/` Glob hit + 파일 수 N 인용.
**NO**: 테스트 파일 명시되어 있으나 실 실행 안 됨, 또는 실행 결과 1건 이상 실패, 또는 baseline 미존재 시 visual:test 가 fail 처리됨에도 evidence 누락.
**N/A**: spec Section 7 에 test 파일 명시 없거나 baseline 미존재 (EC-01) 가 spec 본문에 documented deviation 으로 명시된 경우. EC-01 매핑 명시 의무.

**implement-rubric A-07 와의 관계**: implement A-07 (L309) 는 implement 단계 self-test. verify A-07 는 독립 verifier 의 재실행. 두 단계 모두 PASS 시 test runtime 확정.

**근거 사례 (R-4 finding c)**: MOD-GRID-99-B/G-003 — `pnpm visual:test` 실 실행 미수행 + `tests/visual/__snapshots__/` 부재 (`wave-residual-4-storybook-99b-spec.md` §2.2 L103). 본 A-07 적용 시 NO 처리 또는 N/A + EC-01 deviation 명시 의무.
```

### 4.5 A-08: stories placeholder vs functional 구분

```
### A-08: stories placeholder vs functional 구분 (2026-05-17 R-4 메타 finding 신설)
**YES**: 본 Goal 이 Storybook stories 파일 산출 (NEW) 또는 main.ts glob 확장으로 기존 stories 영역을 빌드 대상에 포함하는 경우 — Verifier 가 각 stories 파일을 Read 후 다음 모두 확인:
  1. **functional 패턴**: `import type { Meta, StoryObj } from '@storybook/react'` 또는 `import type { Meta } from '@storybook/react'` import 존재 + `const meta: Meta<typeof <Component>> = { ... }` 또는 `meta satisfies Meta<typeof <Component>>` 타입 매칭 명시 + 각 export 가 `StoryObj<typeof <Component>>` 타입 또는 동등 typed export.
  2. **placeholder 패턴 검출**: `const meta = { ... } as const;` 또는 `@storybook/react` import 부재 + args ↔ component props mismatch (Read 도구로 component .tsx 파일의 props interface 와 stories args 객체 키 비교) 패턴 1건 이상 발견 시 — 본 Goal 의 spec 본문에 "placeholder 의도" 명시 여부 확인.
**NO**: placeholder 패턴 ≥ 1 발견 + spec 본문에 placeholder 의도 명시 부재. evidence 에 placeholder 파일 경로 + 비교 결과 인용.
**N/A**: 본 Goal 이 stories 파일 산출 없거나 glob 변경 없는 경우. `naCategoryHandling.A-08` 필드 명시 의무.

**검증 형식**: spec 의 stories 산출 약속이 functional (runtime 렌더 가능) 인지 placeholder (typecheck 만) 인지 명확화. typecheck PASS 만으로 runtime PASS 가정 차단.

**근거 사례 (R-4 finding c)**: MOD-GRID-99-B/G-002 — `packages/*/src/__stories__/*.stories.tsx` 32 파일이 placeholder 패턴 (`as const` meta, `@storybook/react` import 부재, args ↔ component props mismatch). main.ts glob 확장 시 빌드 인덱싱에 노출되나 runtime 렌더 미가능 (`wave-residual-4-storybook-99b-result.md` §4.2 L142-147). 본 A-08 적용 시 NO 또는 N/A + spec 의도 명시 의무.
```

### 4.6 Vacuous Truth Rule 키워드 확장

기존 (L98):
```
다음 키워드가 Goal 제목 또는 spec Section 1에 포함되면 A(빌드) 카테고리는 vacuous 처리 금지 — 실제 빌드 검증 필수:
- `build`, `tsup`, `tsc`, `vite`, `rollup`, `size-limit`, `bundle`
```

신 (v1.0.6):
```
다음 키워드가 Goal 제목 또는 spec Section 1에 포함되면 A(빌드) 카테고리는 vacuous 처리 금지 — 실제 빌드 검증 필수:
- `build`, `tsup`, `tsc`, `vite`, `rollup`, `size-limit`, `bundle`,
- (R-4 추가 — 2026-05-17): `storybook`, `playwright`, `visual:test`, `glob`, `stories`, `baseline`, `install`, `runtime`, `test`, `e2e`
```

근거: MOD-GRID-99-B 가 storybook/playwright/visual 인프라 Goal 임에도 build 키워드 부재로 A vacuous 적법 처리됐을 위험. 본 키워드 확장으로 차후 docs/test 인프라 Goal 의 A vacuous 차단.

### 4.7 항목 수 + 카테고리 합계 갱신

| 축 | high | medium | low | 항목 수 (v1.0.5) | 항목 수 (v1.0.6) |
|----|------|--------|-----|---|---|
| A: 빌드 | 10% | 15% | 25% | 3 | **8** (+5) |
| B: 동작 | 15% | 20% | 25% | 5 | 5 |
| C: 호환성 ⭐ | 40% | 30% | 20% | 3 | 3 |
| D: 마이그레이션 ⭐ | 25% | 20% | 15% | 2 | 2 |
| E: 번들+라이선스 | 10% | 15% | 15% | 3 | 3 |
| **합계** | 100% | 100% | 100% | **16** | **21** |
| F: 메타 게이트 | - | | | 3 | 3 |

**가중치 변경 없음** (advisor §4 — 자동 bumping 금지. 별 D-결정 후보로 surface). A 카테고리 항목 dilution: high tier 10% / 8 항목 = 1.25% per item (기존 10% / 3 = 3.33% → 1.25%). 각 항목 영향력 감소되나 카테고리 전체 가중치 유지 — 의미 fit.

---

## 5. specify/implement rubric 정합 영향

### 5.1 specify-rubric 권고 (cycle 외 — 단 1줄 추가 권장)

specify-rubric (현 v1.x.x) 에 다음 의무 추가 권고:
```
spec 작성 시 Section 9 acceptance criteria 가 actual-execution touchpoint (install / build / dist artifact / runtime test / glob 정합) 를 enumerate 의무. 각 AC 가 어떤 verify-rubric A 항목 (A-04 ~ A-08) 에 매핑되는지 명시.
```

**본 cycle 적용 권고**: optional. scope creep 차단 우선. 별 spec-discipline cycle 에서 처리.

### 5.2 implement-rubric 과의 일관성

- implement A-07 (Test Runtime Execution) ↔ verify A-07 (runtime test) — symmetric. implement 단계 self-test + verify 단계 독립 재실행.
- implement A-06 (Functional Wire-up) ↔ verify D-02 (cascading audit trail) — 의미 fit. verify 측 별도 항목 신설 불필요 (advisor §7 — gold-plating 금지).
- implement F-03 (변경 증거 + No-op Implement Loop) ↔ verify A-04/A-05 — F-03 가 implement 시 변경 증거 검증, A-04/A-05 가 verify 시 install/build 실 실행. 의무 영역 distinct.

### 5.3 coverage-verifier.md 강화 (Bash mandate)

**현재** (L3-4):
```
> **모델**: haiku (루브릭 체크리스트는 grep·패턴 매칭 전용 기계적 작업)
```

**신** (R-4 강화):
```
> **모델**: haiku (default) / sonnet (A-04 ~ A-07 실 실행 의무 항목 시 — Bash 도구 mandate)
> **A-04 ~ A-08 actual-execution 의무**: Verifier 는 Bash 도구로 `pnpm install`, `pnpm -r build`, `pnpm test`, `pnpm visual:test` 명령을 실 실행 + exit code 확인. 명령 미실행 + spec 인용만으로 A-04~A-07 채점 시 — 자기-검산 단계에서 evidence "실행 명령 인용 + exit code 발췌" 부재 발견 시 동일 결과 폐기 후 새 Agent 인스턴스 (sonnet) 재호출.
> **모델 선택 가이드**:
> - 본 Goal 이 actual-execution 항목 (A-04~A-07) 의 N/A 가 아닌 평가가 필요한 경우 → sonnet 권장 (Bash 도구 사용 신뢰도 ↑).
> - 본 Goal 이 A-04~A-07 모두 N/A (순수 ADR / decisions / README) 인 경우 → haiku 유지.
```

(rubric 직접 수정 + coverage-verifier.md 수정 두 곳 모두 적용)

---

## 6. 권고 채택 + 적용 순서 (advisor §8 일치)

1. **본 spec 작성** (현 파일) ✓
2. **verify-rubric.md edit**:
   - A-04 ~ A-08 신 항목 추가 (5건)
   - Vacuous Truth Rule 키워드 확장 (storybook/playwright/...)
   - 버전 v1.0.5 → v1.0.6
   - 항목 카운트 16 → 21 (A=3 → 8)
   - 가중치 합 100% 불변 (per-item dilute 감수)
3. **coverage-verifier.md edit**:
   - actual-execution Bash mandate 명시
   - 모델 선택 가이드 추가 (haiku default / sonnet for A-04~A-07 evaluation)
4. **decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md amendment append** (또는 별도 ADR 절):
   - "Rubric Strengthening Amendment (R-4 meta-finding 처리)" 절
   - 본 spec 인용 + 채택 시점 명시
   - **retroactive 미적용** 명시 — 기존 17 ADR 의 score 변경 없음
   - MOD-GRID-99-B/G-002/G-003 "would FAIL under v1.0.6 A-04+A-05+A-06" notation

---

## 7. Cross-harness 영향 (별 cycle 권고)

- **tw-mail** (`.claude/tw-mail/rubric/verify-rubric.md` 등): 동일 rubric 구조 사용. 본 강화 적용 가능. **별 cycle 에서 처리** — 본 cycle 범위 외.
- **tw-harness** (`.claude/tw-harness/rubric/`): 동일. **별 cycle**.
- 정책: 본 강화의 cross-harness 전파는 retro 회의 후 결정. 권고: tw-grid 본 cycle 적용 후 1~2 cycle 실무 검증 (R-4 같은 재발 차단 효과 확인) 후 tw-mail/tw-harness 에 cascade.

---

## 8. 기존 ADR 재평가 권고 (별 cycle, retroactive 미적용)

**본 cycle 범위 외** (advisor §5):

| 기존 ADR | 본 강화 적용 시 예상 결과 |
|---|---|
| **MOD-GRID-99-B/G-002** (Storybook 부트스트랩) score 100 | A-04 NO (`pnpm install` 미수행) + A-05 NO (storybook-static 미생성) + A-06 NO (main.ts glob gap 32 파일 미수집) → ~62 (가중 dilute 후) — fail. **그러나 retroactive 미적용 — 기존 score 100 유지.** ADR 본문에 "v1.0.6 기준이라면 fail" notation 추가만. |
| **MOD-GRID-99-B/G-003** (시각 회귀 인프라) score 100 | A-04 NO + A-05 NO + A-07 NO (visual:test 미실행) → ~62 — fail. 동일 notation. |
| **Wave 1-5 17 ADRs** (residual 4 직전까지) | 대부분 A-04~A-08 N/A 적법 (순수 ADR / decisions / 부분 코드 리팩토링). 일부 (예: ADR-001 watermark 7 패키지 변경) 는 A-04/A-05 실 실행 의무 — 재평가 필요할 수 있음. 단 본 cycle 범위 외. |

**정책 (advisor §5 일치)**:
- v1.0.6 항목 A-04 ~ A-08 는 **본 cycle 적용 시점 (2026-05-17 본 spec 채택일) 이후의 verify 단계** 에만 적용.
- Wave 1-5 17 ADRs + MOD-GRID-99-A/B 기존 score 변경 없음 (retroactive=out-of-scope).
- MOD-GRID-99-B G-002/G-003 의 ADR 본문에 "would FAIL under v1.0.6" notation 만 추가 (점수 mutation 없음).

---

## 9. 위험 + 한계

### 9.1 위험

| ID | 위험 | 영향 | 완화 |
|---|---|---|---|
| **R-rs-1** | A-04 ~ A-07 의 Bash 도구 실행이 환경 의존 (pnpm install 시간 ↑, CI vs 로컬 차이) | Verifier 시간 ↑ — 단일 Goal 당 5~10분 추가 가능 | EC-01 같은 documented deviation 처리 의무. 단 A-04 install 은 "Already up to date" 빠른 응답 가능. |
| **R-rs-2** | haiku → sonnet 모델 상향으로 Verifier 비용 ↑ | 1 Goal 당 토큰 비용 ~3x | A-04 ~ A-07 모두 N/A 인 Goal 은 haiku 유지. 모델 선택 가이드 명시. |
| **R-rs-3** | rubric 신 항목 5건 (16 → 21) → 산식 검산 복잡도 ↑ | F-02 산식 검증 환각 위험 ↑ | F-02 자기-검산 의무 (현 v1.0.5 명시) 유지 + 카테고리 합 (A=8) cross-check. |
| **R-rs-4** | 본 강화가 R-4 같은 환각을 새 필드명 (A-04 false PASS 등) 으로 재발시킬 가능성 | **load-bearing concern (advisor §2)** | coverage-verifier.md Bash mandate + 모델 가이드 강화 필수. rubric edit 단독 ship 금지 — agent prompt edit 과 동일 cycle ship. |
| **R-rs-5** | Vacuous keyword 확장이 광범 — 일부 정당한 vacuous 케이스를 차단 | false-NO 가능성 | spec writer 가 vacuous 적용 케이스 명시 시 `naCategoryHandling` 필드로 정당화 가능. v1.0.4 비-그리드 런타임 모듈 규칙 적용 (3 조건 명시). |

### 9.2 한계

1. **retroactive 미적용** — Wave 1-5 17 ADRs 재평가 별 cycle. 본 강화의 효과는 향후 ADR 에 limited.
2. **cross-harness 미적용** — tw-mail / tw-harness 의 동일 rubric 강화는 별 cycle. 본 cycle 범위 외.
3. **specify-rubric 강화 미적용** — spec writer 의 actual-execution touchpoint enumerate 의무는 optional (별 cycle 권고). 본 cycle 은 verify + verifier agent 만.
4. **R-4 의 (a)/(b)/(c) 외 미식별 환각 패턴** — 본 강화는 R-4 의 3 검출 실패만 직접 cover. 다른 환각 패턴 (예: e2e test 실 실행 미검증, browser console error 미검증 등) 은 후속 retro 시 발견 시 별 cycle.
5. **Vacuous Truth Rule keyword extension 의 단일 단어 단순 매칭 한계** — Goal 제목 의 한국어 문맥 (예: "테스트 실행 인프라" vs "테스트 명세 작성") 구분 부재. spec writer 가 의도 명확화 의무.

---

## 10. 산출물 체크리스트

- [x] 본 spec 작성 (`r-4-rubric-strengthening-spec.md`)
- [ ] `verify-rubric.md` edit (A-04~A-08 신 항목 + vacuous keyword 확장 + 버전 v1.0.6 + 항목 수 16→21)
- [ ] `coverage-verifier.md` edit (Bash mandate + 모델 가이드)
- [ ] `decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` amendment append (Rubric Strengthening 절)
- [ ] (권고) MEMORY.md 인덱스 추가: `memory/feedback-tw-grid-rubric-actual-execution.md` — 단 본 cycle 은 plan 만, 메모리 파일 작성은 별 cycle (사용자 결정 후 보존)

---

## 부록 — 참고

- `findings/wave-residual-4-storybook-99b-spec.md` §7.1 R-4
- `findings/wave-residual-4-storybook-99b-result.md` §5
- `rubric/verify-rubric.md` v1.0.5 (2026-05-17 본 cycle 직전)
- `rubric/implement-rubric.md` v1.0.13
- `agents/coverage-verifier.md`
- advisor 자문 (orientation post, 본 spec 작성 직전) — load-bearing concern: Verifier agent capability gap
- `memory/feedback-tw-grid-adr-spec-writer-pattern.md` — 자동 채점 ≠ 실 정확성 패턴 (ADR-014 사례, MEMORY 인덱스)
