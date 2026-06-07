# MOD-GRID-66 — 그리드 간 행 드래그 (drag-between-grids / row transfer)

dev-harness 48번째 (**Enterprise ❌ backlog — DnD 클러스터 3번째(마지막)**, advisor). grid-core(MIT).
갭분석 **Community ❌ = drag-between-grids**(한 그리드의 행을 다른 그리드로 드래그 이전). 경쟁: AG row drag managed + 외부 drop.

## verify-first + reuse-gate (advisor build-vs-defer 게이트=Grid.tsx read)
- grep: Grid.tsx `rowDragProps`(871)=enableRowReorder 전용(내부 재정렬), 외부 drop 0. genuine 부재.
- ★**build-vs-defer 판정(Grid.tsx read 결과)**: 외부 drop-target 을 **신규 opt-in** 으로, OFF byte-identical, 기존 row render/enableRowReorder **무수정** 추가 **가능** → build(defer 아님). post-sort(hot-path 전반 얽힘)와 **구별**: 본 모듈=additive 콜백, 계약-침습 아님. enableRowReorder(MOD-33) 와 구조 동형(opt-in row drag).
- 재사용: MOD-33 moveRow(순수 array move) 형의 자매 `transferRow`. ref-keyed DnD(LESS-009 N=4). dispatchEvent 패턴(MOD-33/64/65).

## 설계 (advisor — LESS-009 일반화: consumer-owns-payload)
- 교차-그리드 문제="그리드 A 의 drag source 가 그리드 B 의 drop 핸들러에 안 보임". **잘못된 해법=dataTransfer 로 payload 운반**(합성 이벤트 cross-event=불안정, MOD-61 territory). **올바른 해법=드래그된 행을 두 그리드 *위* 소비자 state 로 들어올림**(stateless 패턴 3번째).
  - 그리드 A row dragstart → `onRowDragStart(rowId)` → 소비자 `setDragged(rowId)`. dataTransfer 미접근.
  - 그리드 B drop → `onRowDrop()` → 소비자가 자기 `dragged` 읽어 순수 `transferRow` 적용.

## Goals
- **G-1 순수 transferRow — 종결형(map)**:
  - `transferRow<T>(source, target, rowId, getId): { source: T[]; target: T[] }` — source 서 rowId 행 제거 후 target 끝에 추가. rowId 부재 시 무변경(same refs).
  - node 검증: 이전·부재 no-op·원본 불변·getId 사용.
- **G-2 grid-core opt-in 배선형(chromium ★end-to-end)**:
  - GridProps `onRowDragStart?(rowId)`(제공 시 행 draggable+onDragStart emit, ref-free=row.id 직접) + `onRowDrop?()`(제공 시 scroll container=drop target, onDragOver preventDefault+onDrop emit). **OFF byte-identical**(콜백 미제공=기존 마크업, 무 props).
  - **★발산(advisor)**: 스토리서 그리드 A·B 가 `dragged` state 공유. A 행 dragstart→B drop → 소비자 transferRow → **행이 A 서 사라지고 B 에 출현**(end-to-end, dispatchEvent 구동).

## In / Out
- **In**: 순수 transferRow+test+export + GridProps onRowDragStart/onRowDrop + Grid.tsx additive 배선(OFF byte-identical) + 2-그리드 스토리 + chromium.
- **Out(명시 — silent gap 금지)**:
  - **동일 그리드 enableRowReorder + 외부 drop 동시**: 두 opt-in 분리, 스토리는 같은 그리드서 미혼용(drop 핸들러가 내부-재정렬 vs 외부-이전 구분=disambiguation 미빌드). = vN.
  - 행-레벨 drop 위치(target index) 지정 = vN(grid-level drop=append).
  - 가상화 그리드 drag source(rowDragProps 비-virt 동형) · drop 시각 인디케이터 = vN.

## ★ ❌ 닫힘 마커
- **drag-between-grids = ✅**: 순수 transferRow + grid-core opt-in(onRowDragStart/onRowDrop), end-to-end(행 이전) 입증. COMMERCIAL-GAP **Community(Row models/Misc)** 1 ❌→✅ → ❌15→14·✅241→242. reconcile 19/19·330.

## AC
G-1 transferRow 이전+no-op(node) · G-2 ★A 행 dragstart→B drop→행 이전(chromium end-to-end) + OFF byte-identical.

## constraints
- grid-core(MIT). 외부 dep 0. **LESS-006**: DnD=chromium 발산. 순수 map=node. **LESS-009**: consumer-owns-payload(dataTransfer 미의존)=dispatchEvent 신뢰.
- ★**OFF byte-identical**(onRowDragStart/onRowDrop 미제공=기존 동작 무변경). enableRowReorder/rowDragProps 무수정(별 opt-in).

## 의존
grid-core 내부(transferRow + GridProps + Grid.tsx). story=2× Grid(공유 dragged state). 외부 0.

## 분류 (MASTER §2)
transferRow=**종결형**(순수 map). Grid onRowDragStart/onRowDrop 배선=**배선형**(chromium).

## reuse-gate 결과 / 추측 0
재사용=moveRow(순수 array) 형·rowDragProps 구조·ref/consumer-state DnD(LESS-009)·MOD-33 dispatchEvent. 신규=transferRow+2 opt-in props. 추측 0: AG row drag managed+외부 drop=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(transferRow map + grid-core opt-in end-to-end) **9/10** · [x] In/Out(reorder 혼용/target-index/virt Out) **10/10** · [x] AC(node map·행 이전 chromium·OFF byte-identical) **10/10**
- [x] reuse-gate(moveRow 형·rowDragProps·LESS-009·build-vs-defer read) **10/10** · [x] constraints(OFF byte-identical·LESS-006/009) **10/10** · [x] 의존(내부, 외부 0) **9/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(종결형+배선형) **9/10** · **합계 76/80 통과.**

---

## G-1·G-2 결과 (완료 — 2026-06-08) → MOD-66 = ✅, §3 이관
**구현**(grid-core, enableRowReorder/rowDragProps 무수정):
- G-1 순수 `transferRow<T>(source,target,rowId,getId)→{source,target}`(소스서 제거→타깃 끝, no-op=same ref) + index export.
- G-2 GridProps `onRowDragStart?(rowId)`(rowDragOutProps=행 draggable+dragstart emit, rowReorderActive 와 배타) · `onRowDrop?()`(rowDropTargetProps=scroll container drop). 둘 다 **additive opt-in**(미제공=무 props=OFF byte-identical).

**검증**: **node 12/0**(`transferRow.test.ts`) · typecheck 0 · build green · **chromium 1/1**(`drag-between-grids.spec.ts`) + **full-suite 112/112 green**.
- ★end-to-end: 그리드 A·B 가 dragged id state 공유(두 그리드 위)→A 행 dragstart→B drop→소비자 transferRow→행이 A서 사라지고 B에 출현(getRowId 안정 id, dispatchEvent).

## ★ closure + 발견 (advisor)
- **Drag between grids = ✅**: COMMERCIAL-GAP **Misc UX 8/4/2→9/4/1**(❌→✅), **❌15→14·✅241→242·🟡71**(reconcile 19/19·330·0 mismatch·Community 6→5).
- **build-vs-defer(Grid.tsx read)**: 외부 drop=additive opt-in(OFF byte-identical)→build. post-sort(hot-path 전반 얽힘)와 구별 = 계약-침습 아님.
- **LESS-009 일반화(N=4)=consumer-owns-payload**: 교차-그리드 payload 를 dataTransfer(합성 cross-event=MOD-61 territory) 대신 두 그리드 위 소비자 state 로 들어올림 → bare dispatchEvent 신뢰.
- **Out 명시**: 동일 그리드 reorder+외부drop 혼용(disambiguation)·target index·가상화 소스=vN.

## 모듈 완주 요약
2-Goal(✅): Enterprise backlog 13번째(DnD 클러스터 3=마지막, advisor). 순수 transferRow(node 12/0)+grid-core opt-in(onRowDragStart/onRowDrop, additive OFF byte-identical). ★consumer-owns-payload(LESS-009 N=4)·build-vs-defer=Grid.tsx read. 112/112 green. DnD 클러스터 완결(64·65·66).
