import type { ChangeTrackingAPI } from '@topgrid/grid-pro-tracking';
import type { UndoRedoCommand } from './types';

/**
 * tracking 연산 → undo/redo 명령 팩토리 — MOD-GRID-23 G-2.
 *
 * **충실히 지원되는 연산만** 바인딩한다([[LESS-005]]): `update`(이전 값 포착), `add`(redo 시
 * 포착한 키 강제 재주입). **기존(편집된) 행의 delete 는 충실 undo 불가** — tracking 의
 * `undoRow` 가 *마운트 스냅샷*으로 복원해 세션 편집을 잃기 때문(아래 한계). 그런 경우 소비자는
 * 직접 `UndoRedoCommand` 를 만들어 `push` 한다(한계 수용 시).
 *
 * 사용 패턴: **동작을 먼저 수행한 뒤** 명령을 `push` 한다(스택은 동작을 자동 실행하지 않음).
 */

/**
 * `updateRow` 의 undo/redo 명령. `priorRow` = **업데이트 직전** 행 값(patch 대상 필드의 이전
 * 값을 포착) → undo 는 그 이전 값으로 `updateRow`.
 *
 * @example
 * const prior = tracking.rows.find((r) => r.id === key)!; // 업데이트 전 값
 * tracking.updateRow(key, patch);
 * undoRedo.push(makeUpdateCommand(tracking, key, prior, patch));
 */
export function makeUpdateCommand<TData>(
  tracking: Pick<ChangeTrackingAPI<TData>, 'updateRow'>,
  key: string,
  priorRow: TData,
  patch: Partial<TData>,
): UndoRedoCommand {
  const prior: Partial<TData> = {};
  for (const k of Object.keys(patch) as Array<keyof TData>) {
    prior[k] = priorRow[k];
  }
  return {
    label: 'update',
    redo: () => {
      tracking.updateRow(key, patch);
    },
    undo: () => {
      tracking.updateRow(key, prior);
    },
  };
}

/**
 * `addRow` 의 undo/redo 명령. **포착한 `key` 를 redo 시 seed 의 `rowKeyField` 에 강제 주입**한다
 * — 그렇지 않으면 tracking 이 redo 때 새 UUID 를 발급해 후속 스택 항목의 키 참조가 깨진다
 * (advisor 지적). undo = `deleteRow(key)`(added 행은 제거됨).
 *
 * **제약**: 문자열 `rowKey` 필드 전용. 함수형 `rowKey` 는 커스텀 명령을 `push` 하라.
 *
 * @example
 * const key = tracking.addRow(seed);
 * undoRedo.push(makeAddCommand(tracking, key, seed, 'id'));
 */
export function makeAddCommand<TData>(
  tracking: Pick<ChangeTrackingAPI<TData>, 'addRow' | 'deleteRow'>,
  key: string,
  seed: Partial<TData>,
  rowKeyField: keyof TData & string,
): UndoRedoCommand {
  const seedWithKey = { ...seed, [rowKeyField]: key } as Partial<TData>;
  return {
    label: 'add',
    redo: () => {
      tracking.addRow(seedWithKey);
    },
    undo: () => {
      tracking.deleteRow(key);
    },
  };
}

/**
 * `deleteRow` 의 undo/redo 명령. undo 경로는 행이 **세션에서 추가된 행인지(`'added'`)** vs
 * **기존 행인지(`'existing'`)** 에 따라 다르다:
 * - `'added'`: undo = 포착한 행+키로 **재추가**(`addRow`), redo = `deleteRow`.
 * - `'existing'`: undo = `undoRow(key)`(마운트 스냅샷 복원), redo = `deleteRow`.
 *
 * **한계([[LESS-005]], §5.2 P23-1)**: `'existing'` 의 undo 는 *마운트 스냅샷* 복원이므로 삭제 전
 * 세션 편집이 있었다면 그 편집은 **손실**된다(편집되지 않은 기존 행에서만 충실). 편집된 기존 행의
 * 충실한 삭제-undo 는 tracking 의 새 seam 이 필요하다.
 *
 * @param deletedRow `'added'` 재추가용 행 값(삭제 시점). `'existing'` 에서는 미사용.
 * @param kind       삭제 전 행 종류.
 * @param rowKeyField `'added'` 재추가 시 키 강제 주입 필드.
 */
export function makeDeleteCommand<TData>(
  tracking: Pick<ChangeTrackingAPI<TData>, 'addRow' | 'deleteRow' | 'undoRow'>,
  key: string,
  deletedRow: TData,
  kind: 'added' | 'existing',
  rowKeyField: keyof TData & string,
): UndoRedoCommand {
  if (kind === 'added') {
    const seedWithKey = { ...deletedRow, [rowKeyField]: key } as Partial<TData>;
    return {
      label: 'delete(added)',
      redo: () => {
        tracking.deleteRow(key);
      },
      undo: () => {
        tracking.addRow(seedWithKey);
      },
    };
  }
  return {
    label: 'delete(existing)',
    redo: () => {
      tracking.deleteRow(key);
    },
    undo: () => {
      // restores the mount snapshot (faithful for an unedited existing row; see limitation).
      tracking.undoRow(key);
    },
  };
}
