/**
 * @topgrid/grid-pro-serverside-vue — 뷰포트(push) 로우 모델 컴포저블 (Vue 3)
 *
 * React `useViewportRowModel` 의 Vue 대응. push 기반 {@link ViewportDatasource} 를 프레임워크 무관
 * {@link createViewportRowModel} 컨트롤러로 연결한다. 컨트롤러는 client 에서만 생성(onMounted →
 * SSR/Nuxt 안전), 가시 범위는 소비자가 `setRange(first,last)`(vue-virtual 등에서 배선)로 공급,
 * datasource 가 push 한 행은 onChange 로 재방출되어 `data` ref 를 갱신한다(in-place 라이브 업데이트).
 *
 * @remarks datasource 는 **한 번** 캡처된다(컨트롤러가 마운트 시 1회 생성). 컴포넌트 밖에 정의하거나
 * 안정 참조로 전달할 것.
 */
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import {
  createViewportRowModel,
  materializeViewport,
  type ViewportDatasource,
  type ViewportRowModel,
  type RowPlaceholder,
} from '@topgrid/grid-pro-serverside-core';

export interface UseVueViewportRowModelOptions {
  /** 초기 전체 행 수(datasource 의 setRowCount 로 정제됨). */
  rowCount: number;
}

export interface UseVueViewportRowModelResult<TData> {
  /** 반응형 행 데이터 — {@link RowPlaceholder} 를 포함할 수 있다(isRowPlaceholder 로 감지). */
  data: Ref<Array<TData | RowPlaceholder>>;
  /** 반응형 전체 행 수(datasource 가 push 하며 증가). */
  totalCount: Ref<number>;
  /** 가시 범위 변경 통지(가상화 라이브러리의 visible range → 여기로 배선). */
  setRange: (firstRow: number, lastRow: number) => void;
}

export function useVueViewportRowModel<TData>(
  datasource: ViewportDatasource<TData>,
  options: UseVueViewportRowModelOptions,
): UseVueViewportRowModelResult<TData> {
  const data = ref(materializeViewport<TData>(new Map(), options.rowCount)) as Ref<
    Array<TData | RowPlaceholder>
  >;
  const totalCount = ref(options.rowCount);

  // 컨트롤러는 client 에서만 생성(SSR 안전) — datasource.init 이 라이브 피드에 구독할 수 있으므로.
  let controller: ViewportRowModel<TData> | null = null;
  onMounted(() => {
    controller = createViewportRowModel<TData>(
      datasource,
      { rowCount: options.rowCount },
      (nextData, nextCount) => {
        data.value = nextData;
        totalCount.value = nextCount;
      },
    );
  });
  onBeforeUnmount(() => controller?.destroy());

  return {
    data,
    totalCount,
    setRange: (firstRow, lastRow) => controller?.setRange(firstRow, lastRow),
  };
}
