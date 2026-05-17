// @tomis/grid-renderers — rendererRegistry (MOD-GRID-05 / G-003)
// Display-mode cell renderer registry: Record<type, CellComponent> mapping
// for MOD-GRID-04 createColumns to auto-dispatch by `type` field.
//
// EditableCell is NOT registered here — it is an *edit-mode wrapper*
// triggered by `meta.editable`, orthogonal to display type (spec D4).
//
// @see Spec MOD-GRID-05/G-003 Section 2.4

import type { ComponentType } from 'react';
import type { Row, Column } from '@tanstack/react-table';
import { TextCell } from './TextCell.js';
import { NumberCell } from './NumberCell.js';
import { DateCell } from './DateCell.js';
import { StatusBadgeCell } from './StatusBadgeCell.js';
import { LinkCell } from './LinkCell.js';
import { ButtonCell } from './ButtonCell.js';
import { CheckCell } from './CheckCell.js';
import { IconCell } from './IconCell.js';
import { TagCell } from './TagCell.js';
import { AvatarCell } from './AvatarCell.js';
import { ProgressCell } from './ProgressCell.js';

/**
 * Display-mode cell component contract.
 *
 * Compatible with TanStack ColumnDef.cell context (row + column) via optional
 * props — the registry consumer (MOD-GRID-04 createColumns) supplies row/column
 * from the cell context when invoking the renderer via React.createElement.
 */
export interface CellComponentProps {
  /** Cell value resolved from the row's accessor. */
  value: unknown;
  /** TanStack row context (optional — registry consumers pass when available). */
  row?: Row<unknown>;
  /** TanStack column context (optional — registry consumers pass when available). */
  column?: Column<unknown, unknown>;
}

/** A cell component compatible with the display-mode registry. */
export type CellComponent = ComponentType<CellComponentProps>;

/**
 * Register a cell component under the registry slot type. Widens the
 * cell's narrow prop type to `CellComponent` for registry storage.
 *
 * The single `as unknown as CellComponent` cast is deliberately isolated here
 * — this is the design smell identified in ADR-014 amendment (D-partial),
 * confined to one place rather than repeated at every registry entry.
 * Registry consumers (createColumns) are responsible for narrowing at the
 * `React.createElement` call site.
 *
 * @internal — only `rendererRegistry.ts` uses this directly. Public consumers
 * register via `registerRenderer(type, component)`.
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-014 amendment (2026-05-17)
 */
function asCell<P>(c: ComponentType<P>): CellComponent {
  return c as unknown as CellComponent;
}

/**
 * Default registry — pre-registered display-mode renderers
 * (G-001 + G-002 — 11 components, plus 3 alias keys for createColumns
 * convenience: `dateTime`, `statusBadge`, `check`).
 *
 * Each entry is registered via {@link asCell} which confines the widening cast
 * to a single location (ADR-014 amendment — cast 14→1). The registry consumer
 * (MOD-GRID-04 createColumns) is responsible for narrowing at the call site
 * when invoking the component via `React.createElement`.
 *
 * @see Spec MOD-GRID-05/G-003 Section 2.4 (justification of widening cast)
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-014 amendment
 */
export const defaultRendererRegistry: Record<string, CellComponent> = {
  text: asCell(TextCell),
  number: asCell(NumberCell),
  date: asCell(DateCell),
  dateTime: asCell(DateCell),           // alias — MOD-GRID-04 type:'dateTime'
  badge: asCell(StatusBadgeCell),
  statusBadge: asCell(StatusBadgeCell), // alias
  link: asCell(LinkCell),
  button: asCell(ButtonCell),
  checkbox: asCell(CheckCell),
  check: asCell(CheckCell),             // alias
  icon: asCell(IconCell),
  tag: asCell(TagCell),
  avatar: asCell(AvatarCell),
  progress: asCell(ProgressCell),
};

/** Mutable registry instance — module-level singleton for register/get helpers. */
const registryInstance: Record<string, CellComponent> = { ...defaultRendererRegistry };

/**
 * Register a custom renderer under a type key. Overrides the default if the
 * key collides (spec EC-10 — intentional behaviour for external customisation).
 *
 * @example
 *   registerRenderer('priority', MyPriorityCell);
 *   createColumns([{ id: 'p', type: 'priority' }]);
 */
export function registerRenderer(type: string, component: CellComponent): void {
  registryInstance[type] = component;
}

/**
 * Look up a registered renderer. Returns `undefined` if no renderer matches
 * the given type — the consumer (MOD-GRID-04 createColumns) decides the
 * fallback behaviour (spec EC-11).
 */
export function getRenderer(type: string): CellComponent | undefined {
  return registryInstance[type];
}
