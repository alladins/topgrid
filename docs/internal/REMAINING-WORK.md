# TWGRID — 진행해야 할 작업 통합 리스트 (백로그)

> 2026-06-06 정리. 이번 세션(워크플로우 무결성 감사·시정)까지 반영한 **남은 작업 단일 SSoT**.
> 출처: `release_queue`(state.json) · `WORKFLOW-INTEGRITY-AUDIT.md`(B/C/D) · COMMERCIAL-GAP vN · 메모리.
> 우선순위 = P0(즉시) → P4(연기 확정). "발행"과 "검증 부채"는 분리한다.

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
