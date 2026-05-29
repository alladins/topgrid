# ADR-005 Implementation Spec — grid-export Entry 2개 + tw-front 마이그레이션

**작성일**: 2026-05-17
**상태**: draft (사용자 검토 대기)
**원본 ADR**: MOD-GRID-REFACTOR-2026-05-17-005 (옵션 A 채택)
**연관 finding**: refactor-analysis-2026-05-17.md §6.3 (P0)
**선행 학습**: wave1-adr-014-result.md — ADR 본문 처방이 컴파일 실패한 사례. 본 spec 은 typecheck probe + 거동 패리티 enumerate 로 보완.

---

## 0. TL;DR (사용자 검토 핵심)

- **호출자 N = 1**: `tw-framework-front/src/pages/tomis/bsc/BscEval01ListPage.tsx:10,200`. `columnsToExcel` 호출자 0건.
- **권고 adapter 옵션**: **E-1 (다른 함수명)** — `exportToExcel(table, options)` 보존 + `exportRowsToExcel(rows, columns, options)` 신규. E-2 (overload) 도 typecheck 통과 검증 (`@ts-expect-error` 음성 케이스 포함) — 사용자가 단일 이름 선호 시 채택 가능.
- **권고 마이그레이션 옵션**: **M-2 (호출자 직접 변경 + 자체 util 삭제)** — N=1 이므로 thin re-export shim (M-1) 의 이점 미미.
- **거동 패리티 의무 (3건)**: 컬럼 width, 헤더 굵게+회색 배경, `formatValue` (date/datetime/number/currency).
- **사용자 검토 지점 (4건)**: adapter 함수명 정책, filename 인자 shape (positional vs options), `columnsToExcel` 의 fate, tsconfig path 보강.

---

## 1. grid-export 현 API 인벤토리

### 1.1 패키지 정보
- 경로: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/`
- 버전: `0.1.0` (package.json:3)
- license: `MIT` (package.json:5)
- export 종류: 5 (excel/csv/pdf/clipboard/print) + legacy alias 1 (downloadExcel) — `src/index.ts:1-26`

### 1.2 `exportToExcel` 시그니처 (확정)
파일: `src/exportToExcel.ts:120-167`
```ts
export function exportToExcel<TData>(
  table: Table<TData>,
  options?: ExcelExportOptions,
): void
```
`ExcelExportOptions` (`src/types.ts:12-38`):
```ts
{
  fileName?: string;     // default 'export.xlsx'
  sheetName?: string;    // default 'Sheet1'
  scope?: ExportScope;   // 'all' | 'filtered' | 'selected', default 'filtered'
  emptyBehavior?: EmptyBehavior; // 'skip' | 'empty', default 'skip'
}
```
내부 거동:
- `getRowsByScope(table, scope)` → TanStack `Row[]` 추출 (filtered/selected/all)
- `buildHeaderRows(table)` → `header.colSpan`/`isPlaceholder` 기반 다중행 헤더 + xlsx merge 셀
- `row.getVisibleCells().map(cell.getValue())` → AOA
- `XLSX.utils.aoa_to_sheet` → `XLSX.utils.book_append_sheet` → `XLSX.writeFile` (동기)
- **컬럼 width 없음**, **헤더 styling 없음**, **value 가공 없음**

### 1.3 의존 (`package.json:31-49`)
- peer (required): `react`, `react-dom`, `@tanstack/react-table ^8`, `xlsx ^0.18.5`
- peer (optional): `jspdf`, `jspdf-autotable`
- xlsx 는 `peerDependenciesMeta.optional: false` — 명시적으로 required (ADR-MOD-GRID-00-008 매트릭스)

### 1.4 legacy entry (`src/legacy/downloadExcel.ts`)
- `downloadExcel(table, options)` — `@deprecated`, `exportToExcel(table, options)` thin alias. DataTable 호환용.
- sub-export 노출: `package.json:16-20` `./legacy` 경로.

### 1.5 다른 export 함수 (참고용)
- `exportToCSV(table, options)` — Table 기반, `src/exportToCSV.ts`
- `exportToPdf(table, options)` — Table 기반, `src/exportToPdf.ts`
- `copyToClipboard(table, options)` — Table 기반, `src/copyToClipboard.ts`
- `printGrid(table, options)` — Table 기반, `src/printGrid.ts`
- **모두 Table 기반 단일 API 패턴**. 본 ADR-005 는 excel 에만 row-array entry 추가 — 다른 함수는 ADR-005 범위 외.

---

## 2. tw-framework-front excelExport 인벤토리 + 호출자

### 2.1 자체 util (`tw-framework-front/src/utils/tomis/excelExport.ts`)
파일 라인 수: 68. 의존: `xlsx` (package.json:43, `^0.18.5` — 모노레포 peer 와 동일 메이저).

`ExcelColumn` (`:3-8`):
```ts
{
  key: string;
  header: string;
  width?: number;
  format?: 'date' | 'datetime' | 'number' | 'currency';
}
```

`exportToExcel` (`:26-55`):
```ts
export function exportToExcel<TData extends Record<string, unknown>>(
  data: TData[],
  columns: ExcelColumn[],
  filename = 'export'
): void
```
**positional 3번째 인자 = string filename** (options 객체 아님).

내부 거동 (`:31-54`):
1. `header = columns.map(c => c.header)` → AOA 첫 행
2. `rows = data.map(row => columns.map(col => formatValue(row[col.key], col.format)))` → AOA 나머지
3. `XLSX.utils.aoa_to_sheet(worksheetData)` → workbook
4. `ws['!cols'] = columns.map(c => ({ wch: c.width ?? 15 }))` — **컬럼 width** (gx 없음)
5. 헤더 행 styling: `{ font: { bold: true }, fill: { fgColor: { rgb: 'F3F4F6' } } }` (`:43-48`)
6. `XLSX.writeFile(wb, ext)` — `.xlsx` 자동 추가

`formatValue` (`:10-24`):
- `date` → `d.toLocaleDateString('ko-KR')`
- `datetime` → `d.toLocaleString('ko-KR')`
- `number`/`currency` → `Number(value)` (NaN guard)
- null/undefined → `''`

`columnsToExcel(columns)` (`:58-67`): display columns → ExcelColumn 변환 헬퍼. **호출자 0건** (grep 확인).

### 2.2 호출자 인벤토리

전수 grep 결과 (`tw-framework-front/src/` 전체):

| 파일 | 라인 | 호출 패턴 |
|------|------|---------|
| `pages/tomis/bsc/BscEval01ListPage.tsx` | 10 (import), 160 (ExcelColumn 사용), 200 (exportToExcel 호출) | `exportToExcel(exportData, columns, `BSC평가총괄_${stdYear}${stdMonth}`)` |

**총 호출자: N = 1.** `columnsToExcel` 호출자: 0.

분석 보고서 §6.3 의 "tw-framework-front 페이지들 중 `exportToExcel` 호출 사용처 inventory" 항목 → **완료 (N=1)**.

### 2.3 xlsx 직접 사용 (out of scope, 참고)

`Grep "writeFile|aoa_to_sheet"` tw-framework-front/src → 4 페이지 + 본 util:
- `pages/tomis/account/DailyMonthlyReportPage.tsx:138-141` — `json_to_sheet` 패턴
- `pages/tomis/finance/FinAcno01InterestPage.tsx`
- `pages/tomis/finance/FinAcno01LedgerPage.tsx`
- `pages/tomis/personal/EmployeeRosterPage.tsx`

이 4건은 util 호출자가 아니라 xlsx 직접 사용. 본 ADR-005 범위 외 — 별도 마이그레이션 cycle 후보 (분석 보고서 §6.3 추가 항목으로 footnote 권고).

---

## 3. 거동 패리티 의무 (★ 본 spec 의 핵심)

신 entry 가 tw-framework-front 자체 util 의 호출자 (`BscEval01ListPage.tsx:200`) 를 무손실 대체하려면 **다음 3개 거동을 보존**해야 한다. 누락 시 시각/포맷 회귀.

| # | 거동 | tw-front 자체 util 코드 | grid-export 현재 `exportToExcel` 지원 여부 | 신 entry 의무 |
|---|------|----------------|-------------------------------|--------------|
| B1 | **컬럼 width** | `ws['!cols'] = columns.map(c => ({ wch: c.width ?? 15 }))` (excelExport.ts:40) | 미지원 | `ExcelColumn.width` 처리 필요 |
| B2 | **헤더 styling (굵게 + 회색 fill)** | `{ font: { bold: true }, fill: { fgColor: { rgb: 'F3F4F6' } } }` (excelExport.ts:47) | 미지원 | `ws[cellAddr].s = {...}` 동일 적용 |
| B3 | **값 포맷팅** (`formatValue`) | date → `toLocaleDateString('ko-KR')`, datetime → `toLocaleString('ko-KR')`, number/currency → `Number()` (NaN guard) (excelExport.ts:10-24) | 미지원 | `ExcelColumn.format` 별 동일 변환 필요 |

**위험 (★ ADR-014 학습 반영)**:
- B2 의 cell `.s` styling 은 **xlsx community edition 한계** — `excelExport.ts:42` 주석 인용: "note: xlsx community edition has limited style support". 즉 현재 자체 util 도 부분 동작 가능성. 신 entry 는 동일 한계 상속.
- B3 의 `toLocaleString('ko-KR')` 은 런타임 locale 의존 — 단위 테스트 시 ICU 환경 확인 필요.

**검증 의무 (implementer)**:
- 신 entry 구현 후, BscEval01ListPage 호출로 생성된 .xlsx 와 마이그레이션 전 .xlsx 를 binary/시각 비교 (수동, 단위 테스트 부재 보완).

---

## 4. Adapter API 옵션 비교

### 4.1 옵션 E-1: 다른 함수명 (★권고)

```ts
// grid-export/src/index.ts
export { exportToExcel } from './exportToExcel';          // Table 기반 (기존, 변경 0)
export { exportRowsToExcel } from './exportRowsToExcel';  // 행 배열 기반 (신)
export type { ExcelColumn } from './exportRowsToExcel';
```

`exportRowsToExcel` 시그니처 (권고):
```ts
export function exportRowsToExcel<TData extends Record<string, unknown>>(
  rows: TData[],
  columns: ExcelColumn[],
  options?: ExportRowsOptions,
): void;
```

`ExportRowsOptions` (제안):
```ts
export interface ExportRowsOptions {
  fileName?: string;       // default 'export.xlsx'
  sheetName?: string;      // default 'Sheet1'
  emptyBehavior?: EmptyBehavior; // 'skip' | 'empty', default 'skip'
  // 'scope' 는 행 배열 입력 시 무의미 — 의도적으로 제외
}
```

**장점**:
- 함수명이 다르므로 runtime dispatch 불필요. type-safety 100% 정적
- jump-to-definition 명확. 사용자가 API 의도 즉시 인식
- 다른 export 함수 (CSV/PDF) 도 동일 패턴 (`exportRowsToCSV` 등) 확장 시 일관성

**단점**:
- 함수 2개 — API surface 2배. 문서/README 양쪽 명시 필요
- 기존 `exportToExcel` 이름이 row-array 패턴에 더 자연스러울 수도 있음 (의견 차이)

### 4.2 옵션 E-2: function overload (같은 이름) — typecheck 통과 확인

```ts
export function exportToExcel<TData>(
  table: Table<TData>,
  options?: ExcelExportOptions,
): void;
export function exportToExcel<TData extends Record<string, unknown>>(
  rows: TData[],
  columns: ExcelColumn[],
  options?: ExportRowsOptions,
): void;
export function exportToExcel<TData extends Record<string, unknown>>(
  arg1: Table<TData> | TData[],
  arg2?: ExcelExportOptions | ExcelColumn[],
  arg3?: ExportRowsOptions,
): void {
  if (Array.isArray(arg1)) { /* rows path */ }
  else { /* table path */ }
}
```

**probe 결과 (2026-05-17, `_probe_overload.ts` 임시 파일)**:
- ✅ `pnpm typecheck` PASS — 모노레포 strict + `exactOptionalPropertyTypes` + `verbatimModuleSyntax` 환경
- ✅ `exportToExcel(table)` / `exportToExcel(table, options)` typecheck OK
- ✅ `exportToExcel(rows, columns)` / `exportToExcel(rows, columns, options)` typecheck OK
- ✅ `@ts-expect-error exportToExcel([{k:1}])` (rows 만, columns 누락) — TS error 발생 확인 (negative case 통과)
- ⚠️ runtime dispatch 의 `Array.isArray(table)` — TanStack `Table<TData>` 객체는 구조적으로 배열 아님 (Table 은 `getRowModel`/`getHeaderGroups` 등 메서드 보유 객체). 그러나 **실제 TanStack 인스턴스로 Array.isArray 호출 음성 검증은 probe 미수행** — 8.2 의 residual risk 로 표기

**장점**:
- 함수명 1개 — API surface 단순
- 사용자 코드 변경 최소 (옵션 M-2 채택 시 호출자 변경은 동일)

**단점**:
- 구현 함수의 매개변수 타입이 union — runtime 분기 필요
- IDE quick-help 가 overload 2개 보여서 사용자가 잘못된 패턴 선택할 수 있음 (예: Table 인스턴스에 `[1,2,3]` 전달)
- 코드 리뷰 시 가독성 저하

### 4.3 옵션 E-3: 단일 함수 + tagged union 입력

```ts
type ExcelInput<TData> =
  | { kind: 'table'; table: Table<TData> }
  | { kind: 'rows'; rows: TData[]; columns: ExcelColumn[] };

export function exportToExcel<TData>(input: ExcelInput<TData>, options?: ExcelExportOptions): void;
```

**probe 결과**: ✅ typecheck PASS.

**장점**: type-safe discriminated union. 런타임 분기 `input.kind` 명확.
**단점**: **호출자 변경 의무** — 기존 `exportToExcel(table, options)` 도 `exportToExcel({ kind: 'table', table }, options)` 로 마이그레이션 필요. **breaking change → major bump**. ADR-005 의 "기존 호출자 변경 0" 목표 위반.

→ **각하** (ADR Trade-off 표 §결정의 minor bump 의도와 부정합).

### 4.4 비교 요약

| 옵션 | typecheck | 기존 호출자 변경 | 신규 호출자 인지 비용 | semver 영향 | 권고 |
|------|-----------|---------------|-------------------|------------|------|
| E-1 | ✅ | 0 | 낮음 (이름 명시) | minor (additive) | ★ |
| E-2 | ✅ (probe) | 0 | 중 (overload 식별) | minor (additive) | 가능 |
| E-3 | ✅ (probe) | **N (모든 기존 호출자)** | 중 | **major** | 각하 |

**최종 권고: E-1**. E-2 는 사용자가 단일 이름 정책 선호 시 채택 (probe 가 typecheck 통과 보장).

---

## 5. tw-framework-front 마이그레이션 옵션

### 5.1 옵션 M-1: thin re-export shim (자체 util 유지)
```ts
// tw-framework-front/src/utils/tomis/excelExport.ts (after)
export { exportRowsToExcel as exportToExcel } from '@tomis/grid-export';
export type { ExcelColumn } from '@tomis/grid-export';
// columnsToExcel — 별도 결정 (§6)
```
- 호출자 코드 변경: **0** (`BscEval01ListPage.tsx:10,200` 유지)
- 자체 util 파일: shim 형태로 보존 (3~10 LOC)

**전제 의무**:
- `tsconfig.app.json:21-27` paths 에 `@tomis/grid-export` 추가 (현재 vite alias 만 있음)

### 5.2 옵션 M-2: 호출자 직접 변경 + 자체 util 삭제 (★권고)
```ts
// pages/tomis/bsc/BscEval01ListPage.tsx (after)
import { exportRowsToExcel, type ExcelColumn } from '@tomis/grid-export';
...
exportRowsToExcel(exportData, columns, { fileName: `BSC평가총괄_${stdYear}${stdMonth}` });
//                                       ^^^^^^^^^ options 객체 — §7 참조
```
- 호출자 코드 변경: **1 파일** (import + 호출 1줄)
- 자체 util 파일: 삭제 (`utils/tomis/excelExport.ts` 67 LOC 제거)
- `columnsToExcel` 호출자 0 → 자연 소멸

**전제 의무**:
- tsconfig.app.json paths 추가 (M-1 과 동일)

### 5.3 비교

| 옵션 | 변경 파일 | 자체 util 잔존 | drift 위험 | LOC delta |
|------|---------|--------------|-----------|----------|
| M-1 | 1 (util shim) | yes | 미래 fork 가능 | -67 + ~5 |
| M-2 | 2 (page + util 삭제) | no | 0 | -67 + 1줄 변경 |

**최종 권고: M-2** — N=1 caller 환경에서 M-1 의 "호출자 변경 0" 이점이 미미. 자체 util 완전 제거 + ADR §결과 체크리스트의 `grep '@tomis/grid-export' tw-framework-front/src → ≥ 1 hit` 자연 충족.

---

## 6. `columnsToExcel` 헬퍼의 fate

`tw-framework-front/src/utils/tomis/excelExport.ts:58-67` `columnsToExcel(columns)`:
- 호출자: **0건** (grep 확인)
- 입력: TanStack `ColumnDef` 유사 shape (`id`/`accessorKey`/`header`) → `ExcelColumn[]`
- 의도: display columns 에서 export columns 파생 헬퍼 (마이그레이션 보조)

**옵션**:
- **C-1**: 삭제 (호출자 0). M-2 권고 시 자연 동반 삭제.
- **C-2**: `@tomis/grid-export` 로 이동. 미래 사용자 대비 + grid-export API 표면 확장.
- **C-3**: tw-front 측에 유지 (다른 페이지가 미래 사용 가능성).

**권고**: **C-1 (삭제)** — YAGNI. 미래 필요 시 grid-export 에 추가하면 됨 (additive, minor bump).

**사용자 검토 지점**: C-2 채택 시 `columnsToExcel` 도 grid-export 의 신 entry 인근에 포함.

---

## 7. filename 인자 shape 사용자 검토 지점

tw-front 자체 util: `exportToExcel(data, columns, filename = 'export')` — **positional string**.
grid-export 의 모든 함수: `exportToExcel(table, options?: { fileName, ... })` — **options 객체**.

신 entry `exportRowsToExcel` 의 3번째 인자 shape 선택:

| 옵션 F | 시그니처 | 호출자 변경 (M-2) |
|--------|---------|------------------|
| F-1 | `exportRowsToExcel(rows, columns, options?: { fileName, ... })` — options 객체 | `{ fileName: '...' }` 로 wrap |
| F-2 | `exportRowsToExcel(rows, columns, fileName?: string)` — positional | 변경 0 |
| F-3 | `exportRowsToExcel(rows, columns, fileNameOrOptions?: string | ExportRowsOptions)` — overload | 변경 0 + 미래 확장 |

**권고**: **F-1** — grid-export 패키지 내 일관성 (다른 모든 함수가 options). 호출자 1줄 변경 (사소). sheetName/emptyBehavior 미래 확장 자연스러움.

**사용자 검토 지점**: 사용자가 "기존 패턴 일치 + 미래 확장" 보다 "마이그레이션 비용 최소" 우선 시 F-2 채택 가능.

---

## 8. xlsx/jspdf peer 의존성 정합

### 8.1 신 entry 의 peer 영향
- 신 entry 도 `xlsx` 만 사용 (jspdf 무관)
- grid-export `package.json:46-48` 이미 `xlsx` 를 `peerDependenciesMeta.optional: false` 로 명시 — 변경 0
- ADR-MOD-GRID-00-008 매트릭스 (xlsx `^0.18.0` for grid-export) — 변경 0

### 8.2 tw-framework-front 의 xlsx 의존성
- `tw-framework-front/package.json:43`: `"xlsx": "^0.18.5"` 직접 dependency
- grid-export peer `xlsx ^0.18.5` 와 호환 (semver intersection 통과)
- **M-2 채택 시**: tw-front 의 xlsx dep 은 다른 페이지 (DailyMonthlyReportPage 등 4건) 가 직접 사용 중이라 **삭제 불가**. 그대로 유지.
- **M-1 채택 시**: 동일. tw-front 자체 util shim 이 xlsx 를 import 하지 않으므로 xlsx 직접 의존은 다른 페이지 사용분만.

### 8.3 ADR-MOD-GRID-00-008 매트릭스 갱신 필요 여부
**불필요**. 본 ADR-005 는 peer 매트릭스 변경 없이 실행 가능.

---

## 9. 구현 단계 (implementer 위임용)

ADR-014 학습 반영: 각 단계 파일/line 명시 + 빌드/typecheck 검증 게이트 포함.

### Step 1 — grid-export 의 신 entry 구현
파일: `packages/grid-export/src/exportRowsToExcel.ts` (신규)
```ts
// Pseudocode — 실제 구현 시 §3 거동 패리티 (B1/B2/B3) 의무
import * as XLSX from 'xlsx';
import type { EmptyBehavior } from './types';

export interface ExcelColumn {
  key: string;
  header: string;
  width?: number;
  format?: 'date' | 'datetime' | 'number' | 'currency';
}

export interface ExportRowsOptions {
  fileName?: string;
  sheetName?: string;
  emptyBehavior?: EmptyBehavior;
}

function formatValue(value: unknown, format?: ExcelColumn['format']): unknown { ... } // §3 B3 동일

export function exportRowsToExcel<TData extends Record<string, unknown>>(
  rows: TData[],
  columns: ExcelColumn[],
  options?: ExportRowsOptions,
): void {
  const { fileName = 'export.xlsx', sheetName = 'Sheet1', emptyBehavior = 'skip' } = options ?? {};
  if (rows.length === 0 && emptyBehavior === 'skip') { /* warn + return */ }
  const header = columns.map(c => c.header);
  const dataRows = rows.map(row => columns.map(col => formatValue(row[col.key], col.format)));
  const aoa = emptyBehavior === 'empty' && rows.length === 0 ? [header] : [header, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = columns.map(c => ({ wch: c.width ?? 15 })); // §3 B1
  // §3 B2 헤더 styling
  const headerRange = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'F3F4F6' } } };
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const ext = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, ext);
}
```

### Step 2 — `ExcelColumn` 타입 정의 위치 결정
- 옵션: `src/exportRowsToExcel.ts` 내부 또는 `src/types.ts` 공유.
- **권고**: `src/types.ts` 에 정의 + `src/exportRowsToExcel.ts` 가 import. `src/index.ts` 가 `export type { ExcelColumn }` 추가. (다른 type 들과 일관성 — `src/types.ts:12-38` ExcelExportOptions 와 같은 패턴)

### Step 3 — public API 노출
파일: `packages/grid-export/src/index.ts`
- 추가: `export { exportRowsToExcel } from './exportRowsToExcel';`
- 추가: `export type { ExcelColumn, ExportRowsOptions } from './types';` (또는 exportRowsToExcel.ts)

### Step 4 — tsup 빌드 entry 추가 (해당 없음)
- `tsup.config.ts:4-7`: entry 는 `src/index.ts` + `src/legacy/downloadExcel.ts` 만. 신 entry 는 `src/index.ts` 를 통해 노출 — tsup 변경 0.

### Step 5 — 단위 테스트 추가 (옵션, but 권고)
- 파일: `packages/grid-export/src/exportRowsToExcel.test.ts` (또는 vitest 환경 미설정 시 스토리)
- 케이스: B1 width, B2 styling 객체 존재, B3 formatValue date/datetime/number, emptyBehavior skip/empty
- **현 상태**: grid-export 의 test 스크립트 = `"test": "echo TODO"` (package.json:29) — 단위 테스트 인프라 미설정. **단위 테스트는 선택 — implementer 가 인프라 비용 평가 후 결정**. 미수행 시 §3 의 수동 검증 의무로 보완.

### Step 6 — tw-framework-front tsconfig paths 보강 (M-1/M-2 공통)
파일: `tw-framework-front/tsconfig.app.json:21-27`
- 추가:
```jsonc
"@tomis/grid-export": ["../../topvel-grid-monorepo/packages/grid-export/src"],
```
- 사유: `vite.config.ts:20` 은 alias 등록되어 있으나 tsc 가 별개로 path resolution 수행. tsc -b 시 import 실패 방지.
- 검증: `cd tw-framework-front && pnpm build` (`tsc -b && vite build`) PASS.

### Step 7 — tw-front 마이그레이션 (M-2 권고)

#### 7.1 page 변경
파일: `tw-framework-front/src/pages/tomis/bsc/BscEval01ListPage.tsx:10`
- before: `import { exportToExcel, ExcelColumn } from '../../../utils/tomis/excelExport';`
- after: `import { exportRowsToExcel, type ExcelColumn } from '@tomis/grid-export';`

파일: `tw-framework-front/src/pages/tomis/bsc/BscEval01ListPage.tsx:200`
- before: `exportToExcel(exportData, columns, `BSC평가총괄_${stdYear}${stdMonth}`);`
- after (F-1): `exportRowsToExcel(exportData, columns, { fileName: `BSC평가총괄_${stdYear}${stdMonth}` });`
- after (F-2 시): `exportRowsToExcel(exportData, columns, `BSC평가총괄_${stdYear}${stdMonth}`);` — 변경 0 (옵션)

#### 7.2 자체 util 삭제
파일: `tw-framework-front/src/utils/tomis/excelExport.ts`
- 전체 67 LOC 삭제.
- `columnsToExcel` 도 자연 동반 삭제 (호출자 0).

### Step 8 — verification
1. `cd packages/grid-export && pnpm typecheck` → PASS
2. `cd packages/grid-export && pnpm build` → PASS (dist 갱신)
3. `cd tw-framework-front && pnpm build` → PASS (`tsc -b && vite build`)
4. `Grep "from ['\"]@tomis/grid-export['\"]" tw-framework-front/src/` → ≥ 1 hit (ADR §결과 체크리스트 충족)
5. `Grep "excelExport" tw-framework-front/src/` → 0 hits (M-2 삭제 확인)
6. **수동 시각 검증**: BscEval01ListPage 의 엑셀 다운로드 동작 → 생성 .xlsx 의 컬럼 width / 헤더 styling / 한국어 날짜 포맷 확인 (B1/B2/B3 패리티)

### Step 9 — semver + 문서
1. `packages/grid-export/CHANGELOG.md`: `0.2.0` minor entry (additive — `exportRowsToExcel` + `ExcelColumn` + `ExportRowsOptions` export 추가)
2. `.changeset/adr-005-row-array-entry.md`: minor changeset 추가
3. `packages/grid-export/README.md`: 신 entry 사용 예제 추가 (`exportRowsToExcel(rows, columns)`)

### Step 10 — ADR 본문 상태 갱신
파일: `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md:275`
- 상태: `accepted (Wave 2 — 옵션 A)` → `accepted (Wave 2 — 옵션 A, implemented 2026-MM-DD)`
- 결과 체크리스트 (line 324-327) check.

### Step 11 — 분석 보고서 footnote
파일: `.claude/tw-grid/findings/refactor-analysis-2026-05-17.md:401-420`
- §6.3 끝에 footnote: "ADR-005 implementation: 2026-MM-DD. 자체 `exportToExcel` (`tw-framework-front/src/utils/tomis/excelExport.ts`) → `@tomis/grid-export.exportRowsToExcel` 마이그레이션 완료. xlsx 직접 사용 4건 (DailyMonthlyReportPage 등) 은 별도 cycle."

---

## 10. 위험 + 알려진 한계

### 10.1 ADR-014 학습 반영 — 처방 실패 위험
- B2 styling 의 xlsx community edition 한계 (excelExport.ts:42 주석) — 현 자체 util 도 부분 동작 가능. 신 entry 가 100% 시각 일치 보장 어려움. **수동 시각 검증 의무** (Step 8.6).
- E-2 overload 채택 시 `Array.isArray(table)` 의 실제 TanStack 인스턴스 음성 케이스 미검증 — TanStack `Table` 객체는 구조적으로 배열 아니나 (메서드 컨테이너), 사용자 정의 wrapper 가 array-like 일 가능성 0이라 단언 어려움. **probe gap** — implementer 가 실 인스턴스로 검증 권장.

### 10.2 단위 테스트 부재
- grid-export 의 `test` 스크립트 = `echo TODO` (package.json:29).
- §3 거동 패리티 (B1/B2/B3) 의 자동 회귀 보호 없음. 수동 검증 의존.
- **권고**: 후속 cycle 에 vitest 인프라 + B1/B2/B3 회귀 테스트 작성.

### 10.3 호출자 인벤토리 한계
- 본 spec 은 `tw-framework-front/src/` 만 grep. 다른 워크스페이스 (예: publish 참조 코드) 미수행.
- 분석 보고서 §6.3 의 "tw-framework-front 페이지 호출자" 범위 한정.

### 10.4 size-limit 영향 (ADR-MOD-GRID-00-007)
- 신 entry 추가 LOC 약 60~80. tsup treeshake 미적용 시 grid-export 번들 +5KB 추정.
- 현재 grid-export 의 size-limit 한도: 20KB (ADR-MOD-GRID-00-007).
- **검증 의무**: `pnpm size` 통과 확인 (Step 8 에 추가).
- baseline size 측정 ADR-005 §실행 조건에 명시 — implementer 가 사전 측정 필요.

### 10.5 `xlsx` peer optional 정책
- 현재 grid-export `xlsx` peer 는 `optional: false` (xlsx 미설치 환경 차단). 신 entry 도 xlsx 의존 — 정책 변경 0.
- tw-front 환경은 이미 xlsx 직접 dep 존재 — 영향 0.

### 10.6 `columnsToExcel` 헬퍼
- §6 C-1 (삭제) 권고. 미래 사용자가 페이지 column 모델 → ExcelColumn 변환 헬퍼 필요 시 grid-export 에 추가 필요 (additive).

---

## 11. 사용자 검토 지점 (재확인)

implementer 위임 전 사용자 확정 필요:

1. **adapter 함수명 정책** (§4): E-1 (`exportRowsToExcel` 별도 이름) vs E-2 (`exportToExcel` overload). 권고 E-1.
2. **filename 인자 shape** (§7): F-1 (options 객체) vs F-2 (positional string). 권고 F-1.
3. **`columnsToExcel` fate** (§6): C-1 (삭제) vs C-2 (grid-export 이동) vs C-3 (tw-front 보존). 권고 C-1.
4. **마이그레이션 옵션 재확인** (§5): M-2 (호출자 직접 변경) 권고. M-1 도 가능하나 N=1 환경에서 이점 미미.
5. **단위 테스트 인프라 추가** (§10.2): 본 cycle 에 vitest 설치 + B1/B2/B3 테스트? 또는 후속 cycle?
6. **xlsx 직접 사용 4건** (§2.3): 본 cycle 범위 외 — 별도 ADR/cycle? footnote 만?

---

## 12. 변경 LOC 추정 (M-2 + E-1 + F-1 권고 가정)

| 파일 | 변경 | LOC delta |
|------|------|----------|
| `packages/grid-export/src/exportRowsToExcel.ts` (신규) | 신 entry 구현 | +~70 |
| `packages/grid-export/src/types.ts` | ExcelColumn + ExportRowsOptions 추가 | +~25 |
| `packages/grid-export/src/index.ts` | 2 export 라인 추가 | +2 |
| `packages/grid-export/CHANGELOG.md` | minor entry | +~10 |
| `.changeset/adr-005-row-array-entry.md` (신규) | changeset | +~5 |
| `packages/grid-export/README.md` | 사용 예제 | +~15 |
| `tw-framework-front/tsconfig.app.json` | path 추가 1줄 | +1 |
| `tw-framework-front/src/pages/tomis/bsc/BscEval01ListPage.tsx` | import + 호출 변경 | 0 (2줄 변경) |
| `tw-framework-front/src/utils/tomis/excelExport.ts` | 전체 삭제 | -67 |
| `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` | 상태 갱신 | +~3 |
| `.claude/tw-grid/findings/refactor-analysis-2026-05-17.md` | footnote | +~3 |
| **합계** | | **+~67** |

(단위 테스트 추가 시 +~50, vitest 설정 +~30 추가)
