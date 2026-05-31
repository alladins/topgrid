# topgrid

TanStack Table v8 기반 React 19 / TypeScript grid 라이브러리. **MIT 4 패키지** + **Pro EULA 8 패키지** + **메타 facade 1 패키지** 구성.

> Wijmo / AG Grid 대체를 목표로 한 상용 grid 컴포넌트. 핵심 그리드는 MIT, 엔터프라이즈 기능(Range / Master-Detail / Merging / Multi-Header / Aggregation / Change Tracking / DataMap)은 EULA Pro.

---

## Quick Start

### MIT-only (라이선스 키 불필요)

가장 가벼운 진입점. Pro 기능 없이 단일 grid + 렌더러 + 필터 + 내보내기.

```bash
pnpm add @topgrid/grid-core @topgrid/grid-renderers @topgrid/grid-features @topgrid/grid-export
# peer deps
pnpm add @tanstack/react-table @tanstack/react-virtual react react-dom
```

```tsx
import { Grid, useGridState, createColumns } from '@topgrid/grid-core';
import { NumberCell, StatusBadgeCell } from '@topgrid/grid-renderers';

const columns = createColumns<Row>([
  { accessorKey: 'id',     header: 'ID',     type: 'number' },
  { accessorKey: 'status', header: 'Status', type: 'badge' },
]);

export function MyGrid({ rows }: { rows: Row[] }) {
  const state = useGridState({ columns, data: rows });
  return <Grid state={state} />;
}
```

### Pro (EULA 라이선스 키 필요)

메타 facade 단일 진입. Pro 패키지를 모두 포함 (license 미설정 시 watermark 자동 표시).

```bash
pnpm add @topgrid/grid
# peer deps
pnpm add @tanstack/react-table @tanstack/react-virtual react react-dom
# optional peer (export 사용 시)
pnpm add xlsx jspdf jspdf-autotable
```

```tsx
import { setLicenseKey } from '@topgrid/grid';
import { Grid, MasterDetailGrid, RangeSelectGrid } from '@topgrid/grid';

// 앱 부팅 시 1회
setLicenseKey('YOUR-LICENSE-KEY');

export function App() {
  return <MasterDetailGrid ... />;
}
```

라이선스 키 없이 Pro 컴포넌트를 사용하면 `<Watermark>` 가 자동 렌더됩니다. (ADR-001)

---

## Packages — 13개 모듈

### MIT (4)

| 패키지 | Version | License | 역할 |
|--------|---------|---------|------|
| [`@topgrid/grid-core`](./packages/grid-core)           | `0.1.0` | MIT | TanStack Table 추상화 + `<Grid>` + `useGridState` + `createColumns` + pagination + multi-sort base + legacy alias (BaseGrid / VirtualGrid / ColumnPinGrid / TreeGrid) + `internal/storage` adapter |
| [`@topgrid/grid-renderers`](./packages/grid-renderers) | `0.1.0` | MIT | 11종 cell renderer (Text / Number / Date / StatusBadge / Link / Button / Check / Icon / Tag / Avatar / Progress) + `EditableCell` + `defaultRendererRegistry` |
| [`@topgrid/grid-features`](./packages/grid-features)   | `0.3.0` | MIT | Filter UI (Text / Number / Date / Select) + `useMultiSort` + filter primitives |
| [`@topgrid/grid-export`](./packages/grid-export)       | `0.2.0` | MIT | Excel / CSV / PDF / 클립보드 / 인쇄 |

### Pro (8 — EULA)

| 패키지 | Version | License | 역할 |
|--------|---------|---------|------|
| [`@topgrid/grid-license`](./packages/grid-license)             | `0.1.0` | SEE LICENSE IN EULA | License runtime — `setLicenseKey` / `useLicenseStatus` / `Watermark` |
| [`@topgrid/grid-pro-tracking`](./packages/grid-pro-tracking)   | `0.1.0` | SEE LICENSE IN EULA | Change tracking + `ChangeTrackingGrid` + validator + mapping |
| [`@topgrid/grid-pro-range`](./packages/grid-pro-range)         | `0.1.0` | SEE LICENSE IN EULA | Cell range selection + keyboard nav + clipboard + drag-fill |
| [`@topgrid/grid-pro-datamap`](./packages/grid-pro-datamap)     | `0.2.0` | SEE LICENSE IN EULA | DataMap / AsyncDataMap — foreign key lookup |
| [`@topgrid/grid-pro-merging`](./packages/grid-pro-merging)     | `0.1.0` | SEE LICENSE IN EULA | Cell merging (rowSpan) — `column.mergeRows` API |
| [`@topgrid/grid-pro-header`](./packages/grid-pro-header)       | `0.1.0` | SEE LICENSE IN EULA | Multi-row grouped headers + `GroupedHeaderGrid` |
| [`@topgrid/grid-pro-agg`](./packages/grid-pro-agg)             | `0.1.0` | SEE LICENSE IN EULA | Aggregation + grouping + `GroupPanel` |
| [`@topgrid/grid-pro-master`](./packages/grid-pro-master)       | `0.1.0` | SEE LICENSE IN EULA | Master-detail + tree grid + context menu + row pinning |

### Meta (1)

| 패키지 | Version | License | 역할 |
|--------|---------|---------|------|
| [`@topgrid/grid`](./packages/grid)                             | `0.1.0` | SEE LICENSE IN EULA | **Facade** — 위 12 패키지의 public API 단일 재export (ADR-003). MIT + Pro 통합 — Pro 포함이므로 EULA 적용 |

---

## License 분리

| 구분 | 패키지 수 | 적용 | 사용 조건 |
|------|--------|------|---------|
| **MIT** | 4 | grid-core / grid-renderers / grid-features / grid-export | 자유 사용. npm public 배포 예정 |
| **EULA Pro** | 8 | grid-license + 7 Pro 모듈 (tracking / range / datamap / merging / header / agg / master) | `setLicenseKey()` 호출 의무. 미설정 시 `<Watermark>` 자동 노출 (ADR-001). 별도 라이선스 키 발급 필요 ([sales@platree.com](mailto:sales@platree.com)) |
| **Meta facade** | 1 | grid | Pro 포함 → EULA. MIT-only 사용자는 facade 대신 4 MIT 패키지 직접 import |

### Watermark 정책 (ADR-001)

- 7 Pro grid 컴포넌트 (`AggregationGrid` / `MasterDetailGrid` / `RangeSelectGrid` / `MergingGrid` / `ChangeTrackingGrid` / `MultiRowHeader` / `DataMapCell`) 는 module load 시 `useWatermarkEnforcement()` 로 license 상태 구독.
- `watermarkRequired === true` → `<Watermark required />` 자동 렌더.
- `MultiRowHeader`: `<thead>` 내 watermark row prepend (sub-spec H-D — HTML-valid).
- `DataMapCell`: module-level singleton portal via `document.body` (sub-spec D-D — per-cell 누적 회피).

자세한 wiring 구조는 `apps/docs/visual-regression.md` 참조.

---

## Architecture Overview

패키지 layering · 라이선스 게이트 · 레지스트리 와이어링 · 번들 예산 · cross-package 경계의 전체 설계는 [`docs/internal/architecture.md`](./docs/internal/architecture.md) 참조.

### 1. Renderer Registry Wiring (ADR-002 + ADR-018)

`grid-renderers` 가 `grid-core/internal/Map` 으로 cross-package 등록. 다음 8 slot이 wired:

**Wired by default (`wireDefaultRenderers()` side-effect):**
| Slot | Cell | 비고 |
|------|------|------|
| `text` | `TextCell` | ADR-002 |
| `number` | `NumberCell` | ADR-002 |
| `date` / `dateTime` | `DateCell` | ADR-002 |
| `badge` | `StatusBadgeCell` | ADR-002 (`statusBadge` alias) |
| `link` | `LinkCell` | ADR-002 — `value` prop (`label` deprecated) |
| `checkbox` | `CheckCell` | ADR-002 (`check` alias) |
| `tag` | `TagCell` | ADR-018 (D-2 X-A1 — value-adapter union 확장) |
| `progress` | `ProgressCell` | ADR-018 (D-2 X-A1) |

**Deferred (구조적 차단 — column.cell 직접 wiring 권고):**

| Slot | 사유 |
|------|------|
| `icon` | `IconCellProps.icon: ReactNode` required — value-only adapter 불가 (ADR-018 D-1 I-A) |
| `button` | `ButtonCellProps.onClick: () => void` required — adapter widening 시 런타임 broken (ADR-018 D-3 X-B) |
| `avatar` | `AvatarCellProps.name: string` required — 동일 사유 (ADR-018 D-3 X-B) |
| `statusBadge` (alias) | `badge` 동의어 — alias 표준 status quo (ADR-018 D-4 A-A) |
| `check` (alias) | `checkbox` 동의어 — 동일 (ADR-018 D-4 A-A) |

### 2. License Enforcement Wiring (ADR-001)

`grid-license` 에 `useLicenseStatus()` / `useWatermarkEnforcement()` / `subscribeLicense` 3 hook 신설 → 7 Pro 패키지가 모두 구독.

### 3. Meta Facade Activation (ADR-003)

`@topgrid/grid` 가 12 underlying package public API 를 단일 entry로 재export. tsup `treeshake: true` + `sideEffects` 필드 보존으로 ~1.5 KB dist shim. 5 cross-package name collision 해소 (canonical source 명시).

### 4. Storage Adapter Consolidation (ADR-007)

4종 persistence hook (column visibility / column order / sort / pagination) 을 `grid-core/internal/storage` adapter 1곳으로 추출. `useStoragePersist` public API.

### 5. onRowClick Signature Unification (ADR-016)

10여 곳에 흩어진 row click handler 시그니처를 `(row: Row<TData>, event: React.MouseEvent) => void` 로 통일.

---

## Deprecation Paths

다음 항목은 다음 minor 에서 `@deprecated` 마킹 → 다음 major 에서 제거됩니다. CHANGELOG 마이그레이션 가이드 참조.

| 항목 | 권고 대체 | 패키지 | ADR | Timeline |
|------|---------|--------|------|---------|
| `LinkCell` `label` prop | `value` prop 사용 | `grid-renderers` | ADR-014 (D-partial) | next major |
| `ButtonCell` `label` prop | `value` prop 사용 | `grid-renderers` | ADR-014 (D-partial) | next major |
| `TopgridColumnDef` (from `@topgrid/grid-pro-datamap`) | `DataMapColumnDef` import | `grid-pro-datamap` | ADR-006 | next major |
| `createTopgridColumnHelper` | `createColumns` 사용 | `grid-core` | ADR-013 | next major |
| `createGroupedColumns` + `TopgridColumnGroup` | `@topgrid/grid-pro-header` `GroupedHeaderGrid` | `grid-core` | ADR-013 | next major |
| `useColumnPersistence` | `useStoragePersist` (storage adapter) | `grid-core` | ADR-013 | next major |
| `ColumnVisibilityMenu` + `ColumnVisibilityMenuProps` | (재구현 권고 — Grid.tsx 내부 ref) | `grid-core` | ADR-013 | next major |

> facade `@topgrid/grid` 는 위 6 dead API 를 **재export 하지 않습니다** (ADR-013). deprecation phase 동안 사용 시 `@topgrid/grid-core` 에서 직접 import 가 필요합니다.

---

## Peer Dependencies — SSoT 매트릭스 (ADR-MOD-GRID-00-008 Amendment)

| Peer | 범위 | 적용 대상 | optional |
|------|------|--------|---------|
| `react` | `^18.0.0 \|\| ^19.0.0` | 13개 전체 | 필수 |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` | 13개 전체 | 필수 |
| `@tanstack/react-table` | `^8.0.0` | 12개 (grid-license 제외) | 필수 |
| `@tanstack/react-virtual` | `^3.0.0` | 6개 (grid-core 필수 / grid-features / grid-pro-range / grid-pro-merging / grid-pro-agg / grid meta) | grid-core 필수, 나머지 optional |
| `xlsx` | `^0.18.5` | grid-export 필수 / grid meta optional | mixed |
| `jspdf` | `^2.5.0` | grid-export / grid meta | optional |
| `jspdf-autotable` | `^3.5.0` | grid-export / grid meta | optional |
| `date-fns` | `^4.1.0` | grid-features 전용 | 필수 |
| `react-datepicker` | `^8.3.0` | grid-features 전용 | 필수 |
| `@topgrid/grid-core` | `workspace:*` | 4 패키지 peer (grid-renderers / grid-pro-tracking / grid-pro-merging / grid-pro-master) | 필수 |

상세 (peer 매트릭스 + 빌드/배포 인프라) → [`docs/internal/modules/mod-grid-00.md`](./docs/internal/modules/mod-grid-00.md).

---

## Visual Regression Testing

`apps/docs` Storybook static + Playwright + ubuntu-equivalent baseline.

- **Baseline 캡처 환경**: **WSL2 (Linux glibc + 동일 font)** 로컬. CI ubuntu 미사용 (사용자 인프라 부재). 절차는 [`tests/visual/README.md`](./tests/visual/README.md) 참조.
- **CI 흐름**: `.github/workflows/visual-regression.yml` — pull_request / push to main 시 Playwright visual diff 자동 실행. `migration-impact:high` / `migration-impact:medium` label PR 은 fail 시 차단.
- **D-D baseline-only PR 정책**: baseline 미존재 (EC-01) 상태에서는 시각 변경 + baseline 캡처를 분리된 PR 로 격리 (`tests/visual/README.md` §2).

### Pixel-perfect threshold

`playwright.config.ts` 의 `maxDiffPixelRatio: 0.01` (1%) 유지.

---

## CI Workflows

| Workflow | 파일 | 트리거 | 목적 |
|----------|------|--------|------|
| **Build & Dist Verify** | `.github/workflows/build-verify.yml` | PR + push to main | (1) `pnpm -r build` 13/13 PASS, (2) dist `verifyLicense` / `verifyGridLicense` stale 잔재 차단, (3) `grid-license` dist 의 신 license API 3종 (`useLicenseStatus` / `useWatermarkEnforcement` / `subscribeLicense`) export 확인 (ADR-015) |
| **Visual Regression** | `.github/workflows/visual-regression.yml` | PR + push to main | Storybook static + Playwright visual diff + migration-impact label block (C-13 / C-17) |

---

## Development

### 빌드

```bash
pnpm install
pnpm -r build         # 13 packages
pnpm -r typecheck     # 14 entries (apps + packages)
pnpm size-limit       # bundle size guard (POL-BUNDLE §1)
```

### Changeset 워크플로우

```bash
pnpm changeset              # 변경 내용 기재 + semver 분류
pnpm changeset version      # CHANGELOG + version bump
pnpm changeset publish      # npm publish (Pro 패키지는 access=restricted)
```

### 패키지 추가 시 (peer 매트릭스 의무)

신규 패키지 추가 시 [`docs/internal/modules/mod-grid-00.md`](./docs/internal/modules/mod-grid-00.md) 의 peer 매트릭스를 참조해야 합니다. peer 범위 자율 결정 금지.

---

## Contributing

- **Architecture**: 패키지 layering · 라이선스 게이트 · 설계 원칙은 [`docs/internal/architecture.md`](./docs/internal/architecture.md), 모듈별 상세는 [`docs/internal/modules/`](./docs/internal/modules/) 참조.
- **Decisions**: 모든 architecture 결정은 ADR 형식 (대안 2개 이상 + Trade-off + 실행 조건 + 결과 체크리스트) 의무.

---

## Documentation

| 자원 | 경로 |
|------|------|
| Storybook (개발 중) | `apps/docs/` — `pnpm -F docs build-storybook` |
| Visual regression 절차 | `tests/visual/README.md` |
| 패키지 별 API | `packages/{name}/README.md` |
| 아키텍처 · 설계 결정 | [`docs/internal/architecture.md`](./docs/internal/architecture.md) + [`docs/internal/modules/`](./docs/internal/modules/) |
| API 레퍼런스 · 시작 가이드 | [`docs/internal/guides/`](./docs/internal/guides/) |

> 외부 문서 사이트 (`topgrid.platree.com`) 는 별도 cycle 에서 publish 예정.

---

## License

- **MIT (4 packages)**: `@topgrid/grid-core` / `@topgrid/grid-renderers` / `@topgrid/grid-features` / `@topgrid/grid-export` — `LICENSE` 파일 참조.
- **EULA (9 packages)**: `@topgrid/grid` (meta) + `@topgrid/grid-license` + 7 Pro — 각 패키지 `EULA.md` 참조. 라이선스 키 발급: [sales@platree.com](mailto:sales@platree.com).

---

## Roadmap (선택)

- **npm publish 인프라** (Pro 패키지 private registry / restricted access) — 사용자 별도 cycle.
- **baseline PNG 캡처** — WSL2 환경 진입 후 `pnpm visual:test --update-snapshots` 1회.
- **마이그레이션 가이드 site** — Wave 1-5 결과 deprecation paths 사용자 cycle 산출물.

---

[Documentation (예정)](https://topgrid.platree.com) | [API Reference (예정)](https://topgrid.platree.com/api) | [Contact](mailto:sales@platree.com)
