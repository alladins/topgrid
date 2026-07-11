import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/legacy/downloadExcel.ts', // ./legacy sub-entry (AC-005, D5)
    'src/react/index.ts', // ./react sub-entry — UI 계층(useGridExport + GridExportButton), EXPORT-UX P2
  ],
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
