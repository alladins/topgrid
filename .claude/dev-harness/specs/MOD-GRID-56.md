# MOD-GRID-56 — 그룹/계층 선택 (group / hierarchy selection)

dev-harness 39번째 (**Enterprise ❌ backlog — Tier 1**, advisor). grid-pro-agg(**Pro**).
갭분석 **Selection ❌ = Group / hierarchy selection (group selects children, leaf rolls up to group)**. 경쟁: AG groupSelectsChildren·xxxx.

## verify-first + reuse-gate
- grep 확인: AggregationGrid=**selection 인프라 0**(rowSelection/checkbox 없음). genuine 부재.
- ★rollup=TanStack 제공: `enableRowSelection`+`enableSubRowSelection`(default true) → 그룹 행 `getToggleSelectedHandler`=하위 전체 토글·`getIsAllSubRowsSelected`/`getIsSomeSelected`=checked/indeterminate. 증분=AggregationGrid 에 selection state + checkbox 컬럼(leaf) + GroupRow 그룹 체크박스 배선.
- 재사용: CheckboxColumn indeterminate 패턴(MOD-35)·GroupRow 양 분기(colSpan/inline-agg, MOD-54). **license**: grid-pro-agg Pro 게이트 상속.

## Goals
- **G-1 그룹/계층 선택 (chromium 발산) — 배선형**:
  - `enableRowSelection?` prop + `onSelectionChange?`. table options: enableRowSelection·rowSelection state·onRowSelectionChange. resolvedColumns 좌측에 `__select__` 컬럼(leaf cell=getToggleSelectedHandler/getIsSelected).
    GroupRow 양 분기에 그룹 체크박스(checked=getIsAllSubRowsSelected, indeterminate=getIsSomeSelected, onChange=getToggleSelectedHandler) — colSpan 경로=checkbox td + label colSpan-1, inline-agg 경로=__select__ 컬럼 위치.
  - **검증 ★발산(advisor)**: ① 그룹 체크박스 클릭→**하위 leaf 전부 선택**(카운트=그룹 크기) ② leaf 1개만 선택→**그룹 indeterminate**(mixed) ③ 하위 전부 선택→그룹 checked ④ OFF(enableRowSelection 미지정) byte-identical(checkbox 0).

## In / Out
- **In**: `enableRowSelection?`+`onSelectionChange?` + __select__ 컬럼(leaf) + GroupRow 그룹 체크박스(양 분기) + selection state. 기존 GroupRow/렌더 무수정(분기 내 additive).
- **Out**: single 선택 모드(group=multi 의미만) · 헤더 전체선택(후속) · 선택 영속(MOD-55 계열).

## ★ ❌ 닫힘 마커
- **Group / hierarchy selection = ✅**: 그룹 체크박스=하위 토글·leaf rollup=indeterminate/checked. COMMERCIAL-GAP **Selection** 1 ❌→✅ → ❌25→24·✅232→233. reconcile 19/19·330.

## AC
G-1 그룹→하위 전체·leaf→그룹 indeterminate·전체→checked·OFF byte-identical(chromium). node 0(TanStack rollup=브라우저 상태, 정직).

## constraints
- **Pro**(grid-pro-agg). 외부 dep 0. **LESS-006**: selection rollup=브라우저 상태→chromium 발산. node 0(fabricate 금지).
- **opt-in byte-identical**: enableRowSelection=false→checkbox 컬럼/그룹 체크박스 0(기존 무변).
- 기존 GroupRow colSpan/inline-agg 경로·FooterRow 무수정(체크박스 additive).

## 의존
grid-pro-agg 내부(AggregationGrid selection + __select__ 컬럼 + GroupRow 체크박스 + types). story=AggregationGrid(grouping+selection). 외부 0.

## 분류 (MASTER §2)
selection 배선+그룹 rollup 렌더=**배선형**(chromium). 순수 0(TanStack rollup).

## reuse-gate 결과 / 추측 0
재사용=TanStack enableSubRowSelection rollup·CheckboxColumn indeterminate·GroupRow 양 분기. 신규=AggregationGrid selection 배선+그룹 체크박스. 추측 0: AG groupSelectsChildren·TanStack 하위선택=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(그룹/계층 선택) **9/10** · [x] In/Out(single/헤더전체 Out) **10/10** · [x] AC(하위 전체·indeterminate·OFF chromium) **10/10**
- [x] reuse-gate(TanStack rollup·indeterminate 재사용·Pro) **10/10** · [x] constraints(opt-in byte-identical·LESS-006 node 0) **10/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(배선형) **9/10** · **합계 77/80 통과.**

---

## G-1 결과 (완료 — 2026-06-07) → MOD-56 = {G-1} 완주, §3 이관
**구현**(grid-pro-agg, 기존 GroupRow/FooterRow 무수정): `enableRowSelection?`+`onSelectionChange?` + rowSelection state + table `enableRowSelection`/`onRowSelectionChange` + 선행 `__select__` 컬럼(leaf checkbox) + GroupRow tri-state 그룹 체크박스(양 분기) + useEffect 로 selected leaf originals 보고.
**검증**: typecheck 0·build green·**chromium 2/2**(`agg-group-selection.spec.ts`) + **전체 회귀 101/101**(99+2; ★grid-pagination-complete·grid-row-click-select=pre-existing 타이밍 flake, 재실행 green=무관). node 신규 0(rollup=TanStack 브라우저 상태, 정직).
- ★그룹 체크박스→하위 3 leaves 선택(count 3, checked) · leaf 1 uncheck→그룹 indeterminate(aria-checked=mixed, count 2) · OFF byte-identical.

## ★ closure + 발견 (advisor)
- **Group/hierarchy selection = ✅**: 그룹 토글=subtree·leaf rollup=tri-state. **Selection 14/2/1→15/2/0(0 ❌)**. COMMERCIAL-GAP **❌25→24·✅232→233·🟡70**(reconcile 19/19·330·0 mismatch). Enterprise ❌17→16.
- **★rollup=TanStack enableSubRowSelection**(default true): 그룹 행 getToggleSelectedHandler=subtree·getIsAllSubRowsSelected/getIsSomeSelected=tri-state. 증분=AggregationGrid selection 인프라(기존 0)+GroupRow 그룹 체크박스. node 0(브라우저 상태).
- **★GroupRow 양 분기 체크박스**: colSpan 경로=checkbox td + label colSpan-1, inline-agg 경로(MOD-54)=__select__ 컬럼 위치. opt-in byte-identical(enableRowSelection=false).
- pre-existing 타이밍 flake(grid-pagination-complete·grid-row-click-select·grid-a11y) 누적 관찰 — 재실행 green, 내 변경 무관. 누적 시 harden 고려(MOD-52 merging 처럼 expect.poll).

## 모듈 완주 요약
1-Goal: Enterprise backlog 4번째(advisor Tier 1). TanStack enableSubRowSelection rollup + AggregationGrid selection 인프라 + GroupRow tri-state 체크박스(양 분기). node 0(브라우저)·chromium 발산(하위 전체+rollup mixed). 기존 GroupRow/FooterRow 무수정(101/101). 신규 lesson 없음.
