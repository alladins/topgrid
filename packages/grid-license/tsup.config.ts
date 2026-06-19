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
    '@topgrid/grid-license-core',
    '@tanstack/react-table',
    '@tanstack/react-virtual',
    'xlsx',
    'jspdf',
    '@dnd-kit/core',
    '@tanstack/react-query',
  ],
});
