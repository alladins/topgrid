/**
 * @topgrid/grid-core — createColumns TypeScript 컴파일 타입 테스트
 *
 * MOD-GRID-04 G-001: TC-T01~TC-T03
 *
 * 이 파일은 TypeScript 컴파일 통과 여부가 기준 (런타임 실행 X).
 * `npx tsc --noEmit` 으로 검증.
 *
 * @see Section 6 타입 컴파일 테스트
 */

import type { ColumnDef } from '@tanstack/react-table';
import { createColumns } from './createColumns';
import type { TomisColumnDef } from './types';
import type { ColumnInfo } from '../legacy/ColumnInfo';

/** 테스트용 사용자 타입 */
interface User {
  name: string;
  salary: number;
  active: boolean;
}

// TC-T01: TomisColumnDef 타입 안전성 — 컴파일 통과
const defs: TomisColumnDef<User>[] = [
  { id: 'name', type: 'text', name: '이름', align: 'left', width: '100' },
  { id: 'salary', type: 'number', name: '급여', align: 'right', width: '120' },
  { id: 'active', type: 'boolean', name: '활성', align: 'center', width: '80' },
];

// createColumns<User>가 ColumnDef<User>[] 반환 — 컴파일 통과
const cols: ColumnDef<User>[] = createColumns<User>(defs);
// cols 사용 (unused variable 방지)
void cols;

// TC-T02: ColumnInfo 호환 — 컴파일 통과
const legacyDefs: ColumnInfo[] = [
  { id: 'name', type: 'text', align: 'left', name: '이름', width: '100' },
];

// createColumns(ColumnInfo[]) → ColumnDef<unknown>[] — 컴파일 통과
const legacyCols: ColumnDef<unknown>[] = createColumns(legacyDefs);
void legacyCols;

// TC-T03: type에 'any' 없음 — 잘못된 type은 TypeScript 오류 발생
const badDef: TomisColumnDef<User> = {
  id: 'x',
  // @ts-expect-error — 'invalid_type'은 TomisColumnType union에 없음 (C-4 준수 확인)
  type: 'invalid_type',
  name: '잘못된 type',
  align: 'left',
};
void badDef;
