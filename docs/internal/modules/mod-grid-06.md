# 익스포트 모듈 (`@topgrid/grid-export`)

그리드 데이터를 외부 포맷으로 내보내는 함수 모음. TanStack Table 인스턴스를
입력으로 받아 Excel(.xlsx)·CSV/TSV·PDF 파일을 생성·다운로드하고, 클립보드 복사와
브라우저 인쇄를 지원한다. 추가로 TanStack 인스턴스 없이 행 배열만으로 Excel을
만드는 진입점을 제공한다. 모든 함수는 `scope`(어떤 행을 내보낼지)와
`emptyBehavior`(행 0건일 때 동작)를 공통 옵션으로 공유한다.

- 패키지: `@topgrid/grid-export`
- 버전: `0.2.0`
- 라이선스: **MIT**
- peer dependency:
  - **필수**: `react` (`^18 || ^19`), `react-dom` (`^18 || ^19`),
    `@tanstack/react-table` (`^8`), `xlsx` (`^0.18.5`)
  - **optional**: `jspdf` (`^2.5`), `jspdf-autotable` (`^3.5`) — PDF export 시에만 필요
- 진입점: 메인(`@topgrid/grid-export`) + 하위 경로
  `@topgrid/grid-export/legacy`(deprecated alias 전용).

---

## 1. 개요 — 함수 카탈로그

| 함수 | 출력 | 입력 | 반환 |
|------|------|------|------|
| `exportToExcel` | .xlsx 다운로드 | `Table` + 옵션 | `void` (동기) |
| `exportRowsToExcel` | .xlsx 다운로드 | 행 배열 + 컬럼 정의 + 옵션 | `void` (동기) |
| `exportToCSV` | .csv/.tsv 다운로드 | `Table` + 옵션 | `void` (동기) |
| `exportToPdf` | .pdf 다운로드 | `Table` + 옵션 | `Promise<void>` (비동기) |
| `copyToClipboard` | 클립보드(TSV) | `Table` + 옵션 | `Promise<void>` (비동기) |
| `printGrid` | 인쇄 팝업 | `Table` + 옵션 | `void` (동기) |
| `downloadExcel` | .xlsx 다운로드 | `Table` + 옵션 | `void` — **deprecated alias** (`/legacy`) |

내보낼 수 있는 타입:

```ts
ExportScope = 'all' | 'filtered' | 'selected';
EmptyBehavior = 'skip' | 'empty';

ExcelExportOptions, CSVExportOptions, PDFExportOptions,
ClipboardOptions, PrintOptions,           // Table 기반 함수 옵션
ExcelColumn, ExportRowsOptions,           // 행 배열 기반 exportRowsToExcel 옵션
DownloadExcelOptions                       // legacy alias 옵션
```

`Table` 기반 함수는 모두 TanStack 표준 API(`getCoreRowModel` / `getFilteredRowModel`
/ `getSelectedRowModel` / `getHeaderGroups` / `getLeafHeaders`)만 사용한다. 외부
ref나 imperative API는 없다. `exportRowsToExcel`만 TanStack 인스턴스 없이 동작한다.

---

## 2. 공통 개념

### 2.1 `scope` — 어떤 행을 내보낼지

`Table` 기반 6개 함수(`exportToExcel` / `exportToCSV` / `exportToPdf` /
`copyToClipboard` / `printGrid` / `downloadExcel`)는 동일한 `scope` 의미를 공유하며,
내부 헬퍼 `getRowsByScope(table, scope)` 한 곳에서 행을 해석한다.

| `scope` | 사용 API | 의미 |
|---------|----------|------|
| `'all'` | `table.getCoreRowModel().rows` | 필터/정렬 무시한 원본 전체 |
| `'filtered'` (기본) | `table.getFilteredRowModel().rows` | 현재 적용된 **필터 + 정렬** 반영 |
| `'selected'` | `table.getSelectedRowModel().rows` | 사용자가 선택한 행만 |

- 기본값은 `'filtered'` — 화면에 보이는 데이터가 그대로 나가는 것이 직관적이기 때문이다.
- TanStack v8의 행 모델 파이프라인은
  `getCoreRowModel → getSortedRowModel → getFilteredRowModel → getPaginationRowModel`
  순서이므로, `getFilteredRowModel().rows`는 **이미 정렬이 반영된** 결과다. 정렬을 위해
  별도로 `getSortedRowModel`을 호출할 필요가 없다.

### 2.2 `emptyBehavior` — 행 0건일 때

| 값 | 동작 |
|----|------|
| `'skip'` (기본) | 파일/클립보드/인쇄를 생성하지 않고 `console.warn` 후 즉시 반환 |
| `'empty'` | 헤더만 있는 빈 산출물 생성 |

`scope`/`emptyBehavior`는 모든 옵션 인터페이스가 동일한 `ExportScope` /
`EmptyBehavior` 타입을 참조한다(중복 리터럴 없는 단일 소스). 따라서 한 번 만든 옵션
객체를 여러 export 함수에 재사용할 수 있다.

### 2.3 헤더·셀 값 추출 규칙

- 헤더 텍스트: `columnDef.header`가 문자열이면 그 값을, 함수형 등 비문자열이면
  `column.id`를 fallback으로 사용한다.
- 셀 값: `cell.getValue()`가 `null`/`undefined`이면 빈 문자열로 변환한다
  (`String(null)` → `"null"` 같은 오염 방지).

---

## 3. 각 함수의 계약

### 3.1 `exportToExcel`

```ts
function exportToExcel<TData>(
  table: Table<TData>,
  options?: ExcelExportOptions,
): void;

interface ExcelExportOptions {
  fileName?: string;            // ('export.xlsx') 확장자 없으면 .xlsx 자동 추가
  sheetName?: string;          // ('Sheet1')
  scope?: ExportScope;         // ('filtered')
  emptyBehavior?: EmptyBehavior; // ('skip')
}
```

- `xlsx`의 `aoa_to_sheet`로 (헤더 행들 + 데이터 행들) AOA를 시트로 만들고
  `writeFile`로 동기 다운로드한다.
- **다중행 헤더(GroupColumnDef) 지원**: `table.getHeaderGroups()`를 순회해 헤더
  레이어를 구성하고, merge cell(`ws['!merges']`)을 계산한다(§5 참조).
- 한국어 헤더/데이터는 `xlsx`의 기본 UTF-8 인코딩으로 그대로 출력된다(별도 BOM 불필요).

### 3.2 `exportRowsToExcel`

TanStack `Table` 인스턴스 없이 **행 배열 + 컬럼 정의**만으로 .xlsx를 만든다.
서버에서 받은 raw 데이터를 그리드에 올리지 않고 바로 내보내는 경우에 쓴다. `scope`가
의미 없으므로 옵션에서 의도적으로 제외한다.

```ts
function exportRowsToExcel<TData extends Record<string, unknown>>(
  rows: TData[],
  columns: ExcelColumn[],
  options?: ExportRowsOptions,
): void;

interface ExcelColumn {
  key: string;                                       // 행 객체의 키
  header: string;                                    // 헤더 셀 텍스트
  width?: number;                                    // (15) 컬럼 너비(wch)
  format?: 'date' | 'datetime' | 'number' | 'currency';
}

interface ExportRowsOptions {
  fileName?: string;            // ('export.xlsx') 확장자 자동 추가
  sheetName?: string;          // ('Sheet1')
  emptyBehavior?: EmptyBehavior; // ('skip')
}
```

- **컬럼 너비**: `ws['!cols']`에 각 컬럼의 `width ?? 15`(wch)를 적용한다.
- **헤더 스타일**: 헤더 행 셀에 bold + 회색 채움(`F3F4F6`)을 지정한다. 단,
  `xlsx` 커뮤니티 에디션의 스타일 지원은 제한적이므로 환경에 따라 스타일이 반영되지
  않을 수 있다.
- **값 포맷**: `format`에 따라 값을 변환한다 — `date`/`datetime`은
  `toLocaleDateString`/`toLocaleString('ko-KR')`(유효하지 않은 날짜는 원본 문자열
  유지), `number`/`currency`는 `Number()`로 변환(파싱 실패 시 원본 유지). 미지정 시
  값 그대로.

### 3.3 `exportToCSV`

```ts
function exportToCSV<TData>(
  table: Table<TData>,
  options?: CSVExportOptions,
): void;

interface CSVExportOptions {
  fileName?: string;            // ('export.csv') .csv/.tsv 없으면 .csv 자동 추가
  scope?: ExportScope;         // ('filtered')
  delimiter?: ',' | '\t';      // (',') 콤마 또는 탭(TSV)
  emptyBehavior?: EmptyBehavior; // ('skip')
}
```

- 외부 라이브러리 없이 순수 문자열 조작으로 RFC 4180 CSV를 만든다.
- **RFC 4180 이스케이프**: 필드에 구분자/큰따옴표/개행(`\n`/`\r`)이 있으면 큰따옴표로
  감싸고 내부 큰따옴표는 `""`로 이중화한다. 행 구분자는 CRLF(`\r\n`).
- 단일행 헤더(`getLeafHeaders()`)만 출력한다 — CSV는 다중행 헤더 개념이 없다.
- **UTF-8 BOM 포함**: Blob 앞에 BOM(`﻿`)을 붙여 Excel이 한국어를 깨짐 없이
  인식하게 한다. `Blob` → `URL.createObjectURL` → `<a download>` 클릭으로 다운로드
  (브라우저 전용, SSR 불가).
- `delimiter`를 `'\t'`로 주면 TSV가 되며, 이때도 탭 포함 필드는 RFC 4180 규칙으로
  이스케이프된다.

### 3.4 `exportToPdf`

```ts
async function exportToPdf<TData>(
  table: Table<TData>,
  options?: PDFExportOptions,
): Promise<void>;

interface PDFExportOptions {
  fileName?: string;                 // ('export.pdf') 확장자 자동 추가
  title?: string;                    // (undefined) 문서 상단 제목 행
  scope?: ExportScope;              // ('filtered')
  emptyBehavior?: EmptyBehavior;     // ('skip')
  orientation?: 'p' | 'l';          // ('p') 세로/가로
  fontFamily?: 'default' | 'korean'; // ('default')
}
```

- `jspdf` + `jspdf-autotable`을 **동적 import**하여 사용한다. 초기 번들에는 포함되지
  않고, 함수가 처음 호출될 때만 로드된다.
- 두 라이브러리는 optional peer이므로 **미설치 시 명확한 Error**를 던진다:
  `[exportToPdf] jspdf is not installed. Run: npm install jspdf jspdf-autotable`.
- 다중행 헤더는 `getHeaderGroups()`로 `head: string[][]`을 구성해 `autoTable`에
  전달한다. 데이터 행은 리프 헤더 순서(`getLeafHeaders()`)에 맞춰 `column.id`로 셀을
  매핑한다.
- `title`이 있으면 표 위에 텍스트로 그린다.
- `fontFamily: 'korean'`은 현재 **stub**이다(§4.5).

### 3.5 `copyToClipboard`

```ts
async function copyToClipboard<TData>(
  table: Table<TData>,
  options?: ClipboardOptions,
): Promise<void>;

interface ClipboardOptions {
  scope?: ExportScope;          // ('filtered')
  emptyBehavior?: EmptyBehavior; // ('skip')
}
```

- 데이터를 **TSV**(탭 구분 + 줄바꿈 행 구분)로 만들어 클립보드에 쓴다 — Excel에
  붙여넣기 호환.
- **TSV 이스케이프**: 셀 값 내 탭/개행(`\t`/`\r`/`\n`)을 공백으로 치환한다(§4.4).
- `navigator.clipboard.writeText`를 우선 사용하고, 미지원 환경(HTTP 개발 서버,
  구형 브라우저)에서는 숨겨진 `<textarea>` + `document.execCommand('copy')`로
  fallback한다. fallback도 실패하면 Error를 던진다.

### 3.6 `printGrid`

```ts
function printGrid<TData>(
  table: Table<TData>,
  options?: PrintOptions,
): void;

interface PrintOptions {
  title?: string;                // (undefined) 인쇄 페이지 상단 제목
  scope?: ExportScope;          // ('filtered')
  orientation?: 'p' | 'l';      // ('p') @page size 규칙
  emptyBehavior?: EmptyBehavior; // ('skip')
}
```

- 새 팝업 창(`window.open`)에 HTML `<table>`을 렌더하고 인쇄 대화상자를 연다. 순수
  Web API만 사용한다(외부 dep 0).
- `orientation`은 팝업 HTML의 `@page { size: portrait | landscape }`로 들어간다.
- **팝업 차단 시**: `window.open`이 `null`을 반환하면 `console.warn` 후 그대로 반환한다
  (throw 안 함 — void 함수가 caller에게 try/catch 의무를 지우지 않도록).
- 함수 자체는 동기 반환이지만 실제 인쇄는 `popup.onload` 콜백에서 발화된다(§4.3).

### 3.7 `downloadExcel` (deprecated alias)

```ts
// import { downloadExcel } from '@topgrid/grid-export/legacy';
function downloadExcel<TData>(
  table: Table<TData>,
  options?: DownloadExcelOptions,
): void;
```

- `exportToExcel(table, options)`에 그대로 위임하는 **하위호환 alias**다. `scope`
  기본값(`'filtered'`)은 `exportToExcel` 내부에서 해석된다.
- `@deprecated`로 표시되어 있으며 신규 코드는 `exportToExcel`을 직접 쓰는 것을
  권장한다. 최소 1 minor 버전 유지 후 제거 예정.
- 메인 진입점이 아닌 `@topgrid/grid-export/legacy` 하위 경로로만 노출된다.

---

## 4. 핵심 설계 결정과 근거

### 4.1 Excel — `xlsx`(SheetJS CE)를 필수 peer로 채택

Excel 출력은 `xlsx`(SheetJS Community Edition)에 의존한다. 선택 근거:

- **다중행 헤더**: `ws['!merges']`로 GroupColumnDef의 셀 병합을 직접 표현할 수 있다.
- **동기 다운로드**: `writeFile`이 동기 API라 단순한 `void` 함수로 감쌀 수 있다(비동기
  래핑이라는 불필요한 복잡도 회피).
- **UTF-8 기본 지원**: 한국어 헤더가 별도 처리 없이 정상 출력된다.
- **라이선스**: Apache-2.0 — MIT/Apache-2.0 허용 정책에 부합.

대안인 exceljs/pdf 기반 라이브러리는 번들이 과대(수백 KB)하고, 순수 CSV는 다중행
헤더를 표현할 수 없어 제외했다. `xlsx`는 필수 peer이므로 소비자가 직접 설치해야 한다
— 대용량 데이터 시 `writeFile` 동기 실행이 메인 스레드를 블로킹할 수 있다는 trade-off가
있으며, 이 경우 Web Worker 래핑을 권장한다(JSDoc 경고).

### 4.2 PDF — optional peer + 동적 import

`jspdf` + `jspdf-autotable`은 **optional peer**로 두고 함수 내부에서 동적 import한다.
PDF를 쓰지 않는 사용처는 이 라이브러리를 설치할 필요가 없고 초기 번들도 0이다. PDF를
실제로 쓰려면 소비자가 `npm install jspdf jspdf-autotable`로 opt-in한다. 미설치
상태에서 호출하면 설치 안내가 담긴 Error를 던진다. `jspdf-autotable`은 런타임에
`jsPDF` prototype을 확장하는 방식이라 타입 선언이 없어 `doc.autoTable` 호출 1곳에
`@ts-expect-error` 주석이 필요하다.

대안 비교: pdfmake(~300 KB)·html2pdf.js(~600 KB, SSR 불가)·puppeteer(브라우저
환경 불가)·브라우저 Print API(다운로드 제어 불가)는 모두 번들·환경 제약으로 제외했다.

### 4.3 CSV — 제로 의존 RFC 4180 + UTF-8 BOM

CSV/TSV는 외부 라이브러리 없이 순수 문자열 조작으로 만든다. 인코딩·이스케이프 규칙이
표준(RFC 4180)으로 단순하기 때문이다. Excel이 BOM 없는 UTF-8을 로컬 인코딩으로
오인해 한국어를 깨뜨리는 문제를 막기 위해 출력 앞에 BOM(`﻿`)을 붙인다.

### 4.4 클립보드 TSV — RFC quoting 대신 공백 치환

클립보드 복사는 CSV의 RFC 4180 이스케이프를 쓰지 않고 탭/개행을 **공백으로 치환**한다.
TSV에서는 탭이 구분자이고, 클립보드 → Excel 붙여넣기 경로에서는 큰따옴표 래핑이 문자
그대로 취급되어 오히려 깨지기 때문이다. 단순 공백 치환이 붙여넣기 호환성 면에서 가장
안전하다.

### 4.5 인쇄 — `onload`를 `document.write` 이전에 등록

인쇄 팝업은 `popup.onload` 콜백 안에서 `print()`를 호출한다. `document.write` 직후
즉시 `print()`를 부르면 일부 브라우저에서 DOM 미완성 상태로 빈 인쇄가 발생할 수 있다.
또한 `onload` 핸들러는 반드시 `document.write` **이전에** 등록해야 한다 — `about:blank`의
load 이벤트가 write 시점에 이미 발화되어, write 이후 등록하면 Firefox/Safari에서 핸들러를
놓칠 수 있기 때문이다.

### 4.6 한국어 PDF 폰트 — 의도된 stub

`fontFamily: 'korean'`이 호출하는 `loadKoreanFont`는 현재 no-op stub이며, 기본
Helvetica로 fallback되어 경고를 출력한다. 실제 폰트는 base64 임베딩이 필요해 번들이
~2 MB 증가할 수 있어, 폰트 라이선스(NotoSansKR/NanumGothic 모두 OFL 1.1 — 임베딩
허용) 확인과 번들 전략을 별도로 처리하기 위해 분리했다. `fontFamily: 'default'`
경로는 항상 동작이 보장된다.

### 4.7 행 해석 헬퍼의 단일화 — `getRowsByScope`

scope→행 변환 로직은 `internal/getRowsByScope.ts` 한 곳에만 두고 `Table` 기반 6개
함수가 모두 import해 쓴다. scope 의미가 모든 export 경로에서 동일해야 일관성이
보장되므로, 동일 로직을 복사하지 않고 단일 헬퍼로 추출했다.

---

## 5. 다중행 헤더(GroupColumnDef) merge 계산

`exportToExcel`의 `buildHeaderRows`는 `getHeaderGroups()`를 순회하며 헤더 행 배열과
merge 범위를 동시에 만든다.

- **placeholder 셀**: `header.isPlaceholder`인 셀은 빈 문자열로 채운다(상위 그룹
  헤더의 자식 자리).
- **수평 merge (colSpan)**: `header.colSpan > 1`인 그룹 헤더는 같은 행에서 colSpan
  만큼 가로로 병합한다.
- **수직 merge (rowspan)**: 헤더 행이 2개 이상일 때, 상위 행에서 `isPlaceholder`가
  false이고 `colSpan === 1`인 리프 헤더는 최하위 행까지 세로로 병합한다.

`exportToPdf`는 같은 `getHeaderGroups()` 정보를 `jspdf-autotable`의 `head: string[][]`
구조로 전달해 다중행 헤더를 렌더한다. CSV/클립보드/인쇄는 리프 헤더만 쓰는 단일행
헤더 모델이다.

---

## 6. 엣지 케이스 동작 요약

| 상황 | 동작 |
|------|------|
| 행 0건 + `emptyBehavior: 'skip'` | 산출물 미생성 + `console.warn` 후 반환 |
| 행 0건 + `emptyBehavior: 'empty'` | 헤더만 있는 산출물 생성 |
| `fileName` 확장자 누락 | 해당 포맷 확장자 자동 추가(.xlsx/.csv/.pdf; CSV는 .tsv도 허용) |
| 셀 값 `null`/`undefined` | 빈 문자열로 변환 |
| 헤더가 문자열이 아님(함수형 등) | `column.id`로 fallback |
| CSV 필드에 구분자/따옴표/개행 | 큰따옴표 래핑 + 내부 따옴표 `""` 이중화 |
| TSV(클립보드) 셀에 탭/개행 | 공백으로 치환 |
| PDF에서 `jspdf`/`jspdf-autotable` 미설치 | 설치 안내 Error throw |
| PDF `fontFamily: 'korean'` | stub — Helvetica fallback + 경고(한국어 깨질 수 있음) |
| 클립보드 API 미지원 환경 | `execCommand('copy')` fallback, 실패 시 Error throw |
| 인쇄 팝업 차단 | `console.warn` 후 반환(throw 안 함) |
| 대용량 데이터 export | 동기 생성이 메인 스레드 블로킹 가능(JSDoc 경고) |

---

## 7. 사용

### Table 기반 export

```tsx
import {
  exportToExcel, exportToCSV, exportToPdf,
  copyToClipboard, printGrid,
} from '@topgrid/grid-export';

// 현재 필터/정렬 반영된 행을 Excel로
exportToExcel(table, { fileName: '데이터.xlsx', sheetName: '목록' });

// 선택 행만 TSV로
exportToCSV(table, { fileName: '선택.tsv', delimiter: '\t', scope: 'selected' });

// PDF (jspdf 설치 필요, 비동기)
await exportToPdf(table, { fileName: '보고서.pdf', orientation: 'l', title: '월간 보고서' });

// 선택 행을 클립보드로 (Excel 붙여넣기 호환)
await copyToClipboard(table, { scope: 'selected' });

// 인쇄 대화상자
printGrid(table, { title: '계약 목록' });
```

동일 옵션 객체를 여러 함수에 재사용할 수 있다(scope/emptyBehavior 타입 공유):

```ts
import type { ExportScope, EmptyBehavior } from '@topgrid/grid-export';

const opts = { scope: 'selected' as ExportScope, emptyBehavior: 'skip' as EmptyBehavior };
exportToExcel(table, opts);
exportToCSV(table, opts);
```

### 행 배열 기반 export (Table 불필요)

```ts
import { exportRowsToExcel, type ExcelColumn } from '@topgrid/grid-export';

const columns: ExcelColumn[] = [
  { key: 'name', header: '이름', width: 20 },
  { key: 'amount', header: '금액', format: 'currency' },
  { key: 'createdAt', header: '등록일', format: 'date' },
];

exportRowsToExcel(rows, columns, { fileName: '보고서_2026.xlsx' });
```
