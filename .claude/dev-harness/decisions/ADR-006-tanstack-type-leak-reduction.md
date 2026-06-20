---
id: ADR-006
title: W3-4 — 소비자 API 의 TanStack 타입 누출 축소 (non-breaking adapter)
module: W3 (grid-core DX)
date: 2026-06-19
status: accepted
related: ["W3-DX-FRICTION-ANALYSIS.md", LESS-002, "ADR-004(structural bridge)"]
---

# ADR-006 — TanStack 타입 누출 축소: clean 타입 + adapter helper (non-breaking)

## Context
[[W3-DX-FRICTION-ANALYSIS]] 가 `Grid` 공개 API 의 **TanStack 직접 누출 11종**을 적발 — 특히 콜백 인자:
- `onCellClick` / `onCellKeyDown` / `getCellTooltip` → `Cell<TData, unknown>`(TanStack)
- `renderFloatingFilter` → `Column<TData, unknown>`(TanStack; 소비자가 `getFilterValue`/`setFilterValue` 수동)
- state `onChange` → `OnChangeFn<SortingState | …>`(TanStack updater-fn + state shape)

소비자가 차트/그리드를 쓰려면 TanStack 타입을 import·이해해야 한다(DX 마찰). **제약**: grid 패키지(~21) 발행됨·실 소비자 존재 → **하위호환 최우선**(0.x 안정성).

## Decision
**clean topgrid-owned 타입 + pure adapter helper 를 additive 로 도입. 기존 시그니처는 무변경(non-breaking).** 콜백 retype 은 다음 major(grid-core 1.0)로 연기.

- **D1 clean 타입(신규 공개)**:
  - `GridCellContext<TData> = { rowId: string; columnId: string; value: unknown; row: TData }` — TanStack `Cell` 의 큐레이트 부분집합(메서드 없음).
  - `GridFilterColumn = { id: string; value: unknown; setValue: (v: unknown) => void }` — floating filter 용(getFilterValue/setFilterValue 를 value/setValue 로 정규화).
- **D2 pure adapter helper(node-test 가능)**: `toGridCell(cell): GridCellContext<TData>`, `toGridFilterColumn(column): GridFilterColumn`. 소비자가 TanStack 객체→clean 으로 변환(우리가 시그니처를 안 바꿔도 clean 데이터 사용 가능). grid-core 의 순수 모듈(React 0)로 두어 node 검증.
- **D3 기존 콜백 = TanStack 타입 유지(now)** + 문서/deprecate 안내. **grid-core 1.0** 에서 시그니처를 clean 타입으로 전환(migration note). 그 전까지 D2 helper 가 다리.
- **D4 state onChange(`OnChangeFn<State>`) 는 래핑 안 함** — TanStack updater-fn 패턴 + state shape 가 본질적으로 TanStack. 래핑 비용 큼·ROI 낮음 → 문서로 shape 설명.

## Rejected
- **(R1) 지금 시그니처 retype**(예: `cell: Cell`→`cell: GridCellContext`) — `cell.getValue()` 등 TanStack 메서드 쓰는 **실 소비자 즉시 파손**. 0.x 중간 major churn·마이그레이션 경로 없음. 거부.
- **(R2) 병렬 clean 콜백 prop 추가**(`onCellClickClean` 등) — 분석이 지적한 **93-prop 비대화**를 악화. 표면 중복. 거부(helper 가 prop 없이 해결).
- **(R3) state 전체 래핑**(SortingState→`GridSort[]` + clean onChange) — updater-fn·다수 state 종 → 고비용·저ROI. 거부(문서화).
- **(R4) 누출 방치(문서만)** — DX 마찰 미해소. 거부(최소한 helper+clean 타입 제공).

## Trade-offs
1. **adapter helper(opt-in) vs 시그니처 narrowing(auto)**: helper 는 소비자가 *호출할 줄 알아야*(발견성 비용) 하나 **non-breaking**. narrowing 은 자동이나 **즉시 파손**. → 발행물 안정성 위해 helper(non-breaking) 선택.
2. **콜백 retype 을 1.0 으로 연기 vs 지금**: 연기 = 0.x 실 소비자 안정 유지. 비용 = 1.0 까지 시그니처에 누출 잔존(단 helper 가 clean 데이터 경로 제공). 수용.
3. **clean 타입 신규 표면 vs 누출 유지**: 신규 타입 4개 추가(표면 약간 증가)나, 소비자가 TanStack import 0 로 cell/filter 데이터 사용 가능 = 순 DX 이득.

## 구현 함의 (W3-4 착수 = 이 ADR 후속)
- grid-core 신규 pure 모듈 `src/dx/cleanTypes.ts`(타입) + `src/dx/adapters.ts`(`toGridCell`/`toGridFilterColumn`) + node test. facade/index export.
- 문서: getting-started/api-reference 에 "TanStack 없이 cell 데이터 쓰기" 레시피(`onCellClick={(cell) => { const c = toGridCell(cell); … }}`).
- ★1.0 migration 항목 등록(콜백 시그니처 clean 전환). 발행=grid-core 변경 누적 후 user-gated.

## 1.0 구현 컷 (2026-06-21, D3 이행 — grid-core 1.0 동반)
D3 가 1.0 으로 연기했던 "콜백 시그니처 clean 전환"을 [[ADR-007]](키 안전 union)과 **같은 major(grid-core 1.0)** 에
흡수해 실행한다(major 1회). 확정 시그니처 — 전부 TanStack 타입 0:

```ts
// 기존(0.x): cell: Cell<TData,unknown> + row: TData  →  1.0: 단일 GridCellContext<TData>(=cell+row 통합)
onCellClick?:    (ctx: GridCellContext<TData>, event: MouseEvent<HTMLTableCellElement>) => void;
onCellKeyDown?:  (ctx: GridCellContext<TData>, event: KeyboardEvent<HTMLTableCellElement>) => void;
getCellTooltip?: (ctx: GridCellContext<TData>) => string | undefined | null;
renderFloatingFilter?: (column: GridFilterColumn) => ReactNode;  // Column<TData,unknown> → GridFilterColumn
// D3 확장(아래 근거): 동일 Cell 누출이므로 같은 컷에 포함
type CellClassNameCallback<TData> = (ctx: GridCellContext<TData>) => string | undefined;
```

- **D3-1 단일 ctx 통합**: 기존 `(cell, row, event)` 3-arg 에서 `row` 는 `cell.row.original` 의 중복이었다 →
  `GridCellContext` 가 이미 `row` 를 품으므로 `(ctx, event)` 2-arg 로 축약. `cell.column.id`→`ctx.columnId`,
  `cell.row.id`→`ctx.rowId`, `cell.getValue()`→`ctx.value`, `row`→`ctx.row`. 소비자 코드 1:1 치환 가능.
- **D3-2 Grid.tsx 배선**: 호출부에서 `toGridCell(cell)`·`toGridFilterColumn(col)` 로 변환해 콜백에 전달
  (adapter=이미 발행된 순수 helper 재사용 — 신규 로직 0). 런타임 동작 불변(같은 데이터, 형태만 clean).
- **D3-3 `cellClassName` 포함(scope 확장, 명시)**: ADR-006 D3 명시 목록(onCellClick/KeyDown/Tooltip/
  renderFloatingFilter)엔 없었으나 `CellClassNameCallback` 도 동일한 `Cell<TData,unknown>` 누출이다.
  지금 빼면 **나중에 그것만을 위해 또 major** 가 필요(retype=breaking) → 1.0 일관성 위해 동봉. 근거 기록(silent
  확장 금지). 유일 가시 소비자=`Grid.theme.stories`(`cell.column.id`→`ctx.columnId`).
- **D3-4 per-cell 할당 trade-off**: `getCellTooltip`·`cellClassName` 은 렌더마다 셀별 호출 → `toGridCell` 가
  셀당 객체 1개 할당(0.x 는 TanStack cell 직전달=할당 0). **단 콜백 제공 시에만**, 가상화 시 viewport-bounded.
  수용(클린 API > viewport 한정 소형 할당). onCellClick/KeyDown 은 이벤트시에만 할당(무관).
- **마이그레이션 표면(가시, 1.0 동반 수정)**: grid-features `TextFloatingFilter`/`NumberFloatingFilter`
  (`Column`→`GridFilterColumn`: `getFilterValue()`→`.value`·`setFilterValue`→`.setValue`·`id` 동일),
  grid-pro-master `MasterDetailGrid`·`ContextMenuGrid`(`onCellClick(cell,row,e)`→`onCellClick(toGridCell(cell),e)`),
  스토리(cell-tooltip·theme·FloatingFilters)·`apps/example-react`(이미 `toGridCell` 사용 → 인자 직수신으로 단순화).
  PTLPSM=세션 권한 밖(릴리스 노트 마이그레이션 가이드로 커버, [[ADR-007]] 영향표면 실측과 동일 한계).
- **검증 게이트**: `tsc --noEmit`(시그니처) + 기존 chromium 게이트(cell-tooltip·FloatingFilters 동작 불변) +
  node adapters.test(toGridCell/toGridFilterColumn 불변). 런타임 무변경이므로 동작 회귀 0 기대.

## 컴파운딩 데이터포인트 (하네스 학습)
**발행된 라이브러리의 DX 개선은 "깨끗한 재설계"가 아니라 "non-breaking 다리(adapter) + major 로 전환 연기".** [[ADR-004]] 의 structural-bridge(타입을 구조적으로 만족)와 짝 — 여기선 *역방향*(리치 TanStack→clean 부분집합 추출). 하위호환이 깨끗함을 이긴다(실 소비자 존재 시). ★1.0 컷에서 **adapter 가 다리에서 기본 경로로 승격**: 0.x 가 비축해 둔 순수 helper(toGridCell/toGridFilterColumn)를 Grid 내부 배선이 직접 호출 → major 전환 비용이 "신규 설계"가 아닌 "이미 검증된 helper 재사용"으로 흡수됨(연기 전략의 배당금).
