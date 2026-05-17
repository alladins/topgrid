/**
 * @file useDebouncedCallback — useRef + setTimeout 기반 debounce 헬퍼 훅 (G-003, MOD-GRID-02).
 *
 * lodash 의존 없음 (C-21 + AC-003).
 * unmount 시 pending timeout cleanup (C-12 + AC-004).
 *
 * @typeParam TArgs - debounced 함수 파라미터 타입 (tuple, C-4 strict).
 * @param fn - debounce 대상 함수 (최신 참조 자동 유지).
 * @param ms - 대기 시간. 0 이하이면 fn 직접 반환 (동기).
 * @returns ms > 0: debounced wrapper. ms <= 0: fn 그대로 반환.
 *
 * @remarks
 * **Rules of Hooks**: `useRef`/`useEffect`/`useCallback` 은 항상 unconditional 호출.
 * `ms <= 0` 시 fn 직접 반환은 모든 hook 호출 이후의 조건부 return — hook 순서 고정 보장.
 *
 * @see G-003-spec.md Section 2.2 + Section 11.2 Step 2
 * @see G-003-spec.md Section 11.3 — Rules of Hooks 위험 완화
 * @internal
 */

import { useCallback, useEffect, useRef } from 'react';

/**
 * `useDebouncedCallback` — 입력 함수를 debounce 처리하는 내부 헬퍼 훅.
 *
 * `ms <= 0` 시 fn을 그대로 반환 (동기 호출, AC-002/EC-01/EC-02).
 * `ms > 0` 시 마지막 호출 후 ms 경과 시 1회 발화 (AC-003, EC-03).
 *
 * @typeParam TArgs - debounced 함수의 파라미터 타입 (tuple). `unknown[]` 기반 variadic generic (D5, C-4).
 * @param fn - debounce 대상 원본 함수. 최신 참조는 `useRef`로 자동 유지 (stale closure 방지).
 * @param ms - debounce 대기 시간 (ms). `0` 이하이면 debounce 없음 (fn 즉시 반환).
 * @returns `ms > 0` 시 debounced wrapper 함수, `ms <= 0` 시 원본 fn.
 *
 * @example ms=0 — 동기 (G-002 호환)
 * ```ts
 * const cb = useDebouncedCallback(onStateChange, 0);
 * // cb === onStateChange (동기 참조)
 * ```
 *
 * @example ms=300 — URL 동기화 debounce
 * ```ts
 * const cb = useDebouncedCallback(syncToUrl, 300);
 * // 300ms 내 연속 호출 → 마지막 1회만 syncToUrl 발화
 * ```
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  ms: number,
): (...args: TArgs) => void {
  // 최신 fn 참조 유지 — stale closure 방지 (매 render fn 갱신)
  const fnRef = useRef<(...args: TArgs) => void>(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  // pending timer ref
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // unmount cleanup — pending timeout 누수 방지 (AC-004, C-12)
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // debounced wrapper — useCallback 항상 호출 (Rules of Hooks 준수)
  // ms 변경 시 새 wrapper 생성 (deps: [ms])
  const debounced = useCallback(
    (...args: TArgs) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fnRef.current(...args);
      }, ms);
    },
    [ms],
  );

  // ms <= 0: fn 직접 반환 (동기) — 모든 hook 호출 이후 조건부 return (Rules of Hooks 안전)
  // EC-01 (ms=0), EC-02 (ms 음수) 모두 처리
  if (ms <= 0) {
    return fn;
  }

  return debounced;
}
