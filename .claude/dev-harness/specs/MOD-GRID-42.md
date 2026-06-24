# MOD-GRID-42 — 스프레드시트 함수 라이브러리 (VLOOKUP · 날짜 · 재무)

dev-harness 25번째 (vN-3). 갭분석 「광범위 Excel 함수 라이브러리」 🟡 심화(MOD-32 가 VLOOKUP/날짜/재무 "미정" 표기).
경쟁: Excel/xxxx FlexSheet 400+ 함수. 본 모듈은 가장 자주 쓰는 lookup·날짜·재무를 추가(여전히 🟡 — 부분집합).

## reuse-gate (LESS-003)
- **이미 있음**(MOD-26/32): `FUNCTIONS`(variadic flat-values: SUM/AVG/…/AND/OR/NOT) · `POSITIONAL_FUNCTIONS`(per-arg 스칼라:
  LEN/…/ABS/ROUND/…) · `toNum`/`toStr`/`collectNumbers`(에러-aware 강제) · evaluate 'call' 디스패치(IF lazy 특수·variadic·positional) ·
  `valuesEqual`/`compareValues`(MOD-32, evaluate.ts 로컬) · range 노드(MOD-41 keyPrefix) · `expandRange`/`parseA1`/`toA1`.
- **부재**(신규): ① **range-aware** 함수(VLOOKUP — 2D 테이블 필요, 두 레지스트리 모두 부적합) ② 날짜 함수(serial 모델 부재) ③ 재무 함수.
- **★VLOOKUP 디스패치**: variadic=range flat→테이블 구조 소실 · positional=range→#ERROR!. → **evaluate 특수-케이스**(IF 동형) 가
  `args[1]` 을 **range 노드**로 직접 읽어 2D(getCell)로 lookup. deps 는 generic call-walk(extractRefs)로 자동 추적(recalc 무료).

## ★ 핵심 결정 (advisor 확인)
1. **`#N/A` = ErrorCode union 에만 추가**(tokenizer 제외): VLOOKUP no-match=eval-time, 직렬화 안 됨(#NAME? 동형, 끝에 `!` 없어 `#…!`
   규칙도 lex 불가). `#ERROR!` 와 의미 구분(사용자가 "no match"=#N/A 기대).
2. **날짜 = serial 모델**(epoch=1899-12-30 UTC, 1900 leap 버그 **미모방**). DATE/YEAR/MONTH/DAY = `Date.UTC` 산술(순수·결정적).
   ★spine = **라운드트립**(`YEAR(DATE(y,m,d))===y` 등), Excel serial 수치 일치 아님(문서화 divergence, LESS-004). month-overflow
   parity 무료(`DATE(2024,13,1)`→2025-01-01). **TODAY/NOW = vN**(비결정 → node 검증 불가 = 그 자체가 근거. 후속=PAT-005 host 주입).
3. **VLOOKUP 양쪽 구현, 기본=approximate**(Excel parity — omitted 4th-arg=exact 면 silent divergence). approximate=오름차순 가정 첫열
   ≤lookup 최대값(sorted-가정 footgun=Excel 의 것=parity). exact(FALSE)=정확 일치. no-match→#N/A.
4. **재무 PMT/FV/PV rate=0 특수-케이스**(일반식은 rate 나눗셈→NaN). 부호규약=Excel(유출=음수). positional.

## Goals
- **G-1 VLOOKUP — 종결형(range-aware)**:
  - evaluate 'call' 특수-케이스 `evalVlookup(args,getCell)`: lookup=eval(args[0]) · args[1]=range 노드(아니면 #ERROR!) ·
    colIndex=eval(args[2]) · args[3] optional exactMatch(기본 approximate). from/to/keyPrefix→2D, 첫열 매칭(exact=valuesEqual·
    approx=정렬 ≤lookup 최대), targetCol=c0+colIndex-1. **colIndex<1 또는 >폭 → #REF!**(양방향). 매칭 셀 에러 전파. no-match→#N/A.
  - **검증**: node — exact(FALSE) 매칭·미매칭 #N/A · approximate(기본) 정렬 ≤lookup · colIndex 경계 #REF! 양방향 · ★VLOOKUP recalc
    (테이블 셀 편집→재계산) · ★명명범위 테이블(`=VLOOKUP(x,Data,2)` MOD-41 인라인) · ★translate(`=VLOOKUP(A1,B1:C5,2)` shift, MOD-40/41 회귀).
- **G-2 날짜 + 재무 — 종결형(positional)**:
  - POSITIONAL_FUNCTIONS 에 추가: DATE/YEAR/MONTH/DAY(serial) + PMT/FV/PV(rate=0 특수·부호 Excel).
  - **검증**: node — ★DATE/YEAR/MONTH/DAY 라운드트립 + month-overflow + ★PMT/FV/PV `rate=0` 특수-케이스 + rate≠0 표준값.

## In / Out
- **In**: VLOOKUP(exact+approximate) · DATE/YEAR/MONTH/DAY · PMT/FV/PV. node 검증.
- **Out(vN)**: TODAY/NOW(비결정, PAT-005 주입 후속) · HLOOKUP/INDEX/MATCH · 광범위 잔여(여전히 🟡, ~25 vs 400+) · 시간 함수(HOUR/시각).

## ★ ❌ 닫힘 마커 (advisor — 0 flip 예상)
VLOOKUP/날짜/재무 = **단일 🟡 행 「광범위 Excel 함수 라이브러리」**(MOD-32 가 🟡) 의 심화. **독립 ❌ 행 없음 → 0 ❌ 닫힘·0 flip**.
reconcile **불변(❌43/✅220/🟡64)**. capture = 🟡 행 **detail text 갱신**(VLOOKUP/date/financial 추가)·counts 무변. ~25 vs 400+ → 🟡 유지.
(manufactured ❌→✅ 금지 — 부분 커버리지 심화는 정당, 가짜 flip 은 아님.)

## AC (측정 가능)
G-1: exact/approx/#N/A/#REF! 경계/recalc/명명범위/translate. G-2: 날짜 라운드트립·overflow·재무 rate=0+표준. 전부 node.

## constraints
- **Pro**(grid-pro-sheet, PAT-003). 외부 dep 0(Date=내장). C-003. **LESS-006**: 순수 → node ceiling. MOD-26/32/40/41 보존(특성회귀).
  reuse `valuesEqual`/`compareValues`/`toNum`(재유도 금지).

## 의존
grid-pro-sheet 내부. 신규 외부 dep 0.

## 분류 (MASTER §2)
VLOOKUP·날짜·재무 = **종결형**(순수). VLOOKUP=range-aware evaluate 특수(IF 동형).

## reuse-gate 결과 / 추측 0
재사용=FUNCTIONS/POSITIONAL/toNum/valuesEqual/range/expandRange 기존. 신규=VLOOKUP 특수·날짜 serial·재무식.
추측 0: VLOOKUP exact/approx·#N/A·PMT/FV/PV 식 = Excel 1차. serial 수치 divergence·TODAY=명시 vN.

## specify rubric (Full — 점수 영속화, 게이트 C)
- [x] Goal(함수 심화, Excel 대응) **9/10** · [x] In/Out(VLOOKUP/날짜/재무 In·TODAY/HLOOKUP Out) **10/10**
- [x] AC 측정(exact/approx/#N/A/경계/라운드트립/rate=0, node) **10/10** · [x] reuse-gate(레지스트리 재사용, VLOOKUP 만 신규 디스패치) **10/10**
- [x] constraints(PAT-003·LESS-006·valuesEqual 재사용) **9/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(Excel 1차·divergence 명시) **9/10** · [x] 분류(§2 종결형) **10/10**
- **합계 77/80 — 게이트 통과.**

---

## G-1·G-2 결과 (완료 — 2026-06-07) → MOD-42 = {G-1,G-2} 완주, §3 이관
**구현**:
- types.ts: ErrorCode `#N/A` 추가(eval-time only, tokenizer 제외 — #NAME? 동형).
- evaluate.ts: `evalVlookup(args,getCell)` + 'call' 특수-케이스(IF 동형). args[1]=range 노드(from/to/keyPrefix→2D), 첫열 매칭
  (exact=`valuesEqual`·approx=`compareValues('<=')` 정렬 ≤lookup, MOD-32 재사용), colIndex 경계 #REF! 양방향, no-match #N/A,
  매칭 셀 에러 전파. deps=generic call-walk(extractRefs) 무료.
- functions.ts: POSITIONAL_FUNCTIONS 에 DATE/YEAR/MONTH/DAY(serial, epoch=1899-12-31→DATE(1900,1,1)=1, Date.UTC month-overflow
  parity, 1900 leap 미모방) + PMT/FV/PV(`financial` 헬퍼, rate=0 특수, nper=0→#DIV/0!, Excel 부호규약).

**검증**: node **engine.test.mjs 128/0**(MOD-26/32/40/41 108 보존 + MOD-42 20):
- G-1 VLOOKUP: exact 매칭·no-match #N/A·★approx(기본) 정렬 ≤·below-first #N/A·colIndex>폭/<1 #REF! 양방향·★테이블 편집 recalc
  ·★명명범위 테이블(MOD-41 인라인)·★translate(MOD-40/41 회귀, 모든 ref shift).
- G-2 날짜: ★DATE 라운드트립(YEAR/MONTH/DAY)·month-overflow(13월→익년)·epoch 앵커. 재무: ★PMT/FV/PV `rate=0` 특수 + rate≠0 표준값
  (Excel 일치 ±1e-3). typecheck 0·tsup build green.
- **특성회귀 108 보존**(MOD-40/41 translate·멀티시트·명명 무영향).

## ★ ❌ 닫힘 마커 (advisor — 0 flip 확정)
**단일 🟡 행 「광범위 Excel 함수 라이브러리」 심화**(VLOOKUP/날짜/재무 추가). **독립 ❌ 행 없음 → 0 ❌ 닫힘·0 flip·reconcile 불변
(❌43/✅220/🟡64)**. capture = 🟡 행 detail text 갱신만(counts 무변). ~25 fn vs Excel 400+ → **🟡 유지**(manufactured ❌→✅ 금지).

## 한계 (LESS-004 정직)
- 날짜 serial = **Excel 수치 불일치 가능**(1900 leap 버그 미모방 → 1900-03 이전 1일 차). 검증 spine=라운드트립(절대수치 아님), 문서화.
- TODAY/NOW=vN(비결정→node 검증 불가, PAT-005 host 주입 후속). HLOOKUP/INDEX/MATCH·시간 함수=vN. VLOOKUP approx=정렬 오름차순 가정(Excel parity).

## 모듈 완주 요약
2-Goal: G-1 VLOOKUP(range-aware evaluate 특수=세 번째 디스패치 형, IF 동형, deps 무료·exact+approx default-approx·#N/A·#REF! 경계) ·
G-2 날짜(serial 라운드트립)+재무(rate=0 특수). MOD-32 valuesEqual/compareValues 재사용. node 128/0(108 보존). **0 ❌ flip**(🟡 심화).
vN: TODAY/NOW(PAT-005)·HLOOKUP/INDEX·시간 함수.
