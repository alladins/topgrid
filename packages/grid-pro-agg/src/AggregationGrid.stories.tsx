/**
 * AggregationGrid Storybook stories — AC-008, C-25
 *
 * CSF3 placeholder pattern: no @storybook/react runtime dependency.
 * Storybook runtime integration is deferred to MOD-GRID-99-B.
 * Story `args` blocks document API scenarios and serve as living documentation.
 *
 * MOD-GRID-15 / G-001
 * MOD-GRID-15 / G-003 (CustomAggregation story)
 * MOD-GRID-15 / G-004 (GroupPanelWithSort story — AC-007)
 */
import type { AggregationFn } from '@tanstack/react-table';
import { registerAggregationFn } from './aggregationFns';
import type { AggregationColumnDef, AggregationGridProps } from './types';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

interface SalesRow {
  region: string;
  category: string;
  product: string;
  sales: number;
  units: number;
}

const sampleData: SalesRow[] = [
  { region: 'North', category: 'Electronics', product: 'Laptop',  sales: 1200, units: 3 },
  { region: 'North', category: 'Electronics', product: 'Phone',   sales:  800, units: 5 },
  { region: 'North', category: 'Furniture',   product: 'Chair',   sales:  300, units: 4 },
  { region: 'South', category: 'Electronics', product: 'Tablet',  sales:  600, units: 2 },
  { region: 'South', category: 'Furniture',   product: 'Desk',    sales:  900, units: 1 },
  { region: 'South', category: 'Furniture',   product: 'Lamp',    sales:  150, units: 6 },
];

// ---------------------------------------------------------------------------
// Story: BasicGrouping
// Single-level grouping by region with sum aggregation on sales.
// ---------------------------------------------------------------------------

const basicColumns: AggregationColumnDef<SalesRow>[] = [
  {
    id: 'region',
    header: 'Region',
    accessorKey: 'region',
  },
  {
    id: 'product',
    header: 'Product',
    accessorKey: 'product',
  },
  {
    id: 'sales',
    header: 'Sales ($)',
    accessorKey: 'sales',
    meta: { aggregationFn: 'sum' },
  },
];

const basicArgs: AggregationGridProps<SalesRow> = {
  data: sampleData,
  columns: basicColumns,
  enableAggregation: true,
  grouping: ['region'],
  expanded: true,
};

/**
 * BasicGrouping: single-level group by `region` with sum of `sales`.
 *
 * Expected: two group rows (North / South) each showing total sales.
 * Leaf rows visible because `expanded: true`.
 */
export const BasicGrouping = {
  args: basicArgs,
};

// ---------------------------------------------------------------------------
// Story: MultiColumnGrouping
// Two-level grouping: region → category with count on units.
// ---------------------------------------------------------------------------

const multiColumns: AggregationColumnDef<SalesRow>[] = [
  {
    id: 'region',
    header: 'Region',
    accessorKey: 'region',
  },
  {
    id: 'category',
    header: 'Category',
    accessorKey: 'category',
  },
  {
    id: 'product',
    header: 'Product',
    accessorKey: 'product',
  },
  {
    id: 'units',
    header: 'Units',
    accessorKey: 'units',
    meta: { aggregationFn: 'count' },
  },
];

const multiArgs: AggregationGridProps<SalesRow> = {
  data: sampleData,
  columns: multiColumns,
  enableAggregation: true,
  grouping: ['region', 'category'],
  expanded: true,
};

/**
 * MultiColumnGrouping: two-level grouping (region → category) with count on units.
 *
 * Expected: nested group hierarchy — North > Electronics, North > Furniture,
 * South > Electronics, South > Furniture — each showing row count.
 */
export const MultiColumnGrouping = {
  args: multiArgs,
};

// ---------------------------------------------------------------------------
// Story: AvgAggregation
// 'avg' key (mapped to TanStack 'mean' internally) on sales column.
// ---------------------------------------------------------------------------

const avgColumns: AggregationColumnDef<SalesRow>[] = [
  {
    id: 'region',
    header: 'Region',
    accessorKey: 'region',
  },
  {
    id: 'product',
    header: 'Product',
    accessorKey: 'product',
  },
  {
    id: 'sales',
    header: 'Avg Sales ($)',
    accessorKey: 'sales',
    meta: { aggregationFn: 'avg' }, // resolveAggregationFn maps 'avg' → 'mean'
  },
];

const avgArgs: AggregationGridProps<SalesRow> = {
  data: sampleData,
  columns: avgColumns,
  enableAggregation: true,
  grouping: ['region'],
  expanded: true,
};

/**
 * AvgAggregation: validates the 'avg' → 'mean' mapping (spec D5).
 *
 * `meta.aggregationFn: 'avg'` is user-facing; `resolveAggregationFn` converts
 * it to TanStack's built-in 'mean' key before passing to useReactTable.
 *
 * Expected: North avg = (1200+800+300)/3 ≈ 766.67, South avg = (600+900+150)/3 = 550.
 */
export const AvgAggregation = {
  args: avgArgs,
};

// ---------------------------------------------------------------------------
// Story: GroupFooterExpand
// Group footer row + expand/collapse interaction.
// Validates: AC-002 (footer row after leaf rows), AC-003 (expanded=false hides footer),
//            GroupRow/FooterRow component integration (C-31).
// ---------------------------------------------------------------------------

const groupFooterColumns: AggregationColumnDef<SalesRow>[] = [
  {
    id: 'region',
    header: 'Region',
    accessorKey: 'region',
  },
  {
    id: 'product',
    header: 'Product',
    accessorKey: 'product',
  },
  {
    id: 'sales',
    header: 'Sales ($)',
    accessorKey: 'sales',
    meta: { aggregationFn: 'sum' },
  },
  {
    id: 'units',
    header: 'Units',
    accessorKey: 'units',
    meta: { aggregationFn: 'count' },
  },
];

const groupFooterArgs: AggregationGridProps<SalesRow> = {
  data: sampleData,
  columns: groupFooterColumns,
  enableAggregation: true,
  grouping: ['region'],
  expanded: true,
  showFooter: true,
  footerRowClassName: 'font-semibold text-blue-800',
};

/**
 * GroupFooterExpand: validates synthetic footer row interleaving (D4).
 *
 * Expected:
 * - Group header "North ▼ (3)" with bg-blue-50
 * - 3 leaf rows (Laptop, Phone, Chair)
 * - Footer row (bg-gray-50 + font-semibold) with sales sum=2300, units count=3
 * - Group header "South ▼ (3)" with bg-blue-50
 * - 3 leaf rows (Tablet, Desk, Lamp)
 * - Footer row with sales sum=1650, units count=3
 *
 * Toggle group header to collapse → leaf rows + footer row hidden (AC-003).
 *
 * EC-004 limitation: virtualization disabled here — all rows rendered in DOM.
 */
export const GroupFooterExpand = {
  args: groupFooterArgs,
};

// ---------------------------------------------------------------------------
// Story: VirtualizedGroupFooter
// 1000+ rows with virtualization enabled (AC-004, C-18).
// ---------------------------------------------------------------------------

interface ProductRow {
  dept: string;
  name: string;
  value: number;
}

function generateLargeDataset(count: number): ProductRow[] {
  const depts = ['Engineering', 'Marketing', 'Sales', 'Support', 'Finance'];
  return Array.from({ length: count }, (_, i) => ({
    dept: depts[i % depts.length],
    name: `Item-${i + 1}`,
    value: Math.round(Math.random() * 1000),
  }));
}

const virtualizedData = generateLargeDataset(1000);

const virtualizedColumns: AggregationColumnDef<ProductRow>[] = [
  {
    id: 'dept',
    header: 'Department',
    accessorKey: 'dept',
  },
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
  },
  {
    id: 'value',
    header: 'Value',
    accessorKey: 'value',
    meta: { aggregationFn: 'sum' },
  },
];

const virtualizedArgs: AggregationGridProps<ProductRow> = {
  data: virtualizedData,
  columns: virtualizedColumns,
  enableAggregation: true,
  grouping: ['dept'],
  expanded: true,
  showFooter: true,
  enableVirtualization: true,
  estimatedRowHeight: 40,
  virtualOverscan: 5,
};

/**
 * VirtualizedGroupFooter: 1000-row dataset with virtualization enabled (AC-004, C-18).
 *
 * Validates useVirtualizer integration with @tanstack/react-virtual.
 * Flow-layout spacer rows used (not position:absolute — C-18).
 * Group headers and footer rows rendered in virtualized window.
 *
 * EC-004 known limitation: group header/footer rows outside the virtual window
 * are removed from DOM as the user scrolls. This is the accepted trade-off for
 * large dataset performance (MergingGrid L-01 Known Limitation pattern).
 *
 * Expected: 5 department groups × ~200 rows each.
 * Scroll performance should remain smooth with virtualization active.
 */
export const VirtualizedGroupFooter = {
  args: virtualizedArgs,
};

// ---------------------------------------------------------------------------
// Story: CustomAggregation
// G-003: registerAggregationFn — custom 'ratio' fn (budget utilisation %).
// Validates AC-001 (register API) + AC-002 (registry lookup in resolvedColumns).
// ---------------------------------------------------------------------------

interface BudgetRow {
  dept: string;
  spent: number;
  budget: number;
}

const budgetData: BudgetRow[] = [
  { dept: 'Engineering', spent: 800, budget: 1000 },
  { dept: 'Engineering', spent: 600, budget: 1000 },
  { dept: 'Marketing',   spent: 300, budget:  500 },
  { dept: 'Marketing',   spent: 150, budget:  500 },
];

/**
 * Custom aggregation function: ratio = sum(spent) / sum(budget) × 100 (%).
 * Registered via registerAggregationFn before story args are consumed.
 */
const ratioFn: AggregationFn<BudgetRow> = (_columnId, leafRows) => {
  const totalSpent = leafRows.reduce((s, r) => s + (r.getValue('spent') as number), 0);
  const totalBudget = leafRows.reduce((s, r) => s + (r.getValue('budget') as number), 0);
  return totalBudget === 0 ? 0 : Math.round((totalSpent / totalBudget) * 100);
};

registerAggregationFn('ratio', ratioFn);

const customColumns: AggregationColumnDef<BudgetRow>[] = [
  {
    id: 'dept',
    header: 'Department',
    accessorKey: 'dept',
  },
  {
    id: 'spent',
    header: 'Spent ($)',
    accessorKey: 'spent',
    meta: { aggregationFn: 'sum' },
  },
  {
    id: 'budget',
    header: 'Budget ($)',
    accessorKey: 'budget',
    meta: { aggregationFn: 'sum' },
  },
  {
    id: 'ratio',
    header: 'Utilisation (%)',
    accessorKey: 'spent', // raw value per leaf row; aggregation uses ratioFn
    meta: { aggregationFn: 'ratio' }, // resolved via registry lookup (AC-001)
  },
];

const customArgs: AggregationGridProps<BudgetRow> = {
  data: budgetData,
  columns: customColumns,
  enableAggregation: true,
  grouping: ['dept'],
  expanded: true,
  showFooter: true,
};

/**
 * CustomAggregation: validates the registerAggregationFn / getAggregationFn
 * registry (G-003, AC-001 + AC-002).
 *
 * `ratioFn` is registered as 'ratio' before story mount.
 * The 3-branch resolver in resolvedColumns picks it up via getAggregationFn().
 *
 * Expected:
 * - Engineering: spent=1400, budget=2000, utilisation=70%
 * - Marketing: spent=450, budget=1000, utilisation=45%
 */
export const CustomAggregation = {
  args: customArgs,
};

// ---------------------------------------------------------------------------
// Story: GroupPanelWithSort
// G-004: GroupPanel drag-and-drop + group-level sorting + 1000+ rows + virtualization.
// Validates AC-001 (showGroupPanel), AC-003 (drag to group), AC-004 (enableGroupSort),
//         AC-007 (C-25 story requirement), EC-004 (virt + sort combo).
// ---------------------------------------------------------------------------

interface DeptRow {
  dept: string;
  subDept: string;
  name: string;
  value: number;
  score: number;
}

function generateGroupPanelData(count: number): DeptRow[] {
  const depts = ['Engineering', 'Marketing', 'Sales', 'Support', 'Finance'];
  const subDepts = ['Alpha', 'Beta', 'Gamma'];
  return Array.from({ length: count }, (_, i) => ({
    dept: depts[i % depts.length],
    subDept: subDepts[i % subDepts.length],
    name: `Employee-${i + 1}`,
    value: Math.round(Math.random() * 10000),
    score: Math.round(Math.random() * 100),
  }));
}

const groupPanelData = generateGroupPanelData(1200);

const groupPanelColumns: AggregationColumnDef<DeptRow>[] = [
  {
    id: 'dept',
    header: 'Department',
    accessorKey: 'dept',
  },
  {
    id: 'subDept',
    header: 'Sub-Department',
    accessorKey: 'subDept',
  },
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
  },
  {
    id: 'value',
    header: 'Value ($)',
    accessorKey: 'value',
    meta: { aggregationFn: 'sum' },
  },
  {
    id: 'score',
    header: 'Avg Score',
    accessorKey: 'score',
    meta: { aggregationFn: 'avg' },
  },
];

const groupPanelArgs: AggregationGridProps<DeptRow> = {
  data: groupPanelData,
  columns: groupPanelColumns,
  enableAggregation: true,
  grouping: ['dept'],
  expanded: true,
  showFooter: true,
  // G-004: GroupPanel + group-level sorting
  showGroupPanel: true,
  enableGroupSort: true,
  enableVirtualization: true,
  estimatedRowHeight: 40,
  virtualOverscan: 5,
};

/**
 * GroupPanelWithSort: 1200-row dataset with GroupPanel + group-level sorting + virtualization.
 *
 * Validates G-004 features (AC-001, AC-003, AC-004, AC-007, EC-004):
 * - GroupPanel bar visible above grid (showGroupPanel=true).
 * - Drag column header ('Sub-Department') to GroupPanel → adds 2nd grouping level.
 * - Click 'Value ($)' header to sort groups by sum (enableGroupSort=true).
 * - Virtualized render maintains sort + panel (EC-004).
 * - Chip X click removes 'dept' from grouping (EC-005 uncontrolled mode).
 *
 * Initial state: grouped by dept (5 groups × ~240 rows). Sort asc/desc on 'Avg Score'.
 */
export const GroupPanelWithSort = {
  args: groupPanelArgs,
};

// ---------------------------------------------------------------------------
// Story default export (CSF3 meta — type-only, no @storybook/react runtime)
// ---------------------------------------------------------------------------

export default {
  title: 'Pro/AggregationGrid',
  component: 'AggregationGrid', // string reference — avoids @storybook/react runtime import
  parameters: {
    docs: {
      description: {
        component:
          'Row grouping + aggregation Pro component. Activates TanStack getGroupedRowModel() and getExpandedRowModel(). Supports sum, avg, min, max, count via meta.aggregationFn. G-002: GroupRow/FooterRow components with synthetic footer interleaving + optional virtualization. G-004: GroupPanel drag-and-drop grouping bar + group-level sorting via getSortedRowModel().',
      },
    },
  },
};
