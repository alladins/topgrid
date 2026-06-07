// @topgrid/grid-pro-panel — public API
// MOD-GRID-21 / G-1: StatusBar (the only net-new component).
// MOD-GRID-21 / G-2: ToolPanel (drives grid-core column visibility/order via callbacks).
// MOD-GRID-21 / G-3: RowGroupPanel (reuses agg GroupPanel — zero drag reimplementation).
// MOD-GRID-21 / G-4: Pro license gate + scaffold.
//
// REUSE: the grouping bar is the agg `GroupPanel`; this package adds no drag
// logic. ToolPanel is callback-only and never imports grid-core's deprecated
// `ColumnVisibilityMenu`. No chart library / react-virtual / optional peer is
// imported (C-001 / AP-001).
import { checkLicense } from '@topgrid/grid-license';

// PAT-003 — module-load license gate (side effect; same as grid-pro-chart).
checkLicense();

export { StatusBar, type StatusBarItem, type StatusBarProps } from './StatusBar.js';
// MOD-GRID-33 G-1: status-bar 내장 카운트(total/filtered/selected) — StatusBar items 합성.
export { statusBarCounts, type StatusBarCountLabels } from './statusBarCounts.js';
export { ToolPanel, type ToolPanelColumn, type ToolPanelProps } from './ToolPanel.js';
export { RowGroupPanel, type RowGroupPanelProps } from './RowGroupPanel.js';
// MOD-GRID-58: SideBar — unified tool-panel container (accordion).
export { SideBar, type SideBarPanelDef, type SideBarProps } from './SideBar.js';
