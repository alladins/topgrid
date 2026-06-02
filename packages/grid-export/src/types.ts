/** Excel export 범위 지정 */
export type ExportScope = 'all' | 'filtered' | 'selected';

/** export 시 데이터 행 0건 동작 — 5개 Options 공유 single source-of-truth (G-005 D2) */
export type EmptyBehavior = 'skip' | 'empty';

/**
 * Excel export 옵션
 *
 * G-005 (emptyBehavior) 와 동일 타입 공유 — types.ts single source-of-truth (D7)
 */
export interface ExcelExportOptions {
  /**
   * 다운로드 파일명 (확장자 포함 권장, 없으면 .xlsx 자동 추가)
   * @default 'export.xlsx'
   */
  fileName?: string;
  /**
   * Excel 시트명
   * @default 'Sheet1'
   */
  sheetName?: string;
  /**
   * export 대상 행 범위
   * - 'all': getCoreRowModel (필터 무시, 전체)
   * - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default
   * - 'selected': table.getSelectedRowModel (선택 행만)
   * @default 'filtered'
   */
  scope?: ExportScope;
  /**
   * 데이터 행 0건 시 동작
   * - 'skip': 파일 생성 안 함 (기본)
   * - 'empty': 헤더만 있는 빈 파일 생성
   * @default 'skip'
   */
  emptyBehavior?: EmptyBehavior;
  /**
   * 컬럼별 네이티브 Excel number-format 코드 (MOD-GRID-25 G-1)
   *
   * key = 컬럼 id, value = Excel format 코드(예 `'#,##0.00'`, `'yyyy-mm-dd'`, `'0.0%'`).
   * 해당 컬럼 데이터 셀에 `.z` 로 적용되어 셀이 Excel 안에서 numeric·정렬가능하게 유지된다.
   * @default undefined (서식 미적용)
   */
  columnFormats?: Record<string, string>;
  /**
   * 컬럼별 폭 (MOD-GRID-25 G-1) — key = 컬럼 id, value = xlsx `wch` 단위 폭.
   * 지정된 컬럼만 `!cols` 에 반영(미지정은 기본 폭).
   * @default undefined
   */
  columnWidths?: Record<string, number>;
}

/**
 * 다중 시트 Excel export 의 시트 1개 정의 (MOD-GRID-25 G-2)
 *
 * @see exportSheetsToExcel
 */
export interface ExcelSheet {
  /** 시트명 (Excel 탭에 표시) */
  name: string;
  /**
   * TanStack v8 Table 인스턴스 — 시트 내용 소스.
   *
   * 다중 시트는 본질적으로 **서로 다른 행 타입의 테이블을 한 배열에 섞으므로**(`Table<Person>` +
   * `Table<Order>`), 단일 `TData` 로 묶을 수 없다. `Table<TData>` 는 `accessorFn` 의 함수
   * 인자 반공변성 때문에 `Table<unknown>` 에 대입 불가(`Table<Person>` ↛ `Table<unknown>`).
   * 이질 배열을 받으려면 `Table<any>` 가 유일한 실용 해법(TS 는 존재 타입 미지원).
   * export 코드는 `getValue()` 결과를 `unknown` 으로만 다뤄 타입 안전을 유지한다.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: import('@tanstack/react-table').Table<any>;
  /**
   * export 대상 행 범위
   * @default 'filtered'
   */
  scope?: ExportScope;
  /** 컬럼별 네이티브 number-format (ExcelExportOptions.columnFormats 와 동일) */
  columnFormats?: Record<string, string>;
  /** 컬럼별 폭 (ExcelExportOptions.columnWidths 와 동일) */
  columnWidths?: Record<string, number>;
}

/**
 * `exportSheetsToExcel` 옵션 (MOD-GRID-25 G-2)
 */
export interface MultiSheetOptions {
  /**
   * 다운로드 파일명 (확장자 없으면 .xlsx 자동 추가)
   * @default 'export.xlsx'
   */
  fileName?: string;
}

/**
 * DataTable buttonInfo 호환 alias 옵션 (legacy)
 *
 * @deprecated downloadExcel() 과 함께 사용. 신규 코드는 ExcelExportOptions + exportToExcel() 사용 권장.
 */
export interface DownloadExcelOptions
  extends Omit<ExcelExportOptions, 'scope'> {
  scope?: ExportScope;
}

// ── G-002: CSV export 옵션 ─────────────────────────────────────────────────

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
  emptyBehavior?: EmptyBehavior;
}

// ── G-003: PDF export 옵션 ─────────────────────────────────────────────────
// ExportScope는 상위 정의 재사용 (재정의 금지 — D5)

/**
 * PDF export 옵션
 *
 * @remarks
 * `fontFamily: 'korean'` 옵션은 stub 상태입니다 (spec Section 11 W1).
 * 실 사용 전 loadKoreanFont.ts V1 구현 완료 필요.
 *
 * @example
 * exportToPdf(table, { fileName: '보고서.pdf', orientation: 'l' });
 * exportToPdf(table, { scope: 'selected', fontFamily: 'korean', title: '선택 데이터' });
 */
export interface PDFExportOptions {
  /**
   * 다운로드 파일명 (확장자 포함 권장, 없으면 .pdf 자동 추가)
   * @default 'export.pdf'
   */
  fileName?: string;
  /**
   * PDF 최상단에 표시할 문서 제목 행 (없으면 생략)
   * @default undefined
   */
  title?: string;
  /**
   * export 대상 행 범위
   * - 'all': getCoreRowModel (필터 무시, 전체)
   * - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default
   * - 'selected': table.getSelectedRowModel (선택 행만)
   * @default 'filtered'
   */
  scope?: ExportScope;
  /**
   * 데이터 행 0건 시 동작
   * - 'skip': 파일 생성 안 함 (기본)
   * - 'empty': 헤더만 있는 빈 파일 생성
   * @default 'skip'
   */
  emptyBehavior?: EmptyBehavior;
  /**
   * PDF 페이지 방향
   * - 'p': portrait (세로, 기본)
   * - 'l': landscape (가로)
   * @default 'p'
   */
  orientation?: 'p' | 'l';
  /**
   * 폰트 패밀리
   * - 'default': jspdf 내장 Helvetica (라틴 문자 지원)
   * - 'korean': NotoSansKR dynamic import (loadKoreanFont.ts — W1 참조)
   * @default 'default'
   */
  fontFamily?: 'default' | 'korean';
}

// ── G-004: 클립보드 복사 옵션 ──────────────────────────────────────────────

/**
 * 클립보드 복사 옵션
 *
 * @example
 * copyToClipboard(table, { scope: 'selected' });
 * copyToClipboard(table, { scope: 'all', emptyBehavior: 'empty' });
 */
export interface ClipboardOptions {
  /**
   * export 대상 행 범위
   * - 'all': getCoreRowModel (필터 무시, 전체)
   * - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default
   * - 'selected': table.getSelectedRowModel (선택 행만)
   * @default 'filtered'
   */
  scope?: ExportScope;
  /**
   * 데이터 행 0건 시 동작
   * - 'skip': 복사 안 함 (기본)
   * - 'empty': 헤더만 있는 TSV 클립보드 복사
   * @default 'skip'
   */
  emptyBehavior?: EmptyBehavior;
  /**
   * 헤더 행 포함 여부 (MOD-GRID-25 G-3)
   * - `true`: 첫 줄에 헤더 행 포함 (기본 — 기존 동작)
   * - `false`: 데이터 행만 복사 (다른 영역에 붙여넣어 헤더 중복 방지)
   * @default true
   */
  includeHeader?: boolean;
}

// ── ADR-005: Row-array export 타입 ────────────────────────────────────────

/**
 * 행 배열 기반 Excel export 의 컬럼 정의
 *
 * @see exportRowsToExcel
 */
export interface ExcelColumn {
  /** 행 객체의 키 */
  key: string;
  /** 헤더 셀에 표시할 텍스트 */
  header: string;
  /** 컬럼 너비 (wch 단위). 기본값 15 */
  width?: number;
  /** 셀 값 포맷 */
  format?: 'date' | 'datetime' | 'number' | 'currency';
}

/**
 * `exportRowsToExcel` 옵션
 *
 * `scope` 는 행 배열 입력에서 무의미하므로 의도적으로 제외.
 */
export interface ExportRowsOptions {
  /**
   * 다운로드 파일명 (확장자 포함 권장, 없으면 .xlsx 자동 추가)
   * @default 'export.xlsx'
   */
  fileName?: string;
  /**
   * Excel 시트명
   * @default 'Sheet1'
   */
  sheetName?: string;
  /**
   * 데이터 행 0건 시 동작
   * - 'skip': 파일 생성 안 함 (기본)
   * - 'empty': 헤더만 있는 빈 파일 생성
   * @default 'skip'
   */
  emptyBehavior?: EmptyBehavior;
}

// ── G-004: 인쇄 옵션 ───────────────────────────────────────────────────────

/**
 * 인쇄 옵션
 *
 * @example
 * printGrid(table, { title: '월간 보고서', orientation: 'l' });
 * printGrid(table, { scope: 'selected', title: '선택 데이터' });
 */
export interface PrintOptions {
  /**
   * 인쇄 페이지 최상단에 표시할 제목 (없으면 생략)
   * @default undefined
   */
  title?: string;
  /**
   * export 대상 행 범위
   * - 'all': getCoreRowModel (필터 무시, 전체)
   * - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default
   * - 'selected': table.getSelectedRowModel (선택 행만)
   * @default 'filtered'
   */
  scope?: ExportScope;
  /**
   * 페이지 방향 (CSS @page 규칙으로 팝업 HTML에 삽입)
   * - 'p': portrait (세로, 기본)
   * - 'l': landscape (가로)
   * @default 'p'
   */
  orientation?: 'p' | 'l';
  /**
   * 데이터 행 0건 시 동작
   * - 'skip': 인쇄 창 열지 않음 (기본)
   * - 'empty': 헤더만 있는 표 인쇄
   * @default 'skip'
   */
  emptyBehavior?: EmptyBehavior;
}
