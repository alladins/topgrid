# G-002 Specification: 그룹 헤더 sticky + colSpan + frozenColumns 통합

**Module**: MOD-GRID-14 — Multi-row Header (Column Groups) — TanStack GroupColumnDef 표준화  
**Goal**: G-002 — 그룹 헤더 sticky + colSpan + frozenColumns 통합  
**Priority**: P0  
**Package**: `@tomis/grid-pro-header` (Pro tier, licenseTier: Pro)  
**Spec Version**: 1.0  
**Date**: 2026-05-15  
**Spec Writer**: tw-grid Spec Writer Agent (C-15 위임)

---

## D# 결정 테이블

### D1 결정: implementFiles 경로 prefix 수정 (C-28)

goals.json G-002 `implementFiles`에 기재된 경로 prefix가 잘못되어 있음.

| 항목 | 오류 (goals.json 원본) | 수정 후 |
|------|----------------------|---------|
| prefix | `D:/project/topvel_project/TOMIS/packages/grid-pro-header/` | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/` |
| 근거 | TOMIS 레포에는 `packages/` 디렉터리 없음 (C-28 위반) | `topvel-grid-monorepo/packages/grid-pro-header` 실존 확인 (G-001 spec D1에서 동일 결정) |

**이 spec의 Section 7 implementFiles 표는 수정된 경로를 사용한다.**

### D2 결정: frozenColumns 오프셋 계산 전략

| 항목 | 선택 | 근거 |
|------|------|------|
| 전략 | `column.getStart('left')` (TanStack native) | 그룹 헤더 셀은 여러 leaf를 span하므로 `computeLeftOffset` 단순 합산보다 `getStart()` 이 그룹 셀 기준점을 정확하게 반환함. 크로스-패키지 import 없이 TanStack API 하나로 처리 가능 (C-2 준수). |
| 거부: `computeLeftOffset` 직접 호출 | `grid-core/internal/computePinnedOffset.ts` cross-import | C-21 번들 분리 원칙 — internal 유틸 교차 import는 패키지 경계 위반. |
| EC 보완 | 그룹 헤더 셀(`column.getStart`이 undefined인 경우) | leaf 자식 중 첫 번째의 `column.getStart('left')` 값으로 fallback (EC-05) |

### D3 결정: CSS 변수 기반 sticky top 오프셋

| 항목 | 결정 | 근거 |
|------|------|------|
| Row 0 | `sticky top-0 z-10` (Tailwind) | 최상단 고정, 동적 값 불필요 |
| Row 1 이후 | `sticky z-10` + inline style `top: var(--grid-header-row-height, 40px)` | 헤더 행 높이는 런타임 값(소비자 커스텀 가능) → inline style 허용 예외 (C-5) |
| CSS 변수명 | `--grid-header-row-height` default `40px` | G-001 MultiRowHeader 기존 className 스타일과 일관성 |

### D4 결정: z-index 레이어링

| 상황 | z-class | 이유 |
|------|---------|------|
| 일반 sticky 헤더 행 (frozen 아닌 셀) | `z-10` | scroll 시 tbody 위에 떠있어야 함 |
| frozen 헤더 셀 (enableStickyHeader=false) | `z-20` | 가로 스크롤 시 tbody 위에 떠있어야 함 (sticky 없어도 left 고정) |
| frozen(pinned) + sticky 교차 셀 | `z-30` | frozen 열이 tbody pinned(`z-20`) 위로, sticky 헤더와 교차하는 가장 높은 레이어 |
| tbody frozen 셀 | `z-20` | 참조 (grid-core/computePinnedOffset.ts 패턴, G-002 직접 소유 아님) |

**근거**: `grid-core/src/Grid.tsx` L268 + `computePinnedOffset.ts` z-index 패턴 직접 확인.

---

## Section 1: 현황 분석 (Evidence Base)

### 1.1 L0 — 기존 구현 현황

**파일**: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/BudMast01Page.tsx` L48 (직접 Read 확인)

```typescript
// L48: sticky 헤더 기존 패턴
<thead className="sticky top-0 bg-gray-50 z-10">
```

추가 L0 증거:
- `data-table.tsx` L566: `<thead className="sticky top-0 z-10 bg-gray-800 shadow-sm">`
- `BudRevn01Page.tsx` L280: `<thead className="sticky top-0 bg-gray-50 z-10">`

**결론**: L0에서 단일 헤더 행 sticky 패턴은 이미 확립됨. G-002는 이를 다단 그룹 헤더(G-001 `MultiRowHeader.tsx`)에 적용 + frozenColumns(열 고정) 교차 처리를 추가한다.

### 1.2 L2 — G-001 출력물 (MODIFY 대상)

**`MultiRowHeader.tsx`** (직접 Read 확인, 현재 상태):

```tsx
// L57: <thead> — sticky 없음
<thead className="bg-gray-50">

// L70-94: 헤더 렌더링 — left offset 없음, z-index 없음
{headerGroups.map((headerGroup, rowIndex) => (
  <tr key={headerGroup.id}>
    {headerGroup.headers.map((header) => {
      if (header.isPlaceholder) {
        return <th key={header.id} colSpan={header.colSpan} ... />;
      }
      // leaf: sort handler
      return (
        <th key={header.id} colSpan={header.colSpan} ...>
          {flexRender(...)}
        </th>
      );
    })}
  </tr>
))}
```

**G-002 MODIFY 포인트**:
1. `<thead>` 클래스: `bg-gray-50` → `bg-gray-50` (유지, sticky는 각 `<tr>` 또는 `<th>`에 적용)
2. 각 `<tr>` 또는 `<th>`: sticky + top 오프셋 추가
3. frozen 셀: `position: sticky`, `left` 오프셋, `z-30` 추가

**`types.ts`** (직접 Read 확인):
- 현재: `ColumnGroupConfig`, `MultiRowHeaderProps` export
- G-002 MODIFY: `MultiRowHeaderProps`에 `enableStickyHeader?: boolean`, `frozenColumns?: number` 추가

### 1.3 L1 — TanStack v8 API (G-002 관련)

- `column.getStart('left')`: 해당 컬럼의 left pinned 오프셋(px). leaf 컬럼에만 확실히 존재; 그룹 헤더에서는 첫 번째 leaf의 값 사용 (EC-05).
- `column.getIsPinned()`: `'left' | 'right' | false` — frozen 여부 판별
- `table.getLeftLeafColumns()`: 왼쪽 고정 leaf 컬럼 목록
- `header.column`: `Column<TData>` 인스턴스 — `getStart`, `getIsPinned` 호출 가능
- `header.subHeaders`: 그룹 헤더의 자식 목록 (leaf이면 `[]`)

### 1.4 L3 — 영향 사용처

goals.json `affectedUsageFiles: []` — 0건. G-002는 `MultiRowHeader.tsx` 내부 구현 변경이므로 소비자 API 시그니처 변경 없음 (optional props 추가만).

### 1.5 R-A — AG Grid Community 패턴

AG Grid Community: sticky headers ✅, column pinning ✅ (`publish-aggrid-analysis.md` 확인). 참조 개념만 — 코드 차용 없음 (C-7).

### 1.6 R-W — Wijmo frozenColumns 패턴 (개념 참조만, C-16)

`publish-wijmo-analysis.md §3` 확인:
- `g.frozenColumns = 4` (L76): 처음 4개 컬럼을 스크롤 시 고정
- `hdr.rows[0].allowMerging = true` (L88): 다단 헤더 병합

**개념만 참조**: Wijmo import 및 코드 패턴 차용 금지 (C-16). TanStack `columnPinning` 상태 + `column.getStart('left')` 가 동등한 역할을 한다.

### 1.7 Grid.tsx — 기존 sticky + pinned 패턴 (cross-package 참조)

`grid-core/src/Grid.tsx` L268 (직접 Read 확인):
```tsx
<thead className="bg-gray-50 sticky top-0 z-10">
  ...getPinnedCellStyle(header.column, table, 'thead')...
```

`computePinnedOffset.ts`:
- `getPinnedCellStyle(column, table, scope)` → `{ style: CSSProperties, className: string }`
- scope `'thead'` → z-class `z-30`, scope `'tbody'` → `z-20`

**G-002는 이 함수를 cross-import하지 않는다** (D2 결정). 대신 `column.getStart('left')` 직접 계산 + inline z-class 적용으로 동일 결과를 `grid-pro-header` 내부에서 자급한다.

**migrationImpact**: low (G-001 기반 sticky + frozen offset 보강, affectedUsageFiles 0개, grid-pro-header 내부 결합)

---

## Section 2: 목표 및 사용자 스토리

**G-002 목표**: G-001 `MultiRowHeader`에 sticky 스크롤 고정 기능과 frozenColumns(열 고정) 지원을 추가하여, 그룹 헤더가 세로·가로 스크롤 시에도 항상 가시적이 되도록 한다.

**사용자 스토리**: 페이지 개발자가 `<MultiRowHeader table={table} enableStickyHeader frozenColumns={2} />`를 사용하면:
- 세로 스크롤 시 다단 그룹 헤더 전체가 뷰포트 상단에 고정된다.
- 가로 스크롤 시 첫 2개 컬럼(frozen)이 헤더와 함께 왼쪽에 고정된다.
- 그룹 헤더 셀의 colSpan이 frozen 경계를 넘더라도 올바른 left 오프셋이 계산된다.

**사용자 여정**:
1. `import { MultiRowHeader } from '@tomis/grid-pro-header'`
2. TanStack 테이블 생성: `columnPinning: { left: ['empNo', 'name'] }` 상태 포함
3. `<MultiRowHeader table={table} enableStickyHeader frozenColumns={2} />`
4. 세로 스크롤: 헤더 2행 모두 `sticky top-N` 유지
5. 가로 스크롤: frozen 2열 헤더 셀 `sticky left-N z-30` 유지

---

## Section 3: 수락 기준 (AC) 상세

> 아래 AC는 goals.json G-002 `acceptanceCriteria` 원문 기반. 구현자는 이 텍스트를 그대로 체크한다.

### AC-001: 다단 sticky 헤더 행 (source: C-5)

그룹 헤더 1행: `position: sticky top-0`, z-index 높음.  
컬럼 헤더 2행: `position: sticky top-[첫행높이]`, z-index 중간.  
**Tailwind className만 사용. inline style 원칙적 금지 (C-5).**

- Row 0: `sticky top-0 z-10` (Tailwind)
- Row N (N ≥ 1): `sticky z-10` + inline style `top: calc(var(--grid-header-row-height, 40px) * N)` — 동적 값이므로 C-5 inline style 예외 허용
- `enableStickyHeader` prop 미제공 시: sticky 클래스 없음, 기존 G-001 동작 유지 (breaking: false)

### AC-002: frozenColumns 그룹 헤더 셀 sticky left (source: C-2)

frozenColumns(column pinning) 컬럼이 그룹에 포함된 경우 그룹 헤더 셀도 `sticky left` + 정확한 left offset 계산.

- TanStack `column.getStart('left')` 활용 (C-2 — TanStack native API)
- frozen 여부 판별: `header.column.getIsPinned() === 'left'` (D2 결정 — leafIndex 대신 TanStack native)
- left offset: `header.column.getStart('left')` px 값 → inline style `{ left: '${n}px' }` (동적 값, C-5 예외)
- 그룹 헤더 셀 fallback: `getStart`가 undefined → `header.subHeaders[0]?.column.getStart('left') ?? 0` (EC-05)

### AC-003: 2단 헤더 높이 CSS 변수 조정 가능 (source: C-5)

2단 헤더 높이를 CSS 변수 `--grid-header-row-height`로 조정 가능.  
**inline `calc()` 허용 — 동적 값, C-5 예외.**

- Row 1 top: `calc(var(--grid-header-row-height, 40px) * 1)`
- Row N top: `calc(var(--grid-header-row-height, 40px) * N)`
- CSS 변수 미정의 시: `40px` 기본값 fallback (EC-06)

### AC-004: Wijmo import 0건 (source: C-16)

`@mescius/wijmo*` import 0건. `publish-wijmo-analysis.md §3`의 `g.frozenColumns = 4` 패턴은 개념 참조만. 코드 차용 없음.

### AC-005: TypeScript 빌드 (source: C-12)

`tsc --noEmit` 0 error (`packages/grid-pro-header` 범위). strict 모드, `noImplicitAny: true`.

C-29 exactOptionalPropertyTypes 패턴 준수:
```typescript
// C-29: conditional spread (직접 할당 금지)
const trProps = enableStickyHeader
  ? { className: 'sticky top-0 z-10' }
  : {};
<tr {...trProps} />
```

### AC-006: Storybook story (source: C-25)

story 1개: sticky 2단 헤더 + `frozenColumns=2` 시나리오.  
`@tomis/grid-pro-header` import 기반. TanStack `columnPinning.left` 상태와 연동.

---

## Section 4: 의존성

| 의존성 | 타입 | 이유 |
|--------|------|------|
| `MOD-GRID-14/G-001` | 선행 | `MultiRowHeader.tsx`, `types.ts` 기존 구현 존재 필요 |
| `MOD-GRID-99-A/G-001` | 선행 | grid-license `verifyOrWarn` 함수 필요 (G-001에서 이미 wiring) |
| `@tanstack/react-table` v8 | peerDep | `column.getStart`, `column.getIsPinned` (C-22) |
| `react`, `react-dom` | peerDep | JSX 렌더링 (C-22) |

**C-22 준수**: 모든 runtime 의존성은 peerDependencies. G-002는 신규 dep 추가 없음.

---

## Section 5: API 설계

### 5.1 MultiRowHeaderProps 확장 (types.ts MODIFY)

```typescript
export interface MultiRowHeaderProps<TData = unknown> {
  table: Table<TData>;
  /** true: 다단 헤더 각 행에 sticky 고정 적용 (AC-001) */
  enableStickyHeader?: boolean;
  /**
   * 왼쪽에서 고정할 컬럼 수 (AC-002).
   * TanStack columnPinning.left 상태와 연동하여 left 오프셋 계산.
   * 0 또는 미제공: frozen 비활성
   */
  frozenColumns?: number;
}
```

**C-29 준수**: optional prop이므로 소비자가 prop을 전달하지 않을 때와 `undefined`를 명시적으로 전달할 때 동작이 같아야 함 → conditional spread 패턴 사용 (Section 11.2 참조).

### 5.2 MultiRowHeader.tsx MODIFY 대상 영역

기존 렌더링 구조 유지, 아래 3개 위치만 수정:

**A. `<tr>` sticky 처리 (AC-001)**:
```tsx
{headerGroups.map((headerGroup, rowIndex) => {
  const trStickyClass = enableStickyHeader
    ? rowIndex === 0
      ? 'sticky top-0 z-10'
      : 'sticky z-10'
    : '';
  const trStickyStyle: React.CSSProperties = (enableStickyHeader && rowIndex > 0)
    ? { top: `calc(var(--grid-header-row-height, 40px) * ${rowIndex})` }
    : {};
  return (
    <tr key={headerGroup.id} className={trStickyClass} style={trStickyStyle}>
```

**B. frozen 헤더 셀 처리 (AC-002, AC-003)**:
```tsx
// frozen 여부: TanStack native getIsPinned() 사용 (D2 결정 — leafIndex 카운팅 대신)
// frozenColumns prop은 이 기능의 on/off 스위치 역할;
// 실제 어떤 컬럼이 frozen인지는 TanStack columnPinning 상태에서 판단.
const isFrozen = (frozenColumns ?? 0) > 0 && header.column.getIsPinned() === 'left';
const leftOffset = isFrozen
  ? (header.column.getStart('left') ?? header.subHeaders[0]?.column.getStart('left') ?? 0)
  : undefined;
const thClassName = [
  /* 기존 클래스 */,
  isFrozen && enableStickyHeader ? 'sticky z-30' : '',
  isFrozen && !enableStickyHeader ? 'sticky z-20' : '',
].filter(Boolean).join(' ');
const thStyle: React.CSSProperties = leftOffset !== undefined
  ? { left: `${leftOffset}px` }
  : {};
```

**C. 기존 colSpan 유지 (AC-004)**:
```tsx
<th colSpan={header.colSpan} className={thClassName} style={thStyle}>
```

### 5.3 index.ts — 변경 없음

G-001 `src/index.ts`의 `verifyOrWarn` inline stub은 그대로 유지. G-002는 `index.ts`를 수정하지 않는다.

```typescript
// G-001 기존 (변경 없음)
function verifyOrWarn(_packageName: string): void {
  /* MOD-GRID-99-A/G-002 will implement signature / expiry / domain checks. */
}
verifyOrWarn('@tomis/grid-pro-header');
```

---

## Section 6: 엣지 케이스 (EC)

| ID | 시나리오 | 기대 동작 | 근거 |
|----|---------|-----------|------|
| EC-01 | `enableStickyHeader` 미제공 | sticky 클래스 없음, 기존 G-001 동작 유지 | breaking change 없음 (AC-001) |
| EC-02 | `frozenColumns=0` 또는 미제공 | left 오프셋 없음, z-index 변경 없음 | AC-002 |
| EC-03 | `frozenColumns` > 실제 컬럼 수 | 존재하는 컬럼까지만 frozen 적용, 범위 초과는 무시 | leafIndex 비교로 자동 처리 |
| EC-04 | 3단 이상 중첩 헤더 (`rowIndex >= 2`) | `top: calc(var(--grid-header-row-height, 40px) * N)` 자동 계산 | D3 결정 — N은 rowIndex 값 |
| EC-05 | 그룹 헤더 셀이 frozen 경계를 걸칠 때 | 그룹 셀의 첫 번째 leaf 컬럼 `getStart('left')` 값으로 left 오프셋 결정 | D2 결정 — `header.column.getStart('left')` 가 그룹 셀에서 undefined 반환 시 `header.subHeaders[0]?.column.getStart('left') ?? 0` fallback |
| EC-06 | `--grid-header-row-height` CSS 변수 미정의 | `40px` 기본값 fallback (`calc(var(--grid-header-row-height, 40px) * N)`) | D3 결정 |
| EC-07 | frozen + sticky 비활성(enableStickyHeader=false)에서 frozenColumns 사용 | frozen 열은 `sticky left` 적용(가로 고정), sticky top은 없음. z-index = `z-20` (D4 결정 — frozen-only 행) | D4 결정 |

---

## Section 7: 구현 파일 목록 (implementFiles)

> **D1 prefix 수정 적용**: goals.json의 `TOMIS/packages/` prefix를 `topvel-grid-monorepo/packages/`로 수정.

| # | 파일 경로 | 상태 | 설명 |
|---|---------|------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/src/MultiRowHeader.tsx` | MODIFY | sticky + frozenColumns 오프셋 로직 추가 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/src/types.ts` | MODIFY | `MultiRowHeaderProps`에 `enableStickyHeader`, `frozenColumns` 추가 |

**합계**: NEW 0건, MODIFY 2건  
**번들 영향**: +2 KB (sticky + pinning 오프셋 계산), 한도 ≤ 20 KB (C-21)

---

## Section 8: 영향 사용처 변경 명세 (affectedUsageFiles)

goals.json `affectedUsageFiles: []` — **0건**.

G-002는 `MultiRowHeader` 내부 구현 변경 + optional props 추가만 수행한다. 기존 `<MultiRowHeader table={table} />` 호출은 변경 없이 동작한다 (breaking: false). 소비자가 sticky/frozen을 원할 때만 새 prop을 추가하면 된다.

---

## Section 9: 비기능 요건

### 9.1 번들 크기 (C-21)
- `grid-pro-header` G-001(+5 KB) + G-002(+2 KB) = 총 7 KB, 한도 ≤ 20 KB
- 추가 의존성 없음 → 번들 증분은 순수 로직 코드량

### 9.2 TypeScript (C-4, C-12)
- strict 모드, `noImplicitAny: true`
- `tsc --noEmit` 0 error
- `any` 사용 금지
- C-29 exactOptionalPropertyTypes: conditional spread 패턴 (Section 5.2 참조)

### 9.3 Tailwind + inline style (C-5)
- sticky top/z-index: Tailwind utility class (`sticky top-0 z-10`, `sticky z-10`, `z-30`)
- dynamic top 오프셋 (`calc(var(--grid-header-row-height, 40px) * N)`): inline style 허용 (동적 값 — Tailwind 불가)
- dynamic left 오프셋 (`${leftOffset}px`): inline style 허용 (런타임 px 값 — Tailwind 불가)
- 그 외 모든 스타일: Tailwind만 사용

### 9.4 라이선스 wiring (C-24) — 기존 G-001 재사용

**G-002는 신규 license wiring이 필요 없다.**

G-001 `src/index.ts`에 이미 `verifyOrWarn` inline stub이 존재하며, `verifyOrWarn('@tomis/grid-pro-header')`가 호출되고 있다. G-002는 동일 패키지(`grid-pro-header`)의 기능 확장이므로:

- `index.ts` 수정 없음 — 기존 stub 그대로 유지
- `@tomis/grid-license` peerDependenciesMeta.optional=true — G-001 `package.json`에 이미 설정됨
- 신규 `import { verifyOrWarn } from '@tomis/grid-license'` 실제 import 추가 없음
- 신규 dep 추가 없음

**기존 license wiring 재사용 — 신규 dep 0건.**

---

## Section 10: 호환성 및 마이그레이션

### 10.1 Breaking Change
없음 (breaking: false)

신규 props `enableStickyHeader`, `frozenColumns` 모두 optional. 기존 `<MultiRowHeader table={table} />` 호출은 동작 변경 없음.

### 10.2 Deprecation Strategy (C-6, C-23)
없음. G-002는 기존 API 확장이며 제거/대체 없음.

### 10.3 마이그레이션 경로

```
기존 (G-001): <MultiRowHeader table={table} />
G-002 (sticky 추가): <MultiRowHeader table={table} enableStickyHeader />
G-002 (sticky + frozen): <MultiRowHeader table={table} enableStickyHeader frozenColumns={2} />
```

frozenColumns 사용 시 TanStack columnPinning 상태도 함께 설정 필요:
```typescript
const table = useReactTable({
  ...
  state: { columnPinning: { left: ['empNo', 'name'] } },
  onColumnPinningChange: setColumnPinning,
});
```

---

## Section 11: 구현 가이드라인

### 11.1 MultiRowHeader.tsx MODIFY 원칙

- 기존 G-001 렌더링 구조(`getHeaderGroups()` → `<tr>` → `<th>`) 변경 없음
- **추가만** 허용: sticky className, inline style top/left, z-index className
- `header.colSpan`, `header.isPlaceholder`, `header.subHeaders` 처리 로직 변경 없음
- 기존 sort handler (`!header.subHeaders.length`) 변경 없음

### 11.2 C-29 exactOptionalPropertyTypes 패턴 (AC-006)

optional prop 전달 시 직접 할당 대신 conditional spread 사용:

```typescript
// ✅ 올바른 패턴 (C-29)
const trProps = {
  ...(enableStickyHeader && rowIndex === 0 && { className: 'sticky top-0 z-10' }),
  ...(enableStickyHeader && rowIndex > 0 && {
    className: 'sticky z-10',
    style: { top: `calc(var(--grid-header-row-height, 40px) * ${rowIndex})` },
  }),
};
<tr key={headerGroup.id} {...trProps}>

// ❌ 금지 (exactOptionalPropertyTypes 위반)
<tr className={enableStickyHeader ? 'sticky top-0 z-10' : undefined}>
```

### 11.3 Functional Wiring (C-31)

| 신규 유틸 / 변경 | 호출 위치 | 범위 |
|----------------|---------|------|
| `enableStickyHeader` prop → `<tr>` sticky class | `MultiRowHeader.tsx` 내부 | G-002 |
| `frozenColumns` prop → `<th>` left 오프셋 on/off 스위치 | `MultiRowHeader.tsx` 내부 | G-002 |
| `column.getIsPinned() === 'left'` — frozen 판별 | `MultiRowHeader.tsx` 내부 (D2 결정 — TanStack native) | G-002 |
| `column.getStart('left')` — left px 계산 | `MultiRowHeader.tsx` 내부 (EC-05 fallback 포함) | G-002 |
| `verifyOrWarn` inline stub | `index.ts` (G-001 기존, 변경 없음) | G-001 재사용 |
| `@tomis/grid-license` peerDependenciesMeta | `package.json` (G-001 기존, 변경 없음) | G-001 재사용 |

**신규 wiring**: `MultiRowHeader.tsx` 내부 로직만. 패키지 경계 외부 wiring 없음.

### 11.4 EC-05 fallback 구현 지침

그룹 헤더 셀에서 `header.column.getStart('left')`가 `undefined`인 경우:

```typescript
function getHeaderLeftOffset(header: Header<unknown, unknown>): number {
  const direct = header.column.getStart('left');
  if (direct !== undefined) return direct;
  // 그룹 헤더 fallback: 첫 번째 leaf 자식의 getStart
  const firstLeaf = header.subHeaders[0]?.column;
  return firstLeaf?.getStart('left') ?? 0;
}
```

---

## Section 12: 검증 계획

### 12.1 TypeScript 검증
```powershell
cd D:/project/topvel_project/topvel-grid-monorepo
pnpm --filter @tomis/grid-pro-header typecheck
```
기대: 0 error

### 12.2 번들 크기 검증 (C-21)
```powershell
pnpm --filter @tomis/grid-pro-header build
# dist/index.mjs 크기 확인 — G-001+G-002 합산 ≤ 20 KB
```

### 12.3 시나리오 검증 체크리스트

| 시나리오 | 검증 방법 | 기대 결과 |
|---------|---------|---------|
| `enableStickyHeader` 없음 | 기존 G-001 Storybook story | sticky 클래스 없음 |
| `enableStickyHeader` 단독 | 새 Storybook story: 세로 스크롤 | 헤더 2행 뷰포트 상단 고정 |
| `frozenColumns=2` + sticky | 새 Storybook story: 가로 스크롤 | 첫 2열 헤더 + 바디 고정 |
| 3단 헤더 + sticky | rowIndex=2 시 top 계산 확인 | `top: calc(40px * 2) = 80px` |
| 그룹 셀 frozen 경계 걸침 | EC-05 fallback 확인 | subHeaders[0] getStart 반환 |

### 12.4 Wijmo import 0건 검증 (AC-005)
```powershell
cd D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header
pnpm grep "@mescius/wijmo" src/
# 기대: 0건
```

---

## Section 13: Self-Review 체크리스트 (specify-rubric v1.0.7)

| 항목 | 상태 | 근거 |
|------|------|------|
| A-01 L0 evidence | ✅ | BudMast01Page.tsx L48, BudRevn01Page.tsx L280, data-table.tsx L566 직접 확인 |
| A-02 L1 API | ✅ | `column.getStart('left')`, `column.getIsPinned()`, `getHeaderGroups()` 모두 명시 |
| A-03 L2 현황 | ✅ | MultiRowHeader.tsx L57+L70-94 직접 Read 확인, sticky 없음 명시 |
| A-04 L3 usage | ✅ | affectedUsageFiles 0건, goals.json 확인 |
| A-05 R 참조 | ✅ | AG Grid(R-A), Wijmo(R-W) 양쪽 §1.5/§1.6 명시 |
| B-01 AC verbatim | ✅ | goals.json G-002 acceptanceCriteria 직접 Read 확인 후 §3 AC 제목·내용 동기화. AC-001(sticky 다단 행), AC-002(frozen left offset), AC-003(CSS var calc), AC-004(Wijmo 0건), AC-005(tsc), AC-006(Storybook) 6개 일치 |
| B-02 EC | ✅ | EC-01~EC-07 (7개), frozen 경계(EC-05) 포함 |
| B-03 edge-case | ✅ | EC-05 fallback 구현 지침 §11.4 제공 |
| B-04 dependency | ✅ | MOD-GRID-14/G-001 선행, MOD-GRID-99-A/G-001 선행 명시 |
| B-05 breaking | ✅ | breaking: false, optional props 추가만 |
| C-01 implementFiles | ✅ | MODIFY 2건 (MultiRowHeader.tsx, types.ts), D1 prefix 수정 |
| C-02 bundle | ✅ | +2 KB, 총 7 KB ≤ 20 KB (C-21) |
| C-03 C-5 Tailwind | ✅ | dynamic 값만 inline style, 나머지 Tailwind |
| C-04 C-29 spread | ✅ | §5.2, §11.2 conditional spread 패턴 명시 |
| C-05 C-16 Wijmo ban | ✅ | import 0건, §12.4 검증 포함 |
| D-01 D# table | ✅ | D1(prefix)+D2(offset)+D3(CSS var)+D4(z-index) 4개 |
| D-02 D# 근거 | ✅ | 각 D# 에 "거부: ..." 대안 포함 |
| D-03 wiring table | ✅ | §11.3 Functional Wiring 테이블 |
| D-04 EC fallback | ✅ | EC-05 + §11.4 구현 코드. EC-07 z-index D4 결정과 일관성 확인 (frozen-only = z-20, frozen+sticky = z-30) |
| D-05 검증 계획 | ✅ | §12 검증 계획 4개 항목 |
| D-06 ADR | ✅ | goals.json G-002 implementFiles에 decisions.md 없음 → ADR 추가 없음 (in-spec 주석으로 D# 대체) |
| E-01 C-14 ADR | N/A | goals.json G-002 implementFiles에 decisions.md 포함 안 됨. 기존 ADR-MOD-GRID-14-002(G-001 inline stub 결정)로 충분. |
| E-02 C-22 peerDep | ✅ | 신규 dep 없음, 기존 peerDeps 유지 |
| E-03 C-24 license | ✅ | **기존 license wiring 재사용 — 신규 dep 0건** (§9.4 상세) |
| E-04 C-31 wiring | ✅ | §11.3 wiring 테이블, index.ts 미수정 명시 |
| E-05 C-28 prefix | ✅ | D1 결정 적용, §7 수정된 경로 사용 |
| E-06 검증 가능 | ✅ | §12.1 typecheck, §12.2 build, §12.3 시나리오 체크리스트 |
| F-01 Wijmo 코드 차용 0 | ✅ | §1.6 명시, §12.4 grep 검증 |
| F-02 inline stub 재사용 | ✅ | G-001 index.ts stub 유지 (§5.3, §9.4, §11.3) — 신규 선언 없음 |
| F-03 C-2 TanStack only | ✅ | `column.getStart('left')` TanStack API, cross-import 없음 |
| F-04 시나리오 완성도 | ✅ | §12.3 5개 시나리오 체크리스트 |
| G-01 Self-Review | ✅ | 이 테이블 |

**F-02 상세 (Pro 패키지 inline stub — C-24 Policy)**:
- inline stub 함수 정의 위치: `src/index.ts` (G-001 기존, §5.3 명시)
- 실제 `import { verifyOrWarn } from '@tomis/grid-license'` 없음: ✅ (G-002 수정 파일 아님)
- `@tomis/grid-license` peerDependenciesMeta.optional=true: ✅ (G-001 package.json 기존)
- 환경 제약 ADR: ADR-MOD-GRID-14-002 (G-001 결정, G-002 재사용) ✅
- **결론**: G-002는 기존 패키지 확장이므로 신규 stub 선언 불필요. G-001의 stub을 그대로 상속. **기존 license wiring 재사용 — 신규 dep 0건.**
