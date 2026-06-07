/**
 * `computeAutoPageSize` — 뷰포트(그리드 본문) 가용 높이에 맞는 pageSize 산정 (MOD-GRID-49 G-3).
 *
 * 순수 함수 (node 검증). 측정(ResizeObserver)은 Grid 배선이 담당하고, 산술만 여기서 단독 테스트한다.
 * AG Grid `paginationAutoPageSize` 대응.
 *
 * @param availableHeight 본문(tbody 스크롤 영역) 가용 픽셀 높이.
 * @param rowHeight       추정 행 높이 픽셀 (> 0).
 * @returns 들어가는 행 수 (`floor`), **최소 1**. 비정상 입력(0/음수/비유한)도 1 로 가드.
 *
 * - 300 / 36 → 8   (floor(8.33))
 * - rowHeight > height → 1 (최소 한 행)
 * - height ≤ 0 또는 rowHeight ≤ 0 → 1 (가드)
 */
export function computeAutoPageSize({
  availableHeight,
  rowHeight,
}: {
  availableHeight: number;
  rowHeight: number;
}): number {
  if (
    !Number.isFinite(availableHeight) ||
    !Number.isFinite(rowHeight) ||
    availableHeight <= 0 ||
    rowHeight <= 0
  ) {
    return 1;
  }
  return Math.max(1, Math.floor(availableHeight / rowHeight));
}
