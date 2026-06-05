/**
 * Locale/collation-aware sorting — pure, node-testable (MOD-GRID-37 G-1).
 *
 * ★ TanStack's built-in `text` sortingFn is a lowercased basic string compare — NOT locale-aware:
 * accented Latin sorts by code-point (é at U+00E9 lands AFTER z), and Korean/그 외 스크립트 don't
 * collate correctly. This provides a `localeCompare`-based comparator so 'é' sorts between 'e' and
 * 'f' and 한글 follows 자모 순. The non-vacuous claim: the result ORDER DIFFERS from a code-point
 * sort — a test that also passes under plain string `<` would be vacuous.
 */

import type { Row } from '@tanstack/react-table';

/**
 * Locale-aware comparison of two cell values. Nullish coerces to '' (placement of nulls is a
 * separate concern — G-2). `numeric: true` gives natural number ordering within strings (a2 < a10);
 * `sensitivity: 'variant'` keeps accents significant.
 */
export function compareLocale(a: unknown, b: unknown, locale?: string | string[]): number {
  const sa = a == null ? '' : String(a);
  const sb = b == null ? '' : String(b);
  return sa.localeCompare(sb, locale, { numeric: true, sensitivity: 'variant' });
}

/**
 * Build a TanStack `sortingFn` that collates with `localeCompare`. Use per column:
 * `{ accessorKey: 'name', sortingFn: makeLocaleSortingFn('ko') }`.
 */
export function makeLocaleSortingFn<TData>(locale?: string | string[]) {
  return (rowA: Row<TData>, rowB: Row<TData>, columnId: string): number =>
    compareLocale(rowA.getValue(columnId), rowB.getValue(columnId), locale);
}

/** Ready-made locale sortingFn using the runtime's default locale. */
export const localeSortingFn = makeLocaleSortingFn();
