# MOD-GRID-40 — 스프레드시트 참조 모델 ($A$1 절대/혼합 참조 · copy/fill 상대참조 조정)

dev-harness 23번째 (vN 첫 모듈, MOD-39 이후). 갭분석 「기타 5」중 2건 = **$A$1 절대참조** · **상대참조 on copy/fill**.
MOD-26(수식 PoC)·MOD-32(엔진 심화)가 명시적으로 `vN` 으로 미룬 항목(MOD-32 §모듈완주 "vN: …$A$1+상대참조").
경쟁 대응: AG Grid headless fill/range API · Wijmo FlexSheet · Handsontable autofill · Excel 상대/절대 참조.

## reuse-gate (LESS-003)
- **이미 있음**(MOD-26/32): tokenizer→재귀하강 parser(`parseFormula`) · `evaluate(ast,getCell)`(error-aware) ·
  `extractRefs`(정적 walk, 의존그래프) · `createSheet`(증분 재계산·undo/redo) · `parseA1`/`toA1`/`expandRange`(cellAddress).
  ref 모델 = **정규화 A1 문자열**(`{kind:'ref', ref:'A1'}` · `{kind:'range', from, to}`). `$` **미처리**(tokenizer
  `$`→"unexpected char").
- **부재**(본 모듈 신규): ① ref 토큰의 `$` 인식 + 절대/혼합 플래그 ② **AST→수식텍스트 serializer**(현재 없음 — 엔진은
  parse 단방향) ③ **`translateFormula`**(copy/fill 시 상대참조 델타 이동·절대참조 고정).
- **★핵심 통찰 — `$` 는 평가-무관(eval-cosmetic)**: `$A$1` 은 `A1` 과 **같은 셀**로 해석된다. 따라서 ref 노드는
  `getCell`/`extractRefs` 용 **정규화 주소**(`ref:'A1'`)를 그대로 두고(→ `evaluate.ts`·`sheetEngine.ts` **수정 0**),
  절대 플래그는 **translate 만 읽는다**. = MOD-32 의 "extractRefs 가 모르는 노드 kind 금지(의존 누락→recalc 깨짐)" 교훈
  동형 — 새 kind 추가가 아니라 ref/range 노드에 **optional 플래그 추가**(기존 reader 무시).
- PAT-003(grid-pro-sheet Pro 게이트) 기존. PAT-005(getCell 주입) 무관(translate 는 순수 텍스트→텍스트).

## ★ 핵심 아키텍처 결정 (specify)
1. **절대 플래그는 ref/range 노드에 optional 필드로 추가, 정규화 주소는 유지**. `{kind:'ref', ref:'A1', colAbs?, rowAbs?}` ·
   range 는 endpoint 별 플래그(`fromColAbs`/`fromRowAbs`/`toColAbs`/`toRowAbs`). evaluate/extractRefs 는 `ref`(정규화)만 읽어
   **byte-identical**. **새 AST kind 금지**(`err` 제외, #3) — extractRefs 정적 walk 보존.
2. **serializer 는 col/row 산술을 cellAddress 에 위임**. 노드가 정규화 문자열만 들고 있으므로 translate 는 `parseA1(ref)`→
   델타 가산→`toA1`→플래그대로 `$` 재부착. (translate=비-hot path, 재파싱 비용 무시 가능.)
3. **out-of-bounds 상대이동 = `#REF!` 로 텍스트화, 라운드트립 가능해야 함**. 상대참조가 음수 col/row 로 밀리면 Excel 은
   `#REF!`. translate 결과가 다시 `setCell`→`compileCell`→`parseFormula` 를 타므로 **`#REF!` 가 파서를 통과해야 함** →
   **error-literal leaf 노드 `{kind:'err', code}`** 1종 추가(tokenizer `#…!` 인식 + parsePrimary + evaluate `cellError`
   반환 + extractRefs **default 무시**(ref 없음, 기존 `default: break` 가 이미 안전)). 최소·격리(≈15줄).
4. **literal 셀은 translate 무변**: `=` 로 시작 안 하면 원문 그대로(수식 아닌 셀은 fill 시 이동 대상 아님).

## Goals
- **G-1 절대/혼합 참조 파싱($A$1 / $A1 / A$1) — 종결형**:
  - tokenizer: ref 토큰을 `\$?[A-Za-z]+\$?[0-9]+` 로 인식(선두 `$` 또는 alpha 시작 모두 시도, trailing digit 있어야 ref·
    없으면 name). 토큰에 `colAbs`/`rowAbs` 동반, `v`=정규화(`$` 제거·대문자).
  - parser parsePrimary: ref→`{kind:'ref', ref, colAbs, rowAbs}`, range 엔드포인트별 플래그.
  - types.ts: ref/range 노드에 **optional** 절대 플래그(기존 노드 무플래그 = 상대, 하위호환).
  - **선행(검증 무결성)**: 파서 수술 전 MOD-26/32 회귀(node 66) green 핀 → 변경 후 green 유지.
  - **검증**: node — ① `=$A$1`·`=$A1`·`=A$1`·`=A1` 플래그 정확({T,T}/{T,F}/{F,T}/{F,F}) ② `$A$1` 가 `A1` 과 **동일 평가
    + 동일 의존추적**(createSheet: A1 설정→`=$A$1+1` 값, A1 편집→재계산). ★spine=평가-무관성을 의존그래프로 실증.
- **G-2 copy/fill 상대참조 조정(translateFormula) — 종결형**:
  - 신규 `serializeAst(ast):string`(AST→수식텍스트, err leaf 포함) + 공개 API `translateFormula(raw, dCol, dRow):string`.
  - 상대 부분만 `+델타`, 절대 부분 고정. range 양 엔드포인트 이동. out-of-bounds(음수)→ err 노드→`#REF!`.
  - tokenizer/parser `#REF!`(및 에러셋) error-literal 라운드트립.
  - **unparseable 처리**: `translateFormula('=A1++',…)` 는 `parseFormula` throw → **catch 후 raw 그대로 반환**(compileCell
    동형, 다운스트림이 `#ERROR!` 화). `=` 없으면 literal=무변.
  - **검증**: node — ③ `translateFormula('=A1+B1',1,2)`→`=B3+D3`(상대 이동) ④ `=$A$1+B1`,(1,0)→`=$A$1+C1`(절대 고정)·
    혼합 `=$A1`,(1,1)→`=$A2`(col 고정 row 이동) ⑤ out-of-bounds `=A1`,(−1,0)→`=#REF!` **+ 라운드트립**(setCell→값
    `#REF!`) ⑥ range `=SUM(A1:A2)`,(1,0)→`=SUM(B1:B2)` + **★혼합-절대 range `=SUM($A1:B$2)`,(1,1)→`=SUM($A2:C$2)`**
    (4-플래그 per-endpoint bookkeeping=실제 파손지점, advisor) + identity translate(0,0) 의미 보존 + unparseable=raw.
    ★spine=#REF! 라운드트립(translate 출력이 파서를 통과) + 혼합-range 4플래그.

## In / Out
- **In**: 절대/혼합 참조 **파싱·평가·의존추적** + `translateFormula` **엔진 프리미티브**(순수 텍스트→텍스트). node 검증.
- **Out(vN/후속)**: SheetGrid **fill-handle UI 제스처**(드래그-채우기)는 thin 소비자 배선 — 브라우저 층, **별도 UX 모듈**(MOD-49
  계열)로 분리. 멀티시트 참조=MOD-41. 셀 서식=vN.

## ★ ❌ 닫힘 마커 (advisor 정정 — over-claim 차단)
- **`$A$1 절대참조` = ✅**: 사용자가 `=$A$1` 입력→정확 평가+의존추적, 배선 0. 완결·node 실증.
- **`상대참조 on copy/fill` = 🟡 (NOT ✅)**: 본 모듈은 엔진 프리미티브 `translateFormula` 만 ship — 갭 항목이 명명하는 것은
  *제스처*(copy/fill 시 상대조정)이고 그건 **소비자(SheetGrid) 배선 필요**(=legend 🟡 정의 그대로). headless-API-only=🟡.
  **MOD-49 가 UI+non-vacuous chromium 으로 ✅ 승격**. (capture 시 COMMERCIAL-GAP 마커 = ✅+1 / 🟡+1.)

## AC (측정 가능)
- AC① 4종 ref 절대 플래그 정확(node assert) · AC② `$A$1`≡`A1` 평가+의존추적(createSheet recalc) · AC③ 상대 델타 이동 ·
  AC④ 절대/혼합 고정 · AC⑤ out-of-bounds `#REF!` **라운드트립** · AC⑥ range 이동 + identity 보존. **전부 node 결정 가능**.

## constraints
- **Pro**(grid-pro-sheet, PAT-003 기존). 외부 dep 0. C-003 주석↔소스. **LESS-006**: 본 모듈은 **순수 엔진**(파서/serialize/
  translate)이라 브라우저-게이트 행동 없음 → node 전수로 충분(fill-handle UI 만 브라우저, 그건 Out). MOD-26/32 엔진 동작
  보존(characterization 회귀 66 green 유지).

## 의존
grid-pro-sheet 내부. 신규 외부 dep 0.

## 분류 (MASTER §2)
절대/혼합 참조 파싱·평가 = **종결형**(순수 파서/evaluate) · serialize/translate = **종결형**(순수 텍스트 변환). 워크플로/연결/트리거 없음.

## reuse-gate 결과 / 추측 0
- 재사용: parser·evaluate·extractRefs·createSheet·cellAddress 전부 기존(중복 작성 0). 신규=tokenizer `$`·플래그·serializer·translate.
- 추측 0: 절대/혼합 참조 의미(`$col$row` 고정 축)·#REF! on out-of-bounds = Excel/AG/Wijmo **1차 동작**(공통). 미확인 없음.

## specify rubric (Full — 점수 영속화, 진입 게이트 C)
- [x] **Goal** 1문장 — 절대/혼합 참조 + copy/fill 상대조정, 경쟁 대응(Excel/AG/Wijmo) 명시. **9/10**
- [x] **In/Out** — 엔진 프리미티브 In, fill-handle UI Out(MOD-49), 멀티시트 Out(MOD-41). **10/10**
- [x] **AC 측정가능** — AC①~⑥ 전부 node assert(플래그값·평가등가·텍스트출력·라운드트립). 모호어 0. **10/10**
- [x] **reuse-gate 반영** — 기존 5소스 인용, 신규 3항만 식별, 중복 0. **10/10**
- [x] **constraints** — PAT-003·C-003·LESS-006(순수=node 충분) 명시. **9/10**
- [x] **의존** — 내부만, 외부 dep 0(AP-001 vacuous). **10/10**
- [x] **추측 0** — 절대참조/`#REF!` 의미 1차 출처. **9/10**
- [x] **분류** — §2 종결형 ×2. **10/10**
- **합계 77/80 — 게이트 통과(≥56=70%).**

---

## G-1 결과 (완료 — 2026-06-06)
**구현**: `types.ts` ref/range 노드에 **optional** `colAbs`/`rowAbs`(range=endpoint별 4플래그) + `err` leaf(`{kind:'err',code}`).
`parser.ts` tokenizer: ref = `/^(\$?)([A-Za-z]+)(\$?)([0-9]+)/`(선두 `$` 또는 alpha 시도, 후행 숫자 필수→ref·없으면 name)
→ 토큰에 colAbs/rowAbs + 정규화 v. `#…!` error-literal(ERROR_CODES 화이트리스트). parsePrimary: ref/range 플래그 부착·err 노드.
- **★`$`=eval-cosmetic**: ref 노드가 **정규화 주소**(`ref:'A1'`)를 유지 → `evaluate.ts`·`sheetEngine.ts`·`extractRefs` **수정 0**
  (byte-identical). 절대 플래그는 G-2 translate 만 읽음. extractRefs `default: break` 가 err leaf 안전 무시(편집 후 확인).
- **검증**: serialize 라운드트립으로 플래그 실증(`$A$1`/`$A1`/`A$1`/`A1` + lowercase 정규화) + ★`$A$1`≡`A1` 평가+의존추적
  (createSheet: `=$A$1+1`→11, A1 10→20→B1 21 recalc).

## G-2 결과 (완료 — 2026-06-06) → MOD-40 = {G-1,G-2} 완주, §3 이관
**구현**: `evaluate.ts` 신규 `serializeAst`(AST→수식텍스트, **precedence-aware**: child prec < parent → 괄호, 비교환 우변 `-`/`/`
동일 prec 도 괄호) + `translateFormula(raw,dCol,dRow)`(상대 +델타·절대 고정·out-of-bounds→err `#REF!`·unparseable→raw catch) +
`shiftAst`/`shiftAddr`. `cellAddress.ts` `colToLetters` 추출(toA1 와 serializer 공유, DRY). evaluate `case 'err'` (cellError 반환).
- **검증**: node **engine.test.mjs 87/0** = MOD-26/32 characterization/G-1/G-2/G-3 **66 보존** + MOD-40 **21**:
  - G-1: ref 플래그 5 + `$A$1` 평가등가/의존추적 2.
  - G-2: 상대 shift(`=A1+B1`,(1,2)→`=B3+C3`) · 절대 고정 · 혼합 col-abs/row-abs · out-of-bounds `=#REF!` + **★라운드트립**(setCell→값
    #REF!) · partial(`=A1+B1`,(−1,0)→`=#REF!+A1`) · range shift · **★혼합-range 4플래그**(`=SUM($A1:B$2)`,(1,1)→`=SUM($A2:C$2)`) ·
    identity(0,0) · literal 무변 · unparseable raw · precedence 보존(`=(A1+B1)*2`·`=A1-(B1-C1)`).
  - typecheck **0**(exactOptionalPropertyTypes: shiftAst 재구성 시 `?? false` 로 boolean 보정) · tsup build **green**(ESM+CJS+DTS).
- **★검증 무결성 일화**: 첫 작성 시 `=A1+B1`,(1,2) 기대를 `=B3+D3` 로 적었으나 fail — `B1`(col-1)+1col=`C`=`C3`(≠`D3`). **구현이 옳고
  기대가 틀림**(구현-도출이 아닌 *명세*-도출로 교정, advisor "avg-of-avgs 함정 회피" 표준). → `=B3+C3`.
- **★closure 정직(advisor)**: `$A$1 절대참조`=**✅** / `상대참조 on copy/fill`=**🟡**(엔진 프리미티브+node only, SheetGrid fill-handle
  UI 제스처=소비자 배선 미완 → MOD-49 가 UI+non-vacuous chromium 으로 ✅ 승격). COMMERCIAL-GAP: ❌47→45·✅218→219·🟡62→63
  (reconcile 19/19·합 330 검산 통과).
- **scope(advisor)**: 순수 엔진 — 브라우저 행동 0 → node 가 검증 ceiling(browser 테스트 추가=vacuity 역함정). 멀티시트=MOD-41·셀서식=vN.

## 모듈 완주 요약
2-Goal: G-1 절대/혼합 참조(`$`=eval-cosmetic→정규화 주소 유지로 evaluate/extractRefs 무수정, 플래그=optional) · G-2 translateFormula
(precedence-aware serializer + shiftAst, out-of-bounds #REF! 라운드트립). 신규 [[LESS-007]](precedence-aware serialization).
node 87/0(66 characterization 보존). vN: fill-handle UI(MOD-49)·멀티시트(MOD-41)·셀서식.
