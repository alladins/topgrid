# MOD-GRID-49 — 페이지네이션 완성도 (pageNumberFormat + go-to-page + auto-page-size)

dev-harness 32번째 (**Track 1 browser 클러스터 1번째**). grid-core(MIT, Community). 갭분석 **Pagination ❌ 3건** =
**Custom page number/count formatter** · **Jump-to-page input(go-to page N)** · **Auto page size(fit rows to viewport height)**.
경쟁: AG Grid `paginationNumberFormatter` · Wijmo pager page-input · AG `paginationAutoPageSize`.

## 클러스터 근거 (advisor spec-gate)
- **패키지-응집 모듈**(사용자 "패키지별로 정리"): grid-core **pagination 서브시스템** 3 ❌ 를 한 모듈로. 셋 다 advisor
  「clean-divergent」 게이트 통과(비공허 발산 단언 즉시 작성 가능) → Track 1 첫 모듈로 적합.
- **★vacuity-trap 제외**(advisor): debounced-scroll(렌더-카운터 없이 "fewer re-renders" 단언 불가 + react-virtual rAF 위임) ·
  row-animation(FLIP transform-offset=timing-sensitive) → 발산 단언 확정 전까지 **번들 금지**. auto-virtualization-threshold =
  문서화된 **design 결정 번복**(MASTER mod-grid-01 opt-in-only) → 별도 advisor 승인 후. 본 모듈은 셋 다 미포함.
- **node-spine + chromium**(LESS-006): 매 Goal 순수 함수 1개를 node 로 못박고, 브라우저 행동(G-2/G-3)은 chromium 발산 단언.

## reuse-gate (LESS-003) + scope 확정 (verify-first grep)
- **G-1 page formatter — ★스코프 절반 이미 충족(advisor 정직성)**: `totalCountFormat`(GridPagination.tsx:58, Grid.tsx:1063 ←
  `localeText.totalCount`)가 **전체-건수 포맷은 이미 노출·배선**. gap 행("no formatter hook")은 **count-half 에 대해 과장(stale)**.
  미충족=`PageNumbers.tsx`(raw 정수 렌더). → 신규=**page-number** 포맷 passthrough(count-half 무수정). 닫힘 기록=발산 행동(신규
  포맷된 라벨)으로, *기존 prop* 으로 ✅ 위장 금지.
- **G-2 go-to-page — genuine 부재**: grep(jumpToPage/goToPage)=0. `table.setPageIndex` API 존재하나 numeric 입력 UI 없음
  (PageNumbers=슬라이딩 윈도 버튼 + first/last 만). → 신규 `GoToPageInput` + 순수 clamp/parse.
- **G-3 auto-page-size — genuine 부재**: grep(autoPageSize/fillHeight/fitRows)=0. 항상 고정 pageSize. → 순수
  `computeAutoPageSize` + ResizeObserver 배선(컨테이너 높이→pageSize). 재사용=기존 setPageSize 경로(MOD-03).
- 재사용: GridPagination/PageNumbers 구조(MOD-03)·container ref 패턴(GridPagination enableKeyboardNav)·setPageSize/setPageIndex.

## Goals
- **G-1 pageNumberFormat (순수 passthrough, chromium 발산) — 배선형**:
  - `GridPaginationOptions.pageNumberFormat?: (n: number) => ReactNode` → GridPagination → PageNumbers 버튼 라벨에 적용
    (미지정=raw 정수 = byte-identical). 큰 페이지번호 천단위 구분(`1,234`) 등 i18n. **count-half(totalCountFormat) 무수정**.
  - **검증**: ★passthrough=node-meaningful 순수 로직 0(MOD-33 "0 pure logic→node 안 지어냄" 정직 — 코드베이스에 component-render
    node 하네스 부재). **chromium 발산**: formatter 적용 시 버튼 라벨 발산(raw "1000" vs "1,000")·미지정 시 raw·aria-label
    원본 정수 보존(SR 접근성). OFF byte-identical=node SSR 아닌 chromium 동일-마크업으로 커버(다른 골 OFF 단언과 공유).
- **G-2 go-to-page 입력 (chromium 발산) — 순수 spine + UI**:
  - 순수 `clampGoToPage(rawInput: string, pageCount: number): number | null`(1-based 파싱→[1,pageCount] 클램프, 비수치/빈→null=no-op).
    `GoToPageInput`(numeric input + "이동" 버튼/Enter)→`table.setPageIndex(idx-1)`. `enableGoToPage?: boolean`(기본 off).
  - **검증**: node(clamp 경계: "7"→7·"0"→1·">count"→count·"abc"→null·""→null·음수→1) + **chromium 발산**(7 입력→그 페이지 행
    실제 표시, 슬라이딩 버튼만으로 못 가는 먼 페이지로 점프 증명).
- **G-3 auto-page-size (chromium 발산) — 순수 spine + ResizeObserver**:
  - 순수 `computeAutoPageSize({ availableHeight, rowHeight }): number`(floor, 최소 1). `autoPageSize?: boolean`(기본 off) 시
    body 가용높이 측정(ResizeObserver)→`setPageSize(computeAutoPageSize(...))`. pageSizeOptions 셀렉트는 autoPageSize 시 숨김(상충).
  - **검증**: node(computeAutoPageSize: 정확 floor·rowHeight>height→1·0 가드) + **chromium 발산**(컨테이너 높이 축소→pageSize/표시
    행수 실제 감소, 높이 확대→증가 = 뷰포트 적응 증명, "보임" 아님).

## In / Out
- **In**: `pageNumberFormat`(G-1, 순수 passthrough) · `enableGoToPage`+`GoToPageInput`+`clampGoToPage`(G-2) ·
  `autoPageSize`+`computeAutoPageSize`+ResizeObserver(G-3). 셋 다 grid-core MIT.
- **Out(별도 모듈/후속)**: debounced-scroll·row-animation(vacuity-trap, 발산 단언 확정 후) · auto-virtualization-threshold(design
  번복=advisor) · drag-between-grids(cross-grid context=후속 browser) · post-sort callback(Grid/sort 수술=후속).

## ★ ❌ 닫힘 마커
- **Custom page number/count formatter = ✅**: page-number passthrough(신규, node 실증) + count-half(기존 totalCountFormat).
  ★정직: 행 ❌ 는 count-half 에 과장됐었음 — page-half 신규가 행 전체를 ✅ 로 닫음(기존 prop 으로 위장 아님).
- **Jump-to-page input = ✅**: numeric 입력 UI + clamp(chromium 먼-페이지 점프 발산).
- **Auto page size = ✅**: 뷰포트 적응 pageSize(chromium 높이→행수 발산).
- COMMERCIAL-GAP: **Pagination** 카테고리 3 ❌→✅. 헤드라인 **❌34→31**(reconcile 19/19·330 재검산 — capture 시 프로그래매틱).

## AC (측정 가능)
G-1: formatter 적용 라벨 발산·미지정 raw·aria 보존(node). G-2: clamp 6 경계(node)+먼-페이지 점프(chromium). G-3:
computeAutoPageSize floor/가드(node)+컨테이너 높이→행수 발산(chromium). OFF(전 신규 prop 미지정) byte-identical(node SSR).

## constraints
- **MIT**(grid-core, license gate 0). 외부 dep 0. C-003. **LESS-006**: G-2/G-3 브라우저 행동→chromium 발산 필수(정적 presence 금지).
- **OFF byte-identical**: 신규 prop 전부 opt-in, 미지정 시 기존 마크업 불변(node SSR 회귀 게이트). 기존 totalCountFormat·setPageSize·
  setPageIndex 무수정(passthrough/재사용).
- ResizeObserver=브라우저 API(node 부재)→순수 computeAutoPageSize 만 node, 측정 배선=chromium.

## 의존
grid-core 내부(pagination/*, types.ts, Grid.tsx 최소 배선). 신규 외부 dep 0.

## 분류 (MASTER §2)
pageNumberFormat·clampGoToPage·computeAutoPageSize = **종결형**(순수). GoToPageInput·ResizeObserver 배선 = **배선형**(chromium 검증).

## reuse-gate 결과 / 추측 0
재사용=GridPagination/PageNumbers(MOD-03)·totalCountFormat(MOD-29)·setPageSize/Index. 신규=page-number 포맷·go-to clamp·auto-size
compute. 추측 0: AG `paginationNumberFormatter`(페이지번호 포맷)·`paginationAutoPageSize`(뷰포트 맞춤)·Wijmo pager 입력 = 1차 출처
(COMMERCIAL-GAP L347/349/345 verified-absent 근거).

## specify rubric (Full — 점수, 게이트 C)
- [x] Goal(pagination 3 ❌, AG/Wijmo 대응) **9/10** · [x] In/Out(clean-divergent In·vacuity-trap Out 명시) **10/10**
- [x] AC 측정(clamp 경계·computeAutoPageSize·chromium 발산) **10/10** · [x] reuse-gate(verify-first scope·count-half 정직) **10/10**
- [x] constraints(MIT·LESS-006·OFF byte-identical) **9/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(AG/Wijmo 1차·gap verified 근거) **9/10** · [x] 분류(§2 종결형+배선형) **9/10**
- **합계 76/80 — 게이트 통과.**

---

## G-1·G-2·G-3 결과 (완료 — 2026-06-07) → MOD-49 = {G-1,G-2,G-3} 완주, §3 이관
**구현**(grid-core, 신규 `pagination/{clampGoToPage,computeAutoPageSize,GoToPageInput,useAutoPageSize}` + types/PageNumbers/GridPagination/Grid 최소 배선):
- G-1 `pageNumberFormat`(GridPaginationOptions) → GridPagination → PageNumbers 버튼 라벨(`{format ? format(p) : p}`, aria-label raw 유지).
  count-half(totalCountFormat) 무수정.
- G-2 순수 `clampGoToPage(raw,pageCount)`(1-based→0-based 클램프, non-numeric/empty→null) + `GoToPageInput`(numeric+Enter/버튼) +
  `enableGoToPage` → table.setPageIndex. GridPagination 좌측 그룹 렌더.
- G-3 순수 `computeAutoPageSize({availableHeight,rowHeight})`(floor, min 1, 0/NaN 가드) + `useAutoPageSize`(ResizeObserver, thead 제외 측정)
  + `autoPageSize` → table.setPageSize. ★바운드 컨테이너: autoPageSize 시 outer wrapper+scroll container height:100%(% 체인, 소비자 wrapper 가 뷰포트 정의).

**검증**: node **clampGoToPage 11/0 + computeAutoPageSize 9/0**(grid-core 전 스위트 green) · typecheck 0 · tsup build green(ESM+CJS+DTS) ·
**chromium 3/3**(`grid-pagination-complete.spec.ts`) + **전체 회귀 81/81**(78 baseline + 3, Grid.tsx 수술 회귀 0).
- G-1: 포맷 라벨 "P1" 발산(raw "1" 아님) + aria-label "페이지 1로 이동" raw 보존.
- G-2: page 1 first-cell "0" → "7" 입력 → page 7 first-cell "60"(슬라이딩 버튼 미도달 먼 페이지 점프) + page-7 버튼 부재 확인.
- G-3: 280px 뷰포트 settled small page(<15, >2) → 560px 리사이즈 → 행 수 증가(높이→행수 발산, ResizeObserver poll).

## ★ closure (advisor — clean-divergent 3, vacuity-trap 제외)
- **auto page size=✅ / jump-to-page input=✅ / custom page formatter=✅**: 셋 다 Pagination 카테고리.
  ★정직: custom formatter 행 ❌ 는 **count-half(totalCountFormat 기존) 에 과장**됐었음 — page-number-half 신규(pageNumberFormat)가 행 전체 ✅ 로 닫음(기존 prop 으로 위장 아님).
- COMMERCIAL-GAP: **❌34→31·✅223→226·🟡70**(Pagination 9/5/3 → **12/5/0**, reconcile 19/19·합 330; 잔여 ❌ tier Community 13→11·기타 1→0).
- **제외(advisor)**: debounced-scroll·row-animation(vacuity-trap, 발산 단언 확정 후) · auto-virtualization-threshold(design 번복=advisor) · drag-between-grids·post-sort callback(후속 browser). 신규 lesson 없음(LESS-006·node-spine+chromium 적용).
- **★상호작용 가드(advisor 후속)**: `autoPageSize` + `enableVirtualization` 동시 활성 금지 — 가상화 자체 행 관리(scroll-window)와 setPageSize
  충돌. `autoPageSizeEnabled = autoPageSize===true && enableVirtualization!==true`(virt 우선, height:100% 분기도 동일 가드). MOD-27/30 의
  feature-interaction 제약 문서화 동형(코드베이스 bar). 회귀 무영향(어떤 스토리도 양쪽 동시 설정 안 함=가드는 tested-path inert).

## 모듈 완주 요약
3-Goal: Track 1 browser 클러스터 **1번째**. 패키지-응집(grid-core pagination 서브시스템 3 ❌). 순수 spine(clampGoToPage·computeAutoPageSize)
node + 브라우저 행동(formatter 라벨·먼-페이지 점프·뷰포트 적응) chromium 발산. Grid.tsx 최소 배선(OFF 회귀 0=81/81). 신규 lesson 없음.
