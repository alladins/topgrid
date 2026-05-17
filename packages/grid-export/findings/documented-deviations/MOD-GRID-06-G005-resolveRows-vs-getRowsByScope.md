# Documented Deviation: resolveRows vs getRowsByScope

**Goal**: MOD-GRID-06/export/G-005  
**Date**: 2026-05-14  
**Status**: Documented — no action required (deviation is already resolved)

## Summary

The original `goals.json` for MOD-GRID-06 references an internal helper file named
`internal/resolveRows.ts`. The actual implementation file created during G-002 is
`internal/getRowsByScope.ts`.

## Detail

| Item | Value |
|------|-------|
| goals.json `implementFiles` reference | `packages/grid-export/src/internal/resolveRows.ts` |
| Actual file path | `packages/grid-export/src/internal/getRowsByScope.ts` |
| Actual export name | `getRowsByScope` |
| Decided in | G-002 spec D1, confirmed in G-005 spec D1 |

## Resolution

`getRowsByScope` is the canonical name. No alias (`resolveRows`) is created because:

1. The function is an internal helper — not exported via `index.ts`.
2. Creating an alias export for an internal file would unnecessarily widen the public API.
3. All 5 export functions (`exportToExcel`, `exportToCSV`, `exportToPdf`, `copyToClipboard`,
   `printGrid`) already import from `./internal/getRowsByScope` correctly.

## Recommended Follow-up

Update `goals.json` `implementFiles` entry for G-002 to reflect
`internal/getRowsByScope.ts` (out of scope for G-005 — discover phase responsibility).
