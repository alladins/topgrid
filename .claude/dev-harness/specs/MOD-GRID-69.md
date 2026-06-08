# MOD-GRID-69 — 시트 .xlsx 가져오기/내보내기 (Excel import/export of the spreadsheet, with formulas)

dev-harness 51번째 (**Enterprise ❌ backlog — 비-DnD tail 3**, advisor). grid-export(MIT/Lite).
갭분석 **Spreadsheet ❌ = Excel import/export of the spreadsheet (.xlsx with formulas)**(시트 엔진 수식을 .xlsx 로 직렬화/역직렬화 부재). 경쟁: Wijmo FlexSheet native .xlsx load/save(수식 보존).

## verify-first + 경계-read (advisor: library-edition-gated=LESS-004, 경계 먼저)
- ★**경계 실증(node probe)**: pinned `xlsx@0.18.5` 가 cell `.f`(수식) **write→read 라운드트립 보존**(A3 `=A1+A2` 생존 확인). `.s`(스타일)만 strip → **수식 import/export=가능, 스타일=별개 ❌(Excel cell styles, MOD-25 검증, 본 모듈 Out)**.
- grep: grid-export=TanStack 테이블 export 만(aoa_to_sheet, 값). 시트 엔진(createSheet) 직렬화 0. 신규.
- 재사용: grid-export xlsx(XLSX.read/write·book_new)·grid-pro-sheet cell map 계약(`setCell(ref,raw)`/`getRaw(ref)`, raw=`=A1+A2`|literal).
- **build-vs-defer(경계-read)**: 수식 라운드트립=community 가능 → **build ✅**(스타일은 별 ❌ 행=Out). Excel cell styles=경계상 deliverable partial 없음=정직 **❌ 유지**(별도, 본 모듈 무관).

## Goals
- **G-1 순수 변환 — 종결형(map)**:
  - `sheetRawToXlsxCell(raw): XlsxCell` — 시트 raw(`=A1+A2`|숫자|문자열)→xlsx cell(`{t:'n'|'s', v}` 또는 `{f}`).
  - `xlsxCellToSheetRaw(cell): string` — xlsx cell(`{v?,f?}`)→시트 raw(수식=`'='+f`, 값=String(v)).
  - node 검증: 수식/숫자/문자열/빈·라운드트립 항등.
- **G-2 xlsx 브리지 + 라운드트립(node) + chromium 가져오기**:
  - `exportSheetCellsToXlsx(cells: Record<ref,string>, filename?)` — 시트 cell map→worksheet(!ref bounding)→XLSX.write. `importXlsxToSheetCells(data: ArrayBuffer|Uint8Array): Record<ref,string>` — XLSX.read→cell map(수식 보존).
  - **★node 라운드트립(LESS-004)**: cells→export(buffer)→import→cells **항등**(수식 `=A1+A2` 생존, real xlsx lib).
  - **★chromium 발산**: 스토리서 base64 .xlsx(`=A1+A2`)→importXlsxToSheetCells→createSheet setCell→`SheetGrid` 가 **가져온 수식 계산값(30) 렌더**(엔진이 가져온 수식 평가).

## In / Out
- **In**: 순수 변환 2종+test + exportSheetCellsToXlsx/importXlsxToSheetCells + node 라운드트립 + index export + 스토리 + chromium.
- **Out(명시 — silent gap 금지)**:
  - **셀 스타일(font/fill/border)**: community xlsx 가 `.s` strip(MOD-25 검증) → 별 ❌ 행(Excel cell styles), 본 모듈 무관 = vN.
  - 멀티시트 .xlsx(Sheet2!) import = 단일 worksheet 우선 = vN.
  - 서식(number format `.z`)·머지·차트 = vN.

## ★ ❌ 닫힘 마커
- **Excel import/export of the spreadsheet(.xlsx with formulas) = ✅**: 수식 라운드트립 + chromium 가져오기. COMMERCIAL-GAP **Spreadsheet** 1 ❌→✅ → ❌12→11·✅244→245. reconcile 19/19·330.

## AC
G-1 변환 라운드트립(node) · G-2 cells→xlsx→cells 수식 항등(node, real lib) + ★가져온 수식 계산 렌더(chromium).

## constraints
- grid-export(MIT/Lite). xlsx=기존 dep. **LESS-004**: pinned edition 경계 라운드트립 실증(수식 생존·스타일 strip 명시). **LESS-006**: 가져오기 렌더=chromium.
- grid-pro-sheet 무수정(브리지=Record<ref,string> 계약, lib-agnostic). 기존 grid-export export 무수정.

## 의존
grid-export 내부(sheetXlsx + xlsx) ; story=grid-pro-sheet useSheet/SheetGrid + grid-export import(grid-export 에 grid-pro-sheet devDep, MOD-65 선례). 외부 0(xlsx=기존).

## 분류 (MASTER §2)
sheetRawToXlsxCell/xlsxCellToSheetRaw=**종결형**(순수 map). export/import+라운드트립=**배선형**(node lib+chromium).

## reuse-gate 결과 / 추측 0
재사용=grid-export XLSX.read/write·grid-pro-sheet setCell/getRaw 계약·MOD-25 라운드트립 규율(LESS-004). 신규=시트↔xlsx 브리지. 추측 0: xlsx@0.18.5 `.f` 라운드트립=probe 실증(1차), `.s` strip=MOD-25 검증.

## specify rubric (Full — 게이트 C)
- [x] Goal(변환 map + 브리지 라운드트립 end-to-end) **9/10** · [x] In/Out(스타일/멀티시트/서식 Out) **10/10** · [x] AC(변환 node·수식 라운드트립·가져오기 렌더 chromium) **10/10**
- [x] reuse-gate(xlsx·sheet 계약·MOD-25 LESS-004·경계 probe) **10/10** · [x] constraints(edition 경계 실증·grid-pro-sheet 무수정) **10/10** · [x] 의존(내부+story devDep, 외부 0) **9/10**
- [x] 추측 0(probe verified) **9/10** · [x] 분류(종결형+배선형) **9/10** · **합계 76/80 통과.**
