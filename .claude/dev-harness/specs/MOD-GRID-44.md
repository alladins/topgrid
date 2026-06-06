# MOD-GRID-44 — pivot 결과 변환 (total customization + result filter)

dev-harness 27번째 (vN-5). 갭분석 Pivoting ❌ 5 중 **node-pure 2건** = **total aggregation customization**(suppress/position totals) ·
**filter on pivot result**. 경쟁: AG `pivotRowTotals`/`suppressExpandablePivotGroups`·pivot result 필터. ★pivot 5 분할(advisor).

## reuse-gate (LESS-003) + 분할 (advisor spec-gate)
- **이미 있음**(MOD-18/31): `computePivot`(model.rows = data + subtotal + grandTotal, 2-axis) · MOD-31 순수 변환 3종
  (`sortPivotRows`/`collapsePivotRows`/`transposePivotConfig` — 전부 model.rows/config 순수 변환, **computePivot/grid-core 무수정**).
  `PivotRow.__kind`('data'|'subtotal'|'grandTotal')·`__depth`·`__id`. 테스트=strip-types 순수, ★2-row-dim fixture 필수(subtotal 존재).
- **부재**(신규): total customization·result filter = 순수 model.rows 변환(MOD-31 동형, 신규 파일 2).
- **분할(advisor)**: pivot 5 를 한 모듈에 안 넣음. **node-pure 2(본 모듈)** / **collapsible column groups**(=3-part: computePivot 컬럼-그룹
  집계 셀 + buildPivotColumns 어포던스 + chromium → browser 클러스터) / **pivot panel**(DnD)·**server-side pivot**(grid-pro-serverside
  wiring)=browser. browser 3 = 별도 모듈.

## ★ 핵심 결정 (advisor)
1. **total customization = row-total 연산만**(suppress subtotals·suppress grandTotal-row·position grandTotal top/bottom) = 순수 model.rows.
   **★column grand-total(`GRAND_TOTAL_COLUMN_KEY` 컬럼) 토글 = buildPivotColumns/render 관심사**(rows 변환으론 silent no-op) → **연기+명시**.
2. **result filter 의 subtotal coherence 함정(advisor CATCH)**: data 행을 predicate 로 제거하면 subtotal 은 **원 그룹 전체 집계**라 표시
   자식과 불일치(SUM 시 시각적 오류). **선택한 의미 = (a) subtotal/grandTotal 을 true-group 집계로 유지·data 행만 필터·문서화**(totals-
   over-all, LESS-004). **★가시 셀 재집계 금지**(avg-of-avgs — SUM 만 맞고 AVG/COUNT 틀림). spine 테스트 = "data 행 필터→그 subtotal 값
   **불변**"(제거만 단언 아님).

## Goals
- **G-1 total customization — 종결형(순수)**:
  - `customizePivotTotals(rows, opts)`: opts={subtotals?:boolean(기본 true), grandTotal?:boolean(기본 true), grandTotalPosition?:'top'|'bottom'
    (기본 'bottom')}. subtotals=false→subtotal 행 제거·grandTotal=false→grandTotal 행 제거·position='top'→grandTotal 을 맨 위로 이동.
    data 행 불변·순서 보존(grandTotal 이동 외).
  - **검증**: node(strip-types, 2-row-dim fixture) — suppress subtotals(subtotal 제거·data/grandTotal 잔존)·suppress grandTotal·position top
    (grandTotal 선두)·기본 무변(echo).
- **G-2 result filter — 종결형(순수)**:
  - `filterPivotRows(rows, predicate)`: predicate=(row)=>boolean (data 행에만). data 행 필터, **subtotal/grandTotal 불변**(true-group).
  - **검증**: node — predicate 통과 data 만 잔존·★subtotal 값 **불변**(필터된 자식 무관, totals-over-all 의미)·non-data 행 전부 보존·항상-false→data 0+합성행 잔존.

## In / Out
- **In**: `customizePivotTotals` + `filterPivotRows` 순수 변환(소비자가 model.rows 에 적용, MOD-31 동형). node 검증.
- **Out**: collapsible column groups(computePivot 컬럼집계+render+chromium=browser 클러스터) · pivot panel(DnD) · server-side pivot
  (grid-pro-serverside wiring) · total customization 의 **column grand-total 토글**(buildPivotColumns, 후속).

## ★ ❌ 닫힘 마커 (advisor)
- **total customization = ✅**: 순수 config 동작(suppress/position, UI 미명시 — named-ranges 동격). column grand-total 토글만 후속.
- **result filter = 🟡**: 순수 프리미티브 `filterPivotRows` ship + node, **AG 의 pivot-result column-filter UI 부재** → 번들 partial
  (copy/fill·멀티시트 동형). filter UI = browser 클러스터.
- COMMERCIAL-GAP: Pivoting **❌5→3·✅+1(total cust)·🟡+1(result filter)** → ❌41→39·✅222→223·🟡64→65(reconcile, Pivoting 23|18|2|3).

## AC (측정 가능)
G-1: suppress subtotals/grandTotal·position top·기본 echo. G-2: predicate 필터·★subtotal 불변·합성행 보존·all-false. 전부 node.

## constraints
- **Pro**(grid-pro-pivot, PAT-003). 외부 dep 0. C-003. **LESS-006**: 순수 → node ceiling. computePivot/grid-core **무수정**(MOD-18/31
  보존, MOD-31 변환과 합성 가능). result filter totals-over-all = 문서화 한계(LESS-004).

## 의존
grid-pro-pivot 내부(신규 파일 2). 신규 외부 dep 0.

## 분류 (MASTER §2)
customizePivotTotals·filterPivotRows = **종결형**(순수 model.rows 변환). UI wiring 없음(소비자 적용).

## reuse-gate 결과 / 추측 0
재사용=PivotRow/__kind/__depth(MOD-18)·순수 변환 패턴(MOD-31). 신규=2 변환. 추측 0: AG suppress/position totals·pivot result 필터
= 1차. result filter totals-over-all·column grand-total 연기 = 명시.

## specify rubric (Full — 점수, 게이트 C)
- [x] Goal(pivot 결과 변환, AG 대응) **9/10** · [x] In/Out(순수 2 In·collapsible/panel/server·column-total Out) **10/10**
- [x] AC 측정(suppress/position·★subtotal 불변, node) **10/10** · [x] reuse-gate(MOD-31 동형·분할 근거) **10/10**
- [x] constraints(PAT-003·LESS-006·computePivot 무수정·LESS-004) **9/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(AG 1차·의미 명시) **9/10** · [x] 분류(§2 종결형) **10/10**
- **합계 77/80 — 게이트 통과.**

---

## G-1·G-2 결과 (완료 — 2026-06-07) → MOD-44 = {G-1,G-2} 완주, §3 이관
**구현**(신규 파일 2, computePivot/grid-core 무수정):
- G-1 `customizePivotTotals(rows, {subtotals?, grandTotal?, grandTotalPosition?})`: 순수 row-total 변환 — subtotal/grandTotal 행
  억제(filter) + grandTotal top 이동. data 행·순서 보존. column grand-total 토글=buildPivotColumns 후속(scope out).
- G-2 `filterPivotRows(rows, predicate)`: data 행만 predicate, subtotal/grandTotal **불변**(true-group, totals-over-all).
- index.ts export(customizePivotTotals·PivotTotalsOpts·filterPivotRows). package.json test 에 2 추가.

**검증**: node **strip-types**(grid-pro-pivot suite 50): sortPivotRows 11·collapsePivotRows 19·transposePivotConfig 5 +
**customizePivotTotals 8/0**·**filterPivotRows 7/0**. typecheck 0·tsup build green.
- G-1: suppress subtotals(data+grandTotal 잔존)·suppress grandTotal·position top(grandTotal 선두)·combined·기본 echo·immutability.
- G-2: predicate 필터·★**subtotal 값 불변**(필터된 자식 d1=10 제거돼도 s1=30 유지=totals-over-all, avg-of-avgs 회피)·합성행 보존·all-false.

## ★ closure (advisor)
- **total customization=✅**: 순수 config 동작(suppress/position, UI 미명시). column grand-total 토글만 후속.
- **result filter=🟡**: 순수 프리미티브 `filterPivotRows` ship+node, AG pivot-result column-filter UI 부재(copy/fill·멀티시트 동형). UI=browser.
- COMMERCIAL-GAP: Pivoting **❌5→3·✅+1·🟡+1** → ❌41→39·✅222→223·🟡64→65(reconcile 19/19·330·Pivoting 18/2/3·Enterprise 27→25).

## 한계 (LESS-004)
- result filter = **totals-over-all**: subtotal/grandTotal 은 원 그룹 전체 집계 유지(필터된 자식 무관) → 표시 자식과 불일치 가능
  (문서화·테스트됨). 진짜 부분합=소비자가 source 필터 후 computePivot 재실행. **가시 셀 재집계 금지**(avg-of-avgs).

## 모듈 완주 요약
2-Goal: pivot 5 중 node-pure 2(MOD-31 동형 순수 model.rows 변환, computePivot 무수정). total cust=✅·result filter=🟡. node 15(8+7,
suite 50). 신규 lesson 없음(MOD-31 패턴·avg-of-avgs 기존 규율 적용). 분할 잔여 3=collapsible cols·pivot panel·server-side(browser).
