# TWGRID 전략 로드맵 — 멀티프레임워크(Vue+React) · 엔터프라이즈 차트 · 잔여작업

> ## ★★ W1 발행(6개) + W2 엔터프라이즈 차트 단계①~③ 완료·발행 (2026-06-18) ★★
> **★W2 차트 전체 완료**: 단계①(ECharts 선정 §3-4)→②(ADR-003 §3-5)→③ 증분1~3(스캐폴드·순수엔진·live wrapper·풀 카탈로그 17타입 §3-6~8)→**발행 `@topgrid/grid-pro-chart-enterprise@0.1.0` npm live·스모크 통과(§3-9)**. 검증: node 18 + chromium 7 + full 비주얼 무회귀. 알려진 한계=echarts regular-dep ^5.5.0(6.x peer 전환 후속, §3-9).
> **★발행 완료(2026-06-18~19, npm live·스모크 통과)**: (1)`@topgrid/grid-pro-chart-enterprise@0.2.0`(echarts→peer) → (2)**ADR-004 추출 배치**: `@topgrid/grid-chart-core@0.1.0`(신규 framework-neutral 엔진) + `@topgrid/grid-pro-chart-enterprise@0.3.0`(re-export shim+core 핀). 스모크: `npm i enterprise echarts`=**echarts 6.1.0 deduped=단일 인스턴스**(D3/ADR-004 의도 실증)·취약점 0·ERESOLVE 0. 상세 §3-10·§3-11.
> **★advisor #2 완료**: ADR-004 + 증분①(grid-chart-core 추출·발행) + **증분② Vue 컴포넌트 완료**(신규 `@topgrid/grid-pro-chart-enterprise-vue@0.1.0`, happy-dom node 8 live, zero-React 확정). **동일 grid-chart-core 엔진이 React+Vue 양쪽 구동=W2 차트 멀티프레임워크 완성**(§3-12). **Vue 패키지 발행은 user-gated(미실행, pack 검증 완료)**.
> **현 git 상태**: working tree **clean**. main 이 origin 보다 앞섬(★origin push=user-gated). npm live: enterprise@0.3.0 + chart-core@0.1.0. **발행 대기: grid-pro-chart-enterprise-vue@0.1.0**.
> **다음 후보**: (a)Vue 패키지 발행 (b)toolbar 17타입 노출 (c)neutral license-core 추출(Vue 자동 게이트) (d)W3/PTLPSM 통합 (e)BYO Highcharts/AG 어댑터.
> **발행 완료(2026-06-18, npm live·스모크 통과)**: 6개 = **@topgrid/grid-core-headless@0.1.0**(신규) · **@topgrid/grid-vue@0.1.0**(신규) · grid-core@**0.6.0** · grid-features@**0.9.0** · grid-pro-range@**0.4.0** · grid-pro-master@**0.7.0**. publisher=travia71, Bypass-2FA 토큰=비대화형 통과(OTP 프롬프트 없음). 절차: 수동 bump(★changeset version 미사용=major-escalation 회피 [[changeset-peerdep-major-escalation]]) → pnpm build green → pnpm -r test EXIT0 → **pnpm pack ×6 tarball 검증(workspace:* 전부 구체핀 치환·누출 0)** → topo 발행(headless→grid-core→features/range/master→grid-vue) → 소비자 스모크(`npm i @topgrid/grid-vue vue @tanstack/vue-table`=ERESOLVE 0, grid-vue→headless@0.1.0 라이브 해소). 상세 §11.9.
> **알려진 한계(수용됨)**: facade `@topgrid/grid` 은 배치 밖=옛 grid-core@0.5.0 핀 유지(npm 존재하므로 정상). 완전정합(21-lockstep)은 사용자 미선택. [[npm-publish-topgrid]].
> **★W2 단계① 완료(2026-06-18)**: 라이브러리 평가 매트릭스 → **Apache ECharts(Apache-2.0) 선정**(기본/번들 어댑터). 결정 렌즈=우리가 상용 재배포 제품(grid-license 동봉)이라 재배포-무료가 필수 → Highcharts(OEM 의무 전가)·AG Charts(갭 핵심타입=유료 Enterprise) 부적격. ECharts 만 §3-2 갭을 무료로 충족 + framework-agnostic core(W1 정렬) + SSR `renderToSVGString`(Nuxt PTLPSM 적합). Highcharts/AG Charts=BYO-라이선스 어댑터로만 개방(우리 미발행). 상세·매트릭스·출처=§3-4.
> **★W2 단계② 완료(2026-06-18)**: 스펙+ADR 확정. **[[ADR-003]]**(`.claude/dev-harness/decisions/`) + **스펙** `docs/internal/SPEC-grid-pro-chart-enterprise.md`. 핵심 결정: 신규 opt-in `@topgrid/grid-pro-chart-enterprise` = **ECharts thin 자작 어댑터**(echarts-for-react 기각=번들·SSR·무-의존 제어), **기존 `MatrixChartData` 브리지·`RangeChartPanel` 시임·license 게이트 재사용**(integrate=시임 오염 아님, R1), SVG 스파크라인은 additive 공존(C-001, R3). Highcharts/AG Charts=BYO 어댑터로만 개방(R4). 상세 §3-5.
> **★W2 단계③ 증분1+2 완료(2026-06-18)**: 신규 `packages/grid-pro-chart-enterprise@0.1.0` = 순수 `matrixToEChartsOption` 엔진(증분1) + **live React 표면**(증분2): thin `EChartsChart`(echarts/core **SVG 렌더러** init/dispose/ResizeObserver, 선택 모듈 등록 D3)·`EnterpriseChartPanel`(툴바 타입스위처·export `getDataURL`·cross-filter·license watermark PAT-003)·`createEChartsRenderer`(기존 `RangeChartPanel` 시임 호환 팩토리=D1/R1 루프 완결). 검증: node 10 + **chromium 4 신규 green**(live SVG 마운트·타입스위치가 ECharts 인스턴스 도달=`data-rendered-type` getOption() 리드백·export SVG dataURL·license 게이트)·**full 비주얼 스위트 126 passed 0 fail**(기존 122+신규 4, 무회귀)·typecheck0·`pnpm build` 전패키지 green. 상세 §3-6·§3-7.
> **★W2 단계③ 발행 완료(2026-06-18, npm live·스모크 통과)**: `@topgrid/grid-pro-chart-enterprise@0.1.0` 발행. publisher=travia71, Bypass-2FA 비대화형(OTP 0). 절차: 의존 사전검증(grid-license@0.3.0·grid-pro-chart@0.4.0 둘 다 로컬=npm 일치→lockstep 불요)→build/test(node 18)→**pnpm pack tarball 검증**(workspace:*→구체핀 0.3.0/0.4.0 치환·echarts ^5.5.0·files=dist+README·누출0)→`pnpm publish <dir> --no-git-checks --access public`→스모크(`npm i`=13 packages, **ERESOLVE 0·취약점 0**, tree=enterprise→license/chart/echarts@5.6.0 해소). ★net-new 패키지명=registry read-replica 전파 ~3.5분 지연(기존 패키지 bump 보다 느림, publish 자체는 즉시 성공). 상세 §3-9.
> **★echarts peer 후속 = 코드 완료(2026-06-18, 0.2.0 republish 대기=user-gated)**: 0.1.0 의 echarts regular-dep 한계 해소. echarts→**peerDependency `^5.5.0 || ^6.0.0`**(+devDep ^6.0.0). **echarts 6.x 실측 호환 확인**(typecheck0·node 18·build·**chromium 7 green @ echarts 6.1.0**=init/SVG렌더러/use/getOption/getDataURL/17타입/모듈명 5→6 안정). pack 검증=echarts deps 밖·peer 로·구체핀·누출0. **0.2.0 republish 는 발행 게이트(미실행)**. 상세 §3-10.
> **★W2 단계③ 증분3 완료(2026-06-18)**: 카탈로그 **8타입 확장** = bubble·funnel·treemap·radar·heatmap·candlestick·boxplot·sankey. 각 reshape 패밀리(single-series {name,value}·radar indicator·heatmap x/y/value triple·per-category stat tuple O,C,L,H/min~max·sankey nodes+links·bubble=scatter+symbolSize). echarts 모듈 선택 등록 확장(RadarChart·HeatmapChart·CandlestickChart·BoxplotChart·FunnelChart·TreemapChart·SankeyChart + RadarComponent·VisualMapComponent). 검증: **node 18 passed**(타입별 reshape 단언)·**chromium 7 passed**(+radar/heatmap/candlestick **live 마운트 게이트**=모듈 등록 입증)·full 스위트 무회귀(기존 flake master-detail-virt만 retries 흡수, 격리 재실행 pass)·typecheck0·build green. 상세 §3-8.
> **★다음 = 발행 게이트**(증분1~3 누적, user-gated): 신규 `@topgrid/grid-pro-chart-enterprise@0.1.0`(echarts 의존) npm 발행 — headless/grid-vue 때처럼 pnpm pack 검증→topo 발행. 또는 추가 폴리시(toolbar 에 신규 타입 노출·BYO Highcharts/AG 어댑터·Vue wrapper). ★Windows 로컬 비주얼: 포트 6006=Hyper-V 예외대역(5975-6074)→자유포트(9009)+throwaway config(committed 무변경), WSL2 면 6006 직행.

> 작성 2026-06-16. 사용자 요청: "전체 하이어라키 매트릭스에 추가할 진행 목록 + 소요 심층분석 + 분석/스펙/검증/구현/검증 단계화".
> **본 문서의 효과(소요) 수치는 전부 ROM(Rough Order of Magnitude)** — 확정 약속이 아니라 *분석/스펙 단계의 산출물로 확정될 예비치*. (이 저장소의 anti-over-claim 규율 적용: 추측을 권위 수치로 세탁 금지.)
> 근거 = 2026-06-16 코드 실측(아키텍처 감사 + 차트 감사). 추측 아님.

---

## 0. 경영 요약 (TL;DR)

세 개의 **신규 big rock** 이 추가된다. 셋 다 기존 floor 백로그(✅248/🟡73/❌6)를 **압도하는 규모**다.

| ID | 워크스트림 | 핵심 결정 | ROM(1 시니어) |
|----|-----------|----------|---------------|
| **W1** | 멀티프레임워크 (headless 코어 추출 → React 어댑터 재구성 + Vue 어댑터) | **Vue·React는 한 프로젝트**. Phase 0 headless 추출이 모든 것의 선행 | **5~8개월** |
| **W2** | 엔터프라이즈 차트 | **build 아님 → integrate**(ECharts/AG Charts wrap, opt-in 패키지). 경량 스파크라인은 유지 | **1.5~2.5개월** |
| **W3** | React 정식 제품화 (DX) | W1의 React-어댑터 부분 **+** 컴포넌트 API·문서·예제 폴리시 | W1 내포 + **0.5~1개월** |

★**PTLPSM(Nuxt3/Vue3) = W1 의 1차 소비자**(2026-06-16 사용자 결정, 별개 임시 트랙 폐기): Vue 전용이라 W1 Vue 어댑터가 곧 해법. 임시 우회 안 함 → **W1 PoC 의 수직 슬라이스를 PTLPSM 통계-그리드 형태로 잡아** 최초 마일스톤이 곧 PTLPSM-usable 이 되게 한다(스테이지드 딜리버리) → §5.

★**의존성**: `W3 ⊂ W1`. `W1 Phase 0(headless 추출)`은 Vue·엔터프라이즈-Vue-차트의 **공통 선행**. W2(차트)는 React 한정이면 W1과 독립, Vue 차트까지면 W1 Phase 0 필요.

---

## 1. 현재 아키텍처 — 코드 실측 사실 (모든 추정의 근거)

### 1-1. TanStack 결합 (Vue 난이도의 결정 인자)
- grid-core 는 **`@tanstack/react-table` 에 직접 결합**(소스 44 imports), framework-agnostic `@tanstack/table-core` **미사용**.
- 단 진짜 React-종속 표면은 좁음: **`useReactTable`(~95 usages, 10 패키지) + `flexRender`(~71, 7 패키지)** 둘 뿐. 나머지(`SortingState` 등 타입, `getCoreRowModel` 등 row-model)는 table-core 재export → **이식 가능**.
- ★**TanStack 은 `@tanstack/vue-table`(useVueTable + Vue FlexRender) 공식 제공** → Vue 포팅이 "from-scratch 재작성"이 아니라 "어댑터 교체 + 컴포넌트 재작성"이 됨.

### 1-2. 순수 로직 vs React-결합 비율 (.ts=71% / .tsx=29%)
| 분류 | 패키지 | Vue 이식 |
|------|--------|---------|
| **순수(React 0, 거의 그대로 재사용)** | grid-sizing(0 tsx)·grid-export(로직)·grid-pro-edit-plus(0 tsx)·grid-pro-serverside(0 tsx)·grid-pro-sheet·grid-pro-pivot(computePivot)·grid-pro-agg(computeAggregateRow)·grid-pro-tracking·grid-pro-merging·grid-pro-filter | TRIVIAL~EASY |
| **혼합(순수코어 + UI)** | grid-renderers(25 tsx)·grid-pro-panel·grid-pro-header·grid-pro-datamap·grid-pro-chart | MEDIUM |
| **React-중심(커스텀 훅 다수)** | **grid-core(55ts+29tsx, ~148 훅 usage)**·grid-features·grid-pro-master(41 훅)·grid-pro-range(73 훅) | HARD |

★**핵심 비용 = grid-core 의 ~148 훅 usage(useGridState·useControllableState·useColumnDrag·useColumnVirtualizer 등)를 "순수 로직"과 "프레임워크 바인딩"으로 분리**하는 것. 순수 패키지들은 거의 공짜로 넘어감.

### 1-3. 차트 현황 (grid-pro-chart v0.4.0)
- 지원: **line/bar/area 3종 + 스파크라인 4종(line/bar/area/win-loss)**. **순수 SVG ~1,200 LOC, 차트 라이브러리 의존 0**(C-001/AP-001 제약 = 셀 인라인 스파크라인 경량 유지 목적).
- 보유: Y축 nice-ticks·카테고리 X축·범례·툴팁·6색 팔레트·cross-filter 선택·데이터 갭핑·grid-range→series 어댑터.
- ★**"그리드 연동 경량 시각화"이지 차트 라이브러리가 아님.** Wijmo FlexChart/AG Charts 대비 부재 목록 → §3-2.

---

## 2. W1 — 멀티프레임워크 (Vue + React 통합)

> ★**재구성(reframe)**: Vue 지원과 React 지원은 **별개 항목이 아니라 동일 프로젝트**다. Vue 를 지원하려면 React 훅에 묶인 로직을 **headless(프레임워크 무관) 코어로 추출**해야 하고, 그 즉시 기존 React 패키지들도 **그 공유 코어를 소비하도록 재구성**해야 한다(안 하면 순수 로직 수정이 매번 2벌 = 유지보수 fork). 그래서 구조는:
>
> **Phase 0(headless 추출) → [React 어댑터 재구성 ∥ Vue 어댑터 신규] 병렬.**

### 2-1. 목표 아키텍처
```
@topgrid/grid-core-headless   ← @tanstack/table-core 위, 순수 로직(상태머신·계산·옵션빌더), React/Vue 무관
        ├── @topgrid/react/*  ← useReactTable + flexRender + .tsx (현 패키지들을 얇은 어댑터로 재구성)
        └── @topgrid/vue/*    ← useVueTable + Vue FlexRender + .vue (신규)
순수 패키지(sizing/export/sheet/pivot/agg/edit-plus/serverside…) = headless 소비, 양 프레임워크 공유(이식 거의 0)
```

### 2-2. 단계 (분석 → 스펙 → 검증(PoC) → 구현 → 검증)
| 단계 | 산출물 | 게이트 | ROM |
|------|--------|--------|-----|
| **① 분석** | grid-core 훅 ↔ 순수로직 경계 인벤토리, table-core 매핑표, 리스크 등급, **추정치 확정** | 헤드리스 추출 가능선 확정 | 2~3주 |
| **② 스펙** | 패키지 경계 ADR, headless API 표면, React/Vue 어댑터 계약, 발행/버전 전략 | ADR 승인 | 2~3주 |
| **③ 검증(PoC)** | **수직 슬라이스 1개**(grid-core 최소 + 정렬/필터)를 headless+React+Vue 3-way 동작 입증 | PoC가 핵심 가정(useVueTable 등가) 검증 | 3~4주 |
| **④ 구현** | Phase0 headless 추출 → React 재구성(순수=거의 공짜, UI 재배선) ∥ Vue 어댑터(.tsx→.vue, 하드 4패키지 composable 재작성) | 패키지별 node green + 양 프레임워크 렌더 | 대부분 |
| **⑤ 검증** | node 로직 테스트(공유) + React chromium + **Vue(@playwright/vue 또는 vitest+@vue/test-utils)** + cross-framework parity | suite green | 지속 |

### 2-3. ROM (가정 명시)
- **가정**: 1 시니어 풀타임, Phase 0 선행, 발행 인프라 기존 재사용, 디자인/QA 별도.
- Phase 0 headless 추출(grid-core 디커플): **6~10주**(최대 불확실 — 분석 단계서 확정).
- React 어댑터 재구성: **3~5주**(순수 패키지 거의 공짜, UI 재배선).
- Vue 어댑터 신규(전 패키지): **8~14주**(하드 4 = grid-core/features/master/range composable 재작성이 비용 중심).
- **합계 ROM ≈ 5~8개월(1 시니어)** / 2~3인 투입 시 ~3~5개월. ★수치는 ①분석·③PoC 후 ±50% 보정 전제.

### 2-4. 리스크
- grid-core 가상화/키보드네비/드래그가 React 훅 깊이 결합 → 추출 시 회귀 위험(기존 122 chromium suite 가 안전망).
- Vue 의 반응성(ref/reactive) ↔ headless 상태머신 동기화 패턴 = PoC 에서 반드시 검증할 핵심 미지수.

---

## 3. W2 — 엔터프라이즈 차트

> ★**결정: build 아님 → integrate.** 14+종 차트·다축·zoom/pan·애니메이션·export 는 Highcharts/ECharts/AG Charts 가 *팀×수년* 들인 영역. from-scratch 재발명은 비현실적(over-claim). **경량 SVG 스파크라인/레인지차트(그리드 셀용)는 그대로 유지**하고(C-001 제약 존중), 엔터프라이즈 차트는 **이미 존재하는 주입 시임(`RangeChartPanel` = "소비자가 렌더러 주입")으로 외부 라이브러리를 wrap 하는 별도 opt-in 패키지**로 추가한다.

### 3-1. 단계
| 단계 | 산출물 | ROM |
|------|--------|-----|
| **① 분석/평가** | 라이브러리 비교(ECharts(무료/MIT) vs AG Charts vs Highcharts(상용)), 라이선스·번들·SSR·Vue/React 양쪽 지원·테마 평가 매트릭스 → 선정 | 1~2주 |
| **② 스펙** | `@topgrid/grid-pro-chart-enterprise` API(chart-from-range·툴바·타입 카탈로그·cross-filter·export 계약), 주입 시임 확장 ADR | 1~2주 |
| **③ 구현** | 선정 라이브러리 어댑터, grid-range→chart, "Insert Chart" 그리드 툴바, 타입 커버리지, PNG/PDF/SVG export, 그리드 선택↔차트 cross-filter | 4~8주 |
| **④ 검증** | 차트 타입별 렌더 + interaction(zoom/legend toggle) + export 라운드트립 chromium | 지속 |

### 3-2. 부재 기능 갭 (현 3종 → 엔터프라이즈)
- **차트 종류**: pie/doughnut·scatter·bubble·combo·OHLC/캔들스틱·radar/polar·heatmap·treemap·waterfall·funnel·box-plot/histogram·spline·stacked(bar/area/100%) **전부 부재**.
- **축/스케일**: 다축(2차 Y)·log·time/date 축·축 분할 **부재**.
- **인터랙션**: zoom·pan·legend toggle·series 토글·drill-down·키보드네비·range 선택 **부재**.
- **비주얼**: 애니메이션·다크모드/테마·데이터라벨·주석·추세선·에러바 **부재**.
- **데이터/성능**: 대용량 canvas 렌더링·실시간 스트리밍·집계 **부재**.
- **통합/export**: "Insert Chart" 툴바·PNG/PDF/SVG export·인쇄 **부재**.

### 3-3. ROM
- integrate 경로 **≈ 1.5~2.5개월(1 시니어)**. (Vue 차트까지면 W1 Phase 0 선행.)
- from-scratch 경로 = **비권장**(다년·다인). 본 로드맵 채택 안 함.

### 3-4. W2 단계① — 라이브러리 평가 매트릭스 + 선정 (2026-06-18, ✅ 평가 산출물)

> §3-1 단계①의 산출물. **분석 deliverable**(코드 변경 0, 스펙/구현 아님). 근거 = 2026-06 웹 실측(라이선스·번들·SSR·프레임워크). ★수치/조건은 시점성 있음 → 계약 시 재확인(over-claim 방지).

#### ★평가를 지배하는 단일 렌즈: **재배포 가능성(license)**
@topgrid 자체가 **상용 재배포 제품**(`@topgrid/grid-license`+watermark 동봉, 소비자가 상업적으로 사용·재배포). 따라서 **기본 번들(default adapter)에 묶을 차트 라이브러리는 상용 재배포를 무료로 허용**해야 함 — 소비자에게 per-seat/OEM 라이선스 의무를 전가하면 안 됨. 이 한 가지가 후보를 깨끗하게 정렬한다.

#### 평가 매트릭스 (3 후보)
| 기준 | **Apache ECharts** | **AG Charts** | **Highcharts** |
|------|--------------------|----------------|-----------------|
| 라이선스 | **Apache-2.0**(전체 무료·재배포 OK) | Community=**MIT**(무료) / Enterprise=상용 EULA | **상용 전용**(무료=비상업 한정) |
| ★재배포(우리 케이스) | ✅ 제약 0 | 🟡 MIT 티어만; 엔터프라이즈 타입 쓰면 상용 | ❌ OEM 라이선스 필요($5k~$50k+/yr), 의무 하류 전가 |
| 차트 타입(무료 범위) | ✅ **최광**: line/bar/area/pie/scatter/candlestick/radar/heatmap/treemap/sankey/funnel/boxplot/graph 등 거의 전부 무료 | 🟡 Community=pie/area/bar/scatter/bubble+축/범례/툴팁; **heatmap·sankey·radar·waterfall·financial·zoom·애니메이션=Enterprise** | ✅ 광범(financial 강점) — 단 전부 상용 |
| §3-2 갭 충족 | ✅ 무료로 대부분 해소 | ❌ 갭의 핵심(heatmap/sankey/financial/zoom)이 Enterprise=유료 | ✅(유료) |
| 번들 | ✅ tree-shakable(~100kb gz core, 선택 import 로 더 축소) | 🟡 중간 | 🟡 모듈식 |
| SSR | ✅ **공식 `renderToSVGString`**(5.3+, zero-dep, ssr:true) | 🟡 제한적 | ✅ Node export-server(이미지/PDF 리포트 강점) |
| React/Vue | core=framework-agnostic + wrapper(`echarts-for-react`=커뮤니티, `vue-echarts`=공식급) | ✅ **공식** `ag-charts-react`·`ag-charts-vue3` | ✅ 공식 `highcharts-react-official`·`highcharts-vue` |
| export | getDataURL(PNG/SVG) | 이미지 export(고급=Enterprise) | exporting 모듈(PNG/PDF/SVG, offline) |

#### ★선정: **Apache ECharts (Apache-2.0) = 기본/번들 어댑터의 1순위**
- **이유 1(결정적)**: 우리 제품이 상용 재배포이므로 Apache-2.0 가 유일하게 마찰 없는 선택. AG Charts 는 §3-2 갭의 핵심 타입이 Enterprise(유료)라 "엔터프라이즈 차트 갭 메우기"라는 목적과 충돌하고, 그 순간 하류 라이선스 문제가 재발. Highcharts 는 OEM 의무 전가로 기본 번들 부적격.
- **이유 2(범위)**: §3-2 의 부재 타입(candlestick·heatmap·treemap·radar·sankey·funnel·boxplot·stacked·다축·zoom/pan·애니메이션)이 **ECharts 무료 범위에서 거의 전부 충족**.
- **이유 3(아키텍처 시너지=W1)**: ECharts core 가 framework-agnostic → "**차트 어댑터 코어 1 + 얇은 React/Vue wrapper 2**" 구조가 W1 의 headless-core+어댑터 패턴과 정확히 정렬. SSR(`renderToSVGString`)은 PTLPSM(Nuxt3) 소비자 시나리오와도 맞음.
- **아키텍처 적합**: 기존 주입 시임 `RangeChartPanel.renderChart?: (series)=>ReactNode`(C-001/AP-001, 라이브러리 의존 0 유지)에 **신규 opt-in `@topgrid/grid-pro-chart-enterprise` 가 ECharts 어댑터를 주입**. grid-pro-chart 본체는 SVG 스파크라인 그대로 유지(C-001 존중). grid-vue 용은 동일 어댑터 코어에 Vue wrapper.

#### ★정직한 한계/리스크 (over-claim 방지)
- `echarts-for-react`=**커뮤니티 유지**(Apache 공식 아님). 리스크 완화 옵션: 우리 시임이 이미 있으니 **얇은 자체 wrapper 자작**(ECharts core 직접 mount/dispose)도 저비용 대안 — 스펙 단계서 결정.
- 라이선스/가격/티어 경계는 **2026-06 시점 웹 실측** — 계약/채택 확정 시 각 vendor 공식 문서 재확인 필수.
- Highcharts 는 **완전 배제 아님**: financial/SSR-리포트가 강하므로 "**소비자 BYO(자체 라이선스) 어댑터**" 경로로 남겨둠(주입 시임이라 소비자가 자기 Highcharts 로 renderChart 주입 가능) — 단 우리가 번들/발행하지 않음.
- AG Charts 도 동일하게 BYO-Enterprise 어댑터로 열어둘 수 있음(전략적으론 AG Grid=그리드 경쟁사라 기본 채택은 부적절).

#### ★다음 = §3-1 단계② 스펙/ADR (미착수, 코드 변경 전 게이트)
`@topgrid/grid-pro-chart-enterprise` API 표면(chart-from-range·타입 카탈로그·"Insert Chart" 툴바·cross-filter·export 계약) + 주입 시임 확장 ADR + ECharts 어댑터 wrapper 전략(커뮤니티 wrapper vs 자작). 구현(단계③) 전 ADR 승인 게이트.

**출처(2026-06 실측)**: [AG Charts Community vs Enterprise](https://www.ag-grid.com/charts/javascript/community-vs-enterprise/) · [ag-charts-community npm](https://www.npmjs.com/package/ag-charts-community) · [Highcharts Standard License](https://shop.highcharts.com/license) · [Highcharts shop/FAQ](https://shop.highcharts.com/faq) · [ECharts SSR Handbook](https://apache.github.io/echarts-handbook/en/how-to/cross-platform/server/) · [echarts npm](https://www.npmjs.com/package/echarts) · [vue-echarts npm](https://www.npmjs.com/package/vue-echarts).

### 3-5. W2 단계② — 스펙 + ADR-003 (2026-06-18, ✅ 설계 산출물·코드 0)

> §3-1 단계②의 산출물. **설계 deliverable**(스캐폴드 전 게이트). 정본 = **[[ADR-003]]**(`.claude/dev-harness/decisions/ADR-003-enterprise-chart-echarts-adapter.md`) + **스펙** `docs/internal/SPEC-grid-pro-chart-enterprise.md`. 본 절은 요약.

#### ★실측이 바꾼 전제 (grid-pro-chart 가 이미 가진 것)
단계② 착수 시 소스 대조 결과, grid-pro-chart 는 from-scratch 대상이 **아니었음** — 이미 보유:
- 주입 시임 `RangeChartPanel.renderChart?: (RangeSeries[]) => ReactNode`(C-001/AP-001=라이브러리 0),
- **데이터 브리지 `seriesFromMatrix`/`seriesFromPivot` → `MatrixChartData = {categories, series: ChartSeries[]}`**(range 선택·피벗 둘 다 이 하나로 환원),
- 빌트인 SVG `RangeChart`(line/bar/area) + `ChartCard`(타입 스위처).
→ 엔터프라이즈 패키지 = "기존 브리지·시임 위 ECharts 백엔드 얹기" = **integrate**(설계 §3-4 재확인).

#### ADR-003 핵심 결정 (각 trade-off 동반, 상세=ADR 본문)
- **D1**: 데이터 입력 = **리치 `MatrixChartData` 브리지 재사용**(엔터프라이즈는 x축 라벨 필요 → lossy `RangeSeries` 아님). 최소 시임 `RangeSeries`/`RangeChartPanel` **무변경**(C-001 보존).
- **D2**: ECharts wrapper = **얇은 자작 어댑터**(`echarts-for-react` 기각). 번들 제어·SSR(`renderToSVGString`)·무-의존·버전 자율 > lifecycle 유지편의. lifecycle=~50줄 init/dispose/ResizeObserver.
- **D3**: ECharts **선택 모듈 등록**(`echarts/core`+필요 charts/components), barrel import 금지 = opt-in 번들 위생.
- **R1(거부)**: 최소 시임에 엔터프라이즈 관심사(축·cross-filter·export) 욱여넣기 → `RangeSeries` 계약 오염·다수에 비용 전가. 대신 **별도 `EnterpriseChartPanel`** 이 관심사 격리. ([[LESS-005]] 역: 시임 있어도 *최소 계약*이면 리치는 별도 브리지·패널로 흡수.)
- **R3(거부)**: SVG `RangeChart`→ECharts 교체 = C-001 위반. 스파크라인 SVG 유지 + 엔터프라이즈 **additive opt-in** 공존.
- **R4(거부)**: AG Charts/Highcharts 번들(§3-4 기각 재확인). 단 주입 시임이라 **소비자 BYO 어댑터**(자기 라이선스로 renderChart 주입)는 열림 — 우리 미발행.

#### 스펙 공개 표면(제안, 구현서 확정 전)
순수 `matrixToEChartsOption(MatrixChartData, ChartOptionSpec)` (node-test 우선=타입 카탈로그) · thin `EChartsChart`(자작 wrapper) · `createEChartsRenderer(spec)`(기존 시임 호환 팩토리) · `EnterpriseChartPanel`(툴바·export `getDataURL`·cross-filter 콜백). 타입 카탈로그=line/bar/area/stacked/pie/doughnut/scatter/bubble/radar/heatmap/candlestick/boxplot/funnel/treemap/sankey.

#### ★다음 = 단계③ 구현(첫 코드)
`packages/grid-pro-chart-enterprise/` 스캐폴드 → 순수 매핑 node-test → wrapper → 패널. 검증 node+chromium. 발행은 단계③ 후 별도 게이트.

### 3-6. W2 단계③ 증분1 — 패키지 스캐폴드 + 순수 매핑 엔진 (2026-06-18, ✅ 첫 코드)

> 첫 코드. 신규 의존 `echarts@5.6.0` 도입. ★범위(정직): **순수 매핑 엔진 + node test 만**. React wrapper·패널·카탈로그 잔여 타입은 증분2(live=chromium 필요, repo 패턴=순수 먼저).

#### 한 것
- **신규 패키지 `@topgrid/grid-pro-chart-enterprise@0.1.0`**(`packages/grid-pro-chart-enterprise/`): package.json/tsconfig/tsup/README/EULA + `src/index.ts`. deps=`echarts`(external, 소비자 단일 인스턴스 dedupe)·`@topgrid/grid-pro-chart`(workspace:*, **`MatrixChartData` 타입 재사용=ADR-003 D1**), peer=react.
- **순수 `matrixToEChartsOption(MatrixChartData, ChartOptionSpec) → EChartsOption`**(`src/internal/`): ★echarts·grid-pro-chart 둘 다 **type-only import**(strip-types 가 erase → node test 가 echarts 런타임 없이 동작=zero-dep). 구현 타입군 3 SHAPE: **cartesian/stacked**(line·bar·area·stacked-bar·stacked-area·**100-stacked-bar=per-category 100 정규화**·**secondaryAxisSeries=yAxisIndex 라우팅**)·**scatter**([idx,value] pairs)·**pie/doughnut**(축 0, 첫 series→{name,value} slices). `EnterpriseChartType` union=**구현된 것만 노출**(미구현 타입=throw, 카탈로그 거짓말 금지).
- ★grid-pro-chart 의 SVG 스파크라인/`RangeChart`/`RangeChartPanel` **무변경**(C-001/R3 공존).

#### 검증 (전부 green)
- **node 10 passed**(non-vacuous: 100%-stack 정규화 raw 10/30→25/75 단언·secondary-axis 라우팅·pie 축 제거·unsupported throw).
- typecheck 0 — ★`skipLibCheck:true` 오버라이드(echarts@5.6.0 *자체* .d.ts 가 `export =`(TS1203 under ESM)+`GraphSeriesOption` exactOptionalPropertyTypes 비호환. **우리 src 는 여전히 strict**. grid-features 선례=upstream 타입 버그 동일 패턴).
- **`pnpm build` 전패키지 topo green**(신규 패키지 dist cjs/esm/dts)·`pnpm -r test` green.
- ★chromium 미실행=의도적: 신규 패키지=소비자 0 leaf, 기존 src 변경 0 → 행위 패리티 영향 없음(순수 매핑은 node 가 적정 게이트). live 렌더는 증분2 wrapper 와 함께 chromium.

#### 남은 것 (증분2)
- thin `EChartsChart`(자작 wrapper, echarts/core init/setOption/dispose/ResizeObserver)·`createEChartsRenderer`(기존 시임 팩토리)·`EnterpriseChartPanel`(툴바·export·cross-filter) + 카탈로그 확장(radar/heatmap/candlestick/boxplot/funnel/treemap/sankey/bubble). 발행=별도 게이트.

### 3-7. W2 단계③ 증분2 — live React 표면 + chromium 게이트 (2026-06-18, ✅ first live)

> 증분1(순수 엔진) 위 **live**. 신규 의존 사용=`echarts/core`+선택 모듈(BarChart·LineChart·ScatterChart·PieChart·GridComponent·TooltipComponent·LegendComponent·**SVGRenderer**). ★범위(정직): live wrapper·panel·factory + chromium. **카탈로그 확장(radar/heatmap/…)=증분3 으로 연기**(각 타입 distinct reshape).

#### 한 것
- **`EChartsChart`(thin 자작 wrapper, ADR-003 D2)**: `echarts.init(el,_,{renderer:'svg'})` → 인라인 `<svg>`(canvas 아님=DOM 검사가능·SSR 친화·non-vacuous 게이트의 근거). useEffect 3개=init/dispose(once)·cross-filter click bind·option push. ★`setOption` 후 `getOption().series[0].type` 를 `data-rendered-type` 로 리플렉트=ECharts 가 **실제로 옵션을 수용**했다는 신호(React state 아님). ResizeObserver→resize. **선택 모듈 등록(D3)**=barrel import 회피.
- **`EnterpriseChartPanel`(R1=관심사 격리)**: 툴바 타입스위처(bar/line/area/stacked-bar/pie/scatter)·Export(`getDataURL({type:'svg'})`→`data-export-result-len` 리플렉트)·cross-filter(`onCrossFilter`)·**license watermark**(`useLicenseStatus`+`Watermark`, PAT-003). 최소 시임 `RangeChartPanel` 무변경.
- **`createEChartsRenderer(spec)`(D1/R1 루프 완결)**: 기존 `RangeChartPanel.renderChart?: (RangeSeries[])=>ReactNode` 시임 호환 팩토리 반환(RangeSeries lossy→인덱스 카테고리). 최소 시임만 가진 소비자도 ECharts 백엔드 주입 가능=시임 오염 없이 통합.
- index 에 `checkLicense()` 모듈로드 게이트(PAT-003) + live 표면 export. grid-license 의존 추가.

#### 검증 (전부 green)
- **chromium 4 신규 passed**(`tests/visual/enterprise-chart.spec.ts`): (1)bar 스토리 인라인 SVG 마운트+rendered-type 'bar' (2)★타입스위치 bar→pie 가 ECharts 인스턴스 도달(rendered-type flip=stale 옵션이면 실패) (3)Export SVG dataURL len>100 라운드트립 (4)license 게이트 unlicensed→watermark·licensed→none.
- **full 비주얼 스위트 126 passed 0 fail**(기존 122+신규 4, 무회귀)·`skipLibCheck` 외 typecheck0·`pnpm build` 전패키지 green.
- ★**Windows 로컬 실행 메모**: 포트 6006=Hyper-V 예외대역(5975-6074, `netsh ... excludedportrange`)→EACCES. 자유포트(9009)+throwaway playwright config(committed config 무변경)로 실행. WSL2 환경이면 6006 직행(README 절차).

#### 남은 것 (증분3)
- 카탈로그 확장 8타입(각 reshape+모듈등록+node 단언). 또는 발행(증분1+2 누적, user-gated).

### 3-8. W2 단계③ 증분3 — 카탈로그 확장 8타입 (2026-06-18, ✅ 풀 카탈로그)

> 증분1 엔진 + 증분2 live 표면 위에 나머지 타입을 채움. ★각 타입은 **데이터 reshape 형태가 달라** 개별 브랜치(타입 리터럴 → TS 유니온 마찰 회피).

#### 추가 타입 + reshape 패밀리
- **single-series {name,value}**(pie 와 동형): `funnel`·`treemap`(첫 series→items, 축 0).
- **scatter+size**: `bubble`=scatter 베이스 + **`symbolSize` 함수**(value→크기; 매트릭스에 없는 3차원을 value 로 인코딩, rendered-type='scatter').
- **radar**: categories→indicator 축(각 max=전체 최대), 각 series→1 폴리곤(`{name, value: values}`). 모듈 `RadarChart`+**`RadarComponent`**(좌표계).
- **heatmap**: (x=category, y=series, value) **triple** + `visualMap`(도메인=min/max). 모듈 `HeatmapChart`+**`VisualMapComponent`**.
- **per-category stat tuple**: `candlestick`(series 0..3=O,C,L,H)·`boxplot`(series 0..4=min,Q1,med,Q3,max) → row i=각 series 의 i번째. 모듈 `CandlestickChart`·`BoxplotChart`.
- **sankey**: nodes=categories ∪ series명, links=(category→series, value>0) 만. 모듈 `SankeyChart`.

#### 검증 (전부 green)
- **node 18 passed**(기존 10 + 신규 8; 각 타입 reshape 단언=candlestick OCLH 튜플·radar indicator max·heatmap triple·sankey link 필터 등 non-vacuous).
- **chromium 7 passed**(기존 4 + **신규 3 카탈로그 live 게이트**=radar/heatmap/candlestick 가 실제 ECharts 에 마운트+`data-rendered-type` 일치 → ★모듈 등록 누락이면 런타임 throw 로 실패하므로 RadarComponent·VisualMapComponent 등록을 실증).
- full 비주얼 스위트=enterprise 7 전원 pass, 유일 실패=기존 `master-detail-virtualization` react-virtual 타이밍 flake(본 변경 무관, 격리 재실행 1 passed; canonical config retries 흡수). typecheck0·`pnpm build` 전패키지 green.
- ★toolbar 노출은 6타입 유지(bar/line/area/stacked-bar/pie/scatter); 신규 8타입은 `initialType`/`spec`/`createEChartsRenderer` 경유(toolbar 확장은 폴리시 선택).

#### ★카탈로그 표면 완성 → 다음 = 발행 게이트
17 타입 전부 구현·검증. 발행(`@topgrid/grid-pro-chart-enterprise@0.1.0`+echarts, user-gated)이 다음 가장 가치 높은 미실행. → §3-9 에서 발행 완료.

### 3-9. W2 단계③ 발행 — npm live (2026-06-18, ✅ 스모크 통과) ★발행 게이트 해소

> 사용자 승인("발행을 진행"). 신규 `@topgrid/grid-pro-chart-enterprise@0.1.0` 가 npm 에 존재 → PTLPSM 등 외부 소비 가능.

- **사전 검증(lockstep 판정)**: 런타임 의존 `@topgrid/grid-license`(로컬 0.3.0)·`@topgrid/grid-pro-chart`(로컬 0.4.0) 둘 다 **로컬 버전=npm 발행본 일치**(npm view 확인) → workspace:* 구체핀 치환이 라이브 registry 에서 해소 가능 → **선발행/lockstep 불요**(W1 headless 와 달리 신규 의존 없음).
- **절차(전 단계 green)**: build(dts 포함)→test(node 18)→**`pnpm pack` tarball 검증**: `@topgrid/grid-license@0.3.0`·`@topgrid/grid-pro-chart@0.4.0` 구체핀 치환·`echarts@^5.5.0`·peer react/react-dom·`files`=dist+README·TOMIS/내부경로 누출 0→`pnpm publish packages/grid-pro-chart-enterprise --no-git-checks --access public`(positional dir 형식, [[npm-publish-topgrid]]).
- **소비자 스모크(npm live)**: temp 폴더 `npm i @topgrid/grid-pro-chart-enterprise echarts react react-dom`→13 packages, **ERESOLVE 0·취약점 0**. tree=enterprise@0.1.0→grid-license@0.3.0·grid-pro-chart@0.4.0(license deduped)·echarts@5.6.0 라이브 해소.
- ★**net-new 패키지명 전파 지연**: publish 즉시 성공(`+ ...@0.1.0`)이나 registry.npmjs.org read-replica 가 **~3.5분** 후 200(기존 패키지 version bump 은 즉시; **최초 패키지명은 메타도큐 생성이 느림**). curl 직접 폴링으로 확인 후 스모크. → 다음 신규 패키지 발행 시 스모크 전 폴링 루프 권장.
- ★**알려진 한계(follow-up, 수용)**: echarts=**regular dependency `^5.5.0`**(peer 아님). 소비자가 echarts 6.x 별도 설치 시 5.x+6.x **2벌 공존**(ADR-003 D3 "소비자 단일 인스턴스 dedupe" 의도 미달). 현 발행물은 echarts 5.6.0 내부정합·동작 정상. 후속=**echarts 6.x 호환 평가**(6.x 도 Apache-2.0) **+ echarts-as-peerDependency 전환**(소비자가 단일 echarts 주입) — minor bump 으로 처리.

#### ★다음 후보 (user-gated 또는 폴리시)
(a)git push(미실행 로컬 커밋, user-gated) (b)echarts-as-peer + 6.x 평가(위 한계 해소) (c)toolbar 신규 타입 노출 (d)Vue wrapper(grid-vue 용 ECharts) (e)BYO Highcharts/AG 어댑터 (f)W3/PTLPSM 통합.

### 3-10. echarts peer 전환 + 6.x 호환(advisor 우선순위 #1) — 0.2.0 (2026-06-18, ✅ 코드·검증 / republish 대기)

> 사용자 "advisor 일임 계속 진행". advisor 판정: 출시물 무결성(A) > Vue wrapper(C, 大워크스트림) > toolbar(B, 코스메틱). A 먼저 실행.

#### 한 것
- **echarts: dependency→peerDependency `^5.5.0 || ^6.0.0`** + devDependency `^6.0.0`(우리 빌드/스토리/테스트용). 이유: echarts 는 stateful(전역 `echarts.use()` 레지스트리·테마) → **소비자 단일 인스턴스**가 옳음(ADR-003 D3 의도). regular-dep 면 소비자가 echarts 별도 설치 시 2벌 공존(모듈 등록이 인스턴스별 분리=버그 클래스).
- README: echarts=peer(5.x/6.x) 명시. version 0.1.0→**0.2.0**(dep→peer=소비자 대면 breaking, 0.x minor).

#### 검증 (echarts 6.1.0 실측, advisor=추측 금지)
- typecheck0·**node 18**·build green @ echarts 6.1.0.
- **chromium 7 passed @ echarts 6.1.0**(bar/타입스위치/export + radar/heatmap/candlestick live 게이트 + license) → init·`{renderer:'svg'}`·`use()`·`getOption()`·`getDataURL()`·17타입 옵션·모듈명(RadarComponent·VisualMapComponent 등) **5→6 전부 안정** 입증.
- pack(0.2.0): echarts=peer(deps 밖)·@topgrid 구체핀(0.3.0/0.4.0)·workspace 누출 false.
- ★결론: peer 범위 `^5.5.0 || ^6.0.0` 양 major 실측 근거 확보(5.x=0.1.0 발행시 5.6.0, 6.x=금회 6.1.0).

#### 남은 것 → §3-11 에서 발행 완료
- **0.2.0 republish** ✅ 발행(§아래). 다음 advisor 후보 #2 Vue = §3-11 에서 증분①(추출) 실행.

### 3-11. echarts peer 발행 + ADR-004 grid-chart-core 추출 발행 (2026-06-18~19, ✅ "둘 다")

> 사용자 "둘 다"=(a)0.2.0 republish + (b)Vue 증분①(grid-chart-core 추출). 둘 다 실행·발행·스모크 통과.

#### (a) `grid-pro-chart-enterprise@0.2.0` — echarts→peer
- §3-10 코드 발행. 스모크: 0.2.0 live, peerDependencies echarts `^5.5.0 || ^6.0.0`·deps=@topgrid 2핀. 0.1.0 supersede.

#### (b) ADR-004 증분① — `@topgrid/grid-chart-core` 추출 (fork 없음)
- **신규 `@topgrid/grid-chart-core@0.1.0`**: 순수 `matrixToEChartsOption`+카탈로그 17타입+node 18 테스트 **이관**. ★**완전 중립**: `dependencies: {}`(echarts=type-only optional peer, react/vue/grid 0). 입력타입 `ChartMatrix`/`ChartSeriesInput` **여기 정의**(grid-pro-chart `MatrixChartData` 가 구조적으로 만족=structural-typing 브리지, W1 §11-1 패턴) → grid-pro-chart(react peer) 의존 회피=Vue 가 React 상속 안 함.
- **grid-pro-chart-enterprise@0.3.0 재배선**: `internal/matrixToEChartsOption.ts`+test **삭제**, index/Panel/Renderer 가 `@topgrid/grid-chart-core` 에서 import(re-export shim). dep `grid-chart-core: workspace:*` 추가. **공개 표면 무변경**.
- 검증: core(node 18·typecheck0·build) + enterprise(typecheck0·build) + **chromium 7 green=byte-identical**(추출이 React 행위 무변경 입증, fork 없음) + `pnpm build` 전패키지 green.
- **lockstep 발행**(topo): grid-chart-core@0.1.0 → grid-pro-chart-enterprise@0.3.0(core@0.1.0 구체핀). pack 검증=core deps {}·enterprise core 핀·누출 0.
- ★**스모크 핵심 성과**: `npm i @topgrid/grid-pro-chart-enterprise echarts`=**echarts 6.1.0 deduped**(top-level + enterprise + chart-core 가 **단일 echarts 인스턴스** 공유) → ADR-003 D3 "소비자 단일 인스턴스" + ADR-004(중립 코어) 의도 **실코드 실증**. 취약점 0·ERESOLVE 0.

#### ★다음 = 증분② Vue 컴포넌트 → §3-12 에서 완료

### 3-12. ADR-004 증분② — Vue 엔터프라이즈 차트 (2026-06-19, ✅ W1×W2 시너지 실증)

> 동일 `grid-chart-core` 엔진이 이제 **React(chromium) + Vue(happy-dom) 양쪽 구동**. Phase 0 가설(framework-agnostic 코어 공유)이 차트에서도 실코드 입증.

#### 한 것
- **신규 `@topgrid/grid-pro-chart-enterprise-vue@0.1.0`**: grid-vue 식 Vue 렌더 셸. `EChartsChart`(defineComponent+h, `echarts.init({renderer:'svg'})`=onMounted, setOption=watch(option), dispose=onBeforeUnmount, ResizeObserver 가드)·`EnterpriseChartPanel`(툴바 타입스위처·export `exportImage`·cross-filter). **엔진은 grid-chart-core `matrixToEChartsOption` 그대로 재사용**(0 복제) — React 패키지와 동일 option-builder.
- ★**zero-React 확정**: `pnpm why react`=빈 결과. ADR-004 의 중립 코어 추출이 Vue 의 React 비결합을 실제로 샀음.
- echarts.use() 모듈 등록은 Vue 셸에 중복(grid-chart-core 는 echarts-runtime-free 유지 위해; 등록=설정이지 로직 아님, 렌더 셸은 본질적 프레임워크별).
- ★**license 게이트 = 주입 `watermark` prop**(grid-license 미import — react peer 누출 회피, ADR-004 일관). 자동 게이트는 neutral license-core 추출 후속(미실행, 정직 범위).

#### 검증 (전부 green)
- **happy-dom live mount node 8 passed**(grid-vue 패턴, dist 경유): 실제 mount→인라인 `<svg>`·rendered-type 'bar'·**툴바 bar→pie 클릭이 ECharts 인스턴스 도달**(`data-rendered-type` flip=non-vacuous, stale 옵션이면 실패)·export SVG dataURL>100·watermark prop 게이트. ★happy-dom=클라이언트 layout 0 → echarts.init 에 명시 width/height 전달로 렌더 보장(SSR 함정 회피).
- typecheck0(skipLibCheck=echarts .d.ts)·build green·`pnpm build` 전패키지 green.
- pack: deps=grid-chart-core@0.1.0 핀(라이브)·peer echarts+vue·누출0. **발행 준비 완료(user-gated 미실행)**.

#### ★마일스톤: W2 차트 멀티프레임워크 완성
동일 엔진(grid-chart-core 17타입) → React(`grid-pro-chart-enterprise@0.3.0` npm live, chromium 7) + Vue(`grid-pro-chart-enterprise-vue@0.1.0` 발행대기, node 8 live). **W1(grid·grid-vue) + W2(차트) 둘 다 "framework-neutral 코어 + 얇은 어댑터" 구조 일관.**

---

## 4. W3 — React 정식 제품화 (DX)

> 현재 topgrid 는 이미 React 지만 **저수준**(소비자가 TanStack column/table 지식 필요, `{id,name,type}` 컬럼 포맷 등 함정 존재 — cf. 스토리 포맷 버그 이력). "React 적용"은 **신규 프레임워크 작업이 아니라**, ①W1 의 React-어댑터 재구성 + ②제품 DX 폴리시다.

### 4-1. 범위
- **W1 내포분**: headless 코어 위 React 어댑터 재구성(§2).
- **추가 DX(이 항목 고유)**: 고수준 선언적 컴포넌트 API(TanStack 노출 최소화), 타입 안전 컬럼 빌더, 입문 문서/레시피, 예제 앱, 마이그레이션 가이드, SSR/Next.js 가이드.
- 단계: 분석(현 DX 마찰점 수집) → 스펙(공개 API) → 구현 → 검증(예제+문서 빌드 게이트).

### 4-2. ROM
- W1 React-어댑터에 내포 + **추가 DX ≈ 0.5~1개월**.

---

## 5. PTLPSM — W1 으로 흡수 (별개 트랙 폐기, 2026-06-16 사용자 결정)

★**사용자 결정: PTLPSM 임시 트랙 제외.** PTLPSM(Nuxt3/Vue3)은 Vue 전용이므로 **W1 의 Vue 전용 라이브러리가 곧 PTLPSM 해법**이다. 임시 우회(React 아일랜드 / 타사 Vue 그리드)는 **채택 안 함** — W1 Vue 어댑터 산출물을 그대로 PTLPSM 통계 화면에 적용한다.
- 함의: W1 의 Vue 어댑터 우선순위·요구사항에 **PTLPSM 통계 화면(그래프·그리드) 유스케이스를 1차 소비자로 반영**(스펙 단계 입력).

---

## 6. 잔여 작업 (기존 백로그) — 통합 참조

> 신규 W1~W3 와 **별개**이며, 규모상 W1~W3 가 압도. 상세 = `REMAINING-WORK.md` HANDOFF / COMMERCIAL-GAP / state.json (재-derive 금지, 그쪽이 canonical).

- **상태**: ✅248 / 🟡73 / ❌6 / ➖3. buildable+verifiable 기능 백로그 **소진**.
- **A. 사용자 게이트 잔여**: 로컬 미푸시 커밋(harden·DEPLOY·storybook 링크), 배포 권한 절차(해결됨), favicon 404(경미).
- **B. by-design floor ❌6(영구)**: RTL·post-sort·debounced-scroll·row-animation·auto-virt + Excel cell styles.
- **C. vN 심화(강제금지)**: merge-aware 편집·실 PDF chromium·range-adjust handles 등.
- **D. 인프라 제안(미자동)**: pretest hook·test CI job·TypeDoc /api·retries 하향.

---

## 7. 하이어라키 매트릭스 (우선순위 × 의존성 × ROM)

| 순위 | 항목 | 유형 | 선행 의존 | ROM(1 시니어) | 비고 |
|------|------|------|-----------|---------------|------|
| **P0** | **W1 ①분석 + ③PoC (키스톤·임계경로)** | 신규 big rock | 없음(최우선) | 5~7주 | ★전체 Vue 약속의 미검증 가정을 버리는-스파이크로 실증. PoC 슬라이스 = PTLPSM 통계-그리드 형태 |
| P0 | W2 ①라이브러리 평가 (저비용 병렬) | 신규 | 없음(독립) | 1~2주 | 임계경로 아님, 병렬 가능 |
| P1 | **W1 Phase 0 — headless 코어 추출** | 신규 big rock | W1 PoC 통과 | 6~10주 | Vue·엔터프라이즈Vue차트의 공통 관문 |
| P1 | W1 — React 어댑터 재구성 | 신규 | W1 Phase 0 | 3~5주 | W3 내포 |
| P2 | W1 — Vue 어댑터 (= PTLPSM 해법) | 신규 | W1 Phase 0 | 8~14주 | 하드 4패키지가 비용 중심 |
| P2 | **W2 — 엔터프라이즈 차트(integrate)** | 신규 big rock | (React만)독립 / (Vue)W1 P0 | 6~10주 | ECharts/AG Charts wrap, opt-in |
| P3 | W3 — React DX 폴리시 | 신규 | W1 React 어댑터 | 2~4주 | API·문서·예제 |
| P4 | B/C/D 잔여 백로그 | 기존 floor | — | 소 | §6, 대부분 by-design/사용자결정 |

★**권장 실행 순서(advisor)**: **W1 ①분석+③PoC 가 키스톤(먼저)** — 버리는-스파이크로 핵심 가정 실증 후에야 추정치·Vue 약속이 근거를 얻는다. W2 라이브러리 평가는 저비용·독립이라 병렬로 끼우되 임계경로를 밀어내지 않는다. PoC 통과 → Phase 0 → React 재구성 ∥ Vue(=PTLPSM 해법) → W2 → W3 DX.

---

## 8. 가정·리스크·다음 액션

### 가정
- ROM 전부 1 시니어 풀타임 기준, 디자인/QA/PM 제외, 발행 인프라 기존 재사용.
- ★**ROM 은 ①분석·③PoC 의 산출물로 ±50% 보정 전제** — 본 문서 수치는 착수 결정용 예비치이지 일정 약속 아님.

### 리스크 (상위)
1. grid-core headless 추출 회귀(가상화/키보드/드래그) — 기존 122 chromium suite 가 안전망.
2. Vue 반응성 ↔ headless 상태머신 동기화 — PoC 핵심 미지수.
3. 차트 라이브러리 라이선스/번들/SSR 적합성 — 평가 단계서 확정.
4. 멀티프레임워크 발행 그래프 복잡도 증가(exact-pin lockstep 이력 cf. [[npm-publish-topgrid]]).

### 다음 액션 (방향 확정 2026-06-16 — advisor 위임)
- **(착수) W1 ①분석 + ③PoC = 키스톤·임계경로**. 버리는-스파이크로 make-or-break(grid-core ~148 훅 디커플 + Vue 반응성↔headless 동기화) 실증. PoC 성공 타깃 = **PTLPSM 통계-그리드 형태의 수직 슬라이스**(§9 분석 산출물 참조).
- **(병렬·저비용) W2 ①라이브러리 평가** — 독립, 임계경로 아님.
- PTLPSM 임시 트랙 = 폐기(§5, W1 로 흡수).
- 본 로드맵은 dev-harness 루프(spec→implement→verify)와 호환 — 각 워크스트림을 MOD 모듈로 분해해 진행. **W1 ①분석 상세 = §9.**

---

## 9. W1 ①분석 산출물 — grid-core 디커플 인벤토리 + PoC 스파이크 스펙 (착수, 2026-06-16)

> 방향 확정에 따른 키스톤 분석. 코드 실측(grid-core/src). ★본 분석의 목적 = **make-or-break 가정을 PoC 스파이크로 좁혀** 정의하는 것이지, 추정치를 확정 약속으로 만드는 게 아님.

### 9-1. grid-core 커스텀 훅 16종 — 디커플 분류
| 훅 | 성격 | 디커플 전략 | 등급 |
|----|------|-----------|------|
| `useGridState` | ★코어 상태머신 배선(8 슬라이스, useState/useRef 다수) | 상태 전이 로직을 **순수 reducer 로 추출** → React/Vue 각자 반응성으로 구동 | **HARD(키스톤)** |
| `useControllableState` | controlled/uncontrolled 패턴 | 패턴 자체는 양 프레임워크 공통 개념, 각자 재구현(소형) | MEDIUM |
| `useGridVirtualizer`·`useColumnVirtualizer` | react-virtual 바인딩 | `@tanstack/virtual-core` 위 → React=react-virtual / Vue=`@tanstack/vue-virtual` | MEDIUM |
| `useColumnDrag` | DOM 드래그 이벤트 | 순수 계산(reorderColumnOrder 이미 추출됨) + 프레임워크별 이벤트 바인딩 얇게 | MEDIUM |
| `useAutoPageSize` | ResizeObserver | 옵저버 로직 이식 가능(프레임워크 무관 API), 얇은 래퍼 | EASY |
| `useColumnPersistence`·`useColumnOrderPersist`·`useStoragePersist`·`useViewStatePersistence`·`useUrlSync` | 영속(직렬화 + storage/effect) | 직렬화는 이미 순수(serializeViewState 등) → effect 부분만 프레임워크별 | EASY |
| `useFullRowEdit` | 행 편집 상태 | applyRowDraft 순수 추출됨 → 상태 보관만 프레임워크별 | EASY |
| `useGridImperativeHandle` | React ref 핸들 | Vue=`defineExpose`/expose 로 대응 | MEDIUM |
| `useDebouncedCallback`·`useDeprecationWarn`·`useAutoSelectFirstRow` | 유틸/effect | 사소, 각자 재구현 | EASY |

★**핵심 비용은 `useGridState` 하나**(나머지는 EASY/MEDIUM). React 훅 사용 총계: useState 50·useRef 46·useEffect 44·useCallback 27·useMemo 2.

### 9-2. TanStack 디커플 매핑
- 현재: `useReactTable`(11 파일) = `table-core`의 `createTable` + React 상태배선. `flexRender` = React 셀 렌더.
- 목표: **`@tanstack/table-core`의 `createTable` + 프레임워크 무관 옵션빌더**(현 `buildTableOptions` 가 좋은 출발점) → React=`useReactTable`/`flexRender`, Vue=`useVueTable`/Vue `FlexRender`.
- row-model(`getCoreRowModel` 등)·타입(`SortingState` 등)은 table-core 재export → **그대로 공유**.

### 9-3. PoC 스파이크 스펙 (버리는 코드, make-or-break 전용)
- **범위(최소 수직 슬라이스)**: data + columns + **정렬 + 필터**만. 가상화/피닝/편집 **제외**(스파이크 목적은 아키텍처 가정 검증).
- **할 일**: `buildTableOptions` + 상태를 headless 모듈(table-core)로 추출 → 동일 코어를 **React 와 Vue 양쪽에서 렌더+정렬+필터** 입증.
- **성공 타깃(advisor)**: PTLPSM 통계-그리드 형태 = **정렬·필터되는 데이터 그리드**(+ 단순 차트 바인딩 = W2 접점). 토이 아니라 **PTLPSM 최초 마일스톤으로 바로 쓸 수 있는** 형태.
  - ※ PTLPSM 실제 통계 화면 컬럼/데이터 형태 = **별도 워크스페이스(D:\dev\lpsystem) 조사 필요** → 스펙 입력. 미확보 시 일반 통계 그리드(집계 행·다컬럼·정렬/필터)로 대체 정의.
- **결정 게이트**: ① headless 추출이 grid-core 핵심 동작 보존? ② **Vue 반응성(ref/reactive)이 headless 상태머신과 깨끗이 동기화?**(최대 미지수). 둘 다 통과 → Phase 0 본착수. 실패 → Vue 약속·ROM 재스코프(정직 재평가).
- **검증**: 동일 node 로직 테스트 양쪽 공유 + React/Vue 각 렌더 동작.

### 9-4. 이 분석으로 좁혀진 것
- Vue 난이도 = "from-scratch"가 아니라 **`useGridState` 디커플 + 하드4 composable 재작성**으로 국소화 확인.
- 다음 실행 단위 = **PoC 스파이크 구현**(위 9-3). → **§10 에서 실행·통과**.

---

## 10. W1 ③PoC 스파이크 결과 — make-or-break 가정 실증 (2026-06-16, ✅ PASS)

> 위치: `spikes/headless-vue-poc/`(워크스페이스 밖 격리, 버리는 코드). `@tanstack/table-core 8.21.3` + `@tanstack/vue-table` + `@tanstack/react-table` + `vue3` 격리 설치. **실제 실행으로 검증**(LESS-006: "보임"식 금지, node 실행).

### 10-1. 게이트 판정
| 게이트 | 검증 내용 | 결과 |
|--------|----------|------|
| **①** | render 함수 없는 **동일 `columnData` + table-core row model** 을 React(`useReactTable`)/Vue(`useVueTable`) 양쪽이 소비 → 정렬·필터 결과 **동일** | ✅ PASS |
| **②(make-or-break)** | **`table.setSorting()/setColumnFilters()`**(테이블 API → onChange→ref 라운드트립) 변경 시, **`watchEffect` 로 구독한 row model 이 재실행(effectRuns 1→2)되어 갱신** = Vue 반응성 ↔ headless 상태머신 **반응형** 동기화 | ✅ PASS |

실측(양쪽 동일): `afterSort=[부산,인천,서울,광주,대구]`(매출 desc, 동률 안정정렬) · `afterFilter=[광주]`. 게이트② `effectRuns 1→2`(반응형 재실행 입증). 재현: `cd spikes/headless-vue-poc && node src/gate1-react.mjs && node src/gate2-vue.mjs`.

★**정직 기록(게이트② 강화 경위, advisor 적발)**: 최초 게이트②는 ref 변경 *직후 동기적으로* `getRowModel()` 을 읽었는데 — 이는 table-core **메모이제이션+게터**만 검증한 것이지 Vue 반응성이 아니었음(판별: `ref`→plain object 로 바꿔도 통과, `gate2-discriminator.mjs` 가 ⚠️로 실증). → **watchEffect 구독 + `table.setSorting()` 라운드트립 + `nextTick`** 으로 정정해 *진짜* 반응성(effect 재실행)을 검증. over-claim 직전 시정.

### 10-2. 입증된 것 (논지 검증)
- **데이터/행위 레이어(정렬·필터·row model)는 프레임워크 무관 = 한 곳에서 공유 가능.** 프레임워크별로 다른 건 **렌더(cell/header)뿐**임을 실증(columnData 에 render 0).
- **Vue 반응성이 headless 상태머신과 깨끗이 동기화** — react-table 과 동일한 `get state / onChange` 옵션 패턴으로 성립. **W1 의 최대 미지수(§2-4 리스크#2) 해소.**
- 패턴: `useVueTable({ get data, get columns, state:{get sorting(){return ref.value}}, onSortingChange })` + `effectScope`.

### 10-3. 입증 안 된 것 (정직한 범위 한계 — over-claim 방지)
- **렌더 레이어 미포팅**: cell/header 의 .tsx→.vue 변환은 별도(알려진) 작업, 본 스파이크 범위 아님.
- **가상화 미실행**: `@tanstack/vue-virtual` 연동 미검증(슬라이스서 제외).
- **grid-core 전체 `useGridState` 디커플·하드4(features/master/range) 미착수**: 본 슬라이스는 최소(정렬+필터)만.
- 스파이크는 **버리는 코드**(프로덕션 아님).

### 10-4. 함의
- W1 리스크 프로필: **"feasibility 미지"→"known engineering"** 으로 전환. 핵심 아키텍처 가정이 실코드로 확인됨.
- §2-3 ROM(5~8개월)은 **신뢰도 상승하나 여전히 ROM** — 비용 중심은 이제 (검증된 미지수가 아니라) **렌더 포팅 + 하드4 hook 재작성**의 분량.
- **다음 단위 = W1 Phase 0 본착수**: `buildTableOptions`+상태를 실제 `@topgrid/grid-core-headless`(table-core) 패키지로 추출 → React 어댑터 재구성 ∥ Vue 어댑터. (PTLPSM 통계-그리드 형태를 Vue 어댑터 1차 마일스톤으로.) → **§11 에서 1차 증분 완료**.

---

## 11. W1 Phase 0 — `@topgrid/grid-core-headless` 추출 1차 증분 (2026-06-16, ✅ 완료·검증)

> advisor 안전 순서(①격리 빌드 → ②재배선 → ③suite green → 원본 삭제) 그대로 실행. **복사본 없음**(원본 로직 이동, fork 회피).

### 11-1. 한 것
- **신규 패키지 `@topgrid/grid-core-headless`**(table-core 기반, React 의존 0): `buildTableOptions`·`buildPaginationOptions`·`normalizeSelection` + 계약 타입(`TableOptionsInput`/`GridStateBag`/`BuildOptionsResult`/`HeadlessRowSelectionOptions`/`HeadlessPaginationOptions`) 추출. import 를 `@tanstack/react-table`→`@tanstack/table-core`(동일 심볼=동일 인스턴스, 런타임 무변). 유일 React 결합 `createCheckboxColumn` 은 **팩토리 주입**(`CreateSelectionColumn`), selection 정규화+prepend 정책은 headless 에 순수 유지.
- **grid-core 재배선**: `internal/buildTableOptions.ts` 를 **13줄 thin 어댑터**로 교체(headless 위임 + React 체크박스 주입, 2-arg API 보존 → 유일 호출부 `Grid.tsx:129` 무수정). `internal/buildPaginationOptions.ts` **삭제**(orphan). grid-core `dependencies` 에 `@topgrid/grid-core-headless: workspace:*` 추가.
- **구조적 타이핑 브리지**: grid-core 의 React `GridProps<TData>` 가 headless `TableOptionsInput<TData>` 를 구조적으로 만족 → grid-core/types.ts·다른 importer **무수정**(blast radius=grid-core 내부 2파일).

### 11-2. 검증 (전부 green)
- headless 격리: typecheck 0 / build 0 / **node characterization 27 passed**(flag→키 존재·effectiveColumns.length·selectionMode·pagination shape; deep-equal 회피=함수 인스턴스).
- 전체: `pnpm build` 직렬 topo **전 패키지 green**(headless→grid-core→…→facade grid@0.9.0) · `pnpm -r test` **EXIT 0**(headless 27 + grid-core 전부) · **chromium full suite 122/122 green**(=행위 패리티 게이트, 재배선 byte-identical 입증).
- ★**fork 없음**: 원본 매핑 로직은 headless 로 *이동*(복사 아님), grid-core 는 위임만. 단일 진실원천.

### 11-3. 남은 것 (다음 증분)
- 하드4(features/master/range)·렌더 레이어(.tsx→.vue)·Vue 어댑터 신규.
- ★**발행 함의**(user gate): grid-core 가 이제 `@topgrid/grid-core-headless` 런타임 의존 → 발행 시 headless 선발행 + exact-pin lockstep([[npm-publish-topgrid]]). 발행은 미실행(사용자 게이트).

### 11-6. 옵션1 하드4 디커플 — 증분 1a: grid-features filterFns 추출 (2026-06-17, ✅)
> 사용자 1→2→3 순 autonomous(advisor 위임). 옵션1=features→master→range 순 멀티증분. ★정직: "filter predicate 함수 추출; filter UI 는 React 잔류"(grid-features 디커플 아님). 1→2 시너지: 추출된 filterFns 를 옵션2(Vue 필터)가 공유 소비 가능.
- **headless `filter.ts`**: `textFilterFn`/`numberFilterFn`/`dateRangeFilterFn`/`selectFilterFn` + 순수 값/연산자 타입(TextFilterValue·NumberFilterValue·DateFilterValue·*Operator) 이관. import react-table→table-core. **date-fns 의존 추가**(dateRangeFilterFn). node **filterFns 13 characterization**.
- **grid-features 재배선**: `filter-ui/filterFns.ts`→headless re-export shim; `filter-ui/types.ts`→순수 5타입 headless import+re-export(React prop 타입은 잔류, ★혼합 types 파일 분리); package.json headless peer+devDep. ★cross-package 소비자 **grid-pro-filter**(패키지 루트 경유)=무수정 typecheck green.
- 검증: grid-features+grid-pro-filter typecheck 0 / `pnpm build` 전패키지 green / `pnpm -r test` EXIT0(headless 13) / **chromium 122 green**(121+1 retry-흡수 flake=기존 master-detail-virt, 무관). ★fork 없음.
- ★**grid-features 헤드리스 표면 소진 확정**(advisor): filterFns 외 잔여는 추출 부적합 — buildConditionalFormat=grid-core 콜백 글루(framework-neutral 아님), useMultiSort=marginal 40줄 헬퍼(Grid 미사용, defer), column-drag=이미 grid-core 이전됨.

#### 증분 1b: grid-pro-range 순수 코어 추출 (2026-06-17, ✅ 122 green, 0 flaky)
- master/range 스카우트(purity+consumer grep) 결과: **grid-pro-range 에 real pure core 존재**(advisor 예측 적중=range math). headless `range.ts`=normalizeRange·isInRange·detectSeriesStep·fillRange·stringifyTsv·parseTsv + 순수 타입(CellCoord·CellRange·CellUpdate·FillDirection). node **10 characterization**(역방향 정규화·등차 fill·비수치 modulo[기존 동작 보존, 내 기대 교정]·TSV RFC4180 roundtrip).
- grid-pro-range 재배선: internal/normalize·fillRange·tsvUtils→re-export shim, types.ts→4타입 import+re-export(React hook 잔류), headless dep. ★cross-package 소비자 **없음**(전부 내부). 검증: typecheck 0/build green/node EXIT0/chromium 122 green(grid-pro-range reuse 테스트 포함). fork 없음.
- ★**옵션1 disposition(advisor discriminating outcome)**: 의미있는 헤드리스 추출 코어 = **filterFns(1a) + range math(1b) 로 사실상 소진**. 잔여 grid-pro-master 순수=clipboard/makeExportItem(소형, grid-export 글루). **master/range 의 bulk(master 41 hooks·range 73 hooks=selection rect·drag·master-detail 조정)는 inherently React interaction → Vue 용으로 *재작성*(추출 아님)=옵션2형 작업.** → 다음은 grid-pro-master 소형 순수(선택) 후 **옵션2(grid-vue 기능확대/master·range Vue 컴포넌트)로 전환이 자연스러움**(사용자 결정: 옵션1 더 짜낼지 vs 옵션2 진입).

### 11-6b. 옵션1 마무리 — 증분 1c: clipboard 추출 (2026-06-17, ✅ 122 green)
- headless `clipboard.ts`=`cellValueToClipboardText`(null/object/primitive 매핑) 이관, node 7. grid-pro-master internal/clipboard.ts→re-export shim. ★`makeExportItem`=grid-export+ContextMenuItem 글루→**추출 안 함**(disposition). 검증: typecheck0/build/node/chromium 122 green 0 flaky.
- ★**옵션1 추출 표면 완전 소진**: filterFns(1a)+range math(1b)+clipboard(1c). master/range bulk=React interaction→옵션2형.

### 11-7. 옵션2 — grid-vue 기능 확대: 필터 (2026-06-17, ✅ 1→2 시너지 실현)
> 사용자 "둘 다 진행"(옵션1 마무리 + 옵션2 진입).
- grid-vue `<Grid>` `enableFilter` prop + 필터 입력행. 입력→`column.setFilterValue`→onColumnFiltersChange→ref→getFilteredRowModel 재계산→DOM 행 live 필터. 컬럼 `filterFn` 으로 **★옵션1(1a) 추출 headless `textFilterFn` 을 Vue 가 그대로 소비** = 1→2 시너지 실증. index 에서 headless filterFns/range/clipboard 재export(Vue 편의).
- 검증(live DOM, SSR 아님): mount + 필터 input '부' → 3행→1행(부산) live. grid-vue node **9 passed**(정렬 클릭+selection 시임+필터). typecheck0(★setup-happydom=테스트인프라 tsc 제외, happy-dom NodeJS 타입 회피)/build/`pnpm -r test` green.
- ★범위: text 필터만.

#### 옵션2 — grid-vue 범위 선택 (2026-06-17, ✅ 1b→2 시너지)
- grid-vue `enableRangeSelection` prop: 클릭=앵커, shift+클릭=범위 확장. 선택 셀=★1b 추출 headless `normalizeRange`/`isInRange` 로 data-selected 표시(반응형). **filterFns(1a→2)+range math(1b→2) 둘 다 Vue 가 소비** = headless 추출↔소비 양방향 완결.
- 검증(live DOM): mount + 클릭(0,0)+shift(1,1) → 4셀 live 선택. grid-vue node **10 passed**(정렬+selection 시임+필터+범위선택). 커밋 `ec1124a`.
- ★범위: 클릭 범위선택만.

#### 옵션2 — grid-vue 드래그-fill (2026-06-17, ✅ 1b 순수 코어 전부 활용)
- grid-vue 가 headless `fillRange` 를 호출: 범위 선택 후 fill 핸들 mousedown → 아래 대상 셀 클릭 → fillRange 등차/순환 계산 → 변경가능 데이터 복사본 적용. **filterFns(1a) + normalizeRange/isInRange + fillRange(1b) 전부 grid-vue 가 가져다 씀** = 추출한 headless 순수 코어 완전 활용.
- ★통합 발견: vue-table `getRowModel` 은 data **참조** 기준 메모 → 배열 인덱스 in-place 할당은 재계산 안 됨 → **새 배열로 교체(참조 변경)** 해야 재렌더.
- 검증(live DOM): 선택 [10,20] → 핸들 mousedown → 대상 클릭 → rows 30,40(등차) live. grid-vue node **12 passed**. 커밋 `89c1621`.
- ★용어: "소비(consume)" 대신 "호출/가져다 씀/사용"(사용자 피드백 [[communication-precise-terms]]).

#### 옵션2 — grid-vue pagination (2026-06-17, ✅, 커밋 5607cb9)
- grid-vue `enablePagination`+`pageSize`. headless `buildTableOptions` 가 enablePagination 시 getPaginationRowModel 배선→`table.getRowModel()`=현재 페이지만. 이전/다음 버튼=table API. 검증(live): pageSize 2+5행→page0[1,2], 다음→page1[3,4], 1/3→2/3. grid-vue node **16 passed**.

### 11-8. 옵션3 — React 어댑터 headless 정렬: disposition (2026-06-17, ✅ 이미 정렬됨)
> advisor: 옵션3 = "React 어댑터가 공유 headless 코어 위에 있나?" → **이미 완료·검증됨**, 24-모듈 백로그 아님. 판정 테스트="현재 비-React 소비자가 실제로 그 모듈을 호출하나?" — grid-vue pagination 은 getPaginationRowModel 만 쓰고 clampGoToPage/computeAutoPageSize 는 안 씀=소비자 0 → 추출=YAGNI(1a/1b/1c 는 Vue 기능이 실제로 쓸 때만 옮겼음).
- **확인됨**: grid-core·grid-features·grid-pro-range·grid-pro-master 전부 `@topgrid/grid-core-headless` 의존 선언; shim(filterFns·normalize·fillRange·tsvUtils·clipboard) 로컬 정의 0=순수 re-export; grid-core buildTableOptions=13줄 thin 어댑터(중복 아님). React 코어 흐름(buildTableOptions·useGridState defaults/reset·filterFns/range/clipboard)이 headless 경유, **chromium 122 green = React 어댑터가 공유 코어 위에서 동작 증명**.
- **grid-core 잔여 ~24 순수 모듈**(moveRow·sortNulls·viewStateEnvelope·transaction·applyRowDraft·computeColumnWindow·clampGoToPage 등)=**fork 아님**(grid-vue 가 그 기능 없어 중복 0). **extract-on-demand**(Vue 기능이 필요로 할 때 1a/1b/1c 패턴으로 이관). 지금 24개 추출=소비자 없는 투기적 작업(거부).
- ★(b) 커널(사용자 결정 사항, 자율 진행 금지): "headless=완전한 framework-agnostic 단일 진실원천" 을 제품 목표로 삼으면 24개가 결국 이관되나, 비용(24 shim+lockstep 재발행) 보고 사용자가 명시 결정.

### ★★ 마일스톤: 옵션 1·2·3 실질 완료 (2026-06-17) ★★
> 동일 headless 코어가 **React(grid-core, chromium 122 green) + Vue(grid-vue, sort/select/filter/range/fill/pagination, node 16 live)** 양쪽 구동. Phase 0 가설(framework-agnostic 코어 공유) 실코드 완전 입증.
> **남은 것 = "마무리"가 아니라 신규 大워크스트림**: (1) Vue master/detail+range **완전 컴포넌트**(옵션2형, 대형) (2) **W2 엔터프라이즈 차트**(ECharts/AG Charts integrate, 미착수) (3) **발행 게이트**(★`@topgrid/grid-core-headless`+`grid-vue` npm 미발행 → PTLPSM 등 아무도 못 씀, user-gated). → 사용자 결정 사항.

### 11-9. W1 발행 배치 — 6개 npm 발행 (2026-06-18, ✅ live·스모크 통과) ★발행 게이트 해소
> 사용자 승인(AskUserQuestion "6개 전부 발행"). 위 마일스톤 (3) 발행 게이트를 해소 — `@topgrid/grid-core-headless`+`grid-vue` 가 이제 npm 에 존재 → PTLPSM 등 외부 소비 가능.
- **발행물(6)**: grid-core-headless@**0.1.0**(신규)·grid-vue@**0.1.0**(신규)·grid-core@**0.6.0**·grid-features@**0.9.0**·grid-pro-range@**0.4.0**·grid-pro-master@**0.7.0**. publisher=travia71, Bypass-2FA 토큰=비대화형 통과(OTP 프롬프트 0).
- **절차(전 단계 green)**: ①수동 bump 4개(★`changeset version` 미사용=peerDep major-escalation 함정 회피 [[changeset-peerdep-major-escalation]]) ②`pnpm build` 전패키지 green ③`pnpm -r test` EXIT0(grid-vue 16 live·headless·grid-core·master 전부) ④**`pnpm pack` ×6 tarball 검증**: workspace:* 전부 구체핀 치환·누출 0(grid-vue/core→headless@0.1.0 배치내, features peerDep→grid-core@0.6.0, master→export@0.6.0·license@0.3.0 기존npm) — ★`pnpm pack`(not npm pack=workspace 미치환) ⑤**topo 발행**: headless→grid-core→(features,range,master)→grid-vue, 각 `pnpm publish <dir> --no-git-checks --access public`(★`pnpm -C <dir> publish` 는 `--no-git-checks` 를 npm 으로 잘못 forward=EUSAGE; **positional dir 형식이 정답**).
- **소비자 스모크(npm live)**: 새 폴더 `npm i @topgrid/grid-vue vue @tanstack/vue-table` → 28 packages, **ERESOLVE 0**, 취약점 0. `npm ls`=grid-vue@0.1.0→grid-core-headless@0.1.0 라이브 registry 해소 확인.
- **알려진 한계(수용)**: facade `@topgrid/grid` 은 배치 밖=옛 grid-core@0.5.0 핀 유지(npm 존재→정상). 완전정합(21-lockstep)은 사용자 미선택=부분 재발행의 알려진 한계. [[npm-publish-topgrid]].
- ★**다음 = W2 엔터프라이즈 차트 착수**(§3): integrate 경로, 첫 단계=라이브러리 평가(ECharts/AG Charts/Highcharts).

### 11-5. Vue 어댑터 스켈레톤 3차 증분 (2026-06-17, ✅ 완료·검증)
> ★범위(정직): "minimal Vue 어댑터가 **실제** headless 코어 소비; 정렬-via-클릭을 mounted DOM 에서 입증; selection 주입 시임 동작. 프로덕션 완성 아님 — filter/pin/virt/pagination/editing·하드4 미포함."
- **신규 `@topgrid/grid-vue`**(packages/grid-vue): Vue 3 `<Grid>`(defineComponent+h, SFC 아님) = `@topgrid/grid-core-headless` `buildTableOptions` + `@tanstack/vue-table` `useVueTable` 소비. Vue 체크박스 컬럼 팩토리(`createVueCheckboxColumn`)=headless `CreateSelectionColumn` 시임의 Vue 구현.
- ★**통합 시임 발견(스켈레톤이 드러낸 진짜 학습)**: headless `buildTableOptions.options.state` 는 **eager 스냅샷**(React=매 render 재호출이라 무방). Vue(setup 1회)에선 얼어붙으므로 **`state` 만 Vue 반응형 getter 로 오버라이드**. 나머지(row models·enable 플래그·onChange 핸들러·selection 주입)는 headless **그대로 재사용**=진짜 공유. → 후속 headless 정제 후보(state-building 분리 노출).
- **검증(advisor 비협상=live DOM)**: happy-dom **실제 mount + 헤더 클릭 + DOM 행 재정렬 단언**(SSR 금지=gate-2 함정류). node **6 passed**(before→1st click desc→2nd click asc, 전부 다름=live 반응성; ★숫자 컬럼 첫 클릭 desc=TanStack sortDescFirst 휴리스틱, 실측이 기대 교정) + selection 시임(행마다 체크박스). + `pnpm build` 전패키지 green(grid-vue 통합).
- ★**zero-React 확정**(아키텍처 증명): `pnpm why react`=빈 결과, `@topgrid/grid-core` 없음(headless 만). Phase 0 분리가 프레임워크 독립을 실제로 샀음.
- 다음: 하드4(features/master/range) 디커플 → Vue 어댑터에 기능 확대(filter/selection live/pin), 또는 React 어댑터를 동일 headless 위로 정렬.

### 11-4. useGridState 디커플 2차 증분 (2026-06-17, ✅ 완료·검증)
> ★**정직 범위**: 반응성(useState/ref)은 추출 *안 함*=프레임워크별 by design. headless 로 옮긴 건 **state 형상 계약 + 기본값(단일 진실원천) + reset 값 계산(순수)** 뿐. "useGridState 디커플"이 아니라 "state-shape/reset 로직 추출".
- **headless 추가**(`gridState.ts`): `GridStateValues`/`GridStateKey` 타입 + `GRID_STATE_KEYS` + `DEFAULT_GRID_STATE_VALUES`(단일 진실원천) + 순수 `resolveResetValues(keys,initialState)`(Set dedup·unknown no-op·`initial??DEFAULT`). node **resolveResetValues 7 passed**(deep-equal, plain data).
- **grid-core 재배선**: `types.ts` 가 `GridStateValues`/`GridStateKey` 를 headless 에서 import+re-export(소비처 8파일 모두 `'./types'` 경유 → 무수정). `useGridState.ts`: 로컬 DEFAULT 상수 제거→headless import, **inline 초기값 8곳도 공유 상수 경유**(초기·reset 기본값 단일화=advisor (a)), resetState 8줄+resetSection switch 중복 → `resolveResetValues`+`applyReset`(setter 디스패치만 React) 로 dedupe.
- 검증: grid-core typecheck 0 / `pnpm build` 전패키지 green / `pnpm -r test` EXIT0(headless 27+7) / **chromium 122 green**(121 pass+1 retry-흡수 flake=기존 master-detail-virt react-virtual 타이밍, 본 변경 무관). ★fork 없음.
