/**
 * `makeCopyCellItem` — built-in context-menu item that copies the right-clicked
 * cell's value to the clipboard.
 *
 * The value→text mapping is the pure {@link cellValueToClipboardText}; this
 * factory only adds the browser `navigator.clipboard.writeText` wiring and a
 * default label/icon. Consumers spread it into `contextMenuItems`.
 *
 * @example
 * ```tsx
 * contextMenuItems={[ makeCopyCellItem(), { separator: true, label: '' }, ...rest ]}
 * ```
 */
import type { Cell } from '@tanstack/react-table';
import type { ContextMenuItem } from '../types';
import { cellValueToClipboardText } from './clipboard';

export interface MakeCopyCellItemOptions {
  /** Override the menu label. @default '셀 복사' */
  label?: string;
  /** Override the leading icon. @default '⧉' */
  icon?: ContextMenuItem<unknown>['icon'];
}

export function makeCopyCellItem<TData>(
  opts?: MakeCopyCellItemOptions,
): ContextMenuItem<TData> {
  return {
    label: opts?.label ?? '셀 복사',
    icon: opts?.icon ?? '⧉',
    onClick: (_row: TData, cell: Cell<TData, unknown>) => {
      const text = cellValueToClipboardText(cell);
      // Browser-only wiring; guarded so non-DOM environments don't throw.
      if (typeof navigator !== 'undefined' && navigator.clipboard !== undefined) {
        void navigator.clipboard.writeText(text);
      }
    },
  };
}
