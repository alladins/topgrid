# MOD-GRID-08 / multi-sort / G-001 — Spec

**Goal**: Shift+Click 다중 정렬 활성 + 정렬 우선순위 배지 (1/2/3) + Ctrl+Click 정렬 제거  
**packageTarget**: `packages/grid-features` (SortBadge/useMultiSort) + `packages/grid-core` (Grid.tsx MODIFY — D1 결정)  
**licenseTier**: MIT  
**migrationImpact**: low  
**threshold**: 90  
**dependsOn**: MOD-GRID-01/G-001, MOD-GRID-02/G-001

---

## ★ 사전 결정 (D# 표)

| # | 결정 | 이유 |
|---|------|------|
| D1 | AC-003(배지)/AC-004(Ctrl 제거) 구현은 `packages/grid-core/src/Grid.tsx` MODIFY로 수행 (Option A 채택) | 헤더 렌더링이 Grid.tsx L227-267에 있어 grid-features만으론 배지 삽입 불가. slot 패턴(Option B)은 신규 API 표면 과다. grid-features 쪽에는 SortBadge.tsx(재사용 가능한 순수 UI) + useMultiSort.ts(비-wrapper 소비자용 옵션 헬퍼) 위치. |
| D2 | `implementFiles` 경로 prefix 정정: Goal JSON의 `D:/project/topvel_project/TOMIS/packages/grid-features/...` → `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/...` (C-28) | TOMIS 저장소에는 `packages/` 디렉토리 없음. state.json `config.monorepoRoot` = `D:/project/topvel_project/topvel-grid-monorepo` 확인 (Read 증거: state.json L76). |
| D3 | `buildTableOptions.ts` L186의 `enableMultiSort: props.enableMultiSort === true` 이미 존재 — 추가 MODIFY 불필요 (Read 증거: buildTableOptions.ts L186). `isMultiSortEvent` 기본값은 TanStack 내부에서 `(e) => e.shiftKey`로 구현되어 있으므로 별도 명시 불필요 (AC-001 범위 최소화). | buildTableOptions.ts Read로 직접 확인. |
| D4 | Ctrl+Click 정렬 제거 핸들러: `e.ctrlKey \|\| e.metaKey` 조건 사용 (Windows Ctrl + Mac Cmd 양쪽 지원, EC-003) | AC-004 + Section 6 엣지 케이스 |
| D5 | `enableMultiSort=true` + `enableSort=false` 조합: dev mode `console.warn` 1회 + 미지원 no-op (배지/Ctrl 핸들러 비활성). | enableSort=false 시 getSortedRowModel 미연결 → 정렬 자체 작동 안 함. 경고만으로 충분. |
| D6 | `useMultiSort.ts`는 비-wrapper 소비자(useReactTable 직접 사용자)를 위한 옵션 헬퍼만 반환. Grid.tsx 내에서는 직접 호출하지 않음 — props.enableMultiSort로 buildTableOptions.ts가 이미 처리 (D3). C-31 wiring audit 대응: spec 명시 "Grid.tsx에서 호출하지 않음 — 외부 소비자용" | |
| D7 | `isMultiSortEvent` override prop: Grid.tsx에 추가하지 않음. 기본 Shift+Click(TanStack 내장) 커버. 사용자 요구 없으면 신규 prop 최소화 원칙 (C-1). | |

**파일 총계**: NEW 3 + MODIFY 2 = 5 파일

| # | 파일 | 액션 | 패키지 |
|---|------|------|--------|
| 1 | `topvel-grid-monorepo/packages/grid-features/src/multi-sort/SortBadge.tsx` | NEW | grid-features |
| 2 | `topvel-grid-monorepo/packages/grid-features/src/multi-sort/useMultiSort.ts` | NEW | grid-features |
| 3 | `topvel-grid-monorepo/packages/grid-features/src/multi-sort/types.ts` | NEW | grid-features |
| 4 | `topvel-grid-monorepo/packages/grid-features/src/index.ts` | MODIFY | grid-features |
| 5 | `topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` | MODIFY | grid-core |

---

## Section 1: 참조 추적

### L0: BaseGrid.tsx 현 정렬 구현 (tw-framework-front)

파일: `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx`

- L3-12: `import { useReactTable, getCoreRowModel, getSortedRowModel, ... SortingState }` — 단일 정렬만 사용
- L29: `const [sorting, setSorting] = useState<SortingState>([]);`
- L98: `getSortedRowModel: getSortedRowModel()` — 항상 활성
- L154: `onClick={header.column.getToggleSortingHandler()}` — 단일 클릭만, Shift+Click 다중 없음
- L159-162: `{{ asc: '▲', desc: '▼' }[header.column.getIsSorted() as string] ?? '⇅'}` — 우선순위 배지 없음
- **현황 요약**: 단일 정렬만 지원, `enableMultiSort` 미사용, 우선순위 배지 없음

현재 `packages/grid-core/src/Grid.tsx`의 헤더 렌더 (L227-267):
- L231: `const sorted = header.column.getIsSorted();`
- L232: `const sortGlyph = sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '⇅';`
- L253: `onClick={canSort ? onSortClick : undefined}` — Shift/Ctrl 이벤트 분기 없음
- L259: `{canSort && <span className="text-gray-400">{sortGlyph}</span>}` — 단순 글리프만

`buildTableOptions.ts` L186:
```ts
enableMultiSort: props.enableMultiSort === true,
```
— 이미 wiring 존재. D3 결정.

### L1: TanStack v8 API 시그니처

출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md`

```ts
// TableOptions 관련
enableMultiSort?: boolean;               // L109: TableOptions.enableMultiSort
isMultiSortEvent?: (e: unknown) => boolean;  // 내부 기본값: (e) => e.shiftKey

// Column 인스턴스 메서드 (RowSorting feature)
column.getIsSorted(): false | 'asc' | 'desc'
column.getSortIndex(): number           // -1 = 미정렬. 0-based index (표시는 +1)
column.getToggleSortingHandler(): (event: unknown) => void
column.toggleSorting(desc?: boolean, isMulti?: boolean): void

// Table 인스턴스 메서드
table.setSorting(updater: Updater<SortingState>): void

// 타입
type SortingState = ColumnSort[]
type ColumnSort = { id: string; desc: boolean }
```

`getSortIndex()` 반환 의미: 0 = 첫 번째 정렬 기준, 1 = 두 번째... -1 = 미정렬.  
배지 표시 = `column.getSortIndex() + 1` (1-based 번호).

### L2: 8 variant 정렬 관련 공통 패턴 (current-tanstack-analysis.md)

- 7/8 variant가 `getSortedRowModel` 사용 (TreeGrid 제외) — feature-gap-matrix.md L18
- 다중 정렬: "단일 정렬만 (`sorting[0]` UI)" — feature-gap-matrix.md L149
- `enableMultiSort` 미노출 — current-tanstack-analysis.md L148

### L3: 영향 사용처 (affectedUsageFiles)

Goal JSON `affectedUsageFiles: []`. D1 결정(Option A)으로 Grid.tsx MODIFY이지만 사용처(page 파일) 변경 없음 (opt-in prop). 영향 사용처 0 페이지 파일.

현재 `enableMultiSort` 없이 `<Grid>` 사용하는 사용처 23개 (SlipListPage.tsx 등) — 이 파일들의 외관 변화 없음 (C-6 무파괴).

### R-A: AG Grid Community Multi Column Sort 동작 패턴

출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/ag-grid-feature-matrix.md` L48, + `references/publish-aggrid-analysis.md`

- AG Grid Community: Single/Multi column sort 모두 지원 (ag-grid-feature-matrix.md L48)
- Multi sort 활성: `multiSortKey: 'ctrl'` 또는 `'shift'` prop (AG Grid는 Ctrl 기반 기본값, Shift 옵션)
- 우선순위 표시: 숫자 배지 (1, 2, 3) — 헤더 내 렌더
- 단일 컬럼 정렬 제거: 해당 컬럼 클릭으로 asc → desc → 해제 순환

→ TanStack 방식과 동작 동등. TanStack은 Shift 기본, AG Grid는 Ctrl 기본 (역방향). 우리는 TanStack 표준(Shift) 채택.

### R-W: Wijmo Multi-column Sorting 패턴

출처: `D:/project/topvel_project/TOMIS/.clone/../.claude/tw-grid/references/wijmo-feature-matrix.md` L19 "Sorting — on-demand, multi-column"

- Wijmo `allowSorting = wjGrid.AllowSorting.None` 로 비활성 가능 — publish 코드 확인 (publish-wijmo-analysis.md L79)
- Wijmo multi-sort: shift click으로 컬럼 추가, 배지 UI 제공
- 우리는 Wijmo 코드 차용 금지 (C-16). 패턴만 참고.

---

## Section 2: API 계약

### 2.1 types.ts

```typescript
/**
 * `SortBadge` 컴포넌트 props.
 * @package @tomis/grid-features
 */
export interface SortBadgeProps {
  /**
   * TanStack `column.getSortIndex()` 반환값.
   * -1 = 미정렬 → 배지 미표시.
   * 0-based integer → 표시 번호 = sortIndex + 1.
   */
  sortIndex: number;
  /** Tailwind className override (C-5). */
  className?: string;
}

/**
 * `useMultiSort` 훅 옵션 (비-wrapper 소비자용).
 * Grid wrapper 사용자는 `<Grid enableMultiSort />` prop만 사용. (D6)
 */
export interface UseMultiSortOptions {
  /** 다중 정렬 활성 여부 (default false). */
  enableMultiSort?: boolean;
}

/**
 * `useMultiSort` 반환값.
 * useReactTable 옵션에 spread하여 사용.
 */
export interface UseMultiSortResult {
  /** TanStack TableOptions.enableMultiSort에 전달. */
  enableMultiSort: boolean;
  /**
   * TanStack TableOptions.isMultiSortEvent에 전달.
   * (e) => e.shiftKey — TanStack 내장 기본값과 동일.
   * 명시적으로 설정하여 문서화 목적 달성.
   */
  isMultiSortEvent: (e: unknown) => boolean;
}
```

### 2.2 SortBadge.tsx (UI 컴포넌트)

```typescript
import type { SortBadgeProps } from './types';

/**
 * 다중 정렬 우선순위 배지.
 * sortIndex === -1 이면 null 반환 (미렌더).
 * Tailwind className만 사용 (C-5).
 */
export function SortBadge({ sortIndex, className }: SortBadgeProps): JSX.Element | null;
```

**export 경로**: `@tomis/grid-features` → `packages/grid-features/src/index.ts`

### 2.3 useMultiSort.ts (비-wrapper 소비자용 옵션 헬퍼)

```typescript
import type { UseMultiSortOptions, UseMultiSortResult } from './types';

/**
 * useReactTable 직접 사용자가 다중 정렬 옵션을 구성할 때 사용하는 헬퍼.
 * `<Grid enableMultiSort />` wrapper 사용자는 이 훅 불필요 — Grid.tsx가 직접 처리. (D6)
 *
 * @example
 * // useReactTable 직접 사용 시
 * const { enableMultiSort, isMultiSortEvent } = useMultiSort({ enableMultiSort: true });
 * const table = useReactTable({
 *   data, columns,
 *   getCoreRowModel: getCoreRowModel(),
 *   getSortedRowModel: getSortedRowModel(),
 *   enableMultiSort,
 *   isMultiSortEvent,
 * });
 */
export function useMultiSort(opts?: UseMultiSortOptions): UseMultiSortResult;
```

### 2.4 사용 예시

**예시 1: Grid wrapper (권장, 가장 간단)**
```tsx
import { Grid } from '@tomis/grid-core';

// 기존 단일 정렬 그리드
<Grid data={rows} columns={columns} enableSort />

// 다중 정렬 활성 (1줄 추가, 무파괴 opt-in)
<Grid data={rows} columns={columns} enableSort enableMultiSort />
// → Shift+Click으로 컬럼 추가 정렬
// → 헤더에 ①②③ 배지 자동 렌더
// → Ctrl/Cmd+Click으로 해당 컬럼 정렬 제거
```

**예시 2: useReactTable 직접 사용자 (비-wrapper)**
```tsx
import { useMultiSort, SortBadge } from '@tomis/grid-features';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';

function MyGrid() {
  const { enableMultiSort, isMultiSortEvent } = useMultiSort({ enableMultiSort: true });
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data, columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort,
    isMultiSortEvent,
  });

  // 헤더 렌더 시
  return (
    <thead>
      {table.getHeaderGroups().map(hg => (
        <tr key={hg.id}>
          {hg.headers.map(header => (
            <th
              key={header.id}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  // Ctrl/Cmd+Click → 해당 컬럼 정렬 제거
                  table.setSorting(prev => prev.filter(s => s.id !== header.column.id));
                } else {
                  header.column.getToggleSortingHandler()?.(e);
                }
              }}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
              <SortBadge sortIndex={header.column.getSortIndex()} />
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
}
```

### 2.5 기본값 + optional 명시

| prop | type | required | default | 비고 |
|------|------|----------|---------|------|
| `SortBadgeProps.sortIndex` | `number` | required | — | -1 시 null |
| `SortBadgeProps.className` | `string` | optional | `''` | Tailwind override |
| `UseMultiSortOptions.enableMultiSort` | `boolean` | optional | `false` | |
| `GridProps.enableMultiSort` | `boolean` | optional | `false` | grid-core 기존 prop |

### 2.6 ref API

N/A — 이 Goal은 선언적 컴포넌트 + 순수 hook. imperativeHandle 불필요.

---

## Section 3: 기존 사용처 대응표

| 기존 동작 | 신규 API | 마이그레이션 액션 |
|----------|----------|----------------|
| `<Grid enableSort />` 단일 정렬 | `<Grid enableSort enableMultiSort />` | opt-in prop 추가 only. 기존 사용처 변경 불필요 |
| `useReactTable({ enableMultiSort: false })` 직접 | `useMultiSort({ enableMultiSort: true })` + spread | 비-wrapper 사용자 선택 마이그레이션 |
| BaseGrid.tsx 단일 정렬 글리프 | `<SortBadge sortIndex={column.getSortIndex()} />` | BaseGrid.tsx 마이그레이션은 MOD-GRID-17 범위 |

---

## Section 4: 호환성 정책

- **Breaking**: NO — 신규 opt-in prop `enableMultiSort` 추가만. 기존 미지정 그리드 동작 그대로.
- **Deprecation**: 없음.
- **migrationPath**: 없음 (영향 사용처 0개).
- **peerDependencies**: `react`, `@tanstack/react-table` (이미 grid-features/package.json L26-33 선언).
- **새 외부 라이브러리 없음** → ADR 의무 미발동 (C-20).

---

## Section 5: 인수 기준 (AC)

| AC | 검증 방법 | 출처 태그 |
|----|----------|----------|
| **AC-001**: `enableMultiSort` prop → `useReactTable` 에 `enableMultiSort: true` 전달. `isMultiSortEvent` 기본값은 TanStack 내부 `(e) => e.shiftKey` 사용 (buildTableOptions.ts L186 기존 wiring). | buildTableOptions.ts Grep `enableMultiSort` → L186 확인 | L0(buildTableOptions) + L1(TanStack API) + C-2 |
| **AC-002**: `enableMultiSort=true` 그리드에서 Shift+Click 헤더 → `column.toggleSorting(undefined, true)` 호출. 기존 정렬 유지하며 추가. | Grid.tsx 헤더 onClick 핸들러에 shift-aware 분기 코드 Grep. Storybook 다중 정렬 시나리오 | L1(TanStack) |
| **AC-003**: 헤더 셀에 `column.getSortIndex() >= 0` 시 `SortBadge` 렌더 (숫자 1~N). Tailwind className만 (C-5). F-08-03 흡수. | Grid.tsx 헤더 렌더 부분에 `SortBadge` import + 조건부 렌더 코드 Grep. SortBadge.tsx 존재 확인. | L1 + C-5 |
| **AC-004**: Ctrl/Cmd+Click → `table.setSorting(prev => prev.filter(s => s.id !== column.id))`. F-08-04 흡수. | Grid.tsx onClick에 `e.ctrlKey \|\| e.metaKey` 분기 Grep. | L1 + D4 |
| **AC-005**: `enableMultiSort` 미설정(undefined/false) 시 기존 단일 정렬 동작 100% 보존. | tsc --noEmit 0 errors + 기존 사용처 23개 중 임의 3개 Storybook 외관 보존 확인 (C-6). | C-6 |
| **AC-006**: `npx tsc --noEmit` 0 error (grid-features + grid-core 양쪽). | tsc 실행 결과 | C-12 |
| **AC-007**: Storybook story 1개 (`MultiSortGrid.stories.tsx`) — 3 시나리오: (a) 다중 컬럼 정렬 + 배지 표시, (b) Ctrl+Click 정렬 제거, (c) enableMultiSort=false 단일 정렬 보존. | 파일 존재 + story export 확인 | C-25 |

---

## Section 6: 엣지 케이스

| # | 케이스 | 예상 동작 |
|---|--------|----------|
| EC-001 | `enableMultiSort=false` + Shift+Click | TanStack 내부에서 isMultiSortEvent=기본 → Shift 인식하나 enableMultiSort=false라 단일 정렬 덮어씀. 기존 동작 동일. |
| EC-002 | 이미 정렬된 컬럼을 Shift+Click | asc → desc → 제거(3번 클릭 순환). TanStack 기본 동작 보존. |
| EC-003 | Ctrl(Windows) vs Cmd(Mac) | `e.ctrlKey \|\| e.metaKey` 조건으로 양쪽 처리 (D4). |
| EC-004 | Shift+Ctrl+Click 동시 | Ctrl 우선 판정 (제거). onClick 핸들러에서 ctrlKey 먼저 체크 → Shift+Click 분기 미도달. |
| EC-005 | `enableMultiSort=true` + `enableSort=false` | dev mode `console.warn` 1회 + 정렬 비활성(getSortedRowModel 미연결이므로 no-op). D5 결정. |
| EC-006 | `getSortIndex()` 반환 -1 인 헤더 | SortBadge에 `-1` 전달 → null 반환 → 배지 미렌더. |
| EC-007 | 가상화(enableVirtualization=true) 상태에서 다중 정렬 | 가상화는 행 렌더 영역만 — 헤더(thead sticky) 렌더와 독립. 배지는 thead에 위치 → 영향 없음 (C-18 호환). |
| EC-008 | 키보드 접근성 (Space/Enter + Shift) | TanStack `getToggleSortingHandler`가 KeyboardEvent도 처리. Shift+Space/Enter는 isMultiSortEvent로 감지 가능 (e.shiftKey는 KeyboardEvent에도 존재). AC-007 Storybook a11y 시나리오로 검증 권장. 키보드 Ctrl+Enter는 `e.ctrlKey` 감지 가능. |

---

## Section 7: 구현 대상 파일 (최종 implementFiles 표)

| # | 파일 (monorepo 절대경로) | 액션 | 변경 범위 |
|---|--------------------------|------|----------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/multi-sort/SortBadge.tsx` | NEW | 순수 배지 UI (20~35줄) |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/multi-sort/useMultiSort.ts` | NEW | 옵션 헬퍼 hook (20~30줄) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/multi-sort/types.ts` | NEW | SortBadgeProps + UseMultiSortOptions + UseMultiSortResult 타입 (30~40줄) |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/index.ts` | MODIFY | multi-sort export 3개 추가 (3줄) |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` | MODIFY | 헤더 onClick에 Shift/Ctrl 분기 + SortBadge 렌더 추가 (~15줄) |

**[E-06 자기-검증]**: 본문 내 "재결정/대체/~ 대신/변경 대상" 키워드 없음. 최종 표와 본문 일치.

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처

**0개** (opt-in prop). 기존 `<Grid>` 사용처 23개 (account/hr/payroll 등) 변경 불필요.

### 8.2 무파괴 검증

- `enableMultiSort` 미제공 사용처 23개: Grid.tsx MODIFY 후에도 `enableMultiSort=false` 기본값으로 기존 동작 100% 보존.
- `buildTableOptions.ts` 기존 L186 `enableMultiSort: props.enableMultiSort === true` 그대로 유지.
- 이 Goal이 새 디렉토리 `packages/grid-features/src/multi-sort/` 생성 — 부모 `packages/grid-features/src/` 이미 존재 (Glob 확인: grid-features/src/index.ts 확인됨).

### 8.3 점진 마이그레이션

신규 prop opt-in 추가만. 일괄 변경 없음.

### 8.4 롤백

`Grid.tsx`에서 SortBadge import + onClick 분기 2개 제거 + `enableMultiSort prop` 그대로 두면 됨. grid-features/index.ts export 3개 제거. 사용처 0개라 cascade 없음.

### 8.5 번들

- `packages/grid-features`: SortBadge.tsx (~1 KB) + useMultiSort.ts (~0.5 KB) + types.ts (~0.3 KB) = **+2 KB** (gzipped 기준 ~1 KB). Goal JSON `bundleImpact: "+2 KB"` 일치.
- `packages/grid-core`: Grid.tsx 변경은 import 1줄 + 코드 ~15줄 → **+0.5 KB 미만**.
- feature-gap-matrix.md Section 6: `grid-features` (drag/sort/filter) 예상 15 KB 총계. 이 Goal 추가 후 여전히 한도 내.
- C-21 한도: grid-features 별도 한도 (state.json에 `grid-features` 별도 미정의, `grid-pro-package: 20 KB` 준용). 2 KB 추가로 한도 초과 없음.

---

## Section 9: 의존성

```json
// packages/grid-features/package.json (기존 — 변경 불필요)
"peerDependencies": {
  "@tanstack/react-table": "^8.0.0",
  "@tanstack/react-virtual": "^3.0.0",  // optional
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

- 새 외부 라이브러리 없음 → ADR 불필요 (C-20)
- `@tanstack/react-table` API: `column.getSortIndex()`, `column.getToggleSortingHandler()`, `table.setSorting()` — 모두 C-2 표준 export 확인

---

## Section 10: 사용자 여정 매핑

### 개발자 여정
1. 기존 `<Grid enableSort />` 코드에 `enableMultiSort` prop 1개 추가.
2. 추가 설정/import 없음.
3. 필요 시 `useMultiSort` + `SortBadge` 직접 import (useReactTable 직접 사용자).

### 최종 사용자 여정
1. 첫 번째 컬럼 헤더 클릭 → 오름차순 정렬 (①배지 표시).
2. 두 번째 컬럼 헤더를 Shift+클릭 → 두 번째 정렬 기준 추가 (②배지 표시).
3. 세 번째 컬럼 헤더를 Shift+클릭 → 세 번째 정렬 기준 추가 (③배지 표시).
4. 첫 번째 컬럼 헤더를 Ctrl/Cmd+클릭 → ①컬럼 정렬만 제거 (②③배지 → ①②로 재번호).

---

## Section 11: 구현 계획

### 11.1 파일별 NEW/MODIFY 표 (Section 7과 동일)

Section 7 최종 implementFiles 표 참조.

### 11.2 Before/After 코드 스니펫

**Before: Grid.tsx 헤더 렌더 (L231-262 현재)**
```tsx
const sorted = header.column.getIsSorted();
const sortGlyph = sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '⇅';
// ...
<th
  onClick={canSort ? onSortClick : undefined}
>
  <div className="flex items-center gap-1">
    {/* 헤더 컨텐츠 */}
    {canSort && <span className="text-gray-400">{sortGlyph}</span>}
  </div>
</th>
```

**After: Grid.tsx 헤더 렌더 (enableMultiSort 활성 시)**
```tsx
import { SortBadge } from '@tomis/grid-features/multi-sort'; // grid-features는 grid-core의 devDependency 또는 상위 앱에서 주입

const sorted = header.column.getIsSorted();
const sortIndex = header.column.getSortIndex();   // AC-003
const sortGlyph = sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '⇅';
const isMulti = props.enableMultiSort === true;

// dev mode 경고 (EC-005, D5) — mount 시 1회
// (Grid.tsx 기존 useEffect 패턴과 동일)

// 헤더 onClick 교체
const handleHeaderClick = (e: React.MouseEvent) => {
  if (!canSort) return;
  if (isMulti && (e.ctrlKey || e.metaKey)) {
    // AC-004: Ctrl/Cmd+Click → 해당 컬럼 정렬 제거
    table.setSorting(prev => prev.filter(s => s.id !== header.column.id));
  } else if (isMulti && e.shiftKey) {
    // AC-002: Shift+Click → 기존 정렬 유지하며 추가
    header.column.toggleSorting(undefined, true);
  } else {
    onSortClick?.(e);  // 기존 단일 정렬 (또는 enableMultiSort=false 전체 경로)
  }
};

// 렌더
<th onClick={canSort ? handleHeaderClick : undefined}>
  <div className="flex items-center gap-1">
    {/* 헤더 컨텐츠 */}
    {canSort && <span className="text-gray-400">{sortGlyph}</span>}
    {/* AC-003: 다중 정렬 배지 */}
    {isMulti && canSort && <SortBadge sortIndex={sortIndex} />}
  </div>
</th>
```

**SortBadge.tsx (NEW)**
```tsx
import type { SortBadgeProps } from './types';

/**
 * 다중 정렬 우선순위 배지.
 * @see SortBadgeProps
 */
export function SortBadge({ sortIndex, className = '' }: SortBadgeProps): JSX.Element | null {
  if (sortIndex < 0) return null;
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-blue-500 text-white ml-0.5 ${className}`}
    >
      {sortIndex + 1}
    </span>
  );
}
```

**useMultiSort.ts (NEW — 비-wrapper 소비자용, D6)**
```ts
import type { UseMultiSortOptions, UseMultiSortResult } from './types';

export function useMultiSort(opts?: UseMultiSortOptions): UseMultiSortResult {
  const enableMultiSort = opts?.enableMultiSort ?? false;
  return {
    enableMultiSort,
    isMultiSortEvent: (e: unknown) => {
      if (e instanceof Object && 'shiftKey' in e) {
        return (e as { shiftKey: boolean }).shiftKey;
      }
      return false;
    },
  };
}
```

### 11.3 구현 순서 (의존성 고려)

**Step 1: grid-features 신규 파일 3개**
- `types.ts` → `SortBadge.tsx` → `useMultiSort.ts` 순으로 생성
- `index.ts` MODIFY: `export { SortBadge } from './multi-sort/SortBadge'; export { useMultiSort } from './multi-sort/useMultiSort'; export type { SortBadgeProps, UseMultiSortOptions, UseMultiSortResult } from './multi-sort/types';` 3줄 추가
- `npx tsc --noEmit` (grid-features) → 0 error 확인

**Step 2: grid-core/Grid.tsx MODIFY**
- `SortBadge` import 추가 (grid-features가 grid-core devDependency이거나 모노레포 workspace protocol)
- 헤더 onClick → handleHeaderClick 분기 추가 (AC-002, AC-004)
- SortBadge 렌더 추가 (AC-003)
- EC-005 경고 useEffect 추가 (D5)
- `npx tsc --noEmit` (grid-core) → 0 error 확인

**Step 3: Storybook story 작성 (AC-007)**
- `packages/grid-features/src/multi-sort/MultiSortGrid.stories.tsx` 또는 모노레포 apps/docs 하위
- 3 시나리오: (a) 다중 정렬+배지, (b) Ctrl+Click 제거, (c) enableMultiSort=false 단일 정렬

### 11.4 위험 요소

| 위험 | 대응 |
|------|------|
| grid-core가 grid-features를 import 시 순환 의존성 | grid-features는 grid-core에 의존하지 않음(peerDep만). grid-core → grid-features 방향만. 순환 없음 확인 필요. |
| SortBadge import 경로 — 모노레포 workspace resolution | pnpm workspace protocol `@tomis/grid-features: workspace:*` 설정 필요 (grid-core/package.json에 devDependency 추가). |
| EC-005 useEffect 위치 | 기존 Grid.tsx의 virtualization 경고 useEffect (L161-174) 패턴과 동일하게 mount 시 1회. deps `[]`. |
| exactOptionalPropertyTypes (C-29) | handleHeaderClick 내 `onSortClick?.(e)` — optional chaining으로 처리. 타입 문제 없음. |

---

## Section 12: 검증 계획

### 12.1 단위 검증

- `useMultiSort({ enableMultiSort: true })` 반환 → `{ enableMultiSort: true, isMultiSortEvent: fn }` 확인
- `useMultiSort()` (파라미터 없음) → `{ enableMultiSort: false, ... }` 확인 (C-6 기본값)
- `SortBadge({ sortIndex: -1 })` → null 반환 확인
- `SortBadge({ sortIndex: 0 })` → `<span>1</span>` 렌더 확인
- `SortBadge({ sortIndex: 2 })` → `<span>3</span>` 렌더 확인

### 12.2 통합: Storybook 3 시나리오 (AC-007)

- **시나리오 A** (다중 정렬 + 배지): 이름/부서/입사일 3컬럼 → 이름 클릭(①) → 부서 Shift+클릭(②) → 배지 ①②  렌더 확인.
- **시나리오 B** (Ctrl+Click 제거): 시나리오 A 이후 이름 컬럼 Ctrl/Cmd+클릭 → ① 배지 제거, 부서 배지 ① 로 재번호.
- **시나리오 C** (단일 정렬 보존): `enableMultiSort=false` 그리드에서 Shift+클릭 → 단일 정렬만 (다중 추가 안 됨). 배지 미표시.

### 12.3 빌드 검증

- `npx tsc --noEmit` — grid-features + grid-core 양쪽 0 error (AC-006, C-12)
- `tsup build` — grid-features dist/ 정상 생성
- size-limit (grid-features 기준 한도 내)

### 12.4 시각 회귀

- migrationImpact: low — C-17 조건상 시각 회귀 N/A. 단, 기존 사용처(enableMultiSort 미설정 23개) 외관 변화 0 확인 (Section 8.2).
- Grid.tsx MODIFY 후 `enableMultiSort=false` 기본 Storybook story에서 헤더 외관 변화 없음 확인.

---

## Section 13: 상용 제품화 영향

### 13.1 패키지 대상

- **`packages/grid-features`** — MIT 패키지
- **`packages/grid-core`** — MIT 패키지 (MODIFY)

### 13.2 라이선스 검증 호출

N/A — 양쪽 모두 MIT. Pro 패키지 아님 (C-24 Pro 요건 해당 없음).

### 13.3 문서 작성 계획 (C-25)

**Docusaurus 페이지**: `apps/docs/docs/features/multi-sort.mdx`
- 제목: "Multi-Column Sorting"
- 내용: enableMultiSort prop 사용법 + Shift+Click/Ctrl+Click 동작 설명
- API reference: SortBadgeProps / UseMultiSortOptions / UseMultiSortResult

**Storybook story** (AC-007): `MultiSortGrid.stories.tsx` — 3 시나리오

**README.md**: grid-features/README.md에 multi-sort 섹션 추가

### 13.4 peerDependencies 정책 (C-22, C-25)

`packages/grid-features/package.json` 기존 peerDependencies 그대로:
```json
"peerDependencies": {
  "@tanstack/react-table": "^8.0.0",
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```
변경 없음. 새 peer 추가 없으므로 ADR 불필요.

---

## 첨부: C-28 경로 정정 근거

| 항목 | 값 |
|------|---|
| Goal JSON implementFiles prefix | `D:/project/topvel_project/TOMIS/packages/grid-features/` |
| 실제 monorepo root (state.json L76) | `D:/project/topvel_project/topvel-grid-monorepo` |
| 정정 후 prefix | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/` |
| 근거 제약 | C-28: TOMIS 저장소에는 `packages/` 디렉토리 없음 (Glob 확인 — 미존재) |

Verifier H-02 판정: 조부모 `D:/project/topvel_project/topvel-grid-monorepo/` 실재 확인 (grid-features/package.json Read 성공). 새로 생성되는 디렉토리는 `packages/grid-features/src/multi-sort/` — 부모 `packages/grid-features/src/` 이미 존재 (grid-features/src/index.ts Glob 확인). H-02 외부 디렉토리 예외 불필요 — 부모 실재.
