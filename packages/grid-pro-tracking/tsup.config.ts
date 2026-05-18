import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
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
    '@topgrid/grid-core', // G-005 D9 — peer (legacy alias imports <Grid> / GridProps / GridHandle)
    'xlsx',
    'jspdf',
    '@dnd-kit/core',
    '@tanstack/react-query',
  ],
});
