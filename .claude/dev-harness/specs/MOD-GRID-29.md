# MOD-GRID-29 spec — 테마 · i18n (base `<Grid>`, **MIT**, grid-core)

> dev-harness 12번째. 차기 로드맵 2순위(COMMERCIAL-GAP: State·theming·i18n = 미구현 9). reuse-gate:
> 기존 테마/locale 시스템 **없음**(greenfield). MOD-28 의 HC(forced-colors 선택표시) 의존도 본 모듈 G-2 에서 해소.
> weight=Full→partial(G-1 i18n+icons, G-2 테마+다크+HC; **RTL/prebuilt-테마/withParams = vN/defer**).

## ★ G-1 척추 — missing-key fallback (advisor, LESS-006)
미override·미지 locale 키는 **기본 문자열로 fallback**하며 raw key(`"grid.emptyText"`)나 `undefined` 를 절대
렌더하지 않는다. (typo 시 키를 그대로 뱉는 resolver 는 happy-path 통과 후 gibberish 발행.) node 로 fallback 전수,
browser 로 **부분 override**(일부만 바꾼 localeText → 바뀐 건 영어·안 바꾼 건 한국어) 검증.

## ★ G-2 핵심 제약 — CSS custom property (Tailwind-class 아님, advisor)
**MOD-27 P27-1 이 load-bearing**: Tailwind-arbitrary(`bg-[var(--x)]`)는 Tailwind 미적용 storybook(유일 browser
하네스)에서 **inert → 게이트 불가** + 소비자 Tailwind config 의존(headless 가 가정 불가). 따라서 테마는 **루트에
inline CSS custom property**(`--topgrid-*`)로 구동하고 chrome surface 가 `var()` 로 읽는다(storybook·전 소비자 동작).
`themeToVars(theme)→{--topgrid-*}` = 순수(node). 단 **테마 검증=browser-only**(themeToVars node 로 "themeable"
주장 금지 — green-함수/렌더-안됨 trap). **bulk 전환 전 1 surface spike**(header bg→var, default+override 확인).

## Goals
- **G-1 i18n(localeText) + icons — ★본 라운드**:
  - 순수 `internal/i18n.ts`: `GridLocale`(emptyText·rowsPerPage·totalCount(n)·sortMessage·selectionMessage)·
    `GridIcons`(sortAscending/Descending/None) + `defaultGridLocale`(한국어)·`defaultGridIcons`·`resolveLocale(o?)`·
    `resolveIcons(o?)`(merge=fallback). `localeText?`/`icons?` props.
  - 스레딩: EmptyState(emptyText)·sort glyph(icons)·live-announce(locale.sortMessage/selectionMessage)·
    pagination(rowsPerPage/totalCount).
  - 검증: i18n node(fallback 전수) + chromium(부분 override).
- **G-2 CSS-변수 테마 + 다크 + HC-safe 선택(별도)**:
  - 1 surface spike → `themeToVars(theme)` 순수 + 루트 inline var + chrome 색(header/border/selection/focus) `var()` 전환.
  - `theme?` prop(토큰). 다크=프리셋. **HC**: 선택 표시를 forced-colors-safe(border/outline, `bg-blue-50` 아님)→MOD-28 의존 해소.
  - 검증: chromium computed-style(default+override+다크) — browser-only.

## constraints
- **MIT**·외부 dep 0. **C-003** 주석↔소스. **LESS-006**: i18n=fallback node·테마=browser computed-style.
- chrome 색 중복 점검: grid-core 외 renderers/pro 셀에 선택/focus 스타일 중복 시 half-테마(부분-ARIA 시각판) 경고.

## 의존
grid-core 내부. 신규 dep 0.

## 분류 (MASTER §2)
i18n resolver·themeToVars = 종결형(순수) · 스레딩/var 전환 = 연결형.

## G-1 결과 (완료 — 2026-06-04)
**구현**: `internal/i18n.ts` 순수 코어 — `GridLocale`(emptyText·rowsPerPage·totalCount·**firstPage/prevPage/nextPage/lastPage**·
sortMessage·selectionMessage)·`GridIcons` + `resolveLocale/resolveIcons`(merge=fallback). `localeText?`/`icons?` props.
스레딩: EmptyState·sort glyph·live-announce·pagination(rowsPerPage·totalCount 포매터·**nav aria-label 4종**).
- **advisor 캐치(이번 라운드)**: pagination nav 버튼 aria-label 이 하드코딩 한국어 → EN locale 사용자(MOD-28 스크린리더
  청자)가 한국어 청취. 5-키 spine 의 self-check 가 놓친 implicit req. → **GridLocale 에 nav 4키 추가**해 해소(deferral 아님).
- **검증**: node fallback-invariant 19/19(esbuild 격리 번들 — i18n.ts 의 extensionless liveAnnounce import 가
  strip-types ESM 와 불화 → 번들 후 import). chromium 3 stories(부분 override: EN 라벨·nav aria-label 보임 + KO
  fallback 잔존 동시 단언) + a11y 8 = 11/11 green. typecheck 0.
- **명시 deferral**: `ColumnVisibilityMenu` 의 `aria-label="컬럼 표시 설정"`·"숨길 컬럼 없음" 은 미국지화.
  근거: (1) optional surface(columnPersistence 제공 시만 렌더), (2) 이미 자체 `triggerLabel`/`menuLabel` prop 패턴
  보유(locale-object 와 다른 idiom — 혼용 시 비일관). 후속 라운드에서 prop 경유 처리.
- **known-broken infra(MOD-29 무관)**: `tests/visual/storybook.spec.ts`(per-story `toMatchSnapshot`)는 playwright 1.60
  에서 `TypeError: file.slice is not a function`(API drift) + baseline 0 커밋 → 전수 fail. 내 변경과 무관(미변경
  Watermark/MapCell 동일 fail). MOD-29 범위서 **수리 안 함**(scope creep). targeted spec 가 실제 게이트.

## G-2 결과 (완료 — 2026-06-04) → MOD-29 = {G-1,G-2} 완주, §3 이관
**구현**(advisor 3-commit 스테이징): 순수 `internal/theme.ts` — `themeToVars(theme)`→override 키만 inline
`--topgrid-*` 객체, root 에 적용, 각 surface 가 `var(--topgrid-x, <기본 hex>)` 로 읽음(미설정=root var-free=기본색
fallback=default-on). `theme?` prop + `GridTheme`(5 정적키: headerBg·headerText·bodyBg·cellText·border) + `darkTheme` 프리셋.
- **Commit A**(f7f0ccf) spike: header bg 1 surface 만 변환(메커니즘 증명, GridTheme=headerBg 1키). computed-style 2단언
  (default rgb(249,250,251) 무회귀 + distinctive override rgb(255,0,0) var 흐름).
- **Commit B**(2e72678) bulk: 5 정적 surface 변환 + `darkTheme`. **markup 변경(class→inline var)→byte-identical 아님**
  → 불변식=**visual**(computed-style 동일). default 5-surface 무회귀 + override + dark flip = chromium 3, 회귀 24/24.
- **Commit C**(this) HC-safe 선택: 선택행 inline `outline`(Tailwind outline-* 도 storybook 서 inert→inline). 선택행
  outline 있음/비선택 없음 = **normal + forced-colors:active(emulateMedia) 양쪽** 단언. tr outline 신뢰성(advisor 우려)=
  실증으로 렌더 확인. chromium 4(테마3+HC1), 회귀 25/25.
- **★advisor 핵심 통찰(구조)**: **vars ⊥ HC** — forced-colors 는 값이 literal 이든 var 이든 background/color/border 강제
  override → **테마는 HC 무익**. HC-safe 선택은 별도 *구조적* 메커니즘(outline; forced-colors 가 outline-color 만 시스템색
  remap=구조 유지, bg 처럼 평탄화 안 됨). 테마 green→"HC 닫힘" 가장 금지. → **MOD-28 HC 갭(선택 시각 forced-colors 소실)
  = outline 으로 해소**.
- **검증분리 준수**: themeToVars=순수 맵(node 로 "themeable" 주장 금지=spec 명시) → 전 주장 browser computed-style.
- **한계(명시)**: selection bg(:hover)·focus outline(:focus-visible)=pseudo-state 라 inline 불가 → 기본 blue 유지(다크서도
  가독, HC 는 outline 이 커버). row divider(Tailwind divide util)·pagination/empty chrome=미테마(full 다크 충실도 한계).
  selection 색 themeable=후속(shipped CSS 필요).

### G-2 close-out advisor 캐치 (Commit C 에 반영)
- **★cross-feature 회귀 시정(blocking)**: bulk(Commit B)서 cellText/headerText 를 **per-td/th inline** color 로
  넣었는데 inline 이 class 를 이김 → 소비자 `cellClassName`(MOD-24 조건부 서식 `text-red-600` 등) 색이 **조용히
  gray 로 덮임**. 게이트가 plain 셀만 써서 못 봄(LESS-006 cross-feature 판). **red-green 실증**: cellClassName→실 CSS
  클래스(`.tg-red`, storybook 이 직접 `<style>` 제공 — Tailwind class 는 inert) 쓰는 셀 색 단언 테스트가 fix 전 FAIL
  (gray), fix 후 PASS(red). **fix=색을 tbody/thead 의 inherited color 로 이동**(상속색=cascade 최약 → 셀 자체 class 가
  이김; 미지정 셀은 테마/다크색 상속). chromium 5(테마4+cross-feature guard1), 회귀 26/26.
- **finding(MOD-28, 미수리=scope)**: active-cell 링(`Grid.tsx` `activeClass='outline outline-2 outline-blue-500…'`)은
  Tailwind class → Tailwind-less storybook·비-Tailwind 소비자서 inert(시각 링 안 보임). MOD-28 browser 테스트는
  aria-activedescendant/focus 유지만 검증·**시각 링 미검증**→unverified ship(방금 선택 outline 고친 것과 동일 inert-class
  failure mode). MOD-28 후속에서 inline 화 필요(MOD-29 범위 밖). §5.2 후보.
