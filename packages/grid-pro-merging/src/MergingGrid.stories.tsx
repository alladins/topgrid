/**
 * MergingGrid Storybook stories — AC-009, C-25
 *
 * CSF3 placeholder pattern: no @storybook/react runtime dependency.
 * Storybook runtime integration is deferred to MOD-GRID-99-B.
 * Story `args` blocks document API scenarios and serve as living documentation.
 */
import type { MergingColumnDef, MergingGridProps } from './types';

// ---------------------------------------------------------------------------
// Sample data types
// ---------------------------------------------------------------------------

interface EmployeeRow {
  dept: string;
  team: string;
  name: string;
  year: number;
}

const sampleData: EmployeeRow[] = [
  { dept: '개발팀', team: '프론트엔드', name: '김철수', year: 2024 },
  { dept: '개발팀', team: '프론트엔드', name: '이영희', year: 2024 },
  { dept: '개발팀', team: '백엔드', name: '박민준', year: 2024 },
  { dept: '디자인팀', team: 'UX', name: '정수연', year: 2024 },
  { dept: '디자인팀', team: 'UX', name: '최지훈', year: 2024 },
];

// ---------------------------------------------------------------------------
// Story: MergeRowsBoolean
// mergeRows: true — 동일 값(===) 비교로 자동 병합
// dept 컬럼: '개발팀' 3행 병합, '디자인팀' 2행 병합
// ---------------------------------------------------------------------------

const booleanColumns: MergingColumnDef<EmployeeRow>[] = [
  {
    id: 'dept',
    header: '부서',
    accessorKey: 'dept',
    meta: { mergeRows: true }, // 동일 dept 값 자동 병합
  },
  {
    id: 'team',
    header: '팀',
    accessorKey: 'team',
    // meta.mergeRows 미지정 → 병합 없음
  },
  {
    id: 'name',
    header: '이름',
    accessorKey: 'name',
  },
];

const booleanArgs: MergingGridProps<EmployeeRow> = {
  data: sampleData,
  columns: booleanColumns,
  enableMerging: true,
};

/**
 * MergeRowsBoolean: mergeRows: true 선언적 병합 시나리오.
 *
 * dept 컬럼에 mergeRows: true 설정 → 동일 값(===) 연속 행 자동 병합.
 * 예상 결과: '개발팀' 3행 병합, '디자인팀' 2행 병합.
 */
export const MergeRowsBoolean = {
  args: booleanArgs,
};

// ---------------------------------------------------------------------------
// Story: MergeRowsCompareFn
// mergeRows: 커스텀 비교 함수 — dept + year 모두 동일할 때만 병합
// ---------------------------------------------------------------------------

const compareFnColumns: MergingColumnDef<EmployeeRow>[] = [
  {
    id: 'dept',
    header: '부서',
    accessorKey: 'dept',
    meta: {
      // 부서 + 연도가 모두 같을 때만 병합 (복합 조건)
      mergeRows: (prev: EmployeeRow, curr: EmployeeRow) =>
        prev.dept === curr.dept && prev.year === curr.year,
    },
  },
  {
    id: 'team',
    header: '팀',
    accessorKey: 'team',
  },
  {
    id: 'name',
    header: '이름',
    accessorKey: 'name',
  },
  {
    id: 'year',
    header: '연도',
    accessorKey: 'year',
  },
];

const compareFnArgs: MergingGridProps<EmployeeRow> = {
  data: sampleData,
  columns: compareFnColumns,
  enableMerging: true,
};

/**
 * MergeRowsCompareFn: 커스텀 비교 함수 병합 시나리오.
 *
 * dept 컬럼에 mergeRows: (a, b) => a.dept === b.dept && a.year === b.year 설정.
 * dept와 year가 모두 동일한 연속 행만 병합.
 * 예상 결과: 동일 부서 + 동일 연도 행 병합.
 */
export const MergeRowsCompareFn = {
  args: compareFnArgs,
};

// ---------------------------------------------------------------------------
// Story: HierarchicalMerge
// AC-001: dept(좌) → team(우) 계층 병합 — dept 경계 시 team 강제 경계
// AC-005: 1000+ 행 데이터로 O(N×C) 성능 시연 (react-virtual 통합 없음 — G-003 범위, W-2)
// ---------------------------------------------------------------------------

// 1000+ 행 샘플 데이터 생성 (dept 10개 × team 3개 × 33~35행)
const depts = [
  '개발팀', '디자인팀', '마케팅팀', '영업팀', '인사팀',
  '재무팀', '운영팀', '고객팀', '법무팀', '전략팀',
];
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
    meta: { mergeRows: true }, // 좌측 — 높은 우선순위 (ADR-MOD-GRID-13-007)
  },
  {
    id: 'team',
    header: '팀',
    accessorKey: 'team',
    meta: { mergeRows: true }, // 우측 — dept 경계에 종속 (ancestorBoundary 전파)
  },
  {
    id: 'name',
    header: '이름',
    accessorKey: 'name',
    // mergeRows 미지정 → 병합 없음
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

// ---------------------------------------------------------------------------
// Story: SortAndRecompute
// AC-001: 정렬 변경 시 computeMergeSpans 재실행
// AC-002: enableVirtualization=true + react-virtual 통합
// AC-006: 1000행+ 가상화 + 정렬 인터랙션
// C-18: position:absolute 미사용, flow 레이아웃 spacer
// G-002 deferred AC-005 C-18 sub-clause 충족 증거
// ---------------------------------------------------------------------------

const sortableColumns: MergingColumnDef<EmployeeRow>[] = [
  {
    id: 'dept',
    header: '부서',
    accessorKey: 'dept',
    meta: { mergeRows: true },
    enableSorting: true, // TanStack 정렬 활성화
  },
  {
    id: 'team',
    header: '팀',
    accessorKey: 'team',
    meta: { mergeRows: true },
    enableSorting: true,
  },
  {
    id: 'name',
    header: '이름',
    accessorKey: 'name',
  },
];

const sortAndRecomputeArgs: MergingGridProps<EmployeeRow> = {
  data: largeData, // G-002에서 생성한 1000행+ 데이터 재사용
  columns: sortableColumns,
  enableMerging: true,
  enableVirtualization: true, // C-18 가상화 활성화
  estimatedRowHeight: 40,
  virtualOverscan: 10,
};

/**
 * SortAndRecompute: 정렬 변경 + 병합 자동 재계산 + 가상화 시나리오.
 *
 * AC-001: 정렬 변경 시 computeMergeSpans 재실행 (useMemo dep = rows 참조 변경).
 * AC-002: enableVirtualization=true + @tanstack/react-virtual 통합.
 * AC-006: 1000행+ 데이터 가상화 + 정렬 인터랙션.
 * C-18: position:absolute 미사용, flow 레이아웃 spacer (상단/하단 tr).
 *
 * G-002 deferred AC-005 C-18 sub-clause 충족 증거.
 *
 * ⚠️ Known Limitation (L-01): rowSpan 시작 행이 visible window 밖으로
 * 스크롤되면 병합이 truncate됩니다. virtualOverscan 값을 높이면 완화 가능.
 */
export const SortAndRecompute = {
  args: sortAndRecomputeArgs,
};

// ---------------------------------------------------------------------------
// Story default export (CSF3 meta — type-only, no @storybook/react runtime)
// ---------------------------------------------------------------------------

export default {
  title: 'Pro/MergingGrid',
  component: 'MergingGrid', // string reference — avoids @storybook/react runtime import
  parameters: {
    docs: {
      description: {
        component:
          '셀 병합(rowSpan) Pro 컴포넌트. `meta.mergeRows` 설정으로 컬럼 단위 병합 제어.',
      },
    },
  },
};
