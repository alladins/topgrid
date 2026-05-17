// @tomis/grid-renderers — public API
// MOD-GRID-05 / G-001: TextCell + NumberCell + DateCell + formatters.
// MOD-GRID-05 / G-002: StatusBadgeCell + LinkCell + ButtonCell + CheckCell + IconCell
//                      + TagCell + AvatarCell + ProgressCell.
// MOD-GRID-05 / G-003: EditableCell + rendererRegistry + CellClassNameCallback type.
// Spec: D:/project/topvel_project/TOMIS/.claude/tw-grid/artifacts/MOD-GRID-05/renderer/G-003-spec.md

export { TextCell, type TextCellProps } from './TextCell.js';
export { NumberCell, type NumberCellProps } from './NumberCell.js';
export { DateCell, type DateCellProps } from './DateCell.js';
export {
  formatNumberString,
  formatDateTimeFromDateTimeString,
  type FormatNumberOptions,
  type FormatDateTimeOptions,
} from './formatters.js';

// G-002 — UI 8 cells
export { StatusBadgeCell, type StatusBadgeCellProps } from './StatusBadgeCell.js';
export { LinkCell, type LinkCellProps } from './LinkCell.js';
export { ButtonCell, type ButtonCellProps } from './ButtonCell.js';
export { CheckCell, type CheckCellProps } from './CheckCell.js';
export { IconCell, type IconCellProps } from './IconCell.js';
export { TagCell, type TagCellProps } from './TagCell.js';
export { AvatarCell, type AvatarCellProps } from './AvatarCell.js';
export { ProgressCell, type ProgressCellProps } from './ProgressCell.js';

// G-003 — EditableCell + renderer registry
export {
  EditableCell,
  type EditableCellProps,
  type EditType,
  type CellClassNameCallback,
} from './EditableCell.js';
export {
  defaultRendererRegistry,
  registerRenderer,
  getRenderer,
  type CellComponent,
  type CellComponentProps,
} from './rendererRegistry.js';

// ADR-MOD-GRID-REFACTOR-2026-05-17-002: cross-package wiring side-effect.
// Auto-registers 6 cell adapters into @tomis/grid-core's defaultRendererRegistry
// so `createColumns({ type: 'number' | ... })` dispatches to real cell components.
// MUST be evaluated at import time — see package.json `sideEffects`.
import { wireDefaultRenderers } from './wireRegistry.js';
wireDefaultRenderers();
