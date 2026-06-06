# MOD-GRID-47 — 차트 cross-filter 매핑 (selectionsToFilter)

dev-harness 30번째 (vN-8). 갭분석 Integrated charts ❌ 2(차트 잔여) 중 **node-pure 1** = **Cross-filtering charts**(차트→grid 필터).
경쟁: AG cross-filter. ★MOD-34 차트 클러스터 7 중 마지막 2(panel/cross-filter)의 cross-filter 엔진.

## reuse-gate (LESS-003) + 분할 (advisor spec-gate)
- **이미 있음**: MOD-46 `AdvancedFilterExpr` + `evaluateAdvancedFilter`(grid-pro-filter). MOD-34 차트(RangeChart/RangeChartPanel).
- **부재**: 차트 선택 → grid 필터 식 매핑(cross-filter). chart panel/composition(dock/settings)=순수 UI.
- **★분할(advisor)**: 차트 잔여 2 = **cross-filter**(선택→필터 매핑=node-pure, MOD-46 식 재사용) + **chart panel/composition**(dock/
  range-handles/settings=**순수 UI, node-pure substance 0**). → cross-filter 만 추출(panel 은 browser, ❌ 유지). **1행만 flip**.
- **★dep 방향(advisor)**: 매핑은 `AdvancedFilterExpr` 생성 → 식 타입 소유한 **grid-pro-filter** 에 둠(차트→필터 결합 회피). 선택
  descriptor=차트-무관 generic `{field,type,value}`. (차트 클릭→매핑 호출=browser wiring, chart→filter 방향이라 순환 없음.)

## ★ 핵심 결정 (advisor)
1. **multi-select 결합**(매핑이 곧 기능, 소비자에 떠넘기지 않음): **같은 필드 = OR**(North+South) · **다른 필드 = AND**(category=North
   AND year=2024). 필드별 그룹화 → 필드 내 OR · 필드 간 AND. ★둘 다 테스트.
2. **`type` 는 컬럼 메타에서**(클릭 값 추론 금지, MOD-46 동일): `year=2024`(number)·`category="North"`(text) 가 올바른 타입 condition
   생성. 선택 descriptor 가 type 휴대 → `"100">"20"` boundary 버그를 차트 경계서 재도입 안 함.

## Goals
- **G-1 selectionsToFilter — 종결형(순수)**:
  - `selectionsToFilter(selections: FilterSelection[]) → AdvancedFilterExpr`. FilterSelection=`{field,type,value}`. 같은 필드 eq 들 OR·
    필드 간 AND. 빈 선택→무제약 빈 group. (소비자가 evaluateAdvancedFilter/makeAdvancedFilterFn 으로 적용.)
  - **검증**: node(strip-types, evaluateAdvancedFilter 합성) — 단일·★같은필드 OR(North/South/East)·★다른필드 AND(North+2024/2023/South)·
    ★typed numeric(year number, "2024" 문자열 수치강제)·combined(OR+AND)·빈 선택→all-pass.

## In / Out
- **In**: 순수 `selectionsToFilter`(선택→식, grid-pro-filter). node 검증.
- **Out(browser/❌ 유지)**: 차트 클릭→grid setFilter **wiring** + linked highlight(cross-filter UI) · **chart panel/composition**(dock·range
  handles·settings=순수 UI, node substance 0 → ❌ 유지).

## ★ ❌ 닫힘 마커 (advisor — 1행만)
- **cross-filtering charts = 🟡**: 선택→필터 모델 ship+node, 클릭→setFilter wiring/linked highlight=browser.
- **chart panel/composition = ❌ 유지**(순수 UI, 추출 substance 0 — "차트 잔여 2" 프레이밍에 끌려 2번째 flip 금지).
- COMMERCIAL-GAP: **1 ❌→🟡** → ❌36→35·✅223·🟡68→69(Integrated charts 10/4/1·Enterprise 22→21).

## constraints
- **Pro**(grid-pro-filter, PAT-003). 외부 dep 0. C-003. **LESS-006**: 순수 → node ceiling(클릭 wiring=browser=Out). MOD-46 식 재사용
  (composes once 입증). type=컬럼메타(silent mis-type 금지). dep 방향=helper in grid-pro-filter(차트 결합 회피).

## 의존
grid-pro-filter 내부(신규 파일, MOD-46 식 타입 재사용). 신규 외부 dep 0.

## 분류 (MASTER §2)
selectionsToFilter = **종결형**(순수 매핑). 차트 클릭 wiring 없음.

## reuse-gate 결과 / 추측 0
재사용=MOD-46 AdvancedFilterExpr/evaluate. 신규=selectionsToFilter 매핑. 추측 0: AG cross-filter OR/AND 결합·typed=1차. panel UI=❌ 유지 명시.

## specify rubric (Full — 점수, 게이트 C)
- [x] Goal(cross-filter, AG 대응) **9/10** · [x] In/Out(순수 매핑 In·wiring/panel Out·panel ❌ 유지 명시) **10/10**
- [x] AC 측정(★OR-within/AND-across·typed, node) **10/10** · [x] reuse-gate(MOD-46 재사용·dep 방향·분할 1행) **10/10**
- [x] constraints(PAT-003·LESS-006·type 메타·dep 방향) **9/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(AG 1차) **9/10** · [x] 분류(§2 종결형) **10/10**
- **합계 77/80 — 게이트 통과.**

---

## G-1 결과 (완료 — 2026-06-07) → MOD-47 = {G-1} 완주, §3 이관
**구현**(신규 파일 `grid-pro-filter/src/crossFilter.ts`): `selectionsToFilter(selections)` — 필드별 그룹화(첫-등장 순서)→필드 내
eq OR·필드 간 AND·빈→무제약 group. `FilterSelection{field,type,value}`. index export. test 스크립트 추가.
**검증**: node **crossFilter.test.ts 15/0**(grid-pro-filter suite 53): 단일·★같은필드 OR·★다른필드 AND·★typed numeric(year 2024
& "2024")·combined(OR+AND)·빈→all-pass. evaluateAdvancedFilter(MOD-46) 합성으로 행동 검증. typecheck 0·build green.
**closure(advisor)**: cross-filter ❌→🟡(모델 ship·wiring browser). chart panel ❌ 유지(순수 UI). COMMERCIAL-GAP ❌36→35·🟡68→69
(Integrated charts 10/4/1·Enterprise 22→21). 신규 lesson 없음(MOD-46 재사용·type-메타 기존 규율).
