import { defineConfig } from 'vitest/config';

// Runs the React-dependent unit tests (hooks/components) that the node --experimental-strip-types
// runner can't (they need a DOM via @testing-library). The PURE-logic tests stay on the node runner
// (see the `test` script). Files are listed explicitly so vitest never picks up a node-style
// `*.test.ts` (which has no it()/describe() and would error).
export default defineConfig({
  test: {
    environment: 'jsdom',
    // ★ globals so @testing-library/react auto-registers cleanup() in afterEach (else renders leak
    // across tests → "Found multiple elements"). Tests still import {describe,it,expect} explicitly.
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/column/ColumnVisibilityMenu.test.tsx',
      'src/column/createColumns.test.ts',
      'src/column/createGroupedColumns.test.ts',
      'src/column/useColumnPersistence.test.ts',
      'src/useStoragePersist.test.ts',
      'src/useUrlSync.test.ts',
    ],
  },
});
