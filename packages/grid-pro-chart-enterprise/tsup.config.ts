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
  // echarts stays external — consumers dedupe a single ECharts instance (ADR-003 D3).
  external: ['react', 'react-dom', 'echarts', '@topgrid/grid-pro-chart'],
});
