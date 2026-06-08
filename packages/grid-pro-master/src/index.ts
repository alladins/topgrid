import { checkLicense } from '@topgrid/grid-license';

checkLicense();

// G-001 (MOD-GRID-16): Master-Detail row expansion
export { MasterDetailGrid } from './MasterDetailGrid';
export type { MasterDetailGridProps, MasterDetailOptions, RenderDetailRow } from './types';

// G-002 (MOD-GRID-16): Right-click Context Menu
export { ContextMenuGrid } from './ContextMenuGrid';
export type { ContextMenuGridProps, ContextMenuItem } from './types';

// MOD-61 (redo): built-in menu items + pure clipboard-text helper
export { makeCopyCellItem, type MakeCopyCellItemOptions } from './internal/makeCopyCellItem';
export { cellValueToClipboardText } from './internal/clipboard';

// G-003 (MOD-GRID-16): Expanded persistence hook (Option B — independent, D17)
export { useExpandedPersistence } from './internal/useExpandedPersistence';
export type { UseExpandedPersistenceOptions } from './internal/useExpandedPersistence';

// G-003 (MOD-GRID-16): Row Pinning base type (F-16-06 P1 — types only, D20)
export type { RowPinningOptions } from './types';

// G-003 (MOD-GRID-16): TreeGrid / ColumnPinGrid C-6 alias re-export (G-005 산출물 재활용, D18)
// @topgrid/grid-core is a peerDependency (package.json). G-005 (MOD-GRID-01) implements
// these aliases with useDeprecationWarn — no new wrapper needed.
export { TreeGrid, type TreeGridProps } from '@topgrid/grid-core';
export { ColumnPinGrid, type ColumnPinGridProps } from '@topgrid/grid-core';
