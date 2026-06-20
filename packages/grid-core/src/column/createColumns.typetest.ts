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
import type { TopgridColumnDef } from './types';
import type { ColumnInfo } from '../legacy/ColumnInfo';

/** 테스트용 사용자 타입 */
interface User {
  name: string;
  salary: number;
  active: boolean;
}

// TC-T01: TopgridColumnDef 타입 안전성 — 컴파일 통과
const defs: TopgridColumnDef<User>[] = [
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
const badDef: TopgridColumnDef<User> = {
  id: 'name',
  // @ts-expect-error — 'invalid_type'은 TopgridColumnType union에 없음 (C-4 준수 확인)
  type: 'invalid_type',
  name: '잘못된 type',
  align: 'left',
};
void badDef;

// TC-T04 (ADR-007 D1): 데이터바운드 컬럼 id 는 keyof TData 강제 — 오타/비존재 키는 컴파일 에러
const typoKeyDef: TopgridColumnDef<User> = {
  type: 'text',
  // @ts-expect-error — 'naem'은 User 키가 아님 (ADR-007: 데이터바운드 id=keyof TData 강제). 0.x 에선 통과했음.
  id: 'naem',
  name: '오타 키',
};
void typoKeyDef;

// TC-T05 (ADR-007 D1): checkbox(selection) 컬럼은 데이터 키 아닌 임의 id 허용 (AC-006 = id 무시)
const selectionDef: TopgridColumnDef<User> = {
  type: 'checkbox',
  id: 'sel', // User 키 아님 — checkbox 분기는 임의 string 허용 (에러 없음)
  name: '',
};
void selectionDef;
