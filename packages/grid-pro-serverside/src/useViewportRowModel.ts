/**
 * `useViewportRowModel` — thin viewport-row-model wiring (MOD-GRID-68).
 *
 * Connects a push-based {@link ViewportDatasource} to `<Grid enableVirtualization>` through the
 * React-free {@link createViewportRowModel} controller. The hook owns React state and feeds the
 * controller the row virtualizer's visible range (via `virtualizerOptions.onChange`); the
 * controller forwards it to `datasource.setViewportRange`, and the datasource pushes rows back
 * (including live in-place updates) which re-emit through `onChange` → setState.
 *
 * @remarks The `datasource` is captured **once** (controller created on first render) — same v1
 * note as {@link useServerSideData}. Memoize it / define it outside the component.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import {
  createViewportRowModel,
  materializeViewport,
  type ViewportDatasource,
  type ViewportRowModel,
} from './internal/viewportRowModel.js';
import type { RowPlaceholder } from './types.js';

export interface UseViewportRowModelOptions {
  /** Initial total row count (refined by the datasource's `setRowCount`). */
  rowCount: number;
}

/** Props to spread onto `<Grid>`. `data` may contain {@link RowPlaceholder} rows (detect via `isRowPlaceholder`). */
export interface ViewportGridProps<TData> {
  data: TData[];
  enableVirtualization: true;
  virtualizerOptions: {
    onChange: (
      instance: Virtualizer<HTMLDivElement, HTMLTableRowElement>,
      sync: boolean,
    ) => void;
  };
}

export interface UseViewportRowModelResult<TData> {
  /** Spread onto `<Grid columns={...} {...gridProps} virtualScrollHeight={...} />`. */
  gridProps: ViewportGridProps<TData>;
  /** Current known total row count (grows as the datasource pushes `setRowCount`). */
  totalCount: number;
}

export function useViewportRowModel<TData>(
  datasource: ViewportDatasource<TData>,
  options: UseViewportRowModelOptions,
): UseViewportRowModelResult<TData> {
  const [data, setData] = useState<Array<TData | RowPlaceholder>>(() =>
    materializeViewport<TData>(new Map(), options.rowCount),
  );
  const [totalCount, setTotalCount] = useState<number>(options.rowCount);

  const controllerRef = useRef<ViewportRowModel<TData> | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = createViewportRowModel<TData>(
      datasource,
      { rowCount: options.rowCount },
      (nextData, nextCount) => {
        setData(nextData);
        setTotalCount(nextCount);
      },
    );
  }
  const controller = controllerRef.current;

  // Tear down the datasource subscription on unmount.
  useEffect(() => () => controller.destroy(), [controller]);

  const onVirtualizerChange = useCallback(
    (instance: Virtualizer<HTMLDivElement, HTMLTableRowElement>): void => {
      const items = instance.getVirtualItems();
      if (items.length === 0) return;
      controller.setRange(items[0]!.index, items[items.length - 1]!.index);
    },
    [controller],
  );

  return {
    gridProps: {
      data: data as TData[],
      enableVirtualization: true,
      virtualizerOptions: { onChange: onVirtualizerChange },
    },
    totalCount,
  };
}
