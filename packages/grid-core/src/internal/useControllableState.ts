/**
 * @file useControllableState — controlled vs uncontrolled state 추상화 헬퍼.
 *
 * shadcn/Radix의 `useControllableState` 패턴을 참조하여 독립 구현 (MIT, 코드 차용 아닌 패턴 참조).
 * `value`가 `undefined`면 uncontrolled(내부 useState), 정의된 값이면 controlled(외부 state 우선).
 *
 * @remarks
 * D4 (C-29 exactOptionalPropertyTypes): `value: T | undefined` union 명시 패턴 적용.
 * optional (`value?: T`)이 아닌 union 명시 → caller가 `opts.state?.sorting` (T | undefined)을
 * 직접 forwarding 해도 TS2375 없음.
 *
 * @see G-002-spec.md Section 2.3 + Section 11.2 Step 2 + D4
 */

import { useRef, useState } from 'react';

// Node `process` global 의 minimal local declare — `@types/node` 미설치 환경 대비 (C-4 준수).
// `useDeprecationWarn.ts` L18 + `Grid.tsx` L54 + `useGridImperativeHandle.ts` L44 와 동일 패턴.
declare const process: { env: { NODE_ENV?: string } } | undefined;

/**
 * `useControllableState<T>` 파라미터 타입.
 *
 * @typeParam T - state 값 타입.
 *
 * @remarks
 * **C-29 exactOptionalPropertyTypes 적용 (D4)**:
 * `value` 필드는 `value?: T`(optional)가 아닌 `value: T | undefined` union 명시.
 * caller의 `opts.state?.sorting` (SortingState | undefined)을 직접 전달 가능 (TS2375 없음).
 * ADR-MOD-GRID-01-004 EmptyStateProps `string | undefined` union 명시 선례와 동일.
 */
export interface UseControllableStateOptions<T> {
  /**
   * controlled 모드 외부 값.
   * `undefined`면 uncontrolled — 내부 useState를 사용.
   * 정의된 값이면 controlled — 내부 state를 무시하고 이 값을 반환.
   *
   * @remarks union 명시 (`T | undefined`), optional (`?: T`) 아님 — C-29 D4.
   */
  value: T | undefined;
  /**
   * uncontrolled 모드 초기값 (필수).
   * controlled 모드(`value !== undefined`)에서는 무시됨.
   */
  defaultValue: T;
  /**
   * 값 변경 통보 콜백.
   * controlled/uncontrolled 양쪽에서 호출됨.
   */
  onChange?: (next: T) => void;
}

/**
 * 단일 state의 controlled/uncontrolled 모드를 추상화하는 내부 헬퍼 훅.
 *
 * - `opts.value !== undefined` → controlled: 외부 value를 반환, 내부 state 변경 없음.
 * - `opts.value === undefined` → uncontrolled: 내부 useState로 관리.
 * - setter는 `T | ((prev: T) => T)` updater 함수 형태 지원 (`OnChangeFn<T>` 호환).
 *
 * **D6 경고**: mount 후 controlled/uncontrolled 모드 전환 시 dev mode `console.warn` 1회 발생.
 *
 * @typeParam T - state 값 타입.
 * @param opts - {@link UseControllableStateOptions}
 * @returns `[value, setValue]` — value는 현재 state, setValue는 `OnChangeFn<T>` 호환 setter.
 *
 * @example
 * ```ts
 * // uncontrolled (value=undefined → 기본값 사용)
 * const [sorting, setSorting] = useControllableState<SortingState>({
 *   value: undefined,
 *   defaultValue: [],
 *   onChange: (next) => onStateChange({ ...snapshot, sorting: next }, 'sorting'),
 * });
 *
 * // controlled (value=externalSorting → 외부 state 반환)
 * const [sorting, setSorting] = useControllableState<SortingState>({
 *   value: externalSorting,
 *   defaultValue: [],
 *   onChange: (next) => onStateChange({ ...snapshot, sorting: next }, 'sorting'),
 * });
 * ```
 *
 * @see G-002-spec.md Section 2.3 + Section 11.2 Step 2
 * @see UseControllableStateOptions
 * @internal
 */
export function useControllableState<T>(
  opts: UseControllableStateOptions<T>,
): [T, (updater: T | ((prev: T) => T)) => void] {
  const isControlled = opts.value !== undefined;

  const [internalValue, setInternalValue] = useState<T>(
    isControlled ? (opts.value as T) : opts.defaultValue,
  );

  // D6: mount 후 controlled ↔ uncontrolled 전환 경고
  const wasControlled = useRef(isControlled);
  if (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') {
    if (wasControlled.current !== isControlled) {
      console.warn(
        '[useControllableState] controlled/uncontrolled mode changed after mount. ' +
          'This is not recommended (React controlled component standard).',
      );
    }
  }
  wasControlled.current = isControlled;

  /**
   * `OnChangeFn<T>` 호환 setter.
   * updater가 함수면 현재 값을 인자로 호출. 값이면 그대로 사용.
   */
  const setValue = (updater: T | ((prev: T) => T)): void => {
    const prev = isControlled ? (opts.value as T) : internalValue;
    const next =
      typeof updater === 'function'
        ? (updater as (prev: T) => T)(prev)
        : updater;

    if (!isControlled) {
      setInternalValue(next);
    }
    opts.onChange?.(next);
  };

  return [isControlled ? (opts.value as T) : internalValue, setValue];
}
