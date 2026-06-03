/**
 * @topgrid/grid-pro-serverside — public types (MOD-GRID-22 G-1).
 *
 * Server-side row model (SSRM) contracts: the consumer-supplied {@link ServerSideDatasource}
 * and the pure block-cache value types. No React / TanStack here — these are plain data shapes
 * so the cache core ({@link ./internal/blockCache}) stays node-verifiable.
 */

/** One server sort directive (column + direction). Mirrors TanStack `SortingState` item. */
export interface SortModelItem {
  /** Column id. */
  colId: string;
  /** Sort direction. */
  sort: 'asc' | 'desc';
}

/**
 * Opaque per-column filter map. The datasource interprets it; the grid never inspects it
 * (keeps filtering server-defined). Shape is consumer/server contract.
 */
export type FilterModel = Record<string, unknown>;

/** A block request: half-open row range `[startRow, endRow)` + current sort/filter. */
export interface GetRowsRequest {
  /** First row index (inclusive). */
  startRow: number;
  /** One past the last row index (exclusive). */
  endRow: number;
  /** Active sort directives (server applies). */
  sortModel: SortModelItem[];
  /** Active filter model (server applies). */
  filterModel: FilterModel;
}

/**
 * A block response. `lastRow` carries the **total/last-row signal** the virtualizer needs to
 * size the scroll area: set it to the absolute total row count once the server knows the end
 * has been reached (e.g. a partial final block), otherwise leave undefined (more rows exist).
 */
export interface GetRowsResult<TData> {
  /** The rows for the requested range (length ≤ endRow − startRow). */
  rows: TData[];
  /** Absolute total row count when known (end reached), else undefined. */
  lastRow?: number;
}

/** Consumer-supplied datasource. The single seam between the grid and the server. */
export interface ServerSideDatasource<TData> {
  /** Fetch one block. Must resolve (reject → that block stays unloaded, re-requestable). */
  getRows(request: GetRowsRequest): Promise<GetRowsResult<TData>>;
}

/** Placeholder row emitted by {@link materialize} for not-yet-loaded indices. */
export interface RowPlaceholder {
  /** Discriminant — consumers test this to render a loading skeleton cell. */
  readonly __ssrmPlaceholder: true;
  /** Absolute row index this placeholder stands in for. */
  readonly rowIndex: number;
}

/** Internal per-block status. */
export type BlockStatus = 'loading' | 'loaded';

/** Internal per-block state (rows present only when `loaded`). */
export interface BlockState<TData> {
  status: BlockStatus;
  rows?: TData[];
}

/**
 * Pure block-cache value. Transitions are pure functions in `./internal/blockCache` that
 * return a new state (never mutate). `epoch` is the query generation — bumped on
 * sort/filter/group change so stale in-flight responses are rejected (the SSRM invariant).
 */
export interface BlockCacheState<TData> {
  /** Rows per block (fixed). */
  blockSize: number;
  /** Query generation. Responses tagged with a stale epoch are discarded. */
  epoch: number;
  /** blockIndex → state. */
  blocks: Map<number, BlockState<TData>>;
  /** Known total row count (from `lastRow`), else null. */
  rowCount: number | null;
}
