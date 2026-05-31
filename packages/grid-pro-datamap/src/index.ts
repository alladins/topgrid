import { checkLicense } from '@topgrid/grid-license';

checkLicense();

// G-001: DataMap API public exports
export type { CreateDataMapOptions, DataMap, DataMapCellProps, DataMapEditorProps, PathOrAccessor, DataMapColumnDef } from './types';
// Deprecated alias — use DataMapColumnDef. Removed in next major (ADR-MOD-GRID-REFACTOR-2026-05-17-006, POL-COMPAT §3).
export type { TopgridColumnDef } from './types';
export { createDataMap } from './createDataMap';
// G-002: DataMapCell renderer
export { DataMapCell } from './DataMapCell';
// G-003: DataMapEditor 편집 셀 드롭다운
export { DataMapEditor } from './DataMapEditor';
// G-004: AsyncDataMap API public exports
export type {
  AsyncDataMap,
  AsyncDataMapState,
  CreateAsyncDataMapOptions,
} from './types';
export { createAsyncDataMap } from './createAsyncDataMap';
