// MOD-61 (redo): ContextMenuGrid 스토리 — base(flat) + rich(submenu/icon/built-in).
// C-3 예외: mock rows 데이터는 Storybook stories 에서만 허용.
import type { Meta, StoryObj } from '@storybook/react';
import { ContextMenuGrid, makeCopyCellItem } from '@topgrid/grid-pro-master';
import type { ContextMenuItem } from '@topgrid/grid-pro-master';
import { createColumns } from '@topgrid/grid-core';

interface OrderRow {
  id: number;
  customer: string;
  status: string;
  amount: number;
}

const orderData: OrderRow[] = [
  { id: 1, customer: 'Alice', status: 'active', amount: 1200 },
  { id: 2, customer: 'Bob', status: 'completed', amount: 3400 },
  { id: 3, customer: 'Carol', status: 'active', amount: 980 },
];

// ★ createColumns 는 TopgridColumnDef({id,name,type}) 를 받는다 — raw TanStack
//   {accessorKey,header} 를 넣으면 id 미설정 → react-table getAllColumns throw (MOD-24 교훈).
const orderColumns = createColumns<OrderRow>([
  { id: 'id', name: 'ID', type: 'number', width: '80' },
  { id: 'customer', name: '고객', type: 'text', width: '160' },
  { id: 'status', name: '상태', type: 'text', width: '120' },
  { id: 'amount', name: '금액', type: 'number', width: '120' },
]);

const flatItems: ContextMenuItem<OrderRow>[] = [
  { label: '수정', shortcut: 'E', onClick: () => {} },
  { separator: true, label: '', onClick: () => {} },
  {
    label: '삭제',
    shortcut: 'Delete',
    disabled: (row) => row.status === 'completed',
    onClick: () => {},
  },
];

// icon + submenu(children) + built-in copy item
const richItems: ContextMenuItem<OrderRow>[] = [
  makeCopyCellItem<OrderRow>(),
  { label: '수정', icon: '✎', shortcut: 'E', onClick: () => {} },
  { separator: true, label: '' },
  {
    label: '내보내기',
    icon: '⤓',
    children: [
      { label: 'CSV로 내보내기', onClick: () => {} },
      { label: 'Excel로 내보내기', onClick: () => {} },
    ],
  },
];

const meta: Meta<typeof ContextMenuGrid> = {
  title: 'grid-pro-master/ContextMenuGrid',
  component: ContextMenuGrid,
  tags: ['autodocs'],
};
export default meta;

// 베이스: flat 메뉴 (기존 기능). harness 렌더 회귀 + 우클릭.
export const Base: StoryObj<typeof ContextMenuGrid> = {
  name: 'ContextMenuGrid 우클릭 메뉴 (flat)',
  args: {
    data: orderData,
    columns: orderColumns,
    contextMenuItems: flatItems,
  },
};

// rich: 아이콘 + 서브메뉴 + 내장 복사 항목.
export const WithSubmenu: StoryObj<typeof ContextMenuGrid> = {
  name: 'ContextMenuGrid 서브메뉴/아이콘/내장항목',
  args: {
    data: orderData,
    columns: orderColumns,
    contextMenuItems: richItems,
  },
};
