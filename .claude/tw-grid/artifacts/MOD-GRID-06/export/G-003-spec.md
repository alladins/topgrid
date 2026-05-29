# MOD-GRID-06 / export / G-003 — Specification

**Goal ID**: MOD-GRID-06/export/G-003  
**Title**: PDF export — exportToPdf(table, options) via jspdf + jspdf-autotable optional peers  
**Priority**: P1  
**migrationImpact**: medium  
**packageTarget**: `packages/grid-export` (monorepo: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/`)  
**licenseTier**: MIT  
**Spec 작성일**: 2026-05-14  
**specVersion**: 1.0  
**rubricVersion**: 1.0.6  
**dependsOn**: `MOD-GRID-01/G-001`, `MOD-GRID-02/G-001`

---

## ★ 사전 결정 (D#)

| # | 결정 | 사유 |
|---|------|------|
| D1 | `getRowsByScope<TData>` 헬퍼는 G-002 구현 시 `internal/getRowsByScope.ts`로 이미 추출됨 → **G-003에서 그대로 import 재사용** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/internal/getRowsByScope.ts` 직접 Read 완료(2026-05-14). 동일 scope 로직 3번째 복사 금지 |
| D2 | `jspdf` + `jspdf-autotable`은 **optional peerDependency**로 선언 — `package.json` 수정 불필요 | `packages/grid-export/package.json` 직접 확인: `"jspdf": "^2.5.0"` + `"jspdf-autotable": "^3.5.0"` 이미 peerDependencies 등록, peerDependenciesMeta `optional: true` 확인. G-003은 package.json **수정 없음** |
| D3 | `exportToPdf`는 **`async function`** (반환 `Promise<void>`) | jspdf 동적 import(`await import('jspdf')`) 필수 — 초기 번들 영향 0. 동적 import는 await 없이 사용 불가 → void 아닌 Promise<void> |
| D4 | 한국어 폰트: `internal/loadKoreanFont.ts` **stub 파일 신설** — 실제 폰트 base64 데이터는 구현 리스크(W1)로 분리. 기본 동작은 `fontFamily: 'default'`(jspdf 내장 Helvetica) | 폰트 base64 임베딩은 ~2 MB 이상 번들 증가 위험. 실 사용 전 폰트 라이선스 + 번들 전략 별도 확인 필요(W1) |
| D5 | `PDFExportOptions` interface를 `types.ts` MODIFY로 추가. `ExportScope` + `emptyBehavior` 타입은 기존 정의 그대로 재사용 (중복 정의 금지) | `types.ts` 직접 Read 완료: `ExportScope`, `emptyBehavior?: 'skip' \| 'empty'` 이미 존재 (G-001/G-002 공유 single source-of-truth) |
| D6 | 구현 대상 파일: **NEW 3개** (`exportToPdf.ts`, `internal/loadKoreanFont.ts`, `exportToPdf.stories.tsx`) + **MODIFY 3개** (`types.ts`, `index.ts`, `decisions/MOD-GRID-06-decisions.md`) = **총 6파일** | D1~D5 + AC-007(Storybook) + C-20(ADR 의무) 결과. package.json MODIFY 없음(D2) |
| D7 | 다중행 헤더(GroupColumnDef) 지원: `table.getHeaderGroups()`로 모든 헤더 레이어 순회 — `header.isPlaceholder` 셀은 empty string, `header.colSpan`으로 colspan 반영 | `tanstack-api-inventory.md §2.1 core/headers.d.ts` + jspdf-autotable `head` 배열 구조. AC-005 충족 |
| D8 | `options.scope` 기본값 `'filtered'` — G-001/G-002 동일 패턴 유지 | C-6 일관성. `ExportScope` 공유 타입 재사용 |

---

## Section 1: 참조 추적

### L0 (현 구현): 기존 PDF export 코드 없음

파일 확인: `D:/project/topvel_project/TOMIS/tw-framework-front/src/` — `exportToPdf*` / `jspdf*` 없음.  
Grep 결과: `jspdf`는 tw-framework-front에서 **검색 결과 0** (2026-05-14 확인).  
**L0 결론**: 현재 구현에 PDF export 코드 없음. 신규 구현. ("현 구현 없음" — A-01 N/A 조건 충족)

### L1 (TanStack v8 API)

출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md`

**Row Model 인스턴스 메서드** (tanstack-api-inventory.md §2.3 + §3 Table.core):
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
table.getHeaderGroups(): HeaderGroup<TData>[]    // 다중행 헤더 전체
table.getLeafHeaders(): Header<TData, unknown>[] // 최하위 리프 헤더
header.isPlaceholder: boolean   // span 채움 셀 — empty string 처리
header.colSpan: number          // colspan 값
header.column.id: string
header.column.columnDef.header: ColumnDef['header']  // string | function | undefined
```

**의존 Goal 구현 확인** (dependsOn 검증):
- `MOD-GRID-01/G-001`: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/exportToExcel.ts` 존재 확인
- `MOD-GRID-02/G-001` (= G-002): `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/internal/getRowsByScope.ts` 존재 확인

### L2 (현재 src/ 상태 직접 확인)

**`types.ts`** (직접 Read 완료):
- `ExportScope`: `'all' | 'filtered' | 'selected'` → **G-003에서 재사용 (재정의 금지)**
- `ExcelExportOptions`: `emptyBehavior?: 'skip' | 'empty'` 존재
- `CSVExportOptions`: G-002에서 추가 완료
- `PDFExportOptions`: **미정의** → G-003 MODIFY 추가 필요

**`index.ts`** (직접 Read 완료):
```typescript
export { exportToExcel } from './exportToExcel';
export { exportToCSV } from './exportToCSV';
export type { ExcelExportOptions, ExportScope, DownloadExcelOptions, CSVExportOptions } from './types';
```
G-003: `exportToPdf` + `PDFExportOptions` re-export 추가 필요.

**`internal/getRowsByScope.ts`** (직접 Read 완료):
```typescript
export function getRowsByScope<TData>(
  table: Table<TData>,
  scope: ExportScope,
): Row<TData>[]
```
→ G-003에서 import 재사용. 수정 불필요.

**`package.json`** (G-002-spec.md §4 확인 + 사전 분석):
```json
"peerDependencies": {
  "jspdf": "^2.5.0",
  "jspdf-autotable": "^3.5.0"
},
"peerDependenciesMeta": {
  "jspdf": { "optional": true },
  "jspdf-autotable": { "optional": true }
}
```
→ **수정 불필요** (D2). G-003 이전에 이미 선언됨.

### L3 (영향 사용처)

**영향 사용처: 0개** — `exportToPdf`는 신규 API. tw-framework-front에 jspdf 미사용(L0). G-005에서 통합 시나리오 테스트.

### R-W (Wijmo)

출처: `publish-wijmo-analysis.md §4` + `§6`:
```
Wijmo FlexGridPdfConverter — @mescius/wijmo.grid.pdf
  FlexGridPdfConverter.draw(grid, doc)
  내부적으로 kjua/pdfkit 래핑, 한국어 폰트 별도 로드
```
- **코드 차용 절대 금지 (C-16)** — 패턴 참고만
- `feature-gap-matrix.md §2 L120`: `grid-export (xlsx + jspdf peer) ~12 KB` 확인

### R-A (AG Grid)

출처: `publish-aggrid-analysis.md §8` + `feature-gap-matrix.md §2`:
```
AG Grid Community: CSV export 지원
AG Grid Enterprise: Excel export 추가
PDF: AG Grid Community/Enterprise 모두 미지원 (native 없음)
```
→ PDF 구현 참고 대안 없음 — jspdf-autotable 독립 구현.

---

## Section 2: API 계약

### 2.1 타입 정의 (`packages/grid-export/src/types.ts` MODIFY — 추가 부분)

```typescript
// ── G-003: PDF export 옵션 ────────────────────────────────────────────────────
// ExportScope는 L1-2 기존 정의 재사용 (재정의 금지 — D5)

/**
 * PDF export 옵션
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
  emptyBehavior?: 'skip' | 'empty';
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
```

**추가 위치**: `types.ts` 파일 끝 (`CSVExportOptions` 블록 다음)  
**재사용**: `ExportScope`는 L1-2 기존 정의 그대로 참조 (재정의 금지 — D5)

### 2.2 함수 시그니처 (`packages/grid-export/src/exportToPdf.ts` NEW)

```typescript
import type { Table } from '@tanstack/react-table';
import type { PDFExportOptions } from './types';

/**
 * TanStack Table 인스턴스를 기반으로 PDF 파일을 생성·다운로드한다.
 * jspdf + jspdf-autotable을 optional peer로 dynamic import하여 사용.
 *
 * @param table - TanStack v8 Table<TData> 인스턴스 (useReactTable 반환값)
 * @param options - PDF export 옵션 (fileName, title, scope, orientation, fontFamily, emptyBehavior)
 * @returns Promise<void> — jspdf dynamic import 후 완료
 * @throws Error jspdf 또는 jspdf-autotable이 설치되지 않은 경우
 *
 * @example
 * await exportToPdf(table, { fileName: '보고서.pdf' });
 */
export async function exportToPdf<TData>(
  table: Table<TData>,
  options?: PDFExportOptions,
): Promise<void>;
```

### 2.3 구현 스케치 (`exportToPdf.ts` 내부 로직 — 구현자 가이드)

```typescript
// exportToPdf.ts 구현 스케치 (Implementer 참고)
import type { Table } from '@tanstack/react-table';
import { getRowsByScope } from './internal/getRowsByScope';
import type { PDFExportOptions } from './types';

export async function exportToPdf<TData>(
  table: Table<TData>,
  options?: PDFExportOptions,
): Promise<void> {
  const {
    fileName = 'export.pdf',
    title,
    scope = 'filtered',
    emptyBehavior = 'skip',
    orientation = 'p',
    fontFamily = 'default',
  } = options ?? {};

  // 1. jspdf + jspdf-autotable dynamic import (optional peer)
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  // 2. 행 수집
  const rows = getRowsByScope(table, scope);
  if (rows.length === 0 && emptyBehavior === 'skip') return;

  // 3. 헤더 구성 (다중행 헤더 — AC-005)
  const headerGroups = table.getHeaderGroups();
  const head: string[][] = headerGroups.map((hg) =>
    hg.headers.map((h) =>
      h.isPlaceholder
        ? ''
        : typeof h.column.columnDef.header === 'string'
          ? h.column.columnDef.header
          : h.column.id,
    ),
  );

  // 4. 데이터 행 구성 (리프 헤더 순서)
  const leafHeaders = table.getLeafHeaders();
  const body: string[][] = rows.map((row) => {
    const cells = row.getVisibleCells();
    return leafHeaders.map((lh) => {
      const cell = cells.find((c) => c.column.id === lh.column.id);
      return cell ? String(cell.getValue() ?? '') : '';
    });
  });

  // 5. jsPDF 인스턴스 생성
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });

  // 6. 한국어 폰트 로드 (fontFamily === 'korean')
  if (fontFamily === 'korean') {
    const { loadKoreanFont } = await import('./internal/loadKoreanFont');
    await loadKoreanFont(doc);
  }

  // 7. title 행 (있으면)
  if (title) {
    doc.text(title, 14, 20);
  }

  // 8. autoTable 렌더링
  // @ts-expect-error jspdf-autotable extends jsPDF prototype
  doc.autoTable({ head, body, startY: title ? 30 : 14 });

  // 9. 파일명 정규화 + 다운로드
  const normalized = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  doc.save(normalized);
}
```

### 2.4 사용 예시

**예시 1: 기본 (portrait, filtered, Helvetica)**
```typescript
import { exportToPdf } from '@tomis/grid-export';

const handleDownloadPDF = async () => {
  await exportToPdf(table, { fileName: '보고서.pdf' });
};
```

**예시 2: 가로 방향 + 전체 행 + 제목**
```typescript
import { exportToPdf } from '@tomis/grid-export';

await exportToPdf(table, {
  fileName: '전체데이터.pdf',
  title: '2026년 데이터 목록',
  scope: 'all',
  orientation: 'l',
  emptyBehavior: 'empty',
});
```

**예시 3: 한국어 폰트 (W1 리스크 해소 후 사용)**
```typescript
import { exportToPdf } from '@tomis/grid-export';

await exportToPdf(table, {
  fontFamily: 'korean',   // loadKoreanFont.ts 구현 완료 후 활성화
  fileName: '한국어.pdf',
});
```

### 2.5 기본값 / optional 명시

| 옵션 | 타입 | 기본값 | required |
|------|------|--------|----------|
| `fileName` | `string` | `'export.pdf'` | optional |
| `title` | `string` | `undefined` (생략) | optional |
| `scope` | `ExportScope` | `'filtered'` | optional |
| `emptyBehavior` | `'skip' \| 'empty'` | `'skip'` | optional |
| `orientation` | `'p' \| 'l'` | `'p'` | optional |
| `fontFamily` | `'default' \| 'korean'` | `'default'` | optional |

### 2.6 타입 export 경로 명시

| 타입 | 정의 파일 | export 경로 |
|------|---------|-----------|
| `PDFExportOptions` | `packages/grid-export/src/types.ts` (MODIFY 추가) | `@tomis/grid-export` (index.ts re-export) |
| `ExportScope` | `packages/grid-export/src/types.ts` (G-001 기존) | `@tomis/grid-export` (기존 export 유지) |

---

## Section 3: 기존 사용처 대응표

| 기존 패턴 | 기존 위치 | 신규 API | 마이그레이션 액션 |
|-----------|-----------|----------|-----------------|
| (N/A — 신규 export 기능) | — | `exportToPdf(table, options)` | 기존 코드 없음 — 신규 도입 |

**모든 행 "(N/A — 신규 export 기능)"**: `exportToPdf`는 tw-framework-front에 현재 구현 없음 (L0 확인).  
**jspdf 사용처**: tw-framework-front에 jspdf 미설치 (Grep 결과 0 — L0 확인). Consumer는 jspdf + jspdf-autotable 별도 설치 필요 (optional peer 부담).

---

## Section 4: 호환성 정책

### Breaking change: **no**
- `exportToPdf`는 신규 함수 — 기존 코드 파괴 없음
- G-001 `exportToExcel`, G-002 `exportToCSV` API 시그니처 **무수정**
- `types.ts` MODIFY는 `PDFExportOptions` 추가만 — 기존 타입 불변
- `index.ts` MODIFY는 re-export 추가만 — 기존 export 유지

### Deprecation 정책
- 없음 (신규 기능)

### peerDependencies 정책 (C-22)
- `jspdf ^2.5.0` — optional peer (이미 선언 — package.json 수정 불필요)
- `jspdf-autotable ^3.5.0` — optional peer (이미 선언 — package.json 수정 불필요)
- `@tanstack/react-table ^8` — peer (G-001과 동일)
- **package.json MODIFY 없음** — D2 결정 근거: G-001 scaffolding 시 이미 선언됨

### ADR 의무 (C-9 / C-20)
- **ADR-MOD-GRID-06-002 작성 필수** — jspdf + jspdf-autotable은 신규 optional peer (G-003에서 처음 실제 사용)
- ADR 초안: Section 13 / decisions.md MODIFY (Section 7 F-7 참조)

---

## Section 5: 인수 기준

모든 AC에 출처 태그 포함.

| AC ID | 설명 | 출처 |
|-------|------|------|
| **AC-001** | `exportToPdf<TData>(table: Table<TData>, options?: PDFExportOptions): Promise<void>` — jspdf + jspdf-autotable dynamic import, `: any` 금지, `@ts-expect-error` 1개 허용 (autotable prototype 확장) | `L1: tanstack-api-inventory.md §2.3`, `C-4 strict`, `D3` |
| **AC-002** | `jspdf ^2` + `jspdf-autotable ^3`는 optional peerDependency로 선언 — 미설치 시 import 실패 Error throw (throw 전 사용자에게 명확한 메시지) | `C-22 peerDependencies`, `D2: package.json 현 상태 확인`, `feature-gap-matrix.md §2` |
| **AC-003** | 한국어 폰트: `internal/loadKoreanFont.ts` stub 구현 제공 — `fontFamily: 'korean'` 옵션 시 dynamic import하여 jsPDF 인스턴스에 등록. 실 폰트 데이터 미제공 시 `fontFamily: 'default'` 동작은 항상 보장 | `C-20 ADR`, `D4: stub 전략`, `W1 리스크 섹션` |
| **AC-004** | `emptyBehavior: 'skip'`(기본) 시 행 0건이면 파일 생성 안 함. `'empty'`는 헤더만 있는 PDF 생성 | `L2: types.ts emptyBehavior 기존 패턴`, `D5` |
| **AC-005** | 다중행 헤더(GroupColumnDef) 지원 — `table.getHeaderGroups()` 순회, `header.isPlaceholder` 빈 셀, `header.colSpan` 반영, jspdf-autotable `head` 배열로 전달 | `L1: tanstack-api-inventory.md §2.1 core/headers.d.ts`, `D7` |
| **AC-006** | `tsc --noEmit` 0 error (`grid-export` 패키지 전체 — 신규 파일 + MODIFY 포함). `@ts-expect-error` 사용 시 실제 에러가 있어야 함 (unused suppress 금지) | `C-12 빌드 0 errors`, `C-4 strict` |
| **AC-007** | Storybook story 1개 (`exportToPdf.stories.tsx`) — mock table + PDF 다운로드 버튼 + `fontFamily: 'korean'` 옵션 표시 시나리오 포함 | `C-25 Public API 문서화`, `E-01 v1.0.6 binding AC: *.stories.tsx NEW 파일 Section 7 명시` |

---

## Section 6: 엣지 케이스

| 케이스 | 처리 방식 |
|--------|-----------|
| jspdf 미설치 상태에서 호출 | `await import('jspdf')` ModuleNotFoundError → catch 후 `throw new Error('[exportToPdf] jspdf is not installed. Run: npm install jspdf jspdf-autotable')` |
| jspdf-autotable 미설치 | 동일 — import 실패 시 명확한 Error throw |
| `scope: 'selected'` + 선택 행 없음 + `emptyBehavior: 'skip'` | `rows.length === 0` → 즉시 return (파일 생성 안 함) |
| `scope: 'selected'` + 선택 행 없음 + `emptyBehavior: 'empty'` | 헤더만 있는 PDF 생성 (body 빈 배열) |
| `header.column.columnDef.header` 함수형 | `typeof h.column.columnDef.header === 'string'` 검사 → 함수형이면 `h.column.id` fallback |
| `cell.getValue()` null/undefined | `String(cell.getValue() ?? '')` — 빈 문자열 처리 |
| `fileName` 에 `.pdf` 확장자 없음 | 자동 추가 (`fileName.endsWith('.pdf') ? ... : fileName + '.pdf'`) |
| `title` 길이가 페이지 너비 초과 | jspdf `doc.text()` 기본 동작(클리핑). 현 범위 내 자동 줄바꿈 불보장 — V# 추후 개선 |
| `fontFamily: 'korean'` + `loadKoreanFont.ts` stub 상태 | stub이 no-op 반환 → Helvetica fallback. W1 리스크 문서 참조 |
| 다중행 헤더 colspan 처리 | `header.colSpan` → jspdf-autotable `head` 배열 colspan 매핑. colspan > 1인 헤더는 중복 병합 셀로 렌더링 |
| 초대용량 행 (10,000+) | 동기 autoTable 렌더링 — 메인 스레드 블로킹 가능. 현 범위 내 Web Worker 미지원 (V# 확장 대상) |

---

## Section 7: 구현 파일 목록 (authoritative — C-30)

| # | Action | 파일 경로 (절대) |
|---|--------|--------------|
| F-1 | **NEW** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/exportToPdf.ts` |
| F-2 | **NEW** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/internal/loadKoreanFont.ts` |
| F-3 | **MODIFY** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/types.ts` |
| F-4 | **MODIFY** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/index.ts` |
| F-5 | **NEW** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/exportToPdf.stories.tsx` |
| F-6 | **MODIFY** | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-06-decisions.md` |

**총계**: NEW 3개 + MODIFY 3개 = **6파일**  
**변경 없음 (확인)**: `package.json` (D2 — jspdf optional peer 이미 선언), `internal/getRowsByScope.ts` (D1 — import만 사용), `exportToExcel.ts`, `exportToCSV.ts`

---

## Section 8: 테스트 전략

### 8.1 단위 테스트

| 테스트 | 검증 내용 | 파일 위치 |
|--------|-----------|-----------|
| `emptyBehavior: 'skip'` + 0행 | `doc.save` 미호출 확인 (spy) | `exportToPdf.test.ts` |
| `emptyBehavior: 'empty'` + 0행 | `doc.save` 호출, body 빈 배열 | `exportToPdf.test.ts` |
| `scope: 'all'` | `getCoreRowModel` 호출 확인 | `exportToPdf.test.ts` |
| `scope: 'filtered'` (기본) | `getFilteredRowModel` 호출 확인 | `exportToPdf.test.ts` |
| `scope: 'selected'` | `getSelectedRowModel` 호출 확인 | `exportToPdf.test.ts` |
| 다중행 헤더 | `head` 배열 2행 이상 생성 확인 | `exportToPdf.test.ts` |
| jspdf 미설치 시 Error | dynamic import mock → throw Error 메시지 확인 | `exportToPdf.test.ts` |
| `fileName` 자동 `.pdf` 추가 | `doc.save` 호출 인자 검증 | `exportToPdf.test.ts` |

### 8.2 Storybook 시나리오 (AC-007 바인딩)

파일: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/exportToPdf.stories.tsx`

| Story | 내용 |
|-------|------|
| `Default` | mock table + `exportToPdf(table, { fileName: '보고서.pdf' })` 버튼 |
| `Landscape` | `orientation: 'l'` + `title: '가로 PDF'` |
| `SelectedRowsOnly` | `scope: 'selected'` + 체크박스 선택 |
| `KoreanFont` | `fontFamily: 'korean'` — stub 상태 설명 주석 포함 |

### 8.3 통합 검증 (Implementer 체크리스트)

```
□ tsc --noEmit: 0 error
□ jspdf 설치 환경에서 브라우저 실제 PDF 다운로드 확인
□ Storybook story 4개 렌더링 확인
□ scope: 'all' / 'filtered' / 'selected' 각각 PDF 내용 검증
□ 다중행 헤더 GroupColumnDef PDF head 2줄 렌더링 확인
□ emptyBehavior: 'skip' 동작 (0행 시 파일 미생성) 확인
```

---

## Section 9: 번들 영향 분석

| 항목 | 영향 |
|------|------|
| `exportToPdf.ts` 자체 | +3 KB 이내 (gzipped) — 구현 로직만 |
| `internal/loadKoreanFont.ts` (stub) | +0.5 KB 이내 |
| `jspdf ^2.5.0` | peer → consumer 번들에만 영향. `grid-export` 자체 번들 변화 없음 |
| `jspdf-autotable ^3.5.0` | peer → consumer 번들에만 영향 |
| Dynamic import | jspdf는 최초 `exportToPdf()` 호출 시점에만 로드 — 초기 번들 0 영향 |
| 한국어 폰트 (W1) | 활성화 시 ~2 MB 추가 가능 — stub 상태에서는 0 |

**tw-framework-front 번들 영향**: jspdf 미설치 상태 → consumer가 opt-in하여 설치해야 함. optional peer 부담 문서화 필요 (consumer README 또는 inline JSDoc).

---

## Section 10: 의존성 그래프

```
exportToPdf.ts
  ├── [static import] ./internal/getRowsByScope.ts  (G-002 추출)
  ├── [static import] ./types.ts                     (PDFExportOptions, ExportScope)
  ├── [dynamic import] jspdf (optional peer)
  ├── [dynamic import] jspdf-autotable (optional peer)
  └── [conditional dynamic import] ./internal/loadKoreanFont.ts  (fontFamily==='korean')

loadKoreanFont.ts
  └── [dynamic import] jspdf (peer — doc 인자로 수신, 별도 import 최소화)

types.ts  (MODIFY)
  └── ExportScope (기존, G-001 정의)

index.ts  (MODIFY)
  ├── export { exportToPdf } from './exportToPdf'
  └── export type { PDFExportOptions } from './types'
```

**순환 의존 없음**: exportToPdf → getRowsByScope → types (단방향 체인)

---

## Section 11: 위험 항목 (W#)

| # | 위험 | 영향 | 완화 전략 |
|---|------|------|-----------|
| **W1** | 한국어 폰트 base64 임베딩 — 폰트 파일 라이선스 미검증, 번들 ~2 MB 증가 가능 | HIGH — `fontFamily: 'korean'` 미동작 | `loadKoreanFont.ts` stub 유지 + JSDoc 경고. 폰트 라이선스(NotoSansKR OFL 1.1 또는 NanumGothic OFL 1.1) 별도 확인 후 구현. OFL 1.1은 font embedding 허용 |
| **W2** | `jspdf-autotable` TypeScript 타입 미제공 — `@ts-expect-error` 1개 필요 | LOW — 빌드 경고 위험 | `@ts-expect-error jspdf-autotable extends jsPDF prototype` 주석 명시. `@types/jspdf-autotable` 확인 가능 시 설치 검토 |
| **W3** | 초대용량 데이터 (10,000+행) 메인 스레드 블로킹 | MEDIUM — UX 저하 | 현 범위 내 동기 구현 허용. V# 개선 대상 (Web Worker 래핑) |
| **W4** | `header.column.columnDef.header` 함수형일 때 label 문자열 획득 불가 | LOW — column.id fallback | `typeof === 'string'` 분기 후 `column.id` fallback 처리 (Section 6 엣지 케이스 참조) |

---

## Section 12: 향후 확장 포인트 (V#)

| # | 확장 포인트 | 이유 | 범위 |
|---|------------|------|------|
| **V1** | 한국어 폰트 실 구현 (`loadKoreanFont.ts`) | W1 리스크 해소 후 — NotoSansKR base64 embed + `doc.addFileToVFS` + `doc.addFont` 패턴 | 별도 Goal (G-003.1) |
| **V2** | Web Worker 기반 비동기 PDF 생성 | 10,000+행 UX 개선 | 별도 Goal |
| **V3** | `@tomis/grid-export` consumer 설치 가이드 — jspdf optional peer 설치 방법 명시 | tw-framework-front 통합 시 필요 | README 또는 JSDoc |
| **V4** | `title` 텍스트 자동 줄바꿈 | Section 6 엣지 케이스 미처리 항목 | patch 수준 |

---

## Section 13: ADR 초안 (ADR-MOD-GRID-06-002)

> **이 섹션은 구현자가 `decisions/MOD-GRID-06-decisions.md`에 추가해야 할 ADR 전문이다.**  
> **Section 7 F-6 MODIFY 액션에 대응한다.**

---

### ADR-MOD-GRID-06-002: PDF export 라이브러리 선택 — jspdf + jspdf-autotable

**상태**: 확정 (2026-05-14)  
**Goal**: MOD-GRID-06 / G-003  
**작성자**: Spec (Implementer가 decisions.md에 추가 의무 — C-20)

#### 결정

`packages/grid-export` 패키지의 PDF export 구현에 **jspdf `^2.5.0`** + **jspdf-autotable `^3.5.0`** 을 optional peerDependency로 채택한다.

#### 사유

1. `packages/grid-export/package.json` peerDependencies에 jspdf + jspdf-autotable이 이미 optional peer로 선언되어 있음 (G-001 scaffolding 시 pre-declared).
2. jspdf-autotable은 `head: string[][]` 구조로 TanStack `table.getHeaderGroups()` 다중행 헤더 직접 매핑 가능 — AC-005 충족.
3. Dynamic import 지원 → 미설치 consumer에게 번들 영향 0 (optional 채택 정당성).
4. jspdf MIT + jspdf-autotable MIT — C-9 라이선스 정책 충족.
5. tw-framework-front에 jspdf 미설치 확인 (Grep 결과 0) — consumer opt-in 방식 적합.

#### 대안 비교

| 라이브러리 | 라이선스 | 번들 영향 | 한국어 폰트 | 테이블 지원 | 선택 여부 |
|-----------|--------|---------|-----------|-----------|--------|
| **jspdf ^2 + jspdf-autotable ^3** | MIT + MIT | optional peer (0 KB) | dynamic import stub | autoTable API | ✅ 선택 |
| pdfmake ^0.2 | MIT | ~300 KB (gzip) | vfs_fonts.js embed 필요 | 자체 docDefinition | ❌ 번들 과대, consumer 미보유 |
| html2pdf.js | MIT | ~600 KB | CSS 기반 (자동) | DOM 캡처 방식 | ❌ SSR 불가, DOM 의존성 |
| puppeteer | Apache-2.0 | Node.js 전용 | 시스템 폰트 | headless Chrome | ❌ 브라우저 환경 불가 |
| 브라우저 Print API | N/A | 0 KB | CSS @font-face | CSS 스타일링 | ❌ 다운로드 제어 불가 |

#### Trade-off

**Trade-off 1 (선택)**: jspdf + autotable은 optional peer이므로 consumer가 별도 설치해야 함.  
→ tw-framework-front에 미설치. 통합 시 `npm install jspdf jspdf-autotable` 필요.  
→ JSDoc @example + consumer 가이드(V3)로 완화.

**Trade-off 2 (선택)**: 한국어 폰트는 base64 embed가 필요하나 번들 증가(~2 MB) 리스크 존재.  
→ `loadKoreanFont.ts` stub 유지 + W1 리스크 문서화. 폰트 라이선스(OFL 1.1) 확인 후 V1로 구현.

**Trade-off 3 (선택)**: `jspdf-autotable` TypeScript 타입이 prototype 확장 방식이라 `@ts-expect-error` 필요.  
→ `@types/jspdf-autotable` 확인 가능 시 제거 가능. AC-006 충족 유지.

#### peerDependenciesMeta 현 상태

```json
"peerDependenciesMeta": {
  "jspdf": { "optional": true },
  "jspdf-autotable": { "optional": true }
}
```
→ **수정 불필요** — G-001 scaffolding 시 이미 선언.

#### 번들 영향

- `grid-export` 자체 번들: +3.5 KB 이내 (gzipped) — jspdf는 peer이므로 미포함.
- `tw-framework-front`: jspdf 미설치 상태 → consumer opt-in 설치 시 +200 KB(gzip) 추가.

#### 라이선스 확인 의무 (Implementer)

> **⚠️ Implementer는 커밋 전 아래를 직접 확인할 것:**
> - `jspdf@2.x` MIT: https://www.npmjs.com/package/jspdf → License 탭
> - `jspdf-autotable@3.x` MIT: https://www.npmjs.com/package/jspdf-autotable → License 탭
> - C-9 정책: MIT / Apache-2.0만 허용

---

*이 ADR은 `decisions/MOD-GRID-06-decisions.md`에 ADR-MOD-GRID-06-001 다음에 추가된다 (Section 7 F-6).*
