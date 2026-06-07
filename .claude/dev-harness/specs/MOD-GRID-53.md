# MOD-GRID-53 — collapsible pivot column groups (펼침/접기 가능한 피벗 컬럼 그룹)

dev-harness 36번째 (**Enterprise ❌20 backlog 1번째**, advisor triage 선정). grid-pro-pivot(**Pro**).
갭분석 **Pivoting ❌ = Collapsible / expandable pivot column groups**(line: "VERIFIED missing — 컬럼 차원 nested 그룹은 렌더되나 collapse 어포던스 없음"). 경쟁: AG Grid pivot column group collapse·Wijmo.

## advisor triage (2026-06-07, 제품결정 4종 종결 후 Enterprise 진입)
- advisor: **collapsePivotRows(MOD-31 G-2)의 컬럼 쌍둥이**. ★단 reuse-gate(buildPivotColumns/computePivot) 조사로 **비대칭 발견**:
  row collapse 가 깨끗한 것은 computePivot 이 **모든 레벨 subtotal 행을 source 집계로 사전 방출**하기 때문 — collapse 는 자식 숨김 + 기존 subtotal 표시.
  그러나 컬럼은 **leaf-combo 셀 + grand-total 만** 있고 **중간 컬럼-그룹 집계 셀 부재**, PivotModel 은 source 미보유 → 모델만으론 collapsed 그룹 true AVG 복원 불가.
- **설계 결정(advisor, 분기 reconcile)**: **(a) computePivot 을 additive 수정** — computeCells 가 leaf-combo 뿐 아니라 **각 컬럼-combo prefix(그룹 키)별로도 source 집계 셀 방출**.
  = 진정한 대칭(행축 subtotal ↔ 열축 group-cell, 둘 다 computePivot 이 source 에서 사전 계산). (b) 별도 source-recompute spine 은 emit/grouping 중복+열위 → 기각.
- **★MOD-18 이후 computePivot 첫 additive 터치**(정직 기록). behavior-preserving-additive: 읽지 않는 그룹 키만 추가, columnTree/columnLeafKeys/rows 불변, 0/1 컬럼차원 inert(byte-identical).
- **tier=Pro**(grid-pro-pivot). 안전망=**characterization-first**(현 leaf/subtotal/grandTotal 값 핀 → unmodified 그린 → 추가 → 재그린 + 신규 단언). 현재 computePivot 커밋 테스트 0(MOD-18 "26"=audit 일회성).

## reuse-gate (LESS-003) + scope (verify-first grep)
- **survey**: column collapse grep(buildPivotColumns/PivotGrid)=0(row collapse 만: PivotCollapseOpts/CollapsibleSubtotalLabel/collapsePivotRows). genuine 부재. buildColumnTree=nested PivotColumnNode(node.key=`/`-join prefix). computeCells=leaf+grand-total. mapColumnNode=nested ColumnDef.columns(≥2 차원 시 그룹).
- **★key identity 확인**: group node.key="2024"(prefix) ↔ leaf comboKey="2024/Q1"(full join) → 그룹 셀 `cellKey("2024",i)`="2024__0" = collapsed 그룹 컬럼이 `${node.key}__${i}` 로 읽는 값. end-to-end 일치.
- **★license**: grid-pro-pivot=Pro(checkLicense+Watermark, PAT-003) → 게이트 상속(신규 0).
- 재사용: computeCells/applyReducer(avg=source unweighted mean)·mapColumnNode·CollapsibleSubtotalLabel 패턴(chevron)·PivotGrid sort/row-collapse state 배선. computePivot row-emit 무수정(컬럼 셀만 additive).

## Goals
- **G-1 computePivot 컬럼-그룹 집계 셀 (additive, source 재집계) — 종결형**:
  - computeCells 에 **컬럼-combo prefix 버킷**(len 1..columnFields.length-1) 추가 → 각 그룹 키에 `cellKey(prefix, valueIndex)` = `applyReducer(aggFn, source nums)`.
    leaf/grand-total/columnTree/rows 불변. 0/1 차원 inert. ★**avg-of-avgs 안전**: 그룹 AVG = source 행 직접 집계(자식 컬럼 AVG 평균 아님).
  - **검증 node ★characterization-first**: ① 현 leaf/subtotal/grandTotal 값 핀(unmodified 그린) ② 추가 후 재그린(불변=additive 증명) ③ **avg-of-avgs 단언**:
    자식 컬럼 **행 수 불균등** fixture(Q1 1행·Q2 3행)에서 그룹 셀 = true source AVG(자식 AVG 평균 ≠ true, **정확한 숫자** 단언) · clamp/prefix len(3차원=len1·len2 둘 다) · 0/1 차원 그룹 셀 0.
- **G-2 컬럼 그룹 collapse 렌더 (chromium 발산) — 배선형**:
  - `PivotColumnCollapseOpts {collapsedKeys, onToggle}` + buildPivotColumns 4번째 인자 → mapColumnNode: node.key ∈ collapsedKeys & children → **collapsed**(그룹 셀 `${node.key}__i` 읽는 단일/값별 컬럼, header=chevron ▶).
    expanded 그룹 header=chevron ▼(클릭→collapse). PivotGrid `enableColumnCollapse?` + collapsedColKeys state + transpose 시 리셋(stale key).
  - **검증 ★발산(advisor, "헤더 보임"=vacuous 금지)**: ① collapse 전 자식 leaf 컬럼 N개 DOM 존재 ② collapse 후 **자식 컬럼 DOM 부재**·그룹 컬럼이 **집계값 표시**(G-1 셀)
    ③ ≥2 컬럼차원 fixture(vacuity 앵커: 1차원은 그룹 없음=무의미) ④ OFF(enableColumnCollapse=false) byte-identical(chevron 0·자식 전부 렌더).

## In / Out
- **In**: computeCells 그룹-prefix 셀(additive) + computePivot characterization+group test + `PivotColumnCollapseOpts` + buildPivotColumns/mapColumnNode collapse 렌더 + PivotGrid `enableColumnCollapse?` + 스토리. computePivot row-emit/columnTree 무수정.
- **Out**: row+column collapse 동시(독립 state, 조합 데모 vN) · 컬럼 그룹 chevron 키보드 nav(후속) · server-side pivot collapse(별개 ❌) · pivot panel DnD(별개 ❌).

## ★ ❌ 닫힘 마커
- **Collapsible pivot column groups = ✅**(통과 시): 컬럼 그룹 collapse(자식 DOM 부재 + 그룹 컬럼 source-집계값) + expand. gap "no column group collapse 어포던스" 해소.
  ★avg-of-avgs 정직 = node 가 collapsed 그룹 셀 = true source AVG 증명(자식 AVG 평균 아님). 통과 못하면 🟡.
- COMMERCIAL-GAP: **Pivoting** 1 ❌→✅ → ❌28→27·✅229→230. reconcile 19/19·330.

## AC (측정 가능)
G-1 characterization 불변 + 그룹 셀 = true source AVG(불균등 행수, 정확 숫자)·prefix len·0/1 inert(node). G-2 자식 DOM 부재·그룹 집계값·≥2차원·OFF byte-identical(chromium 발산).

## constraints
- **Pro**(grid-pro-pivot, license 게이트 상속). 외부 신규 dep 0.
- **★computePivot additive only**(MOD-18 이후 첫 터치): 그룹 prefix 셀만 추가, leaf/grand-total/columnTree/columnLeafKeys/rows 불변. characterization-first 안전망(현 동작 핀).
- **LESS-006**: collapse 렌더/affordance=브라우저 행동 → chromium 발산(정적 presence 금지). 그룹 셀 correctness(avg-of-avgs)=node(advisor: correctness-critical 단언을 node 로).
- **avg-of-avgs 안전**: 그룹 셀=source 직접 집계(자식 컬럼 집계의 재집계 아님). 불균등 행수 fixture 로 node 정확 숫자 단언(MOD-31/44/45 규율).
- **opt-in byte-identical**: enableColumnCollapse=false → collapsedKeys 미전달 → buildPivotColumns 기존 경로(chevron 0). G-1 그룹 셀은 추가되나 미사용(렌더 무변)=byte-identical.
- **vacuity 앵커**: 모든 fixture/story ≥2 컬럼차원(1차원=그룹 없음=collapse 무의미).
- 기존 row collapse/sort/transpose/computePivot row-emit 무수정.

## 의존
grid-pro-pivot 내부(computePivot computeCells additive + 신규 computePivot.test + buildPivotColumns collapse + PivotGrid 배선 + types PivotColumnCollapseOpts). story=실제 render(PivotGrid). 신규 외부 dep 0.

## 분류 (MASTER §2)
computeCells 그룹 셀=**종결형**(순수 additive). buildPivotColumns/PivotGrid collapse 배선=**배선형**(chromium 발산).

## reuse-gate 결과 / 추측 0
재사용=computeCells/applyReducer·mapColumnNode·CollapsibleSubtotalLabel(chevron 패턴)·PivotGrid state 배선·collapsePivotRows(행 쌍둥이 구조). 신규=컬럼-그룹 prefix 셀(source) + 컬럼 collapse 렌더.
추측 0: AG pivot column group collapse(그룹 헤더 chevron→자식 숨김+그룹 집계, source 재집계)·Wijmo = 1차 출처. gap verified-absent(grep 0).

## specify rubric (Full — 점수, 게이트 C)
- [x] Goal(컬럼 그룹 collapse, AG 대응; G-1 source 집계+G-2 발산) **9/10** · [x] In/Out(In computeCells additive+collapse 배선·row+col 동시/server Out) **10/10**
- [x] AC 측정(characterization+avg-of-avgs node·자식 DOM 부재/그룹값/OFF chromium) **10/10** · [x] reuse-gate(computeCells/mapColumnNode 재사용·key identity·비대칭 발견·license 상속) **10/10**
- [x] constraints(Pro·computePivot additive+characterization-first·LESS-006·avg-of-avgs·opt-in byte-identical·≥2차원 vacuity) **10/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(AG column collapse 1차·gap verified) **9/10** · [x] 분류(§2 종결형+배선형) **9/10**
- **합계 77/80 — 게이트 통과.**

---

## G-1·G-2 결과 (완료 — 2026-06-07) → MOD-53 = {G-1,G-2} 완주, §3 이관
**구현**(grid-pro-pivot, computePivot row-emit/columnTree 무수정 — computeCells 컬럼 셀만 additive):
- G-1 computeCells 컬럼-combo **prefix 버킷**(len 1..columnFields.length-1) 추가 → `cellKey(prefix,i)` = `applyReducer(aggFn, source nums)`. avg-of-avgs 안전(source 직접).
- G-2 `PivotColumnCollapseOpts{collapsedKeys,onToggle}` + buildPivotColumns 4번째 인자 + mapColumnNode collapse(그룹 셀 읽는 단일/값별 컬럼 + CollapsibleColumnHeader chevron) + PivotGrid `enableColumnCollapse?`(collapsedColKeys state).
  - **★transpose 리셋 = wired·chromium 미검증(AP-004 정직)**: applyConfig 가 setCollapsedColKeys(new Set()) 호출하나 별도 게이트 없음. ★단 실패 모드 benign — 컬럼 키는 **의미상**(`"2024/Q1"`)이라 stale 키는 전치 후 어떤 node 와도 매칭 안 됨=**inert**(MOD-31 순차 `__id` 의 wrong-group-collapse 와 달리 무해). 검증 안 했으므로 "delivered guard" 아닌 "wired hook(저위험 inert)" 으로 기록.

**검증**: **node 15/0**(`computePivot.test.mjs`, esbuild 번들=cross-import 해소): ★characterization-first(unmodified 9/15→additive 후 15/15, characterization 불변=additive 증명) +
collapsed 그룹 AVG=**true source mean 17.5**(NOT avg-of-child-avgs 15, 불균등 행수)·3-dim len1·len2·1-dim inert · 기존 5 spine 테스트 무영향(sort11/collapse19/transpose5/customize8/filter7) ·
typecheck 0 · build green · **chromium 2/2**(`pivot-column-collapse.spec.ts`) + **전체 회귀 94/94**(92+2).
- ★collapse→자식 quarter 컬럼 DOM 부재 + 2024 컬럼이 17.50(source avg) 표시 · sibling 2023 그룹 무변 · re-expand 복원 · OFF(enableColumnCollapse 미지정) chevron 0·전체 자식 렌더.

## ★ closure + 발견 (advisor)
- **Collapsible pivot column groups = ✅**: 컬럼 그룹 collapse(자식 DOM 부재 + 그룹 source-집계값) + expand. gap "no column group collapse 어포던스" 해소. **Pivoting 18/2/3→19/2/2**.
  COMMERCIAL-GAP **❌28→27·✅229→230·🟡70**(reconcile 19/19·합 330·0 mismatch). 잔여 ❌ tier Enterprise 20→19.
- **★reuse-gate 비대칭 발견**(advisor reconcile): collapsePivotRows(행)의 컬럼 쌍둥이이나 row collapse 가 깨끗한 것은 computePivot 이 **모든 레벨 subtotal 행 사전 방출**(source)하기 때문 —
  컬럼축은 중간 그룹 셀 부재+모델 source 미보유 → 모델만으론 collapsed 그룹 true AVG 복원 불가. **(a) computePivot additive 수정**(prefix 셀 방출)=진정한 대칭. (b) 별도 source-recompute spine=중복→기각.
- **★MOD-18 이후 computePivot 첫 additive 터치**(정직): 커밋 computePivot 테스트 0(MOD-18 "26"=audit 일회성) → **characterization-first** 안전망(현 동작 핀→additive 후 불변 증명).
  behavior-preserving-additive: 읽지 않는 prefix 키만, columnTree/columnLeafKeys/rows 불변, 0/1 차원 inert(byte-identical), 5 기존 spine 무영향.
- **★avg-of-avgs 정직성이 node 로 이동**(advisor): correctness-critical 단언(그룹 AVG=true source mean)을 node 가, chromium 은 render 발산만(자식 DOM 부재+그룹값). MOD-52(text 단언)보다 깨끗.
- **esbuild 번들 검증**(MOD-32 패턴): computePivot=cross-import(reducers→@topgrid/grid-pro-agg bare)라 node strip-types 직접 불가 → esbuild devDep + `.test.mjs` 번들 import.
- **★transpose 리셋 정직 기록(advisor AP-004, 3번째)**: collapsedColKeys transpose 리셋=wired·chromium 미검증. 실패 모드 benign(시맨틱 키 stale=inert). delivered guard 아닌 wired hook(저위험)으로 기록 — MOD-50 validateRow·MOD-51 ctx.commit/cancel 동류(단 MOD-51 은 검증으로 닫음, 본 건은 inert 라 annotate).
- **★perf 인지(릴리스, 액션 없음)**: computeCells 가 ≥2 컬럼차원 pivot 전부에 그룹-prefix 셀을 방출(enableColumnCollapse 무관 — computePivot 은 render prop 미인지). correctness 무영향(behavior-preserving-additive), 표준(AG 도 사전계산)이나 대형 pivot 소비자용 게이트가 필요하면 차후 perf 패스에서.

## 모듈 완주 요약
2-Goal: Enterprise ❌20 backlog 1번째(제품결정 4종 종결 후). computePivot 컬럼-그룹 prefix 셀 additive(source 재집계, 행축 subtotal 의 열축 대칭) + buildPivotColumns/PivotGrid collapse 배선.
characterization-first(MOD-18 이후 computePivot 첫 터치) + avg-of-avgs=node + render 발산=chromium. 기존 row-emit/5 spine 무수정(회귀 94/94). 신규 lesson 없음(LESS-003·LESS-006).
