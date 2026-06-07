# MOD-GRID-52 — 본문 셀 컬럼 스팬 (column spanning / body cell colSpan)

dev-harness 35번째 (**Track 2 제품결정 3번째**, advisor 순서 = full-row✅ → custom editor slot✅ → **column spanning** → RTL). grid-pro-merging(**Pro**).
갭분석 **Column features ❌ = Column spanning (body cell colSpan)**(line 157/577: "Grid.tsx colSpan is header-group/empty-state/padding-tr only; cell merging is rowSpan (grid-pro-merging), no body colSpan"). 경쟁: AG Grid `colSpan:(params)=>number`(Community)·Wijmo FlexGrid allowMerging(horizontal).

## 제품결정 → advisor 위임 + bound-or-defer triage (2026-06-07)
- advisor triage: arbitrary body colSpan = col-virt/pinned/ARIA 얽힘. **"bounded 버전이 비공허 단언 있으면 build, 전부 지원만 정직 스코프면 defer"**.
- **★reuse-gate(MergingGrid.tsx)가 결정**: column spanning = rowSpan(`grid-pro-merging`)의 **수평 쌍둥이**. MergingGrid 는 **자체 `<table>` 렌더 소유**
  (grid-core 위임 아님), 셀-skip 머신리(span===0→null) 보유, **role=grid/aria-colindex 없음**(plain table → **native `colSpan` 이 올바른 시맨틱, aria-colspan 불필요**),
  col-virt/pinning **자체가 없음**. → 배치 = **grid-pro-merging**: ① grid-core hot-path(renderWindowedCells, MOD-27/LESS-006) 수술 회피 ② 머신리 재사용
  ③ ARIA 얽힘 소멸 ④ 머징을 한 패키지에 유지(제품 일관성).
- **✅ build 결정(advisor tie-break)**: ★colSpan 은 **within-row** → row-virtualization 은 행 단위 추가/제거이므로 렌더된 행의 colSpan 셀은 항상 coherent =
  **rowSpan 의 L-01 orphan 문제가 colSpan 엔 구조적으로 없음**. MergingGrid 양 경로(non-virt + row-virt)에서 완전. rowSpan 이 이 방식으로 출하(✅ 취급)되고
  colSpan 은 그 caveat 마저 없음 → **✅ 가 정직**(streak 아닌 consistency; rowSpan 보다 덜 완전한 것을 ✅ 로 두면서 colSpan 을 🟡 로 두면 doc 신뢰도 하락).
- **tier=Pro**(rowSpan 과 일관; 갭의 "Community"=AG tiering 이지 topgrid 제품선 아님). **callback form**(`colSpan(params)=>number`, AG-faithful — value-based mergeRows 와 다른 기능).

## reuse-gate (LESS-003) + scope (verify-first grep)
- **survey**: grep colSpan in grid-pro-merging = spacer `<td colSpan={columns.length}>`(virt 상/하단 spacer)만 — **body colSpan 부재**(genuine, gap line 157 근거).
  rowSpan=`computeMergeSpans`(value-based, ancestorBoundary) + MergingGrid 양 경로 렌더. colSpan=그 **수평 순수 쌍둥이**.
- **★license**: grid-pro-merging=Pro(index `checkLicense()` + Watermark, PAT-003). colSpan=동일 패키지 → 게이트 상속(신규 게이트 0).
- 재사용: MergingGrid 자체 `<table>` 렌더·셀-skip 머신리(span===0→null) 패턴·양 렌더 분기(non-virt/row-virt) 구조. 신규 lifecycle/렌더경로 무발명.

## Goals
- **G-1 순수 colSpan 스파인 — 종결형**:
  - 순수 `computeColSpans<TData>(rows, columns: {id, colSpan?}[])→ColSpanMap`(`${rowIdx}_${colId}`→number; >1=스팬 시작·0=skip·1/undefined=일반).
    행마다 컬럼 좌→우: covered>0 이면 0(skip)+covered-- (★**skip-of-skip**: 피복된 컬럼 자신의 colSpan 무시) / 아니면 colSpan()→n, **clamp [1, 남은컬럼수]**,
    n>1 시 시작 set + covered=n-1. invalid/<1/비유한→1. **node 검증**.
  - **검증 node**: 기본 1(스팬 없음)·n>1 스타트+covered skip·**clamp(행끝 초과→남은 수로 절단)**·skip-of-skip(피복 컬럼 colSpan 무시)·다중 스팬 한 행·빈 rows·invalid(0/음수/NaN→1)·타입무관.
- **G-2 MergingGrid colSpan 배선 (chromium 발산) — 배선형**:
  - `enableColSpan?` opt-in prop(기본 false=byte-identical). `meta.colSpan?:(params:{row,rowIndex})=>number`. 양 렌더 분기(non-virt + row-virt)에
    colSpanMap lookup: 0→null(피복 셀 제거)·>1→`<td colSpan={n}>`. **native colSpan**(aria-colspan 없음=plain table 시맨틱). mergeRows(rowSpan)와 **미조합**(colSpan-only 스코프).
  - **검증 ★발산(advisor, "td 보임"=vacuous 금지, table-layout:auto 라 width=합 단언 금지=flake)**: ① 스팬 행은 `columnCount-(N-1)` 개 `<td>`(**피복 셀 DOM 부재**)
    ② 스팬 `<td>` 의 **colSpan 속성=N** ③ **right-edge 정렬**(스팬 셀 우변 = 비-스팬 참조 행의 N번째 컬럼 우변, layout-robust) ④ **row-virt 경로 coherence**(가상화 ON,
    스팬 행이 윈도에 렌더될 때 colSpan 무손상·피복 부재 — within-row=orphan 없음 실증) ⑤ OFF(enableColSpan=false) byte-identical(피복 0·colSpan 속성 0).

## In / Out
- **In**: 순수 `computeColSpans` + `ColSpanFn`/`ColSpanMap` 타입 + `enableColSpan?` prop + `meta.colSpan?` + MergingGrid 양 분기 배선 + 실제-render 스토리(colSpan-only). mergeRows 경로 무수정.
- **Out**: rowSpan+colSpan **동일 셀 조합**(genuinely 복잡=문서화 후 vN) · grid-core 메인 `<Grid>`(col-virt/pinned) 배선(다른 렌더경로=vN, 정직 경계) · header colSpan(이미 multi-row header=별개) · RTL.

## ★ ❌ 닫힘 마커
- **Column spanning (body cell colSpan) = ✅**: callback form colSpan, grid-pro-merging Pro, non-virt + row-virt 양 경로(within-row=orphan caveat 없음, rowSpan L-01 보다 완전).
  gap "no body colSpan" 해소. **정직 경계 명시**(over-claim 방지): grid-core 메인 `<Grid>`(column-virtualized/pinned)에는 미배선(rowSpan 과 동일 상황).
- COMMERCIAL-GAP: **Column features** 1 ❌→✅ → ❌29→28·✅228→229. reconcile 19/19·330.

## AC (측정 가능)
G-1 computeColSpans clamp/skip-of-skip/invalid(node). G-2 피복 셀 DOM 부재·colSpan 속성=N·right-edge 정렬·row-virt coherence·OFF byte-identical(chromium 발산).

## constraints
- **Pro**(grid-pro-merging, license 게이트 상속). 외부 신규 dep 0.
- **LESS-006**: 렌더/colSpan 배치=브라우저 행동 → chromium 발산(정적 presence 금지). 순수 computeColSpans 만 node.
- **opt-in byte-identical**: enableColSpan=false 시 colSpanMap=빈 Map → colSpan 속성 0·피복 0(기존 mergeRows/일반 동작 무변).
- **native colSpan only(aria-colspan 금지)**: MergingGrid=plain `<table>`(role=grid 아님) → native colSpan 이 a11y 시맨틱. axe 는 cheap regression check(load-bearing 아님).
- **width=합 단언 금지**(advisor): MergingGrid=table-layout:auto → 브라우저 재분배로 합 불일치=flake. 대신 피복-부재 + colSpan 속성 + right-edge 정렬.
- **colSpan-only 스코프**: 검증/스토리에서 mergeRows 미조합(동일 셀 row+col 스팬=복잡, 문서화 후 vN). 깨끗한 colSpan-only 단언이 ✅ 방어가능성의 근거.
- 기존 MergingGrid mergeRows/렌더 경로 무수정(분기 내 additive lookup).

## 의존
grid-pro-merging 내부(신규 `computeColSpans.ts` + types 확장 + MergingGrid 배선). story=실제 render(MergingGrid). 신규 외부 dep 0.

## 분류 (MASTER §2)
computeColSpans=**종결형**(순수). enableColSpan+MergingGrid 배선=**배선형**(chromium 발산).

## reuse-gate 결과 / 추측 0
재사용=MergingGrid 자체 렌더·셀-skip(span0→null) 머신리·양 분기 구조(computeMergeSpans 수평 쌍둥이). 신규=순수 colSpan compute(clamp+skip-of-skip)+enableColSpan 배선.
추측 0: AG `colSpan:(params)=>number`(per-cell callback, 우측 N-1 셀 자동 skip, col-virt/pin 하에서도)·Wijmo allowMerging(horizontal) = 1차 출처. gap line 157/577 verified-absent(grep 0).

## specify rubric (Full — 점수, 게이트 C)
- [x] Goal(body colSpan callback, AG colSpan 대응; G-1 순수+G-2 발산) **9/10** · [x] In/Out(In computeColSpans+배선·row+col 조합/grid-core 배선 Out 명시) **10/10**
- [x] AC 측정(clamp/skip-of-skip node·피복부재/colSpan속성/right-edge/row-virt/OFF chromium) **10/10** · [x] reuse-gate(MergingGrid 머신리 재사용·license 상속·callback≠value-based 명시) **10/10**
- [x] constraints(Pro·LESS-006·opt-in byte-identical·native colSpan·width-flake 회피·colSpan-only) **10/10** · [x] 의존(내부 신규, 외부 0) **10/10**
- [x] 추측 0(AG colSpan 1차·gap verified grep 0) **9/10** · [x] 분류(§2 종결형+배선형) **9/10**
- **합계 77/80 — 게이트 통과.**

---

## G-1·G-2 결과 (완료 — 2026-06-07) → MOD-52 = {G-1,G-2} 완주, §3 이관
**구현**(grid-pro-merging, 기존 mergeRows/렌더 경로 무수정):
- G-1 순수 `computeColSpans(rows, columns:{id,colSpan?}[])→ColSpanMap`(행마다 좌→우: covered>0→0+covered--·아니면 colSpan()→clamp[1,남은]·n>1 시작+covered=n-1·invalid<1/비유한→1·floor).
- G-2 `enableColSpan?` prop + `meta.colSpan?:(params:{row,rowIndex})=>number` + 양 렌더 분기 colSpanMap lookup(0→null·>1→`<td colSpan>`). native colSpan(aria-colspan 없음). tsconfig test/stories 제외(grid-core 동형).

**검증**: **node 26/0**(`computeColSpans.test.ts`: 기본·시작+피복·clamp·skip-of-skip·다중·invalid·floor·빈 rows) · typecheck 0(exactOptional: colSpan 키 조건부) · build green ·
**chromium 3/3**(`merging-colspan.spec.ts`) + **전체 회귀 92/92**(89+3).
- ★피복 셀 DOM 부재(5컬럼 span3→3 td)·colSpan 속성=N·right-edge 정렬(span 우변=참조행 D컬럼 우변, width=합 회피)·row-virt coherence(row40 스크롤-인→colSpan 무손상)·OFF byte-identical.

## ★ closure + 발견 (advisor)
- **Column spanning (body cell colSpan) = ✅**(grid-pro-merging Pro): callback form colSpan, non-virt + row-virt 양 경로. gap "no body colSpan" 해소. **Column features 8/5/1→9/5/0(0 ❌)**.
  COMMERCIAL-GAP **❌29→28·✅228→229·🟡70**(reconcile 19/19·합 330·0 mismatch). 잔여 ❌ tier Community 9→8(RTL 만 잔여, 제품결정 4종 중 3 build).
- **★reuse-gate(MergingGrid.tsx)가 배치 결정**(advisor): column spanning=rowSpan 수평 쌍둥이. MergingGrid 자체 `<table>` 렌더·셀-skip 머신리·plain table(role=grid/aria-colindex 없음)·col-virt/pinning 없음
  → grid-pro-merging 배치: grid-core hot-path(renderWindowedCells) 수술 회피 + **ARIA 얽힘 소멸**(native colSpan=plain table 시맨틱, aria-colspan 금지) + 머징 한 패키지 일관성.
- **★✅ 정직성(consistency, streak 아님)**: colSpan=within-row → row-virt(행 단위 추가/제거)서 렌더된 행의 colSpan 항상 coherent = **rowSpan L-01 orphan 이 colSpan 엔 구조적으로 없음**(rowSpan 보다 완전).
  rowSpan 이 이 방식 출하(present)되고 colSpan 은 caveat 마저 없음 → ✅ 정직. **정직 경계 명시**: grid-core 메인 `<Grid>`(col-virt/pinned) 미배선(rowSpan 과 동일 상황, over-claim 방지).
- **★callback form(≠value-based)**: gap=AG per-cell `colSpan(params)=>number` 콜백. mergeRows(값 비교)와 다른 기능 — 정확히 그 콜백형 build(advisor 명시, value-merge 오인 회피).
- **★검증 설계(advisor)**: width=합 단언 금지(table-layout:auto flake) → right-edge 정렬(layout-robust). "td 보임" vacuous 금지 → 피복 DOM 부재 + colSpan 속성 + row-virt 스크롤 coherence.

## 모듈 완주 요약
2-Goal: Track 2 제품결정 3번째(bound-or-defer→build). 순수 computeColSpans(clamp+skip-of-skip) node + MergingGrid 양 분기 배선 chromium 발산. rowSpan 수평 쌍둥이=머신리 재사용·grid-core 무수정.
within-row=L-01 orphan 없음(rowSpan 보다 완전). 기존 mergeRows/렌더 무수정(회귀 92/92). 신규 lesson 없음(LESS-003 reuse-gate·LESS-006 적용).
