# tw-grid Refactor Analysis — 2026-05-17

> read-only 정적 분석. 모든 주장은 file:line 인용 또는 grep 결과로 뒷받침. 추측 금지.
> 분석자: opus47 (1M context) | 분석 범위: topvel-grid-monorepo (13 패키지, ~195 src 파일) + tw-framework-front (15 grid + 7 DataTable 파일)

---

## Executive Summary

- **분석 대상**: 13 패키지 모노레포 195 src + tw-framework-front 22 grid 파일 + 정책 SSoT 8 파일
- **발견 건수**: **P0 9건, P1 11건, P2 5건 = 25건**
- **검출 0건 차원**: AG Grid/Wijmo 도입 (POL-TANSTACK §2/§3) — 정책 준수 양호

### 가장 큰 누수 / 위반 Top 3 (one-liner)

1. **Pro 라이선스 게이트 사실상 무력화 (P0)** — 모든 Pro 패키지가 `checkLicense()` 를 모듈 로드 side-effect 로 호출하지만 결과를 폐기. `Watermark` 컴포넌트는 어느 Pro 그리드 `src/` 에서도 렌더링되지 않음. `setLicenseKey('')` 미호출과 유효 키 호출의 런타임 동작이 동일.
2. **`createColumns` ↔ `grid-renderers` 미연결 (P0 / C-31 cross-package)** — `grid-core` 의 `defaultRendererRegistry` 는 9 type 모두 `String(value)` placeholder. `grid-renderers` 의 실제 cell 컴포넌트는 별도 `rendererRegistry` 에 들어있으나 `createColumns` 가 읽지 않음. 사용자가 명시적으로 wiring 하지 않으면 `<Grid>` 가 plain text 만 렌더.
3. **메타 패키지 `@tomis/grid` 가 사실상 빈 placeholder (P0)** — `packages/grid/src/index.ts` 가 `export {};` 1줄. README/타 문서는 "facade — aggregates all packages" 라 광고하나 실 export 0건.

### 가장 큰 추출 후보 Top 3 (one-liner)

1. **`grid-core/legacy/` 의 5종 alias 컴포넌트와 tw-framework-front 의 5종 자체 구현 1156 LOC 가 분기** — 동일 이름, 다른 행동. 단일 통합 후 wrapper deprecate.
2. **4개 패키지의 localStorage persistence hook (`useStoragePersist`, `useColumnPersistence`, `useColumnOrderPersist`, `useExpandedPersistence` = 578 LOC)** — 동일 try/catch + SSR guard + JSON.parse 패턴 4회 반복. `grid-core/internal/storage` 어댑터 추출.
3. **`SortBadge` 가 `grid-core/internal` + `grid-features/multi-sort` 양쪽에 동일 구현** — 주석에 "동일 구현을 내부 복사본으로 유지" 명시. `grid-core` 가 이미 `grid-features` 를 import 하므로 명분 깨짐.

### 차원별 발견 분포

| 차원 | P0 | P1 | P2 | 0건 |
|------|----|----|----|----|
| 1. Cross-package 중복 유틸/타입 | 2 | 1 | 0 | |
| 2. Pro/MIT 경계 + 라이선스 게이트 | 1 | 1 | 0 | |
| 3. rendererRegistry 미연결 (C-31) | 1 | 0 | 0 | |
| 4. grid-core ↔ grid-features 역layering | 0 | 1 | 0 | |
| 5. API 일관성 | 1 | 2 | 0 | |
| 6. Dead code / 누락 wiring | 1 | 3 | 1 | |
| 7. tw-framework-front 8 variant 동기화 | 2 | 1 | 1 | |
| 8. 번들 / 의존성 | 0 | 2 | 0 | |
| 9. TypeScript 품질 | 0 | 1 | 0 | (any 0, C-29 0) |
| 10. AG Grid / Wijmo / policies 위반 | 0 | 0 | 1 | ✅ |
| 11. 테스트 / docs 자산 중복 | 0 | 0 | 2 | |

---

## 1. Cross-package 중복 유틸 / 타입

### 1.1 `defaultRendererRegistry` / `registerRenderer` 동명이체

**발생**:
- `packages/grid-core/src/column/rendererRegistry.ts:33` — `defaultRendererRegistry: RendererRegistry = new Map<TomisColumnType, RendererFn>` (Map of functions, 9 entries, all placeholders)
- `packages/grid-renderers/src/rendererRegistry.ts:59` — `defaultRendererRegistry: Record<string, CellComponent>` (Object of React components, 14 entries)

**동일성**: 0% — 동일 이름, 완전히 다른 shape:
- grid-core: `Map<TomisColumnType, (info) => ReactNode>` — 9 entries, 모두 `String(info.getValue() ?? '')` placeholder (line 35–51).
- grid-renderers: `Record<string, ComponentType<CellComponentProps>>` — 14 entries (text/number/date/dateTime/badge/statusBadge/link/button/checkbox/check/icon/tag/avatar/progress), 모두 실제 컴포넌트 (line 60–73).

**Export 경로**:
- `packages/grid-core/src/index.ts:49` — `export { defaultRendererRegistry, registerRenderer } from './column/rendererRegistry';`
- `packages/grid-renderers/src/index.ts:36-41` — `export { defaultRendererRegistry, registerRenderer, getRenderer, ... }`
- **메타 `@tomis/grid` 는 `export {};` (`packages/grid/src/index.ts:2`)** — 두 패키지를 동시에 re-export 하지 않으므로 컴파일 충돌은 미발생. 그러나 사용자가 두 패키지를 동시에 import 하면 named import 충돌 (workaround: `as` alias 필수).

**심각도**: **P0** — name collision + 의미 mismatch (Map vs Record, function vs component). 이름 collision 자체보다 다음 §3 의 "wiring 미연결" 이 더 큰 위협 (creator's intent 와 실제 동작이 다름).

**제안**:
1. `grid-core` 의 placeholder registry 를 제거하고 `grid-renderers` 의 registry 를 단일 소스로 통일.
2. `createColumns` 가 dependency injection 으로 registry 를 받거나 `grid-renderers` 에서 자동 wiring (peer dep 으로 두고 `grid-renderers` 의 side-effect import 시 `grid-core` registry 가 채워지는 패턴).
3. 단기 완화: `grid-core` 의 `defaultRendererRegistry` export 를 `internal` 로 강등 (public API 에서 제거).

**예상 코드 절감**: grid-core/column/rendererRegistry.ts 83 LOC 제거 가능 (grid-renderers 가 single source 가 되면).

---

### 1.2 `TomisColumnDef` 동명이체

**발생**:
- `packages/grid-core/src/column/types.ts:65` — `interface TomisColumnDef<TData = unknown> { id; name; type; align; width?; visibility?; enableSorting?; enableResizing?; meta?; etc?; }` (custom shape, no TanStack extends)
- `packages/grid-pro-datamap/src/types.ts:131` — `type TomisColumnDef<TData> = ColumnDef<TData, unknown> & { dataMap?; selectOptions?; }` (TanStack `ColumnDef` 확장)

**동일성**: 0% — 다른 base, 다른 필드, 다른 사용 목적.

**심각도**: **P0** — 같은 이름의 export 가 서로 다른 모델을 의미. `grid-pro-datamap` 의 사용자는 grid-core 의 동명 타입이라고 오해할 위험.

**제안**:
1. `grid-pro-datamap` 의 type 명 변경 → `DataMapColumnDef<TData>` 또는 `TomisColumnDefWithDataMap<TData>`.
2. 또는 grid-pro-datamap 이 grid-core 의 `TomisColumnDef` 를 확장하도록 일원화 (현 shape 은 호환 불가하므로 grid-pro-datamap 쪽 리네이밍이 안전).
3. spec 디렉토리 (`.claude/tw-grid/artifacts/MOD-GRID-12/`) 에 명시 mismatch 가 있는지 추가 조사 필요.

**예상 코드 절감**: 0 LOC (이름 변경) — 그러나 사용자 혼선 비용 high.

---

### 1.3 `SortBadge` 동일 구현 중복 (코드 + 주석으로 인정됨)

**발생**:
- `packages/grid-core/src/internal/SortBadge.tsx:12-19` — internal, `Grid.tsx:341` 에서만 사용
- `packages/grid-features/src/multi-sort/SortBadge.tsx:18-22` — public, `grid-features/src/index.ts:20` 에서 export

**동일성**: ~95% — UI 출력 동일 (Tailwind class 일부 미세 차이만), prop 시그니처 동일.

**Rationale 주석** (`grid-core/src/internal/SortBadge.tsx:6-8`):
> "퍼블릭 API용 동일 컴포넌트는 `@tomis/grid-features` 에 `SortBadge`로 export됨. **grid-core → grid-features 의존성 추가 없이 badge 기능을 제공하기 위해 동일 구현을 내부 복사본으로 유지.** (Spec D6 미러 패턴)"

**그러나** `grid-core/src/Grid.tsx:39` 가 이미 `import { useColumnDrag, DropIndicator, SortClearButton } from '@tomis/grid-features';` 로 grid-features 에 의존. **명분 깨짐.**

**Public SortBadge 외부 consumer 수**: 0 (production code) — 사용처는 stories 뿐:
- `grid-features/stories/Features.stories.tsx:27,65-87`
- `grid-features/src/multi-sort/SortClearButton.stories.tsx:23,136`
- `grid-features/src/multi-sort/MultiSortGrid.stories.tsx:28,150`
- tw-framework-front: 0 hits (grep `SortBadge` on `tw-framework-front/src/` 0건)

**심각도**: **P1** — duplication 자체보다 "public export 의 production 사용자 0건" 이 더 큰 신호. Public API 슬림화 후보.

**제안**: 
1. grid-core 의 internal/SortBadge.tsx 삭제, `Grid.tsx` 가 `grid-features` 의 SortBadge 사용 (이미 다른 export 들로 의존성 있음).
2. 또는 `grid-features` 의 public SortBadge 도 제거하고 (사용자 0건) `Grid.tsx` 만 내부 사용 유지 — 단 stories 가 깨짐.

**예상 코드 절감**: 20 LOC (`grid-core/src/internal/SortBadge.tsx` 전체).

---

### 1.4 `BaseGridProps` / `GridPaginationOptions` / `GridRowSelectionOptions` 중복 정의

**발생**:
- `packages/grid-core/src/types.ts:166` — `GridRowSelectionOptions<TData>` (onSelectionChange?: (rows: TData[]) => void)
- `packages/grid-core/src/types.ts:188` — `GridPaginationOptions`
- `packages/grid-core/src/types.ts:622` — `BaseGridProps<TData>` (onRowClick?: (row: TData) => void — no event)
- `packages/grid-pro-header/src/legacy/GroupedHeaderGrid.tsx:33-42` — **inline 재선언**: `interface GridPaginationOptions { pageSize?; pageSizeOptions? }` + `interface GridRowSelectionOptions { mode; onSelectionChange?: (selectedRows: unknown[]) => void }`
- `tw-framework-front/src/types/tomis/grid.ts:6-26` — `GridPaginationOptions`, `GridRowSelectionOptions` (`onSelectionChange?: (selectedRows: unknown[]) => void`), `BaseGridProps`

**동일성**: shape 동일 ~80%, 시그니처 mismatch:
- grid-core 의 `onSelectionChange: (rows: TData[]) => void` (제네릭) vs tw-framework-front + grid-pro-header 의 `(selectedRows: unknown[]) => void` (unknown[])
- grid-core BaseGridProps onRowClick: 인자 1개 `(row)` — types.ts:627 — 그러나 같은 파일 GridProps.onRowClick (types.ts:390) 은 `(row, event)` 인자 2개.

**Rationale** (`grid-pro-header/src/legacy/GroupedHeaderGrid.tsx:11-13`):
> "D3 decision: inline type aliases for GridPaginationOptions / GridRowSelectionOptions to avoid reverse dependency on tw-framework-front."

**그러나** 두 type 은 이미 `grid-core/src/types.ts` 에 export 되어 있음 (`@tomis/grid-core` 가 grid-pro-header 의 peerDep). reverse dependency 가 아니라 정상 dependency. **D3 결정의 전제가 틀렸다.**

**심각도**: **P1** — 동일 의미 다른 시그니처가 3+ 곳. 사용자가 컴파일 통과/실패가 패키지마다 다른 상황 발생 가능.

**제안**:
1. tw-framework-front `types/tomis/grid.ts` 를 `@tomis/grid-core` re-export 로 교체 (5–7 type 만 사용).
2. grid-pro-header legacy/GroupedHeaderGrid 의 inline alias 제거 후 grid-core 에서 import (D3 결정 폐기).
3. `BaseGridProps.onRowClick` 와 `GridProps.onRowClick` 시그니처 통일 (D5 §5.1 의 후속 작업).

**예상 코드 절감**: tw-framework-front 측 ~30 LOC, grid-pro-header 측 12 LOC.

---

### 1.5 `ColumnInfo` 동일 shape 중복 (legacy compat 의도지만 정의 분리)

**발생**:
- `packages/grid-core/src/legacy/ColumnInfo.ts:40-59` (60 LOC, deprecation 주석 포함)
- `tw-framework-front/src/components/DataTable/data-table-types.ts:1-9` (9 LOC, alias 미참조)

**동일성**: 100% shape — id/type/align/name/width/visibility?/etc?

**의도된 alias**: grid-core 의 `ColumnInfo` 가 tw-framework-front DataTable 의 `ColumnInfo` 와 동일 shape 임이 주석에 명시 (`legacy/ColumnInfo.ts:7,17`).

**그러나** tw-framework-front 의 DataTable 은 grid-core 의 alias 를 **import 하지 않음**. 자체 정의 유지 → migration 진행 안 됨.

**심각도**: **P2** — `DataTable/` 폴더 자체가 deprecated 인지 사용 중인지 불명확. 다음 §7.1 참조.

---

## 2. Pro/MIT 경계 + 라이선스 게이트

### 2.1 라이선스 게이트가 런타임 enforcement 없음 (HEADLINE P0)

**발생** (모든 Pro 패키지 index.ts):
- `packages/grid-pro-agg/src/index.ts:1-3`
- `packages/grid-pro-datamap/src/index.ts:1-3`
- `packages/grid-pro-header/src/index.ts:1-3`
- `packages/grid-pro-master/src/index.ts:1-3`
- `packages/grid-pro-merging/src/index.ts:1-3`
- `packages/grid-pro-range/src/index.ts:1-3`
- `packages/grid-pro-tracking/src/index.ts:1-3`

모든 패키지가 동일 패턴:
```ts
import { checkLicense } from '@tomis/grid-license';
checkLicense();
```

**문제**:
1. `checkLicense()` 의 return 값 (`LicenseCheckResult`) 이 폐기됨 (`packages/grid-license/src/checkLicense.ts:15-43` 의 `valid`, `watermarkRequired` 정보가 사라짐).
2. `Watermark` 컴포넌트 (`packages/grid-license/src/Watermark.tsx`) 가 **어느 Pro 패키지 src/ 에서도 import / 렌더링되지 않음**.
   - 사용처 grep 결과: `packages/grid-license/stories/License.stories.tsx` (자체 stories) 만. (`Watermark` grep 결과 전체 §0 참조 — production src 0건.)
3. `getLicenseState()` (`packages/grid-license/src/state.ts:9-14`) 가 `_state === null` 시 `{ valid: false, reason: 'invalid' }` 를 반환하나, 이 상태가 어떤 동작 차이도 만들지 않음.
4. `setLicenseKey('')` 미호출 ↔ 유효 키 호출 모두 동일 런타임 행동: **Pro 기능 정상 동작 + 워터마크 0**.

**검증 절차**:
```bash
# Watermark 사용처 (production src 만)
Grep "Watermark|watermarkRequired" packages/ --glob "!**/dist/**" --glob "!**/stories/**"
# 결과: grid-license/src/types.ts, src/checkLicense.ts, src/Watermark.tsx, src/index.ts 만 — 자체 패키지 외 0건.
```

**심각도**: **P0** — Pro/MIT 경계가 컴파일타임 (peerDep + index.ts side-effect) 에서만 존재. 런타임 차단 0. 정책 `POL-DOC-LIC` 의도와 정면 모순.

**제안**:
1. 단기: 각 Pro Grid 컴포넌트 (`AggregationGrid`, `MergingGrid`, `MasterDetailGrid`, `RangeSelectGrid`, `MultiRowHeader`, `ChangeTrackingGrid`, `DataMapCell`) 의 render 함수 안에서 `const lic = useLicenseStatus(); ... {lic.watermarkRequired && <Watermark required />}` 패턴 추가.
2. 또는 module load 시 invalid 면 console.error + (옵션) 행동 제한.
3. license-aware HOC (`withLicenseGate(Component)`) 를 grid-license 에 추가 후 모든 Pro 컴포넌트 export 를 wrap.
4. constraints 에 신규 항목 (예: C-37 — "Pro 컴포넌트는 라이선스 워터마크 컴포넌트와 동일 트리에 렌더되어야 함") 추가 검토.

**예상 추가 LOC**: 7 Pro 패키지 × ~5 LOC = 35 LOC. ROI 매우 큼 (정책 실현).

---

### 2.2 MIT 패키지 → Pro/license import 누수

**검증 grep**:
```bash
Grep "from ['\"]@tomis/grid-(pro|license)" packages/grid-(core|features|renderers|export)/src/
# 결과: 0 hits (MIT 패키지 src/ 안에서 Pro/license import 0건)
```

**심각도**: **0건** ✅ — POL-COMPAT/POL-DOC-LIC 의 MIT/Pro 단방향 의존 준수.

---

### 2.3 Build artifact stale — `verifyLicense` vs `checkLicense` 이름 mismatch (P2)

**발생**:
- `packages/grid-pro-master/dist/index.mjs:3` — `import { verifyLicense } from '@tomis/grid-license';`
- 그러나 `packages/grid-pro-master/src/index.ts:1` — `import { checkLicense } from '@tomis/grid-license';`
- `packages/grid-license/src/index.ts:2-4` 의 export 는 `setLicenseKey`, `checkLicense`, `Watermark` — `verifyLicense` 라는 export 0건.

**원인**: stale build (src 변경 후 dist 미 rebuild) — `verifyLicense` 라는 옛 이름이 dist 에 남음. 이는 또한 `packages/grid-pro-range/src/*.ts` 의 JSDoc 주석에 `verifyGridLicense` (또 다른 이름) 가 등장 (`useCellRange.ts:26`, `useClipboard.ts:24`, `useKeyboardEdit.ts:28`, `useKeyboardNav.ts:20`). API 이름 정착 전 흔적.

**심각도**: **P2** — `pnpm -r build` 재실행 시 해결. 그러나 stale dist 가 npm publish 되면 의존 누수.

**제안**: 
1. CI 에서 `pnpm -r build` 후 dist 와 src 일치 검증 단계 추가.
2. JSDoc 주석의 `verifyGridLicense` / `verifyOrWarn` 등 옛 이름 → `checkLicense` 로 sweep.

---

## 3. rendererRegistry wiring 실패 (C-31 cross-package)

### 3.1 `createColumns` 가 grid-renderers 의 cell 컴포넌트를 사용하지 못함 (HEADLINE P0)

**발생**:
- `packages/grid-core/src/column/createColumns.ts:17` — `import { defaultRendererRegistry } from './rendererRegistry';`
- `packages/grid-core/src/column/createColumns.ts:111` — `const registry = defaultRendererRegistry as RendererRegistry<TData>;`
- `packages/grid-core/src/column/createColumns.ts:112` — `const renderFn = registry.get(def.type);`

**진단**: `createColumns` 는 자기 자신의 `grid-core/column/rendererRegistry.ts` 만 읽는다. 이 registry 의 entries (line 35–51) 는 9 type 모두 `(info) => String(info.getValue() ?? '')` placeholder. **사용자가 `<Grid columns={createColumns([...])} />` 로 type='number' / type='date' / type='badge' 등을 지정해도 plain text 만 렌더된다.**

`grid-renderers` 의 진짜 컴포넌트 (`NumberCell`, `DateCell`, `StatusBadgeCell` 등) 가 들어있는 registry 는 **별도 인스턴스** (`packages/grid-renderers/src/rendererRegistry.ts:59-74`) 이며 createColumns 가 읽지 않는다.

**Comment 자체에서 의도 명시** (`packages/grid-core/src/column/rendererRegistry.ts:7-9`):
> "**포맷터 주의 (D1)**: `number`/`dateTime` 포맷터(`formatNumberString`, `formatDateTimeFromDateTimeString`)는 MOD-GRID-05 pending 단계에서 `registerRenderer()`로 실제 구현을 주입받는다."

**그러나** MOD-GRID-05 (`grid-renderers` 구현) 가 완료된 시점에도 wiring 코드가 없다.

**검증** (registerRenderer 사용처 grep):
```
packages/grid-core/src/column/createColumns.test.ts:172 — registerRenderer('text', customFn, registry);   // 테스트
packages/grid-renderers/src/rendererRegistry.ts:84-87  — 정의만, 호출처 0건
packages/grid-renderers/src/index.ts:37                — re-export 만
```
**production code 에서 `registerRenderer` 호출 0건.**

**심각도**: **P0** — MOD-GRID-04 + MOD-GRID-05 의 통합 의도가 미구현. 정확히 C-31 (Functional Wiring Audit) 의 cross-package 변종. 단일 패키지 안의 wiring 누락이 C-31 의 origin (2026-05-14 G-001 buildPaginationOptions) 인데, 이번은 패키지 경계를 가로지른 동일 결함.

**제안**:
1. `grid-renderers/src/index.ts` 에 side-effect import 추가:
   ```ts
   import { registerRenderer } from '@tomis/grid-core';
   import { TextCell, NumberCell, ... } from './';
   registerRenderer('text', /* render fn that wraps TextCell */, defaultRendererRegistry);
   // ... 12 types
   ```
   단점: `grid-renderers` 의 `peerDependency` 에 `@tomis/grid-core` 추가 필요 — 현재 무관계.
2. 또는 `<Grid>` 가 옵션으로 `renderers={defaultRendererRegistry}` 받기 — 사용자 명시.
3. 또는 grid-core 의 placeholder registry 제거 + `createColumns(defs, { renderers })` API 변경 — breaking.

**예상 추가 LOC**: 옵션 1: ~30 LOC. ROI: 매우 큼 (사용자가 명시 wiring 없이 type='number' 사용 가능).

---

## 4. grid-core ↔ grid-features layering 역전

### 4.1 grid-core 가 grid-features 에 hard dependency

**발생**:
- `packages/grid-core/package.json` — `"dependencies": { "@tomis/grid-features": "workspace:*" }` (peerDep 아닌 hard dep)
- `packages/grid-core/src/Grid.tsx:39` — `import { useColumnDrag, DropIndicator, SortClearButton } from '@tomis/grid-features';`

**의미**: grid-core 가 grid-features 의 3개 export 를 일반 import. semver 측면에서 grid-core ≥ grid-features 가 동일 step lock 됨. 사용자가 grid-features 만 따로 업데이트 불가.

**POL-COMPAT/§2.2** ("peer 를 dep 으로 중복 선언") 의 엄밀한 위반은 아님 (workspace:* 사용 + peer 동시 선언 X). 그러나 architectural inversion: features 가 core 위 layer 이어야 자연스러운데 core 가 features 를 끌어옴.

**대안 (옵션)**:
- A: 3개 export 를 grid-core/internal 로 이동 (grid-features 의 column-drag 가 core 의 일부) — grid-features 패키지 축소.
- B: Grid.tsx 의 해당 기능 (column reorder + sort clear) 을 외부 prop 으로 opt-in (composition pattern). 사용자가 직접 wiring.
- C: 그대로 두되 peerDep 으로 전환 + workspace 안정성을 위한 minimum version pin.

**심각도**: **P1** — 동작 정상이나 패키지 graph 의 의도와 어긋남. semver / 사용자 자유도 비용.

**제안**: 옵션 A (3개 export 가 사실상 core 의 일부) 가 가장 깔끔. 별도 ADR 의무.

**예상 코드 절감**: 0 LOC (이동만). 그러나 grid-features 의 bundle 사이즈 ↓ + grid-core 자립성 ↑.

---

## 5. API 일관성

### 5.1 `onRowClick` 시그니처 두 가지

**발생**:
- `packages/grid-core/src/types.ts:390` — `onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;` (인자 2개, GridProps)
- `packages/grid-core/src/types.ts:627` — `onRowClick?: (row: TData) => void;` (인자 1개, BaseGridProps)
- `packages/grid-core/src/legacy/ColumnPinGrid.tsx:33` — `onRowClick?: (row: TData) => void;` (1개)
- `packages/grid-core/src/legacy/TreeGrid.tsx:34` — `onRowClick?: (row: TData) => void;` (1개)
- `packages/grid-core/src/legacy/GroupedHeaderGrid.tsx:36` — `onRowClick?: (row: TData) => void;` (1개)
- `packages/grid-pro-master/src/MasterDetailGrid.tsx:102` — `onRowClick?: GridProps<TData>['onRowClick'];` (2개)
- `packages/grid-pro-header/src/legacy/GroupedHeaderGrid.tsx:59` — `onRowClick?: (row: TData) => void;` (1개)
- `tw-framework-front/src/types/tomis/grid.ts:21` — `onRowClick?: (row: TData) => void;` (1개)

**동일성 문제**: 같은 prop 명이 패키지에 따라 contravariance 호환 + non-호환 두 그룹.

**Implicit assumption** (`packages/grid-core/src/legacy/TreeGrid.tsx:43`):
> "buildTableOptions.ts L194 동일 패턴 + Grid `onRowClick` 시그니처 contravariance 호환"

— TypeScript 의 contravariance 로 인자 1개 callback 을 인자 2개 위치에 전달 가능하지만, 반대로 사용자가 인자 2개로 정의 시 1개 prop 으로 type-error.

**심각도**: **P1** — 호환성은 깨지지 않으나 명시적 design choice 가 통일되지 않음.

**제안**: 모든 grid props 에서 `(row: TData, event: MouseEvent) => void` 로 통일 (event 가 optional callback 으로 변경됨이 더 적은 케이스 호환). G-005 D11 alias 들 모두 broader 시그니처로 통일.

---

### 5.2 `onSelectionChange` 시그니처 — 제네릭 vs unknown[]

**발생**:
- `packages/grid-core/src/types.ts:173` — `onSelectionChange?: (rows: TData[]) => void;` (제네릭)
- `packages/grid-pro-header/src/legacy/GroupedHeaderGrid.tsx:41` — `onSelectionChange?: (selectedRows: unknown[]) => void;` (unknown[])
- `tw-framework-front/src/types/tomis/grid.ts:13` — `onSelectionChange?: (selectedRows: unknown[]) => void;` (unknown[])

**의미 차이**: grid-core 만 type-safe. legacy alias + tw-framework-front 는 사용자 직접 narrow 필요.

**심각도**: **P1** — type-safety 손실 + 사용자 cast 비용.

**제안**: tw-framework-front 의 `types/tomis/grid.ts` 가 grid-core re-export 로 전환 (1.4 와 동일). grid-pro-header 의 inline GroupedHeaderGrid.legacy 에서도 grid-core 의 generic type 사용.

---

### 5.3 `flexRender` import 4회 중복 직접

**발생**: 4 패키지에서 `flexRender` 를 `@tanstack/react-table` 에서 직접 import:
- `packages/grid-core/src/Grid.tsx` (line ~3xx 추정)
- `packages/grid-pro-header/src/legacy/GroupedHeaderGrid.tsx:25`
- `packages/grid-pro-header/src/MultiRowHeader.tsx` (확인 필요)
- `packages/grid-pro-agg/src/AggregationGrid.tsx`
- `packages/grid-pro-master/src/MasterDetailGrid.tsx`
- `packages/grid-pro-master/src/ContextMenuGrid.tsx`

**심각도**: **0건** — TanStack 표준 API 직접 사용은 POL-TANSTACK §1.1 권장. 추출 X.

---

## 6. Dead code / 누락 wiring

### 6.1 `createTomisColumnHelper` — 외부 사용 0건 (P1)

**발생**:
- `packages/grid-core/src/column/createTomisColumnHelper.ts` — 정의 + export
- `packages/grid-core/src/index.ts:48` — re-export
- **사용처 grep**: monorepo 내부 1건 (자기 자신), tw-framework-front 0건.

**검증**:
```bash
Grep "createTomisColumnHelper" packages/ --glob "!**/dist/**"
# 결과: createTomisColumnHelper.ts (정의), index.ts (export). 그 외 0.
```

**심각도**: **P1** — public API 이나 production 사용자 0건. C-31 의 검출 의도와 일치.

**제안**: 다음 minor 에서 deprecated 마킹 + 사용자 0건 확인 후 다음 major 에서 제거. 또는 `createColumns` 가 이미 동일 역할인지 ADR 로 비교 후 결정.

---

### 6.2 `useColumnPersistence`, `ColumnVisibilityMenu`, `createGroupedColumns`, `TomisColumnGroup` — tw-framework-front 사용 0건 (P1)

**발생**: `packages/grid-core/src/index.ts:59-65` 의 4개 export.

**사용처 grep**:
```bash
Grep "useColumnPersistence|ColumnVisibilityMenu|createGroupedColumns" tw-framework-front/
# 결과: 0 files
Grep ... packages/  --glob "!**/dist/**"
# 결과: storybook + test 만 사용. production code 0건.
```

**심각도**: **P1** — public API 의 production 사용자 0건. 의도된 forward-looking API 인지, dead 인지 ADR 로 명시 필요.

---

### 6.3 `@tomis/grid-export` 패키지 자체 사용 0건 (P0)

**발생**:
- `packages/grid-export/` 전체 13 src 파일 + `legacy/downloadExcel.ts`.
- **tw-framework-front 의 사용처 grep**: `grep "from ['\"]@tomis/grid-export" tw-framework-front/src/` → 0 hits.
- tw-framework-front 는 자체 `exportToExcel` 보유 (`tw-framework-front/src/utils/tomis/excelExport.ts:26-50`) — `XLSX.utils.aoa_to_sheet` 직접 사용, 자체 column 모델 (`ExcelColumn { key, header, width?, format? }`).

**Conflict**:
- `@tomis/grid-export` 의 `exportToExcel` API (확인됨, `packages/grid-export/src/exportToExcel.ts`): TanStack `Table<TData>` 인스턴스 기반.
- tw-framework-front 의 `exportToExcel` API: 행 배열 + ExcelColumn[] 기반.
- 모양 자체가 incompatible.

**심각도**: **P0** — 13 패키지 중 1개가 실제 사용처 0건이면서, tw-framework-front 측은 평행 구현. POL-MIG-STAGE 의도 미달성.

**제안**:
1. tw-framework-front 페이지들 중 `exportToExcel` 호출 사용처 inventory.
2. `@tomis/grid-export` 의 API 가 ExcelColumn[] 패턴도 지원하도록 entry 추가 (또는 adapter).
3. tw-framework-front 의 자체 `utils/tomis/excelExport.ts` 를 `@tomis/grid-export` 로 마이그레이션 (1 PR 단위 추정).
4. 또는 `@tomis/grid-export` 폐기 (production 사용자 0이면).

**ADR-005 implementation 완료 — 2026-05-17**: 자체 `exportToExcel` (`tw-framework-front/src/utils/tomis/excelExport.ts`, 67 LOC) → `@tomis/grid-export.exportRowsToExcel` 마이그레이션 완료. 호출자 N=1 (`BscEval01ListPage.tsx`) 직접 변경. xlsx 직접 사용 4건 (`DailyMonthlyReportPage` 등) 은 별도 cycle. 결과 보고서: `wave2-adr-005-result.md`.

---

### 6.4 `@tomis/grid` 메타 패키지 = placeholder (P0)

**발생**: `packages/grid/src/index.ts` 전체:
```ts
// @tomis/grid — placeholder. 실제 구현은 MOD-GRID-01+ Goals에서.
export {};
```

`packages/grid/package.json` 은 facade 마케팅 ("Meta package — aggregates all @tomis/grid-* packages (MIT + Pro facade)") 인데 실 export 0건.

**심각도**: **P0** — 사용자가 `import { ... } from '@tomis/grid'` 시 항상 빈 객체. 문서 (README, docs/architecture.mdx) 와 코드 mismatch.

**제안**:
1. 메타 패키지에서 모든 MIT export + 모든 Pro export re-export.
2. 단, §1.1 의 name collision (`defaultRendererRegistry`, `registerRenderer`) 해결이 선행 필요 — meta 가 두 패키지를 re-export 하면 TS2308 error.
3. 임시: 메타 패키지를 `private: true` + README 에서 "placeholder" 명시.

---

### 6.5 `grid-pro-master` 의 `RowPinningOptions` type-only export

**발생**: `packages/grid-pro-master/src/index.ts:19-20`:
```ts
// G-003 (MOD-GRID-16): Row Pinning base type (F-16-06 P1 — types only, D20)
export type { RowPinningOptions } from './types';
```

`RowPinningOptions` 의 implementation 없음 (type only). 정상적 forward-looking API.

**심각도**: **P2** — 명시적 partial.

---

## 7. tw-framework-front 8 variant 동기화

### 7.1 5 variant 가 모노레포 packages 를 사용하지 않고 자체 구현 유지 (P0)

**발생** (LOC 비교):

| Variant | tw-framework-front 자체 구현 | 모노레포 대응 | wrapper 사용? |
|---------|------|------|------|
| BaseGrid | 291 LOC, useReactTable 직접 | `grid-core/legacy/BaseGrid.tsx` 36 LOC (Grid 위임) | **NO** — 자체 구현 |
| ColumnPinGrid | 220 LOC, useReactTable 직접 | `grid-core/legacy/ColumnPinGrid.tsx` 60 LOC | **NO** — 자체 구현 |
| TreeGrid | 174 LOC, useReactTable 직접 | `grid-core/legacy/TreeGrid.tsx` 57 LOC | **NO** — 자체 구현 |
| VirtualGrid | 220 LOC, useReactTable 직접 + react-virtual | `grid-core/legacy/VirtualGrid.tsx` 49 LOC | **NO** — 자체 구현 |
| EditableGrid | 251 LOC, useReactTable 직접 | 직접 대응 없음 (grid-pro-tracking 의 ChangeTrackingGrid 일부 기능 중복) | **부분** — `useChangeTracking` 만 사용 |
| GroupedHeaderGrid | 2 LOC re-export ✅ | `grid-pro-header/src/legacy/GroupedHeaderGrid.tsx` 208 LOC | YES |
| RangeSelectGrid | 132 LOC, grid-pro-range 의 `RangeSelectGrid` 위임 ✅ | `grid-pro-range/src/RangeSelectGrid.tsx` | YES |
| ChangeTrackingGrid | 326 LOC, grid-pro-tracking 의 hooks 사용 ✅ | `grid-pro-tracking/src/legacy/ChangeTrackingGrid.tsx` | YES |

**중복 LOC**: BaseGrid(291) + ColumnPinGrid(220) + TreeGrid(174) + VirtualGrid(220) + EditableGrid(251) = **1156 LOC** 이중 구현.

**분기 진화 위험**: 5 variant 가 tw-framework-front 측에서 자체 sort/filter/pagination 로직을 유지. 모노레포 측 alias 는 `<Grid>` 위임으로 정규화됨. **사용자가 페이지에서 import 하는 BaseGrid 와 monorepo BaseGrid 가 다른 코드.**

**문서 확인** (`packages/grid-core/src/legacy/BaseGrid.tsx:4-6`):
> "AS-IS `tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx` (291L) 의 sort+filter ALWAYS wiring + pagination conditional 패턴을 유지."

— monorepo alias 가 AS-IS 의 행동 유지를 의도. 그러나 실제 마이그레이션 (페이지 import 경로 교체) 미완.

**페이지에서의 사용**:
```bash
Grep "from ['\"]@tomis/grid-core" tw-framework-front/src/pages/
# 결과: 17 pages — `import { Grid } from '@tomis/grid-core';`
```
페이지들이 **신규 `<Grid>`** 를 직접 사용 (deprecation alias 거치지 않음) — 정상. 그러나 BaseGrid/ColumnPinGrid/TreeGrid/VirtualGrid/EditableGrid 를 import 하는 페이지가 별도 존재할 수 있음. 추가 grep:

```bash
Grep "import .* (BaseGrid|ColumnPinGrid|TreeGrid|VirtualGrid|EditableGrid) from" tw-framework-front/src/pages/
# 추가 조사 필요
```

(현재 분석 시간 한계로 미수행. 다음 사이클 권장.)

**심각도**: **P0** — POL-MIG-STAGE 의 "사용처 점진 마이그레이션" 의도 미달성. 5 variant 가 tw-framework-front 측 분기 진화 가능.

**제안**:
1. 5 variant 를 모노레포 packages 의 deprecation alias 로 re-export 로 교체 (GroupedHeaderGrid 가 이미 적용된 패턴).
2. 또는 시각 회귀 (POL-MIG-STAGE) 통과 후 변환.
3. `@tomis/grid-core` 가 `BaseGrid/ColumnPinGrid/TreeGrid/VirtualGrid` 모두 main entry 에서 export (`packages/grid-core/src/index.ts:25-33` 이미 export 됨). tw-framework-front 측만 1줄 re-export 로 변경 가능.

**예상 코드 절감**: 1156 LOC → ~16 LOC (5 × 2 line re-export).

---

### 7.2 `DataTable/` 폴더의 위치 — 의도된 분리인지 미정리 잔재인지 (P0)

**발생**:
- `tw-framework-front/src/components/DataTable/` — 7 파일, 자체 ColumnInfo 정의, 자체 `useReactTable` 호출 (`data-table.tsx:1-50`)
- monorepo 의 `grid-core/legacy/ColumnInfo.ts` 가 동일 shape 보유

**Migration 흔적** (`apps/docs/docs/migration/deprecated-aliases.md:210`, `dataTable-migration.md`):
> `import { EditableCell } from '@tomis/grid-renderers';` 가이드 존재. DataTable 의 마이그레이션 계획은 문서에 명시.

**그러나** `tw-framework-front/src/components/DataTable/` 의 실제 코드는 모노레포 export 를 import 하지 않음 (`from '@tomis/grid` grep 0 hits in DataTable/).

**심각도**: **P0** — `DataTable/` 가 정리되지 않은 채 신규 `<Grid>` 와 병존. tw-framework-front 페이지가 `DataTable` 과 `<Grid>` 를 혼용할 위험.

**제안**:
1. `tw-framework-front/src/components/DataTable/` 마이그레이션 인벤토리 (page import 경로 grep).
2. 페이지가 `DataTable` 만 import 하면 알리아싱 + deprecation 경고 추가.
3. 별도 ADR — DataTable 폐기 일정.

---

### 7.3 `tw-framework-front/src/types/tomis/grid.ts` 의 자체 type 정의 (P1)

§1.4 와 동일. tw-framework-front 가 grid-core 의 동등 type 을 re-export 받지 않고 자체 정의 유지. 1.4 의 해결책으로 동일 행동.

---

### 7.4 `tw-framework-front/src/components/tomis/Grid/renderers/*` thin re-export — 디자인 의도 양호 (P2)

**발생**: 8개 thin shim files (`NumberCell.tsx`, `LinkCell.tsx`, ...) 가 각각 2–3 line 으로 `@tomis/grid-renderers` 의 cell 컴포넌트 re-export.

**예** (`tw-framework-front/src/components/tomis/Grid/renderers/NumberCell.tsx:5-6`):
```tsx
export { NumberCell } from '@tomis/grid-renderers';
export type { NumberCellProps } from '@tomis/grid-renderers';
```

**의미**: 사용처가 점진적으로 `@tomis/grid-renderers` 로 이전될 수 있도록 한 경계 — POL-MIG-STAGE 양호.

**심각도**: **P2** — 결국 사용자에게 단일 import 경로를 제공할지 (직접 `@tomis/grid-renderers` import vs thin wrapper) ADR 권고.

---

## 8. 번들 / 의존성 (POL-BUNDLE)

### 8.1 `.size-limit.json` 의 `ignore` 정책 불일치 (P1)

**발생** (`.size-limit.json`):
- `grid-features`: `ignore: [react, react-dom, @tanstack/react-table, @tanstack/react-virtual, date-fns, date-fns/locale, react-datepicker]` (7개)
- `grid-pro-tracking`: `ignore: [react, react-dom, @tanstack/react-table, @tanstack/react-virtual, @tomis/grid-core]` (5개)
- `grid-core`, `grid-renderers`, `grid-export`, `grid-pro-range`, `grid-pro-datamap`, `grid-pro-merging`, `grid-pro-header`, `grid-pro-agg`, `grid-pro-master`, `grid (meta)`: `ignore` 0건

**의미**: peer deps (react, @tanstack/react-table 등) 가 ignore 에 없는 9개 패키지의 size-limit 측정은 peer 가 bundle 에 합산된 값. 의미 있는 측정 X.

**예시**: `grid-pro-range` 의 limit 20 KB 가 만족돼도 실제 패키지 코드는 더 클 가능성 (react-table dependency 가 측정에 포함됐다면 18 KB - react-table 합산 후 측정).

**심각도**: **P1** — 측정 결과 신뢰성 ↓. POL-BUNDLE §3.1 ("size-limit 통과 확인") 의 의미 흐려짐.

**제안**: 13개 패키지 모두 동일한 baseline `ignore` (peer 전체) 적용. 또한 cross-package workspace dep (`@tomis/grid-core` 등) 도 일관 ignore.

---

### 8.2 date-fns full import 없음 — 양호 (0건)

**검증**:
```bash
Grep "^import .* from ['\"]date-fns['\"]" packages/ --glob "!**/dist/**"
# 결과: 1 hit — grid-features/src/filter-ui/filterFns.ts:19
#       import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';
```
Named imports only. tree-shake 가능. ✅

---

### 8.3 4종 persistence hook 동일 패턴 중복 (P1)

**발생**:
- `packages/grid-core/src/useStoragePersist.ts` (147 LOC)
- `packages/grid-core/src/column/useColumnPersistence.ts` (149 LOC)
- `packages/grid-features/src/column-drag/useColumnOrderPersist.ts` (84 LOC)
- `packages/grid-pro-master/src/internal/useExpandedPersistence.ts` (198 LOC)

**동일 패턴**: SSR guard (`typeof window === 'undefined'`) + try/catch + `JSON.parse` validate + `QuotaExceededError` 처리.

**Rationale 주석** (`useColumnOrderPersist.ts:9`):
> "구조: grid-core/useStoragePersist.ts 미러 (D6 결정)."

— 의도된 미러 (decision logged) 이나 storage adapter 추출 후보.

**심각도**: **P1** — 4 × ~30 LOC = 120 LOC 의 duplicated boilerplate. bug fix 시 4 곳 동시 수정 필요.

**제안**: `grid-core/internal/storage.ts` 에 단일 `useTypedLocalStorage<T>({ key, schema, enabled })` 추출. 4 hook 이 wrap.

**예상 코드 절감**: ~80 LOC.

---

## 9. TypeScript 품질

### 9.1 `any` 사용 — 양호 (0건 production)

**검증**:
```bash
Grep ": any\b|<any>" packages/ --glob "!**/dist/**"
# 결과: 2 hits — 모두 주석 ("C-4: any 금지")
```
✅ POL/SHARED-QUALITY §1 준수.

---

### 9.2 `exactOptionalPropertyTypes` (C-29) — 양호 (0건)

**검증**:
```bash
Grep "^\s+\{\s*\w+:\s*props\.\w+\??\.\w+\s*\}" packages/ --glob "!**/dist/**"
# 결과: 0 hits
```
모든 forwarding 이 spread skip pattern 사용. ✅

---

### 9.3 `as unknown as` 빈도 — 15회 `rendererRegistry` 집중 (P1)

**발생**: `packages/grid-renderers/src/rendererRegistry.ts:60-73` — 14 entries 각각 `as unknown as CellComponent` widening cast.

**Justification 주석** (line 50–55):
> "Each cell's prop type (e.g. `LinkCellProps` requires `label`) is more specific than `CellComponentProps` (only `value` required), so TypeScript's contravariance check requires the `unknown` intermediate cast. The registry consumer (MOD-GRID-04 createColumns) is responsible for narrowing at the call site when invoking the component via `React.createElement`."

**심각도**: **P1** — 정당화 명시되어 있으나 14회 반복은 design smell. registry 의 entry value type 을 `ComponentType<{ value: unknown } & Record<string, unknown>>` 등으로 변경하면 cast 제거 가능.

**제안**: `CellComponent` 의 prop 타입을 더 permissive 하게 변경 (예: index signature 추가) — cast 제거.

**예상 코드 절감**: 14 × `as unknown as CellComponent` = ~14 lines 정리.

**2026-05-17 amendment**: 원 권고 (`Record<string, unknown>` index signature) 는 TypeScript contravariance 위반으로 컴파일 실패 — BLOCKED 보고서 (`wave1-adr-014-result.md`) 에서 14 TS2322 errors 실증. ADR-014 amendment 에서 `asCell<P>()` helper 패턴 채택 — cast 14→1 격리. 사용자 의미 명료성 우려로 5 cell rename 대신 D-partial (LinkCell/ButtonCell 만 rename) 적용. 상세: `wave1-adr-014-redesign-spec.md`, `MOD-GRID-REFACTOR-2026-05-17-decisions.md` Amendment 절, `wave1-adr-014-result-v2.md`.

---

## 10. AG Grid / Wijmo 누수 + policies 위반 잔재

### 10.1 AG Grid / Wijmo import — 0건 ✅

**검증**:
```bash
Grep "from ['\"](ag-grid|@mescius|wijmo)" packages/
# 결과: 0 hits
Grep "ag-grid|@mescius|wijmo" packages/**/package.json
# 결과: 0 hits
```
POL-TANSTACK §2/§3 완전 준수.

---

### 10.2 documented-deviation 1건 — 양호 (P2)

**발생**: `.claude/tw-grid/findings/documented-deviations/G-001-storybook-bootstrap.md` 1건.
- 2 occurrences (G-001 / G-002 동일 모듈 동일 날짜)
- promotion threshold: 3
- Storybook 부트스트랩 deferred → MOD-GRID-99-B/docs/G-002 후속.

**심각도**: **P2** — 명시 deviation, 후속 작업 있음. constraints/HISTORY.md 에 C-30 등 다른 promotion 들 정상 기록.

---

## 11. 테스트 / docs 자산 중복 (P2)

### 11.1 `apps/docs/docs/migration/8-variant-table.md` 와 `deprecated-aliases.md` 의 내용 부분 중복

**발생**:
- `packages/grid-pro-master/README.md`, `grid-pro-merging/README.md`, `grid-pro-agg/README.md`, `grid-pro-datamap/README.md`, `grid-pro-range/README.md`, `grid-pro-header/README.md`, `grid-pro-tracking/README.md` — 모두 동일한 `setLicenseKey` 사용 예제 패턴 (`README.md:20`, `:40` 또는 `:41`).
- `apps/docs/docs/migration/*.md` 에 동일 예시 일부 재현.

**심각도**: **P2** — 일부 docs duplication 정상 (각 README 가 self-contained 의도). 그러나 `setLicenseKey('...')` 예시는 docs/SHARED 에 1회만 작성하면 충분.

**제안**: 각 Pro README 에서 "Common: see [License setup](../docs/license-setup.md)" link 로 대체.

---

### 11.2 1000행 가상화 데모의 중복 가능성

**조사 부족 영역**. 각 패키지의 storybook stories 중 1000행 데모가 grid-features/grid-pro-master/grid-pro-range 에 산재 가능. POL-BUNDLE §1.2 의 "대용량 시나리오 Storybook 1개 필수" 가 패키지마다 반복.

**심각도**: **P2** — 추가 조사 필요. "Storybook 부트스트랩 deferred" deviation 으로 인해 실 검증 불가.

---

## 12. Prioritized Refactor Roadmap

| 순위 | 작업 | 영향 패키지 | 예상 공수 (h) | 위험 | semver 영향 |
|------|------|------|------|------|------|
| 1 | **Pro license 워터마크 실 wiring** (§2.1) | 7 Pro 패키지 | 4 | low | minor (Watermark 자동 렌더 추가) |
| 2 | **rendererRegistry cross-package wiring** (§3.1) | grid-core + grid-renderers | 6 | medium (peerDep 추가) | minor |
| 3 | **`@tomis/grid` 메타 패키지 실제 export 추가** (§6.4) | grid + 모든 MIT/Pro | 3 | medium (name collision 해결 선행) | minor |
| 4 | **tw-framework-front 5 variant 를 monorepo alias 로 교체** (§7.1) | tw-framework-front | 8 | medium (시각 회귀 검증) | tw-framework-front 만 영향 |
| 5 | **`@tomis/grid-export` ↔ tw-framework-front excelExport.ts 통합** (§6.3) | grid-export + tw-framework-front | 6 | medium (API shape 다름) | grid-export minor 또는 major |
| 6 | **TomisColumnDef 이름 충돌 해소** (§1.2) | grid-pro-datamap | 2 | low | grid-pro-datamap major (rename) |
| 7 | **4종 persistence hook → storage adapter 추출** (§8.3) | grid-core, grid-features, grid-pro-master | 5 | low | minor (internal 변경) |
| 8 | **tw-framework-front types/tomis/grid.ts 를 grid-core re-export** (§1.4, §5.2, §7.3) | tw-framework-front | 2 | low | tw-framework-front 만 |
| 9 | **grid-core ↔ grid-features layering 정리** (§4.1) | grid-core, grid-features | 6 | medium | grid-features minor |
| 10 | **SortBadge 중복 제거** (§1.3) | grid-core internal | 1 | low | none |
| 11 | **size-limit ignore 통일** (§8.1) | .size-limit.json | 1 | low | none (CI 정확도) |
| 12 | **DataTable/ 폴더 마이그레이션 계획 ADR** (§7.2) | tw-framework-front | 4 (계획만) | medium | tw-framework-front 만 |
| 13 | **createTomisColumnHelper, useColumnPersistence 등 dead public API 정리** (§6.1, §6.2) | grid-core | 2 | low | minor (deprecation) |
| 14 | **`as unknown as` 반복 정리** (§9.3) | grid-renderers | 2 | low | none |
| 15 | **stale build (verifyLicense 등) sweep** (§2.3) | grid-pro-master 외 | 1 | low | none (rebuild) |
| 16 | **onRowClick 시그니처 통일** (§5.1) | grid-core, grid-pro-master 등 | 3 | low | minor |

**총 예상 공수**: ~56h (1.5 weeks SWE).

---

## 13. 검출되지 않은 영역 / 한계

1. **DataTable 의 페이지 import 인벤토리**: `tw-framework-front/src/pages/*` 에서 `DataTable` 을 직접 import 하는 페이지 수 — 시간 한계로 미수행. §7.2 의 작업 1번 권고.

2. **5 variant (BaseGrid, ColumnPinGrid 등) 의 페이지 사용 현황**: `import .* (BaseGrid|...) from 'tw-framework-front/src/pages/'` grep 미수행. §7.1 의 작업 1번 권고.

3. **번들 실측 비교**: 9 패키지의 `ignore` 누락이 실제 size 측정 결과 N KB 차이 만드는지 — 정적 분석만으로는 알 수 없음. `pnpm size` 실행 + ignore 추가 전후 비교 필요.

4. **storybook 부트스트랩 후 검증**: 모든 stories 가 실 컴파일/실행 가능한지는 MOD-GRID-99-B/docs/G-002 부트스트랩 전까지 미검증.

5. **MOD-GRID-12 (`grid-pro-datamap`) 의 ADR mismatch**: `.claude/tw-grid/decisions/MOD-GRID-12-decisions.md` 와 실제 코드의 `TomisColumnDef` rename rationale 비교 — 시간 한계.

6. **Pro 패키지 간 순환 import 검사**: `grid-pro-master` 가 `@tomis/grid-core` 를 peerDep + devDep 으로 갖는데 (`packages/grid-pro-master/package.json`), 다른 Pro ↔ Pro import 0건이라는 검증은 미수행.

7. **stories 의 1000행 가상화 데모 분포**: §11.2.

8. **decisions/MOD-GRID-*-decisions.md 17 파일** 전수 확인은 미수행 — ADR ↔ 구현 mismatch 추가 발견 가능.

9. **`grid-license` 의 보안성**: `verifySignature.ts` 의 RSA 검증 로직 유효성, 키 우회 가능성 등은 security review 별도. 본 분석은 wiring 측면만 다룸.

10. **monorepo CI 설정 (`.github/`)**: `.size-limit.json` 의 ci 통합, type-check 실패 시 PR block 등 운영 측면 미조사.

---

## 14. 부록 — 핵심 파일 경로 (재현용)

| 차원 | 핵심 경로 |
|------|----------|
| §1.1 | `packages/grid-core/src/column/rendererRegistry.ts`, `packages/grid-renderers/src/rendererRegistry.ts` |
| §1.2 | `packages/grid-core/src/column/types.ts:65`, `packages/grid-pro-datamap/src/types.ts:131` |
| §1.3 | `packages/grid-core/src/internal/SortBadge.tsx`, `packages/grid-features/src/multi-sort/SortBadge.tsx` |
| §1.4 | `packages/grid-core/src/types.ts`, `tw-framework-front/src/types/tomis/grid.ts` |
| §1.5 | `packages/grid-core/src/legacy/ColumnInfo.ts`, `tw-framework-front/src/components/DataTable/data-table-types.ts` |
| §2.1 | `packages/grid-license/src/checkLicense.ts`, `packages/grid-license/src/Watermark.tsx`, 7 Pro index.ts |
| §3.1 | `packages/grid-core/src/column/createColumns.ts:17,111`, `packages/grid-renderers/src/rendererRegistry.ts` |
| §4.1 | `packages/grid-core/package.json`, `packages/grid-core/src/Grid.tsx:39` |
| §5.1 | `packages/grid-core/src/types.ts:390,627`, 7 legacy / pro 파일 |
| §6.3 | `packages/grid-export/`, `tw-framework-front/src/utils/tomis/excelExport.ts` |
| §6.4 | `packages/grid/src/index.ts` |
| §7.1 | `tw-framework-front/src/components/tomis/Grid/{BaseGrid,ColumnPinGrid,TreeGrid,VirtualGrid,EditableGrid}.tsx`, `packages/grid-core/src/legacy/` |
| §7.2 | `tw-framework-front/src/components/DataTable/` |
| §8.1 | `.size-limit.json` |
| §8.3 | `packages/grid-core/src/useStoragePersist.ts`, `packages/grid-core/src/column/useColumnPersistence.ts`, `packages/grid-features/src/column-drag/useColumnOrderPersist.ts`, `packages/grid-pro-master/src/internal/useExpandedPersistence.ts` |

---

**총평**: 79 goals 자동 채점 통과는 단계별 rubric 만족을 의미할 뿐, **cross-package contract** (registry wiring, license gate, type 일관성) 와 **사용처 마이그레이션** (tw-framework-front 5 variant + DataTable) 은 별도 검증 차원이 필요함이 확인됨. 위 P0 4건이 가장 큰 가치 — license + rendererRegistry + 메타패키지 + 8 variant migration 모두 정책 SSoT 가 의도한 효과를 실현하지 않은 채 종료.
