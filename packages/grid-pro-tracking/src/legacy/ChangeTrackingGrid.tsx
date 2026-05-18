// @topgrid/grid-pro-tracking — ChangeTrackingGrid alias (MOD-GRID-10/G-005).
//
// Spec: artifacts/MOD-GRID-10/tracking/G-005-spec.md Sections 2.2, 7 (#3), 11.3 Step 3
// AC mapping: AC-003 (alias signature) / AC-007 (virtualization compat — delegates to <Grid>)
//
// Design (D7 + C-29):
// - Composes `useChangeTracking` + `<Grid>` from `@topgrid/grid-core` (peer — D9).
// - Optional fields (`mapping`, `validator`, `optimistic`, `editedCells`) use the
//   C-29 conditional-spread pattern for `exactOptionalPropertyTypes` strictness.
// - `onSave` is intentionally NOT auto-invoked — alias does not own a commit
//   policy (the consumer decides via `useChangeTracking().commitChanges`).
// - Pro tier — re-exported through `src/index.ts`.

import { forwardRef, useImperativeHandle, useMemo } from 'react';
import type { ReactElement, Ref } from 'react';
import { Grid, type GridHandle, type GridProps } from '@topgrid/grid-core';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';
import { useChangeTracking } from '../useChangeTracking';
import type {
  ChangeSet,
  ChangeTrackingAPI,
  ChangeTrackingConfig,
  Mapping,
  Validator,
} from '../types';

/**
 * Props for the ChangeTrackingGrid alias.
 *
 * Inherits all `<Grid>` props except `data` (the alias overrides `data` so
 * `<Grid>` receives `tracking.rows` rather than the caller's source array —
 * this is what binds added/edited/deleted overlays to the rendered grid).
 *
 * @template TData Row data type.
 */
export interface ChangeTrackingGridProps<TData>
  extends Omit<GridProps<TData>, 'data'> {
  /** Initial dataset (forwarded to `useChangeTracking`). */
  data: TData[];
  /** PK extractor for change tracking. */
  rowKey: keyof TData | ((row: TData) => string);
  /** Screen-to-BE mapping (optional). */
  mapping?: Mapping<TData>;
  /** Row validator (optional). */
  validator?: Validator<TData>;
  /** Optimistic update — auto-rollback on commit failure. */
  optimistic?: boolean;
  /** Toggle cell-level edit tracking. */
  editedCells?: boolean;
  /**
   * Convenience callback — invoked with the latest ChangeSet on user demand
   * by the consumer (the alias does NOT auto-call `commitChanges`; that is
   * the caller's responsibility to keep the alias's network policy explicit).
   * Forwarded out via the imperative ref handle's `getChangeSet()`.
   */
  onSave?: (cs: ChangeSet) => void | Promise<void>;
}

function ChangeTrackingGridInner<TData>(
  props: ChangeTrackingGridProps<TData>,
  ref: Ref<GridHandle<TData> & ChangeTrackingAPI<TData>>,
): ReactElement {
  // ADR-MOD-GRID-REFACTOR-2026-05-17-001 — license watermark wiring
  const _lic = useLicenseStatus();

  const {
    data,
    rowKey,
    mapping,
    validator,
    optimistic,
    editedCells,
    // `onSave` is documented but not auto-invoked at this layer (alias does
    // not own a commit policy — D7). We strip it from `rest` so it does not
    // forward to `<Grid>` as an unknown attribute. The `void` reference
    // satisfies `noUnusedLocals` for this intentional drop.
    onSave,
    ...rest
  } = props;
  void onSave;

  // C-29 — conditional spread for exactOptionalPropertyTypes strictness.
  // ChangeTrackingConfig has required `data` + `rowKey` and 4 optional fields
  // (mapping, validator, optimistic, editedCells). onSnapshotInit is NOT
  // exposed at the alias surface (spec D7 — keeps the alias surface minimal).
  const cfg: ChangeTrackingConfig<TData> = useMemo(() => {
    const base: ChangeTrackingConfig<TData> = { data, rowKey };
    return {
      ...base,
      ...(mapping !== undefined ? { mapping } : {}),
      ...(validator !== undefined ? { validator } : {}),
      ...(optimistic !== undefined ? { optimistic } : {}),
      ...(editedCells !== undefined ? { editedCells } : {}),
    };
  }, [data, rowKey, mapping, validator, optimistic, editedCells]);

  const tracking = useChangeTracking<TData>(cfg);

  // Combine GridHandle (from <Grid>) and ChangeTrackingAPI into a single
  // imperative handle. The GridHandle portion is fed by <Grid>'s own ref;
  // we proxy via a private ref local to this component.
  // To preserve the simplest interop, expose ChangeTrackingAPI plus pass
  // through GridHandle methods on demand.
  useImperativeHandle(
    ref,
    () => {
      // GridHandle methods that callers commonly use (addRow/deleteRow/
      // updateRow) are overridden to dispatch through `tracking.*` — this
      // ensures the alias's ref behaves as a single source of truth for
      // change tracking even when consumers reach for the GridHandle surface.
      const handle: GridHandle<TData> & ChangeTrackingAPI<TData> = {
        // ChangeTrackingAPI surface.
        rows: tracking.rows,
        added: tracking.added,
        edited: tracking.edited,
        deleted: tracking.deleted,
        addRow: (seed?: Partial<TData>): string =>
          tracking.addRow((seed ?? {}) as Partial<TData>),
        updateRow: (key: string | number, patch: Partial<TData>): void => {
          tracking.updateRow(String(key), patch);
        },
        deleteRow: (key: string | number): void => {
          tracking.deleteRow(String(key));
        },
        undoRow: tracking.undoRow,
        hasChanges: tracking.hasChanges,
        getChangeSet: tracking.getChangeSet,
        resetChanges: tracking.resetChanges,
        commitChanges: tracking.commitChanges,
        editedCellsMap: tracking.editedCellsMap,
        // GridHandle-only members (scrollTo / getSelection / clearSelection /
        // refresh) — alias-level no-ops with dev console.warn (consumers
        // wanting full GridHandle should compose hook + <Grid> directly).
        scrollTo: (): void => {
          if (typeof globalThis !== 'undefined') {
            console.warn(
              '[ChangeTrackingGrid] scrollTo: pass a ref to <Grid> directly for virtualized scrolling.',
            );
          }
        },
        getSelection: (): TData[] => [],
        clearSelection: (): void => {
          /* see scrollTo note above */
        },
        refresh: (): void => {
          /* see scrollTo note above */
        },
      };
      return handle;
    },
    [tracking],
  );

  // ADR-001: wrapper `<div className="relative">` 도입 — sub-spec D-1 (사용자 §9.2=a, §9.3=b)
  return (
    <div className="relative">
      <Grid<TData> data={tracking.rows as TData[]} {...rest} />
      {_lic.watermarkRequired && <Watermark required />}
    </div>
  );
}

const ChangeTrackingGrid = forwardRef(ChangeTrackingGridInner) as <TData>(
  props: ChangeTrackingGridProps<TData> & {
    ref?: Ref<GridHandle<TData> & ChangeTrackingAPI<TData>>;
  },
) => ReactElement;

export default ChangeTrackingGrid;
export { ChangeTrackingGrid };
