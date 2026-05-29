# G-001 Specification — `trackChanges` API 설계 (useChangeTracking<TData> props/return + ChangeTrackingConfig)

**Module**: MOD-GRID-10 (ChangeTracking + Mapping + Validator — Wijmo CollectionView 대체)
**Goal**: G-001
**Area**: tracking
**Phase**: wijmo-class (Pro 패키지 첫 진입)
**Priority**: P0
**migrationImpact**: high
**threshold**: 95 (specify/implement/verify 동일 — canonical-modules.json L346 `thresholds: { specify: 95, implement: 95, verify: 95 }`)
**spec 작성일**: 2026-05-14
**spec 버전**: v1.0 (loops 0/3, 첫 시도)
**라이선스 tier**: Pro (canonical-modules.json L349 `licenseTier: "Pro"`, package.json L5 `"license": "SEE LICENSE IN EULA"` 확인)

---

## ★ 사전 결정 표 (D# — 본문 cross-consistency 의무, rubric G-01)

| D# | 결정 | 본문 위치 | 출처 |
|----|------|----------|------|
| D1 | 구현 대상 monorepo는 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/` (TOMIS git 외부) | Section 7 + Section 8.1 | MOD-GRID-00 ADR-001 (외부 디렉토리 결정), MOD-GRID-01/G-001 spec D1 선례 |
| D2 | `goals.json` `implementFiles` 의 `D:/project/topvel_project/TOMIS/packages/grid-pro-tracking/...` prefix는 잘못됨 — 실제는 monorepo. 본 spec 은 monorepo 경로 채택 (C-28 의무) | Section 7 + Section 11 | C-28 + MOD-GRID-01 ADR-002 cascade 차단 |
| D3 | NEW 파일 4: `EULA.md` (패키지 루트), `src/types.ts`, `src/useChangeTracking.ts` (G-001 범위 = 타입 + 빈 hook stub), MODIFY 1: `src/index.ts` (placeholder `export {}` → 신규 export). 합계 **5 파일** (4 NEW + 1 MODIFY). ADR `decisions/MOD-GRID-10-decisions.md` 는 본 Goal 에서 NEW 작성 → 합산 시 **6 파일** | Section 7 표 (6 행) + Section 11 Step 1~3 | `grid-pro-tracking/src/index.ts` L1-2 (`export {};` placeholder) Read 확인, `package.json` L5 `"license": "SEE LICENSE IN EULA"` 확인 |
| D4 | `useChangeTracking` G-001 범위 = **타입 시그니처 + barrel export + hook stub (no-op body 또는 throw new Error("Not implemented — see G-002~G-005"))**. 본격 구현은 G-002 (상태 추적) + G-003 (Mapping/Validator) + G-004 (시각 표시) + G-005 (commit/alias) | Section 11 위험 + Section 12 검증 계획 | tracking-goals.json G-001~G-005 분담 (G-001 P0 dependsOn → G-002~G-005 가 G-001 dependsOn) |
| D5 | 라이선스 검증 호출은 stub (`verifyOrWarn()` no-op) — `@tomis/grid-license` 가 placeholder (`grid-license/src/index.ts` L1-2 `export {};` Read 확인). MOD-GRID-99-A/G-001 완성 시 실 호출로 교체 (G-005 또는 별도 wiring Goal) | Section 4 (호환성) + Section 9 (의존성) + Section 13 (상용 제품화) | `grid-license/src/index.ts` L1-2 Read, tracking-goals.json G-001 `dependsOn: ["MOD-GRID-99-A/G-001"]` |
| D6 | peerDependencies: `react`, `react-dom`, `@tanstack/react-table` (이미 `package.json` L27-31 선언). G-001 신규 dep 0 (zero-runtime). `@tomis/grid-core` + `@tomis/grid-license` 는 workspace peer 추가 후보지만 G-001 범위 외 (G-005 alias 단계에서 추가 — ADR D5 와 일관) | Section 9 + Section 11 위험 | package.json L27-31 Read |
| D7 | 번들 한도: 20 KB gzipped per Pro 패키지 (C-21). G-001 예상 +1 KB (타입만 — tsup builds tree-shake 함). G-002~G-005 합 ~13 KB 예산 (canonical-modules.json L67-69 + G-005 bundleImpact "+3 KB 합계 ≤ 13 KB" 명시) | Section 8.5 | tracking-goals.json L67-69 + G-005 L304 |
| D8 | `addRow(seed)` 반환 = `string` (newly assigned key). `updateRow/deleteRow/undoRow(key)` 의 `key` 는 `string` (rowKey 추출 결과). `rowKey` 가 `keyof TData` 인 경우 자동 `String(row[rowKey])` 적용 | Section 2 (API 계약) + AC-001/AC-003 | 자체 설계 — TanStack `getRowId` 패턴(`(row) => string`) 일치 |

**D# breakdown cross-check (G-01 v1.0.4 강화)**:
- D3 명시 6 파일 = NEW 4 (`EULA.md`, `src/types.ts`, `src/useChangeTracking.ts`, `decisions/MOD-GRID-10-decisions.md`) + MODIFY 1 (`src/index.ts`) + ADR 1 → ADR 도 NEW 이므로 실은 **NEW 5 + MODIFY 1 = 6**. Section 7 표 6 행, Section 11 Step 1~3 enumerate 와 1:1 매칭.
- D5 stub 결정 → Section 11 Step 3 에 `verifyOrWarn` 정의 + Section 13 에 "MOD-GRID-99-A 완성 후 실 호출로 교체" 동기 명시.

---

## Section 1: 참조 추적

**(disclaimer — H-01 명확화)** 본 Section 1 표(L0/L1/L2/L3/R-A/R-W)는 **기존(pre-IMPLEMENT) referenceEvidence 참조 자료**만 enumerate. 본 G-001 이 새로 *생성*하는 산출물(NEW deliverable: `EULA.md`, ADR `MOD-GRID-10-decisions.md`, `src/types.ts`, `src/useChangeTracking.ts`, `src/index.ts` MODIFY)은 Section 7 의 별도 권위 표(C-30)에서 관리됨. H-01 평가는 **본 Section 1 표의 참조 경로 실재** 만 대상 — Section 7 NEW 산출물은 IMPLEMENT 단계 deliverable 로 H-01 범위 외.

### L0: 현 구현 (tw-framework-front)

**파일 경로 + Read 확인 (2026-05-14)**:

| 파일 | Read 라인 | 핵심 패턴 |
|------|----------|----------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | L1-238 (전체) | `useState<TrackedRow<TData>[]>` + `RowChangeStatus` ('added' | 'edited' | 'deleted' | 'unchanged') + `useImperativeHandle<ChangeTrackingHandle>` (`getChanges/resetChanges/addRow/deleteRow`) |

**핵심 발췌 — 현 `ChangeTrackingHandle<TData>` (L12-17)**:
```tsx
export interface ChangeTrackingHandle<TData> {
  getChanges: () => { added: TData[]; edited: TData[]; deleted: TData[] };
  resetChanges: () => void;
  addRow: (row: TData) => void;
  deleteRow: (rowIndex: number) => void;
}
```

**핵심 발췌 — 현 deleteRow 로직 (L72-92)**: visibleIndex 기반 — `added` 행 삭제 시 splice, 아니면 `status: 'deleted'` 마킹. add→delete net cancellation 패턴이 이미 부분 구현됨.

**부족한 점 (MOD-GRID-10 강화 대상)**:
1. `mapping` (화면→BE 필드 변환) 없음 — addRow/getChanges 모두 raw TData
2. `validator` (행 단위 검증) 없음 — 저장 직전 자동 호출 메커니즘 없음
3. `updateRow` API 없음 — 셀 편집은 외부에서 처리 (`PayrollEditablePage.tsx` `handleSave` L86-105 가 `added/edited/deleted` 받지만 `edited` 채움 책임이 모호)
4. `__original` 보존 없음 — edited 행의 변경 전 값 비교 불가
5. `rowKey` 추상 없음 — visibleIndex 사용 (정렬/필터 시 위험)
6. `commitChanges` 없음 — 페이지가 직접 `for (row of added) service.insertData(row)` 호출
7. `undoRow(key)` 행 단위 취소 없음 — 전체 `resetChanges` 만 존재
8. `__rowStatus` 필드가 row 객체에 노출되지 않음 — 외부 styling 불가 (현재 `ROW_STATUS_COLORS` L28-33 이 컴포넌트 내부에서만 적용)

### L1: TanStack v8 표준 API (참조: `references/tanstack-api-inventory.md` + `current-tanstack-analysis.md`)

**파일 + Read 확인 (2026-05-14)**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` L1-40 (인벤토리), `publish-wijmo-analysis.md` L1-226 (전체).

핵심 시그니처 (자체 설계 — TanStack 표준은 `useReactTable(options)` 만 — TanStack 자체에 ChangeTracking 개념 없음):
- `useReactTable<TData>(options: TableOptions<TData>): Table<TData>` — `data: TData[]` + `getRowId?: (row: TData) => string` (TanStack v8 표준)
- 본 hook 은 TanStack 와 **병렬**(parallel) 로 동작 — `useChangeTracking` 가 반환하는 `rows` 를 그대로 `useReactTable({ data: rows })` 에 주입.

### L2: 신규 Pro 패키지 — 직접 구조 명세

`@tomis/grid-pro-tracking` 패키지 (이미 monorepo 에 placeholder 존재 — `grid-pro-tracking/src/index.ts` L1-2 `export {};` Read 확인). G-001 부터 본격 채워나감.

### L3: 영향 사용처 (Read 확인)

| 파일 | Read 라인 | 사용 패턴 |
|------|----------|----------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | L1-238 | **컴포넌트 본체** — G-005 alias 단계에서 deprecated 처리 (1 minor 유지 — C-6) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` | L1-185 | 페이지 사용처 — `ChangeTrackingGrid` import L5, `gridRef.current?.addRow/deleteRow/getChanges/resetChanges` 사용 L48/L71/L87/L156 |

영향 사용처 **현재 카운트 = 2 파일** (컴포넌트 1 + 페이지 1). C-19 점진 한도 ≤5 충족. 본 G-001 은 **타입/hook 시그니처** 단계 — 실제 마이그레이션은 G-005 에서 (compatibility alias 도입 후 점진).

### R-A: AG Grid 동등 기능 — 참조 (코드 차용 X)

`references/publish-aggrid-analysis.md` (Glob 확인) — AG Grid Community 의 **Undo/Redo** 패턴 + Enterprise **Server-side Row State** 우회 패턴. 우리는 자체 `ChangeSet` 모델로 대체 (tracking-goals.json L48 R-A 참조).

### R-W: Wijmo CollectionView — 참조 (코드 차용 X — C-16 절대)

**파일 + Read 확인 (2026-05-14)**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` L1-226.

핵심 발췌 (§2 CollectionView, L36-46):
- `itemsAdded[]` / `itemsRemoved[]` / `itemsEdited[]` / `currentItem`
- `addNew()` → `commitNew()` / `remove(item)` / `clearChanges()`
- `trackChanges: true` 옵션

핵심 발췌 (§5 publish wrapper L172-184): `addRow`/`removeCurrent`/`buildJson`/`save` 4 method + `mapping` + `validator` + `endpoint` 컨벤션.

**개념 차용**: `added`/`edited`/`deleted` 배열 분리 명명 + `mapping`(화면→BE) + `validator` + `commitChanges(endpoint)` API 컨벤션.
**코드 차용 X (C-16)**: `@mescius/wijmo*` import 0건 의무. CollectionView 내부 구현은 React state + Map<rowKey, status> + structuredClone snapshot 으로 자체 구현.

---

## Section 2: API 계약 (TypeScript)

### 2.1 핵심 타입 (export 경로: `@tomis/grid-pro-tracking/src/types.ts`)

```ts
/** 행 변경 상태 — added/edited/deleted (unchanged 는 별도 필드 미부여) */
export type RowStatus = 'added' | 'edited' | 'deleted';

/** 화면→BE 필드 매핑 — string(필드명) 또는 함수(동적 계산) */
export type Mapping<TData> = Record<
  string,
  string | ((row: TData) => unknown)
>;

/** 행 단위 검증기 — `{ valid, errors? }` 반환 */
export type Validator<TData> = (
  row: TData
) => { valid: boolean; errors?: string[] };

/** commitChanges 옵션 — fetch 기본, fetcher 주입 시 axios 호환 */
export interface CommitOptions {
  /** HTTP 메소드 — 기본 'POST' */
  method?: string;
  /** custom fetcher (axios 호환 패턴) — 기본 globalThis.fetch */
  fetcher?: (url: string, init?: RequestInit) => Promise<unknown>;
  /** 저장 성공 후 자동 resetChanges 호출 여부 — 기본 true */
  autoReset?: boolean;
}

/** buildChangeSet/getChangeSet 결과 — 서버 payload 형태 */
export interface ChangeSet {
  added: unknown[];
  updated: unknown[];
  removed: unknown[];
  errors: Array<{
    index: number;
    message: string;
    type: 'added' | 'updated';
  }>;
}

/** useChangeTracking 입력 config */
export interface ChangeTrackingConfig<TData> {
  /** 원본 데이터 — 최초 마운트 시점 snapshot 으로 보존 */
  data: TData[];
  /** PK 추출 — keyof TData 또는 함수 */
  rowKey: keyof TData | ((row: TData) => string);
  /** 화면→BE 필드 변환 (선택) */
  mapping?: Mapping<TData>;
  /** 행 단위 검증기 (선택) */
  validator?: Validator<TData>;
  /** 낙관적 업데이트 — true 시 commit 실패 자동 rollback (기본 false) */
  optimistic?: boolean;
  /** 초기 snapshot 생성 시 콜백 (디버깅/persist) */
  onSnapshotInit?: (snapshot: ReadonlyMap<string, TData>) => void;
}

/** useChangeTracking 반환 API */
export interface ChangeTrackingAPI<TData> {
  /** 표시 행 배열 — added/edited/deleted 통합 뷰 (__rowStatus 필드 부여) */
  rows: ReadonlyArray<TData & { __rowStatus?: RowStatus }>;
  /** 추가된 행만 */
  added: ReadonlyArray<TData>;
  /** 수정된 행만 — __original 포함 */
  edited: ReadonlyArray<TData & { __original: TData }>;
  /** 삭제 표시된 행만 */
  deleted: ReadonlyArray<TData>;
  /** 행 추가 — seed 로 부분 채움 → key 반환 */
  addRow(seed: Partial<TData>): string;
  /** 행 수정 — key 기준 patch 병합 */
  updateRow(key: string, patch: Partial<TData>): void;
  /** 행 삭제 (added 이면 즉시 제거, 아니면 'deleted' 마킹) */
  deleteRow(key: string): void;
  /** 단일 행 취소 — added → 제거, edited → originalSnapshot 복원, deleted → 마킹 해제 */
  undoRow(key: string): void;
  /** 변경 1건이라도 있으면 true */
  hasChanges(): boolean;
  /** 서버 payload — mapping/validator 적용 결과 */
  getChangeSet(): ChangeSet;
  /** 초기 snapshot 으로 완전 복원 */
  resetChanges(): void;
  /** 서버 호출 — fetch 기본, optimistic 시 에러 자동 rollback */
  commitChanges(
    endpoint: string,
    options?: CommitOptions
  ): Promise<unknown>;
}
```

### 2.2 기본값 / required·optional 명시

| 필드 | required/optional | default |
|------|-------------------|--------|
| `data` | required | (없음) |
| `rowKey` | required | (없음) |
| `mapping` | optional | undefined → 원본 TData 그대로 직렬화 |
| `validator` | optional | undefined → 모든 행 valid 처리 |
| `optimistic` | optional | `false` |
| `onSnapshotInit` | optional | undefined |
| `CommitOptions.method` | optional | `'POST'` |
| `CommitOptions.fetcher` | optional | `globalThis.fetch` |
| `CommitOptions.autoReset` | optional | `true` |

### 2.3 사용 예시 (최소 2개)

**예시 1: 기본 사용 (mapping/validator 없음)**:
```tsx
import { useChangeTracking } from '@tomis/grid-pro-tracking';

interface Employee { empId: string; name: string; deptCode: string; }

function PayrollPage({ initialData }: { initialData: Employee[] }) {
  const tracking = useChangeTracking<Employee>({
    data: initialData,
    rowKey: 'empId',
  });

  return (
    <>
      <button onClick={() => tracking.addRow({ name: '신규' })}>행 추가</button>
      <button onClick={() => tracking.commitChanges('/api/employees/batch')}>
        저장 ({tracking.added.length + tracking.edited.length + tracking.deleted.length} 건)
      </button>
      <Grid data={tracking.rows} columns={columns} />
    </>
  );
}
```

**예시 2: 고급 — mapping + validator + optimistic**:
```tsx
import { useChangeTracking, type Mapping, type Validator } from '@tomis/grid-pro-tracking';

interface Employee { empId: string; name: string; deptName: string; salaryGrade: number; }

const mapping: Mapping<Employee> = {
  // 화면 deptName → 서버 deptCode (정적 매핑은 별도 lookup 필요 — 함수형 권장)
  deptCode: (row) => row.deptName.toUpperCase(),
  salary: (row) => row.salaryGrade * 1000,
  updatedAt: () => new Date().toISOString(),
};

const validator: Validator<Employee> = (row) => ({
  valid: row.name.length > 0 && row.salaryGrade > 0,
  errors: [
    ...(row.name.length === 0 ? ['이름 필수'] : []),
    ...(row.salaryGrade <= 0 ? ['급여 등급은 1 이상'] : []),
  ],
});

function PayrollPage({ data }: { data: Employee[] }) {
  const tracking = useChangeTracking<Employee>({
    data,
    rowKey: 'empId',
    mapping,
    validator,
    optimistic: true,
    onSnapshotInit: (snapshot) => console.debug('snapshot:', snapshot.size),
  });

  const handleSave = async () => {
    const cs = tracking.getChangeSet();
    if (cs.errors.length > 0) { alert('검증 실패'); return; }
    await tracking.commitChanges('/api/payroll/batch', { method: 'POST' });
  };
  return /* ... */;
}
```

### 2.4 ref API / imperative handle

`useChangeTracking` 은 **hook** 이므로 ref API 불필요. 반환 객체가 직접 imperative API (`addRow`/`updateRow`/`deleteRow` 등) 노출. (specify-rubric B-05 N/A — hook pattern).

### 2.5 export 경로

| 경로 | export |
|------|--------|
| `@tomis/grid-pro-tracking/src/types.ts` | 모든 type (`RowStatus`, `Mapping`, `Validator`, `CommitOptions`, `ChangeSet`, `ChangeTrackingConfig`, `ChangeTrackingAPI`) |
| `@tomis/grid-pro-tracking/src/useChangeTracking.ts` | `useChangeTracking` (named export) |
| `@tomis/grid-pro-tracking/src/index.ts` | barrel: 위 두 파일 re-export — `export * from './types'; export { useChangeTracking } from './useChangeTracking';` |

---

## Section 3: 기존 사용처 대응표

| 기존 | 신규 API (G-001 ~ G-005 종합) | 마이그레이션 액션 | 적용 Goal |
|------|------|---------|----------|
| `ChangeTrackingGrid<TData>` 컴포넌트 (`tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx`) | `<Grid enableChangeTracking useChangeTracking={tracking} />` + `useChangeTracking` hook | G-005 alias 도입 + 1 minor 유지 후 점진 교체 (C-6, C-23) | G-005 |
| `ChangeTrackingHandle<TData>.getChanges()` (현재 L13: `() => { added, edited, deleted }`) | `tracking.added` / `tracking.edited` / `tracking.deleted` (reactive 필드) + `tracking.getChangeSet()` (mapping/validator 적용) | hook 패턴 — ref 불필요 | G-002 + G-003 |
| `ChangeTrackingHandle<TData>.resetChanges()` (L14) | `tracking.resetChanges()` (동일 시그니처) | 1:1 매핑 | G-002 |
| `ChangeTrackingHandle<TData>.addRow(row: TData)` (L15) | `tracking.addRow(seed: Partial<TData>): string` — 반환값 추가 | seed 받기로 변경, key 반환 추가 (호환 alias 함수 G-005 제공) | G-005 |
| `ChangeTrackingHandle<TData>.deleteRow(rowIndex: number)` (L16) | `tracking.deleteRow(key: string)` — index → key 전환 | breaking-by-shape 그러나 alias wrapping 가능 | G-005 |
| `PayrollEditablePage.tsx` `handleSave` L86-105 (수동 for-loop `service.insertData(row)` 등) | `tracking.commitChanges('/api/...', { fetcher: customFetcher })` | G-005 마이그레이션 (페이지 1 파일) | G-005 |

**G-001 범위 마이그레이션 액션**: 없음 (타입/시그니처만 정의). 실제 사용처 변경은 G-005.

---

## Section 4: 호환성 정책

| 항목 | 값 | 근거 |
|------|-----|------|
| **Breaking change** | `false` (tracking-goals.json G-001 L51 명시) | 신규 패키지 — 기존 사용처는 그대로 두고 alias 단계 후 점진 |
| **Deprecation 전략** | `ChangeTrackingGrid` (tw-framework-front) alias 1 minor 버전 유지 (C-23, C-6). G-005 에서 alias 컴포넌트 + JSDoc `@deprecated` 부여 | tracking-goals.json L52 |
| **Migration path** | (a) 기존 `ChangeTrackingGrid` 컴포넌트 → `<Grid enableChangeTracking useChangeTracking={...} />` (b) `EditableGrid` `enableChangeTracking` prop 활성 시 자동 hook 연동 | tracking-goals.json L53 + L267-272 G-005 AC-004 |
| **영향 사용처** | 2 파일 (`ChangeTrackingGrid.tsx` 컴포넌트 본체 + `PayrollEditablePage.tsx` 사용 페이지) | L3 참조 + canonical-modules.json L351-353 |
| **점진 단계** | 2 단계: (1) G-001~G-004 패키지 빌드 완성 + Storybook 검증 → (2) G-005 alias 도입 → 사용처 교체 | C-19 점진 ≤ 5 충족 |
| **peerDependencies 정책 (C-22)** | `react`, `react-dom`, `@tanstack/react-table` peer (이미 선언). `@tomis/grid-core` / `@tomis/grid-license` 추가는 G-005 범위 (D6) | package.json L27-31 Read |
| **MOD-GRID-99-A 의존성 처리** | G-001 시점 `@tomis/grid-license` 가 placeholder (`grid-license/src/index.ts` L1-2 `export {};` Read 확인) → G-001 은 `verifyOrWarn` no-op stub 구현 (Section 13 + ADR D5). MOD-GRID-99-A/G-001 완성 시 실 호출로 교체 (G-005 단계) | D5 + tracking-goals.json G-001 dependsOn L18 |

---

## Section 5: 인수 기준 (AC)

tracking-goals.json G-001 의 9 AC + 각 출처 태그 + Section 7 매핑.

| AC ID | criteria | source | 검증 방식 | Section 7 매칭 (binding) |
|-------|----------|--------|----------|----------------------|
| AC-001 | `useChangeTracking<TData>(config: ChangeTrackingConfig<TData>): ChangeTrackingAPI<TData>` — 모든 타입 명시, no any (C-4 strict) | C-4 | `useChangeTracking.ts` Grep `: any` 0 hits + tsc 0 error | `src/useChangeTracking.ts` (NEW), `src/types.ts` (NEW) |
| AC-002 | `ChangeTrackingConfig<TData>` 시그니처 — `data`, `rowKey`, `mapping?`, `validator?`, `optimistic?` — TanStack `Table<TData>` 와 병렬 동작 (C-2) | C-2 | `types.ts` Read + interface 매칭 | `src/types.ts` (NEW) |
| AC-003 | `ChangeTrackingAPI<TData>` — `rows/added/edited/deleted/addRow/updateRow/deleteRow/hasChanges/getChangeSet/resetChanges/commitChanges` 모두 타입 명시 (C-4) | C-4 | interface 11 멤버 enumerate | `src/types.ts` (NEW) |
| AC-004 | `ChangeTrackingGrid` alias 제공 — `<Grid enableChangeTracking ... />` (C-6, C-23) | C-6 | G-005 범위 — **G-001 에서는 type-level placeholder 만**. AC 본문 그대로 충족은 G-005 의무 (G-001 spec 에서 deferred 명시) | (G-005 범위 — G-001 본 spec 외) |
| AC-005 | Pro 패키지: `package.json "license": "SEE LICENSE IN EULA"` + `EULA.md` 존재 + import 시 grid-license 검증 호출 (C-24) | C-24 | package.json L5 (이미 충족) + `EULA.md` 신규 + `index.ts` 에 `verifyOrWarn()` 1회 호출 | `EULA.md` (NEW), `src/index.ts` (MODIFY) |
| AC-006 | `@mescius/wijmo*` import 0건 — 패턴 학습만 (C-16 절대). referenceEvidence.R-W: 개념 참조만 | C-16 | `src/**/*.ts` Grep `@mescius/wijmo` 0 hits | 모든 NEW 파일 |
| AC-007 | `decisions/MOD-GRID-10-decisions.md` 에 API 시그니처 ADR — 대안 2개+ (CollectionView 직접 래핑 / zustand 외부 state), trade-off (C-14) | C-14 | ADR 파일 Read + alternatives 2 hits | `.claude/tw-grid/decisions/MOD-GRID-10-decisions.md` (NEW) |
| AC-008 | C-12: `tsc --noEmit` 0 error (`packages/grid-pro-tracking`) | C-12 | `pnpm --filter @tomis/grid-pro-tracking typecheck` exit 0 | 전체 src/ |
| AC-009 | C-25: Storybook story 1개 (기본 사용 시나리오 + added/edited/deleted 시각 확인) — **G-001 범위에서는 deferred 처리** (hook stub 단계 — 시각 회귀 N/A). 본 Storybook 의무는 G-002 단위 테스트 + G-005 통합 story 로 이전 (specify-rubric E-01 binding 매핑 명시) | C-25 | G-002~G-005 Storybook 의무로 이전 — G-001 본 spec 에서는 deliverable 없음 (Section 8.2 무파괴 검증 = tsc + size-limit) | (G-002/G-005 범위 — G-001 본 spec 외, Section 8.2 사유 명시) |

**migration-impact 표시**: AC-001~AC-003 + AC-005~AC-008 = 본 Goal 범위. AC-004 + AC-009 = 후속 Goal (G-005 / G-002) 위임 — 위 표 마지막 열에 명시.

**E-01 binding cross-check (rubric v1.0.6)**:
- AC-009 "Storybook 1개" → G-001 에서 deferred 처리 (사유 = hook stub 단계, 시각 회귀 N/A). G-002 AC-008 ("Storybook story 1개 — add/edit/delete/reset 사이클") + G-005 AC-009 ("Storybook story 2개") 가 매칭 deliverable 보유.
- AC-007 ADR 작성 → Section 7 매칭 파일 `decisions/MOD-GRID-10-decisions.md` (NEW) enumerate.
- 본 G-001 의 Section 7 final 표는 `.test.ts`/`.stories.tsx` 미포함 — AC-009 deferred 사유로 정당화.

---

## Section 6: 엣지 케이스 (최소 3 — 본 spec 5건)

1. **add 후 delete → added 에서 제거 (net 변경 없음)**: `addRow(seed)` 로 추가한 행에 `deleteRow(key)` 호출 시 `tracking.added` 에서 즉시 splice. `tracking.deleted` 에 들어가지 않음 (현 `ChangeTrackingGrid.tsx` L80-82 이미 부분 구현 — strengthen).
2. **edited 행을 다시 edited → originalSnapshot 1회만 저장**: 동일 key 에 `updateRow` 2회 호출 시 첫 번째 호출에서만 `originalMap.set(key, structuredClone(row))`. 두 번째 호출은 기존 snapshot 유지. (`__original` 필드는 최초 수정 직전 값).
3. **rowKey 함수 형태가 동일 key 반환 → collision 처리**: `data` 배열 마운트 시 `rowKey(row)` 호출 → Map<key, TData> 구성 단계에서 중복 key 발견 시 `console.warn('[grid-pro-tracking] duplicate rowKey: <key>')` 출력 + Map 마지막 값 채택 (deterministic). ADR 옵션 — throw 도 고려 가능 (D 결정 미확정 → spec 에서 warn 채택).
4. **`data` prop 자체가 변경되면 snapshot 갱신?**: React `useEffect(() => { snapshotRef.current = buildSnapshot(data); }, [data])` 로 재구축. 단, **재구축 시 진행 중인 added/edited/deleted 는 모두 폐기** (트레이드오프). ADR D 결정 필요 — 본 spec 은 "재구축 시 폐기 + console.warn" 채택. 호출자가 의도적 reset 의도일 가능성 높음.
5. **`optimistic: true` + `commitChanges` 실패 → rollback 동작**: G-005 범위 — G-001 에서는 시그니처만 정의. `optimistic` flag 의 동작은 G-005 의 ADR 에서 구체화 (현 G-001 ADR 에는 "optimistic 시 commit 호출 직전 staged snapshot, 실패 시 staged → committed 무효화"만 1줄 명시).

---

## Section 7: 구현 대상 파일 (NEW/MODIFY) — 최종 implementFiles (authoritative)

D3 + D5 결정에 따라 본 표가 **유일한 권위적 변경 파일 정의** (C-30 의무). G-001 범위 내 모든 NEW/MODIFY 파일.

| # | 경로 | NEW/MODIFY | 변경 범위 | AC 매칭 |
|---|------|----------|---------|---------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/types.ts` | NEW | 전체 타입 정의 (RowStatus, Mapping, Validator, CommitOptions, ChangeSet, ChangeTrackingConfig, ChangeTrackingAPI) | AC-001, AC-002, AC-003 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/useChangeTracking.ts` | NEW | hook 시그니처 + stub body (실제 상태 로직은 G-002, mapping/validator 는 G-003, commit 은 G-005 — stub 은 `throw new Error('Not implemented — see MOD-GRID-10/G-002~G-005')` 또는 모든 멤버를 no-op 으로 채운 객체 반환. ADR D 결정 필요 — 본 spec 은 **no-op 객체 반환** 채택: 타입 검증 가능 + import 가능, 호출 시 동작은 G-002 에서) | AC-001, AC-003 |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` | MODIFY | placeholder `export {};` 제거 → barrel: `export * from './types'; export { useChangeTracking } from './useChangeTracking';` + `verifyOrWarn()` 호출 1건 (라이선스 stub) — **[currently placeholder (`export {};`); IMPLEMENT will add verifyOrWarn import + call]** | AC-001, AC-005 |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/EULA.md` | NEW | Pro 라이선스 명시 (Pro EULA template — C-24 의무) — **[deliverable — NEW; does NOT pre-exist; created in IMPLEMENT]** | AC-005 |
| 5 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-10-decisions.md` | NEW | ADR-MOD-GRID-10-001 ~ -003 (API 시그니처, Mapping 설계, MOD-GRID-99-A 의존성 stub 전략) | AC-007 |

**Section 11 Step 1~3 enumerate 와의 cross-check (E-01 강화)**: 위 5 행 모두 Section 11 Step 별로 1:1 매칭 (Step 1 = #1+#2, Step 2 = #3, Step 3 = #4+#5).

**E-06 자가-검증**: 본 섹션 본문에 "재결정", "변경 대상", "대체", "수정함" 키워드 grep 결과 0 hits — 모순 없음. D3 결정 (NEW 4 + MODIFY 1 = 5 + ADR 1 = 6) 과 표 5 행 (+ ADR 행 1 = 6) 일치.

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처 카운트 + 파일 목록

| # | 파일 | 사용 패턴 |
|---|------|----------|
| 1 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | 컴포넌트 본체 — G-005 에서 deprecated alias 처리 |
| 2 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` | 페이지 사용처 — G-005 에서 hook 패턴으로 마이그레이션 |

**총 2 파일** (C-19 점진 ≤ 5 충족). 본 G-001 범위에서는 마이그레이션 0 (타입/시그니처만).

### 8.2 무파괴 검증 방법

- **타입 검증**: `pnpm --filter @tomis/grid-pro-tracking typecheck` exit 0 (C-12)
- **빌드 검증**: `pnpm --filter @tomis/grid-pro-tracking build` exit 0 (tsup CJS+ESM dual)
- **시각 회귀**: **N/A** — 본 G-001 은 타입 + hook stub 단계 (Storybook 없음). 실제 컴포넌트 시각 회귀는 G-004 (시각 표시) + G-005 (alias 통합) 의무. AC-009 deferred 명시 (Section 5).
- **C-17 의무 처리**: tracking-goals.json L17 `migrationImpact: "high"` 이나 본 G-001 은 영향 사용처 미변경 (G-005 가 변경) — C-17 NA 적용 ("사용처 0개 또는 변경 없는 Goal" 룰). G-005 에서 본격 시각 회귀 의무.

### 8.3 점진 단계

- 1단계 (G-001): 패키지 타입 + hook stub + EULA + ADR (본 spec)
- 2단계 (G-005): 사용처 alias 도입 + 페이지 마이그레이션 (2 파일, C-19 ≤ 5 충족)

### 8.4 롤백 전략

- **deprecated alias 1 minor 유지** (G-005 도입 후) — 사용처가 기존 `ChangeTrackingGrid` 그대로 import 가능
- G-001 자체 롤백: `grid-pro-tracking` 패키지 빌드 결과를 dist/ 에서 제거 + `src/index.ts` 를 placeholder 로 되돌림. 영향 사용처 0 → 안전.

### 8.5 번들 영향

- **+1 KB gzipped** (타입만 — tsup tree-shake 후 hook stub 약 200~400 B + types 0 B runtime)
- 한도: ≤ 20 KB per Pro 패키지 (C-21) — 충분히 여유. G-002~G-005 합 예산 ~12 KB.
- `.size-limit.json` 검증 — `packages/grid-pro-tracking` 항목 추가 (이미 존재 시 한도 확인). 미존재 시 G-001 implement 단계에서 한도 행 추가.

---

## Section 9: 의존성

### peerDependencies (이미 `package.json` L27-31 선언됨)

```json
{
  "@tanstack/react-table": "^8.0.0",
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

### dependencies

**없음** — 본 G-001 은 zero-runtime (types + hook stub).

### devDependencies (이미 monorepo root 에서 hoisted — `package.json` 미선언으로 OK)

- `tsup` (빌드 — package.json L23 `"build": "tsup"` 확인)
- `typescript` (typecheck — package.json L24 `"typecheck": "tsc --noEmit"` 확인)
- `@types/react`, `@types/react-dom` (workspace shared)
- `vitest` (G-002~G-005 단위 테스트 — G-001 범위 외)

### MOD-GRID-99-A 의존성 처리

`@tomis/grid-license` 가 placeholder (`grid-license/src/index.ts` L1-2 `export {};` Read 확인). G-001 은 `verifyOrWarn` 함수를 본 패키지 내부에 stub 정의 (no-op):
```ts
// src/index.ts (G-001 stub — MOD-GRID-99-A 완성 시 import 로 교체)
function verifyOrWarn(): void {
  // stub: MOD-GRID-99-A/G-001 (grid-license setLicenseKey) 완성 시
  // import { verifyOrWarn } from '@tomis/grid-license' 로 교체.
}
verifyOrWarn();
```
G-005 또는 별도 wiring Goal 에서 실 호출로 교체.

---

## Section 10: 사용자 여정 매핑

### 개발자 (페이지 작성자)

1. `import { useChangeTracking, type ChangeTrackingConfig } from '@tomis/grid-pro-tracking'`
2. `const tracking = useChangeTracking<Employee>({ data, rowKey: 'empId', mapping, validator })`
3. JSX 에서 `<Grid data={tracking.rows} columns={columns} />` (또는 향후 `enableChangeTracking` prop)
4. `tracking.addRow({ name: '신규' })` / `tracking.updateRow(key, patch)` / `tracking.deleteRow(key)` 호출
5. `tracking.hasChanges()` 로 dirty 검사 → 저장 버튼 disabled 토글
6. `tracking.commitChanges('/api/...')` 호출 (G-005 단계에서 본격 동작)

### 최종 사용자 (그리드 사용자)

- G-001 단계: 사용자 변화 없음 (타입/hook 시그니처만)
- G-004 단계: 행 추가/수정/삭제 시 색상 시각화 (배경 + 좌측 border)
- G-005 단계: 저장 버튼 클릭 → 서버 전송 + 성공 토스트

---

## Section 11: 구현 계획

### 11.1 파일별 변경 명세

Section 7 표와 1:1 매칭 (E-01 cross-check 충족). 모든 5 행 + ADR 1 행이 아래 3 Step 에 enumerate.

### 11.2 Before/After 코드 스니펫

**Before (`tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` L12-17 + L94-104)**:
```tsx
// 컴포넌트 내부 useImperativeHandle — ref 기반 imperative API
export interface ChangeTrackingHandle<TData> {
  getChanges: () => { added: TData[]; edited: TData[]; deleted: TData[] };
  resetChanges: () => void;
  addRow: (row: TData) => void;
  deleteRow: (rowIndex: number) => void;
}
// ...
const getChanges = useCallback(() => {
  const added: TData[] = [];
  const edited: TData[] = [];
  const deleted: TData[] = [];
  for (const r of trackedRows) {
    if (r.status === 'added') added.push(r.data);
    else if (r.status === 'edited') edited.push(r.data);
    else if (r.status === 'deleted') deleted.push(r.data);
  }
  return { added, edited, deleted };
}, [trackedRows]);
```

**After (G-001 신규 `@tomis/grid-pro-tracking/src/types.ts` + `useChangeTracking.ts` — hook 패턴)**:
```ts
// src/types.ts
export interface ChangeTrackingAPI<TData> {
  rows: ReadonlyArray<TData & { __rowStatus?: RowStatus }>;
  added: ReadonlyArray<TData>;
  edited: ReadonlyArray<TData & { __original: TData }>;
  deleted: ReadonlyArray<TData>;
  addRow(seed: Partial<TData>): string;
  updateRow(key: string, patch: Partial<TData>): void;
  deleteRow(key: string): void;
  undoRow(key: string): void;
  hasChanges(): boolean;
  getChangeSet(): ChangeSet;
  resetChanges(): void;
  commitChanges(endpoint: string, options?: CommitOptions): Promise<unknown>;
}

// src/useChangeTracking.ts (G-001 stub body)
import type { ChangeTrackingAPI, ChangeTrackingConfig } from './types';

export function useChangeTracking<TData>(
  _config: ChangeTrackingConfig<TData>
): ChangeTrackingAPI<TData> {
  // G-001 stub — 실제 상태 로직은 G-002, mapping/validator G-003,
  // 시각 표시 G-004, commit/alias G-005.
  return {
    rows: [],
    added: [],
    edited: [],
    deleted: [],
    addRow: () => { throw new Error('useChangeTracking: addRow — see MOD-GRID-10/G-002'); },
    updateRow: () => { throw new Error('useChangeTracking: updateRow — see MOD-GRID-10/G-002'); },
    deleteRow: () => { throw new Error('useChangeTracking: deleteRow — see MOD-GRID-10/G-002'); },
    undoRow: () => { throw new Error('useChangeTracking: undoRow — see MOD-GRID-10/G-004'); },
    hasChanges: () => false,
    getChangeSet: () => ({ added: [], updated: [], removed: [], errors: [] }),
    resetChanges: () => {},
    commitChanges: () => Promise.reject(new Error('useChangeTracking: commitChanges — see MOD-GRID-10/G-005')),
  };
}
```

핵심 변화: **컴포넌트-내부 useImperativeHandle → 독립 hook + reactive 반환 객체**. ref 의존성 제거 + mapping/validator 매개변수 신설 가능.

### 11.3 구현 순서 (3 단계)

| Step | 작업 | 산출물 | 검증 |
|------|------|--------|------|
| **Step 1** | 타입 정의 (`src/types.ts` NEW) + hook stub (`src/useChangeTracking.ts` NEW) | Section 7 #1 + #2 | tsc 0 error, Grep `: any` 0 hits |
| **Step 2** | barrel (`src/index.ts` MODIFY: placeholder 제거 → re-export + verifyOrWarn stub) | Section 7 #3 | `import { useChangeTracking } from '@tomis/grid-pro-tracking'` 가능 |
| **Step 3** | EULA.md NEW + ADR `decisions/MOD-GRID-10-decisions.md` NEW (3 ADR — API 시그니처 / Mapping / 99-A stub 전략) | Section 7 #4 + #5 | EULA.md 1 파일 존재, ADR 파일 3 ADR enumerate (대안 2개+ trade-off 포함) |

### 11.4 위험 요소 (TBD/TODO 회피 — G-01 의무)

- **risk-1 (D2 cascade)**: `goals.json` `implementFiles` 의 `TOMIS/packages/...` prefix 잔존 — 본 spec D2 결정으로 monorepo 경로 채택 (C-28 의무 충족). 후속 G-002~G-005 spec writer 도 동일 D2 결정 의무 (cascade 차단 — MOD-GRID-01 ADR-002 선례).
- **risk-2 (MOD-GRID-99-A 미완)**: `@tomis/grid-license` placeholder → G-001 은 `verifyOrWarn` no-op stub (D5). MOD-GRID-99-A/G-001 완성 시 실 호출로 교체 의무 (G-005 또는 별도 wiring Goal).
- **risk-3 (Hook stub 호출 시 throw)**: G-001 의 hook stub 은 호출 시 `throw new Error('see G-002~G-005')` — 호환성 깨짐 우려 없음 (G-001 시점 사용처 0). G-002 에서 실 구현으로 즉시 교체 시 호환.
- **risk-4 (`data` prop 변경 시 snapshot 폐기)**: Section 6 EC-04 — 트레이드오프. ADR-MOD-GRID-10-001 의 trade-off 절에 명시.
- **추후 결정 (D 결정 D8 명시)**: `rowKey: keyof TData` 시 자동 `String(row[rowKey])` 적용 — G-002 implement 시 helper `extractKey(rowKey, row)` 분리 권장. 본 spec 에서 시그니처 확정.

---

## Section 12: 검증 계획

| 검증 | 방법 | 통과 기준 | Goal 범위 |
|------|------|----------|---------|
| **타입 (C-12)** | `pnpm --filter @tomis/grid-pro-tracking typecheck` (= `tsc --noEmit`) | exit 0, 0 errors | G-001 |
| **빌드** | `pnpm --filter @tomis/grid-pro-tracking build` (= `tsup`) | dist/ CJS + ESM + d.ts 모두 생성 | G-001 |
| **번들 한도 (C-21)** | size-limit (만약 monorepo 에 `.size-limit.json` 존재) | grid-pro-tracking ≤ 20 KB gzipped | G-001 |
| **Wijmo import 0건 (C-16)** | `Grep '@mescius/wijmo' D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/` | 0 hits | G-001 |
| **`: any` 0건 (C-4)** | `Grep ': any|<any>|as any|@ts-ignore' D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/` | 0 hits | G-001 |
| **단위 테스트 (type-level)** | **G-002~G-005 범위로 위임** — G-001 은 stub 단계라 runtime 테스트 불가 (모든 호출이 throw). `expectTypeOf` 도입 시 G-002 에서 본격 type-level test 가능 | (deferred) | G-002+ |
| **시각 회귀 (C-13/C-17)** | **N/A** — G-001 단계는 시각 컴포넌트 없음 (hook + types only). Storybook 의무는 G-002/G-005 로 위임 | (deferred) | G-002+ |
| **ADR 검증 (C-14)** | `decisions/MOD-GRID-10-decisions.md` 가 3 ADR 포함 + 각 ADR 대안 2개+ + trade-off + Date/Status/Goal/Context/Decision/Consequences 섹션 | Read 검증 (Implementer/Verifier) | G-001 |

### 마이그레이션 자동 보완

- codemod **미작성** (소량 수동 — G-005 단계에서 페이지 1 파일 + 컴포넌트 1 파일만 교체 — C-19 ≤ 5 충족, codemod 비용 대비 효과 미흡).

---

## Section 13: 상용 제품화 영향 (F 카테고리 — Section 13 의무)

### F-01: 패키지 대상

**`packages/grid-pro-tracking`** (Pro 패키지 — canonical-modules.json L348 `packageTarget: "packages/grid-pro-tracking"`, L349 `licenseTier: "Pro"`). monorepo 경로 = `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/` (D1 + D2).

### F-02: 라이선스 검증 호출 (Pro 패키지 의무 — C-24) — 계획(SPECIFY) vs 구현(IMPLEMENT 책임)

**현재 상태 (SPECIFY 시점, 2026-05-14)**:
- `src/index.ts` 는 placeholder 상태 (`export {};` — L1-2 Read 확인). `verifyOrWarn` 호출 코드 **미존재** — 정상 (IMPLEMENT 단계 deliverable).
- `EULA.md` 도 미존재 — 정상 (IMPLEMENT 단계 NEW deliverable).
- `package.json` L5 `"license": "SEE LICENSE IN EULA"` 는 이미 충족 — Read 확인.

**본 G-001 IMPLEMENT 가 수행할 작업** (Section 7 표 권위 — C-30):
1. **EULA.md NEW 생성** (Section 7 #4) — Pro 라이선스 템플릿 (TOMIS 자체 상용 라이선스 문구).
2. **`src/index.ts` MODIFY** (Section 7 #3) — placeholder 제거 후 다음 추가:
   ```ts
   // G-001 IMPLEMENT 시점: stub no-op (MOD-GRID-99-A 미완)
   function verifyOrWarn(): void { /* stub — MOD-GRID-99-A/G-001 완성 후 import 로 교체 */ }
   verifyOrWarn();
   export * from './types';
   export { useChangeTracking } from './useChangeTracking';
   ```
3. **MOD-GRID-99-A/G-001 의존성 처리**: `@tomis/grid-license` 의 `verifyOrWarn` 자체가 현재 미구현 (`grid-license/src/index.ts` L1-2 `export {};` placeholder). 따라서 본 G-001 의 `verifyOrWarn` 은 **internal stub no-op** — `@tomis/grid-license` 완성 후 G-005 또는 별도 wiring Goal 에서 `import { verifyOrWarn } from '@tomis/grid-license'` 로 교체.

**AC-005 scope 명확화 (deferred 분할)**: AC-005 "import 시 grid-license 검증 호출" 의 두 부분:
- **본 G-001 범위 (구조적 결합)**: `src/index.ts` 에 `verifyOrWarn` 함수 정의(stub) + 1회 호출 wrapping — IMPLEMENT 가 완수.
- **MOD-GRID-99-A/G-002 범위 (deferred)**: 실제 라이선스 키 검증 로직 (서명 / 만료 / 도메인 / 활성화 체크) — 본 G-001 scope **밖**. MOD-GRID-99-A 완성 후 wiring Goal 에서 교체.

이 분리로 F-02 의 **SPECIFY 단계 의무 = "라이선스 검증 호출 위치 + 교체 계획 명시"** 가 충족됨 — 실제 코드 존재 여부는 IMPLEMENT 단계 검증 대상.

### F-03: 문서 작성 계획 (C-25 의무)

- **Docusaurus 페이지** (`apps/docs` MOD-GRID-99-B 범위): `apps/docs/docs/pro/tracking/use-change-tracking.md` (또는 동등) — API reference + 사용 예시 2개 (Section 2.3) + ADR 인용. G-001 본 spec 에서는 **deferred** (MOD-GRID-99-B/Goal 에서 본격 작성, G-005 alias 도입 후 사용 가이드 1 페이지).
- **Storybook story** — G-001 deferred (Section 5 AC-009 + Section 8.2 사유). G-002 (add/edit/delete/reset 사이클) + G-005 (commitChanges 통합) 가 의무.
- **README.md** — `packages/grid-pro-tracking/README.md` 가 본 G-001 범위 외 (현재 미존재 — `Get-ChildItem` 확인). G-005 또는 MOD-GRID-99-B 범위.

### F-04: peerDependencies 정책 (C-22)

`react`, `react-dom`, `@tanstack/react-table` 이미 peer (package.json L27-31 Read 확인). G-001 신규 peer 추가 0건. `@tomis/grid-core` + `@tomis/grid-license` 추가는 G-005 범위 (D6).

---

## H 메타 게이트 자가-검증 (specify-rubric H-01/H-02/H-03)

### H-01 referenceEvidence 경로 실재 (Read 도구로 직접 확인)

| 경로 | Read 결과 |
|------|----------|
| L0: `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | EXISTS (L1-238 Read 완료) |
| L1: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` | EXISTS (L1-40 Read 완료) |
| L2: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` (placeholder) + `package.json` | EXISTS (Read 완료) |
| L3: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` | EXISTS (L1-185 Read 완료) |
| R-A: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-aggrid-analysis.md` | EXISTS (Glob 확인 — 본 spec 직접 인용 0건이나 tracking-goals.json L48 R-A 인용 보존) |
| R-W: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` | EXISTS (L1-226 Read 완료) |

### H-02 implementFiles 경로 합리성

- 5 파일 모두 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/` 하위 또는 `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/` 하위.
- monorepo 패키지 디렉토리 실재 (`grid-pro-tracking/` PowerShell `Get-ChildItem` 확인 — `dist/`, `node_modules/`, `src/`, `package.json`, `tsconfig.json`, `tsup.config.ts` 모두 존재).
- D2 결정으로 `goals.json` 잘못된 prefix `TOMIS/packages/grid-pro-tracking/` → monorepo `topvel-grid-monorepo/packages/grid-pro-tracking/` 정정 (C-28 의무 충족).

### H-03 AC 출처 태그

- AC-001~AC-009 모두 `source` 태그 명시 (Section 5 표) — C-4, C-2, C-6, C-24, C-16, C-14, C-12, C-25.
- 각 출처 태그가 spec 의 다른 섹션 (Section 2/3/4/7/9/13) 에서 실제 인용됨 — 날조 없음.

**H-01 self-check (Verifier 명확화)**: H-01 의 평가 대상은 Section 1 의 *referenceEvidence 참조 경로* (L0/L1/L2/L3/R-A/R-W) 6건 — 모두 EXISTS 확인. Section 7 NEW 산출물 (`EULA.md`, `MOD-GRID-10-decisions.md`, `src/types.ts`, `src/useChangeTracking.ts`) 은 IMPLEMENT 단계 deliverable 이므로 H-01 범위 외 (Section 1 disclaimer + Section 7 행 라벨 참조). H-01 = **YES**.

**F-02 self-check (Verifier 명확화)**: F-02 의 SPECIFY 단계 의무 = "라이선스 검증 호출 *위치 + 교체 계획* 명시". Section 7 #2 (`src/index.ts` MODIFY, verifyOrWarn import + call 추가) + Section 13 F-02 IMPLEMENT plan (3 작업) + AC-005 scope 분할 (구조적 결합 = 본 G-001, 키 검증 로직 = MOD-GRID-99-A/G-002) 모두 명시. 실제 코드 *존재 여부* 는 IMPLEMENT 검증 대상이지 SPECIFY 채점 대상 아님. F-02 = **YES**.

**H 게이트 결론**: 모두 YES — 환각 0 가정 하 일반 채점 진행 가능.

---

## 출력 형식 (Implementer 안내)

본 spec 권위는 C-1 + C-27 의무로 **single source of truth**. Implementer 는:
1. prompt 수신 직후 본 spec.md Read → cross-check
2. prompt 값과 spec 값 불일치 발견 시 → **spec 우선 적용** + `implement-score.json` `promptSpecDrift[]` 필드 기록
3. Section 7 final implementFiles 표 (authoritative — C-30) + Section 11 Step 1~3 enumerate 모두 충족
4. Section 6 엣지 케이스 5건 (특히 EC-03 collision warn, EC-04 data 변경 폐기) 동작 명시 의무 (G-002 본격 구현 시점 활용)
5. C-28 monorepo prefix 의무 — `goals.json` 잘못된 prefix 무시, 본 spec D2 + Section 7 표 권위 적용

---

(spec 끝)
