# organizeSchedule Phase 1+2 마이그레이션 결과

- 작성일: 2026-05-18
- 작업 범위: Phase 1 (기본 Grid + Multi-row Header) + Phase 2 (EditableCell + ChangeTracking)
- 대상 파일: `D:/project/topvel_project/TBIZONE/publish/src/app/personal/commute-manage/organizeSchedule/page.tsx`
- 백업: `page.tsx.before-tw-grid-migration.bak` (publish NOT git repo — 백업 의무)

---

## 1. 변경 파일

| 파일 | 변경 | 비고 |
|------|------|------|
| `TBIZONE/publish/.../organizeSchedule/page.tsx` | Wijmo → tw-grid Phase 1+2 (669줄 → ~480줄) | 신규 본문 |
| `TBIZONE/publish/.../organizeSchedule/page.tsx.before-tw-grid-migration.bak` | Wijmo 원본 보존 | 30,042 bytes |

CSS 별도 파일 미생성 — `<style jsx global>` 블록 안에 schedule-grid 중앙정렬 등 최소 유지.

---

## 2. Wijmo API 사용 → tw-grid 매핑

| Wijmo API (원본 line) | tw-grid 매핑 | gap ID | 처리 단계 |
|----------------------|-------------|--------|----------|
| `import * as wjCore from '@mescius/wijmo'` (L8) | 제거 | G-1 | Phase 1 |
| `import * as wjGrid from '@mescius/wijmo.grid'` (L9) | 제거 | — | Phase 1 |
| `import { FlexGrid } from '@mescius/wijmo.react.grid'` (L7) | `import { Grid } from '@tomis/grid-core'` + `ChangeTrackingGrid` | — | Phase 1+2 |
| `useWijmoGridCrud` (L12, L418) | `ChangeTrackingGrid` ref + `getChangeSet()` | — | Phase 2 |
| `wjCore.Globalize.format(d, 'yyyy-MM')` (L38, L471) | 로컬 `formatYearMonth` / `formatYearMonthCompact` 함수 | G-1 | Phase 1 |
| `wjCore.CollectionView({trackChanges:true})` (L99) | `ChangeTrackingGrid` 내부 `useChangeTracking` | — | Phase 2 |
| `wjGrid.AllowMerging.ColumnHeaders` (L92) | TanStack `isPlaceholder` 자동 (Grid.tsx:339-341) | G-5 | Phase 1 (D 이미 커버) |
| `hdr.rows.push(new wjGrid.Row())` + `setCellData` (L111-135) | `createColumnGroup({header: '01', columns: [{id: 'd1', header: () => <span>일</span>}]})` | G-4 | Phase 1 (C application) |
| `wjGrid.AllowSorting.None` (L94, L600) | `enableSorting: false` per column | — | Phase 1 |
| `wjGrid.SelectionMode.CellRange` (L95) | **미적용** — drag-range selection 제거 (Phase 3 재설계) | — | Phase 3 deferred |
| `wjGrid.SelectionMode.Row` (L557, L575) | `rowSelection="single"` | — | Phase 1 |
| `wjGrid.HeadersVisibility.All/Column` (L94, L556) | tw-grid는 single thead, 단일 모드 — `Column`만 의미 있음 | — | Phase 1 (no-op) |
| `g.frozenColumns = 4` (L91) | **미적용** — Phase 3 (cellClassName + 컬럼 핀 옵션) | — | Phase 3 deferred |
| `g.formatItem.addHandler` (L182-244) | **미적용** — Phase 3 `cellClassName` callback | G-3 | Phase 3 deferred |
| `g.hostElement.addEventListener('keydown', ...)` + `g.startEditing(true)` (L252-284) | **미적용** — Phase 3 `onCellKeyDown` + `ref.startEditing()` | G-7 | Phase 3 deferred |
| `g.prepareCellForEdit.addHandler` (L287-300) | **`EditableCell` props** — `maxLength={4}` + `align="center"` + `stopPropagationOnKeyDown` | G-6 | Phase 2 |
| `g.cellEditEnded.addHandler` (L303-320) | `EditableCell` `onCommit` → `trackingRef.current.updateRow(emplNo, patch)` | — | Phase 2 |
| `g.hostElement.addEventListener('mousedown'/'mousemove'/'mouseup', ...)` (L323-352) | **미적용** — drag-range selection (Phase 3 재설계) | — | Phase 3 deferred |
| `host.addEventListener('contextmenu', ...)` (L356-374) | **UI 제거** — `applyAbbrevToSelection` (Phase 3 재설계) | — | Phase 3 deferred |
| `g.updatedLayout.addHandler(...)` (L169, L503, L509) | tw-grid 자체 리사이즈 처리 + 미적용 (필요 시 Phase 3 ResizeObserver) | G-8 | Phase 3 (선택) |
| 부서 그리드 `FlexGrid columns=[...]` (L548-559) | `<Grid columns={deptColumns} />` | — | Phase 1 |
| 근무유형 그리드 `FlexGrid columns=[...]` (L565-578) | `<Grid columns={workTypeColumns} />` | — | Phase 1 |
| 메인 스케줄 그리드 `FlexGrid initialized={mainGridInitialized}` (L593-602) | `<ChangeTrackingGrid columns={scheduleColumns} rowKey="emplNo" />` | — | Phase 1+2 |

**총 Wijmo API 사용**: ~21건 정의 + 다수 호출 → tw-grid 매핑 ~10건 (4건 활용), 5건 미사용/제거, 5건 Phase 3 deferred, 1건 UI 제거.

---

## 3. Phase 1 단계별 처리

| 단계 | 작업 | 결과 |
|------|------|------|
| 1.1 import 갱신 | `@mescius/wijmo*` 3건 제거 + `@tomis/grid-core` `Grid` + `GridHandle` + `@tomis/grid-pro-header` `createColumnGroup` + `@tomis/grid-pro-tracking` `ChangeTrackingGrid` + `@tomis/grid-renderers` `EditableCell` import | 완료 |
| 1.2 컬럼 정의 변환 | `mainColumns` (Wijmo Column[]) → `scheduleColumns` (4 fixed bare ColumnDef + 31 createColumnGroup) — `useMemo([daysInMonth, ymDate, editingCell])` | 완료 |
| 1.3 rowSpan 시각 보정 | **option (a) 채택** — TanStack `isPlaceholder`가 row 0에 empty `<th>` 렌더 (시각상 stacked 2 row); 사양상 정확. true rowSpan=2는 `<Grid>` thead 우회가 필요해 옵션 (a) 채택. CSS 별도 추가 없음. Playwright pixel-diff는 Phase 4 deferred. | 완료 — option (a) 명시 |
| 1.4 Grid 렌더 + 데이터 wiring | `<ChangeTrackingGrid>` 메인 + `<Grid>` 부서/근무유형 (총 3 grid). `key={yearMonth}` 보존 (월 변경 시 unmount/remount — 사이드 이펙트 정리). | 완료 |
| 1.5 검증 | **env 미준비 — typecheck 실행 불가** (§8 한계 L-1 참고) | 미실행 |

---

## 4. Phase 2 단계별 처리

| 단계 | 작업 | 결과 |
|------|------|------|
| 2.1 EditableCell + ChangeTracking 도입 | 모든 day cell에 `<EditableCell maxLength={4} align="center" stopPropagationOnKeyDown />` 인라인 렌더. `isEditing` state는 페이지 레벨 `useState<{rowId, colId} \| null>(null)` (Grid는 editing 소유 안 함 — callback-delegating). `onCommit` → `trackingRef.current?.updateRow(emplNo, {[colId]: newValue, actionType, workDate})`. | 완료 |
| 2.2 검증 | **env 미준비 — typecheck 실행 불가** | 미실행 |

저장 흐름: `handleSave` → `trackingRef.current.getChangeSet()` → `added/updated/removed` 분기 → `saveOrganizeSchedule({sysUserId, items})` 호출. Wijmo `useWijmoGridCrud.buildJson({mapping, validator})` 대체.

---

## 5. 검증

| 항목 | 결과 |
|------|------|
| TypeScript typecheck (`npm run` etc.) | **실행 불가** — 환경 미준비 (§8 L-1) |
| 브라우저 manual 검증 | **실행 불가** — dev server 기동 불가 (§8 L-1) |
| rowSpan 시각 보정 CSS | **option (a)** — placeholder의 default stacked 2-row 렌더 채택 (별도 CSS 추가 없음). Playwright pixel-diff Phase 4 deferred. |

---

## 6. 결과 체크리스트

- [x] Phase 1.1 import 갱신 (Wijmo 3건 → tw-grid 4 패키지)
- [x] Phase 1.2 컬럼 정의 변환 (fixed 4 + day 31 createColumnGroup)
- [x] Phase 1.3 rowSpan 시각 보정 — option (a) 채택, CSS 추가 없음, 알려진 한계 명시
- [x] Phase 1.4 Grid 렌더 (3 grid: dept + workTypes + schedule)
- [ ] Phase 1.5 검증 — **env 미준비** (truthful)
- [x] Phase 2.1 EditableCell (maxLength=4 + align=center + stopPropagationOnKeyDown) + ChangeTrackingGrid
- [ ] Phase 2.2 검증 — **env 미준비** (truthful)
- [x] Phase 3+4 deferred 명시 (page.tsx 내 주석 + 본 보고서 §7)
- [x] 백업 의무 이행 (`.bak` 파일)

---

## 7. Phase 3+4 deferred 내역

**Phase 3 (다음 cycle)**:
1. **G-3 cellClassName + rowClassName** (ADR-MOD-GRID-01-007) — 셀 상태별 배경:
   - 선택됨 → `bg-indigo-100 outline outline-1 outline-indigo-500`
   - 주말(일/토) + 미선택 → `bg-blue-50`
   - 값 있음 + 미선택 → `bg-yellow-50`
   - Grid props 이미 노출 (`types.ts` L558, L571) — 본 cycle은 wire-up만 미실행
2. **G-7 onCellKeyDown + ref.startEditing(rowId, colId)** (ADR-MOD-GRID-01-008) — 키 입력 시 자동 편집 시작:
   - `onCellKeyDown` 이미 props 노출 (`types.ts` L497) + `GridHandle.startEditing` optional 노출 (L190) — wire-up 미실행
   - 본 페이지의 `onStartEditing={(rowId, colId) => setEditingCell(...)}` 콜백은 이미 wiring 되어 있어 Phase 3 추가 작업은 `onCellKeyDown` 측 분기만 추가하면 됨
3. **drag-range selection + right-click "apply abbreviation" 메뉴** — Wijmo 특화. 재설계 필요:
   - 후보 1: 셀-레벨 multi-select state + `onContextMenu` + ref.updateRow() 루프
   - 후보 2: tw-grid 신 Goal — `selectionRange` API (rangeStart/rangeEnd + onSelectionChange)

**Phase 4 (다음 cycle)**:
- Playwright 시각 회귀 baseline (Wijmo bak vs tw-grid 비교)
- TanStack placeholder의 stacked-2-row 시각 vs Wijmo true rowSpan=2의 pixel 차이 baseline

---

## 8. 알려진 한계

| # | 한계 | 영향 |
|---|------|------|
| **L-1** | **`TBIZONE/publish` 환경 미준비** — `node_modules` 디렉토리 부재 + `package.json`에 `@tomis/grid-*` 의존성 미등록 + `wijmo-5.20251.40_KR/` (file dep) 디렉토리 부재. 결과: (a) `npm run lint` / typecheck 실행 불가 (b) `npm run dev` 실행 불가 (c) ADR-014 probe 의무 충족 불가. 본 마이그레이션은 **소스만** 작업. typecheck/runtime 검증은 환경 provision 이후 별도 사이클에서 수행. | **블로커 (검증 미실행)** |
| L-2 | publish NOT a git repo — git rollback 불가. 백업 파일 (`page.tsx.before-tw-grid-migration.bak`) 의존. | 중 — 백업으로 mitigate |
| L-3 | rowSpan=2 시각 보정 option (a) 채택 — TanStack placeholder의 default stacked 2-row는 시각상 두 빈 셀(row 0 placeholder + row 1 header) stack. Wijmo true rowSpan=2의 단일 셀과 픽셀 단위 차이 가능. true rowSpan은 `<Grid>` 의 thead 우회 필요 → fixed 4 cols는 tw-grid 통합 손상 → 미채택. Phase 4 visual regression baseline 필요. | 작음 — semantic 동일 |
| L-4 | drag-range selection + right-click "apply abbreviation to selection" 기능 미적용. Wijmo `selection`/`hitTest`/`deferUpdate` API 의존 — 직접 등가물 없음. UI는 page.tsx 에서 완전 제거 (placeholder 주석 보존). 사용자가 실제로 이 기능을 다중 셀에 입력하던 경우 일시적 회귀 발생. | **중 — Phase 3 재설계 필수** |
| L-5 | Phase 3 GapId G-3 (cellClassName per-cell 배경 색) 미적용 — 본 페이지는 셀이 모두 default 배경 (선택/주말/값 hint 없음). Wijmo는 셀 가시성에 의존하던 UX → 잠재적 사용자 혼란. Phase 3 즉시 처리 권장. | **중** |
| L-6 | Phase 3 GapId G-7 (키 입력 → auto startEditing) 미적용 — 본 페이지는 셀 클릭 시에만 편집 모드. Wijmo는 셀 선택 후 키 입력으로 곧장 편집 → 데이터 입력 속도 차이. EditableCell의 `onStartEdit`은 cellRenderer 의 `<div onClick>` 만 wire — 키보드 진입로 부재. | **중** |
| L-7 | 본 page.tsx 의 `frozenColumns: 4` (조/직책/성명/기본근무 sticky 좌측) 미적용 — Phase 3 `enableColumnPinning` + `defaultColumnPinning` props 사용 필요. 본 cycle 미적용. | 작음 |
| L-8 | `editingCell` state 변경이 `scheduleColumns` useMemo deps에 포함 — 매 셀 편집 진입/해제마다 컬럼 배열 전체 재생성. 31 day cols × N rows의 EditableCell 컴포넌트가 매번 re-mount될 가능성 → 성능 영향. 추후 useMemo refactoring 필요 (cell renderer가 editingCell ref 통해 access). | 작음 — N rows 작을 때 무시 가능 |
| L-9 | `MemberRow.deptCd`는 load callback에서 row에 저장되나 ChangeTracking이 추적하는 patch에 포함되지 않음. Wijmo는 `g.cellEditEnded`에서 `row.deptCd`를 row에 직접 mutate. 본 페이지는 load 시점부터 row에 deptCd 포함하여 보존. save payload에 deptCd가 포함되는지는 `mapping` 미정의로 인해 default (전체 row 그대로 전달) — Wijmo 원본의 `mapping.deptCd: (r) => r.deptCd` 와 효과적으로 동일. 단 validator 로직(`actionType` 필수 + `workTypeId` 필수 등) 은 본 cycle에 미 wire. 서버 측 validation 으로 위임. | 작음 — server-side validation 의존 |

---

## 9. 권고 다음 단계

1. **환경 provisioning** (블로커 L-1 해결):
   - `TBIZONE/publish/package.json` 에 `@tomis/grid-core`, `@tomis/grid-pro-header`, `@tomis/grid-pro-tracking`, `@tomis/grid-renderers` 의존성 추가 (workspace 또는 local file 경로)
   - `npm install` 실행 + `npx tsc --noEmit` 통과 확인
2. **Phase 3 wire-up** — G-3 cellClassName + G-7 onCellKeyDown + startEditing
3. **Phase 4 Playwright baseline** — Wijmo bak vs tw-grid pixel diff
4. **drag-range selection 재설계** — tw-grid 신 Goal 후보 (MOD-GRID-11 grid-pro-range G-002?)

---

## 부록 A — 본 cycle 변경 line 통계

- 원본 (`bak`): 669 lines, 30,042 bytes
- 신본 (`page.tsx`): 약 484 lines, ~16 KB
- 감소 비율: ~28% (Wijmo imperative wiring 제거로 인한 자연 감소)

## 부록 B — Phase 3+4 진행 시 사용 가능한 prop

`@tomis/grid-core` `GridProps<TData>` 이미 노출 (Phase 3 wire-up 만 필요):

| Prop | line | Phase 3 적용 위치 |
|------|------|------------------|
| `cellClassName: CellClassNameCallback<TData>` | types.ts L558 | `<ChangeTrackingGrid cellClassName={(cell) => ...}>` |
| `rowClassName: RowClassNameCallback<TData>` | types.ts L571 | (옵션) row 단위 marking |
| `onCellKeyDown` | types.ts L497 | char 입력 분기 |
| `onStartEditing` | types.ts L528 | 이미 wire되어 있음 (본 cycle 사용 중) |
| `GridHandle.startEditing(rowId, colId)?` | types.ts L190 | ref 통한 imperative call |

EditableCell props 이미 활용 (Phase 2 완료):
- `maxLength?: number` (L77)
- `align?: 'left' | 'center' | 'right'` (L84)
- `stopPropagationOnKeyDown?: boolean` (L93)
