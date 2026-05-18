---
title: Live 데모
sidebar_position: 4
---

# Live 데모 — @topgrid/grid-core 이전 결과

이 페이지에서 `@topgrid/grid-core`의 주요 Grid 패턴을 직접 실행해볼 수 있다.
3개의 StackBlitz 임베드를 제공하며, CSP 차단 환경을 위한 정적 코드 블록 fallback도 포함한다.

---

## Demo 1: Basic Grid (BaseGrid 이전 결과)

`BaseGrid` → `<Grid mode="client">` 이전 결과 데모.
클라이언트 페이지네이션, 다중 행 선택, 정렬이 포함된다.

<iframe
  src="https://stackblitz.com/edit/tomis-grid-basic?embed=1&file=src/App.tsx&hideNavigation=1"
  style={{ width: '100%', height: '520px', border: '0', borderRadius: '8px' }}
  title="tomis-grid-basic"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
/>

<details>
<summary>소스 코드 전체 보기 (CSP 차단 환경용)</summary>

```tsx
// src/App.tsx — tomis-grid-basic
import { Grid } from '@topgrid/grid-core';
import { type ColumnDef } from '@tanstack/react-table';

type Employee = {
  id: string;
  name: string;
  department: string;
  salary: number;
};

const data: Employee[] = [
  { id: 'E001', name: '김철수', department: '개발팀', salary: 5500000 },
  { id: 'E002', name: '이영희', department: '인사팀', salary: 4800000 },
  { id: 'E003', name: '박민준', department: '회계팀', salary: 5200000 },
  { id: 'E004', name: '정수연', department: '개발팀', salary: 6000000 },
  { id: 'E005', name: '최동현', department: '영업팀', salary: 4500000 },
];

const columns: ColumnDef<Employee>[] = [
  { accessorKey: 'id',         header: '사원번호', size: 100 },
  { accessorKey: 'name',       header: '성명',     size: 120 },
  { accessorKey: 'department', header: '부서',     size: 120 },
  {
    accessorKey: 'salary',
    header: '급여',
    size: 150,
    cell: ({ getValue }) =>
      new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
        .format(getValue() as number),
  },
];

export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">직원 목록</h1>
      {/*
       * Before (BaseGrid):
       * <BaseGrid data={data} columns={columns} pagination={{ pageSize: 3 }}
       *           rowSelection={{ mode: 'multi' }} />
       *
       * After (Grid mode="client"):
       */}
      <Grid
        mode="client"
        data={data}
        columns={columns}
        pagination={{ pageSize: 3 }}
        rowSelection={{ mode: 'multi' }}
        emptyText="조회 결과가 없습니다."
      />
    </div>
  );
}
```

</details>

---

## Demo 2: Virtualized Grid (VirtualGrid 이전 결과)

`VirtualGrid` → `<Grid enableVirtualization>` 이전 결과 데모.
1,000행 데이터를 가상화로 렌더링해 스크롤 성능을 보여준다.

<iframe
  src="https://stackblitz.com/edit/tomis-grid-virtualized?embed=1&file=src/App.tsx&hideNavigation=1"
  style={{ width: '100%', height: '580px', border: '0', borderRadius: '8px' }}
  title="tomis-grid-virtualized"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
/>

<details>
<summary>소스 코드 전체 보기 (CSP 차단 환경용)</summary>

```tsx
// src/App.tsx — tomis-grid-virtualized
import { Grid } from '@topgrid/grid-core';
import { type ColumnDef } from '@tanstack/react-table';

type Row = { id: number; col1: string; col2: string; col3: number };

// 1,000행 데이터 생성
const data: Row[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  col1: `항목_${i + 1}`,
  col2: `카테고리_${(i % 10) + 1}`,
  col3: Math.floor(Math.random() * 100000),
}));

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'id',   header: '#',    size: 60  },
  { accessorKey: 'col1', header: '항목', size: 200 },
  { accessorKey: 'col2', header: '분류', size: 150 },
  {
    accessorKey: 'col3',
    header: '값',
    size: 120,
    cell: ({ getValue }) =>
      new Intl.NumberFormat('ko-KR').format(getValue() as number),
  },
];

export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">대용량 데이터 가상화 (1,000행)</h1>
      <p className="text-sm text-gray-500 mb-4">
        스크롤해도 DOM 요소가 재사용됩니다 (가상화).
      </p>
      {/*
       * Before (VirtualGrid):
       * <VirtualGrid data={data} columns={columns}
       *              rowHeight={40} containerHeight={500} />
       *
       * After (Grid enableVirtualization):
       */}
      <Grid
        mode="client"
        enableVirtualization
        data={data}
        columns={columns}
        rowHeight={40}
        containerHeight={500}
        emptyText="데이터가 없습니다."
      />
    </div>
  );
}
```

</details>

---

## Demo 3: Change Tracking Grid (ChangeTrackingGrid compat → hook 패턴)

`ChangeTrackingGrid` compat shim API와 `useChangeTracking` hook 직접 사용 패턴 비교 데모.
행 추가/수정/삭제 상태를 추적하고 변경 목록을 조회한다.

<iframe
  src="https://stackblitz.com/edit/tomis-grid-change-tracking?embed=1&file=src/App.tsx&hideNavigation=1"
  style={{ width: '100%', height: '600px', border: '0', borderRadius: '8px' }}
  title="tomis-grid-change-tracking"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
/>

<details>
<summary>소스 코드 전체 보기 (CSP 차단 환경용)</summary>

```tsx
// src/App.tsx — tomis-grid-change-tracking
// 두 가지 패턴을 탭으로 비교한다:
// (A) compat shim 그대로 사용 — 기존 코드 변경 없음
// (B) useChangeTracking hook 직접 사용 — 더 세밀한 제어

import { useRef, useState } from 'react';
import { Grid } from '@topgrid/grid-core';
import { ChangeTrackingGrid, type ChangeTrackingHandle } from '../Grid/ChangeTrackingGrid';
import { useChangeTracking } from '@topgrid/grid-pro-tracking';
import { type ColumnDef } from '@tanstack/react-table';

type Product = { id: string; name: string; price: number; stock: number };

const initialData: Product[] = [
  { id: 'P001', name: '노트북',   price: 1200000, stock: 50 },
  { id: 'P002', name: '마우스',   price: 35000,   stock: 200 },
  { id: 'P003', name: '키보드',   price: 120000,  stock: 150 },
];

const columns: ColumnDef<Product>[] = [
  { accessorKey: 'id',    header: '상품코드', size: 100 },
  { accessorKey: 'name',  header: '상품명',   size: 180 },
  { accessorKey: 'price', header: '단가',     size: 120 },
  { accessorKey: 'stock', header: '재고',     size: 100 },
];

// ─── 패턴 A: compat shim 사용 (기존 코드 — 변경 없음) ───────────────────────
function PatternA() {
  const gridRef = useRef<ChangeTrackingHandle<Product>>(null);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          className="px-3 py-1 text-sm bg-green-500 text-white rounded"
          onClick={() =>
            gridRef.current?.addRow({ id: `P${Date.now()}`, name: '신규상품', price: 0, stock: 0 })
          }
        >
          행 추가
        </button>
        <button
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
          onClick={() => {
            const changes = gridRef.current?.getChanges();
            alert(JSON.stringify(changes, null, 2));
          }}
        >
          변경 조회
        </button>
        <button
          className="px-3 py-1 text-sm bg-gray-500 text-white rounded"
          onClick={() => gridRef.current?.resetChanges()}
        >
          초기화
        </button>
      </div>
      {/* ChangeTrackingGrid shim — ref API 100% 보존 */}
      <ChangeTrackingGrid ref={gridRef} initialData={initialData} columns={columns} />
    </div>
  );
}

// ─── 패턴 B: useChangeTracking hook 직접 사용 (더 세밀한 제어) ───────────────
function PatternB() {
  const tracking = useChangeTracking<Product>({
    data: initialData,
    rowKey: 'id',
  });

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          className="px-3 py-1 text-sm bg-green-500 text-white rounded"
          onClick={() =>
            tracking.addRow({ id: `P${Date.now()}`, name: '신규상품', price: 0, stock: 0 })
          }
        >
          행 추가
        </button>
        <button
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
          onClick={() => alert(JSON.stringify(tracking.getChanges(), null, 2))}
        >
          변경 조회
        </button>
        <button
          className="px-3 py-1 text-sm bg-gray-500 text-white rounded"
          onClick={() => tracking.resetChanges()}
        >
          초기화
        </button>
      </div>
      <Grid
        mode="client"
        data={tracking.rows}
        columns={columns}
        onCellCommit={(rowIndex, colId, value) =>
          tracking.updateRow(rowIndex, colId, value)
        }
      />
      {/* 변경 요약 */}
      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
        추가: {tracking.getChanges().added.length}건 |
        수정: {tracking.getChanges().edited.length}건 |
        삭제: {tracking.getChanges().deleted.length}건
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<'A' | 'B'>('A');

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">변경 추적 Grid</h1>
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded ${tab === 'A' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('A')}
        >
          A: compat shim (기존 코드 유지)
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === 'B' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('B')}
        >
          B: useChangeTracking hook (직접 사용)
        </button>
      </div>
      {tab === 'A' ? <PatternA /> : <PatternB />}
    </div>
  );
}
```

</details>

---

## 로컬 실행 방법

StackBlitz 임베드가 로드되지 않으면 위 fallback 코드를 로컬에서 실행할 수 있다.

```bash
# 모노레포 클론 후
cd topvel-grid-monorepo
pnpm install

# 개발 서버 (apps/docs)
pnpm --filter docs dev

# 또는 개별 패키지 개발
pnpm --filter @topgrid/grid-core dev
```

---

## 관련 문서

- [8개 Grid 변형 이전 가이드](./8-variant-table.md)
- [DataTable 이전 가이드](./dataTable-migration.md)
- [증분 이전 전략](./incremental-strategy.md)
- [Deprecated Alias 목록](./deprecated-aliases.md)

> **사이드바 등록**: G-001(Docusaurus 설정) PR에서 `sidebars.ts`에 이 문서를 추가한다 (D4).
