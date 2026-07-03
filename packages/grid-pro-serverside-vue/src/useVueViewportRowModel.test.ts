// node --experimental-strip-types — 실제 Vue mount + push datasource + DOM/반응형 단언.
// ★non-vacuous: setRange 로 가시 범위를 알리면 datasource 가 push 한 행이 data ref 에 반영돼야 한다.
import './setup-happydom.ts'; // ★must precede vue
import assert from 'node:assert/strict';
import { createApp, defineComponent, h, nextTick } from 'vue';
import { useVueViewportRowModel, isRowPlaceholder } from '../dist/index.mjs';

let pass = 0;
const ok = (c: boolean, m: string): void => {
  assert.ok(c, m);
  pass++;
};

interface Row {
  id: number;
  name: string;
}

// push 기반 fake datasource: setViewportRange 시 그 범위의 행을 push.
let push: ((rows: Record<number, Row>) => void) | null = null;
let lastRange: [number, number] | null = null;
const datasource = {
  init(params: { setRowCount: (n: number) => void; setRowData: (r: Record<number, Row>) => void }) {
    push = params.setRowData;
    params.setRowCount(100);
  },
  setViewportRange(first: number, last: number) {
    lastRange = [first, last];
    const batch: Record<number, Row> = {};
    for (let i = first; i <= last; i++) batch[i] = { id: i, name: 'row' + i };
    push?.(batch);
  },
};

let api: ReturnType<typeof useVueViewportRowModel<Row>> | null = null;
const Comp = defineComponent({
  setup() {
    api = useVueViewportRowModel<Row>(datasource, { rowCount: 100 });
    return () => h('div');
  },
});
const el = document.createElement('div');
document.body.appendChild(el);
createApp(Comp).mount(el);
await nextTick();

ok(api !== null, '컴포저블 결과 획득');
const model = api!;
ok(model.totalCount.value === 100, 'datasource.init → setRowCount(100) 반영');
ok(isRowPlaceholder(model.data.value[0]), '초기값 = placeholder(미로드)');

// --- ★가시 범위 push ---
model.setRange(0, 4);
await nextTick();
ok(lastRange !== null && lastRange[0] === 0 && lastRange[1] === 4, 'setRange → datasource.setViewportRange 전달');
const r0 = model.data.value[0];
ok(!isRowPlaceholder(r0) && (r0 as Row).id === 0 && (r0 as Row).name === 'row0', '★범위 내 행이 실제 데이터로 push 반영');
ok(isRowPlaceholder(model.data.value[50]), '범위 밖(50)은 여전히 placeholder');

// --- in-place 라이브 업데이트: 같은 인덱스 재-push → 갱신 ---
push?.({ 0: { id: 0, name: 'LIVE' } });
await nextTick();
ok((model.data.value[0] as Row).name === 'LIVE', '★같은 인덱스 재-push = in-place 라이브 업데이트');

console.log(`\n[grid-pro-serverside-vue useVueViewportRowModel] ${pass} passed`);
