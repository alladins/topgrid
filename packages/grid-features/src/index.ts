/**
 * @tomis/grid-features — Public API.
 *
 * G-001 (MOD-GRID-07): column drag-and-drop exports.
 * G-001 (MOD-GRID-08): multi-sort exports.
 * G-001 (MOD-GRID-09): filter-ui exports.
 */

// ADR-009 (옵션 A): column-drag exports moved to @tomis/grid-core.
// grid-features re-exports as deprecation alias (1 minor cycle).
/** @deprecated Moved to `@tomis/grid-core` (ADR-009). Will be removed in next major. */
export { useColumnDrag } from './column-drag/useColumnDrag';
/** @deprecated Moved to `@tomis/grid-core` (ADR-009). Will be removed in next major. */
export { DropIndicator } from './column-drag/DropIndicator';
/** @deprecated Moved to `@tomis/grid-core` (ADR-009). Will be removed in next major. */
export { useColumnOrderPersist } from './column-drag/useColumnOrderPersist';
export type {
  UseColumnDragProps,
  UseColumnDragReturn,
  DragThProps,
} from './column-drag/types';
export type { UseColumnOrderPersistProps } from './column-drag/useColumnOrderPersist';

// MOD-GRID-08: multi-sort
/** @deprecated Moved to `@tomis/grid-core` (ADR-010). Will be removed in next major. */
export { SortBadge } from './multi-sort/SortBadge';
export { useMultiSort } from './multi-sort/useMultiSort';
// ADR-009: SortClearButton + SortClearButtonProps moved to @tomis/grid-core.
// grid-features re-exports as deprecation alias (1 minor cycle).
export { SortClearButton } from './multi-sort/SortClearButton';
export type {
  UseMultiSortOptions,
  UseMultiSortResult,
} from './multi-sort/types';
/** @deprecated Moved to `@tomis/grid-core` (ADR-010). Will be removed in next major. */
export type { SortBadgeProps } from '@tomis/grid-core';
/** @deprecated Moved to `@tomis/grid-core` (ADR-009). Will be removed in next major. */
export type { SortClearButtonProps } from '@tomis/grid-core';

// MOD-GRID-09: filter-ui — TextFilter
export { TextFilter } from './filter-ui/TextFilter';
export { FilterPopover } from './filter-ui/FilterPopover';
export { FilterIndicator } from './filter-ui/FilterIndicator';
export { textFilterFn } from './filter-ui/filterFns';
export type {
  TextFilterOperator,
  TextFilterValue,
  TextFilterProps,
  FilterPopoverProps,
  FilterIndicatorProps,
} from './filter-ui/types';

// MOD-GRID-09: filter-ui — NumberFilter (G-002)
export { NumberFilter } from './filter-ui/NumberFilter';
export { numberFilterFn } from './filter-ui/filterFns';
export type {
  NumberFilterOperator,
  NumberFilterValue,
  NumberFilterProps,
} from './filter-ui/types';

// MOD-GRID-09: filter-ui — DateFilter (G-003)
export { DateFilter } from './filter-ui/DateFilter';
export { dateRangeFilterFn } from './filter-ui/filterFns';
export type {
  DateFilterValue,
  DateFilterProps,
} from './filter-ui/types';

// MOD-GRID-09: filter-ui — SelectFilter / GlobalSearchInput / FilterResetButton (G-004)
export { SelectFilter } from './filter-ui/SelectFilter';
export { GlobalSearchInput } from './filter-ui/GlobalSearchInput';
export { FilterResetButton } from './filter-ui/FilterResetButton';
export { selectFilterFn } from './filter-ui/filterFns';
export type {
  SelectFilterProps,
  GlobalSearchInputProps,
  FilterResetButtonProps,
} from './filter-ui/types';
