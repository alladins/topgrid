---
'@tomis/grid-renderers': minor
---

Add `value` prop to LinkCell and ButtonCell (replaces `label`). `label` retained
as deprecated alias for one cycle. Internal: `as unknown as CellComponent` cast
14→1 via `asCell<P>()` helper. ADR-014 amendment (D-partial + additive shim).
