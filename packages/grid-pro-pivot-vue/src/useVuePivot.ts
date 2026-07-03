/**
 * @topgrid/grid-pro-pivot-vue — headless pivot composable
 *
 * `usePivot`(React `useMemo`)의 Vue 대응. 순수 {@link computePivot} 변환을 `computed` 로
 * 감싼 얇은 래퍼 — 모든 로직은 프레임워크 무관 @topgrid/grid-pro-pivot-core 에 있어
 * 독립적으로 테스트·트리셰이크된다.
 */
import { computed, unref, type ComputedRef, type Ref } from 'vue';
import { computePivot } from '@topgrid/grid-pro-pivot-core';
import type { PivotConfig, PivotModel } from '@topgrid/grid-pro-pivot-core';

/** Ref | 게터 | 원시값 모두 허용 (vue 3.0 호환 — toValue 미사용). */
type MaybeRefOrGetter<T> = T | Ref<T> | (() => T);

function resolve<T>(v: MaybeRefOrGetter<T>): T {
  return typeof v === 'function' ? (v as () => T)() : unref(v as T | Ref<T>);
}

/**
 * flat 데이터 + 피벗 구성에서 반응형 {@link PivotModel} 을 계산한다.
 * `data`·`config` 가 ref/게터면 변경 시 자동 재계산된다.
 *
 * @typeParam TData - 소스 행 형태.
 * @param data - flat 소스 행(Ref·게터·배열).
 * @param config - 행/열 차원 + 값(측정) 정의(Ref·게터·객체).
 * @returns 반응형 피벗 모델(`ComputedRef`).
 *
 * @example
 * const rows = ref(sales);
 * const config = ref({ rows: ['region'], columns: ['quarter'], values: [{ field: 'amt', aggregationFn: 'sum' }] });
 * const model = useVuePivot(rows, config);
 * // template: v-for="row in model.rows"
 */
export function useVuePivot<TData extends Record<string, unknown>>(
  data: MaybeRefOrGetter<TData[]>,
  config: MaybeRefOrGetter<PivotConfig>,
): ComputedRef<PivotModel> {
  return computed(() => computePivot(resolve(data), resolve(config)));
}
