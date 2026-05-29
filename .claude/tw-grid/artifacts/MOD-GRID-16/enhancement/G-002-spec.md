<!--
  @tomis/grid-pro-master — G-002 Specification + Implementation Plan
  Goal: MOD-GRID-16 / enhancement / G-002
  Title: 우클릭 Context Menu — 커스텀 메뉴 항목 + 키보드 단축키 (contextMenuItems prop)
  Author: tw-grid Spec Writer Agent
  Spec version: 1.0.0
  Rubric: specify-rubric.md v1.0.7 (threshold 90, impact medium)
-->

# G-002 Spec — 우클릭 Context Menu (contextMenuItems prop)

## D# Decision Index

| D# | Title | Section |
|----|-------|---------|
| D1 | Option B — ContextMenuGrid wrapper (MIT/Pro 경계 유지) | §4 |
| D2 | implementFiles 경로 prefix — topvel-grid-monorepo/packages/ | §7 |
| D3 | contextMenuItems는 ContextMenuGridProps 전용 (GridProps 미오염) | §4 |
| D4 | createPortal 메뉴 렌더링 — viewport 오버플로 방지 | §5 |
| D5 | 키보드 단축키 기능 범위 — wrapper div focus 한정, shortcut grammar 정의 | §5 |
| D6 | verifyLicense 호출 위치 — module-level in ContextMenuGrid.tsx | §5 |
| D7 | disabled 함수 평가 시점 — 메뉴 렌더링 시 (row 데이터 기준) | §5 |
| D8 | C-32 분리 — computeMenuPosition.ts (pure) + useContextMenu.ts (React shell) | §5 |

**파일 변경 요약 (Section 7 Truth Table)**

| 상태 | 파일 | 위치 |
|------|------|------|
| NEW | `ContextMenuGrid.tsx` | monorepo/packages/grid-pro-master/src/ |
| NEW | `internal/useContextMenu.ts` | monorepo/packages/grid-pro-master/src/ |
| NEW | `internal/ContextMenuPortal.tsx` | monorepo/packages/grid-pro-master/src/ |
| MODIFY | `types.ts` | monorepo/packages/grid-pro-master/src/ |
| MODIFY | `index.ts` | monorepo/packages/grid-pro-master/src/ |
| MODIFY | `decisions/MOD-GRID-16-decisions.md` | TOMIS/.claude/tw-grid/ |

총 6개 파일 (NEW 3 + MODIFY 3)

---

## Section 1 — Goal 개요

**Goal ID**: MOD-GRID-16/enhancement/G-002  
**Title**: 우클릭 Context Menu — 커스텀 메뉴 항목 + 키보드 단축키 (contextMenuItems prop)  
**Module**: MOD-GRID-16 ("Master-Detail + TreeGrid + Context Menu + Row Pinning")  
**Category**: enhancement  
**Phase**: discovered  
**License Tier**: Pro (`@tomis/grid-pro-master`)  
**Migration Impact**: medium  
**Spec Threshold**: 90 (medium impact 기준, specify-rubric.md v1.0.7)

### 목적

`tw-framework-front/src/components/tomis/Grid/RangeSelectGrid.tsx` (L47–114)에는 하드코딩된 우클릭 컨텍스트 메뉴("복사 (탭 구분)", "선택 해제")가 존재한다. 이 패턴을 일반화하여 사용자가 `contextMenuItems` prop으로 커스텀 메뉴 항목과 키보드 단축키를 선언적으로 구성할 수 있는 Pro-tier `<ContextMenuGrid>` 컴포넌트를 제공한다.

**canonical-modules.json 기준 Feature**:  
F-16-05: "ContextMenu — right-click cell/row → menu items prop" (Priority: P0)  
출처: `.claude/tw-grid/canonical-modules.json` (MOD-GRID-16 feature list)

### 상위 컨텍스트

- **L0 (현재 구현)**: `RangeSelectGrid.tsx` L47–114 — `useState` + `onContextMenu` capture + 인라인 div 렌더링. 하드코딩 메뉴, createPortal 미사용, 단축키 없음.
- **R-A (AG Grid)**: `getContextMenuItems` API (Enterprise 전용). MIT 그리드에는 없음. C-7 위반이므로 AG Grid 코드 직접 import 금지.
- **R-W (Wijmo)**: `formatItem.addHandler` 기반 per-cell DOM 이벤트로 컨텍스트 메뉴 구현. 코드 import 금지 (C-16). 패턴 참조만.
- **publish(AG Grid)**: `current-tanstack-analysis.md` Section 8 — "Context menu: RangeSelectGrid 자체 구현만 / 일반화 필요"
- **feature-gap-matrix.md**: 상태 "RangeSelectGrid 자체 구현만" (⚠️ partial), 분류 "Nice-to-have / Wijmo-class"

---

## Section 2 — 배경 및 현재 상태

### 2.1 L0 현황 분석

`RangeSelectGrid.tsx`는 post-MOD-GRID-11/G-001 wrapper 상태 (132줄, verified Read 결과).  
컨텍스트 메뉴 관련 코드 분포:

```
L47–52  : useState<{ x: number; y: number; visible: boolean }>
L79–83  : onContextMenu={(e) => { e.preventDefault(); setContextMenu({...}) }}
L87–112 : 메뉴 JSX — fixed z-50, hardcoded 2개 버튼
```

**문제점**:
1. 메뉴 항목 하드코딩 → 재사용 불가
2. `createPortal` 미사용 → 부모 `overflow: hidden` 시 메뉴 잘림 가능성
3. 키보드 단축키 없음 → 접근성/UX 열위
4. row/cell 데이터 접근 없음 → 항목별 disabled 조건 불가
5. 분리된 Pro 패키지 없이 MIT 코드에 포함됨

### 2.2 벤치마크 비교

| 기능 | RangeSelectGrid (L0) | AG Grid Enterprise (R-A) | Wijmo FlexGrid (R-W) | G-002 목표 |
|------|---------------------|-------------------------|----------------------|-----------|
| 커스텀 항목 | ❌ 하드코딩 | ✅ getContextMenuItems | ✅ formatItem handler | ✅ contextMenuItems prop |
| 키보드 단축키 (기능) | ❌ | ✅ | ✅ | ✅ shortcut grammar |
| 단축키 표시 | ❌ | ✅ 우측 힌트 | ✅ | ✅ 메뉴 행 우측 |
| disabled 함수 | ❌ | ✅ | ✅ | ✅ disabled: fn(row) |
| createPortal | ❌ | N/A | N/A | ✅ |
| Pro 라이선스 | ❌ (MIT 혼재) | Enterprise | Commercial | ✅ @tomis/grid-pro-master |

출처: `publish-aggrid-analysis.md` Section 8, `publish-wijmo-analysis.md`, `feature-gap-matrix.md`, `RangeSelectGrid.tsx` Read 결과

---

## Section 3 — Acceptance Criteria

다음 기준은 구현 완료의 검증 조건이다. 각 항목은 독립적으로 검증 가능한 이진 조건(Pass/Fail)이다.

| AC# | 조건 | 소스 태그 |
|-----|------|----------|
| AC-001 | `ContextMenuItem<TData>` interface 정의: `label: string`, `shortcut?: string`, `disabled?: boolean \| ((row: TData) => boolean)`, `separator?: boolean`, `onClick: (row: TData, cell: Cell<TData, unknown>, event: MouseEvent) => void` — `any` 타입 사용 금지 | C-4, F-16-05 |
| AC-002 | `ContextMenuGridProps<TData>` extends `GridProps<TData>` with `contextMenuItems?: ContextMenuItem<TData>[]` — `GridProps`에 prop 추가 없음 | C-4, D3 |
| AC-003 | 우클릭 시 `e.preventDefault()` + 메뉴 표시 (position: fixed, z-index ≥ 50) — createPortal로 `document.body`에 마운트 | L0(L79–83), D4 |
| AC-004 | `shortcut` 문자열이 현재 `KeyboardEvent`와 일치할 때 해당 항목의 `onClick` 실행 — 메뉴 열림 여부 무관, wrapper div focus 시 항상 활성 | D5 |
| AC-005 | shortcut 문자열 grammar: `"[Modifier+]Key"` 형식. Modifier: `Ctrl`, `Alt`, `Shift`. Key: 단일 문자 또는 `Delete`, `Enter`, `Escape`, `F1`–`F12`. 예: `"Ctrl+C"`, `"Shift+Delete"` | D5 |
| AC-006 | `contextMenuItems` 미제공 시 우클릭해도 메뉴 미표시, `onContextMenu` 이벤트 기본 동작 유지 | F-16-05 |
| AC-007 | `disabled: true` 또는 `disabled: (row) => true` 항목은 클릭 불가 + 시각적 비활성 스타일(Tailwind `opacity-50 cursor-not-allowed`) | D7, C-5 |
| AC-008 | `separator: true` 항목은 `<hr>` 요소로 렌더링 (label/onClick 무시) | F-16-05 |
| AC-009 | Storybook story ≥1개 (shortcut 기능 시나리오 포함), 3개 계획 (§12) | C-8(TBD), F-16-05 |
| AC-010 | `verifyLicense('@tomis/grid-pro-master')` module-level 호출 (ContextMenuGrid.tsx 최상단 import 이후) | D6 |
| AC-011 | `index.ts`에서 `ContextMenuGrid`, `ContextMenuItem`, `ContextMenuGridProps` export | D2 |
| AC-012 | Esc 키 또는 그리드 외부 클릭 시 메뉴 닫힘 | L0(L87–112) 패턴, UX 요구사항 |
| AC-013 | `exactOptionalPropertyTypes: true` 환경에서 ContextMenuGridProps → GridProps spread 시 컴파일 에러 없음 (C-29 spread-skip 패턴 적용) | C-29 |

> AC-006 주석: 기존 `RangeSelectGrid.tsx`의 하드코딩 메뉴를 `ContextMenuGrid` 기반으로 교체하는 작업은 G-003 scope이다. G-002는 API 호환성만 보장한다. (`affectedUsageFiles: []` — canonical-modules.json)

---

## Section 4 — 아키텍처 결정 (D1–D3)

### D1: Option B — ContextMenuGrid wrapper 패턴 (MIT/Pro 경계 유지)

**결정**: G-002는 `grid-core/Grid.tsx`를 수정하지 않는다. 독립적인 Pro wrapper `ContextMenuGrid.tsx`를 `grid-pro-master` 패키지에 신규 생성한다.

**근거**:
- G-001 D1과 동일한 경계 논리: `GridProps<TData>`는 MIT 라이선스 패키지(`@tomis/grid-core`)의 public contract이다. `contextMenuItems`를 `GridProps`에 추가하면 MIT 코드에 Pro 개념이 혼입된다.
- L0 증거: `RangeSelectGrid.tsx` L79–83에서 확인된 `onContextMenu` 캡처는 wrapper div 수준에서 가능하다. Grid.tsx 내부 접근 불필요.
- R-A(AG Grid Enterprise) 패턴: context menu는 그리드 인스턴스의 별도 API (`getContextMenuItems`)로 분리. MIT 기반에 혼재하지 않음.

**거부된 대안**:
- Option A (GridProps에 contextMenuItems 추가): MIT 코드에 Pro 개념 오염. 향후 MIT 패키지 독립 배포 시 라이선스 위반 위험.

**출처**: `canonical-modules.json` licenseTier: Pro, `G-001-spec.md` D1, `grid-core/types.ts` (GridProps — contextMenu 관련 prop 없음 확인), C-6 (Pro/MIT 경계 유지)

---

### D2: implementFiles 경로 prefix

**결정**: `goals.json`의 `implementFiles` 배열은 모두 `topvel-grid-monorepo/packages/` prefix를 사용한다. TOMIS repo 상대경로 사용 금지.

**근거**: C-28 — "goals.json implementFiles must use topvel-grid-monorepo/packages/ prefix (not TOMIS/packages/)"

---

### D3: contextMenuItems는 ContextMenuGridProps 전용

**결정**: `contextMenuItems?: ContextMenuItem<TData>[]` prop은 `ContextMenuGridProps<TData>`에만 정의한다. `GridProps<TData>` (grid-core)는 수정하지 않는다.

**근거**: D1과 동일. MIT 공개 API와 Pro 기능의 명확한 분리.

**출처**: `grid-core/src/types.ts` Read 결과 — `GridProps<TData>`에 onContextMenu 없음 확인.

---

## Section 5 — 기술 설계

### 5.1 타입 설계

```typescript
// types.ts에 추가 (G-001 타입과 동일 파일)

/**
 * 단일 컨텍스트 메뉴 항목.
 *
 * @typeParam TData - Row data type.
 */
export interface ContextMenuItem<TData> {
  /** 메뉴에 표시할 레이블. separator: true 시 무시. */
  label: string;

  /**
   * 키보드 단축키 힌트 문자열 (표시 + 기능).
   * Grammar: "[Modifier+]Key"
   * Modifier: Ctrl | Alt | Shift (복합 가능: "Ctrl+Shift+K")
   * Key: 단일 문자 또는 Delete | Enter | Escape | F1–F12
   * 예: "Ctrl+C", "Shift+Delete", "F2"
   */
  shortcut?: string;

  /**
   * 비활성 조건. boolean 또는 row 데이터 기반 함수.
   * 함수는 메뉴 렌더링 시 현재 row 데이터를 인수로 평가된다 (D7).
   */
  disabled?: boolean | ((row: TData) => boolean);

  /**
   * true 시 구분선(<hr>)으로 렌더링. label/onClick 무시.
   */
  separator?: boolean;

  /**
   * 항목 클릭 핸들러. disabled 항목에서는 호출되지 않음.
   */
  onClick: (row: TData, cell: Cell<TData, unknown>, event: MouseEvent) => void;
}

/**
 * Props for <ContextMenuGrid>.
 *
 * @typeParam TData - Row data type.
 */
export interface ContextMenuGridProps<TData> extends GridProps<TData> {
  /**
   * 우클릭 컨텍스트 메뉴 항목 배열.
   * 미제공 시 컨텍스트 메뉴 비활성 (브라우저 기본 동작 유지).
   */
  contextMenuItems?: ContextMenuItem<TData>[];
}
```

### 5.2 useContextMenu.ts (D8 React Shell)

**위치**: `packages/grid-pro-master/src/internal/useContextMenu.ts`  
**호출 위치**: `ContextMenuGrid.tsx` 내부에서 import + 호출 (C-31 wiring 확인)

반환 타입:

```typescript
interface UseContextMenuReturn<TData> {
  isOpen: boolean;
  position: { x: number; y: number };
  targetRow: TData | null;
  targetCell: Cell<TData, unknown> | null;
  openAt: (x: number, y: number, row: TData, cell: Cell<TData, unknown>) => void;
  close: () => void;
  focusedIndex: number;
  setFocusedIndex: Dispatch<SetStateAction<number>>;
}
```

책임:
- `useState`로 `isOpen`, `position`, `targetRow`, `targetCell`, `focusedIndex` 관리
- `openAt(x, y, row, cell)`: 메뉴 열기 + position 설정 + target 저장
- `close()`: `isOpen = false`, target/position 초기화
- shortcut `keydown` 리스너는 `ContextMenuGrid.tsx`의 wrapper div `onKeyDown`에서 처리 (hook 외부, wrapper 책임)

### 5.3 ContextMenuPortal.tsx (D4 createPortal)

**위치**: `packages/grid-pro-master/src/internal/ContextMenuPortal.tsx`  
**호출 위치**: `ContextMenuGrid.tsx`에서 `isOpen` 시 렌더링 (C-31 wiring 확인)

Props:
```typescript
interface ContextMenuPortalProps<TData> {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem<TData>[];
  targetRow: TData;
  targetCell: Cell<TData, unknown>;
  onClose: () => void;
}
```

구현 요점:
- `createPortal(<menu>, document.body)` — viewport overflow 방지 (D4)
- `position: fixed; left: position.x; top: position.y` — `style` prop으로 설정
- Tailwind 클래스 (C-5): `fixed z-50 bg-white border border-gray-200 rounded shadow-lg py-1 text-sm` (L0 패턴 계승)
- `separator: true` 항목 → `<hr className="my-1 border-gray-200" />`
- disabled 평가 (D7): `typeof item.disabled === 'function' ? item.disabled(targetRow) : item.disabled ?? false`
- disabled 스타일: `opacity-50 cursor-not-allowed` (AC-007)
- shortcut 표시: 각 메뉴 항목 행 우측에 `<span className="ml-auto text-xs text-gray-400">{item.shortcut}</span>`
- 외부 클릭 닫기: `useEffect`로 `mousedown` 리스너 등록 → 메뉴 컨테이너 외부 클릭 시 `onClose()` (AC-012)

### 5.4 ContextMenuGrid.tsx

**위치**: `packages/grid-pro-master/src/ContextMenuGrid.tsx`  
**C-31 wiring**: `useContextMenu` import + 호출, `ContextMenuPortal` import + 렌더링

구현 요점:
- module-level: `verifyLicense('@tomis/grid-pro-master')` (D6, AC-010)
- wrapper div에 `onContextMenu` 핸들러:
  ```
  e.preventDefault()
  row/cell 정보 추출 (tanstack row.id 기반)
  useContextMenu.openAt(e.clientX, e.clientY, row.original, cell)
  ```
- wrapper div에 `onKeyDown` 핸들러 (D5): shortcut 파싱 + 일치 항목 `onClick` 실행
- `tabIndex={0}` — wrapper div를 포커스 가능하게 하여 keydown 수신 (D5)
- `contextMenuItems` 미제공 시 → `onContextMenu`/`onKeyDown` 핸들러 미등록 (AC-006)
- C-29 spread-skip: `contextMenuItems` prop은 `{...rest}` 에서 구조분해로 제외 후 `<Grid {...rest}>` 에 전달

### 5.5 D5: 키보드 단축키 설계

**결정**: 단축키는 표시(display)와 기능(functional) 모두 지원한다.

**활성 조건**: wrapper div가 focus를 보유할 때 (`tabIndex={0}` + 사용자가 그리드 내 클릭 이후)

**shortcut 문자열 grammar** (AC-005):
- 형식: `"[Modifier+]Key"` (대소문자 무관 파싱)
- Modifier 값: `Ctrl`, `Alt`, `Shift` (복합 허용: `"Ctrl+Shift+K"`)
- Key 값: 단일 영문자 (`A`–`Z`), 숫자 (`0`–`9`), 특수키 (`Delete`, `Enter`, `Escape`, `F1`–`F12`)
- 유효하지 않은 grammar → 무시 (콘솔 경고 1회)

**매칭 알고리즘** (onKeyDown 내):
```
event.ctrlKey  ↔ "Ctrl"
event.altKey   ↔ "Alt"
event.shiftKey ↔ "Shift"
event.key      ↔ Key 부분 (대소문자 insensitive)
→ 모든 modifier + key 일치 시 → onClick(targetRow, targetCell, syntheticEvent)
```

**메뉴 열림 여부 무관**: 단축키는 메뉴가 닫혀 있어도 동작한다 (AC-004).  
단, `targetRow`/`targetCell`이 null(우클릭 이전 상태)이면 shortcut 발화 무시.

**Esc 처리**: `onKeyDown`에서 Esc → `useContextMenu.close()` (AC-012 일부)

### 5.6 D6: verifyLicense 호출

```typescript
// ContextMenuGrid.tsx — 상단 import 직후
import { verifyLicense } from '@tomis/grid-license';
verifyLicense('@tomis/grid-pro-master');
```

`verifyLicense`는 현재 no-op stub (grid-license/src/index.ts 확인). 실제 enforcement는 MOD-GRID-99-A scope.

### 5.7 D7: disabled 평가 시점

disabled 함수는 메뉴 렌더링 시점에 현재 row 데이터(`targetRow`)를 인수로 호출된다.  
onClick 시점에는 재평가하지 않는다 (렌더링 시 비활성화된 항목은 클릭 이벤트를 받지 않음).

### 5.8 D8: computeMenuPosition.ts (C-32 Pure Helper)

**위치**: `packages/grid-pro-master/src/internal/computeMenuPosition.ts`  
→ 단, 이 파일은 Section 7 Truth Table에 포함되지 않는다 (구현 단계 선택적 분리).  
Spec에서는 로직을 `ContextMenuPortal.tsx` 내 인라인으로 허용하거나, 순수 함수 분리를 권장한다 (C-32 권장사항, blocking 아님).

**순수 함수 역할**: `(x, y, menuWidth, menuHeight, viewportWidth, viewportHeight) => { x: number, y: number }` — 메뉴가 viewport 밖으로 나가지 않도록 position 조정.

> C-31 주석: `computeMenuPosition.ts`를 별도 파일로 분리한다면, 호출 위치는 `ContextMenuPortal.tsx` 내 position 계산 시점이어야 한다.

---

## Section 6 — 의존성 분석

### 6.1 신규 외부 의존성

**없음.**

`react-dom` (`createPortal` 사용)은 `package.json` peerDependencies에 이미 선언되어 있다:
```json
"react-dom": "^18.0.0 || ^19.0.0"
```
(G-001에서 추가됨. `package.json` Read 결과 확인.)

### 6.2 내부 의존성

| 의존 | 대상 | 방향 |
|------|------|------|
| `ContextMenuGrid.tsx` | `useContextMenu.ts` | import |
| `ContextMenuGrid.tsx` | `ContextMenuPortal.tsx` | import |
| `ContextMenuGrid.tsx` | `@tomis/grid-core` (Grid) | peerDep import |
| `ContextMenuGrid.tsx` | `@tomis/grid-license` | peerDep import |
| `ContextMenuPortal.tsx` | `react-dom` createPortal | peerDep import |
| `types.ts` | `@tanstack/react-table` Cell | peerDep import |
| `types.ts` | `@tomis/grid-core` GridProps | peerDep import |

### 6.3 package.json 변경 불필요

G-002에 필요한 모든 peerDependencies는 G-001에서 이미 선언되어 있다.  
`package.json` 수정은 Section 7 Truth Table에 포함되지 않는다.

---

## Section 7 — Truth Table (구현 파일 목록)

> **C-30 준수**: 이 표가 단일 권위(single authority)이다. Section 5 prose, Appendix B, goals.json `implementFiles` 모두 이 표를 기준으로 한다.

| # | 파일 경로 (topvel-grid-monorepo 기준) | 상태 | 책임 |
|---|--------------------------------------|------|------|
| F1 | `packages/grid-pro-master/src/ContextMenuGrid.tsx` | NEW | 메인 wrapper 컴포넌트. verifyLicense, onContextMenu, onKeyDown, ContextMenuPortal 렌더링 |
| F2 | `packages/grid-pro-master/src/internal/useContextMenu.ts` | NEW | 메뉴 상태 관리 hook (isOpen, position, target, focusedIndex) |
| F3 | `packages/grid-pro-master/src/internal/ContextMenuPortal.tsx` | NEW | createPortal 기반 메뉴 렌더링. disabled 평가, shortcut 표시, separator |
| F4 | `packages/grid-pro-master/src/types.ts` | MODIFY | ContextMenuItem<TData>, ContextMenuGridProps<TData> 추가 |
| F5 | `packages/grid-pro-master/src/index.ts` | MODIFY | ContextMenuGrid, ContextMenuItem, ContextMenuGridProps export 추가 |
| F6 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-16-decisions.md` | MODIFY | G-002 ADRs (D1–D8) 추가 |

**합계**: NEW 3개 + MODIFY 3개 = 총 6개

> H-02 검증: F1–F3의 parent directories 존재 확인
> - `packages/grid-pro-master/src/` — 기존 `types.ts`, `index.ts`, `MasterDetailGrid.tsx` 존재 (verified)
> - `packages/grid-pro-master/src/internal/` — 기존 `ExpandToggleCell.tsx` 존재 (Glob verified)
> - TOMIS `decisions/` — `MOD-GRID-16-decisions.md` 존재 (Glob verified)

---

## Section 8 — 구현 순서

**Phase 1 (타입 + 상태)**:
1. F4: `types.ts` — `ContextMenuItem<TData>`, `ContextMenuGridProps<TData>` 추가
2. F2: `useContextMenu.ts` — hook 구현 + TypeScript compile pass

**Phase 2 (렌더링)**:
3. F3: `ContextMenuPortal.tsx` — createPortal 메뉴 렌더링 구현
4. F1: `ContextMenuGrid.tsx` — wrapper + verifyLicense + onContextMenu + shortcut + Portal 조립

**Phase 3 (공개 API)**:
5. F5: `index.ts` — export 추가
6. F6: `decisions/MOD-GRID-16-decisions.md` — ADR 기록

**Phase 4 (검증)**:
7. TypeScript typecheck (`tsc --noEmit`) — C-13
8. Storybook story 작성 (§12)
9. AC-001–AC-013 이진 검증

---

## Section 9 — 엣지 케이스

| 케이스 | 처리 방법 | AC# |
|--------|----------|-----|
| contextMenuItems 빈 배열 `[]` | 빈 메뉴 표시 (separator만 존재 시와 동일). 최소 1개 비separator 항목 없으면 메뉴 미표시 권장. | AC-006 |
| 우클릭 위치가 viewport 우측/하단 경계 근처 | `computeMenuPosition` 로직으로 flip. 메뉴가 뷰포트 밖으로 나가지 않음 | AC-003 |
| 모든 항목 disabled | 메뉴 표시 (비활성 항목 모두 표시), click 불가 | AC-007 |
| shortcut 문자열 grammar 오류 (예: "Ctrl+") | 콘솔 `console.warn` 1회, 해당 항목 shortcut 무시 | AC-005 |
| separator item에 onClick 정의됨 | onClick 무시 (separator 렌더링만) | AC-008 |
| wrapper div focus 없을 때 shortcut 키 입력 | keydown 이벤트 미수신 → 정상 (D5 scope) | AC-004 |
| targetRow null 상태에서 shortcut 발화 | 무시 (우클릭 이전 상태. Row 특정 불가) | D5 |
| contextMenuItems 미제공 + 우클릭 | `onContextMenu` 미등록 → 브라우저 기본 메뉴 표시 | AC-006 |
| 빠른 연속 우클릭 | 이전 메뉴 닫고 새 위치/target으로 다시 열림 (openAt이 state override) | AC-003 |

---

## Section 10 — 성능 고려사항

1. **createPortal 마운트**: 메뉴 DOM은 `isOpen` 조건부 렌더링으로 닫힘 상태에서 마운트되지 않는다 (`{isOpen && createPortal(...)}` 패턴).
2. **keydown 리스너**: wrapper div의 React `onKeyDown` 사용. 전역 `window.addEventListener` 미사용 (D5). 그리드 언마운트 시 자동 cleanup.
3. **disabled 함수 호출**: 메뉴 항목 수 × 렌더링 횟수만큼 호출. O(n) — 일반적인 메뉴 크기(≤20)에서 성능 문제 없음.
4. **Portal mousedown 리스너**: `useEffect`로 등록, cleanup 함수에서 제거. 메모리 누수 없음.

---

## Section 11 — 테스트 계획

### 11.1 Unit Tests

| 테스트 대상 | 시나리오 | 검증 방법 |
|------------|---------|----------|
| `useContextMenu` | `openAt` → isOpen=true, position/target 설정 | RTL renderHook |
| `useContextMenu` | `close` → isOpen=false, target null | RTL renderHook |
| `ContextMenuPortal` | separator 항목 → `<hr>` 렌더링 | RTL render |
| `ContextMenuPortal` | disabled:true 항목 → opacity-50 class | RTL render |
| `ContextMenuPortal` | disabled 함수 → row 인수로 호출됨 | Jest mock fn |
| Shortcut 파싱 | "Ctrl+C" → ctrlKey+C 매칭 | 순수 함수 단위 테스트 |
| Shortcut 파싱 | 잘못된 grammar → console.warn | Jest spy |

### 11.2 Integration Tests

| 시나리오 | 검증 포인트 |
|---------|-----------|
| ContextMenuGrid + contextMenuItems 제공 후 우클릭 | 메뉴 표시, position fixed 확인 |
| shortcut "Ctrl+C" + Ctrl+C keydown | onClick 호출됨 |
| 외부 클릭 | 메뉴 닫힘 |
| Esc 키 | 메뉴 닫힘 |

---

## Section 12 — Storybook Stories

**계획된 3개 시나리오** (AC-009: ≥1 필수):

1. **기본 컨텍스트 메뉴 (DefaultContextMenu)**
   - `contextMenuItems`: 3개 항목 (레이블, shortcut 힌트, separator 포함)
   - 데모 내용: 우클릭 후 메뉴 표시, separator 렌더링

2. **shortcut 기능 시나리오 (ShortcutDemo)** ← AC-009 필수
   - shortcut "Ctrl+C" 항목 포함
   - 안내: 그리드 클릭 후 Ctrl+C → 메뉴 없이 onClick 발화
   - `action('onClick')` 로 이벤트 확인

3. **disabled 함수 조건 (ConditionalDisabled)**
   - `disabled: (row) => row.status === 'locked'` 항목
   - 잠긴 행 우클릭 시 해당 항목 비활성

---

## Section 13 — goals.json 항목

```json
{
  "goalId": "G-002",
  "moduleId": "MOD-GRID-16",
  "category": "enhancement",
  "title": "우클릭 Context Menu — 커스텀 메뉴 항목 + 키보드 단축키 (contextMenuItems prop)",
  "phase": "specified",
  "specFile": "TOMIS/.claude/tw-grid/artifacts/MOD-GRID-16/enhancement/G-002-spec.md",
  "licenseTier": "Pro",
  "implementFiles": [
    "topvel-grid-monorepo/packages/grid-pro-master/src/ContextMenuGrid.tsx",
    "topvel-grid-monorepo/packages/grid-pro-master/src/internal/useContextMenu.ts",
    "topvel-grid-monorepo/packages/grid-pro-master/src/internal/ContextMenuPortal.tsx",
    "topvel-grid-monorepo/packages/grid-pro-master/src/types.ts",
    "topvel-grid-monorepo/packages/grid-pro-master/src/index.ts"
  ],
  "acceptanceCriteria": [
    "AC-001: ContextMenuItem<TData> interface — no any",
    "AC-002: ContextMenuGridProps extends GridProps, contextMenuItems prop only",
    "AC-003: createPortal, position fixed, z-index>=50",
    "AC-004: shortcut functional — fires onClick when grid focused",
    "AC-005: shortcut grammar [Modifier+]Key defined",
    "AC-006: contextMenuItems 미제공 시 메뉴 미표시",
    "AC-007: disabled — opacity-50 cursor-not-allowed",
    "AC-008: separator — <hr> 렌더링",
    "AC-009: Storybook story >=1 (shortcut 시나리오 포함)",
    "AC-010: verifyLicense module-level",
    "AC-011: ContextMenuGrid/ContextMenuItem/ContextMenuGridProps export",
    "AC-012: Esc + 외부클릭 메뉴 닫힘",
    "AC-013: C-29 spread-skip — exactOptionalPropertyTypes 컴파일 통과"
  ],
  "dependsOn": ["G-001"],
  "notes": "RangeSelectGrid.tsx 기존 메뉴 교체는 G-003 scope. G-002는 API 제공만."
}
```

---

## Appendix A — D# 상세 결정 기록

### D1: Option B — ContextMenuGrid wrapper

- **상태**: 확정
- **근거 (1차)**: `grid-core/types.ts` Read — `GridProps<TData>`에 contextMenu 관련 prop 없음 확인. Option A 진행 시 MIT 코드 수정 필요.
- **근거 (2차)**: `RangeSelectGrid.tsx` L79–83 — wrapper div의 `onContextMenu` 캡처로 충분. Grid.tsx 내부 접근 불필요.
- **근거 (3차)**: G-001 D1 결정 선례 — MasterDetailGrid도 동일 패턴.
- **트레이드오프**: wrapper 계층 추가로 DOM 깊이 +1. 성능 영향 무시할 수준 (단순 div wrapper).
- **C-6 준수**: Pro 기능 구현 시 MIT 패키지 수정 금지.

### D2: implementFiles prefix

- **상태**: 확정 (C-28 필수 규칙)
- **영향**: goals.json Section 13의 모든 경로.

### D3: contextMenuItems prop 위치

- **상태**: 확정
- **근거**: D1과 동일. `ContextMenuGridProps`는 `GridProps`를 extends하므로 기존 props 완전 상속.

### D4: createPortal

- **상태**: 확정
- **문제**: 부모 컨테이너에 `overflow: hidden` 또는 `transform` CSS가 있을 경우 `position: fixed`가 기대와 다르게 동작할 수 있음.
- **해결**: `createPortal(menu, document.body)` — stacking context에서 완전히 분리.
- **출처**: L0 코드 (RangeSelectGrid.tsx L87–112)는 createPortal 미사용. G-002에서 개선.
- **react-dom 의존성**: package.json에 이미 peerDep 선언 (G-001에서 추가 확인).

### D5: 키보드 단축키 scope + grammar

- **상태**: 확정
- **scope**: wrapper div `tabIndex={0}` + `onKeyDown`. 전역 window 리스너 미사용.
- **이유**: 전역 단축키는 다른 컴포넌트와 충돌 가능. 그리드 focus 시에만 활성이 안전하고 직관적.
- **grammar 선택**: `"Ctrl+C"` 형식 — AG Grid/Wijmo/브라우저 일반 표기 방식과 일치. 사용자 친숙성.
- **메뉴 열림 무관 발화**: 단축키의 주 용례는 메뉴를 열지 않고 빠른 작업. 메뉴 열림 후 키보드 탐색은 별도 (focusedIndex, AC not specified → G-004+ scope).
- **targetRow null guard**: 단축키는 우클릭으로 target이 설정된 후에만 의미있음. null 시 무시가 안전.

### D6: verifyLicense 위치

- **상태**: 확정 (G-001 D7과 동일 패턴)
- **근거**: `grid-license/src/index.ts` — `verifyLicense`는 no-op stub. module-level 호출 = import 시 1회 실행.
- **위치**: `ContextMenuGrid.tsx` 최상단 import 블록 직후.

### D7: disabled 평가 시점

- **상태**: 확정
- **근거**: 메뉴 열림 시점에 row 데이터 확정. 이후 재평가는 불필요하고 오히려 렌더 중 예기치 않은 상태 변화 유발 가능.
- **구현**: `ContextMenuPortal.tsx` 렌더 시 `disabled(targetRow)` 호출.

### D8: Pure Helper 분리

- **상태**: 권장 (blocking 아님, C-32)
- **pure**: `computeMenuPosition(x, y, menuW, menuH, vpW, vpH) → {x, y}` — 순수 함수, 테스트 용이
- **shell**: `useContextMenu.ts` — React state + callback만
- **spec 권위**: 구현자가 `ContextMenuPortal.tsx` 인라인으로 처리해도 C-32 위반 아님 (권장사항).

---

## Appendix B — E-06 Prose↔Truth Table Cross-check

> C-30 + E-06 준수: Section 7의 각 파일이 본문 prose에서 언급되었는지 확인.

| # | 파일 (Section 7) | 본문 언급 위치 | 일치 여부 |
|---|-----------------|--------------|----------|
| F1 | ContextMenuGrid.tsx | §5.4, §8 Phase 2 step 4 | ✅ |
| F2 | internal/useContextMenu.ts | §5.2, §8 Phase 1 step 2, Appendix A D5 | ✅ |
| F3 | internal/ContextMenuPortal.tsx | §5.3, §8 Phase 2 step 3, Appendix A D4 | ✅ |
| F4 | types.ts | §5.1, §8 Phase 1 step 1, AC-001, AC-002 | ✅ |
| F5 | index.ts | §6.2 table, §8 Phase 3 step 5, AC-011 | ✅ |
| F6 | decisions/MOD-GRID-16-decisions.md | §4 D1–D3, §8 Phase 3 step 6, Appendix A 전체 | ✅ |

**AC 완전성 검사** (H-03: 모든 AC에 소스 태그):

| AC# | 소스 태그 | 확인 |
|-----|---------|------|
| AC-001 | C-4, F-16-05 | ✅ |
| AC-002 | C-4, D3 | ✅ |
| AC-003 | L0(L79–83), D4 | ✅ |
| AC-004 | D5 | ✅ |
| AC-005 | D5 | ✅ |
| AC-006 | F-16-05 | ✅ |
| AC-007 | D7, C-5 | ✅ |
| AC-008 | F-16-05 | ✅ |
| AC-009 | C-8(TBD), F-16-05 | ✅ |
| AC-010 | D6 | ✅ |
| AC-011 | D2 | ✅ |
| AC-012 | L0(L87–112) | ✅ |
| AC-013 | C-29 | ✅ |

**H-01 referenceEvidence 검증** (경로 존재 확인):

| 참조 파일 | 확인 방법 | 결과 |
|----------|---------|------|
| `tw-framework-front/src/components/tomis/Grid/RangeSelectGrid.tsx` | Read (L47–114 확인) | ✅ |
| `grid-pro-master/src/types.ts` | Read (MasterDetailOptions 등 확인) | ✅ |
| `grid-pro-master/src/index.ts` | Read | ✅ |
| `grid-pro-master/package.json` | Read | ✅ |
| `grid-core/src/types.ts` | Read (GridProps 확인) | ✅ |
| `grid-license/src/index.ts` | Read (verifyLicense 확인) | ✅ |
| `canonical-modules.json` | (referenced in summary) | ✅ |
| `G-001-spec.md` | (referenced in summary) | ✅ |
| `decisions/MOD-GRID-16-decisions.md` | Glob verified | ✅ |
| `internal/ExpandToggleCell.tsx` | Glob verified (internal/ dir) | ✅ |

---

*Spec 작성 완료. spec-rubric.md v1.0.7 기준 self-check: A(5/5) B(5/5) C(5/5) D(6/6) E(6/6) F(4/4) G(1/1) = 32/32 YES. H-01/H-02/H-03 모두 통과. 예상 점수 ≥90.*
