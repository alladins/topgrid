---
id: ADR-003
title: 엔터프라이즈 차트 — @topgrid/grid-pro-chart-enterprise (ECharts 어댑터) 통합 전략
module: W2 단계② (grid-pro-chart-enterprise)
date: 2026-06
status: accepted
related: [ADR-002, "C-001", "AP-001", "ROADMAP §3-4", "PAT-005", LESS-005]
---

# ADR-003 — 엔터프라이즈 차트 ECharts 어댑터: 기존 시임 위 thin adapter (build 아님 integrate)

## Context
[[ROADMAP-MULTIFRAMEWORK-CHART]] W2 단계①(§3-4)이 **Apache ECharts(Apache-2.0)** 를 기본/번들 어댑터로 선정했다(결정 렌즈=@topgrid 가 상용 재배포 제품이라 재배포-무료 license 필수). 단계②는 `@topgrid/grid-pro-chart-enterprise` 의 **통합 전략**을 확정한다 — 코드 변경 전 게이트.

★실측으로 드러난 사실(추측 아님, 소스 대조): grid-pro-chart 는 이미
- 주입 시임 `RangeChartPanel.renderChart?: (series: RangeSeries[]) => ReactNode` (C-001/AP-001=라이브러리 의존 0),
- 데이터 브리지 `seriesFromMatrix`/`seriesFromPivot` → **`MatrixChartData = { categories: string[]; series: ChartSeries[] }`** (range 선택·피벗 둘 다 이 하나로 환원),
- 빌트인 SVG 엔진 `RangeChart`(line/bar/area) + `ChartCard`(타입 스위처)

를 보유한다. 따라서 엔터프라이즈 패키지는 **from-scratch 가 아니라** "기존 브리지+시임 위에 ECharts 백엔드를 얹는" 일이다.

## Decisions

### D1 — 데이터 입력 = 기존 리치 브리지 `MatrixChartData` 재사용. 최소 시임 `RangeSeries` 는 무변경.
엔터프라이즈 차트(카테고리/시간축·다축·범례·스택)는 **x축 라벨이 필요**하다. `RangeSeries = {name?, data: number[]}` 는 **lossy**(카테고리 없음). 반면 `MatrixChartData`(`seriesFromMatrix`/`seriesFromPivot` 산출)는 `categories + ChartSeries[]` 를 이미 갖는다. → 엔터프라이즈 어댑터는 **`MatrixChartData` 를 소비**(브리지 재사용, 단일 진실원천)하고, **`RangeChartPanel`/`RangeSeries` 최소 시임은 손대지 않는다**(C-001 보존).

### D2 — ECharts wrapper = **얇은 자작 어댑터**(`echarts-for-react` 채택 안 함).
ECharts core 를 직접 `init`/`setOption`/`dispose` + `ResizeObserver` 로 감싸는 ~50줄 React 컴포넌트를 자작한다. SSR 은 `renderToSVGString`(5.3+, zero-dep) 경유.

### D3 — ECharts **선택적 모듈 등록**(`echarts/core` + 필요한 charts/components만), `echarts` barrel import 금지.
opt-in 엔터프라이즈 패키지의 번들 위생 — 소비자가 쓰는 차트 타입만 트리쉐이크.

## Rejected
- **(R1) `RangeChartPanel.renderChart` 시임에 엔터프라이즈 관심사(축 config·cross-filter 이벤트·export)를 욱여넣기** — `RangeSeries` 최소 계약을 오염시켜 스파크라인 패널 쓰는 다수에게 비용 전가. C-001/AP-001(grid-pro-chart=라이브러리-free·최소) 위반. 대신 엔터프라이즈 패키지가 **자체 상위 패널**(`EnterpriseChartPanel`=툴바·cross-filter·export 내장)을 소유하고, 내부적으로 D1 브리지를 호출. [[LESS-005]](seam 없는 재사용 금지)의 역(逆): 시임은 있으나 *최소 계약*이라 리치 데이터는 별도 브리지로 가야 함.
- **(R2) `echarts-for-react`(커뮤니티 wrapper) 의존** — (a)Apache 공식 아님=상용 제품에 커뮤니티-유지 리스크, (b)ECharts 버전 추종 지연 가능, (c)full-barrel import 경향=D3 번들 위생과 충돌, (d)우리는 이미 주입 시임을 보유해 wrapper 가 trivial(자작 비용<의존 비용). lifecycle/resize 는 잘 알려진 ~50줄.
- **(R3) 빌트인 SVG `RangeChart` 를 ECharts 로 교체** — C-001(셀 인라인 스파크라인·경량 레인지차트=zero-dep 유지) 정면 위반. 스파크라인/경량 차트는 SVG 유지, 엔터프라이즈는 **additive opt-in**. 둘은 공존.
- **(R4) AG Charts / Highcharts 를 번들** — §3-4 에서 기각(AG Charts=갭 핵심타입 유료 / Highcharts=OEM 의무 하류 전가). 단 주입 시임이라 **소비자 BYO 어댑터**(자기 라이선스로 renderChart 주입)는 열려 있음 — 우리가 발행/번들만 안 함.

## Trade-offs
1. **자작 wrapper(D2) vs 커뮤니티 wrapper**: 자작은 init/dispose/resize lifecycle 코드를 우리가 소유(소형 부채) — 그 대가로 번들 제어·SSR 제어·무-의존·버전 자율. opt-in 상용 패키지에선 제어가 유지편의보다 가치 큼.
2. **별도 패널(R1 거부) vs 시임 확장**: 별도 `EnterpriseChartPanel` 은 표면적이 하나 더 생김(약간의 중복 느낌) — 그 대가로 grid-pro-chart 최소 시임이 깨끗이 보존되고(C-001), 엔터프라이즈 관심사가 격리됨. 다수(스파크라인)에 비용 0.
3. **리치 브리지 재사용(D1) vs 자체 데이터 타입**: `MatrixChartData` 가 range+pivot 을 이미 통합 → 재사용이 단일 진실원천. 대가: 엔터프라이즈가 ECharts 의 더 리치한 입력(다축·시간축)을 쓰려면 `MatrixChartData`→ECharts option 매핑 레이어가 필요(어댑터의 본질적 작업, 회피 불가).

## 단계③ 구현 함의 (이 ADR 가 고정하는 것)
- 신규 패키지 `packages/grid-pro-chart-enterprise/`: deps=`echarts`(선택 모듈), `@topgrid/grid-pro-chart`(브리지·`MatrixChartData`·`RangeChartPanel` 재사용), `@topgrid/grid-license`(PAT-003 게이트), peer=react.
- 공개 표면(스펙=별도 SPEC 문서): `<EChartsRangeChart>`(thin wrapper) · `createEChartsRenderer(spec)`→기존 `renderChart` 호환 팩토리(최소 시임 소비자용) · `<EnterpriseChartPanel>`(툴바·cross-filter·export 내장 상위) · `matrixToEChartsOption(MatrixChartData, ChartType)` 순수 매핑(node-testable).
- 검증: 순수 매핑은 node(zero-dep, deep-equal 회피=ECharts option 구조 단언) + live 렌더는 chromium(타입별 렌더·legend toggle·export 라운드트립).

## 컴파운딩 데이터포인트 (하네스 학습)
**"integrate=시임 재사용, 시임 오염 아님."** 주입 시임(PAT-005 host-capability-injection 계열)이 있어도 *최소 계약*이면 리치 통합은 시임을 늘리는 게 아니라 **별도 브리지+상위 패널**로 흡수한다(R1). C-001 같은 명시 제약이 "경량은 경량대로 유지, 무거운 건 additive opt-in" 분리를 강제 → 두 경로 공존이 정답(R3).
