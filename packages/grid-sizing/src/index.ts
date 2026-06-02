// @topgrid/grid-sizing — public API (MOD-GRID-20, MIT).
//
// Declarative, headless column-sizing helpers. The width-math is PURE (no DOM);
// browser text measurement is injected via `MeasureText` and provided by the
// SSR-guarded `createCanvasMeasureText()` factory. Results are `Record<id, px>`
// maps consistent with TanStack's `ColumnSizingState`, fed into grid-core's
// `columnSizing` declaratively (no imperative `<th>.style.width`).
//
// This is an MIT module: no license gate, no usage marks, no end-user agreement.

// G-1: width spec parsing + star (flex) distribution.
export { parseColumnWidth, distributeStarWidths } from './starWidth';
export type {
  ColumnWidthSpec,
  StarColumnInput,
  DistributeStarWidthsOptions,
} from './starWidth';

// G-2: sizeToFit (container-fit proportional scaling).
export { sizeToFit } from './sizeToFit';
export type { SizeToFitColumnInput, SizeToFitOptions } from './sizeToFit';

// G-3: content-fit auto-size (injected measurement).
export {
  autoSizeColumn,
  autoSizeColumns,
  DEFAULT_AUTOSIZE_PADDING,
} from './autoSize';
export type {
  MeasureText,
  AutoSizeColumnOptions,
  AutoSizeColumnInput,
  AutoSizeColumnsOptions,
} from './autoSize';

// G-3: browser canvas measurer (SSR-guarded host capability).
export { createCanvasMeasureText, approxCharPx } from './canvasMeasure';
