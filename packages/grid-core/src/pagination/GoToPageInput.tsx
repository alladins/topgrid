/**
 * `GoToPageInput` — 특정 페이지로 점프하는 numeric 입력 UI (MOD-GRID-49 G-2).
 *
 * Internal 컴포넌트 — GridPagination.tsx 에서 `enableGoToPage` 시 렌더.
 * 슬라이딩 윈도우 버튼(PageNumbers)으로 닿지 않는 먼 페이지로 직접 이동.
 * 경계 로직은 순수 `clampGoToPage` 에 위임(node 검증).
 *
 * @since MOD-GRID-49 (Track 1 — Wijmo pager 입력 대응)
 */

import { useState } from 'react';

import { clampGoToPage } from './clampGoToPage';

interface GoToPageInputProps {
  /** 전체 페이지 수 (≥ 0). */
  pageCount: number;
  /** 0-based 인덱스로 점프 (table.setPageIndex 위임). */
  onGoToPage: (pageIndex: number) => void;
  /** 입력 라벨 (i18n). 미지정 시 한국어 기본. */
  label?: string;
  /** 이동 버튼 aria-label (i18n). 미지정 시 한국어 기본. */
  goLabel?: string;
}

export function GoToPageInput({
  pageCount,
  onGoToPage,
  label = '페이지 이동:',
  goLabel = '입력한 페이지로 이동',
}: GoToPageInputProps): JSX.Element {
  const [raw, setRaw] = useState('');

  const submit = (): void => {
    const idx = clampGoToPage(raw, pageCount);
    if (idx !== null) {
      onGoToPage(idx);
      setRaw('');
    }
  };

  return (
    <div className="flex items-center gap-1" data-go-to-page>
      <label className="text-sm text-gray-600" htmlFor="topgrid-goto-page">
        {label}
      </label>
      <input
        id="topgrid-goto-page"
        type="number"
        min={1}
        max={pageCount}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        aria-label={label}
        className="w-16 px-2 py-1 rounded border border-gray-300 text-sm"
      />
      <button
        type="button"
        onClick={submit}
        aria-label={goLabel}
        className="px-2 py-1 rounded border border-gray-300 text-sm hover:bg-gray-100"
      >
        {'→'}
      </button>
    </div>
  );
}
