# Next.js / SSR 가이드 — topgrid React 그리드

topgrid 그리드는 **인터랙티브 클라이언트 컴포넌트**다(TanStack 훅·이벤트 핸들러·ResizeObserver 사용).
Next.js(App Router/Pages Router)·다른 SSR 프레임워크에서 쓸 때의 경계와 함정을 정리한다.

## 1. 핵심 규칙 3가지

1. **`Grid` 는 `'use client'`** — 정렬·선택·편집 등 인터랙션이 클라이언트에서 동작한다. RSC(서버 컴포넌트)에서 직접 렌더할 수 없다.
2. **컬럼 정의는 클라이언트에서 만든다** — `columns` 의 cell 렌더러는 **함수**라 서버→클라이언트 RSC 경계를 **직렬화로 못 넘는다**. `createColumns(...)` 도 함수(렌더러)를 만들므로 클라이언트 컴포넌트 안에서 호출한다.
3. **`data` 만 서버에서 넘긴다** — 행 데이터는 직렬화 가능(plain object)하므로 서버 컴포넌트에서 fetch 해 클라이언트 컴포넌트에 prop 으로 전달한다.

## 2. App Router 패턴 (권장)

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

## 3. SSR / 하이드레이션

- 그리드의 **테이블 마크업은 SSR 된다**(TanStack table-core 는 서버에서 동작) → 초기 HTML 에 행이 포함되어 빠른 first paint·SEO 에 유리.
- **클라이언트 전용 기능**은 하이드레이션 후 활성화된다: 행/열 **가상화**(`@tanstack/react-virtual`, ResizeObserver), 드래그 재정렬, 키보드 내비. 서버 HTML 엔 비가상화 형태로 그려지고, 클라이언트에서 인터랙션이 붙는다.
- 하이드레이션 불일치를 피하려면 **초기 정렬/필터 상태를 서버·클라이언트가 동일**하게 둔다(랜덤·`Date.now()` 기반 초기 상태 금지).

### 가상화는 클라이언트에서만
대량 데이터 가상화(`enableVirtualization`)는 실측 레이아웃이 필요하므로 SSR HTML 엔 의미가 없다. SSR 을
완전히 건너뛰고 클라이언트에서만 마운트하려면 동적 import:

```tsx
import dynamic from 'next/dynamic';
const UsersGrid = dynamic(() => import('./users-grid').then((m) => m.UsersGrid), { ssr: false });
```

## 4. Pages Router

`getServerSideProps`/`getStaticProps` 로 `data` 를 만들어 페이지에 넘기고, 그리드는 동일하게 클라이언트
컴포넌트로 렌더한다(파일 상단 `'use client'` 불필요 — Pages Router 는 기본 클라이언트 번들).

```tsx
export async function getServerSideProps() {
  return { props: { users: await fetchUsers() } };
}
export default function UsersPage({ users }) {
  return <UsersGrid users={users} />;   // §2 의 클라이언트 컴포넌트 재사용
}
```

## 5. Tailwind (App/Pages 공통)

셀 렌더러는 Tailwind className 으로 스타일링되므로 패키지 경로를 `content` 에 포함한다(상세 = `getting-started.md` §2.2):

```js
// tailwind.config.js
content: ['./app/**/*.{ts,tsx}', './node_modules/@topgrid/**/*.{js,mjs}'],
```

## 6. 자주 겪는 함정

| 증상 | 원인 | 해결 |
|------|------|------|
| `Functions cannot be passed to Client Components` | 서버 컴포넌트에서 `columns`(렌더러 함수) 를 prop 으로 넘김 | 컬럼을 **클라이언트 컴포넌트 안**에서 생성(§2-2) |
| `useReactTable` 등 훅 에러 / `document is not defined` | 서버 컴포넌트에서 `Grid` 직접 렌더 | `'use client'` 경계 추가 |
| 하이드레이션 mismatch 경고 | 서버·클라이언트 초기 상태 상이 | 초기 sorting/filter 를 결정적으로 고정 |
| 선택/재정렬이 정렬 후 어긋남 | `getRowId` 미지정(배열 인덱스 식별) | `getRowId={(row) => row.<고유키>}` (dev 경고 출력) |

## 7. Vue / Nuxt 차트 SSR

Vue 3 / Nuxt 의 차트 SSR 은 별도다 — `@topgrid/grid-pro-chart-enterprise-vue` 의
`renderChartToSvgString`(서버 정적 SVG) 및 패턴은 `vue-chart-consumer-notes.md` 참고.
