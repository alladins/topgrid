# MOD-GRID-71 — 마스터-디테일 가상화 (master-detail + virtualization)

dev-harness 53번째 (**Enterprise ❌ backlog — render tail 2**, advisor). grid-pro-master(Pro).
갭분석 **Master/Detail & Tree ❌ = Master-detail + virtualization**(MasterDetailGrid=plain non-virt `<table>`, scrollTo no-op, 대형 데이터셋 미지원). 경쟁: FlexGrid 가상화.

## verify-first + reuse-gate (advisor: disposition 판정, build sprint 아님)
- grep: MasterDetailGrid `<tbody>{rows.map(MasterRow)}`=비-virt. scrollTo=no-op stub(L258). MasterRow=Fragment(master tr + 조건부 detail tr). genuine 부재(컴포넌트 자체는 작동=master-detail ✅).
- ★**핵심 판정(advisor)**: detail 행=가변 높이 → **고정높이 estimator 면 🟡(measure 불가)**. 정확 구현=react-virtual **measureElement**(동적, ResizeObserver) + **tbody-per-row**(master+detail 단위가 단일 측정 요소; Fragment-of-2-trs 는 measureElement 단일-요소 가정 위반 → 행마다 `<tbody>`).
- 재사용: grid-pro-agg 가상화 spacer 패턴·react-virtual·MasterRow(stable type) 무수정.
- **build-vs-defer(read)**: enableVirtualization opt-in + measureElement, 비-virt 경로 OFF byte-identical → build. ★verify 결과로 disposition: 동적 측정 windowing+expand 비공허 입증 시 ✅, 측정 불안정/미입증 시 정직 🟡(고정높이 한계).

## Goals
- **G-1 가상화 배선 (배선형, chromium ★비공허, 순수 0 정직)**:
  - MasterDetailGrid `enableVirtualization?`/`estimatedRowHeight?`(=48) → react-virtual(scrollRef 컨테이너, **measureElement** 동적) + **tbody-per-row**(각 master 행 = `<tbody>` containing master tr + 조건부 detail tr, measureElement 가 tbody 측정). top/bottom spacer tbody. scrollTo 배선(virtualizer.scrollToIndex). 비-virt(OFF)=기존 단일 tbody 경로 byte-identical.
  - **★비공허(advisor)**: ① 대형 데이터셋(예 200행) enableVirtualization → DOM 에 **window 만**(렌더 tbody 수 << 200) ② 스크롤 → window 이동(다른 행 등장) ③ expand → detail 렌더 + measureElement 가 확장 높이 측정(겹침 없음). "행 렌더됨"=vacuous 금지.

## In / Out
- **In**: enableVirtualization/estimatedRowHeight props + react-virtual measureElement + tbody-per-row(virt 경로) + scrollTo 배선 + 스토리 + chromium.
- **Out(명시 — silent gap 금지)**:
  - 가로 가상화 · 무한/서버 로드(SSRM=grid-pro-serverside 별개) · 가상화 시 sticky 헤더 = vN.
  - **disposition 분기**: measureElement 동적 측정이 expand 가변높이를 harness 서 비공허 입증 못 하면 → 🟡(virt windowing ship·가변 detail 측정 한계 문서화). 입증 시 → ✅.

## ★ ❌ 닫힘 마커
- **Master-detail + virtualization = ✅ 또는 🟡**(verify 결과): COMMERCIAL-GAP Master/Detail&Tree 1 ❌→✅/🟡. ✅ 면 ❌9→8·✅246→247 · 🟡 면 ❌9→8·🟡72→73. reconcile 19/19·330.

## AC
G-1 ★windowing(chromium: 200행→DOM tbody 수 << 200)+스크롤 window 이동+expand detail 렌더(measureElement) · OFF byte-identical.

## constraints
- grid-pro-master(Pro). react-virtual=peer(grid-core 동일). **LESS-006**: 가상화/측정=chromium 발산. 순수 0(정직, 측정=브라우저).
- 기존 non-virt 경로·MasterRow·DetailRow 무수정(OFF byte-identical). measureElement=동적(고정높이 estimator 회피).

## 의존
grid-pro-master 내부(MasterDetailGrid + react-virtual). story=MasterDetailGrid(enableVirtualization, 대형 데이터). 외부=react-virtual(peer).

## 분류 (MASTER §2)
가상화 배선=**배선형**(chromium windowing 발산). 순수 substance 0(정직).

## reuse-gate 결과 / 추측 0
재사용=grid-pro-agg 가상화 spacer·react-virtual measureElement·MasterRow stable type. 신규=tbody-per-row virt 경로. 추측 0: react-virtual measureElement(동적 행 측정)=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(가상화 measureElement 비공허) **9/10** · [x] In/Out(가로/무한/sticky Out·disposition 분기) **10/10** · [x] AC(windowing+expand·OFF byte-identical) **10/10**
- [x] reuse-gate(agg spacer·measureElement·MasterRow) **10/10** · [x] constraints(동적 측정·OFF byte-identical) **10/10** · [x] 의존(내부+react-virtual peer) **9/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(배선형, 순수 0 정직) **9/10** · **합계 76/80 통과.**
