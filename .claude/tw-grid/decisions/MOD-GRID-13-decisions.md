# MOD-GRID-13 Architecture Decision Records

**Package**: `@tomis/grid-pro-merging`
**Goal**: G-001 — column.mergeRows prop API + rowSpan 자동 계산 렌더러
**Date**: 2026-05-15
**Author**: tw-grid Implementer Agent

---

## ADR-MOD-GRID-13-001: API 시그니처 — MergeRowsConfig 합집합 타입

### Status
Accepted

### Context
셀 병합 기능에서 두 가지 사용 패턴을 지원해야 한다:
1. **선언적 boolean**: 같은 값(`===`)을 가진 연속 행을 자동으로 병합
2. **커스텀 비교 함수**: 멀티 필드 조건, 비선형 로직 등 복합 조건 지원

TanStack React Table v8은 rowSpan 자동 계산을 제공하지 않으므로 자체 엔진이 필요하다.
`MergeRowsConfig<TData>` 타입이 두 패턴을 모두 커버해야 한다.

### Decision
`MergeRowsConfig<TData> = boolean | ((prev: TData, curr: TData) => boolean)` 합집합 타입으로 확정.

ColumnDef meta 필드를 통해 확장:
```typescript
export type MergingColumnDef<TData> = ColumnDef<TData> & {
  meta?: {
    mergeRows?: MergeRowsConfig<TData>;
    [key: string]: unknown;
  };
};
```

### Rationale
- boolean은 단순한 동일 값 병합(대부분의 실사용 케이스)을 선언적으로 표현
- 비교 함수는 객체 비교, 멀티 필드 조건 등 복합 케이스를 유연하게 처리
- 합집합 타입 하나로 두 패턴을 단일 API로 표현 — 사용자 학습 비용 최소화
- TanStack ColumnDef meta 확장 방식은 기존 ColumnDef와 병렬 사용 가능

### Alternatives

**대안 1 (채택)**: `boolean | compareFn` 합집합
- 선언적 + 함수형 모두 지원
- 단일 meta 필드 `mergeRows`로 통일
- TypeScript narrowing으로 런타임 분기

**대안 2**: `boolean`만 지원
- API 단순화 장점
- 복합 조건(멀티 필드, 객체 비교) 불가 → 기능 제한
- 미채택 이유: 실용성 부족

**대안 3**: `{ mode: 'value' | 'custom'; fn?: compareFn }` 객체
- 명시적이나 API 장황
- 사용처 코드량 증가
- 미채택 이유: DX(Developer Experience) 열위

### Trade-offs
1. `mergeRows: true` 시 기본 비교 `===` → 객체/배열 타입 행에서 참조 비교로 오판 가능. 커스텀 fn으로 해결 가능.
2. compareFn은 임의 로직 허용 → 비용이 큰 비교 함수 사용 시 렌더 성능 영향. useMemo dependency 관리 주의.

### Result
`src/types.ts`에 `MergeRowsConfig<TData>` 타입으로 확정.
`computeMergeSpans.ts`에서 `col.mergeRows === true` 분기로 런타임 처리.

---

## ADR-MOD-GRID-13-002: grid-license 의존 처리 방침

### Status
Accepted

### Context
`@tomis/grid-pro-merging`은 Pro 패키지이므로 `@tomis/grid-license`를 통한 런타임 라이선스 검증이 필요하다 (C-24).
그러나 두 가지 환경 제약이 있다:
1. MOD-GRID-99-A/G-001이 아직 완료되지 않아 `grid-license/src/index.ts`가 `export {};` stub 상태다.
2. pnpm workspace 심링크가 설치되지 않은 개발 환경에서 `@tomis/grid-license`가 `node_modules`에 존재하지 않아
   `import * as gridLicense from '@tomis/grid-license'` 구문이 TS2307 Cannot find module 오류를 발생시킨다.

런타임에서 라이선스 호출이 실패하면 안 되고, 타입체크도 통과해야 한다.

### Decision
인라인 no-op 함수 stub 패턴 (Option B):

```typescript
// grid-license 인라인 stub (AC-005, C-24 준수 — D2 결정).
// MOD-GRID-99-A/G-002 완료 시 아래 stub을 다음으로 교체:
//   import { verifyOrWarn } from '@tomis/grid-license';
// @see ADR-MOD-GRID-13-002
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function verifyOrWarn(_packageName: string): void {
  /* MOD-GRID-99-A/G-002 will implement signature / expiry / domain checks. */
}
verifyOrWarn('@tomis/grid-pro-merging');
```

`MergingGrid.tsx` 상단, imports 이후에 배치. `@ts-ignore` 사용 금지 (B-06, C-4 준수).

### Rationale
- pnpm workspace 심링크 부재로 `@tomis/grid-license` 모듈 임포트 자체가 TS2307 → 타입체크 실패.
- 인라인 stub은 외부 모듈 의존 없이 동일한 라이선스 검증 호출 패턴을 유지.
- 참조 패키지 `grid-pro-tracking/src/index.ts`가 동일한 인라인 stub 패턴을 사용 — monorepo 일관성 확보.
- MOD-GRID-99-A/G-002 완료 후 stub을 실제 `import { verifyOrWarn } from '@tomis/grid-license'`로 1줄 교체만 필요 — 마이그레이션 경로 명확.
- tsc --noEmit 0 errors 확인 (환경 제약 해소).

### Alternatives

**대안 1 (스펙 명시 Option A, 미채택)**: namespace import + optional-chain feature-detect
```typescript
import * as gridLicense from '@tomis/grid-license';
(gridLicense as unknown as { verifyGridLicense?: () => void }).verifyGridLicense?.();
```
- 미채택 이유: pnpm workspace 심링크 미설치 환경에서 TS2307 Cannot find module 오류 발생.
  grid-license dist/ 파일이 존재해도 moduleResolution 경로 매핑 없이는 해결 불가.

**대안 2 (Option C)**: 라이선스 호출 전체 생략
- 미채택 이유: Pro 패키지 라이선스 검증 공백 (C-24 위반).

**대안 3**: MOD-GRID-99-A 완료 대기 후 진행
- 미채택 이유: 병렬 개발 불가, 불필요한 블로킹.

### Trade-offs
1. 인라인 stub은 실제 라이선스 검증 로직을 포함하지 않는다 → 개발 단계에서만 허용되는 보안 공백.
   MOD-GRID-99-A/G-002 완료 후 즉시 실제 구현으로 교체 필요.
2. 인라인 함수 정의는 `eslint-disable-next-line @typescript-eslint/no-unused-vars` 주석 필요 (매개변수 `_packageName`).
   tree-shaking 시 제거되므로 번들 크기 영향 없음.

### Result
`src/MergingGrid.tsx`에 인라인 stub 패턴 적용. tsc --noEmit 0 errors 확인.
MOD-GRID-99-A/G-002 완료 후 인라인 stub → `import { verifyOrWarn } from '@tomis/grid-license'` 교체 예정.

---

## ADR-MOD-GRID-13-003: computeMergeSpans 반환형 — Map<string, number>

### Status
Accepted

### Context
병합 span 계산 결과를 어떤 자료구조로 표현할지 결정 필요.
렌더러(`MergingGrid.tsx`)에서 각 셀의 rowSpan 값을 빠르게 조회해야 한다.
키는 `${rowIdx}_${colId}` 형식으로 행 인덱스와 컬럼 ID를 결합.

### Decision
`Map<string, number>` 반환. 타입 alias `MergeSpanMap`.
- 키: `${rowIdx}_${colId}`
- 값: rowSpan 수 (1 이상이면 시작 셀, 0이면 skip 셀)

### Rationale
- O(1) 조회 성능 — 렌더링 루프 내 셀별 조회 최적화
- 0 값을 skip 신호로 사용 — null/undefined 처리 없이 명시적
- 1행 데이터 이하 시 빈 Map 반환 (EC-001)
- useMemo dependency에서 Map 참조 동등성 활용 가능

### Alternatives

**대안 1 (채택)**: `Map<string, number>` — O(1) 조회, 명시적 skip 신호
**대안 2**: `Record<string, number>` — 유사하나 Map API 없음, 프로토타입 오염 가능성
**대안 3**: `{ rowIdx: number; colId: string; span: number }[]` 배열 — 조회 시 O(n), 렌더링 성능 열위

### Trade-offs
Map은 직렬화(JSON.stringify) 불가 → 단, 렌더링 전용 계산 결과이므로 직렬화 불필요.

### Result
`src/types.ts`에 `MergeSpanMap = Map<string, number>` 타입 별칭으로 확정.

---

## ADR-MOD-GRID-13-004: monorepo 경로 정정 (C-28)

### Status
Accepted

### Context
`goals.json`의 `implementFiles` 배열이 `TOMIS/packages/` 접두사를 사용하나,
실제 패키지 코드는 `topvel-grid-monorepo/packages/`에 존재한다.
TOMIS 저장소에는 `packages/` 디렉토리가 없다.

### Decision
D1 결정: `implementFiles`의 `TOMIS/packages/` 접두사를 `topvel-grid-monorepo/packages/`로 정정.
ADR 파일(본 파일)은 TOMIS 경로(`.claude/tw-grid/decisions/`)에 그대로 유지.

### Rationale
- ADR-MOD-GRID-00-001에서 monorepo root를 `D:/project/topvel_project/topvel-grid-monorepo/`로 확정
- goals.json 드리프트는 C-28에서 명시적으로 규정 — spec이 권위 있는 소스 (C-27)

### Alternatives

**대안 1 (채택)**: spec D1 적용, goals.json 경로 무시 (C-27/C-28 준수)
**대안 2**: goals.json 경로 그대로 사용 — 잘못된 경로로 파일 생성 → 기능 없음

### Trade-offs
goals.json과 실제 파일 위치 불일치는 drift 기록으로 남김. 향후 goals.json 수정 필요.

### Result
모든 소스 파일을 `topvel-grid-monorepo/packages/grid-pro-merging/` 경로에 생성 완료.

---

## ADR-MOD-GRID-13-005: 기존 scaffold 파일 재활용 (D5)

### Status
Accepted

### Context
`grid-pro-merging` 패키지에 이미 scaffold 파일들이 존재한다:
- `package.json` (peerDeps 일부 존재)
- `tsconfig.json` (extends tsconfig.base.json)
- `tsup.config.ts` (CJS+ESM dual output)
- `src/index.ts` (placeholder)

새 패키지 스캐폴딩 없이 기존 구조를 활용할 수 있다.

### Decision
기존 scaffold 파일들을 MODIFY 방식으로 활용.
신규 파일(EULA.md, types.ts, computeMergeSpans.ts, MergingGrid.tsx, .size-limit.json, stories)만 NEW로 생성.

### Rationale
- 기존 구조와 tsconfig.base.json 상속 체계 보존
- 불필요한 scaffold 재작성 방지 (C-3 Surgical Changes)
- tsup.config.ts는 CJS+ESM 이중 출력 설정이 이미 올바르게 구성됨

### Alternatives

**대안 1 (채택)**: 기존 파일 MODIFY — 최소 변경, 기존 구조 보존
**대안 2**: 전체 재작성 — 불필요한 변경, C-3 위반

### Trade-offs
기존 파일 활용 시 각 파일의 현재 상태를 먼저 확인해야 하는 오버헤드 발생. 단, Read 1회로 해결.

### Result
`package.json` MODIFY (peerDeps + peerDependenciesMeta 추가), `src/index.ts` MODIFY (placeholder → exports).
`tsconfig.json`은 기존 구조로 충분 — `src/**/*` include가 `src/__stories__/` 포함.

---

## ADR-MOD-GRID-13-006: 통합 알고리즘 — 명시적 단일 컬럼 분기 없음 (G-002)

### Status
Accepted

### Context
G-002 hierarchical 알고리즘이 `columns.length === 1`일 때 G-001과 동일한 출력을 내어야 한다.
명시적 `if (columns.length === 1)` 분기를 추가할지, 아니면 단일 알고리즘으로 수렴시킬지 결정 필요.

### Decision
명시적 분기 없음. `ancestorBoundary` 패턴의 수학적 퇴화에 의존.
`columns.length === 1` → 좌측 컬럼 없음 → `ancestorBoundary`가 행 전환 시작마다 `false` 유지 →
자신의 `compareFn`만 평가 → G-001과 동일 로직 (비트 동일 출력 보장).

### Rationale
- 명시적 분기는 코드 복잡도 증가 + gold-plating (CLAUDE.md §2)
- 수학적 퇴화로 회귀 보장 — 별도 코드 경로 없이 동일 출력 (AC-002 검증)
- 향후 컬럼 수 변경 시 경계 케이스 처리 불필요 → 유지보수 비용 최소화

### Alternatives

**대안 1 (채택)**: 통합 알고리즘 — 수학적 퇴화로 단일 컬럼 케이스 자연 처리
**대안 2 (미채택)**: `if (columns.length === 1)` 명시적 분기 — 불필요한 복잡도 증가, gold-plating

### Trade-offs
1. 수학적 퇴화는 코드만 읽으면 직관적으로 파악하기 어려울 수 있다 → 코드 주석(JSDoc `@remarks`)으로 명시하여 보완.
2. 향후 단일/복수 분기를 다르게 최적화해야 할 경우 알고리즘 분리 비용 발생 — 현재 O(N×C) 복잡도는 충분히 수용 가능하므로 우려 수준 아님.

### Result
`computeMergeSpans.ts`의 `ancestorBoundary` 단일 패스 알고리즘으로 구현. JSDoc에 Regression Invariant 명시.

---

## ADR-MOD-GRID-13-007: 암시적 우선순위 — MergePriorityConfig 타입 미추가 (G-002)

### Status
Accepted

### Context
`goals.json` userJourneySteps에 "mergePriority option"이 언급된다.
계층 병합에서 컬럼 우선순위를 어떻게 표현할지 결정 필요.
명시적 `MergePriorityConfig` 타입을 추가할지, 배열 순서에 암시적으로 인코딩할지 결정.

### Decision
별도 `MergePriorityConfig` 타입 없음. `columns` 배열 순서 = 암시적 우선순위.
좌측 인덱스(낮은 j) = 높은 우선순위. `types.ts` 수정 없음.

### Rationale
- 배열 순서는 이미 컬럼 렌더링 순서를 결정 → 추가 설정 없이 직관적
- `MergePriorityConfig` 타입 추가는 gold-plating (CLAUDE.md §2) — 기존 타입으로 충분
- goals.json drift — C-27/C-28에 의거 spec이 권위 있는 소스
- 기존 TanStack ColumnDef 패턴과 일치 — API 일관성 확보

### Alternatives

**대안 1 (채택)**: 배열 순서 암시적 우선순위 — 추가 타입 없이 직관적
**대안 2 (미채택)**: `meta?: { mergePriority?: number }` 확장 — 불필요한 API 복잡도 증가
**대안 3 (미채택)**: `MergePriorityConfig = number | 'left' | 'right'` 타입 신설 — gold-plating, 배열 순서로 이미 표현 가능

### Trade-offs
1. 배열 순서 변경 = 우선순위 변경. 암시적이므로 문서화 없으면 혼동 가능 → ADR + JSDoc 주석으로 명시.
2. 나중에 명시적 우선순위 제어가 필요해질 경우 API 확장 필요 — 하위 호환 방식으로 `meta.mergePriority` 추가 가능하므로 위험 낮음.

### Result
`types.ts` 수정 없음. `ancestorBoundary` 전파가 배열 인덱스 순서를 우선순위로 자연스럽게 인코딩.
주석 및 JSDoc에 "배열 순서 = 좌→우 = 높→낮 우선순위" 명시.

---

## ADR-MOD-GRID-13-008: 회귀 불변성 — columns.length=1 비트 동일 출력 보장 (G-002)

### Status
Accepted

### Context
G-002 hierarchical 알고리즘이 G-001 단일 컬럼 사용자에게 breaking change를 유발하지 않아야 한다.
수학적 퇴화로 동일 출력이 보장되지만, 이를 명시적으로 문서화하고 검증할지 결정 필요.

### Decision
코드 주석(JSDoc)과 ADR으로 회귀 불변성 문서화.
AC-002 허용 기준이 이를 명시적으로 요구하며, 단위 수준 추적(trace)으로 기계적 검증 가능.

### Rationale
- G-001 구현체와의 호환 신뢰를 명시적 문서로 보장 → 미래 수정자 보호
- 알고리즘 변경 시 회귀가 즉시 감지 가능한 검증 기준 제공
- 코드 주석으로 의도 명확화 → 비트 동일 출력 이유(ancestorBoundary 항상 false) 자명하게 기술

### Alternatives

**대안 1 (채택)**: ADR + JSDoc `@remarks` + AC-002 추적 — 명시적 문서화로 의도 보존
**대안 2 (미채택)**: 암묵적 보장 (문서화 없음) — 미래 수정자에게 의도 불명확, 회귀 위험 상승
**대안 3 (미채택)**: 런타임 assertion 추가 — 불필요한 번들 크기 증가 + gold-plating

### Trade-offs
1. 문서화만으로는 자동화 검증이 아님 → Storybook story T-002 시나리오(Section 8.1)로 시각 검증 가능.
2. 수학적 증명(ancestorBoundary 항상 false 시 G-001 동일)은 간단하지만, future refactoring 시 무효화될 수 있음 → ADR이 리뷰어에게 체크포인트 역할.

### Result
`computeMergeSpans.ts` JSDoc `@remarks` 섹션에 Regression Invariant 명시.
AC-002: "단일 컬럼 mergeRows와 동일 함수로 처리 (G-001 computeMergeSpans 확장) — 분기 로직 최소화" 달성.

---

## ADR-MOD-GRID-13-009: useMemo 의존성 배열 — [rows, mergeColumns, enableMerging] 유지 (G-003)

### Status
Accepted

### Context
G-003에서 `getFilteredRowModel()`을 추가하여 필터 변경 시에도 병합이 재계산되어야 한다.
useMemo 의존성 배열에 `sorting`, `columnFilters` state를 별도 dep으로 추가할지, 기존 `[rows, mergeColumns, enableMerging]`을 유지할지 결정 필요.

### Decision
기존 `useMemo([rows, mergeColumns, enableMerging])` 의존성 유지.
`sorting`, `columnFilters` state를 별도 dep으로 추가하지 않음.

### Rationale
`table.getRowModel().rows`는 TanStack이 `getSortedRowModel` + `getFilteredRowModel` 적용 후 반환하는 최종 행 배열.
sorting/filtering 변경 시 `rows` 참조 자체가 변경되므로 useMemo가 자동 재실행됨.
`sorting`/`columnFilters`를 별도로 dep에 추가하면 TanStack 내부 계산을 중복 추적하는 anti-pattern.

### Alternatives

**대안 1 (채택)**: `[rows, mergeColumns, enableMerging]` — TanStack 위임, 단순.
**대안 2 (거부)**: `[sorting, columnFilters, data, mergeColumns, enableMerging]` — sorting/columnFilters를 외부 state로 관리 + dep 추가. 사용처가 state를 외부로 꺼내야 하는 API 변경 강제.

### Trade-offs
1. rows 참조 변경이 실제 내용 변경 없이도 발생할 경우(드문 케이스) 불필요한 재계산 가능. React의 referential stability와 TanStack의 memoization으로 실용적으로 무시.
2. TanStack 버전 업그레이드 시 getRowModel() 참조 안정성 정책 확인 필요.

### Result
`MergingGrid.tsx` useMemo dep 배열 유지. G-001 기존 패턴 보존.

---

## ADR-MOD-GRID-13-010: @tanstack/react-virtual peerDep 추가 (G-003)

### Status
Accepted

### Context
G-003에서 `useVirtualizer`를 통해 가상화를 지원한다.
`@tanstack/react-virtual`을 dependency로 추가할지, peerDependency로 추가할지 결정 필요.
C-22: `@tanstack/react-virtual`은 peerDep 대상.

### Decision
`@tanstack/react-virtual: "^3.0.0"` peerDependencies에 추가.
`peerDependenciesMeta["@tanstack/react-virtual"].optional = true`.

### Rationale
- `useVirtualizer`는 `enableVirtualization=true` 시에만 사용. 기본값 false이므로 미설치 환경에서도 패키지 동작 가능.
- C-22: `@tanstack/react-virtual`은 peerDep 대상.
- 라이선스: MIT (확인).
- 번들 영향: peerDep은 번들에 포함 안 됨. 사용자 번들에만 영향.

### Alternatives

**대안 1 (채택)**: peerDep optional — 기본 사용처 영향 없음, C-22 준수.
**대안 2 (거부)**: dependency(non-peer) — 이중 번들 발생, C-22 위반.
**대안 3 (거부)**: 가상화 구현 없이 limitations만 문서화 — C-18 미충족, G-002 deferred AC-005 미충족.

### Trade-offs
1. optional peer는 런타임에서 import 오류 가능. `enableVirtualization=false` 기본값으로 설치 강제 않는 것으로 대응.
2. @tanstack/react-virtual v3와 v2 API 차이(useVirtualizer hook 이름 변경). `^3.0.0`으로 버전 고정.

### Result
`package.json` MODIFY 완료. C-9/C-20/C-22 준수.

---

## ADR-MOD-GRID-13-011: rowSpan 가상화 경계 한계 — documented-limitations 처리 (G-003)

### Status
Accepted

### Context
flow 레이아웃 spacer 가상화에서 스크롤 아웃된 `<tr>`은 DOM에서 제거됨.
rowSpan > 1 셀의 시작 `<tr>`이 제거되면 병합 셀 자체가 사라지는 것은 HTML table 모델의 구조적 제약.
이를 어떻게 처리할지 결정 필요.

### Decision
visible window 시작점 이전 rowSpan 시작 셀은 DOM 미렌더링 → 해당 병합 표시 불가.
AC-003에서 limitations로 처리. sticky first-cell 패턴 미구현 (현재 Goal 범위 외).

### Rationale
flow 레이아웃 spacer 가상화에서 스크롤 아웃된 `<tr>`은 DOM에서 제거됨.
rowSpan > 1 셀의 시작 `<tr>`이 제거되면 병합 셀 자체가 사라지는 것은 HTML table 모델의 구조적 제약.
truncate to visible + limitations 문서화 방식이 현재 Goal 범위 최소화에 적합.

### Alternatives

**대안 1 (채택)**: truncate to visible + limitations 문서화 — 단순, 현재 Goal 범위 최소화.
**대안 2 (거부)**: sticky first-cell — rowSpan 시작 셀을 position:sticky로 고정. 복잡도 높음 + C-5/C-18 위반 위험. 별도 Goal로 분리.
**대안 3 (거부)**: visible-only span 재계산 — 항상 visible window 내 첫 번째 행을 span 시작으로 처리. 스크롤 시 span 수 변경 → 렌더링 점프 현상 발생.

### Trade-offs
1. 큰 rowSpan(수십 행) 데이터에서 사용자 경험 저하 가능. virtualOverscan 증가로 완화 가능.
2. 제한 사항이 명시되면 사용자는 대안(비가상화 경로 또는 데이터 분리) 선택 가능.

### Result
`Section 10 L-01` + `AC-003` 명시. 별도 sticky Goal 권장 (MOD-GRID-13/G-004 또는 별도 PRD).
