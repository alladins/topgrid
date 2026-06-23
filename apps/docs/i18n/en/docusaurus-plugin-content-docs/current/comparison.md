---
title: Feature Comparison (vs AG Grid · Wijmo)
sidebar_position: 3
---

# Feature Comparison — topgrid vs Commercial Grids

This is the result of comparing `@topgrid` item by item against the feature catalogs of
**AG Grid (Community + Enterprise)** and **Wijmo (FlexGrid + FlexSheet)**. Status is judged on the
basis of **code evidence** (no evidence means not implemented), and every item was filtered once more
through **adversarial verification** — a separate agent re-checks the codebase — to block over-claiming.

> 19 categories · **330 features** compared (2026-06, canonical).

## Overview

| Status | Count | Share |
|---|---|---|
| ✅ Implemented | 248 | **75%** |
| 🟡 Partial | 73 | 22% |
| ❌ Not implemented | 6 | 2% |
| ➖ Not applicable | 3 | 1% |

`@topgrid` satisfies the AG Grid **Community** core, and also holds a broad set of
**Enterprise-class differentiating features** — pivoting, server-side row model (SSRM), column
(horizontal) virtualization, integrated charts/sparklines, master-detail, advanced filters, and a
spreadsheet (formula engine). The not-implemented set (❌) has been narrowed to 6, all of which are
**intentional, by-design deferrals** (see roadmap below). Most partial items (🟡 22%) are cases where,
given the headless nature, "the consumer wires it up directly with raw `ColumnDef`s/callbacks" or the
item is at a PoC stage — it works, but it isn't turnkey.

| Symbol | Meaning |
|---|---|
| ✅ | Implementation confirmed by code evidence |
| 🟡 | Partial — headless passthrough only / some limitations / consumer wiring required / PoC |
| ❌ | Not implemented (intentional deferral) |
| ➖ | Not applicable to a headless grid |

## Summary by Category

| Category | Features | ✅ | 🟡 | ❌ | ➖ |
|---|---|---|---|---|---|
| Sorting | 18 | 15 | 2 | 1 | 0 |
| Filtering | 13 | 12 | 1 | 0 | 0 |
| Columns | 14 | 9 | 5 | 0 | 0 |
| Row Grouping · Aggregation | 19 | 12 | 7 | 0 | 0 |
| Pivoting | 23 | 21 | 2 | 0 | 0 |
| Selection | 17 | 15 | 2 | 0 | 0 |
| Editing | 18 | 14 | 4 | 0 | 0 |
| Cell Rendering · Styling | 18 | 15 | 3 | 0 | 0 |
| Row Models · Data | 18 | 15 | 3 | 0 | 0 |
| Pagination | 17 | 12 | 5 | 0 | 0 |
| Virtualization · Performance | 20 | 12 | 4 | 3 | 1 |
| Master/Detail · Tree | 16 | 10 | 6 | 0 | 0 |
| Pinned/Floating Rows | 15 | 12 | 3 | 0 | 0 |
| Export · Clipboard · Print | 15 | 13 | 1 | 1 | 0 |
| Integrated Charts · Sparklines | 17 | 11 | 4 | 0 | 2 |
| Accessibility · Keyboard | 18 | 12 | 6 | 0 | 0 |
| State · Theming · i18n | 17 | 12 | 4 | 1 | 0 |
| Spreadsheet (FlexSheet) | 23 | 16 | 7 | 0 | 0 |
| Other UX (panels/menus/overlays) | 14 | 10 | 4 | 0 | 0 |
| **Total** | **330** | **248** | **73** | **6** | **3** |

## Strengths

- **Sorting · filtering · editing · rendering · export** — meets the Community core. Excel/CSV/PDF
  export · clipboard (TSV) · print · cell-type renderers (11 kinds) · multi-sort (priority badges) ·
  locale/null placement · cell range selection · drag fill (fill handle).
- **Enterprise-class differentiating features**:
  - **Pivoting** (`grid-pro-pivot`, ✅21/23) — multi-axis + subtotals + axis transpose + expand/collapse + pivot panel (DnD) + server-side pivot.
  - **Server-side row model (SSRM)** (`grid-pro-serverside`) — block lazy loading + infinite scroll + viewport model +
    server tree, with automatic discarding of stale responses on sort/filter changes (epoch invariant).
  - **Column (horizontal) virtualization** — off-screen columns are not rendered, pinned columns stay present (simultaneous row + column virtualization).
  - **Integrated charts/sparklines** (`grid-pro-chart`) — zero-dep SVG engine, chart→grid cross-filtering.
  - **Master-detail + virtualization** (`grid-pro-master`), multi-row headers, cell merging.
  - **Advanced filters** (`grid-pro-filter`) — multi (AND/OR) + advanced (cross-column expressions) + cross-filtering.
  - **Editing depth** (`grid-pro-edit-plus`) — full-row editing + custom editor slots + undo/redo + validation rules +
    find & replace + cell comments.
  - **Spreadsheet** (`grid-pro-sheet`, PoC) — A1/absolute references + multi-sheet + named ranges + VLOOKUP/date/financial functions +
    dependency-graph recalculation + circular detection + cell formatting/styling/merging.
- **Accessibility** — ARIA grid semantics (default-on, absolute indices under virtualization) + keyboard navigation (aria-activedescendant) +
  screen-reader live announcements. Verified with axe-core.
- **MIT core + Pro split** — same structure as AG Grid (community/enterprise). Headless (TanStack-based) → turn on only as much as you want.

## Roadmap (Honest Gaps — ❌6)

There are 6 items that commercial grids have but that we **don't yet have**, all of which are **intentional, by-design deferrals**.

- **RTL (right-to-left) layout** — pinned-column offsets and the like assume LTR, so this is invasive. (State · Theming · i18n)
- **Post-sort callback** — a hook to rearrange rows after sorting. Requires surgery on the sort hot-path. (Sorting)
- **Debounced scroll knob · row animation · automatic virtualization threshold** — intentionally not applied (virtualization is explicit opt-in). (Virtualization · Performance)
- **Excel cell-style export** (font/background/border) — community `xlsx` strips styles (.s). (Export)

> **Partial (🟡 73)** items are those that work but aren't turnkey — because they're headless, the consumer
> wires them up with raw `ColumnDef`s/callbacks (e.g. faceted filter values, custom comparators), or there
> are some limitations (e.g. cell merging, the spreadsheet PoC), or some rendering follow-up remains
> (e.g. certain group footer rendering). We honestly distinguish these from ✅.

> The detailed comparison matrix for all 330 items (per-item AG Grid tier · Wijmo · evidence code) lives in the internal document
> `docs/internal/COMMERCIAL-GAP-ANALYSIS.md`, which is the SSoT.

## See for Yourself

- <a href="/storybook/" target="_blank" rel="noopener">Storybook demos</a> — interactive components for every package
- [Examples](/migration/live-demos) — copy-paste code patterns
- [Architecture](/architecture) — the 27-package layout
