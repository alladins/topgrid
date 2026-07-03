/**
 * @topgrid/grid-pro-serverside-vue — 지연 그룹(lazy-group) SSRM 컴포저블 (Vue 3)
 *
 * React `useServerSideTree` 의 Vue 대응. 계층 캐시 컨트롤러({@link createServerSideTreeController})를
 * Vue 반응형에 바인딩한다. 그룹 셀 렌더러에서 `toggleGroup(row.__ssrm.groupKeys)` 로 확장/축소.
 * 플랫 `useVueServerSideData` 와 분리(반환 형태를 과부하하지 않음). 컨트롤러는 client(onMounted)에서만
 * 생성 → Nuxt SSR 안전.
 *
 * @remarks datasource 는 **한 번** 캡처(컨트롤러 마운트 1회 생성). 컴포넌트 밖에 정의할 것.
 */
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import type { SortingState, ColumnFiltersState } from '@tanstack/table-core';
import {
  createServerSideTreeController,
  type ServerSideTreeController,
  type ServerSideDatasource,
  type TreeDisplayRow,
} from '@topgrid/grid-pro-serverside-core';

export interface UseVueServerSideTreeOptions {
  /** 블록당 행 수(노드별 요청 단위). */
  blockSize: number;
  /** 그룹핑 컬럼, 바깥쪽 먼저(예: ['country', 'city']). */
  rowGroupCols: string[];
}

export interface UseVueServerSideTreeResult<TData> {
  /** 반응형 표시 행(그룹/리프, __ssrm 메타 포함). */
  data: Ref<TreeDisplayRow<TData>[]>;
  /** 가시 범위 확보(가상화 visible range → 여기로 배선). */
  ensureRange: (firstRow: number, lastRow: number) => void;
  /** 그룹 확장/축소 — 그룹 셀 렌더러에서 row.__ssrm.groupKeys 로 호출. */
  toggleGroup: (groupKeys: string[]) => void;
  /** 정렬 변경. */
  setSorting: (sorting: SortingState) => void;
  /** 필터 변경. */
  setColumnFilters: (filters: ColumnFiltersState) => void;
  /** 트리 전체 무효화 + 가시 범위 재요청. */
  refresh: () => void;
}

export function useVueServerSideTree<TData>(
  datasource: ServerSideDatasource<TData>,
  options: UseVueServerSideTreeOptions,
): UseVueServerSideTreeResult<TData> {
  const data = ref<TreeDisplayRow<TData>[]>([
    // 초기: 첫 블록 도착 전까지 루트 로딩 placeholder 1개.
    {
      __ssrmPlaceholder: true,
      rowIndex: 0,
      __ssrm: { group: options.rowGroupCols.length > 0, level: 0, groupKeys: [] },
    } as unknown as TreeDisplayRow<TData>,
  ]) as Ref<TreeDisplayRow<TData>[]>;

  let controller: ServerSideTreeController<TData> | null = null;
  onMounted(() => {
    controller = createServerSideTreeController<TData>(
      datasource,
      { blockSize: options.blockSize, rowGroupCols: options.rowGroupCols },
      (nextData) => {
        data.value = nextData;
      },
    );
  });
  onBeforeUnmount(() => {
    controller = null;
  });

  return {
    data,
    ensureRange: (firstRow, lastRow) => controller?.ensureRange(firstRow, lastRow),
    toggleGroup: (groupKeys) => controller?.toggleGroup(groupKeys),
    setSorting: (sorting) => controller?.setSorting(sorting),
    setColumnFilters: (filters) => controller?.setColumnFilters(filters),
    refresh: () => controller?.refresh(),
  };
}
