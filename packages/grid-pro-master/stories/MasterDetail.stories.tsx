// spec G-002 Section 7 #15 / Step 8
// AC-004: MasterDetailGrid + ContextMenuGrid story (AC-004)
// EC-03: TreeGrid/ColumnPinGrid는 grid-core Grid.stories.tsx에서 커버 — 이 파일에서 미생성
// C-3 예외: mock rows 데이터는 Storybook stories에서만 허용 (D7 결정, ADR-006)
// C-1 준수: MasterDetailGridProps = GridProps<TData> + { renderDetailRow?, masterDetail? }
//   ContextMenuGridProps = GridProps<TData> + { contextMenuItems?: ContextMenuItem<TData>[] }
import type { Meta, StoryObj } from '@storybook/react';
import {
  MasterDetailGrid,
  ContextMenuGrid,
} from '@topgrid/grid-pro-master';
import type { ContextMenuItem } from '@topgrid/grid-pro-master';
import { createColumns } from '@topgrid/grid-core';

// C-3 예외: mock rows — Storybook stories 허용 범위
interface DeptRow {
  id: number;
  name: string;
  location: string;
  headCount: number;
  budget: number;
}

interface EmployeeRow {
  id: number;
  name: string;
  role: string;
  salary: number;
}

// 부서 목록 (Master)
const deptData: DeptRow[] = [
  { id: 1, name: '개발팀', location: '서울', headCount: 15, budget: 500000000 },
  { id: 2, name: '기획팀', location: '서울', headCount: 8, budget: 200000000 },
  { id: 3, name: '영업팀', location: '부산', headCount: 12, budget: 350000000 },
];

// 부서별 직원 목록 (Detail) — mock
const deptEmployees: Record<number, EmployeeRow[]> = {
  1: [
    { id: 101, name: '홍길동', role: '팀장', salary: 7000000 },
    { id: 102, name: '김영희', role: '팀원', salary: 5000000 },
    { id: 103, name: '이철수', role: '팀원', salary: 4800000 },
  ],
  2: [
    { id: 201, name: '박민지', role: '팀장', salary: 6500000 },
    { id: 202, name: '최준호', role: '팀원', salary: 4500000 },
  ],
  3: [
    { id: 301, name: '정수빈', role: '팀장', salary: 7200000 },
    { id: 302, name: '윤재원', role: '팀원', salary: 5500000 },
    { id: 303, name: '강민수', role: '팀원', salary: 5000000 },
  ],
};

const deptColumns = createColumns<DeptRow>([
  { id: 'id', name: 'ID', type: 'number' },
  { id: 'name', name: '부서명', type: 'text' },
  { id: 'location', name: '위치', type: 'text' },
  { id: 'headCount', name: '인원', type: 'number' },
  { id: 'budget', name: '예산', type: 'number' },
]);

const empColumns = createColumns<EmployeeRow>([
  { id: 'id', name: 'ID', type: 'number' },
  { id: 'name', name: '이름', type: 'text' },
  { id: 'role', name: '역할', type: 'text' },
  { id: 'salary', name: '급여', type: 'number' },
]);

// ─── MasterDetailGrid ─────────────────────────────────────────────────────
const masterDetailMeta: Meta<typeof MasterDetailGrid> = {
  title: 'grid-pro-master/MasterDetailGrid',
  component: MasterDetailGrid,
  tags: ['autodocs'],
};
export default masterDetailMeta;

export const Default: StoryObj<typeof MasterDetailGrid> = {
  name: 'MasterDetailGrid 부서 → 직원 목록',
  args: {
    data: deptData,
    columns: deptColumns,
    renderDetailRow: (row) => {
      const dept = row.original as DeptRow;
      const employees = deptEmployees[dept.id] ?? [];
      return (
        <div className="p-4 bg-gray-50">
          <h4 className="text-sm font-semibold mb-2">{dept.name} 직원 목록</h4>
          <table className="text-xs w-full">
            <thead>
              <tr className="bg-gray-200">
                {empColumns.map((col) => (
                  <th key={String(col.accessorKey)} className="px-2 py-1 text-left">
                    {String(col.header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b">
                  <td className="px-2 py-1">{emp.id}</td>
                  <td className="px-2 py-1">{emp.name}</td>
                  <td className="px-2 py-1">{emp.role}</td>
                  <td className="px-2 py-1">{emp.salary.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
  },
};

export const WithSort: StoryObj<typeof MasterDetailGrid> = {
  name: 'MasterDetailGrid + 정렬',
  args: {
    data: deptData,
    columns: deptColumns,
    enableSort: true,
    renderDetailRow: (row) => {
      const dept = row.original as DeptRow;
      return (
        <div className="p-3 bg-gray-50 text-sm">
          {dept.name}: 직원 {dept.headCount}명, 예산 {dept.budget.toLocaleString()}원
        </div>
      );
    },
  },
};

// ─── ContextMenuGrid ──────────────────────────────────────────────────────
const contextMenuItems: ContextMenuItem<DeptRow>[] = [
  {
    label: '상세 보기',
    shortcut: 'V',
    onClick: (row) => alert(`상세: ${row.name}`),
  },
  {
    label: '수정',
    shortcut: 'E',
    onClick: (row) => alert(`수정: ${row.name}`),
  },
  {
    label: '',
    separator: true,
    onClick: () => undefined,
  },
  {
    label: '삭제',
    shortcut: 'Delete',
    disabled: (row) => row.headCount > 10,  // 인원 10명 초과 시 삭제 비활성
    onClick: (row) => alert(`삭제: ${row.name}`),
  },
];

export const ContextMenuGridStory: StoryObj<typeof ContextMenuGrid> = {
  name: 'ContextMenuGrid 우클릭 컨텍스트 메뉴',
  args: {
    data: deptData,
    columns: deptColumns,
    contextMenuItems,
  },
};

export const ContextMenuWithRowSelection: StoryObj<typeof ContextMenuGrid> = {
  name: 'ContextMenuGrid + 행 선택',
  args: {
    data: deptData,
    columns: deptColumns,
    rowSelection: 'multi',
    contextMenuItems: [
      {
        label: '선택 행 삭제',
        onClick: (_row) => alert('선택 행 삭제'),
      },
    ],
  },
};

// ─── MOD-GRID-71: master-detail + virtualization ───────────────────────────
// 200 master rows + variable-height detail panels. enableVirtualization windows the rows (only a
// small DOM window of measured <tbody> elements); measureElement measures expanded detail heights
// dynamically. The chromium test asserts the window is far smaller than 200 + scrolling moves it +
// expanding a visible row renders its detail.
interface BigRow {
  id: number;
  name: string;
  value: number;
}
const bigData: BigRow[] = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  name: `행 ${i + 1}`,
  value: (i + 1) * 100,
}));
const bigColumns = createColumns<BigRow>([
  { id: 'id', name: 'ID', type: 'number', width: '80' },
  { id: 'name', name: '이름', type: 'text', width: '200' },
  { id: 'value', name: '값', type: 'number', width: '120' },
]);

export const Virtualized: StoryObj<typeof MasterDetailGrid> = {
  name: '마스터-디테일 가상화 (200행 + 가변 detail)',
  args: {
    data: bigData,
    columns: bigColumns,
    enableVirtualization: true,
    virtualMaxHeight: 300,
    estimatedRowHeight: 44,
    renderDetailRow: (row) => {
      const r = row.original as BigRow;
      return (
        <div data-detail={r.id} style={{ padding: 12, background: '#f1f5f9' }}>
          <div>상세: {r.name}</div>
          <div>값 ×2 = {r.value * 2}</div>
          <div>값 ×3 = {r.value * 3}</div>
        </div>
      );
    },
  },
};
