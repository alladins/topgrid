# MOD-GRID-06 / export / G-002 — Specification

**Goal ID**: MOD-GRID-06/export/G-002  
**Title**: CSV export — exportToCSV(table, options) 순수 JS 구현  
**Priority**: P0  
**migrationImpact**: medium  
**packageTarget**: `packages/grid-export` (monorepo: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/`)  
**licenseTier**: MIT  
**Spec 작성일**: 2026-05-14  
**specVersion**: 1.0  
**rubricVersion**: 1.0.5  

---

## ★ 사전 결정 (D#)

| # | 결정 | 사유 |
|---|------|------|
| D1 | `getRowsByScope<TData>` 헬퍼는 `exportToExcel.ts` 내부 private 함수로 존재 → **CSV 전용 복사 금지**, `internal/getRowsByScope.ts`로 추출하여 재사용 | G-001 구현 직접 확인 (L12-24): `getRowsByScope`가 `exportToExcel.ts` 내 private function. DRY — 동일 로직 두 파일에 중복 금지 (D1: 신규 `internal/getRowsByScope.ts` NEW + `exportToExcel.ts` MODIFY import 추가) |
| D2 | `escapeCsvValue` 헬퍼는 CSV 전용 신규 함수 → `exportToCSV.ts` 내부 private function으로 배치 | Excel에 해당 없음. 함수가 `exportToCSV.ts` 하나에서만 쓰임 — 별도 internal/ 분리 불필요 |
| D3 | `CSVExportOptions` interface를 `types.ts` MODIFY로 추가. `ExportScope` + `emptyBehavior` 타입은 G-001 정의 그대로 재사용 (중복 정의 금지) | G-001 `types.ts` 직접 확인: `ExportScope`, `emptyBehavior?: 'skip' \| 'empty'` 이미 존재 |
| D4 | 구현 대상 파일: NEW 2개 (`internal/getRowsByScope.ts`, `exportToCSV.ts`) + MODIFY 3개 (`exportToExcel.ts`, `types.ts`, `index.ts`) = 5파일 | D1~D3 결정 결과. G-001 직접 Read 후 확정 |
| D5 | `exportToCSV` 반환 타입 `void` (Promise 불필요) | RFC 4180 CSV 생성은 순수 string 조작 + `URL.createObjectURL`/`<a>` click — 모두 동기 API |
| D6 | `options.scope` 기본값 `'filtered'` | G-001 `ExcelExportOptions` 동일 패턴 유지 (C-2, C-6 일관성) |
| D7 | `options.emptyBehavior` 타입 `'skip' \| 'empty'` — `ExcelExportOptions` 기존 타입 필드와 동일하지만 `CSVExportOptions`에서 재선언 (union literal 직접 인라인) | `emptyBehavior`는 ExcelExportOptions 전용 타입명 없음 (anonymous union). CSVExportOptions에서도 동일 union을 inline 선언하여 ExcelExportOptions 의존성 없이 독립 사용 가능 |

---

## Section 1: 참조 추적

### L0 (현 구현): 기존 CSV 코드 없음

파일 확인: `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/DataTable/data-table.tsx`  
Glob 결과: `packages/grid-export/src/` 내 `exportToCSV*` 파일 없음 (2026-05-14 확인).  
**L0 결론**: 현재 구현에 CSV export 코드 없음. 신규 구현 필요. ("현 구현 없음" — A-01 N/A 조건 충족)

### L1 (TanStack v8 API)

출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md`

**Row Model 인스턴스 메서드** (tanstack-api-inventory.md §2.3 + §3 Table.core):
```ts
// scope별 Row 배열 획득 — C-2 표준 API만
table.getCoreRowModel().rows        // scope='all'
table.getFilteredRowModel().rows    // scope='filtered' (default)
table.getSelectedRowModel().rows    // scope='selected'
```

**Row + Cell 접근** (tanstack-api-inventory.md §2.1 core/row.d.ts):
```ts
row.getVisibleCells(): Cell<TData, unknown>[]
cell.getValue(): unknown
cell.column.id: string
```

**Header 접근** (tanstack-api-inventory.md §2.1 core/headers.d.ts):
```ts
table.getLeafHeaders(): Header<TData, unknown>[]   // 최하위 리프 헤더 (단일행 CSV 용)
header.column.columnDef.header: ColumnDef['header']  // string | undefined | function
header.column.id: string
```

**RFC 4180 인용**: CSV 이스케이프 표준 — 필드에 쉼표/큰따옴표/개행 포함 시 큰따옴표로 감싸고, 내부 큰따옴표는 이중화(`""`)

### L2 (G-001 구현 결과 직접 확인)

파일: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/exportToExcel.ts` (직접 Read 완료)

**`getRowsByScope<TData>` 헬퍼** — exportToExcel.ts L12-24 확인:
```typescript
// exportToExcel.ts L12-24 (내부 private 함수, 현재 export 없음)
function getRowsByScope<TData>(
  table: Table<TData>,
  scope: ExportScope,
): Row<TData>[] {
  if (scope === 'all') return table.getCoreRowModel().rows;
  if (scope === 'selected') return table.getSelectedRowModel().rows;
  return table.getFilteredRowModel().rows;  // 'filtered' default
}
```

**D1 결정 근거**: 위 함수가 `exportToCSV.ts`에도 동일하게 필요 → DRY 원칙으로 `internal/getRowsByScope.ts` 신설 후 양 파일에서 import.

**`types.ts` 현재 상태** (직접 Read 완료):
- `ExportScope`: `'all' | 'filtered' | 'selected'` → **G-002에서 재사용 (재정의 금지)**
- `ExcelExportOptions`: `emptyBehavior?: 'skip' | 'empty'` → 동일 union 타입, CSVExportOptions는 독립 재선언 (D7)
- `DownloadExcelOptions`: G-001 Excel alias — G-002에 무관

**`index.ts` 현재 상태** (직접 Read 완료):
```typescript
export { exportToExcel } from './exportToExcel';
export type { ExcelExportOptions, ExportScope, DownloadExcelOptions } from './types';
```
G-002에서: `exportToCSV` + `CSVExportOptions` re-export 추가 필요.

### L3 (영향 사용처)

**영향 사용처: 0개** — `exportToCSV`는 신규 API. 기존 `data-table.tsx`의 downloadAction 패턴은 Excel(G-001)과 동일하게 G-002에서도 수정 없음. G-005에서 통합 시나리오 테스트.

### R-A (AG Grid)

출처: `publish-aggrid-analysis.md §8` + feature-gap-matrix.md §2:
```
AG Grid Community: CSV export 지원 (네이티브)
  - grid.exportDataAsCsv({ fileName, columnKeys, skipHeader, allColumns })
  - 단순 string concatenation. RFC 4180 이스케이프 내장.
AG Grid Enterprise: Excel export만 추가 — CSV는 Community와 동일
```
- publish는 AG Grid CSV export 미사용 (publish-aggrid-analysis.md §8 표: "Excel Export ❌ (CSV만) — xlsx 라이브러리 별도" 확인)
- **우리는 AG Grid 비도입(C-7)**, 외부 라이브러리 0개로 직접 RFC 4180 구현

### R-W (Wijmo)

출처: `publish-wijmo-analysis.md §6`, `feature-gap-matrix.md §2`:
```
Wijmo FlexGridExporter — @mescius/wijmo.grid
  FlexGridExporter.saveToFile(grid, {fileName, format: 'Csv'})
  내부적으로 RFC 4180 이스케이프 처리
```
- **코드 차용 절대 금지 (C-16)** — 패턴 참고만

---

## Section 2: API 계약

### 2.1 타입 정의 (`packages/grid-export/src/types.ts` MODIFY — 추가 부분)

```typescript
// ── G-002: CSV export 옵션 (추가) ──────────────────────────────────────────
// ExportScope는 G-001 정의 재사용 (이 파일 L1-2 확인)

/**
 * CSV export 옵션
 *
 * @example
 * exportToCSV(table, { fileName: '데이터.csv', delimiter: ',' });
 * exportToCSV(table, { fileName: '데이터.tsv', delimiter: '\t', scope: 'selected' });
 */
export interface CSVExportOptions {
  /**
   * 다운로드 파일명 (확장자 포함 권장, 없으면 .csv 자동 추가)
   * @default 'export.csv'
   */
  fileName?: string;
  /**
   * export 대상 행 범위
   * - 'all': getCoreRowModel (필터 무시, 전체)
   * - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default
   * - 'selected': table.getSelectedRowModel (선택 행만)
   * @default 'filtered'
   */
  scope?: ExportScope;
  /**
   * CSV 구분자 — ',' (기본, RFC 4180) 또는 '\t' (TSV 옵션)
   * @default ','
   */
  delimiter?: ',' | '\t';
  /**
   * 데이터 행 0건 시 동작
   * - 'skip': 파일 생성 안 함 (기본)
   * - 'empty': 헤더만 있는 빈 파일 생성
   * @default 'skip'
   */
  emptyBehavior?: 'skip' | 'empty';
}
```

**추가 위치**: `types.ts` 파일 끝 (DownloadExcelOptions 블록 다음)  
**재사용**: `ExportScope`는 L1-2 기존 정의 그대로 참조 (재정의 금지 — D3)

### 2.2 함수 시그니처 (`packages/grid-export/src/exportToCSV.ts` NEW)

```typescript
import type { Table } from '@tanstack/react-table';
import type { CSVExportOptions } from './types';

/**
 * TanStack Table 인스턴스를 기반으로 CSV 파일을 생성·다운로드한다.
 * UTF-8 BOM(﻿) 포함 — 한국어 Excel 정상 표시 (AC-004).
 *
 * @param table - TanStack v8 Table<TData> 인스턴스 (useReactTable 반환값)
 * @param options - CSV export 옵션 (fileName, scope, delimiter, emptyBehavior)
 * @returns void (순수 string 조작 + createObjectURL — 외부 라이브러리 0)
 */
export function exportToCSV<TData>(
  table: Table<TData>,
  options?: CSVExportOptions,
): void;
```

### 2.3 사용 예시

**예시 1: 기본 (한국어 CSV, filtered 행, 콤마 구분)**
```typescript
import { exportToCSV } from '@tomis/grid-export';

// 컴포넌트 내부
const handleDownloadCSV = () => {
  exportToCSV(table, { fileName: '데이터.csv' });
  // → BOM 포함 UTF-8 CSV, 현재 필터/정렬 반영
};
```

**예시 2: TSV + 선택 행**
```typescript
import { exportToCSV } from '@tomis/grid-export';

exportToCSV(table, {
  fileName: '선택데이터.tsv',
  delimiter: '\t',
  scope: 'selected',
  emptyBehavior: 'empty',
});
// → TSV(탭 구분), 선택된 행만, 선택 0건 시 헤더만 있는 파일 생성
```

### 2.4 기본값 / optional 명시

| 옵션 | 타입 | 기본값 | required |
|------|------|--------|----------|
| `fileName` | `string` | `'export.csv'` | optional |
| `scope` | `ExportScope` | `'filtered'` | optional |
| `delimiter` | `',' \| '\t'` | `','` | optional |
| `emptyBehavior` | `'skip' \| 'empty'` | `'skip'` | optional |

### 2.5 타입 export 경로 명시

| 타입 | 정의 파일 | export 경로 |
|------|---------|-----------|
| `CSVExportOptions` | `packages/grid-export/src/types.ts` (MODIFY 추가) | `@tomis/grid-export` (index.ts re-export) |
| `ExportScope` | `packages/grid-export/src/types.ts` (G-001 기존) | `@tomis/grid-export` (기존 export 유지) |

---

## Section 3: 기존 사용처 대응표

| 기존 패턴 | 기존 위치 | 신규 API | 마이그레이션 액션 |
|-----------|-----------|----------|-----------------|
| (N/A — 신규 export 기능) | — | `exportToCSV(table, options)` | 기존 코드 없음 — 신규 도입 |

**모든 행 "(N/A — 신규 export 기능)"**: `exportToCSV`는 tw-framework-front에 현재 구현 없음 (L0 Section 1 확인).

---

## Section 4: 호환성 정책

### Breaking change: **no**
- `exportToCSV`는 신규 패키지(`packages/grid-export`)의 신규 함수 — 기존 코드 파괴 없음
- G-001 `exportToExcel` API 시그니처 **무수정** (types.ts MODIFY는 `CSVExportOptions` 추가만 — 기존 타입 불변)
- `internal/getRowsByScope.ts` 신설 + `exportToExcel.ts` MODIFY는 동일 로직 추출이므로 동작 변경 없음

### Deprecation 정책
- 없음 (신규 기능 — Deprecation 불필요)

### peerDependencies 정책 (C-22)
- `@tanstack/react-table ^8` — peer (G-001과 동일, 신규 peer 추가 없음)
- `react ^18 || ^19` — peer (G-001과 동일)
- **외부 dep 추가 없음** — `exportToCSV`는 순수 JS string 조작 + DOM API (`URL.createObjectURL`, `<a>`)만 사용 (AC-001)
- **ADR 불필요** (C-9, C-20: 신규 외부 dependency 0개 — F-02 N/A 조건)

---

## Section 5: 인수 기준

모든 AC에 출처 태그 포함.

| AC ID | 설명 | 출처 |
|-------|------|------|
| **AC-001** | `exportToCSV<TData>(table: Table<TData>, options?: CSVExportOptions): void` — 외부 라이브러리 0개, 순수 string 조작. `: any` 금지 | `L1: tanstack-api-inventory.md §2.3 row.getVisibleCells()`, `C-4 strict`, `canonical-modules.json F-06-03 "Native string"` |
| **AC-002** | `options.scope: 'all' \| 'filtered' \| 'selected'` (ExportScope 재사용, G-001 동일 패턴) — `'filtered'`(기본): `table.getFilteredRowModel()`, `'selected'`: `table.getSelectedRowModel()`, `'all'`: `table.getCoreRowModel()` | `L1: tanstack-api-inventory.md §2.3 Row Model 함수`, `C-2 표준 API`, `L2: G-001 types.ts ExportScope 직접 확인` |
| **AC-003** | RFC 4180 CSV 이스케이프 준수 — 필드에 구분자/큰따옴표/개행(`\n`, `\r\n`) 포함 시 큰따옴표로 감싸고, 내부 큰따옴표는 `""` 이중화 | `L1: RFC 4180 §2 CSV 표준`, `R-A: publish-aggrid-analysis.md §8 AG Grid Community CSV export 동등` |
| **AC-004** | UTF-8 BOM(`﻿`) 포함 Blob 생성 → 한국어 Excel 정상 표시 (F-06-06 흡수) — `new Blob(['﻿' + csvString], { type: 'text/csv;charset=utf-8;' })` | `canonical-modules.json F-06-06 "한국어 column header 인코딩"`, `C-4 strict` |
| **AC-005** | `options.delimiter: ',' \| '\t'` — 콤마(기본, RFC 4180) 또는 탭(TSV 옵션). 구분자 값은 이스케이프 판단에도 사용 (`\t` 구분자 시 탭 포함 필드도 큰따옴표 래핑) | `L1: tanstack-api-inventory.md §2.3 getVisibleCells`, `R-A: AG Grid exportDataAsCsv columnSeparator 옵션` |
| **AC-006** | `tsc --noEmit` 0 error (`grid-export` 패키지 전체 — `internal/getRowsByScope.ts` 신설 + `exportToExcel.ts` MODIFY import 포함) | `C-12 빌드 0 errors 필수` |
| **AC-007** | Storybook story 1개 — 한국어 셀 + TSV delimiter 시나리오 포함 | `C-25 Public API 문서화 의무` |

---

## Section 6: 엣지 케이스

### EC-01: 셀 값에 구분자/큰따옴표/개행 포함 (RFC 4180 핵심)
- **시나리오 A**: 셀 값 `"홍길동,부서장"` (쉼표 포함, delimiter=',')
  - 기대 동작: `"홍길동,부서장"` (큰따옴표 래핑)
- **시나리오 B**: 셀 값 `He said "hello"` (큰따옴표 포함)
  - 기대 동작: `"He said ""hello"""` (큰따옴표 래핑 + 내부 큰따옴표 이중화)
- **시나리오 C**: 셀 값에 개행(`\n`, `\r`, `\r\n`) 포함
  - 기대 동작: 큰따옴표 래핑 (개행은 필드 내부로 포함)
- **구현 주의**: `escapeCsvValue(value, delimiter)` 헬퍼 — 구분자/큰따옴표/개행 3종 조건 검사

### EC-02: 빈 데이터 (행 0건)
- **시나리오**: 필터 결과 0행 또는 selected 0건
- **기대 동작 (`emptyBehavior='skip'`)**: 파일 생성 안 함 + `console.warn('[grid-export] exportToCSV: 내보낼 데이터가 없습니다.')`
- **기대 동작 (`emptyBehavior='empty'`)**: 헤더 행만 있는 CSV 파일 생성 (BOM + 헤더 행 1줄)
- **구현 주의**: G-001 `exportToExcel` 동일 패턴 유지 (D6)

### EC-03: 한국어 셀 값 + TSV delimiter
- **시나리오**: 셀 값 `"부서명: 개발팀"`, delimiter=`'\t'`
- **기대 동작**: 탭 포함이 없으므로 큰따옴표 래핑 없음. BOM(`﻿`) 포함 TSV. Excel에서 한국어 정상 표시 (AC-004)
- **구현 주의**: delimiter=`'\t'` 시에도 RFC 4180 이스케이프 적용 (필드에 탭 포함 시 큰따옴표 래핑)

### EC-04: null/undefined 셀 값
- **시나리오**: `cell.getValue()` 반환 `null` 또는 `undefined`
- **기대 동작**: 빈 문자열 `''`로 처리 — `value !== null && value !== undefined ? String(value) : ''`
- **구현 주의**: `String(null)` → `"null"` (오류) → null/undefined 체크 후 빈 문자열 변환 필수

### EC-05: fileName에 확장자 없음
- **시나리오**: `options.fileName = '데이터목록'` (`.csv` 누락)
- **기대 동작**: 자동으로 `.csv` 추가 → `'데이터목록.csv'`
- **구현 주의**: G-001 `exportToExcel`의 `.xlsx` 자동 추가 동일 패턴

### EC-06: getRowsByScope 추출 후 exportToExcel.ts 동작 보존
- **시나리오**: D1 결정으로 `getRowsByScope`가 `internal/getRowsByScope.ts`로 추출되고 `exportToExcel.ts`에서 import 변경
- **기대 동작**: `exportToExcel` 기존 동작 완전 보존 — 로직 변경 없이 import 경로만 변경
- **구현 주의**: `exportToExcel.ts` MODIFY 후 tsc 0 error + 기존 AC-001~008 전부 유지

---

## Section 7: 구현 대상 파일

**C-28 경로 확인**: G-001에서 monorepo 디렉토리 신설 완료 (`D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/` 존재 확인). 본 G-002는 경로 정정 불필요 — 기존 패키지 파일 추가/수정만.

**재결정 없음** — 아래 표가 최종 권위 (C-30, E-06 자가 검증 통과).

| # | 액션 | 파일 (monorepo 절대 경로) | 설명 |
|---|------|--------------------------|------|
| 1 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/internal/getRowsByScope.ts` | `getRowsByScope<TData>` 공유 헬퍼 추출 (D1) — Excel + CSV 양쪽 재사용 |
| 2 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/exportToCSV.ts` | 핵심 함수: RFC 4180 이스케이프 + BOM UTF-8 Blob 다운로드 |
| 3 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/exportToExcel.ts` | private `getRowsByScope` 제거 + `internal/getRowsByScope` import 추가 (D1, C-31 wiring) |
| 4 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/types.ts` | `CSVExportOptions` interface 추가 (D3). `ExportScope` 재사용. |
| 5 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/index.ts` | `exportToCSV` + `CSVExportOptions` re-export 추가 |

**★ D# 표 ↔ 본문 cross-check (G-01 v1.0.4 의무)**:
- D4: "NEW 2개 + MODIFY 3개 = 5파일" ↔ 위 표: NEW 2행(#1, #2) + MODIFY 3행(#3, #4, #5) = 5행 ✓
- D1 언급 파일: `internal/getRowsByScope.ts`(#1) + `exportToExcel.ts`(#3) ↔ 위 표 행 존재 ✓
- D3 언급 파일: `types.ts`(#4) ↔ 위 표 행 존재 ✓
- index.ts(#5) ↔ Section 11 Step 3에서 명시 ✓

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처 (0개)
- `exportToCSV`는 신규 API — 현재 사용처 없음
- C-19 준수: 사용처 0개 (≤ 5개 한도 통과)
- 향후 통합 시나리오: G-005 트랙

### 8.2 무파괴 검증 방법
- `tsc --noEmit` (grid-export 패키지 전체) → 0 error (AC-006)
- `exportToExcel.ts` MODIFY: `getRowsByScope` 로직 변경 없이 import만 교체 → 기존 G-001 AC-001~008 전부 유지
- `types.ts` MODIFY: `CSVExportOptions` 추가만 — 기존 `ExcelExportOptions`, `ExportScope`, `DownloadExcelOptions` 타입 불변
- `index.ts` MODIFY: 신규 re-export 추가만 — 기존 `exportToExcel` export 불변
- 이 Goal은 기존 monorepo 패키지 내 파일 추가/수정 — H-02 신규 디렉토리 생성 없음 (`internal/` 폴더만 신설)

### 8.3 점진 마이그레이션 (C-19)
- G-002에서: `exportToCSV` + `CSVExportOptions` 노출
- `data-table.tsx` 실제 코드 변경 없음 — 사용처 0개
- 실제 사용처 통합: G-005 트랙

### 8.4 롤백 전략
- 신규 export 비활성화: `index.ts`에서 `exportToCSV` re-export 줄만 제거 → 영향 0 (D5)
- `getRowsByScope` 추출 롤백: `exportToExcel.ts`에 원래 private 함수 재삽입 → import 제거
- 단일 함수 export 구조이므로 롤백 영향 범위 최소

### 8.5 번들 크기
- `packages/grid-export`: +2 KB (gzipped 예상) — `exportToCSV.ts` 순수 string 조작, `internal/getRowsByScope.ts` 소규모 헬퍼
- `getRowsByScope` 추출은 Excel 측 코드 감소 + CSV 측 추가 → 순 증가 ≈ +2 KB (feature-gap-matrix.md §6: `grid-export` 현재 ~12 KB → G-002 후 ~14 KB 예상)
- 외부 dep 0 → xlxs/jspdf peer 사이즈 무영향

---

## Section 9: 의존성

### peerDependencies (C-22 엄수 — 변경 없음)

G-001이 정의한 `package.json` peerDependencies 그대로 유지 (신규 peer 0):
```json
"peerDependencies": {
  "@tanstack/react-table": "^8.0.0",
  "jspdf": "^2.5.0",
  "jspdf-autotable": "^3.5.0",
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "xlsx": "^0.18.5"
}
```

**G-002 신규 peer 없음** — `exportToCSV`는 외부 라이브러리 0개 (순수 DOM API: `URL.createObjectURL`, `<a>`)

### dependencies (없음)
- 순수 string 조작 + DOM API만 사용. runtime dep 없음.

### devDependencies (변경 없음)
- G-001 정의 그대로: `typescript`, `tsup`, `@tanstack/react-table`, `xlsx`, `@types/react`, `react`

---

## Section 10: 사용자 여정

### 개발자 관점

```
1. import 설치 확인
   import { exportToCSV } from '@tomis/grid-export';

2. TanStack table 인스턴스 확보
   const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

3. 버튼 onClick에서 호출 (기본 CSV)
   const handleDownloadCSV = () => {
     exportToCSV(table, { fileName: '직원목록.csv' });
   };

4. TSV 내보내기 (Excel 탭 분리)
   const handleDownloadTSV = () => {
     exportToCSV(table, { fileName: '직원목록.tsv', delimiter: '\t' });
   };

5. 선택 행만 내보내기
   exportToCSV(table, { fileName: '선택데이터.csv', scope: 'selected' });
```

### 최종 사용자 관점

```
1. 화면의 "CSV 다운로드" 버튼 클릭
   → 현재 적용된 정렬/필터 상태 그대로 반영

2. 브라우저 파일 다운로드 다이얼로그 표시
   → '데이터.csv' 파일명으로 저장 가능

3. Excel에서 파일 오픈
   → 한국어 헤더/데이터 정상 표시 (BOM UTF-8 AC-004)
   → 특수문자(쉼표/따옴표) 포함 셀도 RFC 4180 이스케이프로 정상 처리
```

---

## Section 11: 구현 계획

### 11.1 Before/After 코드 스니펫

**Before (`types.ts` 현재 상태 — L45 이후 끝)**:
```typescript
// G-001 기존 코드 (G-002에서 불변)
export interface DownloadExcelOptions
  extends Omit<ExcelExportOptions, 'scope'> {
  scope?: ExportScope;
}
// ← 파일 끝 (CSVExportOptions 없음)
```

**After (`types.ts` G-002 추가 부분)**:
```typescript
// G-001 기존 코드 (불변)
export interface DownloadExcelOptions
  extends Omit<ExcelExportOptions, 'scope'> {
  scope?: ExportScope;
}

// ── G-002: CSV export 옵션 ─────────────────────────────────────────────────
export interface CSVExportOptions {
  fileName?: string;     // default: 'export.csv'
  scope?: ExportScope;   // ExportScope 재사용 (L1-2 기존 정의)
  delimiter?: ',' | '\t'; // default: ','
  emptyBehavior?: 'skip' | 'empty'; // default: 'skip'
}
```

### 11.2 구현 순서

**Step 1**: `internal/getRowsByScope.ts` NEW — 공유 헬퍼 추출 (D1, C-31)
```typescript
// packages/grid-export/src/internal/getRowsByScope.ts
import type { Row, Table } from '@tanstack/react-table';
import type { ExportScope } from '../types';

/**
 * TanStack scope 에 따라 Row 배열 반환 (C-2: 표준 API만 사용)
 * G-001 exportToExcel.ts L12-24 에서 추출 — Excel + CSV 공유 헬퍼
 */
export function getRowsByScope<TData>(
  table: Table<TData>,
  scope: ExportScope,
): Row<TData>[] {
  if (scope === 'all') return table.getCoreRowModel().rows;
  if (scope === 'selected') return table.getSelectedRowModel().rows;
  return table.getFilteredRowModel().rows; // 'filtered' default
}
```

**Step 2**: `exportToExcel.ts` MODIFY — private `getRowsByScope` 제거 + internal import 추가 (C-31 wiring)
```typescript
// 변경 전 (L12-24 private function 제거)
// function getRowsByScope<TData>(...) { ... }  ← 제거

// 변경 후 (파일 상단 import 추가)
import { getRowsByScope } from './internal/getRowsByScope';
// 함수 본체는 동일 — import 경로만 변경
```

**Step 3**: `types.ts` MODIFY — `CSVExportOptions` 추가 (D3)
- 파일 끝에 Section 11.1 After 코드 추가
- 기존 타입(`ExportScope`, `ExcelExportOptions`, `DownloadExcelOptions`) 무수정

**Step 4**: `exportToCSV.ts` NEW — 핵심 함수

```typescript
// packages/grid-export/src/exportToCSV.ts
import type { Table } from '@tanstack/react-table';
import type { CSVExportOptions } from './types';
import { getRowsByScope } from './internal/getRowsByScope';

// ---------------------------------------------------------------------------
// Internal helper — RFC 4180 이스케이프
// ---------------------------------------------------------------------------

/**
 * RFC 4180 §2: 구분자/큰따옴표/개행 포함 시 큰따옴표 래핑 + 내부 따옴표 이중화
 * (외부 라이브러리 0 — 순수 string 조작, AC-001, AC-003)
 */
function escapeCsvValue(value: string, delimiter: string): string {
  const needsQuoting =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r');
  if (!needsQuoting) return value;
  return '"' + value.replaceAll('"', '""') + '"';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * TanStack Table 인스턴스를 기반으로 CSV 파일을 생성·다운로드한다.
 * UTF-8 BOM(﻿) 포함 — 한국어 Excel 정상 표시.
 *
 * @param table  TanStack v8 Table<TData> 인스턴스
 * @param options CSV export 옵션
 *
 * @example
 * exportToCSV(table, { fileName: '데이터.csv' });
 *
 * @example
 * exportToCSV(table, { fileName: '선택.tsv', delimiter: '\t', scope: 'selected' });
 */
export function exportToCSV<TData>(
  table: Table<TData>,
  options?: CSVExportOptions,
): void {
  const {
    fileName = 'export.csv',
    scope = 'filtered',
    delimiter = ',',
    emptyBehavior = 'skip',
  } = options ?? {};

  // 1) 행 결정 (C-2: TanStack 표준 API — getRowsByScope 공유 헬퍼)
  const rows = getRowsByScope(table, scope);

  // 2) 빈 데이터 처리 (EC-02)
  if (rows.length === 0 && emptyBehavior === 'skip') {
    console.warn('[grid-export] exportToCSV: 내보낼 데이터가 없습니다.');
    return;
  }

  // 3) 헤더 추출 — 리프 헤더만 (단일행 CSV, CSV는 다중행 헤더 미지원)
  const leafHeaders = table.getLeafHeaders();
  const headerRow = leafHeaders
    .map((h) => {
      const headerDef = h.column.columnDef.header;
      const text = typeof headerDef === 'string' ? headerDef : h.column.id;
      return escapeCsvValue(text, delimiter);
    })
    .join(delimiter);

  // 4) 데이터 행 추출 (EC-04: null/undefined → 빈 문자열)
  const dataRows = rows.map((row) =>
    row
      .getVisibleCells()
      .map((cell) => {
        const value = cell.getValue();
        const str =
          value !== null && value !== undefined ? String(value) : '';
        return escapeCsvValue(str, delimiter);
      })
      .join(delimiter),
  );

  // 5) CSV 문자열 조립 (AC-003 RFC 4180)
  const lines = [headerRow, ...dataRows];
  const csvString = lines.join('\r\n'); // RFC 4180: CRLF

  // 6) BOM + Blob 생성 → 다운로드 (AC-004: ﻿ UTF-8 BOM)
  const bom = '﻿';
  const blob = new Blob([bom + csvString], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // 7) fileName 확장자 자동 추가 (EC-05)
  const finalFileName = fileName.endsWith('.csv')
    ? fileName
    : fileName.endsWith('.tsv')
      ? fileName
      : `${fileName}.csv`;
  link.download = finalFileName;
  link.click();
  URL.revokeObjectURL(url);
}
```

**Step 5**: `index.ts` MODIFY — `exportToCSV` + `CSVExportOptions` re-export 추가
```typescript
// 기존 (불변)
export { exportToExcel } from './exportToExcel';
export type { ExcelExportOptions, ExportScope, DownloadExcelOptions } from './types';

// G-002 추가
export { exportToCSV } from './exportToCSV';
export type { CSVExportOptions } from './types';
```

### 11.3 구현 순서 요약 (의존성 고려)

1. `internal/getRowsByScope.ts` NEW → 의존성 없음 (기반)
2. `exportToExcel.ts` MODIFY → Step 1 완료 후 (import 교체)
3. `types.ts` MODIFY → 독립 (기존 타입 불변, CSVExportOptions 추가)
4. `exportToCSV.ts` NEW → Step 1 + Step 3 완료 후 (getRowsByScope + CSVExportOptions 사용)
5. `index.ts` MODIFY → Step 3 + Step 4 완료 후 (re-export)

### 11.4 위험 요소

| # | 위험 | 완화 |
|---|------|------|
| W1 | RFC 4180 이스케이프 오류 — 구분자/따옴표/개행 조합 | EC-01 3종 시나리오 단위 테스트 (Section 12) |
| W2 | `getRowsByScope` 추출 후 `exportToExcel` 동작 회귀 | tsc 0 error + G-001 기존 AC 재검증 (EC-06) |
| W3 | BOM 처리 누락 → 한국어 Excel 깨짐 | `'﻿'` 상수 명시 + Storybook story 한국어 확인 (AC-007) |
| W4 | `table.getLeafHeaders()` API 존재 확인 | tanstack-api-inventory.md §2.1 `core/headers.d.ts` 확인 — `getLeafHeaders()` 인스턴스 메서드 존재 (C-2) |
| W5 | `URL.createObjectURL` / `<a>` click — SSR 환경 불가 | JSDoc에 "브라우저 전용" 명시. SSR 불필요 (grid는 클라이언트 전용) |

---

## Section 12: 검증 계획

### 12.1 단위 테스트 시나리오

| 시나리오 | 검증 방법 |
|---------|---------|
| scope='filtered', 3행 + 쉼표 구분자 | RFC 4180 이스케이프 + 3행 확인 |
| scope='selected', 2행 선택 | `getSelectedRowModel().rows.length === 2` + 2행 확인 |
| scope='all', 전체 행 | `getCoreRowModel().rows` 전체 확인 |
| 셀 값에 쉼표 포함 (`"홍,길동"`) | 큰따옴표 래핑 `"홍,길동"` |
| 셀 값에 큰따옴표 포함 (`He said "hi"`) | `"He said ""hi"""` |
| 셀 값에 개행 포함 | 큰따옴표 래핑 |
| null/undefined 셀 | 빈 문자열 `''` 처리 |
| 빈 데이터 (emptyBehavior='skip') | `console.warn` + 파일 미생성 |
| 빈 데이터 (emptyBehavior='empty') | 헤더만 있는 CSV |
| delimiter='\t' + 한국어 셀 | TSV + BOM UTF-8 |
| fileName 확장자 없음 | `.csv` 자동 추가 |
| `exportToExcel` 기존 동작 보존 | G-001 AC-001~008 재확인 (W2) |

### 12.2 빌드 검증

```bash
# grid-export 패키지 전체 typecheck
cd D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export
npx tsc --noEmit          # 0 error 필수 (AC-006, C-12)
npx tsup                  # CJS+ESM dual build
```

### 12.3 Storybook (AC-007)

| Story | 시나리오 |
|-------|---------|
| `ExportToCSV.stories.tsx` 기본 | 한국어 헤더 + 쉼표 구분자 + filtered 행 CSV 다운로드 |
| TSV 시나리오 | delimiter='\t', 한국어 셀 TSV 다운로드 → Excel 열기 |

**문서 경로**: `packages/grid-export/src/exportToCSV.stories.tsx` (G-001의 `exportToExcel.stories.tsx` 동일 패키지)

### 12.4 시각 회귀

- **방법**: Storybook story (C-25 AC-007)
- **migrationImpact: medium** → 시각 회귀 검증 의무 (C-13, C-17)
- **주의**: `data-table.tsx` 수정 없음 + 사용처 0개 → Storybook story 동작 확인으로 충분 (C-17 N/A 조건 준수: 영향 사용처 0개)

---

## Section 13: 상용 제품화 영향

### 패키지 분류
- **패키지**: `packages/grid-export` — **MIT (Open Tier)**
- `licenseTier: 'MIT'` — canonical-modules.json MOD-GRID-06 직접 확인

### 라이선스 검증
- **불필요** (MIT 패키지 — F-02 N/A)
- `configureGridLicense()` 호출 불필요
- **외부 dep 추가 없음 → ADR 불필요** (C-9, C-20: 신규 외부 dependency 0개이므로 ADR 작성 의무 미발동)

### 문서화 계획 (C-25)

| 문서 | 경로 | 내용 |
|------|------|------|
| Docusaurus 페이지 | `apps/docs/docs/grid-export/csv.md` | API reference + 사용 예시 2개 (기본/TSV) |
| Storybook story | `packages/grid-export/src/exportToCSV.stories.tsx` | 기본 export + TSV 시나리오 (AC-007) |
| README.md | G-001 생성 `packages/grid-export/README.md` MODIFY | `exportToCSV` 섹션 추가 |

### ADR
- **불필요** — 신규 외부 dependency 0개 (CSV는 순수 JS string 조작 + DOM API)
- G-001 기존 ADR(`decisions/MOD-GRID-06-decisions.md` ADR-MOD-GRID-06-001 xlsx peer 채택)에 영향 없음

### 번들 영향 (C-21)
- `grid-export`: +2 KB (gzipped 예상) — feature-gap-matrix.md §6 `grid-export` ~12 KB → ~14 KB
- C-21 별도 한도 패키지 (`grid-export`는 grid-core 30 KB 한도와 별개)
- `size-limit` 설정 확인: G-001 `package.json` 내 `size-limit` 설정 여부 → Implementer가 빌드 후 확인
