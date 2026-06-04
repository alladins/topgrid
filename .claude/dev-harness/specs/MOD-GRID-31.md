# MOD-GRID-31 — pivot 상호작용 (sort / expand-collapse / runtime config)

dev-harness 14번째. 갭분석 Pivoting(미구현 10 — 최대 갭 영역). MOD-18 `grid-pro-pivot`(computePivot+PivotGrid,
26 테스트)은 **선언적·정적** pivot 만 출하 → MOD-31 은 갭분석이 ❌ 로 짚은 **런타임 상호작용 3축**을 더한다.

## reuse-gate (LESS-003)
- **이미 있음**(MOD-18, grid-pro-pivot): `computePivot(data,config)→PivotModel{config,columnTree,columnLeafKeys,rows}`
  (순수)·`buildPivotColumns(model)`·`PivotGrid`(Watermark 게이트 포함)·`usePivot`·reducers. PAT-003 기존.
- **재사용**: 모든 상호작용 = **`model.rows`(flat PivotRow[]) 에 대한 순수 변환** + interaction state. PivotGrid 가 변환된
  rows 를 `<Grid data>` 로 전달(grid-core 미접촉 — MOD-30 floating 과 다른 깔끔한 seam). config 골 = controlled prop +
  computePivot 재실행(엔진 신규 0). **`computePivot` emit 미수정**(건드리면 MOD-18 회귀 위험 — advisor 경계선).

## ★ 척추 — subtotal 앵커링 + 2-행차원 fixture (vacuity 함정, advisor)
PivotRow 모델: emit 이 leaf dim 마다 `data`, 상위 dim 은 자식 먼저→`subtotal`(그룹 하단), 마지막 `grandTotal`(__depth -1).
**subtotal 은 행 차원 ≥2 일 때만 존재**(단일 행차원=data+grandTotal 뿐). 따라서:
- 모든 node fixture·chromium story = **2-행차원 config**. 단일-행차원은 "list 비어있지 않음"의 pivot 판=vacuous(잘못 놓인
  subtotal 을 못 드러냄).
- 판별 단언: **상호작용 후 각 subtotal 이 자기 그룹 data 행 직후, grandTotal 이 마지막에 그대로**.

## Goals
- **G-1 pivot 결과 정렬(값 컬럼) — ★본 라운드**:
  - `sortPivotRows(model, leafKey, dir)`(순수): rows 를 **세그먼트**(subtotal/grandTotal 로 종료되는 data 행 run)로 나눠
    각 세그먼트 **내** data 행만 값 셀(`row[leafKey]`)로 재정렬. subtotal/grandTotal 위치 불변(앵커). **null 셀=하단**(spine).
  - 어포던스: `buildPivotColumns` 값 헤더에 onClick + 정렬 인디케이터(▲▼) — **grid-core enableSort 아님**(평탄 배열 전체
    정렬 시 subtotal 섞임=갭분석 명시). PivotGrid 정렬 state 로 연결.
  - **스코프 고정**: 그룹 *자체*를 subtotal 값으로 정렬(계층 정렬)=**vN 연기**(within-group leaf 정렬만 G-1).
  - 검증: node 2-행차원(세그먼트 내 정렬·subtotal 앵커·grandTotal 끝·null 하단·asc/desc) + chromium(값 헤더 클릭→재정렬,
    subtotal 시각 앵커).
- **G-2 행 그룹 expand/collapse**:
  - `collapsePivotRows(model, collapsedKeys)→PivotRow[]`(순수): collapse 된 그룹의 하위 data 행 제거, subtotal 은 그룹
    대표로 잔존. 어포던스: **subtotal 행 토글**(모델이 subtotal 을 그룹 하단에 방출→상단 헤더 없음, AG 상하반전=문서화 한계).
    computePivot 미수정.
  - 검증: node 2-행차원(collapse→하위 숨김·subtotal/grandTotal 잔존·재확장 복원) + chromium(클릭→숨김/복원).
- **G-3 런타임 config(transpose + onConfigChange)**:
  - controlled `config` + `onConfigChange`(grid-core controlled state 패턴 mirror) + `transposePivotConfig(config)`(rows↔columns
    swap, 순수) + pivotMode 라이브 토글. computePivot 재사용.
  - 검증: node(transpose=config 축 swap 순수) + chromium(transpose 클릭→축 교환·토글).

## constraints
- **Pro**(grid-pro-pivot, PAT-003 기존). 외부 dep 0. C-003 주석↔소스. **LESS-006**: 순수 변환=node 2-행차원(앵커링)·
  어포던스/시각=chromium. **computePivot emit 미수정**(MOD-18 26 테스트 보존). Tailwind class storybook inert→테스트 대상 inline.

## 의존
grid-pro-pivot 내부. 신규 외부 dep 0.

## 분류 (MASTER §2)
sortPivotRows·collapsePivotRows·transposePivotConfig = 종결형(순수) · PivotGrid state 배선/어포던스 = 연결형+트리거.

## G-1 결과 (완료 — 2026-06-05)
**구현**: 순수 `sortPivotRows(model, leafKey, dir)` — rows 를 세그먼트(연속 data 행 run, subtotal/grandTotal 종료)로
나눠 각 세그먼트 **내** data 행만 값 셀로 정렬, 합성 행 위치 불변(앵커), **null 셀 하단**(asc/desc 무관). 어포던스:
`buildPivotColumns(model, sortOpts?)` 값 leaf 헤더를 클릭 버튼(▲▼ 인디케이터)으로 — **sortOpts 미지정 시 plain string
(MOD-18 동작 불변)**. PivotGrid: `enableSort?` opt-in prop(default off=MOD-18 정적) + 정렬 state(클릭 cycle
asc→desc→해제) + `sortPivotRows` 적용 → `<Grid data={displayRows}>`. grid-core enableSort 미사용(평탄 배열 전체 정렬 회피).
- **검증(★2-행차원 필수)**: node spine **11/11**(`src/sortPivotRows.test.ts`, 손수 fixture=computePivot emit 순서 미러,
  type-only import→strip-types: 세그먼트 내 정렬·**kind 시퀀스 불변=앵커**·grandTotal 끝·null 하단·asc/desc). chromium
  **1/1**(`pivot-interaction.spec.ts`: 값 헤더 클릭→asc Boston(90) before NY(300)·**subtotal/grandTotal 앵커**(kind 시퀀스
  불변, subtotal idx2=East·grandTotal 마지막)·재클릭 desc 반전). 회귀 37/37. typecheck 0.
- **스코프 고정**: 그룹 *자체*를 subtotal 값으로 정렬(계층 정렬)=vN. within-group leaf 정렬만.
- **MOD-18 보존**: buildPivotColumns sortOpts 기본 미지정→헤더 plain string 불변, PivotGrid enableSort 기본 off→정적 동작.

### G-1 advisor 후속(커밋 fold)
- **nested-column 경로 검증**: 첫 story 가 `columns:[]`라 sort 를 `mapColumnNode` 재귀(column 차원 시 nested 값
  헤더)에 스레딩한 부분 미실행(=floating "center cell" 갭의 pivot 판). → `columns:['quarter']` 2-행차원 story 추가,
  nested 값 헤더("Q1 정렬") 클릭→그룹 내 정렬(Boston Q1=30 < NY Q1=100)+subtotal 앵커 단언. chromium 2/2.
- **G-2 forward(advisor)**: sort/collapse 둘 다 model.rows 변환 → displayRows 에서 **체인**(collapse(sort(rows)),
  순서 무관) + chromium 이 **정렬+collapse 동시** 단언 필수(고립 통과·합성 깨짐 함정 회피).

## G-2 결과 (완료 — 2026-06-05)
**구현**: 순수 `collapsePivotRows(rows, collapsedIds)` — subtotal(`__id` ∈ collapsedIds)의 후손 행 제거(임의 중첩:
바로 앞 연속 행 중 depth > subtotal depth 인 것, 첫 depth ≤ d 에서 정지=이전 그룹 경계). subtotal 자신은 그룹
대표로 잔존, grandTotal 불변. 어포την스: `buildPivotColumns(model, sort?, collapse?)` 의 subtotal 행-dim 셀을 클릭
chevron(▶/▼) 버튼으로 — collapse 미지정 시 plain text(MOD-18 불변). 모델이 subtotal 을 그룹 **하단**에 방출(상단
group-header 없음)→토글이 자기 위 후손을 숨김(AG 상하반전=문서화 한계). computePivot 미수정.
- **★합성(advisor forward)**: PivotGrid `displayRows = collapse(sort(rows))` 체인(둘 다 순수, collapse 는 id 필터라
  순서 무관). `enableCollapse?` opt-in(기본 off). collapsedIds state 토글.
- **검증**: node spine **11/11**(`src/collapsePivotRows.test.ts`, 2-행차원: collapse→후손 숨김·subtotal 대표 잔존·
  grandTotal 불변·재확장 복원·**★collapse(sort) 체인=정렬 후에도 같은 그룹 숨김**). chromium(`pivot-interaction.spec.ts`
  collapse 테스트): East 토글→data 2행 숨김·subtotal 잔존·재확장 복원 + **★합성**(sort asc→collapse East→재확장 시
  East data 가 **여전히 정렬됨**(Boston<NY)=collapse(sort) 동시 활성 증명). 회귀 39/39. typecheck 0.
- **MOD-18 보존**: collapse 미지정→subtotal 라벨 plain·enableCollapse off→정적.

### G-2 advisor 후속(커밋 fold)
- **3-행차원 중첩 검증**: 2-dim fixture 는 subtotal depth 0 한 종류라 backward-scan 핵심 분기 미실행(부모 collapse 가
  중간 자식 subtotal 숨김·자식 collapse 가 형제 보존). → 3-dim(region×city×product) node fixture 추가: ①depth-0 부모
  collapse→East 후손+중간 subtotal(sNY/sBos) 전부 숨김, 가시=sEast,West,grandTotal ②depth-1 자식 collapse→NY data 만
  숨고 형제 Boston(data+subtotal) 잔존. collapse spine 11→**19**. "by construction"→"observed".
- **G-3 forward(advisor)**: collapsedIds/sort 는 `__id`/leafKey 키 → G-3 transpose/config 변경 시 computePivot 재실행으로
  __id 재배정·leafKey 변경 → **config 변경 시 collapse(+sort) state 리셋** 필수 + chromium "collapse 상태→transpose→깨끗이
  초기화" 단언(합성 함정의 G-3 판).
