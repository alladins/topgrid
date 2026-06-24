# MOD-GRID-60 — 뷰 상태 저장/복원 (view-state save: row-group + pivot)

dev-harness 43번째 (**Enterprise ❌ backlog — Tier 1 node-pure**, advisor). grid-core(MIT).
갭분석 **State, theming & i18n ❌ 2건 = Row-group state save/restore + Pivot state save/restore**. 경쟁: AG 그룹/피벗 상태 영속·xxxx.

## verify-first + reuse-gate (advisor 사전 reconcile)
- grep: useGridState 8-key 에 grouping/pivot 없음(genuine 부재). `useExpandedPersistence`(grid-pro-master)=per-package 독립 영속 훅 **선례** → straddle 아님(grid-core 엔벨로프 재사용, useGridState 무수정).
- 재사용: grid-core/internal/storage(getStorage/readRaw/writeRaw)·serializeState {v,p} 엔벨로프 형. 신규=versioned generic 엔벨로프 + generic 훅.
- **license**: grid-core MIT(영속 무-게이트).

## Goals
- **G-1 순수 엔벨로프 + generic 영속 훅 — 종결형(엔벨로프) + 배선형(훅)**:
  - 순수 `serializeViewState<T>(value,version)→string`(versioned {v,p}) / `deserializeViewState<T>(raw,version)→T|null`(null raw·parse 실패·wrong shape·version mismatch→null=stale 폐기). **node 검증**.
  - `useViewStatePersistence<T>({storageKey,initial,version?,storageType?})→[value,setValue]`(useExpandedPersistence 선례, useState 초기화=storage read+deserialize, setValue=write-through). 소비자가 grouping(agg)/config(pivot) 영속 배선.
  - **검증**: node(엔벨로프 round-trip/version/parse/wrong-shape/empty). chromium ★발산: grouping/pivot config 적용→**remount(fresh 컴포넌트 storage 재read)→복원**(persistence 없으면 initial 리셋).

## In / Out
- **In**: 순수 엔벨로프 + 훅 + node test + 소비자 배선 스토리(agg grouping·pivot config). useGridState/8-key 무수정.
- **Out**: 자동 grid 배선(callback-only) · useStoragePersist 8-key 통합 · URL sync 변형.

## ★ ❌ 닫힘 마커
- **Row-group state save + Pivot state save = ✅(2건)**: generic useViewStatePersistence 로 grouping·config 영속. COMMERCIAL-GAP **State theming** 2 ❌→✅ → ❌21→19·✅236→238. reconcile 19/19·330.

## AC
G-1 엔벨로프 round-trip/version mismatch/parse 실패/wrong shape(node) · grouping/pivot config remount→복원(chromium 발산).

## constraints
- **MIT**(grid-core). 외부 dep 0. **LESS-006**: 영속 correctness=node(엔벨로프), remount 복원=브라우저 chromium.
- useGridState/8-key/useExpandedPersistence 무수정(독립 신규). callback-only(소비자 배선).
- version=schema 변경 안전(mismatch→initial fallback).

## 의존
grid-core 내부(신규 viewStateEnvelope + useViewStatePersistence + index). story=agg(grouping)·pivot(config) — grid-pro-agg 에 grid-core devDep 추가(스토리 import). 외부 0.

## 분류 (MASTER §2)
serializeViewState/deserializeViewState=**종결형**(순수). useViewStatePersistence+배선=**배선형**(chromium).

## reuse-gate 결과 / 추측 0
재사용=storage internals·serializeState {v,p} 형·useExpandedPersistence 패턴. 신규=versioned generic 엔벨로프+훅. 추측 0: AG 그룹/피벗 상태 영속·useExpandedPersistence=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(view-state save 2건, node-pure+훅) **9/10** · [x] In/Out(자동배선/8-key 통합 Out) **10/10** · [x] AC(엔벨로프 node·remount 복원 chromium) **10/10**
- [x] reuse-gate(useExpandedPersistence 선례·storage 재사용·straddle 아님) **10/10** · [x] constraints(MIT·LESS-006·useGridState 무수정) **10/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(종결형+배선형) **9/10** · **합계 77/80 통과.**

---

## G-1 결과 (완료 — 2026-06-07) → MOD-60 = {G-1} 완주, §3 이관
**구현**(grid-core, useGridState 무수정): 순수 `serializeViewState`/`deserializeViewState`(versioned {v,p} 엔벨로프) + `useViewStatePersistence<T>({storageKey,initial,version?,storageType?})` 훅(useExpandedPersistence 선례, getStorage/readRaw/writeRaw + 엔벨로프) + index export. 소비자가 grouping(agg)/config(pivot) 영속 배선.
**검증**: **node 11/0**(`viewStateEnvelope.test.ts`: round-trip grouping/pivot config·version mismatch→null·parse 실패→null·wrong shape→null·empty·version 0) · typecheck 0 · build green · **chromium 2/2**(`view-state-persist.spec.ts`) + **full-suite 106/106 green**(retries; 95+11 flaky+0 failed).
- ★grouping 적용→remount(fresh 컴포넌트 storage 재read)→복원(persistence 없으면 [] 리셋) · pivot transpose→config 영속→remount→복원(transposed rows 유지).

## ★ closure + 발견 (advisor)
- **Row-group state save + Pivot state save = ✅(2건)**: generic useViewStatePersistence 로 둘 다 영속. **State theming 10/4/3→12/4/1**. COMMERCIAL-GAP **❌21→19·✅236→238·🟡70**(reconcile 19/19·330·0 mismatch). Enterprise ❌13→11.
- **★node-pure anchor(advisor Tier 1)**: versioned 엔벨로프 correctness(round-trip/version/parse)=node 11/0, 훅 wiring+remount 복원=chromium(LESS-006 split). MOD-53 이후 다시 node-pure substance 있는 모듈.
- **★useExpandedPersistence 선례=straddle 아님**: per-package 독립 영속 훅 패턴(grid-core 엔벨로프 재사용). generic 훅(MIT)로 agg/pivot 공용. grid-pro-agg 에 grid-core devDep 추가(스토리).
- remount=복원 증명(fresh useState 초기화가 storage 재read). callback-only(소비자 배선, grid 상태 미주입).

## 모듈 완주 요약
1-Goal(2 ❌ 닫음): Enterprise backlog 8번째(advisor Tier 1 node-pure). 순수 versioned 엔벨로프(node 11/0)+generic useViewStatePersistence 훅(useExpandedPersistence 선례). node correctness+chromium remount 복원. useGridState 무수정(106/106). 신규 lesson 없음.
