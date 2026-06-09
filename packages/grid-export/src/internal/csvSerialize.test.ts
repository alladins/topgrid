// MOD-73 node spine — buildRowsCsv / escapeCsvValue pure serialization.
// Run: node --experimental-strip-types src/internal/csvSerialize.test.ts
import { buildRowsCsv, escapeCsvValue } from './csvSerialize.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

interface Row extends Record<string, unknown> { id: number; name: string; note: unknown }
const columns = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: '이름' },
  { key: 'note', header: '비고' },
];

// 1) 헤더 + 데이터, CRLF 구분, comma delimiter
const rows: Row[] = [
  { id: 1, name: 'Alice', note: 'ok' },
  { id: 2, name: 'Bob', note: null },
];
const csv = buildRowsCsv(rows, columns, ',');
const lines = csv.split('\r\n');
ok('header row', lines[0] === 'ID,이름,비고');
ok('row count = 1 header + 2 data', lines.length === 3);
ok('data row 1', lines[1] === '1,Alice,ok');
ok('null cell → empty string', lines[2] === '2,Bob,');

// 2) RFC 4180 escaping — comma / quote / newline 포함 시 quote 래핑 + 내부 quote 이중화
ok('escape: comma', escapeCsvValue('a,b', ',') === '"a,b"');
ok('escape: quote doubled', escapeCsvValue('a"b', ',') === '"a""b"');
ok('escape: newline', escapeCsvValue('a\nb', ',') === '"a\nb"');
ok('escape: plain untouched', escapeCsvValue('plain', ',') === 'plain');
ok('escape: tab not quoted under comma', escapeCsvValue('a\tb', ',') === 'a\tb');

const tricky: Row[] = [{ id: 3, name: 'Smith, John', note: 'say "hi"' }];
const csv2 = buildRowsCsv(tricky, columns, ',');
ok('field with comma is quoted', csv2.split('\r\n')[1] === '3,"Smith, John","say ""hi"""');

// 3) TSV delimiter — comma in value NOT quoted, tab triggers quoting
const csvTab = buildRowsCsv([{ id: 4, name: 'a,b', note: 'x\ty' }], columns, '\t');
const tabLine = csvTab.split('\r\n')[1];
ok('tsv: comma value unquoted', tabLine === '4\ta,b\t"x\ty"');

// 4) empty rows → header only
const headerOnly = buildRowsCsv([], columns, ',');
ok('empty rows → single header line', headerOnly === 'ID,이름,비고');

console.log(`\ncsvSerialize: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
