import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CellCommentsAPI, UseCellCommentsOptions } from './types';
import {
  commentKey,
  deserializeComments,
  serializeComments,
} from './commentStore';

function resolveStorage(kind: 'local' | 'session'): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    // storage access can throw (privacy mode / disabled)
    return null;
  }
}

/**
 * 셀 코멘트 + storage 영속 훅 — MOD-GRID-23 G-4 (AC ③).
 *
 * 마운트 시 storage 에서 hydrate, 변경 시 persist(버전 봉투). SSR/storage 비가용 시 in-memory
 * no-op(throw 없음). 순수 직렬화/키 로직은 `./commentStore`([[commentStore]], node 검증).
 */
export function useCellComments(
  options: UseCellCommentsOptions,
): CellCommentsAPI {
  const { storageKey, storage = 'local', version = 1 } = options;
  const storageRef = useRef<Storage | null>(resolveStorage(storage));

  const [comments, setComments] = useState<Map<string, string>>(() => {
    const s = storageRef.current;
    if (!s) return new Map();
    try {
      return deserializeComments(s.getItem(storageKey), version);
    } catch {
      return new Map();
    }
  });

  // Persist on change (skip the initial render — it already hydrated from storage).
  const firstRef = useRef(true);
  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    const s = storageRef.current;
    if (!s) return;
    try {
      s.setItem(storageKey, serializeComments(comments, version));
    } catch {
      // QuotaExceededError etc. — keep in-memory state, skip persist.
      console.warn('[grid-pro-edit-plus] useCellComments: storage write skipped');
    }
  }, [comments, storageKey, version]);

  const getComment = useCallback(
    (rowKey: string, columnId: string): string | undefined =>
      comments.get(commentKey(rowKey, columnId)),
    [comments],
  );

  const setComment = useCallback(
    (rowKey: string, columnId: string, text: string): void => {
      setComments((prev) => {
        const next = new Map(prev);
        next.set(commentKey(rowKey, columnId), text);
        return next;
      });
    },
    [],
  );

  const deleteComment = useCallback(
    (rowKey: string, columnId: string): void => {
      setComments((prev) => {
        const key = commentKey(rowKey, columnId);
        if (!prev.has(key)) return prev;
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    },
    [],
  );

  const clear = useCallback((): void => {
    setComments((prev) => (prev.size === 0 ? prev : new Map()));
  }, []);

  return useMemo(
    () => ({ comments, getComment, setComment, deleteComment, clear }),
    [comments, getComment, setComment, deleteComment, clear],
  );
}
