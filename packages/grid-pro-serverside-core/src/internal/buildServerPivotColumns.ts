/**
 * @topgrid/grid-pro-serverside — buildServerPivotColumns (MOD-GRID-67 / G-1).
 *
 * Server-side pivoting (AG SSRM model): the server does the pivot and returns the set of generated
 * **pivot-result field keys** (e.g. `"East|sales"`, `"East|units"`, `"West|sales"`). The grid is
 * pure-client about *columns*: it derives a nested column-group tree from those flat keys.
 *
 * Each field splits on `separator` into `[dim1, dim2, …, measure]`. The leading segments are nested
 * group headers (one level per pivot dimension); the final segment is the leaf header. The leaf's
 * `accessorKey` is the **full field key** (what the server-returned row is keyed by). First-seen
 * order is preserved at every level (stable column layout across loads).
 *
 * Pure / node-verifiable: no React, no TanStack — the output is a plain ColumnDef-shaped tree the
 * consumer spreads into `<Grid columns>`.
 */

/** A derived pivot-result column: a leaf (accessorKey) or a group (columns). */
export interface ServerPivotColumn {
  /** Stable id (group: the path prefix; leaf: the full field key). */
  id: string;
  /** Header label (the dimension value, or the measure name for a leaf). */
  header: string;
  /** Leaf only: the row field this column reads (the full server field key). */
  accessorKey?: string;
  /** Group only: nested child columns. */
  columns?: ServerPivotColumn[];
}

/**
 * Build a nested pivot-result column tree from the server's flat field keys.
 *
 * @param fields - server-generated pivot-result field keys (order = desired column order).
 * @param separator - segment delimiter within a field key (default `'|'`).
 */
export function buildServerPivotColumns(
  fields: string[],
  separator = '|',
): ServerPivotColumn[] {
  const roots: ServerPivotColumn[] = [];
  // path prefix → group node (so siblings sharing a prefix merge into one group).
  const groupByPath = new Map<string, ServerPivotColumn>();

  for (const field of fields) {
    const segments = field.split(separator);
    let siblings = roots;
    let pathPrefix = '';

    // leading segments = nested group headers (all but the last).
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i]!;
      pathPrefix = pathPrefix === '' ? seg : `${pathPrefix}${separator}${seg}`;
      let group = groupByPath.get(pathPrefix);
      if (group === undefined) {
        group = { id: pathPrefix, header: seg, columns: [] };
        groupByPath.set(pathPrefix, group);
        siblings.push(group);
      }
      siblings = group.columns!;
    }

    // final segment = leaf measure; accessorKey = full field key.
    const measure = segments[segments.length - 1]!;
    siblings.push({ id: field, header: measure, accessorKey: field });
  }

  return roots;
}
