# W3 — React DX 마찰 분석 + 개선 백로그 (2026-06-19)

> W3(§4 ROADMAP) 단계1=분석. 실측(grid-core 소스 + 스토리/테스트) 근거. 목표: 소비자가 *무엇을 알아야/써야* 하는지와 함정을 인벤토리하고, 우선순위 개선 백로그를 만든다.

## 1. 현 상태 요약 (실측)
- `Grid<TData>` 공개 prop **~93개**. ergonomic 토글(`enableSort`, `rowSelection:'multi'`)과 **TanStack 타입 누출**이 혼재.
- **TanStack 직접 누출 11종**: `ColumnDef`·`Cell`·`Column`·`Row`·`SortingState`·`ColumnFiltersState`·`RowSelectionState`·`ColumnPinningState`·`ColumnSizingState`·`ExpandedState`·`PaginationState`·`OnChangeFn`.
- ★**이미 존재하는 고수준 레이어**(부분): `TopgridColumnDef`(`{id,name,type,align,width}`) + `createColumns()`(type→렌더러 자동 라우팅) + `createAutoGroupColumn()`. → "컬럼 빌더" DX 는 일부 해결됨. 소비자가 `createColumns` 를 쓰면 TanStack `ColumnDef` 지식 없이도 기본 그리드 구성 가능.
- 소비자는 `useReactTable()` 를 **직접 구성하지 않음**(Grid 가 소유) — `data`+`columns` 만 전달.

## 2. 함정 인벤토리 (우선순위)

### P1 (silent breakage — 가장 아픔)
- **F-A/I/J getRowId 미지정 → 인덱스 식별**: selection·row-reorder·cell-flash 가 정렬/필터 후 **엉뚱한 행을 추적**. 무경고(기존). 다수 스토리가 방어적으로 `getRowId` 지정. → **✅ 본 증분서 dev-warn 추가**(아래 §4).

### P2 (silent no-op — "되는 줄 알았는데 안 됨")
- **F-E `TopgridColumnDef.visibility:false` 무시**: ColumnDef/initialState 에 매핑 안 됨 → 컬럼 그대로 보임. 소비자가 `initialState.columnVisibility` 수동 지정해야. (createColumns.ts:138-140)
- **F-C checkbox type + accessorKey**: raw ColumnDef 경로=무음 무시 / createColumns 경로=console.warn. 두 경로 불일치.

### P3 (TanStack 지식 강제)
- **F-H `ColumnDef` union 판별**(AccessorKey vs Display) — group 헤더는 nested `columns`. raw 경로서 오타→암호적 TanStack 에러.
- **F-D `renderFloatingFilter(column)`**: raw `Column` 노출, 소비자가 `getFilterValue`/`setFilterValue` 수동 동기화.
- 콜백류(`onCellClick`/`getCellTooltip`/state `onChange`)가 TanStack `Cell`/`OnChangeFn<State>` 노출.

### P4 (조합 미검증/위험)
- **F-B virtualization + rowPinning**: 동시 사용 미지원이나 런타임 차단 0(undefined behavior).
- **F-F `onRowReorder(from,to)`=데이터 인덱스**(시각 위치 아님) — 페이지네이션 시 혼동.
- multisort without sort=dev-warn 기존.

## 3. 개선 백로그 (우선순위 × 비용 × 리스크)
| ID | 개선 | 가치 | 비용 | 게이트 |
|----|------|------|------|--------|
| W3-1 | **getRowId 미지정 dev-warn**(F-A/I/J) | 높음(P1) | 소(pure helper) | **✅ done(§4)** |
| W3-2 | visibility:false dev-warn or 자동 initialState(F-E) | 중 | 소(createColumns) | node-test |
| W3-3 | virtualization+pinning 조합 dev-warn(F-B) | 중 | 소 | dev-only |
| W3-4 | 타입 누출 축소: `Cell`/`Column` 노출 콜백에 thin 래퍼 타입(row+값만) | 중 | 중(표면 변경) | 신중(API) |
| W3-5 | 고수준 `<DataGrid data columns=createColumns>` 레시피 + Next.js/SSR 가이드 | 중 | 중(문서) | 없음 |
| W3-6 | 컬럼 빌더 타입 안전 강화(`type`↔value 추론) | 중 | 중 | typecheck |

★원칙: **기존 저수준 API 유지 + 고수준/경고를 additive 로 얹기**(파괴적 변경 회피). createColumns 가 이미 고수준 경로이므로 "신규 프레임워크"가 아니라 **함정 제거 + 고수준 경로 보강**이 W3 의 핵심.

## 4. 본 증분(W3-1) — getRowId 미지정 dev-warn (✅)
- 신규 pure `shouldWarnMissingRowId(props)`(`grid-core/src/internal/devWarnings.ts`): getRowId 부재 + identity 의존 기능(rowSelection≠none / enableRowReorder / enableRowPinning / enableCellChangeFlash) 활성 시 true. `MISSING_ROW_ID_WARNING` 메시지.
- Grid.tsx: 기존 dev-warn 패턴(useEffect+NODE_ENV 가드+mount 1회)에 1개 추가. **prod 빌드 무영향**(가드).
- 검증: node **devWarnings 11 passed**·typecheck0·`pnpm build` 전패키지 green. ★dev-only+prod-suppressed+additive useEffect → storybook(prod) byte-identical = chromium 무영향(미실행 정당).

## 5. 다음
W3-2(visibility dev-warn, node-test) 또는 W3-3(조합 경고). 그 후 W3-4(타입 누출 축소)=신중한 API 작업. 발행은 grid-core 변경 누적 후 user-gated(현재 dev-warn 만=다음 grid-core 릴리스에 동승).
