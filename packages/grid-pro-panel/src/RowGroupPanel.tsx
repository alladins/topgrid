import type { JSX } from 'react';
import { GroupPanel } from '@topgrid/grid-pro-agg';
import type { GroupPanelProps } from '@topgrid/grid-pro-agg';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';

/**
 * Props for {@link RowGroupPanel} — identical to the reused agg `GroupPanel`.
 */
export type RowGroupPanelProps<TData extends object> = GroupPanelProps<TData>;

/**
 * RowGroupPanel — the drag-and-drop grouping bar.
 *
 * REUSE: all grouping behaviour (HTML5 drag, chips, remove) is delegated to the
 * agg `GroupPanel`; this wrapper only composites the Pro watermark. The root is
 * `relative` so the absolutely positioned `<Watermark>` anchors to it.
 */
export function RowGroupPanel<TData extends object>(
  props: RowGroupPanelProps<TData>,
): JSX.Element {
  const lic = useLicenseStatus();
  return (
    <div className="relative">
      <GroupPanel {...props} />
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
