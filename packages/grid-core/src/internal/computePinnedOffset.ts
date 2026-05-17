/**
 * Internal — TanStack pinned column 의 sticky CSS offset 계산 + `<th>`/`<td>` style 헬퍼.
 *
 * ColumnPinGrid.tsx L66-82 의 `getLeftOffset` / `getRightOffset` 패턴을 추출하여 순수 함수화.
 *
 * @remarks
 * **memoize 금지** — render마다 재계산 (EC-04). `column.getSize()` 가 `state.columnSizing` 을
 * 자동 반영하므로 resize 후 즉시 sticky offset 재계산되어야 한다 (`useMemo` 캐시 시 stale offset).
 *
 * @see G-002-spec.md Section 2.2 + Section 11.1 Step 3
 */

import type { CSSProperties } from 'react';
import type { Column, Table } from '@tanstack/react-table';

/**
 * 좌측 pinned 컬럼의 누적 left offset (px).
 *
 * @typeParam TData - 행 데이터 타입.
 * @param table - TanStack Table 인스턴스.
 * @param columnId - 대상 column id.
 * @returns 좌측에서부터 column 까지 누적 width (px). 비-pinned column 또는 미발견 시 0.
 */
export function computeLeftOffset<TData>(table: Table<TData>, columnId: string): number {
  const leftCols = table.getLeftLeafColumns();
  let offset = 0;
  for (const col of leftCols) {
    if (col.id === columnId) return offset;
    offset += col.getSize();
  }
  return 0;
}

/**
 * 우측 pinned 컬럼의 누적 right offset (px).
 *
 * @typeParam TData - 행 데이터 타입.
 * @param table - TanStack Table 인스턴스.
 * @param columnId - 대상 column id.
 * @returns 우측에서부터 column 까지 누적 width (px). 비-pinned column 또는 미발견 시 0.
 */
export function computeRightOffset<TData>(table: Table<TData>, columnId: string): number {
  const rightCols = table.getRightLeafColumns();
  let offset = 0;
  for (let i = rightCols.length - 1; i >= 0; i--) {
    const col = rightCols[i];
    if (col.id === columnId) return offset;
    offset += col.getSize();
  }
  return 0;
}

/**
 * `<th>` / `<td>` 에 적용할 sticky style + className 헬퍼 결과.
 */
export interface PinnedCellStyle {
  /** position / left / right / boxShadow 인라인 스타일 (boxShadow 동적 RGBA — C-5 예외 D8). */
  style: CSSProperties;
  /** z-index + bg 클래스 (D3 컨벤션 — Tailwind). */
  className: string;
}

/**
 * `<th>` / `<td>` sticky style + className 생성 (D3 z-index 컨벤션).
 *
 * z-index:
 * - thead 일반 (비 pinned): `z-10` (Grid.tsx thead 자체 className 으로 처리)
 * - tbody pinned: `z-20`
 * - thead pinned (intersection): `z-30`
 *
 * boxShadow edge cue (D8 — 동적 RGBA → C-5 예외 인라인 style 허용):
 * - last-left pinned: `4px 0 6px -2px rgba(0,0,0,0.12)`
 * - first-right pinned: `-4px 0 6px -2px rgba(0,0,0,0.12)`
 *
 * @typeParam TData - 행 데이터 타입.
 * @param column - TanStack Column.
 * @param table - Table 인스턴스.
 * @param scope - `'thead'` 또는 `'tbody'` (z-index 분기).
 * @returns `{ style, className }` — Grid.tsx 에서 spread.
 */
export function getPinnedCellStyle<TData>(
  column: Column<TData, unknown>,
  table: Table<TData>,
  scope: 'thead' | 'tbody',
): PinnedCellStyle {
  const pinned = column.getIsPinned();
  if (pinned === false) {
    // 비-pinned 셀 — sticky 미적용 (thead 일반 sticky 는 Grid.tsx <thead> className 에서 처리).
    return { style: {}, className: '' };
  }

  const leftCols = table.getLeftLeafColumns();
  const rightCols = table.getRightLeafColumns();
  const isLastLeft =
    pinned === 'left' && leftCols.length > 0 && leftCols[leftCols.length - 1]?.id === column.id;
  const isFirstRight =
    pinned === 'right' && rightCols.length > 0 && rightCols[0]?.id === column.id;

  // exactOptionalPropertyTypes: true — `undefined` 명시 할당 금지. 조건부 객체 조립 패턴.
  const style: CSSProperties = { position: 'sticky' };
  if (pinned === 'left') {
    style.left = computeLeftOffset(table, column.id);
  }
  if (pinned === 'right') {
    style.right = computeRightOffset(table, column.id);
  }
  if (isLastLeft) {
    style.boxShadow = '4px 0 6px -2px rgba(0,0,0,0.12)';
  } else if (isFirstRight) {
    style.boxShadow = '-4px 0 6px -2px rgba(0,0,0,0.12)';
  }

  // D3 z-index 컨벤션 + sticky 셀 배경 (스크롤 콘텐츠 가림 방지).
  const zClass = scope === 'thead' ? 'z-30' : 'z-20';
  const bgClass = scope === 'thead' ? 'bg-gray-50' : 'bg-white';
  return { style, className: `${zClass} ${bgClass}` };
}
