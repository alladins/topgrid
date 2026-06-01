# @topgrid/grid-pro-chart

Pro: Sparkline cells (zero-dependency SVG) + injectable Range Chart panel.

In-cell sparklines (line / bar / area / win-loss) drawn as pure SVG — no chart
library required — plus a `RangeChartPanel` that renders a chart you supply via
an injected `renderChart` callback, so the package stays chart-library-agnostic.

## Installation

```bash
pnpm add @topgrid/grid-pro-chart
# or
npm install @topgrid/grid-pro-chart
```

## License Activation

> **This is a Pro package requiring a valid license key.**

```tsx
import { setLicenseKey } from '@topgrid/grid-license';

// Call once at your app entry point (e.g., main.tsx)
setLicenseKey('YOUR-LICENSE-KEY');
```

Without a valid license, `RangeChartPanel` renders a watermark.
Contact [sales@platree.com](mailto:sales@platree.com) to obtain a license key.

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@tanstack/react-table` | `^8.0.0` |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |

> No charting library is a peer dependency. Sparklines are pure SVG, and the
> range chart renderer is injected by the consumer.

## Usage

### Sparkline cell

```tsx
import { SparklineCell } from '@topgrid/grid-pro-chart';

<SparklineCell values={[3, 1, 4, 1, 5, 9, 2, 6]} type="line" />
<SparklineCell values={[3, 1, 4, 1, 5, 9, 2, 6]} type="bar" color="#2563eb" />
<SparklineCell values={[3, 1, 4, 1, 5, 9, 2, 6]} type="area" />
<SparklineCell values={[1, -1, 2, -3, 0, 4]} type="win-loss" />
```

Empty arrays render a dash placeholder; non-finite values (`NaN`/`Infinity`)
are skipped.

### Range chart panel (injected renderer)

```tsx
import { RangeChartPanel } from '@topgrid/grid-pro-chart';
// Bring your own charting library — it is never imported by this package.

<RangeChartPanel
  title="Selection"
  series={[{ name: 'Q1', data: [10, 20, 15, 30] }]}
  renderChart={(series) => <MyChart series={series} />}
/>
```

When `renderChart` is omitted, the panel shows a graceful placeholder instead of
throwing.

## Main API

| Export | Description |
|--------|-------------|
| `SparklineCell` | Zero-dep SVG sparkline (line/bar/area/win-loss) |
| `RangeChartPanel` | Panel that renders an injected `renderChart(series)` |
| `SparklineCellProps` | Props type |
| `SparklineType` | `'line' \| 'bar' \| 'area' \| 'win-loss'` |
| `RangeChartPanelProps` | Props type |
| `RangeSeries` | `{ name?: string; data: number[] }` |

## License

SEE LICENSE IN [EULA.md](./EULA.md)

License terms subject to change. Contact [sales@platree.com](mailto:sales@platree.com) for current EULA.

---

[Documentation](https://topgrid.platree.com) | [Pricing](https://topgrid.platree.com/pricing)
