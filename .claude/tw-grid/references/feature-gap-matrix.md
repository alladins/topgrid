# 기능 갭 매트릭스 (L0/L1 현재 vs L2/L3 목표)

**정의**:
- **Already-have**: tw-framework-front 에서 이미 작동 (8 variant + DataTable)
- **Critical-gap**: AG Community / Wijmo 양쪽 다 제공하지만 tw-framework-front 미지원
- **Nice-to-have**: AG Enterprise / Wijmo 만 제공 — ERP UX 표준이지만 P1
- **TanStack-only**: TanStack v8 표준 표면 자체가 채워주지 못함 (자체 구현)

조사 일자: 2026-05-13. 사실 검증: 모든 행에 출처 경로 명시.

---

## 1. Already-have (8 variant + DataTable 직접 검증)

| 기능 | tw-framework-front 출처 | 상태 |
|------|------------------------|------|
| Sort (single) | BaseGrid L82 `getSortedRowModel` | ✅ |
| Filter (column-level, UI 없음) | BaseGrid L81, L99 `getFilteredRowModel` | ⚠️ state만 (UI 없음 — Critical-gap) |
| Pagination (client) | BaseGrid L100 `getPaginationRowModel` | ✅ |
| Pagination (server) | DataTable/data-table.tsx L369 `manualPagination: true` | ✅ |
| Row selection (single/multi) | BaseGrid L78-79 | ✅ |
| Checkbox header | BaseGrid L43-50 | ✅ |
| Loading skeleton | BaseGrid L108-137 | ✅ |
| Empty state | BaseGrid L170-178 | ✅ |
| Page size selector | BaseGrid L213-225 | ✅ |
| Virtualization | VirtualGrid.tsx + react-virtual | ✅ (1 variant만) |
| Inline cell editing (text/number/date/select) | EditableGrid.tsx | ✅ |
| ChangeTracking (added/edited/deleted) | ChangeTrackingGrid.tsx | ⚠️ (mapping/validator 없음 — 강화 필요) |
| Multi-row column header | GroupedHeaderGrid.tsx | ✅ |
| Tree (getSubRows) | TreeGrid.tsx | ✅ |
| Column pinning | ColumnPinGrid.tsx | ✅ |
| Cell range selection | RangeSelectGrid.tsx | ⚠️ (drag-fill 미구현) |
| Context menu | RangeSelectGrid.tsx L19 | ⚠️ (자체 구현, 일반화 안 됨) |
| Column resize | DataTable/data-table.tsx L108, L356 | ✅ (DataTable만 — tomis/Grid에는 없음) |
| Column visibility toggle | DataTable/data-table-view-options.tsx | ✅ (DataTable만) |
| Row actions menu | DataTable/data-table-row-actions.tsx | ✅ (DataTable만) |
| Type-based cell auto (checkbox/number/dateTime/text) | DataTable L242-339 | ✅ (DataTable만) |
| 8 renderers (Button/Badge/Check/Link/Number/Date/Icon) | Grid/renderers/ 8개 | ✅ |

**합계: 20 기능** (단 8 variant 단위로 흩어져 있음, 통합 wrapper 부재)

---

## 2. Critical-gap (AG Community/Wijmo 양쪽 제공, 우리 미지원)

| 기능 | AG Community? | Wijmo? | TanStack 지원? | 영향 모듈 |
|------|---------------|--------|--------------|---------|
| **Excel/PDF Export** | ❌ (CSV만) / 외부 lib | ✅ | ❌ (xlsx 별도) | MOD-GRID-06 |
| **컬럼 드래그 재정렬** (header drag) | ✅ | ✅ | △ (state만) | MOD-GRID-07 |
| **다중 정렬** (Shift+Click sort) | ✅ | ✅ | ✅ (enableMultiSort) — UI 없음 | MOD-GRID-08 |
| **Filter UI** (Excel-style/text/number popup) | ✅ | ✅ | ❌ (state만, UI 없음) | MOD-GRID-09 |
| Floating filters (row 아래 입력) | ✅ | ❌ | ❌ | MOD-GRID-09 |
| Global filter UI (search box) | ✅ | ✅ | △ (state만) | MOD-GRID-09 |
| Clipboard copy (선택 셀) | ✅ Community | ✅ | ❌ | MOD-GRID-11 |
| Keyboard navigation (Tab/Enter/방향키) | ✅ Community | ✅ | ❌ (직접 구현) | MOD-GRID-11 |

**합계: 8 기능** → MOD-GRID-06~09 (4개) + MOD-GRID-11 일부에 통합.

---

## 3. Nice-to-have / Wijmo-class (AG Enterprise + Wijmo 만 제공 — 자체 구현)

| 기능 | AG Enterprise? | Wijmo? | 영향 모듈 |
|------|---------------|--------|---------|
| **ChangeTracking with mapping/validator** | △ (Undo/Redo만) | ✅ (CollectionView) | MOD-GRID-10 |
| **Cell Range Selection (Excel-style)** | ✅ | ✅ | MOD-GRID-11 |
| **Drag-fill (셀 핸들 fill handle)** | ✅ | ✅ (`isDraggingRef` 흔적) | MOD-GRID-11 |
| **DataMap (셀 단위 lookup)** | ✅ (cell editor refData) | ✅ | MOD-GRID-12 |
| **Cell Merging (auto rowSpan)** | ✅ | ✅ | MOD-GRID-13 |
| **Multi-row Header (col group)** | ✅ | ✅ | MOD-GRID-14 (TanStack GroupColumnDef 활용) |
| **Aggregation (group footer / pivoting)** | ✅ | ✅ | MOD-GRID-15 |
| **Master-Detail (RowDetail)** | ✅ | ✅ | MOD-GRID-16 |
| Context Menu (built-in) | ✅ | ✅ | MOD-GRID-16 |

**합계: 9 기능** → MOD-GRID-10~16 (7개)에 통합.

---

## 4. TanStack-only (TanStack v8 표면이 채워주지 못함 — 자체 구현 필요)

| 기능 | 이유 | 영향 모듈 |
|------|------|---------|
| 통합 wrapper API | 8 variant 분산 | MOD-GRID-01 |
| useGridState 통합 훅 | 모든 variant가 5가지 state 직접 관리 (중복) | MOD-GRID-02 |
| Pagination 통합 (client+server) | manualPagination 옵션 직접 노출 안 됨 | MOD-GRID-03 |
| 컬럼 팩토리 (type 분기) | DataTable에만 있음 (`type: 'number'\|'dateTime'` 분기) | MOD-GRID-04 |
| 표준 cell renderer set | 8개 renderer 있지만 cell 사용 표준 부재 | MOD-GRID-05 |
| Mapping/Validator (서버 필드 변환) | TanStack은 모름 | MOD-GRID-10 |
| ChangeSet payload 표준 | 일관된 BE 계약 | MOD-GRID-10 |

---

## 5. 분류별 카운트

| 분류 | 카운트 | 모듈 |
|------|------|------|
| **Already-have** | 20 (variant 분산) | MOD-GRID-01 통합 대상 |
| **Critical-gap** | 8 | MOD-GRID-06, 07, 08, 09 |
| **Nice-to-have (Wijmo-class)** | 9 | MOD-GRID-10, 11, 12, 13, 14, 15, 16 |
| **TanStack-only (자체 추상화)** | 7 | MOD-GRID-01, 02, 03, 04, 05, 10 (중복) |

→ 모듈 매트릭스 총 **17 functional 모듈** + **3 infra** = **20 모듈** (Phase 1 목표 일치)

---

## 6. C-21 번들 한도 영향 예측

| 패키지 | 포함 모듈 | 예상 KB (gzipped) | 한도 (constraints.md) |
|--------|---------|-----------------|---------------------|
| grid-core | MOD-GRID-01, 02, 03, 04 | ~25 KB | 30 KB ✅ |
| grid-renderers | MOD-GRID-05 | ~8 KB | 10 KB ✅ |
| grid-virtual | (react-virtual peer 포함) | ~12 KB | 15 KB ✅ |
| grid-pro-tracking | MOD-GRID-10 | ~15 KB | 20 KB ✅ |
| grid-pro-range | MOD-GRID-11 | ~18 KB | 20 KB ✅ |
| grid-pro-datamap | MOD-GRID-12 | ~10 KB | 20 KB ✅ |
| grid-pro-merging | MOD-GRID-13 | ~8 KB | 20 KB ✅ |
| grid-pro-header | MOD-GRID-14 | ~5 KB | 20 KB ✅ |
| grid-pro-agg | MOD-GRID-15 | ~12 KB | 20 KB ✅ |
| grid-pro-master | MOD-GRID-16 | ~15 KB | 20 KB ✅ |
| grid-export | MOD-GRID-06 (xlsx, jspdf peer) | ~12 KB | (별도) |
| grid-features (drag/sort/filter) | MOD-GRID-07, 08, 09 | ~15 KB | (별도) |
| grid-license | MOD-GRID-99-A | ~5 KB | (별도) |
| grid (메타) | 위 전체 dep | ~140 KB | 150 KB ✅ |

→ C-21 한도 내 분할 가능. 단 예상치 — 실제 implement 시 `size-limit` 검증 의무.
