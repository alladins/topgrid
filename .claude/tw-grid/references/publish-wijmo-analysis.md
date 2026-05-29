# L2.W: publish Wijmo 패턴 분석 (참조 전용 — C-16)

**조사 대상**: `publish/src/components/common/wijmo-grid/` + `publish/src/app/personal/commute-manage/`
**Wijmo 버전**: `@mescius/wijmo.react.all@file:wijmo-5.20261.50_KR/...` (로컬 SDK, ver 5.20261.50)
**라이선스**: Wijmo Commercial (per-user/per-domain) — **신규 도입 절대 금지** (C-16)
**조사 일자**: 2026-05-13

⚠️ **C-16 절대 준수**: 본 문서는 패턴 학습 전용. 코드 직접 인용은 최소화. 우리 패키지에 `@mescius/wijmo*` import 금지. 평가판 라이선스 모달 발생 (`updatedLayout.addHandler` 추정).

---

## 1. 인벤토리

### 공통 wrapper (`publish/src/components/common/wijmo-grid/`)
| 파일 | 라인 | 역할 |
|------|------|------|
| `utils.ts` | 104 | 순수 함수 — `validateRow`, `applyMapping`, `buildChangeSet`, `serializeChangeSet`, `clearChanges` |
| `useWijmoGridCrud.ts` | 91 | React hook — `addRow`/`removeCurrent`/`hasChanges`/`buildJson`/`save` |
| `Facade.ts` | 39 | 클래스 스타일 wrapper (`WijmoGridCrudFacade`) |
| `GridProvider.tsx` | 23 | Context — `defaultHeaders`/`defaultMapping`/`defaultValidator`/`onError` |
| `README.md` | 102 | 사용 가이드 |

### Wijmo FlexGrid 사용처 (Grep `FlexGrid|CollectionView|@mescius/wijmo`) — 1 페이지만 발견
| 파일 | 시나리오 |
|------|---------|
| `publish/src/app/personal/commute-manage/organizeSchedule/page.tsx` | 근무일정편성관리 — 월별 캘린더 그리드 (날짜 31 컬럼 동적) |

(이 외 4 파일은 wijmo-grid wrapper 자체 모듈이라 사용처는 단 1건)

→ **Wijmo는 publish에서 매우 한정적 사용**. AG Grid가 주력. 그러나 우리가 "Wijmo-class 6 모듈"을 만드는 이유는: **이 1건이 다른 그리드들로 확장될 가능성 + Wijmo가 표방하는 Excel-like UX 자체가 ERP 표준 기대**.

---

## 2. 핵심 개념 추출 (Wijmo 도큐먼트 모델)

### CollectionView (Wijmo의 데이터 소스 추상)
- `new wjCore.CollectionView(data, { trackChanges: true })` (`utils.ts` L4, `organizeSchedule/page.tsx` L99)
- 내장 속성:
  - `itemsAdded[]` — 추가된 행
  - `itemsRemoved[]` — 삭제된 행
  - `itemsEdited[]` — 수정된 행
  - `currentItem` — 현재 행
  - `addNew()` → `commitNew()` 행 추가 패턴
  - `remove(item)` 삭제
  - `clearChanges()` 변경 이력 리셋

### ChangeSet (publish wrapper 정의)
```ts
type ChangeSet = {
  added: RowRecord[];
  removed: RowRecord[];
  updated: RowRecord[];
  errors: Array<{ index: number; message: string; type: 'added' | 'updated' }>;
};
```
→ **TanStack에는 없는 개념**. 우리 MOD-GRID-10 ChangeTracking 핵심 모델.

### Mapping (서버 필드 매핑)
```ts
type MappingRule = string | ((row: RowRecord) => any);
type Mapping = Record<string /*destField*/, MappingRule>;
```
- 화면 필드 → 서버 필드 변환 (`workTypeId: 'id'`)
- 함수 가능 (`updatedBy: () => currentUser`)

### Validator
```ts
type Validator = (row: RowRecord) => { valid: boolean; errors?: string[] };
```

---

## 3. FlexGrid 활용 패턴 (organizeSchedule/page.tsx)

### 설정 (L89-110)
- `g.frozenColumns = 4` — 좌측 4 컬럼 고정
- `g.allowMerging = wjGrid.AllowMerging.ColumnHeaders` — 헤더 셀 자동 병합
- `g.allowSorting = wjGrid.AllowSorting.None`
- `g.headersVisibility = wjGrid.HeadersVisibility.All` — row+col headers 다 표시
- `g.selectionMode = wjGrid.SelectionMode.CellRange` — 셀 범위 선택

### Multi-row 컬럼 헤더 (L111-136)
```ts
hdr.rows.push(new wjGrid.Row()); // 헤더 2행 만들기
hdr.setCellData(0, c, '15');  // 상단: 일
hdr.setCellData(1, c, '월');  // 하단: 요일
hdr.rows[0].allowMerging = true;
```
→ **TanStack의 column grouping과 다른 모델**. TanStack은 column 트리, Wijmo는 헤더 행 직접 조작. 우리 추상화는 TanStack `GroupColumnDef` 사용 (MOD-GRID-14).

### formatItem (셀별 스타일링 이벤트)
- `g.formatItem.addHandler((s, e) => {...})` — 모든 셀/헤더 렌더링마다 호출
- e.cell DOM 직접 조작 (`e.cell.style.background = '#fff6d5'`)
- 선택 상태 확인: `s.getSelectedState(e.row, e.col)` (None/Cursor/Selected/MultiSelected)

→ **TanStack 모델과 매우 다름**. TanStack은 React 컴포넌트, Wijmo는 DOM imperative. 우리는 `cell` renderer + `cellClassName` callback 으로 흡수.

### 셀 편집 (L252-300)
- `g.activeEditor` — 현재 편집 중인 input
- `g.startEditing(true)` — 키 입력 시 즉시 편집 시작
- `g.prepareCellForEdit` 이벤트 — editor 커스터마이즈
- `g.cellEditEnded` 이벤트 — 커밋

### CellRange 선택 (L78-83)
```ts
const lastSelectionRef = useRef<wjGrid.CellRange | null>(null);
const currentSelectionRef = useRef<wjGrid.CellRange | null>(null);
g.selectionChanged.addHandler(() => {
  currentSelectionRef.current = g.selection ? g.selection.clone() : null;
});
```
- `g.selection` — 현재 `CellRange`
- `g.selection.clone()` — 스냅샷
- **drag-fill (드래그 핸들로 셀 복사)**: `isDraggingRef`, `dragStartCellRef` 추정 (L82-84)

→ **MOD-GRID-11 (Cell Range + Drag-fill) 직접 영감**. 우리는 TanStack 위에 직접 구현.

---

## 4. Wijmo FlexGrid 공식 기능 매트릭스 (출처: developer.mescius.com WebFetch)

### Data & Performance
- Data Binding (CollectionView, OData, WebSocket)
- Virtualization (infinite scroll)
- Realtime Updates

### Data Organization
- Multi-cell range selection
- Multi-column sorting
- Paging (client + server)
- Freezing & Pinning (rows + columns)
- Sticky Headers
- Column Resize / Reorder

### Cell Customization
- Cell Templates (binding expressions)
- **Cell Merging** (content-driven 자동 병합)
- Conditional Formatting
- Sparklines (셀 내 미니 차트)

### Data Entry & Editing
- **DataMap** (셀 단위 lookup — `DataMap.itemsSource = [...]`)
- In-cell Editing + validation
- Add New Row

### Accessibility & Localization
- WCAG 2.0 AA, ARIA
- Keyboard shortcuts (Excel-like)
- Screen reader
- Globalization, RTL

### Data Discovery
- Filtering (text/highlight/Excel-style)
- Full-text searching

### Data Analysis
- Grouping (CollectionView + GroupPanel)
- **Aggregation** (custom 함수, group footer)

### Hierarchical Display
- TreeGrid (bound/unbound, lazy load, XML import)
- **Master-Detail** (RowDetail nesting)

### Import/Export
- Excel import/export (XLSX, sync+async)
- Clipboard copy/paste
- PDF export
- Printing

---

## 5. publish wrapper가 채우는 빈 곳 (CRUD 패턴화)

publish의 wijmo-grid wrapper는 Wijmo가 직접 안 제공하는 **CRUD 컨벤션**을 표준화:
1. `CollectionView(data, { trackChanges: true })` 생성 강제
2. `addRow/removeCurrent/buildJson/save` 4개 메서드로 통일
3. `mapping` 으로 BE 필드명 변환
4. `validator` 로 검증
5. `endpoint` 만 주면 fetch/axios 자동 처리

→ **MOD-GRID-10 ChangeTracking 모듈의 직접적 청사진**:
- API 시그니처 동일 (`addRow`, `removeRow`, `getChanges` → `buildJson`)
- 차이점: 우리는 CollectionView 대신 **React state + TanStack data 이중 추적**.
- 우리 `ChangeTrackingGrid.tsx` (이미 구현됨, 239 줄)이 같은 컨셉이지만 mapping/validator 없음 → MOD-GRID-10에서 통합·강화.

---

## 6. 추출 — 우리 모듈로 흡수할 패턴

| Wijmo 개념 | 우리 모듈 | 구현 방식 (Wijmo 코드 차용 ❌) |
|----------|---------|-------------------|
| CollectionView trackChanges | MOD-GRID-10 | React useState + Map<rowId, status> + structuredClone 스냅샷 |
| buildChangeSet (mapping/validator) | MOD-GRID-10 | 동일 컨벤션 — 자체 타입 (`ChangeSet`, `Mapping`, `Validator`) |
| Cell range selection | MOD-GRID-11 | Mouse event 좌표 추적 (이미 RangeSelectGrid.tsx 200 줄 존재) |
| Drag-fill | MOD-GRID-11 | 마지막 셀 우하단 핸들 + drag → 범위 fill |
| DataMap (셀 단위 lookup) | MOD-GRID-12 | `Map<columnId, Record<value, displayValue>>` + cell renderer |
| Cell merging (값 같은 셀 자동) | MOD-GRID-13 | rowSpan 계산 함수 + `td rowSpan={n}` (다음 N-1 셀 skip) |
| Multi-row header | MOD-GRID-14 | TanStack `GroupColumnDef` 활용 (이미 부분 구현 GroupedHeaderGrid.tsx) |
| Aggregation (group footer) | MOD-GRID-15 | `aggregationFns` + `<tfoot>` 또는 group row |
| Master-Detail RowDetail | MOD-GRID-16 | `expanded` state + 자식 grid render |
| Excel/PDF Export | MOD-GRID-06 | `xlsx` (이미 dep) + `jspdf` (peer dep 추가) |

---

## 7. 라이선스 / 비용 비교 (ADR 입력)

| 항목 | Wijmo | 우리 (tw-grid pro 패키지 자체 구현) |
|------|-------|----------------------------------|
| 라이선스 비용 | $695+ / user / year, per-domain | 자체 (소유) |
| 번들 크기 | ~500 KB (전체 모듈 압축) | 6 pro 패키지 합 ~120 KB (C-21 한도) |
| 라이선스 모달 | 평가판 — 모달 발생 (organizeSchedule.tsx 의 `updatedLayout.addHandler` 후처리 흔적) | 없음 |
| 한국어 docs | 부분 (`wijmo-5.20261.50_KR/`) | 한국어 우선 (TOMIS 컨텍스트) |
| 통합 | wjCore.CollectionView 등 신모델 학습 비용 | TanStack React 친화 |
| 유지보수 | Wijmo 회사 의존 | 내부 |

→ **C-16 결정 근거 강화**. ADR (MOD-GRID-10) 에 본 표 반영 의무.

---

## 8. 결론

- Wijmo의 강점은 **ChangeTracking**, **Cell Range + Drag-fill**, **DataMap**, **Cell Merging** 4가지.
- 모두 TanStack 표준 API 위에 자체 구현 가능 — Wijmo 기능 매트릭스를 MOD-GRID-10~15 에 직접 매핑.
- publish 자체는 Wijmo 1 페이지만 사용 — 마이그레이션 시 우리 신 grid 로 대체 가능 (publish는 별도 트랙).
- 우리 pro 패키지의 라이선스 모델은 **상용 grid 제품화 가능성** (C-24 참조) — 자체 EULA + 라이선스 검증.
