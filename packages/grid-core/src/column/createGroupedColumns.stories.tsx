/**
 * MOD-GRID-04 G-002: createGroupedColumns Storybook stories.
 *
 * C-25 준수: JSDoc + ≥3 Storybook stories.
 * Stories: TwoLevelGroupHeader / MultipleGroups / EmptyGroup (spec Section 6, D5)
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import React from 'react';
import { createGroupedColumns } from './createGroupedColumns';
import { createColumns } from './createColumns';

// ── 데모용 타입 정의 ───────────────────────────────────────────────────────

interface PayrollRow {
  basePay: number;
  bonus: number;
  totalPay: number;
}

interface EmployeeRow {
  empNo: string;
  name: string;
  basePay: number;
  bonus: number;
  totalPay: number;
}

// ── 메타 컴포넌트 (json 출력용) ────────────────────────────────────────────

/**
 * createGroupedColumns 결과를 JSON으로 출력하는 데모 컴포넌트.
 * 실제 Grid 렌더링이 아닌 column 구조 확인 목적.
 */
function ColumnsOutput({ columns }: { columns: ColumnDef<unknown>[] }) {
  return (
    <pre
      style={{
        background: '#1e1e1e',
        color: '#d4d4d4',
        padding: '16px',
        borderRadius: '4px',
        fontSize: '13px',
        fontFamily: 'monospace',
        overflow: 'auto',
        maxHeight: '400px',
      }}
    >
      {JSON.stringify(columns, null, 2)}
    </pre>
  );
}

// ── Meta ───────────────────────────────────────────────────────────────────

const meta = {
  title: 'MOD-GRID-04/createGroupedColumns',
  component: ColumnsOutput,
  parameters: {
    docs: {
      description: {
        component:
          'MOD-GRID-04 G-002: `createGroupedColumns<TData>(...groups)` — 다단 헤더 컬럼 팩토리. thin wrapper, TanStack GroupColumnDef 구조 반환.',
      },
    },
  },
} satisfies Meta<typeof ColumnsOutput>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Story 1: TwoLevelGroupHeader (D5 기준 — 지급항목) ─────────────────────

/**
 * 2-level 다단 헤더: `지급항목` 그룹 아래 `기본급 / 상여 / 합계` 리프 컬럼.
 * D5 Storybook 데모 기준.
 */
export const TwoLevelGroupHeader: Story = {
  name: 'TwoLevelGroupHeader — 지급항목 그룹',
  render: () => {
    const columns = createGroupedColumns<PayrollRow>({
      header: '지급항목',
      columns: createColumns<PayrollRow>([
        { id: 'basePay',  name: '기본급', type: 'number', align: 'right', width: '120' },
        { id: 'bonus',    name: '상여',   type: 'number', align: 'right', width: '100' },
        { id: 'totalPay', name: '합계',   type: 'number', align: 'right', width: '120' },
      ]),
    });
    return <ColumnsOutput columns={columns as ColumnDef<unknown>[]} />;
  },
};

// ── Story 2: MultipleGroups (기본정보 + 급여내역) ──────────────────────────

/**
 * 복수 그룹: `기본 정보`(사번/성명) + `급여 내역`(기본급/상여/합계).
 * GroupedHeaderGrid.tsx L166-184 호환 패턴 (TC-04).
 */
export const MultipleGroups: Story = {
  name: 'MultipleGroups — 기본정보 + 급여내역',
  render: () => {
    const columns = createGroupedColumns<EmployeeRow>(
      {
        header: '기본 정보',
        columns: createColumns<EmployeeRow>([
          { id: 'empNo', name: '사번', type: 'text', align: 'center', width: '80' },
          { id: 'name',  name: '성명', type: 'text', align: 'left',   width: '100' },
        ]),
      },
      {
        header: '급여 내역',
        columns: createColumns<EmployeeRow>([
          { id: 'basePay',  name: '기본급', type: 'number', align: 'right', width: '120' },
          { id: 'bonus',    name: '상여',   type: 'number', align: 'right', width: '100' },
          { id: 'totalPay', name: '합계',   type: 'number', align: 'right', width: '120' },
        ]),
      },
    );
    return <ColumnsOutput columns={columns as ColumnDef<unknown>[]} />;
  },
};

// ── Story 3: EmptyGroup ────────────────────────────────────────────────────

/**
 * 빈 그룹: `columns: []`인 그룹. TC-01 시나리오.
 * thin wrapper이므로 빈 배열도 그대로 반환.
 */
export const EmptyGroup: Story = {
  name: 'EmptyGroup — columns 빈 배열',
  render: () => {
    const columns = createGroupedColumns<Record<string, unknown>>({
      header: '빈 그룹',
      columns: [],
    });
    return <ColumnsOutput columns={columns as ColumnDef<unknown>[]} />;
  },
};
