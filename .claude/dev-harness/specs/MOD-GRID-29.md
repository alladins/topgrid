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
