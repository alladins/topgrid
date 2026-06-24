# MOD-GRID-28 spec — 접근성 (base `<Grid>` WAI-ARIA grid, **MIT**, grid-core)

> dev-harness 11번째. **차기 로드맵 1순위**(COMMERCIAL-GAP-ANALYSIS: 접근성 = 최대 갭, table-stakes —
> 무료 그리드도 기본 제공). 베이스 `<Grid>` 는 현재 ARIA 의미론 거의 0(role/positional/aria-sort/aria-selected
> /aria-live/roving-tabindex 미구현). 키보드 nav 는 grid-pro-range(Pro)에만 → MIT 코어 신규 필요(라이선스 경계).
> weight=Full(3-Goal). **MIT**(접근성은 코어, Pro 아님).

## ★ 불변식 1 — role-completeness (all-or-nothing, advisor)
`<table>` 에 `role="grid"` 를 부여하면 **네이티브 table 의미론이 억제**되어 grid 계약 전체를 떠안는다 —
모든 row `role="row"`, 모든 cell `role="gridcell"`/`columnheader`, **positional attr 필수**(가상화로 implicit
counting 무력화). **부분 ARIA grid 는 무-ARIA 보다 나쁘다.** → G-1 은 분할 불가: role=grid 면 row/cell role +
positional attr 를 **같은 Goal 에** 모두 넣는다. chromium 게이트는 완전 세트를 **axe-core** 로 검증(grep 아님).

## ★ 불변식 2 (척추) — 가상화 하 절대 인덱스 (advisor — epoch/핀 아날로그)
행/컬럼 가상화 시 DOM 은 **windowed 서브셋**이라 브라우저 implicit positional counting 이 틀린다.
`aria-rowindex`/`aria-colindex`(1-based, **절대**, 헤더 행 포함)와 컨테이너 `aria-rowcount`/`aria-colcount` 는
**DOM 위치가 아니라 절대 데이터/시각 인덱스**를 써야 한다(이미 row=`virtualItems[].index`, col=`computeColumnWindow`
로 절대 인덱스 보유 → 순수 함수). pad/floating 행은 `aria-hidden` 또는 올바른 인덱스. **node 전수 검증**(windowed/
pinned/floating), chromium 은 "스크롤 후 DOM 2번째 행이 *절대* aria-rowindex 보고" non-vacuous 단언.

## Goal
베이스 `<Grid>` 가 **default-on** 으로 WAI-ARIA grid 패턴 충족 — 스크린리더가 행/열/정렬/선택을 올바로 읽고,
키보드로 셀 간 이동(G-2)·변경 알림(G-3). 경쟁: XX Grid(role=grid + aria-rowindex 등 default), xxxx FlexGrid.

## Goals
- **G-1 ARIA 의미론 (default-on, all-or-nothing) — ★본 라운드**:
  - 순수 코어 `internal/ariaAttrs.ts`: `gridContainerAttrs`·`dataRowAriaIndex`·`visualColumnOrder`·`buildAriaColIndex`·
    `columnHeaderAttrs`·`dataRowAttrs`·`gridCellAttrs`·`headerRowAttrs`. 절대 인덱스 산술 = 척추.
  - Grid.tsx 배선: `<table role=grid aria-rowcount aria-colcount [aria-multiselectable]>` · 헤더 `<tr role=row
    aria-rowindex>` · `<th role=columnheader aria-colindex aria-sort>` · 데이터 `<tr role=row aria-rowindex
    [aria-selected]>` · `<td role=gridcell aria-colindex>`. pad/padding 행=aria-hidden 유지.
  - default-on(opt-in 아님 — table-stakes). 기존 마크업에 attr 추가만(셀/행 수·텍스트 불변 → 시각/기능 회귀 0).
  - 검증: ariaAttrs node 전수 + **axe-core chromium**(grid/table 규칙 위반 0) + 절대 aria-rowindex 단언.
- **G-2 키보드 nav + roving tabindex (별도)**: 화살표/Home/End/PageUp/PageDown + cell DOM 포커스 이동.
  reuse-gate: grid-pro-range `useKeyboardNav`(Pro) 내부 확인 → 순수 nav 코어 MIT 추출 또는 신규(LESS-005). Space/Enter
  헤더 정렬. chromium 포커스-이동 게이트.
- **G-3 aria-live + focus-visible/high-contrast (별도)**: 정렬/필터/선택 변경 polite-region 알림(debounce) +
  일관 focus-visible 링 + forced-colors.

## AC (G-1)
1. **role-completeness**: role=grid + 전 행 role=row + 전 셀 role=gridcell/columnheader. axe 위반 0.
2. **절대 positional**: aria-rowcount=헤더+데이터, aria-colcount=leaf. 데이터 행 aria-rowindex=헤더수+절대인덱스+1.
   가상화 시 windowed 행/열이 DOM 위치 아닌 **절대** 인덱스 보고(node + chromium 스크롤 후 단언).
3. **aria-sort**: 정렬 가능 헤더에 ascending/descending/none. 정렬 토글 시 갱신.
4. **aria-selected**: 선택 활성 시 데이터 행에 true/false.
5. **회귀 0**: 셀/행 수·텍스트·시각 불변(기존 chromium 5+1+2 그린 유지). MIT·외부 dep 0.

## constraints
- **C-003**: 주석↔소스. floating/empty 행 aria 처리 명시. **LESS-006**: G-1 axe 게이트(role grep=vacuous).
- **MIT**: 신규 패키지 0·외부 런타임 dep 0(axe=devDep 테스트만).
- default-on: 모든 소비자에 적용(비파괴 — attr 추가만).
- **그룹 헤더**: 비-leaf(spanning) 헤더는 `aria-colindex` 생략(0=무효 → omit; `0 ⟺ 비-leaf` sentinel).
  `aria-colspan`=vN. floating/empty 행=role=row만(aria-rowindex 미부여).
- **v1 한계(페이지네이션)**: client 페이지네이션 시 `aria-rowindex` 는 **현재 페이지 상대**(aria-rowcount=헤더+
  페이지 행). 전 페이지 누적 절대값 아님 — AG 의 "페이지=새 viewport" 취급과 동형, axe-clean. 누적 절대값은 vN.

## 의존
grid-core 내부. 신규 dep 0. (테스트: `@axe-core/playwright` devDep @ apps/docs.)

## 분류 (MASTER §2)
ariaAttrs = 종결형(순수) · Grid.tsx 배선 = 연결형(render attr).
