// W3 DX — turn silent footguns into discoverable dev-mode warnings. Pure (node-testable); Grid.tsx
// calls these behind a `NODE_ENV !== 'production'` guard so production bundles pay nothing.

/** Narrow structural view of the GridProps fields that depend on stable row identity. */
export interface RowIdWarningInput {
  getRowId?: unknown;
  /** RowSelectionMode ('single'|'multi'|'none') or a GridRowSelectionOptions object. */
  rowSelection?: unknown;
  enableRowReorder?: boolean;
  enableRowPinning?: boolean;
  enableCellChangeFlash?: boolean;
}

/**
 * The #1 grid footgun: without `getRowId`, row identity defaults to the array index, so selection /
 * row-reorder / cell-flash silently track the WRONG rows after a sort or filter reorders the data.
 *
 * Returns true when an identity-dependent feature is enabled but `getRowId` is absent → caller warns.
 * Pure: no side effects, no React.
 */
export function shouldWarnMissingRowId(p: RowIdWarningInput): boolean {
  if (p.getRowId) return false;
  const selectionActive = p.rowSelection != null && p.rowSelection !== 'none';
  return Boolean(
    selectionActive || p.enableRowReorder === true || p.enableRowPinning === true || p.enableCellChangeFlash === true,
  );
}

/** The warning message for {@link shouldWarnMissingRowId}. */
export const MISSING_ROW_ID_WARNING =
  '[topgrid/grid-core] getRowId not provided — row identity defaults to the array index, so ' +
  'selection / row-reorder / cell-flash will track the WRONG rows after a sort or filter. ' +
  'Pass getRowId={(row) => row.<stableKey>} for stable identity.';
