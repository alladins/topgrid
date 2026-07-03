---
title: "Per-package API Reference"
sidebar_label: "Overview"
sidebar_position: 0
---

# Per-package API Reference (auto-generated)

> The **full per-package API** auto-generated from the TSDoc comments in the source code. For a curated getting-started summary, see the [API Reference](../api-reference).

| Package | Description |
|---|---|
| [`@topgrid/grid`](./grid) | Meta package — aggregates all @topgrid/grid-* packages (MIT + Pro facade) |
| [`@topgrid/grid-core`](./grid-core) | TanStack Table abstraction wrapper + useGridState core hook |
| [`@topgrid/grid-core-headless`](./grid-core-headless) | Framework-agnostic grid core (table-core based). Shared by the React/Vue adapters. W1 Phase 0. |
| [`@topgrid/grid-renderers`](./grid-renderers) | Cell renderers: Button, Badge, Check, Link, Number, Date, Icon |
| [`@topgrid/grid-features`](./grid-features) | Column reorder, multi-sort, filter UI features |
| [`@topgrid/grid-sizing`](./grid-sizing) | Declarative column sizing: auto-size, star/flex ratio widths, sizeToFit (pure + injectable measurement) |
| [`@topgrid/grid-export`](./grid-export) | Excel, PDF, CSV export for grid data |
| [`@topgrid/grid-vue`](./grid-vue) | Vue 3 adapter (skeleton) — consumes the @topgrid/grid-core-headless shared core via @tanstack/vue-table. W1 Phase 0. Zero React dependency. |
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
