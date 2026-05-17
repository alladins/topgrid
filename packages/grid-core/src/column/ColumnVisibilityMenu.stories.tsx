/**
 * ColumnVisibilityMenu + useColumnPersistence — Storybook 데모 (MOD-GRID-04 G-003).
 *
 * D5 데모: `<Grid>` 에 `columnPersistence` 를 지정하면 상단에 컬럼 가시성 메뉴가 표시되고,
 * visibility + order 가 localStorage 에 자동 저장/복원된다.
 *
 * @see G-003-spec.md Section 8 D5
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from '../Grid';
import { createColumns } from './createColumns';

// ─── 타입 ─────────────────────────────────────────────────────────────────────

interface Employee {
  empNo: string;
  name: string;
  dept: string;
  position: string;
  basePay: number;
}

// ─── 목 데이터 ────────────────────────────────────────────────────────────────

const EMPLOYEES: Employee[] = [
  { empNo: 'E001', name: '홍길동', dept: '개발팀', position: '대리', basePay: 3_200_000 },
  { empNo: 'E002', name: '김영희', dept: '인사팀', position: '과장', basePay: 4_100_000 },
  { empNo: 'E003', name: '이철수', dept: '회계팀', position: '차장', basePay: 5_000_000 },
  { empNo: 'E004', name: '박민준', dept: '개발팀', position: '사원', basePay: 2_800_000 },
  { empNo: 'E005', name: '최수연', dept: '기획팀', position: '부장', basePay: 5_800_000 },
];

// ─── 컬럼 정의 ────────────────────────────────────────────────────────────────

const columns = createColumns<Employee>([
  { id: 'empNo',    name: '사번',    type: 'text',   align: 'center', width: '80' },
  { id: 'name',     name: '성명',    type: 'text',   align: 'left' },
  { id: 'dept',     name: '부서',    type: 'text',   align: 'left' },
  { id: 'position', name: '직위',    type: 'text',   align: 'center' },
  { id: 'basePay',  name: '기본급', type: 'number', align: 'right', width: '120' },
]);

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Grid> = {
  title: 'MOD-GRID-04/G-003 ColumnPersistence',
  component: Grid,
  parameters: {
    docs: {
      description: {
        component: [
          '## G-003: 컬럼 가시성 + 순서 영속화',
          '',
          '`columnPersistence` prop 을 지정하면:',
          '- 우상단에 `<ColumnVisibilityMenu>` 가 자동 표시됩니다.',
          '- 컬럼 표시/숨김 상태와 순서가 `localStorage` 에 자동 저장/복원됩니다.',
          '- `storageKey: ""` 시 no-op (NFR-006).',
          '- `version` 값을 올리면 이전 저장 항목이 무효화됩니다.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Grid>;

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * 기본 사용 — visibility + order 모두 저장.
 * 우상단 "컬럼" 버튼 클릭 → 컬럼 토글 → 새로고침 후에도 상태 복원.
 */
export const Default: Story = {
  name: '기본 (visibility + order)',
  args: {
    data: EMPLOYEES,
    columns,
    columnPersistence: {
      storageKey: 'storybook-employee-grid-v1',
      version: 1,
    },
  },
};

/**
 * visibility 만 저장 (순서 제외).
 */
export const VisibilityOnly: Story = {
  name: 'visibility만 저장',
  args: {
    data: EMPLOYEES,
    columns,
    columnPersistence: {
      storageKey: 'storybook-employee-grid-vis-only',
      version: 1,
      persist: ['visibility'],
    },
  },
};

/**
 * storageKey 빈 문자열 → no-op (메뉴는 표시, localStorage 미사용).
 */
export const NoOp: Story = {
  name: 'storageKey 빈 문자열 → no-op',
  args: {
    data: EMPLOYEES,
    columns,
    columnPersistence: {
      storageKey: '',
    },
  },
};

/**
 * columnPersistence 미지정 → 메뉴 없음 (backward compat EC-001).
 */
export const NoPersistence: Story = {
  name: 'columnPersistence 미지정 (backward compat)',
  args: {
    data: EMPLOYEES,
    columns,
    // columnPersistence: undefined — 메뉴 미표시
  },
};
