# topgrid 차트 가이드

topgrid 는 그리드 데이터를 시각화하는 **3개 레이어**를 제공한다 — 셀 인라인 스파크라인부터
17종 엔터프라이즈 차트 카탈로그까지. **React 와 Vue 3 둘 다** 동일 엔진으로 지원한다.

- 전체 export·시그니처는 각 패키지 README + `api-reference.md` 참고
- 멀티프레임워크 배경은 `ROADMAP-MULTIFRAMEWORK-CHART.md`

---

## 1. 어떤 패키지가 필요한가

| 사용 사례 | 패키지 | 라이선스 |
|---|---|---|
| 셀 안 스파크라인 (line/bar/area/win-loss) | `@topgrid/grid-pro-chart` | Pro |
| 경량 범위 차트 (zero-dep SVG, 3종) | `@topgrid/grid-pro-chart` | Pro |
| **엔터프라이즈 카탈로그 17종 (React)** | `@topgrid/grid-pro-chart-enterprise` + `echarts` | Pro + Apache-2.0 |
| **엔터프라이즈 카탈로그 17종 (Vue 3)** | `@topgrid/grid-pro-chart-enterprise-vue` + `echarts` + `vue` | Pro + Apache-2.0 |
| 프레임워크 무관 옵션 엔진만 | `@topgrid/grid-chart-core` | Pro |
| Highcharts / AG Charts 직접 주입 (BYO) | 주입 시임 (별도 의존 0) | 본인 라이선스 |

- **`grid-pro-chart`** 는 차트 라이브러리 의존이 **0** (순수 SVG). 셀/경량 시각화용.
- **엔터프라이즈** 는 [Apache ECharts](https://echarts.apache.org/)(Apache-2.0)를 **peer** 로 번들 —
  소비자가 `echarts`(5.x 또는 6.x) 를 설치, 앱 전체가 단일 ECharts 인스턴스를 공유.
- 17 타입: line·bar·area·stacked-bar·stacked-area·100-stacked-bar·scatter·bubble·pie·doughnut·
  funnel·treemap·radar·heatmap·candlestick·boxplot·sankey.

## 2. 데이터 → 차트 (range / pivot 공용)

차트 입력은 **labelled matrix** 하나로 환원된다 — 셀 범위 선택이든 피벗 결과든 동일.

```ts
import { seriesFromMatrix } from '@topgrid/grid-pro-chart';      // 또는 seriesFromPivot
import { matrixToEChartsOption } from '@topgrid/grid-chart-core';

const data = seriesFromMatrix({ categories, columns, matrix });   // { categories, series }
const option = matrixToEChartsOption(data, { type: 'stacked-bar', dataLabels: true });
```

`matrixToEChartsOption` 은 **framework-neutral**(React/Vue 무관, echarts 는 type-only). React 와 Vue
패키지가 *같은* 함수를 호출한다 = 차트 산출물 동일.

## 3. React 빠른 시작

```tsx
import { EnterpriseChartPanel } from '@topgrid/grid-pro-chart-enterprise';
import { setLicenseKey } from '@topgrid/grid-license';

setLicenseKey(MY_KEY);  // 앱 entry 1회 (미설정 시 watermark)

<EnterpriseChartPanel
  data={data}                         // seriesFromMatrix/seriesFromPivot 결과
  initialType="bar"
  toolbarTypes={['bar', 'line', 'radar', 'heatmap']}   // 17 중 선택 노출
  enableExport
  onCrossFilter={(sel) => applyGridFilter(sel.name)}   // 차트 클릭 → 그리드 필터
/>
```

## 4. Vue 3 빠른 시작

```ts
import { EnterpriseChartPanel, setLicenseKey } from '@topgrid/grid-pro-chart-enterprise-vue';
setLicenseKey(MY_KEY);
// <EnterpriseChartPanel :data="data" initial-type="bar"
//   :toolbar-types="['bar','radar','heatmap']" @cross-filter="onSelect" />
```

- License 워터마크 **자동 게이트**(React 와 동등) — `@topgrid/grid-license-core` 경유, **React 의존 0**.
- 실브라우저 검증·Nuxt SSR 주의사항: `vue-chart-consumer-notes.md`.
- 서버 정적 SVG: `renderChartToSvgString(option, { width, height })` (SSR, DOM 불필요).

## 5. 셀 / 경량 차트 (zero-dep)

```tsx
import { SparklineCell, RangeChart } from '@topgrid/grid-pro-chart';
<SparklineCell type="line" values={[3, 8, 4, 9, 6]} />      // 셀 안 스파크라인
<RangeChart type="bar" series={series} categories={months} />  // 경량 SVG 차트
```

## 6. Bring-your-own (Highcharts / AG Charts)

ECharts 를 쓰지 않고 본인이 라이선스한 라이브러리를 주입할 수 있다 — `RangeChartPanel.renderChart`
시임은 라이브러리 무관. 상세·예제: `byo-chart-adapter.md`.

## 7. 라이선스

차트 패키지는 모두 Pro(상용). ECharts 자체는 Apache-2.0 라 번들/재배포에 의무가 없다. Highcharts·
AG Charts Enterprise 는 **소비자 본인 라이선스**로 BYO 한다(우리가 번들하지 않음).
