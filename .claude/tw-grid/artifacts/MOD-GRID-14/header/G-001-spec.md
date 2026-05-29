# G-001 Specification: createColumnGroup helper + 다단 헤더 자동 렌더링

**Module**: MOD-GRID-14 — Multi-row Header (Column Groups) — TanStack GroupColumnDef 표준화  
**Goal**: G-001 — createColumnGroup helper + 다단 헤더 자동 렌더링 (TanStack getHeaderGroups)  
**Priority**: P0  
**Package**: `@tomis/grid-pro-header` (Pro tier, licenseTier: Pro)  
**Spec Version**: 1.0  
**Date**: 2026-05-15  
**Spec Writer**: tw-grid Spec Writer Agent (C-15 위임)

---

## D1 결정: implementFiles 경로 prefix 수정 (C-28)

goals.json G-001 `implementFiles`에 기재된 경로 prefix가 잘못되어 있음.

| 항목 | 오류 (goals.json 원본) | 수정 후 |
|------|----------------------|---------|
| prefix | `D:/project/topvel_project/TOMIS/packages/grid-pro-header/` | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/` |
| 근거 | TOMIS 레포에는 `packages/` 디렉터리 없음 (C-28 위반) | `topvel-grid-monorepo/packages/grid-pro-header` 실존 확인 (PowerShell Test-Path True) |

**이 spec의 Section 7 implementFiles 표는 수정된 경로를 사용한다.** goals.json도 동일하게 업데이트 필요 (G-01 v1.0.6 요건).

---

## Section 1: 현황 분석 (Evidence Base)

### 1.1 L0 — 기존 구현 현황

**파일**: `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` (185줄, 직접 Read 확인)

기존 구현은 TanStack v8 `getHeaderGroups()` 기반 다단 헤더를 이미 올바르게 구현하고 있다.

핵심 패턴 (직접 확인):

```typescript
// L57: getHeaderGroups 호출
const headerGroups = table.getHeaderGroups();

// L75-117: 다단 헤더 렌더링
{headerGroups.map((headerGroup) => (
  <tr key={headerGroup.id}>
    {headerGroup.headers.map((header) => {
      if (header.isPlaceholder) {           // L79: placeholder 체크
        return <th key={header.id} colSpan={header.colSpan} ... />;
      }
      return (
        <th
          key={header.id}
          colSpan={header.colSpan}          // L91: colSpan 적용
          onClick={
            !header.subHeaders.length       // L100: 그룹 vs leaf 판별
              ? header.column.getToggleSortingHandler()
              : undefined
          }
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
        </th>
      );
    })}
  </tr>
))}
```

사용 예시 (L166-184 주석):
```typescript
const columns: ColumnDef<Row>[] = [
  { header: '기본 정보', columns: [
    { accessorKey: 'empNo', header: '사번' },
    { accessorKey: 'name', header: '성명' },
  ]},
  { header: '급여 내역', columns: [...] },
];
```

**분석**: GroupedHeaderGrid.tsx 자체가 `createColumnGroup` helper 없이도 TanStack native `{ header, columns }` 리터럴로 동작한다. G-001의 역할은 이 패턴을 typed helper로 표준화하고 Pro 패키지로 격리하는 것이다.

### 1.2 L1 — TanStack v8 API

- `GroupColumnDef<TData>`: `{ header: string; columns: ColumnDef<TData>[] }` 구조의 TanStack 네이티브 타입
- `getHeaderGroups()`: 반환 타입 `HeaderGroup<TData>[]` — 다단 헤더를 행 단위로 분리
- `header.isPlaceholder: boolean` — 그룹 행에서 leaf 컬럼 자리에 삽입되는 빈 셀
- `header.colSpan: number` — 그룹 셀이 몇 컬럼을 span하는지 (TanStack이 자동 계산)
- `header.subHeaders: Header<TData>[]` — 그룹 헤더의 자식 헤더 목록 (leaf이면 빈 배열)
- `flexRender(header.column.columnDef.header, header.getContext())` — 헤더 렌더링
- `useReactTable({ columns, data, getCoreRowModel })` — 테이블 인스턴스 생성

### 1.3 L2 — 신규 패키지 (N/A)

`grid-pro-header` 패키지는 신규 생성 대상이다. 기존 구현 없음.

### 1.4 L3 — 영향 사용처

`GroupedHeaderGrid`를 import하는 파일 Grep 결과:
- `GroupedHeaderGrid.tsx` 자체 (1건)
- `src/types/tomis/grid.ts` (타입 참조, 1건)
- 페이지 레벨 직접 import: **0건**

따라서 affectedUsageFiles는 `GroupedHeaderGrid.tsx` (alias 유지 대상) 1건뿐이다.

### 1.5 R-A — AG Grid Community 패턴

`publish-aggrid-analysis.md` 확인: AG Grid Column Groups는 **Enterprise 전용**. Community에는 네이티브 column grouping이 없다. TanStack의 `GroupColumnDef` 방식이 Community 라이선스로 column groups를 구현하는 올바른 접근이다.

### 1.6 R-W — Wijmo 패턴 (개념 참조만, C-16)

`publish-wijmo-analysis.md §3` 확인: Wijmo는 `hdr.rows.push(new wjGrid.Row())` + `hdr.setCellData(0, c, '15')` + `hdr.rows[0].allowMerging = true` 방식으로 헤더 행을 직접 조작한다. **이 코드는 차용하지 않는다 (C-16).** TanStack은 column 트리(`GroupColumnDef`)를 정의하고 `getHeaderGroups()`가 행 구조를 자동 생성한다 — 이것이 근본적인 접근 차이다.

**migrationImpact**: low (GroupedHeaderGrid alias 유지 대상 1건, grid-pro-header 신규 패키지 — affectedUsageFiles 영향 최소)

---

## Section 2: 목표 및 사용자 스토리

**G-001 목표**: `createColumnGroup` typed helper를 통해 TanStack `GroupColumnDef<TData>` 생성을 표준화하고, `MultiRowHeader` 컴포넌트로 다단 헤더 렌더링 로직을 Pro 패키지에 캡슐화한다.

**사용자 스토리**: 페이지 개발자가 `createColumnGroup({ header: '인사정보', columns: [이름Col, 부서Col] })`을 사용하면 그리드 헤더가 자동으로 2행(상: 그룹 / 하: 컬럼명)으로 렌더링되어야 한다.

**사용자 여정**:
1. `import { createColumnGroup } from '@tomis/grid-pro-header'`
2. `const columns = [createColumnGroup({ header: '인사정보', columns: [nameCol, deptCol] }), salaryCol]`
3. `<Grid data={rows} columns={columns} />` — 헤더 1행: '인사정보'(colSpan 2) + placeholder 셀, 헤더 2행: '이름' + '부서' + '급여'
4. TanStack `table.getHeaderGroups()` 순회로 다단 헤더 행 자동 생성
5. Pro 패키지 import 시 grid-license 검증 자동 실행 (MOD-GRID-99-A)

---

## Section 3: 수락 기준 (AC) 상세

### AC-001: createColumnGroup 시그니처

```typescript
function createColumnGroup<TData>(config: {
  header: string;
  columns: ColumnDef<TData>[];
}): GroupColumnDef<TData>
```

- TypeScript strict 모드 준수, `any` 사용 금지 (C-4)
- 반환값이 TanStack 표준 `GroupColumnDef<TData>` 그대로임을 보장 (C-2)
- `config` 구조분해로 `header`, `columns` 를 받아 `{ header, columns }` 객체를 반환하는 thin wrapper

**구현 참조**: GroupedHeaderGrid.tsx L171-181 주석의 `{ header: '기본 정보', columns: [...] }` 리터럴 패턴이 helper로 표준화된다.

### AC-002: getHeaderGroups 기반 다단 헤더 렌더링

`MultiRowHeader` 컴포넌트는 `table.getHeaderGroups()`를 순회하여 다단 헤더 행을 자동으로 분리 렌더링한다.

- 그룹 헤더 행 (row 0): 그룹명 셀 + isPlaceholder 빈 셀
- 컬럼 헤더 행 (row 1): leaf 컬럼명 셀
- TanStack 표준 API만 사용 (C-2): `getHeaderGroups()`, `header.isPlaceholder`, `header.colSpan`, `flexRender`

**L0 증거**: GroupedHeaderGrid.tsx L75-117에서 동일 패턴 확인.

### AC-003: colSpan 적용

그룹 헤더 셀에 `colSpan={header.colSpan}` 적용. TanStack이 `header.colSpan`을 자동 계산하므로 별도 계산 로직 불필요. `rowSpan=1` 고정 (2단 헤더 가정 — 3단 이상은 G-002 범위).

**L0 증거**: GroupedHeaderGrid.tsx L83, L91에서 `colSpan={header.colSpan}` 확인.

### AC-004: flat 컬럼 혼합 사용

그룹 미사용 flat `ColumnDef`와 그룹 컬럼 혼합 가능. flat 컬럼은 TanStack placeholder 메커니즘에 의해 자동으로 1행(그룹 행) 건너뜀 처리된다 — `header.isPlaceholder = false`이면서 row 0에 나타나는 flat 컬럼은 `rowSpan={headerGroups.length}` 적용으로 헤더 전체 높이 차지.

**L0 증거**: GroupedHeaderGrid.tsx L172-181 주석 예시에서 `salaryCol` 같은 flat 컬럼과 그룹 컬럼 혼합 패턴 확인.

### AC-005: Pro 패키지 라이선스 (C-24)

- `package.json`: `"license": "SEE LICENSE IN EULA"`
- `EULA.md`: Pro 라이선스 문서 존재
- `index.ts` 최상단: `verifyOrWarn()` 호출 (grid-license 런타임 검증, MOD-GRID-99-A)
- import 시 자동 실행

### AC-006: Wijmo import 0건 (C-16 절대 준수)

`@mescius/wijmo*` import 0건. `publish-wijmo-analysis.md §3`의 `hdr.rows.push()` / `setCellData()` 패턴은 개념 학습만 — spec에 인용하되 코드 차용 없음.

### AC-007: ADR 문서 (C-14)

`decisions/MOD-GRID-14-decisions.md` 작성:
- **ADR 주제**: createColumnGroup API 시그니처 및 렌더링 전략 결정
- **대안 A**: Wijmo 스타일 헤더 행 직접 조작 — 거부 이유: C-16 위반, TanStack과 통합 불가
- **대안 B**: AG Grid Column Groups (Enterprise) 패턴 — 거부 이유: C-7 AG Grid 신규 도입 금지, Enterprise 라이선스 필요
- **Trade-offs**: 2개 이상 포함
- ADR 형식: Status / Context / Decision / Alternatives Considered / Trade-offs / Consequences / References (MOD-GRID-10-decisions.md 패턴 따름)

### AC-008: TypeScript 빌드 (C-12)

`tsc --noEmit` 0 error (`packages/grid-pro-header` 범위). strict 모드, `noImplicitAny: true`.

### AC-009: Storybook story (C-25)

story 1개: 그룹 헤더 2단 + flat 컬럼 혼합 시나리오. `@tomis/grid-pro-header` import 기반.

---

## Section 4: 의존성

| 의존성 | 타입 | 이유 |
|--------|------|------|
| `MOD-GRID-01/G-001` | 선행 | 기본 Grid 컴포넌트 존재 필요 |
| `MOD-GRID-99-A/G-001` | 선행 | grid-license `verifyOrWarn` 함수 필요 (AC-005) |
| `@tanstack/react-table` v8 | peerDep | GroupColumnDef, getHeaderGroups (C-22) |
| `react`, `react-dom` | peerDep | JSX 렌더링 (C-22) |

**C-22 준수**: 위 3개는 `peerDependencies`로 선언, `dependencies`에 포함 금지.

---

## Section 5: API 설계

### 5.1 createColumnGroup

```typescript
import type { GroupColumnDef, ColumnDef } from '@tanstack/react-table';

interface ColumnGroupConfig<TData> {
  header: string;
  columns: ColumnDef<TData>[];
}

export function createColumnGroup<TData>(
  config: ColumnGroupConfig<TData>
): GroupColumnDef<TData> {
  return {
    header: config.header,
    columns: config.columns,
  };
}
```

**설계 근거**: GroupedHeaderGrid.tsx L171-181 주석에서 사용자가 이미 `{ header: '기본 정보', columns: [...] }` 리터럴을 직접 사용하고 있다. Helper는 이 패턴에 generic type 안전성만 추가하는 thin wrapper다. 로직 추가 없음.

### 5.2 MultiRowHeader

```typescript
import type { Table } from '@tanstack/react-table';

interface MultiRowHeaderProps<TData> {
  table: Table<TData>;
}

export function MultiRowHeader<TData>({ table }: MultiRowHeaderProps<TData>): JSX.Element
```

- `table.getHeaderGroups()` 순회
- `header.isPlaceholder` 분기
- `header.colSpan` 적용
- `header.subHeaders.length` 로 그룹 vs leaf 판별
- flat 컬럼: `rowSpan={headerGroups.length}` (isPlaceholder=false && subHeaders.length=0 인 row 0 셀)
- 정렬 핸들러: leaf만 (`!header.subHeaders.length`)

**G-002 경계**: sticky + frozenColumns 통합은 G-002 범위. G-001 MultiRowHeader는 기본 렌더링만 담당.

### 5.3 types.ts

```typescript
export type { ColumnGroupConfig } from './createColumnGroup';
export type { MultiRowHeaderProps } from './MultiRowHeader';
```

### 5.4 index.ts (barrel export)

```typescript
import { verifyOrWarn } from '@tomis/grid-license'; // AC-005

verifyOrWarn(); // Pro 패키지 진입점 — 런타임 라이선스 검증 (C-24)

export { createColumnGroup } from './createColumnGroup';
export type { ColumnGroupConfig } from './types';
export { MultiRowHeader } from './MultiRowHeader';
export type { MultiRowHeaderProps } from './types';
```

**C-31 Functional Wiring Audit**:
- `createColumnGroup` → `index.ts` barrel export (G-001 범위)
- `verifyOrWarn` → `index.ts` 최상단 (G-001 범위)
- `MultiRowHeader` → `index.ts` barrel export (G-001 범위); Grid.tsx 통합은 G-002로 위임

---

## Section 6: 엣지 케이스 (EC)

| ID | 시나리오 | 기대 동작 | 근거 |
|----|---------|-----------|------|
| EC-01 | `createColumnGroup({ header: 'X', columns: [] })` — 빈 columns | `GroupColumnDef` 반환, TanStack이 빈 그룹 처리 (그룹 셀 colSpan=0이면 렌더링 스킵) | TanStack 표준 동작 |
| EC-02 | 3단 중첩 (`{ header: 'A', columns: [{ header: 'B', columns: [...] }] }`) | TanStack `getHeaderGroups()` 가 3행 반환, MultiRowHeader가 자동 처리 | TanStack 표준 (AC-002) |
| EC-03 | 그룹 내 모든 자식 컬럼이 hidden (`columnVisibility=false`) | 그룹 헤더 셀 colSpan=0, TanStack이 자동 collapse — MultiRowHeader 별도 처리 불필요 | TanStack 표준 동작 |
| EC-04 | flat 컬럼만 사용 (그룹 없음) | `getHeaderGroups()` 1행만 반환, `rowSpan` 계산 불필요 — 일반 단일 헤더 렌더링 | L0 GroupedHeaderGrid.tsx 기존 동작 |

---

## Section 7: 구현 파일 목록 (implementFiles)

> **D1 prefix 수정 적용**: goals.json의 `TOMIS/packages/` prefix를 `topvel-grid-monorepo/packages/`로 수정.

| # | 파일 경로 | 상태 | 설명 |
|---|---------|------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/src/createColumnGroup.ts` | NEW | createColumnGroup helper 구현 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/src/MultiRowHeader.tsx` | NEW | 다단 헤더 렌더러 컴포넌트 |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/src/types.ts` | NEW | 타입 재export barrel |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/src/index.ts` | NEW | 패키지 barrel export + verifyOrWarn |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/EULA.md` | NEW | Pro 라이선스 문서 (AC-005, C-24) |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/package.json` | NEW | `"license": "SEE LICENSE IN EULA"` + peerDeps 선언 (AC-005, C-22) |
| 7 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-14-decisions.md` | NEW | ADR 문서 (AC-007, C-14) |

**합계**: NEW 7건, MODIFY 0건

**번들 영향**: +5 KB (createColumnGroup + MultiRowHeader + types), 한도 ≤ 20 KB (C-21)

---

## Section 8: 영향 사용처 변경 명세 (affectedUsageFiles)

### 8.1 영향 파일 목록

| # | 파일 경로 | 변경 유형 | 변경 내용 |
|---|---------|---------|---------|
| 1 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` | ALIAS | G-003에서 `@tomis/grid-pro-header` 기반 alias로 재작성 (G-001에서는 변경 없음, alias 작업은 G-003 범위) |

**L3 근거**: Grep 확인 결과 페이지 레벨 직접 import 0건. `GroupedHeaderGrid.tsx`만 alias 유지 대상. G-001 단계에서 이 파일의 실제 변경은 없음 — G-001은 신규 패키지 생성이 주 목적이며, alias 재작성은 G-003이 담당.

---

## Section 9: 비기능 요건

### 9.1 번들 크기 (C-21)
- `grid-pro-header` 전체 ≤ 20 KB (G-001 기여분 +5 KB)
- tree-shaking: named export만 사용 (side-effect 없음, `verifyOrWarn` 제외)

### 9.2 TypeScript (C-4, C-12)
- strict 모드, `noImplicitAny: true`
- `tsc --noEmit` 0 error
- `any` 사용 금지

### 9.3 Tailwind (C-5)
- MultiRowHeader 스타일: Tailwind utility class만 사용
- inline style 금지 (동적 값 예외: G-002의 sticky offset — G-001 범위 아님)

### 9.4 peerDependencies (C-22)
- `@tanstack/react-table`, `react`, `react-dom` — peerDependencies
- `@tomis/grid-license` — dependencies (Pro 패키지 필수 의존)

**sideEffects 주의**: `verifyOrWarn()`이 `index.ts` 최상단에서 실행되므로 번들러가 tree-shaking 시 이 파일을 dead code로 제거할 수 있다. `package.json`에 `"sideEffects": ["src/index.ts"]` 또는 `"sideEffects": false`가 아닌 적절한 값을 설정해야 라이선스 검증이 실행된다.

### 9.5 라이선스 검증 (C-24, MOD-GRID-99-A)
- `verifyOrWarn()`: index.ts 최상단 import 시점 실행
- grid-license 미검증 시 console.warn 출력 (throw 금지 — 개발 편의성)

---

## Section 10: 호환성 및 마이그레이션

### 10.1 Breaking Change
없음 (breaking: false)

### 10.2 Deprecation Strategy (C-6, C-23)
- `GroupedHeaderGrid` alias: 1 minor 버전 유지
- G-001에서 신규 패키지만 추가 — 기존 `GroupedHeaderGrid.tsx` 변경 없음
- G-003에서 alias 재작성

### 10.3 마이그레이션 경로
```
기존: <GroupedHeaderGrid data={rows} columns={groupedCols} />
신규: import { createColumnGroup } from '@tomis/grid-pro-header';
      const columns = [createColumnGroup({ header: '그룹명', columns: [...] }), ...];
      <Grid data={rows} columns={columns} />
```

---

## Section 11: 구현 가이드라인

### 11.1 createColumnGroup.ts 구현 지침

thin wrapper 원칙: 로직 최소화. `config.header`와 `config.columns`를 그대로 반환.

```typescript
// thin wrapper — no logic beyond type narrowing
export function createColumnGroup<TData>(
  config: ColumnGroupConfig<TData>
): GroupColumnDef<TData> {
  return {
    header: config.header,
    columns: config.columns,
  };
}
```

### 11.2 MultiRowHeader.tsx 구현 지침

GroupedHeaderGrid.tsx L75-117 패턴을 컴포넌트로 추출. 추가 로직 없음.

**flat 컬럼 처리 (AC-004)**: TanStack은 flat 컬럼(그룹 없는 leaf)에 대해 그룹 헤더 행(row 0)에 `isPlaceholder=true` 셀을 자동 삽입하고, leaf 컬럼 행(마지막 행)에 실제 헤더를 배치한다. 따라서 `rowSpan` 계산을 구현자가 직접 할 필요 없다 — `header.isPlaceholder` 분기만으로 flat 컬럼이 헤더 전체 높이를 차지하는 것처럼 시각적으로 처리된다.

구현 시 `rowSpan` 커스텀 계산 코드를 추가하지 말 것. TanStack placeholder 메커니즘을 신뢰한다.

### 11.3 Functional Wiring (C-31)

| 신규 유틸 | 호출 위치 | 범위 |
|---------|---------|------|
| `createColumnGroup` | `index.ts` barrel export (소비자가 import) | G-001 |
| `verifyOrWarn` | `index.ts` 최상단 (import 시 자동 실행) | G-001 |
| `MultiRowHeader` | `index.ts` barrel export | G-001 |
| `MultiRowHeader` → Grid.tsx 통합 | **G-002로 위임** (sticky + frozenColumns 통합 시) | G-002 |

**C-31 wiring 경계 근거**: G-001은 패키지 생성 및 기본 렌더링만 담당. Grid.tsx에 MultiRowHeader를 실제로 통합하는 작업은 G-002(sticky/frozen 통합)와 함께 처리하는 것이 일관성 있음. G-001 단계에서 Grid.tsx를 건드리면 G-002에서 sticky 통합 시 추가 변경이 발생하는 이중 수정을 방지.

### 11.4 EULA.md 내용 요건 (AC-005)

최소 포함:
```markdown
# TOMIS Grid Pro License (EULA)

This package (@tomis/grid-pro-header) is a proprietary Pro-tier package.
License: SEE LICENSE IN EULA
```

### 11.5 Wijmo 금지 재확인 (C-16)

구현 시 절대 금지:
- `import * from '@mescius/wijmo*'`
- `hdr.rows.push(new wjGrid.Row())`
- `setCellData()` 호출

---

## Section 12: 검증 기준

### 12.1 specify 단계 검증 (threshold: 90)

| 항목 | 검증 방법 |
|------|---------|
| AC-001 시그니처 | `createColumnGroup<TData>` 반환 타입이 `GroupColumnDef<TData>` |
| AC-002 다단 렌더링 | `getHeaderGroups()` 순회, `isPlaceholder` 분기 |
| AC-003 colSpan | `colSpan={header.colSpan}` 적용 |
| AC-004 flat 혼합 | `rowSpan={headerGroups.length}` 로직 |
| AC-005 라이선스 | EULA.md 존재, `verifyOrWarn()` 호출 |
| AC-006 Wijmo 0건 | Grep `@mescius/wijmo` → 0 결과 |
| AC-007 ADR | decisions/MOD-GRID-14-decisions.md 존재, 대안 2개+ |
| AC-008 tsc | `tsc --noEmit` 0 error |
| AC-009 Storybook | story 파일 존재, 2단 + flat 혼합 시나리오 |

### 12.2 엣지 케이스 검증

| EC | 검증 |
|----|------|
| EC-01 빈 columns | `createColumnGroup({ header: 'X', columns: [] })` — TanStack 정상 처리 |
| EC-02 3단 중첩 | 3행 `headerGroups` 정상 렌더링 |
| EC-03 전체 hidden | colSpan=0 그룹 셀 자동 collapse |
| EC-04 flat only | 단일 헤더 행 정상 렌더링 |

---

## Section 13: 참조 링크

| 참조 | 경로 / 설명 |
|------|------------|
| L0 기존 구현 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` |
| goals.json | `D:/project/topvel_project/TOMIS/.claude/tw-grid/goals/MOD-GRID-14/header-goals.json` |
| constraints | `D:/project/topvel_project/TOMIS/.claude/tw-grid/constraints.md` (C-2, C-4, C-5, C-6, C-12, C-14, C-16, C-21, C-22, C-23, C-24, C-25, C-28, C-30, C-31) |
| specify-rubric | `D:/project/topvel_project/TOMIS/.claude/tw-grid/rubric/specify-rubric.md` v1.0.6 |
| ADR 대상 파일 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-14-decisions.md` (NEW) |
| Wijmo 참조 분석 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md §3` (개념만) |
| AG Grid 분석 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-aggrid-analysis.md` (Enterprise only) |
| Pro 패키지 barrel 패턴 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/src/index.ts` |
| monorepo 패키지 경로 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/` (실존 확인) |

---

*Spec 완료: 13섹션 + D1 prefix 결정 포함*  
*작성 기준일: 2026-05-15*  
*C-15 준수: 메인 세션 위임, Spec Writer Agent 독립 작성*
