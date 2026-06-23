---
title: DataTable → Grid Migration Guide
sidebar_position: 2
---

# DataTable → `<Grid mode="server">` Migration Guide

:::warning Current API mismatch — rewrite pending
The `<Grid mode="client" | "server">` examples in this guide **do not match the current API**. `<Grid>` currently has no
top-level `mode` prop (`pagination`/`rowSelection` are nested options). On the server side, the current pattern uses flags such as
`manualPagination`, or the `useServerSideData(datasource)` → `<Grid columns {...gridProps} />` pattern from `@topgrid/grid-pro-serverside`.
**This guide is scheduled to be rewritten around the current client/server patterns** (do not take the `mode=` examples below at face value).
:::

`DataTable` is the legacy general-purpose, server-pagination-centric table component, and its architecture
differs from the 8 Grid variants. It uses the `ColumnInfo`/`ButtonInfo`/`RowActionInfo`
prop structure and handles every action through a single `listAction(act, value)` callback.

This guide covers the 5 conversion items for migrating `DataTable` to the
`<Grid mode="server">` pattern from `@topgrid/grid-core`.

---

## Summary of the Original DataTable Props

```tsx
// legacy data-table.tsx
interface DataTableProps<TData> {
  data: TData[];
  pageingInfo: {          // 오타 유지 (레거시)
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    pageCount: number;
    pageNo: number;
    pageSize: number;
    totalCount: number;
  };
  columnInfos: ColumnInfo[];
  buttonInfo?: ButtonInfo;
  rowActionInfo?: RowActionInfo;
  additionalRowActions?: AdditionalRowActionInfo[];
  listCondition?: { orderItem?: string; orderDir?: string; pageSize?: number; pageNo?: number };
  height?: number;
  listAction: (act: string, value: string) => void;   // 단일 액션 콜백
  onRowSelectionChange?: (values: string) => void;
  permissions: Permissions;
  hasChildAction?: boolean;
  buttonChildren?: React.ReactNode;
  isLoading?: boolean;
}
```

---

## Conversion item 1: `ColumnInfo` → `ColumnDef` mapping

### Original ColumnInfo type (verified)

```ts
// legacy data-table-types.ts
export interface ColumnInfo {
  id: string;
  type: string;      // 'text' | 'number' | 'date' | 'custom' | ...
  align: string;     // 'left' | 'center' | 'right'
  name: string;      // 헤더 표시 이름
  width: string;     // 픽셀 문자열, 예: '120'
  visibility?: boolean;
  etc?: string;      // 추가 메타
}
```

### Using the `createColumns()` helper (recommended)

The `createColumns` helper from `@topgrid/grid-core` automatically converts a `ColumnInfo` array
into a `ColumnDef[]`.

```tsx
import { Grid, createColumns } from '@topgrid/grid-core';
import type { ColumnInfo } from '@topgrid/grid-core'; // legacy alias — AC-005

// Before
const columnInfos: ColumnInfo[] = [
  { id: 'empNo',   type: 'text',   align: 'center', name: '사원번호', width: '100' },
  { id: 'empName', type: 'text',   align: 'left',   name: '성명',    width: '120' },
  { id: 'salary',  type: 'number', align: 'right',  name: '급여',    width: '150' },
  { id: 'hireDate',type: 'date',   align: 'center', name: '입사일',  width: '120' },
];
<DataTable columnInfos={columnInfos} ... />

// After
const columns = createColumns(columnInfos);
<Grid mode="server" columns={columns} ... />
```

### Defining `ColumnDef` directly per type (fine-grained control)

```tsx
import { type ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';

type Employee = { empNo: string; empName: string; salary: number; hireDate: string };

const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: 'empNo',
    header: '사원번호',
    size: 100,
    meta: { align: 'center', type: 'text' },
  },
  {
    accessorKey: 'salary',
    header: '급여',
    size: 150,
    meta: { align: 'right', type: 'number' },
    cell: ({ getValue }) =>
      new Intl.NumberFormat('ko-KR').format(getValue() as number),
  },
  // EC-02: type: 'custom' — customFormatter 대신 ColumnDef.cell 사용
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => <StatusBadge value={row.original.status} />,
  },
];
```

---

## Conversion item 2: `pageingInfo` → `pagination` + `onPageChange`

### Original pageingInfo structure

```ts
pageingInfo: {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageCount: number;
  pageNo: number;       // 1-based
  pageSize: number;
  totalCount: number;
}
```

### Mapping to Grid pagination

```tsx
import { Grid } from '@topgrid/grid-core';
import { useState } from 'react';

function MyPage() {
  const [pageIndex, setPageIndex] = useState(0); // 0-based

  // API 응답 변환 (pageNo 1-based → pageIndex 0-based)
  const pagination = {
    pageIndex: pageingInfo.pageNo - 1,
    pageSize: pageingInfo.pageSize,
    pageCount: pageingInfo.pageCount,
  };

  return (
    <Grid
      mode="server"
      manualPagination
      data={data}
      columns={columns}
      pagination={pagination}
      onPageChange={(newPageIndex, newPageSize) => {
        // listAction 대체: 직접 API 호출
        fetchData({ pageNo: newPageIndex + 1, pageSize: newPageSize });
      }}
    />
  );
}
```

---

## Conversion item 3: `ButtonInfo` → toolbar slot mapping

### Original ButtonInfo type (verified)

```ts
// legacy data-table-types.ts
export interface ButtonInfo {
  downloadEnable: boolean;
  downloadTitle: string;
  downloadAction: string;       // 'downloadListData'
  deleteListDataEnable: boolean;
  deleteListDataTitle: string;
  deleteListDataAction: string; // 'deleteListData'
  addNewEnable: boolean;
  addNewTtile: string;          // 오타 유지 (레거시)
  addNewAction: string;         // 'addNewData'
  searchEnable: boolean;
  searchTitle: string;
  searchAction: string;         // 'searchDataList'
}
```

### toolbar slot pattern

```tsx
import { Grid } from '@topgrid/grid-core';

// Before
const buttonInfo: ButtonInfo = {
  downloadEnable: true, downloadTitle: '다운로드', downloadAction: 'downloadListData',
  addNewEnable: true, addNewTtile: '신규 등록', addNewAction: 'addNewData',
  // ...
};
<DataTable buttonInfo={buttonInfo} listAction={handleAction} ... />

// After — toolbar slot (권한은 상위에서 조건부 렌더링)
<Grid
  mode="server"
  data={data}
  columns={columns}
  toolbar={
    <div className="flex gap-2">
      {buttonInfo.downloadEnable && (
        <button onClick={() => handleDownload()}>
          {buttonInfo.downloadTitle}
        </button>
      )}
      {buttonInfo.addNewEnable && (
        <button onClick={() => handleAddNew()}>
          {buttonInfo.addNewTtile}
        </button>
      )}
    </div>
  }
/>
```

---

## Conversion item 4: `RowActionInfo` → action cell renderer

### Original RowActionInfo type (verified)

```ts
// legacy data-table-types.ts
export interface RowActionInfo {
  editEnable: boolean;
  editTitle: string;
  editAction: string;          // 'editData'
  deleteDataEnable: boolean;
  deleteDataTitle: string;
  deleteDataAction: string;    // 'deleteData'
  addNewEnable: boolean;
  addNewTtile: string;         // 오타 유지
  addNewAction: string;        // 'addNewData'
  lowerAddNewEnable: boolean;
  lowerAddNewTitle: string;
  lowerAddNewAction: string;   // 'addChildNewData'
}
```

### action cell renderer pattern

```tsx
import { type ColumnDef } from '@tanstack/react-table';

function createActionColumn<TData>(
  rowActionInfo: RowActionInfo,
  onAction: (act: string, row: TData) => void,
): ColumnDef<TData> {
  return {
    id: '_actions',
    header: '관리',
    size: 120,
    cell: ({ row }) => (
      <div className="flex gap-1">
        {rowActionInfo.editEnable && (
          <button
            className="text-xs px-2 py-1 text-blue-600 hover:underline"
            onClick={() => onAction(rowActionInfo.editAction, row.original)}
          >
            {rowActionInfo.editTitle}
          </button>
        )}
        {rowActionInfo.deleteDataEnable && (
          <button
            className="text-xs px-2 py-1 text-red-600 hover:underline"
            onClick={() => onAction(rowActionInfo.deleteDataAction, row.original)}
          >
            {rowActionInfo.deleteDataTitle}
          </button>
        )}
      </div>
    ),
  };
}

// 사용
const columns = [
  ...createColumns(columnInfos),
  createActionColumn(rowActionInfo, handleRowAction),
];
```

---

## Conversion item 5: `listAction(act, value)` → splitting into individual handlers

### Existing pattern: a single callback

```tsx
// Before — 모든 액션이 하나의 콜백으로 처리됨
const handleAction = (act: string, value: string) => {
  switch (act) {
    case 'searchDataList':  fetchList(value); break;
    case 'downloadListData': downloadExcel(); break;
    case 'addNewData':      openAddModal();  break;
    case 'editData':        openEditModal(value); break;
    case 'deleteData':      confirmDelete(value); break;
    default: break;
  }
};

<DataTable listAction={handleAction} ... />
```

### After: split into individual handlers

```tsx
// After — 각 액션을 명시적 핸들러로 분리
function MyPage() {
  const handleSearch = (keyword: string) => fetchList(keyword);
  const handleDownload = () => downloadExcel(data);
  const handleAddNew = () => openAddModal();
  const handleEdit = (row: Employee) => openEditModal(row);
  const handleDelete = (row: Employee) => confirmDelete(row);

  return (
    <Grid
      mode="server"
      manualPagination
      data={data}
      columns={[
        ...createColumns(columnInfos),
        createActionColumn(rowActionInfo, (act, row) => {
          if (act === 'editData') handleEdit(row);
          if (act === 'deleteData') handleDelete(row);
        }),
      ]}
      toolbar={
        <div className="flex gap-2">
          <button onClick={handleSearch}>검색</button>
          <button onClick={handleDownload}>다운로드</button>
          <button onClick={handleAddNew}>신규 등록</button>
        </div>
      }
      pagination={pagination}
      onPageChange={(idx, size) => fetchList({ pageNo: idx + 1, pageSize: size })}
    />
  );
}
```

---

## Full Before/After comparison

```tsx
// ===== BEFORE (DataTable) =====
import { DataTable } from '@/components/DataTable/data-table';

<DataTable
  data={empList}
  pageingInfo={pageingInfo}
  columnInfos={[
    { id: 'empNo', type: 'text', align: 'center', name: '사원번호', width: '100' },
    { id: 'empName', type: 'text', align: 'left', name: '성명', width: '120' },
  ]}
  buttonInfo={ButtonInfoInitialize}
  rowActionInfo={RowActionInfoInitialize}
  listAction={handleAction}
  permissions={permissions}
  isLoading={isLoading}
/>

// ===== AFTER (Grid) =====
import { Grid, createColumns } from '@topgrid/grid-core';

const columns = createColumns([
  { id: 'empNo', type: 'text', align: 'center', name: '사원번호', width: '100' },
  { id: 'empName', type: 'text', align: 'left', name: '성명', width: '120' },
]);

<Grid
  mode="server"
  manualPagination
  data={empList}
  columns={columns}
  pagination={{
    pageIndex: pageingInfo.pageNo - 1,
    pageSize: pageingInfo.pageSize,
    pageCount: pageingInfo.pageCount,
  }}
  onPageChange={(idx, size) => fetchEmpList({ pageNo: idx + 1, pageSize: size })}
  loading={isLoading}
  toolbar={<GridToolbarButtons onAdd={handleAdd} onDownload={handleDownload} />}
/>
```

---

## Related documents

- [8 Grid Variants Migration Guide](./8-variant-table.md)
- [Incremental Migration Strategy](./incremental-strategy.md)
- [Deprecated Alias List](./deprecated-aliases.md)
- [Live Demos](./live-demos.md)

> **Sidebar registration**: Add this document to `sidebars.ts` in the G-001 (Docusaurus setup) PR (D4).
