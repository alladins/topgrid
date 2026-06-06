---
id: LESS-008
signature: keyed-graph-absorbs-new-dimension-via-key-namespacing
first_seen: MOD-GRID-41 G-1 (grid-pro-sheet multi-sheet) 2026-06-07
status: lesson (N=2 with MOD-40 ref model) → 승격 [[PAT-007]]
related: [PAT-007, "MOD-GRID-40 ($=eval-cosmetic)", LESS-007]
---

# LESS-008 — keyed 의존그래프에 새 주소 차원을 더할 땐 그래프를 재구조화하지 말고 키에 폴딩하라

## 맥락
`createSheet` 는 단일 flat `Map<key, …>` + 정/역 의존그래프(순환검출·topo·증분 recalc)로 동작한다. 멀티시트
(`Sheet2!A1`)를 추가할 때 자연스러운 충동 = **워크북-of-Sheet 구조**(시트별 그래프 + 교차-그래프 엣지). 그러면
순환검출·topo 불변식을 그 경계 너머로 **재증명**해야 한다.

## 통찰 (검증된 사실)
의존그래프의 모든 알고리즘(순환검출·topo·downstream)은 **키 문자열에 무관**하다. 그러므로 시트 한정자는
**키 네임스페이스**일 뿐 — `Sheet2!A1` 은 같은 단일 그래프의 다른 키다. 교차시트 의존·교차시트 순환이
**그냥 흡수**된다(MOD-41 에서 교차시트 recalc·#CYCLE! 가 추가 코드 0으로 통과). 필요한 변경은:
1. **주소→키 폴딩**(compile 의 qualify 패스): ref 의 sheet 한정자를 `ref` 키에 접어 넣어 `evaluate`/`extractRefs`
   는 키만 읽게(byte-identical) 한다.
2. **기본 차원은 무접두 유지**(기본시트 키 = bare `A1`) → 기존 단일차원 동작/테스트가 literal 불변(특성회귀 보존).

## N=2 — MOD-40 의 일반화
MOD-40 도 같은 형이었다: 절대참조 `$` 는 *평가* 와 무관(`$A$1`≡`A1`)하므로 정규화 주소를 키로 유지하고 절대성은
**키 밖 optional 플래그**로 뺐다 → evaluate/extractRefs 수정 0. MOD-41 은 시트를 **키 안 접두**로 넣었다.
공통 규칙: **순수 리더(evaluate/extractRefs)가 보는 키를 불변으로 두고, 새 정보는 키에 폴딩하거나 키 밖 메타로 빼라.**
→ [[PAT-007]] 승격.

## 올바른 형 (how to apply)
- 새 차원이 *조회 신원* 을 바꾸면(시트·네임스페이스·테넌트) → **키에 폴딩**(qualified key), 그래프 그대로.
- 새 차원이 조회 신원과 무관하면(절대성·서식 플래그) → **키 밖 optional 메타**, 리더 불변.
- 기본/레거시 차원은 **무접두**로 두어 기존 키·테스트를 literal 보존(특성회귀가 누출 가드).
- 비-hot-path 변환(translate/serialize)은 폴딩 *전* 표현(한정자 분리)을 다루므로 **별도로 처리**(MOD-41: serialize/shiftAst 가
  sheet 한정자·name 노드 처리 — 안 하면 copy/fill 이 교차시트 수식 손상). 두 표현(파싱 vs 컴파일)의 경계를 명확히.

## 탐지 (체크리스트)
- 새 차원 추가 시 그래프/리더 알고리즘을 *재증명* 하고 있는가? → 키 폴딩으로 회피 가능한지 먼저 보라.
- 기본 차원 키가 바뀌었는가? → 특성회귀가 깨지면 무접두 유지로 되돌려라.
- 폴딩 전 표현을 다루는 경로(serialize/translate)가 새 차원을 처리하는가? 안 하면 조용한 손상.

## 출처
MOD-GRID-41 G-1·G-2(`evaluate.qualifyAst`/`keyOf`, `sheetEngine` qualified-keys-single-graph) + MOD-GRID-40(절대플래그).
[[PAT-007]] 의 근거. [[LESS-007]] 와 함께 "순수 리더의 입력 표현을 안정으로 유지" 군.
