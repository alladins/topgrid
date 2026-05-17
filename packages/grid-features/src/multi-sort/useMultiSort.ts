import type { UseMultiSortOptions, UseMultiSortResult } from './types';

/**
 * useReactTable 직접 사용자가 다중 정렬 옵션을 구성할 때 사용하는 헬퍼.
 *
 * @remarks
 * `<Grid enableMultiSort />` wrapper 사용자는 이 훅 불필요 — Grid.tsx 내부에서
 * `buildTableOptions.ts`가 props.enableMultiSort를 직접 처리. (D6)
 *
 * C-31 wiring audit: Grid.tsx는 이 훅을 import하지 않음. 외부 소비자용 유틸.
 *
 * @example
 * const { enableMultiSort, isMultiSortEvent } = useMultiSort({ enableMultiSort: true });
 * const table = useReactTable({
 *   data,
 *   columns,
 *   getCoreRowModel: getCoreRowModel(),
 *   getSortedRowModel: getSortedRowModel(),
 *   enableMultiSort,
 *   isMultiSortEvent,
 * });
 */
export function useMultiSort(opts?: UseMultiSortOptions): UseMultiSortResult {
  const enableMultiSort = opts?.enableMultiSort ?? false;
  const result: UseMultiSortResult = {
    enableMultiSort,
    isMultiSortEvent: (e: unknown): boolean => {
      if (e !== null && typeof e === 'object' && 'shiftKey' in e) {
        return (e as { shiftKey: boolean }).shiftKey === true;
      }
      return false;
    },
  };
  // C-29: exactOptionalPropertyTypes — undefined를 전달하면 TanStack이 무제한으로 처리하지 않을 수 있음.
  // 값이 있을 때만 result에 포함.
  if (opts?.maxMultiSortColCount !== undefined) {
    result.maxMultiSortColCount = opts.maxMultiSortColCount;
  }
  return result;
}
