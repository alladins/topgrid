# TWGRID 전략 로드맵 — 멀티프레임워크(Vue+React) · 엔터프라이즈 차트 · 잔여작업

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
