# MOD-GRID-64 — 피벗 도구 패널 DnD (drag-and-drop pivot column tool panel UI)

dev-harness 46번째 (**Enterprise ❌ backlog — DnD 클러스터 1번째**, advisor). grid-pro-pivot(Pro 스코프).
갭분석 **Pivot ❌ = Pivot panel / drag-and-drop pivot column tool panel UI**. 경쟁: AG pivot tool panel(필드를 Row/Column/Values 존으로 드래그).

## verify-first + reuse-gate
- grep: grid-pro-pivot 에 패널 UI 0(PivotGrid=결과 렌더, config는 prop). PivotConfig={rows:string[],columns:string[],values:PivotValueDef[]}(types.ts). genuine 부재.
- 재사용:
  - **DnD 패턴=grid-row-reorder(MOD-33) 검증된 신뢰형**: 핸들러가 **React ref**(dragField.current)로 소스 저장 → playwright `dispatchEvent('dragstart'/'dragover'/'drop')` 가 구동(dataTransfer=Safari 폴백, GroupPanel 패턴). ★유일하게 신뢰성 입증된 DnD 테스트 형태 — 이탈 금지.
  - PivotGrid(MOD-53 렌더 검증) + config prop → 스토리서 공유 useState 로 배선.
- 신규=순수 movePivotField + PivotPanel 컴포넌트(존 4개 + draggable chip).

## Goals
- **G-1 순수 movePivotField — 종결형(map)**:
  - `movePivotField(config, field, toZone): PivotConfig`. toZone ∈ rows|columns|values|available.
  - field 를 모든 존에서 제거 후 toZone 끝에 추가(available=제거만). values 재추가 시 기존 def(aggregationFn/label) 보존, 신규는 `{field, aggregationFn:'sum'}`.
  - node 검증: available→rows / rows→columns / →values(sum 기본) / →available(제거) / 기존 def 보존 / 미존재 field 무영향.
- **G-2 PivotPanel 배선형(chromium ★end-to-end 발산)**:
  - `PivotPanel({fields, config, onConfigChange})`: 4 존(Available/Rows/Columns/Values), available=fields−(rows∪columns∪values). chip=draggable, 존=drop target → movePivotField → onConfigChange.
  - **★발산(advisor, "chip 이동"=vacuous 금지)**: 스토리서 PivotPanel↔PivotGrid 를 **공유 useState<PivotConfig>** 로 배선. `region` chip 을 Rows 존에 drop → **PivotGrid 에 새 행-차원 그룹/헤더가 실제로 등장**(그리드 재-피벗)을 assert. = 패널이 피벗을 *구성*함을 입증(존 내 chip 이동만 ❌).

## In / Out
- **In**: 순수 movePivotField + test + PivotPanel(4 존 DnD) + index export + 스토리(PivotPanel+PivotGrid 배선) + chromium(그리드 재-피벗 발산).
- **Out(명시 — silent gap 금지)**:
  - **동일 field 를 values 에 2회(multi-aggregation; amount=sum & avg 동시)** — movePivotField 의 `filter(v.field!==field)` 가 금지. AG 는 허용. = vN(follow-up).
  - **aggregation-fn 선택 UI(picker)** — values 신규 field=`'sum'` 고정, 변경 UI 없음. = vN(follow-up).
  - 존 내부 재정렬(reorder within zone) · 필드 검색/필터 · 측정값 라벨 편집.

## ★ ❌ 닫힘 마커
- **Pivot panel(DnD tool panel UI) = ✅**: 순수 movePivotField + PivotPanel 배선, end-to-end(그리드 재-피벗) 입증. multi-agg/picker=Out 명시. COMMERCIAL-GAP **Pivot** 1 ❌→✅ → ❌17→16·✅239→240. reconcile 19/19·330.

## AC
G-1 movePivotField 매핑(node) · G-2 region drop→PivotGrid 새 행그룹 등장(chromium, vacuous 아님).

## constraints
- grid-pro-pivot(Pro 스코프). 외부 dep 0. **LESS-006**: DnD 동작=브라우저→chromium 발산. 순수 map=node.
- **LESS-002 회피**: PivotPanel/PivotGrid 는 storybook single-react 하네스서 정상 렌더(ContextMenuGrid 계열 아님). DnD 핸들러는 ref 기반(dispatchEvent 구동 가능).
- 기존 PivotGrid/computePivot/config 계약 무수정(PivotPanel=신규 add-on).

## 의존
grid-pro-pivot 내부(신규 movePivotField + test + PivotPanel + index). story=PivotPanel+PivotGrid(공유 state). 외부 0.

## 분류 (MASTER §2)
movePivotField=**종결형**(순수 map). PivotPanel DnD 배선=**배선형**(chromium end-to-end).

## reuse-gate 결과 / 추측 0
재사용=grid-row-reorder DnD 신뢰패턴(ref+dispatchEvent)·GroupPanel dataTransfer 폴백·PivotGrid 렌더·config prop. 신규=movePivotField+PivotPanel. 추측 0: AG pivot tool panel(Row/Column/Values 존 드래그)=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(movePivotField map + PivotPanel end-to-end) **9/10** · [x] In/Out(multi-agg/picker/reorder Out) **10/10** · [x] AC(map node·그리드 재-피벗 chromium) **10/10**
- [x] reuse-gate(grid-row-reorder DnD 패턴·PivotGrid·config) **10/10** · [x] constraints(LESS-006/002·ref 핸들러) **10/10** · [x] 의존(내부, 외부 0) **9/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(종결형+배선형) **9/10** · **합계 76/80 통과.**

---

## G-1·G-2 결과 (완료 — 2026-06-08) → MOD-64 = ✅, §3 이관
**구현**(grid-pro-pivot, PivotGrid/computePivot/config 무수정 add-on):
- G-1 순수 `movePivotField(config, field, zone: PivotZone)→PivotConfig`(모든 존서 제거 후 대상 존 끝 추가, available=제거만, values 재진입 시 기존 def 보존).
- G-2 `PivotPanel({fields,config,onConfigChange,className?})` 4 존(Available/Rows/Columns/Values) HTML5 DnD — chip draggable(**ref-keyed** `dragField` + dataTransfer Safari 폴백, **LESS-009**), 존 drop→movePivotField→onConfigChange. index export.

**검증**: **node 13/0**(`movePivotField.test.ts`) · typecheck 0 · build green · **chromium 1/1**(`pivot-panel-dnd.spec.ts`) + **full-suite 109/109 green**(무-flake).
- ★end-to-end: 스토리서 PivotPanel↔PivotGrid 공유 `useState<PivotConfig>` → `region` 드래그→Rows 존 → PivotGrid **재-피벗**(East/West 행 등장, 드래그 전 부재 확인) + chip Available→Rows 이동. = 패널이 피벗을 *구성*함(advisor: "chip 이동"만 ❌).

## ★ closure + 발견 (advisor)
- **Pivot panel(DnD tool panel UI) = ✅**: COMMERCIAL-GAP **Pivoting 19/2/2→20/2/1**(❌→✅), **❌17→16·✅239→240·🟡71**(reconcile 19/19·330·0 mismatch·Enterprise 11→10).
- **Out 명시(silent gap 금지)**: multi-aggregation(동일 field values 2회)·agg-fn picker UI·존 내 재정렬 = vN(follow-up).
- **신규 lesson LESS-009**(ref-keyed DnD 핸들러는 `e.dataTransfer` 직접 접근 금지, 합성 dispatchEvent=null throw): 첫 시도(GroupPanel dataTransfer-first 베낌)가 chromium 드롭 no-op → ref 우선·try-guard 폴백으로 교정. N=2 with MOD-33. DnD 클러스터 표준 패턴.

## 모듈 완주 요약
2-Goal(✅): Enterprise backlog 11번째(DnD 클러스터 1, advisor). 순수 movePivotField(node 13/0)+PivotPanel(4 존 HTML5 DnD). ★발산=그리드 재-피벗(advisor, chip 이동 아님). Out 3종 명시. 109/109 green. lesson=LESS-009(ref-keyed DnD dataTransfer 가드).
