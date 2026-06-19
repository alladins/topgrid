# Vue chart — consumer stability notes (for PTLPSM / Nuxt3 integrators)

> Audience: the team integrating `@topgrid/grid-pro-chart-enterprise-vue` (e.g. PTLPSM, Nuxt3/Vue3).
> Integration is owned by that team; this page states **what we have stabilized vs. what we have NOT**,
> so you know where to expect rough edges and where to report issues back.

## Published (npm live)
- `@topgrid/grid-chart-core@0.1.0` — framework-neutral engine (`matrixToEChartsOption`, 17 chart types).
- `@topgrid/grid-license-core@0.1.0` — neutral license state/checks (no React).
- `@topgrid/grid-pro-chart-enterprise-vue@0.3.0` — Vue render shell (`EChartsChart`, `EnterpriseChartPanel`).

Install: `pnpm add @topgrid/grid-pro-chart-enterprise-vue echarts vue` (echarts 5.x or 6.x; single shared instance).

## ✅ Stabilized (verified)
- **Option engine** — `matrixToEChartsOption` covers all 17 types; proven by node tests (shape-asserted, non-vacuous).
- **Client-side mount + reactivity** — `EnterpriseChartPanel` mounts an inline `<svg>`, toolbar type-switch reaches the ECharts instance, export produces an SVG data URL, license auto-gate (unlicensed→watermark, valid→none). Proven by **happy-dom live mount** (node 12).
- **Zero React** — confirmed at install level (`pnpm why react` empty); license auto-gate works without React.
- **Single ECharts instance** — echarts is a peer dep; deduped across the tree.

## ⚠️ NOT yet stabilized — expect rough edges / report back
1. **Real-browser E2E is unverified for Vue.** Our Vue verification is happy-dom (Node), NOT a real
   browser. The React package has a chromium suite; the Vue package does not yet. **First thing to validate
   in PTLPSM: that charts render + interact in an actual browser.**
2. **Nuxt SSR / hydration is unwired.** `EChartsChart` initialises ECharts in `onMounted` (client only).
   Under Nuxt SSR the chart renders **nothing server-side** and appears on client hydration. ECharts'
   `renderToSVGString` SSR path is NOT integrated. If you need server-rendered charts (SEO, no-JS), that is
   an open item — tell us and we'll prioritise an SSR entry.
3. **Export = SVG only.** `EnterpriseChartPanel`'s Export button calls `getDataURL({type:'svg'})`. PNG is
   possible via the same API but not surfaced; **PDF is not supported** (bring your own).
4. **Cross-filter is a callback, not wired to a grid.** `@cross-filter` emits the clicked datum; you map it
   to your grid's filter. No built-in grid↔chart binding on the Vue side.
5. **Toolbar shows 6 types by default.** Pass `:toolbar-types="[...]"` to surface any of the 17.
6. **License key registration.** Call `setLicenseKey(key)` (re-exported from the Vue package) once at app
   entry, or the panel shows the Pro watermark.

## How to report
Issues with the above (especially #1 real-browser and #2 SSR) → file against the topgrid chart packages so
we can fold real-browser/SSR coverage into the published packages. Integration code itself stays in PTLPSM.
