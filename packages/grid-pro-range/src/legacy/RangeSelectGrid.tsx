/**
 * @tomis/grid-pro-range — L0 backward-compat alias (AC-010, C-6).
 *
 * L0 API(`data, columns, onRangeChange?, loading?, emptyText?, className?`)를
 * 그대로 수용하여 신규 RangeSelectGrid로 위임.
 *
 * C-29 (exactOptionalPropertyTypes): optional prop을 직접 전달하지 않고
 * spread-skip 패턴으로 전달 (undefined literal 할당 금지).
 *
 * @deprecated 신규 코드는 `RangeSelectGrid`를 직접 사용.
 */
import { RangeSelectGrid } from '../RangeSelectGrid';
import type { RangeSelectGridProps } from '../types';

/**
 * L0 호환 alias — RangeSelectGrid의 default export 래퍼.
 *
 * @deprecated 신규 코드는 named export `RangeSelectGrid` 사용 권장.
 */
export default function LegacyRangeSelectGrid<TData extends object>(
  props: RangeSelectGridProps<TData>,
) {
  // C-29 spread-skip: optional prop의 undefined literal 직접 할당 금지.
  const forwarded: RangeSelectGridProps<TData> = {
    data: props.data,
    columns: props.columns,
  };
  if (props.onRangeChange !== undefined)
    forwarded.onRangeChange = props.onRangeChange;
  if (props.loading !== undefined) forwarded.loading = props.loading;
  if (props.emptyText !== undefined) forwarded.emptyText = props.emptyText;
  if (props.className !== undefined) forwarded.className = props.className;

  return <RangeSelectGrid {...forwarded} />;
}
