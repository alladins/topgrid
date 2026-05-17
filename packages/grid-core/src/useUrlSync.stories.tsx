/**
 * useUrlSync — Storybook 데모 (MOD-GRID-02 G-005).
 *
 * AC-004 데모: mount 시 URL search params → `onHydrate` 콜백으로 state 복원.
 * AC-005 바인딩: Storybook 스토리 1개 (SortingUrlSync).
 *
 * 스토리:
 *   - SortingUrlSync: useGridState + useUrlSync 조합 — 정렬/필터 URL 동기화 데모
 *   - 브라우저 주소창 URL에 `?sorting=…` 입력 후 새로고침 시 state 복원 확인
 *
 * @see G-005-spec.md Section 6.2
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useCallback } from 'react';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import type { GridStateValues } from './types';
import { useUrlSync } from './useUrlSync';

// ─── Demo Component ───────────────────────────────────────────────────────────

/**
 * SortingUrlSync 데모 컴포넌트.
 * useGridState 대신 useState로 간략 구현 (Storybook 의존성 최소화).
 */
function SortingUrlSyncDemo({ prefix }: { prefix?: string }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [hydrated, setHydrated] = useState<Partial<GridStateValues> | null>(null);

  // AC-004: onHydrate — URL → state 복원 콜백
  const onHydrate = useCallback((partial: Partial<GridStateValues>) => {
    setHydrated(partial);
    if (partial.sorting) setSorting(partial.sorting as SortingState);
    if (partial.columnFilters) setColumnFilters(partial.columnFilters as ColumnFiltersState);
  }, []);

  const state: GridStateValues = {
    sorting,
    columnFilters,
    rowSelection: {},
    pagination: { pageIndex: 0, pageSize: 10 },
    columnPinning: {},
    columnOrder: [],
    columnSizing: {},
    columnVisibility: {},
  };

  // G-005: useUrlSync — sorting + columnFilters 만 URL 동기화
  useUrlSync(state, {
    keys: ['sorting', 'columnFilters'],
    debounceMs: 300,
    prefix,
    onHydrate,
  });

  const toggleSort = () => {
    setSorting((prev) =>
      prev.length === 0
        ? [{ id: 'name', desc: false }]
        : prev[0]?.desc
        ? []
        : [{ id: 'name', desc: true }],
    );
  };

  const toggleFilter = () => {
    setColumnFilters((prev) =>
      prev.length === 0
        ? [{ id: 'dept', value: '개발팀' }]
        : [],
    );
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '16px' }}>
      <h3>useUrlSync 데모 {prefix ? `(prefix: "${prefix}")` : ''}</h3>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button onClick={toggleSort}>정렬 토글</button>
        <button onClick={toggleFilter}>필터 토글</button>
      </div>

      <section>
        <strong>현재 state</strong>
        <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
          {JSON.stringify({ sorting, columnFilters }, null, 2)}
        </pre>
      </section>

      {hydrated && (
        <section>
          <strong>onHydrate 수신 (mount 시 URL → state 복원)</strong>
          <pre style={{ background: '#e8f5e9', padding: '8px', borderRadius: '4px' }}>
            {JSON.stringify(hydrated, null, 2)}
          </pre>
        </section>
      )}

      <section style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
        <p>브라우저 주소창에서 URL을 확인하세요.</p>
        <p>새로고침 시 정렬/필터 state가 URL에서 복원됩니다 (onHydrate 표시).</p>
        <p>
          예시 URL:{' '}
          <code>
            ?{prefix ? `${prefix}_` : ''}sorting=
            {encodeURIComponent(JSON.stringify([{ id: 'name', desc: false }]))}
          </code>
        </p>
      </section>
    </div>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof SortingUrlSyncDemo> = {
  title: 'MOD-GRID-02/G-005 useUrlSync',
  component: SortingUrlSyncDemo,
  parameters: {
    docs: {
      description: {
        component:
          '`useUrlSync` — GridStateValues subset ↔ URL search params 동기화 hook (G-005). ' +
          'router 라이브러리 의존 없음. `window.history.replaceState` 직접 사용.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SortingUrlSyncDemo>;

// ─── SortingUrlSync — AC-004, AC-005 ─────────────────────────────────────────

/**
 * SortingUrlSync: 정렬 + 필터를 URL에 동기화하는 기본 데모.
 *
 * - "정렬 토글" 버튼 클릭 → URL `?sorting=…` 반영
 * - "필터 토글" 버튼 클릭 → URL `?columnFilters=…` 반영
 * - 페이지 새로고침 시 `onHydrate` 콜백으로 state 복원
 *
 * @see G-005-spec.md AC-004, AC-005
 */
export const SortingUrlSync: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'useGridState(간략 버전) + useUrlSync 조합 데모. ' +
          '버튼 클릭 후 브라우저 주소창 URL 변화 확인. ' +
          '새로고침 시 onHydrate 패널에 복원된 state 표시.',
      },
    },
  },
};

