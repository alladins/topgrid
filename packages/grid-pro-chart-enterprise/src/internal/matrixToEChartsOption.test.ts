// grid-pro-chart-enterprise node spine — matrixToEChartsOption. Runs via: node --experimental-strip-types.
// ★ Non-vacuous: the mapping changes SHAPE per family (axes appear/disappear, data is reshaped) and
// 100-stacked-bar actually NORMALISES values to 100 per category, secondary-axis ROUTES named series
// to yAxisIndex 1. Charting the wrong option is a silent, plausible bug — same data, wrong picture.
// echarts/grid-pro-chart imports in the SUT are type-only (stripped), so this test is zero-dep.
const assert = {
  ok(c: unknown, m?: string): void {
    if (!c) throw new Error(`assert.ok failed: ${m ?? ''}`);
  },
  equal(a: unknown, b: unknown, m?: string): void {
    if (a !== b) throw new Error(`assert.equal failed: ${String(a)} !== ${String(b)} ${m ?? ''}`);
  },
  deepEqual(a: unknown, b: unknown, m?: string): void {
    if (JSON.stringify(a) !== JSON.stringify(b))
      throw new Error(`deepEqual failed: ${JSON.stringify(a)} vs ${JSON.stringify(b)} ${m ?? ''}`);
  },
  throws(fn: () => void, m?: string): void {
    let threw = false;
    try {
      fn();
    } catch {
      threw = true;
    }
    if (!threw) throw new Error(`assert.throws failed: ${m ?? ''}`);
  },
};
import { matrixToEChartsOption } from './matrixToEChartsOption.ts';

let n = 0;
const test = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log('  ok -', name);
};

// 2 series ("A", "B") over 2 categories ("Q1", "Q2").
const data = {
  categories: ['Q1', 'Q2'],
  series: [
    { name: 'A', values: [25, 10] },
    { name: 'B', values: [75, 30] },
  ],
};

test('line → category xAxis + single value yAxis, no areaStyle, no stack', () => {
  const opt = matrixToEChartsOption(data, { type: 'line' }) as any;
  assert.deepEqual(opt.xAxis.data, ['Q1', 'Q2'], 'x = categories');
  assert.deepEqual(opt.yAxis, { type: 'value' }, 'single value axis');
  assert.equal(opt.series[0].type, 'line');
  assert.deepEqual(opt.series[0].data, [25, 10]);
  assert.ok(!('areaStyle' in opt.series[0]), 'line has no areaStyle');
  assert.ok(!('stack' in opt.series[0]), 'line not stacked');
});

test('area → series carry areaStyle (line base)', () => {
  const opt = matrixToEChartsOption(data, { type: 'area' }) as any;
  assert.equal(opt.series[0].type, 'line');
  assert.ok('areaStyle' in opt.series[0], 'area adds areaStyle');
});

test('stacked-bar → bar base + stack id on every series', () => {
  const opt = matrixToEChartsOption(data, { type: 'stacked-bar' }) as any;
  assert.equal(opt.series[0].type, 'bar');
  assert.equal(opt.series[0].stack, 'total');
  assert.equal(opt.series[1].stack, 'total');
});

test('100-stacked-bar → values normalised to 100 per category', () => {
  const opt = matrixToEChartsOption(data, { type: '100-stacked-bar' }) as any;
  // Q1: 25/(25+75)=25, 75; Q2: 10/(10+30)=25, 30/40=75. Raw 10/30 → 25/75 proves normalisation.
  assert.deepEqual(opt.series[0].data, [25, 25], 'A normalised');
  assert.deepEqual(opt.series[1].data, [75, 75], 'B normalised');
});

test('scatter → [index, value] point pairs', () => {
  const opt = matrixToEChartsOption(data, { type: 'scatter' }) as any;
  assert.equal(opt.series[0].type, 'scatter');
  assert.deepEqual(opt.series[0].data, [[0, 25], [1, 10]]);
});

test('pie → no axes, first series → {name,value} slices, single radius', () => {
  const opt = matrixToEChartsOption(data, { type: 'pie' }) as any;
  assert.ok(!('xAxis' in opt) && !('yAxis' in opt), 'pie has no axes');
  assert.equal(opt.series[0].type, 'pie');
  assert.deepEqual(opt.series[0].data, [
    { name: 'Q1', value: 25 },
    { name: 'Q2', value: 10 },
  ]);
  assert.equal(opt.series[0].radius, '70%');
});

test('doughnut → ring radius', () => {
  const opt = matrixToEChartsOption(data, { type: 'doughnut' }) as any;
  assert.equal(opt.series[0].type, 'pie');
  assert.deepEqual(opt.series[0].radius, ['40%', '70%']);
});

test('secondaryAxisSeries → two yAxes, named series routed to yAxisIndex 1', () => {
  const opt = matrixToEChartsOption(data, { type: 'line', secondaryAxisSeries: ['B'] }) as any;
  assert.equal(opt.yAxis.length, 2, 'two y axes');
  assert.ok(!('yAxisIndex' in opt.series[0]), 'A stays on primary');
  assert.equal(opt.series[1].yAxisIndex, 1, 'B on secondary');
});

test('dataLabels → series label.show true', () => {
  const opt = matrixToEChartsOption(data, { type: 'bar', dataLabels: true }) as any;
  assert.equal(opt.series[0].label.show, true);
});

test('bubble → scatter base with a symbolSize FUNCTION (value → size)', () => {
  const opt = matrixToEChartsOption(data, { type: 'bubble' }) as any;
  assert.equal(opt.series[0].type, 'scatter');
  assert.deepEqual(opt.series[0].data, [[0, 25], [1, 10]]);
  assert.equal(typeof opt.series[0].symbolSize, 'function', 'bubble sizes by value');
});

test('funnel → first series → {name,value} items, no axes', () => {
  const opt = matrixToEChartsOption(data, { type: 'funnel' }) as any;
  assert.ok(!('xAxis' in opt), 'funnel has no axes');
  assert.equal(opt.series[0].type, 'funnel');
  assert.deepEqual(opt.series[0].data, [{ name: 'Q1', value: 25 }, { name: 'Q2', value: 10 }]);
});

test('treemap → first series → {name,value} items', () => {
  const opt = matrixToEChartsOption(data, { type: 'treemap' }) as any;
  assert.equal(opt.series[0].type, 'treemap');
  assert.deepEqual(opt.series[0].data, [{ name: 'Q1', value: 25 }, { name: 'Q2', value: 10 }]);
});

test('radar → indicator per category, one polygon per series', () => {
  const opt = matrixToEChartsOption(data, { type: 'radar' }) as any;
  // indicators = categories, max = overall max value (75).
  assert.deepEqual(opt.radar.indicator, [{ name: 'Q1', max: 75 }, { name: 'Q2', max: 75 }]);
  assert.equal(opt.series[0].type, 'radar');
  assert.deepEqual(opt.series[0].data, [
    { name: 'A', value: [25, 10] },
    { name: 'B', value: [75, 30] },
  ]);
});

test('heatmap → (x,y,value) triples + visualMap domain', () => {
  const opt = matrixToEChartsOption(data, { type: 'heatmap' }) as any;
  assert.deepEqual(opt.yAxis.data, ['A', 'B'], 'y = series names');
  // series A (y=0): [0,0,25],[1,0,10]; series B (y=1): [0,1,75],[1,1,30].
  assert.deepEqual(opt.series[0].data, [[0, 0, 25], [1, 0, 10], [0, 1, 75], [1, 1, 30]]);
  assert.equal(opt.visualMap.max, 75, 'visualMap covers the domain');
});

test('candlestick → per-category [O,C,L,H] from series 0..3', () => {
  // O=A, C=B, L=lows, H=highs.
  const ohlc = {
    categories: ['D1', 'D2'],
    series: [
      { name: 'open', values: [10, 20] },
      { name: 'close', values: [15, 18] },
      { name: 'low', values: [8, 16] },
      { name: 'high', values: [17, 22] },
    ],
  };
  const opt = matrixToEChartsOption(ohlc, { type: 'candlestick' }) as any;
  assert.equal(opt.series[0].type, 'candlestick');
  // row i pulls index i from each of the 4 series.
  assert.deepEqual(opt.series[0].data, [[10, 15, 8, 17], [20, 18, 16, 22]]);
});

test('boxplot → per-category [min,Q1,med,Q3,max] from series 0..4', () => {
  const stats = {
    categories: ['G1'],
    series: [
      { name: 'min', values: [1] },
      { name: 'q1', values: [3] },
      { name: 'med', values: [5] },
      { name: 'q3', values: [7] },
      { name: 'max', values: [9] },
    ],
  };
  const opt = matrixToEChartsOption(stats, { type: 'boxplot' }) as any;
  assert.equal(opt.series[0].type, 'boxplot');
  assert.deepEqual(opt.series[0].data, [[1, 3, 5, 7, 9]]);
});

test('sankey → nodes = categories ∪ series, links = (category → series, value>0)', () => {
  const opt = matrixToEChartsOption(data, { type: 'sankey' }) as any;
  assert.equal(opt.series[0].type, 'sankey');
  assert.deepEqual(opt.series[0].data.map((d: any) => d.name), ['Q1', 'Q2', 'A', 'B']);
  // every positive (category, series) pair becomes a link; all 4 values here are > 0.
  assert.deepEqual(opt.series[0].links, [
    { source: 'Q1', target: 'A', value: 25 },
    { source: 'Q2', target: 'A', value: 10 },
    { source: 'Q1', target: 'B', value: 75 },
    { source: 'Q2', target: 'B', value: 30 },
  ]);
});

test('unsupported type → throws (catalog never lies)', () => {
  assert.throws(() => matrixToEChartsOption(data, { type: 'nope' as any }), 'unknown type rejected');
});

console.log(`\n${n} passed`);
