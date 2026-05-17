import { checkLicense } from '@tomis/grid-license';

checkLicense();

// createColumnGroup helper (AC-001)
export { createColumnGroup } from './createColumnGroup';
export type { ColumnGroupConfig } from './types';

// MultiRowHeader component (AC-002, AC-003, AC-004)
export { MultiRowHeader } from './MultiRowHeader';
export type { MultiRowHeaderProps } from './types';

// GroupedHeaderGrid legacy alias (G-003, C-6 deprecation alias)
export { GroupedHeaderGrid } from './legacy/GroupedHeaderGrid';
export type { GroupedHeaderGridProps } from './legacy/GroupedHeaderGrid';
