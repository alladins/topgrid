/**
 * grid-core `buildTableOptions` = `@topgrid/grid-core-headless` 의 React 얇은 어댑터 (W1 Phase 0).
 *
 * 순수 props→TableOptions 매핑 로직은 framework-agnostic headless 패키지로 추출됐다(table-core 기반).
 * 여기서는 **유일한 React 결합이던 체크박스 컬럼(`createCheckboxColumn`)만 주입**한다.
 * 2-arg API 를 보존 → 유일 호출부(`Grid.tsx`)는 무수정. selection 정규화/prepend 정책은 headless 소관.
 *
 * @see docs/internal/ROADMAP-MULTIFRAMEWORK-CHART.md §9·§10 (Phase 0)
 */
import { buildTableOptions as headlessBuildTableOptions } from '@topgrid/grid-core-headless';
import type { BuildOptionsResult, GridStateBag } from '@topgrid/grid-core-headless';

import type { GridProps } from '../types';
import { createCheckboxColumn } from './CheckboxColumn';

// 백워드 호환 re-export (기존 grid-core 내부 타입 소비처 보존).
export type { BuildOptionsResult, GridStateBag } from '@topgrid/grid-core-headless';

/**
 * `enable*` props → `TableOptions` 매핑 (headless 위임 + React 체크박스 주입).
 */
export function buildTableOptions<TData>(
  props: GridProps<TData>,
  state: GridStateBag,
): BuildOptionsResult<TData> {
  return headlessBuildTableOptions<TData>(props, state, (mode, selectAllPages) =>
    createCheckboxColumn<TData>(mode, selectAllPages),
  );
}
