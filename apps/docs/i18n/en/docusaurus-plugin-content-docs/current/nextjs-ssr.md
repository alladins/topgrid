# Next.js / SSR

The topgrid grid is an **interactive client component** (it uses TanStack hooks, event handlers, and ResizeObserver).
This page covers the boundaries and pitfalls of using it with Next.js (App Router/Pages Router) and other SSR frameworks.

## 1. The Three Core Rules

1. **`Grid` is `'use client'`** — interactions such as sorting, selection, and editing run on the client. It cannot be rendered directly from an RSC (Server Component).
2. **Define columns on the client** — the cell renderers in `columns` are **functions**, so they **cannot cross the server→client RSC boundary via serialization**. `createColumns(...)` also creates functions (renderers), so call it inside a client component.
3. **Pass only `data` from the server** — row data is serializable (plain objects), so fetch it in a server component and pass it as a prop to the client component.

## 2. App Router Pattern (Recommended)

```tsx
// app/users/page.tsx  — Server Component (기본)
import { UsersGrid } from './users-grid';

export default async function Page() {
  const users = await fetchUsers();      // 서버에서 데이터 fetch
  return <UsersGrid users={users} />;    // ★ 직렬화 가능한 data 만 전달
}
```

```tsx
// app/users/users-grid.tsx  — Client Component
'use client';
import { Grid, createColumns } from '@topgrid/grid';

interface User { id: number; name: string; email: string; age: number }

export function UsersGrid({ users }: { users: User[] }) {
  // ★ 컬럼(=렌더러 함수)은 클라이언트에서 생성
  const columns = createColumns<User>([
    { id: 'name', name: '이름', type: 'text' },
    { id: 'email', name: '이메일', type: 'text' },
    { id: 'age', name: '나이', type: 'number', align: 'right' },
  ]);

  return (
    <Grid<User>
      data={users}
      columns={columns}
      getRowId={(u) => String(u.id)}   // ★ 안정적 행 식별 (selection/정렬 안전)
      enableSort
    />
  );
}
```

## 3. SSR / Hydration

- The grid's **table markup is server-rendered** (TanStack table-core runs on the server) → rows are included in the initial HTML, which benefits fast first paint and SEO.
- **Client-only features** are activated after hydration: row/column **virtualization** (`@tanstack/react-virtual`, ResizeObserver), drag reordering, and keyboard navigation. The server HTML is drawn in a non-virtualized form, and interactivity is attached on the client.
- To avoid hydration mismatches, keep the **initial sort/filter state identical on the server and client** (do not base initial state on random values or `Date.now()`).

### Virtualization Is Client-Only
Large-dataset virtualization (`enableVirtualization`) requires measured layout, so it is meaningless in SSR HTML. To skip SSR entirely and mount only on the client, use a dynamic import:

```tsx
import dynamic from 'next/dynamic';
const UsersGrid = dynamic(() => import('./users-grid').then((m) => m.UsersGrid), { ssr: false });
```

## 4. Pages Router

Use `getServerSideProps`/`getStaticProps` to produce `data` and pass it to the page, then render the grid the same way as a client component (no `'use client'` at the top of the file is needed — the Pages Router bundles to the client by default).

```tsx
export async function getServerSideProps() {
  return { props: { users: await fetchUsers() } };
}
export default function UsersPage({ users }) {
  return <UsersGrid users={users} />;   // §2 의 클라이언트 컴포넌트 재사용
}
```

## 5. Tailwind (Common to App/Pages)

Cell renderers are styled with Tailwind classNames, so include the package path in `content` (for details, see [Getting Started](./getting-started)):

```js
// tailwind.config.js
content: ['./app/**/*.{ts,tsx}', './node_modules/@topgrid/**/*.{js,mjs}'],
```

## 6. Common Pitfalls

| Symptom | Cause | Fix |
|------|------|------|
| `Functions cannot be passed to Client Components` | Passing `columns` (renderer functions) as a prop from a server component | Create the columns **inside the client component** (§2-2) |
| Hook errors such as `useReactTable` / `document is not defined` | Rendering `Grid` directly in a server component | Add a `'use client'` boundary |
| Hydration mismatch warning | Server and client initial state differ | Pin the initial sorting/filter deterministically |
| Selection/reordering breaks after sorting | `getRowId` not specified (identifying by array index) | `getRowId={(row) => row.<unique key>}` (emits a dev warning) |

## 7. Vue / Nuxt Chart SSR

Chart SSR for Vue 3 / Nuxt is separate — see the Vue chart guide for `renderChartToSvgString` (server-side static SVG) and patterns in `@topgrid/grid-pro-chart-enterprise-vue`.
