# MOD-GRID-50 — 행 단위 편집 (full-row editing)

dev-harness 33번째 (**Track 2 제품결정 1번째**, 사용자 예시 "full-row editing부터"). grid-core(MIT, Community).
갭분석 **Editing ❌ = Full-row editing**(per-cell only → 행 단위 edit/commit). 경쟁: AG Grid `editType:'fullRow'`(Community)·Wijmo FlexGrid row edit.

## 제품결정 → advisor 위임 (사용자 지시 2026-06-07)
- 이전 "제품 결정 4종 = STOP-and-ask" 게이트를 **사용자가 advisor 위임으로 전환**. 본 모듈 설계(상태 소유·커밋 단위·tier)는 advisor 결정.
- **advisor 설계**: `EditableCell.isEditing="parent 소유" + controlled-data(onUpdateRow)` 패턴을 **셀→행으로 승격**. 상태 소유=훅,
  커밋 단위=행 전체 all-or-nothing(비공허성의 원천), 순수 spine=`applyRowDraft`, tier=grid-core MIT(AG Community·기존 편집 무-게이트 확인).

## reuse-gate (LESS-003) + scope (verify-first grep)
- **survey**: 편집=per-cell only — `EditableCell`(grid-renderers, isEditing=parent 소유, onCommit/onCancel, 5 editType) + controlled
  `onUpdateRow`(grid-core, 소비자가 data 적용). grep fullRow/rowEdit=0(genuine 부재). grid-pro-edit-plus(Pro, 게이트)=validation/
  undo/comments — **본 모듈은 MIT base(EditableCell+onUpdateRow) 위에 build, Pro 의존 0**.
- **★license**: 기본 편집(EditableCell·onUpdateRow)=MIT 무-게이트(grep checkLicense=edit-plus 만). full-row=MIT 적정(advisor·AG Community).
  validation 가드는 **소비자 주입 `validateRow?` 콜백**(edit-plus `buildValidator` 파생 predicate 를 소비자가 전달 — Pro dep 회피).
- 재사용: `EditableCell`(grid-renderers, isEditing=isRowEditing)·controlled-data(applyRowTransaction/moveRow 동형 순수)·createSheet/useUndoRedo
  raw-truth+atomic 패턴.

## Goals
- **G-1 행 편집 상태 훅 + 순수 spine — 종결형**:
  - 순수 `applyRowDraft<T>(row: T, draft: Record<string,unknown>): T`(shallow merge=`{...row,...draft}`, 입력 무변, 빈 draft=동등 복사,
    draft 키만 override). **node 검증**.
  - `useFullRowEdit<T>({ getRowId, onRowEdit, validateRow? })` → `{ editingRowId, startRowEdit(row), isRowEditing(row), setDraftCell(field,
    value), getDraftValue(field, rowValue), commitRow(row), cancelRow() }`. draft=Map(변경 셀만). **commitRow=ONE delta**
    `onRowEdit(rowId, applyRowDraft(row, draftObj))`→clear. **cancelRow=discard, emit 0**. validateRow 거짓→commit 차단(편집 유지).
  - **검증**: node(applyRowDraft: merge/빈/부분/immutability/타입무관) — 훅 atomic·transitions=chromium(React 상태).
- **G-2 행 편집 UI 배선 (chromium 발산) — 배선형**:
  - 행-edit 모드 시 편집 컬럼 셀 = `EditableCell(isEditing=isRowEditing(row))` → onCommit→setDraftCell(field). 행 액션(편집/저장/취소
    버튼). per-cell↔full-row 배타 가드.
  - **검증 ★발산(advisor, "input 나타남"=vacuous 금지)**: ① 행 편집 진입→**≥2 셀 동시 에디터** ② 두 셀 편집→저장→**둘 다 한 번에 적용**
    (단일 onRowEdit) ③ 두 셀 편집→취소→**둘 다 원복**(부분 커밋 없음) ④ 다른 행=view 모드 유지.

## In / Out
- **In**: 순수 `applyRowDraft` + `useFullRowEdit` 훅(grid-core) + 행-edit UI 배선(story, EditableCell 재사용). validateRow=소비자 주입.
- **Out**: per-cell 편집(기존 유지) · undo/redo(MOD-23 edit-plus) · custom editor slot(=MOD-51 후속) · 키보드 행 nav(후속).

## ★ ❌ 닫힘 마커
- **Full-row editing = ✅**: 행 단위 edit/commit/cancel(atomic, node spine+chromium 발산). gap "per-cell only, no row-level edit/commit" 해소.
- COMMERCIAL-GAP: **Editing** 카테고리 1 ❌→✅ → ❌31→30·✅226→227. reconcile 19/19·330.

## AC (측정 가능)
G-1 applyRowDraft merge/immutability(node). G-2 ≥2 셀 동시 에디터·atomic 커밋·atomic 취소·타 행 view(chromium 발산). OFF(미사용) 회귀 0.

## constraints
- **MIT**(grid-core, license gate 0 — 기존 편집 무-게이트 확인). 외부 dep 0(grid-renderers EditableCell=story 배선, 코어 의존 아님).
- **LESS-006**: 훅 상태/원자성=브라우저 행동→chromium 발산(정적 presence 금지). 순수 applyRowDraft 만 node.
- **validateRow 가드(optional hook point)**: commitRow 가 `validateRow?(draftRow)` false 시 차단(편집 유지) — 코드에 구현됨, **단 chromium
  미검증**(AP-004: 안 돌린 검사는 0 아님 → "delivered guard" 아닌 "unverified hook point" 로 정직 기록). validateRow=소비자 주입(Pro
  buildValidator 파생, license 경계 무위반).
- **per-cell vs full-row = 배타 가드 불필요(N/A)**: per-cell 편집은 소비자가 EditableCell 을 직접 배선(grid-core 공유 편집 상태 없음),
  full-row 는 별개 useFullRowEdit 훅 — **공유 상태 0 → 상호 배제할 대상 자체가 없음**(advisor 정정: 무-op 가드를 delivered 로 광고 금지).
- 기존 onUpdateRow/EditableCell 무수정(신규 훅+순수 파일).

## 의존
grid-core 내부(신규 `editing/{applyRowDraft,useFullRowEdit}`). story=grid-renderers EditableCell. 신규 외부 dep 0.

## 분류 (MASTER §2)
applyRowDraft=**종결형**(순수). useFullRowEdit+UI 배선=**배선형**(chromium 발산).

## reuse-gate 결과 / 추측 0
재사용=EditableCell(isEditing 승격)·controlled-data(onRowEdit=onUpdateRow 동형)·atomic raw-truth(createSheet). 신규=행 draft 누적+원자 커밋.
추측 0: AG `editType:'fullRow'`(전 셀 동시 에디터·행 단위 commit/cancel)·Wijmo row edit = 1차 출처(gap L272/575 verified-absent).

## specify rubric (Full — 점수, 게이트 C)
- [x] Goal(행 편집, AG fullRow 대응) **9/10** · [x] In/Out(순수 In·per-cell/undo/custom-editor Out 명시) **10/10**
- [x] AC 측정(applyRowDraft node·≥2 에디터/atomic chromium 발산) **10/10** · [x] reuse-gate(EditableCell 승격·license 무-게이트 확인) **10/10**
- [x] constraints(MIT·LESS-006·2 상호작용 가드·validateRow 주입) **10/10** · [x] 의존(내부 신규, 외부 0) **10/10**
- [x] 추측 0(AG fullRow 1차·gap verified) **9/10** · [x] 분류(§2 종결형+배선형) **9/10**
- **합계 77/80 — 게이트 통과.**

---

## G-1·G-2 결과 (완료 — 2026-06-07) → MOD-50 = {G-1,G-2} 완주, §3 이관
**구현**(grid-core, 신규 `editing/{applyRowDraft.ts, useFullRowEdit.ts}` + index export; 기존 편집 무수정):
- G-1 순수 `applyRowDraft(row, draft)`(shallow merge `{...row,...draft}`, 입력 불변) + `useFullRowEdit({getRowId,onRowEdit,validateRow?})`:
  editingRowId + draft(state + **draftRef 미러**) · startRowEdit/setDraftCell/getDraftValue/isRowEditing · **commitRow=ONE onRowEdit(applyRowDraft)
  → reset** · cancelRow=reset(emit 0) · validateRow 거짓→차단(편집 유지).
- G-2 story 배선(EditableCell isEditing=isRowEditing, onCommit→setDraftCell, 행 액션 편집/저장/취소).

**검증**: node **applyRowDraft 8/0**(grid-core 전 스위트 green) · typecheck 0 · build green · **chromium 3/3**(`grid-full-row-edit.spec.ts`) +
**전체 회귀 84/84**(81 + 3, 코어 render 무수정).
- ★≥2 셀 동시 에디터(진입) + 타 행 view 유지 · 저장→두 셀 atomic 적용(단일 onRowEdit) + 타 행 무변 · 취소→두 셀 atomic 원복(부분 커밋 0).

## ★ closure + 발견 (advisor)
- **Full-row editing = ✅**: 행 단위 atomic edit/commit/cancel(node spine + chromium 발산). gap "per-cell only" 해소. **Editing 12/4/2→13/4/1**.
  COMMERCIAL-GAP **❌31→30·✅226→227·🟡70**(reconcile 19/19·합 330·0 mismatch). 잔여 ❌ tier Community 11→10.
- **★draftRef 미러(원자성 키)**: "저장" 클릭 시 포커스 셀 blur→onCommit→setDraftCell 이 같은 틱 — commitRow 가 stale state 클로저 대신
  draftRef.current 를 읽어 마지막 셀 유실 방지. createSheet raw-truth 동형.
- **★발견(소비자 배선 주의, reuse-gate)**: EditableCell(uncontrolled 내부 draft, commit-on-blur)을 full-row 에 쓰려면 **셀 컴포넌트 안정 식별자
  필수**(useMemo([]) 컬럼 + editRef.current 로 라이브 API). 컬럼/셀 매 렌더 재생성 시 flexRender 가 새 타입 createElement → setDraftCell 마다
  remount(포커스/draft 유실). MOD-26 "useKeyboardEdit 부적합" 동류의 reuse-gate 통찰 — 단 본 모듈은 안정화로 EditableCell 재사용 성립(native 회피).
  스토리/문서에 기록(코어 lesson 아님=React-general).
- **★정직성 정정(advisor AP-004)**: validateRow=구현됐으나 **chromium 미검증**(optional hook point 로 기록, delivered guard 아님). per-cell⊥
  full-row=**무-op**(공유 상태 0 → 배제 대상 없음, 가드로 광고 안 함). follow-up: validateRow 게이트 chromium 1 추가 가능(저비용).
- **제품결정 진행**(advisor 위임): full-row editing=✅. 다음=custom cell editor slot(MOD-51). column spanning=bound-or-defer. RTL=의도적 연기.

## 모듈 완주 요약
2-Goal: Track 2 제품결정 1번째. EditableCell.isEditing 셀→행 승격 + controlled-data(onRowEdit) + atomic raw-truth(draftRef). 순수 applyRowDraft
node + 행 원자성/≥2 에디터 chromium 발산. 코어 render 무수정(회귀 84/84). 신규 lesson 없음(LESS-005 reuse-gate·LESS-006 적용; 안정-셀 발견=문서).
