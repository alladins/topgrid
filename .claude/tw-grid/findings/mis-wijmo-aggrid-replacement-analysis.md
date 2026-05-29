# MIS (TOMIS/publish) Wijmo + AG Grid → tw-grid 대체 분석 보고서

- 작성일: 2026-05-18
- 분석 대상: `D:/project/topvel_project/TOMIS/publish/src/` (Next.js 15 + React 19, "한국형 ERP" 마이그레이션 소스 참조 코드베이스)
- 결과 산출: 인벤토리 + 페이지/티어 매트릭스 + Wijmo·AG Grid API → tw-grid 매핑 catalog + Gap/Risk
- 모드: read-only 정적 분석 (코드 변경 0)
- 권한 자료
  - tw-grid canonical: `D:/project/topvel_project/TOMIS/.claude/tw-grid/canonical-modules.json` (20 modules, 13 packages)
  - 패키지 디렉토리: `D:/project/topvel_project/topvel-grid-monorepo/packages/` (4 MIT + 8 Pro + 1 meta)

---

## 0. Framing (필독)

본 문서는 publish/ 를 마이그레이션하기 위한 계획이 **아니다.**

memory/MEMORY.md §11 (frontend-decisions): _"publish 역할 = 마이그레이션 소스 참조용 (신규 개발 금지)"_. publish/ 의 코드는 향후 `tw-framework-front` 페이지를 작성/재작성할 때 **참조해야 할 황금 표준**이며, 동일 코드를 그대로 옮기는 것이 아니다. 따라서 본 문서는:

- publish/ 가 어떤 Wijmo/AG Grid 기능을 어디서 쓰는지 인벤토리
- 각 기능이 tw-grid (`@tomis/grid-*` 13 패키지) 로 **완전/부분/차단/gap** 어느 분류에 들어가는지
- `tw-framework-front` 에서 새 페이지가 동일 기능을 요구할 때 **어떤 패키지 + 어떤 API** 를 써야 하는지 catalog

— 만을 제공한다. publish/ 의 248개 파일 × N시간 같은 계산은 부적절하다. 실제 마이그레이션 대상은 `tw-framework-front` 의 27개 페이지 (canonical MOD-GRID-17 affectedUsageFiles) 이며 별도 트랙.

---

## 1. 인벤토리

### 1.1 검색 도구

```
Grep "@mescius/wijmo|FlexGrid|wjFlexGrid"  publish/src/  → 5 files
Grep "AggridTable|AggridTreeTable|AgGridReact"  publish/src/  → 248 files
Grep "ag-grid-enterprise|LicenseManager|setLicenseKey"  publish/src/  → 0 files
Grep "treeData=true|masterDetail=true|aggFunc|pivotMode|getDataPath"  publish/src/  → 0 files
Grep "AllowMerging|frozenColumns|SelectionMode.CellRange|GroupDescription"  publish/src/  → 1 file
Grep "cellRenderer:"  publish/src/  → 9 files (callers; 셀 renderer 사용)
Grep "cellEditor:|cellEditor="  publish/src/  → 1 file (agTextCellEditor)
Grep "AggridTreeTable"  publish/src/  → 1 caller (basicInfo/accSubCode)
Grep "children:\[ ... (column groups)"  publish/src/  → 5 files
```

검증된 `package.json` 의존성:
```
"@mescius/wijmo.react.all": "file:wijmo-5.20261.50_KR/..."  (vendor bundle)
"ag-grid-community": "^33.0.3"
"ag-grid-react": "^33.1.1"
// ag-grid-enterprise: 미설치
```

### 1.2 핵심 발견 (Headline)

**248 파일이라는 숫자는 오해를 부른다.** 실제 surface area:

| 사실 | 영향 |
|---|---|
| `AggridTable.tsx` 는 `<AgGridReact rowData columnDefs />` 위의 **얇은 wrapper** (200줄). | 248 페이지 중 절대다수는 이 wrapper 단일 사용 — 즉 grid-core (MIT) 만으로 대응 가능 |
| `ag-grid-enterprise` **0 설치** + `LicenseManager` **0 호출** | AG Grid Enterprise 기능 (treeData/masterDetail/aggFunc/pivot/rowSpan/colSpan/range select/clipboard/contextMenu/Excel export) 미사용 |
| Wijmo CellRange/AllowMerging/frozenColumns **1 페이지** 만 사용 | 전체 Pro 스택은 `personal/commute-manage/organizeSchedule/page.tsx` 1곳 집중 |
| Wijmo 변경추적 (CollectionView trackChanges) 유틸 **4 파일** | `components/common/wijmo-grid/` 만 — 페이지 caller는 별도 (organizeSchedule만 직접 useWijmoGridCrud import 확인) |
| `AggridTreeTable.tsx` caller **1 페이지** | tree mode는 `account/basicInfo/accSubCode/page.tsx` 1곳 |

### 1.3 Wijmo 사용처 (전체 5 파일)

| 파일 | 역할 | 사용 features |
|---|---|---|
| `publish/src/components/common/wijmo-grid/utils.ts` | 변경추적 ChangeSet builder (순수 함수) | `CollectionView.itemsAdded/itemsEdited/itemsRemoved`, Mapping, Validator |
| `publish/src/components/common/wijmo-grid/useWijmoGridCrud.ts` | React hook — addRow/removeCurrent/buildJson/save | `wjCore.CollectionView`, trackChanges, addNew/commitNew/remove |
| `publish/src/components/common/wijmo-grid/Facade.ts` | 클래스 스타일 wrapper | `WijmoGridCrudFacade.add/remove/buildJson` |
| `publish/src/components/common/wijmo-grid/README.md` | 사용 문서 | (참고 자료) |
| `publish/src/app/personal/commute-manage/organizeSchedule/page.tsx` (~30 occurrences) | 근무일정편성 그리드 — Pro stack 풀세트 사용 | FlexGrid + CollectionView trackChanges + frozenColumns=4 + AllowMerging.ColumnHeaders + SelectionMode.CellRange + columnHeaders.rows[] 직접 조작 (2행 header, day/weekday) + formatItem 핸들러 (per-cell DOM mutation) + selectionChanged + keydown 직접 wiring + prepareCellForEdit + drag-fill 흔적 + maxLength enforcement |

### 1.4 AG Grid 사용처 (총 248 파일)

도메인별 분포 (top-level `publish/src/app/{domain}/` 또는 `publish/src/components/features/{domain}/`):

| 도메인 | 파일 수 | 주요 기능 |
|---|---|---|
| payroll | 27 | 급여/퇴직/연말정산 — 기본 grid + 일부 cellRenderer |
| account | 21 | 회계/전표 — 기본 grid + 일부 컬럼 그룹 |
| asset | 20 | 자산 — 기본 grid |
| evaluation | 19 | 평가 (MBO/competency/grade) — 일부 cellRenderer |
| personal | 18 | 인사 (commute/conduct/trip) — 기본 grid + 1 file `agTextCellEditor` |
| dashboard | 18 | 대시보드 — 기본 grid |
| contract | 18 | 계약 — 기본 grid |
| groupmail | 14 | 메일·청렴·감사 — 기본 grid |
| features | 13 | 결재·docu* 등 공통 컴포넌트 | 
| general | 12 | 메모·통신·공지 — 기본 grid |
| customer | 12 | 고객 — 기본 grid |
| bsc | 10 | BSC/KPI — 일부 cellRenderer |
| business | 8 | 프로젝트 — 기본 grid |
| approval | 8 | 결재 워크플로우 |
| finance | 6 | 자금 — 기본 grid |
| community | 6 | 커뮤니티 (mail/msg/vote/board) |
| common | 6 | 공통 모달 (FindUserModal, SearchSlipDetailModal 등) |
| expert | 5 | 전문가풀 |
| master-data | 4 | 기준정보 (dept/site/code-group) |
| template | 2 | 템플릿 페이지 |
| budget | 1 | 예산 |

증거:
```
grep -rl "AggridTable|AggridTreeTable|AgGridReact" publish/src/ | wc -l  → 248
도메인별 분포는 sed/cut 그룹화로 산출 (작업 로그 기록됨)
```

### 1.5 tw-framework-front 잔존 사용 (sanity probe)

```
Grep "@mescius/wijmo|ag-grid|AgGridReact|FlexGrid" tw-framework-front/src/  → 0 matches
```

**0건.** 이미 `BaseGrid|VirtualGrid|EditableGrid|GroupedHeaderGrid|TreeGrid|ColumnPinGrid|ChangeTrackingGrid|RangeSelectGrid|DataTable` wrapper 들로 추상화되어 있다 (canonical MOD-GRID-01/05 참조). tw-grid 마이그레이션은 이 wrapper 들의 내부 구현을 `@tomis/grid-*` 호출로 교체하는 작업이며, 페이지 코드는 그대로 유지 (Deprecated alias 1 minor — C-6).

---

## 2. 페이지별 대체 가능성 (Tier 분류)

개별 248 페이지를 나열하는 대신 **사용 패턴 Tier** 로 분류한다. 동일 패턴 페이지의 매핑 catalog는 동일하므로, Tier 단위 + exemplar file:line + page count 가 의미 있는 단위.

| Tier | 정의 | 필요 패키지 | 분류 | 대표 페이지 | 추정 페이지 수 |
|---|---|---|---|---|---|
| **T0** | `<AgGridTable columnDefs rowData />` — 컬럼 정의는 flat 배열, 데이터 바인딩만 | `@tomis/grid-core` (MIT) | **A 완전 대체** | `publish/src/app/payroll/retirement/severance-code/page.tsx:47` | ~225 (T0 = 248 - T1 - T2 - T3 - T4 - T5) |
| **T1** | T0 + custom `cellRenderer:` 함수 (action 버튼/badge/icon) | + `@tomis/grid-renderers` (MIT) | **A 완전 대체** | `publish/src/app/evaluation/mbo/peer/page.tsx`, `bsc/setting/page.tsx`, 외 7 | 9 (grep `cellRenderer:` files_with_matches) |
| **T2** | T0/T1 + multi-row header (`columnDefs.children:[]`) | + `@tomis/grid-pro-header` (Pro) | **A 완전 대체** | `publish/src/app/account/tax/vat/purchase-sales-ledger/page.tsx`, `account/tax/vat/nts-purchase-data/page.tsx`, 외 3 | 5 (grep `children:\[` files with AG Grid co-presence) |
| **T3** | T0 + Tree 모드 (`<AggridTreeTable rowData columnDefs />` — level/isParent/children field) | + `@tomis/grid-pro-master` (Pro) | **A 완전 대체** (MOD-GRID-16 F-16-03 getSubRows + 자동 들여쓰기) | `publish/src/app/account/basicInfo/accSubCode/page.tsx` | 1 (grep AggridTreeTable callers) |
| **T4** | T0 + inline cellEditor (`cellEditor: 'agTextCellEditor'`) + `onCellValueChanged` | + `@tomis/grid-renderers` InlineEditCell (MOD-GRID-05 F-05-03) | **A 완전 대체** | `publish/src/app/personal/commute-manage/basic/page.tsx:70,105` | 1 (grep cellEditor:) |
| **T5** | **Wijmo Pro 전체 스택**: CollectionView trackChanges + FlexGrid + frozenColumns + AllowMerging + CellRange selection + 2행 columnHeaders 직접 조작 + formatItem per-cell DOM mutation + drag-fill + keyboard 편집 | + `@tomis/grid-pro-tracking` + `@tomis/grid-pro-range` + `@tomis/grid-pro-merging` + `@tomis/grid-pro-header` + `@tomis/grid-license` | **B 부분 대체** (§5 gap 참조) | `publish/src/app/personal/commute-manage/organizeSchedule/page.tsx` | 1 |
| **T6** | Wijmo 변경추적 유틸 (페이지 caller 미사용 = 라이브러리 코드 자체) | `@tomis/grid-pro-tracking` (MOD-GRID-10 F-10-01..10) | **A 완전 대체** | `publish/src/components/common/wijmo-grid/useWijmoGridCrud.ts` | 1 (utility) |

**분류 분포 요약:**

| 분류 | 정의 | 페이지 수 | 비중 |
|---|---|---|---|
| **A 완전 대체** (T0~T4 + T6) | tw-grid 패키지 1:1 매핑 | 241 + 1 utility | ~97% |
| **B 부분 대체** (T5) | 대부분 대체 가능하나 일부 patternapi gap | 1 | <1% |
| **C 차단 — 기능 부재** | tw-grid 미지원 기능 | **0** | 0% |
| **D 차단 — API gap** | wrapper 필요한 signature 차이 | **0** (API gap은 있으나 차단 수준은 아님 — 마이그레이션 alias 활용 가능) | 0% |

**근거**: `ag-grid-enterprise` 미설치 + `treeData/masterDetail/aggFunc/pivotMode/getDataPath` grep 0 hits — Enterprise 전용 기능 사용 0. 따라서 AG Grid 측에는 C/D 차단이 존재하지 않는다.

---

## 3. tw-grid 대응 매트릭스 (canonical 모듈 인용)

### 3.1 Wijmo API → tw-grid 패키지

| Wijmo API | tw-grid 패키지 | canonical 모듈 (MOD-GRID-*) | 대응 기능 |
|---|---|---|---|
| `CollectionView` + `trackChanges: true` | `@tomis/grid-pro-tracking` (Pro) | MOD-GRID-10 (F-10-01..10) | `useChangeTracking<TData>(initialData, options)` |
| `cv.itemsAdded/itemsEdited/itemsRemoved` | `@tomis/grid-pro-tracking` | MOD-GRID-10 F-10-04 | `getChangeSet()` (added/updated/deleted) |
| `cv.addNew()/commitNew()` | `@tomis/grid-pro-tracking` | MOD-GRID-10 F-10-03 | `addRow(seed)` |
| `cv.remove(currentItem)` | `@tomis/grid-pro-tracking` | MOD-GRID-10 F-10-03 | `deleteRow(key)` |
| `Mapping` (화면→BE 필드) | `@tomis/grid-pro-tracking` | MOD-GRID-10 F-10-05 | string \| (row)=>any |
| `Validator` (row→{valid,errors}) | `@tomis/grid-pro-tracking` | MOD-GRID-10 F-10-06 | `validator` 옵션 |
| `<FlexGrid itemsSource={cv} initialized={...} />` | `@tomis/grid-core` `<Grid />` | MOD-GRID-01 F-01-01..12 | data prop + useEffect/ref |
| `g.frozenColumns = N` | `@tomis/grid-core` | MOD-GRID-01 F-01-04~05 | `enableColumnPinning` + ColumnDef.meta.pin |
| `g.allowMerging = AllowMerging.*` | `@tomis/grid-pro-merging` (Pro) | MOD-GRID-13 F-13-01..05 | `column.mergeRows: boolean \| (a,b)=>boolean` |
| `g.selectionMode = SelectionMode.CellRange` | `@tomis/grid-pro-range` (Pro) | MOD-GRID-11 F-11-01..10 | `enableCellRangeSelection` |
| `g.allowSorting = AllowSorting.None` | `@tomis/grid-core` | MOD-GRID-01 F-01-02 | `enableSort={false}` |
| `g.headersVisibility = HeadersVisibility.All` | `@tomis/grid-core` | (디폴트) | n/a (헤더 항상 표시) |
| `g.columnHeaders.rows[1] = new Row()` (직접 조작) | `@tomis/grid-pro-header` (Pro) | MOD-GRID-14 F-14-01..03 (※ §5 gap 참조) | `createColumnGroup({header, columns:[]})` |
| `g.formatItem.addHandler((s,e)=>e.cell.style.*)` (per-cell DOM mutation) | `@tomis/grid-core` + `@tomis/grid-renderers` (MIT) | MOD-GRID-01 F-01-10 + MOD-GRID-05 F-05-04 | `cellClassName` callback + 커스텀 cellRenderer (§5 gap 참조) |
| `g.selectionChanged.addHandler` | `@tomis/grid-core` | MOD-GRID-02 F-02-03 | `onStateChange` (rowSelection slice) |
| `g.prepareCellForEdit.addHandler` | `@tomis/grid-renderers` InlineEditCell | MOD-GRID-05 F-05-03 | onEditStart hook (§5 gap) |
| `wjCore.Globalize.format(date, 'yyyy-MM')` | (peer dep) | n/a | dayjs (`'yyyy-MM'` → `'YYYY-MM'`) — 어플리케이션 영역 |
| `wjCore.DataType.String` | (불필요) | n/a | TypeScript 타입 추론 |
| Wijmo setLicenseKey (도메인 키) | `@tomis/grid-license` | MOD-GRID-99-A F-99A-01..06 | `setLicenseKey(key)` global API |

### 3.2 AG Grid API → tw-grid 패키지

| AG Grid API | tw-grid 패키지 | canonical 모듈 | 대응 기능 |
|---|---|---|---|
| `<AgGridReact rowData columnDefs />` | `@tomis/grid-core` `<Grid />` | MOD-GRID-01 F-01-01 | `data` + `columns` prop |
| `ColDef { field, headerName, flex }` | `@tomis/grid-core` (TanStack ColumnDef) | MOD-GRID-04 F-04-01..05 | `createColumns<TData>([{id, type, align, name, width}])` |
| `ColDef { children: [...] }` (column groups) | `@tomis/grid-pro-header` (Pro) | MOD-GRID-14 F-14-01 | `createColumnGroup({header, columns:[]})` |
| `ColDef.cellRenderer: (params)=>JSX` | `@tomis/grid-renderers` (MIT) | MOD-GRID-05 F-05-04, F-05-06 | `column.cell` (TanStack) 또는 `components` registry |
| `ColDef.valueFormatter` | `@tomis/grid-renderers` formatter helpers | MOD-GRID-05 F-05-05 | `formatNumberString/formatDateTime` |
| `ColDef.cellEditor: 'agTextCellEditor'` | `@tomis/grid-renderers` InlineEditCell | MOD-GRID-05 F-05-03 | type: 'text' (number/date/select/textarea) |
| `ColDef.cellStyle: { textAlign: 'center' }` | `@tomis/grid-core` Tailwind | MOD-GRID-01 F-01-10 (C-5 인라인 style 금지) | `meta.align: 'center'` |
| `onRowClicked` | `@tomis/grid-core` | MOD-GRID-01 F-01-09 (ADR-016 2-arg) | `onRowClick(row, event)` |
| `onRowDoubleClicked` | `@tomis/grid-core` | MOD-GRID-01 F-01-09 | `onRowDoubleClick` |
| `onCellClicked` | `@tomis/grid-core` | MOD-GRID-01 F-01-09 | `onCellClick` |
| `onCellValueChanged` | `@tomis/grid-pro-tracking` | MOD-GRID-10 F-10-03~06 | InlineEditCell + onChange via useChangeTracking |
| `onSelectionChanged` | `@tomis/grid-core` | MOD-GRID-02 F-02-03 | `onStateChange` (rowSelection slice) |
| `rowSelection: 'single'|'multiple'` | `@tomis/grid-core` | MOD-GRID-01 F-01-03 | `rowSelection: 'single'|'multi'|'none'` |
| `getRowClass/getRowStyle` | `@tomis/grid-core` | MOD-GRID-01 F-01-10 | `rowClassName` callback (Tailwind) |
| `overlayNoRowsTemplate` | `@tomis/grid-core` | MOD-GRID-01 F-01-06 | `emptyState` slot |
| `getRowHeight` | `@tomis/grid-core` | (TanStack row.size) | `rowHeight` prop 또는 callback |
| `defaultColDef` | `@tomis/grid-core` | MOD-GRID-04 F-04-03 | `createColumns` 디폴트 메타 |
| `enableCellTextSelection` | `@tomis/grid-core` | (디폴트 selectable) | (Tailwind `user-select` 가능) |
| `clearSelectionKey` (커스텀 prop) | `@tomis/grid-core` | MOD-GRID-01 F-01-08 (ref imperative) | `gridRef.current.clearSelection()` |
| `autoSelectFirstRow` (커스텀 prop) | `@tomis/grid-core` | MOD-GRID-01 F-01-07 | `autoSelectFirstRow` prop |
| ModuleRegistry.registerModules([...]) | (불필요) | n/a | tw-grid 단일 import, registry 불요 |
| `AggridTreeTable rowData levelField isParentField childrenField` | `@tomis/grid-pro-master` (Pro) | MOD-GRID-16 F-16-03..04 | tree mode — `getSubRows` + 자동 들여쓰기 + 토글 아이콘 |
| AG Grid Enterprise (LicenseManager) | (미사용 — 본 코드베이스) | MOD-GRID-99-A | (필요 없음) |

---

## 4. 매핑 catalog — 패턴 family 별 before/after (정규 5 샘플)

publish/ 의 248 페이지가 5개 패턴 family 안에 들어간다. 각 family 1샘플 (재사용 시 동일 추론).

### 4.1 [T0] AG Grid 기본 — `<AgGridTable columnDefs rowData />`

**Before** (`publish/src/app/payroll/retirement/severance-code/page.tsx:27-47`):
```tsx
import AgGridTable from "@/components/common/aggrid/AggridTable";
const columnDefs = [
  { headerName: "코드", field: "codeCd", flex: 0.5 },
  { headerName: "코드명", field: "codeNm", flex: 1 },
  { headerName: "분류", field: "codeClass", flex: 0.8 },
  { headerName: "사용여부", field: "useYn", flex: 0.5 },
];
<AgGridTable columnDefs={columnDefs} rowData={rowData} />
```

**After** (tw-grid):
```tsx
import { Grid, createColumns } from '@tomis/grid-core';
const columns = createColumns<Row>([
  { id: 'codeCd',    name: '코드',     width: '0.5fr' },
  { id: 'codeNm',    name: '코드명',   width: '1fr' },
  { id: 'codeClass', name: '분류',     width: '0.8fr' },
  { id: 'useYn',     name: '사용여부', width: '0.5fr' },
]);
<Grid data={rowData} columns={columns} />
```

### 4.2 [T1] AG Grid + custom cellRenderer

**Before** (`publish/src/app/evaluation/mbo/peer/page.tsx` 패턴):
```tsx
const columnDefs = [
  { headerName: "이름", field: "name", flex: 1 },
  {
    headerName: "상태",
    field: "status",
    cellRenderer: (params: any) => (
      <span className={params.value === 'A' ? 'badge-green' : 'badge-gray'}>
        {params.value}
      </span>
    ),
  },
];
<AgGridTable columnDefs={columnDefs} rowData={rowData} />
```

**After**:
```tsx
import { Grid, createColumns } from '@tomis/grid-core';
import { BadgeCell } from '@tomis/grid-renderers';
const columns = createColumns<Row>([
  { id: 'name',   name: '이름', width: '1fr' },
  { id: 'status', name: '상태', type: 'badge',
    badgeMap: { A: 'green', default: 'gray' } },
]);
// 커스텀이 더 자유로워야 하면:
//   cell: ({ row }) => <CustomBadge value={row.original.status} />
<Grid data={rowData} columns={columns} />
```

### 4.3 [T2] AG Grid + multi-row header (column groups)

**Before** (`publish/src/app/account/tax/vat/purchase-sales-ledger/page.tsx` 패턴):
```tsx
const columnDefs = [
  { headerName: "기본정보",
    children: [
      { headerName: "전표번호", field: "slipNo" },
      { headerName: "전표일자", field: "slipYmd" },
    ]
  },
  { headerName: "금액",
    children: [
      { headerName: "공급가액", field: "supplyAmt" },
      { headerName: "부가세",   field: "vatAmt" },
    ]
  },
];
<AgGridTable columnDefs={columnDefs} rowData={rowData} />
```

**After**:
```tsx
import { Grid, createColumns } from '@tomis/grid-core';
import { createColumnGroup } from '@tomis/grid-pro-header';
import { setLicenseKey } from '@tomis/grid-license';
setLicenseKey(import.meta.env.VITE_TOMIS_GRID_LICENSE);
const columns = createColumns<Row>([
  createColumnGroup({
    header: '기본정보',
    columns: [
      { id: 'slipNo',  name: '전표번호' },
      { id: 'slipYmd', name: '전표일자' },
    ],
  }),
  createColumnGroup({
    header: '금액',
    columns: [
      { id: 'supplyAmt', name: '공급가액', type: 'number' },
      { id: 'vatAmt',    name: '부가세',   type: 'number' },
    ],
  }),
]);
<Grid data={rowData} columns={columns} />
```

### 4.4 [T3] AG Grid Tree 모드 — `<AggridTreeTable />`

**Before** (`publish/src/app/account/basicInfo/accSubCode/page.tsx` 패턴):
```tsx
<AggridTreeTable
  rowData={treeData}
  columnDefs={[{ headerName: '계정명', field: 'name' }]}
  levelField="level"
  isParentField="isParent"
  childrenField="children"
  groupDefaultExpanded={-1}
/>
```

**After**:
```tsx
import { Grid, createColumns } from '@tomis/grid-core';
import { useTreeData } from '@tomis/grid-pro-master';
import { setLicenseKey } from '@tomis/grid-license';
setLicenseKey(import.meta.env.VITE_TOMIS_GRID_LICENSE);

const { getSubRows } = useTreeData<TreeRow>({
  childrenField: 'children',
  defaultExpandAll: true,
});
const columns = createColumns<TreeRow>([
  { id: 'name', name: '계정명' /* tree mode automatically renders 토글 + indent */ },
]);
<Grid
  data={treeData}
  columns={columns}
  getSubRows={getSubRows}
  enableExpanding
/>
```

### 4.5 [T6] Wijmo 변경추적 (CollectionView trackChanges) — useWijmoGridCrud → useChangeTracking

**Before** (`publish/src/components/common/wijmo-grid/useWijmoGridCrud.ts` 사용 패턴):
```tsx
import * as wjCore from '@mescius/wijmo';
import { FlexGrid } from '@mescius/wijmo.react.grid';
import { useWijmoGridCrud } from '@/components/common/wijmo-grid/useWijmoGridCrud';

const cvRef = useRef<wjCore.CollectionView | null>(null);
useEffect(() => {
  cvRef.current = new wjCore.CollectionView(initialRows, { trackChanges: true });
}, [initialRows]);

const { addRow, removeCurrent, hasChanges, buildJson } = useWijmoGridCrud(cvRef);

return (
  <>
    <FlexGrid itemsSource={cvRef.current} initialized={(g) => { gridRef.current = g; }} />
    <button onClick={() => addRow({ useYn: 'Y' })}>추가</button>
    <button onClick={removeCurrent}>삭제</button>
    <button onClick={async () => {
      if (!hasChanges()) return;
      const payload = buildJson({ mapping, validator });
      await saveWorkTypeChangeSet(payload);
    }}>저장</button>
  </>
);
```

**After**:
```tsx
import { Grid, createColumns } from '@tomis/grid-core';
import { useChangeTracking } from '@tomis/grid-pro-tracking';
import { setLicenseKey } from '@tomis/grid-license';
setLicenseKey(import.meta.env.VITE_TOMIS_GRID_LICENSE);

const tracking = useChangeTracking<Row>(initialRows, {
  rowKey: (r) => r.workTypeId,
  mapping,        // 화면→BE 필드 매핑 — string | (row)=>any
  validator,      // (row)=>{valid,errors}
});

return (
  <>
    <Grid
      data={tracking.rows}
      columns={columns}
      enableInlineEdit
      onCellEdited={tracking.updateRow}
      rowClassName={(row) => tracking.statusOf(row) /* added/edited/deleted 자동 클래스 */}
    />
    <button onClick={() => tracking.addRow({ useYn: 'Y' })}>추가</button>
    <button onClick={() => tracking.deleteRow(tracking.selectedKey)}>삭제</button>
    <button onClick={async () => {
      if (!tracking.hasChanges()) return;
      const payload = tracking.getChangeSet();  // { added, updated, deleted, errors }
      await saveWorkTypeChangeSet(payload);
      tracking.commitChanges();  // 성공 시 변경 이력 클리어
    }}>저장</button>
  </>
);
```

**핵심 매핑**:
- `cv.itemsAdded/itemsEdited/itemsRemoved` → `tracking.getChangeSet()`
- `cv.addNew() + currentAddItem` → `tracking.addRow(seed)`
- `cv.remove(cv.currentItem)` → `tracking.deleteRow(key)`
- `clearChanges(cv)` → `tracking.commitChanges()`
- ChangeSet 구조 `{added, removed, updated, errors}` → `{added, deleted, updated, errors}` (alias 가능)
- Mapping/Validator 시그니처: 동일 (string | (row)=>any) / ((row)=>{valid,errors}) — drop-in 호환

---

## 5. Gap / Risk 분석

### 5.1 tw-grid 미커버 기능 (구체적 식별)

publish/ 사용처 기준 실제 발견된 gap (조작/실제 위험도 표기):

| # | gap | 위치 (publish/) | tw-grid 측 대응 | 위험도 | 해소 방안 |
|---|---|---|---|---|---|
| **G-1** | `wjCore.Globalize.format(date, 'yyyy-MM')` | `organizeSchedule/page.tsx:38` | 없음 — 어플리케이션 영역 (peer dep) | 낮음 | dayjs 또는 native Intl.DateTimeFormat — 1줄 치환 |
| **G-2** | `wjCore.DataType.String` (column dataType enum) | `organizeSchedule/page.tsx:61` | 없음 — TanStack 은 TS 타입 추론, 런타임 enum 불요 | 낮음 | 삭제 (지정 안 해도 동작) |
| **G-3** | `g.formatItem.addHandler((s,e) => e.cell.style.*)` — per-cell **DOM mutation hook** (선택 상태/주말/값 유무/배경/색 동적 적용) | `organizeSchedule/page.tsx:182-244` (~60줄) | `cellClassName` callback + 커스텀 cellRenderer 조합 (MOD-GRID-01 F-01-10 + MOD-GRID-05 F-05-04). 단 API shape 다름 — formatItem 은 post-render mutation, cellClassName 은 pre-render class string | **중** — 시각 회귀 위험. selection 동기화 부분은 TanStack rowSelection state 로 대체 가능하나, 1셀 단위 outline/배경 변경은 cellRenderer 로 옮겨야 함 | 마이그레이션 시 cellClassName 매핑표 작성. Tailwind `data-[state=selected]:bg-indigo-100` 패턴 활용 |
| **G-4** | `g.columnHeaders.rows[1] = new wjGrid.Row()` + `hdr.setCellData(row, col, value)` — **데이터-driven 동적 헤더** (day=01..31 + weekday=일/월/화 2행) | `organizeSchedule/page.tsx:111-135` | MOD-GRID-14 F-14-01 `createColumnGroup({header, columns})` 는 **정적 group header** 만 지원. **동적 per-cell 헤더 콘텐츠** 는 명시되지 않음 | **중** — 31개 day-of-month + weekday 동적 표시는 createColumnGroup 으로 표현 어려움 | 옵션 A) MOD-GRID-14 에 `headerCell: (col, row) => JSX` 동적 헤더 prop 추가 (canonical 보강 필요 — 사용자 결정). 옵션 B) 어플리케이션이 31 column 객체를 동적 생성 (현재 publish 와 동일) — tw-grid 측 변경 없이 가능 |
| **G-5** | `g.allowMerging = AllowMerging.ColumnHeaders` (헤더 셀 자체 병합 — day+weekday 2행 사이) | `organizeSchedule/page.tsx:92` | MOD-GRID-13 `column.mergeRows` 는 **body cell rowSpan 자동 병합**. 헤더 행 사이 colSpan 병합 (AllowMerging.ColumnHeaders) 는 명시되지 않음 | **중** | MOD-GRID-14 (pro-header) 와 MOD-GRID-13 (pro-merging) 사이 협업 spec 필요. 또는 `createColumnGroup` 으로 자연스럽게 표현 (`{header: '01', columns: [{name: '일', ...}]}` 구조) |
| **G-6** | `g.prepareCellForEdit.addHandler` — 에디터 DOM (input element) 직접 조작 (maxLength=4, textAlign center, keydown stopPropagation) | `organizeSchedule/page.tsx:287-299` | MOD-GRID-05 F-05-03 InlineEditCell 은 사전 옵션 (`maxLength`, `align`) 제공 가능. 단 `editor.addEventListener('keydown', stopPropagation)` 같은 native DOM hook 은 명시 안 됨 | 낮음 | 옵션 prop 추가 (`onEditStart(cellRef)` 같은 ref callback) — F-05-03 보강 가능 |
| **G-7** | `g.hostElement.addEventListener('keydown', ...)` — grid hostElement 레벨 키보드 wiring (Char 입력 → startEditing 강제) | `organizeSchedule/page.tsx:252-284` | tw-grid 의 imperative ref (MOD-01 F-01-08) 는 `addRow/deleteRow/scrollTo/getSelection` 만 명시 — `hostElement` 레벨 native event 직접 노출 없음 | **중** | 어플리케이션 레벨 wrapper div 에 `onKeyDown` 부착 + `gridRef.current.getActiveCell()` API 추가. MOD-01 F-01-08 보강 또는 사용자 어플리케이션 측 처리 |
| **G-8** | `g.updatedLayout.addHandler` — 레이아웃 변경 시 (라이선스 모달 close, resize 등) 재계산 콜백 | `organizeSchedule/page.tsx:169` | 명시 안 됨 | 낮음 | window.resize listener + ResizeObserver 로 대체 가능 (어플리케이션 영역) |

### 5.2 위에 해당하지 않는 미커버 기능 (publish/ 에 없음, 단 향후 신규 페이지 요구 시 잠재 gap)

| 기능 | publish 사용 여부 | tw-grid 대응 | 비고 |
|---|---|---|---|
| AG Grid Enterprise treeData (자동 path-based) | **0** | MOD-GRID-16 F-16-03 getSubRows | 우회 패턴 (children field) |
| AG Grid Enterprise masterDetail | **0** | MOD-GRID-16 F-16-01 renderDetailRow | 우회 |
| AG Grid Enterprise rowGrouping + aggFunc + pivot | **0** | MOD-GRID-15 F-15-01..06 | grid-pro-agg |
| AG Grid Enterprise Range Selection / Fill / Clipboard | **0** | MOD-GRID-11 F-11-01..10 | grid-pro-range |
| AG Grid Enterprise rowSpan/colSpan | **0** (publish 의 rowSpan 150 hit 은 HTML `<td colSpan>` 폼 레이아웃) | MOD-GRID-13 F-13-01..05 | grid-pro-merging |
| AG Grid Enterprise contextMenu | **0** | MOD-GRID-16 F-16-05 | grid-pro-master |
| AG Grid Enterprise Excel export | **0** (xlsx 직접) | MOD-GRID-06 F-06-01..07 | grid-export (MIT) |
| Wijmo PdfExport (FlexGridPdfConverter) | **0** | MOD-GRID-06 F-06-02 | grid-export (jspdf peer) |

→ **publish 코드베이스에 실제로 사용된 기능 중 tw-grid 가 **차단** 수준으로 막는 것은 0개.** Gap 은 모두 어플리케이션 영역(G-1, G-2, G-8) 이거나 API surface 추가/보강으로 해결 가능 (G-3~G-7).

### 5.3 마이그레이션 우선순위 권고

본 문서는 publish 자체 마이그레이션이 아닌 향후 tw-framework-front 신규 페이지 작업 가이드이므로, 우선순위 = **신규 페이지가 어떤 패턴을 가장 자주 요구할지** 기준.

| 우선순위 | Tier | 적용 권고 시점 |
|---|---|---|
| Phase 1 (Quick wins) | T0 + T1 (~234 패턴 페이지) | grid-core + grid-renderers (MIT 무료 — tw-grid 마이그레이션 Wave 1/2 완료시점부터 즉시 가능) |
| Phase 2 (Pro features) | T2 + T3 + T4 + T6 (~17 패턴) | grid-pro-header / pro-master / pro-tracking / grid-license — Pro 패키지 라이선스 정책 결정 후 |
| Phase 3 (복잡/잠재 gap) | T5 (1 페이지: organizeSchedule) | grid-pro-range + grid-pro-merging + grid-pro-header + grid-pro-tracking + grid-license. **G-3~G-7 5개 gap 해소 spec 필요** → 사용자 결정 지점 (§7 참조) |

### 5.4 위험 평가

| 위험 | 등급 | 완화 |
|---|---|---|
| 시각 회귀 (T5 organizeSchedule formatItem DOM mutation) | **중** | Playwright 시각 회귀 (canonical MOD-GRID-99-B F-99B-04, C-13/C-17 — 의무) |
| 사용자 학습곡선 (Wijmo Globalize/DataType enum 의존) | 낮음 | 마이그레이션 가이드 문서 (MOD-GRID-99-B F-99B-06) |
| Pro 라이선스 cost (현 publish: Wijmo + AG Grid Enterprise 0 → tw-grid Pro 8 새 채택) | **중** | grid-license 의 자체 키 발급 정책 (MOD-GRID-99-A F-99A-02 — JWT/HMAC ADR 필요) |
| API shape 차이 (formatItem vs cellClassName, hostElement event vs ref) | 낮음 | 호환성 alias (MOD-GRID-01 F-01-12, C-6 — 1 minor 버전 유지) |
| Wijmo CollectionView API 의존 (~organizeSchedule 1 페이지 + utility 3 파일) | 낮음 | useChangeTracking 1:1 매핑 가능 (T6 매핑 catalog) |

---

## 6. 마이그레이션 계획 권고 (3 Phase)

| Phase | 범위 | 패턴 페이지 수 | 의존 패키지 | 추정 (시간) | 비고 |
|---|---|---|---|---|---|
| **Phase 1** | T0/T1 — 기본 wrapper + custom cellRenderer | ~234 | grid-core (MIT) + grid-renderers (MIT) | (publish 자체 마이그레이션 시) 페이지당 10~30분 — 패턴 통일된 후 codemod 가능 | tw-grid 마이그레이션 Wave 5 완료 시점부터 publish 외부 신규 페이지에서 즉시 활용 가능 |
| **Phase 2** | T2/T3/T4/T6 — column groups + Tree + InlineEdit + ChangeTracking | ~17 | + grid-pro-header / pro-master / grid-pro-tracking / grid-license | 페이지당 30~90분 | grid-license MOD-99-A 완료 (ADR-014 key 알고리즘) + Pro 패키지 EULA 결정 필요 |
| **Phase 3** | T5 — Wijmo Pro 전체 스택 (organizeSchedule) | 1 | + grid-pro-range + grid-pro-merging | 8~16시간 + spec 작성 | **G-3~G-7 5개 gap 해소 spec 필요** — canonical MOD-GRID-13/14 보강 또는 ADR 추가 |

**총량 추정 (참고용)** = Phase 1: 234 × 20분 = ~78시간, Phase 2: 17 × 60분 = ~17시간, Phase 3: 1 × 12시간 + spec = ~16시간. **합 ~111시간 (대략 3주)**. 단 이는 **publish 자체를 옮긴다는 가정** 하의 산정이며, 본 문서 framing 상 publish 는 참조이므로 실제 작업량은 tw-framework-front 신규 페이지 건수에 비례한다.

---

## 7. 사용자 결정 지점 (critical 5 해당 시만)

§6 정책 평가: critical 5 (A 비즈니스 정책 / B 외부 사용자 / C 비용 / D 비가역 / E 환경) 해당 여부:

| 결정 지점 | critical 5 | 자체 결정 vs 사용자 surface |
|---|---|---|
| **D-1**. 미커버 기능 (G-3 ~ G-7) 대응 방식 — tw-grid 신 spec 추가 vs 어플리케이션 영역 처리 | A (canonical 모듈 spec 변경 → 비즈니스 영역) | **사용자 surface 권고**. G-4 (동적 헤더), G-5 (헤더 병합), G-7 (hostElement keyboard) 는 canonical MOD-GRID-13/14/01 보강 필요. ADR 작성 + 사용자 검토 |
| **D-2**. Pro 라이선스 키 발급 정책 (grid-license MOD-99-A F-99A-02: JWT vs HMAC) | A + C (라이선스 cost) | **이미 진행 중** — wave-residual-2-adr-012-result.md 에서 ADR-012 (라이선스 키) 다룸. 본 문서에서 신규 결정 불요 |
| **D-3**. 마이그레이션 시점 (점진 vs 일괄) | E (환경) | **자체 결정 가능** — 본 문서 §6 권고: Phase 1 → 2 → 3 점진. publish 자체는 참조이므로 일괄/점진 모두 동일 (실제 마이그레이션 트랙은 tw-framework-front MOD-GRID-17, canonical 6 Goals 분할) |
| **D-4**. publish 추가 인벤토리/심층 분석 필요성 (G-3~G-7 의 organizeSchedule 외 동일 패턴 페이지 존재 여부 — 본 분석은 grep 기반이며 100% 보장 안 됨) | A | **사용자 surface 권고**. 현재 grep 기반 분석은 표면 패턴만 잡음. organizeSchedule 같은 복합 Pro 사용 페이지가 향후 신규 요구로 추가될 수 있음 → tw-grid Pro spec 보강 trigger 시 advisor 호출 권고 |

→ **사용자 surface 항목 = D-1 + D-4 (2건)**

다만 본 분석 자체는 **read-only 분석 + 보고서 작성** 으로 §6 정책상 critical 5 비해당. 본 보고서는 단순 fact-finding 산출물이며, 후속 조치 결정 (D-1, D-4) 은 별도 의사결정 트랙.

---

## 8. 알려진 한계

| # | 한계 | 영향 |
|---|---|---|
| L-1 | 정적 grep 기반 분석. 런타임 호출/동작 미검증. | 100% 정확 보장 안 됨. 특히 `cellRenderer:` 9 파일이 실제로 어떤 종류의 컴포넌트를 렌더하는지는 파일별 detail read 미완 (3개 sampling 만 실시). |
| L-2 | publish/ 외 다른 마이그레이션 소스 (`TBIZONE/kdemo-front`, `tv_erp_publ-main`) 미분석. | 본 task 의 분석 대상은 publish/ + tw-framework-front 한정. 만일 다른 source 에서 추가 패턴 발견 시 본 문서 보강 필요. |
| L-3 | 도메인별 248 파일 분포는 sed/cut 기반 그루핑이라 features/{domain}/ 와 app/{domain}/ 사이 일부 중복/이중 카운트 가능성 (수치 오차 ±5). | 우선순위 평가의 큰 그림에는 영향 없음. |
| L-4 | T5 (organizeSchedule) 1 페이지 외에도 동일한 Wijmo 패턴 페이지가 존재할 수 있는지 — `wjCore.CollectionView`/`AllowMerging`/`SelectionMode.CellRange` grep 결과는 1 파일 (utility 제외) 이지만 향후 publish 가 변경되거나 다른 reference (TBIZONE/kdemo-front 등) 가 사용된다면 별도 확인 필요. | grep 0 hit 확인됨 — 현 publish/ 한정 정합. |
| L-5 | `makeGrid.tsx` / `makeGridPivot.tsx` (custom 손제작 `<table>`) 은 본 분석 범위 외 (Wijmo/AG Grid 미사용). 그러나 동일 페이지의 grid 영역이 향후 tw-grid 로 통합될 가능성은 별도 분석 필요. | 본 문서 framing 상 out of scope. |
| L-6 | publish CLAUDE.md 표시 정보 (Next.js 15 + React 19 + Tailwind v3) 와 tw-framework-front (Vite + React 19 + Tailwind v4) 사이 빌드 환경 차이로 일부 import path / SSR 차이 가능. tw-grid `'use client'` directive 필요성 등 별도 검토 필요. | 본 매핑 catalog 는 직접적 영향 없음 (export 인터페이스 동일). |

---

## 부록 A: 인용된 canonical 모듈 (참조)

본 매트릭스에서 인용한 canonical-modules.json 모듈:

- MOD-GRID-01 (grid-core `<Grid />` 공통 wrapper) — `canonical-modules.json:66-106`
- MOD-GRID-02 (useGridState) — `canonical-modules.json:108-132`
- MOD-GRID-03 (페이지네이션) — `canonical-modules.json:134-161`
- MOD-GRID-04 (createColumns) — `canonical-modules.json:163-189`
- MOD-GRID-05 (cell renderers + InlineEditCell) — `canonical-modules.json:191-228`
- MOD-GRID-06 (Excel/PDF/CSV export) — `canonical-modules.json:230-259`
- MOD-GRID-10 (ChangeTracking + Mapping + Validator) — `canonical-modules.json:341-376`
- MOD-GRID-11 (Cell Range + Drag-fill + Clipboard) — `canonical-modules.json:378-412`
- MOD-GRID-12 (DataMap) — `canonical-modules.json:414-439`
- MOD-GRID-13 (Cell Merging) — `canonical-modules.json:441-465`
- MOD-GRID-14 (Multi-row Header — column groups) — `canonical-modules.json:467-492`
- MOD-GRID-15 (Aggregation) — `canonical-modules.json:494-519`
- MOD-GRID-16 (Master-Detail + TreeGrid + Context Menu) — `canonical-modules.json:521-554`
- MOD-GRID-99-A (grid-license) — `canonical-modules.json:611-636`
- MOD-GRID-99-B (docs + Storybook) — `canonical-modules.json:638-665`

## 부록 B: tw-framework-front 사용처 (참조 — 별도 트랙)

canonical MOD-GRID-17 affectedUsageFiles (27 파일) 은 `tw-framework-front/src/pages/**` 의 27 페이지 — Goal 1~6 으로 분할되어 `canonical-modules.json:558-609` 에 기록. 본 문서는 publish/ 인벤토리이며, MOD-GRID-17 마이그레이션 트랙은 별도 (해당 Goal 진행 시 별도 참조).
