# Vue chart — consumer stability notes (for PTLPSM / Nuxt3 integrators)

> Audience: the team integrating `@topgrid/grid-pro-chart-enterprise-vue` (e.g. PTLPSM, Nuxt3/Vue3).
> Integration is owned by that team; this page states **what we have stabilized vs. what we have NOT**,
> so you know where to expect rough edges and where to report issues back.

## Published (npm live)
- `@topgrid/grid-chart-core@0.1.0` — framework-neutral engine (`matrixToEChartsOption`, 17 chart types).
- `@topgrid/grid-license-core@0.1.0` — neutral license state/checks (no React).
- `@topgrid/grid-pro-chart-enterprise-vue@0.4.0` — Vue render shell (`EChartsChart`, `EnterpriseChartPanel`) + SSR helper (`renderChartToSvgString`).

Install: `pnpm add @topgrid/grid-pro-chart-enterprise-vue echarts vue` (echarts 5.x or 6.x; single shared instance).

## ✅ Stabilized (verified)
- **Option engine** — `matrixToEChartsOption` covers all 17 types; proven by node tests (shape-asserted, non-vacuous).
- **Client-side mount + reactivity** — `EnterpriseChartPanel` mounts an inline `<svg>`, toolbar type-switch reaches the ECharts instance, export produces an SVG data URL, license auto-gate (unlicensed→watermark, valid→none). Proven by **happy-dom live mount** (node 12).
- **Real-browser (chromium) E2E** — render with real layout (`width:'100%'`→real clientWidth), real-pixel type-switch, export, and **cross-filter on a real bar click** (real hit-testing). Proven by `e2e/vue-chart.e2e.spec.ts` (chromium 4). Run: `pnpm --filter @topgrid/grid-pro-chart-enterprise-vue build && pnpm --filter @topgrid/grid-pro-chart-enterprise-vue build:e2e && pnpm --filter @topgrid/grid-pro-chart-enterprise-vue exec playwright test --config e2e/playwright.config.ts`.
- **Zero React** — confirmed at install level (`pnpm why react` empty); license auto-gate works without React.
- **Single ECharts instance** — echarts is a peer dep; deduped across the tree.

## ⚠️ NOT yet stabilized — expect rough edges / report back
1. ~~Real-browser E2E is unverified for Vue.~~ **RESOLVED (2026-06-19)** — `e2e/vue-chart.e2e.spec.ts`
   runs the Vue panel in real chromium (render/layout/type-switch/export/cross-filter, 4 green). The
   remaining browser-shaped unknown is Nuxt SSR (next item).
2. **Nuxt SSR — PARTIAL (2026-06-19).** Two facts:
   - ✅ **`EnterpriseChartPanel` is SSR-safe** — `renderToString` emits the container + toolbar without a
     DOM and without throwing (verified, `src/ssr.test.ts`). Under Nuxt the panel renders client-side after
     hydration. So you can use it directly (no `<ClientOnly>` needed to avoid crashes).
   - ✅ **Server static SVG helper** — `renderChartToSvgString(option, { width, height })` renders a chart to
     an SVG string headless (ECharts SSR mode, no DOM; verified). Use it to emit a server-rendered static
     chart (SEO / first paint), then let the interactive panel take over on the client.
   - ⚠️ **What we did NOT ship: in-place SSR→hydrate of the *same* node.** ECharts names its SVG classes
     `zr{instanceId}-cls-{n}`, where `instanceId` is a module-global counter bumped on every `echarts.init()`.
     So two renders of the *identical* option are never byte-identical (proven: `src/ssr.test.ts` §3) — the
     server SVG (`zr0…`) cannot match a client init's SVG (`zrN…`), which trips Vue hydration. We therefore did
     not auto-hydrate a server SVG into the live panel. Pick one of the patterns below.

### Nuxt patterns
- **Interactive (simplest):** render `<EnterpriseChartPanel .../>`. It is SSR-safe; the chart appears on
  client hydration. No server chart pixels (fine for in-app dashboards).
- **Server static + client interactive:** server-render `renderChartToSvgString(...)` into a placeholder for
  first paint/SEO; mount `<EnterpriseChartPanel>` (or swap on `onMounted`) for interactivity. You control the
  swap, avoiding the id-mismatch hydration trap.
3. **Export = SVG only.** `EnterpriseChartPanel`'s Export button calls `getDataURL({type:'svg'})`. PNG is
   possible via the same API but not surfaced; **PDF is not supported** (bring your own).
4. **Cross-filter is a callback, not wired to a grid.** `@cross-filter` emits the clicked datum; you map it
   to your grid's filter. No built-in grid↔chart binding on the Vue side.
5. **Toolbar shows 6 types by default.** Pass `:toolbar-types="[...]"` to surface any of the 17.
6. **License key registration.** Call `setLicenseKey(key)` (re-exported from the Vue package) once at app
   entry, or the panel shows the Pro watermark.

## How to report
Issues with the above → file against the topgrid chart packages. If in-place SSR→hydrate of the live panel
(static server chart that hydrates to interactive on the *same* node) turns out to matter for PTLPSM, tell us
— that is the one piece we deliberately deferred. Integration code itself stays in PTLPSM.
