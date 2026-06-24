/**
 * `clampGoToPage` — go-to-page 입력 문자열을 유효한 0-based 페이지 인덱스로 변환 (MOD-GRID-49 G-2).
 *
 * 순수 함수 (node 검증). UI(`GoToPageInput`)와 분리해 경계 로직을 단독 테스트한다.
 * XX Grid `paginationGoToPage` / xxxx pager 입력 대응.
 *
 * @param raw   사용자 입력 (1-based, 예: "7"). 공백 trim.
 * @param pageCount 전체 페이지 수 (≥ 0).
 * @returns 클램프된 **0-based** 페이지 인덱스. 비수치/빈 입력/페이지 없음 → `null` (no-op).
 *
 * - `"7"`, count 10  → 6   (1-based 7 → 0-based 6)
 * - `"0"` / 음수      → 0   (하한 클램프)
 * - `">count"`        → count-1 (상한 클램프)
 * - `"abc"` / `""`    → null (무시)
 * - 소수 `"3.9"`      → floor → 2
 */
export function clampGoToPage(raw: string, pageCount: number): number | null {
  if (pageCount <= 0) return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  const oneBased = Math.floor(parsed);
  // 1-based 입력을 [1, pageCount] 로 클램프한 뒤 0-based 로 변환.
  const clamped = Math.min(Math.max(oneBased, 1), pageCount);
  return clamped - 1;
}
