/**
 * Internal — `<th>` 우측 가장자리 4px 너비 column resize drag handle.
 *
 * TanStack `header.getResizeHandler()` 를 mouse + touch 양쪽에 bind 한다.
 * `header.column.getCanResize()` true 일 때만 렌더 (false → null).
 *
 * @remarks
 * - Tailwind className 만 사용 (C-5 — 신규 CSS 파일 0).
 * - 모바일 터치 환경 (EC-06): `onTouchStart` 동시 bind + `touch-none` 으로 페이지 스크롤 방지.
 * - 활성 리사이즈 중 (`column.getIsResizing()`) 은 `bg-blue-500` 으로 시각 강조.
 *
 * @see G-002-spec.md Section 2.3 + Section 11.1 Step 4 + D9
 */

import type { Header } from '@tanstack/react-table';

import type { GridColumnResizeMode } from '../types';

/**
 * `<ResizeHandle>` props.
 *
 * @typeParam TData - 행 데이터 타입.
 * @typeParam TValue - 셀 값 타입.
 */
export interface ResizeHandleProps<TData, TValue> {
  /** TanStack Header 객체 — `getResizeHandler()` 호출 + `getCanResize()` 가드 + `getIsResizing()` 시각 단서. */
  header: Header<TData, TValue>;
  /**
   * 현재 활성 리사이즈 모드.
   * UX 시각 단서로 `data-resize-mode` 속성에 노출 (디버그/스타일 분기용).
   */
  mode: GridColumnResizeMode;
}

/**
 * `<th>` 우측 가장자리에 절대 배치된 4px 너비 drag handle.
 *
 * @typeParam TData - 행 데이터 타입.
 * @typeParam TValue - 셀 값 타입.
 * @param props - {@link ResizeHandleProps}.
 * @returns drag handle div 또는 `null` (`getCanResize()=false`).
 */
export function ResizeHandle<TData, TValue>({
  header,
  mode,
}: ResizeHandleProps<TData, TValue>): JSX.Element | null {
  if (!header.column.getCanResize()) return null;

  const onPointerHandler = header.getResizeHandler();
  const isResizing = header.column.getIsResizing();

  return (
    <div
      onMouseDown={onPointerHandler}
      onTouchStart={onPointerHandler}
      onClick={(e) => e.stopPropagation()}
      className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none transition-colors ${
        isResizing ? 'bg-blue-500' : 'hover:bg-blue-400'
      }`}
      aria-hidden="true"
      data-resize-mode={mode}
    />
  );
}
