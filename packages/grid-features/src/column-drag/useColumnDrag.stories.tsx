/**
 * @topgrid/grid-features — useColumnDrag Storybook Stories
 *
 * G-001 (MOD-GRID-07) AC-008 / C-25:
 * 6컬럼 + enableColumnReorder + drop 시나리오 스토리 1개.
 *
 * @remarks
 * Storybook 앱이 monorepo `apps/` 에 아직 미설정 상태 (2026-05-14 기준).
 * 스토리 파일은 C-25 canonical 경로에 작성 완료.
 * Storybook 연동 후 `title: 'grid-features/column-drag/useColumnDrag'` 로 자동 등록됨.
 *
 * @see G-001-spec.md Section 12.3
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { useColumnDrag, DropIndicator } from '../index';

// G-002 (MOD-GRID-07): PersistAndKeyboard story 용 localStorage 키
const STORY_STORAGE_KEY = 'story-column-order';

// ---------------------------------------------------------------------------
// 스토리 데이터 타입
// ---------------------------------------------------------------------------

interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  location: string;
  status: string;
}

const EMPLOYEES: Employee[] = [
  { id: 1, name: '김민준', department: '개발팀', role: '프론트엔드', location: '서울', status: '재직' },
  { id: 2, name: '이서연', department: '기획팀', role: 'PM', location: '부산', status: '재직' },
  { id: 3, name: '박지호', department: '디자인팀', role: 'UI/UX', location: '서울', status: '휴직' },
  { id: 4, name: '최예진', department: '개발팀', role: '백엔드', location: '인천', status: '재직' },
];

// 6개 컬럼 정의 (AC-008)
const COLUMNS: ColumnDef<Employee>[] = [
  { id: 'id', accessorKey: 'id', header: 'ID', size: 60 },
  { id: 'name', accessorKey: 'name', header: '이름', size: 100 },
  { id: 'department', accessorKey: 'department', header: '부서', size: 120 },
  { id: 'role', accessorKey: 'role', header: '역할', size: 120 },
  { id: 'location', accessorKey: 'location', header: '지역', size: 90 },
  { id: 'status', accessorKey: 'status', header: '상태', size: 80 },
];

// ---------------------------------------------------------------------------
// Demo 컴포넌트 — useColumnDrag 훅을 포함하는 최소 Table
// ---------------------------------------------------------------------------

function DragReorderDemo({ pinnedColumns = [] }: { pinnedColumns?: string[] }) {
  const [orderLog, setOrderLog] = useState<string[][]>([]);
  const [columnPinning] = useState({ left: pinnedColumns, right: [] as string[] });

  const table = useReactTable<Employee>({
    data: EMPLOYEES,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    state: { columnPinning },
  });

  const { getDragProps, dragOverId } = useColumnDrag<Employee>({
    table,
    enabled: true,
    onColumnOrderChange: (order) => setOrderLog((prev) => [...prev, order]),
  });

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-gray-500">
        헤더 셀을 드래그하여 컬럼 순서를 변경하세요.
        {pinnedColumns.length > 0 && (
          <span className="ml-1 text-blue-600">
            ('{pinnedColumns.join(', ')}' 컬럼은 pinned — 드래그 불가)
          </span>
        )}
      </p>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const isPinned = header.column.getIsPinned() !== false;
                  const dragProps = getDragProps(header.column.id, isPinned);
                  return (
                    <th
                      key={header.id}
                      className={`relative px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase select-none whitespace-nowrap ${
                        dragProps.draggable ? 'cursor-grab' : 'cursor-default'
                      } ${isPinned ? 'bg-blue-50' : ''}`}
                      style={{ width: header.getSize() }}
                      draggable={dragProps.draggable}
                      onDragStart={(e) => dragProps.onDragStart(e.nativeEvent)}
                      onDragOver={(e) => dragProps.onDragOver(e.nativeEvent)}
                      onDragLeave={(e) => dragProps.onDragLeave(e.nativeEvent)}
                      onDrop={(e) => dragProps.onDrop(e.nativeEvent)}
                      onDragEnd={(e) => dragProps.onDragEnd(e.nativeEvent)}
                    >
                      <DropIndicator dragOverId={dragOverId} columnId={header.column.id} />
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 whitespace-nowrap text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orderLog.length > 0 && (
        <div className="text-xs text-gray-600 border rounded p-2 bg-gray-50 max-h-32 overflow-y-auto">
          <p className="font-semibold mb-1">onColumnOrderChange 호출 로그:</p>
          {orderLog.map((order, i) => (
            <div key={i} className="font-mono">
              #{i + 1}: [{order.join(', ')}]
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof DragReorderDemo> = {
  title: 'grid-features/column-drag/useColumnDrag',
  component: DragReorderDemo,
  parameters: {
    docs: {
      description: {
        component:
          '`useColumnDrag` hook — HTML5 Drag and Drop API 기반 컬럼 헤더 드래그 재정렬. ' +
          'TanStack v8 `setColumnOrder` 연동. pinned 컬럼 draggable=false 가드. ' +
          'G-001 (MOD-GRID-07) AC-001~AC-008.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DragReorderDemo>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * 6컬럼 + enableColumnReorder + drop 시나리오 (AC-008).
 * 헤더 셀 드래그 → drop → onColumnOrderChange 로그 표시.
 */
export const ColumnReorderDrop: Story = {
  name: '6컬럼 드래그 재정렬 (drop 시나리오)',
  args: {},
};

/**
 * pinned 컬럼 가드 시나리오 — 'id' 컬럼 pinned.
 * pinned 컬럼은 draggable=false + drop 무시 (AC-004).
 */
export const WithPinnedGuard: Story = {
  name: 'Pinned 컬럼 가드 (draggable=false)',
  args: { pinnedColumns: ['id'] },
};

// ---------------------------------------------------------------------------
// G-002: PersistAndKeyboard Demo 컴포넌트
// ---------------------------------------------------------------------------

/**
 * G-002 (MOD-GRID-07) AC-006: persistColumnOrder + 키보드 이동 시나리오.
 *
 * - `persistColumnOrder={true}` + `columnOrderStorageKey="story-column-order"` 설정
 * - localStorage 저장값 표시 (Dev Tools 확인 가이드)
 * - 키보드 사용 안내: 헤더 셀 탭 선택 후 Alt+← / Alt+→ 로 이동
 */
function PersistKeyboardDemo() {
  const [orderLog, setOrderLog] = useState<string[][]>([]);
  const [storedValue, setStoredValue] = useState<string>(() => {
    if (typeof window === 'undefined') return '(SSR)';
    return localStorage.getItem(STORY_STORAGE_KEY) ?? '(없음)';
  });

  const table = useReactTable<Employee>({
    data: EMPLOYEES,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
  });

  const { getDragProps, dragOverId, getKeyDownHandler } = useColumnDrag<Employee>({
    table,
    enabled: true,
    persistColumnOrder: true,
    columnOrderStorageKey: STORY_STORAGE_KEY,
    onColumnOrderChange: (order) => {
      setOrderLog((prev) => [...prev, order]);
      setStoredValue(JSON.stringify(order));
    },
  });

  return (
    <div className="space-y-4 p-4">
      <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <p className="font-semibold">G-002: localStorage 영속화 + 키보드 이동</p>
        <p className="mt-1">
          헤더 셀을 <strong>탭(Tab)</strong>으로 선택 후{' '}
          <kbd className="rounded border border-blue-400 px-1">Alt+←</kbd> /{' '}
          <kbd className="rounded border border-blue-400 px-1">Alt+→</kbd> 로 컬럼을 이동하세요.
        </p>
        <p className="mt-1">
          드래그 재정렬 후 페이지를 새로고침하면 순서가 복원됩니다.
        </p>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const isPinned = header.column.getIsPinned() !== false;
                  const dragProps = getDragProps(header.column.id, isPinned);
                  const keyDownHandler = getKeyDownHandler(header.column.id, isPinned);
                  return (
                    <th
                      key={header.id}
                      className="relative px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase select-none whitespace-nowrap cursor-grab focus:outline focus:outline-2 focus:outline-blue-400"
                      style={{ width: header.getSize() }}
                      tabIndex={0}
                      draggable={dragProps.draggable}
                      onDragStart={(e) => dragProps.onDragStart(e.nativeEvent)}
                      onDragOver={(e) => dragProps.onDragOver(e.nativeEvent)}
                      onDragLeave={(e) => dragProps.onDragLeave(e.nativeEvent)}
                      onDrop={(e) => dragProps.onDrop(e.nativeEvent)}
                      onDragEnd={(e) => dragProps.onDragEnd(e.nativeEvent)}
                      onKeyDown={(e) => keyDownHandler(e.nativeEvent)}
                      aria-roledescription="draggable column"
                    >
                      <DropIndicator dragOverId={dragOverId} columnId={header.column.id} />
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 whitespace-nowrap text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-600 border rounded p-2 bg-gray-50">
        <p className="font-semibold mb-1">localStorage[&quot;{STORY_STORAGE_KEY}&quot;]:</p>
        <p className="font-mono break-all">{storedValue}</p>
      </div>

      {orderLog.length > 0 && (
        <div className="text-xs text-gray-600 border rounded p-2 bg-gray-50 max-h-32 overflow-y-auto">
          <p className="font-semibold mb-1">onColumnOrderChange 호출 로그:</p>
          {orderLog.map((order, i) => (
            <div key={i} className="font-mono">
              #{i + 1}: [{order.join(', ')}]
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * G-002: persistColumnOrder + 키보드 이동 시나리오 (AC-006).
 * localStorage 저장값 display + Alt+← / Alt+→ 이동 안내 포함.
 */
export const PersistAndKeyboard: Story = {
  name: '영속화 + 키보드 이동 (Alt+← / Alt+→)',
  args: {},
  render: () => <PersistKeyboardDemo />,
};
