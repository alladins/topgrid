// Runnable consumer reference for the @topgrid React grid — exercises the W3 DX surface:
//  - createColumns([{id,name,type}])  → no raw TanStack ColumnDef / no @tanstack import
//  - getRowId                          → stable identity (no "missing getRowId" dev warning)
//  - toGridCell(cell)                  → read cell data in onCellClick without TanStack types
import { useState } from 'react';
import { Grid, createColumns, toGridCell } from '@topgrid/grid';

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

const data: User[] = [
  { id: 1, name: '김철수', email: 'chulsoo@example.com', age: 30 },
  { id: 2, name: '이영희', email: 'younghee@example.com', age: 28 },
  { id: 3, name: '박민수', email: 'minsoo@example.com', age: 35 },
];

const columns = createColumns<User>([
  { id: 'name', name: '이름', type: 'text' },
  { id: 'email', name: '이메일', type: 'text' },
  { id: 'age', name: '나이', type: 'number', align: 'right' },
]);

export function App(): JSX.Element {
  const [clicked, setClicked] = useState('');
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>topgrid React 예제</h1>
      <Grid<User>
        data={data}
        columns={columns}
        getRowId={(u) => String(u.id)}
        enableSort
        onCellClick={(cell) => {
          const c = toGridCell<User>(cell);
          setClicked(`${c.columnId}=${String(c.value)}`);
        }}
      />
      <p>
        clicked: <span data-clicked>{clicked}</span>
      </p>
    </div>
  );
}
