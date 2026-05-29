# MOD-GRID-13 / G-002 Specification
# 복수 컬럼 계층 병합 — hierarchical merge (좌측 컬럼 경계 전파)

**Status**: DRAFT
**Author**: tw-grid Spec Writer Agent
**Date**: 2026-05-15
**Package**: `@tomis/grid-pro-merging`
**Threshold**: specify-score ≥ 90 (low tier)

---

## Section 0 — 사전 결정 (D# 테이블)

| ID | 결정 | 근거 / 제약 |
|----|------|------------|
| D1 | **monorepo 경로 정정 (C-28)**: goals.json `implementFiles`의 `TOMIS/packages/` 접두사를 `topvel-grid-monorepo/packages/`로 정정. ADR 파일(`.claude/tw-grid/decisions/MOD-GRID-13-decisions.md`)은 TOMIS 경로 그대로 유지. | TOMIS 저장소에 `packages/` 디렉토리 미존재. 실제 monorepo root = `D:/project/topvel_project/topvel-grid-monorepo/`. C-28 + ADR-MOD-GRID-00-001 + ADR-MOD-GRID-13-004 근거. |
| D2 | **통합 알고리즘 (Unified Algorithm)**: 단일 패스 `ancestorBoundary` 추적으로 계층 경계 전파. columns.length === 1 일 때 명시적 분기 없음 — G-001 동작으로 수렴(수학적 퇴화). | 좌측에 컬럼이 없으면 ancestorBoundary는 항상 false. compareFn만 판단 → G-001과 비트 동일 출력. ADR-MOD-GRID-13-006. |
| D3 | **암시적 병합 우선순위 (Implicit Priority)**: `columns` 배열 순서가 우선순위를 결정. 좌측 = 높은 우선순위. `MergePriorityConfig` 타입 추가 없음. `types.ts` 수정 없음. | goals.json `implementFiles`에 `types.ts` 포함되어 있으나 기존 타입으로 충분. 새 타입 추가 시 gold-plating (CLAUDE.md §2 위반). goals.json drift → C-28에 의거 spec이 권위 (C-27). ADR-MOD-GRID-13-007. |
| D4 | **회귀 불변성 (Regression Invariant)**: hierarchical 알고리즘이 columns.length === 1 일 때 G-001 출력과 비트 동일한 Map을 생성함을 코드 주석으로 문서화. | G-001 구현체와의 호환 보장, 기존 단일-컬럼 사용자 breaking change 없음. ADR-MOD-GRID-13-008. |
| D5 | **수정 파일 3개 (MODIFY only, NEW 없음)**: `computeMergeSpans.ts` MODIFY, `MergingGrid.stories.tsx` MODIFY, `decisions.md` MODIFY. | G-001에서 모든 기반 파일 생성 완료. G-002는 알고리즘 확장 + 스토리 추가만 필요. `types.ts` D3에 의거 수정 없음. `MergingGrid.tsx` — wiring(computeMergeSpans 호출)은 G-001에서 완료(line 79), 추가 수정 불필요. |

**goals.json 드리프트 기록**:
- `implementFiles[0]`: `TOMIS/packages/grid-pro-merging/src/computeMergeSpans.ts` → 정정 `topvel-grid-monorepo/packages/grid-pro-merging/src/computeMergeSpans.ts` (D1)
- `implementFiles[1]`: `TOMIS/packages/grid-pro-merging/src/types.ts` → 수정 불필요 (D3); goals.json에 포함되어 있으나 기존 타입 충분

---

## Section 1 — 참조 추적 (Reference Traceability)

### L0: 현 구현 (tw-framework-front)
**N/A — 신규 Pro 패키지** (G-001 인용). `tw-framework-front`에 계층 셀 병합 기존 구현 없음. affectedUsageFiles = 0.

### L1: TanStack v8 표준 API (G-001 Section 1 L1 인용)
출처: G-001-spec.md Section 1 L1 — TanStack Row Spanning 직접 지원 없음 확인.

| API | G-002 관련 용도 |
|-----|----------------|
| `table.getRowModel().rows` | hierarchical 병합 계산 기준 행 배열 |
| `row.getVisibleCells()` | 셀 단위 rowSpan 조회 (spanMap 참조) |
| `getCoreRowModel()` | 기본 행 모델 (G-001 wiring 유지) |
| `getSortedRowModel()` | 정렬 후 행 순서 (병합 재계산 트리거) |
| `flexRender` | 셀 렌더링 (G-001 MergingGrid.tsx line 113 유지) |

**TanStack rowSpan 직접 지원 없음**: G-001 `computeMergeSpans` 엔진 확장으로 hierarchical 지원.

### L2: G-001 구현체 — 확장 베이스
출처: `topvel-grid-monorepo/packages/grid-pro-merging/src/computeMergeSpans.ts` (G-001 구현)

G-001 구현 현황:
- 컬럼 독립 순회: `for (const col of columns)` — 각 컬럼별 단일 패스
- 경계 전파 없음: 각 컬럼은 자신의 compareFn만 평가
- G-002 확장 포인트: 행 전환(i→i+1) 시 `ancestorBoundary` 추적 추가

G-001 wiring 현황 (MergingGrid.tsx line 75-83):
```typescript
const spanMap = useMemo(() => {
  if (!enableMerging || mergeColumns.length === 0) {
    return new Map<string, number>();
  }
  return computeMergeSpans(
    rows.map((r) => r.original),
    mergeColumns
  );
}, [rows, mergeColumns, enableMerging]);
```
→ G-002: wiring 변경 없음. 함수 시그니처 동일 유지.

### R-A: AG Grid Column Spanning (참조만 — C-7)
출처: `references/ag-grid-feature-matrix.md`

- AG Grid Enterprise: `colSpan`/`rowSpan` callback. Enterprise 전용.
- G-002 참조 결론: AG Grid도 계층 병합을 수동 callback으로 처리. 우리는 자동 경계 전파 방식 채택.
- **코드 차용 없음 (C-7)**. `ag-grid-enterprise` dependency 추가 금지.

### R-W: Wijmo AllowMerging.Cells (참조만 — C-16)
출처: `references/publish-wijmo-analysis.md` §3-4 (G-001 Section 1 R-W 인용)

- Wijmo `AllowMerging.Cells`: content-driven 자동 병합. 계층 구조 암시적 처리.
- G-002 참조 결론: Wijmo의 content-driven 계층 병합과 유사한 결과를 `ancestorBoundary` 경계 전파로 구현.
- **코드 차용 없음 (C-16 절대 준수)**. `@mescius/wijmo*`, `wijmo*` import 금지.

**migrationImpact**: `low` (goals.json 확인 — affectedUsageFiles = 0)

---

## Section 2 — API 계약 (TypeScript Interface)

### 2.1 types.ts — 변경 없음 (D3)

G-001에서 확정된 타입이 G-002에서도 충분히 작동한다. 타입 수정 없음.

```typescript
// packages/grid-pro-merging/src/types.ts — G-002에서 수정 없음 (D3)
// 기존 타입: MergeRowsConfig<TData>, MergingColumnDef<TData>, MergeSpanMap, MergingGridProps<TData>

// 병합 우선순위: columns 배열 순서 = 암시적 우선순위 (좌측 = 높음)
// MergePriorityConfig 별도 타입 불필요 — 배열 순서로 충분 (D3, ADR-MOD-GRID-13-007)
```

### 2.2 computeMergeSpans 시그니처 — 변경 없음

G-002는 함수 **구현**만 변경. 외부 시그니처 동일 유지.

```typescript
// packages/grid-pro-merging/src/computeMergeSpans.ts
// 시그니처: G-001과 동일 — 하위 호환 (D4)
export function computeMergeSpans<TData>(
  rows: TData[],
  columns: Array<{
    id: string;
    mergeRows: MergeRowsConfig<TData>;
  }>
): MergeSpanMap;
```

시그니처 불변 이유:
- 호출부(MergingGrid.tsx line 79) 변경 없음
- columns 배열 순서가 우선순위를 인코딩 — 새 파라미터 불필요
- columns.length === 1 시 G-001과 동일한 입출력 (D4)

### 2.3 hierarchical 사용 예시

```typescript
// 계층 병합 예시: dept(좌) → team(우) 경계 전파
// dept가 변경되면 team 병합도 강제 종료
import { MergingGrid, type MergingColumnDef } from '@tomis/grid-pro-merging';

interface EmployeeRow {
  dept: string;
  team: string;
  name: string;
}

const hierarchicalColumns: MergingColumnDef<EmployeeRow>[] = [
  {
    id: 'dept',
    header: '부서',
    accessorKey: 'dept',
    meta: { mergeRows: true },           // 좌측 컬럼 — 높은 우선순위 (D3)
  },
  {
    id: 'team',
    header: '팀',
    accessorKey: 'team',
    meta: { mergeRows: true },           // 우측 컬럼 — dept 경계에 종속
  },
  {
    id: 'name',
    header: '이름',
    accessorKey: 'name',
    // mergeRows 미지정 → 병합 없음
  },
];

// dept='개발팀' 3행 중 team='프론트엔드' 2행 + team='백엔드' 1행:
// → dept: 3행 병합
// → team: '프론트엔드' 2행 병합, '백엔드' 1행 (dept 경계와 독립적으로 team 자체 경계도 적용)
// → dept가 변경되는 행에서 team도 반드시 경계 처리 (ancestorBoundary 전파)
```

### 2.4 기본값 (G-001 동일 — 변경 없음)

| Prop | 기본값 | G-002 관련 |
|------|--------|-----------|
| `enableMerging` | `false` | 변경 없음 |
| `columns` 배열 순서 | 좌→우 = 높→낮 우선순위 | G-002 암시적 우선순위 (D3) |
| `meta.mergeRows` | `undefined` (병합 안 함) | 변경 없음 |

---

## Section 3 — 동작 명세 (Behavioral Specification)

### 3.1 계층 병합 핵심 규칙

**R-1 (좌측 경계 전파)**: 컬럼 배열에서 인덱스 j인 컬럼의 행 i→(i+1) 전환 시 경계가 발생하면, 인덱스 k > j인 모든 우측 컬럼도 동일 행 전환에서 경계를 갖는다.

**R-2 (자체 경계 우선)**: 우측 컬럼이 자신의 compareFn 결과로 경계를 가져야 할 경우, 좌측 경계 전파 여부와 관계없이 경계가 발생한다.

**R-3 (단일 컬럼 퇴화)**: columns.length === 1 시 좌측 컬럼 없음 → ancestorBoundary = false → 자신의 compareFn만 평가 → G-001 알고리즘과 동일한 출력 (D2, D4).

**R-4 (스팬 맵 키 불변)**: 키 형식 `${rowIdx}_${colId}` G-001과 동일. 0 = skip, 1 이상 = span 시작.

### 3.2 알고리즘 의사 코드 (Pseudocode)

```
computeMergeSpans(rows, columns):
  spanMap = new Map()
  if rows.length === 0: return spanMap

  // 각 컬럼별 상태 초기화
  // spanStart[j]: 현재 병합 그룹 시작 행 인덱스
  // spanCount[j]: 현재 병합 그룹 길이
  for j in 0..columns.length-1:
    spanStart[j] = 0
    spanCount[j] = 1
    compareFn[j] = resolveFn(columns[j].mergeRows, columns[j].id)

  // 단일 패스: 행 전환 i → i+1
  for i in 1..rows.length-1:
    ancestorBoundary = false         // 이 행 전환에서 좌측 경계 누적

    for j in 0..columns.length-1:
      col = columns[j]
      if !col.mergeRows:
        continue                     // mergeRows 미설정 컬럼은 skip

      // 경계 조건: 자체 compareFn false OR 좌측에서 경계 전파
      ownBoundary = !compareFn[j](rows[i-1], rows[i])
      hasBoundary = ownBoundary OR ancestorBoundary

      if hasBoundary:
        spanMap.set(`${spanStart[j]}_${col.id}`, spanCount[j])
        spanStart[j] = i
        spanCount[j] = 1
        ancestorBoundary = true      // 이 컬럼 경계 → 우측 컬럼에 전파
      else:
        spanCount[j]++
        spanMap.set(`${i}_${col.id}`, 0)  // skip 셀

  // 마지막 그룹 flush
  for j in 0..columns.length-1:
    if columns[j].mergeRows:
      spanMap.set(`${spanStart[j]}_${columns[j].id}`, spanCount[j])

  return spanMap
```

**ancestorBoundary 생명주기**:
- `i` 행 전환 루프 시작 시 `false`로 초기화
- 컬럼 j에서 경계 발생(hasBoundary = true) 시 `true`로 설정
- 같은 `i` 루프 내 j+1, j+2 ... 컬럼에 전파
- 다음 `i` 루프 시작 시 재초기화

### 3.3 핵심 시나리오 — 진리표 (Truth Table)

데이터: `[{dept:'A', team:'X'}, {dept:'A', team:'Y'}, {dept:'B', team:'Y'}]`
columns: `[{id:'dept', mergeRows:true}, {id:'team', mergeRows:true}]`

| i | dept prev→curr | team prev→curr | ancestorBoundary(dept) | dept 경계? | team 경계? | spanMap 기록 |
|---|----------------|----------------|------------------------|-----------|-----------|-------------|
| 1 | A→A (same)     | X→Y (diff)     | false                  | false     | true (own)| `1_team=0`? 아님 team boundary → flush `0_team=1`, `1_team` 새 그룹 시작 |
| 2 | A→B (diff)     | Y→Y (same)     | false → true(dept)     | true      | true(전파)| flush `0_dept=2`, `2_dept` 새 시작; flush `1_team=1`, `2_team` 새 시작 |

최종 spanMap:
- `0_dept` = 2, `2_dept` = 1
- `1_dept` = 0 (skip)
- `0_team` = 1, `1_team` = 1, `2_team` = 1

해석: dept '개발팀'은 2행 병합. team은 각자 다른 값이므로 각각 1행.

### 3.4 단일 컬럼 회귀 검증 시나리오 (D4)

데이터: `[{dept:'A'}, {dept:'A'}, {dept:'B'}]`
columns: `[{id:'dept', mergeRows:true}]` (단일 컬럼)

G-001 결과:
- `0_dept`=2, `1_dept`=0, `2_dept`=1

G-002 결과 (ancestorBoundary 항상 false):
- i=1: ownBoundary=false (A===A), hasBoundary=false → spanCount[0]++, `1_dept`=0
- i=2: ownBoundary=true (A≠B), hasBoundary=true → flush `0_dept`=2, 새 그룹 시작
- flush: `2_dept`=1

→ `{0_dept:2, 1_dept:0, 2_dept:1}` = G-001과 비트 동일 ✓

---

## Section 4 — 엣지 케이스 (Edge Cases)

### EC-001 (G-001 상속): 0행 또는 1행 데이터
- 0행: 빈 Map 반환 (G-001 동일)
- 1행: 경계 전환 없음 → 모든 mergeRows 컬럼에 `0_colId`=1 기록

### EC-002: mergeRows 미설정 컬럼이 columns 배열 중간에 위치
- 시나리오: `[{id:'dept', mergeRows:true}, {id:'count'}, {id:'team', mergeRows:true}]`
- `count` 컬럼은 mergeRows 없음 → ancestorBoundary 전파 체인에서 **제외**
- `dept` 경계 → `ancestorBoundary=true` → `team`에 전파됨 (중간 미설정 컬럼 무시)
- 구현 주의: `for j in columns` 루프에서 `!col.mergeRows` 시 `continue` 하되 `ancestorBoundary`는 유지

### EC-003: compareFn이 비결정론적 (non-deterministic)
- 동일 입력에 대해 다른 결과를 반환하는 fn → 렌더링 불안정
- 대응: W-1(주의사항)에 문서화. 검증 불가 → 사용자 책임.

### EC-004: columns 배열이 빈 배열
- `mergeColumns.length === 0` → `computeMergeSpans` 호출 생략 (MergingGrid.tsx line 76-78 기존 로직)
- 빈 Map 반환 → 모든 셀 rowSpan=1 (일반 그리드 동작)

### EC-005: 모든 행이 동일한 값 (전체 병합)
- dept: `['A','A','A']` → `0_dept`=3, `1_dept`=0, `2_dept`=0
- team: dept 경계 없음 + team 자체도 같으면 team도 전체 병합
- 주의: rowSpan이 데이터 전체 행 수와 같아짐 → 테이블 높이 확보 필요

### EC-006: 커스텀 compareFn이 예외를 던지는 경우
- G-002 범위 외: compareFn 예외 처리 없음. try-catch 불필요 (gold-plating).
- W-3에 문서화.

### EC-007: 1000+ 행 대용량 데이터
- O(N×C) 단일 패스: 1000행×5컬럼 = 5000 연산 → 허용 범위
- react-virtual 통합 없음 — G-003 범위. AC-005 스토리에서 대용량 데이터 시연하나 가상화 없음 명시.

---

## Section 5 — 구현 제약 (Implementation Constraints)

### 5.1 알고리즘 복잡도
- 시간: O(N×C) — N=행 수, C=mergeRows 컬럼 수
- 공간: O(N×C) — spanMap 엔트리 수
- 단일 패스: 2중 루프(외부=행, 내부=컬럼) → 추가 메모이제이션 불필요

### 5.2 TanStack v8 API 준수 (C-2)
- `getCoreRowModel`, `getSortedRowModel`, `getRowModel().rows` 외 비표준 API 금지
- `rowSpan` 직접 지원 없으므로 spanMap 엔진 유지 (G-001 아키텍처 유지)

### 5.3 TypeScript 엄격 모드 (C-4, B-06)
- `as any`, `: any`, `@ts-ignore`, `@ts-nocheck` 금지
- `Record<string, unknown>` 타입 강제: `mergeRows === true` 시 `(row as Record<string, unknown>)[col.id]` 패턴 (G-001 라인 유지)
- `as ColumnDef<TData>[]` 최소 불가피 캐스트만 (G-001 MergingGrid.tsx line 51)

### 5.4 C-29 선택적 spread 패턴
- `{...(className !== undefined && { className })}` 패턴 유지 (G-001 MergingGrid.tsx line 86)
- G-002는 MergingGrid.tsx 미수정 → 적용 불필요

### 5.5 grid-license inline stub 유지 (ADR-MOD-GRID-13-002)
- `MergingGrid.tsx` 미수정 → 기존 stub 그대로
- 새 파일(computeMergeSpans.ts)에는 라이선스 stub 불필요 — utility function, not component entry point
- namespace import 패턴(`import * as gridLicense from '@tomis/grid-license'`) 코드 템플릿에 사용 금지

### 5.6 React 훅 의존성 배열 (C-2)
- `useMemo([rows, mergeColumns, enableMerging])` 유지 (G-001 line 82)
- G-002 hierarchical 알고리즘은 동일 입력→동일 출력 보장 → 기존 메모이제이션 유효

### 5.7 C-3 Surgical Changes
- `computeMergeSpans.ts` 함수 내부 구현만 변경
- 기존 MergingGrid.tsx, types.ts, index.ts, package.json 등 수정 없음 (D5)

---

## Section 6 — 수용 기준 (Acceptance Criteria)

| ID | 기준 | 검증 방법 |
|----|------|---------|
| AC-001 | `columns: [{id:'dept', mergeRows:true}, {id:'team', mergeRows:true}]` + dept가 변경되는 행에서 team도 강제 경계 처리. dept 변경행의 `spanMap.get('i_team') !== 0` (새 그룹 시작). | computeMergeSpans 단위 테스트 |
| AC-002 | `columns.length === 1` 시 출력이 G-001 computeMergeSpans와 비트 동일. | 회귀 테스트 — 동일 데이터, 단일 컬럼 |
| AC-003 | EC-002 시나리오: mergeRows 미설정 컬럼이 중간 위치해도 양쪽 mergeRows 컬럼의 경계 전파 정상 작동. | 단위 테스트 |
| AC-004 | `enableMerging=false` 시 spanMap = 빈 Map → 모든 셀 rowSpan=1 (일반 그리드 동작 보존). G-001 AC-004 상속. | MergingGrid 렌더 테스트 |
| AC-005 | 1000+ 행 데이터에서 dept/team 2컬럼 계층 병합 시 spanMap 키 수 ≤ N×C (O(N×C) 보장). | computeMergeSpans 성능 테스트 |

---

## Section 7 — 파일 목록 (File List)

**수정 파일: 3개 (MODIFY 3 / NEW 0)**

| 파일 (절대 경로) | Action | 변경 내용 |
|----------------|--------|---------|
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/computeMergeSpans.ts` | MODIFY | G-001 단일 패스 알고리즘 → hierarchical ancestorBoundary 전파 알고리즘으로 교체. 함수 시그니처 불변. |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/MergingGrid.stories.tsx` | MODIFY | 3번째 스토리 `HierarchicalMerge` 추가 (dept/team 1000+ 행). CSF3 placeholder 패턴 유지. |
| `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-13-decisions.md` | MODIFY | ADR-MOD-GRID-13-006, 007, 008 추가. |

**수정 없음 파일 (근거)**:
- `types.ts` — D3: 기존 타입 충분, MergePriorityConfig 불필요
- `MergingGrid.tsx` — D5: computeMergeSpans wiring G-001 완료(line 79), 시그니처 불변
- `index.ts` — G-001에서 exports 완성
- `package.json`, `tsconfig.json`, `tsup.config.ts`, `EULA.md` — G-001에서 확정

---

## Section 8 — 테스트 명세 (Test Specification)

### 8.1 단위 테스트 (computeMergeSpans — hierarchical)

**T-001**: AC-001 — 기본 계층 병합
```typescript
// 입력
const rows = [
  { dept: '개발팀', team: '프론트엔드' },
  { dept: '개발팀', team: '프론트엔드' },
  { dept: '개발팀', team: '백엔드' },
  { dept: '디자인팀', team: 'UX' },
  { dept: '디자인팀', team: 'UX' },
];
const columns = [
  { id: 'dept', mergeRows: true },
  { id: 'team', mergeRows: true },
];

// 기대 결과
// dept: '개발팀' 3행, '디자인팀' 2행
// team: '프론트엔드' 2행 (0-1), '백엔드' 1행 (2), 'UX' 2행 (3-4)
// 단, '백엔드'는 3행에 시작 → 4행에 dept 경계 발생 → team도 경계
expect(spanMap.get('0_dept')).toBe(3);
expect(spanMap.get('1_dept')).toBe(0);  // skip
expect(spanMap.get('2_dept')).toBe(0);  // skip
expect(spanMap.get('3_dept')).toBe(2);
expect(spanMap.get('4_dept')).toBe(0);  // skip

expect(spanMap.get('0_team')).toBe(2);
expect(spanMap.get('1_team')).toBe(0);  // skip
expect(spanMap.get('2_team')).toBe(1);  // '백엔드' 1행
expect(spanMap.get('3_team')).toBe(2);
expect(spanMap.get('4_team')).toBe(0);  // skip
```

**T-002**: AC-002 — 단일 컬럼 회귀 (G-001 비트 동일)
```typescript
const rows = [{ dept: 'A' }, { dept: 'A' }, { dept: 'B' }];
const columns = [{ id: 'dept', mergeRows: true }];
// G-001과 동일 출력 기대
expect(spanMap.get('0_dept')).toBe(2);
expect(spanMap.get('1_dept')).toBe(0);
expect(spanMap.get('2_dept')).toBe(1);
```

**T-003**: AC-003 — 중간 미설정 컬럼
```typescript
const columns = [
  { id: 'dept', mergeRows: true },
  { id: 'count' },               // mergeRows 미설정
  { id: 'team', mergeRows: true },
];
// dept 경계 시 team도 경계 발생 (count 건너뜀)
```

**T-004**: EC-001 — 0행 데이터
```typescript
expect(computeMergeSpans([], columns).size).toBe(0);
```

**T-005**: EC-005 — 전체 동일 값
```typescript
const rows = [{ dept: 'A' }, { dept: 'A' }, { dept: 'A' }];
expect(spanMap.get('0_dept')).toBe(3);
expect(spanMap.get('1_dept')).toBe(0);
expect(spanMap.get('2_dept')).toBe(0);
```

### 8.2 스토리 검증 (MergingGrid.stories.tsx)

**Story T-006**: HierarchicalMerge — 1000+ 행
- dept 10개 × team 3개 = 30 그룹 × 34행 ≈ 1000행
- `enableMerging: true` + hierarchical columns
- 시각 검증: dept 34행 병합, team dept 경계 내에서 그룹 병합

---

## Section 9 — 번들/성능 임팩트 (Bundle & Performance Impact)

### 번들 크기
- goals.json 명시: `+2 KB (hierarchical 분기 로직)`
- 기존 `computeMergeSpans.ts` ≈ 800 bytes (minified, G-001)
- G-002 확장 후 예상 ≈ 1.2~1.5 KB (ancestorBoundary 추적 로직 추가)
- types.ts 무변경 → 타입 선언 번들 영향 없음

### 성능
- O(N×C) 단일 패스 — G-001 대비 C배 증가(컬럼 수)
- useMemo 메모이제이션 유지 → 불필요한 재계산 방지
- 1000행×2컬럼 = 2000 연산 — 브라우저 주 스레드 < 1ms 예상
- react-virtual 통합은 G-003 범위 (W-2 참조)

---

## Section 10 — 아키텍처 노트 (Architecture Notes)

### 10.1 hierarchical 알고리즘 설계 철학

ancestorBoundary 패턴은 전통적인 "좌측 컬럼이 경계를 만들면 우측 컬럼도 리셋" 규칙을 구현한다. 이 패턴의 장점:

1. **단일 패스**: 컬럼 수와 무관하게 행당 O(C) 연산
2. **상태 최소화**: 컬럼별 spanStart, spanCount + 행 전환별 ancestorBoundary 하나
3. **퇴화 보장**: columns 1개 시 ancestorBoundary 항상 false → G-001 동일 (D2)

### 10.2 wiring 감사 (C-31)

`computeMergeSpans`는 G-001에서 `MergingGrid.tsx` line 79에 이미 wiring 완료.
G-002는 함수 구현만 변경 — wiring 추가 불필요.

```typescript
// MergingGrid.tsx line 79 (G-001 구현, G-002 변경 없음)
return computeMergeSpans(
  rows.map((r) => r.original),
  mergeColumns
);
```

### 10.3 명시적 브랜치 없음 (D2)

`if (columns.length === 1)` 분기를 추가하지 않는다. 단일 컬럼 케이스는 수학적으로 hierarchical 알고리즘의 특수 케이스 — 명시적 분기는 gold-plating이자 코드 복잡도 증가.

### 10.4 MergingGrid.tsx 미수정 근거

G-001 wiring (line 75-83) + G-001 렌더러(line 102-119)가 G-002 hierarchical 결과를 동일하게 처리:
- spanMap.get(`${rowIdx}_${cell.column.id}`) === 0 → null 반환 (skip)
- spanMap.get(`${rowIdx}_${cell.column.id}`) > 1 → rowSpan 적용

hierarchical 알고리즘은 동일한 Map<string, number> 포맷을 출력 → 렌더러 변경 없음.

---

## Section 11 — 주의사항 & 알려진 제한 (Warnings & Known Limitations)

### W-1: compareFn 비결정론적 사용 금지
`mergeRows: (prev, curr) => boolean` 함수가 외부 상태(Date.now(), Math.random() 등)에 의존하면 렌더링마다 다른 spanMap 생성 → 무한 리렌더 가능성. `useMemo` dependency 관리 주의.

### W-2: react-virtual 통합 미지원 (G-003 범위)
가상 스크롤 환경에서 rowSpan 경계 클리핑 발생 가능. G-002는 전체 DOM 렌더링 전제. AC-005 스토리(1000+ 행)는 가상화 없이 실행 — 대규모 실제 사용 시 성능 주의. react-virtual + rowSpan 통합은 G-003에서 구현.

### W-3: compareFn 예외 처리 없음
`mergeRows: (prev, curr) => boolean` 내부에서 예외 발생 시 `computeMergeSpans` 전체 오류. try-catch 추가 없음 (gold-plating). 사용자 책임.

### W-4 (G-001 상속): 가상화 환경 rowSpan 클리핑
G-001 Section 11.3 W-4 재확인 — G-003 범위.

### W-5: ancestorBoundary 전파 방향 단방향
좌→우만 전파. 우→좌 전파 없음. columns 배열 순서가 전파 방향 결정 (D3).

### 11.1 Section 7 ↔ Section 11 파일 일치 확인

Section 7 파일 목록 (3개):
1. `computeMergeSpans.ts` — MODIFY
2. `MergingGrid.stories.tsx` — MODIFY
3. `MOD-GRID-13-decisions.md` — MODIFY

Section 11 코드 템플릿:
- `computeMergeSpans.ts`: Section 3.2 pseudocode 기반 구현
- `MergingGrid.stories.tsx`: Section 8.2 T-006 기반 스토리 추가
- `decisions.md`: ADR-006, 007, 008 추가

MergingGrid.tsx, types.ts, index.ts 등 미포함 — 일치 ✓

### 11.2 코드 템플릿 — computeMergeSpans.ts (G-002)

```typescript
// packages/grid-pro-merging/src/computeMergeSpans.ts
// G-002: hierarchical ancestorBoundary 전파 알고리즘
// 시그니처 G-001과 동일 유지 (하위 호환, D4)
//
// Regression invariant (ADR-MOD-GRID-13-008):
// columns.length === 1 시 ancestorBoundary 항상 false → G-001 출력과 비트 동일.
import type { MergeRowsConfig, MergeSpanMap } from './types';

export function computeMergeSpans<TData>(
  rows: TData[],
  columns: Array<{ id: string; mergeRows: MergeRowsConfig<TData> }>
): MergeSpanMap {
  const spanMap: MergeSpanMap = new Map();
  if (rows.length === 0) return spanMap;

  // 각 컬럼 compareFn 해석 (G-001 패턴 유지)
  const fns = columns.map((col) => {
    if (!col.mergeRows) return null;
    if (col.mergeRows === true) {
      return (prev: TData, curr: TData): boolean =>
        (prev as Record<string, unknown>)[col.id] ===
        (curr as Record<string, unknown>)[col.id];
    }
    return col.mergeRows as (prev: TData, curr: TData) => boolean;
  });

  // 컬럼별 span 상태
  const spanStart = columns.map(() => 0);
  const spanCount = columns.map(() => 1);

  // 단일 패스: 행 전환 i → i+1
  for (let i = 1; i < rows.length; i++) {
    let ancestorBoundary = false; // 이 행 전환의 좌측 경계 누적

    for (let j = 0; j < columns.length; j++) {
      const fn = fns[j];
      if (fn === null) continue; // mergeRows 미설정 → skip (ancestorBoundary 유지)

      const ownBoundary = !fn(rows[i - 1], rows[i]);
      const hasBoundary = ownBoundary || ancestorBoundary;

      if (hasBoundary) {
        spanMap.set(`${spanStart[j]}_${columns[j].id}`, spanCount[j]);
        spanStart[j] = i;
        spanCount[j] = 1;
        ancestorBoundary = true; // 이 컬럼 경계 → 우측 전파
      } else {
        spanCount[j]++;
        spanMap.set(`${i}_${columns[j].id}`, 0); // skip 셀
      }
    }
  }

  // 마지막 그룹 flush
  for (let j = 0; j < columns.length; j++) {
    if (fns[j] !== null) {
      spanMap.set(`${spanStart[j]}_${columns[j].id}`, spanCount[j]);
    }
  }

  return spanMap;
}
```

### 11.3 코드 템플릿 — MergingGrid.stories.tsx 추가 스토리

```typescript
// packages/grid-pro-merging/src/MergingGrid.stories.tsx
// G-002: HierarchicalMerge 스토리 추가 (기존 MergeRowsBoolean, MergeRowsCompareFn 유지)
// AC-005: 1000+ 행 시연 — react-virtual 통합 없음 (G-003 범위, W-2)

// 1000+ 행 샘플 데이터 생성 (dept 10개 × team 3개 × ~34행)
const depts = ['개발팀', '디자인팀', '마케팅팀', '영업팀', '인사팀', '재무팀', '운영팀', '고객팀', '법무팀', '전략팀'];
const teams = ['A팀', 'B팀', 'C팀'];

const largeData: EmployeeRow[] = [];
for (let d = 0; d < depts.length; d++) {
  for (let t = 0; t < teams.length; t++) {
    const rowCount = 33 + (d + t) % 3; // 33~35행
    for (let r = 0; r < rowCount; r++) {
      largeData.push({
        dept: depts[d],
        team: teams[t],
        name: `직원${d * 100 + t * 10 + r}`,
        year: 2024,
      });
    }
  }
}
// largeData.length ≈ 1000+

const hierarchicalColumns: MergingColumnDef<EmployeeRow>[] = [
  {
    id: 'dept',
    header: '부서',
    accessorKey: 'dept',
    meta: { mergeRows: true }, // 좌측 — 높은 우선순위
  },
  {
    id: 'team',
    header: '팀',
    accessorKey: 'team',
    meta: { mergeRows: true }, // 우측 — dept 경계에 종속
  },
  {
    id: 'name',
    header: '이름',
    accessorKey: 'name',
  },
];

const hierarchicalArgs: MergingGridProps<EmployeeRow> = {
  data: largeData,
  columns: hierarchicalColumns,
  enableMerging: true,
};

/**
 * HierarchicalMerge: 복수 컬럼 계층 병합 시나리오 (AC-001, AC-005).
 *
 * dept(좌) → team(우) 경계 전파: dept가 변경되면 team도 강제 경계.
 * 1000+ 행 데이터로 O(N×C) 성능 시연.
 *
 * ⚠️ react-virtual 통합 없음 — 가상 스크롤은 G-003에서 구현 (W-2).
 */
export const HierarchicalMerge = {
  args: hierarchicalArgs,
};
```

---

## Section 12 — 마이그레이션 영향 분석

### 12.1 기존 사용자 호환성
- `computeMergeSpans` 함수 시그니처 불변 → breaking change 없음
- `MergingGrid` Props 불변 → 기존 사용자 코드 변경 없음
- `MergeRowsConfig`, `MergingColumnDef` 타입 불변 (D3)
- G-001 단일 컬럼 사용자: G-002 배포 후 동일 출력 보장 (D4, T-002)

### 12.2 affectedUsageFiles
- goals.json: `affectedUsageFiles: []` — 신규 Pro 패키지, 기존 사용처 없음

### 12.3 goals.json 드리프트
| 항목 | goals.json | 실제 적용 | 이유 |
|------|-----------|---------|------|
| `implementFiles[0]` 경로 | `TOMIS/packages/...` | `topvel-grid-monorepo/packages/...` | D1 (C-28) |
| `implementFiles[1]` types.ts | 수정 포함 | 수정 없음 | D3 (gold-plating 회피) |

---

## Section 13 — 아키텍처 결정 레코드 (ADRs)

### ADR-MOD-GRID-13-006: 통합 알고리즘 — 명시적 단일 컬럼 분기 없음

**Status**: Accepted

**Context**:
hierarchical 알고리즘이 columns.length === 1일 때 G-001과 동일한 출력을 내어야 한다.
명시적 `if (columns.length === 1)` 분기를 추가할지 결정 필요.

**Decision**:
명시적 분기 없음. ancestorBoundary 패턴의 수학적 퇴화에 의존.
columns.length === 1 → 좌측 컬럼 없음 → ancestorBoundary 항상 false 초기값 유지 → 자신의 compareFn만 평가 → G-001과 동일 로직.

**Rationale**:
- 명시적 분기는 코드 복잡도 증가 + gold-plating (CLAUDE.md §2)
- 수학적 퇴화로 회귀 보장 — 별도 코드 경로 없이 동일 출력 (T-002 검증)
- 향후 컬럼 수 변경 시 경계 케이스 처리 불필요

**Alternatives**:
- 채택: 통합 알고리즘 (수학적 퇴화)
- 미채택: `if length === 1` 명시적 분기 — 불필요한 복잡도

**Trade-offs**:
수학적 퇴화는 직관성보다 낮을 수 있음 → 코드 주석으로 명시 (T-002 회귀 테스트).

**Result**: `computeMergeSpans.ts` 내 `ancestorBoundary` 단일 패스 구현.

---

### ADR-MOD-GRID-13-007: 암시적 우선순위 — MergePriorityConfig 타입 미추가

**Status**: Accepted

**Context**:
goals.json userJourneySteps에 "mergePriority option"이 언급됨.
계층 병합에서 컬럼 우선순위를 어떻게 표현할지 결정 필요.

**Decision**:
별도 `MergePriorityConfig` 타입 없음. `columns` 배열 순서 = 암시적 우선순위.
좌측 인덱스 = 높은 우선순위. types.ts 수정 없음 (D3).

**Rationale**:
- 배열 순서는 이미 컬럼 렌더링 순서를 결정 → 추가 설정 불필요
- `MergePriorityConfig` 타입 추가는 gold-plating (CLAUDE.md §2)
- goals.json drift — C-27/C-28에 의거 spec이 권위 있는 소스
- 기존 TanStack ColumnDef 패턴과 일치

**Alternatives**:
- 채택: 배열 순서 암시적 우선순위
- 미채택: `meta?: { mergeRows?, mergePriority?: number }` — 불필요한 API 복잡도
- 미채택: `MergePriorityConfig = number | 'left' | 'right'` 타입 — gold-plating

**Trade-offs**:
배열 순서 변경 = 우선순위 변경. 직관적이나 암시적. 문서화로 명시.

**Result**: types.ts 수정 없음. ancestorBoundary 전파가 배열 순서를 우선순위로 자연스럽게 인코딩.

---

### ADR-MOD-GRID-13-008: 회귀 불변성 — columns.length=1 비트 동일 출력 보장

**Status**: Accepted

**Context**:
G-002 hierarchical 알고리즘이 G-001 단일 컬럼 사용자에게 breaking change를 유발하지 않아야 함.
수학적 퇴화로 동일 출력이 보장되지만, 이를 명시적으로 문서화할지 결정 필요.

**Decision**:
코드 주석(JSDoc `@remarks`)과 ADR으로 회귀 불변성 문서화.
단위 테스트 T-002로 기계적 검증.

**Rationale**:
- G-001 구현체와의 호환 신뢰를 명시적 테스트로 보장
- 알고리즘 변경 시 T-002 실패 → 회귀 즉시 감지
- 코드 주석으로 의도 명확화 → 미래 수정자 보호

**Alternatives**:
- 채택: ADR + 단위 테스트 T-002
- 미채택: 암묵적 보장 (문서화 없음) — 미래 수정자에게 의도 불명확

**Result**: `computeMergeSpans.ts` JSDoc + T-002 단위 테스트 명세.

---

*Spec 완료 — MOD-GRID-13 G-002 hierarchical merge algorithm specification*
