/**
 * @tomis/grid-core — Legacy ColumnInfo alias.
 *
 * MOD-GRID-04 G-001: DataTable `ColumnInfo` 호환 alias.
 *
 * `tw-framework-front/src/components/DataTable/data-table-types.ts`의
 * `ColumnInfo`와 동일 shape. `createColumns()` 가 이 타입도 수용함 (AC-005).
 *
 * @see createColumns
 * @see TomisColumnDef
 * @see AC-005, D3
 */

/**
 * DataTable 호환 ColumnInfo 인터페이스.
 *
 * `tw-framework-front/src/components/DataTable/data-table-types.ts`와 동일 shape.
 * 신규 코드에서는 `TomisColumnDef<TData>` 사용 권장.
 *
 * `createColumns()` 가 `ColumnInfo[]` 입력 시 내부에서 `TomisColumnDef`로 narrowing:
 * - `type` 필드가 9종 `TomisColumnType` union 중 하나이면 그대로 사용
 * - 그 외 string이면 `'text'` fallback (EC-04)
 *
 * @deprecated 신규 코드에서는 `TomisColumnDef<TData>` 사용 권장.
 *
 * @example
 * ```typescript
 * import type { ColumnInfo } from '@tomis/grid-core/legacy';
 * import { createColumns } from '@tomis/grid-core';
 *
 * const legacyDefs: ColumnInfo[] = [
 *   { id: 'name', type: 'text', align: 'left', name: '이름', width: '100' },
 * ];
 * const columns = createColumns(legacyDefs); // ColumnDef<unknown>[]
 * ```
 *
 * @see createColumns
 * @see TomisColumnDef
 */
export interface ColumnInfo {
  /** column accessor key */
  id: string;
  /**
   * column 타입 (string — union 아님).
   * `createColumns` 내부에서 `TomisColumnType` union으로 narrowing.
   * 9종 외 값은 'text' fallback (EC-04).
   */
  type: string;
  /** 정렬 방향 (string — 'left'|'center'|'right' 권장) */
  align: string;
  /** 표시 헤더명 */
  name: string;
  /** 픽셀 단위 너비 문자열 ('100', '200' 등) */
  width: string;
  /** false이면 column 숨김. 기본 true. */
  visibility?: boolean;
  /** ColumnInfo 호환: 'primary' 포함 여부로 meta.primary 설정. EC-09 참조. */
  etc?: string;
}
