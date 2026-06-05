# MOD-GRID-35 — Selection UX (행클릭 선택 → shift 범위 → indeterminate select-all)

> ⚠ **소급 작성(retroactive backfill, 2026-06-06)**: 구현 이후 state.json·git·MASTER §3 에서 재구성.
> MOD-34~39 는 정식 specify 를 건너뛰고 인라인 진행됨(→ `docs/internal/WORKFLOW-INTEGRITY-AUDIT.md`).
> 아래는 "사전 계약"이 아니라 **실제 구현·검증 기록**이다.

dev-harness 18번째. **잔여 Community table-stakes 트랙 1순위**(Selection UX, advisor: 응집·저blast·명료게이트).

## ★ 검증-우선 규칙 (사용자 "하나하나 체크")
재감사 ❌ 가 보수적이라 stale-❌ 다수 → 구현 전 grep 스윕으로 실재 확인. 이번 발견: aria-sort(ariaAttrs L94)·
Home/End/PageUp/PageDown(cellNavigation, PageDown grid-a11y 게이트)·ARIA roles **이미 구현** → 보정(2✅+1🟡,
rowheader 미방출=🟡 vN). **이 트랙의 규칙으로 확립**: 재감사 ❌ 믿지 말고 매 클러스터 grep 선확인.

## design (advisor — 첫 Community 트랙 모듈)
**★단일 소스 불변식**: 기존 TanStack `RowSelectionState` **하나**를 체크박스·행클릭·상태바·indeterminate 모두
구동(병렬 store 금지). 기존 `onRowClick` 독립 공존.

## Goals (실제 구현 기록)
- **G-1 행클릭 선택**: `enableRowClickSelection?` + 순수 `computeRowClickSelection(current,clickedId,ctrl,mode)`→
  `{selection,anchorId}`. Grid `handleRowClick`: single/multi 일 때만 선택+`onRowClick` 동시. 체크박스 셀 stopPropagation.
  - AC: plain=교체(나머지 해제)·ctrl=토글 유지·single=항상 1·anchor=clicked.
- **G-2 shift 범위**: 코어 shift+anchorId+orderedIds → anchor..clicked 연속 범위(replace). anchor 보존.
  removeAllRanges(텍스트선택 제거). 기존 필드 optional=G-1 호환.
  - AC: 범위 하향·상향·anchor 보존(재확장)·no-anchor→plain fallback.
- **G-3 indeterminate select-all**: CheckboxColumn 헤더 indeterminate=`getIsSomePageRowsSelected()`(DOM 프로퍼티 ref)+
  `aria-checked='mixed'`. 기존 select-all 강화(병렬 금지).
  - AC: 부분→indeterminate=true+aria-checked=mixed(checked/unchecked 와 구별)·전체→checked·헤더 토글→none.

## constraints
**MIT**(grid-core). 외부 dep 0. LESS-006: G-1/G-2=node spine(선택 수학)+chromium·G-3=browser-only 정직(순수 0).
단일 소스 RowSelectionState 불변식.

## 의존
grid-core(기존). 신규 dep 0.

## 분류 (MASTER §2)
computeRowClickSelection=종결형(순수) · handleRowClick/CheckboxColumn=연결형+트리거.

## 결과 (완료 — 2026-06-05, §3 이관)
- **G-1**: node **7/7**(plain 교체·ctrl 토글·single 1·anchor·불변) + chromium **2/2**(plain 교체·ctrl 추가/토글오프·
  single 1행·onRowClick 4회 공존).
- **G-2**: node **11**(범위 하/상향·anchor 보존·no-anchor fallback) + chromium **1**(plain anchor→shift 0..2→재확장 0..1).
- **G-3**: chromium **1**(부분→indeterminate+aria-checked=mixed·전체→checked·헤더 토글→none). browser-only 정직(순수 0).
- **합계**: node 11+chromium 4. 회귀 65/65. typecheck 0.
- **keystone 메모**: getRowId=cell-flash/transaction 클러스터 keystone(→MOD-36). vN-within-Community 명시(silent 금지):
  drag-between-grids·row animation·async batching·auto-virt-threshold·debounced-scroll·auto-page-size·page formatter·post-sort.
