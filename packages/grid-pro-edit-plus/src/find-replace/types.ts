/**
 * find & replace 타입 — MOD-GRID-23 G-3.
 *
 * **key 기반**(rowKey/columnId) — tracking·undo/redo(G-2)와 동일 좌표계라 바로 조합된다.
 * `@topgrid/grid-pro-range` 는 *index 기반*(`{row,col}`)이라 좌표계가 달라 **패키지 결합 안 함**
 * (선택영역 검색은 range `CellRange`→`{rowKeys,columnIds}` 3줄 소비자 어댑터; G-3 비포함). [[LESS-003]].
 */

/** 검색 옵션. */
export interface FindOptions {
  /** 대소문자 구분. @default false */
  caseSensitive?: boolean;
  /** `'substring'`=부분일치(기본) · `'whole'`=셀 전체 일치. @default 'substring' */
  matchMode?: 'substring' | 'whole';
}

/** 검색 결과 1건. `value` = 원본 셀 값(타입 보존). */
export interface CellMatch {
  rowKey: string;
  columnId: string;
  value: unknown;
}

/**
 * 치환 1건. **G-2 와 조합용**: `{rowKey, columnId}` + `prior`(undo 용 원본 값) + `next`(치환 결과).
 * `next` 는 **항상 문자열**(아래 의미 참조).
 */
export interface Replacement {
  rowKey: string;
  columnId: string;
  /** 치환 전 원본 값(타입 보존) — undo 명령 구성에 사용. */
  prior: unknown;
  /** 치환 후 값(문자열). */
  next: string;
}
