# MOD-GRID-62 — 시트 셀 숫자 서식 (cell / number formatting: currency·percent·decimals·date)

dev-harness 44번째 (**Enterprise ❌ backlog — Tier 4 sheet, node-pure**, advisor). grid-pro-sheet(Community 스코프).
갭분석 **Spreadsheet ❌ = Cell / number formatting (currency, date, decimals, conditional format)**. 경쟁: Wijmo FlexSheet `.format`·Excel number formats.

## verify-first + reuse-gate
- grep: grid-pro-sheet=number/cell format 0(SheetGrid 는 getDisplay 문자열 그대로 표시). genuine 부재.
- 재사용: SheetGrid getDisplay(표시값=stored≠rendered, MOD-26)·SheetGrid 셀 렌더. 신규=순수 서식 함수 + formats prop. 엔진(createSheet) 무수정(표시값 파싱·포맷).
- **conditional format = Out**(별도; grid-features buildCellClassName=MOD-24 가 그리드급 조건부서식 보유). 본 모듈=number/currency/percent/date 서식.

## Goals
- **G-1 순수 서식 함수 — 종결형**:
  - 순수 `formatSheetValue(display: string, format?: SheetCellFormat): string`. format 미지정→display 그대로. 비수치→그대로(에러/문자열 보존). **deterministic**(Intl 미사용=locale 무관):
    number(천단위 그룹+decimals)·currency(심볼+그룹+decimals)·percent(×100+decimals+%)·date(serial days→ISO yyyy-mm-dd). **node 검증**.
- **G-2 SheetGrid formats 배선 (chromium 발산) — 배선형**:
  - SheetGrid `formats?: Record<cellRef, SheetCellFormat>` prop. 표시 시 `formatSheetValue(getDisplay(ref), formats[ref])`. 미지정 셀=기존 동작(byte-identical).
  - **검증 ★발산(advisor, "숫자 보임"=vacuous 금지)**: ① currency 셀=`$1,234.50`(그룹+심볼+소수) ② percent 셀=`12.5%`(×100) ③ decimals 셀=고정 소수 ④ 비수치(수식 에러/문자열)=그대로 ⑤ formats 미지정 셀=원시 display(byte-identical).

## In / Out
- **In**: 순수 `formatSheetValue` + `SheetCellFormat` 타입 + node test + SheetGrid `formats` prop + 스토리. 엔진/getDisplay 무수정.
- **Out**: conditional format(MOD-24 그리드급 존재) · per-cell font/fill/border(=cell styling, 별도 ❌) · 사용자 커스텀 format 패턴 문자열(`#,##0.00` DSL=후속).

## ★ ❌ 닫힘 마커
- **Cell / number formatting = ✅**: currency/percent/decimals/date 서식(순수 deterministic + SheetGrid 배선). COMMERCIAL-GAP **Spreadsheet** 1 ❌→✅ → ❌19→18·✅238→239. reconcile 19/19·330.

## AC
G-1 currency/percent/decimals/date 포맷·비수치 보존·미지정 passthrough(node). G-2 SheetGrid 서식 표시·미지정 byte-identical(chromium 발산).

## constraints
- grid-pro-sheet(Pro 패키지지만 sheet 기능=Community 스코프). 외부 dep 0. **LESS-006**: 서식 correctness=node(순수), SheetGrid 표시=chromium.
- **deterministic(Intl 미사용)**: locale/node 버전 무관 — node 단언 안정.
- 엔진(createSheet)·getDisplay·기존 SheetGrid 셀 무수정(formats prop additive, 미지정=passthrough byte-identical).

## 의존
grid-pro-sheet 내부(신규 internal/formatSheetValue + test + SheetGrid formats prop + types). story=SheetGrid(formats). 외부 0.

## 분류 (MASTER §2)
formatSheetValue=**종결형**(순수). SheetGrid formats 배선=**배선형**(chromium).

## reuse-gate 결과 / 추측 0
재사용=SheetGrid getDisplay(표시값). 신규=순수 서식 함수+formats prop. 추측 0: Wijmo FlexSheet .format·Excel number format=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(number formatting, node-pure+배선) **9/10** · [x] In/Out(conditional/cell-styling Out) **10/10** · [x] AC(포맷 4종·비수치·passthrough node+chromium) **10/10**
- [x] reuse-gate(getDisplay 재사용·엔진 무수정·deterministic) **10/10** · [x] constraints(Intl 미사용·byte-identical) **10/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(종결형+배선형) **9/10** · **합계 77/80 통과.**

---

## G-1·G-2 결과 (완료 — 2026-06-08) → MOD-62 = {G-1,G-2} 완주, §3 이관
**구현**(grid-pro-sheet, 엔진/getDisplay 무수정): 순수 `formatSheetValue(display, SheetCellFormat)`(number/currency/percent/date, deterministic=Intl 미사용, groupThousands/serialToISO) + SheetGrid `formats?:Record<ref,SheetCellFormat>` prop(표시 시 적용) + index export.
**검증**: **node 14/0**(`formatSheetValue.test.ts`: currency/percent/decimals/date·비수치 passthrough·grouping·negative·미지정) · typecheck 0 · build green · **chromium 1/1**(`sheet-number-format.spec.ts`) + **full-suite 107/107 green**.
- ★currency $1,234.00 · percent 12.5% · decimals 5.00 · 비수치(에러/문자열) passthrough · formats 미지정 셀 raw(byte-identical).

## ★ closure + 발견 (advisor)
- **Cell / number formatting = ✅**: number/currency/percent/date 서식(순수 deterministic + SheetGrid 배선). **Spreadsheet 14/6/3→15/6/2**. COMMERCIAL-GAP **❌19→18·✅238→239·🟡70**(reconcile 19/19·330·0 mismatch). Community ❌8→7.
- **★엔진 무수정**: getDisplay(표시값) 파싱·포맷 = MOD-26 stored≠rendered 원칙 보존. node-pure correctness(14/0)+chromium 표시 발산(LESS-006).
- **★deterministic(Intl 미사용)**: locale/node 버전 무관 → node 단언 안정. conditional format=Out(MOD-24 그리드급 buildCellClassName 존재).

## 모듈 완주 요약
2-Goal: Enterprise backlog 9번째(advisor Tier 4 sheet, node-pure). 순수 formatSheetValue(node 14/0)+SheetGrid formats prop. 엔진 무수정(표시값 포맷). node correctness+chromium 표시. 신규 lesson 없음.
