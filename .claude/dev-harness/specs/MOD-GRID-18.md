# MOD-GRID-18 spec — `@topgrid/grid-pro-pivot` (Full)

> dev-harness loop. weight=Full(차트보다 큼 → 게이트형 골 분해). competitive: AG pivot · xxxx PivotEngine · DevExpress · SyncFusion.
> reuse-gate: 신규. 재사용 = **PAT-001**(headless hook + `<Grid>` wrapper)·**PAT-003**(license gate)·POL-TANSTACK(column groups 선언형). **ADR-001** 적용(reducer 로컬, agg 어휘만 재사용).

## Goal
평면 데이터를 **행 차원 × 열 차원 × 값 집계**의 2D 피벗 테이블로 선언적으로 변환·렌더한다.
피벗 모드 토글로 일반 그리드로 복귀한다.

## ★ 재사용 범위 (정직 — ADR-001)
- **재사용 O**: `@topgrid/grid-pro-agg` 의 **키 어휘만** — `AggregationFnKey`(타입) + `BUILT_IN_AGGREGATION_KEYS`(상수).
- **재사용 X(소스가 지원 못 함)**: `resolveAggregationFn`(TanStack-internal 키 반환, 피벗은 TanStack 집계 미경유) · `getAggregationFn`(Row 기반 다중컬럼). → 피벗은 순수 reducer 5종을 **신규 구현**(중복 아님; agg 에 순수 reducer 부재). 커스텀 값 fn = 피벗 고유 계약 `(values:number[])=>number`.
- 이 사실은 verify 에서 **MASTER §5.2 finding 1건**으로 기록(재사용 실패 아님).

## Scope
- **In**: `usePivot`(headless 변환) + `PivotGrid`(렌더 wrapper) + 행/열 차원 N개 + 값 집계(내장 5 + 커스텀) + 총계/소계 + 피벗 모드 토글 + Pro 게이트.
- **Out**: 드래그 구성 패널(→MOD-21 grid-pro-panel 연계, v1 은 config prop), 서버사이드 피벗(→MOD-22), 차트 연동(→MOD-19), **가상화**(grid-core `<Grid>` 에 위임 — 본 패키지는 react-virtual 미import → AP-001 표면 0).

## Goals (게이트형 — 각 골 후 `tsc --noEmit` + build 통과)
- **G-1 변환(headless)**: `usePivot<TData>(data, config) => PivotModel`. config = `{ rows: string[], columns: string[], values: PivotValueDef[] }`. `PivotValueDef = { field: string, aggregationFn: AggregationFnKey | ((values:number[])=>number), label?: string }`. 산출: 행그룹 트리 · 열조합 트리 · 셀 매트릭스(셀 = reducer(매칭 leaf 의 field 값들)). **순수 함수(React 무관)** — tree-shake 분리(agg `aggregationFns.ts` 선례). 종결형.
- **G-2 reducer 5종**: `sum/avg/min/max/count` over `number[]`. 빈 배열·NaN/Infinity 안전(finite 필터 후, 빈 → null 셀). `BUILT_IN_AGGREGATION_KEYS` 로 키 검증(하드코딩 카운트 금지 — C-003). 종결형.
- **G-3 렌더 + 열 헤더(PAT-001 wrapper)**: `PivotGrid<TData>({ data, config, pivotMode?, ... })`. 열 차원 → **TanStack column groups**(중첩 `ColumnDef.columns`) → grid-core `<Grid>` 에 위임(다단 헤더). 행 차원 → 선두 컬럼(차원당 1열). **★스파이크(implement 선행)**: 소계/행차원 행이 `<Grid>` 의 `rowClassName` + 조건부 `column.cell` 로 렌더 가능한지 먼저 검증 → 가능하면 `<Grid>` 위임 유지, 불가하면 **소계/그룹 행만 최소 자체 `<table>`**(agg `GroupRow`/`FooterRow` 선례)로 폴백. spec 은 "열축 위임"만 단정, 행축 렌더는 스파이크 결과로 확정. 연결형+종결형.
- **G-4 총계/소계**: 열 grand-total(맨 우측/하단) + 행 grand-total + 행차원 그룹별 **소계**(2축이 무거움). 아이밍하되 미끄러지면 **grand-total v1 출하 + 소계는 기록된 후속**(§5.2). 종결형.
- **G-5 피벗 모드 토글 + scaffold**: `pivotMode` false → 피벗 변환 없이 일반 그리드 passthrough(`<Grid data columns>`). license gate(PAT-003: index `checkLicense()` + `useLicenseStatus`/`<Watermark>`). package.json(Pro/EULA, peer react/react-dom/@tanstack/react-table, dep @topgrid/grid-license + @topgrid/grid-core + @topgrid/grid-pro-agg(workspace:*), **react-virtual·chart lib 미선언**), tsup dual, tsconfig extends base, README/EULA. 권한가드+출력형.

## AC (측정 가능)
1. `usePivot(data, {rows:['region'], columns:['quarter'], values:[{field:'sales',aggregationFn:'sum'}]})` → 행=region 그룹, 열=quarter 조합, 셀=sales 합. 다차원(rows/columns 2개씩) 동작.
2. reducer 5종 수치 정확(sum/avg/min/max/count). 빈/NaN 안전(throw X, 빈 셀 null).
3. 열 차원 → 중첩 헤더(column groups)로 렌더. `pivotMode=false` → 일반 그리드 복귀(피벗 변환 0).
4. grand-total 행·열 표시. 소계 = 구현 or §5.2 기록된 후속(정직).
5. **AP 전수(작동 grep)**: AP-001=0(react-virtual·chart lib import 0, optional peer 0), AP-003=0(stale 하드코딩 카운트 0 — 특히 "5 built-in" 류), AP-002/004=0. 음성대조는 기존 입증분 원용.
6. `tsc --noEmit` 0 + tsup build(CJS/ESM/dts). 미인증 시 `<Watermark>`. dist 금지어(TOMIS/echarts) 0.
7. **커스텀 값 fn**: `aggregationFn: (v)=>v.reduce((a,b)=>a+b,0)/v.length` 주입 시 셀에 반영(피벗 고유 계약).

## constraints
- **C-001**(필수): optional peer 정적 import 금지 → 가상화는 grid-core 위임(react-virtual 미import, 표면 0).
- **C-003**(필수): 주석/README 의 집계종 개수 등 하드코딩 카운트 금지 → `BUILT_IN_AGGREGATION_KEYS.length` 참조.
- **POL-TANSTACK**: column groups·`ColumnDef` 선언형. AG/xxxx 피벗 엔진 직접 도입 0.
- **ADR-001**: reducer 로컬 + agg 어휘만 재사용. 공유 추출은 N=2 트리거 전까지 금지.
- 발행물 금지어(TOMIS/topvel/@tomis) 0.

## 의존
peer: `react`/`react-dom`/`@tanstack/react-table`. dependency: `@topgrid/grid-license`·`@topgrid/grid-core`(`<Grid>` 위임)·`@topgrid/grid-pro-agg`(키 어휘) — 모두 workspace:*.
**react-virtual·차트 lib: 미선언**(가상화 위임/차트 무관).

## 분류 (MASTER §2)
usePivot=종결형(순수변환) · PivotGrid=연결형(<Grid> 위임)+종결형 · 총계/소계=종결형 · pivotMode=트리거 · 라이선스=권한가드.

## 수확 예상 (capture 시 검증)
reuse = PAT-001/003 + agg 어휘. 신규 = ADR-001(설계분기). §5.2 finding = agg reducer 부재. AP 슬립 리스크 = AP-003(stale count) — verify 작동 grep 으로 정직 보고.
