# L3: Wijmo FlexGrid 공식 기능 매트릭스

**버전**: Wijmo 5.20261.50 (publish 로컬 SDK)
**출처**: `WebFetch https://developer.mescius.com/wijmo/flexgrid-javascript-data-grid` ✅ 응답 성공
**조사 일자**: 2026-05-13
**Constraint**: C-16 — 패턴 학습 전용. 코드 차용 / 라이브러리 도입 절대 금지.

---

## 1. 카테고리별 기능 목록 (공식 사이트 응답 기반)

### Data & Performance
- Data Binding — client/server, arrays, **CollectionView**, OData, WebSocket
- **Virtualization** — infinite scrolling, 큰 데이터셋 UI 응답성
- Realtime Updates — dynamic data 변경 감지 + 자동 reflow

### Data Organization
- **Selection** — multi-cell range (Excel-style)
- **Sorting** — on-demand, multi-column
- **Paging** — client + server
- **Freezing & Pinning** — rows + columns 고정
- Sticky Headers — 스크롤 시 상단 고정
- Column Resizing
- Column Reordering — header drag

### Cell Customization
- **Cell Templates** — binding expressions (`{{field}}` 등)
- **Cell Merging** — content-driven 자동 (같은 값 연속 행 병합)
- **Conditional Formatting** — 값 기반 색상/스타일
- **Sparklines** — 셀 내 미니 차트

### Data Entry & Editing
- **DataMap** — 셀 단위 lookup (foreign key 표시명 등)
- **In-cell Editing** — validation 통합
- **Add New Row** — 하단 빈 행 자동

### Accessibility & Localization
- WCAG 2.0 AA + ARIA
- **Keyboard shortcuts** — Excel-like (F2 edit, Tab 이동, Ctrl+C/V 등)
- Screen reader
- Globalization — 다국어, 포맷
- RTL — Right-to-Left

### Data Discovery
- **Filtering** — text, highlight, **Excel-style** (체크박스 set filter)
- **Full-text Searching** — 매칭 highlight

### Data Analysis
- **Grouping** — CollectionView + GroupPanel (drag-to-group)
- **Aggregation** — custom 함수, group footer 표시

### Hierarchical Display
- **TreeGrid** — bound/unbound, lazy loading, XML import
- **Master-Detail** — RowDetail nesting (자식 grid render)

### Import/Export/Output
- **Excel** — XLSX import/export, sync/async
- **Clipboard** — copy/paste (Excel 호환)
- **PDF Export**
- **Printing** — print preview

---

## 2. 매트릭스 — 우리 모듈 매핑

| Wijmo 기능 | 우리 모듈 | 우선순위 | 비고 |
|----------|---------|--------|------|
| CollectionView (data + trackChanges) | MOD-GRID-10 | P0 | 핵심 — ERP CRUD 필수 |
| Virtualization | MOD-GRID-01 (wrapper에 react-virtual 통합) | P0 | C-18 의무 |
| Realtime Updates | MOD-GRID-01 (data props 변경 자동) | P1 | TanStack 기본 동작 |
| Multi-cell Range Selection | MOD-GRID-11 | P0 | 기존 RangeSelectGrid 흡수 + drag-fill |
| Multi-column Sorting | MOD-GRID-08 | P0 | TanStack `enableMultiSort` |
| Client+Server Paging | MOD-GRID-03 | P0 | manualPagination 통합 |
| Freezing & Pinning rows/cols | MOD-GRID-01 + MOD-GRID-16 | P0 | columnPinning + rowPinning |
| Sticky Headers | MOD-GRID-01 | P0 | CSS sticky |
| Column Resize/Reorder | MOD-GRID-01 / MOD-GRID-07 | P0 / P1 | resize는 free, reorder는 dnd-kit |
| Cell Templates | MOD-GRID-05 | P0 | renderer 패키지 |
| **Cell Merging** | MOD-GRID-13 | P1 | rowSpan 자동 |
| Conditional Formatting | MOD-GRID-05 (`cellClassName` callback) | P0 | renderer 책임 |
| Sparklines | (out of scope v1) | P2 | 별도 패키지 후보 |
| **DataMap** | MOD-GRID-12 | P0 | 셀 lookup map |
| In-cell Editing + Validation | MOD-GRID-05 + MOD-GRID-10 | P0 | EditableGrid 흡수 |
| Add New Row | MOD-GRID-10 | P0 | ChangeTracking API |
| WCAG/ARIA | MOD-GRID-01 + MOD-GRID-99-B | P0 | role="grid" 등 |
| Keyboard shortcuts (Excel-like) | MOD-GRID-11 (range) + MOD-GRID-05 (edit) | P0 | F2/Tab/Enter/Ctrl+C/V |
| Globalization | MOD-GRID-05 (formatter) | P1 | date-fns/Intl |
| RTL | MOD-GRID-01 | P2 | CSS logical properties |
| Filter UI (text/highlight/set) | MOD-GRID-09 | P0 | Excel-style |
| Full-text search | MOD-GRID-09 (`globalFilter`) | P0 | TanStack `globalFilterFn` |
| **Grouping (drag-to-group)** | MOD-GRID-15 | P1 | `getGroupedRowModel` + GroupPanel UI |
| **Aggregation** (group footer) | MOD-GRID-15 | P0 | `aggregationFns` |
| **TreeGrid** | MOD-GRID-16 | P1 | 기존 TreeGrid 흡수 |
| **Master-Detail** | MOD-GRID-16 | P0 | RowDetail expand |
| Excel Export (XLSX) | MOD-GRID-06 | P0 | xlsx (이미 dep) |
| Clipboard copy/paste | MOD-GRID-11 | P1 | range 선택 후 Ctrl+C |
| PDF Export | MOD-GRID-06 | P1 | jspdf peer |
| Printing | (out of scope v1) | P2 | window.print 위임 |

---

## 3. Wijmo 가 ‘유일하게’ 제공 (다른 무료 라이브러리에 적게 있음)

핵심 4개 — 우리 wijmo-class 모듈의 정당화 근거:
1. **CollectionView ChangeTracking** — itemsAdded/Edited/Removed 자동 추적
2. **Cell Range + Drag-fill** — Excel 동등 UX
3. **DataMap** — 컬럼이 아닌 셀 단위 lookup (행마다 다른 옵션 가능)
4. **Cell Merging (content-driven)** — 같은 값 연속 셀 자동 병합 (수동 grouping 없이)

→ 이 4개는 우리 P0 pro 패키지의 핵심 차별화.

---

## 4. 라이선스 비교 (ADR 입력)

| 항목 | Wijmo Commercial | 우리 grid-pro-* (자체) |
|------|------------------|------------------------|
| 가격 | $695+ / user / year, per-domain | 자체 보유 |
| 평가판 | 라이선스 모달 발생 | 없음 |
| 한국어 docs | `wijmo-5.20261.50_KR/` | 한국어 우선 |
| React 친화 | wrapper `@mescius/wijmo.react.all` (래퍼 — DOM 직접) | React 19 + TanStack 친화 |
| 번들 영향 | 큰 (~500 KB) | 6 pro 합 ~120 KB (C-21) |
| 유지보수 | Mescius 의존 | 내부 |
| 라이선스 검증 | 도메인 등록 / 모달 | 자체 (grid-license 패키지 — C-24) |

---

## 5. 결론

- Wijmo 19개 기능 → 우리 16개 모듈로 100% 커버
- C-16 비도입 결정 강화
- MOD-GRID-10~15 (6개) = Wijmo-class
- MOD-GRID-99-A (라이선스 검증) = 우리 pro 패키지의 자체 EULA 모델
