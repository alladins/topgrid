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

/** Footgun F-B: row virtualization + row pinning are not supported together (pinned rows misbehave). */
export interface VirtualizationPinningInput {
  enableVirtualization?: boolean;
  enableRowPinning?: boolean;
}
export function shouldWarnVirtualizationRowPinning(p: VirtualizationPinningInput): boolean {
  return p.enableVirtualization === true && p.enableRowPinning === true;
}
export const VIRTUALIZATION_ROW_PINNING_WARNING =
  '[topgrid/grid-core] enableVirtualization + enableRowPinning are not supported together — ' +
  'pinned rows may not render or scroll correctly. Use one or the other.';

/** Collect every Grid-level dev warning that applies to these props (caller console.warn's each). */
export function collectGridDevWarnings(
  props: RowIdWarningInput & VirtualizationPinningInput,
): string[] {
  const out: string[] = [];
  if (shouldWarnMissingRowId(props)) out.push(MISSING_ROW_ID_WARNING);
  if (shouldWarnVirtualizationRowPinning(props)) out.push(VIRTUALIZATION_ROW_PINNING_WARNING);
  return out;
}

/**
 * Footgun F-E: `TopgridColumnDef.visibility: false` is silently ignored by `createColumns` (TanStack
 * ColumnDef has no visibility concept). Returns the column ids that set it, so the caller can warn
 * that they must use `<Grid initialState={{ columnVisibility: { id: false } }} />` instead.
 */
export function visibilityNoOpColumnIds(
  defs: ReadonlyArray<{ id?: string; visibility?: boolean }>,
): string[] {
  return defs.filter((d) => d.visibility === false && d.id != null).map((d) => d.id as string);
}
export const visibilityNoOpWarning = (id: string): string =>
  `[createColumns] column "${id}": visibility:false has no effect here (TanStack ColumnDef has no ` +
  `visibility). Set <Grid initialState={{ columnVisibility: { ${id}: false } }} /> instead.`;
