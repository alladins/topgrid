/**
 * `computeColumnWindow` — 컬럼(가로) 가상화 순수 코어 (MOD-GRID-27 G-1).
 *
 * **핵심 불변식**: 핀(pinned) 컬럼은 가상화 집합에 절대 포함되지 않고 항상 렌더된다. padding 은
 * 스킵된 *center* 컬럼 너비만 합산하며 핀 컬럼 너비는 절대 포함하지 않는다. React·virtualizer
 * 무의존(순수) → node 전수 검증.
 *
 * center 컬럼 = 전체 leaf − (pinnedLeft ∪ pinnedRight), 순서 보존. `centerStartIndex`/
 * `centerEndIndex`(inclusive)는 가로 virtualizer 가 center 컬럼에 대해 산출한 윈도 범위다.
 */

export interface ColumnWindowInput {
  /** 전체 leaf 컬럼 id (표시 순서). */
  leafColumnIds: readonly string[];
  /** 컬럼 id → 너비 px(`column.getSize()`). 누락 id 는 0 으로 취급. */
  columnWidths: Readonly<Record<string, number>>;
  /** 좌측 핀 컬럼 id (순서). */
  pinnedLeftIds: readonly string[];
  /** 우측 핀 컬럼 id (순서). */
  pinnedRightIds: readonly string[];
  /** center 윈도 시작 인덱스(center 배열 기준). 빈 center → 무시. */
  centerStartIndex: number;
  /** center 윈도 끝 인덱스(inclusive). */
  centerEndIndex: number;
}

export interface ColumnWindow {
  /** 렌더할 컬럼 id: `[...pinnedLeft, ...windowCenter, ...pinnedRight]`. */
  renderedColumnIds: string[];
  /** 윈도 앞 스킵된 center 컬럼 너비 합(px) — 핀 너비 미포함. */
  leftPadPx: number;
  /** 윈도 뒤 스킵된 center 컬럼 너비 합(px) — 핀 너비 미포함. */
  rightPadPx: number;
}

export function computeColumnWindow(input: ColumnWindowInput): ColumnWindow {
  const {
    leafColumnIds,
    columnWidths,
    pinnedLeftIds,
    pinnedRightIds,
    centerStartIndex,
    centerEndIndex,
  } = input;

  const pinned = new Set<string>([...pinnedLeftIds, ...pinnedRightIds]);
  const centerIds = leafColumnIds.filter((id) => !pinned.has(id));
  const widthOf = (id: string): number => columnWidths[id] ?? 0;

  if (centerIds.length === 0) {
    // 전부 핀 — center 윈도 없음, padding 0.
    return {
      renderedColumnIds: [...pinnedLeftIds, ...pinnedRightIds],
      leftPadPx: 0,
      rightPadPx: 0,
    };
  }

  // 윈도 범위를 center 경계로 클램프(음수/초과 방어).
  const start = Math.max(0, centerStartIndex);
  const end = Math.min(centerIds.length - 1, centerEndIndex);
  const windowCenter = start <= end ? centerIds.slice(start, end + 1) : [];

  let leftPadPx = 0;
  for (let i = 0; i < start; i++) leftPadPx += widthOf(centerIds[i]);
  let rightPadPx = 0;
  for (let i = end + 1; i < centerIds.length; i++) rightPadPx += widthOf(centerIds[i]);

  return {
    renderedColumnIds: [...pinnedLeftIds, ...windowCenter, ...pinnedRightIds],
    leftPadPx,
    rightPadPx,
  };
}
