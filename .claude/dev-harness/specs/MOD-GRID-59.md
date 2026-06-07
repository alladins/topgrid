# MOD-GRID-59 — 필터 도구 패널 (filters tool panel)

dev-harness 42번째 (**Enterprise ❌ backlog — Tier 3**, advisor). grid-pro-panel(**Pro**).
갭분석 **Misc UX ❌ = Filters tool panel**. 경쟁: AG filters tool panel·Wijmo.

## verify-first + reuse-gate
- grep: grid-pro-panel=ToolPanel(컬럼)/StatusBar/RowGroupPanel/SideBar(MOD-58), **filters 패널 0**(genuine 부재). grid-pro-filter=MultiFilter/floating(개별 컬럼).
- 재사용: ToolPanel callback-only 철학(상태 미보유, 소비자 적용)·SideBar(MOD-58)에 host 가능·license watermark(PAT-003). 신규=통합 필터 패널 surface.

## Goals
- **G-1 FiltersToolPanel (chromium 발산) — 배선형**:
  - `FiltersToolPanel({columns:{id,label,value}[], onFilterChange(id,value), onClearAll?, emptyText?, className?})`. 모든 컬럼 필터를 **한 패널**에 나열(컬럼당 입력+활성 표시), 활성 필터 수 집계, clear-all. 소비자가 onFilterChange 를 grid 필터 상태에 적용. index export.
  - **검증 ★발산(advisor, "입력 보임"=vacuous 금지)**: ① 초기 활성 카운트 0 ② 컬럼 A 입력→onFilterChange→값 반영+A 활성 표시+카운트 1 ③ 컬럼 B 입력→카운트 2(통합 surface=다중 컬럼 동시) ④ clear-all→전부 비고 카운트 0 ⑤ SideBar host 가능(MOD-58 합성).

## In / Out
- **In**: `FiltersToolPanel` 컴포넌트 + index export + 스토리(상태 wrapper, SideBar host). 기존 패널/필터 무수정.
- **Out**: 필터 타입별 위젯(드롭다운/날짜 등=소비자 content) · advanced filter 쿼리빌더(별개 ❌) · 자동 grid 필터 배선(callback-only).

## ★ ❌ 닫힘 마커
- **Filters tool panel = ✅**: 통합 컬럼 필터 패널(편집+활성집계). COMMERCIAL-GAP **Misc UX** 1 ❌→✅ → ❌22→21·✅235→236. reconcile 19/19·330.

## AC
G-1 활성 카운트 0→입력→반영+카운트·다중 컬럼·clear-all·SideBar host(chromium). node 0(UI=브라우저, 정직).

## constraints
- **Pro**(grid-pro-panel, 게이트 상속). 외부 dep 0. **LESS-006**: 패널 UI=브라우저→chromium 발산. node 0.
- callback-only(상태 미보유)=ToolPanel 철학. 기존 패널/필터 무수정.

## 의존
grid-pro-panel 내부(신규 FiltersToolPanel.tsx + index). story=상태 wrapper + SideBar host. 외부 0.

## 분류 (MASTER §2)
필터 패널 렌더=**배선형**(chromium). 순수 0.

## reuse-gate 결과 / 추측 0
재사용=ToolPanel callback-only·SideBar host·license watermark. 신규=필터 패널 surface. 추측 0: AG filters tool panel(컬럼별 필터 통합 패널)=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(filters tool panel) **9/10** · [x] In/Out(쿼리빌더/위젯 Out) **10/10** · [x] AC(카운트·다중·clear·SideBar host chromium) **10/10**
- [x] reuse-gate(ToolPanel 철학·SideBar host·Pro) **10/10** · [x] constraints(callback-only·LESS-006 node 0) **10/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(배선형) **9/10** · **합계 77/80 통과.**

---

## G-1 결과 (완료 — 2026-06-07) → MOD-59 = {G-1} 완주, §3 이관
**구현**(grid-pro-panel, 기존 패널/필터 무수정): `FiltersToolPanel({columns,onFilterChange,onClearAll?,emptyText?})` 통합 컬럼 필터 surface(활성 카운트 집계, callback-only, watermark) + index export. SideBar(MOD-58) host.
**검증**: typecheck 0·build green·**chromium 1/1**(`panel-filters.spec.ts`) + **full-suite 104/104 green**(retries; 96 passed+8 flaky+0 failed). node 신규 0(패널 UI=브라우저, 정직).
- ★컬럼 입력→값 반영+활성 표시+카운트 1·둘째 컬럼→카운트 2(다중 동시)·clear-all→카운트 0·SideBar 합성(host).

## ★ closure + 발견 (advisor)
- **Filters tool panel = ✅**: 통합 컬럼 필터 패널(편집+활성집계). **Misc UX 6/4/4→7/4/3**. COMMERCIAL-GAP **❌22→21·✅235→236·🟡70**(reconcile 19/19·330·0 mismatch). Enterprise ❌14→13.
- **★ToolPanel 철학 재사용 + SideBar host**: callback-only(grid 상태 미보유), SideBar(MOD-58)에 content 로 주입=합성. node 0(UI=브라우저).

## 모듈 완주 요약
1-Goal: Enterprise backlog 7번째(advisor Tier 3). FiltersToolPanel(ToolPanel callback-only 철학, SideBar host). node 0(브라우저)·chromium 발산(입력→카운트·clear). 기존 패널 무수정(104/104). 신규 lesson 없음.
