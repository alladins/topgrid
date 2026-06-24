/**
 * MOD-GRID-57 — auto group column factory.
 *
 * XX Grid `autoGroupColumnDef` 대응: 트리/그룹 데이터(`enableExpanding` + `getSubRows`)에서 단일
 * 컬럼이 **깊이 들여쓰기 + 펼침/접기 토글 + 그룹/노드 값**을 한 번에 렌더한다. 소비자가 직접 expand
 * 토글 컬럼을 만들 필요 없이 columns 좌측에 prepend 하면 된다.
 *
 * 순수 데이터-모델(MOD-48 buildTreeFromPaths/getSubRows)의 렌더 절반 — getDataPath 가 🟡 였던 이유
 * (auto group column 렌더 부재)를 닫는다.
 *
 * @example
 * const columns = [createAutoGroupColumn<Node>({ getValue: (n) => n.name }), ...dataColumns];
 * <Grid data={roots} columns={columns} enableExpanding getSubRows={(n) => n.children} />
 */
import type { ColumnDef, Row } from '@tanstack/react-table';
import type { ReactNode } from 'react';

/** Options for {@link createAutoGroupColumn}. */
export interface AutoGroupColumnOptions<TData> {
  /** Header content (default `'Group'`). */
  header?: ReactNode;
  /** Render the node's display value (default: nothing). */
  getValue?: (original: TData, row: Row<TData>) => ReactNode;
  /** Pixels of indent per depth level (default `16`). */
  indentUnit?: number;
  /** Column width (default `240`). */
  size?: number;
}

/**
 * Build a ready-made auto group column: indent-by-depth + expand/collapse chevron (only on
 * expandable rows) + the node value. Sorting/filtering disabled.
 */
export function createAutoGroupColumn<TData>(
  options: AutoGroupColumnOptions<TData> = {},
): ColumnDef<TData, unknown> {
  const { header = 'Group', getValue, indentUnit = 16, size = 240 } = options;
  return {
    id: '__autoGroup__',
    header: () => header,
    enableSorting: false,
    enableColumnFilter: false,
    size,
    cell: ({ row }: { row: Row<TData> }) => (
      <span
        style={{ paddingLeft: row.depth * indentUnit, display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        {row.getCanExpand() ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
            aria-label={row.getIsExpanded() ? 'collapse group' : 'expand group'}
            aria-expanded={row.getIsExpanded()}
            data-expand-toggle=""
            style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, font: 'inherit' }}
          >
            {row.getIsExpanded() ? '▼' : '▶'}
          </button>
        ) : (
          <span aria-hidden="true" style={{ display: 'inline-block', width: 12 }} />
        )}
        <span data-auto-group-value="">{getValue ? getValue(row.original, row) : null}</span>
      </span>
    ),
  };
}
