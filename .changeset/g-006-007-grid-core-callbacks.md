---
'@topgrid/grid-core': minor
'@topgrid/grid-renderers': patch
---

Add cellClassName + rowClassName + onCellKeyDown callbacks (G-006/G-007).
GridHandle.startEditing(rowId, colId) for imperative editing trigger.

- cellClassName/rowClassName: per-cell/per-row className callback (Wijmo formatItem 대응).
- onCellKeyDown: cell-level keyboard event hook (Wijmo hostElement keyDown 대응).
- onStartEditing + GridHandle.startEditing: callback-delegating imperative API (G-004 D3 패턴 일관).
- CellClassNameCallback<TData> canonical 정의를 grid-core 로 이전 (역의존 제거 — ADR-REFACTOR-009 정신).
  grid-renderers 는 type-only re-export (backward compatible).

Wijmo prepareCellForEdit / hostElement keyDown / formatItem 패턴 대응
(canonical-gap-supplementation-spec.md §4.1 + §4.5).

ADR-MOD-GRID-01-007 + ADR-MOD-GRID-01-008. semver: minor (additive, backward-compatible).
