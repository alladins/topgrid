# @topgrid/grid-sizing

Declarative, headless column-sizing helpers for TopGrid: content-fit **auto-size**,
**star/flex ratio** widths (`'*'` / `'2*'`), and container-fit **sizeToFit**.

The width math is **pure** (no DOM). Browser text measurement is **injected** via a
`MeasureText` function so the sizing logic stays testable in node/SSR. A SSR-guarded
`createCanvasMeasureText()` factory provides the browser canvas measurer. All helpers
return a `Record<columnId, px>` map that flows into grid-core's `columnSizing`
(TanStack `ColumnSizingState`) declaratively — no imperative `<th>.style.width`.

## Installation

```bash
pnpm add @topgrid/grid-sizing
# or
npm install @topgrid/grid-sizing
# or
yarn add @topgrid/grid-sizing
```

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@topgrid/grid-core` | `workspace:*` |
| `@tanstack/react-table` | `>=8.0.0 <9.0.0` |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |

This package has **no runtime dependencies** of its own.

## Usage

### Star / flex ratio widths

```ts
import { distributeStarWidths } from '@topgrid/grid-sizing';

// Container 600px, one 200px fixed column, then 1* and 2* star columns.
const widths = distributeStarWidths({
  totalWidth: 600,
  columns: [
    { id: 'a', spec: 200 },   // fixed
    { id: 'b', spec: '1*' },  // → 133.33 (of the remaining 400)
    { id: 'c', spec: '2*' },  // → 266.67
  ],
});
// { a: 200, b: 133.33…, c: 266.67… }
```

When a star column declares a `min`, it is clamped iteratively: a clamped column
leaves the star pool and the remaining width is re-distributed among the rest.

### Container-fit

```ts
import { sizeToFit } from '@topgrid/grid-sizing';

const widths = sizeToFit({
  containerWidth: 800,
  columns: [
    { id: 'a', width: 100 },
    { id: 'b', width: 300 },
  ],
});
// integer px that sum exactly to 800
```

### Content-fit auto-size

```ts
import {
  autoSizeColumn,
  autoSizeColumns,
  createCanvasMeasureText,
} from '@topgrid/grid-sizing';

const measureText = createCanvasMeasureText(); // canvas in browser, estimator in SSR

const width = autoSizeColumn({
  columnId: 'name',
  header: 'Full Name',
  cellValues: ['Ada Lovelace', 'Alan Turing'],
  measureText,
  padding: 16,
  min: 80,
  max: 320,
});
```

For testing, inject any pure measurer — e.g. `(t) => t.length * 8` — to verify the
math without a browser.

## API

| Export | Description |
|--------|-------------|
| `parseColumnWidth` | Parse `'*'` / `'2*'` / `120` / `'120px'` into a star/fixed spec |
| `distributeStarWidths` | Split remaining width across star columns by factor (iterative min-clamp) |
| `sizeToFit` | Scale current widths so they sum exactly to the container width |
| `autoSizeColumn` | Content-fit width for one column (injected measurement) |
| `autoSizeColumns` | Content-fit width map for multiple columns |
| `createCanvasMeasureText` | Browser canvas `MeasureText` (SSR-guarded fallback, never throws) |
| `DEFAULT_AUTOSIZE_PADDING` | Default auto-size padding (px) |
| `approxCharPx` | Per-character width used by the SSR/node fallback estimator |

## License

MIT © Platree. Free and open source — no license activation required.

---

[Documentation](https://topgrid.platree.com) | [API Reference](https://topgrid.platree.com/api)
