/**
 * @topgrid/grid-pro-range — 범위 정규화 re-export shim (W1 Phase 0).
 * 구현(normalizeRange/isInRange)은 framework-agnostic @topgrid/grid-core-headless 로 이관.
 * 기존 내부 소비처 보존 위해 re-export.
 */
export { normalizeRange, isInRange } from '@topgrid/grid-core-headless';
export type { CellCoord } from '../types';
