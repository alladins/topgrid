/**
 * `useFullRowEdit` — 행 단위 편집 상태 훅 (MOD-GRID-50 G-2).
 *
 * `EditableCell.isEditing="parent 소유"` 패턴을 셀→행으로 승격. 한 행의 모든 편집 셀이 동시에
 * 에디터가 되고, **행 단위로 한 번에** commit(단일 onRowEdit delta) 또는 cancel(전부 폐기)한다.
 * controlled-data: 실제 데이터 적용은 소비자(onRowEdit)가 담당(applyRowTransaction/onUpdateRow 동형).
 *
 * ★draft 는 state(렌더용)와 ref(동기 읽기용)를 함께 유지한다 — "저장" 버튼 클릭 시 포커스 셀의
 * blur→onCommit→setDraftCell 이 같은 틱에 일어나므로, commitRow 가 stale state 클로저 대신
 * draftRef 를 읽어 마지막 셀 편집을 유실하지 않는다.
 *
 * @since MOD-GRID-50 (Track 2 — AG `editType:'fullRow'` 대응)
 */

import { useCallback, useRef, useState } from 'react';

import { applyRowDraft } from './applyRowDraft';

export interface UseFullRowEditOptions<T> {
  /** 행 안정 식별자. */
  getRowId: (row: T) => string;
  /** 행 커밋 콜백 — 단일 delta(머지된 새 행). 소비자가 data 에 적용. */
  onRowEdit: (rowId: string, nextRow: T) => void;
  /** 선택: 커밋 전 검증. false 반환 시 커밋 차단(편집 유지). 예: edit-plus buildValidator 파생. */
  validateRow?: (draftRow: T) => boolean;
}

export interface FullRowEditApi<T> {
  /** 현재 편집 중인 행 id (없으면 null). */
  editingRowId: string | null;
  /** 이 행이 편집 중인가. */
  isRowEditing: (row: T) => boolean;
  /** 이 행 편집 시작(draft 초기화). */
  startRowEdit: (row: T) => void;
  /** draft 셀 갱신(field=행 키). */
  setDraftCell: (field: string, value: unknown) => void;
  /** 렌더용 현재 값(draft 우선, 없으면 원본 rowValue). */
  getDraftValue: (field: string, rowValue: unknown) => unknown;
  /** 행 커밋 — validateRow 통과 시 단일 onRowEdit 후 종료. */
  commitRow: (row: T) => void;
  /** 행 취소 — draft 폐기, emit 0. */
  cancelRow: () => void;
}

export function useFullRowEdit<T extends object>({
  getRowId,
  onRowEdit,
  validateRow,
}: UseFullRowEditOptions<T>): FullRowEditApi<T> {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  // 동기 읽기용 미러 — commitRow 가 마지막 blur 의 setDraftCell 을 즉시 반영.
  const draftRef = useRef<Record<string, unknown>>({});

  const reset = useCallback((): void => {
    draftRef.current = {};
    setDraft({});
    setEditingRowId(null);
  }, []);

  const startRowEdit = useCallback(
    (row: T): void => {
      draftRef.current = {};
      setDraft({});
      setEditingRowId(getRowId(row));
    },
    [getRowId],
  );

  const isRowEditing = useCallback(
    (row: T): boolean => editingRowId !== null && getRowId(row) === editingRowId,
    [editingRowId, getRowId],
  );

  const setDraftCell = useCallback((field: string, value: unknown): void => {
    draftRef.current = { ...draftRef.current, [field]: value };
    setDraft(draftRef.current);
  }, []);

  const getDraftValue = useCallback(
    (field: string, rowValue: unknown): unknown => (field in draft ? draft[field] : rowValue),
    [draft],
  );

  const cancelRow = useCallback((): void => {
    reset();
  }, [reset]);

  const commitRow = useCallback(
    (row: T): void => {
      const nextRow = applyRowDraft(row, draftRef.current);
      if (validateRow && !validateRow(nextRow)) return; // invalid → 차단, 편집 유지
      onRowEdit(getRowId(row), nextRow);
      reset();
    },
    [getRowId, onRowEdit, validateRow, reset],
  );

  return {
    editingRowId,
    isRowEditing,
    startRowEdit,
    setDraftCell,
    getDraftValue,
    commitRow,
    cancelRow,
  };
}
