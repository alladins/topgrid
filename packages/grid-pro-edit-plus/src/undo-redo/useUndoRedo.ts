import { useCallback, useReducer, useRef } from 'react';
import type { CommandStackState, UndoRedoAPI, UndoRedoCommand } from './types';
import { EMPTY_STACK, popRedo, popUndo, pushCommand } from './commandStack';

/**
 * 제네릭 undo/redo 명령 스택 훅 — MOD-GRID-23 G-2.
 *
 * 동작을 수행한 뒤 그 동작의 `{undo, redo}` 명령을 `push` 한다. tracking 연산 명령은
 * `makeUpdateCommand`/`makeAddCommand` 로 만든다([[bindings]]). tracking 은 연산 히스토리를
 * 노출하지 않으므로 본 스택이 외부 히스토리 역할을 한다(Option B, advisor).
 *
 * 명령의 부작용은 **state updater 밖**(이벤트 핸들러)에서 실행한다 — ref 가 진실, `bump` 는
 * 재렌더만 유발(StrictMode 이중 실행 회피).
 */
export function useUndoRedo(): UndoRedoAPI {
  const stackRef = useRef<CommandStackState>(EMPTY_STACK);
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const push = useCallback((command: UndoRedoCommand): void => {
    stackRef.current = pushCommand(stackRef.current, command);
    bump();
  }, []);

  const undo = useCallback((): void => {
    const { state, command } = popUndo(stackRef.current);
    if (!command) return;
    command.undo();
    stackRef.current = state;
    bump();
  }, []);

  const redo = useCallback((): void => {
    const { state, command } = popRedo(stackRef.current);
    if (!command) return;
    command.redo();
    stackRef.current = state;
    bump();
  }, []);

  const clear = useCallback((): void => {
    stackRef.current = EMPTY_STACK;
    bump();
  }, []);

  return {
    canUndo: stackRef.current.undoStack.length > 0,
    canRedo: stackRef.current.redoStack.length > 0,
    push,
    undo,
    redo,
    clear,
  };
}
