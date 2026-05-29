# G-002 Implement Report: Storybook (모든 패키지) — story 최소 1개/컴포넌트 + 대용량 시나리오

**Goal ID**: MOD-GRID-99-B / G-002  
**Implementer**: tw-grid Implementer (sonnet)  
**Date**: 2026-05-15  
**Status**: COMPLETE  

---

## 변경 파일 목록 (15/16)

| # | 파일 경로 | 변경 유형 | 비고 |
|---|-----------|-----------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/.storybook/main.ts` | NEW | Storybook 8 + @storybook/react-vite |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/.storybook/preview.ts` | NEW | CSS import 0건 (C-5, D8) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/package.json` | MODIFY | Storybook devDeps 4개 + scripts 2개 추가 |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/stories/Grid.stories.tsx` | NEW | Grid, PageSizeSelect, TotalCount, ColumnVisibilityMenu story |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/stories/Grid.virtualized.stories.tsx` | NEW | 1000행/5000행 가상화 시나리오 (C-18, AC-002) |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/stories/Cells.stories.tsx` | NEW | 12개 Cell 컴포넌트 각 story (AC-003) |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/stories/Export.stories.tsx` | NEW | exportToExcel/CSV/Pdf/copy/print 5개 함수 데모 (D6) |
| 8 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/stories/Features.stories.tsx` | NEW | 11개 컴포넌트 story (TextFilter/NumberFilter/DateFilter/SelectFilter/GlobalSearchInput/FilterResetButton/FilterPopover/FilterIndicator/SortBadge/SortClearButton/DropIndicator) |
| 9 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/stories/ChangeTracking.stories.tsx` | NEW | ChangeTrackingGrid story |
| 10 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/stories/RangeSelect.stories.tsx` | NEW | RangeSelectGrid story |
| 11 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/stories/DataMap.stories.tsx` | NEW | DataMapCell + DataMapEditor story (createDataMap 사용) |
| 12 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/stories/Merging.stories.tsx` | NEW | MergingGrid story (enableMerging + computeMergeSpans 시나리오) |
| 13 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/stories/GroupedHeader.stories.tsx` | NEW | MultiRowHeader story (createColumnGroup 2단 헤더) |
| 14 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/stories/Aggregation.stories.tsx` | NEW | AggregationGrid + GroupPanel story |
| 15 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/stories/MasterDetail.stories.tsx` | NEW | MasterDetailGrid + ContextMenuGrid story |
| 16 | `D:/project/topvel_project/topvel-grid-monorepo/.claude/tw-grid/decisions/MOD-GRID-99-B-decisions.md` | NO-OP | ADR-005 + ADR-006 이미 존재 (G-001 implement 시 사전 추가됨) — 수정 불필요 |

---

## specCodeDefects (C-35 + C-30)

| ID | 위치 | 결함 | 처리 |
|----|------|------|------|
| PSD-001 | spec Section 2-1 glob | `../../packages` → `apps/packages/` (미존재 디렉토리). 올바른 경로: `../../../packages` (apps/docs/.storybook 기준 3단계 상위 → monorepo root/packages) | C-30 executable 권위: `../../../packages` 채택. main.ts에 근거 주석 명시. |

---

## promptSpecDrift

해당 없음 (메인 prompt 코드 블록과 spec 본문 간 충돌 없음).

---

## AC 이행 현황

| AC | 상태 | 비고 |
|----|------|------|
| AC-001 | PASS | 11개 패키지 모든 export Component에 최소 1개 story. grid + grid-license 면제 (D5). |
| AC-002 | PASS | `Grid.virtualized.stories.tsx` — Virtualized1000Rows + Virtualized5000Rows. `enableVirtualization: true, virtualScrollHeight: 600` (types.ts L585/L593 확인). |
| AC-003 | PASS | `Cells.stories.tsx` — 12개 Cell 각각 named Story export (TextCell/NumberCell/DateCell/StatusBadgeCell/LinkCell/ButtonCell/CheckCell/IconCell/TagCell/AvatarCell/ProgressCell/EditableCell). |
| AC-004 | PASS | 7개 grid-pro-* 패키지 story 파일 존재. 핵심 Component story 커버. |
| AC-005 | DEFERRED | pnpm install (Storybook devDeps) 미실행 — G-001 finding 동일. 파일 staged. |

---

## 주요 구현 결정

### 1. spec glob 오류 수정 (specCodeDefects[0])
spec Section 2-1: `'../../packages/*/stories/**/*.stories.@(ts|tsx)'` → 실제: `'../../../packages/*/stories/**/*.stories.@(ts|tsx)'`  
- `apps/docs/.storybook/main.ts` 기준 `../../packages` = `apps/packages/` (미존재)
- 올바른 경로: `../../../packages` = monorepo root의 `packages/`

### 2. File #16 (decisions.md) NO-OP
ADR-MOD-GRID-99-B-005 + ADR-MOD-GRID-99-B-006이 G-001 implement 단계에 이미 추가됨. 중복 수정 없음.

### 3. C-1 Read-first 준수
모든 패키지 `src/index.ts` + 주요 Props 타입 파일 Read 후 story 작성:
- grid-export: `exportToExcel(table, options?)` — Table<TData> 인자 확인
- grid-features: `GlobalSearchInput`, `FilterResetButton` — Table<TData> 인자 확인  
- grid-renderers: Cells 12개 named export 확인
- grid-pro-datamap: `createDataMap({ items, valuePath, displayPath })` — Record형 아님 확인
- grid-pro-master: `ContextMenuItem.onClick` signature 확인

### 4. C-3 예외 적용
모든 story 파일에 `// C-3 예외: mock 데이터는 Storybook stories에서만 허용 (D7 결정, ADR-006)` 주석 명시.

### 5. AC-005 deferred 사유
G-001 결론과 동일: `pnpm install` 미실행으로 Storybook devDeps (`storybook ^8.0.0`, `@storybook/react-vite ^8.0.0` 등) 미설치. `pnpm -F docs build-storybook` 실행 불가. 다음 단계에서 `pnpm install` 후 검증 가능.

---

## 자가 검증

- `.storybook/preview.ts` Grep `\.css` → 0 hits ✓ (C-5 준수)
- `Grid.virtualized.stories.tsx` Grep `enableVirtualization` → 3 hits ✓ (C-18 준수)
- `packages/*/stories/*.stories.tsx` 파일 수 → 12개 ✓ (PowerShell Get-ChildItem 확인)
- `.storybook/` 파일 수 → 2개 (main.ts + preview.ts) ✓
- decisions.md ADR-005 + ADR-006 → 이미 존재 (사전 추가됨) ✓

---

*구현 완료: 2026-05-15*  
*C-1 준수: 모든 패키지 src/index.ts + 주요 타입 파일 Read 후 story 작성*  
*C-3 준수: mock 데이터는 stories/ 파일에만 (production src/ 미포함)*  
*C-5 준수: preview.ts CSS import 0건*  
*C-18 준수: 1000행 + 5000행 가상화 story 포함*
