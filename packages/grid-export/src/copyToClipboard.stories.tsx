/**
 * copyToClipboard.stories.tsx — MOD-GRID-06 / G-004
 *
 * copyToClipboard + printGrid 시나리오를 함께 포함 (D9: 1개 파일로 통합, AC-006).
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
  useReactTable,
} from '@tanstack/react-table';
import { copyToClipboard } from './copyToClipboard';
import { printGrid } from './printGrid';

// ---------------------------------------------------------------------------
// Mock 데이터 (Storybook / 테스트 전용 — C-3 예외)
// ---------------------------------------------------------------------------

interface MockRow {
  id: number;
  name: string;
  department: string;
  status: string;
}

const MOCK_DATA: MockRow[] = [
  { id: 1, name: '홍길동', department: '개발팀', status: '재직' },
  { id: 2, name: '김철수', department: '인사팀', status: '재직' },
  { id: 3, name: '이영희', department: '마케팅팀', status: '휴직' },
  { id: 4, name: '박민준', department: '개발팀', status: '재직' },
  { id: 5, name: '최수연', department: '영업팀', status: '재직' },
];

const columnHelper = createColumnHelper<MockRow>();

const COLUMNS = [
  columnHelper.accessor('id', { header: 'ID' }),
  columnHelper.accessor('name', { header: '이름' }),
  columnHelper.accessor('department', { header: '부서' }),
  columnHelper.accessor('status', { header: '상태' }),
];

// ---------------------------------------------------------------------------
// Story 공통 컴포넌트
// ---------------------------------------------------------------------------

interface StoryWrapperProps {
  label: string;
  action: () => void | Promise<void>;
  description?: string;
}

function StoryWrapper({ label, action, description }: StoryWrapperProps) {
  const [status, setStatus] = React.useState<string>('');

  const handleClick = () => {
    setStatus('처리 중...');
    const result = action();
    const promise = result instanceof Promise ? result : Promise.resolve();
    promise
      .then(() => setStatus('완료'))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setStatus(`오류: ${message}`);
      });
  };

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      {description && (
        <p style={{ marginBottom: 8, color: '#555' }}>{description}</p>
      )}
      <button onClick={handleClick} style={{ padding: '8px 16px', cursor: 'pointer' }}>
        {label}
      </button>
      {status && (
        <span
          style={{
            marginLeft: 12,
            color: status.startsWith('오류') ? 'red' : '#333',
          }}
        >
          {status}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story 1: CopyFiltered — copyToClipboard, scope: 'filtered' (기본)
// ---------------------------------------------------------------------------

export function CopyFiltered() {
  const table = useReactTable({
    data: MOCK_DATA,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <StoryWrapper
      label="클립보드 복사 (filtered, 기본)"
      description="scope: 'filtered' — 필터 적용 행을 TSV로 클립보드 복사. Excel에 붙여넣기 호환."
      action={() => copyToClipboard(table, { scope: 'filtered' })}
    />
  );
}

CopyFiltered.storyName = 'CopyFiltered';

// ---------------------------------------------------------------------------
// Story 2: CopySelected — copyToClipboard, scope: 'selected'
// ---------------------------------------------------------------------------

export function CopySelected() {
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({
    '0': true,
    '2': true,
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

  return (
    <StoryWrapper
      label="클립보드 복사 (선택 행만)"
      description="scope: 'selected' — row 0, 2 선택 상태. 선택 행만 TSV로 클립보드 복사."
      action={() => copyToClipboard(table, { scope: 'selected' })}
    />
  );
}

CopySelected.storyName = 'CopySelected';

// ---------------------------------------------------------------------------
// Story 3: PrintGridDefault — printGrid, portrait, filtered
// ---------------------------------------------------------------------------

export function PrintGridDefault() {
  const table = useReactTable({
    data: MOCK_DATA,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <StoryWrapper
      label="인쇄 (기본)"
      description="printGrid — portrait, filtered rows, 제목 없음. 팝업 허용 필요."
      action={() => printGrid(table)}
    />
  );
}

PrintGridDefault.storyName = 'PrintGridDefault';

// ---------------------------------------------------------------------------
// Story 4: PrintGridLandscape — printGrid, landscape, title, scope: 'all'
// ---------------------------------------------------------------------------

export function PrintGridLandscape() {
  const table = useReactTable({
    data: MOCK_DATA,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <StoryWrapper
      label="인쇄 (가로 방향 + 제목)"
      description="printGrid — landscape, scope: 'all', title: '2026년 데이터 목록'. 팝업 허용 필요."
      action={() =>
        printGrid(table, {
          title: '2026년 데이터 목록',
          orientation: 'l',
          scope: 'all',
          emptyBehavior: 'empty',
        })
      }
    />
  );
}

PrintGridLandscape.storyName = 'PrintGridLandscape';

// ---------------------------------------------------------------------------
// Storybook meta (CSF3 format)
// ---------------------------------------------------------------------------

export default {
  title: '@topgrid/grid-export/clipboard-print',
  parameters: {
    docs: {
      description: {
        component:
          'TanStack Table 데이터를 클립보드(TSV)로 복사하거나 인쇄 팝업으로 출력합니다. ' +
          '외부 dependency 없음 — navigator.clipboard + window.print 순수 Web API 전용. ' +
          'G-004 (copyToClipboard + printGrid)',
      },
    },
  },
};
