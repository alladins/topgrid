/**
 * IconCell — Storybook stories (CSF3, placeholder).
 *
 * 시각 회귀 검증 시나리오 (spec AC-007 + EC-12):
 * - icon (ReactNode) — placeholder SVG node
 * - label optional
 * - onClick 유/무 → <button> / <span> (L0 분기 보존)
 * - color customisation (default 'text-gray-500')
 * - D3: lucide-react / react-icons peer 추가 0 — caller-provided ReactNode
 *
 * @see findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md Section 2.5
 * @see Spec MOD-GRID-05/G-002 Section 2.5 + EC-12
 */
import { IconCell } from '../IconCell.js';

const PlaceholderIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="6" />
  </svg>
);

const meta = {
  title: 'Cells/IconCell',
  component: IconCell,
  parameters: { layout: 'centered' },
} as const;

export default meta;

/** Default — icon only, no label, no click. Renders <span>. */
export const IconOnly = {
  args: { icon: PlaceholderIcon },
} as const;

/** With supporting label (no click). */
export const WithLabel = {
  args: { icon: PlaceholderIcon, label: '편집' },
} as const;

/** With onClick — renders <button> (L0 분기). */
export const WithOnClick = {
  args: { icon: PlaceholderIcon, label: '클릭 가능', onClick: () => undefined },
} as const;

/** Custom colour — text-blue-500. */
export const WithColor = {
  args: { icon: PlaceholderIcon, label: '파란', color: 'text-blue-500' },
} as const;

/** null icon (EC-12 — React ignores null child). */
export const NullIcon = {
  args: { icon: null, label: '아이콘 없음' },
} as const;

/** With additional className on outer button. */
export const WithClassName = {
  args: { icon: PlaceholderIcon, onClick: () => undefined, className: 'p-1' },
} as const;
