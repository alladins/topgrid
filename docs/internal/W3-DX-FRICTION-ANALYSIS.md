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

## 5. 증분2(W3-5 일부) — 온보딩 고수준 경로 전환 (✅ docs)
★실측 발견: `getting-started.md` 가 **저수준 raw `ColumnDef` 경로**(TanStack import + `{id,accessorKey,header}`)를 가르치고 있었음 — 고수준 `createColumns` 가 이미 있는데도. + **doc 버그**: 예제가 `enableSorting`(존재 안 함, 실제=`enableSort`) 사용 → 정렬 안 됨.
- 수정: 2.3 첫 그리드를 **`createColumns` from `@topgrid/grid`**(렌더러 자동 배선)로 전환, `{id,name,type}` 선언(TanStack 무지식). `enableSort` 정정. **getRowId 가이드 추가**(W3-1 dev-warn 과 연결). 저수준 경로는 "advanced"로 강등.
- docs-only(코드 0, 게이트 없음).

## 6. 증분3(W3-3) — 저비용 함정 dev-warn 묶음 (✅ node-tested)
- **F-B virtualization+rowPinning**(미지원 조합) Grid-level dev-warn. **F-E visibility:false**(createColumns 무음 무시) dev-warn.
- 구현: devWarnings.ts 에 `shouldWarnVirtualizationRowPinning`·`collectGridDevWarnings`(collector)·`visibilityNoOpColumnIds` 추가. Grid.tsx 의 W3-1 effect → collector 로 통합(getRowId+virt-pin 한 곳). createColumns.ts → visibility 경고(기존 unguarded warn 스타일 일치).
- 검증: node **devWarnings 17 passed**·typecheck0·grid-core 전테스트 green·전패키지 build green. dev/config-time only → chromium 무영향.
- ★**부수 발견(인프라)**: `createColumns.test.ts` 등 일부 테스트가 **vitest**(`vi`/`it`) 작성인데 **vitest 미설치·미실행**(grid-core test 스크립트=node --strip-types 체인만, vitest config 0) = **dead test**. → 인프라 백로그(node 로 포팅 or vitest 도입). 본 증분 신규 테스트는 검증되는 node 패턴 사용.

## 7. 증분4(W3-4) — TanStack 타입 누출 축소: ADR + clean adapter (✅ 설계+착수)
- **설계=[[ADR-006]]**: non-breaking. clean topgrid 타입 + pure adapter helper 도입, 기존 시그니처 무변경, 콜백 retype 은 grid-core **1.0 으로 연기**. state onChange 래핑 거부(저ROI). breaking retype·병렬-prop 거부.
- **착수(impl 증분1)**: grid-core `src/dx/cleanTypes.ts`(`GridCellContext<TData>`{rowId,columnId,value,row}·`GridFilterColumn`{id,value,setValue}) + `src/dx/adapters.ts`(`toGridCell`/`toGridFilterColumn`, 최소 structural 입력=TanStack Cell/Column 이 구조적 만족→node-test 가능, @tanstack import 0). grid-core+facade index export.
- 검증: node **dx adapters 7 passed**·grid-core typecheck0·grid-core 전테스트 green·**전패키지 build green**(facade dist 포함). ★facade `tsc --noEmit` 는 **사전존재** gap(grid-pro-filter dist 가 `@tanstack/table-core` 참조, 루트 미해소)으로 실패 — 본 W3-4 변경과 무관(내 심볼 에러는 해소됨, 카논 게이트=build green). [인프라 백로그].
- **마무리(✅ docs)**: getting-started §5.5 레시피 `onCellClick`/`getCellTooltip` → `toGridCell` (+ `toGridFilterColumn` 언급, 하위호환·1.0 전환 예고). W3-4 표면 작업 완료.
- 남은: 1.0 migration 항목(콜백 시그니처 clean 전환)=차기 major. 발행=grid-core 변경 누적 후 user-gated.

## 7b. ★grid-core@0.7.0 lockstep 발행 (2026-06-20, ✅ npm live)
사용자 결정: 전체 lockstep. grid-core W3 변경(dev-warn 3 + toGridCell/toGridFilterColumn) 발행 = exact-pin 전이폐포 **13 패키지** minor bump·topo 발행.
- bump: grid-core 0.7.0·grid 0.10.0·grid-features 0.10.0·grid-renderers 0.4.0·grid-sizing 0.4.0·grid-pro-{edit-plus 0.4,filter 0.4,header 0.5,master 0.8,pivot 0.5,serverside 0.3,sheet 0.5,tracking 0.4}. 미터치 14.
- 검증: build topo green·pnpm -r test EXIT0·pnpm pack ×13 누출0·topo 발행 13/13 OK·★스모크 `npm i @topgrid/grid`=**단일 grid-core@0.7.0 deduped**(혼재 0=lockstep 목적 달성)·toGridCell/toGridFilterColumn=function(facade 노출 확인). (npm audit 권고=차트/export 광범 그래프의 사전존재 transitive advisory, 본 변경 무관.)

## 7c. 증분5(W3-5) — Next.js/SSR 가이드 (2026-06-20, ✅ docs)
- `docs/internal/guides/nextjs-ssr.md`: App Router 핵심 3규칙(`'use client'`·컬럼은 클라이언트 생성·data 만 서버 전달)·App/Pages 패턴·SSR/하이드레이션(테이블 SSR O, 가상화 client-only, `ssr:false` dynamic)·Tailwind·함정표(함수 prop 직렬화·document undefined·hydration mismatch·getRowId)·Vue/Nuxt 차트 SSR 링크. getting-started §9 에 Next.js·charting 링크 추가(발견성).
- docs-only.

## 8. 인프라 백로그 (W3 중 발견 → ✅ 정리 완료 2026-06-20)
- ✅ **facade tsc gap**: `@tanstack/table-core ^8` 루트 devDep 추가 → 전 패키지 `tsc --noEmit` 무에러(게이트 복원). 소비자는 react-table peer 로 무관.
- ✅ **dead vitest 부활**: 정밀 식별=**6 파일**(grid-core, `from 'vitest'`): createColumns·createGroupedColumns·useColumnPersistence·useStoragePersist·useUrlSync·ColumnVisibilityMenu. vitest+jsdom+@testing-library+jest-dom 도입(루트 devDep), `packages/grid-core/vitest.config.ts`(globals:true=auto-cleanup, jsdom, 6 파일 명시 include) + setup(jest-dom). grid-core `test` 에 `&& vitest run` 추가=게이트 편입.
  - ★부활이 잡은 것(dead test 의 가치 실증): (1)2 env-setup gap(jest-dom 매처 누락·testing-library cleanup 미등록=globals) (2)**1 stale test**(useColumnPersistence TC-003): `toBeNull` 기대가 **persist-on-mount 효과 미고려**—hook 은 정상(version mismatch→stale 삭제 후 현 state 를 v:2 로 재기록). 테스트를 올바른 불변식(복원 skip + v:2 재기록·stale 데이터 미전파)으로 정정. **코드 버그 아님**.
  - 결과: 6 파일 **42 tests passed**, `pnpm -r test` 전체 green.

## 9. 증분6 — 예제 앱 (apps/example-react) (2026-06-20, ✅ advisor 위임 채택)
> advisor 판단: W3 후보(1.0 migration 노트·예제 앱·문서사이트) 중 예제 앱이 최고가치(실행 레퍼런스 + 발행 직후 grid-core@0.7.0 facade 실브라우저 통합 검증 + 게이트 없음). 1.0 노트는 흡수.
- **`apps/example-react/`**: 소비자 스타일 앱. `@topgrid/grid` facade + `createColumns([{id,name,type}])` + `getRowId` + `onCellClick→toGridCell`(W3 DX 표면 실증). esbuild 번들 + Playwright e2e.
- **real chromium 3 passed**: 3행 렌더(createColumns+facade)·나이 헤더 클릭 live 정렬·셀 클릭 `toGridCell`. = 발행된 facade end-to-end 스모크(소비자-앱 통합 각도, storybook 컴포넌트 외 신규).
- ★**예제가 잡은 실 함정**: `TopgridColumnDef.align` 이 **필수**였음 → `{id,name,type}` 만 쓰는 W3-2 docs/예제가 타입 부정합(createColumns 는 런타임 tolerant). **DX 수정: align 옵셔널화**(default 'left', types.ts+createColumns). ★단 align-optional 은 **미발행**(grid-core@0.7.0 은 align 필수) → 다음 grid-core 릴리스 동승. 예제/내부docs 는 workspace(align-optional) 소비라 in-repo 일관. ★align-optional 발행 완료(grid-core@0.8.0 lockstep 13, 2026-06-20): npm 타입 align? 옵셔널 확인·단일 0.8.0 deduped. → 문서/예제 npm 정합. 문서사이트 반영 진행.
