// spec G-002 Section 7 #11 / Step 8
// AC-004: DataMapCell + DataMapEditor story
// C-3 예외: mock 데이터는 Storybook stories에서만 허용 (D7 결정, ADR-006)
// C-1 준수: 소스 파일 Read 후 실제 Props 사용
//   - createDataMap: { items: TItem[], valuePath, displayPath }
//   - DataMapCell: CellContext<TData, unknown> (TanStack CellContext alias)
//   - DataMapEditor: { value, dataMap, onCommit, onCancel, getLabelFromItem? }
import type { Meta, StoryObj } from '@storybook/react';
import {
  DataMapCell,
  DataMapEditor,
  createDataMap,
} from '@tomis/grid-pro-datamap';

// C-3 예외: mock 항목 데이터 — Storybook stories 허용 범위
interface CityItem {
  code: string;
  name: string;
}

interface DeptItem {
  id: string;
  label: string;
}

const cityDataMap = createDataMap<CityItem>({
  items: [
    { code: '01', name: '서울' },
    { code: '02', name: '부산' },
    { code: '03', name: '대구' },
    { code: '04', name: '인천' },
    { code: '05', name: '광주' },
  ],
  valuePath: 'code',
  displayPath: 'name',
});

const deptDataMap = createDataMap<DeptItem>({
  items: [
    { id: 'DEV', label: '개발팀' },
    { id: 'PLN', label: '기획팀' },
    { id: 'SAL', label: '영업팀' },
    { id: 'HR', label: '인사팀' },
  ],
  valuePath: 'id',
  displayPath: 'label',
});

// ─── DataMapCell ──────────────────────────────────────────────────────────
// DataMapCell props = CellContext<TData, unknown> (TanStack CellContext)
// Storybook에서 CellContext를 직접 mock하여 시연

interface MockCellData {
  cityCode: string;
  deptCode: string;
}

function makeMockCellContext(value: unknown): Parameters<typeof DataMapCell>[0] {
  return {
    getValue: () => value,
    renderValue: () => value,
    row: {
      id: '0',
      index: 0,
      original: { cityCode: value as string, deptCode: 'DEV' } as MockCellData,
      depth: 0,
      subRows: [],
      getValue: (_id: string) => value,
    },
    column: {
      id: 'cityCode',
      columnDef: {
        // dataMap attached at column level for DataMapCell to resolve
        meta: { dataMap: cityDataMap },
      },
    },
    table: {} as Parameters<typeof DataMapCell>[0]['table'],
    cell: { id: '0_cityCode', getValue: () => value },
  } as unknown as Parameters<typeof DataMapCell>[0];
}

const datamapCellMeta: Meta<typeof DataMapCell> = {
  title: 'grid-pro-datamap/DataMapCell',
  component: DataMapCell,
  tags: ['autodocs'],
};
export default datamapCellMeta;

export const DataMapCellCity: StoryObj<typeof DataMapCell> = {
  name: 'DataMapCell 도시 코드 변환',
  render: () => (
    <div className="p-4 border rounded inline-block">
      <DataMapCell {...makeMockCellContext('01')} />
    </div>
  ),
};

export const DataMapCellUnknown: StoryObj<typeof DataMapCell> = {
  name: 'DataMapCell 알 수 없는 코드',
  render: () => (
    <div className="p-4 border rounded inline-block">
      <DataMapCell {...makeMockCellContext('99')} />
    </div>
  ),
};

// ─── DataMapEditor ────────────────────────────────────────────────────────
// DataMapEditorProps: { value, dataMap, onCommit, onCancel, getLabelFromItem? }
export const DataMapEditorCity: StoryObj<typeof DataMapEditor> = {
  name: 'DataMapEditor 도시 선택',
  args: {
    value: '01',
    dataMap: cityDataMap,
    onCommit: (val: unknown) => console.log('선택:', val),
    onCancel: () => console.log('취소'),
    getLabelFromItem: (item: CityItem) => item.name,
  },
};

export const DataMapEditorDept: StoryObj<typeof DataMapEditor> = {
  name: 'DataMapEditor 부서 선택',
  args: {
    value: 'PLN',
    dataMap: deptDataMap,
    onCommit: (val: unknown) => console.log('부서 선택:', val),
    onCancel: () => console.log('취소'),
    getLabelFromItem: (item: DeptItem) => item.label,
  },
};

export const DataMapEditorEmpty: StoryObj<typeof DataMapEditor> = {
  name: 'DataMapEditor 미선택 상태',
  args: {
    value: '',
    dataMap: cityDataMap,
    onCommit: (val: unknown) => console.log('선택:', val),
    onCancel: () => console.log('취소'),
    getLabelFromItem: (item: CityItem) => item.name,
  },
};
