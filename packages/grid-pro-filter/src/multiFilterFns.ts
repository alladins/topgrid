/**
 * @topgrid/grid-pro-filter — compound FilterFn 인스턴스 (MOD-GRID-30 G-3).
 *
 * grid-features 의 단일 조건 matcher 를 그대로 base 로 재사용(LESS-005). 컬럼 filterFn 에 등록:
 *   columnDef.filterFn = multiTextFilterFn  (header: <MultiFilter variant="text" />)
 * 컬럼은 단일(`textFilterFn`)·복합(`multiTextFilterFn`) 중 하나만 사용(값 shape 배타적).
 */

import { textFilterFn, numberFilterFn } from '@topgrid/grid-features';
import type { TextFilterValue, NumberFilterValue } from '@topgrid/grid-features';
import { makeMultiFilterFn } from './makeMultiFilterFn.js';

/** 텍스트 복합 필터(contains/equals/startsWith/endsWith 조건 N개 + AND/OR). */
export const multiTextFilterFn = makeMultiFilterFn<TextFilterValue>(textFilterFn);

/** 숫자 복합 필터(=/!=/>/</>=/<= 조건 N개 + AND/OR). */
export const multiNumberFilterFn = makeMultiFilterFn<NumberFilterValue>(numberFilterFn);
