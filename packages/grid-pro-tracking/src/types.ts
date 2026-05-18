// @topgrid/grid-pro-tracking — public types for useChangeTracking (MOD-GRID-10/G-001)
//
// Spec: artifacts/MOD-GRID-10/tracking/G-001-spec.md Section 2.1
// AC mapping: AC-001 (no any) / AC-002 (config 6 fields) / AC-003 (12-member API)

/**
 * Row change status. `unchanged` rows omit `__rowStatus`.
 * @see AC-001 — RowStatus is one of three string literals; no `any`.
 */
export type RowStatus = 'added' | 'edited' | 'deleted';

/**
 * Edited row shape — `TData` merged with the structuredClone snapshot captured
 * at the moment of the first `updateRow` call.
 *
 * Named alias of the previously-inline `TData & { __original: TData }` so that
 * downstream code (renderers, mapping helpers, docs) can reference the shape
 * by name. Runtime-equivalent to the inline form (TypeScript structural typing).
 *
 * @see AC-002 — `tracking.edited[i].__original` is the pre-edit value.
 * @template TData Row data type.
 */
export type OriginalSnapshot<TData> = TData & { __original: TData };

/**
 * Screen-to-BE field mapping. Value is either a target BE field name or a
 * derived function `(row) => value`. Applied during `getChangeSet()` / `commitChanges()`.
 * @see AC-002 — `config.mapping` is optional; G-003 implements the runtime behavior.
 */
export type Mapping<TData> = Record<string, string | ((row: TData) => unknown)>;

/**
 * Row-level validator returning `{ valid, errors? }`. When `valid` is `false`,
 * the row is excluded from `added`/`updated` and an entry is pushed into `errors`.
 * @see AC-002 — `config.validator` is optional; G-003 implements the runtime behavior.
 */
export type Validator<TData> = (row: TData) => { valid: boolean; errors?: string[] };

/**
 * Options for `commitChanges`.
 * @see AC-003 — `commitChanges(endpoint, options?)` signature; G-005 implements the runtime behavior.
 */
export interface CommitOptions {
  /** HTTP method. Default `'POST'`. */
  method?: string;
  /** Custom fetcher (axios-compatible). Default `globalThis.fetch`. */
  fetcher?: (url: string, init?: RequestInit) => Promise<unknown>;
  /** Auto `resetChanges()` on success. Default `true`. */
  autoReset?: boolean;
  /**
   * Override `config.optimistic` for this single call. When `true`, a
   * failure during commit dispatches RESET (rollback of all tracked
   * changes) before re-throwing. Default = `config.optimistic` (G-005 D4).
   */
  optimistic?: boolean;
}

/**
 * Server payload shape produced by `getChangeSet` / `commitChanges`.
 * `errors` carries per-row mapping/validator failures with the originating row index.
 * @see AC-003 — `getChangeSet(): ChangeSet`; G-003 populates the actual entries.
 */
export interface ChangeSet {
  added: MappedRow[];
  updated: MappedRow[];
  removed: MappedRow[];
  errors: Array<{ index: number; message: string; type: 'added' | 'updated' }>;
}

/**
 * Input config for `useChangeTracking` (MOD-GRID-10/G-001).
 *
 * Six fields: two required (`data`, `rowKey`) + four optional. The snapshot
 * is captured at hook-mount time; subsequent prop changes do not re-snapshot.
 *
 * @see AC-002 — 6-field shape composed in parallel with TanStack `useReactTable`.
 * @see ChangeTrackingAPI for the return shape.
 * @template TData Row data type.
 */
/**
 * Tailwind className strings for each row status.
 * Pass a partial override to `getRowStatusClassName` to customise colours.
 * @see defaultRowStatusClassNames for the built-in values.
 * @see AC-002 — default values are canonical.
 */
export interface RowStatusClassNames {
  added: string;
  edited: string;
  deleted: string;
}

export interface ChangeTrackingConfig<TData> {
  /** Initial dataset. Snapshot is captured at mount. (G-002 implements snapshot.) */
  data: TData[];
  /** PK extractor — either a field name or a function returning a string key. */
  rowKey: keyof TData | ((row: TData) => string);
  /** Screen-to-BE field mapping. (G-003 implements the runtime application.) */
  mapping?: Mapping<TData>;
  /** Row-level validator. (G-003 implements the runtime application.) */
  validator?: Validator<TData>;
  /** Optimistic update — auto-rollback on commit failure. Default `false`. (G-005) */
  optimistic?: boolean;
  /** Callback fired after the initial snapshot is built. (G-002) */
  onSnapshotInit?: (snapshot: ReadonlyMap<string, TData>) => void;
  // G-004 추가 — runtime wiring은 G-005 책임
  /** 셀 단위 편집 추적 활성화. `true`로 설정 시 editedCellsMap에 편집된 셀 위치 기록. Default false. (G-005 wires reducer) */
  editedCells?: boolean;
}

/**
 * Return shape of `useChangeTracking`. Twelve members: four read-only views
 * (`rows`, `added`, `edited`, `deleted`) plus eight imperative methods.
 *
 * @see AC-003 — 12-member enumerate; types match Section 2.1 verbatim.
 * @template TData Row data type.
 */
/**
 * Mapped row shape produced by `buildChangeSet` / `getChangeSet`.
 * Keys correspond to BE field names after `Mapping<TData>` is applied.
 * When no mapping is provided the keys mirror the original `TData` fields.
 * @see AC-002 — mapping runtime semantics implemented in G-003.
 */
export interface MappedRow {
  readonly [key: string]: unknown;
}

export interface ChangeTrackingAPI<TData> {
  /** Display rows (added/edited/deleted merged, `__rowStatus` attached). */
  rows: ReadonlyArray<TData & { __rowStatus?: RowStatus }>;
  /** Added rows. */
  added: ReadonlyArray<TData>;
  /** Edited rows with `__original` preserved (see {@link OriginalSnapshot}). */
  edited: ReadonlyArray<OriginalSnapshot<TData>>;
  /** Rows marked for deletion. */
  deleted: ReadonlyArray<TData>;
  /** Add a row. Returns the assigned row key. (G-002) */
  addRow(seed: Partial<TData>): string;
  /** Update a row by key (patch merge). (G-002) */
  updateRow(key: string, patch: Partial<TData>): void;
  /** Delete a row by key. `added` rows are removed; others marked `deleted`. (G-002) */
  deleteRow(key: string): void;
  /** Undo a single row's tracked change. (G-004) */
  undoRow(key: string): void;
  /** True if at least one tracked change exists. */
  hasChanges(): boolean;
  /** Server payload with mapping/validator applied. (G-003) */
  getChangeSet(): ChangeSet;
  /** Restore initial snapshot. (G-002) */
  resetChanges(): void;
  /** Commit changes to `endpoint`. Auto-rollback on failure when `optimistic`. (G-005) */
  commitChanges(endpoint: string, options?: CommitOptions): Promise<unknown>;
  // G-004 추가 — 항상 new Map() 반환 (stub). G-005에서 실 데이터 채움.
  /** 편집된 셀 위치 맵. key = `rowKey + '_' + columnId`. editedCells config가 false면 항상 empty. (G-005 wires) */
  editedCellsMap: ReadonlyMap<string, boolean>;
}
