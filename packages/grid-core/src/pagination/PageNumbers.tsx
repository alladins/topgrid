/**
 * `PageNumbers` — 슬라이딩 윈도우 숫자 페이지 버튼 (최대 5개 + 말줄임).
 *
 * Internal 컴포넌트 — GridPagination.tsx에서만 사용.
 * L0 `data-table-pagination.tsx` getPageNumbers() 알고리즘 흡수.
 *
 * @since G-003 (MOD-GRID-03)
 */

import { memo, type ReactNode } from 'react';

interface PageNumbersProps {
  /** 현재 페이지 (1-based). */
  currentPage: number;
  /** 전체 페이지 수. */
  pageCount: number;
  /** 페이지 클릭 콜백 (1-based 페이지 번호 전달). */
  onPageChange: (page: number) => void;
  /** 페이지 번호 라벨 포매터 (MOD-GRID-49). 미지정 시 raw 정수. aria-label은 원본 정수 유지. */
  format?: (n: number) => ReactNode;
}

export const PageNumbers = memo(function PageNumbers({
  currentPage,
  pageCount,
  onPageChange,
  format,
}: PageNumbersProps) {
  if (pageCount <= 0) return null;

  // L0 getPageNumbers() 알고리즘 (data-table-pagination.tsx L17-27)
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(pageCount, startPage + maxPagesToShow - 1);
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  const showLeftEllipsis = startPage > 1;
  const showRightEllipsis = endPage < pageCount;

  return (
    <>
      {showLeftEllipsis && (
        <span aria-hidden="true" className="px-1 text-gray-400">
          …
        </span>
      )}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          disabled={p === currentPage}
          aria-label={`페이지 ${p}로 이동`}
          aria-current={p === currentPage ? 'page' : undefined}
          className={
            p === currentPage
              ? 'px-2 py-1 rounded border border-blue-600 bg-blue-600 text-white text-sm disabled:opacity-100'
              : 'px-2 py-1 rounded border border-gray-300 text-sm hover:bg-gray-100 disabled:opacity-40'
          }
        >
          {format ? format(p) : p}
        </button>
      ))}
      {showRightEllipsis && (
        <span aria-hidden="true" className="px-1 text-gray-400">
          …
        </span>
      )}
    </>
  );
});
