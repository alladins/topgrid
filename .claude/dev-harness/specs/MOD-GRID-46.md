# MOD-GRID-46 — 고급 필터 식 모델 + 평가기 (advanced filter expression)

dev-harness 29번째 (vN-7). 갭분석 Filtering ❌ 1 = **Advanced filter (cross-column expression/query builder UI)** — Enterprise.
경쟁: AG Advanced Filter(Enterprise). ★node-pure 추출 = 식 모델 + 평가기 + 연산자 매처; **쿼리빌더 UI = browser**.

## reuse-gate (LESS-003) + 분할
- **이미 있음**(MOD-30): `makeMultiFilterFn`(**단일 컬럼** AND/OR, base FilterFn N회 reduce, autoRemove 로 빈 조건 제거) ·
  base `textFilterFn`/`numberFilterFn`(grid-features, **TanStack Row-based**).
- **부재**: **cross-column 중첩** 식(`(A>5 AND B='x') OR C contains 'y'`). makeMultiFilterFn 은 flat 단일컬럼 reduce → 트리 평가기 신규.
- **★분할(advisor)**: advanced filter = "expression/query builder **UI**" → node-pure substance = **식 모델 + 재귀 평가기 + 순수 연산자
  매처**(cross-column). **쿼리빌더 UI(조건 추가/삭제/중첩, 드롭다운) = browser**(후속).
- 재사용: MOD-30 매처 **의미**만 미러(case-insensitive contains 등) — **Row-based FilterFn import 금지**(계약 상이). 신규 순수 raw-value 매처.

## ★ 핵심 결정 (advisor)
1. **condition 노드에 명시적 `type`**(cross-column 정확성 키): `{field, type:'number'|'text'|'boolean'|'date', operator, value?}`. 연산자
   의미가 타입에 의존(`"100">"9"` lexical=틀림) → `typeof row[field]` 추론 금지(행마다 다름·null 깨짐). ★numeric vs text 발산 테스트.
2. **빈/불완전 조건 = inert(제거)**: group 평가 전 inert 자식 제거 후 reduce(빈/all-inert group→true=무제약). **빈 조건을 OR 에 true 로 in-place
   두면 전체-행 붕괴**(MOD-30 autoRemove 함정) → 제거. blank/notBlank 연산자는 value 불요(항상 active).
3. **unknown operator → false**(정의된 fallback, switch fallthrough 아님 — false="미매치"가 true="전체매치"보다 안전).

## Goals
- **G-1 식 모델 + 평가기 — 종결형(순수)**:
  - 모델: `AdvancedFilterExpr = FilterGroup{kind:'group',logic:'and'|'or',children} | FilterCondition{kind:'condition',field,type,operator,value?}`.
  - `evaluateAdvancedFilter(expr, row)`: group=inert 제거 후 reduce(and=every·or=some, 빈→true)·condition=`matchCondition`.
  - `matchCondition(rowValue, type, operator, value)`: 순수 연산자(eq/neq/gt/lt/gte/lte/contains/startsWith/endsWith/blank/notBlank).
    number=Number 강제(NaN→false)·text=case-insensitive·boolean·date=시각 비교. blank=null/undefined/''. unknown op→false.
  - `makeAdvancedFilterFn(expr) → (row)=>boolean`(소비자 global/table 필터로 사용).
  - **검증**: node — ★type별 발산(number gt vs lexical: "100" gt 20 → number=true·lexical 틀림)·중첩 group(AND/OR)·★blank 조건 inert
    (OR(blank, real)→real 지배, 전체-행 아님)·빈 group→true·unknown op→false·blank/notBlank·각 연산자.

## In / Out
- **In**: 순수 식 모델 + 평가기 + 매처 + `makeAdvancedFilterFn`(소비자 적용). node 검증.
- **Out(browser/후속)**: 쿼리빌더 **UI**(조건 추가/삭제/중첩 그룹, 컬럼·연산자·값 드롭다운, 식↔UI 동기화).

## ★ ❌ 닫힘 마커 (advisor — 🟡)
- **advanced filter = 🟡**: 식 모델+평가기+매처 ship+node, **쿼리빌더 UI 부재**(gap 이 "query builder UI" 명명) → browser.
- COMMERCIAL-GAP: **1 ❌→🟡** → ❌37→36·✅223·🟡67→68(Filtering +1🟡/−1❌·Enterprise 23→22).

## AC (측정 가능)
G-1: ★type 발산·중첩 AND/OR·★blank inert·빈 group→true·unknown op→false·각 연산자. 전부 node.

## constraints
- **Pro**(grid-pro-filter, PAT-003). 외부 dep 0. C-003. **LESS-006**: 순수 → node ceiling(쿼리빌더 UI=browser=Out). MOD-30 매처 의미
  미러(import 금지, 계약 상이). cross-column type 명시(silent mis-type 금지).

## 의존
grid-pro-filter 내부(신규 파일). 신규 외부 dep 0.

## 분류 (MASTER §2)
식 모델·평가기·매처 = **종결형**(순수). 쿼리빌더 UI wiring 없음(소비자 적용).

## reuse-gate 결과 / 추측 0
재사용=MOD-30 매처 의미(미러, import 0). 신규=식 모델·트리 평가기·순수 raw-value 매처. 추측 0: AG advanced filter cross-column
중첩·연산자 = 1차. type 명시·blank inert·unknown→false = 명시·테스트.

## specify rubric (Full — 점수, 게이트 C)
- [x] Goal(cross-column 식, AG 대응) **9/10** · [x] In/Out(순수 모델/평가기 In·쿼리빌더 UI Out) **10/10**
- [x] AC 측정(★type 발산·blank inert·unknown op, node) **10/10** · [x] reuse-gate(MOD-30 의미 미러·import 금지·트리 신규) **10/10**
- [x] constraints(PAT-003·LESS-006·type 명시) **9/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(AG 1차·의미 명시) **9/10** · [x] 분류(§2 종결형) **10/10**
- **합계 77/80 — 게이트 통과.**

---

## G-1 결과 (완료 — 2026-06-07) → MOD-46 = {G-1} 완주, §3 이관
**구현**(신규 파일 `grid-pro-filter/src/advancedFilter.ts`):
- 모델 `AdvancedFilterExpr` = `FilterGroup{kind:'group',logic,children}` | `FilterCondition{kind:'condition',field,type,operator,value?}`.
- `evaluateAdvancedFilter(expr,row)`: group=inert 제거 후 reduce(and every·or some·빈→true)·condition=matchCondition.
- `matchCondition(rowValue,type,operator,value)`: number(Number 강제·NaN→false)·text(case-insensitive·null→false)·boolean·date(시각).
  blank/notBlank·unknown op→false. `makeAdvancedFilterFn(expr)→(row)=>boolean`. index export(5 심볼).
- package.json test 에 advancedFilter.test.ts 추가.

**검증**: node **advancedFilter.test.ts 25/0**(grid-pro-filter suite 38=makeMultiFilterFn 13+25): ★type 발산(number gt 20 on
"100"=true·text gt "20"=false)·각 연산자(number/text/boolean/date·blank/notBlank)·중첩 cross-column AND/OR·★blank 조건 inert
(OR(blank,real-fails)→false=전체-행 아님)·빈 group→true·unknown op→false. typecheck 0·tsup build green.

## ★ closure (advisor — 🟡)
- **advanced filter = 🟡**: 식 모델+평가기+매처 ship+node, gap 이 "query builder **UI**" 명명 → 쿼리빌더 UI=browser.
- COMMERCIAL-GAP: **1 ❌→🟡** → ❌37→36·✅223·🟡67→68(Filtering 12/1/0·Enterprise 23→22).

## 모듈 완주 요약
1-Goal: cross-column 중첩 식 모델+재귀 평가기+순수 매처. ★type 명시(cross-column 정확성, 발산 테스트)·MOD-30 매처 의미 미러
(import 금지)·blank inert(OR 붕괴 차단)·unknown op→false. node 25/0. 신규 lesson 없음. 분할 잔여=쿼리빌더 UI(browser).
