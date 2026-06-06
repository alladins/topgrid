import { checkLicense } from '@topgrid/grid-license';

checkLicense();

/**
 * @topgrid/grid-pro-agg — public API
 * MOD-GRID-15 / G-001 (initial)
 * MOD-GRID-15 / G-002 (GroupRowProps, FooterRowProps type exports)
 * MOD-GRID-15 / G-003 (registry API exports)
 * MOD-GRID-15 / G-004 (GroupPanel + GroupPanelProps exports)
 *
 * D3: GroupRow and FooterRow components are INTERNAL — only their prop types are exported.
 * GroupPanel is PUBLIC — exported for use outside AggregationGrid (standalone grouping bar).
 */

export { AggregationGrid } from './AggregationGrid';
export { GroupPanel } from './GroupPanel';
export { resolveAggregationFn, registerAggregationFn, getAggregationFn, BUILT_IN_AGGREGATION_KEYS } from './aggregationFns';
export type { TanStackAggKey } from './aggregationFns';
// MOD-GRID-45: 전역 집계 행 계산(grand-total footer / auto-agg floating 공유, source 직접=avg-of-avgs 안전).
export { computeAggregateRow } from './computeAggregateRow';
export type { AggregateSpec } from './computeAggregateRow';
export type {
  AggregationFnKey,
  AggregationColumnMeta,
  AggregationColumnDef,
  AggregationGridProps,
  GroupRowProps,
  FooterRowProps,
  GroupPanelProps,
} from './types';
