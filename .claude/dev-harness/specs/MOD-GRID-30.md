# MOD-GRID-30 — 필터링 고도화 (floating / set·faceted / multi)

dev-harness 13번째. 갭분석(COMMERCIAL-GAP) 2.5순위(필터링). MOD-09 가 per-column popover 필터(Text/Number/Date/
Select)+GlobalSearch 를 이미 출하 → MOD-30 은 **갭분석이 ❌/🟡 로 짚은 3축**을 닫는다.

## reuse-gate (LESS-003) — 인벤토리
- **이미 있음**(MOD-09, grid-features/filter-ui): `TextFilter`·`NumberFilter`·`DateFilter`·`SelectFilter`·
  `GlobalSearchInput`·`FilterPopover`·`FilterIndicator`·`FilterResetButton` + **순수 `filterFns.ts`**
  (`textFilterFn`·`numberFilterFn`·`dateRangeFilterFn`·`selectFilterFn`=arrIncludes) + 값 타입
  (`TextFilterValue`·`NumberFilterValue`·`DateFilterValue`).
- **재사용 계약**: `filterFns` + 값 타입 = UI 무관 안정 계약. floating 필터는 **같은 값 shape 를 같은 `column.setFilterValue`
  로 set → 같은 filterFn 이 매칭**(popover 와 동일 state 의 다른 *표현*, 평행 필터 아님).
- **fork 금지**(LESS-005): popover 컴포넌트(`TextFilter` 등)는 연산자+값+디바운스 로직이 `FilterPopover` 렌더와
  얽혀 있음 → 추출 시 출하 컴포넌트 수정. 따라서 floating 은 **계약(filterFns+타입) 재사용 + 신규 thin always-visible
  primitive**.

## 갭 (갭분석 verified)
- **Floating filters**(Community, ❌): 헤더 아래 인라인 필터 입력 행. topgrid 은 popover-trigger 만. → **G-1(MIT)**.
- **Set/Faceted**(🟡 shipped-but-inert): `SelectFilter` 가 `column.getFacetedUniqueValues()` 소비하나 **어떤 패키지도
  `getFacetedRowModel`/`getFacetedUniqueValues` 를 useReactTable 에 등록 안 함 → OOTB 빈 리스트(silent fail, no try-catch)**.
  → **G-2(MIT)**: 코어가 faceted 모델 pre-wire(SelectFilter OOTB 동작).
- **Multi filter**(Enterprise, ❌): 컬럼당 복수 조건 AND/OR 스택. 현재 컬럼당 단일 FilterFn(연산자 switch=직전 state
  교체, 스택 아님). → **G-3(Pro, PAT-003)**.
- **Advanced filter**(Enterprise, ❌, cross-column 식 빌더): **vN 연기**(scope risk, advisor).

## ★ G-1 핵심 제약 — floating 행은 새 `<thead>` 행 = 3개 cross-module 계약 상속 (advisor)
floating 필터 행은 leaf 헤더행 아래 새 `<tr>` → MOD-27/28 계약을 *그대로* 탄다(갭분석엔 없음=feature-level):
1. **컬럼 가상화(MOD-27)**: 필터 셀이 **같은 컬럼 윈도(`renderWindowedHeaderCells` 동형 경로)** 를 타야 함. 전컬럼
   렌더 시 윈도잉 컬럼과 어긋남(= cellClassName 회귀의 column-virt 판, flag-on 시만 보임).
2. **컬럼 핀(MOD-27)**: 핀 컬럼 필터 셀 = 헤더셀과 동일 sticky.
3. **ARIA 정합 + axe 게이트(MOD-28)**: 척추 `aria-rowcount=headerRowCount+dataRowCount`·`dataRowAriaIndex(headerRowCount,…)`.
   floating 행이 **header 행으로 카운트되는가**(→ 데이터 aria-rowindex shift) **결정 필요** + `role=grid` 안 input 행의 role.
   axe(`aria-required-children`/`-parent`/`aria-roles`/`aria-allowed-attr`)가 wing 시 발화 → **의도적 설계**(추측 아님).
   판별 테스트 후보: 필터행 present → axe clean AND (데이터 aria-rowindex 정합: header row 로 카운트하면 +1 일관, 아니면 불변).

## seam (PAT-005, 기존 관례 mirror)
- 기존 per-column 주입 = `cellClassName`/`rowClassName` render 콜백(prop 존재=활성, enable flag 없음). columnDef.meta 도
  사용처 있음(`createColumns` `meta.primary`).
- **채택**: `renderFloatingFilter?: (column) => ReactNode` Grid prop(존재=floating 행 렌더, cellClassName mirror).
  grid-core 는 **구조 행 + 윈도/핀/ARIA plumbing** 만 제공(grid-features 무의존=MIT 유지). 소비자가 grid-features 의
  thin floating 입력 컴포넌트를 반환.

## Goals
- **G-1 floating filters(MIT) — ★본 라운드**:
  - grid-core: `renderFloatingFilter` prop → `<thead>` leaf 행 아래 필터 `<tr>`. 컬럼 윈도(가상화)·핀 sticky·ARIA 정합.
  - grid-features: thin always-visible 입력(`TextFloatingFilter` 등) = filterFns+값타입 재사용(LESS-005), inline/CSS 스타일
    (Tailwind class storybook inert).
  - ★shared-state: floating 입력 ↔ popover = 같은 `column.setFilterValue`(분기 테스트: 한쪽 set→다른쪽 반영).
  - 검증: node(윈도 정합 순수) + chromium(입력→행 필터·axe clean·virt 정렬·shared-state).
- **G-2 set/faceted wiring(MIT)**: 코어 faceted 모델 pre-wire → SelectFilter OOTB. 검증: chromium(소비자 wiring 없이
  distinct 값+count 표시).
- **G-3 multi filter AND/OR(Pro, PAT-003)**: 컬럼당 복수 조건 스택(순수 compound predicate + UI). advanced=vN.
  검증: node(compound) + chromium.

## constraints
- **MIT**(G-1/G-2)·**Pro**(G-3, grid-license dep+EULA). 외부 dep 0. C-003 주석↔소스. **LESS-006**: floating=browser(입력→
  필터·axe)·multi=node(compound predicate). Tailwind class storybook inert → 테스트 대상은 inline/CSS-var.
- floating ⊥ 기존 popover: 동일 state 의 다른 표현(분기 금지).

## 의존
G-1/G-2 grid-core+grid-features. G-3 신규/기존 Pro. 신규 외부 dep 0.

## 분류 (MASTER §2)
filterFns 재사용·compound predicate = 종결형(순수) · floating 행 plumbing/faceted wiring = 연결형 · multi UI = 트리거.

## G-1 결과 (완료 — 2026-06-04)
**구현**: grid-core `renderFloatingFilter?(column)` prop(존재=활성, cellClassName mirror=PAT-005) → `<thead>` leaf
행 아래 floating 필터 `<tr>`. 셀=`renderFloatingFilterCell`(핀 sticky+width 헤더셀 동형) / 컬럼 가상화 시
`renderWindowedFloatingFilterCells`(헤더와 **동일 컬럼 윈도 세그먼트**). ARIA: floating 행=추가 header 행
(`headerRowCount += floatingFilterEnabled`) → aria-rowcount +1·데이터 aria-rowindex 일관 +1·floating 셀=columnheader.
grid-features: thin `TextFloatingFilter`/`NumberFloatingFilter`(=값타입+filterFns 재사용=LESS-005, inline 스타일,
current?.value useEffect 동기화=shared-state).
- **검증(browser-only — 정직)**: 신규 pure logic 0(computeColumnWindow MOD-27·filterFns MOD-09 이미 node 검증, floating
  은 둘을 재사용하는 *렌더 배선*). chromium **4/4**(tests/visual/grid-floating-filter.spec.ts): ①floating 행=header 행
  ARIA 정합(thead 2행·aria-rowcount 8=2+6·데이터 aria-rowindex 3) + **axe clean**(input 행이 grid 계약 안 깨짐) +
  텍스트 입력→행 필터 ②숫자(=) 필터 ③shared-state(popover write→floating input 반영, 단일 column state) ④**컬럼
  가상화 정렬**(floating 셀이 헤더셀과 동일 윈도=핀 좌/우 x 일치·셀 수 일치 — drift 없음). 회귀 30/30. typecheck 0.
- **advisor 핵심(닫음)**: floating 행은 새 thead 행이라 MOD-27(컬럼virt/핀)·MOD-28(ARIA/axe) 계약 상속 → 셋 다
  검증(virt 정렬·핀 sticky·axe·aria-rowindex). "input 이 필터한다"=vacuous done 회피.
- **shared-state 한계(기록)**: popover `TextFilter`(MOD-09)는 inputValue 를 mount 시 1회 init·외부 동기화 안 함 →
  floating→popover *표시* 방향은 stale(근본 column state 는 공유). floating→는 useEffect 동기화로 OK. popover sync 는
  MOD-09 후속.

### G-1 advisor 후속(커밋 fold)
- **a11y 시정(신규코드 결함)**: floating 입력 aria-label 이 전부 "필터"=동일 접근명(name/city 모호) → SR 사용자가
  컬럼 연결 못 함(MOD-28 이 닫은 그 갭, grid-contract axe subset 은 중복라벨 미검출). → `label?` prop 추가,
  `aria-label={`${label ?? column.id} 필터`}`(컬럼별 고유). 테스트: name/city 라벨 distinct 단언.
- **virt 테스트 강화**: 기존 first/last(=핀, 항상정렬) 만 x-검사 → **center(windowed) 셀** x-match 추가(실제 drift
  리스크는 center). 동일 columnWindow 공유라 구조적 정렬이나 "관측된 정렬"로 승격.
