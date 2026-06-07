// MOD-GRID-21 mount verification (dev-harness LESS-002).
// StatusBar/ToolPanel are pure react-18 (node-mountable), but RowGroupPanel
// re-exports agg GroupPanel (agg dist binds react 19) → real mount happens here
// under the storybook single-react (18.3.1) harness.
//
// mock data: Storybook stories 허용 범위 (other packages' stories follow this).
import type { Meta, StoryObj } from '@storybook/react';
import { StatusBar, ToolPanel, RowGroupPanel, SideBar } from '@topgrid/grid-pro-panel';
import { setLicenseState } from '@topgrid/grid-license';

const meta: Meta = { title: 'grid-pro-panel/Panels' };
export default meta;

// MOD-GRID-58: SideBar accordion — two panels (Columns ToolPanel + a simple Filters list); one open
// at a time. ★non-vacuous: only the open panel's content is in the DOM; clicking another header
// swaps which content renders (accordion-exclusive).
export const SideBarStory: StoryObj = {
  name: 'SideBar (도구 패널 아코디언)',
  beforeEach: () => {
    setLicenseState({ status: { valid: true as const }, rawKey: 'test', setAt: 0 });
  },
  render: () => (
    <SideBar
      panels={[
        {
          id: 'columns',
          title: 'Columns',
          content: (
            <ToolPanel
              columns={[
                { id: 'region', label: 'Region', visible: true },
                { id: 'sales', label: 'Sales', visible: true },
              ]}
              onVisibilityChange={() => undefined}
            />
          ),
        },
        {
          id: 'filters',
          title: 'Filters',
          content: <div data-testid="filters-body">No active filters</div>,
        },
      ]}
    />
  ),
};

export const StatusBarStory: StoryObj = {
  name: 'StatusBar 선택/집계 요약',
  render: () => (
    <StatusBar
      items={[
        { key: 'sel', label: 'Selected', value: 3 },
        { key: 'total', label: 'Rows', value: 128 },
        { key: 'sum', label: 'Sum(sales)', value: '₩1,240,000' },
      ]}
    />
  ),
};

export const ToolPanelStory: StoryObj = {
  name: 'ToolPanel 컬럼 표시/순서 토글',
  render: () => (
    <ToolPanel
      columns={[
        { id: 'region', label: 'Region', visible: true },
        { id: 'sales', label: 'Sales', visible: true },
        { id: 'id', label: 'ID', visible: false, canHide: false },
      ]}
      onVisibilityChange={(id, v) => console.log('visibility', id, v)}
      onReorder={(id, dir) => console.log('reorder', id, dir)}
    />
  ),
};

export const RowGroupPanelStory: StoryObj = {
  name: 'RowGroupPanel (agg GroupPanel 재사용)',
  render: () => (
    <RowGroupPanel
      grouping={[]}
      columns={[]}
      onGroupingChange={(g) => console.log('grouping', g)}
    />
  ),
};
