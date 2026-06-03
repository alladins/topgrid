/** 셀 코멘트 훅 타입 — MOD-GRID-23 G-4. */

/** `useCellComments` 옵션. */
export interface UseCellCommentsOptions {
  /** storage 키(필수). */
  storageKey: string;
  /** `'local'`(기본) | `'session'`. */
  storage?: 'local' | 'session';
  /** 봉투 버전 — 불일치 시 기존 데이터 무시. @default 1 */
  version?: number;
}

/** `useCellComments` 반환 표면. */
export interface CellCommentsAPI {
  /** 현 코멘트 Map(`commentKey` → text). 렌더 간 안정 참조(미변경 시). */
  comments: ReadonlyMap<string, string>;
  /** 셀 코멘트 조회(없으면 undefined). */
  getComment: (rowKey: string, columnId: string) => string | undefined;
  /** 셀 코멘트 설정(빈 문자열도 저장 — 삭제는 deleteComment). */
  setComment: (rowKey: string, columnId: string, text: string) => void;
  /** 셀 코멘트 삭제. */
  deleteComment: (rowKey: string, columnId: string) => void;
  /** 전체 삭제. */
  clear: () => void;
}
