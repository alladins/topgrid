# MOD-GRID-45 — 전역 집계 행 계산 (computeAggregateRow)

dev-harness 28번째 (vN-6). 갭분석 Enterprise grouping 클러스터 중 **node-pure 추출 substance 1** = 전역 집계 계산.
닫음: **grand-total footer**(🟡) + **auto-aggregation floating rows**(🟡). 경쟁: AG `groupIncludeTotalFooter`·floating row 자동집계.

## reuse-gate (LESS-003) + 분할 (advisor spec-gate)
- **이미 있음**: grid-pro-agg `aggregationFns`(TanStack `AggregationFn` = **Row-based**, getValue 경유) · FooterRow(그룹 닫힘 시만) ·
  grid-core `floatingBottomRows`(소비자 공급, 자동집계 없음). pivot `BUILT_IN_REDUCERS`(`number[]→number`, 별 패키지).
- **부재**: 전역(whole-grid) 집계 행 계산 = grand-total footer·auto-agg floating 둘 다 필요. Row-based agg 는 TanStack 행 모델 필요
  (node-순수 아님). pivot reducer 는 별 패키지(ADR-001 강제재사용 금지).
- **★분할(advisor)**: Enterprise grouping 은 **렌더-정의** 클러스터(footer/sticky/inline = 렌더). node-pure 추출 substance =
  **공유 집계 프리미티브 1**(본 모듈). 렌더(footer 행·sticky·group-header inline)·state-save = browser/후속.
- 신규: 로컬 `number[]` 리듀서 + `computeAggregateRow`(source 행 직접 집계 = avg-of-avgs 안전). pivot 리듀서 미import(ADR-001).

## ★ 핵심 결정 (advisor)
1. **source 행 직접 집계**(그룹-부분합 결합 아님): grand-total 의 리듀서는 그 컬럼의 **그룹-부분합 방식과 일치**하되 source 에서 계산.
   **avg·count 만 결합-불안전**(sum/min/max 는 결합 생존; avg-of-avgs·count-of-counts 깨짐) → ★avg 를 source 전체로 계산하는
   hard 단언 테스트(그룹 평균의 평균 ≠ 전체 평균).
2. **로컬 `number[]` 리듀서**(ADR-001): pivot/agg-Row 강제재사용 금지. 빈 집합 의미 결정+테스트(avg/min/max of []→**null**, sum→0, count→0).
3. **closure(advisor 판별자)**: grand-total footer·auto-agg floating = **렌더/auto 명명** → **🟡**(compute 프리미티브 ship+node·렌더/auto-wiring
   browser). applyTransaction 선례 비적용(그건 data 연산, 렌더 차원 0). state-save = grid-core useGridState 결합 회피 → 연기.

## Goals
- **G-1 computeAggregateRow — 종결형(순수)**:
  - `computeAggregateRow(data, spec)`: spec=`Record<columnId, AggregationFnKey>`. 각 컬럼 source 값(number 강제, 빈/비수치 무시) →
    로컬 리듀서. count=행 수(data.length, TanStack count 일치). 빈→avg/min/max null·sum 0·count 0. 새 객체 반환(입력 무변).
  - **검증**: node(strip-types, grid-pro-agg 첫 node 테스트) — sum/avg/min/max/count · ★**avg-of-avgs 회피**(그룹 [1,2,3]/[10] →
    avg-of-avgs=6 ≠ 전체 avg=4, computeAggregateRow→4) · 빈 집합 의미 · 비수치/빈 값 무시 · 다컬럼 spec.

## In / Out
- **In**: 순수 `computeAggregateRow`(전역/임의 부분집합 집계, 소비자가 footer/floating 행으로 사용). node 검증.
- **Out(browser/후속)**: grand-total footer **렌더**(AggregationGrid pinned footer)·auto-agg floating **wiring**(grid 자동 계산+floatingBottomRows)
  ·group-header inline agg(렌더)·sticky group headers/rows(CSS)·row-group/pivot state-save(useGridState 결합 회피). = browser 클러스터.

## ★ ❌ 닫힘 마커 (advisor — 🟡)
- **grand-total footer = 🟡**: `computeAggregateRow` 프리미티브 ship+node, **렌더된 footer 행 부재**(AggregationGrid 미배선) → browser.
- **auto-agg floating rows = 🟡**: compute 프리미티브 ship, **grid 자동 계산+floating 배선 부재**("auto"가 핵심) → browser.
- COMMERCIAL-GAP: **2 ❌→🟡** → ❌39→37·✅223·🟡65→67(Row grouping&agg 19|11|6|2·Pinned/floating 15|11|3|1·Enterprise 25→23).

## AC (측정 가능)
G-1: sum/avg/min/max/count·★avg-of-avgs 회피(전체 4≠6)·빈 집합(null/0)·비수치 무시·다컬럼. 전부 node.

## constraints
- **Pro**(grid-pro-agg, PAT-003). 외부 dep 0. C-003. **LESS-006**: 순수 → node ceiling(렌더/sticky=browser=Out). ADR-001(로컬 number[]
  리듀서, pivot/agg-Row 강제재사용 금지). avg-of-avgs 안전(source 집계).

## 의존
grid-pro-agg 내부(신규 파일). 신규 외부 dep 0.

## 분류 (MASTER §2)
computeAggregateRow = **종결형**(순수 집계). 렌더 wiring 없음(소비자 적용).

## reuse-gate 결과 / 추측 0
재사용=AggregationFnKey(타입)·pivot number[] 리듀서 패턴(미import, ADR-001). 신규=로컬 리듀서+computeAggregateRow. 추측 0:
AG grand-total footer·auto-agg floating = 1차. avg-of-avgs·빈집합 의미 = 명시·테스트.

## specify rubric (Full — 점수, 게이트 C)
- [x] Goal(전역 집계, AG 대응) **9/10** · [x] In/Out(순수 compute In·렌더/sticky/state Out) **10/10**
- [x] AC 측정(★avg-of-avgs·빈집합, node) **10/10** · [x] reuse-gate(ADR-001·렌더-정의 분할 근거) **10/10**
- [x] constraints(PAT-003·LESS-006·ADR-001·avg-of-avgs) **9/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(AG 1차·의미 명시) **9/10** · [x] 분류(§2 종결형) **10/10**
- **합계 77/80 — 게이트 통과.**

---

## G-1 결과 (완료 — 2026-06-07) → MOD-45 = {G-1} 완주, §3 이관
**구현**(신규 파일 `grid-pro-agg/src/computeAggregateRow.ts`):
- `computeAggregateRow(data, spec)` + 로컬 `reduceAgg`/`collectColumnNumbers`. source 행 직접 집계(컬럼 값 number 강제, 빈/비수치
  무시). count=행 수(data.length, TanStack count 동형). 빈: avg/min/max→null·sum 0·count 0. ADR-001(pivot/agg-Row 리듀서 미import).
- index.ts export(computeAggregateRow·AggregateSpec). package.json test(echo TODO→node strip-types). tsconfig allowImportingTsExtensions
  추가(grid-pro-pivot 동형, 첫 node 테스트라 필요).

**검증**: node **computeAggregateRow.test.ts 15/0**(첫 grid-pro-agg node 테스트): sum/avg/min/max/count·★**avg-of-avgs 회피**
(그룹 [1,2,3]/[10] → avg-of-avgs=6 ≠ 전체 avg=4, computeAggregateRow→**4**)·빈 집합(avg/min/max null·sum/count 0)·비수치 무시
(sum 5+7=12·count 5행·avg 12/2=6)·다컬럼·immutability. typecheck 0·tsup build green.

## ★ closure (advisor — 렌더-정의 클러스터)
- **grand-total footer = 🟡**: `computeAggregateRow` compute 프리미티브 ship+node, 렌더된 footer 행 부재(AggregationGrid 미배선)→browser.
- **auto-agg floating rows = 🟡**: compute 프리미티브 ship, grid 자동 계산+floating 배선 부재("auto"=핵심)→browser.
- COMMERCIAL-GAP: **2 ❌→🟡** → ❌39→37·✅223·🟡65→67(Row grouping&agg 19|11|6|2·Pinned/floating 15|11|3|1·Enterprise 25→23).

## 모듈 완주 요약
1-Goal: Enterprise grouping=렌더-정의 클러스터 → node-pure 추출 substance=공유 집계 프리미티브 1(`computeAggregateRow`). ★avg-of-avgs
안전(source 직접 집계, 로컬 number[] 리듀서 ADR-001). node 15/0. 신규 lesson 없음(avg-of-avgs 기존 규율·ADR-001 적용). 분할 잔여=
grand-total footer 렌더·auto-agg floating wiring·group-header inline agg·sticky group headers/rows·row-group/pivot state-save(browser/후속).
