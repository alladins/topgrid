---
title: "@topgrid/grid-export"
sidebar_label: "grid-export"
sidebar_position: 7
---

# @topgrid/grid-export

> Excel, PDF, CSV export for grid data · **무료 (MIT)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **33개** public export — 함수 17 · 훅 0 · 컴포넌트 0 · 타입 16 · 상수 0.

## 함수

### `buildRowsCsv`

행 배열 + `ExcelColumn[]` 을 RFC 4180 CSV 문자열로 직렬화한다(헤더 1행 + 데이터 N행, CRLF 구분).

순수 함수 — Blob/DOM 비의존이라 node 단위 테스트로 실제 출력 문자열을 단언할 수 있다.
null/undefined 셀은 빈 문자열로 직렬화(EC: exportToCSV 동작과 일치).

```ts
buildRowsCsv(rows: TData[], columns: ExcelColumn[], delimiter: string): string
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `rows` | `TData[]` | 직렬화할 데이터 행 |
| `columns` | `ExcelColumn[]` | 컬럼 정의(key=행 키, header=헤더 텍스트) |
| `delimiter` | `string` | 구분자 — ',' (기본) 또는 '\t' |

### `buildRowsPdfTable`

```ts
buildRowsPdfTable(rows: TData[], columns: ExcelColumn[]): PdfTableData
```

### `copyToClipboard`

TanStack Table 데이터를 TSV 포맷으로 클립보드에 복사한다.
TSV(탭 구분, 줄바꿈 행 구분) — Excel 붙여넣기 호환.

navigator.clipboard 미지원 환경: document.execCommand('copy') fallback 시도.
fallback도 실패 시 Error('[grid-export] copyToClipboard: Clipboard API not supported') throw.

```ts
copyToClipboard(table: Table<TData>, options: ClipboardOptions): Promise<void>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> 인스턴스 (useReactTable 반환값) |
| `options` | `ClipboardOptions` | 클립보드 복사 옵션 (scope, emptyBehavior) |

**반환** — Promise&lt;void> — navigator.clipboard.writeText 는 async

**예시**

```ts
await copyToClipboard(table);
```

### `escapeCsvValue`

RFC 4180 §2: 구분자/큰따옴표/개행 포함 시 큰따옴표 래핑 + 내부 따옴표 이중화.
순수 string 조작 — 외부 라이브러리 0.

```ts
escapeCsvValue(value: string, delimiter: string): string
```

### `exportRowsToCsv`

```ts
exportRowsToCsv(rows: TData[], columns: ExcelColumn[], options: ExportRowsCsvOptions): void
```

### `exportRowsToExcel`

행 배열을 Excel 파일(.xlsx)로 다운로드한다.

TanStack `Table<TData>` 인스턴스 없이 사용 가능.
`@topgrid/grid-export` 의 `exportToExcel(table, options)` 와 평행 지원 ( 옵션 A).

```ts
exportRowsToExcel(rows: TData[], columns: ExcelColumn[], options: ExportRowsOptions): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `rows` | `TData[]` | 내보낼 데이터 행 배열 |
| `columns` | `ExcelColumn[]` | 컬럼 정의 배열 (key / header / width? / format?) |
| `options` | `ExportRowsOptions` | 파일명·시트명·emptyBehavior 옵션 |

**예시**

```ts
exportRowsToExcel(rows, columns, { fileName: '보고서_2026.xlsx' });
```

### `exportRowsToPdf`

```ts
exportRowsToPdf(rows: TData[], columns: ExcelColumn[], options: ExportRowsPdfOptions): Promise<void>
```

### `exportSheetCellsToXlsx`

Build an `.xlsx` workbook from a sheet cell map and (in a browser/node) trigger a download / write.
Formula cells are written as `.f` (preserved by the lib). Returns nothing — side-effecting write.

```ts
exportSheetCellsToXlsx(cells: Record<string, string>, computed: Record<string, string | number>, fileName: string, sheetName: string): void
```

### `exportSheetCellsToXlsxBuffer`

Build an `.xlsx` workbook as a Uint8Array buffer (node-testable; no file I/O).

```ts
exportSheetCellsToXlsxBuffer(cells: Record<string, string>, computed: Record<string, string | number>, sheetName: string): Uint8Array
```

### `exportSheetsToExcel`

여러 TanStack Table 을 **하나의 Excel 워크북**(여러 시트)으로 export·다운로드한다.
( — XX Grid/DevExpress 다중 시트 export 격차 해소)

각 시트는 `exportToExcel`(단일 시트)과 동일한 빌더(`buildGridWorksheet`)를 재사용하므로
헤더 merge·scope·네이티브 숫자서식(`.z`)·컬럼 폭 동작이 단일 시트와 일관된다.

```ts
exportSheetsToExcel(sheets: ExcelSheet[], options: MultiSheetOptions): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `sheets` | `ExcelSheet[]` | 시트 정의 배열 (`{ name, table, scope?, columnFormats?, columnWidths? }`) |
| `options` | `MultiSheetOptions` | 파일명 옵션 |

**반환** — void (동기 — xlsx.writeFile)

**예시**

```ts
exportSheetsToExcel(
  [
    { name: '주문', table: ordersTable, columnFormats: { total: '#,##0' } },
    { name: '고객', table: customersTable, scope: 'selected' },
  ],
  { fileName: '월간보고.xlsx' },
);
```

### `exportToCSV`

TanStack Table 인스턴스를 기반으로 CSV 파일을 생성·다운로드한다.
UTF-8 BOM 포함 — 한국어 Excel 정상 표시.

```ts
exportToCSV(table: Table<TData>, options: CSVExportOptions): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> 인스턴스 (useReactTable 반환값) |
| `options` | `CSVExportOptions` | CSV export 옵션 (fileName, scope, delimiter, emptyBehavior) |

**반환** — void (순수 string 조작 + createObjectURL — 외부 라이브러리 0)

**예시**

```ts
// 기본 사용 (filtered 행, 쉼표 구분자)
exportToCSV(table, { fileName: '데이터.csv' });
```

### `exportToExcel`

TanStack Table 인스턴스를 기반으로 Excel(.xlsx) 파일을 생성·다운로드한다.

```ts
exportToExcel(table: Table<TData>, options: ExcelExportOptions): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> 인스턴스 (useReactTable 반환값) |
| `options` | `ExcelExportOptions` | Excel export 옵션 (fileName, sheetName, scope, emptyBehavior, columnFormats, columnWidths) |

**반환** — void (동기 실행 — xlsx.writeFile 동기 API)

**예시**

```ts
// 기본 사용 (filtered 행)
exportToExcel(table, { fileName: '데이터.xlsx' });
```

### `exportToPdf`

TanStack Table 인스턴스를 기반으로 PDF 파일을 생성·다운로드한다.
jspdf + jspdf-autotable을 optional peer로 dynamic import하여 사용.

```ts
exportToPdf(table: Table<TData>, options: PDFExportOptions): Promise<void>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> 인스턴스 (useReactTable 반환값) |
| `options` | `PDFExportOptions` | PDF export 옵션 (fileName, title, scope, orientation, fontFamily, emptyBehavior) |

**반환** — Promise&lt;void> — jspdf dynamic import 후 완료

**예시**

```ts
// 기본 사용 (portrait, filtered, Helvetica)
await exportToPdf(table, { fileName: '보고서.pdf' });
```

### `importXlsxToSheetCells`

Parse an `.xlsx` (the first worksheet) into a sheet cell map. Formula cells become `"=…"` raws so
the sheet engine re-evaluates them; value cells stringify. Feeds `createSheet` via `setCell`.

```ts
importXlsxToSheetCells(data: ArrayBuffer | Uint8Array<ArrayBufferLike>): Record<string, string>
```

### `printGrid`

TanStack Table 데이터를 새 팝업 창에 HTML 테이블로 렌더링하여 인쇄 대화상자를 연다.
순수 Web API 전용 (window.open + document.write + window.print).

팝업 차단 환경: console.warn 후 즉시 반환 ( — throw 하지 않음).
printGrid 자체는 동기 반환 (void). 실제 print 발화는 popup.onload 내에서 비동기 실행.

```ts
printGrid(table: Table<TData>, options: PrintOptions): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> 인스턴스 (useReactTable 반환값) |
| `options` | `PrintOptions` | 인쇄 옵션 (title, scope, orientation, emptyBehavior) |

**반환** — void

**예시**

```ts
printGrid(table);
```

### `sheetRawToXlsxCell`

Pure: a sheet raw input (`"=A1+A2"` | `"10"` | `"hi"`) → an xlsx cell object.

A formula cell **must carry a cached value** (`v`) or the lib drops it on write (probe-verified),
so `computed` (the engine's displayed value, from `getDisplay`) is written as the cache. Without
it, a fallback `v: 0` keeps the formula (Excel recalculates on open). Value cells ignore `computed`.

```ts
sheetRawToXlsxCell(raw: string, computed: string | number): XlsxCell
```

### `xlsxCellToSheetRaw`

Pure: an xlsx cell → a sheet raw input. Formula cells become `"=…"`; value cells stringify.

```ts
xlsxCellToSheetRaw(cell: XlsxCell): string
```

## 타입 · 인터페이스

### `ClipboardOptions`

클립보드 복사 옵션

| 속성 | 타입 | 설명 |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 복사 안 함 (기본) - 'empty': 헤더만 있는 TSV 클립보드 복사 |
| `includeHeader?` | `boolean` | 헤더 행 포함 여부 - `true`: 첫 줄에 헤더 행 포함 (기본 — 기존 동작) - `false`: 데이터 행만 복사 (다른 영역에 붙여넣어 헤더 중복 방지) |
| `scope?` | `ExportScope` | export 대상 행 범위 - 'all': getCoreRowModel (필터 무시, 전체) - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default - 'selected': table.getSelectedRowModel (선택 행만) |

### `CSVExportOptions`

CSV export 옵션

| 속성 | 타입 | 설명 |
|---|---|---|
| `delimiter?` | `"," \| "\t"` | CSV 구분자 — ',' (기본, RFC 4180) 또는 '\t' (TSV 옵션) |
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 파일 생성 안 함 (기본) - 'empty': 헤더만 있는 빈 파일 생성 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 포함 권장, 없으면.csv 자동 추가) |
| `scope?` | `ExportScope` | export 대상 행 범위 - 'all': getCoreRowModel (필터 무시, 전체) - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default - 'selected': table.getSelectedRowModel (선택 행만) |

### `DownloadExcelOptions`

DataTable buttonInfo 호환 alias 옵션 (legacy)

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnFormats?` | `Record<string, string>` | 컬럼별 네이티브 Excel number-format 코드 key = 컬럼 id, value = Excel format 코드(예 `'#,##0.00'`, `'yyyy-mm-dd'`, `'0.0%'`). 해당 컬럼 데이터 셀에 `.z` 로 적용되어 셀이 Excel 안에서 numeric·정렬가능하게 유지된다. |
| `columnWidths?` | `Record<string, number>` | 컬럼별 폭 — key = 컬럼 id, value = xlsx `wch` 단위 폭. 지정된 컬럼만 `!cols` 에 반영(미지정은 기본 폭). |
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 파일 생성 안 함 (기본) - 'empty': 헤더만 있는 빈 파일 생성 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 포함 권장, 없으면.xlsx 자동 추가) |
| `scope?` | `ExportScope` |  |
| `sheetName?` | `string` | Excel 시트명 |

### `ExcelColumn`

행 배열 기반 Excel export 의 컬럼 정의

| 속성 | 타입 | 설명 |
|---|---|---|
| `format?` | `"number" \| "date" \| "datetime" \| "currency"` | 셀 값 포맷 |
| `header` | `string` | 헤더 셀에 표시할 텍스트 |
| `key` | `string` | 행 객체의 키 |
| `width?` | `number` | 컬럼 너비 (wch 단위). 기본값 15 |

### `ExcelExportOptions`

Excel export 옵션

 (emptyBehavior) 와 동일 타입 공유 — types.ts single source-of-truth

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnFormats?` | `Record<string, string>` | 컬럼별 네이티브 Excel number-format 코드 key = 컬럼 id, value = Excel format 코드(예 `'#,##0.00'`, `'yyyy-mm-dd'`, `'0.0%'`). 해당 컬럼 데이터 셀에 `.z` 로 적용되어 셀이 Excel 안에서 numeric·정렬가능하게 유지된다. |
| `columnWidths?` | `Record<string, number>` | 컬럼별 폭 — key = 컬럼 id, value = xlsx `wch` 단위 폭. 지정된 컬럼만 `!cols` 에 반영(미지정은 기본 폭). |
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 파일 생성 안 함 (기본) - 'empty': 헤더만 있는 빈 파일 생성 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 포함 권장, 없으면.xlsx 자동 추가) |
| `scope?` | `ExportScope` | export 대상 행 범위 - 'all': getCoreRowModel (필터 무시, 전체) - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default - 'selected': table.getSelectedRowModel (선택 행만) |
| `sheetName?` | `string` | Excel 시트명 |

### `ExcelSheet`

다중 시트 Excel export 의 시트 1개 정의

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnFormats?` | `Record<string, string>` | 컬럼별 네이티브 number-format (ExcelExportOptions.columnFormats 와 동일) |
| `columnWidths?` | `Record<string, number>` | 컬럼별 폭 (ExcelExportOptions.columnWidths 와 동일) |
| `name` | `string` | 시트명 (Excel 탭에 표시) |
| `scope?` | `ExportScope` | export 대상 행 범위 |
| `table` | `Table<any>` | TanStack v8 Table 인스턴스 — 시트 내용 소스. 다중 시트는 본질적으로 **서로 다른 행 타입의 테이블을 한 배열에 섞으므로**(`Table<Person>` + `Table<Order>`), 단일 `TData` 로 묶을 수 없다. `Table<TData>` 는 `accessorFn` 의 함수 인자 반공변성 때문에 `Table<unknown>` 에 대입 불가(`Table<Person>` ↛ `Table<unknown>`). 이질 배열을 받으려면 `Table<any>` 가 유일한 실용 해법(TS 는 존재 타입 미지원). export 코드는 `getValue` 결과를 `unknown` 으로만 다뤄 타입 안전을 유지한다. |

### `ExportRowsCsvOptions`

`exportRowsToCsv` 옵션 ( 행 배열 export 의 CSV 평행)

`scope` 는 행 배열 입력에서 무의미하므로 제외.

| 속성 | 타입 | 설명 |
|---|---|---|
| `delimiter?` | `"," \| "\t"` | CSV 구분자 — ',' (기본, RFC 4180) 또는 '\t' (TSV) |
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 없으면.csv 자동 추가) |

### `ExportRowsOptions`

`exportRowsToExcel` 옵션

`scope` 는 행 배열 입력에서 무의미하므로 의도적으로 제외.

| 속성 | 타입 | 설명 |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 파일 생성 안 함 (기본) - 'empty': 헤더만 있는 빈 파일 생성 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 포함 권장, 없으면.xlsx 자동 추가) |
| `sheetName?` | `string` | Excel 시트명 |

### `ExportRowsPdfOptions`

`exportRowsToPdf` 옵션 ( 행 배열 export 의 PDF 평행)

`scope` 는 행 배열 입력에서 무의미하므로 제외.

| 속성 | 타입 | 설명 |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 없으면.pdf 자동 추가) |
| `orientation?` | `"p" \| "l"` | 페이지 방향 — 'p' portrait (기본) / 'l' landscape |
| `title?` | `string` | PDF 최상단 제목 행 (없으면 생략) |

### `MultiSheetOptions`

`exportSheetsToExcel` 옵션

| 속성 | 타입 | 설명 |
|---|---|---|
| `fileName?` | `string` | 다운로드 파일명 (확장자 없으면.xlsx 자동 추가) |

### `PDFExportOptions`

PDF export 옵션

| 속성 | 타입 | 설명 |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 파일 생성 안 함 (기본) - 'empty': 헤더만 있는 빈 파일 생성 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 포함 권장, 없으면.pdf 자동 추가) |
| `fontFamily?` | `"default" \| "korean"` | 폰트 패밀리 - 'default': jspdf 내장 Helvetica (라틴 문자 지원) - 'korean': NotoSansKR dynamic import (loadKoreanFont.ts — W1 참조) |
| `orientation?` | `"p" \| "l"` | PDF 페이지 방향 - 'p': portrait (세로, 기본) - 'l': landscape (가로) |
| `scope?` | `ExportScope` | export 대상 행 범위 - 'all': getCoreRowModel (필터 무시, 전체) - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default - 'selected': table.getSelectedRowModel (선택 행만) |
| `title?` | `string` | PDF 최상단에 표시할 문서 제목 행 (없으면 생략) |

### `PdfTableData`

| 속성 | 타입 | 설명 |
|---|---|---|
| `body` | `string[][]` | autotable body: 데이터 행 × 컬럼 문자열 |
| `head` | `string[][]` | autotable head: 단일 헤더 행 (행 배열 export 는 다중행 헤더 미지원) |

### `PrintOptions`

인쇄 옵션

| 속성 | 타입 | 설명 |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 인쇄 창 열지 않음 (기본) - 'empty': 헤더만 있는 표 인쇄 |
| `orientation?` | `"p" \| "l"` | 페이지 방향 (CSS |
| `scope?` | `ExportScope` | export 대상 행 범위 - 'all': getCoreRowModel (필터 무시, 전체) - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default - 'selected': table.getSelectedRowModel (선택 행만) |
| `title?` | `string` | 인쇄 페이지 최상단에 표시할 제목 (없으면 생략) |

### `XlsxCell`

A worksheet cell as understood by the xlsx lib (the subset this bridge reads/writes).

| 속성 | 타입 | 설명 |
|---|---|---|
| `f?` | `string` | Formula text WITHOUT the leading `=` (xlsx convention). |
| `t` | `"n" \| "s" \| "b"` | Cell type: `'n'` number, `'s'` string, `'b'` boolean. |
| `v?` | `string \| number \| boolean` | Literal value (absent/ignored when `f` is the source of truth for display). |

### `EmptyBehavior`

​export 시 데이터 행 0건 동작 — 5개 Options 공유 single source-of-truth

```ts
type EmptyBehavior = "skip" | "empty"
```

### `ExportScope`

Excel export 범위 지정

```ts
type ExportScope = "all" | "filtered" | "selected"
```

