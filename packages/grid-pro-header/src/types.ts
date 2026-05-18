/**
 * @topgrid/grid-pro-header — public types barrel.
 *
 * Re-exports interface types from implementation files for consumers
 * who need type-only imports.
 *
 * @see createColumnGroup.ts — ColumnGroupConfig definition
 * @see MultiRowHeader.tsx — MultiRowHeaderProps definition
 */

export type { ColumnGroupConfig } from './createColumnGroup';
export type { MultiRowHeaderProps } from './MultiRowHeader';
export type { GroupedHeaderGridProps } from './legacy/GroupedHeaderGrid';
