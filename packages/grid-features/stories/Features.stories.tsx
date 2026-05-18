// spec G-002 Section 7 #8 / Step 7
// AC-001: grid-features 모든 export Component story 커버 (11개)
// C-3 예외: mock 상태 데이터는 Storybook stories에서만 허용 (D7 결정, ADR-006)
// C-1 준수: 모든 props는 실제 소스 파일 Read 후 확인한 시그니처 사용
//   - SortBadgeProps: sortIndex (0-based, -1=미정렬), className
//   - SortClearButtonProps: onClear, label?, className?
//   - DropIndicator: dragOverId, columnId
//   - FilterIndicatorProps: isFiltered
//   - FilterPopoverProps: trigger, children, align?
//   - TextFilterProps<TData>: column (Column<TData, unknown>)
//   - NumberFilterProps<TData>: column
//   - DateFilterProps<TData>: column
//   - SelectFilterProps<TData>: column, searchThreshold?, popoverAlign?
//   - GlobalSearchInputProps<TData>: table (Table<TData>), debounceMs?, placeholder?
//   - FilterResetButtonProps<TData>: table (Table<TData>), children?
import type { Meta, StoryObj } from '@storybook/react';
import type { Column, Table } from '@tanstack/react-table';
import {
  TextFilter,
  NumberFilter,
  DateFilter,
  SelectFilter,
  GlobalSearchInput,
  FilterResetButton,
  FilterPopover,
  FilterIndicator,
  SortBadge,
  SortClearButton,
  DropIndicator,
} from '@topgrid/grid-features';

// ─── C-3 예외: mock Table/Column helpers ─────────────────────────────────────
interface MockRow {
  id: number;
  name: string;
  amount: number;
  status: string;
  date: string;
}

function makeMockColumn<T>(
  id: string,
  filterValue: unknown = undefined,
): Column<T, unknown> {
  return {
    id,
    getFilterValue: () => filterValue,
    setFilterValue: (_val: unknown) => undefined,
    getIsFiltered: () => filterValue !== undefined,
    getFacetedUniqueValues: () => new Map([['재직', 5], ['휴직', 2]]),
  } as unknown as Column<T, unknown>;
}

function makeMockTable<T>(): Table<T> {
  return {
    getState: () => ({ globalFilter: '' }),
    setGlobalFilter: (_val: string) => undefined,
    resetColumnFilters: () => undefined,
    getIsFiltered: () => false,
  } as unknown as Table<T>;
}

// ─── SortBadge ────────────────────────────────────────────────────────────
// SortBadgeProps: sortIndex (column.getSortIndex() 반환값, -1=미정렬, 0+=정렬순서)
const sortBadgeMeta: Meta<typeof SortBadge> = {
  title: 'grid-features/SortBadge',
  component: SortBadge,
  tags: ['autodocs'],
};
export default sortBadgeMeta;

export const SortBadgeFirst: StoryObj<typeof SortBadge> = {
  name: 'SortBadge 1번째 정렬',
  args: {
    sortIndex: 0,  // 표시 번호 = sortIndex + 1 = 1
  },
};

export const SortBadgeSecond: StoryObj<typeof SortBadge> = {
  name: 'SortBadge 2번째 정렬',
  args: {
    sortIndex: 1,  // 표시 번호 = 2
  },
};

export const SortBadgeNotSorted: StoryObj<typeof SortBadge> = {
  name: 'SortBadge 미정렬 (숨김)',
  args: {
    sortIndex: -1,  // -1 = 미정렬 → null 반환
  },
};

// ─── SortClearButton ─────────────────────────────────────────────────────
// SortClearButtonProps: onClear, label?, className?
export const SortClearButtonDefault: StoryObj<typeof SortClearButton> = {
  name: 'SortClearButton 기본',
  args: {
    onClear: () => alert('정렬 초기화'),
  },
};

export const SortClearButtonCustomLabel: StoryObj<typeof SortClearButton> = {
  name: 'SortClearButton 커스텀 레이블',
  args: {
    onClear: () => undefined,
    label: '초기화',
  },
};

// ─── FilterIndicator ──────────────────────────────────────────────────────
// FilterIndicatorProps: isFiltered
export const FilterIndicatorActive: StoryObj<typeof FilterIndicator> = {
  name: 'FilterIndicator 활성',
  args: {
    isFiltered: true,
  },
};

export const FilterIndicatorInactive: StoryObj<typeof FilterIndicator> = {
  name: 'FilterIndicator 비활성',
  args: {
    isFiltered: false,
  },
};

// ─── FilterPopover ────────────────────────────────────────────────────────
// FilterPopoverProps: trigger, children, align?
export const FilterPopoverDefault: StoryObj<typeof FilterPopover> = {
  name: 'FilterPopover 기본',
  args: {
    trigger: <button type="button" className="px-2 py-1 text-xs border rounded">필터</button>,
    children: (
      <div className="p-3 text-sm">
        <p>필터 내용 영역</p>
      </div>
    ),
  },
};

// ─── TextFilter ──────────────────────────────────────────────────────────
// TextFilterProps<T>: column (Column<T, unknown>)
export const TextFilterDefault: StoryObj<typeof TextFilter> = {
  name: 'TextFilter 기본',
  render: () => (
    <TextFilter<MockRow>
      column={makeMockColumn<MockRow>('name')}
    />
  ),
};

export const TextFilterWithValue: StoryObj<typeof TextFilter> = {
  name: 'TextFilter 값 있음',
  render: () => (
    <TextFilter<MockRow>
      column={makeMockColumn<MockRow>('name', { operator: 'contains', value: '홍' })}
    />
  ),
};

// ─── NumberFilter ─────────────────────────────────────────────────────────
// NumberFilterProps<T>: column (Column<T, unknown>)
export const NumberFilterDefault: StoryObj<typeof NumberFilter> = {
  name: 'NumberFilter 기본',
  render: () => (
    <NumberFilter<MockRow>
      column={makeMockColumn<MockRow>('amount')}
    />
  ),
};

// ─── DateFilter ──────────────────────────────────────────────────────────
// DateFilterProps<T>: column (Column<T, unknown>)
export const DateFilterDefault: StoryObj<typeof DateFilter> = {
  name: 'DateFilter 기본',
  render: () => (
    <DateFilter<MockRow>
      column={makeMockColumn<MockRow>('date')}
    />
  ),
};

// ─── SelectFilter ─────────────────────────────────────────────────────────
// SelectFilterProps<T>: column, searchThreshold?, popoverAlign?
export const SelectFilterDefault: StoryObj<typeof SelectFilter> = {
  name: 'SelectFilter 기본',
  render: () => (
    <SelectFilter<MockRow>
      column={makeMockColumn<MockRow>('status')}
    />
  ),
};

// ─── GlobalSearchInput ────────────────────────────────────────────────────
// GlobalSearchInputProps<T>: table (Table<T>), debounceMs?, placeholder?
export const GlobalSearchInputDefault: StoryObj<typeof GlobalSearchInput> = {
  name: 'GlobalSearchInput 기본',
  render: () => (
    <GlobalSearchInput<MockRow>
      table={makeMockTable<MockRow>()}
      placeholder="전체 검색..."
    />
  ),
};

// ─── FilterResetButton ────────────────────────────────────────────────────
// FilterResetButtonProps<T>: table (Table<T>), children?
export const FilterResetButtonDefault: StoryObj<typeof FilterResetButton> = {
  name: 'FilterResetButton 기본',
  render: () => (
    <FilterResetButton<MockRow>
      table={makeMockTable<MockRow>()}
    >
      필터 초기화
    </FilterResetButton>
  ),
};

// ─── DropIndicator ────────────────────────────────────────────────────────
// DropIndicator: { dragOverId: string | null, columnId: string }
export const DropIndicatorActive: StoryObj<typeof DropIndicator> = {
  name: 'DropIndicator 활성 (드래그 중)',
  render: () => (
    <div className="relative h-16 border border-gray-300 flex items-center justify-center">
      <span className="text-sm text-gray-500">컬럼 헤더 (dragOverId===columnId)</span>
      <DropIndicator dragOverId="name" columnId="name" />
    </div>
  ),
};

export const DropIndicatorInactive: StoryObj<typeof DropIndicator> = {
  name: 'DropIndicator 비활성 (드래그 없음)',
  render: () => (
    <div className="relative h-16 border border-gray-300 flex items-center justify-center">
      <span className="text-sm text-gray-500">컬럼 헤더 (dragOverId!==columnId)</span>
      <DropIndicator dragOverId={null} columnId="name" />
    </div>
  ),
};
