/**
 * Built-in spreadsheet functions (MOD-GRID-26 G-1) — **error-aware**, local implementation.
 *
 * ADR-002 (ADR-001 N=2 re-read): the pivot's `BUILT_IN_REDUCERS` take clean `number[]` and return
 * null-on-empty (a pivot display choice). Sheet functions take **error-aware** `CellValue[]`,
 * propagate errors, and have sheet semantics (SUM([])=0, AVERAGE([])=#DIV/0!). Different input
 * contract → not the same function; reuse would be the forced "억지 재사용" ADR-001 rejects.
 *
 * PoC semantics: any error argument propagates (returns the first error). Numbers aggregate;
 * non-numeric values (strings/booleans/empty cells) are ignored, as in Excel range aggregation.
 */

import { cellError, isCellError, type CellValue, type CellError } from '../types.js';

/** Collect finite numbers from values; returns the first {@link CellError} encountered instead. */
function collectNumbers(values: CellValue[]): CellError | number[] {
  const nums: number[] = [];
  for (const v of values) {
    if (isCellError(v)) return v;
    if (typeof v === 'number' && Number.isFinite(v)) nums.push(v);
    // strings / booleans / empty / non-finite → ignored (Excel range behavior)
  }
  return nums;
}

export const FUNCTIONS: Readonly<Record<string, (values: CellValue[]) => CellValue>> = {
  SUM: (values) => {
    const n = collectNumbers(values);
    if (isCellError(n)) return n;
    return n.reduce((a, b) => a + b, 0);
  },
  AVERAGE: (values) => {
    const n = collectNumbers(values);
    if (isCellError(n)) return n;
    if (n.length === 0) return cellError('#DIV/0!');
    return n.reduce((a, b) => a + b, 0) / n.length;
  },
  MIN: (values) => {
    const n = collectNumbers(values);
    if (isCellError(n)) return n;
    return n.length === 0 ? 0 : Math.min(...n);
  },
  MAX: (values) => {
    const n = collectNumbers(values);
    if (isCellError(n)) return n;
    return n.length === 0 ? 0 : Math.max(...n);
  },
  COUNT: (values) => {
    const n = collectNumbers(values);
    if (isCellError(n)) return n;
    return n.length;
  },
  // MOD-GRID-32 G-1: 논리 함수(IF 는 lazy 라 evaluate 에서 별도 처리; AND/OR/NOT 은 eager). 에러 전파.
  AND: (values) => {
    if (values.length === 0) return cellError('#ERROR!');
    for (const v of values) {
      const b = toBoolFn(v);
      if (isCellError(b)) return b;
      if (!b) return false;
    }
    return true;
  },
  OR: (values) => {
    if (values.length === 0) return cellError('#ERROR!');
    for (const v of values) {
      const b = toBoolFn(v);
      if (isCellError(b)) return b;
      if (b) return true;
    }
    return false;
  },
  NOT: (values) => {
    if (values.length !== 1) return cellError('#ERROR!');
    const b = toBoolFn(values[0]!);
    return isCellError(b) ? b : !b;
  },
};

/** 진리값 판정(논리 함수용). 에러 전파; boolean→자신; number→0 아님; 그 외(문자열)→#ERROR!. */
function toBoolFn(v: CellValue): boolean | CellError {
  if (isCellError(v)) return v;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  return cellError('#ERROR!');
}

// ─── MOD-GRID-32 G-2: text + math 함수 ───────────────────────────────────────
// ★ positional 함수는 evaluate 가 **per-arg 스칼라**(ast.args.map(evaluate))로 호출한다(flat-values 아님).
// range 인자는 evaluate(range)=#ERROR! 로 들어와 에러 전파 — flat 전개의 조용한 오독(ROUND(A1:A3,2)→digits 오독) 방지.

/** 문자열 강제(에러 전파; number/boolean→문자열화; Excel 표시 규약). */
function toStr(v: CellValue): string | CellError {
  if (isCellError(v)) return v;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return v ? 'TRUE' : 'FALSE';
}
/** 수치 강제(에러 전파; bool→1/0; 빈 문자열→0; 비수치 문자열→#ERROR!). evaluate.ts toNumber 와 동형. */
function toNum(v: CellValue): number | CellError {
  if (isCellError(v)) return v;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v.trim() === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : cellError('#ERROR!');
}

/** 고정/위치 인자 함수(per-arg 스칼라). text=number→string 강제 지원(LEN(123)=3). */
export const POSITIONAL_FUNCTIONS: Readonly<Record<string, (args: CellValue[]) => CellValue>> = {
  LEN: (a) => { const s = toStr(a[0] ?? ''); return isCellError(s) ? s : s.length; },
  UPPER: (a) => { const s = toStr(a[0] ?? ''); return isCellError(s) ? s : s.toUpperCase(); },
  LOWER: (a) => { const s = toStr(a[0] ?? ''); return isCellError(s) ? s : s.toLowerCase(); },
  TRIM: (a) => { const s = toStr(a[0] ?? ''); return isCellError(s) ? s : s.trim(); },
  LEFT: (a) => {
    const s = toStr(a[0] ?? ''); if (isCellError(s)) return s;
    const n = a[1] === undefined ? 1 : toNum(a[1]); if (isCellError(n)) return n;
    return s.slice(0, Math.max(0, Math.trunc(n)));
  },
  RIGHT: (a) => {
    const s = toStr(a[0] ?? ''); if (isCellError(s)) return s;
    const n = a[1] === undefined ? 1 : toNum(a[1]); if (isCellError(n)) return n;
    const k = Math.max(0, Math.trunc(n));
    return k === 0 ? '' : s.slice(-k);
  },
  MID: (a) => {
    const s = toStr(a[0] ?? ''); if (isCellError(s)) return s;
    const start = toNum(a[1] ?? cellError('#ERROR!')); if (isCellError(start)) return start;
    const len = toNum(a[2] ?? cellError('#ERROR!')); if (isCellError(len)) return len;
    const from = Math.max(0, Math.trunc(start) - 1); // Excel MID is 1-based
    return s.slice(from, from + Math.max(0, Math.trunc(len)));
  },
  CONCATENATE: (a) => {
    let out = '';
    for (const v of a) { const s = toStr(v); if (isCellError(s)) return s; out += s; }
    return out;
  },
  ABS: (a) => { const n = toNum(a[0] ?? cellError('#ERROR!')); return isCellError(n) ? n : Math.abs(n); },
  INT: (a) => { const n = toNum(a[0] ?? cellError('#ERROR!')); return isCellError(n) ? n : Math.floor(n); },
  ROUND: (a) => {
    const n = toNum(a[0] ?? cellError('#ERROR!')); if (isCellError(n)) return n;
    const d = a[1] === undefined ? 0 : toNum(a[1]); if (isCellError(d)) return d;
    const f = 10 ** Math.trunc(d);
    return Math.round(n * f) / f;
  },
  MOD: (a) => {
    const n = toNum(a[0] ?? cellError('#ERROR!')); if (isCellError(n)) return n;
    const d = toNum(a[1] ?? cellError('#ERROR!')); if (isCellError(d)) return d;
    if (d === 0) return cellError('#DIV/0!');
    return ((n % d) + d) % d; // Excel MOD: result takes the sign of the divisor
  },
  POWER: (a) => {
    const b = toNum(a[0] ?? cellError('#ERROR!')); if (isCellError(b)) return b;
    const e = toNum(a[1] ?? cellError('#ERROR!')); if (isCellError(e)) return e;
    const r = b ** e;
    return Number.isFinite(r) ? r : cellError('#ERROR!');
  },

  // ─── MOD-GRID-42 G-2: 날짜 함수 (serial 모델) ───
  // serial = epoch(1899-12-30 UTC) 이후 일수. 1900 leap 버그는 **미모방**(Excel serial 수치와 1900-03 이전 1일 차 가능,
  // 문서화 divergence). 검증 spine = 라운드트립(YEAR(DATE(y,m,d))===y …), Excel 수치 일치 아님.
  DATE: (a) => {
    const y = toNum(a[0] ?? cellError('#ERROR!')); if (isCellError(y)) return y;
    const m = toNum(a[1] ?? cellError('#ERROR!')); if (isCellError(m)) return m;
    const d = toNum(a[2] ?? cellError('#ERROR!')); if (isCellError(d)) return d;
    return dateToSerial(Math.trunc(y), Math.trunc(m), Math.trunc(d)); // Date.UTC → month-overflow parity 무료
  },
  YEAR: (a) => dateComponent(a[0], (dt) => dt.getUTCFullYear()),
  MONTH: (a) => dateComponent(a[0], (dt) => dt.getUTCMonth() + 1),
  DAY: (a) => dateComponent(a[0], (dt) => dt.getUTCDate()),

  // ─── MOD-GRID-42 G-2: 재무 함수 (Excel 부호규약 = 유출 음수; rate=0 특수-케이스) ───
  PMT: (a) => financial(a, (rate, nper, pv, fv, type) =>
    rate === 0 ? -(pv + fv) / nper
      : (-rate * (pv * (1 + rate) ** nper + fv)) / (((1 + rate) ** nper - 1) * (1 + rate * type))),
  FV: (a) => financial(a, (rate, nper, pmt, pv, type) =>
    rate === 0 ? -(pv + pmt * nper)
      : -(pv * (1 + rate) ** nper + pmt * (1 + rate * type) * ((1 + rate) ** nper - 1) / rate)),
  PV: (a) => financial(a, (rate, nper, pmt, fv, type) =>
    rate === 0 ? -(fv + pmt * nper)
      : -(fv + pmt * (1 + rate * type) * ((1 + rate) ** nper - 1) / rate) / (1 + rate) ** nper),
};

// ─── MOD-GRID-42 date helpers ───
const DATE_EPOCH_MS = Date.UTC(1899, 11, 31); // serial 0 = 1899-12-31 → DATE(1900,1,1)=1 (Excel anchor)
const DAY_MS = 86_400_000;
function dateToSerial(y: number, m: number, d: number): number {
  return Math.round((Date.UTC(y, m - 1, d) - DATE_EPOCH_MS) / DAY_MS); // m is 1-based; Date.UTC handles overflow
}
/** Extract a component from a serial-number date arg (error-aware). */
function dateComponent(arg: CellValue | undefined, pick: (dt: Date) => number): CellValue {
  const n = toNum(arg ?? cellError('#ERROR!'));
  if (isCellError(n)) return n;
  return pick(new Date(DATE_EPOCH_MS + Math.trunc(n) * DAY_MS));
}

// ─── MOD-GRID-42 financial helper ───
// args: (rate, nper, payment-or-pv, [pv-or-fv=0], [type=0]) — positional, error-aware.
function financial(
  a: CellValue[],
  formula: (rate: number, nper: number, p3: number, p4: number, type: number) => number,
): CellValue {
  const rate = toNum(a[0] ?? cellError('#ERROR!')); if (isCellError(rate)) return rate;
  const nper = toNum(a[1] ?? cellError('#ERROR!')); if (isCellError(nper)) return nper;
  const p3 = toNum(a[2] ?? cellError('#ERROR!')); if (isCellError(p3)) return p3;
  const p4 = a[3] === undefined ? 0 : toNum(a[3]); if (isCellError(p4)) return p4;
  const type = a[4] === undefined ? 0 : toNum(a[4]); if (isCellError(type)) return type;
  if (nper === 0) return cellError('#DIV/0!'); // PMT/FV/PV undefined at 0 periods
  const r = formula(rate, nper, p3, p4, type);
  return Number.isFinite(r) ? r : cellError('#ERROR!');
}
