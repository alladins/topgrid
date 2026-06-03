# MOD-GRID-22 spec — `grid-pro-serverside` (SSRM, **Pro**, Full, partial §10.3 가능)

> dev-harness loop 9번째. 첫 **server-side row model**(AG SSRM 대응). weight=Full(3-Goal). Pro → **PAT-003**
> (checkLicense module-load + grid-license runtime dep + EULA.md). 첫 Pro since MOD-23.
> reuse-gate(LESS-003 live-overlap): grid-core 가 **서버 페이징**(`pagination.mode='server'`/`manual`,
> `manualPagination`, `totalCount`/`pageCount`/`rowCount`, `GridPagination`), **행 가상화**(`useGridVirtualizer`
> = vertical `useVirtualizer`, padding-`<tr>`), **트리/expanding**(`enableExpanding`, `getSubRows`, `ExpandedState`)
> 보유. **부재(신규)** = 블록 단위 lazy 로드(datasource·블록 캐시·무한스크롤 fetch 트리거·서버 정렬/필터/그룹
> 파라미터 전달+무효화·lazy 그룹 자식 fetch). → SSRM = 기존 행-가상화 위 **placeholder-배열 materialize** + 순수
> 블록 캐시(신규 Pro 패키지). **grid-core scroll-path 미접촉**(advisor).

## ★ 핵심 불변식 (fork 아님 — advisor) — query epoch 으로 stale-response 거부
**정렬/필터/그룹이 바뀌면 진행 중(in-flight)인 *이전 쿼리* 요청 응답이 *새* 캐시를 절대 오염시키지 않는다.**
각 요청에 generation(epoch) 카운터를 태깅하고, 쿼리 변경 시 bump, 응답 epoch ≠ 현재 epoch 이면 폐기.
이것이 SSRM 의 위험한 async race(빠른 sort-toggle 시 옛 블록이 새 순서를 덮어써 행 순서 손상)이며,
**MOD-27 의 핀-항상-렌더 불변식과 동형 — 브라우저에서만 드러나는 결함을 node 에서 결정적으로 못박는다.**
→ G-1 코어(epoch + 블록 산술)는 node 전수 검증, 브라우저는 "스크롤 시 블록이 *정확히 1회* 로드되나"로 축소
([[LESS-006]] 정면 적용: node-green ≠ 동작. fetch 검증은 mock-datasource 통합 테스트로 *특정 블록* 출현 +
*정확히 1회* 호출 단언, "행이 좀 나왔다" 금지).

## Goal
대용량 서버 데이터를 블록 단위로 lazy 로드 — 무한 스크롤 + 서버 정렬/필터/그룹/페이징 통합. 경쟁: AG Grid SSRM.
- **In**: datasource 인터페이스(`getRows({startRow,endRow,sortModel,filterModel}) → {rows, lastRow?}`), 블록 캐시
  (loaded/loading/stale + epoch), lazy 그룹/트리 펼침, 캐시 무효화 API.
- **Out**: 클라이언트 전체로드(기존 `mode='client'`), 오프라인, LRU/메모리 eviction(AC④=명시적 무효화 전용).

## Goals (cohesion seam = AC③ — advisor)
- **G-1 순수 flat 블록 캐시 + 요청 플래너 + epoch — ★ node 검증**:
  - **datasource 계약**(type-only): `ServerSideDatasource<TData>` = `{ getRows(req): Promise<GetRowsResult<TData>> }`.
    `GetRowsRequest = { startRow, endRow, sortModel: SortModelItem[], filterModel: FilterModel }`.
    `GetRowsResult = { rows: TData[]; lastRow?: number }`. **total/last-row 신호 필수**(virtualizer 가 전체 크기
    선행 요구 — `lastRow`(이 블록이 끝이면 절대 인덱스) 또는 별도 `rowCount`). seed 미명세 핵심 설계점.
  - **순수 함수**(React/네트워크 0):
    - `planBlocks(visibleStart, visibleEnd, blockSize, cache) → number[]` — 가시 범위가 필요로 하는 블록 인덱스 중
      **미로드·미진행(in-flight dedup)** 만 반환.
    - `markLoading(cache, blockIndex, epoch) → cache'` — 요청 발사 시 in-flight 표기(+epoch 태그).
    - `acceptBlock(cache, blockIndex, rows, epoch, totalCount?) → cache'` — **epoch ≠ cache.epoch → 무시(폐기)**;
      일치 시 블록 저장(loaded). lastRow/rowCount 반영.
    - `invalidate(cache) → cache'` — 전 블록 폐기 + **epoch++**(정렬/필터/그룹 변경 시).
    - `materialize(cache, totalCount) → (TData | RowPlaceholder)[]` — 길이 totalCount, 미로드 인덱스=placeholder.
      **순수/node 검증**(LESS-005 형: host 공개표면(`<Grid data>`) 위 최소 primitive).
  - 종결형(순수). 외부 dep 0(grid-license=Pro runtime dep, type-only peer).
- **G-2 thin `useServerSideData` 훅 + Grid 배선 (AC①②④)**:
  - `useServerSideData<TData>(datasource, { blockSize, totalCount? })` → virtualizer 가시범위 → `planBlocks` →
    `datasource.getRows` → `acceptBlock(epoch)` → `materialize` → `<Grid enableVirtualization data={...}>` 주입.
  - **grid-core host touch(정당, MIT generic — escalation 아님)**: `manualSorting`/`manualFiltering` passthrough prop
    추가(true 시 `manualSorting:true` + `getSortedRowModel` skip) → placeholder 배열의 클라이언트 정렬 방지.
    기존 `manualPagination` 미러. (블록캐시를 코어에 넣는 것과 대비 — 그건 escalation.)
  - **캐시 무효화 API**(AC④): 정렬/필터 state 변경 → `invalidate`+epoch++ → 가시범위 재요청. `refresh()` 노출.
  - **검증**: mock-datasource 통합(node 가능 시) — *특정 블록* 행 출현 + getRows *정확히 1회/블록* 호출,
    epoch race(빠른 invalidate 후 옛 응답 도착 → 무시) 단언.
- **G-3 lazy 그룹/트리 자식 fetch (AC③) — ✅ 완료**:
  - **계층 캐시** = flat `Map<pathKey, BlockCacheState>`(pathKey=`JSON.stringify(groupKeys)`, 각 노드가 G-1 캐시
    재사용 — n-레벨 무료) + `Set<pathKey>` expanded. 서버 grouping params(`groupKeys`/`rowGroupCols` = `GetRowsRequest`
    optional 추가, 부재=flat 후방호환). **척추 불변식**: 자식 응답은 (a)전역 epoch 일치 AND (b)노드 맵 존재 시만 수락
    (collapse=purge → late 응답 거부). model A(flatten→display list→기존 `<Grid data>`, **grid-core host touch 0**)
    + `useServerSideTree` 훅 + 스토리 그룹 cell 렌더러. node 23/23 + gap 9/9 + chromium AC③.

## AC
1. **(G-2) 스크롤→블록 요청 1회/블록**: 같은 블록은 in-flight/loaded 중 재요청 0(`planBlocks` dedup).
2. **(G-2) 서버 정렬/필터 파라미터 전달**: sort/filter state → `GetRowsRequest.sortModel/filterModel`. 클라이언트
   정렬/필터 비활성(manualSorting/Filtering, placeholder 배열 무손상).
3. **(G-3) lazy 그룹 펼침 시 자식 요청**: 그룹 노드 펼침 → 그 그룹 `groupKeys` 로 자식 블록 요청(계층 캐시).
4. **(G-2) 캐시 무효화 API**: `refresh()`/state 변경 → `invalidate`+epoch++ → 옛 in-flight 응답 폐기 + 재요청.
   **명시적 무효화 전용**(LRU 미구현; totalCount-길이 placeholder 배열 = 문서화된 v1 메모리 한계).

## AC (G-1 — 측정 가능, node)
- **epoch 거부**: invalidate 후 옛 epoch 응답 `acceptBlock` → 캐시 불변(폐기). 새 epoch 응답만 반영.
- **planBlocks dedup**: loaded/in-flight 블록 제외; 경계(가시범위가 블록 걸침/정렬/단일/빈 캐시).
- **materialize**: 길이=totalCount, 로드 인덱스=실데이터·미로드=placeholder, 블록경계 정확.
- **블록 산술**: index→block(`floor(i/blockSize)`), block→[start,end] 정확(±0). lastRow→totalCount 반영.

## constraints
- **PAT-003 (Pro)**: `checkLicense` module-load + `@topgrid/grid-license` runtime dep + `EULA.md`. dist 금지어 0.
- **POL-TANSTACK**: 정렬/필터/페이징 state = TanStack(`SortingState`/`ColumnFiltersState`); manual* 로 row-model 억제.
- **AP-001**: G-1 외부 optional peer import 0(순수). react/react-table/grid-core = type-only peer; grid-license=required.
- **C-003**: 주석↔소스 동기. v1 한계(메모리·flat-only if G-3 defer) 명시. **LESS-006**: ON 경로 브라우저 게이트.
- **host touch 경계**: grid-core 추가 = `manualSorting`/`manualFiltering` *generic passthrough* 만(블록 로직 0).

## 의존
신규 패키지 `packages/grid-pro-serverside`. peer: react, @tanstack/react-table, @topgrid/grid-core. runtime dep:
@topgrid/grid-license(Pro). 신규 외부 dep 0.

## 분류 (MASTER §2)
블록 캐시/planner/epoch/materialize = **종결형(순수)**. useServerSideData = **연동형**(virtualizer+datasource wiring).

## 수확 예상 (capture 시 검증)
reuse = PAT-001(순수 helper) + 기존 grid-core 행 가상화/서버 페이징/트리 + PAT-003(Pro 게이트). 신규 = 블록 캐시 +
epoch 불변식. **LESS-006 정면 적용**(node block-math+epoch / 브라우저 fetch-once). materialize = **LESS-005 형**
(host 공개표면 위 최소 primitive — grid-core 미접촉, 단 manualSorting passthrough 는 정당 host touch). PAT 후보
미정(epoch-staleness-rejection 이 N=2 면 승격 점검 — async-race-pinned-in-pure-core).
