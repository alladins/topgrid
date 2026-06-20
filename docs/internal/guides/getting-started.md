# topgrid 시작 가이드

topgrid 는 **TanStack Table v8 기반**의 React 그리드 라이브러리다. 핵심 그리드와 셀
렌더러, 정렬/필터, Excel/CSV/PDF export 를 제공하는 **MIT 4 패키지**를 무료로 쓸 수 있고,
다단 헤더·변경 추적·Excel-style 범위 편집 같은 고급 기능은 **Pro 패키지**로 확장한다.

- npm scope: `@topgrid/*`
- 권장 환경: React 18/19 + TypeScript + Tailwind CSS
- 정확한 export·시그니처 전체는 `api-reference.md` 참고

---

## 1. 어떤 패키지가 필요한가

| 사용 사례 | 권장 패키지 |
|---|---|
| 단순 데이터 표시 (정렬/필터 없음) | `@topgrid/grid-core` + `@topgrid/grid-renderers` |
| 정렬 + 필터 + 검색 | + `@topgrid/grid-features` |
| Excel/CSV/PDF 다운로드 | + `@topgrid/grid-export` |
| 다단 헤더 (월/일/요일 등) | + `@topgrid/grid-pro-header` (Pro) |
| 인라인 편집 + 변경 추적 + 저장 | + `@topgrid/grid-pro-tracking` (Pro) |
| Excel-style 범위 선택 + 키보드 | + `@topgrid/grid-pro-range` (Pro) |
| Master-Detail (펼치기) + 우클릭 메뉴 | + `@topgrid/grid-pro-master` (Pro) |
| Group / Sum / Avg 집계 | + `@topgrid/grid-pro-agg` (Pro) |
| 차트·시각화 (셀 스파크라인 ~ 엔터프라이즈 17종, React/Vue) | + 차트 패키지 → `charting.md` (Pro) |

- **MIT 4 패키지** (`grid-core` / `grid-renderers` / `grid-features` / `grid-export`)
  는 자유 사용.
- **Pro 패키지**는 라이선스 키가 필요하다. 미설정 시 그리드 우상단에
  `"Unlicensed @topgrid/grid"` watermark 가 표시되며, 기능 자체는 동작한다.

---

## 2. Hello World — 5분 안에 그리드 표시

### 2.1 설치

```bash
# Vite + React 프로젝트 가정
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install

# topgrid + peer deps
npm install @topgrid/grid-core @topgrid/grid-renderers \
            @tanstack/react-table @tanstack/react-virtual

# Tailwind CSS (renderer 의 className 사용을 위해)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Peer dependency:

```
react        ^18.0.0 || ^19.0.0
react-dom    ^18.0.0 || ^19.0.0
@tanstack/react-table    ^8.0.0
@tanstack/react-virtual  ^3.0.0   (가상화 사용 시)
```

### 2.2 Tailwind 설정

모든 셀 렌더러는 Tailwind className 으로만 스타일링된다. 패키지 안의 클래스가 빌드에
포함되도록 `content` 에 패키지 경로를 추가한다.

```javascript
// tailwind.config.js
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@topgrid/**/*.{js,mjs}',  // ★ topgrid 클래스 인식
  ],
  theme: { extend: {} },
  plugins: [],
};
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 2.3 첫 그리드

**권장: 고수준 `createColumns`** — TanStack `ColumnDef` 지식 없이 `{ id, name, type }` 로
선언하면, `type` 에 맞는 셀 렌더러가 자동 배선된다(facade `@topgrid/grid` 가 기본 렌더러를 wiring).

```tsx
import { Grid, createColumns } from '@topgrid/grid';   // facade = 렌더러 자동 배선

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

const columns = createColumns<User>([
  { id: 'name', name: '이름', type: 'text', width: '150' },
  { id: 'email', name: '이메일', type: 'text', width: '250' },
  { id: 'age', name: '나이', type: 'number', align: 'right', width: '80' },
]);

const data: User[] = [
  { id: 1, name: '김철수', email: 'chulsoo@example.com', age: 30 },
  { id: 2, name: '이영희', email: 'younghee@example.com', age: 28 },
  { id: 3, name: '박민수', email: 'minsoo@example.com', age: 35 },
];

export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">사용자 목록</h1>
      <Grid<User>
        data={data}
        columns={columns}
        getRowId={(u) => String(u.id)}   // ★ 안정적 행 식별 (아래 주의 참고)
        enableSort
      />
    </div>
  );
}
```

```bash
npm run dev
```

→ 브라우저에 그리드가 표시되고, 컬럼 헤더 클릭 시 정렬이 동작한다.

> **★ getRowId 를 지정하라.** 미지정 시 행 식별이 **배열 인덱스**로 떨어져,
> 선택(selection)·행 재정렬·셀 변경 플래시가 **정렬/필터 후 엉뚱한 행을 추적**한다(가장 흔한 함정).
> dev 모드에서 이 조건이면 경고가 출력된다. `getRowId={(row) => row.<고유키>}` 권장.
>
> **정렬 prop 은 `enableSort`** (`enableSorting` 아님 — TanStack 옵션명과 다름).
>
> **저수준 경로**: TanStack 의 `ColumnDef<User>[]` 를 `columns` 에 직접 넘겨 완전 제어할 수도 있다
> (accessorFn·커스텀 cell 등). 이때만 `@tanstack/react-table` 지식이 필요하다.

---

## 3. 점진적 확장

### 3.1 페이지네이션

`GridPagination` 은 그리드와 별도 컴포넌트로 배치한다.

```tsx
import { Grid, GridPagination, useGridState } from '@topgrid/grid-core';

function App() {
  const grid = useGridState<User>({
    initialPagination: { pageIndex: 0, pageSize: 10 },
  });

  return (
    <>
      <Grid<User>
        data={data}
        columns={columns}
        enablePagination
        state={{ pagination: grid.pagination }}
        onPaginationChange={grid.setPagination}
      />
      <GridPagination
        table={grid.table}
        mode="client"
        pageSizeOptions={[10, 20, 50]}
        showTotalCount
      />
    </>
  );
}
```

### 3.2 필터 + 검색 (`@topgrid/grid-features`)

```tsx
import { TextFilter, GlobalSearchInput, textFilterFn } from '@topgrid/grid-features';

const columns: ColumnDef<User>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        이름
        <TextFilter column={column} defaultOperator="contains" />
      </div>
    ),
    filterFn: textFilterFn,
  },
  // ...
];

// 그리드 위에 글로벌 검색
<GlobalSearchInput table={table} placeholder="전체 검색..." />
```

> 다중 정렬이 필요하면 `useMultiSort` 를 사용한다. 이 훅은 `@topgrid/grid-features`
> 에서 export 된다 (정렬 우선순위 배지 `SortBadge` 와 초기화 버튼 `SortClearButton`
> 은 `@topgrid/grid-core` 에 있다).

### 3.3 셀 렌더러 (`@topgrid/grid-renderers`)

```tsx
import { NumberCell, StatusBadgeCell, LinkCell } from '@topgrid/grid-renderers';

const columns: ColumnDef<User>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: '이름',
    cell: (info) => (
      <LinkCell value={String(info.getValue())} onClick={() => goToDetail(info.row.original.id)} />
    ),
  },
  {
    id: 'age',
    accessorKey: 'age',
    header: '나이',
    cell: (info) => <NumberCell value={info.getValue() as number} unit="세" />,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: '상태',
    cell: (info) => (
      <StatusBadgeCell
        value={info.getValue() as string}
        colorMap={{ active: 'green', inactive: 'gray', pending: 'yellow' }}
      />
    ),
  },
];
```

표시 셀 11종 + 인라인 편집 셀 `EditableCell` 의 prop 계약은 `api-reference.md` §2 참고.

### 3.4 Excel 내보내기 (`@topgrid/grid-export`)

```tsx
import { exportToExcel } from '@topgrid/grid-export';

<button onClick={() => exportToExcel(table, { fileName: '사용자목록.xlsx' })}>
  엑셀 다운로드
</button>
```

> **jspdf optional deps**: `exportToPdf` 는 jspdf 의 동적 import 4종
> (`fflate` / `html2canvas` / `dompurify` / `canvg`) 을 사용한다. Excel/CSV 만
> 쓰는데 빌드가 이 모듈을 못 찾으면 번들러 설정으로 stub 한다.
>
> ```javascript
> // next.config.ts 또는 vite.config.ts
> resolve: {
>   fallback: { fflate: false, html2canvas: false, dompurify: false, canvg: false },
> }
> ```

### 3.5 컬럼 고정 + 가상화 (대량 데이터)

```tsx
<Grid<User>
  data={data}  // 1만+ 행
  columns={columns}
  enableColumnPinning
  defaultColumnPinning={{ left: ['name'], right: ['actions'] }}
  enableVirtualization
  estimatedRowHeight={40}
  virtualOverscan={5}
/>
```

가상화는 `enableVirtualization` 과 `estimatedRowHeight` 를 함께 명시해야 적용된다.

---

## 4. Pro 기능

### 4.1 라이선스 키 설정 (`@topgrid/grid-license`)

```tsx
import { setLicenseKey } from '@topgrid/grid-license';

useEffect(() => {
  setLicenseKey(import.meta.env.VITE_TOPGRID_LICENSE_KEY ?? '');
}, []);
```

미설정/만료 시 그리드 우상단에 `"Unlicensed @topgrid/grid"` watermark 가 표시된다
(사용은 가능). 라이선스 상태는 `useLicenseStatus()` 로 조회한다.

### 4.2 다단 헤더 (`@topgrid/grid-pro-header`)

```tsx
import { createColumnGroup } from '@topgrid/grid-pro-header';

const columns: ColumnDef<User>[] = [
  createColumnGroup<User>({
    header: '개인 정보',
    columns: [
      { id: 'name', accessorKey: 'name', header: '이름' },
      { id: 'age', accessorKey: 'age', header: '나이' },
    ],
  }),
  createColumnGroup<User>({
    header: '연락처',
    columns: [
      { id: 'email', accessorKey: 'email', header: '이메일' },
      { id: 'phone', accessorKey: 'phone', header: '전화' },
    ],
  }),
];
```

### 4.3 인라인 편집 + 변경 추적 (`@topgrid/grid-pro-tracking`)

`ChangeTrackingGrid` 는 baseline 대비 추가/수정/삭제를 추적하고, ref 로 노출되는
`ChangeTrackingAPI` 로 변경분을 모아 저장한다.

```tsx
import { ChangeTrackingGrid, type ChangeTrackingAPI } from '@topgrid/grid-pro-tracking';
import { EditableCell } from '@topgrid/grid-renderers';
import { useRef, useState } from 'react';

function EditablePage() {
  const trackingRef = useRef<ChangeTrackingAPI<User>>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);

  const editableColumns: ColumnDef<User>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: '이름',
      cell: (info) => {
        const isEditing =
          editingCell?.rowId === info.row.id && editingCell?.colId === 'name';
        return (
          <EditableCell
            value={String(info.getValue() ?? '')}
            editType="text"
            isEditing={isEditing}
            onStartEdit={() => setEditingCell({ rowId: info.row.id, colId: 'name' })}
            onCommit={(newValue) => {
              trackingRef.current?.updateRow(info.row.id, { name: newValue });
              setEditingCell(null);
            }}
            onCancel={() => setEditingCell(null)}
          />
        );
      },
    },
    // ...
  ];

  const handleSave = async () => {
    const cs = trackingRef.current?.getChangeSet();
    if (!cs) return;
    await api.batchSave({ added: cs.added, updated: cs.updated, removed: cs.removed });
    trackingRef.current?.resetChanges();
  };

  return (
    <>
      <ChangeTrackingGrid<User>
        ref={trackingRef}
        data={data}
        columns={editableColumns}
        getRowId={(row) => String(row.id)}
      />
      <button onClick={handleSave}>저장</button>
      <button onClick={() => trackingRef.current?.resetChanges()}>취소</button>
    </>
  );
}
```

- 변경된 행은 색상으로 구분된다: 추가=green / 수정=yellow / 삭제=red.
- `resetChanges()` 는 baseline 으로 복원한다. 저장 직후 화면 데이터도 갱신하려면
  데이터 state 를 함께 갱신한 뒤 `resetChanges()` 를 호출한다.

> **첫 글자 유실 방지**: 키 입력으로 편집을 시작할 때 첫 글자가 사라지지 않도록
> `EditableCell` 에 `initialDraft` prop 으로 첫 글자를 전달한다.

### 4.4 Excel-style 범위 선택 + 키보드 (`@topgrid/grid-pro-range`)

가장 간단한 길은 all-in-one `RangeSelectGrid` 다.

```tsx
import { RangeSelectGrid } from '@topgrid/grid-pro-range';

<RangeSelectGrid<User>
  data={data}
  columns={columns}
  enableClipboard       // Ctrl+C/V
  enableKeyboardNav     // 방향키 + Tab + Enter
  enableDragFill        // Excel-style 채우기 핸들
  onCellChange={(rowIdx, colIdx, newValue) => {
    // 데이터 업데이트
  }}
/>
```

저수준 제어가 필요하면 `useCellRange` (드래그 범위) / `useKeyboardNav` (방향키·Tab)
/ `useClipboard` (Ctrl+C/V) / `useKeyboardEdit` (Delete·일괄 입력) 훅을 직접 조합한다.
시그니처는 `api-reference.md` §6 참고.

---

## 5. 자주 사용하는 패턴

### 5.1 서버 사이드 페이지네이션

```tsx
<GridPagination
  table={table}
  mode="server"  // ★ 서버 모드
  totalCount={data?.totalCount ?? 0}
  pageIndex={page}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>
```

### 5.2 URL 동기화 + localStorage 영속화

```tsx
import { useGridState, useUrlSync, useStoragePersist } from '@topgrid/grid-core';

const grid = useGridState<User>({});
useUrlSync(grid, { paramPrefix: 'users_' });       // ?users_sort=name&users_page=2
useStoragePersist(grid, { storageKey: 'my-grid' }); // 사용자 설정 유지
```

### 5.3 행 클릭 → 상세 이동

```tsx
<Grid<User> data={data} columns={columns} onRowClick={(row) => router.push(`/users/${row.id}`)} />
```

### 5.4 셀별 조건부 색상

```tsx
<Grid<User>
  data={data}
  columns={columns}
  cellClassName={(cell) => {
    if (cell.column.id === 'age' && (cell.getValue() as number) >= 60) {
      return 'bg-red-50 text-red-700';
    }
    return '';
  }}
/>
```

### 5.5 셀 이벤트 — TanStack 타입 없이 (`toGridCell`)

`onCellClick` / `onCellKeyDown` / `getCellTooltip` 의 `cell` 인자는 TanStack 의 `Cell` 객체다
(`cell.getValue()`, `cell.column.id`, `cell.row.original`…). TanStack API 를 모르고도 셀 데이터를
읽으려면 **`toGridCell`** 어댑터로 깨끗한 `{ rowId, columnId, value, row }` 로 변환한다(ADR-006).

```tsx
import { Grid, toGridCell } from '@topgrid/grid';

<Grid<User>
  data={data}
  columns={columns}
  onCellClick={(cell) => {
    const c = toGridCell<User>(cell);   // { rowId, columnId, value, row }
    console.log(c.columnId, c.value, c.row.name);   // TanStack 메서드 호출 불필요
  }}
  getCellTooltip={(cell) => {
    const c = toGridCell<User>(cell);
    return c.columnId === 'email' ? `메일 보내기: ${c.value}` : null;
  }}
/>
```

- `c.value` = 셀 값(= `cell.getValue()`), `c.row` = 원본 행 객체(= `cell.row.original`),
  `c.rowId` = 안정적 행 id(= `getRowId` 결과; §2.3 참고).
- `cellClassName` 의 `cell` 에도 동일하게 쓸 수 있다(`toGridCell(cell).value` 등).

> 기존 콜백 시그니처는 그대로 TanStack 타입을 유지한다(하위호환). `toGridCell` 은 **opt-in 다리**이며,
> grid-core **1.0** 에서 콜백 인자가 위 clean 타입으로 전환될 예정이다.

### 5.6 floating 필터 직접 그리기 — `toGridFilterColumn` (F-D)

`renderFloatingFilter` 는 TanStack `Column` 을 넘긴다(`column.getFilterValue()`/`setFilterValue()`).
`toGridFilterColumn(column)` 으로 `{ id, value, setValue }` 만 받아 TanStack API 없이 동기화한다.

```tsx
import { Grid, toGridFilterColumn } from '@topgrid/grid';

<Grid<User>
  data={data}
  columns={columns}
  enableFilter
  renderFloatingFilter={(column) => {
    const f = toGridFilterColumn(column);          // { id, value, setValue }
    return (
      <input
        value={(f.value as string) ?? ''}
        onChange={(e) => f.setValue(e.target.value)}  // getFilterValue/setFilterValue 직접 호출 불필요
        placeholder={`${f.id} 필터`}
      />
    );
  }}
/>
```

---

## 6. 기존 그리드에서 마이그레이션

Wijmo / AG Grid 등 기존 그리드 솔루션의 사용처를 topgrid 로 옮기는 경우, 컬럼 정의와
주요 prop 이 1:1 또는 유사하게 대응된다. 대표 매핑:

| 기존 (AG Grid) | topgrid |
|---|---|
| `<AgGridReact rowData={...} columnDefs={...} />` | `<Grid<TData> data={...} columns={...} />` |
| `columnDefs: ColDef[]` | `columns: ColumnDef<TData>[]` |
| `{ field: 'x' }` | `{ id: 'x', accessorKey: 'x' }` |
| `{ headerName: '제목' }` | `{ header: '제목' }` |
| `valueFormatter: (p) => fmt(p.value)` | `cell: (info) => fmt(info.getValue())` |
| `cellStyle: { textAlign: 'center' }` | `meta: { align: 'center' }` + `cellClassName` |
| `pagination: true` | 별도 `<GridPagination mode="client" />` 컴포넌트 |
| `rowSelection="single"` | `enableRowSelection` + TanStack `rowSelection` state |
| `ag-theme-*` CSS class | Tailwind 기반 — 별도 CSS import 불필요 |

| 기존 (Wijmo) | topgrid |
|---|---|
| `cellEditEnded` | `<EditableCell onCommit={...}>` |
| `formatItem` (셀 배경) | `cellClassName={(cell) => ...}` |
| `allowMerging="ColumnHeaders"` | `createColumnGroup` (다단 헤더) |
| `frozenColumns={n}` | `enableColumnPinning` + `defaultColumnPinning.left` |
| `excelExport` | `exportToExcel(table, options)` 또는 `exportRowsToExcel(...)` |

권장 전략은 **페이지 단위 점진적 마이그레이션**이다. 사용처가 공통 wrapper 컴포넌트를
거치는 경우, wrapper 내부만 topgrid 기반으로 교체하면 사용처 코드 변경 없이 일괄
적용할 수도 있으나, 모든 사용처가 동시에 영향을 받으므로 시각 회귀 테스트가 필요하다.

---

## 7. 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| 그리드가 빈 화면 | data 없음 또는 columns 누락 | 둘 다 전달했는지 확인 |
| 스타일 깨짐 (Tailwind 클래스 미적용) | `tailwind.config.js` content 누락 | `./node_modules/@topgrid/**/*.{js,mjs}` 추가 (§2.2) |
| `Module not found: @tanstack/table-core` | peer dep 미설치 | `@tanstack/react-table` `@tanstack/react-virtual` 설치 |
| `Module not found: fflate / html2canvas / ...` | grid-export 의 jspdf optional deps | 번들러 `resolve.fallback` 으로 stub (§3.4) |
| 컬럼 정렬 안 됨 | `enableSorting` 누락 | `<Grid enableSorting>` 추가 |
| 가상화 적용 안 됨 | `enableVirtualization` 또는 `estimatedRowHeight` 부재 | 둘 다 명시 (§3.5) |
| 셀 편집 시 첫 글자 손실 | `initialDraft` 미전달 | `EditableCell` 에 `initialDraft` 전달 (§4.3) |
| Pro watermark 항상 표시 | 라이선스 키 미설정/무효 | `setLicenseKey()` 호출 + 키 유효성 확인 |

---

## 8. 번들 최적화

```tsx
// ✅ 권장 — 개별 패키지 import (tree-shaking)
import { Grid } from '@topgrid/grid-core';
import { EditableCell } from '@topgrid/grid-renderers';

// ❌ 비권장 — meta facade 는 전체 번들 유입 가능
import { Grid, EditableCell } from '@topgrid/grid';
```

---

## 9. 다음 단계

| 목적 | 문서 |
|---|---|
| 패키지별 정확한 export + 시그니처 전체 | `api-reference.md` |
| 셀 렌더러 11종 + EditableCell 상세 | `modules/renderers.md` |
| **Next.js (App/Pages Router) · SSR 연동** | `nextjs-ssr.md` |
| **차트 (스파크라인 ~ 엔터프라이즈 17종, React/Vue)** | `charting.md` |
| 모듈별 설계/결정 | `modules/mod-grid-*.md` |
