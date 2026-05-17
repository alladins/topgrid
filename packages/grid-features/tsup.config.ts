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
    'xlsx',
    'jspdf',
    '@dnd-kit/core',
    '@tanstack/react-query',
    // MOD-GRID-09 G-003: peerDependencies — externalize to avoid double-bundling (C-22)
    'date-fns',
    'date-fns/locale',
    'react-datepicker',
  ],
});
