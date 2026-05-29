# L2.A: publish AG Grid 패턴 분석

**조사 대상**: `publish/` Next.js 15 + React 19 프로젝트
**AG Grid 버전**: `ag-grid-community@^33.0.3` + `ag-grid-react@^33.1.1` (publish/package.json L24-25 확인)
**라이선스**: Community (MIT) — Enterprise 모듈 import 없음
**조사 일자**: 2026-05-13
**Constraint**: C-7 — 코드 차용 금지, 패턴 분석만

---

## 1. 인벤토리

### 공통 컴포넌트 (`publish/src/components/common/aggrid/`)
| 파일 | 라인 추정 | 역할 |
|------|---------|------|
| `AggridTable.tsx` | ~300 | 기본 그리드 (체크박스/하이라이트/자동 첫 행 선택) |
| `AggridTreeTable.tsx` | ~250 | 트리 표시용 — 커스텀 `TreeCellRenderer` + level/isParent props |

### AG Grid 직접 사용 페이지 (Grep `AgGridReact|ag-grid-react`) — **13 파일**
| 영역 | 파일 |
|------|------|
| 메인/대시보드 | `publish/src/app/page.tsx`, `publish/src/app/contract/progress-dashboard/page.tsx` |
| community | `community/schedule/page.tsx`, `community/msg/page.tsx`, `community/mail/page.tsx` |
| contract | `contract/priority/result-register/page.tsx` |
| approval | `approval/docu-wirte/draft/detail/DraftRecord.tsx`, `DraftHierarchy.tsx`, `docu-manage/manage/modal/RecordsModal.tsx`, `SideDetailModal.tsx`, `docu-wirte/draft/detail/modal/DraftFavoriteLIstModal.tsx` |

---

## 2. ModuleRegistry 패턴 (AG Grid 33 v33 module API)

`AggridTable.tsx` L5-36 — `ModuleRegistry.registerModules([...])` 글로벌 등록:
- `ClientSideRowModelModule` (필수 — 클라이언트 데이터 소스)
- `PaginationModule`
- `RowSelectionModule`
- `RowStyleModule` / `CellStyleModule`
- Editor: `NumberEditorModule`, `TextEditorModule`, `SelectEditorModule`, `DateEditorModule`
- Filter: `NumberFilterModule`, `TextFilterModule`
- `RowApiModule`, `ValidationModule`
- (TreeTable 추가): `ColumnAutoSizeModule`, `ScrollApiModule`

→ **Tree-shake 친화 설계**: 사용하는 모듈만 명시. 우리 grid-pro-* 패키지 분할 모델에 참고 가치 있음 (C-21 번들 한도와 일치).

---

## 3. AggridTable.tsx 핵심 API 추출 (L38-77)

### Props (interface AgGridTableProps)
- `rowData?: Array<any>` — **`any` 사용** (C-4 위반 — 우리 추상화에서는 제네릭 강제)
- `columnDefs: Array<any>` — AG Grid `ColDef[]`
- `onRowDoubleClick` / `onRowClicked` / `onCellClicked`
- `onSelectionChanged` — 체크박스 선택 이벤트
- `rowSelection?: "single" | "multiple"` — 문자열 enum (AG Grid v33 새 API)
- `highlightSelection?: boolean` — 하이라이트 vs 체크박스 분리
- `autoSelectFirstRow?: boolean` — 첫 행 자동 선택 (TOMIS 사용성 패턴)
- `isOneClickHighlightSelection?: boolean`
- `tableHeight?: string`
- `onCellValueChanged` — 셀 값 변경
- `gridRef?: React.RefObject<any>` — AgGridReact ref 외부 노출
- `clearSelectionKey?: any` — 외부 트리거로 선택 해제 (state key 변화 감지)
- `components?: any` — 커스텀 cell renderer 등록 map

### 핵심 사용성 패턴 (확인 source L78-92)
```ts
useEffect(() => {
  if (autoSelectFirstRow && rowData?.length > 0) {
    setSelectedRowId("0");
  }
}, [rowData, autoSelectFirstRow]);
```
→ **데이터 로드 후 첫 행 자동 선택은 한국형 ERP 관행**. 우리 MOD-GRID-01 wrapper에 `autoSelectFirstRow` prop 추가 권장.

---

## 4. ColumnDef 사용 패턴

`progress-dashboard/page.tsx` L220-236:
```ts
const columnDefs: ColDef[] = useMemo(() => [
  { headerName: "계약의뢰번호", field: "applyNo", width: 120 },
  { headerName: "계약건명", field: "contNm", flex: 1 },
  { headerName: "진행단계", field: "proStageNm", width: 100 }
], []);
```

`gridOptions` (L239-249):
```ts
{
  defaultColDef: { sortable: true, filter: true, resizable: true },
  rowSelection: 'single',
  onGridReady: (params) => setGridApi(params.api)
}
```

→ **defaultColDef 패턴은 TanStack에 없는 편의 기능** — 우리 wrapper에서 `defaultColumn` prop으로 노출 가능 (이미 TanStack `defaultColumn` 옵션 있음 — 활용 권장).

---

## 5. AggridTreeTable.tsx 핵심 패턴 (L40-84)

### TreeCellRenderer (React 함수 컴포넌트)
- props: `value`, `data`, `levelField`, `isParentField`, `onClick`
- `level = data[levelField] || 0` — 들여쓰기 `paddingLeft: ${level * 10}px`
- `icon = isParent ? (expanded ? '▼' : '▶') : ''` — 아이콘 토글
- `onClick(data)` — 부모 노드 펼침 콜백

→ **AG Grid 자체 tree는 Enterprise 기능**. publish는 community + 커스텀 renderer로 우회. 우리 TreeGrid (`getExpandedRowModel`)와 컨셉 동일 — 패턴 호환.

---

## 6. 인라인 편집 패턴 (AG Grid 방식)

ModuleRegistry에 `NumberEditorModule`, `TextEditorModule`, `SelectEditorModule`, `DateEditorModule` 등록. 컬럼 단위:
```ts
{ field: 'name', editable: true, cellEditor: 'agTextCellEditor' }
{ field: 'age', editable: true, cellEditor: 'agNumberCellEditor' }
```

이벤트:
- `onCellValueChanged(event)` — 변경 commit
- AG Grid 자체 `editable: boolean | (params) => boolean` (행별 조건부)

→ 우리 `EditableGrid` 패턴 (`meta.editable`)과 거의 동일. **DataMap 부재** (publish AG Grid 사용처는 lookup edit 없음).

---

## 7. Filter / Sort / Pagination

- **Filter**: `defaultColDef.filter: true` — 컬럼별 floating 필터 입력
- **Sort**: `sortable: true` 헤더 클릭
- **Pagination**: `PaginationModule` 등록 → `pagination: true`, `paginationPageSize: N`

→ 모두 TanStack v8 대응 가능. AG Grid의 강점은 **빌트인 UI** (TanStack은 state만).

---

## 8. AG Grid Community 사용 기능 vs Enterprise (확인 — publish는 Enterprise 미사용)

| 기능 | AG Grid Community | AG Grid Enterprise | publish 사용 |
|------|------------------|--------------------|---|
| Sort/Filter/Pagination | ✅ | ✅ | ✅ |
| Row selection (single/multi/checkbox) | ✅ | ✅ | ✅ |
| Cell editing (text/number/select/date) | ✅ | ✅ | ✅ |
| Column resize | ✅ | ✅ | ✅ (defaultColDef.resizable) |
| Row grouping (자동) | ❌ | ✅ | (custom renderer로 우회) |
| Aggregation | ❌ | ✅ | 없음 |
| Excel Export | ❌ (CSV만) | ✅ | xlsx 라이브러리 별도 |
| Master/Detail | ❌ | ✅ | 모달로 우회 |
| Tree Data | ❌ | ✅ | 커스텀 `TreeCellRenderer` |
| Range Selection | ❌ | ✅ | 없음 |
| Server-side Row Model | ❌ | ✅ | 사용 안 함 |
| Status Bar | ❌ | ✅ | 사용 안 함 |
| Tool Panel (filter/columns) | ❌ | ✅ | 사용 안 함 |
| Excel-like context menu | ❌ | ✅ | 사용 안 함 |

(출처: AG Grid 공식 docs + publish 코드 직접 확인. WebFetch HTTP 404로 실패, 위 표는 AG Grid 33.x 일반 지식 + publish 코드 검증 기반. 확인 필요한 항목은 공식 사이트 재확인 권장.)

---

## 9. 추출 가능한 패턴 (우리 추상화에 적용)

| 패턴 | 출처 | 적용 모듈 |
|------|------|---------|
| `autoSelectFirstRow` 자동 첫 행 선택 | AggridTable L80-92 | MOD-GRID-01 wrapper |
| `clearSelectionKey` 외부 트리거로 선택 해제 | AggridTable L88-92 | MOD-GRID-02 useGridState |
| `gridRef` 외부 노출 (imperative API) | AggridTable | MOD-GRID-01 (useImperativeHandle) |
| `components` map 으로 cell renderer 주입 | AggridTable L53 | MOD-GRID-05 cell renderer 레지스트리 |
| `ModuleRegistry.registerModules([...])` tree-shake | AG Grid 33 | grid-pro-* 패키지 분할 영감 |
| `TreeCellRenderer` 패턴 (level/isParent props) | AggridTreeTable | MOD-GRID-16 master-detail |

---

## 10. 주의 (C-7 준수)

- 모든 AG Grid 코드는 **분석만** — 우리 패키지에 차용 금지
- AG Grid Community는 MIT지만 우리는 TanStack 위에 직접 구축 → 라이선스/번들 분리
- publish 자체는 별도 마이그레이션 트랙 — 본 tw-grid 작업은 publish 수정 안 함
