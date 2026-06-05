# MOD-GRID-34 — 내장 차트 엔진 (cartesian line/bar → 축/범례/툴팁/area → 툴바/범위선택/피벗차트)

> ⚠ **소급 작성(retroactive backfill, 2026-06-06)**: 본 spec 은 구현 *이전*이 아니라 *이후*에
> `state.json`(g1/g2/g3)·git 커밋·MASTER §3 에서 재구성됐다. MOD-34~39 는 정식 specify 페이즈를
> 건너뛰고 인라인 진행됐다(→ `docs/internal/WORKFLOW-INTEGRITY-AUDIT.md`). 본 문서는 추적성 공백
> 복원용이며, 아래 Goal/AC 는 "사전 계약"이 아니라 **"실제 구현·검증된 것의 기록"**이다.

dev-harness 17번째. **★사용자 헤드라인 갭** — 통합 차트 클러스터(Enterprise 7개)가 단일 최대 결손("차트가 하나도 안
보임"). 근본 원인 = 차트 스토리 0개. grid-pro-chart 확장.

## ★ critical decision (AskUserQuestion)
**순수 SVG만** — 차트 라이브러리 dep 0 불변식 유지(C-001/AP-001). recharts/visx/hybrid 미채택(사용자 결정).

## design (advisor)
차트는 browser-only 아님 — 진짜 순수 코어 = data→좌표 scale(value→x/y, 축 tick, 도메인). LESS-006 split:
scale=node, paint=chromium. 스코프 락: cartesian 1계열(line+bar 공유 scale/축), pie/scatter=vN.

## Goals (실제 구현 기록)
- **G-1 cartesian 코어+렌더**: 순수 `internal/chartScale.ts` `computeChartGeometry(series,{w,h,margin})`→
  `{plot,yScale,yTicks,xBand,series points}` + `linearScale/niceTicks/bandScale`. 렌더 `RangeChart{series,type:line|bar,
  width?,height?,categories?,ariaLabel?}` 순수 SVG(자작 polyline/rect/축 그리드+tick, 차트 lib 0).
  - AC: max→top px·min→bottom px(축 비반전)·N점→N좌표·x 단조·tick 라운드·NaN→gap no-shift·≥0 데이터 0 baseline.
- **G-2 축/범례/툴팁/area/마커**: `showLegend?`(기본 true)·`showTooltip?`(기본 true)·`type:'area'`·`SparklineCell
  showMinMax?`. 툴팁=in-SVG `<g>`(HTML 오버레이 회피, x 우측 클램프), 범례 단일 `colorOf`(시리즈 결합).
  - AC: 툴팁 hover→해당 값(index/첫점 고정 함정 차단)·범례 스와치=막대 fill(desync 차단)·area polygon·마커=실제 극점.
- **G-3 툴바/타입스위처+범위선택+피벗차트**: 순수 `internal/seriesFromMatrix(...)`→`{categories,series}`(범위·피벗 공유
  bridge, grid/pivot import 0) + `seriesFromPivot`(PivotModel data행, subtotal/grandTotal 드롭). `ChartCard{initialType?,
  types?,title?,...}` 타입 토글 툴바(useState, aria-pressed).
  - AC: 툴바 bar→line→area 실제 전환(DOM 교체)·피벗 2시리즈·범위선택 2시리즈.

## constraints
**Pro**(grid-pro-chart). PAT-003(RangeChart `useLicenseStatus()`+Watermark required, ChartCard 상속). 외부 차트 lib
dep **0**(C-001/AP-001). LESS-006: chartScale/seriesFromMatrix=node, paint=chromium.

## 의존
grid-pro-chart(기존)·grid-license. 신규 외부 dep 0.

## 분류 (MASTER §2)
chartScale/seriesFromMatrix=종결형(순수) · RangeChart/ChartCard=종결형+연동(렌더).

## 결과 (완료 — 2026-06-05/06, §3 이관)
- **G-1**: node **11/11**(scale 비반전·단조·tick·NaN gap·baseline) + chromium **4/4**(range-chart.spec: 값 큰 막대 실제
  더 높음=비공허·라운드 tick·polyline 정점=데이터수·멀티시리즈 8막대). 차트 스토리 신설(가시화). SparklineCell inline
  scale→순수 chartScale 승격(중복 제거).
- **G-2**: node **12**(mixed-sign baseline: 음수→below·양수→above) + chromium **4/4**(range-chart-g2: 툴팁 두 hover 두
  값·범례 fill=막대 fill·area polygon·sparkline 마커=실제 극점). 툴팁 in-SVG `<g>`.
- **G-3**: node **7/7**(seriesFromMatrix 5+seriesFromPivot 2: orientation transpose·subtotal 미누출·friendly 라벨) +
  chromium **3/3**(chart-card: 툴바 bar→line→area 실제 전환·피벗 6막대·범위선택 6막대).
- **차트 클러스터 7개**: ✅4(내장엔진·축/툴팁·스파크 마커·툴바/타입스위처·피벗차트[seriesFromPivot]) + 🟡1(범위선택:
  transform shipped, 라이브 grid-pro-range 셀선택 배선=vN) + vN2(패널/dock·크로스필터).
- **합계**: node 19(chartScale12+series7) + chromium 11. 전체 visual 회귀 61/61. typecheck 0.
- **정직성 시정(advisor 재감사)**: 범위선택 ✅→🟡(transform만)·seriesFromPivot 로 피벗차트 진짜 ✅·RangeChart 워터마크
  추가(무라이선스 무료노출 차단).
