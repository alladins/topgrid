# MOD-GRID-33 — 잡 UX (status-bar 카운트 · loading 오버레이 · row drag)

dev-harness 16번째(차기 로드맵 마지막). 갭분석 Misc UX(status bar/panels/context menu/overlays/row drag,
미구현 7). 대부분 **Community table-stakes**.

## ★ vacuity 함정이 반대 방향 (advisor)
앞 4모듈(필터/pivot/sheet)은 순수 로직 중심이라 spine=알고리즘. **MOD-33 후보는 표현형 UI** — 순수 로직이 적어
위험이 **"비어있지 않음" 식 vacuous chromium**("오버레이 보임"·"tooltip 존재")으로 통과시키는 것. 골마다 **행동/발산
단언**을 못 박는다.

## reuse-gate (LESS-003)
- StatusBar(grid-pro-panel)=prop-driven `items: StatusBarItem[]`(label:value, 소비자 계산). → 내장 카운트는 **items 로
  합성**(컨테이너 fork 금지).
- grid-core `loading=true`→SkeletonRows(tbody 치환, thead 보존, MOD-03 계약). → 오버레이는 **별도 additive prop**.
- `useColumnDrag`(grid-features, HTML5 drag·setData)=column-drag. → row drag 는 그 아날로그(reuse-gate: 재사용 또는 정직 기록).

## Goals
- **G-1 status-bar 내장 카운트(selected/total/filtered) — ★본 라운드**:
  - grid-pro-panel: 내장 카운트 컴포넌트(table 읽기). **★row model 정확**: total=`getCoreRowModel`(필터 전)·
    filtered=`getFilteredRowModel`(필터 후·페이지네이션 전)·selected=`getSelectedRowModel`. 잘못 고르면 조용히 틀림.
  - StatusBar items 로 합성. **순수 로직 0 = browser-only 정직**(floating filter 처럼 node 테스트 지어내지 않음).
  - ★non-vacuous: **필터+선택 동시** 상태에서 total=N·filtered=M(<N)·selected=K **셋 다 발산** 단언(filtered→total
    오배선 버그 검출=G-2 faceted "count 단언" 교훈 재판).
- **G-2 loading 오버레이**:
  - grid-core `loadingOverlay?` additive(기존 `loading`/Skeleton 불변). ★non-vacuous: 오버레이 활성 시 **기존 data 행이
    DOM 잔존**(skeleton 과의 유일 차이)+오버레이 덮음. 역방향: 평범 `loading`=여전히 skeleton(무회귀). +
    **`aria-busy`**(SR 신호)·**pointer-events 하부 차단**(watermark 의 pointer-events-none 와 반대—오버레이는 막아야).
  - browser-only 정직. 검증: chromium.
- **G-3 row drag-and-drop(reorder)**:
  - **순수 `moveRow(rows, from, to)`**(배열 이동, 아래/위 인덱스 보정·no-op·경계)=node spine. draggable 행+drop
    인디케이터=browser. reuse-gate: useColumnDrag 아날로그.
  - **★vN 명시 연기**: (a)가상화 합성(windowed 행 드래그=floating-filter 함정의 row 판)·(b)정렬/필터 활성 reorder
    (정렬-활성 수동 재배열 정의 불가→**비활성** 결정, AG 동형). 검증: node(moveRow) + chromium(드래그→재배열·인디케이터).

## constraints
- **MIT**(G-2 grid-core)·**Pro**(G-1 grid-pro-panel·G-3 위치 미정). 외부 dep 0. C-003. **LESS-006**: G-1/G-2=browser-only
  (순수 로직 0=정직)·G-3=node(moveRow)+browser. 표현형 UI vacuity 회피=행동/발산 단언.

## 의존
grid-pro-panel(G-1)·grid-core(G-2)·grid-core 또는 grid-features(G-3). 신규 외부 dep 0.

## 분류 (MASTER §2)
moveRow=종결형(순수) · 카운트/오버레이/draggable=연결형+트리거.

## G-1 결과 (완료 — 2026-06-05)
**구현**: grid-pro-panel `statusBarCounts(table, labels?)` → `StatusBarItem[]`(total/filtered/selected). StatusBar(prop-driven)
items 로 합성(컨테이너 fork 0). ★row model 정확: total=`getCoreRowModel`(필터 전)·filtered=`getFilteredRowModel`(필터
후·페이지 전)·selected=`getSelectedRowModel`. 렌더 시점 호출→선택/필터 변경 시 갱신.
- **검증(browser-only — 정직, 순수 로직 0)**: chromium **1/1**(status-bar-counts.spec.ts): 필터(Seoul→3)+선택(2) 동시→
  **total=5·filtered=3·selected=2 셋 다 발산**(Set size=3 명시 단언=filtered→total 오배선/잘못된 row model 버그 검출).
  회귀 45/45. typecheck 0. (advisor: floating filter 처럼 node 테스트 지어내지 않음 — 순수 로직 0.)
- **vacuity 회피**: "카운트 보임"=vacuous → **발산** 단언(G-2 faceted "count 단언" 교훈 재판).

## G-2 결과 (완료 — 2026-06-05)
**구현**: grid-core `loadingOverlay?` additive prop. 활성 시 컨테이너 inline position:relative(storybook
Tailwind-less 서 'relative' class inert→inline 필수, P27-1) + `</table>` 뒤 오버레이 div(absolute inset-0,
rgba(255,255,255,0.6), **pointer-events:all 하부 차단**=watermark 의 pointer-events-none 와 반대, z-20) + table
(role=grid)에 **aria-busy=true**. 기존 `loading`(skeleton 치환, MOD-03)·`loadingOverlay` 독립.
- **검증(browser-only — 정직)**: chromium **2/2**(grid-loading-overlay.spec.ts): ①★오버레이=**기존 data 행 DOM 잔존**
  (skeleton 과의 유일 차이, "오버레이 보임"만으론 vacuous)+오버레이 덮음+aria-busy=true+pointer-events≠none ②역방향:
  평범 `loading`=여전히 skeleton(데이터 치환·오버레이 0·aria-busy null)=additive 무회귀. 회귀 47/47. typecheck 0.
- **i18n 후속**: 오버레이 텍스트 '로딩 중…' 하드코딩(GridLocale loadingText 키 추가는 후속).
