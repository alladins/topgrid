// @topgrid/grid-pro-edit-plus — public API
// MOD-GRID-23 / G-1: declarative validation rule engine + Pro scaffold.
//
// REUSE ([[LESS-003]] live-overlap): the validation *mechanism* (commit-blocking +
// error collection) already lives in `@topgrid/grid-pro-tracking` (`Validator` contract,
// applied during getChangeSet/commitChanges). This package adds only the declarative
// rule -> contract compilers:
//   - buildValidator        -> grid-pro-tracking `Validator<TData>` (commit-blocking reused)
//   - buildValidationCellClass -> grid-core `CellClassNameCallback<TData>` (visual marking;
//     same shape as MOD-GRID-24 `buildCellClassName`).
// No external/optional peer is imported (C-001 / AP-001 vacuous — grid-license is a required
// runtime dep for the Pro gate; tracking/grid-core are type-only peers).
import { checkLicense } from '@topgrid/grid-license';

// PAT-003 — module-load license gate (side effect; first Pro module since MOD-GRID-21).
checkLicense();

export {
  buildValidator,
  buildValidationCellClass,
} from './validation/buildValidation.js';
export type { ValidationRule } from './validation/types.js';

// MOD-GRID-23 / G-2: undo/redo — generic command stack + faithful tracking bindings.
// REUSE-GATE returned NO SEAM (tracking exposes no operation history/redo/state restore,
// see LESS-005) -> minimal self-contained command stack on top of tracking's public mutators,
// NOT a tracking modification.
export { useUndoRedo } from './undo-redo/useUndoRedo.js';
export {
  makeUpdateCommand,
  makeAddCommand,
} from './undo-redo/bindings.js';
export type {
  UndoRedoCommand,
  UndoRedoAPI,
  CommandStackState,
} from './undo-redo/types.js';
