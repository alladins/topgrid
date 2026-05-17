/**
 * MOD-GRID-04 G-002: createGroupedColumns unit tests (TC-01 ~ TC-06).
 *
 * A-07 의무: 이 테스트 파일은 Vitest(vitest run)로 실행. typetest-only 금지.
 */

import { describe, it, expect } from 'vitest';
import type { ColumnDef } from '@tanstack/react-table';
import { createGroupedColumns } from './createGroupedColumns';
import type { TomisColumnGroup } from './createGroupedColumns';

// ── 공통 리프 컬럼 픽스처 ──────────────────────────────────────────────────

/** TC-02, TC-04에서 참조 동등성 / deep-equal 검증에 사용 */
const leafCols: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'empNo',   header: '사번' },
  { accessorKey: 'name',    header: '성명' },
];

const payrollLeafCols: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'basePay',  header: '기본급' },
  { accessorKey: 'bonus',    header: '상여' },
  { accessorKey: 'totalPay', header: '합계' },
];

// ── TC-01 ──────────────────────────────────────────────────────────────────

describe('TC-01: single group with empty columns array', () => {
  it('returns array of length 1, header correct, columns empty', () => {
    type Row = Record<string, unknown>;
    const group: TomisColumnGroup<Row> = { header: '기본 정보', columns: [] };
    const result = createGroupedColumns<Row>(group);

    expect(result).toHaveLength(1);

    // TanStack GroupColumnDef has `header` and `columns` fields
    const g = result[0] as TomisColumnGroup<Row>;
    expect(g.header).toBe('기본 정보');
    expect(g.columns).toHaveLength(0);
  });
});

// ── TC-02 ──────────────────────────────────────────────────────────────────

describe('TC-02: columns reference equality', () => {
  it('result[0].columns is the same reference as the input columns array', () => {
    type Row = Record<string, unknown>;
    const group: TomisColumnGroup<Row> = { header: '기본 정보', columns: leafCols };
    const result = createGroupedColumns<Row>(group);

    const g = result[0] as TomisColumnGroup<Row>;
    // thin wrapper (D1): 내부 변환 없음 → same reference
    expect(g.columns).toBe(leafCols);
  });
});

// ── TC-03 ──────────────────────────────────────────────────────────────────

describe('TC-03: two groups → length 2', () => {
  it('returns array of length 2 for two rest args', () => {
    type Row = Record<string, unknown>;
    const g1: TomisColumnGroup<Row> = { header: '기본 정보', columns: leafCols };
    const g2: TomisColumnGroup<Row> = { header: '급여 내역', columns: payrollLeafCols };
    const result = createGroupedColumns<Row>(g1, g2);

    expect(result).toHaveLength(2);
  });
});

// ── TC-04 ──────────────────────────────────────────────────────────────────

describe('TC-04: deep-equal fixture matching GroupedHeaderGrid.tsx L166-184 pattern', () => {
  it('output deep-equals the literal ColumnDef[] structure used in GroupedHeaderGrid', () => {
    type Row = Record<string, unknown>;

    // GroupedHeaderGrid.tsx L166-184 pattern (D4 호환성 기준)
    const expected: ColumnDef<Row>[] = [
      {
        header: '기본 정보',
        columns: [
          { accessorKey: 'empNo', header: '사번' },
          { accessorKey: 'name',  header: '성명' },
        ],
      },
      {
        header: '급여 내역',
        columns: [
          { accessorKey: 'basePay',  header: '기본급' },
          { accessorKey: 'bonus',    header: '상여' },
          { accessorKey: 'totalPay', header: '합계' },
        ],
      },
    ];

    const result = createGroupedColumns<Row>(
      {
        header: '기본 정보',
        columns: [
          { accessorKey: 'empNo', header: '사번' },
          { accessorKey: 'name',  header: '성명' },
        ],
      },
      {
        header: '급여 내역',
        columns: [
          { accessorKey: 'basePay',  header: '기본급' },
          { accessorKey: 'bonus',    header: '상여' },
          { accessorKey: 'totalPay', header: '합계' },
        ],
      },
    );

    expect(result).toEqual(expected);
  });
});

// ── TC-05 ──────────────────────────────────────────────────────────────────

describe('TC-05: empty string header passes through', () => {
  it('empty string header is preserved as-is', () => {
    type Row = Record<string, unknown>;
    const group: TomisColumnGroup<Row> = { header: '', columns: [] };
    const result = createGroupedColumns<Row>(group);

    const g = result[0] as TomisColumnGroup<Row>;
    expect(g.header).toBe('');
  });
});

// ── TC-06 ──────────────────────────────────────────────────────────────────

describe('TC-06: N=5 rest args → length 5, order preserved', () => {
  it('returns array of length 5 with groups in input order', () => {
    type Row = Record<string, unknown>;

    const headers = ['A', 'B', 'C', 'D', 'E'];
    const groups: Array<TomisColumnGroup<Row>> = headers.map((h) => ({
      header: h,
      columns: [],
    }));

    const result = createGroupedColumns<Row>(...groups);

    expect(result).toHaveLength(5);
    headers.forEach((h, i) => {
      const g = result[i] as TomisColumnGroup<Row>;
      expect(g.header).toBe(h);
    });
  });
});
