// node --experimental-strip-types — 실제 Vue mount + async pull datasource + 반응형 단언.
// ★non-vacuous: ensureRange 로 가시 범위를 알리면 getRows 블록 요청 → 응답이 data ref 에 반영,
// setSorting 은 서버 요청의 sortModel 로 흘러야 한다(epoch 불변식은 코어에서 검증됨).
import './setup-happydom.ts'; // ★must precede vue
import assert from 'node:assert/strict';
import { createApp, defineComponent, h, nextTick } from 'vue';
import { useVueServerSideData, isRowPlaceholder } from '../dist/index.mjs';
import type { GetRowsRequest, GetRowsResult } from '../dist/index.mjs';

let pass = 0;
const ok = (c: boolean, m: string): void => {
  assert.ok(c, m);
  pass++;
};
const tick = async (): Promise<void> => {
  await new Promise((r) => setTimeout(r, 5));
  await nextTick();
};

interface Row {
  id: number;
  name: string;
}

const requests: GetRowsRequest[] = [];
const datasource = {
  async getRows(req: GetRowsRequest): Promise<GetRowsResult<Row>> {
    requests.push(req);
    const rows: Row[] = [];
    for (let i = req.startRow; i < req.endRow; i++) rows.push({ id: i, name: 'r' + i });
    return { rows };
  },
};

let api: ReturnType<typeof useVueServerSideData<Row>> | null = null;
const Comp = defineComponent({
  setup() {
    api = useVueServerSideData<Row>(datasource, { blockSize: 10, rowCount: 100 });
    return () => h('div');
  },
});
const el = document.createElement('div');
document.body.appendChild(el);
createApp(Comp).mount(el);
await nextTick();

const model = api!;
ok(model.totalCount.value === 100, '초기 totalCount = 100');
ok(isRowPlaceholder(model.data.value[0]), '초기값 = placeholder');

// --- ★가시 범위 → 블록 fetch ---
model.ensureRange(0, 5);
await tick();
ok(requests.length >= 1, '★ensureRange → getRows 블록 요청 발생');
ok(requests[0]!.startRow === 0 && requests[0]!.endRow === 10, 'blockSize=10 → 블록 [0,10) 요청');
const r0 = model.data.value[0];
ok(!isRowPlaceholder(r0) && (r0 as Row).id === 0, '★응답이 data ref 에 반영(0번 실제 행)');

// --- ★정렬 → 서버 요청 sortModel 로 흐름 ---
const before = requests.length;
model.setSorting([{ id: 'name', desc: true }]);
model.ensureRange(0, 5);
await tick();
const sorted = requests.slice(before).find((q) => q.sortModel.length > 0);
ok(sorted !== undefined, '★setSorting → 후속 getRows 요청에 sortModel 실림');
ok(sorted!.sortModel[0]!.colId === 'name', 'sortModel colId = name');

// --- refresh: epoch++ 후 재요청 ---
const beforeRefresh = requests.length;
model.refresh();
await tick();
ok(requests.length > beforeRefresh, '★refresh → 재요청 발생');

console.log(`\n[grid-pro-serverside-vue useVueServerSideData] ${pass} passed`);
