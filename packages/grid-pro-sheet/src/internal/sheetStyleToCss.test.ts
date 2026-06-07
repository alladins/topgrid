// MOD-GRID-63 G-1 node spine — pure cell style→CSS map. Run: node --experimental-strip-types src/internal/sheetStyleToCss.test.ts
import { sheetStyleToCss } from './sheetStyleToCss.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

ok('empty → {}', Object.keys(sheetStyleToCss({})).length === 0);
ok('bold → fontWeight bold', sheetStyleToCss({ bold: true }).fontWeight === 'bold');
ok('bold:false → omitted', sheetStyleToCss({ bold: false }).fontWeight === undefined);
ok('italic → fontStyle italic', sheetStyleToCss({ italic: true }).fontStyle === 'italic');
ok('color', sheetStyleToCss({ color: '#f00' }).color === '#f00');
ok('background', sheetStyleToCss({ background: '#fee' }).background === '#fee');
ok('align right → textAlign', sheetStyleToCss({ align: 'right' }).textAlign === 'right');
ok('border → 1px solid', sheetStyleToCss({ border: true }).border === '1px solid #94a3b8');
{
  const css = sheetStyleToCss({ bold: true, background: '#fee', align: 'center' });
  ok('combined: bold+bg+align', css.fontWeight === 'bold' && css.background === '#fee' && css.textAlign === 'center');
  ok('combined: unset omitted (no color/italic)', css.color === undefined && css.fontStyle === undefined);
}

console.log(`sheetStyleToCss spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
