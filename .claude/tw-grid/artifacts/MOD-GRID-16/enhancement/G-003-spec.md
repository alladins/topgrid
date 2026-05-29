<!--
  @tomis/grid-pro-master — G-003 Specification + Implementation Plan
  Goal: MOD-GRID-16 / enhancement / G-003
  Title: 행 확장 상태 영속화 (useExpandedPersistence) + 키보드 접근성 (Enter/Space) + TreeGrid/ColumnPinGrid re-export
  Author: tw-grid Spec Writer Agent
  Spec version: 1.0.0
  Rubric: specify-rubric.md v1.0.7 (threshold 90, impact medium)
-->

# G-003 Spec — 행 확장 영속화 + 키보드 접근성 + alias re-export

## D# Decision Index

| D# | Title | Section |
|----|-------|---------|
| D1 | implementFiles 경로 prefix — topvel-grid-monorepo/packages/ (C-28) | §7 |
| D2 | goals.json G-003 implementFiles 보정 — G-005 alias 중복 방지 | §7 |
| D3 | useExpandedPersistence — Option B 독립 훅 (useGridState 비침투) | §5 |
| D4 | AC-004/AC-005 alias 전략 — thin re-export from @tomis/grid-core (G-005 재활용) | §5 |
| D5 | AC-003 키보드 접근성 — useRowKeyboardNav hook (C-32 순수 함수 분리) | §5 |
| D6 | AC-006 Row Pinning — types 정의만, UI 구현 별도 Goal 명시 | §5 |
| D7 | verifyLicense — 신규 컴포넌트 없음, MasterDetailGrid.tsx 기존 호출 유지 | §13 |
| D8 | 번들 영향 — alias re-export 0 KB, hook 2개 ~2 KB, 20 KB 한도 유지 | §8.5 |

**파일 변경 요약 (Section 7 Truth Table)**

| 상태 | 파일 | 위치 |
|------|------|------|
| NEW | `internal/useExpandedPersistence.ts` | monorepo/packages/grid-pro-master/src/ |
| NEW | `internal/useRowKeyboardNav.ts` | monorepo/packages/grid-pro-master/src/ |
| MODIFY | `types.ts` | monorepo/packages/grid-pro-master/src/ |
| MODIFY | `index.ts` | monorepo/packages/grid-pro-master/src/ |
| MODIFY | `decisions/MOD-GRID-16-decisions.md` | TOMIS/.claude/tw-grid/ |

총 5개 파일 (NEW 2 + MODIFY 3)

---

## Section 1 — Goal 개요

**Goal ID**: MOD-GRID-16/enhancement/G-003
**Title**: 행 확장 상태 영속화 (useExpandedPersistence) + 키보드 접근성 (Enter/Space) + TreeGrid/ColumnPinGrid alias re-export
**Module**: MOD-GRID-16 ("Master-Detail + Context Menu + Row Expansion State")
**Category**: enhancement
**Phase**: abstraction
**License Tier**: Pro (`@tomis/grid-pro-master`)
**Migration Impact**: medium
**Spec Threshold**: 90 (medium impact 기준, specify-rubric.md v1.0.7)
**의존**: MOD-GRID-16/G-001 (MasterDetailGrid 구현 완료), MOD-GRID-02/G-001 (useGridState 8키 구현 완료)

### 목적

G-001/G-002에서 구현된 `MasterDetailGrid`와 `ContextMenuGrid`에 두 가지 UX 향상을 추가한다:

1. **행 확장 상태 영속화** (`useExpandedPersistence`) — 페이지 새로고침 후 expanded 상태를 localStorage/sessionStorage로 복원. `useGridState`(MOD-GRID-02)와 외부 합성(composition)으로 협조하나, useGridState 내부를 수정하지 않는다(D3 — Option B).

2. **키보드 접근성** (`useRowKeyboardNav`) — 행에 `tabIndex=0`을 추가하고 `Enter`/`Space` 키를 눌렀을 때 `row.toggleExpanded()`를 호출한다. WCAG 2.1 AA 기준(L0 TreeGrid는 키보드 미지원 — 이 Goal에서 최초 추가).

3. **TreeGrid/ColumnPinGrid alias re-export** — G-005(MOD-GRID-01)이 `@tomis/grid-core/legacy`에 이미 구현한 alias 컴포넌트를 `@tomis/grid-pro-master`에서 thin re-export하여 C-6 호환을 충족한다. 신규 구현 없음(D4).

**canonical-modules.json 기준 Feature**:
- F-16-06: "Row Pinning — types 정의만 (P1, UI는 별도 Goal)" (AC-006)
- F-16-07: "TreeGrid/ColumnPinGrid alias (C-6 호환)" (AC-004/AC-005)

### 상위 컨텍스트

goals.json G-003 `implementFiles`에 명시된 `legacy/TreeGrid.tsx`, `legacy/ColumnPinGrid.tsx`, `legacy/index.ts`는 G-005(MOD-GRID-01)에서 `@tomis/grid-core/src/legacy/`에 이미 구현 완료되었다(Read 확인: `grid-core/src/legacy/TreeGrid.tsx` + `ColumnPinGrid.tsx` + `index.ts` + `useDeprecationWarn.ts` 모두 존재). **D2: goals.json 보정 — `grid-pro-master/src/legacy/` 3 파일 제거, `src/index.ts` MODIFY 대체.**

---

## Section 2 — API 계약

### 2.1 useExpandedPersistence 훅

```typescript
// packages/grid-pro-master/src/internal/useExpandedPersistence.ts

import type { ExpandedState } from '@tanstack/react-table';

/**
 * expanded 상태를 Web Storage에 영속화하는 Pro-tier 훅.
 *
 * @remarks
 * `useGridState`(MOD-GRID-02) 내부를 수정하지 않는다 (D3 — Option B).
 * 외부 합성 패턴: `const [expanded, setExpanded] = useExpandedPersistence({ storageKey, storageType })`
 * 반환된 `[expanded, setExpanded]`를 `MasterDetailGrid state.expanded + onExpandedChange`에 직접 연결.
 *
 * @param options - 영속화 옵션.
 * @returns `[expanded, setExpanded]` — TanStack `ExpandedState` + setter.
 *
 * @see G-003-spec.md Section 2.1 + D3
 */
export interface UseExpandedPersistenceOptions {
  /**
   * Web Storage 키. 동일 페이지에서 두 그리드가 충돌 방지를 위해 고유 키 사용 권장.
   */
  storageKey: string;
  /**
   * 'localStorage' (기본) 또는 'sessionStorage'.
   * @default 'localStorage'
   */
  storageType?: 'localStorage' | 'sessionStorage';
  /**
   * 초기 expanded 상태 (스토리지 값 없을 때 fallback).
   * @default {}
   */
  initialExpanded?: ExpandedState;
}

export function useExpandedPersistence(
  options: UseExpandedPersistenceOptions,
): [ExpandedState, (updated: ExpandedState | ((prev: ExpandedState) => ExpandedState)) => void];
```

**내부 구현 요점** (C-32 순수 헬퍼 분리 불필요 — 로직 자체가 단순 storage serialize):
- `useState<ExpandedState>` 초기값: `storage.getItem(key)` → JSON.parse 성공 시 사용, 실패 시 `initialExpanded ?? {}`.
- `setExpanded` 래퍼: `useState` setter 호출 후 `storage.setItem(key, JSON.stringify(next))`.
- `storageType` 변경 시 재마운트 없이 `useRef`로 storage 참조 갱신.
- trycatch로 Storage 미지원(Safari private) 또는 QuotaExceededError 처리 — fallback to in-memory(state only).

### 2.2 useRowKeyboardNav 훅 (C-32: pure helper + React shell 분리)

```typescript
// packages/grid-pro-master/src/internal/useRowKeyboardNav.ts

import type { Row } from '@tanstack/react-table';

/**
 * 행 키보드 접근성 훅 — WCAG 2.1 AA.
 *
 * @remarks
 * C-32 분리:
 * - 순수 헬퍼: `shouldToggleExpand(event)` — key === 'Enter' || key === ' '
 * - React shell: `useRowKeyboardNav(row)` — onKeyDown 이벤트 핸들러 반환.
 *
 * 반환된 `keyboardProps`를 행 `<tr>` 또는 행 컨테이너 div에 spread.
 *
 * @param row - TanStack `Row<TData>` (getIsExpanded, toggleExpanded 사용).
 * @param enabled - false 시 empty props 반환 (expandable 아닌 행 대응).
 * @returns `{ tabIndex: 0, onKeyDown }` — 행에 spread할 접근성 props.
 *
 * @see G-003-spec.md Section 2.2 + D5
 */
export interface RowKeyboardNavProps {
  tabIndex: 0;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
}

/** 순수 헬퍼 — Enter 또는 Space 키 판별 (React 독립). */
export function shouldToggleExpand(key: string): boolean {
  return key === 'Enter' || key === ' ';
}

export function useRowKeyboardNav<TData>(
  row: Row<TData>,
  enabled?: boolean,
): RowKeyboardNavProps | Record<string, never>;
```

**내부 구현 요점**:
- `enabled === false` 또는 `!row.getCanExpand()` → `{}` 반환 (spread-safe).
- `onKeyDown`: `shouldToggleExpand(event.key)` → `event.preventDefault()` + `row.toggleExpanded()`.
- `useCallback` 메모이제이션 — row 변경 시만 재생성.

### 2.3 타입 추가 (types.ts MODIFY)

```typescript
// packages/grid-pro-master/src/types.ts — MODIFY (G-001 + G-002 타입 유지)

import type { ExpandedState } from '@tanstack/react-table';

// ─── G-003: useExpandedPersistence 옵션 타입 ──────────────────────────────────

/**
 * Row Pinning 기반 타입 (F-16-06 P1 — UI 구현 별도 Goal, D6).
 * TanStack rowPinning state 기반.
 */
export interface RowPinningOptions {
  /**
   * 상단 고정 row id 배열.
   * @see AC-006 — 타입 정의만, UI는 별도 Goal
   */
  pinTop?: string[];
  /**
   * 하단 고정 row id 배열.
   */
  pinBottom?: string[];
}
```

**참고**: `UseExpandedPersistenceOptions`, `RowKeyboardNavProps`, `shouldToggleExpand`는 internal 파일에서 직접 정의하고 `index.ts`를 통해 public export하지 않는다 (내부 구현 상세 — Pro consumer가 직접 사용하는 경우를 위해 `useExpandedPersistence`만 public export).

### 2.4 index.ts MODIFY — 신규 export 추가

```typescript
// packages/grid-pro-master/src/index.ts — MODIFY

// G-001 (MOD-GRID-16): Master-Detail row expansion
export { MasterDetailGrid } from './MasterDetailGrid';
export type { MasterDetailGridProps, MasterDetailOptions, RenderDetailRow } from './types';

// G-002 (MOD-GRID-16): Right-click Context Menu
export { ContextMenuGrid } from './ContextMenuGrid';
export type { ContextMenuGridProps, ContextMenuItem } from './types';

// G-003 (MOD-GRID-16): Expanded persistence hook
export { useExpandedPersistence } from './internal/useExpandedPersistence';
export type { UseExpandedPersistenceOptions } from './internal/useExpandedPersistence';

// G-003 (MOD-GRID-16): Row Pinning base type (F-16-06 P1 — types only, D6)
export type { RowPinningOptions } from './types';

// G-003 (MOD-GRID-16): TreeGrid/ColumnPinGrid C-6 alias re-export (G-005 산출물 재활용, D4)
// @tomis/grid-core는 grid-pro-master의 peerDependency (package.json L29-32).
// G-005(MOD-GRID-01)이 grid-core/src/legacy/에서 alias 구현 완료.
export { TreeGrid, type TreeGridProps } from '@tomis/grid-core';
export { ColumnPinGrid, type ColumnPinGridProps } from '@tomis/grid-core';
```

### 2.5 사용 예시

#### 예시 1 — 기본 expanded 영속화 (controlled mode)

```tsx
import { MasterDetailGrid, useExpandedPersistence } from '@tomis/grid-pro-master';

function OrdersPage() {
  const [expanded, setExpanded] = useExpandedPersistence({
    storageKey: 'orders-grid-expanded',
    storageType: 'localStorage',
    initialExpanded: {},
  });

  return (
    <MasterDetailGrid
      data={orders}
      columns={orderColumns}
      renderDetailRow={(row) => <OrderItems data={row.original.items} />}
      masterDetail={{
        expandedRowKeys: Object.keys(expanded).filter((k) => (expanded as Record<string, boolean>)[k]),
        onExpandChange: (keys) => {
          const next: Record<string, boolean> = {};
          keys.forEach((k) => { next[k] = true; });
          setExpanded(next);
        },
      }}
    />
  );
}
```

#### 예시 2 — 키보드 접근성 (useRowKeyboardNav — MasterDetailGrid 내부 wiring)

```tsx
// MasterDetailGrid.tsx 내부 — <tr> 행에 적용
import { useRowKeyboardNav } from './internal/useRowKeyboardNav';

// 각 행 렌더 시:
const keyboardProps = useRowKeyboardNav(row, !!renderDetailRow);
// ...
<tr {...keyboardProps} className="...">
  {/* 셀 렌더 */}
</tr>
```

#### 예시 3 — C-6 alias (backward compatibility, deprecation warning)

```tsx
// 기존 TreeGrid 코드 변경 없이 그대로 동작.
// G-005 useDeprecationWarn → console.warn in dev mode.
import { TreeGrid } from '@tomis/grid-pro-master';

<TreeGrid
  data={menus}
  columns={menuColumns}
  getSubRows={(row) => row.children}
  expandAll={true}
/>
```

---

## Section 3 — 현 variant 대응표

| variant | 영향 | 새 API 대응 | 마이그레이션 액션 |
|---------|------|------------|-----------------|
| TreeGrid (L0) | AC-004 alias 제공 | `import { TreeGrid } from '@tomis/grid-pro-master'` → G-005 alias 그대로 동작 | 미필요 (C-6 유지) |
| ColumnPinGrid (L0) | AC-005 alias 제공 | `import { ColumnPinGrid } from '@tomis/grid-pro-master'` → G-005 alias 그대로 동작 | 미필요 (C-6 유지) |
| MasterDetailGrid (G-001) | 키보드 접근성 추가 | `useRowKeyboardNav` 내부 wiring — `<tr tabIndex=0 onKeyDown>` | MODIFY `MasterDetailGrid.tsx` 내부 (Section 11.1 Step 3) |
| BaseGrid/VirtualGrid/... | 영향 없음 | — | no-op |

---

## Section 4 — 호환성 + Breaking Change

**Breaking change**: 없음.

- `useExpandedPersistence` 신규 hook export — 기존 API 변경 없음.
- `useRowKeyboardNav` MasterDetailGrid 내부 wiring — 외부 API 변경 없음. 시각적으로는 `<tr tabIndex=0>` 추가 (포커스 링 CSS 변화 — Tailwind focus-visible 사용 시 자동).
- `TreeGrid`, `ColumnPinGrid` re-export — G-005에서 이미 `@tomis/grid-core`로 export됨. `@tomis/grid-pro-master`에서 동일 타입/컴포넌트 re-export 추가는 비충돌(타입 동일).
- `RowPinningOptions` 신규 타입 export — 기존 타입 변경 없음.

**Deprecation 전략**:
- `TreeGrid` / `ColumnPinGrid` alias는 G-005 기준 1 minor 버전 후 다음 major 제거 (C-23 — G-005 D8 정책 그대로 유지).
- `@tomis/grid-pro-master`에서의 re-export는 동일 deprecation lifecycle 공유.

---

## Section 5 — 설계 결정 상세

### D3 — useExpandedPersistence Option B (useGridState 비침투)

goals.json G-003 AC-001: "`useGridState`에 `expanded?: ExpandedState` 통합". 두 해석 가능:
- (a) grid-core `useGridState`에 9번째 키로 `expanded` 추가 (invasive — MIT 패키지 surface 확장)
- **(b) 독립 hook `useExpandedPersistence`** — Pro 패키지(grid-pro-master/internal)에 두고, 반환값을 MasterDetailGrid props에 externally compose

**결정: (b)** — goals.json `implementFiles`에 `useExpandedPersistence.ts`만 명시되어 있고 `useGridState.ts` MODIFY가 없음이 (b)를 지지한다. `useGridState`는 MIT boundary(grid-core)에 있고 Pro 기능(expanded persistence)을 주입하면 MIT/Pro 경계(C-24) 위반. AC-001의 "MOD-GRID-02와 인터페이스 협조"는 "침투적 추가" 아닌 "외부 합성으로 협조"로 해석.

### D4 — TreeGrid/ColumnPinGrid thin re-export (G-005 재활용)

goals.json G-003 `implementFiles`에 `grid-pro-master/src/legacy/TreeGrid.tsx` 등 3 파일 명시. 그러나 **G-005(MOD-GRID-01) 구현 완료 확인**:
- `grid-core/src/legacy/TreeGrid.tsx` (Read L1-40 확인 — `useDeprecationWarn` + `defaultExpanded` + Grid 위임 완전 구현)
- `grid-core/src/legacy/ColumnPinGrid.tsx` (Read L1-42 확인 — `pinLeft/pinRight + sort only` 시그니처 보존)
- `grid-core/src/index.ts` (Read L26-34 확인 — `TreeGrid`, `ColumnPinGrid` main entry에서 이미 export)

**결정: D4 thin re-export** — `@tomis/grid-pro-master/src/index.ts`에 2줄 re-export 추가.
```typescript
export { TreeGrid, type TreeGridProps } from '@tomis/grid-core';
export { ColumnPinGrid, type ColumnPinGridProps } from '@tomis/grid-core';
```
`@tomis/grid-core`는 grid-pro-master `peerDependencies`에 이미 존재(`package.json` L29-32 Read 확인 — `"@tomis/grid-core": "workspace:*"`). 신규 파일 생성 없음. **goals.json 보정 필수 (D2 + G-01 rubric)**.

### D5 — useRowKeyboardNav C-32 pure/shell 분리

`shouldToggleExpand(key: string): boolean` — 순수 함수, React 불필요.
`useRowKeyboardNav(row, enabled)` — React shell, `useCallback` 사용.
C-32 (pure helpers + React shell separation) 준수. 단일 파일 내 분리(별도 파일 미생성 — helper가 1개이므로 파일 분리 불필요).

### D6 — Row Pinning (F-16-06) types-only 범위

AC-006: "Row Pinning API는 본 Goal에서 기반 타입만 정의". `RowPinningOptions` 인터페이스를 `types.ts`에 추가하고 index.ts에서 export. TanStack `RowPinningState`, `row.pin()` API 등 UI 구현은 별도 후속 Goal로 명시(Section 11.3 위험 표).

---

## Section 6 — 엣지 케이스 (EC#)

| EC# | 시나리오 | 기대 동작 |
|-----|---------|----------|
| EC-01 | `localStorage` 미지원 환경 (Safari private) | try-catch → in-memory state fallback; console.warn 1회 (`[tomis/grid-pro-master] useExpandedPersistence: storage unavailable, falling back to in-memory`) |
| EC-02 | storage JSON 파싱 오류 (`JSON.parse` throw) | catch → `initialExpanded ?? {}` fallback; 오염된 storage 값 덮어쓰기 금지 (현재 세션에서는 in-memory) |
| EC-03 | `QuotaExceededError` (storage 용량 초과) | catch → 현재 state 유지, storage 쓰기 건너뜀; console.warn 1회 |
| EC-04 | `expanded={}` (모두 닫힘) 상태에서 Enter 키 | `row.getCanExpand()` → true 시 `toggleExpanded()` 호출(열림). false 시 no-op |
| EC-05 | `enableExpanding=false`인 MasterDetailGrid에 키보드 nav | `useRowKeyboardNav(row, false)` → `{}` 반환 → tabIndex/onKeyDown 미추가 |
| EC-06 | 동일 storageKey 두 그리드 동시 마운트 | 마지막 unmount가 storage 덮어씀 → 개발자 책임 (storageKey 고유 사용 JSDoc 권고) |
| EC-07 | `storageType='sessionStorage'` 후 탭 닫기 | sessionStorage 자동 소거 — 의도된 동작 |
| EC-08 | TreeGrid/ColumnPinGrid alias import 충돌 (grid-core + grid-pro-master 동시 import) | TypeScript 동일 타입이므로 충돌 없음 (re-export = 동일 참조) |

**AC-EC 매핑**:

| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-001 (useExpandedPersistence) | EC-01, EC-02, EC-03 | 스토리지 환경 의존 — deviation 처리 근거 |
| AC-003 (keyboard nav) | EC-04, EC-05 | 비확장 가능 행 + 비활성화 케이스 |
| AC-004/AC-005 (alias) | EC-08 | 동시 import 타입 충돌 검증 |

---

## Section 7 — 구현 파일 True Table

**D# 결정 반영 최종 표 (D1 + D2 + D4)**:

| # | 상태 | 파일 경로 | 변경 범위 |
|---|------|----------|----------|
| 1 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/internal/useExpandedPersistence.ts` | 신규 — `UseExpandedPersistenceOptions` interface + `useExpandedPersistence` hook |
| 2 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/internal/useRowKeyboardNav.ts` | 신규 — `shouldToggleExpand` pure helper + `useRowKeyboardNav` hook + `RowKeyboardNavProps` type |
| 3 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/types.ts` | `RowPinningOptions` interface 추가 (~12줄) |
| 4 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/index.ts` | G-003 exports 추가 — `useExpandedPersistence`, `UseExpandedPersistenceOptions`, `RowPinningOptions`, `TreeGrid`, `TreeGridProps`, `ColumnPinGrid`, `ColumnPinGridProps` (7개 export, ~8줄) |
| 5 | MODIFY | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-16-decisions.md` | D3/D4/D5/D6 ADR 추가 |

**Section 11 cross-check**:
- Step 1 (decisions.md) → 행 #5 ✓
- Step 2 (useExpandedPersistence.ts) → 행 #1 ✓
- Step 3 (MasterDetailGrid.tsx MODIFY — useRowKeyboardNav wiring) → ★ 별도 확인
- Step 4 (useRowKeyboardNav.ts) → 행 #2 ✓
- Step 5 (types.ts) → 행 #3 ✓
- Step 6 (index.ts) → 행 #4 ✓

★ **MasterDetailGrid.tsx MODIFY 주의**: Step 3에서 MasterDetailGrid.tsx 내부에 `useRowKeyboardNav` wiring을 추가한다. 이 파일은 G-001 산출물로 기존 존재한다. Section 7 표에 별도 행 추가:

| # | 상태 | 파일 경로 | 변경 범위 |
|---|------|----------|----------|
| 6 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/MasterDetailGrid.tsx` | `useRowKeyboardNav` import + 각 행 `<tr>` 에 `{...keyboardProps}` spread (~5줄 변경) |

**최종 파일 카운트**: NEW 2 + MODIFY 4 = 6개 파일.

---

## Section 8 — 영향도 분석

### 8.1 영향 사용처

현재 `@tomis/grid-pro-master`의 직접 사용처는 없음 (G-001/G-002 모두 `affectedUsageFiles: []`).

| 파일 | 영향 | 변경 유형 |
|------|------|----------|
| `tw-framework-front/src/components/tomis/Grid/TreeGrid.tsx` | alias 제공 후 별도 migration은 MOD-GRID-17 목적 (본 Goal은 alias만 제공) | no-op (C-6) |
| `tw-framework-front/src/components/tomis/Grid/ColumnPinGrid.tsx` | alias 제공 후 별도 migration은 MOD-GRID-17 목적 | no-op (C-6) |
| `packages/grid-pro-master/src/MasterDetailGrid.tsx` | useRowKeyboardNav wiring 내부 추가 | MODIFY (~5줄) |

### 8.2 무파괴 검증

모든 구현 대상 파일의 부모 디렉토리 존재 확인:
- `topvel-grid-monorepo/packages/grid-pro-master/src/internal/` — G-001/G-002에서 이미 생성됨. Read `grid-pro-master/src/internal/` → `ContextMenuPortal.tsx`, `ExpandToggleCell.tsx`, `useContextMenu.ts` 존재 확인.
- `topvel-grid-monorepo/packages/grid-pro-master/src/` — types.ts, index.ts 존재 확인.
- `TOMIS/.claude/tw-grid/decisions/` — MOD-GRID-16-decisions.md 존재 확인 (Read L1-30).

### 8.3 사용처 변경 카운트

0개 사용처 변경 (C-8 ≤5 한도 만족). MasterDetailGrid.tsx MODIFY는 내부 구현 변경이며 external API 변경 없음.

### 8.4 롤백 전략

- `useExpandedPersistence` / `useRowKeyboardNav` 신규 hook — 기존 코드와 독립. 롤백 시 index.ts export 제거로 즉시 비활성화.
- MasterDetailGrid.tsx `useRowKeyboardNav` wiring — `<tr {...keyboardProps}>` spread 제거 1줄로 롤백. keyboardProps가 `{}` 반환하는 경우도 spread-safe이므로 feature flag 없이 if 조건으로 제어 가능.
- TreeGrid/ColumnPinGrid re-export — index.ts 2줄 제거로 즉시 비활성화. grid-core에서의 alias는 영향 없음.

### 8.5 번들 영향 (D8)

| 추가 항목 | 예상 크기 (brotli) | 근거 |
|---------|-----------------|------|
| `useExpandedPersistence.ts` | ~0.8 KB | storage R/W + try-catch + useState |
| `useRowKeyboardNav.ts` | ~0.5 KB | shouldToggleExpand + useCallback |
| types.ts 추가 (`RowPinningOptions`) | ~0.1 KB | 타입만 — 런타임 0 |
| index.ts re-export (TreeGrid/ColumnPinGrid) | ~0 KB | re-export는 번들 크기 미증가 (tree-shake) |
| MasterDetailGrid.tsx wiring | ~0.2 KB | import 1개 + spread 1줄 |
| **합계** | **~1.6 KB** | |

현재 grid-pro-master 한도: **20 KB** (`.size-limit.json` L79-83 Read 확인).
현재 누적 사용량: G-001 (+6 KB) + G-002 (+5 KB) = 약 11 KB 예상 (실측값은 IMPLEMENT Step에서 `pnpm size-limit` 의무).

**측정 의무**: IMPLEMENT Step 7에서 `pnpm size-limit` 실측 후 20 KB 초과 시 즉시 알림. 현 예상(~12.6 KB / 20 KB)은 한도 여유 충분.

---

## Section 9 — 의존성

| 의존 | 유형 | 사유 |
|------|------|------|
| `@tanstack/react-table@^8.0.0` | peer | `ExpandedState`, `Row<TData>`, `Row.toggleExpanded()`, `Row.getCanExpand()` |
| `@tomis/grid-core@workspace:*` | peer (기존) | `Grid` 컴포넌트, `GridProps<TData>` 타입, `TreeGrid/ColumnPinGrid` re-export |
| `react@^18.0.0 || ^19.0.0` | peer (기존) | hooks |
| `@tomis/grid-license@workspace:*` | peer (기존) | verifyLicense (MasterDetailGrid.tsx 기존 호출 — 신규 호출 없음, D7) |

신규 peerDependency 없음. ADR 불필요 (C-9).

---

## Section 10 — 참조

### L0: tw-framework-front 현 구현

| 파일 | 핵심 패턴 | G-003 흡수 |
|------|---------|-----------|
| `tw-framework-front/src/components/tomis/Grid/TreeGrid.tsx` | L12-22 `TreeGridProps<TData>`: `getSubRows?: (row) => TData[] \| undefined; expandAll?: boolean`. L35 `useState<ExpandedState>(initialExpandAll ? true : {})`. L37-46 expanding-only wiring. **키보드 접근성 없음** (이 Goal 신규 추가). | AC-004 alias, AC-003 keyboard 추가 대상 |
| `tw-framework-front/src/components/tomis/Grid/ColumnPinGrid.tsx` | L14-26 `ColumnPinGridProps<TData>`: `pinLeft?: string[]; pinRight?: string[]`. L40 `useState<ColumnPinningState>`. L57-59 sort-only. | AC-005 alias |
| `topvel-grid-monorepo/packages/grid-core/src/legacy/TreeGrid.tsx` | L27-38 `TreeGridProps` (AS-IS 시그니처 보존). L2-4 `useDeprecationWarn` + Grid 위임. D5 `defaultExpanded`. | AC-004 재활용 — G-005 완성품 |
| `topvel-grid-monorepo/packages/grid-core/src/legacy/ColumnPinGrid.tsx` | L24-37 `ColumnPinGridProps` (pinLeft/pinRight). L42-44 `useDeprecationWarn` + Grid 위임. | AC-005 재활용 — G-005 완성품 |
| `topvel-grid-monorepo/packages/grid-core/src/index.ts` | L26-34 `TreeGrid`, `ColumnPinGrid` main entry export. L23-34 G-005 D8 legacy block. | D4 thin re-export 기반 |
| `topvel-grid-monorepo/packages/grid-pro-master/src/MasterDetailGrid.tsx` | L1-30 전체 구조 확인. Option B standalone. `useReactTable` + `getExpandedRowModel`. 현재 `<tr>` 행 render 존재. | Step 3 wiring 대상 |

### L1: TanStack v8 API

| API | 용도 |
|-----|------|
| `ExpandedState` | `useState<ExpandedState>` + `useExpandedPersistence` 반환 타입 |
| `Row<TData>.toggleExpanded()` | `useRowKeyboardNav` Enter/Space handler |
| `Row<TData>.getCanExpand()` | enabled 조건 판별 |
| `Row<TData>.getIsExpanded()` | (참조용 — MasterDetailGrid 기존 사용) |
| `getExpandedRowModel()` | MasterDetailGrid 기존 사용 (변경 없음) |

### L2: 8 variant 공통 패턴

- `useState<ExpandedState>`: TreeGrid만 사용 (BaseGrid/VirtualGrid/ColumnPinGrid/GroupedHeaderGrid 미사용).
- 키보드 접근성: 8 variant 모두 없음 — 이 Goal 최초.
- storage 영속화: `useStoragePersist`(MOD-GRID-02/G-006)가 columnFilters/columnOrder 등 8 state 키를 persist하나 `expanded`는 미포함.

### R-A: AG Grid 동등 기능

- `expandAllRows()` / `collapseAllRows()` Grid API (Enterprise)
- `onRowGroupOpened` 이벤트 → keyboard handler에 해당
- `rowGroupPanelShow` + `suppressGroupSelectsChildren` 옵션

### R-W: Wijmo 동등 기능

- `FlexGrid.childItemsPath` (tree-grid expand)
- `FlexGrid.keyActionEnter = 'CycleEditable'` → Enter key 동작
- `RowDetailProvider` rows 영속화 없음 (native 미지원 — 이 Goal이 초과 달성)

---

## Section 11 — 구현 계획

### 11.1 구현 순서

**Step 1** — `decisions/MOD-GRID-16-decisions.md` MODIFY
- D3(useExpandedPersistence Option B), D4(thin re-export), D5(C-32 분리), D6(RowPinning types-only) ADR 추가.
- verify: 파일 존재 + 4개 ADR 섹션 추가 확인.

**Step 2** — `internal/useExpandedPersistence.ts` NEW
- `UseExpandedPersistenceOptions` interface 정의.
- `useExpandedPersistence` hook 구현 (Section 2.1 + EC-01/02/03).
- verify: `tsc --noEmit 0 errors` (grid-pro-master).

**Step 3** — `MasterDetailGrid.tsx` MODIFY — `useRowKeyboardNav` wiring (내부)
- `useRowKeyboardNav` import 추가.
- 각 행 `<tr>` 에 `{...keyboardProps}` spread.
- 단, Step 4(`useRowKeyboardNav.ts` NEW)가 완료된 후 수행 가능 — Step 3과 4는 순서 교환 가능.

**Step 4** — `internal/useRowKeyboardNav.ts` NEW
- `shouldToggleExpand` pure helper (Section 2.2).
- `useRowKeyboardNav` hook (Section 2.2 + EC-04/05).
- verify: `tsc --noEmit 0 errors`.

**Step 5** — `types.ts` MODIFY
- `RowPinningOptions` interface 추가 (Section 2.3).
- 기존 타입(G-001 + G-002 산출물) 보존 확인 의무 (C-1 ★ MODIFY 보존).

**Step 6** — `index.ts` MODIFY
- Section 2.4 export 블록 추가 (7개 신규 export).
- 기존 G-001/G-002 export 보존 확인 의무 (C-1 ★ MODIFY 보존).
- verify: `tsc --noEmit 0 errors` (최종).

**Step 7** — 번들 측정
- `pnpm size-limit` 실행 → `@tomis/grid-pro-master` 20 KB 이내 확인.
- 초과 시 즉시 알림 (Section 8.5 정책).

**Step 8** — Storybook story 작성 (AC-008)
- `packages/grid-pro-master/src/MasterDetailGrid.stories.tsx` 에 `KeyboardNavigation` + `ExpandedPersistence` story 추가.
- alias story: `TreeGridAlias` + `ColumnPinGridAlias`.

### 11.2 Before/After 코드 스니펫

**Before** (G-003 이전 — `@tomis/grid-pro-master/src/index.ts` 현재 상태):

```typescript
// G-001 (MOD-GRID-16): Master-Detail row expansion
export { MasterDetailGrid } from './MasterDetailGrid';
export type { MasterDetailGridProps, MasterDetailOptions, RenderDetailRow } from './types';

// G-002 (MOD-GRID-16): Right-click Context Menu
export { ContextMenuGrid } from './ContextMenuGrid';
export type { ContextMenuGridProps, ContextMenuItem } from './types';
```

**After** (G-003 추가 후):

```typescript
// G-001 (MOD-GRID-16): Master-Detail row expansion
export { MasterDetailGrid } from './MasterDetailGrid';
export type { MasterDetailGridProps, MasterDetailOptions, RenderDetailRow } from './types';

// G-002 (MOD-GRID-16): Right-click Context Menu
export { ContextMenuGrid } from './ContextMenuGrid';
export type { ContextMenuGridProps, ContextMenuItem } from './types';

// G-003 (MOD-GRID-16): Expanded persistence hook
export { useExpandedPersistence } from './internal/useExpandedPersistence';
export type { UseExpandedPersistenceOptions } from './internal/useExpandedPersistence';

// G-003 (MOD-GRID-16): Row Pinning base type (F-16-06 P1 — types only, D6)
export type { RowPinningOptions } from './types';

// G-003 (MOD-GRID-16): TreeGrid/ColumnPinGrid C-6 alias re-export (G-005 산출물 재활용, D4)
export { TreeGrid, type TreeGridProps } from '@tomis/grid-core';
export { ColumnPinGrid, type ColumnPinGridProps } from '@tomis/grid-core';
```

### 11.3 위험 표

| 위험 | 발생 조건 | 완화 |
|------|---------|------|
| `@tomis/grid-core` re-export TypeScript 에러 | `tsup` or `tsc` 경로 해석 실패 (workspace peer가 types export를 올바르게 반영 못함) | 빌드 실패 즉시 알림. 대안: `from '@tomis/grid-core/legacy'` sub-entry 경로 사용 |
| `useRowKeyboardNav` wiring 후 포커스 링 시각 회귀 | MasterDetailGrid `<tr tabIndex=0>` 추가 시 기본 브라우저 포커스 스타일 노출 | `focus:outline-none focus-visible:outline-2 focus-visible:outline-blue-500` Tailwind 클래스 추가 |
| Row Pinning 후속 Goal에서 `RowPinningOptions` 변경 | F-16-06 UI 구현 시 `RowPinningOptions` 인터페이스 확장 필요 | optional 필드만 추가(non-breaking) 정책 — semver minor |
| 20 KB 초과 | G-001/G-002 실제 누적이 18+ KB일 경우 | Step 7 실측 후 hook 구현 최소화 or `grid-pro-master` 한도 증액(ADR 필요) |

---

## Section 12 — 검증 계획

### 12.1 단위 테스트 계획

| 테스트 | 대상 | 검증 항목 |
|--------|------|---------|
| `useExpandedPersistence.test.ts` | localStorage persist + restore | 마운트 후 localStorage 값 존재, 언마운트 후 값 유지 |
| `useExpandedPersistence.test.ts` | storage 오류 fallback | jest fake storage throw → in-memory fallback |
| `useRowKeyboardNav.test.ts` | Enter/Space → toggleExpanded 호출 | fireEvent.keyDown + mock row.toggleExpanded |
| `useRowKeyboardNav.test.ts` | enabled=false → empty props | spread 결과 tabIndex 없음 확인 |
| `shouldToggleExpand.test.ts` | 순수 함수 | Enter→true, Space→true, Tab→false, ArrowDown→false |

### 12.2 시각 회귀 검증 (C-13/C-17 — migrationImpact: medium)

- MasterDetailGrid: tabIndex=0 추가 후 포커스 스타일 확인 (Storybook story `KeyboardNavigation`).
- TreeGrid alias: AS-IS TreeGrid.tsx vs `import { TreeGrid } from '@tomis/grid-pro-master'` 동일 렌더 확인.
- 방법: Storybook story + 수동 스크린샷 비교 (Chromatic 없는 경우).

### 12.3 빌드 검증

- `npx tsc --noEmit` 0 errors (packages/grid-pro-master, tw-framework-front) — AC-007
- `pnpm tsup` 빌드 통과
- `pnpm size-limit` ≤ 20 KB

---

## Section 13 — 상용 제품화

**패키지 대상**: `@tomis/grid-pro-master` (Pro tier, `SEE LICENSE IN EULA`)

**라이선스 검증 (verifyLicense — F-02)**:
- 신규 컴포넌트 없음. MasterDetailGrid.tsx + ContextMenuGrid.tsx module-level `verifyLicense('@tomis/grid-pro-master')` 기존 호출 유지 (D7 — 추가 호출 불필요).
- `useExpandedPersistence` + `useRowKeyboardNav`는 MasterDetailGrid 내부 또는 Pro consumer가 사용 — Pro package에서 export되므로 라이선스 게이트 충족.

**문서 계획 (F-03)**:
- Docusaurus 페이지: `docs/pro/master-detail/keyboard-accessibility.md` + `docs/pro/master-detail/expanded-persistence.md`
- Storybook story paths:
  - `packages/grid-pro-master/src/MasterDetailGrid.stories.tsx` → `KeyboardNavigation` + `ExpandedPersistence` story
  - `packages/grid-pro-master/src/MasterDetailGrid.stories.tsx` → `TreeGridAlias` + `ColumnPinGridAlias` story
- JSDoc: `useExpandedPersistence` + `useRowKeyboardNav` + `shouldToggleExpand` 함수 위 JSDoc 의무 (AC-008)

**peerDependencies 정책 (F-04)**:
- `react`, `@tanstack/react-table`, `@tomis/grid-core`, `@tomis/grid-license` — 기존 peer 4종, 신규 추가 없음 (D9).

**Changeset (C-23)**:
- `@changesets/cli` minor bump 필요 (`useExpandedPersistence` 신규 public export).
- `packages/grid-pro-master/CHANGELOG.md` 업데이트.

---

## Appendix A — 참조 증거 요약

| 레이어 | 경로 | Read 확인 내용 |
|--------|------|--------------|
| L0 | `topvel-grid-monorepo/packages/grid-pro-master/src/index.ts` | G-001/G-002 exports 2 섹션 확인 |
| L0 | `topvel-grid-monorepo/packages/grid-pro-master/src/types.ts` | MasterDetailOptions, RenderDetailRow, MasterDetailGridProps, ContextMenuItem, ContextMenuGridProps 확인 |
| L0 | `topvel-grid-monorepo/packages/grid-pro-master/src/MasterDetailGrid.tsx` | L1-30 Option B standalone, useReactTable, getExpandedRowModel 확인 |
| L0 | `topvel-grid-monorepo/packages/grid-pro-master/package.json` | peerDeps: grid-core workspace:*, grid-license workspace:*, tanstack/react-table, react 확인 |
| L0 | `topvel-grid-monorepo/packages/grid-core/src/legacy/TreeGrid.tsx` | L1-40 useDeprecationWarn + defaultExpanded + Grid 위임 완전 구현 확인 |
| L0 | `topvel-grid-monorepo/packages/grid-core/src/legacy/ColumnPinGrid.tsx` | L1-42 pinLeft/pinRight + sort-only 시그니처 보존 확인 |
| L0 | `topvel-grid-monorepo/packages/grid-core/src/index.ts` | L26-34 TreeGrid, ColumnPinGrid main entry export 확인 |
| L0 | `topvel-grid-monorepo/packages/grid-core/src/legacy/index.ts` | L13-14 TreeGrid + ColumnPinGrid sub-entry export 확인 |
| L0 | `topvel-grid-monorepo/.size-limit.json` | L79-83 grid-pro-master 한도 20 KB 확인 |
| L0 | `topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` | L40-49 8 state keys (expanded 없음) 확인 |
| L0 | `tw-framework-front/src/components/tomis/Grid/TreeGrid.tsx` | L12-22 props, L35 expandAll seed, 키보드 없음 확인 |
| L0 | `tw-framework-front/src/components/tomis/Grid/ColumnPinGrid.tsx` | L14-26 pinLeft/pinRight props, L40 state 확인 |
| L0 | `TOMIS/.claude/tw-grid/decisions/MOD-GRID-16-decisions.md` | D1-D2 ADR 존재 확인 |
| L0 | `TOMIS/.claude/tw-grid/artifacts/MOD-GRID-01/wrapper/G-005-spec.md` | D1-D13 확인, 특히 D4(TreeGrid alias), D5(defaultExpanded), D8(legacy sub-entry), D11(5 alias 매핑) |
| L1 | TanStack v8 | `ExpandedState`, `Row.toggleExpanded()`, `Row.getCanExpand()`, `Row.getIsExpanded()`, `getExpandedRowModel()` |
| R-A | AG Grid | `expandAllRows()`, `onRowGroupOpened`, keyboard handling (Enterprise) |
| R-W | Wijmo | `FlexGrid.childItemsPath`, `keyActionEnter` |

---

## Appendix B — E-06 Prose ↔ Structured Form Cross-Check

| Prose (narrative/JSDoc) | Structured form | 동일 operation? | 판정 |
|-------------------------|----------------|----------------|------|
| Section 2.1 useExpandedPersistence 내부 요점: "setExpanded 래퍼: useState setter 호출 후 storage.setItem" | Section 11.2 After pattern (index.ts) — setExpanded 구현 없음 (상세 구현은 hook 내부) | 동일 operation 없음 (structured form 미존재) — E-06 trigger 미발동 | N/A |
| Section 2.2 useRowKeyboardNav: "shouldToggleExpand(event.key) → event.preventDefault() + row.toggleExpanded()" | Section 2.2 `RowKeyboardNavProps` interface + `shouldToggleExpand` signature | key === 'Enter' \|\| key === ' ' 1:1 일치 | ✓ |
| Section 5 D3: "AC-001의 '협조' = 외부 합성으로 협조" | Section 7 Table: useGridState.ts MODIFY 행 없음 | 비침투 결정 일관 | ✓ |
| Section 5 D4: "grid-core에서 이미 export됨" | Section 7 Table #4 index.ts: `export { TreeGrid } from '@tomis/grid-core'` | re-export만, 신규 구현 없음 일관 | ✓ |

**결론**: Prose ↔ Structured form 의미 모순 0건.

---

## goals.json 보정 메모 (D2 — G-01 rubric 의무)

본 spec 채택 시 `TOMIS/.claude/tw-grid/goals/MOD-GRID-16/enhancement-goals.json` G-003 `implementFiles` 배열을 다음으로 교체:

```json
"implementFiles": [
  "D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/internal/useExpandedPersistence.ts",
  "D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/internal/useRowKeyboardNav.ts",
  "D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/types.ts",
  "D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/index.ts",
  "D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/MasterDetailGrid.tsx",
  "D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-16-decisions.md"
]
```

**bundleImpact.expected 보정**: `"+4 KB"` → `"+2 KB (hook 2개 + index.ts wiring; alias re-export 0 KB)"`.
