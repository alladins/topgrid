# G-003 Specification — buildChangeSet() : Mapping + Validator 통합 → 서버 payload 변환

**Module**: MOD-GRID-10 (ChangeTracking + Mapping + Validator — Wijmo CollectionView 대체)
**Goal**: G-003
**Area**: tracking
**Phase**: wijmo-class (Pro 패키지 3번째 Goal — payload 변환 / 유효성)
**Priority**: P0
**migrationImpact**: high
**threshold**: 95 (canonical-modules.json L346 `thresholds.specify=95`)
**spec 작성일**: 2026-05-15
**spec 버전**: v1.0 (loops 0/3, 첫 시도)
**라이선스 tier**: Pro (G-001 결정 cascade)
**선행 Goal**: G-002 (changeMap pure helpers + useChangeTracking shell 완료, score 100/100/100)

---

## ★ 사전 결정 표 (D# — 본문 cross-consistency 의무, rubric G-01 v1.0.4)

| D# | 결정 | 본문 위치 | 출처 |
|----|------|----------|------|
| D1 | 구현 대상 monorepo는 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/` (TOMIS git 외부). `goals.json` `implementFiles` 의 `TOMIS/packages/...` prefix (lines 219, 220, 222, 223) 는 잘못됨 → monorepo 경로 채택 (C-28 의무 — G-001 D1/D2 + G-002 D1 cascade) | Section 7 + Section 11 | MOD-GRID-00 ADR-001 + G-002 spec D1 + C-28 |
| D2 | G-003 범위 = **buildChangeSet 함수 본체** (pure) + **Mapping 적용 helper** (pure) + **Validator 실행 helper** (pure) + **useChangeTracking.getChangeSet wire-up** (shell). **NEW 3 파일** (`src/buildChangeSet.ts` + `src/internal/applyMapping.ts` + `src/internal/runValidator.ts`), **MODIFY 3 파일** (`src/types.ts` + `src/useChangeTracking.ts` + `src/index.ts`), **+ 1 ADR MODIFY** (`decisions/MOD-GRID-10-decisions.md` 신규 ADR-006). **합계 7 파일** (3 NEW + 4 MODIFY). | Section 7 표 (7 행) + Section 11 Step 1~7 | G-001 산출 Read + G-002 산출 Read + goals.json L218-224 |
| D3 | `MappedRow<TData>` named type 신설 (types.ts) = `Record<string, unknown>` (mapping 결과는 BE 필드명 기반 평면 객체이므로 TData 와 무관하게 `unknown` value union). `ChangeSet.added/updated/removed` 의 element type 을 G-001 의 `unknown[]` → `MappedRow[]` 로 alias 적용 (호환 — `MappedRow = Record<string, unknown>` 는 `unknown` 의 specialization, 기존 사용처 None 이므로 breaking 0). | Section 2.1 + Section 7 #4 + AC-003 | goals.json AC-003 본문 `MappedRow[]` 명시 + 자체 설계 |
| D4 | `Mapping<TData>` 시맨틱 = `mapping[BE필드명] = string \| ((row: TData) => unknown)`. **string value**: 원본 TData 의 *해당 이름 필드* 값을 그대로 BE 필드로 forward (`mapping.deptCode = 'department'` → `BE.deptCode = row.department`). **function value**: 호출하여 동적 계산 (`mapping.salary = row => row.grade * 1000`). G-001 types.ts L30 이미 시그니처 선언됨 (`Record<string, string \| ((row: TData) => unknown)>`) — G-003 은 **런타임 의미** 만 ADR-006 으로 명문화. Wijmo `applyMapping` (utils.ts §5) 개념 차용 / 코드 차용 0 (C-16) | Section 2.2 + ADR-006 + Section 6 EC-01/02 | G-001 types.ts L26-30 Read + Wijmo §5 L172-184 (개념만) |
| D5 | `Validator<TData>` 실행 시점 정책 = **buildChangeSet 호출 시 added + updated 각 row 마다 1 회 호출** (G-001 types.ts L37 시그니처 그대로). 결과 `{ valid, errors? }` 가 `valid===false` → 해당 row 를 added/updated 배열에서 *제외* + `errors[]` 에 `{ index, message, type: 'added'\|'updated' }` push. `removed` 행은 validator 호출 X (삭제는 검증 불필요). `errors[]` `message` = `validatorResult.errors[0] ?? '(unknown error)'` (멀티 메시지는 첫 번째만 — 추가 메시지는 G-005 commitChanges 응답 처리에서 확장). ADR-006 명문화. | Section 2.3 + ADR-006 + Section 6 EC-03 + AC-002 | goals.json AC-002 + 자체 설계 (async validator 거부는 ADR-002 trade-off cascade) |
| D6 | `buildChangeSet` 시그니처 = **`buildChangeSet<TData>(state: ChangeMapState<TData>, options?: BuildChangeSetOptions<TData>): ChangeSet`** (pure helper — useChangeTracking 외부에서도 호출 가능, 테스트 친화 C-32). `state` 는 G-002 changeMap.ts 의 `ChangeMapState<TData>` 그대로 (internal type 차용 — 같은 패키지 내부 사용은 export-out X). `options` = `{ mapping?: Mapping<TData>; validator?: Validator<TData> }` (optional 양쪽 모두 미제공 = 원본 직렬화 — AC-005). `originalMap` 의 pre-edit 값을 `updated` row 변환에 추가 metadata 로 *내포하지 않음* (BE 가 PK 만 받아 lookup 한다고 가정 — 가장 보편적인 REST PATCH 컨벤션). | Section 2.4 + Section 11.4 + ADR-006 | goals.json L186-192 user journey + 자체 설계 |
| D7 | `useChangeTracking.getChangeSet()` (G-002 stub `() => ({ added: [], updated: [], removed: [], errors: [] })`) 를 **`() => buildChangeSet(state, { mapping: config.mapping, validator: config.validator })`** 으로 교체. `config.mapping` / `config.validator` 는 G-001 `ChangeTrackingConfig` 의 optional field (types.ts L80-82). `useCallback` deps `[state, config.mapping, config.validator]`. | Section 11.5 Before/After + Section 11.3 Step 5 | G-002 useChangeTracking.ts L184-187 stub Read + types.ts L80-82 Read |
| D8 | **C-32 cascade — pure helpers (`src/internal/applyMapping.ts` + `src/internal/runValidator.ts` + 본체 `buildChangeSet.ts`) vs React shell (`useChangeTracking.ts` getChangeSet wire-up)** 분리 패턴 cascade 적용. G-002 changeMap.ts (pure 7 helpers) + useChangeTracking.ts (React shell) 패턴 그대로 따름. `buildChangeSet.ts` 자체는 React import 0건 (pure) — useChangeTracking.ts 만 `useCallback` 으로 wrap. C-32 권장 패턴 명시. | Section 11.1 + Section 11.3 표 헤더 | C-32 + G-002 harnessReview L162-163 (pure-helpers + React shell L-01) cascade |
| D9 | Storybook (AC-009) = G-003 단계 추가 story 1 개 (`useChangeTracking.stories.tsx` 에 *기존 G-002 cycle story 옆에* `WithMappingAndValidator` 또는 별도 CSF3 entry 추가). 별도 파일 미생성 (`__stories__/buildChangeSet.stories.tsx` 분리는 IMPLEMENT 자율). **본 spec Section 7 표에는 별도 행으로 enumerate 하지 않음** — G-002 spec L389 동일 정책 (Storybook 은 verifier 검증 항목, production src 만 권위적 표에 enumerate). | Section 5 AC-009 + Section 12 + Section 13 F-03 | goals.json L203 AC-009 본문 + G-002 spec L389 cascade |
| D10 | 번들 영향 = **+3 KB gzipped** (goals.json L227 `expected: "+3 KB"`). G-002 후 누적 4.14 KB brotli (verify feedback L150) → G-003 후 누적 ~7.14 KB brotli (한도 20 KB = 35.7% 사용). C-21 충분. `.size-limit.json` 수정 0. | Section 8.5 | goals.json L227 인용 + G-002 verify feedback L150 |
| D11 | `decisions/MOD-GRID-10-decisions.md` 신규 **ADR-MOD-GRID-10-006** 추가 — Mapping/Validator 런타임 시맨틱 + buildChangeSet API 표면. 기존 ADR-001~005 유지 (G-001/G-002 cascade). MODIFY 변경 LOC ~120 (단일 ADR 섹션 추가). C-14 의무 충족 (대안 2개+ + trade-off). AC-006 binding. | Section 7 #7 + Section 11 Step 7 + ADR 본문 (Section 7 직후 표) | C-14 + goals.json AC-006 |

**D# breakdown cross-check (G-01 v1.0.4 강화 — 합계/분류/이름 모두 일치)**:
- D2 명시 합계 **7 파일** = NEW 3 (`src/buildChangeSet.ts`, `src/internal/applyMapping.ts`, `src/internal/runValidator.ts`) + MODIFY 4 (`src/types.ts`, `src/useChangeTracking.ts`, `src/index.ts`, `decisions/MOD-GRID-10-decisions.md`). Section 7 표 7 행 (`#1`/`#2`/`#3` NEW + `#4`/`#5`/`#6`/`#7` MODIFY) 와 1:1 매칭. Section 11.3 Step 1~7 enumerate 와도 1:1 매칭.
- D3 MappedRow named export 추가 + D7 getChangeSet wire-up + D11 ADR-006 추가 는 각각 Section 7 표 `#4` (types.ts MODIFY) / `#5` (useChangeTracking.ts MODIFY) / `#7` (decisions.md MODIFY) 행의 하위 작업 — 별도 파일 X.
- D9 Storybook story 1 개 = Section 7 표 별도 행 미enumerate (G-002 spec L389 동일 정책). Section 12 검증 계획에서 의무화.

**E-06 자가-검증 (Spec Truth Table Discipline)**: 본 D# 표 + Section 7 표 + Section 11 Step 표 모두 7 파일 일치. 본문에 "재결정", "변경 대상", "대체", "수정함", "~로 변경", "~ 대신" 키워드 grep 결과 0 hits (재결정 없음 — 첫 시도 spec, 단순 추가 Goal).

---

## Section 1: 참조 추적

**(disclaimer — H-01 명확화)** 본 Section 1 표(L0/L1/L2/L3/R-A/R-W)는 **기존(pre-IMPLEMENT) referenceEvidence 참조 자료**만 enumerate. 본 G-003 가 새로 *생성*하는 산출물(NEW deliverable: `src/buildChangeSet.ts`, `src/internal/applyMapping.ts`, `src/internal/runValidator.ts` / MODIFY: `src/types.ts` MappedRow / `src/useChangeTracking.ts` getChangeSet wire-up / `src/index.ts` barrel / `decisions/MOD-GRID-10-decisions.md` ADR-006)은 Section 7 의 별도 권위 표(C-30)에서 관리됨. H-01 평가는 **본 Section 1 표의 참조 경로 실재** 만 대상.

### L0: 현 구현 (tw-framework-front)

**파일 경로 + Read 확인 (2026-05-15)**:

| 파일 | Read 라인 | 핵심 패턴 |
|------|----------|----------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | L1-130 (G-002 spec L51 인용) | `getChanges()` 가 `{ added, edited, deleted }` raw 객체 반환 — **mapping/validator 없음** (이 Goal 에서 통합) |

**핵심 발췌 — 현 getChanges (L94-104, G-002 spec L78 인용)**:
```tsx
const getChanges = useCallback(() => {
  return {
    added: trackedRows.filter(r => r.status === 'added').map(r => r.data),
    edited: trackedRows.filter(r => r.status === 'edited').map(r => r.data),
    deleted: trackedRows.filter(r => r.status === 'deleted').map(r => r.data),
  };
}, [trackedRows]);
```

**부족한 점 (G-003 강화 대상)**:
1. `mapping` 적용 0 — 화면 필드명 → BE 필드명 변환 없음 (G-003 AC-001/005 추가)
2. `validator` 실행 0 — 저장 전 검증 없음 (G-003 AC-002 추가)
3. `errors[]` 분리 0 — 검증 실패 행이 added/updated 와 섞이거나 페이지 단위 try/catch 의존 (G-003 AC-003 추가)
4. function-form mapping 0 — 동적 계산 (timestamp, lookup) 불가 (G-003 D4 + ADR-006 추가)

### L1: 자체 설계 — pure helpers + structuredClone + Record<string, unknown>

**파일 + Read 확인 (2026-05-15)**:

| 파일 | Read 라인 | 사용 |
|------|----------|------|
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/types.ts` | L1-122 (전체) | G-001/G-002 산출. `Mapping<TData>` L30 / `Validator<TData>` L37 / `ChangeSet` L57-62 / `ChangeTrackingConfig.mapping?` L80 / `.validator?` L82 모두 존재 — G-003 은 런타임 의미 채움 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/useChangeTracking.ts` | L1-220 (전체) | G-002 산출. `getChangeSet` stub L184-187 — G-003 wire-up 대상 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/internal/changeMap.ts` | L1-326 (전체) | G-002 산출. `ChangeMapState<TData>` L35-41 internal 타입 — G-003 의 `buildChangeSet` 가 1st arg 로 받음 (같은 패키지 내부 차용) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` | L1-21 (전체) | G-001 산출. barrel — `buildChangeSet` 신규 named export 추가 대상 (Pro hook + helper 2개 surface) |

**자체 설계 핵심 (D3 + D4 + D5)**:
```
MappedRow = Record<string, unknown>                          // BE 필드명 기반 평면 객체
Mapping<TData> = Record<string, string | (row: TData) => unknown>   // 이미 G-001 선언
Validator<TData> = (row: TData) => { valid: boolean; errors?: string[] }   // 이미 G-001 선언
```

**buildChangeSet 알고리즘 (의사 코드)**:
```
1. removed = state.statusMap 의 'deleted' 행 → currentMap[key] → applyMapping(row, mapping) → MappedRow[]
2. added = state.statusMap 의 'added' 행 → currentMap[key]:
     - validator 실행 → valid=false 면 errors[{index, message, type:'added'}] push, skip mapping
     - valid=true 면 applyMapping(row, mapping) → MappedRow → added[]
3. updated = state.statusMap 의 'edited' 행 → currentMap[key]:
     - validator 실행 → valid=false 면 errors[{index, message, type:'updated'}] push, skip mapping
     - valid=true 면 applyMapping(row, mapping) → MappedRow → updated[]
4. return { added, updated, removed, errors }
```

`index` 는 added/updated 그룹 내 0-based 순서 (insertion order from materialize 와 동일). `removed` 는 validator 호출 0 → errors 진입 X.

### L2: 신규 Pro 패키지 — G-001 에서 진입, G-002 changeMap 분리 완료

`@tomis/grid-pro-tracking` 의 G-002 까지 산출: `src/index.ts` (G-001) + `src/types.ts` (G-001/G-002) + `src/useChangeTracking.ts` (G-001 stub + G-002 본체) + `src/internal/changeMap.ts` (G-002 pure helpers) + `src/__stories__/useChangeTracking.stories.tsx` (G-002 CSF3). G-003 은 동일 패키지에 NEW 3 + MODIFY 4 추가.

### L3: 영향 사용처 (Read 확인)

| 파일 | Read 라인 | 사용 패턴 |
|------|----------|----------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | L1-130 (G-002 spec L51 cascade) | 본 G-003 미수정 — G-005 에서 `tracking.getChangeSet()` 결과 사용으로 마이그레이션 (alias 단계) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` | L1-185 (G-001 spec L86 인용) | 페이지 사용처 — G-005 마이그레이션 (본 G-003 미수정) |

**본 G-003 의 영향 사용처 수정 = 0 파일** (`affectedUsageFiles: []` — goals.json L225 명시). buildChangeSet 본체 + helper 추가 + useChangeTracking.getChangeSet wire-up 만으로 사용처는 자동 혜택 (G-001/G-002 시점 사용처 0 호출, G-005 가 통합 책임).

### R-A: AG Grid 동등 기능 — N/A

goals.json L210 명시: "AG Grid Server-side Row State 우회 패턴 참조 — 우리는 자체 changeSet". `references/publish-aggrid-analysis.md` (Glob 확인) §4 Undo/Redo 만 존재 — buildChangeSet/mapping/validator 컨셉 부재 → N/A.

### R-W: Wijmo `applyMapping` / `buildChangeSet` / `serializeChangeSet` — 참조 (코드 차용 X — C-16 절대)

**파일 + Read 확인 (2026-05-15)**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` L17 + L193 + §5 L172-184. 본 G-003 핵심 차용 *개념* (코드 X):
- `applyMapping(row, mapping)` — string entry forward + function entry call (G-003 D4)
- `buildChangeSet(view)` — added/updated/removed 분리 배열 + errors[] (G-003 AC-003)
- `serializeChangeSet` 는 본 G-003 범위 X — `commitChanges` 의 JSON.stringify 가 충분 (G-005 책임)

**코드 차용 X (C-16)**: `@mescius/wijmo*` import 0건 의무 — AC-007. 자체 구현 (3 NEW pure helper).

---

## Section 2: API 계약 (TypeScript)

본 G-003 은 G-001 의 `ChangeSet` / `Mapping<TData>` / `Validator<TData>` 시그니처를 그대로 유지하면서 **본체** + **MappedRow named export** 만 추가.

### 2.1 신규 / 갱신 타입 (export 경로: `@tomis/grid-pro-tracking/src/types.ts`)

**MODIFY — `MappedRow` named export 신설** (D3, AC-003):
```ts
/**
 * Result of applying a `Mapping<TData>` to a row — a flat plain object keyed by
 * BE field names. Value type is `unknown` because mapping functions can return
 * any serializable value (string/number/Date/structured object etc.).
 *
 * @see ADR-MOD-GRID-10-006 — `Mapping` semantics: string entries forward by
 *      source field name; function entries are called with the row.
 */
export type MappedRow = Record<string, unknown>;
```

**MODIFY — `ChangeSet.added/updated/removed` element type alias** (D3, AC-003):
```ts
// Before (G-001 types.ts L57-62):
export interface ChangeSet {
  added: unknown[];
  updated: unknown[];
  removed: unknown[];
  errors: Array<{ index: number; message: string; type: 'added' | 'updated' }>;
}

// After (G-003):
export interface ChangeSet {
  added: MappedRow[];
  updated: MappedRow[];
  removed: MappedRow[];
  errors: Array<{ index: number; message: string; type: 'added' | 'updated' }>;
}
```
`MappedRow = Record<string, unknown>` 는 `unknown` 의 specialization이므로 기존 `unknown[]` 사용처(이미 0건 — G-002 verify L150 git diff 0) 와 호환. Runtime 변화 0.

### 2.2 `applyMapping` helper (NEW — `src/internal/applyMapping.ts`)

**시그니처 (pure helper — D8 C-32)**:
```ts
import type { Mapping } from '../types';

/**
 * Apply a `Mapping<TData>` to a single row, producing a flat `MappedRow` keyed
 * by BE field names.
 *
 * Semantics (ADR-MOD-GRID-10-006):
 * - `mapping` undefined or empty object → return a shallow clone of `row` as a
 *   `Record<string, unknown>` (AC-005 — pass-through identity).
 * - For each `[beField, source]` in `mapping`:
 *   - `typeof source === 'string'` → forward `row[source]` to `result[beField]`.
 *   - `typeof source === 'function'` → call `source(row)`; the return value
 *     becomes `result[beField]`.
 *
 * The helper is pure — no `console.warn`, no side effects, no IO. Mapping
 * function exceptions propagate to the caller (`buildChangeSet`) which
 * surfaces them via `errors[]`.
 *
 * @template TData Row data type.
 */
export function applyMapping<TData>(
  row: TData,
  mapping?: Mapping<TData>,
): Record<string, unknown>;
```

**사용 예시 1 — mapping 미제공 (pass-through)**:
```ts
import { applyMapping } from './internal/applyMapping';

const row = { empId: 'e1', name: '홍길동', dept: 'D001' };
const result = applyMapping(row);
// result === { empId: 'e1', name: '홍길동', dept: 'D001' }   (shallow clone)
```

**사용 예시 2 — string + function mixed**:
```ts
const mapping = {
  empCode: 'empId',                          // string entry — row.empId 그대로 forward
  departmentCode: 'dept',                    // string entry — row.dept 그대로 forward
  salaryAmount: (r: Employee) => r.grade * 1000,   // function entry — 동적 계산
};
const result = applyMapping(row, mapping);
// result === { empCode: 'e1', departmentCode: 'D001', salaryAmount: 5000 }
```

### 2.3 `runValidator` helper (NEW — `src/internal/runValidator.ts`)

**시그니처 (pure helper — D8 C-32)**:
```ts
import type { Validator } from '../types';

/**
 * Run a `Validator<TData>` over a list of rows, returning per-row failure
 * descriptors suitable for `ChangeSet.errors[]`.
 *
 * Semantics (ADR-MOD-GRID-10-006):
 * - `validator` undefined → returns empty array (every row passes).
 * - For each `[index, row]`:
 *   - Call `validator(row)`. If the call throws, treat as a failure with
 *     `message = '(validator threw: <error.message>)'` (defensive — a
 *     validator should not crash buildChangeSet).
 *   - If `result.valid === true` → skip (no entry).
 *   - If `result.valid === false` → push `{ index, message, type }` where
 *     `message = result.errors?.[0] ?? '(unknown error)'`.
 *
 * `type` is the caller-supplied tag (`'added'` or `'updated'`); `removed`
 * rows do not go through this helper (D5).
 *
 * @template TData Row data type.
 */
export function runValidator<TData>(
  rows: readonly TData[],
  validator: Validator<TData> | undefined,
  type: 'added' | 'updated',
): Array<{ index: number; message: string; type: 'added' | 'updated' }>;
```

**사용 예시**:
```ts
import { runValidator } from './internal/runValidator';

const rows = [{ name: '홍길동' }, { name: '' }, { name: '이순신' }];
const validator = (r: { name: string }) => ({
  valid: r.name.length > 0,
  errors: r.name.length === 0 ? ['이름 필수'] : undefined,
});
const errors = runValidator(rows, validator, 'updated');
// errors === [{ index: 1, message: '이름 필수', type: 'updated' }]
```

### 2.4 `buildChangeSet` core function (NEW — `src/buildChangeSet.ts`)

**시그니처 (pure helper — D6 + D8 C-32)**:
```ts
import type { ChangeMapState } from './internal/changeMap';
import type { ChangeSet, Mapping, Validator } from './types';

export interface BuildChangeSetOptions<TData> {
  /** Screen-to-BE field mapping. When omitted, rows pass through as a shallow clone. */
  mapping?: Mapping<TData>;
  /** Row-level validator. When omitted, every row passes. */
  validator?: Validator<TData>;
}

/**
 * Build a server payload from a `ChangeMapState<TData>`.
 *
 * Algorithm (Section 1 L1):
 * 1. `removed` — every `state.statusMap[key] === 'deleted'` row → applyMapping
 *    (no validator call — deletes need only the PK).
 * 2. `added` — every `'added'` row → runValidator (type:'added'). Failing rows
 *    are excluded from `added[]` and recorded in `errors[]`.
 * 3. `updated` — every `'edited'` row → runValidator (type:'updated'). Same
 *    exclusion/error policy as `added`.
 * 4. Return `{ added, updated, removed, errors }`.
 *
 * Index numbering in `errors[]` is per-group 0-based (matches the position
 * the row WOULD have had in its respective array before validator exclusion;
 * callers using `errors[i].index` against the returned arrays should
 * cross-reference by `type` and pre-exclusion sequence).
 *
 * Pure — no React import, no `console.warn`, no IO.
 *
 * @see useChangeTracking — the React shell that wires this helper into the
 *      hook's `getChangeSet()` method (D7).
 * @template TData Row data type.
 */
export function buildChangeSet<TData>(
  state: ChangeMapState<TData>,
  options?: BuildChangeSetOptions<TData>,
): ChangeSet;
```

**사용 예시 1 — direct call (테스트 시나리오, useChangeTracking 외부)**:
```ts
import { buildChangeSet } from '@tomis/grid-pro-tracking';
import { createChangeMap, applyAdd } from '@tomis/grid-pro-tracking/internal/changeMap';   // (internal — test only)

// (Test scenario: build a state synthetically and run buildChangeSet)
const state = createChangeMap([{ empId: 'e1', name: '홍길동' }], r => r.empId);
const stateAfterAdd = applyAdd(state, { empId: 'e2', name: '신규' }, 'e2');
const cs = buildChangeSet(stateAfterAdd);
// cs === { added: [{ empId: 'e2', name: '신규' }], updated: [], removed: [], errors: [] }
```

**사용 예시 2 — useChangeTracking 통합 (production)**:
```ts
import { useChangeTracking } from '@tomis/grid-pro-tracking';

const tracking = useChangeTracking<Employee>({
  data,
  rowKey: 'empId',
  mapping: { empCode: 'empId', salaryAmount: r => r.grade * 1000 },
  validator: r => ({ valid: r.name.length > 0, errors: r.name ? [] : ['이름 필수'] }),
});

tracking.addRow({ empId: 'e2', name: '' });               // validator 실패 예정
const cs = tracking.getChangeSet();
// cs.added === []                                          (validator failure excluded)
// cs.errors === [{ index: 0, message: '이름 필수', type: 'added' }]
```

### 2.5 ref API / imperative handle

`buildChangeSet` 은 pure helper — ref 불필요. `useChangeTracking` 은 hook (G-002 cascade) — ref 불필요. specify-rubric B-05 = **N/A**.

### 2.6 export 경로

| 경로 | export |
|------|--------|
| `@tomis/grid-pro-tracking/src/types.ts` | 기존 8 타입 + `MappedRow` named export 추가 (D3) |
| `@tomis/grid-pro-tracking/src/buildChangeSet.ts` | (NEW) `buildChangeSet<TData>` + `BuildChangeSetOptions<TData>` (named exports — D6) |
| `@tomis/grid-pro-tracking/src/useChangeTracking.ts` | `useChangeTracking` (named export — G-001/G-002 시그니처 동일, getChangeSet 본체만 wire-up — D7) |
| `@tomis/grid-pro-tracking/src/index.ts` | barrel — `export { buildChangeSet, type BuildChangeSetOptions } from './buildChangeSet';` 추가. `MappedRow` 도 `export * from './types';` 로 자동 노출 |
| `@tomis/grid-pro-tracking/src/internal/applyMapping.ts` | (NEW, internal — 외부 barrel export X) `applyMapping` — `buildChangeSet.ts` 만 import |
| `@tomis/grid-pro-tracking/src/internal/runValidator.ts` | (NEW, internal — 외부 barrel export X) `runValidator` — `buildChangeSet.ts` 만 import |
| `@tomis/grid-pro-tracking/src/internal/changeMap.ts` | (G-002 cascade, MODIFY 0 — `ChangeMapState<TData>` 만 type import 로 사용) |

**internal/* 외부 노출 정책 (G-002 cascade)**: `applyMapping`/`runValidator` 는 barrel re-export 0 — 내부 helper. 단 `ChangeMapState<TData>` 는 type-only import 로 `buildChangeSet.ts` 가 사용 (같은 패키지 내부이므로 OK — 외부 노출 X).

---

## Section 3: 기존 사용처 대응표

| 기존 | 신규 API | 마이그레이션 액션 | 적용 Goal |
|------|---------|------------------|----------|
| `ChangeTrackingGrid.getChanges()` 의 `{ added, edited, deleted }` raw 객체 (현 L94-104, mapping 0) | `tracking.getChangeSet()` → `ChangeSet { added: MappedRow[], updated: MappedRow[], removed: MappedRow[], errors[] }` (본 G-003 에서 첫 동작 진입) | G-005 alias 단계 (호환 wrapper — 기존 `getChanges` 는 wrapper 가 `getChangeSet` 호출 후 형태 변환 가능) — **본 G-003 범위 X** | G-005 |
| PayrollEditablePage.tsx 의 저장 버튼 핸들러 (수동 mapping + try/catch validator) | `tracking.getChangeSet()` + `tracking.commitChanges(endpoint, options)` 일괄 | G-005 마이그레이션 — **본 G-003 범위 X** | G-005 |
| (기존 0) Wijmo `applyMapping(row, mapping)` 호출 (publish 측 utils.ts §5) | `applyMapping(row, mapping)` (`@tomis/grid-pro-tracking/internal/*` — *외부 노출 X*) — buildChangeSet 내부 1회 호출 | (해당 없음 — internal helper) | G-003 |

**G-003 범위 마이그레이션 액션**: **0건** (buildChangeSet + helper 추가 + getChangeSet wire-up — 사용처 변경 X, `affectedUsageFiles: []`). G-005 가 점진 마이그레이션 책임.

---

## Section 4: 호환성 정책

| 항목 | 값 | 근거 |
|------|-----|------|
| **Breaking change** | `false` (goals.json G-003 L213 명시) | G-001/G-002 의 `ChangeSet` / `Mapping` / `Validator` / `ChangeTrackingAPI.getChangeSet` 시그니처 100% 유지 — 본체만 채움 + `MappedRow` named export 는 `unknown` specialization (호환) |
| **Deprecation 전략** | "신규 기능 — alias 불필요" (goals.json L214) | G-001/G-002 stub getChangeSet → G-003 실 동작 교체 — public API 시그니처 동일 |
| **Migration path** | "(N/A)" (goals.json L215) | hook signature 동일 → 사용처 자동 혜택 (G-001/G-002 시점 사용처 0 호출 — stub 빈 ChangeSet) |
| **영향 사용처** | 0 파일 (goals.json L225 `affectedUsageFiles: []`) | buildChangeSet + helper 추가 + getChangeSet wire-up — 사용처 코드 변경 0 (G-005 책임) |
| **점진 단계** | G-001 (타입) → G-002 (changeMap 본체) → **G-003 (buildChangeSet + mapping + validator)** → G-004 (시각 마커 + undoRow) → G-005 (commitChanges + 사용처 마이그레이션 2 파일) | C-19 점진 ≤ 5 cascade — G-005 에서 2 사용처 한 번에 |
| **peerDependencies 정책 (C-22)** | G-001/G-002 그대로 (`react`, `react-dom`, `@tanstack/react-table` peer) — 신규 peer 0 | package.json L27-31 Read 확인 (수정 0) |
| **MOD-GRID-99-A 의존성 처리** | G-001/G-002 의 `verifyOrWarn` stub no-op 유지 (`src/index.ts` 호출 코드 수정 0 — 단 `buildChangeSet` named export 추가는 barrel 부 단순 export 추가) → MOD-GRID-99-A/G-002 완성 시 G-005/별도 wiring Goal 에서 실 호출로 교체 | G-001 ADR-003 cascade |
| **재구축 정책 (D6 G-002 cascade)** | `data` prop 변경 시 added/edited/deleted 폐기 + snapshot 재구축 + `console.warn` — G-002 ADR-005 그대로 | G-002 ADR-005 cascade (수정 0) |

---

## Section 5: 인수 기준 (AC)

goals.json G-003 의 9 AC + 각 출처 태그 + Section 7 매핑.

| AC ID | criteria | source | 검증 방식 | Section 7 매칭 (binding) |
|-------|----------|--------|----------|----------------------|
| AC-001 | `Mapping<TData> = Record<string, string \| ((row: TData) => unknown)>` — 문자열(필드명 매핑) + 함수(동적 변환) 지원 (no any — C-4 strict) | C-4 | `types.ts` Read — `Mapping<TData>` 시그니처 그대로 유지 + `applyMapping.ts` Grep `: any` 0 hits | `src/types.ts` (MODIFY — MappedRow 추가), `src/internal/applyMapping.ts` (NEW) |
| AC-002 | `Validator<TData> = (row: TData) => { valid: boolean; errors?: string[] }` — 변경 직전 자동 호출 (buildChangeSet 호출 시 added + updated row 마다 1 회 — D5) | L1 | `types.ts` Read — `Validator<TData>` 시그니처 그대로 유지 + `runValidator.ts` Grep `validator(rows[i])` 1+ hits + `buildChangeSet.ts` 가 added/updated 양쪽 runValidator 호출 | `src/types.ts` (MODIFY — 변경 0, 시그니처 유지), `src/internal/runValidator.ts` (NEW), `src/buildChangeSet.ts` (NEW) |
| AC-003 | `ChangeSet = { added: MappedRow[]; updated: MappedRow[]; removed: MappedRow[]; errors: Array<{ index, message, type: 'added'\|'updated' }> }` — publish utils.ts 동일 *컨벤션* (구조 학습, 코드 차용 X — C-16) | C-16 | `types.ts` Read — `ChangeSet` element type `MappedRow[]` alias 적용 + `MappedRow` named export 존재 + `buildChangeSet.ts` 반환 객체가 4-key 정확 | `src/types.ts` (MODIFY), `src/buildChangeSet.ts` (NEW) |
| AC-004 | `commitChanges(endpoint, options?: CommitOptions)` — fetch 또는 axios 주입(`CommitOptions.fetcher`) 자동 처리. `options.optimistic: boolean` — 낙관적 업데이트 + 에러 시 rollback. **본 G-003 범위 X (G-005 책임)** — 본 G-003 은 `ChangeSet` 생성까지만, 전송 단계는 미수행 | L1 | (G-003 검증 항목 X — G-005 책임. 본 spec 의 AC scope split — G-001 ADR-003 패턴 cascade). 본 G-003 의 `useChangeTracking.commitChanges` stub L189-200 = G-002 산출 그대로 유지 (수정 0) | (Section 7 표 외 — G-005 deliverable) |
| AC-005 | mapping 미제공 시 원본 TData 필드 그대로 직렬화 (기본 동작 — pass-through identity) | L1 | `applyMapping.ts` Read — `mapping === undefined \|\| Object.keys(mapping).length === 0` 분기 → shallow clone `{...row}` 반환 + 단위 테스트 시나리오 (Section 12) | `src/internal/applyMapping.ts` (NEW), `src/buildChangeSet.ts` (NEW) |
| AC-006 | `decisions/MOD-GRID-10-decisions.md` 에 Mapping/Validator 설계 ADR 포함 (C-14) — 대안 2개+ (Zod schema 통합 vs 자체 Validator + class-based hierarchy), trade-off 포함 | C-14 | `decisions/MOD-GRID-10-decisions.md` Read — ADR-MOD-GRID-10-006 신설 + 기존 ADR-002 (G-001) 와 cascade 명시 + 대안 2+ + trade-off + Consequences | `decisions/MOD-GRID-10-decisions.md` (MODIFY — ADR-006 추가) |
| AC-007 | `@mescius/wijmo*` import 0건 (C-16). `publish/wijmo-grid/utils.ts` 구조 학습만 (buildChangeSet *이름·개념* 차용, 코드 차용 X) | C-16 | `Grep '@mescius/wijmo' D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/` 0 hits | 모든 변경 파일 |
| AC-008 | C-12: `tsc --noEmit` 0 error (packages/grid-pro-tracking) | C-12 | `pnpm --filter @tomis/grid-pro-tracking typecheck` exit 0 | 전체 src/ |
| AC-009 | C-25: Storybook story 1개 (mapping/validator 적용 후 getChangeSet 결과 표시) — `useChangeTracking.stories.tsx` 에 신규 CSF3 entry 추가 또는 별도 stories 파일 (IMPLEMENT 자율 — D9) | C-25 | `src/__stories__/useChangeTracking.stories.tsx` Read — `WithMappingAndValidator` 또는 동등 신규 story 1+ + Storybook build 성공 | `src/__stories__/useChangeTracking.stories.tsx` (MODIFY — IMPLEMENT 자율, Section 7 표 외 deliverable — D9 명시) |

**E-01 binding cross-check (rubric v1.0.5)**:
- AC-001 ~ AC-009 모두 Section 7 표 또는 Section 12 검증 계획에 매칭됨.
- **AC-004 는 본 G-003 범위 X — G-005 책임 명시 (AC scope split)**. specify-rubric F-02 의 SPECIFY=계획 명시 cascade 패턴 적용 — 본 spec 은 `commitChanges` stub 유지 결정 명시 + G-005 책임 명시로 AC scope split.
- AC-009 binding 의 Storybook story 는 Section 7 표 외 deliverable (D9 명시) — Section 12 검증 표에 의무화.

**migration-impact 표시**: AC-001 ~ AC-003, AC-005 ~ AC-009 = 본 Goal 범위 100%. AC-004 = G-005 deferred (명시적 scope split — H-03 검증 시 source 태그 + scope-split 명시로 통과).

---

## Section 6: 엣지 케이스 (최소 3 — 본 spec 6건)

1. **mapping 미제공 (`options.mapping === undefined`) → pass-through identity (shallow clone)** — AC-005 직접 매핑.
   - `applyMapping(row, undefined)` 또는 `applyMapping(row, {})` → `{ ...row }` 반환 (shallow clone — 원본 mutation 방지).
   - `buildChangeSet({state})` 호출 시 mapping 없으면 added/updated/removed 모두 row 원본 필드 그대로 forward.
   - 기존 L0 `ChangeTrackingGrid.getChanges` 의 raw 객체 컨벤션과 호환.

2. **mapping function entry 가 throw → 호출자 책임 (buildChangeSet 에서 errors[] 변환)** — D4 + ADR-006.
   - `applyMapping` 자체는 try/catch 0 — 함수 entry 가 throw 하면 그대로 propagate.
   - `buildChangeSet` 의 added/updated 루프에서 try/catch 로 wrap (행 단위) — 실패 시 해당 row 를 errors[] 에 push (`message = '(mapping threw: <error.message>)'`, `type = 'added'|'updated'`), added/updated 배열에서 제외.
   - 대안 거부: `applyMapping` 내부 try/catch → 어떤 row 가 실패했는지 추적 불가. buildChangeSet 레벨에서 catch 가 index 정확.

3. **validator `errors` 배열 `undefined` 또는 빈 배열 (`{ valid: false, errors: undefined }`)** — D5 + ADR-006.
   - `runValidator` 가 `result.errors?.[0] ?? '(unknown error)'` 로 처리 — 검증 실패 시 메시지가 없어도 fallback 메시지로 errors[] 진입.
   - `errors` 배열이 빈 배열 (`[]`) 인 경우도 동일 — 첫 요소 undefined → fallback.

4. **validator 자체가 throw (예: row 의 undefined 필드 접근)** — D5 + ADR-006.
   - `runValidator` 가 try/catch 로 validator 호출 wrap — throw 시 `{ index, message: '(validator threw: <error.message>)', type }` push, valid=false 처리.
   - 대안 거부: catch 0 → buildChangeSet 전체 실패 → 어떤 row 도 안전하게 전송 불가. defensive try/catch 가 합리적.

5. **`deleted` 행의 raw 값 vs mapped 값** — D5 명문화 + ADR-006.
   - `state.statusMap[key] === 'deleted'` 행은 validator 호출 0. mapping 은 적용 (`applyMapping(currentMap.get(key), mapping)` — BE 가 PK 만 받아 lookup 한다고 가정 — D6).
   - `removed[]` 의 element 는 `MappedRow` (mapping 적용 결과). BE 가 PK 외 필드를 무시하면 그대로 동작; PK 외 필드도 의미 있으면 mapping 으로 forward.
   - 트레이드오프: BE 가 PK 만 받는 컨벤션이 대부분 — REST DELETE 또는 PATCH `{ deleted: [{empId: 'e1'}] }`. mapping 으로 BE 가 원하는 필드만 forward 가능.

6. **errors[] `type` 라벨 정확성 — 'added' vs 'updated' 매칭**.
   - `buildChangeSet` 의 added 루프 → `runValidator(addedRows, validator, 'added')` → type='added' errors entry.
   - updated 루프 → `runValidator(updatedRows, validator, 'updated')` → type='updated' errors entry.
   - removed 루프 → validator 호출 X → errors entry 0 (D5).
   - 호출자 (`commitChanges` G-005, 또는 페이지 UI) 가 `errors.filter(e => e.type === 'added')` 로 그룹 분리 가능.

---

## Section 7: 구현 대상 파일 (NEW/MODIFY) — 최종 implementFiles (authoritative)

D2 + D11 결정에 따라 본 표가 **유일한 권위적 변경 파일 정의** (C-30 의무). G-003 범위 내 모든 NEW/MODIFY 파일.

| # | 경로 | NEW/MODIFY | 변경 범위 | AC 매칭 |
|---|------|----------|---------|---------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/buildChangeSet.ts` | NEW | pure core function `buildChangeSet<TData>(state, options?): ChangeSet` + `BuildChangeSetOptions<TData>` interface. 약 70~110 LOC. ChangeMapState type import + applyMapping/runValidator helpers 호출. React import 0. **[deliverable — NEW; does NOT pre-exist; created in IMPLEMENT]** | AC-002, AC-003, AC-005, AC-008 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/internal/applyMapping.ts` | NEW | pure helper `applyMapping<TData>(row, mapping?): Record<string, unknown>` — string entry forward + function entry call + undefined/empty pass-through. 약 30~50 LOC. **[deliverable — NEW]** | AC-001, AC-005 |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/internal/runValidator.ts` | NEW | pure helper `runValidator<TData>(rows, validator?, type): Array<{index, message, type}>` — undefined fallthrough + try/catch defensive + errors[0] ?? fallback. 약 30~50 LOC. **[deliverable — NEW]** | AC-002, AC-003 |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/types.ts` | MODIFY | `MappedRow = Record<string, unknown>` named export 추가 (D3) + `ChangeSet.added/updated/removed` element type `unknown[]` → `MappedRow[]` alias 적용 (호환 — `MappedRow` 는 `unknown` specialization). 변경 LOC ~10 (export type 1 줄 + element type 3 줄 + JSDoc 5 줄) | AC-003, AC-008 |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/useChangeTracking.ts` | MODIFY | `getChangeSet` stub (G-002 L184-187 `() => ({ added: [], updated: [], removed: [], errors: [] })`) → `() => buildChangeSet(state, { mapping: config.mapping, validator: config.validator })` 본체로 교체 (D7). `useCallback` deps `[state, config.mapping, config.validator]`. 다른 stub (commitChanges G-005 / undoRow G-004) 그대로 유지. 변경 LOC ~8 (import 1 줄 + useCallback body 3 줄 + deps 1 줄). | AC-001, AC-002, AC-005 |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` | MODIFY | `export { buildChangeSet, type BuildChangeSetOptions } from './buildChangeSet';` 1 줄 추가 (barrel). `MappedRow` 는 기존 `export * from './types';` 로 자동 노출. `verifyOrWarn` 호출 코드 (L13-17) 수정 0. 변경 LOC ~1-2. | AC-003, AC-008 |
| 7 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-10-decisions.md` | MODIFY | ADR-MOD-GRID-10-006 추가 (Mapping/Validator runtime semantics + buildChangeSet API surface) — 기존 ADR-001~005 유지. 변경 LOC ~120 (단일 ADR 섹션 추가). 대안 2+ (Zod 통합 거부 cascade ADR-002 + class-based hierarchy 거부 cascade) + trade-off + Consequences. | AC-006 |

**ADR-MOD-GRID-10-006 신설 내용 (D4 + D5 + D6 묶음)**:
- **Context**: G-001 ADR-002 가 `Mapping<TData>` / `Validator<TData>` 시그니처를 결정하면서 *runtime 의미* 는 G-003 으로 deferred. 이 ADR 이 그 빈 곳을 채움.
- **Decision**:
  1. `Mapping` string entry = 원본 TData 의 같은 이름 필드 forward (`mapping[BE] = 'sourceField'` → `BE = row.sourceField`). function entry = 호출하여 동적 값.
  2. `Validator` 는 `buildChangeSet` 호출 시 added + updated 각 row 마다 1 회 호출 (sync only — async 거부 cascade ADR-002). `valid===false` row 는 결과 배열에서 제외 + errors[] 진입. `removed` row 는 호출 0.
  3. `buildChangeSet(state, options?)` 가 pure helper — useChangeTracking 외부에서도 호출 가능 (테스트 친화 C-32).
  4. errors[] `message` = `validatorResult.errors?.[0] ?? '(unknown error)'`. validator throw → `'(validator threw: <error.message>)'`. mapping function throw → `'(mapping threw: <error.message>)'`.
- **Alternatives**:
  1. **Mapping 이 행렬-style 변환 (`Map<TData[key], BEFieldName>`)** — 거부 (Wijmo `applyMapping` 컨벤션과 정반대 + function entry 표현 불가 → 동적 계산 손실).
  2. **Validator 가 async (Promise<{valid, errors}>) 지원** — 거부 (ADR-002 trade-off cascade — async 는 commit 전 pre-flight 로 호출자 책임).
  3. **mapping 결과를 TData 의 subset 유지 (`Partial<TData>`)** — 거부 (function entry 가 새 필드 생성 불가 → 매핑 본래 목적 손실).
- **Trade-offs**:
  - errors[] `message` 가 첫 번째 string 만 보관 — 멀티 에러는 G-005 commit 응답에서 확장 (push 자체는 `errors[0]` 만).
  - mapping function throw 를 행 단위 try/catch 로 격리 — pure helper applyMapping 자체는 try/catch 0 (buildChangeSet 레벨에서 catch).
  - validator 의 sync-only 제약 — 호출자가 async 필요하면 buildChangeSet 외부에서 pre-validate.
- **Consequences**:
  - G-005 의 commitChanges 가 `ChangeSet.errors[]` 를 받아 UI 토스트/모달 표시 가능 (errors[].index + type 으로 정확한 행 강조).
  - G-004 의 `undoRow` 는 본 ADR 의 validator 정책과 독립 — undo 는 검증 0.
  - `MappedRow` named type 도입으로 G-005 commitChanges 의 fetch body 타입이 `MappedRow[]` 로 명확.

**Storybook story (AC-009 deliverable — D9)**:
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/__stories__/useChangeTracking.stories.tsx` (MODIFY — IMPLEMENT 자율 추가). Section 7 표에는 포함하지 않으나 (story 파일은 verifier 검증 항목 — G-002 spec L389 동일 정책) Section 12 검증 계획에서 의무화. G-002 implement 단계에서 이미 생성된 파일 (Get-ChildItem 확인 — L1-?? G-002 cycle story 존재) → CSF3 entry 추가 또는 새 story file 생성 (IMPLEMENT 자율).

**Section 11 Step 1~7 enumerate 와의 cross-check (E-01 강화)**: 위 7 행 모두 Section 11 Step 별로 1:1 매칭 (Step 1 = #4 types, Step 2 = #2 applyMapping, Step 3 = #3 runValidator, Step 4 = #1 buildChangeSet, Step 5 = #5 useChangeTracking, Step 6 = #6 index barrel, Step 7 = #7 ADR).

**E-06 자가-검증**: 본 섹션 본문에 "재결정", "변경 대상", "대체", "수정함", "~로 변경", "~ 대신" 키워드 grep — 0 hits (모순 없음). D2 결정 (7 파일 = NEW 3 + MODIFY 4) 과 표 7 행 일치.

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처 카운트 + 파일 목록

| # | 파일 | 사용 패턴 |
|---|------|----------|

**총 0 파일** (goals.json G-003 L225 `affectedUsageFiles: []` — buildChangeSet 본체 + helper 추가 + getChangeSet wire-up 단계, 사용처 변경 0). C-19 점진 ≤ 5 충족 (`0 ≤ 5`). G-005 가 사용처 변경 책임 (2 파일 — ChangeTrackingGrid.tsx + PayrollEditablePage.tsx).

**G-003 미수정 파일 — 본 Goal 의무 X**:
- `tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` — G-005 alias 단계
- `tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` — G-005 페이지 마이그레이션
- `src/internal/changeMap.ts` — G-002 산출 그대로 (G-003 은 type-only import 만)
- `package.json` — peerDependencies 변경 0 (G-001/G-002 cascade)
- `tsconfig.json` / `tsup.config.ts` — 빌드 설정 변경 0

### 8.2 무파괴 검증 방법

- **타입 검증**: `pnpm --filter @tomis/grid-pro-tracking typecheck` exit 0 (C-12 / AC-008)
- **빌드 검증**: `pnpm --filter @tomis/grid-pro-tracking build` (= `tsup`) exit 0 — CJS + ESM + d.ts dual
- **시각 회귀 (C-13/C-17)**: 영향 사용처 0 → C-17 N/A 조건 충족 ("사용처 0개 또는 변경 없는 Goal"). Storybook story 1개 (AC-009) 는 본 G-003 의 단위 시각 검증 — mapping/validator 적용 후 getChangeSet 결과 표시.
- **단위 테스트 (Section 12)**: 4 ~ 6개 vitest 시나리오 (mapping pass-through, string + function mixed, validator 성공/실패, mapping function throw, errors[] type 라벨, removed validator skip). IMPLEMENT 자율 — AC 의무 X.
- **import 검증 (C-31 wiring audit)**: `Grep buildChangeSet src/useChangeTracking.ts` → 1+ hits 의무 (D7 wire-up). `Grep applyMapping src/buildChangeSet.ts` → 1+ hits 의무. `Grep runValidator src/buildChangeSet.ts` → 1+ hits 의무.

### 8.3 점진 단계

- 1단계 (G-001): 타입 + hook stub — 완료
- 2단계 (G-002): changeMap helpers + hook 본체 — 완료
- **3단계 (본 G-003)**: buildChangeSet + applyMapping + runValidator + getChangeSet wire-up**
- 4단계 (G-004): undoRow 본체 + 시각 마커 (`rowStatusStyle.ts`)
- 5단계 (G-005): commitChanges 본체 + ChangeTrackingGrid alias + 사용처 마이그레이션 (2 파일, C-19 ≤ 5 충족)

### 8.4 롤백 전략

- **deliverable 단위 롤백 가능**: NEW 3 파일 삭제 (`src/buildChangeSet.ts` + `src/internal/applyMapping.ts` + `src/internal/runValidator.ts`) + `src/useChangeTracking.ts` 의 `getChangeSet` 를 G-002 stub (`() => ({ added: [], updated: [], removed: [], errors: [] })`) 으로 복원 + `src/index.ts` 의 `export { buildChangeSet, ... }` 1 줄 제거 + `src/types.ts` 의 `MappedRow` named export 제거 + `ChangeSet.added/updated/removed` element type 을 `unknown[]` 으로 복원 + `decisions/MOD-GRID-10-decisions.md` 의 ADR-006 섹션 제거. 사용처 0 → 안전. (참고: G-002 spec Section 8.4 cascade — 같은 롤백 패턴)
- **deprecated alias 1 minor 유지** (G-005 도입 후) — 본 G-003 범위 X

### 8.5 번들 영향

- **+3 KB gzipped** (goals.json L227 `expected: "+3 KB"`) — `buildChangeSet.ts` ~80 LOC + `applyMapping.ts` ~40 LOC + `runValidator.ts` ~40 LOC + types.ts MappedRow ~5 LOC. tsup tree-shake 후 gzipped 2-3 KB 예상.
- **누적 ~7.14 KB brotli / 한도 20 KB** (D10 + G-002 verify feedback 4.14 KB = 35.7% 사용). 충분히 여유. G-004 +1 KB / G-005 +3 KB 예상 → 총 ~11 KB brotli (55%). 한도 안 충분.
- `.size-limit.json` 수정 0 (한도 20 KB 변경 X).

---

## Section 9: 의존성

### peerDependencies (이미 `package.json` L27-31 선언됨 — G-001/G-002 cascade)

```json
{
  "@tanstack/react-table": "^8.0.0",
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

### dependencies

**0 신규** — `buildChangeSet` / `applyMapping` / `runValidator` 모두 pure JS (no library). `structuredClone` 미사용 (G-003 은 originalMap 변경 X — G-002 가 책임). polyfill 0 (C-21 의무 — 추가 deps 없음).

### devDependencies (monorepo root hoisted)

- `tsup` (빌드 — G-001/G-002 cascade)
- `typescript` (typecheck)
- `@types/react`, `@types/react-dom` (workspace shared — useChangeTracking.ts wire-up 만 React 의존, buildChangeSet/applyMapping/runValidator 는 React import 0)
- `@storybook/react-vite` (AC-009 Storybook — G-002 implement 단계에서 이미 monorepo root 에 존재 확인됨 — `__stories__/useChangeTracking.stories.tsx` 산출됨)
- `vitest` (Section 12 단위 테스트 — IMPLEMENT 자율, AC 의무 X)

### MOD-GRID-99-A 의존성 처리

G-001 의 `verifyOrWarn` stub no-op 그대로 유지 (`src/index.ts` L13-17 호출 코드 수정 0 — barrel `export { buildChangeSet }` 1 줄 추가만). MOD-GRID-99-A/G-002 완성 시 G-005 또는 별도 wiring Goal 에서 실 호출로 교체.

---

## Section 10: 사용자 여정 매핑

### 개발자 (페이지 작성자) — G-003 시점

1. `import { useChangeTracking, type MappedRow, type BuildChangeSetOptions } from '@tomis/grid-pro-tracking'` (MappedRow + BuildChangeSetOptions 신규 — D3 + D6)
2. `const tracking = useChangeTracking<Employee>({ data, rowKey: 'empId', mapping: { empCode: 'empId', salaryAmount: r => r.grade * 1000 }, validator: r => ({ valid: r.name.length > 0, errors: r.name ? [] : ['이름 필수'] }) })` — G-001 시그니처 동일 (mapping/validator optional)
3. `tracking.addRow(...)` / `tracking.updateRow(...)` / `tracking.deleteRow(...)` — G-002 본체 그대로
4. `tracking.getChangeSet()` 호출 → **G-002 빈 ChangeSet → G-003 mapping/validator 적용된 ChangeSet**
5. `cs.added` / `cs.updated` / `cs.removed` 각각 `MappedRow[]` — BE 필드명으로 변환된 객체 배열
6. `cs.errors[]` — `[{ index, message, type: 'added'\|'updated' }]` — 검증/매핑 실패 행
7. (G-005 단계) `tracking.commitChanges(endpoint)` → fetch/axios 호출 → 응답 처리 → `tracking.resetChanges()` 또는 rollback

### 최종 사용자 (그리드 사용자)

- G-003 단계: 사용자 변화 없음 (사용처 0 — `affectedUsageFiles: []`). G-002 시점 getChangeSet 빈 객체 → G-003 후 실 ChangeSet 으로 교체되지만, 사용처 0 호출이므로 즉시 user-facing 변화 X.
- G-004 단계: 행 추가/수정/삭제 시 색상 시각화 + 행 단위 undo
- G-005 단계: 저장 버튼 → commitChanges → 서버 전송 + 에러 토스트 + 성공 시 resetChanges

---

## Section 11: 구현 계획

### 11.1 파일별 변경 명세

Section 7 표 7 행 + Storybook story (deliverable AC-009 — D9 자율 추가) 와 1:1 매칭 (E-01 cross-check 충족). 본 G-003 의 IMPLEMENT 작업 순서는 다음 11.3 참고.

**C-32 pure helpers + React shell 분리 (D8 cascade — G-002 패턴)**:
- **Pure helpers** (React import 0): `src/buildChangeSet.ts` + `src/internal/applyMapping.ts` + `src/internal/runValidator.ts` (3 NEW)
- **React shell** (`useReducer`/`useCallback` wrap): `src/useChangeTracking.ts` 의 `getChangeSet` useCallback (MODIFY 1 — D7)

### 11.2 Before/After 코드 스니펫

**Before (`src/types.ts` G-001 산출 L57-62)** — `ChangeSet` element type `unknown[]`:
```ts
export interface ChangeSet {
  added: unknown[];
  updated: unknown[];
  removed: unknown[];
  errors: Array<{ index: number; message: string; type: 'added' | 'updated' }>;
}
```

**After (G-003 — D3 MappedRow alias 적용)**:
```ts
/** Result of applying a Mapping<TData> to a row. */
export type MappedRow = Record<string, unknown>;

export interface ChangeSet {
  added: MappedRow[];
  updated: MappedRow[];
  removed: MappedRow[];
  errors: Array<{ index: number; message: string; type: 'added' | 'updated' }>;
}
```

**Before (`src/useChangeTracking.ts` G-002 산출 L183-187)** — `getChangeSet` stub:
```ts
// G-003 wires mapping/validator into a real ChangeSet payload.
const getChangeSet = useCallback(
  (): ChangeSet => ({ added: [], updated: [], removed: [], errors: [] }),
  [],
);
```

**After (G-003 — D7 buildChangeSet wire-up)**:
```ts
import { buildChangeSet } from './buildChangeSet';

// ... inside useChangeTracking body ...

const getChangeSet = useCallback(
  (): ChangeSet => buildChangeSet(state, {
    mapping: config.mapping,
    validator: config.validator,
  }),
  [state, config.mapping, config.validator],
);
```

핵심 변화: **stub 빈 ChangeSet → buildChangeSet(state, options) 호출**. `state` 는 useReducer 의 1st return value (G-002 cascade). `config.mapping` / `config.validator` 는 G-001 `ChangeTrackingConfig.mapping?` / `.validator?` (types.ts L80-82 — optional, undefined 가능).

**C-29 `exactOptionalPropertyTypes` 처리 (D8 cascade)**: `config.mapping` / `config.validator` 가 `T | undefined` 인데 `BuildChangeSetOptions<TData>.mapping?: T` 가 optional → 직접 forwarding 시 TS2375. 해결 = `BuildChangeSetOptions<TData>` 의 `mapping` / `validator` 를 **union 명시 (`T | undefined`)** 패턴 (C-29 2번 패턴) 으로 정의 — 내부 헬퍼이므로 가독성 손상 X. IMPLEMENT 단계 grep 검증 (`exactOptionalPropertyTypes` Glob 확인 G-001/G-002 cascade 후 동일 환경 가정).

### 11.3 구현 순서 (7 단계)

| Step | 작업 | 산출물 | 검증 |
|------|------|--------|------|
| **Step 1** | `src/types.ts` MODIFY — `MappedRow = Record<string, unknown>` named export 추가 (D3) + `ChangeSet.added/updated/removed` element type `unknown[]` → `MappedRow[]` alias 적용 + JSDoc | Section 7 #4 | tsc 0 error, types.ts Grep `MappedRow` 4+ hits (declaration + 3 ChangeSet 필드) |
| **Step 2** | `src/internal/applyMapping.ts` NEW — pure helper `applyMapping<TData>(row, mapping?)`. mapping undefined/empty → shallow clone. string entry forward. function entry call. C-29 `exactOptionalPropertyTypes` 준수 | Section 7 #2 | tsc 0 error, Grep `: any` 0 hits, Grep `applyMapping` (definition site) 1+ hits |
| **Step 3** | `src/internal/runValidator.ts` NEW — pure helper `runValidator<TData>(rows, validator?, type)`. validator undefined → empty array. try/catch wrap validator call. errors[0] ?? fallback. | Section 7 #3 | tsc 0 error, Grep `: any` 0 hits, Grep `try` + `catch` 1+ hits each |
| **Step 4** | `src/buildChangeSet.ts` NEW — pure core `buildChangeSet<TData>(state, options?)`. `ChangeMapState<TData>` type import (internal — 같은 패키지). removed → applyMapping. added/updated → runValidator + applyMapping (행 단위 try/catch — mapping function throw 격리). | Section 7 #1 | tsc 0 error, Grep `import.*applyMapping` 1+ hits, Grep `import.*runValidator` 1+ hits, Grep `react` 0 hits (pure — D8) |
| **Step 5** | `src/useChangeTracking.ts` MODIFY — `getChangeSet` stub L184-187 → `buildChangeSet(state, { mapping: config.mapping, validator: config.validator })` 호출로 교체 (D7). `useCallback` deps `[state, config.mapping, config.validator]`. import 1줄 추가. 다른 stub (commitChanges G-005 / undoRow G-004) 그대로 유지. | Section 7 #5 | tsc 0 error, Grep `buildChangeSet` 1+ hits (import + 호출 — C-31 wiring audit), `useCallback` deps에 state/mapping/validator 포함 확인 |
| **Step 6** | `src/index.ts` MODIFY — `export { buildChangeSet, type BuildChangeSetOptions } from './buildChangeSet';` 1 줄 추가 (barrel). `verifyOrWarn` 호출 코드 L13-17 수정 0. `MappedRow` 는 기존 `export * from './types';` 로 자동 노출. | Section 7 #6 | tsc 0 error, index.ts Grep `buildChangeSet` 1+ hits, `verifyOrWarn` 호출 (L17) 그대로 유지 확인 |
| **Step 7** | `decisions/MOD-GRID-10-decisions.md` MODIFY — ADR-MOD-GRID-10-006 추가 (Mapping/Validator runtime semantics + buildChangeSet API surface). 기존 ADR-001~005 유지. + `src/__stories__/useChangeTracking.stories.tsx` MODIFY (AC-009, D9) — `WithMappingAndValidator` CSF3 entry 추가 또는 별도 stories 파일 (IMPLEMENT 자율). | Section 7 #7 + Storybook | ADR-006 Read + alternatives 2+ + trade-off + Consequences, story `WithMappingAndValidator` (또는 동등) 1+ hits + Storybook build 성공 |

### 11.4 위험 요소 (TBD/TODO 회피 — G-01 의무)

- **risk-1 (D1 cascade)**: `goals.json` `implementFiles` (L219, 220, 222, 223) 의 `TOMIS/packages/...` prefix 잔존 → 본 spec D1 결정으로 monorepo 경로 채택 (C-28 의무 충족 — G-001/G-002 cascade). Implementer 가 spec 우선 적용 (C-27).
- **risk-2 (Storybook deps cascade)**: G-002 implement 단계에서 `@storybook/react-vite` monorepo root 에 이미 존재 확인됨 (`__stories__/useChangeTracking.stories.tsx` 생성 성공). 본 G-003 은 같은 파일 MODIFY 또는 자매 파일 NEW (IMPLEMENT 자율 — D9). 재확인 의무 0.
- **risk-3 (errors[] index 의미)**: errors[].index 는 *pre-exclusion* 순서 (validator 실패 전 added/updated 배열 인덱스). 호출자가 cs.added[index] 로 직접 접근하면 index out-of-bounds (실패 행이 제거됐으므로). 해결 = ADR-006 의 Consequences 명시 + JSDoc 명시 — 호출자가 `cs.errors.filter(e => e.type === 'added')` 로 그룹 분리 후 type+pre-exclusion sequence 로 cross-reference. G-005 의 commitChanges UI 에서 정확한 행 강조에 사용.
- **risk-4 (`config.mapping` / `config.validator` 가 useReducer 의 state 비교에서 새 reference 매 렌더)**: 만약 호출자가 인라인 객체/함수 `mapping={{ empCode: 'empId' }}` 로 전달하면 매 렌더마다 new reference → `useCallback([state, config.mapping, config.validator])` deps 가 매 렌더 변화 → 매 렌더 새 getChangeSet 함수. 해결 = JSDoc 권장 사항 명시 (호출자가 `useMemo` 로 mapping/validator wrap). 본 G-003 의 hook 자체는 정상 동작 — 단지 reference 안정성 권장.
- **risk-5 (`exactOptionalPropertyTypes` C-29 패턴)**: `BuildChangeSetOptions<TData>` 의 `mapping?: Mapping<TData>` 정의 시 useChangeTracking 에서 `config.mapping` (`Mapping<TData> | undefined`) 을 직접 forwarding 하면 TS2375. 해결 = C-29 2번 패턴 (union 명시 `mapping: Mapping<TData> | undefined`) 또는 1번 패턴 (spread skip `{...config.mapping !== undefined ? {mapping: config.mapping} : {}}`). 본 spec 은 2번 (union 명시) 권장 — internal helper 가독성 손상 X. IMPLEMENT 단계 grep 검증.
- **risk-6 (mapping 결과 vs originalMap pre-edit 값 손실)**: G-002 의 `originalMap` (edited row 의 pre-edit snapshot) 은 buildChangeSet 의 `updated[]` 변환 시 *포함되지 않음* (D6 결정 — BE 가 PK lookup 한다고 가정). 만약 호출자가 BE PATCH 에서 pre-edit 값을 함께 보내야 하면 G-005 commit 단계에서 `state.originalMap` 을 별도 ChangeSet 확장 필드로 분리 (본 G-003 범위 X — 미래 ADR-007 가능).
- **추후 결정 미존재**: 본 spec 내 TBD/TODO/미정 표현 0건 — Section 7 표 권위 + ADR-006 명문화로 모든 결정 spec-time 확정.

---

## Section 12: 검증 계획

| 검증 | 방법 | 통과 기준 | Goal 범위 |
|------|------|----------|---------|
| **타입 (C-12 / AC-008)** | `pnpm --filter @tomis/grid-pro-tracking typecheck` (= `tsc --noEmit`) | exit 0, 0 errors | G-003 |
| **빌드** | `pnpm --filter @tomis/grid-pro-tracking build` (= `tsup`) | dist/ CJS + ESM + d.ts 모두 생성, 누적 ≤ 20 KB gzipped | G-003 |
| **번들 한도 (C-21)** | size-limit (monorepo `.size-limit.json` — G-001/G-002 verify 단계 통과 확인) | grid-pro-tracking ≤ 20 KB gzipped, 누적 ~7.14 KB brotli 예상 (G-002 4.14 + G-003 ~3) | G-003 |
| **Wijmo import 0건 (C-16 / AC-007)** | `Grep '@mescius/wijmo' D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/` | 0 hits | G-003 |
| **`: any` 0건 (C-4 / AC-001)** | `Grep ': any\|<any>\|as any\|@ts-ignore\|@ts-nocheck' D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/` | 0 hits | G-003 |
| **C-31 functional wiring audit (D7 cascade)** | `Grep buildChangeSet D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/useChangeTracking.ts` + `Grep applyMapping D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/buildChangeSet.ts` + `Grep runValidator D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/buildChangeSet.ts` | 각각 1+ hits (import + 호출) | G-003 |
| **단위 테스트 (권장 — AC-001/002/003/005 binding)** | vitest 4-6 시나리오: (a) mapping 미제공 pass-through (AC-005), (b) string + function mixed mapping (AC-001), (c) validator 성공 + 실패 (AC-002), (d) mapping function throw → errors[] 진입 (EC-02), (e) errors[] type 라벨 정확성 (EC-06), (f) removed 행 validator skip (D5). **단위 테스트 파일 NEW (`__tests__/buildChangeSet.test.ts` — IMPLEMENT 자율, AC 의무 X)** | vitest 4+ passed | G-003 (IMPLEMENT 자율 추가 권장) |
| **Storybook story (C-25 / AC-009)** | `src/__stories__/useChangeTracking.stories.tsx` MODIFY — `WithMappingAndValidator` 또는 별도 stories 파일 NEW (D9 — IMPLEMENT 자율) | Storybook build 성공, mapping/validator 적용 후 getChangeSet 결과 표시 story 1+ | G-003 |
| **시각 회귀 (C-13/C-17)** | C-17 N/A 조건 ("사용처 0개 또는 변경 없는 Goal" — `affectedUsageFiles: []`) | N/A | G-003 |
| **ADR 검증 (C-14 / AC-006)** | `decisions/MOD-GRID-10-decisions.md` 가 ADR-006 추가 (대안 2개+ + trade-off + Context/Decision/Alternatives/Trade-offs/Consequences/References) | Read 검증 (Implementer/Verifier) | G-003 |
| **C-29 패턴 검증 (risk-5)** | `Grep ': undefined\|{ mapping: config\.mapping\|{ validator: config\.validator }' src/useChangeTracking.ts src/buildChangeSet.ts` (undefined literal 할당 또는 직접 forwarding) | 의도된 패턴이 union 명시 (BuildChangeSetOptions) 또는 spread skip 형태 — implement-rubric B-02 또는 별도 NO 처리 회피 | G-003 |

### 마이그레이션 자동 보완

- codemod **미작성** (사용처 0 → 작성 불필요).

---

## Section 13: 상용 제품화 영향 (F 카테고리 — Section 13 의무)

### F-01: 패키지 대상

**`packages/grid-pro-tracking`** (Pro 패키지 — G-001 cascade, canonical-modules.json L348/349). monorepo 경로 = `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/` (D1). 본 G-003 의 신규 export = `buildChangeSet` + `BuildChangeSetOptions` + `MappedRow` (Pro surface 확장).

### F-02: 라이선스 검증 호출 (Pro 패키지 의무 — C-24) — 계획(SPECIFY) vs 구현(IMPLEMENT 책임)

**SPECIFY 단계 책임 (본 G-003 spec)**: G-001 의 `src/index.ts` 의 `verifyOrWarn` 호출 1회 유지 (수정 0 — D2 명시: 본 G-003 의 Section 7 표 #6 은 index.ts MODIFY 이지만 `verifyOrWarn` 호출 L13-17 은 변경 X — `export { buildChangeSet }` 1줄 추가만). MOD-GRID-99-A/G-002 완성 시 G-005 또는 별도 wiring Goal 에서 실 호출로 교체 — G-001 ADR-003 cascade.

**IMPLEMENT 단계 책임 (본 G-003 의무 X)**: G-001 의 `verifyOrWarn` 호출 코드 그대로 유지. 변경 0. AC scope split: 본 G-003 의 AC-006 = ADR 신설 (C-14 의무 — Mapping/Validator semantics), 라이선스 검증 호출 AC 는 G-001 AC-005 (다른 Goal — cascade only).

**SPECIFY vs IMPLEMENT 책임 분리 (F-02 v1.0.3 명확화)**:
- **SPECIFY (본 spec)**: G-001 의 verifyOrWarn 호출 위치 인용 + G-003 가 index.ts MODIFY 하되 `verifyOrWarn` 호출 변경 0 결정 (D2 + Section 7 표 #6 변경 범위 명시: barrel export 1 줄만 추가).
- **IMPLEMENT**: G-003 의 Section 7 표 7 행만 변경. `src/index.ts` L13-17 (`verifyOrWarn` 정의 + 호출) 은 G-001 산출 그대로 유지 (수정 0 — IMPLEMENT verifier 가 git diff 로 확인 가능).

### F-03: 문서 작성 계획 (C-25 의무)

- **Docusaurus 페이지** (`apps/docs` MOD-GRID-99-B 범위): `apps/docs/docs/pro/tracking/build-change-set.md` (또는 동등) — `Mapping<TData>` runtime semantics + `Validator<TData>` 동작 + `buildChangeSet` API + `MappedRow` 사용 가이드. G-003 본 spec 에서는 **deferred** (MOD-GRID-99-B/Goal 에서 본격 작성).
- **Storybook story (AC-009)** — 본 G-003 의무 (D9): `src/__stories__/useChangeTracking.stories.tsx` MODIFY (`WithMappingAndValidator` CSF3 entry 추가) 또는 별도 stories 파일 NEW (IMPLEMENT 자율). mapping/validator 적용 후 getChangeSet 결과 표시.
- **README.md** — `packages/grid-pro-tracking/README.md` 가 본 G-003 범위 외 (G-005 또는 MOD-GRID-99-B 범위 — G-001/G-002 spec F-03 cascade).

### F-04: peerDependencies 정책 (C-22)

G-001/G-002 cascade — `react`, `react-dom`, `@tanstack/react-table` peer (이미 선언). G-003 신규 peer 추가 0건. `@tomis/grid-core` + `@tomis/grid-license` 추가는 G-005 범위 (G-001 D6 cascade).

---

## Section 14: H 메타 게이트 자가-검증 (specify-rubric H-01/H-02/H-03)

### H-01 referenceEvidence 경로 실재 (Read 도구로 직접 확인)

| 경로 | Read 결과 |
|------|----------|
| L0: `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | EXISTS (G-002 spec L51 + L94-104 인용 — Read 확인) |
| L1 자체 설계 — G-001/G-002 산출 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/types.ts` | EXISTS (L1-122 전체 Read 완료 — 2026-05-15) |
| L1 자체 설계 — G-002 산출 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/useChangeTracking.ts` | EXISTS (L1-220 전체 Read 완료 — 2026-05-15) |
| L1 자체 설계 — G-002 산출 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/internal/changeMap.ts` | EXISTS (L1-326 전체 Read 완료 — 2026-05-15) |
| L1 자체 설계 — G-001 산출 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` | EXISTS (L1-21 전체 Read 완료 — 2026-05-15) |
| L2: (N/A — 신규 Pro 패키지, G-001/G-002 에서 진입 완료) | N/A 명시 |
| L3: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` | EXISTS (G-001 spec L86 인용 — Read 확인) |
| R-A: (N/A — AG Grid Community 에 buildChangeSet/mapping/validator 개념 0) | N/A 명시 |
| R-W: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` | EXISTS (L17 + L193 + §5 L172-184 Read 확인 — 2026-05-15) |

### H-02 implementFiles 경로 합리성

- 7 파일 모두 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/` 하위 또는 `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/` 하위.
- monorepo 패키지 디렉토리 실재 (G-001/G-002 implement 단계에서 `dist/`, `src/`, `src/internal/`, `src/__stories__/`, `package.json`, `tsconfig.json`, `tsup.config.ts`, `EULA.md`, `CHANGELOG.md`, `node_modules/` 모두 존재 — Bash `ls` 확인 + G-002 verify feedback 인용).
- `src/internal/` 부모 디렉토리 이미 존재 (G-002 산출 `src/internal/changeMap.ts` Read 확인). 신규 `applyMapping.ts` + `runValidator.ts` 는 같은 디렉토리에 추가 — 컨벤션 일치.
- `src/buildChangeSet.ts` 는 `src/` 직접 자식 (`buildChangeSet` 은 public surface 이므로 internal 아님 — 컨벤션 일치 — G-002 `useChangeTracking.ts` 와 동일 레벨).
- D1 결정으로 `goals.json` 잘못된 prefix `TOMIS/packages/grid-pro-tracking/` → monorepo `topvel-grid-monorepo/packages/grid-pro-tracking/` 정정 (C-28 의무 충족).

### H-03 AC 출처 태그

- AC-001~AC-009 모두 `source` 태그 명시 (Section 5 표) — C-4, L1, C-16, C-14, C-12, C-25.
- 각 출처 태그가 spec 의 다른 섹션 (Section 2/3/4/7/9/13) 에서 실제 인용됨 — 날조 없음.
- **AC-004 source 태그 L1** + 본 G-003 범위 X (G-005 책임) 명시 — AC scope split 패턴 (G-001 AC-005 + G-003 spec F-02 cascade). H-03 의 출처 태그 의무 충족.

**H-01 self-check (Verifier 명확화)**: H-01 의 평가 대상은 Section 1 의 *referenceEvidence 참조 경로* (L0/L1/L2/L3/R-A/R-W) — 모두 EXISTS 또는 N/A 명시 확인. Section 7 NEW 산출물 (`src/buildChangeSet.ts`, `src/internal/applyMapping.ts`, `src/internal/runValidator.ts`, ADR-006 추가분, Storybook story) 은 IMPLEMENT 단계 deliverable 이므로 H-01 범위 외 (Section 1 disclaimer + Section 7 행 라벨 참조). H-01 = **YES**.

**F-02 self-check (Verifier 명확화)**: F-02 의 SPECIFY 단계 의무 = "라이선스 검증 호출 *위치 + 교체 계획 + AC scope split* 명시". G-001 의 `src/index.ts` 의 `verifyOrWarn` 호출은 G-003 에서 수정 0 (D2 명시 + Section 7 표 #6 변경 범위 = barrel export 1 줄 추가만). 교체 계획 = MOD-GRID-99-A/G-002 후 G-005/별도 Goal (G-001 ADR-003 cascade). AC scope split = 본 G-003 의 AC-004 (commitChanges) = G-005 책임 명시, AC-006 (Mapping/Validator ADR) = 본 G-003 책임. F-02 = **YES**.

**G-01 self-check**: 본 spec 내 TBD/TODO/미정 표현 grep — 0 hits. risk-3/risk-4/risk-5/risk-6 는 IMPLEMENT 단계 prompt 권장 사항 (decisions 가 아닌 verification 의무 — 본 spec Section 11.4 명시).

**E-01 self-check (Section 7 ↔ Section 11 일관성)**: Section 7 표 7 행 = Section 11 Step 1~7 의 1:1 매핑. Section 11 Step 1 → #4 types, Step 2 → #2 applyMapping, Step 3 → #3 runValidator, Step 4 → #1 buildChangeSet, Step 5 → #5 useChangeTracking, Step 6 → #6 index, Step 7 → #7 ADR. 모든 Step 변경 대상이 Section 7 표 행으로 존재.

**E-01 self-check (Section 2 ↔ Section 11 시그니처 cross-check — v1.0.4 강화)**: Section 2 의 함수 시그니처 (Section 2.2 `applyMapping<TData>(row, mapping?): Record<string, unknown>` 3 param 형태; Section 2.3 `runValidator<TData>(rows, validator, type)` 3 param 형태; Section 2.4 `buildChangeSet<TData>(state, options?)` 2 param 형태) 와 Section 11 Step 표의 호출 시그니처가 1:1 일치 — G-002 spec 의 applyAdd 4-vs-3-param drift 패턴 사례 재발 0. **시그니처 명시 (Section 11 step 과 1:1 일치 — E-01 의무)**:
```
applyMapping<TData>(row: TData, mapping?: Mapping<TData>): Record<string, unknown>
runValidator<TData>(rows: readonly TData[], validator: Validator<TData> | undefined, type: 'added' | 'updated'): Array<{ index: number; message: string; type: 'added' | 'updated' }>
buildChangeSet<TData>(state: ChangeMapState<TData>, options?: BuildChangeSetOptions<TData>): ChangeSet
```

**E-06 self-check (Spec Truth Table Discipline)**: 본 spec 본문에 "재결정", "변경 대상", "대체", "수정함", "~로 변경", "~ 대신" 키워드 grep — 0 hits (첫 시도 spec, 재결정 0건). D2 결정 (7 파일) = Section 7 표 7 행 = Section 11 Step 1~7 모두 일치.

**H 게이트 결론**: 모두 YES — 환각 0 가정 하 일반 채점 진행 가능.

---

## Section 15: Cascade 학습 적용 (G-001 → G-002 → G-003)

본 spec 은 G-001/G-002 SPECIFY 단계 cascade 학습의 다음 개선을 모두 반영:

1. **deliverable(NEW) vs referenceEvidence(기존 참조) 구분 disclaimer** — Section 1 첫 줄 명시 (H-01 평가 범위 명확화 cascade)
2. **F-02 SPECIFY vs IMPLEMENT 책임 분리** — Section 13 F-02 본문 + Section 14 self-check 명시 (G-001 ADR-003 stub 패턴 그대로)
3. **D# 표 ↔ 본문 cross-consistency 명시** — D2 breakdown (NEW 3 + MODIFY 4 = 7 파일) 와 Section 7 표 7 행, Section 11 Step 7 enumerate 모두 1:1 매칭. v1.0.4 breakdown 강화 룰 (파일 이름/카운트/분류 일치) 충족.
4. **E-06 Spec Truth Table Discipline** — Section 7 표 본문에 "재결정/대체/수정함/~로 변경/~ 대신" 키워드 grep 결과 0 hits (첫 시도 spec, 재결정 0건). 본 spec 의 권위적 변경 파일 = Section 7 표 7 행 + Storybook story (Section 12 검증 의무).
5. **C-28 monorepo prefix 의무** — D1 결정으로 `goals.json` 잘못된 prefix 명시적 채택 (`TOMIS/packages/...` → monorepo). C-28 cascade 차단.
6. **C-32 pure helpers + React shell 분리** — G-002 changeMap (pure 7 helpers) + useChangeTracking (React shell) 패턴 cascade. 본 G-003 = buildChangeSet/applyMapping/runValidator (pure 3 helpers, React import 0) + useChangeTracking.getChangeSet (React shell wire-up). C-32 권장 패턴 cascading 적용.
7. **Section 2 template ↔ Section 11 executable cross-check (E-01 v1.0.4)** — G-002 spec 의 applyAdd 4-vs-3-param drift 사례 cascade 학습. 본 spec Section 14 의 E-01 self-check 에 시그니처 명시 (3 함수 모두 Section 2 template = Section 11 executable 1:1 일치).
8. **AC scope split (F-02 패턴 확장)** — AC-004 (commitChanges) 가 본 G-003 범위 X (G-005 책임) 명시. G-001 AC-005 의 라이선스 검증 scope split 패턴 cascade.

---

## Section 16: 출력 형식 (Implementer 안내)

본 spec 권위는 C-1 + C-27 의무로 **single source of truth**. Implementer 는:
1. prompt 수신 직후 본 spec.md Read → cross-check
2. prompt 값과 spec 값 불일치 발견 시 → **spec 우선 적용** + `implement-score.json` `promptSpecDrift[]` 필드 기록
3. Section 7 final implementFiles 표 (authoritative — C-30) + Section 11 Step 1~7 enumerate 모두 충족
4. Section 6 엣지 케이스 6건 (특히 EC-01 mapping pass-through, EC-02 mapping function throw, EC-03 validator errors undefined, EC-04 validator throw, EC-05 removed mapping vs raw, EC-06 errors[] type 라벨) 동작 명시 의무 (buildChangeSet + applyMapping + runValidator 가 이들 케이스 모두 커버)
5. C-28 monorepo prefix 의무 — `goals.json` 잘못된 prefix 무시, 본 spec D1 + Section 7 표 권위 적용
6. C-29 `exactOptionalPropertyTypes` 패턴 — `BuildChangeSetOptions<TData>.mapping?` 정의 시 union 명시 (`mapping: Mapping<TData> | undefined`) 또는 useChangeTracking 의 useCallback 내부 spread skip 패턴 (`{ ...(config.mapping !== undefined ? { mapping: config.mapping } : {}) }`)
7. C-31 Functional Wiring Audit — `buildChangeSet.ts` 의 `applyMapping` + `runValidator` 각각 import + 호출 1+ 의무. `useChangeTracking.ts` 의 `buildChangeSet` import + getChangeSet useCallback 내부 호출 1+ 의무. `src/index.ts` barrel 의 `buildChangeSet` export 1+ 의무. dead code 0.
8. C-32 pure helpers + React shell 분리 — `buildChangeSet.ts` / `applyMapping.ts` / `runValidator.ts` 의 `react` 또는 `react-dom` import 0건 의무 (pure)
9. AC-009 Storybook story 1+ 의무 (D9) — `src/__stories__/useChangeTracking.stories.tsx` MODIFY (`WithMappingAndValidator` CSF3 entry) 또는 별도 stories 파일 NEW (Section 7 표 외 deliverable, Section 12 검증 표 명시)
10. AC-004 (commitChanges) 는 본 G-003 범위 X — `useChangeTracking.ts` 의 `commitChanges` stub L189-200 그대로 유지 (G-005 책임). AC scope split 명시.

---

(spec 끝)
