// packages/grid-pro-datamap/src/DataMap.ts
// C-4: no any, C-29: exactOptionalPropertyTypes=true
import type { CreateDataMapOptions, DataMap, PathOrAccessor } from './types';

function resolveAccessor<TItem, TReturn>(
  path: PathOrAccessor<TItem, TReturn>,
): (item: TItem) => TReturn {
  if (typeof path === 'function') {
    return path;
  }
  return (item: TItem) => item[path] as unknown as TReturn;
}

export function buildDataMap<TItem>(
  options: CreateDataMapOptions<TItem>,
): DataMap<TItem> {
  const { items, valuePath, displayPath } = options;
  const getValueOf = resolveAccessor(valuePath);
  const getDisplayOf = resolveAccessor(displayPath);
  const valueToDisplay = new Map<unknown, string>();
  const displayToValue = new Map<string, unknown>();
  for (const item of items) {
    const v = getValueOf(item);
    const d = getDisplayOf(item);
    valueToDisplay.set(v, d);
    displayToValue.set(d, v);
  }
  return {
    getDisplay(value: unknown): string | undefined {
      return valueToDisplay.get(value);
    },
    getItems(): TItem[] {
      return items.slice();
    },
    getValue(display: string): unknown {
      return displayToValue.get(display);
    },
  };
}
