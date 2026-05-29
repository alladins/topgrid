# MOD-GRID-05 / G-002 — Implement Report

**Goal**: UI 8종 표준화 — StatusBadgeCell + LinkCell + ButtonCell + CheckCell + IconCell 흡수 + TagCell/AvatarCell/ProgressCell 신규
**Module**: MOD-GRID-05 (renderer)
**Stage**: implement
**migrationImpact**: high → threshold 95
**Authored**: 2026-05-14
**Implementer tier**: sonnet (medium per C-15)
**Implementer**: tw-grid Implementer Agent

---

## Section 1 — 변경 파일 목록 (14 spec + 부가 자료)

### 1.1 NEW (monorepo) — 8 컴포넌트 + index.ts modify = 9 files

| # | 경로 | 유형 | spec ref |
|---|------|------|----------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/StatusBadgeCell.tsx` | NEW | Spec Section 7 #1 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/LinkCell.tsx` | NEW | Spec Section 7 #2 |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/ButtonCell.tsx` | NEW | Spec Section 7 #3 |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/CheckCell.tsx` | NEW | Spec Section 7 #4 |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/IconCell.tsx` | NEW | Spec Section 7 #5 |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/TagCell.tsx` | NEW | Spec Section 7 #6 |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/AvatarCell.tsx` | NEW | Spec Section 7 #7 |
| 8 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/ProgressCell.tsx` | NEW | Spec Section 7 #8 |
| 9 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/index.ts` | MODIFY | Spec Section 7 #9 |

### 1.2 MODIFY (tw-framework-front shim) — 5 files

| # | 경로 | 유형 | spec ref |
|---|------|------|----------|
| 10 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/ButtonCell.tsx` | MODIFY | Spec Section 7 #10 |
| 11 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/BadgeCell.tsx` | MODIFY (alias rename) | Spec Section 7 #11 |
| 12 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/CheckCell.tsx` | MODIFY | Spec Section 7 #12 |
| 13 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/LinkCell.tsx` | MODIFY | Spec Section 7 #13 |
| 14 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/IconCell.tsx` | MODIFY | Spec Section 7 #14 |

**Spec 14 파일 매니페스트 완전 일치** (NEW 8 + MODIFY 6 = 14). Spec D6 breakdown + Section 7 표 1:1 매핑.

### 1.3 부가 자료 (Spec Section 7 footer L725-729)

| # | 경로 | 유형 |
|---|------|------|
| F1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/__stories__/StatusBadgeCell.stories.tsx` | NEW (AC-008) |
| F2 | `.../__stories__/LinkCell.stories.tsx` | NEW |
| F3 | `.../__stories__/ButtonCell.stories.tsx` | NEW |
| F4 | `.../__stories__/CheckCell.stories.tsx` | NEW |
| F5 | `.../__stories__/IconCell.stories.tsx` | NEW |
| F6 | `.../__stories__/TagCell.stories.tsx` | NEW |
| F7 | `.../__stories__/AvatarCell.stories.tsx` | NEW |
| F8 | `.../__stories__/ProgressCell.stories.tsx` | NEW |
| F9 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md` | NEW (AC-009 — C-17) |
| F10 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-05-decisions.md` | NEW (D2 ADR) |

---

## Section 2 — R1 Grep 게이트 결과 (Spec Section 11.4 R1, D2 사전 검증)

**의무**: D2 ButtonCell variant 매핑 변경 (L0 `'primary'|'danger'` → spec `'default'|'destructive'`) 의 잠재 build error 위험 사전 차단.

**실행 명령** (사전 게이트, IMPLEMENT 직전):
```
Grep pattern: variant=['"](primary|danger)['"]
Path: D:/project/topvel_project/TOMIS/tw-framework-front
Result: No matches found (0 files)
```

```
Grep pattern: import.*ButtonCell
Path: D:/project/topvel_project/TOMIS/tw-framework-front/src
Result: No matches found (0 files)
```

```
Grep pattern: ButtonCell
Path: D:/project/topvel_project/TOMIS/tw-framework-front/src
Result: 2 files matched
 - tw-framework-front/src/components/tomis/Grid/renderers/index.ts (re-export only)
 - tw-framework-front/src/components/tomis/Grid/renderers/ButtonCell.tsx (own definition)
```

**판정**: 사용처 0건 → D2 변경 **단순 흡수** 가능. codemod / documented-deviation 불필요. R1 단계 trivial. 본 G-002 모든 14 파일 spec 그대로 구현 (분할 권고 R6 비적용).

**근거 ADR**: ADR-MOD-GRID-05-001 (본 implement 단계에서 신설).

---

## Section 3 — 구현 세부 (Spec Section 11.3 Step 1~5 + Step 6)

### Step 1 — 흡수 5종 NEW (Section 7 #1~#5)
완료 — StatusBadgeCell + LinkCell + ButtonCell + CheckCell + IconCell. G-001 패턴 일관:
- `import type { JSX } from 'react'` + `: JSX.Element` 반환 타입 명시
- className composition `[...].filter(Boolean).join(' ')` (G-001 NumberCell 패턴)
- e.stopPropagation 보존 (L0 ButtonCell L20 / CheckCell L13-14 / LinkCell L9 / IconCell L21)
- `type="button"` 명시 (HTML form auto-submit 차단 — best practice; React 표준)

### Step 2 — 신규 3종 NEW (Section 7 #6~#8)
완료 — TagCell + AvatarCell + ProgressCell.
- TagCell: 빈 배열 → dash (EC-08, G-001 TextCell 패턴 일관)
- AvatarCell: `getInitials` 내부 helper (export 안 함), `useState`로 onError 처리 (EC-09)
- ProgressCell: `clampPercent` 내부 helper, `style={{ width: '${pct}%' }}` 동적 값 (spec C-5 deviation 명시)

### Step 3 — index.ts MODIFY (Section 7 #9)
완료 — G-001 5 export + 4 type 보존 + G-002 8 컴포넌트 + 8 type 추가. 총 13 export + 12 type.

### Step 4 — D9 사용처 grep 게이트
완료 — Section 2 참조. 사용처 0건 → 단순 흡수 진행.

### Step 5 — tw-framework-front re-export shim (Section 7 #10~#14)
완료 — 5 파일 body 를 re-export shim 으로 교체. BadgeCell 만 `export { StatusBadgeCell as BadgeCell }` alias rename (D1).

### Step 6 — Storybook stories + finding (선택적, D8 적용)
완료 — 8 stories 파일 + finding 1 (`MOD-GRID-05-G-002-visual-regression.md`). G-001 placeholder 패턴 일관. CSF3 컨벤션. 타입 import 0 — tsc strict 통과.

---

## Section 4 — 빌드 검증 결과

### 4.1 `tsc --noEmit` (monorepo grid-renderers)
```
Command: D:/project/topvel_project/topvel-grid-monorepo/node_modules/.bin/tsc.CMD --noEmit
Working dir: D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers
Exit code: 0
Output: (empty — 0 errors)
```
PASS — strict + exactOptionalPropertyTypes (`tsconfig.base.json` L14) 환경 통과.

### 4.2 `tsup build` (monorepo grid-renderers)
```
Command: D:/project/topvel_project/topvel-grid-monorepo/node_modules/.bin/tsup.CMD
Working dir: D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers
Exit code: 0

CJS dist\index.cjs     10.56 KB
CJS dist\index.cjs.map 33.88 KB
CJS Build success in 123ms
ESM dist\index.mjs     9.95 KB
ESM dist\index.mjs.map 33.87 KB
ESM Build success in 124ms
DTS Build start
DTS dist\index.d.cts 13.27 KB
DTS dist\index.d.ts  13.27 KB
DTS Build success in 778ms
```
PASS — CJS + ESM + DTS 모두 생성. ESM 9.95 KB (uncompressed).

### 4.3 `size-limit` (monorepo root, brotli)
```
Command: D:/project/topvel_project/topvel-grid-monorepo/node_modules/.bin/size-limit.CMD --json
Working dir: D:/project/topvel_project/topvel-grid-monorepo
Result for @tomis/grid-renderers: { "passed": true, "size": 4617, "sizeLimit": 10000 }
```
PASS — brotli 4617 bytes (4.51 KB) ≤ 10 KB 한도 (`.size-limit.json:13`). G-001 시점 추정 4.29 KB 대비 +0.22 KB 만 증가 — 흡수 5 + 신규 3 컴포넌트 누적이 매우 작은 이유는 (1) Tailwind class 가 source 에 string literal 만 있고 런타임 JS 부피 0, (2) helper (`getInitials`, `clampPercent`) 가 작은 함수, (3) tree-shaking 으로 사용처별 fragment 가능.

### 4.4 `npx tsc --noEmit` (tw-framework-front)
```
Command: npx tsc --noEmit
Working dir: D:/project/topvel_project/TOMIS/tw-framework-front
Exit code: 0
Output: (empty — 0 errors)
```
PASS — 5 shim 파일 변경 후 사용처 영향 0건 (재export 컴포넌트가 spec 시그니처와 호환).

---

## Section 5 — Spec ↔ Implementation Cross-Check

### 5.1 AC (Acceptance Criteria) 매핑

| AC | Spec 요구 | 구현 위치 | 충족 |
|----|----------|----------|------|
| **AC-001** | StatusBadgeCell — DEFAULT_COLORS 7-state + value lookup | `StatusBadgeCell.tsx` L21-29 + L42-46 | YES |
| **AC-002** | LinkCell — href/onClick/span 3 분기 | `LinkCell.tsx` L36-66 | YES |
| **AC-003** | ButtonCell — variant `default|destructive|ghost` (D2) | `ButtonCell.tsx` L31-35 + L48-70 | YES |
| **AC-004** | TagCell — readonly string[] chip + 빈 배열 dash (EC-08) | `TagCell.tsx` L35-50 | YES |
| **AC-005** | AvatarCell — initials fallback + onError (EC-09) | `AvatarCell.tsx` L36-46 + L56-77 | YES |
| **AC-006** | ProgressCell — bar + label + 클램프 (EC-10/11) | `ProgressCell.tsx` L29-37 + L46-58 | YES |
| **AC-007** | CheckCell native input (D9) + IconCell ReactNode (D3) | `CheckCell.tsx` + `IconCell.tsx` | YES |
| **AC-008** | Storybook story (각 컴포넌트 1+ variant) | `__stories__/*.stories.tsx` 8개 | YES (placeholder, infra 미구비 — G-001 패턴 일관) |
| **AC-009** | 시각 회귀 검증 (Method B 변형) | `findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md` | YES |

### 5.2 EC (Edge Cases) 처리

| EC | 시나리오 | 구현 |
|----|---------|------|
| EC-01 | StatusBadgeCell colorMap 미매칭 | `defaultColor` fallback (L46) |
| EC-02 | colorMap + DEFAULT_COLORS 둘 다 없음 | `defaultColor` default `'bg-gray-100 text-gray-600'` |
| EC-03 | LinkCell 둘 다 없음 | `<span>` (L62) |
| EC-04 | LinkCell 둘 다 있음 | `<a href onClick>` (L40-54) |
| EC-05 | ButtonCell variant='primary' (D2 변경 전) | TS2322 build error (런타임) — R1 grep 0건이라 발생 안 함 |
| EC-06 | ButtonCell disabled | `disabled` attr + `disabled:opacity-40 disabled:cursor-not-allowed` (L38) |
| EC-07 | CheckCell readOnly | `onChange=undefined` + `cursor-default` (L36-39 + L31) |
| EC-08 | TagCell value=[] | dash placeholder (L36) |
| EC-09 | AvatarCell broken src | onError → `setImgFailed(true)` → 이니셜 fallback (L70-72) |
| EC-10 | ProgressCell null/NaN | `clampPercent` → 0 (L29-30) |
| EC-11 | ProgressCell 범위 초과 | `clampPercent` → 0~100 클램프 (L31-33) |
| EC-12 | IconCell icon=null | React 가 null 자동 무시 (L36-40) |

---

## Section 6 — promptSpecDrift

**Result**: `[]` (drift 0).

상세 cross-check: finding Section 6 참조.

**보조 노트**: prompt 의 "NEW 9 / MODIFY 5" 분류는 monorepo 그룹화 표기 (stories 미포함 시 NEW 8 컴포넌트 + index.ts MODIFY = 9 file written under monorepo + 5 shim MODIFY under tw-framework-front). 한편 spec Section 7 표는 "NEW 8 + MODIFY 6 = 14 파일" 로 표기 (index.ts MODIFY 분리). 두 분류 모두 실 파일 14개에 대응 — **structural reference convention difference, value drift 아님** (F-05 의 "Structural reference error" 기준).

추가 — prompt의 "L0 흡수 5 파일 Read 필수" 와 spec의 "L0.a~L0.e Section 1.1" 매핑 일치. spec 권위 적용 외 변형 없음.

---

## Section 7 — Constraints 충족 확인

| Constraint | 충족 증거 |
|-----------|----------|
| **C-1 (No Assumption)** | L0 5 파일 + G-001 3 파일 모두 Read 도구 직접 호출. 코드 내 LINE 인용 finding Section 2.1~2.5 명시 |
| **C-4 (No `any`)** | Grep `: any\|<any>\|as any` 결과 0 hits (8 NEW + 5 shim 파일 전체) |
| **C-5 (Tailwind only)** | 신규 `.css`/`.scss` 0건. inline `style` 1건만 — ProgressCell의 동적 width (spec C-5 deviation 명시 인정) |
| **C-6 (Backward compat)** | 5 shim 으로 import path 보존. BadgeCell `as` alias rename 으로 사용처 영향 0 |
| **C-12 (Build 0 errors)** | monorepo tsc 0 + tw-framework-front tsc 0 + tsup build success |
| **C-17 (Visual regression)** | finding `MOD-GRID-05-G-002-visual-regression.md` 작성 (Method B 변형) + 5 컴포넌트 외관 동등 입증 |
| **C-19 (≤5 affected sites/Goal)** | affected = 5 (한도 상한) |
| **C-21 (Bundle limit)** | brotli 4617 bytes ≤ 10 KB |
| **C-22 (peerDependencies)** | react/react-dom/@tanstack/react-table peer 기존재, 신규 dep/peer 추가 0건 (D3) |
| **C-23 (semver)** | 5 shim 1 minor alias 유지, 다음 minor (0.2.0) 에서 removal — ADR 명시 |
| **C-27 (Spec authority)** | promptSpecDrift = [], spec Section 7 표 권위 적용 |
| **C-28 (path prefix)** | `topvel-grid-monorepo/packages/...` 경로 정확 — TOMIS prefix 오류 0 |
| **C-29 (exactOptional spread)** | leaf 컴포넌트, optional prop forwarding 0건 (D7 명시 면제 범위) |
| **C-31 (Functional wiring)** | NEW 컴포넌트 8개 모두 index.ts (#9 MODIFY) 에 export 추가 — wiring 완료. 내부 helper (`getInitials`, `clampPercent`) 는 외부 export 0 |

---

## Section 8 — 잔여 Risk

### R3 (Storybook 인프라 부재)
G-001 R3 와 동일. 8 placeholder stories 생성 — `@storybook/react` 인프라 도입 시 (MOD-GRID-99-B) 무수정 가용. CSF3 컨벤션 + 타입 import 0 — strict tsc 통과 보장.

### R5 (번들 크기 모니터링)
누적 4.51 KB / 10 KB (45%). 남은 모듈 (DateRangeCell, MoneyCell, EnumCell 등 미래 Goal) 추가 시 한도 도달 가능. 측정 결과는 G-003+ spec 의 baseline.

### R6 (Goal 분할 불필요)
R1 grep 0건 — D2 ButtonCell variant 사용처 hardcode 없음 → Goal 분할 권고 (G-002b) 비적용. 본 G-002 14 파일 + 부가 자료 모두 1 Goal 완료.

---

## Section 9 — 결론

**Implement 단계 완료** — 14 spec 파일 + 부가 자료 10 파일 (stories 8 + finding 1 + ADR 1) 작성. 모든 빌드 게이트 PASS.

**다음 단계 권고**: Coverage Verifier (haiku tier, 별도 Agent 호출 per C-11 + C-15) — implement-rubric v1.0.6 24 항목 + 메타 F=5 검증.

**ADR 신설**: ADR-MOD-GRID-05-001 (D2 ButtonCell variant rename — primary→default, danger→destructive).

---

**Authored**: 2026-05-14
**Implementer**: tw-grid Implementer (sonnet tier)
**Spec reference**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/artifacts/MOD-GRID-05/renderer/G-002-spec.md`
**Specify-score**: PASS 100/95 (verified 2026-05-14T17:51:17Z, `G-002-specify-score.json`)
