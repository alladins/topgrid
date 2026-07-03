/**
 * @topgrid/grid-pro-serverside-vue — 서버사이드 로우 모델(SSRM) 컴포저블 (Vue 3)
 *
 * React `useServerSideData` 의 Vue 대응. 소비자의 {@link ServerSideDatasource} 를 순수 블록 캐시
 * 컨트롤러({@link createServerSideController})로 연결한다. 데이터 흐름 로직은 전부 node-검증된 코어에
 * 있고, 이 컴포저블은 Vue 반응형 상태만 소유 + 가시 범위/정렬/필터를 컨트롤러에 공급한다.
 * 느린 응답이 최신 쿼리를 덮어쓰는 async race 는 코어의 **epoch 불변식**이 처리한다.
 *
 * @remarks datasource 는 **한 번** 캡처(컨트롤러가 마운트 시 1회 생성). 컴포넌트 밖에 정의할 것.
 * 컨트롤러는 client(onMounted)에서만 생성 → SSR/Nuxt 안전(서버 렌더 단계엔 placeholder 만).
 */
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import type { SortingState, ColumnFiltersState } from '@tanstack/table-core';
import {
  createServerSideController,
  materialize,
  createBlockCache,
  buildServerPivotColumns,
  type ServerSideController,
  type ServerSideDatasource,
  type ServerPivotColumn,
  type RowPlaceholder,
} from '@topgrid/grid-pro-serverside-core';

export interface UseVueServerSideDataOptions {
  /** 블록당 행 수(요청 단위). */
  blockSize: number;
  /** 초기 전체 행 수(응답의 lastRow 로 정제됨). */
  rowCount: number;
  /** 서버사이드 피벗(옵션). 설정 시 요청에 pivotMode/pivotCols/valueCols 를 실어 보낸다. */
  pivot?: { pivotCols: string[]; valueCols: string[]; separator?: string };
}

export interface UseVueServerSideDataResult<TData> {
  /** 반응형 행 데이터 — 미로드 인덱스는 {@link RowPlaceholder}(isRowPlaceholder 로 감지). */
  data: Ref<Array<TData | RowPlaceholder>>;
  /** 반응형 전체 행 수(lastRow 학습에 따라 증가). */
  totalCount: Ref<number>;
  /** 서버 피벗 결과 파생 컬럼(피벗 응답 도착 전/비피벗 시 빈 배열). */
  pivotColumns: Ref<ServerPivotColumn[]>;
  /** 가시 범위 확보(가상화 visible range → 여기로 배선). */
  ensureRange: (firstRow: number, lastRow: number) => void;
  /** 정렬 변경(서버 파라미터 파생). */
  setSorting: (sorting: SortingState) => void;
  /** 필터 변경(서버 파라미터 파생). */
  setColumnFilters: (filters: ColumnFiltersState) => void;
  /** 캐시 무효화(epoch++) + 가시 범위 재요청(in-flight 응답 폐기). */
  refresh: () => void;
}

export function useVueServerSideData<TData>(
  datasource: ServerSideDatasource<TData>,
  options: UseVueServerSideDataOptions,
): UseVueServerSideDataResult<TData> {
  const data = ref(
    materialize(createBlockCache<TData>(options.blockSize), options.rowCount),
  ) as Ref<Array<TData | RowPlaceholder>>;
  const totalCount = ref(options.rowCount);
  const pivotColumns = ref<ServerPivotColumn[]>([]);
  const pivotSeparator = options.pivot?.separator;

  let controller: ServerSideController<TData> | null = null;
  onMounted(() => {
    controller = createServerSideController<TData>(
      datasource,
      {
        blockSize: options.blockSize,
        rowCount: options.rowCount,
        ...(options.pivot !== undefined
          ? { pivot: { pivotCols: options.pivot.pivotCols, valueCols: options.pivot.valueCols } }
          : {}),
      },
      (nextData, nextTotal, pivotResultFields) => {
        data.value = nextData;
        totalCount.value = nextTotal;
        if (pivotResultFields !== undefined) {
          pivotColumns.value = buildServerPivotColumns(pivotResultFields, pivotSeparator);
        }
      },
    );
  });
  onBeforeUnmount(() => {
    // 컨트롤러는 명시적 destroy 가 없고(구독 없음) GC 대상 — 참조만 해제.
    controller = null;
  });

  return {
    data,
    totalCount,
    pivotColumns,
    ensureRange: (firstRow, lastRow) => controller?.ensureRange(firstRow, lastRow),
    setSorting: (sorting) => controller?.setSorting(sorting),
    setColumnFilters: (filters) => controller?.setColumnFilters(filters),
    refresh: () => controller?.refresh(),
  };
}
