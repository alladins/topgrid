# SPEC — `@topgrid/grid-pro-chart-enterprise` (W2 단계②)

> 상태: **스펙(미구현)**. 결정 근거 = [[ADR-003]] · ROADMAP §3-4. 구현 = 단계③(ADR 승인 후 게이트).
> ★integrate(ECharts wrap), build 아님. grid-pro-chart 의 SVG 스파크라인/경량 RangeChart 는 무변경 공존(C-001).

## 1. 목적·범위
선정된 **Apache ECharts(Apache-2.0)** 를 기존 주입 시임·데이터 브리지 위에 얹어, §3-2 의 부재 엔터프라이즈 차트 타입을 opt-in 으로 제공. **재사용**: `seriesFromMatrix`/`seriesFromPivot`→`MatrixChartData`, `RangeChartPanel` 시임, `grid-license` 게이트(PAT-003).

**범위 밖(명시)**: BYO Highcharts/AG Charts 어댑터(소비자가 자기 라이선스로 주입, 우리 미발행) · Vue wrapper(동일 매핑 코어 위 별도 단위, W1 정렬 후) · 실시간 스트리밍.

## 2. 패키지 의존
```
@topgrid/grid-pro-chart-enterprise
  ├─ echarts            (선택 모듈 등록: echarts/core + charts/components 필요분만 — ADR-003 D3)
  ├─ @topgrid/grid-pro-chart   (MatrixChartData·seriesFrom*·RangeChartPanel·RangeSeries 재사용)
  ├─ @topgrid/grid-license     (checkLicense() module-load 게이트, PAT-003)
  └─ peer: react
```

## 3. 공개 API 표면 (제안)

### 3-1. 순수 매핑 (node-testable, React 0)
```ts
// MatrixChartData(categories+ChartSeries[]) → ECharts EChartsOption. 순수 함수.
export type EnterpriseChartType =
  | 'line' | 'bar' | 'area' | 'stacked-bar' | 'stacked-area' | '100-stacked-bar'
  | 'pie' | 'doughnut' | 'scatter' | 'bubble' | 'radar' | 'heatmap'
  | 'candlestick' | 'boxplot' | 'funnel' | 'treemap' | 'sankey';
export interface ChartOptionSpec {
  type: EnterpriseChartType;
  secondaryAxisSeries?: string[];   // 다축: 이 series 들은 2차 Y
  stacked?: boolean;
  theme?: 'light' | 'dark';
  dataLabels?: boolean;
}
export function matrixToEChartsOption(
  data: MatrixChartData,
  spec: ChartOptionSpec,
): EChartsOption;                    // ★타입 카탈로그의 핵심 — 순수, deep-equal 회피 단언
```

### 3-2. Thin React wrapper (자작 — ADR-003 D2)
```ts
export interface EChartsChartProps {
  option: EChartsOption;             // 보통 matrixToEChartsOption() 결과
  width?: number | string;
  height?: number | string;
  onSelect?: (payload: ChartSelection) => void;  // cross-filter 소스
}
// init/setOption/dispose + ResizeObserver, ~50줄. echarts/core 직접.
export function EChartsChart(props: EChartsChartProps): JSX.Element;
```

### 3-3. 기존 최소 시임 호환 팩토리
```ts
// RangeChartPanel.renderChart?: (series: RangeSeries[]) => ReactNode 와 호환.
// 최소 시임만 가진 소비자가 ECharts 백엔드를 즉시 주입할 수 있게.
export function createEChartsRenderer(
  spec: ChartOptionSpec,
): (series: RangeSeries[]) => ReactNode;
```

### 3-4. 상위 패널 (엔터프라이즈 관심사 격리 — ADR-003 R1)
```ts
export interface EnterpriseChartPanelProps {
  data: MatrixChartData;             // seriesFromMatrix/seriesFromPivot 결과
  initialType?: EnterpriseChartType;
  enableToolbar?: boolean;           // "Insert Chart" / 타입 스위처
  enableExport?: boolean;            // PNG/SVG (echarts getDataURL)
  onCrossFilter?: (sel: ChartSelection) => void;  // 차트 선택 → 그리드
}
export function EnterpriseChartPanel(props: EnterpriseChartPanelProps): JSX.Element;
```

## 4. 통합 계약 (그리드 ↔ 차트)
- **chart-from-range**: 그리드 range 선택 → 기존 `seriesFromMatrix` → `MatrixChartData` → 패널. (브리지 재사용, 신규 변환 0.)
- **chart-from-pivot**: 피벗 결과 → 기존 `seriesFromPivot` → 동일 경로.
- **cross-filter**: 차트 `onSelect`/`onCrossFilter` → 소비자가 그리드 필터에 매핑(주입, 우리는 콜백만 노출 — grid 결합 0, C-001 정신).
- **export**: `enableExport` → ECharts `getDataURL({type:'png'|'svg'})`. PDF 는 소비자 측(범위 밖, 정직).

## 5. 검증 게이트 (단계④)
- 순수: `matrixToEChartsOption` node — 타입별 option 구조 단언(stacked→series[].stack 존재, 다축→yAxis 2개, pie→series[].type==='pie' 등). zero-dep.
- live: chromium — 타입 카탈로그 렌더 + legend toggle + zoom + export 라운드트립(getDataURL→이미지 non-empty).
- license: 무-Pro → watermark 합성(RangeChartPanel 기존 경로 재사용).

## 6. 미해결(스펙→구현서 확정) — 정직
- `EChartsOption` 타입을 우리 표면에 노출할지 vs 내부 캡슐화(ECharts 타입 누출 최소화) — 캡슐화 선호, 구현서 확정.
- 선택 모듈 등록 목록(어떤 차트 타입을 1차 카탈로그에 넣을지) = 번들 예산 대비 결정.
- SSR(`renderToSVGString`) 노출은 Vue/Nuxt 단위에서(현 단계 React 우선).
