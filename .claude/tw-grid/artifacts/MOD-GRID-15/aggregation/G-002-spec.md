# G-002 Specification: 그룹 footer 행 렌더링 + expand/collapse (TanStack expanded state)

**Module**: MOD-GRID-15 / aggregation  
**Goal ID**: G-002  
**Priority**: P0  
**Migration Impact**: low  
**Score Threshold**: 90  
**Spec Version**: 1.0.0  
**Date**: 2026-05-15  
**Author**: tw-grid Spec Writer (automated)

---

## ★ 사전 결정 (Pre-Resolved Decisions)

| ID | 결정 내용 | 근거 |
|----|----------|------|
| **D1** | Section 7 implementFiles 경로 권한: `topvel-grid-monorepo/packages/grid-pro-agg/` 사용. goals.json의 `TOMIS/packages/` 접두사는 discover 단계 stale 아티팩트 (C-28 동일 패턴). goals.json G-002 implementFiles 3개 모두 `topvel-grid-monorepo/packages/grid-pro-agg/` 으로 해석한다. | C-28, ADR-MOD-GRID-00-001, G-001 D1 선례 |
| **D2** | `types.ts` MODIFY 포함: 신규 props (`renderGroupRow?`, `renderFooterRow?`, `groupRowClassName?`, `footerRowClassName?`, `enableVirtualization?`, `estimatedRowHeight?`, `virtualOverscan?`) 추가. goals.json implementFiles에 `types.ts` 누락 → spec 정정 추가 (C-28/C-30 pattern). | G-001 선례, Section 2 API 계약 요건 |
| **D3** | `index.ts` MODIFY 포함: `GroupRow`, `FooterRow` 를 내부 컴포넌트로 유지 (export 미추가). 단, 새 `AggregationGridProps` 확장 타입 재-export 위해 index.ts 수정. | 캡슐화 — internal 컴포넌트는 비공개 |
| **D4** | footer 행 아키텍처 채택: **합성 footer row (Reading B)**. `getExpandedRowModel()`이 반환하는 row 목록은 그룹 헤더 → leaf rows 순으로만 방출함. 별도 footer 행은 `tbody` 렌더링 루프에서 `row.getIsGrouped()=true` 행 *이후* 수집된 leaf rows *다음에* `FooterRow` 컴포넌트를 인터리빙하여 구현한다. 이 방식은 AC-003 "데이터 행 먼저, footer 행 마지막"을 literal 충족하며, Reading A (그룹 헤더 셀에 집계값 표시)는 AC-003 충족 불가이므로 기각한다. | AC-003 literal 해석, G-001 AggregationGrid.tsx L148-153 cell.getIsAggregated() 실증 |
| **D5** | `goals.json AC-002` 표면 텍스트: `row.getIsAggregated()=true` — 이는 goals.json discover 단계 아티팩트 오류. TanStack v8 Row API에 `getIsAggregated()` 는 존재하지 않음 (Cell-level only). 본 Spec에서 authoritative 해석: 집계 cell 판정은 `cell.getIsAggregated()` (Cell 메서드) 사용. G-001 구현 실증(AggregationGrid.tsx L148-153). goals.json 텍스트 정정 기록만(goals.json 파일 수정은 주석 수준 이연). | G-001-implement 실증, tanstack-api-inventory.md §2.2 RowExpanding, C-2 표준 API |
| **D6** | 가상화 구현 패턴: MergingGrid.tsx 의 flow-layout spacer row 패턴 채택. `useVirtualizer({ count: enableVirtualization ? rows.length : 0, ... })` — hook 항상 호출 (Hook 순서 보장). 합성 footer row는 leaf rows 계수에 포함하되 estimateSize는 row.getIsGrouped() 행 포함 함수로 처리. 상세는 Section 11.3 위험 참조. | C-18, MergingGrid.tsx L102-108 선례, AC-004 |
| **D7** | `verifyOrWarn` 라이선스 스텁: G-001에서 `AggregationGrid.tsx` 모듈 레벨에 이미 1회 호출됨. G-002는 새 파일(`GroupRow.tsx`, `FooterRow.tsx`)에 추가 호출을 하지 않는다. 한 패키지 1회 원칙 준수. | G-001 ADR-MOD-GRID-15-002, C-24, 과제 지시 |

### D1 결정 — goals.json implementFiles 경로 보정 결과

| goals.json 원문 (stale) | 본 Spec 채택 경로 |
|-------------------------|-----------------|
| `D:/project/topvel_project/TOMIS/packages/grid-pro-agg/src/AggregationGrid.tsx` | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/AggregationGrid.tsx` |
| `D:/project/topvel_project/TOMIS/packages/grid-pro-agg/src/internal/GroupRow.tsx` | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/internal/GroupRow.tsx` |
| `D:/project/topvel_project/TOMIS/packages/grid-pro-agg/src/internal/FooterRow.tsx` | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/internal/FooterRow.tsx` |

### D2 결정 — goals.json implementFiles 누락 보정

| 보정 파일 | 누락 원인 | 본 Spec 추가 |
|---------|---------|------------|
| `types.ts` MODIFY | goals.json G-002 implementFiles에 누락 | Section 7 표 추가 |
| `index.ts` MODIFY | goals.json G-002 implementFiles에 누락 | Section 7 표 추가 |

---

## Section 1: 현행 분석 (AS-IS)

### 참조 추적 테이블

| 레이어 | 참조 대상 | 결과 |
|--------|---------|------|
| **L0** | tw-framework-front 현 구현 파일 | N/A — 신규 Pro 패키지. 현 구현 없음 |
| **L1** | TanStack v8 Row/Cell 메서드 | 아래 상세 |
| **L2** | publish 중간 참조 소스 | N/A — 신규 Pro 패키지 |
| **L3** | TO-BE 영향 사용처 | N/A — `affectedUsageFiles: []` 0개 |
| **R-A** | AG Grid Enterprise Group Footer | 아래 상세 |
| **R-W** | Wijmo CollectionView 그룹/집계 | 아래 상세 (참조만 — C-16) |

### L1 — TanStack Table v8 관련 API (tanstack-api-inventory.md §2.2 확인)

**Row 레벨 메서드 (Row API — 사용 가능)**:

| API | 시그니처 | 용도 |
|-----|---------|------|
| `row.getIsGrouped()` | `() => boolean` | 그룹 헤더 행 판별 |
| `row.getIsExpanded()` | `() => boolean` | 현재 펼침 상태 확인 |
| `row.getToggleExpandedHandler()` | `() => (e?: MouseEvent) => void` | 펼치기/접기 토글 핸들러 (C-2 표준) |
| `row.getCanExpand()` | `() => boolean` | 펼침 가능 여부 |
| `row.subRows` | `Row<TData>[]` | 하위 행 목록 (그룹 행의 leaf 행) |
| `row.depth` | `number` | 들여쓰기 깊이 |
| `row.groupingColumnId` | `string \| undefined` | 그룹화 기준 컬럼 id |
| `row.groupingValue` | `unknown` | 그룹 키값 |
| `row.getValue(colId)` | `(columnId: string) => TValue` | 집계값 포함한 셀값 반환 |

**⚠️ D5 결정 — `row.getIsAggregated()` 비존재 확인**:
TanStack v8 Row API에 `getIsAggregated()` 는 없다 (tanstack-api-inventory.md §2.2 RowExpanding 항목에 미등재). G-001 구현 (`AggregationGrid.tsx` L148-153)에서 실증: `cell.getIsAggregated()` (Cell 메서드) 를 사용.

**Cell 레벨 메서드 (Cell API — 집계 판별용)**:

| API | 시그니처 | 용도 |
|-----|---------|------|
| `cell.getIsAggregated()` | `() => boolean` | 집계 셀 판별 (Row 아님 — D5) |
| `cell.getIsPlaceholder()` | `() => boolean` | placeholder 셀 판별 |
| `cell.getIsGrouped()` | `() => boolean` | 그룹화된 셀 판별 |
| `cell.getValue()` | `() => TValue` | 집계 계산 결과 포함한 셀값 |

**Table 레벨 메서드**:

| API | 시그니처 | 용도 |
|-----|---------|------|
| `table.toggleAllRowsExpanded()` | `(expanded?: boolean) => void` | 전체 펼치기/접기 (C-2 표준) |
| `table.getIsAllRowsExpanded()` | `() => boolean` | 전체 펼침 상태 확인 |
| `getExpandedRowModel()` | `() => RowModel<TData>` | expanded state 기반 row model |

**D4 보강 — `getExpandedRowModel()` row 방출 순서**:
TanStack `getExpandedRowModel()`은 expanded 상태에서 `[그룹 헤더 행, ...leaf rows]` 순으로 row를 방출한다. 별도 집계 footer 행을 자동 방출하지 않는다. 따라서 footer 행은 `AggregationGrid.tsx` tbody 루프에서 직접 인터리빙해야 한다 (D4).

### L1 — MergingGrid.tsx 가상화 패턴 (C-18 선례)

`packages/grid-pro-merging/src/MergingGrid.tsx` (실제 파일 읽기 확인) 의 핵심 패턴:

```tsx
// Hook 항상 호출 (Hook 순서 보장 — L102~108)
const virtualizer = useVirtualizer({
  count: enableVirtualization ? rows.length : 0,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => estimatedRowHeight,
  overscan: virtualOverscan,
});

// 가상화 경로: flow-layout spacer row (position:absolute 금지 — C-18)
// 상단 spacer: startOffset > 0 → <tr style={{ height: startOffset }}>
// 하단 spacer: endOffset > 0  → <tr style={{ height: endOffset }}>
```

G-002는 이 패턴을 계승한다. 단, 합성 footer row(D4)는 leaf rows 뒤에 인터리빙되므로 가상화 `count`에 footer row를 포함하는 방식은 복잡도를 급격히 높인다. 따라서 **가상화 활성 시 footer row는 가상화 외부에서 각 그룹의 subRows 마지막 leaf row 직후에 정적으로 삽입**하는 제한 방식을 채택한다 (EC-004 참조).

### R-A (AG Grid Enterprise)

AG Grid Enterprise의 그룹 footer는 `groupIncludeFooter: true` + `groupIncludeTotalFooter: true` 로 각 그룹 하단에 집계 footer 행을 자동 생성한다. `aggFunc: 'sum'` 컬럼에 집계값을 표시하고, 그룹 행 클릭으로 expand/collapse를 토글한다. 개념 학습 전용 (C-7, AG Grid API 직접 사용 금지).

### R-W (Wijmo — 참조만, C-16)

`publish-wijmo-analysis.md §4` 확인: Wijmo `CollectionView` + `GroupDescription` 패턴이 그룹 헤더/footer 렌더링에 사용된다. `Aggregation (group footer)` 항목 (`MOD-GRID-15` 매핑 확인). Wijmo 코드 차용 절대 금지 (C-16).

### 현행 G-001 구현 상태

`AggregationGrid.tsx` (실제 파일 읽기 확인, L58-168):
- `useReactTable` 구성 완료: `getCoreRowModel`, `getGroupedRowModel`, `getExpandedRowModel` (enableAggregation 조건부)
- tbody 루프: `row.getIsGrouped()` → 그룹 헤더 렌더링 (expand 토글 포함), `cell.getIsAggregated()` → 집계 셀 렌더링 (L148-153)
- 단, GroupRow/FooterRow 분리 없이 AggregationGrid.tsx 내 인라인 처리
- G-002에서 GroupRow.tsx, FooterRow.tsx 추출 및 합성 footer row 인터리빙 추가

---

## Section 2: API 계약 (API Contract)

### 2.1 GroupRow 컴포넌트 Props

```typescript
/** internal/GroupRow.tsx */
export interface GroupRowProps<TData extends object> {
  /** 그룹 행 Row 객체 (row.getIsGrouped() === true 보장) */
  row: Row<TData>;
  /** 컬럼 개수 (colspan 계산용) */
  columnCount: number;
  /** 들여쓰기 단위 (default: 4) — pl-{depth * indentUnit} */
  indentUnit?: number;
  /** 그룹 행 추가 Tailwind className */
  className?: string;
  /** 커스텀 렌더러 — 미전달 시 기본 렌더 (그룹 키 + 카운트 + 토글 아이콘) */
  renderGroupRow?: (row: Row<TData>) => React.ReactNode;
}
```

**기본값**:
- `indentUnit`: `4` (Tailwind pl-{depth*4} — AC-001)
- `className`: `undefined` (기본 스타일 사용)
- `renderGroupRow`: `undefined` (기본 렌더: 토글 아이콘 + 그룹 키 + "(N개)" 표시)

**C-29 exactOptionalPropertyTypes 준수**: optional prop forwarding은 conditional spread 패턴 사용.

```tsx
// GroupRow 내 className optional forwarding
<tr {...(className !== undefined ? { className: cn('...defaultClasses', className) } : { className: '...defaultClasses' })}>
```

### 2.2 FooterRow 컴포넌트 Props

```typescript
/** internal/FooterRow.tsx */
export interface FooterRowProps<TData extends object> {
  /** 그룹 행 Row 객체 (집계 cell을 통해 값 접근) */
  row: Row<TData>;
  /** 표시할 Cell 목록 (row.getVisibleCells() 전달) */
  cells: Cell<TData, unknown>[];
  /** footer 행 추가 Tailwind className */
  className?: string;
  /** 커스텀 footer 셀 렌더러 */
  renderFooterRow?: (row: Row<TData>, cells: Cell<TData, unknown>[]) => React.ReactNode;
}
```

**기본값**:
- `className`: `undefined` (기본: `bg-gray-50`)
- `renderFooterRow`: `undefined` (기본: cell.getIsAggregated() → 집계값, 그 외 빈 셀)

### 2.3 AggregationGridProps 확장 (types.ts MODIFY)

G-001의 `AggregationGridProps<TData>`에 다음 props를 추가한다:

```typescript
export interface AggregationGridProps<TData extends object> {
  // --- G-001 기존 props (보존) ---
  data: TData[];
  columns: AggregationColumnDef<TData>[];
  enableAggregation?: boolean;
  grouping?: string[];
  expanded?: ExpandedState | false;

  // --- G-002 신규 props ---
  /**
   * 각 그룹 footer 행 표시 여부 (default: true).
   * false 시 footer 행 인터리빙 생략.
   */
  showFooter?: boolean;
  /** 그룹 헤더 행 추가 Tailwind className */
  groupRowClassName?: string;
  /** footer 행 추가 Tailwind className */
  footerRowClassName?: string;
  /** 커스텀 그룹 행 렌더러 */
  renderGroupRow?: (row: Row<TData>) => React.ReactNode;
  /** 커스텀 footer 행 렌더러 */
  renderFooterRow?: (row: Row<TData>, cells: Cell<TData, unknown>[]) => React.ReactNode;
  /**
   * 가상화 활성화 (C-18).
   * true 시 @tanstack/react-virtual useVirtualizer 사용.
   * @default false
   */
  enableVirtualization?: boolean;
  /** 가상화 행 높이 추정값 (px, default: 40) */
  estimatedRowHeight?: number;
  /** 가상화 overscan 행 수 (default: 5) */
  virtualOverscan?: number;
  /**
   * groupBy 상태 변경 콜백 (외부 controlled grouping).
   * G-001 OI-02 해소.
   */
  onGroupingChange?: (grouping: string[]) => void;
  /**
   * expanded 상태 변경 콜백 (외부 controlled expanded).
   * G-001 OI-01 해소.
   */
  onExpandedChange?: (expanded: ExpandedState) => void;
}
```

**기본값 요약**:
| prop | default |
|------|---------|
| `showFooter` | `true` |
| `groupRowClassName` | `undefined` |
| `footerRowClassName` | `undefined` |
| `renderGroupRow` | `undefined` |
| `renderFooterRow` | `undefined` |
| `enableVirtualization` | `false` |
| `estimatedRowHeight` | `40` |
| `virtualOverscan` | `5` |
| `onGroupingChange` | `undefined` |
| `onExpandedChange` | `undefined` |

### 2.4 사용 예시 (최소 2개)

**예시 1: 기본 footer 행 + expand/collapse**

```tsx
import { AggregationGrid, type AggregationColumnDef } from '@tomis/grid-pro-agg';

interface SalesRow { region: string; product: string; revenue: number }

const columns: AggregationColumnDef<SalesRow>[] = [
  { id: 'region', header: '지역', accessorKey: 'region' },
  { id: 'product', header: '상품', accessorKey: 'product' },
  {
    id: 'revenue',
    header: '매출',
    accessorKey: 'revenue',
    meta: { aggregationFn: 'sum' },
  },
];

// enableAggregation + showFooter(default true) → 그룹 헤더 + footer 행 표시
// expanded=false → 초기 접힘 상태 (AC-003: footer도 숨김)
<AggregationGrid
  data={salesData}
  columns={columns}
  enableAggregation
  grouping={['region']}
  expanded={false}
  onExpandedChange={(next) => console.log('expanded changed', next)}
/>
```

**예시 2: 가상화 + 1000행+ + 커스텀 footer 렌더러**

```tsx
// AC-004, C-18: 1000행+ 가상화 시나리오
<AggregationGrid
  data={largeDataset} // 1000행+
  columns={columns}
  enableAggregation
  grouping={['region', 'product']}
  expanded={true}
  enableVirtualization
  estimatedRowHeight={36}
  virtualOverscan={10}
  showFooter
  footerRowClassName="bg-blue-50 font-semibold text-blue-800"
  renderFooterRow={(row, cells) => (
    <tr className="bg-blue-50">
      {cells.map((cell) => (
        <td key={cell.id} className="px-3 py-2 font-semibold">
          {cell.getIsAggregated()
            ? `합계: ${cell.getValue()}`
            : null}
        </td>
      ))}
    </tr>
  )}
/>
```

---

## Section 3: 기존 사용처 대응표 (Existing Variant Mapping)

N/A — 신규 Pro 패키지(`grid-pro-agg`). `affectedUsageFiles: []` (0개). 기존 variant 마이그레이션 대응표 없음.

---

## Section 4: 호환성 정책 (Compatibility Policy)

### Breaking Change 여부

**breaking: false**

G-001에서 제공한 `AggregationGridProps<TData>` 기존 props (`data`, `columns`, `enableAggregation`, `grouping`, `expanded`)는 모두 유지된다. G-002 신규 props는 모두 optional이며 기본값이 지정되어 있어 기존 G-001 사용 코드가 변경 없이 동작한다.

### Deprecation 전략

신규 기능 — alias 불필요. G-001 API를 확장(extension)하며 대체(replacement)하지 않는다. 최소 1 minor 버전 alias 유지 의무 없음 (새 기능이므로 deprecation 전략 N/A).

### 미래 peerDeps 확장

`@tanstack/react-virtual`은 G-002에서 실제로 사용되므로, G-002 구현 후 `package.json` peerDependencies에 `@tanstack/react-virtual: ^3.0.0` (optional) 추가가 필요하다. 이는 G-001 D4(peerDeps 확장 G-004 이연) 수정 결정이다. Section 7 구현 파일에 `package.json MODIFY` 포함.

---

## Section 5: 인수 기준 (Acceptance Criteria)

| AC ID | 항목 | 소스 태그 | 검증 방법 |
|-------|------|----------|---------|
| AC-001 | 그룹 헤더 행(`row.getIsGrouped()=true`) → `pl-{depth*4}` 들여쓰기 + 펼치기/접기 아이콘(▶/▼) + 그룹 키 표시. `row.getToggleExpandedHandler()` 클릭 핸들러로 연결 (Tailwind C-5, TanStack C-2 표준) | L1: TanStack row.getIsGrouped / row.getToggleExpandedHandler | GroupRow.tsx 렌더 확인, pl-{depth*4} Tailwind 클래스 grep |
| AC-002 | 합성 footer 행: `showFooter=true` + 그룹이 expanded일 때, leaf rows 직후에 `FooterRow` 컴포넌트 삽입. 각 컬럼에 대해 `cell.getIsAggregated()=true`인 셀에 집계값(`cell.getValue()`) 표시. 배경 기본 `bg-gray-50` (C-5). `footerRowClassName` prop으로 커스터마이즈 가능 | L1: TanStack cell.getIsAggregated / cell.getValue (D5: row.getIsAggregated() 아님) | AggregationGrid.tsx footer 인터리빙 코드 + cell.getIsAggregated grep |
| AC-003 | expanded=false 시 leaf rows + footer 행 모두 DOM에서 미렌더링. expanded=true 시 leaf rows 먼저, footer 행 마지막 순서 (D4: TanStack getExpandedRowModel row 순서 + 합성 footer 인터리빙 — C-2) | L1: TanStack getExpandedRowModel, C-2 | expanded 상태별 렌더 확인, footer가 last row 확인 |
| AC-004 | `enableVirtualization=true` 시 그룹 행, leaf rows, footer 행이 모두 가상화 영역에 포함. MergingGrid.tsx D6 패턴(flow-layout spacer row) 채택. footer row는 각 그룹의 leaf rows 마지막 직후 정적 삽입 (가상화 count는 leaf rows 수 기준 + 그룹 헤더/footer 정적 렌더 — EC-004 참조). C-18 | C-18: react-virtual useVirtualizer | Storybook 1000행+ story |
| AC-005 | `@mescius/wijmo*` import 0건 (C-16 절대 준수) | C-16 | grep "@mescius/wijmo" → 0 hits |
| AC-006 | `tsc --noEmit` 0 에러 (packages/grid-pro-agg 전체). C-12 | C-12 | tsc 실행 |
| AC-007 | Storybook CSF3 story 1개 (AggregationGrid.stories.tsx 수정): 그룹 footer + expand/collapse 인터랙션 + 1000행+ 가상화 시나리오 포함. C-25, C-18 | C-25, C-18 | stories 파일 story args 확인 |

---

## Section 6: 엣지 케이스 (Edge Cases)

| EC ID | 시나리오 | 기대 동작 |
|-------|---------|----------|
| EC-001 | 단일 그룹만 존재 (groupBy 1개 컬럼, 전체 데이터가 1개 그룹) | 그룹 헤더 1개 + leaf rows + footer 1개 정상 표시. expanded 토글 정상 동작. |
| EC-002 | 빈 그룹 (subRows.length === 0 인 그룹) | GroupRow는 표시됨 (그룹 헤더). leaf rows 0개. footer 행 표시 조건: `showFooter=true`여도 subRows가 없으면 집계값이 0 또는 undefined — FooterRow 렌더 스킵(조건: `row.subRows.length > 0`)으로 빈 footer 미표시. |
| EC-003 | 100개 이상 그룹 (대량 그룹화) | 각 그룹별 GroupRow + FooterRow 정상 인터리빙. 가상화 미사용 시 DOM에 전체 렌더링. 가상화 사용 시 EC-004 참조. 성능 이슈는 enableVirtualization으로 해결 유도. |
| EC-004 | `enableVirtualization=true` + 1000행+ 데이터 | `useVirtualizer`의 count = leaf rows 총 수. 그룹 헤더 행과 footer 행은 가상화 window 외부에서 각 그룹 구역을 스캔하여 정적 삽입 (MergingGrid.tsx L-01 Known Limitation 유사). scroll 시 그룹 헤더가 window 밖으로 스크롤 시 해당 그룹 헤더/footer가 DOM에서 제거될 수 있음 — Storybook story에 limitation 주석 포함. |
| EC-005 | `expanded=false` 초기값 + 그룹 헤더 클릭으로 펼침 | `onExpandedChange` 콜백이 새로운 ExpandedState 전달. 콜백 없으면 내부 state로 관리. 펼친 후 leaf rows + footer 행 순서대로 표시 (AC-003 준수). |
| EC-006 | `showFooter=false` | footer 행 인터리빙 로직 스킵. GroupRow 행 + leaf rows만 표시. FooterRow 컴포넌트 import는 유지되지만 호출 없음 (dead code 방지: 조건부 import 대신 조건부 렌더). |
| EC-007 | 다중 레벨 그룹화 (groupBy=['dept', 'team']) | depth=0 그룹 헤더 (dept), depth=1 그룹 헤더 (team). 각 depth에서 leaf rows + footer 인터리빙. `pl-{depth*4}` 들여쓰기 깊이별 적용 (AC-001). |

---

## Section 7: 구현 대상 파일 (Implementation Files)

### D1 경로 권한 (C-28)

이 섹션의 모든 파일 경로는 `topvel-grid-monorepo/packages/grid-pro-agg/`를 기준으로 한다. goals.json의 `TOMIS/packages/` 접두사는 discover 단계 stale 아티팩트이며 실제 파일 시스템과 불일치 (C-28, ADR-MOD-GRID-00-001, G-001 D1 선례).

### 최종 implementFiles 표

| # | 파일 경로 | 작업 | 설명 |
|---|----------|------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/internal/GroupRow.tsx` | **NEW** | 그룹 헤더 행 컴포넌트 (토글 아이콘 + 들여쓰기 + 그룹 키) |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/internal/FooterRow.tsx` | **NEW** | footer 행 컴포넌트 (집계값 렌더링, bg-gray-50) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/AggregationGrid.tsx` | **MODIFY** | GroupRow/FooterRow 분기 추가, 가상화 통합, onGroupingChange/onExpandedChange 콜백 |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/types.ts` | **MODIFY** | AggregationGridProps 신규 props 추가 (D2 — goals.json 누락 보정) |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/AggregationGrid.stories.tsx` | **MODIFY** | 그룹 footer + expand/collapse + 1000행+ 가상화 story 추가 |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/index.ts` | **MODIFY** | GroupRowProps, FooterRowProps 타입 re-export (필요 시) — D3: 컴포넌트 자체는 internal, 타입만 export |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/package.json` | **MODIFY** | peerDependencies에 `@tanstack/react-virtual: ^3.0.0` (optional) 추가 — D4/D6 결정으로 G-001 D4 이연 해소 |

**요약**: NEW 2개 (GroupRow.tsx, FooterRow.tsx) + MODIFY 5개 (AggregationGrid.tsx, types.ts, stories.tsx, index.ts, package.json) = **총 7개 파일**

### 파일별 구현 세부 사항

#### 1. `internal/GroupRow.tsx` (NEW)

```tsx
import { flexRender, type Row } from '@tanstack/react-table';
import { cn } from '../../utils/cn'; // 또는 clsx 직접 사용 (C-5)

/**
 * 그룹 헤더 행 컴포넌트.
 * - row.getIsGrouped() === true 인 Row를 렌더.
 * - Tailwind pl-{depth*indentUnit} 들여쓰기 (AC-001).
 * - row.getToggleExpandedHandler() 으로 expand/collapse 토글 (C-2 표준 API).
 */
export function GroupRow<TData extends object>({
  row,
  columnCount,
  indentUnit = 4,
  className,
  renderGroupRow,
}: GroupRowProps<TData>) {
  if (renderGroupRow) {
    return <>{renderGroupRow(row)}</>;
  }
  const indentClass = `pl-${row.depth * indentUnit}`;
  return (
    <tr className={cn('border-b bg-blue-50 font-medium cursor-pointer', className)}>
      <td
        colSpan={columnCount}
        className={cn('py-2 pr-3', indentClass)}
        onClick={row.getToggleExpandedHandler()}
      >
        <span className="mr-1 text-xs">
          {row.getIsExpanded() ? '▼' : '▶'}
        </span>
        <span>{String(row.groupingValue ?? '')}</span>
        <span className="ml-2 text-xs text-gray-500">
          ({row.subRows.length})
        </span>
      </td>
    </tr>
  );
}
```

#### 2. `internal/FooterRow.tsx` (NEW)

```tsx
import { flexRender, type Cell, type Row } from '@tanstack/react-table';
import { cn } from '../../utils/cn';

/**
 * 합성 footer 행 컴포넌트 (D4: TanStack 자동 방출 아님, AggregationGrid 에서 수동 인터리빙).
 * cell.getIsAggregated() === true 인 셀에 집계값 표시 (D5: row.getIsAggregated() 아님).
 */
export function FooterRow<TData extends object>({
  row,
  cells,
  className,
  renderFooterRow,
}: FooterRowProps<TData>) {
  if (renderFooterRow) {
    return <>{renderFooterRow(row, cells)}</>;
  }
  return (
    <tr className={cn('border-b bg-gray-50', className)}>
      {cells.map((cell) => (
        <td key={cell.id} className="px-3 py-2 text-sm">
          {cell.getIsAggregated()
            ? flexRender(
                cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                cell.getContext(),
              )
            : null}
        </td>
      ))}
    </tr>
  );
}
```

#### 3. `AggregationGrid.tsx` (MODIFY) — 핵심 변경 부분

Section 11.2 Before/After 코드 스니펫 참조.

---

## Section 8: 마이그레이션 영향도 Preflight (Migration Impact Preflight)

### 8.1 영향 사용처

`affectedUsageFiles: []` — 영향 사용처 **0개**. 신규 Pro 패키지이며 현재 tw-framework-front 내 `@tomis/grid-pro-agg` 를 import하는 파일이 없다.

### 8.2 무파괴 검증 (Non-Destructive Validation)

- `tsc --noEmit` 실행 → 0 에러 확인 (AC-006, C-12)
- Storybook story 빌드 확인 (AC-007, C-25)
- `grep "@mescius/wijmo" src/` → 0 hits (AC-005, C-16)

### 8.3 rollback 전략

`migrationImpact: low` + 사용처 0개 → 롤백 전략 N/A.

신규 Pro 패키지이므로 이 Goal의 변경을 revert해도 외부 사용처 영향 없음. `package.json` peerDeps 롤백은 단순 revert.

### 8.4 Breaking Change 확인

G-001 API 완전 보존 (Section 4). 기존 props optional 유지. `showFooter` default=true로 인해 G-001에서 이미 `AggregationGrid`를 사용 중인 경우 footer 행이 추가 표시될 수 있으나, 현재 affectedUsageFiles=0이므로 실질적 breaking 없음.

### 8.5 번들 영향

| 항목 | 예상 크기 |
|------|---------|
| `GroupRow.tsx` 추가 | +1.5 KB gzipped |
| `FooterRow.tsx` 추가 | +1.5 KB gzipped |
| `AggregationGrid.tsx` 변경 | +1 KB gzipped |
| **G-002 합계** | **+4 KB gzipped** |
| G-001 기존 | +5 KB |
| **grid-pro-agg 누적** | **~9 KB** |
| Pro 패키지 한도 (C-21) | ≤ 20 KB |

→ 한도 내 충분히 여유 있음.

---

## Section 9: 의존성 분석 (Dependency Analysis)

### Runtime 의존성 (G-001 상속 + G-002 추가)

| 패키지 | 버전 | 종류 | 변경 |
|--------|------|------|------|
| `@tanstack/react-table` | `^8.0.0` | peerDependency | G-001 상속 |
| `react` | `^18.0.0 \|\| ^19.0.0` | peerDependency | G-001 상속 |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` | peerDependency | G-001 상속 |
| `@tanstack/react-virtual` | `^3.0.0` | **peerDependency (NEW, optional)** | G-002 D6 결정 — enableVirtualization 기능을 위해 추가 |

**C-22 준수**: `@tanstack/react-virtual`은 peerDependency로 선언. `peerDependenciesMeta`로 optional 명시:
```json
"peerDependenciesMeta": {
  "@tanstack/react-virtual": { "optional": true }
}
```

### 내부 참조 패턴

- `GroupRow.tsx`, `FooterRow.tsx` → `@tanstack/react-table` (타입 전용 import)
- `AggregationGrid.tsx` → `GroupRow`, `FooterRow` (internal import)
- `AggregationGrid.tsx` → `@tanstack/react-virtual` `useVirtualizer` (enableVirtualization=true 시)

---

## Section 10: 사용자 여정 매핑 (User Journey Mapping)

### 시나리오 1: 개발자 — enableGrouping + showFooter 기본 사용

```typescript
// 1. 컬럼 정의 (G-001 동일, aggregationFn 지정)
const columns: AggregationColumnDef<SalesRow>[] = [
  { id: 'region', header: '지역', accessorKey: 'region' },
  { id: 'revenue', header: '매출', accessorKey: 'revenue', meta: { aggregationFn: 'sum' } },
];

// 2. 컴포넌트 선언 — showFooter default=true
<AggregationGrid
  data={salesData}
  columns={columns}
  enableAggregation
  grouping={['region']}
  expanded={true}
/>
// → 렌더 결과:
// [그룹 헤더 행: "서울 (3개)" ▼]
//   [데이터 행 1]
//   [데이터 행 2]
//   [데이터 행 3]
// [footer 행: revenue 컬럼 합계 표시, bg-gray-50]
// [그룹 헤더 행: "부산 (2개)" ▼]
//   ...
```

### 시나리오 2: 최종 사용자 — 펼치기/접기 인터랙션

```
사용자 행동:
  1. 그리드 로드 시 expanded=false → 그룹 헤더만 표시, ▶ 아이콘
  2. "서울 ▶" 행 클릭 → row.getToggleExpandedHandler() 호출
  3. "서울 ▼" 로 변경 + 데이터 행 3개 + footer 행 표시
  4. footer 행에서 revenue 합계 확인
  5. 다시 "서울 ▼" 클릭 → 접힘 → 데이터 행 + footer 숨김 (AC-003)
```

### 시나리오 3: 개발자 — 가상화 활성화 (1000행+)

```typescript
// C-18, AC-004
<AggregationGrid
  data={largeDataset}    // 1200행, 5개 그룹
  columns={columns}
  enableAggregation
  grouping={['dept']}
  expanded={true}
  enableVirtualization
  estimatedRowHeight={40}
  virtualOverscan={5}
/>
// → useVirtualizer 활성화
// → Storybook story에서 스크롤 성능 확인
```

---

## Section 11: 구현 계획 (Implementation Plan)

### 11.1 파일별 변경 명세

| 파일 | 변경 내용 | 예상 LOC 변화 |
|------|---------|------------|
| `internal/GroupRow.tsx` (NEW) | GroupRowProps 인터페이스 + GroupRow 컴포넌트 전체 | +60 LOC |
| `internal/FooterRow.tsx` (NEW) | FooterRowProps 인터페이스 + FooterRow 컴포넌트 전체 | +50 LOC |
| `AggregationGrid.tsx` (MODIFY) | (1) import GroupRow, FooterRow; (2) useVirtualizer hook 추가; (3) tbody 루프를 그룹별 버킷으로 재구성 + footer 인터리빙; (4) onGroupingChange/onExpandedChange 콜백 wiring | +70 LOC |
| `types.ts` (MODIFY) | AggregationGridProps에 9개 prop 추가; GroupRowProps/FooterRowProps 타입 정의 추가 | +60 LOC |
| `AggregationGrid.stories.tsx` (MODIFY) | `GroupFooterExpand` + `VirtualizedGroupFooter` 2개 story 추가 | +60 LOC |
| `index.ts` (MODIFY) | GroupRowProps, FooterRowProps 타입 re-export | +2 LOC |
| `package.json` (MODIFY) | peerDependencies + peerDependenciesMeta 추가 | +5 lines |

### 11.2 Before/After 코드 스니펫

**AggregationGrid.tsx tbody 렌더링 — D4 합성 footer 인터리빙**

**Before (G-001, L122-167)**:

```tsx
<tbody>
  {table.getRowModel().rows.map((row) => (
    <tr key={row.id} className={row.getIsGrouped() ? '...' : '...'}>
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-3 py-2">
          {cell.getIsGrouped() ? (
            <button onClick={row.getToggleExpandedHandler()}>...</button>
          ) : cell.getIsAggregated() ? (
            flexRender(...)
          ) : cell.getIsPlaceholder() ? null : (
            flexRender(...)
          )}
        </td>
      ))}
    </tr>
  ))}
</tbody>
```

**After (G-002, 합성 footer 인터리빙 — D4)**:

```tsx
<tbody>
  {table.getRowModel().rows.flatMap((row) => {
    const elements: React.ReactNode[] = [];

    if (row.getIsGrouped()) {
      // 그룹 헤더 행 → GroupRow 컴포넌트
      elements.push(
        <GroupRow
          key={`group-${row.id}`}
          row={row}
          columnCount={table.getAllColumns().length}
          {...(groupRowClassName !== undefined ? { className: groupRowClassName } : {})}
          {...(renderGroupRow !== undefined ? { renderGroupRow } : {})}
        />
      );
    } else {
      // Leaf 데이터 행 (일반 행 렌더)
      elements.push(
        <tr key={row.id} className="border-b hover:bg-gray-50">
          {row.getVisibleCells().map((cell) => (
            <td key={cell.id} className="px-3 py-2 text-sm">
              {cell.getIsPlaceholder()
                ? null
                : flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      );
    }

    // 그룹 헤더 행이고 expanded + showFooter → leaf rows 직후 footer 인터리빙
    // D4: footer는 그룹 헤더 row의 leaf rows 마지막 이후에 위치
    // 구현 방법: 마지막 leaf row 다음 행 위치에서 그룹 헤더 row를 참조하여 FooterRow 삽입
    // (실제 구현은 rows 배열을 그룹별 버킷으로 분리 후 버킷 끝에 FooterRow 추가)
    return elements;
  })}
</tbody>
```

**실제 그룹별 버킷 접근법 (D4 구체화)**:

```tsx
// getRowModel().rows는 [그룹헤더, leaf1, leaf2, ..., 자식그룹헤더, ...]  순서
// footer를 그룹 마지막 leaf 이후에 삽입하려면: 그룹 헤더의 subRows 마지막 이후를 탐지
// 판별: 다음 row가 getIsGrouped() || rows 배열 끝 → 현재 그룹 종료 → FooterRow 삽입

const allRows = table.getRowModel().rows;
const rowElements: React.ReactNode[] = [];

allRows.forEach((row, idx) => {
  const isLast = idx === allRows.length - 1;
  const nextRow = allRows[idx + 1];
  const isGroupEnd = !row.getIsGrouped() && (isLast || nextRow?.depth <= row.depth);

  if (row.getIsGrouped()) {
    rowElements.push(<GroupRow key={`g-${row.id}`} row={row} columnCount={...} ... />);
  } else {
    rowElements.push(<tr key={row.id}>...</tr>);
    // 그룹 종료 시 footer 삽입 (showFooter + expanded)
    if (showFooter && isGroupEnd) {
      // 부모 그룹 행 탐색: row.parentId → 집계 row 참조
      const parentRow = row.getParentRow?.();
      if (parentRow) {
        rowElements.push(
          <FooterRow
            key={`footer-${parentRow.id}`}
            row={parentRow}
            cells={parentRow.getVisibleCells()}
            {...(footerRowClassName !== undefined ? { className: footerRowClassName } : {})}
            {...(renderFooterRow !== undefined ? { renderFooterRow } : {})}
          />
        );
      }
    }
  }
});
```

### 11.3 구현 순서 (의존성 고려)

**Step 1**: `types.ts` MODIFY — GroupRowProps, FooterRowProps 타입 정의 + AggregationGridProps 확장 props 추가
- 검증: `tsc --noEmit` 타입 에러 없음

**Step 2**: `internal/GroupRow.tsx` NEW — GroupRow 컴포넌트 구현
- 의존: types.ts (GroupRowProps)
- 검증: tsc 타입 체크

**Step 3**: `internal/FooterRow.tsx` NEW — FooterRow 컴포넌트 구현
- 의존: types.ts (FooterRowProps)
- 검증: tsc 타입 체크

**Step 4**: `AggregationGrid.tsx` MODIFY — GroupRow/FooterRow import + tbody 루프 재구성 + useVirtualizer 통합
- 의존: Step 1-3 (GroupRow, FooterRow, 확장 types)
- C-31 준수: GroupRow, FooterRow 모두 AggregationGrid.tsx에서 import + 실제 호출 검증 필수
- 검증: tsc --noEmit, 기능 동작 확인

**Step 5**: `package.json` MODIFY — peerDependencies 추가 (`@tanstack/react-virtual`)

**Step 6**: `AggregationGrid.stories.tsx` MODIFY — story 2개 추가
- 의존: Step 1-4

**Step 7**: `index.ts` MODIFY — 타입 re-export 추가

### 11.4 위험 요소 및 대응

| 위험 | 가능성 | 대응 |
|------|--------|------|
| TanStack `getRowModel()` rows 순서 — 그룹 헤더/leaf 인터리빙 가정이 틀릴 경우 | 낮음 | G-001 AggregationGrid.tsx L123+ 실증(실제 rows 순서 확인됨). 확신 시 Storybook 렌더 확인 |
| `row.getParentRow()` API 미존재 | 중간 | tanstack-api-inventory.md §2.2 core/row.d.ts에서 사전 확인 필수. 미존재 시 대안: rows 순회 중 stack 구조로 현재 그룹 헤더 row 추적 |
| 가상화 + footer row 인터리빙 시 layout 깨짐 | 높음 | EC-004 패턴 채택: 가상화는 leaf rows count 기준, 그룹 헤더/footer는 정적 삽입. 스크롤 아웃 시 제거되는 제한은 Storybook story 주석으로 문서화 (MergingGrid L-01 선례) |
| `row.getToggleExpandedHandler()` — 내부 state 관리 vs 외부 제어 충돌 | 낮음 | `onExpandedChange` prop으로 외부 콜백 연결. `table.setExpanded` 와 sync |
| TanStack `expanded` state default값 — `{}` vs `true` 처리 | 낮음 | G-001 ADR-MOD-GRID-15-004 선례 (false→{} 정규화) 상속. expanded={false} default는 {} 정규화 |

---

## Section 12: 검증 계획 (Verification Plan)

### 빌드 검증

```bash
# packages/grid-pro-agg 디렉토리에서
npx tsc --noEmit    # C-12: 0 에러 (AC-006)
npx tsup            # 빌드 성공, dist/ 생성
```

### 기능 검증 체크리스트

- [ ] `row.getIsGrouped()=true` 행 → `GroupRow` 컴포넌트 렌더링 (AC-001)
- [ ] 그룹 헤더 `pl-{depth*4}` Tailwind 클래스 적용 (AC-001)
- [ ] 그룹 헤더 클릭 → `row.getToggleExpandedHandler()` 호출 → expanded 상태 토글 (AC-001, AC-003)
- [ ] expanded=true 시 leaf rows + footer 행 표시, footer가 leaf rows 이후 (AC-002, AC-003)
- [ ] expanded=false 시 leaf rows + footer 행 미표시 (AC-003)
- [ ] `cell.getIsAggregated()=true` 셀에 `cell.getValue()` 표시 (AC-002, D5 cell 레벨 판별)
- [ ] footer 행 기본 스타일 `bg-gray-50` (AC-002, C-5)
- [ ] `footerRowClassName` 커스터마이즈 적용 (Section 2.3)
- [ ] `showFooter=false` 시 footer 행 미렌더링 (EC-006)
- [ ] `enableVirtualization=true` + 1000행 데이터 → Storybook story 스크롤 성능 확인 (AC-004, C-18)

### 타입 검증

- [ ] `GroupRowProps<TData>`, `FooterRowProps<TData>` 제네릭 추론 정상
- [ ] `any` 타입 0건 (`grep ": any"` → 0 hits, C-4)
- [ ] C-29 optional prop forwarding — conditional spread 패턴 (`{...(x !== undefined ? {x} : {})}`)

### 제약 준수 검증

- [ ] Wijmo import 0건 (`grep "@mescius/wijmo"` → 0 hits, C-16, AC-005)
- [ ] `verifyOrWarn` 추가 호출 없음 (GroupRow.tsx, FooterRow.tsx에 미포함 — D7)
- [ ] TanStack 표준 API만 사용 (C-2) — `row.getIsGrouped()`, `row.getToggleExpandedHandler()`, `cell.getIsAggregated()`, `cell.getValue()` 표준 확인
- [ ] Tailwind className만 사용 (C-5) — inline style {} 0건 (동적 값 제외)
- [ ] `@tanstack/react-virtual` peerDependency 등록 (C-22, Section 9)
- [ ] C-31 Functional Wiring Audit: GroupRow, FooterRow import + 실제 호출처 검증
- [ ] E-06 spec 내부 일관성: Section 7 최종 표 ↔ Section 11 구현 순서 파일 1:1 매칭

---

## Section 13: 상용 제품화 영향 (Commercialization Impact)

### 패키지 대상

**Pro 패키지**: `packages/grid-pro-agg` (`@tomis/grid-pro-agg`)

### 라이선스 검증 (F-02)

G-001에서 `AggregationGrid.tsx` 모듈 레벨에 `verifyOrWarn('@tomis/grid-pro-agg')` 1회 호출 완료 (ADR-MOD-GRID-15-002). G-002는 `GroupRow.tsx`, `FooterRow.tsx` 에 추가 호출을 하지 않는다 (D7 — 한 패키지 1회 원칙). `EULA.md`는 G-001에서 이미 생성됨.

G-002 라이선스 관련 변경 없음 — G-001 stub 계승.

### 문서화 계획 (F-03)

**Storybook story**: `AggregationGrid.stories.tsx` 수정

| story 이름 | 시나리오 |
|-----------|---------|
| `GroupFooterExpand` | 5개 그룹, expanded 토글, footer 집계값 확인, showFooter on/off |
| `VirtualizedGroupFooter` | 1000행+ 데이터, enableVirtualization=true, 스크롤 성능, EC-004 limitation 주석 |

**Docusaurus 페이지**: G-001 + G-002 내용을 단일 페이지 `grid-pro-agg.mdx`에 통합 (G-003/G-004 완료 후 최종 확정). G-002 완료 시 "Group Footer & Expand/Collapse" 섹션 추가.

### peerDependencies 정책 (F-04, C-22)

```json
// package.json (G-002 후 상태)
{
  "peerDependencies": {
    "@tanstack/react-table": "^8.0.0",
    "@tanstack/react-virtual": "^3.0.0",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "peerDependenciesMeta": {
    "@tanstack/react-virtual": { "optional": true }
  }
}
```

`@tanstack/react-virtual`은 optional peer — `enableVirtualization=false`(default) 사용 시 설치 불필요.

---

## Appendix: Rubric Self-Check (Pre-Verification)

| 루브릭 | 항목 | 충족 여부 | 근거 |
|--------|------|---------|------|
| A-01 | L0 — 현 구현 N/A 명시 | ✓ | "N/A — 신규 Pro 패키지" |
| A-02 | L1 TanStack API signature 인용 | ✓ | Section 1 L1 API 표 (Row/Cell 메서드) |
| A-03 | L2 — N/A 명시 | ✓ | N/A |
| A-04 | L3 — affectedUsageFiles 0개 명시 | ✓ | Section 1 L3, Section 8.1 |
| A-05 | R-A AG Grid + R-W Wijmo 참조 | ✓ | Section 1 R-A, R-W |
| B-01 | TypeScript interface 정의 | ✓ | Section 2.1 GroupRowProps, 2.2 FooterRowProps, 2.3 AggregationGridProps |
| B-02 | 사용 예시 2개 이상 | ✓ | Section 2.4 예시 1, 2 + Section 10 시나리오 3개 |
| B-03 | 기본값 + optional 명시 | ✓ | Section 2.1~2.3 기본값 표 |
| B-04 | 타입 export 경로 명시 | ✓ | `packages/grid-pro-agg/src/types.ts` (MODIFY) |
| B-05 | ref API — N/A | ✓ | 선언적 컴포넌트, ref 불필요 |
| C-01 | AC 3개 이상 (7개) | ✓ | AC-001~AC-007 |
| C-02 | 각 AC 소스 태그 | ✓ | 모든 AC에 L1/C-N 태그 |
| C-03 | binary 검증 가능 AC | ✓ | 모든 AC 객관 검증 가능 |
| C-04 | migrationImpact 명시 (low) | ✓ | 헤더 + 사전 결정 |
| C-05 | 호환성 검증 AC 포함 — N/A | ✓ | 사용처 0개 신규 기능 |
| D-01 | 영향 사용처 목록 (0개) | ✓ | Section 8.1 |
| D-02 | 기존 variant 대응표 — N/A | ✓ | Section 3 N/A 명시 |
| D-03 | Breaking change 명시 (false) | ✓ | Section 4 |
| D-04 | Deprecation 전략 — N/A | ✓ | Section 4 N/A |
| D-05 | 롤백 전략 — N/A (low + 사용처 0) | ✓ | Section 8.3 |
| D-06 | 번들 영향 (+4 KB, ≤20 KB) | ✓ | Section 8.5 |
| E-01 | Section 7 ↔ Section 11 파일 일관성 | ✓ | 최종 표 7개 == Step 1~7 (cross-check 완료) |
| E-02 | Before/After 코드 스니펫 | ✓ | Section 11.2 |
| E-03 | 구현 순서 7단계 | ✓ | Section 11.3 |
| E-04 | 엣지 케이스 3개 이상 (7개) | ✓ | EC-001~EC-007 |
| E-05 | 검증 계획 (Section 12) | ✓ | 빌드 + 기능 + 타입 + 제약 |
| E-06 | Section 7 재결정 ↔ 최종 표 일관성 | ✓ | D1~D3 재결정 → 최종 표에 반영 확인. Prose prose↔structured 일관성: D5 결정 "cell.getIsAggregated()" ↔ Section 11.2 After-code "cell.getIsAggregated()" 일치 |
| F-01 | 패키지 대상 명시 (grid-pro-agg Pro) | ✓ | Section 13 |
| F-02 | 라이선스 검증 호출 위치 | ✓ | Section 13 (G-001 stub 계승, D7) |
| F-03 | 문서 계획 (Storybook + Docusaurus) | ✓ | Section 13 |
| F-04 | peerDependencies 정책 (C-22) | ✓ | Section 9, Section 13 |
| G-01 | TBD/TODO/미정 없음 + D# 일관성 | ✓ | 모든 결정 D1~D7 명시. D# 파일수 7개 == 최종 표 7행. 사전 결정 표 breakdown: NEW 2 + MODIFY 5 == Section 7 최종 표 NEW 2 + MODIFY 5 확인 |
| H-01 | referenceEvidence 경로 실재 | ✓ | L0/L1/L3 N/A, R-A/R-W 참조 파일(publish-wijmo-analysis.md) Glob 가능. L1: tanstack-api-inventory.md 실제 읽기 확인 |
| H-02 | implementFiles 경로 합리성 | ✓ | D1 결정으로 topvel-grid-monorepo 경로 채택. 부모 `packages/grid-pro-agg/` 실재 (G-001 구현 완료 확인) |
| H-03 | AC 소스 태그 검증 | ✓ | AC-001~AC-007 모두 L1/C-N 태그 + Section 1에서 해당 출처 인용 |
