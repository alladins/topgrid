# MOD-GRID-24 spec — 표시 고도화 (**MIT**, partial per §10.3 → **완료 {G-1,G-2}**)

> dev-harness loop 6번째. **descope(advisor, G-2 완료 후)**: 원 §6.1 4-feature 버킷은 *응집 모듈이 아니었다* — reuse-gate 가 이를 실증(alternating=신규 0, conditional=grid-features, floating=grid-core 두 패키지로 분산). **컬럼(가로) 가상화는 grid-core 렌더-엔진 인프라 변경**(표시 helper 아님)이라 본 모듈에 속하지 않음 → **별도 모듈 MOD-GRID-27 로 재범위**(§6 planned). 따라서 본 모듈 = **{G-1, G-2} 로 확정 → 완료 → §3 이관**(첫 partial-module 완주).
> **§3 이관 시 컬럼 가상화 주장 금지**(MOD-27 소관).
> reuse-gate(specify 선행 인벤토리, [[LESS-003]]): grid-core 가 **이미** `RowClassNameCallback`/`CellClassNameCallback`(types.ts:47/59) + `rowClassName`/`cellClassName` prop 노출. → **alternating·conditional 의 *메커니즘*은 이미 존재**. 따라서:
> - **alternating 행**: `rowClassName={(row)=> row.index%2 ? 'striped':''}` 로 이미 가능 → **신규 표면 0**(G-1 룰엔진이 포섭). 1줄 문서화만.
> - **conditional formatting**: 메커니즘 존재 → **선언적 룰→className 편의 레이어**(순수)만 신규 = **G-1**.
> - **pinned/floating 합계 행**·**컬럼 가상화**: grid-core 에 부재 → 진짜 신규(G-2/G-3, DOM-heavy/Full).
> duplicate-check: `grid-features`/`grid-renderers`/`grid-pro-*` 에 conditional-format/rule helper **0건**(grep: useRowKeyboardNav·useDebouncedCallback 만 매칭=무관). G-1 신규 확정.

## 핵심 설계 결정 — 배치(placement) = `@topgrid/grid-features`
§6.1 의 "(grid-core/renderers 확장)" 괄호는 러프 가정. 실제: G-1 은 grid-core 의 className 콜백 타입을 **소비해 생성하는 순수 add-on helper** → grid-features 의 택소노미(reorder/sort/filter = core 콜백·prop 생성 add-on)와 동형. grid-core(중심부) 비대화·blast-radius 회피 + grid-features(MIT, grid-core peer, 이미 grid-core 타입 re-export)에 자연 안착. → **grid-features 에 `conditional-format/` 신규**.

## Goal
표시 고도화 4종 중 grid-core 미존재분을 MIT 로 보강: **선언적 조건부 서식(G-1)** + **소비자 공급 floating 합계 행(G-2)** + **컬럼(가로) 가상화(G-3)**. alternating 은 기존 `rowClassName` 로 포섭(신규 0). 경쟁: XX Grid `rowClassRules`/`cellClassRules`·pinned rows·column virtualization.

## Scope (모듈 전체 — Goal 단위 partial)
- **In(G-1, 본 라운드)**: `grid-features/conditional-format` — 선언적 룰 배열 → grid-core `RowClassNameCallback`/`CellClassNameCallback` 컴파일하는 **순수 helper**.
- **In(G-2, 후속)**: 소비자 공급 합계 행 데이터를 tbody 상/하단 sticky 고정(grid-core 또는 확장). **집계 계산 X**(= grid-pro-agg/Pro 경계) — 소비자가 total row 객체 제공.
- **In(G-3, 후속·Full)**: 컬럼 가로 가상화(off-screen 컬럼 미렌더). 단일-table padding-cell 패턴·sticky 핀/resize/다단 헤더 상호작용. chromium 검증.
- **Out**: alternating 전용 prop(기존 `rowClassName` 포섭 — 신규 0), 집계 자동계산(Pro=grid-pro-agg), 행 핀(Pro=grid-pro-master).

## Goals
- **G-1 조건부 서식 룰 엔진(순수) — ✅ 완료**: `grid-features` 에 신규.
  - `RowFormatRule<TData> = { when: (data: TData, index: number) => boolean; className: string }`
  - `CellFormatRule<TData, TValue=unknown> = { when: (value: TValue, data: TData) => boolean; className: string }`
  - `buildRowClassName<TData>(rules: RowFormatRule<TData>[]): RowClassNameCallback<TData>` — `(row)` 에서 `row.original`/`row.index` 추출, 매칭 룰 className 공백 join, 무매칭 `undefined`.
  - `buildCellClassName<TData,TValue>(rules: CellFormatRule<TData,TValue>[]): CellClassNameCallback<TData>` — `(cell)` 에서 `cell.getValue()`/`cell.row.original` 추출, 동일 join 규칙.
  - 종결형(순수). grid-core 타입 import(type-only, peer). 외부 dep 0.
- **G-2 floating 합계 행 — ✅ 완료**: `floatingTopRows?`/`floatingBottomRows?: TData[]`(grid-core Grid props). `internal/buildFloatingRows`(순수, `createRow` → 셀이 `columnDef.cell` 통과). 소비자 공급(집계 X = agg/Pro), 상호작용 핀 아님(= master/Pro). 종결형+연결형.
- **G-3 컬럼 가상화 → MOD-GRID-27 로 재범위(본 모듈에서 제외)**: grid-core 렌더-엔진 인프라. 별도 모듈.

## ★ chromium 검증 (G-2 — 해소 완료)
node 검증으로 **구성/배치/회귀** 완결(buildFloatingRows 8/8 + Grid render 8/8, byte-identical 회귀). **시각 스크롤 고정**은 chromium 으로 **해소**:
- ~~알려진 이슈~~: 상단 floating 행 `top:0` ↔ sticky `<thead> top:0` 겹침. → **수정 완료**: `<thead>` 높이를 `useEffect` 로 측정(`theadRef.offsetHeight` → state)해 상단 floating 행 `sticky top: <thead-height>` 적용 → 헤더 *아래* 고정. 하단(`bottom:0`)은 해당 없음.
- **chromium 검증**: `pnpm -F docs build-storybook` → static serve(:6006) → `tests/visual/floating-thead.spec.ts`(playwright/chromium): `FloatingScrollable` 스토리(가상화+40행) 스크롤 후 **top floating 행 top ≥ thead bottom**(겹침 0) PASS. **dev-harness 루프 첫 실제 chromium 검증** — LESS-002 의 storybook+chromium 하네스가 실제로 작동함을 실증.
- story: `packages/grid-core/stories/Grid.floating-rows.stories.tsx`(상/하단·하단만·스크롤 가상화·회귀 4종). createColumns 는 `{id,name,type}` 형식 필수(`{accessorKey,header}` 는 비-string header→render throw, 스파이크가 검출).

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
