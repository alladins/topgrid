/**
 * @tomis/grid-core — createColumns Storybook Stories
 *
 * MOD-GRID-04 G-001: C-25 — 4개 Story (AllTypes / WithLegacyColumnInfo / EmptyDefs / CheckboxOnly)
 *
 * **Storybook 환경 주의**: Grid 컴포넌트 없이 createColumns 반환값만 시각화.
 * 실제 렌더링은 MOD-GRID-01 `<Grid>` 컴포넌트와 연동.
 *
 * @see createColumns
 * @see Section 6 Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { createColumns } from './createColumns';
import type { TomisColumnDef } from './types';
import type { ColumnInfo } from '../legacy/ColumnInfo';

/** 스토리 표시용 column 정의 뷰어 */
function ColumnDefViewer({ columns }: { columns: ColumnDef<unknown>[] }) {
  return (
    <div className="font-mono text-sm p-4 bg-gray-50 rounded border">
      <p className="font-bold mb-2">createColumns 반환값 ({columns.length}개 ColumnDef):</p>
      <ul className="list-disc pl-5 space-y-1">
        {columns.map((col, idx) => {
          const accessorKey = (col as { accessorKey?: string }).accessorKey;
          return (
            <li key={idx} className="text-gray-700">
              <span className="font-semibold">{col.id ?? accessorKey ?? '(no id)'}</span>
              {' · '}
              <span className="text-blue-600">header: {String(typeof col.header === 'string' ? col.header : '(fn)')}</span>
              {' · '}
              <span className="text-green-600">cell: {col.cell !== undefined ? '(renderer fn)' : '(TanStack default)'}</span>
              {col.enableSorting === false && (
                <span className="ml-2 text-red-500 text-xs">[sorting: false]</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const meta: Meta<typeof ColumnDefViewer> = {
  title: 'grid-core/column/createColumns',
  component: ColumnDefViewer,
  parameters: {
    docs: {
      description: {
        component:
          '`createColumns<TData>(defs)` 팩토리 함수 — `TomisColumnDef[]` 또는 `ColumnInfo[]`를 받아 TanStack `ColumnDef[]` 반환. MOD-GRID-04 G-001.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ColumnDefViewer>;

// ─── Story 1: AllTypes ──────────────────────────────────────────────────────

/**
 * AllTypes — 9종 TomisColumnType 한 번에 렌더링.
 *
 * placeholder renderer(MOD-GRID-05 pending)로 동작.
 * checkbox는 DisplayColumnDef (accessorKey 없음, enableSorting: false).
 */
const allTypesDefs: TomisColumnDef<Record<string, unknown>>[] = [
  { id: 'sel', name: '선택', type: 'checkbox', align: 'center', width: '50' },
  { id: 'name', name: '이름', type: 'text', align: 'left', width: '150' },
  { id: 'salary', name: '급여', type: 'number', align: 'right', width: '120' },
  { id: 'active', name: '활성', type: 'boolean', align: 'center', width: '80' },
  { id: 'createdAt', name: '생성일시', type: 'dateTime', align: 'center', width: '160' },
  { id: 'birthDate', name: '생년월일', type: 'date', align: 'center', width: '120' },
  { id: 'status', name: '상태', type: 'badge', align: 'center', width: '100' },
  { id: 'profile', name: '링크', type: 'link', align: 'left', width: '120' },
  { id: 'avatar', name: '아이콘', type: 'icon', align: 'center', width: '60' },
];

export const AllTypes: Story = {
  name: 'AllTypes — 9종 type 한 번에',
  render: () => <ColumnDefViewer columns={createColumns(allTypesDefs)} />,
  parameters: {
    docs: {
      description: {
        story:
          '9종 TomisColumnType 전부 한 번에 렌더링. checkbox는 DisplayColumnDef, 나머지는 AccessorKeyColumnDef.',
      },
    },
  },
};

// ─── Story 2: WithLegacyColumnInfo ─────────────────────────────────────────

/**
 * WithLegacyColumnInfo — ColumnInfo[] 입력 호환 (AC-005).
 *
 * `tw-framework-front/data-table-types.ts`의 ColumnInfo와 동일 shape.
 * 기존 AS-IS 코드를 수정 없이 `createColumns()`에 전달 가능.
 */
const legacyDefs: ColumnInfo[] = [
  { id: 'empNo', type: 'text', align: 'left', name: '사원번호', width: '100' },
  { id: 'empName', type: 'text', align: 'left', name: '성명', width: '120' },
  { id: 'salary', type: 'number', align: 'right', name: '급여', width: '120' },
  { id: 'deptName', type: 'text', align: 'left', name: '부서', width: '150', etc: 'primary' },
];

export const WithLegacyColumnInfo: Story = {
  name: 'WithLegacyColumnInfo — ColumnInfo[] 호환',
  render: () => <ColumnDefViewer columns={createColumns(legacyDefs)} />,
  parameters: {
    docs: {
      description: {
        story:
          '`ColumnInfo[]` 입력 시 내부 narrowing 거쳐 `ColumnDef[]` 반환. `etc: "primary"` → `meta.primary: true`. AC-005.',
      },
    },
  },
};

// ─── Story 3: EmptyDefs ─────────────────────────────────────────────────────

/**
 * EmptyDefs — 빈 배열 입력 (EC-01).
 *
 * `createColumns([])` → `[]` 반환. 에러 없음.
 */
export const EmptyDefs: Story = {
  name: 'EmptyDefs — 빈 배열',
  render: () => <ColumnDefViewer columns={createColumns([])} />,
  parameters: {
    docs: {
      description: {
        story: '빈 배열 입력 시 빈 ColumnDef[] 반환. 에러/경고 없음 (EC-01).',
      },
    },
  },
};

// ─── Story 4: CheckboxOnly ──────────────────────────────────────────────────

/**
 * CheckboxOnly — checkbox type DisplayColumnDef (AC-006, D5, EC-08).
 *
 * - accessorKey 없음
 * - enableSorting 강제 false
 * - cell: placeholder (MOD-GRID-05 CheckboxCell pending)
 */
const checkboxDefs: TomisColumnDef<Record<string, unknown>>[] = [
  { id: 'sel', name: '선택', type: 'checkbox', align: 'center', width: '50' },
  { id: 'name', name: '이름', type: 'text', align: 'left', width: '200' },
];

export const CheckboxOnly: Story = {
  name: 'CheckboxOnly — checkbox DisplayColumnDef',
  render: () => <ColumnDefViewer columns={createColumns(checkboxDefs)} />,
  parameters: {
    docs: {
      description: {
        story:
          '`checkbox` type은 DisplayColumnDef (accessorKey 없음, enableSorting: false 강제). EC-08, AC-006, D5.',
      },
    },
  },
};
