# G-001-spec.md — MOD-GRID-12/datamap
## DataMap API 설계 — createDataMap(items, valuePath, displayPath) + column-level dataMap prop

**specVersion**: 1.0.0  
**goalId**: G-001  
**moduleId**: MOD-GRID-12  
**area**: datamap  
**priority**: P0  
**migrationImpact**: medium  
**threshold**: 90  
**createdAt**: 2026-05-15  
**status**: draft

---

## ★ Pre-decisions Table (D1–D7)

| # | 결정 사항 | 이유 / 근거 |
|---|-----------|-------------|
| D1 | `DataMap<TItem>` 인터페이스: `{ getDisplay(value: unknown): string \| undefined; getItems(): TItem[]; getValue(display: string): unknown }` — class 아닌 interface + 구현 객체 반환 (factory 패턴) | AC-001 요구; `as any` 금지(C-4) 이므로 제네릭 타입 파라미터로 안전 표현 가능. `class DataMap` 노출 시 상속 오용 가능성 → interface + factory 선택. ADR-001 |
| D2 | `implementFiles` 경로 prefix 보정 (C-28): goals.json의 `"D:/project/topvel_project/TOMIS/packages/..."` → 실제 경로 `"D:/project/topvel_project/topvel-grid-monorepo/packages/..."` (ADR-MOD-GRID-00-001: 모노레포는 TOMIS repo 외부). TOMIS 내부 파일(`decisions/MOD-GRID-12-decisions.md`)은 `TOMIS/` 경로 그대로 유지. | C-28 + ADR-MOD-GRID-00-001 준수 |
| D3 | `createDataMap<TItem>({ items, valuePath, displayPath })` 시그니처: `valuePath`와 `displayPath`는 `keyof TItem` 또는 `(item: TItem) => unknown/string` 둘 다 허용 (union). AC-002 요구. | 함수형 path 지원 → 중첩 객체·계산 key 처리 가능. AC-002 |
| D4 | `TomisColumnDef<TData>` 타입 정의 위치: `packages/grid-pro-datamap/src/types.ts` 내부. `ColumnDef<TData, unknown>` 를 intersection(`&`)으로 확장하지 않고, `Omit<ColumnDef<TData, unknown>, 'meta'> & { meta?: TomisColumnMeta }` 형식 사용 — 단, G-001 스코프에서는 `dataMap` 필드만 타입 수준 추가. `columns` prop 전달 시 `TomisColumnDef<TData>[]` 선언은 사용처(페이지 코드)에서 캐스팅 없이 직접 사용 가능. | TanStack ColumnDef의 `meta` 필드는 이미 `unknown`으로 정의되어 있음(types.ts L1~24 확인). 직접 확장이 아닌 wrapper 타입으로 안전성 확보. C-4 |
| D5 | `selectOptions` alias (column-level, `string[]`): G-001 스코프에서는 **타입 정의만** (TomisColumnDef에 `selectOptions?: string[]` 필드 추가). 실제 `createDataMap` 자동 변환 로직은 G-002(DataMapCell) / G-003(DataMapEditor) 스코프에서 구현. G-001은 API 계약(interface + factory) 정의 단계. | AC-004: `selectOptions alias` — "F-12-06, C-6". 기존 EditableGrid.tsx의 `meta.selectOptions: { label: string, value: string }[]`(L80, L79-93)은 별개. 신규 column-level `string[]` alias는 전혀 다른 형식. 혼동 방지를 위해 Section 3에 명시. |
| D6 | Pro 패키지 grid-license 검증: `import * as gridLicense from '@tomis/grid-license'` 후 `(gridLicense as { verifyGridLicense?: () => void }).verifyGridLicense?.()` 패턴 사용 (B-06 준수). `@tomis/grid-license` index.ts는 현재 `export {}` placeholder(확인: L1-2) — `verifyGridLicense` 미존재. `@ts-ignore` / `declare const` 금지(C-4, B-06). | MOD-GRID-99-A 미구현이므로 feature-detect 안전 호출 필요. C-24: Pro 패키지 검증 의무. B-06: spec code template C-4/C-29 compliance. |
| D7 | package.json의 `@tomis/grid-license` peer + `@tomis/grid-core` dev dependency 추가는 **G-004로 위임**. G-004 `implementFiles`에 `package.json` 명시되어 있음(goals.json L236 확인). G-001 스코프에서 package.json 수정 없음 — Section 7 write set에서 제외. | package.json이 Section 7에 없으면서 Section 9에서 새 peer를 선언하는 E-01 불일치 방지. 현재 package.json: `peerDependencies`에 `@tomis/grid-license` 미포함(확인: L27-31). |

---

## Section 1 — Goal 개요 및 컨텍스트

### 1.1 Goal 정의
MOD-GRID-12 DataMap 모듈의 첫 번째 Goal(P0): **DataMap API 계약 설계**.

- `createDataMap<TItem>({ items, valuePath, displayPath }): DataMap<TItem>` 팩토리 함수
- `DataMap<TItem>` 인터페이스: `getDisplay`, `getItems`, `getValue` 3개 메서드
- `TomisColumnDef<TData>` 타입: `ColumnDef` 확장, `dataMap` + `selectOptions` 필드 추가
- Pro 패키지 라이선스 검증 진입점 (`index.ts` 수정)

### 1.2 사용자 스토리 (goals.json G-001 기준)
> 페이지 개발자가 `createDataMap({ items: statusList, valuePath: 'code', displayPath: 'label' })` 를 생성하고 column 정의에 `dataMap` 프로퍼티로 전달하면, 해당 컬럼의 표시 셀이 코드 값 대신 레이블로 렌더링되어야 한다.

### 1.3 User Journey Steps (goals.json 그대로)
1. `import { createDataMap } from '@tomis/grid-pro-datamap'`
2. `const statusMap = createDataMap({ items: [...], valuePath: 'code', displayPath: 'label' })`
3. columns 정의: `{ id: 'status', header: '상태', dataMap: statusMap, ... }`
4. 표시 셀: `cell.getValue() → statusMap.getDisplay(value) → '활성'` 렌더
5. `createDataMap` 반환: `DataMap` 객체 — `getDisplay(value): string | undefined` + `getItems(): DataMapItem[]`
6. column-level `dataMap` prop은 `ColumnDef` 확장 타입으로 정의 (TanStack ColumnDef metadata 활용)
7. `selectOptions`(기존 EditableGrid) 마이그레이션 alias: `selectOptions: string[]` → `createDataMap(...)` 자동 변환 (F-12-06, C-6) — **타입 정의만 G-001; 변환 로직은 G-002/G-003**
8. Pro 패키지 import 시 `grid-license` 검증 (C-24)

### 1.4 스코프 경계
- **G-001 포함**: DataMap 인터페이스 정의, createDataMap 팩토리, TomisColumnDef 타입, index.ts 수정(라이선스 검증 + exports), types.ts 신규, DataMap.ts 신규, createDataMap.ts 신규, EULA.md 신규, decisions.md 신규
- **G-001 제외 (후속 Goals)**:
  - DataMapCell 렌더러 컴포넌트 → G-002
  - DataMapEditor 편집 드롭다운 → G-003
  - AsyncDataMap + 캐싱 → G-004
  - package.json peer/dep 수정 → G-004 (D7 결정)
  - EditableGrid.tsx 실제 변경 → G-002 이후
  - Storybook 스토리 → IMPLEMENT 단계에서 작성

---

## Section 2 — 선행 조건 (dependsOn 분석)

| 의존 Goal | 현재 상태 | G-001 영향 |
|-----------|-----------|------------|
| MOD-GRID-01/G-001 | 구현됨 (Grid.tsx, types.ts 확인) | `ColumnDef<TData, unknown>` 타입 사용 가능 |
| MOD-GRID-05/G-001 | 구현됨 (EditableGrid.tsx 확인) | `EditableColumnMeta`, `selectOptions` 기존 패턴 파악 완료 |
| MOD-GRID-99-A/G-001 | **미구현** (grid-license/src/index.ts = `export {}`) | D6: feature-detect 패턴으로 호환 |

### 2.1 grid-license 현황 (C-1 기반 사실 확인)
- 파일: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-license/src/index.ts` (실제 확인)
- 내용: `export {};` — `verifyGridLicense` 미존재
- 결론: G-001 `index.ts` 수정 시 `verifyGridLicense?.()` feature-detect 패턴 필수 (D6)

### 2.2 기존 selectOptions 패턴 (EditableGrid.tsx L79-93 실제 확인)
```typescript
// EditableGrid.tsx L79-93 — 기존 meta.selectOptions (변경 금지)
const optionalProps =
  meta.selectOptions !== undefined
    ? { selectOptions: meta.selectOptions }
    : {};
```
- 기존 `meta.selectOptions` 타입: `EditableColumnMeta.selectOptions` = `{ label: string, value: string }[]` 형식 (object array)
- **신규** column-level `selectOptions: string[]`은 완전히 다른 필드(TomisColumnDef에 추가) — 이름만 같고 위치·타입 상이
- 기존 EditableGrid.tsx 코드 **수정 없음** (G-001 스코프)

---

## Section 3 — API 계약 명세

### 3.1 DataMap 인터페이스

```typescript
// packages/grid-pro-datamap/src/types.ts
// C-4: no any, C-29: exactOptionalPropertyTypes=true

/**
 * DataMap<TItem>: 코드 값 ↔ 레이블 양방향 조회 인터페이스.
 * createDataMap() 팩토리 함수가 반환하는 단일 타입.
 *
 * @typeParam TItem - 옵션 항목 원본 타입 (e.g., { code: string; label: string })
 */
export interface DataMap<TItem = unknown> {
  /** 코드 값 → 표시 레이블. 매핑 없으면 undefined (fallback은 호출자 책임) */
  getDisplay(value: unknown): string | undefined;
  /** 전체 항목 배열 반환 (편집 드롭다운 목록 생성용) */
  getItems(): TItem[];
  /** 레이블 → 코드 값. 매핑 없으면 undefined */
  getValue(display: string): unknown;
}
```

### 3.2 createDataMap 시그니처

```typescript
// packages/grid-pro-datamap/src/types.ts (continued)

/** valuePath / displayPath: keyof TItem 또는 accessor 함수 */
export type PathOrAccessor<TItem, TReturn> =
  | keyof TItem
  | ((item: TItem) => TReturn);

export interface CreateDataMapOptions<TItem> {
  items: TItem[];
  valuePath: PathOrAccessor<TItem, unknown>;
  displayPath: PathOrAccessor<TItem, string>;
}
```

```typescript
// packages/grid-pro-datamap/src/createDataMap.ts
import type { CreateDataMapOptions, DataMap } from './types';

export function createDataMap<TItem>(
  options: CreateDataMapOptions<TItem>
): DataMap<TItem>;
```

### 3.3 TomisColumnDef 타입 (G-001 스코프)

```typescript
// packages/grid-pro-datamap/src/types.ts (continued)
import type { ColumnDef } from '@tanstack/react-table';

/**
 * TomisColumnDef<TData>: TanStack ColumnDef + dataMap/selectOptions 확장.
 * G-001: dataMap + selectOptions 타입 필드만 정의.
 * G-002/G-003: 실제 렌더러·에디터 연결.
 *
 * C-4: no any (DataMap<unknown>으로 상한 타입 사용)
 * C-29: exactOptionalPropertyTypes=true — optional 필드는 undefined 명시 필요
 */
export type TomisColumnDef<TData> = ColumnDef<TData, unknown> & {
  /**
   * 정적 DataMap 또는 행 단위 동적 DataMap 팩토리.
   * G-001: 타입 정의. G-002: DataMapCell 렌더러에서 소비.
   */
  dataMap?: DataMap<unknown> | ((row: TData) => DataMap<unknown>);
  /**
   * 마이그레이션 alias: EditableGrid의 selectOptions 패턴을 column-level로 이관.
   * - 신규 형식: string[] (code 값 목록) — 기존 meta.selectOptions {value,label}[] 와 다름.
   * - G-001: 타입 선언만. G-002/G-003: createDataMap 내부 변환 구현.
   * @deprecated F-12-06: 1 minor 유지 후 column.dataMap 으로 완전 이전 (C-6, C-23)
   */
  selectOptions?: string[];
};
```

**주의**: 기존 `EditableGrid.tsx` `meta.selectOptions: { label: string, value: string }[]` (L80) 와 신규 `TomisColumnDef.selectOptions: string[]`은 다른 타입·위치의 별개 필드. 이름 충돌 없음 (기존은 `meta` 안에, 신규는 column top-level).

### 3.4 index.ts 수정 계획 (MODIFY)

```typescript
// packages/grid-pro-datamap/src/index.ts — 수정 후 (B-06 compliant)
import * as gridLicense from '@tomis/grid-license';

// C-24: Pro 패키지 import 시 라이선스 검증
// B-06: @ts-ignore 금지. verifyGridLicense는 MOD-GRID-99-A 미구현 — feature-detect 패턴
(gridLicense as { verifyGridLicense?: () => void }).verifyGridLicense?.();

// G-001 public exports
export type { DataMap, TomisColumnDef, CreateDataMapOptions, PathOrAccessor } from './types';
export { createDataMap } from './createDataMap';
```

**B-06 해설**: `@tomis/grid-license` index.ts가 현재 `export {}`이므로 `verifyGridLicense`를 직접 참조하면 TypeScript 컴파일 에러. `as { verifyGridLicense?: () => void }` 타입 단언은 `as any` 아닌 구조 호환 타입 단언 → C-4 위반 아님.

---

## Section 4 — 호환성 정책

| 항목 | 내용 |
|------|------|
| Breaking Change | false |
| selectOptions alias 전략 | `TomisColumnDef.selectOptions: string[]` 필드를 1 minor 유지 후 제거 (C-6, C-23). G-001은 타입 선언만; 실제 deprecation 경고는 G-002/G-003 구현 시 추가. |
| 마이그레이션 경로 | `EditableGrid selectOptions` → `column.dataMap = createDataMap(...)` (미래 G-017에서 처리) |
| package.json peer/dep 변경 | **G-004로 위임** (D7). `@tomis/grid-license` peer + `@tomis/grid-core` dev dep 추가는 G-004 스코프. 현재 package.json 수정 없음. |
| 기존 EditableGrid.tsx | G-001 스코프에서 **수정 없음**. `meta.selectOptions` 기존 패턴 그대로 유지. |

---

## Section 5 — 레퍼런스 매핑

| 레퍼런스 | 위치 | G-001 활용 |
|----------|------|-----------|
| **L0** (기존 코드) | `EditableGrid.tsx` L79-93, L80 (실제 Read 확인) | `meta.selectOptions` 기존 패턴 파악 → 신규 alias와 충돌 없음 확인 |
| **L1** (자체 설계) | TanStack ColumnDef metadata 확장 패턴 | `TomisColumnDef<TData>` intersection 설계 기반 |
| **L2** | N/A (신규 Pro 패키지) | — |
| **L3** | N/A (사용처는 MOD-GRID-17) | — |
| **R-A** (AG Grid 참조) | `publish-aggrid-analysis.md` L113-116 — `cellEditor: 'agTextCellEditor'` 패턴 | AG Grid Community에 DataMap 등가물 없음 확인. G-001은 자체 설계. |
| **R-W** (Wijmo 참조) | `publish-wijmo-analysis.md` §4 L142, L195 — `DataMap.itemsSource`, `displayMemberPath`, `selectedValuePath` | 개념 학습만 (C-16: `@mescius/wijmo*` import 금지). Wijmo DataMap과 달리 우리는 제네릭 타입 + factory 패턴. |

### 5.1 R-W 상세 (C-16 준수 명시)
- Wijmo `DataMap`: `itemsSource = [{ key: '1', value: '활성' }]`, `displayMemberPath = 'value'`, `selectedValuePath = 'key'` (publish-wijmo-analysis.md §4 L142)
- 우리 구현: 동일 개념이나 `@mescius/wijmo*` 코드 차용 없이 독립 설계 (`createDataMap` factory)
- **`@mescius/wijmo*` import 0건** (AC-006, C-16) — spec 코드 템플릿에도 Wijmo import 없음

### 5.2 R-A 상세
- AG Grid Community (`publish-aggrid-analysis.md` L113-116): `editable: true, cellEditor: 'agTextCellEditor'` — lookup edit 패턴 없음
- "DataMap 부재 (publish AG Grid 사용처는 lookup edit 없음)" — R-A에서 배울 DataMap 패턴 없음, 자체 설계

---

## Section 6 — 설계 결정 및 대안 (ADR 예고)

decisions/MOD-GRID-12-decisions.md (G-001 신규 생성)에 기록할 핵심 결정:

### ADR-001: DataMap API 형식 — interface + factory vs class vs 단순 Map 객체

| 대안 | 이유 | 결정 |
|------|------|------|
| `class DataMap<TItem>` (Wijmo 방식) | 상속 가능, `.constructor` 타입 체크 | **거부**: 상속 오용 가능성, Pro bundle 증가, Wijmo 방식 모방 |
| `Map<unknown, string>` 단순 객체 | 가장 단순 | **거부**: `getItems()` 반환 불가, 타입 안전성 없음 |
| `Record<string, string>` plain object | 직관적 | **거부**: 함수형 path 지원 불가, 역방향 조회 불가 |
| **interface + factory (선택)** | 타입 안전, tree-shakable, 확장 가능 (`AsyncDataMap` implements) | **채택** |

### ADR-002: TomisColumnDef 확장 방법 — intersection vs metadata 확장

| 대안 | 이유 | 결정 |
|------|------|------|
| `ColumnDef<TData> & { dataMap: ... }` intersection | 직접적 | **채택**: TanStack `meta: unknown` 필드 우회 불필요. intersection이 더 명확. |
| `meta.dataMap` (기존 metadata 활용) | TanStack 관례적 확장 방법 | **거부**: `meta` 타입이 `unknown`이라 매번 캐스팅 필요. DX 저하. |
| Module Augmentation (`declare module '@tanstack/react-table'`) | 전역 확장 | **거부**: C-12 tsc strict 환경에서 전역 오염 위험 |

---

## Section 7 — 구현 파일 목록 (Write Set)

**C-28 적용**: goals.json `implementFiles`의 `TOMIS/packages/` prefix → `topvel-grid-monorepo/packages/` 보정 (D2)

| # | 상태 | 실제 경로 | 설명 |
|---|------|-----------|------|
| 1 | **NEW** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/DataMap.ts` | DataMap 인터페이스 구현 클래스 (내부 구현체, export 안 함 — index는 interface만 export) |
| 2 | **NEW** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/createDataMap.ts` | createDataMap factory 함수 |
| 3 | **NEW** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/types.ts` | DataMap 인터페이스 + TomisColumnDef + CreateDataMapOptions |
| 4 | **NEW** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/EULA.md` | Pro 패키지 EULA (C-24 의무) |
| 5 | **NEW** | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-12-decisions.md` | ADR-001 DataMap API, ADR-002 TomisColumnDef 확장 방법 (C-14) |
| 6 | **MODIFY** | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/index.ts` | `export {}` → 라이선스 검증 + G-001 exports 추가 |

**계: NEW 5개, MODIFY 1개**

**G-004로 위임 (G-001 write set 제외)**:
- `package.json` — `@tomis/grid-license` peer + `@tomis/grid-core` devDep 추가 (goals.json G-004 `implementFiles` L236 확인)

---

## Section 8 — Preflight 체크리스트 (구현 전 검증)

IMPLEMENT 단계 시작 전 반드시 확인:

| 체크 | 확인 방법 | 우선순위 |
|------|-----------|---------|
| `@tomis/grid-license/src/index.ts` 내용 재확인 | Read 도구 | 필수 |
| `tsc --noEmit` baseline 통과 (packages/grid-pro-datamap) | PowerShell `tsc --noEmit` | 필수 |
| `grid-pro-datamap/src/index.ts` 현재 내용 확인 | Read 도구 | 필수 |
| `packages/grid-pro-datamap/tsconfig.json` 존재 여부 | Glob | 필수 |
| `exactOptionalPropertyTypes: true` 확인 (tsconfig.base.json) | Read 도구 | 필수 |
| `@mescius/wijmo*` import grep 0건 확인 | Grep `@mescius/wijmo` | 필수 |
| package.json peer 현황 확인 (G-004 위임 내용 보존) | Read 도구 | 필수 |
| `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/` 디렉토리 존재 | PowerShell `Test-Path` | 필수 |

**package.json 관련 주의**: G-004로 위임된 peer dep 추가를 G-001 IMPLEMENT에서 실수로 건드리지 않도록 주의. Section 4, D7 참조.

---

## Section 9 — 의존성 선언 (현재 상태 기준)

### 현재 package.json 상태 (실제 확인: `grid-pro-datamap/package.json`)
```json
{
  "name": "@tomis/grid-pro-datamap",
  "license": "SEE LICENSE IN EULA",
  "peerDependencies": {
    "@tanstack/react-table": "^8.0.0",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

### G-001 구현 시 필요한 import (현재 package.json 범위 내)
- `@tanstack/react-table` — `ColumnDef` 타입 import (peer, 이미 선언됨)
- `@tomis/grid-license` — `import * as gridLicense from '@tomis/grid-license'` (G-004에서 peer 추가 예정)

### G-004 위임 내용 (G-001 변경 금지)
- `"@tomis/grid-license": "workspace:*"` peer dependency 추가 → G-004
- `"@tomis/grid-core": "workspace:*"` devDependency 추가 → G-004

**IMPLEMENT 주의**: `@tomis/grid-license` import는 G-001 `index.ts` 수정에 필요하나 package.json peer 선언은 G-004. 모노레포 workspace 환경에서 로컬 참조는 package.json 선언 없이도 tsc --noEmit 가능 여부를 IMPLEMENT 단계에서 확인. 필요 시 G-004를 먼저 수행.

---

## Section 10 — 검증 계획 (Verify 단계 예고)

### 10.1 AC 검증 매핑

| AC | 검증 방법 | 도구 |
|----|-----------|------|
| AC-001 DataMap 타입 no-any | `tsc --noEmit` + Grep `any` | tsc + Grep |
| AC-002 createDataMap 함수형 path 지원 | 타입 체크: `valuePath: (item) => item.nested.key` 컴파일 | tsc |
| AC-003 TomisColumnDef 확장 | 타입 체크: `column.dataMap = createDataMap(...)` 할당 가능 | tsc |
| AC-004 selectOptions alias | `TomisColumnDef.selectOptions?: string[]` 타입 정의 존재 확인 | Grep + tsc |
| AC-005 Pro 라이선스 | EULA.md 존재 + index.ts 검증 호출 패턴 확인 | Read + Grep |
| AC-006 no wijmo import | `Grep @mescius/wijmo` 0건 | Grep |
| AC-007 decisions.md ADR | decisions.md 존재 + ADR-001/ADR-002 내용 확인 | Read |
| AC-008 tsc 0 error | `tsc --noEmit` in packages/grid-pro-datamap | PowerShell |
| AC-009 Storybook story | story 파일 존재 + 2개 시나리오 확인 | Glob + Read |

### 10.2 타입 안전성 스모크 테스트 (IMPLEMENT에서 작성)

```typescript
// 타입 체크 전용 (컴파일만, 실행 안 함)
import type { TomisColumnDef, DataMap } from './types';
import { createDataMap } from './createDataMap';

// 1. keyof path
const m1 = createDataMap({ items: [{ code: '1', label: 'A' }], valuePath: 'code', displayPath: 'label' });
// m1: DataMap<{ code: string; label: string }>

// 2. 함수형 path
const m2 = createDataMap({ items: [{ nested: { id: '1' }, name: 'A' }], valuePath: (i) => i.nested.id, displayPath: (i) => i.name });

// 3. TomisColumnDef 할당
const col: TomisColumnDef<{ status: string }> = {
  id: 'status',
  header: '상태',
  dataMap: m1,
};

// 4. C-29 exactOptionalPropertyTypes: undefined 명시 불필요 (optional이므로)
const col2: TomisColumnDef<{ status: string }> = { id: 'status', header: '상태' };
// col2.dataMap 미설정 — OK
```

---

## Section 11 — 번들 영향

| 항목 | 내용 |
|------|------|
| G-001 예상 증가분 | +3 KB (DataMap 구현체 + createDataMap factory) |
| 패키지 | `@tomis/grid-pro-datamap` |
| 한도 | ≤ 20 KB (C-21, goals.json bundleImpact.limit) |
| 측정 시점 | **IMPLEMENT 단계** (C-ADR-MOD-GRID-00-010: bundle 추정은 IMPLEMENT 시점 측정) |
| G-001 스코프 | DataMap.ts + createDataMap.ts + types.ts 증분. 렌더러/에디터 제외 (G-002/G-003) |

---

## Section 12 — 열린 질문 및 위험

| # | 질문/위험 | 상태 | 해결 방향 |
|---|-----------|------|-----------|
| R-1 | `@tomis/grid-license` import가 package.json peer 없이 tsc 통과 가능한가? | **IMPLEMENT 확인 필요** | 통과 안 되면 G-004를 먼저 수행하거나 임시 type-only stub 방식 검토 |
| R-2 | `TomisColumnDef<TData>` intersection이 `ColumnDef<TData, unknown>` 의 `cell`, `header` 등 필드를 모두 유지하는가? | TypeScript 구조 분석 필요 | intersection(`&`)은 모든 필드 유지 — 이론상 OK. IMPLEMENT tsc 검증 |
| R-3 | `DataMap<unknown>` 상한 타입이 `DataMap<{ code: string; label: string }>` 할당을 허용하는가? | **공변성 확인 필요** | `DataMap<TItem>` interface는 `getItems(): TItem[]` 반환 → covariant. `DataMap<unknown>`에 `DataMap<ConcreteType>` 할당 가능. IMPLEMENT 검증 |
| R-4 | EULA.md 내용 표준: Pro 패키지 공통 템플릿 존재 여부 | 다른 Pro 패키지 EULA 참조 필요 | IMPLEMENT 단계에서 `grid-pro-*` 패키지 탐색 |

---

## Section 13 — 요약 체크리스트 (Specify 완료 기준)

- [x] Section 1: Goal 개요 + 스코프 경계 기술
- [x] Section 2: dependsOn 모두 분석 + grid-license 현황 확인 (C-1 Read 실증)
- [x] Section 3: API 계약 명세 (DataMap 인터페이스 + createDataMap + TomisColumnDef + index.ts 수정 계획)
- [x] Section 4: 호환성 정책 (package.json G-004 위임 명시)
- [x] Section 5: R-A, R-W 레퍼런스 매핑 (C-16 준수, Wijmo 참조 분석 기록)
- [x] Section 6: ADR-001/ADR-002 설계 결정 + 대안 기록 (C-14)
- [x] Section 7: Write Set 확정 — NEW 5 + MODIFY 1 (C-28 경로 보정, G-004 위임 명시)
- [x] Section 8: Preflight 체크리스트 (package.json 주의사항 포함)
- [x] Section 9: 의존성 선언 현황 + G-004 위임 내용 명시
- [x] Section 10: AC별 검증 계획 + 타입 스모크 테스트 템플릿
- [x] Section 11: 번들 영향 (측정은 IMPLEMENT)
- [x] Section 12: 열린 질문 4건 기록
- [x] Pre-decisions D1-D7: 모든 핵심 결정 사전 선언
- [x] C-4 준수: 모든 코드 템플릿 `:any`, `as any`, `@ts-ignore`, `@ts-nocheck` 없음
- [x] C-16 준수: `@mescius/wijmo*` import 0건 (참조 분석만)
- [x] C-28 준수: goals.json 경로 prefix 보정 + TOMIS 내부 파일 경로 유지
- [x] C-29 준수: `exactOptionalPropertyTypes=true` — optional 필드 처리 패턴 명시
- [x] B-06 준수: grid-license feature-detect 패턴 명시 (D6 + Section 3.4)
- [x] G-01 v1.0.4: D# 테이블 NEW/MODIFY 카운트 Section 7과 일치 (NEW 5, MODIFY 1)
- [x] E-06: Section 6 결정사항 ↔ Section 7 write set 일관성 확인
- [x] threshold: 90 (medium migrationImpact)

---

*spec generated: 2026-05-15 | specVersion 1.0.0 | rubric version 1.0.6*
