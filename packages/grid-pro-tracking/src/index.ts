import { checkLicense } from '@tomis/grid-license';

checkLicense();

export * from './types';
export { useChangeTracking } from './useChangeTracking';
export { buildChangeSet } from './buildChangeSet';
export type { BuildChangeSetOptions } from './buildChangeSet';
export { getRowStatusClassName, defaultRowStatusClassNames } from './internal/rowStatusStyle';
// G-005 — ChangeTrackingGrid alias (default + named) + props type.
export { default as ChangeTrackingGrid } from './legacy/ChangeTrackingGrid';
export type { ChangeTrackingGridProps } from './legacy/ChangeTrackingGrid';
