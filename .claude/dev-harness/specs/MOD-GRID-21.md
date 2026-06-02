# MOD-GRID-21 spec — `@topgrid/grid-pro-panel` (Full, Pro)

> dev-harness loop. weight=Full(단, **대부분 재사용** — 인벤토리로 신규≈StatusBar 1개만). competitive: AG sidebar/status bar/row-group panel · Kendo.
> reuse-gate: **재사용 게이트 첫 실전**. 인벤토리(specify 선행) 결과 조각 대부분 기존 존재 → 신규 빌드 최소화.

## ★ 재사용 인벤토리 (검증된 소스 — 재구현 금지)
- **RowGroupPanel** ← `@topgrid/grid-pro-agg` 의 **`GroupPanel`** 가 이미 드래그 그룹핑 바 완성(HTML5 드래그·칩·remove, props `{grouping, columns, onGroupingChange, className?, chipClassName?, emptyText?}`, `GroupPanelProps`). → **재export/얇은 래핑**, 드래그 로직 재구현 0.
- **ToolPanel** ← grid-core 의 `columnVisibility`/`columnOrder` state(`useGridState`/`GridState`, mod-02)를 **구동**. ⚠️ grid-core `ColumnVisibilityMenu` 는 **`@deprecated`(ADR-013, 다음 major 제거)** → **그 위에 짓지 않는다**. ToolPanel 은 신규 얇은 토글 UI 가 `onVisibilityChange`/`onReorder` 콜백으로 state 를 구동(소비자가 grid-core state 에 반영).
- **StatusBar** ← 기존 등가물 **없음** = 유일한 순수 신규(선택 수·집계 요약 슬롯).
- 패널 3종 모두 **prop 구동 headless-UI**(PAT-001) — grid-core `<Grid>` 를 합성하지 않음(→ react-split 마운트 벽 무관, node 렌더 가능).

## Goal
그리드 **주변 UI 3종**(상태바·툴패널·행그룹 패널)을 선언형으로 제공한다. 그룹 패널은 기존 agg `GroupPanel` 재사용, 툴패널은 grid-core 컬럼 state 구동, 상태바만 신규.

## Scope
- **In**: `StatusBar`(신규) + `ToolPanel`(컬럼 표시/순서 토글, grid-core state 구동) + `RowGroupPanel`(agg `GroupPanel` 재사용) + Pro 라이선스 게이트.
- **Out**: 피벗 패널(→MOD-18 완료), 차트 패널(→MOD-19 완료), 컬럼 드래그 reorder 의 신규 dnd 엔진(grid-core `useColumnOrderPersist`/order state 재사용, 신규 dnd lib 0).

## Goals (gated, 각 골 후 `tsc --noEmit`)
- **G-1 StatusBar(신규)**: `StatusBar({ items, className? })`. `StatusBarItem = { key: string; label?: string; value: ReactNode }`. 선택 수·집계 요약을 세그먼트로 렌더(label:value). 선택 카운트 편의는 소비자가 `items` 로 주입(예 `{key:'sel',label:'Selected',value:n}`). 순수 UI. 종결형.
- **G-2 ToolPanel(state 구동)**: `ToolPanel({ columns, onVisibilityChange, onReorder?, className? })`. `ToolPanelColumn = { id: string; label: string; visible: boolean; canHide?: boolean }`. 체크박스로 표시 토글 → `onVisibilityChange(id, visible)`; 선택적 up/down 으로 `onReorder(id, 'up'|'down')`. **`ColumnVisibilityMenu`(deprecated) 미사용·미import**. 소비자가 콜백을 grid-core `columnVisibility`/`columnOrder` 에 반영. 트리거+연결형.
- **G-3 RowGroupPanel(재사용)**: `@topgrid/grid-pro-agg` `GroupPanel` 을 `RowGroupPanel` 로 **재export**(+ `RowGroupPanelProps = GroupPanelProps` 타입 재export). 드래그 그룹핑 로직 재구현 0. 연결형(재사용).
- **G-4 license gate + scaffold(Pro)**: index module-load `checkLicense()`(PAT-003) + 패널에 `useLicenseStatus`/`<Watermark>`(미인증). package.json(Pro/EULA, peer react/react-dom/@tanstack/react-table, dependency `@topgrid/grid-license` + `@topgrid/grid-pro-agg`(GroupPanel 재export) workspace:*), tsup dual, tsconfig base, README/EULA. 권한가드+출력형.

## AC (측정 가능 — 재사용을 AC 로 박음)
1. **재사용**: `RowGroupPanel` 이 agg `GroupPanel` 과 동일 동작(re-export). verify: src 가 `@topgrid/grid-pro-agg` 에서 `GroupPanel` import, **자체 드래그 핸들러(onDrop/dataTransfer) 재구현 0**.
2. **재사용/안티-deprecated**: `ToolPanel` 이 컬럼 표시 토글 → `onVisibilityChange` 발화. **`ColumnVisibilityMenu` import/사용 0**(deprecated 회피). 0 재구현(state 머신은 grid-core 소관 — 콜백만).
3. **신규**: `StatusBar` 가 `items` 를 label:value 세그먼트로 렌더(선택 수·집계 슬롯).
4. 미인증 시 패널에 `<Watermark>`; 인증 시 정상. index module-load `checkLicense()`.
5. AP 전수(작동 grep): AP-001=0(외부 lib·react-virtual·chart import 0)·AP-002/003/004=0(README ↔ index 정합 **실행 대조**).
6. `tsc --noEmit` 0 + tsup build(CJS/ESM/dts). 미인증 워터마크. dist 금지어 0.
7. **동작 검증**: 패널은 `<Grid>` 무합성 → **node `renderToStaticMarkup`** 로 StatusBar/ToolPanel/RowGroupPanel 마운트(LESS-002 벽 무관, 단일 react). 미인증 워터마크 합성 확인.

## constraints
- **재사용 우선(인벤토리)**: 기존 표면(agg `GroupPanel`·grid-core column state)을 재구현하지 않는다 — verify 가 재구현 0 을 grep.
- **C-002**: deprecated `ColumnVisibilityMenu` 위에 신규 표면을 쌓지 않는다(신규 deprecated 진입 차단).
- **POL-TANSTACK**: 패널은 콜백/state 구동(선언형). 명령형 DOM 컬럼 조작 0.
- 발행물 금지어(TOMIS/topvel/@tomis) 0. 공개 식별자 엔진/브랜드 부분문자열 0(LESS-001).

## 의존
peer: `react`/`react-dom`/`@tanstack/react-table`. dependency: `@topgrid/grid-license`(게이트) + `@topgrid/grid-pro-agg`(GroupPanel 재export) — workspace:*. **grid-core 는 타입 한정(필요 시 type-only)**, `<Grid>` 합성 없음.

## 분류 (MASTER §2)
StatusBar=종결형(신규) · ToolPanel=트리거+연결형(state 구동) · RowGroupPanel=연결형(재사용) · 라이선스=권한가드.

## 수확 예상 (capture 시 검증)
reuse = PAT-001 + **agg `GroupPanel` 컴포넌트 직접 재사용**(어휘 아닌 컴포넌트 재사용 — MOD-18 의 어휘 재사용과 대비, 재사용 스펙트럼 확장). 신규 = StatusBar 만. **재사용 게이트 첫 실증**(인벤토리→재구현 0 AC). verify = node 마운트(패널은 <Grid> 무합성).
