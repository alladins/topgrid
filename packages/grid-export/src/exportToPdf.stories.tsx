/**
 * exportToPdf.stories.tsx — MOD-GRID-06 / G-003
 *
 * NOTE: .storybook 디렉토리가 monorepo 루트 또는 grid-export 패키지에 부재.
 * 실제 Storybook 빌드는 인프라 구성 후 동작합니다 (spec Section 8.2 AC-007).
 * story export는 완료된 상태 — 인프라 후속 작업 대상.
 */

import React from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { exportToPdf } from './exportToPdf';

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
  action: () => Promise<void>;
  description?: string;
}

function StoryWrapper({ label, action, description }: StoryWrapperProps) {
  const [status, setStatus] = React.useState<string>('');

  const handleClick = () => {
    setStatus('처리 중...');
    action()
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
        <span style={{ marginLeft: 12, color: status.startsWith('오류') ? 'red' : '#333' }}>
          {status}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story 1: Default — portrait, filtered, Helvetica
// ---------------------------------------------------------------------------

export function Default() {
  const table = useReactTable({
    data: MOCK_DATA,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <StoryWrapper
      label="PDF 다운로드 (기본)"
      description="portrait, filtered rows, Helvetica (기본)"
      action={() => exportToPdf(table, { fileName: '보고서.pdf' })}
    />
  );
}

Default.storyName = 'Default';

// ---------------------------------------------------------------------------
// Story 2: Landscape — 가로 방향 + 제목
// ---------------------------------------------------------------------------

export function Landscape() {
  const table = useReactTable({
    data: MOCK_DATA,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <StoryWrapper
      label="PDF 다운로드 (가로 방향)"
      description="landscape, title 포함, scope: all"
      action={() =>
        exportToPdf(table, {
          fileName: '전체데이터.pdf',
          title: '2026년 데이터 목록',
          scope: 'all',
          orientation: 'l',
          emptyBehavior: 'empty',
        })
      }
    />
  );
}

Landscape.storyName = 'Landscape';

// ---------------------------------------------------------------------------
// Story 3: SelectedRowsOnly — scope: 'selected' (선택 행만)
// ---------------------------------------------------------------------------

export function SelectedRowsOnly() {
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
      label="PDF 다운로드 (선택 행만)"
      description="scope: 'selected' — 현재 row 0, 2 선택 상태"
      action={() =>
        exportToPdf(table, {
          fileName: '선택데이터.pdf',
          scope: 'selected',
        })
      }
    />
  );
}

SelectedRowsOnly.storyName = 'SelectedRowsOnly';

// ---------------------------------------------------------------------------
// Story 4: KoreanFont — fontFamily: 'korean' (stub 상태 설명)
// ---------------------------------------------------------------------------

export function KoreanFont() {
  const table = useReactTable({
    data: MOCK_DATA,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <StoryWrapper
      label="PDF 다운로드 (한국어 폰트)"
      description={
        '[STUB] fontFamily: "korean" — loadKoreanFont.ts가 stub 상태이므로 ' +
        'console.warn 발생 + Helvetica fallback. 한국어 글자가 깨질 수 있습니다. ' +
        '(spec Section 12 V1 구현 완료 후 정상 동작)'
      }
      action={() =>
        exportToPdf(table, {
          fileName: '한국어.pdf',
          fontFamily: 'korean',
        })
      }
    />
  );
}

KoreanFont.storyName = 'KoreanFont';

// ---------------------------------------------------------------------------
// Storybook meta (CSF3 format)
// ---------------------------------------------------------------------------

export default {
  title: '@topgrid/grid-export/exportToPdf',
  parameters: {
    docs: {
      description: {
        component:
          'TanStack Table 인스턴스를 PDF로 export합니다. ' +
          'jspdf + jspdf-autotable optional peer 사용. ' +
          '한국어 폰트는 V1 구현 대상 (stub 상태).',
      },
    },
  },
};
