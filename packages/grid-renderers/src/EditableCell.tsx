// @topgrid/grid-renderers — EditableCell (MOD-GRID-05 / G-003, G-005)
// Inline editable cell: text / number / date / select / textarea (5 editType).
// Absorbs legacy EditableGrid inline cell JSX.
//
// @see Spec MOD-GRID-05/G-003 Section 2.1 / 2.2 / 2.3
// @see ADR-MOD-GRID-05-004 (G-005) — initialDraft prop for keystroke-triggered editing

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

/**
 * Edit-mode input type — controls which native element is rendered.
 *
 * Widened (additive) from the legacy `EditType`
 * (`'text' | 'select' | 'date' | 'number'`) by adding `'textarea'` for
 * multi-line input. The L0 four members are preserved (subset).
 *
 * @see Spec MOD-GRID-05/G-003 D1 + Section 2.1
 */
export type EditType = 'text' | 'number' | 'date' | 'select' | 'textarea';

/**
 * Grid-level callback for conditional cell formatting.
 *
 * **Canonical ownership moved to `@topgrid/grid-core`** (MOD-GRID-01 G-006, ADR-MOD-GRID-01-007,
 * 2026-05-18) per ADR-MOD-GRID-REFACTOR-2026-05-17-009 역의존 제거 정책. 본 파일은 type-only
 * re-export 만 유지 (backward compatibility — 외부 사용처가 `@topgrid/grid-renderers` 에서
 * import 하는 코드 보존).
 *
 * Receives a TanStack `Cell<TData, unknown>` and returns a Tailwind className string
 * (or undefined for no addition) to be appended to the rendered cell.
 *
 * @see ADR-MOD-GRID-01-007
 * @see Spec MOD-GRID-05/G-003 D3 + Section 2.2 (legacy doc reference)
 */
export type { CellClassNameCallback } from '@topgrid/grid-core';

/**
 * Lifecycle context handed to a consumer-supplied editor via {@link EditableCellProps.renderEditor}.
 *
 * The slot's value proposition is the **edit lifecycle**, not the ability to render an
 * arbitrary component (a consumer can already render anything via a raw TanStack `cell`
 * renderer). What a raw `cell` does NOT get for free — and what this context provides —
 * is: entry autofocus (`focusRef`), Enter→commit / Esc→cancel / Tab→commit (wired by
 * EditableCell's keydown handler on the slot wrapper, so the consumer writes none of it),
 * and a controlled draft (`value` / `onChange`).
 *
 * `value` is the draft **string** — EditableCell preserves the `onCommit(string)` contract,
 * so the consumer serializes any richer value. (Arbitrary non-string value-type parity is vN.)
 *
 * @since MOD-GRID-51 (Track 2 제품결정 2번째, 2026-06-07)
 */
export interface CustomEditorContext {
  /** Current draft value (string) — owned by EditableCell. */
  value: string;
  /** Update the draft (= internal `setDraft`). */
  onChange: (next: string) => void;
  /** Commit the current draft (= `onCommit(draft)`). */
  commit: () => void;
  /** Cancel editing (= `onCancel()`). */
  cancel: () => void;
  /**
   * Callback ref — attach to the focusable editor element. EditableCell focuses it
   * automatically when the cell enters edit mode (entry autofocus). A bare element
   * does not self-focus, so this is the autofocus seam.
   */
  focusRef: (el: HTMLElement | null) => void;
}

/**
 * Props for {@link EditableCell}.
 *
 * @see Spec MOD-GRID-05/G-003 Section 2.3
 * @see ADR-MOD-GRID-05-003 (G-004) — maxLength + align + stopPropagationOnKeyDown
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
  /**
   * Maximum character length for text/number/textarea inputs.
   * Forwarded directly as the HTML `maxLength` attribute.
   * Not applicable to `editType === 'select'`.
   *
   * @see ADR-MOD-GRID-05-003 D1 (G-004)
   */
  maxLength?: number;
  /**
   * Text alignment inside the edit input. Default `'left'`.
   * Rendered as a Tailwind class (`text-center` / `text-right`) — C-5 compliant.
   *
   * @see ADR-MOD-GRID-05-003 D2 (G-004)
   */
  align?: 'left' | 'center' | 'right';
  /**
   * When `true`, calls `e.stopPropagation()` at the end of every keydown event
   * on the editor element, preventing the grid host's keyboard handler from
   * intercepting the key (Wijmo `prepareCellForEdit` pattern).
   * Default `false`.
   *
   * @see ADR-MOD-GRID-05-003 D3 (G-004)
   */
  stopPropagationOnKeyDown?: boolean;
  /**
   * Initial draft value applied on mount when the cell enters editing state.
   *
   * Use case: G-7 keyboard-triggered editing — the first keystroke is captured
   * by the focusable view-mode `<div>` before `<EditableCell>` mounts, so the
   * character would be lost. Passing it as `initialDraft` restores the Wijmo
   * `prepareCellForEdit` + `hostElement.keydown` "type directly to enter" UX.
   *
   * Behaviour:
   * - If `undefined` (default): the input mounts with the current cell value
   *   (existing behaviour, no change).
   * - If a string: the draft state is initialised to `initialDraft` and the
   *   cursor is positioned at the end of the string after focus.
   *
   * Note: this prop is read only on the **first render** (mount). Subsequent
   * changes to `initialDraft` while the component is mounted have no effect —
   * the component controls its own draft state after mount.
   *
   * @since ADR-MOD-GRID-05-004 (G-005, 2026-05-18)
   */
  initialDraft?: string;
  /**
   * Custom editor slot (render prop). When provided **and** `isEditing` is true, the
   * built-in `editType` editors (input/select/textarea) are bypassed and the consumer's
   * editor is rendered inside a lifecycle wrapper instead.
   *
   * The wrapper supplies the edit lifecycle the consumer would otherwise have to wire by
   * hand on a raw `cell` renderer:
   * - **Entry autofocus** — `ctx.focusRef` is focused when the cell enters edit mode.
   * - **Enter → commit**, **Esc → cancel**, **Tab → commit** — via the wrapper's `onKeyDown`
   *   (keydown bubbles up from the consumer's editor; `stopPropagationOnKeyDown` is honored).
   * - **Controlled draft** — `ctx.value` / `ctx.onChange` (string; see {@link CustomEditorContext}).
   *
   * `editType` is ignored while `renderEditor` is active (the consumer owns the markup).
   *
   * @since MOD-GRID-51 (2026-06-07)
   */
  renderEditor?: (ctx: CustomEditorContext) => ReactNode;
}

const INPUT_BASE_CLASS =
  'w-full border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';

const VIEW_BASE_CLASS =
  'min-h-[1.5rem] cursor-text px-1 rounded hover:bg-blue-50 hover:ring-1 hover:ring-blue-200';

/** Maps `align` prop value to Tailwind text-alignment class (C-5). */
function alignToClass(align: 'left' | 'center' | 'right'): string {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return ''; // 'left' is browser default — no class needed
}

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
 * When `initialDraft` is provided, the draft is initialised to it on the first
 * render (lazy `useState`) and the `useEffect` reset is skipped — the typed
 * character is already in the input when the `<input>` mounts.
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
  maxLength,
  align = 'left',
  stopPropagationOnKeyDown = false,
  initialDraft,
  renderEditor,
}: EditableCellProps): JSX.Element {
  // ADR-MOD-GRID-05-004 (G-005): initialDraft wins on first render.
  // When the parent triggers editing via a keystroke, the typed character is
  // passed as initialDraft so it is not lost during the remount cycle.
  // We read initialDraft only in the lazy initialiser — subsequent prop changes
  // are intentionally ignored (component owns its draft after mount).
  const [draft, setDraft] = useState<string>(() => initialDraft ?? String(value ?? ''));
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>(null);
  // MOD-GRID-51: holds the consumer's focusable editor element (set via ctx.focusRef).
  const customEditorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isEditing) {
      // ADR-MOD-GRID-05-004: skip setDraft reset when initialDraft was provided —
      // the lazy useState initialiser already set the correct starting value.
      // Without this guard, setDraft(String(value ?? '')) would overwrite initialDraft.
      if (initialDraft === undefined) {
        setDraft(String(value ?? ''));
      }
      // Focus and move cursor to end so the user can continue typing naturally.
      // MOD-GRID-51: when a custom editor slot is active, focus the consumer's element
      // (entry autofocus seam) instead of the built-in input.
      const el = renderEditor ? customEditorRef.current : inputRef.current;
      if (el) {
        el.focus();
        // setSelectionRange is available on text/number/textarea inputs (not select).
        if ('setSelectionRange' in el) {
          const len = (el as HTMLInputElement).value.length;
          (el as HTMLInputElement).setSelectionRange(len, len);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const handleKey = useCallback(
    // Widened to HTMLElement so the same handler drives the renderEditor slot wrapper
    // (MOD-GRID-51) as well as the built-in input/select/textarea.
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' && editType !== 'textarea') {
        onCommit(draft);
      } else if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onCommit(draft);
      }
      // ADR-MOD-GRID-05-003 D3: stop propagation after all native handling
      // so the grid host's keyboard wiring (G-7) does not intercept.
      if (stopPropagationOnKeyDown) e.stopPropagation();
    },
    [draft, editType, onCommit, onCancel, stopPropagationOnKeyDown],
  );

  if (isEditing) {
    // MOD-GRID-51: custom editor slot. The consumer's editor renders inside a wrapper
    // that supplies the edit lifecycle — keydown bubbles up so Enter→commit / Esc→cancel
    // / Tab→commit work with zero wiring from the consumer; entry autofocus is driven by
    // the useEffect above via ctx.focusRef. editType is bypassed (consumer owns markup).
    if (renderEditor) {
      const ctx: CustomEditorContext = {
        value: draft,
        onChange: setDraft,
        commit: () => onCommit(draft),
        cancel: onCancel,
        focusRef: (el) => {
          customEditorRef.current = el;
        },
      };
      const composed = [alignToClass(align), cellClassName ?? ''].filter(Boolean).join(' ');
      return (
        <div onKeyDown={handleKey} className={composed || undefined}>
          {renderEditor(ctx)}
        </div>
      );
    }

    if (editType === 'select') {
      const opts = selectOptions ?? [];
      const composed = [INPUT_BASE_CLASS, alignToClass(align), cellClassName ?? '']
        .filter(Boolean)
        .join(' ');
      // maxLength is NOT forwarded to <select> — HTMLSelectElement has no maxLength.
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
      const composed = [INPUT_BASE_CLASS, 'min-h-[3rem]', alignToClass(align), cellClassName ?? '']
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
          {...(maxLength !== undefined ? { maxLength } : {})}
        />
      );
    }

    const htmlType = editType === 'number' ? 'number' : editType === 'date' ? 'date' : 'text';
    const composed = [INPUT_BASE_CLASS, alignToClass(align), cellClassName ?? '']
      .filter(Boolean)
      .join(' ');
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
        {...(maxLength !== undefined ? { maxLength } : {})}
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
