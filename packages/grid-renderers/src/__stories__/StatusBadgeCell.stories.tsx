/**
 * StatusBadgeCell — Storybook stories (CSF3, placeholder).
 *
 * Storybook 인프라(@storybook/react)는 MOD-GRID-99-B 에서 도입 예정.
 * 본 파일은 CSF3 컨벤션 (Meta default export + named Story exports) 만 유지하여
 * 인프라 도입 시 무수정 가용. 타입 import 0 — tsc strict 통과 보장.
 *
 * @see findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md Section 2.1
 * @see Spec MOD-GRID-05/G-002 Section 2.1 + EC-01/EC-02
 */
import { StatusBadgeCell } from '../StatusBadgeCell.js';

const meta = {
  title: 'Cells/StatusBadgeCell',
  component: StatusBadgeCell,
  parameters: { layout: 'centered' },
} as const;

export default meta;

/** Default — active (DEFAULT_COLORS lookup). */
export const Active = {
  args: { value: 'active' },
} as const;

/** inactive — gray chip. */
export const Inactive = {
  args: { value: 'inactive' },
} as const;

/** pending — yellow chip. */
export const Pending = {
  args: { value: 'pending' },
} as const;

/** approved — blue chip. */
export const Approved = {
  args: { value: 'approved' },
} as const;

/** rejected — red chip. */
export const Rejected = {
  args: { value: 'rejected' },
} as const;

/** error — red chip. */
export const Error = {
  args: { value: 'error' },
} as const;

/** draft — gray chip. */
export const Draft = {
  args: { value: 'draft' },
} as const;

/** Unknown value — defaultColor fallback (EC-01/EC-02). */
export const UnknownValue = {
  args: { value: 'something-else' },
} as const;

/** Custom colorMap — purple priority chip. */
export const CustomColorMap = {
  args: {
    value: '긴급',
    colorMap: {
      긴급: 'bg-purple-100 text-purple-700',
      보통: 'bg-gray-100 text-gray-600',
    },
  },
} as const;

/** Custom defaultColor — green fallback. */
export const CustomDefaultColor = {
  args: { value: 'unmapped', defaultColor: 'bg-green-50 text-green-700' },
} as const;

/** With additional className composition. */
export const WithClassName = {
  args: { value: 'approved', className: 'shadow-sm' },
} as const;
