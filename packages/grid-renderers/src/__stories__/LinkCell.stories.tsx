/**
 * LinkCell — Storybook stories (CSF3, placeholder).
 *
 * 시각 회귀 검증 시나리오 (spec AC-002 + EC-03/EC-04):
 * - href only → <a>
 * - onClick only → <button> (L0 보존)
 * - href + onClick → <a onClick> (EC-04)
 * - 둘 다 없음 → <span> (EC-03)
 *
 * @see findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md Section 2.2
 * @see Spec MOD-GRID-05/G-002 Section 2.2 + EC-03/EC-04
 */
import { LinkCell } from '../LinkCell.js';

const meta = {
  title: 'Cells/LinkCell',
  component: LinkCell,
  parameters: { layout: 'centered' },
} as const;

export default meta;

/** Default — onClick only (L0 behaviour). Uses new `value` prop. */
export const WithOnClick = {
  args: { value: '상세 보기', onClick: () => undefined },
} as const;

/** href only — renders <a href>. Uses new `value` prop. */
export const WithHref = {
  args: { value: '바로 가기', href: '/detail/123' },
} as const;

/** href + onClick — both supplied (EC-04). Uses new `value` prop. */
export const WithHrefAndOnClick = {
  args: { value: '추적 링크', href: '/detail/123', onClick: () => undefined },
} as const;

/** Neither href nor onClick — plain text span (EC-03). Uses new `value` prop. */
export const TextOnly = {
  args: { value: '읽기 전용 라벨' },
} as const;

/** With additional className. Uses new `value` prop. */
export const WithClassName = {
  args: { value: '굵은 링크', onClick: () => undefined, className: 'font-bold' },
} as const;

/**
 * Deprecated `label` prop — validates backward-compatibility shim (ADR-014 amendment).
 * @deprecated Remove in next major. Switch to `value`.
 */
export const WithDeprecatedLabel = {
  args: { label: '레거시 라벨', onClick: () => undefined },
} as const;
