# MOD-GRID-06 / export / G-005 — Specification

**Goal ID**: MOD-GRID-06/export/G-005  
**Title**: 컬럼 필터/정렬 상태 반영 + 사용자 선택 행만 export (scope 통합 검증)  
**Priority**: P1  
**migrationImpact**: medium  
**packageTarget**: `packages/grid-export` (monorepo: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/`)  
**licenseTier**: MIT  
**Spec 작성일**: 2026-05-14  
**specVersion**: 1.0  
**rubricVersion**: 1.0.8  
**dependsOn**: `MOD-GRID-06/G-001`, `MOD-GRID-06/G-002`, `MOD-GRID-06/G-003`, `MOD-GRID-06/G-004`

---

## ★ 사전 결정 (D#)

| # | 결정 | 사유 |
|---|------|------|
| D1 | Goal 원본 JSON의 `internal/resolveRows.ts` 명칭은 **문서화된 편차 (documented deviation)** — 실제 파일은 `internal/getRowsByScope.ts` (G-002 추출 시 확정). spec에서 `getRowsByScope`를 정규 명칭으로 사용하며 `resolveRows`는 별칭(alias) 미생성 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/src/internal/getRowsByScope.ts` 직접 Read 확인 (2026-05-14). goals.json 원본 명칭 오류이므로 findings/에 기록 (D7 참조) |
| D2 | `EmptyBehavior` 타입을 **별도 export 타입**으로 `types.ts`에 추가 — `'skip' \| 'empty'`를 named type으로 선언하고 5개 Options 모두 이를 참조 | `types.ts` Read 확인: 현재 5개 Options 각자 `emptyBehavior?: 'skip' \| 'empty'` 리터럴 직접 선언 (중복). C-4 single source-of-truth 원칙에 따라 `EmptyBehavior` named type 1회 선언 후 5곳 참조로 통일 |
| D3 | 5개 Options 인터페이스의 `scope` + `emptyBehavior` 필드 일관성 사전 검증 결과: **모두 `ExportScope` + `'skip' \| 'empty'` 리터럴로 일치** — 동작 변경 불필요. 타입 참조만 `EmptyBehavior`로 일원화 | `types.ts` 전체 Read 완료 (2026-05-14): ExcelExportOptions(L27, L34), CSVExportOptions(L69, L81), PDFExportOptions(L116, L122), ClipboardOptions(L157, L164), PrintOptions(L188, L203) 모두 동일 scope/emptyBehavior 패턴 확인 |
| D4 | `getFilteredRowModel().rows`는 **정렬(sorting)도 포함** — TanStack v8에서 `getFilteredRowModel`은 필터 + 정렬이 모두 적용된 결과를 반환. `getSortedRowModel`을 별도 호출할 필요 없음 | TanStack v8 처리 파이프라인: `getCoreRowModel` → `getSortedRowModel` → `getFilteredRowModel` → `getPaginationRowModel` 순서. `getFilteredRowModel`은 이미 sorting 상태 반영. `getRowsByScope.ts` L18-19 현행 구현 정확함 확인 |
| D5 | 통합 Storybook story는 **신규 파일** `scopeIntegration.stories.tsx` — AC-005 충족. 기존 story 파일 수정 없음 | 기존 4개 story 파일(`copyToClipboard.stories.tsx`, `exportToPdf.stories.tsx` 등) 각각 단일 기능 테스트. scope 통합 시나리오(필터 적용 후 모든 export 함수)는 별도 파일로 분리하는 것이 목적 명확화에 유리 |
| D6 | `EmptyBehavior` 타입 추가 + 5개 Options에서 참조 변경은 **non-breaking** — `emptyBehavior?: EmptyBehavior` 와 `emptyBehavior?: 'skip' \| 'empty'`는 타입 시스템 상 완전 동등. 외부 사용자 코드 변경 불필요 | 리터럴 타입 `'skip' \| 'empty'`와 동일 리터럴 union의 named alias `EmptyBehavior`는 TypeScript 구조적 타이핑으로 호환. breaking change 없음 — C-6 준수 |
| D7 | goals.json 명칭 편차 기록: `findings/documented-deviations/MOD-GRID-06-G005-resolveRows-vs-getRowsByScope.md` 신규 작성 | C-28 spirit 준수 — goals.json과 실제 구현 사이의 편차를 추적 가능하게 문서화. goals.json 직접 수정은 이 spec 범위 밖 (통합 검증 Goal이므로 discover 단계 아님) |
| D8 | 구현 대상: **MODIFY 1개** (`types.ts`: `EmptyBehavior` 추가 + 5개 Options 참조 변경) + **MODIFY 1개** (`index.ts`: `EmptyBehavior` export 추가) + **NEW 1개** (`scopeIntegration.stories.tsx`) + **NEW 1개** (findings 문서) = **총 4파일** | D1~D7 결론. 5개 export 함수 파일(exportToExcel.ts, exportToCSV.ts, exportToPdf.ts, copyToClipboard.ts, printGrid.ts) + `getRowsByScope.ts`는 **수정 없음** (scope/emptyBehavior 동작 이미 정확 — D3/D4 확인) |
| D9 | C-28 경로 정합성: 모든 파일 경로는 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/...` prefix 사용 | goals.json의 TOMIS/packages/ prefix 오류 패턴 — 본 spec Section 7 final 표가 권위적 경로 정의 |

---

## Section 1: 참조 추적

### L0 (현 구현): G-001~G-004 완성 코드

**5개 export 함수 파일 Read 완료 (2026-05-14)**:

| 파일 | scope/emptyBehavior 처리 | getRowsByScope 호출 |
|------|------------------------|-------------------|
| `exportToExcel.ts` L127-138 | `scope='filtered'` default, `emptyBehavior='skip'` default | L132 ✅ |
| `exportToCSV.ts` L51-64 | `scope='filtered'` default, `emptyBehavior='skip'` default | L58 ✅ |
| `exportToPdf.ts` L39-73 | `scope='filtered'` default, `emptyBehavior='skip'` default | L69 ✅ |
| `copyToClipboard.ts` L42-51 | `scope='filtered'` default, `emptyBehavior='skip'` default | L45 ✅ |
| `printGrid.ts` L26-40 | `scope='filtered'` default, `emptyBehavior='skip'` default | L34 ✅ |

**`getRowsByScope.ts` Read 완료**: scope별 분기 정확 (`getCoreRowModel`/`getFilteredRowModel`/`getSelectedRowModel`).  
**`types.ts` Read 완료**: `EmptyBehavior` named type 미존재 — 5곳 모두 리터럴 직접 선언 (D2 개선 대상).

### L1 (TanStack v8 API)

TanStack v8 Row Model 파이프라인 (정렬 포함 순서):
```
getCoreRowModel → getSortedRowModel → getFilteredRowModel → getPaginationRowModel
```
- `getFilteredRowModel().rows` = **정렬 + 필터 모두 반영** (AC-001 근거)
- `getSelectedRowModel().rows` = 선택 행 (정렬 상태 기준 인덱스)
- `getCoreRowModel().rows` = 원본 순서 (필터/정렬 미반영)

### L2 (G-001~G-004 산출물)

- `G-001-spec.md` D7: `ExportScope`는 types.ts single source-of-truth 예고
- `G-002-spec.md`: `getRowsByScope` 추출 결정 — `resolveRows` 명칭이 goals.json에 있으나 실제 구현은 `getRowsByScope`
- `G-003-spec.md`: PDFExportOptions에 `scope` + `emptyBehavior` 추가
- `G-004-spec.md` D2: `ClipboardOptions`, `PrintOptions`에 동일 `emptyBehavior?: 'skip' | 'empty'` 리터럴 사용

### L3 (AS-IS Oracle 참조)

N/A — scope 통합 검증은 신규 기능. Oracle 프로시저 대응 없음.

### R-A (상용 제품 참조)

- **AG Grid** `excelExportParams.onlySelected` / `exportedRows: 'filteredAndSorted'`: scope 구분 패턴 참조. 명칭은 자체 정의.
- **FlexGrid** `xlsxSaveAsync({ scope: 'Selection' })`: selected scope 패턴 확인.

---

## Section 2: API 계약

### 2.1 신규 타입: `EmptyBehavior`

```ts
/** export 시 데이터 행 0건 동작 — 5개 Options 공유 single source-of-truth (G-005 D2) */
export type EmptyBehavior = 'skip' | 'empty';
```

**추가 위치**: `types.ts` 최상단 `ExportScope` 직후 (L3 이후).

### 2.2 5개 Options 인터페이스 일관성 검증표

현재 → 변경 후:

| Options 인터페이스 | 현재 emptyBehavior 타입 | 변경 후 |
|--------------------|------------------------|---------|
| `ExcelExportOptions` | `'skip' \| 'empty'` (L34) | `EmptyBehavior` |
| `CSVExportOptions` | `'skip' \| 'empty'` (L81) | `EmptyBehavior` |
| `PDFExportOptions` | `'skip' \| 'empty'` (L122) | `EmptyBehavior` |
| `ClipboardOptions` | `'skip' \| 'empty'` (L164) | `EmptyBehavior` |
| `PrintOptions` | `'skip' \| 'empty'` (L203) | `EmptyBehavior` |

**scope 필드 현황**: 5개 모두 `scope?: ExportScope` — 이미 단일 타입 참조. 변경 불필요.

### 2.3 `getRowsByScope` (변경 없음)

```ts
// internal/getRowsByScope.ts — 이미 정확, 수정 없음
export function getRowsByScope<TData>(
  table: Table<TData>,
  scope: ExportScope,
): Row<TData>[] {
  if (scope === 'all')      return table.getCoreRowModel().rows;
  if (scope === 'selected') return table.getSelectedRowModel().rows;
  // 'filtered' — TanStack 파이프라인상 정렬 포함 (D4)
  return table.getFilteredRowModel().rows;
}
```

### 2.4 `index.ts` 추가 export

```ts
export type { EmptyBehavior } from './types';
```

---

## Section 3: 기존 사용처 대응표

N/A — `EmptyBehavior` 타입 변경은 타입 시스템 상 완전 투명 (D6). 기존 사용처 코드 변경 불필요.  
**영향 사용처 수**: 0 (grid-export 패키지 외부 미사용 — G-001~G-004 신규 패키지).

---

## Section 4: 호환성 정책

| 항목 | 값 |
|------|-----|
| Breaking change | 없음 — `EmptyBehavior = 'skip' \| 'empty'`는 기존 리터럴과 구조적 동일 |
| Deprecation 단계 | 없음 |
| semver 영향 | patch (타입 alias 추가만) |
| C-6 준수 | ✅ — 기존 사용처 코드 일괄 변경 불필요 |

---

## Section 5: 인수 기준

| AC | 설명 | 출처 | 검증 방법 |
|----|------|------|----------|
| AC-001 | `scope='filtered'` → `getFilteredRowModel().rows` 사용. 정렬 반영 (TanStack 파이프라인 D4 확인) | Goal JSON AC-001 | `getRowsByScope.ts` L18-19 코드 인용 + TanStack 파이프라인 문서 |
| AC-002 | `scope='selected'` → `getSelectedRowModel().rows`. 선택 0행 시 `emptyBehavior` 옵션 적용 | Goal JSON AC-002 | `getRowsByScope.ts` L15-16 + 5개 함수 emptyBehavior 분기 코드 인용 |
| AC-003 | `scope='all'` → `getCoreRowModel().rows` (필터/정렬 미반영 원본 순서) | Goal JSON AC-003 | `getRowsByScope.ts` L12-13 코드 인용 |
| AC-004 | 5개 Options(`ExcelExportOptions` / `CSVExportOptions` / `PDFExportOptions` / `ClipboardOptions` / `PrintOptions`) 모두 동일 `scope?: ExportScope` + `emptyBehavior?: EmptyBehavior` 필드 | Goal JSON AC-004, C-4 | `types.ts` 수정 후 5개 인터페이스 필드 grep 확인 |
| AC-005 | 통합 Storybook story: 필터 적용 후 모든 export 시나리오 포함 | Goal JSON AC-005, C-25 | `scopeIntegration.stories.tsx` 파일 존재 + story export 함수 확인 |
| AC-006 | `tsc --noEmit` 0 errors | Goal JSON AC-006, C-12 | 빌드 출력 확인 |

---

## Section 6: 엣지 케이스

| # | 케이스 | emptyBehavior 동작 |
|---|--------|-------------------|
| EC-001 | `scope='selected'`, 선택 행 0개 (emptyBehavior='warn') | `console.warn` + 함수 종료. **주의**: 현재 5개 함수는 `emptyBehavior='skip'`시 warn + return, `'empty'`시 헤더만 처리. 'warn' 값은 현재 Options 타입에 없음 (Goal JSON AC-002의 'warn' 언급은 console.warn 동작 설명이며 별도 enum 값이 아님 — D2 EmptyBehavior = 'skip' \| 'empty' 확정) |
| EC-002 | `scope='selected'`, 선택 행 0개 (emptyBehavior='skip') | `console.warn('[grid-export] ...: 내보낼 데이터가 없습니다.')` + 즉시 return — 5개 함수 현행 구현 동일 패턴 확인 |
| EC-003 | `scope='selected'`, 선택 행 0개 (emptyBehavior='empty') | 헤더만 있는 파일/클립보드/인쇄 팝업 생성. 각 함수 `rows.length === 0` 분기를 통과하여 헤더 + 빈 body 생성 |
| EC-004 | `scope='filtered'`, 모든 행이 필터 아웃 (0행) | EC-002/EC-003과 동일 emptyBehavior 분기 — `getFilteredRowModel().rows` 빈 배열 반환 시 동일 처리 |
| EC-005 | 정렬 적용 후 export 순서 확인 | `getFilteredRowModel().rows` 순서 = TanStack 정렬 파이프라인 최종 순서. export 결과와 그리드 렌더 순서 일치 보장 (D4) |
| EC-006 | `scope='all'` 시 필터/정렬 무시 확인 | `getCoreRowModel().rows` = 원본 데이터 배열 삽입 순서. 필터/정렬 상태와 무관하게 항상 동일 결과 |

**EC-001 보충**: Goal JSON AC-002에 등장하는 `emptyBehavior='warn'`은 현재 구현에 존재하지 않는 값입니다. `EmptyBehavior = 'skip' | 'empty'` 확정 (D2). `'skip'` 선택 시 `console.warn` 로그가 출력되므로 Goal 작성자의 의도와 합치합니다.

---

## Section 7: 구현 대상 파일

### D 결정 (명칭 정정)

**resolveRows.ts vs getRowsByScope.ts**: goals.json 원본의 `internal/resolveRows.ts` 명칭은 현재 `internal/getRowsByScope.ts`로 구현됨 (G-002 spec D1 결정). 본 spec에서 `getRowsByScope`를 정규 명칭으로 채택. `resolveRows` alias 미생성 — 외부 export 없는 internal 헬퍼이므로 alias 불필요.

### 최종 구현 파일 표 (권위적 정의 — C-30)

| # | 파일 경로 (monorepo 기준) | 액션 | 변경 내용 |
|---|--------------------------|------|----------|
| 1 | `packages/grid-export/src/types.ts` | MODIFY | `EmptyBehavior` 타입 추가 (L3 이후). 5개 Options의 `emptyBehavior?` 필드 타입을 `'skip' \| 'empty'` 리터럴에서 `EmptyBehavior` 참조로 변경 |
| 2 | `packages/grid-export/src/index.ts` | MODIFY | `EmptyBehavior` 타입 export 추가 |
| 3 | `packages/grid-export/src/scopeIntegration.stories.tsx` | NEW | 통합 Storybook story — 필터/정렬 적용 상태에서 5종 export 시나리오 (AC-005, C-25) |
| 4 | `packages/grid-export/findings/documented-deviations/MOD-GRID-06-G005-resolveRows-vs-getRowsByScope.md` | NEW | goals.json `resolveRows` 명칭 vs 실제 `getRowsByScope` 편차 문서 (D7) |

**수정 없음 파일** (G-001~G-004 구현 이미 정확):
- `src/internal/getRowsByScope.ts` — scope 분기 정확, 정렬 포함 확인 (D4)
- `src/exportToExcel.ts` / `src/exportToCSV.ts` / `src/exportToPdf.ts` / `src/copyToClipboard.ts` / `src/printGrid.ts` — emptyBehavior 분기 일관성 확인 (D3)

**전체 경로 prefix**: `D:/project/topvel_project/topvel-grid-monorepo/` (C-28/D9)

---

## Section 8: Preflight

### 영향 분석

| 항목 | 값 |
|------|-----|
| 영향 사용처 파일 수 | 0 (grid-export 신규 패키지 — 외부 사용처 없음) |
| 무파괴 여부 | ✅ — EmptyBehavior alias는 타입 동일성 유지 (D6) |
| G-001~G-004 회귀 위험 | 없음 — 5개 함수 파일 수정 없음 |

### 점진/롤백/번들

- **점진**: 타입 alias 변경만 — 1개 커밋으로 원자적 적용 가능
- **롤백**: `EmptyBehavior` alias를 `'skip' | 'empty'` 리터럴로 되돌리면 즉시 원상복구
- **번들 영향**: 0 — 타입만 변경, 런타임 코드 추가 없음

### C-30 자가 검증

본 spec 내 재결정 표현 grep:
- "D1": resolveRows → getRowsByScope 정정 — Section 7 final 표에 미반영 (getRowsByScope.ts가 MODIFY 없음으로 정확히 반영) ✅
- "D2": EmptyBehavior 추가 — Section 7 final 표 #1 (types.ts MODIFY) 반영 ✅
- "D5": scopeIntegration.stories.tsx 신규 — Section 7 final 표 #3 반영 ✅
- "D7": findings 문서 — Section 7 final 표 #4 반영 ✅

모순 없음.

---

## Section 9: 의존성

| 항목 | 변경 |
|------|------|
| peerDependencies 변경 | 없음 |
| dependencies 변경 | 없음 |
| ADR 필요 | 없음 (타입 alias 추가 — 라이브러리 추가 없음, C-9/C-20 N/A) |
| 기존 peer: `@tanstack/react-table`, `xlsx`, `jspdf` | 유지 |

---

## Section 10: 사용자 여정

### 개발자 관점

G-005 이후 개발자는 5종 export 함수에서 동일한 `scope`/`emptyBehavior` 타입을 사용:

```ts
import type { ExportScope, EmptyBehavior } from '@tomis/grid-export';

// 어떤 export 함수든 동일 타입 — IDE 자동완성 일관
const opts = { scope: 'selected' as ExportScope, emptyBehavior: 'skip' as EmptyBehavior };
exportToExcel(table, opts);
exportToCSV(table, opts);   // 동일 opts 재사용 가능
```

### 사용자(최종 사용자) 관점

필터 적용 후 Excel/CSV/PDF/클립보드/인쇄 중 어느 export를 선택하든 동일한 필터된 + 정렬된 행이 export됨. scope='selected' 선택 시 그리드에서 체크박스로 선택한 행만 export.

---

## Section 11: 구현 계획

```
1. types.ts MODIFY
   → ExportScope 선언 직후 EmptyBehavior 타입 추가
   → 5개 Options 인터페이스 emptyBehavior 타입 변경 (리터럴 → EmptyBehavior 참조)
   → verify: tsc --noEmit 0 errors

2. index.ts MODIFY
   → EmptyBehavior export 추가
   → verify: index.ts에 EmptyBehavior 포함 확인

3. scopeIntegration.stories.tsx NEW
   → 필터/정렬 상태 테이블 setup
   → scope='filtered' + scope='selected' + scope='all' 별 5종 export 버튼 시나리오
   → verify: story export 함수 최소 3개, tsc 통과

4. findings 문서 NEW (D7)
   → resolveRows vs getRowsByScope 편차 기록
   → verify: 파일 존재

5. tsc --noEmit 전체 확인 (C-12, AC-006)
```

### 위험 표

| 위험 | 가능성 | 대응 |
|------|--------|------|
| EmptyBehavior alias가 기존 코드와 타입 불일치 | 낮음 | D6 확인: 구조적 동일. tsc로 즉시 검출 |
| scopeIntegration.stories.tsx에서 getSelectedRowModel 호출 시 enableRowSelection 누락 | 중간 | story setup에 `enableRowSelection: true` + `state: { rowSelection }` 명시 (copyToClipboard.stories.tsx L130-132 패턴 참조) |

---

## Section 12: 검증 계획

### 단위 검증 매트릭스

| 함수 | scope='all' | scope='filtered' | scope='selected' (0행) | scope='selected' (n행) |
|------|------------|----------------|----------------------|----------------------|
| exportToExcel | getCoreRowModel ✓ | getFilteredRowModel ✓ | emptyBehavior 분기 ✓ | getSelectedRowModel ✓ |
| exportToCSV | ✓ | ✓ | ✓ | ✓ |
| exportToPdf | ✓ | ✓ | ✓ | ✓ |
| copyToClipboard | ✓ | ✓ | ✓ | ✓ |
| printGrid | ✓ | ✓ | ✓ | ✓ |

**검증 방법**: G-001~G-004 구현 코드 Read 증거 (이미 완료 — Section 2.2 표). 신규 단위 테스트 파일 작성 불필요 (범위 외 — 본 Goal은 통합 정합성 검증).

### Storybook 검증 (AC-005)

`scopeIntegration.stories.tsx`:
- Story 1: 필터 키워드 입력 후 exportToExcel (scope='filtered') → 필터된 행만 다운로드 확인
- Story 2: 행 선택 후 exportToCSV (scope='selected') → 선택 행만 다운로드 확인
- Story 3: 정렬 적용 후 copyToClipboard (scope='filtered') → 정렬 순서 반영 확인

### 빌드 검증 (AC-006)

```bash
cd D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export
npx tsc --noEmit
```

기대 출력: 0 errors.

---

## Section 13: 상용 제품화 영향

| 항목 | 내용 |
|------|------|
| 패키지 | `@tomis/grid-export` (MIT Open) |
| 라이선스 변경 | 없음 |
| semver | patch (타입 alias 추가만) |
| ADR 필요 | 없음 (외부 라이브러리 추가 없음 — C-9/C-20 N/A) |
| CHANGELOG | `EmptyBehavior` 타입 export 추가 (named type — 타입 품질 개선) |
| Docusaurus 문서 | scope/emptyBehavior 통합 가이드 페이지 추가 권장 (C-25): 5종 export 함수의 scope 동작 비교표 + 코드 예시 |
| Storybook | `@tomis/grid-export/scope-integration` story 경로로 게시 |

---

## ★ 핵심 결정 요약 (단일 라인)

`getRowsByScope`를 정규 명칭으로 확정(resolveRows 편차 documented-deviations 기록) / `EmptyBehavior = 'skip | empty'` named type을 types.ts에 추가해 5개 Options 중복 리터럴 일원화 / 5개 Options scope+emptyBehavior 필드 이미 일관성 확인으로 함수 파일 수정 없음 / 변경 파일 최소(MODIFY 2 + NEW 2).
