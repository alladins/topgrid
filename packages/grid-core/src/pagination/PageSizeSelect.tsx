/**
 * `PageSizeSelect` — 페이지당 행 수 선택 컴포넌트.
 *
 * 네이티브 `<select>` 사용 (grid-core에는 shadcn/ui peerDep 없음).
 *
 * @since G-002 (MOD-GRID-03)
 */

import { memo } from 'react';

/**
 * `PageSizeSelect` props.
 */
export interface PageSizeSelectProps {
  /** 현재 pageSize. */
  pageSize: number;
  /** 선택 가능한 pageSize 옵션 목록. */
  pageSizeOptions: number[];
  /** pageSize 변경 콜백. */
  onPageSizeChange: (size: number) => void;
}

/**
 * 페이지당 행 수 선택 UI.
 *
 * pageSize 변경 시 `onPageSizeChange` 호출 (pageIndex reset은 호출부에서 담당).
 */
export const PageSizeSelect = memo(function PageSizeSelect({
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: PageSizeSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span>페이지당 행 수:</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="border border-gray-300 rounded px-2 py-1 text-sm"
      >
        {pageSizeOptions.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
});
