// node --experimental-strip-types — 실제 Vue mount + async 그룹 datasource + 반응형 단언.
// ★non-vacuous: ensureRange 는 rowGroupCols/groupKeys 를 실은 getRows 를 유발, 응답은 data ref 로 흐르고,
// toggleGroup 은 확장된 그룹의 자식 요청을 낸다(트리 캐시 로직은 코어에서 검증됨).
import './setup-happydom.ts'; // ★must precede vue
import assert from 'node:assert/strict';
import { createApp, defineComponent, h, nextTick } from 'vue';
import { useVueServerSideTree } from '../dist/index.mjs';
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
  country: string;
  city?: string;
  amt?: number;
}

const requests: GetRowsRequest[] = [];
const datasource = {
  async getRows(req: GetRowsRequest): Promise<GetRowsResult<Row>> {
    requests.push(req);
    // 최상위(groupKeys=[]) → 국가 그룹 행; KR 확장 → 도시 리프.
    if (!req.groupKeys || req.groupKeys.length === 0) {
      return { rows: [{ country: 'KR' }, { country: 'US' }], lastRow: 2 };
    }
    return { rows: [{ country: req.groupKeys[0]!, city: 'Seoul', amt: 10 }], lastRow: 1 };
  },
};

let api: ReturnType<typeof useVueServerSideTree<Row>> | null = null;
const Comp = defineComponent({
  setup() {
    api = useVueServerSideTree<Row>(datasource, { blockSize: 10, rowGroupCols: ['country'] });
    return () => h('div');
  },
});
const el = document.createElement('div');
document.body.appendChild(el);
createApp(Comp).mount(el);
await nextTick();

const model = api!;
ok(Array.isArray(model.data.value) && model.data.value.length >= 1, '초기 표시행(로딩 placeholder) 존재');
const initialRef = model.data.value;

// --- ★최상위 그룹 fetch ---
model.ensureRange(0, 5);
await tick();
ok(requests.length >= 1, '★ensureRange → getRows 발생');
ok(requests[0]!.rowGroupCols?.[0] === 'country', 'rowGroupCols=[country] 실림');
ok((requests[0]!.groupKeys ?? []).length === 0, '최상위 요청 groupKeys=[]');
ok(model.data.value !== initialRef, '★응답 후 data ref 갱신(반응형)');
const afterTop = model.data.value.length;
ok(afterTop >= 2, '국가 그룹 행 2개 표시');

// --- ★그룹 확장 → 자식 요청 ---
const before = requests.length;
model.toggleGroup(['KR']);
await tick();
const childReq = requests.slice(before).find((q) => (q.groupKeys ?? [])[0] === 'KR');
ok(childReq !== undefined, '★toggleGroup(KR) → groupKeys=[KR] 자식 요청 발생');

// --- refresh ---
const beforeRefresh = requests.length;
model.refresh();
await tick();
ok(requests.length > beforeRefresh, '★refresh → 재요청 발생');

console.log(`\n[grid-pro-serverside-vue useVueServerSideTree] ${pass} passed`);
