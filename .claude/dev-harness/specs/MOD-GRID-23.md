# MOD-GRID-23 spec — `@topgrid/grid-pro-edit-plus` (**Pro**, Full, partial per §10.3)

> dev-harness loop 7번째. tier=**Pro**(첫 Pro 모듈 since MOD-21 — 라이선스 게이트 PAT-003 복귀). weight=Full, **partial(§10.3)**: Goal 단위. **본 라운드 = G-1**(검증 룰 엔진 + 패키지 scaffold). 모듈 §6 `구현중`, §3 이관 X.
> reuse-gate(specify 선행 인벤토리, [[LESS-003]] — **live overlap**): `grid-pro-tracking` 가 이미 편집 인프라 대부분 보유:
> - `addRow`/`updateRow`/`deleteRow` + **`undoRow(key)`**(단일 행 undo) + `resetChanges()`(전체 복원) + `OriginalSnapshot.__original`(편집 전 값) → **undo/redo 의 절반 기존**(신규 = 다단계 스택+redo 뿐).
> - **`Validator<TData> = (row)=>{valid,errors?}`** + `getChangeSet().errors` → **검증 계약 + 커밋 차단(invalid 행 제외) 이미 존재**. 신규 = 선언적 룰→Validator 컴파일러 + 셀 시각표시.
> - `grid-pro-range`: `useClipboard`/`useKeyboardEdit`/`fillRange`/`parseTsv` → find&replace 의 클립보드/편집 표면 재사용처(후속 Goal).
> → **G-1 선택(advisor): 가장 self-contained·pure 한 slice = 검증 룰 엔진**(기존 `Validator` 계약 위 컴파일러). undo/redo 스택은 tracking seam 매핑 후 후속 Goal.

## 핵심 설계 결정 — 기존 계약 2개 위의 순수 컴파일러 (MOD-24 G-1 동형 패턴)
검증 메커니즘(커밋 차단)은 tracking 이 이미 함. 신규는 **선언적 룰을 두 기존 계약으로 컴파일**하는 순수 helper:
- `buildValidator(rules) → grid-pro-tracking 의 Validator<TData>` (행 검증 → tracking 이 invalid 행 commit 제외 = AC-4 커밋 차단 **무료 재사용**).
- `buildValidationCellClass(rules) → grid-core 의 CellClassNameCallback<TData>` (위반 필드 셀 className = AC-4 시각 표시; MOD-24 `buildCellClassName` 과 동일 계약·동형).
→ "선언적 룰 → 기존 콜백/계약 컴파일러" = MOD-24 G-1(`buildRowClassName`/`buildCellClassName`)에 이은 **N=2 패턴 후보**(capture 시 PAT 승격 점검).

## Goal
편집 생산성 Pro 패키지 — 선언적 검증 룰 엔진(G-1) + undo/redo 스택(G-2) + find&replace(G-3) + 셀 코멘트(G-4). 경쟁: xxxx·Handsontable·DevExpress 편집 고도화.

## Scope (모듈 전체 — Goal 단위 partial)
- **In(G-1, 본 라운드)**: `grid-pro-edit-plus` Pro 패키지 scaffold(라이선스 게이트) + 검증 룰 엔진(`buildValidator`/`buildValidationCellClass` + `ValidationRule` 타입).
- **In(후속)**: G-2 undo/redo 스택(tracking `undoRow`/`__original` 위 다단계+redo), G-3 find&replace(range `useClipboard`/`useKeyboardEdit` 재사용), G-4 셀 코멘트(storage 영속 — grid-core `useStoragePersist` 패턴).
- **Out**: 실시간 협업 동시편집. 자동 집계(=agg/Pro). tracking 의 기존 `Validator` 적용/커밋 로직 재구현(재사용만).

## Goals
- **G-1 검증 룰 엔진 + Pro scaffold — ★본 라운드**:
  - `ValidationRule<TData> = { field?: keyof TData & string; validate: (row: TData) => boolean; message: string; className?: string }` (`validate` true=통과).
  - `buildValidator<TData>(rules: ValidationRule<TData>[]): Validator<TData>` — 실패 룰 message 수집, `{valid:false, errors}` 또는 `{valid:true}`. tracking `config.validator` 에 직접 주입 가능.
  - `buildValidationCellClass<TData>(rules): CellClassNameCallback<TData>` — `cell.column.id === rule.field` 且 `!validate(row)` 인 셀에 `className`(기본 `topgrid-cell-invalid`) 부여, 무위반 `undefined`.
  - Pro scaffold: `package.json`(license EULA, `checkLicense` dep=grid-license, peer react/react-dom/@tanstack/react-table/@topgrid/grid-pro-tracking/@topgrid/grid-core), tsup dual, tsconfig, index.ts **module-load `checkLicense()`**(PAT-003), EULA.md, README.
  - 종결형(순수) + 권한가드(라이선스).
- **G-2 undo/redo 스택(후속)**: tracking `undoRow`/`__original` 위 다단계 history + redo. — planned.
- **G-3 find&replace(후속)**: 순수 검색(rows/range/scope) + replace→tracking `updateRow`. range `useClipboard` 재사용. — planned.
- **G-4 셀 코멘트(후속)**: 셀 노트 + storage 영속. — planned.

## AC (G-1 — 측정 가능, node 검증)
1. `buildValidator([{field:'age', validate:(r)=>r.age>=0, message:'음수 불가'}])`: `{age:-1}` → `{valid:false, errors:['음수 불가']}`; `{age:5}` → `{valid:true}`.
2. 다중 룰: 2 위반 → `errors` 2개(룰 순서); 0 위반 → `{valid:true}`(errors 없음).
3. **tracking 계약 적합**: `buildValidator` 반환이 `@topgrid/grid-pro-tracking` 의 `Validator<TData>` 타입에 대입 가능(consumer tsc) → tracking `config.validator` 로 사용 시 invalid 행 커밋 제외(AC-4 커밋 차단, tracking 기존 동작).
4. `buildValidationCellClass([{field:'age', validate:(r)=>r.age>=0, message:'', className:'bad'}])`: age 컬럼 셀이 음수 행에서 'bad', 양수 행/타 컬럼에서 `undefined`(real headless cell).
5. 반환이 grid-core `CellClassNameCallback<TData>` 에 대입 가능.
6. **Pro**: `license` EULA, index module-load `checkLicense()` 호출, EULA.md 존재, grid-license dependency. `tsc` 0 + tsup(CJS/ESM/dts). dist 금지어 0.

## constraints
- **PAT-003(라이선스 게이트)**: Pro 패키지 — index module-load `checkLicense()` + grid-license **runtime dependency**(첫 Pro since MOD-21, MIT 2연속 후 복귀).
- **POL-TANSTACK**: className/Validator 산출(선언형) — 명령형 DOM 조작 0.
- **C-003**: 주석/README ↔ 소스 동기. "검증 메커니즘은 tracking 기존, 본 모듈=컴파일러" 정확히 기술.
- **C-001/AP-001**: 본 모듈 외부 optional peer import 0. grid-pro-tracking/grid-core 는 type-only(peer). grid-license 는 required dep(Pro 게이트) — AP-001 vacuous.
- 발행물 금지어(TOMIS/topvel/@tomis) 0.

## 의존
dependency: `@topgrid/grid-license`(workspace:* — checkLicense). peer: `@topgrid/grid-pro-tracking`(Validator 타입), `@topgrid/grid-core`(CellClassNameCallback 타입), `@tanstack/react-table`, react/react-dom.

## 분류 (MASTER §2)
검증 룰 컴파일러 = 종결형(순수) · 라이선스 게이트 = 권한가드 · tracking/grid-core 계약 소비 = 연결형.

## 수확 예상 (capture 시 검증 — G-1)
reuse = **PAT-001**(순수 helper) + 기존 `Validator`(tracking, 커밋차단 무료) + `CellClassNameCallback`(grid-core) + **MOD-24 `buildCellClassName` 동형**(시각표시). **첫 Pro since MOD-21**(PAT-003 재적용 데이터포인트). 패턴 후보: **"선언적 룰→기존 계약 컴파일러"** N=2(MOD-24 G-1 + 본 G-1) → PAT 승격 점검. [[LESS-003]] live-overlap 4번째 데이터포인트(undo/redo·validation 둘 다 기존 위 축소).
