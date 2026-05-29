# MOD-GRID-11 / G-001 Specification
# CellRange 모델 + 마우스 드래그 셀 범위 선택 + Shift+Click 범위 확장

**Status**: DRAFT  
**Author**: tw-grid Spec Writer  
**Date**: 2026-05-14  
**Package**: `@tomis/grid-pro-range`  
**Threshold**: specify-score ≥ 95

---

## Section 0 — 결정 사항 (D# 테이블)

| ID  | 결정                                       | 근거 / 제약                                                                                                                  |
|-----|--------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| D1  | **monorepo 경로**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/src/` | goals.json `implementFiles` 의 `TOMIS/packages/` 접두사는 실제로 존재하지 않음. 올바른 monorepo root는 `topvel-grid-monorepo/`. C-28 적용. |
| D2  | **라이선스 의존성**: Option A — `verifyGridLicense?.()` 선택적 호출 | MOD-GRID-99-A/G-001 미완료, `grid-license/src/index.ts`는 `export {};` stub. Optional-chain 패턴으로 stub→실구현 시 호출부 변경 없음. Option B(호출 생략)는 보안 공백, Option C(blocked)는 진행 불가. |
| D3  | **CellRange 독립 상태**: `useCellRange` 훅, TanStack `rowSelection`과 무관 | TanStack `rowSelection`은 row-key 기반 boolean map. CellRange는 2D 직사각형. 겹치지 않는 레이어이므로 독립 state로 유지. |
| D4  | **시각적 변경 허용**: L0 `border-blue-300` → spec `ring-1 ring-blue-400` | AC-005 명시 요건. `ring`은 outline-safe(border-box 영향 없음). L0 드리프트를 인정하고 AC-005로 픽스. |
| D5  | **Storybook 파일 포함**: `useCellRange.stories.tsx` NEW | AC-011은 "Storybook story 1개" 납품 바인딩 AC. E-01(v1.0.6) 규칙에 따라 Section 7 필수 포함. |

---

## Section 1 — 목표 요약 (Goal Summary)

G-001은 `@tomis/grid-pro-range` 패키지에 **CellRange 모델**과 **마우스 드래그/Shift+Click 범위 선택** 기능을 구현한다.

핵심 가치:
- AG Grid Enterprise Cell Range Selection 기능을 직접 구현(Pro 티어 포지셔닝 근거: `ag-grid-feature-matrix.md` L34 확인)
- Wijmo `g.selectionMode = CellRange` 패턴을 참고하되 C-16(Wijmo import 금지) 준수
- TanStack React Table v8 headless 구조 위에 독립 CellRange 레이어 추가

**성공 기준**: 11개 AC 전부 충족, specify-score ≥ 95.

**migrationImpact**: medium (RangeSelectGrid alias 1건 마이그레이션 + Pro 라이선스 검증 신규 의존, AG Grid Enterprise 시그니처 참조 자체 구현)

---

## Section 2 — 범위 (Scope)

### 2.1 포함 (In-Scope)

| 항목                               | 세부                                                              |
|------------------------------------|-------------------------------------------------------------------|
| `CellCoord` / `CellRange` 타입     | row/col 인덱스 기반 2D 좌표 + 직사각형 범위                      |
| `normalizeRange` 순수 함수         | start ≤ end 정규화                                                |
| `isInRange` 순수 함수              | 좌표 포함 여부 체크                                               |
| `useCellRange` 훅                  | mousedown/mousemove/mouseup + Shift+Click 이벤트 핸들러          |
| `RangeSelectGrid<TData>` 컴포넌트  | TanStack table + useCellRange 합성, 선택 셀 스타일링              |
| `@tomis/grid-pro-range` 패키지 exports | types, 함수, 훅, 컴포넌트 전부                                |
| Storybook story                    | `useCellRange.stories.tsx` (AC-011 바인딩)                       |
| 레거시 alias                       | `legacy/RangeSelectGrid.tsx` re-export (C-6 backward compat)    |
| EULA.md                            | 라이선스 파일 (AC-007)                                            |

### 2.2 제외 (Out-of-Scope)

| 항목                          | 이유                                                     |
|-------------------------------|----------------------------------------------------------|
| 가상화(virtualization)        | MOD-GRID-10에서 담당, 이 Goal은 순수 range 선택만        |
| 열 고정 (column pinning)      | 별도 Goal                                               |
| 키보드 Arrow 확장             | G-001 ACs에 없음 (향후 G-002 후보)                      |
| 우클릭 컨텍스트 메뉴 정렬     | L0에 있으나 G-001 ACs에 없음                             |
| Clipboard copy 내보내기        | L0 `copySelection` 로직 — G-001 ACs에 없음 (별도 목표) |

---

## Section 3 — L0 분석 및 대응표

**L0 소스**: `tw-framework-front/src/components/tomis/Grid/RangeSelectGrid.tsx` (253 lines)

### 3.1 L0 핵심 로직 발췌

| L0 위치       | 내용                                                          | AC 매핑    |
|---------------|---------------------------------------------------------------|------------|
| L11-12        | `CellCoord { row, col }` 인터페이스                           | AC-001     |
| L13-16        | `SelectedRange { start, end }` 인터페이스                     | AC-001     |
| L33-44        | `normalizeRange(range)` 순수 함수                             | AC-002     |
| L46-50        | `isInRange(row, col, range)` 순수 함수                        | AC-002     |
| L60-64        | state: `sorting, range, dragging`; ref: `dragStart`           | AC-003     |
| L78-88        | Shift+Click → 기존 start 유지 + 새 end로 range 확장           | AC-004     |
| L89-96        | 일반 mousedown → 새 drag start                                | AC-003     |
| L98-103       | mousemove(dragging) → range 확장                              | AC-003     |
| L105-108      | mouseup → drag 종료                                           | AC-003     |
| L119-131      | `copySelection` TSV clipboard (G-001 scope 외)                | —          |
| L191-192      | `bg-blue-100 border-blue-300` (현재, **변경 대상**)          | AC-005     |

### 3.2 시각적 드리프트 (D4)

| 구분   | 현재 L0 (line 191)              | 목표 AC-005 지정                     | 변경 이유                              |
|--------|----------------------------------|--------------------------------------|----------------------------------------|
| 선택셀 | `bg-blue-100 border-blue-300`    | `bg-blue-100 ring-1 ring-blue-400`   | `ring`은 border-box 영향 없음, 더 명확한 하이라이트 |

이 드리프트는 L0 버그가 아니라 AC-005의 의도적 개선 요건이다. legacy alias는 새 스타일을 그대로 위임.

### 3.3 Wijmo 참조 패턴 (C-16: import 금지, 패턴만 참조)

`publish-wijmo-analysis.md` §3 L104-117:
```
g.selectionMode = wjGrid.SelectionMode.CellRange
currentSelectionRef = g.selection.clone()
```
- → `useCellRange`의 `dragStart` ref와 `range` state 구조의 직접 영감.
- Wijmo import는 C-16에 의해 절대 금지. 순수 React 재구현.

---

## Section 4 — 의존성 분석

### 4.1 런타임 의존성

| 패키지                         | 버전        | 역할                          | 타입           |
|--------------------------------|-------------|-------------------------------|----------------|
| `react`                        | ^18 \|\| ^19 | JSX, hooks                   | peerDependency |
| `react-dom`                    | ^18 \|\| ^19 | DOM                          | peerDependency |
| `@tanstack/react-table`        | ^8.0.0      | headless table engine         | peerDependency |

`package.json` L27-31 확인: peerDependencies 이미 올바르게 설정됨. C-22 준수.

### 4.2 빌드 의존성

| 패키지   | 역할         |
|----------|--------------|
| `tsup`   | bundler      |
| `tsc`    | typecheck    |

### 4.3 Goal 의존성

| 의존 Goal              | 상태            | 영향                                        |
|------------------------|-----------------|---------------------------------------------|
| MOD-GRID-01/G-001      | 완료 (가정)     | wrapper 패턴, BaseGrid 타입 참조             |
| MOD-GRID-10/G-001      | 완료 (가정)     | 가상화 컨텍스트 인터페이스 (G-001 직접 사용 안 함) |
| MOD-GRID-99-A/G-001    | 미완료          | `verifyGridLicense?.()` Option A 적용 (D2) |

### 4.4 라이선스 의존성 상세 (D2)

```typescript
// grid-license/src/index.ts (현재: stub)
export {};

// G-001 useCellRange.ts 호출 패턴 (Option A)
import type { verifyGridLicense } from '@tomis/grid-license';
declare const verifyGridLicense: (() => void) | undefined;
// 실제 호출:
verifyGridLicense?.();  // stub 시 no-op, 실구현 시 자동 활성화
```

---

## Section 5 — Acceptance Criteria 상세

| AC ID  | 원문 (goals.json)                                             | 상세 기준 / 검증 방법                                                                 | 바인딩 여부 |
|--------|---------------------------------------------------------------|---------------------------------------------------------------------------------------|-------------|
| AC-001 | CellCoord, CellRange 타입 export                              | `types.ts`에서 `CellCoord { row: number; col: number }`, `CellRange { start: CellCoord; end: CellCoord }` export. TypeScript strict 통과. | 바인딩 |
| AC-002 | normalizeRange, isInRange 순수 함수 export                   | `normalize.ts`에서 두 함수 export. 부수효과 없음. 단위 테스트 3+ 케이스 통과. | 바인딩 |
| AC-003 | 마우스 드래그로 셀 범위 선택                                  | mousedown → mousemove(dragging=true) → mouseup 시퀀스. `dragging` state ref로 추적. `onRangeChange` 콜백 호출. | 바인딩 |
| AC-004 | Shift+Click으로 범위 확장                                    | Shift+mousedown 시 기존 `range.start` 유지, 클릭 셀을 새 `end`로 설정. `onRangeChange` 콜백 호출. | 바인딩 |
| AC-005 | 선택 셀 `bg-blue-100 ring-1 ring-blue-400` 하이라이트        | `isInRange` 결과 true인 `<td>`에 `bg-blue-100 ring-1 ring-blue-400` Tailwind 클래스 적용. C-5 준수. | 바인딩 |
| AC-006 | `onRangeChange(range: CellRange \| null)` 콜백               | range 변경 시마다 정규화된 `CellRange`(또는 null 시 null) 콜백 호출. 부모에서 상태 제어 가능. | 바인딩 |
| AC-007 | `"license": "SEE LICENSE IN EULA"` + EULA.md                | `package.json` L5 이미 설정됨. `EULA.md` 파일 신규 생성(placeholder). | 바인딩 |
| AC-008 | TypeScript strict 통과                                        | `tsc --noEmit` 0 errors. `exactOptionalPropertyTypes` 포함 (C-4 no any, C-29 spread-skip). | 바인딩 |
| AC-009 | `@tomis/grid-pro-range` 패키지 exports 완비                   | `index.ts`에서 types, 함수, 훅, 컴포넌트 전부 named export. | 바인딩 |
| AC-010 | `legacy/RangeSelectGrid.tsx` backward compat alias            | L0 API (`data, columns, onRangeChange?, loading?, emptyText?, className?`) 호환. C-6 준수. | 바인딩 |
| AC-011 | Storybook story 1개                                           | `useCellRange.stories.tsx` 파일 제공. `Default` story: 마우스 드래그 시뮬레이션 가능. | 바인딩 (E-01) |

---

## Section 6 — 구현 설계 (Implementation Design)

### 6.1 타입 정의

```typescript
// packages/grid-pro-range/src/types.ts
export interface CellCoord {
  row: number;
  col: number;
}

export interface CellRange {
  start: CellCoord;
  end: CellCoord;
}

export interface RangeSelectGridProps<TData extends object> {
  data: TData[];
  columns: ColumnDef<TData>[];
  onRangeChange?: (range: CellRange | null) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}
```

### 6.2 normalizeRange / isInRange

```typescript
// packages/grid-pro-range/src/internal/normalize.ts
export function normalizeRange(range: CellRange): CellRange {
  return {
    start: {
      row: Math.min(range.start.row, range.end.row),
      col: Math.min(range.start.col, range.end.col),
    },
    end: {
      row: Math.max(range.start.row, range.end.row),
      col: Math.max(range.start.col, range.end.col),
    },
  };
}

export function isInRange(
  row: number,
  col: number,
  range: CellRange | null
): boolean {
  if (!range) return false;
  const n = normalizeRange(range);
  return (
    row >= n.start.row &&
    row <= n.end.row &&
    col >= n.start.col &&
    col <= n.end.col
  );
}
```

### 6.3 useCellRange 훅

```typescript
// packages/grid-pro-range/src/useCellRange.ts
export interface UseCellRangeReturn {
  range: CellRange | null;
  dragging: boolean;
  handleMouseDown: (row: number, col: number, shiftKey: boolean) => void;
  handleMouseEnter: (row: number, col: number) => void;
  handleMouseUp: () => void;
}

export function useCellRange(
  onRangeChange?: (range: CellRange | null) => void
): UseCellRangeReturn {
  const [range, setRange] = useState<CellRange | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<CellCoord | null>(null);

  const handleMouseDown = useCallback(
    (row: number, col: number, shiftKey: boolean) => {
      if (shiftKey && range) {
        // Shift+Click: 기존 start 유지, 새 end
        const newRange = normalizeRange({ start: range.start, end: { row, col } });
        setRange(newRange);
        onRangeChange?.(newRange);
      } else {
        // 새 drag start
        dragStart.current = { row, col };
        setDragging(true);
        const newRange: CellRange = { start: { row, col }, end: { row, col } };
        setRange(newRange);
        onRangeChange?.(newRange);
      }
    },
    [range, onRangeChange]
  );

  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!dragging || !dragStart.current) return;
      const newRange = normalizeRange({
        start: dragStart.current,
        end: { row, col },
      });
      setRange(newRange);
      onRangeChange?.(newRange);
    },
    [dragging, onRangeChange]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  return { range, dragging, handleMouseDown, handleMouseEnter, handleMouseUp };
}
```

### 6.4 RangeSelectGrid 컴포넌트

```typescript
// packages/grid-pro-range/src/RangeSelectGrid.tsx
export function RangeSelectGrid<TData extends object>({
  data,
  columns,
  onRangeChange,
  loading,
  emptyText = '데이터가 없습니다.',
  className,
}: RangeSelectGridProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { range, handleMouseDown, handleMouseEnter, handleMouseUp } =
    useCellRange(onRangeChange);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // 셀 스타일: AC-005
  // isInRange true → 'bg-blue-100 ring-1 ring-blue-400'
  // ...render 로직
}
```

### 6.5 라이선스 선택적 호출 (D2, Option A)

```typescript
// useCellRange.ts 상단
// @ts-ignore — verifyGridLicense는 MOD-GRID-99-A 완료 시 export 추가
import type {} from '@tomis/grid-license';
declare const verifyGridLicense: (() => void) | undefined;

// useCellRange 내부 초기화
useEffect(() => {
  verifyGridLicense?.();
}, []);
```

실제로는 `@tomis/grid-license/src/index.ts`가 stub(`export {};`)이므로 no-op. MOD-GRID-99-A 완료 후 `verifyGridLicense` export 추가 시 자동 활성.

### 6.6 legacy alias (C-6, C-29)

```typescript
// packages/grid-pro-range/src/legacy/RangeSelectGrid.tsx
// C-29: exactOptionalPropertyTypes — spread-skip 패턴 사용
import { RangeSelectGrid } from '../RangeSelectGrid';
import type { RangeSelectGridProps } from '../types';

/** @deprecated L0 호환 alias. 신규 코드는 RangeSelectGrid 직접 사용 */
export default function LegacyRangeSelectGrid<TData extends object>(
  props: RangeSelectGridProps<TData>
) {
  // spread-skip: optional prop 전달 시 undefined 명시 금지 (C-29)
  const forwarded: RangeSelectGridProps<TData> = { data: props.data, columns: props.columns };
  if (props.onRangeChange !== undefined) forwarded.onRangeChange = props.onRangeChange;
  if (props.loading !== undefined) forwarded.loading = props.loading;
  if (props.emptyText !== undefined) forwarded.emptyText = props.emptyText;
  if (props.className !== undefined) forwarded.className = props.className;
  return <RangeSelectGrid {...forwarded} />;
}
```

### 6.7 index.ts exports (AC-009)

```typescript
// packages/grid-pro-range/src/index.ts
export type { CellCoord, CellRange, RangeSelectGridProps } from './types';
export { normalizeRange, isInRange } from './internal/normalize';
export { useCellRange } from './useCellRange';
export type { UseCellRangeReturn } from './useCellRange';
export { RangeSelectGrid } from './RangeSelectGrid';
```

---

## Section 7 — 최종 파일 목록 (Section 7 Truth Table)

모든 파일은 **C-28** monorepo 경로 기준(`topvel-grid-monorepo/packages/grid-pro-range/`).

**경로 prefix**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/`

| # | 상태    | 파일 경로 (topvel-grid-monorepo/packages/grid-pro-range/ 기준)       | 변경 유형 | AC 매핑              | 비고                                     |
|---|---------|----------------------------------------------------------------------|-----------|----------------------|------------------------------------------|
| 1 | NEW     | `src/types.ts`                                                       | 신규      | AC-001, AC-008       | CellCoord, CellRange, Props 타입        |
| 2 | NEW     | `src/internal/normalize.ts`                                          | 신규      | AC-002, AC-008       | normalizeRange, isInRange 순수 함수     |
| 3 | NEW     | `src/useCellRange.ts`                                                | 신규      | AC-003, AC-004, AC-006, AC-008 | 드래그/Shift+Click 훅 + Option A 라이선스 |
| 4 | NEW     | `src/RangeSelectGrid.tsx`                                            | 신규      | AC-003, AC-004, AC-005, AC-006, AC-008 | 컴포넌트, ring-1 ring-blue-400 스타일 |
| 5 | NEW     | `src/legacy/RangeSelectGrid.tsx`                                     | 신규      | AC-010, AC-008       | L0 API 호환 alias, C-6, C-29           |
| 6 | NEW     | `src/useCellRange.stories.tsx`                                       | 신규      | AC-011               | Storybook Default story (E-01 바인딩)   |
| 7 | NEW     | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/EULA.md` | 신규      | AC-007               | 라이선스 placeholder                     |
| 8 | MODIFY  | `src/index.ts`                                                       | 수정      | AC-009               | placeholder → 전체 exports              |

**사용 파일 (패키지 외)**:

| # | 상태    | 파일 경로 (TOMIS repo 기준)                                          | 변경 유형 | AC 매핑 | 비고                         |
|---|---------|----------------------------------------------------------------------|-----------|---------|------------------------------|
| 9 | MODIFY  | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/RangeSelectGrid.tsx`   | 수정      | AC-005  | ring-1 ring-blue-400 스타일 변경 + import @tomis/grid-pro-range 으로 교체 |

---

## Section 8 — 리스크 및 엣지케이스

### 8.1 구현 리스크

| 리스크                               | 가능성 | 영향  | 완화 방안                                                               |
|--------------------------------------|--------|-------|-------------------------------------------------------------------------|
| mouseup이 셀 외부에서 발생           | 중     | 중    | `document` 레벨 `mouseup` 리스너 추가 또는 `onMouseLeave` on table     |
| 가상화된 테이블(MOD-GRID-10)과 인덱스 불일치 | 저 | 중  | G-001은 가상화 미포함, 향후 통합 시 별도 Goal                          |
| `exactOptionalPropertyTypes` spread 오류 | 중 | 높음 | C-29 spread-skip 패턴 엄수 (Section 6.6)                               |
| verifyGridLicense import 오류        | 저     | 중    | Option A: type-only import + declare, ts-ignore 한정 사용               |
| 드래그 중 텍스트 선택                | 높     | 낮    | `onMouseDown` 에서 `e.preventDefault()` 호출                           |

### 8.2 시각적 드리프트 문서화 (D4)

L0 `RangeSelectGrid.tsx` L191-192의 `border-blue-300`은 AC-005 요건(`ring-1 ring-blue-400`)과 다르다. 이는 의도된 개선이며 legacy alias를 통해 기존 사용처도 새 스타일을 위임받는다.

### 8.3 C-28 경로 불일치 영구 기록

goals.json `implementFiles` 의 경로 접두사 오류:
```
# goals.json (오류):
"D:/project/topvel_project/TOMIS/packages/grid-pro-range/src/..."

# 실제 올바른 경로:
"D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/src/..."
```
구현 단계에서 올바른 경로 사용. goals.json 자체는 MOD-GRID-00-decisions.md에 C-28 적용 기록.

---

## Section 9 — 테스트 계획

### 9.1 단위 테스트 (normalizeRange / isInRange)

| 케이스                       | 입력                                  | 기대 출력                                  |
|------------------------------|---------------------------------------|--------------------------------------------|
| 정방향 범위                  | `{start:{0,0}, end:{2,3}}`           | 동일                                       |
| 역방향 (end < start)        | `{start:{3,2}, end:{0,0}}`           | `{start:{0,0}, end:{3,2}}`                |
| 단일 셀                      | `{start:{1,1}, end:{1,1}}`           | `{start:{1,1}, end:{1,1}}`                |
| isInRange: 범위 안           | `row=1, col=1, range={0,0→2,2}`     | `true`                                     |
| isInRange: 범위 밖           | `row=3, col=3, range={0,0→2,2}`     | `false`                                    |
| isInRange: null range        | `row=0, col=0, range=null`           | `false`                                    |

### 9.2 컴포넌트 테스트 (RangeSelectGrid)

| 케이스               | 검증 내용                                                     |
|----------------------|---------------------------------------------------------------|
| 마우스 드래그        | mousedown→mousemove→mouseup 시퀀스, `onRangeChange` 호출     |
| Shift+Click          | 기존 start 유지, 새 end, `onRangeChange` 호출                |
| 선택 셀 스타일       | `bg-blue-100 ring-1 ring-blue-400` 클래스 적용 확인           |
| 빈 range             | 초기 상태, 선택 없음                                          |

### 9.3 TypeScript 검증

```bash
# topvel-grid-monorepo에서
pnpm --filter @tomis/grid-pro-range typecheck
```
0 errors 목표.

---

## Section 10 — 번들 임팩트

| 항목         | 수치            |
|--------------|-----------------|
| 예상 추가    | +4 KB           |
| 한도 (C-?)   | ≤ 20 KB (goals.json bundleImpact 기준) |
| 주요 요인    | types.ts ~0.5KB, normalize.ts ~0.5KB, useCellRange.ts ~1KB, RangeSelectGrid.tsx ~2KB |

---

## Section 11 — 마이그레이션 경로 (affectedUsageFiles)

goals.json `affectedUsageFiles`: `tw-framework-front/src/components/tomis/Grid/RangeSelectGrid.tsx`

현재 L0는 독립 구현. G-001 완료 후:
1. L0 import를 `@tomis/grid-pro-range`로 교체
2. 스타일 `border-blue-300` → `ring-1 ring-blue-400` (AC-005, D4)
3. `useCellRange` 훅 직접 사용으로 리팩터링 또는 `RangeSelectGrid` 컴포넌트로 교체

---

## Section 12 — 결정 로그 (MOD-GRID-11-decisions.md 초안)

```markdown
# MOD-GRID-11 결정 로그

## D1: implementFiles 경로 수정 (C-28)
- 결정: goals.json의 TOMIS/packages/ 접두사를 topvel-grid-monorepo/packages/ 로 교정
- 근거: TOMIS repo에 packages/ 디렉토리 존재하지 않음
- 상태: G-001 spec 반영

## D2: 라이선스 Option A 선택
- 결정: verifyGridLicense?.() 선택적 호출
- 근거: MOD-GRID-99-A 미완료, stub에 안전하게 no-op
- 상태: G-001 useCellRange.ts에 적용

## D3: CellRange 독립 상태
- 결정: TanStack rowSelection과 무관한 독립 state
- 근거: 서로 다른 데이터 모델, 레이어 분리
- 상태: G-001 설계 확정

## D4: ring-1 ring-blue-400 (AC-005)
- 결정: L0 border-blue-300을 ring-1 ring-blue-400으로 변경
- 근거: AC-005 명시 요건, border-box 안전성
- 상태: G-001 Section 7 #4, #9 적용
```

---

## Section 13 — H 메타게이트 체크리스트

| 게이트  | 조건                                                              | 충족 근거                                                                               |
|---------|-------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| H-01    | 모든 기술 주장에 파일/라인 인용                                   | RangeSelectGrid.tsx L11-12(AC-001), L33-44(AC-002), L78-96(AC-003/004), L191(D4), ag-grid-feature-matrix.md L34(AC positioning), publish-wijmo-analysis.md §3 L104-117(D3 inspiration), package.json L5(AC-007) |
| H-02    | 경로 합리성: 신규 파일 모두 monorepo에, alias만 TOMIS에           | Section 7 #1-8: `topvel-grid-monorepo/packages/grid-pro-range/src/`. #9: TOMIS `tw-framework-front`. C-28 적용. |
| H-03    | AC 소스 태그: 각 AC가 goals.json 또는 rubric 조항으로 추적 가능  | Section 5 전체: goals.json AC-001~AC-011 직접 매핑. AC-011은 E-01(v1.0.6) 바인딩 명시. |

---

*spec version: 1.0.0 | rubric version: v1.0.6 | generated: 2026-05-14*
