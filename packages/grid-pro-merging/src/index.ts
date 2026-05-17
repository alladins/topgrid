import { checkLicense } from '@tomis/grid-license';

checkLicense();

// @tomis/grid-pro-merging — MOD-GRID-13/G-001
// Pro: Cell Merging (rowSpan) — column.mergeRows API + automatic rowSpan calculation
export { computeMergeSpans } from './computeMergeSpans';
export { MergingGrid } from './MergingGrid';
export type {
  MergeRowsConfig,
  MergingColumnDef,
  MergeSpanMap,
  MergingGridProps,
} from './types';
