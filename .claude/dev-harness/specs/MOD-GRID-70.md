# MOD-GRID-70 — 고정 그룹 헤더 (sticky group rows)

dev-harness 52번째 (**Enterprise ❌ backlog — render tail 1**, advisor). grid-pro-agg(Pro).
갭분석 **Pinned/floating ❌ = Sticky group rows(group header sticks while its children scroll)** + **Row grouping ❌ = Sticky/pinned group headers while scrolling**(evidence=가상화가 off-window 헤더 drop). 경쟁: AG groupRowsSticky.

> ★ gate-B 메모: spec 파일을 구현과 병행 작성(절차상 선작성 누락 정직 기록). 설계는 reuse-gate read(GroupRow/AggregationGrid)로 사전 확정.

## verify-first + reuse-gate
- grep: GroupRow `<tr>` 에 position/sticky 0. AggregationGrid 비-virt 경로=`overflow-x-auto` 만(세로 bound 없음→스크롤 없음). genuine 부재.
- 재사용: GroupRow td 인라인 style·MOD-24 floating rows 인라인 sticky 선례·P27-1(Tailwind 클래스 inert→인라인 load-bearing).
- **build-vs-defer(read)**: additive opt-in(GroupRow sticky? + AggregationGrid enableStickyGroupRows + bounded 래퍼), 기존 경로 OFF byte-identical, **비-virt 모델** → build. 가상화 sticky(off-window drop, EC-004)=별개=Out→🟡(295 행).

## Goals
- **G-1 sticky 배선 (배선형, chromium ★비공허)**:
  - GroupRow `sticky?` → 그룹 `<td>` 들에 인라인 `position:sticky;top:0;zIndex;background`(★border-collapse 가 `<tr>` sticky 차단→td 적용). aggSpec/colSpan 양 경로.
  - AggregationGrid `enableStickyGroupRows?`/`stickyGroupMaxHeight?`(default 240) → 비-virt 경로에 인라인 bounded 스크롤 div(overflow:auto+maxHeight) 래퍼 + GroupRow 에 sticky 전달. OFF=무 래퍼·무 sticky(byte-identical).
  - **★비공허(advisor)**: bounded 컨테이너 200px 실제 스크롤(scrollTop>0) 후 그룹 헤더 computed top 이 여전히 컨테이너 top ≈ 고정(sticky engaged; 비-sticky 면 200px 밀려 off-top). "헤더 렌더됨"=vacuous 금지.

## In / Out
- **In**: GroupRow sticky? + AggregationGrid enableStickyGroupRows/stickyGroupMaxHeight + bounded 래퍼 + data-group-label(colSpan path) + 스토리 + chromium.
- **Out(명시 — silent gap 금지)**:
  - **가상화 sticky**: 가상화는 off-window 그룹 헤더 drop(EC-004) → virt+sticky=별 ❌ 행(295)=🟡(비-virt 전달, virt 미해결).
  - 다중레벨 그룹 stacking offset(중첩 헤더 누적 top) · thead sticky = vN(v1=top:0 단일).

## ★ ❌ 닫힘 마커
- **Sticky group rows(group header sticks while children scroll) = ✅**(비-virt). **Sticky/pinned group headers while scrolling = 🟡**(비-virt ✅·virt drop 잔존). COMMERCIAL-GAP ❌11→9·✅245→246·🟡71→72. reconcile 19/19·330.

## AC
G-1 ★헤더 고정(chromium: 200px 스크롤 후 computed top ≈ 컨테이너 top, scrollTop>0) + OFF byte-identical(기존 agg 회귀).

## constraints
- grid-pro-agg(Pro). 외부 dep 0. **LESS-006**: sticky 동작=chromium 발산. **P27-1**: 인라인 sticky/overflow/height(Tailwind inert). **border-collapse**: sticky=td(not tr).
- 기존 GroupRow/colSpan/agg 경로·비-virt 동작 무수정(OFF byte-identical, 기존 agg chromium 회귀 green).

## 의존
grid-pro-agg 내부(GroupRow + AggregationGrid + types). story=AggregationGrid(enableStickyGroupRows). 외부 0.

## 분류 (MASTER §2)
sticky 배선=**배선형**(chromium computed-position 발산). 순수 substance 0(정직, 레이아웃=브라우저).

## reuse-gate 결과 / 추측 0
재사용=GroupRow td 인라인 style·MOD-24 인라인 sticky·P27-1. 신규=sticky? prop + bounded 래퍼. 추측 0: AG groupRowsSticky(td position:sticky)=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(sticky 배선 비공허) **9/10** · [x] In/Out(virt/stacking/thead Out) **10/10** · [x] AC(computed-position 고정·OFF byte-identical) **10/10**
- [x] reuse-gate(td 인라인·MOD-24·P27-1·border-collapse=td) **10/10** · [x] constraints(P27-1 인라인·OFF byte-identical) **10/10** · [x] 의존(내부, 외부 0) **9/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(배선형, 순수 0 정직) **9/10** · **합계 76/80 통과.**

---

## G-1 결과 (완료 — 2026-06-08) → MOD-70 = ✅(502)+🟡(295), §3 이관
**구현**(grid-pro-agg, 기존 경로 OFF byte-identical): GroupRow `sticky?`→그룹 td 인라인 `position:sticky;top:0;zIndex:5;background`(border-collapse→tr 불가, td 적용; aggSpec/colSpan 양 경로 + data-group-label) + AggregationGrid `enableStickyGroupRows?`/`stickyGroupMaxHeight?`(=240)→비-virt 인라인 bounded 스크롤 래퍼.
**검증**: typecheck 0·build green·**chromium 1/1**(sticky-group-rows.spec.ts ★영업팀 헤더 컨테이너 top 시작→200px 스크롤[scrollTop>0]→헤더 top 여전히 컨테이너 top ≈ 고정) + **full-suite 116/116 green**(기존 agg 회귀=OFF byte-identical).
**closure(advisor)**: Sticky group rows(children scroll)=✅(비-virt). Sticky/pinned group headers while scrolling=🟡(비-virt 전달·virt off-window drop 잔존, EC-004). ❌11→9·✅245→246·🟡71→72(reconcile 19/19·330). Out: 가상화 sticky·stacking offset·thead sticky=vN. 신규 lesson 없음(P27-1 인라인 재적용).
