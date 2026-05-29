# Wave 3 — ADR-008 + ADR-016 구현 결과

**날짜**: 2026-05-17  
**상태**: completed  
**PR 묶음**: ADR-016 (onRowClick 시그니처 통일) + ADR-008 (tw-front grid.ts re-export)

---

## 요약

ADR-016 과 ADR-008 을 단일 Wave 3 PR 로 구현 완료. 총 12개 파일 변경, 0 typecheck errors (grid monorepo 14 패키지 + tw-framework-front ADR 관련).

---

## ADR-016: onRowClick 시그니처 통일

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/grid-core/src/types.ts:627` | `BaseGridProps.onRowClick` 1-arg → 2-arg |
| `packages/grid-core/src/legacy/ColumnPinGrid.tsx` | `onRowClick` 1-arg → 2-arg + `MouseEvent` import |
| `packages/grid-core/src/legacy/TreeGrid.tsx` | `onRowClick` 1-arg → 2-arg + `MouseEvent` import |
| `packages/grid-core/src/legacy/GroupedHeaderGrid.tsx` | `onRowClick` 1-arg → 2-arg + `MouseEvent` import |
| `packages/grid-pro-header/src/legacy/GroupedHeaderGrid.tsx` | `onRowClick` 1-arg → 2-arg + JSX `onClick={(e) => onRowClick?.(row.original, e)}` |
| `tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx` | JSX `onClick=(e) => ...onRowClick?.(row.original, e)` |
| `tw-framework-front/src/components/tomis/Grid/VirtualGrid.tsx` | JSX `onClick=(e) => ...onRowClick?.(row.original, e)` |
| `tw-framework-front/src/components/tomis/Grid/ColumnPinGrid.tsx` | `onRowClick` 1-arg → 2-arg + JSX event wiring |
| `tw-framework-front/src/components/tomis/Grid/TreeGrid.tsx` | `onRowClick` 1-arg → 2-arg + `MouseEvent` import + JSX event wiring |
| `tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | `onRowClick` 1-arg → 2-arg + `MouseEvent` import + JSX event wiring |

### 핵심 결정

- `event` 파라미터는 **required** (optional 아님) — `GridProps.onRowClick:390` canonical 시그니처와 일치.
- TypeScript contravariance 로 기존 1-arg 콜백 (예: `(row) => setSelected(row)`) 은 변경 없이 2-arg 위치에 할당 가능.
- grid-core legacy 3 파일은 `<Grid>` 에 props spread 위임 → JSX onClick 재wiring 불필요.
- JSX event 전달 필요 위치: 4개 (grid-pro-header/legacy/GroupedHeaderGrid, tw-front/BaseGrid, tw-front/VirtualGrid, tw-front/ChangeTrackingGrid).
- tw-front/TreeGrid 및 tw-front/ColumnPinGrid 는 독립 prop interface를 가지므로 타입 + JSX 양쪽 모두 변경 필요.

---

## ADR-008: tw-framework-front grid.ts → grid-core re-export

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `tw-framework-front/src/types/tomis/grid.ts` | `GridPaginationOptions`, `GridRowSelectionOptions`, `BaseGridProps`, `GridState` → `@tomis/grid-core` re-export |
| `tw-framework-front/src/components/tomis/Grid/ColumnPinGrid.tsx` | `rowSelection?: GridRowSelectionOptions` → `GridRowSelectionOptions<TData>` |
| `packages/grid-pro-header/src/legacy/GroupedHeaderGrid.tsx` | inline alias 제거 + `@tomis/grid-core` import + `rowSelection?: GridRowSelectionOptions<TData>` |
| `packages/grid-pro-header/package.json` | `@tomis/grid-core: workspace:*` dependency 신설 |

### 로컬 잔존 타입 (re-export 대상 아님)

- `CellRendererProps`, `CellRenderer` — grid-core 에 동등 타입 없음 (앱 렌더러 전용)
- `EditType`, `EditableColumnMeta` — EditableGrid 전용
- `RowChangeStatus`, `TrackedRow` — ChangeTrackingGrid 전용
- `ColumnGroup` — GroupedHeaderGrid 전용 helper
- `TreeGridProps` — 로컬 BaseGridProps 확장 (grid-core TreeGrid 와 shape 다름)

### LOC 절감

tw-framework-front `grid.ts`: 71 LOC → 47 LOC (~24 LOC 절감). grid-pro-header inline alias: 12 LOC 제거.

---

## Changeset

`.changeset/adr-008-016-onrowclick-types.md` — minor bump for `@tomis/grid-core` + `@tomis/grid-pro-header`.

---

## Typecheck 결과

| 대상 | 결과 |
|------|------|
| `pnpm --filter @tomis/grid-core typecheck` | ✅ 0 errors |
| `pnpm --filter @tomis/grid-pro-header typecheck` | ✅ 0 errors |
| `pnpm -r typecheck` (14 패키지) | ✅ 0 errors |
| `tw-framework-front npx tsc --noEmit` | ✅ ADR 관련 0 errors (pre-existing `PayReal01EditModal.tsx` TS1131 syntax error 무관) |

---

## 주의 사항

- `PayReal01EditModal.tsx:83` 에 pre-existing JSDoc 주석 `a*/b*` 파싱 오류 (TS1131) 존재 — ADR-008/016 과 무관, 별도 수정 필요.
- page-level `onSelectionChange` 콜백이 `(rows: unknown[]) => void` 로 작성된 경우 `(rows: TData[]) => void` 제네릭으로 타입 추론 변경 — 현재 0 errors 이나 수동 확인 권장.
