/**
 * @topgrid/grid-features — MultiSort Storybook Stories
 *
 * MOD-GRID-08 G-001 AC-007 / C-25:
 * 3 시나리오: A(다중 정렬+배지), B(Ctrl+Click 정렬 제거), C(enableMultiSort=false 단일 정렬 보존).
 *
 * @remarks
 * Storybook 앱이 monorepo `apps/` 에 아직 미설정 상태 (2026-05-14 기준).
 * 스토리 파일은 C-25 canonical 경로에 작성 완료.
 * Storybook 연동 후 `title: 'grid-features/multi-sort/MultiSortGrid'` 로 자동 등록됨.
 *
 * 패턴: useColumnDrag.stories.tsx 와 동일 — useReactTable 직접 사용 (Grid wrapper 미사용).
 * Grid.tsx 내 internal/SortBadge 와 달리, 여기서는 @topgrid/grid-features export SortBadge 시연.
 * 이유: grid-features → grid-core 방향 cross-package import 순환 위험 회피 (Section 11.4).
 *
 * @see G-001-spec.md Section 12.2
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { SortBadge, useMultiSort } from '../index';

// ---------------------------------------------------------------------------
// 스토리 데이터 타입
// ---------------------------------------------------------------------------

interface Employee {
  id: number;
  name: string;
  department: string;
  joinYear: number;
  salary: number;
}

const EMPLOYEES: Employee[] = [
  { id: 1, name: '김민준', department: '개발팀', joinYear: 2019, salary: 5200 },
  { id: 2, name: '이서연', department: '기획팀', joinYear: 2021, salary: 4800 },
  { id: 3, name: '박지호', department: '개발팀', joinYear: 2020, salary: 5500 },
  { id: 4, name: '최예진', department: '인사팀', joinYear: 2018, salary: 4600 },
  { id: 5, name: '정민서', department: '기획팀', joinYear: 2022, salary: 4300 },
  { id: 6, name: '한도윤', department: '개발팀', joinYear: 2019, salary: 5100 },
];

const COLUMNS: ColumnDef<Employee>[] = [
  { id: 'id', accessorKey: 'id', header: 'ID', size: 60 },
  { id: 'name', accessorKey: 'name', header: '이름', size: 110 },
  { id: 'department', accessorKey: 'department', header: '부서', size: 110 },
  { id: 'joinYear', accessorKey: 'joinYear', header: '입사연도', size: 100 },
  { id: 'salary', accessorKey: 'salary', header: '급여(만)', size: 100 },
];

// ---------------------------------------------------------------------------
// Demo 컴포넌트 — useMultiSort + SortBadge 직접 사용
// ---------------------------------------------------------------------------

interface MultiSortDemoProps {
  /** 다중 정렬 활성 여부. false 시 Shift+Click 단일 정렬 동작 보존 (시나리오 C). */
  enableMultiSort: boolean;
}

function MultiSortDemo({ enableMultiSort }: MultiSortDemoProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const { enableMultiSort: multiSortEnabled, isMultiSortEvent } = useMultiSort({
    enableMultiSort,
  });

  const table = useReactTable<Employee>({
    data: EMPLOYEES,
    columns: COLUMNS,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: multiSortEnabled,
    isMultiSortEvent,
  });

  return (
    <div className="space-y-4 p-4">
      <div className="text-sm text-gray-600 bg-gray-50 rounded border p-2">
        <span className="font-semibold">enableMultiSort: </span>
        <span className={enableMultiSort ? 'text-blue-600 font-bold' : 'text-gray-500'}>
          {String(enableMultiSort)}
        </span>
        {enableMultiSort ? (
          <span className="ml-3 text-gray-500">
            ← 헤더 클릭(단일), Shift+클릭(다중 추가), Ctrl/Cmd+클릭(해당 컬럼 정렬 제거)
          </span>
        ) : (
          <span className="ml-3 text-gray-500">← 헤더 클릭으로 단일 정렬만 가능. 배지 미표시.</span>
        )}
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const sortIndex = header.column.getSortIndex();
                  const sortGlyph =
                    sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '⇅';

                  const handleClick = canSort
                    ? (e: React.MouseEvent) => {
                        if (multiSortEnabled && (e.ctrlKey || e.metaKey)) {
                          // 시나리오 B / AC-004 / D4: Ctrl/Cmd+Click → 해당 컬럼 정렬 제거.
                          // EC-004: Ctrl 먼저 체크 → Ctrl+Shift 동시 시 제거 우선.
                          table.setSorting((prev) =>
                            prev.filter((s) => s.id !== header.column.id),
                          );
                        } else if (multiSortEnabled && e.shiftKey) {
                          // 시나리오 A / AC-002: Shift+Click → 기존 정렬 유지 + 컬럼 추가 정렬.
                          header.column.toggleSorting(undefined, true);
                        } else {
                          // 시나리오 C / 기존 단일 정렬 경로 (enableMultiSort=false 또는 plain click).
                          header.column.getToggleSortingHandler()?.(e);
                        }
                      }
                    : undefined;

                  return (
                    <th
                      key={header.id}
                      className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase select-none whitespace-nowrap ${
                        canSort ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                      style={{ width: header.getSize() }}
                      onClick={handleClick}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-gray-400 text-[10px]">{sortGlyph}</span>
                        )}
                        {/* AC-003: enableMultiSort=true 시에만 배지 렌더 (C-6 보존). */}
                        {multiSortEnabled && canSort && (
                          <SortBadge sortIndex={sortIndex} />
                        )}
                      </div>
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
                  <td
                    key={cell.id}
                    className="px-3 py-2 whitespace-nowrap text-gray-700"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 현재 정렬 상태 — 배지 순서 검증용 (column-drag의 orderLog 패턴 차용). */}
      <div className="text-xs text-gray-600 border rounded p-2 bg-gray-50">
        <p className="font-semibold mb-1">현재 SortingState:</p>
        {sorting.length === 0 ? (
          <span className="text-gray-400 italic">정렬 없음</span>
        ) : (
          <ol className="list-decimal pl-5 space-y-0.5 font-mono">
            {sorting.map((s, i) => (
              <li key={s.id}>
                <span className="font-bold text-blue-600">#{i + 1}</span> {s.id} (
                {s.desc ? 'desc ▼' : 'asc ▲'})
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof MultiSortDemo> = {
  title: 'grid-features/multi-sort/MultiSortGrid',
  component: MultiSortDemo,
  parameters: {
    docs: {
      description: {
        component:
          '`useMultiSort` + `SortBadge` — TanStack v8 다중 컬럼 정렬. ' +
          'Shift+Click으로 컬럼 추가, Ctrl/Cmd+Click으로 특정 컬럼 정렬 제거, 우선순위 배지(①②③) 렌더. ' +
          'MOD-GRID-08 G-001 AC-007. 시나리오 A·B·C 3개.',
      },
    },
  },
  argTypes: {
    enableMultiSort: {
      control: { type: 'boolean' },
      description: '다중 정렬 활성 여부. false = 단일 정렬만 (시나리오 C).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MultiSortDemo>;

// ---------------------------------------------------------------------------
// 시나리오 A: 다중 정렬 + 배지 (AC-007 a)
// Spec Section 12.2: 이름 클릭(①) → 부서 Shift+클릭(②) → 배지 ①② 렌더 확인.
// ---------------------------------------------------------------------------

/**
 * 시나리오 A — 다중 컬럼 정렬 + 우선순위 배지.
 *
 * `enableMultiSort=true`. 헤더 클릭으로 단일 정렬 시작,
 * Shift+클릭으로 두 번째·세 번째 컬럼 추가 정렬.
 * 각 헤더에 ①②③ SortBadge 렌더. SortingState 패널에서 순서 확인 가능.
 */
export const ScenarioA_MultiSortWithBadges: Story = {
  name: '시나리오 A — 다중 정렬 + 배지 (Shift+Click)',
  args: { enableMultiSort: true },
  parameters: {
    docs: {
      description: {
        story:
          '`enableMultiSort=true`. 헤더 클릭 → 단일 정렬(①배지). Shift+클릭 → 두 번째 컬럼 추가(②배지). ' +
          '하단 SortingState 패널에서 우선순위 순서 확인. AC-007(a) + AC-002 + AC-003.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// 시나리오 B: Ctrl+Click 정렬 제거 (AC-007 b)
// Spec Section 12.2: 다중 정렬 상태에서 Ctrl/Cmd+클릭 → 해당 컬럼 정렬 제거 + 배지 재번호.
// ---------------------------------------------------------------------------

/**
 * 시나리오 B — Ctrl/Cmd+Click으로 특정 컬럼 정렬 제거.
 *
 * `enableMultiSort=true`. 먼저 Shift+Click으로 다중 정렬 구성 후,
 * Ctrl(Windows) 또는 Cmd(Mac)+클릭으로 해당 컬럼 정렬만 제거.
 * 나머지 컬럼 배지가 ①②…로 재번호됨. EC-003(Ctrl/Cmd 양쪽 지원) + EC-004(Ctrl+Shift → Ctrl 우선).
 */
export const ScenarioB_CtrlClickRemove: Story = {
  name: '시나리오 B — Ctrl/Cmd+Click 정렬 제거',
  args: { enableMultiSort: true },
  parameters: {
    docs: {
      description: {
        story:
          '`enableMultiSort=true`. Shift+Click 다중 정렬 구성 후 → Ctrl(Win)/Cmd(Mac)+Click으로 ' +
          '해당 컬럼 정렬 제거. 배지 ①②→재번호. EC-003 Ctrl/Cmd 양쪽 지원. AC-007(b) + AC-004.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// 시나리오 C: enableMultiSort=false 단일 정렬 보존 (AC-007 c)
// Spec Section 12.2: enableMultiSort=false → Shift+클릭 → 단일 정렬만 (다중 추가 안 됨). 배지 미표시.
// ---------------------------------------------------------------------------

/**
 * 시나리오 C — enableMultiSort=false 단일 정렬 보존 (기존 동작 100% 보존).
 *
 * `enableMultiSort=false` (기본값). Shift+Click을 해도 단일 정렬만 동작
 * (TanStack enableMultiSort=false → isMultiSortEvent 무시, 기존 단일 정렬 덮어씀).
 * SortBadge 미렌더. EC-001 + AC-005 + C-6 무파괴.
 */
export const ScenarioC_SingleSortPreserved: Story = {
  name: '시나리오 C — enableMultiSort=false 단일 정렬 보존',
  args: { enableMultiSort: false },
  parameters: {
    docs: {
      description: {
        story:
          '`enableMultiSort=false`. Shift+Click을 해도 단일 정렬만 동작 (다중 추가 안 됨). ' +
          '배지 미표시. 기존 사용처 23개 동작 100% 보존 확인. EC-001 + AC-005 + C-6.',
      },
    },
  },
};
