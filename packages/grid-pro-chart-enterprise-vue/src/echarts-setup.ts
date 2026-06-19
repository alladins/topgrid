// Shared ECharts module registration — used by the Vue render shell (EChartsChart) AND the SSR
// helper (ssr.ts), so the selective `use([...])` list lives in exactly one place (ADR-003 D3).
import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
  ScatterChart,
  PieChart,
  FunnelChart,
  TreemapChart,
  RadarChart,
  HeatmapChart,
  CandlestickChart,
  BoxplotChart,
  SankeyChart,
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  RadarComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  ScatterChart,
  PieChart,
  FunnelChart,
  TreemapChart,
  RadarChart,
  HeatmapChart,
  CandlestickChart,
  BoxplotChart,
  SankeyChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  RadarComponent,
  SVGRenderer,
]);

export { echarts };
export type EChartsInstance = ReturnType<typeof echarts.init>;
