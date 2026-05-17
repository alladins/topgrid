/**
 * useStoragePersist — Storybook 데모 (MOD-GRID-02 G-006).
 *
 * AC-005 바인딩: Storybook 스토리 1개 (StoragePersistDemo).
 *
 * 스토리:
 *   - StoragePersistDemo: useState + useStoragePersist 조합 — localStorage 영속화 데모.
 *   - 정렬/필터 토글 후 새로고침 시 state가 localStorage에서 복원됨.
 *   - "스토리지 초기화" 버튼으로 저장된 항목 삭제 후 동작 확인.
 *
 * @see G-006-spec.md Section 6.2
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useCallback } from 'react';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import type { GridStateValues } from './types';
import { useStoragePersist } from './useStoragePersist';

// ─── Demo Component ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'storybook-grid-demo-v1';

/**
 * StoragePersistDemo 컴포넌트.
 * useGridState 대신 useState로 간략 구현 (Storybook 의존성 최소화).
 */
function StoragePersistDemo({
  storage = 'local',
  version = 1,
  debounceMs = 300,
}: {
  storage?: 'local' | 'session';
  version?: number;
  debounceMs?: number;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [hydrated, setHydrated] = useState<Partial<GridStateValues> | null>(null);

  // AC-003 onHydrate — storage → state 복원 콜백
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

  // G-006: useStoragePersist — 전체 GridStateValues storage 영속화
  useStoragePersist(state, {
    storageKey: STORAGE_KEY,
    storage,
    version,
    debounceMs,
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
      prev.length === 0 ? [{ id: 'dept', value: '개발팀' }] : [],
    );
  };

  const clearStorage = () => {
    const api = storage === 'session' ? sessionStorage : localStorage;
    api.removeItem(STORAGE_KEY);
    alert(`"${STORAGE_KEY}" 삭제 완료. 새로고침 시 state 복원 없음.`);
  };

  const storageLabel = storage === 'session' ? 'sessionStorage' : 'localStorage';

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '16px' }}>
      <h3>useStoragePersist 데모</h3>
      <p style={{ color: '#555', fontSize: '13px' }}>
        storage: <strong>{storageLabel}</strong> | storageKey:{' '}
        <code>"{STORAGE_KEY}"</code> | version: {version} | debounceMs: {debounceMs}ms
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button onClick={toggleSort}>정렬 토글</button>
        <button onClick={toggleFilter}>필터 토글</button>
        <button onClick={clearStorage} style={{ color: 'red' }}>
          스토리지 초기화
        </button>
      </div>

      <section>
        <strong>현재 state</strong>
        <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
          {JSON.stringify({ sorting, columnFilters }, null, 2)}
        </pre>
      </section>

      {hydrated && (
        <section>
          <strong>onHydrate 수신 (mount 시 storage → state 복원)</strong>
          <pre style={{ background: '#e8f5e9', padding: '8px', borderRadius: '4px' }}>
            {JSON.stringify(hydrated, null, 2)}
          </pre>
        </section>
      )}

      <section style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
        <p>버튼 클릭 후 {debounceMs}ms 대기 → {storageLabel}에 자동 저장.</p>
        <p>새로고침 시 onHydrate 콜백으로 state 복원 (위 패널에 표시).</p>
        <p>"스토리지 초기화" → 저장 항목 삭제 → 새로고침 시 복원 없음.</p>
      </section>
    </div>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof StoragePersistDemo> = {
  title: 'MOD-GRID-02/G-006 useStoragePersist',
  component: StoragePersistDemo,
  parameters: {
    docs: {
      description: {
        component:
          '`useStoragePersist` — GridStateValues ↔ localStorage/sessionStorage 동기화 hook (G-006). ' +
          'debounce 저장 + mount 시 hydration. version mismatch → 자동 초기화.',
      },
    },
  },
  argTypes: {
    storage: {
      control: { type: 'radio' },
      options: ['local', 'session'],
      description: "사용할 Storage 타입 ('local' = localStorage, 'session' = sessionStorage)",
    },
    version: {
      control: { type: 'number', min: 1, step: 1 },
      description: '저장 포맷 버전 — 변경 시 이전 저장 항목 무효화',
    },
    debounceMs: {
      control: { type: 'number', min: 0, step: 100 },
      description: 'save debounce 지연 ms (0 = 즉시 저장)',
    },
  },
};

export default meta;

type Story = StoryObj<typeof StoragePersistDemo>;

// ─── StoragePersistDemo — AC-005 ──────────────────────────────────────────────

/**
 * StoragePersistDemo: 정렬 + 필터를 localStorage에 영속화하는 기본 데모.
 *
 * - "정렬 토글" / "필터 토글" → 300ms 후 localStorage 자동 저장
 * - 페이지 새로고침 시 `onHydrate` 콜백으로 state 복원
 * - "스토리지 초기화" → localStorage 항목 삭제 (새로고침 후 복원 없음)
 * - Controls 패널에서 storage/version/debounceMs 변경 가능
 *
 * @see G-006-spec.md AC-005
 */
export const StoragePersistDemo: Story = {
  args: {
    storage: 'local',
    version: 1,
    debounceMs: 300,
  },
  parameters: {
    docs: {
      description: {
        story:
          'useState + useStoragePersist 조합 데모. ' +
          '버튼 클릭 후 브라우저 DevTools → Application → localStorage에서 저장 항목 확인. ' +
          '새로고침 시 onHydrate 패널에 복원된 state 표시.',
      },
    },
  },
};
