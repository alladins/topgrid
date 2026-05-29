# G-002-spec.md — MOD-GRID-12/datamap
## 표시 셀 코드→레이블 변환 렌더러 + 행 단위 동적 DataMap (cell-level dataMap 함수)

**specVersion**: 1.0.0
**goalId**: G-002
**moduleId**: MOD-GRID-12
**area**: datamap
**rubricVersion**: 1.0.7
**priority**: P0
**migrationImpact**: medium
**threshold**: 90
**licenseTier**: Pro
**packageTarget**: packages/grid-pro-datamap
**createdAt**: 2026-05-15
**status**: draft
**선행 Goal**: MOD-GRID-12/G-001 (DataMap API + TomisColumnDef 정의 — specify 96.6, implement 100, verify 100)

---

## ★ Pre-decisions Table (D-1–D-6)

| # | 결정 사항 | 이유 / 근거 |
|---|-----------|-------------|
| D-1 | `implementFiles` 경로 prefix 정정: goals.json의 `D:/project/topvel_project/TOMIS/packages/...` → 실제 위치 `D:/project/topvel_project/topvel-grid-monorepo/packages/...` (C-28 + ADR-MOD-GRID-00-001). Section 7 파일 표가 권위 (C-30). | goals.json discover 단계 자동 생성 시 TOMIS prefix 오기재 (C-28 적용 범위 MOD-GRID-02~16 포함) |
| D-2 | `DataMapCell<TData>` 시그니처: `function DataMapCell<TData>(info: CellContext<TData, unknown>): JSX.Element` — TanStack `CellContext` 직접 수신. props 별도 타입 정의 불필요. createColumns.ts L128-130 패턴(`cell: (info) => renderFn(info)`)과 일치, registry 통합 데 적합. | C-2 표준 API 의무; TextCell과 달리 DataMapCell은 row.original 접근이 필요하여 CellContext 직접 수신이 유리 |
| D-3 | `type?: 'datamap'` literal 추가 불가 결정: `grid-pro-datamap/src/types.ts`의 `TomisColumnDef<TData>`는 `ColumnDef<TData, unknown>` intersection — `type` 필드를 추가하면 `grid-core`의 `TomisColumnDef.type` (renderer dispatch용 `'text'|'number'|'checkbox'|...`)과 의미 충돌 발생. G-002 범위에서 `type` 리터럴 추가 보류. | grid-core createColumns.ts L76-108의 type dispatch와 grid-pro-datamap types.ts의 TomisColumnDef는 별개 타입. 동일 필드 이름 의미 충돌 방지. |
| D-4 | MOD-GRID-04 columnFactory(`createColumns`) 통합은 G-002 범위 밖으로 defer: AC-003 "type:'datamap' → createColumns 내부 DataMapCell 자동 매핑"은 grid-core의 rendererRegistry 수정 필요(다른 패키지). G-002 implementFiles(grid-pro-datamap)에서 불가. G-002는 DataMapCell + resolveDataMap을 독립 export, 사용자가 `cell: DataMapCell` 수동 배선. MOD-GRID-04 후속 Goal에서 registry 통합. | C-8 사용처 마이그레이션 점진 의무. G-002 implementFiles=grid-pro-datamap만. registry 수정은 별도 scope. |
| D-5 | 함수형 dataMap 결과 캐싱: G-001 DataMap.ts L20-21 확인 — 내부 `new Map<unknown, string>()`으로 `getDisplay()` = O(1). 매 렌더 호출마다 DataMap.getDisplay(value) 호출해도 추가 useMemo 불필요. `resolveDataMap` 헬퍼는 함수형/정적 분기만 담당. | DataMap.ts L20-27 실측 확인. Map 내부 캐시 O(1) — useMemo 추가 시 오히려 오버헤드 |
| D-6 | 라이선스 검증 추가 호출 불필요: G-001 구현 완료로 `grid-pro-datamap/src/index.ts` L7-11에 `verifyOrWarn` inline stub 존재 (C-33 + ADR-MOD-GRID-00-012). G-002 DataMapCell은 package 진입점이 아니므로 별도 라이선스 호출 없음. G-002에서 index.ts MODIFY는 export 추가만. | C-33 Pro 패키지 inline stub 정책; MOD-GRID-99-A/G-002 출하 전 패턴. 중복 호출 금지. |

---

## Section 0 — 메타

| 항목 | 값 |
|------|-----|
| goalId | G-002 |
| title | 표시 셀 코드→레이블 변환 렌더러 + 행 단위 동적 DataMap |
| migrationImpact | medium |
| threshold | 90 |
| licenseTier | Pro |
| packageTarget | `packages/grid-pro-datamap` |
| rubricVersion | 1.0.7 |
| 선행 Goal | MOD-GRID-12/G-001 (DataMap API / TomisColumnDef — 모두 완료) |
| implementFiles | NEW 1개 + MODIFY 2개 = 3개 (Section 7 표가 권위) |
| bundleImpact | +2 KB (DataMapCell 컴포넌트 + resolveDataMap 헬퍼); 실측은 IMPLEMENT 시점 (ADR-MOD-GRID-00-010) |

---

## Section 1 — 참조 추적 (referenceEvidence)

### L0: tw-framework-front 현 구현
- goals.json G-002 `referenceEvidence.L0`: `"(N/A — 신규 기능)"`
- 코드→레이블 표시 렌더러는 tw-framework-front에 존재하지 않음. 기존 EditableGrid.tsx에 `meta.selectOptions` 기반 드롭다운은 있으나 표시 전용 렌더러 없음 (G-001-spec.md Section 2.2 확인).
- **결론**: L0 = N/A (신규 기능 — "현 구현 없음" 명시)

### L1: TanStack v8 CellContext API
- 근거: `@tanstack/react-table` CellContext 타입
- `CellContext<TData, TValue>` 시그니처:
  ```typescript
  interface CellContext<TData, TValue> {
    getValue: () => TValue;
    row: Row<TData>;          // row.original: TData
    column: Column<TData, TValue>;  // column.columnDef: ColumnDef<TData, TValue>
    renderValue: () => TValue | null;
    table: Table<TData>;
    cell: Cell<TData, TValue>;
  }
  ```
- createColumns.ts L14: `import type { ColumnDef, CellContext } from '@tanstack/react-table'` (실측 확인)
- createColumns.ts L128-130: `cell: (info: CellContext<TData, unknown>) => renderFn(info)` — CellContext를 renderer 함수에 직접 전달하는 표준 패턴 (C-2 표준 API 준수)
- G-002 DataMapCell은 동일 패턴 채택 (D-2)

### L2: G-001 DataMap interface + TomisColumnDef
- G-001-spec.md Section 3.1: `DataMap<TItem>` interface — `getDisplay(value: unknown): string | undefined`
- G-001-spec.md Section 3.3: `TomisColumnDef<TData>` = `ColumnDef<TData, unknown> & { dataMap?: DataMap<unknown> | ((row: TData) => DataMap<unknown>); selectOptions?: string[] }`
- 실제 구현 파일: `grid-pro-datamap/src/types.ts` L43-56 (Read 직접 확인)
- DataMap.ts L20-27: 내부 `Map<unknown, string>` 사용 → getDisplay() O(1) (D-5 근거)
- G-002는 이 타입들을 직접 import하여 사용

### L3: 영향 사용처
- goals.json G-002 `affectedUsageFiles: []`
- N/A — G-002는 렌더러 컴포넌트 + 헬퍼 export만. 사용처 마이그레이션은 MOD-GRID-17에서 처리.
- Section 8.1 카운트: 0개

### R-A: AG Grid cellRenderer 패턴
- publish-aggrid-analysis.md §6 L112-122 (cellEditor 패턴 확인)
- AG Grid Community: `{ field: 'status', editable: true, cellEditor: 'agTextCellEditor' }` — cellRenderer 패턴은 `components` map에 등록 후 `cellRenderer: 'MyRenderer'` 참조
- AG Grid 사용처에는 DataMap 동등 기능 없음 (publish-aggrid-analysis.md §6 L122: "DataMap 부재")
- G-002 DataMapCell은 AG Grid의 cellRenderer 개념을 TanStack CellContext 함수로 자체 구현

### R-W: Wijmo Column dataMap 바인딩
- publish-wijmo-analysis.md §4 "Data Entry & Editing" — `DataMap` (셀 단위 lookup)
- Wijmo DataMap: `DataMap.itemsSource = [{ key: '1', value: '활성' }]`, `displayMemberPath = 'value'`, `selectedValuePath = 'key'` (publish-wijmo-analysis.md §4)
- **G-002는 이 개념을 TanStack 위에 자체 구현** — `@mescius/wijmo*` import 절대 금지 (C-16)
- 학습: Wijmo는 column 수준에서 DataMap 인스턴스를 직접 바인딩 → G-001 `TomisColumnDef.dataMap` 설계의 영감 (참조만, 코드 차용 X)

---

## Section 2 — 사용자 여정 (개발자 관점)

### 2.1 User Story (goals.json G-002 그대로)
> 그리드 표시 셀에서 column.dataMap을 통해 코드 값(1)이 레이블('활성')로 자동 변환되고, 행 단위 동적 dataMap(row => getMapByDept(row.dept))을 사용하여 같은 컬럼이라도 행마다 다른 옵션셋을 표시할 수 있어야 한다.

### 2.2 User Journey Steps (goals.json 그대로)
1. DataMapCell 렌더러: `cell.getValue()` → `column.dataMap.getDisplay(value)` → 레이블 텍스트 렌더
2. 행 단위 동적 dataMap: `column.dataMap = (row: TData) => DataMap<unknown>` — flexRender 시 `row.original` 주입
3. getDisplay 결과 없음 → 원본 value 그대로 표시 (fallback)
4. `TomisColumnDef type: 'datamap'` → 자동으로 DataMapCell 렌더러 매핑 (MOD-GRID-04 columnFactory 통합 — **D-4: deferred**)
5. F-12-02 column-level display + F-12-03 cell-level dynamic dataMap 모두 처리

### 2.3 개발자 관점 시나리오 A — 정적 dataMap

```typescript
import { createDataMap, DataMapCell } from '@tomis/grid-pro-datamap';
import type { TomisColumnDef } from '@tomis/grid-pro-datamap';

const statusMap = createDataMap({
  items: [{ code: '1', label: '활성' }, { code: '2', label: '비활성' }],
  valuePath: 'code',
  displayPath: 'label',
});

const columns: TomisColumnDef<MyRow>[] = [
  {
    id: 'status',
    header: '상태',
    dataMap: statusMap,
    cell: DataMapCell,  // DataMapCell이 dataMap을 읽어 getDisplay 호출
  },
];
```

### 2.4 개발자 관점 시나리오 B — 행 단위 동적 dataMap (F-12-03)

```typescript
// 부서별로 다른 직급 목록 — 같은 컬럼, 행마다 다른 DataMap
const getMapByDept = (dept: string): DataMap<unknown> => {
  if (dept === 'dev') return devLevelMap;
  return defaultLevelMap;
};

const columns: TomisColumnDef<Employee>[] = [
  {
    id: 'level',
    header: '직급',
    dataMap: (row: Employee) => getMapByDept(row.dept),
    cell: DataMapCell,
  },
];
```

---

## Section 3 — API 계약 (TypeScript)

### 3.1 resolveDataMap 헬퍼

```typescript
// packages/grid-pro-datamap/src/DataMapCell.tsx (내부 헬퍼)
import type { DataMap, TomisColumnDef } from './types';

/**
 * TomisColumnDef.dataMap (정적 또는 함수형)을 단일 DataMap 인스턴스로 resolve.
 * G-001 DataMap 내부가 Map<unknown,string> (O(1)) → 외부 캐싱 불필요 (D-5).
 *
 * C-4: no any. C-29: exactOptionalPropertyTypes 호환.
 */
function resolveDataMap<TData>(
  dataMap: DataMap<unknown> | ((row: TData) => DataMap<unknown>) | undefined,
  rowOriginal: TData,
): DataMap<unknown> | undefined {
  if (dataMap === undefined) return undefined;
  if (typeof dataMap === 'function') {
    return dataMap(rowOriginal);
  }
  return dataMap;
}
```

### 3.2 DataMapCell 컴포넌트 시그니처

```typescript
// packages/grid-pro-datamap/src/DataMapCell.tsx
import type { CellContext } from '@tanstack/react-table';
import type { JSX } from 'react';
import type { TomisColumnDef } from './types';

/**
 * DataMapCell<TData>: TanStack CellContext 수신 → dataMap.getDisplay(value) → 레이블 렌더.
 *
 * - 정적 dataMap: column.columnDef.dataMap이 DataMap 인스턴스
 * - 함수형 dataMap: column.columnDef.dataMap(row.original) → DataMap 인스턴스
 * - getDisplay 결과 없음(undefined) → String(value) fallback (AC-001)
 * - dataMap 미설정 시 → String(value) fallback (EC-6.1)
 *
 * C-2: TanStack CellContext 표준 API 사용 (D-2)
 * C-4: no any
 * C-18: 가상화 호환 (getDisplay O(1) — useMemo 불필요, D-5)
 */
export function DataMapCell<TData>(
  info: CellContext<TData, unknown>,
): JSX.Element {
  const value = info.getValue();
  const columnDef = info.column.columnDef as TomisColumnDef<TData>;
  const resolved = resolveDataMap(columnDef.dataMap, info.row.original);
  const label = resolved?.getDisplay(value);
  const text = label !== undefined ? label : String(value ?? '');
  return <span>{text}</span>;
}
```

### 3.3 TomisColumnDef 확장 (G-001 기존 정의 인용 + G-002 확인)

G-001 구현 완료된 `types.ts` L43-56 (직접 Read 확인):
```typescript
// grid-pro-datamap/src/types.ts (G-001 기존, G-002에서 수정 없음)
export type TomisColumnDef<TData> = ColumnDef<TData, unknown> & {
  dataMap?: DataMap<unknown> | ((row: TData) => DataMap<unknown>);
  selectOptions?: string[];
};
```

G-002에서는 `TomisColumnDef`에 새 필드 추가 없음. `dataMap` 필드 이미 함수형 시그니처 포함. **types.ts MODIFY 범위**: `DataMapCellProps` 타입 alias 추가만 (선택적 — 사용자 편의 type export).

### 3.4 index.ts MODIFY 범위 (export 추가)

```typescript
// packages/grid-pro-datamap/src/index.ts — G-002 이후 추가 exports
// (기존 verifyOrWarn stub + G-001 exports 보존)
export { DataMapCell } from './DataMapCell';
// resolveDataMap은 internal 헬퍼 — DataMapCell.tsx 내 unexported 함수로 유지
```

---

## Section 4 — 호환성 정책

| 항목 | 내용 |
|------|------|
| Breaking Change | false — 신규 컴포넌트 추가 |
| deprecation alias | 불필요 — 신규 기능 |
| migration path | N/A — G-001 createDataMap 사용자가 자연 opt-in |
| peerDependencies 추가 | 없음 — react, react-dom, @tanstack/react-table 이미 peer (G-001 package.json 확인) |
| EditableGrid.tsx 수정 | G-002 범위 없음 (사용처 마이그레이션은 MOD-GRID-17) |
| 기존 G-001 exports 영향 | index.ts MODIFY는 export 추가만. 기존 exports 보존 (C-1 Read-then-Write 의무) |
| MOD-GRID-04 통합 | deferred (D-4) — G-002는 DataMapCell 독립 export. 사용자 수동 `cell: DataMapCell` 배선. |

---

## Section 5 — 인수 기준 (AC-001~007)

goals.json G-002 acceptanceCriteria L150-158 인용:

| AC | 기준 | source | 검증 방법 |
|----|------|--------|----------|
| AC-001 | DataMapCell 렌더러: `({ getValue, column, row }) → dataMap.getDisplay(getValue()) \|\| String(getValue())` — fallback 포함 (no any — C-4) | C-4 | tsc --noEmit 0 errors; Grep `: any\|as any` 0건 |
| AC-002 | `column.dataMap`이 함수 `((row: TData) => DataMap<unknown>)` 일 때 `row.original` 주입하여 행마다 다른 DataMap 사용 (F-12-03 cell-level dynamic dataMap) | L1 | tsc 타입 체크; Section 10.2 타입 스모크 테스트 |
| AC-003 | `TomisColumnDef type: 'datamap'` → MOD-GRID-04 createColumns 내부에서 DataMapCell 자동 매핑 (columnFactory 연동). dataMap prop 없으면 경고 (C-4 타입 수준 강제 가능 시) | L1 | **D-4: MOD-GRID-04 후속 Goal로 deferred**. G-002는 DataMapCell export만. |
| AC-004 | DataMapCell 가상화 호환 (C-18) — 스크롤 시 불필요한 DataMap 탐색 최소화 (useMemo 또는 Map 내부 캐시 활용) | C-18 | DataMap.ts L20-21 Map 내부 캐시 확인 (O(1)); Section 6.5 엣지케이스 |
| AC-005 | `@mescius/wijmo*` import 0건 (C-16) | C-16 | Grep `@mescius/wijmo` 0건 |
| AC-006 | C-12: tsc --noEmit 0 error | C-12 | PowerShell `npx tsc --noEmit` (packages/grid-pro-datamap) |
| AC-007 | C-25: Storybook story 1개 (정적 dataMap + 동적 행 단위 dataMap 시나리오) | C-25 | `DataMapCell.stories.tsx` 파일 존재 + 2개 시나리오 확인 |

**AC-003 deferral 상세**: goals.json AC-003은 columnFactory(grid-core 패키지) 수정 필요. G-002 implementFiles는 grid-pro-datamap 전용 (D-4). `type:'datamap'` 리터럴 추가도 D-3에 따라 보류. MOD-GRID-04 별도 Goal에서 grid-core rendererRegistry에 `'datamap': DataMapCell` 등록으로 완성. G-002 VERIFY 단계에서 AC-003을 "documented deviation (MOD-GRID-04 deferred)" 처리.

---

## Section 6 — 엣지 케이스

### EC-6.1: dataMap 미설정 컬럼에 DataMapCell 적용
- **상황**: `column.dataMap = undefined`인데 `cell: DataMapCell` 배선
- **동작**: `resolveDataMap(undefined, row)` → `undefined` 반환 → `resolved?.getDisplay(value)` = undefined → `String(value ?? '')` fallback 렌더
- **검증**: AC-001 "fallback 포함" 명시

### EC-6.2: 함수형 dataMap(row) 가 undefined 반환
- **상황**: `(row) => getMapByDept(row.dept)` 내부에서 undefined 반환 (타입 오류이나 런타임 가능)
- **동작**: `resolveDataMap` 내부에서 `dataMap(rowOriginal)` 호출 → 반환값이 runtime undefined → `resolved?.getDisplay()` = undefined → String(value) fallback
- **TypeScript 보호**: `DataMap<unknown> | ((row: TData) => DataMap<unknown>)` 타입 — 함수 반환형이 `DataMap<unknown>` (non-nullable). 런타임 undefined는 JS 차원 보호로 처리.

### EC-6.3: getDisplay 결과 null/undefined
- **상황**: DataMap에 해당 코드 없음 (예: DB에는 '3'이지만 DataMap items에 없음)
- **동작**: `DataMap.ts L29-31` `valueToDisplay.get(value)` = `undefined` → fallback `String(value ?? '')`
- **표시**: 원본 코드 값 그대로 표시 (예: '3'). 사용자에게 매핑 누락 가시화.

### EC-6.4: row.original이 undefined (서버 로딩 중)
- **상황**: TanStack placeholder 행 또는 로딩 중 row.original = undefined
- **동작**: `resolveDataMap(dataMap, undefined as TData)` → 함수형 dataMap인 경우 `dataMap(undefined)` 호출 위험
- **보호**: `info.row.original`은 TanStack 표준 `Row<TData>` API — 실제 데이터 행에서는 undefined 아님. placeholder row는 TanStack `row.getIsPlaceholder()` 기반 상위 컴포넌트에서 제어.
- **G-002 대응**: 함수형 dataMap 호출 시 row.original이 유효한 TData임을 전제. 서버 로딩 placeholder 행 → 상위 Grid에서 DataMapCell 렌더 제외 권장 (documentation).

### EC-6.5: 가상화 환경에서 빠른 스크롤 + getDisplay 호출 비용
- **상황**: `@tanstack/react-virtual` 환경 1000행+ 고속 스크롤
- **분석**: G-001 DataMap.ts L20-27 실측 — 내부 `valueToDisplay = new Map<unknown, string>()`. `getDisplay(value)` = `valueToDisplay.get(value)` = O(1) hash map lookup.
- **결론**: 매 셀 렌더마다 `getDisplay` 호출해도 성능 영향 없음. 외부 `useMemo` 불필요 (D-5).
- **resolveDataMap 비용**: 함수형 dataMap인 경우 `dataMap(row.original)` 호출 = 매 렌더마다 새 DataMap 인스턴스 생성 가능. 사용자 책임 최적화 (예: `useMemo`로 DataMap 팩토리 안정화) — JSDoc 명시.

---

## Section 7 — 구현 대상 파일

**C-28 적용**: goals.json의 `TOMIS/packages/` prefix → `topvel-grid-monorepo/packages/` 정정 (D-1)

### 최종 implementFiles 표 (권위 — C-30)

| # | 상태 | 실제 경로 | 설명 |
|---|------|-----------|------|
| 1 | **NEW** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/DataMapCell.tsx` | DataMapCell 렌더러 + resolveDataMap 헬퍼 (internal) |
| 2 | **MODIFY** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/types.ts` | (선택) DataMapCellProps 타입 alias 추가 — 기존 exports 보존 |
| 3 | **MODIFY** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/index.ts` | `export { DataMapCell } from './DataMapCell'` 추가 — 기존 verifyOrWarn stub + G-001 exports 보존 |

**계: NEW 1개, MODIFY 2개 = 3개**

**G-002 범위 외 (deferred)**:
- `grid-core/src/column/rendererRegistry.ts` — `'datamap': DataMapCell` 등록 → MOD-GRID-04 (D-4)
- `package.json` — peer 변경 없음 (G-004 위임 유지)
- Storybook `DataMapCell.stories.tsx` — IMPLEMENT 단계 작성 (AC-007 의무, 위치: `src/__stories__/DataMapCell.stories.tsx` 권장)

---

## Section 8 — 마이그레이션 영향도 Preflight

### 8.1 영향 사용처 카운트
- **0개** (goals.json `affectedUsageFiles: []`)
- G-002는 렌더러 컴포넌트 + export만. 사용처 마이그레이션은 MOD-GRID-17에서 별도 처리.

### 8.2 무파괴 검증
- `types.ts` MODIFY: 기존 `DataMap`, `TomisColumnDef`, `CreateDataMapOptions`, `PathOrAccessor` exports 보존 확인 (C-1 Read-then-Write, types.ts 직접 Read 완료 — L1-56 확인)
- `index.ts` MODIFY: 기존 G-001 exports(`createDataMap`, `DataMap`, `TomisColumnDef`, `CreateDataMapOptions`, `PathOrAccessor`) + verifyOrWarn stub 보존 확인 (index.ts L1-15 직접 Read 완료)
- tsc 영향: `DataMapCell.tsx`가 `TomisColumnDef` + `DataMap`을 `./types`에서 import — G-001 타입 그대로 사용. 기존 타입 변경 없음 → tsc 무영향.

### 8.3 점진 vs 일괄
- **점진** — DataMapCell은 신규 export. 사용자 opt-in. 기존 column 정의 변경 불필요.

### 8.4 롤백 전략
- `index.ts` export 1줄 제거로 rollback: `export { DataMapCell }` 삭제 → 패키지 API 원복
- `DataMapCell.tsx` 파일 삭제 → NEW 파일이므로 삭제 영향 없음

### 8.5 번들 영향
- 예상: +2 KB (DataMapCell 컴포넌트 + resolveDataMap 헬퍼)
- 패키지 한도: ≤ 20 KB (C-21, ADR-MOD-GRID-00-007)
- G-001 실측: ESM 995B, CJS 1023B (goals.json G-001 implement feedback 확인)
- **측정 의무**: bundle estimation NOT extrapolated from prior Goals (different size profile may apply) — measurement at IMPLEMENT time only per ADR-MOD-GRID-00-010.
- 측정 방법: `pnpm size-limit` @ packages/grid-pro-datamap (dist/ 빌드 선행)

---

## Section 9 — 의존성

### 현재 package.json peerDependencies (직접 Read 확인 — package.json L27-31)
```json
{
  "peerDependencies": {
    "@tanstack/react-table": "^8.0.0",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

### G-002 의존성 변경
- **peerDependencies 추가 없음** — react, react-dom, @tanstack/react-table으로 충분
- **dependencies 변경 없음** — DataMapCell은 grid-pro-datamap 패키지 내부 파일만 import
- **devDependencies 변경 없음** — Storybook은 이미 모노레포 루트에 설정 예정
- G-004 위임: `@tomis/grid-license` peer 추가는 G-004 범위 유지

---

## Section 10 — 코드 예시

### 10.1 정적 dataMap (column-level)

```typescript
import { createDataMap, DataMapCell } from '@tomis/grid-pro-datamap';
import type { TomisColumnDef } from '@tomis/grid-pro-datamap';

type Order = { id: number; statusCode: string };

const statusMap = createDataMap({
  items: [
    { code: 'ACTIVE', label: '활성' },
    { code: 'INACTIVE', label: '비활성' },
    { code: 'PENDING', label: '대기' },
  ],
  valuePath: 'code',
  displayPath: 'label',
});

const columns: TomisColumnDef<Order>[] = [
  { id: 'id', header: '번호', accessorKey: 'id' },
  {
    id: 'statusCode',
    header: '상태',
    accessorKey: 'statusCode',
    dataMap: statusMap,
    cell: DataMapCell,  // 'ACTIVE' → '활성' 변환
  },
];
```

### 10.2 함수형 dataMap (row-level dynamic — F-12-03)

```typescript
import { createDataMap, DataMapCell } from '@tomis/grid-pro-datamap';
import type { TomisColumnDef } from '@tomis/grid-pro-datamap';

type Employee = { id: number; dept: string; levelCode: string };

const devLevelMap = createDataMap({
  items: [{ code: 'L1', label: '주니어' }, { code: 'L2', label: '시니어' }],
  valuePath: 'code', displayPath: 'label',
});
const bizLevelMap = createDataMap({
  items: [{ code: 'M1', label: '매니저' }, { code: 'M2', label: '디렉터' }],
  valuePath: 'code', displayPath: 'label',
});

// 행마다 다른 DataMap 사용 — dept에 따라 다른 직급 목록
const columns: TomisColumnDef<Employee>[] = [
  {
    id: 'levelCode',
    header: '직급',
    accessorKey: 'levelCode',
    dataMap: (row: Employee) => row.dept === 'dev' ? devLevelMap : bizLevelMap,
    cell: DataMapCell,
  },
];
```

### 10.3 MOD-GRID-04 통합 후 사용 패턴 (deferred — 참고용)

```typescript
// MOD-GRID-04 완료 후: type: 'datamap' 자동 매핑
// (현재 D-4에 의해 G-002 범위 밖 — 아래는 미래 패턴 참고용)
// const columns = createColumns<Order>([
//   { id: 'statusCode', name: '상태', type: 'datamap', dataMap: statusMap }
// ]);
// → createColumns 내부에서 DataMapCell 자동 배선 (MOD-GRID-04 rendererRegistry 수정 후)
```

---

## Section 11 — 구현 계획

### Before / After 코드

**Before (DataMapCell 미적용):**
```typescript
// 수동 레이블 변환 — 사용자가 직접 map lookup 코드 작성
const statusLabel: Record<string, string> = { ACTIVE: '활성', INACTIVE: '비활성' };
const columns: TomisColumnDef<Order>[] = [
  {
    id: 'statusCode',
    header: '상태',
    accessorKey: 'statusCode',
    cell: ({ getValue }) => <span>{statusLabel[String(getValue())] ?? String(getValue())}</span>,
  },
];
```

**After (DataMapCell 적용):**
```typescript
// DataMapCell이 dataMap.getDisplay() 호출 + fallback 내장
const columns: TomisColumnDef<Order>[] = [
  {
    id: 'statusCode',
    header: '상태',
    accessorKey: 'statusCode',
    dataMap: statusMap,
    cell: DataMapCell,  // ← 단일 참조로 교체
  },
];
```

### 11.1 파일별 변경 명세

| # | 파일 | 상태 | 변경 내용 | 예상 라인 |
|---|------|------|-----------|----------|
| 1 | `src/DataMapCell.tsx` | NEW | DataMapCell 컴포넌트 + resolveDataMap 헬퍼 (internal) | ~50줄 |
| 2 | `src/types.ts` | MODIFY | DataMapCellProps 타입 alias 추가 (optional — 기존 exports 보존) | +5줄 이하 |
| 3 | `src/index.ts` | MODIFY | `export { DataMapCell }` 추가 (기존 verifyOrWarn stub + G-001 exports 보존) | +1줄 |

### 11.2 구현 순서 (의존성 고려)

1. **types.ts MODIFY**: DataMapCellProps 타입 alias 추가 (선택적). TomisColumnDef 기존 타입 변경 없음 확인.
2. **DataMapCell.tsx NEW**: resolveDataMap 헬퍼 + DataMapCell 컴포넌트 구현. `./types`에서 DataMap, TomisColumnDef import. `@tanstack/react-table`에서 CellContext import.
3. **index.ts MODIFY**: `export { DataMapCell } from './DataMapCell'` 추가. 기존 exports(verifyOrWarn stub + G-001) 보존 확인.
4. **Storybook**: `src/__stories__/DataMapCell.stories.tsx` — 정적 dataMap 시나리오 + 동적 행 단위 시나리오 (AC-007).
5. **tsc 검증**: `npx tsc --noEmit` 0 errors (packages/grid-pro-datamap)

### 11.3 위험 요소

| 위험 | 내용 | 대응 |
|------|------|------|
| R-1: 함수형 dataMap row 주입 시 G-001 타입 호환 | `(row: TData) => DataMap<unknown>` 시그니처 — `resolveDataMap` 호출 시 `rowOriginal: TData`를 그대로 전달해야 함. 타입 캐스팅 불가 (C-4) | `columnDef.dataMap`을 `TomisColumnDef<TData>`로 캐스팅 후 접근 (C-30: Section 3.2 코드 기준) |
| R-2: exactOptionalPropertyTypes (C-29) | `TomisColumnDef.dataMap?: ...` optional prop — `columnDef.dataMap`이 undefined일 때 분기 처리 | `resolveDataMap(columnDef.dataMap, info.row.original)` — undefined 반환 경로 명시 (Section 3.1) |
| R-3: JSX transform 설정 | `DataMapCell.tsx`에서 JSX 사용 — `tsconfig.json`의 `jsx: 'react-jsx'` 필요 | 기존 G-001 `DataMap.ts` 비JSX. `DataMapCell.tsx`가 첫 JSX 파일. tsconfig 확인 필요 (C-1) |
| R-4: AC-003 deferral 문서화 | Goals.json AC-003이 columnFactory 연동을 요구하나 G-002 scope 밖 | implement-score `documentedDeviations[]` + AC-003 → deferred (ADR-MOD-GRID-00-003 절차) |

---

## Section 12 — 번들 영향

| 항목 | 값 |
|------|-----|
| 예상 증가분 | +2 KB (DataMapCell 컴포넌트 + resolveDataMap 헬퍼) |
| 패키지 | `@tomis/grid-pro-datamap` |
| 한도 | ≤ 20 KB (C-21, ADR-MOD-GRID-00-007) |
| G-001 실측 | ESM 995B, CJS 1023B (goals.json G-001 implement.feedback 확인) |
| 측정 정책 | bundle estimation NOT extrapolated from prior Goals (different size profile may apply) — measurement at IMPLEMENT time only per ADR-MOD-GRID-00-010 |
| 측정 방법 | `pnpm -r --filter './packages/grid-pro-datamap' build && pnpm size-limit` |
| 단위 테스트 | N/A (단위 테스트 미설정 — package.json scripts.test = "echo TODO") |

---

## Section 13 — 상용 제품화 영향

### 13.1 패키지 대상
- `packages/grid-pro-datamap` (Pro 패키지)
- `package.json`: `"license": "SEE LICENSE IN EULA"` (직접 Read 확인 — L5)

### 13.2 라이선스 검증
- G-001 구현 완료: `grid-pro-datamap/src/index.ts` L7-11 `verifyOrWarn('@tomis/grid-pro-datamap')` inline stub (C-33 + ADR-MOD-GRID-00-012).
- G-002 DataMapCell은 패키지 진입점이 아님 — 별도 라이선스 검증 호출 불필요 (D-6).
- 사용자가 `import { DataMapCell } from '@tomis/grid-pro-datamap'` 시 index.ts의 verifyOrWarn이 패키지 수준에서 실행됨.
- **MOD-GRID-99-A/G-002 출하 전까지 inline stub 패턴 유지** (C-33 Sunset 조건).

### 13.3 EULA
- G-001에서 `grid-pro-datamap/EULA.md` 생성 완료. G-002 변경 없음.

### 13.4 Storybook story (AC-007 의무)
- 파일 위치 권장: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/__stories__/DataMapCell.stories.tsx`
- 시나리오 1: 정적 dataMap (statusCode → 활성/비활성/대기 변환)
- 시나리오 2: 행 단위 동적 dataMap (dept별 직급 목록 분기)
- C-3 준수: 스토리 내 fixture 데이터는 허용 (Storybook story 예외)
- 구현은 IMPLEMENT 단계 책임

### 13.5 Self-Check (G-01 의무)

- [x] TBD/TODO/미정 = 0건 (AC-003 deferral은 D-4 결정으로 명시, "TBD" 아님)
- [x] Section 7 최종 implementFiles 표: NEW 1 + MODIFY 2 = 3개 (D-1 pre-decision과 일치)
- [x] D# 표 breakdown: NEW DataMapCell.tsx(1) + MODIFY types.ts(1) + MODIFY index.ts(1) → Section 7 행과 1:1 일치 (G-01 v1.0.4)
- [x] Before/After 코드: Section 11에 명시적 "Before" + "After" 라벨 + code fence 존재 (E-02 v1.0.7)
- [x] 모든 코드 템플릿 C-4 준수: `@ts-ignore` 0건, `as any` 0건, `: any` 0건, `declare const` 미존재 심볼 0건 (B-06)
- [x] `@mescius/wijmo*` import 0건 (AC-005, C-16)
- [x] C-28: goals.json 경로 prefix 정정 + Section 7 topvel-grid-monorepo 경로 (H-02 통과)
- [x] C-29: optional prop `columnDef.dataMap` 접근 — resolveDataMap에서 undefined 분기 처리 (Section 3.1)
- [x] C-30: Section 7 재결정 표현 없음. D-1~D-6 pre-decisions가 최종 표와 1:1 일치.
- [x] AC source tags: goals.json 인용 그대로 보존 (AC-001=C-4, AC-002=L1, AC-003=L1, AC-004=C-18, AC-005=C-16, AC-006=C-12, AC-007=C-25)
- [x] H-01: L2 경로 = G-001 구현 파일 (실제 존재 확인), R-A = publish-aggrid-analysis.md (존재), R-W = publish-wijmo-analysis.md (존재)
- [x] H-02: Section 7 부모 디렉토리 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/` 실재 (G-001 구현 완료)
- [x] H-03: AC source 태그 모두 spec 내 다른 섹션에서 실제 인용 (L1=Section 1, C-4=C-4 constraint, C-18=Section 6.5, C-16=Section 1 R-W, C-12=Section 11.2, C-25=Section 13.4)

---

*spec generated: 2026-05-15 | specVersion 1.0.0 | rubricVersion 1.0.7 | D-decisions: 6개 (D-1~D-6)*
