/**
 * scopeIntegration.stories.tsx — MOD-GRID-06 / G-005
 *
 * 통합 시나리오 story: 필터 + 정렬 적용 상태에서 5종 export 매트릭스 시연 (AC-005, C-25).
 *
 * NOTE: .storybook 디렉토리가 monorepo 루트 또는 grid-export 패키지에 부재.
 * 실제 Storybook 빌드는 인프라 구성 후 동작합니다.
 * story export는 완료된 상태 — 인프라 후속 작업 대상.
 */

import React from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { exportToExcel } from './exportToExcel';
import { exportToCSV } from './exportToCSV';
import { exportToPdf } from './exportToPdf';
import { copyToClipboard } from './copyToClipboard';
import { printGrid } from './printGrid';
import type { ExportScope, EmptyBehavior } from './types';

// ---------------------------------------------------------------------------
// Mock 데이터
// ---------------------------------------------------------------------------

interface MockRow {
  id: number;
  name: string;
  department: string;
  score: number;
  status: string;
}

const MOCK_DATA: MockRow[] = [
  { id: 1, name: '홍길동', department: '개발팀', score: 92, status: '재직' },
  { id: 2, name: '김철수', department: '인사팀', score: 78, status: '재직' },
  { id: 3, name: '이영희', department: '마케팅팀', score: 85, status: '휴직' },
  { id: 4, name: '박민준', department: '개발팀', score: 95, status: '재직' },
  { id: 5, name: '최수연', department: '영업팀', score: 70, status: '재직' },
  { id: 6, name: '정하늘', department: '개발팀', score: 88, status: '재직' },
];

const columnHelper = createColumnHelper<MockRow>();

const COLUMNS = [
  columnHelper.accessor('id', { header: 'ID' }),
  columnHelper.accessor('name', { header: '이름' }),
  columnHelper.accessor('department', { header: '부서' }),
  columnHelper.accessor('score', { header: '점수' }),
  columnHelper.accessor('status', { header: '상태' }),
];

// ---------------------------------------------------------------------------
// Story 공통 컴포넌트
// ---------------------------------------------------------------------------

interface ExportButtonsProps {
  scope: ExportScope;
  emptyBehavior?: EmptyBehavior;
  getTable: () => ReturnType<typeof useReactTable<MockRow>>;
}

function ExportButtons({ scope, emptyBehavior = 'skip', getTable }: ExportButtonsProps) {
  const [lastAction, setLastAction] = React.useState<string>('');

  const run = (label: string, fn: () => void | Promise<void>) => {
    setLastAction(`${label} 처리 중...`);
    const result = fn();
    const p = result instanceof Promise ? result : Promise.resolve();
    p.then(() => setLastAction(`${label} 완료`)).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setLastAction(`${label} 오류: ${msg}`);
    });
  };

  const table = getTable();

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <button onClick={() => run('Excel', () => exportToExcel(table, { scope, emptyBehavior, fileName: 'scope-test.xlsx' }))}>
        Excel
      </button>
      <button onClick={() => run('CSV', () => exportToCSV(table, { scope, emptyBehavior, fileName: 'scope-test.csv' }))}>
        CSV
      </button>
      <button onClick={() => run('PDF', () => exportToPdf(table, { scope, emptyBehavior, fileName: 'scope-test.pdf' }))}>
        PDF
      </button>
      <button onClick={() => run('클립보드', () => copyToClipboard(table, { scope, emptyBehavior }))}>
        클립보드
      </button>
      <button onClick={() => run('인쇄', () => printGrid(table, { scope, emptyBehavior }))}>
        인쇄
      </button>
      {lastAction && (
        <span style={{ marginLeft: 8, alignSelf: 'center', color: lastAction.includes('오류') ? 'red' : '#333' }}>
          {lastAction}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story 1: ScopeFiltered — 필터 + 정렬 적용 후 5종 export (scope='filtered')
//
// AC-001, AC-005: getFilteredRowModel().rows = 정렬 + 필터 모두 반영 (D4)
// ---------------------------------------------------------------------------

export function ScopeFiltered() {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
    { id: 'status', value: '재직' },
  ]);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'score', desc: true },
  ]);

  const table = useReactTable({
    data: MOCK_DATA,
    columns: COLUMNS,
    state: { columnFilters, sorting },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <h3>scope=&apos;filtered&apos; — 필터(상태=재직) + 정렬(점수 내림차순)</h3>
      <p style={{ color: '#555' }}>
        필터 적용 행 수: <strong>{filteredCount}</strong> / {MOCK_DATA.length} —
        export 결과에 필터 + 정렬 순서가 반영됩니다 (TanStack 파이프라인 D4).
      </p>
      <ExportButtons scope="filtered" getTable={() => table} />
    </div>
  );
}

ScopeFiltered.storyName = 'ScopeFiltered';

// ---------------------------------------------------------------------------
// Story 2: ScopeSelected — 행 선택 후 5종 export (scope='selected')
//
// AC-002, AC-005: 선택 행만 export. 0행 시 emptyBehavior='skip' → warn + return.
// ---------------------------------------------------------------------------

export function ScopeSelected() {
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({
    '0': true,
    '3': true,
  });

  const table = useReactTable({
    data: MOCK_DATA,
    columns: COLUMNS,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  });

  const selectedCount = table.getSelectedRowModel().rows.length;

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <h3>scope=&apos;selected&apos; — row 0, 3 선택</h3>
      <p style={{ color: '#555' }}>
        선택 행 수: <strong>{selectedCount}</strong> —
        선택 행만 export됩니다 (emptyBehavior=&apos;skip&apos; 기본).
      </p>
      <ExportButtons scope="selected" getTable={() => table} />
    </div>
  );
}

ScopeSelected.storyName = 'ScopeSelected';

// ---------------------------------------------------------------------------
// Story 3: ScopeAll — 필터/정렬 무시 전체 export (scope='all')
//
// AC-003, AC-005: getCoreRowModel().rows = 원본 순서 (필터/정렬 미반영).
// ---------------------------------------------------------------------------

export function ScopeAll() {
  const [columnFilters] = React.useState<ColumnFiltersState>([
    { id: 'status', value: '재직' },
  ]);
  const [sorting] = React.useState<SortingState>([{ id: 'score', desc: true }]);

  const table = useReactTable({
    data: MOCK_DATA,
    columns: COLUMNS,
    state: { columnFilters, sorting },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <h3>scope=&apos;all&apos; — 필터/정렬 무시 전체 export</h3>
      <p style={{ color: '#555' }}>
        필터(상태=재직), 정렬(점수 내림차순) 설정이 있어도 scope=&apos;all&apos;은 원본 순서 전체{' '}
        <strong>{MOCK_DATA.length}행</strong>을 export합니다 (getCoreRowModel).
      </p>
      <ExportButtons scope="all" getTable={() => table} />
    </div>
  );
}

ScopeAll.storyName = 'ScopeAll';

// ---------------------------------------------------------------------------
// Storybook meta (CSF3 format)
// ---------------------------------------------------------------------------

export default {
  title: '@tomis/grid-export/scope-integration',
  parameters: {
    docs: {
      description: {
        component:
          '5종 export 함수(Excel / CSV / PDF / 클립보드 / 인쇄)의 scope 통합 검증 시나리오. ' +
          'scope=filtered: 필터+정렬 반영(TanStack 파이프라인 D4) / ' +
          'scope=selected: 선택 행만 / scope=all: 원본 전체. ' +
          'G-005 AC-001~AC-005. EmptyBehavior named type 공유.',
      },
    },
  },
};
