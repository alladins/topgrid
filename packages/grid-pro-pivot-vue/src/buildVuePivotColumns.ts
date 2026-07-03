/**
 * @topgrid/grid-pro-pivot-vue — pivot → @tanstack/vue-table ColumnDef 빌더
 *
 * {@link PivotModel} 을 vue-table 컬럼으로 매핑한다(React buildPivotColumns 의 Vue 대응):
 *   - 행 차원 → 선행 컬럼(config.rows 당 1개, 합성 행 라벨 포함),
 *   - 열 차원 → 중첩 columns(다단 헤더),
 *   - 값 셀 → `<colComboKey>__<valueIndex>` 키 leaf 컬럼,
 *   - 후행 grand-total 컬럼 그룹.
 *
 * ★v1: 헤더=plain 문자열, 셀=formatCellValue(문자열) — 프레임워크 중립. 정렬/collapse 인터랙티브
 * 어포던스(React 판의 JSX 버튼)는 미포함 — 필요 시 소비자가 컴포저블 + sortPivotRows/collapsePivotRows
 * 로 배선한다. 컬럼 **구조** 로직만 재현(순수).
 */
import type { ColumnDef } from '@tanstack/table-core';
import { GRAND_TOTAL_COLUMN_KEY } from '@topgrid/grid-pro-pivot-core';
import type { PivotColumnNode, PivotConfig, PivotModel, PivotRow } from '@topgrid/grid-pro-pivot-core';

/** 숫자 셀 포맷; null/undefined → em-dash. */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
}

function rowKindLabel(row: PivotRow, firstRowField: string | undefined): string {
  if (row.__kind === 'grandTotal') return 'Grand Total';
  if (row.__kind === 'subtotal') {
    const dimValue = firstRowField !== undefined ? row[firstRowField] : undefined;
    return `${dimValue ?? ''} Total`;
  }
  return '';
}

function valueLeafColumn(comboKey: string, valueIndex: number, header: string): ColumnDef<PivotRow> {
  const accessorKey = `${comboKey}__${valueIndex}`;
  return {
    id: accessorKey,
    header,
    accessorFn: (row) => row[accessorKey] ?? null,
    cell: (ctx) => formatCellValue(ctx.getValue()),
  };
}

function mapColumnNode(node: PivotColumnNode, valueDefs: PivotConfig['values']): ColumnDef<PivotRow> {
  if (node.children && node.children.length > 0) {
    return {
      id: `grp:${node.key}`,
      header: node.value,
      columns: node.children.map((child) => mapColumnNode(child, valueDefs)),
    };
  }
  if (valueDefs.length === 1) {
    return valueLeafColumn(node.key, 0, node.value);
  }
  return {
    id: `grp:${node.key}`,
    header: node.value,
    columns: valueDefs.map((vd, i) => valueLeafColumn(node.key, i, vd.label ?? vd.field)),
  };
}

/**
 * pivot 모델에서 vue-table 컬럼 집합을 만든다.
 * @param model - 헤드리스 피벗 모델.
 * @returns 선언적 `ColumnDef<PivotRow>[]`(선행 행차원 + 중첩 값 그룹 + grand-total 그룹).
 */
export function buildVuePivotColumns(model: PivotModel): ColumnDef<PivotRow>[] {
  const { config, columnTree } = model;
  const rowFields = config.rows;
  const valueDefs = config.values;
  const firstRowField = rowFields[0];
  const out: ColumnDef<PivotRow>[] = [];

  // 선행 행차원 컬럼
  rowFields.forEach((field, depth) => {
    out.push({
      id: `dim:${field}`,
      header: field,
      accessorFn: (row) => row[field] ?? null,
      cell: (ctx) => {
        const row = ctx.row.original;
        if (row.__kind === 'grandTotal') return depth === 0 ? rowKindLabel(row, firstRowField) : '';
        if (row.__kind === 'subtotal') {
          if (depth !== row.__depth) return '';
          return rowKindLabel(row, firstRowField);
        }
        return formatCellValue(ctx.getValue());
      },
    });
  });

  // 열차원 값 그룹(중첩 헤더)
  if (columnTree.length > 0) {
    for (const node of columnTree) out.push(mapColumnNode(node, valueDefs));
  } else if (valueDefs.length === 1) {
    out.push(valueLeafColumn('', 0, valueDefs[0]!.label ?? valueDefs[0]!.field));
  } else {
    out.push({
      id: 'grp:values',
      header: 'Values',
      columns: valueDefs.map((vd, i) => valueLeafColumn('', i, vd.label ?? vd.field)),
    });
  }

  // 후행 grand-total 컬럼 그룹
  if (valueDefs.length === 1) {
    out.push(valueLeafColumn(GRAND_TOTAL_COLUMN_KEY, 0, 'Total'));
  } else {
    out.push({
      id: 'grp:grandTotal',
      header: 'Total',
      columns: valueDefs.map((vd, i) => valueLeafColumn(GRAND_TOTAL_COLUMN_KEY, i, vd.label ?? vd.field)),
    });
  }

  return out;
}
