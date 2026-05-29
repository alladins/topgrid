# G-002 Specification — added/edited/deleted 배열 분리 + 원본 데이터 보존 (structuredClone snapshot)

**Module**: MOD-GRID-10 (ChangeTracking + Mapping + Validator — Wijmo CollectionView 대체)
**Goal**: G-002
**Area**: tracking
**Phase**: wijmo-class (Pro 패키지 2번째 Goal — hook 본체 채우기)
**Priority**: P0
**migrationImpact**: high
**threshold**: 95 (canonical-modules.json L346 `thresholds: { specify: 95, implement: 95, verify: 95 }`)
**spec 작성일**: 2026-05-14
**spec 버전**: v1.0 (loops 0/3, 첫 시도)
**라이선스 tier**: Pro (G-001 결정 유지)
**선행 Goal**: G-001 (타입 + hook stub 완료, score 100/100/100)

---

## ★ 사전 결정 표 (D# — 본문 cross-consistency 의무, rubric G-01)

| D# | 결정 | 본문 위치 | 출처 |
|----|------|----------|------|
| D1 | 구현 대상 monorepo는 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/` (TOMIS git 외부). `goals.json` `implementFiles` 의 `TOMIS/packages/...` prefix 는 잘못됨 → monorepo 경로 채택 (C-28 의무 — G-001 D1/D2 cascade) | Section 7 + Section 11 | MOD-GRID-00 ADR-001 + G-001 spec D1/D2 + C-28 |
| D2 | G-002 범위 = G-001 stub 의 hook 본체 채움 + 내부 changeMap 추출. NEW 파일 1 (`src/internal/changeMap.ts`), MODIFY 2 (`src/types.ts` 내부 타입 추가 + `src/useChangeTracking.ts` stub→본체). **합계 3 파일** (1 NEW + 2 MODIFY). `decisions/MOD-GRID-10-decisions.md` 는 기존 ADR 1-3 유지 + 신규 ADR-004 (rowKey collision/missing 정책) MODIFY 추가 → 합산 **4 파일** (1 NEW + 3 MODIFY) | Section 7 표 (4 행) + Section 11 Step 1~3 | G-001 산출물 Read (`src/index.ts` L1-20, `src/useChangeTracking.ts` L1-66, `src/types.ts` L1-108), decisions.md Read |
| D3 | 내부 상태 표현 = `Map<string, RowStatus>` (statusMap) + `Map<string, TData>` (originalMap — 첫 수정 시점 structuredClone) + `Map<string, TData>` (currentMap — 현재 값) + `Map<string, TData>` (snapshotMap — mount 시점 원본). React 상태로는 `useState<ChangeMapState<TData>>` 단일 객체 (구조적 공유) | Section 2.1 + Section 11.2 | 자체 설계 — TanStack 표준은 ChangeTracking 개념 없음. R-W CollectionView 개념 차용 (코드 X — C-16) |
| D4 | `addRow(seed)` 의 key 자동 생성 정책 = **rowKey 가 `keyof TData` 일 때 seed 에 해당 필드 없으면 `crypto.randomUUID()` 자동 부여** (Node 19+/모던 브라우저 표준). `rowKey` 가 함수형이면 호출하여 추출. ADR-004 신설로 결정 명문화 | Section 6 EC-06 + Section 2.3 예시 + ADR-004 (MODIFY) | 자체 설계 + 모던 브라우저 표준 (crypto.randomUUID Node 19+) |
| D5 | `rowKey` collision (동일 key 2회 mount) 정책 = **`console.warn('[grid-pro-tracking] duplicate rowKey: <key>') + Map 마지막 값 채택`** (deterministic). throw 대안 거부 (이미 마운트된 컴포넌트가 깨지면 페이지 전체 crash). ADR-004 명문화 | Section 6 EC-05 + ADR-004 | G-001 spec Section 6 EC-03 cascade — G-001 에서 spec-level 채택 ✅, G-002 에서 ADR 승격 |
| D6 | `data` prop 자체가 변경되면 = **현재 진행 중인 added/edited/deleted 모두 폐기 + snapshot 재구축 + console.warn** (G-001 spec Section 6 EC-04 cascade). useEffect deps `[data]` watch | Section 6 EC-04 + ADR-004 | G-001 EC-04 cascade |
| D7 | `useChangeTracking.ts` 의 stub `useMemo` 패턴 → `useReducer` + pure reducer (`changeMap.ts` 의 helpers 사용) 로 교체. reducer pattern 으로 race condition 방지 + 테스트 용이성. **react-hooks/exhaustive-deps 위반 0** | Section 11.2 Before/After + Section 11.3 Step 2 | 자체 설계 — useReducer 가 useState + useMemo 보다 복합 상태 변환에 적합 |
| D8 | `__original` 타입 명명 = G-001 types.ts L89 의 inline `TData & { __original: TData }` → **named export `OriginalSnapshot<TData> = TData & { __original: TData }`** 로 굳히기. `ChangeTrackingAPI.edited` 시그니처는 동일 (호환). Goal AC-002 가 명시 — types.ts MODIFY | Section 2.1 + AC-002 매핑 | Goal AC-002 본문 그대로 인용 |
| D9 | 번들 영향: 본 G-001 누적 ~431B gzipped (G-001 verify feedback L74). G-002 추가 ~2KB → 누적 ~2.4 KB / 한도 20 KB (12% 사용). C-21 충분. size-limit 한도 변경 0 | Section 8.5 | G-001 verify feedback 인용 + goals.json L143 `expected: "+2 KB"` |
| D10 | Storybook (AC-008) = G-002 단계 1 story 작성 ('add/edit/delete/reset 사이클 + 1000행 시나리오'). G-001 에서 deferred 된 AC-009 cascade 가 본 Goal 에서 본격 진입. `__stories__/` 디렉토리 이미 G-001 implement 단계에서 존재 (`Get-ChildItem` 확인 — 빈 디렉토리). 본 spec Section 12 검증 계획에 명시 | Section 5 AC-008 + Section 12 + Section 13 F-03 | goals.json L121 AC-008 본문 그대로 + Get-ChildItem 결과 |

**D# breakdown cross-check (G-01 v1.0.4 강화)**:
- D2 명시 4 파일 = NEW 1 (`src/internal/changeMap.ts`) + MODIFY 3 (`src/types.ts`, `src/useChangeTracking.ts`, `decisions/MOD-GRID-10-decisions.md`). Section 7 표 4 행 (`#1` NEW + `#2`/`#3`/`#4` MODIFY) 와 1:1 매칭. Section 11 Step 1~3 enumerate 와도 1:1 매칭.
- D8 OriginalSnapshot named export 추가는 types.ts MODIFY 의 하위 작업 — Section 7 `#2 types.ts MODIFY` 행에 흡수됨 (별도 파일 X).
- D10 Storybook 1 story = **본 spec Section 7 표에 별도 행으로 enumerate 하지 않음** (이유: Goal AC-008 `acceptanceCriteria` 출처 → 본 spec Section 5 AC 매핑으로 처리. spec 작성 시점 ad-hoc `__stories__/useChangeTracking.stories.tsx` NEW 작업은 IMPLEMENT 가 자율 추가 — Section 12 검증 계획에서 의무화). spec Section 7 의 권위 표는 **production src 파일** 만 enumerate (G-001 selectn 7 표와 동일 정책 — story 파일은 verifier 검증 항목으로 처리).

**E-06 자가-검증 (Spec Truth Table Discipline)**: 본 D# 표 + Section 7 표 + Section 11 Step 표 모두 4 파일 일치. 본문에 "재결정/변경 대상/대체/수정함/~로 변경/~ 대신" 키워드 grep 결과 0 hits (재결정 없음 — 첫 시도 spec).

---

## Section 1: 참조 추적

**(disclaimer — H-01 명확화)** 본 Section 1 표(L0/L1/L2/L3/R-A/R-W)는 **기존(pre-IMPLEMENT) referenceEvidence 참조 자료**만 enumerate. 본 G-002 가 새로 *생성*하는 산출물(NEW deliverable: `src/internal/changeMap.ts`, MODIFY: `src/useChangeTracking.ts` 본체 / `src/types.ts` named export 추가 / `decisions/MOD-GRID-10-decisions.md` ADR-004)은 Section 7 의 별도 권위 표(C-30)에서 관리됨. H-01 평가는 **본 Section 1 표의 참조 경로 실재** 만 대상.

### L0: 현 구현 (tw-framework-front)

**파일 경로 + Read 확인 (2026-05-14)**:

| 파일 | Read 라인 | 핵심 패턴 |
|------|----------|----------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | L1-130 | `useState<TrackedRow<TData>[]>` + `RowChangeStatus` ('added' \| 'edited' \| 'deleted' \| 'unchanged') + `useImperativeHandle<ChangeTrackingHandle>` |

**핵심 발췌 — 현 deleteRow 본문 (L72-92)** — add→delete net cancellation 패턴 (강화 대상):
```tsx
const deleteRow = useCallback((visibleIndex: number) => {
  setTrackedRows((prev) => {
    const next = [...prev];
    let vi = 0;
    for (let i = 0; i < next.length; i++) {
      if (next[i].status !== 'deleted') {
        if (vi === visibleIndex) {
          if (next[i].status === 'added') {
            next.splice(i, 1);  // ← net cancellation (added 즉시 제거)
          } else {
            next[i] = { ...next[i], status: 'deleted' };
          }
          return next;
        }
        vi++;
      }
    }
    return next;
  });
}, []);
```

**핵심 발췌 — 현 getChanges (L94-104)**: `trackedRows.filter` 로 분리 — G-002 의 added/edited/deleted 분리 배열 패턴 cascade.

**핵심 발췌 — 현 resetChanges (L106-108)**: `setTrackedRows(initialData.map((d) => ({ data: d, status: 'unchanged' })))` — G-002 AC-004 의 resetChanges cascade.

**부족한 점 (G-002 강화 대상)**:
1. `__original` 보존 0 — edited 후 변경 전 값 비교 불가 (G-002 AC-002 추가)
2. `updateRow` API 0 — 셀 편집 외부 처리 (G-002 AC-001/002/003 추가)
3. `rowKey` 추상 0 — visibleIndex 사용 (정렬/필터 시 위험) (G-002 D3 채택)
4. structuredClone snapshot 0 — `initialData` 참조 보존 가능 (mutation 위험) (G-002 D3/AC-001)

### L1: 자체 설계 — Map<rowKey, status> + structuredClone

**파일 + Read 확인 (2026-05-14)**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/types.ts` L1-108 (G-001 산출).

G-001 의 `ChangeTrackingConfig<TData>` (L61-74) + `ChangeTrackingAPI<TData>` (L83-108) 시그니처 그대로 유지. G-002 는 hook 본체만 채움 (시그니처 변경 0).

**자체 설계 핵심 (D3)**:
```
ChangeMapState<TData> = {
  statusMap: Map<string, RowStatus>;     // key → 'added' | 'edited' | 'deleted'
  originalMap: Map<string, TData>;       // key → 첫 수정 시점 structuredClone (edited 전용)
  currentMap: Map<string, TData>;        // key → 현재 값 (added + edited 행)
  snapshotMap: Map<string, TData>;       // key → mount 시점 원본 (resetChanges 복원용)
  insertionOrder: string[];              // added 행 순서 보존 (rows 배열 결정성)
};
```

React state 단일 객체 (`useReducer`) — D7. pure reducer 가 `changeMap.ts` 의 helpers 호출 (테스트 가능).

### L2: 신규 Pro 패키지 — 이미 G-001 에서 진입

`@tomis/grid-pro-tracking` G-001 산출 (`src/index.ts`/`types.ts`/`useChangeTracking.ts` 3 파일 + EULA.md). G-002 는 hook stub 본체 + 내부 helper 추가.

### L3: 영향 사용처 (Read 확인)

| 파일 | Read 라인 | 사용 패턴 |
|------|----------|----------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | L1-130 | 컴포넌트 본체 — G-005 에서 deprecated alias 처리 (본 G-002 미수정) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` | L1-185 (G-001 spec L86 인용) | 페이지 사용처 — G-005 마이그레이션 (본 G-002 미수정) |

**본 G-002 의 영향 사용처 수정 = 0 파일** (`affectedUsageFiles: []` — goals.json L141 명시). hook 본체 채움만으로 사용처는 자동 혜택 (G-001 시점 사용처 0 호출 — stub throw, G-002 후 사용처는 G-005 통합 시 진입).

### R-A: AG Grid 동등 기능 — N/A

`tracking-goals.json` G-002 L127 명시: "(N/A — AG Grid Community에는 changeSet 개념 없음)". `references/publish-aggrid-analysis.md` (Glob 확인) §4 Undo/Redo 만 존재 — added/edited/deleted 분리 배열 컨셉 아님.

### R-W: Wijmo CollectionView — 참조 (코드 차용 X — C-16 절대)

**파일 + Read 확인 (2026-05-14)**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` (G-001 spec L96 인용 — §2 L36-46 발췌). 본 G-002 핵심 차용 개념:
- `itemsAdded[]` / `itemsEdited[]` / `itemsRemoved[]` — added/edited/deleted 분리 배열 (G-002 AC-002)
- 원본 보존 = CollectionView 의 `itemsEdited` 도 `getItemError` 으로 변경 전 비교 (G-002 AC-002 `__original`)
- `clearChanges()` → `resetChanges()` (G-002 AC-004)

**코드 차용 X (C-16)**: `@mescius/wijmo*` import 0건 의무. Map<rowKey, status> + structuredClone 으로 자체 구현. AC-006.

---

## Section 2: API 계약 (TypeScript)

본 G-002 는 G-001 의 ChangeTrackingAPI 시그니처를 그대로 유지하면서 **본체** 만 채움. 신규 export 는 `OriginalSnapshot<TData>` named type (D8) 와 internal helpers (changeMap.ts).

### 2.1 신규 / 갱신 타입 (export 경로: `@tomis/grid-pro-tracking/src/types.ts`)

**MODIFY 1: `OriginalSnapshot<TData>` named export 추가** (D8, AC-002):
```ts
/**
 * Edited row shape — TData merged with the structuredClone snapshot captured
 * at the moment of the first `updateRow` call.
 * @see AC-002 — `tracking.edited[].__original` is the pre-edit value.
 * @template TData Row data type.
 */
export type OriginalSnapshot<TData> = TData & { __original: TData };
```

**MODIFY 2: `ChangeTrackingAPI.edited` 시그니처 — `OriginalSnapshot<TData>` 사용** (호환):
```ts
// Before (G-001 types.ts L89):
edited: ReadonlyArray<TData & { __original: TData }>;

// After (G-002):
edited: ReadonlyArray<OriginalSnapshot<TData>>;
```
인라인 union → named type 으로 alias — runtime 호환 (TypeScript structural typing).

**(internal — 외부 export X) `ChangeMapState<TData>`** (`src/internal/changeMap.ts` 내부 — 패키지 외부 미노출):
```ts
import type { RowStatus } from '../types';

/** Internal state shape held by useChangeTracking's useReducer. */
export interface ChangeMapState<TData> {
  /** key → row status. Missing keys are 'unchanged'. */
  statusMap: Map<string, RowStatus>;
  /** key → first-edit snapshot (only for 'edited' status). */
  originalMap: Map<string, TData>;
  /** key → current value (for 'added' and 'edited'). */
  currentMap: Map<string, TData>;
  /** key → mount-time snapshot (for resetChanges). */
  snapshotMap: Map<string, TData>;
  /** Insertion order for 'added' rows (preserves deterministic rows[] order). */
  insertionOrder: string[];
}
```

### 2.2 changeMap.ts 내부 helper 시그니처 (NEW — `src/internal/changeMap.ts`)

**Pure 함수 (테스트 가능, side-effect 0)**:
```ts
import type { RowStatus } from '../types';

/** Create initial state from data + rowKey extractor. */
export function createChangeMap<TData>(
  data: readonly TData[],
  extractKey: (row: TData) => string,
): ChangeMapState<TData>;

/** Add a row. Returns next state + assigned key. */
export function applyAdd<TData>(
  state: ChangeMapState<TData>,
  seed: Partial<TData>,
  extractKey: (row: TData) => string,
  generateKey: () => string,
): { next: ChangeMapState<TData>; key: string };

/** Update a row by key (patch merge). Snapshots original on first call. */
export function applyUpdate<TData>(
  state: ChangeMapState<TData>,
  key: string,
  patch: Partial<TData>,
): ChangeMapState<TData>;

/** Delete a row by key. 'added' → splice; others → mark 'deleted'. */
export function applyDelete<TData>(
  state: ChangeMapState<TData>,
  key: string,
): ChangeMapState<TData>;

/** Materialize rows + added + edited + deleted views from state. */
export function materialize<TData>(
  state: ChangeMapState<TData>,
): {
  rows: ReadonlyArray<TData & { __rowStatus?: RowStatus }>;
  added: ReadonlyArray<TData>;
  edited: ReadonlyArray<TData & { __original: TData }>;
  deleted: ReadonlyArray<TData>;
};

/** Reset to initial snapshot. */
export function resetChangeMap<TData>(
  state: ChangeMapState<TData>,
): ChangeMapState<TData>;

/** Extract key from rowKey config (string field name or function). */
export function makeKeyExtractor<TData>(
  rowKey: keyof TData | ((row: TData) => string),
): (row: TData) => string;
```

`generateKey` 인자 = `() => crypto.randomUUID()` (D4) — 호출자가 주입 (테스트 시 deterministic 가능).

### 2.3 사용 예시 (G-001 cascade — 시그니처 동일이므로 G-001 Section 2.3 호환)

**예시 1: add/delete net-zero**:
```tsx
import { useChangeTracking } from '@tomis/grid-pro-tracking';

interface Employee { empId: string; name: string; }

function PayrollPage({ data }: { data: Employee[] }) {
  const tracking = useChangeTracking<Employee>({ data, rowKey: 'empId' });

  return (
    <>
      <button onClick={() => {
        const key = tracking.addRow({ name: '신규' });   // empId 자동 생성 (D4 crypto.randomUUID)
        tracking.deleteRow(key);                          // ← added 에서 즉시 제거 (net-zero)
        console.log(tracking.added.length);               // 0
        console.log(tracking.deleted.length);             // 0
        console.log(tracking.hasChanges());               // false
      }}>net-zero test</button>
    </>
  );
}
```

**예시 2: edit-twice originalSnapshot 1회 보존**:
```tsx
function App() {
  const tracking = useChangeTracking<Employee>({
    data: [{ empId: 'e1', name: '홍길동' }],
    rowKey: 'empId',
  });

  tracking.updateRow('e1', { name: '김유신' });   // 1차 — originalMap.set('e1', {empId:'e1', name:'홍길동'})
  tracking.updateRow('e1', { name: '이순신' });   // 2차 — originalMap 유지 (snapshot overwrite 금지)

  console.log(tracking.edited[0].__original.name);   // '홍길동' (최초 값 — 1차 시점 snapshot)
  console.log(tracking.edited[0].name);              // '이순신'
}
```

### 2.4 ref API / imperative handle

`useChangeTracking` 은 hook — ref 불필요 (G-001 cascade). specify-rubric B-05 = **N/A** (hook pattern).

### 2.5 export 경로

| 경로 | export |
|------|--------|
| `@tomis/grid-pro-tracking/src/types.ts` | 기존 7 타입 + `OriginalSnapshot<TData>` 추가 (named export, D8) |
| `@tomis/grid-pro-tracking/src/useChangeTracking.ts` | `useChangeTracking` (named export — G-001 시그니처 동일) |
| `@tomis/grid-pro-tracking/src/index.ts` | barrel — **수정 0** (G-001 산출 그대로). `OriginalSnapshot` 도 `export * from './types';` 로 자동 노출. |
| `@tomis/grid-pro-tracking/src/internal/changeMap.ts` | (NEW, internal — 외부 export X) `createChangeMap`/`applyAdd`/`applyUpdate`/`applyDelete`/`materialize`/`resetChangeMap`/`makeKeyExtractor`/`ChangeMapState<TData>` — `useChangeTracking.ts` 만 import |

---

## Section 3: 기존 사용처 대응표

| 기존 | 신규 API | 마이그레이션 액션 | 적용 Goal |
|------|---------|------------------|----------|
| `ChangeTrackingGrid` 의 `ChangeTrackingHandle.addRow(row: TData)` (현 L15: 전체 row 받음) | `tracking.addRow(seed: Partial<TData>): string` (seed 부분 + key 반환) | G-005 alias 단계 (호환 wrapper) — **본 G-002 범위 X** | G-005 |
| `ChangeTrackingHandle.deleteRow(rowIndex: number)` (현 L16: visibleIndex) | `tracking.deleteRow(key: string)` (key 기반) | G-005 alias — **본 G-002 범위 X** | G-005 |
| `ChangeTrackingHandle.getChanges()` (현 L13: `() => { added, edited, deleted }`) | `tracking.added` / `tracking.edited` / `tracking.deleted` (reactive 필드) — 본 G-002 에서 첫 동작 진입 | G-005 마이그레이션 | G-005 |
| `ChangeTrackingHandle.resetChanges()` (현 L14) | `tracking.resetChanges()` — 본 G-002 에서 첫 동작 진입 | G-005 마이그레이션 | G-005 |

**G-002 범위 마이그레이션 액션**: **0건** (hook 본체 채움만 — 사용처 변경 X, `affectedUsageFiles: []`). G-005 가 점진 마이그레이션 책임.

---

## Section 4: 호환성 정책

| 항목 | 값 | 근거 |
|------|-----|------|
| **Breaking change** | `false` (goals.json G-002 L132 명시) | G-001 의 ChangeTrackingAPI 시그니처 100% 유지 — 본체만 채움 |
| **Deprecation 전략** | "신규 기능 — alias 불필요" (goals.json L133) | G-001 stub throw → G-002 실 동작 교체 — public API 시그니처 동일 |
| **Migration path** | "(N/A)" (goals.json L134) | hook signature 동일 → 사용처 자동 혜택 (G-001 시점 사용처 0 호출 - stub throw) |
| **영향 사용처** | 0 파일 (goals.json L141 `affectedUsageFiles: []`) | hook 본체 채움만 — 사용처 코드 변경 0 (G-005 책임) |
| **점진 단계** | G-002 hook 본체 → (G-003 mapping/validator) → (G-004 시각) → G-005 사용처 마이그레이션 | C-19 점진 ≤ 5 cascade — G-005 에서 2 사용처 한 번에 |
| **peerDependencies 정책 (C-22)** | G-001 그대로 (`react`, `react-dom`, `@tanstack/react-table` peer) — 신규 peer 0 | G-001 spec D6 cascade + package.json L27-31 |
| **MOD-GRID-99-A 의존성 처리** | G-001 의 `verifyOrWarn` stub no-op 유지 (`src/index.ts` 수정 X — D2 명시) → MOD-GRID-99-A/G-002 완성 시 G-005 또는 별도 wiring Goal 에서 실 호출로 교체 | G-001 ADR-003 cascade |
| **재구축 정책 (D6)** | `data` prop 변경 시 added/edited/deleted 폐기 + snapshot 재구축 + `console.warn` | G-001 spec EC-04 cascade — 본 G-002 에서 ADR-004 로 명문화 |

---

## Section 5: 인수 기준 (AC)

goals.json G-002 의 8 AC + 각 출처 태그 + Section 7 매핑.

| AC ID | criteria | source | 검증 방식 | Section 7 매칭 (binding) |
|-------|----------|--------|----------|----------------------|
| AC-001 | 내부 상태: `Map<rowKey, 'added'\|'edited'\|'deleted'>` + `originalMap: Map<rowKey, TData>` — structuredClone 으로 불변 snapshot (no any — C-4 strict) | C-4 | `useChangeTracking.ts` Grep `: any` 0 hits + `changeMap.ts` Grep `: any` 0 hits + tsc 0 error + Grep `structuredClone` 1+ hits | `src/internal/changeMap.ts` (NEW), `src/useChangeTracking.ts` (MODIFY) |
| AC-002 | `added` / `edited` / `deleted`: 각각 `TData[]` 타입 반환. `edited` 항목은 `__original: TData` 포함 (`OriginalSnapshot<TData>` 타입) | C-4 | types.ts Read — `OriginalSnapshot<TData> = TData & { __original: TData }` named export 존재 + `ChangeTrackingAPI.edited: ReadonlyArray<OriginalSnapshot<TData>>` 시그니처 일치 | `src/types.ts` (MODIFY), `src/internal/changeMap.ts` (NEW — materialize) |
| AC-003 | net 변경 없음 처리: add 후 delete 시 added 에서 제거 (no phantom rows). edit 후 edit 시 원본 snapshot 유지 (첫 수정 시 snapshot 1회만 저장) | L1 | Storybook story 또는 단위 테스트 (Section 12) — net-zero 시나리오 + edit-twice 시나리오 검증 | `src/internal/changeMap.ts` (NEW — applyAdd/applyDelete + applyUpdate) |
| AC-004 | `resetChanges()` → 초기 data prop 상태로 완전 복원 (rows, added, edited, deleted 모두 초기화) | L1 | Storybook 또는 단위 테스트 — reset 후 hasChanges() === false, rows === snapshot 동등 | `src/internal/changeMap.ts` (NEW — resetChangeMap), `src/useChangeTracking.ts` (MODIFY) |
| AC-005 | C-10/C-18: rows 배열은 TanStack getCoreRowModel data 호환 — getExpandedRowModel 과 충돌 없음 (가상화 호환) | C-18 | rows 배열이 TData & { __rowStatus? } 배열 — TanStack data 컨벤션. 1000행+ Storybook (AC-008 통합) 에서 react-virtual 통과 확인 | `src/internal/changeMap.ts` (NEW — materialize 반환 형태) |
| AC-006 | `@mescius/wijmo*` import 0 건 (C-16). CollectionView 모방 구조이나 코드 차용 X | C-16 | `Grep '@mescius/wijmo' D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/` 0 hits | 모든 변경 파일 |
| AC-007 | C-12: `tsc --noEmit` 0 error | C-12 | `pnpm --filter @tomis/grid-pro-tracking typecheck` exit 0 | 전체 src/ |
| AC-008 | C-25: Storybook story 1개 (add/edit/delete/reset 사이클 — 1000행+ 시나리오 포함 C-18) | C-25 | `src/__stories__/useChangeTracking.stories.tsx` NEW (IMPLEMENT 자율 추가 — D10 명시) — Storybook build 성공 + 1000행 데이터 시나리오 1+ | `src/__stories__/useChangeTracking.stories.tsx` (IMPLEMENT 자율 NEW — Section 7 표 외 deliverable) |

**E-01 binding cross-check (rubric v1.0.6)**:
- AC-001 ~ AC-008 모두 Section 7 표 또는 Section 12 검증 계획에 매칭됨 (AC-008 만 Section 7 표 외 — `__stories__/*.stories.tsx`, D10 명시).
- AC-007 binding 의 `pnpm typecheck` 는 IMPLEMENT 단계 자동 의무 — 별도 산출 파일 0건.

**migration-impact 표시**: AC-001 ~ AC-008 = 본 Goal 범위 100% (G-005 deferred 항목 없음 — hook 본체 단계).

---

## Section 6: 엣지 케이스 (최소 3 — 본 spec 6건)

1. **add 후 delete → added 에서 제거 (net-zero, no phantom rows)** — AC-003 직접 매핑.
   - `tracking.addRow(seed) → key` 반환 → `tracking.deleteRow(key)` 호출.
   - statusMap 에서 key 삭제 + insertionOrder 에서 splice + currentMap.delete(key).
   - `tracking.added.length === 0`, `tracking.deleted.length === 0`, `tracking.hasChanges() === false`.
   - 기존 L0 ChangeTrackingGrid.tsx L80-82 부분 구현 패턴 강화 — rowKey 기반.
2. **edit 후 edit → originalMap snapshot 1회만 저장 (overwrite 금지)** — AC-003 직접 매핑.
   - `applyUpdate` 의 첫 호출: `originalMap.set(key, structuredClone(currentMap.get(key)))`.
   - 두 번째 호출 onward: `if (originalMap.has(key)) skip snapshot`. 단, statusMap 은 이미 'edited' — 그대로 유지.
   - 결과: `tracking.edited[i].__original` = **최초 수정 직전 값** (예시 2 참조).
3. **delete 후 undoRow → deleted 마킹 해제 + rows 복귀** — AC-004 와 부분 중복 (resetChanges 는 전체 / undoRow 는 행 단위).
   - **G-002 범위 외**: `undoRow` 본체 구현은 G-004 의무 (goals.json L233 G-004 AC-003 명시). G-002 의 hook 본체에서는 `undoRow` 자리만 채움 (statusMap.delete(key) + originalMap.delete(key) + currentMap 복원 from snapshotMap). 본 spec 은 시그니처만 채움, 시각 표시는 G-004.
   - 이 EC 는 본 G-002 의 `resetChanges` 와 단일 행 변형으로 동일 코드 경로 활용.
4. **`data` prop 자체 변경 → 진행 중인 added/edited/deleted 모두 폐기 + snapshot 재구축 + console.warn** — D6 + ADR-004.
   - `useEffect(() => { dispatch({ type: 'REBUILD', data }); }, [data])`.
   - REBUILD action 내부: `console.warn('[grid-pro-tracking] data prop changed — pending changes discarded')` + createChangeMap(data, extractKey).
   - 호출자가 의도적 reset 의도일 가능성 높음 (예: 페이지 navigation 후 새 데이터). 트레이드오프 인정 (ADR-004).
5. **`rowKey` 함수형이 동일 key 반환 (collision) → console.warn + Map 마지막 값 채택** — D5 + ADR-004.
   - `createChangeMap` 또는 REBUILD 시 `data.forEach(row => { const k = extractKey(row); if (currentMap.has(k)) console.warn(...); currentMap.set(k, row); })`.
   - throw 대안 거부 (페이지 전체 crash 회피).
6. **`addRow(seed)` 의 seed 에 rowKey 필드 없음 → `crypto.randomUUID()` 자동 부여** — D4 + ADR-004.
   - `rowKey: keyof TData` 인 경우: `seed[rowKey] ?? generateKey()` 적용 후 statusMap.set('added').
   - `rowKey: (row) => string` 함수형: seed 가 키 추출 가능한 모든 필드 보유했다고 가정 → 추출 실패(undefined) 시 generateKey() fallback.
   - 반환값 = 최종 결정된 key.

---

## Section 7: 구현 대상 파일 (NEW/MODIFY) — 최종 implementFiles (authoritative)

D2 + D8 결정에 따라 본 표가 **유일한 권위적 변경 파일 정의** (C-30 의무). G-002 범위 내 모든 NEW/MODIFY 파일.

| # | 경로 | NEW/MODIFY | 변경 범위 | AC 매칭 |
|---|------|----------|---------|---------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/internal/changeMap.ts` | NEW | pure helpers: `createChangeMap`, `applyAdd`, `applyUpdate`, `applyDelete`, `materialize`, `resetChangeMap`, `makeKeyExtractor` + `ChangeMapState<TData>` internal interface. 약 200~250 LOC. structuredClone + Map 기반. **[deliverable — NEW; does NOT pre-exist; created in IMPLEMENT]** | AC-001, AC-002, AC-003, AC-004, AC-005 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/types.ts` | MODIFY | `OriginalSnapshot<TData> = TData & { __original: TData }` named export 추가 (D8) + `ChangeTrackingAPI.edited` 시그니처를 `ReadonlyArray<OriginalSnapshot<TData>>` 로 alias 적용 (호환 — TypeScript structural typing). 변경 LOC ~5-10 (export type 1 줄 + edited 시그니처 1 줄 + JSDoc 5 줄) | AC-002, AC-007 |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/useChangeTracking.ts` | MODIFY | G-001 stub `useMemo` 패턴 → `useReducer` + changeMap helpers 호출. 모든 stub `throw new Error(...)` 제거 (단, `undoRow` 는 G-004 deferred — `applyDelete` 부분 활용 + 본체 시작점만 채움 — 또는 G-002 에서 functional undoRow 본체도 G-004 cascade 준비 차원에서 채움). `commitChanges` 는 G-005 stub 유지 (`Promise.reject` 그대로). 변경 LOC ~50-100 | AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007 |
| 4 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-10-decisions.md` | MODIFY | ADR-MOD-GRID-10-004 추가 (rowKey collision policy + auto-key generation + data-prop rebuild semantics) — 기존 ADR-001~003 유지. 변경 LOC ~80 (단일 ADR 섹션 추가) | AC-007 (간접 — ADR 문서 의무) |

**ADR-MOD-GRID-10-004 신설 내용 (D4 + D5 + D6 묶음)**:
- **Decision**: `rowKey` collision 시 `console.warn + last-wins`; `addRow(seed)` 의 missing key → `crypto.randomUUID()`; `data` prop 변경 시 진행 중인 changes 폐기 + console.warn.
- **Alternatives**: (1) collision throw — 거부 (페이지 crash); (2) auto-key `Date.now()+counter` — 거부 (테스트 deterministic 손상, 모던 표준 권장 X).
- **Trade-offs**: warn 은 prod 노이즈 vs throw 의 crash. Goal scope 가 `data` 변경 의도 추정 불가 → reset 채택. crypto.randomUUID 는 Node 19+ 의무 (모던 브라우저 99%).
- **Consequences**: G-003 mapping/validator 가 collision 시 결정적 동작 보장. G-004 의 `undoRow` 는 본 ADR 의 정책에 따라 동작.

**Storybook story (AC-008 deliverable — D10)**:
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/__stories__/useChangeTracking.stories.tsx` (NEW — IMPLEMENT 자율). Section 7 표에는 포함하지 않으나 (story 파일은 verifier 검증 항목 — G-001 selectn 7 동일 정책) Section 12 검증 계획에서 의무화. `__stories__/` 디렉토리는 이미 G-001 implement 산출 (`Get-ChildItem` 빈 디렉토리 확인).

**Section 11 Step 1~3 enumerate 와의 cross-check (E-01 강화)**: 위 4 행 모두 Section 11 Step 별로 1:1 매칭 (Step 1 = #2, Step 2 = #1, Step 3 = #3, Step 4 = #4 + Storybook).

**E-06 자가-검증**: 본 섹션 본문에 "재결정", "변경 대상", "대체", "수정함", "~로 변경", "~ 대신" 키워드 grep — 0 hits (모순 없음). D2 결정 (4 파일 = NEW 1 + MODIFY 3) 과 표 4 행 일치.

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처 카운트 + 파일 목록

| # | 파일 | 사용 패턴 |
|---|------|----------|

**총 0 파일** (goals.json G-002 L141 `affectedUsageFiles: []` — hook 본체 단계, 사용처 변경 0). C-19 점진 ≤ 5 충족 (`0 ≤ 5`). G-005 가 사용처 변경 책임.

### 8.2 무파괴 검증 방법

- **타입 검증**: `pnpm --filter @tomis/grid-pro-tracking typecheck` exit 0 (C-12 / AC-007)
- **빌드 검증**: `pnpm --filter @tomis/grid-pro-tracking build` (= `tsup`) exit 0 — CJS + ESM + d.ts dual
- **시각 회귀 (C-13/C-17)**: 영향 사용처 0 → C-17 N/A 조건 충족 ("사용처 0개 또는 변경 없는 Goal"). Storybook story 1개 (AC-008) 는 본 G-002 의 단위 시각 검증 + 1000행 시나리오 — react-virtual 호환 확인 (AC-005 binding).
- **단위 테스트 (Section 12)**: 4 ~ 6개 vitest 시나리오 (net-zero, edit-twice snapshot, reset, collision warn, auto-key, data-rebuild).
- **AC-005 가상화 (C-18)**: Storybook 1000행+ 시나리오 1개 — `data: Array.from({length: 1000}, (_,i) => ({...}))` + `tracking.addRow` 호출 후 scroll → react-virtual 정상 작동 확인.

### 8.3 점진 단계

- 1단계 (본 G-002): hook 본체 + changeMap helpers + ADR-004
- 2단계 (G-003): mapping/validator → getChangeSet 진입
- 3단계 (G-004): undoRow 본체 + 시각 마커
- 4단계 (G-005): commitChanges + 사용처 alias + 페이지 마이그레이션 (2 파일, C-19 ≤ 5 충족)

### 8.4 롤백 전략

- **deliverable 단위 롤백 가능**: `src/internal/changeMap.ts` 삭제 + `src/useChangeTracking.ts` 를 G-001 stub 상태로 되돌림 + `src/types.ts` 의 `OriginalSnapshot` named export 제거 (inline `TData & { __original: TData }` 로 복귀). 사용처 0 → 안전. (참고: G-001 spec Section 8.4 cascade — G-001 도 같은 패턴으로 롤백 가능)
- **deprecated alias 1 minor 유지** (G-005 도입 후) — 본 G-002 범위 X

### 8.5 번들 영향

- **+2 KB gzipped** (goals.json L143 명시) — changeMap helpers 약 200~250 LOC, tsup tree-shake 후 gzipped 1-1.5KB 예상. + types.ts `OriginalSnapshot` named export 는 0 runtime 영향.
- **누적 ~2.4 KB / 한도 20 KB** (D9 + G-001 verify feedback 431B = 2.1% 기준). 충분히 여유 (12% 사용). G-003~G-005 합 예산 ~10 KB.
- `.size-limit.json` 수정 0 (한도 20 KB 변경 X).

---

## Section 9: 의존성

### peerDependencies (이미 `package.json` L27-31 선언됨 — G-001 cascade)

```json
{
  "@tanstack/react-table": "^8.0.0",
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

### dependencies

**0 신규** — `structuredClone` 은 globalThis 표준 (Node 17+ / 모던 브라우저 99%). `crypto.randomUUID` 는 Node 19+ / 모던 브라우저. polyfill 0 (C-21 의무 — 추가 deps 없음).

### devDependencies (monorepo root hoisted)

- `tsup` (빌드 — G-001 package.json L23 cascade)
- `typescript` (typecheck)
- `@types/react`, `@types/react-dom` (workspace shared)
- `@storybook/react-vite` (AC-008 Storybook story 작성 — monorepo root 에 이미 존재 가정. 미존재 시 IMPLEMENT 단계에서 ADR-005 신설 + 추가)
- `vitest` (Section 12 단위 테스트 — IMPLEMENT 단계 자율, AC 의무는 아님)

### MOD-GRID-99-A 의존성 처리

G-001 의 `verifyOrWarn` stub no-op 그대로 유지 (`src/index.ts` 수정 0 — D2 명시 + Section 7 표 미포함). MOD-GRID-99-A/G-002 완성 시 G-005 또는 별도 wiring Goal 에서 교체.

---

## Section 10: 사용자 여정 매핑

### 개발자 (페이지 작성자) — G-002 시점

1. `import { useChangeTracking, type OriginalSnapshot } from '@tomis/grid-pro-tracking'` (OriginalSnapshot 신규 — D8)
2. `const tracking = useChangeTracking<Employee>({ data, rowKey: 'empId' })` — G-001 시그니처 동일
3. `tracking.addRow({ name: '신규' })` 호출 → **G-001 throw → G-002 실 동작** (key 반환 + added 배열 추가)
4. `tracking.updateRow(key, { name: '변경' })` 호출 → **G-001 throw → G-002 실 동작** (originalMap snapshot + edited 배열 추가)
5. `tracking.deleteRow(key)` 호출 → **G-001 throw → G-002 실 동작** (added 면 splice, 아니면 deleted 마킹)
6. `tracking.added` / `tracking.edited[0].__original` / `tracking.deleted` 접근 → **G-001 빈 배열 → G-002 reactive 분리 배열**
7. `tracking.resetChanges()` → **G-001 no-op → G-002 snapshot 복원**
8. `tracking.hasChanges()` → **G-001 false → G-002 정확한 boolean**

### 최종 사용자 (그리드 사용자)

- G-002 단계: 사용자 변화 없음 (사용처 0 — `affectedUsageFiles: []`). G-001 시점 stub throw 가 G-002 후 실 동작으로 교체되지만, 사용처 0 호출이므로 즉시 user-facing 변화 X.
- G-004 단계: 행 추가/수정/삭제 시 색상 시각화 (배경 + 좌측 border)
- G-005 단계: 저장 버튼 → 서버 전송 + 토스트

---

## Section 11: 구현 계획

### 11.1 파일별 변경 명세

Section 7 표 4 행 + Storybook story (deliverable AC-008) 와 1:1 매칭 (E-01 cross-check 충족). 본 G-002 의 IMPLEMENT 작업 순서는 다음 11.3 참고.

### 11.2 Before/After 코드 스니펫

**Before (`src/useChangeTracking.ts` G-001 산출 L31-66)** — stub `useMemo` 패턴:
```ts
export function useChangeTracking<TData>(
  config: ChangeTrackingConfig<TData>,
): ChangeTrackingAPI<TData> {
  return useMemo<ChangeTrackingAPI<TData>>(
    () => ({
      rows: config.data as ReadonlyArray<TData & { __rowStatus?: RowStatus }>,
      added: [],
      edited: [],
      deleted: [],
      addRow: (_seed: Partial<TData>): string => {
        throw new Error('useChangeTracking.addRow: implemented in MOD-GRID-10/G-002');
      },
      // ... updateRow / deleteRow / undoRow 모두 throw
      hasChanges: (): boolean => false,
      getChangeSet: (): ChangeSet => ({ added: [], updated: [], removed: [], errors: [] }),
      resetChanges: (): void => { /* G-002 will implement */ },
      commitChanges: (_endpoint, _options) => Promise.reject(new Error(/* G-005 */)),
    }),
    [config.data],
  );
}
```

**After (G-002 본체 — `useReducer` + `changeMap.ts` helpers)**:
```ts
import { useEffect, useReducer, useRef, useCallback } from 'react';
import type {
  ChangeTrackingAPI,
  ChangeTrackingConfig,
  ChangeSet,
  CommitOptions,
  RowStatus,
} from './types';
import {
  createChangeMap,
  applyAdd,
  applyUpdate,
  applyDelete,
  materialize,
  resetChangeMap,
  makeKeyExtractor,
  type ChangeMapState,
} from './internal/changeMap';

type Action<TData> =
  | { type: 'ADD'; seed: Partial<TData>; assignedKey: string }
  | { type: 'UPDATE'; key: string; patch: Partial<TData> }
  | { type: 'DELETE'; key: string }
  | { type: 'RESET' }
  | { type: 'REBUILD'; data: readonly TData[] };

function reducer<TData>(
  state: ChangeMapState<TData>,
  action: Action<TData>,
): ChangeMapState<TData> {
  // ... switch on action.type, calling pure helpers
}

export function useChangeTracking<TData>(
  config: ChangeTrackingConfig<TData>,
): ChangeTrackingAPI<TData> {
  const extractKey = useRef(makeKeyExtractor(config.rowKey)).current;
  const generateKey = useRef(() => crypto.randomUUID()).current;

  const [state, dispatch] = useReducer(
    reducer<TData>,
    config.data,
    (data) => createChangeMap(data, extractKey),
  );

  // data prop 변경 watcher (D6 — EC-04)
  useEffect(() => {
    dispatch({ type: 'REBUILD', data: config.data });
  }, [config.data]);

  const addRow = useCallback((seed: Partial<TData>): string => {
    const assignedKey = (seed as Record<string, unknown>)[config.rowKey as string] as string
                      ?? generateKey();
    dispatch({ type: 'ADD', seed, assignedKey });
    return assignedKey;
  }, [config.rowKey]);

  const updateRow = useCallback((key: string, patch: Partial<TData>) => {
    dispatch({ type: 'UPDATE', key, patch });
  }, []);

  const deleteRow = useCallback((key: string) => {
    dispatch({ type: 'DELETE', key });
  }, []);

  const undoRow = useCallback((key: string) => {
    // G-002 minimal: deleted 면 마킹 해제, added 면 splice, edited 면 originalMap 복원
    // 시각 표시는 G-004 의무.
    throw new Error('useChangeTracking.undoRow: implemented in MOD-GRID-10/G-004');
    // 또는: dispatch({ type: 'UNDO', key }); (G-004 cascade 준비 차원 본체도 가능 —
    // 하지만 G-002 spec 범위 명시 X → G-004 의무 그대로 유지)
  }, []);

  const { rows, added, edited, deleted } = materialize(state);

  return {
    rows, added, edited, deleted,
    addRow, updateRow, deleteRow, undoRow,
    hasChanges: () => state.statusMap.size > 0,
    getChangeSet: (): ChangeSet => ({ added: [], updated: [], removed: [], errors: [] }), // G-003 본체
    resetChanges: () => dispatch({ type: 'RESET' }),
    commitChanges: (_endpoint, _options?: CommitOptions) =>
      Promise.reject(new Error('useChangeTracking.commitChanges: implemented in MOD-GRID-10/G-005')),
  };
}
```

핵심 변화: **stub `useMemo` → `useReducer` + pure helpers**. ref 0, snapshot Map<key, TData> 보존, addRow 의 key 자동 생성.

**Before (`src/types.ts` G-001 산출 L89)** — inline `__original`:
```ts
edited: ReadonlyArray<TData & { __original: TData }>;
```

**After (G-002 — D8 named export)**:
```ts
/** OriginalSnapshot: edited row merged with the structuredClone of the pre-edit value. */
export type OriginalSnapshot<TData> = TData & { __original: TData };

// ... inside ChangeTrackingAPI<TData>:
edited: ReadonlyArray<OriginalSnapshot<TData>>;
```

### 11.3 구현 순서 (3 단계)

| Step | 작업 | 산출물 | 검증 |
|------|------|--------|------|
| **Step 1** | `src/types.ts` MODIFY — `OriginalSnapshot<TData>` named export 추가 + `ChangeTrackingAPI.edited` 시그니처 alias 적용 (D8) | Section 7 #2 | tsc 0 error, types.ts Grep `OriginalSnapshot` 1+ hits |
| **Step 2** | `src/internal/changeMap.ts` NEW — 7개 pure helpers + `ChangeMapState<TData>` internal interface (D3). structuredClone + Map 기반. C-29 `exactOptionalPropertyTypes` 준수 (optional prop forwarding 패턴) | Section 7 #1 | tsc 0 error, Grep `: any` 0 hits, Grep `structuredClone` 1+ hits |
| **Step 3** | `src/useChangeTracking.ts` MODIFY — `useReducer` + changeMap import. G-001 stub `throw` 제거 (단, `undoRow` G-004 deferred, `commitChanges` G-005 deferred 그대로 유지). `useEffect` watch on `[data]` 으로 REBUILD action 발생 (D6) | Section 7 #3 | tsc 0 error, Grep `: any` 0 hits, `dispatch({ type:` 4+ hits, `useReducer` 1+ hits |
| **Step 4** | `decisions/MOD-GRID-10-decisions.md` MODIFY — ADR-MOD-GRID-10-004 추가 (rowKey collision + auto-key + data-rebuild). 기존 ADR-001~003 유지. + `src/__stories__/useChangeTracking.stories.tsx` NEW (AC-008, D10) — add/edit/delete/reset 사이클 + 1000행+ 시나리오 1개 (C-18 호환) | Section 7 #4 + Storybook | ADR-004 Read + alternatives 2+ + trade-off + Consequences, story 파일 1+ + Storybook build 성공 |

### 11.4 위험 요소 (TBD/TODO 회피 — G-01 의무)

- **risk-1 (D1 cascade)**: `goals.json` `implementFiles` 의 `TOMIS/packages/...` prefix 잔존 (goals.json L137-139 확인) → 본 spec D1 결정으로 monorepo 경로 채택 (C-28 의무 충족). Implementer 가 spec 우선 적용 (C-27).
- **risk-2 (Storybook 의존성)**: `@storybook/react-vite` monorepo root 미존재 시 IMPLEMENT 단계에서 ADR-005 신설 + 추가. 본 spec 작성 시점 확인 미수행 (Storybook config 파일 grep 권장 — IMPLEMENT prompt 에서 cross-check).
- **risk-3 (undoRow G-002 vs G-004 경계)**: D7 + Section 11.2 의 After 코드는 undoRow 를 `throw new Error('G-004')` 로 유지. 만약 G-004 본체가 changeMap.ts 의 새 helper (`applyUndo`) 가 필요하면, G-004 에서 changeMap.ts MODIFY 가 추가됨 (G-002 범위 외). 본 G-002 spec 은 undoRow 의 dispatch 자리만 G-004 cascade 준비.
- **risk-4 (`crypto.randomUUID` Node 18 미만 환경)**: Node 18 LTS 까지는 `crypto` 모듈 import 필요. Node 19+ 또는 모던 브라우저 99% 환경 가정. monorepo root `package.json` `engines` 필드 확인 (IMPLEMENT 단계 prompt 에서) — `node >= 18.17` 또는 그 이상이면 `globalThis.crypto.randomUUID()` 표준 사용 가능. 미만이면 ADR-006 추가 + `import { randomUUID } from 'node:crypto'` (단 SSR 만, CSR 은 globalThis.crypto). 본 spec 은 `crypto.randomUUID()` (globalThis) 채택 — IMPLEMENT verification 의무.
- **risk-5 (`exactOptionalPropertyTypes` C-29 패턴)**: monorepo `tsconfig.base.json` 의 `exactOptionalPropertyTypes: true` 환경 (G-001 implement 단계 확인됨). changeMap helpers + reducer 는 `Partial<TData>` 와 `seed[rowKey]` undefined 처리 시 C-29 spread pattern 또는 union 명시 의무. IMPLEMENT 단계 grep 검증.
- **추후 결정 미존재**: 본 spec 내 TBD/TODO/미정 표현 0건 — Section 7 표 권위 + ADR-004 명문화로 모든 결정 spec-time 확정.

---

## Section 12: 검증 계획

| 검증 | 방법 | 통과 기준 | Goal 범위 |
|------|------|----------|---------|
| **타입 (C-12 / AC-007)** | `pnpm --filter @tomis/grid-pro-tracking typecheck` (= `tsc --noEmit`) | exit 0, 0 errors | G-002 |
| **빌드** | `pnpm --filter @tomis/grid-pro-tracking build` (= `tsup`) | dist/ CJS + ESM + d.ts 모두 생성, 누적 ≤ 20 KB gzipped | G-002 |
| **번들 한도 (C-21)** | size-limit (monorepo `.size-limit.json` 사용 — G-001 verify 단계 통과 확인) | grid-pro-tracking ≤ 20 KB gzipped, 누적 ~2.4 KB 예상 | G-002 |
| **Wijmo import 0건 (C-16 / AC-006)** | `Grep '@mescius/wijmo' D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/` | 0 hits | G-002 |
| **`: any` 0건 (C-4 / AC-001)** | `Grep ': any\|<any>\|as any\|@ts-ignore\|@ts-nocheck' D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/` | 0 hits | G-002 |
| **structuredClone 사용 확인 (AC-001)** | `Grep 'structuredClone' D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/internal/changeMap.ts` | 1+ hits (applyUpdate + createChangeMap) | G-002 |
| **단위 테스트 (권장 — AC-003/004 binding)** | vitest 4-6 시나리오: net-zero (AC-003), edit-twice snapshot (AC-003), reset 완전 복원 (AC-004), rowKey collision warn (D5), auto-key generation (D4), data prop rebuild (D6). **단위 테스트 파일 NEW (`__tests__/changeMap.test.ts` — IMPLEMENT 자율, AC 의무 X)** | vitest 4+ passed | G-002 (IMPLEMENT 자율 추가 권장) |
| **Storybook story (C-25 / AC-008)** | `src/__stories__/useChangeTracking.stories.tsx` NEW — story 1개 (add/edit/delete/reset 사이클 + 1000행+ 시나리오) | Storybook build 성공, story 1+ | G-002 |
| **시각 회귀 (C-13/C-17)** | C-17 N/A 조건 ("사용처 0개 또는 변경 없는 Goal" — `affectedUsageFiles: []`) | N/A | G-002 |
| **ADR 검증 (C-14)** | `decisions/MOD-GRID-10-decisions.md` 가 ADR-004 추가 (대안 2개+ + trade-off + Date/Status/Goal/Context/Decision/Consequences) | Read 검증 (Implementer/Verifier) | G-002 |
| **C-29 패턴 검증** | `Grep ': undefined\|{ \w+: \w+\.\w+ }' src/internal/changeMap.ts src/useChangeTracking.ts` (undefined literal 할당 또는 직접 forwarding) | 의도된 패턴이 spread skip 또는 union 명시 형태 — implement-rubric B-02 또는 별도 NO 처리 회피 | G-002 |

### 마이그레이션 자동 보완

- codemod **미작성** (사용처 0 → 작성 불필요).

---

## Section 13: 상용 제품화 영향 (F 카테고리 — Section 13 의무)

### F-01: 패키지 대상

**`packages/grid-pro-tracking`** (Pro 패키지 — G-001 cascade, canonical-modules.json L348/349). monorepo 경로 = `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/` (D1).

### F-02: 라이선스 검증 호출 (Pro 패키지 의무 — C-24) — 계획(SPECIFY) vs 구현(IMPLEMENT 책임)

**SPECIFY 단계 책임 (본 G-002 spec)**: G-001 의 `src/index.ts` 의 `verifyOrWarn` stub 호출 1회 유지 (수정 0 — D2 명시: 본 G-002 의 Section 7 표에 index.ts 미포함). MOD-GRID-99-A/G-002 완성 시 G-005 또는 별도 wiring Goal 에서 실 호출로 교체 — G-001 ADR-003 cascade.

**IMPLEMENT 단계 책임 (본 G-002 의무 X)**: G-001 의 `verifyOrWarn` 호출 코드 그대로 유지. 변경 0.

**AC-005 매핑 (본 G-002 의 AC-005 는 C-10/C-18 가상화 — Pro 라이선스 AC 는 G-001 AC-005 였음. cascade 혼동 방지)**: 본 G-002 goals.json L118 AC-005 = "C-10/C-18 가상화 호환". 라이선스 검증 호출 AC 는 G-001 AC-005 (다른 Goal) — 본 spec F-02 는 cascade 책임만 명시.

**SPECIFY vs IMPLEMENT 책임 분리 (F-02 v1.0.3 명확화)**:
- **SPECIFY (본 spec)**: G-001 의 verifyOrWarn 호출 위치 인용 + G-002 가 수정 0 결정 (D2). 본 spec Section 7 표에 `index.ts` 미포함이 명시적 결정.
- **IMPLEMENT**: G-002 의 Section 7 표 4 행만 변경. `src/index.ts` 는 G-001 산출 그대로 유지 (수정 0 — IMPLEMENT verifier 가 git diff 로 확인 가능).

### F-03: 문서 작성 계획 (C-25 의무)

- **Docusaurus 페이지** (`apps/docs` MOD-GRID-99-B 범위): `apps/docs/docs/pro/tracking/use-change-tracking.md` (또는 동등) — `OriginalSnapshot<TData>` named export + addRow/updateRow/deleteRow/resetChanges 의 본격 동작 가이드. G-002 본 spec 에서는 **deferred** (MOD-GRID-99-B/Goal 에서 본격 작성).
- **Storybook story (AC-008)** — 본 G-002 의무 (D10): `src/__stories__/useChangeTracking.stories.tsx` NEW. story 1개 (add/edit/delete/reset 사이클 + 1000행+ 시나리오 — C-18 호환).
- **README.md** — `packages/grid-pro-tracking/README.md` 가 본 G-002 범위 외 (G-005 또는 MOD-GRID-99-B 범위 — G-001 spec F-03 cascade).

### F-04: peerDependencies 정책 (C-22)

G-001 cascade — `react`, `react-dom`, `@tanstack/react-table` peer (이미 선언). G-002 신규 peer 추가 0건. `@tomis/grid-core` + `@tomis/grid-license` 추가는 G-005 범위 (G-001 D6 cascade).

---

## Section 14: H 메타 게이트 자가-검증 (specify-rubric H-01/H-02/H-03)

### H-01 referenceEvidence 경로 실재 (Read 도구로 직접 확인)

| 경로 | Read 결과 |
|------|----------|
| L0: `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | EXISTS (L1-130 Read 완료) |
| L1 자체 설계 — G-001 산출 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/types.ts` | EXISTS (L1-108 Read 완료) |
| L2: (N/A — 신규 Pro 패키지, G-001 에서 진입 완료) | N/A 명시 |
| L3: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` | EXISTS (G-001 spec L86 인용 — Read 확인) |
| R-A: (N/A — AG Grid Community 에 changeSet 개념 0) | N/A 명시 |
| R-W: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` | EXISTS (G-001 spec L96 인용 — Read 확인) |

### H-02 implementFiles 경로 합리성

- 4 파일 모두 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/` 하위 또는 `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/` 하위.
- monorepo 패키지 디렉토리 실재 (G-001 implement 단계에서 `dist/`, `src/`, `package.json`, `tsconfig.json`, `tsup.config.ts` 모두 존재 — Bash `ls` 확인 + G-001 verify feedback 인용).
- `src/internal/` 부모 디렉토리 미존재 — IMPLEMENT 단계에서 NEW 생성 (H-02 외부 디렉토리 예외 조건 검토 X — `src/` 디렉토리는 실재, `internal/` 만 신규 자식 디렉토리. 컨벤션 `src/internal/*.ts` 는 monorepo 다른 패키지에서 사용 패턴 가능 — G-001 cascade 에서 `grid-core/src/internal/buildTableOptions.ts` 사용 사례 있음 — H-02 YES 충족).
- D1 결정으로 `goals.json` 잘못된 prefix `TOMIS/packages/grid-pro-tracking/` → monorepo `topvel-grid-monorepo/packages/grid-pro-tracking/` 정정 (C-28 의무 충족).

### H-03 AC 출처 태그

- AC-001~AC-008 모두 `source` 태그 명시 (Section 5 표) — C-4, C-18, C-16, C-12, C-25, L1.
- 각 출처 태그가 spec 의 다른 섹션 (Section 2/3/4/7/9/13) 에서 실제 인용됨 — 날조 없음.

**H-01 self-check (Verifier 명확화)**: H-01 의 평가 대상은 Section 1 의 *referenceEvidence 참조 경로* (L0/L1/L2/L3/R-A/R-W) — 모두 EXISTS 또는 N/A 명시 확인. Section 7 NEW 산출물 (`src/internal/changeMap.ts`, ADR-004 추가분, Storybook story) 은 IMPLEMENT 단계 deliverable 이므로 H-01 범위 외 (Section 1 disclaimer + Section 7 행 라벨 참조). H-01 = **YES**.

**F-02 self-check (Verifier 명확화)**: F-02 의 SPECIFY 단계 의무 = "라이선스 검증 호출 *위치 + 교체 계획 + AC scope split* 명시". G-001 의 `src/index.ts` 의 `verifyOrWarn` 호출은 G-002 에서 수정 0 (D2 명시 + Section 7 표 미포함). 교체 계획 = MOD-GRID-99-A/G-002 후 G-005/별도 Goal (G-001 ADR-003 cascade). AC scope split = 본 G-002 의 AC-005 는 C-10/C-18 가상화 (별도 AC) → 라이선스 검증 AC 는 G-001 AC-005 (cascade). F-02 = **YES**.

**G-01 self-check**: 본 spec 내 TBD/TODO/미정 표현 grep — 0 hits. risk-2/risk-3/risk-4/risk-5 는 IMPLEMENT 단계 prompt 권장 사항 (decisions 가 아닌 verification 의무 — 본 spec Section 11.4 명시).

**H 게이트 결론**: 모두 YES — 환각 0 가정 하 일반 채점 진행 가능.

---

## Section 15: Cascade 학습 적용 (G-001 → G-002)

본 spec 은 G-001 SPECIFY 단계 cascade 학습 (`MOD-GRID-10/G-001` harnessReview L84-92) 의 다음 개선을 모두 반영:

1. **deliverable(NEW) vs referenceEvidence(기존 참조) 구분 disclaimer** — Section 1 첫 줄 명시 (H-01 평가 범위 명확화 cascade)
2. **F-02 SPECIFY vs IMPLEMENT 책임 분리** — Section 13 F-02 본문 + Section 14 self-check 명시 (G-001 ADR-003 stub 패턴 그대로)
3. **D# 표 ↔ 본문 cross-consistency 명시** — D2 breakdown (NEW 1 + MODIFY 3 = 4 파일) 와 Section 7 표 4 행, Section 11 Step 4 enumerate 모두 1:1 매칭. v1.0.4 breakdown 강화 룰 (파일 이름/카운트/분류 일치) 충족.
4. **E-06 Spec Truth Table Discipline** — Section 7 표 본문에 "재결정/대체/수정함/~로 변경/~ 대신" 키워드 grep 결과 0 hits (첫 시도 spec, 재결정 0건). 본 spec 의 권위적 변경 파일 = Section 7 표 4 행 + Storybook story (Section 12 검증 의무).
5. **C-28 monorepo prefix 의무** — D1 결정으로 `goals.json` 잘못된 prefix 명시적 채택 (`TOMIS/packages/...` → monorepo). C-28 cascade 차단.

---

## Section 16: 출력 형식 (Implementer 안내)

본 spec 권위는 C-1 + C-27 의무로 **single source of truth**. Implementer 는:
1. prompt 수신 직후 본 spec.md Read → cross-check
2. prompt 값과 spec 값 불일치 발견 시 → **spec 우선 적용** + `implement-score.json` `promptSpecDrift[]` 필드 기록
3. Section 7 final implementFiles 표 (authoritative — C-30) + Section 11 Step 1~4 enumerate 모두 충족
4. Section 6 엣지 케이스 6건 (특히 EC-01 net-zero, EC-02 edit-twice snapshot, EC-04 data rebuild, EC-05 rowKey collision, EC-06 auto-key) 동작 명시 의무 (changeMap.ts 의 pure helpers 가 이들 케이스 모두 커버)
5. C-28 monorepo prefix 의무 — `goals.json` 잘못된 prefix 무시, 본 spec D1 + Section 7 표 권위 적용
6. C-29 `exactOptionalPropertyTypes` 패턴 — `Partial<TData>` + `seed[rowKey]` undefined 처리 시 spread skip 또는 union 명시 의무
7. C-31 Functional Wiring Audit — `changeMap.ts` 의 7 helpers (`createChangeMap`/`applyAdd`/`applyUpdate`/`applyDelete`/`materialize`/`resetChangeMap`/`makeKeyExtractor`) 모두 `useChangeTracking.ts` 에서 import + 호출 1+ 의무. dead code 0.
8. AC-008 Storybook story 1개 NEW 의무 (D10) — `src/__stories__/useChangeTracking.stories.tsx` (Section 7 표 외 deliverable, Section 12 검증 표 명시)

---

(spec 끝)
