# MOD-GRID-32 — 스프레드시트 심화 (비교/논리 함수 · text/math · undo/redo)

dev-harness 15번째. 갭분석 Spreadsheet(Wijmo FlexSheet, 미구현 9). MOD-26 `grid-pro-sheet` PoC(A1·=수식·
SUM/AVG/MIN/MAX/COUNT 5함수·의존그래프 재계산·순환검출)를 **심화**한다.

## reuse-gate (LESS-003)
- **이미 있음**(MOD-26): 순수 엔진 `internal/{parser,evaluate,functions,cellAddress,sheetEngine}` + `createSheet`
  (raw/compiled/values/deps Map, 증분 재계산 `recompute(downstream)`) + `useSheet`/`SheetGrid`. `CellValue =
  number|string|boolean|CellError`(boolean 1급). AST: num·str·bool·ref·range·call·**binary(+−*/)**·unary.
- **재사용 계약**: `FUNCTIONS: Record<string,(values: CellValue[])=>CellValue>` = **flat-values**(인자 eager
  flatten). `extractRefs` 는 AST 정적 walk(ref·range·unary·**binary(left/right)**·**call(args)**) → 의존그래프.
- PAT-003 기존(grid-pro-sheet Pro).

## ★ 핵심 아키텍처 결정 (advisor — 의존그래프를 구성상 맞히기)
1. **비교연산자는 기존 `binary` 노드 op 를 확장**(`<` `>` `=` `<=` `>=` `<>`). **새 노드 kind(`'compare'`) 금지** —
   extractRefs 가 정적 walk 라 모르는 kind 는 **의존 ref 조용히 누락→recalc 깨짐**. binary 로 두면 extractRefs **수정 0**
   (left/right 이미 walk). 확인 완료: extractRefs 가 binary·call 모두 walk.
2. **IF/AND/OR/NOT 은 `call` 노드 유지**. IF 만 **eval 시점 lazy special-case**(미평가 분기). parse/extractRefs 는 평범한
   call → **세 분기 ref 전부 정적 추적**(lazy 평가와 정적 의존추적은 반대 방향이라 둘 다 필요).
3. **비교는 toNumber 경로 금지**: 기존 binary 는 `toNumber` 후 산술 — 비교를 거기 끼우면 `"a"="a"` 깨짐(toNumber 에러).
   비교=**type-aware 별도 분기**(num↔num 수치·str↔str lexical·혼합 정의규칙). bool→1/0 강제는 부차.

## Goals
- **G-1 비교연산자 + 논리/조건 함수(IF/AND/OR/NOT) — ★본 라운드**:
  - tokenizer `< > = <= >= <>` + parser 비교=최저 precedence binary + evaluate type-aware 비교(→boolean).
  - IF=eval lazy special-case(cond 평가 후 then/else 중 하나만). AND/OR/NOT=call(flat boolean 읽기).
  - **선행(advisor #3)**: 파서 수술 전 **characterization 회귀 테스트**(현 산술·precedence·SUM·range·#DIV/0!·#CYCLE!)
    node 로 핀(엔진 커밋 테스트 0=echo TODO). 변경 후 green 유지.
  - ★spine(두 축 함께): ①lazy 단락 `IF(A1=0,"safe",1/A1)`,A1=0→"safe"(≠#DIV/0!) ②**recalc 의존추적**
    `B1=IF(A1>5,10,20)`,A1 3→7 변경→**B1 재계산**(createSheet 통해). 검증: node(파서/evaluate 순수+characterization)
    + createSheet recalc(setCell→dependent) + chromium(SheetGrid IF 입력→표시·ref 편집→재계산).
- **G-2 text + math 함수**:
  - flat-values 계약 positional 읽기(계약 변경 0). text: LEN/LEFT/RIGHT/MID/UPPER/LOWER/TRIM/CONCATENATE.
    math: ABS/ROUND/INT/MOD/POWER. **VLOOKUP/date/financial=vN**(엔진 shape 없음, 끌려가면 3골). 검증: node + chromium.
- **G-3 셀 편집 undo/redo**:
  - raw Map 스냅샷=진실원천(values/compiled/deps 파생). undo=raw 복원+**전체 재계산**(증분 setCell 외 rebuild 경로 필요).
    createSheet history 스택. grid-pro-edit-plus useUndoRedo(MOD-23)=행-data command 계약 상이→reuse-gate honest 후 신규
    (LESS-005). **$A$1+상대참조-on-fill=vN**(스코프 폭탄: ref 모델 absolute flag + copy=수식텍스트 + 델타 재작성=3골).
    검증: node(undo→raw 복원+재계산) + chromium.

## constraints
- **Pro**(grid-pro-sheet, PAT-003 기존). 외부 dep 0. C-003 주석↔소스. **LESS-006**: 파서/evaluate=node 순수+
  characterization·의존추적=createSheet recalc·UI=chromium. MOD-26 엔진 동작 보존(characterization 회귀).

## 의존
grid-pro-sheet 내부. 신규 외부 dep 0.

## 분류 (MASTER §2)
비교/함수/IF = 종결형(순수 파서/evaluate) · undo/redo history = 워크플로형 · SheetGrid 배선 = 연결형+트리거.

## G-1 결과 (완료 — 2026-06-05)
**구현**: types.ts Ast `binary` op 확장(`< > = <= >= <>` 추가, 새 kind 금지) + parser 토크나이저 비교(2자 우선)+
`parseCompare`(최저 precedence) + evaluate **type-aware 비교 분기**(toNumber 우회: 동등=타입+값·순서=둘 다 문자열이면
lexical 아니면 수치강제→boolean) + IF **eval lazy special-case**(취한 분기 1개만, parse/extractRefs 는 평범한 call) +
functions.ts AND/OR/NOT(eager, 에러전파).
- **선행 characterization(advisor #3)**: 파서 수술 전 현 동작(산술/precedence/SUM/range/#DIV/0!/#CYCLE!/recalc) node 11
  핀 → 변경 후 green 유지(엔진 커밋 테스트 0 이던 것 보강).
- **검증**: node **28/28**(`engine.test.mjs`, esbuild 격리 번들 — 엔진 .js 크로스import 라 strip-types 불가→i18n 식 번들):
  characterization 11 + 비교 8 + IF/논리 7 + **★recalc through IF 2**(B1=IF(A1>5,…), A1 3→7→B1 재계산: lazy 평가 vs
  정적 의존추적 양방향 동시). + **lazy 단락**(IF(A1=0,"safe",1/A1)→safe, 1/0 미평가). chromium **3/3**(sheet-grid.spec:
  MOD-26 2 보존 + G-1: IF/AND/비교 표시·★recalc through IF·lazy 1/0→safe). 회귀 42/42. typecheck 0.
- **★아키텍처(advisor #1)**: 비교=binary op 확장→extractRefs(binary left/right·call args 정적 walk) **수정 0**→의존그래프
  구성상 정확. IF=call 유지+eval lazy→세 분기 ref 전부 추적(lazy ⊥ 정적추적).

### G-1 advisor 후속(커밋 fold) + G-2/한계 기록
- **#1 esbuild 경로 fragility 시정**: engine.test.mjs 가 `.pnpm/esbuild@0.25.12/...` 버전핀 → bump/hoist 시 깨짐
  (wired-but-fragile). → grid-pro-sheet `devDependencies.esbuild` 추가 + **bare import `'esbuild'`**(버전핀 제거).
- **★#2 G-2 forward(설계 제약 — "계약 변경 0"의 예외)**: flat-values 계약은 인자 경계를 잃는다. reduce형(SUM)은 무관하나
  **positional 다인자 함수**(LEFT/ROUND/MOD/POWER)는 `ast.args.flatMap(evalArgValues)` 가 range 를 in-place 전개 →
  `ROUND(A1:A3,2)` → `[a1,a2,a3,2]` → values[1]=a2 를 digits 로 **조용히 오독**(에러 없음). G-2 전 결정: positional 함수는
  **per-arg 평가**(경계 보존)로 가거나, scalar-only 수용 + **range-arg 퇴화 케이스 문서화·단언**(조용한 오독 금지). text 함수는
  number→string 강제(LEN(123)) 필요. ("계약 변경 0"은 reduce형만 참 — positional 은 예외, advisor.)
- **#3 의미 한계(기록)**: (a) **type-strict 동등** — 빈 셀 `=A1=0`→FALSE(미설정=''·string '' ≠ number 0; Excel 은 빈=0).
  (b) **논리함수 비-bool 거부** — AND/OR 가 range 의 빈/텍스트 셀 만나면 #ERROR!(toBoolFn 문자열 에러; Excel 은 비논리 무시).
  둘 다 문서화된 선택(틀림 아님).

## G-2 결과 (완료 — 2026-06-05)
**구현**: functions.ts `POSITIONAL_FUNCTIONS`(per-arg 스칼라) — text: LEN/LEFT/RIGHT/MID/UPPER/LOWER/TRIM/CONCATENATE
(number→string 강제), math: ABS/INT/ROUND/MOD/POWER. evaluate 'call' 분기: 가변/집계(SUM·AND)=flat-values·**위치
함수=`ast.args.map(evaluate)` per-arg**(경계 보존). ★advisor #2 폐쇄: range 인자는 `evaluate(range)=#ERROR!` 로 전파 →
flat 전개의 조용한 오독(ROUND(A1:A3,2)→digits 오독) 방지. POSITIONAL_FUNCTIONS index export.
- **검증**: node **49/49**(G-1 28 + G-2 21: text 10·math 8 + **★range-arg ROUND(A1:A3,2)→#ERROR!** + scalar 정상 + ref
  recalc). chromium **4/4**(sheet-grid: G-1·G-2 + MOD-26 2 보존). G-2: UPPER/LEN/CONCATENATE/ROUND/MOD 표시·편집 재계산·
  ★range-arg→#ERROR! 시각. 회귀 43/43. typecheck 0.
- **MOD-26 보존**: 기존 5함수(SUM 등)=flat-values 경로 불변. **vN**: VLOOKUP(range+lookup)·date·financial(엔진 shape 없음).

## G-3 결과 (완료 — 2026-06-05) → MOD-32 = {G-1,G-2,G-3} 완주, §3 이관
**구현**: createSheet 에 per-cell 편집 command 스택. raw Map=진실원천이고 한 setCell=한 셀 명령{ref,prev,next}이라
undo=prev 재적용(증분 재계산이 dependents 처리)·redo=next. 전체 rebuild 불필요(명령 원자적). `applyCell` 추출
(history 기록 없는 공유 경로) + cursor(적용 길이; [cursor..]=redo future). no-op(prev===input) 은 history 미기록. Sheet
인터페이스 undo/redo/canUndo/canRedo. useSheet 노출(undo/redo 명시 bump=값 무변화 시도 cursor 반영). SheetGrid undo/redo
툴바 버튼(disabled=canUndo/canRedo). reuse-gate: MOD-23 useUndoRedo=행-data command 계약 상이→self-contained 신규(LESS-005).
- **검증**: node **66/66**(G-1·2 49 + G-3 17): ★undo→prev raw 복원+**dependent 재계산**·redo·새 편집 시 redo future 절단·
  undo 소진·no-op 미기록. chromium **5/5**(sheet-grid: G-1·2·3 + MOD-26 2 보존). G-3: undo 버튼→셀 복원+★dependent 재계산·
  redo·branch 절단(redo disabled). 회귀 44/44. typecheck 0.
- **scope 고정(advisor #5)**: undo/redo(raw 스냅샷)만. **$A$1 절대구문+상대참조-on-fill=vN**(스코프 폭탄: ref 모델 absolute
  flag + copy=수식텍스트 + 델타 재작성=3골).

## 모듈 완주 요약
3-Goal: G-1 비교+IF/논리(파서/evaluate, 의존그래프 구성상 정확) · G-2 text/math(positional per-arg, range-arg→#ERROR!) ·
G-3 undo/redo(per-cell command 스택). MOD-26 엔진 심화, **characterization 회귀로 기존 동작 보존**. node 66 + chromium 5.
LESS-006: ★recalc-through-IF(lazy⊥정적추적)·range-arg 경계·undo→dependent 재계산이 매 골 spine. advisor 후속(esbuild
fragility·positional 경계·type-strict 의미) 폐쇄. vN: VLOOKUP/date/financial·$A$1+상대참조·멀티시트·셀서식.
