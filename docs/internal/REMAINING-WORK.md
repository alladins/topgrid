# TWGRID — 진행해야 할 작업 통합 리스트 (백로그)

> 2026-06-06 정리. 이번 세션(워크플로우 무결성 감사·시정)까지 반영한 **남은 작업 단일 SSoT**.
> 출처: `release_queue`(state.json) · `WORKFLOW-INTEGRITY-AUDIT.md`(B/C/D) · COMMERCIAL-GAP vN · 메모리.
> 우선순위 = P0(즉시) → P4(연기 확정). "발행"과 "검증 부채"는 분리한다.

---

## ★★ 다음 세션 진입 가이드 (HANDOFF — 2026-06-07 기준) ★★

> **현 상태**: vN node-pure 9(MOD-40~48) + Track 1 MOD-49 + **Track 2 제품결정 1번째 MOD-50 완료(2026-06-07)**, 전부 로컬 `main` 커밋(reconcile 19/19·330).
> COMMERCIAL-GAP **❌47→30**(✅227/🟡70/❌30). working tree clean. origin 미푸시·npm 미발행(둘 다 사용자 결정).
> **★Track 2 착수(사용자 advisor 위임)**: 제품 결정 4종 STOP-and-ask → advisor 판단 위임(설계·우선순위), 끝까지 진행. publish/push 만 사용자 게이트 유지.
> **MOD-49**(Track1-1): pagination 3 ❌→✅. **MOD-50**(Track2-1): full-row editing ❌→✅(useFullRowEdit, chromium 회귀 **84/84**).
> **advisor 제품결정 순서**: full-row editing✅ → custom cell editor slot(다음) → column spanning(bound-or-defer) → **RTL=의도적 연기**(invasive·한국우선 저가치).

### ▶ 새 세션 즉시 시작 (2026-06-07 갱신)

> **다음 액션 = MOD-51 custom cell editor slot**(Track 2, 설계 확정). 그 다음 column spanning(bound-or-defer) → Enterprise ❌20 backlog
> (advisor triage). **작동 방식**(사용자 지시): 설계·우선순위 **advisor 위임**, commit-per-module, 끝까지 진행. **publish(npm)·origin push 만 사용자 게이트.**
> 먼저 읽을 것: 본 HANDOFF + 메모리 `dev-harness-loop-progress`(재개 지점) + `state.json`(MOD-49/50 + split_remainder) + COMMERCIAL-GAP(갭 현황 ❌30).

> **MOD-51 설계(advisor 확정)**: `EditableCell.renderEditor?(ctx:{value,onChange,commit,cancel,focusRef})=>ReactNode` **render-prop lifecycle slot**
> (registry 아님). grid-renderers(MIT). 비공허 검증 = **lifecycle 발산**: slot editor 가 Enter→commit·Esc→cancel·진입 autofocus 를 받음
> (raw `cell` editor 는 무료로 못 받음). 통과 시 ✅, convenience 뿐이면 🟡 정직 기록(over-claim 금지).

> **★chromium 하네스 재가동(매 세션 선행, ss-srv.mjs=gitignore 미커밋)**:
> 1. `node -v`(≥22.6) · chromium 설치 확인. 2. `apps/docs/ss-srv.mjs` 복원: `git show 6d8355d^:apps/docs/ss-srv.mjs` 내용을 Write.
> 3. `pnpm -r --workspace-concurrency=1 build` (직렬, peerDep DTS 안전) → `pnpm -F docs build-storybook`.
> 4. `node apps/docs/ss-srv.mjs &` → **sleep 3 + `curl -s -o /dev/null -w "%{http_code}" :6006/index.json`**(200 확인; sleep 2=flake).
> 5. 베이스라인 재확인: `cd apps/docs && pnpm exec playwright test --config=playwright.config.ts --grep-invert "visual regression:"` → **84/84 green**.
> 6. 모듈마다 story 추가 후 `build-storybook` 재실행(서버는 파일 fresh-read=재시작 불필요), per-feature spec 실행.

> **루프 규약**(누적): 진입 게이트 B(spec 파일 + MASTER §6.2 스케치) + C(rubric 점수) · node-spine(순수) + chromium 발산(LESS-006, "보임"식 금지) ·
> commit-per-module · COMMERCIAL-GAP **프로그래매틱 reconcile**(per-category 상세표 = ground truth, 19/19·330, summary mismatch 0 검산) ·
> §6.2→§3 이관 · state.json + 메모리 갱신. ★정직성(audit 핵심): 과장된 ❌(부분 기존 충족)은 위장 flip 금지 · 미검증 가드는 "unverified" 로 기록(AP-004).

### 🟦 트랙 1 — browser 클러스터 (UI/렌더/wiring; 다수 🟡→✅ 승격 + ❌ 닫기)
> **선행**: chromium/storybook 하네스 세팅. 절차 = 메모리 `dev-harness-loop-progress` 「핵심 규약」 섹션(storybook-static :6006 via ss-srv.mjs
> 미커밋→매번 Write 재생성 + playwright `--config=playwright.config.ts` + 서버 health sleep3+curl). **★검증 무결성(audit 핵심)**: chromium 단언은
> **non-vacuous**(동적 행동·발산 — "보임"식 금지) + state.json/§3 에 **author-written behavioral** 명시(독립검증 오독 금지). LESS-006 준수.
> **권장**: 패키지별로 묶어 모듈화. 각 모듈도 진입 게이트(spec+§6+rubric)·commit-per-module·reconcile 유지.

- **grid-core (community 7 + tree)**: ✅**MOD-49 닫힘**=auto-page-size·pageNumberFormat·go-to-page(pagination 3 ❌→✅). 잔여=postSortRows·
  scroll-debounce(Grid/sort 수술) · row-animation(MOD-36 diff 코어→CSS) · drag-between-grids · virtualizationThreshold · **auto group column**(설정형 group-col 렌더, getDataPath 🟡→✅).
  ★advisor: debounced-scroll·row-animation=vacuity-trap(발산 단언 확정 후)·auto-virt-threshold=design 번복(별도 advisor).
- **grid-pro-pivot**: pivot panel(DnD) · server-side pivot(grid-pro-serverside 연동) · collapsible column groups(★computePivot 컬럼-그룹 집계
  +render+chromium — avg-of-avgs 안전 source 재집계) · column grand-total 토글(buildPivotColumns).
- **grid-pro-agg/master**: grand-total footer 렌더(AggregationGrid pinned, computeAggregateRow 🟡→✅) · auto-agg floating wiring(🟡→✅) ·
  group-header inline agg · sticky group headers/rows · master-detail+virtualization(virtualizer wiring) · row-group/pivot state-save.
- **grid-pro-filter**: advanced filter 쿼리빌더 UI(조건 추가/삭제/중첩·드롭다운·식↔UI, MOD-46 🟡→✅) · 차트 클릭→grid setFilter wiring +
  linked highlight(MOD-47 cross-filter 🟡→✅) · chart panel/composition(dock·settings, MOD-47 ❌).
- **MOD-49 (browser/format-lib)**: go-to-page 입력(pagination, 소형) · .xlsx sheet **import**(xlsx 라이브러리) · Excel cell styles(서식 렌더).
- **viewport row model**(서버 스트리밍 프로토콜) = node substance 0, browser/server 트랙.

### 🟨 트랙 2 — 제품 결정 4종 (★2026-06-07 사용자 advisor 위임 → STOP-and-ask 해제, advisor triage)
> 사용자 지시: 설계·우선순위 advisor 위임, 끝까지 진행(publish/push 만 사용자 게이트). advisor triage 결과:
- **Full-row editing** → ✅ **완료(MOD-50)**. useFullRowEdit + applyRowDraft, chromium 회귀 84/84.
- **Custom cell editor slot** → 🔜 **build 예정(MOD-51)**. advisor: 소비자가 이미 `cell` 로 임의 editor 렌더 가능(broad capability 존재) →
  비공허 증분 = **EditableCell `renderEditor` lifecycle slot**(Enter-commit·Esc-cancel·autofocus = raw cell 은 무료로 못 받음). render-prop
  slot(registry 아님 — per-column·lifecycle-bound, AG 의 string-config 직렬화 needs 없음). 이게 통과해야 ✅, 아니면 🟡(convenience).
- **Column spanning(body colSpan)** → 🔜 **bound-or-defer(MOD-52?)**. full-width 스팬 이미 4경로. arbitrary body colSpan=col-virt/핀/ARIA 얽힘.
  advisor: **bounded 버전(비-virt·비-pinned·문서화 한계)이 비공허 단언 있으면 build, "전부 지원"만 정직 스코프면 defer**. → bounded build 후보.
- **RTL 레이아웃** → ⛔ **의도적 연기(advisor 결정, silent gap 아님)**. invasive(`computePinnedOffset` 등 전 LTR 전제), 한국시장 우선순위 낮음
  → 자율 build = 큰 invasive 변경 대비 거의 0 가치. **결정으로 기록**(❌ 유지, 차기 우선순위 재평가 시 재고).

### 빠른 시작 예시 (현 상태 = MOD-50 까지 완료)
> 기본(이어서): "계속" / "MOD-51 부터" → 하네스 재가동(위 6단계) → MOD-51 custom editor slot spec-gate(advisor) → build.
> 트랙 1 전환: "browser 클러스터 — pivot panel 부터" → 동일 하네스 + grid-pro-pivot split_remainder.
> 결정만: "column spanning 어떻게 할지" / "RTL 다시 볼지" → advisor triage 재확인.

---

## ★ vN 진행 (2026-06-06~ 착수) — ❌47 닫기 자율 라운드 (resumable ledger)

> 사용자 지시: MOD-40 부터 ❌47 을 모듈로 쭉 닫는다. 크리티컬(제품 결정·발행/push 등 outward) 외 비-크리티컬은
> advisor 판단 위임. 진입 게이트(B: spec+§6 등재 / C: rubric 점수) 준수. 각 모듈 commit-per-module(durable·resumable).
> **계획 순서**(advisor 승인, node-검증 우선 front-load): 40→41→42(sheet)→43(community)→44(pivot)→45(enterprise)
> →46(filter)→47(chart)→48(tree/MD)→49(UX/import) → **50+ 제품결정 4종=사용자 STOP-and-ask**.

- [x] ✅ **MOD-40 — 스프레드시트 참조 모델**(grid-pro-sheet, 2-Goal, 2026-06-06): $A$1 절대/혼합 참조(G-1, `$`=eval-cosmetic→
  evaluate/extractRefs 무수정) + `translateFormula` copy/fill 조정(G-2, precedence-aware serializer, #REF! 라운드트립).
  **node 87/0**(characterization 66 보존 + 21)·typecheck 0·build green. spec rubric 77/80. §3 `mod-grid-40` 이관.
  신규 [[LESS-007]]. **COMMERCIAL-GAP: ❌47→45·✅218→219·🟡62→63**(reconcile 19/19·합 330). closure: `$A$1`=✅·copy/fill=🟡(UI=MOD-49).
- [x] ✅ **MOD-41 — 멀티시트 + 명명 범위**(grid-pro-sheet, 2-Goal, 2026-06-07): 멀티시트 `Sheet2!A1`(G-1, **qualified-keys-single-
  graph** — 시트=키 네임스페이스, 교차시트 의존 단일그래프 무료) + 명명 범위 `defineName`(G-2, compile inline + 재정의 recompile-all).
  **node 108/0**(MOD-40 round 87 보존 + 21)·typecheck 0·build green. spec rubric 77/80. §3 `mod-grid-41` 이관. ★첫 cross-module 회귀
  (MOD-40 translate=sheet/name 노드). 신규 [[LESS-008]]+[[PAT-007]](N=2 with MOD-40). **COMMERCIAL-GAP: ❌45→43·✅219→220·🟡63→64**
  (reconcile 19/19·합 330·Spreadsheet 14/6/3). closure: 명명=✅·멀티시트=🟡(탭 UI=MOD-49). 기타 3→1(go-to-page 만).
- [x] ✅ **MOD-42 — 함수 라이브러리**(grid-pro-sheet, 2-Goal, 2026-06-07): VLOOKUP(G-1, range-aware evaluate 특수=세 번째 디스패치
  형, exact+approx default-approx, #N/A, colIndex #REF! 양방향) + 날짜 DATE/YEAR/MONTH/DAY(serial)·재무 PMT/FV/PV(G-2, rate=0 특수).
  **node 128/0**(108 보존 + 20)·typecheck 0·build green. §3 `mod-grid-42` 이관. MOD-41 명명범위·MOD-40 translate 무료 회귀.
  **★0 ❌ flip**(단일 🟡 「광범위 함수」 행 심화 — ~25 vs 400+ 유지, advisor 확정). reconcile **불변 ❌43/✅220/🟡64**. 신규 lesson 없음.
- [x] ✅ **MOD-43 — 증분 행 트랜잭션**(grid-core MIT, 2-Goal, 2026-06-07): `applyRowTransaction`(G-1, 순수 delta remove→update→add) +
  `createTransactionBatcher`(G-2, scheduler 주입 PAT-005, 다중 enqueue→flush 1회). **node 16/0**(전 스위트 63)·typecheck 0·build green.
  ★controlled-data→순수 helper(Grid.tsx 수술 0, moveRow 동형). §3 `mod-grid-43` 이관. **Community 9 첫 분할**(advisor spec-gate).
  **COMMERCIAL-GAP: ❌43→41·✅220→222·🟡64**(Row models/data 2 ❌→✅, reconcile 14/3/1·Community tier 15→13). 신규 lesson 없음.
- [ ] **MOD-43 분할 잔여 7**(Community 빠른승부): postSortRows·scroll-debounce(node, Grid/sort 수술) · auto-page-size·row-animation·
  drag-between-grids(**browser module**=첫 chromium vN) · virtualizationThreshold·pageNumberFormat(component 수술). → 후속 모듈로 진행.
- [x] ✅ **MOD-44 — pivot 결과 변환**(grid-pro-pivot Pro, 2-Goal, 2026-06-07): `customizePivotTotals`(G-1, suppress/position totals) +
  `filterPivotRows`(G-2, result filter, totals-over-all). **node 15**(suite 50)·typecheck 0·build green. ★MOD-31 동형 순수 변환(computePivot
  무수정). §3 `mod-grid-44` 이관. **pivot 5 중 node-pure 2 분할**(advisor). closure: total cust=✅·result filter=🟡(column-filter UI=browser).
  **COMMERCIAL-GAP: ❌41→39·✅222→223·🟡64→65**(Pivoting 18/2/3, Enterprise 27→25). 신규 lesson 없음.
- [ ] **MOD-44 분할 잔여 3**(pivot): collapsible column groups(computePivot 컬럼-그룹 집계+buildPivotColumns+chromium=3-part) · pivot
  panel(DnD) · server-side pivot(grid-pro-serverside wiring) + column grand-total 토글(buildPivotColumns). → **browser 클러스터**로 진행.
- [x] ✅ **MOD-45 — 전역 집계 행**(grid-pro-agg Pro, 1-Goal, 2026-06-07): `computeAggregateRow(data,spec)`(G-1, source 직접 집계,
  avg-of-avgs 안전, 로컬 number[] 리듀서 ADR-001). **node 15/0**(첫 grid-pro-agg node 테스트, ★avg-of-avgs 회피 hard 단언)·typecheck 0·build green.
  §3 `mod-grid-45` 이관. Enterprise grouping=렌더-정의 클러스터→node-pure substance 1 추출(advisor). closure: grand-total footer=🟡·auto-agg
  floating=🟡(렌더/auto=browser). **COMMERCIAL-GAP: ❌39→37·✅223·🟡65→67**(Row grouping 19|11|6|2·Pinned/floating 15|11|3|1·Enterprise 25→23). 신규 lesson 없음.
- [ ] **MOD-45 분할 잔여**(enterprise grouping): grand-total footer 렌더(AggregationGrid pinned)·auto-agg floating wiring·group-header
  inline agg·sticky group headers/rows·row-group/pivot state-save. → **browser 클러스터**(state-save=grid-core useGridState 결합 회피).
- [x] ✅ **MOD-46 — 고급 필터 식 모델+평가기**(grid-pro-filter Pro, 1-Goal, 2026-06-07): `AdvancedFilterExpr`(중첩 group{and/or}|
  condition{field,type,operator,value}) + `evaluateAdvancedFilter`(재귀, type-explicit cross-column) + `matchCondition`(순수 연산자) +
  `makeAdvancedFilterFn`. **node 25/0**(suite 38)·typecheck 0·build green. §3 `mod-grid-46` 이관. ★condition type 명시(cross-column 정확성)·
  blank inert(OR 붕괴 차단)·unknown op→false. closure: advanced filter=🟡(쿼리빌더 UI=browser). **COMMERCIAL-GAP: ❌37→36·✅223·🟡67→68**
  (Filtering 12/1/0·Enterprise 23→22). 신규 lesson 없음. ★select-all-pages/group-selection ❌ 행 존재 확인(Enterprise 분모 정확).
- [ ] **MOD-46 분할 잔여**: 쿼리빌더 UI(조건 추가/삭제/중첩 그룹·드롭다운·식↔UI 동기화) → browser 클러스터.
- [x] ✅ **MOD-47 — 차트 cross-filter 매핑**(grid-pro-filter Pro, 1-Goal, 2026-06-07): `selectionsToFilter(selections)→AdvancedFilterExpr`
  (선택→필터, 같은필드 OR·다른필드 AND, type=컬럼메타, MOD-46 식 재사용). **node 15/0**(suite 53)·typecheck 0·build green. §3 `mod-grid-47` 이관.
  ★dep 방향=helper in grid-pro-filter(차트 결합 회피). closure: cross-filter=🟡(클릭 wiring=browser)·**chart panel/composition=❌ 유지**(순수 UI,
  1행만 flip). **COMMERCIAL-GAP: ❌36→35·✅223·🟡68→69**(Integrated charts 10/4/1·Enterprise 22→21). 신규 lesson 없음.
- [ ] **MOD-47 분할 잔여**: 차트 클릭→grid setFilter wiring + linked highlight · chart panel/composition(dock·settings) → browser 클러스터.
- [x] ✅ **MOD-48 — flat-path 트리 빌더**(grid-core MIT, 1-Goal, 2026-06-07): `buildTreeFromPaths(data, getDataPath)→TreeNode[]`(synthetic-
  parent dedup·explicit-prefix data 부착·NUL-key, 소비자가 getSubRows 로 사용). **node 11/0**(suite 74)·typecheck 0·build green. §3 `mod-grid-48` 이관.
  closure: getDataPath=🟡(auto group column 렌더=browser). auto-group-col·master-detail+virt·viewport ❌ 유지(4행 1 flip). **COMMERCIAL-GAP: ❌35→34·
  ✅223·🟡69→70**(Master/Detail&Tree 8/6/2·Enterprise 21→20). 신규 lesson 없음.
- [ ] **★vN node-pure runway 종료(advisor)**: MOD-48 이 마지막 깨끗한 node-pure 추출. **MOD-49**(go-to-page·.xlsx import·Excel cell styles)
  =browser/format-lib(node substance 박약 — .xlsx 는 xlsx lib·Excel 서식은 렌더). **MOD-50+**=사용자 제품결정 게이트(STOP). → 남은 ❌34 의
  대부분이 browser 클러스터(분할 잔여 누적)거나 사용자 결정. 다음 단계는 사용자 확인 필요(MOD-49 억지 node-pure 화 금지).
  - **reuse-gate survey 완료**(Explore, 2026-06-07 — verify-first 규칙 적용):
    - **verify-first(부분 존재, 의미/스코프 확인 필요)**: ① post-sort callback = `onSortingChange`(types.ts:830) 존재하나 *state-only*(AG `postSortRows` 행배열 후처리 아님) ② custom page formatter = `totalCountFormat`(GridPagination.tsx:58) + `localeText.totalCount`(i18n.ts:24) 이미 노출 → 스코프 겹침 확인 ③ debounced-scroll = `useDebouncedCallback` 존재 + `virtualizerOptions.onChange` passthrough(types.ts:929) → 소비자 wrap 가능, "기본 auto-debounce" 면 부재.
    - **genuine 부재(신규)**: ④ applyTransaction(개별 onAdd/Delete/UpdateRow 만, 배치-patch API 없음 — GridHandle 신규 메서드) ⑤ async tx batching(macro 배치 큐 없음) ⑥ auto-page-size(뷰포트 측정 필요=browser) ⑦ row animation(rowClassName 만, lifecycle hook 없음=browser) ⑧ auto-virtualization-threshold(enableVirtualization opt-in, 의도적 미적용 types.ts:901 — `virtualizationThreshold?` 신규) ⑨ drag-between-grids(within-grid moveRow/enableRowReorder 만, cross-grid 컨텍스트 부재=browser).
    - **분해 권고**: 순수-로직(node) ④tx 수학·⑤배치큐·⑧threshold 체크 = node spine 우선. browser ⑥⑦⑨ = chromium 행동 게이트(non-vacuous). ①②③ = spec 단계서 verify-first grep 후 scope 확정(이미 충족이면 닫기, advisor). 9건 단일 모듈은 클 수 있음 → spec-gate advisor 가 분할/스코프 결정.
- [ ] **미발행 누적**: MOD-40~ 의 grid-pro-sheet 변경은 dist 빌드만, **npm 미발행**(발행=사용자 결정, batch).
- [ ] **미push 누적**: 로컬 main 커밋(MOD-40 포함) origin 미반영(push=사용자 결정).

---

## P0 — 발행 (✅ **완료 2026-06-06**)

- [x] ✅ **prepared batch 발행 완료**: 15패키지 npmjs publish 성공(grid-core@0.4.0·grid@0.5.0 facade·features@0.7.0·
  chart/sheet/pivot/panel/edit-plus/serverside/filter 등). P1-D verify(78/78 chromium) 통과 후 발행.
- [x] ✅ **시정 브랜치 main 병합 완료(2026-06-06)**: fast-forward `036d7bb..c644e47`(20파일). main 에 감사·specs·§6·검증·빌드fix 반영.
- [ ] ⚠ **origin/main push**: 병합 후 `git status` = "**ahead of origin/main by 85 commits**". 이번 작업 포함 **로컬 main 85커밋이
  원격 미반영**(GitHub `alladins/topgrid` [[docs-site-hosting]] 와 별개 코드 원격). `git push origin main` 여부=사용자 결정
  (백업·협업·CI 트리거 영향). 발행된 npm 패키지와는 무관(이미 publish 됨).
- [ ] **발행 전 점검 — TOMIS provenance scrub 확인**([[topgrid-tomis-provenance-leak]]): 발행물·소스에 TOMIS 내부 경로
  노출 여부. *최근 감사: 전 패키지 dist 금지어(TOMIS/@tomis)=0·@topgrid 단방향 clean*(§5.3) → **확인만**, blocker 가능성 낮음.
- [ ] ⚠ **빌드-health(2026-06-06 P1-D 중 발견)**: `pnpm -r build`(기본 병렬)가 **비결정적 실패** — `grid-pro-edit-plus`
  DTS 가 `@topgrid/grid-core`(edit-plus 의 **peerDep**, devDeps 부재)를 grid-core clean/rebuild 중 해소하려다 TS7016 실패.
  pnpm topo-order 가 peerDep 을 빌드 순서에 안 넣음. **workaround=`pnpm -r --workspace-concurrency=1 build`(직렬, 통과 확인)**.
  발행 자체엔 영향 적음(per-package publish 는 dist 존재 시 OK)이나 **clean 빌드/CI 가 병렬이면 깨짐**. 정식 fix=P3.

## P1 — 검증 부채 (★이번 세션이 드러낸 **최대 잔여 리스크**)

> "테스트 통과 ≠ 목표 로직". 독립 검증이 **순수 코어(node)만** 닿았고 wiring/browser 층은 비었다(WORKFLOW-INTEGRITY-AUDIT §7.4).

- [x] ✅ **(D) browser/wiring verify 실집행 (2026-06-06 완료)**: storybook 빌드→playwright 실행 → **functional chromium
  78/78 PASS**(MOD-28~39 전 행동 게이트) = state.json "chromium N/N" 주장 **real·green 확정**. MOD-38/39 비-vacuity 확인.
  인프라 시정: `storybook.spec.ts`(toHaveScreenshot 마이그레이션+CWD 경로+non-throwing+skip-with-reason) + `apps/docs/
  playwright.config.ts` 신설 → `visual:test` 정상(78 pass/291 skip). 상세=WORKFLOW-INTEGRITY-AUDIT §7.5.
  - [ ] **잔여**: 스크린샷 회귀 baseline 생성·커밋(CI `--update-snapshots`, OS/폰트별 — dev 머신서 생성 금지).
- [x] ✅ **독립 검증 확장 (2026-06-06, 순수 코어 5종 clean)**: §7.2 의 3종(MOD-34/36/37 25/25)에 **sheet 엔진(MOD-26/32
  25/25)·computePivot(MOD-18 13/13, ★AVG avg-of-avgs 함정 회피)** 추가 — 전부 요구사항-도출, **갭 0**. 감사자 self-correction ×2
  (NUL 교훈). 상세=WORKFLOW-INTEGRITY-AUDIT §7.6.
  - [ ] **의도적 미수행(잔여 명시)**: wiring/browser 층 독립 검증 = 새 browser 테스트 = 기존 78/78 스펙의 재구현(중복)이라 가치
    없음(advisor). 그 층은 author-written 78/78(MOD-38/39 비-vacuity 확인)로 커버. **closing=스위트 재작성, not worth it.**

## P2 — 프로세스 게이트 복원 (재발 방지) — **문서-only, machinery 미구축**(advisor 판단)

> ★ 루프가 다시 돌 때만 가치. 지금 게이트 machinery 를 짓는 것은 process theater(감사 결론: rubric 은 "정의됐으나
> 한 번도 점수 미영속화"). 따라서 **README 한 줄 노트로 충분**, 코드/도구 미구축. 차기 모듈 시작 시 적용.

- [x] ✅ **(B)(C) 진입 게이트 복원(2026-06-06)**: `.claude/dev-harness/README.md` 「완료 게이트」에 **진입 게이트** 추가 —
  (B) specify 산출물(specs 파일 + §6.1 행 + §6.2 스케치) implement 전 필수·인라인 금지 / (C) Full rubric 8항목 점수 영속화.
  machinery 아닌 README 한 줄 게이트(루프 재가동 시 적용).

## P3 — 문서 정합 정리 (저위험)

- [x] ✅ **빌드-order fix (2026-06-06 완료·검증)**: 6개 peerDep-only 패키지(grid-features·edit-plus·serverside·sheet·
  renderers·sizing)의 `devDependencies` 에 누락 @topgrid peer(`grid-core`/`grid-pro-tracking`/`grid-pro-range`) `workspace:*`
  추가 → pnpm topo-order 가 빌드 순서 보장. **병렬 `pnpm -r build` ×2 결정적 green 확인**(이전 비결정 실패 해소). 발행물 동작
  무변경(devDep). **미발행**(다음 release 에 포함). 커밋=remediation 브랜치.
- [x] ✅ **COMMERCIAL-GAP 헤드라인 카운트 재집계 완료(2026-06-06)**: 프로그래매틱 재계산 — **19/19 카테고리 reconcile**(파싱
  카운트==선언 기능 수)+**합 330** 검산 통과. 종합표(검증 열 추가)·카테고리 요약표 동기화 = **✅218/🟡62/❌47/➖3**(MOD-39 기준,
  이전 재감사 199/60/68). 손-추정 0.
- [x] ✅ **dedup tier-prose 재분해 완료(2026-06-06)**: 카테고리 상세표 AG Grid 컬럼 프로그래매틱 tally → **Community 15 +
  Enterprise 27 + 기타 5 = ❌47**(reconcile). 「잔여 ❌ 우선순위」 prose 정정(닫힌 기능 제외) + executive 갭영역·master-list 노트 동기화.
- [x] ✅ **master-list(149행) 행별 status 재flip 검증(2026-06-06)**: topgrid marker 를 카테고리 상세표와 프로그래매틱 대조
  → **149/149 일치, flip 대상 0**(모듈 작업 중 이미 동기화됨). 앞선 "행별 stale" 노트가 오판이었음(검증 전 추정) → 정정. 멤버십만
  최초감사 149건, status 는 최신.
- [ ] **MOD-18~21 state.json `spec` 필드 채움**: cosmetic(파일 존재, 필드만 공백) — 의도적 skip(저가치).
- [ ] **§5.2 minor 정정 — 보류(2026-06-06 재확인)**: 동작 영향 0 cosmetic. ★**감사의 line-ref 자체가 stale**(예 G1 "6 cell
  adapters" 주석 = grep 0=이미 해소/문구상이; registerRenderer 호출 8→**11**=감사 후 렌더러 추가). 정확히 쫓으려면 **항목별 재감사**
  필요 = busywork sink(advisor). **별도 cosmetic 재감사 task 로만 진행**(현 가치 near-zero). 유지.

## P4 — 기능 백로그 (vN, **연기 확정**)

### 4 escalated decision (사용자 "전부 vN" 결정)
- [ ] Column spanning(body colSpan) — 비-bounded(col-virt/핀/ARIA 얽힘), full-width 스팬 이미 4경로 존재
- [ ] Custom cell editor slot — 편집 컴포넌트 등록 API 설계 결정
- [ ] Full-row editing 모드 — per-cell→행 단위 edit/commit, 편집 모델 결정
- [ ] RTL 레이아웃 — invasive(핀 오프셋 LTR 전제 등), 한국시장 우선순위 낮음

### 9 Community vN
- [ ] post-sort callback · applyTransaction(증분) · async transaction batching · auto-page-size · custom page formatter
  · debounced-scroll · row animation · auto-virtualization-threshold · drag-between-grids

### Enterprise vN 클러스터 (deep)
- [ ] 차트 panel/dock·cross-filter(클러스터 7중 2) · advanced filter 쿼리빌더 · viewport row model · tree getDataPath/auto
  group col · group/hierarchy selection · sidebar/filters tool panel · sticky group headers · pivot panel·server-side
  pivot·total customization · master-detail+virtualization · grand-total footer
- [ ] **풀 스프레드시트**(grid-pro-sheet vN): 멀티시트(Sheet2!A1) · $A$1 절대참조 · 명명범위 · 셀 서식 · VLOOKUP/date/financial
  · 상대참조-on-fill · .xlsx 수식 import/export
- [ ] 모듈별 vN(state.json): MOD-39 가상화+핀 · MOD-26 풀시트 · MOD-22 LRU 캐시 등

## 별도 — 인프라/운영

- [ ] **docs site 재배포**(문서 변경 반영 시): topgrid.platree.com, 서버 gedebms, rsync([[docs-site-hosting]]).
- [ ] 발행 시 **peerDep major escalation 주의**([[changeset-peerdep-major-escalation]]): 수동 0.x bump 전략 유지(changeset version 금지).

---

> **권장 순서**: P0(발행) ↔ P1(검증 부채)은 사용자 판단 — 발행을 막을 fabrication 은 없으나(감사 결론), 상용 제품 신뢰도
> 관점에서 **P1-(D) browser verify 실집행을 발행과 병행/선행**할지가 핵심 결정. P2~P3 는 발행과 무관히 후속. P4 는 차기 버전.
