---
id: ADR-004
title: Vue 엔터프라이즈 차트 — 순수 ECharts 엔진 위치(framework-neutral 추출 vs 잔류)
module: W2 단계③ follow-up #2 (grid-pro-chart-enterprise-vue)
date: 2026-06-18
status: accepted
related: [ADR-003, "ROADMAP §3-10", "ROADMAP §10/§11(W1 headless)", LESS-005]
---

# ADR-004 — Vue 엔터프라이즈 차트의 순수 엔진 위치: framework-neutral 코어로 추출(extract-on-demand)

## Context
advisor 우선순위 #2 = grid-vue 에도 ECharts 엔터프라이즈 차트 제공([[ROADMAP-MULTIFRAMEWORK-CHART]] §3-10). 순수 `matrixToEChartsOption`(+ `EnterpriseChartType`/`ChartOptionSpec`)는 **이미 framework-agnostic**(echarts·grid-pro-chart 둘 다 type-only, React 런타임 0)이지만 — **물리적으로 `@topgrid/grid-pro-chart-enterprise`(react peerDependency 보유) 안에 있다.** Vue 가 이 엔진을 재사용하려면 위치 결정이 선행한다. ★W1 의 headless 추출(§10/§11: buildTableOptions·filterFns·range·clipboard)과 **동형 문제**.

W1 옵션3 disposition(§11-8)이 세운 규율: **"extract-on-demand — 비-React 소비자가 실제로 그 모듈을 호출할 때 이관."** Vue 엔터프라이즈 차트 = 그 *실제 소비자의 등장*. 따라서 트리거 발동.

## Decision
**순수 차트 엔진을 신규 framework-neutral 패키지 `@topgrid/grid-chart-core` 로 추출**(echarts type-only, react/vue/echarts-runtime 0). `grid-pro-chart-enterprise`(React)는 거기서 re-export(thin shim, 공개 표면 무변경), 신규 `grid-pro-chart-enterprise-vue`(Vue)도 동일 코어를 소비. **렌더 셸(EChartsChart·EnterpriseChartPanel)만 프레임워크별**(React=useEffect, Vue=onMounted/onUnmounted) — W1 §10 의 "데이터/계산 레이어는 공유, 렌더만 프레임워크별" 실증과 일치.

## Rejected
- **(R1) Vue 패키지가 엔진을 복제** — fork. 순수 매핑(타입 카탈로그 17종 reshape)이 2벌 = 수정 시 양쪽 drift. 저장소 single-source-of-truth 에토스 정면 위반(ADR-001/002 계열).
- **(R2) Vue 가 `grid-pro-chart-enterprise` 를 의존(엔진만 쓰려고)** — react/react-dom peerDependency 를 Vue 소비자에게 강제(불필요한 peer 경고·설치 오염). 순수 함수 하나 때문에 React 결합 상속 = 비-surgical. [[LESS-005]] 의 역(시임/경계가 잘못된 패키지에 있음).
- **(R3) 엔진을 `grid-core-headless` 에 합침** — headless 는 table-core(그리드 상태머신) 코어. 차트 매핑(echarts option)은 의미축이 다름(그리드 무관) → 별 패키지가 응집도 높음. (단 검토 가치는 있었음 — 기각 사유=도메인 분리.)

## Trade-offs
1. **신규 중립 패키지(추가 패키지 + 다음 발행 시 lockstep republish) vs single-source + Vue 의 React 결합 0**: 저장소는 이 교환을 W1 에서 **4회 수용**(headless·filterFns·range·clipboard) — 일관. 비용=`grid-chart-core` 발행 + `grid-pro-chart-enterprise` re-export 재배선 후 lockstep 재발행(0.3.0). 이득=엔진 단일원천, Vue 가 echarts+그 코어만(React 0).
2. **렌더 셸 프레임워크별 중복 vs 공유 컴포넌트**: 공유는 **불가능**(렌더는 본질적으로 프레임워크별 — W1 §10-3 이미 실증: cell/header .tsx→.vue 는 별도 작업). 따라서 "중복"이 아니라 **불가피한 프레임워크 경계**. 공유되는 건 엔진(option 빌더)뿐이고 그게 핵심 가치.

## 실행 함의 (이 ADR 가 고정)
- 증분①: `packages/grid-chart-core/` 신규(`matrixToEChartsOption`+타입 이관, node 18 characterization 이동) → `grid-pro-chart-enterprise` 가 re-export shim(공개 표면 byte-identical, chromium 7 재검증) = React 패키지 fork 없음.
- 증분②: `packages/grid-pro-chart-enterprise-vue/` 신규 — Vue `EChartsChart`(defineComponent+h, `echarts.init`/dispose 를 onMounted/onBeforeUnmount, grid-vue 패턴)·`EnterpriseChartPanel` Vue. 검증=grid-vue 식 happy-dom live mount(node) + 가능 시 스토리.
- 발행: `grid-chart-core` 신규 + `grid-pro-chart-enterprise` lockstep(0.3.0) + `grid-pro-chart-enterprise-vue` 신규 = user-gated.

## 컴파운딩 데이터포인트 (하네스 학습)
**extract-on-demand 가 5번째로 발동**(headless 4 + 차트 엔진). 규칙 재확인: framework-neutral 순수 모듈은 *투기적으로* 추출하지 않고(§11-8 옵션3 24모듈 거부), **두 번째 프레임워크 소비자가 실제 등장할 때** 이관. Vue 엔터프라이즈 차트가 그 트리거 — 이때 비로소 `matrixToEChartsOption` 이관이 YAGNI 아님.
