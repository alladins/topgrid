// @tomis/grid-renderers — EditableCell (MOD-GRID-05 / G-003)
// Inline editable cell: text / number / date / select / textarea (5 editType).
// Absorbs tw-framework-front EditableGrid.tsx L75-129 inline cell JSX.
//
// @see Spec MOD-GRID-05/G-003 Section 2.1 / 2.2 / 2.3

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type JSX,
  type KeyboardEvent,
} from 'react';
import type { Cell } from '@tanstack/react-table';

/**
 * Edit-mode input type — controls which native element is rendered.
 *
 * Widened (additive) from the L0 tw-framework-front `EditType`
 * (`'text' | 'select' | 'date' | 'number'`) by adding `'textarea'` for
 * multi-line input. The L0 four members are preserved (subset).
 *
 * @see Spec MOD-GRID-05/G-003 D1 + Section 2.1
 */
export type EditType = 'text' | 'number' | 'date' | 'select' | 'textarea';

/**
 * Grid-level callback for conditional cell formatting.
 *
 * Receives a TanStack `Cell<TData, unknown>` and returns a Tailwind className
 * string to be appended to the rendered cell. Exported from `@tomis/grid-renderers`
 * for future wiring by MOD-GRID-01 (Grid wrapper) or MOD-GRID-04 (createColumns).
 *
 * Within G-003 scope only the type is exported. `EditableCell` receives the
 * *resolved* string via the `cellClassName?: string` prop (Section 2.3).
 *
 * @see Spec MOD-GRID-05/G-003 D3 + Section 2.2
 */
export type CellClassNameCallback<TData> = (cell: Cell<TData, unknown>) => string;

/**
 * Props for {@link EditableCell}.
 *
 * @see Spec MOD-GRID-05/G-003 Section 2.3
 */
export interface EditableCellProps {
  /** Current value — rendered in view mode. `null`/`undefined` → empty text. */
  value: unknown;
  /** Edit input type (5 variants — D1). */
  editType: EditType;
  /** Options when `editType === 'select'`. Empty/undefined → EC-02 placeholder. */
  selectOptions?: ReadonlyArray<{ label: string; value: string }>;
  /** Edit-mode flag — owned by the parent container (e.g. EditableGrid). */
  isEditing: boolean;
  /** Invoked when the view-mode cell is clicked to request edit mode. */
  onStartEdit: () => void;
  /** Invoked on Enter (non-textarea) / Blur / Tab. New value is emitted as string. */
  onCommit: (newValue: string) => void;
  /** Invoked on Esc — edit cancelled. */
  onCancel: () => void;
  /** Row index (optional — logging / debugging only, no effect on behaviour). */
  rowIndex?: number;
  /** Column id (optional — logging / debugging only, no effect on behaviour). */
  columnId?: string;
  /** Additional Tailwind className — injection point for Grid-level callbacks (D3). */
  cellClassName?: string;
}

const INPUT_BASE_CLASS =
  'w-full border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';

const VIEW_BASE_CLASS =
  'min-h-[1.5rem] cursor-text px-1 rounded hover:bg-blue-50 hover:ring-1 hover:ring-blue-200';

/**
 * Inline editable cell with view ↔ edit mode transitions.
 *
 * Markup contract (spec D2 — absorbs L0 EditableGrid L82-126):
 * - View mode: `<div onClick={onStartEdit}>` showing `String(value ?? '')`.
 * - Edit mode (`isEditing === true`):
 *   - `'select'` → `<select>` with options (or `(옵션 없음)` placeholder).
 *   - `'textarea'` → `<textarea>` (Enter inserts newline; Tab/Blur commits).
 *   - default → `<input type={'text'|'number'|'date'}>`.
 *
 * Keyboard handling (L0 L65-72 preserved):
 * - Enter → `onCommit(draft)` (except `textarea` — newline preserved).
 * - Escape → `onCancel()`.
 * - Tab → `e.preventDefault()` + `onCommit(draft)`.
 *
 * Local `draft` state is reset to `String(value ?? '')` whenever the cell
 * enters edit mode (via `useEffect`), which also schedules `inputRef.focus()`.
 */
export function EditableCell({
  value,
  editType,
  selectOptions,
  isEditing,
  onStartEdit,
  onCommit,
  onCancel,
  cellClassName,
}: EditableCellProps): JSX.Element {
  const [draft, setDraft] = useState<string>(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isEditing) {
      setDraft(String(value ?? ''));
      // Focus on next tick — React commits DOM before browser paint, ref is attached
      inputRef.current?.focus();
    }
  }, [isEditing, value]);

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && editType !== 'textarea') {
        onCommit(draft);
      } else if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onCommit(draft);
      }
    },
    [draft, editType, onCommit, onCancel],
  );

  if (isEditing) {
    if (editType === 'select') {
      const opts = selectOptions ?? [];
      const composed = [INPUT_BASE_CLASS, cellClassName ?? ''].filter(Boolean).join(' ');
      return (
        <select
          ref={(el) => {
            inputRef.current = el;
          }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => onCommit(draft)}
          onKeyDown={handleKey}
          className={composed}
        >
          {opts.length === 0 ? (
            <option value="">(옵션 없음)</option>
          ) : (
            opts.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          )}
        </select>
      );
    }

    if (editType === 'textarea') {
      const composed = [INPUT_BASE_CLASS, 'min-h-[3rem]', cellClassName ?? '']
        .filter(Boolean)
        .join(' ');
      return (
        <textarea
          ref={(el) => {
            inputRef.current = el;
          }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => onCommit(draft)}
          onKeyDown={handleKey}
          className={composed}
        />
      );
    }

    const htmlType = editType === 'number' ? 'number' : editType === 'date' ? 'date' : 'text';
    const composed = [INPUT_BASE_CLASS, cellClassName ?? ''].filter(Boolean).join(' ');
    return (
      <input
        ref={(el) => {
          inputRef.current = el;
        }}
        type={htmlType}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={handleKey}
        className={composed}
      />
    );
  }

  const viewComposed = [VIEW_BASE_CLASS, cellClassName ?? ''].filter(Boolean).join(' ');
  return (
    <div className={viewComposed} onClick={onStartEdit}>
      {String(value ?? '')}
    </div>
  );
}
