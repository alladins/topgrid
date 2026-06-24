# MOD-GRID-58 — 사이드바 (side bar — unified tool-panel container/accordion)

dev-harness 41번째 (**Enterprise ❌ backlog — Tier 3**, advisor). grid-pro-panel(**Pro**).
갭분석 **Misc UX ❌ = Side bar (unified tool-panel container/accordion)**. 경쟁: AG `sideBar`·xxxx.

## verify-first + reuse-gate
- grep: grid-pro-panel=ToolPanel/StatusBar/RowGroupPanel(개별), **통합 컨테이너 0**(genuine 부재).
- 재사용: ToolPanel callback-only 철학(상태 미보유, content 주입)·useLicenseStatus/Watermark(PAT-003). 신규=아코디언 컨테이너 SideBar.

## Goals
- **G-1 SideBar 아코디언 컨테이너 (chromium 발산) — 배선형**:
  - `SideBar({panels:{id,title,content}[], defaultOpenId?, className?})`. 한 번에 하나 펼침(헤더 클릭=토글, 열린 헤더 재클릭=접기). content=소비자 주입(ToolPanel/필터 패널 등). index export.
  - **검증 ★발산(advisor, "패널 보임"=vacuous 금지)**: ① 초기 첫(또는 defaultOpen) 패널 content 만 DOM, 타 패널 content 부재 ② 다른 헤더 클릭→그 content 출현+이전 content 사라짐(아코디언 배타) ③ 열린 헤더 재클릭→content 접힘 ④ aria-expanded 토글.

## In / Out
- **In**: `SideBar` 컴포넌트(아코디언) + index export + 스토리(ToolPanel 등 주입). 기존 ToolPanel/StatusBar/RowGroupPanel 무수정.
- **Out**: 다중 동시 펼침 모드(후속) · 탭(좌측 아이콘) 변형(AG sideBar position) · 패널 리사이즈.

## ★ ❌ 닫힘 마커
- **Side bar = ✅**: 통합 도구패널 아코디언 컨테이너. COMMERCIAL-GAP **Misc UX** 1 ❌→✅ → ❌23→22·✅234→235. reconcile 19/19·330.

## AC
G-1 초기 1 패널 content·헤더 클릭→배타 전환·재클릭 접기·aria-expanded(chromium). node 0(UI 컨테이너=브라우저, 정직).

## constraints
- **Pro**(grid-pro-panel, 게이트 상속). 외부 dep 0. **LESS-006**: 아코디언=브라우저 행동→chromium 발산. node 0.
- callback-only(상태 미보유, content 주입)=ToolPanel 철학. 기존 패널 무수정.

## 의존
grid-pro-panel 내부(신규 SideBar.tsx + index). story=Panels(SideBar+ToolPanel 주입). 외부 0.

## 분류 (MASTER §2)
아코디언 컨테이너 렌더=**배선형**(chromium). 순수 0.

## reuse-gate 결과 / 추측 0
재사용=ToolPanel callback-only·license watermark. 신규=아코디언 컨테이너. 추측 0: AG sideBar(toolPanels 아코디언/탭)=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(side bar 아코디언) **9/10** · [x] In/Out(다중펼침/탭 Out) **10/10** · [x] AC(배타 전환·접기·aria chromium) **10/10**
- [x] reuse-gate(ToolPanel 철학·Pro) **10/10** · [x] constraints(callback-only·LESS-006 node 0) **10/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(배선형) **9/10** · **합계 77/80 통과.**

---

## G-1 결과 (완료 — 2026-06-07) → MOD-58 = {G-1} 완주, §3 이관
**구현**(grid-pro-panel, 기존 패널 무수정): `SideBar({panels:{id,title,content}[], defaultOpenId?, className?})` 아코디언 컨테이너(배타 펼침, content 소비자 주입=ToolPanel callback-only 철학, useLicenseStatus/Watermark) + index export.
**검증**: typecheck 0·build green·**chromium 1/1**(`panel-sidebar.spec.ts`) + **full-suite 103/103 green**(playwright `retries:2` 추가 후: 96 passed + **7 flaky**(부하 타이밍, retry 흡수) + **0 failed**). node 신규 0(아코디언 UI=브라우저, 정직).
- ★초기 1 패널 content 만 DOM·다른 헤더 클릭→배타 전환(이전 content 제거)·열린 헤더 재클릭→접기·aria-expanded.
- **★인프라 부채 해소(MOD-58 동반)**: 스위트 100+ 로 커지며 scroll/click/animation 타이밍 테스트가 머신 부하 시 간헐 timeout(19→10 failed, 무관 기능 전반·격리 통과 모듈 포함=환경적). **타겟 재실행 24/24 green** 으로 코드 무관 확인 후 `apps/docs/playwright.config.ts` 에 `retries:2` 추가 → full-suite green 안정화(clean 테스트 1회 통과, flake 만 재시도). advisor 사전 경고 반영.

## ★ closure + 발견 (advisor)
- **Side bar = ✅**: 통합 도구패널 아코디언. **Misc UX 5/4/5→6/4/4**. COMMERCIAL-GAP **❌23→22·✅234→235·🟡70**(reconcile 19/19·330·0 mismatch). Enterprise ❌15→14.
- **★callback-only(ToolPanel 철학)**: SideBar 는 그리드 상태 미보유, content 소비자 주입. node 0(아코디언=브라우저).
- 동반 ⛔: post-sort callback defer(hot-path 수술, settled defer 6).

## 모듈 완주 요약
1-Goal: Enterprise backlog 6번째(advisor Tier 3). SideBar 아코디언(ToolPanel callback-only 철학 재사용). node 0(브라우저)·chromium 발산(배타 펼침). 기존 패널 무수정(103/103). 신규 lesson 없음.
