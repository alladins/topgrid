/**
 * ButtonCell — Storybook stories (CSF3, placeholder).
 *
 * 시각 회귀 검증 시나리오 (spec AC-003 + EC-05/EC-06):
 * - variant 'default' / 'destructive' / 'ghost' (D2 rename — L0 'primary'/'danger'/'ghost')
 * - disabled=true (EC-06)
 * - size 'sm' / 'xs'
 *
 * @see findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md Section 2.3
 * @see Spec MOD-GRID-05/G-002 Section 2.3 + EC-05/EC-06
 */
import { ButtonCell } from '../ButtonCell.js';

const meta = {
  title: 'Cells/ButtonCell',
  component: ButtonCell,
  parameters: { layout: 'centered' },
} as const;

export default meta;

/** Default — variant='ghost' (L0 default preserved). Uses new `value` prop. */
export const Default = {
  args: { value: '편집', onClick: () => undefined },
} as const;

/** variant='default' — blue (D2: L0 'primary' → 'default'). Uses new `value` prop. */
export const VariantDefault = {
  args: { value: '저장', onClick: () => undefined, variant: 'default' as const },
} as const;

/** variant='destructive' — red (D2: L0 'danger' → 'destructive'). Uses new `value` prop. */
export const VariantDestructive = {
  args: { value: '삭제', onClick: () => undefined, variant: 'destructive' as const },
} as const;

/** variant='ghost' — white outlined. Uses new `value` prop. */
export const VariantGhost = {
  args: { value: '취소', onClick: () => undefined, variant: 'ghost' as const },
} as const;

/** disabled=true (EC-06 — opacity-40 + cursor-not-allowed). Uses new `value` prop. */
export const Disabled = {
  args: { value: '저장', onClick: () => undefined, variant: 'default' as const, disabled: true },
} as const;

/** size='sm' — text-sm. Uses new `value` prop. */
export const SizeSm = {
  args: { value: '큰 버튼', onClick: () => undefined, size: 'sm' as const },
} as const;

/** size='xs' — text-xs (L0 default). Uses new `value` prop. */
export const SizeXs = {
  args: { value: '작은 버튼', onClick: () => undefined, size: 'xs' as const },
} as const;

/** With additional className. Uses new `value` prop. */
export const WithClassName = {
  args: { value: '강조', onClick: () => undefined, variant: 'default' as const, className: 'shadow-sm' },
} as const;

/**
 * Deprecated `label` prop — validates backward-compatibility shim (ADR-014 amendment).
 * @deprecated Remove in next major. Switch to `value`.
 */
export const WithDeprecatedLabel = {
  args: { label: '레거시 버튼', onClick: () => undefined },
} as const;
