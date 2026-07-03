// MOD-68 node spine — viewport row model. Run: node --experimental-strip-types viewportRowModel.test.ts
import {
  materializeViewport,
  createViewportRowModel,
  type ViewportDatasource,
  type ViewportDatasourceParams,
} from './viewportRowModel.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

interface R { id: number; v: string; }
const isPh = (x: unknown) => typeof x === 'object' && x !== null && (x as { __ssrmPlaceholder?: boolean }).__ssrmPlaceholder === true;

// ── G-1 pure materializeViewport ──
const m = new Map<number, R>([[0, { id: 0, v: 'a' }], [2, { id: 2, v: 'c' }]]);
const arr = materializeViewport(m, 4);
ok('materialize: length = rowCount', arr.length === 4);
ok('materialize: loaded index = row', (arr[0] as R).v === 'a' && (arr[2] as R).v === 'c');
ok('materialize: gaps = placeholder', isPh(arr[1]) && isPh(arr[3]));
ok('materialize: placeholder carries rowIndex', (arr[1] as { rowIndex: number }).rowIndex === 1);
ok('materialize: empty map → all placeholders', materializeViewport(new Map(), 3).every(isPh));
ok('materialize: rowCount 0 → []', materializeViewport(m, 0).length === 0);

// ── G-2 controller: push-based + in-place ──
// A mock viewport datasource: captures the callbacks + records the requested range; pushes on demand.
let params: ViewportDatasourceParams<R> | null = null;
let lastRange: [number, number] | null = null;
const ds: ViewportDatasource<R> = {
  init: (p) => { params = p; p.setRowCount(5); },
  setViewportRange: (a, b) => { lastRange = [a, b]; },
};

let emitted: Array<R | object> = [];
let emittedCount = 0;
const ctrl = createViewportRowModel<R>(ds, { rowCount: 0 }, (data, count) => { emitted = data; emittedCount = count; });

ok('init: setRowCount(5) applied + emitted', ctrl.getRowCount() === 5 && emittedCount === 5);
ok('init: emits all placeholders', emitted.length === 5 && emitted.every(isPh));

// setRange forwards to datasource.setViewportRange.
ctrl.setRange(1, 3);
ok('setRange → datasource.setViewportRange', lastRange !== null && lastRange[0] === 1 && lastRange[1] === 3);

// datasource pushes rows for the visible range.
params!.setRowData({ 1: { id: 1, v: 'B' }, 2: { id: 2, v: 'C' } });
ok('push: rows materialized at indices', (ctrl.getData()[1] as R).v === 'B' && (ctrl.getData()[2] as R).v === 'C');
ok('push: untouched index still placeholder', isPh(ctrl.getData()[0]));

// ★ in-place live update: re-push index 1 with new data → that row updates.
params!.setRowData({ 1: { id: 1, v: 'B2' } });
ok('★ in-place update: index 1 now B2', (ctrl.getData()[1] as R).v === 'B2');
ok('in-place: index 2 unchanged', (ctrl.getData()[2] as R).v === 'C');

// push beyond rowCount is ignored (guard).
params!.setRowData({ 99: { id: 99, v: 'x' } });
ok('push beyond rowCount ignored', ctrl.getData().length === 5);

// setRowCount grows the array.
params!.setRowCount(7);
ok('setRowCount(7) resizes', ctrl.getRowCount() === 7 && ctrl.getData().length === 7);

console.log(`viewportRowModel: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
