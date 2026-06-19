/**
 * @topgrid/grid-core — createColumns factory.
 *
 * MOD-GRID-04 G-001: `createColumns<TData>(defs)` 핵심 공개 API.
 *
 * `TopgridColumnDef<TData>[] | ColumnInfo[]`를 받아 `ColumnDef<TData>[]` 반환.
 * TanStack `useReactTable({ columns })` 에 직접 주입 가능.
 *
 * @see TopgridColumnDef
 * @see rendererRegistry
 * @see AC-002, AC-003, AC-005, AC-006, AC-007, AC-008
 */

import type { ColumnDef, CellContext } from '@tanstack/react-table';
import type { TopgridColumnDef, RendererRegistry } from './types';
import type { ColumnInfo } from '../legacy/ColumnInfo';
import { defaultRendererRegistry } from './rendererRegistry';
import { visibilityNoOpColumnIds, visibilityNoOpWarning } from '../internal/devWarnings';

/**
 * ColumnInfo와 TopgridColumnDef는 런타임 구조가 동일하다 (G-001 hotfix 2026-05-14).
 *
 * 두 인터페이스 모두 `id`/`name`/`type`/`align`/`width?` 형태 — 런타임 heuristic으로
 * 구분 불가능. TopgridColumnDef.etc 필드를 옵셔널로 보유하므로 ColumnInfo의 etc:'primary'
 * 패턴도 동일 코드 경로에서 처리 가능. 미등록 type은 registry fallback + console.warn
 * 으로 처리(AC-007, EC-02, TC-06). 별도 narrowing 없이 단일 경로 사용.
 *
 * 이전 isColumnInfo()/normalizeColumnInfo() heuristic은 동일 shape의 TopgridColumnDef를
 * ColumnInfo로 오분류하여 미등록 type을 'text'로 silently coerce하던 결함을 제거.
 *
 * @see TC-06
 * @see AC-005
 */

/**
 * `TopgridColumnDef<TData>[] | ColumnInfo[]` 를 받아 `ColumnDef<TData>[]` 반환.
 *
 * - `type` 필드 기반 자동 renderer 분기 (rendererRegistry 조회, AC-003)
 * - `'checkbox'` type → DisplayColumnDef (accessorKey 없음, enableSorting 강제 false, AC-006)
 * - registry 미등록 type → plain text fallback + console.warn (AC-007, D1)
 * - `ColumnInfo[]` 입력 시 내부에서 `TopgridColumnDef`로 narrowing (AC-005, D3)
 * - `width`, `enableSorting`, `enableResizing`, `meta` 표준 매핑 (AC-008)
 *
 * @typeParam TData - 행 데이터 타입
 * @param defs - column 정의 배열. `TopgridColumnDef<TData>[]` 또는 `ColumnInfo[]`.
 * @returns TanStack `ColumnDef<TData>[]` — `useReactTable({ columns })` 에 직접 주입 가능.
 *
 * @example
 * ```typescript
 * // TopgridColumnDef 직접 사용 (권장)
 * const defs: TopgridColumnDef<User>[] = [
 *   { id: 'name', name: '이름', type: 'text', align: 'left', width: '150' },
 *   { id: 'salary', name: '급여', type: 'number', align: 'right', width: '120' },
 *   { id: 'sel', name: '', type: 'checkbox', align: 'center', width: '50' },
 * ];
 * const columns = createColumns<User>(defs);
 *
 * // 기존 ColumnInfo[] 호환 (AC-005)
 * const legacyDefs: ColumnInfo[] = [...];
 * const columns = createColumns(legacyDefs);
 * ```
 *
 * @see TopgridColumnDef
 * @see ColumnInfo
 * @see defaultRendererRegistry
 * @see AC-002, AC-003, AC-005, AC-006, AC-007, AC-008
 */
export function createColumns<TData = unknown>(
  defs: TopgridColumnDef<TData>[] | ColumnInfo[],
): ColumnDef<TData>[] {
  // F-E (W3-3): visibility:false is silently ignored here — warn so it isn't mistaken for working.
  for (const id of visibilityNoOpColumnIds(defs as ReadonlyArray<{ id?: string; visibility?: boolean }>)) {
    console.warn(visibilityNoOpWarning(id));
  }
  return defs.map((raw) => {
    // AC-005 hotfix (2026-05-14): ColumnInfo와 TopgridColumnDef 구조 동일 — 단일 경로 처리.
    // 미등록 type은 registry fallback + warn으로 처리 (TC-06, EC-02).
    const def = raw as TopgridColumnDef<TData>;

    const baseWidth = parseInt((def.width ?? '100').trim(), 10);
    const isCheckbox = def.type === 'checkbox';

    // EC-06: checkbox에 accessorKey 제공 시 경고
    if (isCheckbox && def.id) {
      const rawDef = raw as unknown as Record<string, unknown>;
      if ('accessorKey' in rawDef) {
        console.warn(
          `[createColumns] 'checkbox' type column "${def.id}": accessorKey is ignored. DisplayColumnDef 강제 (AC-006).`,
        );
      }
    }

    // meta 조합 (C-29 exactOptionalPropertyTypes — spread skip 패턴)
    const primaryFlag =
      (def.meta?.primary ?? def.etc?.toLowerCase().includes('primary')) === true;
    const metaValue: { primary: boolean; align: 'left' | 'center' | 'right'; [key: string]: unknown } = {
      primary: primaryFlag,
      align: def.align,
    };

    // checkbox → DisplayColumnDef (AC-006, D5, EC-08)
    if (isCheckbox) {
      const checkboxDef: ColumnDef<TData> = {
        id: def.id,
        header: () => null, // placeholder — MOD-GRID-05 CheckboxCell
        cell: () => null,   // placeholder — MOD-GRID-05 CheckboxCell
        enableSorting: false,   // EC-08: enableSorting 강제 false
        enableResizing: false,
        size: baseWidth,
        meta: metaValue,
      };
      return checkboxDef;
    }

    // renderer 조회 — Map.get() 사용, any 없음 (AC-003, C-4)
    const registry = defaultRendererRegistry as RendererRegistry<TData>;
    const renderFn = registry.get(def.type);

    if (renderFn === undefined) {
      // EC-02: 미등록 type → fallback + console.warn
      console.warn(
        `[createColumns] Unknown type: "${def.type}" for column "${def.id}". Falling back to plain text (AC-007).`,
      );
    }

    // accessorKey — TData의 키로 캐스팅 (C-4: unknown 경유)
    const accessorKey = def.id as unknown as keyof TData & string;

    const columnDef: ColumnDef<TData> = {
      accessorKey,
      header: def.name,
      // AC-007: renderFn 있으면 registry renderer, 없으면 undefined(TanStack 기본 cell)
      ...(renderFn !== undefined && {
        cell: (info: CellContext<TData, unknown>) => renderFn(info),
      }),
      size: baseWidth,
      minSize: Math.floor(baseWidth * 0.5),
      maxSize: baseWidth * 3,
      // AC-008: enableSorting — 기본 true, 명시적 false만 false
      enableSorting: def.enableSorting !== false,
      enableResizing: def.enableResizing !== false,
      meta: metaValue,
      // EC-05 / OQ-01: visibility: false → 호출 측 initialState.columnVisibility 가이드.
      // ColumnDef 자체에는 visibility 개념 없음 (TanStack 표준).
      // 사용 방법: initialState: { columnVisibility: { [col.id]: false } }
    };

    return columnDef;
  });
}
