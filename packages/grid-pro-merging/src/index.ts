import { checkLicense } from '@topgrid/grid-license';

checkLicense();

// @topgrid/grid-pro-merging — MOD-GRID-13/G-001
// Pro: Cell Merging (rowSpan) — column.mergeRows API + automatic rowSpan calculation
// MOD-GRID-52: Column spanning (body cell colSpan) — column.meta.colSpan callback
export { computeMergeSpans } from './computeMergeSpans';
export { computeColSpans } from './computeColSpans';
export { MergingGrid } from './MergingGrid';
export type {
  MergeRowsConfig,
  ColSpanFn,
  MergingColumnDef,
  MergeSpanMap,
  ColSpanMap,
  MergingGridProps,
} from './types';
