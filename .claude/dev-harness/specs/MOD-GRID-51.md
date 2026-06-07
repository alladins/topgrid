# MOD-GRID-51 — 커스텀 셀 에디터 슬롯 (custom cell editor slot)

dev-harness 34번째 (**Track 2 제품결정 2번째**, advisor 순서 = full-row editing → **custom cell editor slot** → column spanning → RTL). grid-renderers(MIT, Community).
갭분석 **Editing ❌ = Custom cell editor component slot**(line 276/579: "EditType is a fixed union; no consumer-supplied editor component registration"). 경쟁: AG Grid `cellEditor`/`cellEditorSelector`(Community)·Wijmo FlexGrid `CellTemplate`.

## 제품결정 → advisor 위임 (사용자 지시 2026-06-07)
- "제품 결정 4종 = advisor 위임"(설계·우선순위). 본 모듈 설계(슬롯 형태·검증 기준·tier)는 advisor 결정.
- **advisor 설계**: 소비자는 이미 TanStack `cell` 렌더러로 임의 editor 를 그릴 수 있다(broad capability 존재). 따라서 비공허 증분은
  "임의 컴포넌트를 그릴 수 있게 함"이 아니라 **편집 lifecycle 을 슬롯에 제공**하는 것 — Enter→commit·Esc→cancel·진입 autofocus.
  raw `cell` editor 는 이 lifecycle 을 **무료로 못 받음**(소비자가 직접 배선해야 함). 이게 통과해야 ✅, convenience 뿐이면 🟡.
- **render-prop lifecycle slot**(registry 아님): per-column·lifecycle-bound — AG 의 string-config 직렬화 needs 없음. registerRenderer 선례 비적용(advisor).

## reuse-gate (LESS-003) + scope (verify-first grep)
- **survey**: 편집 슬롯 = grep `editorComponent/customEditor/registerEditor/cellEditor/renderEditor` across `packages/*/src` = 0 matches(genuine 부재, gap line 276 근거). EditType=고정 union(text/number/date/select/textarea). EditableCell 은 isEditing=parent 소유 + onCommit/onCancel/initialDraft lifecycle 이미 보유 → **슬롯은 이 lifecycle 을 소비자 editor 에 위임**.
- **★license**: 기본 편집(EditableCell)=MIT 무-게이트(checkLicense=grid-pro-edit-plus 만). custom editor slot=MIT 적정(advisor; AG `cellEditor`=Community).
- 재사용: EditableCell 의 기존 draft state·`useEffect([isEditing])` autofocus·`handleKey`(Enter/Esc/Tab) lifecycle 을 **renderEditor 슬롯에 재배선**(신규 lifecycle 무발명).

## Goals
- **G-1 lifecycle 슬롯 prop + ctx (chromium 발산) — 배선형**:
  - `EditableCell` 에 `renderEditor?(ctx: CustomEditorContext) => ReactNode` prop 추가. `ctx = { value: string, onChange(v), commit(), cancel(), focusRef }`.
    - `value` = 현재 draft 문자열(EditableCell 내부 소유, 기존 draft state). `onChange` = setDraft. `commit` = onCommit(draft). `cancel` = onCancel.
    - `focusRef` = **callback ref**(`(el: HTMLElement|null)=>void`) — 소비자가 자신의 focusable editor 요소에 부착, EditableCell 이 진입 시 autofocus.
  - `isEditing && renderEditor` 시 `<div onKeyDown={handleKey}>{renderEditor(ctx)}</div>` 렌더. **keydown 버블링**이 Enter→commit·Esc→cancel·Tab→commit 을
    소비자 배선 0 으로 제공(슬롯 비공허성의 원천). `stopPropagationOnKeyDown` 존중. `useEffect([isEditing])` 진입 시 focusRef 요소 autofocus.
  - **value=string(스코프)**: onCommit(string) 계약 유지. 임의 value-type(non-string)=vN(소비자 serialize). gap line 276 = "consumer-supplied editor component" 닫음(임의 타입 parity 주장 아님).
  - **검증 ★발산(advisor, "input 나타남"=vacuous 금지)**: ① **view 모드 클릭→진입**(isEditing=true 시작 금지) → 커스텀 editor(`data-testid`, built-in `border-blue-400` 부재)가
    **자동 포커스**(`toBeFocused`; bare `<input>`은 self-focus 안 함=focusRef 증명) ② editor 포커스 상태로 **Enter→commit**(blur 아님; 값 변경→Enter→view 모드 커밋값) ③ 값 변경→**Esc→cancel**(원복·커밋 0) ④ built-in editType 경로 무회귀(기존 11 static story).

## In / Out
- **In**: `renderEditor?` prop + `CustomEditorContext` 타입(grid-renderers EditableCell) + 신규 stateful story(view↔edit, 커스텀 editor 요소). 기존 editType 경로 무수정.
- **Out**: 임의 value-type(non-string serialize)=vN · editor registry(string-config 직렬화, AG cellEditorSelector)=advisor 비적용(per-column render-prop 으로 충분) · cellEditorPopup/대형 오버레이=후속.

## ★ ❌ 닫힘 마커
- **Custom cell editor component slot = ✅**(통과 시): renderEditor lifecycle slot — 소비자 editor 가 Enter-commit·Esc-cancel·autofocus 를 슬롯에서 받음(raw cell 무료 미제공). gap "EditType fixed union, no consumer-supplied editor" 해소.
- **🟡 fallback(정직)**: lifecycle 발산이 안 서거나 소비자가 핵심 lifecycle 을 여전히 배선해야 하면 ✅ 아닌 🟡(convenience) 기록(over-claim 금지, AP-004).
- COMMERCIAL-GAP: **Editing** 1 ❌→✅ → ❌30→29·✅227→228. Editing 18/13/4/1→18/14/4/0(0 ❌). reconcile 19/19·330.

## AC (측정 가능)
G-1 view→클릭 진입·커스텀 editor autofocus(toBeFocused)·Enter→commit(포커스 상태)·Esc→cancel(원복, 커밋 0)·built-in editType 무회귀(chromium 발산). node 신규 0(lifecycle=브라우저, 정직 — fabricate 금지).

## constraints
- **MIT**(grid-renderers, license gate 0 — 기존 EditableCell 무-게이트 확인). 외부 dep 0.
- **LESS-006**: lifecycle(focus/Enter/Esc)=브라우저 행동 → chromium 발산(정적 presence 금지). **node-pure spine 없음 = 정직**(MOD-49 G-1·MOD-35 G-3 동형, fabricate 금지).
- **비공허성 기준 사전 확정(advisor)**: focus+Enter+Esc 셋 다 story 배선 0 으로 성립 → ✅. 소비자가 핵심 lifecycle 여전히 배선 → 🟡. **결과 보기 전 확정**(retrofit ❌→✅ 금지).
- 기존 editType 경로(select/textarea/input)·draft·handleKey·useEffect autofocus = **renderEditor 분기를 if(isEditing) 최상단에 추가**, 기존 분기 무수정(OFF byte-identical=기존 11 static story 회귀).
- value=string(onCommit 계약 유지). 임의 value-type parity 주장 금지(스코프=consumer-supplied editor component).

## 의존
grid-renderers 내부(EditableCell prop 추가). story=grid-renderers stateful(standalone, Grid 불필요 — lifecycle 전부 EditableCell 내부). 신규 외부 dep 0.

## 분류 (MASTER §2)
renderEditor 슬롯+lifecycle 배선 = **배선형**(chromium 발산). 순수 신규 0.

## reuse-gate 결과 / 추측 0
재사용=EditableCell 기존 draft·autofocus useEffect·handleKey(Enter/Esc/Tab) lifecycle 을 renderEditor 슬롯에 재배선(신규 lifecycle 무발명). 신규=renderEditor prop + ctx + 진입 autofocus 대상 분기(inputRef→focusRef).
추측 0: AG `cellEditor`/`cellEditorSelector`(custom React editor component, 자동 focus/stopEditing on Enter/Esc)·Wijmo `CellTemplate` = 1차 출처. gap line 276/579 verified-absent(grep 0).

## specify rubric (Full — 점수, 게이트 C)
- [x] Goal(custom editor slot, AG cellEditor 대응; 비공허=lifecycle 위임) **9/10** · [x] In/Out(In renderEditor+ctx·value-type/registry/popup Out 명시) **10/10**
- [x] AC 측정(view→클릭 진입·toBeFocused·Enter/Esc 발산·built-in 무회귀 chromium) **10/10** · [x] reuse-gate(기존 EditableCell lifecycle 재배선·license 무-게이트 확인) **10/10**
- [x] constraints(MIT·LESS-006 node-0 정직·비공허 사전확정·OFF byte-identical·value=string 스코프) **10/10** · [x] 의존(내부 prop, 외부 0) **10/10**
- [x] 추측 0(AG cellEditor 1차·gap verified grep 0) **9/10** · [x] 분류(§2 배선형, 순수 0) **9/10**
- **합계 77/80 — 게이트 통과.**

---

## G-1 결과 (완료 — 2026-06-07) → MOD-51 = {G-1} 완주, §3 이관
**구현**(grid-renderers `EditableCell.tsx`, 기존 editType 경로 무수정):
- `renderEditor?(ctx: CustomEditorContext)` prop + `CustomEditorContext`(value/onChange/commit/cancel/focusRef) 타입 + index export.
- `if (isEditing)` **최상단** renderEditor 분기: `<div onKeyDown={handleKey}>{renderEditor(ctx)}</div>`. handleKey 타입 HTMLElement 로 확장(wrapper div + 기존 input 공용).
- autofocus useEffect: `renderEditor ? customEditorRef.current : inputRef.current` 선택 → ctx.focusRef(callback ref)가 소비자 요소 등록.
- ctx: value=draft, onChange=setDraft, commit=()=>onCommit(draft), cancel=onCancel, focusRef=(el)=>customEditorRef.current=el.

**검증**: typecheck 0(focusRef `(HTMLElement|null)=>void` → input ref 호환=contravariant) · build green · **chromium 3/3**(`editable-cell-custom-editor.spec.ts`) +
**전체 회귀 87/87**(84 + 3, 기존 11 static story OFF byte-identical). node 신규 0(lifecycle=브라우저, 정직 — fabricate 금지).
- ★view→클릭 진입→커스텀 editor autofocus(toBeFocused, built-in `border-blue-400` 부재) · Enter(포커스 상태)→commit · Esc→cancel — story 가 focus/Enter/Esc **하나도 미배선**.

## ★ closure + 발견 (advisor)
- **Custom cell editor component slot = ✅**: renderEditor lifecycle slot — 소비자 editor 가 진입 autofocus·Enter→commit·Esc→cancel 를 슬롯에서 받음
  (raw cell 무료 미제공). gap line 276/579 "EditType fixed union, no consumer-supplied editor" 해소. **Editing 13/4/1→14/4/0(0 ❌)**.
  COMMERCIAL-GAP **❌30→29·✅227→228·🟡70**(reconcile 19/19·합 330·0 mismatch). 잔여 ❌ tier Community 10→9.
- **★keydown 버블링 = 비공허성 원천**(advisor): 소비자 editor 의 keydown 이 슬롯 wrapper `<div onKeyDown>` 로 버블 → EditableCell 가 Enter/Esc/Tab
  처리. **ctx 에 onKeyDown 미노출**이 핵심 — 노출하면 "소비자가 직접 배선"이 되어 비공허 주장 붕괴(advisor). focusRef 도 동형(소비자가 focus() 호출 안 함).
- **★비공허 기준 사전 확정**(retrofit 금지): focus+Enter+Esc 셋 다 story 배선 0 으로 성립 → ✅. story 가 ctx.onChange·ctx.focusRef 만 부착, 나머지 lifecycle 0.
- **★정직 스코프**: value=string(onCommit(string) 계약 유지) — 임의 value-type parity 주장 아님(=vN). gap=consumer-supplied editor **component** 닫음(정확).
- **node-pure spine 없음 = 정직**(LESS-006, MOD-49 G-1·MOD-35 G-3 동형). lifecycle=DOM focus/keydown=브라우저 행동, node SSR 미실행 → fabricate 금지.

## 모듈 완주 요약
1-Goal: Track 2 제품결정 2번째(advisor 위임). EditableCell 기존 draft/handleKey/autofocus lifecycle 을 renderEditor 슬롯에 재배선(신규 lifecycle 무발명).
chromium 발산(autofocus·Enter-commit·Esc-cancel, story 배선 0)=비공허. 기존 editType 경로 무수정(회귀 87/87). 신규 lesson 없음(LESS-006 적용).
