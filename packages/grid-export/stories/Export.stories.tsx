// spec G-002 Section 7 #7 / Step 6
// D6 결정: Component 0이지만 함수 데모 목적으로 story 포함
// C-3 예외: mock Grid + 버튼 핸들러는 Storybook stories에서만 허용 (D7 결정, ADR-006)
// EC-06: 실제 export 호출은 mock Table 객체로 시뮬레이션 (PDF/Excel 실제 생성 없음)
import type { Meta, StoryObj } from '@storybook/react';
import {
  exportToExcel,
  exportToCSV,
  exportToPdf,
  copyToClipboard,
  printGrid,
} from '@tomis/grid-export';
import type { Table } from '@tanstack/react-table';

// C-3 예외: mock rows 데이터 — Storybook stories 허용 범위
interface MockExportRow {
  id: number;
  name: string;
  dept: string;
  amount: number;
}

const mockRows: MockExportRow[] = [
  { id: 1, name: '홍길동', dept: '개발팀', amount: 5000000 },
  { id: 2, name: '김영희', dept: '기획팀', amount: 4200000 },
  { id: 3, name: '이철수', dept: '영업팀', amount: 6100000 },
];

// EC-06: 실제 다운로드 라이브러리 호출 없이 함수 시그니처 데모
// grid-export 함수들은 TanStack Table 인스턴스를 받으므로, 여기서는 console.log로 시그니처 확인
function makeMockTable(): Table<MockExportRow> {
  // Minimal mock — Storybook 데모용 (C-3 예외 범위)
  return {
    getCoreRowModel: () => ({
      rows: mockRows.map((row, i) => ({
        id: String(i),
        original: row,
        getVisibleCells: () => [],
        subRows: [],
        depth: 0,
        index: i,
        getValue: (_colId: string) => undefined,
      })),
    }),
    getFilteredRowModel: () => ({
      rows: mockRows.map((row, i) => ({
        id: String(i),
        original: row,
        getVisibleCells: () => [],
        subRows: [],
        depth: 0,
        index: i,
        getValue: (_colId: string) => undefined,
      })),
    }),
    getSelectedRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getAllLeafColumns: () => [
      { id: 'id', columnDef: { header: 'ID' } },
      { id: 'name', columnDef: { header: '이름' } },
      { id: 'dept', columnDef: { header: '부서' } },
      { id: 'amount', columnDef: { header: '금액' } },
    ],
    options: {},
    getState: () => ({ columnPinning: {}, columnOrder: [] }),
  } as unknown as Table<MockExportRow>;
}

// D6 결정: grid-export는 Component 0 — 함수 데모용 wrapper 컴포넌트를 story로 구성
interface ExportDemoProps {
  label: string;
  description: string;
  onExport: () => void;
}

function ExportDemo({ label, description, onExport }: ExportDemoProps) {
  return (
    <div className="p-4 flex flex-col gap-3">
      <p className="text-sm text-gray-600">{description}</p>
      <button
        type="button"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 self-start"
        onClick={onExport}
      >
        {label}
      </button>
      <pre className="text-xs bg-gray-100 p-2 rounded">
        {JSON.stringify(mockRows, null, 2)}
      </pre>
    </div>
  );
}

const meta: Meta<typeof ExportDemo> = {
  title: 'grid-export/Export',
  component: ExportDemo,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ExportDemo>;

export const ExportToExcel: Story = {
  name: 'exportToExcel — Excel 다운로드',
  args: {
    label: 'Excel 내보내기',
    description: 'exportToExcel(table, { fileName: "export.xlsx" }) 호출 데모',
    onExport: () => {
      try {
        exportToExcel(makeMockTable(), { fileName: 'demo-export.xlsx' });
      } catch (e) {
        console.log('exportToExcel 데모 (실제 xlsx 라이브러리 설치 후 동작):', e);
      }
    },
  },
};

export const ExportToCSV: Story = {
  name: 'exportToCSV — CSV 다운로드',
  args: {
    label: 'CSV 내보내기',
    description: 'exportToCSV(table, { fileName: "export.csv" }) 호출 데모',
    onExport: () => {
      try {
        exportToCSV(makeMockTable(), { fileName: 'demo-export.csv' });
      } catch (e) {
        console.log('exportToCSV 데모 (실제 csv 라이브러리 설치 후 동작):', e);
      }
    },
  },
};

export const ExportToPdf: Story = {
  name: 'exportToPdf — PDF 다운로드',
  args: {
    label: 'PDF 내보내기',
    description: 'exportToPdf(table, { fileName: "export.pdf" }) 호출 데모',
    onExport: () => {
      try {
        exportToPdf(makeMockTable(), { fileName: 'demo-export.pdf' });
      } catch (e) {
        console.log('exportToPdf 데모 (실제 jspdf 라이브러리 설치 후 동작):', e);
      }
    },
  },
};

export const CopyToClipboard: Story = {
  name: 'copyToClipboard — 클립보드 복사',
  args: {
    label: '클립보드 복사',
    description: 'copyToClipboard(table) 호출 데모 — TSV 형식으로 클립보드 복사',
    onExport: () => {
      try {
        copyToClipboard(makeMockTable());
      } catch (e) {
        console.log('copyToClipboard 데모:', e);
      }
    },
  },
};

export const PrintGrid: Story = {
  name: 'printGrid — 인쇄',
  args: {
    label: '그리드 인쇄',
    description: 'printGrid(table) 호출 데모 — 인쇄 다이얼로그 열기',
    onExport: () => {
      try {
        printGrid(makeMockTable());
      } catch (e) {
        console.log('printGrid 데모:', e);
      }
    },
  },
};
