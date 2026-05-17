// packages/grid-pro-datamap/src/createDataMap.ts
// C-4: no any, C-29: exactOptionalPropertyTypes=true
// C-31: calls buildDataMap (wiring: createDataMap.ts → DataMap.ts)
import type { CreateDataMapOptions, DataMap } from './types';
import { buildDataMap } from './DataMap';

/**
 * createDataMap<TItem>: DataMap 팩토리 함수.
 * items 배열과 valuePath/displayPath 설정으로 DataMap 인스턴스 생성.
 *
 * @example
 * const map = createDataMap({
 *   items: [{ code: 'A', name: '항목A' }],
 *   valuePath: 'code',
 *   displayPath: 'name',
 * });
 * map.getDisplay('A'); // '항목A'
 * map.getValue('항목A'); // 'A'
 */
export function createDataMap<TItem>(
  options: CreateDataMapOptions<TItem>,
): DataMap<TItem> {
  return buildDataMap(options);
}
