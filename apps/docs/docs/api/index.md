---
title: "패키지별 API 레퍼런스"
sidebar_label: "개요"
sidebar_position: 0
---

# 패키지별 API 레퍼런스 (자동 생성)

> 소스 코드의 TSDoc 주석에서 자동 생성된 **패키지별 전체 API**입니다. 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 를 참고하세요.

| 패키지 | 설명 |
|---|---|
| [`@topgrid/grid`](./grid) | Meta package — aggregates all @topgrid/grid-* packages (MIT + Pro facade) |
| [`@topgrid/grid-core`](./grid-core) | TanStack Table abstraction wrapper + useGridState core hook |
| [`@topgrid/grid-core-headless`](./grid-core-headless) | Framework-agnostic grid core (table-core 기반). React/Vue 어댑터가 공유 소비. W1 Phase 0. |
| [`@topgrid/grid-renderers`](./grid-renderers) | Cell renderers: Button, Badge, Check, Link, Number, Date, Icon |
| [`@topgrid/grid-features`](./grid-features) | Column reorder, multi-sort, filter UI features |
| [`@topgrid/grid-sizing`](./grid-sizing) | Declarative column sizing: auto-size, star/flex ratio widths, sizeToFit (pure + injectable measurement) |
| [`@topgrid/grid-export`](./grid-export) | Excel, PDF, CSV export for grid data |
| [`@topgrid/grid-vue`](./grid-vue) | Vue 3 어댑터 (스켈레톤) — @topgrid/grid-core-headless 공유 코어를 @tanstack/vue-table 로 소비. W1 Phase 0. React 의존 0. |
| [`@topgrid/grid-chart-core`](./grid-chart-core) | Framework-neutral chart engine: labelled matrix → Apache ECharts option (no React/Vue; echarts type-only) |
| [`@topgrid/grid-license`](./grid-license) | Pro license validation runtime |
| [`@topgrid/grid-license-core`](./grid-license-core) | Framework-neutral license state + verification for TopGrid (no React/Vue). Source of the license singleton. |
| [`@topgrid/grid-pro-agg`](./grid-pro-agg) | Pro: Aggregation (group footer) |
| [`@topgrid/grid-pro-chart`](./grid-pro-chart) | Pro: Sparkline cells (zero-dep SVG) + injectable Range Chart panel |
| [`@topgrid/grid-pro-chart-enterprise`](./grid-pro-chart-enterprise) | Pro: Enterprise charting (Apache ECharts adapter) over the grid-pro-chart range/pivot bridge |
| [`@topgrid/grid-pro-chart-enterprise-vue`](./grid-pro-chart-enterprise-vue) | Pro: Enterprise charting for Vue 3 (Apache ECharts) — reuses the framework-neutral @topgrid/grid-chart-core engine |
| [`@topgrid/grid-pro-datamap`](./grid-pro-datamap) | Pro: DataMap (foreign key display) |
| [`@topgrid/grid-pro-edit-plus`](./grid-pro-edit-plus) | Pro: editing productivity — declarative validation rules , undo/redo, find&replace, cell comments |
| [`@topgrid/grid-pro-filter`](./grid-pro-filter) | Pro: Multi-condition (AND/OR) column filtering — compound FilterFn + 2-condition builder UI |
| [`@topgrid/grid-pro-header`](./grid-pro-header) | Pro: Multi-row Header (Column Groups) |
| [`@topgrid/grid-pro-master`](./grid-pro-master) | Pro: Master-Detail, TreeGrid, Context Menu |
| [`@topgrid/grid-pro-merging`](./grid-pro-merging) | Pro: Cell Merging (rowSpan) — column.mergeRows API + automatic rowSpan calculation |
| [`@topgrid/grid-pro-panel`](./grid-pro-panel) | Pro: declarative grid chrome — StatusBar, ToolPanel (column visibility/order), and a reused drag-grouping RowGroupPanel |
| [`@topgrid/grid-pro-pivot`](./grid-pro-pivot) | Pro: declarative 2-D pivot table (row × column dimensions × value aggregation) over &lt;Grid> |
| [`@topgrid/grid-pro-range`](./grid-pro-range) | Pro: Cell Range Selection, Drag-fill, Clipboard |
| [`@topgrid/grid-pro-serverside`](./grid-pro-serverside) | Pro: server-side row model (SSRM) — block-based lazy loading, infinite scroll, server sort/filter/group with stale-response (epoch) rejection |
| [`@topgrid/grid-pro-sheet`](./grid-pro-sheet) | Pro: spreadsheet mode (PoC) — formula engine (A1 refs, SUM/AVERAGE/…), dependency-graph recalc with cycle detection |
| [`@topgrid/grid-pro-tracking`](./grid-pro-tracking) | Pro: ChangeTracking, Mapping, Validator |

