// @tomis/grid-renderers — wireRegistry (ADR-MOD-GRID-REFACTOR-2026-05-17-002)
// Side-effect wiring: registers 6 cell adapters into @tomis/grid-core's
// defaultRendererRegistry so `createColumns()` dispatches `type` → real cell.
//
// Wired slots (8): text / number / date / dateTime (bespoke +format) / badge / link (bespoke +null) / tag / progress.
// NOT wired (intentional):
//   - boolean : grid-core keeps Y/N default (no BooleanCell in grid-renderers).
//   - icon    : IconCellProps.icon is ReactNode (required), no value-only adapter possible (D-1A).
//   - checkbox: createColumns.ts:96-108 returns a DisplayColumnDef branch — registry bypassed.
//   - button/avatar: required non-value prop (onClick/name) — registry adapter pattern unsuitable
//     (widening cast would lie at runtime). Use column.cell direct wiring instead (ADR-018 D-3 X-B).
//   - aliases (statusBadge/check): accessible via grid-renderers' own Record<string, CellComponent>
//     (getRenderer/registerRenderer with string key). grid-core Map keyed by TomisColumnType
//     intentionally excludes alias keys — they're synonyms with zero added value (ADR-018 D-4 A-A).
//
// @see findings/wave3-adr-002-spec.md §3, §4
// @see ADR-MOD-GRID-REFACTOR-2026-05-17-002

import { createElement, type ComponentType } from 'react';
import type { CellContext } from '@tanstack/react-table';
import { registerRenderer, type RendererFn } from '@tomis/grid-core';
import { TextCell } from './TextCell.js';
import { NumberCell } from './NumberCell.js';
import { DateCell } from './DateCell.js';
import { StatusBadgeCell } from './StatusBadgeCell.js';
import { LinkCell } from './LinkCell.js';
import { TagCell } from './TagCell.js';
import { ProgressCell } from './ProgressCell.js';

/**
 * Adapter: wrap a `ComponentType<{ value: V }>` cell into a `RendererFn<TData>`.
 *
 * Single `as` cast isolated at the `Cell` parameter widening — mirrors the
 * `asCell` pattern in rendererRegistry.ts (ADR-014 amendment). Per-call site
 * uses `pickValue` to narrow the `unknown` from `info.getValue()` to `V`.
 *
 * @internal
 */
function adaptValueCell<TData, V>(
  Cell: ComponentType<{ value: V }>,
  pickValue: (info: CellContext<TData, unknown>) => V,
): RendererFn<TData> {
  return (info) => createElement(Cell, { value: pickValue(info) });
}

/**
 * Wire the 8 default cell adapters into grid-core's `defaultRendererRegistry`.
 *
 * Invoked once, as a side-effect of `import '@tomis/grid-renderers'`
 * (see src/index.ts). Idempotent — calling twice overwrites with identical
 * adapters. `registerRenderer` uses `Map.set`, so existing slots are replaced
 * (placeholders → adapters); unmentioned slots (boolean/icon/checkbox) retain
 * grid-core's defaults (graceful fallback — D-3A).
 *
 * ADR-018 addition (D-2 X-A1): `tag` and `progress` slots added.
 * `button`/`avatar`/`icon` remain registry-external (ADR-018 D-3 X-B / D-1 I-A).
 *
 * @internal — Not exported from package public API.
 */
export function wireDefaultRenderers(): void {
  // text → TextCell({ value })
  registerRenderer(
    'text',
    adaptValueCell(
      TextCell as ComponentType<{ value: string | number | null | undefined }>,
      (info) => info.getValue() as string | number | null | undefined,
    ),
  );

  // number → NumberCell({ value })
  registerRenderer(
    'number',
    adaptValueCell(
      NumberCell as ComponentType<{ value: number | null | undefined }>,
      (info) => info.getValue() as number | null | undefined,
    ),
  );

  // date → DateCell({ value })
  registerRenderer(
    'date',
    adaptValueCell(
      DateCell as ComponentType<{ value: string | number | Date | null | undefined }>,
      (info) => info.getValue() as string | number | Date | null | undefined,
    ),
  );

  // dateTime → DateCell({ value, format: 'datetime' }) — bespoke (extra prop)
  registerRenderer(
    'dateTime',
    (info) =>
      createElement(DateCell, {
        value: info.getValue() as string | number | Date | null | undefined,
        format: 'datetime',
      }),
  );

  // badge → StatusBadgeCell({ value })
  registerRenderer(
    'badge',
    adaptValueCell(
      StatusBadgeCell as ComponentType<{ value: string }>,
      (info) => String(info.getValue() ?? ''),
    ),
  );

  // link → LinkCell — bespoke. LinkCellProps.value is optional + exactOptionalPropertyTypes:
  // `{ value: undefined }` is not assignable to `LinkCellProps`. Split on null/undefined.
  registerRenderer('link', (info) => {
    const raw = info.getValue();
    if (raw == null) return createElement(LinkCell, {});
    return createElement(LinkCell, { value: String(raw) });
  });

  // tag → TagCell({ value }) — ADR-018 X-A1.
  // TagCellProps.value: readonly string[]. Non-array values coerced to [] (EC-08 empty → dash).
  registerRenderer(
    'tag',
    adaptValueCell(
      TagCell as ComponentType<{ value: readonly string[] }>,
      (info) => {
        const raw = info.getValue();
        return Array.isArray(raw) ? (raw as readonly string[]) : [];
      },
    ),
  );

  // progress → ProgressCell({ value }) — ADR-018 X-A1.
  // ProgressCellProps.value: number | null | undefined. clampPercent handles NaN/null/out-of-range.
  registerRenderer(
    'progress',
    adaptValueCell(
      ProgressCell as ComponentType<{ value: number | null | undefined }>,
      (info) => info.getValue() as number | null | undefined,
    ),
  );
}
