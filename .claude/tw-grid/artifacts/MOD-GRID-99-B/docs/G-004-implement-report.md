# G-004 Implement Report

**Goal**: MOD-GRID-99-B / G-004  
**Implementer**: tw-grid Implementer Agent  
**Date**: 2026-05-15  
**Status**: COMPLETE — 5/5 파일 생성

---

## 구현 파일 목록 (5/5)

| # | 파일 경로 | AC | 상태 |
|---|----------|---|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docs/migration/8-variant-table.md` | AC-001 | NEW ✅ |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docs/migration/dataTable-migration.md` | AC-002 | NEW ✅ |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docs/migration/incremental-strategy.md` | AC-003 | NEW ✅ |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docs/migration/live-demos.md` | AC-004 | NEW ✅ |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docs/migration/deprecated-aliases.md` | AC-005 | NEW ✅ |

---

## C-1 Read 증거 (실제 파일 직접 확인)

구현 전 다음 파일들을 직접 Read 도구로 확인했다:

| 확인 파일 | 인용된 주요 정보 |
|----------|----------------|
| `tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx` | Props: `data, columns, pagination?, rowSelection?, onRowClick?, onRowDoubleClick?, loading, emptyText, className` |
| `tw-framework-front/src/components/tomis/Grid/VirtualGrid.tsx` | 추가 Props: `rowHeight? = 40, containerHeight? = 500` (BaseGridProps 확장) |
| `tw-framework-front/src/components/tomis/Grid/TreeGrid.tsx` | Props: `data, columns, getSubRows?, expandAll? = false, onRowClick?, loading, emptyText, className` |
| `tw-framework-front/src/components/tomis/Grid/ColumnPinGrid.tsx` | Props: `data, columns, pinLeft? = [], pinRight? = [], pagination?, rowSelection?, onRowClick?, loading` |
| `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` | Props: `data, columns, onDataChange?, pagination?, loading, emptyText, className, enableChangeTracking? = false, rowKey?` |
| `tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` | 내용: `export { GroupedHeaderGrid } from '@tomis/grid-pro-header'` — 완전 이전 확인 |
| `tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | compat shim, `ChangeTrackingHandle`: `getChanges, resetChanges, addRow, deleteRow, commitChanges?` |
| `tw-framework-front/src/components/tomis/Grid/RangeSelectGrid.tsx` | Props: `data, columns, onRangeChange?, loading?, emptyText?, className?` |
| `tw-framework-front/src/components/DataTable/data-table-types.ts` | `ColumnInfo, ButtonInfo, RowActionInfo, AdditionalRowActionInfo` 실제 타입 정의 |
| `tw-framework-front/src/components/DataTable/data-table.tsx` | `DataTableProps` 전체: `pageingInfo, columnInfos, buttonInfo?, rowActionInfo?, listAction` |
| `topvel-grid-monorepo/packages/grid-core/src/index.ts` | legacy alias 5종 확인: `BaseGrid, VirtualGrid/Props, ColumnPinGrid/Props, GroupedHeaderGrid/Props, TreeGrid/Props` from `./legacy` |
| `G-004-spec.md` | Section 7 파일 목록, D1~D5 결정, FR-001~005, AC-001~005 |
| `constraints.md` | C-1, C-19, C-23, C-25, C-28, C-30, C-33 전체 확인 |

---

## AC 자가 검증 결과

| AC | 검증 방법 | 결과 |
|----|---------|------|
| AC-001 | `8-variant-table.md` 존재 + 8 변형 행 확인 + Grep 58 hits | ✅ PASS |
| AC-002 | `dataTable-migration.md` 존재 + 5개 변환 항목 + `mode="server"` 10 hits | ✅ PASS |
| AC-003 | `incremental-strategy.md` 존재 + C-19 언급 + MOD-GRID-17 인용 | ✅ PASS |
| AC-004 | `live-demos.md` 존재 + stackblitz.com embed 3개 + `<details>` fallback 3개 | ✅ PASS |
| AC-005 | `deprecated-aliases.md` 존재 + 5개 alias + C-23 규칙 명시 | ✅ PASS |

### 자가 검증 Grep 결과

```
Glob *.md in migration/ → 5 hits (✅ 5/5)
Grep (BaseGrid|VirtualGrid|...) in 8-variant-table.md → 58 hits (≥8 ✅)
Grep (mode="server"|manualPagination) in dataTable-migration.md → 10 hits (≥1 ✅)
Grep (stackblitz\.com|codesandbox\.io) in migration/ → 3 hits (≥3 ✅)
```

---

## promptSpecDrift

없음. 메인 prompt의 파일 목록 및 내용이 spec Section 7과 일치 확인.

**단, 한 가지 관찰**: spec Section 7 파일 #2는 `dataTable-migration.md`이나,
spec Section 4 FR-002는 `dataTable-migration.md`로 명시되어 있다.
spec Section 11 파일 구조도 `dataTable-migration.md`로 일치.
prompt가 `datatable.md` (또는 spec 명명 따름)으로 표현했으나,
spec 권위(C-27, C-33)에 따라 `dataTable-migration.md`로 구현. → spec 우선 적용 (drift 아님, 구현 정확).

---

## EC 처리 현황

| EC | 처리 방법 |
|----|---------|
| EC-01 | `deprecated-aliases.md`에 "grid-core alias 없음" 섹션 + TypeScript 에러 설명 |
| EC-02 | `dataTable-migration.md` 항목 1에 `type: 'custom'` → `ColumnDef.cell` renderer 예시 포함 |
| EC-03 | `incremental-strategy.md`에 Goal 분할 기준 + C-19 재인용 |
| EC-04 | `live-demos.md` 각 embed 직후 `<details>` fallback 정적 코드 블록 포함 (3개) |
| EC-05 | `8-variant-table.md` 섹션 7(ChangeTrackingGrid)에 "ref API 그대로 유지" 명시 |
| EC-06 | `8-variant-table.md` 섹션 2(VirtualGrid)에 "pagination prop 제거 권장" 명시 |

---

## D4 NOTE 반영

모든 문서 하단에 다음 NOTE를 포함:
> **사이드바 등록**: G-001(Docusaurus 설정) PR에서 `sidebars.ts`에 이 문서를 추가한다 (D4).

---

## 결과

**5/5 파일 완료. promptSpecDrift 없음.**
