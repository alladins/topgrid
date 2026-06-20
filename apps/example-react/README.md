# @topgrid/example-react

Runnable consumer reference for the topgrid React grid — a minimal app using the `@topgrid/grid`
facade the way a real consumer would, showcasing the W3 DX surface:

- **`createColumns([{ id, name, type }])`** — declare columns without raw TanStack `ColumnDef`
  (no `@tanstack/react-table` import; renderers auto-wired via the facade). `align` is optional.
- **`getRowId`** — stable row identity (no "missing getRowId" dev warning; safe selection/sort).
- **`toGridCell(cell)`** — read cell data in `onCellClick` without TanStack types.

See `src/App.tsx`.

## Run

```bash
pnpm --filter @topgrid/example-react build:example   # esbuild → app.js
npx http-server apps/example-react -p 8080 -s        # then open http://localhost:8080
```

## Verify (real browser)

```bash
pnpm --filter @topgrid/example-react build:example
pnpm --filter @topgrid/example-react test:e2e        # Playwright: renders / sorts / toGridCell
```

The e2e (`e2e/example.e2e.spec.ts`) doubles as an end-to-end smoke of the published `@topgrid/grid`
facade — a consumer-style install renders, header-click sorts, and cell-click reads via `toGridCell`.

> No Tailwind here on purpose (keeps the example minimal); cells render functionally but unstyled.
> For styling, add the Tailwind content path per `getting-started.md` §2.2.
