# L3: AG Grid 공식 기능 매트릭스

**버전**: AG Grid 33.x (publish/package.json 기준)
**출처**:
- 1차: `WebFetch https://www.ag-grid.com/javascript-data-grid/feature-overview/` — **404 실패** (URL 변경 가능성)
- 2차: `WebFetch https://www.ag-grid.com/javascript-data-grid/grid-features/` — 부분 응답 (Community 5건만)
- 3차: AG Grid 33.x 공식 모듈 export + publish 코드 직접 검증 (보완)

⚠️ **확인 필요**: 본 표는 일반 지식 + publish 검증 기반. **이전 1차 출처가 실패**했으므로 ADR 작성 시 공식 docs 재확인 권장.

---

## 1. AG Grid Community (MIT, 무료) — 33.x 확정 모듈

publish의 `ModuleRegistry.registerModules([...])` 직접 확인 (AggridTable.tsx + AggridTreeTable.tsx):
- `ClientSideRowModelModule` — 클라이언트 행 모델
- `PaginationModule` — 페이지네이션
- `RowSelectionModule` — 행 선택
- `RowStyleModule`, `CellStyleModule` — 스타일
- `RowApiModule`, `ScrollApiModule`, `ColumnAutoSizeModule`
- Editor: `NumberEditorModule`, `TextEditorModule`, `SelectEditorModule`, `DateEditorModule`
- Filter: `NumberFilterModule`, `TextFilterModule`
- `ValidationModule`

---

## 2. 기능 매트릭스 — Community vs Enterprise

| Category | Feature | Community (MIT) | Enterprise (paid $999/dev/year) |
|----------|---------|---|---|
| **Selection** | Row selection (single/multiple) | ✅ | ✅ |
| | Checkbox selection | ✅ | ✅ |
| | Header checkbox (select all) | ✅ | ✅ |
| | Cell range selection | ❌ | ✅ |
| | Cell range copy/paste | ❌ | ✅ |
| **Editing** | In-cell text/number editor | ✅ (`agTextCellEditor`, `agNumberCellEditor`) | ✅ |
| | Date/Select editor | ✅ (`agDateCellEditor`, `agSelectCellEditor`) | ✅ |
| | Custom cell editor | ✅ | ✅ |
| | Full row editing | ✅ | ✅ |
| | Undo/Redo | ✅ | ✅ |
| | Fill handle (drag-fill) | ❌ | ✅ |
| **Filtering** | Text/Number/Date filter | ✅ | ✅ |
| | Quick filter (global) | ✅ | ✅ |
| | Floating filters | ✅ | ✅ |
| | Set filter (Excel-style) | ❌ | ✅ |
| | Multi filter | ❌ | ✅ |
| | Advanced filter (query builder) | ❌ | ✅ |
| **Sorting** | Single/Multi column sort | ✅ | ✅ |
| | Custom comparator | ✅ | ✅ |
| **Grouping** | Row grouping (자동) | ❌ | ✅ |
| | Tree data (parent-child) | ❌ | ✅ |
| | Custom tree (커스텀 renderer) | ✅ (publish 패턴) | ✅ |
| | Group/Ungroup via drag | ❌ | ✅ |
| **Aggregation** | Built-in aggFuncs (sum/avg/min/max) | ❌ | ✅ |
| | Custom aggFuncs | ❌ | ✅ |
| | Pivoting | ❌ | ✅ |
| **Export** | CSV export | ✅ | ✅ |
| | Excel export (XLSX native) | ❌ | ✅ |
| | Excel export (xlsx library 별도) | ✅ (외부 라이브러리) | ✅ |
| **Layout** | Column resize | ✅ | ✅ |
| | Column reorder (drag header) | ✅ | ✅ |
| | Column pinning (left/right) | ✅ | ✅ |
| | Row pinning (top/bottom) | ✅ | ✅ |
| | Auto-size columns | ✅ (`ColumnAutoSizeModule`) | ✅ |
| **Display** | Virtualization (rows) | ✅ | ✅ |
| | Column virtualization | ✅ | ✅ |
| | Cell renderer / framework component | ✅ | ✅ |
| | Sticky headers | ✅ | ✅ |
| | Cell merging | ❌ | ✅ (span values) |
| **Master-Detail** | Master-Detail (built-in) | ❌ | ✅ |
| | Row detail (모달 등 우회) | ✅ (custom) | ✅ |
| **Theming** | Built-in themes (Alpine/Balham/Material) | ✅ | ✅ |
| | Custom theme via CSS vars | ✅ | ✅ |
| **Tool Panel** | Sidebar columns/filters panel | ❌ | ✅ |
| | Status bar | ❌ | ✅ |
| | Context menu (built-in) | ❌ | ✅ |
| **Row Models** | Client-side (CSRM) | ✅ | ✅ |
| | Infinite | ❌ | ✅ |
| | Viewport | ❌ | ✅ |
| | Server-side (SSRM) | ❌ | ✅ |
| **Charts** | AG Charts integration | ❌ | ✅ (Enterprise integrated) |
| **Localization** | Locale text override | ✅ | ✅ |
| | RTL | ✅ | ✅ |
| **Accessibility** | ARIA roles | ✅ | ✅ |
| | Keyboard navigation | ✅ | ✅ |

⚠️ **확인 필요 항목**:
- `Sparkline cell` — Enterprise 추정
- `Excel-like keyboard` (F2 edit, Ctrl+C/V) — Community 확인 필요
- `Drag-and-drop rows` — Community 확인 필요

---

## 3. publish가 실제 사용하는 Community 기능 (코드 검증)

| 기능 | publish 위치 | 검증 |
|------|------------|------|
| Sort | `defaultColDef.sortable: true` (progress-dashboard L241) | ✅ |
| Filter | `defaultColDef.filter: true` (progress-dashboard L242) | ✅ |
| Resize | `defaultColDef.resizable: true` (progress-dashboard L243) | ✅ |
| Pagination | `PaginationModule` 등록 (AggridTable L11) | ✅ |
| Row selection single/multiple | `rowSelection?: "single"\|"multiple"` (AggridTable L45) | ✅ |
| Cell editing | NumberEditor/TextEditor/SelectEditor/DateEditor 등록 | ✅ |
| Cell value changed event | `onCellValueChanged` prop | ✅ |
| Row click event | `onRowClicked`, `onRowDoubleClick` | ✅ |
| Custom cell renderer (`components` map) | AggridTable L53 | ✅ |
| 트리 (커스텀 renderer로 community 회피) | AggridTreeTable `TreeCellRenderer` | ✅ |

→ **publish는 Community 기능만 사용**. Enterprise 라이선스 도입 흔적 없음.

---

## 4. 우리 추상화에서 채택할 ‘Community 수준’ 기능 (MIT 패키지 — grid-core)

| 기능 | 모듈 | 비고 |
|------|------|------|
| Sort/Filter/Pagination/Selection | MOD-GRID-01 wrapper | TanStack v8 표준 |
| Cell editing (text/number/date/select) | MOD-GRID-05 cell renderer | 기존 EditableGrid 흡수 |
| Column resize | MOD-GRID-01 | TanStack `columnResizeMode` |
| Column reorder (drag header) | MOD-GRID-07 (critical-gap) | columnOrder + dnd-kit |
| Column pinning | MOD-GRID-01 | 기존 ColumnPinGrid 흡수 |
| Virtualization | MOD-GRID-01 + react-virtual peer | C-18 |
| Custom cell renderer | MOD-GRID-05 | renderers/ 8개 흡수 |
| 트리 (custom) | MOD-GRID-16 | 기존 TreeGrid 흡수 |
| CSV export | MOD-GRID-06 | xlsx (open) |
| Excel/PDF export | MOD-GRID-06 (open + xlsx peer) | xlsx + jspdf |
| Multi-sort | MOD-GRID-08 (critical-gap) | enableMultiSort |
| Filter UI | MOD-GRID-09 (critical-gap) | 직접 구현 |
| Sticky headers | MOD-GRID-01 | CSS sticky |

---

## 5. ‘Enterprise 수준’이지만 자체 구현할 기능 (Pro 패키지 — 우리 EULA)

(Wijmo 분석서와 중복 — 통합 관점)

| 기능 | 모듈 | 출처 (AG Enterprise + Wijmo 두 vendor) |
|------|------|--------------------------------------|
| ChangeTracking (added/edited/deleted) | MOD-GRID-10 | Wijmo CollectionView |
| Cell Range Selection | MOD-GRID-11 | AG Enterprise + Wijmo CellRange |
| Drag-fill | MOD-GRID-11 | AG Enterprise fill handle |
| DataMap | MOD-GRID-12 | Wijmo DataMap |
| Cell merging | MOD-GRID-13 | AG Enterprise + Wijmo cell merging |
| Multi-row header | MOD-GRID-14 | TanStack `GroupColumnDef` (free) |
| Aggregation (group footer) | MOD-GRID-15 | AG Enterprise + Wijmo aggregation |
| Master-Detail | MOD-GRID-16 | AG Enterprise + Wijmo RowDetail |
| Context menu | MOD-GRID-16 | AG Enterprise |

---

## 6. 결론

- **TanStack v8 = AG Grid Community 대체 가능** (모든 free 기능 1:1 매핑 — UI만 자체 구현)
- **AG Grid Enterprise / Wijmo class 기능 = MOD-GRID-10~16 (6 wijmo-class + 1 enhancement)**
- 우리 pro 패키지의 가치 = AG Enterprise $999/dev/yr or Wijmo $695/user/yr 대체
- C-7 AG Grid 비도입 + C-16 Wijmo 비도입 — 둘 다 ADR (각 pro 모듈 decisions) 에 본 표 인용
