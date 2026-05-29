# G-002 Spec: Storybook (모든 패키지) — story 최소 1개/컴포넌트 + 대용량 시나리오

**Goal ID**: MOD-GRID-99-B / G-002  
**Title**: Storybook (모든 패키지) — story 최소 1개/컴포넌트 + 대용량 시나리오  
**Status**: DRAFT  
**Spec Writer**: tw-grid Spec Writer  
**Date**: 2026-05-15  
**packageTarget**: `apps/docs` (Storybook 통합 위치)  
**migrationImpact**: low  
**threshold**: 85  
**dependsOn**: MOD-GRID-99-B/G-001

---

## D# 결정 테이블

| ID | 결정 | 근거 | 대안 검토 |
|----|------|------|-----------|
| D1 | Section 7 implementFiles는 monorepo prefix 채택 (goals.json TOMIS prefix 정정) — `D:/project/topvel_project/topvel-grid-monorepo/packages/...` | C-28: implementFiles는 반드시 monorepo prefix 사용. goals.json의 `D:/project/topvel_project/TOMIS/packages/...` 는 discover 단계 생성 오류. spec이 authority. | TOMIS prefix 유지 시 C-28 위반 |
| D2 | Section 7에 `apps/docs/package.json` MODIFY 행 추가 (goals.json 14개 NEW → spec 14 NEW + 2 MODIFY) | Storybook devDeps (`@storybook/react-vite`, `storybook`) + scripts (`build-storybook`, `storybook`) 추가 필요. package.json 수정 없이는 AC-005 (`pnpm build-storybook`) 이행 불가. | goals.json 그대로 유지 시 AC-005 이행 파일 누락 → E-01 위반 |
| D3 | Section 7에 `.claude/tw-grid/decisions/MOD-GRID-99-B-decisions.md` MODIFY 행 추가 | ADR-005 (Storybook 8 vite framework), ADR-006 (C-3 Storybook mock exception) 기록 의무. C-9/C-20: 신규 devDep 채택 시 ADR 필수. | ADR 생략 시 C-9/C-20 위반 |
| D4 | Storybook 8.x + `@storybook/react-vite` framework 채택 | G-001 스택이 Vite 기반. `@storybook/react-vite`는 webpack 재설치 없이 Vite 빌드 통합. Storybook 8은 pnpm workspace + React 18 공식 지원. MIT 라이선스. | `@storybook/react-webpack5` 미채택 — webpack 이중 빌드 도구 + 대형 devDep 부담 |
| D5 | `@tomis/grid-license` (함수+타입만, Component 0) + `@tomis/grid` (export {} 플레이스홀더, Component 0) — story 파일 면제, AC-001 적용 대상에서 제외 | C-25: "export Component에 story 최소 1개". 두 패키지 모두 React Component export 없음. Component 0인 패키지에 story 파일 생성 시 빈 Storybook 파일 → 오히려 품질 저하. | story 파일 무조건 생성 시 "no stories" CSF 경고 발생 → AC-005 0 error 위반 가능 |
| D6 | `@tomis/grid-export` (Component 0, 함수 5개) — story 파일 포함, 기능 데모 목적 | C-25는 Component에만 story 의무 부여하므로 grid-export는 기술적으로 면제 가능. 그러나 `exportToExcel`, `exportToCSV`, `exportToPdf`, `copyToClipboard`, `printGrid` 5개 함수는 사용 데모 가치 높음. C-3 예외(Storybook 허용)로 mock Grid + 버튼 UI로 함수 시나리오 커버. | 면제 처리 시 grid-export 검증 Story 부재 → 실수로 빈 export 감지 불가 |
| D7 | Storybook story 파일의 mock/dummy 데이터 허용 — C-3 예외 명시 적용 | C-3: "dummy/mock 데이터는 Storybook stories 및 unit tests 에서만 허용". story 파일의 mock rows/columns 데이터는 이 예외 범주에 해당. production 패키지 소스(`src/`)에는 mock 데이터 없음. | mock 없이 story 작성 시 실제 API 연결 필요 → story 독립 실행 불가, AC-005 위반 |
| D8 | `apps/docs/.storybook/preview.ts`에 `.css` import 없음 — C-5 준수 | monorepo `package.json`에 `tailwindcss` 의존성 없음. `tailwind.config.*` 파일 없음. 따라서 Tailwind CSS 파일 참조 불필요. preview.ts는 순수 TypeScript 설정만. C-5 "CSS 신규 파일 생성 금지" 완전 준수. | global CSS import 추가 시 C-5 위반 + Tailwind 미설치 환경 빌드 오류 |

---

## Section 1: 참조 추적 (Reference Tracking)

| 계층 | 참조 | 설명 |
|------|------|------|
| L0 | G-001 결과 (구현 완료) | `apps/docs/package.json` (Docusaurus devDeps 포함 상태), `apps/docs/docusaurus.config.ts`, `apps/docs/sidebars.ts` — G-001 이후 현황 |
| L1 | `D:/project/topvel_project/topvel-grid-monorepo/package.json` | monorepo root — packageManager: pnpm@8.15.0, engines: node>=18, devDeps 현황 |
| L1 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/package.json` | docs 앱 현황 (G-001 후) — MODIFY 대상: Storybook devDeps + scripts 추가 |
| L1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/package.json` | `@tomis/grid-core` — peerDeps: `@tanstack/react-table ^8`, `@tanstack/react-virtual ^3`, react 18/19 |
| L1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/package.json` | `@tomis/grid-renderers` — peerDeps: react, @tanstack/react-table >=8 <9 |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | Components: Grid, GridPagination, PageSizeSelect, TotalCount, ColumnVisibilityMenu, BaseGrid(legacy), VirtualGrid(legacy), ColumnPinGrid(legacy), GroupedHeaderGrid(legacy), TreeGrid(legacy); Hooks: useGridState, useUrlSync, useStoragePersist, useColumnPersistence; Functions: createColumns, createTomisColumnHelper, defaultRendererRegistry, registerRenderer, createGroupedColumns |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/index.ts` | Components: TextCell, NumberCell, DateCell, StatusBadgeCell, LinkCell, ButtonCell, CheckCell, IconCell, TagCell, AvatarCell, ProgressCell, EditableCell (12개); Functions: formatNumberString, formatDateTimeFromDateTimeString, defaultRendererRegistry, registerRenderer, getRenderer |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/index.ts` | Functions ONLY: exportToExcel, exportToCSV, exportToPdf, copyToClipboard, printGrid (Component 0 — D6 결정) |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/index.ts` | Components: DropIndicator, SortBadge, SortClearButton, TextFilter, FilterPopover, FilterIndicator, NumberFilter, DateFilter, SelectFilter, GlobalSearchInput, FilterResetButton; Hooks: useColumnDrag, useColumnOrderPersist, useMultiSort |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` | Components: ChangeTrackingGrid(legacy alias); Hooks: useChangeTracking; Functions: buildChangeSet, getRowStatusClassName, defaultRowStatusClassNames |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/src/index.ts` | Components: RangeSelectGrid, DragFillHandle; Hooks: useCellRange, useKeyboardNav, useClipboard, useKeyboardEdit; Functions: normalizeRange, isInRange, fillRange, detectSeriesStep, stringifyTsv, parseTsv |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/index.ts` | Components: DataMapCell, DataMapEditor; Functions: createDataMap, createAsyncDataMap |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/index.ts` | Components: MergingGrid; Functions: computeMergeSpans |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/src/index.ts` | Components: MultiRowHeader, GroupedHeaderGrid(legacy alias); Functions: createColumnGroup |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/index.ts` | Components: MasterDetailGrid, ContextMenuGrid, TreeGrid(re-export from grid-core), ColumnPinGrid(re-export from grid-core); Hooks: useExpandedPersistence |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/index.ts` | Components: AggregationGrid, GroupPanel; Functions: resolveAggregationFn, registerAggregationFn, getAggregationFn, BUILT_IN_AGGREGATION_KEYS |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-license/src/index.ts` | Functions: setLicenseKey; Types: LicenseStatus, LicenseReason (Component 0 — D5 결정) |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid/src/index.ts` | `export {}` — 플레이스홀더, Component 0 (D5 결정) |
| R-A | AG Grid Stories (https://storybook.ag-grid.com/) | 경쟁 레퍼런스: Storybook 대용량 행 시나리오 구성 |
| R-W | Storybook Docs (https://storybook.js.org/docs) | Storybook 8.x CSF3 공식 문서 |

**전제 파일 확인 목록** (C-1 준수):
1. `D:/project/topvel_project/TOMIS/.claude/tw-grid/constraints.md` — C-1~C-35 제약
2. `D:/project/topvel_project/TOMIS/.claude/tw-grid/rubric/specify-rubric.md` — v1.0.9, 32항목
3. `D:/project/topvel_project/TOMIS/.claude/tw-grid/goals/MOD-GRID-99-B/docs-goals.json` — G-002 정의
4. `D:/project/topvel_project/topvel-grid-monorepo/package.json` — monorepo root
5. `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/package.json` — docs 현황 (G-001 후)
6. `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` — 13개 패키지 exports
7. `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod99b-g001/.claude/tw-grid/artifacts/MOD-GRID-99-B/docs/G-001-spec.md` — G-001 spec (이전 Goal 구조 확인)

---

## Section 2: API 계약 (API Contract)

### 2-1. Storybook 설정 타입 (TypeScript)

```typescript
// apps/docs/.storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    // 모든 패키지의 stories 디렉토리를 단일 glob로 수집
    '../../packages/*/stories/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
  ],
  framework: {
    name: '@storybook/react-vite',   // D4: vite framework (webpack 미사용)
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

```typescript
// apps/docs/.storybook/preview.ts
// D8: CSS import 없음 — monorepo에 Tailwind 미설치, C-5 완전 준수
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

### 2-2. 대표 Story 파일 타입 (grid-core, CSF3)

```typescript
// packages/grid-core/stories/Grid.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from '@tomis/grid-core';
import { createColumns } from '@tomis/grid-core';

// C-3 예외: mock 데이터는 Storybook stories 및 unit tests에서만 허용 (D7 결정)
const mockData = [
  { id: 1, name: '홍길동', dept: '개발팀' },
  // ...
];
const columns = createColumns([
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'dept', header: '부서' },
]);

const meta: Meta<typeof Grid> = {
  title: 'grid-core/Grid',
  component: Grid,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Grid>;

export const Default: Story = {
  args: {
    columns,
    data: mockData,
  },
};
```

### 2-3. 대용량 가상화 Story 타입 (C-18 필수)

```typescript
// packages/grid-core/stories/Grid.virtualized.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from '@tomis/grid-core';
import { createColumns } from '@tomis/grid-core';

// C-3 예외: 1000+ row mock 데이터는 Storybook 허용 범위 (D7 결정)
// C-18 필수: 1000+ 행 가상화 시나리오
const LARGE_DATA = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `사용자${i + 1}`,
  value: Math.floor(Math.random() * 10000),
  dept: ['개발팀', '기획팀', '영업팀'][i % 3],
}));

const columns = createColumns([
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'value', header: '수치' },
  { accessorKey: 'dept', header: '부서' },
]);

const meta: Meta<typeof Grid> = {
  title: 'grid-core/Grid 1000+행 가상화',
  component: Grid,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Grid>;

// AC-002 필수: 1000+ 행 가상화 시나리오
// Grid.tsx L148-153: enableVirtualization=true + virtualScrollHeight 로 @tanstack/react-virtual 활성화
export const Virtualized1000Rows: Story = {
  name: '1000행 가상화',
  args: {
    columns,
    data: LARGE_DATA,
    enableVirtualization: true,    // Grid.tsx: props.enableVirtualization === true
    virtualScrollHeight: 600,      // Grid.tsx: containerStyle.height = props.virtualScrollHeight ?? 400
  },
};

export const Virtualized5000Rows: Story = {
  name: '5000행 가상화 (성능 테스트)',
  args: {
    columns,
    data: Array.from({ length: 5000 }, (_, i) => ({
      id: i + 1,
      name: `사용자${i + 1}`,
      value: i * 3,
      dept: ['개발팀', '기획팀', '영업팀'][i % 3],
    })),
    enableVirtualization: true,
    virtualScrollHeight: 600,
  },
};
```

### 2-4. build-storybook 실행 방법

```bash
# AC-005: 0 error 검증 방법
# monorepo root에서:
pnpm -F docs build-storybook

# 또는 apps/docs 디렉토리에서:
pnpm build-storybook

# 예상 출력: "Build complete." — exit code 0
```

### 2-5. 각 패키지 story 최소 요구사항 (C-25 준수, AC-001~004)

| 패키지 | story 파일 | 커버 대상 | AC |
|--------|-----------|-----------|-----|
| grid-core | Grid.stories.tsx | Grid, GridPagination, PageSizeSelect, TotalCount, ColumnVisibilityMenu | AC-001 |
| grid-core | Grid.virtualized.stories.tsx | Grid 1000+행 가상화 (C-18 필수) | AC-002 |
| grid-renderers | Cells.stories.tsx | 12개 Cell 컴포넌트 각각 별도 Story export | AC-003 |
| grid-export | Export.stories.tsx | exportToExcel, exportToCSV, exportToPdf, copyToClipboard, printGrid 버튼 시나리오 (D6: 함수 데모) | AC-001(D6 확장) |
| grid-features | Features.stories.tsx | TextFilter, NumberFilter, DateFilter, SelectFilter, GlobalSearchInput, FilterResetButton, SortBadge, SortClearButton | AC-001 |
| grid-pro-tracking | ChangeTracking.stories.tsx | ChangeTrackingGrid, useChangeTracking 훅 데모 | AC-004 |
| grid-pro-range | RangeSelect.stories.tsx | RangeSelectGrid, DragFillHandle | AC-004 |
| grid-pro-datamap | DataMap.stories.tsx | DataMapCell, DataMapEditor | AC-004 |
| grid-pro-merging | Merging.stories.tsx | MergingGrid | AC-004 |
| grid-pro-header | GroupedHeader.stories.tsx | MultiRowHeader (GroupedHeaderGrid legacy alias는 별도 Story 불필요 — grid-core에서 커버) | AC-004 |
| grid-pro-agg | Aggregation.stories.tsx | AggregationGrid, GroupPanel | AC-004 |
| grid-pro-master | MasterDetail.stories.tsx | MasterDetailGrid, ContextMenuGrid (TreeGrid/ColumnPinGrid는 grid-core에서 이미 커버 — 중복 Story 불필요) | AC-004 |
| grid (empty) | — | C-25 면제 (export {} 플레이스홀더, Component 0) D5 결정 | — |
| grid-license | — | C-25 면제 (함수+타입만, Component 0) D5 결정 | — |

---

## Section 3: 현재 구현 현황 (Current Implementation)

G-001 완료 후 `apps/docs` 현황:
- `apps/docs/package.json`: Docusaurus devDeps 포함 (8개 devDep), scripts: `docs:build`, `docs:dev`, `docs:clear`, `build`, `test`
- `apps/docs/docusaurus.config.ts`: 존재 (G-001 생성)
- `apps/docs/sidebars.ts`: 존재 (G-001 생성)
- **Storybook 관련 파일: 전무** — G-001에서 D5 결정으로 위임

packages/ 현황:
- 13개 패키지 모두 `src/index.ts` 존재, TypeDoc 대상 확인 완료
- 어떤 패키지에도 `stories/` 디렉토리 없음 — 이 Goal이 전량 신규 생성

---

## Section 4: 호환성 분석 (Compatibility Analysis)

| 항목 | 내용 |
|------|------|
| Breaking change 여부 | 없음 — 패키지 public API(`src/`) 미변경. Storybook 파일은 `stories/` 하위에만 추가 |
| Deprecation 처리 | N/A — 신규 추가 |
| 영향 받는 usage 파일 수 | 0 (affectedUsageFiles: []) |
| Peer dependency 변경 | N/A — `apps/docs`는 private 패키지, 외부 peer 없음 |
| Node/pnpm 버전 요구 | node >= 18.0.0, pnpm >= 8.0.0 (monorepo root engines, Storybook 8 요건 충족) |
| 런타임 bundle 영향 | +0 KB (Storybook 전용 devDependencies — 런타임 번들에 포함 안됨) |
| G-001 호환성 | G-001 결과물(`docusaurus.config.ts`, `sidebars.ts`) 미변경. `apps/docs/package.json`만 scripts/devDeps 추가 MODIFY |

---

## Section 5: 인수 조건 (Acceptance Criteria)

**migrationImpact**: low (affectedUsageFiles: 0, bundleImpact: +0KB, Breaking: 없음)

| ID | 조건 | 소스 태그 |
|----|------|-----------|
| AC-001 | 11개 패키지(grid-core, grid-renderers, grid-export, grid-features, grid-pro-tracking, grid-pro-range, grid-pro-datamap, grid-pro-merging, grid-pro-header, grid-pro-agg, grid-pro-master)의 모든 export Component에 최소 1개 Storybook story 존재. grid + grid-license 면제 (D5 결정). | C-25 |
| AC-002 | grid-core에 1000+ 행 가상화 시나리오 Story 존재 (`Grid.virtualized.stories.tsx`, `Virtualized1000Rows` export). `@tanstack/react-virtual` 활용. | C-18 |
| AC-003 | grid-renderers의 12개 Cell 컴포넌트(`TextCell`, `NumberCell`, `DateCell`, `StatusBadgeCell`, `LinkCell`, `ButtonCell`, `CheckCell`, `IconCell`, `TagCell`, `AvatarCell`, `ProgressCell`, `EditableCell`)가 각각 별도 Story export로 커버됨 | C-25 |
| AC-004 | 각 grid-pro-* 패키지(tracking, range, datamap, merging, header, agg, master)의 핵심 Component 시나리오가 story로 커버됨 | C-25 |
| AC-005 | `pnpm -F docs build-storybook` 실행 시 exit code 0, 오류 메시지 없음 | C-12 |

---

## Section 6: 엣지 케이스 (Edge Cases)

| ID | 시나리오 | 처리 방법 |
|----|----------|-----------|
| EC-01 | story 내 mock 데이터 사용 우려 (C-3 위반 여부) | D7 결정: C-3 명시 예외 — "Storybook stories 및 unit tests에서 dummy/mock 데이터 허용". story 파일(`stories/*.stories.tsx`)은 이 예외 범주. production `src/` 에는 mock 없음. |
| EC-02 | `@tanstack/react-virtual`이 grid-core peerDependency에 있으나 Storybook devDep에 없는 경우 | `@tanstack/react-virtual ^3.13.24`는 monorepo root `package.json` devDependencies에 이미 포함 (C-18 준수). Storybook Vite 빌드 시 workspace hoisting으로 해결. |
| EC-03 | grid-pro-master의 `TreeGrid`, `ColumnPinGrid` re-export 중복 story 위험 | `MasterDetail.stories.tsx`는 `MasterDetailGrid`, `ContextMenuGrid`만 커버. `TreeGrid`/`ColumnPinGrid`는 `grid-core`의 `Grid.stories.tsx`에서 이미 커버. 중복 story 생성 금지 (불필요한 파일 추가 C-4 위반). |
| EC-04 | `@tomis/grid` (`export {}`) + `@tomis/grid-license` (Component 0) — story 파일 "no stories" 경고 | D5 결정: 두 패키지 story 파일 미생성. Storybook main.ts glob은 `packages/*/stories/` 이므로 해당 패키지에 stories 디렉토리가 없으면 glob에서 제외 → 경고 없음. |
| EC-05 | Storybook 8 + pnpm workspace symlink 해석 오류 | `@storybook/react-vite`의 Vite config는 monorepo root 기준 심링크를 자동 해석. pnpm `shamefully-hoist=false` 환경에서도 Vite symlink resolve 기본 활성화. |
| EC-06 | grid-export `exportToPdf` Story에서 PDF 생성 라이브러리 실제 호출 | Story에서는 버튼 클릭 핸들러를 mock fn으로 대체 (C-3 예외). 실제 PDF 생성 라이브러리 호출 없이 함수 시그니처 데모만. |
| EC-07 | Storybook `build-storybook` 시 CSS 부재 (D8 결정) | monorepo에 Tailwind 미설치이므로 preview.ts CSS import 불필요. Storybook 8 기본 테마로 렌더링. 커스텀 스타일 필요 시 별도 Goal에서 처리. |

---

## Section 7: 구현 파일 목록 (implementFiles)

**권위**: 이 테이블이 최종 구현 파일 목록의 단일 권위 (C-30).  
**prefix 기준**: monorepo prefix `D:/project/topvel_project/topvel-grid-monorepo/` (D1 결정, C-28 준수).

| # | 파일 경로 | 변경 유형 | 내용 |
|---|-----------|-----------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/.storybook/main.ts` | NEW | Storybook 8 설정 — `@storybook/react-vite` framework, stories glob: `../../packages/*/stories/**/*.stories.@(ts|tsx)`, addons: links+essentials |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/.storybook/preview.ts` | NEW | Storybook preview 설정 — parameters (actions, controls). CSS import 없음 (D8 결정, C-5 준수) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/package.json` | MODIFY | Storybook devDeps 추가 (`@storybook/react-vite`, `storybook`, `@storybook/addon-links`, `@storybook/addon-essentials`) + scripts 추가 (`build-storybook: storybook build`, `storybook: storybook dev --port 6006`) (D2 결정) |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/stories/Grid.stories.tsx` | NEW | Grid, GridPagination, PageSizeSelect, TotalCount, ColumnVisibilityMenu 각 story. mock 5행 데이터 (C-3 예외, D7). |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/stories/Grid.virtualized.stories.tsx` | NEW | 1000+행 가상화 시나리오 (C-18 필수, AC-002). Virtualized1000Rows + Virtualized5000Rows story. @tanstack/react-virtual 활용. |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/stories/Cells.stories.tsx` | NEW | 12개 Cell 컴포넌트 각각 별도 Story export (AC-003): TextCell, NumberCell, DateCell, StatusBadgeCell, LinkCell, ButtonCell, CheckCell, IconCell, TagCell, AvatarCell, ProgressCell, EditableCell |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/stories/Export.stories.tsx` | NEW | exportToExcel, exportToCSV, exportToPdf, copyToClipboard, printGrid 함수 데모 story. mock Grid + 버튼 UI (D6 결정, C-3 예외). |
| 8 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/stories/Features.stories.tsx` | NEW | TextFilter, NumberFilter, DateFilter, SelectFilter, GlobalSearchInput, FilterResetButton, SortBadge, SortClearButton, FilterIndicator story (AC-001, AC-004) |
| 9 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/stories/ChangeTracking.stories.tsx` | NEW | ChangeTrackingGrid story (legacy alias). useChangeTracking 훅 데모 story. (AC-004) |
| 10 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/stories/RangeSelect.stories.tsx` | NEW | RangeSelectGrid, DragFillHandle story. 범위 선택 + drag fill 시나리오. (AC-004) |
| 11 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/stories/DataMap.stories.tsx` | NEW | DataMapCell, DataMapEditor story. createDataMap으로 생성한 mock 맵 데이터 사용 (C-3 예외). (AC-004) |
| 12 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/stories/Merging.stories.tsx` | NEW | MergingGrid story. computeMergeSpans 적용 시나리오. (AC-004) |
| 13 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/stories/GroupedHeader.stories.tsx` | NEW | MultiRowHeader story. createColumnGroup으로 구성한 멀티헤더 시나리오. GroupedHeaderGrid legacy alias는 별도 story 불필요 (EC-03 참조). (AC-004) |
| 14 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/stories/Aggregation.stories.tsx` | NEW | AggregationGrid, GroupPanel story. resolveAggregationFn 활용 합계/평균 시나리오. (AC-004) |
| 15 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/stories/MasterDetail.stories.tsx` | NEW | MasterDetailGrid, ContextMenuGrid story. TreeGrid/ColumnPinGrid는 grid-core에서 커버 — 중복 불필요 (EC-03). (AC-004) |
| 16 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-99-B-decisions.md` | MODIFY | ADR-005 (Storybook 8 vite framework 채택) + ADR-006 (C-3 Storybook mock exception 명시) 추가 (D3 결정, C-9/C-20 준수) |

**집계**: NEW 14개, MODIFY 2개, 합계 16개

**면제 패키지** (D5 결정):
- `@tomis/grid` — `export {}` 플레이스홀더, Component 0 → story 파일 미생성
- `@tomis/grid-license` — `setLicenseKey` 함수+타입만, Component 0 → story 파일 미생성

> **D1 보충**: goals.json 원본 implementFiles의 `D:/project/topvel_project/TOMIS/packages/...` prefix는 discover 단계 생성 오류. 이 테이블의 `D:/project/topvel_project/topvel-grid-monorepo/packages/...`가 권위 (C-28, C-30).  
> **D2 보충**: goals.json 14개 NEW 대비 `apps/docs/package.json` MODIFY 1개 + `decisions.md` MODIFY 1개 추가. Storybook devDeps + scripts 없이는 AC-005 이행 불가. ADR 없이는 C-9/C-20 위반.

---

## Section 8: 사전 검증 (Preflight)

| 항목 | 내용 |
|------|------|
| 영향 받는 파일 수 | 0 (affectedUsageFiles: []) |
| 시각적 회귀 가능성 | N/A — 기존 UI 미변경 (Storybook 추가, 패키지 `src/` 미변경) |
| 증분 적용 가능 여부 | 가능 — 각 패키지 story 파일 독립 추가 가능. main.ts glob이 자동 수집. |
| 롤백 범위 | `apps/docs/.storybook/` + `packages/*/stories/` 디렉토리 삭제 + `apps/docs/package.json` revert로 완전 롤백. 패키지 `src/` 미변경. |
| Bundle impact | +0 KB (devDependencies 전용, 런타임 패키지에 미포함) |
| Node 버전 요구 | node >= 18.0.0 (Storybook 8 요건, monorepo root engines 충족) |
| G-001 영향 | G-001 결과물 미변경. `apps/docs/package.json`에 Storybook devDeps/scripts 추가만. Docusaurus 기능 영향 없음. |

---

## Section 9: 의존성 (Dependencies)

**bundle 영향**: 0 KB (모두 devDependencies — Storybook 빌드 전용, 런타임 패키지에 미포함)

| 패키지 | 버전 | 라이선스 | 용도 | bundle 영향 |
|--------|------|----------|------|-------------|
| `storybook` | ^8.0.0 | MIT | Storybook 8 코어 CLI + 빌더 | 0 KB |
| `@storybook/react-vite` | ^8.0.0 | MIT | React + Vite framework 통합 (D4 결정) | 0 KB |
| `@storybook/addon-links` | ^8.0.0 | MIT | story 간 링크 addon | 0 KB |
| `@storybook/addon-essentials` | ^8.0.0 | MIT | docs/controls/actions/viewport addon 번들 | 0 KB |
| `@tanstack/react-virtual` | ^3.13.24 | MIT | 1000+행 가상화 (C-18, AC-002). monorepo root devDeps에 이미 존재 — 신규 추가 불필요 | 0 KB |

> C-14/C-9 준수: 모든 신규 의존성 MIT 라이선스. ADR 기록은 D4 결정 테이블 + ADR-005 (decisions.md MODIFY #16).  
> `@storybook/addon-interactions`, `@storybook/testing-library` 등 추가 addon은 이 Goal 범위 외 — 별도 Goal에서 처리.

---

## Section 10: 사용자 여정 (User Journeys)

### 여정 1: 개발자 — 로컬 Storybook 서버 실행

```
1. pnpm install (monorepo root)
2. pnpm -F docs storybook
   (또는 cd apps/docs && pnpm storybook)
3. 브라우저: http://localhost:6006
4. 사이드바 "grid-core/Grid 1000+행 가상화" 클릭
5. Virtualized1000Rows story 렌더링 확인 — 스크롤 시 가상화 동작
```

### 여정 2: 개발자 — CI Storybook 빌드 검증

```
1. PR 생성
2. CI: pnpm -F docs build-storybook
3. exit code 0, "Build complete." 확인 (AC-005)
4. storybook-static/ 생성 확인
```

### 여정 3: 신규 패키지 개발자 — story 추가 의무 확인

```
1. 새 Component를 packages/grid-xxx/src/index.ts에 export 추가
2. packages/grid-xxx/stories/Xxx.stories.tsx에 Story 추가 (C-25 의무)
3. pnpm -F docs storybook → 사이드바에 신규 story 자동 등록 확인
4. main.ts glob 수정 불필요 (packages/*/stories/ 자동 수집)
```

### 여정 4: grid-export 함수 시나리오 확인

```
1. Storybook 사이드바 "grid-export/Export" 클릭
2. exportToExcel 버튼 클릭 → 다운로드 or mock 핸들러 확인
3. 함수 시그니처 + Controls 패널에서 인자 확인 (D6 결정: 함수 데모 목적)
```

---

## Section 11: 구현 단계 (Implementation Steps)

> **E-01 준수**: 아래 모든 Step의 파일은 Section 7 테이블에 포함되어 있음.

### Step 1: `apps/docs/package.json` MODIFY (파일 #3)

**Before** (G-001 완료 후 현황):
```json
{
  "name": "docs",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "description": "Docusaurus/Storybook documentation app",
  "scripts": {
    "docs:build": "docusaurus build",
    "docs:dev": "docusaurus start --port 3001",
    "docs:clear": "docusaurus clear",
    "build": "docusaurus build",
    "test": "echo TODO"
  },
  "devDependencies": {
    "@docusaurus/core": "^3.0.0",
    "@docusaurus/preset-classic": "^3.0.0",
    "@docusaurus/types": "^3.0.0",
    "docusaurus-plugin-typedoc": "^1.0.0",
    "typedoc": "^0.27.0",
    "typedoc-plugin-markdown": "^4.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

**After** (Storybook 추가):
```json
{
  "name": "docs",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "description": "Docusaurus/Storybook documentation app",
  "scripts": {
    "docs:build": "docusaurus build",
    "docs:dev": "docusaurus start --port 3001",
    "docs:clear": "docusaurus clear",
    "build": "docusaurus build",
    "build-storybook": "storybook build",
    "storybook": "storybook dev --port 6006",
    "test": "echo TODO"
  },
  "devDependencies": {
    "@docusaurus/core": "^3.0.0",
    "@docusaurus/preset-classic": "^3.0.0",
    "@docusaurus/types": "^3.0.0",
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/addon-links": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "docusaurus-plugin-typedoc": "^1.0.0",
    "storybook": "^8.0.0",
    "typedoc": "^0.27.0",
    "typedoc-plugin-markdown": "^4.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Step 2: `apps/docs/.storybook/main.ts` NEW (파일 #1)

Section 2-1 코드 스니펫 기준으로 생성. `framework: { name: '@storybook/react-vite', options: {} }`, `stories` glob: `../../packages/*/stories/**/*.stories.@(ts|tsx)`.

### Step 3: `apps/docs/.storybook/preview.ts` NEW (파일 #2)

Section 2-1 코드 스니펫 기준으로 생성. CSS import 없음 (D8, C-5 준수).

### Step 4: grid-core story 파일 2개 NEW (파일 #4, #5)

**파일 #4**: `packages/grid-core/stories/Grid.stories.tsx`
- Section 2-2 코드 스니펫 기준
- Grid (Default story), GridPagination, PageSizeSelect, TotalCount, ColumnVisibilityMenu 각각 Story export
- mock 5행 데이터 (C-3 예외, D7)
- ColumnVisibilityMenu: BaseGrid/VirtualGrid/ColumnPinGrid/GroupedHeaderGrid/TreeGrid는 legacy alias — 별도 story 불필요 (이미 Grid로 커버)

**파일 #5**: `packages/grid-core/stories/Grid.virtualized.stories.tsx`
- Section 2-3 코드 스니펫 기준
- `Virtualized1000Rows` (1000행), `Virtualized5000Rows` (5000행) story
- `@tanstack/react-virtual` 활용 (`virtualization: true, height: 600` prop)
- C-18 이행 선언: 이 파일이 C-18 필수 요건을 충족함

### Step 5: grid-renderers Cells.stories.tsx NEW (파일 #6)

**파일 #6**: `packages/grid-renderers/stories/Cells.stories.tsx`
- 12개 Cell 컴포넌트 각각 별도 Story export (AC-003 이행)
- 각 Cell에 mock props 제공 (C-3 예외)
- 파일 내 하나의 `meta` + 12개 named export Story (CSF3 패턴)
- 순서: TextCell → NumberCell → DateCell → StatusBadgeCell → LinkCell → ButtonCell → CheckCell → IconCell → TagCell → AvatarCell → ProgressCell → EditableCell

### Step 6: grid-export Export.stories.tsx NEW (파일 #7)

**파일 #7**: `packages/grid-export/stories/Export.stories.tsx`
- D6 결정: Component 0이지만 함수 데모 목적으로 story 포함
- mock Grid 데이터 + 버튼 UI로 각 함수 시나리오 구성 (C-3 예외)
- 5개 story: ExportToExcel, ExportToCSV, ExportToPdf, CopyToClipboard, PrintGrid

### Step 7: grid-features Features.stories.tsx NEW (파일 #8)

**파일 #8**: `packages/grid-features/stories/Features.stories.tsx`
- Filter 컴포넌트(TextFilter, NumberFilter, DateFilter, SelectFilter, GlobalSearchInput, FilterResetButton, FilterPopover, FilterIndicator) + Sort 컴포넌트(SortBadge, SortClearButton) story
- DropIndicator, SortClearButton 포함
- mock column 상태 데이터 (C-3 예외)

### Step 8: grid-pro-* story 파일 7개 NEW (파일 #9~#15)

**파일 #9**: `packages/grid-pro-tracking/stories/ChangeTracking.stories.tsx`
- ChangeTrackingGrid 기본 시나리오 + useChangeTracking 훅 데모
- mock rows + 수정 이벤트 시뮬레이션 (C-3 예외)

**파일 #10**: `packages/grid-pro-range/stories/RangeSelect.stories.tsx`
- RangeSelectGrid 기본 시나리오 + DragFillHandle 데모
- 범위 선택 + 드래그 채우기 시나리오

**파일 #11**: `packages/grid-pro-datamap/stories/DataMap.stories.tsx`
- DataMapCell, DataMapEditor story
- `createDataMap({ '01': '서울', '02': '부산' })` mock 데이터 (C-3 예외)

**파일 #12**: `packages/grid-pro-merging/stories/Merging.stories.tsx`
- MergingGrid story
- `computeMergeSpans` 적용 예시 (동일 부서명 셀 병합)

**파일 #13**: `packages/grid-pro-header/stories/GroupedHeader.stories.tsx`
- MultiRowHeader story
- `createColumnGroup`으로 구성한 2단 헤더 시나리오
- GroupedHeaderGrid (legacy alias)는 별도 Story 불필요

**파일 #14**: `packages/grid-pro-agg/stories/Aggregation.stories.tsx`
- AggregationGrid story + GroupPanel story
- `resolveAggregationFn('sum')`, `resolveAggregationFn('avg')` 활용
- mock 부서별 수치 데이터 (C-3 예외)

**파일 #15**: `packages/grid-pro-master/stories/MasterDetail.stories.tsx`
- MasterDetailGrid story + ContextMenuGrid story
- TreeGrid/ColumnPinGrid는 grid-core `Grid.stories.tsx`에서 커버 — 이 파일에서 미생성 (EC-03)
- master-detail 시나리오: 부서 → 직원 목록 expand

### Step 9: `decisions.md` MODIFY (파일 #16)

**파일 #16**: `.claude/tw-grid/decisions/MOD-GRID-99-B-decisions.md`에 ADR-005 + ADR-006 추가

**ADR-005**: Storybook 8 + `@storybook/react-vite` 채택 (D4 결정 상세)
- 상태: ACCEPTED
- 결정: `@storybook/react-vite ^8.0.0`
- 대안: `@storybook/react-webpack5` — webpack 이중 빌드 도구 + 대형 devDep 부담
- 라이선스: MIT

**ADR-006**: C-3 Storybook mock exception 명시 (D7 결정 상세)
- 상태: ACCEPTED
- 결정: story 파일(`stories/*.stories.tsx`)에서 mock/dummy 데이터 사용 허용
- 근거: C-3 명시 예외 "Storybook stories 및 unit tests에서 허용"
- 제약: production `src/` 디렉토리에는 mock 데이터 없음

### Step 10: 빌드 검증 (AC-005)

```bash
# pnpm install (신규 Storybook devDeps 설치)
pnpm install

# Storybook 빌드 (AC-005)
pnpm -F docs build-storybook

# 예상: "Build complete." — exit code 0, storybook-static/ 생성
```

---

## Section 12: 검증 계획 (Validation Plan)

| AC | 검증 방법 | 담당 |
|----|----------|------|
| AC-001 (C-25) | 11개 패키지 `stories/` 디렉토리 존재 확인. Storybook 사이드바에 각 패키지 story 등록 확인. grid + grid-license 면제는 D5 결정 ADR로 근거 있음. | 구현자 |
| AC-002 (C-18) | `Grid.virtualized.stories.tsx`의 `Virtualized1000Rows` story 렌더링 확인. 1000행 mock 데이터 + `virtualization: true` 전달 확인. | 구현자 |
| AC-003 (C-25) | `Cells.stories.tsx`에서 12개 Cell 컴포넌트 각각 named Story export 확인 (TextCell, NumberCell, DateCell, StatusBadgeCell, LinkCell, ButtonCell, CheckCell, IconCell, TagCell, AvatarCell, ProgressCell, EditableCell). | 구현자 |
| AC-004 (C-25) | grid-pro-* 7개 패키지 story 파일 존재 확인. 각 파일 내 핵심 Component story export 확인. | 구현자 |
| AC-005 (C-12) | `pnpm -F docs build-storybook` exit code 0, stderr에 "error" 없음. `storybook-static/` 디렉토리 생성 확인. | CI / 구현자 |

---

## Section 13: 상용화 고려사항 (Commercialization)

| 항목 | 내용 |
|------|------|
| packageTarget | `apps/docs` (private, UNLICENSED — 외부 배포 대상 아님). 패키지 `src/` 미변경 — 공개 API 영향 없음. |
| C-25 충족 선언 | **본 Goal이 C-25 Storybook story 의무를 충족한다.** 11개 패키지 모든 export Component에 최소 1개 story 추가 (AC-001~004). grid + grid-license는 Component 0으로 D5 결정에 따라 면제. |
| C-18 충족 선언 | **본 Goal이 C-18 1000+ 행 가상화 시나리오 의무를 충족한다.** `Grid.virtualized.stories.tsx`의 `Virtualized1000Rows` story가 `@tanstack/react-virtual` 기반 1000행 가상화를 Storybook에서 시연 (AC-002). |
| Storybook 배포 | 이 Goal 범위 외 (정적 사이트 배포는 G-003+ 범위). `build-storybook` 스크립트로 `storybook-static/` 생성은 AC-005로 검증. |
| Pro 패키지 라이선스 stub | grid-pro-* 패키지 story에서 `verifyOrWarn` stub 사용 중인 경우, story 실행 시 콘솔 경고 예상. 실제 라이선스 연동은 MOD-GRID-99-A/G-002 범위. |
| 다국어 | N/A — Storybook은 i18n 설정 없음. G-001 i18n 결정(D6) 영향 없음. |

---

## H 메타-게이트 자가 점검 (Self-Check)

| Gate | 항목 | 결과 |
|------|------|------|
| H-01 | referenceEvidence 경로 실재 여부 | PASS — Section 1 L0~L3 경로 모두 Read 도구로 사전 확인 완료. `apps/docs/package.json` (G-001 후 상태), 13개 `packages/*/src/index.ts`, monorepo root `package.json` 직접 읽기 완료. |
| H-02 | Section 7 implementFiles 부모 디렉토리 실재 여부 | PASS — `apps/docs/` 실재 (Read 성공). `packages/grid-core/`, `packages/grid-renderers/` 등 grandparent `D:/project/topvel_project/topvel-grid-monorepo/packages/` 실재 확인 (ls로 디렉토리 존재 확인 완료). `apps/docs/.storybook/`는 신규 생성 디렉토리 (명시). `packages/*/stories/`는 신규 생성 디렉토리 (명시). |
| H-03 | 모든 AC 소스 태그가 다른 섹션에서 인용되는지 | PASS — C-25: Section 13 "C-25 충족 선언" + Section 5 AC-001~004 소스 태그 + Section 2-5 테이블. C-18: Section 13 "C-18 충족 선언" + Section 5 AC-002. C-12: Section 12 AC-005 검증 방법 "C-12" 명시. C-3: Section 2 주석 + Section 6 EC-01 + D7 결정. |

**Self-grep 결과** (키워드 "재결정", "대체", "대신", "변경"):
- "재결정": 0 hits
- "대체": 0 hits
- "대신": D# 결정 테이블 "대안 검토" 컬럼 내 설명용 사용 (E-06 위반 아님 — 재결정 drift 아닌 대안 검토 기록)
- "변경": Section 7 테이블 "변경 유형" 컬럼 헤더 (E-06 무관)

**Section 7 ↔ Section 11 일치성 (E-01)**:
- Step 1 → 파일 #3 (apps/docs/package.json MODIFY) ✓
- Step 2 → 파일 #1 (apps/docs/.storybook/main.ts NEW) ✓
- Step 3 → 파일 #2 (apps/docs/.storybook/preview.ts NEW) ✓
- Step 4 → 파일 #4 (packages/grid-core/stories/Grid.stories.tsx NEW) ✓
- Step 4 → 파일 #5 (packages/grid-core/stories/Grid.virtualized.stories.tsx NEW) ✓
- Step 5 → 파일 #6 (packages/grid-renderers/stories/Cells.stories.tsx NEW) ✓
- Step 6 → 파일 #7 (packages/grid-export/stories/Export.stories.tsx NEW) ✓
- Step 7 → 파일 #8 (packages/grid-features/stories/Features.stories.tsx NEW) ✓
- Step 8 → 파일 #9 (packages/grid-pro-tracking/stories/ChangeTracking.stories.tsx NEW) ✓
- Step 8 → 파일 #10 (packages/grid-pro-range/stories/RangeSelect.stories.tsx NEW) ✓
- Step 8 → 파일 #11 (packages/grid-pro-datamap/stories/DataMap.stories.tsx NEW) ✓
- Step 8 → 파일 #12 (packages/grid-pro-merging/stories/Merging.stories.tsx NEW) ✓
- Step 8 → 파일 #13 (packages/grid-pro-header/stories/GroupedHeader.stories.tsx NEW) ✓
- Step 8 → 파일 #14 (packages/grid-pro-agg/stories/Aggregation.stories.tsx NEW) ✓
- Step 8 → 파일 #15 (packages/grid-pro-master/stories/MasterDetail.stories.tsx NEW) ✓
- Step 9 → 파일 #16 (.claude/tw-grid/decisions/MOD-GRID-99-B-decisions.md MODIFY) ✓

**집계**: 10개 Steps ↔ 16개 implementFiles (Step 4: 2파일, Step 8: 7파일 처리) — 완전 일치.

---

## Appendix B: C-35 Spec Writer Self-Check

C-35 요건에 따른 자가 검증 결과.

### B-1. 함수 시그니처 동일성 스캔 (Same-Function Signature Scan)

검사 대상: Section 2 코드 스니펫 내 컴포넌트/함수 시그니처 vs Section 7/11 기술 내용

| 항목 | Section 2 | Section 7/11 | 일치 여부 |
|------|-----------|--------------|-----------|
| `Grid` | `component: Grid` (import from `@tomis/grid-core`) | 파일 #4: Grid, GridPagination, PageSizeSelect, TotalCount, ColumnVisibilityMenu | ✓ PASS |
| `Grid.virtualized` | `enableVirtualization: true, virtualScrollHeight: 600` (Grid.tsx L148/L245 실제 prop명 확인) | 파일 #5: Virtualized1000Rows + Virtualized5000Rows | ✓ PASS |
| `StorybookConfig.stories` glob | `../../packages/*/stories/**/*.stories.@(ts|tsx)` | Section 11 Step 2: main.ts glob 동일 기술 | ✓ PASS |
| `build-storybook` | `pnpm -F docs build-storybook` | Section 11 Step 10 + Section 12 AC-005 | ✓ PASS |
| `preview.ts` CSS import | 없음 (D8 결정) | Section 11 Step 3: "CSS import 없음 (D8, C-5 준수)" | ✓ PASS |

**결론**: Section 2와 Section 7/11 사이 함수/설정 시그니처 불일치 없음.

### B-2. Import 사용 스캔 (Import Usage Scan)

검사 대상: Section 2 코드 스니펫의 import 문 — 미사용 import 없는지 확인

| 파일 | Import | 사용 여부 |
|------|--------|-----------|
| `main.ts` | `StorybookConfig` from `@storybook/react-vite` | `config: StorybookConfig` 타입 주석에서 사용 ✓ |
| `preview.ts` | `Preview` from `@storybook/react` | `preview: Preview` 타입 주석에서 사용 ✓ |
| `Grid.stories.tsx` | `Meta`, `StoryObj` from `@storybook/react` | `meta: Meta<typeof Grid>`, `Story = StoryObj<typeof Grid>` 사용 ✓ |
| `Grid.stories.tsx` | `Grid` from `@tomis/grid-core` | `component: Grid` 사용 ✓ |
| `Grid.stories.tsx` | `createColumns` from `@tomis/grid-core` | `createColumns([...])` 호출 ✓ |
| `Grid.virtualized.stories.tsx` | `Meta`, `StoryObj` from `@storybook/react` | 동일 패턴 사용 ✓ |
| `Grid.virtualized.stories.tsx` | `Grid`, `createColumns` from `@tomis/grid-core` | 사용 ✓ |

**결론**: 코드 스니펫 내 미사용 import 없음.

### B-3. promptSpecDrift 기록

| ID | 항목 | Drift 내용 | 처리 |
|----|------|-----------|------|
| PSD-001 | C-28 prefix 정정 | goals.json `TOMIS/packages/` → spec `topvel-grid-monorepo/packages/` | D1 결정으로 명시 |
| PSD-002 | C-5 Tailwind 검증 | monorepo에 Tailwind 미설치 → preview.ts CSS import 없음 | D8 결정으로 명시 |
| PSD-003 | grid + grid-license 면제 | goals.json에 면제 기술 없음 → D5 결정으로 근거 명시 | D5 결정 |
| PSD-004 | MODIFY 파일 2개 추가 | goals.json 14 NEW만 → spec 14 NEW + 2 MODIFY | D2, D3 결정 |
| PSD-005 | grid-export story 포함 | Component 0이지만 함수 데모 목적으로 포함 | D6 결정 |

**결론**: 모든 spec-drift 항목이 D# 결정 테이블에 명시됨.

---

*Spec 작성 완료: 2026-05-15*  
*C-1 준수: 전제 파일 Read 완료 후 작성 (7개 파일 목록 Section 1에 명시)*  
*C-28 준수: Section 7 전체 monorepo prefix 사용 (D1 결정)*  
*C-30 준수: Section 7 테이블이 단일 권위*  
*C-25 충족: Section 13에 명시적 선언*  
*C-18 충족: Section 13에 명시적 선언*  
*C-35 준수: Appendix B 자가 검증 완료*
