---
'@topgrid/grid-renderers': minor
---

Add `initialDraft` prop to `EditableCell` — keystroke-triggered editing first char restoration (G-7 keyboard entry UX).

When a user presses a printable key on a focused view-mode cell, the character is now passed as `initialDraft` to `<EditableCell>` on mount, so the input starts with that character already typed (cursor at end). Previously the first keystroke was silently lost during the remount cycle.

ADR-MOD-GRID-05-004 (G-005, 2026-05-18). organizeSchedule Phase 3.3 PARTIAL → completed.
