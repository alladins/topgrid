/**
 * @topgrid/grid-core-headless — framework-agnostic grid core (W1 Phase 0).
 *
 * table-core 위에서 props→TableOptions 매핑을 수행. React(grid-core)/Vue 어댑터가 공유 소비한다.
 * 체크박스(selection) 컬럼 렌더는 프레임워크별로 주입(`CreateSelectionColumn`).
 */
export { buildTableOptions } from './buildTableOptions';
export { buildPaginationOptions, type BuildPaginationResult } from './buildPaginationOptions';
export type {
  BuildOptionsResult,
  CreateSelectionColumn,
  GridStateBag,
  HeadlessPaginationOptions,
  HeadlessRowSelectionOptions,
  PaginationMode,
  RowSelectionMode,
  TableOptionsInput,
} from './types';
