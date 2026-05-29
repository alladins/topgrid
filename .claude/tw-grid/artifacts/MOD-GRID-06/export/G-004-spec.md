# MOD-GRID-06 / export / G-004 — Specification

**Goal ID**: MOD-GRID-06/export/G-004  
**Title**: 클립보드 복사 + 인쇄 — copyToClipboard / printGrid  
**Priority**: P1  
**migrationImpact**: medium  
**packageTarget**: `packages/grid-export` (monorepo: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/`)  
**licenseTier**: MIT  
**Spec 작성일**: 2026-05-14  
**specVersion**: 1.0  
**rubricVersion**: 1.0.6  
**dependsOn**: `MOD-GRID-06/G-001`, `MOD-GRID-06/G-002`

---

## ★ 사전 결정 (D#)

| # | 결정 | 사유 |
|---|------|------|
| D1 | `getRowsByScope<TData>` 헬퍼는 G-002 구현 시 `internal/getRowsByScope.ts`로 추출됨 → **G-004에서 그대로 import 재사용** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/internal/getRowsByScope.ts` 직접 Read 완료 (2026-05-14). scope 로직 4번째 복사 금지 |
| D2 | `ClipboardOptions`, `PrintOptions` interface를 `types.ts` MODIFY로 추가. `ExportScope` + `emptyBehavior` 타입은 기존 정의 그대로 재사용 (중복 정의 금지) | `types.ts` 직접 Read 완료: `ExportScope` ('all'\|'filtered'\|'selected'), `emptyBehavior?: 'skip'\|'empty'` 이미 존재 (G-001/G-002/G-003 공유 single source-of-truth) |
| D3 | `copyToClipboard`는 **`async function`** (반환 `Promise<void>`) | `navigator.clipboard.writeText()` 가 Promise 반환 — await 없이 사용 불가. `void` 반환은 타입 오류 발생 |
| D4 | `printGrid`는 **`function`** (반환 `void`, synchronous) | `window.open` + `document.write` + `window.onload` callback 패턴. 함수 자체는 동기지만 print 발화는 `popup.onload` 내에서 비동기 실행. `async` 불필요 (Promise 반환 필요 없음) |
| D5 | TSV 이스케이프: 셀 값 내 탭(`\t`) → `\t` 없는 표현으로 교체(**공백 치환**). 개행(`\n`, `\r`) → 공백 치환. TSV는 RFC 표준 quoting 없음 — 이스케이프 불가 문자는 공백으로 대체 | CSV `escapeCsvValue` 패턴(G-002 exportToCSV.ts L13-21)은 TSV에 적용 불가 (탭이 delimiter이므로 탭 포함 값을 따옴표로 감싸도 클립보드 붙여넣기 Excel이 따옴표를 문자 취급). 단순 치환이 Excel 호환성 최우선 전략 |
| D6 | `navigator.clipboard` 미지원 환경 (non-HTTPS 또는 구형 브라우저) fallback: `document.execCommand('copy')` 시도 후 실패 시 `Error('Clipboard API not supported')` throw | 완전 무음 실패 금지 (C-1). fallback 존재 이유: HTTP 개발 환경에서도 동작 가능하게 (EC-04) |
| D7 | `printGrid`에서 popup 차단(`window.open` null 반환) 시: `console.warn` 후 함수 즉시 return. throw 하지 않음 | void 함수에서 throw는 caller가 try/catch 의무가 되어 사용성 저하. warn으로 개발자에게 알림 충분 (EC-05). 사용자는 팝업 차단 해제 후 재시도 가능 |
| D8 | 외부 dependency **추가 없음** → ADR 불필요 (C-9/C-20 N/A) | Web API 전용 구현: `navigator.clipboard`, `document.execCommand`, `window.open`, `window.print`. `decisions/MOD-GRID-06-decisions.md` 수정 없음 (신규 ADR 항목 없음) |
| D9 | Storybook story: `copyToClipboard.stories.tsx` **1개 파일** (printGrid 시나리오 포함). "story 1개" = AC-006 충족 | 두 함수 분리 story 파일은 과도한 분리. 하나의 story 파일에 각 함수 시나리오를 별도 Story export로 정의 |
| D10 | 구현 대상 파일: **NEW 2개** (`copyToClipboard.ts`, `printGrid.ts`) + **NEW 1개** (`copyToClipboard.stories.tsx`) + **MODIFY 2개** (`types.ts`, `index.ts`) = **총 5파일** | D1~D9 + AC-006(Storybook) 결과. `decisions/MOD-GRID-06-decisions.md` 수정 없음(D8). `internal/getRowsByScope.ts` 수정 없음(D1) |
| D11 | goals.json `implementFiles` 경로 prefix 정합성 (C-28): goals.json에 `TOMIS/packages/` prefix 가 있을 경우 본 spec의 Section 7 final 표를 권위적 정의로 삼는다 → 모든 경로는 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/...` prefix 사용 | C-28 — monorepo 패키지는 외부 monorepo에 위치. `D:/project/topvel_project/topvel-grid-monorepo/` 조부모 실재 확인됨 (G-001~G-003 spec 선례) |

---

## Section 1: 참조 추적

### L0 (현 구현): 기존 clipboard / print 코드 없음

파일 확인: `D:/project/topvel_project/TOMIS/tw-framework-front/src/` — `copyToClipboard*` / `printGrid*` 없음.  
Grep 결과: `navigator.clipboard` tw-framework-front에서 **검색 결과 0** (2026-05-14 확인).  
**L0 결론**: 현재 구현에 clipboard/print export 코드 없음. 신규 구현. ("현 구현 없음" — A-01 N/A 조건 충족)

### L1 (TanStack v8 API)

출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md`

**Row Model 인스턴스 메서드** (tanstack-api-inventory.md §2.3):
```ts
table.getCoreRowModel().rows        // scope='all'
table.getFilteredRowModel().rows    // scope='filtered' (default)
table.getSelectedRowModel().rows    // scope='selected'
```

**Row + Cell 접근** (tanstack-api-inventory.md §2.1 core/row.d.ts):
```ts
row.getVisibleCells(): Cell<TData, unknown>[]
cell.getValue(): unknown
```

**Header 접근** (tanstack-api-inventory.md §2.1 core/headers.d.ts):
```ts
table.getLeafHeaders(): Header<TData, unknown>[]  // 리프 헤더 (단일행 기반)
header.column.id: string
header.column.columnDef.header: ColumnDef['header']  // string | function | undefined
```

**의존 Goal 구현 확인** (dependsOn 검증):
- `MOD-GRID-06/G-001`: `exportToExcel.ts` 존재 확인 (index.ts L4 export 확인)
- `MOD-GRID-06/G-002`: `internal/getRowsByScope.ts` 직접 Read 완료 — `getRowsByScope<TData>(table, scope): Row<TData>[]` 시그니처 확인

### L2 (현재 src/ 상태 직접 확인)

**`types.ts`** (직접 Read 완료 — 2026-05-14):
- `ExportScope`: `'all' | 'filtered' | 'selected'` → **G-004에서 재사용 (재정의 금지)**
- `emptyBehavior?: 'skip' | 'empty'` — `ExcelExportOptions`, `CSVExportOptions`, `PDFExportOptions` 공유 패턴
- `ClipboardOptions`, `PrintOptions`: **미정의** → G-004 MODIFY 추가 필요

**`index.ts`** (직접 Read 완료):
```typescript
export { exportToExcel } from './exportToExcel';
export { exportToCSV } from './exportToCSV';
export { exportToPdf } from './exportToPdf';
export type { ExcelExportOptions, ExportScope, DownloadExcelOptions, CSVExportOptions, PDFExportOptions } from './types';
```
→ `copyToClipboard`, `printGrid`, `ClipboardOptions`, `PrintOptions` **미 export** → G-004 MODIFY 추가 필요

**`internal/getRowsByScope.ts`** (직접 Read 완료):
```typescript
export function getRowsByScope<TData>(table: Table<TData>, scope: ExportScope): Row<TData>[]
```
→ `'all'` → `getCoreRowModel()`, `'selected'` → `getSelectedRowModel()`, `'filtered'` → `getFilteredRowModel()`

**`exportToCSV.ts`** (직접 Read 완료 — TSV 이스케이프 패턴 참조):
- `escapeCsvValue(value, delimiter)`: 구분자/따옴표/개행 포함 시 따옴표 래핑 (RFC 4180)
- TSV는 delimiter=`'\t'` 변형이나 **클립보드 붙여넣기 목적으로는 CSV escape 미사용** (D5 결정)

### L3 (영향 사용처): 0개

`copyToClipboard` / `printGrid`는 신규 export — 기존 사용처 없음.  
`types.ts` + `index.ts` MODIFY는 기존 export에 추가만 (breaking change 없음).

### R-A (AG Grid Community Clipboard)

출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-aggrid-analysis.md` §2

AG Grid Community에는 Ctrl+C를 통한 자동 클립보드 복사 기능이 존재.  
**우리 접근법과 역할 분리**: AG Grid는 키보드 이벤트 기반 자동 복사, 우리는 **명시적 함수 호출** — `copyToClipboard(table, options)`.  
AG Grid 코드 차용 금지 (C-7).

### R-W (Wijmo): N/A

`publish-wijmo-analysis.md` 범위 외 — clipboard/print 동등 기능 분석 미수행.  
R-A AG Grid Community만 참조 (코드 차용 금지, C-7/C-16).

---

## Section 2: API 계약

### 2.1 신규 타입 (types.ts MODIFY)

```typescript
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
  emptyBehavior?: 'skip' | 'empty';
}

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
  emptyBehavior?: 'skip' | 'empty';
}
```

### 2.2 신규 함수 시그니처

```typescript
/**
 * TanStack Table 데이터를 TSV 포맷으로 클립보드에 복사한다.
 * TSV(탭 구분, 줄바꿈 행 구분) — Excel 붙여넣기 호환.
 *
 * navigator.clipboard 미지원 환경: document.execCommand('copy') fallback 시도.
 * fallback도 실패 시 Error('Clipboard API not supported') throw.
 *
 * @param table  TanStack v8 Table<TData> 인스턴스 (useReactTable 반환값)
 * @param options 클립보드 복사 옵션 (scope, emptyBehavior)
 * @returns Promise<void> — navigator.clipboard.writeText는 async
 *
 * @example
 * await copyToClipboard(table);
 *
 * @example
 * await copyToClipboard(table, { scope: 'selected' });
 */
export async function copyToClipboard<TData>(
  table: Table<TData>,
  options?: ClipboardOptions,
): Promise<void>

/**
 * TanStack Table 데이터를 새 팝업 창에 HTML 테이블로 렌더링하여 인쇄 대화상자를 연다.
 * 순수 Web API 전용 (window.open + document.write + window.print).
 *
 * 팝업 차단 환경: console.warn 후 즉시 반환.
 * printGrid 자체는 동기 반환 (void). 실제 print 발화는 popup.onload 내에서 비동기 실행.
 *
 * @param table  TanStack v8 Table<TData> 인스턴스 (useReactTable 반환값)
 * @param options 인쇄 옵션 (title, scope, orientation, emptyBehavior)
 * @returns void
 *
 * @example
 * printGrid(table);
 *
 * @example
 * printGrid(table, { title: '계약 목록', scope: 'filtered', orientation: 'l' });
 */
export function printGrid<TData>(
  table: Table<TData>,
  options?: PrintOptions,
): void
```

### 2.3 기본값 요약

| 옵션 필드 | 기본값 | 타입 |
|---------|--------|------|
| `ClipboardOptions.scope` | `'filtered'` | ExportScope |
| `ClipboardOptions.emptyBehavior` | `'skip'` | 'skip'\|'empty' |
| `PrintOptions.title` | `undefined` | string\|undefined |
| `PrintOptions.scope` | `'filtered'` | ExportScope |
| `PrintOptions.orientation` | `'p'` | 'p'\|'l' |
| `PrintOptions.emptyBehavior` | `'skip'` | 'skip'\|'empty' |

---

## Section 3: 기존 사용처 대응표

**N/A** — 신규 export. 기존 clipboard/print 사용처 0개 (L3: 0). 대응 마이그레이션 불필요.

---

## Section 4: 호환성 정책

- **Breaking change**: No — `types.ts` + `index.ts`에 신규 export 추가만 (기존 export 변경 없음)
- **Deprecation**: N/A — Breaking change 없음
- **peerDeps 추가**: 없음 (D8 — 외부 dep 0)
- **semver**: 신규 export 추가 → minor version bump 적합 (`0.x.y+1` 또는 `0.(x+1).0`)

---

## Section 5: 인수 기준

| ID | 기준 | 검증 방법 | 출처 태그 |
|----|------|---------|---------|
| AC-001 | `copyToClipboard<TData>(table, options?: ClipboardOptions): Promise<void>` — 시그니처 정확, `no any` | tsc 0 errors + Grep `any` on copyToClipboard.ts | C-4, L1 |
| AC-002 | TSV 포맷 (탭 구분, 줄바꿈 행 구분) — Excel paste 호환. 셀 내 탭/개행은 공백으로 치환 (D5) | 단위 테스트: scope 3종 × TSV 구조 검증 | L1, D5 |
| AC-003 | `printGrid<TData>(table, options?: PrintOptions): void` — 시그니처 정확, `no any` | tsc 0 errors + Grep `any` on printGrid.ts | C-4, L1 |
| AC-004 | `options.scope: 'all'|'filtered'|'selected'` — 두 함수 모두 `ExportScope` 재사용, scope별 행 필터 정확 | 단위 테스트: scope='selected' 시 getSelectedRowModel().rows 반환 확인 | C-2, L2 |
| AC-005 | `tsc --noEmit` 0 errors (copyToClipboard.ts + printGrid.ts + types.ts + index.ts) | CI: `npx tsc --noEmit` | C-12 |
| AC-006 | Storybook story 1개 (`copyToClipboard.stories.tsx`) — copyToClipboard + printGrid 시나리오 포함 | `copyToClipboard.stories.tsx` 파일 존재 확인 + Storybook 빌드 통과 | C-25 |

---

## Section 6: 엣지 케이스

| # | 케이스 | 예상 동작 |
|---|--------|---------|
| EC-01 | 셀 값에 탭(`\t`) 포함 | D5: 탭 → 공백(' ') 치환. TSV 구조 깨짐 방지. `'a\tb'` → `'a b'` |
| EC-02 | 셀 값에 개행(`\n`, `\r`, `\r\n`) 포함 | D5: 개행 → 공백(' ') 치환. Excel 행 분리 방지. `'hello\nworld'` → `'hello world'` |
| EC-03 | 데이터 행 0건 + `emptyBehavior: 'skip'` | `copyToClipboard`: 클립보드 미쓰기 + `console.warn`. `printGrid`: 팝업 미열기 + `console.warn` |
| EC-04 | `navigator.clipboard` 미지원 환경 (HTTP 또는 구형 브라우저) | D6: `document.execCommand('copy')` fallback 시도. fallback도 실패 시 `Error('Clipboard API not supported')` throw |
| EC-05 | `window.open` null 반환 (팝업 차단) | D7: `console.warn('[grid-export] printGrid: 팝업이 차단되었습니다. 브라우저 설정에서 허용 후 재시도하세요.')` + 즉시 반환 |
| EC-06 | `printGrid`의 팝업 창 `onload` 발화 타이밍 | `popup.onload` 를 `document.write` **이전**에 등록해야 함. write 이후 등록 시 Firefox/Safari에서 이미 발화된 이벤트를 놓쳐 print가 실행되지 않을 수 있음. Step 3 코드 참조. |
| EC-07 | 셀 값 `null` / `undefined` | `String(value)` 변환 전 null/undefined → 빈 문자열 처리 (G-002 exportToCSV.ts L82 패턴 동일 적용) |

---

## Section 7: 구현 대상 파일

### 최종 implementFiles 표

| # | 경로 | 액션 | 변경 범위 |
|---|------|------|---------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/copyToClipboard.ts` | **NEW** | TSV 빌드 + navigator.clipboard + execCommand fallback (약 60~80줄) |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/printGrid.ts` | **NEW** | HTML table 생성 + window.open + onload print (약 60~80줄) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/copyToClipboard.stories.tsx` | **NEW** | Storybook story — copyToClipboard + printGrid 시나리오 (AC-006) |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/types.ts` | **MODIFY** | `ClipboardOptions`, `PrintOptions` interface 추가 (D2) |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/index.ts` | **MODIFY** | `copyToClipboard`, `printGrid`, `ClipboardOptions`, `PrintOptions` re-export 추가 |

**총 5파일 (NEW 3 + MODIFY 2)** — D10 사전 결정과 일치.  
`decisions/MOD-GRID-06-decisions.md` 수정 없음 (D8: 외부 dep 0 → ADR 불필요).  
`internal/getRowsByScope.ts` 수정 없음 (D1: 재사용만).

---

## Section 8: Preflight

### 8.1 영향 사용처

사용처 **0개** — 신규 export. 기존 코드 변경 없음 (L3: 0).

### 8.2 무파괴 검증

- tsc 0 errors (AC-005)
- G-001(Excel) + G-002(CSV) + G-003(PDF) export 함수 회귀 0
- `index.ts` 기존 export 유지 확인 (MODIFY 후 기존 4 export + type 5종 미손상)

### 8.3 점진 계획

N/A — 사용처 0개. 기존 API 변경 없음.

### 8.4 롤백 전략

신규 3개 파일 제거 + `types.ts`에서 `ClipboardOptions`/`PrintOptions` 제거 + `index.ts`에서 신규 re-export 제거. 기존 export 무영향.

### 8.5 번들 영향

- `grid-export` 패키지 번들 추가: **+2 KB 이내** (gzipped) — Web API 전용, 외부 dep 0
- `tw-framework-front`: 변화 없음 (navigator.clipboard, window.open은 브라우저 내장)
- C-21 한도(20 KB/패키지): 여유 충분 (G-001~G-003 기존 +5+3+3.5 KB 감안 후 총 ~14 KB 추산)

---

## Section 9: 의존성

### 9.1 peerDependencies (변경 없음)

| 패키지 | 현 선언 | 변경 |
|--------|---------|------|
| `@tanstack/react-table` | peerDep | 없음 |
| `react` | peerDep | 없음 |

### 9.2 신규 외부 라이브러리

**없음 (D8)** — 전 기능 Web API 전용:
- `copyToClipboard`: `navigator.clipboard.writeText` (Web API) + `document.execCommand` (fallback)
- `printGrid`: `window.open` + `document.write` + `window.print` (Web API)

ADR 불필요 (C-9/C-20 N/A).

---

## Section 10: 사용자 여정

### 10.1 개발자 여정 (copyToClipboard)

```typescript
import { copyToClipboard } from '@tomis/grid-export';

// 기본: filtered 행 TSV 복사
await copyToClipboard(table);

// 선택 행만
await copyToClipboard(table, { scope: 'selected' });
```

### 10.2 개발자 여정 (printGrid)

```typescript
import { printGrid } from '@tomis/grid-export';

// 기본: 인쇄 대화상자 열기
printGrid(table);

// 제목 + 가로 방향 + 선택 행
printGrid(table, { title: '계약 목록', orientation: 'l', scope: 'selected' });
```

### 10.3 최종 사용자 여정

1. 그리드 내 행 선택 후 "클립보드 복사" 버튼 클릭
   → `copyToClipboard(table, { scope: 'selected' })` 호출
   → Excel에 붙여넣기 → 탭/줄바꿈 구분 데이터 정확 삽입
2. "인쇄" 버튼 클릭
   → `printGrid(table)` 호출
   → 팝업 창에 HTML 테이블 렌더링 → 브라우저 인쇄 대화상자 표시

---

## Section 11: 구현 계획

### Step 1: types.ts MODIFY — ClipboardOptions, PrintOptions 추가

`types.ts` 현재 마지막 export (`PDFExportOptions`) 뒤에 두 interface 추가.  
`ExportScope` + `emptyBehavior` 기존 타입 재사용 (`export type { ExportScope }` 별도 수정 없음).

### Step 2: copyToClipboard.ts NEW

```typescript
// Before (파일 미존재)

// After (신규 구현):
import type { Table } from '@tanstack/react-table';
import type { ClipboardOptions } from './types';
import { getRowsByScope } from './internal/getRowsByScope';

// TSV 이스케이프: 탭/개행 → 공백 치환 (D5)
function escapeTsvValue(value: string): string {
  return value.replace(/[\t\r\n]/g, ' ');
}

export async function copyToClipboard<TData>(
  table: Table<TData>,
  options?: ClipboardOptions,
): Promise<void> {
  const { scope = 'filtered', emptyBehavior = 'skip' } = options ?? {};

  const rows = getRowsByScope(table, scope);
  if (rows.length === 0 && emptyBehavior === 'skip') {
    console.warn('[grid-export] copyToClipboard: 내보낼 데이터가 없습니다.');
    return;
  }

  const leafHeaders = table.getLeafHeaders();
  const headerRow = leafHeaders
    .map((h) => {
      const headerDef = h.column.columnDef.header;
      return escapeTsvValue(typeof headerDef === 'string' ? headerDef : h.column.id);
    })
    .join('\t');

  const dataRows = rows.map((row) =>
    row
      .getVisibleCells()
      .map((cell) => {
        const value = cell.getValue();
        const str = value !== null && value !== undefined ? String(value) : '';
        return escapeTsvValue(str);
      })
      .join('\t'),
  );

  const tsvString = [headerRow, ...dataRows].join('\n');

  // navigator.clipboard (HTTPS + 권한) 우선, execCommand fallback (D6)
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(tsvString);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = tsvString;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!success) {
      throw new Error('[grid-export] copyToClipboard: Clipboard API not supported');
    }
  }
}
```

### Step 3: printGrid.ts NEW

```typescript
// Before (파일 미존재)

// After (신규 구현):
import type { Table } from '@tanstack/react-table';
import type { PrintOptions } from './types';
import { getRowsByScope } from './internal/getRowsByScope';

export function printGrid<TData>(
  table: Table<TData>,
  options?: PrintOptions,
): void {
  const {
    title,
    scope = 'filtered',
    orientation = 'p',
    emptyBehavior = 'skip',
  } = options ?? {};

  const rows = getRowsByScope(table, scope);
  if (rows.length === 0 && emptyBehavior === 'skip') {
    console.warn('[grid-export] printGrid: 내보낼 데이터가 없습니다.');
    return;
  }

  const leafHeaders = table.getLeafHeaders();
  const headerHtml = leafHeaders
    .map((h) => {
      const headerDef = h.column.columnDef.header;
      const text = typeof headerDef === 'string' ? headerDef : h.column.id;
      return `<th>${text}</th>`;
    })
    .join('');

  const bodyHtml = rows
    .map((row) => {
      const cells = row
        .getVisibleCells()
        .map((cell) => {
          const value = cell.getValue();
          const str = value !== null && value !== undefined ? String(value) : '';
          return `<td>${str}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const orientationCss = orientation === 'l' ? 'landscape' : 'portrait';
  const titleHtml = title ? `<h2>${title}</h2>` : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { size: ${orientationCss}; }
  body { font-family: sans-serif; font-size: 12px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
  th { background: #f0f0f0; }
</style></head><body>
${titleHtml}
<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>
</body></html>`;

  const popup = window.open('', '_blank');
  if (!popup) {
    // EC-05: 팝업 차단 (D7 — void 함수이므로 throw 대신 warn)
    console.warn('[grid-export] printGrid: 팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용 후 재시도하세요.');
    return;
  }

  // EC-06: onload 등록을 document.write **이전**에 해야 함 (Firefox/Safari 호환)
  // about:blank의 load 이벤트는 document.write 시점에 이미 발화되므로
  // write 이후에 onload를 등록하면 핸들러가 실행되지 않을 수 있음.
  popup.onload = () => {
    popup.print();
    popup.close();
  };
  popup.document.write(html);
  popup.document.close();
}
```

> **⚠️ printGrid onload 타이밍 주의 (EC-06)**:  
> `popup.print()` 를 `document.write` 직후 즉시 호출하면 Firefox/Safari에서 DOM 미완성 상태로 빈 인쇄 발생 가능. 반드시 `popup.onload` 콜백 내에서 호출해야 함. `printGrid` 함수 자체는 동기 void 반환이지만 실제 인쇄는 비동기 이벤트 기반.

### Step 4: index.ts MODIFY

기존 4 export 보존 후 신규 2개 추가:

```typescript
// 기존 (보존)
export { exportToExcel } from './exportToExcel';
export { exportToCSV } from './exportToCSV';
export { exportToPdf } from './exportToPdf';
export type { ExcelExportOptions, ExportScope, DownloadExcelOptions, CSVExportOptions, PDFExportOptions } from './types';

// 신규 추가 (G-004)
export { copyToClipboard } from './copyToClipboard';
export { printGrid } from './printGrid';
export type { ClipboardOptions, PrintOptions } from './types';
```

### Step 5: copyToClipboard.stories.tsx NEW (AC-006)

```typescript
// Storybook story — copyToClipboard + printGrid 시나리오
import type { Meta, StoryObj } from '@storybook/react';
// ... mock table + button 호출 패턴
// Story 1: CopyFiltered — copyToClipboard(table, { scope: 'filtered' })
// Story 2: CopySelected — copyToClipboard(table, { scope: 'selected' })
// Story 3: PrintGrid — printGrid(table, { title: '테스트 인쇄', orientation: 'p' })
```

### Step 6: 위험 요소

| W# | 위험 | 영향 | 대응 |
|----|------|------|------|
| W1 | `navigator.clipboard` HTTP 환경 미지원 | EC-04 — 개발 서버(HTTP)에서 clipboard 동작 불가 | execCommand fallback (D6) |
| W2 | 팝업 차단 브라우저 정책 | EC-05 — printGrid 동작 불가 | console.warn + return (D7) |
| W3 | `popup.onload` 미발화 (about:blank 초기 로드 완료 후 document.write 시 onload 재발화 보장 없음) | EC-06 일부 브라우저 | **`popup.onload` 를 `document.write` 이전에 등록** (Step 3 코드 참조). write 이후 등록 시 Firefox/Safari에서 핸들러 미실행 위험. |

---

## Section 12: 검증 계획

### 12.1 단위 테스트 (vitest)

| 시나리오 | 대상 함수 | 검증 내용 |
|---------|---------|---------|
| scope='all' TSV 구조 | copyToClipboard | header + all rows 포함, 탭 구분, 줄바꿈 행 구분 |
| scope='selected' TSV | copyToClipboard | getSelectedRowModel rows만 포함 |
| TSV 탭 이스케이프 | copyToClipboard | `'a\tb'` → `'a b'` (공백 치환) |
| TSV 개행 이스케이프 | copyToClipboard | `'hello\nworld'` → `'hello world'` |
| emptyBehavior='skip' | copyToClipboard | rows 0건 시 clipboard 미쓰기 + console.warn |
| 한국어 셀 값 | copyToClipboard | UTF-16 문자열 정상 전달 |
| printGrid scope='filtered' | printGrid | popup.document.write 호출 확인 |
| popup=null (팝업 차단) | printGrid | console.warn + return (throw 없음) |

### 12.2 tsc 검증 (AC-005)

```powershell
cd D:\project\topvel_project\topvel-grid-monorepo
npx tsc --noEmit
```
0 errors 필수.

### 12.3 Storybook 검증 (AC-006)

`copyToClipboard.stories.tsx` — 3개 Story 빌드 통과 확인.

---

## Section 13: 상용 제품화 영향

### 13.1 패키지 분류

`packages/grid-export` — **MIT (Open)** 패키지.  
라이선스 검증 호출 (`configureGridLicense()`) **불필요** (F-02: N/A).

### 13.2 신규 ADR

**없음 (D8)** — 외부 dep 0 추가. C-9/C-20 N/A.  
`decisions/MOD-GRID-06-decisions.md` 수정 없음 (ADR-001 Excel + ADR-002 PDF 기존 유지).

### 13.3 문서 계획

- **Docusaurus 페이지**: `docs/api/grid-export/clipboard-print.mdx` — `copyToClipboard` + `printGrid` API reference + 사용 예시 (C-25)
- **Storybook story**: `copyToClipboard.stories.tsx` (AC-006) — Section 7 #3 NEW
- **README.md**: `packages/grid-export/README.md`에 G-004 섹션 추가

### 13.4 peerDependencies 정책 (C-22)

변경 없음 — `@tanstack/react-table`, `react` 기존 peer 유지. 신규 peer 없음 (D8/D9).

### 13.5 semver

minor bump 적합 (`0.x.y+1`) — 신규 export 추가, breaking change 없음 (Section 4).
