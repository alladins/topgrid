# MOD-GRID-57 — 자동 그룹 컬럼 (auto group column)

dev-harness 40번째 (**Enterprise ❌ backlog — Tier 2 verify-first**, advisor). grid-core(MIT).
갭분석 **Master/Detail & Tree ❌ = Auto group column**. 경쟁: AG `autoGroupColumnDef`·Wijmo.

## verify-first
- grep 확인: grid-core=auto group column 0(expand state 존재하나 indent/toggle 렌더는 소비자 cell 몫). genuine 부재. MOD-48 getDataPath/getSubRows(데이터 모델)는 있으나 렌더 절반 부재(그래서 🟡)였음 — 본 모듈이 렌더 절반.
- Grid 지원: `enableExpanding`+`getSubRows`→getExpandedRowModel(flatten). 증분=단일 컬럼 팩토리(indent+toggle+value).

## reuse-gate + scope
- 재사용: createCheckboxColumn 팩토리 패턴·TanStack row.depth/getCanExpand/getIsExpanded/toggleExpanded. 신규=`createAutoGroupColumn` 팩토리. **license**: grid-core MIT.

## Goals
- **G-1 auto group column 팩토리 (chromium 발산) — 배선형**:
  - `createAutoGroupColumn<TData>({header?,getValue?,indentUnit?,size?})→ColumnDef`. cell=깊이 들여쓰기(row.depth*indentUnit) + 펼침/접기 chevron(row.getCanExpand 시, toggleExpanded) + 노드 값(getValue). index export.
  - **검증 ★발산(advisor, "컬럼 보임"=vacuous 금지)**: ① 초기 collapsed=root 만, 자식 행 DOM 부재 ② root expand 토글 클릭→자식 행 출현(getValue 텍스트) ③ ★자식 들여쓰기 > root(row.depth 반영, paddingLeft 발산) ④ leaf=토글 없음(getCanExpand false).

## In / Out
- **In**: `createAutoGroupColumn` 팩토리 + index export + 스토리(tree getSubRows+enableExpanding). 기존 Grid/expand 무수정.
- **Out**: 그룹 행 집계(=grid-pro-agg) · group-by 자동 구성(=getDataPath 소비자 배선) · multi-auto-group-col(AG 변형).

## ★ ❌ 닫힘 마커
- **Auto group column = ✅**: 단일 컬럼 indent+toggle+value 팩토리. COMMERCIAL-GAP **Master/Detail & Tree** 1 ❌→✅ → ❌24→23·✅233→234. reconcile 19/19·330.

## AC
G-1 초기 collapsed·expand→자식 출현·자식 indent>root·leaf 토글 없음(chromium). node 0(렌더 팩토리=브라우저, 정직).

## constraints
- **MIT**(grid-core). 외부 dep 0. **LESS-006**: indent/toggle 렌더=브라우저→chromium 발산. node 0.
- 기존 Grid expand 경로 무수정(독립 팩토리). 소비자 opt-in(컬럼 prepend).

## 의존
grid-core 내부(신규 column/createAutoGroupColumn.tsx + index). story=Grid(tree). 외부 0.

## 분류 (MASTER §2)
컬럼 팩토리 렌더=**배선형**(chromium). 순수 0.

## reuse-gate 결과 / 추측 0
재사용=createCheckboxColumn 팩토리 패턴·TanStack expand API. 신규=auto group 팩토리. 추측 0: AG autoGroupColumnDef=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(auto group column) **9/10** · [x] In/Out(agg/getDataPath Out) **10/10** · [x] AC(collapsed·expand·indent·leaf chromium) **10/10**
- [x] reuse-gate(팩토리 패턴·TanStack 재사용·MIT) **10/10** · [x] constraints(opt-in·LESS-006 node 0) **10/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(배선형) **9/10** · **합계 77/80 통과.**

---

## G-1 결과 (완료 — 2026-06-07) → MOD-57 = {G-1} 완주, §3 이관
**구현**(grid-core, 기존 Grid expand 무수정): `createAutoGroupColumn<TData>({header,getValue,indentUnit,size})→ColumnDef`(cell=row.depth 들여쓰기 + getCanExpand chevron(toggleExpanded) + getValue) + index export.
**검증**: typecheck 0·build green·**chromium 1/1**(`grid-auto-group-column.spec.ts`) + **전체 회귀 102/102**(101+1; ★full-suite 7 transient flake=서버/부하 hiccup, 28/28 재실행 green=내 변경 무관). node 신규 0(렌더 팩토리=브라우저, 정직).
- ★초기 collapsed(자식 부재)→root expand 토글→자식 출현(deeper indent)·leaf 토글 없음(getCanExpand false).

## ★ closure + 발견 (advisor)
- **Auto group column = ✅**: 단일 컬럼 indent+toggle+value 팩토리. **Master/Detail & Tree 8/6/2→9/6/1**. COMMERCIAL-GAP **❌24→23·✅233→234·🟡70**(reconcile 19/19·330·0 mismatch). Enterprise ❌16→15.
- **★MOD-48 getDataPath 렌더 절반**: getDataPath(데이터모델, MOD-48 🟡)는 소비자 getSubRows 배선 유지(🟡 그대로), 본 모듈은 auto group column **렌더**를 제공. 별개 행(line 250/723 "auto group col w/ chevron"=grid-pro-agg GroupRow)은 🟡 유지(다른 패키지).
- node 0(렌더 팩토리=브라우저, fabricate 금지=createCheckboxColumn/MOD-49 G-1 동형).
- pre-existing 타이밍 flake가 full-suite 부하서 7개까지 분산 발생(재실행 green) — 누적 관찰, 후속 harden 고려.

## 모듈 완주 요약
1-Goal: Enterprise backlog 5번째(advisor Tier 2 verify-first). createAutoGroupColumn 팩토리(createCheckboxColumn 패턴, TanStack expand API). node 0(브라우저)·chromium 발산(collapsed→expand+indent). 기존 Grid expand 무수정(102/102). 신규 lesson 없음.
