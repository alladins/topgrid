# MOD-GRID-43 — 증분 행 트랜잭션 (applyTransaction + async batching)

dev-harness 26번째 (vN-4). 갭분석 Community ❌ 2건 = **applyTransaction**(증분 add/update/remove) · **async transaction batching**.
경쟁: XX Grid `applyTransaction`/`applyTransactionAsync`. ★Community "빠른 승부" 9건 중 **첫 분할**(node-pure 자립 쌍).

## reuse-gate (LESS-003) + 분할 근거 (advisor)
- **survey 결과**(Explore): 9 community 중 applyTransaction·async batching = **genuine 부재**(grid-pro-tracking 은 change-*추적*, row-model
  *트랜잭션* 아님; grid-core onAddRow/onUpdateRow/onDeleteRow = parent 위임 full-replace, delta 아님).
- **★controlled-data 정책**(grid-core): Grid 는 데이터 소유 안 함(callback 위임). → applyTransaction = **순수 helper**(소비자가 자기
  state 에 적용), `moveRow`(MOD-33) 동형. **Grid.tsx 수술 0**(최저 위험·자립·node-검증).
- **분할(advisor spec-gate)**: 9 를 한 모듈에 넣지 않음. **node-pure 자립 쌍(본 모듈)** vs surgery-risk node(postSortRows·scroll-debounce) vs
  browser-3(auto-page-size·row-animation·drag-between-grids)=별도 모듈. 본 모듈은 **Grid 내부 무수정 = 깨끗한 commit**.
- 재사용: getRowId 개념(MOD-36)·immutable 배열 패턴(moveRow). 신규=`applyRowTransaction`·`createTransactionBatcher`(신규 파일).

## Goals
- **G-1 applyTransaction (순수) — 종결형**:
  - `applyRowTransaction(data, txn, getRowId)`: `txn={add?,update?,remove?}`. 순서=**remove→update→add**(AG 동형). remove=id Set
    필터·update=id 매칭 교체(immutable)·add=append. 입력 무변(새 배열 반환). 미존재 id update/remove=무시(no-throw).
  - **검증**: node(strip-types, grid-core 패턴) — add·update·remove 각각·복합·미존재 id 무시·★입력 immutability·빈 txn=동등 복사.
- **G-2 async transaction batching — 종결형(injected scheduler=PAT-005)**:
  - `createTransactionBatcher({getData,setData,getRowId,schedule})`: enqueue(txn)→큐 누적, 첫 enqueue 시 schedule(flush) 1회.
    flush=현 data 에 큐 txn 순차 적용→setData 1회·큐 비움. **scheduler 주입**(prod=queueMicrotask, node=수동 제어→결정적).
  - **검증**: node — ★다중 enqueue→**flush 1회**(setData 1회 호출, batched)·순차 적용 정확·flush 후 재-enqueue 새 배치·빈 큐 no-op.

## In / Out
- **In**: 순수 `applyRowTransaction` + `createTransactionBatcher`(scheduler 주입). node 검증. 소비자가 자기 data state 에 적용(controlled).
- **Out(별도 모듈)**: postSortRows·scroll-debounce(node, Grid/sort 수술) · auto-page-size·row-animation·drag-between-grids(browser) ·
  virtualizationThreshold·pageNumberFormat(Grid/component 수술). = Community 9 중 나머지 7(분할).

## ★ ❌ 닫힘 마커
- **applyTransaction = ✅**: 순수 delta API(소비자 적용, moveRow 동형, node 실증). gap "onAddRow=full-replace, delta 아님" 해소.
- **async batching = ✅**: 배치 큐+flush 1회 실증(scheduler 주입=결정적 node). gap "no batched queue" 해소.
- COMMERCIAL-GAP: **Row models / data** 카테고리 2 ❌→✅ → ❌43→41·✅220→222·🟡64(reconcile, 단일 카테고리).

## AC (측정 가능)
G-1: remove/update/add/복합/immutability/미존재-id. G-2: 다중 enqueue→flush 1회·순차 정확·재배치. 전부 node.

## constraints
- **MIT**(grid-core, license gate 0). 외부 dep 0. C-003. **LESS-006**: 순수 → node ceiling(브라우저 행동 없음). 기존 grid-core 무수정
  (자립 신규 파일 + index export). PAT-005(scheduler 주입).

## 의존
grid-core 내부(신규 파일). 신규 외부 dep 0.

## 분류 (MASTER §2)
applyRowTransaction·batcher = **종결형**(순수, scheduler 주입). Grid wiring 없음(소비자 적용).

## reuse-gate 결과 / 추측 0
재사용=immutable 패턴(moveRow)·getRowId(MOD-36). 신규=트랜잭션 적용·배치. 추측 0: AG applyTransaction 순서(remove→update→add)·
applyTransactionAsync 배치 = 1차 출처. controlled-data 정책 = grid-core 기존(survey 확인).

## specify rubric (Full — 점수, 게이트 C)
- [x] Goal(증분 트랜잭션, AG 대응) **9/10** · [x] In/Out(순수 In·7 분할 Out 명시) **10/10**
- [x] AC 측정(remove/update/add/immutability/flush-1회, node) **10/10** · [x] reuse-gate(controlled-data·moveRow 재사용·분할 근거) **10/10**
- [x] constraints(MIT·LESS-006·PAT-005 scheduler) **9/10** · [x] 의존(내부 신규파일, 외부 0) **10/10**
- [x] 추측 0(AG 순서 1차) **9/10** · [x] 분류(§2 종결형) **10/10**
- **합계 77/80 — 게이트 통과.**

---

## G-1·G-2 결과 (완료 — 2026-06-07) → MOD-43 = {G-1,G-2} 완주, §3 이관
**구현**(신규 파일 `grid-core/src/internal/transaction.ts`, Grid.tsx 무수정):
- G-1 `applyRowTransaction(data, txn, getRowId)`: 순수 delta(remove→update→add, immutable slice/filter/map/concat). 미존재 id 무시.
- G-2 `createTransactionBatcher({getData,setData,getRowId,schedule})`: enqueue 큐 누적 + 첫 enqueue 시 `schedule(flush)` 1회(armed),
  flush=큐 txn 순차 reduce 적용→setData 1회·큐 drain. scheduler 주입(PAT-005).
- index.ts export(applyRowTransaction·createTransactionBatcher + 타입). package.json test 스크립트에 transaction.test.ts 추가.

**검증**: node **transaction.test.ts 16/0**(strip-types) + grid-core 전 스위트 green(moveRow 10·rowClickSelection 11·computeChangedCells
7·localeSort 8·sortNulls 11·transaction 16 = **63**). typecheck 0·tsup build green(ESM+CJS+DTS).
- G-1: add/remove/update/복합(순서)/미존재 id 무시/빈 txn/★immutability(입력 무변·새 배열).
- G-2: ★다중 enqueue→**setData 1회**(batched)·3 txn 순차 정확·schedule armed 1회·flush 후 재배치·빈 큐 no-op.

## ★ closure (advisor — Community 9 분할)
- **applyTransaction=✅ / async batching=✅**: 둘 다 순수·node 실증·실 API. Row models/data 2 ❌→✅.
- COMMERCIAL-GAP: **❌43→41·✅220→222·🟡64**(reconcile 19/19·330·Row models/data 14/3/1·Community tier 15→13).
- **분할 잔여 7**(후속): postSortRows·scroll-debounce(node, Grid/sort 수술) · auto-page-size·row-animation·drag-between-grids(browser
  module) · virtualizationThreshold·pageNumberFormat(component 수술).

## 모듈 완주 요약
2-Goal: controlled-data 정책→순수 helper(Grid 무수정, moveRow 동형) + scheduler 주입(PAT-005)으로 async 결정적 검증. 신규 lesson 없음
(LESS-005/moveRow·PAT-005 적용). node 16/0(전 스위트 63). closure 둘 다 ✅. Community 9 첫 분할(자립 쌍).
