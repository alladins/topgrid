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
export type TopgridColumnDef<TData = unknown> =
  | (BaseColumnDef & {
      /** 자동 renderer 분기 type — 데이터바운드 10종. AC-001 참조. */
      type: DataColumnType;
      /**
       * column accessor key — **`keyof TData` 강제** (ADR-007 D1, grid-core 1.0).
       * 오타/존재하지 않는 키는 컴파일 타임에 차단된다. `TData=unknown`(레거시 ColumnInfo
       * 경로)이면 `keyof unknown = never` → `string` 폴백(분기 무너짐 방지).
       */
      id: keyof TData extends never ? string : keyof TData & string;
    })
  | (BaseColumnDef & {
      /** selection 컬럼 — accessorKey 없음, id 무시 (AC-006). */
      type: 'checkbox';
      /** checkbox 는 데이터 키가 아닌 임의 id 허용 (예: 'sel'). */
      id: string;
    });

/** 데이터바운드 컬럼 type(=accessorKey 로 셀 값을 읽는 10종). `'checkbox'` 제외 (ADR-007 D1). */
export type DataColumnType = Exclude<TopgridColumnType, 'checkbox'>;

/** {@link TopgridColumnDef} 의 공유 필드(discriminated union base — ADR-007). `id`/`type` 만 분기. */
interface BaseColumnDef {
  /** 표시 헤더명 */
  name: string;
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
 * `any` 없음 (C-4). XX Grid `components` registry 패턴 참조 (L2: R-A).
 *
 * @typeParam TData - 행 데이터 타입
 *
 * @see defaultRendererRegistry
 * @see registerRenderer
 * @see AC-003
 */
export type RendererRegistry<TData = unknown> = Map<TopgridColumnType, RendererFn<TData>>;
