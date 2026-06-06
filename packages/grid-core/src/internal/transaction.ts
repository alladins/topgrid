/**
 * Incremental row transactions (MOD-GRID-43) — pure, no React/DOM.
 *
 * grid-core follows a **controlled-data policy** (the grid never owns the row array; mutation
 * callbacks delegate to the parent). So these are pure helpers the consumer applies to its own
 * state — the same shape as {@link moveRow} (MOD-33). AG Grid's `applyTransaction` /
 * `applyTransactionAsync` analogue, but headless: you call them and set your own data.
 */

/** A row id (TanStack `row.id` shape). */
export type RowId = string | number;

/** Extract a stable id from a row (MOD-GRID-36 getRowId concept). */
export type GetRowId<TData> = (row: TData) => RowId;

/** A delta over a row array: remove by id, update by id (matched rows replaced), add (appended). */
export interface RowTransaction<TData> {
  add?: readonly TData[];
  update?: readonly TData[];
  remove?: readonly RowId[];
}

/**
 * Apply a {@link RowTransaction} to `data`, returning a NEW array (input never mutated).
 * Order = **remove → update → add** (AG Grid semantics). Updates/removes for ids not present are
 * ignored (no throw). `update` rows are matched by `getRowId` and replace the existing row in place.
 */
export function applyRowTransaction<TData>(
  data: readonly TData[],
  txn: RowTransaction<TData>,
  getRowId: GetRowId<TData>,
): TData[] {
  let rows = data.slice();

  // remove
  if (txn.remove && txn.remove.length > 0) {
    const removeIds = new Set<RowId>(txn.remove);
    rows = rows.filter((r) => !removeIds.has(getRowId(r)));
  }

  // update (match by id → replace; unknown ids ignored)
  if (txn.update && txn.update.length > 0) {
    const updateById = new Map<RowId, TData>();
    for (const u of txn.update) updateById.set(getRowId(u), u);
    rows = rows.map((r) => updateById.get(getRowId(r)) ?? r);
  }

  // add (append)
  if (txn.add && txn.add.length > 0) {
    rows = rows.concat(txn.add);
  }

  return rows;
}

/** Dependencies a {@link createTransactionBatcher} needs (all injected → node-deterministic). */
export interface TransactionBatcherDeps<TData> {
  /** Read the current row array (consumer-owned state). */
  getData: () => readonly TData[];
  /** Commit the new row array (consumer-owned setState). Called ONCE per flush. */
  setData: (next: TData[]) => void;
  getRowId: GetRowId<TData>;
  /**
   * Schedule `flush` to run later (PAT-005 host-capability injection). Production passes
   * `queueMicrotask`/`requestAnimationFrame`; node tests pass a manual collector for determinism.
   */
  schedule: (flush: () => void) => void;
}

/** A batcher that coalesces many transactions into a single deferred apply. */
export interface TransactionBatcher<TData> {
  /** Queue a transaction; the first queued since the last flush arms one `schedule(flush)`. */
  enqueue: (txn: RowTransaction<TData>) => void;
  /** Apply all queued transactions to the current data in order, committing once. */
  flush: () => void;
  /** Queued (not-yet-flushed) transaction count — for tests/introspection. */
  pending: () => number;
}

/**
 * MOD-GRID-43 G-2: `applyTransactionAsync` analogue. `enqueue` accumulates transactions and arms a
 * single `schedule(flush)`; `flush` applies them all to the current data **in order** and commits
 * via `setData` exactly once (batched). Re-arming happens on the next enqueue after a flush.
 */
export function createTransactionBatcher<TData>(
  deps: TransactionBatcherDeps<TData>,
): TransactionBatcher<TData> {
  const queue: RowTransaction<TData>[] = [];
  let armed = false;

  const flush = (): void => {
    armed = false;
    if (queue.length === 0) return; // nothing queued → no commit
    const txns = queue.splice(0); // drain
    const next = txns.reduce(
      (rows, txn) => applyRowTransaction(rows, txn, deps.getRowId),
      deps.getData(),
    );
    deps.setData(next as TData[]);
  };

  return {
    enqueue: (txn) => {
      queue.push(txn);
      if (!armed) {
        armed = true;
        deps.schedule(flush);
      }
    },
    flush,
    pending: () => queue.length,
  };
}
