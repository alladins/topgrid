---
"@tomis/grid-pro-master": minor
---

feat(grid-pro-master): add ContextMenuGrid with right-click context menu (MOD-GRID-16/G-002)

- `<ContextMenuGrid<TData>>` — Pro-tier Context Menu grid component
- `contextMenuItems?: ContextMenuItem<TData>[]` — declarative right-click menu items prop
- `ContextMenuItem<TData>` — menu item interface:
  - `label: string` — display label
  - `shortcut?: string` — keyboard shortcut hint + functional trigger (`"[Modifier+]Key"` grammar)
  - `disabled?: boolean | ((row: TData) => boolean)` — static or row-based disable condition
  - `separator?: boolean` — renders `<hr>` separator
  - `onClick: (row: TData, cell: Cell<TData, unknown>, event: MouseEvent) => void` — click handler
- `createPortal` into `document.body` — escapes parent overflow/stacking contexts (AC-003)
- Keyboard shortcut dispatch via wrapper div `onKeyDown` (tabIndex=0) — no global window listener (D12)
- `disabled` evaluation at render time with `opacity-50 cursor-not-allowed` styling (AC-007)
- Viewport-edge position clamping in `ContextMenuPortal` (Section 9)
- Esc key + outside-click close (AC-012)
- `verifyLicense('@tomis/grid-pro-master')` called at module level (Pro EULA guard, D6)
- `internal/useContextMenu.ts` — pure state hook (isOpen, position, targetRow, targetCell, focusedIndex)
- `internal/ContextMenuPortal.tsx` — createPortal-based menu renderer

No peerDependency changes needed (all deps declared in G-001).
