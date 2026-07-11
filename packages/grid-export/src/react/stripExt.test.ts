// EXPORT-UX P2 node spine — stripExt 파일명 정규화.
// Run: node --experimental-strip-types src/react/stripExt.test.ts
import { stripExt } from './stripExt.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

ok('undefined → undefined', stripExt(undefined) === undefined);
ok('빈 문자열 → undefined(falsy)', stripExt('') === undefined);
ok('.xlsx 제거', stripExt('주문목록.xlsx') === '주문목록');
ok('.csv 제거', stripExt('data.csv') === 'data');
ok('.pdf 제거', stripExt('report.pdf') === 'report');
ok('대문자 확장자 제거', stripExt('A.XLSX') === 'A');
ok('확장자 없으면 그대로', stripExt('주문목록') === '주문목록');
ok('중간 점은 유지, 끝만 제거', stripExt('2026.01.주문.xlsx') === '2026.01.주문');
ok('알 수 없는 확장자는 유지', stripExt('data.txt') === 'data.txt');

console.log(`\nstripExt: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
