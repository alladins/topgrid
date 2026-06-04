/**
 * Internal — 빈 결과 상태 `<tr><td colSpan>...</td></tr>` 1행 렌더.
 *
 * G-003 D6: G-001 `Grid.tsx` L149-157 의 inline empty markup 을 추출하여 1라인 호출로 치환.
 * G-001 의 `emptyText` prop 동작은 보존 (`text` 인자) + 신규 `slot` (ReactNode) 우선순위 추가.
 *
 * @see G-003-spec.md Section 2.3 + D6/D7/D12
 */

import type { ReactNode } from 'react';

/**
 * `<EmptyState>` props.
 */
export interface EmptyStateProps {
  /**
   * `<td colSpan>` 값. `Grid.tsx` 에서 `table.getAllLeafColumns().length` 로 계산 후 전달 (D12).
   * 0 이거나 미정 시 안전을 위해 1 로 fallback.
   */
  colSpan: number;
  /**
   * 사용자 정의 ReactNode slot. 우선순위 1 (D7).
   * 제공 시 `text` / `defaultText` 무시.
   * `exactOptionalPropertyTypes: true` 환경에서 `props.emptyState?: ReactNode` 직접 전달 호환을
   * 위해 `undefined` 명시 union.
   */
  slot?: ReactNode | undefined;
  /**
   * 사용자 정의 텍스트. 우선순위 2 (D7).
   * `slot` 미제공 + `text` 제공 시 그대로 렌더 (`text === ''` 도 사용자 의도 존중 — EC-03).
   * `exactOptionalPropertyTypes: true` 환경에서 `props.emptyText?: string` 직접 전달 호환을
   * 위해 `undefined` 명시 union.
   */
  text?: string | undefined;
  /**
   * 디폴트 fallback 텍스트. 우선순위 3 (D7).
   * `slot` + `text` 둘 다 미제공 시 사용 (`Grid.tsx` 의 `DEFAULT_EMPTY_TEXT` 값 전달).
   */
  defaultText?: string | undefined;
}

/**
 * 빈 결과 1행을 `<tr><td colSpan>...</td></tr>` 로 렌더한다.
 *
 * 우선순위 (D7):
 * 1. `slot` (ReactNode)
 * 2. `text` (string — `''` 빈 문자열도 사용자 의도로 간주)
 * 3. `defaultText` (string fallback)
 *
 * @param props - {@link EmptyStateProps}.
 * @returns 빈 상태 `<tr>` 1행.
 *
 * @see G-003-spec.md Section 2.3 + D6/D7
 */
export function EmptyState({ colSpan, slot, text, defaultText }: EmptyStateProps): JSX.Element {
  // D7 우선순위: slot → text → defaultText. text === '' 도 사용자 의도 존중 (EC-03).
  const content: ReactNode = slot !== undefined ? slot : text !== undefined ? text : defaultText;
  // MOD-GRID-28: role=grid 컨테이너 안의 빈-상태 행도 grid 계약(row→gridcell)을 충족해야 axe
  // aria-required-children 위반이 없다(빈 그리드도 valid). 데이터 시퀀스 밖이라 aria-rowindex 미부여.
  return (
    <tr role="row">
      <td role="gridcell" colSpan={colSpan || 1} className="px-4 py-10 text-center text-gray-400">
        {content}
      </td>
    </tr>
  );
}
