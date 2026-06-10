---
title: Deprecated Alias 목록
sidebar_position: 5
---

# Deprecated Alias 목록

:::warning 현행 API 불일치 — 재작성 예정
권장 대체 예제의 `<Grid mode="client">` 표기는 **현행 API와 불일치**한다 — 현재 `<Grid>`에는 top-level
`mode` prop이 없다. client 모드는 `<Grid columns data />`가 기본. **현행 패턴으로 재작성 예정**.
:::

`@topgrid/grid-core`는 이전 Grid 변형 컴포넌트와의 하위 호환성을 위해
**5개의 legacy alias**를 제공한다. 이 alias들은 C-23 semver 정책에 따라
**최소 1 minor 버전 동안 유지**된다.

> **주의**: `EditableGrid`, `ChangeTrackingGrid`, `RangeSelectGrid`는
> `@topgrid/grid-core`에 alias가 없다. 각 패키지에서 직접 import한다.
> 자세한 내용은 이 문서 하단 ["grid-core alias 없는 컴포넌트"](#grid-core-alias-없는-컴포넌트) 섹션을 참조한다.

---

## C-23 semver 정책 요약

**C-23 원문 요약**:
> - deprecated API는 최소 1 minor 버전 alias 유지
> - breaking change 시 CHANGELOG.md에 마이그레이션 가이드
> - 모든 패키지 semver 준수 (Changeset 도구 사용)

이 5개 alias는 `@topgrid/grid-core v0.x` 동안 유지되며,
`v1.0` 이후 제거 시에는 최소 1 minor 버전(`v1.1` 이상)의 예고 기간이 필요하다.

---

## grid-core/src/index.ts 확인 결과

```ts
// @topgrid/grid-core/src/index.ts (실제 확인)
// G-005 D8: legacy alias 5종 — main entry 호환 (`/legacy` sub-entry 권장).
export {
  BaseGrid,
  VirtualGrid,
  type VirtualGridProps,
  ColumnPinGrid,
  type ColumnPinGridProps,
  GroupedHeaderGrid,
  type GroupedHeaderGridProps,
  TreeGrid,
  type TreeGridProps,
} from './legacy';
```

---

## Alias 1: BaseGrid

| 항목 | 값 |
|------|---|
| **alias 이름** | `BaseGrid` |
| **re-export 출처** | `@topgrid/grid-core/src/legacy` |
| **권장 대체** | `<Grid mode="client">` from `@topgrid/grid-core` |
| **제거 예정** | 현재 minor + 1 이상 (C-23 보장) |

```tsx
// 현재 (alias 사용 — deprecated)
import { BaseGrid } from '@topgrid/grid-core';
<BaseGrid data={data} columns={columns} pagination={{ pageSize: 20 }} />

// 권장 (Grid 직접 사용)
import { Grid } from '@topgrid/grid-core';
<Grid mode="client" data={data} columns={columns} pagination={{ pageSize: 20 }} />
```

**이전 이유**: `BaseGrid`는 `mode` prop 없이 client-side 전용으로 고정되어 있었다.
`<Grid mode="client">` 또는 `mode="server"`를 명시하는 방식이 의도를 더 명확히 표현한다.

---

## Alias 2: VirtualGrid

| 항목 | 값 |
|------|---|
| **alias 이름** | `VirtualGrid`, `VirtualGridProps` |
| **re-export 출처** | `@topgrid/grid-core/src/legacy` |
| **권장 대체** | `<Grid enableVirtualization rowHeight containerHeight>` |
| **제거 예정** | 현재 minor + 1 이상 (C-23 보장) |

```tsx
// 현재 (alias 사용 — deprecated)
import { VirtualGrid } from '@topgrid/grid-core';
<VirtualGrid data={largeData} columns={columns} rowHeight={40} containerHeight={500} />

// 권장 (Grid enableVirtualization)
import { Grid } from '@topgrid/grid-core';
<Grid
  mode="client"
  enableVirtualization
  data={largeData}
  columns={columns}
  rowHeight={40}
  containerHeight={500}
/>
```

> **EC-06 주의**: `VirtualGrid`에서 `pagination` prop을 사용하던 코드는
> `<Grid enableVirtualization>` 이전 시 `pagination` prop을 제거한다.
> 가상화 Grid는 전체 데이터를 DOM 외부에서 관리하므로 페이지네이션과 함께 사용하지 않는다.

---

## Alias 3: ColumnPinGrid

| 항목 | 값 |
|------|---|
| **alias 이름** | `ColumnPinGrid`, `ColumnPinGridProps` |
| **re-export 출처** | `@topgrid/grid-core/src/legacy` |
| **권장 대체** | `<Grid columnPinning={{ left: [...], right: [...] }}>` |
| **제거 예정** | 현재 minor + 1 이상 (C-23 보장) |

```tsx
// 현재 (alias 사용 — deprecated)
import { ColumnPinGrid } from '@topgrid/grid-core';
<ColumnPinGrid
  data={data}
  columns={columns}
  pinLeft={['id', 'name']}
  pinRight={['actions']}
/>

// 권장 (Grid 직접 사용)
import { Grid } from '@topgrid/grid-core';
<Grid
  mode="client"
  data={data}
  columns={columns}
  columnPinning={{ left: ['id', 'name'], right: ['actions'] }}
/>
```

---

## Alias 4: GroupedHeaderGrid

| 항목 | 값 |
|------|---|
| **alias 이름** | `GroupedHeaderGrid`, `GroupedHeaderGridProps` |
| **re-export 출처** | `@topgrid/grid-core/src/legacy` → `@topgrid/grid-pro-header` |
| **권장 대체** | `import { GroupedHeaderGrid } from '@topgrid/grid-pro-header'` (직접) |
| **제거 예정** | 현재 minor + 1 이상 (C-23 보장) |

```tsx
// 현재 (grid-core alias 경유 — deprecated)
import { GroupedHeaderGrid } from '@topgrid/grid-core';

// 권장 (grid-pro-header 직접 import)
import { GroupedHeaderGrid } from '@topgrid/grid-pro-header';

// 사용법은 동일
<GroupedHeaderGrid data={data} columns={columnGroups} />
```

> **참고**: 레거시 `GroupedHeaderGrid.tsx`는
> 이미 `@topgrid/grid-pro-header`에서 re-export 중이므로 기존 상대 경로 import도
> 올바른 구현을 사용한다.

---

## Alias 5: TreeGrid

| 항목 | 값 |
|------|---|
| **alias 이름** | `TreeGrid`, `TreeGridProps` |
| **re-export 출처** | `@topgrid/grid-core/src/legacy` |
| **권장 대체** | `<Grid treeData getSubRows expandAll>` |
| **제거 예정** | 현재 minor + 1 이상 (C-23 보장) |

```tsx
// 현재 (alias 사용 — deprecated)
import { TreeGrid } from '@topgrid/grid-core';
<TreeGrid
  data={treeData}
  columns={columns}
  getSubRows={(row) => row.children}
  expandAll={false}
/>

// 권장 (Grid 직접 사용)
import { Grid } from '@topgrid/grid-core';
<Grid
  mode="client"
  treeData
  data={treeData}
  columns={columns}
  getSubRows={(row) => row.children}
  expandAll={false}
/>
```

---

## grid-core alias 없는 컴포넌트

아래 3개 컴포넌트는 `@topgrid/grid-core`에 legacy alias가 **없다**.
각 전용 패키지에서 직접 import한다.

> **EC-01**: `@topgrid/grid-core`에서 이 컴포넌트들을 import하려 하면 TypeScript 에러가 발생한다.

### EditableGrid

```tsx
// ❌ 잘못된 방법 — grid-core에 alias 없음
import { EditableGrid } from '@topgrid/grid-core'; // TypeScript 에러

// ✅ 올바른 방법 — 전용 패키지 사용
import { EditableCell } from '@topgrid/grid-renderers';
import { useChangeTracking } from '@topgrid/grid-pro-tracking';

// 또는 레거시 로컬 쉘 import (이전 완료 전까지)
import { EditableGrid } from '@/components/legacy/Grid/EditableGrid';
```

### ChangeTrackingGrid

```tsx
// ❌ 잘못된 방법 — grid-core에 alias 없음
import { ChangeTrackingGrid } from '@topgrid/grid-core'; // TypeScript 에러

// ✅ 올바른 방법 — 레거시 로컬 compat shim (이미 완전 이전)
import { ChangeTrackingGrid } from '@/components/legacy/Grid/ChangeTrackingGrid';

// 또는 hook 직접 사용
import { useChangeTracking } from '@topgrid/grid-pro-tracking';
```

### RangeSelectGrid

```tsx
// ❌ 잘못된 방법 — grid-core에 alias 없음
import { RangeSelectGrid } from '@topgrid/grid-core'; // TypeScript 에러

// ✅ 올바른 방법 — 레거시 로컬 wrapper (이미 완전 이전)
import { RangeSelectGrid } from '@/components/legacy/Grid/RangeSelectGrid';

// 또는 pro 패키지 직접 사용
import { RangeSelectGrid, useCellRange } from '@topgrid/grid-pro-range';
```

---

## 전체 alias 요약 테이블

| alias | grid-core 존재 | 권장 대체 | semver 보장 |
|-------|--------------|----------|------------|
| `BaseGrid` | ✅ | `<Grid mode="client">` | 현재 minor + 1 이상 |
| `VirtualGrid` | ✅ | `<Grid enableVirtualization>` | 현재 minor + 1 이상 |
| `ColumnPinGrid` | ✅ | `<Grid columnPinning>` | 현재 minor + 1 이상 |
| `GroupedHeaderGrid` | ✅ | `@topgrid/grid-pro-header` 직접 | 현재 minor + 1 이상 |
| `TreeGrid` | ✅ | `<Grid treeData>` | 현재 minor + 1 이상 |
| `EditableGrid` | ❌ | `@topgrid/grid-renderers` + 로컬 쉘 | — |
| `ChangeTrackingGrid` | ❌ | `@topgrid/grid-pro-tracking` compat shim | — |
| `RangeSelectGrid` | ❌ | `@topgrid/grid-pro-range` wrapper | — |

---

## 관련 문서

- [8개 Grid 변형 이전 가이드](./8-variant-table.md)
- [DataTable 이전 가이드](./dataTable-migration.md)
- [증분 이전 전략](./incremental-strategy.md)
- [Live 데모](./live-demos.md)

> **사이드바 등록**: G-001(Docusaurus 설정) PR에서 `sidebars.ts`에 이 문서를 추가한다 (D4).
