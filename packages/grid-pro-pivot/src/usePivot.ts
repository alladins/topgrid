/**
 * @topgrid/grid-pro-pivot — headless pivot hook
 * MOD-GRID-18 / G-1
 *
 * Thin `useMemo` wrapper over the pure {@link computePivot} transform — all logic
 * lives in the React-free module so it tree-shakes and unit-tests independently.
 */

import { useMemo } from 'react';
import { computePivot } from './computePivot';
import type { PivotConfig, PivotModel } from './types';

/**
 * Compute a memoised {@link PivotModel} from flat data + a pivot config.
 *
 * @typeParam TData - Source row shape.
 * @param data - Flat source rows.
 * @param config - Row/column dimensions + value (measure) definitions.
 * @returns A memoised pivot model (recomputed when `data` or `config` change).
 *
 * @example
 * const model = usePivot(rows, {
 *   rows: ['region'],
 *   columns: ['quarter'],
 *   values: [{ field: 'sales', aggregationFn: 'sum' }],
 * });
 */
export function usePivot<TData extends Record<string, unknown>>(
  data: TData[],
  config: PivotConfig,
): PivotModel {
  return useMemo(() => computePivot(data, config), [data, config]);
}
