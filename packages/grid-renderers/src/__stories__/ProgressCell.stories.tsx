/**
 * ProgressCell — Storybook stories (CSF3, placeholder).
 *
 * 시각 회귀 검증 시나리오 (spec AC-006 + EC-10/EC-11):
 * - value 0 / 25 / 50 / 75 / 100
 * - null/undefined/NaN → 0% (EC-10)
 * - 범위 초과 → 클램프 (EC-11)
 * - showLabel false
 * - custom barColorClassName
 *
 * @see findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md Section 2.8
 * @see Spec MOD-GRID-05/G-002 Section 2.8 + EC-10/EC-11
 */
import { ProgressCell } from '../ProgressCell.js';

const meta = {
  title: 'Cells/ProgressCell',
  component: ProgressCell,
  parameters: { layout: 'padded' },
} as const;

export default meta;

/** Default — 50%. */
export const FiftyPercent = {
  args: { value: 50 },
} as const;

/** 0% — empty bar. */
export const Zero = {
  args: { value: 0 },
} as const;

/** 25%. */
export const TwentyFive = {
  args: { value: 25 },
} as const;

/** 100% — full bar. */
export const Hundred = {
  args: { value: 100 },
} as const;

/** null → 0% (EC-10). */
export const NullValue = {
  args: { value: null },
} as const;

/** undefined → 0% (EC-10). */
export const UndefinedValue = {
  args: { value: undefined },
} as const;

/** NaN → 0% (EC-10). */
export const NaNValue = {
  args: { value: Number.NaN },
} as const;

/** Out-of-range over (120 → clamp 100, EC-11). */
export const OverHundred = {
  args: { value: 120 },
} as const;

/** Out-of-range under (-10 → clamp 0, EC-11). */
export const Negative = {
  args: { value: -10 },
} as const;

/** showLabel=false — bar only. */
export const NoLabel = {
  args: { value: 67, showLabel: false },
} as const;

/** Custom bar colour — green. */
export const CustomBarColor = {
  args: { value: 80, barColorClassName: 'bg-green-600' },
} as const;

/** Custom bar colour — red (negative trend). */
export const CustomBarRed = {
  args: { value: 33, barColorClassName: 'bg-red-600' },
} as const;
