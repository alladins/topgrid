# topgrid 마스터 Hierarchy / 관계 복합도 (SSoT)

> **이 문서의 위상**: `@topgrid` 그리드 제품(13패키지)의 **단일 검증 기준(SSoT)**이다.
> "모듈별 → 기능리스트 → API/표면 → 커맨드/연결/세부 → 관계 복합도"를 한 곳에 모아,
> 앞으로 기능 검증·회귀 점검 시 항상 이 문서를 기준점으로 참조한다.
> 근거 소스는 `docs/internal/architecture.md`, `docs/internal/modules/*`, 그리고
> `packages/*/src/index.ts` 의 실제 export 표면이다. 추측이 아니라 소스 대조로 작성한다.
>
> **완성 범위**: 전체 골격 + **전 20모듈**(`mod-grid-00`~`17`, `renderers`, `99-a`, `99-b`)을
> 실제 소스 대조로 채움 완료. 발견된 gap 은 전부 §5.2 에 집약했으며, 대부분 소스 주석/README/manifest 의
> 경미한 stale·drift 수준(public 문서·런타임 동작 영향 없음)이고, 동작에 영향이 있는 단 1건(mod-grid-13 의
> `react-virtual` 정적 top-level import)만 별도 구분한다(§5.3).

---

## 1. 개요 — 13패키지 의존 Hierarchy

### 1.1 패키지 구성과 라이선스 경계

`architecture.md`(§1.1)의 분류를 canonical 로 따른다: **4 MIT + 1 meta + 8 Pro(기능 7 + license 1)**.
`grid-license` 는 런타임 게이트의 기반으로 Pro tier 에 속하되, 라이선스 자체는 독점(EULA)이다.

| 패키지 | 디렉토리 | tier | 라이선스 표기 | 역할 |
|--------|---------|------|--------------|------|
| `@topgrid/grid-core` | `packages/grid-core` | MIT | `MIT` | `<Grid>` + state hook + 컬럼 팩토리 + 페이지네이션 + 영속화. **추상화의 중심** |
| `@topgrid/grid-renderers` | `packages/grid-renderers` | MIT | `MIT` | 표시 셀 11종 + 편집 셀 1종 + 렌더러 레지스트리 + side-effect 와이어링 |
| `@topgrid/grid-features` | `packages/grid-features` | MIT | `MIT` | 컬럼 reorder · 멀티 정렬 · 필터/날짜 UI(add-on) |
| `@topgrid/grid-export` | `packages/grid-export` | MIT | `MIT` | Excel / PDF / CSV export |
| `@topgrid/grid` | `packages/grid` | meta | `SEE LICENSE IN EULA` | 13패키지 public API 를 한 진입점으로 모으는 facade |
| `@topgrid/grid-pro-agg` | `packages/grid-pro-agg` | Pro | EULA | 집계(aggregation) · group footer |
| `@topgrid/grid-pro-datamap` | `packages/grid-pro-datamap` | Pro | EULA | 코드↔라벨 매핑(foreign-key 표시) 셀 |
| `@topgrid/grid-pro-header` | `packages/grid-pro-header` | Pro | EULA | 다단(multi-row) 헤더 · 컬럼 그룹 |
| `@topgrid/grid-pro-master` | `packages/grid-pro-master` | Pro | EULA | master-detail · context menu · row pinning |
| `@topgrid/grid-pro-merging` | `packages/grid-pro-merging` | Pro | EULA | body 셀 rowSpan 자동 병합 |
| `@topgrid/grid-pro-range` | `packages/grid-pro-range` | Pro | EULA | 셀 범위 선택 · 클립보드 · 키보드 편집/내비 |
| `@topgrid/grid-pro-tracking` | `packages/grid-pro-tracking` | Pro | EULA | 변경 추적(change tracking) · mapping · validator |
| `@topgrid/grid-license` | `packages/grid-license` | Pro(EULA) | `SEE LICENSE IN EULA` | 라이선스 키 검증 + 워터마크 enforcement. Pro 게이트 기반 |

### 1.2 의존 방향 다이어그램

```
                 grid-renderers ─┐
 grid-core  ◄──── grid-features  ├─ (모두 grid-core 에 peer 의존, 역방향 없음)
                 grid-export      │
                 grid-pro-*     ─┘
                 grid-license  ◄── grid-pro-* (런타임 게이트 — dependency)
                 grid (meta)   ──► 위 전부를 re-export (workspace:* dependency)
```

> **주의(실측 불일치)**: 위 "모두 grid-core 에 peer 의존" 기술은 일부 패키지에서 **실제 manifest 와 어긋난다** —
> `grid-features` 는 grid-core 를 **dependency** 로 선언하고, `grid-pro-merging` 은 grid-core 를 peer 로 선언했으나
> src 에서 import 하지 않는다(미사용 peer). 자세한 사실관계는 §5.2 의 **G-deps** 행 참조.

**핵심 불변식**(architecture.md §1.2, §5.1):

- `grid-core` 는 자신보다 위 레이어의 어떤 패키지에도 의존하지 않는다. 과거 역방향
  의존(column drag / sort clear)은 grid-core `internal/` 로 옮기고 grid-features 가
  public alias 로 re-export 하도록 정상화했다.
- renderers / features / export / Pro 는 grid-core 를 **peer dependency** 로 둔다
  (hard dep 아님 → 버전 step-lock 회피).
- MIT 패키지는 Pro·license 패키지를 import 하지 않는다(라이선스 경계 단방향).
- Pro 패키지는 `@topgrid/grid-license` 를 **런타임 dependency** 로 두고, index
  module-load 시 `checkLicense()` 를 호출한다.
- meta `@topgrid/grid` 만 전 패키지를 `workspace:*` **dependency** 로 끌어와 facade re-export
  + side-effect 로 grid-renderers import(레지스트리 wiring 보존).

### 1.3 peer / optional-peer 관계 (외부 라이브러리)

| peer | 범위 | 적용 패키지 | optional |
|------|------|------------|----------|
| `react` / `react-dom` | `^18 \|\| ^19` | 전 패키지 | 필수 |
| `@tanstack/react-table` | `^8` | grid-license 외 전 패키지 | 필수 |
| `@tanstack/react-virtual` | `^3` | grid-core·grid-pro-merging 필수, 일부 패키지 | 패키지별 상이 |
| `xlsx` | `^0.18.5` | grid-export(**필수**), meta(optional) | 패키지별 상이 |
| `jspdf` / `jspdf-autotable` | `^2.5` / `^3.5` | grid-export, meta | optional |
| `date-fns` / `react-datepicker` | `^4.1` / `^8.3` | grid-features 전용 | 필수 |

---

## 2. 기능 택소노미 정의 (그리드 라이브러리 적응판)

원본 ERP 택소노미(종결형/연결형/트리거)는 메뉴·페이지 기준이라, 그리드 **라이브러리**
관점으로 재정의한다. 라이브러리는 "사용자 동작"뿐 아니라 **패키지 간 wiring**과 **라이선스
게이트**라는 축이 더 필요하므로 3개 추가형을 둔다.

| 분류 | 정의 | 그리드 예시 |
|------|------|-----------|
| **종결형 (Terminal)** | 그 자리에서 완결되는 그리드 동작. 외부 wiring 없이 입력→출력이 닫힘 | 정렬, 필터, 셀 렌더(TextCell 등), 페이지네이션, 클램프/포매팅 |
| **연결형 (Connecting)** | 패키지·모듈 간 wiring. 레지스트리 주입, peer/re-export, 콜백 위임, core↔features 경계 | `wireDefaultRenderers` side-effect, `createColumns` type→셀 디스패치, alias 의 `<Grid>` 합성, meta facade re-export |
| **트리거 (Trigger)** | 이벤트/콜백 훅. 사용자 입력·DOM 이벤트가 상위로 전파 | `onRowClick`, `onCellKeyDown`, `EditableCell.onCommit/onStartEdit`, `onSelectionChange` |
| **워크플로형 (Workflow)** | 다단계 state 머신 — 편집/추적 commit·rollback, snapshot/undo | `useChangeTracking`(add/edit/delete→commit→rollback), EditableCell draft state, optimistic 롤백 |
| **연동형 (External)** | 외부 optional peer 라이브러리와의 연동 경계 | `xlsx`/`jspdf`(export), `date-fns`/`react-datepicker`(features) |
| **출력형 (Output)** | Excel/CSV/PDF/clipboard/print 등 외부 산출 | `exportRowsToExcel`, 클립보드 복사(grid-pro-range), `commitChanges` 의 네트워크 전송 |
| **권한가드 (License-Guard)** | 라이선스 게이트 · 워터마크 enforcement | `useLicenseStatus`, `useWatermarkEnforcement`, Pro 컴포넌트의 `<Watermark>` 합성 |

> **다중 분류 원칙**: 한 기능이 여러 형에 걸칠 수 있다. 예) `createColumns` 의 type
> 디스패치는 **연결형**(레지스트리 조회) + 결과 셀 렌더는 **종결형**. `EditableCell.onCommit`
> 은 **트리거**(이벤트) → 상위 추적의 **워크플로형**으로 이어진다. `commitChanges` 는
> **워크플로형**(state RESET/rollback) + **출력형**(fetch 전송). 매트릭스에서 주 분류를
> 앞에 쓰고 보조 분류를 `+`로 병기한다.

---

## 3. 모듈별 기능 매트릭스

각 모듈 표 컬럼: **기능 / API 표면 / 분류 / 연결 관계 / 세부 / 상태**.
전 20모듈을 모듈 번호 순서(`00 → 01 → 02 → 03 → 04 → renderers(05) → 06 → … → 17 → 99-a → 99-b`)로 채웠다.
모듈별로 발견된 gap 은 §3 표 안에 적지 않고 §5.2 에 집약한다.

### `mod-grid-00` — 모노레포 인프라 ✅ 채움

소스: `docs/internal/modules/mod-grid-00.md`, 루트 `package.json`, `tsconfig.base.json`, `.size-limit.json`, `packages/grid-core/tsup.config.ts`, `packages/grid-core/package.json`, `packages/grid-export/package.json`, `packages/grid/package.json`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 패키지 분할(MIT/Pro) | 13패키지 디렉토리 구조 `packages/grid-*` + `license` 필드(MIT vs `SEE LICENSE IN EULA`) | **연결형** + 권한가드 | AG Grid(community MIT + enterprise 상용) 구조와 동일. MIT 소비자는 Pro 코드를 받지 않음(라이선스 경계 단방향) | 4 MIT(core/renderers/export/features) + 8 Pro(기능 7 + license) + 1 meta. `publishConfig.access: "public"` 전 배포대상 공개. `apps/docs` 는 `private` | 채움 |
| 메타 facade | `@topgrid/grid` 가 전 sub-package 를 `dependencies: "workspace:*"` 로 aggregate | **연결형** | peer-only 아님 — facade 로서 하위 12패키지 직접 끌어와 re-export. side-effect import 로 renderers wiring 보존(`sideEffects` 선언) | meta `package.json` 의 `dependencies` 12개 + `sideEffects: ["./src/index.ts", "./dist/index.mjs", "./dist/index.cjs"]` | 채움 |
| tsup dual format | 각 패키지 `build` 스크립트 = `tsup` 한 단어. 산출 `dist/index.{mjs,cjs,d.ts}` | **출력형** + 종결형 | `format: ['cjs','esm']` + `outExtension` 로 `.mjs`/`.cjs` 명시 산출. `main`/`module`/`types` + `exports` 맵으로 CJS/ESM/타입 동시 소비 | `dts:true`·`sourcemap:true`·`clean:true`·`splitting:false`(단일 진입)·`treeshake:true`. esbuild 기반 → 설정 ~15줄 minimal | 채움 |
| 서브패스 exports | `exports` 맵 `"."` + `"./legacy"` + `"./internal/storage"` (grid-core 예) | **연결형** | tree-shaking 입자도 향상 — `/legacy` 미import 시 메인 번들 미혼입. `/internal/storage` 는 sister 패키지(`@topgrid/grid-pro-master`)와 공유하는 내부 primitive | `./legacy`=하위호환 진입점. `./internal/storage`=내부 SSR/JSON I/O — **semver-stable public API 아님**(외부 계약 대상 X) | 채움 |
| peer 매트릭스(SSoT) | `peerDependencies` + `peerDependenciesMeta` 의 버전 범위 단일 관리 | **연동형** | tsup `external` 배열과 항상 일관(peer 의 빌드 측 반영). react 중복 번들·이중 인스턴스 방지, `pnpm install` WARN 으로 누락 조기 경고 | `react`/`react-dom` `^18 \|\| ^19`(전 패키지 필수) · `@tanstack/react-table` `^8`(license 외) · `react-virtual` `^3`(core 필수, 대부분 optional) · `xlsx` `^0.18.5`(export 필수, meta optional) · `jspdf`/`jspdf-autotable`(optional) · `date-fns`/`react-datepicker`(features 전용) | 채움 |
| export xlsx 필수 게이트 | grid-export `peerDependenciesMeta.xlsx.optional: false` | 연동형 + 종결형 | Excel export 가 기본 기능 → 필수. PDF 계열(`jspdf`/`jspdf-autotable`)은 optional(미설치 시 PDF 만 미사용) | meta 에서는 `xlsx` 도 optional 로 완화. grid-license 는 react/react-dom peer 만(react-table 미사용) | 채움 |
| workspace 의존 | `workspace:*` 패키지 간 참조 + 일부 `devDependencies` 중복 선언 | **연결형** | Pro 패키지는 grid-core 위에 빌드 + grid-license 에 의존(런타임 게이트). pnpm topological build 순서 보장 위해 devDep 중복 | 메타만 전 패키지 `dependencies: workspace:*`. grid-core 는 `@topgrid/grid-renderers` 를 devDep 으로(wiring 빌드용) | 채움 |
| 번들 예산(size-limit) | 루트 `.size-limit.json` (12 엔트리) + `@size-limit/preset-small-lib` | **종결형** | CI 한도 초과 시 exit 1 로 병합 차단 가능. 측정 전 `pnpm -r build` 선행 필수(대상 = `dist/index.mjs`) | brotli 기준 측정. peer lib(react/tanstack/xlsx/jspdf 등)는 `ignore`. 한도: core 30KB · renderers 12KB · export/features/pro-* 각 20KB · meta 150KB. grid-license 제외 | 채움 |
| strict tsconfig | 공유 `tsconfig.base.json` 을 전 패키지 `extends` | **종결형** | tsup 빌드와 별개로 `tsc --noEmit`(각 패키지 `typecheck`)가 타입 검증 담당. ESLint `no-explicit-any: 'error'` 가 빌드 전 강제 | `strict`/`noImplicitAny`/`exactOptionalPropertyTypes`/`skipLibCheck:false`/`isolatedModules`/`verbatimModuleSyntax`/`moduleResolution:"bundler"`. 앱보다 엄격(d.ts 오류 은폐 금지) | 채움 |
| 릴리스(Changesets) | `@changesets/cli` — `changeset`/`changeset version`/`changeset publish` | **종결형** | 패키지별 독립 CHANGELOG 자동 갱신. 내부 패키지 bump 는 소비 패키지에 patch 전파(`updateInternalDependencies: "patch"`) | semver 기능 단위 진행. ESLint flat config(v9, 루트 `eslint.config.mjs`)가 모노레포 품질 게이트 | 채움 |
| Pro 라이선스 진입점 | 각 Pro 패키지 index module-load `checkLicense()` | **권한가드** | `@topgrid/grid-license` 런타임 dependency. import 시 검증 → 미인증 시 워터마크 | 라이선스 검증 런타임 자체 명세는 **모듈 경계**(mod-grid-99-a / grid-license 소관) | 채움 |

### `mod-grid-01` — `@topgrid/grid-core` 통합 `<Grid>` 래퍼 (중심) ✅ 채움

소스: `packages/grid-core/src/index.ts`, `docs/internal/modules/mod-grid-01.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 핵심 래퍼 | `Grid<TData>` 컴포넌트 | 연결형 + 종결형 | TanStack `useReactTable`/`flexRender` 흡수, `column.cell`/레지스트리 셀 호출 | `data`(required, controlled) · `columns: ColumnDef[]` · generic `<TData>` 명시 | 채움 |
| enable* 조건부 wiring | `enableSort/MultiSort/Filter/Pagination/ColumnPinning/ColumnResizing/Expanding/Virtualization` | 종결형 | 각 TanStack row model 조건부 와이어(끄면 비용 0) | 8토글, 기본 false. 필터 UI 는 컬럼 정의 책임 | 채움 |
| 행 선택 | `rowSelection` prop, `RowSelectionMode`, `GridRowSelectionOptions<TData>` | 종결형 + 트리거 | `__select__` 체크박스 컬럼 자동 prepend, 체크박스 셀 `stopPropagation` | `mode: single/multi/none` · `onSelectionChange(rows: TData[])` · controlled state/onStateChange | 채움 |
| 페이지네이션(래퍼 필드) | `pagination`, `GridPaginationOptions` | 종결형 | `manual=true` 시 TanStack `manualPagination`(서버). UI 는 mod-grid-03 | `pageSize`(20) · `pageSizeOptions` · `totalCount`(서버 필수) · controlled | 채움 |
| 행/셀 이벤트 | `onRowClick`·`onRowDoubleClick`·`onCellClick`·`onCellKeyDown` | **트리거** | DOM 버블 순(셀→행) 둘 다 발화. 행 막으려면 셀에서 `stopPropagation` | `(row, event)` / `(cell, row, event)` 통일 시그니처. `<td>` focus 주의(자식이 focusable) | 채움 |
| 로딩/빈상태/자동선택 | `loading`·`loadingRowCount`·`emptyState`·`emptyText`·`autoSelectFirstRow` | 종결형 | skeleton 은 `<tbody>`만 치환(thead 보존), colSpan=`getAllLeafColumns().length` | 빈상태 우선순위 slot→text→기본. 자동선택 effect 의존성은 data **길이** | 채움 |
| 트리/펼침 | `getSubRows`·`defaultExpanded` | 종결형 + 연결형 | `enableExpanding` 와 함께. TreeGrid alias 가 `expandAll→defaultExpanded` 매핑 | `defaultExpanded: true`=전체펼침 / `{}`=접힘 (uncontrolled 초기값) | 채움 |
| sticky 핀 / 리사이즈 | `columnResizeMode`·`default/onColumnSizingChange`·`default/onColumnPinningChange` | 종결형 | 핀 시 `border-separate` 전환(border-collapse 비양립), sticky offset 매 렌더 계산 | z-index 3레이어(thead10/body핀20/thead핀30). 동적 offset/shadow 만 인라인 style | 채움 |
| 조건부 스타일 | `cellClassName`·`rowClassName`, `CellClassNameCallback`·`RowClassNameCallback` | 종결형 | 타입 canonical = grid-core, grid-renderers 는 type-only re-export(역의존 방지) | 매 셀/행 렌더 호출 → className append. 가상화 시 static 권장 | 채움 |
| 가상화 | `enableVirtualization`·`virtualScrollHeight`·`virtualizerOptions` | 종결형 | single-table padding-row 패턴(sticky/핀 보존), `useVirtualizer.measureElement` | opt-in 전용(자동 임계값 미채택). estimateSize 36 / overscan 10 | 채움 |
| mutation 콜백 | `onAddRow`·`onDeleteRow`·`onUpdateRow`·`onStartEditing` | **연결형**(위임) + 트리거 | controlled data — 직접 변경 X, 부모 setState 위임. 미제공 시 dev warn+no-op | seed/patch/rowId/colId 인자. TanStack controlled 철학과 일관 | 채움 |
| imperative handle | `GridHandle<TData>`(ref), `GridScrollToOptions` | **연결형**(위임) | mutation→콜백 위임, scroll→virtualizer/`scrollIntoView` fallback, selection→table 직접 | `addRow/deleteRow/updateRow/scrollTo/getSelection/clearSelection/refresh` + optional `startEditing/expandAll/collapseAll` | 채움 |
| 호환 alias | `BaseGrid`·`VirtualGrid`·`ColumnPinGrid`·`GroupedHeaderGrid`·`TreeGrid`(+Props), `useDeprecationWarn` | 연결형 | `@topgrid/grid-core/legacy` sub-entry. `<Grid>` 에 props 매핑. **deprecated** | mount 시 dev 1회 경고. ref API 미적용(AS-IS 동등) | 채움 |
| state 분리(MOD-GRID-02) | `useGridState`·`useUrlSync`·`useStoragePersist`(+타입) | (mod-grid-02) | — | grid-core export 지만 본 모듈 범위 밖 → §3 `mod-grid-02` 참조 | 모듈 경계 |
| 컬럼 팩토리(MOD-GRID-04) | `createColumns`·`registerRenderer`·`defaultRendererRegistry`(grid-core placeholder) | (mod-grid-04) | grid-renderers wiring 의 주입 대상 | §3 `mod-grid-04` 참조 | 모듈 경계 |

### `mod-grid-02` — `@topgrid/grid-core` state hooks ✅ 채움

소스: `packages/grid-core/src/index.ts`, `docs/internal/modules/mod-grid-02.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| state 통합 훅 | `useGridState<TData>(options?)` → `GridState<TData>` | **종결형** + 트리거 | TanStack 8 표준 state(`SortingState`/`ColumnFiltersState`/`RowSelectionState`/`PaginationState`/`ColumnPinning`/`ColumnOrder`/`ColumnSizing`/`Visibility`) 통합. setter 는 `OnChangeFn<T>` 라 `useReactTable` `onXxxChange` 에 직접 연결(와이어는 호출부 책임 → `<Grid>`=mod-grid-01 모듈 경계) | 8 state + 8 setter 반환. `expanded` 는 의도적 제외(그리드 컴포넌트 소유). 옵션 미지정 시 8키 모두 uncontrolled 기본값(pagination 기본 `{pageIndex:0,pageSize:10}`) | 채움 |
| controlled/uncontrolled/mixed | `UseGridStateOptions.initialState`·`state` | 종결형 | 키 단위 controllable — `state[key]` 존재 시 그 키만 controlled(외부 진실, setter 는 `onStateChange` 만 발화), 없으면 내부 `useState` | 같은 키 `initialState`+`state` 동시 지정 시 controlled(`state`) 우선·`initialState` 무시. 마운트 후 controlled↔uncontrolled 전환 시 dev 1회 경고 | 채움 |
| 변경 통보 + debounce | `UseGridStateOptions.onStateChange`·`debounceMs` | **트리거** | `onStateChange(next, changedKey)` 전체 snapshot + 변경 키 전달. controlled/uncontrolled 양쪽 발화 | debounce 자체 구현(`useRef`+`setTimeout`, 외부 lib 비의존). `ms<=0`·미설정 동기 호출, `>0` 마지막 변경 후 1회. 언마운트 시 타이머 정리 | 채움 |
| reset 헬퍼 | `GridState.resetState()`·`resetSection(key|key[])` | 종결형 | controlled 키 reset 은 값 직접 변경 X → `onStateChange` 만 발화(외부가 갱신 책임) | 초기값은 마운트 시 `initialState` 1회 캡처·고정. `resetSection` 배열 중복 키 dedup(멱등) | 채움 |
| 선택 해제 트리거 | `UseGridStateOptions.clearSelectionKey` | **트리거** | 값 변경 신호로 `rowSelection` 을 `{}` 로 자동 reset. 새 검색 시 이전 선택 비우는 패턴 | 타입 `string|number` 한정. 마운트 시 미트리거(불필요 reset 방지), 이후 값 변경부터 동작 | 채움 |
| URL 동기화 helper | `useUrlSync<TData>(state, options?)` → `void`, `UseUrlSyncOptions` | 종결형 + **연결형(위임)** | hydration 은 hook 이 state 소유 X → `onHydrate(partial)` 로 호출부 위임(setter 반영). 직렬화 로직은 storage helper 와 공유(§5.3) | `window.history.replaceState` 직접 사용(라우터 비의존). `keys`(기본 8키)·`debounceMs`·`prefix`. 기본값 키 param 삭제·타 param 보존·`JSON.parse` 실패 키 skip | 채움 |
| 스토리지 영속화 helper | `useStoragePersist<TData>(state, options)` → `void`, `UseStoragePersistOptions` | 종결형 + **연결형(위임)** | URL helper 와 동일 패턴(void + `onHydrate`). `{v,p}` envelope 에 URL 직렬화 문자열 재사용 | `storageKey`(필수)·`version`(기본1)·`storage`(local/session)·`debounceMs`(기본300). version 불일치/손상 시 `removeItem`+미hydrate. `QuotaExceededError`→skip+warn. SSR/스토리지 비가용 no-op | 채움 |
| 타입 계약 | `GridState`·`GridStateValues`·`GridStateKey`·`UseGridStateOptions`·`UseUrlSyncOptions`·`UseStoragePersistOptions` | 종결형(계약) | 8키 union(`GridStateKey`)·값만(`GridStateValues`)은 URL·storage helper 의 동작 단위. 타입은 TanStack state 타입 그대로(별도 래핑 없음) | `GridState`=8 state+8 setter+reset. 모두 `<TData=unknown>` generic | 채움 |

### `mod-grid-03` — `@topgrid/grid-core` 페이지네이션 ✅ 채움

소스: `packages/grid-core/src/index.ts`, `packages/grid-core/src/pagination/{GridPagination,PageSizeSelect,TotalCount,PageNumbers,types}.tsx`, `packages/grid-core/src/internal/buildPaginationOptions.ts`, `packages/grid-core/src/internal/buildTableOptions.ts`, `packages/grid-core/src/legacy/DataTablePagination.tsx`, `packages/grid-core/src/legacy/index.ts`, `packages/grid-core/src/Grid.tsx`, `docs/internal/modules/mod-grid-03.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| mode 통합 진입점 | `PaginationMode`(`'client' \| 'server' \| 'none'`), `GridPaginationOptions.mode` | 종결형 + 연결형 | `buildPaginationOptions()` 가 mode→TanStack `TableOptions` 조각 변환 후 `buildTableOptions` 가 merge. `mode` > 저수준 `manual` | `manualPagination = paginationFromMode ?? (manual===true)` (L194). `mode='client'\|'server'` 시 `impliedEnablePagination=true` → `enablePagination` 토글 없이 자동 활성(D5) | 채움 |
| server pageCount 해소 | `GridPaginationOptions.pageCount` / `.totalCount` / `.pageSize` | 종결형 | `buildPaginationOptions`(isServer 분기)에서만 계산 → `options.pageCount`/`options.rowCount` 세팅 | `resolvedPageCount = pageCount ?? Math.ceil(totalCount/pageSize)` (pageSize>0). 직접 지정 우선. totalCount→`rowCount` (ADR-MOD-GRID-03-003) | 채움 |
| controlled 콜백 배선 | `GridPaginationOptions.onPaginationChange`·`pageIndex` | 트리거 + 연결형(위임) | `buildTableOptions` 의 `onPaginationChange` 핸들러(L152)가 외부 콜백 호출 — controlled 위임 | `OnChangeFn<PaginationState>`. 내부 setState 후 외부 콜백 전파 | 채움 |
| 페이지네이션 컨테이너 | `GridPagination<TData>` 컴포넌트, `GridPaginationProps<TData>` | 연결형 + 종결형 | TanStack `Table` API(`getState().pagination`/`getPageCount`/`getCan*Page`/`setPageIndex`)로 동작. `PageSizeSelect`+`TotalCount`+nav 버튼+`PageNumbers` 조합 | `table` 만 required. nav 화살표는 HTML entity(`«‹›»`). 건수 = server+totalCount 시 `totalCount`, 아니면 `getFilteredRowModel().rows.length` (L95) | 채움 |
| 페이지 크기 선택(leaf) | `PageSizeSelect`, `PageSizeSelectProps` | 종결형 + 트리거 | `GridPagination` 이 `setPageSize(size)` 후 `setPageIndex(0)` 수행(pageIndex reset 호출부 책임) | `React.memo`. 네이티브 `<select>`, 라벨 "페이지당 행 수:". `onPageSizeChange(size)` 만 발화 | 채움 |
| 전체 건수 표시(leaf) | `TotalCount`, `TotalCountProps` | 종결형 | `GridPagination` 이 `showTotalCount !== false` 일 때만 렌더(기본 true, D7/3.7) | `React.memo`. "전체 **N**건"(`<strong>`). `<Grid>` 는 `showTotalCount` 만 전달 | 채움 |
| 숫자 페이지 버튼 | `PageNumbers` (internal, **미-export**) | 종결형 | `GridPagination` 내부에서만 사용. L0 `data-table-pagination.tsx` getPageNumbers() 알고리즘 흡수 | 슬라이딩 윈도우 max 5(중앙 정렬, 끝단 시작점 보정), 좌/우 `…`, current=disabled+active(파란 배경)+`aria-current="page"`/`aria-label`. `pageCount<=0` → `null` | 채움 |
| 키보드 내비 | `GridPaginationProps.enableKeyboardNav`(기본 false) | 트리거 | `GridPagination` container `ref` scope `keydown` 리스너(document 전역 금지 → multi-grid 안전). cleanup 에서 `removeEventListener` | Alt+←=`previousPage`, Alt+→=`nextPage`. 이동 전 `getCan*Page()` 가드. **`<Grid>` 선언 경로는 미전달 — 직접 렌더 시에만 유효** | 채움 |
| `<Grid>` 선언 전달 한계 | `<Grid pagination={...}>` → `<GridPagination>` spread (Grid.tsx L487-493) | 연결형(부정) | 그리드가 `mode`·`totalCount`·`pageSizeOptions`·`showTotalCount` 4개만 조건부 spread 전달 | `enableKeyboardNav`·`pageCount`·`onPaginationChange` 는 컴포넌트로 미전달 → 키보드 이동/pageCount prop 필요 시 `GridPagination` 직접 렌더 필요(문서화된 한계) | 채움 |
| Props 선언-미사용 | `GridPaginationProps.pageCount`·`.onPaginationChange` | 연결형(부정) | 인터페이스 선언만 존재, 컴포넌트 본문 미사용 — 페이지 수는 `table.getPageCount()` 에서 직접 읽음 | 소스 사실: GridPagination 본문은 `pageCount`/`onPaginationChange` 를 구조분해도 하지 않음 | 채움 |
| deprecated 별칭 | `DataTablePagination<TData>`, `DataTablePaginationProps<TData>` (`@topgrid/grid-core/legacy`) | 연결형(위임) + 트리거 | `<GridPagination table={...} totalCount?>` 로 위임. `useDeprecationWarn('DataTablePagination')` 마운트 1회 경고 | `{ table, totalCount? }` TanStack 시그니처. `totalCount` 조건부 spread(exactOptionalPropertyTypes). 미전달 시 filtered rows 수. 1 minor 후 제거(C-23) | 채움 |
| exactOptional 전달 패턴 | (구현 규약 — 비-export) | 연결형 | `<Grid>`→`GridPagination` 및 `DataTablePagination`→`GridPagination` 전달 시 적용 | `...(x !== undefined ? { x } : {})` 조건부 spread — `undefined` 리터럴 직접 할당 차단(C-29, D8) | 채움 |
| 외부 UI 비의존 | (설계 결정 — peer 0) | 연동형(부정) | shadcn/ui·@radix-ui·react-icons 를 peerDep 로 추가하지 않음 | 네이티브 `<select>` + HTML entity 화살표(`«‹›»`)/말줄임(`…`). Tailwind className only. 소비자 UI 스택 비강제(D4/3.4) | 채움 |
| state hooks(MOD-GRID-02) | `useGridState`·`useUrlSync`·`useStoragePersist` | (mod-grid-02) | — | grid-core export 지만 본 모듈 범위 밖 → 모듈 경계 | 모듈 경계 |
| 컬럼 팩토리(MOD-GRID-04) | `createColumns`·`registerRenderer`·`TopgridColumnType` | (mod-grid-04) | — | grid-core export 지만 본 모듈 범위 밖 → 모듈 경계 | 모듈 경계 |

### `mod-grid-04` — `@topgrid/grid-core` 컬럼 팩토리 ✅ 채움

소스: `packages/grid-core/src/column/createColumns.ts`, `packages/grid-core/src/column/rendererRegistry.ts`, `packages/grid-core/src/column/types.ts`, `packages/grid-core/src/column/createGroupedColumns.ts`, `packages/grid-core/src/column/createTopgridColumnHelper.ts`, `packages/grid-core/src/index.ts`, `docs/internal/modules/mod-grid-04.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 컬럼 팩토리(핵심) | `createColumns<TData>(defs)` → `ColumnDef<TData>[]` | **연결형** + 종결형 | 연결 = `def.type` 으로 `defaultRendererRegistry.get(type)` 조회 → grid-renderers 가 side-effect 로 주입한 셀 어댑터 슬롯에 디스패치. 종결 = 표준 `ColumnDef` 매핑 | `defs.map` 1:1 변환, `useReactTable({ columns })` 직접 주입. `accessorKey=def.id`(unknown 경유 `keyof TData & string`), `header=def.name` | 채움 |
| type 디스패치(11종) | `TopgridColumnType` union: `checkbox/number/boolean/dateTime/date/text/badge/link/icon/tag/progress` | **연결형** | hard-coded if/else 없음 — `Map.get(type)` 조회 결과로 `cell: (info)=>renderFn(info)` 연결(AG Grid `components` 주입 발상). 미주입 슬롯은 placeholder 가 폴백 | `checkbox` 만 레지스트리 우회(아래 분기). 8슬롯(`text/number/date/dateTime/badge/link/tag/progress`)이 grid-renderers 와이어 대상 | 채움 |
| 렌더러 레지스트리 | `defaultRendererRegistry`(`Map<TopgridColumnType, RendererFn>`), `RendererFn<TData>`, `RendererRegistry<TData>` | **연결형** + 종결형 | grid-renderers `wireDefaultRenderers()` 의 주입 대상(§4). 종결 = graceful degradation — 미import 시에도 11 entry 모두 렌더 가능 | placeholder 기본: 대부분 `String(getValue()??'')`, `boolean→'Y'/'N'`. Map 채택(동적 등록·타입 안전·`get()` undefined 폴백) | 채움 |
| 커스텀 렌더러 등록 | `registerRenderer<TData>(type, fn, registry?)` → void | **연결형** | grid-renderers 가 이 API 로 8슬롯 placeholder 를 실 어댑터로 교체. 사용자 커스텀도 동일 API 로 덮어쓰기(마지막 호출 우선) | `registry` 기본값 `defaultRendererRegistry`. `Map.set()` 단순 위임. 실 셀 컴포넌트 계약은 셀/렌더러 패키지 **모듈 경계** | 채움 |
| 컬럼 정의 입력 타입 | `TopgridColumnDef<TData>`(`id/name/type/align` + `width?/visibility?/enableSorting?/enableResizing?/meta?/etc?`) | 종결형(계약) | — | `id`=accessor key(checkbox 무시). `etc` 에 `'primary'` 포함 시 `meta.primary` 승격(ColumnInfo 호환) | 채움 |
| 표준 매핑 규칙 | (createColumns 내부) `size/minSize/maxSize/enableSorting/enableResizing/meta` | **종결형** | — | `size=parseInt(width??'100')`, `minSize=floor(size*0.5)`, `maxSize=size*3`. sorting/resizing 은 `def.x !== false`(기본 true). `meta={primary, align}` | 채움 |
| `checkbox` 분기 | (DisplayColumnDef 경로) | **종결형** | 레지스트리 우회 — 선택 컬럼은 데이터 키 비바인딩. 실 체크박스 셀은 셀 패키지 **모듈 경계** | `accessorKey` 미생성, `header/cell` 은 `()=>null` placeholder. `enableSorting/enableResizing` 강제 false. `accessorKey` 동반 입력 시 무시 + `console.warn` | 채움 |
| 미등록 type 폴백 | (createColumns 내부) `renderFn === undefined` 경로 | 종결형 | `registry.get(type)` 실패 시 `cell` 키 생략 → TanStack 기본 cell(plain text)로 폴백 | `console.warn`(`Unknown type … Falling back to plain text`). 11종 외 임의 문자열·11종 외 `ColumnInfo.type` 동일 처리 | 채움 |
| `ColumnInfo` 레거시 입력 | `ColumnInfo`(type-only, `@topgrid/grid-core/legacy`) | 종결형(계약) | `createColumns` 가 `TopgridColumnDef` 와 **단일 코드 경로**로 처리(구조 동일, `type: string` 차이뿐) | 과거 `isColumnInfo()`/`normalizeColumnInfo()` heuristic 제거 — 동일 shape 오분류로 미등록 type 을 조용히 `'text'` 강제하던 결함 차단(G-001 hotfix) | 채움 |
| 컬럼 헬퍼(저수준) | `createTopgridColumnHelper<TData>()` | 연결형(re-export) | TanStack `createColumnHelper` 순수 re-export — wrapper 메서드 없음(Option A, ADR-MOD-GRID-04-001) | **@deprecated**(ADR-013, 프로덕션 사용처 없음, 차기 메이저 제거·facade 제외). `createColumns` 또는 TanStack 직접 import 권장 | 채움 |
| 그룹 헤더 팩토리 | `createGroupedColumns<TData>(...groups)`, `TopgridColumnGroup<TData>` | 연결형(thin wrapper) | TanStack `GroupColumnDef` 위 thin wrapper(rest args 그대로 캐스팅 반환). colSpan/placeholder 는 `getHeaderGroups()` 자동 계산 | **@deprecated**(ADR-013, 차기 메이저 제거). 다단 헤더 본 소관은 grid-pro-header **모듈 경계** | 채움 |
| 컬럼 영속화/메뉴 | `useColumnPersistence<TData>`, `ColumnPersistenceOptions`, `PersistTarget`, `ColumnVisibilityMenu`(+Props) | 종결형 | — | **@deprecated**(ADR-013, ADR-007 storage 어댑터로 대체). 본 표는 표면만 — 상세 계약은 §6 차기 제거 API 참조 | 채움 |

### `renderers` — `@topgrid/grid-renderers` 셀 렌더러 ✅ 채움

소스: `packages/grid-renderers/src/index.ts`, `packages/grid-renderers/src/wireRegistry.ts`, `docs/internal/modules/renderers.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 표시 셀 11종 | `TextCell`·`NumberCell`·`DateCell`·`StatusBadgeCell`·`LinkCell`·`ButtonCell`·`CheckCell`·`IconCell`·`TagCell`·`AvatarCell`·`ProgressCell`(+각 Props) | **종결형** | `ColumnDef.cell` 안 호출 or 레지스트리 type 매핑 | 각 셀 value→표시. 빈값 dash, falsy `0` 보존(Text). ProgressCell 동적 width 만 인라인 style | 채움 |
| 편집 셀 | `EditableCell`, `EditableCellProps`, `EditType` | 종결형 + **트리거**→워크플로 | 셀은 leaf, 편집 state 는 컨테이너 소유. `cellClassName` 주입 지점 | view↔edit 모드. `onStartEdit/onCommit/onCancel` 콜백. `initialDraft`(키입력 첫글자 보존, IME 첫글자는 한계) | 채움 |
| 포매팅 헬퍼 | `formatNumberString`·`formatDateTimeFromDateTimeString`(+Options 타입) | **종결형** | 순수 함수(store/state 의존 0) | decimals `[0,20]` 클램프(RangeError 차단), 무효 입력 → `''`(셀이 dash 처리) | 채움 |
| 렌더러 레지스트리 | `defaultRendererRegistry`·`registerRenderer`·`getRenderer`(+`CellComponent`/`Props`) | **연결형** | grid-renderers 가 셀 컴포넌트 canonical 소스. `getRenderer` 미등록 시 undefined | 표시 셀 11종 사전등록 + alias 3키(`dateTime`/`statusBadge`/`check`). EditableCell 미등록(meta.editable 트리거) | 채움 |
| core 레지스트리 주입 | `wireDefaultRenderers()`(internal, side-effect) | **연결형** | import 시 side-effect 로 grid-core `registerRenderer` 호출. `sideEffects` 로 tree-shake 방지 | **8슬롯 와이어**: `text/number/date/dateTime/badge/link/tag/progress`. (`dateTime`·`link` 은 bespoke, 나머지 6은 `adaptValueCell`) | 채움 |
| 와이어 제외(설계) | (비-export 결정) | 연결형(부정) | grid-core placeholder/대체 경로 유지 | `boolean`(Y/N 유지) · `icon`/`button`/`avatar`(value 외 필수 prop → `column.cell` 직접) · `checkbox`(DisplayColumnDef 분기) · alias 키 | 채움 |
| 조건부 스타일 타입 | `CellClassNameCallback`(type re-export) | 연결형 | canonical = grid-core, 여기선 type-only re-export(역의존 방지) | EditableCell 이 해결된 string 을 `cellClassName` 으로 받음 | 채움 |

### `mod-grid-06` — `@topgrid/grid-export` export ✅ 채움

소스: `packages/grid-export/src/index.ts`, `packages/grid-export/src/types.ts`, `packages/grid-export/src/internal/getRowsByScope.ts`, `packages/grid-export/src/legacy/downloadExcel.ts`, `docs/internal/modules/mod-grid-06.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| Excel export (Table) | `exportToExcel<TData>(table, options?)` → `void`, `ExcelExportOptions` | **출력형** + **연동형** | `xlsx`(필수 peer) `aoa_to_sheet`/`writeFile` 동기 호출. `getRowsByScope`(scope)·`getHeaderGroups`(다중행 헤더) | `fileName`(export.xlsx, 확장자 자동) · `sheetName`(Sheet1) · `scope`(filtered) · `emptyBehavior`(skip). `!merges` 로 GroupColumnDef 병합. UTF-8 기본 | 채움 |
| 행배열 Excel (Table 無) | `exportRowsToExcel<TData extends Record<string,unknown>>(rows, columns, options?)` → `void`, `ExcelColumn`, `ExportRowsOptions` | **출력형** + **연동형** | `xlsx` 직접. TanStack 인스턴스/ref 미사용 — 행배열+컬럼정의만 입력. `getRowsByScope` 경로 밖 | `ExcelColumn{key,header,width?(15),format?}`. `scope` 의도적 제외(행배열엔 무의미). `!cols` 너비·헤더 bold/회색 채움(CE 스타일 제한)·`format`(date/datetime/number/currency) 변환 | 채움 |
| CSV/TSV export | `exportToCSV<TData>(table, options?)` → `void`, `CSVExportOptions` | **출력형** | 외부 dep 0(순수 문자열). `getRowsByScope`(scope)·`getLeafHeaders`(단일행 헤더). `Blob`/`createObjectURL`/`<a download>`(브라우저 전용, SSR 불가) | `delimiter`(',' or '\t' → TSV) · RFC 4180 이스케이프(구분자/따옴표/CR·LF → `""` 이중화, CRLF 행구분) · UTF-8 BOM 선행(Excel 한국어 보존) · `fileName`(.csv/.tsv 자동) | 채움 |
| PDF export | `exportToPdf<TData>(table, options?)` → `Promise<void>`, `PDFExportOptions` | **출력형** + **연동형** | `jspdf`+`jspdf-autotable`(optional peer) **동적 import** — 초기 번들 0, 첫 호출 시 로드. 미설치 시 설치안내 Error throw. `autoTable` 1곳 `@ts-expect-error`(타입선언 부재) | `getHeaderGroups`→`head:string[][]` 다중행 헤더, 데이터는 `getLeafHeaders` 순서로 `column.id` 매핑. `title`·`orientation`(p/l). `fontFamily:'korean'`은 **stub**(Helvetica fallback+경고) | 채움 |
| 클립보드 복사 | `copyToClipboard<TData>(table, options?)` → `Promise<void>`, `ClipboardOptions` | **출력형** | 외부 dep 0. `getRowsByScope`·`getLeafHeaders`. `navigator.clipboard.writeText` 우선, 미지원 시 숨은 `<textarea>`+`execCommand('copy')` fallback, 둘 다 실패 시 Error | TSV(탭 구분) — Excel 붙여넣기 호환. RFC quoting 대신 셀 내 탭/CR/LF → **공백 치환**. `scope`(filtered)·`emptyBehavior`(skip)만 | 채움 |
| 인쇄 | `printGrid<TData>(table, options?)` → `void`, `PrintOptions` | **출력형** | 순수 Web API(외부 dep 0). `getRowsByScope`·`getLeafHeaders`. `window.open` 팝업 `<table>` 렌더. 팝업차단(`null`) 시 `console.warn` 후 반환(throw 안 함 — void 계약) | `title`·`orientation`→`@page{size}`. `print()` 는 `popup.onload` 콜백에서 발화, `onload` 핸들러는 `document.write` **이전** 등록(load 유실 방지) | 채움 |
| scope 행해석 단일화 | `getRowsByScope(table, scope)`(internal, 비-export) | **종결형** | Table 기반 6함수(Excel/CSV/PDF/clipboard/print/downloadExcel)가 import 하는 패키지 내부 순수 헬퍼 — scope 의미 복사 금지(모듈 경계 없음, wiring 아님) | `(table, scope)→Row[]` 순수. `all`→`getCoreRowModel` · `filtered`(기본)→`getFilteredRowModel`(정렬 이미 반영) · `selected`→`getSelectedRowModel` | 채움 |
| 빈상태 공통 계약 | `ExportScope`·`EmptyBehavior` 타입(전 옵션 공유) | **종결형**(계약) | `types.ts` single source-of-truth — 5개 옵션 인터페이스가 동일 타입 참조(중복 리터럴 0). 옵션 객체 함수 간 재사용 | `emptyBehavior`는 각 함수 inline 체크: 행 0건+`skip` → 산출 미생성·`console.warn` 후 반환 / `empty` → 헤더만 산출. 셀 `null`/`undefined`→`''`, 비문자열 header→`column.id` fallback | 채움 |
| 하위호환 alias | `downloadExcel<TData>(table, options?)` → `void`, `DownloadExcelOptions` (`@topgrid/grid-export/legacy` 전용) | **연결형**(위임) + 출력형 | `exportToExcel(table, options)` 에 options 전체 spread 위임. **메인 index 비노출** — `/legacy` 하위 경로로만 export(신규 표면 진입 차단) | `@deprecated`(DataTable `buttonInfo.downloadAction` 마이그레이션). `DownloadExcelOptions = Omit<ExcelExportOptions,'scope'> & {scope?}`. scope 기본값 `'filtered'` 는 위임 대상 내부 해석. 1 minor 유지 후 제거 예정 | 채움 |

### `mod-grid-07` — 컬럼 드래그 재정렬 (grid-core internal / grid-features alias) ✅ 채움

소스: `packages/grid-core/src/index.ts`(L77-85, canonical), `packages/grid-features/src/index.ts`(L11-22, deprecated alias), `packages/grid-core/src/internal/column-drag/useColumnDrag.ts`, `packages/grid-core/src/internal/column-drag/useColumnOrderPersist.ts`, `packages/grid-core/src/internal/column-drag/DropIndicator.tsx`, `packages/grid-core/src/internal/column-drag/types.ts`, `docs/internal/modules/mod-grid-07.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| `<Grid>` prop opt-in | `enableColumnReorder`·`onColumnOrderChange`·`persistColumnOrder`·`columnOrderStorageKey`(GridProps 확장) | **연결형** + 트리거 | `<Grid>`(mod-grid-01)가 `enableColumnReorder`→`useColumnDrag({enabled})` 로 wiring. drag+키보드 단일 플래그 제어(§4.2 — `enableKeyboardMove` 같은 별도 prop 없음) | 4개 모두 optional, default false. `persistColumnOrder=true`+키 미지정/빈문자열 → localStorage 접근 0(저장·복원 skip). `onColumnOrderChange(order)`=setColumnOrder 직후 fire | 채움 |
| 통합 드래그 hook | `useColumnDrag<TData>(UseColumnDragProps)` → `UseColumnDragReturn`(`getDragProps`·`dragOverId`·`getKeyDownHandler`) | **종결형** + 트리거 | 커스텀 `<table>` 직접 구성용 공개 hook. `getDragProps`/`getKeyDownHandler` 는 `(columnId, isPinned)` per-header 팩토리. DOM `DragEvent`/`KeyboardEvent` 수신(React 합성 시 `e.nativeEvent` 추출) | HTML5 DnD: `dataTransfer.setData('columnId', id)` 전달 + 내부 ref 보관(`dataTransfer` 빈 경우 fallback). `dragOverId`=drop 인디케이터 표시 컬럼 ID(null=미표시) | 채움 |
| 키보드 이동 | `getKeyDownHandler(columnId, isPinned)` → `(e: KeyboardEvent) => void` | **종결형** + 트리거 | 헤더 `<th>` `onKeyDown`(focus-scoped)에만 연결 — `document.addEventListener` 전역 리스너 미사용(§4.5, 페이지네이션 키 네비 등과 비충돌) | `Alt+←`/`Alt+→` 좌/우 1칸. 처리한 경우에만 `e.preventDefault()`(클릭 정렬·타 키 비충돌). 범위 초과/인접 pinned → no-op | 채움 |
| setColumnOrder 단일경로 | (내부) `table.setColumnOrder(newOrder)` | **종결형** | drag drop·키보드 이동·localStorage 복원 3경로 모두 동일 TanStack v8 표준 API 수렴(§4.3). 평행 state 없음 — `columnOrder` controlled state 가 단일 진실원 | `columnOrder` 빈배열(초기) → `table.getAllLeafColumns()` ID 순서를 baseline 으로 사용 | 채움 |
| pinned 가드(3경로) | (내부) `column.getIsPinned() !== false` | **종결형** | 출발·도착 양쪽 보호(§4.7) — 모듈 자체 알고리즘, 외부 wiring 아님 | (1) pinned → `DragThProps.draggable=false`(브라우저 DnD 비활성) · (2) drop 대상 pinned → drop 핸들러 early return · (3) 키보드: 출발 pinned=no-op, 도착 계산 시 pinned skip | 채움 |
| drag `<th>` props | `DragThProps`(`draggable`·`onDragStart`·`onDragOver`·`onDragLeave`·`onDrop`·`onDragEnd`) | **종결형** + 트리거 | `getDragProps` 반환 객체 — 호출자가 `<th>` 에 spread. `draggable` 은 pinned/비활성 시 false | source===target(같은 컬럼 drop) → 순서 변경 없이 인디케이터 상태만 리셋 | 채움 |
| Web Storage 영속화 hook | `useColumnOrderPersist<TData>(UseColumnOrderPersistProps)` → `{ saveOrder }`(`UseColumnOrderPersistProps`) | **종결형** | `useColumnDrag` 내부에서 사용. mount 시 1회 localStorage→`setColumnOrder` 복원, `saveOrder(order)` 호출 시 저장. `saveOrder` 는 `!enabled \|\| !storageKey` 시 no-op | 모든 localStorage I/O(read/write/remove)는 패키지 내부 `internal/storage` 어댑터(`getStorage`/`readJson`/`writeJson`/`removeKey`, ADR-007 Wave 3)에 위임 — SSR 가드+try/catch, private 브라우징·`QuotaExceededError` silent skip. 비-문자열-배열 JSON → `removeKey` 후 복원 skip(§4.8) | 채움 |
| 콜백 합성 영속화 | (내부) `onColumnOrderChange` + `saveOrder` 일원화 | **연결형**(위임) + 트리거 | `useColumnDrag` 가 외부 `onColumnOrderChange` 콜백과 영속화 `saveOrder` 를 하나의 내부 핸들러로 합성(§4.4) — drag·키보드 무관 순서 변경 시 부모 통지+저장 동시 발화 | 디바운스 없음(사용자 조작 종료 후 1회 fire). `onColumnOrderChange` 미전달 시 optional chaining 무시 | 채움 |
| drop 인디케이터 | `DropIndicator({ dragOverId, columnId })` → `JSX.Element \| null` | **종결형** | 부모 `<th className="relative">` 안 절대위치 파란 수직선(`absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500`). 인라인 `style` 없이 Tailwind className 만 | `dragOverId === columnId` 일 때만 렌더. `aria-hidden`+`pointer-events-none`(순수 시각, 히트테스트 비방해) | 채움 |
| 입출력 타입 | `UseColumnDragProps`·`UseColumnDragReturn`·`DragThProps`·`UseColumnOrderPersistProps`(type) | **종결형**(계약) | `internal/column-drag/types.ts`(+`useColumnOrderPersist.ts`) canonical. `UseColumnDragProps`=`{table, enabled, onColumnOrderChange?, persistColumnOrder?, columnOrderStorageKey?}` | `isPinned`=호출자가 `column.getIsPinned() !== false` 로 산출해 팩토리에 전달 | 채움 |
| grid-features deprecated 재export | `@topgrid/grid-features` → `useColumnDrag`·`DropIndicator`·`useColumnOrderPersist`(+4 타입) | **연결형**(alias) | canonical=`@topgrid/grid-core` `internal/column-drag/`, grid-features 는 `./column-drag/*` 1줄 shim 으로 `export … from '@topgrid/grid-core'` 재export(중복 구현 아님, ADR-009 옵션 A, 1 minor cycle). MASTER §1.2·§4 "type re-export 정상화"·"deprecation alias" wiring 과 일관 | value 3종은 index.ts L11-16 에서 `@deprecated` JSDoc 명시. 신규 코드는 grid-core 에서 import — 차기 메이저 제거 예정 | 채움 |

### `mod-grid-08` — 멀티 정렬 (grid-core SortBadge / grid-features useMultiSort) ✅ 채움

소스: `packages/grid-core/src/index.ts`, `packages/grid-core/src/internal/SortBadge.tsx`, `packages/grid-core/src/internal/multi-sort/SortClearButton.tsx`, `packages/grid-core/src/internal/multi-sort/types.ts`, `packages/grid-features/src/index.ts`, `packages/grid-features/src/multi-sort/{SortBadge,SortClearButton,useMultiSort,types}.ts`, `docs/internal/modules/mod-grid-08.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 다중 정렬 활성(래퍼) | `<Grid enableMultiSort>` (`boolean`, 기본 `false`) | **종결형** | TanStack `enableMultiSort` 에 그대로 위임(값 변환 없음). 정렬 자체는 `RowSorting` row model 에 위임 | opt-in — 미지정 시 기존 단일 정렬 동작 100% 보존, 미설정 사용처 DOM 무변화. `enableSort` 없이 켜면 dev 마운트 1회 경고(no-op 안전) | 채움 |
| 정렬 컬럼 수 제한(래퍼) | `<Grid maxMultiSortColCount>` (`number`, 미설정 시 무제한) | **종결형** | TanStack 네이티브 `maxMultiSortColCount` 에 직접 전달 — 자체 FIFO 전처리 코드 없음(한도/오래된 항목 제거는 TanStack 런타임이 처리) | `props.x !== undefined` 일 때만 옵션에 할당(exactOptionalPropertyTypes — `undefined` 직접 할당 회피, 미설정 시 키 누락→무제한). `=1` 은 사실상 단일 정렬 | 채움 |
| 초기화 버튼 표시(래퍼) | `<Grid showSortClearButton>` (`boolean`, 기본 `false`) | **종결형** | `showSortClearButton === true && enableMultiSort === true` 가드에서만 `SortClearButton` 을 툴바(우측)에 렌더 | 버튼 블록을 컬럼 가시성 툴바와 분리된 별도 `<div>` 로 둠 → 버튼 미사용 사용처 툴바 DOM 무변화 | 채움 |
| 헤더 클릭 분기 | Plain / Shift+Click / Ctrl·Cmd+Click (헤더 핸들러) | **트리거** + 종결형 | Plain→`column.getToggleSortingHandler()`, Shift→`column.toggleSorting(undefined, true)`, Ctrl/Cmd→`table.setSorting(prev => prev.filter(s => s.id !== id))` | `e.ctrlKey \|\| e.metaKey`(Win/Mac 통합). Ctrl 분기를 Shift 보다 먼저 평가 → Shift+Ctrl 동시 시 제거 우선. `enableMultiSort=false` 면 항상 단일 정렬 경로 | 채움 |
| 우선순위 배지 | `SortBadge`(`SortBadgeProps`) — canonical `@topgrid/grid-core` | **종결형** | `<Grid>` 헤더 내부 렌더와 외부 공개 API 가 동일 단일 컴포넌트 공유. 입력은 `header.column.getSortIndex()` | 표시 번호 = `sortIndex + 1`(0-based→1-based, 예 ①). `sortIndex < 0`(미정렬) → `null` 반환(배지 미렌더). `rounded-full` chip, Tailwind only. 구현은 `internal/` 폴더지만 index 정식 export(공개 API) | 채움 |
| 초기화 버튼 | `SortClearButton`(`SortClearButtonProps`) — canonical `@topgrid/grid-core` | **종결형** + 트리거 | 해제 상태 비소유 — 호출자가 `onClear` 에 `table.setSorting([])` 연결(상태는 그리드/테이블 소유). `<Grid showSortClearButton>` 시 툴바 자동 렌더 | `<button type="button">`(폼 auto-submit 차단), 클릭 시 `onClear()`. `label` 기본 '정렬 초기화'. `className` 지정 시 기본 클래스 **대체**. 정렬 0개에서 클릭=no-op | 채움 |
| 비-wrapper 옵션 헬퍼 | `useMultiSort(opts?)` → `UseMultiSortResult` — **소유 `@topgrid/grid-features`** | **연결형** | `useReactTable` 직접 조립 소비자용. 반환값(`enableMultiSort`/`isMultiSortEvent`/`maxMultiSortColCount`)을 `useReactTable` 옵션에 spread. `<Grid>` wrapper 사용자에겐 불필요 | `isMultiSortEvent` = `e.shiftKey` 판정 명시 재현(TanStack 내장 기본과 동일, 문서화 목적). `maxMultiSortColCount` 는 호출자가 값 줄 때만 결과 포함(미설정 시 키 누락 → `undefined` spread 로 무제한 깨짐 방지) | 채움 |
| TanStack 네이티브 직접 전달 | `enableMultiSort` / `isMultiSortEvent` / `maxMultiSortColCount` (옵션 그대로 위임) | **연결형**(위임) | 네이티브 옵션이 존재하고 값 변환 로직이 없는 경우 별도 전처리 wrapper 없이 그대로 전달 | `options` 타입(`Omit<TableOptions,'data'\|'columns'>`)이 `SortingOptions` 경유로 `maxMultiSortColCount` 를 이미 포함 → 타입 충돌 없음. 동작 일관성+번들 최소화 | 채움 |
| 패키지 토폴로지(재export) | grid-features 의 `SortBadge`·`SortClearButton`(+두 Props 타입) | **연결형** | 의존 방향 grid-features → grid-core 단방향. 컴포넌트는 grid-features 자기 파일(`./multi-sort/{SortBadge,SortClearButton}`)에서 export, 두 Props 타입은 `from '@topgrid/grid-core'` 재export | `SortBadge`/`SortBadgeProps`/`SortClearButtonProps` 는 `@deprecated`(차기 메이저 제거, grid-core import 권장). 권장 import: 컴포넌트·타입 4종→grid-core, `useMultiSort`+옵션/결과 타입→grid-features | 채움 |
| 가상화 병용 | (설계 — 배지 위치) | 종결형 | 배지는 sticky thead 에 위치 → 행 가상화와 독립 | `enableVirtualization=true` 와 병용 시 영향 없음. 키보드(Space/Enter, Shift+Enter)도 `getToggleSortingHandler` 가 처리(`shiftKey` 는 KeyboardEvent 에도 존재) | 채움 |
| 필터 UI(MOD-GRID-09) | grid-features 의 `TextFilter`·`NumberFilter`·`DateFilter`·`SelectFilter`·`GlobalSearchInput` 등 | (mod-grid-09) | — | 같은 grid-features index 의 export 지만 본 모듈 범위 밖 → 모듈 경계 | 모듈 경계 |
| 컬럼 드래그(MOD-GRID-07) | grid-features 의 `useColumnDrag`·`DropIndicator`(+core 재export) | (mod-grid-07) | — | 같은 grid-features index 의 export 지만 본 모듈 범위 밖 → 모듈 경계 | 모듈 경계 |

### `mod-grid-09` — `@topgrid/grid-features` 필터 UI ✅ 채움

소스: `packages/grid-features/src/index.ts`, `packages/grid-features/src/filter-ui/filterFns.ts`, `packages/grid-features/src/filter-ui/FilterPopover.tsx`, `packages/grid-features/src/filter-ui/NumberFilter.tsx`, `packages/grid-features/src/filter-ui/DateFilter.tsx`, `packages/grid-features/tsconfig.json`, `packages/grid-features/package.json`, `docs/internal/modules/mod-grid-09.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 텍스트 필터 | `TextFilter<TData>`, `TextFilterOperator`·`TextFilterValue`·`TextFilterProps` | **종결형** + 트리거 | `column.setFilterValue`/`getFilterValue`(TanStack 표준 columnFilters)에 흘림 — store 無. 공유 `FilterPopover`+`FilterIndicator` 합성(intra-module 재사용) | 4연산자 `<select>`(contains/equals/startsWith/endsWith) + 값 `<input>`. 로컬 state → **300ms debounce** 후 `setFilterValue`. trim 후 빈값 → `setFilterValue(undefined)`. 깔때기 SVG 인라인(신규 dep 無), `aria-pressed={getIsFiltered()}` | 채움 |
| 숫자 필터 | `NumberFilter<TData>`, `NumberFilterOperator`·`NumberFilterValue`·`NumberFilterProps` | **종결형** + 트리거 | `setFilterValue`. `FilterPopover`/`FilterIndicator` TextFilter와 동일 컴포넌트 재사용 | 7연산자(`=` `!=` `>` `<` `>=` `<=` `between`). `between` 시 min/max 두 `<input type=number>` 조건부 렌더, 그 외 단일 value input. 단항·min/max 각각 **300ms debounce**. **연산자 전환 시** value/min/max state 전부 비우고 즉시 `setFilterValue(undefined)`(clean state, EC-03). 단방향 bound(한쪽만)도 전송 | 채움 |
| 날짜 필터 | `DateFilter<TData>`, `DateFilterValue`·`DateFilterProps` | **연동형** + 종결형 + 트리거 | `react-datepicker` `<DatePicker>` 2개(from/to) + `date-fns/locale` `ko`. 모듈 로드 시 `registerLocale('ko', ko)` 1회. `setFilterValue` 즉시 호출 | **debounce 없음**(날짜 선택은 이산 이벤트 → 변경 즉시 전송, 텍스트/숫자 300ms와 다른 점). 역전 방지 `maxDate={to}`/`minDate={from}`(값 있을 때만 spread). 둘 다 비면 `undefined`, 한쪽만이면 단방향. 트리거에 `yyyy-MM-dd ~ yyyy-MM-dd` 요약. **CSS 내부 import 無** → 소비자가 `react-datepicker/dist/react-datepicker.css` 직접 import(§4.4) | 채움 |
| 선택 필터 | `SelectFilter<TData>`, `SelectFilterProps` | **종결형** | `column.getFacetedUniqueValues()` `Map<value,count>` 읽어 체크박스 렌더 → `setFilterValue(string[])`. **소비자 와이어링 필수**: `getFacetedRowModel()`+`getFacetedUniqueValues()` 미등록 시 실패(try-catch 안 함, 소비자 책임) | Excel형 다중선택 + 라벨·`(count)`. "전체 선택/해제"(전체 상태 재클릭 → `undefined`). 옵션 `searchThreshold`(50) 이상이면 검색 `<input>` 자동(`String.includes` 대소문자 무시, 외부 검색 lib 無). 빈 문자열 옵션 → `(blank)`, 없으면 `No options`. 모두 해제 → `undefined` | 채움 |
| 전역 검색 | `GlobalSearchInput<TData>`, `GlobalSearchInputProps` | **종결형** + 트리거 | **컬럼 아닌 `Table<TData>` 인스턴스** 입력 → `table.setGlobalFilter`. 소비자가 `globalFilter` state + `onGlobalFilterChange` 등록 필요 | 로컬 state → `debounceMs`(300) 후 전송. trim 후 빈값(공백만 입력 포함) → `setGlobalFilter(undefined)`. `placeholder`(`Search all columns…`) | 채움 |
| 필터 초기화 | `FilterResetButton<TData>`, `FilterResetButtonProps` | **종결형** + 트리거 | `Table<TData>` 입력 → `table.resetColumnFilters()` + `setGlobalFilter(undefined)` 일괄 | `columnFilters.length===0 && !globalFilter`(해제할 것 없음)일 때 `disabled`(+`opacity-50 cursor-not-allowed`). `children` 으로 라벨 override(`Reset Filters`) | 채움 |
| 공유 팝오버 | `FilterPopover`, `FilterPopoverProps` | **종결형** | 6 필터 컴포넌트 중 4 컬럼필터가 단일 재사용. open/close 내부 관리 — 컬럼/테이블 무관 순수 컨테이너 | 네이티브 `div position:absolute`(Radix 등 **외부 lib 무도입**, §4.1). 외부 `mousedown`→닫기, `Escape`→닫기+트리거 포커스 복귀, open 시 첫 `input`/`select` 포커스. `align='right'`→`right-0`(기본 `left-0`), `z-[50]`(sticky 헤더 위). `role="dialog"`+`aria-label="텍스트 필터"` **하드코딩** — Number/Date/Select 재사용 시 override 불가(알려진 a11y 한계) | 채움 |
| 공유 인디케이터 | `FilterIndicator`, `FilterIndicatorProps` | **종결형** | 호출 측이 `column.getIsFiltered()` 결과를 `isFiltered` 로 주입(컴포넌트는 column 미참조) | `isFiltered===true` → 파란 dot(`w-2 h-2 rounded-full bg-blue-500`), 아니면 `null`. Tailwind 전용(인라인 style 無) | 채움 |
| filterFn 계약 | `textFilterFn`·`numberFilterFn`·`dateRangeFilterFn`(커스텀), `selectFilterFn`(=`filterFns.arrIncludes` re-export) | **종결형**(date는 + **연동형**) | `columnDef.filterFn` 에 **직접 참조** 등록, 행 필터링 담당. `dateRangeFilterFn` 만 `date-fns`(`isWithinInterval`/`startOfDay`/`endOfDay`) 의존 → 연동형 | **컬럼당 단일 함수, 연산자 분기는 함수 내부 switch**(§4.2 — `columnDef.filterFn` 런타임 교체 곤란, text 4·number 7 내부 처리). 모두 `FilterFn<unknown>`+null/NaN/Invalid-safe(false). **`autoRemove`** 구현 — text=trim 빈값, number=단항 undefined/NaN·between은 min·max 모두 빌 때, date=from·to 모두 undefined일 때 `true`(단방향 bound 유지). select 는 내장 `arrIncludes`+내장 autoRemove(커스텀 0줄, 중복 회피) | 채움 |
| peerDep(연동형 경계) | `date-fns ^4.1.0` / `react-datepicker ^8.3.0` **필수** peer (+ `@tanstack/react-virtual ^3` optional, `react`/`react-dom`/`@tanstack/react-table` 필수) | **연동형** | `package.json` `peerDependencies` 선언. DateFilter UI/연산 + `dateRangeFilterFn` 이 소비. 소비자 단일 copy 해석 → 번들 중복 0, named import tree-shake | 둘 다 MIT. `peerDependenciesMeta` 에 react-virtual만 optional 표기 → date-fns/react-datepicker 는 필수(미표기). 자체 구현 대신 locale/달력 UX/엣지(`RangeError`·자정 정규화)를 검증 라이브러리에 위임(§4.3). CSS는 소비자 import(§4.4) | 채움 |
| 패키지 한정 skipLibCheck | `tsconfig.json` `compilerOptions.skipLibCheck: true` | **연동형**(빌드 경계) | base `tsconfig.base.json` extends 하되 본 패키지 tsconfig 에만 `skipLibCheck` 설정 — 모노레포 base 에 전파 안 함 | `react-datepicker@8.3.0` + `@types/react@18.3.x` 의 upstream 타입 버그(bigint ReactNode), 패키지 소스 버그 아님(ADR-MOD-GRID-09-004). `.d.ts` 만 skip → 패키지 `.ts`/`.tsx` 타입검사는 유지. upstream 수정 시 불요 | 채움 |

### `mod-grid-10` — `@topgrid/grid-pro-tracking` 변경 추적 ✅ 채움

소스: `packages/grid-pro-tracking/src/index.ts`, `docs/internal/modules/mod-grid-10.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 변경 추적 훅 | `useChangeTracking<TData>(config)` → `ChangeTrackingAPI` | **워크플로형** | TanStack 과 **병렬**(`rows`→`useReactTable({data})`). `useReducer` shell + 순수 헬퍼 | 마운트 시 `data` 스냅샷. `added/edited/deleted` 3상태 + `__rowStatus` 마커 | 채움 |
| config 입력 | `ChangeTrackingConfig<TData>` | 종결형(계약) | — | `data`·`rowKey`(required), `mapping`/`validator`/`optimistic`/`editedCells`/`onSnapshotInit`(opt) | 채움 |
| 명령형 메서드 | `addRow`·`updateRow`·`deleteRow`·`undoRow`·`resetChanges`·`hasChanges`·`getChangeSet` | 워크플로형 + 트리거 | reducer dispatch 단일 지점. `addRow` key 동기 반환 | add후즉시delete=net-zero, 수정 스냅샷 1회, deleted→updateRow=edited 승격. unknown key=warn | 채움 |
| payload 변환 | `getChangeSet()` / `buildChangeSet`(순수, export), `BuildChangeSetOptions` | **연결형**(mapping) + 종결형 | mapping/validator 적용 → `ChangeSet`. 훅 외 단독 호출 가능(테스트 친화) | removed=validator 미호출, added/updated=검증. 함수 entry throw → 행단위 errors 격리 | 채움 |
| 서버 커밋 | `commitChanges(endpoint, options?)`, `CommitOptions` | **워크플로형** + **출력형** + 연동형 | fetch(또는 주입 fetcher) 전송. optimistic 실패 시 RESET rollback | autoReset(true) · method(POST) · 실패 시 항상 re-throw. B2 rollback 은 re-throw 이전 | 채움 |
| 매핑/검증 타입 | `Mapping<TData>`·`Validator<TData>`·`MappedRow`·`ChangeSet`·`RowStatus`·`OriginalSnapshot` | 연결형(계약) | `mapping[BE필드]=원본필드명\|함수`. sync validator 한정 | function entry 로 동적 계산(timestamp/합산). async 거부(commit 전 pre-validate) | 채움 |
| 행 상태 스타일 | `getRowStatusClassName`·`defaultRowStatusClassNames` | **종결형** | — | added=초록/edited=노랑/deleted=빨강+취소선. 부분 override 머지. Tailwind only | 채움 |
| 셀 단위 추적 | `editedCellsMap`(opt-in) | 종결형 | `editedCells: true` 게이트. columnId=accessorKey 가정 | 키 `${rowKey}_${columnId}`. 명시 `id` override 컬럼 미추적(문서화된 한계) | 채움 |
| 선언적 alias | `ChangeTrackingGrid`(default+named), `ChangeTrackingGridProps` | **연결형** + 권한가드 | 훅 + `<Grid>`(grid-core peer) 합성. ref=`GridHandle & ChangeTrackingAPI` 결합 | `onSave` 자동호출 X(commit 정책 비소유). 미인증 시 `<Watermark>` 합성 | 채움 |
| 라이선스 게이트 | `checkLicense()`(index module-load), `useLicenseStatus`(grid-license) | **권한가드** | `@topgrid/grid-license` 런타임 dependency. import 시 검증 | 미인증 → 워터마크. (게이트 명세는 mod-grid-99-a) | 채움 |

### `mod-grid-11` — `@topgrid/grid-pro-range` 셀 범위 선택 ✅ 채움

소스: `packages/grid-pro-range/src/index.ts`, `packages/grid-pro-range/src/types.ts`, `packages/grid-pro-range/src/RangeSelectGrid.tsx`, `packages/grid-pro-range/src/internal/{normalize,fillRange,tsvUtils}.ts`, `docs/internal/modules/mod-grid-11.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 2D 범위 선택 hook | `useCellRange(onRangeChange?)` → `{range, dragging, handleMouseDown, handleMouseEnter, handleMouseUp}`, `UseCellRangeReturn` | **트리거** + 종결형 | headless — `range`만 방출, 실제 데이터 변경은 호출자 소유. `handleMouseDown/Enter/Up`을 셀 DOM 이벤트에 바인딩 | **단일 콜백 인자**(`(range: CellRange\|null)`만, 설정 객체 없음). `shiftKey && range` → `start` 유지·클릭셀을 새 `end`(Shift+Click 확장), 그 외 새 drag(`dragStart` ref). `handleMouseEnter`는 `dragging` 중에만. 매 변경 정규화 후 `onRangeChange` | 채움 |
| 키보드 내비게이션 | `useKeyboardNav<TData>(opts)` → `{handleKeyDown}`, `UseKeyboardNavOptions/Return` | **트리거** | `useCellRange`와 연동(`range`/`onRangeChange` 공유), controlled `activeCell`/`onActiveCellChange`. 경계는 prop 아닌 `table.getRowModel()`+가시 컬럼 수 파생 | Arrow(1칸 clamp·범위해제) · Shift+Arrow(anchor 고정+cursor→`normalizeRange` 확장) · Ctrl+Arrow(data-edge, `getCellValue` 미제공 시 그리드 경계) · Ctrl+Shift+Arrow(data-edge까지 확장) · Tab/Shift+Tab(행끝 wrap) · Enter(아래행). 인식 키만 `preventDefault` | 채움 |
| Excel drag-fill | `DragFillHandle<TCell>`(컴포넌트), `DragFillHandleProps<TCell>` · `fillRange<TCell>`·`detectSeriesStep`(순수) · `FillDirection`·`CellUpdate<TCell>` | **트리거** + 종결형 | 핸들은 hook 아닌 **컴포넌트**(조건부 렌더 게이팅). `fillRange` 호출→`onFillComplete`로 결과 위임(데이터 변경은 호출자), 드래그 중 `onFillTargetChange`(점선 미리보기) | 우하단 2×2 `bg-blue-500` 절대위치. 드래그 state 는 `useState` 아닌 3 ref(`isDragging/dragStart/fillTarget`, re-render 차단), `mousemove/up` **window 레벨**(컨테이너 밖 유지). `getCellRect` hit-test→좌표(가상화 정확). `detectSeriesStep`: ≤1개→`0`(복사)·등차→step·비등차→`null`(modulo 순환). `up/left`는 reverse | 채움 |
| RFC 4180 TSV 클립보드 | `useClipboard<TData,TCell>(props)` → `{onKeyDown, copyToClipboard, pasteFromClipboard}`, `UseClipboardProps/Return`·`PasteResult<TCell>` · `stringifyTsv`/`parseTsv`(순수) | **출력형** + **트리거** | headless — 붙여넣기 결과 `CellUpdate[]`를 `onPaste`로 위임. `selection===null`→복사 no-op, `activeCell===null`→붙여넣기 no-op. `table?` prop은 예약(미사용) | Ctrl+C → 매트릭스 → `stringifyTsv` → `navigator.clipboard.writeText`, 미지원 시 숨은 `<textarea>`+`execCommand('copy')` fallback. Ctrl+V → `readText`(또는 주입 `tsvString`) → `parseTsv` → `activeCell` 오프셋 `CellUpdate[]`. **RFC 4180 완전 보존**(탭/줄바꿈/`"` 셀은 `"` 래핑·`""` 이중이스케이프), 경계초과 clamp+`truncated`. 오류는 `onError`(미제공 시 `console.warn`)+빈 결과 | 채움 |
| 키보드 편집 트리거 | `useKeyboardEdit<TData,TCell>(props)` → `{onKeyDown}`, `UseKeyboardEditProps/Return` | **트리거** | headless — `onDeleteRange`/`onBulkEdit`/`onEditStart` 콜백으로 의도만 방출, 편집 state·데이터 변경은 호출자. `isEditableColumn`으로 읽기전용 컬럼 거름. `table?` 예약(미사용) | Delete/Backspace→범위 내 편집가능셀 `onDeleteRange`(Ctrl/Meta·null·0개 no-op) · F2→`onEditStart(cell)` · Enter→**단일 셀일 때만** 편집 소비(범위면 nav 위임) · printable(`key.length===1 && !ctrl/meta/alt && !isComposing`)→단일 `onEditStart(cell, 첫글자)`·범위 `onBulkEdit`. IME 조합 중 제외. Delete/F2/Enter(단일)만 `preventDefault`(타이핑은 생략) | 채움 |
| 합성 그리드(5 hook 게이팅) | `RangeSelectGrid<TData,TCell>`(컴포넌트), `RangeSelectGridProps<TData>`·`RangeSelectGridAllProps<TData,TCell>` | **연결형** + 권한가드 | 5 hook + `useVirtualizer`를 **항상 무조건 호출**(Rules of Hooks), `enable*`는 호출 아닌 **동작 게이팅**. `RangeSelectGridAllProps extends RangeSelectGridProps`(6-prop 하위호환). 내장 정렬(`getSortedRowModel`) | 기본 ON: `enableRangeSelection`/`KeyboardNav`. 기본 OFF(opt-in): `DragFill`/`Clipboard`/`KeyboardEdit`/`Virtualization`. 게이팅 — 범위는 셀 핸들 내 `if(!enable)return`, 키보드/클립/편집은 콜백 **조건부 전달**(미전달 시 hook no-op), `DragFillHandle`은 `enableDragFill && range && getCellValue`일 때만 렌더. optional prop 은 `exactOptionalPropertyTypes` 위해 조건부 spread. `onKeyDown` 합성 **edit→nav→clip**(`defaultPrevented` 가드, Enter 충돌은 편집 우선). `<td>` `data-row`/`data-col`(getCellRect DOM 질의). 가상화 OFF 시 `count:0` 폴백 | 채움 |
| 범위 정규화 계약 | `normalizeRange(range)`·`isInRange(row,col,range)`(순수), `CellCoord`·`CellRange` | **종결형** | 부수효과 0 — store/state 의존 없음. `useCellRange`/`useKeyboardNav`/`isInRange`가 내부 재사용 | `normalizeRange`: 역방향 `start>end`를 `Math.min/max`로 `start≤end` 정렬(단일 셀 유지). `isInRange`: `range===null`→`false`, 내부 `normalizeRange` 선적용(비정규 안전), 경계 포함(`>=`/`<=`). `CellCoord{row,col}` 0-based | 채움 |
| 라이선스 게이트 | `checkLicense()`(index module-load) · `useLicenseStatus`/`Watermark`(grid-license, RangeSelectGrid 내부 소비) | **권한가드** | `@topgrid/grid-license` 런타임 dependency(`dependencies`). `index.ts` 로드 시 `checkLicense()` 호출, `RangeSelectGrid`는 `useLicenseStatus()` 구독 | `_lic.watermarkRequired` 시 `<Watermark required />` 오버레이(렌더 차단은 안 함). EULA Pro 티어. (게이트 명세는 mod-grid-99-a 소관) | 채움 |
| 미-export(설계) | `legacy/RangeSelectGrid.tsx`(비-export) | 연결형(부정) | `index.ts` 미재노출 + `package.json` `exports`가 `.` 단일(`./legacy` 하위경로 없음) → 신규 표면 진입 차단 | mod-grid-06 의 `/legacy` 패턴과 달리 본 패키지는 legacy 진입점 자체 미제공(메인·하위경로 양쪽 비노출) | 채움 |

### `mod-grid-12` — `@topgrid/grid-pro-datamap` 데이터맵 셀 ✅ 채움

소스: `packages/grid-pro-datamap/src/index.ts`, `packages/grid-pro-datamap/src/types.ts`, `packages/grid-pro-datamap/src/createDataMap.ts`, `packages/grid-pro-datamap/src/createAsyncDataMap.ts`, `packages/grid-pro-datamap/src/internal/asyncCache.ts`, `packages/grid-pro-datamap/src/DataMapCell.tsx`, `packages/grid-pro-datamap/src/DataMapEditor.tsx`, `docs/internal/modules/mod-grid-12.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 정적 매핑 팩토리 | `createDataMap<TItem>(options)` → `DataMap<TItem>` | **종결형** | `buildDataMap`(DataMap.ts) 위임 — `valueToDisplay`/`displayToValue` 두 `Map` 사전 구축. 셀/에디터가 인터페이스 계약에만 의존(클래스 미노출) | `getDisplay`/`getValue` **O(1)** → 셀마다 매 렌더 호출해도 가상화 비용 0(셀 단위 `useMemo` 미채택). `getItems()` 는 `slice()` 복사본(외부 변형 차단) | 채움 |
| 매핑 계약 타입 | `DataMap<TItem>`(`getDisplay`/`getItems`/`getValue`), `CreateDataMapOptions<TItem>`, `PathOrAccessor<TItem,TReturn>` | 종결형(계약) | — | `getDisplay` 미스 시 `undefined`(fallback 호출자 책임). `valuePath`/`displayPath` = `keyof TItem` \| accessor 함수(중첩·계산 키). 인터페이스+팩토리 패턴(`instanceof`/상속 오남용 차단) | 채움 |
| 컬럼 정의 확장 | `DataMapColumnDef<TData>` = `ColumnDef<TData,unknown> & { dataMap?; selectOptions? }` | 종결형(계약) | TanStack `ColumnDef` 를 intersection 으로 확장(`meta` 경유 캐스팅·전역 augmentation 배제). `cell`/`header`/`accessorKey` 등 기존 필드 보존 | `dataMap` = 정적 인스턴스 \| 행 함수(`row=>DataMap`, 행마다 다른 옵션셋). `selectOptions?: string[]` 는 **선언만** 된 `@deprecated` 필드 — 소비 로직 부재(실 매핑은 `dataMap`) | 채움 |
| 표시 렌더러 | `DataMapCell<TData>(info)` → `JSX.Element`, `DataMapCellProps<TData>` = `CellContext<TData,unknown>` | **종결형** + 권한가드 | 수동 배선(`cell: DataMapCell`). `resolveDataMap`(internal)이 함수형 `dataMap` 에 `info.row.original` 주입 → 정적이면 그대로. 진입 시 `useWatermarkEnforcement()` 호출(아래 게이트) | `info.getValue()`→`getDisplay` 결과 있으면 레이블, `label !== undefined` 비교(빈 문자열 `''` 보존), 없으면 `String(value ?? '')` fallback(매핑 미스·`dataMap` 미설정). `<span>` 렌더 | 채움 |
| 편집 드롭다운 | `DataMapEditor<TItem>(props)` → `JSX.Element`, `DataMapEditorProps<TItem>` | 종결형 + **트리거** | 수동 배선(편집 셀에서 직접 렌더). `useState`/`useRef`/`useEffect` 자체 구현(Radix/Downshift 미사용). 외부 UI lib 0. 편집 commit/cancel 은 `onCommit(code)`/`onCancel` 콜백으로 상위 컨테이너에 위임 | 마운트 자동 focus+전체선택, 대소문자 무관 부분일치 필터, ArrowDown/Up(경계 정지)·Enter 확정·Escape 취소. 확정 = 레이블→`getValue(label)` 역조회→`onCommit(code)`. IME `composition` 중 키 무시. 항목 `mousedown`+`preventDefault`(blur 보다 선처리). `role=combobox`/`listbox`/`option`, `aria-expanded`/`-activedescendant`. 드롭다운 className 고정(`absolute z-50 …`) | 채움 |
| 필터 레이블 보정 | `DataMapEditorProps.getLabelFromItem?: (item:TItem)=>string` (prop 필드 — 단독 export 아님) | 종결형 | 내부 `getLabelOf`(DataMapEditor.tsx)가 소비 — 내부 `Map` 이 `valuePath(item)` 코드 키라 `getDisplay(item)` 직접 불가한 결함 보정 | 제공 시 항목→레이블 변환, 미제공 시 `String(item)` fallback. 필터·옵션 렌더·확정 역조회 모두 이 레이블 기준 | 채움 |
| 비동기 매핑 팩토리 | `createAsyncDataMap<TItem>(options)` → `AsyncDataMap<TItem>` | **워크플로형** + 연동형 | `buildAsyncCache`(internal/asyncCache.ts) 단일 슬롯(`'__default__'`) 캐시 + `buildDataMap` 동적 재생성. loader 가 외부 fetch 경계. `AsyncDataMap extends DataMap` → 셀/에디터가 동기와 **동일** 수신 | 4-state(`idle`→`loading`→`loaded`/`error`). `getItems()` 가 stale/idle 시 `void load()` fire-and-forget 트리거+이전 items 유지(UX 연속). `loading` 중 동시 `load()` 는 `pendingPromise` 공유(중복요청 제거). reject→`error`+빈배열. `invalidate()`→캐시제거+`idle` 리셋 | 채움 |
| 비동기 계약 타입 | `AsyncDataMap<TItem>`(`state`/`load`/`invalidate`/`onStateChange?`), `AsyncDataMapState` = `'idle'\|'loading'\|'loaded'\|'error'`, `CreateAsyncDataMapOptions<TItem>` | 종결형(계약) | `onStateChange(cb)` 구독→해제 함수 반환. `DataMapEditor` 가 duck-typing(`'state' in dataMap && 'load' in dataMap`)으로 async 판별 후 구독→`loading` 동안 `animate-spin` 스피너, 언마운트 시 해제 | `staleTime?`(ms) 미지정 시 `DEFAULT_STALE_TIME` 300_000(5분). 캐시는 `loadedAt`+`staleTime` 순수 클로저 만료 판단(React 의존 0). 인스턴스당 1 슬롯 | 채움 |
| 라이선스 게이트 | `checkLicense()`(index module-load 1회), `DataMapCell` 의 `useWatermarkEnforcement()` — 둘 다 `@topgrid/grid-license` 소비(이 패키지 export 아님) | **권한가드** | `@topgrid/grid-license` **런타임 dependency**. index import 시 `checkLicense()` 1회. `DataMapCell` 진입마다 `useWatermarkEnforcement()` → 미인증 시 `document.body` 단일 portal 을 ref-count 로 정확히 1회 mount(셀 수백 개라도 portal 누적 없음). 게이트 명세 본 소관은 mod-grid-99-a **모듈 경계** | 진입점 아닌 내부(`DataMapEditor`/`createAsyncDataMap` 등)는 별도 검증 호출 없음 | 채움 |
| 호환 alias 타입 | `TopgridColumnDef<TData>` = `DataMapColumnDef<TData>` | 연결형(alias) | 동일 타입을 가리키는 `@deprecated` 별칭 — scope rename 잔재. 신규 표면은 `DataMapColumnDef` | `DataMapColumnDef` 명명 이유 = (1) 기능(dataMap 확장) 노출, (2) `@topgrid/grid-core` 동명·異 shape 타입과 충돌 회피. 차기 메이저 제거. 옛 scope-rename 별칭은 clean-break 로 이미 제거(소스에 없음) | 채움 |
| 레지스트리 통합(현황) | (비-통합 결정 — `type: 'datamap'` 자동 디스패치 부재) | 연결형(부정) | `DataMapCell`/`DataMapEditor` 는 **수동 배선**만 — `createColumns`(mod-grid-04) type→셀 자동 디스패치는 grid-core/렌더러 레지스트리 **모듈 경계** | 이 패키지는 컴포넌트·팩토리를 독립 export, 배선은 소비자 책임 | 채움 |

### `mod-grid-13` — `@topgrid/grid-pro-merging` 셀 병합 ✅ 채움

소스: `packages/grid-pro-merging/src/index.ts`, `packages/grid-pro-merging/src/MergingGrid.tsx`, `packages/grid-pro-merging/src/computeMergeSpans.ts`, `packages/grid-pro-merging/src/types.ts`, `packages/grid-pro-merging/package.json`, `docs/internal/modules/mod-grid-13.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 병합 그리드 래퍼 | `MergingGrid<TData>`(컴포넌트), `MergingGridProps<TData>` | 연결형 + 종결형 | `@tanstack/react-table` `useReactTable`/`flexRender` 를 **직접** 흡수(자체 table 구성). grid-core `<Grid>` 미합성 — peer 선언만, 소스 import 0 | `data`·`columns`(required) · 선언적, 외부 ref/imperative API 없음 · `enableMerging`(false)·`enableVirtualization`(false) 두 축 토글 | 채움 |
| meta.mergeRows 자동 병합 | `MergeRowsConfig<TData>`(`boolean \| compareFn`), `MergingColumnDef<TData>`(`meta.mergeRows`) | **종결형** | 컴포넌트 `enableMerging` ∧ 컬럼 `meta.mergeRows` 둘 다 충족 컬럼만 병합. mergeColumns 추출은 `useMemo([columns, enableMerging])` | `true`=동일 값(`===`) 자동 병합 / `compareFn`=복합 조건. `id ?? accessorKey ?? ''` 로 컬럼 id 해석. `===` 참조비교라 객체/배열 값은 compareFn 책임 | 채움 |
| rowSpan 계산 엔진 | `computeMergeSpans<TData>(rows, columns)` → `MergeSpanMap` | **종결형**(순수함수) | 외부 state 의존 0. `MergingGrid` 내부 호출(`rows.map(r=>r.original)`) + 커스텀 렌더러 단독 호출 가능 | 단일 패스 O(N×C). 행 전환 `i-1→i` 순회, 컬럼 **배열 순서(좌→우)** 평가. 빈 배열 → 빈 Map(EC-001) | 채움 |
| ancestorBoundary 계층 전파 | (위 엔진 내부) | 종결형 | 좌측 컬럼 경계 발생 시 같은 행 전환에서 우측 컬럼(`k>j`)에 강제 경계 전파 — 행마다 초기화되는 `ancestorBoundary` 플래그 누적 | 배열 순서 = **암시적 우선순위**(좌=높음). 별도 우선순위 타입 없음. 단일 컬럼 = `ancestorBoundary` 항상 false 로 수학적 퇴화(분기 없음, G-001 비트 동일). 중간 미설정 컬럼(`fn===null`)은 skip 하되 좌측 경계는 우측에 전파 | 채움 |
| MergeSpanMap(0=skip) | `MergeSpanMap`(`Map<string, number>`) | 종결형(계약) | `MergingGrid` 렌더 루프가 `spanMap.get(`${rowIdx}_${colId}`)` 로 O(1) 조회 | 값 `0`=skip(병합 흡수, `<td>` null 반환으로 제거) · `>1`=`<td rowSpan={span}>` 시작 셀 · `1`/`undefined`=일반 `<td>`. `enableMerging=false` 면 조회 생략, 전부 일반 `<td>`(동작 보존) | 채움 |
| 가상화 경로 | `enableVirtualization`·`estimatedRowHeight`(40)·`virtualOverscan`(5) | **연동형** + 종결형 | `@tanstack/react-virtual` `useVirtualizer`(optional peer). 훅 순서 보장 위해 항상 호출, 비가상화 시 `count:0` no-op | flow 레이아웃 spacer `<tr style={{height}}>`(`position:absolute` 금지, C-18). `computeMergeSpans` 는 항상 **전체** 정렬/필터 완료 행 대상. cross-window: rowSpan 시작 행이 window(+overscan) 밖이면 skip 셀 orphan → `rowSpan=1` truncate(L-01 한계) | 채움 |
| 정렬/필터 재계산 위임 | (`getSortedRowModel`/`getFilteredRowModel`) | **종결형** | `rows = table.getRowModel().rows`(TanStack 정렬/필터 적용 후) 참조 변경 → spanMap `useMemo([rows, mergeColumns, enableMerging])` 자동 재실행 | `sorting`/`columnFilters` state 를 별도 의존성에 추가하지 않음(TanStack 내부 계산 중복 추적 anti-pattern 배제, §5.5) | 채움 |
| 라이선스 게이트 | `checkLicense()`(index module-load), `useLicenseStatus()`·`Watermark`(grid-license) | **권한가드** | `@topgrid/grid-license` 런타임 dependency. `index.ts` import 시 `checkLicense()` 1회 side-effect 실행 | `MergingGrid` 가 `useLicenseStatus()` 구독, `watermarkRequired` 시 `<Watermark required />` 오버레이. 비가상화는 `<div className="relative">` wrap, 가상화는 스크롤 div 가 겸함. (게이트 명세는 mod-grid-99-a) | 채움 |

### `mod-grid-14` — `@topgrid/grid-pro-header` 다단 헤더 ✅ 채움

소스: `packages/grid-pro-header/src/index.ts`, `packages/grid-pro-header/src/types.ts`, `packages/grid-pro-header/src/createColumnGroup.ts`, `packages/grid-pro-header/src/MultiRowHeader.tsx`, `packages/grid-pro-header/src/legacy/GroupedHeaderGrid.tsx`, `docs/internal/modules/mod-grid-14.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 선언적 컬럼 그룹 트리 (placeholder 신뢰) | (설계 — `MultiRowHeader` 가 `table.getHeaderGroups()` 순회) | **연결형** + 종결형 | TanStack v8 네이티브 컬럼 그룹(`GroupColumnDef`) 트리를 `useReactTable` 에 정의하면 `getHeaderGroups()` 가 헤더 행 구조·`placeholder` 셀·`colSpan` 을 자동 산출 → 렌더러는 결과만 순회 | **수동 rowSpan 계산 없음**(§4.1). 렌더러는 `header.isPlaceholder`/`header.colSpan` 분기만 처리. `placeholder` 셀(다단에서 leaf 자리 빈 셀, flat↔그룹 혼합)은 내용 없는 `<th colSpan>` 로 렌더. 3단 이상 중첩·hidden 컬럼 collapse 모두 TanStack 자동 처리 | 채움 |
| 그룹 정의 헬퍼 | `createColumnGroup<TData>(config)` → `GroupColumnDef<TData>`, `ColumnGroupConfig<TData>` | **종결형** | 순수 thin wrapper(로직 0) — 결과를 `useReactTable` `columns` 에 일반 컬럼과 혼합. 반환값이 TanStack 표준이라 별도 배선 불필요 | **단일 config 객체** `{ header, columns }` 1개를 받아 그대로 반환(타입 안전성만 추가). 중첩 호출로 3단 이상 표현. flat 컬럼과 혼합 가능. (README 예시는 배열 인자로 stale — Gap 참조) | 채움 |
| 다단 헤더 렌더러 | `MultiRowHeader<TData>(props)` → `<thead>`, `MultiRowHeaderProps<TData>` | **연결형** + 종결형 + 트리거 | 입력은 **단일 `table` prop**(이미 구성된 TanStack 인스턴스) 하나 — 소비자가 `data`/`columns` 를 직접 넘기지 않음(README 예시는 `columns`/`data` prop 으로 stale). `getHeaderGroups()` 순회 → 행마다 `<tr>`, 헤더마다 `<th>`. leaf(`header.subHeaders.length === 0`)에만 정렬 토글 `onClick`(트리거)+`▲/▼/⇅` 표시 | 셀 콘텐츠는 `flexRender(header.column.columnDef.header, header.getContext())`. 그룹 헤더 셀엔 정렬 미적용. 세 prop(sticky/frozen/groupToggle) 서로 독립·동시 사용 가능 | 채움 |
| sticky 헤더 | `MultiRowHeaderProps.enableStickyHeader?`(기본 false) | **종결형** | 끄면 sticky 클래스 0(하위호환 보존) | 행 0 = `sticky top-0 z-10`(Tailwind). 행 N(≥1) = `sticky z-10` + 인라인 `style.top = calc(var(--grid-header-row-height, 40px) * N)`(런타임 동적 값 — 인라인 style 예외 §4.4). CSS 변수 미정의 시 `40px` fallback, 3단↑ N 자동 누적 | 채움 |
| 컬럼 고정 (on/off 스위치) | `MultiRowHeaderProps.frozenColumns?`(기본 미설정) | **종결형** | TanStack 네이티브 API 만으로 패키지 내부 자급(§4.3) — 타 패키지 internal 유틸 교차 import 0 | **숫자 자체가 "앞 N개" 선택 아님** — 기능 on/off 스위치다. 활성 = `(frozenColumns ?? 0) > 0`, **실제 고정 컬럼은 TanStack `columnPinning.left` 상태**(`column.getIsPinned() === 'left'`)에서 판정 → frozen 쓰려면 테이블 state 에 `columnPinning.left` 동반 설정 필요. left px = `column.getStart('left')` 인라인 `style.left`. 그룹 셀 `getStart` `undefined` 시 첫 leaf 자식 오프셋(없으면 `0`) fallback. z-index: frozen+sticky 교차 `z-30`, frozen 전용 `z-20` | 채움 |
| 그룹 일괄 토글 | `MultiRowHeaderProps.enableGroupToggle?`(기본 false) | **트리거** + 종결형 | 그룹별 별도 state 없이 TanStack 표준 visibility 에 위임(§4.5) | `true` 시 그룹(non-leaf) 헤더 셀이 클릭 토글 — `header.column.getLeafColumns()` 의 자식 leaf 를 `every(c => !c.getIsVisible())` 면 전부 표시, 하나라도 보이면 전부 숨김(`toggleVisibility`). **부분 표시 → "접힘"으로 수렴**. 접힘 시 `effectiveColSpan = 1` + `▶/▼` 아이콘, 그룹 헤더 자체는 항상 표시. leaf 정렬 핸들러 유지·placeholder 셀 토글 없음. 중첩 그룹은 최종 leaf 만 토글 | 채움 |
| 레거시 별칭 (deprecated) | `GroupedHeaderGrid<TData>(props)`, `GroupedHeaderGridProps<TData>` | **연결형** | `useReactTable` + `MultiRowHeader` + tbody + pagination 을 묶은 자체완결 그리드(`<table>` 1개). 헤더는 `MultiRowHeader` 에 위임, tbody/pagination/loading/빈상태는 직접 렌더. `@deprecated` — 신규는 `useReactTable`+`MultiRowHeader` 직접 조합 권장, dev 경고 출력 | `GridPaginationOptions`/`GridRowSelectionOptions` 타입을 `@topgrid/grid-core` 에서 import(역방향 의존 회피). `pagination` 제공 시에만 `getPaginationRowModel` 조건부 연결 + `« ‹ › »` 컨트롤. `enableGroupToggle === true` 일 때만 `MultiRowHeader` 로 conditional spread(`exactOptionalPropertyTypes` 호환). MASTER §5.3: `GroupedHeaderGrid` canonical = grid-pro-header(grid-core 도 동명 @deprecated alias 보유, meta facade 가 TS2308 named 로 고정) | 채움 |
| 라이선스 워터마크 헤더 행 | `MultiRowHeader` 내부 `useLicenseStatus()`·`<Watermark required />`(grid-license 소비) · `checkLicense()`(index module-load 1회) | **권한가드** | `@topgrid/grid-license` 런타임 dependency. `index.ts` import 시 `checkLicense()` 1회(`package.json` `sideEffects: ["./src/index.ts"]` 로 보존). `MultiRowHeader` 가 `useLicenseStatus()` 구독 | `watermarkRequired && getVisibleLeafColumns().length > 0` 시 `<thead>` 최상단에 `<tr><th colSpan={가시 leaf 수}><Watermark required /></th></tr>` prepend. `enableStickyHeader` 켜지면 `sticky top-0 z-20`. **`GroupedHeaderGrid` 는 `MultiRowHeader` 합성으로 워터마크를 transitive 획득**(자체 `useLicenseStatus` 호출 없음 → 별칭 행은 연결형). 라이선스 키 검증(서명/만료) 자체는 mod-grid-99-a **모듈 경계** | 채움 |

### `mod-grid-15` — `@topgrid/grid-pro-agg` 집계 ✅ 채움

소스: `packages/grid-pro-agg/src/index.ts`, `packages/grid-pro-agg/src/types.ts`, `packages/grid-pro-agg/src/aggregationFns.ts`, `packages/grid-pro-agg/src/AggregationGrid.tsx`, `packages/grid-pro-agg/src/GroupPanel.tsx`, `packages/grid-pro-agg/src/internal/{GroupRow,FooterRow}.tsx`, `packages/grid-pro-agg/package.json`, `docs/internal/modules/mod-grid-15.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 통합 집계 그리드 | `AggregationGrid<TData extends object>`(컴포넌트), `AggregationGridProps<TData>` | **연결형** + 종결형 | 코어 `<Grid>` 확장 아닌 **standalone** — 자체 `useReactTable` 소유(§6.1). `getCoreRowModel` 항상, `getGrouped`+`getExpandedRowModel`은 `enableAggregation` 일 때만, `getSortedRowModel`은 `enableGroupSort` 일 때만 **조건부 spread**(끄면 옵션 미포함 → tree-shake 여지). `flexRender`로 셀/헤더 그림 | `data`/`columns`(required). `enableAggregation`(false) 끄면 평면 테이블. 그룹/펼침/정렬 row model 을 컴포넌트가 직접 소유 → 코어 레이아웃(리사이즈·sticky)은 범위 밖(트레이드오프). 컬럼 리사이즈·핀은 **모듈 경계**(mod-grid-01) | 채움 |
| 그룹헤더/합성footer 인터리빙 | `buildInterleavedRows`(internal), `GroupRow`/`FooterRow`(internal 컴포넌트 — 미-export), `RowDescriptor`(`'group'`/`'leaf'`/`'footer'`) | **종결형** + 연결형 | `getExpandedRowModel()`이 footer 를 자동 방출 안 함(§6.3) → 평면 `table.getRowModel().rows`를 descriptor 배열로 **선펼침**, leaf 직후 footer descriptor 삽입. **동일 배열을 가상화/비가상화 양 경로가 공유**(DOM 분기 0) | footer 삽입 트리거 = `nextRow.depth < row.depth` 또는 nextRow 없음(그룹 종료). 하위 행 0 그룹은 footer 미생성(EC-002). `showFooter=false`(기본 true) 시 인터리빙 자체 생략. group td 는 `colSpan=columnCount`, 깊이 들여쓰기는 **인라인 style** `paddingLeft=row.depth×indentUnit×4`(기본 4) | 채움 |
| 셀단위 집계값 렌더 | `FooterRow`가 `cell.getIsAggregated()` 분기, `FooterRowProps<TData>`(`row`/`cells`/`className?`/`renderFooterRow?`) | **종결형** | 집계 판정은 **셀 레벨** `cell.getIsAggregated()`만 존재(Row API 부재 — §6.5). `true`면 `columnDef.aggregatedCell ?? columnDef.cell`을 `flexRender`, 그 외 빈 칸 | 기본 `bg-gray-50`, `footerRowClassName` 머지. `renderFooterRow(row, cells)` 주면 기본 완전 대체. `cells`는 `groupRow.getVisibleCells()` 주입. `aggregationFn` 없는 컬럼 셀은 빈 칸(EC) | 채움 |
| 그룹헤더 토글 행 | `GroupRow`(internal), `GroupRowProps<TData>`(`row`/`columnCount`/`indentUnit?(4)`/`className?`/`renderGroupRow?`) | 종결형 + **트리거** | `row.getToggleExpandedHandler()`를 `<td onClick>`에 연결(TanStack 표준 펼치기/접기). `row.getIsGrouped()===true` 행 전용 | `getIsExpanded()`→`▼`(펼침)/`▶`(접힘). 그룹 키=`String(row.groupingValue ?? '')`, 하위 수=`row.subRows.length`. `renderGroupRow(row)` 주면 기본 대체. `bg-blue-50 font-medium cursor-pointer` | 채움 |
| 커스텀 집계 registry(3분기 해석) | `registerAggregationFn(name, fn)`·`getAggregationFn(name)`, `AggregationFn`(TanStack 표준 `(columnId, leafRows, childRows)=>unknown`) | **연결형** + 종결형 | module-level `Map` 단일 진입점 — TanStack `table.options.aggregationFns` 미노출(§6.6, 충돌 시나리오 0). `resolvedColumns`(`useMemo`)가 컬럼 `meta.aggregationFn`을 **3분기** 해석: ① registry hit → 함수 참조 직접 전달, ② `BUILT_IN_AGGREGATION_KEYS` 포함 → `resolveAggregationFn(key)` 문자열, ③ 미등록 → `console.error`+`'count' as const` fallback(예외 미발생) | registry 가 내장보다 **우선** → `'sum'` 등 내장명 등록 시 의도적 오버라이드 가능. 같은 이름 재등록=overwrite+`console.warn`(HMR 안전, throw 0). 삭제 API 없음(overwrite 유일 변경 경로). 1회 전역 등록으로 전 인스턴스 인식(prop 전달 불요) | 채움 |
| 'avg'→'mean' 별칭 · 내장키 | `resolveAggregationFn(key): TanStackAggKey`, `BUILT_IN_AGGREGATION_KEYS`(`['sum','avg','min','max','count']` readonly), `AggregationFnKey`(`'sum'\|'avg'\|'min'\|'max'\|'count'`), `TanStackAggKey`(`'sum'\|'mean'\|'min'\|'max'\|'count'`) | **종결형** | 순수 함수(React import 0 — `aggregationFns.ts` 별도 모듈, tree-shake 독립). **문자열 키 반환**(함수 참조 아님) → TanStack 이 자체 `aggregationFns[key]` 조회(내부 객체 직접 import 회피, 결합도↓) | `'avg'→'mean'`(§6.2), 나머지 패스스루. count 는 비수치 포함 행 수. 셀 값이 문자열인데 `'sum'`이면 TanStack 위임(NaN, 예외 미발생) | 채움 |
| 컬럼 meta 계약 | `AggregationColumnDef<TData> = ColumnDef<TData> & { meta?: AggregationColumnMeta }`, `AggregationColumnMeta`(`aggregationFn?`+`[key:string]:unknown`) | 종결형(계약) | TanStack `ColumnDef`에 타입드 `meta` intersection. 어느 컬럼을 어떤 함수로 집계할지 `meta.aggregationFn`으로 지정 | `aggregationFn?: AggregationFnKey \| (string & {})` — 내장 5종 자동완성 유지 + 등록 커스텀명 등 임의 문자열 허용(`any` 미사용). `[key:string]:unknown`으로 임의 user meta 공존 | 채움 |
| HTML5 DnD Group Panel | `GroupPanel<TData extends object>`(컴포넌트, **export** — standalone), `GroupPanelProps<TData>`(`grouping`/`columns`/`onGroupingChange`/`className?`/`chipClassName?`/`emptyText?`) | **연결형** + 트리거 | 드롭존 1개라 dnd-kit/react-dnd 과함 → **HTML5 native drag**(§6.7, 번들 추가 0, 신규 의존 0). `<th>`가 `draggable`+`onDragStart`에서 `dataTransfer.setData('columnId', col.id)`, 패널 `onDrop`에서 꺼냄. Safari 호환 `dragSourceId` ref fallback | 칩=[레이블+×], 레이블=`columnDef.header` 문자열이면 그대로 else `col.id`. × 클릭→`removeFromGrouping`, 중복 드롭 무시(`addToGrouping` no-op, EC-001). 빈 그룹=`emptyText`(기본 `'Drag a column header here to group'`)+dashed drop zone. 키보드 드래그(접근성) 미지원(트레이드오프) | 채움 |
| opt-in 그룹 정렬 | `enableGroupSort?(false)`, `sorting?`/`onSortingChange?`(controlled), `SortingState`/`OnChangeFn` | 종결형 + **트리거** | `getSortedRowModel()`은 `enableGroupSort=true`일 때만 활성(§6.8, 항상 켜면 하위호환 깨짐). grouped row model **이후** 적용 → 그룹 간 순서가 집계값 기준 재정렬. `showGroupPanel`과 완전 독립 플래그 | sortable 헤더(`getCanSort()`) 클릭→`getToggleSortingHandler()`. `getIsSorted()`→`▲`/`▼`/(무). **uncontrolled**(기본): 내부 `useState<SortingState>([])`. **controlled**: `sorting`+`onSortingChange` 동반. `sorting`만 주고 `onSortingChange` 없으면 `console.error`+내부 state fallback(EC-007, 예외 미발생) | 채움 |
| 가상화(optional peer) | `enableVirtualization?(false)`·`estimatedRowHeight?(40)`·`virtualOverscan?(5)`, `useVirtualizer`(@tanstack/react-virtual) | 종결형 + **연동형** | `@tanstack/react-virtual`(^3)은 **optional peer**(`peerDependenciesMeta.optional`) — `enableVirtualization` 사용 시에만 필요. `useVirtualizer`는 **항상 무조건 호출**(Hook 순서 보장), 비활성 시 `count:0` | `count`=footer 포함 `interleavedRows.length`(footer 가상 window 누락 방지). `position:absolute` 아닌 상·하단 **spacer 행**(`height` 동적 style) flow-layout. 알려진 한계: window 밖 그룹 헤더/footer DOM 언마운트(대용량 성능 의도 트레이드오프, EC-004) | 채움 |
| 상태 소유(grouping/expanded) | `grouping?([])`·`expanded?(ExpandedState\|false, {})`·`onGroupingChange?`·`onExpandedChange?` | 종결형 + 트리거 | `grouping`은 내부 `useState`(Group Panel 칩 X 등 uncontrolled 조작이 re-render 유발, EC-005) — TanStack `onGroupingChange`를 `handleGroupingChange`로 라우팅(내부 state set + prop 콜백). `expanded`는 `state.expanded`로 직접 전달, `onExpandedChange` 제공 시에만 콜백 spread | `expanded` `false→{}` 정규화(§6.4, TanStack `ExpandedState`에 false 없음 → `expanded={false}`와 `{}` 동작 동일). `grouping=[]` 빈 배열=그룹 해제 평면 렌더 | 채움 |
| 라이선스 게이트 + 워터마크 | `checkLicense()`(index module-load 1회), `AggregationGrid` 내부 `useLicenseStatus()`·`<Watermark required />`(둘 다 grid-license 소비 — 이 패키지 export 아님) | **권한가드** | `@topgrid/grid-license` **런타임 dependency**(`dependencies`, `workspace:*`). `index.ts` 로드 시 `checkLicense()` 1회(D5: register/조회 함수는 별도 호출 안 함). `AggregationGrid`는 `useLicenseStatus()` 구독 | `_lic.watermarkRequired` 시 `<Watermark required />` 오버레이(`relative` 컨테이너, 렌더 차단은 안 함). 패키지 라이선스=상용 EULA(`SEE LICENSE IN EULA`). 검증·워터마크 로직 전적 위임. 게이트 명세 본 소관은 mod-grid-99-a **모듈 경계** | 채움 |

### `mod-grid-16` — `@topgrid/grid-pro-master` master-detail ✅ 채움

소스: `packages/grid-pro-master/src/index.ts`, `packages/grid-pro-master/src/MasterDetailGrid.tsx`, `packages/grid-pro-master/src/ContextMenuGrid.tsx`, `packages/grid-pro-master/src/internal/{useContextMenu,ContextMenuPortal,useRowKeyboardNav,useExpandedPersistence}.*`, `packages/grid-pro-master/src/types.ts`, `docs/internal/modules/mod-grid-16.md`.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| Master-Detail 그리드 | `MasterDetailGrid<TData>`(forwardRef), `MasterDetailGridProps`·`MasterDetailOptions`·`RenderDetailRow`(타입) | 연결형 + 종결형 | **standalone** — 자체 `useReactTable`(core+expanded row model) 직접 구성, 런타임에 grid-core `<Grid>` import X(Option B, MIT↔Pro 경계). grid-core 는 `GridProps`/`GridHandle` **type-only peer** 만 제공 | `renderDetailRow` 제공 시 `__expand__` 토글 컬럼(40px) 자동 prepend, 토글 행 아래 `colSpan` detail `<tr>`(`data-detail-row`). 미제공 시 평면 그리드. `getSubRows`+detail 복합, depth 16px 들여쓰기 | 채움 |
| controlled/uncontrolled 펼침 | `masterDetail.expandedRowKeys`·`onExpandChange`, `RenderDetailRow`=`(Row<TData>)=>ReactNode` | 종결형 + **트리거** | 외부 계약은 `string[]`(=`row.id`), 내부에서 TanStack `ExpandedState`(`Record<string,boolean>\|true`)와 양방향 변환(`keysToExpandedState`/`expandedStateToKeys`) | controlled 시 `expandedRowKeys` 변경을 effect 로 내부 state 동기. uncontrolled 시 내부 `useState<ExpandedState>`. `onExpandChange(keys)` 발화. `state===true`→빈 배열(`expandAll()` 권장) | 채움 |
| 명령형 핸들(MasterDetail) | `GridHandle<TData>`(ref) — `expandAll?`/`collapseAll?`(optional) 구현 | **연결형**(위임) | mutation→`onAddRow`/`onDeleteRow`/`onUpdateRow` prop 위임(미제공 시 dev warn+no-op), selection→table 직접 | `expandAll`=`toggleAllRowsExpanded(true)`/`collapseAll`=`false`. `getSelection/clearSelection/refresh`. **`scrollTo` 의도된 no-op**(가상화 미지원). `expandAll?`/`collapseAll?` 는 공유 `GridHandle` 의 **optional** — 본 컴포넌트만 구현 | 채움 |
| Context Menu 그리드 | `ContextMenuGrid<TData>`(forwardRef), `ContextMenuGridProps`·`ContextMenuItem`(타입) | 연결형 + **트리거** | **standalone** 자체 `useReactTable`(core row model). `ContextMenuItem.onClick(row,cell,event)` 시그니처가 TanStack row/cell 컨텍스트를 요구 → 자체 table 소유가 유일 해법 | `contextMenuItems` 제공 시 셀 우클릭 `preventDefault()` 후 메뉴 표시. 미제공/빈배열 시 `onContextMenu`·`tabIndex` 미등록(브라우저 기본). `onClick` 메뉴클릭·단축키 동일 시그니처(단축키는 `new MouseEvent('click')` 합성) | 채움 |
| 메뉴 포털·항목(내부) | `ContextMenuPortal`·`useContextMenu`(internal), `ContextMenuItem`(`label`/`shortcut?`/`disabled?`/`separator?`/`onClick`) | 연결형 + 종결형 | `createPortal`→`document.body`(부모 `overflow`/stacking 클리핑 회피, `position:fixed z-50`). `mousedown` 외부클릭→close | `clampPosition`=뷰포트 경계 클램프(추정 200×`items*32+8`). `separator`→`<hr>`. `disabled`=bool\|`(row)=>bool`, 렌더+단축키 **양 시점** 평가(`opacity-50 pointer-events-none`+DOM `disabled`). `shortcut` 우측 힌트 표시 | 채움 |
| 단축키 파싱·발화 | `parseShortcut`·`matchesShortcut`(ContextMenuGrid 내부), wrapper `<div>` `onKeyDown` | **종결형** | 전역 `window` 리스너 아님 — wrapper `tabIndex=0` 포커스 시에만 활성(타 컴포넌트 충돌 회피, 언마운트 자동정리) | 문법 `"[Modifier+]Key"`, Modifier∈`Ctrl`/`Alt`/`Shift`(복합 가능), 대소문자 무관. 문법오류(`"Ctrl+"`·미지의 Modifier)→dev 경고+해당 단축키 무시(`null`). `Esc`→close. target `null`이면 무시 | 채움 |
| 펼침 상태 영속화 | `useExpandedPersistence(options)`→`[ExpandedState, setExpanded]`, `UseExpandedPersistenceOptions`(타입) | 종결형 + 연동형(Web Storage) | **독립 훅**(grid-core 상태 훅 수정 X — Pro 기능을 MIT 표면에 비주입). 외부 합성으로 `masterDetail.expandedRowKeys`+`onExpandChange` 에 연결 | `storageKey`(required)·`storageType`(`localStorage`)·`initialExpanded`(`{}`). 마운트 시 복원, `setExpanded` 마다 직렬화 저장. 스토리지 미가용/파싱오류/용량초과→**in-memory fallback**(dev 경고 1회). 동일 키 공유 시 마지막 unmount 가 덮어씀 | 채움 |
| 키보드 접근성(내부) | `useRowKeyboardNav<TData>(row,enabled?)`·`shouldToggleExpand(key)`(internal, public 미노출) | 종결형 + **트리거** | `MasterRow` 가 **모듈 스코프** 서브컴포넌트로 호출(Rules of Hooks + 컴포넌트 타입 안정 → 포커스 유지, WCAG). C-32 순수 헬퍼/React 셸 분리 | WCAG 2.1 AA — 행 `tabIndex=0`+`Enter`/`Space`(`' '`)→`row.toggleExpanded()`. `enabled===false`\|`!getCanExpand()`→빈 객체 `{}`(무해 spread). `shouldToggleExpand`=순수 판별 | 채움 |
| Row Pinning(타입 전용) | `RowPinningOptions`(`pinTop?`/`pinBottom?`: `string[]`) | 종결형(계약) | — | 행 고정 기반 타입만 export(`row.id` 배열). 실제 고정 UI 구현은 별도 범위(D20/AC-006, 미구현) → **모듈 경계** | 채움 |
| 하위호환 alias 재노출 | `TreeGrid`·`ColumnPinGrid`(+`TreeGridProps`/`ColumnPinGridProps`) | **연결형** | grid-core(C-6, G-005)에서 `useDeprecationWarn` 포함 구현된 alias 를 그대로 re-export. 신규 wrapper 미생성, 번들 영향 0(tree-shake). grid-core 는 peerDependency | Pro 패키지에서도 동일 alias import 가능하도록 진입점만 추가 | 채움 |
| 라이선스 게이트 | `checkLicense()`(index module-load), `useLicenseStatus`·`Watermark`(grid-license) | **권한가드** | `@topgrid/grid-license` **런타임 dependency**. import 시 `checkLicense()` 1회(패키지 전체) | `MasterDetailGrid` 만 `useLicenseStatus()` 구독 → `watermarkRequired` 시 `<Watermark required />` 렌더. **`ContextMenuGrid` 는 워터마크 비렌더**(license import 없음). (게이트 명세는 mod-grid-99-a) | 채움 |

### `mod-grid-17` — 사용처 채택(adoption) ✅ 채움

소스: `docs/internal/modules/mod-grid-17.md`. (alias·매핑·deprecation 정책의 실제 정의는 mod-grid-01 소관 — 아래는 그 표면의 *소비/제거* cross-ref.)

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| deprecated alias → `<Grid>` 교체 | (제품 export 없음 — 사용처 코드만 수정, `@topgrid/grid-*` 변경 0건) | **연결형**(cross-ref) | `@topgrid/grid-core/legacy` 의 호환 alias(`BaseGrid` 외 4종)를 표준 `<Grid enableSort enableFilter …>` 직접 사용으로 교체. alias 정의·`<Grid>` prop 매핑·deprecation 정책은 mod-grid-01 §3.1(호환 alias 행)·§5 소관 → 여기선 연결만 | alias 는 정렬·필터 항상 활성 + `enablePagination={pagination !== undefined}` 패턴의 얇은 shim(매핑 정의는 mod-grid-01). 교체 시 `enableSort enableFilter` 명시 추가, 나머지 prop(`rowSelection`/`onRowClick`/`loading`/`emptyText`/`className`) 통과. `ColumnDef` 는 TanStack 표준 그대로(형태 불변) | 채움 |
| 채택 절차 부기 | (프로세스 기록 — API 표면 아님) | 프로세스(비-제품) | — | 호출 단위 surgical 보존(원래 쓰던 prop만 유지), 한 파일 내 다중 alias 호출 일괄 교체(미정의 참조 방지), 외부 페이지네이션과 `enablePagination` 중복 회피, 이미 `<Grid>` 직접 사용 중인 사용처는 검증만 | 채움 |

이 모듈은 제품 API가 아닌 채택 절차 기록 — 실제 그리드 지식은 mod-grid-01(alias) 참조.

### `mod-grid-99-a` — `@topgrid/grid-license` 라이선스 게이트 ✅ 채움

소스: `packages/grid-license/src/index.ts`, `packages/grid-license/src/setLicenseKey.ts`, `packages/grid-license/src/verifySignature.ts`, `packages/grid-license/src/checkLicense.ts`, `packages/grid-license/src/useLicenseStatus.ts`, `packages/grid-license/src/useWatermarkEnforcement.tsx`, `packages/grid-license/src/Watermark.tsx`, `packages/grid-license/src/state.ts`, `packages/grid-license/src/types.ts`, `docs/internal/modules/mod-grid-99-a.md`.

> 이 모듈은 전 Pro 패키지(`grid-pro-*`)의 **권한가드 기반**이다(§4 "런타임 게이트(dependency)"·§1.2 불변식과 일관). Pro 패키지가 자신의 `src/index.ts` 모듈 로드 시점에 `checkLicense()` 를 1회 호출해 검증을 트리거하고, 미인증 시 `<Watermark>` 합성 또는 `useWatermarkEnforcement()` 포털로 워터마크를 강제한다. 분류는 §2 7형 중 **권한가드**가 주(主)이며, 보조는 `+` 로 병기한다. 외부 npm 의존 0개(서명 검증은 런타임 빌트인 Web Crypto API).

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 전역 라이선스 등록 | `setLicenseKey(key: string): LicenseStatus` | **권한가드** | 앱 entry(`main.tsx`) 최상단 1회 호출. 내부 `verifySignature(key)`(async) 결과를 `setLicenseState` 로 모듈 전역 state 에 저장 — 이후 모든 Pro 패키지의 `checkLicense()` 가 이 state 를 읽음 | **동기** API + **fire-and-forget** 비동기 검증: `verifySignature().then(...).catch(...)` 로 검증 시작 후 즉시 pending `{ valid: false }` 반환. `await` 없이 호출(top-level await/Suspense 불필요). 검증 실패는 외부 `catch` 불가(state 로만 확인). 중복 호출 = 마지막 호출 기준 덮어쓰기(경고 없음) | 채움 |
| 동기 상태 검사 | `checkLicense(): LicenseCheckResult` | **권한가드** | Pro 패키지가 index module-load 시 1회 호출해 검증 트리거(런타임 dependency). `getLicenseState()`(state.ts) 를 동기로 읽어 파생 — Promise·React 의존 없음. **이 호출이 권한가드 기반의 진입점** | `!valid` → `{ valid:false, watermarkRequired:true }`(있으면 `reason`/`expiresAt` 동봉). `valid` + 만료 60일 미만 → `expiryWarning:'soon-expiring'` + `console.warn`(프로세스당 1회, 경계값 strict `<`). 충분/만료없음 → `{ valid:true, watermarkRequired:false }` | 채움 |
| Ed25519 비대칭 서명검증 | `verifySignature(rawKey): Promise<LicenseStatus>`(internal) | **권한가드** | `setLicenseKey` 가 fire-and-forget 으로 호출. 런타임 빌트인 `crypto.subtle.importKey('raw', …, {name:'Ed25519'})` + `verify('Ed25519', …)` 단독 — 외부 npm 의존 0개 | 키 = `Base64url(pubKey 32B).Base64url(sig 64B).Base64url(payloadJSON)` 점 3-part. payload `{ domain, expiresAt(Unix ms), tier }`. **HMAC-SHA256 암호학적 거부**(대칭 secret 이 JS 번들 노출 → 위조 가능). 비대칭이라 번들엔 공개키만. 만료(`expiresAt < now`)·도메인(exact match, localhost/127.0.0.1 허용·`::1` 미지원·SSR skip) 검증. `crypto.subtle` 미지원 → `{ valid:false, reason:'invalid' }` fallback | 채움 |
| 소프트 인포스먼트 | (정책 — `checkLicense` + Pro 패키지 통합 방식) | **권한가드** | Pro 패키지는 module-load `checkLicense()` 1회 + 미인증 시 `<Watermark>` 합성/포털만 둠. **렌더 중단 로직 없음** | 무효/만료/도메인 불일치라도 그리드 렌더를 **차단하지 않음**. 결과는 워터마크 표시 + `console.warn` 뿐. 비동기 검증 완료 전(~2ms) Pro 그리드 mount 시 순간 워터마크 노출 — 설계상 허용, 버그 아님(방어 코드 미추가) | 채움 |
| 라이선스 상태 hook | `useLicenseStatus(): LicenseCheckResult` | **권한가드** | `useSyncExternalStore(subscribeLicense, getSnapshot, …)` 로 모듈 전역 state 구독 — 비동기 `setLicenseKey` 검증 완료 시 재렌더. wrapper 방식 워터마크의 상태 소스 | React 18 concurrent tearing 없음. `getSnapshot` 은 `getCachedCheck(checkLicense)` 위임 — `checkLicense()` 가 호출마다 새 객체를 만들어 Strict 모드 "getSnapshot should be cached" 무한루프를 유발하므로, state 가 실제 변경될 때만 캐시 무효화 | 채움 |
| 워터마크 강제 hook(포털) | `useWatermarkEnforcement(): void` | **권한가드** + 연결형 | wrapper host DOM 이 없는 **per-cell 렌더러**(예: `DataMapCell` 수백 개)용. `document.body` 에 **싱글턴 portal**(`createRoot`) 마운트, `subscribeLicense(renderWatermark)` 로 state 변경 시 재렌더 | 반환값 없는 등록 hook. 모듈 레벨 ref-count(`_activeCount`): **최초** 마운트가 portal+root 생성, **마지막** 언마운트(count 0)가 해제. 수백 번 호출해도 portal 1개. SSR-safe(`document` 없으면 skip). portal 컨테이너에 `data-topgrid-watermark` 속성 부여 | 채움 |
| 워터마크 컴포넌트(wrapper) | `Watermark(props: { required: boolean }): React.ReactElement \| null` | **권한가드** + 종결형 | `position:relative` 컨테이너를 가진 컴포넌트(그리드/Pro alias)가 `checkLicense()`/`useLicenseStatus()` 의 `watermarkRequired` 를 `required` 로 넘겨 선언적 합성 | `required=false` → `null`. `true` → 우상단 div, 텍스트 `Unlicensed @topgrid/grid`. Tailwind className 전용(`absolute top-0 right-0 opacity-40 pointer-events-none select-none …`). `pointer-events-none` 으로 하위 그리드 상호작용 비차단. SSR-safe(클래스만 의존) | 채움 |
| state 변경 구독 primitive | `subscribeLicense(listener: () => void): () => void` | **권한가드** + 연결형 | `useLicenseStatus`(`useSyncExternalStore`)·`useWatermarkEnforcement`(portal 재렌더)가 내부 소비. unsubscribe 함수 반환 | `listener` 는 매 state 변경 직후 동기 호출. `index.ts` 가 `state.js` 에서 public re-export | 채움 |
| 검증 우회 seam | `setLicenseState(state: LicenseState): void` (`@internal`) | **권한가드** + 워크플로형 | 정식 검증 경로(`verifySignature`)를 우회해 `LicenseState` 직접 주입. `setLicenseKey` 의 `.then`/`.catch` 도 이 함수로 결과 저장 | 테스트/Storybook seam(`index.ts:8-11` 주석 — invalid-state setup·singleton race 차단). 프로덕션 앱 코드는 `setLicenseKey()` 사용 권고 | 채움 |
| 타입 계약 | `LicenseStatus`·`LicenseReason`·`LicenseCheckResult`(type export) | 권한가드(계약) | `LicenseStatus` = 저장 raw 사실(`setLicenseKey` 반환·state 저장), `LicenseCheckResult` = 파생 소비용(`checkLicense`/`useLicenseStatus` 반환). 두 역할 비혼동 | `LicenseReason` = `'invalid'\|'expired'\|'domain-mismatch'`. `LicenseCheckResult.watermarkRequired` = `!valid` 와 동치, `expiryWarning?: 'soon-expiring'`. 모든 optional 은 conditional spread(`exactOptionalPropertyTypes` 호환), `any` 미사용 | 채움 |

### `mod-grid-99-b` — 문서/시연/시각회귀 인프라 ✅ 채움

소스: `apps/docs/docusaurus.config.ts`, `apps/docs/typedoc.json`, `apps/docs/sidebars.ts`, `apps/docs/package.json`, `apps/docs/.storybook/main.ts`, `apps/docs/.storybook/preview.ts`, `playwright.config.ts`, `tests/visual/storybook.spec.ts`, `.github/workflows/visual-regression.yml`, `apps/docs/docs/migration/*`, `packages/grid-core/src/legacy/index.ts`, `packages/grid-license/src/index.ts`, `docs/internal/modules/mod-grid-99-b.md`.

> 인프라 모듈이라 "API 표면"은 런타임 export 가 아니라 **도구·설정·스크립트·CI 게이트**로 해석한다. 분류는 §2 7형(주 + 보조). 모두 devDependency 영역 — 그리드 런타임 번들 영향 0 KB.

| 기능 | API 표면(도구/설정) | 분류 | 연결 관계 | 세부 | 상태 |
|------|---------------------|------|----------|------|------|
| 정적 문서 사이트 | Docusaurus v3 `Config`(`docusaurus.config.ts`), `docs:build`/`docs:dev`/`docs:clear` 스크립트 | 출력형 + 연동형 | preset-classic 단일 사용, 13패키지 README/가이드를 외부에 노출 | `title:'topgrid'` · `url:'https://topgrid.platree.com'` · `baseUrl:'/'` · **`routeBasePath:'/'`**(docs 가 사이트 루트) · `onBrokenLinks:'throw'`/`onBrokenMarkdownLinks:'warn'` · `blog:false` | 채움 |
| API 레퍼런스 자동생성 | `typedoc.json`(13 entryPoint, `entryPointStrategy:'packages'`), `docusaurus-plugin-typedoc`(devDep `^1`) | 연결형(부정) + 출력형 | TypeDoc 이 13개 `packages/*` → Markdown → 사이드바 "API Reference" 주입 **설계**. 현재 미배선 | **임시 비활성** — `docusaurus.config.ts` 에 `plugins` 배열 자체가 없고 NOTE 주석만("typedoc 버전 정합 이슈로 임시 비활성"). `/api` 미생성. `typedoc.json` 은 잔존(`out:'build/api'`·`failOnWarnings:true`·`plugin:['typedoc-plugin-markdown']`·`readme:'none'`) 하나 어디서도 호출 안 됨 | 채움 |
| 사이드바 구성 | `sidebars.ts`(`SidebarsConfig`) | 연결형 | 수기 안내 페이지 + 마이그레이션 카테고리 | `tutorialSidebar`: `intro`/`getting-started`/`architecture` + `마이그레이션` 카테고리 5종. **`{type:'autogenerated', dirName:'api'}` 항목 없음**(typedoc 비활성과 정합). `migration/variant-table` 등 ID 는 Docusaurus 가 `8-` 수치 접두 제거해 해석(빌드 캐시로 확인) | 채움 |
| 다국어(i18n) | `i18n` 설정 + `i18n/en/...current/` | 연동형 | Docusaurus v3 i18n 규약 | `defaultLocale:'ko'`, `locales:['ko','en']`. 영어본은 동일 확장자(`.mdx`)로 미러 | 채움 |
| 컴포넌트 시연 | Storybook 8 `@storybook/react-vite`(`.storybook/main.ts`), `storybook`/`build-storybook` 스크립트 | 출력형 + 연동형 | Vite 빌더(webpack 미도입). glob 자동수집 → spec/CI 와 느슨결합 | stories glob 2종: `../../../packages/*/stories/**/*.stories.@(ts\|tsx)` + `../../../packages/*/src/__stories__/**/*`(per-component ~32파일). `.storybook` 기준 3단계 상위 = 모노레포 루트. `docs.autodocs:'tag'`(CSF3). addons: links + essentials | 채움 |
| Storybook preview 설정 | `.storybook/preview.ts`(`Preview`) | 종결형 | 글로벌 CSS import 없음 | `actions argTypesRegex '^on[A-Z].*'` + controls color/date matcher. **주석 명시: "monorepo 에 Tailwind 미설치" → CSS import 없음**(글로벌 스타일 부재) | 채움 |
| 대용량 가상화 시연 | grid-core 1000행 가상화 story(`enableVirtualization`/`virtualScrollHeight`) | 종결형 | `@tanstack/react-virtual` 실제 데이터량 시연. 시각회귀가 이 story 의 렌더 안정성 검증 | 1000~5000행 시나리오. `virtualScrollHeight={600}`(미지정 시 400). 회귀에서 렌더 지연 → timeout 연장 대상 | 채움 |
| 시각 회귀 — 러너 | Playwright `defineConfig`(`playwright.config.ts`), `visual:test`/`visual:update-baseline` 스크립트 | 출력형 + 연동형 | story 스크린샷 ↔ baseline 비교 게이트 | `testDir:'./tests/visual'` · `fullyParallel:false`(재현성 위해 순차) · `baseURL:'http://localhost:6006'`(Storybook static) · `retries: CI?1:0` · `screenshot:'only-on-failure'` · `forbidOnly: CI` · chromium 단일 project · `reporter:'html'` | 채움 |
| 시각 회귀 — 동적 수집 | `tests/visual/storybook.spec.ts` | 연결형 + 종결형 | Storybook 산출물을 런타임에 읽어 story id 순회 → story 추가 시 spec 무수정 | `apps/docs/storybook-static/index.json`(SB8 기본) 우선 로드, 미존재 시 `stories.json`(v6 legacy) 폴백. `tags:['docs']` entry 제외. 각 story `page.goto('/iframe.html?id=<id>&viewMode=story')`→`toMatchSnapshot('<id>.png',{maxDiffPixelRatio:0.01})`. virtual/1000 story 는 `networkidle` timeout 60s. baseline self-host(git 이력), SaaS(Chromatic) 비의존 | 채움 |
| 시각 회귀 — CI 게이트 | `.github/workflows/visual-regression.yml` | 권한가드(부정) + 출력형 | PR 차단 정책. label 기반 조건부 enforcement | `on: pull_request/push (main)`. step: `pnpm install`→`pnpm -F docs build-storybook`→`npx http-server ...storybook-static --port 6006 &`→`playwright install chromium`→`pnpm visual:test`. 실패 시 `playwright-report/` artifact. 별도 `block-on-migration-impact` job: 라벨 `migration-impact:high\|medium` + 회귀 실패 시 `exit 1` 차단, 무라벨은 통보만 | 채움 |
| 레거시 변형 → `<Grid>` 매핑 | `apps/docs/docs/migration/8-variant-table.md`, `dataTable-migration.md` | 연결형(지식) | 8 Grid 변형 + DataTable → `<Grid>`/alias 전환표. 코드 이전 미수행, 매핑만 | 8변형: Base/Virtual/Tree/ColumnPin/Grouped/Editable/ChangeTracking/RangeSelect 각각의 `<Grid>`/조합/shim 매핑. DataTable `pageingInfo`/`columnInfos`→`pagination`/`columns`(`ColumnInfo` legacy type 존재) | 채움 |
| grid-core 레거시 alias 5종 | `BaseGrid`·`VirtualGrid`·`ColumnPinGrid`·`GroupedHeaderGrid`·`TreeGrid`(+각 `*Props`) | 연결형 | `packages/grid-core/src/legacy/index.ts` 에서 정확히 5종 export. 문서가 권장 대체 안내 | `deprecated-aliases.md` + `8-variant-table.md`. `EditableGrid`/`ChangeTrackingGrid`/`RangeSelectGrid` 는 grid-core alias **없음**(각각 조합/`grid-pro-tracking`/`grid-pro-range` 직접). alias 최소 1 minor 유지 후 다음 메이저 제거 | 채움 |
| 증분 이전 · Live demo 가이드 | `incremental-strategy.md`, `live-demos.md` | 연결형(지식) + 연동형 | 사용처 이전 전략 + 외부 임베드 | Goal당 파일≤5, 완전→부분→미이전 순. StackBlitz embed ≥3(basic/virtualized/change-tracking) + CSP 대비 `<details>` 정적 코드 fallback 필수 | 채움 |
| Pro 활성화 안내 | `setLicenseKey`(`@topgrid/grid-license` 실제 export), 각 Pro README License Activation 섹션 + `EULA.md` | 권한가드(지식) + 출력형 | README 가 Pro 게이트 활성화법 안내. 미활성 시 워터마크 | `setLicenseKey('YOUR-KEY')` 앱 진입점 1회. 정식 이름 `setLicenseKey`(`initLicense` 부재). Pro 7패키지 각 `EULA.md`(publish `files` 노출). `grid`(private)/`grid-license` 는 설명+라이선스 섹션만 | 채움 |
| story 커버리지 규칙 | (CSF3 컨벤션, 면제/예외 판단) | 종결형 | 빈 story = 도구 경고 → 무가치. 가치 기준 포함/면제 | Component 보유 11패키지 각 최소 1 story. `grid`(meta `export {}`)·`grid-license`(함수만) 면제. `grid-export` 는 Component 0 이나 export 함수 5종 mock UI story 포함. re-export alias 중복 story 회피 | 채움 |


### `mod-grid-18` — `@topgrid/grid-pro-pivot` (Pro) ✅ 채움 — dev-harness 이관(§6→§3)

소스: `packages/grid-pro-pivot/src/{computePivot.ts,reducers.ts,buildPivotColumns.tsx,usePivot.ts,PivotGrid.tsx,types.ts,index.ts}`, spec `.claude/dev-harness/specs/MOD-GRID-18.md`, 결정 `decisions/ADR-001`. dev-harness 루프 2번째 모듈(Full).

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 피벗 변환(headless) | `usePivot<TData>(data,config)` + 순수 `computePivot` | **종결형**(순수) | React-free 순수 변환 → tree-shake 분리(agg `aggregationFns.ts` 선례). `usePivot` 은 `useMemo` 래퍼 = **PAT-001** headless | config `{rows:string[], columns:string[], values:PivotValueDef[]}` → `PivotModel{columnTree, columnLeafKeys, rows}`. 행그룹 × 열조합 sparse(실재 조합만). 셀키 `<combo>__<valueIndex>`. 실행검증: region×quarter sum, leafKeys=[Q1,Q2] | 채움 |
| 값 reducer 5종 | `applyReducer`·`BUILT_IN_REDUCERS`·`isBuiltInAggregationKey` | **종결형** | **ADR-001**: agg 는 순수 `number[]` reducer 부재(Row 기반 + TanStack 위임) → 피벗 신규 구현(중복 아님). agg 의 **키 어휘만 재사용**(`AggregationFnKey`·`BUILT_IN_AGGREGATION_KEYS`) | sum/avg/min/max/count. finite 필터 후 빈 → `null`(throw X, `Math.min` ±Inf 누출 0). 커스텀 `(number[])=>number` 주입(빈셋 short-circuit null). 카운트 하드코딩 0(C-003, `.length` 파생). 실행검증 10건 | 채움 |
| 렌더 + 열 헤더(wrapper) | `PivotGrid<TData>`·`PivotGridProps`·`buildPivotColumns` | **연결형**(`<Grid>` 위임) + 종결형 | **스파이크 결과 = FULL `<Grid>` 위임**(자체 table 0). 열 차원 → 중첩 `ColumnDef.columns`(다단 헤더, POL-TANSTACK). 행 차원 → 선두 컬럼. 합성행(소계/총계)은 `__kind` 태그단 `data` 행 → `rowClassName`+조건부 `column.cell` 로 렌더(grid-core `Grid.tsx` 소스 확인) | `column.cell` 직접 실행검증: data="East", grandTotal="Grand Total", subtotal="East Total", null="—", 숫자 포맷. 중첩 헤더(2024 그룹 children Q1,Q2) 검증 | 채움 |
| 총계/소계(2축) | `computePivot` 내 grand-total 행·열 + 행그룹별 subtotal | **종결형** | 순수 변환에서 계산(렌더 무관). 자식 행 → 그 다음 그룹 subtotal 행(닫힐 때) → 최종 grandTotal 행. 행 grand-total 열 = `__grandTotalCol__` | 실행검증(2 행차원): row order `data·data·subtotal(East,depth0)·data·subtotal(West)·grandTotal`, East 소계 Q1=130. **풀 구현**(후속 연기 없음) | 채움 |
| 피벗 모드 토글 | `PivotGridProps.pivotMode`(기본 true) + `passthroughColumns` | **트리거** | false → 변환 skip, 일반 `<Grid data columns>` passthrough(피벗 비용 0) | `useMemo` 가 `pivotMode?computePivot:null` 로 분기 | 채움 |
| 라이선스 + scaffold | index module-load `checkLicense()` + 미인증 `<Watermark required>` 합성 | **권한가드** + 출력형 | **PAT-003**(grid-pro-chart/agg 동형). dependency = grid-license + grid-core + grid-pro-agg(workspace:*). **react-virtual·차트 lib 미선언**(가상화는 `<Grid enableVirtualization>` 위임 — C-001, AP-001 표면 0) | v0.1.0, SEE LICENSE IN EULA, publishConfig public. tsup dual(CJS 10.5KB/ESM 10.18KB/dts). peer = react/react-dom/@tanstack/react-table. dist 금지어 0 | 채움 |

> dev-harness 수확: **reuse** = PAT-001(headless+wrapper)·PAT-003(license) + agg **키 어휘**(reducer 는 ADR-001 로 신규). **신규** = **ADR-001**(reducer 로컬 vs 공유, N=2 트리거)·**[[LESS-002]]**(react 18/19 split 가 DOM 마운트 검증 차단). **AP 전수**(작동 grep): AP-001=0(react-virtual·chart import 0, 음성대조 firing 입증)·AP-002/003/004=0. **동작 검증**: 피벗 고유 로직 26건 순수 실행(node) + **`PivotGrid` 4 스토리 실제 chromium 마운트**(storybook 단일 react 18.3.1, Invalid hook call 0 — P18-2 해소). gap = 0(§5.2 P18-1/P18-2 는 비-gap 설계/환경 finding).

### `mod-grid-19` — `@topgrid/grid-pro-chart` (Pro) ✅ 채움 — dev-harness 이관(§6→§3)

소스: `packages/grid-pro-chart/src/{index.ts,SparklineCell.tsx,RangeChartPanel.tsx}`, `package.json`, spec `.claude/dev-harness/specs/MOD-GRID-19.md`. dev-harness 루프(specify→implement→verify→capture) 첫 산출 모듈.

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 셀 스파크라인 | `SparklineCell`(+`SparklineCellProps`·`SparklineType`) | **종결형**(zero-dep) | grid-core 셀 슬롯에 `column.cell` 로 직접 사용. 외부 차트 lib 비의존 — 순수 SVG 자체 렌더(IconCell 류 = **PAT-001** headless) | `values: number[]` → `type` line/bar/area/win-loss 별 `<path>`/`<rect>` 산출. `color`/`width`/`height`/`className`. 빈 배열·NaN 안전(skip/dash). 외부 의존 0 | 채움 |
| 범위 차트 패널 | `RangeChartPanel`(+`RangeChartPanelProps`·`RangeSeries`) | **연동형(주입)** + 종결형 | 차트 엔진을 import 하지 않고 `renderChart: (series)=>ReactNode` **prop 으로 주입**받아 렌더(IconCell `icon` 주입 = **PAT-004** optional-peer 올바른 형). grid-pro-range 데이터도 prop 으로 수신(정적 import X) | `{ series: RangeSeries[], renderChart, title?, className? }`. `renderChart` 미주입 시 throw 없이 안내 placeholder(graceful). 타입명 `RangeSeries`(최초 `RangeChartSeries`→`echarts` 부분문자열 회피, [[LESS-001]]) | 채움 |
| Pro 라이선스 게이트 | `index` module-load `checkLicense()` + 미인증 `<Watermark>` 합성 | **권한가드** | `@topgrid/grid-license` 런타임 dependency(**PAT-003** — grid-pro-tracking 과 동일 side-effect 게이트). import 시 검증 | module-load 1회 `checkLicense()`. `RangeChartPanel` 미인증 시 워터마크 오버레이, 인증 시 정상. `setLicenseKey` 활성화(mod-grid-99-a 소관) | 채움 |
| 차트 lib 무-import(불변식) | `package.json` peer = `react`/`react-dom`/`@tanstack/react-table` **만**(차트 lib 0·`peerDependenciesMeta.optional` 0) | **연동형** + 권한가드(부정) | **C-001/AP-001 구조적 회피**: 정적 import 표면이 아예 없음 → 지난 세션 2회(merging/agg) 누락된 optional-peer-static-import 가 발생 불가. 주의: 인덱스된 AP-001 탐지는 `peerDependenciesMeta.optional` 키 기반 → optional peer 0 인 이 패키지에선 **공허참(검사 대상 없음)**. 실제 가드는 차트 lib **이름 grep**(real src 0건, planted `echarts` import 에 1건 — 음성대조로 firing 입증) | dependency = `@topgrid/grid-license`(workspace:*). 차트 lib·grid-pro-range 는 peer/dep 미선언(주입/prop). `src/index.ts` 주석에 불변식 명시 | 채움 |
| 패키지 scaffold(발행) | `@topgrid/grid-pro-chart` v0.1.0, `SEE LICENSE IN EULA`, `publishConfig.access: public` | **출력형** + 연결형 | tsup dual(CJS `index.cjs` 4.51KB / ESM `index.mjs` 4.28KB / `.d.ts`·`.d.cts`). meta `@topgrid/grid` facade 편입은 release(§6.4) 시 | tsconfig `extends ../../tsconfig.base.json`. README(© Platree)·EULA. `tsc --noEmit` 0, build 성공. dist 금지어(TOMIS/echarts) 0 | 채움 |

> dev-harness 수확: **reuse** = PAT-001(headless)·PAT-003(license)·PAT-004(주입). **ap_precaught** = AP-001 ×1(verify-catch 아님 — **설계 단계 선제 차단**: 차트 lib 표면 자체를 안 만듦). **신규 lesson** = [[LESS-001]](공개 식별자 엔진 부분문자열). **동작 검증**(renderToStaticMarkup): 스파크라인 4타입 + 빈/NaN 안전 + 패널 renderChart 주입/미주입 + 미인증 워터마크(`Unlicensed @topgrid/grid` 합성) 전부 실행 통과. gap = 0(§5.2 추가 없음). 단일 클린 데이터포인트 — "컴파운딩 입증"으로 일반화 금지(설계와 일관된 1건).

### `mod-grid-20` — `@topgrid/grid-sizing` (**MIT**, Lite) ✅ 채움 — dev-harness 이관(§6→§3)

소스: `packages/grid-sizing/src/{starWidth.ts,sizeToFit.ts,autoSize.ts,canvasMeasure.ts,index.ts}`, spec `.claude/dev-harness/specs/MOD-GRID-20.md`. dev-harness 루프 3번째 모듈 — **첫 MIT/Lite**(부분 루프, **PAT-003 라이선스 게이트 부재** 검증).

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| width 파싱 + star 분배 | `parseColumnWidth`·`distributeStarWidths` | **종결형**(순수) | 산출 px 맵을 grid-core `columnSizing` 으로 흘림(선언형, 명령형 DOM 조작 0 — POL-TANSTACK) | `'*'`→star1·`'2*'`→2·`120`/`'120px'`→fixed. 분배: fixed 차감 후 잔여를 factor 비율로, **min 하한 시 클램프 후 풀에서 제거·재분배**(단일패스 버그 회피). 실행검증: 600/fixed200/1*+2*→133.33/266.67, min250→재분배 350 | 채움 |
| sizeToFit | `sizeToFit` | **종결형**(순수) | 현재 폭 합 → 컨테이너폭 비례 스케일 | `Math.round` 후 잔차를 최광 컬럼에 가산 → 합 == containerWidth 정확. 실행검증: 100+300→800 합 정확 | 채움 |
| auto-size(측정 주입) | `autoSizeColumn`·`autoSizeColumns` | **종결형** + 연동형(주입) | **PAT-005 host-capability-injection**: `measureText:(text,font?)=>number` 주입 → 수학은 순수(host canvas 무관). chart `renderChart` 주입과 N=2 | `max(measure(header),...measure(cell))+padding`, `[min,max]` clamp. mock `(t)=>t.length*8` 로 58/clamp 50/40 실행검증 | 채움 |
| canvas 측정기(host) | `createCanvasMeasureText`·`approxCharPx`(=8) | **연동형**(host, SSR-guard) | 브라우저 `canvas.measureText` lazy 사용 — module-load·순수helper 에서 호출 0. PAT-005 의 기본 팩토리 | `document`/ctx 부재 시 fallback `text.length*approxCharPx`(node/SSR), **throw X**. 실행검증: node 에서 'hello'→40 무예외 | 채움 |
| 패키지 scaffold(**MIT**) | `@topgrid/grid-sizing` v0.1.0, `license:"MIT"` | **출력형** + MIT 경계 | **첫 비-Pro 모듈**: `checkLicense`/`Watermark`/`@topgrid/grid-license`/EULA **전부 0**(MIT 무료). peer = react/react-dom/@tanstack/react-table/@topgrid/grid-core, **dependency 0** | tsup dual(CJS 4.66KB/ESM 4.44KB/dts). publishConfig public. 외부 lib import 0(표준 canvas만). dist 금지어 0 | 채움 |

> dev-harness 수확: **reuse** = PAT-001(headless 순수). **신규** = **PAT-005**(`host-capability-injection` — N=2 승격, chart `renderChart`+sizing `measureText`). **첫 MIT/Lite 데이터포인트**(부분 루프·라이선스게이트 부재 검증). **AP 전수**(작동 grep): AP-001=0(외부 import 0)·AP-002/003/004=0(README 8식별자 ↔ index.ts 정합 실행대조). **동작 검증**: 공개 API 13건 전수 순수 실행(parse/distribute/sizeToFit/autoSize/SSR-fallback) — **측정 주입 덕에 DOM 마운트 벽 없음**(LESS-002 선제 회피). **컴파운딩**: 에이전트가 LESS-001(부분문자열-guard 트립) 인지를 무지시 적용(주석 `watermark` 자가 회피). gap = 0.

### `mod-grid-21` — `@topgrid/grid-pro-panel` (Pro, Full→대부분 재사용) ✅ 채움 — dev-harness 이관(§6→§3)

소스: `packages/grid-pro-panel/src/{StatusBar.tsx,ToolPanel.tsx,RowGroupPanel.tsx,index.ts}`, spec `.claude/dev-harness/specs/MOD-GRID-21.md`. dev-harness 4번째 — **reuse-gate 첫 실증**(인벤토리→재구현 0).

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 상태바(신규) | `StatusBar`·`StatusBarItem`·`StatusBarProps` | **종결형**(신규) | prop 구동 headless-UI(PAT-001) — grid-core 무합성. 선택 수·집계 요약을 소비자가 `items` 로 주입 | `items: {key, label?, value: ReactNode}[]` → label:value 세그먼트. node 마운트 검증(세그먼트+워터마크) | 채움 |
| 툴패널(state 구동) | `ToolPanel`·`ToolPanelColumn`·`ToolPanelProps` | **트리거** + 연결형 | grid-core `columnVisibility`/`columnOrder` 를 **콜백으로 구동**(state 머신 재구현 0). **deprecated `ColumnVisibilityMenu` 미사용**(C-002) | `columns:{id,label,visible,canHide?}[]` + `onVisibilityChange(id,visible)`·`onReorder?(id,'up'|'down')`. canHide:false→체크박스 disabled. node 마운트 검증 | 채움 |
| 행그룹 패널(**재사용**) | `RowGroupPanel`·`RowGroupPanelProps` | **연결형**(컴포넌트 재사용) | `@topgrid/grid-pro-agg` `GroupPanel` 을 **그대로 re-export**(22줄 watermark 래퍼). 드래그 그룹핑 로직 재구현 0(verify: `onDrop\|dataTransfer\|addToGrouping` = 0) | `RowGroupPanelProps = GroupPanelProps`(타입 재export). chromium 마운트 검증(agg GroupPanel emptyText 브라우저 렌더) | 채움 |
| 라이선스 + scaffold(Pro) | index module-load `checkLicense()` + 패널 `<Watermark required>` | **권한가드** + 출력형 | PAT-003. dependency = grid-license + grid-pro-agg(GroupPanel 재export) workspace:* | v0.1.0, SEE LICENSE IN EULA, public. tsup dual(CJS 3.55KB/ESM 3.24KB/dts). peer = react/react-dom/@tanstack/react-table. dist 금지어 0 | 채움 |

> dev-harness 수확: **reuse** = PAT-001 + **컴포넌트 재사용**(agg `GroupPanel` 통째 re-export — MOD-18 의 *어휘* 재사용과 대비, [[LESS-003]] 재사용 스펙트럼). **신규** = StatusBar 1개 + **[[LESS-003]]**(specify 전 인벤토리 → Full 이 대부분-재사용으로 축소). **reuse-gate 첫 실증**(인벤토리→재구현 0 을 AC·grep 으로 강제). **AP 전수**(작동 grep): AP-001=0·AP-002/003/004=0(README 6식별자 ↔ index 정합)·재구현 grep 0·deprecated 0. **동작 검증**: StatusBar/ToolPanel **node 마운트**(react18 단일) + 3 패널 전부 **chromium 마운트**(storybook 단일 react, RowGroupPanel=agg 합성 포함, Invalid hook call 0). gap = 0.

### `mod-grid-25` — `@topgrid/grid-export` 확장 (**MIT**, Lite) ✅ 채움 — dev-harness 이관(§6→§3)

소스: `packages/grid-export/src/{exportToExcel.ts,exportSheetsToExcel.ts,copyToClipboard.ts,index.ts,types.ts}` + `internal/{buildHeaderRows.ts,buildGridWorksheet.ts}`, spec `.claude/dev-harness/specs/MOD-GRID-25.md`. dev-harness 5번째 — **2번째 MIT/Lite**(MOD-20 후), reuse-gate 가 §6.2 3 AC 를 축소·재정의([[LESS-003]] 동형).

| 기능 | API 표면 | 분류 | 연결 관계 | 세부 | 상태 |
|------|----------|------|----------|------|------|
| 네이티브 숫자서식/폭(table) | `ExcelExportOptions.columnFormats?: Record<id,string>`·`.columnWidths?: Record<id,number>` | **종결형** | `exportToExcel` 가 `buildGridWorksheet` 통해 데이터 셀 `.z`(number-format)·`!cols`(폭) 세팅. columnId→데이터 컬럼 인덱스 매핑(`getVisibleLeafColumns`) | `.z` 는 **numeric 셀(`t:'n'`)에만** 적용(string 셀 `.z`=화면무변 no-op → 가드로 skip, [[LESS-004]] 자기적용). JS `Date` 는 aoa_to_sheet 가 numeric serial 로 변환→날짜서식 적용됨. numeric type 보존 → Excel 정렬가능, write→read 생존 실측. 폰트/배경(`.s`)은 **미제공**(community xlsx 한계) | 채움 |
| 다중 시트 export | `exportSheetsToExcel(sheets: ExcelSheet[], options?: MultiSheetOptions)` | **출력형** + 종결형 | 시트별 `getRowsByScope`+`buildHeaderRows`+`buildGridWorksheet`(단일 시트와 동일 빌더 재사용) → `book_append_sheet` N회 | `ExcelSheet={name,table,scope?,columnFormats?,columnWidths?}`. 빈 배열→warn+return. 각 시트 헤더 merge/scope/숫자서식 단일과 일관 | 채움 |
| 클립보드 헤더 토글 | `ClipboardOptions.includeHeader?: boolean`(기본 true) | **트리거** + 출력형 | `copyToClipboard` 가 헤더 행을 조건부 포함 — 기존(무조건 포함) 동작이 기본값으로 보존 | false → 데이터만 TSV(기존 헤더 영역에 붙여넣기). 기본/true → 첫 줄 헤더(회귀 0) | 채움 |
| 내부 빌더 추출(재사용) | `internal/buildHeaderRows.ts`·`internal/buildGridWorksheet.ts` | **연결형**(내부) | `buildHeaderRows` = 기존 `exportToExcel` private → `internal/` 이동(동작 동일). `buildGridWorksheet` = AOA+merges+`.z`+`!cols`→`WorkSheet`(**writeFile 분리** → node 라운드트립 검증 가능) | 단일·다중 시트 공유. PAT-001(순수 helper). MIT — 라이선스 게이트 0(`checkLicense`/`Watermark`/grid-license 0) | 채움 |

> dev-harness 수확: **reuse** = PAT-001(순수 helper) + 기존 `getRowsByScope`/`buildHeaderRows` 재사용(빌더 추출로 단일↔다중 시트 공유). **MIT/Lite 2번째**(MOD-20 후 — 라이선스 게이트 부재 경로 재확인). **신규** = **[[LESS-004]]**(pinned-edition 기능 silent no-op — community xlsx `.s` strip 을 write→read 라운드트립으로 실측, "limited" 주석에 불신·생존하는 `.z`/`!cols` 만 주장). **reuse-gate(인벤토리)**: §6.2 ①셀스타일 = 폰트/배경 불가→네이티브 숫자서식 재정의, ③클립보드 헤더 = 이미 무조건 포함→토글로 축소, ②다중시트만 진짜 신규. **AP 전수**(작동 grep): AP-001 vacuous(xlsx=required peer, jspdf optional 미접촉)·AP-002 deprecated 0·AP-003 카운트 0·AP-004 README↔index 시그니처 정합(dist .d.ts 대조). **동작 검증**: 15 AC 체크 = `exportToExcel`/`exportSheetsToExcel` **node writeFile→readFile 라운드트립**(real headless TanStack table) + 클립보드 토글(navigator stub). 컴포넌트 없음 → DOM 마운트 불필요. dist 금지어 0. gap = **§5.2 P25-1**(기존 `exportRowsToExcel` `.s` no-op, surgical 미수정·기록만).

---

## 4. cross-module 관계 그리드 (패키지 wiring 매트릭스)

행 = 제공/주입 측, 열 = 소비/수신 측. 대표 5패키지(core / renderers / pro-tracking / license / meta)의
핵심 wiring 만 발췌한 요약 매트릭스다(전 20모듈의 세부 연결은 §3 각 표의 "연결 관계" 열 참조).

| from \ to | grid-core | grid-renderers | grid-pro-tracking | grid-license | grid (meta) |
|-----------|-----------|----------------|-------------------|--------------|-------------|
| **grid-core** | — | placeholder 레지스트리 슬롯 제공(주입 대상) | `<Grid>` peer(alias 합성) | — | re-export 대상 |
| **grid-renderers** | **side-effect 주입**: `wireDefaultRenderers()`→`registerRenderer` 8슬롯. `CellClassNameCallback` type re-export(반대 방향) | — | (간접) `<Grid>` 가 셀 디스패치 | — | re-export 대상 + meta 가 side-effect import |
| **grid-pro-tracking** | `<Grid>` 합성(peer), `tracking.rows`→`data` | (간접) 셀 렌더 | — | `checkLicense()` 호출 + `<Watermark>` 합성(런타임 dep) | re-export 대상 |
| **grid-license** | — | — | 라이선스 상태 구독(`useLicenseStatus`)·게이트 제공 | — | re-export 대상 |
| **grid (meta)** | re-export | re-export(+side-effect import 로 wiring 보존) | re-export | re-export | — |

**wiring 종류 범례**:

- **주입(injection)**: grid-renderers → grid-core 레지스트리(`registerRenderer`, side-effect).
  핵심 연결형. `createColumns`(mod-grid-04)가 이 주입된 슬롯을 조회해 type→셀 디스패치.
- **peer 합성**: grid-pro-tracking 의 `ChangeTrackingGrid` 가 grid-core `<Grid>` 를 peer 로
  끌어와 합성. `tracking.rows` 를 `data` 로 바인딩.
- **런타임 게이트(dependency)**: Pro 패키지 → grid-license. index module-load `checkLicense()`
  + 미인증 시 `<Watermark>` 합성.
- **type re-export(역방향)**: grid-renderers 가 `CellClassNameCallback` 을 grid-core(canonical)
  에서 type-only re-export — 역의존을 만들지 않는 단방향 보존.
- **facade re-export**: meta `@topgrid/grid` 가 전 패키지 named/`*` re-export(TS2308 충돌은
  named 로 canonical 고정) + side-effect 로 grid-renderers import(wiring 보존).
- **충돌 canonical 고정**(architecture.md §5.3): `defaultRendererRegistry`/`registerRenderer`
  → grid-renderers(core 것은 fallback placeholder), `TopgridColumnDef` → grid-core,
  `GroupedHeaderGrid` → grid-pro-header.

> 본 매트릭스는 대표 5패키지의 핵심 wiring 발췌이며, master-detail·merging·datamap·agg·header·range·features·export
> 등 나머지 패키지의 연결은 §3 각 모듈 표에서 다룬다(매트릭스 미확장은 의도된 범위 선택).

---

## 5. Gap / 누락 분석

### 5.1 대조 방법 (문서 vs 실제 소스)

1. 각 모듈 문서의 "주요 export" 목록을 `packages/<pkg>/src/index.ts` 의 실제 `export`
   문과 1:1 대조한다(컴포넌트/훅/함수/타입 각각).
2. **누락 후보** = index.ts 에는 있으나 모듈 문서가 설명하지 않는 export. 단, 다른 모듈
   문서가 담당하는 export(예: grid-core 의 `useGridState` 는 mod-grid-02 소관)는 누락이
   아니라 **모듈 경계** 문제로 분류한다.
3. **추가 후보(stale)** = 문서가 언급하나 index.ts 에 없는 export(제거됐거나 이름 변경).
4. **문서 내부 불일치** = 같은 사실을 둘 이상 문서/주석이 다른 수치로 기술.
5. `@deprecated` 태그 export 는 facade(meta)에서 제외되는지 교차 확인(신규 표면 진입 차단).
6. 분류·원인은 **"검증 가능한 사실"과 "원인 추정"을 구분**해, 후자를 사실로 단정하지 않는다.

### 5.2 전 20모듈 gap 집약

> 한 표에 전 20모듈의 검증 결과를 모았다. `유형` 은 **G**(실제 gap, 정정 권장)·**G-deps**(의존 선언↔실사용 불일치 군)·
> **G-stale**(소스 주석/README 의 stale wording)·**N**(비-gap: 모듈 경계·예시 표현·문서화된 한계). 묶을 만한 패턴은
> 같은 군으로 표기했다(6-슬롯 stale 주석 = G1+G2, deprecated 태그 비대칭 = G3+G4, peer/dependency = G-deps).

| # | 위치 | 유형 | 내용 | 판정 |
|---|------|------|------|------|
| G1 | `packages/grid-renderers/src/index.ts:43` 주석 + `wireRegistry.ts:2` 주석 | **G-stale**(주석 내부 불일치) | 두 주석이 "**6** cell adapters" 라고 기술. 그러나 같은 `wireRegistry.ts` 의 `Wired slots (8)`(L5)·docstring "the **8** default cell adapters"(L47)·실제 `registerRenderer` 호출 **8회**(text/number/date/dateTime/badge/link/tag/progress), architecture.md §3.2·renderers.md §5.2 모두 **8** 로 일치 → "6" 주석이 stale. (검증 가능 사실: 함수가 8슬롯 와이어. "6"의 원인은 단정 않음 — tag/progress 후속 추가·`adaptValueCell` 호출 6건 둘 다 6에 닿으나 어느 쪽도 확정 안 함) | **gap(경미)** — 주석 정정 권장 |
| G2 | `packages/grid-core/src/column/rendererRegistry.ts:74-76` `registerRenderer` docstring | **G-stale**(G1 동형 — 자기 패키지 내부) | docstring 이 와이어를 "**6** 슬롯(`text/number/date/dateTime/badge/link`)" 으로 기술하나, 같은 파일 헤더(L6-8)·`defaultRendererRegistry` docstring(L27-28)·11-entry Map 중 8 와이어 표기는 모두 **8슬롯**(`tag`/`progress` 포함)으로 일치 → "6" 주석 stale. mod-grid-04 자기 패키지 내부 불일치(G1 의 grid-renderers 측 주석과는 별개). 원인(ADR-018 `tag`/`progress` 후속 추가)은 *유력*하나 단정 않음 | **gap(경미)** — 주석 정정 권장 |
| G3 | `packages/grid-features/src/index.ts` column-drag 타입 재export(L17-22) | **G-stale**(deprecated 태그 비대칭) | value 재export 3종(`useColumnDrag`/`DropIndicator`/`useColumnOrderPersist`, L11-16)은 `@deprecated` JSDoc 을 달았으나, 타입 재export `UseColumnDragProps`/`UseColumnDragReturn`/`DragThProps`/`UseColumnOrderPersistProps`(L17-22)에는 태그 누락 — 같은 파일 multi-sort 블록(`SortBadgeProps`/`SortClearButtonProps` 태그)과 비대칭. 재export 대상 shim 파일 자체 docstring 엔 `@deprecated` 존재 → **표면 동작 영향 없음** | **gap(경미)** — 태그 보강 권장 |
| G4 | `packages/grid-features/src/index.ts:30` `SortClearButton` 재export | **G-stale**(deprecated 태그 비대칭 — G3 동형) | `SortClearButton` 컴포넌트 재export 만 `@deprecated` 누락 — 같은 블록 `SortBadge`(L25-26)·`SortBadgeProps`(L35-36)·`SortClearButtonProps`(L37-38)는 모두 태그, L28-29 주석·모듈 문서 §6 도 deprecation 별칭 명시함에도 컴포넌트 export 자신만 누락. 검증 가능 사실: 소스/문서 비대칭 | **gap(경미)** — 태그 보강 권장 |
| G-deps-1 | `packages/grid-features/package.json` | **G-deps**(peer↔dependency 불일치) | `@topgrid/grid-core` 를 `workspace:*` **dependency** 로 선언 — §1.2/§1.3 은 renderers/features/export 가 grid-core 를 **peer** 로 둔다고 기술. features 는 peer 아닌 **hard dependency**(검증 가능 사실: `dependencies` 블록에 위치). → **해소(2026-06)**: dependency→peer(`workspace:*`)로 이동해 renderers/export 패턴과 정합. `grid-features@0.5.0` 발행 | **해소(2026-06)** |
| G-deps-2 | `packages/grid-pro-merging/package.json` + `src/` | **G-deps**(미사용 peer) | `@topgrid/grid-core` 를 required peer 로 선언했으나 src 어디서도 import 하지 않음 — `MergingGrid` 는 `@tanstack/react-table` 로 자체 table 구성(mod-grid-10 `ChangeTrackingGrid` 의 `<Grid>` peer 합성과 대비). peer 선언 ↔ 실사용 불일치(검증 가능 사실: src import 0건). → **해소(2026-06)**: 미사용 grid-core peer 제거. `grid-pro-merging@0.3.0` 발행 | **해소(2026-06)** |
| G-vimport | `grid-pro-merging/src/MergingGrid.tsx:9` **+ `grid-pro-agg/src/AggregationGrid.tsx:37`** | **G**(optional peer 정적 import) | `@tanstack/react-virtual` 을 `package.json` 에서 `optional:true` peer 로 선언하나 두 패키지 모두 `useVirtualizer` 를 **정적 top-level import** + 무조건 호출(merging L97 / agg L294) → 미설치 환경에서는 `enableVirtualization=false` 라도 **모듈 로드 시 import 해소 실패**. (agg 는 본 감사가 처음 놓쳤다가 ①+② 정리 중 발견 — 동일 처방.) 검증 가능 사실: 정적 import + 무조건 호출 | **gap — 동작 영향 있음**(§5.3 유일 실동작 이슈군; **2026-06 두 패키지 모두 required peer 승격으로 해소** — §5.3) |
| G-xlsx | `packages/grid/package.json` `peerDependencies.xlsx` | **G-stale**(manifest drift) | meta 가 `xlsx` 를 `^0.18.0` 로 선언하는데 §1.3·mod-grid-00 peer 매트릭스 SSoT 는 `^0.18.5`(meta optional)로 기술 → 두 값 불일치. SSoT 의 "실측보다 넓게 선언" 허용이 의도적 광역화일 수 있으나(원인 단정 않음), SSoT 명시 값과 meta 소스 값이 다르다는 점은 사실. → **해소(2026-06)**: meta `xlsx` `^0.18.0`→`^0.18.5`(grid-export canonical 정합). `grid@0.3.0` 발행 | **해소(2026-06)** |
| G-selopt | `packages/grid-pro-datamap/src/types.ts:52-58` `DataMapColumnDef.selectOptions` | **G-stale**(deprecated 자리표시·주석) | `selectOptions?: string[]` 가 `@deprecated` 로 **선언만** 되고 소비 로직이 소스에 부재(types.ts 주석은 "createDataMap 내부 변환 구현" 이라 적었으나 `createDataMap`/`DataMapCell` 어디에도 참조 없음). 검증 가능 사실: 패키지 전체 `selectOptions` 소비처 0건. 원인(미구현 deprecated 자리표시)은 *유력*하나 단정 않음 | **gap(경미)** — 주석/필드 정리 권장 |
| G-readme14 | `packages/grid-pro-header/README.md` L46·L65 | **G-stale**(README 예시) | `createColumnGroup([{...},{...}])`(배열 인자) + `<MultiRowHeader columns={...} data={...} />` 로 적었으나, 실제 `createColumnGroup` 은 **단일 config 객체** 1개(`createColumnGroup.ts` L44-51)·`MultiRowHeader` 는 **단일 `table` prop** 만(`MultiRowHeader.tsx` L97-102) 받음. mod-grid-14.md §2·§3 및 index.ts/소스 시그니처는 서로 일치, README 만 어긋남(검증 가능 사실) | **gap(경미)** — README 정정 권장 |
| G-jsdoc16 | `packages/grid-pro-master/src/types.ts` `ContextMenuItem.shortcut` JSDoc | **G-stale**(docstring) | JSDoc 은 "single key string matched against `event.key`(case-insensitive)" 로 기술하나, 실제 `parseShortcut`/`matchesShortcut` 은 `"[Modifier+]Key"`(Ctrl/Alt/Shift 복합) 문법 지원이며 public 문서(mod-grid-16.md §2.2)도 이 문법 명시. 검증 가능 사실: 구현이 modifier 문법 지원(공개 문서와 일치), terse JSDoc 만 stale. 원인 단정 않음 | **gap(경미)** — JSDoc 정정 권장 |
| G-wmark | `packages/grid-license/src/useWatermarkEnforcement.tsx:35` | **G**(문서 누락, 비-public) | 싱글턴 portal 컨테이너에 `data-topgrid-watermark` 마커 속성을 부여하나 mod-grid-99-a.md(§2.6·§4.5)는 이 DOM 마커를 미문서화. 검증 가능 사실: 소스가 속성 설정. 마커 용도/소비처는 단정 않음(본 패키지 내 조회 코드 없음). 브랜딩은 `@topgrid` 단방향 clean — `data-topgrid-watermark` 는 정상 네이밍이며 옛 `data-tomis`/`@tomis` 잔재는 src 전체에 0건 | **gap(경미)** — 문서 보강 권장 |
| G-typedoc | `apps/docs/docusaurus.config.ts` + `typedoc.json` | **G**(자동 API 레퍼런스 비활성) | `docusaurus.config.ts` 에 `plugins` 배열 자체가 없고 NOTE 주석("typedoc 버전 정합 이슈로 임시 비활성")만 → `/api` 미생성, `sidebars.ts` 도 `autogenerated api` 항목 부재. `typedoc.json`/`docusaurus-plugin-typedoc` devDep 은 잔존하나 호출 경로 없음(검증 가능 사실) | **gap** — 의도적 임시 비활성(런타임 번들 영향 0) |
| G-docscss | `apps/docs` 모듈 문서 §6.1·§2.2·§3.1 vs 실제 config | **G-stale**(문서 불일치) | 모듈 문서의 `theme:{customCss:[]}`·Tailwind 전제가 실제와 어긋남 — 현 `docusaurus.config.ts` 에 `theme` 키 자체가 없고, `preview.ts` 주석은 "Tailwind 미설치" 명시. 시각회귀 spec 기술도 분기: 실제는 `index.json`(SB8) 우선·`stories.json` 폴백인데 문서는 `stories.json` 만; baseline 경로·가상화 timeout(문서 15s vs 실제 60s)도 문서 미반영(검증 가능 사실) | **gap(경미)** — 문서 정정 권장 |
| G-docs15 | `packages/grid-pro-agg/src/AggregationGrid.tsx`(`buildInterleavedRows`)·`grouping` prop 소스 주석 | **G-stale**(docstring — 비-단정) | (1) `buildInterleavedRows` 의 `groupStack` 주석은 "indexed by depth" 라 적었으나 실제는 깊이 인덱스 배열 아닌 `depth >= row.depth` 비교 pop 스택(동작 동일·부모 그룹 추적). (2) `grouping` prop 주석은 "which may change externally" 라 적었으나 `useState(grouping)` 는 초기값만 시드(후속 prop 변경 재초기화 X — 외부 갱신은 `onGroupingChange`/Group Panel 경로). 둘 다 검증 가능 사실(스택 fallback·prop→state 동기 effect 부재), 주석 stale 여부 원인은 단정 않음 | **gap(경미)** — 주석 정정 권장 |
| N-size | 루트 `.size-limit.json` vs `packages/grid-pro-merging`·`grid-pro-range` 개별 `.size-limit.json` | N(부수 관찰) | 루트 단일 파일이 canonical 이며 개별 파일은 루트 `size` 스크립트 경로에서 미사용 | **비-gap**(경미 부수 관찰) |
| N1 | grid-core index.ts 의 `useGridState`/`createColumns`/`GridPagination`/`useColumnDrag`/`SortBadge` 등 | N(모듈 경계) | 각 모듈 문서엔 없으나 mod-grid-02/03/04/07/08 소관 export. 문서가 자기 계약만 다룬다고 명시 | **누락 아님** |
| N2 | mod-grid-00 "Text/Number/Date/Badge/… 등" | N(예시 표현) | "등"으로 illustrative. renderers.md 의 11표시+EditableCell=12 가 index.ts 와 정확히 일치 | **누락 아님** |
| N3 | grid-core·grid-export·다수 패키지의 `@deprecated` export(`createTopgridColumnHelper`/`createGroupedColumns`/`DataTablePagination`/`downloadExcel` 등) | N(정책 확인) | architecture.md §5.3 에 따라 facade(meta)에서 제외/`/legacy` 전용이어야 함 → meta index 대조로 검증 가능. mod-grid-06 `downloadExcel`(/legacy 전용)도 동일 성격 | **정책 정합**(facade 교차검증 대상) |
| N-bound | mod-grid-09(필터)·12(datamap)·14(header)·15(agg)·16(master) 의 license/타 모듈 export 참조 | N(모듈 경계) | `checkLicense`/`useLicenseStatus`/`Watermark` 등은 grid-license 소비(해당 패키지 export 아님) → 라이선스 게이트 명세는 mod-grid-99-a 소관. `GroupRow`/`FooterRow`(agg) internal 미-export 등도 설계 일치 | **누락 아님** |
| N-reserved | mod-grid-11 `useClipboard`/`useKeyboardEdit` 의 `table?` prop · mod-grid-14 `GroupedHeaderGridProps.rowSelection` · mod-grid-16 `RowPinningOptions`(타입 전용) | N(문서화된 한계) | 소스·문서 모두 "예약(미사용)"/"타입 노출만/미연결"/"UI 미구현" 로 일치 — 미사용 표면이지 불일치 아님 | **누락 아님** |
| N-ok | mod-grid-02·03·06·11·12·13·15·16·17 의 **export 표면 대조** | N(표면 정합) | **export-surface 축 한정**: 각 `index.ts` 표면 ↔ 모듈 문서가 1:1 정합(누락·stale export 0). `PageNumbers`(03)/`GroupRow`·`FooterRow`(15)/`legacy/RangeSelectGrid`(11) 등 internal 미-export 는 설계 일치. mod-grid-17 은 제품 export 0(프로세스 부기)이라 대조 대상 자체 없음. **단 비-표면 gap(주석/README/manifest/동작)은 위 G-행 참조** — 12=G-selopt, 13=G-vimport·G-deps-2, 16=G-jsdoc16 | **표면 gap 0**(비-표면 gap 은 별도 G-행) |
| P18-1 | `packages/grid-pro-pivot` ↔ `grid-pro-agg` (dev-harness MOD-18) | N(설계 — 재사용 경계) | agg 레지스트리는 **Row 기반**(`getAggregationFn` 의 커스텀 fn 이 다중컬럼 `r.getValue()` 참조) + 내장 5종은 **TanStack 위임**(`resolveAggregationFn` 은 TanStack-internal 키 반환). → 순수 `number[]` reducer 가 agg 에 **부재**(검증 가능 사실: agg src 에 pure reducer export 0). 피벗은 **키 어휘**(`AggregationFnKey`·`BUILT_IN_AGGREGATION_KEYS`)만 재사용하고 reducer 5종은 신규 구현 = **중복 아님**(재사용 실패로 오분류 금지). 결정 근거: ADR-001 | **비-gap**(설계; 순수 reducer 공유추출은 소비자 N=2 시) |
| P18-2 | dev-harness verify 환경 — `react@18.3.1`(root) vs `react@19.2.6`(grid-core) 동시 설치 (MOD-18) | N(검증 환경 한계 — **해소**) | 피벗이 grid-core `<Grid>` 합성 시 node `renderToStaticMarkup` 은 두 react 인스턴스 → "Invalid hook call". 검증 가능 사실: pivot→react18, grid-core→react19 resolve. **제품 결함 아님**(소비자 앱은 단일 react). → **해소**: node 가 틀린 도구였음. **storybook(`@storybook/react-vite`, 단일 react 18.3.1)** 에서 `PivotGrid` 4 스토리 실제 chromium 마운트 통과(Invalid hook call 0) — 위임 패턴 브라우저 작동 입증. 순수로직 26건은 node 실행. → LESS-002(순수→node / 컴포넌트→storybook 게이트) | **비-gap**(환경; 마운트 경로 = storybook 하네스로 확정·실행) |
| P18-3 | `packages/grid-pro-pivot/src/computePivot.ts`·`buildPivotColumns.tsx` 빈 차원 경계 (MOD-18) | N(문서화된 한계) | `config.columns` 빈 배열 → 단일 암묵 leaf 위에 trailing grand-total "Total" 열이 그대로 부가(행-grand-total 1열, 중복적). `config.rows` 빈 배열 → "Grand Total" 라벨이 안착할 선두 행차원 열 없음(grand-total 행 1개만). 검증 가능 사실: 두 경계 모두 throw 없이 동작하되 표시가 잉여/공백. 주 AC 예시는 rows+columns 비어있지 않아 영향 없음 | **비-gap**(문서화된 한계 — v1 의도, 정정은 후속 선택) |
| P25-1 | `packages/grid-export/src/exportRowsToExcel.ts:83` `ws[cellAddr].s = { font:{bold}, fill:{fgColor:{rgb:'F3F4F6'}} }` (MOD-25 verify) | **G**(pinned-edition 기능 silent no-op) | 헤더 셀에 `.s`(bold+회색 fill)를 세팅하나, pinned required peer `xlsx@0.18.5`(community edition)는 **write 시 `.s` 를 스트립**한다 — MOD-25 verify 의 write→read 라운드트립 실측: `.s` → `{patternType:'none'}`(원 bold/fill 소멸). 소스 주석은 "limited style support"라 *완곡히* 적었으나 실제는 **완전 미반영**(부분이 아니라 0). 결과: 함수가 폰트/배경을 *적용하는 듯* 보이나 산출 파일엔 없음(주석↔실동작 drift, AP-003/004 친족). MOD-25 는 이 코드를 **silent 수정하지 않고**(surgical) 네이티브 `.z`(생존 확인)로 신규 경로를 제공·README 에 한계 명시 | **gap(경미)** — 주석 정정+`.s` 제거 또는 styling-capable writer 도입은 후속 선택(동작 영향 = 폰트/배경 미반영, 데이터/폭/포맷은 정상). [[LESS-004]] 후보 |

### 5.3 결론

전 20모듈 채움을 완료하고 모든 gap 을 §5.2 한 표에 집약했다. 발견된 항목은 **동작 영향 유무**로 둘로 나뉜다.

- **동작 영향 없음(대다수)**: 소스 주석/README/JSDoc 의 stale wording(G1·G2·G-readme14·G-jsdoc16·G-selopt·G-docscss),
  `@deprecated` 태그 비대칭(G3·G4 — shim 파일 자체엔 태그 존재), manifest drift(G-deps-1·G-deps-2·G-xlsx),
  문서 누락(G-wmark), 의도적 임시 비활성(G-typedoc). 전부 public 문서·런타임 동작에 영향을 주지 않으며, 정정/보강만 권장한다.
- **동작 영향 있음(2건, 모두 해소됨)**: **G-vimport** — `grid-pro-merging` 의 `MergingGrid.tsx:9` **와**
  `grid-pro-agg` 의 `AggregationGrid.tsx:37`(둘째는 본 감사가 처음 놓쳤다가 ①+② 정리 중 발견) 가 optional peer
  `@tanstack/react-virtual` 을 정적 top-level import + 무조건 호출하므로, 해당 peer 미설치 환경에서는
  `enableVirtualization=false` 라도 모듈 로드 자체가 실패했다. optional peer 계약("미설치 시에도 기본 동작") 위반이었다.
  **2026-06 해소**: 두 패키지 모두 안전 우선(동작 보존)으로 `peerDependenciesMeta` 의 react-virtual optional 을 제거해
  **required peer 로 승격**, manifest 를 실제 무조건 호출 동작에 맞췄다(동적 import 분리는 Suspense 경계 도입으로
  동작이 바뀌어 배제). mod-grid-13 §5.6 · mod-grid-15 의존절 도 정정.

브랜딩은 전 패키지 `@topgrid` 단방향 clean(`data-topgrid-watermark` 는 정상 네이밍), 옛 `@tomis` 스코프·`data-tomis` 잔재는
src 전반에 0건이다(mod-grid-99-a·99-b 확인). "누락처럼 보이는" 나머지 항목(N*)은 모듈 경계·예시 표현·문서화된 한계로,
실제 gap 이 아니다.

---

## 6. 로드맵 — 계획 모듈 (경쟁 격차 해소 + 프리미엄 기능)

> §3 은 **구현된** 20모듈의 SSoT 다. 본 §6 은 아직 **미구현(계획)** 모듈의 설계 청사진이다.
> Wijmo FlexGrid 격차(`competitive-analysis.md` §5)에 더해, 최고급 유료 그리드
> (**AG Grid Enterprise · DevExpress · SyncFusion · Handsontable Pro · MUI X Premium · Kendo**)
> 의 프리미엄 기능을 합쳐 도출했다. 각 모듈은 spec→implement→verify 워크플로(§6.3)가
> 집어갈 수 있도록 **Goal·Scope·핵심 AC 스케치**(§6.2)를 함께 둔다. **구현 완료 시 해당
> 모듈은 §3 으로 이관**하고 §6 에서는 `구현됨(→§3)` 으로 표기한다(SSoT 단일 위치 유지).

### 6.1 계획 모듈 로드맵

분류는 §2 의 7형. tier 는 발행 라이선스(MIT/Pro). 상태는 전부 `계획(spec 대기)`.

| MOD | 패키지(예정) | tier | 대응 경쟁 기능 | 핵심 기능(예정) | 분류 | 의존 | 우선순위 |
|-----|------------|------|--------------|---------------|------|------|---------|
| 18 | `grid-pro-pivot` | Pro | AG pivot · Wijmo PivotEngine · DevExpress · SyncFusion | 행/열 차원 + 값 집계 피벗 테이블, 피벗 모드 토글, 2축 총계/소계 | 종결+연결 | grid-core(`<Grid>` 위임) · grid-pro-agg(키 어휘) · grid-license | **구현됨(→§3)** |
| 19 | `grid-pro-chart` | Pro | Wijmo sparkline · AG integrated charts · SyncFusion | 셀 내 스파크라인(line/bar/area/win-loss) + 선택 범위→차트 | 종결+연동 | grid-license. ~~chart lib(optional peer)~~ → **주입(prop)으로 변경**(C-001/AP-001 회피) | **구현됨(→§3)** |
| 20 | `grid-sizing` | **MIT** | 전 그리드 기본 | 컬럼 auto-size(내용 맞춤·측정 주입) · star/flex(`*`,`2*`) 비율 너비 · sizeToFit | 종결 | grid-core(peer) | **구현됨(→§3)** |
| 21 | `grid-pro-panel` | Pro | AG sidebar/status bar/row-group panel · Kendo | StatusBar(신규) + ToolPanel(grid-core state 구동) + RowGroupPanel(agg GroupPanel 재사용) | 트리거+연결 | grid-pro-agg(GroupPanel 재export), grid-license | **구현됨(→§3)** |
| 22 | `grid-pro-serverside` | Pro | AG SSRM(server-side row model) | 무한 스크롤, lazy 그룹/트리, 서버 정렬/필터/페이징 통합 | 워크플로+연결 | grid-core | P1 |
| 23 | `grid-pro-edit-plus` | Pro | Wijmo · Handsontable · DevExpress | undo/redo · find&replace · 셀 코멘트/노트 · 검증 룰 엔진 | 워크플로+트리거 | grid-pro-tracking, grid-pro-range | P1 |
| 24 | (grid-core/renderers 확장) | **MIT** | AG pinned rows · 전 그리드 | pinned/floating 합계 행(top/bottom) · alternating(줄무늬) 행 · 조건부 서식 룰 · 컬럼(가로) 가상화 | 종결 | grid-core | P1 |
| 25 | (grid-export 확장) | MIT | AG/DevExpress Excel export | Excel 네이티브 숫자서식(`.z`)·컬럼 폭 · 다중 시트 · 클립보드 헤더 토글 | 출력+연동 | grid-export | **구현됨(→§3)** |
| 26 | `grid-pro-sheet` | Pro | Wijmo FlexSheet · Handsontable · SyncFusion Spreadsheet | 스프레드시트 모드: 수식 엔진(A1 참조) · 시트 · 셀 서식 | 워크플로+종결 | grid-core, grid-pro-range | P2(대형) |

**우선순위 근거**: P0 = 상용 대체 시 가장 자주 요구 + 격차가 명확(피벗·차트·사이징·패널).
P1 = 프리미엄 확장(서버사이드·편집고도화·표시·export). P2 = 별제품급 대형(스프레드시트) —
PoC 후 단계적 결정.

### 6.2 모듈별 Goal / Scope / 핵심 AC (spec-ready 스케치)

각 모듈을 워크플로에 넣을 때 specify 단계가 확장할 시드. 형식: **Goal / In / Out / AC**.

**MOD-GRID-18 `grid-pro-pivot` (P0)** — ✅ **구현됨 → §3 `mod-grid-18` 참조** (dev-harness 루프 2번째)
- Goal: 행/열 2축 피벗 테이블 + 값 집계 + 피벗 모드 토글 + 2축 총계/소계.
- 설계 정정(specify/ADR-001): "agg 집계 레지스트리 재사용"은 **과대 가정**이었음 — agg 는 순수 `number[]` reducer 부재(Row 기반 + TanStack 위임). 피벗은 **키 어휘만 재사용**, reducer 5종 신규(중복 아님, §5.2 P18-1). 드래그 구성은 v1 스코프 아웃(→MOD-21 패널), config prop 으로 대체.
- 산출: `usePivot`/`computePivot`/`PivotGrid`/`buildPivotColumns` + reducer + 2축 소계 풀구현. AC ①(N차원)②(집계)③(모드토글)④(총계/소계) 충족, ⑤는 P18-1 로 재정의(어휘 재사용).
  수확: reuse PAT-001/003 + agg 어휘, 신규 ADR-001·LESS-002. 동작검증 26건(순수), DOM 마운트는 react-split 차단(P18-2).

**MOD-GRID-19 `grid-pro-chart` (P0)** — ✅ **구현됨 → §3 `mod-grid-19` 참조** (dev-harness 루프 첫 산출)
- Goal: 셀 내 스파크라인과 선택 범위 차트를 선언적으로 제공.
- 설계 변경(implement): "optional peer 어댑터" → **무-import 주입**. 스파크라인=순수 SVG(zero-dep),
  범위 차트=`renderChart` prop 주입. 차트 lib peer 0 → AP-001 구조적 회피(verify grep 0 실증).
- 산출: `SparklineCell`/`RangeChartPanel`/`RangeSeries` + Pro 게이트. AC ①~⑤ 충족(spec MOD-GRID-19).
  수확: reuse PAT-001/003/004, ap_precaught AP-001, 신규 LESS-001.

**MOD-GRID-20 `grid-sizing` (P0, MIT)** — ✅ **구현됨 → §3 `mod-grid-20` 참조** (dev-harness 3번째, 첫 MIT/Lite)
- Goal: 컬럼 너비 편의 — auto-size, star/flex 비율, sizeToFit.
- 설계(spec/PAT-005): canvas 측정은 브라우저 전용 → `measureText` **주입**으로 수학은 순수(host 무관), 브라우저 측정기는 SSR-guard 팩토리 분리. → verify 가 mock 측정으로 전수 실행(DOM 벽 없음).
- 산출: `parseColumnWidth`/`distributeStarWidths`/`sizeToFit`/`autoSizeColumn(s)`/`createCanvasMeasureText`. AC ①~④ 충족(13건 실행검증).
  수확: reuse PAT-001, 신규 **PAT-005**(host-capability-injection N=2). 첫 MIT(라이선스게이트 0).

**MOD-GRID-21 `grid-pro-panel` (P0)** — ✅ **구현됨 → §3 `mod-grid-21` 참조** (dev-harness 4번째, reuse-gate 첫 실증)
- Goal: 그리드 주변 UI 3종 — StatusBar·ToolPanel·RowGroupPanel.
- 인벤토리(specify 선행, LESS-003): 3중 2 기존 → RowGroupPanel=agg `GroupPanel` 재export, ToolPanel=grid-core `columnVisibility` 콜백 구동(deprecated `ColumnVisibilityMenu` 회피), StatusBar 만 신규.
- 산출: 패널 3종 + Pro 게이트. AC 충족(재구현 0 을 grep 으로 강제). node+chromium 마운트 검증.
  수확: reuse PAT-001 + 컴포넌트 재사용, 신규 LESS-003. reuse-gate 첫 검증.

**MOD-GRID-22 `grid-pro-serverside` (P1)**
- Goal: 대용량 서버 데이터를 블록 단위로 lazy 로드(무한 스크롤 + 서버 정렬/필터/그룹/페이징 통합).
- In: datasource 인터페이스(getRows(start,end,sort,filter,group)), 블록 캐시, lazy 그룹/트리 펼침.
- Out: 클라이언트 전체로드(기존 mode='client'), 오프라인.
- AC: ①스크롤→블록 요청 1회/블록 ②서버 정렬/필터 파라미터 전달 ③lazy 그룹 펼침 시 자식 요청 ④캐시 무효화 API.

**MOD-GRID-23 `grid-pro-edit-plus` (P1)**
- Goal: 편집 생산성 — undo/redo 스택, find&replace, 셀 코멘트/노트, 선언적 검증 룰 엔진.
- In: useUndoRedo(grid-pro-tracking 변경과 연동), FindReplace(범위/전체), CellComment, ValidationRules(필드 룰→에러 표시).
- Out: 협업(실시간 동시편집).
- AC: ①undo/redo가 add/edit/delete 역연산 ②find&replace 범위 한정 ③코멘트 영속(storage) ④룰 위반 셀 시각 표시+커밋 차단.

**MOD-GRID-24 표시 고도화 (P1, grid-core/renderers 확장, MIT)**
- Goal: pinned/floating 합계 행(top/bottom), alternating 행, 조건부 서식 룰 엔진, 컬럼(가로) 가상화.
- AC: ①pinned 행이 스크롤 무관 고정+집계 표시 ②alternating 토글 1prop ③조건부 룰(조건→class) 선언 ④가로 가상화로 100+ 컬럼 렌더 비용 절감.

**MOD-GRID-25 export 고도화 (P1, grid-export 확장, MIT)** — ✅ **구현됨 → §3 `mod-grid-25` 참조** (dev-harness 5번째, 2번째 MIT/Lite)
- Goal: Excel 셀 서식·다중 시트 export, 클립보드 헤더 옵션.
- 인벤토리 재정의(reuse-gate, [[LESS-003]] 동형): ①"셀 배경/폰트"는 community `xlsx@0.18.5` 가 write 시 `.s` 스트립(round-trip 실측, [[LESS-004]]) → **네이티브 숫자서식(`.z`)+컬럼 폭**으로 재정의(폰트/배경 = 문서화된 한계). ③클립보드는 **이미 헤더 무조건 포함** → `includeHeader` 토글로 축소. ②다중 시트만 진짜 신규.
- 산출: `columnFormats`/`columnWidths`(table 경로) + `exportSheetsToExcel`(다중 시트) + `copyToClipboard({includeHeader})` + 내부 빌더 추출(`buildGridWorksheet`). AC ①(재정의)②③ 충족, 15건 node 라운드트립 검증. gap = §5.2 P25-1.
  수확: reuse PAT-001 + 기존 헬퍼, 신규 LESS-004. AP-001 vacuous(xlsx required).

**MOD-GRID-26 `grid-pro-sheet` (P2, 대형)**
- Goal: 스프레드시트 모드 — 수식 엔진(A1 셀 참조, 함수), 시트, 셀 서식. (별제품급 — PoC 후 단계적.)
- AC(PoC): ①A1 참조 + 사칙·SUM/AVG 수식 평가 ②셀 의존 그래프 재계산 ③grid-pro-range 편집/클립보드 재사용.

### 6.3 진행 워크플로 (spec → implement → verify) + 하네스 상태

각 계획 모듈은 기존 20모듈과 동일한 규율로 진행한다:

1. **specify** — 해당 MOD 의 §6.2 시드를 Goal·AC·rubric 기준 정식 spec 으로 확장(경쟁 vendor 동작을 1차 출처로 인용, 추측 금지).
2. **implement** — Goal 단위로 한 번에 하나씩, 매 Goal 후 `tsc --noEmit` + build 게이트 통과.
3. **verify** — 실제 소스 대조(drift 0) + (가능 시) 시각/동작 검증. 완료 시 **§3 으로 이관** + 발견 gap 은 §5.2 에 기록.
4. **release** — 0.x minor bump + npm 발행(meta `@topgrid/grid` 의존·facade 갱신 포함).

> **하네스 상태(중요)**: 분리 작업 때 `.claude/tw-grid/` 하네스(specify/implement/verify 커맨드)
> 는 TWGRID 제품 저장소로 추출·정리되며 본 repo 에서 삭제됐다(지식은 본 `docs/internal/` 로 흡수).
> 따라서 위 워크플로를 자동 커맨드로 돌리려면 **하네스를 복원(GitHub `alladins/topgrid` 이력에서)
> 하거나 재구축**해야 한다. 그 전까지는 본 §6 의 Goal/AC 시드를 기준으로 수동(또는 에이전트
> 오케스트레이션) 진행이 가능하도록 **MOD 번호·Goal·AC 형식을 하네스 호환으로** 유지했다.

---

## 부록 — 작성 규약

- 경로는 repo-relative(`packages/grid-core/src/index.ts`)로만 인용한다.
- 분류는 §2 의 7형을 쓰고, 다중 분류는 `주 + 보조` 로 병기한다.
- 새 모듈을 펼칠 때 §3 의 6컬럼 표 형식(`기능 / API 표면 / 분류 / 연결 관계 / 세부 / 상태`)을 그대로 따른다.
- gap 발견 시 §5.2 표에 `위치/유형/내용/판정` 으로 기록하고, "검증 가능한 사실"과 "원인 추정"을
  구분해 후자를 사실로 단정하지 않는다.
- 모듈별 gap 은 §3 표 본문에 적지 않고 §5.2 에 집약한다(SSoT 단일 위치).
