# MOD-GRID-06 / export / G-001 — Specification

**Goal ID**: MOD-GRID-06/export/G-001  
**Title**: Excel(.xlsx) export — exportToExcel(table, options) + 한국어 UTF-8 + 다중행 헤더 + DataTable alias  
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
| D1 | `grid-export` 패키지는 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/`에 신설 | ADR-MOD-GRID-00-001: monorepo는 TOMIS 외부 (C-28 정정 필수) |
| D2 | `goals.json` `implementFiles` prefix 정정: `TOMIS/packages/` → `topvel-grid-monorepo/packages/` | C-28 발동 (G-001이 처음 발견하는 동일 패턴 — 본 spec D2에서 처리) |
| D3 | `exportToExcel` 반환 타입 `void` (Promise 불필요) | xlsx `writeFile`은 동기 API. 비동기 래핑은 불필요한 복잡도 |
| D4 | `ExcelExportOptions`의 `scope` 기본값: `'filtered'` | 현재 보이는 데이터가 직관적. `'all'`은 필터 무시로 오해 가능 |
| D5 | `downloadExcel` alias는 `legacy/downloadExcel.ts`에 배치 | C-6 호환성 1 minor 유지 + DataTable migration alias 분리 |
| D6 | NEW 파일 6개: `types.ts`, `exportToExcel.ts`, `legacy/downloadExcel.ts`, `index.ts`, `package.json`, `tsup.config.ts` | G-001이 grid-export 패키지의 첫 Goal → 패키지 초기화 포함 |
| D7 | `ExportScope`는 `types.ts`에서 정의하고 G-005(emptyBehavior) 통합 가능 구조 | 타입 single source-of-truth |

---

## Section 1: 참조 추적

### L0 (현 구현): tw-framework-front DataTable buttonInfo.downloadAction 패턴

파일: `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/DataTable/data-table.tsx`

실제 코드 발췌 (라인 번호 포함):

**L487-495**: 다운로드 버튼 렌더링
```tsx
{buttonInfo.downloadEnable && (
  <button
    type="button"
    onClick={() => listAction(buttonInfo.downloadAction, '')}
    disabled={isExecuting || permissions?.downloadYn !== 'Y' || !isTableReady}
    className="inline-flex items-center px-2 py-1 h-6 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
  >
    <FaDownload className="mr-2" />
    {buttonInfo.downloadTitle}
  </button>
)}
```

**핵심 관찰**:
- L490: `listAction(buttonInfo.downloadAction, '')` — 문자열 액션 키를 부모 컴포넌트로 위임. 실제 excel 생성 로직은 DataTable 외부에 있음.
- L24: `ButtonInfo` import (`data-table-types.ts`에서) — `downloadAction: string` 필드 (문자열 액션 이름)
- `data-table.tsx`에는 xlsx/excel 직접 생성 코드가 없음 (current-tanstack-analysis.md §8 확인: "xlsx dep 존재(^0.18.5) but DataTable에서 `downloadAction` 이벤트만 — 실제 export 코드 없음")
- L1-13: `useReactTable`, `getCoreRowModel`, `getSortedRowModel`, `getPaginationRowModel`, `getFilteredRowModel` import — Table 인스턴스를 내부에서 생성 (`table` 변수 L343)
- L343-371: `useReactTable({...})` 호출 → `table` 인스턴스 생성

**L0 결론**: 현재 구현에 Excel 생성 코드 없음. `downloadAction` 문자열 이벤트만 존재. 신규 구현 필요.

### L1 (TanStack v8 API)

출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md`

**Row Model 함수 시그니처** (tanstack-api-inventory.md §2.3):
```ts
getCoreRowModel():    () => RowModel<TData>   // scope='all' 시 사용
getFilteredRowModel():() => RowModel<TData>   // scope='filtered' 시 사용 (default)
// getSelectedRowModel: TanStack v8 공식 export에 없음
// → selected scope는 table.getSelectedRowModel() 인스턴스 메서드로 대체
```

**Table 인스턴스 메서드** (tanstack-api-inventory.md §2.1 core/table.d.ts 확인):
- `table.getCoreRowModel()` — 전체 행 (필터/정렬 미반영)
- `table.getFilteredRowModel()` — 필터/정렬 적용 행
- `table.getSelectedRowModel()` — 선택 행 (인스턴스 메서드, Row Model util 아님)
- `table.getHeaderGroups()` — HeaderGroup[] (다중행 헤더 탐색용)

**ColumnDef GroupColumnDef** (tanstack-api-inventory.md §4):
```ts
GroupColumnDef: columnHelper.group({ header: string, columns: ColumnDef<TData>[] })
// header.isPlaceholder — 그룹 헤더 하위 placeholder 헤더 감지
// header.colSpan — 그룹이 span하는 컬럼 수
```

**xlsx peer 버전**: `tw-framework-front/package.json` L42 — `"xlsx": "^0.18.5"` (직접 확인)

**xlsx@0.18.5 핵심 API** (공식 API, peer이므로 외부 consumer가 설치):
```ts
import * as XLSX from 'xlsx';
// sheet 생성
const ws = XLSX.utils.json_to_sheet(rows);                    // 배열 → sheet
const ws = XLSX.utils.aoa_to_sheet(arrayOfArrays);            // AOA → sheet (다중헤더용)
// merge cells (다중행 헤더)
ws['!merges'] = [{ s: {r:0, c:0}, e: {r:0, c:2} }, ...];    // CellRange[]
// workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, sheetName);
XLSX.writeFile(wb, fileName);                                  // 동기 다운로드 트리거
```

### L2 (공통 구조)

**신규 패키지 (N/A)**: `packages/grid-export`는 이번 G-001이 처음 생성하는 패키지. 기존 공통 구조 없음. 공유 타입(`ExportScope`)은 G-005(emptyBehavior)와 통합 가능 구조로 설계 (D7 결정).

### L3 (영향 사용처)

파일: `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/DataTable/data-table.tsx`

**영향 사용처 1개** (canonical-modules.json MOD-GRID-06 `affectedUsageFiles` 직접 확인).

관련 라인:
- L487-495: `buttonInfo.downloadEnable` → `listAction(buttonInfo.downloadAction, '')` 호출 패턴
- L490: `listAction(buttonInfo.downloadAction, '')` — 이 호출점이 `downloadExcel(table)` alias로 대체 가능

### R-A (AG Grid)

출처: `publish-aggrid-analysis.md §8` — Excel export Community vs Enterprise:
```
AG Grid Community: CSV export만 지원 (xlsx는 외부 라이브러리)
AG Grid Enterprise: 네이티브 Excel export API
  - excelExport: grid.exportDataAsExcel({ fileName, sheetName, columnGroups: true })
  - columnGroups: true → 다중행 헤더 자동 처리
```
- publish는 Excel export 기능 미사용 (publish-aggrid-analysis.md §8 표 확인)
- 우리는 AG Grid 비도입(C-7), xlsx를 직접 사용하여 동등 기능 구현

### R-W (Wijmo)

출처: `publish-wijmo-analysis.md §6`, `feature-gap-matrix.md §3`
```
FlexGridXlsxConverter — @mescius/wijmo.grid.xlsx
  import { FlexGridXlsxConverter } from '@mescius/wijmo.grid.xlsx';
  FlexGridXlsxConverter.save(grid, { includeColumnHeaders: true, sheetName });
```
- Wijmo는 다중행 헤더 자동 처리 (AllowMerging.ColumnHeaders)
- **코드 차용 절대 금지 (C-16)** — 패턴 참고만

---

## Section 2: API 계약

### 2.1 타입 정의 (`packages/grid-export/src/types.ts`)

```typescript
import type { Table } from '@tanstack/react-table';

/** Excel export 범위 지정 */
export type ExportScope = 'all' | 'filtered' | 'selected';

/** Excel export 옵션 */
export interface ExcelExportOptions {
  /** 다운로드 파일명 (확장자 포함 권장, 없으면 .xlsx 자동 추가)
   * @default 'export.xlsx'
   */
  fileName?: string;
  /** Excel 시트명
   * @default 'Sheet1'
   */
  sheetName?: string;
  /** export 대상 행 범위
   * - 'all': getCoreRowModel (필터 무시, 전체)
   * - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default
   * - 'selected': table.getSelectedRowModel (선택 행만)
   * @default 'filtered'
   */
  scope?: ExportScope;
  /** 선택 행 0건 시 동작
   * - 'skip': 파일 생성 안 함 (기본)
   * - 'empty': 헤더만 있는 빈 파일 생성
   * @default 'skip'
   */
  emptyBehavior?: 'skip' | 'empty';
}

/** DataTable buttonInfo 호환 alias 옵션 (legacy) */
export interface DownloadExcelOptions
  extends Omit<ExcelExportOptions, 'scope'> {
  scope?: ExportScope;
}
```

### 2.2 함수 시그니처 (`packages/grid-export/src/exportToExcel.ts`)

```typescript
import type { Table } from '@tanstack/react-table';
import type { ExcelExportOptions } from './types';

/**
 * TanStack Table 인스턴스를 기반으로 Excel(.xlsx) 파일을 생성·다운로드한다.
 *
 * @param table - TanStack v8 Table<TData> 인스턴스 (useReactTable 반환값)
 * @param options - Excel export 옵션 (fileName, sheetName, scope, emptyBehavior)
 * @returns void (동기 실행 — xlsx.writeFile 동기 API)
 *
 * @example
 * // 기본 사용 (filtered 행)
 * exportToExcel(table, { fileName: '데이터.xlsx' });
 *
 * @example
 * // 선택 행 + 다중행 헤더
 * exportToExcel(table, {
 *   fileName: '선택데이터.xlsx',
 *   sheetName: '선택목록',
 *   scope: 'selected',
 *   emptyBehavior: 'empty',
 * });
 */
export function exportToExcel<TData>(
  table: Table<TData>,
  options?: ExcelExportOptions
): void;
```

### 2.3 사용 예시

**예시 1: 기본 (필터/정렬 반영)**
```typescript
import { exportToExcel } from '@tomis/grid-export';

// 컴포넌트 내부
const handleDownload = () => {
  exportToExcel(table, { fileName: '데이터.xlsx', sheetName: '시트1' });
};
```

**예시 2: 선택 행 + merge cells 다중행 헤더**
```typescript
import { exportToExcel } from '@tomis/grid-export';

// GroupColumnDef로 정의된 컬럼 + selected scope
exportToExcel(table, {
  fileName: '선택데이터.xlsx',
  sheetName: '선택목록',
  scope: 'selected',
  emptyBehavior: 'empty',
});
```

**예시 3: DataTable alias (마이그레이션용)**
```typescript
import { downloadExcel } from '@tomis/grid-export/legacy';
// DataTable 기존 패턴 교체 — listAction에서 호출 시
downloadExcel(table);
// 내부적으로 exportToExcel(table, { scope: 'filtered' }) 위임
```

### 2.4 기본값 / optional 명시

| 옵션 | 타입 | 기본값 | required |
|------|------|--------|----------|
| `fileName` | `string` | `'export.xlsx'` | optional |
| `sheetName` | `string` | `'Sheet1'` | optional |
| `scope` | `ExportScope` | `'filtered'` | optional |
| `emptyBehavior` | `'skip' \| 'empty'` | `'skip'` | optional |

---

## Section 3: 기존 사용처 대응표

| 기존 패턴 | 기존 위치 | 신규 API | 마이그레이션 액션 |
|-----------|-----------|----------|-----------------|
| `listAction(buttonInfo.downloadAction, '')` | `data-table.tsx` L490 | `exportToExcel(table, options)` | L490 직접 교체 또는 `downloadExcel(table)` alias 사용 |
| `buttonInfo.downloadAction: string` (문자열 이벤트) | `data-table-types.ts` | `(table: Table<TData>) => void` 함수 | G-001 범위: alias만 노출. 실제 data-table.tsx 변환은 MOD-GRID-17 트랙 |
| `ButtonInfo.downloadEnable` 조건부 렌더 | `data-table.tsx` L487 | `ExcelExportOptions` 조합 | 변경 불필요 (버튼 렌더 로직은 그대로 유지) |

---

## Section 4: 호환성 정책

### Breaking change: **no**
- `exportToExcel` / `downloadExcel`은 신규 패키지(`packages/grid-export`)의 신규 API
- 기존 `data-table.tsx`의 `listAction(buttonInfo.downloadAction, '')` 패턴 그대로 유지
- G-001에서는 alias 노출만 — 기존 코드 파괴 없음

### Deprecation 정책
- `downloadExcel(table)` alias: G-001 도입 후 **최소 1 minor 버전** 유지 (C-6, C-23)
- 실제 deprecated 처리 시: `@deprecated` JSDoc + CHANGELOG.md 마이그레이션 가이드

### 영향 사용처 마이그레이션 경로 (단계 명시)

| 단계 | 내용 | Goal |
|------|------|------|
| 1 (G-001) | `packages/grid-export` 신설 + `exportToExcel` + `downloadExcel` alias 노출 | 이번 Goal |
| 2 (MOD-GRID-17) | `data-table.tsx` 다운로드 버튼 → `exportToExcel(table, ...)` 직접 호출로 교체 | MOD-GRID-17 트랙 |
| 3 (G-001+1 minor) | `downloadExcel` alias deprecated 처리 | 향후 |

### peerDependencies 정책 (C-22)
- `xlsx ^0.18.5` — **반드시 peer** (`dependencies`에 포함 금지)
- `@tanstack/react-table ^8` — peer
- `react ^18 || ^19` — peer (tw-framework-front는 react@^19.1.0 — package.json L32 확인)

---

## Section 5: 인수 기준

모든 AC에 출처 태그 포함.

| AC ID | 설명 | 출처 |
|-------|------|------|
| **AC-001** | `exportToExcel<TData>(table: Table<TData>, options?: ExcelExportOptions): void` 타입 시그니처 — `Table<TData>`는 TanStack v8 `useReactTable` 반환 타입. `: any` 금지 | `L1: tanstack-api-inventory.md §1 useReactTable<TData> 반환 Table<TData>`, `C-4 strict` |
| **AC-002** | `options.scope: 'all' \| 'filtered' \| 'selected'` — `'filtered'`(기본): `table.getFilteredRowModel()`, `'selected'`: `table.getSelectedRowModel()`, `'all'`: `table.getCoreRowModel()` | `L1: tanstack-api-inventory.md §2.3 Row Model 함수`, `C-2 표준 API` |
| **AC-003** | TanStack `GroupColumnDef`(헤더 그룹) 감지 → `header.isPlaceholder`, `header.colSpan` 이용 → `ws['!merges']` 다중행 헤더 merge cells 적용 (F-06-05 흡수) | `L1: tanstack-api-inventory.md §4 GroupColumnDef`, `R-A: publish-aggrid-analysis.md §8 columnGroups` |
| **AC-004** | 한국어 column header(`info.name` 등) UTF-8 정상 출력 — `XLSX.utils.aoa_to_sheet` 또는 `json_to_sheet` 사용 시 BOM 없이 인코딩. xlsx@0.18.5는 UTF-8 기본 지원 (F-06-06 흡수) | `L1: xlsx@0.18.5 (tw-framework-front/package.json L42)`, `L0: data-table.tsx columnInfos[].name 한국어 헤더` |
| **AC-005** | `downloadExcel(table: Table<TData>): void` — DataTable `buttonInfo.downloadAction` 호환 legacy alias. 내부적으로 `exportToExcel(table, { scope: 'filtered' })` 위임 (F-06-07 흡수) | `L0: data-table.tsx L490 listAction(buttonInfo.downloadAction, '')`, `C-6 호환성` |
| **AC-006** | `packages/grid-export/package.json`의 `peerDependencies`에 `xlsx: "^0.18.5"` 선언. `dependencies`에 xlsx 포함 금지 | `C-22 peerDependencies 정책`, `tw-framework-front/package.json L42 "xlsx": "^0.18.5"` |
| **AC-007** | `tsc --noEmit` 0 error (grid-export 패키지 + tw-framework-front 통합) | `C-12 빌드 0 errors 필수` |
| **AC-008** | Storybook story 1개 — 기본 export(filtered) + scope 선택 interactive 시나리오 포함 | `C-25 Public API 문서화 의무` |

---

## Section 6: 엣지 케이스

### EC-01: 빈 데이터 export (scope='filtered', 행 0건)
- **시나리오**: 필터 결과 0행. `table.getFilteredRowModel().rows.length === 0`
- **기대 동작**: `options.emptyBehavior === 'skip'`(기본) → 파일 생성 안 함 + `console.warn('[grid-export] exportToExcel: 내보낼 데이터가 없습니다.')`
- `options.emptyBehavior === 'empty'` → 헤더 행만 있는 xlsx 파일 생성
- **구현 주의**: `aoa_to_sheet([[...headers]])` 1행만 있는 sheet

### EC-02: 헤더 그룹(GroupColumnDef) + pinned column 동시
- **시나리오**: 컬럼 일부가 `left`/`right` pinned + 상위 `GroupColumnDef` 그룹
- **기대 동작**: pinned 컬럼은 일반 컬럼과 동일하게 export (시각적 위치 무관, 데이터 순서 유지)
- `header.isPlaceholder` 감지로 merge cells 계산 시 pinned 여부는 영향 없음
- `ws['!merges']` 계산은 `table.getHeaderGroups()` 기반 — TanStack API 표준 사용
- **구현 주의**: `header.column.columnDef.header`가 `GroupColumnDef`의 상위 헤더일 때 `header.isPlaceholder === false` + `header.colSpan > 1`

### EC-03: scope='selected' + 선택 행 0건 (emptyBehavior 정합)
- **시나리오**: `scope: 'selected'`, 선택 행 없음 (`table.getSelectedRowModel().rows.length === 0`)
- **기대 동작**: `emptyBehavior === 'skip'`(기본) → 파일 생성 안 함. `emptyBehavior === 'empty'` → 헤더만 export
- **구현 주의**: G-005 emptyBehavior와 동일 타입(`'skip' | 'empty'`) — `types.ts`에서 공유

### EC-04: fileName에 확장자 없음
- **시나리오**: `options.fileName = '데이터목록'` (`.xlsx` 누락)
- **기대 동작**: 자동으로 `.xlsx` 추가 → `'데이터목록.xlsx'`
- **구현 주의**: `fileName.endsWith('.xlsx') ? fileName : fileName + '.xlsx'`

### EC-05: 대용량 데이터 (>10,000행)
- **시나리오**: `scope: 'all'`, 데이터 10,000행 이상
- **기대 동작**: 브라우저 메인 스레드 블로킹 가능성 있음 (xlsx.writeFile 동기) — JSDoc에 "대용량 시 Web Worker 사용 권장" 경고 명시. 현 G-001 범위에서는 동기 구현만.
- **향후 확장**: G-002 등에서 async/Worker 버전 추가 가능 구조로 설계 (함수 분리)

---

## Section 7: 구현 대상 파일

**C-28 정정 결정 (D1, D2)**:
- `goals.json`의 `implementFiles`에는 `TOMIS/packages/` prefix 오류 존재 (C-28)
- 본 spec에서 monorepo 경로로 정정 결정 — 아래 표가 최종 권위 (C-30)

| # | 액션 | 파일 (정정된 monorepo 절대 경로) | 설명 |
|---|------|----------------------------------|------|
| 1 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/types.ts` | `ExcelExportOptions`, `ExportScope`, `DownloadExcelOptions` 타입 정의 |
| 2 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/exportToExcel.ts` | 핵심 함수: getRowsByScope + header 추출 + xlsx 생성 |
| 3 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/legacy/downloadExcel.ts` | DataTable buttonInfo 호환 alias |
| 4 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/index.ts` | public API re-export |
| 5 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/package.json` | 패키지 정의 + peerDeps (xlsx, @tanstack/react-table, react) |
| 6 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/tsup.config.ts` | CJS+ESM dual build |

**재결정 없음** — 위 6개 파일이 최종 implementFiles (본문 재결정 표현 없음, E-06 자가 검증 통과).

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처 (1개)
- `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/DataTable/data-table.tsx`
  - 관련 라인: L487-495 (downloadAction 버튼), L490 (`listAction(buttonInfo.downloadAction, '')`)
  - C-19 준수: 사용처 1개 ≤ 5개 한도 (C-19 통과)

### 8.2 무파괴 검증 방법
- `tsc --noEmit` (tw-framework-front + grid-export 패키지) → 0 error
- `data-table.tsx` 외관 보존: G-001에서 `data-table.tsx`를 **수정하지 않음** (alias만 노출, 사용처 변환은 MOD-GRID-17)
- Storybook story: DataTable 다운로드 버튼 클릭 → `downloadExcel` alias 동작 확인
- 이 Goal이 `D:/project/topvel_project/topvel-grid-monorepo/` 디렉토리를 신설함 (H-02 외부 디렉토리 예외 적용)
  - 조부모 실재: `D:/project/topvel_project/` (ADR-MOD-GRID-00-001 기준 실재 확인됨)
  - 명명 컨벤션: `topvel-` prefix + kebab-case (ADR-MOD-GRID-00-001과 일치)

### 8.3 점진 마이그레이션 (C-19)
- G-001에서: `packages/grid-export` 신설 + `exportToExcel` + `downloadExcel` alias 노출
- `data-table.tsx` 실제 코드 변경은 **이번 Goal 범위 밖** (MOD-GRID-17 트랙)
- 실제 페이지 사용처 변환: MOD-GRID-17 트랙에서 처리

### 8.4 롤백 전략
- `downloadExcel(table)` deprecated alias 1 minor 유지 (C-6, C-23)
- 이번 Goal은 신규 패키지 신설 — 기존 코드 미수정 → 롤백은 패키지 import 제거만으로 충분
- `data-table.tsx` 무수정 → DataTable 기존 동작 완전 보존

### 8.5 번들 크기
- `packages/grid-export`: 예상 +5 KB (gzipped) — feature-gap-matrix.md §6 확인
- `grid-core` 무영향 (별도 패키지 — C-21 grid-core ≤ 30 KB 한도 미영향)
- `xlsx`는 peerDependency → grid-export 번들에 포함 안 됨 (Consumer가 설치)

---

## Section 9: 의존성

### peerDependencies (C-22 엄수)

```json
"peerDependencies": {
  "xlsx": "^0.18.5",
  "@tanstack/react-table": "^8.0.0",
  "react": "^18.0.0 || ^19.0.0"
},
"peerDependenciesMeta": {
  "react": { "optional": false },
  "xlsx": { "optional": false },
  "@tanstack/react-table": { "optional": false }
}
```

- `xlsx ^0.18.5`: **반드시 peer** — tw-framework-front/package.json L42 이미 `"xlsx": "^0.18.5"` 확인
- `@tanstack/react-table ^8`: peer — tw-framework-front/package.json L22 `"@tanstack/react-table": "^8.21.3"` 확인
- `react ^18 || ^19`: peer — tw-framework-front/package.json L32 `"react": "^19.1.0"` 확인

### dependencies (없음)
- xlsx가 peer이므로 runtime dep 없음. 핵심 로직은 xlsx + TanStack API만으로 충분.

### devDependencies
```json
"devDependencies": {
  "typescript": "~5.8.3",
  "tsup": "^8.0.0",
  "@tanstack/react-table": "^8.21.3",
  "xlsx": "^0.18.5",
  "@types/react": "^19.0.0",
  "react": "^19.1.0"
}
```

---

## Section 10: 사용자 여정 매핑

### 개발자 관점

```
1. import 설치 확인
   import { exportToExcel } from '@tomis/grid-export';

2. TanStack table 인스턴스 확보
   const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

3. 버튼 onClick에서 호출
   const handleDownload = () => {
     exportToExcel(table, { fileName: '데이터.xlsx', sheetName: '시트1', scope: 'filtered' });
   };

4. 선택적: DataTable 마이그레이션 (legacy alias 사용)
   import { downloadExcel } from '@tomis/grid-export/legacy';
   downloadExcel(table);  // scope: 'filtered' 기본
```

### 최종 사용자 관점

```
1. 화면의 "엑셀 다운로드" 버튼 클릭
   → 현재 적용된 정렬/필터 상태 그대로 반영

2. 브라우저 파일 다운로드 다이얼로그 표시
   → '데이터.xlsx' 파일명으로 저장 가능

3. Excel에서 파일 오픈
   → 한국어 헤더 정상 표시 (UTF-8)
   → 다중행 헤더 있는 경우 merge cells로 표시
   → 데이터 행은 필터/정렬 반영된 순서대로
```

---

## Section 11: 구현 계획

### 11.1 Before/After 코드 스니펫

**Before (data-table.tsx L490 — 현 패턴)**:
```tsx
// data-table.tsx L487-495
{buttonInfo.downloadEnable && (
  <button
    type="button"
    onClick={() => listAction(buttonInfo.downloadAction, '')}  // ← 문자열 이벤트만
    ...
  >
    <FaDownload className="mr-2" />
    {buttonInfo.downloadTitle}
  </button>
)}
// 실제 Excel 생성 로직: DataTable 외부 (부모 컴포넌트가 listAction 처리)
// xlsx 사용 코드 없음
```

**After (G-001 신규 패키지 — grid-export/src/exportToExcel.ts 핵심부)**:
```typescript
// packages/grid-export/src/exportToExcel.ts
import * as XLSX from 'xlsx';
import type { Table } from '@tanstack/react-table';
import type { ExcelExportOptions } from './types';

export function exportToExcel<TData>(
  table: Table<TData>,
  options?: ExcelExportOptions
): void {
  const {
    fileName = 'export.xlsx',
    sheetName = 'Sheet1',
    scope = 'filtered',
    emptyBehavior = 'skip',
  } = options ?? {};

  // 1) 행 결정 (C-2: 표준 API만)
  const rows = getRowsByScope(table, scope);
  if (rows.length === 0 && emptyBehavior === 'skip') {
    console.warn('[grid-export] exportToExcel: 내보낼 데이터가 없습니다.');
    return;
  }

  // 2) 헤더 추출 (GroupColumnDef 감지 → 다중행)
  const { headerRows, merges } = buildHeaderRows(table);

  // 3) 데이터 행 추출
  const dataRows = rows.map(row =>
    row.getVisibleCells().map(cell => cell.getValue() ?? '')
  );

  // 4) AOA sheet 생성 (헤더 + 데이터)
  const aoa = [...headerRows, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // 5) merge cells (다중행 헤더 있을 때)
  if (merges.length > 0) {
    ws['!merges'] = merges;
  }

  // 6) workbook + 파일 다운로드
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, finalFileName);
}
```

### 11.2 구현 순서

**Step 1**: `types.ts` — `ExportScope`, `ExcelExportOptions`, `DownloadExcelOptions` 정의
- `ExportScope`를 별도 export — G-005 emptyBehavior와 재사용 가능 구조 (D7)

**Step 2**: `exportToExcel.ts` — 핵심 함수
- 내부 헬퍼: `getRowsByScope<TData>(table, scope): Row<TData>[]`
  - `'all'` → `table.getCoreRowModel().rows`
  - `'filtered'` → `table.getFilteredRowModel().rows`
  - `'selected'` → `table.getSelectedRowModel().rows`
- 내부 헬퍼: `buildHeaderRows<TData>(table): { headerRows: unknown[][], merges: XLSX.Range[] }`
  - `table.getHeaderGroups()` 순회
  - `header.isPlaceholder` → 빈 셀 (`''`)
  - `header.colSpan > 1` + 상위 그룹 헤더 → `ws['!merges']` 계산
  - `header.column.columnDef.header` (string 일 경우) → 헤더 텍스트 (한국어 UTF-8)
- 빈 데이터 분기 처리 (EC-01, EC-03)
- fileName 확장자 자동 추가 (EC-04)
- JSDoc에 대용량 경고 (EC-05)

**Step 3**: `legacy/downloadExcel.ts` — DataTable alias
```typescript
// legacy/downloadExcel.ts
import type { Table } from '@tanstack/react-table';
import type { DownloadExcelOptions } from '../types';
import { exportToExcel } from '../exportToExcel';

/**
 * @deprecated DataTable buttonInfo.downloadAction 마이그레이션 alias.
 * 신규 코드는 exportToExcel() 사용 권장.
 * 최소 1 minor 버전 유지 (C-6, C-23).
 */
export function downloadExcel<TData>(
  table: Table<TData>,
  options?: DownloadExcelOptions
): void {
  exportToExcel(table, { scope: 'filtered', ...options });
}
```

**Step 4**: `index.ts` — public API re-export
```typescript
// src/index.ts
export { exportToExcel } from './exportToExcel';
export type { ExcelExportOptions, ExportScope, DownloadExcelOptions } from './types';
// legacy alias는 별도 export path: '@tomis/grid-export/legacy'
```

**Step 5**: `package.json` — 패키지 초기화 (G-001이 첫 Goal)
```json
{
  "name": "@tomis/grid-export",
  "version": "0.1.0",
  "license": "MIT",
  "exports": {
    ".": { "import": "./dist/index.mjs", "require": "./dist/index.cjs" },
    "./legacy": { "import": "./dist/legacy/downloadExcel.mjs", "require": "./dist/legacy/downloadExcel.cjs" }
  },
  "peerDependencies": {
    "xlsx": "^0.18.5",
    "@tanstack/react-table": "^8.0.0",
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

**Step 6**: `tsup.config.ts` — CJS+ESM dual build

### 11.3 위험 요소

| # | 위험 | 완화 |
|---|------|------|
| W1 | `GroupColumnDef` merge cells 계산 오류 — `header.isPlaceholder`/`colSpan` 해석 | `table.getHeaderGroups()` 2회 순회 + 행/열 좌표 산출 테스트 |
| W2 | 한국어 헤더 UTF-8 BOM 처리 — xlsx.writeFile은 UTF-8 기본. BOM 불필요 (Excel이 자동 감지) | xlsx@0.18.5 기본 UTF-8 확인 완료 — 별도 BOM 처리 불필요 |
| W3 | `table.getSelectedRowModel` 없는 환경 — TanStack v8 Table 인스턴스에는 항상 존재 (표준 API) | C-2 준수: TanStack 표준 API만 사용 |
| W4 | `topvel-grid-monorepo` 디렉토리 미존재 — Implementer가 신설해야 함 | Section 8.2 명시: 이 Goal이 신설. 조부모 `D:/project/topvel_project/` 실재 확인 |

---

## Section 12: 검증 계획

### 12.1 단위 테스트 시나리오

| 시나리오 | 검증 방법 |
|---------|---------|
| scope='filtered', 필터 적용된 3행 export | `getFilteredRowModel().rows.length === 3` + xlsx 파일 3행 확인 |
| scope='selected', 선택 2행 export | `getSelectedRowModel().rows.length === 2` + xlsx 2행 확인 |
| scope='all', 필터 무관 전체 export | `getCoreRowModel().rows.length` + xlsx 전체 행 확인 |
| 빈 데이터 (emptyBehavior='skip') | `console.warn` 호출 + 파일 미생성 |
| 빈 데이터 (emptyBehavior='empty') | 헤더만 있는 xlsx 파일 생성 |
| 다중행 헤더 GroupColumnDef | `ws['!merges']` 배열 존재 + colSpan 반영 |
| 한국어 헤더 ('부서명', '사원번호') | xlsx 파일 헤더 셀 값 === 원본 한국어 문자열 |
| fileName 확장자 없음 | 파일명 `.xlsx` 자동 추가 |
| scope='selected', 선택 0건 (emptyBehavior='skip') | 파일 미생성 |

### 12.2 시각 회귀

- **방법**: Storybook story (C-25 AC-008)
- **시나리오**: DataTable 렌더 + "엑셀 다운로드" 버튼 클릭 → 브라우저 다운로드 트리거 (시각 동작 확인)
- **migrationImpact: medium** → 시각 회귀 검증 의무 (C-13, C-17)
- **주의**: `data-table.tsx` 수정 없으므로 외관 회귀 위험 없음 — Storybook으로 alias 동작 검증으로 충분

### 12.3 빌드 검증

```bash
# grid-export 패키지
cd D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export
npx tsc --noEmit          # 0 error 필수 (AC-007, C-12)
npx tsup                  # CJS+ESM dual build

# 번들 크기 확인 (C-21)
# grid-export: +5 KB 이내 (gzipped) — grid-core 별도 패키지 무영향
```

### 12.4 마이그레이션 자동 보완

- `data-table.tsx`는 G-001에서 수정하지 않음 → 변환 불필요
- `downloadExcel` alias가 기존 `listAction(downloadAction, '')` 패턴을 흡수 → 실제 변환은 MOD-GRID-17

---

## Section 13: 상용 제품화 영향

### 패키지 분류
- **패키지**: `packages/grid-export` — **MIT (Open Tier)**
- `licenseTier: 'MIT'` — canonical-modules.json MOD-GRID-06 직접 확인

### 라이선스 검증
- **불필요** (MIT 패키지 — C-24 F-02 N/A)
- `package.json`에 `"license": "MIT"` + `LICENSE` 파일 생성 (C-24 의무)
- `configureGridLicense()` 호출 불필요

### 문서화 계획 (C-25)

| 문서 | 경로 | 내용 |
|------|------|------|
| Docusaurus 페이지 | `apps/docs/docs/grid-export/excel.md` | API reference + 사용 예시 2개 (기본/고급) |
| Storybook story | `packages/grid-export/src/exportToExcel.stories.tsx` | 기본 export + scope interactive 시나리오 (AC-008) |
| README.md | `packages/grid-export/README.md` | 패키지 개요 + 빠른 시작 + peerDeps 안내 |

### ADR 의무 (C-9, C-20)

본 패키지 신설로 `xlsx`를 peerDependency로 추가. 다음 ADR을 `decisions/MOD-GRID-06-decisions.md`에 작성 의무:
- **ADR-MOD-GRID-06-001**: xlsx peer 채택 (대안: sheetjs-ce / exceljs / native CSV 비교 + trade-off 2개 이상)
- 라이선스 확인: xlsx@0.18.5 — Apache-2.0/MIT (공식 확인 필요)
- 번들 영향: `+5 KB gzipped` (peer이므로 grid-export 자체 번들에는 미포함)
