---
title: 예제
sidebar_position: 4
---

# 예제 — `@topgrid/grid` 사용 패턴

자주 쓰는 Grid 패턴 3가지를 실제 동작하는 코드로 정리했다. 그대로 복사해
React 프로젝트(`@topgrid/grid-core` 설치)에 붙여 실행할 수 있다.

```bash
pnpm add @topgrid/grid-core @tanstack/react-table
# 변경 추적 예제는 추가로:
pnpm add @topgrid/grid-pro-tracking @topgrid/grid-license
```

---

## 예제 1: 기본 Grid

클라이언트 페이지네이션 + 다중 행 선택 + 정렬.

```tsx
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
    <Grid
      data={data}
      columns={columns}
      enableSort
      enablePagination
      pagination={{ pageSize: 3 }}
      rowSelection="multi"
      emptyText="조회 결과가 없습니다."
    />
  );
}
```

---

## 예제 2: 가상화 Grid (대용량)

`enableVirtualization` 하나로 대용량 행을 가상화 렌더링한다(보이는 행만 DOM 유지).

```tsx
import { Grid } from '@topgrid/grid-core';
import { type ColumnDef } from '@tanstack/react-table';

type Row = { id: number; item: string; category: string; value: number };

// 1,000행 생성
const data: Row[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  item: `항목_${i + 1}`,
  category: `분류_${(i % 10) + 1}`,
  value: (i * 137) % 100000,
}));

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'id',       header: '#',    size: 60  },
  { accessorKey: 'item',     header: '항목', size: 200 },
  { accessorKey: 'category', header: '분류', size: 150 },
  {
    accessorKey: 'value',
    header: '값',
    size: 120,
    cell: ({ getValue }) =>
      new Intl.NumberFormat('ko-KR').format(getValue() as number),
  },
];

export default function App() {
  return (
    <Grid
      data={data}
      columns={columns}
      enableVirtualization
      enableSort
      emptyText="데이터가 없습니다."
    />
  );
}
```

---

## 예제 3: 변경 추적 (`useChangeTracking`)

행 단위 추가/수정/삭제를 추적하고, 서버 전송용 변경 집합(`getChangeSet`)을 만든다.
Pro 패키지이므로 라이선스 키 설정이 필요하다(미설정 시 워터마크 표시).

```tsx
import { Grid } from '@topgrid/grid-core';
import { useChangeTracking } from '@topgrid/grid-pro-tracking';
import { setLicenseKey } from '@topgrid/grid-license';
import { type ColumnDef } from '@tanstack/react-table';

setLicenseKey('YOUR-LICENSE-KEY'); // 앱 시작 시 1회

type Product = { id: string; name: string; price: number; stock: number };

const initialData: Product[] = [
  { id: 'P001', name: '노트북', price: 1200000, stock: 50 },
  { id: 'P002', name: '마우스', price: 35000,   stock: 200 },
  { id: 'P003', name: '키보드', price: 120000,  stock: 150 },
];

const columns: ColumnDef<Product>[] = [
  { accessorKey: 'id',    header: '상품코드', size: 100 },
  { accessorKey: 'name',  header: '상품명',   size: 180 },
  { accessorKey: 'price', header: '단가',     size: 120 },
  { accessorKey: 'stock', header: '재고',     size: 100 },
];

export default function App() {
  // data + rowKey(필수) 로 추적 시작
  const tracking = useChangeTracking<Product>({
    data: initialData,
    rowKey: 'id',
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() =>
            tracking.addRow({ id: `P${Date.now()}`, name: '신규상품', price: 0, stock: 0 })
          }
        >
          행 추가
        </button>
        <button onClick={() => tracking.updateRow('P001', { price: 1100000 })}>
          P001 단가 수정
        </button>
        <button onClick={() => tracking.deleteRow('P002')}>P002 삭제</button>
        <button onClick={() => console.log(tracking.getChangeSet())}>
          변경 집합 출력
        </button>
        <button onClick={() => tracking.resetChanges()}>초기화</button>
      </div>

      <Grid data={tracking.rows} columns={columns} />

      <div style={{ marginTop: 12, fontSize: 14, color: '#555' }}>
        추가 {tracking.added.length}건 · 수정 {tracking.edited.length}건 · 삭제 {tracking.deleted.length}건
      </div>
    </div>
  );
}
```

`useChangeTracking` 반환값:

| 멤버 | 설명 |
|---|---|
| `rows` | 추적이 반영된 현재 행 배열 (`<Grid data>`에 전달) |
| `added` / `edited` / `deleted` | 변경된 행 목록 |
| `addRow(seed)` | 행 추가 — 할당된 키를 동기 반환 |
| `updateRow(key, patch)` | 부분 수정 |
| `deleteRow(key)` | 삭제 |
| `getChangeSet()` | 서버 전송용 변경 집합 생성 |
| `resetChanges()` | 추적 초기화 |

---

## 관련 문서

- [빠른 시작](/getting-started) — 설치와 기본 사용
- [아키텍처](/architecture) — 13개 패키지 구성
- [8개 Grid 변형 이전 가이드](./8-variant-table.md)
- [DataTable 이전 가이드](./dataTable-migration.md)
- [Deprecated Alias 목록](./deprecated-aliases.md)
