import { defineConfig } from 'tsup';

export default defineConfig({
  // G-005 D13: multi-entry — `src/index.ts` (main) + `src/legacy/index.ts` (`/legacy` sub-entry, D8).
  // ADR-007 (Wave 3): + `src/internal/storage/index.ts` (`/internal/storage` sub-entry) —
  // internal SSR/JSON I/O primitives shared with sister packages (e.g. `@topgrid/grid-pro-master`).
  // Not part of the semver-stable public API (see internal/storage/index.ts JSDoc).
  entry: ['src/index.ts', 'src/legacy/index.ts', 'src/internal/storage/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
  external: [
    'react',
    'react-dom',
    '@tanstack/react-table',
    '@tanstack/react-virtual',
    'xlsx',
    'jspdf',
    '@dnd-kit/core',
    '@tanstack/react-query',
  ],
});
