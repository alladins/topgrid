/**
 * @topgrid/grid-core — row reorder 순수 변환 (MOD-GRID-33 G-3).
 *
 * `from` 의 원소를 결과 배열에서 인덱스 `to` 에 오도록 이동한다. splice 제거→삽입이 아래/위 이동의 인덱스
 * 보정을 자연히 처리한다(from<to 면 제거 후 뒤 인덱스가 당겨지므로 to 가 곧 최종 위치). no-op·경계는 원본
 * 복사 반환(불변). 소비자가 `onRowReorder(from,to)` 콜백에서 자기 data 에 적용한다.
 */

export function moveRow<T>(rows: readonly T[], from: number, to: number): T[] {
  const n = rows.length;
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= n ||
    to >= n
  ) {
    return rows.slice();
  }
  const next = rows.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}
