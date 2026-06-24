# MOD-GRID-41 — 멀티시트(Sheet2!A1) + 명명 범위 (named ranges)

dev-harness 24번째 (vN-2). 갭분석 「기타 5」(이제 3) 중 2건 = **멀티시트(Sheet2!A1)** · **명명 범위**.
MOD-26/32 가 vN 으로 미룬 항목. 경쟁: xxxx FlexSheet 워크북·Excel 시트탭·명명 정의.

## reuse-gate (LESS-003)
- **이미 있음**: parser/`evaluate`/`extractRefs`/`createSheet`(단일 flat Map<key,…> + 정/역 의존그래프 — **키 문자열에
  무관**: 순환검출·topo·recalc 가 임의 키로 동작) + MOD-40 ref/range 노드(colAbs/rowAbs)·`translateFormula`/`serializeAst`/
  `shiftAst` + cellAddress.
- **부재**(신규): ① `Name!A1` sheet-qualified 주소 ② 명명 테이블 `Map<name, ref|range>` ③ compile 시 **qualify+resolve** 패스.
- **★핵심 통찰(MOD-40 `$`=eval-cosmetic 동형, advisor 확인)**: sheet-qualified ref `Sheet2!A1` 은 **같은 단일 그래프의 다른 키**일
  뿐 — 워크북-of-Sheet 구조 불필요(그러면 N그래프+교차엣지로 불변식 재증명 필요). 교차시트 의존은 **그냥 동작**한다.

## ★ 핵심 아키텍처 결정 (advisor 확인)
1. **qualified-keys-single-graph**: 기본시트 'Sheet1' 키는 **무접두(bare 'A1')** 유지 → MOD-26/32 키 literal 불변(특성회귀 보존).
   비-기본 시트 = `Sheet2!A1` 접두. `keyOf(sheet,a1)` = sheet&&≠default ? `${sheet}!${a1}` : `a1`.
2. **home-sheet 는 *설정되는 셀* 에서 도출**(전역 기본 아님): `setCell('Sheet2!B1','=A1')` → `A1` 은 `Sheet2!A1` 로 qualify.
   = G-1 척추.
3. **option (b) — compile 시 inline**: qualify 패스가 ref 노드의 `ref` 를 **qualified 키**로 재작성하고 명명을 **타깃으로 인라인**
   → `evaluate`/`extractRefs` byte-identical(qualified 키를 그냥 읽음). hot path 에 nameTable 안 넣음.
4. **명명 재정의 = recompile-all**: inline 이라 stale AST 위험 → `defineName` 이 **전 수식 셀에 applyCell 재실행**(재-resolve·deps
   재구성·재계산). 명명은 드물게 변함 → 단순·정확.
5. **`#NAME?` = ErrorCode union 에만 추가, tokenizer 화이트리스트 제외**: eval-time 값(미정의 명명 resolution)이고 **직렬화 안 됨**
   (`#REF!` 와 달리 translate 가 방출 안 함, 끝이 `?`라 `#…!` 규칙도 거부). union 확장 + 미해소 명명 → err `#NAME?` 노드(컴파일 AST,
   재직렬화 안 됨).
6. **★MOD-40 translate 상호작용(필수, advisor)**: `translateFormula` 는 `compileCell` 우회(parse→shiftAst→serialize)라 sheet-
   qualified ref·name 노드가 **un-inline 상태로 흐른다**. `shiftAst`=ref 의 cell 좌표만 이동·`sheet` 접두 보존·name 노드 무이동
   (명명은 fill 시 안 움직임). `serializeAst`=`name` 케이스 + sheet 접두. **없으면 교차시트/명명 수식 copy/fill 조용히 손상.**

## Goals
- **G-1 멀티시트(Sheet2!A1) — 종결형**:
  - tokenizer ref 정규식에 optional sheet 접두: `(?:([A-Za-z][A-Za-z0-9]*)!)?(\$?)([A-Za-z]+)(\$?)([0-9]+)`. ref/range 노드 `sheet?`.
  - createSheet: 키=keyOf(sheet,a1). `setCell('Sheet2!B1',…)`=split→homeSheet 'Sheet2'·키 'Sheet2!B1'. compile qualify 패스(homeSheet
    기준 bare ref qualify, sheet-qualified 보존). range=from/to bare + `keyPrefix`('' or 'Sheet2!'); evalArgValues/extractRefs 가
    `keyPrefix+cell`(기본='' → byte-identical).
  - **검증**: node — ①bare ref 가 *자기 시트* 로 qualify(`Sheet2!B1='=A1'`→Sheet2!A1) ②★교차시트 recalc(`Sheet1!A1` 편집→Sheet2 수식
    재계산=단일그래프 증명) ③교차시트 순환(`Sheet1!A1=Sheet2!A1`,`Sheet2!A1=Sheet1!A1`)→둘 다 #CYCLE!(공짜로 따라옴).
- **G-2 명명 범위(named ranges) — 종결형**:
  - `defineName(name, target)`(target='A1' 또는 'A1:B2', sheet 가능). nameTable Map. parser: bare NAME(¬`(`, ¬TRUE/FALSE)→`{kind:'name'}`.
  - compile qualify: name→nameTable resolve→타깃 ref/range 인라인(미정의→err `#NAME?`). defineName→recompile-all.
  - **검증**: node — ④`defineName('TaxRate','A1')` 후 `=TaxRate*B1` 값·A1 편집→재계산·재정의→dependents 재계산 ⑤미정의 명명→#NAME?.
- **MOD-40 상호작용(필수)**: ⑥`translateFormula('=Sheet2!A1',0,1)`→`=Sheet2!A2`(접두 보존·좌표 이동) + 명명 수식 fill→명명 불변.

## In / Out
- **In**: 교차시트 ref 파싱·평가·의존추적·순환·recalc + named ranges define/resolve/redefine + translate 호환. node 검증.
- **Out(vN)**: 따옴표/특수문자 시트명(`'My Sheet'!A1`)=명시 연기(LESS-004, alphanumeric-only 한계 표기) · SheetGrid 멀티탭 UI ·
  시트 add/delete/rename · name manager UI(전부 브라우저, → MOD-49/vN) · 디지트포함 명명(ref-shape 충돌, Excel 규칙).

## AC (측정 가능)
AC①~⑥ 위 검증 = 전부 node 결정. 특성회귀 66 green(자동-qualify 가 관측가능 행동에 누출 안 됨=가드).

## constraints
- **Pro**(grid-pro-sheet, PAT-003). 외부 dep 0. C-003. **LESS-006**: 순수 엔진 → node ceiling(멀티탭 UI 만 브라우저=Out).
  MOD-26/32/40 보존(특성회귀). ★MOD-40 translate 회귀(sheet/name 노드).

## 의존
grid-pro-sheet 내부. 신규 외부 dep 0.

## 분류 (MASTER §2)
교차시트 파싱·qualify·명명 resolve = **종결형**(순수). recompile-all = createSheet 내부(워크플로 아님, 단순 재적용).

## reuse-gate 결과 / 추측 0
재사용=parser/evaluate/extractRefs/createSheet/cellAddress/translate 전부 기존. 신규=sheet 접두·nameTable·qualify 패스.
추측 0: `Sheet2!A1` 구문·명명 의미·#NAME? = Excel/xxxx 1차. 따옴표 시트명=명시 vN.

## specify rubric (Full — 점수 영속화, 게이트 C)
- [x] Goal 1문장(멀티시트+명명, 경쟁 대응) **9/10**
- [x] In/Out(엔진 In·UI/따옴표명 Out) **10/10**
- [x] AC 측정가능(①~⑥ node, 교차recalc=단일그래프 증명) **10/10**
- [x] reuse-gate(6소스 재사용, 신규 3항) **10/10**
- [x] constraints(PAT-003·LESS-006·MOD-40 translate 회귀) **9/10**
- [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(구문/의미 1차, 따옴표명 vN 명시) **9/10**
- [x] 분류(§2 종결형) **10/10**
- **합계 77/80 — 게이트 통과.**

---

## G-1·G-2 결과 (완료 — 2026-06-06) → MOD-41 = {G-1,G-2} 완주, §3 이관
**구현**:
- types.ts: ref/range 노드에 optional `sheet`(파싱 단계 한정자) + range `keyPrefix`(qualify 후 확장-셀 접두) + 신규 `{kind:'name'}`
  노드 + ErrorCode `#NAME?`.
- parser.ts: ref 정규식에 optional sheet 접두 `(?:([A-Za-z][A-Za-z0-9]*)!)?…`(시트명 대소문자 보존) · bare NAME(¬`(`,¬TRUE/FALSE)
  → name 노드.
- evaluate.ts: `qualifyAst`(compile 패스 — ref→qualified 키 폴딩·명명 inline·미정의→#NAME?·명명→명명 비허용) + `compileCell(raw,ctx)`
  · `keyOf`/`DEFAULT_SHEET`/`CompileContext` export · evalArgValues/extractRefs range `keyPrefix`(기본 '' → byte-identical) ·
  serializeAst sheet 접두+name 케이스 · shiftAst sheet 보존+name 무이동 · evaluate `case 'name'`(#NAME? 방어).
- sheetEngine.ts: **qualified-keys-single-graph** — 키=기본시트 bare 'A1'·비-기본 'Sheet2!A1'(단일 그래프). `toKey`/`homeOf`,
  internal `getByKey`(evaluate 주입). setCell/getValue/getRaw/getDisplay public→키. **`defineName`(recompile-all)**: nameTable 갱신
  후 전 수식 셀 재컴파일(deps 재구성)+전체 재계산. ★home 시트=**설정되는 키**에서 도출(homeOf).
- **★MOD-40 translate 상호작용 보존**: serializeAst/shiftAst 가 sheet 한정자·name 노드 처리 → 교차시트/명명 수식 copy/fill 무손상.

**검증**: node **engine.test.mjs 108/0**(MOD-26/32/40 87 보존 + MOD-41 21):
- G-1: ★bare ref→자기시트 qualify·★교차시트 recalc(단일그래프 증명)·교차시트 #CYCLE!·explicit Sheet1!=bare·교차시트 range(keyPrefix).
- G-2: 명명 셀/범위 값+recalc·★재정의 dependents 재계산·★미정의→#NAME?+정의시 resolve(recompile-all)·교차시트 명명.
- MOD-40×: translate `=Sheet2!A1`(접두 보존)·교차시트 range·★name 노드 무이동(ref 만 이동). typecheck 0·tsup build green.
- **특성회귀 87 green** = 자동-qualify 가 관측 행동에 누출 안 됨(기본시트 키 bare 유지).

## ★ ❌ 닫힘 마커 (advisor — over-claim 차단)
- **명명 범위 = ✅**: `defineName`+resolution 완결·node 실증·API 직접 사용(A1 ref 와 동격, 갭 항목에 UI 미명시).
- **멀티시트(Sheet2!A1) = 🟡 (NOT ✅)**: 갭 항목 `sheets/**tabs**` = 교차시트 ref(✅, 완결)+탭 UI(부재) 번들 → 1행 partial =
  🟡(copy/fill 과 구조 동일). **행 분할로 ✅ 추출 금지**(count-gaming). 탭 전환 UI = MOD-49/vN.
- COMMERCIAL-GAP: ❌45→43·✅219→220·🟡63→64(reconcile, 기타 3→1·Spreadsheet 14/6/3).

## 한계 (LESS-004 정직 — 명시)
- **명명 범위를 스칼라로 직접 사용**(`=Data`, Data=범위) → `#ERROR!`(bare range=스칼라 없음, 기존 range 동작 일관). 함수 인자
  (`=SUM(Data)`)만 유효 — 문서화된 경계(버그 아님).
- 시트명·명명 = **대소문자 정규화**(parser 가 name 토큰 upper; 시트명은 보존하나 정확 매칭). 따옴표/특수문자 시트명·명명→명명
  체인·디지트포함 명명 = vN.

## 모듈 완주 요약
2-Goal: G-1 멀티시트(qualified-keys-single-graph — 시트 한정자=키 네임스페이스, 그래프 불변) · G-2 명명 범위(compile inline +
defineName recompile-all). ★MOD-40 translate 호환(sheet/name 노드). 신규 [[LESS-008]]/[[PAT-007]](키-네임스페이싱으로 순수 리더
불변, N=2 with MOD-40). node 108/0(87 보존). closure: 명명=✅·멀티시트=🟡(탭 UI=MOD-49).
