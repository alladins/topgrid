# MOD-GRID-63 — 시트 셀 스타일 (cell styling: fonts·fill·borders·alignment)

dev-harness 45번째 (**Enterprise ❌ backlog — Tier 4 sheet**, advisor). grid-pro-sheet(Community 스코프).
갭분석 **Spreadsheet ❌ = Cell styling: fonts, fill, borders, alignment, merged cells**. 경쟁: xxxx FlexSheet per-cell font/fill/border.

## verify-first + reuse-gate
- grep: SheetGrid 고정 cellStyle 1개(per-cell 스타일 0). genuine 부재. MOD-62 formatSheetValue(자매=서식). 신규=per-cell 스타일.
- 재사용: SheetGrid 셀 td(style 인라인)·MOD-62 formats prop 패턴(per-cell Record). 신규=순수 styleToCss + cellStyles prop. 엔진 무수정.
- **merged cells = Out**: 시트 셀 병합은 별개(그리드 병합=grid-pro-merging MOD-13/52). 본 모듈=fonts/fill/borders/alignment 스타일.

## Goals
- **G-1 순수 styleToCss + SheetGrid cellStyles 배선 — 종결형(map)+배선형(render)**:
  - 순수 `sheetStyleToCss(SheetCellStyle): CSSProperties`(bold→fontWeight·italic→fontStyle·color·background·align→textAlign·border→border). node 검증(map).
  - SheetGrid `cellStyles?: Record<cellRef, SheetCellStyle>` prop → td style 에 병합(미지정=기존 고정 style, byte-identical).
  - **검증 ★발산(advisor, "셀 보임"=vacuous 금지)**: ① bold 셀=fontWeight bold(computed) ② background 셀=배경색 ③ align right=text-align right ④ 미지정 셀=기존 style(byte-identical). node: styleToCss 매핑.

## In / Out
- **In**: 순수 `sheetStyleToCss` + `SheetCellStyle` 타입 + node test + SheetGrid `cellStyles` prop + 스토리. 엔진/getDisplay 무수정.
- **Out**: merged cells(시트 병합=별개 vN; 그리드 병합=grid-pro-merging) · 스타일 편집 UI(toolbar) · 조건부 스타일(MOD-24 그리드급).

## ★ ❌ 닫힘 마커
- **Cell styling = ✅**(fonts/fill/borders/alignment): per-cell 스타일(순수 map + SheetGrid 배선). merged cells=Out 명시. COMMERCIAL-GAP **Spreadsheet** 1 ❌→✅ → ❌18→17·✅239→240. reconcile 19/19·330.

## AC
G-1 styleToCss 매핑(node) · bold/bg/align 발산·미지정 byte-identical(chromium).

## constraints
- grid-pro-sheet(Community 스코프). 외부 dep 0. **LESS-006**: 스타일 표시=브라우저→chromium 발산. 순수 map=node.
- 엔진/getDisplay/기존 SheetGrid 고정 style 무수정(cellStyles 미지정=기존 동작 byte-identical).

## 의존
grid-pro-sheet 내부(신규 internal/sheetStyleToCss + test + SheetGrid cellStyles prop + types). story=SheetGrid(cellStyles). 외부 0.

## 분류 (MASTER §2)
sheetStyleToCss=**종결형**(순수 map). SheetGrid cellStyles 배선=**배선형**(chromium).

## reuse-gate 결과 / 추측 0
재사용=SheetGrid td 인라인 style·MOD-62 per-cell prop 패턴. 신규=순수 styleToCss+cellStyles prop. 추측 0: xxxx FlexSheet per-cell font/fill/border=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(cell styling, map+배선) **9/10** · [x] In/Out(merged cells/toolbar Out) **10/10** · [x] AC(map node·bold/bg/align·byte-identical chromium) **10/10**
- [x] reuse-gate(td style·MOD-62 패턴·엔진 무수정) **10/10** · [x] constraints(byte-identical·LESS-006) **10/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(종결형+배선형) **9/10** · **합계 77/80 통과.**

---

## G-1 결과 (완료 — 2026-06-08) → MOD-63 = 🟡 부분(styling delivered, merged cells vN), §3 이관
**구현**(grid-pro-sheet, 엔진/고정 style 무수정): 순수 `sheetStyleToCss(SheetCellStyle)→CSSProperties`(bold/italic/color/background/align/border, set props 만) + SheetGrid `cellStyles?:Record<ref,SheetCellStyle>` prop(td 병합, 선택 하이라이트 우선) + index export.
**검증**: **node 10/0**(`sheetStyleToCss.test.ts`: bold/italic/color/bg/align/border·empty·combined·미설정 omit) · typecheck 0 · build green · **chromium 1/1**(`sheet-cell-style.spec.ts`) + **full-suite 108/108 green**.
- ★A1 bold(computed fontWeight 700)·B1 fill(background rgb(255,238,238))·C1 align right·미지정 D1 base(byte-identical).

## ★ closure + 발견 (advisor)
- **Cell styling = 🟡 부분**(fonts/fill/borders/alignment 전달): per-cell 스타일(순수 map + SheetGrid 배선). **Spreadsheet 15/6/2→15/7/1**(❌→🟡). COMMERCIAL-GAP **❌18→17·✅239·🟡70→71**(reconcile 19/19·330·0 mismatch). Community ❌7→6.
- **★🟡(✅ 아님) 정직 판단**: 갭 행이 "fonts, fill, borders, alignment, **merged cells**" 번들 — styling 4종 전달, **merged cells(시트 셀 병합)=미전달(vN)** → over-claim 회피로 🟡. 시트 셀 병합은 별개 큰 기능(그리드 병합=grid-pro-merging MOD-13/52).
- MOD-62(서식)의 자매. 엔진 무수정. node-pure map+chromium computed style 발산.

## 모듈 완주 요약
1-Goal(🟡): Enterprise backlog 10번째(advisor Tier 4 sheet). 순수 sheetStyleToCss(node 10/0)+SheetGrid cellStyles prop. merged cells=vN로 🟡(정직). 엔진 무수정(108/108). 신규 lesson 없음.
