/**
 * @topgrid/grid-core — Column type definitions.
 *
 * MOD-GRID-04 G-001: createColumns + type 자동 renderer 분기.
 *
 * @see createColumns
 * @see rendererRegistry
 */

import type { CellContext } from '@tanstack/react-table';
import type { ReactNode } from 'react';

/**
 * 11종 자동 renderer 분기 type union.
 *
 * `createColumns()` 가 이 type으로 rendererRegistry를 조회하여
 * 적절한 cell 렌더러를 선택한다.
 *
 * - `'checkbox'`: DisplayColumnDef 전용 처리 (accessorKey 없음, enableSorting 강제 false)
 * - `'number'`: 숫자 포맷터 적용 (MOD-GRID-05 주입 예정, placeholder)
 * - `'boolean'`: Y/N 표시
 * - `'dateTime'`: 날짜+시간 포맷터 (MOD-GRID-05 주입 예정, placeholder)
 * - `'date'`: 날짜 포맷터 (MOD-GRID-05 pending → placeholder)
 * - `'text'`: plain text (기본)
 * - `'badge'`: Badge 컴포넌트 (MOD-GRID-05 pending → placeholder)
 * - `'link'`: Link 컴포넌트 (MOD-GRID-05 pending → placeholder)
 * - `'icon'`: Icon 컴포넌트 (MOD-GRID-05 pending → placeholder, D5)
 * - `'tag'`: TagCell (ADR-002+018 wired — readonly string[]).
 * - `'progress'`: ProgressCell (ADR-002+018 wired — number|null|undefined).
 *
 * @see TopgridColumnDef
 * @see createColumns
 * @see AC-001
 */
export type TopgridColumnType =
  | 'checkbox'
  | 'number'
  | 'boolean'
  | 'dateTime'
  | 'date'
  | 'text'
  | 'badge'
  | 'link'
  | 'icon'
  | 'tag'
  | 'progress';

/**
 * 표준 column 정의. TanStack `ColumnDef<TData>` 생성을 위한 입력 타입.
 *
 * `type` 필드로 자동 renderer 분기. `createColumns<TData>(defs)` 소비용.
 *
 * @typeParam TData - 행 데이터 타입
 *
 * @example
 * ```typescript
 * const defs: TopgridColumnDef<User>[] = [
 *   { id: 'name', name: '이름', type: 'text', align: 'left', width: '150' },
 *   { id: 'salary', name: '급여', type: 'number', align: 'right', width: '120' },
 *   { id: 'sel', name: '', type: 'checkbox', align: 'center', width: '50' },
 * ];
 * const columns = createColumns<User>(defs);
 * ```
 *
 * @see createColumns
 * @see TopgridColumnType
 * @see AC-001, AC-002
 */
export interface TopgridColumnDef<TData = unknown> {
  /**
   * column accessor key (TData 키와 일치). `'checkbox'` type은 무시됨 (AC-006).
   *
   * 타입 파라미터 `TData`는 `createColumns<TData>(defs: TopgridColumnDef<TData>[])` 에서
   * accessor key 타입 안전성을 위해 바인딩됨 (`keyof TData & string`).
   */
  id: keyof TData extends never ? string : (keyof TData & string) | string;
  /** 표시 헤더명 */
  name: string;
  /** 자동 renderer 분기 type. AC-001 참조. */
  type: TopgridColumnType;
  /** 정렬 방향 — Tailwind class에 반영. 미제공 시 'left' 기본 (W3 DX: 필수→옵셔널). */
  align?: 'left' | 'center' | 'right';
  /** 픽셀 단위 너비 문자열 ('100', '200px' 등). 미제공 시 '100' 기본. */
  width?: string;
  /** false이면 column 숨김. 기본 true. EC-05, OQ-01 참조. */
  visibility?: boolean;
  /** 정렬 활성화 여부. `'checkbox'`는 강제 false. 기본 true. EC-08 참조. */
  enableSorting?: boolean;
  /** 크기 조절 활성화 여부. `'checkbox'`는 강제 false. 기본 true. */
  enableResizing?: boolean;
  /** 추가 메타데이터 (C-29: optional prop — spread skip 패턴 적용). */
  meta?: {
    /** primary key column 여부 */
    primary?: boolean;
    /** 임의 확장용 */
    [key: string]: unknown;
  };
  /** ColumnInfo 호환: 'primary' 포함 여부로 meta.primary 설정. EC-09 참조. */
  etc?: string;
}

/**
 * cell renderer 함수 타입.
 *
 * TanStack `CellContext<TData, unknown>`을 받아 `ReactNode` 반환.
 * `any` 없음 (C-4) — TValue=unknown 사용.
 *
 * @typeParam TData - 행 데이터 타입
 *
 * @see rendererRegistry
 * @see AC-003
 */
export type RendererFn<TData = unknown> = (
  info: CellContext<TData, unknown>,
) => ReactNode;

/**
 * type → RendererFn 매핑 타입.
 *
 * `Map<TopgridColumnType, RendererFn<TData>>` 기반.
 * `any` 없음 (C-4). AG Grid `components` registry 패턴 참조 (L2: R-A).
 *
 * @typeParam TData - 행 데이터 타입
 *
 * @see defaultRendererRegistry
 * @see registerRenderer
 * @see AC-003
 */
export type RendererRegistry<TData = unknown> = Map<TopgridColumnType, RendererFn<TData>>;
