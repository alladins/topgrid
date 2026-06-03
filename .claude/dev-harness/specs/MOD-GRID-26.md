# MOD-GRID-26 spec — `grid-pro-sheet` (spreadsheet PoC, **Pro**, partial §10.3)

> dev-harness loop 10번째. 첫 스프레드시트(별제품급 — **PoC 후 단계적**). weight=Full(3-Goal PoC) → partial(PoC →§3,
> 풀 스프레드시트 vN). Pro → **PAT-003**. 첫 ADR 재독: ADR-001 N=2 트리거(피벗 reducer vs sheet 수식 함수).
> reuse-gate(LESS-003): grid-pro-range 가 셀 편집(`useKeyboardEdit`)·클립보드(`useClipboard`/`parseTsv`)·범위
> 선택(`useCellRange`) 보유 → G-3 재사용. grid-pro-pivot `BUILT_IN_REDUCERS`(sum/avg/min/max/count over `number[]`,
> **null-on-empty**)는 **재사용 불가**(아래 ADR-002): sheet 함수는 **error-aware 입력** + 시트 의미론(SUM([])=0,
> AVERAGE([])=#DIV/0!) → 입력 계약이 다름.

## ★ 값 모델 (advisor — 최우선 결정, 전부 이걸 관통)
**PoC 셀 값 = `CellValue = number | string | boolean | CellError`** (`number|string` 아님).
`CellError = { readonly error: ErrorCode }`, `ErrorCode ∈ {'#DIV/0!','#CYCLE!','#REF!','#ERROR!'}`.
모든 수식 함수는 **error-aware 입력**을 받고 **전파**한다(인자 중 에러 하나라도 → 에러 출력). 평가기를 처음부터
error-aware 로 빌드(나중에 bolt-on 하면 평가기+전 함수 재작성). AC② 재계산이 암묵적으로 요구(순환/깨진 셀도
*정의된* 값을 내야 함).

## ★ 척추 불변식 (advisor — G-2, 전부 node-decidable)
1. **순환 검출**: `A1=B1, B1=A1` → `#CYCLE!`, **stack overflow 없이**(topo-sort/visited-set; 순진한 재귀 평가기는 스택 폭발).
2. **전이 재계산 순서**: `A1=1, B1=A1+1, C1=B1+1`; A1 편집 → B1 그다음 C1, **각 1회**, 의존 순서대로.
3. **그래프 에러 전파**: `A1=1/0` → `B1=A1+1` 은 `#DIV/0!`(NaN/throw 아님).
→ 컨트롤러 레벨 검증(셀 편집 → 의존 셀이 순서대로·1회씩 재계산) = G-2 의 G-2-컨트롤러-테스트 아날로그.

## Goal (PoC)
Excel-류 수식 셀 — A1 참조 + 사칙 + SUM/AVERAGE/MIN/MAX/COUNT, 셀 의존 그래프 재계산. 경쟁: Wijmo FlexSheet,
Handsontable, SyncFusion Spreadsheet.

## Scope (PoC — AC①②③ 한정)
- **In**: G-1 수식 엔진(tokenize→parse→evaluate(ast, getCell)+extractRefs, 순수). G-2 의존 그래프 재계산+척추.
  G-3 thin 시트 그리드(grid-pro-range 편집/클립보드/범위 재사용).
- **Out(vN — 명시)**: 멀티탭 시트, 셀 서식, **상대참조 조정(copy/fill 시 `$A$1`/ref-rewrite)** — PoC 참조=절대 lookup,
  copy=**값 복사**(formula 복사는 ref 조정 함의 → out), range `fillRange`/drag-fill. 수백 함수.

## Goals
- **G-1 순수 수식 엔진 — ★ node 검증**:
  - 값 모델(`CellValue`/`CellError`/`isCellError`).
  - tokenizer(number/string/bool/cellRef `A1`/rangeRef `A1:B3`/funcName/연산자 `+-*/`/paren/comma) → parser(재귀하강,
    `*/`>`+-`, 단항 -, 괄호, 함수호출) → AST.
  - `evaluate(ast, getCell): CellValue` — `getCell(ref) => CellValue` **주입(PAT-005 host-capability-injection)**.
    에러 전파. `/0`→#DIV/0!, 비-수치 산술→#ERROR!, 미지 함수→#ERROR!.
  - `extractRefs(ast): CellRef[]` — **같은 parse 에서**(G-2 가 재-parse 안 함). 범위는 셀 목록으로 확장.
  - 함수 SUM/AVERAGE/MIN/MAX/COUNT(error-aware, 시트 의미론). **로컬 구현(ADR-002)**.
- **G-2 의존 그래프 재계산 + 척추**:
  - `extractRefs` → DAG. 셀 편집 시 영향받는 셀만 위상순 재계산(각 1회). 순환→#CYCLE!. 에러 전파.
  - React-free `SheetController`(node 검증) — 셀 set → 재계산 → 변경 셀 emit.
- **G-3 thin 시트 그리드 (재사용 게이트)**:
  - 셀 = **수식 저장, 값 표시**(stored≠rendered). grid-pro-range `useKeyboardEdit`(편집 시 `=A1+A2` 노출, commit 시 re-parse)
    + `useClipboard`(copy=값) + `useCellRange` 재사용. **`useKeyboardEdit` 가 backing≠rendered 편집 가능한지 검증**(불가 시 thin wrapper).
  - chromium 게이트: `=A1+A2` 입력 → 합 표시; A1 편집 → 수식 셀 갱신.

## AC (PoC)
1. A1 참조 + 사칙·SUM/AVERAGE 평가(error-aware) — node(G-1) + chromium(G-3).
2. 셀 의존 그래프 재계산(편집 → 의존 셀 순서·1회·순환#CYCLE!·에러 전파) — node(G-2).
3. grid-pro-range 편집/클립보드 재사용 — G-3.

## constraints
- **PAT-003 (Pro)**: checkLicense + grid-license + EULA. dist 금지어 0.
- **PAT-005**: `getCell` 주입으로 엔진 순수(호스트 셀 저장소 무관). N 점검(MOD-19 renderChart, 20 measure, 본 getCell).
- **AP-001**: G-1/G-2 외부 optional peer import 0(순수). G-3 만 react/range/grid-core peer.
- **C-003**: 주석↔소스. PoC 한계(절대참조·값복사·5함수) 명시. **LESS-006**: G-3 ON 경로 브라우저 게이트.
- **ADR-002**: ADR-001 N=2 재독 → still local(입력 계약 error-aware ≠ number[]).

## 의존
신규 `packages/grid-pro-sheet`. peer: react, @tanstack/react-table, @topgrid/grid-core, @topgrid/grid-pro-range.
runtime: @topgrid/grid-license. 신규 외부 dep 0.

## 분류 (MASTER §2)
tokenizer/parser/evaluate/extractRefs/의존그래프 = **종결형(순수)**. SheetController/useSheet = **연동형**.

## 수확 예상 (capture 시 검증)
reuse = PAT-001 + PAT-005(getCell 주입, N=?) + grid-pro-range 편집/클립보드/범위(G-3) + PAT-003. 신규 = 수식 엔진 +
의존 그래프 척추. **ADR-002**(N=2≠자동추출 — 입력 계약 상이, 깨끗한 컴파운딩 데이터포인트). **LESS-006** G-3 적용.
PAT 후보: error-aware-value-propagation? async-race 아닌 에러-전파 불변식(N 점검).
