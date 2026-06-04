// MOD-GRID-32 — pure-engine re-export for the node test (esbuild-bundled; no react).
// tsup builds from index.ts only, so this helper is not shipped.
export { createSheet } from './sheetEngine.js';
export { parseFormula } from './parser.js';
export { evaluate, compileCell, extractRefs, formatValue } from './evaluate.js';
export { isCellError } from '../types.js';
