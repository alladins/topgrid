# 차트

topgrid는 그리드 데이터를 시각화하는 **3개 레이어**를 제공합니다 — 셀 인라인 스파크라인부터
17종 엔터프라이즈 차트 카탈로그까지. **React와 Vue 3** 모두 동일 엔진으로 지원합니다.

## 어떤 패키지가 필요한가

| 사용 사례 | 패키지 | 라이선스 |
|---|---|---|
| 셀 안 스파크라인 (line/bar/area/win-loss) | `@topgrid/grid-pro-chart` | Pro |
| 경량 범위 차트 (zero-dep SVG, 3종) | `@topgrid/grid-pro-chart` | Pro |
| **엔터프라이즈 카탈로그 17종 (React)** | `@topgrid/grid-pro-chart-enterprise` + `echarts` | Pro + Apache-2.0 |
| **엔터프라이즈 카탈로그 17종 (Vue 3)** | `@topgrid/grid-pro-chart-enterprise-vue` + `echarts` + `vue` | Pro + Apache-2.0 |
| 프레임워크 무관 옵션 엔진만 | `@topgrid/grid-chart-core` | Pro |
| Highcharts / AG Charts 직접 주입 (BYO) | 주입 시임 (별도 의존 0) | 본인 라이선스 |

- **`grid-pro-chart`**는 차트 라이브러리 의존이 **0**(순수 SVG) — 셀/경량 시각화용.
- **엔터프라이즈**는 [Apache ECharts](https://echarts.apache.org/)(Apache-2.0)를 **peer**로 사용 —
  소비자가 `echarts`(5.x 또는 6.x)를 설치, 앱 전체가 단일 ECharts 인스턴스를 공유합니다.
- 17 타입: line·bar·area·stacked-bar·stacked-area·100-stacked-bar·scatter·bubble·pie·doughnut·
  funnel·treemap·radar·heatmap·candlestick·boxplot·sankey.

## 데이터 → 차트 (range / pivot 공용)

차트 입력은 **labelled matrix** 하나로 환원됩니다 — 셀 범위 선택이든 피벗 결과든 동일합니다.

```ts
import { seriesFromMatrix } from '@topgrid/grid-pro-chart';      // 또는 seriesFromPivot
import { matrixToEChartsOption } from '@topgrid/grid-chart-core';

const data = seriesFromMatrix({ categories, columns, matrix });   // { categories, series }
const option = matrixToEChartsOption(data, { type: 'stacked-bar', dataLabels: true });
```

`matrixToEChartsOption`은 **framework-neutral**(React/Vue 무관) — React와 Vue 패키지가 *같은*
함수를 호출하므로 차트 산출물이 동일합니다.

## React 빠른 시작

```tsx
import { EnterpriseChartPanel } from '@topgrid/grid-pro-chart-enterprise';
import { setLicenseKey } from '@topgrid/grid-license';

setLicenseKey(MY_KEY);  // 앱 entry 1회 (미설정 시 watermark)

<EnterpriseChartPanel
  data={data}
  initialType="bar"
  toolbarTypes={['bar', 'line', 'radar', 'heatmap']}   // 17 중 선택 노출
  enableExport
  onCrossFilter={(sel) => applyGridFilter(sel.name)}    // 차트 클릭 → 그리드 필터
/>
```

## Vue 3 빠른 시작

```ts
import { EnterpriseChartPanel, setLicenseKey } from '@topgrid/grid-pro-chart-enterprise-vue';
setLicenseKey(MY_KEY);
// <EnterpriseChartPanel :data="data" initial-type="bar"
//   :toolbar-types="['bar','radar','heatmap']" @cross-filter="onSelect" />
```

- License 워터마크 **자동 게이트**(React와 동등) — **React 의존 0**.
- 서버 정적 SVG: `renderChartToSvgString(option, { width, height })` (SSR, DOM 불필요).
- **라이브 데모**: [Vue 3 엔터프라이즈 차트](pathname:///vue-chart-demo/)(툴바로 타입 전환) — [예제 페이지](./migration/live-demos)에도 임베드.

:::tip Vue Pro 데이터 → 차트
Vue 3 앱에서 **피벗·서버사이드 결과를 차트로** 연결하려면 신규 Vue Pro 패키지를 함께 쓰세요:
- **피벗 → 차트**: [`@topgrid/grid-pro-pivot-vue`](./api/grid-pro-pivot-vue)의 `useVuePivot` 모델을 `seriesFromPivot` → `matrixToEChartsOption` 으로 넘깁니다.
- **서버 데이터 → 차트**: [`@topgrid/grid-pro-serverside-vue`](./api/grid-pro-serverside-vue)의 `useVueServerSideData` 로 받은 데이터를 `seriesFromMatrix` 로 변환합니다.

사용법은 [시작 가이드 §4.5](./getting-started#45-vue-3--피벗--서버사이드-pro) 참고.
:::

## 셀 / 경량 차트 (zero-dep)

```tsx
import { SparklineCell, RangeChart } from '@topgrid/grid-pro-chart';
<SparklineCell type="line" values={[3, 8, 4, 9, 6]} />       // 셀 안 스파크라인
<RangeChart type="bar" series={series} categories={months} /> // 경량 SVG 차트
```

## Bring-your-own (Highcharts / AG Charts)

ECharts를 쓰지 않고 본인이 라이선스한 라이브러리를 주입할 수 있습니다 — `RangeChartPanel`의
`renderChart` 시임은 라이브러리 무관입니다.

```tsx
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { RangeChartPanel } from '@topgrid/grid-pro-chart';

<RangeChartPanel
  series={selectedSeries}
  renderChart={(s) => (
    <HighchartsReact highcharts={Highcharts}
      options={{ series: s.map((x) => ({ type: 'column', name: x.name, data: x.data })) }} />
  )}
/>
```

ECharts는 Apache-2.0이라 번들/재배포에 의무가 없습니다. Highcharts·AG Charts Enterprise는
**소비자 본인 라이선스**로 BYO합니다(우리가 번들하지 않음).
