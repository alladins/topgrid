import type { CommandStackState, UndoRedoCommand } from './types';

/**
 * 순수 command 스택 트랜지션 — MOD-GRID-23 G-2. 부작용 없음(명령 실행은 호출부/훅 담당).
 * React 무관이라 node 에서 전수 검증된다.
 */

export const EMPTY_STACK: CommandStackState = { undoStack: [], redoStack: [] };

/**
 * 명령을 undo 스택에 쌓고 **redo 스택을 비운다**(새 동작 = 분기 → 기존 redo 무효).
 */
export function pushCommand(
  state: CommandStackState,
  command: UndoRedoCommand,
): CommandStackState {
  return { undoStack: [...state.undoStack, command], redoStack: [] };
}

/**
 * undo 스택 top 을 꺼내 redo 스택으로 옮긴다. 실행할 명령을 함께 반환(없으면 null).
 */
export function popUndo(state: CommandStackState): {
  state: CommandStackState;
  command: UndoRedoCommand | null;
} {
  if (state.undoStack.length === 0) return { state, command: null };
  const command = state.undoStack[state.undoStack.length - 1];
  return {
    state: {
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, command],
    },
    command,
  };
}

/**
 * redo 스택 top 을 꺼내 undo 스택으로 옮긴다. 실행할 명령을 함께 반환(없으면 null).
 */
export function popRedo(state: CommandStackState): {
  state: CommandStackState;
  command: UndoRedoCommand | null;
} {
  if (state.redoStack.length === 0) return { state, command: null };
  const command = state.redoStack[state.redoStack.length - 1];
  return {
    state: {
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, command],
    },
    command,
  };
}
