/**
 * Null/blank → undefined normalization for direction-independent sort placement (MOD-GRID-37 G-2).
 *
 * ★ TanStack's `sortUndefined` ('first'/'last') places blanks direction-INDEPENDENTLY (asc and desc
 * both park them at the same end), but it keys strictly off `=== undefined` — null and empty strings
 * are NOT caught and fall through the sortingFn (where their position flips with the sort direction).
 * A plain sortingFn can't fix this: its result is negated for desc, so it can't pin nulls.
 *
 * The only lever is the accessor: make blanks PRESENT AS undefined to the sort engine. Apply this as
 * a column's `accessorFn` and set `sortUndefined: 'first' | 'last'`. Pure + node-testable.
 *
 * ⚠ Opt-in per column: a column using this renders blank values as undefined (empty) everywhere, not
 * just in sort — cosmetically identical since the value was null/blank anyway.
 */

/** True for null, undefined, or a string that is empty or all whitespace. NOT for 0 / false. */
export function isBlank(value: unknown): boolean {
  if (value == null) return true;
  return typeof value === 'string' && value.trim() === '';
}

/**
 * Wrap an accessor so blank values (null/undefined/empty-or-whitespace string) become `undefined`,
 * letting `sortUndefined` place them. Real falsy values (`0`, `false`) pass through unchanged — the
 * classic bug is treating those as blank.
 */
export function blankToUndefined<TData, TValue>(
  accessor: (row: TData) => TValue,
): (row: TData) => TValue | undefined {
  return (row: TData) => {
    const value = accessor(row);
    return isBlank(value) ? undefined : value;
  };
}
