---
title: DataTable → Grid 이전 가이드
sidebar_position: 2
---

# DataTable → `<Grid mode="server">` 이전 가이드

`DataTable`은 TOMIS의 서버 페이지네이션 중심 범용 테이블 컴포넌트로,
8개 Grid 변형과 아키텍처가 다르다. `ColumnInfo`/`ButtonInfo`/`RowActionInfo`
prop 구조를 사용하며, `listAction(act, value)` 단일 콜백으로 모든 액션을 처리한다.

이 가이드는 `DataTable`을 `@tomis/grid-core`의 `<Grid mode="server">` 패턴으로
전환하는 5개 변환 항목을 다룬다.

---

## DataTable 원본 Props 요약

```tsx
// tw-framework-front/src/components/DataTable/data-table.tsx (실제 확인)
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

## 변환 항목 1: `ColumnInfo` → `ColumnDef` 매핑

### ColumnInfo 원본 타입 (실제 확인)

```ts
// tw-framework-front/src/components/DataTable/data-table-types.ts
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

### `createColumns()` 헬퍼 사용 (권장)

`@tomis/grid-core`의 `createColumns` 헬퍼는 `ColumnInfo` 배열을
`ColumnDef[]`로 자동 변환한다.

```tsx
import { Grid, createColumns } from '@tomis/grid-core';
import type { ColumnInfo } from '@tomis/grid-core'; // legacy alias — AC-005

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

### 타입별 직접 `ColumnDef` 정의 (세밀 제어)

```tsx
import { type ColumnDef } from '@tanstack/react-table';
import { Grid } from '@tomis/grid-core';

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

## 변환 항목 2: `pageingInfo` → `pagination` + `onPageChange`

### pageingInfo 원본 구조

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

### Grid pagination 매핑

```tsx
import { Grid } from '@tomis/grid-core';
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

## 변환 항목 3: `ButtonInfo` → toolbar slot 매핑

### ButtonInfo 원본 타입 (실제 확인)

```ts
// tw-framework-front/src/components/DataTable/data-table-types.ts
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

### toolbar slot 패턴

```tsx
import { Grid } from '@tomis/grid-core';

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

## 변환 항목 4: `RowActionInfo` → action cell renderer

### RowActionInfo 원본 타입 (실제 확인)

```ts
// tw-framework-front/src/components/DataTable/data-table-types.ts
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

### action cell renderer 패턴

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

## 변환 항목 5: `listAction(act, value)` → 개별 핸들러 분리

### 기존 패턴: 단일 콜백

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

### After: 개별 핸들러로 분리

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

## 전체 Before/After 비교

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
import { Grid, createColumns } from '@tomis/grid-core';

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

## 관련 문서

- [8개 Grid 변형 이전 가이드](./8-variant-table.md)
- [증분 이전 전략](./incremental-strategy.md)
- [Deprecated Alias 목록](./deprecated-aliases.md)
- [Live 데모](./live-demos.md)

> **사이드바 등록**: G-001(Docusaurus 설정) PR에서 `sidebars.ts`에 이 문서를 추가한다 (D4).
