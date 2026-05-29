# 80-code-patterns — 일회성 코드 패턴 (자체 유지)

본 카테고리는 policies/ SSoT 추출 안 됨 (tw-grid 특화 + 일회성).

---

## C-29: `exactOptionalPropertyTypes` 환경 optional prop forwarding 패턴

**적용 환경**: monorepo `tsconfig.base.json` `exactOptionalPropertyTypes: true` (또는 동등 strict).

**금지**: optional prop (`prop?: T`) 을 wrapper/alias/helper 에서 child 로 forwarding 시 `<Child prop={props.prop}>` 또는 `{prop: props.prop}` 직접 전달. `props.prop: T | undefined` ↔ child 의 `prop?: T` 가 TS2375 type-error.

**의무 — 두 패턴 중 하나**:

### Spread skip pattern (JSX child 또는 props 객체)
```tsx
<Child {...(props.optional !== undefined ? { optional: props.optional } : {})} />
```
```ts
const childProps = {
  ...base,
  ...(props.optional !== undefined ? { optional: props.optional } : {}),
};
```

### Union 명시 pattern (internal helper / hook params)
```ts
interface HelperProps {
  optional: T | undefined;  // 명시 union, ?: 사용 X
}
```

**금지**: `undefined` literal 직접 할당 (`{ optional: undefined }`).

**검증**: Grep `: undefined` literal 할당 또는 `{ \w+: \w+\.\w+ }` 직접 forwarding 패턴.

**근거 사례**: G-003 ADR-MOD-GRID-01-004, G-004 ADR-MOD-GRID-01-005, G-005 ADR-MOD-GRID-01-006 (3 occurrences → policy 진입).

**예외**: TanStack `TableOptions` 같은 외부 type 의 conditional assembly 패턴은 그대로 둠.

---

## C-31: Functional Wiring Audit — 유틸 생성 후 호출처 검증

**의무**: spec 에서 단독 유틸 (`buildXxx`, `computeXxx`, `useXxx`, `*Options.ts`) NEW 파일 생성 시 implement 단계에서 다음 모두 충족:

1. **호출처 import**: spec 명시 호출처에서 `import { <util> } from ...` 1건 이상
2. **호출처 invoke**: 같은 호출처에서 `<util>(...)` 호출 1건 이상
3. **결과 merge/적용**: 호출 결과가 TanStack 옵션/React state/DOM/다른 자료구조에 실제 merge (단순 할당 후 무사용 금지 — dead code)

**금지**:
- 유틸만 생성 + export + 호출처 wiring 0건 → 타입 통과하지만 런타임 0 (dead code)
- Implementer 가 "다음 Goal 에서 wiring" 변명으로 누락 + 미보고

**Implementer Self-Fix**: NEW 유틸 생성 직후 자가검증 — `Grep <util-name> on src` import + 호출 둘 다 0건이면 자동 wiring 후보 코드 제안.

**Coverage Verifier**: implement-rubric A-06 검증. NEW 파일 패턴 (`build*.ts`, `compute*.ts`, `use*.ts`, `*Options.ts`) 또는 spec ADR 명시 호출처 grep 의무.

**근거 사례**: 2026-05-14 G-001 — `buildPaginationOptions.ts` 생성 + export 했으나 `buildTableOptions.ts` 에서 wiring 0건 → loop 1 80/90 FAIL → loop 2 wiring 추가 100 PASS.

---

## C-32: Pure Helpers + React Shell 분리 (Pro 패키지 hook 권장)

**의무 (권장)**: Pro 패키지 React hook 구현 시 두 레이어 분리:

### 1. Pure helpers (`src/internal/<name>.ts`)
- 부수효과 없는 reducer 함수 + 자료구조 변환 함수
- React import 0건
- `structuredClone`, `Map`, `Set` 등 globalThis 표준
- unit test 시 React render harness 불필요

### 2. React shell (`src/<name>.ts`)
- `useReducer` 또는 `useState` + `useCallback` 으로 pure helpers wrap
- config 옵션 받고 callback API 반환
- Rules of Hooks 준수

**금지**:
- 단일 파일에 useState/useReducer + 자료구조 변환 혼재 → vitest 없이 검증 불가
- pure helper 안에서 `useEffect`/`useCallback`/`useState` 호출
- React shell 에서 인라인 자료구조 변환 (Map 직접 조작, structuredClone 등) — pure helper 추출 의무

**근거 사례**: 2026-05-14 MOD-GRID-10/G-002 — `internal/changeMap.ts` (327 LOC, 7 helpers, React 0) + `useChangeTracking.ts` (221 LOC, useReducer + 8 useCallback) 분리.

**적용 범위**: 후속 Pro 패키지 (grid-pro-range, grid-pro-merging, grid-pro-datamap, grid-pro-aggregation) 첫 hook Goal cascading.

**예외**: 자료구조 변환 0 인 단순 wrapper hook (ref forwarding only) 적용 X.
