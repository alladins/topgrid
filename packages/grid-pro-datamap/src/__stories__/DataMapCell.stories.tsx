/**
 * DataMapCell — Storybook stories (CSF3, placeholder).
 *
 * Storybook 인프라(@storybook/react-vite)는 MOD-GRID-99-B에서 도입 예정.
 * 본 파일은 CSF3 컨벤션 (Meta default export + named Story exports)만 유지하여
 * 인프라 도입 시 무수정 가용. 타입 import만 — tsc strict 통과 보장.
 *
 * AC-007: DataMapCell Storybook story 1개 (정적 dataMap + 동적 행 단위 시나리오).
 * G-002/MOD-GRID-12 deliverable.
 *
 * @see Spec MOD-GRID-12/G-002 Section 13.4 (AC-007 의무)
 * @see Spec MOD-GRID-12/G-002 Section 10.1 (정적 dataMap 시나리오)
 * @see Spec MOD-GRID-12/G-002 Section 10.2 (동적 행 단위 dataMap 시나리오)
 * @see precedent: packages/grid-renderers/src/__stories__/TextCell.stories.tsx
 */
import { DataMapCell } from '../DataMapCell.js';

const meta = {
  title: 'Pro/DataMapCell',
  component: DataMapCell,
  parameters: { layout: 'centered' },
} as const;

export default meta;

/**
 * 시나리오 1: 정적 dataMap (column-level, F-12-02).
 *
 * statusCode 'ACTIVE' → '활성', 'INACTIVE' → '비활성', 'PENDING' → '대기' 변환.
 * getDisplay 결과 없는 코드 → 원본 값 fallback.
 *
 * @see Spec MOD-GRID-12/G-002 Section 10.1
 * @see Spec MOD-GRID-12/G-002 AC-001
 */
export const StaticDataMap = {
  args: {
    scenario: 'static-datamap',
    description: 'createDataMap({ items: statusItems, valuePath: "code", displayPath: "label" }) + DataMapCell',
    columns: [
      {
        id: 'statusCode',
        header: '상태',
        accessorKey: 'statusCode',
        dataMap: 'statusMap (createDataMap result)',
        cell: 'DataMapCell',
      },
    ],
    data: [
      { id: 1, statusCode: 'ACTIVE' },
      { id: 2, statusCode: 'INACTIVE' },
      { id: 3, statusCode: 'PENDING' },
      { id: 4, statusCode: 'UNKNOWN' },
    ],
    expectedDisplay: ['활성', '비활성', '대기', 'UNKNOWN (fallback)'],
    spec: 'MOD-GRID-12/G-002 Section 10.1 + AC-001',
  },
} as const;

/**
 * 시나리오 2: 행 단위 동적 dataMap (row-level, F-12-03).
 *
 * dept='dev' 행 → devLevelMap (L1='주니어', L2='시니어')
 * dept='biz' 행 → bizLevelMap (M1='매니저', M2='디렉터')
 * 같은 컬럼(levelCode)이 행마다 다른 DataMap 적용.
 *
 * @see Spec MOD-GRID-12/G-002 Section 10.2
 * @see Spec MOD-GRID-12/G-002 AC-002 (함수형 dataMap + row.original 주입)
 */
export const DynamicRowLevelDataMap = {
  args: {
    scenario: 'dynamic-row-level-datamap',
    description: 'column.dataMap = (row: Employee) => row.dept === "dev" ? devLevelMap : bizLevelMap',
    columns: [
      {
        id: 'levelCode',
        header: '직급',
        accessorKey: 'levelCode',
        dataMap: '(row: Employee) => row.dept === "dev" ? devLevelMap : bizLevelMap',
        cell: 'DataMapCell',
      },
    ],
    data: [
      { id: 1, dept: 'dev', levelCode: 'L1' },
      { id: 2, dept: 'dev', levelCode: 'L2' },
      { id: 3, dept: 'biz', levelCode: 'M1' },
      { id: 4, dept: 'biz', levelCode: 'M2' },
    ],
    devLevelMap: [
      { code: 'L1', label: '주니어' },
      { code: 'L2', label: '시니어' },
    ],
    bizLevelMap: [
      { code: 'M1', label: '매니저' },
      { code: 'M2', label: '디렉터' },
    ],
    expectedDisplay: ['주니어', '시니어', '매니저', '디렉터'],
    spec: 'MOD-GRID-12/G-002 Section 10.2 + AC-002',
  },
} as const;
