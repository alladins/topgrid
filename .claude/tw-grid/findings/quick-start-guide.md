---
title: tw-grid 빠른 시작 가이드 — 신 프로젝트 도입
date: 2026-05-20
audience: tw-grid 신 프로젝트 도입 개발자 (React/Next.js/Vite)
purpose: 5-30분 안에 그리드 도입 → 점진적 확장
relatedDocs:
  - library-api-reference.md (정확한 API 시그니처)
  - practical-adoption-guide.md (Wijmo Pro → tw-grid 마이그레이션 사례)
---

# tw-grid 빠른 시작 가이드

## 0. 어떤 프로젝트에 적합한가?

| 사용 사례 | 권장 패키지 |
|---|---|
| 단순 데이터 표시 (정렬/필터 없음) | `@topgrid/grid-core` + `@topgrid/grid-renderers` |
| 정렬 + 필터 + 검색 | + `@topgrid/grid-features` |
| Excel 다운로드 | + `@topgrid/grid-export` |
| 다단 헤더 (월/일/요일 등) | + `@topgrid/grid-pro-header` (Pro) |
| 인라인 편집 + 변경 추적 + 저장 | + `@topgrid/grid-pro-tracking` (Pro) |
| Excel-style drag-range + 키보드 | + `@topgrid/grid-pro-range` (Pro) |
| Master-Detail (펼치기) + 우클릭 메뉴 | + `@topgrid/grid-pro-master` (Pro) |
| Group / Sum / Avg 집계 | + `@topgrid/grid-pro-agg` (Pro) |

**최소 시작**: MIT 4 패키지 무료 사용. Pro 기능 필요 시 라이선스 별도 구매.

---

## 1. Hello World — 5분 안에 그리드 표시

### 1.1 설치

```bash
# Vite + React 프로젝트 가정
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install

# tw-grid + peer deps
npm install @topgrid/grid-core @topgrid/grid-renderers \
            @tanstack/react-table @tanstack/react-virtual

# Tailwind CSS (renderer 의 className 사용 위해)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 1.2 Tailwind 설정 (`tailwind.config.js`)

```javascript
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@topgrid/**/*.{js,mjs}',  // ★ tw-grid 클래스 인식
  ],
  theme: { extend: {} },
  plugins: [],
};
```

`src/index.css` 에 Tailwind directives:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 1.3 첫 그리드 — `src/App.tsx`

```typescript
import { Grid } from '@topgrid/grid-core';
import type { ColumnDef } from '@tanstack/react-table';

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

const columns: ColumnDef<User>[] = [
  { id: 'name', accessorKey: 'name', header: '이름', size: 150 },
  { id: 'email', accessorKey: 'email', header: '이메일', size: 250 },
  { id: 'age', accessorKey: 'age', header: '나이', size: 80 },
];

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
        enableSorting
      />
    </div>
  );
}
```

```bash
npm run dev
```

→ 브라우저에서 그리드 표시. 컬럼 헤더 클릭 시 정렬 동작. **5분 완료.**

---

## 2. 점진적 확장 — 단계별 추가

### 2.1 페이지네이션 추가

```typescript
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

### 2.2 필터 + 검색 추가

```typescript
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

### 2.3 셀 Renderer 추가

```typescript
import { NumberCell, StatusBadgeCell, LinkCell } from '@topgrid/grid-renderers';

const columns: ColumnDef<User>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: '이름',
    cell: (info) => (
      <LinkCell label={String(info.getValue())} onClick={() => goToDetail(info.row.original.id)} />
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
        colorMap={{ ACTIVE: 'green', INACTIVE: 'gray', PENDING: 'yellow' }}
      />
    ),
  },
];
```

### 2.4 Excel 내보내기 버튼

```typescript
import { exportToExcel } from '@topgrid/grid-export';

<button onClick={() => exportToExcel(table, { fileName: '사용자목록.xlsx' })}>
  엑셀 다운로드
</button>
```

⚠️ Excel 만 쓰는데 grid-export 의 jspdf 가 빌드 실패 시 → 다음 webpack config 적용:

```typescript
// next.config.ts 또는 vite.config.ts
{
  resolve: {
    fallback: { fflate: false, html2canvas: false, dompurify: false, canvg: false }
  }
}
```

### 2.5 컬럼 고정 + 가상화 (대량 데이터)

```typescript
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

---

## 3. Pro 기능 — 라이선스 필요

### 3.1 라이선스 키 설정

```typescript
// 앱 진입점 (App.tsx / layout.tsx)
import { setLicenseKey } from '@topgrid/grid-license';

useEffect(() => {
  setLicenseKey(import.meta.env.VITE_TOPGRID_LICENSE_KEY);
}, []);
```

라이선스 미설정 또는 만료 시: 그리드 우상단에 `"Unlicensed @topgrid/grid"` watermark 표시 (사용은 가능).

### 3.2 다단 헤더 (Multi-row Header)

```typescript
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

### 3.3 인라인 편집 + 변경 추적

```typescript
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
        const isEditing = editingCell?.rowId === info.row.id && editingCell?.colId === 'name';
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
    await api.batchSave(cs);
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

### 3.4 Excel-style drag-range + 키보드 nav

가장 강력한 옵션: `RangeSelectGrid` All-in-one 사용.

```typescript
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

`ChangeTrackingGrid` 와 함께 쓰려면 `useCellRange` + 수동 wire-up 필요 (Wijmo migration 사례 참조: `practical-adoption-guide.md` §3.6).

---

## 4. Next.js 환경 설정

### 4.1 신 Next.js 프로젝트

```bash
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
npm install @topgrid/grid-core @topgrid/grid-renderers \
            @tanstack/react-table @tanstack/react-virtual
```

### 4.2 npm publish 된 패키지 사용 시 (semver)

```json
// package.json
{
  "dependencies": {
    "@topgrid/grid-core": "^0.1.0",
    "@topgrid/grid-renderers": "^0.1.0"
  }
}
```

별도 next.config.ts 설정 불필요 — 일반 npm 의존성으로 동작.

### 4.3 monorepo file dep 사용 시 (라이선스 검증 / 자체 fork 등)

publish 검증 사례 (`practical-adoption-guide.md` §2.2) 참조.

핵심:
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  transpilePackages: ['@topgrid/grid-core', '@topgrid/grid-renderers', /* ... */],
  webpack: (config) => {
    config.resolve.symlinks = false;
    config.resolve.fallback = {
      fflate: false, html2canvas: false, dompurify: false, canvg: false,
    };
    return config;
  },
};
```

⚠️ Next.js Turbopack (`--turbopack` 플래그) 는 file: deps + symlink resolver 한계 — Webpack 빌더 권장 (`next dev` 만, --turbopack 미사용).

---

## 5. Vite 환경 설정

### 5.1 신 Vite 프로젝트

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install @topgrid/grid-core @topgrid/grid-renderers \
            @tanstack/react-table @tanstack/react-virtual
```

### 5.2 monorepo file dep 사용 시

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@topgrid/grid-core': path.resolve(__dirname, '../topvel-grid-monorepo/packages/grid-core'),
      // 필요 시 추가
    },
    dedupe: ['react', 'react-dom', '@tanstack/react-table'],
  },
  optimizeDeps: {
    include: ['@topgrid/grid-core', '@topgrid/grid-renderers'],
  },
});
```

---

## 6. 자주 사용하는 패턴

### 6.1 서버 사이드 페이지네이션 (SWR / React Query)

```typescript
import useSWR from 'swr';

function App() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const { data } = useSWR(`/api/users?page=${page}&size=${pageSize}`, fetcher);

  return (
    <>
      <Grid<User>
        data={data?.items ?? []}
        columns={columns}
        loading={!data}
      />
      <GridPagination
        table={table}
        mode="server"  // ★ 서버 모드
        totalCount={data?.totalCount ?? 0}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </>
  );
}
```

### 6.2 URL 동기화 (검색 필터를 query param 으로)

```typescript
import { useUrlSync, useGridState } from '@topgrid/grid-core';

const grid = useGridState<User>({});
useUrlSync(grid, { paramPrefix: 'users_' });
// URL: ?users_sort=name&users_page=2&users_filter[name]=kim
```

### 6.3 localStorage 영속화 (사용자 컬럼 설정 유지)

```typescript
import { useStoragePersist, useColumnPersistence } from '@topgrid/grid-core';

useColumnPersistence(table, { storageKey: 'my-table-cols' });
useStoragePersist(grid, { storageKey: 'my-grid-state' });
```

### 6.4 행 클릭 → 상세 페이지 이동

```typescript
<Grid<User>
  data={data}
  columns={columns}
  onRowClick={(row) => router.push(`/users/${row.id}`)}
/>
```

### 6.5 셀별 조건부 색상

```typescript
<Grid<User>
  data={data}
  columns={columns}
  cellClassName={(cell) => {
    if (cell.column.id === 'age' && (cell.getValue() as number) >= 60) {
      return 'bg-red-50 text-red-700';
    }
    if (cell.column.id === 'status' && cell.getValue() === 'PENDING') {
      return 'bg-yellow-50';
    }
    return '';
  }}
/>
```

---

## 7. 빌드 + 배포

### 7.1 npm publish 된 라이브러리 사용

```bash
# 일반 production build
npm run build

# 정상 빌드 — 별도 설정 불필요
```

### 7.2 monorepo file dep 사용 시

빌드 전 monorepo 패키지 dist 가 최신인지 확인:
```bash
cd ../topvel-grid-monorepo
pnpm -r --filter "./packages/**" build

cd ../my-app
npm run build
```

### 7.3 Tree-shaking 최적화

```typescript
// ✅ 권장 — 개별 패키지 import
import { Grid } from '@topgrid/grid-core';
import { EditableCell } from '@topgrid/grid-renderers';

// ❌ 비권장 — meta facade (Pro 전체 번들)
import { Grid, EditableCell, ChangeTrackingGrid } from '@topgrid/grid';
```

---

## 8. 디버깅 + 트러블슈팅

### 8.1 자주 발생 이슈

| 증상 | 원인 | 해결 |
|---|---|---|
| 그리드가 빈 화면 | data 없음 또는 columns 누락 | data + columns 모두 전달 확인 |
| 스타일 깨짐 (Tailwind 클래스 미적용) | tailwind.config.js content 누락 | `./node_modules/@topgrid/**/*.{js,mjs}` 추가 (§1.2) |
| `Module not found: @tanstack/table-core` | peer dep 미설치 | `npm install @tanstack/react-table @tanstack/react-virtual` |
| `Module not found: fflate/html2canvas/...` | grid-export 의 jspdf optional deps | webpack/vite resolve.fallback 으로 stub (§2.4) |
| 컬럼 정렬 안 됨 | enableSorting prop 누락 | `<Grid enableSorting>` 추가 |
| 가상화 적용 안 됨 | enableVirtualization 누락 또는 estimatedRowHeight 부재 | 둘 다 명시 |
| 셀 편집 시 첫 글자 손실 | initialDraft 미전달 | EditableCell 에 initialDraft prop 전달 (G-7 패턴) |
| ChangeTracking 시각 (색상) 안 보임 | Tailwind content scan 미포함 | tailwind.config.js content 에 grid-pro-tracking 추가 |
| Pro watermark 항상 표시 | 라이선스 키 미설정 또는 유효하지 않음 | setLicenseKey() 호출 확인 + 키 유효성 확인 |
| Next.js Turbopack 빌드 실패 | file: deps + symlink 미지원 | `next dev` (Webpack) 사용 또는 npm publish 후 semver |

### 8.2 진단 명령

```bash
# 설치 확인
ls node_modules/@topgrid

# 각 패키지의 dist 존재 확인
ls node_modules/@topgrid/grid-core/dist/

# typecheck
npx tsc --noEmit

# 빌드
npm run build
```

### 8.3 React DevTools 활용

- Components tab → `<Grid>` 컴포넌트 props 확인
- Profiler tab → re-render 빈도 측정 (가상화 적용 시 viewport 외 row 무render)

---

## 9. 학습 경로 추천

### 9.1 입문 (5-30분)
1. 본 가이드 §1 Hello World
2. §2.1-2.3 페이지네이션 + 필터 + Renderer 추가
3. `library-api-reference.md` §1 `@topgrid/grid-core` Grid 컴포넌트 props 숙지

### 9.2 중급 (1-2시간)
1. `library-api-reference.md` §2 Renderer 11종 사용
2. §3 grid-features (Filter UI + Multi-sort)
3. 본 가이드 §6 자주 사용 패턴
4. 서버 사이드 페이징 + URL sync 구현

### 9.3 고급 (Pro 기능, 2-5시간)
1. Pro 라이선스 등록
2. `library-api-reference.md` §6 createColumnGroup (다단 헤더)
3. §7 ChangeTrackingGrid (변경 추적)
4. §8 useCellRange + useKeyboardNav (Excel-style)
5. §9 MasterDetailGrid + ContextMenuGrid
6. §10-12 DataMap / Merging / Aggregation

### 9.4 마이그레이션 (Wijmo Pro / AG Grid → tw-grid)
`practical-adoption-guide.md` 전체 — TBIZONE/publish organizeSchedule 의 실 사례 + 9 API 매핑 표 + phase 별 절차 + 디버깅 가이드 10건.

---

## 10. 다음 단계

| 목적 | 다음 문서 |
|---|---|
| **정확한 API 시그니처 + 모든 export 목록** | `library-api-reference.md` |
| **실제 Wijmo Pro 마이그레이션 사례** | `practical-adoption-guide.md` |
| **Storybook 인터랙티브 데모** | `cd topvel-grid-monorepo && pnpm storybook` |
| **각 패키지 자체 README** | `topvel-grid-monorepo/packages/{name}/README.md` |
| **GitHub Issues** | https://github.com/alladins/topgrid/issues |

---

## 결론

tw-grid 는 **TanStack Table v8 기반** 의 React 그리드 라이브러리로, **MIT 4 패키지 무료** + Pro 8 패키지 옵션 구조. 5분 안에 시작 가능 + 점진적 확장 가능. Tailwind CSS + TypeScript 권장 환경.

다음 3가지 길:
1. **간단한 표 표시만** → `@topgrid/grid-core` 만 설치 → §1 Hello World 완료
2. **풀 기능 정렬/필터/검색/엑셀** → MIT 4 패키지 모두 설치 → §2 + §6 패턴 활용
3. **Excel-style 편집 + 다단 헤더 + 변경 추적** → Pro 라이선스 + Pro 패키지 → §3 + `library-api-reference.md` Pro 섹션

문의: https://github.com/alladins/topgrid/issues
