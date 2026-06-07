// MOD-GRID-50 — full-row editing (Track 2 제품결정 1번째). ★behavior-gated, non-vacuous:
//  진입 시 한 행의 ≥2 셀이 동시에 에디터가 되고, 저장=둘 다 한 번에 적용, 취소=둘 다 원복(부분 커밋 없음),
//  다른 행은 view 모드 유지. "input 나타남"식 vacuous 금지. C-3 예외: mock 데이터.
//
// ★cell 컴포넌트 안정성: 컬럼은 useMemo([])로 한 번만 생성하고 셀은 editRef.current 로 라이브 API 를
//   읽는다. 컬럼/셀을 매 렌더 재생성하면 TanStack flexRender 가 새 컴포넌트 타입으로 createElement →
//   setDraftCell 마다 셀 remount(포커스/draft 유실). 안정 식별자로 EditableCell 이 remount 없이 유지된다.
import { useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import { Grid, useFullRowEdit, type FullRowEditApi } from '@topgrid/grid-core';
import { EditableCell } from '@topgrid/grid-renderers';

interface Row {
  id: string;
  name: string;
  score: string;
}

function FullRowEditDemo(): JSX.Element {
  const [rows, setRows] = useState<Row[]>([
    { id: '1', name: 'Alice', score: '10' },
    { id: '2', name: 'Bob', score: '20' },
  ]);

  const edit = useFullRowEdit<Row>({
    getRowId: (r) => r.id,
    onRowEdit: (id, next) => setRows((rs) => rs.map((r) => (r.id === id ? next : r))),
  });

  // 라이브 API 미러 — 안정 셀이 항상 최신 edit 을 읽도록.
  const editRef = useRef<FullRowEditApi<Row>>(edit);
  editRef.current = edit;

  const columns = useMemo<ColumnDef<Row>[]>(() => {
    const editableCell = (field: 'name' | 'score') => (ctx: CellContext<Row, unknown>) => {
      const e = editRef.current;
      const r = ctx.row.original;
      if (!e.isRowEditing(r)) return <span data-view-cell={field}>{r[field]}</span>;
      return (
        <EditableCell
          value={e.getDraftValue(field, r[field])}
          editType="text"
          isEditing
          onStartEdit={() => {}}
          onCommit={(v) => e.setDraftCell(field, v)}
          onCancel={() => e.cancelRow()}
        />
      );
    };
    return [
      { accessorKey: 'name', header: '이름', cell: editableCell('name'), size: 160 },
      { accessorKey: 'score', header: '점수', cell: editableCell('score'), size: 120 },
      {
        id: 'actions',
        header: '',
        size: 140,
        cell: (ctx: CellContext<Row, unknown>) => {
          const e = editRef.current;
          const r = ctx.row.original;
          return e.isRowEditing(r) ? (
            <span style={{ display: 'inline-flex', gap: 4 }}>
              <button type="button" data-action="save" onClick={() => e.commitRow(r)}>
                저장
              </button>
              <button type="button" data-action="cancel" onClick={() => e.cancelRow()}>
                취소
              </button>
            </span>
          ) : (
            <button type="button" data-action="edit" onClick={() => e.startRowEdit(r)}>
              편집
            </button>
          );
        },
      },
    ];
  }, []);

  return <Grid<Row> columns={columns} data={rows} getRowId={(r) => r.id} />;
}

const meta: Meta = { title: 'grid-core/Grid (Full Row Edit)' };
export default meta;

export const Default: StoryObj = {
  name: '행 단위 편집',
  render: () => <FullRowEditDemo />,
};
