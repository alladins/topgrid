# MOD-GRID-55 — 전 페이지 전체선택 (select-all across all pages)

dev-harness 38번째 (**Enterprise ❌ backlog — Tier 2 verify-first**, advisor). grid-core(MIT).
갭분석 **Selection ❌ = Select-all across ALL pages (action, not just current page)**. 경쟁: AG select-all-across-pages·Wijmo.

## verify-first (advisor Tier 2)
- grep 확인: CheckboxColumn 헤더(multi)=`getIsAllPageRowsSelected`/`getToggleAllPageRowsSelectedHandler`(**현재 페이지만**). 전 페이지 전체선택=**genuine 부재**(stale ❌ 아님).
- TanStack 제공: `getToggleAllRowsSelectedHandler`(전 페이지)·`getIsAllRowsSelected`/`getIsSomeRowsSelected`. 증분=헤더 체크박스 scope 옵션.

## reuse-gate + scope
- 재사용: CheckboxColumn 헤더 indeterminate 패턴(MOD-35 G-3)·TanStack 전-행 selection API. 신규=`selectAllPages` 옵션 분기.
- **license**: grid-core MIT(selection 무-게이트). 신규 0.

## Goals
- **G-1 전 페이지 전체선택 옵션 (chromium 발산) — 배선형**:
  - `GridRowSelectionOptions.selectAllPages?`(default false). true 시 multi 헤더 체크박스 = `getToggleAllRowsSelectedHandler`(전 페이지) + `getIsAllRowsSelected`/`getIsSomeRowsSelected` + aria-label "across all pages". createCheckboxColumn 2번째 인자.
  - **검증 ★발산(advisor, "체크박스 보임"=vacuous 금지)**: pagination(12행·pageSize 5) + multi. ① selectAllPages: 헤더 클릭→**선택 카운트=12(전체)** + 다음 페이지 행 체크됨 ② page-only(default): 헤더 클릭→카운트=5(현재 페이지만) ③ OFF/page-only byte-identical(기존 page-scope 헤더).

## In / Out
- **In**: `selectAllPages?` 옵션 + CheckboxColumn 헤더 전-행 분기 + buildTableOptions 전달 + 스토리(pagination+multi). 기존 page-scope 경로 무수정.
- **Out**: select-all 토스트/배너 UI(후속) · 필터된 전체선택 변형(getFilteredRowModel 기본 포함=TanStack) · single 모드(헤더 없음).

## ★ ❌ 닫힘 마커
- **Select-all across all pages = ✅**: 헤더 체크박스가 전 페이지 행 선택(카운트=전체, 페이지 이동해도 유지). COMMERCIAL-GAP **Selection** 1 ❌→✅ → ❌26→25·✅231→232. reconcile 19/19·330.

## AC (측정 가능)
G-1 selectAllPages 헤더→카운트=전체·page-only→카운트=페이지·OFF byte-identical(chromium 발산). node 신규 0(TanStack selection=브라우저 상태, 정직).

## constraints
- **MIT**(grid-core). 외부 dep 0. **LESS-006**: selection=브라우저 상태→chromium 발산. node 신규 0(fabricate 금지).
- **opt-in byte-identical**: selectAllPages=false(default)→기존 page-scope 헤더(getToggleAllPageRowsSelected, 무변).
- 기존 CheckboxColumn cell/single·indeterminate 패턴 무수정(헤더 multi 분기만).

## 의존
grid-core 내부(CheckboxColumn 2번째 인자 + buildTableOptions 전달 + types selectAllPages). story=Grid(pagination+multi). 외부 0.

## 분류 (MASTER §2)
selectAllPages 헤더 분기=**배선형**(chromium). 순수 0.

## reuse-gate 결과 / 추측 0
재사용=CheckboxColumn 헤더 패턴·TanStack getToggleAllRowsSelected. 신규=scope 분기. 추측 0: AG select-all-across-pages·TanStack 전-행 API=1차. gap verified-absent(grep page-scope only).

## specify rubric (Full — 게이트 C)
- [x] Goal(전 페이지 전체선택) **9/10** · [x] In/Out(page-scope 유지·single Out) **10/10** · [x] AC(카운트 발산·OFF byte-identical chromium) **10/10**
- [x] reuse-gate(verify-first genuine 부재·TanStack 재사용·MIT) **10/10** · [x] constraints(opt-in byte-identical·LESS-006 node 0) **10/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(배선형) **9/10** · **합계 77/80 통과.**

---

## G-1 결과 (완료 — 2026-06-07) → MOD-55 = {G-1} 완주, §3 이관
**구현**(grid-core, 기존 page-scope 경로 무수정): `GridRowSelectionOptions.selectAllPages?`(default false) + `createCheckboxColumn(mode, selectAllPages)` multi 헤더 전-행 분기(getToggleAllRowsSelectedHandler/getIsAllRowsSelected/getIsSomeRowsSelected) + buildTableOptions 전달.
**검증**: typecheck 0·build green·**chromium 2/2**(`grid-select-all-pages.spec.ts`) + **전체 회귀 99/99**(97+2; ★grid-a11y Space/Enter sort=pre-existing 키보드 타이밍 flake, 재실행 8/8 green=내 변경 무관). node 신규 0(selection=브라우저 상태, 정직).
- ★pagination 12행/5쪽: selectAllPages 헤더→선택 카운트=**12(전체)**+다음 페이지 행 pre-checked · default page-scope→**5(현재 페이지만)** · OFF byte-identical.

## ★ closure + 발견 (advisor)
- **Select-all across all pages = ✅**: 헤더 체크박스 전 페이지 선택. **Selection 13/2/2→14/2/1**. COMMERCIAL-GAP **❌26→25·✅231→232·🟡70**(reconcile 19/19·330·0 mismatch). Enterprise ❌18→17.
- **★verify-first(advisor Tier 2)**: grep 으로 genuine 부재 확인(기존 getToggleAllPageRowsSelected=현재 페이지만, stale ❌ 아님) — build 전 검증. TanStack 전-행 API 옵션 분기로 노출(신규 로직 최소).
- **★chromium 발산 지표=onSelectionChange 카운트**: onRowSelectionChange 가 전 선택 키→props.data 매핑(전 페이지)이라 카운트가 page(5) vs all(12) 발산. 다음 페이지 pre-checked 로 보강.
- node 신규 0(TanStack selection=브라우저, fabricate 금지=MOD-49 G-1·MOD-35 동형).

## 모듈 완주 요약
1-Goal: Enterprise backlog 3번째(advisor Tier 2 verify-first). selectAllPages 옵션→multi 헤더 전-행 toggle. opt-in byte-identical. node 0(selection=브라우저)·chromium 발산(카운트 12 vs 5+다음 페이지). 기존 page-scope/cell/single/indeterminate 무수정(99/99). 신규 lesson 없음.
