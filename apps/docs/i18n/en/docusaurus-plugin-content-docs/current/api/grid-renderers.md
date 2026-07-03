---
title: "@topgrid/grid-renderers"
sidebar_label: "grid-renderers"
sidebar_position: 4
---

# @topgrid/grid-renderers

> Cell renderers: Button, Badge, Check, Link, Number, Date, Icon · **Free (MIT)**

:::info Auto-generated
This page is auto-generated from TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**36** public exports — 4 functions · 0 hooks · 12 components · 19 types · 1 constants.

## Components

### `AvatarCell`

Avatar cell — image with initials fallback ( handles broken src by
swapping to the initials chip via onError state).

```ts
AvatarCell(__namedParameters: AvatarCellProps): Element
```

### `ButtonCell`

Button cell — small action button suitable for grid action columns.

Click handler stops propagation so it never triggers a row click (L0
pattern preserved). Variant Tailwind classes equal the L0 mapping with
renamed keys ( — no visual change).

When both `value` and `label` are undefined, renders an empty `<button>`
(new behaviour — previously impossible since `label` was required; spec §5.1 fallback).

```ts
ButtonCell(__namedParameters: ButtonCellProps): Element
```

### `CheckCell`

Checkbox cell — wraps a native `<input type="checkbox">` centred inside
a flex container (L0 markup preserved). Both onClick and onChange call
stopPropagation so they never bubble to the grid row click handler.

```ts
CheckCell(__namedParameters: CheckCellProps): Element
```

### `DateCell`

Date/time cell renderer with locale-aware formatting.

Uses formatDateTimeFromDateTimeString (extracted from L0 inline
toLocaleDateString + FORMAT_OPTIONS pattern). Returns dash for empty/invalid.

```ts
DateCell(__namedParameters: DateCellProps): Element
```

### `EditableCell`

Inline editable cell with view ↔ edit mode transitions.

Markup contract (spec — absorbs L0 EditableGrid L82-126):
- View mode: `<div onClick={onStartEdit}>` showing `String(value ?? '')`.
- Edit mode (`isEditing === true`):
 - `'select'` → `<select>` with options (or `(옵션 없음)` placeholder).
 - `'textarea'` → `<textarea>` (Enter inserts newline; Tab/Blur commits).
 - default → `<input type={'text'|'number'|'date'}>`.

Keyboard handling (L0 L65-72 preserved):
- Enter → `onCommit(draft)` (except `textarea` — newline preserved).
- Escape → `onCancel`.
- Tab → `e.preventDefault` + `onCommit(draft)`.

Local `draft` state is reset to `String(value ?? '')` whenever the cell
enters edit mode (via `useEffect`), which also schedules `inputRef.focus`.
When `initialDraft` is provided, the draft is initialised to it on the first
render (lazy `useState`) and the `useEffect` reset is skipped — the typed
character is already in the input when the `<input>` mounts.

```ts
EditableCell(__namedParameters: EditableCellProps): Element
```

### `IconCell`

Icon cell — display an icon (with optional supporting label and click
handler). The component is library-agnostic: it accepts any ReactNode
for the icon prop ( — no external icon package dependency).

```ts
IconCell(__namedParameters: IconCellProps): Element
```

### `LinkCell`

Link cell — renders one of three forms based on :
 - `href` provided → `<a href>` (with onClick passthrough if any)
 - only `onClick` → `<button>` (L0 behaviour preserved)
 - neither → `<span>` (plain text or empty)

When both `value` and `label` are undefined, renders an empty `<span>` (new
behaviour — previously impossible since `label` was required; spec §5.1 fallback).

Click handlers call `e.stopPropagation` to prevent grid row click bubbling
(L0 ButtonCell/LinkCell pattern preserved).

```ts
LinkCell(__namedParameters: LinkCellProps): Element
```

### `NumberCell`

Numeric cell renderer with locale-aware formatting + optional unit + optional negative color.

Uses formatNumberString (extracted from L0 inline toLocaleString pattern).

```ts
NumberCell(__namedParameters: NumberCellProps): Element
```

### `ProgressCell`

Progress cell — Tailwind track + bar (h-2 rounded) with optional percent
label. Bar width uses a dynamic `style={{ width }}` value (spec
deviation: Tailwind JIT arbitrary widths cannot be runtime-driven).

```ts
ProgressCell(__namedParameters: ProgressCellProps): Element
```

### `StatusBadgeCell`

Status badge cell — renders value as a Tailwind rounded-full chip
coloured by colorMap (or a 7-state default).

Equivalent to the legacy `BadgeCell`;
the shim there re-exports this component under the legacy name ( alias).

```ts
StatusBadgeCell(__namedParameters: StatusBadgeCellProps): Element
```

### `TagCell`

Tag cell — renders a flex-wrap row of tag chips. Used for multi-valued
label columns (e.g. priority tags, category tags). Each chip's colour
comes from colorMap or defaults to neutral gray.

```ts
TagCell(__namedParameters: TagCellProps): Element
```

### `TextCell`

Plain text cell renderer with null/empty dash placeholder.

Distinguishes empty (null/undefined/'') from falsy zero — `0` renders as "0".

```ts
TextCell(__namedParameters: TextCellProps): Element
```

## Functions

### `formatDateTimeFromDateTimeString`

Format a date/string/number/Date to a locale-aware date/datetime/time string.

Returns '' for null/undefined/empty-string/invalid-Date inputs.

```ts
formatDateTimeFromDateTimeString(value: undefined | null | string | number | Date, options: FormatDateTimeOptions): string
```

**Example**

```ts
formatDateTimeFromDateTimeString('2026-05-14', { format: 'date' }) // "2026. 05. 14."
```

### `formatNumberString`

Format a number using locale-aware thousand separators and fixed decimals.

Returns '' for null/undefined/non-finite inputs ( — explicit guard,
improving L0 inline `toLocaleString` which output the string "NaN").

Negative or non-integer `decimals` are clamped via `Math.max(0, Math.floor(...))`
to avoid Intl RangeError.

```ts
formatNumberString(value: undefined | null | number, options: FormatNumberOptions): string
```

**Example**

```ts
formatNumberString(1234.5, { decimals: 2 }) // "1,234.50"
```

### `getRenderer`

Look up a registered renderer. Returns `undefined` if no renderer matches
the given type — the consumer ( createColumns) decides the
fallback behaviour (spec ).

```ts
getRenderer(type: string): undefined | CellComponent
```

### `registerRenderer`

Register a custom renderer under a type key. Overrides the default if the
key collides (spec — intentional behaviour for external customisation).

```ts
registerRenderer(type: string, component: CellComponent): void
```

**Example**

```ts
registerRenderer('priority', MyPriorityCell);
  createColumns([{ id: 'p', type: 'priority' }]);
```

## Types & Interfaces

### `AvatarCellProps`

Props for AvatarCell.

New component (spec ) — displays an avatar image with an initials
fallback. When `src` is missing or fails to load, the component renders
a rounded-full chip showing initials derived from name.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional Tailwind className appended to the root span. |
| `name` | `string` | User name. Source of initials when avatar image is unavailable. |
| `sizeClassName?` | `string` | Tailwind size class (default `'w-7 h-7'`). |
| `src?` | `string` | Avatar image URL. When undefined or load fails, initials fallback renders. |

### `ButtonCellProps`

Props for ButtonCell.

Absorbs legacy ButtonCell with the variant
naming change ( — L0 `'primary' | 'danger' | 'ghost'` → spec
`'default' | 'destructive' | 'ghost'`). Visual output (Tailwind classes)
unchanged: `default`==L0 `primary`, `destructive`==L0 `danger`.

 grep at implement time: 0 hardcoded `variant='primary'|'danger'` sites
across the legacy source — direct rename safe (no codemod needed).

`value` added as preferred prop; `label` retained as deprecated alias ( amendment).

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional Tailwind className. |
| `disabled?` | `boolean` | Disabled state (L0 preserved). Default `false`. |
| `label?` | `ReactNode` |  |
| `onClick` | `(…) => …` | Click callback (L0 required, preserved). |
| `size?` | `"sm" \| "xs"` | Size token (L0 preserved). Default `'xs'`. |
| `value?` | `ReactNode` | Button label (text or arbitrary ReactNode). Preferred prop ( amendment). |
| `variant?` | `"default" \| "destructive" \| "ghost"` | Visual variant ( renamed from L0 `primary`/`danger`). Default `'ghost'`. |

### `CellComponentProps`

Display-mode cell component contract.

Compatible with TanStack ColumnDef.cell context (row + column) via optional
props — the registry consumer ( createColumns) supplies row/column
from the cell context when invoking the renderer via React.createElement.

| Property | Type | Description |
|---|---|---|
| `column?` | `Column<unknown, unknown>` | TanStack column context (optional — registry consumers pass when available). |
| `row?` | `Row<unknown>` | TanStack row context (optional — registry consumers pass when available). |
| `value` | `unknown` | Cell value resolved from the row's accessor. |

### `CheckCellProps`

Props for CheckCell.

Absorbs legacy CheckCell. Markup preserved:
native `<input type="checkbox">` (NOT an icon SVG — spec ).

| Property | Type | Description |
|---|---|---|
| `checked` | `boolean` | Checked state (L0 L2 preserved). |
| `className?` | `string` | Additional Tailwind className appended to the rendered input. |
| `onChange?` | `(…) => …` | Change callback (L0 L3 preserved). Not invoked when `readOnly` is `true`. |
| `readOnly?` | `boolean` | Read-only mode (L0 L4 preserved). Default `false`. |

### `CustomEditorContext`

Lifecycle context handed to a consumer-supplied editor via EditableCellProps.renderEditor.

The slot's value proposition is the **edit lifecycle**, not the ability to render an
arbitrary component (a consumer can already render anything via a raw TanStack `cell`
renderer). What a raw `cell` does NOT get for free — and what this context provides —
is: entry autofocus (`focusRef`), Enter→commit / Esc→cancel / Tab→commit (wired by
EditableCell's keydown handler on the slot wrapper, so the consumer writes none of it),
and a controlled draft (`value` / `onChange`).

`value` is the draft **string** — EditableCell preserves the `onCommit(string)` contract,
so the consumer serializes any richer value. (Arbitrary non-string value-type parity is vN.)

| Property | Type | Description |
|---|---|---|
| `cancel` | `(…) => …` | Cancel editing (= `onCancel`). |
| `commit` | `(…) => …` | Commit the current draft (= `onCommit(draft)`). |
| `focusRef` | `(…) => …` | Callback ref — attach to the focusable editor element. EditableCell focuses it automatically when the cell enters edit mode (entry autofocus). A bare element does not self-focus, so this is the autofocus seam. |
| `onChange` | `(…) => …` | Update the draft (= internal `setDraft`). |
| `value` | `string` | Current draft value (string) — owned by EditableCell. |

### `DateCellProps`

Props for DateCell.

Preserves L0 DateCell.tsx (L1-5) prop signature in full — no drift.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional Tailwind className. |
| `format?` | `"date" \| "datetime" \| "time"` | Display format (default 'date'). L0 DateCell.tsx:3 preserved. |
| `locale?` | `string` | Locale tag (default 'ko-KR'). L0 DateCell.tsx:4. |
| `value` | `undefined \| null \| string \| number \| Date` | Date value. null/undefined/'' → dash placeholder. Invalid Date → dash. |

### `EditableCellProps`

Props for EditableCell.

| Property | Type | Description |
|---|---|---|
| `align?` | `"left" \| "center" \| "right"` | Text alignment inside the edit input. Default `'left'`. Rendered as a Tailwind class (`text-center` / `text-right`) — compliant. |
| `cellClassName?` | `string` | Additional Tailwind className — injection point for Grid-level callbacks. |
| `columnId?` | `string` | Column id (optional — logging / debugging only, no effect on behaviour). |
| `editType` | `EditType` | Edit input type (5 variants — ). |
| `initialDraft?` | `string` | Initial draft value applied on mount when the cell enters editing state. Use case: keyboard-triggered editing — the first keystroke is captured by the focusable view-mode `<div>` before `<EditableCell>` mounts, so the character would be lost. Passing it as `initialDraft` restores the xxxx `prepareCellForEdit` + `hostElement.keydown` "type directly to enter" UX. Behaviour: - If `undefined` (default): the input mounts with the current cell value  (existing behaviour, no change). - If a string: the draft state is initialised to `initialDraft` and the  cursor is positioned at the end of the string after focus. Note: this prop is read only on the **first render** (mount). Subsequent changes to `initialDraft` while the component is mounted have no effect — the component controls its own draft state after mount. |
| `isEditing` | `boolean` | Edit-mode flag — owned by the parent container (e.g. EditableGrid). |
| `maxLength?` | `number` | Maximum character length for text/number/textarea inputs. Forwarded directly as the HTML `maxLength` attribute. Not applicable to `editType === 'select'`. |
| `onCancel` | `(…) => …` | Invoked on Esc — edit cancelled. |
| `onCommit` | `(…) => …` | Invoked on Enter (non-textarea) / Blur / Tab. New value is emitted as string. |
| `onStartEdit` | `(…) => …` | Invoked when the view-mode cell is clicked to request edit mode. |
| `renderEditor?` | `(…) => …` | Custom editor slot (render prop). When provided **and** `isEditing` is true, the built-in `editType` editors (input/select/textarea) are bypassed and the consumer's editor is rendered inside a lifecycle wrapper instead. The wrapper supplies the edit lifecycle the consumer would otherwise have to wire by hand on a raw `cell` renderer: - **Entry autofocus** — `ctx.focusRef` is focused when the cell enters edit mode. - **Enter → commit**, **Esc → cancel**, **Tab → commit** — via the wrapper's `onKeyDown`  (keydown bubbles up from the consumer's editor; `stopPropagationOnKeyDown` is honored). - **Controlled draft** — `ctx.value` / `ctx.onChange` (string; see CustomEditorContext). `editType` is ignored while `renderEditor` is active (the consumer owns the markup). |
| `rowIndex?` | `number` | Row index (optional — logging / debugging only, no effect on behaviour). |
| `selectOptions?` | `readonly { … }[]` | Options when `editType === 'select'`. Empty/undefined → placeholder. |
| `stopPropagationOnKeyDown?` | `boolean` | When `true`, calls `e.stopPropagation` at the end of every keydown event on the editor element, preventing the grid host's keyboard handler from intercepting the key (xxxx `prepareCellForEdit` pattern). Default `false`. |
| `value` | `unknown` | Current value — rendered in view mode. `null`/`undefined` → empty text. |

### `FormatDateTimeOptions`

| Property | Type | Description |
|---|---|---|
| `format?` | `"date" \| "datetime" \| "time"` | Display format (default 'date'). |
| `locale?` | `string` | Locale tag (default 'ko-KR'). |

### `FormatNumberOptions`

Pure formatting helpers for cell renderers.

Extracted from L0 patterns:
 - NumberCell.tsx L17-20 (inline value.toLocaleString)
 - DateCell.tsx L13-21 (inline date.toLocaleDateString + FORMAT_OPTIONS)

No external store/state dependency. Typed (no `any`).

| Property | Type | Description |
|---|---|---|
| `decimals?` | `number` | Decimal places (default 0). Clamped to [0, 20]. |
| `locale?` | `string` | Locale tag (default 'ko-KR'). |

### `IconCellProps`

Props for IconCell.

Absorbs legacy IconCell. The icon is a
`ReactNode` prop ( — no lucide-react / react-icons peer added).
Consumers inject their own icon component instance.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional Tailwind className appended to the outer element. |
| `color?` | `string` | Tailwind text-colour class for the icon (L0 default `'text-gray-500'`). |
| `icon` | `ReactNode` | Icon ReactNode — caller supplies the icon component instance. |
| `label?` | `string` | Optional supporting text (L0 L5 preserved). |
| `onClick?` | `(…) => …` | Optional click callback — when provided, renders `<button>`, else `<span>` (L0 L6 preserved). |

### `LinkCellProps`

Props for LinkCell.

Absorbs legacy LinkCell.
- `onClick` weakened from required to optional (additive — Section 2.2 risk-bound).
- `href` added (additive — href|onClick union).
- `value` added as preferred prop; `label` retained as deprecated alias ( amendment).

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional Tailwind className appended to the rendered element. |
| `href?` | `string` | Link URL. When provided, renders `<a href>`; otherwise renders `<button>` (or `<span>`). |
| `label?` | `string` |  |
| `onClick?` | `(…) => …` | Click callback. Used when href is undefined (L0 preserved). |
| `value?` | `string` | Display text. Preferred prop ( amendment). |

### `NumberCellProps`

Props for NumberCell.

Preserves L0 NumberCell.tsx (L1-7) prop signature in full — no drift.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional Tailwind className. |
| `colorNegative?` | `boolean` | Apply red-600 to negative values (default false). L0 NumberCell.tsx:6. |
| `decimals?` | `number` | Decimal places (default 0). L0 NumberCell.tsx:3 preserved. |
| `locale?` | `string` | Locale tag (default 'ko-KR'). L0 NumberCell.tsx:5. |
| `unit?` | `string` | Unit suffix (default ''). L0 NumberCell.tsx:4. |
| `value` | `undefined \| null \| number` | Numeric value. null/undefined/NaN → dash placeholder. |

### `ProgressCellProps`

Props for ProgressCell.

New component (spec ) — horizontal progress bar with optional label.
Handles NaN/null/undefined → 0% and out-of-range values → [0,100]
clamp.

| Property | Type | Description |
|---|---|---|
| `barColorClassName?` | `string` | Tailwind class for the bar fill (default `'bg-blue-600'`). |
| `className?` | `string` | Additional Tailwind className appended to the root container. |
| `showLabel?` | `boolean` | Whether to render the percent label next to the bar. Default `true`. |
| `value` | `undefined \| null \| number` | Progress value (0–100). NaN/null/undefined → 0; out-of-range → clamped. |

### `StatusBadgeCellProps`

Props for StatusBadgeCell.

Absorbs legacy BadgeCell with rename
(BadgeCell → StatusBadgeCell — spec ). Prop signature fully preserved.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional Tailwind className appended to the rendered span. |
| `colorMap?` | `Record<string, string>` | Status → Tailwind class map. When undefined, default 7-state map applies (L0 L8-15 preserved). |
| `defaultColor?` | `string` | Fallback Tailwind class when value not found in colorMap. Default `'bg-gray-100 text-gray-600'`. |
| `value` | `string` | Status value — used as colorMap lookup key. |

### `TagCellProps`

Props for TagCell.

New component (spec ) — renders an array of tag strings as rounded
Tailwind chips. Empty array → dash placeholder (mirrors the
 TextCell empty-value pattern).

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional Tailwind className appended to the root span. |
| `colorMap?` | `Record<string, string>` | Per-tag Tailwind colour map. Falls back to a neutral gray chip when undefined. |
| `gapClassName?` | `string` | Tailwind gap class applied to the flex container (default `'gap-1'`). |
| `value` | `readonly string[]` | Tag strings. Empty array → dash placeholder. |

### `TextCellProps`

Props for TextCell.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional Tailwind className. |
| `value` | `undefined \| null \| string \| number` | Text to render. null/undefined/'' → dash placeholder. Falsy 0 is preserved. |

### `CellClassNameCallback`

Grid-level cell className callback.

Receives a clean GridCellContext (rowId/columnId/value/row — no TanStack types) and
returns a Tailwind className string (or undefined for no addition) appended to the `<td>`.
grid-core 1.0 : `Cell<TData,unknown>` → `GridCellContext<TData>`.

Canonical home: `@topgrid/grid-core` (since / 2026-05-18 — ADR-).
`@topgrid/grid-renderers` re-exports as type-only (ADR-MOD-GRID-REFACTOR-2026-05-17-009
inverse-dependency removal policy compliant).

```ts
type CellClassNameCallback = (…) => …
```

### `CellComponent`

A cell component compatible with the display-mode registry.

```ts
type CellComponent = ComponentType<CellComponentProps>
```

### `EditType`

Edit-mode input type — controls which native element is rendered.

Widened (additive) from the legacy `EditType`
(`'text' | 'select' | 'date' | 'number'`) by adding `'textarea'` for
multi-line input. The L0 four members are preserved (subset).

```ts
type EditType = "text" | "number" | "date" | "select" | "textarea"
```

## Constants

### `defaultRendererRegistry`

Default registry — pre-registered display-mode renderers
( + — 11 components, plus 3 alias keys for createColumns
convenience: `dateTime`, `statusBadge`, `check`).

Each entry is registered via asCell which confines the widening cast
to a single location ( amendment — cast 14→1). The registry consumer
( createColumns) is responsible for narrowing at the call site
when invoking the component via `React.createElement`.

```ts
const defaultRendererRegistry: Record<string, CellComponent>
```
