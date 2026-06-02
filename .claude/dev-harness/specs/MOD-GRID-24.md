# MOD-GRID-24 spec — 표시 고도화 (**Full**, **MIT**, partial per §10.3)

> dev-harness loop 6번째. weight=**Full**(컬럼 가상화가 진짜 hard — 단일-table padding-row 의 가로 아날로그·sticky 핀/resize/다단 헤더 상호작용·chromium 검증). **partial(§10.3)**: Goal 단위 점진. **본 라운드 = G-1 만**(conditional-format rule engine), 모듈은 §6 에 `구현중 (1/3)` 로 잔류(§3 이관 X).
> reuse-gate(specify 선행 인벤토리, [[LESS-003]]): grid-core 가 **이미** `RowClassNameCallback`/`CellClassNameCallback`(types.ts:47/59) + `rowClassName`/`cellClassName` prop 노출. → **alternating·conditional 의 *메커니즘*은 이미 존재**. 따라서:
> - **alternating 행**: `rowClassName={(row)=> row.index%2 ? 'striped':''}` 로 이미 가능 → **신규 표면 0**(G-1 룰엔진이 포섭). 1줄 문서화만.
> - **conditional formatting**: 메커니즘 존재 → **선언적 룰→className 편의 레이어**(순수)만 신규 = **G-1**.
> - **pinned/floating 합계 행**·**컬럼 가상화**: grid-core 에 부재 → 진짜 신규(G-2/G-3, DOM-heavy/Full).
> duplicate-check: `grid-features`/`grid-renderers`/`grid-pro-*` 에 conditional-format/rule helper **0건**(grep: useRowKeyboardNav·useDebouncedCallback 만 매칭=무관). G-1 신규 확정.

## 핵심 설계 결정 — 배치(placement) = `@topgrid/grid-features`
§6.1 의 "(grid-core/renderers 확장)" 괄호는 러프 가정. 실제: G-1 은 grid-core 의 className 콜백 타입을 **소비해 생성하는 순수 add-on helper** → grid-features 의 택소노미(reorder/sort/filter = core 콜백·prop 생성 add-on)와 동형. grid-core(중심부) 비대화·blast-radius 회피 + grid-features(MIT, grid-core peer, 이미 grid-core 타입 re-export)에 자연 안착. → **grid-features 에 `conditional-format/` 신규**.

## Goal
표시 고도화 4종 중 grid-core 미존재분을 MIT 로 보강: **선언적 조건부 서식(G-1)** + **소비자 공급 floating 합계 행(G-2)** + **컬럼(가로) 가상화(G-3)**. alternating 은 기존 `rowClassName` 로 포섭(신규 0). 경쟁: AG Grid `rowClassRules`/`cellClassRules`·pinned rows·column virtualization.

## Scope (모듈 전체 — Goal 단위 partial)
- **In(G-1, 본 라운드)**: `grid-features/conditional-format` — 선언적 룰 배열 → grid-core `RowClassNameCallback`/`CellClassNameCallback` 컴파일하는 **순수 helper**.
- **In(G-2, 후속)**: 소비자 공급 합계 행 데이터를 tbody 상/하단 sticky 고정(grid-core 또는 확장). **집계 계산 X**(= grid-pro-agg/Pro 경계) — 소비자가 total row 객체 제공.
- **In(G-3, 후속·Full)**: 컬럼 가로 가상화(off-screen 컬럼 미렌더). 단일-table padding-cell 패턴·sticky 핀/resize/다단 헤더 상호작용. chromium 검증.
- **Out**: alternating 전용 prop(기존 `rowClassName` 포섭 — 신규 0), 집계 자동계산(Pro=grid-pro-agg), 행 핀(Pro=grid-pro-master).

## Goals
- **G-1 조건부 서식 룰 엔진(순수) — ★본 라운드**: `grid-features` 에 신규.
  - `RowFormatRule<TData> = { when: (data: TData, index: number) => boolean; className: string }`
  - `CellFormatRule<TData, TValue=unknown> = { when: (value: TValue, data: TData) => boolean; className: string }`
  - `buildRowClassName<TData>(rules: RowFormatRule<TData>[]): RowClassNameCallback<TData>` — `(row)` 에서 `row.original`/`row.index` 추출, 매칭 룰 className 공백 join, 무매칭 `undefined`.
  - `buildCellClassName<TData,TValue>(rules: CellFormatRule<TData,TValue>[]): CellClassNameCallback<TData>` — `(cell)` 에서 `cell.getValue()`/`cell.row.original` 추출, 동일 join 규칙.
  - 종결형(순수). grid-core 타입 import(type-only, peer). 외부 dep 0.
- **G-2 floating 합계 행(후속, 미구현)**: 소비자 공급 행 sticky 상/하단. 집계 X. — planned.
- **G-3 컬럼 가상화(후속·Full, 미구현)**: 가로 가상화. chromium 검증. — planned.

## AC (G-1 — 측정 가능, node 검증)
1. `buildRowClassName([{when:(d,i)=>i%2===1, className:'striped'}])` → 짝/홀 행에 'striped' on/off(실제 headless TanStack Row 로 검증).
2. 다중 매칭: 2 룰 동시 만족 → className 공백 join('a b'), 0 매칭 → `undefined`.
3. `buildCellClassName([{when:(v)=> typeof v==='number'&&v<0, className:'neg'}])` → 음수 셀만 'neg', `cell.getValue()` 경유.
4. `when` 이 `data`(row.original) 접근 → 원본 객체 필드로 분기 가능(예 `d.status==='error'`).
5. 생성된 콜백이 grid-core `RowClassNameCallback`/`CellClassNameCallback` 타입에 **대입 가능**(consumer tsc).
6. 순수(부작용 0)·외부 import 0·MIT(라이선스 게이트 0). `tsc` 0 + tsup build(CJS/ESM/dts).

## constraints
- **POL-TANSTACK**: className 산출(선언형) — 명령형 DOM style 조작 X. 기존 grid-core 콜백 계약 위에 구축.
- **C-003**: 주석/README ↔ 소스 동기. alternating "신규 0, rowClassName 포섭" 정확히 문서화.
- **MIT 경계**: Pro 코드 0. G-2 합계행은 **집계 계산 안 함**(Pro=agg 경계), G-3 후속.
- **C-001/AP-001**: 본 모듈 외부 optional peer import 0(순수 helper).
- 발행물 금지어 0.

## 의존
G-1: peer `@topgrid/grid-core`(타입), `@tanstack/react-table`, react/react-dom — 기존 grid-features peer 그대로. 신규 dependency 0.

## 분류 (MASTER §2)
조건부 서식 룰 엔진 = 종결형(순수, className 산출). floating 합계행(G-2) = 종결형+연결형. 컬럼 가상화(G-3) = 종결형.

## 수확 예상 (capture 시 검증 — G-1)
reuse = **PAT-001**(순수 helper) + 기존 grid-core 콜백 계약 재사용(인벤토리가 alternating/conditional 메커니즘 기존 확인 → 신규를 룰-편의로 축소, [[LESS-003]] 3번째 데이터포인트). MIT/Lite-shaped Goal(Full 모듈의 첫 Goal). 신규 lesson 후보: 미정(클린 데이터포인트일 수 있음 — 단정 금지). **partial 첫 실증**(§10.3 — Goal 완료해도 모듈 §6 잔류).
