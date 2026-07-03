// node --experimental-strip-types — 반응형 재계산 검증(DOM 불필요). dist 빌드 후 실행.
// ★non-vacuous: data ref 를 바꾸면 model 이 재계산돼야 한다(정적 스냅샷이면 실패).
// 같은 엔진(grid-pro-pivot-core)을 React usePivot 과 공유 — 여기선 Vue 반응형 배선을 검증.
import assert from 'node:assert/strict';
import { ref } from 'vue';
import { useVuePivot } from '../dist/index.mjs';
import type { PivotRow } from '../dist/index.mjs';

let pass = 0;
const ok = (c: boolean, m: string): void => {
  assert.ok(c, m);
  pass++;
};
const findData = (rows: PivotRow[], pred: (r: PivotRow) => boolean): PivotRow => {
  const r = rows.find((x) => x.__kind === 'data' && pred(x));
  assert.ok(r !== undefined, 'expected data row');
  return r;
};

const rows2024 = [
  { region: 'N', quarter: 'Q1', amt: 10 },
  { region: 'N', quarter: 'Q2', amt: 20 },
  { region: 'S', quarter: 'Q1', amt: 8 },
];
const config = {
  rows: ['region'],
  columns: ['quarter'],
  values: [{ field: 'amt', aggregationFn: 'sum' }],
};

// --- ref 입력 ---
const data = ref(rows2024);
const cfg = ref(config);
const model = useVuePivot(data, cfg);

ok(Array.isArray(model.value.rows) && model.value.rows.length > 0, 'model.rows 계산됨');
const nRow = findData(model.value.rows, (r) => r.region === 'N');
ok(nRow['Q1__0'] === 10 && nRow['Q2__0'] === 20, 'N leaf 셀 sum(Q1)=10, sum(Q2)=20');
const firstModelRef = model.value;

// --- ★반응형: data 교체 → 재계산 ---
data.value = [
  { region: 'N', quarter: 'Q1', amt: 99 },
  { region: 'S', quarter: 'Q1', amt: 8 },
];
const nRow2 = findData(model.value.rows, (r) => r.region === 'N');
ok(nRow2['Q1__0'] === 99, '★data ref 변경 시 재계산(N/Q1=99)');
ok(model.value !== firstModelRef, '★새 모델 객체(computed 무효화)');

// --- config 교체 → 재계산(축 전환) ---
cfg.value = { rows: ['quarter'], columns: ['region'], values: [{ field: 'amt', aggregationFn: 'sum' }] };
const q1Row = findData(model.value.rows, (r) => r.quarter === 'Q1');
ok(q1Row['N__0'] === 99, '★config ref 변경 시 축 전환 재계산(Q1/N=99)');

// --- 게터 입력 형태 ---
let src = rows2024;
const modelG = useVuePivot(() => src, () => config);
ok(modelG.value.rows.length > 0, '게터 입력 형태 동작');

// --- 원시(비반응형) 입력 형태 ---
const modelP = useVuePivot(rows2024, config);
ok(modelP.value.rows.length > 0, '원시 배열/객체 입력 형태 동작');

console.log(`\n[grid-pro-pivot-vue useVuePivot] ${pass} passed`);
