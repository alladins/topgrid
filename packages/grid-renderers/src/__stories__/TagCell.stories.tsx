/**
 * TagCell — Storybook stories (CSF3, placeholder).
 *
 * 시각 회귀 검증 시나리오 (spec AC-004 + EC-08):
 * - 단일 / 다수 / 빈 배열 (EC-08 dash)
 * - colorMap customisation
 * - gapClassName variation
 *
 * @see findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md Section 2.6
 * @see Spec MOD-GRID-05/G-002 Section 2.6 + EC-08
 */
import { TagCell } from '../TagCell.js';

const meta = {
  title: 'Cells/TagCell',
  component: TagCell,
  parameters: { layout: 'centered' },
} as const;

export default meta;

/** Default — single tag. */
export const SingleTag = {
  args: { value: ['긴급'] },
} as const;

/** Multiple tags. */
export const MultipleTags = {
  args: { value: ['긴급', '신규', '재무'] },
} as const;

/** Empty array → dash placeholder (EC-08). */
export const EmptyArray = {
  args: { value: [] },
} as const;

/** Custom colorMap — priority-based hues. */
export const WithColorMap = {
  args: {
    value: ['긴급', '보통', '낮음'],
    colorMap: {
      긴급: 'bg-red-100 text-red-700',
      보통: 'bg-yellow-100 text-yellow-700',
      낮음: 'bg-gray-100 text-gray-600',
    },
  },
} as const;

/** Custom gap class. */
export const WithGap = {
  args: { value: ['a', 'b', 'c'], gapClassName: 'gap-2' },
} as const;

/** Many tags — wrap behaviour. */
export const ManyTags = {
  args: { value: ['긴급', '신규', '재무', '회계', '품질', '안전', 'IT', '인사'] },
} as const;

/** With additional className. */
export const WithClassName = {
  args: { value: ['굵게'], className: 'font-bold' },
} as const;
