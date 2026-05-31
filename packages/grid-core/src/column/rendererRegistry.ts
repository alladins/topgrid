/**
 * @topgrid/grid-core — Renderer Registry.
 *
 * MOD-GRID-04 G-001: type → cell 컴포넌트 매핑 registry.
 *
 * **Wiring (ADR-MOD-GRID-REFACTOR-2026-05-17-002 + ADR-018)**: `@topgrid/grid-renderers`
 * registers `text`/`number`/`date`/`dateTime`/`badge`/`link`/`tag`/`progress` adapters via a
 * `import '@topgrid/grid-renderers'` side-effect (replacing 8 placeholders).
 * When grid-renderers is **not** imported, the placeholders below act as a
 * graceful fallback — every `TopgridColumnType` still produces a renderable
 * `ReactNode` (`String(value)` / Y-N for `boolean`). Module-load order matters:
 * consumer must `import '@topgrid/grid-renderers'` (typically once at app entry)
 * before rendering `<Grid>` to receive the adapters; otherwise placeholder
 * `String(value)` is rendered. `boolean` Y/N is unchanged regardless.
 * `icon` stays placeholder (D-1A — structural: IconCellProps.icon is ReactNode).
 * `checkbox` is bypassed by `createColumns.ts:96-108`'s DisplayColumnDef branch.
 *
 * @see createColumns
 * @see AC-003, D1, D5
 */

import type { TopgridColumnType, RendererFn, RendererRegistry } from './types';

/**
 * 기본 rendererRegistry (Map).
 *
 * - ADR-002+018 적용 후: `import '@topgrid/grid-renderers'` 시점에 `text`/`number`/
 *   `date`/`dateTime`/`badge`/`link`/`tag`/`progress` 8개 placeholder 가 실 컴포넌트 어댑터로 교체됨.
 *   `boolean` (Y/N) / `icon` (placeholder) / `checkbox` (registry 우회) 는 변경 없음.
 * - grid-renderers 미import 시: 11 placeholder 가 fallback 으로 동작 (graceful degradation).
 * - `checkbox` 는 DisplayColumnDef 로 분기 (AC-006, D5) — registry 우선순위 낮음.
 * - D1: type 미등록 시 `createColumns` 가 AC-007 fallback 적용.
 *
 * @example
 * ```typescript
 * // 사용자 커스텀 renderer 주입 (덮어쓰기)
 * registerRenderer('number', (info) => <CustomNumberCell value={info.getValue()} />);
 * ```
 *
 * @see registerRenderer
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-002 (cross-package wiring)
 */
export const defaultRendererRegistry: RendererRegistry = new Map<TopgridColumnType, RendererFn>([
  // ADR-002 wired → NumberCell adapter (fallback: plain text).
  ['number', (info) => String(info.getValue() ?? '')],
  // Always Y/N — not wired by grid-renderers (no BooleanCell).
  ['boolean', (info) => (info.getValue() ? 'Y' : 'N')],
  // ADR-002 wired → DateCell({ format: 'datetime' }) (fallback: plain text).
  ['dateTime', (info) => String(info.getValue() ?? '')],
  // ADR-002 wired → DateCell adapter (fallback: plain text).
  ['date', (info) => String(info.getValue() ?? '')],
  // ADR-002 wired → TextCell adapter (fallback: plain text).
  ['text', (info) => String(info.getValue() ?? '')],
  // ADR-002 wired → StatusBadgeCell adapter (fallback: plain text).
  ['badge', (info) => String(info.getValue() ?? '')],
  // ADR-002 wired → LinkCell adapter (fallback: plain text).
  ['link', (info) => String(info.getValue() ?? '')],
  // Placeholder kept — IconCellProps.icon: ReactNode required (D-1A structural block, ADR-018 deferred).
  ['icon', (info) => String(info.getValue() ?? '')],
  // checkbox: DisplayColumnDef 분기로 우회됨 (createColumns.ts:96-108). registry entry 는 fallback placeholder.
  ['checkbox', (info) => String(info.getValue() ?? '')],
  // ADR-018 wired → TagCell adapter (fallback: plain text).
  ['tag', (info) => String(info.getValue() ?? '')],
  // ADR-018 wired → ProgressCell adapter (fallback: plain text).
  ['progress', (info) => String(info.getValue() ?? '')],
]);

/**
 * 외부 renderer 등록 함수.
 *
 * L2: AG Grid `components` 주입 패턴 참조 (R-A).
 * `Map.set()` 사용 — `any` 없음 (C-4).
 *
 * ADR-002 의 `@topgrid/grid-renderers/wireRegistry.ts` 가 이 함수로 8 슬롯
 * (text/number/date/dateTime/badge/link/tag/progress) 을 wire 한다. 사용자 커스텀
 * renderer 도 동일 API 로 덮어쓰기 가능 (마지막 호출이 우선).
 *
 * @param type - 등록할 `TopgridColumnType`
 * @param fn - cell renderer 함수
 * @param registry - 대상 registry (기본값: `defaultRendererRegistry`)
 *
 * @example
 * ```typescript
 * // 사용자 커스텀 renderer
 * registerRenderer('number', (info) => {
 *   const value = info.getValue();
 *   return typeof value === 'number' ? value.toLocaleString() : String(value ?? '');
 * });
 * ```
 *
 * @see defaultRendererRegistry
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-002
 * @see AC-003, D1, OQ-04
 */
export function registerRenderer<TData = unknown>(
  type: TopgridColumnType,
  fn: RendererFn<TData>,
  registry: RendererRegistry<TData> = defaultRendererRegistry as RendererRegistry<TData>,
): void {
  registry.set(type, fn);
}
