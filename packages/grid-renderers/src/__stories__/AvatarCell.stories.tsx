/**
 * AvatarCell — Storybook stories (CSF3, placeholder).
 *
 * 시각 회귀 검증 시나리오 (spec AC-005 + EC-09):
 * - src 이미지 있음
 * - src 없음 → 이니셜 fallback
 * - src 깨짐 → onError 이후 이니셜 fallback (EC-09)
 * - 한글 이름 (홍길동) / 영문 이름 (John Doe) / 빈 이름 ('?')
 * - sizeClassName customisation
 *
 * @see findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md Section 2.7
 * @see Spec MOD-GRID-05/G-002 Section 2.7 + EC-09
 */
import { AvatarCell } from '../AvatarCell.js';

const meta = {
  title: 'Cells/AvatarCell',
  component: AvatarCell,
  parameters: { layout: 'centered' },
} as const;

export default meta;

/** Default — image present. */
export const WithImage = {
  args: { name: '홍길동', src: 'https://i.pravatar.cc/56' },
} as const;

/** No image — initials fallback. */
export const InitialsOnly = {
  args: { name: '홍길동' },
} as const;

/** English name — first letters of first two tokens uppercased. */
export const EnglishName = {
  args: { name: 'John Doe' },
} as const;

/** Single English token — first two letters. */
export const SingleToken = {
  args: { name: 'Madonna' },
} as const;

/** Empty name → '?' fallback (EC-09 변형). */
export const EmptyName = {
  args: { name: '' },
} as const;

/** Broken src — onError triggers initials fallback (EC-09). */
export const BrokenSrc = {
  args: { name: '홍길동', src: 'https://example.com/nonexistent.png' },
} as const;

/** Larger size (w-10 h-10). */
export const LargerSize = {
  args: { name: '김길수', sizeClassName: 'w-10 h-10' },
} as const;

/** With additional className. */
export const WithClassName = {
  args: { name: '이수민', className: 'ring-2 ring-blue-200 rounded-full' },
} as const;
