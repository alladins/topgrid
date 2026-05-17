/**
 * CheckCell — Storybook stories (CSF3, placeholder).
 *
 * 시각 회귀 검증 시나리오 (spec AC-007 + EC-07):
 * - checked true/false
 * - readOnly=true (EC-07 — onChange 호출 0, cursor-default)
 *
 * @see findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md Section 2.4
 * @see Spec MOD-GRID-05/G-002 Section 2.4 + EC-07
 */
import { CheckCell } from '../CheckCell.js';

const meta = {
  title: 'Cells/CheckCell',
  component: CheckCell,
  parameters: { layout: 'centered' },
} as const;

export default meta;

/** checked=true. */
export const Checked = {
  args: { checked: true, onChange: () => undefined },
} as const;

/** checked=false. */
export const Unchecked = {
  args: { checked: false, onChange: () => undefined },
} as const;

/** readOnly=true (EC-07 — onChange 미호출, cursor-default). */
export const ReadOnlyChecked = {
  args: { checked: true, readOnly: true },
} as const;

/** readOnly=true & unchecked. */
export const ReadOnlyUnchecked = {
  args: { checked: false, readOnly: true },
} as const;

/** No onChange (typical for read-only-ish usage). */
export const WithoutOnChange = {
  args: { checked: true },
} as const;

/** With additional className. */
export const WithClassName = {
  args: { checked: true, onChange: () => undefined, className: 'ring-2 ring-blue-200' },
} as const;
