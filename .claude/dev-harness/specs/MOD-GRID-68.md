# MOD-GRID-68 — 뷰포트 행 모델 (viewport row model / real-time push)

dev-harness 50번째 (**Enterprise ❌ backlog — 비-DnD tail 2번째, reuse-friendly**, advisor). grid-pro-serverside(Pro).
갭분석 **Row models/data ❌ = Viewport row model**(서버가 가시 viewport 를 push, 실시간 in-place 업데이트). 경쟁: AG Viewport Row Model(enterprise, streaming/real-time).

## verify-first + reuse-gate (advisor: label pre-defer 금지, read 로 판정)
- grep: SSRM(MOD-22)=**pull-based**(ensureRange→getRows promise, block lazy). infinite scroll=그 결과(🟡). viewport=**push-based**(datasource 가 setRowData 콜백으로 행을 밀어넣음)+**실시간 in-place 행 업데이트** → SSRM 와 제어흐름 상이, genuine 부재(✅ Viewport-change observer hook 와도 별개).
- 재사용: RowPlaceholder/isRowPlaceholder(materialize 형태)·Grid enableVirtualization+virtualizerOptions.onChange 배선(useServerSideData 동형)·React-free 컨트롤러(node 검증) 패턴.
- **build-vs-defer(read)**: additive **신규** 컨트롤러/hook/datasource 타입, Grid 가상화 재사용, **core scroll-path 무수정** → build(SSRM 와 독립 add-on; "server-streaming node-substance-0" 옛 추정 번복=sparse store+materialize+in-place update 가 node-substance).

## Goals
- **G-1 순수 viewport store — 종결형(map)**:
  - `materializeViewport<T>(rows: Map<number,T>, rowCount): Array<T|RowPlaceholder>` — sparse 행 맵→placeholder 채운 배열(미로드=RowPlaceholder, MOD-22 형태 재사용).
  - node 검증: 부분 로드·전체·빈·rowCount 초과 인덱스 무시·in-place 덮어쓰기.
- **G-2 React-free 컨트롤러 + hook 배선형(chromium ★end-to-end)**:
  - `createViewportRowModel(datasource, {rowCount}, onChange)`: datasource.init({setRowCount,setRowData}) 1회 → setRange→datasource.setViewportRange(first,last)(push 유발) → setRowData 콜백→sparse map 갱신→emit. **실시간 in-place**: 이미 가시 index 에 setRowData→그 행만 갱신.
  - `useViewportRowModel(datasource,{rowCount})`→gridProps(enableVirtualization+virtualizerOptions.onChange). (node: 컨트롤러 push/range/in-place 직접 검증.)
  - **★발산**: mock viewport datasource(setViewportRange→해당 범위 행 push)→`<Grid>` 가 viewport 행 렌더 + **서버 push 시뮬(버튼)→가시 행 셀 in-place 갱신**(실시간=뷰포트 모델 차별점).

## In / Out
- **In**: 순수 materializeViewport+test + ViewportDatasource 타입 + createViewportRowModel(React-free)+node test + useViewportRowModel hook + index export + 스토리 + chromium.
- **Out(명시 — silent gap 금지)**:
  - **서버사이드 정렬/필터/그룹**: viewport=flat real-time(서버가 push). 정렬/필터=SSRM(MOD-22) 또는 datasource 소관 = vN.
  - 버퍼 밖 행 **eviction**(LRU): v1=push 행 보관(SSRM v1 메모리 노트 동형) = vN.
  - 행 인덱스 이동(insert/remove shift) 실시간 = vN(setRowData 는 index 덮어쓰기·setRowCount 만).

## ★ ❌ 닫힘 마커
- **Viewport row model = ✅**: push-based datasource + 실시간 in-place + 순수 materialize, end-to-end. COMMERCIAL-GAP **Row models/data** 1 ❌→✅ → ❌13→12·✅243→244. reconcile 19/19·330.

## AC
G-1 materializeViewport(node) · G-2 컨트롤러 push/range/in-place(node) + ★viewport 렌더+실시간 셀 갱신(chromium end-to-end).

## constraints
- grid-pro-serverside(Pro). 외부 dep 0. **LESS-006**: 렌더/실시간=chromium. 순수 map=node. **★core scroll-path 무수정**(Grid 가상화 재사용, SSRM 컨트롤러 무수정=별 컨트롤러).
- 기존 SSRM(block cache/controller/hook) 무수정(viewport=독립 add-on). 기존 SSRM 회귀 green 유지.

## 의존
grid-pro-serverside 내부(materializeViewport + ViewportDatasource + createViewportRowModel + useViewportRowModel). story=useViewportRowModel+Grid. 외부 0.

## 분류 (MASTER §2)
materializeViewport=**종결형**(순수 map). createViewportRowModel/hook=**배선형**(node 컨트롤러+chromium).

## reuse-gate 결과 / 추측 0
재사용=RowPlaceholder/isRowPlaceholder·materialize 형태·Grid 가상화 배선(useServerSideData)·React-free 컨트롤러 패턴(serverSideController). 신규=push-based viewport 컨트롤러+datasource+materializeViewport. 추측 0: AG Viewport Row Model(IViewportDatasource init/setViewportRange/setRowData)=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(materializeViewport map + push 컨트롤러 end-to-end) **9/10** · [x] In/Out(정렬/필터/eviction/shift Out) **10/10** · [x] AC(node map+컨트롤러·실시간 chromium) **10/10**
- [x] reuse-gate(RowPlaceholder·Grid 가상화·React-free 컨트롤러·build-vs-defer read) **10/10** · [x] constraints(core 무수정·SSRM 독립·LESS-006) **10/10** · [x] 의존(내부, 외부 0) **9/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(종결형+배선형) **9/10** · **합계 76/80 통과.**

---

## G-1·G-2 결과 (완료 — 2026-06-08) → MOD-68 = ✅, §3 이관
**구현**(grid-pro-serverside, 기존 SSRM[block cache/controller] 무수정 독립 모델):
- G-1 순수 `materializeViewport<T>(rows:Map<number,T>, rowCount)→Array<T|RowPlaceholder>`(sparse→placeholder, MOD-22 RowPlaceholder 재사용).
- G-2 React-free `createViewportRowModel(ds,{rowCount},onChange)`(ds.init({setRowCount,setRowData})+setRange→setViewportRange+★in-place 라이브 갱신+범위 가드) + `useViewportRowModel` hook(Grid 가상화 배선+unmount destroy) + index export.

**검증**: **node 15/0**(`viewportRowModel.test.ts`: materialize 부분/전체/빈/0 + 컨트롤러 init·push·★in-place·범위초과 가드·resize) · typecheck 0 · build green · **chromium 1/1**(`viewport-row-model.spec.ts`) + **full-suite 114/114 green**(★기존 SSRM 회귀 통과=독립 add-on).
- ★end-to-end: mock viewport datasource→viewport 행 push 렌더(row-0) + 서버 push 시뮬→가시 셀 in-place(row-0→UPDATED, 타 행 무영향).

## ★ closure + 발견 (advisor)
- **Viewport row model = ✅**: COMMERCIAL-GAP **Row models/data ❌ 1→0**, **❌13→12·✅243→244·🟡71**(reconcile 19/19·330·0 mismatch·Enterprise 8→7).
- **advisor: label pre-defer 금지→read 로 판정**: push-based+실시간 in-place=SSRM(pull)·infinite scroll(🟡)과 제어흐름 상이=genuine 부재. "server-streaming node-substance-0" 옛 추정 번복(sparse store+materialize+in-place=node-substance).
- **build-vs-defer**: additive 신규 컨트롤러/hook/ds + Grid 가상화·RowPlaceholder 재사용 + core/SSRM 무수정 → build(독립 add-on).
- **Out 명시**: 서버 정렬/필터/그룹·버퍼 밖 eviction·행 shift 실시간=vN.

## 모듈 완주 요약
2-Goal(✅): Enterprise backlog 15번째(비-DnD tail 2, reuse-friendly, advisor). push-based viewport 모델(SSRM 무수정 독립): 순수 materializeViewport+React-free createViewportRowModel(in-place 라이브)+useViewportRowModel hook. node 15/0·chromium 1/1·114/114 green. Row models/data 0 ❌. 신규 lesson 없음.
