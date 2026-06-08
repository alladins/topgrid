// MOD-GRID-69: .xlsx import of the spreadsheet (with formulas) — chromium gate. A base64 .xlsx
// (A1=10, A2=20, A3==A1+A2, B1="hi") is decoded → importXlsxToSheetCells → createSheet setCell → the
// engine RE-EVALUATES the imported formula. ★end-to-end (LESS-006): the imported formula cell A3 shows
// the engine-computed 30 (not a static 0 cache) — proving import + formula evaluation, not just parsing.
// C-3 예외: mock 데이터 (Storybook stories).
import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { createSheet } from '@topgrid/grid-pro-sheet';
import { importXlsxToSheetCells } from '@topgrid/grid-export';
import { XLSX_FIXTURE_B64 } from './xlsxFixture';

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const REFS = ['A1', 'A2', 'A3', 'B1'];

function SheetXlsxImportDemo() {
  const sheet = useMemo(() => {
    const s = createSheet();
    const cells = importXlsxToSheetCells(decodeBase64(XLSX_FIXTURE_B64));
    for (const ref of Object.keys(cells)) s.setCell(ref, cells[ref]!);
    return s;
  }, []);

  return (
    <table style={{ borderCollapse: 'collapse' }}>
      <tbody>
        {REFS.map((ref) => (
          <tr key={ref}>
            <th style={{ border: '1px solid #ccc', padding: '4px 8px' }}>{ref}</th>
            <td data-cell={ref} style={{ border: '1px solid #ccc', padding: '4px 8px', minWidth: 80 }}>
              {sheet.getDisplay(ref)}
            </td>
            <td style={{ border: '1px solid #ccc', padding: '4px 8px', color: '#888' }}>
              {sheet.getRaw(ref)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const meta: Meta<typeof SheetXlsxImportDemo> = {
  title: 'grid-pro-sheet/Xlsx Import',
  component: SheetXlsxImportDemo,
};
export default meta;
type Story = StoryObj<typeof SheetXlsxImportDemo>;

export const ImportFormula: Story = {
  name: '.xlsx 가져오기 (수식 보존 + 엔진 재계산)',
};
