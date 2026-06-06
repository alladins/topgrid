---
id: LESS-007
signature: ast-roundtrip-serialization-must-be-precedence-aware
first_seen: MOD-GRID-40 G-2 (grid-pro-sheet copy/fill translateFormula) 2026-06
status: lesson (N=1) — N=2 시 C/AP 승격 검토
related: [LESS-006, "MASTER mod-grid-40", "MOD-GRID-32 (binary op 확장 동형)"]
---

# LESS-007 — AST→텍스트 라운드트립 serializer 는 연산자 우선순위/결합성을 인지해야 한다

## 맥락 (왜 serializer 가 생겼나)
copy/fill 상대참조 조정(`translateFormula`)은 수식을 **parse → ref 노드 이동 → 다시 텍스트로 직렬화**한다.
그 직렬화 출력은 **다시 파서를 통과해 동일 구조로 재구성**되어야 한다(셀에 저장→`compileCell`→`parseFormula`).
즉 `parse(serialize(ast))` 가 `ast` 와 의미상 동치여야 한다(라운드트립 불변식).

## 함정 (검증 가능 사실)
naive 직렬화(중위 연산자를 괄호 없이 이어붙임)는 **의미를 조용히 바꾼다**:
- `=(A1+B1)*2` 는 `binary(*, binary(+,A1,B1), 2)` 로 파싱된다.
- naive serialize → `"A1+B1*2"` → **재파싱하면 `A1+(B1*2)`** = 다른 트리·다른 값. 에러 없이 손상.
- 비교환 연산자도 동일: `=A1-(B1-C1)` → naive `"A1-B1-C1"` = `(A1-B1)-C1` ≠ 원식.

fill 한 번이면 사용자 수식이 **조용히 오염**된다(translate 가 값이 아니라 구조를 보존해야 하는데 깨짐).

## 올바른 형 (how to apply)
1. **precedence-aware 직렬화**: 자식의 precedence < 부모면 괄호. 비교환 연산자(`-`/`/`)의 **우변**은
   *동일* precedence 여도 괄호(`a-(b-c)` ≠ `a-b-c`). unary 의 피연산자가 binary 면 괄호(`-(a+b)`).
   (구현: `prec(ast)` 레벨 함수 + binary 케이스서 좌/우 wrap 판정.)
2. **라운드트립을 테스트로 못박기**: `translate(0,0)` **identity** 를 *괄호 있는* 식에 적용
   (`=(A1+B1)*2`→그대로, `=A1-(B1-C1)`→그대로). 단순 식만 테스트하면 함정이 숨는다.
3. **out-of-bounds·literal·unparseable 도 라운드트립 대상**: translate 가 방출하는 `#REF!` 가 파서를
   통과해야 하므로 error-literal leaf 를 문법에 추가([[MOD-GRID-40]] err 노드). partial 식
   (`=A1+B1`,(−1,0)→`=#REF!+A1`)에서 정상부는 보존.

## 인접 교훈 (검증 무결성)
같은 라운드에서 기대값을 **구현이 아니라 명세에서 도출**하라는 표준도 재확인됐다:
`=A1+B1`,(+1col)→ 첫 시도 기대 `=B3+D3` 가 fail — `B1`(col-1)+1col=`C`=`C3`(≠`D3`). **구현이 옳고
머릿속 산술이 틀렸다**. 기대값은 셀 좌표 정의(명세)로 검산할 것(advisor "avg-of-avgs 함정 회피" 동형).

## 탐지 (체크리스트)
- AST→텍스트 변환이 있는가? 그렇다면 `parse(serialize(x))≡x` 를 **괄호식·비교환식**으로 테스트했는가?
- 중위 연산자를 괄호 판정 없이 이어붙이는가? → precedence 손상 위험.
- translate/rewrite 가 새 토큰(`#REF!` 등)을 방출하면 그 토큰이 파서 문법에 있는가?

## 출처
MOD-GRID-40 G-2. `packages/grid-pro-sheet/src/internal/evaluate.ts`(`serializeAst` precedence-aware +
`translateFormula`/`shiftAst`), `engine.test.mjs`(identity·precedence·#REF! 라운드트립 단언).
[[LESS-006]] 와 함께 "검증을 결함 클래스에 맞춰라" 군(LESS-006=호스트측정 게이트, 본 건=구조 보존 라운드트립).
