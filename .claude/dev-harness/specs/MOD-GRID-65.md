# MOD-GRID-65 — 도구 패널 드래그 재정렬 (tool panel reorder via drag)

dev-harness 47번째 (**Enterprise ❌ backlog — DnD 클러스터 2번째**, advisor). grid-pro-panel(Pro) + grid-core(MIT).
갭분석 **Misc UX ❌ = Tool panel reorder via drag**(ToolPanel onReorder 가 up/down 버튼만, draggable/onDrop 없음). 경쟁: AG columns tool panel 드래그 재정렬.

> ★ gate-B 메모: 본 spec 파일은 구현과 병행 작성(advisor 2회 consult 로 설계 사전 확정 — 우선순위/배치/order-math 수렴/비공허 판별/Out 모두 결정 후 구현). 절차상 spec 파일 선작성 누락을 정직 기록.

## verify-first + reuse-gate (advisor 재조정 — 증거가 1차 가정 번복)
- grep: ToolPanel `onReorder(id,'up'|'down')` 버튼만(draggable/onDrop 0). 갭 genuine.
- **1차 가정(advisor)=ToolPanel→grid columnOrder→헤더 재정렬 배선** → ★증거로 번복: grid-core Grid `columnOrder`=**uncontrolled useState**(controlled input prop 없음, Grid.tsx:127)·GridHandle 에 setColumnOrder/table **없음** → grid-header 배선=controlled columnOrder prop 추가=**core surgery(post-sort defer 류) → 금지**. 갭 행도 **Misc UX ToolPanel-scoped**(grid-header 아님).
- **order math 수렴**: useColumnDrag.onDrop 에 reorder math **inline**(insert-before), standalone 부재·chromium 가드 부재. advisor: header-drag↔panel-drag 가 **동일 의미론**이어야(둘 다 columnOrder 조작). → grid-core 자체 중복 math 를 순수 helper 로 추출(byte-identical)·export, 양쪽 공유.
- **LESS-009 재적용**: useColumnDrag 가 **이미 ref-first**(dragSourceId.current + dataTransfer optional) = dispatchEvent 테스트 가능 → 리팩터 안전 + 헤더-drag chromium 신규로 사전-부재 커버리지 폐쇄.

## Goals
- **G-1 순수 reorderColumnOrder — 종결형(map)**:
  - `reorderColumnOrder(baseOrder, sourceId, targetId): string[]` (insert-before: source 제거 후 target 위치 삽입). no-op(source=target / target 부재)=**same ref**(caller `===` 검출).
  - useColumnDrag.onDrop 을 helper 호출로 리팩터(**byte-identical**: target 부재 시 same ref→setColumnOrder 미호출 = 기존 targetIndex===-1 early-return 과 동일). grid-core index export.
  - node 검증 + **헤더-drag chromium 가드**(리팩터 byte-identity).
- **G-2 ToolPanel DnD 배선형(chromium ★비공허)**:
  - ToolPanel `onColumnDrop?(sourceId,targetId)` + 행 draggable/onDrop(**ref-keyed**, dataTransfer try-guard 폴백). ★**stateless 유지**(내부 order state 0).
  - **★비공허(advisor, MOD-64 trap 회피)**: ToolPanel 이 stateless 라 자기 행을 prop 피드백 없이 재정렬 **불가** → 스토리서 columnOrder useState→onColumnDrop→reorderColumnOrder→setState→패널 재렌더. **패널 행 순서 변경 assert = 전 체인 입증**(drag 발화+args+helper+소비자 재렌더).

## In / Out
- **In**: grid-core 순수 reorderColumnOrder+test+export+useColumnDrag 리팩터+헤더-drag story/test. grid-pro-panel ToolPanel onColumnDrop+grid-core devDep+story+test.
- **Out(명시 — silent gap 금지)**:
  - **pinned-column drop**: useColumnDrag 는 AC-004 pinned 가드 있으나 `ToolPanelColumn` 에 isPinned 없음 → tool-panel drag 는 pinning 미처리 = vN.
  - **up/down 버튼(delta) vs drag(insert-before) 공존**: 두 어포던스 의미론 상이(공존, 제거 안 함).
  - grid-header 배선(controlled columnOrder)=core surgery 회피로 Out.

## ★ ❌ 닫힘 마커
- **Tool panel reorder via drag = ✅**: 순수 reorderColumnOrder(공유)+ToolPanel onColumnDrop(stateless). COMMERCIAL-GAP **Misc UX** 1 ❌→✅ → ❌16→15·✅240→241. reconcile 19/19·330.

## AC
G-1 reorderColumnOrder insert-before+no-op same ref(node)·헤더-drag 재정렬(chromium 가드) · G-2 ★stateless ToolPanel 행 재정렬(소비자 재렌더, 비공허).

## constraints
- grid-pro-panel(Pro)+grid-core(MIT). 외부 dep 0. **LESS-006**: DnD 동작=chromium 발산. 순수 map=node. **LESS-009**: ref-keyed 핸들러(e.dataTransfer try-guard).
- useColumnDrag 리팩터=**byte-identical**(기존 column-drag 동작 보존, 헤더-drag chromium 가드). keyboard handler(pinned-skip 의미론)=무수정.

## 의존
grid-core 내부(reorderColumnOrder+useColumnDrag)+grid-pro-panel ToolPanel(grid-core devDep=story). story=grid-core 헤더-drag + grid-pro-panel ToolPanel drag(공유 reorderColumnOrder). 외부 0.

## 분류 (MASTER §2)
reorderColumnOrder=**종결형**(순수 map). ToolPanel DnD/헤더-drag 가드=**배선형**(chromium).

## reuse-gate 결과 / 추측 0
재사용=useColumnDrag inline math(추출=공유)·ref-keyed DnD(LESS-009)·MOD-33 dispatchEvent 패턴·grid-pro-agg grid-core devDep 선례(MOD-60). 신규=reorderColumnOrder export+ToolPanel onColumnDrop. 추측 0: AG columns tool panel drag=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(reorderColumnOrder map + ToolPanel stateless DnD) **9/10** · [x] In/Out(pinned/버튼공존/core-surgery Out) **10/10** · [x] AC(node map·stateless 비공허 chromium·헤더 가드) **10/10**
- [x] reuse-gate(useColumnDrag 추출·LESS-009·MOD-60 devDep 선례) **10/10** · [x] constraints(byte-identical·LESS-006/009) **10/10** · [x] 의존(내부+grid-core, 외부 0) **9/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(종결형+배선형) **9/10** · **합계 76/80 통과.**

---

## G-1·G-2 결과 (완료 — 2026-06-08) → MOD-65 = ✅, §3 이관
**구현**:
- G-1 grid-core 순수 `reorderColumnOrder(baseOrder,sourceId,targetId)`(insert-before, no-op=same ref) 추출 → useColumnDrag.onDrop 이 호출(byte-identical) + index export. keyboard handler 무수정.
- G-2 grid-pro-panel ToolPanel `onColumnDrop?(sourceId,targetId)` + 행 draggable/onDrop(ref-keyed dragSourceId + dataTransfer try-guard 폴백, **stateless**). grid-core devDep(story).

**검증**: **node 10/0**(`reorderColumnOrder.test.ts`) · typecheck 0(grid-core+panel) · build green · **chromium 2/2**(`tool-panel-drag.spec.ts` ★stateless 행 재정렬+왕복 · `grid-column-reorder.spec.ts` 헤더-drag 가드) + **full-suite 111/111 green**.

## ★ closure + 발견 (advisor)
- **Tool panel reorder via drag = ✅**: COMMERCIAL-GAP **Misc UX 7/4/3→8/4/2**(❌→✅), **❌16→15·✅240→241·🟡71**(reconcile 19/19·330·0 mismatch·Enterprise 10→9).
- **advisor 재조정**: 증거(uncontrolled columnOrder·GridHandle 한계·갭=ToolPanel-scoped)가 1차 가정(grid-header 배선) 번복 → core surgery 회피, ToolPanel stateless 로 비공허 확보.
- **수렴 + 커버리지 보너스**: header-drag/tool-panel-drag 단일 reorderColumnOrder 의미론 + 사전-부재 헤더-drag chromium 가드 신규(리팩터 de-risk).
- **신규 lesson 없음**: LESS-009 N=3 재적용(DnD 클러스터 표준 확립).

## 모듈 완주 요약
2-Goal(✅): Enterprise backlog 12번째(DnD 클러스터 2, advisor). 순수 reorderColumnOrder(grid-core 추출=공유, node 10/0)+ToolPanel onColumnDrop(stateless DnD). ★advisor: grid-header 배선=core surgery 금지(uncontrolled), ToolPanel-scoped 비공허. Out: pinned·버튼공존. 111/111 green. LESS-009 N=3.
