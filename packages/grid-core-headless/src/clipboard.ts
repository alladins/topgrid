/**
 * 셀 값 → 클립보드 텍스트 (순수, W1 Phase 0, grid-pro-master 에서 이관).
 *
 * 브라우저 `navigator.clipboard` 배선과 분리된 값→텍스트 매핑. framework-agnostic —
 * React copy(makeCopyCellItem)·Vue copy 어댑터가 공유한다.
 *
 * 매핑: null/undefined→''(빈문자, "null"/"undefined" 아님) · object(배열 포함)→JSON.stringify ·
 *       그 외(string/number/boolean)→String.
 */
export function cellValueToClipboardText(cell: { getValue: () => unknown }): string {
  const v = cell.getValue();
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}
