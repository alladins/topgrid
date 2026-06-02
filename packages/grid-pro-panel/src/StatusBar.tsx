import type { JSX, ReactNode } from 'react';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';

/**
 * A single segment rendered by {@link StatusBar}.
 *
 * The consumer injects these (e.g. selection counts or aggregate summaries);
 * the bar is purely presentational and is not coupled to any grid state.
 */
export interface StatusBarItem {
  /** Stable React key / identifier for the segment. */
  key: string;
  /** Optional label rendered before the value (e.g. `Selected`). */
  label?: string;
  /** Value rendered for the segment (e.g. a count or formatted summary). */
  value: ReactNode;
}

/**
 * Props for {@link StatusBar}.
 */
export interface StatusBarProps {
  /** Segments to render, left-to-right, as `label: value` pairs. */
  items: StatusBarItem[];
  /** Additional className appended to the root container. */
  className?: string;
}

/**
 * StatusBar — a horizontal bar of `label: value` segments.
 *
 * Pure prop-driven UI: the consumer passes whatever `items` it wants to surface
 * (selection counts, aggregate summaries, etc.). It composites no grid. Without
 * a valid Pro license a watermark is composited over the bar (the root is
 * `relative` so the absolutely positioned `<Watermark>` anchors to it).
 */
export function StatusBar({ items, className }: StatusBarProps): JSX.Element {
  const lic = useLicenseStatus();
  const rootComposed = [
    'relative flex flex-wrap items-center gap-4 px-3 py-1 border-t border-gray-200 bg-gray-50 text-sm text-gray-700',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootComposed}>
      {items.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1">
          {item.label !== undefined && (
            <span className="text-gray-500">{item.label}:</span>
          )}
          <span className="font-medium">{item.value}</span>
        </span>
      ))}
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
