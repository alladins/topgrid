/**
 * undo/redo 명령 + 스택 타입 — MOD-GRID-23 G-2.
 *
 * 제네릭 command 스택(Option B, advisor): `@topgrid/grid-pro-tracking` 가 연산 히스토리·redo·
 * 상태복원을 노출하지 않으므로([[LESS-005]]) tracking 위에 외부 명령 스택을 둔다. 각 명령은
 * 자신의 `undo`/`redo` 부작용(tracking mutator 호출)을 안다.
 */

/** undo/redo 단위 명령. `undo`/`redo` 는 부작용(보통 tracking mutator 호출). */
export interface UndoRedoCommand {
  /** 이 명령을 되돌린다. */
  undo: () => void;
  /** 이 명령을 다시 적용한다. */
  redo: () => void;
  /** 디버깅/UI 라벨(선택). */
  label?: string;
}

/** 순수 command 스택 상태(불변). */
export interface CommandStackState {
  readonly undoStack: readonly UndoRedoCommand[];
  readonly redoStack: readonly UndoRedoCommand[];
}

/** `useUndoRedo` 반환 표면. */
export interface UndoRedoAPI {
  /** undo 가능 여부(undo 스택 비어있지 않음). */
  canUndo: boolean;
  /** redo 가능 여부(redo 스택 비어있지 않음). */
  canRedo: boolean;
  /** 이미 수행된 동작의 명령을 기록한다. redo 스택을 비운다(새 분기). */
  push: (command: UndoRedoCommand) => void;
  /** 최근 명령을 되돌린다(`undo()` 실행 후 redo 스택으로 이동). no-op if 비어있음. */
  undo: () => void;
  /** 되돌린 명령을 다시 적용한다(`redo()` 실행 후 undo 스택으로 이동). no-op if 비어있음. */
  redo: () => void;
  /** 양 스택을 비운다(예: commit 후). */
  clear: () => void;
}
