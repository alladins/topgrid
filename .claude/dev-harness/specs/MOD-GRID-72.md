# MOD-GRID-72 — 차트 설정 패널 / 도킹 (chart panel/composition: settings panel + dock)

dev-harness 54번째 (**Enterprise ❌ backlog — render tail 3, 마지막 buildable**, advisor). grid-pro-chart(Pro).
갭분석 **Integrated charts ❌ = Chart panel/composition (dock, range adjust handles, settings panel)**(RangeChartPanel=단순 inline div, 도킹/range편집/설정 없음). 경쟁: AG integrated chart toolbar/settings.

## verify-first + reuse-gate
- grep: RangeChartPanel=주입 renderChart 컨테이너(🟡). ★**ChartCard(MOD-34 G-3)=이미 chart-type 스위처 툴바**(data-type-btn, 클릭→RangeChart type 재렌더)=settings panel 의 핵심(type 전환) **이미 존재**. dock/range-adjust 0.
- ★**reuse-gate 정정(LESS-003)**: 신규 ChartSettingsPanel 작성=ChartCard 중복 → **폐기**. 대신 ChartCard 에 누락된 **dock**(composition)만 additive 추가. RangeChart=`type:line|bar|area`(line/area→polyline·bar→rect).
- **build-vs-defer(read)**: dock(툴바 위치=flexDirection)=ChartCard 에 additive(기존 type-switch 유지)=build. **settings panel(type 전환)=이미 존재(ChartCard)**. **range-adjust handles=라이브 grid-pro-range 셀선택 배선 필요**(이미 vN, line 540)=Out → **번들 3종: settings(존재)+dock(신규)=2/3 전달, range-adjust=vN=🟡**(over-claim 회피).

## Goals
- **G-1 ChartCard dock (배선형, chromium ★비공허, 순수 0 정직)**:
  - ChartCard `dock?: 'top'|'bottom'|'left'|'right'`(=top) → 루트 inline-flex flexDirection + 툴바 방향(horizontal=column). 기존 type-switch(settings) 유지.
  - **★비공허**: dock='left' → 툴바가 차트 **좌측**(toolbar x < chart-area x, computed bbox) + 기존 type 버튼 클릭(bar→line) → 차트 재렌더(data-chart-type/polyline). "패널 렌더됨"=vacuous 금지.

## In / Out
- **In**: ChartSettingsPanel(settings state + chart-type select + dock 레이아웃) + index export + 스토리(RangeChart 주입) + chromium(type 변경→차트 갱신).
- **Out(명시 — silent gap 금지)**:
  - **range adjust handles**: 차트 데이터 범위를 핸들로 편집 = 라이브 grid-pro-range 셀선택 배선 필요(line 540 vN 동형) = vN → **본 모듈=2/3(settings+dock)만=🟡**.
  - 차트 라이브러리 내장(주입 유지)·다중 시리즈 빌트인 드로잉(이미 🟡)·cross-filter(MOD-47 🟡) = vN.

## ★ ❌ 닫힘 마커
- **Chart panel/composition = 🟡 부분**(settings panel + dock 전달, range-adjust handles=vN): COMMERCIAL-GAP Integrated charts 1 ❌→🟡 → ❌8→7·🟡72→73. reconcile 19/19·330.

## AC
G-1 ★chart-type select 변경→차트 재렌더(chromium: bar→line, polyline 등장).

## constraints
- grid-pro-chart(Pro). 외부 dep 0(차트 라이브러리 주입 유지, C-001/AP-001). **LESS-006**: 설정→차트 갱신=chromium 발산. 순수 0(정직, UI 배선).
- RangeChartPanel/RangeChart 무수정(ChartSettingsPanel=신규 add-on).

## 의존
grid-pro-chart 내부(ChartSettingsPanel). story=ChartSettingsPanel+RangeChart 주입. 외부 0.

## 분류 (MASTER §2)
ChartSettingsPanel=**배선형**(settings→차트 갱신 chromium). 순수 0(정직).

## reuse-gate 결과 / 추측 0
재사용=RangeChartPanel 주입 패턴·RangeChart RangeChartType·select UI. 신규=ChartSettingsPanel(settings state+dock). 추측 0: AG chart settings/toolbar(chart-type 변경)=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(settings panel→차트 갱신 비공허) **9/10** · [x] In/Out(range-adjust/라이브러리/cross-filter Out=🟡) **10/10** · [x] AC(type 변경→재렌더 chromium) **10/10**
- [x] reuse-gate(RangeChartPanel 주입·RangeChartType·select) **10/10** · [x] constraints(library-agnostic·순수 0 정직) **10/10** · [x] 의존(내부, 외부 0) **9/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(배선형, 순수 0 정직) **9/10** · **합계 76/80 통과.**

---

## G-1 결과 (완료 — 2026-06-08) → MOD-72 = 🟡, §3 이관 · ★마지막 buildable
**구현**(grid-pro-chart, RangeChart/RangeChartPanel 무수정): ★reuse-gate(LESS-003)로 신규 ChartSettingsPanel 폐기(ChartCard 가 이미 type 스위처=settings) → ChartCard `dock?:'top'|'bottom'|'left'|'right'`(inline-flex flexDirection, data-chart-dock) additive 추가. index ChartDock export.
**검증**: typecheck 0·build green·**chromium 1/1**(chart-panel-dock.spec.ts ★dock=left→툴바 차트 svg 좌측[computed bbox]+도킹 중 type 전환 bar→line[data-chart-type·polyline]) + **full-suite 118/118 green**(기존 ChartCard 회귀=dock 기본 top byte-identical-equiv).
**closure(advisor)**: ★disposition 🟡(2/3): settings(ChartCard 기존)+dock(신규) 전달, range adjust handles=라이브 grid-pro-range vN=Out(over-claim 회피). Integrated charts ❌→🟡, ❌8→7·✅247·🟡72→73(reconcile 19/19·330, Enterprise 3→2). ★**마지막 buildable 항목=buildable backlog 0 도달**(잔여 ❌7=by-design floor: Community settled defer 5+Excel cell styles edition-blocked+context submenu ⛔). 신규 lesson 없음(LESS-003 재적용).
