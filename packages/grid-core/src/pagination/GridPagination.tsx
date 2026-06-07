/**
 * `GridPagination` — pagination UI 컨테이너.
 *
 * - PageSizeSelect: 페이지당 행 수 선택 (pageSizeOptions, 기본 [10,20,50,100])
 * - TotalCount: 전체 건수 표시 (showTotalCount !== false 일 때)
 * - 이전/다음/처음/끝 페이지 네비게이션 버튼
 * - PageNumbers: 슬라이딩 윈도우 숫자 페이지 버튼 (최대 5개 + 말줄임)
 * - enableKeyboardNav: Alt+← / Alt+→ 키보드 페이지 이동
 *
 * @since G-001 (MOD-GRID-03 — skeleton)
 * @since G-002 (MOD-GRID-03 — full UI)
 * @since G-003 (MOD-GRID-03 — PageNumbers + keyboard nav)
 */

import { useEffect, useRef } from 'react';
import type { OnChangeFn, PaginationState, RowData, Table } from '@tanstack/react-table';

import { GoToPageInput } from './GoToPageInput';
import { PageNumbers } from './PageNumbers';
import { PageSizeSelect } from './PageSizeSelect';
import { TotalCount } from './TotalCount';
import type { PaginationMode } from './types';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * `GridPagination<TData>` props.
 *
 * @typeParam TData - 행 데이터 타입.
 */
export interface GridPaginationProps<TData extends RowData> {
  /** TanStack `Table` 인스턴스 — pagination state + API 접근. */
  table: Table<TData>;
  /** Pagination 동작 모드 (`'client' | 'server' | 'none'`). */
  mode?: PaginationMode;
  /** Server 모드에서 전체 row 수. */
  totalCount?: number;
  /** Server 모드에서 전체 페이지 수. */
  pageCount?: number;
  /** 페이지당 행 수 옵션 목록 (기본 `[10, 20, 50, 100]`). */
  pageSizeOptions?: number[];
  /**
   * 전체 건수 표시 여부. 기본 `true`.
   * `false` 설정 시 "전체 N건" UI를 숨긴다.
   */
  showTotalCount?: boolean;
  /** 페이지 변경 콜백. */
  onPaginationChange?: OnChangeFn<PaginationState>;
  /**
   * Alt+← / Alt+→ 키보드 페이지 이동 활성화.
   * container ref scope 에 이벤트 리스너 등록. 기본 `false`.
   *
   * @since G-003 (MOD-GRID-03)
   */
  enableKeyboardNav?: boolean;
  /** "페이지당 행 수:" 라벨 (i18n — MOD-GRID-29). */
  rowsPerPageLabel?: string;
  /** 전체 건수 텍스트 포매터 (i18n — MOD-GRID-29). */
  totalCountFormat?: (total: number) => import('react').ReactNode;
  /** 네비게이션 버튼 aria-label (i18n — MOD-GRID-29). 미지정 시 한국어 기본. */
  navLabels?: { firstPage: string; prevPage: string; nextPage: string; lastPage: string };
  /** 페이지 번호 라벨 포매터 (MOD-GRID-49). PageNumbers 로 전달. */
  pageNumberFormat?: (n: number) => import('react').ReactNode;
  /** 특정 페이지로 점프하는 numeric 입력 UI 표시 (MOD-GRID-49). 기본 `false`. */
  enableGoToPage?: boolean;
}

const DEFAULT_NAV_LABELS = {
  firstPage: '첫 페이지',
  prevPage: '이전 페이지',
  nextPage: '다음 페이지',
  lastPage: '마지막 페이지',
};

/**
 * Pagination UI 컨테이너 컴포넌트.
 *
 * @typeParam TData - 행 데이터 타입.
 */
export function GridPagination<TData extends RowData>({
  table,
  mode,
  totalCount,
  pageSizeOptions,
  showTotalCount,
  enableKeyboardNav,
  rowsPerPageLabel,
  totalCountFormat,
  navLabels,
  pageNumberFormat,
  enableGoToPage,
}: GridPaginationProps<TData>): JSX.Element {
  const navL = navLabels ?? DEFAULT_NAV_LABELS;
  const containerRef = useRef<HTMLDivElement>(null);
  const { pageIndex, pageSize } = table.getState().pagination;

  // D4: container ref scope 키보드 핸들러 (document 전역 금지 — multi-grid 안전)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enableKeyboardNav) return;
    const handler = (e: KeyboardEvent): void => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (table.getCanPreviousPage()) table.previousPage();
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (table.getCanNextPage()) table.nextPage();
      }
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [enableKeyboardNav, table]);

  const effectivePageSizeOptions = pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
  const resolvedShowTotalCount = showTotalCount !== false;

  // 전체 건수: server 모드에서 totalCount 우선, 없으면 filtered rows 수
  const totalRows =
    mode === 'server' && typeof totalCount === 'number'
      ? totalCount
      : table.getFilteredRowModel().rows.length;

  const pageCountValue = table.getPageCount();
  const currentPage = pageIndex + 1; // 1-based

  const handlePageSizeChange = (size: number): void => {
    table.setPageSize(size);
    table.setPageIndex(0);
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-between px-2 py-3 text-sm text-gray-600"
    >
      <div className="flex items-center gap-2">
        <PageSizeSelect
          pageSize={pageSize}
          pageSizeOptions={effectivePageSizeOptions}
          onPageSizeChange={handlePageSizeChange}
          {...(rowsPerPageLabel !== undefined ? { label: rowsPerPageLabel } : {})}
        />
        {resolvedShowTotalCount && (
          <TotalCount
            total={totalRows}
            {...(totalCountFormat !== undefined ? { format: totalCountFormat } : {})}
          />
        )}
        {enableGoToPage && (
          <GoToPageInput pageCount={pageCountValue} onGoToPage={(idx) => table.setPageIndex(idx)} />
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label={navL.firstPage}
          className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        >
          {'«'}
        </button>
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label={navL.prevPage}
          className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        >
          {'‹'}
        </button>
        <PageNumbers
          currentPage={currentPage}
          pageCount={pageCountValue}
          onPageChange={(p) => table.setPageIndex(p - 1)}
          {...(pageNumberFormat !== undefined ? { format: pageNumberFormat } : {})}
        />
        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label={navL.nextPage}
          className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        >
          {'›'}
        </button>
        <button
          type="button"
          onClick={() => table.setPageIndex(pageCountValue - 1)}
          disabled={!table.getCanNextPage()}
          aria-label={navL.lastPage}
          className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        >
          {'»'}
        </button>
      </div>
    </div>
  );
}
